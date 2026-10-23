import {keywordMatch} from './speech-rules.mjs';
import {validAdventures} from './adventures.mjs';
import {fish,decor,tanks,quests} from './content.mjs';
export const SAVE_KEY='little-harbor-save-v1';
const uid=()=>globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function newState(){return {version:1,coins:0,tank:0,fish:[{uid:uid(),id:'goldfish',name:'Sunny'},{uid:uid(),id:'guppy',name:'Bubbles'}],decor:[],completed:[],words:[],lesson:0,practiceAt:0,feedAt:0,sound:true};}
export function validateState(s){
 if(!s||s.version!==1||!Number.isSafeInteger(s.coins)||s.coins<0||!Number.isInteger(s.tank)||s.tank<0||s.tank>=tanks.length)return false;
 if(!Array.isArray(s.fish)||!Array.isArray(s.decor)||s.fish.length>tanks[s.tank].fish||s.decor.length>tanks[s.tank].decor||!Array.isArray(s.completed)||!Array.isArray(s.words))return false;
 if(!validAdventures(s.adventures))return false;
 if(s.town!==undefined&&(!s.town||!Number.isFinite(s.town.x)||!Number.isFinite(s.town.y)||s.town.x<0||s.town.x>3600||s.town.y<0||s.town.y>2400))return false;
 if(s.houseGames!==undefined&&(!s.houseGames||Array.isArray(s.houseGames)||typeof s.houseGames!=='object'||Object.values(s.houseGames).some(n=>!Number.isSafeInteger(n)||n<0)))return false;
 const ids=new Set();
 for(const x of [...s.fish,...s.decor]){if(typeof x.uid!=='string'||ids.has(x.uid))return false;ids.add(x.uid);}
 return s.fish.every(x=>fish.some(f=>f.id===x.id)&&typeof x.name==='string'&&x.name.length<=24)&&s.decor.every(x=>decor.some(d=>d.id===x.id)&&Number.isFinite(x.x)&&x.x>=0&&x.x<=100&&Number.isFinite(x.y)&&x.y>=0&&x.y<=100)&&s.completed.every(id=>quests.some(q=>q.id===id))&&s.words.every(w=>typeof w==='string'&&w.length<50)&&Number.isSafeInteger(s.lesson)&&s.lesson>=0&&Number.isFinite(s.practiceAt)&&Number.isFinite(s.feedAt)&&typeof s.sound==='boolean';
}
export function complete(s,id){const q=quests.find(x=>x.id===id);if(!q||s.completed.includes(id))return null;s.completed.push(id);s.coins+=q.reward;return q;}
export function learn(s,word){if(!s.words.includes(word))s.words.push(word);}
export function buy(s,kind,id){const list=kind==='fish'?fish:kind==='decor'?decor:null;if(!list)return {ok:false,message:'That item is not available.'};const item=list.find(x=>x.id===id);if(!item)return {ok:false,message:'That item is not available.'};if(s[kind].length>=tanks[s.tank][kind])return {ok:false,message:'Your aquarium is full. Upgrade for more room!'};if(s.coins<item.price)return {ok:false,message:`You need ${item.price-s.coins} more coins. Try a town task!`};s.coins-=item.price;const instance=kind==='fish'?{uid:uid(),id,name:item.name}:{uid:uid(),id,x:22+(s.decor.length*17)%58,y:80+(s.decor.length%3)*4};s[kind].push(instance);const reward=complete(s,kind==='fish'?'buyFish':'buyDecor');return {ok:true,item,instance,reward};}
export function upgrade(s){const next=tanks[s.tank+1];if(!next)return {ok:false,message:'You already have the biggest aquarium!'};if(s.coins<next.price)return {ok:false,message:`Earn ${next.price-s.coins} more coins to upgrade.`};s.coins-=next.price;s.tank++;const reward=complete(s,'upgrade');return {ok:true,tank:next,reward};}
export function practice(s,now=Date.now()){if(now-s.practiceAt<12000)return {ok:false,message:'Take a little breath. Your next task will be ready soon.'};s.coins+=25;s.lesson++;s.practiceAt=now;return {ok:true,reward:25};}
export function matches(text,groups){return keywordMatch(text,groups);}
