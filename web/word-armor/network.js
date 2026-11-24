/* The room creator runs the shared referee over encrypted WebRTC data channels. */
window.ArmorNetwork=(()=>{
 const prefix="word-armor-v2-", actions=new Set(["join","start","rules","deck","attack","leave","switch"]);
 const storage="word-armor-host-v2";
 let peer=null,hosted=null,revision=0,conn=null,connecting=null,route="",sequence=0;
 const pending=new Map(), guests=new Set();
 const failure=(message,status)=>Object.assign(new Error(message),{status});
 function persist(){try{if(hosted)sessionStorage.setItem(storage,JSON.stringify({hosted,revision}));else sessionStorage.removeItem(storage)}catch{}}
 function statusError(e){return e?.type==="unavailable-id"?"房间码已占用，请重新创建。":e?.type==="peer-unavailable"?"房间尚未上线或房主已离开。":"房间连接失败，请检查网络并重试。"}
 function clearPending(){for(const {reject,timer} of pending.values()){clearTimeout(timer);reject(failure("房间连接中断，请重试。",503))}pending.clear()}
 function disconnect(){if(conn){const c=conn;conn=null;c.close()}if(peer){const p=peer;peer=null;p.destroy()}connecting=null;route="";guests.clear();clearPending()}
 function close(){disconnect();hosted=null;revision=0;persist()}
 function openPeer(id){
  return new Promise((resolve,reject)=>{if(!window.Peer){reject(Error("联机组件尚未加载，请刷新页面。"));return}
   const p=new Peer(id,{debug:0,secure:true});peer=p;let settled=false;
   const timer=setTimeout(()=>{if(!settled){settled=true;p.destroy();reject(failure("未能连上房间服务，请稍后重试。",503))}},14000);
   p.on("open",()=>{if(!settled){settled=true;clearTimeout(timer);resolve(p)}});
   p.on("error",e=>{if(!settled){settled=true;clearTimeout(timer);p.destroy();reject(failure(statusError(e),503))}});
   p.on("disconnected",()=>{if(peer===p&&!p.destroyed)setTimeout(()=>{try{if(peer===p&&p.disconnected&&!p.destroyed)p.reconnect()}catch{}},1000)});
  });
 }
 function run(action,body,key){
  if(!hosted)throw failure("房间已关闭。",404);
  if(action&&!actions.has(action))throw failure("无效操作。",400);
  const {key:resultKey,extra,changed}=stepRoom(hosted,key,action,body||{},Date.now());
  if(changed){revision++;persist()}
  const data={...state(hosted,resultKey,revision),...extra};
  if(action==="join"&&resultKey!==key)data.token=resultKey;
  return data;
 }
 function receive(c,m){
  if(!m||!Number.isSafeInteger(m.id)||m.code!==hosted?.code)return;
  const k=typeof m.key==="string"?m.key:"";let packet;
  try{if(JSON.stringify(m).length>32000)throw Error("词表过大。");if(!m.action&&!k)throw failure("请先加入房间。",403);
   const data=run(m.action||null,m.body,k);packet={id:m.id,data};
  }catch(e){packet={id:m.id,error:e.message,status:e.status||400}}
  if(c.open)c.send(packet);
 }
 function listen(p){p.on("connection",c=>{
  if(guests.size>=20){c.on("open",()=>c.close());return}
  guests.add(c);c.on("data",m=>receive(c,m));c.on("error",()=>guests.delete(c));c.on("close",()=>guests.delete(c));
 })}
 async function makeHost(body,saved){
  disconnect();hosted=null;
  const code=saved?saved.hosted.code:randomCode(),p=await openPeer(prefix+code);
  try{const hostKey=saved?saved.hosted.host:crypto.randomUUID();
   hosted=saved?saved.hosted:newRoom(code,body,hostKey);revision=saved?saved.revision:0;route=code;listen(p);persist();
   return {...state(hosted,hostKey,revision),token:hostKey};
  }catch(e){close();throw e}
 }
 async function channel(code){
  if(conn?.open&&route===code)return conn;
  if(connecting&&route===code)return connecting;
  disconnect();hosted=null;route=code;
  const promise=(async()=>{
   const p=await openPeer(undefined);
   return await new Promise((resolve,reject)=>{
    let done=false;const c=p.connect(prefix+code,{reliable:true,serialization:"json"});conn=c;
    const finish=e=>{if(done)return;done=true;clearTimeout(timer);p.off("error",onPeerError);
     if(e){c.close();reject(e)}else resolve(c)};
    const timer=setTimeout(()=>finish(failure("暂时无法连接房主，请确认房主在线后重试。",503)),14000);
    const onPeerError=e=>finish(failure(statusError(e),e.type==="peer-unavailable"?404:503));p.on("error",onPeerError);
    c.on("open",()=>finish());c.on("error",e=>finish(failure(statusError(e),503)));
    c.on("close",()=>{if(conn===c){conn=null;clearPending()}finish(failure("连接已关闭。",503))});
    c.on("data",m=>{const q=pending.get(m?.id);if(!q)return;pending.delete(m.id);clearTimeout(q.timer);
     if(m.error)q.reject(failure(m.error,m.status));else q.resolve(m.data)});
   });
  })();connecting=promise;try{return await promise}finally{if(connecting===promise)connecting=null}
 }
 async function request(path,body,key=""){
  if(path==="/api/rooms"){if(hosted)close();return makeHost(body)}
  const match=path.match(/^\/api\/rooms\/([A-Z2-9]{6})(?:\/([a-z]+))?$/);if(!match)throw Error("房间地址无效。");
  const [,code,action]=match;if(hosted?.code===code){const d=run(action,body,key);return d}
  if(!peer&&key){let s;try{s=JSON.parse(sessionStorage.getItem(storage))}catch{}
   if(s?.hosted?.code===code&&s.hosted.host===key){await makeHost(null,s);return run(action,body,key)}
  }
  const c=await channel(code);
  return new Promise((resolve,reject)=>{const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(failure("房主暂未响应，请重试。",503))},7000);
   pending.set(id,{resolve,reject,timer});try{c.send({id,code,action:action||null,body:body||null,key})}catch(e){pending.delete(id);clearTimeout(timer);reject(e)}
  });
 }
 return {request,close};
})();