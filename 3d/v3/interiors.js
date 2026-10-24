import * as THREE from 'three';
import {makePerson,poseUpdate,label} from '../common.js';
// Walk-in interiors: cutaway dioramas (back + left walls full height, front + right walls low) the avatar can tour.
const MC={};const M=(c,o={})=>{const k=c+JSON.stringify(o);return MC[k]||(MC[k]=new THREE.MeshStandardMaterial({color:c,roughness:0.8,...o}));};
const ct=(w,h,f)=>{const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;};
const TM=t=>new THREE.MeshStandardMaterial({map:t,roughness:0.85});
const SK=['#5c3520','#7a4a2e','#86553a','#6b3f26'],HAIR=['short','afro','puffs','braids','bun','short'];
function mergeStatic(g){g.updateMatrixWorld(true);const bk=new Map(),kill=[],v=new THREE.Vector3(),nm=new THREE.Matrix3();
 g.traverse(o=>{if(o.isMesh&&!o.userData.keep&&!Array.isArray(o.material)){let p=o.parent,dyn=false;while(p){if(p.userData.keep)dyn=true;p=p.parent;}if(dyn)return;const k=o.material.uuid+(o.castShadow?1:0);if(!bk.has(k))bk.set(k,{m:o.material,cs:o.castShadow,list:[]});bk.get(k).list.push(o);kill.push(o);}});
 const out=[];bk.forEach(b=>{let nv=0,ni=0;b.list.forEach(o=>{const n=o.geometry.attributes.position.count;nv+=n;ni+=o.geometry.index?o.geometry.index.count:n;});
  const P=new Float32Array(nv*3),N=new Float32Array(nv*3),U=new Float32Array(nv*2),I=new Uint32Array(ni);let vo=0,io=0;
  b.list.forEach(o=>{const ge=o.geometry,pa=ge.attributes.position,na=ge.attributes.normal,ua=ge.attributes.uv,mw=o.matrixWorld;nm.getNormalMatrix(mw);
   for(let i=0;i<pa.count;i++){const q=(vo+i)*3;v.fromBufferAttribute(pa,i).applyMatrix4(mw);P[q]=v.x;P[q+1]=v.y;P[q+2]=v.z;v.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();N[q]=v.x;N[q+1]=v.y;N[q+2]=v.z;if(ua){U[(vo+i)*2]=ua.getX(i);U[(vo+i)*2+1]=ua.getY(i);}}
   if(ge.index)for(let i=0;i<ge.index.count;i++)I[io++]=ge.index.getX(i)+vo;else for(let i=0;i<pa.count;i++)I[io++]=vo+i;vo+=pa.count;});
  const ge=new THREE.BufferGeometry();ge.setAttribute('position',new THREE.BufferAttribute(P,3));ge.setAttribute('normal',new THREE.BufferAttribute(N,3));ge.setAttribute('uv',new THREE.BufferAttribute(U,2));ge.setIndex(new THREE.BufferAttribute(I,1));ge.computeBoundingSphere();
  const me=new THREE.Mesh(ge,b.m);me.castShadow=b.cs;me.receiveShadow=true;out.push(me);});
 kill.forEach(o=>o.parent.remove(o));out.forEach(m=>g.add(m));}
