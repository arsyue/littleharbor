import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
import {adventures,checkAnswer,ensureAdventures,finishAdventure,validAdventures} from '../web/adventures.mjs';
import {newState,validateState} from '../web/state.mjs';
const root=resolve('public');
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!path.startsWith(root+'/'))throw Error();const file=path.endsWith('/')?path+'index.html':path;const type={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm','.css':'text/css','.webp':'image/webp','.jpg':'image/jpeg','.mp3':'audio/mpeg','.json':'application/json'}[extname(file)]||'application/octet-stream';res.setHeader('Content-Type',type);res.end(await readFile(file));}catch{res.statusCode=404;res.end('Not found');}});
await new Promise(r=>server.listen(4173,'127.0.0.1',r));
await mkdir('qa-output',{recursive:true});
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1});
const errors=[];const checks=[];const requests=[];let startupMs=0;page.on('request',r=>requests.push(r.url()));
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('favicon'))errors.push(m.text());});
const base='http://127.0.0.1:4173';
const readSave=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('little-harbor-save-v1')));
async function engine(count){await page.locator('#aquarium-engine').waitFor();await page.waitForFunction(()=>document.querySelector('#aquarium-engine')?.contentWindow?.location.href.includes('/aquarium/'));const f=page.frames().find(x=>x.url().includes('/aquarium/'));await f.waitForFunction(n=>window.harborDiagnostics?.fish.length===n,count,{timeout:90000});return f;}
async function answer(text){if(await page.getByRole('button',{name:'Type instead',exact:true}).count())await page.getByRole('button',{name:'Type instead',exact:true}).click();await page.locator('#answer-input').fill(text);await page.locator('#answer-form button').click();}
try{
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
 await frame.locator('#pause').click();const stopped=await frame.evaluate(()=>window.harborDiagnostics.fish);await page.waitForTimeout(300);
 assert.deepEqual(await frame.evaluate(()=>window.harborDiagnostics.fish),stopped);await frame.locator('#pause').click();
 await frame.locator('#light').click();assert.equal(await frame.evaluate(()=>window.harborDiagnostics.night),true);await frame.locator('#light').click();
 checks.push('Pause and day/night controls work');
 await page.screenshot({path:'qa-output/initial-aquarium.jpg',quality:80});
 console.log('Initial renderer',await frame.evaluate(()=>window.harborDiagnostics));
 await frame.locator('canvas').click({position:{x:700,y:150}});
 await frame.waitForFunction(()=>window.harborDiagnostics.feeding);
 assert.equal((await readSave()).coins,40);
 await page.locator('[data-action="feed"]').click();assert.equal((await readSave()).coins,40);
 checks.push('Clicking water feeds fish and rewards the quest once');
 await page.locator('[data-nav="town"]').first().click();
 async function townFrame(){await page.locator('#town-engine').waitFor();await page.waitForFunction(()=>document.querySelector('#town-engine')?.contentWindow?.location.href.includes('/town/'));const f=page.frames().find(x=>x.url().includes('/town/'));await f.waitForFunction(()=>window.townDiagnostics);return f;}
 let town=await townFrame();
 async function arrived(id){await town.waitForFunction(id=>window.townDiagnostics.near===id&&window.townDiagnostics.pathLength===0,id,{timeout:45000});assert.equal(await town.evaluate(()=>window.townDiagnostics.blocked),false);}
 async function walk(id){await town.locator('#destination').selectOption(id);await arrived(id);}
 async function talk(id){await walk(id);await town.locator('#interact').click();await page.locator('#visit-task').click();}
 const initialTown=await town.evaluate(()=>window.townDiagnostics);
 assert.deepEqual(initialTown.world,{width:2600,height:1800});
 await town.locator('#world').focus();await page.keyboard.down('ArrowRight');try{await town.waitForFunction(x=>window.townDiagnostics.player.x>x+40,initialTown.player.x,{timeout:10000});}finally{await page.keyboard.up('ArrowRight');}
 assert.ok((await town.evaluate(()=>window.townDiagnostics.player.x))>initialTown.player.x+40);
 checks.push('Large continuous town supports keyboard walking and follows the explorer');
 await page.screenshot({path:'qa-output/town-desktop.jpg',quality:84});
 for(const mission of adventures){
  await talk(mission.person);
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
   assert.equal(await page.getByRole('button',{name:'Tap to speak',exact:true}).count(),1);
   if(mission.id==='welcome'&&i===0){
    await answer('yes');assert.equal(await page.locator('#dialogue-next').count(),0);
    assert.match(await page.locator('#speech-feedback').textContent(),/full sentence/);
   }
   if(mission.id==='welcome'&&i===2)await page.screenshot({path:'qa-output/story-dialogue.jpg',quality:85});
   await answer(step.hint);
   await page.locator('#dialogue-next').waitFor();
   if(mission.id==='welcome'&&i===0){
    await page.locator('.modal-close').click();await page.reload();await engine(2);
    await page.locator('[data-nav="town"]').first().click();town=await townFrame();
    assert.equal((await readSave()).adventures.progress.welcome,1);
    await talk('lily');
   }else await page.locator('#dialogue-next').click();
  }
  assert.ok((await readSave()).adventures.completed.includes(mission.id));
 }
 assert.equal((await readSave()).coins,590);
 checks.push('All four seven-turn stories complete, with default voice input and full-sentence checks');
 checks.push('Five clue gates require walking to notices; story progress survives reload');
 checks.push('Story rewards total 550 coins, paid once per first completion');
 await page.locator('.town-journal').click();assert.equal(await page.locator('[data-story]').count(),4);
 assert.equal(await page.locator('[data-notice]').count(),5);await page.locator('.modal-close').click();
 checks.push('Adventure journal shows all stories and saved field notes');
 await walk('garden');await town.locator('#interact').click();await page.locator('#notice-done').click();
 await walk('beach');await town.locator('#interact').click();await page.locator('#notice-done').click();
 await page.screenshot({path:'qa-output/town-harbor.jpg',quality:84});
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
 await page.screenshot({path:'qa-output/starter-desktop.jpg',quality:80});
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
  s.decor=decor.map((d,i)=>({uid:'decor-'+i,id:d.id,x:13+i*10.5,y:62+(i%2)*16}));
  localStorage.setItem('little-harbor-save-v1',JSON.stringify(s));
 });
 await page.reload();frame=await engine(8);await page.waitForTimeout(4000);
 await page.screenshot({path:'qa-output/aquarium-desktop.jpg',quality:80});
 const diag=await frame.evaluate(()=>window.harborDiagnostics);
 assert.ok(diag.fish.every(f=>Math.abs(f.x)<diag.width&&Math.abs(f.z)<diag.depth&&f.y>0&&f.y<diag.height));
 checks.push('All eight species and eight decorations load inside tank bounds');
 const f0=diag.fish[0];await frame.locator('canvas').click({position:{x:f0.sx,y:f0.sy}});await page.locator('.fish-modal').waitFor();await page.locator('.modal-close').click();checks.push('Clicking a fish opens its details');
 await page.setViewportSize({width:390,height:844});await page.reload();await engine(8);
 await page.waitForTimeout(1500);await page.screenshot({path:'qa-output/aquarium-mobile.jpg',fullPage:true,quality:78});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 checks.push('Mobile layout fits viewport');
 await page.locator('[data-nav="town"]').first().click();town=await townFrame();
 const mobileBefore=await town.evaluate(()=>window.townDiagnostics.player.x);
 const right=await town.locator('[data-key="ArrowRight"]').boundingBox(),iframeBox=await page.locator('#town-engine').boundingBox();
 await page.mouse.move(right.x+right.width/2,right.y+right.height/2);
 await page.mouse.down();try{await town.waitForFunction(x=>window.townDiagnostics.player.x>x+30,mobileBefore,{timeout:10000});}finally{await page.mouse.up();}
 assert.ok((await town.evaluate(()=>window.townDiagnostics.player.x))>mobileBefore+30);
 await page.screenshot({path:'qa-output/town-mobile.jpg',fullPage:true,quality:82});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 assert.ok(await town.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 checks.push('Mobile walking pad works and town UI fits the screen');
 assert.deepEqual(errors,[]);
 checks.push('No browser or engine console errors');
 await writeFile('qa-output/results.json',JSON.stringify({success:true,checks,startupMs,rendererBytes:Buffer.byteLength(await readFile('public/aquarium/aquarium.mjs'))},null,2));
 console.log(JSON.stringify({success:true,checks},null,2));
}catch(error){
 await page.screenshot({path:'qa-output/failure.jpg',fullPage:true,quality:78}).catch(()=>{});
 await writeFile('qa-output/results.json',JSON.stringify({success:false,checks,error:String(error),errors},null,2));
 console.error(error);console.error(errors);process.exitCode=1;
}finally{await browser.close();await new Promise(r=>server.close(r));}
