const numbers={0:'zero',1:'one',2:'two',3:'three',4:'four',5:'five',6:'six',7:'seven',8:'eight',9:'nine',10:'ten',11:'eleven',12:'twelve',13:'thirteen',14:'fourteen',15:'fifteen',16:'sixteen',17:'seventeen',18:'eighteen',19:'nineteen',20:'twenty',30:'thirty',40:'forty',50:'fifty',60:'sixty',70:'seventy',80:'eighty',90:'ninety'};
function numberWords(v){const n=Number(v);if(numbers[n])return numbers[n];if(n<100)return numbers[Math.floor(n/10)*10]+' '+numbers[n%10];if(n<1000)return numbers[Math.floor(n/100)]+' hundred'+(n%100?' and '+numberWords(n%100):'');return v;}
const aliases={blew:'blue',harbour:'harbor',thanks:'thank',shells:'shell',fishes:'fish',opens:'open',closes:'close',costs:'cost',boxes:'box',coins:'coin',flowers:'flower',plants:'plant'};
export function tokens(text){return String(text).toLowerCase().replace(/[’']/g,'').replace(/\bim\b/g,'i am').replace(/\bid\b/g,'i would').replace(/\bsea horse\b/g,'seahorse').replace(/\b\d+\b/g,numberWords).replace(/[^a-z\s]/g,' ').split(/\s+/).filter(Boolean).map(w=>aliases[w]||w);}
export function keywordMatch(text,groups){const heard=new Set(tokens(text));return groups.some(g=>g.flatMap(tokens).every(w=>heard.has(w)));}
export function assessAnswer(text,step,mode='standard'){
 const words=tokens(text),heard=new Set(words);
 const filler=new Set(['i','am','would','can','could','may','like','please','because','and','then','the','a','to','is','are','it','we','will']);
 const groups=step.groups.map(g=>g.flatMap(tokens));
 const targets=mode==='assisted'?groups.map(g=>{const core=g.filter(w=>!filler.has(w));return core.length?core:g;}):groups;
 if(!targets.some(g=>g.every(w=>heard.has(w)))){
  const nearest=targets.slice().sort((a,b)=>a.filter(w=>!heard.has(w)).length-b.filter(w=>!heard.has(w)).length)[0]||[];
  return {ok:false,message:'Include these key details: '+[...new Set(nearest.filter(w=>!heard.has(w)))].join(', ')+'. You can correct a recognition mistake below.'};
 }
 const minimum=mode==='assisted'?1:step.min+(mode==='challenge'?3:0);
 if(words.length<minimum)return {ok:false,message:'Try a full sentence with a little more detail, or choose Assisted for a shorter answer.'};
 return {ok:true};
}
