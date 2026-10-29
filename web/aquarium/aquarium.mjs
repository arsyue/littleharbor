import {advanceFish} from './motion.mjs';
import {decorLayout,dragDecor} from './decor-layout.mjs';
// Original Little Harbor aquarium. No third-party aquarium code or artwork.
const canvas=document.querySelector('canvas'), ctx=canvas.getContext('2d',{alpha:false});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), mix=(a,b,t)=>a+(b-a)*t;
const rand=(a,b)=>a+Math.random()*(b-a), TAU=Math.PI*2;
const send=data=>parent.postMessage({littleHarbor:true,...data},location.origin);
let w=1000,h=600,dpr=1,time=0,previous=0,frameCount=0,fps=60,night=false,paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
let tank=0,editing=false,fish=[],decor=[],food=[],bubbles=[],drag=null,down=null,feedingUntil=0,started=performance.now(),firstFrameMs=0;
let background=document.createElement('canvas'),bg=background.getContext('2d'),area={},floorFront=0,plantSprites=[];
const cache=new Map(),loadedImages=new Map();
function seed(s){let n=0;for(const c of s)n=(n*31+c.charCodeAt(0))>>>0;return()=>((n=(1664525*n+1013904223)>>>0)/4294967296);}
const species={
 goldfish:{top:'#975222',mid:'#ef9f32',belly:'#fff0bc',fin:'#e88d27',body:.37,speed:.057},
 guppy:{top:'#34494e',mid:'#92c9cd',belly:'#e3f5de',fin:'#dc795b',body:.19,speed:.08},
 'blue-tang':{top:'#152e58',mid:'#267ddd',belly:'#75d6ee',fin:'#f5d966',body:.40,speed:.07},
 clownfish:{top:'#953513',mid:'#f2922d',belly:'#ffd394',fin:'#ee963e',body:.32,speed:.065},
 angelfish:{top:'#697e82',mid:'#c8ddd5',belly:'#f4ead2',fin:'#bbd4cd',body:.61,speed:.04},
 betta:{top:'#482a4a',mid:'#b45578',belly:'#f4afbc',fin:'#b45482',body:.27,speed:.045},
 pufferfish:{top:'#6b7940',mid:'#b1b968',belly:'#f3e5bd',fin:'#aebf9e',body:.48,speed:.035},
 seahorse:{top:'#92713d',mid:'#dab46a',belly:'#fff0b9',fin:'#e2d0a0',body:.34,speed:.024}
};
Object.assign(species,{"neon-tetra":{"top":"#244b62","mid":"#57bbd6","belly":"#e3eff2","fin":"#cd5c53","body":0.22,"speed":0.075,"scale":0.78},"yellow-tang":{"top":"#b89f22","mid":"#efd33b","belly":"#fff3a3","fin":"#e8c934","body":0.56,"speed":0.06},"discus":{"top":"#377e83","mid":"#7dc5bd","belly":"#cce7d5","fin":"#ab655a","body":0.72,"speed":0.035},"platy":{"top":"#a15322","mid":"#e49b40","belly":"#ffe3a4","fin":"#df9148","body":0.31,"speed":0.06,"scale":0.85},"molly":{"top":"#152629","mid":"#344d52","belly":"#78918d","fin":"#283f44","body":0.3,"speed":0.05},"swordtail":{"top":"#375a36","mid":"#86a857","belly":"#d9d894","fin":"#d68c47","body":0.23,"speed":0.065},"zebra-danio":{"top":"#395570","mid":"#a5c0c6","belly":"#e9e8d8","fin":"#9cbac5","body":0.2,"speed":0.085,"scale":0.8},"rainbowfish":{"top":"#2b677f","mid":"#63adb6","belly":"#eacb8e","fin":"#dca448","body":0.36,"speed":0.065}});
function shape(c,points,fill,stroke,width=1){c.beginPath();for(const p of points){if(p[0]==='M')c.moveTo(p[1],p[2]);if(p[0]==='L')c.lineTo(p[1],p[2]);if(p[0]==='C')c.bezierCurveTo(...p.slice(1));if(p[0]==='Q')c.quadraticCurveTo(...p.slice(1));if(p[0]==='Z')c.closePath();}if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function oval(c,x,y,rx,ry,color,angle=0){c.beginPath();c.ellipse(x,y,rx,ry,angle,0,TAU);c.fillStyle=color;c.fill();}

let scene3d=null,renderMode='loading';
import('./scene3d.mjs').then(({AquariumScene})=>{
 try{scene3d=new AquariumScene();scene3d.resize(w,h,dpr);renderMode='webgl-volume';if(paused)draw();}
 catch{renderMode='illustrated-fallback';}
}).catch(()=>{renderMode='illustrated-fallback';});
function requestSprite(kind,id){
 const key=kind+'/'+id;if(loadedImages.has(key))return;
 const img=new Image(),record={img,ready:false,error:false};loadedImages.set(key,record);
 img.onload=()=>{record.ready=true;if(paused)draw();};img.onerror=()=>record.error=true;img.src='../assets/'+kind+'/'+id+'.webp';
}
function fishScreen(f){return{x:area.x+f.x*area.w,y:area.top+f.y*area.swimH+(f.z-.5)*h*.035};}
function drawFish(f){
 const s=species[f.id]||species.goldfish,p=fishScreen(f);
 const density=fish.length>40?.62:fish.length>24?.73:fish.length>12?.85:1;
 const size=1.6*(s.scale||1)*density*clamp(w*.09,52,116)*[1,.93,.85][tank]*mix(.7,1.12,f.z)*(f.id==='guppy'?.78:1);
 f.sx=p.x;f.sy=p.y;f.radius=size*.42;
 const photo=loadedImages.get('fish/'+f.id);if(!photo?.ready)return;
 if(scene3d){scene3d.fish(f,photo.img,p,size,time);return;}
 const im=photo.img,ratio=im.naturalHeight/im.naturalWidth;
 ctx.save();ctx.translate(p.x,p.y);ctx.rotate(clamp(f.vy*2.2,-.19,.19)*Math.cos(f.heading));
 // Keep the identical artwork on browsers without WebGL, without a paper-thin turn.
 ctx.scale(Math.cos(f.heading)>=0?1:-1,1);
 ctx.drawImage(im,-size/2,-size*ratio/2,size,size*ratio);ctx.restore();
}
function stone(c,x,y,size,color,rnd=()=>.5){
 const gr=c.createLinearGradient(x-size,y-size,x+size,y+size);gr.addColorStop(0,color);gr.addColorStop(1,'#25383a');
 c.beginPath();c.moveTo(x-size,y);
 for(let i=0;i<=8;i++){const a=Math.PI+i*Math.PI/8;c.lineTo(x+Math.cos(a)*size*(.8+rnd()*.2),y+Math.sin(a)*size*.7);}
 c.quadraticCurveTo(x+size,y+size*.38,x-size,y);c.fillStyle=gr;c.fill();
 c.strokeStyle='#bdc9ad35';c.lineWidth=1;c.stroke();
}
function plant(c,x,y,size,rnd,clock=0,tint=0){
 const colors=tint?['#377c71','#4da687','#8fbd8d']:['#175b4d','#347747','#77a85b'];
 for(let i=0;i<6;i++){
  const stem=(i-2.5)*size*.09, height=size*(.58+rnd()*.5), sway=Math.sin(clock*.45+i+x)*size*.045;
  c.beginPath();c.moveTo(x+stem,y);c.quadraticCurveTo(x+stem+sway,y-height*.5,x+stem*1.9+sway,y-height);c.strokeStyle=colors[1];c.lineWidth=Math.max(.7,size*.012);c.stroke();
  for(let k=1;k<7;k++){
   const yy=y-height*k/7,xx=x+stem*(1+k/8)+sway*k/7,side=k%2?1:-1,leaf=size*(.14-rnd()*.045);
   const gradient=c.createLinearGradient(xx,yy,xx+side*leaf,yy-leaf*.7);gradient.addColorStop(0,colors[0]);gradient.addColorStop(.6,colors[1]);gradient.addColorStop(1,colors[2]);
   shape(c,[['M',xx,yy],['Q',xx+side*leaf*.1,yy-leaf*.8,xx+side*leaf,yy-leaf*.9],['Q',xx+side*leaf*.8,yy+leaf*.1,xx,yy]],gradient);
  }
 }
}
function layout(){
 const top=w<700?150:clamp(h*.14,55,90),bottom=w<700?h-80:h-clamp(h*.17,73,115),inset=w*[.07,.04,.02][tank];
 floorFront=w<700?h-30:h-37;
 area={x:inset+15,w:w-inset*2-30,top,swimH:bottom-top-35,bottom,inset};
}
function rebuildBackground(){
 background.width=Math.round(w*dpr);background.height=Math.round(h*dpr);bg.setTransform(dpr,0,0,dpr,0,0);layout();
 const c=bg,r=seed('little-harbor-floor-'+tank), floor=area.bottom;
 const water=c.createLinearGradient(0,0,0,h);water.addColorStop(0,'#103c42');water.addColorStop(.3,'#0c3037');water.addColorStop(.78,'#123c3e');water.addColorStop(1,'#061c25');c.fillStyle=water;c.fillRect(0,0,w,h);
 const glow=c.createRadialGradient(w*.5,h*.05,0,w*.5,h*.2,w*.65);glow.addColorStop(0,'#83c2a42e');glow.addColorStop(1,'#0d373600');c.fillStyle=glow;c.fillRect(0,0,w,h);
 // Rear slopes and a subtle perspective substrate.
 shape(c,[['M',area.x,floor-28],['Q',w*.28,floor-57,w*.5,floor-24],['Q',w*.8,floor-50,w-area.x,floor-27],['L',w-12,floorFront],['L',12,floorFront],['Z']],'#3f5a50');
 const sand=c.createLinearGradient(0,floor-20,0,floorFront);sand.addColorStop(0,'#8f9673');sand.addColorStop(.35,'#c6b993');sand.addColorStop(1,'#625d4d');
 shape(c,[['M',area.x,floor-17],['Q',w*.35,floor-29,w*.5,floor-11],['Q',w*.8,floor-19,w-area.x,floor-18],['L',w-10,floorFront-2],['L',10,floorFront-2],['Z']],sand);
 for(let i=0;i<1000;i++){const x=r()*w,y=floor-12+r()*Math.max(1,floorFront-floor+10);oval(c,x,y,.4+r()*1.5,.4+r()*.7,i%3?'#2f402d22':'#fff6cd33');}
 // Established background planting is part of the habitat, purchased ornaments remain separate.
 for(let i=0;i<13;i++){const x=(.04+i*.075+r()*.02)*w,edge=Math.abs(x/w-.5);const height=clamp((area.bottom-area.top)*(.26+edge*.32+r()*.15),55,235);plant(c,x,floor-11-r()*20,height,r,0,i%3===0);}
 for(let i=0;i<18;i++){const x=r()*w;stone(c,x,floor+r()*28,5+r()*16,['#6a7b70','#a4a189','#879489'][i%3],r);}
 // Driftwood forms a quiet central focal point.
 c.save();c.translate(w*.25,floor+5);c.rotate(-.12);
 const wood=c.createLinearGradient(0,-35,0,15);wood.addColorStop(0,'#6e6d4b');wood.addColorStop(.4,'#423e30');wood.addColorStop(1,'#26392f');
 shape(c,[['M',-w*.08,5],['C',-10,-20,w*.08,-1,w*.15,-20],['L',w*.21,-65],['L',w*.195,-14],['L',w*.32,-27],['L',w*.25,-8],['Q',w*.13,17,-w*.08,5]],wood);
 c.strokeStyle='#b0a17535';c.lineWidth=2;for(let i=0;i<4;i++){c.beginPath();c.moveTo(-w*.05,i*3);c.quadraticCurveTo(w*.08,-8+i*3,w*.24,-13+i*2);c.stroke();}c.restore();
 for(let i=0;i<7;i++)stone(c,w*(.15+i*.04),floor+11,12+r()*20,['#7b8e7c','#6a7e74','#a0a18b'][i%3],r);
 plantSprites=[.065,.935].map((x,i)=>{const size=Math.min((area.bottom-area.top)*(i?.58:.48),235);const img=document.createElement('canvas');img.width=180;img.height=Math.ceil(size+30);plant(img.getContext('2d'),90,size+15,size,seed('front-'+x),0,1);return {img,x};});
}
function resize(){if(innerWidth<2||innerHeight<2)return;w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,1.75);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);rebuildBackground();scene3d?.resize(w,h,dpr);if(paused)draw();}
function drawDecor(d){
 const p=decorLayout(d,area,w,floorFront),photo=loadedImages.get('decor/'+d.id);
 if(!photo?.ready)return;
 const ratio=photo.img.naturalHeight/photo.img.naturalWidth;
 if(p.mount==='surface')p.y+=Math.sin(time*.75+d.x)*3;
 d.mount=p.mount;d.sx=p.x;d.sy=p.y-p.size*.45;d.radius=p.size*.48;
 if(p.mount==='floor')oval(ctx,p.x,p.y+3,p.size*.42,7,'#092a3350');
 if(p.mount==='hanging'){
  const end=p.y-p.size*ratio+6;
  ctx.strokeStyle='#bdd8bfbb';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x,33);ctx.lineTo(p.x,end);ctx.stroke();
  oval(ctx,p.x,33,6,3,'#e1d19d');
 }
 if(p.mount==='surface'){ctx.strokeStyle='#c5f3d244';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(p.x,p.y-4,p.size*.6,8,0,0,TAU);ctx.stroke();}
 if(scene3d)scene3d.decor(d,photo.img,p,p.size,p.depth,time);
 else{ctx.save();ctx.translate(p.x,p.y);if(p.mount==='hanging')ctx.rotate(Math.sin(time*.7+d.x)*.035);ctx.drawImage(photo.img,-p.size/2,-p.size*ratio,p.size,p.size*ratio);ctx.restore();}
 if(d.id==='air-bubbler')for(let i=0;i<7;i++){const yy=p.y-20-((time*24+i*19)%150);ctx.strokeStyle='#d5fbef99';ctx.beginPath();ctx.arc(p.x+Math.sin(time+i)*5,yy,2+i%3,0,TAU);ctx.stroke();}
 if(editing){ctx.setLineDash([3,4]);ctx.strokeStyle='#efffcd';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(d.sx,d.sy,p.size*.53,p.size*.53,0,0,TAU);ctx.stroke();ctx.setLineDash([]);}
}
function syncState(state){
 for(const f of state.fish)requestSprite('fish',f.id);for(const d of state.decor)requestSprite('decor',d.id);
 tank=clamp(state.tank||0,0,2);const existing=new Map(fish.map(f=>[f.uid,f]));
 fish=state.fish.map((item,i)=>existing.get(item.uid)||{...item,x:.18+(i*.16)% .64,y:.25+(i*.13)%.42,z:.35+(i*.17)%.6,vx:(i%2?-1:1)*.025,vy:0,heading:i%2?Math.PI:0,phase:rand(0,TAU),speed:species[item.id]?.speed||.05,target:{x:rand(.1,.9),y:rand(.18,.74),z:rand(.1,.95)},retarget:time+rand(2,8)});
 decor=state.decor.map(d=>({...d}));scene3d?.prune(fish,decor);rebuildBackground();if(paused)draw();
}
function feed(point){
 const x=clamp(point?.x??.5,.06,.94), y=clamp(point?.y??.09,.04,.75);
 for(let i=0;i<22;i++)food.push({x:clamp(x+rand(-.075,.075),.03,.97),y:y+rand(-.015,.015),life:18,phase:rand(0,TAU)});
 food=food.slice(-66);feedingUntil=time+12;
 if(paused){paused=false;updateButtons();}draw();
}
function update(dt){
 for(const pellet of food){pellet.y+=dt*.018;pellet.life-=dt;}
 food=food.filter(p=>p.life>0&&p.y<.88);
 advanceFish(fish,food,decor,dt,time,tank);
 if(bubbles.length<28&&Math.random()<dt*8)bubbles.push({x:rand(.86,.9),y:.94,r:rand(1.2,3),phase:rand(0,TAU)});
 bubbles.forEach(b=>{b.y-=dt*(.05+b.r*.008);});bubbles=bubbles.filter(b=>b.y>0);
}
function glass(){
 const c=ctx;
 // Side glass and the water line add a shallow three dimensional frame.
 shape(c,[['M',10,28],['L',area.x,area.top-15],['L',area.x,area.bottom],['L',10,floorFront],['Z']],'#a6e8d40a','#b5ecdf23',1);
 shape(c,[['M',w-10,28],['L',w-area.x,area.top-15],['L',w-area.x,area.bottom],['L',w-10,floorFront],['Z']],'#90cfcf0b','#b5ecdf23',1);
 c.strokeStyle='#c7ffea35';c.lineWidth=2;c.beginPath();c.moveTo(11,32);for(let x=11;x<w-10;x+=12)c.lineTo(x,32+Math.sin(x*.018+time*.9)*1.5);c.stroke();
 const led=c.createLinearGradient(0,0,0,24);led.addColorStop(0,'#dcf8dc44');led.addColorStop(1,'#caffdd00');c.fillStyle=led;c.fillRect(15,0,w-30,30);
 const reflection=c.createLinearGradient(0,0,w,0);reflection.addColorStop(0,'#ffffff00');reflection.addColorStop(.2,'#ffffff03');reflection.addColorStop(.22,'#ffffff09');reflection.addColorStop(.25,'#ffffff00');reflection.addColorStop(1,'#ffffff00');c.fillStyle=reflection;c.fillRect(0,0,w,floorFront-2);
 c.fillStyle='#0b2028';c.fillRect(0,floorFront+1,w,h-floorFront);c.fillStyle='#78999155';c.fillRect(9,floorFront,w-18,2);
}
function draw(){
 ctx.drawImage(background,0,0,w,h);
 // Soft moving beams, never opaque stripes.
 ctx.save();ctx.globalCompositeOperation='screen';
 for(let i=0;i<4;i++){const x=w*(.15+i*.23)+Math.sin(time*.12+i)*20;const beam=ctx.createLinearGradient(x,0,x,h);beam.addColorStop(0,'#bdfad507');beam.addColorStop(1,'#bdfad500');shape(ctx,[['M',x,20],['L',x+w*.035,20],['L',x+w*.13,floorFront-8],['L',x-w*.06,floorFront-8],['Z']],beam);}
 ctx.restore();
 // A few moving stems layered among the permanent planting.
 for(const p of plantSprites){ctx.save();ctx.translate(w*p.x,area.bottom+7);ctx.transform(1,0,Math.sin(time*.45+p.x)*.025,1,0,0);ctx.drawImage(p.img,-90,-p.img.height+15);ctx.restore();}
 for(const b of bubbles){const x=area.x+b.x*area.w+Math.sin(time*1.5+b.phase)*6,y=area.top+b.y*(area.bottom-area.top);ctx.strokeStyle='#bce7dc55';ctx.lineWidth=.8;ctx.beginPath();ctx.arc(x,y,b.r,0,TAU);ctx.stroke();oval(ctx,x-b.r*.25,y-b.r*.3,.6,.7,'#dbfffaaa');}
 scene3d?.begin(night,fish.length);
 const layers=[...fish.map(f=>({z:f.z,draw:()=>drawFish(f)})),...decor.map(d=>({z:.45+(d.y-60)/50,draw:()=>drawDecor(d)}))];layers.sort((a,b)=>a.z-b.z).forEach(l=>l.draw());scene3d?.finish(ctx);
 for(const p of food){const x=area.x+p.x*area.w+Math.sin(time+p.phase)*2,y=area.top+p.y*area.swimH;oval(ctx,x,y,2.1,1.4,'#d9aa63',p.phase);}
 glass();
 if(night){ctx.fillStyle='#07183277';ctx.fillRect(0,0,w,h);const moon=ctx.createRadialGradient(w*.65,20,0,w*.65,20,w*.7);moon.addColorStop(0,'#609bb11a');moon.addColorStop(1,'#609bb100');ctx.fillStyle=moon;ctx.fillRect(0,0,w,h);}
 if(!firstFrameMs&&fish.length){firstFrameMs=performance.now()-started;}
 window.harborDiagnostics={renderer:renderMode,assets:[...loadedImages].map(([key,r])=>({key,ready:r.ready,error:r.error,url:r.img.src})),volumes:scene3d?.items.size||0,editing,fish:fish.map(f=>({uid:f.uid,id:f.id,x:f.x,y:f.y,z:f.z,sx:f.sx,sy:f.sy,heading:f.heading,vx:f.vx,vy:f.vy})),decor:decor.map(d=>({uid:d.uid,id:d.id,sx:d.sx,sy:d.sy,x:d.x,y:d.y,mount:d.mount})),tier:tank,width:1,height:1,depth:1,feeding:time<feedingUntil,food:food.length,paused,night,fps:Math.round(fps),elapsed:time,firstFrameMs};
}
function loop(now){const dt=previous?Math.min((now-previous)/1000,.05):.016;previous=now;if(dt>0)fps=mix(fps,1/dt,.03);if(!paused&&!document.hidden){time+=dt;update(dt);}if(!document.hidden&&!paused)draw();requestAnimationFrame(loop);}
function coords(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
canvas.addEventListener('pointerdown',e=>{const p=coords(e);down={...p};if(editing){drag=decor.filter(d=>Math.hypot(p.x-d.sx,p.y-d.sy)<d.radius+15).sort((a,b)=>Math.hypot(p.x-a.sx,p.y-a.sy)-Math.hypot(p.x-b.sx,p.y-b.sy))[0]||null;if(drag){drag.offsetX=p.x-drag.sx;drag.offsetY=p.y-drag.sy;canvas.setPointerCapture(e.pointerId);}}});
canvas.addEventListener('pointermove',e=>{const p=coords(e);if(drag){dragDecor(drag,p,{x:drag.offsetX,y:drag.offsetY},area,w,floorFront);draw();}else canvas.style.cursor=editing?'grab':fish.some(f=>Math.hypot(p.x-f.sx,p.y-f.sy)<f.radius)?'pointer':'crosshair';});
canvas.addEventListener('pointerup',e=>{const p=coords(e);if(drag){const item=drag;drag=null;send({type:'move',uid:item.uid,x:item.x,y:item.y});down=null;return;}if(down&&Math.hypot(p.x-down.x,p.y-down.y)<8&&!editing){const hit=fish.filter(f=>Math.hypot(p.x-f.sx,p.y-f.sy)<f.radius).sort((a,b)=>b.z-a.z)[0];if(hit)send({type:'fish',uid:hit.uid});else send({type:'feed-request',point:{x:(p.x-area.x)/area.w,y:(p.y-area.top)/area.swimH}});}down=null;});
canvas.addEventListener('pointercancel',()=>{drag=null;down=null;});
canvas.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();send({type:'feed-request'});}});
function updateButtons(){document.querySelector('#light').textContent=night?'☾ Moonlight':'☀ Daylight';document.querySelector('#light').setAttribute('aria-pressed',String(night));document.querySelector('#pause').textContent=paused?'▶ Resume':'Ⅱ Pause';document.querySelector('#pause').setAttribute('aria-pressed',String(paused));}
document.querySelector('#light').onclick=()=>{night=!night;updateButtons();draw();};
document.querySelector('#pause').onclick=()=>{paused=!paused;updateButtons();draw();};
document.querySelector('#immerse').onclick=()=>send({type:'immerse'});
addEventListener('message',e=>{
 if(e.origin!==location.origin||e.source!==parent||!e.data?.littleHarbor)return;
 const d=e.data;if(d.type==='state'&&d.state){editing=!!d.editing;syncState(d.state);}
 if(d.type==='feed')feed(d.point);
});
addEventListener('resize',resize);
document.addEventListener('visibilitychange',()=>{previous=0;});
resize();updateButtons();requestAnimationFrame(loop);send({type:'ready'});
