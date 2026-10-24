const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),{chromium}=require('playwright');
const root=path.resolve('public'),server=http.createServer((req,res)=>{try{const n=decodeURIComponent(req.url.split('?')[0]);if(n==='/favicon.ico'){res.writeHead(204).end();return;}const p=path.resolve(root,'.'+(n==='/'?'/index.html':n));if(!p.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',({'.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.json':'application/json','.mp3':'audio/mpeg'})[path.extname(p)]||'text/html');res.end(fs.readFileSync(p));}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(r=>server.listen(8890,'127.0.0.1',r));fs.mkdirSync('qa-output',{recursive:true});
 const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:1100}});
 await page.addInitScript(()=>{const Native=window.Audio;window.__workAudio=[];window.Audio=function(src){const a=new Native(src);window.__workAudio.push(a);return a;};window.Audio.prototype=Native.prototype;class Fake{start(){window.__workRecognition=this;this.onstart?.();}abort(){}stop(){this.onend?.();}}window.SpeechRecognition=Fake;});
 const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 const {houses}=await import('../web/places.mjs'),{workPlan}=await import('../web/work-data.mjs');
 let f;
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('little-harbor-save-v1')));
 async function town(){await page.locator('[data-nav="town"]').first().click();await page.waitForFunction(()=>document.querySelector('#town-engine')?.contentWindow.townDiagnostics?.art.expansion?.loaded===4);f=page.frames().find(x=>x.url().includes('/town/'));}
 async function enter(id,teleport=true){
  if(teleport){const e=await f.evaluate(id=>townDiagnostics.houses.find(x=>x.id===id),id);await page.evaluate(e=>document.querySelector('#town-engine').contentWindow.postMessage({littleHarborTown:true,type:'state',position:{x:e.x,y:e.y+50}},location.origin),e);}
  await f.locator('#destination').selectOption(id);await f.waitForFunction(id=>townDiagnostics.inside===id&&townDiagnostics.roomImage.ready&&townDiagnostics.propsReady,id,{timeout:60000});
 }
 async function near(id){if(await f.evaluate(id=>townDiagnostics.roomNear===id&&!townDiagnostics.roomTarget,id))return;const d=await f.evaluate(id=>({s:townDiagnostics.roomSpots.find(s=>s.id===id),v:townDiagnostics.roomView,w:innerWidth,h:innerHeight}),id);await f.locator('#world').click({position:{x:(d.s.x-d.v.cx)*d.v.scale+d.w/2,y:(d.s.y-d.v.cy)*d.v.scale+d.h/2}});await f.waitForFunction(id=>townDiagnostics.roomNear===id&&!townDiagnostics.roomTarget,id,{timeout:15000});}
 async function press(){await f.waitForFunction(()=>!townDiagnostics.paused);await f.locator('#world').focus();await page.keyboard.press('e');}
 async function leave(){await f.locator('#room-exit').click();await f.waitForFunction(()=>townDiagnostics.roomNear==='exit'&&!townDiagnostics.roomTarget,{timeout:15000});await press();}
 async function openWork(id){await enter(id);await near('work');await press();await page.locator('#work-body').waitFor();}
 try{
 await page.goto('http://127.0.0.1:8890/');await page.evaluate(()=>localStorage.clear());await page.reload();await town();
 assert.deepEqual(await f.evaluate(()=>townDiagnostics.world),{width:5400,height:2400});
 await enter('house-bistro',false);checks.push('Walked from the original town to the new east-coast bistro');await page.screenshot({path:'qa-output/eastbank-bistro.jpg',quality:84,fullPage:true});await leave();await f.waitForFunction(()=>!townDiagnostics.inside);
 const balconyImages=new Set();
 for(const h of houses){
  await enter(h.id);await near('balcony');await press();await f.waitForFunction(()=>townDiagnostics.roomFloor===2&&townDiagnostics.roomImage.ready&&townDiagnostics.propsReady);
  balconyImages.add(await f.evaluate(()=>townDiagnostics.roomImage.url));assert.equal(await f.evaluate(()=>townDiagnostics.blocked),false);
  const before=await f.evaluate(()=>townDiagnostics.roomPlayer.x);await page.keyboard.down('ArrowRight');try{await f.waitForFunction(x=>townDiagnostics.roomPlayer.x>x+55,before,{timeout:5000});}finally{await page.keyboard.up('ArrowRight');}
  if(['house-library','house-bistro','house-pottery','house-lighthouse'].includes(h.id))await page.screenshot({path:'qa-output/balcony-'+h.id+'.jpg',quality:82,fullPage:true});
  await leave();await f.waitForFunction(()=>townDiagnostics.roomFloor===0);assert.equal(await f.evaluate(()=>townDiagnostics.inside),h.id);await leave();await f.waitForFunction(()=>!townDiagnostics.inside);
 }
 assert.equal(balconyImages.size,4);checks.push('All 16 balconies are walkable and return to their own room; four different environments');
 await enter('house-inn');await near('stairs');await press();await f.waitForFunction(()=>townDiagnostics.roomFloor===1&&townDiagnostics.roomImage.ready);await near('balcony');await press();await f.waitForFunction(()=>townDiagnostics.roomFloor===2&&townDiagnostics.roomImage.ready);await leave();await f.waitForFunction(()=>townDiagnostics.roomFloor===1);await page.screenshot({path:'qa-output/inn-guest-lounge.jpg',quality:84,fullPage:true});await leave();await f.waitForFunction(()=>townDiagnostics.roomFloor===0);await leave();await f.waitForFunction(()=>!townDiagnostics.inside);checks.push('Inn stairs, upstairs balcony and correct return floor work');
 const workRooms={bakery:'house-bakery',restaurant:'house-bistro',pottery:'house-pottery',museum:'house-museum'};
 for(const [kind,id]of Object.entries(workRooms)){
  await openWork(id);const initial=(await read()).coins,plan=workPlan(kind,0);
  for(let i=0;i<plan.length;i++){
   const s=plan[i];await page.waitForFunction(i=>document.querySelector('#work-body')?.dataset.step===String(i),i);
   if(i===0){await page.locator('#work-listen').click();await page.waitForFunction(key=>window.__workAudio.some(a=>a.src.includes('/'+key+'-')&&!a.paused&&a.currentTime>.01),'work-'+s.id,{timeout:15000});}
   if(s.type==='speak'){
    assert.equal(await page.locator('#work-mic').count(),1,'voice input is the default');
    if(kind==='bakery'&&i===0){
     await page.locator('#work-mic').click();await page.evaluate(text=>{const r=window.__workRecognition,result=[{transcript:text}];result.isFinal=true;r.onresult({results:[result]});},s.hint);
    }else{await page.locator('#work-mode').click();await page.locator('#work-answer').fill(s.hint);await page.locator('#work-answer-form button').click();}
   }else if(s.type==='measure'){
    await page.locator('#work-check').click();assert.equal((await read()).coins,initial);assert.equal((await read()).workplace.active[kind].step,i);
    for(const [k,n]of Object.entries(s.fields))for(let j=0;j<n;j++)await page.locator('[data-adjust="'+k+'"][data-delta="1"]').click();
    await page.locator('#work-check').click();
   }else if(['settings','tray'].includes(s.type)){
    for(const [k,v]of Object.entries(s.fields))await page.locator('[data-field="'+k+'"]').selectOption(String(v));await page.locator('#work-check').click();
   }else if(['stir','knead'].includes(s.type)){
    for(let j=0;j<s.target;j++)await page.locator('#work-motion').click();await page.locator('#work-check').click();
   }else if(s.type==='bake'){await page.locator('#work-oven-action').click();await page.waitForFunction(()=>document.querySelector('#work-oven-action')?.textContent==='Take out the bread',{},{timeout:6000});await page.locator('#work-oven-action').click();}
   else if(s.type==='choose'){await page.locator('[data-work-choice]').evaluateAll((els,a)=>els.find(e=>e.dataset.workChoice===a).click(),s.answer);}
   else if(s.type==='number'){await page.locator('#work-number').fill(String(s.answer));await page.locator('#work-number-form button').click();}
   else if(s.type==='sequence'){for(const v of s.answer)await page.locator('[data-sequence]').evaluateAll((els,a)=>els.find(e=>e.dataset.sequence===a).click(),v);await page.locator('#work-check').click();}
   if(i===1){
    await page.screenshot({path:'qa-output/work-'+kind+'.jpg',quality:85,fullPage:true});
    await page.locator('.modal-close').click();await f.waitForFunction(()=>!townDiagnostics.paused);await near('work');await press();await page.waitForFunction(i=>document.querySelector('#work-body')?.dataset.step===String(i),i+1);checks.push(kind+' resumes after closing');
   }
  }
  await page.waitForFunction(()=>document.querySelector('#work-body')?.dataset.stage==='complete');
  const reward={bakery:90,restaurant:120,pottery:75,museum:70}[kind];assert.equal((await read()).coins,initial+reward);
  await page.locator('#work-return').click();await near('work');await press();await page.waitForFunction(()=>document.querySelector('#work-body')?.dataset.stage==='complete');assert.equal((await read()).coins,initial+reward);
  await page.locator('#work-again').click();assert.equal((await read()).workplace.active[kind].step,0);
  await page.locator('.modal-close').click();await leave();await f.waitForFunction(()=>!townDiagnostics.inside);checks.push(kind+' completes, pays once and offers the next shift');
 }
 const saved=await read();await page.reload();assert.equal((await read()).coins,saved.coins);assert.deepEqual((await read()).workplace,saved.workplace);await town();
 await enter('house-bakery');await near('work');await press();await page.locator('#work-body').waitFor();await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:'qa-output/work-mobile.jpg',quality:84,fullPage:true});await page.locator('#work-mode').click();await page.locator('#work-answer').fill(workPlan('bakery',1)[0].hint);await page.locator('#work-answer-form button').click();await page.waitForFunction(()=>document.querySelector('#work-body')?.dataset.stage==='measure');await page.screenshot({path:'qa-output/work-mobile-ingredients.jpg',quality:84,fullPage:true});checks.push('Mobile voice/text switch, ingredients and saved shifts verified');
 assert.deepEqual(errors,[]);fs.writeFileSync('qa-output/expansion-results.json',JSON.stringify({success:true,checks,balconies:16,workplaces:4,errors},null,2));console.log('PASS',checks.length,'eastbank and work-game checks');
 }catch(e){await page.screenshot({path:'qa-output/expansion-failure.jpg',fullPage:true}).catch(()=>{});fs.writeFileSync('qa-output/expansion-results.json',JSON.stringify({success:false,checks,error:String(e),errors,diagnostics:await page.evaluate(()=>document.querySelector('#town-engine')?.contentWindow.townDiagnostics).catch(()=>null)},null,2));throw e;}
 finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
