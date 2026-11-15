import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import { regions, type RegionId } from './regionPack';

const storage = createAsyncStorage('wildai-chat-history');

export type ChatSource = { title: string; url: string };
export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
  photoUri?: string;
  label?: 'Offline sources' | 'Online · unreviewed' | 'Photo · experimental' | 'Notice';
  sources?: ChatSource[];
  question?: string;
};

export type ChatThread = {
  id: string;
  title: string;
  regionId: RegionId;
  createdAt: string;
  messages: ChatMessage[];
};

export async function loadChats(): Promise<ChatThread[]> {
  const value = await storage.getItem('threads');
  if (!value) { return []; }
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed) || !parsed.every(thread =>
    thread && typeof thread.id === 'string' && typeof thread.title === 'string' &&
    regions.some(region => region.id === thread.regionId) &&
    Array.isArray(thread.messages) && thread.messages.every((message: ChatMessage) =>
      message && typeof message.id === 'string' && typeof message.text === 'string' &&
      (message.role === 'user' || message.role === 'assistant')))) {
    throw new Error('Saved chats are invalid');
  }
  return parsed as ChatThread[];
}

export async function saveChats(threads: ChatThread[]): Promise<void> {
  await storage.setItem('threads', JSON.stringify(threads));
}

export function onlineHistory(messages: ChatMessage[]): { role: 'user' | 'assistant'; content: string }[] {
  return messages
    .filter(item => item.text && !item.photoUri && item.label !== 'Online · unreviewed')
    .slice(-12)
    .map(item => ({ role: item.role, content: item.text.slice(0, 500) }));
}
