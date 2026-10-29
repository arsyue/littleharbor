import {decorLimits} from '../content.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
export function decorLayout(d,area,width,floorFront){
 const limits=decorLimits(d.id),y=clamp(d.y,limits.min,limits.max),floor=limits.mount==='floor',z=(y-60)/34;
 const front=area.front||{x:area.x,w:area.w},left=floor?mix(area.x,front.x,z):area.x,span=floor?mix(area.w,front.w,z):area.w;
 const size=clamp(width*.125,62,145)*(floor?.78+z*.4:limits.mount==='wall'?.86:1);
 return {x:left+d.x/100*span,y:floor?area.bottom-7+(floorFront-10-(area.bottom-7))*z:area.top+(floorFront-area.top)*y/100,size,mount:limits.mount,depth:limits.mount==='wall'?-105:floor?z*180-90:25};
}
export function dragDecor(d,p,offset,area,width,floorFront){
 const limits=decorLimits(d.id),layout=decorLayout(d,area,width,floorFront),center=p.y-offset.y,base=clamp(width*.125,62,145);
 d.y=clamp(limits.mount==='floor'?60+(center-(area.bottom-7-base*.78*.45))/(floorFront-10-(area.bottom-7)-base*.4*.45)*34:(center+layout.size*.45-area.top)/(floorFront-area.top)*100,limits.min,limits.max);
 const z=(d.y-60)/34,front=area.front||{x:area.x,w:area.w},floor=limits.mount==='floor';
 const left=floor?mix(area.x,front.x,z):area.x,span=floor?mix(area.w,front.w,z):area.w;
 d.x=clamp((p.x-offset.x-left)/span*100,9,91);return d;
}
