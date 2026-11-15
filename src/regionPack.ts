export const regions = [
  { id: 'uttarakhand', name: 'Uttarakhand (statewide)' },
  { id: 'almora', name: 'Almora' },
  { id: 'bageshwar', name: 'Bageshwar' },
  { id: 'chamoli', name: 'Chamoli' },
  { id: 'champawat', name: 'Champawat' },
  { id: 'dehradun', name: 'Dehradun (including Mussoorie and Landour)' },
  { id: 'haridwar', name: 'Haridwar' },
  { id: 'nainital', name: 'Nainital' },
  { id: 'pauri', name: 'Pauri Garhwal' },
  { id: 'pithoragarh', name: 'Pithoragarh' },
  { id: 'rudraprayag', name: 'Rudraprayag' },
  { id: 'tehri', name: 'Tehri Garhwal' },
  { id: 'usnagar', name: 'Udham Singh Nagar' },
  { id: 'uttarkashi', name: 'Uttarkashi' },
] as const;

export type RegionId = (typeof regions)[number]['id'];

// Checked against the cited Uttarakhand government pages on 2026-10-25.
export const emergencyContacts = {
  statewide: {
    emergency: '112',
    stateControlRoom: '1070',
    districtControlRoom: '1077',
    sourceName: 'Uttarakhand State Disaster Management Authority',
    sourceUrl: 'https://usdma.uk.gov.in/',
  },
} as const;

// Keep only complete dialable numbers from USDMA's district EOC list.
export const districtControlRooms = {
  almora: '05962-237874',
  bageshwar: '05963-220197 / 05963-220196',
  chamoli: '01372-251437 / 01372-251077',
  champawat: '05965-230819 / 05965-230703',
  dehradun: '0135-2726066 / 0135-2626066',
  haridwar: '01334-223999 / 01334-239423',
  nainital: '05942-231179 / 05942-231178',
  pauri: '01368-221840',
  pithoragarh: '05964-228050 / 05964-226326 / 05964-224224',
  rudraprayag: '01364-233727',
  tehri: '01376-233433 / 01376-234793',
  usnagar: '05944-250719 / 05944-250103',
  uttarkashi: '01374-222722 / 01374-222126',
} as const satisfies Record<Exclude<RegionId, 'uttarakhand'>, string>;

export const districtContactSource = 'https://usdma.uk.gov.in/eocs-contact/';
