import assert from 'node:assert/strict';
import {newState,validateState,buy} from '../web/state.mjs';
import {tanks} from '../web/content.mjs';
import {adventures,checkAnswer,ensureAdventures} from '../web/adventures.mjs';
import {EnglishVoiceInput} from '../web/voice.mjs';
import {keywordMatch,tokens} from '../web/speech-rules.mjs';
import {houses,entrances,WORLD} from '../web/places.mjs';
assert.deepEqual(tanks.map(t=>t.fish),[20,40,60]);
for(let tier=0;tier<3;tier++){const s=newState();s.tank=tier;s.coins=100000;while(s.fish.length<tanks[tier].fish)assert.equal(buy(s,'fish','goldfish').ok,true);assert.equal(buy(s,'fish','goldfish').ok,false);assert.ok(validateState(s));s.fish.push({...s.fish[0],uid:'overflow'});assert.equal(validateState(s),false);}
const old=newState();old.town={x:1030,y:980};old.coins=97;old.words=['shell'];ensureAdventures(old);const migrated={...old.town};ensureAdventures(old);assert.deepEqual(old.town,migrated);assert.equal(old.coins,97);assert.deepEqual(old.words,['shell']);assert.ok(validateState(old));
for(const m of adventures)for(const step of m.steps){assert.equal(checkAnswer(step.hint,step).ok,true,m.id);assert.equal(checkAnswer('yes',step,'assisted').ok,false);}
const rule={groups:[['i','would','like','two','blue','fish']],min:10};assert.equal(checkAnswer('2 blew fish',rule,'assisted').ok,true);assert.equal(checkAnswer('2 red fish',rule,'assisted').ok,false);assert.equal(checkAnswer('2 blue fish',rule,'standard').ok,false);assert.equal(keywordMatch('a sea horse and 12 shells',[['seahorse','twelve','shell']]),true);assert.deepEqual(tokens('120'),['one','hundred','and','twenty']);
let active,finals=[],statuses=[];class Fake{constructor(){active=this;}start(){}abort(){}stop(){this.stopping=true;}}
const input=new EnglishVoiceInput({Recognition:Fake,onFinal:x=>finals.push(x),onStatus:x=>statuses.push(x),accepts:x=>x.includes('blue')});
const result=(alts,isFinal)=>Object.assign(alts.map(transcript=>({transcript})),{isFinal});
input.start();assert.equal(active.continuous,true);assert.equal(active.maxAlternatives,5);active.onresult({results:[result(['blue'],false)]});assert.deepEqual(finals,[]);active.onresult({results:[result(['blew','blue'],true)]});assert.deepEqual(finals,['blue']);
input.start();input.finish();assert.equal(active.stopping,true);active.onresult({results:[result(['red fish'],true)]});active.onend();assert.equal(finals.at(-1),'red fish');
input.start();const stale=active.onresult;input.abort();stale({results:[result(['blue'],true)]});assert.equal(finals.length,2);
input.start();active.onerror({error:'not-allowed'});assert.match(statuses.at(-1),/permission/);assert.equal(input.session,null);
assert.equal(houses.length,12);assert.deepEqual([...new Set(houses.map(h=>h.level))].sort(),[0,1,2]);assert.equal(new Set(houses.map(h=>h.game)).size,12);assert.ok(entrances.every(e=>e.x>0&&e.x<WORLD.width&&e.y>0&&e.y<WORLD.height));
console.log('PASS: capacity boundaries, old-save migration, all 28 story answers, tolerant speech, wrong-answer rejection, interim/final/alternative/stop/error recognition, 12 houses and three difficulty levels');
