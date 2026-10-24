import * as THREE from 'three';
import {L,bx,cy,Batch,sunRig} from './look.js';
import {makePerson} from '../common.js';
import {TAJ} from './excursion-data.js';
// Taj Mahal destination: textures, exterior world and every building interior. Logic lives in taj.js.
export const C={mar:'#f3ede2',sand:'#b45a3f',sandD:'#9a4632',sandL:'#c9745a',path:'#d1a07c',grass:'#6f9a55',cyp:'#3d6a44',gold:'#c9a24a',line:'#f1e6d4'};
let seed=11;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
export const ct=(w,h,f)=>{const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;t.userData.canvas=c;return t;};
export const rep=(t,x,y)=>{const c=t.clone();c.wrapS=c.wrapT=THREE.RepeatWrapping;c.repeat.set(x,y);c.needsUpdate=true;return c;};
const LM=(o)=>new THREE.MeshLambertMaterial(o);
// ---------- drawing helpers ----------
function arch(g,x,y,w,h){const s=Math.min(h*0.45,w*0.8);g.moveTo(x,y+h);g.lineTo(x,y+s);g.bezierCurveTo(x,y+s*0.4,x+w*0.28,y+s*0.1,x+w/2,y);g.bezierCurveTo(x+w*0.72,y+s*0.1,x+w,y+s*0.4,x+w,y+s);g.lineTo(x+w,y+h);g.closePath();}
function speck(g,W,H,rgb,n,a){for(let i=0;i<n;i++){g.fillStyle=`rgba(${rgb},${(a*rnd()).toFixed(3)})`;g.fillRect(rnd()*W,rnd()*H,1+rnd()*5,1+rnd()*2);}}
function cal(g,x,y,w,h){g.fillStyle='#f4efe4';g.fillRect(x,y,w,h);g.strokeStyle='#241d1b';const v=h>w,Ln=v?h:w,T=v?w:h;g.lineWidth=Math.max(1,T*0.1);g.lineCap='round';
 for(let p=T*0.3;p<Ln-T*0.4;p+=T*0.45){g.beginPath();if(v){g.moveTo(x+T*0.2,y+p);g.quadraticCurveTo(x+T*(0.3+rnd()*0.4),y+p-T*0.35,x+T*0.8,y+p+T*0.1);}else{g.moveTo(x+p,y+T*0.75);g.quadraticCurveTo(x+p+T*0.15,y+T*(0.1+rnd()*0.4),x+p+T*0.3,y+T*0.7);if(rnd()<0.45){g.moveTo(x+p+T*0.12,y+T*0.2);g.lineTo(x+p+T*0.12,y+T*0.55);}}g.stroke();}}
function vine(g,x,y,w,h,cols,step){g.save();for(let t=0;t<(w+h)*2;t+=step){let px,py;if(t<w){px=x+t;py=y;}else if(t<w+h){px=x+w;py=y+t-w;}else if(t<2*w+h){px=x+w-(t-w-h);py=y+h;}else{px=x;py=y+h-(t-2*w-h);}
  g.fillStyle='#5f7a4a';g.beginPath();g.ellipse(px+step*0.25,py,step*0.22,step*0.1,0.6,0,7);g.fill();g.fillStyle=cols[(t/step|0)%cols.length];g.beginPath();g.arc(px,py,step*0.17,0,7);g.fill();}g.restore();}
const INL=['#a8323a','#c9a24a','#3f6a8a','#7a3a5a'];
// facade texture: arches [x,y,w,h,kind] in 0..1; kinds: cut (transparent), rec, win (lattice), door, blind
export function facTex(o){const W=o.W||512,H=o.H||512;return ct(W,H,g=>{g.fillStyle=o.bg;g.fillRect(0,0,W,H);speck(g,W,H,o.sp||'110,80,60',W*H/160,0.08);
 if(o.band){const b=o.band*W;if(o.cal){cal(g,b*0.35,b*0.35,W-b*0.7,b*0.55);cal(g,b*0.35,b*0.35,b*0.55,H-b*0.35);cal(g,W-b*0.9,b*0.35,b*0.55,H-b*0.35);}g.strokeStyle=o.line;g.lineWidth=Math.max(2,b*0.12);g.strokeRect(b*0.3,b*0.3,W-b*0.6,H);}
 (o.arches||[]).forEach(([x,y,w,h,k])=>{const X=x*W,Y=y*H,AW=w*W,AH=h*H,lw=Math.max(2,AW*0.035);
  g.strokeStyle=o.line;g.lineWidth=lw;g.strokeRect(X-AW*0.1,Y-AH*0.07,AW*1.2,AH*1.07+2);
  if(o.inlay)vine(g,X-AW*0.1,Y-AH*0.07,AW*1.2,AH*0.07,INL,Math.max(8,AW*0.09));
  g.beginPath();arch(g,X,Y,AW,AH);
  if(k==='cut'){g.save();g.globalCompositeOperation='destination-out';g.fill();g.restore();}
  else if(k==='blind'){g.fillStyle=o.r0||'rgba(0,0,0,.08)';g.fill();}
  else{const gr=g.createLinearGradient(0,Y,0,Y+AH);gr.addColorStop(0,o.r1);gr.addColorStop(1,o.r2);g.fillStyle=gr;g.fill();}
  g.beginPath();arch(g,X,Y,AW,AH);g.lineWidth=lw;g.strokeStyle=o.line;g.stroke();
  if(k==='win'||k==='door'){const ix=X+AW*0.2,iw=AW*0.6,iy=Y+AH*0.28,ih=AH*0.72;g.beginPath();arch(g,ix,iy,iw,ih);g.fillStyle=k==='door'?'#33241f':'rgba(40,30,28,.6)';g.fill();g.strokeStyle=o.line;g.lineWidth=lw*0.6;g.stroke();
   if(k==='win'){g.save();g.beginPath();arch(g,ix,iy,iw,ih);g.clip();g.strokeStyle=o.line;g.lineWidth=Math.max(1,lw*0.35);const st=iw/5;for(let q=-ih;q<iw+ih;q+=st){g.beginPath();g.moveTo(ix+q,iy);g.lineTo(ix+q-ih,iy+ih);g.stroke();g.beginPath();g.moveTo(ix+q-ih,iy);g.lineTo(ix+q,iy+ih);g.stroke();}g.restore();}}});});}
export function panelTex(title,body,bg='#f5ead3',fg='#3a2a30',acc='#a8553f'){return ct(512,360,(g,W,H)=>{g.fillStyle=bg;g.fillRect(0,0,W,H);g.strokeStyle=fg;g.lineWidth=8;g.strokeRect(4,4,W-8,H-8);g.fillStyle=acc;g.fillRect(4,4,W-8,10);
 g.fillStyle=fg;g.font='bold 34px "Patrick Hand",cursive';let y=58;y=wrap(g,title,24,y,W-48,36);g.font='19px "Atkinson Hyperlegible",sans-serif';wrap(g,body,24,y+8,W-48,25,H-16);});}
function wrap(g,t,x,y,w,lh,maxY=1e9){const ws=t.split(' ');let line='';for(const wd of ws){const tt=line?line+' '+wd:wd;if(g.measureText(tt).width>w&&line){if(y>maxY-lh){g.fillText(line+'\u2026',x,y);return y+lh;}g.fillText(line,x,y);y+=lh;line=wd;}else line=tt;}if(line)g.fillText(line,x,y);return y+lh;}
export const signTex=(txt,bg,fg,w=1024,h=128,font='bold 58px "Atkinson Hyperlegible",sans-serif')=>ct(w,h,(g,W,H)=>{g.fillStyle=bg;g.fillRect(0,0,W,H);g.strokeStyle=fg;g.lineWidth=6;g.strokeRect(6,6,W-12,H-12);g.fillStyle=fg;g.font=font;g.textAlign='center';g.textBaseline='middle';g.fillText(txt,W/2,H/2+2);});
const tileT=(a,b,n=8,gr='rgba(80,60,40,.25)')=>ct(256,256,(g,W,H)=>{const s=W/n;for(let i=0;i<n;i++)for(let j=0;j<n;j++){g.fillStyle=(i+j)%2?a:b;g.fillRect(i*s,j*s,s,s);}speck(g,W,H,'90,70,50',500,0.06);g.strokeStyle=gr;g.lineWidth=2;for(let i=0;i<=n;i++){g.beginPath();g.moveTo(i*s,0);g.lineTo(i*s,H);g.stroke();g.beginPath();g.moveTo(0,i*s);g.lineTo(W,i*s);g.stroke();}});
const starT=(bg,ln)=>ct(256,256,(g,W,H)=>{g.fillStyle=bg;g.fillRect(0,0,W,H);speck(g,W,H,'120,100,80',700,0.07);g.strokeStyle=ln;g.lineWidth=3;const c=W/2,r=W*0.42;for(let k=0;k<2;k++){g.beginPath();for(let i=0;i<=4;i++){const a=i*Math.PI/2+k*Math.PI/4;const px=c+Math.cos(a)*r,py=c+Math.sin(a)*r;i?g.lineTo(px,py):g.moveTo(px,py);}g.stroke();}g.strokeRect(2,2,W-4,H-4);g.beginPath();g.arc(c,c,r*0.35,0,7);g.stroke();});
const woodT=ct(256,256,(g,W,H)=>{for(let i=0;i<8;i++){g.fillStyle=['#9a6a44','#8a5c3a','#a87650','#93633f'][i%4];g.fillRect(0,i*32,W,32);}g.strokeStyle='rgba(50,30,20,.35)';for(let i=0;i<9;i++){g.beginPath();g.moveTo(0,i*32);g.lineTo(W,i*32);g.stroke();}speck(g,W,H,'60,40,20',400,0.1);});
const domeT=ct(512,256,(g,W,H)=>{g.fillStyle='#f1eadc';g.fillRect(0,0,W,H);g.strokeStyle='rgba(150,120,80,.55)';g.lineWidth=2;for(let i=0;i<32;i++){g.beginPath();g.moveTo(i*W/32,0);g.lineTo(i*W/32,H);g.stroke();}for(let j=1;j<5;j++){g.beginPath();g.moveTo(0,j*H/5);g.lineTo(W,j*H/5);g.stroke();}g.fillStyle='rgba(201,162,74,.6)';for(let i=0;i<32;i++)for(let j=1;j<5;j++){g.beginPath();g.arc(i*W/32+W/64,j*H/5-H/10,3,0,7);g.fill();}});
const latT=ct(256,128,(g,W,H)=>{g.fillStyle='#f4efe4';g.fillRect(0,0,W,H);g.save();g.globalCompositeOperation='destination-out';for(let y=10;y<H-8;y+=13)for(let x=8+((y/13|0)%2)*6;x<W-6;x+=12){g.beginPath();g.moveTo(x,y-5);g.lineTo(x+5,y);g.lineTo(x,y+5);g.lineTo(x-5,y);g.closePath();g.fill();}g.restore();g.strokeStyle='#d9cdb6';g.lineWidth=6;g.strokeRect(3,3,W-6,H-6);});
const inlayT=ct(256,256,(g,W,H)=>{g.fillStyle='#f4efe4';g.fillRect(0,0,W,H);speck(g,W,H,'140,120,100',400,0.06);for(let k=0;k<5;k++){const x=40+k*44,y=128;g.strokeStyle='#5f7a4a';g.lineWidth=3;g.beginPath();g.moveTo(x,220);g.quadraticCurveTo(x+10,170,x,y);g.stroke();[[0,-18],[-14,-6],[14,-6],[-9,10],[9,10]].forEach(([dx,dy],i)=>{g.fillStyle=INL[(k+i)%4];g.beginPath();g.ellipse(x+dx,y+dy,8,12,dx*0.06,0,7);g.fill();});g.fillStyle='#c9a24a';g.beginPath();g.arc(x,y,5,0,7);g.fill();}g.strokeStyle='#241d1b';g.lineWidth=5;g.strokeRect(6,6,W-12,H-12);});
const musT=ct(256,256,(g,W,H)=>{g.fillStyle='#b8664a';g.fillRect(0,0,W,H);speck(g,W,H,'70,30,20',600,0.1);g.strokeStyle='#f1e6d4';g.lineWidth=3;for(let i=0;i<4;i++)for(let j=0;j<2;j++){const x=i*64+8,y=j*128+8;g.beginPath();arch(g,x,y,48,112);g.stroke();}});
const marbT=ct(256,256,(g,W,H)=>{g.fillStyle='#f4efe5';g.fillRect(0,0,W,H);speck(g,W,H,'150,130,110',900,0.07);g.strokeStyle='rgba(160,140,120,.16)';g.lineWidth=1;for(let i=0;i<6;i++){g.beginPath();let x=rnd()*W,y=0;g.moveTo(x,y);while(y<H){x+=(rnd()-0.5)*18;y+=10;g.lineTo(x,y);}g.stroke();}});
const sandT=ct(256,256,(g,W,H)=>{g.fillStyle='#b45a3f';g.fillRect(0,0,W,H);speck(g,W,H,'70,30,20',900,0.12);speck(g,W,H,'230,170,140',300,0.1);g.strokeStyle='rgba(60,25,18,.25)';g.lineWidth=2;for(let y=0;y<H;y+=32){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();for(let x=((y/32)%2)*32;x<W;x+=64){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+32);g.stroke();}}});
const paveT=(a,b)=>ct(256,256,(g,W,H)=>{g.fillStyle=a;g.fillRect(0,0,W,H);speck(g,W,H,'80,50,40',900,0.1);g.strokeStyle=b;g.lineWidth=2;for(let y=0;y<H;y+=32){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();for(let x=((y/32)%2)*24;x<W;x+=48){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+32);g.stroke();}}});
const grassT=ct(256,256,(g,W,H)=>{g.fillStyle='#6f9a55';g.fillRect(0,0,W,H);for(let i=0;i<1600;i++){g.fillStyle=['#7aa660','#638c4b','#86b06a','#5c8446'][i%4];g.fillRect(rnd()*W,rnd()*H,2,4);}});
const rippleT=ct(256,256,(g,W,H)=>{g.fillStyle='#ffffff';g.fillRect(0,0,W,H);g.strokeStyle='rgba(140,200,215,.55)';g.lineWidth=2;for(let i=0;i<60;i++){const x=rnd()*W,y=rnd()*H,l=10+rnd()*30;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+l/2,y-3,x+l,y);g.stroke();}});
// site plan in world coordinates (used for the map table and the map sheet)
export const PLAN={x0:-60,x1:60,z0:-78,z1:112};
export function planCanvas(){const c=document.createElement('canvas');c.width=420;c.height=660;const g=c.getContext('2d'),W=c.width,H=c.height;const X=x=>(x-PLAN.x0)/(PLAN.x1-PLAN.x0)*W,Z=z=>(z-PLAN.z0)/(PLAN.z1-PLAN.z0)*H;
 const r=(x0,x1,z0,z1,col)=>{g.fillStyle=col;g.fillRect(X(x0),Z(z0),X(x1)-X(x0),Z(z1)-Z(z0));};
 g.fillStyle='#e9dcc0';g.fillRect(0,0,W,H);r(-60,60,-78,-73,'#7fb2bd');r(-56,56,-72,-32,'#c98a6a');r(-46,46,-30,40.5,'#d6ae88');
 [[-42.5,-7.5,-27.5,-0.8],[7.5,42.5,-27.5,-0.8],[-42.5,-7.5,10.8,37.5],[7.5,42.5,10.8,37.5]].forEach(([a,b,c2,d])=>{const mx=(a+b)/2,mz=(c2+d)/2;r(a,mx-1.2,c2,mz-1.2,'#7aa35e');r(mx+1.2,b,c2,mz-1.2,'#7aa35e');r(a,mx-1.2,mz+1.2,d,'#7aa35e');r(mx+1.2,b,mz+1.2,d,'#7aa35e');});
 r(-1.6,1.6,-28,38,'#6fb7c6');r(-43,43,3.4,6.6,'#6fb7c6');r(-7,7,-2,12,'#efe8dc');r(-4,4,1,9,'#6fb7c6');
 r(-16,16,-70,-38,'#f3ede2');r(-10,10,-64,-44,'#ffffff');g.strokeStyle='#bcae96';g.lineWidth=2;g.beginPath();g.arc(X(0),Z(-54),X(7)-X(0),0,7);g.stroke();
 [[-14.5,-68.5],[14.5,-68.5],[-14.5,-39.5],[14.5,-39.5]].forEach(([x,z])=>{g.fillStyle='#fff';g.beginPath();g.arc(X(x),Z(z),4,0,7);g.fill();g.stroke();});
 r(-47,-37,-64,-44,'#a8553f');r(37,47,-64,-44,'#a8553f');r(-11,11,41,51,'#a8553f');r(-40,40,51.5,78,'#e3cfae');
 r(-34,-20,55,65,'#a8553f');r(-34,-24,68,76,'#a8553f');r(16,28,70,77,'#a8553f');r(26,34,54,62,'#a8553f');r(6,9.5,80.5,84,'#f2efe6');r(-30,62,82,112,'#b5654a');
 g.fillStyle='#3a2a30';g.font='bold 13px "Atkinson Hyperlegible",sans-serif';g.textAlign='center';
 [['MAUSOLEUM',0,-34.5],['MOSQUE',-42,-66],['JAWAB',42,-66],['CHARBAGH GARDEN',-24,-14],['GREAT GATE',0,56.5],['VISITOR CENTRE',-27,53.5],['GIFT SHOP',-29,80],['TICKETS',22,68.5],['KIOSK',30,52.5],['CAR PARK',20,104],['YAMUNA RIVER',-30,-74.2]].forEach(([t,x,z])=>g.fillText(t,X(x),Z(z)));
 g.strokeStyle='#3a2a30';g.lineWidth=4;g.strokeRect(2,2,W-4,H-4);c.userData={X,Z};return c;}
