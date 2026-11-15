import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import { plants } from './knowledgePack';
import { regions, type RegionId } from './regionPack';

const storage = createAsyncStorage('wildai-region-notes');
const wikipedia = 'https://en.wikipedia.org';

export type WikiPage = { title: string; extract: string; url: string };
export type RegionNotes = {
  regionId: RegionId;
  downloadedAt: string;
  pages: WikiPage[];
};

export function isSafetyQuestion(question: string): boolean {
  return /\b(eat|edible|safe|poison|toxic|treat|treatment|medicine|snakebite|identify|found|picked)\b/i.test(question);
}

const articleTitles: Record<RegionId, string> = {
  uttarakhand: 'Uttarakhand',
  almora: 'Almora district',
  bageshwar: 'Bageshwar district',
  chamoli: 'Chamoli district',
  champawat: 'Champawat district',
  dehradun: 'Dehradun district',
  haridwar: 'Haridwar district',
  nainital: 'Nainital district',
  pauri: 'Pauri Garhwal district',
  pithoragarh: 'Pithoragarh district',
  rudraprayag: 'Rudraprayag district',
  tehri: 'Tehri Garhwal district',
  usnagar: 'Udham Singh Nagar district',
  uttarkashi: 'Uttarkashi district',
};

async function getJson(url: string): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'WILD-AI/0.1 (Uttarakhand field pilot)' },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function summary(title: string): Promise<WikiPage> {
  const data = await getJson(`${wikipedia}/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
  if (typeof data.title !== 'string' || typeof data.extract !== 'string' ||
      typeof data.content_urls?.desktop?.page !== 'string') {
    throw new Error('Incomplete encyclopedia page');
  }
  return {
    title: data.title,
    extract: data.extract,
    url: data.content_urls.desktop.page,
  };
}

export async function searchOnline(question: string, regionId: RegionId): Promise<WikiPage[]> {
  const region = regions.find(item => item.id === regionId)!;
  const q = `${question.trim()} ${region.name.replace(/\s*\(.*/, '')}`;
  const data = await getJson(`${wikipedia}/w/rest.php/v1/search/page?q=${encodeURIComponent(q)}&limit=3`);
  if (!Array.isArray(data.pages)) {
    throw new Error('Invalid search response');
  }
  const pages = await Promise.allSettled(
    data.pages.slice(0, 3).map((page: { key?: string }) => summary(page.key ?? '')),
  );
  return pages.filter(item => item.status === 'fulfilled').map(item => item.value);
}

export async function downloadRegionNotes(regionId: RegionId): Promise<RegionNotes> {
  const area = regionId === 'nainital' ? 'corbett' : regionId;
  const titles = [
    articleTitles[regionId],
    ...plants.filter(plant => plant.area === area).slice(0, 3).map(plant => plant.scientific),
  ];
  const pages = await Promise.all(titles.map(summary));
  const notes = { regionId, downloadedAt: new Date().toISOString(), pages };
  await storage.setItem(regionId, JSON.stringify(notes));
  return notes;
}

export async function getRegionNotes(regionId: RegionId): Promise<RegionNotes | null> {
  const value = await storage.getItem(regionId);
  return value ? JSON.parse(value) as RegionNotes : null;
}

export function findDownloadedPage(question: string, notes: RegionNotes | null): WikiPage | null {
  if (!notes || isSafetyQuestion(question)) {
    return null;
  }
  const terms = question.toLowerCase().match(/[a-z]{4,}/g) ?? [];
  const ranked = notes.pages
    .map(page => ({ page, score: terms.filter(term => page.title.toLowerCase().includes(term)).length }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.score ? ranked[0].page : null;
}
