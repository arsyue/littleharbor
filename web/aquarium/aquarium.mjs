import {advanceFish} from './motion.mjs';
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
function shape(c,points,fill,stroke,width=1){c.beginPath();for(const p of points){if(p[0]==='M')c.moveTo(p[1],p[2]);if(p[0]==='L')c.lineTo(p[1],p[2]);if(p[0]==='C')c.bezierCurveTo(...p.slice(1));if(p[0]==='Q')c.quadraticCurveTo(...p.slice(1));if(p[0]==='Z')c.closePath();}if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function oval(c,x,y,rx,ry,color,angle=0){c.beginPath();c.ellipse(x,y,rx,ry,angle,0,TAU);c.fillStyle=color;c.fill();}
function bodyPath(c,id,b){
 c.beginPath();
 if(id==='seahorse'){c.moveTo(25,-52);c.bezierCurveTo(0,-86,-39,-57,-25,-24);c.bezierCurveTo(-69,14,-33,51,-18,60);c.bezierCurveTo(-3,78,25,63,6,48);c.bezierCurveTo(15,67,-12,67,-14,48);c.bezierCurveTo(7,26,10,10,-1,-5);c.bezierCurveTo(-13,-23,0,-32,16,-37);c.lineTo(46,-39);c.lineTo(45,-49);c.closePath();return;}
 c.moveTo(65,-2);c.bezierCurveTo(48,-b*85,-10,-b*110,-49,-b*36);c.quadraticCurveTo(-59,-7,-65,-7);c.lineTo(-65,7);c.quadraticCurveTo(-55,8,-47,b*38);c.bezierCurveTo(-5,b*106,47,b*85,65,2);c.closePath();
}
function texture(id){
 if(cache.has(id))return cache.get(id);
 const s=species[id]||species.goldfish, c=document.createElement('canvas');c.width=c.height=256;
 const g=c.getContext('2d');g.translate(128,128);
 const grad=g.createLinearGradient(0,-s.body*100,0,s.body*100);grad.addColorStop(0,s.top);grad.addColorStop(.35,s.mid);grad.addColorStop(.82,s.belly);grad.addColorStop(1,s.top);
 bodyPath(g,id,s.body);g.fillStyle=grad;g.fill();g.save();bodyPath(g,id,s.body);g.clip();
 if(id==='clownfish'){for(const [x,angle] of [[-36,-.23],[2,.12],[43,.18]]){g.save();g.translate(x,0);g.rotate(angle);g.fillStyle='#312a22';g.fillRect(-9,-70,18,140);g.fillStyle='#f1f4e5';g.fillRect(-6,-70,12,140);g.restore();}}
 if(id==='blue-tang'){shape(g,[['M',48,-17],['C',10,-40,-36,-15,-40,17],['C',-15,-2,10,16,21,3],['C',32,-6,40,-3,48,-17]],'#122c58');oval(g,-6,-9,19,7,'#308ec7',-.1);}
 if(id==='angelfish'){for(const x of [-35,-9,22,43]){g.fillStyle='#203b415f';g.save();g.translate(x,0);g.rotate(-.12);g.fillRect(-4,-90,8,180);g.restore();}}
 if(id==='pufferfish'){const r=seed(id);for(let i=0;i<48;i++)oval(g,r()*115-60,r()*75-42,1.5+r()*1.7,1.4,'#43533499');}
 if(id==='guppy'){const r=seed(id);for(let i=0;i<26;i++)oval(g,r()*70-42,r()*24-12,1.5,1.2,i%2?'#e0b862':'#29556f');g.fillStyle='#51b8b45a';g.fillRect(-40,-20,54,10);}
 if(id==='seahorse'){g.strokeStyle='#8a663d66';g.lineWidth=1.7;for(let y=-20;y<40;y+=7){g.beginPath();g.moveTo(-48,y);g.lineTo(20,y+8);g.stroke();}}
 // Small overlapping scale highlights, restrained to the silhouette.
 if(!['seahorse','pufferfish'].includes(id)){for(let y=-28;y<30;y+=7)for(let x=-46;x<40;x+=9){g.beginPath();g.arc(x+(y%2)*2,y,4,-.9,.9);g.strokeStyle='rgba(255,251,210,.12)';g.lineWidth=.65;g.stroke();}}
 g.restore();
 const ex=id==='seahorse'?8:45,ey=id==='seahorse'?-52:-7;
 oval(g,ex,ey,5,5,s.belly);oval(g,ex+.5,ey,3.4,3.9,'#192b29');oval(g,ex+1.1,ey-1.2,.9,.9,'#f6ffff');
 if(id!=='seahorse'){g.beginPath();g.moveTo(30,-s.body*52);g.quadraticCurveTo(18,0,29,s.body*62);g.strokeStyle=s.top+'99';g.lineWidth=1.3;g.stroke();g.beginPath();g.moveTo(60,3);g.lineTo(65,2);g.stroke();}
 cache.set(id,c);return c;
}
function fin(c,points,color,opacity=.65,rays=7){
 c.save();c.globalAlpha*=opacity;shape(c,points,color);
 c.strokeStyle=color;c.lineWidth=.6;c.globalAlpha*=.7;
 const end=points.filter(p=>p[0]==='L');
 for(let i=0;i<end.length;i++){c.beginPath();c.moveTo(points[0][1],points[0][2]);c.lineTo(end[i][1],end[i][2]);c.stroke();}
 c.restore();
}
function fishScreen(f){return{x:area.x+f.x*area.w,y:area.top+f.y*area.swimH+(f.z-.5)*h*.035};}
function drawFish(f){
 const s=species[f.id]||species.goldfish, p=fishScreen(f), beat=Math.sin(time*(5+f.speed*60)+f.phase), size=clamp(w*.074,43,90)*[1,.93,.85][tank]*mix(.64,1.15,f.z)*(f.id==='guppy'?.78:1)*(f.id==='seahorse'?.8:1);
 f.sx=p.x;f.sy=p.y;f.radius=size*.62;
 ctx.save();ctx.translate(p.x,p.y);ctx.rotate(clamp(f.vy*2.2,-.19,.19)*Math.cos(f.heading));
 ctx.scale(size/144*(Math.cos(f.heading)>=0?1:-1)*(.23+.77*Math.abs(Math.cos(f.heading))),size/144);
 ctx.globalAlpha=night?.62+f.z*.3:.75+f.z*.25;
 if(f.id!=='seahorse'){
  ctx.save();ctx.translate(-61,0);ctx.rotate(beat*.16);const fan=f.id==='guppy'?42:f.id==='betta'?48:f.id==='goldfish'?38:22;
  const tailColor=f.id==='blue-tang'?'#f1d156':s.fin;
  fin(ctx,[['M',2,0],['C',-10,-6,-30,-fan,-45,-fan],['Q',-36,0,-45,fan],['C',-23,fan,-7,5,2,0],['Z']],tailColor,.78);
  ctx.strokeStyle=tailColor;ctx.lineWidth=.8;ctx.globalAlpha*=.6;
  for(let i=0;i<11;i++){ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(-24,(i-5)*2,-43,(i-5)*fan/5);ctx.stroke();}ctx.restore();
  const bh=s.body*83, tall=f.id==='angelfish'?43:f.id==='betta'?27:17;
  fin(ctx,[['M',20,-bh*.6],['Q',-10,-bh-tall+beat*3,-35,-bh-5],['Q',-39,-bh*.65,-48,-9],['Z']],s.fin,.62);
  fin(ctx,[['M',-12,bh*.7],['Q',-23,bh+tall+beat*2,-48,bh+10],['L',-42,8],['Z']],s.fin,.52);
 }
 // Bend successive body slices gently toward the tail.
 const tex=texture(f.id);
 for(let x=0;x<256;x+=16){const bend=f.id==='seahorse'?0:Math.max(0,(128-x)/128)**2*beat*5;ctx.drawImage(tex,x,0,16,256,x-128,-128+bend,16,256);}
 if(f.id!=='seahorse'){
  ctx.save();ctx.translate(15,4);ctx.rotate(.22+beat*.18);
  fin(ctx,[['M',0,0],['Q',-7,17+beat*4,-26,19],['Q',-21,0,0,0]],s.fin,.45);ctx.restore();
  if(f.id==='angelfish'){ctx.strokeStyle='#d9eee499';ctx.lineWidth=1.3;for(let x=0;x<2;x++){ctx.beginPath();ctx.moveTo(15+x*8,28);ctx.quadraticCurveTo(2+x*8,66,-18+beat*4+x*10,83);ctx.stroke();}}
 }else{fin(ctx,[['M',-28,-5],['Q',-49,-7+beat*5,-42,16],['L',-26,14],['Z']],s.fin,.42);}
 ctx.restore();
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
 const top=clamp(h*.14,55,90),bottom=w<700?h-185:h-clamp(h*.17,73,115),inset=w*[.07,.04,.02][tank];
 floorFront=w<700?h-143:h-37;
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
function resize(){w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,1.75);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);rebuildBackground();if(paused)draw();}
function decorationPoint(d){return{x:area.x+d.x/100*area.w,y:mix(area.bottom-7,floorFront-10,(d.y-60)/34)};}
function drawDecor(d){
 const p=decorationPoint(d),size=clamp(w*.09,48,108)*(1+(d.y-60)/150);d.sx=p.x;d.sy=p.y-size*.38;d.radius=size*.55;
 ctx.save();ctx.translate(p.x,p.y);ctx.scale(size/100,size/100);
 oval(ctx,0,5,44,7,'#092a3350');
 const r=seed(d.uid),c=ctx;
 switch(d.id){
 case 'seaweed':plant(c,0,0,105,r,time,1);break;
 case 'pebble-arch':
  for(let i=0;i<9;i++){const a=Math.PI+i*Math.PI/8;stone(c,Math.cos(a)*36,Math.sin(a)*57,17,['#778777','#b0b299','#899987'][i%3],r);}break;
 case 'coral':
  c.lineCap='round';for(let i=0;i<7;i++){const x=(i-3)*8,y=-37-r()*33;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(x*.3,-24,x,y);c.strokeStyle=i%2?'#d5a38c':'#b87d73';c.lineWidth=5;c.stroke();for(let k=0;k<3;k++){c.beginPath();c.moveTo(x*k/3,y*k/3);c.lineTo(x*k/3+(k%2?10:-12),y*k/3-15);c.lineWidth=3;c.stroke();}}break;
 case 'treasure-chest':
  shape(c,[['M',-34,0],['L',33,0],['L',33,-38],['L',-34,-38],['Z']],'#805739','#b69759',2);
  shape(c,[['M',-34,-38],['Q',-30,-62,0,-61],['Q',32,-60,33,-38],['Z']],'#9c7548','#c4ae75',2);
  for(const x of [-22,20]){c.fillStyle='#c3a161';c.fillRect(x,-56,6,56);}c.fillStyle='#e1cc8c';c.fillRect(-5,-29,10,13);break;
 case 'sandcastle':
  c.fillStyle='#b2a780';c.fillRect(-34,-42,68,42);c.fillStyle='#d2c49c';for(const x of [-35,21]){c.fillRect(x,-68,15,68);for(let n=0;n<3;n++)c.fillRect(x+n*6,-75,4,10);}shape(c,[['M',-9,0],['L',-9,-18],['Q',0,-34,9,-18],['L',9,0],['Z']],'#46564a');break;
 case 'shell':
  for(let i=0;i<9;i++){c.save();c.rotate((i-4)*.14);oval(c,0,-20,6,28,['#e2d2bb','#b8aaa2','#ead9be'][i%3],0);c.restore();}oval(c,1,-3,11,7,'#eee7cf');oval(c,-2,-5,3,2,'#ffffffaa');break;
 case 'mushroom-house':
  c.fillStyle='#b3a690';c.fillRect(-22,-46,44,46);shape(c,[['M',-39,-45],['Q',0,-96,39,-45],['Z']],'#a87460','#d3ae85',2);oval(c,0,-14,8,15,'#243f3d');oval(c,13,-36,4,4,'#f6d892');break;
 case 'rainbow':
  c.lineWidth=6;for(let i=0;i<5;i++){c.beginPath();c.arc(0,0,43-i*6,Math.PI,TAU);c.strokeStyle=['#bb816c','#d1af6c','#91ae80','#78a6a8','#9f91ac'][i];c.stroke();}break;
 }
 if(editing){c.setLineDash([3,4]);c.strokeStyle='#efffcd';c.lineWidth=1.5;c.beginPath();c.ellipse(0,4,48,12,0,0,TAU);c.stroke();c.setLineDash([]);}
 ctx.restore();
}
function syncState(state){
 tank=clamp(state.tank||0,0,2);const existing=new Map(fish.map(f=>[f.uid,f]));
 fish=state.fish.map((item,i)=>existing.get(item.uid)||{...item,x:.18+(i*.16)% .64,y:.25+(i*.13)%.42,z:.35+(i*.17)%.6,vx:(i%2?-1:1)*.025,vy:0,heading:i%2?Math.PI:0,phase:rand(0,TAU),speed:species[item.id]?.speed||.05,target:{x:rand(.1,.9),y:rand(.18,.74),z:rand(.1,.95)},retarget:time+rand(2,8)});
 decor=state.decor.map(d=>({...d}));rebuildBackground();if(paused)draw();
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
 const layers=[...fish.map(f=>({z:f.z,draw:()=>drawFish(f)})),...decor.map(d=>({z:.45+(d.y-60)/50,draw:()=>drawDecor(d)}))];layers.sort((a,b)=>a.z-b.z).forEach(l=>l.draw());
 for(const p of food){const x=area.x+p.x*area.w+Math.sin(time+p.phase)*2,y=area.top+p.y*area.swimH;oval(ctx,x,y,2.1,1.4,'#d9aa63',p.phase);}
 glass();
 if(night){ctx.fillStyle='#07183277';ctx.fillRect(0,0,w,h);const moon=ctx.createRadialGradient(w*.65,20,0,w*.65,20,w*.7);moon.addColorStop(0,'#609bb11a');moon.addColorStop(1,'#609bb100');ctx.fillStyle=moon;ctx.fillRect(0,0,w,h);}
 if(!firstFrameMs&&fish.length){firstFrameMs=performance.now()-started;}
 window.harborDiagnostics={renderer:'canvas2d',fish:fish.map(f=>({uid:f.uid,id:f.id,x:f.x,y:f.y,z:f.z,sx:f.sx,sy:f.sy,heading:f.heading,vx:f.vx,vy:f.vy})),decor:decor.map(d=>({uid:d.uid,id:d.id,sx:d.sx,sy:d.sy,x:d.x,y:d.y})),tier:tank,width:1,height:1,depth:1,feeding:time<feedingUntil,food:food.length,paused,night,fps:Math.round(fps),elapsed:time,firstFrameMs};
}
function loop(now){const dt=previous?Math.min((now-previous)/1000,.05):.016;previous=now;if(dt>0)fps=mix(fps,1/dt,.03);if(!paused&&!document.hidden){time+=dt;update(dt);}if(!document.hidden&&!paused)draw();requestAnimationFrame(loop);}
function coords(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
canvas.addEventListener('pointerdown',e=>{const p=coords(e);down={...p};if(editing){drag=decor.filter(d=>Math.hypot(p.x-d.sx,p.y-d.sy)<d.radius+15).sort((a,b)=>b.y-a.y)[0]||null;if(drag){drag.offsetX=p.x-drag.sx;drag.offsetY=p.y-drag.sy;canvas.setPointerCapture(e.pointerId);}}});
canvas.addEventListener('pointermove',e=>{const p=coords(e);if(drag){drag.x=clamp((p.x-drag.offsetX-area.x)/area.w*100,9,91);const size=clamp(w*.09,48,108)*(1+(drag.y-60)/150);drag.y=clamp(60+(p.y-drag.offsetY+size*.38-(area.bottom-7))/(floorFront-10-(area.bottom-7))*34,60,94);draw();}else canvas.style.cursor=editing?'grab':fish.some(f=>Math.hypot(p.x-f.sx,p.y-f.sy)<f.radius)?'pointer':'crosshair';});
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