export function createInterior(h){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#2e2228');
 const camera=new THREE.PerspectiveCamera(38,1,0.3,200);
 let RW=14,RD=10,RCD=13,R_pl=null,R_df=null;let R=null,player=null,P={x:0,z:0,ry:Math.PI,tx:null,tz:null},orbit=0.78,camT=new THREE.Vector3();
 function build(id){while(scene.children.length)scene.remove(scene.children[0]);RW=14;RD=10;RCD=13;R_pl=null;R_df=null;scene.background=new THREE.Color('#2e2228');
  scene.add(new THREE.HemisphereLight('#f6ead6','#4a3a40',1.15));const sun=new THREE.DirectionalLight('#ffe2b8',1.9);sun.position.set(-8,12,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-11,right:11,top:11,bottom:-11,near:1,far:40});sun.shadow.bias=-0.0005;scene.add(sun,sun.target);
  const g=new THREE.Group();scene.add(g);const obs=[],spots=[],npcs=[],fans=[];
  const B=(w,hh,d,c,x,y,z,sh=true)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,hh,d),c.isMaterial?c:M(c));m.position.set(x,y,z);m.castShadow=sh;m.receiveShadow=true;g.add(m);return m;};
  const C=(rt,rb,hh,c,x,y,z,seg=14)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,hh,seg),c.isMaterial?c:M(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};
  const block=(x,z,w,d)=>obs.push([x-w/2,z-d/2,x+w/2,z+d/2]);
  const plane=(w,hh,tex,x,y,z,ry=0,basic)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,hh),basic?new THREE.MeshBasicMaterial({map:tex}):TM(tex));m.position.set(x,y,z);m.rotation.y=ry;g.add(m);return m;};
  const person=(look,x,z,ry,pose,opt={})=>{const o=makePerson(look,opt.lod?{lod:1}:undefined);o.position.set(x,opt.y||0,z);o.rotation.y=ry;o.userData.keep=1;scene.add(o);const n={o,pose,x,z,...opt};npcs.push(n);if(!opt.walk)obs.push([x-0.3,z-0.3,x+0.3,z+0.3]);return n;};
  const kid=(k,x,z,ry,pose,opt)=>{k=Math.abs(k);return person({skin:SK[k%4],shirt:'#f4eedb',bottom:k%2?'#4a3340':'#22345e',hair:HAIR[k%6],skirt:k%2,...(opt&&opt.look||{})},x,z,ry,pose,opt);};
  const fan=(x,z,y)=>{const f=new THREE.Group();f.position.set(x,y,z);f.userData.keep=1;const bm=M('#e8e4da');f.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,0.12,12),bm));for(let k=0;k<3;k++){const b=new THREE.Mesh(new THREE.BoxGeometry(1.1,0.02,0.16),bm);b.position.x=0.6;const a=new THREE.Group();a.rotation.y=k*2.094;a.add(b);f.add(a);}scene.add(f);C(0.02,0.02,1.2,'#8d8a85',x,y+0.6,z,6);fans.push(f);};
  const spot=(x,z,r,text,btn,on)=>spots.push({x,z,r,text,btn,on});
  const shell=(W,D,H,wall,floorT,opt={})=>{const fl=new THREE.Mesh(new THREE.PlaneGeometry(W,D),TM(floorT));floorT.wrapS=floorT.wrapT=THREE.RepeatWrapping;floorT.repeat.set(W/2,D/2);fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;g.add(fl);
   const base=new THREE.Mesh(new THREE.BoxGeometry(W+1.2,0.5,D+1.2),M('#3b2b33'));base.position.y=-0.26;g.add(base);
   B(W+0.4,H,0.2,wall,0,H/2,-D/2-0.1);B(0.2,H,D+0.4,wall,-W/2-0.1,H/2,0);B(W+0.4,0.18,0.24,opt.trim||'#3a2a30',0,0.09,-D/2+0.02,false);B(0.24,0.18,D,opt.trim||'#3a2a30',-W/2+0.02,0.09,0,false);
   B(W+0.4,0.16,0.26,opt.trim||'#3a2a30',0,H,-D/2-0.1);B(0.26,0.16,D+0.4,opt.trim||'#3a2a30',-W/2-0.1,H,0);
   const dx=opt.door??W/2-2.2;B(dx+W/2-0.8,0.55,0.2,wall,(-W/2+dx-0.8)/2,0.27,D/2+0.1);B(W/2-dx-0.8,0.55,0.2,wall,(dx+0.8+W/2)/2,0.27,D/2+0.1);B(0.2,0.55,D+0.4,wall,W/2+0.1,0.27,0);
   B(0.14,2.4,0.24,'#4a3340',dx-0.85,1.2,D/2+0.1);B(0.14,2.4,0.24,'#4a3340',dx+0.85,1.2,D/2+0.1);B(1.84,0.16,0.24,'#4a3340',dx,2.45,D/2+0.1);B(1.4,0.02,0.8,'#a8553f',dx,0.012,D/2-0.45,false);
   if(opt.windows)for(let z=-D/2+1.6;z<D/2-1;z+=opt.windows){B(0.08,1.4,1.6,'#46606c',-W/2+0.02,1.9,z,false);B(0.12,0.1,1.8,'#ecdcbc',-W/2+0.06,1.15,z,false);B(0.12,0.1,1.8,'#ecdcbc',-W/2+0.06,2.65,z,false);for(let k=-1;k<=1;k++)B(0.1,1.4,0.06,'#ecdcbc',-W/2+0.05,1.9,z+k*0.78,false);}
   const dado=opt.dado||'#'+new THREE.Color(wall).multiplyScalar(0.82).getHexString();B(W+0.38,1.0,0.04,dado,0,0.5,-D/2+0.01,false);B(0.04,1.0,D+0.38,dado,-W/2+0.01,0.5,0,false);B(W+0.38,0.06,0.08,'#ecdcbc',0,1.02,-D/2+0.03,false);B(0.08,0.06,D+0.38,'#ecdcbc',-W/2+0.03,1.02,0,false);
   const ck=new THREE.Mesh(new THREE.CircleGeometry(0.28,24),new THREE.MeshStandardMaterial({map:ct(128,128,(c)=>{c.fillStyle='#fff';c.beginPath();c.arc(64,64,62,0,7);c.fill();c.strokeStyle='#3a2a30';c.lineWidth=6;c.stroke();for(let k=0;k<12;k++){const a=k/12*6.283;c.fillStyle='#3a2a30';c.fillRect(64+Math.cos(a)*50-2,64+Math.sin(a)*50-2,4,4);}c.lineWidth=5;c.beginPath();c.moveTo(64,64);c.lineTo(64,24);c.moveTo(64,64);c.lineTo(92,74);c.stroke();})}));ck.position.set(W/2-1.4,H-0.6,-D/2+0.02);g.add(ck);
   B(0.1,0.14,0.03,'#ecdcbc',-W/2+0.02,1.35,D/2-1.2,false);
   if(!opt.noTubes)for(const [x,z] of [[-W/4,-D/4],[W/4,-D/4],[-W/4,D/5],[W/4,D/5]]){B(1.3,0.05,0.16,'#d8d3c6',x,H-0.35,z,false);const tb=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,1.2,8),new THREE.MeshBasicMaterial({color:'#fff8e6'}));tb.rotation.z=Math.PI/2;tb.position.set(x,H-0.4,z);g.add(tb);[-0.5,0.5].forEach(o=>B(0.01,0.35,0.01,'#6b6b70',x+o,H-0.17,z,false));}
   if(opt.windows){const ov=new THREE.Mesh(new THREE.PlaneGeometry(D,H),new THREE.MeshBasicMaterial({color:'#f3e3bd'}));ov.rotation.y=Math.PI/2;ov.position.set(-W/2-1.6,H/2,0);g.add(ov);for(let z=-D/2+1.2;z<D/2;z+=2.4){const t=new THREE.Mesh(new THREE.IcosahedronGeometry(0.9,1),M('#6f8f68'));t.position.set(-W/2-1.1,2.2+Math.sin(z)*0.3,z);g.add(t);}}
   spot(dx,D/2-0.6,1.1,'Way out','Exit',()=>h.exit());return{W,D,H,dx};};
  const floorBoard=ct(64,64,(c,w,hh)=>{c.fillStyle='#b98b5e';c.fillRect(0,0,w,hh);for(let y=0;y<hh;y+=16){c.fillStyle=y%32?'#ad7f53':'#c29468';c.fillRect(0,y,w,15);c.fillStyle='rgba(0,0,0,0.15)';c.fillRect(0,y+15,w,1);c.fillRect((y*7)%w,y,1,16);}});
  const tiles=(a,b)=>ct(64,64,(c,w,hh)=>{for(let y=0;y<2;y++)for(let x=0;x<2;x++){c.fillStyle=(x+y)%2?a:b;c.fillRect(x*32,y*32,32,32);}c.strokeStyle='rgba(0,0,0,0.12)';c.strokeRect(0,0,32,32);c.strokeRect(32,32,32,32);});
  const desk=(x,z,c='#9a6a43')=>{B(1.2,0.06,0.55,c,x,0.74,z);B(1.15,0.3,0.04,c,x,0.58,z+0.25,false);[-0.55,0.55].forEach(dx=>[-0.24,0.24].forEach(dz=>B(0.05,0.72,0.05,'#4a3a40',x+dx,0.36,z+dz,false)));B(1.2,0.05,0.32,c,x,0.45,z+0.55);[-0.55,0.55].forEach(dx=>B(0.05,0.44,0.05,'#4a3a40',x+dx,0.22,z+0.55,false));block(x,z+0.2,1.25,1.0);};
  const shelf=(x,z,w,hh,ry,books=true)=>{const s=new THREE.Group();s.position.set(x,0,z);s.rotation.y=ry;g.add(s);const add=(m)=>{s.add(m);m.castShadow=true;m.receiveShadow=true;};const wood=M('#7a5236');
   const bb=(a,b,c,px,py,pz,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(a,b,c),mat||wood);m.position.set(px,py,pz);add(m);};bb(w,hh,0.06,0,hh/2,-0.2);[-w/2,w/2].forEach(px=>bb(0.06,hh,0.42,px,hh/2,0));const rows=Math.floor(hh/0.5);for(let r=0;r<=rows;r++)bb(w,0.05,0.42,0,0.05+r*(hh-0.1)/rows,0);
   if(books){const bt=ct(256,64,(c,cw,ch)=>{let x=0;while(x<cw){const bw=6+Math.random()*10;c.fillStyle=['#a8553f','#4f6e8a','#55745c','#e3a347','#4a3340','#c97a8a','#ecdcbc','#3f5e4c'][Math.floor(Math.random()*8)];const top=Math.random()*14;c.fillRect(x,top,bw-1,ch-top);c.fillStyle='rgba(255,255,255,0.35)';c.fillRect(x+1,top+8,bw-3,2);x+=bw;}});
    for(let r=0;r<rows;r++){const m=new THREE.Mesh(new THREE.BoxGeometry(w-0.1,(hh-0.1)/rows-0.08,0.3),[M('#6a4a34'),M('#6a4a34'),M('#6a4a34'),M('#6a4a34'),TM(bt),M('#6a4a34')]);m.position.set(0,0.1+r*(hh-0.1)/rows+((hh-0.1)/rows-0.08)/2,0.02);m.userData.keep=1;add(m);}}};
  let name='';
  if(id==='classroom'){name='SS1 Classroom';const S=shell(14,10,3.6,'#e9d9b4',floorBoard,{windows:2.4,door:4.8});
   const bt=ct(512,192,(c,w,hh)=>{c.fillStyle='#2f4536';c.fillRect(0,0,w,hh);c.fillStyle='rgba(240,234,220,0.9)';c.font='bold 30px "Patrick Hand",cursive';c.fillText('MATHEMATICS \u2014 INDICES',24,44);c.font='24px "Patrick Hand",cursive';['a\u1d50 \u00d7 a\u207f = a\u1d50\u207a\u207f','3\u00b2 \u00d7 3\u2074 = 3\u2076 = 729','Homework: Ex. 4b, Q1\u201310'].forEach((t,k)=>c.fillText(t,30,90+k*34));c.fillStyle='rgba(240,234,220,0.25)';c.fillRect(330,60,150,90);});
   B(6.2,2.1,0.1,'#6b4a2e',-0.5,2.0,-4.93);plane(6,1.9,bt,-0.5,2.0,-4.87);B(6.2,0.08,0.18,'#6b4a2e',-0.5,0.92,-4.85);for(let k=0;k<4;k++)B(0.12,0.04,0.04,'#f2e6cc',-2+k*0.3,0.97,-4.82,false);
   B(1.8,0.8,0.8,'#7a5236',-0.5,0.4,-3.4);B(1.9,0.06,0.9,'#8a6243',-0.5,0.82,-3.4);B(0.5,0.08,0.35,'#ecdcbc',-0.2,0.88,-3.4,false);C(0.08,0.08,0.18,'#4f6e8a',-1.1,0.94,-3.3,8);block(-0.5,-3.4,1.9,0.9);
   person({skin:'#6b3f26',shirt:'#4f6e8a',bottom:'#2b2b33',hair:'short',adult:1,glasses:1},1.2,-4.1,0.3,null,{talk:1});
   let k=0;for(let r=0;r<4;r++)for(let c=0;c<4;c++){const x=-4.6+c*2.4,z=-1.6+r*1.7;desk(x,z);if(!(r===3&&c===3)){[-0.3,0.3].forEach(o=>{if(Math.random()<0.8)kid(k++,x+o,z+0.55,Math.PI,['notes','listen','chat','doodle','sleep','notes'][Math.floor(Math.random()*6)],{y:0,sit:1});});}}
   const nb=ct(256,160,(c,w,hh)=>{c.fillStyle='#b5824f';c.fillRect(0,0,w,hh);[['#fff3c4',20,20],['#dfe8d8',120,30],['#f6d4d4',40,90],['#d4e2f0',150,95]].forEach(([col,x,y])=>{c.fillStyle=col;c.fillRect(x,y,80,55);c.fillStyle='#3a2a30';c.font='11px sans-serif';c.fillText('NOTICE',x+8,y+16);});});
   plane(2.4,1.5,nb,4.6,2.0,-4.89);B(1.0,2.0,0.4,'#7a5236',-6.5,1.0,-4.3);const ck=C(0.28,0.28,0.05,'#f2e6cc',3.0,3.0,-4.9,20);ck.rotation.x=Math.PI/2;
   B(0.05,1.3,0.05,'#8a6243',6.4,0.65,-4.6);fan(-2.5,-1,3.3);fan(2.5,1.8,3.3);
   spot(-0.5,-3.8,1.6,'Teacher\u2019s desk','Sit for class',()=>h.launch('class'));spot(2.6,3.5,1.3,'Empty seat at the back','Board games',()=>h.launch('board'));spot(4.6,-4.2,1.3,'Notice board: Inter-house sports on Friday!','Read',()=>h.toast('Inter-house sports on Friday. Red House are favourites.'));spot(-4,-4.2,1.3,'The chalk box is missing\u2026','Investigate',()=>h.launch('impostor'));}
  if(id==='canteen'){name="Mama Titi's Canteen";const S=shell(14,10,3.6,'#f2e6cc',tiles('#e8dcc4','#c9b48e'),{windows:3,door:4.6,trim:'#a8553f'});
   B(6.5,1.05,0.9,'#a8553f',-1,0.52,-3.4);B(6.7,0.08,1.0,'#ecdcbc',-1,1.08,-3.4);const gl=new THREE.Mesh(new THREE.BoxGeometry(6.2,0.45,0.6),new THREE.MeshStandardMaterial({color:'#cfe6ea',transparent:true,opacity:0.35,roughness:0.1}));gl.position.set(-1,1.34,-3.35);g.add(gl);block(-1,-3.4,6.7,1);
   [['#e0702a',-3.4],['#f0c24a',-2.2],['#c0392b',-1.0],['#8a5a34',0.2],['#55745c',1.4]].forEach(([c,x])=>{B(0.95,0.06,0.45,'#c9c9c9',x,1.14,-3.35,false);B(0.85,0.08,0.38,c,x,1.2,-3.35,false);});
   B(6.5,0.9,0.6,'#6b4a2e',-1,0.45,-4.65);for(let k=0;k<3;k++){C(0.3,0.26,0.4,'#3a3436',-3+k*1.6,1.1,-4.65,14);C(0.32,0.32,0.03,'#5a5458',-3+k*1.6,1.31,-4.65,14);}
   const mb=ct(320,200,(c,w,hh)=>{c.fillStyle='#2f4536';c.fillRect(0,0,w,hh);c.fillStyle='#f0c24a';c.font='bold 26px "Patrick Hand",cursive';c.fillText("MAMA TITI'S MENU",20,34);c.fillStyle='#f2e6cc';c.font='22px "Patrick Hand",cursive';[['Jollof rice & chicken','\u20a6450'],['Fried plantain','\u20a6150'],['Puff-puff (5)','\u20a610'],['Meat pie','\u20a630'],['Zobo (cold)','\u20a615']].forEach(([a,b],k)=>{c.fillText(a,22,72+k*28);c.fillText(b,240,72+k*28);});});
   plane(3.2,2,mb,-1,2.6,-4.87);person({skin:'#5c3520',shirt:'#c0392b',bottom:'#3a2a30',hair:'wrap',skirt:1,adult:1},-1,-4.0,0,null,{talk:1});
   B(1.1,2.1,0.8,'#d9d9d6',4.6,1.05,-4.4);const fr=new THREE.Mesh(new THREE.BoxGeometry(0.9,1.7,0.05),new THREE.MeshStandardMaterial({color:'#bfe2ee',emissive:'#6fa8bc',emissiveIntensity:0.5,roughness:0.2}));fr.position.set(4.6,1.1,-3.98);g.add(fr);for(let r=0;r<4;r++)for(let k=0;k<4;k++)C(0.05,0.05,0.24,['#a8323a','#e8901e','#55745c','#f0c24a'][k],4.3+k*0.2,0.45+r*0.4,-4.2,6);block(4.6,-4.4,1.1,0.8);
   for(let r=0;r<2;r++)for(let c=0;c<2;c++){const x=-3.6+c*5,z=0+r*2.6;B(3.6,0.06,1.0,'#9a6a43',x,0.76,z);[-1.6,1.6].forEach(dx=>B(0.08,0.74,0.8,'#4a3a40',x+dx,0.37,z,false));[-0.75,0.75].forEach(dz=>B(3.6,0.05,0.32,'#7a5236',x,0.45,z+dz));block(x,z,3.7,2.1);
    for(let s=0;s<3;s++){if(Math.random()<0.75)kid(r*7+c*3+s,x-1.1+s*1.1,z-0.75,0,'eat',{sit:1});if(Math.random()<0.6)kid(r*5+c+s+2,x-1.1+s*1.1,z+0.75,Math.PI,s%2?'eat':'chat',{sit:1});}
    for(let s=0;s<3;s++){B(0.36,0.03,0.28,'#e3a347',x-1.1+s*1.1,0.8,z-0.25,false);B(0.36,0.03,0.28,'#c0563f',x-1.1+s*1.1,0.8,z+0.25,false);}}
   for(let k=0;k<3;k++)B(0.7,0.55,0.45,'#d8c4a0',-6.3,0.28+k*0.02,1+k*0.7);fan(-3,0.5,3.3);fan(2,1.5,3.3);
   spot(-1,-2.6,1.6,'Counter: Mama Titi is serving','Buy food',()=>h.place('canteen'));spot(4.6,-3.4,1.2,'Cold drinks fridge','Look',()=>h.toast('Zobo, Malt and Fanta \u2014 all ice cold.'));}
  if(id==='library'){name='Library';const S=shell(14,10,3.8,'#e2d1ad',floorBoard,{windows:3,door:4.6});
   const crp=new THREE.Mesh(new THREE.PlaneGeometry(6,4),M('#7a3b3b'));crp.rotation.x=-Math.PI/2;crp.position.set(-1,0.01,0.8);crp.receiveShadow=true;g.add(crp);
   for(let k=0;k<5;k++){shelf(-5.4+k*2.6,-4.6,2.3,2.8,0);block(-5.4+k*2.6,-4.6,2.3,0.5);}for(let k=0;k<2;k++){shelf(-6.6,-1.5+k*2.6,2.3,2.4,Math.PI/2);block(-6.6,-1.5+k*2.6,0.5,2.3);}
   for(let k=0;k<2;k++){const x=-2.8+k*3.6;B(2.8,0.06,1.3,'#8a6243',x,0.76,0.8);[-1.25,1.25].forEach(dx=>[-0.5,0.5].forEach(dz=>B(0.07,0.74,0.07,'#4a3a40',x+dx,0.37,0.8+dz,false)));block(x,0.8,3,2.6);
    C(0.02,0.02,0.4,'#3a2a30',x+0.9,0.98,0.8,6);const sh=C(0.06,0.18,0.18,'#55745c',x+0.9,1.22,0.8,12);
    for(let s=0;s<2;s++){B(0.42,0.42,0.42,'#7a5236',x-0.8+s*1.6,0.24,1.75);kid(k*3+s+1,x-0.8+s*1.6,1.55,Math.PI,'read',{sit:1});B(0.3,0.02,0.22,['#4f6e8a','#a8553f'][s],x-0.8+s*1.6,0.8,1.2,false);}
    B(0.42,0.42,0.42,'#7a5236',x,0.24,-0.15);kid(k*3+5,x,0.05,0,'read',{sit:1});}
   B(2.6,1.0,0.8,'#6b4a2e',4.4,0.5,-1.6);B(2.7,0.06,0.9,'#8a6243',4.4,1.02,-1.6);block(4.4,-1.6,2.7,0.9);person({skin:'#7a4a2e',shirt:'#4a3340',bottom:'#3a2a30',hair:'bun',skirt:1,adult:1,glasses:1},4.4,-2.4,0,null,{talk:1});
   C(0.05,0.1,0.5,'#6b4a2e',3.6,1.3,-1.6,8);const gb=new THREE.Mesh(new THREE.SphereGeometry(0.25,16,12),M('#4f6e8a'));gb.position.set(3.6,1.75,-1.6);g.add(gb);
   const qt=ct(256,64,(c,w,hh)=>{c.fillStyle='#f2e6cc';c.fillRect(0,0,w,hh);c.fillStyle='#a8553f';c.font='bold 34px sans-serif';c.textAlign='center';c.fillText('SILENCE PLEASE',w/2,44);});plane(2,0.5,qt,4.4,3.0,-4.88);
   const FACTS=['Lagos means "lakes" in Portuguese.','The baobab tree can live for over 1,000 years.','Wole Soyinka was the first African to win the Nobel Prize in Literature.','The Niger is the third-longest river in Africa.','Honey never spoils.'];
   spot(-2.8,-3.9,1.6,'Bookshelves','Pick a book',()=>h.toast(FACTS[Math.floor(Math.random()*FACTS.length)]));spot(4.4,-0.6,1.4,'Librarian\u2019s desk','Study session',()=>h.launch('class'));}
  if(id==='lab'){name='Science Laboratory';const S=shell(14,10,3.6,'#dfe8d8',tiles('#e6e9e2','#c9d3c5'),{windows:2.6,door:4.6,trim:'#324b3d'});
   for(let r=0;r<2;r++)for(let c=0;c<2;c++){const x=-3.4+c*4.6,z=-1.2+r*3;B(3.4,0.9,1.1,'#3f5e4c',x,0.45,z);B(3.5,0.08,1.2,'#2a2a2e',x,0.94,z);B(0.5,0.05,0.4,'#9a9da2',x+1.2,0.99,z);C(0.02,0.02,0.4,'#b9bcc0',x+1.2,1.18,z-0.15,6);block(x,z,3.5,1.2);
    const cols=['#e3a347','#55745c','#4f6e8a','#c0563f','#c97a8a'];for(let k=0;k<4;k++){const m=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.09,0.24,12),new THREE.MeshStandardMaterial({color:cols[(k+r+c)%5],transparent:true,opacity:0.7,roughness:0.1}));m.position.set(x-1.2+k*0.45,1.1,z+0.2);g.add(m);}
    B(0.3,0.25,0.2,'#ecdcbc',x-0.4,1.1,z-0.3,false);for(let s=0;s<2;s++){C(0.18,0.18,0.06,'#3a2a30',x-0.8+s*1.6,0.62,z+0.9,12);C(0.03,0.03,0.6,'#9a9da2',x-0.8+s*1.6,0.3,z+0.9,6);kid(r*4+c*2+s,x-0.8+s*1.6,z+0.85,Math.PI,s?'notes':'listen',{sit:1,look:{coat:1}});}}
   B(2.2,2.4,0.9,'#c9ccd0',4.8,1.2,-4.4);B(1.8,1.0,0.05,'#bfe2ee',4.8,1.6,-3.94,false);B(2.0,0.08,0.7,'#2a2a2e',4.8,0.95,-4.2,false);C(0.15,0.15,0.9,'#c9ccd0',4.8,2.85,-4.6,10);block(4.8,-4.4,2.2,0.9);
   const pt=ct(360,200,(c,w,hh)=>{c.fillStyle='#f2e6cc';c.fillRect(0,0,w,hh);c.fillStyle='#324b3d';c.font='bold 18px sans-serif';c.fillText('PERIODIC TABLE',110,22);const lay=[[0,17],[0,1,12,13,14,15,16,17],[0,1,12,13,14,15,16,17]];for(let r=0;r<7;r++)for(let k=0;k<18;k++){if(r<3&&!lay[r].includes(k))continue;c.fillStyle=['#e3a347','#55745c','#4f6e8a','#c97a8a','#c0563f'][(k+r)%5];c.fillRect(8+k*19,32+r*23,17,21);}});
   plane(3.6,2,pt,-2,2.3,-4.88);B(5.5,0.9,0.6,'#3f5e4c',-2,0.45,-4.6);B(5.6,0.06,0.7,'#2a2a2e',-2,0.92,-4.6);block(-2,-4.6,5.6,0.7);
   const sk=new THREE.Group();sk.position.set(-6.2,0,-3.8);g.add(sk);const bn=M('#f2ecdc');[[0.16,0.08,0.06,0,1.55],[0.06,0.5,0.06,0,1.2],[0.3,0.04,0.04,0,1.38],[0.04,0.4,0.04,-0.15,1.15],[0.04,0.4,0.04,0.15,1.15],[0.04,0.55,0.04,-0.07,0.6],[0.04,0.55,0.04,0.07,0.6]].forEach(([a,b,c,x,y])=>{const m=new THREE.Mesh(new THREE.BoxGeometry(a,b,c),bn);m.position.set(x,y,0);m.castShadow=true;sk.add(m);});const sku=new THREE.Mesh(new THREE.SphereGeometry(0.1,12,10),bn);sku.position.y=1.68;sk.add(sku);C(0.2,0.25,0.06,'#3a2a30',-6.2,0.03,-3.8,12);C(0.02,0.02,1.7,'#3a2a30',-6.32,0.85,-3.8,6);block(-6.2,-3.8,0.6,0.6);
   person({skin:'#86553a',shirt:'#f4f4f0',bottom:'#2b2b33',hair:'short',adult:1,coat:1,glasses:1},0.6,-3.6,0.3,null,{talk:1});
   spot(-1.1,0.3,1.4,'Lab bench','Mix chemicals',()=>{h.toast('Fizz! The mixture turns bright green.');});spot(4.8,-3.4,1.4,'Fume cupboard: someone\u2019s been here\u2026','Investigate',()=>h.launch('impostor'));spot(-6.2,-3.1,1.2,'Mr Bones the skeleton','Wave',()=>h.toast('Mr Bones waves back. Probably.'));}
  if(id==='admin'){name='Admin Block';const S=shell(14,10,3.6,'#efe2c6',tiles('#d9cdb5','#c4b593'),{windows:3,door:4.6,trim:'#4a3340'});
   B(4.2,1.1,0.8,'#4a3340',-1.5,0.55,-1.2);B(4.3,0.07,0.9,'#d9c7a3',-1.5,1.13,-1.2);block(-1.5,-1.2,4.3,0.9);B(0.5,0.35,0.05,'#2a2a2e',-2.3,1.38,-1.4,false);B(0.55,0.03,0.25,'#3a3a40',-2.3,1.18,-1.25,false);
   person({skin:'#6b3f26',shirt:'#c97a8a',bottom:'#3a2a30',hair:'bun',skirt:1,adult:1},-2.2,-1.9,0,null,{talk:1});
   B(6,1.1,0.15,'#d9c7a3',3.6,0.55,-2.6);B(6,0.12,0.2,'#7a5236',3.6,1.14,-2.6);const pg=new THREE.Mesh(new THREE.BoxGeometry(5.9,1.6,0.04),new THREE.MeshStandardMaterial({color:'#cfe6ea',transparent:true,opacity:0.22,roughness:0.1}));pg.position.set(3.6,1.95,-2.6);g.add(pg);B(6,0.1,0.18,'#7a5236',3.6,2.8,-2.6);[0.6,6.6].forEach(x=>B(0.1,2.8,0.18,'#7a5236',x,1.4,-2.6));B(1.0,2.3,0.08,'#7a5236',2.2,1.15,-2.5);const pl=ct(256,48,(c,w,hh)=>{c.fillStyle='#d9b45a';c.fillRect(0,0,w,hh);c.fillStyle='#3a2a30';c.font='bold 26px sans-serif';c.textAlign='center';c.fillText('PRINCIPAL',w/2,34);});plane(0.9,0.18,pl,2.2,2.55,-2.45);obs.push([0.6,-2.8,6.8,-2.4]);
   B(2.2,0.8,1.0,'#6b4a2e',4.2,0.4,-3.8);B(2.3,0.06,1.1,'#7a5236',4.2,0.82,-3.8);person({skin:'#5c3520',shirt:'#f4f4f0',bottom:'#2b2b33',hair:'short',adult:1,glasses:1},4.2,-4.5,0,null,{talk:1});
   [[3.4,'#008751'],[5.0,'#4a3340']].forEach(([x,c])=>{C(0.02,0.02,2.2,'#d9d9d9',x,1.1,-4.7,6);B(0.6,0.4,0.02,c,x+0.31,1.9,-4.7,false);});
   B(2.6,2.2,0.6,'#6b4a2e',-4.6,1.1,-4.6);B(2.4,1.8,0.05,'#cfe6ea',-4.6,1.25,-4.28,false);block(-4.6,-4.6,2.6,0.6);for(let r=0;r<2;r++)for(let k=0;k<4;k++){C(0.08,0.05,0.22,'#d9b45a',-5.5+k*0.6,0.8+r*0.7,-4.5,10);C(0.12,0.12,0.04,'#d9b45a',-5.5+k*0.6,0.96+r*0.7,-4.5,10);}
   for(let k=0;k<3;k++){B(0.5,0.05,0.5,'#4f6e8a',-5.8,0.45,0.6+k*0.7);B(0.5,0.5,0.05,'#4f6e8a',-6.05,0.7,0.6+k*0.7);block(-5.8,0.6+k*0.7,0.6,0.6);}
   C(0.25,0.2,0.4,'#a8553f',-6.3,0.2,3.3,10);const pf=new THREE.Mesh(new THREE.IcosahedronGeometry(0.5,1),M('#55745c'));pf.position.set(-6.3,0.85,3.3);pf.castShadow=true;g.add(pf);
   for(let k=0;k<3;k++){B(0.8,0.6,0.04,'#6b4a2e',-3+k*1.2,2.6,-4.9,false);B(0.65,0.45,0.02,['#d4e2f0','#dfe8d8','#f6d4d4'][k],-3+k*1.2,2.6,-4.87,false);}
   B(0.6,1.3,0.5,'#8d9096',0.6,0.65,-4.6);B(0.6,1.3,0.5,'#8d9096',-0.1,0.65,-4.6);block(0.25,-4.6,1.3,0.5);
   spot(-1.5,-0.3,1.6,'Reception: the secretary looks up','Quests',()=>h.launch('quests'));spot(-4.6,-3.8,1.4,'Trophy cabinet','Look',()=>h.toast('Inter-house champions: Red House 2023, Blue House 2024\u2026 2026?'));spot(2.2,-1.9,1.2,'Principal\u2019s office','Knock',()=>h.toast('"Come back after assembly!" says the Principal.'));}
  if(id==='common'){name='Common Room';const S=shell(14,10,3.4,'#e3a347',floorBoard,{windows:3,door:4.6,trim:'#a8553f'});
   const rg=new THREE.Mesh(new THREE.PlaneGeometry(5,3.6),M('#4f6e8a'));rg.rotation.x=-Math.PI/2;rg.position.set(-2.4,0.01,-1.6);rg.receiveShadow=true;g.add(rg);
   B(2.4,0.6,0.5,'#4a3340',-2.4,0.3,-4.6);const tv=new THREE.Mesh(new THREE.BoxGeometry(2.2,1.25,0.08),new THREE.MeshStandardMaterial({color:'#5a7f9c',emissive:'#3f7aa6',emissiveIntensity:0.9}));tv.position.set(-2.4,1.4,-4.7);g.add(tv);B(2.3,1.35,0.06,'#1d1d1d',-2.4,1.4,-4.76,false);block(-2.4,-4.6,2.4,0.5);
   [[-3.4,-0.4],[-1.4,-0.4]].forEach(([x,z])=>{B(1.8,0.45,0.9,'#c0563f',x,0.22,z);B(1.8,0.6,0.25,'#a8453a',x,0.6,z+0.4);B(0.22,0.6,0.9,'#a8453a',x-0.85,0.4,z);B(0.22,0.6,0.9,'#a8453a',x+0.85,0.4,z);block(x,z,1.9,1);kid(Math.round(x),x-0.4,z+0.05,Math.PI,'tv',{sit:1,y:0.1});kid(Math.round(x)+3,x+0.4,z+0.05,Math.PI,'tv',{sit:1,y:0.1});});
   B(2.6,0.06,1.5,'#2f7a3a',3.2,0.76,-2.6);B(0.02,0.16,1.5,'#f2e6cc',3.2,0.86,-2.6,false);[-1.2,1.2].forEach(dx=>[-0.6,0.6].forEach(dz=>B(0.06,0.74,0.06,'#3a2a30',3.2+dx,0.37,-2.6+dz,false)));block(3.2,-2.6,2.7,1.6);
   kid(7,1.6,-2.6,Math.PI/2,null,{swing:1});kid(8,4.8,-2.6,-Math.PI/2,null,{swing:1});
   B(1.2,0.06,1.2,'#9a6a43',-3.6,0.72,2.4);C(0.05,0.05,0.7,'#3a2a30',-3.6,0.36,2.4,6);const ld=ct(128,128,(c,w,hh)=>{c.fillStyle='#f2e6cc';c.fillRect(0,0,w,hh);[['#c0563f',0,0],['#4f6e8a',80,0],['#e3a347',0,80],['#55745c',80,80]].forEach(([col,x,y])=>{c.fillStyle=col;c.fillRect(x,y,48,48);});c.fillStyle='#3a2a30';c.fillRect(48,48,32,32);});const lb=new THREE.Mesh(new THREE.PlaneGeometry(0.9,0.9),TM(ld));lb.rotation.x=-Math.PI/2;lb.position.set(-3.6,0.76,2.4);g.add(lb);block(-3.6,2.4,1.3,1.3);
   [[-3.6,1.5,0],[-4.5,2.4,Math.PI/2],[-2.7,2.4,-Math.PI/2]].forEach(([x,z,ry],k)=>{B(0.45,0.45,0.45,'#7a5236',x,0.22,z);kid(10+k,x,z,ry+(k?0:Math.PI)*0,'cards',{sit:1});});
   B(1.0,2.0,0.8,'#c0563f',5.6,1.0,1.4);B(0.7,1.1,0.05,'#cfe6ea',5.6,1.25,1.82,false);block(5.6,1.4,1.0,0.8);
   for(let k=0;k<3;k++){const bb=new THREE.Mesh(new THREE.SphereGeometry(0.45,14,10),M(['#e3a347','#55745c','#c97a8a'][k]));bb.scale.set(1,0.6,1);bb.position.set(1.2+k*1.1,0.27,2.6);bb.castShadow=true;g.add(bb);block(1.2+k*1.1,2.6,0.8,0.8);}
   spot(-3.6,3.3,1.4,'Ludo table: they need one more player','Board games',()=>h.launch('board'));spot(3.2,-1.4,1.4,'Table tennis','Watch',()=>h.toast('Rally of 23! The whole room cheers.'));spot(-2.4,-3.3,1.4,'TV: football highlights','Football',()=>h.launch('field'));}
  if(id==='prom'){name='Prom Night · School Hall';RW=18;RD=13;RCD=17;scene.background=new THREE.Color('#2a2238');
   const S=shell(18,13,5.2,'#a99bc7',tiles('#3d6e73','#37666a'),{door:6,trim:'#c9a86a',dado:'#7d6fa0',noTubes:1});
   const GOLD=M('#d9b878',{metalness:0.55,roughness:0.32}),NAVY='#1f4a55';
   // back wall pilasters + left wall windows, curtains, sconces
   [-8.3,-3.6,6.6,8.5].forEach(x=>{B(0.4,5.2,0.18,'#b8abd3',x,2.6,-6.42,false);B(0.5,0.18,0.24,GOLD,x,5.1,-6.4,false);});
   [-3.8,0,3.8].forEach(z=>{B(0.05,3.4,1.6,'#24344f',-8.97,2.5,z,false);[-1,1].forEach(s=>{for(let f=0;f<4;f++)C(0.13,0.16,4.3,NAVY,-8.84,2.15,z+s*(0.92+f*0.17),8);});B(0.26,0.45,2.8,NAVY,-8.84,4.35,z);B(0.28,0.07,2.82,GOLD,-8.84,4.1,z);});
   [-1.9,1.9].forEach(z=>{B(0.12,0.32,0.22,GOLD,-8.92,2.7,z,false);const gl=new THREE.Mesh(new THREE.SphereGeometry(0.1,8,6),new THREE.MeshBasicMaterial({color:'#ffd9a0'}));gl.position.set(-8.82,2.92,z);g.add(gl);});
   // dance floor
   const dfT=ct(512,384,(c,w,hh)=>{const gr=c.createRadialGradient(w/2,hh/2,20,w/2,hh/2,w*0.62);gr.addColorStop(0,'#fbf2ec');gr.addColorStop(1,'#d8c6e6');c.fillStyle=gr;c.fillRect(0,0,w,hh);c.strokeStyle='#c9a86a';c.lineWidth=12;c.strokeRect(10,10,w-20,hh-20);c.lineWidth=3;c.strokeRect(36,36,w-72,hh-72);
    c.beginPath();c.arc(w/2,hh/2,92,0,7);c.stroke();c.beginPath();c.arc(w/2,hh/2,60,0,7);c.stroke();for(let k=0;k<8;k++){const a=k/8*6.283;c.beginPath();c.moveTo(w/2+Math.cos(a)*60,hh/2+Math.sin(a)*60);c.lineTo(w/2+Math.cos(a)*150,hh/2+Math.sin(a)*118);c.stroke();}
    [[36,36],[w-36,36],[36,hh-36],[w-36,hh-36]].forEach(([x,y])=>{c.beginPath();c.moveTo(x-26,y);c.lineTo(x,y-26);c.lineTo(x+26,y);c.lineTo(x,y+26);c.closePath();c.stroke();});});
   const dfM=new THREE.MeshStandardMaterial({map:dfT,roughness:0.14,metalness:0.18,emissive:'#3a2a50',emissiveIntensity:0.15});const df=new THREE.Mesh(new THREE.BoxGeometry(8.4,0.05,5.8),dfM);df.position.set(0,0.025,0.6);df.receiveShadow=true;df.userData.keep=1;g.add(df);
   B(8.6,0.06,0.14,GOLD,0,0.03,-2.3,false);B(8.6,0.06,0.14,GOLD,0,0.03,3.5,false);B(0.14,0.06,5.9,GOLD,-4.27,0.03,0.6,false);B(0.14,0.06,5.9,GOLD,4.27,0.03,0.6,false);
   {const CF=['#f2c4cf','#d9b878','#b9a6dc','#9fd3cf'];for(let k=0;k<70;k++){const a=k*2.4,r=4.4+(k%7)*0.22;const m=B(0.08,0.008,0.05,CF[k%4],Math.cos(a)*r*1.05,0.012,0.6+Math.sin(a)*r*0.72,false);m.rotation.y=a;}}
   // stage
   const sx=1.5,sz=-5.2,ST='#4a3e5e';B(8,0.7,2.4,ST,sx,0.35,sz);B(8.1,0.06,2.5,'#c9a86a',sx,0.72,sz,false);B(3.4,0.48,0.32,ST,sx,0.24,sz+1.36);B(3.4,0.24,0.4,ST,sx,0.12,sz+1.72);B(3.42,0.03,0.05,GOLD,sx,0.49,sz+1.52,false);block(sx,sz+0.25,8.1,3.3);
   [-1,1].forEach(s=>{B(0.5,4.6,0.5,GOLD,sx+s*4.2,2.3,sz-0.85);for(let f=0;f<5;f++)C(0.17,0.2,4.2,NAVY,sx+s*(3.85-f*0.3),2.8,sz-0.7,8);const ti=C(0.05,0.05,0.5,GOLD,sx+s*2.6,2.4,sz-0.62,6);ti.rotation.z=Math.PI/2;});
   B(9,0.55,0.5,GOLD,sx,4.85,sz-0.85);const arc=new THREE.Mesh(new THREE.TorusGeometry(4.1,0.14,8,40,Math.PI),GOLD);arc.position.set(sx,0.6,sz-0.6);arc.scale.y=1.02;g.add(arc);
   for(let x=sx-2.5;x<=sx+2.51;x+=0.36)C(0.2,0.2,4.0,'#d9b87a',x,2.7,sz-1.05,8);
   for(let k=0;k<6;k++){const sw=new THREE.Mesh(new THREE.TorusGeometry(0.62,0.13,6,12,Math.PI),M(NAVY));sw.rotation.z=Math.PI;sw.position.set(sx-3.1+k*1.24,4.45,sz-0.6);g.add(sw);}
   const prT=ct(512,320,(c,w,hh)=>{c.fillStyle='#1d2a44';c.fillRect(0,0,w,hh);c.strokeStyle='#d9b878';c.lineWidth=8;c.strokeRect(14,14,w-28,hh-28);c.lineWidth=2;c.strokeRect(30,30,w-60,hh-60);[[46,46],[w-46,46],[46,hh-46],[w-46,hh-46]].forEach(([x,y])=>{c.beginPath();c.arc(x,y,12,0,7);c.stroke();});
    c.fillStyle='#f0d9a0';c.textAlign='center';c.font='bold 86px Georgia,serif';c.fillText('PROM',w/2,138);c.fillText('NIGHT',w/2,222);c.font='bold 42px Georgia,serif';c.fillText('2026',w/2,282);});
   plane(3.2,2.0,prT,sx,2.6,sz-0.98,0,true);B(3.4,2.2,0.08,GOLD,sx,2.6,sz-1.04,false);
   B(2.0,1.0,0.8,'#2e2640',sx,1.22,sz+0.35);B(2.1,0.06,0.9,'#d9b878',sx,1.74,sz+0.35,false);[-0.5,0.5].forEach(o=>C(0.22,0.22,0.04,'#1a1a1e',sx+o,1.8,sz+0.35,16));
   const md=new THREE.Mesh(new THREE.CircleGeometry(0.32,24),GOLD);md.position.set(sx,1.22,sz+0.76);g.add(md);
   [-1,1].forEach(s=>{B(0.62,1.3,0.5,'#1e1a22',sx+s*3.4,1.37,sz+0.5);[1.15,1.65].forEach(y=>{const cn=C(y>1.4?0.12:0.2,y>1.4?0.12:0.2,0.03,'#3a3440',sx+s*3.4,y,sz+0.76,14);cn.rotation.x=Math.PI/2;});C(0.12,0.14,0.18,'#2a2430',sx+s*2.2,0.81,sz+1.0,10);});
   [-1,1].forEach(s=>{const sp=new THREE.SpotLight('#ffd9a0',38,16,0.5,0.6,1.4);sp.position.set(sx+s*3.4,5.6,sz+4.2);sp.target.position.set(sx,0.9,sz);scene.add(sp,sp.target);});
   person({skin:'#5c3520',shirt:'#f2efe6',bottom:'#22252b',trousers:1,casual:1,hair:'short',adult:1},sx,sz-0.15,0,null,{y:0.72,lod:1,dance:1,ry0:0,dj:1});
   // balloons
   const BAL=['#b9a6dc','#ead7b0','#f2c4cf','#f7f1ea','#d9b878'].map(c=>M(c,{roughness:0.26,metalness:0.18}));const balG=new THREE.SphereGeometry(1,12,9);
   const bal=(x,y,z,r,ci)=>{const m=new THREE.Mesh(balG,BAL[ci%5]);m.position.set(x,y,z);m.scale.setScalar(r);m.castShadow=true;g.add(m);};
   const arch=(cx,cz,rx,ry,seed,fl)=>{for(let i=0;i<=26;i++){const a=i/26*Math.PI,lx=Math.cos(a)*rx,ly=Math.sin(a)*ry;for(let j=0;j<2;j++){const r=0.15+((i*7+j*3+seed)%5)*0.025;bal(cx+lx+(((i*13+j*5)%7)-3)*0.04,0.15+ly+j*0.1,cz+(((i*3+j*11)%7)-3)*0.05,r,i+j+seed);}
     if(fl&&i%2===0){const f=new THREE.Mesh(balG,M(i%4?'#e89ab4':'#5f7f5a'));f.position.set(cx+lx,0.2+ly,cz+0.18);f.scale.setScalar(0.13);g.add(f);}}};
   B(3.2,0.12,2.0,'#efe3cf',-6.3,0.06,-5.0);B(2.8,2.7,0.1,'#f3eadb',-6.3,1.4,-5.9);const spk=ct(128,128,(c,w,hh)=>{c.fillStyle='#f3eadb';c.fillRect(0,0,w,hh);for(let k=0;k<160;k++){c.fillStyle=k%3?'rgba(217,184,120,0.7)':'rgba(255,255,255,0.9)';c.fillRect((k*37)%w,(k*71)%hh,2,2);}c.strokeStyle='#d9b878';c.lineWidth=4;c.strokeRect(20,10,88,108);c.beginPath();c.arc(64,48,34,Math.PI,0);c.stroke();});plane(2.6,2.5,spk,-6.3,1.4,-5.84);
   arch(-6.3,-5.3,1.75,2.75,0);block(-6.3,-5.4,3.4,1.2);
   arch(6,5.35,1.25,2.45,2,1);[4.75,7.25].forEach(x=>{bal(x,0.3,5.35,0.3,1);bal(x,0.55,5.45,0.26,2);block(x,5.35,0.5,0.5);});
   {const cg=ct(384,256,(c,w,hh)=>{c.fillStyle='#f4eef8';c.fillRect(0,0,w,hh);for(let k=0;k<90;k++){c.fillStyle=['#d9b878','#f2c4cf','#b9a6dc'][k%3];c.beginPath();c.arc((k*53)%w,(k*97)%hh,3,0,7);c.fill();}c.fillStyle='#3a2a50';c.textAlign='center';c.font='italic bold 64px "Patrick Hand",cursive';c.fillText('Congrats',w/2,112);c.fillText('Graduates!',w/2,184);});
    plane(2.6,1.7,cg,7.4,1.8,-6.38);for(let k=0;k<22;k++){const a=k/21*Math.PI*1.1-0.05;bal(7.4+Math.cos(a)*1.55,1.8+Math.sin(a)*1.25+(a>Math.PI?-0.2:0),-6.15,0.17+(k%3)*0.04,k);}for(let k=0;k<6;k++)bal(6.0+k*0.55,0.22+(k%2)*0.12,-6.0,0.22,k+1);block(7.4,-6.0,3.4,0.6);}
   // refreshments
   [[-7.7,-1.6],[-7.7,1.2]].forEach(([x,z],k)=>{B(1.1,0.78,2.5,'#f4efe8',x,0.39,z);B(0.5,0.02,2.52,GOLD,x,0.79,z,false);block(x,z,1.2,2.6);
    if(k===0){[['#e8901e',-0.7],['#a8323a',0],['#e3c35a',0.7]].forEach(([c,o])=>{const d=C(0.15,0.15,0.4,new THREE.MeshStandardMaterial({color:c,transparent:true,opacity:0.75,roughness:0.1}),x,1.0,z+o,12);C(0.16,0.16,0.04,'#c9ccd0',x,1.22,z+o,12);});}
    else{C(0.38,0.38,0.2,'#f7f1ea',x,0.9,z-0.5,18);C(0.28,0.28,0.18,'#f2c4cf',x,1.09,z-0.5,18);C(0.18,0.18,0.16,'#f7f1ea',x,1.26,z-0.5,18);for(let q=0;q<6;q++)C(0.07,0.06,0.07,['#e3a347','#a8553f','#f2e6cc'][q%3],x+((q%2)-0.5)*0.4,0.83,z+0.3+Math.floor(q/2)*0.25,8);}});
   // round tables
   const CH_='#b4a5d6';[[6.0,-1.9],[7.6,1.0],[5.8,3.4]].forEach(([x,z],k)=>{C(0.78,0.78,0.74,'#f4efe8',x,0.37,z,24);C(0.82,0.82,0.03,'#fbf8f3',x,0.755,z,24);const rn=B(1.6,0.012,0.34,GOLD,x,0.775,z,false);rn.rotation.y=0.6+k;
    C(0.07,0.09,0.2,'#d9e6ea',x,0.87,z,10);for(let q=0;q<5;q++){const f=new THREE.Mesh(balG,M(q%2?'#e89ab4':'#f7e1ea'));f.position.set(x+Math.cos(q*1.3)*0.1,1.02+(q%2)*0.05,z+Math.sin(q*1.3)*0.1);f.scale.setScalar(0.08);g.add(f);}
    for(let q=0;q<4;q++){const a=q*Math.PI/2+0.4,cx=x+Math.cos(a)*1.15,cz=z+Math.sin(a)*1.15;const ch=new THREE.Group();ch.position.set(cx,0,cz);ch.rotation.y=-a-Math.PI/2;g.add(ch);
     const s1=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.06,0.42),M(CH_));s1.position.y=0.46;const s2=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.6,0.06),M(CH_));s2.position.set(0,0.78,-0.2);ch.add(s1,s2);[[-0.18,-0.18],[0.18,-0.18],[-0.18,0.18],[0.18,0.18]].forEach(([a2,b2])=>{const l=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.46,0.04),GOLD);l.position.set(a2,0.23,b2);ch.add(l);});}
    block(x,z,2.6,2.6);});
   // welcome easel
   {const wt=ct(256,320,(c,w,hh)=>{c.fillStyle='#1d2a44';c.fillRect(0,0,w,hh);c.strokeStyle='#d9b878';c.lineWidth=6;c.strokeRect(12,12,w-24,hh-24);c.fillStyle='#f0d9a0';c.textAlign='center';c.font='bold 30px Georgia,serif';c.fillText('WELCOME TO',w/2,110);c.font='bold 52px Georgia,serif';c.fillText('PROM',w/2,180);c.fillText('NIGHT',w/2,236);});
    plane(0.9,1.15,wt,3.5,1.35,5.6,0,true);[-0.35,0.35].forEach(o=>{const l=B(0.04,1.7,0.04,GOLD,3.5+o,0.8,5.55,false);l.rotation.x=-0.12;});block(3.5,5.6,1,0.4);}
   // pendants + fairy lights
   [[-4.8,-2.6],[4.8,-2.8],[-4.6,3.4],[0,3.9],[4.2,3.2]].forEach(([x,z])=>{C(0.012,0.012,1.2,'#3a2a30',x,4.6,z,4);const sh=new THREE.Mesh(new THREE.ConeGeometry(0.42,0.36,16,1,true),M('#d9b878',{metalness:0.5,roughness:0.35,side:THREE.DoubleSide}));sh.position.set(x,3.85,z);g.add(sh);const bu=new THREE.Mesh(new THREE.SphereGeometry(0.12,10,8),new THREE.MeshBasicMaterial({color:'#fff0c8'}));bu.position.set(x,3.72,z);g.add(bu);});
   {const fbM=new THREE.MeshBasicMaterial({color:'#ffe6a6'}),fbG=new THREE.SphereGeometry(0.05,6,4);[[[-8.6,5.0,-6.3],[-2,4.6,6.2]],[[-3,5.0,-6.3],[3,4.6,6.2]],[[3,5.0,-6.3],[8.6,4.6,6.2]],[[-8.8,4.9,0],[8.8,4.9,0]],[[-8.8,4.9,-3.6],[8.8,4.9,-3.6]],[[-8.8,4.8,3.2],[8.8,4.8,3.2]]].forEach(([a,b])=>{for(let i=0;i<=30;i++){const t=i/30;const m=new THREE.Mesh(fbG,fbM);m.position.set(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-Math.sin(t*Math.PI)*0.75,a[2]+(b[2]-a[2])*t);g.add(m);}});}
   // accent lights (cycle colour when the DJ plays)
   const PLC=[['#4fd1c5',-4,2.2],['#b48cff',4,2.2],['#ff9ec7',0,-1.6]];R_pl=PLC.map(([c,x,z])=>{const l=new THREE.PointLight(c,9,13,1.5);l.position.set(x,3.2,z);scene.add(l);return{l,c};});R_df=df;
   // guests in formalwear
   const FL=[{shirt:'#2f3a52',bottom:'#2f3a52',trousers:1,hair:'short'},{shirt:'#b9a6dc',bottom:'#b9a6dc',gown:1,skirt:1,hair:'bun'},{coat:1,coatC:'#8a7ab8',bottom:'#8a7ab8',trousers:1,hair:'short'},{shirt:'#1f6e72',bottom:'#1f6e72',gown:1,skirt:1,hair:'wrap'},{shirt:'#1e2230',bottom:'#1e2230',vest:1,trousers:1,hair:'afro'},{shirt:'#ead7b0',bottom:'#ead7b0',gown:1,skirt:1,hair:'braids'},{shirt:'#3a7d6a',bottom:'#3a7d6a',trousers:1,hair:'short'},{shirt:'#d98aa8',bottom:'#d98aa8',gown:1,skirt:1,hair:'puffs'}];
   const fk=(k,x,z,ry,pose,opt={})=>person({skin:SK[k%4],casual:1,...FL[k%FL.length]},x,z,ry,pose,{lod:1,...opt});
   [[-2.6,-0.9],[2.6,-0.9],[-2.5,2.5],[2.5,2.5]].forEach(([x,z],k)=>{fk(k*2,x-0.36,z,Math.PI/2,null,{dance:1,ry0:Math.PI/2});fk(k*2+1,x+0.36,z,-Math.PI/2,null,{dance:1,ry0:-Math.PI/2});});
   fk(5,0.2,3.0,Math.PI,null,{dance:1,ry0:Math.PI});
   [[6.0,-1.9],[7.6,1.0],[5.8,3.4]].forEach(([x,z],k)=>[0,2].forEach(q=>{const a=q*Math.PI/2+0.4;fk(k*3+q+1,x+Math.cos(a)*1.15,z+Math.sin(a)*1.15,Math.atan2(x-(x+Math.cos(a)),z-(z+Math.sin(a))),'chat',{sit:1});}));
   fk(3,-6.75,-4.7,0,'wave');fk(4,-5.85,-4.7,0,null);fk(6,-6.7,-1.4,-Math.PI/2,'eat');fk(1,-6.6,1.2,-Math.PI/2,'chat');fk(2,5.0,-3.4,-0.6,'chat');fk(7,5.6,-3.0,-2.4,'chat');
   spot(0,0.6,1.5,'Dance floor','Dance',()=>h.prom&&h.prom('dance'));spot(sx-2.4,sz+2.15,1.3,'DJ Kunle\u2019s booth','Music',()=>h.prom&&h.prom('dj'));spot(sx+1.2,sz+2.15,1.3,'The stage: awards at the end of the night','Awards',()=>h.prom&&h.prom('awards'));
   spot(-6.3,-3.4,1.4,'Photo booth','Take a photo',()=>h.prom&&h.prom('photo'));spot(-6.4,-0.2,1.4,'Refreshments: zobo, small chops, cake','Grab a snack',()=>h.prom&&h.prom('snack'));spot(4.4,0.7,1.4,'Tables: classmates chatting','Talk',()=>h.prom&&h.prom('talk'));}
  // ceiling light glow
  const pl=new THREE.PointLight('#ffe7c2',6,14,1.6);pl.position.set(0,3.2,0);scene.add(pl);
  mergeStatic(g);
  R={id,name,obs,spots,npcs,fans,sun,W:RW,D:RD,dx:4.6,cd:RCD,pl:R_pl,df:R_df,party:true};return R;}
 const free=(x,z)=>{if(!R)return false;if(Math.abs(x)>R.W/2-0.35||z<-R.D/2+0.35||z>R.D/2-0.3)return false;for(const o of R.obs)if(x>o[0]-0.28&&x<o[2]+0.28&&z>o[1]-0.28&&z<o[3]+0.28)return false;return true;};
 function enter(id,look){build(id);player=makePerson(look);const lb=label('YOU','#a8553f');lb.position.y=2.3;player.add(lb);scene.add(player);const ex=R.spots[0];P={x:ex.x,z:R.D/2-1.0,ry:Math.PI,tx:null,tz:null};player.position.set(P.x,0,P.z);camT.set(P.x,0,P.z);snap=true;return R.name;}
 let snap=false;
 function update(dt,t,keys){if(!R)return;const fx=-Math.sin(orbit),fz=-Math.cos(orbit);let kf=(keys['w']||keys['arrowup']?1:0)-(keys['s']||keys['arrowdown']?1:0),kr=(keys['d']||keys['arrowright']?1:0)-(keys['a']||keys['arrowleft']?1:0);let mx=0,mz=0,mv=false;
  if(kf||kr){P.tx=null;mx=fx*kf-fz*kr;mz=fz*kf+fx*kr;}else if(P.tx!=null){mx=P.tx-P.x;mz=P.tz-P.z;if(Math.hypot(mx,mz)<0.12)P.tx=null;}
  const l=Math.hypot(mx,mz);if(l>0.01){mx/=l;mz/=l;const sp=2.6*dt,nx=P.x+mx*sp,nz=P.z+mz*sp;if(free(nx,nz)){P.x=nx;P.z=nz;mv=true;}else if(free(nx,P.z)){P.x=nx;mv=true;}else if(free(P.x,nz)){P.z=nz;mv=true;}else P.tx=null;
   const a=Math.atan2(mx,mz);P.ry+=(((a-P.ry+Math.PI*3)%(Math.PI*2))-Math.PI)*Math.min(1,dt*12);}
  player.position.set(P.x,0,P.z);player.rotation.y=P.ry;poseUpdate(player,dt,mv,null,1);
  if(R.pl){R.pl.forEach((p,i)=>{if(R.party)p.l.color.setHSL((t*0.08+i*0.33)%1,0.75,0.62);else p.l.color.set(p.c);});R.df.material.emissiveIntensity=R.party?0.22+Math.sin(t*4)*0.08:0.12;}
  R.npcs.forEach(n=>{if(n.dance){const u=n.o.userData;poseUpdate(n.o,dt,false,null);const b=t*(R.party?7.2:3.2)+n.x*3+n.z;n.o.position.y=(n.y||0)+Math.abs(Math.sin(b))*(n.dj?0.03:0.07);n.o.rotation.y=n.ry0+Math.sin(b*0.5)*(n.dj?0.2:0.5);u.arms[0].rotation.x=-1.5+Math.sin(b)*(R.party?0.9:0.4);u.arms[1].rotation.x=-1.5-Math.sin(b)*(R.party?0.9:0.4);return;}if(n.swing){n.o.rotation.y+=Math.sin(t*6+n.x)*0.01;poseUpdate(n.o,dt,false,'wave');n.o.userData.arms[1].rotation.x=-1.2+Math.sin(t*7+n.x)*0.6;}else poseUpdate(n.o,dt,false,n.pose||null);if(n.talk){n.o.userData.head.rotation.y=Math.sin(t*0.8+n.x)*0.4;}});
  R.fans.forEach(f=>f.rotation.y+=dt*7);
  camT.lerp(new THREE.Vector3(P.x*0.55,0.6,P.z*0.45-1.2),snap?1:Math.min(1,dt*3));snap=false;const dist=R.cd||13;camera.position.set(camT.x+Math.sin(orbit)*dist*0.78,camT.y+dist*0.72,camT.z+Math.cos(orbit)*dist*0.78);camera.lookAt(camT);}
 const ray=new THREE.Raycaster(),v2=new THREE.Vector2(),gp=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();
 function tap(cx,cy,r){if(!R)return;v2.set((cx-r.left)/r.width*2-1,-(cy-r.top)/r.height*2+1);ray.setFromCamera(v2,camera);if(ray.ray.intersectPlane(gp,hit)){P.tx=THREE.MathUtils.clamp(hit.x,-R.W/2+0.4,R.W/2-0.4);P.tz=THREE.MathUtils.clamp(hit.z,-R.D/2+0.4,R.D/2-0.4);}}
 function prompt(){if(!R)return null;let best=null,bd=1e9;R.spots.forEach(s=>{const d=Math.hypot(s.x-P.x,s.z-P.z);if(d<s.r&&d<bd){bd=d;best=s;}});return best;}
 return{scene,camera,enter,update,tap,prompt,orbit(dx){orbit=THREE.MathUtils.clamp(orbit+dx*0.004,0.15,1.45);},resize(a){camera.aspect=a;camera.updateProjectionMatrix();},party(on){if(R)R.party=on;},leave(){R=null;while(scene.children.length)scene.remove(scene.children[0]);}};}
