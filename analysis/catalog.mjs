import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Read only public rules/catalog from the checked-out product. Never load script.js.
const context=vm.createContext({});
vm.runInContext(readFileSync(new URL('../data.js',import.meta.url),'utf8')+
  '\n;globalThis.publicData={campaignLevels,crypticMessages,levelData};',context);
const data=JSON.parse(JSON.stringify(context.publicData));
export const HINTS=Object.freeze(data.crypticMessages.map(h=>Object.freeze({
  message:h.message,digits:Object.freeze(h.digits)
})));
if(new Set(HINTS.map(h=>h.message)).size!==HINTS.length)
  throw new Error('Duplicate hint text requires aggregating its emission probability');
export const HINT_IDS=Object.freeze(Array.from({length:10},(_,d)=>Object.freeze(
  HINTS.flatMap((h,i)=>h.digits.includes(d)?[i]:[]))));
export const CONFIGURATIONS=Object.freeze(data.campaignLevels.map((c,i)=>Object.freeze({
  level:i+1,length:c.codeLength,mode:c.difficulty,
  name:data.levelData[c.difficulty][c.codeLength].levelName
})));
export const MODES=Object.freeze(['easy','medium','difficult']);
export const MAX_ATTEMPTS=7;
