import {readFile,writeFile,mkdir} from 'node:fs/promises';
import sharp from 'sharp';
import assert from 'node:assert/strict';
const root='art/source/interiors-v5',manifest=JSON.parse(await readFile(root+'/prompts.json','utf8')),report={backgrounds:{},props:{},fish:[],decor:[]};
for(const dir of ['rooms-v5','room-props','fish','decor'])await mkdir('web/assets/'+dir,{recursive:true});
async function alphaCrop(buffer,label){
 const {data,info}=await sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let l=info.width,t=info.height,r=-1,b=-1,clear=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const a=data[(y*info.width+x)*4+3];if(a<10)clear++;if(a>24){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}}
 assert.ok(clear/(info.width*info.height)>.1,label+' must have a genuinely transparent background');
 assert.ok(r>l&&b>t,label+' must have visible artwork');
 return sharp(buffer).extract({left:l,top:t,width:r-l+1,height:b-t+1}).png().toBuffer();
}
for(const a of manifest.assets){
 if(a.kind==='atlas')continue;
 let buffer=await readFile(root+'/'+a.id+'.png');
 if(a.kind==='background'){
  buffer=await sharp(buffer).resize(1600,1000,{fit:'fill'}).webp({quality:86,effort:5}).toBuffer();
  await writeFile('web/assets/rooms-v5/'+a.id+'.webp',buffer);report.backgrounds[a.id]={bytes:buffer.length};
 }else{
  buffer=await alphaCrop(buffer,a.id);
  buffer=await sharp(buffer).resize({width:700,height:700,fit:'inside',withoutEnlargement:true}).webp({quality:88,alphaQuality:100,effort:5}).toBuffer();
  await writeFile('web/assets/room-props/'+a.id+'.webp',buffer);report.props[a.id]={bytes:buffer.length};
 }
 console.log('Packed',a.id,buffer.length);
}
const catalogs={"fish":["neon-tetra","yellow-tang","discus","platy","molly","swordtail","zebra-danio","rainbowfish"],"decor":["driftwood","java-fern","red-ludwigia","stone-cave","air-bubbler","shipwreck","clay-pot","water-lily"]};
for(const [kind,ids]of Object.entries(catalogs)){
 const buffer=await readFile(root+'/'+kind+'-catalog.png'),meta=await sharp(buffer).metadata(),cw=Math.floor(meta.width/4),ch=Math.floor(meta.height/2);
 for(let i=0;i<ids.length;i++){
  const cell=await sharp(buffer).extract({left:(i%4)*cw,top:Math.floor(i/4)*ch,width:cw,height:ch}).png().toBuffer(),trimmed=await alphaCrop(cell,ids[i]);
  const out=await sharp(trimmed).resize({width:kind==='fish'?320:384,height:kind==='fish'?256:384,fit:'contain',position:kind==='fish'?'centre':'south',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:88,alphaQuality:100}).toBuffer();
  await writeFile('web/assets/'+kind+'/'+ids[i]+'.webp',out);report[kind].push({id:ids[i],bytes:out.length});
 }
}
assert.equal(Object.keys(report.backgrounds).length,14);assert.equal(Object.keys(report.props).length,10);assert.equal(report.fish.length,8);assert.equal(report.decor.length,8);
await writeFile('web/assets/rooms-v5/manifest.json',JSON.stringify(report,null,2));
