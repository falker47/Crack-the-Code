// Read-only evidence verification. Archive source is hashed, never executed.
import { createReadStream, readFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createGunzip, gunzipSync } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { StringDecoder } from 'node:string_decoder';
import { isDeepStrictEqual } from 'node:util';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CodeSpace } from './core.mjs';
import { HINTS, CONFIGURATIONS } from './catalog.mjs';
import { STRATEGIES } from './solver.mjs';
import { runTrial } from './simulate.mjs';
import { summarize } from './statistics.mjs';

const SOURCE_FILES = ['data.js', 'script.js', 'analysis/catalog.mjs', 'analysis/random.mjs',
  'analysis/core.mjs', 'analysis/engine.mjs', 'analysis/belief.mjs', 'analysis/solver.mjs',
  'analysis/statistics.mjs', 'analysis/simulate.mjs'];
const MANIFEST_SOURCE_FILES = SOURCE_FILES.filter(file =>
  !['analysis/catalog.mjs', 'analysis/statistics.mjs'].includes(file));
const DEFAULT_PREFIXES = [4, 5, 7].map(length =>
  fileURLToPath(new URL(`./results/length${length}`, import.meta.url)));
const DEFAULT_SNAPSHOT = fileURLToPath(new URL('./results/source-v1.json.gz', import.meta.url));
export const VERIFICATION_LIMITS = Object.freeze({
  prefixes: 9, gamesPerCell: 10000, totalRows: 360000,
  manifestBytes: 8 * 1024 ** 2, snapshotBytes: 2 * 1024 ** 2,
  traceBytes: 256 * 1024 ** 2, lineBytes: 64 * 1024,
});

function requireTrue(condition, message) { if (!condition) throw new Error(message); }
function equal(actual, expected, message) { requireTrue(isDeepStrictEqual(actual, expected), message); }
function exactKeys(object, expected, label) {
  requireTrue(object !== null && typeof object === 'object' && !Array.isArray(object), label);
  equal(Object.keys(object).sort(), [...expected].sort(), label);
}
function integer(value, min, max) { return Number.isSafeInteger(value) && value >= min && value <= max; }
function legalCode(code, length) {
  return typeof code === 'string' && code.length === length && /^[0-9]+$/.test(code)
    && new Set(code).size === length;
}
function sha256(content) { return createHash('sha256').update(content).digest('hex'); }
function readBounded(file, limit) {
  requireTrue(statSync(file).size <= limit, `File byte limit exceeded: ${file}`);
  return readFileSync(file);
}

function readSnapshot(file) {
  const bytes = readBounded(file, VERIFICATION_LIMITS.snapshotBytes);
  const decoded = file.endsWith('.gz')
    ? gunzipSync(bytes, { maxOutputLength: VERIFICATION_LIMITS.snapshotBytes }) : bytes;
  const snapshot = JSON.parse(decoded.toString('utf8'));
  requireTrue(snapshot.schema === 1, 'Unsupported source snapshot schema');
  exactKeys(snapshot.files, SOURCE_FILES, 'Source snapshot must contain the ten collection sources');
  for (const [name, entry] of Object.entries(snapshot.files)) {
    requireTrue(typeof entry.content === 'string' && /^[a-f0-9]{64}$/.test(entry.sha256),
      `Invalid source snapshot entry: ${name}`);
    equal(sha256(entry.content), entry.sha256, `Source snapshot digest mismatch: ${name}`);
  }
  return snapshot;
}

