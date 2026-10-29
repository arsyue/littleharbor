import {decorLimits} from '../content.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function decorLayout(d,area,width,floorFront){
 const limits=decorLimits(d.id),y=clamp(d.y,limits.min,limits.max),floor=limits.mount==='floor';
 const size=clamp(width*.125,62,145)*(floor?1+(y-60)/170:1);
 return {x:area.x+d.x/100*area.w,y:floor?area.bottom-7+(floorFront-10-(area.bottom-7))*(y-60)/34:area.top+(floorFront-area.top)*y/100,size,mount:limits.mount,depth:limits.mount==='wall'?-85:floor?(y-60)*3-35:25};
}
export function dragDecor(d,p,offset,area,width,floorFront){
 const limits=decorLimits(d.id),layout=decorLayout(d,area,width,floorFront);
 d.x=clamp((p.x-offset.x-area.x)/area.w*100,9,91);
 const bottom=p.y-offset.y+layout.size*.45;
 d.y=clamp(limits.mount==='floor'?60+(bottom-(area.bottom-7))/(floorFront-10-(area.bottom-7))*34:(bottom-area.top)/(floorFront-area.top)*100,limits.min,limits.max);
 return d;
}
