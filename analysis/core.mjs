import { randomIndex } from './random.mjs';
import { HINTS, HINT_IDS, MODES } from './catalog.mjs';

export function validateCode(code,length,alphabetSize=10) {
  return typeof code==='string' && code.length===length && /^\d+$/.test(code) &&
    new Set(code).size===length && [...code].every(d=>Number(d)<alphabetSize);
}
function validateSpace(length,alphabetSize) {
  if(!Number.isInteger(length)||length<1||length>7||
    !Number.isInteger(alphabetSize)||alphabetSize<length||alphabetSize>10)
    throw new RangeError('Space limit: length 1..7, alphabetSize length..10');
}
export function permutations(n,k) { let p=1; for(let i=0;i<k;i++)p*=n-i; return p; }
export function pack(code) { let value=0; for(let i=0;i<code.length;i++)value|=Number(code[i])<<(4*i); return value>>>0; }
export function unpack(value,length) { let s=''; for(let i=0;i<length;i++)s+=((value>>>(4*i))&15); return s; }
export function digitMask(code) { let m=0; for(const d of code)m|=1<<Number(d); return m; }

export class CodeSpace {
  constructor(length,alphabetSize=10) {
    validateSpace(length,alphabetSize);
    this.length=length;this.alphabetSize=alphabetSize;this.size=permutations(alphabetSize,length);
    this.packed=new Uint32Array(this.size);this.masks=new Uint16Array(this.size);
    let id=0;
    const walk=(depth,value,mask)=>{
      if(depth===length) { this.packed[id]=value;this.masks[id++]=mask;return; }
      for(let d=0;d<alphabetSize;d++)if(!(mask&(1<<d)))walk(depth+1,value|(d<<(depth*4)),mask|(1<<d));
    };
    walk(0,0,0);
  }
  codeAt(id) {
    if(!Number.isInteger(id)||id<0||id>=this.size)throw new RangeError('Invalid code id');
    return unpack(this.packed[id],this.length);
  }
  idOf(code) {
    if(!validateCode(code,this.length,this.alphabetSize))throw new Error('Invalid code');
    let mask=0,id=0;
    for(let i=0;i<this.length;i++) {
      const d=Number(code[i]);let smaller=0;
      for(let j=0;j<d;j++)if(!(mask&(1<<j)))smaller++;
      id+=smaller*permutations(this.alphabetSize-i-1,this.length-i-1);mask|=1<<d;
    }
    return id;
  }
  get byteLength() { return this.packed.byteLength+this.masks.byteLength; }
}

export function generateCode(length,rng=Math.random,alphabetSize=10) {
  validateSpace(length,alphabetSize);
  const digits=Array.from({length:alphabetSize},(_,i)=>String(i));
  for(let i=digits.length-1;i>0;i--) {
    const j=randomIndex(rng,i+1);[digits[i],digits[j]]=[digits[j],digits[i]];
  }
  return digits.slice(0,length).join('');
}
export function evaluate(secret,guess) {
  if(!validateCode(secret,secret?.length)||!validateCode(guess,secret.length))throw new Error('Invalid code or guess');
  let hit=0,blow=0;
  const marks=[...guess].map((d,i)=>{
    if(d===secret[i]) {hit++;return 2;}
    if(secret.includes(d)) {blow++;return 1;}
    return 0;
  });
  return {marks,hit,blow,misses:secret.length-hit-blow};
}
export function validateMode(mode) { if(!MODES.includes(mode))throw new Error('Unknown feedback mode'); }

// Numeric keys encode public feedback only. The selected digit is NEVER encoded.
export function feedbackKey(mode,feedback,length) {
  validateMode(mode);
  if(mode==='easy') {
    if(feedback.kind!=='full'||!Array.isArray(feedback.marks)||feedback.marks.length!==length||
      feedback.marks.some(m=>![0,1,2].includes(m)))throw new Error('Invalid public feedback');
    return feedback.marks.reduce((key,m)=>key*3+m,0);
  }
  if(mode==='medium') {
    const {hit,blow,misses}=feedback;
    if(feedback.kind!=='summary'||![hit,blow,misses].every(n=>Number.isInteger(n)&&n>=0)||hit+blow+misses!==length)
      throw new Error('Invalid public feedback');
    return hit*(length+1)+blow;
  }
  if(feedback.kind!=='cryptic')throw new Error('Invalid public feedback');
  if(feedback.status==='none')return 0;
  if(feedback.status==='none-confirmed')return 1;
  const hid=HINTS.findIndex(h=>h.message===feedback.hint);
  if(hid<0||!['hit','blow'].includes(feedback.status))throw new Error('Invalid public hint');
  return 2+hid+(feedback.status==='blow'?HINTS.length:0);
}
export function publicFeedback(mode,key,length) {
  if(mode==='easy') {
    const marks=new Array(length);
    for(let i=length-1;i>=0;i--) {marks[i]=key%3;key=Math.floor(key/3);}
    return Object.freeze({kind:'full',marks:Object.freeze(marks)});
  }
  if(mode==='medium') {
    const hit=Math.floor(key/(length+1)),blow=key%(length+1);
    return Object.freeze({kind:'summary',hit,blow,misses:length-hit-blow});
  }
  if(key<2)return Object.freeze({kind:'cryptic',status:key===0?'none':'none-confirmed'});
  const isHit=key<2+HINTS.length,hid=(key-2)%HINTS.length;
  return Object.freeze({kind:'cryptic',status:isHit?'hit':'blow',hint:HINTS[hid].message});
}
export function deterministicKey(space,id,guessPacked,mode) {
  const secret=space.packed[id],mask=space.masks[id],length=space.length;
  let key=0,hit=0,blow=0;
  for(let i=0;i<length;i++) {
    const d=(guessPacked>>>(4*i))&15;
    const m=d===((secret>>>(4*i))&15)?2:(mask&(1<<d))?1:0;
    if(mode==='easy')key=key*3+m;
    else if(m===2)hit++;else if(m===1)blow++;
  }
  return mode==='easy'?key:hit*(length+1)+blow;
}
// Selector for a HYPOTHETICAL secret; -1/-2 mean no new candidate.
// digit+10 means hit; digit alone means blow. Mirrors leftmost priority.
export function crypticSelection(space,id,guessPacked,confirmed) {
  const secret=space.packed[id],mask=space.masks[id];
  for(let i=0;i<space.length;i++) {
    const d=(guessPacked>>>(4*i))&15;
    if(!(confirmed&(1<<d))&&d===((secret>>>(4*i))&15))return 10+d;
  }
  for(let i=0;i<space.length;i++) {
    const d=(guessPacked>>>(4*i))&15;
    if(!(confirmed&(1<<d))&&(mask&(1<<d)))return d;
  }
  return confirmed?-2:-1;
}
export function hintKey(selection,hintId) { return 2+hintId+(selection<10?HINTS.length:0); }
export { HINT_IDS };
