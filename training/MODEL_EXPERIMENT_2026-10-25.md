# Photo identification experiment — 25 October 2026

The [Colab notebook](https://colab.research.google.com/drive/1oElYufGl_-R4ycY567aQxppKYryH75VD) contains the GPU runs and downloadable `wildai_candidates.zip`, `wildai_compact_candidate.zip`, and `wildai_strong_candidate.zip` in its runtime. All exported models are **research candidates**. The stronger archive is also at `training/output/wildai_strong_candidate.zip`; its four runtime files are staged in ignored `android/app/src/debug/assets/` for debug builds only. Colab session storage is temporary.

The owner visually approved the original 475-photo review gallery; this was recorded in its `review.csv` after the experiment. The run used 349 of those known-species candidate photos and 60 out-of-scope photos, then fetched 1,031 more CC0/CC BY photos from iNaturalist for training. The out-of-scope and additional training photos have not been individually approved by the owner. Geographic origin and taxonomy remain unverified. The train, validation, and test split used one photo per original observation but did not independently hold out photographers, routes, devices, or dates. Do not treat these metrics as field validation.

| Model | Known test photos | Known correctly identified | Out-of-scope test photos | Incorrectly accepted as known |
| --- | ---: | ---: | ---: | ---: |
| 12 species | 60 | 25% | 30 | 10% |
| 4 species | 20 | 35% | 70 | 4.3% |

Both models were exported as float16-weight TFLite with float32 RGB inputs (224 × 224, pixel values 0–255). One held-out image's TFLite output was checked against Keras output for each model; maximum absolute differences were 0.0092 and 0.0009 respectively.

## Plant-pretrained experiments

The same 12-species split was tested with two plant-pretrained image encoders. A radial-basis SVM assigns a species from each image embedding; a separate gate abstains when the mean cosine similarity to the five closest training embeddings is below a cutoff. The cutoff was selected from 30 validation images of out-of-scope plants. This gate can still accept unseen species; its small test set does not establish a field false-accept rate.

| Encoder and classifier | Correctly accepted known photos | Out-of-scope photos accepted as known | Export |
| --- | ---: | ---: | --- |
| [OpenPlants ViT](https://huggingface.co/domai-tb/OpenPlants-Identification-ViT-Base-Patch16-224) + SVM | 46/60 (76.7%) | 1/30 (3.3%) | Quantized ONNX candidate below |
| [PlantNet MobileNetV3 Small](https://huggingface.co/cpoisson/plantnet300k-mobilenetv3-small) + SVM | 37/60 (61.7%) | 0/30 | `wildai_compact_candidate.zip`, 8.84 MB |

I also tested the [PlantNet ResNet18](https://huggingface.co/cpoisson/plantnet300k-resnet18) encoder on the same split. Its better validation setting correctly accepted 36/60 known test photos and falsely accepted 2/30 out-of-scope photos, so it was not exported as the preferred candidate.
Horizontal-flip averaging did not improve the compact encoder: it still correctly accepted 37/60 known test photos.

The stronger ViT encoder was exported with dynamic 8-bit quantization of its matrix weights. Its ONNX encoder is 88.8 MB; `wildai_strong_candidate.zip` is 68,949,960 bytes (SHA-256 `454883a2bb3c26284790b1a537348fe8477e5199527213585583a9793397c7fc`). The archive also contains the ONNX SVM, 1,260 reference embeddings, metadata, and evaluation JSON. The quantized ONNX pipeline, evaluated on the same held-out set, correctly accepted **45/60** known photos and falsely accepted **1/30** out-of-scope photos. This is a research candidate; its size and runtime still need measurement on the target phone.

The compact archive contains an ONNX image encoder, ONNX SVM classifier, 1,260 reference embeddings, label metadata, and evaluation JSON. It is 8,842,847 bytes (SHA-256 `cc5324ad78182edb9e5db49d3d7d14c4bb3e47b4113b0ef7698eb9409583a221`). Its encoder output matched the PyTorch implementation within 3.3e-7 on one test tensor; the ONNX SVM matched scikit-learn labels on the held-out set. The model is licensed under the source model's OpenRAIL terms, which must be checked before distribution. An 18-epoch fine-tune of the compact encoder reached 80% validation classification accuracy, but only 45% of known test photos were correctly accepted after the novelty gate, so the pretrained encoder was retained.

This compact candidate supports **12 species**, not the planned 20–30. The original 475-photo gallery had owner visual approval, but the additional 1,031 training photos and unknown photos have not been individually reviewed. The split avoids putting photos from the same observation on both sides, but may still share photographers, locations, dates, or near-duplicates. There is no independent Uttarakhand field set. The 37/60 accepted-correct result and 0/30 unknown false accepts are research measurements only, and are not adequate grounds for field safety claims or release.

Class results expose a major weakness: *Aegle marmelos* had 0/5 correct, 3/5 wrong accepted, and 2/5 abstained; *Cedrus deodara* had 1/5 correct. More photos and independent review are needed for these classes. A stricter SVM probability gate, chosen only on the validation set, reduced test-set wrong known-species accepts to 1/60 and kept unknown accepts at 0/30, but correctly accepted only 23/60 known photos. That setting was measured for analysis and is not in the exported archive.

## Regional open-set stress test

After the exports, I collected 60 additional iNaturalist photos from 12 Uttarakhand-associated taxa and a separate set of 100 photos from 20 other taxa. One of the first 12, *Morella esculenta*, is planned for the broader 25-species scope, so the first set's outside-scope count excludes its five photos. These images have public CC0/CC BY photo licenses but have not received independent taxonomy, location, or photo review. Their species were disjoint from the 12-class model, and the 20-taxon set was not used to train or select the exported models.

| Gate | Original known test correct | Original unknown test accepted | First extra set accepted | New 20-taxon set accepted |
| --- | ---: | ---: | ---: | ---: |
| Quantized ViT + SVM, exported gate | 45/60 | 1/30 | 10/55 | 25/100 |
| Compact encoder + SVM, exported gate | 37/60 | 0/30 | 5/55 | 11/100 |
| ViT + compact agreement, validation-selected probability gate | 31/60 | 0/30 | 1/55 | 5/100 |
| Compact encoder, stricter probability gate | 23/60 | 0/30 | 0/55 | 4/100 |

The agreement and stricter gates were exploratory Colab evaluations; neither is in an export. Training an explicit `unknown` SVM class on 55 of the first extra photos did not improve rejection on the disjoint 100-photo set (25/100 ViT, 11/100 compact). Look-alikes including *Aesculus indica*, *Rubus niveus*, and *Cupressus torulosa* remain difficult. The original 30-photo unknown test substantially understated this risk. **None of these models meets the field-release gate.**

The Android native classifier supports the older TFLite format and the stronger ONNX candidate's preprocessing, classifier, and reference embeddings. It rejects the compact ONNX archive because its preprocessing differs. A `candidate_only` model may run in debug or standalone pilot builds; release builds require `status: "pilot_approved"`. The stronger ONNX files are staged in ignored debug assets. Both `:app:assembleDebug` and `:app:assemblePilot` passed using the project-local Android SDK. The standalone arm64 pilot APK contains a JavaScript bundle and byte-identical model assets, so it does not need Metro. It was installed on a Samsung SM-S911B and relaunched successfully with Metro stopped and no ADB reverse; no startup error appeared in logcat. On-device inference, latency, and memory still need measurement. A release needs individual source review, more Uttarakhand field photos, expert taxonomy review, and a new evaluation on independent field photos. Do not use photo suggestions to judge edibility, toxicity, or treatment.