function validateManifest(manifest, snapshot, seenCells) {
  requireTrue(manifest.schema === 1 && manifest.status === 'complete', 'Experiment status must be complete (schema 1)');
  const options = manifest.options;
  requireTrue(options && integer(options.games, 1, VERIFICATION_LIMITS.gamesPerCell),
    `Declared games exceed limit 1..${VERIFICATION_LIMITS.gamesPerCell}`);
  requireTrue(typeof manifest.seed === 'string' && manifest.seed.length > 0 && manifest.seed === options.seed,
    'Manifest seed mismatch');
  requireTrue(Array.isArray(options.levels) && options.levels.length > 0 &&
    options.levels.every(level => integer(level, 1, 9)) && new Set(options.levels).size === options.levels.length,
  'Invalid or duplicate declared levels');
  requireTrue(Array.isArray(options.strategies) && options.strategies.length > 0 &&
    options.strategies.every(strategy => STRATEGIES.includes(strategy)) &&
    new Set(options.strategies).size === options.strategies.length, 'Invalid or duplicate declared strategies');
  requireTrue(integer(options.guessSample, 1, 512) && integer(options.secretSample, 1, 8192) &&
    options.guessSample * options.secretSample <= 1048576, 'Replay scoring work limit exceeded');
  exactKeys(manifest.source, MANIFEST_SOURCE_FILES, 'Manifest collection source schema mismatch');
  for (const [file, digest] of Object.entries(manifest.source)) {
    equal(digest, snapshot.files[file].sha256, `Manifest/source snapshot hash mismatch: ${file}`);
  }
  requireTrue(Array.isArray(manifest.results) &&
    manifest.results.length === options.levels.length * options.strategies.length, 'Manifest cell count mismatch');
  for (const result of manifest.results) {
    const configuration = CONFIGURATIONS.find(c => c.level === result.level);
    requireTrue(configuration && options.levels.includes(result.level) && options.strategies.includes(result.strategy),
      'Undeclared experiment cell');
    equal({ level: result.level, length: result.length, mode: result.mode, name: result.name }, configuration,
      'Manifest configuration mismatch');
    equal(result.games, options.games, 'Manifest game count mismatch');
    const key = `${result.level}:${result.strategy}`;
    requireTrue(!seenCells.has(key), `Duplicate experiment cell: ${key}`);
    seenCells.add(key);
  }
}

// This checks public histories directly from strings and sets. It deliberately
// does not call evaluate(), crypticSelection(), createGame(), or Belief.
function validateRow(row, result, trial, space, report) {
  const label = `level ${result.level}/${result.strategy}/trial ${trial}`;
  exactKeys(row, ['level', 'length', 'mode', 'strategy', 'trial', 'secret', 'won',
    'attempts', 'residual', 'scoredPairs', 'history', 'decisions'], `${label}: trial schema mismatch`);
  equal([row.level, row.length, row.mode, row.strategy, row.trial],
    [result.level, result.length, result.mode, result.strategy, trial], `${label}: cell/trial sequence mismatch`);
  requireTrue(legalCode(row.secret, row.length), `${label}: illegal secret`);
  requireTrue(integer(row.attempts, 1, 7) && Array.isArray(row.history) && row.history.length === row.attempts,
    `${label}: attempts/history mismatch`);
  requireTrue(integer(row.residual, 1, space.size) && typeof row.won === 'boolean', `${label}: invalid result`);
  requireTrue(integer(row.scoredPairs, 0, Number.MAX_SAFE_INTEGER) && Array.isArray(row.decisions) &&
    row.decisions.length <= 7, `${label}: invalid work/decision record`);
  const confirmed = new Set(), cache = new Map();
  let previous = space.size;
  for (const [index, turn] of row.history.entries()) {
    const turnLabel = `${label}/turn ${index + 1}`;
    exactKeys(turn, ['guess', 'observation', 'candidates'], `${turnLabel}: turn schema mismatch`);
    requireTrue(legalCode(turn.guess, row.length), `${turnLabel}: illegal guess`);
    requireTrue(integer(turn.candidates, 1, previous), `${turnLabel}: residual bounds/monotonicity mismatch`);
    previous = turn.candidates;
    const observation = turn.observation;
    exactKeys(observation, ['attempt', 'feedback', 'won', 'terminal'], `${turnLabel}: public observation schema mismatch`);
    equal(observation.attempt, index + 1, `${turnLabel}: attempt mismatch`);
    equal(observation.won, turn.guess === row.secret, `${turnLabel}: victory mismatch`);
    equal(observation.terminal, observation.won || index === 6, `${turnLabel}: terminal rule mismatch`);
    equal(observation.terminal, index === row.history.length - 1, `${turnLabel}: terminal position mismatch`);
    if (observation.won) equal(turn.candidates, 1, `${turnLabel}: winning residual mismatch`);
    const marks = [...turn.guess].map((digit, position) =>
      row.secret[position] === digit ? 2 : row.secret.includes(digit) ? 1 : 0);
    const feedback = observation.feedback;
    if (row.mode === 'easy') {
      equal(feedback, { kind: 'full', marks }, `${turnLabel}: public full feedback mismatch`);
    } else if (row.mode === 'medium') {
      equal(feedback, { kind: 'summary', hit: marks.filter(mark => mark === 2).length,
        blow: marks.filter(mark => mark === 1).length, misses: marks.filter(mark => mark === 0).length },
      `${turnLabel}: public summary feedback mismatch`);
    } else {
      const hits = [...turn.guess].filter((digit, position) =>
        row.secret[position] === digit && !confirmed.has(digit));
      const members = [...turn.guess].filter(digit => row.secret.includes(digit) && !confirmed.has(digit));
      const selected = hits[0] ?? members[0];
      if (selected === undefined) {
        equal(feedback, { kind: 'cryptic', status: confirmed.size ? 'none-confirmed' : 'none' },
          `${turnLabel}: public cryptic no-information feedback mismatch`);
      } else {
        exactKeys(feedback, ['kind', 'status', 'hint'], `${turnLabel}: public cryptic feedback schema mismatch`);
        equal([feedback.kind, feedback.status], ['cryptic', hits.length ? 'hit' : 'blow'],
          `${turnLabel}: cryptic selector status mismatch`);
        const hint = HINTS.find(candidate => candidate.message === feedback.hint);
        requireTrue(hint?.digits.includes(Number(selected)), `${turnLabel}: hint eligibility mismatch`);
        if (cache.has(selected)) equal(feedback.hint, cache.get(selected), `${turnLabel}: hint cache mismatch`);
        cache.set(selected, feedback.hint);
        if (hits.length) confirmed.add(selected);
      }
    }
    report.turns++;
  }
  equal(row.won, row.history.at(-1).observation.won, `${label}: final victory mismatch`);
  equal(row.residual, row.history.at(-1).candidates, `${label}: final residual mismatch`);
  if (!row.won) equal(row.attempts, 7, `${label}: loss before seventh attempt`);
}

