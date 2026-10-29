import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import sharp from 'sharp';
import {fish,decor} from '../web/content.mjs';
await mkdir('web/vendor',{recursive:true});
for(const name of ['three.module','three.core']){const source=await readFile('node_modules/three/build/'+name+'.js','utf8');await writeFile('web/vendor/'+name+'.mjs',source.replaceAll('./three.core.js','./three.core.mjs'));}
await copyFile('node_modules/three/LICENSE','web/vendor/THREE-LICENSE.txt');
const additions=new Set(['hanging-shell','hanging-fern','glass-coral','floating-lily']);
for(const [kind,list]of [['fish',fish],['decor',decor.filter(x=>!additions.has(x.id))]]){
 await mkdir('web/assets/'+kind,{recursive:true});
 for(const item of list){
  let buffer;try{buffer=await readFile('legacy/assets/'+kind+'/'+item.id+'.webp');}catch{buffer=await readFile('web/assets/'+kind+'/'+item.id+'.webp');}
  const out=await sharp(buffer).trim({background:'#00000000',threshold:8}).resize(512,kind==='fish'?384:512,{fit:'contain',position:kind==='fish'?'centre':'south',background:'#00000000'}).webp({quality:90,alphaQuality:100}).toBuffer();
  await writeFile('web/assets/'+kind+'/'+item.id+'.webp',out);
 }
}
const svg=body=>Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><defs><linearGradient id="gold"><stop stop-color="#e7d6a8"/><stop offset=".5" stop-color="#a38345"/><stop offset="1" stop-color="#fff0bb"/></linearGradient></defs>'+body+'</svg>');
const variants=[
 {id:'hanging-shell',source:'shell',width:350,height:310,top:190,left:81,mount:'<g fill="none" stroke="url(#gold)" stroke-width="9"><ellipse cx="256" cy="32" rx="20" ry="25"/><path d="M256 55V145M256 145L130 280M256 145L382 280"/></g>'},
 {id:'hanging-fern',source:'java-fern',width:350,height:350,top:145,left:81,mount:'<g fill="none" stroke="url(#gold)" stroke-width="8"><ellipse cx="256" cy="28" rx="18" ry="22"/><path d="M256 50L110 365M256 50L402 365"/><ellipse cx="256" cy="420" rx="156" ry="48"/><path d="M100 420Q125 503 256 503Q387 503 412 420"/></g>'},
 {id:'glass-coral',source:'coral',width:390,height:360,top:115,left:61,mount:'<g stroke="#bce9df" stroke-width="7" fill="#b4ebe6" fill-opacity=".22"><ellipse cx="145" cy="75" rx="50" ry="34"/><ellipse cx="365" cy="75" rx="50" ry="34"/></g><path d="M145 95V430H365V95" fill="none" stroke="#c5d5c8" stroke-width="12"/><ellipse cx="256" cy="450" rx="205" ry="36" fill="#8aaf9f" fill-opacity=".7" stroke="#d1ece0" stroke-width="8"/>'},
 {id:'floating-lily',source:'water-lily',width:445,height:350,top:90,left:34,mount:'<ellipse cx="256" cy="425" rx="238" ry="48" fill="#568d65" stroke="#aed59b" stroke-width="8"/>'}
];
for(const v of variants){
 const original=await readFile('web/assets/decor/'+v.source+'.webp');
 const art=await sharp(original).trim({background:'#00000000'}).resize(v.width,v.height,{fit:'contain',position:'south',background:'#00000000'}).png().toBuffer();
 const out=await sharp({create:{width:512,height:512,channels:4,background:'#00000000'}}).composite([{input:svg(v.mount)},{input:art,top:v.top,left:v.left}]).webp({quality:92,alphaQuality:100}).toBuffer();
 await writeFile('web/assets/decor/'+v.id+'.webp',out);
}
await writeFile('web/assets/aquarium-manifest.json',JSON.stringify({version:10,fish:fish.map(x=>x.id),decor:decor.map(x=>x.id),sharedShopArtwork:true,volumetricFish:true},null,2));
console.log('Prepared identical shop and tank artwork:',fish.length,'fish,',decor.length,'decorations.');
