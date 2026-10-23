import {WORLD,houses,entrances,houseLevels} from '../places.mjs';
import {discoveries} from '../adventures.mjs';
import {artState,loadArt,paintGround,setupScenery,paintScenery,paintExplorer} from './scenery.mjs';
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
const minimapBackground=document.createElement('canvas');minimapBackground.width=288;minimapBackground.height=200;
function buildWorld(){
 paintGround(g,W,H);setupScenery(buildings,discoveries);
 const mc=minimapBackground.getContext('2d');mc.drawImage(world,0,0,288,200);mc.save();mc.scale(288/W,200/H);paintScenery(mc,{map:true});mc.restore();
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
 document.querySelector('#district').textContent=position.y>1230*WORLD.sy?'Sunny Harbor & Shell Beach':position.x>2100*WORLD.sx?'Garden & Lighthouse':position.y>900*WORLD.sy?'Workshop Lane':position.x>1500*WORLD.sx?'Market Quarter':position.x<700*WORLD.sx?'Library Gardens':'Town Square';
 if(time-savedAt>1&&Math.hypot(position.x-lastSaved.x,position.y-lastSaved.y)>12){savedAt=time;lastSaved={...position};send({type:'position',x:position.x,y:position.y});}
}

let inside=null,roomPlayer={x:480,y:550},roomTarget=null;
const roomImage=new Image();roomImage.src='../assets/town-art/cottage-interior-v4.webp';
const roomUi=document.createElement('section');roomUi.className='room-ui';roomUi.hidden=true;
roomUi.innerHTML='<div><b id="room-title"></b><p id="room-level"></p></div><div class="room-actions"><button id="room-play">Play activity · 开始游戏</button><button id="room-exit">Outside · 返回小镇</button></div>';
document.body.append(roomUi);
document.querySelector('#room-play').onclick=playRoom;document.querySelector('#room-exit').onclick=exitRoom;
function enterRoom(id){inside=houses.find(b=>b.id===id);if(!inside)return;path=[];goal=null;held.clear();roomTarget=null;roomPlayer={x:480,y:550};roomUi.hidden=false;document.body.classList.add('in-room');document.querySelector('#room-title').textContent=inside.name;document.querySelector('#room-level').textContent=houseLevels[inside.level]+' · '+['Choose pictures','Listen & remember','Read & create'][inside.level];canvas.focus();}
function exitRoom(){inside=null;roomUi.hidden=true;document.body.classList.remove('in-room');held.clear();roomTarget=null;canvas.focus();}
function playRoom(){if(inside&&!paused)send({type:'house-game',id:inside.id});}
function updateRoom(dt){let dx=(held.has('ArrowRight')||held.has('d')?1:0)-(held.has('ArrowLeft')||held.has('a')?1:0),dy=(held.has('ArrowDown')||held.has('s')?1:0)-(held.has('ArrowUp')||held.has('w')?1:0);if(dx||dy)roomTarget=null;else if(roomTarget){dx=roomTarget.x-roomPlayer.x;dy=roomTarget.y-roomPlayer.y;if(Math.hypot(dx,dy)<8){roomTarget=null;dx=dy=0;}}const len=Math.hypot(dx,dy);walking=!!len;if(len){direction=Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?0:2);roomPlayer.x=clamp(roomPlayer.x+dx/len*190*dt,240,740);roomPlayer.y=clamp(roomPlayer.y+dy/len*190*dt,370,595);foot+=dt;}}
function roomView(){const scale=Math.max(w/960,h/640);return {scale,cx:clamp(roomPlayer.x,w/scale/2,960-w/scale/2)};}
function drawRoom(){ctx.fillStyle='#d5b789';ctx.fillRect(0,0,w,h);ctx.save();const v=roomView();ctx.translate(w/2-v.cx*v.scale,0);ctx.scale(v.scale,v.scale);if(roomImage.complete&&roomImage.naturalWidth)ctx.drawImage(roomImage,0,0,960,640);paintExplorer(ctx,roomPlayer,direction,walking,foot);ctx.restore();window.townDiagnostics={player:{...position},world:{width:W,height:H},art:{...artState},inside:inside.id,roomPlayer:{...roomPlayer},houses:entrances,paused,walking,blocked:false};}

function frame(now){const dt=last?Math.min((now-last)/1000,.05):.016;last=now;if(!document.hidden){time+=dt;update(dt);draw();}requestAnimationFrame(frame);}
function resize(){w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,1.6);zoom=Math.max(w<700?.77:1,w/W,h/H);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);mini.width=288;mini.height=200;camera={...position};draw();}
canvas.addEventListener('pointerdown',e=>{if(paused)return;canvas.focus();if(inside){const v=roomView();roomTarget={x:clamp((e.offsetX-w/2)/v.scale+v.cx,240,740),y:clamp(e.offsetY/v.scale,370,595)};return;}const r=canvas.getBoundingClientRect(),p={x:(e.clientX-r.left-w/2)/zoom+camera.x,y:(e.clientY-r.top-h/2)/zoom+camera.y};const house=houses.find(b=>p.x>b.x&&p.x<b.x+b.w&&p.y>b.y&&p.y<b.y+b.h);const target=house?entrances.find(n=>n.id===house.id):places.find(n=>Math.hypot(n.x-p.x,n.y-38-p.y)<55);if(target){if(Math.hypot(position.x-target.x,position.y-target.y)<115)interact(target);else go(target.id);}else{goal=null;path=route(p.x,p.y);document.querySelector('#status').textContent='Follow the dotted path.';}});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&inside&&!paused){exitRoom();return;}const k=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','e'].includes(k)){e.preventDefault();if(k==='e')interact();else held.add(k);}});
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
