export const voiceErrors={
 'not-allowed':'Microphone permission is off. Allow it in your browser, or tap “Type instead”.',
 'service-not-allowed':'Voice is unavailable here. Tap “Type instead” to keep playing.',
 'audio-capture':'I can’t find a microphone. Connect one or tap “Type instead”.',
 'network':'Voice could not connect. Please try again, or tap “Type instead”.',
 'no-speech':'I didn’t hear you yet. Try again when you’re ready.',
 'language-not-supported':'English voice recognition is unavailable here. Tap “Type instead”.',
 'aborted':'Ready when you are. Tap to try again.'
};
export class EnglishVoiceInput{
 constructor({Recognition,secure=true,onStatus=()=>{},onListening=()=>{},onFinal=()=>{}}){Object.assign(this,{Recognition,secure,onStatus,onListening,onFinal});this.session=null;this.timer=null;}
 start(){
  this.abort();
  if(!this.Recognition||!this.secure){this.onStatus('Voice is not available in this browser. Tap “Type instead” to keep playing.');return false;}
  let r;try{r=new this.Recognition();}catch{this.onStatus('Voice could not start. Please try again, or tap “Type instead”.');return false;}
  this.session=r;r.lang='en-US';r.interimResults=true;r.continuous=false;r.maxAlternatives=1;
  r.onresult=e=>{if(this.session!==r)return;const result=e.results[e.results.length-1];const words=result[0].transcript.trim();if(words)this.onStatus(`I heard: “${words}”`);if(result.isFinal&&words){this.abort();this.onFinal(words);}};
  r.onerror=e=>{if(this.session!==r)return;this.onStatus(voiceErrors[e.error]||'Let’s try that again. You can also tap “Type instead”.');this.abort();};
  r.onend=()=>{if(this.session!==r)return;this.onStatus('I didn’t catch that. Try again, or tap “Type instead”.');this.abort();};
  this.onListening(true);this.onStatus('I’m listening. Say your answer in English.');
  try{r.start();if(this.session===r)this.timer=setTimeout(()=>{if(this.session!==r)return;this.onStatus('Let’s take a little pause. Tap to try again, or use “Type instead”.');this.abort();},20000);return true;}
  catch{this.abort();this.onStatus('Voice could not start. Please try again, or tap “Type instead”.');return false;}
 }
 abort(){clearTimeout(this.timer);this.timer=null;const r=this.session;this.session=null;if(r){r.onresult=null;r.onerror=null;r.onend=null;try{r.abort();}catch{}}this.onListening(false);}
}
