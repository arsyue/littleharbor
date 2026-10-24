import {ROOM,roomFor,floorPoint,onFloor,nearestSpot,roomWalkable,roomRoute,roomArrival} from '../room-data.mjs';
import {WORLD,houses,entrances,houseLevels} from '../places.mjs';
import {discoveries} from '../adventures.mjs';
import {artState,loadArt,paintGround,setupScenery,paintScenery,paintExplorer,paintResident} from './scenery.mjs';
const W=WORLD.width,H=WORLD.height,STEP=40,cols=Math.ceil(W/STEP),rows=Math.ceil(H/STEP);
const canvas=document.querySelector('#world'),ctx=canvas.getContext('2d',{alpha:false}),mini=document.querySelector('#map'),mctx=mini.getContext('2d');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+Math.random()*(b-a),send=d=>parent.postMessage({littleHarborTown:true,...d},location.origin);
let w=1000,h=640,dpr=1,zoom=1,time=0,last=0,paused=false,position={x:1030*WORLD.sx,y:980*WORLD.sy},camera={x:1030*WORLD.sx,y:980*WORLD.sy},path=[],goal=null,near=null,discovered=[],completed=[],savedAt=0,lastSaved={x:0,y:0},walking=false,held=new Set(),foot=0,direction=0;
const portraits={},world=document.createElement('canvas');world.width=W;world.height=H;const g=world.getContext('2d');
const npcs=[
{id:'lily',name:'Lily',subtitle:'Welcome-day planner',x:1180,y:780,color:'#b78eaa',hair:'#805838'},
{id:'mia',name:'Mia',subtitle:'Fish Market',x:1760,y:590,color:'#759f9a',hair:'#5b3e2b'},
{id:'ben',name:'Ben',subtitle:'Design Workshop',x:560,y:1080,color:'#d2a26c',hair:'#5b4739'},
{id:'finn',name:'Captain Finn',subtitle:'Sunny Harbor',x:1830,y:1340,color:'#597b94',hair:'#d3c2a1'}
];
const home={id:'home',name:'My Aquarium',x:300,y:1090};
for(const n of [...npcs,home]){n.x*=WORLD.sx;n.y*=WORLD.sy;}
const places=[home,...npcs,...discoveries,...entrances];
const buildings=houses;
const obstacles=buildings.map(b=>({x:b.x-12,y:b.y-20,w:b.w+24,h:b.h+28}));
obstacles.push({x:929*WORLD.sx,y:663*WORLD.sy,w:142*WORLD.sx,h:142*WORLD.sy});
function blocked(x,y){
 if(x<26||y<35||x>W-26||y>H-50)return true;
 if(y>1510*WORLD.sy&&!(x>1740*WORLD.sx&&x<2040*WORLD.sx&&y<1685*WORLD.sy))return true;
 return obstacles.some(o=>x>o.x-13&&x<o.x+o.w+13&&y>o.y-13&&y<o.y+o.h+13);
}
function round(c,x,y,ww,hh,r,fill,stroke){c.beginPath();c.roundRect(x,y,ww,hh,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
function ellipse(c,x,y,rx,ry,fill){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();}
function line(c,points,color,width=2){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
function poly(c,p,fill,stroke){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.stroke();}}
const minimapBackground=document.createElement('canvas');minimapBackground.width=288;minimapBackground.height=128;
function buildWorld(){
 paintGround(g,W,H);setupScenery(buildings,discoveries);
 const mc=minimapBackground.getContext('2d');mc.drawImage(world,0,0,288,128);mc.save();mc.scale(288/W,128/H);paintScenery(mc,{map:true});mc.restore();
}
function node(x,y){return {x:clamp(Math.floor(x/STEP),0,cols-1),y:clamp(Math.floor(y/STEP),0,rows-1)};}
const key=n=>n.y*cols+n.x,point=n=>({x:n.x*STEP+STEP/2,y:n.y*STEP+STEP/2});
function free(n){const p=point(n);return n.x>=0&&n.y>=0&&n.x<cols&&n.y<rows&&!blocked(p.x,p.y);}
function nearestFree(n){if(free(n))return n;for(let r=1;r<10;r++)for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++){const a={x:n.x+x,y:n.y+y};if(free(a))return a;}return null;}
function route(x,y){
 const start=nearestFree(node(position.x,position.y)),end=nearestFree(node(x,y));if(!start||!end)return [];
 const open=[start],came=new Map(),cost=new Map([[key(start),0]]),score=new Map([[key(start),0]]),visited=new Set();
 while(open.length&&visited.size<cols*rows){open.sort((a,b)=>(score.get(key(a))||0)-(score.get(key(b))||0));const n=open.shift(),nk=key(n);if(nk===key(end)){const arr=[point(n)];let k=nk;while(came.has(k)){const p=came.get(k);arr.push(point(p));k=key(p);}return arr.reverse().slice(1);}
 if(visited.has(nk))continue;visited.add(nk);
 for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const next={x:n.x+dx,y:n.y+dy};if(!free(next)||visited.has(key(next)))continue;if(dx&&dy&&(!free({x:n.x+dx,y:n.y})||!free({x:n.x,y:n.y+dy})))continue;const nc=cost.get(nk)+(dx&&dy?1.414:1);
 if(!cost.has(key(next))||nc<cost.get(key(next))){came.set(key(next),n);cost.set(key(next),nc);score.set(key(next),nc+Math.hypot(next.x-end.x,next.y-end.y));open.push(next);}
 }}
 return [];
}
function go(id){if(inside)exitRoom();const p=places.find(x=>x.id===id);if(!p)return;goal=p;path=route(p.x,p.y+45);document.querySelector('#status').textContent='Walking to '+p.name+'…';if(!path.length&&Math.hypot(position.x-p.x,position.y-p.y)>110)document.querySelector('#status').textContent='Choose a nearby path to reach '+p.name+'.';}
function interact(p=near){if(inside){playRoom();return;}if(!p||paused||Math.hypot(position.x-p.x,position.y-p.y)>120)return;path=[];goal=null;if(p.house){enterRoom(p.id);return;}if(p.id==='home')send({type:'home'});else if(npcs.some(n=>n.id===p.id))send({type:'person',id:p.id});else send({type:'discovery',id:p.id});}
function screen(p){return{x:(p.x-camera.x)*zoom+w/2,y:(p.y-camera.y)*zoom+h/2};}
function draw(){
 if(inside){drawRoom();return;}
 ctx.fillStyle='#b5cda5';ctx.fillRect(0,0,w,h);
 const sx=camera.x-w/(2*zoom),sy=camera.y-h/(2*zoom);
 ctx.drawImage(world,sx,sy,w/zoom,h/zoom,0,0,w,h);
 ctx.save();ctx.translate(w/2-camera.x*zoom,h/2-camera.y*zoom);ctx.scale(zoom,zoom);
 if(path.length){ctx.setLineDash([3,10]);line(ctx,[[position.x,position.y],...path.map(p=>[p.x,p.y])],'#fffbedae',3);ctx.setLineDash([]);ellipse(ctx,path.at(-1).x,path.at(-1).y,12,6,'#fffad380');}
 paintScenery(ctx,{position,npcs,walking,direction,foot,time,view:{x:sx,y:sy,w:w/zoom,h:h/zoom}});
 for(const n of npcs){const close=Math.hypot(position.x-n.x,position.y-n.y)<110;ctx.save();ctx.translate(n.x,n.y-115);round(ctx,-72,-24,144,38,15,close?'#fff2be':'#fffdf0e8');ctx.fillStyle='#365c52';ctx.font='600 18px system-ui';ctx.textAlign='center';ctx.fillText(n.name,0,1);ctx.restore();}
 for(const d of discoveries){if(discovered.includes(d.id))continue;ellipse(ctx,d.x,d.y-69+Math.sin(time*2+d.x)*3,8,8,'#e4b857');ctx.fillStyle='#fff8d8';ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillText('!',d.x,d.y-65+Math.sin(time*2+d.x)*3);}
 // Moving wave highlights make the harbor feel alive.
 ctx.strokeStyle='#e3f5e262';ctx.lineWidth=2;for(let i=0;i<12;i++){const x=(400+i*160+Math.sin(time*.5+i)*20)*WORLD.sx,y=(1580+(i%3)*50)*WORLD.sy;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+20,y-4,x+40,y);ctx.stroke();}
 ctx.restore();
 const mW=mini.width,mH=mini.height;mctx.clearRect(0,0,mW,mH);mctx.drawImage(minimapBackground,0,0,mW,mH);const mx=mW/W,my=mH/H;
 mctx.strokeStyle='#fff8d3';mctx.lineWidth=1.5;mctx.strokeRect((camera.x-w/zoom/2)*mx,(camera.y-h/zoom/2)*my,w/zoom*mx,h/zoom*my);
 for(const n of npcs)ellipse(mctx,n.x*mx,n.y*my,4,4,'#324f61');
 ellipse(mctx,position.x*mx,position.y*my,6,6,'#e77855');ellipse(mctx,position.x*mx,position.y*my,2,2,'#fff4d1');
 window.townDiagnostics={player:{...position},camera:{...camera},world:{width:W,height:H},houses:entrances,inside:null,art:{...artState},direction,walking,pathLength:path.length,near:near?.id||null,paused,discovered:[...discovered],blocked:blocked(position.x,position.y)};
}
function update(dt){
 if(paused){walking=false;return;}
 if(inside){updateRoom(dt);return;}
 let dx=(held.has('ArrowRight')||held.has('d')?1:0)-(held.has('ArrowLeft')||held.has('a')?1:0),dy=(held.has('ArrowDown')||held.has('s')?1:0)-(held.has('ArrowUp')||held.has('w')?1:0);
 if(dx||dy){path=[];goal=null;}else if(path.length){dx=path[0].x-position.x;dy=path[0].y-position.y;if(Math.hypot(dx,dy)<8){path.shift();dx=dy=0;}}
 const len=Math.hypot(dx,dy);walking=len>0;
 if(len){direction=Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?0:2);const speed=270*dt;let xx=position.x+dx/len*speed,yy=position.y+dy/len*speed;if(!blocked(xx,position.y))position.x=xx;if(!blocked(position.x,yy))position.y=yy;foot+=dt;}
 camera.x=clamp(position.x,w/(zoom*2),W-w/(zoom*2));camera.y=clamp(position.y,h/(zoom*2),H-h/(zoom*2));
 near=places.filter(p=>Math.hypot(position.x-p.x,position.y-p.y)<115).sort((a,b)=>Math.hypot(position.x-a.x,position.y-a.y)-Math.hypot(position.x-b.x,position.y-b.y))[0]||null;
 const button=document.querySelector('#interact');button.disabled=!near;button.textContent=near?(near.house?'Enter '+houses.find(b=>b.id===near.id).name:near.id==='home'?'Enter my aquarium':npcs.includes(near)?'Talk to '+near.name:'Read '+near.name):'Walk closer to a friend';
 if(goal&&!path.length&&Math.hypot(position.x-goal.x,position.y-goal.y)<115){const arrived=goal;goal=null;if(arrived.house){enterRoom(arrived.id);return;}document.querySelector('#status').textContent='You reached '+arrived.name+'. Press E or tap the green button.';}
 document.querySelector('#district').textContent=position.x>2600*WORLD.sx?(position.y>1200*WORLD.sy?'East Coast Promenade':'Eastbank · Food, Art & Discovery'):position.y>1230*WORLD.sy?'Sunny Harbor & Shell Beach':position.x>2100*WORLD.sx?'Garden & Lighthouse':position.y>900*WORLD.sy?'Workshop Lane':position.x>1500*WORLD.sx?'Market Quarter':position.x<700*WORLD.sx?'Library Gardens':'Town Square';
 if(time-savedAt>1&&Math.hypot(position.x-lastSaved.x,position.y-lastSaved.y)>12){savedAt=time;lastSaved={...position};send({type:'position',x:position.x,y:position.y});}
}


