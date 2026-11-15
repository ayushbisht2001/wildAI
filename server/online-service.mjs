import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';

const regionNames = {
  uttarakhand: 'Uttarakhand', almora: 'Almora', bageshwar: 'Bageshwar',
  chamoli: 'Chamoli', champawat: 'Champawat', dehradun: 'Dehradun',
  haridwar: 'Haridwar', nainital: 'Nainital', pauri: 'Pauri Garhwal',
  pithoragarh: 'Pithoragarh', rudraprayag: 'Rudraprayag',
  tehri: 'Tehri Garhwal', usnagar: 'Udham Singh Nagar', uttarkashi: 'Uttarkashi',
};
const safetyQuestion = /\b(eat|edible|safe to eat|poison|toxic|treat|treatment|medicine|snakebite|identify|found plant|picked fruit)\b/i;

function send(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

async function readBody(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 8192) { throw new Error('Request too large'); }
  }
  return JSON.parse(body);
}

export function createOnlineServer({ token, model, accessCode, fetcher = fetch }) {
  if (!token || !model || !accessCode) {
    throw new Error('NVIDIA_API_KEY, NVIDIA_MODEL, and PILOT_ACCESS_CODE are required');
  }
  // shortcut: one-process rate limits suit the pilot; use shared limits for multiple replicas.
  const requests = new Map();
  return createServer(async (request, response) => {
    if (request.method !== 'POST' || request.url !== '/answer') {
      send(response, 404, { error: 'Not found' });
      return;
    }
    const supplied = request.headers.authorization?.replace(/^Bearer /, '') ?? '';
    const validCode = Buffer.byteLength(supplied) === Buffer.byteLength(accessCode) &&
      timingSafeEqual(Buffer.from(supplied), Buffer.from(accessCode));
    if (!validCode) {
      send(response, 401, { error: 'Unauthorized' });
      return;
    }
    const ip = request.socket.remoteAddress ?? 'unknown';
    const now = Date.now();
    const recent = (requests.get(ip) ?? []).filter(time => now - time < 3600000);
    if (recent.length >= 20) {
      send(response, 429, { error: 'Pilot rate limit reached' });
      return;
    }
    recent.push(now);
    requests.set(ip, recent);
    try {
      const { question, regionId, history = [] } = await readBody(request);
      if (typeof question !== 'string' || !question.trim() || question.length > 300 ||
          !Object.hasOwn(regionNames, regionId) || !Array.isArray(history) || history.length > 12 ||
          !history.every(item => item && ['user', 'assistant'].includes(item.role) &&
            typeof item.content === 'string' && item.content.length <= 500)) {
        send(response, 400, { error: 'Invalid question, region, or history' });
        return;
      }
      if (safetyQuestion.test(question)) {
        send(response, 422, { error: 'Use reviewed local safety guidance for this topic' });
        return;
      }
      const previousQuestion = [...history].reverse().find(item => item.role === 'user')?.content ?? '';
      const search = await fetcher(
        `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(`${previousQuestion.slice(0, 120)} ${question} ${regionNames[regionId]}`.trim())}&limit=3`,
        { headers: { 'User-Agent': 'WILD-AI/0.1 (Uttarakhand field pilot)' }, signal: AbortSignal.timeout(15000) },
      );
      if (!search.ok) { throw new Error('Search unavailable'); }
      const matches = (await search.json()).pages ?? [];
      const sources = await Promise.all(matches.slice(0, 3).map(async page => {
        const detail = await fetcher(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.key)}`,
          { headers: { 'User-Agent': 'WILD-AI/0.1 (Uttarakhand field pilot)' }, signal: AbortSignal.timeout(15000) },
        );
        if (!detail.ok) { throw new Error('Page unavailable'); }
        const data = await detail.json();
        if (typeof data.title !== 'string' || typeof data.extract !== 'string' ||
            typeof data.content_urls?.desktop?.page !== 'string') {
          throw new Error('Incomplete page');
        }
        return { title: data.title, extract: data.extract, url: data.content_urls.desktop.page };
      }));
      if (!sources.length) {
        send(response, 200, { answer: 'No relevant source was found.', model, sources: [] });
        return;
      }
      const completion = await fetcher('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          max_tokens: 500,
          temperature: 0.1,
          reasoning_effort: 'low',
          messages: [
            { role: 'system', content: 'Answer only from the numbered excerpts. Cite source numbers in brackets. History is only for resolving references, never evidence. If the excerpts do not answer the question, say the information is insufficient. Do not give medical, toxicity, or foraging safety advice.' },
            { role: 'user', content: `Question: ${question}\nRegion: ${regionNames[regionId]}\nRecent conversation:\n${history.map(item => `${item.role}: ${item.content}`).join('\n')}\nExcerpts:\n${sources.map((source, index) => `[${index + 1}] ${source.title}: ${source.extract.slice(0, 900)}`).join('\n')}` },
          ],
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (!completion.ok) { throw new Error('Model unavailable'); }
      const answer = (await completion.json()).choices?.[0]?.message?.content;
      if (typeof answer !== 'string' || !answer.trim()) { throw new Error('Empty model answer'); }
      send(response, 200, { answer, model, sources });
    } catch {
      send(response, 502, { error: 'Online service unavailable' });
    }
  });
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  createOnlineServer({
    token: process.env.NVIDIA_API_KEY,
    model: process.env.NVIDIA_MODEL ?? 'openai/gpt-oss-20b',
    accessCode: process.env.PILOT_ACCESS_CODE,
  }).listen(Number(process.env.PORT ?? 8080));
}
