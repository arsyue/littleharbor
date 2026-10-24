import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root='art/source/expansion-v7',out='web/assets/expansion-v7',spec=JSON.parse(await readFile(root+'/manifest.json','utf8')),result={version:7,generator:'ImageGen',assets:{},totalBytes:0};
await mkdir(out,{recursive:true});
async function cropAlpha(buffer,label){
 const {data,info}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});let l=info.width,t=info.height,r=-1,b=-1,clear=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const a=data[(y*info.width+x)*4+3];if(a<10)clear++;if(a>24){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}}
 assert.ok(clear/(info.width*info.height)>.1,label+' needs real transparency');return sharp(buffer).extract({left:l,top:t,width:r-l+1,height:b-t+1}).png().toBuffer();
}
async function save(id,buffer){const m=await sharp(buffer).metadata();await writeFile(out+'/'+id+'.webp',buffer);result.assets[id]={url:'../assets/expansion-v7/'+id+'.webp',width:m.width,height:m.height,bytes:buffer.length};result.totalBytes+=buffer.length;}
for(const a of spec.assets){
 let buffer=await readFile(root+'/'+a.id+'.png');
 if(a.kind==='atlas'){
  const meta=await sharp(buffer).metadata(),cw=Math.floor(meta.width/a.grid[0]),ch=Math.floor(meta.height/a.grid[1]);
  for(let i=0;i<6;i++)await save(a.id+'-'+i,await sharp(buffer).extract({left:(i%3)*cw,top:Math.floor(i/3)*ch,width:cw,height:ch}).resize(384,384,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:87}).toBuffer());
 }else if(a.kind==='room')await save(a.id,await sharp(buffer).resize(1600,1000,{fit:'fill'}).webp({quality:86,effort:5}).toBuffer());
 else{buffer=await cropAlpha(buffer,a.id);await save(a.id,await sharp(buffer).resize({width:800,height:800,fit:'inside',withoutEnlargement:true}).webp({quality:88,alphaQuality:100,effort:5}).toBuffer());}
}
assert.equal(Object.keys(result.assets).length,32);
await writeFile(out+'/manifest.json',JSON.stringify(result,null,2));
console.log('Eastbank: 4 buildings, 5 interiors, 4 balconies, doorway and 18 game illustrations.',result.totalBytes);
