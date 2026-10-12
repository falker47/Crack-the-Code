// Exact first-turn combinatorial and information analysis. No engine or secret.
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { HINTS, HINT_IDS } from './catalog.mjs';
import { CodeSpace, deterministicKey, pack, permutations, validateCode } from './core.mjs';

const MAX_GUESSES = 604800;
const HINT_LOGS = HINT_IDS.map(ids => Math.log2(ids.length));

function validateSpace(length, alphabetSize) {
  if (!Number.isInteger(length) || length < 1 || length > 7 ||
      !Number.isInteger(alphabetSize) || alphabetSize < length || alphabetSize > 10) {
    throw new RangeError('Space limit: length 1..7, alphabetSize length..10');
  }
}
function falling(n, k) { return k > n ? 0 : permutations(n, k); }
function choose(n, k) {
  let value = 1;
  for (let i = 1; i <= k; i++) value = value * (n - i + 1) / i;
  return value;
}
// Injections into an alphabet of size m, avoiding k specified fixed points.
function avoid(m, length, k) {
  let count = 0;
  for (let r = 0; r <= k; r++) {
    count += (r % 2 ? -1 : 1) * choose(k, r) * falling(m - r, length - r);
  }
  return count;
}

/** Integer counts before the first cryptic hint; hits include the winning code. */
export function openingSelectionCounts(length, alphabetSize = 10) {
  validateSpace(length, alphabetSize);
  const hit = [], blow = [];
  for (let j = 0; j < length; j++) {
    hit.push(avoid(alphabetSize - 1, length - 1, j));
    blow.push(avoid(alphabetSize - j, length, length - j) -
      avoid(alphabetSize - j - 1, length, length - j - 1));
  }
  return {
    total: permutations(alphabetSize, length), hit, blow,
    none: falling(alphabetSize - length, length)
  };
}

function deterministicMetrics(counts, total) {
  let entropy = 0, expectedCandidates = 0, possibleOutcomes = 0, maximumCandidates = 0;
  for (const count of counts) if (count) {
    const p = count / total;
    entropy -= p * Math.log2(p);
    expectedCandidates += p * count;
    maximumCandidates = Math.max(maximumCandidates, count);
    possibleOutcomes++;
  }
  return {
    outputEntropyBits: entropy, hintNoiseBits: 0, mutualInformationBits: entropy,
    posteriorEntropyBits: Math.log2(total) - entropy,
    expectedCandidates, maximumCandidates, possibleOutcomes
  };
}

function crypticMetrics(guess, counts,
  probability = new Float64Array(2 * HINTS.length + 2),
  support = new Uint32Array(2 * HINTS.length + 2)) {
  probability.fill(0); support.fill(0);
  const total = counts.total, length = guess.length;
  let noise = 0;
  for (let j = 0; j < length; j++) {
    const digit = Number(guess[j]), ids = HINT_IDS[digit];
    if (!ids.length) throw new Error(`Catalog has no hint for digit ${digit}`);
    // Victory is a separate public event. Its generated hint adds no information.
    const hitCount = counts.hit[j] - (j === 0 ? 1 : 0), blowCount = counts.blow[j];
    noise += (hitCount + blowCount) / total * HINT_LOGS[digit];
    for (const id of ids) {
      probability[id] += hitCount / total / ids.length;
      support[id] += hitCount;
      probability[HINTS.length + id] += blowCount / total / ids.length;
      support[HINTS.length + id] += blowCount;
    }
  }
  const none = 2 * HINTS.length, win = none + 1;
  probability[none] = counts.none / total; support[none] = counts.none;
  probability[win] = 1 / total; support[win] = 1;
  let entropy = 0, expectedCandidates = 0, maximumCandidates = 0, possibleOutcomes = 0;
  for (let i = 0; i < probability.length; i++) if (probability[i]) {
    entropy -= probability[i] * Math.log2(probability[i]);
    expectedCandidates += probability[i] * support[i];
    maximumCandidates = Math.max(maximumCandidates, support[i]);
    possibleOutcomes++;
  }
  return {
    outputEntropyBits: entropy, hintNoiseBits: noise,
    mutualInformationBits: entropy - noise,
    posteriorEntropyBits: Math.log2(total) - entropy + noise,
    expectedCandidates, maximumCandidates, possibleOutcomes
  };
}

/** Uniform prior and empty caches. Integer partitions; IEEE-754 logarithms. */
export function analyzeOpening(guess, { alphabetSize = 10 } = {}) {
  const length = typeof guess === 'string' ? guess.length : 0;
  validateSpace(length, alphabetSize);
  if (!validateCode(guess, length, alphabetSize)) throw new Error('Invalid opening guess');
  const selectionCounts = openingSelectionCounts(length, alphabetSize);
  const space = new CodeSpace(length, alphabetSize), packedGuess = pack(guess);
  const easy = new Uint32Array(3 ** length), medium = new Uint32Array((length + 1) ** 2);
  for (let id = 0; id < space.size; id++) {
    easy[deterministicKey(space, id, packedGuess, 'easy')]++;
    medium[deterministicKey(space, id, packedGuess, 'medium')]++;
  }
  return {
    guess, length, alphabetSize, totalCodes: space.size, priorEntropyBits: Math.log2(space.size),
    selectionCounts,
    modes: {
      easy: deterministicMetrics(easy, space.size),
      medium: deterministicMetrics(medium, space.size),
      difficult: crypticMetrics(guess, selectionCounts)
    }
  };
}

