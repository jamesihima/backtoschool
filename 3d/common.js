import * as THREE from 'three';
export {THREE};
const MC={};
export const M=(c,o={})=>{const k=c+JSON.stringify(o);return MC[k]||(MC[k]=new THREE.MeshStandardMaterial({color:c,roughness:0.85,metalness:0,...o}));};
export const box=(w,h,d,c,o)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),c&&c.isMaterial?c:M(c,o));m.castShadow=true;m.receiveShadow=true;return m;};
export const cyl=(rt,rb,h,c,seg=12,o)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),c&&c.isMaterial?c:M(c,o));m.castShadow=true;m.receiveShadow=true;return m;};
export const at=(m,x,y,z)=>{m.position.set(x,y,z);return m;};
export function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
export function label(text,bg,fg){const t=canvasTex(512,96,(g,w,h)=>{g.font='700 46px "Atkinson Hyperlegible",sans-serif';const tw=Math.min(w-8,g.measureText(text).width+40);g.fillStyle=bg;g.beginPath();g.roundRect((w-tw)/2,10,tw,76,38);g.fill();g.fillStyle=fg||'#fff';g.textAlign='center';g.textBaseline='middle';g.fillText(text,w/2,50);});const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,transparent:true}));s.scale.set(2.4,0.45,1);s.renderOrder=10;return s;}
export function signTex(text,bg='#fbf7ee',fg='#1f3a6b'){return canvasTex(1024,128,(g,w,h)=>{g.fillStyle=bg;g.fillRect(0,0,w,h);g.strokeStyle='#3a2c22';g.lineWidth=10;g.strokeRect(5,5,w-10,h-10);g.fillStyle=fg;let fs=60;g.font=`700 ${fs}px "Atkinson Hyperlegible",sans-serif`;while(g.measureText(text).width>w-50&&fs>20){fs-=4;g.font=`700 ${fs}px "Atkinson Hyperlegible",sans-serif`;}g.textAlign='center';g.textBaseline='middle';g.fillText(text,w/2,h/2+3);});}
export const TX={
 louvre:canvasTex(128,128,(g,w,h)=>{g.fillStyle='#486f9c';g.fillRect(0,0,w,h);g.strokeStyle='#d9e6f0';g.lineWidth=3;for(let y=14;y<h-8;y+=11){g.beginPath();g.moveTo(10,y);g.lineTo(w-10,y);g.stroke();}g.strokeStyle='#f4f0e6';g.lineWidth=10;g.strokeRect(5,5,w-10,h-10);g.beginPath();g.moveTo(w/2,5);g.lineTo(w/2,h-5);g.stroke();}),
 glass:canvasTex(128,128,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#9cc3e3');gr.addColorStop(1,'#5f8db8');g.fillStyle=gr;g.fillRect(0,0,w,h);g.strokeStyle='#e8eef2';g.lineWidth=8;g.strokeRect(4,4,w-8,h-8);}),
 door:canvasTex(64,128,(g,w,h)=>{g.fillStyle='#2f5a3e';g.fillRect(0,0,w,h);g.strokeStyle='#244530';g.lineWidth=4;g.strokeRect(8,8,w-16,h/2-12);g.strokeRect(8,h/2+4,w-16,h/2-12);g.fillStyle='#d9b45a';g.fillRect(w-16,h/2,6,6);})
};
export const SKS=['#6b3f26','#7a4a2e','#5c3520','#86553a'];
export const playerLook=g=>({skin:'#7a4a2e',shirt:'#f4eedb',bottom:'#22345e',hair:g==='girl'?'puffs':'short',skirt:g==='girl'?1:0});
export {makePerson,poseUpdate,skinM} from './person.js';
export function grid(walk,x0,z0,cell){const h=walk.length,w=walk[0].length;return{walk,w,h,cell,x0,z0,
 cellOf(x,z){return[Math.floor((x-x0)/cell),Math.floor((z-z0)/cell)];},
 center(i,j){return[x0+(i+0.5)*cell,z0+(j+0.5)*cell];},
 ok(i,j){return i>=0&&j>=0&&i<w&&j<h&&walk[j][i];},
 free(x,z){const c=this.cellOf(x,z);return this.ok(c[0],c[1]);}};}
export function makeGrid(x0,z0,W,D,cell,obst){const w=Math.ceil(W/cell),h=Math.ceil(D/cell),walk=[];
 for(let j=0;j<h;j++){const r=[];for(let i=0;i<w;i++){const a=x0+i*cell+0.04,b=z0+j*cell+0.04,c=a+cell-0.08,d=b+cell-0.08;r.push(!obst.some(o=>c>o[0]&&a<o[2]&&d>o[1]&&b<o[3]));}walk.push(r);}
 return grid(walk,x0,z0,cell);}
export function findPath(G,s,g){
 if(!G.ok(g[0],g[1])){let best=null,bd=1e9;for(let dj=-5;dj<=5;dj++)for(let di=-5;di<=5;di++){const c=[g[0]+di,g[1]+dj];if(G.ok(c[0],c[1])){const d=di*di+dj*dj;if(d<bd){bd=d;best=c;}}}if(!best)return null;g=best;}
 const key=(i,j)=>j*G.w+i,open=[s],inO=new Set([s[1]*G.w+s[0]]),came={},gs={[key(s[0],s[1])]:0},fs={[key(s[0],s[1])]:0},H=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);let it=0;
 while(open.length&&it++<2500){let bi=0;for(let k=1;k<open.length;k++)if(fs[key(open[k][0],open[k][1])]<fs[key(open[bi][0],open[bi][1])])bi=k;const c=open.splice(bi,1)[0];inO.delete(key(c[0],c[1]));
  if(c[0]===g[0]&&c[1]===g[1]){const p=[c];let k=key(c[0],c[1]);while(came[k]){p.unshift(came[k]);k=key(came[k][0],came[k][1]);}return p;}
  for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const n=[c[0]+di,c[1]+dj];if(!G.ok(n[0],n[1]))continue;
   if(di&&dj&&(!G.ok(n[0],c[1])||!G.ok(c[0],n[1])))continue;const t=gs[key(c[0],c[1])]+(di&&dj?1.41:1),nk=key(n[0],n[1]);
   if(t<(gs[nk]??1e9)){came[nk]=c;gs[nk]=t;fs[nk]=t+H(n,g);if(!inO.has(nk)){open.push(n);inO.add(nk);}}}}return null;}
