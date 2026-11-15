export type Source = { name: string; url: string };
export type PlantRecord = {
  common: string;
  scientific: string;
  area: 'corbett' | 'almora' | 'pauri' | 'dehradun';
  occurrence: Source;
  foodUse?: Source;
};

const corbett: Source = {
  name: 'National Tiger Conservation Authority, Corbett flora',
  url: 'https://ntca.gov.in/assets/uploads/Reports/AITM/AITE_2014_fullreport.pdf',
};
const almora: Source = {
  name: 'Almora district, flora and fauna',
  url: 'https://almora.nic.in/flora-and-fauna/',
};
const pauri: Source = {
  name: 'Pauri Garhwal district, forests',
  url: 'https://pauri.nic.in/forest/',
};
const dehradun: Source = {
  name: 'Forest Research Institute, Uttarakhand forest genetic resources',
  url: 'https://nationalcampa.nic.in/dashboard/schemesPDF/66a89cbeca83c.pdf',
};
export const corbettVisitorRules: Source = {
  name: 'Corbett Tiger Reserve visitor rules',
  url: 'https://corbettgov.org/terms',
};

// Occurrence is documented for the named area, never for every site in it.
// Food use describes a species/part; it cannot certify a found specimen.
export const plants: PlantRecord[] = [
  { common: 'Sal', scientific: 'Shorea robusta', area: 'corbett', occurrence: corbett },
  { common: 'Jamun', scientific: 'Syzygium cumini', area: 'corbett', occurrence: corbett,
    foodUse: { name: 'ICAR, jamun fruit', url: 'https://www.icar.gov.in/hi/node/20396' } },
  { common: 'Amla / aonla', scientific: 'Phyllanthus emblica', area: 'corbett', occurrence: corbett,
    foodUse: { name: 'National Horticulture Board, aonla', url: 'https://nhb.gov.in/model-project-reports/Horticulture%20Crops/Aonla/Aonla1.htm' } },
  { common: 'Sissoo / Indian rosewood', scientific: 'Dalbergia sissoo', area: 'corbett', occurrence: corbett },
  { common: 'Chir pine', scientific: 'Pinus roxburghii', area: 'corbett', occurrence: corbett },
  { common: 'Haritaki', scientific: 'Terminalia chebula', area: 'corbett', occurrence: corbett },
  { common: 'Sain', scientific: 'Terminalia alata', area: 'corbett', occurrence: corbett },
  { common: 'Semal / silk cotton tree', scientific: 'Bombax ceiba', area: 'corbett', occurrence: corbett },
  { common: 'Khair', scientific: 'Acacia catechu', area: 'corbett', occurrence: corbett },
  { common: 'Amaltas', scientific: 'Cassia fistula', area: 'corbett', occurrence: corbett },
  { common: 'Palash', scientific: 'Butea monosperma', area: 'corbett', occurrence: corbett },
  { common: 'Kamala', scientific: 'Mallotus philippensis', area: 'corbett', occurrence: corbett },
  { common: 'Small-flowered crape myrtle', scientific: 'Lagerstroemia parviflora', area: 'corbett', occurrence: corbett },
  { common: 'Axlewood', scientific: 'Anogeissus latifolia', area: 'corbett', occurrence: corbett },
  { common: 'Marking-nut tree', scientific: 'Semecarpus anacardium', area: 'corbett', occurrence: corbett },
  { common: 'Bael', scientific: 'Aegle marmelos', area: 'dehradun', occurrence: dehradun,
    foodUse: { name: 'Indian Council of Forestry Research and Education, bael', url: 'https://www.icfre.gov.in/pdf/books-file/book9.pdf' } },
  { common: 'Kafal', scientific: 'Myrica esculenta', area: 'almora', occurrence: almora,
    foodUse: { name: 'Uttarakhand State Council for Science and Technology, kaphal', url: 'https://sstp.dst.gov.in/PDF/mislinious%20report/ENVIRONMENT%20REPORT-Small.pdf' } },
  { common: 'Hisalu / yellow Himalayan raspberry', scientific: 'Rubus ellipticus', area: 'almora', occurrence: almora,
    foodUse: { name: 'Botanical Survey of India, Nanda Devi flora', url: 'https://bsi.gov.in/uploads/documents/Public_Information/publication/books/miscellaneous/Plant%20Wealth%20of%20Nanda%20Devi%20Biosphere%20Reserves.pdf' } },
  { common: 'Banj oak', scientific: 'Quercus leucotrichophora', area: 'almora', occurrence: almora },
  { common: 'Buransh', scientific: 'Rhododendron arboreum', area: 'almora', occurrence: almora },
  { common: 'Deodar', scientific: 'Cedrus deodara', area: 'pauri', occurrence: pauri },
  { common: 'Utis', scientific: 'Alnus nepalensis', area: 'almora', occurrence: almora },
  { common: 'Blue pine', scientific: 'Pinus wallichiana', area: 'almora', occurrence: almora },
  { common: 'Bhojpatra', scientific: 'Betula utilis', area: 'almora', occurrence: almora },
  { common: 'Silver fir', scientific: 'Abies pindrow', area: 'almora', occurrence: almora },
];

