import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import {
  downloadRegionNotes,
  findDownloadedPage,
  getRegionNotes,
  searchOnline,
} from '../src/onlineKnowledge';

jest.mock('@react-native-async-storage/async-storage', () => {
  const items = new Map<string, string>();
  const storage = {
    getItem: jest.fn(async (key: string) => items.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => { items.set(key, value); }),
  };
  return { createAsyncStorage: jest.fn(() => storage) };
});

beforeEach(() => {
  globalThis.fetch = jest.fn(async (url: string) => ({
    ok: true,
    json: async () => url.includes('/search/page')
      ? { pages: [{ key: 'Dehradun_district' }] }
      : {
          title: decodeURIComponent(url.split('/').pop()!),
          extract: 'A short regional summary.',
          content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Dehradun_district' } },
        },
  })) as jest.Mock;
});

test('downloads region notes for offline use and keeps safety questions out of unreviewed notes', async () => {
  const saved = await downloadRegionNotes('dehradun');
  expect(saved.pages.length).toBeGreaterThan(0);
  expect(await getRegionNotes('dehradun')).toEqual(saved);
  expect(findDownloadedPage('Tell me about Dehradun', saved)?.title).toBe('Dehradun district');
  expect(findDownloadedPage('Can I eat this plant in Dehradun?', saved)).toBeNull();
  expect(createAsyncStorage).toHaveBeenCalledWith('wildai-region-notes');
});

test('online search includes the selected region and returns sourced pages', async () => {
  const pages = await searchOnline('forests', 'dehradun');
  expect(pages[0].url).toContain('wikipedia.org');
  expect(globalThis.fetch).toHaveBeenCalledWith(
    expect.stringContaining('forests%20Dehradun'),
    expect.anything(),
  );
});
