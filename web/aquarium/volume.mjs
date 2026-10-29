// Build a closed, rounded volume from the same cutout used by the shop.
export function volumeData(pixels,width,height,{thickness=.15,bodyX=.58,bodyY=.5,bodyRX=.4,bodyRY=.34}={}){
 const cols=88,rows=28,positions=[],uvs=[],indices=[],stride=rows+1;
 const alpha=(x,y)=>pixels[(Math.max(0,Math.min(height-1,y))*width+Math.max(0,Math.min(width-1,x)))*4+3];
 const bounds=[];
 for(let i=0;i<=cols;i++){
  const x=Math.round(i/cols*(width-1));let top=height,bottom=-1;
  for(let y=0;y<height;y++)if(alpha(x,y)>32){top=Math.min(top,y);bottom=y;}
  if(bottom<top){top=height*.5;bottom=top+1;}
  bounds.push([top/height,bottom/height]);
 }
 for(let side=0;side<2;side++)for(let i=0;i<=cols;i++)for(let j=0;j<=rows;j++){
  const u=i/cols,t=j/rows,v=bounds[i][0]+(bounds[i][1]-bounds[i][0])*t;
  const oval=Math.max(0,1-((u-bodyX)/bodyRX)**2-((v-bodyY)/bodyRY)**2);
  const edge=Math.sin(t*Math.PI),z=(.004+thickness*Math.sqrt(oval))*Math.sqrt(Math.max(0,edge))*(side?-1:1);
  positions.push(u-.5,(.5-v)*height/width,z);uvs.push(u,1-v);
 }
 const count=(cols+1)*stride;
 for(let side=0;side<2;side++)for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
  const a=side*count+i*stride+j,b=a+stride,c=b+1,d=a+1;
  indices.push(...(side?[a,b,c,a,c,d]:[a,c,b,a,d,c]));
 }
 for(let i=0;i<cols;i++)for(const j of [0,rows]){
  const a=i*stride+j,b=(i+1)*stride+j;indices.push(a,a+count,b,b,a+count,b+count);
 }
 for(const i of [0,cols])for(let j=0;j<rows;j++){const a=i*stride+j,b=a+1;indices.push(a,b,a+count,b,b+count,a+count);}
 return {positions,uvs,indices};
}