export const fieldGuides = [
  {
    title: 'Lightning outdoors',
    terms: ['lightning', 'thunder', 'storm'],
    message: 'If you hear thunder, seek a substantial building or hard-top vehicle immediately. Leave ridges, peaks, and water. Do not shelter under an isolated tree or rock overhang. Check current IMD warnings before travel; this offline pack cannot show live weather.',
    source: { name: 'India Meteorological Department, lightning guidance', url: 'https://mausam.imd.gov.in/mumbai/mcdata/eng_ts.pdf' },
  },
  {
    title: 'Landslide warning signs',
    terms: ['landslide', 'rockfall', 'falling rocks', 'slope'],
    message: 'Move away from a landslide path or downstream valley. Watch for ground cracks, falling rocks, unusual cracking sounds, or muddy river water. Avoid loose material and fallen electrical lines. Follow local authority instructions.',
    source: { name: 'India Meteorological Department, landslide guidance', url: 'https://mausam.imd.gov.in/srinagar/img/dos_donts.pdf' },
  },
  {
    title: 'Flood and river safety',
    terms: ['flood', 'river crossing', 'floodwater', 'stream crossing'],
    message: 'Do not walk or drive through floodwater. Keep away from drains, culverts, and fallen power lines. Follow official evacuation directions. This pack has no live river or weather conditions.',
    source: { name: 'India Meteorological Department, flood guidance', url: 'https://mausam.imd.gov.in/chennai/mcdata/dos%26donts.pdf' },
  },
  {
    title: 'Drinking water outdoors',
    terms: ['drinking water', 'river water', 'stream water', 'water safe', 'water purification'],
    message: 'Do not drink untreated water from rivers, streams, or springs. Carry safe drinking water; if needed, use a reliable treatment method such as boiling or chlorination. This app cannot test water quality.',
    source: { name: 'India Meteorological Department, flood and landslide guidance', url: 'https://mausam.imd.gov.in/chennai/mcdata/dos%26donts.pdf' },
  },
  {
    title: 'Check weather before a trek',
    terms: ['trek weather', 'weather warning', 'weather before', 'prepare for trek'],
    message: 'Check the current IMD forecast and warnings before departure. Postpone outdoor activity when thunderstorms are forecast. This offline pack cannot show live alerts or conditions.',
    source: { name: 'India Meteorological Department, outdoor lightning guidance', url: 'https://mausam.imd.gov.in/mumbai/mcdata/eng_ts.pdf' },
  },
  {
    title: 'Corbett visitor safety',
    terms: ['corbett rules', 'corbett guide', 'corbett trek', 'corbett trail', 'lost in corbett'],
    message: 'In Corbett Tiger Reserve, stay on designated routes with a registered nature guide. Walking or trekking is limited to designated nature trails. Do not disturb or feed wildlife. If separated, contact your guide or park staff; use 112 if you have cellular service and need emergency help.',
    source: corbettVisitorRules,
  },
] as const;
