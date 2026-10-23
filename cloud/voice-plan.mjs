import {writeFile} from 'node:fs/promises';
import {adventures,greetings} from '../web/adventures.mjs';
const cast={
 lily:{name:'Lily',voice:'af_heart',language:'a',speed:.94},
 mia:{name:'Mia',voice:'af_bella',language:'a',speed:.96},
 ben:{name:'Ben',voice:'am_michael',language:'a',speed:.94},
 finn:{name:'Finn',voice:'bm_george',language:'b',speed:.94}
};
const clips=[];
for(const [person,voice] of Object.entries(cast)){
 clips.push({id:person+'-greeting',person,text:greetings[person],...voice});
 const mission=adventures.find(m=>m.person===person);
 for(const [index,step] of mission.steps.entries())
  for(const kind of ['say','hint','feedback'])
   clips.push({id:mission.id+'-'+index+'-'+kind,person,text:step[kind],...voice});
}
await writeFile('cloud/voice-plan.json',JSON.stringify({version:1,engine:'kokoro',model:'hexgrad/Kokoro-82M',package:'0.9.4',cast,clips},null,2));
console.log('Prepared '+clips.length+' character recordings.');
