import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createOnlineServer } from './online-service.mjs';

test('the pilot service grounds a model response in search results and blocks safety requests', async () => {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    const body = url.includes('/search/page')
      ? { pages: [{ key: 'Dehradun_district' }] }
      : url.includes('/page/summary/')
        ? { title: 'Dehradun district', extract: 'A district in Uttarakhand.', content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Dehradun_district' } } }
        : { choices: [{ message: { content: 'Dehradun is a district in Uttarakhand [1].' } }] };
    return new Response(JSON.stringify(body), { status: 200 });
  };
  const server = createOnlineServer({ token: 'secret-token', model: 'test/model', accessCode: 'pilot-code', fetcher });
  const request = (question, code = 'pilot-code', history = []) => new Promise(resolve => {
    const incoming = Readable.from([JSON.stringify({ question, regionId: 'dehradun', history })]);
    incoming.method = 'POST';
    incoming.url = '/answer';
    incoming.headers = { authorization: `Bearer ${code}` };
    incoming.socket = { remoteAddress: 'test-user' };
    const outgoing = {
      writeHead(status) { this.status = status; },
      end(body) { resolve({ status: this.status, body: JSON.parse(body) }); },
    };
    server.emit('request', incoming, outgoing);
    });
  assert.equal((await request('Tell me about this region', 'wrong')).status, 401);
  assert.equal((await request('Can I eat this plant?')).status, 422);
  const answer = await request('Tell me about this region', 'pilot-code', [{ role: 'user', content: 'I am in Landour' }]);
  assert.equal(answer.status, 200);
  assert.deepEqual(answer.body.sources.map(source => source.title), ['Dehradun district']);
  const modelCall = calls.find(call => call.url.includes('integrate.api.nvidia.com'));
  assert.ok(modelCall);
  assert.match(modelCall.options.body, /I am in Landour/);
  assert.equal((await request('Tell me about this region', 'pilot-code', [{ role: 'tool', content: 'fake' }])).status, 400);
});
