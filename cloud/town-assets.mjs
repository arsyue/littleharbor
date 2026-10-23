import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const spec=JSON.parse(await readFile('art/manifest.json','utf8'));
const out='web/assets/town-art';await mkdir(out,{recursive:true});
const result={version:3,generator:'ImageGen',assets:{}};
let total=0;
function bounds(data,width,height,rect){
 let left=rect.x+rect.w,top=rect.y+rect.h,right=-1,bottom=-1,count=0;
 for(let y=rect.y;y<rect.y+rect.h;y++)for(let x=rect.x;x<rect.x+rect.w;x++){
  if(data[(y*width+x)*4+3]>32){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);count++;}
 }
 assert.ok(count>100,'Empty sprite');return {x:left,y:top,w:right-left+1,h:bottom-top+1};
}
for(const a of spec.assets){
 const source=await readFile('art/source/'+a.id+'.png');
 const sourceMeta=await sharp(source).metadata();assert.ok(sourceMeta.hasAlpha,a.id+' needs transparency');
 const target=a.grid?1600:a.id==='garden-tree'?640:a.id==='flower-bed'?1024:900;
 const buffer=await sharp(source).resize({width:target,height:target,fit:'inside',withoutEnlargement:true}).webp({quality:89,alphaQuality:100,effort:5}).toBuffer();
 await writeFile(out+'/'+a.id+'.webp',buffer);total+=buffer.length;
 const {data,info}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {width,height}=info;let transparent=0;
 for(let i=3;i<data.length;i+=4)if(data[i]<8)transparent++;
 assert.ok(transparent/(width*height)>.12,a.id+' has an opaque backdrop');
 const entry={url:'../assets/town-art/'+a.id+'.webp',width,height,bytes:buffer.length,bounds:bounds(data,width,height,{x:0,y:0,w:width,h:height}),transparent:Math.round(transparent/(width*height)*100)};
 if(a.grid){
  entry.frames=[];const [columns,rows]=a.grid;
  const rowEdges=[0];
  for(let row=1;row<rows;row++){
   const expected=row*height/rows,radius=height/rows*.17;let best=Math.floor(expected),bestScore=Infinity;
   for(let y=Math.ceil(expected-radius);y<Math.floor(expected+radius);y++){
    let count=0;for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>32)count++;
    const score=count+Math.abs(y-expected)*.005;if(score<bestScore){best=y;bestScore=score;}
   }
   rowEdges.push(best);
  }
  rowEdges.push(height);
  for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
   const left=Math.floor(x*width/columns),top=rowEdges[y];
   const right=Math.floor((x+1)*width/columns),bottom=rowEdges[y+1];
   entry.frames.push(bounds(data,width,height,{x:left,y:top,w:right-left,h:bottom-top}));
  }
  assert.equal(entry.frames.length,columns*rows);
  const heights=entry.frames.map(f=>f.h);assert.ok(Math.max(...heights)/Math.min(...heights)<1.35,a.id+' poses must be consistent');
 }
 result.assets[a.id]=entry;console.log(a.id,width+'x'+height,buffer.length+' bytes',entry.transparent+'% transparent');
}
assert.equal(Object.keys(result.assets).length,13);assert.ok(total<4_500_000,'Town artwork download budget exceeded');
result.totalBytes=total;await writeFile(out+'/manifest.json',JSON.stringify(result,null,2));
console.log('Town art package:',total,'bytes');