function verifyCell(rows, result, manifest, space, replay, report) {
  const label = `level ${result.level}/${result.strategy}`;
  const recalculated = summarize(rows);
  equal(recalculated, Object.fromEntries(Object.keys(recalculated).map(key => [key, result[key]])),
    `${label}: summary mismatch`);
  equal(rows.reduce((sum, row) => sum + row.scoredPairs, 0), result.scoredPairs, `${label}: scoredPairs mismatch`);
  report.summaryMatches++;
  if (replay) {
    const trials = new Set([0, Math.floor((rows.length - 1) / 2), rows.length - 1]);
    for (const trial of trials) {
      const { level, mode, length, strategy, ...recorded } = rows[trial];
      const actual = runTrial({ space, mode, strategy, seed: manifest.seed, trial,
        guessSample: manifest.options.guessSample, secretSample: manifest.options.secretSample });
      equal(actual, recorded, `${label}/trial ${trial}: replay mismatch`);
      report.replays++;
    }
  }
  report.cells++;
}

async function readTrace(prefix, accept) {
  const file = existsSync(prefix + '.jsonl') ? prefix + '.jsonl' : prefix + '.jsonl.gz';
  let totalBytes = 0, pending = '', lineNumber = 0;
  const decoder = new StringDecoder('utf8');
  const line = text => {
    lineNumber++;
    requireTrue(Buffer.byteLength(text) <= VERIFICATION_LIMITS.lineBytes, `${file}: JSONL line byte limit exceeded`);
    if (!text.trim()) return;
    let row;
    try { row = JSON.parse(text); } catch { throw new Error(`${file}:${lineNumber}: invalid JSONL`); }
    accept(row);
  };
  await pipeline(createReadStream(file), ...(file.endsWith('.gz') ? [createGunzip()] : []), async source => {
    for await (const chunk of source) {
      totalBytes += chunk.length;
      requireTrue(totalBytes <= VERIFICATION_LIMITS.traceBytes, `${file}: uncompressed trace byte limit exceeded`);
      pending += decoder.write(chunk);
      let newline;
      while ((newline = pending.indexOf('\n')) >= 0) {
        line(pending.slice(0, newline));
        pending = pending.slice(newline + 1);
      }
      requireTrue(Buffer.byteLength(pending) <= VERIFICATION_LIMITS.lineBytes, `${file}: JSONL line byte limit exceeded`);
    }
    pending += decoder.end();
    if (pending) line(pending);
  });
  return totalBytes;
}