let balconyReturnFloor=0;
let inside=null,roomPlayer={x:640,y:625},roomTarget=null,roomSpec=null,roomNear=null,roomPath=[];
const roomProps=new Map();
const roomImages=new Map();
const roomUi=document.createElement('section');roomUi.className='room-ui';roomUi.hidden=true;
roomUi.innerHTML='<div class="room-heading"><span class="room-eyebrow">LITTLE HARBOR · INDOORS</span><b id="room-title"></b><p id="room-level"></p></div><button id="room-exit" class="room-exit-guide">Walk to exit ↓</button><div class="room-actions"><p id="room-hint">Walk to a friend or a golden marker.</p><button id="room-play" disabled>Walk closer to interact</button></div>';
document.body.append(roomUi);
const roomPlay=document.querySelector('#room-play'),roomExit=document.querySelector('#room-exit'),roomHint=document.querySelector('#room-hint');
roomPlay.onclick=()=>{playRoom();canvas.focus();};
roomExit.onclick=()=>{if(!inside||paused)return;if(Math.hypot(roomPlayer.x-roomSpec.exit.x,roomPlayer.y-roomSpec.exit.y)<82)useRoomExit();else walkRoomTo(roomSpec.exit);canvas.focus();};
function walkRoomTo(p){roomPath=roomRoute(roomSpec,roomPlayer,p);roomTarget=roomPath.shift()||null;}
function useRoomExit(){if(roomSpec.balcony){enterRoom(inside.id,balconyReturnFloor,'balcony');}else if(roomSpec.floor){const id=inside.id;enterRoom(id,0,'stairs');}else exitRoom();}
function enterRoom(id,floor=0,arrival=null){
 inside=houses.find(b=>b.id===id);if(!inside)return;roomSpec=roomFor(inside,floor);
 path=[];goal=null;held.clear();roomTarget=null;roomPath=[];roomNear=null;walking=false;roomPlayer={...roomSpec.spawn};direction=2;
 if(arrival)roomPlayer=roomArrival(roomSpec,arrival);
 for(const obj of roomSpec.objects)if(!roomProps.has(obj.asset)){const img=new Image(),rec={img,ready:false,error:false};roomProps.set(obj.asset,rec);img.onload=()=>rec.ready=true;img.onerror=()=>rec.error=true;img.src=obj.url||'../assets/room-props/'+obj.asset+'.webp';}
 const imageKey=id+':'+roomSpec.floor;
 if(!roomImages.has(imageKey)){const img=new Image();const record={img,ready:false,error:false};roomImages.set(imageKey,record);img.onload=()=>record.ready=true;img.onerror=()=>record.error=true;img.src=roomSpec.image;}
 roomUi.hidden=false;document.body.classList.add('in-room');document.querySelector('#room-title').textContent=roomSpec.name;
 document.querySelector('#room-level').textContent=roomSpec.balcony?'Explore the balcony · Press E to return inside':roomSpec.spots.some(s=>s.kind==='work')?'Play a signature game · Earn coins using English':'Activities, balcony & exploration · Walk up, then press E';canvas.focus();updateRoomPrompt();
}
function exitRoom(){
 if(!inside)return;const door=entrances.find(e=>e.id===inside.id);if(door){position={x:door.x,y:door.y+24};camera={...position};}
 inside=null;roomSpec=null;roomNear=null;roomUi.hidden=true;document.body.classList.remove('in-room');held.clear();roomTarget=null;path=[];goal=null;walking=false;canvas.focus();
}
function playRoom(target=null){
 if(!inside||paused)return;roomNear=target?roomSpec.spots.find(s=>s.id===target.id):nearestSpot(roomSpec,roomPlayer);if(!roomNear||Math.hypot(roomNear.x-roomPlayer.x,roomNear.y-roomPlayer.y)>(roomNear.id==='stairs'?68:roomNear.id==='exit'?82:75))return;
 roomTarget=null;roomPath=[];held.clear();walking=false;
 if(roomNear.id==='exit'){useRoomExit();return;}
 if(roomNear.id==='stairs'){enterRoom(inside.id,1);return;}
 if(roomNear.kind==='balcony'){balconyReturnFloor=roomSpec.floor;enterRoom(inside.id,2);return;}
 send({type:'house-game',id:inside.id,spot:roomSpec.balcony&&roomNear.id!=='host'?'balcony-'+roomNear.id:roomSpec.floor&&roomNear.id!=='host'?'up-'+roomNear.id:roomNear.id});
}
function updateRoomPrompt(){
 roomNear=nearestSpot(roomSpec,roomPlayer);
 roomPlay.disabled=!roomNear;roomPlay.textContent=roomNear?(roomNear.id==='exit'?(roomSpec.balcony?'E · Return inside':roomSpec.floor?'E · Go downstairs':'E · Exit to town'):roomNear.kind==='balcony'?'E · Walk onto balcony':roomNear.id==='stairs'?'E · Go upstairs':'E · '+roomNear.name+' · +'+roomNear.reward+' coins'):'Walk closer to interact';
 roomHint.textContent=roomNear?(roomNear.id==='exit'?(roomSpec.balcony?'Return through the balcony door.':roomSpec.floor?'Return to the ground floor.':'Your adventure continues outside.'):['stairs','balcony'].includes(roomNear.kind)?roomNear.detail+'.':roomNear.detail+'. Complete the activity to earn coins.'):'Walk to a friend or a golden marker. Tap the floor or use the arrow keys.';
 roomExit.textContent=Math.hypot(roomPlayer.x-roomSpec.exit.x,roomPlayer.y-roomSpec.exit.y)<82?(roomSpec.balcony?'E · Return inside':roomSpec.floor?'E · Downstairs':'E · Exit to town'):(roomSpec.balcony?'Walk back inside ↓':roomSpec.floor?'Walk downstairs ↓':'Walk to exit ↓');
}
function updateRoom(dt){
 let dx=(held.has('ArrowRight')||held.has('d')?1:0)-(held.has('ArrowLeft')||held.has('a')?1:0),dy=(held.has('ArrowDown')||held.has('s')?1:0)-(held.has('ArrowUp')||held.has('w')?1:0);
 const manual=!!(dx||dy);if(manual){roomTarget=null;roomPath=[];}
 else if(roomTarget){dx=roomTarget.x-roomPlayer.x;dy=roomTarget.y-roomPlayer.y;if(Math.hypot(dx,dy)<3){roomPlayer={...roomTarget};roomTarget=roomPath.shift()||null;dx=dy=0;}}
 const len=Math.hypot(dx,dy);walking=false;
 if(len){direction=Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?0:2);
 const step=manual?260*dt:Math.min(260*dt,len),p=floorPoint(roomPlayer.x+dx/len*step,roomPlayer.y+dy/len*step,roomSpec);
 const before={...roomPlayer};if(roomWalkable(roomSpec,p.x,roomPlayer.y))roomPlayer.x=p.x;if(roomWalkable(roomSpec,roomPlayer.x,p.y))roomPlayer.y=p.y;walking=Math.hypot(roomPlayer.x-before.x,roomPlayer.y-before.y)>.05;if(walking)foot+=dt;
 }
 updateRoomPrompt();
}
function roomView(){
 const scale=Math.max(w/ROOM.width,h/ROOM.height,.8);
 return {scale,cx:clamp(roomPlayer.x,w/scale/2,ROOM.width-w/scale/2),cy:clamp(roomPlayer.y,h/scale/2,ROOM.height-h/scale/2)};
}
function roomLabel(s,active){
 const y=s.kind==='person'?s.y-156:s.y-70;
 ctx.font='600 18px system-ui';const ww=Math.max(96,ctx.measureText(s.name).width+30);
 round(ctx,s.x-ww/2,y,ww,33,10,active?'#fff5cb':'#fff9ebf2',active?'#d7aa47':'#ffffff88');
 ctx.fillStyle='#284c4b';ctx.textAlign='center';ctx.fillText(s.name,s.x,y+23);
 if(s.reward){ctx.font='600 13px system-ui';ctx.fillStyle='#fff5cf';round(ctx,s.x-39,y-23,78,21,7,'#245d55e8');ctx.fillStyle='#fff5cf';ctx.fillText('+'+s.reward+' coins',s.x,y-8);}
}
function drawRoomObject(s){
 const active=roomNear?.id===s.id;
 ellipse(ctx,s.x,s.y+2,36,12,active?'#fbe1a877':'#ffe8ad33');ctx.strokeStyle=active?'#ffeda9':'#efd49ba8';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(s.x,s.y+2,36,12,0,0,Math.PI*2);ctx.stroke();
 if(s.kind==='person'){paintResident(ctx,s.person,s.x,s.y,time);return;}
 if(s.kind==='balcony'){line(ctx,[[s.x-16,s.y],[s.x+16,s.y],[s.x+7,s.y-9]],'#fff1b5',4);return;}
 if(s.kind==='stairs'){line(ctx,[[s.x-18,s.y-5],[s.x,s.y-24],[s.x+18,s.y-5]],'#fff1b5',6);return;}
 if(s.furniture)return;
 // A small, freestanding activity lectern marks a tangible workstation.
 round(ctx,s.x-5,s.y-38,10,40,3,'#74533d');ellipse(ctx,s.x,s.y-1,18,5,'#78573f');
 poly(ctx,[[s.x-26,s.y-43],[s.x+19,s.y-48],[s.x+28,s.y-28],[s.x-24,s.y-22]],'#a67c50','#e3be80');
 poly(ctx,[[s.x-20,s.y-42],[s.x,s.y-43],[s.x+1,s.y-27],[s.x-19,s.y-25]],'#fff0d0');
 poly(ctx,[[s.x+1,s.y-43],[s.x+18,s.y-45],[s.x+23,s.y-29],[s.x+2,s.y-27]],'#e8dcbf');
 ctx.fillStyle='#5c8b80';ctx.fillRect(s.x-14,s.y-37,10,2);ctx.fillRect(s.x+6,s.y-37,10,2);
}
function drawRoomExit(){
 const s=roomSpec.exit,active=roomNear?.id==='exit';
 const glow=ctx.createRadialGradient(s.x,s.y,8,s.x,s.y,120);glow.addColorStop(0,active?'#f9d77a77':'#f4db7838');glow.addColorStop(1,'#ffdd7700');ctx.fillStyle=glow;ctx.fillRect(s.x-120,s.y-120,240,160);
 poly(ctx,[[s.x-82,s.y-5],[s.x+82,s.y-5],[s.x+103,s.y+61],[s.x-103,s.y+61]],'#435f598f','#f7e4ad');
 for(const xx of [-89,89]){round(ctx,s.x+xx-8,s.y-58,16,87,3,'#b18a53','#f2d69e');ellipse(ctx,s.x+xx,s.y-58,10,5,'#f8dfa7');}
 round(ctx,s.x-87,s.y-67,174,36,8,'#1e574e','#e6c578');
 ctx.textAlign='center';ctx.font='bold 19px system-ui';ctx.fillStyle='#fff7d6';ctx.fillText(roomSpec.balcony?'BACK INSIDE':roomSpec.floor?'DOWNSTAIRS':'EXIT · TOWN',s.x,s.y-42);
 for(let i=0;i<2;i++)line(ctx,[[s.x-12,s.y+i*18],[s.x,s.y+10+i*18],[s.x+12,s.y+i*18]],'#ffeab0',4);
 ctx.font='600 13px system-ui';ctx.fillText('Walk here · press E',s.x,s.y+53);
}
function drawRoom(){
 ctx.fillStyle='#243b38';ctx.fillRect(0,0,w,h);ctx.save();const v=roomView();ctx.translate(w/2-v.cx*v.scale,h/2-v.cy*v.scale);ctx.scale(v.scale,v.scale);
 const record=roomImages.get(inside.id+':'+roomSpec.floor);
 if(record?.ready)ctx.drawImage(record.img,0,0,ROOM.width,ROOM.height);
 else{const gradient=ctx.createLinearGradient(0,0,0,800);gradient.addColorStop(0,roomSpec.color);gradient.addColorStop(1,'#d6bd94');ctx.fillStyle=gradient;ctx.fillRect(0,0,1280,800);ctx.fillStyle='#fff9df';ctx.textAlign='center';ctx.font='24px system-ui';ctx.fillText(record?.error?'Room artwork unavailable — you can still explore.':'Opening '+inside.name+'…',640,200);}
 if(roomTarget){ctx.setLineDash([3,13]);line(ctx,[[roomPlayer.x,roomPlayer.y],[roomTarget.x,roomTarget.y]],'#fff4d7aa',3);ctx.setLineDash([]);}
 drawRoomExit();
 const things=roomSpec.spots.filter(s=>s.id!=='exit').map(s=>({y:s.y,paint:()=>drawRoomObject(s)}));
 for(const o of roomSpec.objects)things.push({y:o.y,paint:()=>{const a=roomProps.get(o.asset);if(!a?.ready)return;const hh=o.width*a.img.naturalHeight/a.img.naturalWidth;ctx.save();if(roomPlayer.y<o.y&&roomPlayer.y>o.y-hh&&Math.abs(roomPlayer.x-o.x)<o.width*.42)ctx.globalAlpha=.67;ctx.drawImage(a.img,o.x-o.width/2,o.y-hh,o.width,hh);ctx.restore();}});
 things.push({y:roomPlayer.y,paint:()=>paintExplorer(ctx,roomPlayer,direction,walking,foot)});
 things.sort((a,b)=>a.y-b.y).forEach(s=>s.paint());roomSpec.spots.filter(s=>s.id!=='exit').forEach(s=>roomLabel(s,roomNear?.id===s.id));
 ctx.restore();
 window.townDiagnostics={player:{...position},world:{width:W,height:H},art:{...artState},inside:inside.id,roomPlayer:{...roomPlayer},roomView:v,roomBounds:{...ROOM,exit:roomSpec.exit},roomFloor:roomSpec.floor,roomObjects:roomSpec.objects,propsReady:roomSpec.objects.every(o=>roomProps.get(o.asset)?.ready),roomImage:{url:roomSpec.image,ready:!!record?.ready,error:!!record?.error},roomSpots:roomSpec.spots,roomNear:roomNear?.id||null,roomTarget:roomTarget?{...roomTarget}:null,houses:entrances,paused,walking,blocked:!roomWalkable(roomSpec,roomPlayer.x,roomPlayer.y)};
}
function pointInRoom(e){
 const v=roomView(),p={x:(e.offsetX-w/2)/v.scale+v.cx,y:(e.offsetY-h/2)/v.scale+v.cy};
 const object=roomSpec.objects.find(o=>Math.abs(p.x-o.x)<o.width*.45&&p.y>o.y-o.width*.75&&p.y<o.y+8);
 const s=roomSpec.spots.filter(s=>Math.abs(p.x-s.x)<80&&p.y>s.y-(s.kind==='person'?155:105)&&p.y<s.y+35).sort((a,b)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(p.x-b.x,p.y-b.y))[0]||roomSpec.spots.find(s=>object&&s.furniture===object.id);
 if(s&&Math.hypot(s.x-roomPlayer.x,s.y-roomPlayer.y)<(s.id==='exit'?82:s.id==='stairs'?68:75)){roomNear=s;playRoom(s);return;}
 walkRoomTo(floorPoint(s?.x??p.x,s?.y??p.y,roomSpec));
}

