import { evaluate, generateCode, validateCode, validateMode, validateSpace } from './core.mjs';
import { HINTS, HINT_IDS, MAX_ATTEMPTS } from './catalog.mjs';
import { randomIndex } from './random.mjs';

// Only this closure knows the actual secret. No inspect/snapshot/backdoor API.
export function createGame({length,mode,secret,rng=Math.random,alphabetSize=10}) {
  validateMode(mode);
  validateSpace(length,alphabetSize);
  secret??=generateCode(length,rng,alphabetSize);
  if(!validateCode(secret,length,alphabetSize))throw new Error('Invalid secret');
  let attempts=0,terminal=false;
  const confirmed=new Set(),cache=new Map();
  return Object.freeze({submit(guess) {
    if(terminal)throw new Error('Game is over (terminal)');
    if(!validateCode(guess,length,alphabetSize))throw new Error('Invalid guess');
    const {marks,hit,blow,misses}=evaluate(secret,guess);
    let feedback;
    if(mode==='easy')feedback={kind:'full',marks:Object.freeze(marks)};
    else if(mode==='medium')feedback={kind:'summary',hit,blow,misses};
    else {
      let index=marks.findIndex((m,i)=>m===2&&!confirmed.has(guess[i]));
      const isHit=index>=0;
      if(isHit)confirmed.add(guess[index]);
      else index=[...guess].findIndex(d=>secret.includes(d)&&!confirmed.has(d));
      if(index<0)feedback={kind:'cryptic',status:confirmed.size?'none-confirmed':'none'};
      else {
        const digit=Number(guess[index]);
        if(!cache.has(digit))cache.set(digit,HINT_IDS[digit][randomIndex(rng,HINT_IDS[digit].length)]);
        feedback={kind:'cryptic',status:isHit?'hit':'blow',hint:HINTS[cache.get(digit)].message};
      }
    }
    attempts++;
    const won=guess===secret;
    terminal=won||attempts===MAX_ATTEMPTS;
    return Object.freeze({attempt:attempts,feedback:Object.freeze(feedback),won,terminal});
  }});
}