// ---------- geometry helpers ----------
function onion(r,h,seg=28){const pts=[[0.86,0],[0.95,0.08],[1,0.2],[0.99,0.32],[0.93,0.45],[0.8,0.58],[0.6,0.7],[0.4,0.8],[0.22,0.88],[0.1,0.94],[0.04,0.98],[0,1]].map(([a,b])=>new THREE.Vector2(a*r,b*h));return new THREE.LatheGeometry(pts,seg);}
const domeM=LM({color:'#f6f1e8'}),goldM=LM({color:C.gold}),marbM=LM({color:'#f3ede2',map:rep(marbT,2,2)}),sandM=LM({color:'#ffffff',map:rep(sandT,3,3)});
function finial(h){const g=new THREE.Group();g.add(cy(0.06*h,0.09*h,h,goldM,0,h/2,0,8));[0.25,0.45,0.62].forEach((t,i)=>{const s=new THREE.Mesh(new THREE.SphereGeometry(0.16*h*(1-i*0.22),10,8),goldM);s.position.y=t*h;g.add(s);});const cr=new THREE.Mesh(new THREE.TorusGeometry(0.16*h,0.035*h,6,14,Math.PI*1.4),goldM);cr.position.y=h*0.92;cr.rotation.z=Math.PI*0.8;g.add(cr);return g;}
function chhatri(r,post,mat=marbM,dmat=domeM){const g=new THREE.Group();g.add(cy(r*1.1,r*1.15,0.25,mat,0,0.12,0,8));for(let i=0;i<8;i++){const a=i/8*Math.PI*2;g.add(cy(r*0.07,r*0.07,post,mat,Math.cos(a)*r*0.82,0.25+post/2,Math.sin(a)*r*0.82,6));}
 g.add(cy(r*1.15,r*1.0,0.2,mat,0,0.35+post,0,8));const d=new THREE.Mesh(onion(r*0.95,r*1.35,16),dmat);d.position.y=0.45+post;d.castShadow=true;g.add(d);const f=finial(r*0.7);f.position.y=0.45+post+r*1.3;g.add(f);return g;}
const plane=(w,h,mat,x,y,z,ry=0)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);m.position.set(x,y,z);m.rotation.y=ry;m.receiveShadow=true;return m;};
const facePl=(tex,w,h,a,d,y,dx=0,o={})=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),LM({map:tex,alphaTest:0.5,side:o.ds?THREE.DoubleSide:THREE.FrontSide,...(o.m||{})}));m.position.set(Math.sin(a)*d+Math.cos(a)*dx,y,Math.cos(a)*d-Math.sin(a)*dx);m.rotation.y=a;m.receiveShadow=true;return m;};
function holeGeo(rect,holes){const [x0,x1,z0,z1]=rect;const s=new THREE.Shape();s.moveTo(x0,-z0);s.lineTo(x1,-z0);s.lineTo(x1,-z1);s.lineTo(x0,-z1);s.closePath();holes.forEach(([a,b,c,d])=>{const p=new THREE.Path();p.moveTo(a,-c);p.lineTo(a,-d);p.lineTo(b,-d);p.lineTo(b,-c);p.closePath();s.holes.push(p);});const g=new THREE.ShapeGeometry(s);g.rotateX(-Math.PI/2);return g;}
export function miniTaj(s){const g=new THREE.Group();const m=LM({color:'#f2ede4'});g.add(bx(1.6*s,0.14*s,1.6*s,m,0,0.07*s,0));const b=cy(0.55*s,0.55*s,0.62*s,m,0,0.45*s,0,8);b.rotation.y=Math.PI/8;g.add(b);const d=new THREE.Mesh(onion(0.4*s,0.62*s,14),m);d.position.y=0.76*s;g.add(d);
 [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([x,z])=>{g.add(cy(0.05*s,0.06*s,0.85*s,m,x*0.7*s,0.5*s,z*0.7*s,6));const c=new THREE.Mesh(onion(0.07*s,0.1*s,8),m);c.position.set(x*0.7*s,0.92*s,z*0.7*s);g.add(c);if(Math.abs(x)===1){const cc=new THREE.Mesh(onion(0.13*s,0.18*s,10),m);cc.position.set(x*0.34*s,0.76*s,z*0.34*s);g.add(cc);}});g.traverse(o=>{if(o.isMesh)o.castShadow=false;});return g;}
export function busG(col){const g=new THREE.Group();g.add(bx(9,2.4,2.4,col,0,1.6,0),bx(8.6,0.9,2.42,'#2f3c44',-0.2,2.1,0),bx(9.05,0.3,2.45,'#3a2a30',0,0.55,0),bx(0.1,0.5,1.6,'#2f3c44',-4.52,2.1,0));[-3,3].forEach(x=>[-1.1,1.1].forEach(z=>{const w=cy(0.48,0.48,0.3,'#22252b',x,0.48,z,12);w.rotation.x=Math.PI/2;g.add(w);}));return g;}
// ---------- navigation ----------
export const Nav=()=>({wk:[],ob:[],oc:[]});
const R=(n,x0,x1,z0,z1,y=0,tag)=>n.wk.push({x0,x1,z0,z1,y,tag}),RP=(n,x0,x1,z0,z1,ax,ya,yb)=>n.wk.push({x0,x1,z0,z1,r:1,ax,ya,yb});
const OB=(n,x0,z0,x1,z1,y=0)=>n.ob.push([x0,z0,x1,z1,y]),OC=(n,x,z,r,y=0)=>n.oc.push([x,z,r,y]);
const sY=(s,x,z)=>s.r?s.ya+(s.yb-s.ya)*(s.ax==='x'?(x-s.x0)/(s.x1-s.x0):(z-s.z0)/(s.z1-s.z0)):s.y;
export function hAt(n,x,z,cur){let best=null,bd=1e9;for(const s of n.wk){if(x>=s.x0&&x<=s.x1&&z>=s.z0&&z<=s.z1){const y=sY(s,x,z),d=Math.abs(y-cur);if(d<bd){bd=d;best=y;}}}if(bd>0.9)return null;
 for(const o of n.ob)if(x>o[0]-0.25&&x<o[2]+0.25&&z>o[1]-0.25&&z<o[3]+0.25&&Math.abs(best-o[4])<1.2)return null;
 for(const o of n.oc)if(Math.hypot(x-o[0],z-o[1])<o[2]+0.25&&Math.abs(best-o[3])<1.2)return null;return best;}
// ================= EXTERIOR =================
export const DOORS={ticket:{x:15.4,z:73.5,y:0,ret:[14.7,73.5,-Math.PI/2],n:'Ticket & Security Office'},info:{x:-19.4,z:60,y:0,ret:[-18.7,60,Math.PI/2],n:'Visitor Information Centre'},shop:{x:-23.4,z:72,y:0,ret:[-22.7,72,Math.PI/2],n:'Gift Shop'},
 cafe:{x:25.4,z:58,y:0,ret:[24.7,58,-Math.PI/2],n:'Refreshment Kiosk'},guard:{x:5.3,z:82.6,y:0,ret:[4.7,82.8,-Math.PI/2],n:'Security Booth'},mosque:{x:-36.3,z:-54,y:1,ret:[-35.5,-54,Math.PI/2],n:'Mosque'},jawab:{x:36.3,z:-54,y:1,ret:[35.5,-54,-Math.PI/2],n:'Jawab'},tomb:{x:0,z:-43.2,y:3.5,ret:[0,-42.3,0],n:'Mausoleum'}};
export const PHOTOS=[{id:'ph_gate',loc:'out',x:0,z:59,y:0,t:'The Great Gate',m:'The red sandstone Great Gate, seen from the forecourt.'},{id:'ph_frame',loc:'out',x:2.2,z:39.6,y:0,t:'The first view',m:'The tomb framed at the far end of the garden, just inside the gate.'},
 {id:'ph_pool',loc:'out',x:3.4,z:14,y:0,t:'The reflecting pool',m:'The Taj Mahal reflected in the long pool.'},{id:'ph_tomb',loc:'out',x:-8,z:-39.6,y:3.5,t:'The mausoleum',m:'The white marble tomb, close enough to see the inlay.'},
 {id:'ph_mosque',loc:'out',x:-28,z:-47,y:1,t:'The mosque',m:'The red sandstone mosque with its three white domes.'},{id:'ph_jawab',loc:'out',x:28,z:-47,y:1,t:'The jawab',m:'The jawab, mirroring the mosque across the complex.'},
 {id:'ph_museum',loc:'info',x:0,z:-9.5,y:0,t:'Visitor Centre exhibits',m:'The marble, inlay and building exhibits in the Visitor Centre gallery.'}];
