import {fish,decor,people} from '../legacy/content.mjs';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {dirname} from 'node:path';
const names=[...fish.map(x=>'fish/'+x.id),...decor.map(x=>'decor/'+x.id),...Object.keys(people).map(x=>'npc/'+x),'world/town-v2','world/room-real','world/tank-interior'];
for(const name of names){const path='legacy/assets/'+name+'.webp';try{await access(path);continue;}catch{}const res=await fetch('https://little-harbor-english-aquarium.abloom-chub-6743.chatgpt.site/assets/'+name+'.webp');if(!res.ok||!res.headers.get('content-type')?.includes('image/'))throw Error('Artwork unavailable: '+name);const bytes=new Uint8Array(await res.arrayBuffer());await mkdir(dirname(path),{recursive:true});await writeFile(path,bytes);console.log('Preserved',name,bytes.length);}
