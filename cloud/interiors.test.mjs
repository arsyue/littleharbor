import assert from 'node:assert/strict';
import {houses} from '../web/places.mjs';
import {ROOM,roomFor,roomWalkable,roomRoute,activityFor,nearestSpot,floorPoint,roomArrival} from '../web/room-data.mjs';
import {fish,decor,tanks} from '../web/content.mjs';
import {newState,buy,validateState} from '../web/state.mjs';
let routes=0,activities=0;const backgrounds=new Set();
for(const house of houses)for(const floor of [0,2,...(['house-lighthouse','house-post','house-inn'].includes(house.id)?[1]:[])]){
 const room=roomFor(house,floor),start=room.spawn;backgrounds.add(room.image);
 assert.ok(roomWalkable(room,start.x,start.y));assert.equal(room.floor,floor);
 assert.ok(!room.objects.some(o=>o.asset==='balcony-door'),'entrance uses the painted artwork, not a floating prop');
 for(const target of room.spots){
  assert.ok(roomWalkable(room,target.x,target.y),house.id+' reachable target '+target.id);
  const route=roomRoute(room,start,target);assert.ok(route.length);assert.ok(Math.hypot(route.at(-1).x-target.x,route.at(-1).y-target.y)<1);
  let previous=start;for(const p of route){for(let i=0;i<=10;i++)assert.ok(roomWalkable(room,previous.x+(p.x-previous.x)*i/10,previous.y+(p.y-previous.y)*i/10),house.id+' route crosses a furniture footprint');previous=p;}routes++;
 }
 for(const obj of room.objects)assert.equal(roomWalkable(room,obj.box.x+obj.box.w/2,obj.box.y+obj.box.h/2),false,'solid furniture');
 for(const spot of room.spots.filter(s=>s.kind==='object')){
  const activity=activityFor(house.id,(floor===2?'balcony-':floor?'up-':'')+spot.id);assert.equal(activity.questions.length,3);assert.ok(activity.reward>0);
  for(const [q,,choices,answer]of activity.questions){assert.ok(q.length>15);assert.equal(new Set(choices).size,choices.length);assert.equal(choices.filter(c=>c===answer).length,1);}
  assert.equal(nearestSpot(room,spot).id,spot.id);activities++;
 }
 assert.equal(nearestSpot(room,room.exit).id,'exit');
 for(const portal of room.spots.filter(s=>['balcony','stairs'].includes(s.kind))){
  const arrival=roomArrival(room,portal.id);
  if(portal.kind==='balcony'){
   assert.ok(Math.hypot(arrival.x-portal.x,arrival.y-portal.y)>=82,'return clears the doorway interaction');
   assert.equal(nearestSpot(room,portal).id,'balcony');
   assert.equal(roomWalkable(room,portal.x,portal.y),true);
  }
  assert.ok(roomWalkable(room,arrival.x,arrival.y),house.id+' safe return from '+portal.id);
  const path=roomRoute(room,arrival,room.exit);assert.ok(path.length);let prev=arrival;
  for(const p of path){for(let i=0;i<=10;i++)assert.ok(roomWalkable(room,prev.x+(p.x-prev.x)*i/10,prev.y+(p.y-prev.y)*i/10),house.id+' exit route after return');prev=p;}
 }
}
// These visible thresholds are part of the painted room, not arbitrary floor locations.
for(const [id,rect] of [['lighthouse',[1190,420,1260,510]],['cafe',[1080,250,1140,315]],['garden',[640,260,715,305]],['post',[960,225,1040,280]]]){
 const r=roomFor(houses.find(h=>h.id==='house-'+id)),p=r.spots.find(s=>s.kind==='balcony');
 assert.ok(p.x>=rect[0]&&p.x<=rect[2]&&p.y>=rect[1]&&p.y<=rect[3],id+' matches the painted threshold');
}
assert.equal(backgrounds.size,23);assert.equal(activities,54);assert.equal(activityFor('house-library','up-job-0'),null);assert.equal(activityFor('missing','job-0'),null);
assert.equal(fish.length,16);assert.equal(decor.length,16);assert.deepEqual(tanks.map(t=>[t.fish,t.decor]),[[20,16],[40,32],[60,48]]);
for(let tier=0;tier<3;tier++){
 const save=newState();save.tank=tier;save.coins=100000;
 for(const [kind,items]of [['fish',fish],['decor',decor]]){
  while(save[kind].length<tanks[tier][kind])assert.ok(buy(save,kind,items[save[kind].length%items.length].id).ok);
  assert.ok(validateState(save));const coins=save.coins;assert.equal(buy(save,kind,items[0].id).ok,false);assert.equal(save.coins,coins);
 }
}
const legacy=newState();legacy.coins=42;legacy.words=['shell'];legacy.houseGames={'house-library':2};assert.ok(validateState(legacy));assert.equal(legacy.coins,42);
console.log('PASS',routes,'collision-free routes; 23 unique scenes; 54 object jobs; stairs; 16 fish/16 decor; every capacity boundary; old saves.');
