import test from 'node:test';
import assert from 'node:assert/strict';
import { CodeSpace, evaluate, generateCode, validateCode } from '../../analysis/core.mjs';
import { createRng, deriveSeed } from '../../analysis/random.mjs';
import { createGame } from '../../analysis/engine.mjs';
import { Belief } from '../../analysis/belief.mjs';
import { HINTS, CONFIGURATIONS } from '../../analysis/catalog.mjs';

test('all nine source configurations and exact permutation spaces', () => {
  assert.equal(CONFIGURATIONS.length, 9);
  for (const [length, expected] of [[4,5040],[5,30240],[7,604800]]) {
    const space = new CodeSpace(length);
    assert.equal(space.size, expected);
    assert.equal(space.codeAt(0), '0123456'.slice(0,length));
    for (let id=0; id<space.size; id+=137) {
      const code=space.codeAt(id);
      assert.equal(new Set(code).size, length);
      assert.equal(space.idOf(code),id);
    }
  }
  assert.throws(()=>new CodeSpace(9),/limit|length/i);
});

test('generation is seeded, valid, includes leading zero and does not repeat digits', () => {
  const a=createRng('generation'), b=createRng('generation');
  let zeros=0;
  for(let i=0;i<300;i++) {
    const code=generateCode(7,a);
    assert.equal(code,generateCode(7,b));
    assert.equal(validateCode(code,7),true);
    zeros+=code[0]==='0';
  }
  assert.ok(zeros>0);
  assert.notEqual(deriveSeed('x','secret'),deriveSeed('x','solver'));
  assert.throws(()=>generateCode(4,()=>1),/random/i);
  assert.equal(validateCode('0012',4),false);
  assert.equal(validateCode('123x',4),false);
});

test('evaluation preserves positions, leading zero, hit and blow counts', () => {
  assert.deepEqual(evaluate('0123','0314'),{marks:[2,1,1,0],hit:1,blow:2,misses:1});
  assert.deepEqual(evaluate('0123','0123'),{marks:[2,2,2,2],hit:4,blow:0,misses:0});
  assert.throws(()=>evaluate('0123','0012'),/invalid/i);
});

test('engine observations contain no selected digit, secret or private state', () => {
  const game=createGame({length:4,mode:'difficult',secret:'0123',rng:()=>0});
  assert.deepEqual(Object.keys(game),['submit']);
  const o=game.submit('0456');
  assert.deepEqual(Object.keys(o).sort(),['attempt','feedback','terminal','won']);
  assert.deepEqual(Object.keys(o.feedback).sort(),['hint','kind','status']);
  assert.equal(o.feedback.status,'hit');
  assert.equal(o.feedback.hint,HINTS[0].message);
  assert.ok(Object.isFrozen(o));
  assert.ok(Object.isFrozen(o.feedback));
});

for (const [name, config] of [
  ['length above seven', {length:8,secret:'01234567'}],
  ['alphabet above ten', {length:4,alphabetSize:11,secret:'0123'}],
  ['alphabet below the code length', {length:4,alphabetSize:3,secret:'0123'}],
  ['noninteger alphabet', {length:4,alphabetSize:4.5,secret:'0123'}],
]) {
  test(`engine rejects ${name} with an explicit secret`, () => {
    assert.throws(()=>createGame({mode:'easy',...config}),RangeError);
  });
}

test('seven attempts: invalid inputs do not count, last-turn win, no eighth guess', () => {
  for (const win of [true,false]) {
    const game=createGame({length:4,mode:'easy',secret:'0123',rng:()=>0});
    assert.throws(()=>game.submit('0012'),/invalid/i);
    for(let i=1;i<7;i++)assert.equal(game.submit('4567').attempt,i);
    const o=game.submit(win?'0123':'4567');
    assert.equal(o.attempt,7); assert.equal(o.won,win); assert.equal(o.terminal,true);
    assert.throws(()=>game.submit('0123'),/over|terminal/i);
  }
  const game=createGame({length:4,mode:'medium',secret:'0123'});
  assert.equal(game.submit('0123').won,true);
  assert.throws(()=>game.submit('4567'),/over|terminal/i);
});

test('small exhaustive filtering agrees with direct public feedback and never loses true code', () => {
  const space=new CodeSpace(2,4);
  for(const mode of ['easy','medium','difficult']) {
    for(let secretId=0;secretId<space.size;secretId++) {
      const secret=space.codeAt(secretId);
      const game=createGame({length:2,alphabetSize:4,mode,secret,rng:createRng(secret)});
      const belief=new Belief(space,mode);
      for(const guess of ['01','23','10','32','02','13','20']) {
        const o=game.submit(guess);
        belief.observe(guess,o);
        assert.ok(belief.has(secretId),`${mode} ${secret} ${guess}`);
        if(o.won)assert.equal(belief.count,1);
        if(o.terminal)break;
      }
    }
  }
});

test('cryptic repeat is cached and supplies no fresh likelihood or candidate elimination', () => {
  const space=new CodeSpace(4);
  const game=createGame({length:4,mode:'difficult',secret:'0123',rng:()=>0});
  const belief=new Belief(space,'difficult');
  const first=game.submit('1567');
  assert.equal(first.feedback.status,'blow');
  belief.observe('1567',first);
  const count=belief.count, probabilities=belief.probabilities();
  const second=game.submit('1567');
  assert.deepEqual(second.feedback,first.feedback);
  belief.observe('1567',second);
  assert.equal(belief.count,count);
  assert.deepEqual(belief.probabilities(),probabilities);
});

test('contradictory observations are rejected; public schema rejects secret additions', () => {
  const b=new Belief(new CodeSpace(2,3),'easy');
  assert.throws(()=>b.observe('01',{attempt:1,feedback:{kind:'full',marks:[2,2]},won:false,terminal:false}),/contradic|compatible/i);
  const game=createGame({length:2,alphabetSize:3,mode:'easy',secret:'01'});
  assert.throws(()=>new Belief(new CodeSpace(2,3),'easy').observe('01',{...game.submit('01'),secret:'01'}),/public|schema|unexpected/i);
});
