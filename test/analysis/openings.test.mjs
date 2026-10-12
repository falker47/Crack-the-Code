import test from 'node:test';
import assert from 'node:assert/strict';
import * as openings from '../../analysis/openings.mjs';
import { HINTS } from '../../analysis/catalog.mjs';

function api(name) {
  assert.equal(typeof openings[name], 'function', `${name} must be implemented`);
  return openings[name];
}
function close(actual, expected, tolerance = 1e-10) {
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
}

// Independent test oracle: explicit strings and direct per-position comparisons.
// It does not import CodeSpace, crypticSelection, or the formula under test.
function enumerate(alphabet, length, visit, prefix = '') {
  if (prefix.length === length) { visit(prefix); return; }
  for (const digit of alphabet) if (!prefix.includes(digit)) {
    enumerate(alphabet, length, visit, prefix + digit);
  }
}
function directOpening(guess, alphabetSize) {
  const alphabet = Array.from({ length: alphabetSize }, (_, i) => String(i));
  const hit = Array(guess.length).fill(0), blow = Array(guess.length).fill(0);
  const outputs = new Map(), easy = new Map(), medium = new Map();
  let total = 0, none = 0, noiseSum = 0;
  const add = (map, key, mass = 1) => map.set(key, (map.get(key) ?? 0) + mass);
  enumerate(alphabet, guess.length, secret => {
    total++;
    const marks = [...guess].map((d, i) => d === secret[i] ? 2 : secret.includes(d) ? 1 : 0);
    add(easy, marks.join(''));
    add(medium, `${marks.filter(v => v === 2).length}:${marks.filter(v => v === 1).length}`);
    let index = marks.indexOf(2), status = 'hit';
    if (index >= 0) hit[index]++;
    else {
      index = marks.indexOf(1); status = 'blow';
      if (index >= 0) blow[index]++;
      else none++;
    }
    if (secret === guess) { add(outputs, 'win'); return; }
    if (index < 0) { add(outputs, 'none'); return; }
    const hints = HINTS.filter(h => h.digits.includes(Number(guess[index])));
    noiseSum += Math.log2(hints.length);
    for (const hint of hints) add(outputs, `${status}:${hint.message}`, 1 / hints.length);
  });
  const entropy = map => [...map.values()].reduce((sum, c) => sum - c / total * Math.log2(c / total), 0);
  return {
    total, hit, blow, none, outputEntropyBits: entropy(outputs),
    hintNoiseBits: noiseSum / total, mutualInformationBits: entropy(outputs) - noiseSum / total,
    easyBits: entropy(easy), mediumBits: entropy(medium)
  };
}

test('selection formulas match independent enumeration, including crowded and tiny spaces', () => {
  const counts = api('openingSelectionCounts');
  for (const [length, alphabetSize] of [[1, 1], [2, 3], [3, 5], [4, 4], [4, 10]]) {
    const expected = directOpening('0123456'.slice(0, length), alphabetSize);
    assert.deepEqual(counts(length, alphabetSize), {
      total: expected.total, hit: expected.hit, blow: expected.blow, none: expected.none
    });
  }
});

test('decimal code counts and leftmost first-turn partitions are exact', () => {
  const counts = api('openingSelectionCounts');
  assert.deepEqual(counts(4), {
    total: 5040, hit: [504, 448, 399, 356], blow: [1197, 846, 570, 360], none: 360
  });
  assert.deepEqual(counts(5), {
    total: 30240, hit: [3024, 2688, 2394, 2136, 1909],
    blow: [8544, 5005, 2680, 1260, 480], none: 120
  });
  assert.deepEqual(counts(7), {
    total: 604800, hit: [60480, 53760, 47880, 42720, 38180, 34176, 30637],
    blow: [205056, 70677, 18444, 2790, 0, 0, 0], none: 0
  });
});

test('information subtracts random hint entropy and treats immediate victory separately', () => {
  const analyze = api('analyzeOpening');
  const expected = directOpening('314', 5), actual = analyze('314', { alphabetSize: 5 });
  assert.equal(actual.totalCodes, expected.total);
  close(actual.modes.easy.mutualInformationBits, expected.easyBits);
  close(actual.modes.medium.mutualInformationBits, expected.mediumBits);
  close(actual.modes.difficult.outputEntropyBits, expected.outputEntropyBits);
  close(actual.modes.difficult.hintNoiseBits, expected.hintNoiseBits);
  close(actual.modes.difficult.mutualInformationBits, expected.mutualInformationBits);
  close(analyze('0', { alphabetSize: 1 }).modes.difficult.mutualInformationBits, 0);
  close(analyze('0', { alphabetSize: 1 }).modes.difficult.hintNoiseBits, 0);
});

test('all three canonical openings reproduce exact information values', () => {
  const analyze = api('analyzeOpening');
  for (const [guess, easy, medium, difficult] of [
    ['0123', 5.109147796066474, 2.77115216575502, 2.3276129666689744],
    ['01234', 6.678738745627728, 3.0549286238368487, 2.22458724853566],
    ['0123456', 8.691533675729765, 3.077499994985671, 2.1577445220245437]
  ]) {
    const result = analyze(guess);
    close(result.modes.easy.mutualInformationBits, easy);
    close(result.modes.medium.mutualInformationBits, medium);
    close(result.modes.difficult.mutualInformationBits, difficult);
    close(result.modes.difficult.posteriorEntropyBits,
      result.priorEntropyBits - difficult);
  }
});

