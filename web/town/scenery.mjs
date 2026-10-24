import {WORLD} from '../places.mjs';
// Independently generated artwork is packaged on the cloud runner.
export const artState={version:4,loaded:0,total:14,failed:[],generator:'ImageGen',ground:{version:6,loaded:0,total:2,bytes:0}};
const art={},groundArt={},objects=[];
const TAU=Math.PI*2;
const ellipse=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();};
const round=(c,x,y,w,h,r,color)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();};
function stroke(c,pts,color,width){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.strokeStyle=color;c.stroke();}
let seed=1729;function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
export async function loadArt(){
 const response=await fetch('../assets/town-art/manifest.json');if(!response.ok)throw Error('The town artwork could not be loaded.');
 const manifest=await response.json();
 artState.version=manifest.version;artState.total=Object.keys(manifest.assets).length;
 await Promise.all([loadGroundArt(),...Object.entries(manifest.assets).map(async([id,meta])=>{
  const img=new Image();img.src=meta.url;
  try{await img.decode();art[id]={...meta,img};if(meta.sprites)for(const [key,bounds]of Object.entries(meta.sprites))art[key]={img,bounds};artState.loaded++;document.querySelector('#loading-progress').textContent='Preparing your town · '+artState.loaded+' / '+artState.total;}
  catch(e){artState.failed.push(id);throw e;}
 })]);
 artState.bytes=manifest.totalBytes;
}
async function loadGroundArt(){
 const response=await fetch('../assets/ground-v6/manifest.json');if(!response.ok)throw Error('The town landscape could not be loaded.');
 const manifest=await response.json();artState.ground.total=Object.keys(manifest.assets).length;
 await Promise.all(Object.entries(manifest.assets).map(async([id,meta])=>{
  const img=new Image();img.src=meta.url;
  try{await img.decode();groundArt[id]=img;artState.ground.loaded++;}
  catch(e){artState.failed.push('ground:'+id);throw e;}
 }));
 artState.ground.bytes=manifest.totalBytes;
}
function sprite(c,id,x,y,width,opacity=1,flip=false){
 const a=art[id],b=a.bounds,hh=width*b.h/b.w;c.save();c.globalAlpha=opacity;c.translate(x,y);if(flip)c.scale(-1,1);
 c.drawImage(a.img,b.x,b.y,b.w,b.h,-width/2,-hh,width,hh);c.restore();
}
function character(c,id,index,x,y,height,bob=0){
 const a=art[id],b=a.frames[index],ww=height*b.w/b.h;
 ellipse(c,x+4,y+2,19,6,'#254e3b32');
 c.drawImage(a.img,b.x,b.y,b.w,b.h,x-ww/2,y-height-bob,ww,height);
}
const roads=[[[120,540],[2430,540]],[[120,1120],[2430,1120]],[[1070,95],[1070,1450]],[[140,745],[2030,745]],[[770,400],[770,1230]],[[1480,430],[1480,1390]],[[2070,500],[2070,1400]],[[260,1050],[260,1170]],[[1770,1120],[1770,1560]],[[2200,1400],[2430,1400]],[[720,1260],[2100,1260]]];
function groundPattern(c,id,size){
 // A reflected repeat joins the image edges without visible square seams.
 const tile=document.createElement('canvas');tile.width=tile.height=size*2;
 const p=tile.getContext('2d');p.imageSmoothingQuality='high';
 for(let row=0;row<2;row++)for(let col=0;col<2;col++){p.save();p.translate(col?size*2:0,row?size*2:0);p.scale(col?-1:1,row?-1:1);p.drawImage(groundArt[id],0,0,size,size);p.restore();}
 return c.createPattern(tile,'repeat');
}
function roadShape(c,color,width){
 c.beginPath();for(const [a,b]of roads){c.moveTo(...a);c.lineTo(...b);}
 c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();
}
function distanceToRoad(x,y){
 let best=Infinity;
 for(const [a,b]of roads){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));best=Math.min(best,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy));}
 return best;
}
export function paintGround(c,W,H){
 c.save();c.scale(WORLD.sx,WORLD.sy);W=2600;H=1800;seed=1729;
 const grass=groundPattern(c,'meadow-grass',380),stone=groundPattern(c,'limestone-path',320);
 c.fillStyle=grass;c.fillRect(0,0,W,H);
 // Broad, gentle variations keep the lawn natural while the short blades stay readable.
 for(let i=0;i<150;i++){const x=random()*W,y=random()*H,rad=70+random()*160;const light=c.createRadialGradient(x,y,0,x,y,rad);light.addColorStop(0,i%3?'#e4edbc20':'#38694518');light.addColorStop(1,'#ffffff00');c.fillStyle=light;c.fillRect(x-rad,y-rad,rad*2,rad*2);}
 // Soft turf, a shallow stone bed and a narrow hand-laid curb surround each connected path.
 c.save();c.shadowColor='#344c382b';c.shadowBlur=8;c.shadowOffsetY=2;roadShape(c,'#71815b66',96);c.restore();
 roadShape(c,'#b9ab87',90);roadShape(c,stone,86);
 const curb=document.createElement('canvas');curb.width=W;curb.height=H;const p=curb.getContext('2d');
 p.fillStyle='#b5a68b';p.fillRect(0,0,W,H);
 const shades=['#ddd0b4','#e5d8be','#d6c7a9','#ece0c6','#d9ccb1'];
 for(const [a,b]of roads){
  const vertical=a[0]===b[0],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
  for(let t=0;t<length;t+=26)for(const side of [-1,1]){
   const x=vertical?a[0]+side*41-4:a[0]+t,y=vertical?a[1]+t:a[1]+side*41-4;
   const w=vertical?8:24,h=vertical?24:8;
   round(p,x,y,w,h,1.6,shades[Math.floor(random()*shades.length)]);
   stroke(p,[[x+1,y+1],[x+w-1,y+1]],'#fff5d45c',.8);
  }
 }
 p.globalCompositeOperation='destination-in';roadShape(p,'#000',90);
 p.globalCompositeOperation='destination-out';roadShape(p,'#000',74);
 p.globalCompositeOperation='source-over';c.drawImage(curb,0,0);
 // Small grass tufts grow along the verge, leaving the full walking surface clear.
 const bladeColors=['#536e39','#668343','#829d51','#a9bd6b'];
 for(let i=0;i<20000;i++){
  const x=random()*W,y=random()*1450,d=distanceToRoad(x,y);
  if(d<48||d>77&&i%7)continue;
  const h=2+random()*3.2;
  ellipse(c,x,y+.8,2.3,.8,'#3554321b');
  for(let blade=0;blade<3;blade++){
   const lean=(blade-1)*2.1+(random()-.5),height=h*(.65+random()*.4);
   c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+lean*.25,y-height*.7,x+lean,y-height);c.strokeStyle=bladeColors[Math.floor(random()*bladeColors.length)];c.lineWidth=.7+random()*.35;c.lineCap='round';c.stroke();
  }
 }
 // A lightly weathered shell mosaic makes the fountain plaza part of the stonework.
 ellipse(c,1000,735,133,94,'#405e3c27');ellipse(c,1000,732,126,88,'#d9c9a8');ellipse(c,1000,732,120,82,stone);
 c.save();c.translate(1000,732);c.scale(1,.68);
 for(let ring=1;ring<=3;ring++){c.strokeStyle=ring===3?'#faf0d8a8':'#fff1d394';c.lineWidth=2;c.beginPath();c.arc(0,0,ring*35,0,TAU);c.stroke();}
 for(let k=0;k<20;k++)stroke(c,[[Math.cos(k*TAU/20)*40,Math.sin(k*TAU/20)*40],[Math.cos(k*TAU/20)*109,Math.sin(k*TAU/20)*109]],'#f5e7c68c',1.4);c.restore();
 // Warm sand, shallow turquoise water and a deeper harbor.
 const sea=c.createLinearGradient(0,1510,0,H);sea.addColorStop(0,'#75c7c1');sea.addColorStop(.22,'#429eac');sea.addColorStop(1,'#236d88');c.fillStyle=sea;c.fillRect(0,1510,W,H-1510);
 c.beginPath();c.moveTo(0,1460);c.bezierCurveTo(620,1490,850,1392,1180,1405);c.bezierCurveTo(1480,1390,1540,1500,1800,1485);c.lineTo(W,1475);c.lineTo(W,1530);c.bezierCurveTo(1450,1575,1480,1475,1170,1480);c.bezierCurveTo(760,1480,640,1560,0,1530);c.closePath();c.fillStyle='#e4cf9e';c.fill();
 stroke(c,[[0,1490],[650,1500],[900,1453],[1270,1440],[1560,1520],[2600,1507]],'#f6e5bb',5);
 for(let i=0;i<1500;i++){const x=random()*W,y=1460+random()*55;if(y<1505)ellipse(c,x,y,.5+random(),.5,i%2?'#fff1cb70':'#8b745233');}
 for(let y=1545;y<H;y+=20)for(let x=0;x<W;x+=75){stroke(c,[[x+Math.sin(y)*20,y],[x+25,y-2],[x+43,y]],'#bce9dd32',1);}
 // Hardwood pier with timber edges, grain and brass moorings.
 round(c,1755,1470,272,222,6,'#183f4b44');round(c,1760,1468,260,211,4,'#5b6156');
 for(let y=1472;y<1675;y+=17){round(c,1766,y,248,15,1,Math.floor(y/17)%2?'#b48c60':'#c59d70');stroke(c,[[1771,y+2],[2008,y+2]],'#f2cea191',1);stroke(c,[[1790,y+8],[1980,y+9]],'#71503536',.8);for(const x of [1780,2000])ellipse(c,x,y+8,1.3,1.3,'#5a5144');}
 for(const x of [1766,2006])for(const y of [1480,1565,1654]){round(c,x-4,y-15,13,33,3,'#67563e');ellipse(c,x+2,y-15,7,4,'#d7b684');}
 // Tiny scattered flowers grow away from the stone paths.
 for(let i=0;i<440;i++){const x=random()*W,y=random()*1430;const nearRoad=roads.some(([a,b])=>Math.abs(a[0]-b[0])<1?Math.abs(x-a[0])<65&&y>Math.min(a[1],b[1])-60&&y<Math.max(a[1],b[1])+60:Math.abs(y-a[1])<65&&x>a[0]-60&&x<b[0]+60);if(nearRoad)continue;
  ellipse(c,x,y+2,2.5,1.5,'#58804b66');ellipse(c,x,y,1.8,1.8,i%4?'#fff3ceaa':'#e4a995aa');
 }
 c.restore();
}
function add(id,x,y,width,kind='plant',extra={}){objects.push({id,x,y,width,kind,...extra});}
export function setupScenery(buildings,discoveries){
 objects.length=0;
 const mapping={library:'library',market:'fish-market',workshop:'workshop',harbor:'harbor-office',home:'aquarium-home',cafe:'cafe',garden:'greenhouse',lighthouse:'lighthouse'};
 for(const b of buildings)add(mapping[b.detail],b.x+b.w/2,b.y+b.h+9,b.w+(b.detail==='home'?54:50),'building',{title:b.title?b.title.toLowerCase().replace(/\b\w/g,s=>s.toUpperCase()):'',baseline:b.y+b.h});
 const positions=[[70,380,155],[125,700,160],[660,365,145],[850,420,140],[1280,395,155],[1400,355,140],[1990,370,155],[2500,350,170],[2500,690,155],[2490,960,170],[2220,960,155],[2130,1070,135],[1280,1185,140],[1360,1135,150],[70,1020,160],[100,1300,175],[390,1315,150],[550,1380,150],[850,1335,160],[1570,1010,155],[1340,935,165],[1550,825,145],[2230,790,125],[2460,1380,160],[80,1440,125],[660,1405,120],[2500,1210,140],[1180,560,125],[1300,590,115],[390,680,140],[560,675,130],[1790,940,130],[1900,930,145],[1160,1100,130]];
 for(const [i,[x,y,width]]of positions.entries())add(['garden-tree','cherry','cypress','palm'][i%4],x*WORLD.sx,y*WORLD.sy,i%4===2?75:width+20,'tree',{flip:!!((x+y)%3)});
 for(const [x,y,width] of [[360,625,180],[570,640,155],[1180,920,175],[920,930,160],[1335,665,155],[1620,625,120],[1900,650,130],[420,1060,150],[680,1180,150],[1675,1330,140],[2210,690,165],[2400,755,150],[2210,850,165],[2390,875,145],[800,1445,130],[1510,1450,180],[1180,425,150]])add(['flower-bed','lavender','sunflowers','hydrangea'][Math.floor(x)%4],x*WORLD.sx,y*WORLD.sy,width);
 add('fountain',1000*WORLD.sx,792*WORLD.sy,210,'fountain');
 for(const [x,y]of [[870,605],[1150,630],[660,1015],[1980,1190],[2180,1340],[310,480]])add('bench',x*WORLD.sx,y*WORLD.sy,125);
 for(const [x,y]of [[480,460],[1200,370],[2120,415],[1950,1370],[880,1200]])add('roseWall',x*WORLD.sx,y*WORLD.sy,150);
 for(let i=0;i<35;i++){const x=150+(i*137)%2300,y= i%2?485:1180;if(buildings.some(b=>Math.abs(b.x+b.w/2-x*WORLD.sx)<b.w/2+100&&Math.abs(b.y+b.h-y*WORLD.sy)<120))continue;add(['lavender','sunflowers','hydrangea'][i%3],x*WORLD.sx,y*WORLD.sy,75+(i%3)*12);}
 for(const s of discoveries)objects.push({id:'notice',x:s.x,y:s.y,width:50,kind:'notice'});
 objects.sort((a,b)=>a.y-b.y);
}
function notice(c,o){
 ellipse(c,o.x+5,o.y+5,23,6,'#30593c25');round(c,o.x-3,o.y-48,7,53,2,'#7c6241');round(c,o.x-25,o.y-58,50,37,5,'#977448');round(c,o.x-22,o.y-55,44,31,3,'#fff1cb');c.fillStyle='#427168';c.font='bold 22px Georgia';c.textAlign='center';c.fillText('i',o.x,o.y-32);
}
function object(c,o,position,map=false){
 if(o.kind==='notice'){notice(c,o);return;}
 const a=art[o.id],hh=o.width*a.bounds.h/a.bounds.w;
 const behind=!map&&position&&position.y<o.y-8&&position.y>o.y-hh&&Math.abs(position.x-o.x)<o.width*.42;
 if(o.kind==='building')ellipse(c,o.x+18,o.y-4,o.width*.43,19,'#38514224');
 if(o.kind==='tree')ellipse(c,o.x+13,o.y-2,o.width*.36,12,'#2c5c3c27');
 sprite(c,o.id,o.x,o.y,o.width,behind?.48:1,o.flip);
 if(o.title&&!map){
  c.font='600 17px system-ui';const tw=c.measureText(o.title).width+25;round(c,o.x-tw/2,o.y+6,tw,32,8,'#fff6dfef');c.fillStyle='#45675b';c.textAlign='center';c.fillText(o.title,o.x,o.y+28);
 }
}
export function paintScenery(c,{position=null,npcs=[],walking=false,direction=0,foot=0,time=0,map=false,view=null}={}){
 const inView=o=>!view||(o.x+o.width>view.x&&o.x-o.width<view.x+view.w&&o.y>view.y&&o.y-700<view.y+view.h);
 const list=objects.filter(inView).map(o=>({y:o.y,draw:()=>object(c,o,position,map)}));
 if(!map){
  npcs.forEach((n,i)=>list.push({y:n.y,draw:()=>character(c,'town-friends',i,n.x,n.y,95,Math.sin(time*1.6+i)*.6)}));
  if(position)list.push({y:position.y,draw:()=>{
   ellipse(c,position.x,position.y+1,23,9,'#e9cf7859');c.strokeStyle='#fff2ba';c.lineWidth=1.5;c.beginPath();c.ellipse(position.x,position.y+1,23,9,0,0,TAU);c.stroke();
   const phase=walking?[1,0,2,0][Math.floor(foot*8)%4]:0;
   character(c,'explorer',direction*3+phase,position.x,position.y,88,walking?Math.sin(foot*16)*1.1:0);
  }});
 }
 list.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
}

export function paintExplorer(c,position,direction=0,walking=false,foot=0,height=132){const phase=walking?[1,0,2,0][Math.floor(foot*8)%4]:0;character(c,'explorer',direction*3+phase,position.x,position.y,height,walking?Math.sin(foot*16):0);}

export function paintResident(c,person,x,y,time=0){character(c,'town-friends',({lily:0,mia:1,ben:2,finn:3})[person]??0,x,y,132,Math.sin(time*1.5)*.6);}
