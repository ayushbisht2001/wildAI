import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import type { Answer } from './answerQuestion';
import type { RegionId } from './regionPack';

const storage = createAsyncStorage('wildai-feedback');

export type Feedback = {
  id: string;
  createdAt: string;
  regionId: RegionId;
  question: string;
  answer: Pick<Answer, 'kind' | 'title' | 'message'>;
  onlineSources?: { title: string; extract: string; url: string }[];
  modelAnswer?: { model: string; text: string };
  note: string;
};

export async function saveFeedback(
  report: Omit<Feedback, 'id' | 'createdAt'>,
): Promise<Feedback> {
  const feedback = {
    ...report,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
  };
  await storage.setItem(feedback.id, JSON.stringify(feedback));
  return feedback;
}

export async function listFeedback(): Promise<Feedback[]> {
  const keys = await storage.getAllKeys();
  const reports = await Promise.all(
    keys.map(async key => JSON.parse((await storage.getItem(key))!) as Feedback),
  );
  return reports.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
