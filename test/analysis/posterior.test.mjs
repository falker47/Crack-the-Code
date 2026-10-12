import test from 'node:test';
import assert from 'node:assert/strict';
import { CodeSpace } from '../../analysis/core.mjs';
import { Belief } from '../../analysis/belief.mjs';
import { HINTS } from '../../analysis/catalog.mjs';

// Independent finite-world oracle: eagerly assign every secret digit one of its
// eligible messages. This is equivalent to drawing uniformly on first use, then
// caching, but does not use the engine, packed selector, or posterior formulas.
const eligible = Array.from({ length: 10 }, (_, digit) =>
  HINTS.flatMap((hint, index) => hint.digits.includes(digit) ? [index] : []));
const gcd = (a, b) => b ? gcd(b, a % b) : a;
const close = (actual, expected, label) => assert.ok(
  Math.abs(actual - expected) <= 2e-12 * Math.max(1, Math.abs(expected)),
  `${label}: ${actual} != ${expected}`,
);

function twoDigitCodes(alphabetSize) {
  const codes = [];
  for (let first = 0; first < alphabetSize; first++) {
    for (let second = 0; second < alphabetSize; second++) {
      if (first !== second) codes.push(`${first}${second}`);
    }
  }
  return codes;
}

function enumerateWorlds(codes, mode) {
  const denominators = codes.map(code => mode === 'difficult'
    ? eligible[Number(code[0])].length * eligible[Number(code[1])].length : 1);
  const denominator = denominators.reduce((a, b) => a * b / gcd(a, b), 1);
  const worlds = [];
  for (let index = 0; index < codes.length; index++) {
    const secret = codes[index];
    const choices = mode === 'difficult'
      ? [...secret].map(digit => eligible[Number(digit)]) : [[-1], [-1]];
    for (const firstHint of choices[0]) {
      for (const secondHint of choices[1]) {
        const cache = new Map([[secret[0], firstHint], [secret[1], secondHint]]);
        worlds.push({ secret, cache, confirmed: new Set(), seen: new Set(),
          mass: denominator / denominators[index] });
      }
    }
  }
  // Every code has equal prior mass, despite differing numbers of cache worlds.
  for (const code of codes) assert.equal(
    worlds.filter(world => world.secret === code).reduce((sum, world) => sum + world.mass, 0),
    denominator,
  );
  return { worlds, denominator };
}

function referenceStep(world, guess, mode, attempt) {
  const marks = [...guess].map((digit, index) =>
    world.secret[index] === digit ? 2 : world.secret.includes(digit) ? 1 : 0);
  let feedback, confirmed = world.confirmed, seen = world.seen;
  if (mode === 'easy') feedback = { kind: 'full', marks };
  else if (mode === 'medium') feedback = {
    kind: 'summary', hit: marks.filter(mark => mark === 2).length,
    blow: marks.filter(mark => mark === 1).length,
    misses: marks.filter(mark => mark === 0).length,
  };
  else {
    const unconfirmedHits = [...guess].filter((digit, index) =>
      digit === world.secret[index] && !world.confirmed.has(digit));
    const unconfirmedMembers = [...guess].filter(digit =>
      world.secret.includes(digit) && !world.confirmed.has(digit));
    const digit = unconfirmedHits[0] ?? unconfirmedMembers[0];
    if (digit === undefined) feedback = {
      kind: 'cryptic', status: world.confirmed.size ? 'none-confirmed' : 'none',
    };
    else {
      const hit = unconfirmedHits.length > 0;
      feedback = { kind: 'cryptic', status: hit ? 'hit' : 'blow',
        hint: HINTS[world.cache.get(digit)].message };
      seen = new Set(world.seen).add(digit);
      if (hit) confirmed = new Set(world.confirmed).add(digit);
    }
  }
  const won = guess === world.secret;
  const observation = { attempt, feedback, won, terminal: won || attempt === 7 };
  return { world: { ...world, confirmed, seen }, observation };
}