export const POOLS=[[-1.6,1.6,-28,-16],[-1.6,1.6,-14.5,-2],[-4,4,1,9],[-1.6,1.6,12,24],[-1.6,1.6,25.5,38],[-43,-26,3.4,6.6],[-24.5,-7,3.4,6.6],[7,24.5,3.4,6.6],[26,43,3.4,6.6]];
const HOLES=[[-1.6,1.6,-28,-2],[-4,4,1,9],[-1.6,1.6,12,38],[-43,-7,3.4,6.6],[7,43,3.4,6.6]];
export function buildOut(){const sc=new THREE.Scene();sc.background=new THREE.Color('#cfe0ea');sc.fog=new THREE.Fog('#e8e2d4',150,560);
 const sun=sunRig(sc,2.7);sun.position.set(70,115,95);sun.target.position.set(0,0,-8);sun.shadow.mapSize.set(2048,2048);sun.shadow.normalBias=0.05;Object.assign(sun.shadow.camera,{left:-100,right:100,top:100,bottom:-100,far:420});sun.shadow.camera.updateProjectionMatrix();
 const nav=Nav();const add=(...o)=>o.forEach(m=>sc.add(m));
 // ground: outer grass with the garden cut out, garden paving with pools cut out
 {const g=new THREE.Mesh(holeGeo([-700,700,-74,700],[[-46,46,-30,40.5]]),LM({map:rep(grassT,1/6,1/6)}));g.receiveShadow=true;add(g);
  const gg=new THREE.Mesh(holeGeo([-46,46,-30,40.5],HOLES),LM({map:rep(paveT('#d1a07c','rgba(120,70,50,.35)'),1/3,1/3)}));gg.position.y=0.005;gg.receiveShadow=true;add(gg);
  const fb=new THREE.Mesh(new THREE.PlaneGeometry(1800,800),LM({map:rep(grassT,90,40)}));fb.rotation.x=-Math.PI/2;fb.position.set(0,0,-560);add(fb);
  const rv=new THREE.Mesh(new THREE.PlaneGeometry(1800,90),new THREE.MeshStandardMaterial({color:'#7fb2bd',roughness:0.25,metalness:0.1}));rv.rotation.x=-Math.PI/2;rv.position.set(0,-1.2,-118);add(rv);
  add(bx(1800,1.3,4,'#8a7a5a',0,-0.6,-75.5),bx(1800,1.3,4,'#8a7a5a',0,-0.6,-161));}
 // water: transparent surfaces over a mirrored copy of the tomb (cheap, convincing reflection)
 const waterM=new THREE.MeshStandardMaterial({color:'#5aa7ba',transparent:true,opacity:0.55,roughness:0.12,metalness:0.1,map:rep(rippleT,0.25,0.25),depthWrite:false});
 HOLES.forEach(([a,b,c,d])=>{const w=new THREE.Mesh(new THREE.PlaneGeometry(b-a,d-c),waterM);w.rotation.x=-Math.PI/2;w.position.set((a+b)/2,-0.12,(c+d)/2);w.renderOrder=2;add(w);});
 {const RM=new Batch(new THREE.BoxGeometry(1,1,1),LM({color:'#efe8dc'}));HOLES.forEach(([a,b,c,d])=>{RM.add((a+b)/2,0.08,c-0.18,b-a+0.72,0.18,0.36);RM.add((a+b)/2,0.08,d+0.18,b-a+0.72,0.18,0.36);RM.add(a-0.18,0.08,(c+d)/2,0.36,0.18,d-c);RM.add(b+0.18,0.08,(c+d)/2,0.36,0.18,d-c);});
  [[-7,7,-2,1],[-7,7,9,12],[-7,-4,1,9],[4,7,1,9]].forEach(([a,b,c,d])=>RM.add((a+b)/2,0.07,(c+d)/2,b-a,0.14,d-c));[[0,-15.25,3.6,1.5],[0,24.75,3.6,1.5],[-25.25,5,1.5,3.6],[25.25,5,1.5,3.6]].forEach(([x,z,w,d])=>RM.add(x,0.1,z,w,0.2,d));RM.flush(sc);}
 const jets=[];{const jm=new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:0.45,depthWrite:false});[-25,-19,-8,-4,16,20,30,34].forEach(z=>{const j=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.09,1.3,6,1,true),jm);j.position.set(0,0.5,z);add(j);jets.push(j);});
  add(cy(0.5,0.7,0.5,'#efe8dc',0,0.1,5,12));const lj=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.14,1.8,6,1,true),jm);lj.position.set(0,1.2,5);add(lj);jets.push(lj);}
 // lawns, cypress rows, trees
 const LAWN=new Batch(new THREE.BoxGeometry(1,1,1),LM({color:'#ffffff',map:rep(grassT,2,2)}),false);const lawnR=[];
 [[-42.5,-7.5,-27.5,-0.8],[7.5,42.5,-27.5,-0.8],[-42.5,-7.5,10.8,37.5],[7.5,42.5,10.8,37.5]].forEach(([a,b,c,d])=>{const mx=(a+b)/2,mz=(c+d)/2;[[a,mx-1.3,c,mz-1.3],[mx+1.3,b,c,mz-1.3],[a,mx-1.3,mz+1.3,d],[mx+1.3,b,mz+1.3,d]].forEach(([p,q,r,s])=>{LAWN.add((p+q)/2,0.04,(r+s)/2,q-p,0.08,s-r);lawnR.push([p,q,r,s]);});});LAWN.flush(sc);
 const CYP=new Batch(new THREE.ConeGeometry(0.75,1,8),LM({color:C.cyp}));const cypM=[];
 [-6.2,6.2].forEach(x=>{for(let z=-26;z<=-2;z+=3){CYP.add(x,2.3,z,1,4.6,1);OC(nav,x,z,0.45);}for(let z=12.5;z<=37;z+=3){CYP.add(x,2.3,z,1,4.6,1);OC(nav,x,z,0.45);}});
 const cypIM=CYP.flush(sc);
 const TT=new Batch(new THREE.CylinderGeometry(0.22,0.35,1,6),L('#6b4a2e')),TL=new Batch(new THREE.IcosahedronGeometry(1,1),L('#ffffff'));
 const tree=(x,z,s,obs)=>{TT.add(x,1.4*s,z,s,2.8*s,s);TL.add(x,3.5*s,z,2.1*s,1.7*s,2.1*s,x*z,['#5f8a4e','#6e9a56','#4f7a45','#7aa35e'][Math.abs(Math.round(x*3+z))%4]);if(obs)OC(nav,x,z,0.45*s);};
 lawnR.forEach(([p,q,r,s],k)=>{tree(p+2.5,r+2.5,1.05,1);tree(q-2.5,s-2.5,0.95,1);if(k%2)tree((p+q)/2,(r+s)/2,1.1,1);});
 // ================= mausoleum (centre at 0,-54; platform top y=3.5) =================
 const T=new THREE.Group();T.position.set(0,1,-54);add(T);
 {const pT=facTex({W:512,H:96,bg:'#f1ebdf',line:'#cdbfa6',r0:'rgba(150,130,100,.18)',arches:[0,1,2,3,4,5].map(i=>[i/6+0.025,0.2,1/6-0.05,0.68,'blind'])});
  const side=LM({map:rep(pT,6,1)}),top=LM({map:rep(paveT('#f4efe6','rgba(150,130,110,.4)'),8,8)});const pl=new THREE.Mesh(new THREE.BoxGeometry(32,2.5,32),[side,side,top,top,side,side]);pl.position.y=1.25;pl.castShadow=pl.receiveShadow=true;T.add(pl);}
 const B=new THREE.Group();B.position.y=2.5;T.add(B);
 {const s=10,c=3.2,sh=new THREE.Shape();[[-s+c,-s],[s-c,-s],[s,-s+c],[s,s-c],[s-c,s],[-s+c,s],[-s,s-c],[-s,-s+c]].forEach(([x,y],i)=>i?sh.lineTo(x,y):sh.moveTo(x,y));
  const bg=new THREE.ExtrudeGeometry(sh,{depth:12,bevelEnabled:false});bg.rotateX(-Math.PI/2);const body=new THREE.Mesh(bg,marbM);body.castShadow=body.receiveShadow=true;B.add(body);
  const cg=new THREE.ExtrudeGeometry(sh,{depth:0.5,bevelEnabled:false});cg.rotateX(-Math.PI/2);const cor=new THREE.Mesh(cg,LM({color:'#e9e1d2'}));cor.scale.set(1.03,1,1.03);cor.position.y=12;B.add(cor);
  const pish=facTex({W:512,H:920,bg:'#f2ece0',line:'#cdbda2',r1:'#ddd3c1',r2:'#b8ab95',band:0.12,cal:1,inlay:1,arches:[[0.2,0.2,0.6,0.74,'win']]});
  const bay=facTex({W:256,H:512,bg:'#f2ece0',line:'#cdbda2',r1:'#ddd3c1',r2:'#bdb09a',inlay:1,arches:[[0.2,0.08,0.6,0.36,'win'],[0.2,0.56,0.6,0.38,'win']]});
  const PIN=new Batch(new THREE.CylinderGeometry(0.2,0.24,1,8),marbM),PIT=new Batch(new THREE.ConeGeometry(0.32,0.8,8),domeM);
  [0,Math.PI/2,Math.PI,-Math.PI/2].forEach(a=>{const pb=bx(8.4,15,0.8,marbM,Math.sin(a)*(s-0.3),7.5,Math.cos(a)*(s-0.3));pb.rotation.y=a;B.add(pb);B.add(facePl(pish,8.4,15,a,s+0.11,7.5));
   [-1,1].forEach(k=>{B.add(facePl(bay,2.6,12,a,s+0.01,6,k*5.5));const px=Math.sin(a)*(s+0.1)+Math.cos(a)*k*4.2,pz=Math.cos(a)*(s+0.1)-Math.sin(a)*k*4.2;PIN.add(px,15.8,pz,1,1.8,1);PIT.add(px,17.1,pz);});
   B.add(facePl(bay,4.5,12,a+Math.PI/4,(s-c/2)*Math.SQRT2+0.01,6));});
  [[-s+c,-s],[s-c,-s],[s,-s+c],[s,s-c],[s-c,s],[-s+c,s],[-s,s-c],[-s,-s+c]].forEach(([x,y])=>{PIN.add(x,13.3,-y,1,2.6,1);PIT.add(x,15,-y);});PIN.flush(B);PIT.flush(B);
  const drumT=facTex({W:1024,H:160,bg:'#f2ece0',line:'#cdbda2',r1:'#ddd3c1',r2:'#c4b8a2',arches:Array.from({length:12},(_,i)=>[i/12+0.02,0.18,1/12-0.04,0.7,'blind'])});
  const dr=new THREE.Mesh(new THREE.CylinderGeometry(6.2,6.2,3.6,32,1,true),LM({map:rep(drumT,2,1)}));dr.position.y=13.8;dr.castShadow=true;B.add(dr);B.add(cy(6.5,6.5,0.3,'#e9e1d2',0,15.6,0,32));
  const dm=new THREE.Mesh(onion(7.2,11,40),domeM);dm.position.y=15.6;dm.castShadow=true;B.add(dm);const lot=new THREE.Mesh(new THREE.ConeGeometry(0.9,0.6,12),domeM);lot.position.y=26.6;B.add(lot);const fn=finial(4);fn.position.y=26.7;B.add(fn);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([x,z])=>{const ch=chhatri(1.7,2.6);ch.position.set(x*6.7,12.4,z*6.7);B.add(ch);});}
 // minarets (lean very slightly outwards)
 {const shT=ct(64,256,(g,W,H)=>{g.fillStyle='#f2ece0';g.fillRect(0,0,W,H);speck(g,W,H,'150,130,110',150,0.08);g.strokeStyle='rgba(40,30,28,.45)';g.lineWidth=1.5;for(let x=8;x<W;x+=16){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();}});const shM=LM({map:rep(shT,6,2)});
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{const m=new THREE.Group();m.position.set(sx*14.5,2.5,sz*14.5);m.rotation.set(sz*0.015,0,-sx*0.015);T.add(m);
   m.add(cy(1.5,1.6,1,marbM,0,0.5,0,8));let y=1;[[1.08,0.98,6],[0.95,0.86,5],[0.84,0.76,4]].forEach(([a,b,hh])=>{const s=new THREE.Mesh(new THREE.CylinderGeometry(b,a,hh,16),shM);s.position.y=y+hh/2;s.castShadow=true;m.add(s);y+=hh;m.add(cy(b+0.5,b+0.25,0.35,marbM,0,y+0.17,0,16));y+=0.35;});
   const ch=chhatri(1.0,1.5);ch.position.y=y;m.add(ch);OC(nav,sx*14.5,-54+sz*14.5,1.7,3.5);});}
 // stairs to the platform
 {const ST=new Batch(new THREE.BoxGeometry(1,1,1),LM({color:'#ece4d6'}));for(let i=0;i<8;i++){const zt=-38+(i+0.5)*0.5,top=3.5-i*(2.5/8);ST.add(0,(top+1)/2,zt,6,top-1,0.52);}ST.flush(sc);add(bx(0.5,2.7,4.2,'#e4dccb',-3.25,2.25,-36),bx(0.5,2.7,4.2,'#e4dccb',3.25,2.25,-36));}
 // reflection copy
 const mirror=new THREE.Group();mirror.scale.y=-1;mirror.position.y=-0.24;{const tc=T.clone(true);tc.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});mirror.add(tc);if(cypIM){const c2=cypIM.clone();c2.castShadow=false;mirror.add(c2);}}add(mirror);
 // river terrace
 {const tm=LM({map:rep(paveT('#c88466','rgba(90,40,30,.35)'),20,8)});const te=new THREE.Mesh(new THREE.BoxGeometry(112,1,40),[sandM,sandM,tm,tm,sandM,sandM]);te.position.set(0,0.5,-52);te.receiveShadow=te.castShadow=true;add(te);
  const ST=new Batch(new THREE.BoxGeometry(1,1,1),LM({color:'#c27a5c'}));ST.add(0,0.75,-31.5,92,0.5,1);ST.add(0,0.25,-30.5,92,0.5,1);ST.flush(sc);
  add(bx(112,1.3,0.6,C.sandD,0,1.65,-72),bx(0.6,1.3,40,C.sandD,-56,1.65,-52),bx(0.6,1.3,40,C.sandD,56,1.65,-52));
  [[-56,-72],[56,-72]].forEach(([x,z])=>{add(cy(1.8,2,7,C.sand,x,4.5,z,8));const ch=chhatri(1.4,1.8,sandM);ch.position.set(x,8,z);add(ch);});}
 // mosque (west) & jawab (east)
 function flank(sx){const g=new THREE.Group();g.position.set(sx*42,1,-54);add(g);const fa=-sx*Math.PI/2;g.add(bx(12,0.4,22,C.sandL,0,0.2,0),bx(10,8,20,sandM,0,4.4,0),bx(10.6,0.6,20.6,'#c46a4c',0,8.7,0));
  const fr=facTex({W:1024,H:410,bg:'#b45a3f',line:C.line,r1:'#5a2e24',r2:'#2c1915',band:0.035,arches:[[0.06,0.3,0.1,0.62,'door'],[0.2,0.3,0.1,0.62,'door'],[0.7,0.3,0.1,0.62,'door'],[0.84,0.3,0.1,0.62,'door']]});
  const pi=facTex({W:420,H:600,bg:'#b45a3f',line:C.line,r1:'#5a2e24',r2:'#2c1915',band:0.1,cal:1,arches:[[0.2,0.25,0.6,0.7,'door']]});
  const bl=facTex({W:1024,H:410,bg:'#b45a3f',line:C.line,r0:'rgba(60,20,15,.25)',arches:Array.from({length:6},(_,i)=>[i/6+0.04,0.3,1/6-0.08,0.6,'blind'])});
  g.add(facePl(fr,20,8,fa,5.02,4.4));const pb=bx(0.6,10.2,7,sandM,-sx*5.15,5.5,0);g.add(pb);g.add(facePl(pi,7,10.2,fa,5.46,5.5));
  g.add(facePl(bl,20,8,fa+Math.PI,5.02,4.4),facePl(bl,10,8,0,10.02,4.4),facePl(bl,10,8,Math.PI,10.02,4.4));
  [[-6.5,2.5],[0,3.1],[6.5,2.5]].forEach(([z,r])=>{g.add(cy(r*0.9,r*0.9,1.2,marbM,0,9.6,z,20));const d=new THREE.Mesh(onion(r,r*1.45,24),domeM);d.position.set(0,10.2,z);d.castShadow=true;g.add(d);const f=finial(r*0.7);f.position.set(0,10.2+r*1.42,z);g.add(f);});
  [[-5,-10],[5,-10],[-5,10],[5,10]].forEach(([x,z])=>{g.add(cy(0.8,0.9,11.4,sandM,x,6.1,z,8));const ch=chhatri(0.8,1.2,sandM);ch.position.set(x,11.8,z);g.add(ch);});
  OB(nav,sx*42-6,-65,sx*42+6,-43,1);if(sx<0)OB(nav,-48,-65,-36.8,-43,1);else OB(nav,36.8,-65,48,-43,1);}
 flank(-1);flank(1);
 // ================= Great Gate (z 41..51) =================
 const gate=new THREE.Group();add(gate);
 {const H=14;[[-8.4,5.2,46,10],[-4.2,3.2,42.6,3.2],[-4.2,3.2,49.4,3.2],[8.4,5.2,46,10],[4.2,3.2,42.6,3.2],[4.2,3.2,49.4,3.2]].forEach(([x,w,z,d])=>gate.add(bx(w,H,d,sandM,x,H/2,z)));
  gate.add(bx(5.2,H-6.2,10,sandM,0,6.2+(H-6.2)/2,46),bx(11.6,H-7.5,3.6,sandM,0,7.5+(H-7.5)/2,46),bx(22.6,0.6,10.6,'#c46a4c',0,H+0.3,46));
  const gf=facTex({W:1024,H:652,bg:'#b45a3f',line:C.line,r1:'#5a2e24',r2:'#2c1915',band:0.045,cal:1,arches:[[0.382,0.557,0.236,0.443,'cut'],[0.07,0.16,0.1,0.3,'door'],[0.07,0.58,0.1,0.34,'door'],[0.83,0.16,0.1,0.3,'door'],[0.83,0.58,0.1,0.34,'door'],[0.22,0.2,0.08,0.26,'blind'],[0.7,0.2,0.08,0.26,'blind']]});
  {const c=gf.userData.canvas,g=c.getContext('2d'),W=c.width,Hh=c.height;cal(g,W*0.33,Hh*0.47,W*0.34,Hh*0.04);cal(g,W*0.33,Hh*0.47,W*0.025,Hh*0.53);cal(g,W*0.645,Hh*0.47,W*0.025,Hh*0.53);gf.needsUpdate=true;}
  gate.add(facePl(gf,22,14,0,51.03,7),facePl(gf,22,14,Math.PI,-40.97,7));const gs=facTex({W:512,H:640,bg:'#b45a3f',line:C.line,r1:'#5a2e24',r2:'#2c1915',arches:[[0.25,0.15,0.5,0.32,'blind'],[0.25,0.58,0.5,0.34,'blind']]});gate.add(facePl(gs,10,14,Math.PI/2,11.02,7,-46),facePl(gs,10,14,-Math.PI/2,11.02,7,46));
  const vt=new THREE.CylinderGeometry(2.6,2.6,3.2,16,1,true,Math.PI/2,Math.PI);vt.rotateX(Math.PI/2);const vm=LM({color:'#c27a5c',side:THREE.BackSide});[42.6,49.4].forEach(z=>{const v=new THREE.Mesh(vt,vm);v.position.set(0,3.6,z);gate.add(v);});
  const cl=new THREE.Mesh(new THREE.PlaneGeometry(11.6,3.6),LM({color:'#c98a6a'}));cl.rotation.x=Math.PI/2;cl.position.set(0,7.49,46);gate.add(cl);
  const fp=new THREE.Mesh(new THREE.PlaneGeometry(11.6,10),LM({map:rep(paveT('#cf9a78','rgba(90,40,30,.35)'),3,3)}));fp.rotation.x=-Math.PI/2;fp.position.set(0,0.02,46);gate.add(fp);
  gate.add(cy(0.02,0.02,1.4,'#5a4a2a',0,6.8,46,4),cy(0.28,0.16,0.5,goldM,0,5.9,46,8));const gl=new THREE.PointLight('#ffd9a0',6,12,1.4);gl.position.set(0,5.5,46);gate.add(gl);
  const CP=new Batch(new THREE.CylinderGeometry(0.06,0.06,1,6),sandM),CD=new Batch(onion(0.55,0.75,12),domeM),CB=new Batch(new THREE.CylinderGeometry(0.62,0.62,0.18,8),sandM);
  for(let i=0;i<11;i++){const x=-9+i*1.8;[50.3,41.7].forEach(z=>{[[-0.4,-0.4],[0.4,-0.4],[-0.4,0.4],[0.4,0.4]].forEach(([a,b])=>CP.add(x+a,H+1.2,z+b,1,1.2,1));CB.add(x,H+1.85,z);CD.add(x,H+1.9,z);});}CP.flush(gate);CD.flush(gate);CB.flush(gate);
  [[-11,41],[11,41],[-11,51],[11,51]].forEach(([x,z])=>{gate.add(cy(1.2,1.35,16.5,sandM,x,8.25,z,8));const ch=chhatri(1.2,1.6);ch.position.set(x,16.5,z);gate.add(ch);});}
 // walls (garden, forecourt) with arcade texture
 {const arc=facTex({W:512,H:128,bg:'#b45a3f',line:C.line,r0:'rgba(60,20,15,.3)',arches:[0,1,2,3].map(i=>[i/4+0.04,0.25,0.17,0.65,'blind'])});const WM=n=>LM({map:rep(arc,n,1)});
  const wall=(x,z,w,d,h=3.2)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),WM(Math.max(1,Math.round(Math.max(w,d)/6))));m.position.set(x,h/2,z);m.castShadow=m.receiveShadow=true;add(m);};
  wall(-46.8,5.6,0.8,71.2);wall(46.8,5.6,0.8,71.2);wall(-28.9,41,35,0.8);wall(28.9,41,35,0.8);wall(-40.4,64.8,0.8,27);wall(40.4,64.8,0.8,27);wall(-22,78.4,36,0.8,2.6);wall(22,78.4,36,0.8,2.6);wall(-25.5,51.4,29,0.8,2.6);wall(25.5,51.4,29,0.8,2.6);
  [[-46.8,41],[46.8,41],[-46.8,-30],[46.8,-30],[-40.4,78.4],[40.4,78.4]].forEach(([x,z])=>{add(cy(1.3,1.5,6,sandM,x,3,z,8));const ch=chhatri(1.1,1.3,sandM);ch.position.set(x,6,z);add(ch);});
  const fc=new THREE.Mesh(new THREE.PlaneGeometry(80,26.5),LM({map:rep(paveT('#e3cfae','rgba(120,90,60,.3)'),12,4)}));fc.rotation.x=-Math.PI/2;fc.position.set(0,0.02,64.75);fc.receiveShadow=true;add(fc);
  const op=new THREE.Mesh(new THREE.PlaneGeometry(8,4),fc.material);op.rotation.x=-Math.PI/2;op.position.set(0,0.02,80);add(op);}
 // forecourt buildings
 function hall(x0,x1,z0,z1,h,face,txt,n){const cx=(x0+x1)/2,cz=(z0+z1)/2,w=x1-x0,d=z1-z0;add(bx(w,h,d,sandM,cx,h/2,cz),bx(w+0.5,0.4,d+0.5,'#c46a4c',cx,h+0.2,cz),bx(w-1,0.08,d-1,'#e8dcc0',cx,h+0.42,cz));
  const fw=face==='e'||face==='w'?d:w,arr=[];for(let i=0;i<n;i++)arr.push([(i+0.22)/n,0.28,0.56/n,0.62,i===(n>>1)?'door':'win']);
  const tx=facTex({W:512,H:Math.round(512*h/fw),bg:'#b45a3f',line:C.line,r1:'#6a8a9a',r2:'#3f5560',band:0.02,arches:arr});const a={n:Math.PI,s:0,e:Math.PI/2,w:-Math.PI/2}[face];
  const m=new THREE.Mesh(new THREE.PlaneGeometry(fw,h),LM({map:tx}));const off=face==='e'||face==='w'?w/2:d/2;m.position.set(cx+Math.sin(a)*(off+0.02),h/2,cz+Math.cos(a)*(off+0.02));m.rotation.y=a;add(m);
  const sg=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(fw-1,7),0.85),LM({map:signTex(txt,'#f5ead3','#3a2a30',1024,128,'bold 50px "Atkinson Hyperlegible",sans-serif')}));sg.position.set(cx+Math.sin(a)*(off+0.06),h-0.6,cz+Math.cos(a)*(off+0.06));sg.rotation.y=a;add(sg);
  const ch=chhatri(0.9,1.2,sandM);ch.position.set(x1-0.8,h+0.4,z0+0.8);add(ch);OB(nav,x0,z0,x1,z1);}
 hall(-34,-20,55,65,4.4,'e','VISITOR INFORMATION CENTRE',5);hall(-34,-24,68,76,4,'e','GIFT SHOP \u00b7 SOUVENIRS',3);hall(16,28,70,77,4.2,'w','TICKETS & SECURITY',3);hall(26,34,54,62,3.8,'w','REFRESHMENTS',3);
 {const tent=new THREE.ConeGeometry(1,1,4);tent.rotateY(Math.PI/4);const TN=new Batch(tent,LM({color:'#f2ecdc'})),PO=new Batch(new THREE.CylinderGeometry(0.06,0.06,1,6),L('#8d9096'));
  [[18,56],[18,61.5],[-15,59],[-16,72.5]].forEach(([x,z])=>{TN.add(x,3.4,z,3.8,1.3,3.8);[[-2.4,-2.4],[2.4,-2.4],[-2.4,2.4],[2.4,2.4]].forEach(([a,b])=>PO.add(x+a*0.9,1.4,z+b*0.9,1,2.8,1));});TN.flush(sc);PO.flush(sc);
  const TB=new Batch(new THREE.CylinderGeometry(0.6,0.6,0.06,12),L('#f2efe6')),BN=new Batch(new THREE.BoxGeometry(1.6,0.1,0.45),L('#8a6243'));[[17,55],[19.5,57.5],[17,61],[19.5,63.2]].forEach(([x,z])=>{TB.add(x,0.75,z);TB.add(x,0.37,z,0.12,6,0.12);OC(nav,x,z,0.7);});[[-15,58],[-15,60.4],[-16,72.5]].forEach(([x,z])=>{BN.add(x,0.45,z);OB(nav,x-0.8,z-0.25,x+0.8,z+0.25);});TB.flush(sc);BN.flush(sc);
  [[22,66,'#e3a347'],[-12,66.5,'#55745c'],[12,74,'#c0563f']].forEach(([x,z,c])=>{const u=new THREE.Mesh(new THREE.ConeGeometry(1.5,0.6,8),L(c));u.position.set(x,2.5,z);u.castShadow=true;add(u,cy(0.05,0.05,2.4,'#3a2a30',x,1.2,z,5),cy(0.6,0.6,0.06,'#f2efe6',x,0.75,z,12));OC(nav,x,z,0.7);});}
 add(bx(3.5,2.6,3.5,'#efe6d6',7.75,1.3,82.25));{const r=new THREE.Mesh(new THREE.ConeGeometry(2.8,1.4,4),L('#a8553f'));r.rotation.y=Math.PI/4;r.position.set(7.75,3.3,82.25);r.castShadow=true;add(r);add(bx(0.05,1.8,0.9,'#3f5560',5.98,1.1,82.6),bx(0.05,0.8,1.2,'#8fb0b4',5.98,1.7,81.4));OB(nav,6,80.5,9.5,84);}
 add(bx(1.6,1.3,0.12,'#3a2a30',-3,1.4,66.2));{const m=new THREE.Mesh(new THREE.PlaneGeometry(1.5,1.2),LM({map:ct(256,200,(g,W,H)=>{const c=planCanvas();g.drawImage(c,0,0,W,H);})}));m.position.set(-3,1.4,66.27);add(m,cy(0.05,0.05,1,'#3a2a30',-3,0.4,66.2,5));}
 {const ms=new THREE.Mesh(new THREE.PlaneGeometry(2.2,0.42),LM({map:signTex('MEETING POINT','#2f6f6a','#fff',512,96,'bold 46px "Atkinson Hyperlegible",sans-serif')}));ms.position.set(0,2.4,67.1);add(ms,cy(0.06,0.06,2.4,'#3a2a30',0,1.2,67,6));}
 // parking
 {const pk=new THREE.Mesh(new THREE.PlaneGeometry(92,30),LM({color:'#b5654a'}));pk.rotation.x=-Math.PI/2;pk.position.set(16,0.02,97);pk.receiveShadow=true;add(pk);const PL=new Batch(new THREE.BoxGeometry(1,0.02,1),L('#f2efe6'),false);for(let x=-26;x<=58;x+=4)PL.add(x,0.05,103,0.12,1,5);PL.flush(sc);
  [[-20,106.5],[-8,106.5],[4,106.5]].forEach(([x,z])=>{const b=busG('#e8b33c');b.position.set(x,0,z);add(b);});[[44,106.5],[52,106.5]].forEach(([x,z])=>{const b=busG('#f2efe6');b.scale.set(0.6,0.85,0.85);b.position.set(x,0,z);add(b);});
  const CR=new Batch(new THREE.BoxGeometry(4,1.3,1.9),L('#ffffff'));[[-24,88.5],[-18,88.5],[48,88.5],[54,88.5]].forEach(([x,z],k)=>CR.add(x,0.75,z,1,1,1,0,['#c0563f','#4f6e8a','#f2efe6','#55745c'][k]));CR.flush(sc);
  [[-20,106.5],[-8,106.5],[4,106.5],[44,106.5],[52,106.5]].forEach(([x,z])=>OB(nav,x-4.6,z-1.3,x+4.6,z+1.3));[[-24,88.5],[-18,88.5],[48,88.5],[54,88.5]].forEach(([x,z])=>OB(nav,x-2,z-1,x+2,z+1));}
 const coach=busG('#e8b33c');add(coach);coach.position.set(95,0,96);
 // photo posts & signs
 {const pm=ct(128,128,(g,W,H)=>{g.fillStyle='#2f6f6a';g.fillRect(0,0,W,H);g.fillStyle='#fff';g.fillRect(24,44,80,52);g.fillRect(44,34,30,12);g.fillStyle='#2f6f6a';g.beginPath();g.arc(64,70,17,0,7);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(64,70,10,0,7);g.fill();});
  PHOTOS.filter(p=>p.loc==='out').forEach(p=>{const ox=p.x+1.1,oz=p.z;add(cy(0.05,0.05,1.6,'#3a2a30',ox,p.y+0.8,oz,5));const s=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,0.08),[L('#2f6f6a'),L('#2f6f6a'),L('#2f6f6a'),L('#2f6f6a'),LM({map:pm}),LM({map:pm})]);s.position.set(ox,p.y+1.75,oz);add(s);});
  const sb=(x,z,y,ry,title)=>{const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;g.add(bx(1.5,1.0,0.1,'#6b4a2e',0,1.3,0),cy(0.05,0.05,1.3,'#3a2a30',-0.55,0.6,0,5),cy(0.05,0.05,1.3,'#3a2a30',0.55,0.6,0,5));const t=new THREE.Mesh(new THREE.PlaneGeometry(1.4,0.9),LM({map:panelTex(title,'Tap to read more.')}));t.position.set(0,1.3,0.06);g.add(t);add(g);};
  sb(8.6,13,0,-Math.PI/2,'The charbagh');sb(11.8,-41.6,3.5,0,'The minarets');sb(-1.8,-68.6,3.5,Math.PI,'The Yamuna River');sb(-25,-40,1,0,'Mosque and jawab');sb(4.8,-36.2,1,0,'Shoe covers');
  add(bx(1.4,0.8,0.7,'#8a6243',4.8,1.4,-33.2),bx(1.2,0.25,0.5,'#5f8aa6',4.8,1.92,-33.2));}
 // benches along the main walkways
 const BENCH=[];{const BN=new Batch(new THREE.BoxGeometry(1,1,1),L('#8a6243'));[[4.6,-20],[4.6,-8],[4.6,20],[4.6,31],[-4.6,-20],[-4.6,-8],[-4.6,20],[-4.6,31]].forEach(([x,z])=>{const ry=x>0?-Math.PI/2:Math.PI/2;BN.add(x,0.42,z,0.5,0.08,1.6);BN.add(x+(x>0?0.24:-0.24),0.7,z,0.08,0.5,1.6);BN.add(x,0.2,z-0.6,0.4,0.4,0.08);BN.add(x,0.2,z+0.6,0.4,0.4,0.08);OB(nav,x-0.3,z-0.8,x+0.3,z+0.8);BENCH.push({x:x+(x>0?-0.55:0.55),z,sx:x,ry});});BN.flush(sc);}
 // surroundings: trees and city, Agra Fort upstream, Mehtab Bagh across the river
 for(let k=0;k<140;k++){const a=rnd()*Math.PI*2,r=60+rnd()*70;const x=Math.cos(a)*r,z=Math.sin(a)*r*1.1+10;if(x>-62&&x<62&&z>-80&&z<114)continue;tree(x,z,1+rnd()*0.6);}
 for(let x=-58;x<=58;x+=6){tree(x,116+rnd()*3,1.1);}for(let z=-28;z<=110;z+=6){tree(-64-rnd()*3,z,1.1);tree(66+rnd()*3,z,1.1);}
 {const HS=new Batch(new THREE.BoxGeometry(1,1,1),L('#ffffff'));for(let k=0;k<600;k++){const a=rnd()*Math.PI*2,r=150+Math.pow(rnd(),0.7)*260;const x=Math.cos(a)*r,z=Math.sin(a)*r;if(z<-80&&z>-170)continue;const w=5+rnd()*6,d=5+rnd()*6,hh=3+rnd()*7;HS.add(x,hh/2,z,w,hh,d,Math.round(rnd()*3)*Math.PI/2,['#efe2c6','#e3c79a','#f2efe6','#d9b58a','#cfc2a8'][k%5]);}HS.flush(sc);
  const F=new THREE.Group();F.position.set(-250,0,-215);add(F);F.add(bx(90,12,40,C.sandD,0,6,0),bx(30,18,20,C.sand,-10,9,-6));for(let i=0;i<6;i++)F.add(cy(3,3.4,16,C.sand,-45+i*18,8,20,10));[[-10,-6],[8,-6]].forEach(([x,z])=>{const d=new THREE.Mesh(onion(4,6,16),domeM);d.position.set(x,18,z);F.add(d);});
  const MB=new Batch(new THREE.IcosahedronGeometry(1,1),L('#5f8a4e'));for(let k=0;k<50;k++)MB.add(-40+rnd()*80,3,-175-rnd()*40,3,2.6,3);MB.flush(sc);add(bx(70,1.2,0.8,C.sandD,0,0.6,-172));}
 TT.flush(sc);TL.flush(sc);
 // nav: walkable areas
 R(nav,-30,62,82,112);R(nav,-4,4,77.8,82.2);R(nav,-40,40,51.8,78);R(nav,-2.6,2.6,40.4,51.9);R(nav,-5.6,5.6,44.3,47.7);R(nav,-46.2,46.2,-30,40.6);RP(nav,-46,46,-32,-30,'z',1,0);R(nav,-55.6,55.6,-71.6,-32,1);RP(nav,-3,3,-38,-34,'z',3.5,1);R(nav,-16,16,-70,-38,3.5);
 OB(nav,-16,-70,16,-38,1);OB(nav,-10.3,-64.3,10.3,-43.75,3.5);POOLS.forEach(([a,b,c,d])=>OB(nav,a,c,b,d));OB(nav,-0.7,4.3,0.7,5.7);OB(nav,4,-34,5.6,-32.6,1);
 // visitors walking the perimeter path, plus a few standing on the terrace
 const VIS=[];{const SK=['#5c3520','#7a4a2e','#c98f6c','#e0b48e','#8a5a3a','#f0c8a8'],SH=['#e3a347','#4f6e8a','#c0563f','#f2efe6','#55745c','#9b86c4','#d9822b','#2f6f6a','#c97a8a','#6b4a7a'];
  for(let i=0;i<12;i++){const o=makePerson({skin:SK[i%6],shirt:SH[i%10],bottom:['#22252b','#3f5a7a','#8a6a4a','#f2efe6'][i%4],trousers:i%3?1:0,skirt:i%3?0:1,hair:['short','bun','wrap','short','braids'][i%5],adult:1,casual:1});add(o);VIS.push({o,s:i*21.7,v:(0.9+rnd()*0.4)*(i%2?1:-1),stand:i>=9});}
  [[-6,-41,3.5,0],[9,-45,3.5,-0.8],[-30,-36,1,2.6]].forEach(([x,z,y,ry],k)=>{const v=VIS[9+k];v.o.position.set(x,y,z);v.o.rotation.y=ry;});}
 const per=[[-44,-29],[44,-29],[44,39],[-44,39]],perL=2*88+2*68;
 function perPos(s){s=((s%perL)+perL)%perL;const seg=[88,68,88,68];let i=0;while(s>seg[i]){s-=seg[i];i++;}const a=per[i],b=per[(i+1)%4],t=s/seg[i];return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,Math.atan2(b[0]-a[0],b[1]-a[1])];}
 // staff outside
 const staff=(look,x,y,z,ry)=>{const o=makePerson({adult:1,casual:1,...look});o.position.set(x,y,z);o.rotation.y=ry;add(o);return o;};
 const STAFF=[staff({skin:'#8a5a3a',shirt:'#8a7a52',bottom:'#3a3a32',hair:'short'},3.6,0,52.6,0),staff({skin:'#7a4a2e',shirt:'#2f5a7a',bottom:'#22252b',hair:'bun',skirt:1},6.1,1,-33.2,-Math.PI/2)];
 OC(nav,3.6,52.6,0.35);OC(nav,6.1,-33.2,0.35,1);
 function anim(t,dt){waterM.map.offset.set(t*0.01,t*0.006);jets.forEach((j,i)=>{j.scale.y=0.85+Math.sin(t*3+i)*0.15;});
  VIS.forEach(v=>{if(v.stand){poseUpdate(v.o,dt,false,'wave');return;}v.s+=v.v*dt;const [x,z,ry]=perPos(v.s);v.o.position.set(x,0,z);v.o.rotation.y=v.v>0?ry:ry+Math.PI;poseUpdate(v.o,dt,true,null,0.8);});STAFF.forEach(o=>poseUpdate(o,dt,false));}
 return{sc,nav,coach,anim,BENCH};}
