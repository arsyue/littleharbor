/* Original hand-painted pixel terrain and tank sprites. */
const MapArt=(()=>{
 const canvas=document.querySelector("#terrain"),base=document.createElement("canvas"),ctx=canvas.getContext("2d");
 let g=ctx,W=800,H=260,scale=1,effects=[];
 function rand(seed){return ()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296}}
 function rect(x,y,w,h,c){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))}
 function poly(points,c){g.fillStyle=c;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(Math.round(x),Math.round(y)):g.moveTo(Math.round(x),Math.round(y)));g.closePath();g.fill()}
 function pos(t,n){const narrow=canvas.clientWidth<640,xs=n===1?[.276]:n===2?[.225,.272]:[.31,.165,.17],ys=n===1?[.55]:n===2?[.38,.73]:[.55,.285,.795];
 const x=narrow?(n===3&&t.slot===0?.277:.212):xs[t.slot];return [t.team?1-x:x,narrow&&n===3?[.535,.235,.805][t.slot]:ys[t.slot]]}
 function river(y){const f=y/H;return Math.round((.49+.043*Math.sin(f*6.2-.55)+.023*Math.cos(f*12+1.4))*W/4)*4}
 function width(y){return Math.max(14,Math.round(W*(.04+.011*Math.cos(y/H*8))/3)*3)}
 function pine(x,y,s,light){
  g.save();g.translate(x|0,y|0);g.scale(s,s);rect(-7,0,18,3,"#465236");rect(-1,-8,4,10,"#584b35");rect(1,-6,2,8,"#9a7750");
  const p=light?["#324a3b","#486343","#6c8151","#83915a"]:["#283f35","#3b5840","#506f48","#6c8050"];
  for(const [yy,w] of [[-13,10],[-21,8],[-27,5]]){poly([[-w,yy+9],[-w,yy+6],[-w+3,yy+6],[-w+3,yy+2],[-3,yy-4],[0,yy-9],[3,yy-4],[w-2,yy+2],[w-2,yy+5],[w+1,yy+5],[w+1,yy+9],[2,yy+11]],p[0]);poly([[-w,yy+6],[-w+4,yy+1],[-w+4,yy-1],[-1,yy-8],[2,yy-5],[2,yy+1],[4,yy+3],[3,yy+6],[-3,yy+8]],p[2]);rect(-w+3,yy+4,4,2,p[3]);rect(1,yy+5,4,3,p[1])}g.restore()
 }
 function rock(x,y,s){g.save();g.translate(x|0,y|0);g.scale(s,s);rect(-5,1,15,2,"#526345");poly([[-6,-2],[-4,-6],[2,-8],[7,-6],[9,-2],[8,1],[4,3],[-4,2]],"#52605a");poly([[-6,-3],[-3,-7],[2,-8],[7,-6],[5,-3],[0,-2]],"#a0a38b");poly([[0,-2],[5,-3],[7,-5],[8,-2],[6,1],[0,1]],"#7a8371");rect(-4,-5,4,1,"#c1bda1");g.restore()}
 function bridge(y,angle){const mid=river(y),half=width(y)+14;for(let x=mid-half;x<mid+half;x+=4){const k=Math.round(y+(x-mid)*angle);rect(x,k-8,4,21,"#414e43");rect(x,k-8,3,17,"#927a52");rect(x,k-8,3,2,"#bc9b67");rect(x,k-4,3,6,"#aa9060");rect(x,k+7,3,2,"#736047");rect(x,k-11,4,2,"#6b5b42");rect(x,k+6,4,2,"#ceb07c");if((x-mid+half)%16===0){rect(x,k-14,3,9,"#554b39");rect(x,k-14,3,2,"#c3a578");rect(x,k+2,3,10,"#5a503d");rect(x,k+2,3,2,"#cfab71")}}}
 function terrain(){W=canvas.width;H=canvas.height;base.width=W;base.height=H;g=base.getContext("2d");g.imageSmoothingEnabled=false;const r=rand(71529);rect(0,0,W,H,"#89965f");const colors=["#8c995f","#83925d","#96a167","#778b5b","#9ba36a","#788b5b","#a0a56e"];
 for(let i=0;i<W*H/160;i++){const x=Math.floor(r()*W/5)*5,y=Math.floor(r()*H/3)*3,w=5+r()*25,h=3+r()*9,c=colors[Math.floor(r()*colors.length)];rect(x,y,w,h,c);rect(x+5,y-2,Math.max(3,w-10),2,c)}
 for(let y=0;y<H;y+=3){const m=river(y),rw=width(y);for(const v of [.13+.16*y/H,.84-.12*y/H]){rect(v*W-9,y,18,3,"#9ca16a");rect(v*W-7,y,3,3,"#acaa72");rect(v*W+5,y,2,3,"#aeaf78")}
 for(const [pad,c] of [[10,"#a6a474"],[7,"#a58f65"],[4,"#716e55"],[0,"#63948b"],[-3,"#538984"],[-8,"#487e7d"],[-11,"#447979"]])rect(m-rw-pad,y,2*(rw+pad),3,c);
 if(r()>.45)rect(m-rw,y,2+r()*5,1,"#a5c8a8");if(r()>.35)rect(m+rw-7,y,2+r()*5,1,"#88b5a1");for(let j=0;j<2;j++)rect(m+(r()*2-1)*(rw-6),y+r()*2,2+r()*5,1,r()>.6?"#81b6a8":"#699f98")}
 for(let i=0;i<W*H/30;i++){const x=r()*W,y=r()*H;if(Math.abs(x-river(y))<width(y)+9)continue;const c=r()>.58?"#a6ac73":"#718653";rect(x,y,1+r()*2,1,c);if(r()>.77){rect(x+1,y-2,1,2,c);rect(x+3,y-1,1,2,c)}}
 bridge(H*.22,.085);bridge(H*.77,-.09);const obj=[];
 for(const [cx,cy,n,spread] of [[.01,.11,23,.082],[.26,-.025,12,.065],[.68,-.04,12,.06],[.98,.1,25,.09],[.02,.95,25,.09],[.37,1.05,11,.063],[.66,1.05,8,.06],[.97,.98,24,.08]])for(let j=0;j<n;j++){const x=(cx+(r()-.5)*2*spread)*W,y=(cy+(r()-.5)*.23)*H,s=(.5+r()*.66)*scale;obj.push([y,()=>pine(x,y,s,r()>.55)])}
 for(const [cx,cy,n] of [[.073,.48,5],[.352,.17,4],[.42,.87,4],[.585,.43,3],[.9,.63,4],[.76,.95,4],[.23,.97,3],[.94,.34,3]])for(let j=0;j<n;j++){const x=cx*W+(r()-.5)*20*scale,y=cy*H+r()*7*scale,s=(.48+r()*.9)*scale;obj.push([y,()=>rock(x,y,s)])}
 for(const [cx,cy,team] of [[.066,.66,0],[.935,.45,1]]){const x=cx*W,y=cy*H,d=team?-1:1;rect(x,y-22,2,23,"#4a5245");poly([[x+1,y-22],[x+13*d,y-21],[x+10*d,y-17],[x+13*d,y-15],[x+1,y-16]],team?"#bf633c":"#4f91a2");rect(x+5,y-4,10,8,"#776245");rect(x+5,y-5,10,2,"#b79a68")}
 obj.sort((a,b)=>a[0]-b[0]).forEach(o=>o[1]());
 }
 function tank(x,y,t,lock,mine){const p=!t.hp?["#3c4038","#4a4e43","#666753","#837d61","#949078"]:t.team?["#493c32","#714c36","#a56343","#ce8757","#ecc08a"]:["#213841","#315563","#487e88","#6ca4a8","#b0cebd"];
 const s=scale*(canvas.clientWidth<640?.80:1.15);g.save();g.translate(x|0,y|0);g.scale(s*(t.team?-1:1),s);rect(-22,7,46,5,"#5c6547");rect(-18,11,36,2,"#737d52");
 if(lock||mine)for(const k of [-1,1])for(const h of [-1,1]){const a=k<0?-29:24,b=h<0?-18:15,c=lock?"#ffe9a2":"#93d7df";rect(a,b,7,1,c);rect(k<0?a:a+6,h<0?b:b-4,1,5,c)}
 poly([[-23,-5],[-19,-10],[13,-10],[19,-7],[22,0],[17,5],[-19,5],[-23,1]],p[0]);rect(-20,-7,36,4,p[1]);rect(-19,-8,33,1,p[3]);poly([[-24,1],[-20,-3],[17,-3],[23,1],[22,6],[17,10],[-17,10],[-23,6]],"#293833");rect(-19,0,36,7,"#415048");
 for(let i=0;i<6;i++){const a=-18+i*6;rect(a,1,5,5,"#263533");rect(a+1,2,3,3,"#788274");rect(a+2,3,1,1,"#35423c")}rect(-18,8,34,1,"#927f5c");
 poly([[-22,-5],[-17,-12],[12,-12],[20,-8],[22,-2],[17,2],[-17,2],[-22,-1]],p[0]);poly([[-20,-7],[-15,-11],[12,-11],[18,-8],[13,-5],[-17,-4]],p[3]);poly([[-19,-4],[14,-5],[20,-8],[20,-3],[15,0],[-17,0]],p[2]);rect(-18,-7,8,2,p[1]);rect(-15,-10,4,1,p[4]);rect(14,-5,3,2,p[4]);
 rect(-10,-14,23,8,p[0]);poly([[-11,-14],[-6,-19],[6,-19],[12,-16],[13,-11],[7,-8],[-9,-9]],p[1]);poly([[-10,-15],[-5,-18],[5,-18],[11,-15],[6,-13],[-10,-12]],p[3]);rect(-8,-12,16,3,p[2]);rect(-3,-19,7,3,p[0]);rect(-2,-19,5,1,p[4]);rect(9,-15,24,5,p[0]);rect(11,-15,19,2,p[3]);rect(13,-15,14,1,p[4]);rect(27,-16,7,6,p[1]);rect(28,-16,5,2,p[3]);rect(33,-15,2,4,p[0]);rect(-15,-16,1,5,p[0]);rect(-16,-20,1,5,p[0]);rect(-7,-11,3,2,p[4]);if(!t.hp)rect(-12,-11,22,3,"#3e4037");g.restore()}
 function draw(game,selected,own,now){if(!game||!base.width)return;g=ctx;g.imageSmoothingEnabled=false;g.drawImage(base,0,0);
 for(const t of game.tanks){const [x,y]=pos(t,game.size);tank(x*W,y*H,t,t.id===selected&&t.hp,t.id===own&&t.hp)}
 effects=effects.filter(e=>now-e.start<600);for(const e of effects){const a=game.tanks.find(t=>t.id===e.from),b=game.tanks.find(t=>t.id===e.to);if(!a||!b)continue;const aa=pos(a,game.size),bb=pos(b,game.size),f=(now-e.start)/360,x1=aa[0]*W+(a.team?-28:28)*scale,y1=aa[1]*H-12*scale,x2=bb[0]*W,y2=bb[1]*H-7*scale;if(f<=1){const x=x1+(x2-x1)*f,y=y1+(y2-y1)*f;g.strokeStyle="#ffdd7a";g.lineWidth=2;g.beginPath();g.moveTo(x-(x2-x1)*.06,y-(y2-y1)*.06);g.lineTo(x,y);g.stroke();rect(x-2,y-1,4,3,"#fff6c1")}else for(let i=0;i<9;i++){const d=(f-1)*24;rect(x2+Math.cos(i*.7)*d,y2+Math.sin(i*.7)*d,3,3,i%2?"#fff0a0":"#dd8d4e")}}
 }
 function resize(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;const u=r.width<640?1.4:1.65;canvas.width=Math.round(r.width/u);canvas.height=Math.round(r.height/u);scale=Math.min(1.22,Math.max(.68,canvas.height/245));terrain()}
 return {pos,resize,draw,animating:()=>effects.length>0,shoot:(from,to)=>effects.push({from,to,start:performance.now()})};
})();