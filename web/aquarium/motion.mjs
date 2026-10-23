// Original aquarium steering: persistent destinations, unclaimed food and committed turns.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const TAU=Math.PI*2;
function cruise(f,time,random){
 let direction=Math.abs(f.vx)>.008?Math.sign(f.vx):(f.facing||1);
 if(f.x>.78)direction=-1;else if(f.x<.22)direction=1;
 f.target={x:clamp(f.x+direction*(.26+random()*.22),.09,.91),y:clamp(f.y+(random()-.5)*.36,.14,.76),z:.18+random()*.72};
 f.retarget=time+7+random()*6;
}
function faceVelocity(f,dt,time,speed){
 if(!f.facing)f.facing=Math.cos(f.heading)>=0?1:-1;
 // Near-vertical motion must not choose a different side every frame.
 const next=Math.abs(f.vx)>speed*.24?Math.sign(f.vx):f.facing;
 if(next!==f.facing){
  if(f.turnCandidate!==next){f.turnCandidate=next;f.turnCandidateAt=time;}
  if(time-f.turnCandidateAt>.3&&time>=(f.turnUntil||0)){
   f.facing=next;f.turnUntil=time+2;f.turnCandidate=0;
  }
 }else f.turnCandidate=0;
 const desired=f.facing===1?0:Math.PI;
 const angle=Math.atan2(Math.sin(desired-f.heading),Math.cos(desired-f.heading));
 f.heading+=clamp(angle,-dt*2.2,dt*2.2);
 f.heading=((f.heading%TAU)+TAU)%TAU;
}
export function advanceFish(fish,food,decor,dt,time,tank,random=Math.random){
 const active=new Set(food.filter(p=>p.life>0&&p.y<.88)),claimed=new Set();
 for(const f of fish){
  if(active.has(f.foodTarget))claimed.add(f.foodTarget);
  else f.foodTarget=null;
 }
 for(const f of fish){
  if(!Number.isFinite(f.heading))f.heading=f.vx<0?Math.PI:0;
  if(!f.target||time>f.retarget||Math.hypot(f.target.x-f.x,(f.target.y-f.y)*.65)<.065)cruise(f,time,random);
  if(!active.has(f.foodTarget)||f.foodTarget?.life<=0)f.foodTarget=null;
  if(!f.foodTarget&&time>=(f.forageAt||0)){
   let closest=null,distance=Infinity;
   for(const p of active){if(p.life<=0||claimed.has(p))continue;const d=Math.hypot(p.x-f.x,(p.y-f.y)*.65);if(d<distance){closest=p;distance=d;}}
   if(closest){f.foodTarget=closest;claimed.add(closest);}
  }
  let pellet=f.foodTarget;
  if(pellet&&Math.hypot(pellet.x-f.x,(pellet.y-f.y)*.65)<.032){
   pellet.life=0;active.delete(pellet);claimed.delete(pellet);f.foodTarget=null;f.forageAt=time+1.4;
   cruise(f,time,random);pellet=null;
  }
  const target=pellet?{x:pellet.x,y:pellet.y,z:.72}:f.target;
  let dx=target.x-f.x,dy=(target.y-f.y)*.6;
  for(const n of fish){
   if(n===f)continue;
   const xx=f.x-n.x,yy=(f.y-n.y)*.7,zz=(f.z-n.z)*.32,dist=Math.hypot(xx,yy,zz);
   if(dist<.085&&dist>.001){const force=(.085-dist)*(pellet?.65:1.15);dx+=xx/dist*force;dy+=yy/dist*force;}
   if(n.id===f.id&&dist<.24&&!pellet){dx+=n.vx*.08;dy+=n.vy*.06;}
  }
  for(const d of decor){
   const yy=.85+(d.y-60)/300,dist=Math.hypot(f.x-d.x/100,f.y-yy);
   if(dist<.12){dx+=(f.x-d.x/100)*.4;dy-=.045;}
  }
  // Start banking before reaching the glass, rather than repeatedly clamping against it.
  const lookX=f.x+f.vx*.7,lookY=f.y+f.vy*.7;
  const marginX=pellet?.055:.12,top=pellet?.05:.08,bottom=pellet?.85:.80;
  if(lookX<marginX)dx+=(marginX-lookX)*2;
  if(lookX>1-marginX)dx-=(lookX-(1-marginX))*2;
  if(lookY<top)dy+=(top-lookY)*2;
  if(lookY>bottom)dy-=(lookY-bottom)*2;
  const len=Math.hypot(dx,dy)||1;
  const speed=f.speed*(.9+Math.sin(time*.55+f.phase)*.13)*(pellet?1.45:1)*(1-tank*.1);
  f.vx=lerp(f.vx,dx/len*speed,1-Math.exp(-dt*1.45));
  f.vy=lerp(f.vy,dy/len*speed,1-Math.exp(-dt*1.45));
  const nextX=f.x+f.vx*dt,nextY=f.y+f.vy*dt;
  f.x=clamp(nextX,.045,.955);f.y=clamp(nextY,.045,.86);
  if(nextX!==f.x)f.vx=(nextX<.045?1:-1)*Math.abs(f.vx)*.4;
  if(nextY!==f.y)f.vy=(nextY<.045?1:-1)*Math.abs(f.vy)*.4;
  f.z=lerp(f.z,target.z,1-Math.exp(-dt*.12));
  faceVelocity(f,dt,time,speed);
 }
}
