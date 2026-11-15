import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import { listFeedback, saveFeedback } from '../src/feedback';

jest.mock('@react-native-async-storage/async-storage', () => {
  const items = new Map<string, string>();
  const storage = {
    getAllKeys: jest.fn(async () => [...items.keys()]),
    getItem: jest.fn(async (key: string) => items.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => { items.set(key, value); }),
  };
  return { createAsyncStorage: jest.fn(() => storage) };
});

test('keeps the exact query context and persists reports for later review', async () => {
  const saved = await saveFeedback({
    regionId: 'dehradun',
    question: 'What grows near Landour?',
    answer: { kind: 'abstain', title: 'No reviewed answer', message: 'No match.' },
    note: 'Please add oak records.',
  });

  expect(saved.createdAt).toBeTruthy();
  expect(await listFeedback()).toEqual([saved]);
  expect(createAsyncStorage).toHaveBeenCalledWith('wildai-feedback');
});