// Encode only public response content. Winning responses are deliberately
// coalesced: victory alone already identifies the guessed code exactly.
function responseKey(observation) {
  if (observation.won) return -1;
  const feedback = observation.feedback;
  if (feedback.kind === 'full') return feedback.marks.reduce((key, mark) => key * 3 + mark, 0);
  if (feedback.kind === 'summary') return feedback.hit * 3 + feedback.blow;
  if (feedback.status === 'none') return 0;
  if (feedback.status === 'none-confirmed') return 1;
  return 2 + HINTS.findIndex(hint => hint.message === feedback.hint)
    + (feedback.status === 'blow' ? HINTS.length : 0);
}

function assertPrediction(belief, worlds, guess, attempt) {
  const perCode = new Map();
  for (const world of worlds) {
    if (!perCode.has(world.secret)) perCode.set(world.secret, { total: 0, outcomes: new Map() });
    const entry = perCode.get(world.secret);
    const key = responseKey(referenceStep(world, guess, belief.mode, attempt).observation);
    entry.total += world.mass;
    entry.outcomes.set(key, (entry.outcomes.get(key) ?? 0) + world.mass);
  }
  const actualMixture = new Map(), expectedMixture = new Map();
  const totalMass = worlds.reduce((sum, world) => sum + world.mass, 0);
  const guessId = belief.space.idOf(guess);
  for (const [code, entry] of perCode) {
    const id = belief.space.idOf(code), actual = new Map();
    belief.outcomes(id, guessId, (key, probability) => {
      assert.ok(Number.isInteger(key));
      assert.ok(Number.isFinite(probability) && probability > 0 && probability <= 1);
      assert.equal(actual.has(key), false, 'one emission per distinct public response');
      actual.set(key, probability);
      actualMixture.set(key, (actualMixture.get(key) ?? 0)
        + belief.weights[id] / belief.totalWeight * probability);
    });
    assert.deepEqual([...actual.keys()].sort((a, b) => a - b),
      [...entry.outcomes.keys()].sort((a, b) => a - b), `${code} / ${guess}: public response keys`);
    close([...actual.values()].reduce((sum, probability) => sum + probability, 0), 1,
      `${code} / ${guess}: conditional normalization`);
    for (const [key, mass] of entry.outcomes) {
      close(actual.get(key), mass / entry.total, `${code} / ${guess} / ${key}`);
      expectedMixture.set(key, (expectedMixture.get(key) ?? 0) + mass / totalMass);
    }
  }
  for (const [key, probability] of expectedMixture) {
    close(actualMixture.get(key), probability, `${guess} / ${key}: posterior predictive probability`);
  }
  close([...actualMixture.values()].reduce((sum, probability) => sum + probability, 0), 1,
    'posterior predictive normalization');
}

function assertPosterior(space, mode, worlds, denominator, history, stats) {
  const belief = new Belief(space, mode);
  // The tested solver receives only guesses and public observations; the oracle's
  // secret, selected digit, full cache, and confirmation set never cross this API.
  for (const { guess, observation } of history) belief.observe(guess, observation);
  const masses = new Map();
  for (const world of worlds) masses.set(world.secret, (masses.get(world.secret) ?? 0) + world.mass);
  const total = [...masses.values()].reduce((sum, mass) => sum + mass, 0);
  const actual = new Map(belief.probabilities().map(([id, probability]) => [space.codeAt(id), probability]));
  assert.deepEqual([...actual.keys()].sort(), [...masses.keys()].sort(), 'exact posterior support');
  close([...actual.values()].reduce((sum, probability) => sum + probability, 0), 1,
    'posterior normalization');
  close(belief.totalWeight, total / denominator, 'history likelihood summed over code prior units');
  for (const [code, mass] of masses) {
    const id = space.idOf(code);
    close(actual.get(code), mass / total, `${code}: exact posterior probability`);
    close(belief.weights[id], mass / denominator, `${code}: full-history likelihood`);
    if (mode === 'difficult') {
      const compatible = worlds.filter(world => world.secret === code);
      for (const world of compatible) {
        const mask = [...world.confirmed].reduce((bits, digit) => bits | 1 << Number(digit), 0);
        assert.equal(belief.confirmed[id], mask, `${code}: private state of this hypothesis`);
        for (let digit = 0; digit < 10; digit++) {
          assert.equal(belief.cache[id * 10 + digit], world.seen.has(String(digit))
            ? world.cache.get(String(digit)) + 1 : 0, `${code}: observed cache of digit ${digit}`);
        }
      }
    }
  }
  assert.equal(belief.attempt, history.length);
  assert.equal(belief.terminal, history.at(-1)?.observation.terminal ?? false);
  if (!belief.terminal) {
    for (const guess of twoDigitCodes(space.alphabetSize)) assertPrediction(belief, worlds, guess, history.length + 1);
  }
  stats.nodes++;
  for (const { observation } of history) if (mode === 'difficult') stats.statuses.add(observation.feedback.status);
  return belief;
}

