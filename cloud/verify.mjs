import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
import {adventures,checkAnswer,ensureAdventures,finishAdventure,validAdventures} from '../web/adventures.mjs';
import {newState,validateState} from '../web/state.mjs';
const root=resolve('public');
const server=createServer(async(req,res)=>{if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return;}try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!path.startsWith(root+sep))throw Error();const file=path.endsWith('/')?path+'index.html':path;const type={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm','.css':'text/css','.webp':'image/webp','.jpg':'image/jpeg','.mp3':'audio/mpeg','.json':'application/json'}[extname(file)]||'application/octet-stream';res.setHeader('Content-Type',type);res.end(await readFile(file));}catch{res.statusCode=404;res.end('Not found');}});
await new Promise(r=>server.listen(4173,'127.0.0.1',r));
await mkdir('qa-output',{recursive:true});
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1});
await page.addInitScript(()=>{
 const NativeAudio=window.Audio;window.__recordedAudio=[];window.__speechFallbacks=[];
 window.Audio=function(src){const a=new NativeAudio(src);window.__recordedAudio.push(a);return a;};window.Audio.prototype=NativeAudio.prototype;
 if(window.speechSynthesis)window.speechSynthesis.speak=u=>window.__speechFallbacks.push(u.text);
 class TestRecognition{start(){this.onstart?.();}abort(){this.onend?.();}stop(){this.onend?.();}}
 window.SpeechRecognition=TestRecognition;
});
const errors=[];const checks=[];const requests=[];let startupMs=0;page.on('request',r=>requests.push(r.url()));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))errors.push('HTTP '+r.status()+' '+r.url());});
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text());});
const base='http://127.0.0.1:4173';
const readSave=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('little-harbor-save-v1')));
async function engine(count){await page.locator('#aquarium-engine').waitFor();await page.waitForFunction(()=>document.querySelector('#aquarium-engine')?.contentWindow?.location.href.includes('/aquarium/'));const f=page.frames().find(x=>x.url().includes('/aquarium/'));await f.waitForFunction(n=>window.harborDiagnostics?.fish.length===n,count,{timeout:90000});return f;}
async function answer(text){if(await page.getByRole('button',{name:'Type instead',exact:true}).count())await page.getByRole('button',{name:'Type instead',exact:true}).click();await page.locator('#answer-input').fill(text);await page.locator('#answer-form button').click();}
async function audioPlaying(key){
 await page.waitForFunction(key=>{
  const clip=window.__recordedAudio.find(a=>!a.__verified&&a.src.includes('/'+key+'-')&&a.currentTime>.02);
  if(!clip)return false;clip.__verified=true;return true;
 },key,{timeout:15000});
}
try{
 const manifest=JSON.parse(await readFile('public/audio/manifest.json','utf8'));
 assert.equal(manifest.engine,'kokoro');assert.equal(Object.keys(manifest.clips).length,216);
 for(const m of adventures)for(const [i,s] of m.steps.entries())for(const kind of ['say','hint','feedback']){
  const c=manifest.clips[m.id+'-'+i+'-'+kind];assert.equal(c.text,s[kind]);assert.ok(c.duration>1&&c.duration<45);
  assert.ok((await readFile('public/'+c.url)).length>1000);
 }
 checks.push('All 216 Kokoro recordings match the live dialogue and exist in the published build');
 for(const mission of adventures){
  for(const step of mission.steps){assert.equal(checkAnswer(step.hint,step).ok,true,mission.id+' example must work');assert.equal(checkAnswer('yes',step).ok,false);}
  const s=newState();ensureAdventures(s);assert.equal(finishAdventure(s,mission.id),null);
  s.adventures.progress[mission.id]=mission.steps.length;assert.equal(finishAdventure(s,mission.id).paid,mission.reward);
  assert.equal(finishAdventure(s,mission.id),null);
  s.adventures.progress[mission.id]=mission.steps.length;assert.equal(finishAdventure(s,mission.id).paid,35);
  assert.equal(s.coins,mission.reward+35);assert.ok(validateState(s));
 }
 assert.ok(validateState(newState()));assert.equal(validAdventures({progress:{welcome:99},completed:[],discovered:[]}),false);
 checks.push('All 28 model answers validate; old saves remain valid; replays pay only 35 coins');
 const startTime=Date.now();await page.goto(base+'/index.html');
 let frame=await engine(2);startupMs=Date.now()-startTime;
 assert.ok(startupMs<5000,'Aquarium must start within 5 seconds in cloud QA');
 assert.ok(!requests.some(url=>/\.wasm|\.pck/.test(url)),'No game engine downloaded');
 checks.push('Aquarium starts within five seconds without an engine download');
 const before=await frame.evaluate(()=>window.harborDiagnostics.fish);
 await frame.waitForFunction(old=>window.harborDiagnostics.fish.some((f,i)=>Math.hypot(f.x-old[i].x,f.y-old[i].y,f.z-old[i].z)>0.1),before,{timeout:30000});
 checks.push('Fish swim continuously');
 const motionReview=await frame.evaluate(async()=>{
  const samples=[];for(let i=0;i<36;i++){samples.push({t:window.harborDiagnostics.elapsed,fish:window.harborDiagnostics.fish});await new Promise(r=>setTimeout(r,100));}return samples;
 });
 for(let i=1;i<motionReview.length;i++)for(let j=0;j<motionReview[i].fish.length;j++){
  const f=motionReview[i].fish[j],old=motionReview[i-1].fish[j],dt=motionReview[i].t-motionReview[i-1].t;
  const delta=Math.atan2(Math.sin(f.heading-old.heading),Math.cos(f.heading-old.heading));
  assert.ok(Number.isFinite(f.heading)&&Math.abs(delta)<=2.21*dt+.01,'Visible fish turns are gradual');
 }
 checks.push('Browser-rendered fish turn smoothly without abrupt direction snaps');
 await frame.locator('#pause').click();const stopped=await frame.evaluate(()=>window.harborDiagnostics.fish);await page.waitForTimeout(300);
 assert.deepEqual(await frame.evaluate(()=>window.harborDiagnostics.fish),stopped);await frame.locator('#pause').click();
 await frame.locator('#light').click();assert.equal(await frame.evaluate(()=>window.harborDiagnostics.night),true);await frame.locator('#light').click();
 checks.push('Pause and day/night controls work');
 await page.screenshot({animations:'disabled',path:'qa-output/initial-aquarium.jpg',quality:80});
 console.log('Initial renderer',await frame.evaluate(()=>window.harborDiagnostics));
 await frame.locator('#pause').click();await frame.waitForFunction(()=>window.harborDiagnostics.paused);
 const emptyWater=await frame.evaluate(()=>{const fish=window.harborDiagnostics.fish;return [.2,.4,.6,.8].flatMap(x=>[.25,.4,.55].map(y=>({x:x*innerWidth,y:y*innerHeight}))).map(p=>({...p,clearance:Math.min(...fish.map(f=>Math.hypot(p.x-f.sx,p.y-f.sy)))})).sort((a,b)=>b.clearance-a.clearance)[0];});
 assert.ok(emptyWater.clearance>150,'select clear water away from fish hit targets');
 await frame.locator('canvas').click({position:{x:emptyWater.x,y:emptyWater.y}});
 await frame.waitForFunction(()=>window.harborDiagnostics.feeding);
 assert.equal((await readSave()).coins,40);
 await page.locator('[data-action="feed"]').click();assert.equal((await readSave()).coins,40);
 checks.push('Clicking water feeds fish and rewards the quest once');
 await page.locator('[data-nav="town"]').first().click();
 async function townFrame(){await page.locator('#town-engine').waitFor();await page.waitForFunction(()=>document.querySelector('#town-engine')?.contentWindow?.location.href.includes('/town/'));const f=page.frames().find(x=>x.url().includes('/town/'));await f.waitForFunction(()=>window.townDiagnostics);return f;}
 let town=await townFrame();
 async function arrived(id){await town.waitForFunction(id=>window.townDiagnostics.near===id&&window.townDiagnostics.pathLength===0,id,{timeout:45000});assert.equal(await town.evaluate(()=>window.townDiagnostics.blocked),false);}
 async function walk(id){await town.locator('#destination').selectOption(id);await arrived(id);}
 async function talk(id){await walk(id);await town.locator('#interact').click();await audioPlaying(id+'-greeting');await page.locator('#visit-task').click();}
 const initialTown=await town.evaluate(()=>window.townDiagnostics);
 assert.deepEqual(initialTown.world,{width:5400,height:2400});
 assert.equal(initialTown.art.expansion.loaded,4);assert.equal(initialTown.houses.length,16);
 assert.equal(initialTown.art.version,4);assert.equal(initialTown.art.loaded,14);assert.deepEqual(initialTown.art.failed,[]);
 assert.ok(initialTown.art.bytes<4500000);assert.equal(await town.locator('#loading').count(),0);
 checks.push('All 14 ImageGen town asset packages load with transparency within the artwork budget');
 assert.equal(initialTown.art.ground.loaded,2);assert.equal(initialTown.art.ground.version,6);assert.ok(initialTown.art.ground.bytes>10000&&initialTown.art.ground.bytes<650000);
 checks.push('Both ground textures load: natural limestone paving and short meadow grass');
 await page.locator('#town-engine').screenshot({path:'qa-output/town-art-square.jpg',quality:90});
 await town.locator('#world').focus();await page.keyboard.down('ArrowRight');try{await town.waitForFunction(x=>window.townDiagnostics.player.x>x+40,initialTown.player.x,{timeout:10000});}finally{await page.keyboard.up('ArrowRight');}
 assert.ok((await town.evaluate(()=>window.townDiagnostics.player.x))>initialTown.player.x+40);
 assert.equal(await town.evaluate(()=>window.townDiagnostics.direction),1);
 checks.push('Large continuous town supports keyboard walking, directional character sprites and follows the explorer');
 await page.screenshot({animations:'disabled',path:'qa-output/town-desktop.jpg',quality:84});
 for(const mission of adventures){
  await talk(mission.person);
  await page.locator('#town-engine').screenshot({path:'qa-output/town-art-'+mission.person+'.jpg',quality:88});
  for(let i=0;i<mission.steps.length;i++){
   const step=mission.steps[i];
   if(step.requires){
    await page.locator('#find-story-clue').waitFor();
    assert.ok(!(await readSave()).adventures.discovered.includes(step.requires));
    await page.locator('#find-story-clue').click();await arrived(step.requires);
    await town.locator('#interact').click();await page.locator('#notice-done').click();
    assert.ok((await readSave()).adventures.discovered.includes(step.requires));
    await talk(mission.person);
   }
   await audioPlaying(mission.id+'-'+i+'-say');
   await page.locator('.sentence-help summary').click();
   await page.locator('#hear-hint').click();await audioPlaying(mission.id+'-'+i+'-hint');
   await page.locator('#hear-question').click();await audioPlaying(mission.id+'-'+i+'-say');
   if(mission.id==='welcome'&&i===0){
    await page.locator('#mic-button').click();
    assert.ok(await page.evaluate(()=>window.__recordedAudio.every(a=>a.paused)),'Starting microphone stops narration');
    await page.locator('#mic-button').click();
   }
   assert.equal(await page.getByRole('button',{name:'Tap to speak',exact:true}).count(),1);
   if(mission.id==='welcome'&&i===0){
    await answer('yes');assert.equal(await page.locator('#dialogue-next').count(),0);
    assert.match(await page.locator('#speech-feedback').textContent(),/key details|full sentence/);
   }
   if(mission.id==='welcome'&&i===2)await page.screenshot({animations:'disabled',path:'qa-output/story-dialogue.jpg',quality:85});
   await answer(step.hint);
   await page.locator('#dialogue-next').waitFor();await audioPlaying(mission.id+'-'+i+'-feedback');
   if(mission.id==='welcome'&&i===0){
    await page.locator('.modal-close').click();assert.ok(await page.evaluate(()=>window.__recordedAudio.every(a=>a.paused)),'Closing a conversation stops narration');await page.reload();await engine(2);
    await page.locator('[data-nav="town"]').first().click();town=await townFrame();
    assert.equal((await readSave()).adventures.progress.welcome,1);
    await talk('lily');
   }else await page.locator('#dialogue-next').click();
  }
  assert.ok((await readSave()).adventures.completed.includes(mission.id));
 }
 assert.equal((await readSave()).coins,590);
 assert.deepEqual(await page.evaluate(()=>window.__speechFallbacks),[],'Story audio must use recorded voices instead of browser fallback');
 checks.push('Four greetings and all 84 story lines, hints and feedback play real Kokoro MP3s');
 checks.push('Replay works; microphone start and dialog close interrupt narration immediately');
 assert.notEqual(await page.locator('.task-preview strong').textContent(),adventures[0].title);
 checks.push('All four seven-turn stories complete, with default voice input and configurable speaking support');
 checks.push('Five clue gates require walking to notices; story progress survives reload');
 checks.push('Story rewards total 550 coins, paid once per first completion');
 await page.locator('.town-journal').click();assert.equal(await page.locator('[data-story]').count(),4);
 assert.equal(await page.locator('[data-notice]').count(),5);await page.locator('.modal-close').click();
 checks.push('Adventure journal shows all stories and saved field notes');
 await walk('garden');await town.locator('#interact').click();await page.locator('#notice-done').click();
 await walk('beach');await town.locator('#interact').click();await page.locator('#notice-done').click();
 await page.screenshot({animations:'disabled',path:'qa-output/town-harbor.jpg',quality:84});
 checks.push('Every story location, garden, beach and lighthouse is reachable on foot');
 await page.locator('[data-nav="home"]').first().click();
 await page.locator('[data-action="decorate"]').click();
 await page.locator('[data-buy="seaweed"]').click();
 await answer('Yes please');
 await page.locator('#dialogue-next').click();
 frame=await engine(2);
 await frame.waitForFunction(()=>window.harborDiagnostics.decor.length===1);
 assert.equal((await readSave()).coins,625);
 checks.push('Purchased decoration appears in the aquarium and uses earned coins');
 await page.locator('[data-action="decorate"]').click();
 frame=await engine(2);
 await frame.waitForFunction(()=>window.harborDiagnostics.editing);
 const d=await frame.evaluate(()=>window.harborDiagnostics.decor[0]);
 const rect=await page.locator('#aquarium-engine').boundingBox();
 await page.mouse.move(rect.x+d.sx,rect.y+d.sy);
 await page.mouse.down();await page.waitForTimeout(500);await page.mouse.move(rect.x+d.sx+70,rect.y+d.sy+12,{steps:18});await page.waitForTimeout(500);await page.mouse.up();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('little-harbor-save-v1')).completed.includes('place'));
 checks.push('Dragging a decoration saves placement and awards its quest');
 await page.locator('[data-action="decorate"]').click();
 await page.locator('[data-action="fish-shop"]').click();
 await page.locator('[data-buy="clownfish"]').click();await answer('Yes please');await page.locator('#dialogue-next').click();
 frame=await engine(3);
 checks.push('Purchased fish joins the aquarium');
 await page.screenshot({animations:'disabled',path:'qa-output/starter-desktop.jpg',quality:80});
 const old=await readSave();
 await page.evaluate(s=>{s.coins=600;localStorage.setItem('little-harbor-save-v1',JSON.stringify(s));},old);
 await page.reload();await engine(3);
 await page.locator('[data-action="upgrade"]').click();await page.locator('#upgrade-buy').click();
 frame=await engine(3);
 assert.equal((await readSave()).tank,1);
 await frame.waitForFunction(()=>window.harborDiagnostics.tier===1);
 checks.push('Tank upgrade enlarges the habitat and increases capacity');
 // A separately seeded QA save lets reviewers see all purchased models together.
 await page.evaluate(async()=>{
  const {newState}=await import('./state.mjs');const {fish,decor}=await import('./content.mjs');
  const s=newState();s.tank=2;s.coins=255;
  s.fish=fish.map((f,i)=>({uid:'review-'+i,id:f.id,name:f.name}));
  s.decor=decor.map((d,i)=>({uid:'decor-'+i,id:d.id,x:10+(i%8)*11,y:62+Math.floor(i/8)*18}));
  localStorage.setItem('little-harbor-save-v1',JSON.stringify(s));
 });
 await page.reload();frame=await engine(16);await page.waitForTimeout(4000);
 await page.screenshot({animations:'disabled',path:'qa-output/aquarium-desktop.jpg',quality:80});
 const diag=await frame.evaluate(()=>window.harborDiagnostics);
 assert.ok(diag.fish.every(f=>Math.abs(f.x)<diag.width&&Math.abs(f.z)<diag.depth&&f.y>0&&f.y<diag.height));
 checks.push('All sixteen species and twenty decorations load inside tank bounds');
 const f0=diag.fish[0];await frame.locator('canvas').click({position:{x:f0.sx,y:f0.sy}});await page.locator('.fish-modal').waitFor();await page.locator('.modal-close').click();checks.push('Clicking a fish opens its details');
 await page.setViewportSize({width:390,height:844});await page.reload();await engine(16);
 await page.waitForTimeout(1500);await page.screenshot({animations:'disabled',path:'qa-output/aquarium-mobile.jpg',fullPage:true,quality:78});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 checks.push('Mobile layout fits viewport');
 await page.locator('[data-nav="town"]').first().click();town=await townFrame();
 const mobileBefore=await town.evaluate(()=>window.townDiagnostics.player.x);
 await town.locator('[data-key="ArrowRight"]').scrollIntoViewIfNeeded();
 const right=await town.locator('[data-key="ArrowRight"]').boundingBox(),iframeBox=await page.locator('#town-engine').boundingBox();
 await page.mouse.move(right.x+right.width/2,right.y+right.height/2);
 await page.mouse.down();try{await town.waitForFunction(x=>window.townDiagnostics.player.x>x+30,mobileBefore,{timeout:10000});}finally{await page.mouse.up();}
 assert.ok((await town.evaluate(()=>window.townDiagnostics.player.x))>mobileBefore+30);
 await page.screenshot({animations:'disabled',path:'qa-output/town-mobile.jpg',fullPage:true,quality:82});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 assert.ok(await town.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 checks.push('Mobile walking pad works and town UI fits the screen');
 // Full screen keeps the document, including dialogs, in the browser's top layer.
 await page.setViewportSize({width:1440,height:1000});
 await page.locator('[data-action="fullscreen"]').click();
 await page.waitForFunction(()=>document.fullscreenElement===document.documentElement);
 assert.equal(await page.locator('#screen-exit').isVisible(),true);
 let box=await page.locator('.world').boundingBox();
 assert.ok(Math.abs(box.x)<1&&Math.abs(box.y-52)<1&&Math.abs(box.width-1440)<2&&Math.abs(box.height-948)<2);
 await page.screenshot({path:'qa-output/fullscreen-town.jpg',quality:85});
 await page.locator('.town-journal').click();
 assert.equal(await page.locator('[role="dialog"]').isVisible(),true);
 assert.equal(await page.evaluate(()=>document.fullscreenElement===document.documentElement),true);
 await page.locator('.modal-close').click();
 await page.locator('#screen-switch').click();frame=await engine(16);
 assert.equal(await page.evaluate(()=>document.body.classList.contains('game-fullscreen')),true);
 await page.locator('[data-action="feed"]').click();
 await frame.waitForFunction(()=>window.harborDiagnostics.feeding);
 await page.screenshot({path:'qa-output/fullscreen-aquarium.jpg',quality:85});
 await page.locator('#screen-exit').click();
 await page.waitForFunction(()=>!document.fullscreenElement&&!document.body.classList.contains('game-fullscreen'));
 await frame.locator('#immerse').click();
 await page.waitForFunction(()=>document.fullscreenElement===document.documentElement);
 await page.evaluate(()=>document.exitFullscreen());
 await page.waitForFunction(()=>!document.body.classList.contains('game-fullscreen'));
 assert.equal(await page.locator('[data-action="fullscreen"]').getAttribute('aria-pressed'),'false');
 checks.push('Native full screen fills town and aquarium, keeps dialogs and feeding usable, and restores normal layout on exit');
 // Browsers that deny full screen still receive a reversible viewport-filling mode.
 await page.evaluate(()=>Object.defineProperty(document.documentElement,'requestFullscreen',{configurable:true,value:()=>Promise.reject(new DOMException('Unavailable','NotAllowedError'))}));
 await page.setViewportSize({width:390,height:844});
 await page.locator('[data-action="fullscreen"]').click();
 await page.waitForFunction(()=>document.body.classList.contains('game-fullscreen')&&!document.fullscreenElement);
 box=await page.locator('.world').boundingBox();
 assert.ok(Math.abs(box.width-390)<2&&Math.abs(box.height-792)<2);
 assert.equal(await page.locator('#screen-exit').isVisible(),true);
 await page.locator('#screen-switch').click();town=await townFrame();
 await page.screenshot({path:'qa-output/fullscreen-mobile.jpg',quality:84});
 await town.locator('#world').focus();await page.keyboard.press('Escape');
 await page.waitForFunction(()=>!document.body.classList.contains('game-fullscreen'));
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.evaluate(()=>delete document.documentElement.requestFullscreen);
 checks.push('Mobile fallback fills the viewport, switches scenes and exits with Escape even when the game frame has focus');

 assert.deepEqual(errors,[]);
 checks.push('No browser or engine console errors');
 await writeFile('qa-output/results.json',JSON.stringify({success:true,checks,startupMs,rendererBytes:Buffer.byteLength(await readFile('public/aquarium/aquarium.mjs'))},null,2));
 console.log(JSON.stringify({success:true,checks},null,2));
}catch(error){
 await page.screenshot({animations:'disabled',path:'qa-output/failure.jpg',fullPage:true,quality:78}).catch(()=>{});
 await writeFile('qa-output/results.json',JSON.stringify({success:false,checks,error:String(error),errors},null,2));
 console.error(error);console.error(errors);console.error('Audio diagnostics',await page.evaluate(()=>({fallbacks:window.__speechFallbacks,audio:window.__recordedAudio.map(a=>({src:a.src,paused:a.paused,ended:a.ended,time:a.currentTime,ready:a.readyState,error:a.error?.message,verified:a.__verified}))})));process.exitCode=1;
}finally{await browser.close();await new Promise(r=>server.close(r));}
