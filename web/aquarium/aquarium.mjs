import {advanceFish} from './motion.mjs';
import {decorLayout,dragDecor} from './decor-layout.mjs';
import {tankLayout,projectWater,unprojectWater} from './depth-layout.mjs';
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
function fishScreen(f){return projectWater(f.x,f.y,f.z,area);}
function drawFish(f){
 const s=species[f.id]||species.goldfish,p=fishScreen(f);
 const density=fish.length>40?.62:fish.length>24?.73:fish.length>12?.85:1;
 const size=1.6*(s.scale||1)*density*clamp(w*.09,52,116)*[1,.93,.85][tank]*p.scale*(f.id==='guppy'?.78:1);
 f.sx=p.x;f.sy=p.y;f.radius=size*.42;f.screenSize=size;
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
function layout(){area=tankLayout(w,h,tank);floorFront=area.floorFront;}
function rebuildBackground(){
 background.width=Math.round(w*dpr);background.height=Math.round(h*dpr);bg.setTransform(dpr,0,0,dpr,0,0);layout();
 const c=bg,r=seed('little-harbor-floor-'+tank),floor=area.bottom,backTop=area.top-34,front=14;
 const water=c.createLinearGradient(0,0,0,h);water.addColorStop(0,'#168ecb');water.addColorStop(.28,'#147db9');water.addColorStop(.7,'#0d568d');water.addColorStop(1,'#063357');c.fillStyle=water;c.fillRect(0,0,w,h);
 const rear=c.createLinearGradient(0,backTop,0,floor);rear.addColorStop(0,'#198fca');rear.addColorStop(.6,'#12699f');rear.addColorStop(1,'#0a487d');
 c.fillStyle=rear;c.fillRect(area.x,backTop,area.w,floor-backTop);
 const glow=c.createRadialGradient(w*.46,backTop,0,w*.46,backTop,w*.56);glow.addColorStop(0,'#80d9ff30');glow.addColorStop(1,'#3ab6ee00');c.fillStyle=glow;c.fillRect(0,0,w,floorFront);
 // Receding glass panels meet the rear wall, above a deep trapezoid of sand.
 const left=c.createLinearGradient(front,0,area.x,0);left.addColorStop(0,'#55b6dd33');left.addColorStop(1,'#00457955');
 shape(c,[['M',front,32],['L',area.x,backTop],['L',area.x,floor],['L',front,floorFront],['Z']],left);
 const right=c.createLinearGradient(w-area.x,0,w-front,0);right.addColorStop(0,'#00457955');right.addColorStop(1,'#55b6dd33');
 shape(c,[['M',w-front,32],['L',w-area.x,backTop],['L',w-area.x,floor],['L',w-front,floorFront],['Z']],right);
 const sand=c.createLinearGradient(0,floor,0,floorFront);sand.addColorStop(0,'#477b91');sand.addColorStop(.35,'#9eafa5');sand.addColorStop(1,'#d4c9aa');
 shape(c,[['M',area.x,floor],['L',w-area.x,floor],['L',w-front,floorFront],['L',front,floorFront],['Z']],sand);
 for(let i=0;i<1200;i++){
  const z=r(),left=mix(area.x,front,z),span=mix(area.w,w-front*2,z),x=left+r()*span,y=mix(floor,floorFront,z);
  oval(c,x,y,(.3+r()*1.2)*mix(.5,1.4,z),(.25+r()*.65)*mix(.5,1.2,z),i%3?'#24425c25':'#f7f4de55');
 }
 // Small, blue-filtered planting stays against the back wall.
 for(let i=0;i<10;i++){
  const x=area.x+area.w*(.025+i*.106),edge=Math.abs(i/9-.5),height=clamp(area.swimH*(.22+edge*.3+r()*.13),45,150);
  plant(c,x,floor+2,height,r,0,i%3===0);
 }
 c.fillStyle='#2a80b02b';c.fillRect(area.x,backTop,area.w,floor-backTop+3);
 for(let i=0;i<24;i++){const z=r(),x=mix(area.x,front,z)+r()*mix(area.w,w-front*2,z);stone(c,x,mix(floor+3,floorFront-8,z),mix(3,13,z)*(1+r()),['#6f919b','#a9b6af','#879b9f'][i%3],r);}
 // A low piece of wood in the rear leaves a wide swimming corridor.
 c.save();c.translate(w*.30,floor+18);c.scale(.75,.75);c.rotate(-.08);
 const wood=c.createLinearGradient(0,-35,0,15);wood.addColorStop(0,'#7d806c');wood.addColorStop(.4,'#4b534a');wood.addColorStop(1,'#294c58');
 shape(c,[['M',-w*.08,5],['C',-10,-20,w*.08,-1,w*.15,-20],['L',w*.21,-55],['L',w*.195,-14],['L',w*.28,-25],['L',w*.25,-8],['Q',w*.13,17,-w*.08,5]],wood);c.restore();
 // Soft caustic arcs follow the widening floor rather than a flat horizontal strip.
 c.save();c.strokeStyle='#def5ed23';c.lineWidth=1;
 for(let i=0;i<5;i++){const z=(i+1)/6,y=mix(floor,floorFront,z),span=mix(area.w,w-front*2,z);c.beginPath();c.ellipse(w*.5,y,span*.43,4+z*7,0,Math.PI*.04,Math.PI*.96);c.stroke();}c.restore();
 plantSprites=[.035,.965].map((x,i)=>{const size=Math.min(area.swimH*(i?.64:.53),185);const img=document.createElement('canvas');img.width=180;img.height=Math.ceil(size+30);plant(img.getContext('2d'),90,size+15,size,seed('front-'+x),0,1);return {img,x};});
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
 const c=ctx,backTop=area.top-34;
 // Four rear corners and converging edges describe the tank's actual depth.
 c.lineWidth=1; c.strokeStyle='#b7eaff33';
 c.strokeRect(area.x,backTop,area.w,area.bottom-backTop);
 for(const [x,backX]of [[14,area.x],[w-14,w-area.x]]){
  c.beginPath();c.moveTo(x,32);c.lineTo(backX,backTop);c.moveTo(backX,area.bottom);c.lineTo(x,floorFront);c.stroke();
  const shine=c.createLinearGradient(x< w/2?0:w-28,0,x<w/2?28:w,0);shine.addColorStop(0,'#c5eeff00');shine.addColorStop(.5,'#c5eeff32');shine.addColorStop(1,'#c5eeff00');c.fillStyle=shine;c.fillRect(x-12,32,24,floorFront-32);
 }
 const surface=c.createLinearGradient(0,25,0,backTop);surface.addColorStop(0,'#c3f0ff1c');surface.addColorStop(1,'#80cfff08');
 shape(c,[['M',14,32],['L',area.x,backTop],['L',w-area.x,backTop],['L',w-14,32],['Z']],surface);
 c.strokeStyle='#c4efff66';c.lineWidth=1.5;c.beginPath();c.moveTo(14,32);for(let x=14;x<w-14;x+=12)c.lineTo(x,32+Math.sin(x*.018+time*.9)*1.3);c.stroke();
 const led=c.createLinearGradient(0,0,0,30);led.addColorStop(0,'#dcf4ff55');led.addColorStop(1,'#c9edff00');c.fillStyle=led;c.fillRect(14,0,w-28,30);
 const reflection=c.createLinearGradient(0,0,w,0);reflection.addColorStop(0,'#ffffff00');reflection.addColorStop(.09,'#ffffff03');reflection.addColorStop(.12,'#ffffff0a');reflection.addColorStop(.15,'#ffffff00');reflection.addColorStop(1,'#ffffff00');c.fillStyle=reflection;c.fillRect(0,0,w,floorFront-2);
 c.fillStyle='#082b43';c.fillRect(0,floorFront+1,w,h-floorFront);c.fillStyle='#b5ddeb77';c.fillRect(14,floorFront,w-28,2);
}
function draw(){
 ctx.drawImage(background,0,0,w,h);
 // Soft moving beams, never opaque stripes.
 ctx.save();ctx.globalCompositeOperation='screen';
 for(let i=0;i<4;i++){const x=w*(.15+i*.23)+Math.sin(time*.12+i)*20;const beam=ctx.createLinearGradient(x,0,x,h);beam.addColorStop(0,'#cbecff0d');beam.addColorStop(1,'#cbecff00');shape(ctx,[['M',x,20],['L',x+w*.035,20],['L',x+w*.13,floorFront-8],['L',x-w*.06,floorFront-8],['Z']],beam);}
 ctx.restore();
 // A few moving stems layered among the permanent planting.
 
 for(const b of bubbles){const x=area.x+b.x*area.w+Math.sin(time*1.5+b.phase)*6,y=area.top+b.y*(area.bottom-area.top);ctx.strokeStyle='#bce7dc55';ctx.lineWidth=.8;ctx.beginPath();ctx.arc(x,y,b.r,0,TAU);ctx.stroke();oval(ctx,x-b.r*.25,y-b.r*.3,.6,.7,'#dbfffaaa');}
 scene3d?.begin(night,fish.length);
 const layers=[...fish.map(f=>({z:f.z,draw:()=>drawFish(f)})),...decor.map(d=>({z:.45+(d.y-60)/50,draw:()=>drawDecor(d)}))];layers.sort((a,b)=>a.z-b.z).forEach(l=>l.draw());scene3d?.finish(ctx);
 for(const p of plantSprites){ctx.save();ctx.translate(w*p.x,floorFront-6);ctx.transform(1,0,Math.sin(time*.45+p.x)*.025,1,0,0);ctx.drawImage(p.img,-90,-p.img.height+15);ctx.restore();}
 for(const p of food){const pt=projectWater(p.x,p.y,.72,area);oval(ctx,pt.x+Math.sin(time+p.phase)*2,pt.y,2.1,1.4,'#d9aa63',p.phase);}
 glass();
 if(night){ctx.fillStyle='#07183277';ctx.fillRect(0,0,w,h);const moon=ctx.createRadialGradient(w*.65,20,0,w*.65,20,w*.7);moon.addColorStop(0,'#609bb11a');moon.addColorStop(1,'#609bb100');ctx.fillStyle=moon;ctx.fillRect(0,0,w,h);}
 if(!firstFrameMs&&fish.length){firstFrameMs=performance.now()-started;}
 window.harborDiagnostics={renderer:renderMode,assets:[...loadedImages].map(([key,r])=>({key,ready:r.ready,error:r.error,url:r.img.src})),volumes:scene3d?.items.size||0,waterColor:'clear-blue',depthLayout:area,editing,fish:fish.map(f=>({uid:f.uid,id:f.id,x:f.x,y:f.y,z:f.z,sx:f.sx,sy:f.sy,heading:f.heading,vx:f.vx,vy:f.vy,screenSize:f.screenSize})),decor:decor.map(d=>({uid:d.uid,id:d.id,sx:d.sx,sy:d.sy,x:d.x,y:d.y,mount:d.mount})),tier:tank,width:1,height:1,depth:1,feeding:time<feedingUntil,food:food.length,paused,night,fps:Math.round(fps),elapsed:time,firstFrameMs};
}
function loop(now){const dt=previous?Math.min((now-previous)/1000,.05):.016;previous=now;if(dt>0)fps=mix(fps,1/dt,.03);if(!paused&&!document.hidden){time+=dt;update(dt);}if(!document.hidden&&!paused)draw();requestAnimationFrame(loop);}
function coords(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
canvas.addEventListener('pointerdown',e=>{const p=coords(e);down={...p};if(editing){drag=decor.filter(d=>Math.hypot(p.x-d.sx,p.y-d.sy)<d.radius+15).sort((a,b)=>Math.hypot(p.x-a.sx,p.y-a.sy)-Math.hypot(p.x-b.sx,p.y-b.sy))[0]||null;if(drag){drag.offsetX=p.x-drag.sx;drag.offsetY=p.y-drag.sy;canvas.setPointerCapture(e.pointerId);}}});
canvas.addEventListener('pointermove',e=>{const p=coords(e);if(drag){dragDecor(drag,p,{x:drag.offsetX,y:drag.offsetY},area,w,floorFront);draw();}else canvas.style.cursor=editing?'grab':fish.some(f=>Math.hypot(p.x-f.sx,p.y-f.sy)<f.radius)?'pointer':'crosshair';});
canvas.addEventListener('pointerup',e=>{const p=coords(e);if(drag){const item=drag;drag=null;send({type:'move',uid:item.uid,x:item.x,y:item.y});down=null;return;}if(down&&Math.hypot(p.x-down.x,p.y-down.y)<8&&!editing){const hit=fish.filter(f=>Math.hypot(p.x-f.sx,p.y-f.sy)<f.radius).sort((a,b)=>b.z-a.z)[0];if(hit)send({type:'fish',uid:hit.uid});else send({type:'feed-request',point:unprojectWater(p.x,p.y,.72,area)});}down=null;});
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
