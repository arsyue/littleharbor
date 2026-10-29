import assert from 'node:assert/strict';
import {volumeData} from '../web/aquarium/volume.mjs';
import {decorLayout,dragDecor} from '../web/aquarium/decor-layout.mjs';
import {fish,decor,decorLimits} from '../web/content.mjs';
import {newState,buy,validateState} from '../web/state.mjs';
const pixels=new Uint8Array(80*60*4);for(let y=0;y<60;y++)for(let x=0;x<80;x++)if(((x-40)/38)**2+((y-30)/25)**2<1)pixels[(y*80+x)*4+3]=255;
const volume=volumeData(pixels,80,60);assert.ok(volume.positions.every(Number.isFinite));assert.ok(volume.indices.every(i=>i>=0&&i<volume.positions.length/3));
const depths=volume.positions.filter((_,i)=>i%3===2);assert.ok(Math.max(...depths)-Math.min(...depths)>.2,'fish retain physical thickness when facing the camera');
assert.equal(fish.length,16);assert.equal(decor.length,20);
const area={x:70,w:860,top:80,bottom:480},front=560;
for(const id of ['hanging-shell','hanging-fern','glass-coral','floating-lily']){
 const s=newState();s.coins=1000;const result=buy(s,'decor',id);assert.ok(result.ok);assert.ok(validateState(s));
 const d=s.decor[0],limits=decorLimits(id);assert.equal(d.y,limits.start);const original=decorLayout(d,area,1000,front);
 dragDecor(d,{x:500,y:300},{x:0,y:0},area,1000,front);assert.ok(d.y>=limits.min&&d.y<=limits.max);assert.ok(validateState(s));
 const after=JSON.parse(JSON.stringify(s));assert.deepEqual(after.decor,s.decor);assert.equal(decorLayout(after.decor[0],area,1000,front).mount,limits.mount);
 assert.ok(original.y<area.bottom,'new ornaments occupy the water, not just the sand');
}
const legacy=newState();legacy.decor=[{uid:'old-shell',id:'shell',x:50,y:84}];assert.ok(validateState(legacy));assert.equal(decorLimits('shell').mount,'floor');
console.log('PASS closed fish volumes, all 20 matching decorations, four new mounting styles, dragging and old saves.');
