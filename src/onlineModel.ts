import type { RegionId } from './regionPack';
import type { WikiPage } from './onlineKnowledge';

export type ModelResult = { answer: string; model: string; sources: WikiPage[] };
export type ModelHistory = { role: 'user' | 'assistant'; content: string }[];

export async function askOnlineModel(
  serviceUrl: string,
  accessCode: string,
  question: string,
  regionId: RegionId,
  history: ModelHistory = [],
): Promise<ModelResult> {
  const base = serviceUrl.trim().replace(/\/+$/, '');
  if (!/^https:\/\/[^/\s]+$/.test(base)) {
    throw new Error('Online service is not configured with an HTTPS address.');
  }
  if (!accessCode.trim()) {
    throw new Error('Online service is not configured.');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${base}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessCode.trim()}`,
      },
      body: JSON.stringify({ question, regionId, history }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(response.status === 422 ? 'This safety question needs reviewed local guidance.' :
        'Online research is unavailable right now.');
    }
    const data = await response.json();
    if (typeof data.answer !== 'string' || typeof data.model !== 'string' ||
        !Array.isArray(data.sources) ||
        !data.sources.every((source: WikiPage) =>
          typeof source.title === 'string' && typeof source.extract === 'string' &&
          typeof source.url === 'string')) {
      throw new Error('Invalid online response.');
    }
    return data as ModelResult;
  } finally {
    clearTimeout(timeout);
  }
}
