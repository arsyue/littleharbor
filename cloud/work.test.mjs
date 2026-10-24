import assert from 'node:assert/strict';
import {workKinds,workPlan,startWork,attemptWork,collectWages,newShift,spokenMatch,allWorkClips,workReward} from '../web/work-data.mjs';
import {newState,validateState} from '../web/state.mjs';
import {WORLD,houses} from '../web/places.mjs';
assert.equal(WORLD.width*WORLD.height,3600*2400*1.5);assert.equal(houses.length,16);assert.equal(allWorkClips().length,128);
let checked=0;
for(const kind of workKinds)for(let variant=0;variant<(kind==='restaurant'?6:kind==='museum'?1:3);variant++){
 const state=newState(),s=startWork(state,kind);s.variant=variant;const plan=workPlan(kind,variant);
 assert.ok(plan.length>=5);
 for(const step of plan){
  const at=s.step,coins=state.coins;assert.equal(attemptWork(s,'definitely wrong').ok,false);assert.equal(s.step,at);assert.equal(state.coins,coins);
  let answer=step.type==='speak'?step.hint:step.fields||step.answer||step.target;
  if(step.type==='speak'){assert.ok(spokenMatch(step.hint,step.groups));assert.equal(spokenMatch('yes',step.groups),false);}
  if(step.type==='measure'){assert.equal(attemptWork(s,{...step.fields,herbs:(step.fields.herbs||0)+1}).ok,false,'extra ingredients cannot be ignored');}
  if(step.type==='bake'){assert.equal(attemptWork(s,'golden').ok,false);s.draft.readyAt=Date.now()-1;answer='golden';}
  assert.ok(attemptWork(s,answer).ok,kind+' '+step.id);checked++;
  const restored=JSON.parse(JSON.stringify(state));assert.equal(startWork(restored,kind).step,s.step);assert.ok(validateState(restored));
 }
 const expected=workReward(kind);assert.equal(collectWages(state,kind),expected);assert.equal(state.coins,expected);assert.equal(collectWages(state,kind),0);assert.ok(validateState(state));
 const before=state.coins;assert.equal(attemptWork(s,'anything').ok,false);assert.equal(state.coins,before);assert.equal(newShift(state,kind).step,0);
}
const old=newState();old.town={x:5200,y:1300};assert.ok(validateState(old));old.town.x=5500;assert.equal(validateState(old),false);
console.log('PASS',checked,'work steps, wrong-answer rejection, order constraints, saved progress, single wage payment and 1.5x map.');
