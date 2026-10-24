const {spawn}=require('child_process');
const tests=['cloud/signature.verify.cjs','cloud/work.verify.cjs','cloud/rooms.verify.cjs','cloud/verify.mjs','cloud/readability.verify.cjs'];
let next=0;const results=[];
async function worker(){while(next<tests.length){const test=tests[next++];console.log('BEGIN',test);const code=await new Promise(resolve=>{const child=spawn(process.execPath,[test],{stdio:'inherit'});let done=false;const finish=code=>{if(done)return;done=true;resolve(code);};child.once('error',()=>finish(1));child.once('exit',code=>finish(code??1));});results.push({test,code});console.log('END',test,code===0?'PASS':'FAIL');}}
Promise.all([worker(),worker()]).then(()=>{console.log(JSON.stringify(results));process.exitCode=results.some(r=>r.code!==0)?1:0;}).catch(e=>{console.error(e);process.exitCode=1;});
