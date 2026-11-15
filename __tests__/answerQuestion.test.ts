import { answerQuestion } from '../src/answerQuestion';
import { plants } from '../src/knowledgePack';

test('returns sourced contacts for the selected district only', () => {
  const dehradun = answerQuestion('dehradun', 'What is the emergency number?');
  const almora = answerQuestion('almora', 'What is the emergency number?');
  const statewide = answerQuestion(
    'uttarakhand',
    'What is the emergency number?',
  );

  expect(dehradun.kind).toBe('supported');
  expect(almora.kind).toBe('supported');
  expect(statewide.kind).toBe('supported');
  if (
    dehradun.kind === 'supported' &&
    almora.kind === 'supported' &&
    statewide.kind === 'supported'
  ) {
    expect(dehradun.message).toContain('0135-2726066');
    expect(almora.message).not.toContain('0135-2726066');
    expect(almora.message).toContain('05962-237874');
    expect(almora.message).toContain('112');
    expect(statewide.message).not.toContain('Local district control room');
  }
});

test('abstains on unanswered safety questions', () => {
  const berry = answerQuestion('dehradun', 'Can I eat this berry?');
  expect(berry.kind).toBe('abstain');
  if (berry.kind === 'abstain') {
    expect(berry.message).not.toContain('112');
  }
  expect(answerQuestion('dehradun', 'How do I treat a snakebite?').kind).toBe(
    'abstain',
  );
});

test('answers a Corbett fruit question without certifying a found fruit', () => {
  const answer = answerQuestion(
    'uttarakhand',
    'What all plants and fruits are edible in Corbett National Park forest?',
  );
  expect(answer.kind).toBe('supported');
  if (answer.kind === 'supported') {
    expect(answer.message).toContain('Jamun');
    expect(answer.message).toContain('Amla');
    expect(answer.message).toContain('incomplete list');
    expect(answer.sources).toHaveLength(4);
  }
  expect(answerQuestion('uttarakhand', 'Can I eat this berry in Corbett?').kind).toBe('abstain');
  expect(answerQuestion('dehradun', 'What plants grow in Corbett?').kind).toBe('supported');
});

test('retrieves the curated roster by area and abstains where coverage is absent', () => {
  expect(plants).toHaveLength(25);
  const corbett = answerQuestion('uttarakhand', 'List all plants in Corbett');
  expect(corbett.kind).toBe('supported');
  if (corbett.kind === 'supported') {
    expect(corbett.message).toContain('Sal (Shorea robusta)');
    expect(corbett.message).not.toContain('Kafal');
  }
  expect(answerQuestion('nainital', 'Which edible plants grow here?').kind).toBe('abstain');
});

test('retrieves source-backed field guidance without inventing a live forecast', () => {
  const lightning = answerQuestion('dehradun', 'What should I do in a lightning storm?');
  expect(lightning.kind).toBe('supported');
  if (lightning.kind === 'supported') {
    expect(lightning.message).toContain('seek a substantial building');
    expect(lightning.message).toContain('cannot show live weather');
    expect(lightning.sources[0].url).toContain('mausam.imd.gov.in');
  }
  expect(answerQuestion('uttarakhand', 'What is the weather now?').kind).toBe('abstain');
});
