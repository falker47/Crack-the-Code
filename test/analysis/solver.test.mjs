import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CodeSpace } from '../../analysis/core.mjs';
import { Belief } from '../../analysis/belief.mjs';
import { Solver, scoreGuess } from '../../analysis/solver.mjs';
import { runTrial } from '../../analysis/simulate.mjs';
import { wilson, summarize } from '../../analysis/statistics.mjs';

test('solver module cannot import engine and public interface takes no secret', () => {
  const source=readFileSync(new URL('../../analysis/solver.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(source,/from\s+['"].*(?:engine|script)/);
  const space=new CodeSpace(2,4);
  assert.throws(()=>new Solver(space,'easy',{secret:'01'}),/option|secret|unexpected/i);
  const a=new Solver(space,'easy',{strategy:'information',seed:'same'});
  const b=new Solver(space,'easy',{strategy:'information',seed:'same'});
  assert.equal(a.nextGuess(),b.nextGuess());
});

test('noiseless information equals response entropy; noisy hints subtract emission entropy', () => {
  const space=new CodeSpace(2,3);
  const ids=Array.from({length:space.size},(_,i)=>i);
  for(const mode of ['easy','medium','difficult']) {
    const belief=new Belief(space,mode);
    const s=scoreGuess(belief,space.idOf('01'),ids);
    assert.ok(s.information>=0);
    assert.ok(s.information<=Math.log2(space.size)+1e-12);
    if(mode==='difficult') {
      assert.ok(s.noiseEntropy>0);
      assert.ok(s.information<s.responseEntropy);
    } else {
      assert.equal(s.noiseEntropy,0);
      assert.equal(s.information,s.responseEntropy);
    }
    assert.ok(s.expectedRemaining>=1-1e-12); // floating point sum of six 1/6 masses
  }
});

test('CLI runs a complete experiment and refuses to overwrite evidence', () => {
  const dir=mkdtempSync(join(tmpdir(),'ctc-cli-'));
  try {
    const prefix=join(dir,'run');
    const args=['analysis/simulate.mjs','--games','2','--levels','1','--strategies','information','--out',prefix];
    const run=spawnSync(process.execPath,args,{encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);
    const manifest=JSON.parse(readFileSync(prefix+'.json','utf8'));
    assert.equal(manifest.status,'complete');assert.equal(manifest.results[0].games,2);
    assert.equal(readFileSync(prefix+'.jsonl','utf8').trim().split('\n').length,2);
    const again=spawnSync(process.execPath,args,{encoding:'utf8'});
    assert.notEqual(again.status,0);assert.match(again.stderr,/EEXIST/);
  } finally {rmSync(dir,{recursive:true,force:true});}
});

for (const suffix of ['.json', '.jsonl.gz']) {
  test(`CLI preserves existing ${suffix} evidence even without an uncompressed trace`, () => {
    const dir=mkdtempSync(join(tmpdir(),'ctc-archive-'));
    try {
      const prefix=join(dir,'run'), evidence=Buffer.from('existing experiment evidence');
      writeFileSync(prefix+suffix,evidence);
      const run=spawnSync(process.execPath,['analysis/simulate.mjs','--games','1','--levels','1',
        '--strategies','random','--out',prefix],{encoding:'utf8'});
      assert.notEqual(run.status,0,'existing evidence must refuse a new run');
      assert.match(run.stderr,/EEXIST/);
      assert.deepEqual(readFileSync(prefix+suffix),evidence);
      assert.equal(existsSync(prefix+'.jsonl'),false,'no new partial trace on collision');
    } finally {rmSync(dir,{recursive:true,force:true});}
  });
}

test('fixed seeds replay complete games and each strategy respects all seven attempts', () => {
  const space=new CodeSpace(2,4);
  for(const strategy of ['random','elimination','expected','information']) {
    for(const mode of ['easy','medium','difficult']) {
      const options={space,mode,strategy,seed:'replay',trial:3,guessSample:8,secretSample:12};
      const a=runTrial(options),b=runTrial(options);
      assert.deepEqual(a,b);
      assert.ok(a.attempts<=7);
      assert.equal(a.history.length,a.attempts);
      assert.ok(a.residual>=1);
      assert.equal(new Set(a.history.map(x=>x.guess)).size,a.attempts);
      assert.equal(a.won,a.history.at(-1).observation.won);
    }
  }
});

test('limits reject unsafe requests rather than silently weakening policies', () => {
  const space=new CodeSpace(2,4);
  for(const opts of [{guessSample:0},{secretSample:-1},{guessSample:100000},{strategy:'optimal'}])
    assert.throws(()=>new Solver(space,'easy',opts),/limit|sample|strategy/i);
});

test('Wilson interval and attempts distribution have exact reference cases', () => {
  assert.deepEqual(wilson(0,0),null);
  const zero=wilson(0,100),all=wilson(100,100);
  assert.ok(Math.abs(zero.low)<1e-14);
  assert.ok(Math.abs(zero.high-0.0369934982)<1e-8);
  assert.ok(Math.abs(all.low-0.9630065018)<1e-8);
  const summary=summarize([{won:true,attempts:3,residual:1},{won:false,attempts:7,residual:10}]);
  assert.equal(summary.winRate,0.5);
  assert.equal(summary.meanAttemptsWins,3);
  assert.equal(summary.meanAttemptsAll,5);
  assert.equal(summary.distribution.loss,1);
  assert.equal(summary.distribution[3],1);
});
