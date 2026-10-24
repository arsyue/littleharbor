import {gameByKind,difficultyNames} from './activity-catalog.mjs';
import {signatureControls,signatureTypes} from './signature-controls.mjs';
import {EnglishVoiceInput} from './voice.mjs';
import {workNames,workPlan,startWork,attemptWork,collectWages,newShift,spokenMatch} from './work-data.mjs';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const art=name=>'assets/expansion-v7/'+name+'.webp';
const title=s=>s.customer||({bakery:'Baker Oliver',restaurant:'Chef Amira',pottery:'Ben',museum:'Captain Finn'})[s.kind]||({lily:'Lily',mia:'Mia',ben:'Ben',finn:'Captain Finn'})[s.person]||'Your guide';
export function showWork(kind,api){
 if(!document.querySelector('#work-style')){const link=document.createElement('link');link.id='work-style';link.rel='stylesheet';link.href='work-game.css';document.head.append(link);}
 const meta=gameByKind[kind],signature=!['bakery','restaurant','pottery','museum'].includes(kind);
 let session=startWork(api.state,kind),plan=workPlan(kind,session.variant),voice=null,timer=null,controlCleanup=null,disposed=false,mode='voice';
 api.modal('<div class="modal-eyebrow">'+(signature?'SIGNATURE GAME · ENGLISH ADVENTURE':'WORK · LISTEN · CREATE')+'</div><h2 id="modal-title">'+esc(workNames[kind])+'</h2><p class="signature-meta">'+esc(difficultyNames[meta.level])+' · '+meta.reward+' coins · '+esc(meta.description)+'</p><div id="work-body"></div>','work-modal');
 const body=document.querySelector('#work-body');
 const stop=()=>{controlCleanup?.();controlCleanup=null;voice?.abort();voice=null;clearInterval(timer);timer=null;};
 api.setModalCleanup(()=>{disposed=true;stop();});api.save();
 function feedback(text){const el=body.querySelector('#work-feedback');if(el)el.textContent=text;}
 function submit(value){
  if(disposed)return;const s=plan[session.step],result=attemptWork(session,value);api.save();
  if(!result.ok){feedback(result.reason);return;}
  api.learn(api.state,s.title.toLowerCase());api.save();mode='voice';render();
 }
 function finish(){
  const coins=collectWages(api.state,kind);api.save();if(coins)api.burst();
  const finishTitle=({bakery:'Fresh bread, ready to share!',restaurant:'Happy guests, excellent service!',pottery:'Your keepsake is finished!',museum:'Your exhibition is open!'})[kind]||'Your '+meta.name+' challenge is complete!';
  body.dataset.stage='complete';body.innerHTML='<div class="work-finished"><span class="work-stamp">CHALLENGE COMPLETE</span><h3>'+esc(finishTitle)+'</h3><p>'+(coins?'You earned <strong>'+coins+' coins</strong>.':'You have already collected this reward.')+'</p><p>Your progress is saved. Come back for another order or replay this challenge to practice.</p><div class="work-actions"><button class="primary" id="work-again">Play again</button><button class="secondary" id="work-return">Back to the room</button></div></div>';
  body.querySelector('#work-return').onclick=api.closeModal;body.querySelector('#work-again').onclick=()=>{session=newShift(api.state,kind);plan=workPlan(kind,session.variant);api.save();render();};
 }
 function drawSpeech(s){
  const box=body.querySelector('#work-input');box.innerHTML='<details class="work-example"><summary>Need a sentence starter?</summary><p>'+esc(s.hint)+'</p></details>'+(mode==='voice'?'<button class="primary work-mic" id="work-mic">Tap to speak English</button><button class="secondary" id="work-mode">Type instead</button>':'<form id="work-answer-form"><label for="work-answer">Your English reply</label><textarea id="work-answer" rows="2" maxlength="300" placeholder="Say it in your own words…" required></textarea><button class="primary" type="submit">Send reply</button></form><button class="secondary" id="work-mode">Speak instead</button>');
  box.querySelector('#work-mode').onclick=()=>{voice?.abort();voice=null;mode=mode==='voice'?'text':'voice';drawSpeech(s);};
  const form=box.querySelector('form');if(form)form.onsubmit=e=>{e.preventDefault();submit(box.querySelector('textarea').value);};
  const mic=box.querySelector('#work-mic');if(mic)mic.onclick=()=>{
   if(voice?.session){voice.finish();return;}api.stopNarration();
   voice=new EnglishVoiceInput({Recognition:window.SpeechRecognition||window.webkitSpeechRecognition,secure:isSecureContext,onStatus:feedback,onListening:on=>{if(mic.isConnected)mic.textContent=on?'Listening… tap when finished':'Tap to speak English';},accepts:text=>spokenMatch(text,s.groups),onFinal:text=>{if(!disposed){feedback('I heard: '+text);submit(text);}}});voice.start();
  };
 }
 function fields(s){
  const measure=s.type==='measure',keys=measure?['flour','water','milk','yeast','sugar','salt','herbs']:Object.keys(s.fields);
  const choices={main:['Tomato soup','Grilled fish','Vegetable pasta'],side:['Bread','Salad'],drink:['Water','Tea','Juice','Lemonade'],change:['Regular','No cheese','No lemon','No butter','Mild','Extra lemon'],temperature:[150,180,200],minutes:[15,20,25]};
  const draft=session.draft.values||={};
  body.querySelector('#work-input').innerHTML='<div class="work-fields">'+keys.map(k=>'<label class="work-field"><span>'+esc(({change:'Special request',temperature:'Temperature · °C',minutes:'Timer · minutes'})[k]||k)+'</span>'+(measure?'<span class="work-counter"><button type="button" data-adjust="'+k+'" data-delta="-1" aria-label="Less '+k+'">−</button><output id="amount-'+k+'">'+(draft[k]||0)+'</output><button type="button" data-adjust="'+k+'" data-delta="1" aria-label="More '+k+'">+</button></span>':'<select data-field="'+k+'"><option value="">Choose…</option>'+choices[k].map(v=>'<option value="'+esc(v)+'"'+(String(draft[k])===String(v)?' selected':'')+'>'+esc(v)+'</option>').join('')+'</select>')+'</label>').join('')+'</div><button class="primary" id="work-check">'+(s.type==='tray'?'Check my tray':s.type==='settings'?'Check oven settings':'Check ingredients')+'</button>';
  body.querySelectorAll('[data-adjust]').forEach(b=>b.onclick=()=>{const k=b.dataset.adjust;draft[k]=Math.max(0,Math.min(9,(draft[k]||0)+Number(b.dataset.delta)));body.querySelector('#amount-'+k).textContent=draft[k];api.save();});
  body.querySelectorAll('[data-field]').forEach(el=>el.onchange=()=>{draft[el.dataset.field]=el.value;api.save();});
  body.querySelector('#work-check').onclick=()=>submit(draft);
 }
 function motion(s){
  let count=Number(session.draft.count)||0;
  body.querySelector('#work-input').innerHTML='<p id="motion-count" class="work-count">'+count+' / '+s.target+'</p><button class="work-motion" id="work-motion">'+(s.type==='stir'?'Stir once ↻':'Fold & press')+'</button><p class="work-help">'+(s.type==='stir'?'Or drag around the bowl to stir.':'Fold the dough over, then press it gently.')+'</p><button class="primary" id="work-check">Ready for the next step</button>';
  const advance=()=>{count=Math.min(s.target,count+1);session.draft.count=count;body.querySelector('#motion-count').textContent=count+' / '+s.target;const img=body.querySelector('.work-object img');if(img){img.classList.remove('working');void img.offsetWidth;img.classList.add('working');}api.save();};
  body.querySelector('#work-motion').onclick=advance;body.querySelector('#work-check').onclick=()=>submit(count);
  if(s.type==='stir'){const surface=body.querySelector('.work-object');let angle=null,travel=0;
   const a=e=>{const r=surface.getBoundingClientRect();return Math.atan2(e.clientY-r.top-r.height/2,e.clientX-r.left-r.width/2);};
   surface.onpointerdown=e=>{angle=a(e);travel=0;surface.setPointerCapture(e.pointerId);};
   surface.onpointermove=e=>{if(angle===null)return;const next=a(e);let d=next-angle;if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;travel+=Math.abs(d);angle=next;if(travel>Math.PI*1.5){travel=0;advance();}};
   surface.onpointerup=surface.onpointercancel=()=>angle=null;
  }
 }
 function oven(s){
  const box=body.querySelector('#work-input');box.innerHTML='<div class="work-oven"><div class="oven-meter"><i></i></div><p id="oven-status"></p></div><button class="primary" id="work-oven-action"></button>';
  const b=box.querySelector('button'),status=box.querySelector('#oven-status');
  function update(){const at=session.draft.readyAt,ready=at&&Date.now()>=at;box.querySelector('.oven-meter i').style.width=at?Math.min(100,Math.max(0,100-(at-Date.now())/25))+'%':'0%';status.textContent=ready?'Golden and ready! Let the bread cool, then take it out.':at?'Baking… watch the golden color.':'The tray is ready. Start your game oven.';b.textContent=ready?'Take out the bread':at?'Baking…':'Put the tray in';b.disabled=!!at&&!ready;if(ready)body.querySelector('.work-object').classList.add('golden');}
  b.onclick=()=>{if(session.draft.readyAt){submit('golden');return;}session.draft.readyAt=Date.now()+2500;api.save();update();};timer=setInterval(update,100);update();
 }
 function render(){
  stop();if(disposed||!body.isConnected)return;if(session.step===plan.length){finish();return;}
  const s=plan[session.step];body.dataset.stage=s.type;body.dataset.step=String(session.step);body.dataset.kind=kind;
  const object=s.sceneArt?'<img src="'+esc(s.sceneArt)+'" alt="'+esc(meta.name)+'">':s.art?'<img src="'+art(s.art)+'" alt="'+esc(s.title)+'">':kind==='pottery'?'<img src="assets/decor/clay-pot.webp" alt="A handmade pottery piece">':'<img src="'+art('room-museum')+'" alt="Your museum exhibition">';
  const ticket=s.ticket&&session.step%6>=2?'<aside class="work-ticket"><strong>'+esc(s.customer)+' · Table '+s.table+'</strong>'+Object.values(s.ticket).map(v=>'<span>'+esc(v)+'</span>').join('')+'</aside>':'';
  body.innerHTML='<div class="work-progress"><span>Step '+(session.step+1)+' of '+plan.length+'</span><span>Progress saved</span><div><i style="width:'+session.step/plan.length*100+'%"></i></div></div><div class="work-layout"><section class="work-visual '+kind+'"><img class="work-person" src="'+art('town-customers-'+s.portrait)+'" alt="'+esc(title({...s,kind}))+'"><h3>'+esc(title({...s,kind}))+'</h3><div class="work-object">'+object+'</div>'+ticket+'</section><section class="work-task"><h3>'+esc(s.title)+'</h3><div class="work-voice"><button id="work-listen" class="secondary">Listen again</button><details><summary>Read the instructions</summary><p>'+esc(s.text)+'</p></details></div>'+(s.bill?'<p class="work-bill">Bill total: <strong>'+s.bill+' coins</strong></p>':'')+'<div id="work-input"></div><p id="work-feedback" role="status">Listen carefully. Take your time; you can retry any step.</p></section></div>';
  body.querySelector('#work-listen').onclick=()=>{voice?.abort();api.speak(s.text,true,'work-'+s.id);};
  if(s.type==='speak')drawSpeech(s);
  else if(signatureTypes.includes(s.type))controlCleanup=signatureControls(s,{body,session,save:api.save,submit,feedback,stopNarration:api.stopNarration});
  else if(['measure','settings','tray'].includes(s.type))fields(s);
  else if(['stir','knead'].includes(s.type))motion(s);
  else if(s.type==='bake')oven(s);
  else if(s.type==='choose'){body.querySelector('#work-input').innerHTML='<div class="work-choices">'+s.choices.map(c=>'<button data-work-choice="'+esc(c)+'">'+esc(c)+'</button>').join('')+'</div>';body.querySelectorAll('[data-work-choice]').forEach(b=>b.onclick=()=>submit(b.dataset.workChoice));}
  else if(s.type==='number'){body.querySelector('#work-input').innerHTML='<form id="work-number-form"><label for="work-number">How many?</label><input id="work-number" type="number" min="0" max="20" required><button class="primary">Check the amount</button></form>';body.querySelector('form').onsubmit=e=>{e.preventDefault();submit(body.querySelector('input').value);};}
  else if(s.type==='sequence'){
   const picked=session.draft.picked||=[];body.querySelector('#work-input').innerHTML='<ol id="work-sequence"></ol><div class="work-choices">'+s.choices.map(c=>'<button data-sequence="'+esc(c)+'">'+esc(c)+'</button>').join('')+'</div><button class="secondary" id="sequence-reset">Start the order again</button><button class="primary" id="work-check">Check the timeline</button>';
   const refresh=()=>{body.querySelector('#work-sequence').innerHTML=picked.map(v=>'<li>'+esc(v)+'</li>').join('');body.querySelectorAll('[data-sequence]').forEach(b=>b.disabled=picked.includes(b.dataset.sequence));api.save();};
   body.querySelectorAll('[data-sequence]').forEach(b=>b.onclick=()=>{picked.push(b.dataset.sequence);refresh();});body.querySelector('#sequence-reset').onclick=()=>{picked.length=0;refresh();};body.querySelector('#work-check').onclick=()=>submit(picked);refresh();
  }
  api.speak(s.text,false,'work-'+s.id);
 }
 render();
}