import {poseUpdate} from '../common.js';
// ================= INTERIORS =================
function mkInt(id,name,sub,bg='#2a201c'){const sc=new THREE.Scene();sc.background=new THREE.Color(bg);sc.add(new THREE.HemisphereLight('#fff3e0','#5a4840',1.1));return{id,sc,nav:Nav(),name,sub,pts:[],npcs:[],cam:[],spawn:[0,0,Math.PI],exit:null};}
const fl=(I,x0,x1,z0,z1,tex,rx,rz,y=0)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,z1-z0),LM({map:rep(tex,rx,rz)}));m.rotation.x=-Math.PI/2;m.position.set((x0+x1)/2,y,(z0+z1)/2);m.receiveShadow=true;I.sc.add(m);};
const ce=(I,x0,x1,z0,z1,y,c)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,z1-z0),LM({color:c}));m.rotation.x=Math.PI/2;m.position.set((x0+x1)/2,y,(z0+z1)/2);I.sc.add(m);};
function wX(I,z,x0,x1,h,c,gaps=[]){let a=x0;const mat=c.isMaterial?c:LM({color:c});const seg=(p,q,y0,y1)=>{if(q-p<0.01)return;const m=new THREE.Mesh(new THREE.BoxGeometry(q-p,y1-y0,0.3),mat);m.position.set((p+q)/2,(y0+y1)/2,z);I.sc.add(m);};gaps.forEach(([p,q,top])=>{seg(a,p,0,h);seg(p,q,top,h);a=q;});seg(a,x1,0,h);}
function wZ(I,x,z0,z1,h,c,gaps=[]){let a=z0;const mat=c.isMaterial?c:LM({color:c});const seg=(p,q,y0,y1)=>{if(q-p<0.01)return;const m=new THREE.Mesh(new THREE.BoxGeometry(0.3,y1-y0,q-p),mat);m.position.set(x,(y0+y1)/2,(p+q)/2);I.sc.add(m);};gaps.forEach(([p,q,top])=>{seg(a,p,0,h);seg(p,q,top,h);a=q;});seg(a,z1,0,h);}
const lit=(I,x,y,z,i=8,d=16,c='#ffe2b0')=>{const l=new THREE.PointLight(c,i,d,1.3);l.position.set(x,y,z);I.sc.add(l);};
const outT=ct(128,256,(g,W,H)=>{const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#d9ecf2');gr.addColorStop(0.55,'#f4ead0');gr.addColorStop(0.56,'#8fb06a');gr.addColorStop(1,'#c9a27a');g.fillStyle=gr;g.fillRect(0,0,W,H);});
function exitAt(I,x,z,ry,w=1.8,h=2.6){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:outT}));m.position.set(x,h/2,z);m.rotation.y=ry;I.sc.add(m);const s=new THREE.Mesh(new THREE.PlaneGeometry(0.9,0.3),new THREE.MeshBasicMaterial({map:signTex('EXIT','#2f7a5a','#ffffff',256,86,'bold 50px sans-serif')}));s.position.set(x+Math.sin(ry)*0.02,h+0.3,z+Math.cos(ry)*0.02);s.rotation.y=ry;I.sc.add(s);}
function pan(I,key,x,y,z,ry,w=1.6,h=1.12){const P=TAJ.panels[key];const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),LM({map:panelTex(P[0],P[1])}));m.position.set(x,y,z);m.rotation.y=ry;I.sc.add(m);I.pts.push({x:x+Math.sin(ry)*1.2,z:z+Math.cos(ry)*1.2,r:1.3,t:'Read: '+P[0],panel:key});}
function npc(I,look,x,z,ry,pose,say){const o=makePerson({adult:1,casual:1,...look});o.position.set(x,0,z);o.rotation.y=ry;I.sc.add(o);I.npcs.push({o,pose});OC(I.nav,x,z,0.35);return o;}
const Rr=(I,x0,x1,z0,z1,h)=>{R(I.nav,x0,x1,z0,z1);I.cam.push([x0-0.1,x1+0.1,z0-0.1,z1+0.1,h]);};
const glassM=new THREE.MeshStandardMaterial({color:'#bfe3ea',transparent:true,opacity:0.28,roughness:0.05,depthWrite:false});
function tTicket(){const I=mkInt('ticket','Ticket & Security Office','Collect the class tickets at the counter.');const W='#efe2c6';
 fl(I,-6,6,-4,4,tileT('#e9dcc3','#d8c7a8',8),3,2);ce(I,-6,6,-4,4,4.2,'#f6efe2');wX(I,-4,-6,6,4.2,W);wX(I,4,-6,6,4.2,W,[[-0.9,0.9,2.6]]);wZ(I,-6,-4,4,4.2,W);wZ(I,6,-4,4,4.2,W);
 [[0,-3.82,12,0.04],[0,3.82,12,0.04]].forEach(([x,z,w,d])=>I.sc.add(bx(w,1,d+0.06,C.sand,x,0.5,z)));I.sc.add(bx(0.1,1,8,C.sand,-5.82,0.5,0),bx(0.1,1,8,C.sand,5.82,0.5,0));
 I.sc.add(bx(10,1.1,0.9,'#8a5a3a',0,0.55,-2.6),bx(10.2,0.08,1.1,'#5f3b26',0,1.14,-2.6));const gp=new THREE.Mesh(new THREE.PlaneGeometry(10,1.3),glassM);gp.position.set(0,1.85,-2.3);I.sc.add(gp);
 [-5,-1.67,1.67,5].forEach(x=>I.sc.add(bx(0.1,1.4,0.1,'#5f3b26',x,1.85,-2.3)));I.sc.add(bx(10,0.12,0.14,'#5f3b26',0,2.55,-2.3));
 ['TICKETS','SCHOOL GROUPS','SHOE COVERS'].forEach((t,i)=>{const s=new THREE.Mesh(new THREE.PlaneGeometry(2.8,0.42),LM({map:signTex(t,'#2f5a7a','#ffffff',512,80,'bold 40px "Atkinson Hyperlegible",sans-serif')}));s.position.set(-3.33+i*3.33,2.95,-2.28);I.sc.add(s);});
 const PO=new Batch(new THREE.CylinderGeometry(0.05,0.07,1,8),L('#c9a24a'));const RO=new Batch(new THREE.BoxGeometry(1,1,1),L('#a8323a'));[-1.6,1.6].forEach(x=>{[-1.2,0,1.2,2.4].forEach(z=>{PO.add(x,0.5,z);OC(I.nav,x,z,0.1);});RO.add(x,0.9,0.6,0.04,0.06,3.6);});PO.flush(I.sc);RO.flush(I.sc);
 I.sc.add(bx(0.6,0.45,2.6,'#8a6243',-5.35,0.23,1.6));OB(I.nav,-5.7,0.3,-5,2.9);
 npc(I,{skin:'#8a5a3a',shirt:'#2f5a7a',bottom:'#22252b',hair:'short'},-3.33,-3.4,0);npc(I,{skin:'#7a4a2e',shirt:'#2f5a7a',bottom:'#22252b',hair:'bun',skirt:1},0,-3.4,0);
 pan(I,'ticket',5.83,2,0.6,-Math.PI/2);lit(I,0,3.8,0,10,14);lit(I,0,3.2,-3,4,8);
 Rr(I,-5.6,5.6,-2.0,3.7,4);exitAt(I,0,3.84,Math.PI);I.spawn=[0,1.9,Math.PI];I.exit={x:0,z:3.75,r:0.9};
 I.pts.push({x:-1.67,z:-1.5,r:1.8,t:S=>S.done.tickets?'Ask the clerk about entry':'Collect the class tickets',act:'tickets'});return I;}
