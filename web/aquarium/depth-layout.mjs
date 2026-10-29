const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
export function tankLayout(width,height,tier=0){
 const frontBottom=width<700?height-30:height-37;
 const inset=width*[.11,.125,.14][tier],rearBottom=frontBottom-clamp(height*.24,80,150);
 const top=width<700?150:clamp(height*.14,55,90),rearTop=top+clamp(height*.045,15,28);
 const front={x:14,w:width-28,top,bottom:frontBottom-28};
 return {x:inset,w:width-inset*2,top:rearTop,bottom:rearBottom,swimH:rearBottom-rearTop-22,inset,front,floorFront:frontBottom};
}
export function projectWater(x,y,z,area){
 const depth=clamp(z,0,1),left=mix(area.x,area.front.x,depth),width=mix(area.w,area.front.w,depth);
 const top=mix(area.top,area.front.top,depth),height=mix(area.swimH,area.front.bottom-area.front.top,depth);
 return {x:left+x*width,y:top+y*height,scale:mix(.58,1.06,depth)};
}
export function unprojectWater(x,y,z,area){
 const a=projectWater(0,0,z,area),b=projectWater(1,1,z,area);
 return {x:(x-a.x)/(b.x-a.x),y:(y-a.y)/(b.y-a.y)};
}
