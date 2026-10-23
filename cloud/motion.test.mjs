import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {advanceFish} from '../web/aquarium/motion.mjs';
const speed={goldfish:.057,guppy:.08,'blue-tang':.07,clownfish:.065,angelfish:.04,betta:.045,pufferfish:.035,seahorse:.024};
const seed=n=>()=>((n=(1664525*n+1013904223)>>>0)/4294967296);
function make(i,x=.18+(i*.032)%.64,y=.22+(i%4)*.12){
 const id=Object.keys(speed)[i%8];
 return {uid:'fish-'+i,id,x,y,z:.2+(i%5)*.14,vx:i%2?-.025:.025,vy:0,heading:i%2?Math.PI:0,phase:i*.83,speed:speed[id],target:{x,y,z:.6},retarget:8};
}
const results=[];
for(const [name,count,feeding,tier] of [['arrival',1,false,0],['crowded',20,false,2],['continuous feeding',20,true,2],['wall',1,false,0]]){
 const random=seed(1258),fish=Array.from({length:count},(_,i)=>make(i)),seconds=120;
 if(name==='wall')Object.assign(fish[0],{x:.952,vx:.057,target:{x:.98,y:fish[0].y,z:.6}});
 let food=[],eaten=0,time=0;
 const tracks=fish.map(f=>({distance:0,turns:0,lastSide:Math.cos(f.heading)>=0?1:-1,lastTurn:-100,minimumTurnGap:Infinity,windowDistance:0}));
 for(let tick=0;tick<seconds*60;tick++){
  time=tick/60;
  if(feeding&&tick%(6*60)===0){
   const x=(tick/(6*60))%2?.94:.06;
   food.push(...Array.from({length:22},()=>({x:Math.max(.03,Math.min(.97,x+(random()-.5)*.12)),y:.06+random()*.12,life:18})));
   food=food.slice(-66);
  }
  food.forEach(p=>{p.y+=.018/60;p.life-=1/60;});food=food.filter(p=>p.life>0&&p.y<.88);
  const before=fish.map(f=>({x:f.x,y:f.y,heading:f.heading}));
  advanceFish(fish,food,[],1/60,time,tier,random);
  eaten+=food.filter(p=>p.life===0).length;
  fish.forEach((f,i)=>{
   assert.ok(Number.isFinite(f.x+f.y+f.z+f.heading),name+' finite motion');
   assert.ok(f.x>=.045&&f.x<=.955&&f.y>=.045&&f.y<=.86,name+' stays inside the glass');
   const turn=Math.atan2(Math.sin(f.heading-before[i].heading),Math.cos(f.heading-before[i].heading));
   assert.ok(Math.abs(turn)<=2.21/60,name+' no abrupt visible snaps');
   const d=Math.hypot(f.x-before[i].x,f.y-before[i].y),track=tracks[i];track.distance+=d;track.windowDistance+=d;
   const side=Math.cos(f.heading)>=0?1:-1;
   if(side!==track.lastSide){track.turns++;track.minimumTurnGap=Math.min(track.minimumTurnGap,time-track.lastTurn);track.lastTurn=time;track.lastSide=side;}
   if(tick>0&&tick%(15*60)===0){assert.ok(track.windowDistance>f.speed*15*.20,name+' keeps swimming instead of hovering at a waypoint');track.windowDistance=0;}
  });
 }
 for(let i=0;i<count;i++){assert.ok(tracks[i].minimumTurnGap>1.6,name+' does not flip back during a turn');assert.ok(tracks[i].distance>fish[i].speed*seconds*.3,name+' covers meaningful distance');}
 if(feeding)assert.ok(eaten>12,'Fish can eat during repeated feeding near both walls');
 results.push({name,count,tier,eaten,minimumTurnGap:Math.min(...tracks.map(t=>t.minimumTurnGap)),minimumDistance:Math.min(...tracks.map(t=>t.distance))});
}
// An almost vertical swim should retain its side, despite tiny horizontal velocity changes.
const vertical=make(0,.5,.2);Object.assign(vertical,{vx:.0001,target:{x:.5,y:.75,z:.6},retarget:30});
for(let i=0;i<180;i++)advanceFish([vertical],[],[],1/60,i/60,0,seed(7));
assert.ok(Math.cos(vertical.heading)>.9,'Vertical swimming does not trigger spurious reversals');
// Food at the edge is reachable; expired pellets cannot remain a steering target.
const edge=make(0,.07,.12),pellet={x:.03,y:.04,life:18},random=seed(8);
for(let i=0;i<600;i++)advanceFish([edge],[pellet],[],1/60,i/60,0,random);
assert.equal(pellet.life,0);assert.notEqual(edge.foodTarget,pellet);assert.ok(edge.x>.12,'Fish swims away after eating an edge pellet');
await mkdir('qa-output',{recursive:true});
await writeFile('qa-output/motion-results.json',JSON.stringify({success:true,scenarios:results,checks:['smooth bounded turns','persistent food selection','arrival recovery','no waypoint hovering','edge pellet consumption','vertical heading stability']},null,2));
console.log(JSON.stringify({motion:'passed',scenarios:results},null,2));