/** Scores a bounded lexicographic prefix. Only complete=true certifies extrema. */
export function searchCrypticOpenings({ length, alphabetSize = 10, maxGuesses = MAX_GUESSES }) {
  validateSpace(length, alphabetSize);
  if (!Number.isInteger(maxGuesses) || maxGuesses < 1 || maxGuesses > MAX_GUESSES) {
    throw new RangeError(`Opening work budget limit is 1..${MAX_GUESSES}`);
  }
  const counts = openingSelectionCounts(length, alphabetSize);
  const probability = new Float64Array(2 * HINTS.length + 2);
  const support = new Uint32Array(2 * HINTS.length + 2);
  const digits = new Uint8Array(length);
  let searched = 0, best = null, worst = null;
  function walk(depth, used) {
    if (searched === maxGuesses) return;
    if (depth === length) {
      const information = crypticMetrics(digits, counts, probability, support).mutualInformationBits;
      searched++;
      if (best === null || information > best.mutualInformationBits) {
        best = { guess: digits.join(''), mutualInformationBits: information };
      }
      if (worst === null || information < worst.mutualInformationBits) {
        worst = { guess: digits.join(''), mutualInformationBits: information };
      }
      return;
    }
    for (let digit = 0; digit < alphabetSize; digit++) if (!(used & (1 << digit))) {
      digits[depth] = digit;
      walk(depth + 1, used | (1 << digit));
      if (searched === maxGuesses) return;
    }
  }
  walk(0, 0);
  return {
    length, alphabetSize, searched, totalGuesses: counts.total,
    complete: searched === counts.total, order: 'lexicographic',
    objective: 'first-turn mutual information, including immediate victory', best, worst
  };
}

/** Upper bound on individually winning secrets in a fixed-cache decision tree. */
export function treeCapacity(branches, turns) {
  if (!Number.isInteger(branches) || branches < 1 || branches > 64 ||
      !Number.isInteger(turns) || turns < 0 || turns > 64) {
    throw new RangeError('Capacity limits: branches 1..64 and turns 0..64');
  }
  let capacity = 0n;
  for (let i = 0; i < turns; i++) capacity = 1n + BigInt(branches) * capacity;
  return capacity;
}

/** All secrets use the inside alphabet; all selected digits emit one fixed hint. */
export function constantHintFirstCounts({ length, insideAlphabetSize, outsideAlphabetSize }) {
  validateSpace(length, insideAlphabetSize);
  if (!Number.isInteger(outsideAlphabetSize) || outsideAlphabetSize < 0 ||
      insideAlphabetSize + outsideAlphabetSize > 10) {
    throw new RangeError('Outside alphabet size must keep the whole space at most 10');
  }
  const totalCodes = permutations(insideAlphabetSize, length), rows = [];
  for (let inside = Math.max(0, length - outsideAlphabetSize); inside <= length; inside++) {
    const withHit = totalCodes - avoid(insideAlphabetSize, length, inside);
    const none = falling(insideAlphabetSize - inside, length);
    const win = inside === length ? 1 : 0;
    rows.push({ inside, hit: withHit - win, blow: totalCodes - withHit - none, none, win });
  }
  return { length, insideAlphabetSize, outsideAlphabetSize, totalCodes, rows };
}

function parseArguments(argv) {
  const options = { lengths: [4, 5, 7], best: false, maxGuesses: MAX_GUESSES };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--best') options.best = true;
    else if (argv[i] === '--lengths' && argv[i + 1]) options.lengths = argv[++i].split(',').map(Number);
    else if (argv[i] === '--max-guesses' && argv[i + 1]) options.maxGuesses = Number(argv[++i]);
    else if (argv[i] === '--help') options.help = true;
    else throw new Error(`Unknown or incomplete argument: ${argv[i]}`);
  }
  if (!options.lengths.length || new Set(options.lengths).size !== options.lengths.length ||
      options.lengths.some(length => ![4, 5, 7].includes(length))) {
    throw new Error('--lengths must contain distinct values from 4,5,7');
  }
  if (!Number.isInteger(options.maxGuesses) || options.maxGuesses < 1 || options.maxGuesses > MAX_GUESSES) {
    throw new Error(`--max-guesses budget limit is 1..${MAX_GUESSES}`);
  }
  return options;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log('node analysis/openings.mjs [--best] [--lengths 4,5,7] [--max-guesses 604800]');
    } else {
      const report = {
        schema: 1,
        method: 'uniform-prior exact first-turn partitions; rational hint probabilities; IEEE-754 entropy',
        catalogSha256: createHash('sha256').update(JSON.stringify(HINTS)).digest('hex'),
        hintCountsByDigit: HINT_IDS.map(ids => ids.length),
        canonical: options.lengths.map(length => analyzeOpening('0123456'.slice(0, length))),
        searches: options.best ? options.lengths.map(length => searchCrypticOpenings({
          length, maxGuesses: options.maxGuesses
        })) : [],
        proofCounts: {
          constantHintFour: constantHintFirstCounts({ length: 4, insideAlphabetSize: 6, outsideAlphabetSize: 4 }),
          constantHintFive: constantHintFirstCounts({ length: 5, insideAlphabetSize: 6, outsideAlphabetSize: 4 }),
          ternaryFiveTurns: treeCapacity(3, 5).toString(),
          ternarySixTurns: treeCapacity(3, 6).toString(),
          fiveBranchesEightTurns: treeCapacity(5, 8).toString(),
          nineDigitAlphabetSevenPositions: permutations(9, 7)
        }
      };
      console.log(JSON.stringify(report, null, 2));
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