function verifyTree({ alphabetSize, mode, depth, schedule }) {
  const codes = twoDigitCodes(alphabetSize), space = new CodeSpace(2, alphabetSize);
  const { worlds, denominator } = enumerateWorlds(codes, mode);
  const stats = { nodes: 0, statuses: new Set() };
  const visit = (remainingWorlds, history) => {
    const belief = assertPosterior(space, mode, remainingWorlds, denominator, history, stats);
    if (belief.terminal || history.length === depth) return;
    const guesses = schedule ? [schedule[history.length]] : codes;
    for (const guess of guesses) {
      const groups = new Map();
      for (const world of remainingWorlds) {
        const next = referenceStep(world, guess, mode, history.length + 1);
        const key = JSON.stringify(next.observation);
        if (!groups.has(key)) groups.set(key, { observation: next.observation, worlds: [] });
        groups.get(key).worlds.push(next.world);
      }
      for (const group of groups.values()) {
        visit(group.worlds, [...history, { guess, observation: group.observation }]);
      }
    }
  };
  visit(worlds, []);
  return stats;
}

for (const alphabetSize of [3, 4]) {
  for (const mode of ['easy', 'medium', 'difficult']) {
    test(`exact ${mode} posterior and prediction: every two-guess branch, length 2 / alphabet ${alphabetSize}`, () => {
      const stats = verifyTree({ alphabetSize, mode, depth: 2 });
      assert.ok(stats.nodes > 20);
      if (mode === 'difficult' && alphabetSize === 4) assert.deepEqual(
        [...stats.statuses].sort(), ['blow', 'hit', 'none', 'none-confirmed'],
      );
    });
  }
}

for (const [alphabetSize, schedule] of [
  [3, ['10', '10', '02', '02', '21', '21', '01']],
  [4, ['10', '10', '23', '23', '02', '02', '31']],
  [4, ['01', '01', '01', '10', '32', '20', '30']],
]) {
  test(`all cryptic cache assignments remain exact through seven attempts: ${schedule.join('/')}`, () => {
    const stats = verifyTree({ alphabetSize, mode: 'difficult', depth: 7, schedule });
    assert.ok(stats.nodes > 100);
  });
}

const cryptic = (attempt, status, hintId, terminal = attempt === 7) => ({
  attempt, feedback: { kind: 'cryptic', status,
    ...(['hit', 'blow'].includes(status) ? { hint: HINTS[hintId].message } : {}) },
  won: false, terminal,
});

test('shared message reveals no selected digit; unequal eligible counts give unequal likelihoods', () => {
  const space = new CodeSpace(2, 4), belief = new Belief(space, 'difficult');
  belief.observe('02', cryptic(1, 'blow', 0));
  const zeroSelected = space.idOf('10'), twoSelected = space.idOf('21');
  assert.equal(belief.has(zeroSelected), true);
  assert.equal(belief.has(twoSelected), true);
  close(belief.weights[zeroSelected], 1 / 9, 'selected zero: nine eligible messages');
  close(belief.weights[twoSelected], 1 / 8, 'selected two: eight eligible messages');
  close(belief.weights[zeroSelected] / belief.weights[twoSelected], 8 / 9,
    'posterior odds include message selection probability');
  const keys = [zeroSelected, twoSelected].map(id => {
    const emitted = [];
    belief.outcomes(id, space.idOf('02'), (key, probability) => emitted.push([key, probability]));
    return emitted;
  });
  assert.deepEqual(keys[0], [[2 + HINTS.length, 1]]);
  assert.deepEqual(keys[1], keys[0], 'response keys must not include the hidden selected digit');
  const before = belief.probabilities();
  belief.observe('02', cryptic(2, 'blow', 0));
  assert.deepEqual(belief.probabilities(), before, 'cached repeat has likelihood one');

  // The same message on a different digit is a fresh independent cache draw.
  belief.observe('12', cryptic(3, 'blow', 0));
  assert.equal(belief.has(space.idOf('20')), true);
  close(belief.weights[space.idOf('20')], 1 / (9 * 8), 'two distinct digit caches');
});

