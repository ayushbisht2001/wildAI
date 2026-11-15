# Set up WILD-AI on Windows or Linux

This repository contains the React Native Android app, its optional online
service, tests, and project documents. The experimental plant model and built
APKs are generated files and are not stored in Git. A clean checkout runs the
chat, offline knowledge pack, camera attachment, and feedback; photo
identification is unavailable until reviewed model assets are installed.

## Requirements

- Git, Node.js **22.11 or newer**, and npm (included with Node.js).
- Android Studio with Android SDK Platform **37**, Android SDK Build-Tools
  **37.0.0**, Android SDK Platform-Tools, and NDK **27.1.12297006**.
- JDK **17**. Android Studio's bundled JDK can be used; set `JAVA_HOME` to it
  if your shell does not already use JDK 17.
- An Android device with USB debugging enabled, or an Android emulator. The
  app's minimum Android API level is **24**.

Install SDK packages with Android Studio's **SDK Manager**. Its SDK location is
shown under **Settings > Languages & Frameworks > Android SDK**. Accept SDK
licenses in the manager. The first Gradle build downloads the Gradle wrapper
and Android dependencies, so internet access is needed once.

## Windows (PowerShell)

```powershell
git clone https://github.com/ayushbisht2001/wildAI.git
cd wildAI
npm ci

# Replace this path if Android Studio shows a different SDK location.
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path = "$env:ANDROID_HOME\platform-tools;$env:Path"
adb devices
```

If `java -version` does not show JDK 17, set `JAVA_HOME` to your JDK 17
installation and prepend its `bin` directory to `Path` in the same PowerShell
session. Keep this terminal open, then start Metro:

```powershell
npm start
```

Open a **second PowerShell terminal** in `wildAI`, set `ANDROID_HOME` and
`Path` as above, then install the development app:

```powershell
npm run android
```

The development app uses Metro for its JavaScript bundle. Keep Metro running
while using this build. For a standalone pilot APK that includes the bundle:

```powershell
cd android
.\gradlew.bat :app:assemblePilot -PreactNativeArchitectures=arm64-v8a
```

The APK is `android\app\build\outputs\apk\pilot\app-pilot.apk`. Install it
with `adb install -r android\app\build\outputs\apk\pilot\app-pilot.apk`
from the repository root. It uses a debug signing key and is for local testing,
not Google Play distribution.

## Linux (Bash)

```bash
git clone https://github.com/ayushbisht2001/wildAI.git
cd wildAI
npm ci

# Replace this path if Android Studio shows a different SDK location.
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$PATH"
adb devices
```

If `java -version` does not show JDK 17, set `JAVA_HOME` to your JDK 17
installation and prepend `$JAVA_HOME/bin` to `PATH`. Start Metro in this
terminal:

```bash
npm start
```

Open a **second terminal** in `wildAI`, set `ANDROID_HOME` and `PATH` as above,
then run:

```bash
npm run android
```

For a standalone pilot APK:

```bash
cd android
./gradlew :app:assemblePilot -PreactNativeArchitectures=arm64-v8a
```

The APK is `android/app/build/outputs/apk/pilot/app-pilot.apk`. Install it
with `adb install -r android/app/build/outputs/apk/pilot/app-pilot.apk` from
the repository root. This build is debug-signed and is not for Google Play.

## Run checks (either system)

From the repository root:

```bash
npm test -- --runInBand
npm run lint
npx tsc --noEmit
npm run test:server
```

## Optional pilot features

Photo identification requires the separately reviewed model files in
`android/app/src/debug/assets/`: `plant_labels.json`, `plant_encoder.onnx`,
`plant_classifier.onnx`, and `reference_embeddings.f32`. They are intentionally
ignored by Git because they are large experimental artifacts. The pilot build
can be built without them, but it will report that photo identification is
unavailable. See [training/DATASET.md](training/DATASET.md) and
[training/MODEL_EXPERIMENT_2026-10-25.md](training/MODEL_EXPERIMENT_2026-10-25.md)
for the dataset and candidate-model context. Do not use an unvalidated model
to decide whether a plant is safe to eat.

The online answer service is also optional. The app works with its curated
offline content without it. To enable the service, follow the
[pilot online model service instructions](README.md#pilot-online-model-service).
Keep `NVIDIA_API_KEY` on the server; never put it in the Android app or Git.

## Common setup problems

- **`adb devices` shows no device:** unlock the phone, enable USB debugging,
  accept its authorization prompt, and use a data-capable USB cable.
- **`ANDROID_HOME` or SDK error:** use the exact SDK location shown in Android
  Studio, then reopen the terminal or export the variable again.
- **`JAVA_HOME` error:** point `JAVA_HOME` to JDK 17, not its `bin` directory.
- **App asks for Metro:** start `npm start` for a development build, or install
  the standalone pilot APK above.
