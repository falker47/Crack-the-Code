import { Belief } from './belief.mjs';
import { createRng, randomIndex } from './random.mjs';
import { MAX_ATTEMPTS } from './catalog.mjs';

export const STRATEGIES=Object.freeze(['random','elimination','expected','information']);
export const DEFAULT_LIMITS=Object.freeze({guessSample:48,secretSample:256});

// One-step score on an explicitly bounded, uniform support sample, reweighted
// by exact likelihood. This is exact only when sampleIds covers the belief.
export function scoreGuess(belief,guessId,sampleIds) {
  if(!sampleIds.length)throw new Error('Empty scoring sample');
  let total=0;for(const id of sampleIds)total+=belief.weights[id];
  const responses=new Map();let noiseEntropy=0;
  for(const id of sampleIds) {
    const w=belief.weights[id]/total;
    belief.outcomes(id,guessId,(key,p)=>{
      const r=responses.get(key)??{mass:0,count:0};
      r.mass+=w*p;r.count++;responses.set(key,r);
      if(p>0)noiseEntropy-=w*p*Math.log2(p);
    });
  }
  let responseEntropy=0,expectedRemaining=0;
  for(const {mass,count} of responses.values()) {
    responseEntropy-=mass*Math.log2(mass);
    expectedRemaining+=mass*count;
  }
  return {
    information:Math.max(0,responseEntropy-noiseEntropy),responseEntropy,noiseEntropy,
    expectedRemaining:expectedRemaining*belief.count/sampleIds.length,
    exact:sampleIds.length===belief.count
  };
}

export class Solver {
  constructor(space,mode,options={}) {
    const allowed=['strategy','seed','guessSample','secretSample'];
    if(Object.keys(options).some(k=>!allowed.includes(k)))throw new Error('Unexpected solver option; public configuration only');
    const {strategy='information',seed=1,guessSample=DEFAULT_LIMITS.guessSample,secretSample=DEFAULT_LIMITS.secretSample}=options;
    if(!STRATEGIES.includes(strategy))throw new Error('Unknown strategy');
    if(!Number.isInteger(guessSample)||guessSample<1||guessSample>512||
      !Number.isInteger(secretSample)||secretSample<1||secretSample>8192||guessSample*secretSample>1048576)
      throw new RangeError('Scoring sample/work limit exceeded');
    this.belief=new Belief(space,mode);this.strategy=strategy;this.rng=createRng(seed);
    this.guessSample=guessSample;this.secretSample=secretSample;this.seen=new Set();
    this.scoredPairs=0;this.decisions=[];this.pending=null;
  }
  nextGuess() {
    if(this.belief.terminal)throw new Error('Solver is terminal');
    if(this.pending!==null)throw new Error('Observe the pending guess first');
    const b=this.belief,space=b.space;
    let id;
    if(this.strategy==='random') {
      if(this.seen.size===space.size)throw new Error('All legal guesses exhausted');
      id=randomIndex(this.rng,space.size-this.seen.size);
      for(const excluded of [...this.seen].sort((a,b)=>a-b)) {if(excluded>id)break;id++;}
    } else if(this.strategy==='elimination')id=b.ids[randomIndex(this.rng,b.count)];
    else if(b.count===1||b.attempt===MAX_ATTEMPTS-1)id=b.mostLikely();
    else {
      const sample=b.sample(this.secretSample,this.rng);
      // Most probes are compatible solutions. A quarter explores legal codes
      // outside the posterior, which can divide it better than another solution.
      const compatibleBudget=Math.ceil(this.guessSample*0.75);
      const proposals=new Set([b.mostLikely(),...b.sample(compatibleBudget-1,this.rng)]);
      for(let i=0;i<this.guessSample-compatibleBudget;i++)proposals.add(randomIndex(this.rng,space.size));
      let best=-Infinity,bestWin=-1,selectedScore;
      for(const guessId of proposals) {
        if(this.seen.has(guessId))continue;
        const score=scoreGuess(b,guessId,sample);
        this.scoredPairs+=sample.length;
        const utility=this.strategy==='information'?score.information:-score.expectedRemaining;
        // Only compatible codes have immediate winning mass.
        const win=b.has(guessId)?b.weights[guessId]/b.totalWeight:0;
        if(utility>best+1e-12||(Math.abs(utility-best)<=1e-12&&win>bestWin)) {
          best=utility;bestWin=win;id=guessId;selectedScore=score;
        }
      }
      if(id===undefined)id=b.mostLikely();
      this.decisions.push({attempt:b.attempt+1,candidates:b.count,proposals:proposals.size,
        scoredSecrets:sample.length,score:selectedScore??null});
    }
    this.seen.add(id);this.pending=space.codeAt(id);
    return this.pending;
  }
  observe(guess,observation) {
    if(guess!==this.pending)throw new Error('Observation does not match pending guess');
    const count=this.belief.observe(guess,observation);this.pending=null;return count;
  }
}
