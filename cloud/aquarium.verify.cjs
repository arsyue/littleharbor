const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),{chromium}=require('playwright');
const root=path.resolve('public'),server=http.createServer((req,res)=>{try{const n=decodeURIComponent(req.url.split('?')[0]);if(n==='/favicon.ico'){res.writeHead(204).end();return;}const p=path.resolve(root,'.'+(n==='/'?'/index.html':n));if(!p.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',({'.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.json':'application/json','.mp3':'audio/mpeg'})[path.extname(p)]||'text/html');res.end(fs.readFileSync(p));}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(r=>server.listen(8895,'127.0.0.1',r));fs.mkdirSync('qa-output',{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']}),page=await browser.newPage({viewport:{width:1440,height:1050}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
 const {fish,decor,decorLimits}=await import('../web/content.mjs');let frame;
 async function ready(){frame=page.frames().find(f=>f.url().includes('/aquarium/'));await frame.waitForFunction(()=>window.harborDiagnostics?.renderer==='webgl-volume'&&harborDiagnostics.assets.every(x=>x.ready),{},{timeout:30000});}
 try{
 await page.goto('http://127.0.0.1:8895/');await page.waitForSelector('#aquarium-engine');await ready();
 await page.evaluate(async()=>{const {newState,SAVE_KEY}=await import('./state.mjs'),{fish,decor,decorLimits}=await import('./content.mjs');const s=newState();s.coins=10000;s.tank=2;s.fish=fish.map((f,i)=>({uid:'preview-fish-'+i,id:f.id,name:f.name}));s.decor=['treasure-chest','pebble-arch','hanging-shell','hanging-fern','glass-coral','floating-lily'].map((id,i)=>({uid:'preview-decor-'+i,id,x:[20,70,40,75,50,65][i],y:decorLimits(id).start}));localStorage.setItem(SAVE_KEY,JSON.stringify(s));});await page.reload();await ready();
 await frame.waitForFunction(()=>harborDiagnostics.volumes===22);await page.screenshot({path:'qa-output/aquarium-volume-overview.jpg',quality:88,fullPage:true});
 const sources=await frame.evaluate(()=>harborDiagnostics.assets.map(x=>x.url));
 for(const id of fish.map(x=>x.id))assert.ok(sources.some(s=>s.endsWith('/assets/fish/'+id+'.webp')));

 await page.evaluate(async()=>{
  const {AquariumScene}=await import('./aquarium/scene3d.mjs'),preview=new AquariumScene(),canvas=document.createElement('canvas');
  canvas.id='turn-review';canvas.width=1400;canvas.height=600;Object.assign(canvas.style,{position:'fixed',inset:'0',width:'100vw',height:'100vh',zIndex:99999,objectFit:'contain',background:'#0d3038'});document.body.append(canvas);
  const ctx=canvas.getContext('2d');ctx.fillStyle='#123a42';ctx.fillRect(0,0,1400,600);preview.resize(1400,600,1);
  const image=new Image();image.src='assets/fish/goldfish.webp';await image.decode();preview.begin(false);
  [0,.8,Math.PI/2].forEach((heading,i)=>preview.fish({id:'goldfish',uid:'turn-'+i,heading,vy:0,z:.5,phase:0,speed:.05},image,{x:250+i*450,y:310},340,0));
  preview.finish(ctx);ctx.fillStyle='#e6f6e7';ctx.textAlign='center';ctx.font='bold 26px system-ui';['Side view','Turning','Facing you'].forEach((s,i)=>ctx.fillText(s,250+i*450,90));
  const pixels=ctx.getImageData(1000,160,300,300).data;let visible=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]>90&&pixels[i]>pixels[i+2]*1.2)visible++;if(visible<600)throw Error('Head-on fish lost its body thickness');
  preview.renderer.dispose();
 });await page.screenshot({path:'qa-output/aquarium-fish-turns.jpg',quality:90});await page.locator('#turn-review').evaluate(el=>el.remove());
 await page.locator('[data-action="fish-shop"]').click();await page.locator('.item-card').first().waitFor();
 const shop=await page.locator('.item-art img').evaluateAll(es=>es.map(e=>e.src));assert.ok(shop.every(url=>sources.includes(url)),'shop and tank load identical fish artwork');
 await page.locator('[data-shop="decor"]').click();assert.equal(await page.locator('.item-card').count(),20);await page.screenshot({path:'qa-output/aquarium-new-decor-shop.jpg',quality:84,fullPage:true});await page.locator('.modal-close').click();
 await page.locator('[data-action="decorate"]').click();
 for(const id of ['hanging-shell','hanging-fern','glass-coral','floating-lily']){
  const d=await frame.evaluate(id=>harborDiagnostics.decor.find(x=>x.id===id),id),b=await frame.locator('canvas').boundingBox();
  await page.mouse.move(b.x+d.sx,b.y+d.sy);await page.mouse.down();await page.mouse.move(b.x+d.sx+40,b.y+d.sy+25,{steps:8});await page.mouse.up();
  await page.waitForTimeout(100);const saved=await page.evaluate(id=>JSON.parse(localStorage.getItem('little-harbor-save-v1')).decor.find(x=>x.id===id),id);
  assert.ok(Math.abs(saved.x-[40,75,50,65][['hanging-shell','hanging-fern','glass-coral','floating-lily'].indexOf(id)])>1,id+' can be dragged');
  const limits=decorLimits(id);assert.ok(saved.y>=limits.min&&saved.y<=limits.max);
 }
 await page.locator('[data-action="decorate"]').click();const saved=await page.evaluate(()=>localStorage.getItem('little-harbor-save-v1'));await page.reload();await ready();assert.equal(await page.evaluate(()=>localStorage.getItem('little-harbor-save-v1')),saved);
 await page.locator('[data-action="feed"]').click();await frame.waitForFunction(()=>harborDiagnostics.food>0);
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:'qa-output/aquarium-volume-mobile.jpg',quality:86,fullPage:true});
 await page.locator('[data-nav="town"]').first().click();await page.setViewportSize({width:720,height:900});await page.locator('[data-nav="home"]').first().click();await ready();
 assert.deepEqual(errors,[]);fs.writeFileSync('qa-output/aquarium-volume-results.json',JSON.stringify({success:true,fish:16,decorations:20,matchingShopArtwork:true,volumetricFish:true,mounts:['floor','hanging','wall','surface'],dragging:true,saves:true,errors},null,2));
 }catch(e){await page.screenshot({path:'qa-output/aquarium-volume-failure.jpg',fullPage:true}).catch(()=>{});fs.writeFileSync('qa-output/aquarium-volume-results.json',JSON.stringify({success:false,error:String(e),errors,diagnostics:await frame?.evaluate(()=>window.harborDiagnostics).catch(()=>null)},null,2));throw e;}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});