export class Walker{constructor(o,x,z,speed){this.o=o;this.speed=speed;this.path=[];this.wait=0.5+Math.random()*4;this.place(x,z);}
 place(x,z){this.x=x;this.z=z;this.path=[];this.o.position.set(x,0,z);}
 goTo(G,x,z,exact=true,jit=0){const s=G.cellOf(this.x,this.z),gc=G.cellOf(x,z);const p=findPath(G,s,gc);if(!p)return false;p.shift();
  this.path=p.map(c=>{const w=G.center(c[0],c[1]);return[w[0]+(Math.random()-0.5)*jit,w[1]+(Math.random()-0.5)*jit];});
  if(exact&&G.free(x,z)){if(this.path.length)this.path[this.path.length-1]=[x,z];else this.path=[[x,z]];}return true;}
 step(dt){if(!this.path.length)return false;const [tx,tz]=this.path[0];const dx=tx-this.x,dz=tz-this.z,d=Math.hypot(dx,dz),m=this.speed*dt;
  this.face(dx,dz,dt);if(d<=m){this.x=tx;this.z=tz;this.path.shift();}else{this.x+=dx/d*m;this.z+=dz/d*m;}this.o.position.set(this.x,0,this.z);
  if(!this.path.length&&this.onArrive){const f=this.onArrive;this.onArrive=null;f();}return true;}
 face(dx,dz,dt){if(Math.hypot(dx,dz)<1e-4)return;const a=Math.atan2(dx,dz),r=this.o.rotation.y;const df=((a-r+Math.PI*3)%(Math.PI*2))-Math.PI;this.o.rotation.y=r+df*Math.min(1,dt*12);}}
