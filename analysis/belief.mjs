import { pack, feedbackKey, deterministicKey, crypticSelection, hintKey, validateMode } from './core.mjs';
import { HINTS, HINT_IDS, MAX_ATTEMPTS } from './catalog.mjs';
import { randomIndex } from './random.mjs';

function exactKeys(object,keys) {
  return object && typeof object==='object' && Object.keys(object).sort().join(',')===[...keys].sort().join(',');
}
function validateObservation(o,mode,length,attempt) {
  if(!exactKeys(o,['attempt','feedback','won','terminal'])||o.attempt!==attempt||
    typeof o.won!=='boolean'||typeof o.terminal!=='boolean'||
    o.terminal!==(o.won||attempt===MAX_ATTEMPTS))throw new Error('Invalid public observation schema');
  const keys=mode==='easy'?['kind','marks']:mode==='medium'?['kind','hit','blow','misses']:
    ['kind','status',...(['hit','blow'].includes(o.feedback?.status)?['hint']:[])];
  if(!exactKeys(o.feedback,keys))throw new Error('Unexpected public feedback field');
  return feedbackKey(mode,o.feedback,length);
}

export class Belief {
  constructor(space,mode) {
    validateMode(mode);
    this.space=space;this.mode=mode;this.count=space.size;
    this.ids=Uint32Array.from({length:space.size},(_,i)=>i);
    this.weights=new Float64Array(space.size).fill(1);
    this.totalWeight=space.size;this.attempt=0;this.terminal=false;
    if(mode==='difficult') {
      this.confirmed=new Uint16Array(space.size);
      this.cache=new Uint8Array(space.size*10); // 0=unobserved; catalog index+1 otherwise
    }
  }
  has(id) {
    // Filtering preserves lexical/id order; membership takes O(log candidates).
    let lo=0,hi=this.count-1;
    while(lo<=hi) {const mid=(lo+hi)>>>1,value=this.ids[mid];if(value===id)return true;if(value<id)lo=mid+1;else hi=mid-1;}
    return false;
  }
  probabilities() { return Array.from(this.ids.subarray(0,this.count),id=>[id,this.weights[id]/this.totalWeight]); }
  get byteLength() { return this.ids.byteLength+this.weights.byteLength+(this.confirmed?.byteLength??0)+(this.cache?.byteLength??0); }
  observe(guess,observation) {
    if(this.terminal)throw new Error('Belief is terminal');
    const guessId=this.space.idOf(guess),g=pack(guess);
    const key=validateObservation(observation,this.mode,this.space.length,this.attempt+1);
    let kept=0,total=0;
    const cryptic=this.mode==='difficult';
    const observedHint=key>=2?(key-2)%HINTS.length:-1;
    for(let j=0;j<this.count;j++) {
      const id=this.ids[j];
      if(observation.won!==(id===guessId))continue; // public victory is information too
      let likelihood=1,selection;
      if(!cryptic) {
        if(deterministicKey(this.space,id,g,this.mode)!==key)continue;
      } else {
        selection=crypticSelection(this.space,id,g,this.confirmed[id]);
        if(selection<0) {
          if(key!==(-selection-1))continue;
        } else {
          if(observedHint<0||hintKey(selection,observedHint)!==key)continue;
          const digit=selection%10,cached=this.cache[id*10+digit];
          if(cached) {if(cached!==observedHint+1)continue;}
          else {
            if(!HINT_IDS[digit].includes(observedHint))continue;
            likelihood=1/HINT_IDS[digit].length;
          }
        }
      }
      this.ids[kept++]=id;
      this.weights[id]*=likelihood;total+=this.weights[id];
      if(cryptic && selection>=0) {
        const digit=selection%10;
        if(selection>=10)this.confirmed[id]|=1<<digit;
        this.cache[id*10+digit]=observedHint+1;
      }
    }
    if(!kept||!Number.isFinite(total)||total<=0)throw new Error('Contradictory observation: no compatible codes');
    this.count=kept;this.totalWeight=total;this.attempt++;this.terminal=observation.terminal;
    return kept;
  }
  // Distinct candidate proposal sample; selection uses an independent solver RNG.
  sample(n,rng) {
    n=Math.min(n,this.count);
    if(n===this.count)return Array.from(this.ids.subarray(0,this.count));
    const indexes=new Set();
    // Floyd's algorithm: bounded n draws, unlike rejection sampling near saturation.
    for(let j=this.count-n;j<this.count;j++) {
      const t=randomIndex(rng,j+1);indexes.add(indexes.has(t)?j:t);
    }
    return [...indexes].map(i=>this.ids[i]);
  }
  mostLikely() {
    let best=this.ids[0];
    for(let i=1;i<this.count;i++)if(this.weights[this.ids[i]]>this.weights[best])best=this.ids[i];
    return best;
  }
  // Emit P(public response | hypothetical code, history). Win is terminal and
  // collapses all hint randomness into one response; there is no extra secret data.
  outcomes(id,guessId,emit) {
    if(id===guessId) {emit(-1,1);return;}
    const g=this.space.packed[guessId];
    if(this.mode!=='difficult') {emit(deterministicKey(this.space,id,g,this.mode),1);return;}
    const selection=crypticSelection(this.space,id,g,this.confirmed[id]);
    if(selection<0) {emit(-selection-1,1);return;}
    const digit=selection%10,cached=this.cache[id*10+digit];
    if(cached)emit(hintKey(selection,cached-1),1);
    else {
      const hints=HINT_IDS[digit],p=1/hints.length;
      for(const h of hints)emit(hintKey(selection,h),p);
    }
  }
}