/** Stream one cell at a time; retain at most gamesPerCell rows, not all traces. */
export async function verifyEvidence(prefixes = DEFAULT_PREFIXES, { snapshotPath = DEFAULT_SNAPSHOT, replay = true } = {}) {
  const started = performance.now(), cpuStarted = process.cpuUsage();
  requireTrue(Array.isArray(prefixes) && integer(prefixes.length, 1, VERIFICATION_LIMITS.prefixes),
    `Input prefix limit is 1..${VERIFICATION_LIMITS.prefixes}`);
  prefixes = prefixes.map(prefix => resolve(prefix));
  requireTrue(new Set(prefixes).size === prefixes.length, 'Duplicate input prefixes');
  const snapshot = readSnapshot(snapshotPath), seenCells = new Set(), spaces = new Map();
  const report = { status: 'verified', files: prefixes.length, rows: 0, turns: 0, cells: 0,
    summaryMatches: 0, replays: 0, replayEnabled: replay, sourceFilesVerified: SOURCE_FILES.length,
    traceBytes: 0 };
  let seed;
  for (const prefix of prefixes) {
    const manifest = JSON.parse(readBounded(prefix + '.json', VERIFICATION_LIMITS.manifestBytes).toString('utf8'));
    validateManifest(manifest, snapshot, seenCells);
    if (seed !== undefined) equal(manifest.seed, seed, 'Experiment seeds differ');
    seed = manifest.seed;
    const expectedRows = manifest.results.length * manifest.options.games;
    requireTrue(report.rows + expectedRows <= VERIFICATION_LIMITS.totalRows, 'Total row limit exceeded');
    let cellIndex = 0, fileRows = 0, rows = [];
    report.traceBytes += await readTrace(prefix, row => {
      const result = manifest.results[cellIndex];
      requireTrue(result, `${prefix}: trace row count mismatch (extra rows)`);
      if (!spaces.has(result.length)) spaces.set(result.length, new CodeSpace(result.length));
      const space = spaces.get(result.length);
      validateRow(row, result, rows.length, space, report);
      rows.push(row); fileRows++; report.rows++;
      if (rows.length === manifest.options.games) {
        verifyCell(rows, result, manifest, space, replay, report);
        rows = []; cellIndex++;
      }
    });
    equal(fileRows, expectedRows, `${prefix}: trace row count mismatch (${fileRows} recorded, ${expectedRows} declared)`);
    equal(cellIndex, manifest.results.length, `${prefix}: incomplete experiment cells`);
  }
  const cpu = process.cpuUsage(cpuStarted);
  return { ...report, seconds: (performance.now() - started) / 1000,
    cpuSeconds: (cpu.user + cpu.system) / 1e6, peakRssMB: process.resourceUsage().maxRSS / 1024 };
}

function parseArgs(args) {
  const options = {}, prefixes = [];
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--no-replay') options.replay = false;
    else if (argument === '--snapshot' && args[index + 1] && !args[index + 1].startsWith('--')) {
      options.snapshotPath = resolve(args[++index]);
    } else if (argument === '--help') options.help = true;
    else if (argument.startsWith('--')) throw new Error(`Unknown or incomplete argument: ${argument}`);
    else prefixes.push(argument);
  }
  return { prefixes: prefixes.length ? prefixes : DEFAULT_PREFIXES, options };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { prefixes, options } = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log('Usage: node analysis/verify.mjs [--no-replay] [--snapshot source-v1.json.gz] [run-prefix ...]\n'
        + 'Defaults: the three archived length4/length5/length7 prefixes; reads .jsonl, otherwise .jsonl.gz.\n'
        + 'Checks every public history and summary; replays trials 0, floor((games-1)/2), games-1 by default.\n'
        + 'Limits: 9 prefixes, 10000 games/cell, 360000 total rows, 256 MiB decoded/trace, 64 KiB/line;\n'
        + '8 MiB/manifest, 2 MiB decoded/snapshot; original solver scoring limits apply to replays.\n'
        + 'Input rows must follow manifest cell order and ascending trial IDs. Reads only; failure exits nonzero.');
    } else console.log(JSON.stringify(await verifyEvidence(prefixes, options)));
  } catch (error) { console.error(`Verification failed: ${error.message}`); process.exitCode = 1; }
}
