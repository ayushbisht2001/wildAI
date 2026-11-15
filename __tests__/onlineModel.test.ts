import { askOnlineModel } from '../src/onlineModel';

jest.mock('@react-native-async-storage/async-storage', () => ({
  createAsyncStorage: () => ({ getItem: jest.fn(), setItem: jest.fn() }),
}));

test('sends a pilot question only to a configured HTTPS service', async () => {
  globalThis.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({ answer: 'A sourced summary [1].', model: 'open/model', sources: [] }),
  })) as jest.Mock;
  await expect(askOnlineModel('http://untrusted.example', 'code', 'forests', 'dehradun'))
    .rejects.toThrow('HTTPS');
  expect(globalThis.fetch).not.toHaveBeenCalled();

  const answer = await askOnlineModel('https://pilot.example', 'code', 'forests', 'dehradun',
    [{ role: 'user', content: 'I am in Landour' }]);
  expect(answer.model).toBe('open/model');
  expect(globalThis.fetch).toHaveBeenCalledWith('https://pilot.example/answer',
    expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer code' }) }));
  expect(JSON.parse((globalThis.fetch as jest.Mock).mock.calls[0][1].body).history)
    .toEqual([{ role: 'user', content: 'I am in Landour' }]);
});
