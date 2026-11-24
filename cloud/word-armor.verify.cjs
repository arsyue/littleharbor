const { chromium } = require("playwright");
const assert=require("node:assert/strict");
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  let base=process.env.ARMOR_URL||"http://127.0.0.1:8997/";
  if(process.env.ARMOR_PREVIEW){
   const root=new URL(process.env.ARMOR_PREVIEW);
   for(const [file,marker] of [["index.html","河谷前线"],["engine.js","DEFAULT_HP = 10"],["network.js","ArmorNetwork"],["app.js","30 秒到时只换词"],["peer.min.js","window.Peer"]]){
    const response=await fetch(new URL(file,root),{signal:AbortSignal.timeout(25000)});
    assert.equal(response.status,200,file);assert.ok((await response.text()).includes(marker),file);
   }
   console.log("Public HTTPS version and its game, network and rules assets verified:",root.href);
   base=root.href;
  }
  const ctxA=await browser.newContext(), ctxB=await browser.newContext();
  let a=await ctxA.newPage(),b=await ctxB.newPage();
  for(const p of [a,b]){p.on("pageerror",e=>console.error("Browser error",e.message));p.on("console",m=>{if(m.type()==="error")console.log("Browser console",m.text())});p.on("requestfailed",r=>console.log("Failed resource",new URL(r.url()).hostname,r.failure()?.errorText))}
  async function openGame(p){
   await p.goto(base);
   const entry=p.locator("#rooms"), confirm=p.getByText("Open the page",{exact:true});
   await Promise.race([entry.waitFor({timeout:19000}),confirm.waitFor({timeout:19000})]);
   if(await confirm.isVisible()){
    const pop=p.waitForEvent("popup",{timeout:3500}).catch(()=>null);
    await confirm.click();p=(await pop)||p;
   }
   await p.locator("#rooms").waitFor({timeout:25000});return p;
  }
  [a,b]=await Promise.all([openGame(a),openGame(b)]);
  console.log("Two independent browsers reached the game through its normal public entry:",await a.url());
  await a.locator("#rooms").click();await a.locator("#rsize").selectOption("1");
  await a.locator("#createRoom").click();await a.locator(".roomCode").waitFor({timeout:25000});
  const code=(await a.locator(".roomCode").innerText()).trim();
  await b.locator("#rooms").click();await b.locator("#rc").fill(code);await b.locator("#joinRoom").click();
  await b.locator(".roomCode").waitFor({timeout:33000});
  await a.locator("#startRoom:enabled").waitFor({timeout:7000});await a.locator("#startRoom").click();
  await Promise.all([a,b].map(p=>p.waitForFunction(()=>!document.querySelector("#dialog").open)));
  const selector='.unit[data-t="B1"]';const clue=p=>p.locator(selector+" .zh").innerText();
  const hp=p=>p.locator(selector+" .hpValue").innerText();
  const old=await clue(a);assert.equal(await hp(a),"10/10");assert.equal(await hp(b),"10/10");
  await a.waitForFunction(({selector,old})=>document.querySelector(selector+" .zh").textContent!==old,{selector,old},{timeout:38000});
  await b.waitForFunction(({selector,old})=>document.querySelector(selector+" .zh").textContent!==old,{selector,old},{timeout:6500});
  assert.equal(await hp(a),"10/10");assert.equal(await hp(b),"10/10");
  assert.equal(await a.locator("#hits").innerText(),"0");console.log("Two independent browser clients: 30-second rotation, zero damage and zero shots.");
  const next=await clue(a);const dictionary={"森林":"forest","岛屿":"island","海洋":"ocean","花朵":"flower","山谷":"valley","叶子":"leaf","高山":"mountain","彩虹":"rainbow","沙漠":"desert","草地":"meadow","雷声":"thunder","微风":"breeze","影子":"shadow","阳光":"sunlight"};
  assert.ok(dictionary[next],next);
  await a.locator("#answer").fill("incorrect");await a.locator("#fire").click();
  await a.waitForFunction(()=>document.querySelector("#fieldMsg").textContent.includes("拼写有误"));
  assert.equal(await hp(b),"10/10");
  await a.locator("#answer").fill(dictionary[next]);await a.locator("#fire").click();
  await b.waitForFunction(()=>document.querySelector('[data-t="B1"] .hpValue').textContent==="9/10",{},{timeout:10000});
  assert.equal(await hp(a),"9/10"); console.log("Correct spelling alone dealt 1 HP, reflected on the other client.");
  await a.locator("#rooms").click();await a.locator("#exitRoom").click();await a.locator("#yesLeave").click();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
