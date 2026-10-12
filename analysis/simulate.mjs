import { mkdirSync, writeFileSync, appendFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import { CodeSpace, generateCode } from './core.mjs';
import { Solver, STRATEGIES, DEFAULT_LIMITS } from './solver.mjs';
import { createGame } from './engine.mjs';
import { createRng, deriveSeed } from './random.mjs';
import { CONFIGURATIONS } from './catalog.mjs';
import { summarize } from './statistics.mjs';

export function runTrial({space,mode,strategy,seed,trial,guessSample,secretSample}) {
  const trialSeed=`${seed}:${space.length}:${trial}`;
  // Secret stream is shared across modes/policies; it is never passed to Solver.
  const secret=generateCode(space.length,createRng(deriveSeed(trialSeed,'secret')),space.alphabetSize);
  const game=createGame({length:space.length,alphabetSize:space.alphabetSize,mode,secret,
    rng:createRng(deriveSeed(trialSeed,'hints'))});
  const solver=new Solver(space,mode,{strategy,seed:deriveSeed(trialSeed,`solver:${strategy}`),
    ...(guessSample!==undefined?{guessSample}:{}),...(secretSample!==undefined?{secretSample}:{})});
  const history=[];
  for(let attempt=1;attempt<=7;attempt++) {
    const guess=solver.nextGuess();
    const observation=game.submit(guess);
    solver.observe(guess,observation);
    history.push({guess,observation,candidates:solver.belief.count});
    if(observation.terminal)break;
  }
  // Secret recorded ONLY after play, for offline reproducibility/audit.
  return {trial,secret,won:history.at(-1).observation.won,attempts:history.length,
    residual:solver.belief.count,scoredPairs:solver.scoredPairs,history,decisions:solver.decisions};
}

function parseArgs(argv) {
  const args={games:100,seed:'ctc-2026-10-12-v1',out:'analysis/results/run',
    guessSample:DEFAULT_LIMITS.guessSample,secretSample:DEFAULT_LIMITS.secretSample,
    maxSeconds:1800,maxMemoryMB:512,strategies:STRATEGIES,levels:CONFIGURATIONS.map(c=>c.level)};
  const names={'games':'games','seed':'seed','out':'out','guess-sample':'guessSample','secret-sample':'secretSample',
    'max-seconds':'maxSeconds','max-memory-mb':'maxMemoryMB','strategies':'strategies','levels':'levels'};
  for(let i=0;i<argv.length;i+=2) {
    const key=names[argv[i]?.replace(/^--/,'')],value=argv[i+1];
    if(!key||value===undefined)throw new Error(`Unknown/incomplete argument ${argv[i]}`);
    args[key]=['seed','out'].includes(key)?value:key==='strategies'?value.split(','):key==='levels'?value.split(',').map(Number):Number(value);
  }
  for(const k of ['games','maxSeconds','maxMemoryMB'])if(!Number.isFinite(args[k])||args[k]<1)throw new Error(`Invalid ${k}`);
  if(!Number.isInteger(args.games)||args.games>100000)throw new Error('games limit is 1..100000');
  if(args.strategies.some(s=>!STRATEGIES.includes(s))||args.levels.some(l=>!Number.isInteger(l)||l<1||l>9))throw new Error('Invalid strategy/level');
  if(new Set(args.strategies).size!==args.strategies.length||new Set(args.levels).size!==args.levels.length)throw new Error('Duplicate configuration');
  // Validate policy limits before creating any output.
  new Solver(new CodeSpace(1,1),'easy',{guessSample:args.guessSample,secretSample:args.secretSample});
  return args;
}

export function runExperiment(options) {
  const start=performance.now(),cpuStart=process.cpuUsage();
  const output=resolve(options.out);
  mkdirSync(dirname(output),{recursive:true});
  // Refuse accidental overwrites. A failed/incomplete run remains explicit.
  for (const suffix of ['.json','.jsonl','.jsonl.gz']) {
    if (existsSync(output+suffix)) throw new Error(`EEXIST: experiment output already exists: ${output+suffix}`);
  }
  // Exclusive creation also prevents two concurrent runners sharing this prefix.
  writeFileSync(`${output}.jsonl`,'',{flag:'wx'});
  const manifest={schema:1,status:'running',seed:options.seed,options,
    method:'uniform seeded secrets; shared secret and sequential hint streams; independent solver streams; exact posterior filtering; bounded one-step scores',
    environment:{node:process.version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model},
    source:{},results:[]};
  for(const f of ['data.js','script.js','analysis/core.mjs','analysis/engine.mjs','analysis/belief.mjs','analysis/solver.mjs','analysis/simulate.mjs','analysis/random.mjs'])
    manifest.source[f]=createHash('sha256').update(readFileSync(new URL(`../${f}`,import.meta.url))).digest('hex');
  try {manifest.baseCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();}catch{/* usable outside git too */}
  let peakRss=process.memoryUsage().rss;
  const checkBudget=()=>{
    peakRss=Math.max(peakRss,process.memoryUsage().rss);
    if((performance.now()-start)/1000>options.maxSeconds)throw new Error('Experiment time budget exceeded');
    if(peakRss/1048576>options.maxMemoryMB)throw new Error('Experiment RSS memory budget exceeded');
  };
  try {
    for(const c of CONFIGURATIONS.filter(c=>options.levels.includes(c.level))) {
      const space=new CodeSpace(c.length);
      for(const strategy of options.strategies) {
        const rows=[],t0=performance.now(),cpu0=process.cpuUsage();
        for(let trial=0;trial<options.games;trial++) {
          checkBudget();
          const row=runTrial({space,mode:c.mode,strategy,seed:options.seed,trial,
            guessSample:options.guessSample,secretSample:options.secretSample});
          rows.push(row);
          appendFileSync(`${output}.jsonl`,JSON.stringify({level:c.level,mode:c.mode,length:c.length,strategy,...row})+'\n');
        }
        checkBudget();
        const cpu=process.cpuUsage(cpu0);
        const result={...c,strategy,...summarize(rows),seconds:(performance.now()-t0)/1000,
          cpuSeconds:(cpu.user+cpu.system)/1e6,peakRssMB:peakRss/1048576,
          spaceBytes:space.byteLength,scoredPairs:rows.reduce((n,t)=>n+t.scoredPairs,0)};
        manifest.results.push(result);
        writeFileSync(`${output}.json`,JSON.stringify(manifest,null,2)+'\n');
        process.stdout.write(`level=${c.level} ${c.length}/${c.mode} ${strategy}: ${result.wins}/${result.games}, ${result.seconds.toFixed(2)}s\n`);
      }
    }
    manifest.status='complete';
  } catch(error) {
    manifest.status='incomplete';manifest.error=String(error);
    throw error;
  } finally {
    manifest.seconds=(performance.now()-start)/1000;
    const cpu=process.cpuUsage(cpuStart);manifest.cpuSeconds=(cpu.user+cpu.system)/1e6;
    manifest.peakRssMB=peakRss/1048576;
    writeFileSync(`${output}.json`,JSON.stringify(manifest,null,2)+'\n');
  }
  return manifest;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const options=parseArgs(process.argv.slice(2));
    runExperiment(options);
  } catch(error) { console.error(error.message);process.exitCode=1; }
}
