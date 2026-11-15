import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import { loadChats, onlineHistory, saveChats, type ChatThread } from '../src/chatHistory';

jest.mock('@react-native-async-storage/async-storage', () => {
  const items = new Map<string, string>();
  return { createAsyncStorage: jest.fn(() => ({
    getItem: jest.fn(async (key: string) => items.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => { items.set(key, value); }),
  })) };
});

test('keeps full chat locally while sending only bounded text context online', async () => {
  const thread: ChatThread = {
    id: 'one', title: 'Landour plants', regionId: 'dehradun', createdAt: '2026-10-26',
    messages: [
      { id: 'u', role: 'user', text: 'Tell me about oak', createdAt: '2026-10-26', photoUri: 'file:///photo.jpg' },
      { id: 'a', role: 'assistant', text: 'Oak is documented.', label: 'Offline sources', createdAt: '2026-10-26' },
      { id: 'm', role: 'assistant', text: 'Unreviewed claim', label: 'Online · unreviewed', createdAt: '2026-10-26' },
    ],
  };
  await saveChats([thread]);
  expect(await loadChats()).toEqual([thread]);
  expect(onlineHistory(thread.messages)).toEqual([{ role: 'assistant', content: 'Oak is documented.' }]);
  expect(createAsyncStorage).toHaveBeenCalledWith('wildai-chat-history');
});
