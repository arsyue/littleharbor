const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require('playwright');
const root=path.resolve('public'),server=http.createServer((req,res)=>{const name=decodeURIComponent(req.url.split('?')[0]);if(name==='/favicon.ico'){res.writeHead(204).end();return;}const p=path.join(root,name==='/'?'index.html':name);if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',({'.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.mp3':'audio/mpeg','.json':'application/json'})[path.extname(p)]||'text/html');res.end(fs.readFileSync(p));}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(r=>server.listen(8879,'127.0.0.1',r));const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:1050}});
 const errors=[],missing=[],checks=[],scenes=new Set();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
 const {houses}=await import('../web/places.mjs'),{quizzes,sentences,spellings}=await import('../web/indoor-games.mjs'),{activityFor}=await import('../web/room-data.mjs');
 await page.goto('http://127.0.0.1:8879/');await page.evaluate(()=>localStorage.clear());await page.reload();await page.locator('[data-nav="town"]').first().click();
 await page.waitForFunction(()=>document.querySelector('#town-engine')?.contentWindow.townDiagnostics);
 const f=page.frames().find(f=>f.url().includes('/town/'));await f.waitForFunction(()=>window.townDiagnostics?.art.loaded===14);
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('little-harbor-save-v1')));
 async function point(x,y){
  const v=await f.evaluate(()=>({v:townDiagnostics.roomView,w:innerWidth,h:innerHeight})),px=(x-v.v.cx)*v.v.scale+v.w/2,py=(y-v.v.cy)*v.v.scale+v.h/2;
  assert.ok(px>0&&py>0&&px<v.w&&py<v.h,'point is visible');
  await f.locator('#world').click({position:{x:px,y:py}});
  await f.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 }
 async function settle(){await f.waitForFunction(()=>!townDiagnostics.roomTarget,{timeout:15000});}
 async function near(id){const spot=await f.evaluate(id=>townDiagnostics.roomSpots.find(s=>s.id===id),id);await point(spot.x,spot.y);await f.waitForFunction(id=>townDiagnostics.roomNear===id&&!townDiagnostics.roomTarget,id,{timeout:15000});}
 async function key(k,ms){await f.locator('#world').focus();await page.keyboard.down(k);await page.waitForTimeout(ms);await page.keyboard.up(k);}
 async function enter(h,first=false){
  if(!first){const e=await f.evaluate(id=>townDiagnostics.houses.find(h=>h.id===id),h.id);await page.evaluate(e=>document.querySelector('#town-engine').contentWindow.postMessage({littleHarborTown:true,type:'state',position:{x:e.x,y:e.y+50}},location.origin),e);}
  await f.locator('#destination').selectOption(h.id);await f.waitForFunction(id=>townDiagnostics.inside===id,h.id,{timeout:60000});
  await f.waitForFunction(()=>townDiagnostics.roomImage.ready&&townDiagnostics.propsReady,{timeout:30000});scenes.add(await f.evaluate(()=>townDiagnostics.roomImage.url));
 }
 async function exit(){
  const id=await f.evaluate(()=>townDiagnostics.roomNear);if(id!=='exit'){await f.locator('#room-exit').click();await f.waitForFunction(()=>townDiagnostics.roomNear==='exit'&&!townDiagnostics.roomTarget,{timeout:15000});}
  await f.locator('#world').focus();await page.keyboard.press('e');await f.waitForFunction(()=>townDiagnostics.inside===null);
 }
 async function solve(h,spot='host'){
  const old=(await read()).coins;await near(spot);await f.locator('#world').focus();await page.keyboard.press('e');await page.locator('#house-game-body').waitFor();
  const floor=await f.evaluate(()=>townDiagnostics.roomFloor),activity=activityFor(h.id,(floor?'up-':'')+spot),rows=activity?.questions||quizzes[h.game];
  const choices=rows;
  if(choices){for(const row of choices){await page.locator('[data-choice]').evaluateAll((els,wrong)=>els.find(e=>e.dataset.choice===wrong).click(),row[2].find(x=>x!==row[3]));assert.equal((await read()).coins,old,'wrong answer pays no coins');await page.locator('[data-choice]').evaluateAll((els,answer)=>els.find(e=>e.dataset.choice===answer).click(),row[3]);}}
  else if(h.game==='sentence'){for(const sentence of sentences){for(let i=0;i<sentence.split(' ').length;i++)await page.locator('[data-word="'+i+'"]').click();await page.locator('#check-sentence').click();}}
  else if(h.game==='spell'){for(const [,word]of spellings){await page.locator('#spell-input').fill(word);await page.locator('.game-form button').click();}}
  else if(h.game==='memory'){const seen={};for(let i=0;i<8;i+=2){for(const j of [i,i+1]){const b=page.locator('[data-card="'+j+'"]');if(!await b.isDisabled())await b.click();seen[j]=await b.textContent();}await page.waitForTimeout(1000);}for(const [a,b]of [['🐠','fish'],['🌷','flower'],['🌳','tree'],['🐚','shell']])for(const k of Object.keys(seen).filter(k=>seen[k]===a||seen[k]===b)){const el=page.locator('[data-card="'+k+'"]');if(await el.count()&&!await el.isDisabled())await el.click();}}
  await page.locator('#finish-game').waitFor();assert.equal((await read()).coins,old+(activity?.reward??[20,35,50][h.level]));
  const paid=(await read()).coins;await page.waitForTimeout(100);assert.equal((await read()).coins,paid);await page.locator('#finish-game').click();await f.waitForFunction(()=>!townDiagnostics.paused);checks.push(h.id+' floor '+floor+' '+spot+' earns the correct reward');
 }
 try{
 for(const [i,h]of houses.entries()){
  console.log('ROOM',h.id);await enter(h,i===0);
  assert.ok(await f.locator('#room-play').isDisabled(),'cannot start a task from anywhere in the room');
  if(i===0){
   const obj=await f.evaluate(()=>townDiagnostics.roomObjects[0]);await point(obj.x,obj.y+90);await settle();await key('ArrowUp',1000);
   assert.ok((await f.evaluate(()=>townDiagnostics.roomPlayer.y))>=obj.y+25,'central table blocks walking through it');
  }
  await point(280,330);await settle();await key('ArrowUp',450);assert.ok((await f.evaluate(()=>townDiagnostics.roomPlayer.y))<310,'upper floor is reachable');
  assert.equal(await f.evaluate(()=>townDiagnostics.blocked),false);
  if(i===0){await key('ArrowRight',2200);assert.ok((await f.evaluate(()=>townDiagnostics.roomPlayer.x))>760);await point(140,680);await settle();assert.ok((await f.evaluate(()=>townDiagnostics.roomPlayer.x))<160);await key('ArrowRight',3800);assert.ok((await f.evaluate(()=>townDiagnostics.roomPlayer.x))>1050);checks.push('Full floor, both sides, furniture collision and routing verified');}
  await solve(h);await solve(h,'job-0');await solve(h,'job-1');
  await point(420,610);await settle();await page.screenshot({path:'qa-output/interior-'+h.id+'.jpg',quality:78,fullPage:true});
  if(['house-lighthouse','house-post'].includes(h.id)){
   await near('stairs');await f.locator('#world').focus();await page.keyboard.press('e');await f.waitForFunction(()=>townDiagnostics.roomFloor===1&&townDiagnostics.roomImage.ready&&townDiagnostics.propsReady);scenes.add(await f.evaluate(()=>townDiagnostics.roomImage.url));
   await solve(h,'job-0');await solve(h,'job-1');await page.screenshot({path:'qa-output/interior-'+h.id+'-upstairs.jpg',quality:80,fullPage:true});
   await f.locator('#room-exit').click();await f.waitForFunction(()=>townDiagnostics.roomNear==='exit'&&!townDiagnostics.roomTarget);await f.locator('#world').focus();await page.keyboard.press('e');await f.waitForFunction(()=>townDiagnostics.roomFloor===0);assert.equal(await f.evaluate(()=>townDiagnostics.inside),h.id);checks.push(h.id+' stairs work in both directions');
  }
  await exit();
 }
 assert.equal(scenes.size,14);
 const saved=await read();await page.reload();assert.equal((await read()).coins,saved.coins);assert.deepEqual((await read()).houseGames,saved.houseGames);checks.push('All indoor rewards persist after reloading');
 await page.setViewportSize({width:390,height:844});await page.locator('[data-nav="town"]').first().click();await page.waitForFunction(()=>document.querySelector('#town-engine')?.contentWindow.townDiagnostics);
 const mobile=page.frames().find(f=>f.url().includes('/town/'));await mobile.locator('#destination').selectOption('house-library');await mobile.waitForFunction(()=>townDiagnostics.inside==='house-library'&&townDiagnostics.roomImage.ready&&townDiagnostics.propsReady,{timeout:60000});
 const start=await mobile.evaluate(()=>townDiagnostics.roomPlayer.x),btn=await mobile.locator('[data-key="ArrowLeft"]').boundingBox();await page.mouse.move(btn.x+btn.width/2,btn.y+btn.height/2);await page.mouse.down();await page.waitForTimeout(900);await page.mouse.up();assert.ok((await mobile.evaluate(()=>townDiagnostics.roomPlayer.x))<start-100);
 await page.screenshot({path:'qa-output/interior-mobile.jpg',fullPage:true,quality:82});assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await mobile.locator('#room-exit').click();await mobile.waitForFunction(()=>townDiagnostics.roomNear==='exit'&&!townDiagnostics.roomTarget);await mobile.locator('#room-play').click();await mobile.waitForFunction(()=>townDiagnostics.inside===null);checks.push('Mobile touch movement, camera, interaction and exit verified');
 await page.evaluate(async()=>{const {fish,decor}=await import('./content.mjs');const s=JSON.parse(localStorage.getItem('little-harbor-save-v1'));s.tank=2;s.fish=Array.from({length:60},(_,i)=>({uid:'full-fish-'+i,id:fish[i%fish.length].id,name:'Fish '+i}));s.decor=Array.from({length:48},(_,i)=>({uid:'full-decor-'+i,id:decor[i%decor.length].id,x:8+(i%12)*7.5,y:61+Math.floor(i/12)*9}));localStorage.setItem('little-harbor-save-v1',JSON.stringify(s));});
 await page.reload();await page.waitForFunction(()=>document.querySelector('#aquarium-engine')?.contentWindow.harborDiagnostics?.fish.length===60);await page.setViewportSize({width:1440,height:1050});await page.waitForTimeout(2000);
 const full=await page.evaluate(()=>document.querySelector('#aquarium-engine').contentWindow.harborDiagnostics);assert.equal(full.decor.length,48);assert.ok(full.fish.every(f=>Number.isFinite(f.x)&&Number.isFinite(f.y)));await page.screenshot({path:'qa-output/aquarium-capacity-60.jpg',quality:80,fullPage:true});checks.push('60 fish and 48 decorations render without losing the save');
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);fs.writeFileSync('qa-output/interiors-results.json',JSON.stringify({checks,scenes:[...scenes],errors,missing},null,2));console.log('PASS',checks.length,'interior checks');
 }catch(e){await page.screenshot({path:'qa-output/interior-failure.jpg',fullPage:true}).catch(()=>{});fs.writeFileSync('qa-output/interiors-results.json',JSON.stringify({checks,errors,missing,failure:String(e),diagnostics:await page.evaluate(()=>document.querySelector('#town-engine')?.contentWindow.townDiagnostics).catch(()=>null)},null,2));throw e;}
 finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
