import * as THREE from '../vendor/three.module.mjs';
import {volumeData} from './volume.mjs';
const profiles={
 goldfish:{thickness:.21,bodyX:.59},guppy:{thickness:.105,bodyX:.65},'blue-tang':{thickness:.15,bodyX:.58},clownfish:{thickness:.19},
 angelfish:{thickness:.12,bodyRY:.23},betta:{thickness:.12,bodyX:.65,bodyRX:.28},pufferfish:{thickness:.31,bodyRX:.4},
 seahorse:{thickness:.09,bodyX:.48,bodyRX:.27},discus:{thickness:.14,bodyRY:.42}
};
export class AquariumScene{
 constructor(){
  this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
  this.renderer.setClearColor(0x000000,0);this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-500,500,300,-300,1,2000);this.camera.position.z=1000;
  this.ambient=new THREE.HemisphereLight(0xd7fbff,0x698e8d,2.25);this.scene.add(this.ambient);
  const light=new THREE.DirectionalLight(0xfff1ce,2.3);light.position.set(-250,500,650);this.scene.add(light);
  const rim=new THREE.DirectionalLight(0x68d9e7,1.0);rim.position.set(350,80,-250);this.scene.add(rim);
  this.templates=new Map();this.items=new Map();this.width=1000;this.height=600;
 }
 resize(w,h,dpr){this.width=w;this.height=h;this.renderer.setPixelRatio(Math.min(dpr,1.5));this.renderer.setSize(w,h,false);Object.assign(this.camera,{left:-w/2,right:w/2,top:h/2,bottom:-h/2});this.camera.updateProjectionMatrix();}
 template(kind,id,image){
  const key=kind+'/'+id;if(this.templates.has(key))return this.templates.get(key);
  const canvas=document.createElement('canvas');canvas.width=160;canvas.height=Math.max(8,Math.round(160*image.naturalHeight/image.naturalWidth));
  const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,canvas.width,canvas.height);
  const profile=kind==='fish'?(profiles[id]||{}):{thickness:.055,bodyX:.5,bodyRX:.48,bodyRY:.47};
  const data=volumeData(ctx.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height,profile);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(data.positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(data.uvs,2));geometry.setIndex(data.indices);geometry.computeVertexNormals();
  // Bleed the existing edge colours underneath the mesh seam. The silhouette
  // still comes from the original cutout, so turning cannot expose alpha cracks.
  let textureImage=image;
  if(kind==='fish'){
   const padded=document.createElement('canvas');padded.width=image.naturalWidth;padded.height=image.naturalHeight;
   const ink=padded.getContext('2d');ink.drawImage(image,0,0);ink.globalCompositeOperation='destination-over';
   const bleed=Math.max(2,Math.round(image.naturalWidth/80));
   for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)if(dx||dy)ink.drawImage(image,dx*bleed,dy*bleed);
   textureImage=padded;
  }
  const texture=new THREE.Texture(textureImage);texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;
  const material=new THREE.MeshStandardMaterial({map:texture,alphaTest:.12,roughness:kind==='fish'?.48:.82,metalness:kind==='fish'?.08:0,side:THREE.DoubleSide});
  const template={geometry,material};this.templates.set(key,template);return template;
 }
 item(kind,id,uid,image){
  const key=kind+'/'+uid;if(this.items.has(key))return this.items.get(key);
  const t=this.template(kind,id,image),material=t.material.clone(),mesh=new THREE.Mesh(t.geometry,material);
  const motion={time:{value:0},phase:{value:0},amount:{value:kind==='fish'&&id!=='seahorse'?.07:0}};
  material.onBeforeCompile=shader=>{shader.uniforms.uSwimTime=motion.time;shader.uniforms.uSwimPhase=motion.phase;shader.uniforms.uSwimAmount=motion.amount;
   shader.vertexShader='uniform float uSwimTime; uniform float uSwimPhase; uniform float uSwimAmount;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat tail = pow(clamp((0.15 - position.x) / 0.65, 0.0, 1.0), 1.8);\ntransformed.z += sin(uSwimTime + uSwimPhase - position.x * 7.0) * uSwimAmount * tail;');
  };
  material.customProgramCacheKey=()=>kind==='fish'?'swimming-volume':'static-volume';
  mesh.userData.motion=motion;mesh.frustumCulled=false;this.scene.add(mesh);this.items.set(key,mesh);return mesh;
 }
 begin(night){this.ambient.intensity=night?1.0:2.25;for(const mesh of this.items.values())mesh.visible=false;}
 fish(f,image,p,size,time){
  const mesh=this.item('fish',f.id,f.uid,image);mesh.visible=true;
  mesh.position.set(p.x-this.width/2,this.height/2-p.y,(f.z-.5)*180);
  mesh.scale.set(size,size*(1+Math.sin(time*2+f.phase)*.012),size);
  const depthYaw=f.target?Math.max(-.24,Math.min(.24,(f.target.z-f.z)*.9))+.04*Math.sin(time*.45+f.phase):0;
  mesh.rotation.set(0,-f.heading+depthYaw*Math.cos(f.heading),-Math.max(-.18,Math.min(.18,f.vy*2.2))*Math.cos(f.heading));
  mesh.userData.motion.time.value=time*(5+f.speed*55);mesh.userData.motion.phase.value=f.phase;
 }
 decor(d,image,p,size,depth,time){
  const mesh=this.item('decor',d.id,d.uid,image);mesh.visible=true;
  const ratio=image.naturalHeight/image.naturalWidth;
  mesh.position.set(p.x-this.width/2,this.height/2-p.y+size*ratio/2,depth);
  mesh.scale.setScalar(size);mesh.rotation.set(0,0,d.mount==='hanging'?Math.sin(time*.7+d.x)*.035:0);
 }
 finish(ctx){this.renderer.render(this.scene,this.camera);ctx.drawImage(this.renderer.domElement,0,0,this.width,this.height);}
 prune(fish,decor){const keep=new Set([...fish.map(x=>'fish/'+x.uid),...decor.map(x=>'decor/'+x.uid)]);for(const [key,mesh]of this.items)if(!keep.has(key)){this.scene.remove(mesh);mesh.material.dispose();this.items.delete(key);}}
 get ready(){return true;}
}
