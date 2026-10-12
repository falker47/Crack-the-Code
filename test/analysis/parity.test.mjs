import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBrowserGame } from '../helpers/browser.mjs';
import { evaluate, generateCode } from '../../analysis/core.mjs';
import { createGame } from '../../analysis/engine.mjs';
import { HINTS, HINT_IDS } from '../../analysis/catalog.mjs';

// Test-owned random source; parity does not depend on the analysis PRNG.
function countedRandom(seed) {
  let state = seed >>> 0;
  const random = () => {
    random.calls++;
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
  random.calls = 0;
  return random;
}

function randomCode(length, random) {
  const remaining = [...'0123456789'];
  let code = '';
  while (code.length < length) code += remaining.splice(Math.floor(random() * remaining.length), 1)[0];
  return code;
}

function configureBrowser(game, secret, mode) {
  Object.assign(game.gameState, {
    codeLength: secret.length, secretCode: secret, difficulty: mode,
    guessedDigits: Array(10).fill(false), crypticCache: {},
  });
}

function parsePublicFeedback(message, mode) {
  if (mode === 'easy') {
    assert.ok(message.startsWith('ANALISI DEL TENTATIVO\n'));
    const symbols = [...message.slice('ANALISI DEL TENTATIVO\n'.length)];
    const marks = symbols.map(symbol => ({ '⚪': 0, '🟡': 1, '🟢': 2 })[symbol]);
    assert.ok(marks.every(mark => mark !== undefined));
    return { kind: 'full', marks };
  }
  if (mode === 'medium') {
    const match = message.match(/^ANALISI DEL TENTATIVO\n(\d+) 🟢 · (\d+) 🟡 · (\d+) ⚪$/u);
    assert.ok(match, `unrecognized summary: ${message}`);
    return { kind: 'summary', hit: Number(match[1]), blow: Number(match[2]), misses: Number(match[3]) };
  }
  const none = 'ANALISI PARZIALE\nNessuna cifra utile rilevata in questo tentativo.';
  const confirmed = 'ANALISI PARZIALE\nNessuna nuova informazione ricavabile da questo tentativo.';
  if (message === none) return { kind: 'cryptic', status: 'none' };
  if (message === confirmed) return { kind: 'cryptic', status: 'none-confirmed' };
  const prefixes = {
    hit: 'ANALISI PARZIALE\nUna cifra è corretta e nella posizione giusta.\nINDIZIO: ',
    blow: 'ANALISI PARZIALE\nUna cifra appartiene al codice, ma si trova nella posizione sbagliata.\nINDIZIO: ',
  };
  for (const [status, prefix] of Object.entries(prefixes)) {
    if (message.startsWith(prefix)) return { kind: 'cryptic', status, hint: message.slice(prefix.length) };
  }
  assert.fail(`unrecognized cryptic feedback: ${message}`);
}

function compareAttempt(browser, model, secret, mode, guess, attempt) {
  const sourceEvaluation = browser.evaluateGuess(guess);
  assert.deepEqual(evaluate(secret, guess), {
    marks: Array.from(sourceEvaluation.evaluationList),
    hit: sourceEvaluation.hit, blow: sourceEvaluation.blow, misses: sourceEvaluation.misses,
  }, `${mode} / ${secret} / ${guess}: positional evaluation`);
  const feedback = parsePublicFeedback(browser.getFeedbackMessage(sourceEvaluation, guess), mode);
  const actual = model.submit(guess), won = secret === guess;
  assert.deepEqual(actual, { attempt, feedback, won, terminal: won || attempt === 7 },
    `${mode} / ${secret} / ${guess}: original public feedback`);
  assert.deepEqual(Reflect.ownKeys(actual).sort(), ['attempt', 'feedback', 'terminal', 'won']);
  const expectedFeedbackKeys = mode === 'easy' ? ['kind', 'marks']
    : mode === 'medium' ? ['blow', 'hit', 'kind', 'misses']
      : ['kind', 'status', ...(['hit', 'blow'].includes(feedback.status) ? ['hint'] : [])].sort();
  assert.deepEqual(Reflect.ownKeys(actual.feedback).sort(), expectedFeedbackKeys);
  assert.equal(Object.isFrozen(actual), true);
  assert.equal(Object.isFrozen(actual.feedback), true);
  if (mode === 'easy') assert.equal(Object.isFrozen(actual.feedback.marks), true);
  return actual;
}

test('all 32 public hint entries and every digit eligibility match the original browser data', () => {
  const source = loadBrowserGame();
  const sourceHints = JSON.parse(JSON.stringify(source.crypticMessages));
  assert.equal(sourceHints.length, 32);
  assert.deepEqual(HINTS, sourceHints);
  for (let digit = 0; digit < 10; digit++) {
    assert.deepEqual(HINT_IDS[digit], sourceHints.flatMap((hint, index) =>
      hint.digits.includes(digit) ? [index] : []));
  }
});

test('seeded generation has identical output and draw consumption to the original for lengths 4, 5 and 7', () => {
  let leadingZeros = 0;
  for (const length of [4, 5, 7]) {
    for (const seed of [0, 1, 7, 29, 97, 456, 1024, 65535, 0xffffffff]) {
      const browserRandom = countedRandom(seed), modelRandom = countedRandom(seed);
      const browser = loadBrowserGame({ random: browserRandom });
      assert.equal(browserRandom.calls, 0, 'loading the DOM stub must not consume the injected RNG');
      for (let draw = 0; draw < 40; draw++) {
        const expected = browser.generateSecretCode(length);
        const actual = generateCode(length, modelRandom);
        assert.equal(actual, expected, `length ${length}, seed ${seed}, draw ${draw}`);
        assert.equal(actual.length, length);
        assert.equal(new Set(actual).size, length);
        assert.match(actual, /^\d+$/);
        assert.equal(modelRandom.calls, (draw + 1) * 9);
        assert.equal(browserRandom.calls, modelRandom.calls);
        leadingZeros += actual[0] === '0';
      }
    }
  }
  assert.ok(leadingZeros > 50);
});

test('all discrete shuffle paths give exactly uniform tiny code priors, including leading zero', () => {
  for (const alphabetSize of [3, 4]) {
    const counts = new Map();
    const visit = (size, values) => {
      if (size < 2) {
        let index = 0;
        const code = generateCode(2, () => values[index++], alphabetSize);
        assert.equal(index, alphabetSize - 1);
        counts.set(code, (counts.get(code) ?? 0) + 1);
        return;
      }
      for (let bucket = 0; bucket < size; bucket++) visit(size - 1, [...values, (bucket + 0.5) / size]);
    };
    visit(alphabetSize, []);
    assert.equal(counts.size, alphabetSize * (alphabetSize - 1));
    assert.deepEqual([...new Set(counts.values())], [alphabetSize === 3 ? 1 : 2]);
    assert.ok([...counts.keys()].some(code => code[0] === '0'));
  }
});

for (const mode of ['easy', 'medium', 'difficult']) {
  for (const length of [4, 5, 7]) {
    test(`${mode} / length ${length}: source parity throughout 16 seeded seven-attempt histories`, () => {
      for (let seed = 0; seed < 16; seed++) {
        const inputRandom = countedRandom(seed * 71 + 3);
        const secret = randomCode(length, inputRandom);
        const browserRandom = countedRandom(seed * 101 + 97), modelRandom = countedRandom(seed * 101 + 97);
        const browser = loadBrowserGame({ random: browserRandom });
        configureBrowser(browser, secret, mode);
        const model = createGame({ length, mode, secret, rng: modelRandom });
        assert.deepEqual(Reflect.ownKeys(model), ['submit'], 'the game exposes only its submit capability');
        assert.equal(Object.isFrozen(model), true);
        const rotated = secret.slice(1) + secret[0];
        const oneHit = rotated[1] + rotated[0] + rotated.slice(2);
        const wrongRandomGuess = () => {
          const candidate = randomCode(length, inputRandom);
          return candidate === secret ? rotated : candidate;
        };
        const history = [rotated, rotated, oneHit, oneHit, wrongRandomGuess(), wrongRandomGuess(),
          seed % 2 ? wrongRandomGuess() : secret];
        for (let index = 0; index < history.length; index++) {
          const observation = compareAttempt(browser, model, secret, mode, history[index], index + 1);
          assert.equal(browserRandom.calls, modelRandom.calls, 'same fresh and cached hint draws');
          if (index < 6) assert.equal(observation.terminal, false);
          else {
            assert.equal(observation.terminal, true);
            assert.equal(observation.won, seed % 2 === 0);
          }
        }
        assert.throws(() => model.submit(secret), /terminal|over/i);
      }
    });
  }
}

test('every catalog hint is emitted for every eligible digit, with source-identical caching and hit suppression', () => {
  const covered = new Set();
  let pairs = 0;
  for (let hintId = 0; hintId < HINTS.length; hintId++) {
    for (const digit of HINTS[hintId].digits) {
      for (const status of ['hit', 'blow']) {
        const digitText = String(digit), others = [...'0123456789'].filter(value => value !== digitText);
        const secret = status === 'hit' ? digitText + others.slice(0, 3).join('')
          : others[0] + digitText + others.slice(1, 3).join('');
        const absent = [...'0123456789'].filter(value => !secret.includes(value));
        const guess = digitText + absent.slice(0, 3).join('');
        const eligible = HINTS.flatMap((hint, index) => hint.digits.includes(digit) ? [index] : []);
        const chosen = eligible.indexOf(hintId), value = (chosen + 0.5) / eligible.length;
        let sourceDraws = 0, modelDraws = 0;
        const browser = loadBrowserGame({ random: () => { sourceDraws++; return value; } });
        configureBrowser(browser, secret, 'difficult');
        const model = createGame({ length: 4, mode: 'difficult', secret,
          rng: () => { modelDraws++; return value; } });
        const first = compareAttempt(browser, model, secret, 'difficult', guess, 1);
        assert.deepEqual(first.feedback, { kind: 'cryptic', status, hint: HINTS[hintId].message });
        const repeated = compareAttempt(browser, model, secret, 'difficult', guess, 2);
        assert.deepEqual(repeated.feedback, status === 'blow' ? first.feedback
          : { kind: 'cryptic', status: 'none-confirmed' });
        if (status === 'blow') {
          const hitGuess = absent[0] + digitText + absent.slice(1, 3).join('');
          const hit = compareAttempt(browser, model, secret, 'difficult', hitGuess, 3);
          assert.deepEqual(hit.feedback, { kind: 'cryptic', status: 'hit', hint: HINTS[hintId].message });
          const suppressed = compareAttempt(browser, model, secret, 'difficult', hitGuess, 4);
          assert.deepEqual(suppressed.feedback, { kind: 'cryptic', status: 'none-confirmed' });
        }
        assert.equal(sourceDraws, 1, 'one cached hint draw in the original');
        assert.equal(modelDraws, 1, 'one cached hint draw in the model');
        covered.add(hintId);
        pairs++;
      }
    }
  }
  assert.equal(covered.size, 32);
  assert.equal(pairs, 2 * HINTS.reduce((sum, hint) => sum + hint.digits.length, 0));
});

test('cryptic none and none-confirmed messages match the original, including long histories', () => {
  for (const length of [4, 5, 7]) {
    const secret = '0123456'.slice(0, length), guess = secret.slice(0, -1) + '9';
    const browserRandom = countedRandom(length), modelRandom = countedRandom(length);
    const browser = loadBrowserGame({ random: browserRandom });
    configureBrowser(browser, secret, 'difficult');
    const model = createGame({ length, mode: 'difficult', secret, rng: modelRandom });
    for (let attempt = 1; attempt <= 7; attempt++) {
      const observation = compareAttempt(browser, model, secret, 'difficult', guess, attempt);
      assert.equal(observation.feedback.status, attempt < length ? 'hit' : 'none-confirmed');
    }
    assert.equal(browserRandom.calls, length - 1);
    assert.equal(modelRandom.calls, length - 1);
  }
  for (const length of [4, 5]) {
    const secret = '01234'.slice(0, length), guess = '56789'.slice(0, length);
    const random = () => assert.fail('a none response must not draw a hint');
    const browser = loadBrowserGame({ random });
    configureBrowser(browser, secret, 'difficult');
    const model = createGame({ length, mode: 'difficult', secret, rng: random });
    for (let attempt = 1; attempt <= 7; attempt++) {
      const observation = compareAttempt(browser, model, secret, 'difficult', guess, attempt);
      assert.deepEqual(observation.feedback, { kind: 'cryptic', status: 'none' });
    }
  }
});

test('two different hidden selected digits produce indistinguishable shared-hint observations', () => {
  const worlds = ['10', '21'].map(secret => createGame({
    length: 2, alphabetSize: 4, mode: 'difficult', secret, rng: () => 0,
  }));
  for (const game of worlds) assert.deepEqual(Reflect.ownKeys(game), ['submit']);
  const first = worlds.map(game => game.submit('02'));
  assert.deepEqual(first[0], first[1]);
  assert.deepEqual(first[0].feedback, { kind: 'cryptic', status: 'blow', hint: HINTS[0].message });
  const repeated = worlds.map(game => game.submit('02'));
  assert.deepEqual(repeated[0], repeated[1]);
  assert.deepEqual(repeated[0].feedback, first[0].feedback);
});
