import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CodeSpace } from '../../analysis/core.mjs';
import { CONFIGURATIONS } from '../../analysis/catalog.mjs';
import { runTrial } from '../../analysis/simulate.mjs';
import { summarize } from '../../analysis/statistics.mjs';

const files = ['data.js', 'script.js', 'analysis/catalog.mjs', 'analysis/random.mjs',
  'analysis/core.mjs', 'analysis/engine.mjs', 'analysis/belief.mjs', 'analysis/solver.mjs',
  'analysis/statistics.mjs', 'analysis/simulate.mjs'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

function fixture(t, compressed = true) {
  const directory = mkdtempSync(join(tmpdir(), 'ctc-evidence-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const prefix = join(directory, 'small'), snapshotPath = join(directory, 'source-v1.json.gz');
  const snapshot = { schema: 1, files: Object.fromEntries(files.map(file => {
    const content = readFileSync(new URL('../../' + file, import.meta.url), 'utf8');
    return [file, { sha256: hash(content), content }];
  })) };
  const options = { games: 3, seed: 'evidence-regression', guessSample: 8,
    secretSample: 32, levels: [1, 7], strategies: ['information'] };
  const rows = [], results = [], space = new CodeSpace(4);
  for (const configuration of CONFIGURATIONS.filter(c => options.levels.includes(c.level))) {
    const trials = Array.from({ length: options.games }, (_, trial) => runTrial({
      space, mode: configuration.mode, strategy: 'information', trial, ...options,
    })).map(row => JSON.parse(JSON.stringify(row)));
    rows.push(...trials.map(row => ({ level: configuration.level, length: 4,
      mode: configuration.mode, strategy: 'information', ...row })));
    results.push({ ...configuration, strategy: 'information', ...summarize(trials),
      scoredPairs: trials.reduce((sum, row) => sum + row.scoredPairs, 0) });
  }
  const manifest = { schema: 1, status: 'complete', seed: options.seed, options, results,
    source: Object.fromEntries(files.filter(file => !['analysis/catalog.mjs', 'analysis/statistics.mjs'].includes(file))
      .map(file => [file, snapshot.files[file].sha256])) };
  const saveRows = values => {
    const bytes = Buffer.from(values.map(row => JSON.stringify(row)).join('\n') + '\n');
    writeFileSync(prefix + (compressed ? '.jsonl.gz' : '.jsonl'), compressed ? gzipSync(bytes) : bytes);
  };
  const saveManifest = () => writeFileSync(prefix + '.json', JSON.stringify(manifest));
  const saveSnapshot = () => writeFileSync(snapshotPath, gzipSync(JSON.stringify(snapshot)));
  saveRows(rows); saveManifest(); saveSnapshot();
  const run = (...args) => spawnSync(process.execPath,
    ['analysis/verify.mjs', '--snapshot', snapshotPath, ...args, prefix],
    { encoding: 'utf8', timeout: 30000 });
  return { directory, prefix, rows, manifest, snapshot, saveRows, saveManifest, saveSnapshot, run };
}

for (const compressed of [false, true]) {
  test(`verification CLI checks complete ${compressed ? 'gzip' : 'plain'} evidence without changing files`, t => {
    const f = fixture(t, compressed);
    const before = Object.fromEntries(readdirSync(f.directory).map(file =>
      [file, hash(readFileSync(join(f.directory, file)))]));
    const run = f.run();
    assert.equal(run.status, 0, run.stderr);
    const report = JSON.parse(run.stdout);
    assert.equal(report.status, 'verified');
    assert.equal(report.rows, 6);
    assert.equal(report.cells, 2);
    assert.equal(report.summaryMatches, 2);
    assert.equal(report.replays, 6);
    assert.equal(report.sourceFilesVerified, 10);
    assert.deepEqual(Object.fromEntries(readdirSync(f.directory).map(file =>
      [file, hash(readFileSync(join(f.directory, file)))])), before);
  });
}

test('verification rejects a complete manifest whose trace lost whole final records', t => {
  const f = fixture(t);
  f.saveRows(f.rows.slice(0, -1));
  const run = f.run('--no-replay');
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /row count mismatch/i);
});

test('verification rejects private fields added to an otherwise plausible public observation', t => {
  const f = fixture(t);
  f.rows[0].history[0].observation.feedback.selectedDigit = 0;
  f.saveRows(f.rows);
  const run = f.run('--no-replay');
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /feedback|schema/i);
});

test('verification recalculates summaries instead of trusting manifest wins', t => {
  const f = fixture(t);
  f.manifest.results[0].wins++;
  f.saveManifest();
  const run = f.run('--no-replay');
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /summary mismatch/i);
});

test('verification rejects source content changed without its recorded digest', t => {
  const f = fixture(t);
  f.snapshot.files['analysis/engine.mjs'].content += '\n// altered\n';
  f.saveSnapshot();
  const run = f.run('--no-replay');
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /snapshot digest mismatch/i);
});

test('sample replay compares decisions as well as the already checked game history', t => {
  const f = fixture(t);
  f.rows[0].decisions[0].score.information += 1;
  f.saveRows(f.rows);
  const withoutReplay = f.run('--no-replay');
  assert.equal(withoutReplay.status, 0, withoutReplay.stderr);
  assert.equal(JSON.parse(withoutReplay.stdout).replays, 0);
  const replay = f.run();
  assert.notEqual(replay.status, 0);
  assert.match(replay.stderr, /replay mismatch/i);
});

test('verification rejects an excessive declared game budget before reading trial records', t => {
  const f = fixture(t);
  f.manifest.options.games = 10001;
  f.saveManifest();
  const run = f.run('--no-replay');
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /games.*limit/i);
});
