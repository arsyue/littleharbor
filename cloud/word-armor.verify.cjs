const { chromium } = require("playwright");
const assert=require("node:assert/strict");
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const base=process.env.ARMOR_URL||"http://127.0.0.1:8997/";
  const ctxA=await browser.newContext(), ctxB=await browser.newContext();
  const a=await ctxA.newPage(),b=await ctxB.newPage();
  for(const p of [a,b])p.on("pageerror",e=>{console.error("Browser",e.message)});
  await Promise.all([a.goto(base),b.goto(base)]);
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
