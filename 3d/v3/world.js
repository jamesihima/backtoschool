import * as THREE from 'three';
import {PAL,L,bx,cy,Batch,windMat,sunRig,wind} from './look.js';
import {makePerson,poseUpdate,Walker,grid,label} from '../common.js';
const rnd=(()=>{let s=1234567;return()=>{s=(s*16807)%2147483647;return s/2147483647;};})();
const pick=a=>a[Math.floor(rnd()*a.length)];
const V3=THREE.Vector3;
const ct=(w,h,f)=>{const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;};
// ---------- textures ----------
function winTex(cols,rows,frame='#f2e6cc',g1='#46606c',g2='#8eaeb2'){return ct(128,128,(g,w,h)=>{g.fillStyle=frame;g.fillRect(0,0,w,h);const m=9,pw=(w-m*(cols+1))/cols,ph=(h-m*(rows+1))/rows;
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const x=m+c*(pw+m),y=m+r*(ph+m),gr=g.createLinearGradient(x,y,x+pw,y+ph);gr.addColorStop(0,g2);gr.addColorStop(0.55,g1);gr.addColorStop(1,g1);g.fillStyle=gr;g.fillRect(x,y,pw,ph);
  g.fillStyle='rgba(255,255,255,0.16)';g.beginPath();g.moveTo(x,y+ph*0.55);g.lineTo(x+pw*0.45,y);g.lineTo(x+pw*0.7,y);g.lineTo(x,y+ph*0.95);g.fill();}});}
