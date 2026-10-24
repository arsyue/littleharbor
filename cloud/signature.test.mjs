import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {gameCatalog,gameByKind} from '../web/activity-catalog.mjs';
import {signatureKinds,signaturePlan} from '../web/signature-data.mjs';
import {houses} from '../web/places.mjs';
import {roomFor} from '../web/room-data.mjs';
import {workKinds,workPlan,allWorkClips,attemptWork} from '../web/work-data.mjs';
assert.equal(Object.keys(gameCatalog).length,16);assert.equal(new Set(Object.values(gameCatalog).map(g=>g.name)).size,16);
assert.deepEqual([...new Set(Object.values(gameCatalog).map(g=>g.level))].sort(),[1,2,3]);
for(const h of houses){const g=gameCatalog[h.id.slice(6)],room=roomFor(h),spot=room.spots.find(s=>s.id==='work');assert.ok(g);assert.equal(spot.work,g.kind);assert.equal(spot.reward,g.reward);assert.ok(workKinds.includes(g.kind));}
const seen=new Map();
for(const kind of workKinds)for(let v=0;v<6;v++)for(const s of workPlan(kind,v)){if(seen.has(s.id))assert.equal(seen.get(s.id),s.text,'an audio key must always mean the same spoken text');else seen.set(s.id,s.text);}
assert.equal(seen.size,128);assert.equal(allWorkClips().length,128);
for(const kind of signatureKinds)for(const [index,s]of signaturePlan(kind).entries()){
 assert.ok(s.text.split(/\s+/).length>=20);assert.ok(existsSync('web/'+s.sceneArt));assert.ok(gameByKind[kind]);
 const session={kind,variant:0,step:index,errors:0,paid:false,draft:{}};
 if(s.type==='paint'){const wrong={...s.fields};const empty=Array.from({length:9},(_,i)=>i).find(i=>!s.fields[i]);wrong[empty]=s.palette[1];assert.equal(attemptWork(session,wrong).ok,false,'extra painted cells violate the brief');}
 if(s.type==='basket'){const sum=s.catalog.reduce((n,[key,price])=>n+(s.fields[key]||0)*price,0);assert.ok(sum<=s.limit);const unwanted=s.catalog.find(([key])=>!s.fields[key])[0];assert.equal(attemptWork(session,{...s.fields,[unwanted]:1}).ok,false);}
 if(s.type==='dials')for(const [key,value]of Object.entries(s.fields)){const [min,max,step]=s.ranges[key];assert.ok(value>=min&&value<=max&&(value-min)%step===0);}
 if(s.type==='route'){let p=[...s.start];for(const move of s.answer){const d={North:[0,-1],South:[0,1],East:[1,0],West:[-1,0]}[move];p=[p[0]+d[0],p[1]+d[1]];assert.ok(p[0]>=0&&p[0]<s.width&&p[1]>=0&&p[1]<s.height);assert.ok(!s.blocked.some(b=>b[0]===p[0]&&b[1]===p[1]));}assert.deepEqual(p,s.goal);}
 if(s.type==='pattern'){assert.equal(s.choices.length,s.tones.length);assert.ok(s.answer.every(v=>s.choices.includes(v)));assert.ok(s.tones.every(v=>v>100&&v<1000));}
}
console.log('PASS all 16 unique place games, three levels, 60 new spoken stages, maps, budgets, paint constraints and illustration paths.');
