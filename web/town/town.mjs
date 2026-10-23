import {discoveries} from '../adventures.mjs';
const W=2600,H=1800,STEP=40,cols=Math.ceil(W/STEP),rows=Math.ceil(H/STEP);
const canvas=document.querySelector('#world'),ctx=canvas.getContext('2d',{alpha:false}),mini=document.querySelector('#map'),mctx=mini.getContext('2d');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+Math.random()*(b-a),send=d=>parent.postMessage({littleHarborTown:true,...d},location.origin);
let w=1000,h=640,dpr=1,zoom=1,time=0,last=0,paused=false,position={x:1030,y:980},camera={x:1030,y:980},path=[],goal=null,near=null,discovered=[],completed=[],savedAt=0,lastSaved={x:0,y:0},walking=false,held=new Set(),foot=0;
const portraits={},world=document.createElement('canvas');world.width=W;world.height=H;const g=world.getContext('2d');
const npcs=[
{id:'lily',name:'Lily',subtitle:'Welcome-day planner',x:1180,y:780,color:'#b78eaa',hair:'#805838'},
{id:'mia',name:'Mia',subtitle:'Fish Market',x:1760,y:590,color:'#759f9a',hair:'#5b3e2b'},
{id:'ben',name:'Ben',subtitle:'Design Workshop',x:560,y:1080,color:'#d2a26c',hair:'#5b4739'},
{id:'finn',name:'Captain Finn',subtitle:'Sunny Harbor',x:1830,y:1340,color:'#597b94',hair:'#d3c2a1'}
];
const home={id:'home',name:'My Aquarium',x:300,y:1090};
const places=[home,...npcs,...discoveries];
const buildings=[
{x:265,y:230,w:290,h:210,roof:'#8a9b94',body:'#ece7cf',title:'HARBOR LIBRARY',detail:'library'},
{x:1580,y:245,w:320,h:250,roof:'#72a5a0',body:'#f5e7ca',title:'FISH MARKET',detail:'market'},
{x:350,y:790,w:300,h:205,roof:'#b88470',body:'#f0dec1',title:'DESIGN WORKSHOP',detail:'workshop'},
{x:1650,y:1080,w:330,h:180,roof:'#6e91a2',body:'#f2e9d2',title:'HARBOR OFFICE',detail:'harbor'},
{x:160,y:835,w:155,h:190,roof:'#7d9c86',body:'#f3e7cb',title:'MY AQUARIUM',detail:'home'},
{x:960,y:180,w:245,h:185,roof:'#c39079',body:'#f5dfbf',title:'SUNBEAM CAFE',detail:'cafe'},
{x:2180,y:285,w:230,h:190,roof:'#82a99a',body:'#e3e4bf',title:'GLASS GARDEN',detail:'garden'},
{x:2230,y:1050,w:180,h:220,roof:'#ac7460',body:'#f6edd6',title:'LIGHTHOUSE',detail:'lighthouse'},
{x:80,y:120,w:130,h:140,roof:'#bd8c7c',body:'#f3e3c9',title:'',detail:'home'},
{x:680,y:150,w:150,h:160,roof:'#b5a078',body:'#eee4ca',title:'',detail:'home'},
{x:1400,y:100,w:160,h:150,roof:'#a2a787',body:'#f4dfca',title:'',detail:'home'},
{x:2060,y:80,w:175,h:145,roof:'#b58c7d',body:'#f1e4c7',title:'',detail:'home'}
];
const obstacles=buildings.map(b=>({x:b.x-12,y:b.y-20,w:b.w+24,h:b.h+28}));
obstacles.push({x:929,y:663,w:142,h:142});
function blocked(x,y){
 if(x<26||y<35||x>W-26||y>H-50)return true;
 if(y>1510&&!(x>1740&&x<2040&&y<1685))return true;
 return obstacles.some(o=>x>o.x-13&&x<o.x+o.w+13&&y>o.y-13&&y<o.y+o.h+13);
}
function round(c,x,y,ww,hh,r,fill,stroke){c.beginPath();c.roundRect(x,y,ww,hh,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
function ellipse(c,x,y,rx,ry,fill){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();}
function line(c,points,color,width=2){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();}
function poly(c,p,fill,stroke){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.stroke();}}
function tree(c,x,y,size=1){
 c.save();c.translate(x,y);c.scale(size,size);ellipse(c,8,7,27,12,'#415c4930');round(c,-4,-40,9,45,2,'#8b7651');
 ellipse(c,0,-48,34,35,'#6c996a');ellipse(c,-15,-62,27,26,'#88ae75');ellipse(c,16,-60,27,29,'#9dbc7c');ellipse(c,0,-79,26,24,'#a5c78b');
 line(c,[[-10,-39],[5,-54],[7,-67]],'#67915f77',2);c.restore();
}
function bench(c,x,y){round(c,x,y,67,17,4,'#8e8d62');round(c,x,y-14,67,10,3,'#baa173');line(c,[[x+9,y+14],[x+9,y+24]],'#65705a',5);line(c,[[x+56,y+14],[x+56,y+24]],'#65705a',5);}
function building(c,b){
 const {x,y,w:ww,h:hh,roof,body}=b;
 ellipse(c,x+ww*.58,y+hh+15,ww*.62,23,'#40513d26');
 round(c,x+ww-8,y+39,22,hh-33,3,'#c9bfa6');
 round(c,x,y+35,ww,hh-30,6,body,'#b9b799');
 for(let yy=y+57;yy<y+hh-10;yy+=22)line(c,[[x+5,yy],[x+ww-4,yy]],'#b8ac8d20',1);
 poly(c,[[x-15,y+48],[x+ww*.2,y-20],[x+ww+16,y+1],[x+ww+16,y+47]],roof);
 poly(c,[[x+ww*.2,y-20],[x+ww+16,y+1],[x+ww+16,y+47],[x+ww*.2,y+22]],'#ffffff13');
 line(c,[[x-15,y+48],[x+ww+16,y+47]],'#5d705c55',4);
 for(let xx=x+ww*.22;xx<x+ww;xx+=25)line(c,[[xx,y+7],[xx-ww*.15,y+43]],'#ffffff1b',1);
 const doorX=x+ww*.47;round(c,doorX,y+hh-65,35,65,17,'#628383');round(c,doorX+6,y+hh-59,23,30,9,'#a7c8bb');ellipse(c,doorX+27,y+hh-23,2,2,'#edcd7b');
 for(const xx of [x+ww*.15,x+ww*.72]){
  round(c,xx,y+hh*.43,ww*.14,hh*.22,7,'#fdf4d7');round(c,xx+5,y+hh*.43+5,ww*.14-10,hh*.22-10,3,'#8fb6b1');
  line(c,[[xx+ww*.07,y+hh*.43+5],[xx+ww*.07,y+hh*.65-5]],'#d8e7d4',3);
  round(c,xx-3,y+hh*.66,ww*.14+6,12,3,'#a29c70');
  for(let k=0;k<4;k++){ellipse(c,xx+k*ww*.035,y+hh*.65,5,7,'#72936b');ellipse(c,xx+k*ww*.035+3,y+hh*.64,3,3,k%2?'#d3a1a1':'#e8cb82');}
 }
 if(b.detail==='market'||b.detail==='cafe'){for(let i=0;i<10;i++)round(c,x+i*ww/10,y+hh*.68,ww/10,22,[0,0,9,9],i%2?'#f9f0d6':b.detail==='market'?'#79aaa0':'#c99885');}
 if(b.detail==='library'){round(c,x+ww*.3,y+49,ww*.42,39,4,'#e4ddbe');c.fillStyle='#577366';c.font='22px Georgia';c.textAlign='center';c.fillText('BOOKS & STORIES',x+ww*.51,y+75);}
 if(b.detail==='garden'){for(let n=0;n<4;n++){round(c,x+20+n*47,y+55,38,hh-80,4,'#a4c9ab90','#fff9dc99');line(c,[[x+39+n*47,y+58],[x+39+n*47,y+hh-30]],'#fff9dc99',2);}}
 if(b.detail==='lighthouse'){c.fillStyle='#c48372';c.fillRect(x+35,y+73,ww-70,23);round(c,x+47,y-60,ww-94,77,8,'#f3e5bf','#c8bb94');round(c,x+54,y-49,ww-108,40,4,'#f6db8c');poly(c,[[x+35,y-60],[x+ww/2,y-101],[x+ww-35,y-60]],roof);}
 if(b.title){c.font='600 12px system-ui';c.textAlign='center';const tw=c.measureText(b.title).width+24;round(c,x+ww/2-tw/2,y+hh+18,tw,26,8,'#fffbeddd');c.fillStyle='#435e54';c.fillText(b.title,x+ww/2,y+hh+36);}
}
function buildWorld(){
 g.fillStyle='#bad1a4';g.fillRect(0,0,W,H);
 for(let y=0;y<H;y+=60)for(let x=0;x<W;x+=70){ellipse(g,x+Math.sin(y)*22,y,25,16,(x+y)%3?'#b4cca022':'#e3e7b033');}
 // A continuous road network connects every district.
 const roads=[[[120,540],[2430,540]],[[120,1120],[2430,1120]],[[1070,95],[1070,1450]],[[140,745],[2030,745]],[[770,400],[770,1230]],[[1480,430],[1480,1390]],[[2070,500],[2070,1400]],[[260,1050],[260,1170]],[[1770,1120],[1770,1560]],[[2200,1400],[2430,1400]],[[720,1260],[2100,1260]]];
 for(const pts of roads){line(g,pts,'#94b58a',84);line(g,pts,'#efe4c6',71);line(g,pts,'#e6dabb',60);}
 for(const pts of roads){g.setLineDash([2,19]);line(g,pts,'#c9bea34d',2);g.setLineDash([]);}
 // Water and promenade.
 g.fillStyle='#78b3bb';g.fillRect(0,1510,W,290);
 for(let y=1550;y<H;y+=32){g.strokeStyle='#d2eee14a';g.lineWidth=2;for(let x=0;x<W;x+=90){g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+22,y-6,x+45,y);g.stroke();}}
 poly(g,[[0,1480],[600,1480],[800,1450],[1440,1450],[1570,1510],[2600,1500],[2600,1540],[0,1540]],'#ded5af');
 line(g,[[0,1485],[600,1485],[800,1455],[1440,1455],[1570,1515],[2600,1505]],'#fbf1d2',7);
 round(g,1760,1470,260,210,5,'#b69d73','#7c8267');
 for(let yy=1480;yy<1680;yy+=16)line(g,[[1770,yy],[2010,yy]],'#e2c897',2);
 for(const x of [1770,2010])for(const yy of [1490,1570,1655])round(g,x,yy,12,30,3,'#716f56');
 g.fillStyle='#eff2dc';g.font='600 18px system-ui';g.textAlign='center';g.fillText('EAST PIER',1890,1640);
 // Beach garden and planted green squares.
 ellipse(g,1200,1408,260,65,'#efe0b8');
 for(let i=0;i<20;i++){ellipse(g,1000+i*19,1418+Math.sin(i*3)*24,3,2,i%2?'#c6b193':'#fff4d6');}
 round(g,185,580,455,125,35,'#9fc391');
 round(g,2190,600,280,270,60,'#a3c790');
 for(let i=0;i<9;i++){const x=2230+(i%3)*70,yy=650+Math.floor(i/3)*65;ellipse(g,x,yy,25,16,'#81ad7e');for(let k=0;k<7;k++)ellipse(g,x+Math.cos(k)*18,yy+Math.sin(k)*9,4,4,['#eab3a4','#efd88e','#d3acd1'][i%3]);}
 // Fountain and surrounding benches.
 ellipse(g,1000,735,92,64,'#b0b999');ellipse(g,1000,731,72,50,'#eee6c9');ellipse(g,1000,727,61,40,'#83babd');ellipse(g,1000,719,34,22,'#b9ded1');round(g,991,684,18,46,8,'#dddcc3');ellipse(g,1000,683,27,12,'#e6e8cd');
 bench(g,870,825);bench(g,1100,825);bench(g,899,600);
 // Building objects and trees are drawn back to front.
 const scenery=buildings.map(b=>({y:b.y+b.h,paint:()=>building(g,b)}));
 const positions=[[80,380],[130,700],[660,360],[850,410],[1280,380],[1400,350],[1990,350],[2490,330],[2500,670],[2490,930],[2230,940],[2130,1050],[1280,1180],[1360,1130],[80,1020],[100,1280],[390,1300],[550,1370],[850,1320],[1570,1010],[1340,910],[1550,810],[2230,760],[2450,1370]];
 for(const [x,y]of positions)scenery.push({y,paint:()=>tree(g,x,y,.85+((x+y)%4)*.08)});
 scenery.sort((a,b)=>a.y-b.y).forEach(s=>s.paint());
 for(const s of discoveries){round(g,s.x-4,s.y-10,8,30,2,'#8c8060');round(g,s.x-26,s.y-45,52,40,7,'#fff3cf','#ae9d72');g.fillStyle='#618578';g.font='bold 20px Georgia';g.textAlign='center';g.fillText('i',s.x,s.y-18);}
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
function go(id){const p=places.find(x=>x.id===id);if(!p)return;goal=p;path=route(p.x,p.y+45);document.querySelector('#status').textContent='Walking to '+p.name+'…';if(!path.length&&Math.hypot(position.x-p.x,position.y-p.y)>110)document.querySelector('#status').textContent='Choose a nearby path to reach '+p.name+'.';}
function interact(p=near){if(!p||paused||Math.hypot(position.x-p.x,position.y-p.y)>120)return;path=[];goal=null;if(p.id==='home')send({type:'home'});else if(npcs.some(n=>n.id===p.id))send({type:'person',id:p.id});else send({type:'discovery',id:p.id});}
function screen(p){return{x:(p.x-camera.x)*zoom+w/2,y:(p.y-camera.y)*zoom+h/2};}
function human(c,x,y,color,hair,walk,scale=1){
 c.save();c.translate(x,y);c.scale(scale,scale);ellipse(c,0,3,16,7,'#33523e35');
 const stride=Math.sin(foot*9)*6*(walk?1:0);
 line(c,[[-6,-10],[-7-stride*.4,3+stride*.5]],'#516269',7);line(c,[[6,-10],[7+stride*.4,3-stride*.5]],'#516269',7);
 round(c,-12,-35,24,29,8,color);round(c,-16,-33,7,22,4,'#d7aa81');round(c,9,-33,7,22,4,'#d7aa81');
 ellipse(c,0,-46,13,15,'#e3b68e');ellipse(c,0,-53,14,10,hair);ellipse(c,-9,-47,5,8,hair);c.fillStyle='#42514a';c.fillRect(3,-47,2,2);c.restore();
}
function draw(){
 ctx.fillStyle='#b5cda5';ctx.fillRect(0,0,w,h);
 const sx=camera.x-w/(2*zoom),sy=camera.y-h/(2*zoom);
 ctx.drawImage(world,sx,sy,w/zoom,h/zoom,0,0,w,h);
 ctx.save();ctx.translate(w/2-camera.x*zoom,h/2-camera.y*zoom);ctx.scale(zoom,zoom);
 if(path.length){ctx.setLineDash([3,10]);line(ctx,[[position.x,position.y],...path.map(p=>[p.x,p.y])],'#fffbedae',3);ctx.setLineDash([]);ellipse(ctx,path.at(-1).x,path.at(-1).y,12,6,'#fffad380');}
 const actors=[...npcs.map(n=>({y:n.y,paint:()=>human(ctx,n.x,n.y,n.color,n.hair,false)})),{y:position.y,paint:()=>{human(ctx,position.x,position.y,'#6899ae','#72533d',walking,1.08);round(ctx,position.x-10,position.y-29,18,17,6,'#dfb76a');}}];actors.sort((a,b)=>a.y-b.y).forEach(a=>a.paint());
 for(const n of npcs){const close=Math.hypot(position.x-n.x,position.y-n.y)<110;ctx.save();ctx.translate(n.x,n.y-90);round(ctx,-51,-20,102,32,15,close?'#fff2be':'#fffdf0e8');ctx.fillStyle='#365c52';ctx.font='600 13px system-ui';ctx.textAlign='center';ctx.fillText(n.name,0,1);ctx.restore();}
 for(const d of discoveries){if(discovered.includes(d.id))continue;ellipse(ctx,d.x,d.y-55+Math.sin(time*2+d.x)*3,8,8,'#e4b857');ctx.fillStyle='#fff8d8';ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillText('!',d.x,d.y-51+Math.sin(time*2+d.x)*3);}
 // Moving wave highlights make the harbor feel alive.
 ctx.strokeStyle='#e3f5e262';ctx.lineWidth=2;for(let i=0;i<12;i++){const x=400+i*160+Math.sin(time*.5+i)*20,y=1580+(i%3)*50;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+20,y-4,x+40,y);ctx.stroke();}
 ctx.restore();
 const mW=mini.width,mH=mini.height;mctx.clearRect(0,0,mW,mH);mctx.drawImage(world,0,0,mW,mH);const mx=mW/W,my=mH/H;
 mctx.strokeStyle='#fff8d3';mctx.lineWidth=1.5;mctx.strokeRect((camera.x-w/zoom/2)*mx,(camera.y-h/zoom/2)*my,w/zoom*mx,h/zoom*my);
 for(const n of npcs)ellipse(mctx,n.x*mx,n.y*my,2.5,2.5,'#324f61');
 ellipse(mctx,position.x*mx,position.y*my,3.5,3.5,'#e77855');ellipse(mctx,position.x*mx,position.y*my,1.3,1.3,'#fff4d1');
 window.townDiagnostics={player:{...position},camera:{...camera},world:{width:W,height:H},walking,pathLength:path.length,near:near?.id||null,paused,discovered:[...discovered],blocked:blocked(position.x,position.y)};
}
function update(dt){
 if(paused){walking=false;return;}
 let dx=(held.has('ArrowRight')||held.has('d')?1:0)-(held.has('ArrowLeft')||held.has('a')?1:0),dy=(held.has('ArrowDown')||held.has('s')?1:0)-(held.has('ArrowUp')||held.has('w')?1:0);
 if(dx||dy){path=[];goal=null;}else if(path.length){dx=path[0].x-position.x;dy=path[0].y-position.y;if(Math.hypot(dx,dy)<8){path.shift();dx=dy=0;}}
 const len=Math.hypot(dx,dy);walking=len>0;
 if(len){const speed=175*dt;let xx=position.x+dx/len*speed,yy=position.y+dy/len*speed;if(!blocked(xx,position.y))position.x=xx;if(!blocked(position.x,yy))position.y=yy;foot+=dt;}
 camera.x=clamp(position.x,w/(zoom*2),W-w/(zoom*2));camera.y=clamp(position.y,h/(zoom*2),H-h/(zoom*2));
 near=places.filter(p=>Math.hypot(position.x-p.x,position.y-p.y)<115).sort((a,b)=>Math.hypot(position.x-a.x,position.y-a.y)-Math.hypot(position.x-b.x,position.y-b.y))[0]||null;
 const button=document.querySelector('#interact');button.disabled=!near;button.textContent=near?(near.id==='home'?'Enter my aquarium':npcs.includes(near)?'Talk to '+near.name:'Read '+near.name):'Walk closer to a friend';
 if(goal&&!path.length&&Math.hypot(position.x-goal.x,position.y-goal.y)<115){const arrived=goal;goal=null;document.querySelector('#status').textContent='You reached '+arrived.name+'. Press E or tap the green button.';}
 document.querySelector('#district').textContent=position.y>1230?'Sunny Harbor & Shell Beach':position.x>2100?'Garden & Lighthouse':position.y>900?'Workshop Lane':position.x>1500?'Market Quarter':position.x<700?'Library Gardens':'Town Square';
 if(time-savedAt>1&&Math.hypot(position.x-lastSaved.x,position.y-lastSaved.y)>12){savedAt=time;lastSaved={...position};send({type:'position',x:position.x,y:position.y});}
}
function frame(now){const dt=last?Math.min((now-last)/1000,.05):.016;last=now;if(!document.hidden){time+=dt;update(dt);draw();}requestAnimationFrame(frame);}
function resize(){w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,1.6);zoom=w<700?.77:1;canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);mini.width=144;mini.height=100;camera={...position};draw();}
canvas.addEventListener('pointerdown',e=>{if(paused)return;canvas.focus();const r=canvas.getBoundingClientRect(),p={x:(e.clientX-r.left-w/2)/zoom+camera.x,y:(e.clientY-r.top-h/2)/zoom+camera.y};const target=places.find(n=>Math.hypot(n.x-p.x,n.y-38-p.y)<55);if(target){if(Math.hypot(position.x-target.x,position.y-target.y)<115)interact(target);else go(target.id);}else{goal=null;path=route(p.x,p.y);document.querySelector('#status').textContent='Follow the dotted path.';}});
window.addEventListener('keydown',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','e'].includes(k)){e.preventDefault();if(k==='e')interact();else held.add(k);}});
window.addEventListener('keyup',e=>held.delete(e.key.length===1?e.key.toLowerCase():e.key));window.addEventListener('blur',()=>held.clear());
document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();held.add(b.dataset.key);b.setPointerCapture(e.pointerId);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>held.delete(b.dataset.key));});
document.querySelector('#interact').onclick=()=>interact();document.querySelector('#center').onclick=()=>{camera={...position};draw();};
const select=document.querySelector('#destination');for(const p of places){const option=document.createElement('option');option.value=p.id;option.textContent=p.name;select.append(option);}select.onchange=()=>{go(select.value);select.value='';canvas.focus();};
mini.onclick=e=>{const r=mini.getBoundingClientRect();goal=null;path=route((e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H);};
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent||!e.data?.littleHarborTown)return;const d=e.data;if(d.type==='state'){if(d.position&&Number.isFinite(d.position.x)&&Number.isFinite(d.position.y)&&!blocked(d.position.x,d.position.y)){position={...d.position};camera={...position};}discovered=d.discovered||[];completed=d.completed||[];document.querySelector('#status').textContent=discovered.length+' of '+discoveries.length+' notices discovered';}if(d.type==='go')go(d.id);if(d.type==='pause'){paused=!!d.value;held.clear();}});
addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{last=0;held.clear();});
buildWorld();resize();requestAnimationFrame(frame);send({type:'ready'});
