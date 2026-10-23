// Fullscreen the document so conversations and menus stay above the game.
export function createScreenMode({getScene,navigate,hasDialog,closeDialog}){
 const doc=document,html=doc.documentElement;
 let fallback=false,busy=false,previousScroll=0,wasActive=false,returnFocus=null;
 const controls=doc.createElement('div');controls.id='screen-controls';controls.hidden=true;controls.setAttribute('role','toolbar');controls.setAttribute('aria-label','Full screen controls');
 controls.innerHTML='<button id="screen-switch" type="button"></button><span class="screen-hint">Esc to exit</span><button id="screen-exit" type="button">⤢ <span>Exit Full Screen</span></button>';
 doc.body.insertBefore(controls,doc.querySelector('#overlay'));
 const nativeElement=()=>doc.fullscreenElement||doc.webkitFullscreenElement;
 const active=()=>!!nativeElement()||fallback;
 function sync(){
  const on=active();doc.body.classList.toggle('game-fullscreen',on);controls.hidden=!on;
  doc.querySelectorAll('[data-action="fullscreen"]').forEach(b=>{b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',on?'Exit Full Screen':'Full Screen');});
  controls.querySelector('#screen-switch').textContent=getScene()==='town'?'⌂ My Aquarium':'⌖ Explore Town';
  const frame=doc.querySelector('#aquarium-engine');
  try{const b=frame?.contentDocument?.querySelector('#immerse');if(b){b.textContent=on?'⤢ Exit Full Screen':'⛶ Full Screen';b.setAttribute('aria-pressed',String(on));}}catch{}
  if(wasActive&&!on){requestAnimationFrame(()=>{window.scrollTo(0,previousScroll);if(!hasDialog()&&returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});}
  wasActive=on;
 }
 async function toggle(){
  if(busy)return;busy=true;
  try{
   if(active()){
    fallback=false;
    const exit=doc.exitFullscreen||doc.webkitExitFullscreen;
    if(nativeElement()&&exit){try{await exit.call(doc);}catch{}}
   }else{
    previousScroll=window.scrollY;returnFocus=doc.activeElement;
    const request=html.requestFullscreen||html.webkitRequestFullscreen;
    if(request&&doc.fullscreenEnabled!==false){
     try{await request.call(html,{navigationUI:'hide'});}catch{fallback=true;}
    }else fallback=true;
   }
  }finally{busy=false;sync();}
 }
 controls.querySelector('#screen-exit').onclick=toggle;
 controls.querySelector('#screen-switch').onclick=()=>{navigate(getScene()==='town'?'home':'town');sync();};
 function escape(e){
  if(e.key!=='Escape'||!active())return;
  if(hasDialog()){closeDialog();return;}
  if(fallback){e.preventDefault();void toggle();}
 }
 doc.addEventListener('keydown',escape);
 // Key events inside the same-origin game frames do not bubble to this document.
 function watchFrame(frame){try{frame.contentDocument?.addEventListener('keydown',escape);}catch{}}
 const boundFrames=new WeakSet();
 function refresh(){sync();for(const frame of doc.querySelectorAll('.world iframe'))if(!boundFrames.has(frame)){boundFrames.add(frame);frame.addEventListener('load',()=>{watchFrame(frame);sync();});watchFrame(frame);}}
 doc.addEventListener('fullscreenchange',sync);doc.addEventListener('webkitfullscreenchange',sync);
 return {toggle,sync:refresh};
}
