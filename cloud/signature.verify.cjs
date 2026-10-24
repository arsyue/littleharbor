const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),{chromium}=require('playwright');
const root=path.resolve('public'),server=http.createServer((req,res)=>{try{const n=decodeURIComponent(req.url.split('?')[0]);if(n==='/favicon.ico'){res.writeHead(204).end();return;}const p=path.resolve(root,'.'+(n==='/'?'/index.html':n));if(!p.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',({'.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.json':'application/json','.mp3':'audio/mpeg'})[path.extname(p)]||'text/html');res.end(fs.readFileSync(p));}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(r=>server.listen(8891,'127.0.0.1',r));fs.mkdirSync('qa-output',{recursive:true});
 const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[],checks=[];let f,activeKind=null,activeStep=null;
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 const {signatureKinds}=await import('../web/signature-data.mjs'),{workPlan,workReward}=await import('../web/work-data.mjs'),{gameCatalog}=await import('../web/activity-catalog.mjs');
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('little-harbor-save-v1')));
 async function press(){await f.waitForFunction(()=>!townDiagnostics.paused);await f.locator('#world').focus();await page.keyboard.press('e');}
 async function enter(kind){
  const id='house-'+Object.keys(gameCatalog).find(k=>gameCatalog[k].kind===kind),e=await f.evaluate(id=>townDiagnostics.houses.find(x=>x.id===id),id);
  await page.evaluate(e=>document.querySelector('#town-engine').contentWindow.postMessage({littleHarborTown:true,type:'state',position:{x:e.x,y:e.y+50}},location.origin),e);
  await f.locator('#destination').selectOption(id);await f.waitForFunction(id=>townDiagnostics.inside===id&&townDiagnostics.roomImage.ready&&townDiagnostics.propsReady,id,{timeout:60000});
  const d=await f.evaluate(()=>({s:townDiagnostics.roomSpots.find(s=>s.id==='work'),v:townDiagnostics.roomView,w:innerWidth,h:innerHeight}));
  await f.locator('#world').click({position:{x:(d.s.x-d.v.cx)*d.v.scale+d.w/2,y:(d.s.y-d.v.cy)*d.v.scale+d.h/2}});
  await f.waitForFunction(()=>townDiagnostics.roomNear==='work'&&!townDiagnostics.roomTarget);await press();await page.locator('#work-body').waitFor();
 }
 async function leave(){await f.waitForFunction(()=>!townDiagnostics.paused);await f.locator('#room-exit').click();await f.waitForFunction(()=>townDiagnostics.roomNear==='exit'&&!townDiagnostics.roomTarget);await press();await f.waitForFunction(()=>!townDiagnostics.inside);}
 async function solve(s){
  if(s.type==='speak'){assert.equal(await page.locator('#work-mic').count(),1);await page.locator('#work-mode').click();await page.locator('#work-answer').fill(s.hint);await page.locator('#work-answer-form button').click();}
  else if(s.type==='sort'){for(const [i,[k,v]]of Object.entries(s.fields).entries())await page.locator('[data-sort="'+i+'"]').selectOption(v);await page.locator('#work-check').click();}
  else if(s.type==='dials'){for(const [i,[k,v]]of Object.entries(s.fields).entries())await page.locator('[data-dial="'+i+'"]').evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));},v);await page.locator('#work-check').click();}
  else if(s.type==='paint'){for(const [k,v]of Object.entries(s.fields)){await page.locator('[data-paint-tool="'+v+'"]').click();await page.locator('[data-paint-cell="'+k+'"]').click();}await page.locator('#work-check').click();}
  else if(s.type==='basket'){for(const [k,v]of Object.entries(s.fields)){const i=s.catalog.findIndex(x=>x[0]===k);for(let n=0;n<v;n++)await page.locator('[data-basket="'+i+'"][data-delta="1"]').click();}await page.locator('#work-check').click();}
  else if(s.type==='route'){
   await page.locator('[data-direction="East"]').click();assert.equal((await read()).workplace.active[activeKind].draft.moves.length,0,'rocks block the boat');
   for(const m of s.answer)await page.locator('[data-direction="'+m+'"]').click();await page.locator('#work-check').click();
  }else if(s.type==='pattern'){
   await page.locator('#pattern-listen').click();await page.waitForFunction(()=>!document.querySelector('#pattern-listen')?.disabled,{},{timeout:6000});
   for(const note of s.answer)await page.locator('[data-pad="'+note+'"]').click();await page.locator('#work-check').click();
  }else if(s.type==='number'){await page.locator('#work-number').fill(String(s.answer));await page.locator('#work-number-form button').click();}
  else if(s.type==='choose'){await page.locator('[data-work-choice]').evaluateAll((els,v)=>els.find(e=>e.dataset.workChoice===v).click(),s.answer);}
  else if(s.type==='sequence'){for(const v of s.answer)await page.locator('[data-sequence]').evaluateAll((els,a)=>els.find(e=>e.dataset.sequence===a).click(),v);await page.locator('#work-check').click();}
  else throw Error('Unhandled signature mechanic: '+s.type);
 }
 try{
  await page.goto('http://127.0.0.1:8891/');await page.evaluate(()=>localStorage.clear());await page.reload();await page.locator('[data-nav="town"]').first().click();await page.waitForFunction(()=>document.querySelector('#town-engine')?.contentWindow.townDiagnostics?.art.expansion?.loaded===4);f=page.frames().find(x=>x.url().includes('/town/'));
  await page.locator('[data-action="quests"]').click();assert.equal(await page.locator('[data-place-game]').count(),16);await page.locator('.modal-close').click();
  assert.equal(Object.keys(gameCatalog).length,16);assert.equal(new Set(Object.values(gameCatalog).map(g=>g.name)).size,16);assert.deepEqual([...new Set(Object.values(gameCatalog).map(g=>g.level))].sort(),[1,2,3]);
  for(const kind of signatureKinds){
   activeKind=kind;console.log('SIGNATURE',kind);await enter(kind);const initial=(await read()).coins,plan=workPlan(kind,0);
   for(const [i,s]of plan.entries()){
    activeStep=i;await page.waitForFunction(i=>document.querySelector('#work-body')?.dataset.step===String(i),i);
    if(i===1){
     await page.screenshot({path:'qa-output/signature-'+kind+'.jpg',quality:84,fullPage:true});
     await page.locator('#work-check').click();assert.equal((await read()).workplace.active[kind].step,i,'empty game board must not pass');assert.equal((await read()).coins,initial);
    }
    await solve(s);
    if(i===1){await page.locator('.modal-close').click();await press();await page.waitForFunction(i=>document.querySelector('#work-body')?.dataset.step===String(i),i+1);}
   }
   await page.waitForFunction(()=>document.querySelector('#work-body')?.dataset.stage==='complete');assert.equal((await read()).coins,initial+workReward(kind));
   await page.locator('#work-return').click();await press();await page.waitForFunction(()=>document.querySelector('#work-body')?.dataset.stage==='complete');assert.equal((await read()).coins,initial+workReward(kind));
   await page.locator('.modal-close').click();await leave();checks.push(kind+': all five stages, saved progress and a single reward');
  }
  const saved=await read();await page.reload();assert.deepEqual((await read()).workplace,saved.workplace);assert.equal((await read()).coins,saved.coins);
  await page.locator('[data-nav="town"]').first().click();await page.waitForFunction(()=>document.querySelector('#town-engine')?.contentWindow.townDiagnostics?.art.expansion?.loaded===4);f=page.frames().find(x=>x.url().includes('/town/'));
  for(const kind of ['studio','market','music','inn']){
   activeKind=kind;await page.setViewportSize({width:1440,height:1100});await enter(kind);await page.locator('#work-again').click();await solve(workPlan(kind,0)[0]);await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no horizontal mobile overflow');
   await page.screenshot({path:'qa-output/signature-mobile-'+kind+'.jpg',quality:84,fullPage:true});await solve(workPlan(kind,0)[1]);await page.locator('.modal-close').click();await page.setViewportSize({width:1440,height:1100});await leave();checks.push(kind+': mobile controls work');
  }
  assert.deepEqual(errors,[]);fs.writeFileSync('qa-output/signature-results.json',JSON.stringify({success:true,places:16,signatureGames:16,checks,errors},null,2));console.log('PASS',checks.length,'signature game browser checks');
 }catch(e){await page.screenshot({path:'qa-output/signature-failure.jpg',fullPage:true}).catch(()=>{});fs.writeFileSync('qa-output/signature-results.json',JSON.stringify({success:false,error:String(e),activeKind,activeStep,checks,errors,save:await read().catch(()=>null),diagnostics:await page.evaluate(()=>document.querySelector('#town-engine')?.contentWindow.townDiagnostics).catch(()=>null)},null,2));throw e;}
 finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