test('bounded opening search agrees with exhaustive small-space scoring', () => {
  const search = api('searchCrypticOpenings'), analyze = api('analyzeOpening');
  const scores = [];
  enumerate(['0', '1', '2', '3'], 2, guess => scores.push({
    guess, value: directOpening(guess, 4).mutualInformationBits
  }));
  const result = search({ length: 2, alphabetSize: 4 });
  assert.equal(result.searched, 12);
  assert.equal(result.totalGuesses, 12);
  assert.equal(result.complete, true);
  close(result.best.mutualInformationBits, Math.max(...scores.map(s => s.value)));
  close(result.worst.mutualInformationBits, Math.min(...scores.map(s => s.value)));
  const partial = search({ length: 2, alphabetSize: 4, maxGuesses: 3 });
  assert.equal(partial.searched, 3);
  assert.equal(partial.complete, false);
  const prefix = ['01', '02', '03'].map(guess => analyze(guess, { alphabetSize: 4 }).modes.difficult.mutualInformationBits);
  close(partial.best.mutualInformationBits, Math.max(...prefix));
});

test('four-digit exhaustive opening maximum is a first-turn information result', () => {
  const result = api('searchCrypticOpenings')({ length: 4 });
  assert.equal(result.complete, true);
  assert.equal(result.searched, 5040);
  assert.equal(result.best.guess, '6859');
  close(result.best.mutualInformationBits, 2.7626910943942025);
  close(result.worst.mutualInformationBits, 2.196988951640956);
});

test('constant-hint counts support the five-digit impossibility certificate', () => {
  const constant = api('constantHintFirstCounts'), capacity = api('treeCapacity');
  const result = constant({ length: 5, insideAlphabetSize: 6, outsideAlphabetSize: 4 });
  assert.equal(result.totalCodes, 720);
  assert.deepEqual(result.rows, [
    { inside: 1, hit: 120, blow: 480, none: 120, win: 0 },
    { inside: 2, hit: 216, blow: 504, none: 0, win: 0 },
    { inside: 3, hit: 294, blow: 426, none: 0, win: 0 },
    { inside: 4, hit: 358, blow: 362, none: 0, win: 0 },
    { inside: 5, hit: 410, blow: 309, none: 0, win: 1 }
  ]);
  const nextCapacity = Number(capacity(3, 6)), lastCapacity = Number(capacity(3, 5));
  assert.equal(nextCapacity, 364); assert.equal(lastCapacity, 121);
  for (const row of result.rows.filter(row => row.inside !== 4)) {
    assert.ok(Math.max(row.hit, row.blow, row.none) > nextCapacity);
  }
  assert.ok(1 + 2 * lastCapacity < 362);
  assert.ok(362 - 120 - 120 > lastCapacity);
});

test('constant-hint formula agrees with an independent enumeration of every guess shape', () => {
  const constant = api('constantHintFirstCounts');
  for (const length of [4, 5]) {
    const result = constant({ length, insideAlphabetSize: 6, outsideAlphabetSize: 4 });
    for (const row of result.rows) {
      const guess = '012345'.slice(0, row.inside) + '6789'.slice(0, length - row.inside);
      const expected = { inside: row.inside, hit: 0, blow: 0, none: 0, win: 0 };
      enumerate(['0', '1', '2', '3', '4', '5'], length, secret => {
        if (secret === guess) expected.win++;
        else if ([...guess].some((d, i) => d === secret[i])) expected.hit++;
        else if ([...guess].some(d => secret.includes(d))) expected.blow++;
        else expected.none++;
      });
      assert.deepEqual(row, expected);
    }
  }
});

test('capacity bounds prove at least seven, eight, and nine turns are necessary for worst-case guarantees', () => {
  const capacity = api('treeCapacity'), constant = api('constantHintFirstCounts');
  assert.equal(capacity(3, 0), 0n); assert.equal(capacity(1, 7), 7n);
  assert.equal(capacity(7, 7), 137257n);
  assert.equal(capacity(5, 7), 19531n);
  assert.equal(capacity(5, 8), 97656n);
  assert.ok(capacity(5, 8) < 181440n); // 9P7, with two admissible cached hints.
  for (const row of constant({ length: 4, insideAlphabetSize: 6, outsideAlphabetSize: 4 }).rows) {
    assert.ok(BigInt(Math.max(row.hit, row.blow, row.none)) > capacity(3, 5));
  }
  // The actual catalog admits every cache assignment used by these proofs.
  const fibonacci = HINTS.find(h => h.message === 'Compare nella successione di Fibonacci.');
  const roman = HINTS.find(h => h.message.includes("caduta dell'Impero romano d'Occidente"));
  assert.deepEqual([...fibonacci.digits].sort((a, b) => a - b), [0, 1, 2, 3, 5, 8]);
  assert.deepEqual([...new Set([...fibonacci.digits, ...roman.digits])].sort((a, b) => a - b),
    [0, 1, 2, 3, 4, 5, 6, 7, 8]);
});

test('analysis rejects invalid spaces, guesses, and work budgets before a search', () => {
  assert.throws(() => api('openingSelectionCounts')(8), /length|space/i);
  assert.throws(() => api('openingSelectionCounts')(4, 3), /length|space/i);
  assert.throws(() => api('analyzeOpening')('0012'), /guess|code/i);
  assert.throws(() => api('searchCrypticOpenings')({ length: 4, maxGuesses: 0 }), /budget|limit/i);
  assert.throws(() => api('treeCapacity')(0, 7), /branch|capacity/i);
  assert.throws(() => api('treeCapacity')(3, -1), /turn|capacity/i);
});