test('a cached blow becomes a hit without a second hint draw, then is suppressed', () => {
  const space = new CodeSpace(2, 4), belief = new Belief(space, 'difficult');
  const secretId = space.idOf('20');
  belief.observe('02', cryptic(1, 'blow', 0));
  belief.observe('30', cryptic(2, 'hit', 0));
  close(belief.weights[secretId], 1 / 9, 'blow-to-hit reuses the cached message');
  assert.equal(belief.confirmed[secretId], 1 << 0);
  belief.observe('30', cryptic(3, 'none-confirmed'));
  assert.equal(belief.has(secretId), true);
  close(belief.weights[secretId], 1 / 9, 'confirmed digit is not selected again');
});

function snapshot(belief) {
  return { ids: belief.ids.slice(), weights: belief.weights.slice(),
    confirmed: belief.confirmed?.slice(), cache: belief.cache?.slice(),
    count: belief.count, totalWeight: belief.totalWeight, attempt: belief.attempt,
    terminal: belief.terminal };
}

test('rejected cryptic contradictions and private-field additions leave every belief field unchanged', () => {
  const space = new CodeSpace(2, 3), belief = new Belief(space, 'difficult');
  belief.observe('10', cryptic(1, 'blow', 0));
  const before = snapshot(belief), valid = cryptic(2, 'blow', 0);
  const rejected = [
    cryptic(2, 'blow', 20), // eligible for both possible selected digits, but the cache differs
    cryptic(2, 'none-confirmed'),
    { ...valid, won: true, terminal: true },
    { ...valid, attempt: 3 },
    { ...valid, terminal: true },
    { ...valid, secret: '01' },
    { ...valid, feedback: { ...valid.feedback, selectedDigit: 1 } },
    { ...valid, feedback: { ...valid.feedback, position: 0 } },
    { ...valid, feedback: { ...valid.feedback, cache: {} } },
  ];
  for (const observation of rejected) {
    assert.throws(() => belief.observe('10', observation), /invalid|schema|unexpected|contradictory|compatible/i);
    assert.deepEqual(snapshot(belief), before, 'a rejected observation must not partially update state');
  }
  assert.throws(() => belief.observe('11', valid), /invalid/i);
  assert.deepEqual(snapshot(belief), before);
  belief.observe('10', valid);
  assert.equal(belief.attempt, 2, 'a valid retry still occupies the second attempt');
});

test('seventh public observation ends belief updates; victory and feedback must agree', () => {
  const space = new CodeSpace(2, 3), belief = new Belief(space, 'difficult');
  for (let attempt = 1; attempt <= 7; attempt++) belief.observe('10', cryptic(attempt, 'blow', 0));
  assert.equal(belief.terminal, true);
  const before = snapshot(belief);
  assert.throws(() => belief.observe('10', cryptic(8, 'blow', 0)), /terminal/i);
  assert.deepEqual(snapshot(belief), before);
  for (const mode of ['easy', 'medium']) {
    const invalid = new Belief(space, mode), initial = snapshot(invalid);
    const feedback = mode === 'easy' ? { kind: 'full', marks: [2, 2] }
      : { kind: 'summary', hit: 2, blow: 0, misses: 0 };
    assert.throws(() => invalid.observe('01', { attempt: 1, feedback, won: false, terminal: false }),
      /contradictory|compatible/i);
    assert.deepEqual(snapshot(invalid), initial);
  }
});