function tInfo(){const I=mkInt('info','Visitor Information Centre','Maps, history boards and a small gallery.');const W='#f2eadb';
 fl(I,-8,8,-15,5,tileT('#ebe3d3','#ddd0b8',4),4,5);ce(I,-8,8,-15,5,4.5,'#f8f2e6');wX(I,5,-8,8,4.5,W,[[-0.9,0.9,2.6]]);wX(I,-15,-8,8,4.5,W);wZ(I,-8,-15,5,4.5,W);wZ(I,8,-15,5,4.5,W);wX(I,-5,-8,8,4.5,'#e4d6bc',[[-1.6,1.6,3.2]]);
 I.sc.add(bx(16,0.9,0.06,'#8a6243',0,0.45,4.82),bx(0.06,0.9,20,'#8a6243',-7.82,0.45,-5),bx(0.06,0.9,20,'#8a6243',7.82,0.45,-5));
 I.sc.add(bx(3.6,1.1,1,'#7a5236',-5,0.55,-3),bx(3.8,0.08,1.2,'#5f3b26',-5,1.14,-3));const s=new THREE.Mesh(new THREE.PlaneGeometry(3.4,0.5),LM({map:signTex('INFORMATION','#2f6f6a','#ffffff',512,80,'bold 44px "Atkinson Hyperlegible",sans-serif')}));s.position.set(-5,3,-4.83);I.sc.add(s);
 npc(I,{skin:'#8a5a3a',shirt:'#2f6f6a',bottom:'#22252b',hair:'wrap',skirt:1,glasses:1},-5,-4.1,0);OB(I.nav,-6.8,-3.5,-3.2,-2.5);
 I.sc.add(bx(4.4,0.85,3.2,'#6b4a33',3,0.42,0));{const pc=planCanvas();const tx=new THREE.CanvasTexture(pc);tx.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(2.0,3.1),LM({map:tx}));m.rotation.x=-Math.PI/2;m.position.set(3,0.86,0);I.sc.add(m);const mt=miniTaj(0.45);mt.position.set(3,0.86,-1.12);I.sc.add(mt);}OB(I.nav,0.8,-1.6,5.2,1.6);
 const BN=new Batch(new THREE.BoxGeometry(1,1,1),L('#8a6243'));[[-4,3.3],[4.5,3.6]].forEach(([x,z])=>{BN.add(x,0.42,z,2.4,0.1,0.6);BN.add(x,0.2,z,2.2,0.4,0.1);OB(I.nav,x-1.2,z-0.3,x+1.2,z+0.3);});BN.flush(I.sc);
 pan(I,'hist',-7.83,2.2,1.2,Math.PI/2);pan(I,'etiq',7.83,2.2,-2.2,-Math.PI/2);pan(I,'cons',7.83,2.2,1.8,-Math.PI/2);
 {const img=new THREE.TextureLoader().load('assets/taj-ref.jpg');img.colorSpace=THREE.SRGBColorSpace;I.sc.add(bx(5.4,3.2,0.1,'#5f3b26',0,2.4,-14.8));const m=new THREE.Mesh(new THREE.PlaneGeometry(5,2.8),LM({map:img}));m.position.set(0,2.4,-14.74);I.sc.add(m);
  const cp=new THREE.Mesh(new THREE.PlaneGeometry(3,0.3),LM({map:signTex('Artist\u2019s view of the complex (not to scale)','#f5ead3','#3a2a30',1024,100,'34px "Atkinson Hyperlegible",sans-serif')}));cp.position.set(0,0.6,-14.74);I.sc.add(cp);}
 [['case1',-4.5,-9.5],['case2',0,-11.5],['case3',4.5,-9.5]].forEach(([k,x,z],i)=>{I.sc.add(bx(1.2,1,1.2,'#5f4636',x,0.5,z));const gb=new THREE.Mesh(new THREE.BoxGeometry(1.1,0.9,1.1),glassM);gb.position.set(x,1.45,z);I.sc.add(gb);
  if(i===0)I.sc.add(bx(0.6,0.4,0.45,marbM,x,1.2,z));if(i===1){const sl=new THREE.Mesh(new THREE.PlaneGeometry(0.8,0.6),LM({map:inlayT}));sl.position.set(x,1.35,z);sl.rotation.x=-0.5;I.sc.add(sl);}if(i===2)I.sc.add(bx(0.5,0.25,0.3,'#a8553f',x-0.1,1.12,z),bx(0.5,0.05,0.3,marbM,x-0.1,1.27,z),bx(0.3,0.25,0.3,C.sand,x+0.3,1.12,z));
  OC(I.nav,x,z,0.9);const P=TAJ.panels[k];I.pts.push({x,z:z+1.4,r:1.1,t:'Look at: '+P[0],panel:k});});
 lit(I,0,4,0,7,14);lit(I,0,4,-10,6,14);lit(I,3,3,0,3,8);
 Rr(I,-7.6,7.6,-4.7,4.7,4.3);Rr(I,-1.4,1.4,-5.5,-4.5,3);Rr(I,-7.6,7.6,-14.6,-5.3,4.3);exitAt(I,0,4.84,Math.PI);I.spawn=[0,3.2,Math.PI];I.exit={x:0,z:4.7,r:0.9};
 I.pts.push({x:-5,z:-1.8,r:1.5,t:'Ask the staff for directions',act:'staff'},{x:3,z:2.2,r:1.3,t:'Use the interactive map',act:'map'});return I;}
