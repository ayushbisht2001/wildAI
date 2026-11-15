# Candidate photo review set — 25 October 2026

The local review set is in `training/output/review_2026-10-25/` (known species)
and `training/output/unknown_review_2026-10-25/` (out-of-scope plants). Open
`index.html` in either folder for a gallery, or use `contact_sheets/` and
`review.csv`. Every CSV row has an original observation link, photo URL,
photo-level license, attribution, stated place, and review decision fields.
Both folders and these instructions are packaged in
`training/wildai_photo_review_2026-10-25.zip` for offline review.
The collector uses [iNaturalist's API](https://www.inaturalist.org/pages/api+recommended+practices)
and includes only photos marked CC0 or CC BY. These are **unreviewed source
labels**, not a validated training dataset.

The project owner reviewed the main gallery on 25 October 2026 and reported
that the images visually look correct. All 475 main-gallery CSV decisions are
recorded as `accept`. This is a visual screening decision, not independent
taxonomy, geographic-origin, or license verification. The 60 out-of-scope
photos and 1,031 supplemental training photos remain unreviewed.

## Known species

475 images across 25 proposed labels; 83 came from Uttarakhand-filtered queries,
182 from India-filtered queries, and 210 from worldwide queries. `scope` is the
query used, not a verified origin. One exact duplicate image was removed. The
two source-name mappings are in `source_taxon` and described in `DATASET.md`.

| Proposed label | Photos | Proposed label | Photos |
| --- | ---: | --- | ---: |
| *Shorea robusta* | 10 | *Acacia catechu* | 6 |
| *Dalbergia sissoo* | 30 | *Bombax ceiba* | 30 |
| *Aegle marmelos* | 30 | *Cassia fistula* | 29 |
| *Syzygium cumini* | 30 | *Terminalia chebula* | 10 |
| *Terminalia bellirica* | 29 | *Pinus roxburghii* | 15 |
| *Quercus leucotrichophora* | 11 | *Rhododendron arboreum* | 30 |
| *Myrica esculenta* | 15 | *Prunus cerasoides* | 3 |
| *Alnus nepalensis* | 17 | *Rubus ellipticus* | 30 |
| *Toona ciliata* | 30 | *Cedrus deodara* | 30 |
| *Pinus wallichiana* | 21 | *Picea smithiana* | 6 |
| *Abies pindrow* | 4 | *Betula utilis* | 11 |
| *Juglans regia* | 30 | *Quercus semecarpifolia* | 17 |
| *Cinnamomum tamala* | 1 | | |

Thirteen classes have fewer than 20 candidate images. The 30-image cap is for
a manageable first review batch, not an adequacy threshold for field use.

## Out-of-scope plants

60 images: six each for *Lantana camara*, *Datura stramonium*, *Ricinus
communis*, *Ageratina adenophora*, *Parthenium hysterophorus*, *Urtica dioica*,
*Argemone mexicana*, *Solanum nigrum*, *Oxalis corniculata*, and *Bidens pilosa*.
Thirty-four came from Uttarakhand-filtered queries. All source species names
remain visible for review; accepted rows may later be mapped to `__unknown__`
for validation and testing.

## Review and release gate

In each `review.csv`, enter `accept`, `reject`, or `unsure` in `decision` and add
corrections or concerns in `reviewed_label` and `review_notes`. Inspect source
links for taxonomy, location, licensing, and look-alikes. The 475 main-gallery
rows have owner visual approval, but the remaining source and field checks are
still needed. The Colab research models are documented in
`MODEL_EXPERIMENT_2026-10-25.md`. Hold out independent Uttarakhand field photos
before considering a model for the Android app. Expert and field validation
remain release gates.
