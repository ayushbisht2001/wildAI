# Provisional Uttarakhand plant roster

These 25 species are **candidates for the 20–30-class pilot model**, not
approved labels. They represent forest zones across Uttarakhand; no species is
assumed to occur throughout the state. A botanist must confirm current names,
local occurrence, look-alikes, and whether each class has enough licensed,
reliably identified field photos. The app must abstain outside validated
coverage.

| Forest zone | Candidate scientific names |
| --- | --- |
| Terai and lower hills | *Shorea robusta*, *Acacia catechu*, *Dalbergia sissoo*, *Bombax ceiba*, *Aegle marmelos*, *Cassia fistula*, *Syzygium cumini*, *Terminalia chebula*, *Terminalia bellirica* |
| Hill and temperate forests | *Pinus roxburghii*, *Quercus leucotrichophora*, *Rhododendron arboreum*, *Myrica esculenta*, *Prunus cerasoides*, *Alnus nepalensis*, *Rubus ellipticus*, *Toona ciliata* |
| Higher forests | *Cedrus deodara*, *Pinus wallichiana*, *Picea smithiana*, *Abies pindrow*, *Betula utilis*, *Juglans regia*, *Quercus semecarpifolia*, *Cinnamomum tamala* |

**Evidence used for nomination:** the [National CAMPA Uttarakhand forest-division
flora tables](https://nationalcampa.nic.in/dashboard/schemesPDF/66a89cbeca83c.pdf),
[Almora district forest communities](https://almora.nic.in/flora-and-fauna/),
and [Pauri Garhwal forest descriptions](https://pauri.nic.in/forest/).
These sources document occurrence or forest dominance, not photo-model
suitability or safety. The [Uttarakhand Biodiversity Board](https://sbb.uk.gov.in/about-department/about-uttarakhand/)
describes the state's strong variation from tropical to alpine habitats.

## Public photo coverage check (25 October 2026)

In the hosted Colab runtime, the [iNaturalist observations API](https://api.inaturalist.org/v1/docs/) was queried for each candidate with `place_id=96903` (Uttarakhand), `quality_grade=research`, and `photos=true`. The results below count **observations, not usable training photos**. They are an upper bound before checking image licenses, duplicate individuals, image quality, and expert identifications. iNaturalist's [Research Grade definition](https://help.inaturalist.org/en/support/solutions/articles/151000169936) does not substitute for botanist review. Its [API guidance](https://www.inaturalist.org/pages/api+recommended+practices) asks clients to limit request rates; this check used one request per second.

| Species | Observations | Species | Observations |
| --- | ---: | --- | ---: |
| *Shorea robusta* | 22 | *Acacia catechu* | 4 |
| *Dalbergia sissoo* | 99 | *Bombax ceiba* | 55 |
| *Aegle marmelos* | 20 | *Cassia fistula* | 47 |
| *Syzygium cumini* | 60 | *Terminalia chebula* | 0 |
| *Terminalia bellirica* | 3 | *Pinus roxburghii* | 38 |
| *Quercus leucotrichophora* | 24 | *Rhododendron arboreum* | 183 |
| *Myrica esculenta* | 56 | *Prunus cerasoides* | 12 |
| *Alnus nepalensis* | 19 | *Rubus ellipticus* | 58 |
| *Toona ciliata* | 9 | *Cedrus deodara* | 107 |
| *Pinus wallichiana* | 20 | *Picea smithiana* | 23 |
| *Abies pindrow* | 16 | *Betula utilis* | 12 |
| *Juglans regia* | 43 | *Quercus semecarpifolia* | 26 |
| *Cinnamomum tamala* | 1 | | |

Only 16 of 25 candidates have at least 20 such observations, before license and quality filtering. The current roster cannot yet support a credible state-wide 20–30-species classifier from local public photos alone. Supplementary licensed images, field collection, and class replacement are needed; retain an unseen Uttarakhand field set for validation.

Filtering the same queries to photos marked `cc0` or `cc-by` leaves at least 20 observations for only **two** candidates: *Rhododendron arboreum* (41) and *Cedrus deodara* (22). *Aegle marmelos*, *Terminalia chebula*, *Betula utilis*, and *Cinnamomum tamala* return zero. This filter identifies observations with an eligible photo; each selected image still needs its own license and attribution recorded. [iNaturalist says photographers retain ownership and each photo has its own license](https://help.inaturalist.org/en/support/solutions/articles/151000169918). A candidate training set will need additional licensed photos beyond Uttarakhand while preserving local field photos as a held-out test set.

## Curation decisions before training

1. Have a botanist reconcile names and identify confusing pairs, especially
   pines, oaks, and *Terminalia* species. Replace classes that cannot be
   distinguished reliably from hiker photos.
2. Record district, elevation, season, plant part, photographer, observation
   ID, label reviewer, image source, and license. Keep all photos of one
   observation in one split; reserve unseen routes and devices for testing.
3. Collect out-of-scope plants from the same habitats, including dangerous
   look-alikes. The model's abstention performance matters as much as its
   known-species accuracy.
4. Use [BSI's medicinal plant database](https://bsi.gov.in/page/en/medicinal-plant-database)
   and the [FRI forest botany division](https://fri.icfre.gov.in/research-division/forest-botany/)
   as taxonomy and reviewer starting points. No review or outreach has yet
   been completed.
