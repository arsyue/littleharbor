function state(r,key,revision){
 const me=r.players.find(p=>p.key===key);
 return {revision,serverNow:Date.now(),code:r.code,size:r.size,maxHP:r.maxHP??r.game?.maxHP??(r.game?100:DEFAULT_HP),phase:r.phase,host:!!me&&key===r.host,myId:me?.id??null,
 ownSpec:me&&r.phase==="lobby"?r.specs[me.id[0]==="B"?1:0]:null,players:r.players.map(({id,name})=>({id,name})),deckNames:r.specs.map(x=>x.id==="custom"?"自定义词表":PACKS[x.id].name),game:r.game?visibleGame(r.game):null};
}
function slot(r,team){return Array.from({length:r.size},(_,i)=>(team?"B":"A")+(i+1)).find(id=>!r.players.some(p=>p.id===id))}
const playerName=n=>(String(n??"").trim()||"指挥员").slice(0,12);
function randomCode(){const a="23456789ABCDEFGHJKLMNPQRSTUVWXYZ";return Array.from(crypto.getRandomValues(new Uint8Array(6)),v=>a[v%a.length]).join("")}

function newRoom(code,b,key){
 if(![1,2,3].includes(b.size))throw Error("人数无效。");
 const specs=[{id:"valley"},{id:"valley"}];if(b.spec){deck(b.spec);specs[0]=b.spec}
 return {code,size:b.size,maxHP:healthTier(b.maxHP),phase:"lobby",host:key,specs,players:[{id:"A1",key,name:playerName(b.name)}],game:null};
}
function stepRoom(r,token,action,b,now){
 const p=r.players.find(p=>p.key===token);let key=token,extra={},changed=false;
 if(!p&&action!=="join")throw Object.assign(Error("请重新加入房间。"),{status:403});
 if(r.phase==="battle")changed=tick(r.game,now);
  if(action==="join"){
   if(p)return {key,extra,changed};
   if(r.phase!=="lobby")throw Error("本场已开始，请加入新房间。");
   const id=slot(r,b.team===1?1:0);if(!id)throw Error("该阵营已满，请选择另一队。");
   key=crypto.randomUUID();r.players.push({id,key,name:playerName(b.name)});extra.token=key;changed=true;
  }
  if(action==="switch"){
   if(r.phase!=="lobby")throw Error("开战后不能换队。");
   const id=slot(r,p.id[0]==="A"?1:0);if(!id)throw Error("对方阵营已满。");p.id=id;changed=true;
  }
  if(action==="deck"){
   if(r.phase!=="lobby")throw Error("开战后词表已锁定。");deck(b.spec);r.specs[p.id[0]==="B"?1:0]=b.spec;changed=true;
  }
  if(action==="rules"){if(r.phase!=="lobby"||token!==r.host)throw Error("仅房主可在开战前调整血量。");r.maxHP=healthTier(b.maxHP);changed=true}
  if(action==="start"){
   if(token!==r.host||r.phase!=="lobby")throw Error("仅房主可开始对战。");
   if(r.players.length!==r.size*2)throw Error("请等待双方玩家到齐。");
   r.game=createGame(r.size,r.specs,now,r.maxHP);r.phase="battle";changed=true;
  }
  if(action==="attack"){
   if(r.phase!=="battle")throw Error("当前无法开火。");const chosen=r.game.tanks.find(t=>t.id===b.target),attacker=r.game.tanks.find(t=>t.id===p.id);
   if(!chosen?.hp||chosen.team===attacker.team||chosen.turn!==b.turn)throw Error("目标已变化，请查看最新提示。");
   const matched=r.game.tanks.find(t=>t.team!==attacker.team&&t.hp&&r.game.decks[t.team].words[t.index].en===norm(b.word)),dest=matched||chosen;
   extra.correct=hit(r.game,p.id,dest.id,b.word,dest.turn,now);changed=true;
   if(r.game.winner!==null)r.phase="end";
  }
  if(action==="leave"){
   r.players=r.players.filter(q=>q.key!==token);if(r.host===token)r.host=r.players[0]?.key??"";
   if(r.phase==="battle"){const me=r.game.tanks.find(t=>t.id===p.id);me.hp=0;
    if(!r.game.tanks.some(t=>t.team===me.team&&t.hp)){r.game.winner=1-me.team;r.game.ended=now;r.phase="end"}
   }changed=true;
  }

 return {key,extra,changed};
}