const ribTex=(base,dark)=>{const t=ct(32,16,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);g.fillStyle=dark;g.fillRect(0,0,4,h);g.fillStyle='rgba(255,255,255,0.12)';g.fillRect(5,0,2,h);});t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;};
const brickTex=()=>{const t=ct(128,64,(g,w,h)=>{g.fillStyle='#e2cfb0';g.fillRect(0,0,w,h);for(let r=0;r<8;r++)for(let c=-1;c<5;c++){g.fillStyle=['#a8553f','#9c4c39','#b0614a'][(r*3+c+9)%3];g.fillRect(c*32+(r%2)*16+1,r*8+1,30,6);}});t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;};
const solarTex=ct(128,84,(g,w,h)=>{g.fillStyle='#d9d6cc';g.fillRect(0,0,w,h);g.fillStyle='#2d3858';g.fillRect(5,5,w-10,h-10);g.strokeStyle='#6a7ca6';g.lineWidth=1.4;for(let x=5;x<=w-5;x+=19.6){g.beginPath();g.moveTo(x,5);g.lineTo(x,h-5);g.stroke();}for(let y=5;y<=h-5;y+=18.5){g.beginPath();g.moveTo(5,y);g.lineTo(w-5,y);g.stroke();}g.fillStyle='rgba(255,255,255,0.12)';g.beginPath();g.moveTo(5,h-5);g.lineTo(60,5);g.lineTo(80,5);g.lineTo(25,h-5);g.fill();});
const doorTex=ct(64,128,(g,w,h)=>{g.fillStyle='#4a3340';g.fillRect(0,0,w,h);g.fillStyle='#5c4050';g.fillRect(5,6,25,h-10);g.fillRect(34,6,25,h-10);g.fillStyle='#3a2a30';g.fillRect(9,12,17,40);g.fillRect(38,12,17,40);g.fillRect(9,64,17,52);g.fillRect(38,64,17,52);g.fillStyle='#d9b45a';g.fillRect(27,66,3,10);g.fillRect(34,66,3,10);});
const glassDoorTex=ct(64,128,(g,w,h)=>{g.fillStyle='#e9dcc0';g.fillRect(0,0,w,h);g.fillStyle='#4f6b76';g.fillRect(5,5,25,h-8);g.fillRect(34,5,25,h-8);g.fillStyle='rgba(255,255,255,0.2)';g.fillRect(8,8,6,h-14);g.fillRect(37,8,6,h-14);});
const netTex=(()=>{const t=ct(64,64,(g,w,h)=>{g.strokeStyle='rgba(255,255,255,0.9)';g.lineWidth=2;for(let k=0;k<=w;k+=8){g.beginPath();g.moveTo(k,0);g.lineTo(k,h);g.stroke();g.beginPath();g.moveTo(0,k);g.lineTo(w,k);g.stroke();}});t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;})();
function signTex(text,bg='#3a2a30',fg='#ecdcbc',w=1024,h=128){return ct(w,h,(g)=>{g.fillStyle=bg;g.fillRect(0,0,w,h);g.fillStyle=fg;let fs=h*0.5;g.font=`700 ${fs}px "Atkinson Hyperlegible",sans-serif`;while(g.measureText(text).width>w-40&&fs>14){fs-=2;g.font=`700 ${fs}px "Atkinson Hyperlegible",sans-serif`;}g.textAlign='center';g.textBaseline='middle';g.fillText(text,w/2,h/2+3);});}
export function buildWorld(W){
 const N=W.N,T=2,X=i=>(i-N/2)*T,Z=j=>(j-N/2)*T;const sc=new THREE.Scene();sc.background=new THREE.Color('#3b2b33');
 const sun=sunRig(sc);const ext=62;
 [[25,17],[26,17],[25,18],[26,18],[26,23],[28,25],[22,26],[23,24]].forEach(([i,j])=>{if(W.walk[j])W.walk[j][i]=false;});
 sc.add(bx(ext*2,3,ext*2,PAL.earth,0,-1.52,0,'SM_Base_Slab'));
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(ext*2,ext*2),L(PAL.grass));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;ground.name='SM_Ground';sc.add(ground);
 const flat=(w,d,c,x,z,y=0.02,name)=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(w,d),c.isMaterial?c:L(c));p.rotation.x=-Math.PI/2;p.position.set(x,y,z);p.receiveShadow=true;if(name)p.name=name;sc.add(p);return p;};
 const tileB=new Batch(new THREE.BoxGeometry(T,0.05,T),new THREE.MeshLambertMaterial({color:'#ffffff'}),false);
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const t=W.tiles[j][i];if(t==='g'||t==='r'||t==='f')continue;const h=((i*73+j*151)%17)/17;const c=new THREE.Color(PAL.path).multiplyScalar(0.96+h*0.06);tileB.add(X(i)+1,0.025,Z(j)+1,1,1,1,0,'#'+c.getHexString());}
 tileB.flush(sc,'SM_Campus_Paving');
 // paving joints
 const jB=new Batch(new THREE.BoxGeometry(1,0.01,1),L('#c8b089'),false);for(let j=0;j<N;j++)for(let i=0;i<N;i++){if(W.tiles[j][i]!=='p')continue;jB.add(X(i)+1,0.052,Z(j),T,1,0.05);jB.add(X(i),0.052,Z(j)+1,0.05,1,T);}jB.flush(sc);
 // ---------- roads ----------
 const dashB=new Batch(new THREE.BoxGeometry(1.4,0.02,0.16),L(PAL.line),false);
 const road=(x0,z0,x1,z1,horiz)=>{flat(x1-x0,z1-z0,PAL.road,(x0+x1)/2,(z0+z1)/2,0.03,'SM_Road');
  if(horiz){for(let x=x0+1;x<x1;x+=3.2)dashB.add(x,0.05,(z0+z1)/2);flat(x1-x0,2.6,PAL.walk,(x0+x1)/2,z0-1.3,0.04);flat(x1-x0,2.6,PAL.walk,(x0+x1)/2,z1+1.3,0.04);sc.add(bx(x1-x0,0.14,0.18,PAL.curb,(x0+x1)/2,0.07,z0),bx(x1-x0,0.14,0.18,PAL.curb,(x0+x1)/2,0.07,z1));}
  else{for(let z=z0+1;z<z1;z+=3.2)dashB.add((x0+x1)/2,0.05,z,1,1,1,Math.PI/2);flat(2.6,z1-z0,PAL.walk,x0-1.3,(z0+z1)/2,0.04);flat(2.6,z1-z0,PAL.walk,x1+1.3,(z0+z1)/2,0.04);sc.add(bx(0.18,0.14,z1-z0,PAL.curb,x0,0.07,(z0+z1)/2),bx(0.18,0.14,z1-z0,PAL.curb,x1,0.07,(z0+z1)/2));}};
 road(-ext,26.4,ext,31,true);road(-ext,-39,ext,-34.5,true);road(-39,-34.5,-34.5,26.4,false);road(34.5,-34.5,39,26.4,false);
 for(let k=0;k<7;k++)sc.add(bx(0.55,0.02,4.4,PAL.line,-3+k*1,0.05,28.7));
 // bus park
 flat(30,6.2,PAL.road2,-20,37.2,0.03,'SM_BusPark');for(let x=-34;x<=-6;x+=4)sc.add(bx(0.12,0.02,5.4,PAL.line,x,0.05,37.2));
 // ---------- perimeter ----------
 const pick_=new Batch(new THREE.BoxGeometry(0.08,1.5,0.08),L(PAL.fence));
 const fenceLine=(x0,z0,x1,z1,skip)=>{const len=Math.hypot(x1-x0,z1-z0),n=Math.floor(len/0.34);for(let k=0;k<=n;k++){const t=k/n,x=x0+(x1-x0)*t,z=z0+(z1-z0)*t;if(skip&&skip(x,z))continue;pick_.add(x,1.15,z);}
  const ax=Math.abs(x1-x0)>0.1,segs=skip?[[x0,-4.2],[4.2,x1]]:[[ax?x0:z0,ax?x1:z1]];
  segs.forEach(([a,b])=>{const m=(a+b)/2,l=b-a;if(ax)sc.add(bx(l,0.45,0.4,PAL.cream,m,0.22,z0),bx(l,0.06,0.06,PAL.fence,m,1.75,z0),bx(l,0.06,0.06,PAL.fence,m,0.85,z0));else sc.add(bx(0.4,0.45,l,PAL.cream,x0,0.22,m),bx(0.06,0.06,l,PAL.fence,x0,1.75,m),bx(0.06,0.06,l,PAL.fence,x0,0.85,m));
   for(let p=a;p<=b;p+=6)sc.add(ax?bx(0.5,1.9,0.5,PAL.cream,p,0.95,z0):bx(0.5,1.9,0.5,PAL.cream,x0,0.95,p));});};
 fenceLine(-30,26,30,26,x=>Math.abs(x)<4.2);fenceLine(-30,-30,30,-30);fenceLine(-30,-30,-30,26);fenceLine(30,-30,30,26);pick_.flush(sc,'SM_Fence_Pickets');
 [-4.7,4.7].forEach(x=>sc.add(bx(1.1,3.2,1.1,PAL.cream,x,1.6,26),bx(1.3,0.25,1.3,PAL.creamD,x,3.3,26),cy(0.25,0.3,0.35,PAL.creamD,x,3.6,26,8)));
 {const gs=new THREE.Mesh(new THREE.PlaneGeometry(6.4,0.8),new THREE.MeshBasicMaterial({map:signTex('UNITY SECONDARY SCHOOL')}));gs.position.set(0,4.05,26.53);sc.add(gs,bx(7.2,1.0,0.3,PAL.plum,0,4.05,26.35));}
 const gbar=new Batch(new THREE.BoxGeometry(0.06,2.1,0.06),L('#231c1e'));
 [[-4.15,1],[4.15,-1]].forEach(([hx,s])=>{const leaf=new THREE.Group();leaf.position.set(hx,0,26);leaf.rotation.y=s*0.55;leaf.add(bx(3.9,0.1,0.1,'#231c1e',s*1.95,2.2,0),bx(3.9,0.1,0.1,'#231c1e',s*1.95,0.2,0),bx(3.9,0.08,0.08,'#231c1e',s*1.95,1.2,0));for(let k=0.15;k<3.9;k+=0.24)leaf.add(bx(0.05,2.1,0.05,'#231c1e',s*k,1.2,0));sc.add(leaf);});
 {const b=new THREE.Group();b.position.set(-7.6,0,23.6);b.add(bx(2.2,2.5,2.2,PAL.cream,0,1.25,0),bx(2.6,0.15,2.6,PAL.creamD,0,2.57,0),bx(1.4,0.8,0.08,PAL.glass,0,1.6,1.11),bx(0.08,0.8,1.2,PAL.glass,1.11,1.6,0),bx(0.7,1.8,0.08,PAL.plum,-0.6,0.9,1.11));const s=new THREE.Mesh(new THREE.PlaneGeometry(1.8,0.3),new THREE.MeshBasicMaterial({map:signTex('SECURITY','#a8553f','#fff',512,96)}));s.position.set(0,2.2,1.12);b.add(s);sc.add(b);}
 // ---------- shared building parts ----------
 const clickables=[];const WT={grid:winTex(3,2),tall:winTex(2,3),wide:winTex(4,1),shop:winTex(3,1,'#e9dcc0','#3e5560','#9bb8bc')};
 const WB={};Object.entries(WT).forEach(([k,t])=>WB[k]=new Batch(new THREE.BoxGeometry(1,1,0.08),new THREE.MeshLambertMaterial({map:t})));
 const sill=new Batch(new THREE.BoxGeometry(1,1,1),L(PAL.creamD));
 function win(face,x,y,z,w,h,type='grid'){if(face==='z'){WB[type].add(x,y,z+0.04,w,h,1,0);sill.add(x,y-h/2-0.05,z+0.1,w+0.16,0.08,0.2);}else{WB[type].add(x+0.04,y,z,w,h,1,Math.PI/2);sill.add(x+0.1,y-h/2-0.05,z,0.2,0.08,w+0.16);}}
 const door=(g,face,x,z,w=1.3,h=2.3,glass)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,0.08),new THREE.MeshLambertMaterial({map:glass?glassDoorTex:doorTex}));if(face==='z')m.position.set(x,h/2,z+0.05);else{m.position.set(x+0.05,h/2,z);m.rotation.y=Math.PI/2;}m.castShadow=true;g.add(m);g.add(face==='z'?bx(w+0.3,0.18,0.18,PAL.creamD,x,h+0.09,z+0.08):bx(0.18,0.18,w+0.3,PAL.creamD,x+0.08,h+0.09,z));};
 function tank(g,x,y,z,s=1){const t=new THREE.Group();t.position.set(x,y,z);t.scale.setScalar(s);[[-0.55,-0.55],[0.55,-0.55],[-0.55,0.55],[0.55,0.55]].forEach(([a,b])=>t.add(bx(0.08,1.0,0.08,'#3a3436',a,0.5,b)));
  t.add(bx(1.4,0.08,1.4,'#3a3436',0,1.02,0),bx(1.3,0.05,0.05,'#3a3436',0,0.55,-0.55),bx(1.3,0.05,0.05,'#3a3436',0,0.55,0.55));t.add(cy(0.6,0.64,1.3,PAL.tank,0,1.72,0,18));for(let k=0;k<4;k++)t.add(cy(0.655,0.655,0.06,'#3c3537',0,1.25+k*0.3,0,18));t.add(cy(0.3,0.6,0.16,PAL.tank,0,2.45,0,18),cy(0.24,0.24,0.1,'#3c3537',0,2.56,0,12));g.add(t);}
 function solar(g,x,y,z,ry=0){const p=new THREE.Group();p.position.set(x,y,z);p.rotation.y=ry;const pn=new THREE.Mesh(new THREE.BoxGeometry(1.7,0.05,1.1),new THREE.MeshLambertMaterial({map:solarTex}));pn.position.y=0.5;pn.rotation.x=0.42;pn.castShadow=true;p.add(pn,bx(0.05,0.28,0.05,'#8d8172',-0.75,0.14,0.45),bx(0.05,0.28,0.05,'#8d8172',0.75,0.14,0.45),bx(0.05,0.75,0.05,'#8d8172',-0.75,0.37,-0.45),bx(0.05,0.75,0.05,'#8d8172',0.75,0.37,-0.45));g.add(p);}
 function sky(g,x,y,z){g.add(bx(1.3,0.3,0.9,PAL.cream,x,y+0.15,z));const gl=bx(1.1,0.08,0.7,'#d7e8ea',x,y+0.32,z);gl.rotation.x=0.08;g.add(gl,bx(0.05,0.1,0.7,PAL.white,x,y+0.37,z));}
 function ac(g,x,y,z){g.add(bx(0.9,0.6,0.6,PAL.creamD,x,y+0.3,z),cy(0.22,0.22,0.04,'#4a3e40',x,y+0.3,z+0.31,14).rotateX(Math.PI/2),bx(0.08,0.08,0.6,'#8d8172',x-0.5,y+0.1,z));}
 function deck(g,x0,z0,w,d,H,lip,top='#e8dbbf'){g.add(bx(w-0.3,0.06,d-0.3,top,x0+w/2,H+0.03,z0+d/2));[[w+0.3,0.3,x0+w/2,z0],[w+0.3,0.3,x0+w/2,z0+d],[0.3,d+0.3,x0,z0+d/2],[0.3,d+0.3,x0+w,z0+d/2]].forEach(([a,c,x,z])=>{g.add(bx(a,0.6,c,lip,x,H+0.3,z),bx(a+0.06,0.08,c+0.06,PAL.cream,x,H+0.64,z));});}
 function gable(g,cx,cz,w,d,H,rh,o,base,dark,endCol){const hd=d/2+o,sl=Math.hypot(hd,rh),a=Math.atan2(rh,hd),tx=ribTex(base,dark);tx.repeat.set((w+2*o)/0.38,1);const mat=new THREE.MeshLambertMaterial({map:tx});
  [1,-1].forEach(s=>{const p=new THREE.Mesh(new THREE.BoxGeometry(w+2*o,0.12,sl),mat);p.position.set(cx,H+rh/2-o*rh/hd/2+0.06,cz+s*hd/2);p.rotation.x=s*a;p.castShadow=p.receiveShadow=true;g.add(p);g.add(bx(w+2*o,0.2,0.08,dark,cx,H-o*rh/hd,cz+s*hd));});
  g.add(bx(w+2*o+0.06,0.16,0.34,dark,cx,H+rh+0.04,cz));const sh=new THREE.Shape([new THREE.Vector2(-d/2,0),new THREE.Vector2(d/2,0),new THREE.Vector2(0,rh)]);
  [-1,1].forEach(s=>{const m=new THREE.Mesh(new THREE.ShapeGeometry(sh),L(endCol,{side:THREE.DoubleSide}));m.rotation.y=Math.PI/2;m.position.set(cx+s*w/2,H,cz);m.castShadow=true;g.add(m);});}
 function walkway(x0,z0,x1,z1){const w=x1-x0,d=z1-z0,cx=(x0+x1)/2,cz=(z0+z1)/2,along=w>d;sc.add(bx(w,0.14,d,PAL.cream,cx,2.8,cz),bx(w+0.12,0.08,d+0.12,PAL.creamD,cx,2.7,cz));
  const n=Math.max(1,Math.round((along?w:d)/3));for(let k=0;k<=n;k++){const t=k/n;[0,1].forEach(e=>{const x=along?x0+0.15+t*(w-0.3):(e?x1-0.15:x0+0.15),z=along?(e?z1-0.15:z0+0.15):z0+0.15+t*(d-0.3);sc.add(cy(0.06,0.06,2.7,'#b7ad9b',x,1.35,z,6));});}}
 const finish=(g,b,H)=>{g.traverse(m=>{if(m.isMesh){m.userData.bid=b.id;clickables.push(m);}});sc.add(g);const tag=label(b.name.replace('ADMINISTRATIVE','ADMIN'),'#3a2a30');tag.position.set(X(b.i)+b.w,H+2.4,Z(b.j)+b.d);tag.scale.set(4.4,0.82,1);tag.material.depthTest=true;sc.add(tag);};
 const B=id=>W.B.find(b=>b.id===id),geo=b=>({x0:X(b.i),z0:Z(b.j),w:b.w*T,d:b.d*T,dx:b.doors.map(u=>X(b.i)+u*T+0.6)});
 // ---------- SS1 classroom block: 3 floors with open balcony corridors ----------
 {const b=B('classroom'),{x0,z0,w,d,dx}=geo(b),g=new THREE.Group(),FH=3,F=3,H=F*FH,cd=1.7,z1=z0+d,zi=z1-cd,O=PAL.ochre,OD=PAL.ochreD;
  g.add(bx(w-1,H,d-cd,O,x0+w/2,H/2,z0+(d-cd)/2));[x0+0.3,x0+w-0.3].forEach(x=>g.add(bx(0.6,H,d,O,x,H/2,z0+d/2)));
  g.add(bx(w,0.12,cd,PAL.creamD,x0+w/2,0.06,zi+cd/2));for(let f=1;f<=F;f++)g.add(bx(w,0.28,cd+0.1,OD,x0+w/2,f*FH-0.14,zi+cd/2+0.05));
  const bay=(w-0.6)/5;for(let k=0;k<=5;k++)g.add(bx(0.38,H,0.38,O,x0+0.3+k*bay,H/2,z1-0.19));
  const bal=new Batch(new THREE.BoxGeometry(0.045,0.9,0.045),L(PAL.white));
  for(let f=1;f<F;f++){const y=f*FH;g.add(bx(w-0.6,0.07,0.1,PAL.white,x0+w/2,y+0.95,z1-0.05),bx(w-0.6,0.05,0.08,PAL.white,x0+w/2,y+0.12,z1-0.05));for(let x=x0+0.6;x<x0+w-0.6;x+=0.2)bal.add(x,y+0.52,z1-0.05);}
  bal.flush(g);
  for(let f=0;f<F;f++){const y=f*FH;for(let k=0;k<5;k++){const c=x0+0.3+bay*(k+0.5);const dd=dx.find(x=>Math.abs(x-c)<bay/2);
    if(dd!==undefined){door(g,'z',dd,zi,1.2,2.25);win('z',dd+(dd<c?1.4:-1.4),y+1.75,zi,1.4,1.2);}else{win('z',c-0.95,y+1.75,zi,1.5,1.25);win('z',c+0.95,y+1.75,zi,1.5,1.25);}}}
  for(let f=0;f<F;f++)for(let z=z0+1;z<z1-0.4;z+=1.9)win('x',x0+w,f*FH+1.75,z,1.2,1.25);
  for(let f=1;f<F;f++)g.add(bx(0.62,0.12,d+0.02,OD,x0+w-0.3,f*FH,z0+d/2));
  deck(g,x0,z0,w,d,H,OD);tank(g,x0+3,H,z0+2,1.1);ac(g,x0+w-4,H,z0+1.6);ac(g,x0+w-5.4,H,z0+1.6);solar(g,x0+9,H,z0+2.4);solar(g,x0+11,H,z0+2.4);
  const s=new THREE.Mesh(new THREE.PlaneGeometry(5,0.55),new THREE.MeshBasicMaterial({map:signTex('SS1 CLASSROOM BLOCK','#3a2a30','#ecdcbc')}));s.position.set(x0+w/2,H-0.45,z1+0.03);g.add(s);
  finish(g,b,H+1);walkway(x0,z1+0.2,4,z1+2);}
 // ---------- canteen: long single storey with ribbed terracotta gable roof ----------
 {const b=B('canteen'),{x0,z0,w,d,dx}=geo(b),g=new THREE.Group(),H=3.4,z1=z0+d,x1=x0+w,cx=x0+w/2,cz=z0+d/2;
  g.add(bx(w,H,d,PAL.cream,cx,H/2,cz),bx(w+0.06,1.0,d+0.06,'#9a6a52',cx,0.5,cz),bx(w+0.08,0.12,d+0.08,PAL.creamD,cx,1.02,cz));
  for(let x=x0+1.4;x<x1-0.8;x+=2.5){if(dx.some(v=>Math.abs(v-x)<1.4))continue;win('z',x,2.05,z1,2.1,1.25,'wide');}
  for(let z=z0+1.4;z<z1-0.8;z+=2.4)win('x',x1,2.05,z,1.9,1.25,'wide');
  dx.forEach(v=>{door(g,'z',v,z1,1.7,2.3,true);const s=new THREE.Mesh(new THREE.PlaneGeometry(3.2,0.5),new THREE.MeshBasicMaterial({map:signTex("MAMA TITI'S CANTEEN",'#e3a347','#3a2a30')}));s.position.set(v,2.95,z1+0.05);g.add(s);});
  gable(g,cx,cz,w,d,H,2.0,0.6,'#b5573e','#8e3f2e',PAL.cream);
  g.add(bx(0.7,1.6,0.7,'#9a6a52',x0+2.2,H+1.5,z0+2.2),bx(0.9,0.12,0.9,'#3a2a30',x0+2.2,H+2.35,z0+2.2));
  [[x1+0.5,z0+1.2],[x1+0.5,z0+1.9]].forEach(([x,z])=>g.add(cy(0.18,0.18,0.9,'#3f6fa3',x,0.45,z,10),cy(0.08,0.08,0.12,'#8d8172',x,0.96,z,6)));
  tank(g,x1+0.9,0,z0+4.6,1.05);finish(g,b,H+2.2);walkway(2,12.1,14,14);}
 // ---------- tuck shop ----------
 {const g=new THREE.Group();g.position.set(22,0,6);g.add(bx(3.8,3.0,3.6,PAL.cream,0,1.5,0),bx(3.86,0.6,3.66,'#9a6a52',0,0.3,0));deck(g,-1.9,-1.8,3.8,3.6,3.0,PAL.creamD);
  g.add(bx(2.6,1.3,0.08,PAL.glass,-0.35,1.55,1.82),bx(0.9,2.1,0.08,PAL.plum,1.3,1.05,1.82),bx(2.8,0.1,0.6,PAL.trunk,-0.35,0.9,2.1));
  const aw=ct(128,32,(c,w,h)=>{for(let k=0;k<8;k++){c.fillStyle=k%2?'#f2e6cc':'#c0563f';c.fillRect(k*16,0,16,h);}});const a=new THREE.Mesh(new THREE.BoxGeometry(3.9,0.06,1.3),new THREE.MeshLambertMaterial({map:aw}));a.position.set(0,2.55,2.4);a.rotation.x=0.38;a.castShadow=true;g.add(a);
  for(let k=0;k<8;k++){const v=new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.24,0.06,10,1,false,0,Math.PI),L(k%2?'#f2e6cc':'#c0563f'));v.rotation.z=Math.PI/2;v.rotation.y=Math.PI/2;v.position.set(-1.7+k*0.49,2.25,3.0);g.add(v);}
  const s=new THREE.Mesh(new THREE.PlaneGeometry(2.6,0.5),new THREE.MeshBasicMaterial({map:signTex('TUCK SHOP','#f2e6cc','#a8553f',512,96)}));s.position.set(0,2.85,1.83);g.add(s);
  const rk=new THREE.Group();rk.position.set(-2.6,0,2.8);for(let k=0;k<4;k++){const r=new THREE.Mesh(new THREE.TorusGeometry(0.32,0.03,6,16),L('#3a2a30'));r.position.set(0,0.35,k*0.35-0.5);r.rotation.y=Math.PI/2;rk.add(r);}g.add(rk);
  g.add(bx(0.4,0.6,0.4,PAL.sageD,2.3,0.3,2.6));sc.add(g);}
 // ---------- admin: cream, rounded corner, entrance canopy, flag ----------
 let flagGeo,flagBase;
 {const b=B('admin'),{x0,z0,w,d,dx}=geo(b),g=new THREE.Group(),FH=3.3,F=2,H=F*FH,x1=x0+w,z1=z0+d,r=2.4,C=PAL.cream,CD=PAL.creamD;
  const rounded=(h,y,col,grow=0)=>{g.add(bx(w-r+grow,h,d+grow*2,col,x0+(w-r)/2-grow/2+grow,y,z0+d/2));g.add(bx(r+grow,h,d-r+grow,col,x1-r/2+grow/2,y,z0+(d-r)/2-grow/2+grow/2));const c=new THREE.Mesh(new THREE.CylinderGeometry(r+grow,r+grow,h,28,1,false,0,Math.PI/2),L(col));c.position.set(x1-r,y,z1-r);c.castShadow=c.receiveShadow=true;g.add(c);};
  rounded(H,H/2,C);rounded(0.6,0.3,CD,0.06);rounded(0.14,FH,CD,0.05);rounded(0.5,H+0.25,CD,0.12);
  g.add(bx(w-0.6,0.06,d-0.6,'#e8dbbf',x0+w/2-0.2,H+0.52,z0+d/2-0.2));
  for(let f=0;f<F;f++){const y=f*FH+1.85;for(let x=x0+1.2;x<x1-r-0.4;x+=1.9){if(f===0&&dx.some(v=>Math.abs(v-x)<1.3))continue;win('z',x,y,z1,1.1,1.35,'tall');}
   for(let z=z0+1.2;z<z1-r-0.3;z+=1.9)win('x',x1,y,z,1.1,1.35,'tall');
   const a=Math.PI/4,wx=x1-r+Math.sin(a)*(r+0.02),wz=z1-r+Math.cos(a)*(r+0.02);const m=new THREE.Mesh(new THREE.BoxGeometry(1.0,1.35,0.08),new THREE.MeshLambertMaterial({map:WT.tall}));m.position.set(wx,y,wz);m.rotation.y=a;g.add(m);}
  dx.forEach(v=>{door(g,'z',v,z1,1.5,2.3,true);g.add(bx(3.4,0.2,1.8,PAL.cream,v,2.75,z1+0.9));const lip=cy(0.12,0.12,3.4,PAL.ochre,v,2.75,z1+1.8,8);lip.rotation.z=Math.PI/2;g.add(lip,bx(3.4,0.32,0.06,PAL.ochre,v,2.55,z1+1.8));[[-1.5],[1.5]].forEach(([o])=>g.add(cy(0.06,0.06,2.7,'#b7ad9b',v+o,1.35,z1+1.7,6)));g.add(bx(3.0,0.14,1.0,CD,v,0.07,z1+0.5),bx(2.6,0.12,0.6,CD,v,0.2,z1+0.3));
   const s=new THREE.Mesh(new THREE.PlaneGeometry(3.1,0.28),new THREE.MeshBasicMaterial({map:signTex('ADMINISTRATION','#e3a347','#3a2a30',512,64)}));s.position.set(v,2.56,z1+1.84);g.add(s);});
  tank(g,x0+2,H+0.5,z0+2,1.0);ac(g,x0+5,H+0.5,z0+1.8);
  finish(g,b,H+1);walkway(2,22.1,14,24);
  const fx=15.6,fz=22.9;sc.add(cy(0.5,0.6,0.3,CD,fx,0.15,fz,12),cy(0.05,0.07,7,'#d8d8d8',fx,3.5,fz,8),cy(0.1,0.1,0.1,'#d9b45a',fx,7.05,fz,8));
  flagGeo=new THREE.PlaneGeometry(1.8,1.1,18,6);flagGeo.translate(0.9,0,0);flagBase=flagGeo.attributes.position.array.slice();
  const ft=ct(192,120,(c,w,h)=>{c.fillStyle='#008751';c.fillRect(0,0,w,h);c.fillStyle='#fff';c.fillRect(w/3,0,w/3,h);});const fl=new THREE.Mesh(flagGeo,new THREE.MeshLambertMaterial({map:ft,side:THREE.DoubleSide}));fl.position.set(fx+0.06,6.4,fz);fl.castShadow=true;sc.add(fl);
  const nb=new THREE.Group();nb.position.set(17.2,0,19.2);nb.rotation.y=-0.35;nb.add(bx(0.1,1.2,0.1,'#3a2a30',-1.1,0.6,0),bx(0.1,1.2,0.1,'#3a2a30',1.1,0.6,0),bx(2.5,1.4,0.12,PAL.ochre,0,1.75,0));
  const nt=new THREE.Mesh(new THREE.PlaneGeometry(2.25,1.15),new THREE.MeshBasicMaterial({map:ct(256,132,(c,w,h)=>{c.fillStyle='#f6efe0';c.fillRect(0,0,w,h);c.fillStyle='#3a2a30';c.font='bold 18px sans-serif';c.textAlign='center';c.fillText('UNITY SECONDARY SCHOOL',w/2,28);c.font='14px sans-serif';['Welcome back, students!','First term resumes Monday','Inter-house sports: Friday',"Motto: 'Knowledge & Service'"].forEach((t,k)=>c.fillText(t,w/2,56+k*20));})}));nt.position.set(0,1.75,0.07);nb.add(nt);sc.add(nb);}
 // ---------- science lab: deep green, solar array + skylights ----------
 {const b=B('lab'),{x0,z0,w,d,dx}=geo(b),g=new THREE.Group(),FH=3,F=3,H=F*FH,x1=x0+w,z1=z0+d,G1='#3f5e4c',G2='#324b3d';
  g.add(bx(w,H,d,G1,x0+w/2,H/2,z0+d/2),bx(w+0.08,0.55,d+0.08,G2,x0+w/2,0.27,z0+d/2));for(let f=1;f<F;f++)g.add(bx(w+0.06,0.1,d+0.06,G2,x0+w/2,f*FH,z0+d/2));
  for(let f=0;f<F;f++){for(let x=x0+0.9;x<x1-0.5;x+=1.45){if(f===0&&dx.some(v=>Math.abs(v-x)<1.2))continue;win('z',x,f*FH+1.7,z1,0.75,1.5,'tall');}for(let z=z0+0.9;z<z1-0.5;z+=1.45)win('x',x1,f*FH+1.7,z,0.75,1.5,'tall');}
  dx.forEach(v=>{door(g,'z',v,z1,1.5,2.3,true);g.add(bx(2.6,0.14,1.3,PAL.cream,v,2.7,z1+0.65));const s=new THREE.Mesh(new THREE.PlaneGeometry(3.4,0.4),new THREE.MeshBasicMaterial({map:signTex('SCIENCE LABORATORY','#f2e6cc','#324b3d',768,96)}));s.position.set(v,3.15,z1+0.04);g.add(s);});
  deck(g,x0,z0,w,d,H,G2,'#2f4038');for(let r=0;r<2;r++)for(let k=0;k<4;k++)solar(g,x0+2.2+k*2.0,H,z0+1.6+r*1.6);sky(g,x1-2.2,H,z0+1.6);sky(g,x1-2.2,H,z0+3.4);sky(g,x1-3.8,H,z0+2.5);
  finish(g,b,H+1);walkway(2,-7.9,14,-6);}
 // ---------- library: brick with glass curtain front ----------
 {const b=B('library'),{x0,z0,w,d,dx}=geo(b),g=new THREE.Group(),FH=3.4,F=2,H=F*FH,x1=x0+w,z1=z0+d;const bt=brickTex();bt.repeat.set(w/2,H/1.2);
  g.add(new THREE.Mesh(new THREE.BoxGeometry(w,H,d),new THREE.MeshLambertMaterial({map:bt})));g.children[0].position.set(x0+w/2,H/2,z0+d/2);g.children[0].castShadow=g.children[0].receiveShadow=true;
  g.add(bx(w+0.1,0.5,d+0.1,PAL.creamD,x0+w/2,0.25,z0+d/2),bx(w+0.1,0.16,d+0.1,PAL.cream,x0+w/2,FH,z0+d/2));
  const gc=new Batch(new THREE.BoxGeometry(1,1,0.08),new THREE.MeshLambertMaterial({map:winTex(2,2,'#e9dcc0','#4f6b76','#a9c4c6')}));
  for(let k=0;k<4;k++){const cx=x0+1.6+k*2.27;g.add(bx(0.4,H,0.35,PAL.cream,cx-1.13,H/2,z1+0.12));if(dx.some(v=>Math.abs(v-cx)<1.1)){door(g,'z',cx,z1,1.5,2.4,true);gc.add(cx,FH+1.7,z1+0.04,1.85,2.6,1);}else for(let f=0;f<F;f++)gc.add(cx,f*FH+1.75,z1+0.04,1.85,2.6,1);}
  g.add(bx(0.4,H,0.35,PAL.cream,x1-0.2,H/2,z1+0.12));gc.flush(g);
  for(let f=0;f<F;f++)for(let z=z0+1.3;z<z1-0.6;z+=2)win('x',x1,f*FH+1.8,z,1.3,1.4,'grid');
  deck(g,x0,z0,w,d,H,PAL.cream);tank(g,x0+2,H,z0+2.2,1.0);ac(g,x1-2.4,H,z0+1.8);sky(g,x0+5.5,H,z0+3.6);
  const s=new THREE.Mesh(new THREE.PlaneGeometry(3,0.42),new THREE.MeshBasicMaterial({map:signTex('LIBRARY','#3a2a30','#ecdcbc',512,72)}));s.position.set(x0+w/2,H-0.35,z1+0.32);g.add(s);
  finish(g,b,H+1);walkway(-18,-5.9,-2,-4);}
 // ---------- common room: terracotta hip roof + verandah ----------
 {const b=B('common'),{x0,z0,w,d,dx}=geo(b),g=new THREE.Group(),H=3.3,x1=x0+w,z1=z0+d,cx=x0+w/2,cz=z0+d/2;
  g.add(bx(w,H,d,PAL.ochre,cx,H/2,cz),bx(w+0.06,0.9,d+0.06,PAL.brickD,cx,0.45,cz));
  for(let x=x0+1.3;x<x1-0.6;x+=2.1){if(dx.some(v=>Math.abs(v-x)<1.3))continue;win('z',x,2.0,z1,1.5,1.2);}for(let z=z0+1.4;z<z1-0.6;z+=2.2)win('x',x1,2.0,z,1.5,1.2);dx.forEach(v=>door(g,'z',v,z1,1.4,2.3));
  const rg=new THREE.ConeGeometry(1,2.2,4,1);rg.rotateY(Math.PI/4);const rf=new THREE.Mesh(rg,L('#b5573e'));rf.scale.set((w/2+0.7)/0.7071,1,(d/2+0.7)/0.7071);rf.position.set(cx,H+1.1,cz);rf.castShadow=true;g.add(rf);
  g.add(bx(w+1.4,0.2,0.1,'#8e3f2e',cx,H,z1+0.7),bx(w+1.4,0.2,0.1,'#8e3f2e',cx,H,z0-0.7),bx(0.1,0.2,d+1.4,'#8e3f2e',x0-0.7,H,cz),bx(0.1,0.2,d+1.4,'#8e3f2e',x1+0.7,H,cz));
  const vr=bx(w-1,0.12,2.0,'#b5573e',cx,2.85,z1+1.0);vr.rotation.x=0.14;g.add(vr);for(let x=x0+1;x<=x1-1;x+=2.5)g.add(cy(0.08,0.08,2.8,PAL.cream,x,1.4,z1+1.85,8));
  g.add(bx(w-1,0.16,2.2,PAL.creamD,cx,0.08,z1+1.0));finish(g,b,H+2.4);tank(sc,x1+1.2,0,z0+1.2,1.1);}
 // ---------- water tower + generator house ----------
 const strut=(g,a,b,r,col)=>{const A=new V3(...a),Bv=new V3(...b),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,A.distanceTo(Bv),6),L(col));m.position.copy(A).add(Bv).multiplyScalar(0.5);m.quaternion.setFromUnitVectors(new V3(0,1,0),Bv.clone().sub(A).normalize());m.castShadow=true;g.add(m);};
 {const g=new THREE.Group();g.position.set(23,0,17.2);const Hh=5.4,s='#4e484b';const c0=1.3,c1=0.85;const leg=[[-1,-1],[1,-1],[1,1],[-1,1]];
  leg.forEach(([a,b])=>strut(g,[a*c0,0,b*c0],[a*c1,Hh,b*c1],0.07,s));
  for(let lv=0;lv<3;lv++){const y0=lv*Hh/3,y1=(lv+1)*Hh/3,k0=c0+(c1-c0)*lv/3,k1=c0+(c1-c0)*(lv+1)/3;for(let q=0;q<4;q++){const [a,b]=leg[q],[c,d]=leg[(q+1)%4];strut(g,[a*k0,y0,b*k0],[c*k1,y1,d*k1],0.03,s);strut(g,[c*k0,y0,d*k0],[a*k1,y1,b*k1],0.03,s);strut(g,[a*k1,y1,b*k1],[c*k1,y1,d*k1],0.035,s);}}
  g.add(bx(2.4,0.12,2.4,s,0,Hh,0));for(let q=0;q<4;q++){const [a,b]=leg[q];g.add(cy(0.03,0.03,0.6,s,a*1.15,Hh+0.3,b*1.15,4));}
  g.add(cy(1.05,1.05,1.9,'#7a767d',0,Hh+1.05,0,22));for(let k=0;k<5;k++)g.add(cy(1.07,1.07,0.05,'#8f8b93',0,Hh+0.25+k*0.38,0,22));g.add(cy(0.18,1.07,0.55,'#7a767d',0,Hh+2.27,0,22),cy(0.15,0.15,0.12,'#5d5960',0,Hh+2.6,0,10));
  strut(g,[1.0,0,1.25],[0.9,Hh,1.0],0.025,s);strut(g,[1.35,0,1.25],[1.25,Hh,1.0],0.025,s);for(let y=0.4;y<Hh;y+=0.4)g.add(bx(0.36,0.025,0.025,s,1.12,y,1.25-0.25*y/Hh));sc.add(g);
  const hut=new THREE.Group();hut.position.set(26.4,0,20.6);hut.add(bx(3,2.4,2.4,PAL.cream,0,1.2,0),bx(1,1.8,0.06,'#5d5960',0.5,0.9,1.22),bx(0.8,0.5,0.06,'#3a3436',-0.8,1.7,1.22));const hr=new THREE.ConeGeometry(1,1.1,4,1);hr.rotateY(Math.PI/4);const hm=new THREE.Mesh(hr,L('#b5573e'));hm.scale.set(2.0/0.7071,1,1.7/0.7071);hm.position.y=2.95;hm.castShadow=true;hut.add(hm);sc.add(hut);}
 // ---------- field: running track + pitch ----------
 const F=W.FIELD,fx0=X(F.i),fx1=X(F.i+F.w),fz0=Z(F.j),fz1=Z(F.j+F.d),fcx=(fx0+fx1)/2,fcz=(fz0+fz1)/2;
 const stad=(R,hs)=>{const s=new THREE.Shape();s.moveTo(-hs,-R);s.lineTo(hs,-R);s.absarc(hs,0,R,-Math.PI/2,Math.PI/2,false);s.lineTo(-hs,R);s.absarc(-hs,0,R,Math.PI/2,Math.PI*1.5,false);return s;};
 const flatShape=(shape,col,y)=>{const m=new THREE.Mesh(new THREE.ShapeGeometry(shape,48),L(col));m.rotation.x=-Math.PI/2;m.position.set(fcx,y,fcz);m.receiveShadow=true;sc.add(m);return m;};
 const R0=(fz1-fz0)/2-0.1,HS=(fx1-fx0)/2-R0-0.1,RI=R0-1.9;
 flatShape(stad(R0+0.25,HS),'#5f7d4c',0.05);
 {const s=stad(R0,HS);s.holes.push(stad(RI,HS));flatShape(s,'#b8553f',0.06);}
 for(let k=1;k<4;k++){const r=RI+k*(R0-RI)/4,s=stad(r+0.035,HS);s.holes.push(stad(r-0.035,HS));flatShape(s,'#f2e6cc',0.065);}
 [[RI-0.02,RI+0.05],[R0-0.05,R0+0.02]].forEach(([a,b])=>{const s=stad(b,HS);s.holes.push(stad(a,HS));flatShape(s,'#f2e6cc',0.066);});
 flatShape(stad(RI,HS),'#6f9152',0.062);
 const PL=Math.min(HS+RI*0.72,HS+RI-0.6),PWd=RI*0.78;
 for(let k=0;k<8;k++){const w=2*PL/8;sc.add(bx(w,0.01,2*PWd,k%2?'#6f9152':'#7b9d5b',fcx-PL+w*(k+0.5),0.066,fcz));}
 const lineB=new Batch(new THREE.BoxGeometry(1,0.02,1),L(PAL.courtL),false);const ln=(a,b,c,d,y=0.075)=>lineB.add((a+b)/2,y,(c+d)/2,Math.abs(b-a)+0.07,1,Math.abs(d-c)+0.07);
 ln(fcx-PL,fcx+PL,fcz-PWd,fcz-PWd);ln(fcx-PL,fcx+PL,fcz+PWd,fcz+PWd);ln(fcx-PL,fcx-PL,fcz-PWd,fcz+PWd);ln(fcx+PL,fcx+PL,fcz-PWd,fcz+PWd);ln(fcx,fcx,fcz-PWd,fcz+PWd);
 [-1,1].forEach(s=>{const gx=fcx+s*PL;ln(gx,gx-s*2.2,fcz-2.4,fcz-2.4);ln(gx,gx-s*2.2,fcz+2.4,fcz+2.4);ln(gx-s*2.2,gx-s*2.2,fcz-2.4,fcz+2.4);ln(gx,gx-s*0.8,fcz-1.2,fcz-1.2);ln(gx,gx-s*0.8,fcz+1.2,fcz+1.2);ln(gx-s*0.8,gx-s*0.8,fcz-1.2,fcz+1.2);
  const pm=L(PAL.white),G=new THREE.Group();G.position.set(gx,0,fcz);[-1.2,1.2].forEach(z=>{G.add(cy(0.05,0.05,1.25,pm,0,0.62,z,8),cy(0.03,0.03,0.9,pm,s*0.8,0.45,z,6));});const cb=cy(0.05,0.05,2.45,pm,0,1.25,0,8);cb.rotation.x=Math.PI/2;G.add(cb);
  const nm=new THREE.MeshLambertMaterial({map:netTex,transparent:true,side:THREE.DoubleSide,depthWrite:false});const back=new THREE.Mesh(new THREE.PlaneGeometry(2.4,0.95),nm);back.rotation.y=Math.PI/2;back.position.set(s*0.8,0.47,0);G.add(back);
  const top=new THREE.Mesh(new THREE.PlaneGeometry(0.85,2.4),nm);top.rotation.x=Math.PI/2;top.rotation.y=-s*0.35;top.position.set(s*0.4,1.08,0);G.add(top);
  [-1.2,1.2].forEach(z=>{const sd=new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0,0),new THREE.Vector2(0,1.25),new THREE.Vector2(s*0.8,0.9),new THREE.Vector2(s*0.8,0)])),nm);sd.position.set(0,0,z);G.add(sd);});sc.add(G);
  [-1,1].forEach(t=>sc.add(cy(0.02,0.02,0.7,PAL.white,gx,0.35,fcz+t*PWd,4),bx(0.02,0.18,0.24,s>0?'#c0563f':'#e3a347',gx,0.62,fcz+t*PWd+0.12)));});
 const cr=new THREE.Mesh(new THREE.RingGeometry(1.15,1.22,40),L(PAL.courtL));cr.rotation.x=-Math.PI/2;cr.position.set(fcx,0.076,fcz);sc.add(cr);
 [-1,1].forEach(s=>{const a=new THREE.Mesh(new THREE.RingGeometry(0.9,0.96,20,1,s>0?Math.PI*0.62:-Math.PI*0.38,Math.PI*0.76),L(PAL.courtL));a.rotation.x=-Math.PI/2;a.position.set(fcx+s*(PL-1.5),0.076,fcz);sc.add(a);});
 [[fcx-4,fz0+0.5],[fcx+4,fz0+0.5]].forEach(([x,z])=>{const b=new THREE.Group();b.position.set(x,0,z-0.4);b.add(bx(1.8,0.08,0.45,PAL.trunk,0,0.45,0),bx(1.8,0.35,0.06,PAL.trunk,0,0.72,-0.2),bx(0.06,0.45,0.4,PAL.fence,-0.8,0.22,0),bx(0.06,0.45,0.4,PAL.fence,0.8,0.22,0));sc.add(b);});
 // ---------- hedges ----------
 const hedge=new Batch(new THREE.IcosahedronGeometry(1,1),windMat('#4f6f52'));const hedgeRow=(x0,z0,x1,z1)=>{const l=Math.hypot(x1-x0,z1-z0),n=Math.max(1,Math.round(l/0.75));for(let k=0;k<=n;k++){const t=k/n;hedge.add(x0+(x1-x0)*t,0.38,z0+(z1-z0)*t,0.55,0.5,0.55,rnd()*3);}};
 hedgeRow(fx0+0.4,fz1+0.6,13.2,fz1+0.6);hedgeRow(16.8,fz1+0.6,fx1-0.4,fz1+0.6);hedgeRow(fx0-0.8,fz0+0.5,fx0-0.8,fz1-0.5);
 hedgeRow(-23.4,10.7,-20.2,10.7);hedgeRow(-18.4,10.7,-14.2,10.7);hedgeRow(-12.4,10.7,-8.2,10.7);hedgeRow(-6.4,10.7,-3.2,10.7);
 hedgeRow(3.4,14.7,3.4,21.4);hedgeRow(-11.4,-3.3,-3.4,-3.3);hedgeRow(16.8,-6.4,16.8,-1.4);
 {[[14.4,22.2],[16.9,22.2],[14.4,23.7],[16.9,23.7]].forEach(([x,z])=>hedge.add(x,0.32,z,0.45,0.4,0.45,rnd()*3));}
 hedge.flush(sc,'SM_Hedges');
 // ---------- trees: bent trunks + branches + clumped canopies ----------
 const brM=[],sway=[];const leafB=new Batch(new THREE.IcosahedronGeometry(1,1),windMat(PAL.leaf));
 const br=(a,b,r)=>{const A=new V3(...a),Bv=new V3(...b);brM.push(new THREE.Matrix4().compose(A.clone().add(Bv).multiplyScalar(0.5),new THREE.Quaternion().setFromUnitVectors(new V3(0,1,0),Bv.clone().sub(A).normalize()),new V3(r,A.distanceTo(Bv),r)));};
 const LC=['#5f8462','#6f8f68','#577a5c','#7a9a70'];
 function tree(x,z,s=1){const h=(2.4+rnd()*1.2)*s,lx=(rnd()-0.5)*0.9*s,lz=(rnd()-0.5)*0.9*s;const mid=[x+lx*0.4,h*0.55,z+lz*0.4],top=[x+lx,h,z+lz];br([x,0,z],mid,0.2*s);br(mid,top,0.15*s);
  const nb=2+Math.floor(rnd()*2),tips=[top];for(let k=0;k<nb;k++){const a=rnd()*6.28+k*2.1,l=(0.9+rnd()*0.7)*s,o=k===0?mid:top;const t=[o[0]+Math.cos(a)*l,o[1]+(0.6+rnd()*0.5)*s,o[2]+Math.sin(a)*l];br(o,t,0.09*s);tips.push(t);}
  tips.forEach((t,k)=>{const c=LC[(k+Math.floor(rnd()*4))%4];const r=(k?0.9:1.15)*s;leafB.add(t[0],t[1]+0.35*s,t[2],r*1.15,r*0.75,r*1.15,rnd()*3,c);leafB.add(t[0]+0.4*s,t[1]+0.55*s,t[2]-0.2*s,r*0.7,r*0.5,r*0.7,rnd()*3,'#86a77c');});}
 W.TREES.forEach(([i,j])=>tree(X(i)+1,Z(j)+1,1.1));
 for(let x=-56;x<=56;x+=5.5){if(Math.abs(x)>6&&!(x>-36&&x<-4))tree(x,33.2,0.9);tree(x+2,-41.5,0.9);}
 for(let z=-30;z<=22;z+=6){tree(-41.6,z,0.9);tree(41.6,z,0.9);tree(-32,z+3,0.75);tree(32,z+3,0.75);}
 // ---------- outer town ----------
 const FH=3,APT=[[PAL.ochre,PAL.ochreD],[PAL.sage,PAL.sageD],[PAL.cream,PAL.creamD],[PAL.brick,PAL.brickD]];
 function apartment(cx,cz,w,d){const [c,dk]=pick(APT);const f=2+Math.floor(rnd()*4),H=f*FH;const g=new THREE.Group();g.add(bx(w,H,d,c,cx,H/2,cz),bx(w+0.1,0.5,d+0.1,dk,cx,0.25,cz));for(let q=1;q<f;q++)g.add(bx(w+0.06,0.1,d+0.06,dk,cx,q*FH,cz));
  deck(g,cx-w/2,cz-d/2,w,d,H,dk);for(let q=0;q<f;q++){for(let x=cx-w/2+1.1;x<cx+w/2-0.6;x+=1.7)win('z',x,q*FH+1.65,cz+d/2,1.0,1.2);for(let z=cz-d/2+1.1;z<cz+d/2-0.6;z+=1.7)win('x',cx+w/2,q*FH+1.65,z,1.0,1.2);}
  if(rnd()<0.6)tank(g,cx-w/4,H,cz,0.9);if(rnd()<0.6)solar(g,cx+w/5,H,cz);if(rnd()<0.5)ac(g,cx,H,cz-d/4);sc.add(g);}
 const courtL=new Batch(new THREE.BoxGeometry(1,0.02,1),L(PAL.courtL),false);
 function court(cx,cz){flat(9,7,PAL.court,cx,cz,0.05);const lb=(a,b,c,d)=>courtL.add((a+b)/2,0.075,(c+d)/2,Math.abs(b-a)+0.08,1,Math.abs(d-c)+0.08);lb(cx-4.3,cx+4.3,cz-3.3,cz-3.3);lb(cx-4.3,cx+4.3,cz+3.3,cz+3.3);lb(cx-4.3,cx-4.3,cz-3.3,cz+3.3);lb(cx+4.3,cx+4.3,cz-3.3,cz+3.3);lb(cx,cx,cz-3.3,cz+3.3);
  const r=new THREE.Mesh(new THREE.RingGeometry(1,1.08,32),L(PAL.courtL));r.rotation.x=-Math.PI/2;r.position.set(cx,0.08,cz);sc.add(r);[-1,1].forEach(s=>{const k=new THREE.Mesh(new THREE.RingGeometry(1.6,1.68,24,1,s>0?Math.PI/2:-Math.PI/2,Math.PI),L(PAL.courtL));k.rotation.x=-Math.PI/2;k.position.set(cx+s*4.3,0.08,cz);sc.add(k);});
  [-1,1].forEach(s=>{sc.add(cy(0.06,0.06,3,PAL.fence,cx+s*4.7,1.5,cz,6),bx(0.08,0.8,1.2,PAL.white,cx+s*4.5,2.9,cz));const hp=new THREE.Mesh(new THREE.TorusGeometry(0.25,0.03,6,16),L('#c96a2b'));hp.rotation.x=Math.PI/2;hp.position.set(cx+s*4.2,2.65,cz);sc.add(hp);});
  const ball=new THREE.Mesh(new THREE.SphereGeometry(0.14,10,8),L('#c96a2b'));ball.position.set(cx+1.2,0.14,cz+0.8);sc.add(ball);fenceBox(cx,cz,10,8);}
 const fpB=new Batch(new THREE.BoxGeometry(0.06,1.4,0.06),L(PAL.fence));function fenceBox(cx,cz,w,d){for(let x=-w/2;x<=w/2;x+=0.32){fpB.add(cx+x,0.7,cz-d/2);fpB.add(cx+x,0.7,cz+d/2);}for(let z=-d/2;z<=d/2;z+=0.32){fpB.add(cx-w/2,0.7,cz+z);fpB.add(cx+w/2,0.7,cz+z);}}
 function park(cx,cz){for(let k=0;k<5;k++)tree(cx+(rnd()-0.5)*8,cz+(rnd()-0.5)*8,0.95+rnd()*0.3);}
 const lots=[];for(let x=-54;x<=54;x+=12)for(let z=-54;z<=54;z+=12){const south=z>=42,north=z<=-48,side=Math.abs(x)>=48&&z>-40&&z<30;if(south||north||side)lots.push([x,z]);}
 // ---------- street additions (only replace repeated apartments / extra courts) ----------
 const rnd2=(()=>{let s=987654;return()=>{s=(s*16807)%2147483647;return s/2147483647;};})();const pick2=a=>a[Math.floor(rnd2()*a.length)];
 const SHOPC=[['#e8b33c','#c9952c'],[PAL.sage,PAL.sageD],[PAL.cream,PAL.creamD],[PAL.brick,PAL.brickD],['#4f6e8a','#3f5a72'],['#d9c7a3','#b8a47e']];
 const SIGNS=[['PHARMACY','#55745c','#fff'],['BARBER','#3a2a30','#ecdcbc'],['TUCK SHOP','#c0563f','#fff'],['BUSINESS CENTRE','#e3a347','#3a2a30'],['MAMA PUT','#a8553f','#fff'],['PHONE REPAIRS','#4f6e8a','#fff'],['PROVISIONS','#e8b33c','#231c1e'],['TAILOR','#4a3340','#ecdcbc'],['POS · TRANSFER','#2f7a5a','#fff'],['SALON','#c97a8a','#fff'],['SUYA SPOT','#3a2a30','#e3a347'],['CHEMIST','#55745c','#fff']];let si=0;
 const sgn=(g,x,y,z,w,h)=>{const s=SIGNS[si++%SIGNS.length];const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:signTex(s[0],s[1],s[2],512,Math.max(64,Math.round(512*h/w)))}));m.position.set(x,y,z+0.04);g.add(m,bx(w+0.1,h+0.1,0.06,'#3a2a30',x,y,z));};
 const lw=(g,x,y,z,w=0.9,h=1.1)=>g.add(bx(w+0.14,h+0.14,0.06,'#ecdcbc',x,y,z),bx(w,h,0.08,'#46606c',x,y,z+0.01),bx(w+0.2,0.08,0.16,'#d9c7a3',x,y-h/2-0.08,z+0.05));
 const dishG=new THREE.SphereGeometry(0.36,12,5,0,Math.PI*2,0,0.6);
 const dish=(g,x,y,z,ry=0)=>{const d=new THREE.Group();d.position.set(x,y,z);d.rotation.y=ry;const m=new THREE.Mesh(dishG,L('#e8e4da',{side:THREE.DoubleSide}));m.rotation.x=-2.1;m.position.set(0,0.55,0);d.add(m,cy(0.03,0.03,0.6,'#8d9096',0,0.3,-0.05,6));g.add(d);};
 function umbrella(g,x,z,c1,c2){const co=new THREE.Mesh(new THREE.ConeGeometry(1.05,0.45,8),L(c1));co.position.set(x,2.15,z);co.castShadow=true;const co2=new THREE.Mesh(new THREE.ConeGeometry(0.5,0.22,8),L(c2));co2.position.set(x,2.42,z);co2.rotation.y=Math.PI/8;
  g.add(co,co2,cy(0.03,0.03,2.2,'#3a2a30',x,1.1,z,5),bx(1.3,0.08,0.85,PAL.trunk,x,0.78,z),bx(0.08,0.75,0.08,PAL.trunk,x-0.55,0.38,z+0.35),bx(0.08,0.75,0.08,PAL.trunk,x+0.55,0.38,z-0.35));
  const PC=['#c0392b','#2f7a3a','#e8901e','#8a5a34','#f0c24a'];for(let k=0;k<4;k++)g.add(bx(0.26,0.12+rnd2()*0.1,0.26,pick2(PC),x-0.42+k*0.28,0.88,z+(rnd2()-0.5)*0.3));}
 const SB={
  shops(g){let x=-4.6;for(let k=0;k<3;k++){const w=2.7+rnd2()*0.4,[c,dk]=pick2(SHOPC),H=3+rnd2()*0.8,cx=x+w/2,d=4.6;
    g.add(bx(w,H,d,c,cx,H/2,0),bx(w+0.04,0.5,d+0.04,dk,cx,0.25,0),bx(w-0.6,2.0,0.06,'#2b2326',cx,1.05,d/2+0.01),bx(w-0.8,1.6,0.04,rnd2()<0.5?'#8a8f94':'#46606c',cx,1.0,d/2+0.04));
    const aw=bx(w+0.2,0.06,1.2,pick2(['#e3a347','#55745c','#c0563f','#4f6e8a']),cx,2.55,d/2+0.55);aw.rotation.x=0.3;g.add(aw);sgn(g,cx,H-0.4,d/2+0.03,w-0.3,0.5);
    gable(g,cx,0,w,d,H,0.7,0.25,'#9c9a94','#7a7873',c);if(rnd2()<0.5)g.add(bx(0.6,0.7,0.5,'#3f6fa3',cx+w/2-0.5,0.35,d/2+1.6));x+=w+0.15;}
   umbrella(g,3.8,3.6,'#e3a347','#55745c');dish(g,-3.2,3.6,0.6,0.3);},
  market(g){const gr=new THREE.Mesh(new THREE.PlaneGeometry(10,9),L('#d8c4a0'));gr.rotation.x=-Math.PI/2;gr.position.y=0.04;gr.receiveShadow=true;g.add(gr);
   const UC=[['#e3a347','#55745c'],['#c0563f','#f2e6cc'],['#55745c','#e8b33c'],['#4f6e8a','#f2e6cc']];for(let r=0;r<3;r++)for(let k=0;k<3;k++){const [a,b]=pick2(UC);umbrella(g,-3.2+k*3.2+(rnd2()-0.5)*0.5,-1.4+r*2.6,a,b);}
   g.add(bx(9,2.4,0.15,PAL.creamD,0,1.2,-4.3));for(let x=-4;x<=4.1;x+=2.67)g.add(cy(0.06,0.06,2.6,'#8d9096',x,1.3,-2.6,6));const rf=bx(9.4,0.08,2.4,'#9c9a94',0,2.65,-3.4);rf.rotation.x=0.15;g.add(rf);
   for(let k=0;k<6;k++)g.add(bx(0.8,0.5,0.6,pick2(['#b5573e','#8a6a4e','#e3a347']),-3.6+k*1.45,0.25,-3.6));},
  church(g){const w=6.5,d=9,H=4.6,c='#e8b33c',dk='#c9952c',zf=-0.5+d/2;g.add(bx(w,H,d,c,0,H/2,-0.5),bx(w+0.06,0.6,d+0.06,dk,0,0.3,-0.5));const rg=new THREE.Group();rg.rotation.y=Math.PI/2;gable(rg,0.5,0,d,w,H,2.4,0.4,'#b5573e','#8e3f2e',c);g.add(rg);
   [-1,1].forEach(s=>{for(let z=-4;z<3.5;z+=1.8)g.add(bx(0.08,1.7,0.6,'#46606c',s*(w/2+0.01),2.3,z),bx(0.14,0.1,0.76,'#ecdcbc',s*(w/2+0.03),1.4,z));});
   g.add(bx(1.5,2.6,0.1,PAL.plum,0.8,1.3,zf+0.03),bx(1.8,0.2,0.2,dk,0.8,2.7,zf+0.08));const rw=cy(0.45,0.45,0.06,'#46606c',0.8,H+0.9,zf+0.02,16);rw.rotation.x=Math.PI/2;g.add(rw);
   const tx=-w/2+0.9,tz=zf+0.4;g.add(bx(1.8,7,1.8,c,tx,3.5,tz),bx(2.05,0.2,2.05,dk,tx,7.05,tz),bx(0.5,0.9,0.06,'#3a2a30',tx,5.9,tz+0.91));const dm=new THREE.Mesh(new THREE.SphereGeometry(0.75,14,8,0,Math.PI*2,0,Math.PI/2),L('#d9c7a3'));dm.position.set(tx,7.15,tz);dm.castShadow=true;g.add(dm,bx(0.08,0.8,0.08,'#f2e6cc',tx,8.3,tz),bx(0.45,0.08,0.08,'#f2e6cc',tx,8.45,tz));
   g.add(bx(3.4,1.1,0.22,PAL.cream,-3.3,0.55,5.2),bx(3.4,1.1,0.22,PAL.cream,3.3,0.55,5.2),bx(3.2,1.0,0.06,'#231c1e',0,0.6,5.2));},
  house(g){const [c,dk]=pick2(APT),w=7,d=5.5,H=3,zf=-0.5+d/2;g.add(bx(w,H,d,c,0,H/2,-0.5),bx(w+0.06,0.5,d+0.06,dk,0,0.25,-0.5));const hr=new THREE.ConeGeometry(1,1.8,4,1);hr.rotateY(Math.PI/4);const rm=new THREE.Mesh(hr,L(pick2(['#b5573e','#9c9a94'])));rm.scale.set((w/2+0.5)/0.7071,1,(d/2+0.5)/0.7071);rm.position.set(0,H+0.9,-0.5);rm.castShadow=true;g.add(rm);
   lw(g,-2,1.7,zf+0.02);lw(g,2,1.7,zf+0.02);g.add(bx(1.1,2.2,0.08,PAL.plum,0,1.1,zf+0.04),bx(3.6,1.4,0.2,PAL.cream,-3.2,0.7,4.6),bx(3.6,1.4,0.2,PAL.cream,3.2,0.7,4.6),bx(2.8,1.3,0.06,'#231c1e',0,0.75,4.6),bx(0.2,1.4,9,PAL.cream,-5,0.7,0.1),bx(0.2,1.4,9,PAL.cream,5,0.7,0.1));
   tank(g,3.6,0,-3,0.9);dish(g,-1.6,H+0.55,0.4,0.3);},
  tower(g){const Hh=7,s='#4e484b';[[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([a,b])=>g.add(cy(0.07,0.07,Hh,s,a*1.1,Hh/2,b*1.1,6)));for(let y=1.5;y<Hh;y+=2)g.add(bx(2.3,0.06,0.06,s,0,y,1.1),bx(2.3,0.06,0.06,s,0,y,-1.1),bx(0.06,0.06,2.3,s,1.1,y,0),bx(0.06,0.06,2.3,s,-1.1,y,0));
   g.add(bx(2.6,0.12,2.6,s,0,Hh,0),cy(1.1,1.1,2,'#7a767d',0,Hh+1.06,0,16),cy(0.2,1.1,0.5,'#7a767d',0,Hh+2.3,0,16));for(let y=0.4;y<Hh;y+=0.45)g.add(bx(0.4,0.03,0.03,s,0,y,1.2));
   g.add(bx(4,2.6,3.2,PAL.cream,3.6,1.3,-2.6));const hr=new THREE.ConeGeometry(1,1.2,4,1);hr.rotateY(Math.PI/4);const rm=new THREE.Mesh(hr,L('#b5573e'));rm.scale.set(2.5/0.7071,1,1.9/0.7071);rm.position.set(3.6,3.2,-2.6);g.add(rm);umbrella(g,-3,3,'#c0563f','#f2e6cc');}};
 const STREET=['shops','market','church','shops','house','tower','shops','house'];let sti=0;
 const placeStreet=(x,z)=>{const ry=z>=42?Math.PI:z<=-48?0:x<0?Math.PI/2:-Math.PI/2;const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;SB[STREET[sti++%STREET.length]](g);sc.add(g);};
 const lotT={};let courtDone=false;
 lots.forEach(([x,z])=>{const r=rnd();const side=Math.abs(x)>=48&&z>-40&&z<30;const nb=lotT[side?x+','+(z-12):(x-12)+','+z];let t;
  if(r<0.62){const w=8+rnd()*2,d=7+rnd()*2;if(nb==='apt'){for(let k=0;k<5;k++)rnd();placeStreet(x,z);t='street';}else{apartment(x,z,w,d);t='apt';}}
  else if(r<0.8){if(!courtDone){court(x,z);courtDone=true;t='court';}else{placeStreet(x,z);t='street';}}
  else{park(x,z);t='park';}lotT[x+','+z]=t;});
 const trunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.75,1,1,6),L(PAL.trunk),brM.length);brM.forEach((m,k)=>trunk.setMatrixAt(k,m));trunk.castShadow=true;trunk.receiveShadow=true;trunk.name='SM_Tree_Branches';sc.add(trunk);
 leafB.flush(sc,'SM_Tree_Canopy');fpB.flush(sc);courtL.flush(sc);lineB.flush(sc,'SM_Field_Lines');dashB.flush(sc,'SM_Road_Dashes');
 Object.values(WB).forEach(b=>b.flush(sc,'SM_Windows'));sill.flush(sc,'SM_Window_Sills');
 for(let x=-52;x<=52;x+=13){sc.add(cy(0.06,0.09,4.2,PAL.fence,x,2.1,32.4,6),bx(0.9,0.1,0.25,PAL.fence,x+0.35,4.2,32.2),bx(0.4,0.12,0.3,'#f5e1a8',x+0.7,4.1,32.1));}
 [[-9.6,24.6],[9.6,24.6],[3,13.6],[-3,-3]].forEach(([x,z])=>sc.add(cy(0.28,0.24,0.75,PAL.sageD,x,0.38,z,10),cy(0.3,0.3,0.06,'#324b3d',x,0.78,z,10)));
 // ---------- vehicles ----------
 const cars=[];const wG=new THREE.CylinderGeometry(0.32,0.32,0.26,12);wG.rotateX(Math.PI/2);const hubG=new THREE.CylinderGeometry(0.15,0.15,0.28,8);hubG.rotateX(Math.PI/2);
 const wheel=(g,x,z,r=1)=>{const w=new THREE.Mesh(wG,L('#231c1e'));w.position.set(x,0.32*r,z);w.scale.set(r,r,1);w.castShadow=true;const h=new THREE.Mesh(hubG,L('#b9b2a6'));h.position.copy(w.position);h.scale.set(r,r,1);g.add(w,h);};
 const busSide=signTex('UNITY SECONDARY SCHOOL','#e8b33c','#231c1e',1024,96);
 function bus(){const g=new THREE.Group();g.name='SM_SchoolBus';const Y='#e8b33c',YD='#c9952c',K='#231c1e',GL='#2f3c44';
  g.add(bx(6.4,1.95,2.3,Y,-0.7,1.5,0),bx(6.3,0.16,2.15,Y,-0.7,2.55,0));[-1,1].forEach(s=>{const e=cy(0.17,0.17,6.3,Y,-0.7,2.44,s*0.98,10);e.rotation.z=Math.PI/2;g.add(e);});
  g.add(bx(1.25,1.0,2.1,Y,3.05,1.0,0),bx(1.1,0.08,1.9,YD,3.05,1.52,0),bx(0.08,0.8,2.05,GL,2.47,2.05,0),bx(0.06,0.42,1.0,K,3.69,1.0,0),bx(0.22,0.24,2.35,K,3.78,0.52,0),bx(0.22,0.26,2.35,K,-3.95,0.62,0));
  g.add(bx(5.6,0.72,2.33,GL,-0.95,2.02,0));const pil=new Batch(new THREE.BoxGeometry(0.12,0.74,2.36),L(Y));for(let x=-3.65;x<=1.9;x+=0.82)pil.add(x,2.02,0);pil.flush(g);
  g.add(bx(6.42,0.08,2.34,K,-0.7,1.42,0),bx(6.42,0.08,2.34,K,-0.7,1.02,0),bx(6.42,0.06,2.34,K,-0.7,0.66,0));
  [-1,1].forEach(s=>{const t=new THREE.Mesh(new THREE.PlaneGeometry(4.6,0.34),new THREE.MeshBasicMaterial({map:busSide}));t.position.set(-0.9,1.22,s*1.18);if(s<0)t.rotation.y=Math.PI;g.add(t);});
  g.add(bx(0.06,0.9,0.7,GL,2.0,1.5,1.17));[[3.7,0.62],[3.7,-0.62]].forEach(([x,z])=>g.add(cy(0.11,0.11,0.06,'#f5e1a8',x,1.2,z,10).rotateZ(Math.PI/2)));
  [[2.45,0.95],[2.45,-0.95],[-3.9,0.95],[-3.9,-0.95]].forEach(([x,z])=>g.add(bx(0.08,0.14,0.14,x>0?'#e0853a':'#c0392b',x,2.5,z)));
  const st=cy(0.2,0.2,0.03,'#c0392b',1.4,1.75,-1.22,8);st.rotation.x=Math.PI/2;g.add(st,bx(0.08,0.5,0.05,K,3.45,1.95,1.25),bx(0.08,0.5,0.05,K,3.45,1.95,-1.25),bx(0.06,0.3,0.18,K,3.45,1.75,1.35),bx(0.06,0.3,0.18,K,3.45,1.75,-1.35));
  [[2.75,1],[-2.3,1],[-3.05,1]].forEach(([x])=>{[-1.06,1.06].forEach(z=>wheel(g,x,z,1.4));g.add(bx(1.1,0.5,2.34,K,x,0.75,0));});return g;}
 function car(c,kind){const g=new THREE.Group();g.name='SM_Vehicle_'+kind;
  if(kind==='keke'){const Y='#e8b33c',K='#231c1e';g.add(bx(2.0,0.6,1.25,Y,-0.1,0.65,0),bx(2.0,0.12,1.27,'#2f7a3a',-0.1,0.98,0),bx(0.55,0.5,0.45,Y,1.05,0.62,0),bx(0.05,0.7,1.1,PAL.glass,0.82,1.38,0),bx(2.15,0.08,1.38,'#2f7a3a',-0.12,1.78,0),bx(0.9,0.55,0.05,K,-0.6,1.3,0.66),bx(0.9,0.55,0.05,K,-0.6,1.3,-0.66));[[0.8,0.6],[0.8,-0.6],[-1.05,0.6],[-1.05,-0.6]].forEach(([x,z])=>g.add(bx(0.05,0.85,0.05,K,x,1.35,z)));wheel(g,1.05,0,0.75);wheel(g,-0.75,0.62,0.75);wheel(g,-0.75,-0.62,0.75);g.add(bx(0.05,0.12,0.18,'#f5e1a8',1.33,0.75,0));return g;}
  if(kind==='van'){g.add(bx(3.4,1.4,1.7,c,0,1.0,0),bx(0.9,0.7,1.6,PAL.glass,1.25,1.25,0),bx(1.9,0.55,1.72,PAL.glass,-0.35,1.35,0));}
  else if(kind==='danfo'){g.add(bx(3.8,1.5,1.8,'#e8b33c',0,1.05,0),bx(3.82,0.14,1.82,PAL.fence,0,0.82,0),bx(3.5,0.5,1.83,PAL.glass,0,1.45,0));}
  else{g.add(bx(3.1,0.7,1.6,c,0,0.7,0),bx(1.7,0.6,1.45,c,-0.15,1.3,0),bx(1.72,0.42,1.47,PAL.glass,-0.15,1.32,0));}
  [-1.05,1.05].forEach(x=>[-0.82,0.82].forEach(z=>wheel(g,x,z)));g.add(bx(0.06,0.18,0.3,'#f5e1a8',kind==='danfo'?1.92:1.57,0.78,0.5),bx(0.06,0.18,0.3,'#f5e1a8',kind==='danfo'?1.92:1.57,0.78,-0.5));return g;}
 const VC=[PAL.sageD,PAL.cream,PAL.brick,'#3f4d5a',PAL.ochre];
 for(let k=0;k<9;k++){const kind=k===4||k===7?'bus':k%3===0?'danfo':k%3===1?'van':'car';const g=kind==='bus'?bus():car(VC[k%5],kind);const north=k>=6;const dir=k%2?1:-1;const z=north?(dir>0?-37.6:-35.9):(dir>0?27.6:29.8);
  if(kind==='bus')g.scale.setScalar(0.82);g.position.set(-ext+k*14,0,z);g.rotation.y=dir>0?0:Math.PI;sc.add(g);cars.push({g,dir,sp:kind==='bus'?4:5+rnd()*3});}
 [-30,-24,-18,-12].forEach((x,k)=>{const g=bus();g.rotation.y=Math.PI/2;g.position.set(x+(k%2)*0.3,0,37.4);sc.add(g);});
 [[-49,27.6,1],[7,29.8,-1],[23,-37.6,1],[-27,-35.9,-1],[35,27.6,1]].forEach(([x,z,dir])=>{const g=car(null,'keke');g.position.set(x,0,z);g.rotation.y=dir>0?0:Math.PI;sc.add(g);cars.push({g,dir,sp:3.6+rnd2()});});
 cars.forEach(c=>{c.len=c.g.name==='SM_SchoolBus'?6.2:c.g.name==='SM_Vehicle_keke'?2.6:4.0;c.v=c.sp;});
 for(let it=0;it<20;it++){let moved=false;cars.forEach((c,i)=>{cars.forEach((o,j)=>{if(j>=i||o.dir!==c.dir||Math.abs(o.g.position.z-c.g.position.z)>0.8)return;const need=(c.len+o.len)/2+1.6,d=c.g.position.x-o.g.position.x;if(Math.abs(d)<need){c.g.position.x=o.g.position.x+(d>=0?need:-need);moved=true;}});});if(!moved)break;}
 // ---------- life ----------
 const Gd=grid(W.walk,-30,-30,2);
 const F2=W.FIELD;const targets=W.pathTiles.filter(([i,j])=>!(i>=F2.i&&i<F2.i+F2.w&&j>=F2.j&&j<F2.j+F2.d)&&j<27);
 const npcs=W.NPCS.map((p,k)=>{const t=targets[(k*53)%targets.length];const o=makePerson(p);sc.add(o);return new Walker(o,X(t[0])+1,Z(t[1])+1,p.adult?1.5:1.8+Math.random()*0.6);});
 const statics=W.STATIC.map(p=>{const o=makePerson(p);o.position.set(X(p.i),0,Z(p.j));sc.add(o);return o;});
 const kickers=[0,1,2,3,4,5].map(k=>{const o=makePerson({skin:['#5c3520','#7a4a2e','#86553a','#6b3f26'][k%4],shirt:k<3?'#c0563f':'#4f6e8a',bottom:'#f4eedb',hair:'short',casual:1});sc.add(o);return{o,a:k*1.05,r:1.6+(k%3)*0.7};});
 const runners=[0,1].map(k=>{const o=makePerson({skin:'#6b3f26',shirt:k?'#e3a347':'#f4eedb',bottom:'#22345e',hair:k?'puffs':'short',skirt:k,casual:1});sc.add(o);return{o,t:k*3.1,r:RI+0.5+k*0.45};});
 const fball=new THREE.Mesh(new THREE.SphereGeometry(0.16,10,8),L(PAL.white));fball.castShadow=true;sc.add(fball);
 const peds=[];for(let k=0;k<8;k++){const o=makePerson({skin:['#5c3520','#7a4a2e','#86553a','#6b3f26'][k%4],shirt:[PAL.ochre,PAL.sage,PAL.brick,'#4f6e8a'][k%4],bottom:'#3a2a30',hair:k%2?'wrap':'short',skirt:k%2,adult:1,casual:1,tray:k%3===0,trayC:'#e8901e'});const dir=k%2?1:-1;o.position.set(-50+k*13,0,dir>0?32.2:33.6);o.rotation.y=dir>0?Math.PI/2:-Math.PI/2;sc.add(o);peds.push({o,dir,sp:1.1+rnd()*0.4});}
 const doorOf=id=>{const b=W.B.find(x=>x.id===id)||W.FIELD;return[X(b.door[0])+1,Z(b.door[1])+1];};
 const stadPt=(r,u)=>{const per=4*HS+2*Math.PI*r;let s=((u%per)+per)%per;if(s<2*HS)return[fcx-HS+s,fcz-r,0];s-=2*HS;if(s<Math.PI*r){const a=-Math.PI/2+s/r;return[fcx+HS+Math.cos(a)*r,fcz+Math.sin(a)*r,a];}s-=Math.PI*r;if(s<2*HS)return[fcx+HS-s,fcz+r,Math.PI];s-=2*HS;const a=Math.PI/2+s/r;return[fcx-HS+Math.cos(a)*r,fcz+Math.sin(a)*r,a];};
 let life=true;function setLife(v){life=v;[...npcs.map(n=>n.o),...statics,...kickers.map(k=>k.o),...runners.map(r=>r.o),fball].forEach(o=>o.visible=v);}
 function update(dt,t,focus){wind.value=t;
  if(flagGeo){const pa=flagGeo.attributes.position;for(let k=0;k<pa.count;k++){const x=flagBase[k*3];pa.array[k*3+2]=Math.sin(x*3.2-t*5)*0.12*x;}pa.needsUpdate=true;}
  if(life){npcs.forEach(n=>{const mv=n.step(dt);if(!mv){n.wait-=dt;if(n.wait<=0){const tt=targets[Math.floor(Math.random()*targets.length)];n.goTo(Gd,X(tt[0])+1,Z(tt[1])+1,false,0.5);n.wait=1+Math.random()*4;}}poseUpdate(n.o,dt,mv);});
   statics.forEach(o=>poseUpdate(o,dt,false));
   kickers.forEach((k,i)=>{k.a+=dt*(0.45+i*0.06);const x=fcx+Math.cos(k.a)*k.r*2.2,z=fcz+Math.sin(k.a*1.3)*k.r*0.9;const dx=x-k.o.position.x,dz=z-k.o.position.z;k.o.position.set(x,0,z);if(Math.hypot(dx,dz)>1e-4)k.o.rotation.y=Math.atan2(dx,dz);poseUpdate(k.o,dt,true,null,1.4);});
   for(let i=0;i<kickers.length;i++)for(let j=i+1;j<kickers.length;j++){const a=kickers[i].o.position,b=kickers[j].o.position,dx=b.x-a.x,dz=b.z-a.z,d2=dx*dx+dz*dz;if(d2<0.4225){const d=Math.sqrt(d2)||0.01,q=(0.65-d)/2/d;a.x-=dx*q;a.z-=dz*q;b.x+=dx*q;b.z+=dz*q;}}
   runners.forEach(r=>{r.t+=dt*3.4;const [x,z]=stadPt(r.r,r.t);const p=r.o.position,dx=x-p.x,dz=z-p.z;p.set(x,0,z);if(Math.hypot(dx,dz)>1e-4)r.o.rotation.y=Math.atan2(dx,dz);poseUpdate(r.o,dt,true,null,1.7);});
   const lead=kickers[Math.floor(t/2.5)%6].o.position;fball.position.x+=(lead.x+0.4-fball.position.x)*Math.min(1,dt*3);fball.position.z+=(lead.z+0.3-fball.position.z)*Math.min(1,dt*3);fball.position.y=0.16+Math.abs(Math.sin(t*4))*0.25;}
  {const span=2*(ext+5);cars.forEach(c=>{let gap=1e9,lead=null;const cx=c.g.position.x,cz=c.z0??c.g.position.z;cars.forEach(o=>{if(o===c||o.dir!==c.dir||Math.abs((o.z0??o.g.position.z)-cz)>0.8)return;let d=(o.g.position.x-cx)*c.dir;if(d<=0)d+=span;if(d<gap){gap=d;lead=o;}});
   const need=lead?(c.len+lead.len)/2+1.4:0;let tgt=c.sp;if(lead){if(gap<need)tgt=0;else if(gap<need+5)tgt=Math.min(c.sp,lead.v*(gap-need)/5+lead.v*0.5);}
   const pl=getPlayer&&getPlayer();if(pl&&pl.visible!==false){const pp=pl.position;if(Math.abs(pp.z-cz)<1.6){const d=(pp.x-cx)*c.dir,stop=c.len/2+1.3;if(d>-c.len/2-0.3&&d<stop+9){c.honk=(c.honk||0)+dt;if(d<stop+0.4)tgt=0;else tgt=Math.min(tgt,c.sp*(d-stop)/9);if(d<stop+3&&d>-c.len/2){const side=pp.z>cz?-1:1;c.sw=Math.max(-0.9,Math.min(0.9,(c.sw||0)+side*dt*1.2));}}}}
   if(c.sw&&!(pl&&Math.abs(pl.position.z-cz)<1.6)){c.sw*=1-Math.min(1,dt*1.5);if(Math.abs(c.sw)<0.01)c.sw=0;}c.v+=(tgt-c.v)*Math.min(1,dt*(tgt<c.v?6:1.5));});
   cars.forEach(c=>{c.z0??=c.g.position.z;c.g.position.z=c.z0+(c.sw||0);c.g.rotation.z=0;c.g.position.x+=c.dir*c.v*dt;if(c.g.position.x>ext+5)c.g.position.x=-ext-5;if(c.g.position.x<-ext-5)c.g.position.x=ext+5;});}
  peds.forEach(p=>{let gap=1e9,lead=null;peds.forEach(o=>{if(o===p||o.dir!==p.dir)return;let d=(o.o.position.x-p.o.position.x)*p.dir;if(d<=0)d+=2*(ext-2);if(d<gap){gap=d;lead=o;}});p.v=lead&&gap<1.1?Math.min(p.sp,lead.v??lead.sp):p.sp;});
  peds.forEach(p=>{p.o.position.x+=p.dir*p.v*dt;if(Math.abs(p.o.position.x)>ext-2)p.o.position.x=-p.dir*(ext-2);poseUpdate(p.o,dt,p.v>0.2);});
  if(life){const R=0.62,pl=getPlayer&&getPlayer();for(let i=0;i<npcs.length;i++){const a=npcs[i];
    for(let j=i+1;j<npcs.length;j++){const b=npcs[j],dx=b.x-a.x,dz=b.z-a.z,d2=dx*dx+dz*dz;if(d2<R*R&&d2>1e-6){const d=Math.sqrt(d2),k=(R-d)/2/d,ax=a.x-dx*k,az=a.z-dz*k,bx_=b.x+dx*k,bz=b.z+dz*k;if(Gd.free(ax,az)){a.x=ax;a.z=az;}if(Gd.free(bx_,bz)){b.x=bx_;b.z=bz;}}}
    const fixed=pl?[...statics,pl]:statics;for(const s of fixed){const dx=a.x-s.position.x,dz=a.z-s.position.z,d2=dx*dx+dz*dz;if(d2<R*R&&d2>1e-6){const d=Math.sqrt(d2),k=(R-d)/d,nx=a.x+dx*k,nz=a.z+dz*k;if(Gd.free(nx,nz)){a.x=nx;a.z=nz;}}}
    a.o.position.set(a.x,0,a.z);}}
  if(focus){sun.position.set(focus.x-34,48,focus.z+22);sun.target.position.copy(focus);}}
 // ---------- static batching: merge every non-animated mesh by material (draw-call budget) ----------
 {const tmpM=new THREE.Matrix4(),v=new V3(),nm=new THREE.Matrix3();
  const mergeList=(list,inv)=>{let nv=0,ni=0;list.forEach(o=>{const g=o.geometry,n=g.attributes.position.count;nv+=n;ni+=g.index?g.index.count:n;});
   const P=new Float32Array(nv*3),N=new Float32Array(nv*3),U=new Float32Array(nv*2),I=nv>65535?new Uint32Array(ni):new Uint16Array(ni);let vo=0,io=0;
   list.forEach(o=>{const g=o.geometry,n=g.attributes.position.count,mw=inv?tmpM.multiplyMatrices(inv,o.matrixWorld):o.matrixWorld;nm.getNormalMatrix(mw);const pa=g.attributes.position,na=g.attributes.normal,ua=g.attributes.uv;
    for(let i=0;i<n;i++){const q=(vo+i)*3;v.fromBufferAttribute(pa,i).applyMatrix4(mw);P[q]=v.x;P[q+1]=v.y;P[q+2]=v.z;if(na){v.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();N[q]=v.x;N[q+1]=v.y;N[q+2]=v.z;}if(ua){U[(vo+i)*2]=ua.getX(i);U[(vo+i)*2+1]=ua.getY(i);}}
    if(g.index){for(let i=0;i<g.index.count;i++)I[io+i]=g.index.getX(i)+vo;io+=g.index.count;}else{for(let i=0;i<n;i++)I[io+i]=vo+i;io+=n;}vo+=n;});
   const ge=new THREE.BufferGeometry();ge.setAttribute('position',new THREE.BufferAttribute(P,3));ge.setAttribute('normal',new THREE.BufferAttribute(N,3));ge.setAttribute('uv',new THREE.BufferAttribute(U,2));ge.setIndex(new THREE.BufferAttribute(I,1));ge.computeBoundingSphere();return ge;};
  sc.updateMatrixWorld(true);
  const dyn=new Set([...cars.map(c=>c.g),...npcs.map(n=>n.o),...statics,...kickers.map(k=>k.o),...runners.map(r=>r.o),fball,...peds.map(p=>p.o),ground]);
  const bk=new Map(),kill=[];const visit=o=>{if(dyn.has(o)||o.isInstancedMesh||o.isSprite||o.isLight)return;
   if(o.isMesh&&o.visible&&o.geometry!==flagGeo&&!Array.isArray(o.material)&&o.geometry.attributes.position){const bid=o.userData.bid;const key=o.material.uuid+'|'+(o.castShadow?1:0)+(o.receiveShadow?1:0)+'|'+(bid??'');if(!bk.has(key))bk.set(key,{m:o.material,cs:o.castShadow,rs:o.receiveShadow,bid,list:[]});bk.get(key).list.push(o);kill.push(o);}
   o.children.forEach(visit);};
  sc.children.slice().forEach(visit);
  const merged=[];bk.forEach(b=>{const me=new THREE.Mesh(mergeList(b.list,null),b.m);me.castShadow=b.cs;me.receiveShadow=b.rs;if(b.bid!=null)me.userData.bid=b.bid;merged.push(me);});
  kill.forEach(o=>o.parent&&o.parent.remove(o));clickables.length=0;merged.forEach(me=>{sc.add(me);if(me.userData.bid!=null)clickables.push(me);});
  cars.forEach(c=>{c.g.updateMatrixWorld(true);const inv=c.g.matrixWorld.clone().invert(),gm=new Map(),ks=[];c.g.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&!Array.isArray(o.material)){const k=o.material.uuid;if(!gm.has(k))gm.set(k,{m:o.material,list:[]});gm.get(k).list.push(o);ks.push(o);}});
   const out=[];gm.forEach(b=>{const me=new THREE.Mesh(mergeList(b.list,inv),b.m);me.castShadow=true;out.push(me);});ks.forEach(o=>o.parent&&o.parent.remove(o));out.forEach(me=>c.g.add(me));});}
 let getPlayer=null;
 const carAt=(x,z)=>cars.some(c=>{const p=c.g.position;return Math.abs(x-p.x)<c.len/2+0.35&&Math.abs(z-p.z)<(c.len>5?1.55:1.2);});
 return{free:(x,z)=>Gd.free(x,z)&&!carAt(x,z),carAt,setPlayer:f=>getPlayer=f,setLife,scene:sc,ground,clickables,G:Gd,X,Z,doorOf,sun,update,field:{x0:fx0+0.6,x1:fx1-0.6,z0:fz0+0.6,z1:fz1-0.6}};}
