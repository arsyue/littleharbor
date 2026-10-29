import assert from 'node:assert/strict';
import {volumeData} from '../web/aquarium/volume.mjs';
import {fishProfiles} from '../web/aquarium/fish-shape.mjs';
import {tankLayout,projectWater,unprojectWater} from '../web/aquarium/depth-layout.mjs';
import {decorLayout,dragDecor} from '../web/aquarium/decor-layout.mjs';
import {fish,decor,decorLimits} from '../web/content.mjs';
import {newState,buy,validateState} from '../web/state.mjs';
const pixels=new Uint8Array(80*60*4);for(let y=0;y<60;y++)for(let x=0;x<80;x++)if(((x-40)/38)**2+((y-30)/25)**2<1)pixels[(y*80+x)*4+3]=255;
const volume=volumeData(pixels,80,60);assert.ok(volume.positions.every(Number.isFinite));assert.ok(volume.indices.every(i=>i>=0&&i<volume.positions.length/3));
const depths=volume.positions.filter((_,i)=>i%3===2);assert.ok(Math.max(...depths)-Math.min(...depths)>.06,'fish retain subtle physical thickness when facing the camera');
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

for(const f of fish){
 const profile=fishProfiles[f.id];assert.ok(profile,'every species has an anatomical profile');
 const model=volumeData(pixels,80,60,profile),z=model.positions.filter((_,i)=>i%3===2),width=Math.max(...z)-Math.min(...z);
 assert.ok(width>.012&&width<.225,f.id+' keeps natural body width instead of inflation');
 const fin=model.positions.filter((_,i)=>i%3===2&&Math.abs(model.positions[i-2]+.5-profile.bodyX)>profile.bodyRX+.01);
 assert.ok(fin.every(z=>Math.abs(z)<=.00151),'fins remain thin outside the torso');
}
assert.ok(fishProfiles.angelfish.thickness<fishProfiles.goldfish.thickness/2);
assert.ok(fishProfiles.guppy.thickness<fishProfiles.goldfish.thickness/2);
for(const [w,h]of [[1250,540],[390,620],[1440,948]])for(let tier=0;tier<3;tier++){
 const a=tankLayout(w,h,tier),far=projectWater(.8,.6,0,a),near=projectWater(.8,.6,1,a);
 assert.ok(far.scale<near.scale*.7&&far.x<near.x&&far.y<near.y,'rear fish recede in size and position');
 assert.ok(a.front.w>a.w&&a.floorFront-a.bottom>=80,'glass and substrate have depth');
 for(const z of [0,.5,1]){const p=projectWater(.23,.72,z,a),back=unprojectWater(p.x,p.y,z,a);assert.ok(Math.abs(back.x-.23)<1e-9&&Math.abs(back.y-.72)<1e-9);}
 for(const id of ['shell','hanging-shell','glass-coral','floating-lily']){
  const d={id,x:42,y:decorLimits(id).start},before=decorLayout(d,a,w,a.floorFront),old={...d};
  dragDecor(d,{x:before.x,y:before.y-before.size*.45},{x:0,y:0},a,w,a.floorFront);
  assert.ok(Math.abs(d.x-old.x)<1e-9&&Math.abs(d.y-old.y)<1e-9,'perspective decorations do not jump when grabbed');
 }
}
console.log('PASS natural profiles for all 16 species, thin fins, depth projection, feeding coordinates and perspective decoration dragging.');