function frame(now){const dt=last?Math.min((now-last)/1000,.05):.016;last=now;if(!document.hidden){time+=dt;update(dt);draw();}requestAnimationFrame(frame);}
function resize(){w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,1.6);zoom=Math.max(w<700?.77:1,w/W,h/H);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);mini.width=288;mini.height=128;camera={...position};draw();}
canvas.addEventListener('pointerdown',e=>{if(paused)return;canvas.focus();if(inside){pointInRoom(e);return;}const r=canvas.getBoundingClientRect(),p={x:(e.clientX-r.left-w/2)/zoom+camera.x,y:(e.clientY-r.top-h/2)/zoom+camera.y};const house=houses.find(b=>p.x>b.x&&p.x<b.x+b.w&&p.y>b.y&&p.y<b.y+b.h);const target=house?entrances.find(n=>n.id===house.id):places.find(n=>Math.hypot(n.x-p.x,n.y-38-p.y)<55);if(target){if(Math.hypot(position.x-target.x,position.y-target.y)<115)interact(target);else go(target.id);}else{goal=null;path=route(p.x,p.y);document.querySelector('#status').textContent='Follow the dotted path.';}});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&inside&&!paused){exitRoom();return;}const k=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','e'].includes(k)){e.preventDefault();if(k==='e'){if(!e.repeat)interact();}else if(!paused)held.add(k);}});
window.addEventListener('keyup',e=>held.delete(e.key.length===1?e.key.toLowerCase():e.key));window.addEventListener('blur',()=>held.clear());
document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();held.add(b.dataset.key);b.setPointerCapture(e.pointerId);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>held.delete(b.dataset.key));});
document.querySelector('#interact').onclick=()=>interact();document.querySelector('#center').onclick=()=>{camera={...position};draw();};
const select=document.querySelector('#destination');for(const p of places){const option=document.createElement('option');option.value=p.id;option.textContent=p.name;select.append(option);}select.onchange=()=>{go(select.value);select.value='';canvas.focus();};
mini.onclick=e=>{const r=mini.getBoundingClientRect();goal=null;path=route((e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H);};
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent||!e.data?.littleHarborTown)return;const d=e.data;if(d.type==='state'){if(d.position&&Number.isFinite(d.position.x)&&Number.isFinite(d.position.y)&&!blocked(d.position.x,d.position.y)){position={...d.position};camera={...position};}discovered=d.discovered||[];completed=d.completed||[];document.querySelector('#status').textContent=discovered.length+' of '+discoveries.length+' notices discovered';}if(d.type==='go')go(d.id);if(d.type==='pause'){paused=!!d.value;held.clear();}});
addEventListener('resize',()=>{if(artState.loaded===artState.total)resize();});document.addEventListener('visibilitychange',()=>{last=0;held.clear();});
try{
 await loadArt();buildWorld();resize();document.querySelector('#loading').remove();requestAnimationFrame(frame);send({type:'ready'});
}catch(error){document.querySelector('#loading-progress').textContent='The town could not load. Please try again.';document.querySelector('#retry').hidden=false;document.querySelector('#retry').onclick=()=>location.reload();console.error(error);}
