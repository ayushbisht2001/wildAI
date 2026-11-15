# Offline knowledge pack: source ledger

Checked 2026-10-25. These are **documented occurrence records**, not proof
that a species grows at a particular trail or can be recognized from a photo.
The roster is deliberately incomplete. Botanist review and field verification
are required before the November pilot. An edible species record is not advice
to eat any wild specimen.

## Plant roster (25)

The Corbett records come from the [National Tiger Conservation Authority's
Corbett habitat account](https://ntca.gov.in/assets/uploads/Reports/AITM/AITE_2014_fullreport.pdf).
The hill records come from [Almora district's flora account](https://almora.nic.in/flora-and-fauna/)
and [Pauri Garhwal's forest account](https://pauri.nic.in/forest/). The
Dehradun record comes from the [Forest Research Institute's Uttarakhand
forest genetic resources survey](https://nationalcampa.nic.in/dashboard/schemesPDF/66a89cbeca83c.pdf).

| Documented area | Species | Food-use source in this pack |
| --- | --- | --- |
| Corbett | Sal — *Shorea robusta* | — |
| Corbett | Jamun — *Syzygium cumini* | [ICAR](https://www.icar.gov.in/hi/node/20396) |
| Corbett | Amla/aonla — *Phyllanthus emblica* | [National Horticulture Board](https://nhb.gov.in/model-project-reports/Horticulture%20Crops/Aonla/Aonla1.htm) |
| Corbett | Sissoo — *Dalbergia sissoo* | — |
| Corbett | Chir pine — *Pinus roxburghii* | — |
| Corbett | Haritaki — *Terminalia chebula* | — |
| Corbett | Sain — *Terminalia alata* | — |
| Corbett | Semal — *Bombax ceiba* | — |
| Corbett | Khair — *Acacia catechu* | — |
| Corbett | Amaltas — *Cassia fistula* | — |
| Corbett | Palash — *Butea monosperma* | — |
| Corbett | Kamala — *Mallotus philippensis* | — |
| Corbett | Small-flowered crape myrtle — *Lagerstroemia parviflora* | — |
| Corbett | Axlewood — *Anogeissus latifolia* | — |
| Corbett | Marking-nut tree — *Semecarpus anacardium* | — |
| Kalsi, Dehradun district | Bael — *Aegle marmelos* | [ICFRE](https://www.icfre.gov.in/pdf/books-file/book9.pdf) |
| Almora | Kafal — *Myrica esculenta* | [Uttarakhand State Council for Science and Technology](https://sstp.dst.gov.in/PDF/mislinious%20report/ENVIRONMENT%20REPORT-Small.pdf) |
| Almora | Hisalu — *Rubus ellipticus* | [Botanical Survey of India](https://bsi.gov.in/uploads/documents/Public_Information/publication/books/miscellaneous/Plant%20Wealth%20of%20Nanda%20Devi%20Biosphere%20Reserves.pdf) |
| Almora | Banj oak — *Quercus leucotrichophora* | — |
| Almora | Buransh — *Rhododendron arboreum* | — |
| Pauri Garhwal | Deodar — *Cedrus deodara* | — |
| Almora | Utis — *Alnus nepalensis* | — |
| Almora | Blue pine — *Pinus wallichiana* | — |
| Almora | Bhojpatra — *Betula utilis* | — |
| Almora | Silver fir — *Abies pindrow* | — |

Food-use sources describe fruit from correctly identified species. The app
never infers that a specimen is safe from a name, photograph, location, or
similar appearance. Corbett's [visitor rules](https://corbettgov.org/terms)
require designated routes and a registered guide; the app discourages foraging.

## Field topics

- Lightning and pre-trek weather: [India Meteorological Department](https://mausam.imd.gov.in/mumbai/mcdata/eng_ts.pdf).
- Landslide warning signs: [India Meteorological Department](https://mausam.imd.gov.in/srinagar/img/dos_donts.pdf).
- Floodwater and drinking-water precautions: [India Meteorological Department](https://mausam.imd.gov.in/chennai/mcdata/dos%26donts.pdf).
- Corbett visitor conduct: [Corbett Tiger Reserve](https://corbettgov.org/terms).
- Emergency contacts: [Uttarakhand State Disaster Management Authority](https://usdma.uk.gov.in/) and [district EOCs](https://usdma.uk.gov.in/eocs-contact/).

The pack is stored in `src/knowledgePack.ts`. Local retrieval uses the question's
region, topic words, and species names; answer text is assembled from fixed
entries with source links. It cannot fetch live weather, identify plants, or
answer medical and toxicity questions.
