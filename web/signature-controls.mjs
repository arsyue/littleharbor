const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const signatureTypes=['sort','paint','basket','route','pattern','dials'];
export function signatureControls(s,{body,session,save,submit,feedback,stopNarration}){
 const box=body.querySelector('#work-input'),d=session.draft;let disposed=false,timers=[],audio=null;
 const cleanup=()=>{disposed=true;timers.forEach(clearTimeout);timers=[];audio?.close().catch(()=>{});audio=null;};
 const check=html=>html+'<button class="primary" id="work-check">Check my work</button>';
 if(s.type==='sort'){
  const values=d.values||={};
  box.innerHTML=check('<div class="signature-sort">'+Object.keys(s.fields).map((k,i)=>'<label><strong>'+esc(k)+'</strong><select data-sort="'+i+'" aria-label="'+esc(k)+'"><option value="">Choose a match…</option>'+s.choices.map(v=>'<option'+(values[k]===v?' selected':'')+'>'+esc(v)+'</option>').join('')+'</select></label>').join('')+'</div>');
  box.querySelectorAll('[data-sort]').forEach(el=>el.onchange=()=>{values[Object.keys(s.fields)[Number(el.dataset.sort)]]=el.value;save();});
  box.querySelector('#work-check').onclick=()=>submit(values);
 }
 if(s.type==='dials'){
  const values=d.values||={};
  box.innerHTML=check('<div class="signature-dials">'+Object.entries(s.fields).map(([k],i)=>{const [min,max,step]=s.ranges[k];values[k]??=min;return'<label><strong>'+esc(k)+' <output data-dial-value="'+i+'">'+values[k]+' '+esc(s.units[k])+'</output></strong><input data-dial="'+i+'" type="range" min="'+min+'" max="'+max+'" step="'+step+'" value="'+values[k]+'" aria-label="'+esc(k)+'"><span>'+min+' — '+max+' '+esc(s.units[k])+'</span></label>';}).join('')+'</div>');
  box.querySelectorAll('[data-dial]').forEach(el=>el.oninput=()=>{const i=Number(el.dataset.dial),k=Object.keys(s.fields)[i];values[k]=Number(el.value);box.querySelector('[data-dial-value="'+i+'"]').textContent=values[k]+' '+s.units[k];save();});
  box.querySelector('#work-check').onclick=()=>submit(values);
 }
 if(s.type==='paint'){
  const cells=d.cells||={};let tool=d.tool||s.palette[1];const positions=['Top left','Top center','Top right','Middle left','Center','Middle right','Bottom left','Bottom center','Bottom right'],colors={Empty:'#faf5e8',Blue:'#80bbda',Yellow:'#f2ce63',Green:'#7cae87',Red:'#dc8b7b',Plant:'#80aa87',Cave:'#b9ab93',Shell:'#e9c0a4',Rose:'#d895aa',Sunflower:'#dfc25b',Stone:'#afbab8'};
  box.innerHTML='<div class="signature-palette" role="group" aria-label="Choose a tool">'+s.palette.map(c=>'<button data-paint-tool="'+esc(c)+'" aria-pressed="'+(c===tool)+'">'+esc(c)+'</button>').join('')+'</div><div class="signature-paint" role="group" aria-label="Nine-square design board">'+positions.map((p,i)=>'<button data-paint-cell="'+i+'" aria-label="'+p+'"><small>'+p+'</small><strong></strong></button>').join('')+'</div><p class="work-help">Choose a tool, then tap a square. Choose Empty to erase.</p><button class="secondary" id="paint-reset">Clear the board</button><button class="primary" id="work-check">Check my design</button>';
  function refresh(){box.querySelectorAll('[data-paint-cell]').forEach(b=>{const value=cells[b.dataset.paintCell]||'Empty';b.style.background=colors[value]||'#eee';b.querySelector('strong').textContent=value==='Empty'?'·':value;b.setAttribute('aria-label',positions[Number(b.dataset.paintCell)]+': '+value);});box.querySelectorAll('[data-paint-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.paintTool===tool)));save();}
  box.querySelectorAll('[data-paint-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.paintTool;d.tool=tool;refresh();});
  box.querySelectorAll('[data-paint-cell]').forEach(b=>b.onclick=()=>{cells[b.dataset.paintCell]=tool;refresh();});
  box.querySelector('#paint-reset').onclick=()=>{for(const k of Object.keys(cells))delete cells[k];refresh();};box.querySelector('#work-check').onclick=()=>submit(cells);refresh();
 }
 if(s.type==='basket'){
  const values=d.values||={};
  box.innerHTML=check('<div class="signature-basket">'+s.catalog.map(([name,price],i)=>'<div><span><strong>'+esc(name)+'</strong><small>'+price+' '+esc(s.unit)+' each</small></span><span class="work-counter"><button data-basket="'+i+'" data-delta="-1" aria-label="Remove '+esc(name)+'">−</button><output data-qty="'+i+'">0</output><button data-basket="'+i+'" data-delta="1" aria-label="Add '+esc(name)+'">+</button></span></div>').join('')+'</div><p class="signature-total" id="basket-total"></p>');
  function refresh(){let total=0;for(const [i,[name,price]]of s.catalog.entries()){total+=(values[name]||0)*price;box.querySelector('[data-qty="'+i+'"]').textContent=values[name]||0;}const el=box.querySelector('#basket-total');el.textContent='Total: '+total+' / '+s.limit+' '+s.unit;el.classList.toggle('over-limit',total>s.limit);save();}
  box.querySelectorAll('[data-basket]').forEach(b=>b.onclick=()=>{const name=s.catalog[Number(b.dataset.basket)][0];values[name]=Math.max(0,Math.min(9,(values[name]||0)+Number(b.dataset.delta)));refresh();});box.querySelector('#work-check').onclick=()=>submit(values);refresh();
 }
 if(s.type==='route'){
  const moves=d.moves||=[];const delta={North:[0,-1],East:[1,0],South:[0,1],West:[-1,0]};
  box.innerHTML='<div class="signature-map" style="--map-cols:'+s.width+'" role="img" aria-label="Harbor route map"></div><p id="route-log" class="work-help"></p><div class="signature-directions">'+['North','West','East','South'].map(k=>'<button class="secondary" data-direction="'+k+'">'+k+'</button>').join('')+'</div><button class="secondary" id="route-reset">Start at the dock</button><button class="primary" id="work-check">Check the route</button>';
  const pos=()=>moves.reduce((p,m)=>[p[0]+delta[m][0],p[1]+delta[m][1]],[...s.start]);
  function refresh(){const p=pos();box.querySelector('.signature-map').innerHTML=Array.from({length:s.width*s.height},(_,i)=>{const x=i%s.width,y=Math.floor(i/s.width),blocked=s.blocked.some(b=>b[0]===x&&b[1]===y),boat=p[0]===x&&p[1]===y,goal=s.goal[0]===x&&s.goal[1]===y,start=s.start[0]===x&&s.start[1]===y;return'<div class="'+(blocked?'reef':'water')+'">'+(boat?'<span class="map-boat">Boat</span>':blocked?'Rocks':goal?'Lighthouse':start?'Dock':'')+'</div>';}).join('');box.querySelector('#route-log').textContent=moves.length?moves.join(' → '):'Start at the dock. Follow the spoken directions.';save();}
  box.querySelectorAll('[data-direction]').forEach(b=>b.onclick=()=>{const m=b.dataset.direction,p=pos(),n=[p[0]+delta[m][0],p[1]+delta[m][1]];if(n[0]<0||n[0]>=s.width||n[1]<0||n[1]>=s.height||s.blocked.some(v=>v[0]===n[0]&&v[1]===n[1])){feedback('Rocks or the shore block that direction. Choose a clear channel.');return;}moves.push(m);refresh();});box.querySelector('#route-reset').onclick=()=>{moves.length=0;refresh();};box.querySelector('#work-check').onclick=()=>submit(moves);refresh();
 }
 if(s.type==='pattern'){
  const picked=d.picked||=[];let replaying=false;const colors={Red:'#c86860',Yellow:'#d4af43',Green:'#5e9d75',Do:'#6f9fb4',Re:'#729f86',Mi:'#b58c5f',So:'#a57da5'};
  box.innerHTML='<button class="secondary" id="pattern-listen">Play the pattern</button><div class="signature-pads">'+s.choices.map((k,i)=>'<button data-pad="'+esc(k)+'" style="--pad-color:'+colors[k]+'" aria-label="Play '+esc(k)+'">'+esc(k)+'</button>').join('')+'</div><p class="signature-pattern" id="pattern-log"></p><button class="secondary" id="pattern-reset">Try the pattern again</button><button class="primary" id="work-check">Check my pattern</button>';
  function tone(label){const i=s.choices.indexOf(label),b=box.querySelector('[data-pad="'+label+'"]');b?.classList.add('lit');timers.push(setTimeout(()=>b?.classList.remove('lit'),400));try{audio||=new(window.AudioContext||window.webkitAudioContext)();void audio.resume();const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.frequency.value=s.tones[i];gain.gain.setValueAtTime(.0001,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.14,audio.currentTime+.02);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.38);oscillator.connect(gain);gain.connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+.4);}catch{feedback('Watch the glowing pads to follow the pattern.');}}
  function refresh(){box.querySelector('#pattern-log').textContent=picked.length?picked.join(' · '):'Your pattern will appear here.';save();}
  box.querySelectorAll('[data-pad]').forEach(b=>b.onclick=()=>{if(replaying)return;stopNarration();tone(b.dataset.pad);picked.push(b.dataset.pad);refresh();});
  box.querySelector('#pattern-listen').onclick=()=>{if(replaying)return;stopNarration();replaying=true;box.querySelector('#pattern-listen').disabled=true;s.answer.forEach((label,i)=>timers.push(setTimeout(()=>{if(!disposed)tone(label);},i*650)));timers.push(setTimeout(()=>{if(disposed)return;replaying=false;box.querySelector('#pattern-listen').disabled=false;},s.answer.length*650));};
  box.querySelector('#pattern-reset').onclick=()=>{picked.length=0;refresh();};box.querySelector('#work-check').onclick=()=>submit(picked);refresh();
 }
 return cleanup;
}
