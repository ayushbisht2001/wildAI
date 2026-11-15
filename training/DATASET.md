# Plant model training data

Training runs in the user's Google Colab runtime. The Android app performs
inference only. No model is shipped in a release build until independent field
validation passes. The [Colab experiments](MODEL_EXPERIMENT_2026-10-25.md)
did not pass this gate; the stronger research candidate is staged only for
pilot and debug builds.

Create a ZIP named `wildai_dataset.zip` with `manifest.csv` at its root and
images at the relative paths named in the manifest. One row represents one
photo. Required columns:

| Column | Meaning |
| --- | --- |
| `path` | Relative image path inside the ZIP, e.g. `images/a/001.jpg` |
| `label` | Scientific species name, or `__unknown__` for out-of-scope plants |
| `observation_id` | Same value for photos of the same individual/observation |
| `split` | `train`, `val`, or `test` |
| `source_url` | Original observation or image record |
| `license` | License covering this image and training use |
| `region` | Verified geographic origin; use a specific district where known |

The notebook requires 20–30 known species, each represented in all three
splits, and unknown examples in validation and test. Keep all photos from one
observation in one split. Hold out routes, photographers, dates, and devices
where possible; assess those shifts separately before field use. Do not place
near-duplicate images across splits. Record a botanist's label review and the
dangerous look-alikes in the curation log before training.

## Candidate photo review

`python3 training/collect_review_photos.py` collects a **candidate** set under
`training/output/review_YYYY-MM-DD/`. It queries Uttarakhand observations
first, then India, then worldwide. The `scope` field records the query, not a
verified origin. Each species gets an image contact sheet and
each photo gets a row in `review.csv` with its observation link, photo URL,
license, attribution, date, and stated place. Only photo-level `cc0` and
`cc-by` licenses are accepted; the source is [iNaturalist](https://www.inaturalist.org/pages/api+recommended+practices).
The collector limits API requests to about one per second. These photos are
unreviewed candidates and are **not** the training ZIP.

The owner visually approved all 475 photos in the main `review_2026-10-25` gallery; their `decision` fields are recorded as `accept`. This records the owner's gallery review, not independent confirmation of taxonomy or geography. The separate unknown gallery and later Colab training additions remain unreviewed.

The `source_taxon` column makes two taxonomy mappings explicit: [*Acacia
catechu* was queried as *Senegalia catechu*](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:469951-1)
and [*Myrica esculenta* as *Morella esculenta*](https://www.inaturalist.org/taxa/551083-Morella-rubra/taxonomy_details).
Review these proposed equivalences before accepting their photos;
the collector never silently changes the proposed model label.

To review, open `contact_sheets/`, locate a photo by its `photo_id`, and inspect
its observation link in `review.csv`, or browse `index.html`. In the `decision`
column enter `accept`, `reject`, or `unsure`; enter the corrected scientific name in `reviewed_label`
when needed, and explain concerns in `review_notes`. Check the plant shown,
look-alikes, image quality, license, and stated location. Keep the CSV and
images together. Do not train on rows marked `unsure` or left blank.

`python3 training/collect_review_photos.py --species-file training/UNKNOWN_CANDIDATES.txt --limit 6 --output training/output/unknown_review_YYYY-MM-DD`
collects a separate provisional out-of-scope set. The scientific names in its
review CSV are for checking source identifications; accepted photos would be
mapped to `__unknown__` only when making validation and test splits. These
species and images also need review.

The notebook trains MobileNetV2 on known species, chooses an abstention
threshold using validation unknowns, evaluates a held-out test set, and exports
`plant_model.tflite`, `labels.json`, and `evaluation.json` as candidate files.
It does not copy these files into the Android app. A good aggregate score does
not establish that a species is safe to eat or handle. Expert review, per-class
error analysis, open-set testing, and on-device measurements are release gates.

Use [TensorFlow's transfer-learning guide](https://www.tensorflow.org/tutorials/images/transfer_learning)
and [LiteRT conversion reference](https://ai.google.dev/edge/api/tflite/python/tf/lite/TFLiteConverter)
for the underlying model and export APIs.