function tShop(){const I=mkInt('shop','Taj Gift Shop','Souvenirs bought here go into your bag.');const W='#ecd09a';
 fl(I,-6,6,-4,4,woodT,3,2);ce(I,-6,6,-4,4,4,'#f6efe2');wX(I,-4,-6,6,4,W);wX(I,4,-6,6,4,W,[[-0.9,0.9,2.6]]);wZ(I,-6,-4,4,4,W);wZ(I,6,-4,4,4,W);
 const SH=new Batch(new THREE.BoxGeometry(1,1,1),L('#7a5236')),IT=new Batch(new THREE.BoxGeometry(1,1,1),L('#ffffff'));
 const shelf=(x,z,w,d)=>{SH.add(x,1.3,z,w,2.6,d);for(let k=0;k<4;k++)SH.add(x,0.3+k*0.65,z+(d<1?0.25:0)*Math.sign(-z),w,0.05,d+0.05);for(let k=0;k<4;k++)for(let i=0;i<Math.floor(Math.max(w,d)/0.35);i++){const t=(i+0.5)*0.35-Math.max(w,d)/2;IT.add(w>d?x+t:x+0.36*Math.sign(-x),0.45+k*0.65,w>d?z+0.36*Math.sign(-z):z+t,0.22,0.22+((i*7+k)%3)*0.06,0.18,0,['#c0563f','#e3a347','#4f6e8a','#f2efe6','#55745c','#c97a9a','#d9b14a'][(i+k*3)%7]);}};
 shelf(-2.2,-3.6,6.4,0.5);shelf(-5.6,0.4,0.5,5.2);SH.flush(I.sc);IT.flush(I.sc);OB(I.nav,-5.5,-4,1.1,-3.3);OB(I.nav,-6,-2.2,-5.3,3);
 I.sc.add(bx(2.8,0.85,1.4,'#8a6243',0,0.42,0.3));[-0.9,0,0.9].forEach(x=>{const m=miniTaj(0.32);m.position.set(x,0.85,0.3);I.sc.add(m);});OB(I.nav,-1.4,-0.4,1.4,1.0);
 {const pcT=ct(512,128,(g,W,H)=>{for(let i=0;i<8;i++){g.fillStyle=['#f2d7a0','#bcd9e8','#f2c6b0','#d9e6c8'][i%4];g.fillRect(i*64+4,8,56,112);g.fillStyle='#f6f1e8';g.beginPath();g.arc(i*64+32,70,14,Math.PI,0);g.fill();g.fillRect(i*64+18,70,28,26);}});
  I.sc.add(cy(0.06,0.06,1.8,'#8d9096',-3.6,0.9,2,6));const r=new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.45,0.9,8,1,true),LM({map:pcT,side:THREE.DoubleSide}));r.position.set(-3.6,1.3,2);I.sc.add(r);OC(I.nav,-3.6,2,0.5);}
 I.sc.add(bx(1.4,0.8,0.8,'#8a6243',3.8,0.4,2.4));{const NB=new Batch(new THREE.BoxGeometry(0.3,0.04,0.42),L('#ffffff'));for(let i=0;i<10;i++)NB.add(3.4+(i%3)*0.35,0.82+Math.floor(i/3)*0.045,2.4,1,1,1,0,INL[i%4]);NB.flush(I.sc);for(let i=0;i<5;i++){const b=new THREE.Mesh(new THREE.TorusGeometry(0.08,0.02,6,14),L(INL[i%4]));b.rotation.x=Math.PI/2;b.position.set(4.25,0.82+i*0.04,2.3);I.sc.add(b);}}OB(I.nav,3.1,2,4.5,2.8);
 I.sc.add(bx(2.6,1.05,0.9,'#7a5236',4.1,0.52,-2.2),bx(0.4,0.3,0.3,'#3a3f48',4.6,1.2,-2.2));OB(I.nav,2.8,-2.65,5.4,-1.75);npc(I,{skin:'#8a5a3a',shirt:'#c0563f',bottom:'#22252b',hair:'short'},4.1,-3.2,0);
 {const s=new THREE.Mesh(new THREE.PlaneGeometry(3,0.5),LM({map:signTex('GIFT SHOP','#a8553f','#f5ead3',512,86,'bold 50px "Atkinson Hyperlegible",sans-serif')}));s.position.set(3.6,3.2,-3.84);I.sc.add(s);}
 lit(I,0,3.6,0,10,14);lit(I,-3,3,-2,4,8);Rr(I,-5.2,5.6,-3.1,3.7,3.8);exitAt(I,0,3.84,Math.PI);I.spawn=[0,2.3,Math.PI];I.exit={x:0,z:3.75,r:0.9};
 I.pts.push({x:3.6,z:-1.2,r:1.4,t:'Buy souvenirs',act:'shop'},{x:0,z:1.5,r:1.2,t:'Look at the marble models',act:'models'},{x:-3.6,z:3,r:1.1,t:'Browse the postcards',act:'cards'});return I;}
