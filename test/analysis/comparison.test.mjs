import test from 'node:test';
import assert from 'node:assert/strict';
import { comparePaired, exactDiscordantP } from '../../analysis/compare.mjs';

test('exact paired binomial test agrees with enumerated discordant outcomes', () => {
  assert.equal(exactDiscordantP(0,0),1);
  assert.ok(Math.abs(exactDiscordantP(10,0)-2/1024)<1e-14);
  assert.ok(Math.abs(exactDiscordantP(8,2)-112/1024)<1e-14);
  assert.equal(exactDiscordantP(5,5),1);
  for(let n=1;n<=12;n++)for(let k=0;k<=Math.floor(n/2);k++) {
    let tail=0;
    for(let mask=0;mask<(1<<n);mask++)if(mask.toString(2).replace(/0/g,'').length<=k)tail++;
    assert.ok(Math.abs(exactDiscordantP(k,n-k)-Math.min(1,2*tail/2**n))<1e-12);
  }
});

test('paired comparison requires matching unique trials and secrets', () => {
  const a=[{trial:0,secret:'0123',won:true},{trial:1,secret:'4567',won:true}];
  const b=[{trial:0,secret:'0123',won:false},{trial:1,secret:'4567',won:true}];
  assert.deepEqual(comparePaired(a,b),{games:2,aOnly:1,bOnly:0,bothWin:1,bothLose:0,difference:0.5,pExact:1});
  assert.throws(()=>comparePaired(a,[b[0]]),/match/i);
  assert.throws(()=>comparePaired(a,[b[0],{...b[1],secret:'9876'}]),/match/i);
  assert.throws(()=>comparePaired(a,[b[0],b[0]]),/unique|duplicate/i);
});
