// FNV-1a seed derivation + Mulberry32. Reproducible, not cryptographic.
export function deriveSeed(seed,label='') {
  let h=2166136261;
  for(const c of `${seed}\0${label}`) { h^=c.charCodeAt(0); h=Math.imul(h,16777619); }
  return h>>>0;
}
export function createRng(seed) {
  let state=typeof seed==='number'?seed>>>0:deriveSeed(seed);
  return function random() {
    state=(state+0x6D2B79F5)>>>0;
    let t=Math.imul(state^(state>>>15),1|state);
    t^=t+Math.imul(t^(t>>>7),61|t);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}
export function randomIndex(rng,size) {
  const x=rng();
  if(!Number.isFinite(x)||x<0||x>=1)throw new RangeError('Random value must be in [0,1)');
  return Math.floor(x*size);
}