function tCafe(){const I=mkInt('cafe','Refreshment Kiosk','Snacks and drinks. Food stays out of the monument area.');const W='#efe2c6';
 fl(I,-5,5,-4,4,tileT('#c98060','#b8704f',6),2,2);ce(I,-5,5,-4,4,3.8,'#f6efe2');wX(I,-4,-5,5,3.8,W);wX(I,4,-5,5,3.8,W,[[-0.9,0.9,2.6]]);wZ(I,-5,-4,4,3.8,W);wZ(I,5,-4,4,3.8,W);
 I.sc.add(bx(10,1,0.06,'#5f9a94',0,0.5,3.82),bx(10,1,0.06,'#5f9a94',0,0.5,-3.82),bx(0.06,1,8,'#5f9a94',-4.82,0.5,0),bx(0.06,1,8,'#5f9a94',4.82,0.5,0));
 I.sc.add(bx(7,1.05,0.9,'#7a5236',0,0.52,-2.9),bx(7.2,0.08,1.1,'#5f3b26',0,1.08,-2.9),cy(0.25,0.25,0.6,'#c9a24a',-2,1.4,-3,10),cy(0.25,0.25,0.6,'#8d9096',-1.3,1.4,-3,10));OB(I.nav,-3.5,-3.4,3.5,-2.4);
 const menu=ct(512,300,(g,W,H)=>{g.fillStyle='#2f3a36';g.fillRect(0,0,W,H);g.fillStyle='#f5ead3';g.font='bold 40px "Patrick Hand",cursive';g.fillText('MENU',30,52);g.font='26px "Atkinson Hyperlegible",sans-serif';TAJ.cafe.forEach(([n,p],i)=>{g.fillText(n,30,110+i*56);g.textAlign='right';g.fillText('\u20a6'+p,W-30,110+i*56);g.textAlign='left';});});
 {const m=new THREE.Mesh(new THREE.PlaneGeometry(3,1.75),LM({map:menu}));m.position.set(1.8,2.5,-3.83);I.sc.add(m);}npc(I,{skin:'#7a4a2e',shirt:'#f2efe6',bottom:'#22252b',hair:'short'},0.6,-3.5,0);
 const TB=new Batch(new THREE.CylinderGeometry(0.55,0.55,0.06,14),L('#f2efe6')),CH=new Batch(new THREE.BoxGeometry(0.42,0.45,0.42),L('#8a6243'));
 [[-2.6,0.2],[2.6,0.2],[-2.6,2.5],[2.6,2.5]].forEach(([x,z])=>{TB.add(x,0.75,z);TB.add(x,0.37,z,0.12,6,0.12);CH.add(x-0.85,0.22,z);CH.add(x+0.85,0.22,z);OC(I.nav,x,z,0.75);OC(I.nav,x-0.85,z,0.25);OC(I.nav,x+0.85,z,0.25);});TB.flush(I.sc);CH.flush(I.sc);
 [[1.75,0.2,Math.PI/2],[3.45,0.2,-Math.PI/2]].forEach(([x,z,ry],k)=>{const o=makePerson({adult:1,casual:1,skin:['#e0b48e','#5c3520'][k],shirt:['#4f6e8a','#d9822b'][k],bottom:'#22252b',hair:['short','bun'][k]});o.position.set(x,0.1,z);o.rotation.y=ry;I.sc.add(o);I.npcs.push({o,pose:'chat'});});
 lit(I,0,3.4,0,10,14);Rr(I,-4.6,4.6,-2.2,3.7,3.6);exitAt(I,0,3.84,Math.PI);I.spawn=[0,1.7,Math.PI];I.exit={x:0,z:3.75,r:0.9};
 I.pts.push({x:0,z:-1.8,r:1.4,t:'Order food & drinks',act:'cafe'},{x:-2.6,z:1.35,r:1.0,t:'Sit and chat with classmates',act:'chat'});return I;}
function tGuard(){const I=mkInt('guard','Security Booth','The site security post at the car park entrance.');const W='#e8e2d4';
 fl(I,-2.2,2.2,-2.2,2.2,tileT('#b9b6ae','#aeaba2',4),1,1);ce(I,-2.2,2.2,-2.2,2.2,3,'#f2efe6');wX(I,-2.2,-2.2,2.2,3,W);wX(I,2.2,-2.2,2.2,3,W,[[-0.8,0.8,2.4]]);wZ(I,-2.2,-2.2,2.2,3,W);wZ(I,2.2,-2.2,2.2,3,W);
 I.sc.add(bx(3.6,0.85,0.8,'#6b6f78',0,0.42,-1.7));const cc=ct(256,160,(g,W,H)=>{g.fillStyle='#1d2622';g.fillRect(0,0,W,H);for(let i=0;i<4;i++){const x=(i%2)*128+6,y=Math.floor(i/2)*80+6;g.fillStyle=['#6f8f76','#8aa38f','#7a967f','#5f7f66'][i];g.fillRect(x,y,116,68);g.fillStyle='rgba(255,255,255,.5)';g.fillRect(x+20+i*10,y+30,30,20);g.fillStyle='#e8f0e8';g.font='12px monospace';g.fillText('CAM '+(i+1),x+4,y+14);}});
 [-1,0,1].forEach(i=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(0.9,0.56),new THREE.MeshBasicMaterial({map:cc}));m.position.set(i*1.0,1.35,-1.9);I.sc.add(m);I.sc.add(bx(0.95,0.62,0.12,'#22252b',i*1.0,1.35,-1.98));});
 I.sc.add(bx(0.3,0.18,0.2,'#2a2a2a',1.4,0.94,-1.5),bx(0.5,1.8,1.6,'#7a5236',-1.95,0.9,0.6));{const BB=new Batch(new THREE.BoxGeometry(0.38,0.28,0.3),L('#ffffff'));for(let i=0;i<6;i++)BB.add(-1.9,0.35+(i%3)*0.55,0.2+Math.floor(i/3)*0.7,1,1,1,0,['#c9a064','#e3a347','#4f6e8a','#f2efe6','#55745c','#c0563f'][i]);BB.flush(I.sc);}
 {const w=new THREE.Mesh(new THREE.PlaneGeometry(1.4,0.9),new THREE.MeshBasicMaterial({map:outT}));w.position.set(2.04,1.7,0);w.rotation.y=-Math.PI/2;I.sc.add(w);}
 npc(I,{skin:'#8a5a3a',shirt:'#8a7a52',bottom:'#3a3a32',hair:'short'},1.1,-0.9,0);lit(I,0,2.7,0,6,8);
 Rr(I,-1.6,1.9,-1.1,1.9,2.8);OB(I.nav,-2.2,-0.3,-1.6,1.5);exitAt(I,0,2.04,Math.PI,1.6,2.4);I.spawn=[0,1.4,Math.PI];I.exit={x:0,z:1.85,r:0.7};I.camD=3.2;
 I.pts.push({x:0.4,z:0.1,r:1.1,t:'Ask the guard about the rules',panel:'guard'},{x:-1.1,z:0.6,r:0.9,t:'Check the lost & found shelf',act:'lost'});return I;}
function holeCeil(I,x0,x1,z0,z1,y,holes,c){const s=new THREE.Shape();s.moveTo(x0,z0);s.lineTo(x1,z0);s.lineTo(x1,z1);s.lineTo(x0,z1);s.closePath();holes.forEach(([x,z,r])=>{const p=new THREE.Path();p.absarc(x,z,r,0,Math.PI*2,true);s.holes.push(p);});const g=new THREE.ShapeGeometry(s,24);g.rotateX(Math.PI/2);const m=new THREE.Mesh(g,LM({color:c,side:THREE.DoubleSide}));m.position.y=y;I.sc.add(m);}
function idome(I,x,y,z,r){const d=new THREE.Mesh(new THREE.SphereGeometry(r,28,12,0,Math.PI*2,0,Math.PI/2),LM({map:domeT,side:THREE.BackSide}));d.position.set(x,y,z);I.sc.add(d);}
function tMosque(){const I=mkInt('mosque','The Mosque','A prayer hall in red sandstone. Please speak softly.','#1e1612');const SW=LM({map:rep(sandT,2,1)});
 fl(I,-12,12,-4,4,musT,6,2);wX(I,-4,-12,12,7,SW);wZ(I,-12,-4,4,7,SW);wZ(I,12,-4,4,7,SW);wX(I,4,-12,12,7,SW,[[-9.2,-6.8,3.8],[-5.2,-2.8,3.8],[-1.6,1.6,4.6],[2.8,5.2,3.8],[6.8,9.2,3.8]]);
 [-4,4].forEach(x=>wZ(I,x,-4,4,7,SW,[[-2.6,2.6,5.2]]));holeCeil(I,-12,12,-4,4,7,[[-8,0,3.9],[0,0,3.9],[8,0,3.9]],'#c27a5c');[-8,0,8].forEach(x=>idome(I,x,7,0,3.9));
 {const o=new THREE.Mesh(new THREE.PlaneGeometry(24,4.6),new THREE.MeshBasicMaterial({map:outT}));o.position.set(0,2.3,4.4);o.rotation.y=Math.PI;I.sc.add(o);}
 {const mt=facTex({W:256,H:384,bg:'#f2ece0',line:'#cdbda2',r1:'#6a3a2c',r2:'#3a1f1a',band:0.08,cal:1,inlay:1,arches:[[0.2,0.2,0.6,0.76,'rec']]});const m=new THREE.Mesh(new THREE.PlaneGeometry(2.4,3.6),LM({map:mt}));m.position.set(0,1.85,-3.84);I.sc.add(m);}
 {const MB=new Batch(new THREE.BoxGeometry(1,1,1),L('#f2ece0'));for(let i=0;i<4;i++)MB.add(2.4,0.15+i*0.15,-3.2+i*0.2,0.9,0.3+i*0.3,0.3);MB.flush(I.sc);OB(I.nav,1.9,-3.9,2.9,-2.4);}
 [-8,0,8].forEach(x=>{I.sc.add(cy(0.015,0.015,2.2,'#5a4a2a',x,5.9,0,4),cy(0.22,0.14,0.4,C.gold,x,4.7,0,8));lit(I,x,4.4,0,7,10);});
 pan(I,'mosque',-11.83,2.2,1.8,Math.PI/2);npc(I,{skin:'#7a4a2e',shirt:'#f2efe6',bottom:'#f2efe6',hair:'short'},10.4,2.6,-Math.PI/2);
 R(I.nav,-11.6,11.6,-3.6,3.75);I.cam.push([-11.7,11.7,-3.7,3.9,6.6]);[-4,4].forEach(x=>{OB(I.nav,x-0.3,-4,x+0.3,-2.6);OB(I.nav,x-0.3,2.6,x+0.3,4);});
 I.spawn=[0,2.4,Math.PI];I.exit={x:0,z:3.65,r:1.2,also:[[-8,3.65],[-4,3.65],[4,3.65],[8,3.65]]};
 I.pts.push({x:0,z:-2.4,r:1.3,t:'Look at the mihrab',panel:'mihrab'},{x:-6.5,z:0.5,r:1.4,t:'Look at the floor patterns',panel:'floor'});return I;}
