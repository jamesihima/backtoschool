import * as THREE from 'three';
import {PAL,L,bx,cy,Batch} from './look.js';
import {makePerson,poseUpdate} from '../common.js';
const ct=(w,h,f)=>{const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;};
const LESSONS=[['INDICES','2 × 2 × 2 = 2³','aᵐ × aⁿ = aᵐ⁺ⁿ','3² × 3⁴ = 3⁶ = 729','aᵐ ÷ aⁿ = aᵐ⁻ⁿ','a⁰ = 1'],['FRACTIONS','½ + ¼ = ¾','Find a common denominator','⅔ × ¾ = ½','To divide: flip & multiply','¾ ÷ ½ = 1½'],['SIMPLE INTEREST','I = PRT ÷ 100','P = ₦2,000  R = 5%  T = 3 yrs','I = 2000×5×3 ÷ 100','I = ₦300','Amount = P + I = ₦2,300']];
export function createClassroom(){
 const sc=new THREE.Scene();sc.background=new THREE.Color('#2e2228');
 sc.add(new THREE.HemisphereLight('#f6e8d2','#5a4450',1.2));
 const sun=new THREE.DirectionalLight('#ffd9a8',2.6);sun.position.set(-9,6.2,1.2);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:0.5,far:30});sun.shadow.bias=-0.0006;sun.target.position.set(1,0,0.5);sc.add(sun,sun.target);
 const hw=6,hd=5,H=3.6,Z1=8;
 const floorT=ct(512,512,(g,w,h)=>{for(let y=0;y<8;y++)for(let x=0;x<8;x++){g.fillStyle=(x+y)%2?'#dcc8a3':'#d0ba94';g.fillRect(x*64,y*64,64,64);}g.fillStyle='rgba(90,60,40,0.1)';for(let k=0;k<400;k++)g.fillRect(Math.random()*w,Math.random()*h,2,2);});
 floorT.wrapS=floorT.wrapT=THREE.RepeatWrapping;floorT.repeat.set(1.5,1.6);
 const fl=new THREE.Mesh(new THREE.PlaneGeometry(12,13),new THREE.MeshLambertMaterial({map:floorT}));fl.rotation.x=-Math.PI/2;fl.position.z=1.5;fl.receiveShadow=true;sc.add(fl);
 const wall=(w,h,d,c,x,y,z,cast=false)=>{const m=bx(w,h,d,c,x,y,z);m.castShadow=cast;sc.add(m);return m;};
 wall(12,H,0.2,PAL.cream,0,H/2,-hd-0.1);wall(12.02,1.1,0.22,PAL.sage,0,0.55,-hd-0.1);
 wall(0.2,H,13,PAL.cream,hw+0.1,H/2,1.5);wall(0.22,1.1,13,PAL.sage,hw+0.1,0.55,1.5);
 const ceil=bx(12.4,0.12,13.4,PAL.creamD,0,H+0.06,1.5);ceil.castShadow=false;sc.add(ceil);
 // left wall with louvre windows (cast striped light patches onto the floor)
 const WZ=[-3,0,3,6],ww=1.8;
 wall(0.22,1.1,13,PAL.sage,-hw-0.1,0.55,1.5,true);wall(0.22,0.7,13,PAL.cream,-hw-0.1,3.25,1.5,true);
 let zc=-hd;[...WZ.map(z=>z-ww/2),Z1].forEach((z1,k)=>{if(z1>zc)wall(0.22,1.8,z1-zc,PAL.cream,-hw-0.1,2.0,(zc+z1)/2,true);zc=(WZ[k]??0)+ww/2;});
 const slat=new Batch(new THREE.BoxGeometry(0.16,0.025,ww),L(PAL.frame));
 WZ.forEach(z=>{for(let y=1.18;y<2.86;y+=0.19)slat.add(-hw-0.08,y,z);});
 const sm=slat.flush(sc,'SM_Louvre_Slats');
 WZ.forEach(z=>{sc.add(bx(0.24,0.08,ww+0.1,PAL.frame,-hw-0.1,1.12,z),bx(0.24,0.08,ww+0.1,PAL.frame,-hw-0.1,2.9,z));});
 // light shafts + dust
 const gradT=ct(8,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(255,230,180,0.9)');gr.addColorStop(1,'rgba(255,230,180,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);});
 const sd=sun.position.clone().normalize();const down=sd.clone().negate();
 WZ.forEach(z=>{const len=6.5;const geo=new THREE.PlaneGeometry(ww,len);const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:gradT,transparent:true,opacity:0.16,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  const xA=new THREE.Vector3(0,0,1),yA=sd.clone(),nA=new THREE.Vector3().crossVectors(xA,yA).normalize();m.matrixAutoUpdate=false;const mtx=new THREE.Matrix4().makeBasis(xA,yA,nA);mtx.setPosition(new THREE.Vector3(-hw,2.0,z).addScaledVector(down,len/2));m.matrix.copy(mtx);sc.add(m);});
 const dustN=140,dg=new THREE.BufferGeometry(),dp=new Float32Array(dustN*3);for(let k=0;k<dustN;k++){dp[k*3]=-5.5+Math.random()*5;dp[k*3+1]=0.3+Math.random()*2.8;dp[k*3+2]=-4+Math.random()*11;}dg.setAttribute('position',new THREE.BufferAttribute(dp,3));
 const dust=new THREE.Points(dg,new THREE.PointsMaterial({color:'#ffe9c4',size:0.035,transparent:true,opacity:0.7,blending:THREE.AdditiveBlending,depthWrite:false}));sc.add(dust);
 // chalkboard
 sc.add(bx(6.8,2.5,0.12,'#7a5230',0,2.0,-hd+0.04),bx(6.6,0.08,0.22,'#7a5230',0,0.78,-hd+0.12));
 const bc=document.createElement('canvas');bc.width=1024;bc.height=360;const bg=bc.getContext('2d');const bt=new THREE.CanvasTexture(bc);bt.colorSpace=THREE.SRGBColorSpace;
 const board=new THREE.Mesh(new THREE.PlaneGeometry(6.4,2.25),new THREE.MeshLambertMaterial({map:bt}));board.position.set(0,2.0,-hd+0.11);sc.add(board);
 let lines=LESSONS[0],prog=0,drawn=-1;
 function drawBoard(){const n=Math.floor(prog*lines.join('').length);if(n===drawn)return;drawn=n;bg.fillStyle='#34503f';bg.fillRect(0,0,1024,360);bg.fillStyle='rgba(255,255,255,0.05)';for(let k=0;k<30;k++)bg.fillRect((k*137)%1024,(k*71)%360,90,3);
  let left=n;bg.fillStyle='#f0f2e6';lines.forEach((l,k)=>{const s=l.slice(0,Math.max(0,left));left-=l.length;bg.font=(k?'40px':'bold 50px')+' "Patrick Hand",cursive';bg.fillText(s,44,62+k*52);});bt.needsUpdate=true;}
 drawBoard();
 // posters, clock
 const poster=(tex,w,h,x,y)=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshLambertMaterial({map:tex}));p.position.set(x,y,-hd+0.02);sc.add(p);};
 poster(ct(256,320,(g,w,h)=>{g.fillStyle='#f5ead3';g.fillRect(0,0,w,h);g.fillStyle='#a8553f';g.fillRect(0,0,w,52);g.fillStyle='#fff';g.font='bold 30px sans-serif';g.textAlign='center';g.fillText('TIMES TABLE',w/2,36);g.fillStyle='#3a2a30';g.font='18px sans-serif';for(let r=1;r<=9;r++)g.fillText(`${r} × 7 = ${r*7}`,w/2,52+r*29);}),1.0,1.25,-4.6,2.2);
 poster(ct(256,320,(g,w,h)=>{g.fillStyle='#e9f0e2';g.fillRect(0,0,w,h);g.fillStyle='#008751';g.fillRect(0,0,w/3,90);g.fillStyle='#fff';g.fillRect(w/3,0,w/3,90);g.fillStyle='#008751';g.fillRect(2*w/3,0,w/3,90);g.fillStyle='#3a2a30';g.font='bold 24px sans-serif';g.textAlign='center';g.fillText('NIGERIA',w/2,130);g.font='17px sans-serif';['36 States + FCT','Capital: Abuja','Unity & Faith,','Peace & Progress'].forEach((t,k)=>g.fillText(t,w/2,170+k*32));}),1.0,1.25,4.6,2.2);
 const clk=new THREE.Mesh(new THREE.CircleGeometry(0.32,28),new THREE.MeshLambertMaterial({map:ct(128,128,g=>{g.fillStyle='#fff';g.beginPath();g.arc(64,64,62,0,7);g.fill();g.strokeStyle='#3a2a30';g.lineWidth=6;g.stroke();g.lineWidth=5;g.beginPath();g.moveTo(64,64);g.lineTo(64,22);g.moveTo(64,64);g.lineTo(94,72);g.stroke();})}));clk.position.set(0,3.35,-hd+0.03);sc.add(clk);
 // teacher desk, plant, fans
 const td=new THREE.Group();td.position.set(3.7,0,-3.6);td.add(bx(2.0,0.08,0.9,'#9c6a3c',0,0.8,0),bx(1.95,0.74,0.08,'#7a5230',0,0.4,0.42),bx(0.45,0.05,0.32,PAL.white,0.4,0.86,0),bx(0.3,0.22,0.22,PAL.brick,-0.5,0.95,0.05),cy(0.05,0.05,0.16,PAL.sage,-0.1,0.92,-0.1,8));sc.add(td);
 sc.add(cy(0.28,0.22,0.6,PAL.brick,5.4,0.3,-4.4,12));{const p=new THREE.Mesh(new THREE.IcosahedronGeometry(0.55,1),L(PAL.leaf2));p.position.set(5.4,1.05,-4.4);p.castShadow=true;sc.add(p);}
 const fans=[];[[-2.5,0],[2.5,2]].forEach(([x,z])=>{const g=new THREE.Group();g.position.set(x,H-0.45,z);g.add(bx(0.05,0.45,0.05,'#666',0,0.22,0),cy(0.12,0.12,0.1,'#888',0,0,0,10));const bl=new THREE.Group();for(let k=0;k<3;k++){const b=bx(1.3,0.02,0.2,'#9a8e80');b.geometry.translate(0.65,0,0);b.rotation.y=k*Math.PI*2/3;b.castShadow=false;bl.add(b);}g.add(bl);sc.add(g);fans.push(bl);});
 // ---------- set dressing (prop-artist pass: real-world scale, readable silhouettes, wear on contact edges) ----------
 {const chalkY=0.85,lz=-hd+0.17;for(let k=0;k<5;k++)sc.add(bx(0.09,0.025,0.025,['#f6f2e6','#f6f2e6','#f0c24a','#e9a0a0','#9fc4e0'][k],-2.6+k*0.14,chalkY,lz));
  sc.add(bx(0.24,0.06,0.1,'#3a2a30',-1.6,chalkY+0.01,lz),bx(0.22,0.03,0.08,'#cfcabd',-1.6,chalkY+0.05,lz),bx(0.14,0.08,0.09,'#ecdcbc',2.4,chalkY+0.02,lz));
  const sg=ct(1024,96,(g,w,h)=>{g.fillStyle='#4a3340';g.fillRect(0,0,w,h);g.fillStyle='#f0c24a';let fs=56;g.font=`bold ${fs}px "Patrick Hand",cursive`;while(g.measureText('SS1 GOLD  ·  Knowledge & Service').width>w-60&&fs>20){fs-=2;g.font=`bold ${fs}px "Patrick Hand",cursive`;}g.textAlign='center';g.fillText('SS1 GOLD  \u00b7  Knowledge & Service',w/2,64);});
  const sp=new THREE.Mesh(new THREE.PlaneGeometry(3.4,0.62),new THREE.MeshLambertMaterial({map:sg}));sp.position.set(0,3.32,-hd+0.03);sc.add(sp);clk.position.x=2.8;
  // fluorescent tubes
  [[-2.4,-2],[2.4,-2],[-2.4,2.6],[2.4,2.6]].forEach(([x,z])=>{sc.add(bx(1.3,0.06,0.16,'#d8d3c6',x,H-0.06,z));const tb=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,1.2,8),new THREE.MeshBasicMaterial({color:'#fff8e6'}));tb.rotation.z=Math.PI/2;tb.position.set(x,H-0.12,z);sc.add(tb);});
  // right wall: door, timetable, Nigeria map, switch, cupboard
  const R_=hw-0.01;const rw=(w,h,tex,y,z)=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshLambertMaterial({map:tex}));p.rotation.y=-Math.PI/2;p.position.set(R_,y,z);sc.add(p);};
  sc.add(bx(0.08,2.2,1.0,'#7a5230',R_-0.02,1.1,4.6),bx(0.1,0.12,1.2,'#5a3a22',R_-0.03,2.26,4.6),bx(0.06,0.06,0.12,'#d9b45a',R_-0.08,1.05,4.25));
  rw(1.5,1.1,ct(300,220,(g,w,h)=>{g.fillStyle='#f5ead3';g.fillRect(0,0,w,h);g.fillStyle='#4f6e8a';g.fillRect(0,0,w,34);g.fillStyle='#fff';g.font='bold 20px sans-serif';g.fillText('CLASS TIMETABLE',60,24);g.fillStyle='#3a2a30';g.font='12px sans-serif';const D=['MON','TUE','WED','THU','FRI'],S=['Maths','English','Bio','Chem','Phy','Eco','Geo','Civic'];D.forEach((d,r)=>{g.fillText(d,8,58+r*34);for(let c=0;c<4;c++){g.fillStyle=['#fff3c4','#dfe8d8','#f6d4d4','#d4e2f0'][(r+c)%4];g.fillRect(48+c*62,42+r*34,58,26);g.fillStyle='#3a2a30';g.fillText(S[(r*3+c)%8],52+c*62,59+r*34);}});}),2.1,-2.6);
  rw(1.4,1.2,ct(280,240,(g,w,h)=>{g.fillStyle='#d4e2f0';g.fillRect(0,0,w,h);g.fillStyle='#55745c';g.beginPath();[[60,40],[150,30],[230,55],[240,120],[200,190],[130,215],[70,190],[40,120]].forEach(([x,y],k)=>k?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();g.strokeStyle='#3a2a30';g.lineWidth=2;g.stroke();g.fillStyle='#4f6e8a';g.fillRect(118,90,12,90);g.fillRect(70,140,60,10);g.fillStyle='#a8553f';g.beginPath();g.arc(140,125,6,0,7);g.fill();g.fillStyle='#3a2a30';g.font='bold 16px sans-serif';g.fillText('MAP OF NIGERIA',70,22);g.font='12px sans-serif';g.fillText('Abuja',148,128);}),2.1,-0.4);
  sc.add(bx(0.04,0.14,0.09,'#ecdcbc',R_-0.02,1.35,3.8));
  sc.add(bx(0.5,1.9,1.6,'#7a5230',R_-0.26,0.95,1.9),bx(0.02,1.75,0.7,'#8f6236',R_-0.52,0.95,1.5),bx(0.02,1.75,0.7,'#8f6236',R_-0.52,0.95,2.3));
  // outside view through louvres: bright sky + trees
  const ov=new THREE.Mesh(new THREE.PlaneGeometry(14,4),new THREE.MeshBasicMaterial({color:'#f3e3bd'}));ov.rotation.y=Math.PI/2;ov.position.set(-hw-2.6,2.0,1.5);sc.add(ov);
  [[-3,1.9],[0.5,2.3],[3.6,1.8],[6.4,2.2]].forEach(([z,s])=>{const t=new THREE.Mesh(new THREE.IcosahedronGeometry(s*0.6,1),L(PAL.leaf2));t.position.set(-hw-1.8,2.3+s*0.3,z);sc.add(t);});
  // bags hanging on chairs, textbooks, bin, broom
  sc.add(cy(0.18,0.15,0.4,'#55745c',5.3,0.2,-2.0,12),cy(0.02,0.02,1.3,'#8a6243',5.5,0.7,-1.4,6),bx(0.3,0.12,0.06,'#c9a064',5.5,0.08,-1.4));}
 // desks + classmates
 const COLS=[-4.2,-2.1,0,2.1,4.2],ROWS=[-2.4,-0.8,0.8,2.4],AISLES=[-3.15,-1.05,1.05,3.15];
 const deskTop=new Batch(new THREE.BoxGeometry(1.35,0.07,0.62),L('#c08a52')),deskFr=new Batch(new THREE.BoxGeometry(1.3,0.42,0.05),L('#8f6236')),leg=new Batch(new THREE.BoxGeometry(0.06,0.74,0.06),L('#5a3a22')),seatB=new Batch(new THREE.BoxGeometry(0.5,0.06,0.45),L('#a0703f')),backB=new Batch(new THREE.BoxGeometry(0.5,0.48,0.05),L('#a0703f'));
 const SK=['#5c3520','#7a4a2e','#86553a','#6b3f26'],HR=['short','braids','afro','bun','short','puffs','short','braids'];
 const kids=[];let seat=null;
 ROWS.forEach((z,r)=>COLS.forEach((x,c)=>{deskTop.add(x,0.76,z);deskFr.add(x,0.53,z-0.28);[-0.6,0.6].forEach(dx=>leg.add(x+dx,0.37,z+0.25));seatB.add(x,0.42,z+0.68);backB.add(x,0.68,z+0.92);
  if(r===3&&c===1){seat={x,z:z+0.62,dz:z};return;}
  const h=HR[(r*5+c)%8];const o=makePerson({skin:SK[(r+c)%4],shirt:'#f4eedb',bottom:'#22345e',hair:h,skirt:['braids','bun','puffs'].includes(h)?1:0,glasses:(r*3+c)%7===0?1:0});o.position.set(x,0,z+0.62);o.rotation.y=Math.PI;o.userData.chatSide=c<2?-1:1;sc.add(o);
  const nb=bx(0.34,0.015,0.24,PAL.white,x+0.15,0.805,z+0.05);nb.visible=false;sc.add(nb);kids.push({o,x,z:z+0.62,nb,act:'listen',t:Math.random()*6,gamer:(r*5+c)%4===0});}));
 [deskTop,deskFr,leg,seatB,backB].forEach(b=>b.flush(sc));
 {const BG=['#a8553f','#4f6e8a','#55745c','#e3a347','#4a3340'];ROWS.forEach((z,r)=>COLS.forEach((x,c)=>{if((r*5+c)%3===0)sc.add(bx(0.32,0.4,0.16,BG[(r+c)%5],x+0.28,0.5,z+1.02));if((r*5+c)%2===0)sc.add(bx(0.22,0.05,0.3,BG[(r*2+c)%5],x-0.35,0.82,z-0.1),bx(0.2,0.04,0.28,'#f2e6cc',x-0.35,0.86,z-0.1));}));}
 // player
 let me=null;const cards=new THREE.Group();[-0.12,-0.04,0.04,0.12].forEach((dx,k)=>{const c=bx(0.11,0.012,0.16,PAL.white,dx,0,0);c.rotation.y=(k-1.5)*0.25;cards.add(c);});cards.add(bx(0.1,0.02,0.14,'#a8323a',0.05,0.005,-0.16));cards.position.set(seat.x+0.05,0.81,seat.dz+0.1);sc.add(cards);
 const myNotes=bx(0.34,0.015,0.24,PAL.white,seat.x-0.15,0.805,seat.dz+0.05);sc.add(myNotes);
 // teacher
 const teacher=makePerson({skin:'#5c3520',shirt:'#cfe3ef',bottom:'#4a4d55',hair:'short',adult:1,glasses:1});sc.add(teacher);
 const bang=new THREE.Sprite(new THREE.SpriteMaterial({map:ct(64,64,g=>{g.fillStyle='#a8553f';g.beginPath();g.arc(32,32,30,0,7);g.fill();g.fillStyle='#fff';g.font='bold 44px sans-serif';g.textAlign='center';g.fillText('!',32,48);}),depthTest:false}));bang.scale.set(0.4,0.4,1);bang.position.y=2.35;bang.visible=false;teacher.add(bang);
 const T={x:0,z:-3.9,ry:Math.PI,state:'board',t:4,path:[]};let diff=1;
 const cam=new THREE.PerspectiveCamera(50,1,0.05,60);let hideK=0,lesson=false;
 function start(look,isLesson,away){if(me)sc.remove(me);me=makePerson(look);me.position.set(seat.x,0,seat.z);me.rotation.y=Math.PI;sc.add(me);lesson=isLesson;teacher.visible=!away;awayT=!!away;
  lines=LESSONS[Math.floor(Math.random()*LESSONS.length)];prog=0;drawn=-1;lessonCtl=null;drawBoard();Object.assign(T,{x:0,z:-3.9,ry:Math.PI,state:'board',t:5,path:[]});diff=1;bang.visible=false;}
 const face=(tgt,dt,k=6)=>{const df=((tgt-T.ry+Math.PI*3)%(Math.PI*2))-Math.PI;T.ry+=df*Math.min(1,dt*k);};
 function sees(x,z){if(T.state==='board'&&!T.path.length)return false;const dx=x-T.x,dz=z-T.z,d=Math.hypot(dx,dz);if(d<1.4)return true;if(d>11)return false;return(dx*Math.sin(T.ry)+dz*Math.cos(T.ry))/d>0.72;}
 let lessonCtl=null,progT=0;
 function lessonBeat(kind,ls,n){if(ls!==lines){lines=ls;prog=0;drawn=-1;}const tot=ls.join('').length||1;progT=ls.slice(0,n).join('').length/tot;if(!lessonCtl||lessonCtl.kind!==kind){const inAisle=T.z>-2.6;const back=inAisle?[[T.x,-3.3]]:[];
  T.path=kind==='write'?[...back,[0.4,-3.9]]:kind==='tell'?[...back,[0,-2.95]]:[...(inAisle?[]:[[-1.05,-3.3]]),[-1.05,seat.z-0.35]];}lessonCtl={kind};}
 function lessonAI(dt,t){const K=lessonCtl.kind;if(T.path.length){const [tx,tz]=T.path[0];const dx=tx-T.x,dz=tz-T.z,d=Math.hypot(dx,dz),m=1.6*dt;if(d>0.01)face(Math.atan2(dx,dz),dt,8);if(d<=m){T.x=tx;T.z=tz;T.path.shift();}else{T.x+=dx/d*m;T.z+=dz/d*m;}}
  else if(K==='write'){face(Math.PI,dt,6);prog=Math.min(progT,prog+dt*0.12);}else if(K==='tell')face(Math.sin(t*0.7)*0.4,dt,3);else face(Math.atan2(seat.x-T.x,seat.z-T.z),dt,5);
  if(prog>progT)prog=progT;teacher.position.set(T.x,0,T.z);teacher.rotation.y=T.ry;poseUpdate(teacher,dt,T.path.length>0);const u=teacher.userData;
  if(!T.path.length){if(K==='write'){u.arms[1].rotation.x=-2.3+Math.sin(t*9)*0.12;u.arms[1].rotation.z=0.25;}
   else{u.upper.rotation.x=K==='whisper'?0.38:0.12+Math.sin(t*2)*0.05;u.arms[0].rotation.x=-0.7+Math.sin(t*4.3)*0.35;u.arms[1].rotation.x=-1.0+Math.cos(t*3.7)*0.5;u.arms[0].rotation.z=0.3;u.arms[1].rotation.z=-0.3;if(u.elbows){u.elbows[0].rotation.x=-1.0+Math.sin(t*3)*0.2;u.elbows[1].rotation.x=-1.2+Math.sin(t*5)*0.35;}
    u.head.rotation.y=K==='whisper'?0:Math.sin(t*1.3)*0.3;u.head.rotation.x=K==='whisper'?0.3:Math.sin(t*3)*0.07;}}}
 let awayT=false;function tAI(dt,t){if(awayT){T.x=0;T.z=-20;teacher.position.set(0,0,-20);return;}if(lesson&&lessonCtl)return lessonAI(dt,t);const atBoard=T.state==='board'&&!T.path.length;if(T.state!=='walk'&&T.state!=='scold'&&(T.state!=='board'||atBoard))T.t-=dt;
  if(T.state==='board'){if(atBoard){face(T.t<0.9?Math.PI-0.6:Math.PI,dt,T.t<0.9?3:6);prog=Math.min(1,prog+dt*0.035);}if(T.t<=0){T.state='scan';T.t=1.4+Math.random()*2.2;}}
  else if(T.state==='scan'){face(Math.sin(t*0.9)*0.5,dt,4);if(T.t<=0){const r=Math.random();
   if(r<0.5){T.state='board';T.t=(3.2+Math.random()*4.5)/diff;T.path=[[-1.6+Math.random()*3.2,-3.9]];if(prog>=1){prog=0;drawn=-1;lines=LESSONS[Math.floor(Math.random()*LESSONS.length)];}}
   else if(r<0.85){const a=AISLES[Math.floor(Math.random()*4)];T.state='walk';T.path=[[a,-3.3],[a,2.9],[a,-3.3],[-1+Math.random()*2,-3.9]];}else T.t=1.4;}}
  else if(T.state==='walk'){if(!T.path.length){T.state='scan';T.t=1.2;}}
  else if(T.state==='scold'){if(!T.path.length){face(Math.atan2(seat.x-T.x,seat.z-T.z),dt,8);T.t-=dt;bang.visible=true;if(T.t<=0){bang.visible=false;T.state='walk';T.path=[[-1.05,-3.3],[0,-3.9]];}}}
  if(T.path.length){const [tx,tz]=T.path[0];const dx=tx-T.x,dz=tz-T.z,d=Math.hypot(dx,dz),m=(T.state==='scold'?2.2:1.15)*dt*Math.pow(diff,0.4);if(d>0.01)face(Math.atan2(dx,dz),dt,8);if(d<=m){T.x=tx;T.z=tz;T.path.shift();}else{T.x+=dx/d*m;T.z+=dz/d*m;}}
  teacher.position.set(T.x,0,T.z);teacher.rotation.y=T.ry;poseUpdate(teacher,dt,T.path.length>0);
  if(atBoard){const a=teacher.userData.arms[1];a.rotation.x=-2.3+Math.sin(t*9)*0.12;a.rotation.z=0.25;}}
 function scold(){T.state='scold';T.t=3;T.path=[[-1.05,Math.min(T.z,2)],[-1.05,seat.z-0.3]];}
 let st={seen:false,warn:false,state:'board'};
 function update(dt,t,o){diff=Math.min(2.2,diff+dt*0.008);tAI(dt,t);drawBoard();fans.forEach(f=>f.rotation.y+=dt*6);
  const pa=dust.geometry.attributes.position;for(let k=0;k<dustN;k++){pa.array[k*3+1]+=Math.sin(t*0.5+k)*0.0015;pa.array[k*3]+=0.002;if(pa.array[k*3]>0)pa.array[k*3]=-5.5;}pa.needsUpdate=true;
  kids.forEach(k=>{k.t-=dt;if(k.t<=0){k.act=k.gamer?(Math.random()<0.6?'cards':'listen'):['listen','listen','notes','notes','chat','sleep'][Math.floor(Math.random()*6)];k.t=4+Math.random()*7;}
   if((k.act==='cards'||k.act==='chat'||k.act==='sleep')&&sees(k.x,k.z)&&T.state!=='board'){k.act='listen';k.t=5;}
   if(lesson&&lessonCtl&&lessonCtl.kind!=='write'&&k.act!=='sleep')k.act='listen';poseUpdate(k.o,dt,false,k.act);k.nb.visible=k.act==='notes';
    if(k.act==='listen'){const a=Math.atan2(T.x-k.x,T.z-k.z)-Math.PI;const rel=((a+Math.PI*3)%(Math.PI*2))-Math.PI;k.o.userData.head.rotation.y=Math.max(-0.9,Math.min(0.9,rel));}});
  const playing=o.playing&&!o.hidden;poseUpdate(me,dt,false,lesson?'notes':playing?'cards':'listen');cards.visible=playing;myNotes.visible=lesson;
  const seen=sees(seat.x,seat.z);const warn=T.state==='board'&&!T.path.length&&T.t<0.9;st={seen,warn,state:T.state==='board'&&T.path.length?'walk':T.state};
  hideK+=((o.hidden?1:0)-hideK)*Math.min(1,dt*8);
  cam.position.set(seat.x+0.6+Math.sin(t*0.6)*0.02,1.95-0.3*hideK+Math.sin(t*1.1)*0.01,seat.z+1.3);
  const look=new THREE.Vector3(0.3,1.75,-5).lerp(new THREE.Vector3(seat.x,0.6,seat.dz-0.4),hideK*0.7);cam.lookAt(look);}
 return{scene:sc,camera:cam,start,update,scold,lessonBeat,status:()=>awayT?{seen:false,warn:false,state:'away'}:st};}
