package ai.wild.fieldassistant

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.media.ExifInterface
import android.net.Uri
import ai.onnxruntime.OnnxTensor
import ai.onnxruntime.OrtEnvironment
import ai.onnxruntime.OrtSession
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.json.JSONObject
import org.tensorflow.lite.Interpreter
import java.io.File
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.UUID
import java.util.concurrent.Executors

class PlantClassifierModule(private val context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context) {
  private val worker = Executors.newSingleThreadExecutor()
  private var encoderSession: OrtSession? = null
  private var classifierSession: OrtSession? = null
  private var references: FloatArray? = null
  private val onnxPreprocess = "RGB resize to 224x224 bilinear, pixel values 0..1 then normalize with mean=[0.5,0.5,0.5] and std=[0.5,0.5,0.5]; NCHW float32"

  private fun modelAllowed(metadata: JSONObject) =
    metadata.optString("status") == "pilot_approved" ||
      ((BuildConfig.DEBUG || BuildConfig.BUILD_TYPE == "pilot") && metadata.optString("status") == "candidate_only")

  override fun getName() = "PlantClassifier"

  @ReactMethod
  fun persistPhoto(uri: String, promise: Promise) {
    worker.execute {
      val directory = File(context.filesDir, "chat-photos")
      var target: File? = null
      try {
        val source = Uri.parse(uri)
        val extension = when (context.contentResolver.getType(source)) {
          "image/png" -> "png"
          "image/webp" -> "webp"
          "image/heic", "image/heif" -> "heic"
          else -> "jpg"
        }
        require(directory.isDirectory || directory.mkdirs()) { "Cannot save photo" }
        val file = File(directory, "${UUID.randomUUID()}.$extension")
        target = file
        context.contentResolver.openInputStream(source).use { input ->
          requireNotNull(input) { "Cannot read photo" }
          file.outputStream().use { output ->
            val buffer = ByteArray(8192)
            var total = 0L
            while (true) {
              val read = input.read(buffer)
              if (read < 0) break
              total += read
              require(total <= 20L * 1024 * 1024) { "Photo is too large" }
              output.write(buffer, 0, read)
            }
          }
        }
        promise.resolve(Uri.fromFile(file).toString())
      } catch (error: Exception) {
        target?.delete()
        promise.reject("PHOTO_SAVE_FAILED", error.message ?: "Cannot save photo", error)
      }
    }
  }