function tJawab(){const I=mkInt('jawab','The Jawab','The mirror-image "answer" to the mosque.','#1e1612');const SW=LM({map:rep(sandT,2,1)});
 fl(I,-12.3,12.3,-4,4,starT('#efe6d6','rgba(150,110,80,.6)'),12,4);
 wX(I,-4,-4.3,4.3,7.5,SW);wX(I,4,-4.3,4.3,7.5,SW,[[-1.6,1.6,4.2]]);[-4.3,4.3].forEach(x=>wZ(I,x,-4,4,7.5,SW,[[-1,1,3]]));
 [-1,1].forEach(s=>{const a=s*4.3,b=s*12;wX(I,-3,Math.min(a,b),Math.max(a,b),5,SW);wX(I,3,Math.min(a,b),Math.max(a,b),5,SW);wZ(I,b,-3,3,5,SW);ce(I,Math.min(a,b),Math.max(a,b),-3,3,5,'#d9a080');});
 holeCeil(I,-4.3,4.3,-4,4,7.5,[[0,0,3.95]],'#c27a5c');idome(I,0,7.5,0,3.95);
 {const o=new THREE.Mesh(new THREE.PlaneGeometry(3.2,4.2),new THREE.MeshBasicMaterial({map:outT}));o.position.set(0,2.1,4.3);o.rotation.y=Math.PI;I.sc.add(o);}
 {const bt=facTex({W:256,H:384,bg:'#b45a3f',line:C.line,r0:'rgba(60,20,15,.3)',band:0.06,arches:[[0.2,0.2,0.6,0.76,'blind']]});const m=new THREE.Mesh(new THREE.PlaneGeometry(2.4,3.6),LM({map:bt}));m.position.set(0,1.85,-3.84);I.sc.add(m);}
 I.sc.add(bx(3,0.85,1.8,'#6b4a33',0,0.42,-1.2));{const st=ct(256,160,(g,W,H)=>{g.fillStyle='#e9dcc0';g.fillRect(0,0,W,H);g.fillStyle='#a8553f';g.fillRect(16,50,40,60);g.fillRect(W-56,50,40,60);g.fillStyle='#f6f1e8';g.fillRect(W/2-30,20,60,50);g.fillStyle='#7aa35e';g.fillRect(70,80,W-140,70);g.strokeStyle='#2f6f6a';g.setLineDash([8,6]);g.lineWidth=3;g.beginPath();g.moveTo(W/2,6);g.lineTo(W/2,H-6);g.stroke();g.setLineDash([]);g.fillStyle='#3a2a30';g.font='bold 14px sans-serif';g.textAlign='center';g.fillText('MIRROR LINE',W/2,H-10);});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(2.8,1.6),LM({map:st}));m.rotation.x=-Math.PI/2;m.position.set(0,0.86,-1.2);I.sc.add(m);}OB(I.nav,-1.5,-2.1,1.5,-0.3);
 {const rv=ct(256,320,(g,W,H)=>{const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#d9ecf2');gr.addColorStop(0.5,'#f2ead6');gr.addColorStop(0.52,'#6fa36a');gr.addColorStop(0.62,'#7fb2bd');gr.addColorStop(0.85,'#8fc0c8');gr.addColorStop(0.86,'#c98a6a');gr.addColorStop(1,'#b5734f');g.fillStyle=gr;g.fillRect(0,0,W,H);g.fillStyle='rgba(160,70,50,.8)';g.fillRect(20,140,60,22);});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(2.2,3),new THREE.MeshBasicMaterial({map:rv}));m.position.set(8,2.1,-2.84);I.sc.add(m);const fr=facTex({W:256,H:340,bg:'#b45a3f',line:C.line,arches:[[0.12,0.1,0.76,0.9,'cut']]});const f=new THREE.Mesh(new THREE.PlaneGeometry(2.8,3.6),LM({map:fr,alphaTest:0.5}));f.position.set(8,2.1,-2.82);I.sc.add(f);}
 pan(I,'jawab',-8,2.2,-2.84,0);lit(I,0,5.5,0,10,12);lit(I,-8,4,0,6,10);lit(I,8,4,0,6,10);
 npc(I,{skin:'#e0b48e',shirt:'#9b86c4',bottom:'#22252b',hair:'bun',skirt:1},-10,1.6,Math.PI*0.8);npc(I,{skin:'#c98f6c',shirt:'#55745c',bottom:'#3a3a32',hair:'short'},-9.2,1.9,-Math.PI*0.7);
 Rr(I,-3.95,3.95,-3.7,3.75,7);Rr(I,-4.8,-3.8,-0.85,0.85,2.8);Rr(I,3.8,4.8,-0.85,0.85,2.8);Rr(I,-11.7,-4.6,-2.7,2.7,4.8);Rr(I,4.6,11.7,-2.7,2.7,4.8);
 I.spawn=[0,2.4,Math.PI];I.exit={x:0,z:3.65,r:1.1};I.pts.push({x:0,z:0.3,r:1.2,t:'Try the symmetry puzzle',act:'sym'},{x:8,z:-1.5,r:1.3,t:'Look out towards the river',panel:'jview'});return I;}
function tTomb(){const I=mkInt('tomb','The Mausoleum','Voices low. No photography inside.','#120e0c');const MW=LM({map:rep(marbT,2,2)}),MW2=LM({color:'#f1ebdf'});
 fl(I,-15.5,15.5,-15.5,14.5,starT('#f1ebe0','rgba(120,100,80,.55)'),16,15);
 const a=7.5,side=2*a*Math.tan(Math.PI/8);
 const cutT=facTex({W:512,H:660,bg:'#f2ece0',line:'#cdbda2',band:0.05,cal:1,inlay:1,arches:[[(side-3)/2/side,0.35,3/side,0.65,'cut']]});
 const winT=facTex({W:512,H:660,bg:'#f2ece0',line:'#cdbda2',r1:'#e6dccb',r2:'#cfc3ad',inlay:1,arches:[[0.2,0.1,0.6,0.36,'win'],[0.2,0.56,0.6,0.4,'rec']]});
 for(let k=0;k<8;k++){const th=k*Math.PI/4,nx=Math.sin(th),nz=Math.cos(th),tx=Math.cos(th),tz=-Math.sin(th);const put=(w,h,y,off)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,0.4),MW2);m.position.set(nx*(a+0.2)+tx*off,y,nz*(a+0.2)+tz*off);m.rotation.y=th;I.sc.add(m);};
  if(k%2===0){const pw=(side-3)/2;put(pw,8,4,-(1.5+pw/2));put(pw,8,4,1.5+pw/2);put(3,2.8,6.6,0);I.sc.add(facePl(cutT,side,8,th+Math.PI,-(a-0.01),4));}
  else{put(side,8,4,0);I.sc.add(facePl(winT,side,8,th+Math.PI,-(a-0.01),4,0,{m:{emissive:'#3a3226'}}));}}
 idome(I,0,8,0,8.15);
 {const n=8,ap=3.4,sd=2*ap*Math.tan(Math.PI/8);const jm=LM({map:latT,alphaTest:0.5,side:THREE.DoubleSide});const PO=new Batch(new THREE.CylinderGeometry(0.09,0.09,2.1,8),LM({color:'#efe8dc'})),PT=new Batch(new THREE.SphereGeometry(0.13,8,6),goldM);
  for(let k=0;k<n;k++){const th=k*Math.PI/4+Math.PI/8;const p=new THREE.Mesh(new THREE.PlaneGeometry(sd,1.9),jm);p.position.set(Math.sin(th)*ap,0.95,Math.cos(th)*ap);p.rotation.y=th;I.sc.add(p);const vth=th+Math.PI/8,vr=ap/Math.cos(Math.PI/8);PO.add(Math.sin(vth)*vr,1.05,Math.cos(vth)*vr);PT.add(Math.sin(vth)*vr,2.15,Math.cos(vth)*vr);}PO.flush(I.sc);PT.flush(I.sc);OC(I.nav,0,0,3.75);}
 {const im=LM({map:inlayT});I.sc.add(bx(2.6,0.25,2.8,'#ece4d6',-0.6,0.12,0.05));const c1=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.55,2.0),im);c1.position.set(0,0.52,0);I.sc.add(c1,bx(0.7,0.22,1.7,'#f2ece0',0,0.9,0));const c2=new THREE.Mesh(new THREE.BoxGeometry(1.0,0.62,2.25),im);c2.position.set(-1.35,0.56,0.1);I.sc.add(c2,bx(0.78,0.24,1.9,'#f2ece0',-1.35,0.98,0.1));}
 I.sc.add(cy(0.02,0.02,2.6,'#6a5a2a',0,7.6,0,4),cy(0.38,0.2,0.7,C.gold,0,5.95,0,10),cy(0.12,0.12,0.25,C.gold,0,5.5,0,8));lit(I,0,5.6,0,22,26,'#ffd9a0');lit(I,0,3,9,5,8);
 const PASS=[[0,1],[1,0],[-1,0],[0,-1]];PASS.forEach(([dx,dz])=>{const along=dx?'x':'z';const sgn=dx||dz;[-1.55,1.55].forEach(o=>{const m=new THREE.Mesh(new THREE.BoxGeometry(along==='x'?1.9:0.3,5.2,along==='x'?0.3:1.9),MW2);m.position.set(along==='x'?sgn*8.25:o,2.6,along==='x'?o:sgn*8.25);I.sc.add(m);});const c=new THREE.Mesh(new THREE.BoxGeometry(along==='x'?1.9:3.4,0.4,along==='x'?3.4:1.9),MW2);c.position.set(along==='x'?sgn*8.25:0,5.4,along==='x'?0:sgn*8.25);I.sc.add(c);});
 const hallB=(x0,x1,z0,z1,h,open)=>{const W=MW;if(open!=='n')wX(I,z0,x0,x1,h,W);if(open!=='s')wX(I,z1,x0,x1,h,W);if(open!=='w')wZ(I,x0,z0,z1,h,W);if(open!=='e')wZ(I,x1,z0,z1,h,W);
  if(open==='w')wZ(I,x0,z0,z1,h,W,[[-1.5,1.5,5.2]]);if(open==='e')wZ(I,x1,z0,z1,h,W,[[-1.5,1.5,5.2]]);if(open==='n')wX(I,z0,x0,x1,h,W,[[-1.5,1.5,5.2]]);if(open==='s')wX(I,z1,x0,x1,h,W,[[-1.5,1.5,5.2]]);ce(I,x0,x1,z0,z1,h,'#efe7d8');lit(I,(x0+x1)/2,h-0.6,(z0+z1)/2,7,10);};
 hallB(9.2,15,-3,3,5.8,'w');hallB(-15,-9.2,-3,3,5.8,'e');hallB(-3,3,-15,-9.2,5.8,'s');hallB(-3,3,9.2,14.2,6,'n');
 pan(I,'inlay',14.83,2.3,0,-Math.PI/2);I.sc.add(bx(1,1,0.6,'#e4dccb',12,0.5,-2.2));{const sl=new THREE.Mesh(new THREE.PlaneGeometry(0.9,0.9),LM({map:inlayT}));sl.position.set(12,1.5,-2.2);sl.rotation.y=0;I.sc.add(sl);}OB(I.nav,11.4,-2.7,12.6,-1.7);
 npc(I,{skin:'#8a5a3a',shirt:'#2f6f6a',bottom:'#22252b',hair:'short',glasses:1},11.5,2.1,-Math.PI*0.75);
 pan(I,'cal',-14.83,2.3,0,Math.PI/2);{const cc=ct(512,128,(g,W,H)=>{cal(g,0,0,W,H);});const m=new THREE.Mesh(new THREE.PlaneGeometry(4.4,1.1),LM({map:cc}));m.position.set(-12,4.4,-2.83);I.sc.add(m);}
 {const P=TAJ.panels.recon;const bt=panelTex('EDUCATIONAL RECONSTRUCTION',P[1],'#fff3c4','#3a2a30','#c0563f');const m=new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.55),LM({map:bt}));m.position.set(0,2.5,-14.83);I.sc.add(m);
  I.sc.add(bx(2.4,0.9,1.6,'#e4dccb',0,0.45,-12.2));const mg=new THREE.Group();mg.position.set(0,0.9,-12.2);I.sc.add(mg);mg.add(bx(1.9,0.08,1.1,'#d9cdb6',0,0.04,0),bx(1.9,0.5,0.06,'#cfc3ad',0,0.3,-0.52),bx(0.06,0.5,1.1,'#cfc3ad',-0.92,0.3,0),bx(1.9,0.06,0.55,'#efe8dc',0,0.52,-0.25),bx(0.16,0.1,0.3,'#a8553f',0.1,0.13,0.1),bx(0.18,0.11,0.32,'#a8553f',-0.2,0.13,0.12),bx(0.12,0.08,0.24,'#f2ece0',0.1,0.6,-0.25));
  const gb=new THREE.Mesh(new THREE.BoxGeometry(2.1,0.75,1.3),glassM);gb.position.set(0,1.28,-12.2);I.sc.add(gb);OB(I.nav,-1.2,-13,1.2,-11.4);
  I.sc.add(bx(1.6,0.02,1.2,'#2a221e',-1.9,0.01,-10.2));const PO=new Batch(new THREE.CylinderGeometry(0.05,0.07,1,8),L(C.gold));[[-2.6,-10.9],[-1.2,-10.9],[-2.6,-9.5],[-1.2,-9.5]].forEach(([x,z])=>PO.add(x,0.5,z));PO.flush(I.sc);I.sc.add(bx(0.04,0.05,1.4,'#a8323a',-1.2,0.9,-10.2),bx(1.4,0.05,0.04,'#a8323a',-1.9,0.9,-9.5));OB(I.nav,-2.7,-11,-1.1,-9.4);
  const ns=new THREE.Mesh(new THREE.PlaneGeometry(1.1,0.3),LM({map:signTex('NO PUBLIC ACCESS','#a8323a','#ffffff',512,128,'bold 54px sans-serif')}));ns.position.set(-1.9,1.25,-9.45);I.sc.add(ns);}
 pan(I,'dome',2.83,2.3,11.6,-Math.PI/2);exitAt(I,0,14.04,Math.PI,2,2.8);
 [[0,4.4,'View the cenotaphs','jali'],[-4.2,-2.6,'Look up at the inner dome','dome'],[3.8,-3.2,'Look at the hanging lamp','lamp']].forEach(([x,z,t,k])=>I.pts.push({x,z,r:1.3,t,panel:k}));
 I.npcs.forEach(n=>{});
 [[-7.1,7.1,-2.9,2.9],[-2.9,2.9,-7.1,7.1],[-5.5,5.5,-4.6,4.6],[-4.6,4.6,-5.5,5.5]].forEach(r=>Rr(I,...r,11));[[6.9,9.3,-1.3,1.3],[-9.3,-6.9,-1.3,1.3],[-1.3,1.3,-9.3,-6.9],[-1.3,1.3,6.9,9.3]].forEach(r=>Rr(I,...r,5));
 [[9.2,14.6,-2.6,2.6],[-14.6,-9.2,-2.6,2.6],[-2.6,2.6,-14.6,-9.2],[-2.6,2.6,9.2,13.8]].forEach(r=>Rr(I,...r,5.5));
 I.spawn=[0,12.8,Math.PI];I.exit={x:0,z:13.6,r:1.0};I.group=1;return I;}
export const INTERIORS={ticket:tTicket,info:tInfo,shop:tShop,cafe:tCafe,guard:tGuard,mosque:tMosque,jawab:tJawab,tomb:tTomb};
