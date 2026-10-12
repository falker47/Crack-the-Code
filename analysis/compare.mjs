import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CONFIGURATIONS } from './catalog.mjs';

// Two-sided exact McNemar/binomial test on discordant paired binary outcomes.
export function exactDiscordantP(aOnly,bOnly) {
  if(![aOnly,bOnly].every(x=>Number.isInteger(x)&&x>=0))throw new Error('Invalid discordant counts');
  const n=aOnly+bOnly,k=Math.min(aOnly,bOnly);
  if(!n||k===n/2)return 1;
  let logMass=-n*Math.log(2);
  for(let i=1;i<=k;i++)logMass+=Math.log(n-i+1)-Math.log(i);
  let mass=Math.exp(logMass),tail=mass;
  for(let i=k;i>0;i--) {mass*=i/(n-i+1);tail+=mass;}
  return Math.min(1,2*tail);
}
export function comparePaired(a,b) {
  if(a.length!==b.length||!a.length)throw new Error('Paired trials do not match');
  const map=new Map(b.map(t=>[t.trial,t]));
  if(map.size!==b.length||new Set(a.map(t=>t.trial)).size!==a.length)throw new Error('Trials must be unique (no duplicates)');
  let aOnly=0,bOnly=0,bothWin=0,bothLose=0;
  for(const x of a) {
    const y=map.get(x.trial);
    if(!y||x.secret!==y.secret||typeof x.won!=='boolean'||typeof y.won!=='boolean')throw new Error('Paired secrets/trials do not match');
    if(x.won&&y.won)bothWin++;else if(x.won)aOnly++;else if(y.won)bOnly++;else bothLose++;
  }
  return {games:a.length,aOnly,bOnly,bothWin,bothLose,difference:(aOnly-bOnly)/a.length,pExact:exactDiscordantP(aOnly,bOnly)};
}
export function buildComparison(prefixes) {
  const groups=new Map(),manifests=[];let seed;
  for(const prefix of prefixes) {
    const manifest=JSON.parse(readFileSync(prefix+'.json','utf8'));
    if(manifest.status!=='complete')throw new Error(`Incomplete experiment: ${prefix}`);
    if(seed!==undefined&&seed!==manifest.seed)throw new Error('Experiment seed mismatch');
    seed=manifest.seed;manifests.push(manifest);
    let raw;
    try {raw=readFileSync(prefix+'.jsonl','utf8');}
    catch(error) {if(error.code!=='ENOENT')throw error;raw=gunzipSync(readFileSync(prefix+'.jsonl.gz')).toString('utf8');}
    for(const line of raw.trim().split('\n')) {
      if(!line)continue;
      const row=JSON.parse(line),key=`${row.level}:${row.strategy}`;
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push({trial:row.trial,secret:row.secret,won:row.won});
    }
    for(const r of manifest.results) {
      const rows=groups.get(`${r.level}:${r.strategy}`)??[];
      if(rows.length!==r.games||rows.filter(t=>t.won).length!==r.wins)throw new Error(`Trial/summary mismatch: ${prefix}`);
    }
  }
  const compare=(aLevel,aStrategy,bLevel,bStrategy)=>{
    const a=groups.get(`${aLevel}:${aStrategy}`),b=groups.get(`${bLevel}:${bStrategy}`);
    if(!a||!b)throw new Error('All nine levels and required policies must be present');
    return {a:`${aLevel}:${aStrategy}`,b:`${bLevel}:${bStrategy}`,...comparePaired(a,b)};
  };
  const modes=[],strategies=[];
  for(const length of [4,5,7]) {
    const levels=CONFIGURATIONS.filter(c=>c.length===length).map(c=>c.level);
    for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)modes.push(compare(levels[i],'information',levels[j],'information'));
  }
  for(const {level} of CONFIGURATIONS)for(const [a,b] of [['information','elimination'],['expected','elimination'],['information','expected']])
    strategies.push(compare(level,a,level,b));
  const corrected=list=>list.map(r=>({...r,pBonferroni:Math.min(1,r.pExact*list.length),significant05:r.pExact*list.length<0.05}));
  return {schema:1,seed,method:'exact paired McNemar; Bonferroni separately over 9 mode and 27 policy comparisons',
    groups:manifests.flatMap(m=>m.results),modeComparisons:corrected(modes),strategyComparisons:corrected(strategies),
    totalGames:manifests.reduce((n,m)=>n+m.results.reduce((s,r)=>s+r.games,0),0),
    cpuSeconds:manifests.reduce((n,m)=>n+m.cpuSeconds,0),peakProcessRssMB:Math.max(...manifests.map(m=>m.peakRssMB))};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args=process.argv.slice(2);
    if(args[0]!=='--out'||args.length<4)throw new Error('Usage: node analysis/compare.mjs --out file.json run-prefix ...');
    const result=buildComparison(args.slice(2));
    writeFileSync(args[1],JSON.stringify(result,null,2)+'\n',{flag:'wx'});
    console.log(`Compared ${result.totalGames} games; ${result.modeComparisons.length} mode and ${result.strategyComparisons.length} policy tests.`);
  } catch(error) {console.error(error.message);process.exitCode=1;}
}