  @ReactMethod
  fun isAvailable(promise: Promise) {
    try {
      val metadata = JSONObject(context.assets.open("plant_labels.json").bufferedReader().use { it.readText() })
      val allowed = modelAllowed(metadata)
      val assets = context.assets.list("")?.toSet().orEmpty()
      val modelPresent = if (metadata.has("top5_similarity_abstain_below")) {
        assets.containsAll(setOf("plant_encoder.onnx", "plant_classifier.onnx", "reference_embeddings.f32"))
      } else assets.contains("plant_model.tflite")
      promise.resolve(allowed && modelPresent &&
        (!metadata.has("top5_similarity_abstain_below") || metadata.optString("preprocess") == onnxPreprocess))
    } catch (_: Exception) {
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun classify(uri: String, promise: Promise) {
    worker.execute {
      try {
        val metadata = JSONObject(context.assets.open("plant_labels.json").bufferedReader().use { it.readText() })
        val allowed = modelAllowed(metadata)
        require(allowed) { "No approved plant model is installed" }
        val result = if (metadata.has("top5_similarity_abstain_below")) {
          classifyOnnx(Uri.parse(uri), metadata)
        } else {
          classifyTflite(Uri.parse(uri), metadata)
        }
        promise.resolve(result)
      } catch (error: Exception) {
        promise.reject("PLANT_CLASSIFIER_FAILED", error.message ?: "Plant identification failed", error)
      }
    }
  }

  private fun classifyTflite(uri: Uri, metadata: JSONObject): com.facebook.react.bridge.WritableMap {
        val labels = metadata.getJSONArray("labels")
        val size = metadata.getJSONArray("image_size").getInt(0)
        require(size == 224 && metadata.getJSONArray("image_size").getInt(1) == 224)
        val threshold = metadata.getDouble("abstain_below")
        require(threshold in 0.0..1.0)
        val image = readPhoto(uri)
        val resized = Bitmap.createScaledBitmap(image, size, size, true)
        if (resized !== image) image.recycle()
        val pixels = IntArray(size * size)
        resized.getPixels(pixels, 0, size, 0, 0, size, size)
        resized.recycle()
        val input = ByteBuffer.allocateDirect(size * size * 3 * 4).order(ByteOrder.nativeOrder())
        for (pixel in pixels) {
          input.putFloat(((pixel shr 16) and 255).toFloat())
          input.putFloat(((pixel shr 8) and 255).toFloat())
          input.putFloat((pixel and 255).toFloat())
        }
        input.rewind()
        val modelBytes = context.assets.open("plant_model.tflite").use { it.readBytes() }
        val model = ByteBuffer.allocateDirect(modelBytes.size).order(ByteOrder.nativeOrder())
        model.put(modelBytes).rewind()
        val scores = Array(1) { FloatArray(labels.length()) }
        Interpreter(model).use { interpreter ->
          require(interpreter.getInputTensor(0).shape().contentEquals(intArrayOf(1, size, size, 3)))
          require(interpreter.getOutputTensor(0).shape().contentEquals(intArrayOf(1, labels.length())))
          interpreter.run(input, scores)
        }
        val best = scores[0].indices.maxBy { scores[0][it] }
        val score = scores[0][best]
        val result = Arguments.createMap()
        result.putString("label", if (score >= threshold) labels.getString(best) else null)
        result.putDouble("confidence", score.toDouble())
        result.putInt("supportedSpecies", labels.length())
        return result
  }

  private fun classifyOnnx(uri: Uri, metadata: JSONObject): com.facebook.react.bridge.WritableMap {
    require(metadata.optString("preprocess") == onnxPreprocess) { "Unsupported plant model preprocessing" }
    val size = metadata.getJSONArray("image_size").getInt(0)
    require(size == 224 && metadata.getJSONArray("image_size").getInt(1) == size)
    val labels = metadata.getJSONArray("labels")
    val dimension = metadata.getInt("embedding_size")
    val count = metadata.getInt("reference_count")
    val cutoff = metadata.getDouble("top5_similarity_abstain_below")
    require(dimension > 0 && count >= 5 && count.toLong() * dimension <= Int.MAX_VALUE && cutoff in -1.0..1.0)
    val env = OrtEnvironment.getEnvironment()
    if (encoderSession == null) {
      val modelFile = File(context.cacheDir, "wildai_plant_encoder.onnx")
      context.assets.open("plant_encoder.onnx").use { source ->
        modelFile.outputStream().use { source.copyTo(it) }
      }
      val bytes = context.assets.open("reference_embeddings.f32").use { it.readBytes() }
      require(bytes.size.toLong() == count.toLong() * dimension * 4L) { "Invalid reference embeddings" }
      val loadedReferences = FloatArray(count * dimension).also {
        ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN).asFloatBuffer().get(it)
      }
      val loadedEncoder = env.createSession(modelFile.absolutePath)
      try {
        classifierSession = env.createSession(context.assets.open("plant_classifier.onnx").use { it.readBytes() })
        references = loadedReferences
        encoderSession = loadedEncoder
      } catch (error: Exception) {
        loadedEncoder.close()
        throw error
      }
    }
    val image = readPhoto(uri)
    val resized = Bitmap.createScaledBitmap(image, size, size, true)
    if (resized !== image) image.recycle()
    val pixels = IntArray(size * size)
    resized.getPixels(pixels, 0, size, 0, 0, size, size)
    resized.recycle()
    val input = ByteBuffer.allocateDirect(size * size * 3 * 4).order(ByteOrder.nativeOrder()).asFloatBuffer()
    for (channel in 0..2) for (pixel in pixels) {
      val value = when (channel) {
        0 -> (pixel shr 16) and 255
        1 -> (pixel shr 8) and 255
        else -> pixel and 255
      }
      input.put(value / 127.5f - 1f)
    }
    input.rewind()
    val embedding = OnnxTensor.createTensor(env, input, longArrayOf(1, 3, size.toLong(), size.toLong())).use { tensor ->
      encoderSession!!.run(mapOf("pixel_values" to tensor)).use { output ->
        FloatArray(dimension).also { (output[0] as OnnxTensor).floatBuffer.get(it) }
      }
    }
    val label = OnnxTensor.createTensor(env, embedding.asFloatBuffer(), longArrayOf(1, dimension.toLong())).use { tensor ->
      classifierSession!!.run(mapOf("X" to tensor)).use { output ->
        (output[0] as OnnxTensor).longBuffer.get().toInt()
      }
    }
    require(label in 0 until labels.length()) { "Invalid classifier label" }
    val refs = requireNotNull(references)
    val top = FloatArray(5) { Float.NEGATIVE_INFINITY }
    for (row in 0 until count) {
      var similarity = 0f
      val offset = row * dimension
      for (column in 0 until dimension) similarity += embedding[column] * refs[offset + column]
      var minimum = 0
      for (i in 1 until top.size) if (top[i] < top[minimum]) minimum = i
      if (similarity > top[minimum]) top[minimum] = similarity
    }
    val score = top.average()
    val result = Arguments.createMap()
    result.putString("label", if (score >= cutoff) labels.getString(label) else null)
    result.putDouble("confidence", score)
    result.putInt("supportedSpecies", labels.length())
    return result
  }

  private fun FloatArray.asFloatBuffer() =
    ByteBuffer.allocateDirect(size * 4).order(ByteOrder.nativeOrder()).asFloatBuffer().also {
      it.put(this).rewind()
    }

  private fun readPhoto(uri: Uri): Bitmap {
    val resolver = context.contentResolver
    val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    resolver.openInputStream(uri).use { stream ->
      requireNotNull(stream) { "Photo could not be opened" }
      BitmapFactory.decodeStream(stream, null, options)
    }
    require(options.outWidth > 0 && options.outHeight > 0) { "Photo format is unsupported" }
    options.inJustDecodeBounds = false
    options.inSampleSize = maxOf(1, minOf(options.outWidth, options.outHeight) / 448)
    val bitmap = resolver.openInputStream(uri).use { stream ->
      requireNotNull(stream) { "Photo could not be opened" }
      BitmapFactory.decodeStream(stream, null, options)
    } ?: error("Photo could not be decoded")
    val orientation = resolver.openInputStream(uri).use { stream ->
      requireNotNull(stream) { "Photo could not be opened" }
      ExifInterface(stream).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
    }
    val degrees = when (orientation) {
      ExifInterface.ORIENTATION_ROTATE_90 -> 90f
      ExifInterface.ORIENTATION_ROTATE_180 -> 180f
      ExifInterface.ORIENTATION_ROTATE_270 -> 270f
      else -> 0f
    }
    if (degrees == 0f) return bitmap
    val rotated = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, Matrix().apply { postRotate(degrees) }, true)
    bitmap.recycle()
    return rotated
  }
}
