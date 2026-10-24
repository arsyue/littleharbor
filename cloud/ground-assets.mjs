import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const source='art/source/ground-v6',out='web/assets/ground-v6';
const plan=JSON.parse(await readFile(source+'/manifest.json','utf8'));
await mkdir(out,{recursive:true});
const result={version:6,generator:'ImageGen',assets:{},totalBytes:0};
for(const item of plan.assets){
 const input=await readFile(source+'/'+item.id+'.png');
 const buffer=await sharp(input).resize(768,768,{fit:'fill'}).webp({quality:86,effort:5}).toBuffer();
 const meta=await sharp(buffer).metadata();assert.equal(meta.width,768);assert.equal(meta.height,768);
 await writeFile(out+'/'+item.id+'.webp',buffer);
 result.assets[item.id]={url:'../assets/ground-v6/'+item.id+'.webp',width:meta.width,height:meta.height,bytes:buffer.length};
 result.totalBytes+=buffer.length;
}
assert.equal(Object.keys(result.assets).length,2);
assert.ok(result.totalBytes<650000,'Keep the ground artwork lightweight');
await writeFile(out+'/manifest.json',JSON.stringify(result,null,2));
console.log('Ground artwork: two independently generated textures, '+result.totalBytes+' bytes');
