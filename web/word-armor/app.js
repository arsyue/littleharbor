const $=s=>document.querySelector(s),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const icons={book:'<path d="M3 4q5-2 9 1 4-3 9-1v14q-5-2-9 1-4-3-9-1zM12 5v14"/>',people:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0112 0v2M16 5a3 3 0 010 6m1 3a5 5 0 014 5"/>',volume:'<path d="M3 9h4l5-5v16l-5-5H3zM16 8q4 4 0 8m3-11q7 7 0 14"/>',mute:'<path d="M3 9h4l5-5v16l-5-5H3zM16 9l6 6m0-6-6 6"/>',layers:'<path d="m3 7 9-4 9 4-9 4zM3 12l9 4 9-4M3 17l9 4 9-4"/>',crest:'<path d="m4 3 8 2 8-2v10l-8 8-8-8z"/><path d="m7 10 5-3 5 3m-10 4 5-3 5 3"/>',clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 6v6l4 2"/>',play:'<path d="m7 4 12 8-12 8z"/>',pause:'<path d="M8 5v14M16 5v14" stroke-width="3"/>',aim:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v5m0 12v5M1 12h5m12 0h5"/>',keyboard:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.2m3.8 0h.2m3.8 0h.2m3.8 0h.2M6 12h.2m3.8 0h.2m3.8 0h.2m3.8 0h.2M8 15h8"/>',list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h1m-1 6h1m-1 6h1"/>'};
const ic=n=>'<svg aria-hidden="true" viewBox="0 0 24 24">'+icons[n]+'</svg>';
document.querySelectorAll("[data-i]").forEach(x=>x.innerHTML=ic(x.dataset.i));
const logo=$("#brandTank").getContext("2d");const logoRects=[[2,18,35,7],[6,25,26,2],[5,14,29,5],[11,9,15,6],[15,6,8,3],[23,10,16,3],[37,9,4,5]];logo.fillStyle="#f1cd6a";logoRects.forEach(a=>logo.fillRect(...a));logo.fillStyle="#34392a";[7,13,19,25,31].forEach(x=>logo.fillRect(x,20,3,3));logo.fillRect(16,10,6,2);
const settings=(()=>{try{return JSON.parse(localStorage.getItem("armor-settings-v1")||"{}")}catch{return {}}})();
let size=[1,2,3].includes(settings.size)?settings.size:3,specs=settings.specs||[{id:"valley"},{id:"valley"}],muted=settings.muted!==false;
try{specs.forEach(deck)}catch{specs=[{id:"valley"},{id:"valley"}]}
let maxHP=HP_TIERS.includes(settings.maxHP)?settings.maxHP:DEFAULT_HP, computerFire=settings.computerFire===true;
const tierLabel=n=>({5:"快速",10:"标准",20:"持久"})[n];
const hpOptions=n=>HP_TIERS.map(v=>'<option value="'+v+'" '+(v===n?"selected":"")+'>'+tierLabel(v)+' · '+v+' 点</option>').join("");
function savePrefs(){try{localStorage.setItem("armor-settings-v1",JSON.stringify({size,specs,muted,maxHP,computerFire,name:settings.name||""}))}catch{}}
let audioCtx;
function tone(ok=true){if(muted)return;try{audioCtx??=new (window.AudioContext||window.webkitAudioContext)();audioCtx.resume();const o=audioCtx.createOscillator(),v=audioCtx.createGain(),n=audioCtx.currentTime;o.type=ok?"triangle":"sine";o.frequency.setValueAtTime(ok?360:170,n);o.frequency.exponentialRampToValueAtTime(ok?64:120,n+.14);v.gain.setValueAtTime(.1,n);v.gain.exponentialRampToValueAtTime(.001,n+.18);o.connect(v);v.connect(audioCtx.destination);o.start(n);o.stop(n+.2)}catch{}}
function soundUI(){const b=$("#sound");b.innerHTML=ic(muted?"mute":"volume");b.title=b.ariaLabel=muted?"开启音效":"关闭音效";b.setAttribute("aria-pressed",String(!muted))}
$("#sound").onclick=()=>{muted=!muted;soundUI();savePrefs();tone()};soundUI();
let local,view,phase="ready",localTime=0,anchor=0,bots={},room=null,key="",me="A1",selected="B1",lastSeq=0,offset=0,modal="",resume=false,pending=false,lastUnits="",lastStamp="",endShown=false,onlineBusy=false,polling=false;
const names=["苍蓝营","赤焰营"], now=()=>room?Date.now()+offset:localTime+(phase==="battle"?performance.now()-anchor:0);
const timeFmt=t=>{const n=Math.floor(Math.max(0,t)/1000);return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0")};
let flashTimer,toastTimer;
function toast(s){const x=$("#toast");x.textContent=s;x.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>x.classList.remove("show"),2500)}
function notice(s){$("#fieldMsg").textContent=s}
function reset(){
 room=null;key="";me="A1";selected="B1";phase="battle";localTime=0;anchor=performance.now();local=createGame(size,specs,0,maxHP);bots={};
 local.tanks.forEach(t=>bots[t.id]=9000+Math.random()*13000);view=visibleGame(local);lastSeq=0;lastUnits="";lastStamp="";endShown=false;$("#answer").value="";notice("拼对扣 1 血 · 倒计时结束只换词");render();
}
function run(){if(room||!["ready","paused"].includes(phase))return;anchor=performance.now();phase="battle";notice("点选敌方坦克，或直接拼写任一敌词");render()}
function pauseLocal(){if(room||phase!=="battle")return;localTime=now();phase="paused";notice("训练已暂停");render()}
function findMe(){return view?.tanks.find(t=>t.id===me)}
function enemies(){const t=findMe();return t?view.tanks.filter(b=>b.team!==t.team):[]}
function changeTarget(id,focus=true){if(!enemies().some(t=>t.id===id&&t.hp))return;selected=id;$("#answer").value="";render();if(focus&&matchMedia("(pointer:fine)").matches)$("#answer").focus()}
function localStep(){
 if(room||phase!=="battle")return;
 const n=now();let changed=tick(local,n);
 for(const t of local.tanks){if(!computerFire||t.id===me||!t.hp||n<bots[t.id]||local.winner!==null)continue;
  const targets=local.tanks.filter(x=>x.team!==t.team&&x.hp);const target=targets[Math.floor(Math.random()*targets.length)];
  if(target&&Math.random()<.74){hit(local,t.id,target.id,local.decks[target.team].words[target.index].en,target.turn,n);changed=true}
  bots[t.id]=n+11500+Math.random()*14000;
 }
 if(changed){view=visibleGame(local);render()}
}
function processHits(){
 for(const e of view.events.filter(e=>e.id>lastSeq)){if(now()-e.at<2500){MapArt.shoot(e.from,e.to);tone();notice(e.from+" 命中 "+e.to+(e.down?" · 坦克已击毁":" · 扣 "+(e.damage??view.damage)+" 点血"))}}
 lastSeq=view.seq;
}
const hp=t=>'<span class="hpTrack"><i style="width:'+Math.min(100,100*t.hp/view.maxHP)+'%"></i></span><span class="hpValue">'+t.hp+'/'+view.maxHP+'</span>';
function render(){
 if(!view)return;processHits();let player=findMe();
 if(!room&&player&&!player.hp&&view.winner===null){const next=view.tanks.find(t=>!t.team&&t.hp);if(next){me=next.id;player=next;notice("已接管队友坦克 "+me)}}
 let target=enemies().find(t=>t.id===selected&&t.hp);if(!target){target=enemies().find(t=>t.hp);selected=target?.id||""}
 $("#kind").textContent=room?"联机对战 · "+room.code:(computerFire?"人机对抗":"自由练习");
 $("#rooms").innerHTML=ic("people")+(room?"房间 "+room.code:"联机房间");
 document.querySelectorAll("[data-n]").forEach(b=>{b.classList.toggle("on",+b.dataset.n===view.size);b.disabled=!!room;b.setAttribute("aria-pressed",String(+b.dataset.n===view.size))});
 for(const [i,k] of ["left","right"].entries()){$("#"+k+"Deck").textContent=view.deckNames[i];$("#"+k+"Alive").textContent=view.tanks.filter(t=>t.team===i&&t.hp).length+" / "+view.size}
 $("#ruleHP").textContent=view.maxHP+" HP";$("#rules").disabled=!!room&&(room.phase!=="lobby"||!room.host);
 const narrow=$("#stage").clientWidth<640;
 const signature=[narrow,view.maxHP,me,selected,...view.tanks.map(t=>[t.id,t.hp,t.turn,t.zh])].join("|");
 if(signature!==lastUnits){
  lastUnits=signature;$("#units").innerHTML=view.tanks.map(t=>{
   const [x,y]=MapArt.pos(t,view.size),enemy=player?.team!==t.team,who=room?.players.find(p=>p.id===t.id)?.name;
   return '<button type="button" data-t="'+t.id+'" class="unit '+(t.team?"orangeUnit":"")+(t.hp?"":" dead")+(t.id===selected?" selected":"")+'" '+(!enemy||!t.hp?"disabled":"")+' style="left:'+x*100+'%;top:'+y*100+'%" aria-label="'+esc([enemy?"敌方":"己方",t.id,who,t.zh,t.initial,t.hp+"点生命"].filter(Boolean).join(" "))+'"><span class="clue"><span class="zh">'+esc(t.zh)+'</span><span class="letter">'+esc(t.initial)+'</span></span><span class="unitFoot"><b>'+t.id+'</b>'+(t.id===me?'<em>我</em>':who?'<em class="unitName">'+esc(who)+'</em>':'')+'<span class="hp">'+hp(t)+'</span></span></button>'
  }).join("");
 }
 $("#targetID").textContent=target?.id||"—";$("#targetZh").textContent=target?.zh||"无目标";$("#targetLetter").textContent=target?.initial||"—";
 const stamp=target?target.id+"."+target.turn:"";if(lastStamp&&lastStamp!==stamp)$("#answer").value="";lastStamp=stamp;
 const can=!!player?.hp&&view.winner===null&&phase!=="paused"&&phase!=="lobby";
 $("#answer").disabled=!can;$("#fire").disabled=!can||pending;
 $("#hits").textContent=player?.hits||0;const tries=(player?.hits||0)+(player?.misses||0);$("#accuracy").textContent=tries?Math.round(player.hits*100/tries)+"%":"—";
 $("#status").textContent=view.winner!==null?"战斗结束":({ready:"待命",battle:player?.hp?(!room&&!computerFire?"练习中":"交战中"):"观战中",paused:"已暂停",lobby:"集结中",end:"战斗结束"})[phase];
 $("#pause").hidden=!!room;$("#pause").style.display=room?"none":"";$("#pause").innerHTML=ic(phase==="battle"?"pause":"play");$("#pause").title=$("#pause").ariaLabel=phase==="battle"?"暂停训练":view.winner!==null?"重新训练":"开始训练";
 $("#decks").disabled=!!room&&room.phase!=="lobby";
 if(view.winner!==null&&!endShown){endShown=true;if(!room){localTime=view.ended;phase="end"}showResult()}
 updateTime();MapArt.draw(view,selected,me,performance.now());
}
function updateTime(){
 if(!view)return;$("#clock").textContent=timeFmt((view.winner!==null?view.ended:now())-view.started);
 const target=view.tanks.find(t=>t.id===selected&&t.hp);const timer=$("#wordTime");if(timer)timer.textContent=target&&view.winner===null?Math.max(0,Math.ceil((target.expires-now())/1000))+"s":"";
}
$("#targetID").insertAdjacentHTML("afterend",'<span id="wordTime" style="font:12px var(--mono);color:#adb59f;letter-spacing:0"></span>');
$("#units").onclick=e=>{const b=e.target.closest("[data-t]");if(b)changeTarget(b.dataset.t)};
$("#answer").addEventListener("input",()=>{if(!room&&phase==="ready")run()});
$("#pause").onclick=()=>{if(view.winner!==null){reset();return}phase==="battle"?pauseLocal():run()};
async function fire(e){
 e.preventDefault();const word=$("#answer").value.trim();if(!word){$("#answer").focus();return}
 if(pending||!findMe()?.hp||view.winner!==null||phase==="paused")return;
 if(!room&&phase==="ready")run();
 const t=view.tanks.find(t=>t.id===selected);if(!t)return;
 pending=true;$("#fire").disabled=true;let correct=false;
 try{
  if(room){const data=await roomAct("attack",{target:t.id,word,turn:t.turn});correct=data.correct}
  else{const n=now();tick(local,n);const matched=local.tanks.find(h=>h.team!==findMe().team&&h.hp&&local.decks[h.team].words[h.index].en===norm(word));const dest=matched||local.tanks.find(b=>b.id===t.id);
   correct=hit(local,me,dest.id,word,dest.id===t.id?t.turn:dest.turn,n);selected=dest.id;view=visibleGame(local)}
  if(!correct){tone(false);notice("拼写有误，请再试一次");$("#answer").select()}else $("#answer").value="";
  $("#fireForm").classList.remove("good","bad");$("#fireForm").classList.add(correct?"good":"bad");clearTimeout(flashTimer);flashTimer=setTimeout(()=>$("#fireForm").classList.remove("good","bad"),650);
 }catch(err){notice(err.message)}finally{pending=false;render();if(!$("#answer").disabled&&matchMedia("(pointer:fine)").matches)$("#answer").focus()}
}
$("#fireForm").onsubmit=fire;
document.addEventListener("keydown",e=>{if($("#dialog").open||e.isComposing||e.ctrlKey||e.altKey||e.metaKey)return;
 if(["1","2","3"].includes(e.key)){const t=enemies()[+e.key-1];if(t?.hp){e.preventDefault();changeTarget(t.id)}}
 else if(/^[a-z]$/i.test(e.key)&&document.activeElement!==$("#answer")&&!$("#answer").disabled){e.preventDefault();$("#answer").focus();$("#answer").value+=e.key;if(phase==="ready")run()}
});
function show(title,html,kind){
 if(!$("#dialog").open){resume=!room&&phase==="battle";if(resume)pauseLocal();$("#dialog").showModal()}
 modal=kind;$("#dlgTitle").textContent=title;$("#dlgBody").innerHTML=html;$("#dialog").scrollTop=0;
}
function close(){if($("#dialog").open)$("#dialog").close()}
$("#closeDlg").onclick=close;$("#dialog").addEventListener("close",()=>{modal="";if(resume&&!room&&phase==="paused")run();resume=false});
$("#dialog").addEventListener("click",e=>{if(e.target!==$("#dialog"))return;const r=$("#dialog").getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close()});
$("#manual").onclick=()=>show("作战手册",'<ol class="guide"><li>每位玩家驾驶一辆坦克。苍蓝营与赤焰营分别选择自己的防守词表。</li><li>看敌方坦克上方的中文释义和首字母，输入完整英文，按 Enter 或「开火」。可以直接拼写任一敌方坦克的词，也可以点选目标。</li><li>每次拼对击中目标扣 1 点血，并立即换词。倒计时 30 秒到期只更换词语，血量保持原值。同队坦克的词互不重复。</li><li>每辆坦克默认 10 点血，开局可选 5、10 或 20 点。一方坦克全部被击毁，对局结束。</li><li>自由练习中只有你的正确拼写会触发攻击。可在血量设置中开启电脑陪练。联机房间支持 2、4、6 位玩家在各自设备上同时对战。</li></ol>',"manual");
function deckFields(i,spec){const items=Object.entries(PACKS).map(([k,p])=>'<option value="'+k+'" '+(spec.id===k?"selected":"")+'>'+({valley:"入门",life:"入门",core:"中级",ielts:"进阶"}[k]||"")+' · '+p.name+' · '+parseDeck(p.raw).length+' 词</option>').join("");
 return '<label for="deck'+i+'">'+names[i]+'防守词表</label><select id="deck'+i+'">'+items+'<option value="custom" '+(spec.id==="custom"?"selected":"")+'>自定义词表</option></select><div id="custom'+i+'" '+(spec.id==="custom"?"":"hidden")+'><label for="raw'+i+'">每行一个英文词条及中文释义</label><textarea id="raw'+i+'" placeholder="river 河流&#10;cloud 云朵&#10;stone 石头&#10;forest 森林">'+esc(spec.raw||"")+'</textarea><div class="details">可粘贴 4–250 组词条，用空格、逗号或制表符分隔。</div></div>'}
function setupDecks(){
 if(room&&room.phase!=="lobby"){toast("本局词表已锁定");return}
 const idx=room?[room.myId[0]==="B"?1:0]:[0,1];
 const initial=i=>room?(room.ownSpec||roomDeckPref(room.deckNames[i],i)):specs[i];
 show("阵营词表",'<p>为己方坦克选择词表，对手需要拼出其中的单词才能造成伤害。</p>'+idx.map(i=>deckFields(i,initial(i))).join("")+'<div class="fieldError" role="alert"></div><div class="dlgActions"><button class="primary" id="saveDeck">'+(room?"保存本队词表":["ready","end"].includes(phase)?"应用词表":"应用并重新训练")+'</button></div>',"decks");
 idx.forEach(i=>$("#deck"+i).onchange=()=>$("#custom"+i).hidden=$("#deck"+i).value!=="custom");
 $("#saveDeck").onclick=async e=>{const btn=e.currentTarget;try{const updated=idx.map(i=>{const id=$("#deck"+i).value;const a=id==="custom"?{id,raw:$("#raw"+i).value}:{id};deck(a);return a});
  if(room){btn.disabled=true;await roomAct("deck",{spec:updated[0]});specs[idx[0]]=updated[0];savePrefs();lobby();return}
  specs=updated;savePrefs();resume=false;close();reset();toast("阵营词表已应用")
 }catch(er){errBox(er)}finally{btn.disabled=false}}
}
function roomDeckPref(name,i){const known=Object.keys(PACKS).find(k=>PACKS[k].name===name);return known?{id:known}:specs[i].id==="custom"?specs[i]:{id:"custom",raw:""}}
$("#decks").onclick=setupDecks;
$("#modes").onclick=e=>{const b=e.target.closest("[data-n]");if(!b||room||+b.dataset.n===size)return;const go=()=>{resume=false;close();size=+b.dataset.n;savePrefs();reset()};
 if((phase==="battle"||phase==="paused")&&view.seq){show("切换对战人数",'<p>将结束当前训练，开始新的 '+b.dataset.n+'v'+b.dataset.n+' 对局。</p><button class="primary" id="confirmMode">切换人数</button>',"mode");$("#confirmMode").onclick=go}else go()};
$("#history").onclick=()=>show("战斗记录",view.events.length?view.events.slice().reverse().map(e=>'<div class="rec"><time>'+timeFmt(e.at-view.started)+'</time><b>'+e.from+'</b> 命中 <b>'+e.to+'</b> '+(e.down?"击毁":"−"+(e.damage??view.damage)+" HP")+'</div>').join(""):'<p>本局尚无命中记录。</p>',"history");
function showResult(){const team=findMe()?.team??0,win=view.winner===team;
 show("战斗结算",'<div class="gameResult"><h3>'+names[view.winner]+'胜利</h3><p>'+ (win?"你的阵营摧毁了全部敌方坦克。":"本方坦克已全部被击毁。")+'</p><strong>'+timeFmt(view.ended-view.started)+'</strong><p>对局用时 · 个人命中 '+(findMe()?.hits||0)+' 次</p></div><div class="dlgActions"><button class="primary" id="again">'+(room?"离开房间":"再来一局")+'</button><button class="dlgBtn" id="inspect">查看战场</button></div>',"result");
 $("#again").onclick=async()=>{if(room){await leave();return}resume=false;close();reset()};$("#inspect").onclick=close;
}
$("#rules").onclick=()=>{
 const isRoom=!!room, current=isRoom?room.maxHP:maxHP;
 show("对战设置",'<label for="pickHP">每辆坦克的初始血量</label><select id="pickHP">'+hpOptions(current)+'</select><p class="details">正确拼写命中一次扣 1 点血。30 秒到时只换词。</p>'+(isRoom?'':'<label for="practiceType">训练对手</label><select id="practiceType"><option value="off">自由练习 · 仅玩家开火</option><option value="on">人机对抗 · 电脑参与攻击</option></select>')+'<div class="fieldError" role="alert"></div><div class="dlgActions"><button class="primary" id="applyRules">'+(isRoom?"保存房间设置":view.seq?"应用并重新开局":"应用设置")+'</button></div>',"rules");
 if(!isRoom)$("#practiceType").value=computerFire?"on":"off";
 $("#applyRules").onclick=async()=>{try{const v=healthTier(+$("#pickHP").value);if(isRoom){await roomAct("rules",{maxHP:v});lobby();return}
 const bot=$("#practiceType").value==="on";if(maxHP===v&&computerFire===bot){close();return}maxHP=v;computerFire=bot;savePrefs();resume=false;close();reset()}catch(e){errBox(e)}};
};
function errBox(e){const box=$(".fieldError");if(box)box.textContent=e.message||String(e);else toast(e.message||String(e))}
async function request(path,body,token=key){
 if(window.ArmorNetwork)return ArmorNetwork.request(path,body,token);
 const res=await fetch(path,{method:body===undefined?"GET":"POST",cache:"no-store",headers:{"Content-Type":"application/json","X-Player":token},...(body===undefined?{}:{body:JSON.stringify(body)})});
 let data;try{data=await res.json()}catch{throw Error("联机服务暂不可用，请稍后重试。")}
 if(!res.ok){const err=Error(data.error||"连接失败，请重试。");err.status=res.status;throw err}return data;
}
function rememberRoom(){try{if(room)sessionStorage.setItem("armor-room",JSON.stringify({code:room.code,key}));else sessionStorage.removeItem("armor-room")}catch{}}
function sync(data){
 if(room?.code===data.code&&room.revision>data.revision)return;const prev=room?.phase,first=!room;room=data;phase=data.phase;me=data.myId;
 offset=data.serverNow-Date.now();if(data.token)key=data.token;
 if(first){resume=false;lastUnits="";lastSeq=0;lastStamp="";endShown=false;selected=me[0]==="A"?"B1":"A1"}
 if(data.game){view=data.game;if(prev==="lobby"||first){if($("#dialog").open)close();notice("战斗开始，自由选择敌方目标")}render()}
 else {const s=[{id:"valley"},{id:"valley"}];view=visibleGame(createGame(data.size,s,data.serverNow,data.maxHP??DEFAULT_HP));view.deckNames=data.deckNames;render();notice("等待双方玩家集结");
  if(first||modal==="lobby")lobby()}
 rememberRoom();
}
async function roomAct(action,payload={}){const code=room.code;const data=await request("/api/rooms/"+code+"/"+action,payload);if(room?.code===code)sync(data);return data}
function roomMenu(code=""){
 if(location.protocol==="file:"){show("联机房间",'<p>当前打开的是单文件训练版。要让多台设备一起对战，请在电脑上解压完整游戏包，运行 <b>start-game.cmd</b>，然后用各自的浏览器打开启动窗口显示的局域网地址。</p>',"offline");return}
 if(room){lobby();return}
 show("联机房间",'<label for="pname">玩家昵称</label><input id="pname" maxlength="12" placeholder="指挥员" value="'+esc(settings.name||"")+'"><label for="rsize">创建房间 · 对战人数</label><select id="rsize">'+[1,2,3].map(i=>'<option value="'+i+'" '+(i===size?"selected":"")+'>'+i+'v'+i+' · '+(i*2)+' 位玩家</option>').join("")+'</select><label for="roomHP">每辆坦克的初始血量</label><select id="roomHP">'+hpOptions(maxHP)+'</select><div class="details">齐员开战。每次拼对命中扣 1 点血。</div><div class="dlgActions"><button class="primary" id="createRoom">创建房间</button></div><hr style="border:0;border-top:1px solid #454c40;margin:19px 0"><label for="rc">加入已有房间</label><input id="rc" maxlength="6" placeholder="输入 6 位房间码" value="'+esc(code)+'" style="text-transform:uppercase"><label for="joinTeam">加入阵营</label><select id="joinTeam"><option value="1">赤焰营</option><option value="0">苍蓝营</option></select><div class="fieldError" role="alert"></div><div class="dlgActions"><button id="joinRoom" class="dlgBtn">加入房间</button></div>',"room");
 const go=async create=>{if(onlineBusy)return;onlineBusy=true;$("#createRoom").disabled=$("#joinRoom").disabled=true;const actionBtn=$(create?"#createRoom":"#joinRoom");actionBtn.textContent=create?"正在创建…":"正在连接房主…";
  try{settings.name=$("#pname").value.trim();savePrefs();const code=$("#rc").value.trim().toUpperCase();
   if(!create&&!/^[A-Z2-9]{6}$/.test(code))throw Error("请输入 6 位房间码。");
   const data=create?await request("/api/rooms",{size:+$("#rsize").value,maxHP:+$("#roomHP").value,name:settings.name,spec:specs[0]},""):await request("/api/rooms/"+code+"/join",{team:+$("#joinTeam").value,name:settings.name},"");sync(data);
  }catch(e){errBox(e)}finally{onlineBusy=false;if($("#createRoom")){$("#createRoom").disabled=$("#joinRoom").disabled=false;$("#createRoom").textContent="创建房间";$("#joinRoom").textContent="加入房间"}}};
 $("#createRoom").onclick=()=>go(true);$("#joinRoom").onclick=()=>go(false);
}
let lobbySig="";
function lobby(){
 if(!room)return;const r=room,full=r.players.length===r.size*2;
 const signature=JSON.stringify([r.code,r.phase,r.myId,r.players,r.deckNames,r.maxHP,r.host]);if(modal==="lobby"&&signature===lobbySig)return;lobbySig=signature;
 show("联机房间",'<div class="roomLine"><div><div class="details">'+r.size+'v'+r.size+' · 每车 '+r.maxHP+' HP</div><span class="roomCode">'+r.code+'</span><div class="details">房间码 · 房主请保持页面开启</div></div><button class="dlgBtn" id="copyInvite">复制邀请链接</button></div><div class="roster">'+[0,1].map(i=>'<div><b class="'+(i?"orange":"blue")+'">'+names[i]+'</b><small>'+esc(r.deckNames[i])+'</small><ul>'+Array.from({length:r.size},(_,j)=>{const id=(i?"B":"A")+(j+1),p=r.players.find(x=>x.id===id);return '<li>'+id+' · '+(p?esc(p.name)+(id===r.myId?"（我）":""):"等待加入")+'</li>'}).join("")+'</ul></div>').join("")+'</div><div class="fieldError" role="alert"></div><div class="dlgActions">'+(r.phase==="lobby"?'<button class="dlgBtn" id="changeTeam">换阵营</button><button class="dlgBtn" id="roomDeck">本队词表</button>'+(r.host?'<button class="primary" id="startRoom" '+(full?"":"disabled")+'>'+(full?"开始对战":"等待到齐 "+r.players.length+"/"+r.size*2)+'</button>':'<span class="details">等待房主开始对战</span>'):'<button class="primary" id="backField">返回战场</button>')+'</div><div class="dlgActions"><button class="quiet" id="exitRoom">退出房间</button></div>',"lobby");
 $("#copyInvite").onclick=async()=>{let u=new URL(location.href);if(["127.0.0.1","localhost"].includes(u.hostname)){try{const address=await fetch("/local-invite").then(x=>x.json());if(address.origin)u=new URL(address.origin)}catch{}}u.search="?room="+r.code;u.hash="";try{await navigator.clipboard.writeText(u.href);toast("邀请链接已复制")}catch{const x=document.createElement("input");x.value=u.href;$("#dlgBody").append(x);x.select()}};
 if($("#changeTeam"))$("#changeTeam").onclick=()=>roomAct("switch").catch(errBox);
 if($("#roomDeck")){$("#roomDeck").onclick=setupDecks;if(r.host){const hpBtn=document.createElement("button");hpBtn.className="dlgBtn";hpBtn.textContent="血量档次";hpBtn.onclick=()=>$("#rules").click();$("#roomDeck").after(hpBtn)}}
 if($("#startRoom"))$("#startRoom").onclick=()=>roomAct("start").catch(errBox);
 if($("#backField"))$("#backField").onclick=close;
 $("#exitRoom").onclick=()=>{if(room.phase!=="battle"){leave();return}show("退出对战",'<p>退出后，你的坦克将被移出本局。</p><div class="fieldError"></div><button class="primary" id="yesLeave">确认退出</button>',"leave");$("#yesLeave").onclick=leave};
}
async function leave(){try{if(room)await request("/api/rooms/"+room.code+"/leave",{})}catch(e){if(!window.ArmorNetwork){errBox(e);return}}window.ArmorNetwork?.close();room=null;rememberRoom();resume=false;close();reset();history.replaceState(null,"",location.pathname);toast("已退出房间")}
$("#rooms").onclick=()=>roomMenu();
let networkErr=false;
async function poll(){
 if(!room||polling||room.phase==="end")return;polling=true;const code=room.code;
 try{const data=await request("/api/rooms/"+code);if(room?.code===code){if(networkErr)notice("连接已恢复");networkErr=false;sync(data)}}
 catch(e){if(room?.code!==code)return;if([403,404].includes(e.status)){window.ArmorNetwork?.close();room=null;rememberRoom();close();reset();toast(e.message)}else{networkErr=true;notice("正在重新连接房间…")}}
 finally{polling=false}
}
new ResizeObserver(()=>{MapArt.resize();lastUnits="";if(view)render()}).observe($("#stage"));
setInterval(()=>{localStep();updateTime()},180);setInterval(poll,900);
function frame(t){if(!document.hidden&&view&&MapArt.animating())MapArt.draw(view,selected,me,t);requestAnimationFrame(frame)}requestAnimationFrame(frame);
reset();
(async()=>{const code=new URLSearchParams(location.search).get("room")?.toUpperCase();let stored;try{stored=JSON.parse(sessionStorage.getItem("armor-room"))}catch{}
 if(stored&&(!code||code===stored.code)){try{const d=await request("/api/rooms/"+stored.code,undefined,stored.key);key=stored.key;sync(d);return}catch{rememberRoom()}}
 if(code)roomMenu(code);
})();