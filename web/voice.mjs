export const voiceErrors={
 'not-allowed':'Microphone permission is off. Allow it in your browser, or use Type instead.',
 'service-not-allowed':'Voice is unavailable here. Use Type instead to keep playing.',
 'audio-capture':'No microphone was found. Connect one, or use Type instead.',
 'network':'The speech service could not connect. Retry, or use Type instead.',
 'no-speech':'No speech was heard. Try again when ready.',
 'language-not-supported':'English recognition is unavailable here. Use Type instead.'
};
export class EnglishVoiceInput{
 constructor({Recognition,secure=true,onStatus=()=>{},onListening=()=>{},onFinal=()=>{},accepts=()=>false}){Object.assign(this,{Recognition,secure,onStatus,onListening,onFinal,accepts});this.session=null;this.timer=null;this.candidates=[];}
 start(){
  this.abort();this.candidates=[];
  if(!this.Recognition||!this.secure){this.onStatus('Voice is unavailable in this browser. Use Type instead to keep playing.');return false;}
  let r;try{r=new this.Recognition();}catch{this.onStatus('Voice could not start. Use Type instead.');return false;}
  this.session=r;r.lang='en-US';r.interimResults=true;r.continuous=true;r.maxAlternatives=5;
  r.onresult=e=>{
   if(this.session!==r)return;
   const finals=[],preview=[];
   for(let i=0;i<e.results.length;i++){
    const result=e.results[i];preview.push(result[0].transcript.trim());
    if(result.isFinal)finals.push(Array.from(result,a=>a.transcript.trim()).filter(Boolean));
   }
   this.onStatus('I heard: “'+preview.join(' ')+'”');
   let combinations=[''];
   for(const group of finals)combinations=combinations.flatMap(prefix=>group.map(w=>(prefix+' '+w).trim())).slice(0,30);
   this.candidates=combinations.filter(Boolean);
   const accepted=this.candidates.find(w=>this.accepts(w));
   if(accepted){this.abort();this.onFinal(accepted);}
  };
  r.onerror=e=>{if(this.session!==r)return;const message=voiceErrors[e.error]||'Please try again, or use Type instead.';this.abort();this.onStatus(message);};
  r.onend=()=>{if(this.session===r)this.settle();};
  this.onListening(true);this.onStatus('Listening… pauses are OK. Say the key words, then tap to finish.');
  try{r.start();if(this.session===r)this.timer=setTimeout(()=>this.finish(),25000);return true;}catch{this.abort();this.onStatus('Voice could not start. Use Type instead.');return false;}
 }
 finish(){const r=this.session;if(!r)return;clearTimeout(this.timer);try{r.stop();}catch{this.settle();return;}if(this.session===r)this.timer=setTimeout(()=>this.settle(),1200);}
 settle(){const words=this.candidates.find(w=>this.accepts(w))||this.candidates[0];this.abort();if(words)this.onFinal(words);else this.onStatus('No finished words yet. Please retry, or use Type instead.');}
 abort(){clearTimeout(this.timer);this.timer=null;const r=this.session;this.session=null;if(r){r.onresult=null;r.onerror=null;r.onend=null;try{r.abort();}catch{}}this.onListening(false);}
}
