import * as THREE from 'three';
import {PAL,L,bx,cy,Batch} from './look.js';
import {makePerson,poseUpdate,label} from '../common.js';
const PW=52.5,PH=34,GW=3.66,GH=2.44,BR=0.2,GR=9.8;
const RED='#c0563f',BLUE='#4f6e8a';
const FORM=[[-49,0],[-37,-20],[-39,-7],[-39,7],[-37,20],[-21,-22],[-23,-7],[-23,7],[-21,22],[-7,-6],[-7,6]];
const NAMES=[['Obi','Bello','Okafor','Musa','Adeyemi','Eze','Chidi','Tunde','Yusuf','Emeka','You'],['Ade','Ibrahim','Nwosu','Lawal','Okon','Danjuma','Bayo','Uche','Sani','Kelechi','Femi']];
const SK=['#5c3520','#7a4a2e','#86553a','#6b3f26'],HR=['short','afro','short','short','afro','braids'];
const sg=ti=>ti===0?1:-1,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),angL=(a,b,k)=>a+(((b-a+Math.PI*3)%(Math.PI*2))-Math.PI)*Math.min(1,k);
const ct=(w,h,f)=>{const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;};
function mkAudio(){let ac;try{ac=new (window.AudioContext||window.webkitAudioContext)();}catch(e){const n=()=>{};return{set:n,swell:n,whistle:n,kick:n,stop:n};}
 const len=ac.sampleRate*2,buf=ac.createBuffer(1,len,ac.sampleRate),d=buf.getChannelData(0);let last=0;for(let i=0;i<len;i++){last=(last+0.02*(Math.random()*2-1))/1.02;d[i]=last*3.5;}
 const src=ac.createBufferSource();src.buffer=buf;src.loop=true;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=900;const g=ac.createGain();g.gain.value=0;src.connect(lp);lp.connect(g);g.connect(ac.destination);src.start();let base=0;
 return{set(v){base=v;g.gain.setTargetAtTime(v,ac.currentTime,0.5);},swell(v=0.3,t=2.5){g.gain.cancelScheduledValues(ac.currentTime);g.gain.setTargetAtTime(v,ac.currentTime,0.08);g.gain.setTargetAtTime(base,ac.currentTime+t,0.8);},
  whistle(n=1){if(ac.state==='suspended')ac.resume();for(let k=0;k<n;k++){const o=ac.createOscillator(),gg=ac.createGain(),l=ac.createOscillator(),lg=ac.createGain();o.frequency.value=2650;l.frequency.value=28;lg.gain.value=90;l.connect(lg);lg.connect(o.frequency);o.connect(gg);gg.connect(ac.destination);const t0=ac.currentTime+k*0.35,e=k===n-1?0.55:0.25;gg.gain.setValueAtTime(0,t0);gg.gain.linearRampToValueAtTime(0.045,t0+0.02);gg.gain.setValueAtTime(0.045,t0+e);gg.gain.linearRampToValueAtTime(0,t0+e+0.06);o.start(t0);l.start(t0);o.stop(t0+0.7);l.stop(t0+0.7);}},
  kick(p=1){const o=ac.createOscillator(),gg=ac.createGain();o.frequency.setValueAtTime(170,ac.currentTime);o.frequency.exponentialRampToValueAtTime(50,ac.currentTime+0.12);gg.gain.setValueAtTime(0.1*p,ac.currentTime);gg.gain.exponentialRampToValueAtTime(0.0001,ac.currentTime+0.15);o.connect(gg);gg.connect(ac.destination);o.start();o.stop(ac.currentTime+0.16);},
  stop(){g.gain.setTargetAtTime(0,ac.currentTime,0.3);base=0;}};}
const CSS=`.so-hud{position:absolute;inset:0;pointer-events:none;z-index:6;font-family:'Atkinson Hyperlegible',sans-serif;color:#3a2a30;}
.so-hud .card{pointer-events:auto;}
.so-score{position:absolute;top:10px;left:10px;display:flex;align-items:stretch;overflow:hidden;padding:0 !important;}
.so-score span{display:flex;align-items:center;padding:6px 10px;font-weight:700;font-size:15px;}
.so-tick{position:absolute;left:50%;top:58px;transform:translateX(-50%);padding:6px 16px;font-family:'Patrick Hand',cursive;font-size:21px;max-width:calc(100% - 220px);text-align:center;transition:opacity .3s;}
.so-mini{position:absolute;right:10px;top:54px;padding:4px !important;}
.so-hint{display:none !important;}
.so-pow{position:absolute;left:50%;bottom:150px;transform:translateX(-50%);width:220px;height:14px;border:2.5px solid #3a2a30;border-radius:8px;background:#fff;overflow:hidden;}
.so-pow>div{height:100%;background:linear-gradient(90deg,#55745c,#e3a347 70%,#a8553f);}
.so-tag{position:absolute;top:12px;left:50%;transform:translateX(-50%);padding:4px 16px;font-family:'Patrick Hand',cursive;font-size:24px;background:#a8553f !important;color:#fff;}
.so-top{position:absolute;top:10px;right:10px;display:flex;gap:6px;}
.so-joy{position:absolute;left:calc(18px + env(safe-area-inset-left));bottom:calc(18px + env(safe-area-inset-bottom));width:150px;height:150px;border-radius:50%;background:radial-gradient(circle,rgba(245,234,211,0.18),rgba(245,234,211,0.42));border:2.5px solid rgba(58,42,48,0.6);pointer-events:auto;touch-action:none;}
.so-joy::before{content:'';position:absolute;inset:22px;border-radius:50%;border:1.5px dashed rgba(58,42,48,0.35);}
.so-joy div{position:absolute;left:50%;top:50%;width:62px;height:62px;margin:-31px 0 0 -31px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fffaf0,#e9dcc0);border:2.5px solid #3a2a30;box-shadow:0 4px 0 #3a2a30;}
.so-btns{position:absolute;right:calc(14px + env(safe-area-inset-right));bottom:calc(14px + env(safe-area-inset-bottom));width:276px;height:186px;pointer-events:auto;transform-origin:bottom right;}
.so-btns button{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;border-radius:50%;border:2.5px solid #3a2a30;background:rgba(245,234,211,0.92);font-family:'Atkinson Hyperlegible',sans-serif;font-weight:700;font-size:9px;letter-spacing:.06em;color:#3a2a30;box-shadow:0 4px 0 #3a2a30;touch-action:none;padding:0;cursor:pointer;}
.so-btns button svg{width:44%;height:44%;}
.so-btns button.on{transform:translateY(3px);box-shadow:0 1px 0 #3a2a30;filter:brightness(0.92);}
.so-btns button.k{background:#a8553f;color:#fff}.so-btns button.p{background:#e3a347}.so-btns button.s{background:#55745c;color:#fff}
@media (max-width:560px),(max-height:420px){.so-btns{transform:scale(0.8)}.so-joy{transform:scale(0.85);transform-origin:bottom left}}
@media (max-height:520px){.so-mini{transform:scale(0.75);transform-origin:top right;top:46px}.so-tick{top:48px;font-size:17px;max-width:calc(100% - 200px)}.so-score span{font-size:13px;padding:4px 8px}.so-top .btn{font-size:13px !important;padding:2px 8px !important}}
@media (max-height:380px){.so-btns{transform:scale(0.68)}.so-joy{transform:scale(0.72)}}`;
const IC={shoot:'<circle cx="15" cy="12" r="6"/><path d="M2 9h6M3 13h5M4 17h5"/>',pass:'<path d="M3 12h15M13 6l6 6-6 6"/>',thru:'<path d="M4 6l6 6-6 6M12 6l6 6-6 6"/>',lob:'<path d="M3 18C6 6 16 6 19 15"/><path d="M15 15h5v-5"/>',switch:'<path d="M4 9a8 8 0 0 1 14-3l2 2M20 15a8 8 0 0 1-14 3l-2-2"/><path d="M20 3v5h-5M4 21v-5h5"/>',sprint:'<path d="M13 2L5 13h6l-1 9 8-12h-6z"/>',left:'<path d="M15 5l-7 7 7 7"/>',right:'<path d="M9 5l7 7-7 7"/>',up:'<circle cx="12" cy="12" r="4"/>',kick:'<circle cx="12" cy="10" r="6"/><path d="M8 20h8"/>'};
const LAY={shoot:[8,86,88],pass:[104,10,88],thru:[14,2,66],lob:[202,6,62],switch:[116,114,60],sprint:[206,90,64]};
export function createSoccer(h){
 const sc=new THREE.Scene();sc.background=new THREE.Color('#dcc39c');sc.fog=new THREE.Fog('#dcc39c',130,300);
 sc.add(new THREE.HemisphereLight('#f6e8d2','#5a4450',1.1));
 const sun=new THREE.DirectionalLight('#ffe0b0',2.7);sun.position.set(-45,70,40);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-70,right:70,top:55,bottom:-55,near:1,far:220});sun.shadow.bias=-0.0004;sun.shadow.normalBias=0.04;sc.add(sun,sun.target);
 const camera=new THREE.PerspectiveCamera(34,1,0.5,600);
 // ---------- stadium ----------
 const g0=new THREE.Mesh(new THREE.PlaneGeometry(500,500),L('#6a8a52'));g0.rotation.x=-Math.PI/2;g0.position.y=-0.02;g0.receiveShadow=true;sc.add(g0);
 const ap=new THREE.Mesh(new THREE.PlaneGeometry(2*PW+10,2*PH+10),L('#678a4e'));ap.rotation.x=-Math.PI/2;ap.receiveShadow=true;sc.add(ap);
 for(let k=0;k<14;k++){const s=new THREE.Mesh(new THREE.PlaneGeometry(7.5,2*PH),L(k%2?'#6f9152':'#7b9d5b'));s.rotation.x=-Math.PI/2;s.position.set(-PW+3.75+k*7.5,0.01,0);s.receiveShadow=true;sc.add(s);}
 const LN=new Batch(new THREE.BoxGeometry(1,0.02,1),L('#f2e6cc'),false);const ln=(x0,z0,x1,z1,w=0.12)=>LN.add((x0+x1)/2,0.03,(z0+z1)/2,Math.abs(x1-x0)+w,1,Math.abs(z1-z0)+w);
 ln(-PW,-PH,PW,-PH);ln(-PW,PH,PW,PH);ln(-PW,-PH,-PW,PH);ln(PW,-PH,PW,PH);ln(0,-PH,0,PH);
 [1,-1].forEach(s=>{ln(s*(PW-16.5),-20.16,s*(PW-16.5),20.16);ln(s*PW,-20.16,s*(PW-16.5),-20.16);ln(s*PW,20.16,s*(PW-16.5),20.16);ln(s*(PW-5.5),-9.16,s*(PW-5.5),9.16);ln(s*PW,-9.16,s*(PW-5.5),-9.16);ln(s*PW,9.16,s*(PW-5.5),9.16);});
 LN.flush(sc,'SM_Pitch_Lines');
 const lm=L('#f2e6cc');const ring=(r,x,z,a0=0,al=Math.PI*2)=>{const m=new THREE.Mesh(new THREE.RingGeometry(r-0.06,r+0.06,64,1,a0,al),lm);m.rotation.x=-Math.PI/2;m.position.set(x,0.035,z);sc.add(m);};
 ring(9.15,0,0);ring(0.18,0,0);[1,-1].forEach(s=>{ring(0.18,s*(PW-11),0);const a=Math.acos(5.5/9.15);ring(9.15,s*(PW-11),0,s>0?Math.PI-a:-a,2*a);});
 [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([a,b])=>{const st=a>0?(b>0?Math.PI:Math.PI/2):(b>0?-Math.PI/2:0);ring(1,a*PW,b*PH,st,Math.PI/2);const f=cy(0.03,0.03,1.5,'#f2e6cc',a*PW,0.75,b*PH,6);sc.add(f);sc.add(bx(0.02,0.35,0.45,a>0?BLUE:RED,a*PW,1.35,b*PH+0.24*-b));});
 const netT=ct(256,128,(g,w,h)=>{g.strokeStyle='rgba(255,255,255,0.85)';g.lineWidth=2;for(let x=0;x<=w;x+=12){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}for(let y=0;y<=h;y+=12){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}});netT.wrapS=netT.wrapT=THREE.RepeatWrapping;
 const netM=new THREE.MeshBasicMaterial({map:netT,transparent:true,side:THREE.DoubleSide,depthWrite:false});const nets={};
 [1,-1].forEach(s=>{const gx=s*PW,pm=L('#ffffff');[-GW,GW].forEach(z=>sc.add(cy(0.07,0.07,GH,pm,gx,GH/2,z,10)));const cb=cy(0.07,0.07,2*GW,pm,gx,GH,0,10);cb.rotation.x=Math.PI/2;sc.add(cb);
  [-GW,GW].forEach(z=>{const p=cy(0.04,0.04,1.2,pm,gx+s*2,0.6,z,6);sc.add(p);});
  const back=new THREE.Mesh(new THREE.PlaneGeometry(2*GW,1.3,8,4),netM);back.rotation.y=Math.PI/2;back.position.set(gx+s*2,0.65,0);sc.add(back);
  const top=new THREE.Mesh(new THREE.PlaneGeometry(2.2,2*GW),netM);top.rotation.x=Math.PI/2;top.rotation.y=s*0.5;top.position.set(gx+s*1.0,GH-0.55,0);sc.add(top);
  [-GW,GW].forEach(z=>{const sd=new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0,0),new THREE.Vector2(0,GH),new THREE.Vector2(s*2,1.3),new THREE.Vector2(s*2,0)])),netM);sd.position.set(gx,0,z);sc.add(sd);});nets[s]={back,t:0};});
 // ad boards
 const ADS=[['UNITY SECONDARY SCHOOL','#3a2a30','#ecdcbc'],["MAMA TITI'S CANTEEN",'#e3a347','#3a2a30'],['ZOBO · COLD · ₦15','#a8323a','#fff'],['INTER-HOUSE CUP 2026','#55745c','#fff'],['GRACE BOOKSHOP','#4f6e8a','#fff'],['CHOP & SMILE EATERY','#c0563f','#fff']].map(([t,b,f])=>ct(512,64,(g,w,h)=>{g.fillStyle=b;g.fillRect(0,0,w,h);g.fillStyle=f;g.font='700 34px "Atkinson Hyperlegible",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(t,w/2,34);}));
 const adM=ADS.map(t=>new THREE.MeshLambertMaterial({map:t}));let adI=0;
 for(let x=-55;x<55;x+=10){[-1,1].forEach(s=>{const m=new THREE.Mesh(new THREE.BoxGeometry(9.8,0.9,0.12),adM[(adI++)%6]);m.position.set(x+5,0.45,s*(PH+3.2));m.castShadow=true;sc.add(m);});}
 [-1,1].forEach(s=>{for(let z=-20;z<20;z+=10){const m=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.9,9.8),adM[(adI++)%6]);m.position.set(s*(PW+5),0.45,z+5);m.castShadow=true;sc.add(m);}});
 // stands + crowd
 const crowdCols=[RED,RED,BLUE,BLUE,PAL.ochre,PAL.cream,'#f4eedb',PAL.sage,'#e9c35a'];const CB=new Batch(new THREE.BoxGeometry(0.42,0.55,0.34),new THREE.MeshLambertMaterial({color:'#ffffff'})),CH=new Batch(new THREE.SphereGeometry(0.15,8,6),new THREE.MeshLambertMaterial({color:'#ffffff'}));
 function stand(cx,cz,len,rot,tiers){const g=new THREE.Group();g.position.set(cx,0,cz);g.rotation.y=rot;for(let k=0;k<tiers;k++){g.add(bx(len,0.7*(k+1),1.5,k%2?PAL.cream:PAL.creamD,0,0.35*(k+1),-k*1.5));}g.add(bx(len+1,0.25,tiers*1.5+1,PAL.plum,0,0.7*tiers+3.2,-(tiers-1)*0.75-0.3));
  for(let x=-len/2+1;x<len/2-1;x+=2.5*1)g.add(cy(0.06,0.06,3.2,PAL.fence,x*1,0.7*tiers+1.6,-(tiers-1)*1.5-0.6,6));sc.add(g);g.updateMatrixWorld(true);
  for(let k=0;k<tiers;k++)for(let x=-len/2+0.5;x<len/2-0.4;x+=0.62){if(Math.random()<0.12)continue;const v=new THREE.Vector3(x+(Math.random()-0.5)*0.15,0.7*(k+1)+0.28,-k*1.5+0.1).applyMatrix4(g.matrixWorld);const col=crowdCols[Math.floor(Math.random()*crowdCols.length)];CB.add(v.x,v.y,v.z,1,1,1,rot,col);CH.add(v.x,v.y+0.42,v.z,1,1,1,0,SK[Math.floor(Math.random()*4)]);}}
 stand(0,-(PH+6),96,0,6);stand(-(PW+9),0,50,Math.PI/2,4);stand(PW+9,0,50,-Math.PI/2,4);stand(-30,PH+7,30,Math.PI,3);stand(30,PH+7,30,Math.PI,3);
 const crowdB=CB.flush(sc,'SM_Crowd'),crowdH=CH.flush(sc,'SM_Crowd_Heads');const baseB=CB.m.map(m=>m.clone()),baseH=CH.m.map(m=>m.clone());const phase=baseB.map(()=>Math.random()*6.28);
 // dugouts
 [-9,9].forEach(x=>{sc.add(bx(7,0.12,2.2,PAL.plum,x,2.3,PH+4.6),bx(7,2.3,0.12,PAL.cream,x,1.15,PH+5.6),bx(6.6,0.08,0.5,PAL.trunk,x,0.5,PH+5.2));[-3.4,3.4].forEach(dx=>sc.add(bx(0.12,2.3,2.2,PAL.cream,x+dx,1.15,PH+4.6)));});
 // school buildings + trees + floodlights
 const BL=[[PAL.ochre,PAL.ochreD],[PAL.sage,PAL.sageD],[PAL.cream,PAL.creamD],[PAL.brick,PAL.brickD]];const WN=new Batch(new THREE.BoxGeometry(1,1,0.1),L(PAL.glass));
 for(let x=-110;x<=110;x+=22){const [c,d]=BL[Math.abs(x/22)%4],f=2+Math.abs(x/22)%3,H=f*3.2;sc.add(bx(18,H,10,c,x,H/2,-78),bx(18.3,0.6,10.3,d,x,H+0.3,-78));for(let q=0;q<f;q++)for(let w=-7.5;w<8;w+=2)WN.add(x+w,q*3.2+1.8,-72.9,0.9,1.2,1);}
 WN.flush(sc);
 const TT=new Batch(new THREE.CylinderGeometry(0.25,0.4,1,6),L(PAL.trunk)),TL=new Batch(new THREE.IcosahedronGeometry(1,1),L(PAL.leaf));
 for(let k=0;k<90;k++){const a=k/90*Math.PI*2,r=96+Math.random()*25;const x=Math.cos(a)*r*1.25,z=Math.sin(a)*r*0.9;if(z<-70&&Math.abs(x)<120)continue;const s=1.6+Math.random()*1.4;TT.add(x,2*s,z,s,4*s,s);TL.add(x,4.6*s,z,2.4*s,1.8*s,2.4*s,Math.random()*3,[PAL.leaf,PAL.leaf2,PAL.leaf3][k%3]);}
 TT.flush(sc);TL.flush(sc);
 [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([a,b])=>{const x=a*(PW+14),z=b*(PH+12);sc.add(cy(0.35,0.5,26,PAL.fence,x,13,z,8));const pn=bx(5,2.6,0.5,PAL.fence,x,26.5,z);pn.lookAt(0,0,0);sc.add(pn);const lt=bx(4.6,2.2,0.1,'#fff5d8',x,26.5,z);lt.material=new THREE.MeshBasicMaterial({color:'#fff5d8'});lt.lookAt(0,0,0);lt.translateZ(0.3);sc.add(lt);});
 // ball
 const ballT=ct(256,128,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);g.fillStyle='#2a2526';for(let k=0;k<10;k++){const x=(k%5)*52+(k>4?26:0)+10,y=k>4?88:30;g.beginPath();for(let a=0;a<5;a++){const r=a*Math.PI*2/5;g.lineTo(x+Math.cos(r)*13,y+Math.sin(r)*13);}g.fill();}});
 const ballM=new THREE.Mesh(new THREE.SphereGeometry(BR,20,14),new THREE.MeshLambertMaterial({map:ballT}));ballM.castShadow=true;sc.add(ballM);
 const ball={p:new THREE.Vector3(0,BR,0),v:new THREE.Vector3()};
 const ctlRing=new THREE.Mesh(new THREE.RingGeometry(0.55,0.75,28),new THREE.MeshBasicMaterial({color:'#f0c24a',transparent:true,opacity:0.95,side:THREE.DoubleSide,depthWrite:false}));ctlRing.rotation.x=-Math.PI/2;ctlRing.position.y=0.06;sc.add(ctlRing);
 const aimRing=new THREE.Mesh(new THREE.RingGeometry(0.22,0.32,24),new THREE.MeshBasicMaterial({color:'#f0c24a',side:THREE.DoubleSide,depthTest:false}));aimRing.rotation.y=Math.PI/2;aimRing.renderOrder=20;aimRing.visible=false;sc.add(aimRing);
 // ---------- players ----------
 const T=[[],[]];
 for(let ti=0;ti<2;ti++)for(let i=0;i<11;i++){const gk=i===0;const look={skin:SK[(i*3+ti)%4],shirt:gk?(ti?PAL.sage:PAL.ochre):(ti?BLUE:RED),bottom:ti?'#22345e':'#f4eedb',hair:HR[(i+ti*3)%6],casual:1};
  const o=makePerson(look);sc.add(o);const lb=label((i===10&&ti===0?'YOU':NAMES[ti][i]),ti?BLUE:RED);lb.position.y=2.3;lb.scale.set(1.9,0.38,1);lb.visible=false;o.add(lb);
  T[ti].push({ti,i,gk,o,lb,x:0,z:0,vx:0,vz:0,tvx:0,tvz:0,ry:0,sta:1,kickCd:0,tackCd:0,slide:0,think:0,dd:[1,0],name:NAMES[ti][i],diveT:0,diveDir:0});}
 const ALL=[...T[0],...T[1]];
 // ---------- HUD ----------
 if(!document.getElementById('so-css')){const st=document.createElement('style');st.id='so-css';st.textContent=CSS;document.head.appendChild(st);}
 const hud=document.createElement('div');hud.className='so-hud';hud.style.display='none';
 hud.innerHTML=`<div class="card so-score" id="soScore"></div><div class="so-top"><button class="btn" id="soCam" style="font-size:15px;padding:3px 10px;">Camera (C)</button><button class="btn" id="soPause" style="font-size:15px;padding:3px 10px;">Pause (P)</button></div>
 <div class="card so-tick" id="soTick" style="opacity:0"></div><div class="card so-tag" id="soTag" style="display:none">REPLAY</div><div class="so-pow" id="soPow" style="display:none"><div style="width:0%"></div></div>
 <div class="card so-mini"><canvas id="soMini" width="168" height="110" style="display:block;"></canvas></div><div class="card so-hint" id="soHint"></div>
 <div class="so-joy" id="soJoy"><div></div></div><div class="so-btns" id="soBtns"></div>`;
 document.getElementById('root').appendChild(hud);const $=id=>hud.querySelector('#'+id);const mini=$('soMini').getContext('2d');
 let audio=null;let tickT=0;function say(t){const e=$('soTick');e.textContent=t;e.style.opacity=1;tickT=3.2;}
 // ---------- input ----------
 const K={};const inp={x:0,z:0,sprint:false,passHeld:false,charging:false};let joy=[0,0];
 const actions=[];
 function keyDown(e){if(!S)return;const c=e.code;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(c))e.preventDefault();if(e.repeat)return;K[c]=true;
  if(c==='KeyP'||c==='Escape')return pause();if(c==='KeyC')return cycleCam();if(S.paused)return;
  if(S.kind==='match'){if(c==='KeyJ'||c==='Space'){inp.passHeld=true;actions.push('pass');}if(c==='KeyL')actions.push('through');if(c==='KeyI')actions.push('lob');if(c==='KeyQ'||c==='KeyE')actions.push('switch');if(c==='KeyK')actions.push('shootDown');}
  else modeKey(c,true);}
 function keyUp(e){if(!S)return;const c=e.code;K[c]=false;if(S.kind==='match'){if(c==='KeyJ'||c==='Space')inp.passHeld=false;if(c==='KeyK')actions.push('shootUp');}else modeKey(c,false);}
 addEventListener('keydown',keyDown);addEventListener('keyup',keyUp);
 {const j=$('soJoy'),k=j.firstChild;let id=null;const mv=e=>{const r=j.getBoundingClientRect();let dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2;const l=Math.hypot(dx,dy),m=r.width*0.34;if(l>m){dx*=m/l;dy*=m/l;}k.style.transform=`translate(${dx}px,${dy}px)`;joy=[dx/m,dy/m];};
  j.addEventListener('pointerdown',e=>{id=e.pointerId;j.setPointerCapture(id);mv(e);});j.addEventListener('pointermove',e=>{if(e.pointerId===id)mv(e);});const end=()=>{id=null;joy=[0,0];k.style.transform='';};j.addEventListener('pointerup',end);j.addEventListener('pointercancel',end);}
 function setButtons(list,lay){const b=$('soBtns');b.innerHTML=list.map(([id,t,c],i)=>{const L_=(lay||LAY)[id]||[8+i*92,8,80];return `<button data-b="${id}" class="${c||''}" style="right:${L_[0]}px;bottom:${L_[1]}px;width:${L_[2]}px;height:${L_[2]}px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${IC[id]||''}</svg><span>${t}</span></button>`;}).join('');
  b.querySelectorAll('button').forEach(el=>{const id=el.dataset.b;el.onpointerdown=e=>{e.preventDefault();el.setPointerCapture(e.pointerId);el.classList.add('on');btn(id,true);};el.onpointerup=el.onpointercancel=()=>{el.classList.remove('on');btn(id,false);};});}
 function btn(id,down){if(!S||S.paused)return;if(S.kind==='match'){if(id==='pass'){inp.passHeld=down;if(down)actions.push('pass');}if(id==='shoot')actions.push(down?'shootDown':'shootUp');if(id==='thru'&&down)actions.push('through');if(id==='lob'&&down)actions.push('lob');if(id==='switch'&&down)actions.push('switch');if(id==='sprint')inp.sprint=down;}
  else modeKey({shoot:'KeyK',left:'KeyA',right:'KeyD',up:'KeyW',kick:'Space'}[id],down);}
 $('soCam').onclick=()=>cycleCam();$('soPause').onclick=()=>pause();
 let camMode=0;const CAMS=['Broadcast','Wide','End-to-end'];function cycleCam(){camMode=(camMode+1)%3;say('Camera: '+CAMS[camMode]);}
 function pause(){if(!S||S.paused||S.kind!=='match'&&S.kind!=='pens')return;S.paused=true;h.openSheet(`<div class="hand" style="font-size:34px;line-height:1;">Paused</div><div style="font-size:13px;line-height:1.7;">${HINT}</div><button class="btn pri" id="r">Resume</button><button class="btn" id="c">Camera: ${CAMS[camMode]}</button><button class="btn" id="q">Quit match</button>`,b=>{b.querySelector('#r').onclick=()=>{h.closeSheet();S.paused=false;};b.querySelector('#c').onclick=()=>{cycleCam();b.querySelector('#c').textContent='Camera: '+CAMS[camMode];};b.querySelector('#q').onclick=()=>{h.closeSheet();finish(true);};});}
 const HINT='<b>Move</b> WASD / arrows · <b>Sprint</b> Shift<br><b>Pass</b> J / Space · <b>Through ball</b> L · <b>Lob / cross</b> I<br><b>Shoot</b> hold K, release (aim with direction)<br><b>Defend:</b> hold J to press · J near = tackle · K = slide · Q switch';
 // ---------- state ----------
 let S=null,shotId=0;
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
 const nearest=(arr,x,z,ex)=>{let b=null,bd=1e9;arr.forEach(p=>{if(p===ex)return;const d=Math.hypot(p.x-x,p.z-z);if(d<bd){bd=d;b=p;}});return b;};
 const oppDist=p=>{let m=1e9;T[1-p.ti].forEach(o=>{m=Math.min(m,Math.hypot(o.x-p.x,o.z-p.z));});return m;};
 function laneBlock(p,m){let n=0;const dx=m.x-p.x,dz=m.z-p.z,l2=dx*dx+dz*dz;T[1-p.ti].forEach(o=>{const t=((o.x-p.x)*dx+(o.z-p.z)*dz)/l2;if(t<0.08||t>0.95)return;const px=p.x+dx*t,pz=p.z+dz*t;if(Math.hypot(o.x-px,o.z-pz)<1.7)n++;});return n;}
 const possTeam=()=>S.owner?S.owner.ti:(S.last?S.last.ti:0);
 function moveTo(p,x,z,spd){const dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);if(d<0.3){p.tvx=0;p.tvz=0;}else{const s=Math.min(spd,d*2.6);p.tvx=dx/d*s;p.tvz=dz/d*s;}}
 function kick(p,nx,nz,sp,vy){S.owner=null;p.kickCd=0.32;p.o.userData.kick=0.3;ball.p.set(p.x+nx*0.55,Math.max(BR,ball.p.y),p.z+nz*0.55);ball.v.set(nx*sp,vy,nz*sp);S.last={ti:p.ti,p};S.passTarget=null;S.lockCtl=false;audio&&audio.kick(Math.min(1.5,sp/18));}
 function isOff(p,m){const s=sg(p.ti);if(S.lockCtl||S.rsRecent)return false;if(m.x*s<=0||m.x*s<=p.x*s+0.2)return false;const d=T[1-p.ti].map(o=>o.x*s).sort((a,b)=>b-a);return m.x*s>d[1]+0.35;}
 function pass(p,m,through,lob){const offR=isOff(p,m);p.r.pa++;let tx=m.x+m.vx*0.55,tz=m.z+m.vz*0.55;if(through){tx+=sg(p.ti)*7;}const dx=tx-p.x,dz=tz-p.z,d=Math.hypot(dx,dz)||1;
  const L_=lob||d>32;const sp=L_?clamp(11+d*0.3,12,24):clamp(4+d*0.62,7.5,28);const vy=L_?GR*(d/sp)*0.5:0.3;kick(p,dx/d,dz/d,sp,vy);S.passTarget=m;S.stats.passes[p.ti]++;S.off=offR?m:null;
  if(p.ti===0&&!m.gk){S.ctl=m;}}
 function shoot(p,power,aim){const s=sg(p.ti),gx=s*(PW+0.6),dd=Math.hypot(gx-p.x,p.z);const pr=clamp(1-oppDist(p)/4,0,1);const sk=p.ti?0.75+S.cpu*0.35:1;
  const err=(0.06+power*power*0.32+pr*0.18+dd/90)/sk;const tz=clamp(aim,-1,1)*(GW-0.45)+(Math.random()*2-1)*err*3.2;const ty=0.25+power*1.75+(Math.random()*2-1)*err*1.3;
  const sp=16+power*15,dx=gx-p.x,dz=tz-p.z,d=Math.hypot(dx,dz),Tm=d/sp,vy=(ty-BR)/Tm+0.5*GR*Tm;kick(p,dx/d,dz/d,sp,vy);S.stats.shots[p.ti]++;p.r.sh++;S.shot={ti:p.ti,id:++shotId};
  if(dd>25)say(`${p.name==='You'?'You try':p.name+' tries'} from distance!`);audio&&audio.swell(0.18,1.5);}
 function tackle(p){const o=S.owner;if(!o||o.ti===p.ti||p.tackCd>0||dist(p,o)>1.6)return;p.tackCd=0.9;const ok=Math.random()<(p.ti===0?0.52:0.2+S.cpu*0.2);h.sfx('slide');
  if(ok){p.r.tk++;S.owner=null;o.kickCd=0.6;const dx=p.x-o.x,dz=p.z-o.z,d=Math.hypot(dx,dz)||1;ball.v.set(dx/d*3,0.2,dz/d*3);S.last={ti:p.ti,p};if(p.ti===0)say('Won it back!');}else{p.tvx*=0.3;}}
 function foul(by,vic){S.stats.fouls[by.ti]++;const yc=Math.random()<0.4;if(yc)S.stats.cards[by.ti]++;say(yc?`Foul! Yellow card for ${by.name}.`:`Foul by ${by.name}.`);audio.whistle(1);
  const s=sg(vic.ti),inBox=vic.x*s>PW-16.5&&Math.abs(vic.z)<20.16;if(inBox){setTimeout(()=>say('PENALTY!'),900);restart('penalty',vic.ti,s*(PW-11),0);}else restart('freekick',vic.ti,vic.x,vic.z);}
 // ---------- restarts ----------
 function kickoffPos(kt){ALL.forEach(p=>{const s=sg(p.ti);let x=FORM[p.i][0]*s,z=FORM[p.i][1]*(p.ti?-1:1);if(p.ti===kt&&p.i>=9){x=-s*(p.i===10?0.6:2.5);z=p.i===10?0:3;}p.x=x;p.z=z;p.vx=p.vz=p.tvx=p.tvz=0;p.ry=s>0?Math.PI/2:-Math.PI/2;p.slide=0;});}
 function restart(type,ti,x,z){S.phase='restart';S.owner=null;S.passTarget=null;S.shot=null;S.lockCtl=false;ball.v.set(0,0,0);ball.p.set(x,BR,z);const team=T[ti],s=sg(ti);let tk;
  if(type==='kickoff'){kickoffPos(ti);tk=team[10];}else if(type==='goalkick')tk=team[0];else tk=nearest(team.filter(p=>!p.gk),x,z);
  let dir=type==='throw'?[0,-Math.sign(z)]:type==='corner'?[-Math.sign(x)*0.6,-Math.sign(z)]:[s,0];const dl=Math.hypot(dir[0],dir[1]);dir=[dir[0]/dl,dir[1]/dl];
  if(type==='penalty'){ALL.forEach(p=>{if(p===tk||(p.gk&&p.ti!==ti))return;if(p.gk){return;}if(Math.abs(p.x-s*(PW-11))<20){p.x=s*(PW-21)+(Math.random()-0.5)*3;p.z=clamp(p.z,-18,18);}});const g=T[1-ti][0];g.x=s*(PW-0.4);g.z=0;}
  if(['freekick','corner','penalty'].includes(type))T[1-ti].forEach(p=>{if(p.gk)return;const d=Math.hypot(p.x-x,p.z-z);if(d<9.15){const a=Math.atan2(p.z-z,p.x-x);p.x=x+Math.cos(a)*9.3;p.z=clamp(z+Math.sin(a)*9.3,-PH+1,PH-1);}});
  if(type!=='kickoff'){tk.x=x-dir[0]*2.5;tk.z=z-dir[1]*2.5;}
  S.rs={type,ti,tk,dir,t:type==='kickoff'?1.4:1.2};
  const N={throw:'Throw-in',corner:'Corner kick',goalkick:'Goal kick',freekick:'Free kick'};if(N[type]&&type!=='freekick')say(`${N[type]} to ${ti?'Blue':'Red'} House.`);if(ti===0&&type!=='goalkick')S.ctl=tk;}
 function restartStep(dt){const r=S.rs,k=r.tk,sx=ball.p.x-r.dir[0]*0.6,sz=ball.p.z-r.dir[1]*0.6;moveTo(k,sx,sz,8);r.t-=dt;
  if(r.t>0||Math.hypot(k.x-sx,k.z-sz)>0.6)return;k.ry=Math.atan2(r.dir[0],r.dir[1]);S.phase='play';if(['throw','corner','goalkick'].includes(r.type)){S.rsRecent=true;setTimeout(()=>{if(S)S.rsRecent=false;},2500);}
  if(r.type==='kickoff'||r.type==='freekick'||r.type==='throw'||r.type==='corner'||r.type==='penalty'){if(r.type!=='kickoff'||r.ti===0)audio.whistle(1);}
  if(r.ti===0&&r.type!=='goalkick'){S.owner=k;S.ctl=k;S.last={ti:0,p:k};S.lockCtl=r.type!=='kickoff';if(r.type==='penalty')say('Penalty: aim with direction, hold & release K.');return;}
  S.owner=k;S.last={ti:r.ti,p:k};const s=sg(r.ti);
  setTimeout(()=>{if(!S||S.owner!==k)return;
   if(r.type==='penalty')return shoot(k,0.55+Math.random()*0.35,(Math.random()<0.5?-1:1)*(0.45+Math.random()*0.5));
   if(r.type==='freekick'&&Math.hypot(s*PW-k.x,k.z)<28)return shoot(k,0.7,(Math.random()*2-1)*0.8);
   if(r.type==='corner'){const box=T[r.ti].filter(p=>!p.gk&&p.x*s>PW-17&&Math.abs(p.z)<16);const m=box.length?box[Math.floor(Math.random()*box.length)]:bestMate(k);if(m)return pass(k,m,false,true);}
   if(r.type==='goalkick'){const m=T[r.ti][5+Math.floor(Math.random()*4)];return pass(k,m,false,true);}
   const m=bestMate(k,false);if(m)pass(k,m.m||m,false,false);},r.type==='penalty'?900:400);}
 function bestMate(p,allowT){const s=sg(p.ti);let best=null,bs=-1e9;T[p.ti].forEach(m=>{if(m===p||m.gk)return;const d=Math.hypot(m.x-p.x,m.z-p.z);if(d<4||d>42)return;const fwd=(m.x-p.x)*s,op=Math.min(oppDist(m),9);const sc=fwd*0.07+op*0.35-laneBlock(p,m)*3-d*0.02+Math.random()*0.6;if(sc>bs){bs=sc;best={m,through:allowT&&op>4&&fwd>6&&Math.random()<0.35};}});return best;}
 function pickMate(p,dir){let best=null,bs=-1e9;const fx=dir?dir[0]:Math.sin(p.ry),fz=dir?dir[1]:Math.cos(p.ry);T[p.ti].forEach(m=>{if(m===p)return;const dx=m.x-p.x,dz=m.z-p.z,d=Math.hypot(dx,dz);if(d<2||d>60)return;const dot=(dx*fx+dz*fz)/d;if(dot<0.35)return;const sc=dot*5-d*0.035-laneBlock(p,m)*1.4+Math.min(oppDist(m),6)*0.15-(m.gk?3:0);if(sc>bs){bs=sc;best=m;}});return best;}
 // ---------- AI ----------
 function gkAI(p,dt){const s=sg(p.ti),gx=-s*PW,b=ball.p,v=ball.v;
  if(S.owner===p){p.hold=(p.hold||0)+dt;p.tvx=p.tvz=0;if(p.hold>1.4){p.hold=0;const t=bestMate(p,false);if(t)pass(p,t.m,false,Math.random()<0.6);else kick(p,s,0,22,9);}return;}
  if(!S.owner&&v.x*(-s)>5&&Math.abs(b.x-gx)<36){const Tm=(gx-b.x)/v.x;if(Tm>0&&Tm<2.2){const zz=b.z+v.z*Tm,yy=b.y+v.y*Tm-4.9*Tm*Tm;if(Math.abs(zz)<GW+0.7&&yy<GH+0.5){
    if(S.shot&&p.saveFor!==S.shot.id){p.saveFor=S.shot.id;const spd=v.length(),off=Math.abs(zz-p.z);p.saveP=clamp((p.ti?0.5+S.cpu*0.3:0.74)-spd*0.011-off*0.06-(yy>1.8?0.12:0),0.1,0.93);p.willSave=Math.random()<p.saveP;}
    moveTo(p,gx+s*0.5,clamp(zz,-GW,GW),8);if(Math.abs(zz-p.z)>0.8&&p.diveT<=0&&Tm<0.5){p.diveT=0.7;p.diveDir=Math.sign(zz-p.z);}
    if(p.willSave&&Math.hypot(b.x-p.x,b.z-p.z)<1.4+(p.diveT>0?0.9:0)&&b.y<2.7)save(p);return;}}}
  const inBox=Math.abs(b.x-gx)<15&&Math.abs(b.z)<18;const nr=nearest(ALL,b.x,b.z);
  if(!S.owner&&inBox&&nr===p&&v.length()<14){moveTo(p,b.x,b.z,7);return;}
  if(S.owner&&S.owner.ti!==p.ti&&Math.hypot(S.owner.x-gx,S.owner.z)<11&&dist(p,S.owner)<5){moveTo(p,S.owner.x,S.owner.z,6);if(dist(p,S.owner)<1.3&&Math.random()<dt*3)tackle(p);return;}
  moveTo(p,gx+s*clamp(1.2+(PW-Math.abs(b.x))*0.0,1,3),clamp(b.z*0.17,-2.6,2.6),5);}
 function save(p){const v=ball.v,s=sg(p.ti),spd=v.length();S.stats.ont[1-p.ti]++;p.willSave=false;S.shot=null;h.sfx('thud');
  if(spd<20&&Math.random()<0.55){S.owner=p;S.last={ti:p.ti,p};ball.v.set(0,0,0);say(`${p.name} gathers it.`);}
  else{v.set(s*(3+Math.random()*4),2.5+Math.random()*2.5,(Math.random()<0.5?-1:1)*(4+Math.random()*5));S.last={ti:p.ti,p};say(['What a save!',`Brilliant stop by ${p.name}!`,'Tipped away!'][Math.floor(Math.random()*3)]);audio.swell(0.25,2);}}
 function carrierAI(p,dt){const s=sg(p.ti),gx=s*PW;p.think-=dt;
  if(p.think<=0){p.think=0.28;const dg=Math.hypot(gx-p.x,p.z),pr=oppDist(p),ang=Math.abs(p.z)/Math.max(1,Math.abs(gx-p.x));
   if(dg<27&&ang<1.1&&(dg<15||Math.random()<0.22+(pr<3?0.2:0))){shoot(p,0.45+Math.random()*0.45,(Math.random()*2-1)*0.85);return;}
   if((pr<2.6&&Math.random()<0.6)||Math.random()<0.1*(1+S.cpu)){const t=bestMate(p,true);if(t){pass(p,t.m,t.through,false);return;}}
   let dx=gx-p.x,dz=-p.z*0.35;const o=nearest(T[1-p.ti],p.x,p.z);const od=dist(o,p);if(od<5){dx+=(p.x-o.x)/od*3;dz+=(p.z-o.z)/od*5;}if(Math.abs(p.z)>PH-3)dz-=Math.sign(p.z)*4;const l=Math.hypot(dx,dz);p.dd=[dx/l,dz/l];}
  const sp=5.2+S.cpu*1.0;p.tvx=p.dd[0]*sp;p.tvz=p.dd[1]*sp;}
 function shape(p){const s=sg(p.ti),[fx,fz]=FORM[p.i];const hx=fx*s,hz=fz*(p.ti?-1:1),b=ball.p,att=possTeam()===p.ti;
  let tx=hx*0.55+b.x*0.45+(att?s*9:-s*3),tz=hz*0.8+b.z*0.2;
  if(p.i<=4){tx=att?(s>0?Math.min(tx,6):Math.max(tx,-6)):(s>0?Math.min(tx,b.x-3):Math.max(tx,b.x+3));}
  if(p.i>=9&&att){tx=b.x+s*11;tz=hz*0.9+b.z*0.3;}
  tx=clamp(tx,-PW+3,PW-3);if(s>0)tx=Math.min(tx,PW-8);else tx=Math.max(tx,-PW+8);tz=clamp(tz,-PH+1.5,PH-1.5);
  moveTo(p,tx,tz,Math.hypot(tx-p.x,tz-p.z)>10?6:4.3);}
 function roles(){const b=ball.p,pr={x:b.x+ball.v.x*0.35,z:b.z+ball.v.z*0.35};S.pred=pr;S.chase=[null,null];S.press=[null,null];S.cover=[null,null];
  for(let ti=0;ti<2;ti++){const c=T[ti].filter(p=>!p.gk&&p!==(ti===0?S.ctl:null));if(!S.owner){const n=nearest(c,pr.x,pr.z);if(ti===1||!S.ctl||Math.hypot(n.x-pr.x,n.z-pr.z)+3<Math.hypot(S.ctl.x-pr.x,S.ctl.z-pr.z))S.chase[ti]=n;}
   else if(S.owner.ti!==ti){const o=S.owner;c.sort((a,bb)=>dist(a,o)-dist(bb,o));if(ti===1||!S.ctl||dist(S.ctl,o)>8)S.press[ti]=c[0];S.cover[ti]=c.find(x=>x!==S.press[ti]);}}}
 function ai(p,dt){if(p.gk)return gkAI(p,dt);if(S.phase==='restart'){if(S.rs.tk!==p)shape(p);return;}if(S.phase==='goal'){if(p===S.scorer)moveTo(p,sg(p.ti)*(PW-2),Math.sign(p.z||1)*(PH-2),6.5);else shape(p);return;}
  if(S.owner===p){if(p.ti===0){S.ctl=p;return;}return carrierAI(p,dt);}
  if(!S.owner&&S.passTarget===p){moveTo(p,ball.p.x+ball.v.x*0.5,ball.p.z+ball.v.z*0.5,7);return;}
  if(S.chase[p.ti]===p){moveTo(p,S.pred.x,S.pred.z,7.1);return;}
  const o=S.owner;if(o){const gx=-sg(p.ti)*PW,dx=gx-o.x,dz=-o.z,d=Math.hypot(dx,dz)||1;
   if(S.press[p.ti]===p){moveTo(p,o.x+dx/d*0.8,o.z+dz/d*0.8,6.5+(p.ti?S.cpu*0.6:0));if(dist(p,o)<1.3&&Math.random()<dt*(1.6+S.cpu))tackle(p);return;}
   if(S.cover[p.ti]===p){moveTo(p,o.x+dx/d*6,o.z+dz/d*6,5.5);return;}}
  shape(p);}
 // ---------- human ----------
 function human(dt){const c=S.ctl;if(!c)return;let ix=(K.KeyD||K.ArrowRight?1:0)-(K.KeyA||K.ArrowLeft?1:0)+joy[0],iz=(K.KeyS||K.ArrowDown?1:0)-(K.KeyW||K.ArrowUp?1:0)+joy[1];const l=Math.hypot(ix,iz);if(l>1){ix/=l;iz/=l;}
  const dir=l>0.15?[ix,iz]:null;S.inDir=dir;const sprint=inp.sprint||K.ShiftLeft||K.ShiftRight;
  while(actions.length){const a=actions.shift();doAction(a,dir);}
  if(inp.charging)S.charge=Math.min(1,S.charge+dt*1.3);
  if(S.lockCtl||S.phase==='goal'||(S.phase==='restart'&&S.rs.tk===c)){if(!(S.phase==='restart'&&S.rs.tk===c)){c.tvx=c.tvz=0;}if(dir&&S.lockCtl)c.ry=angL(c.ry,Math.atan2(dir[0],dir[1]),dt*6);return;}
  if(c.slide>0)return;const att=S.owner&&S.owner.ti===0;
  if(!att&&inp.passHeld&&S.owner){moveTo(c,S.owner.x,S.owner.z,6.9);if(dist(c,S.owner)<1.4)tackle(c);c.sta=Math.max(0,c.sta-dt*0.06);}
  else if(dir){const spr=sprint&&c.sta>0.05,sp=(spr?7.3:5.0)*(S.owner===c?0.9:1)*(0.72+0.28*c.sta);c.tvx=ix*sp;c.tvz=iz*sp;if(spr)c.sta=Math.max(0,c.sta-dt*0.11);}
  else{c.tvx=0;c.tvz=0;}}
 function doAction(a,dir){const c=S.ctl;if(!c||S.phase==='goal'||S.phase==='replay')return;const has=S.owner===c;
  if(a==='switch'){if(!has){const n=nearest(T[0].filter(p=>!p.gk),ball.p.x,ball.p.z,c);if(n)S.ctl=n;}return;}
  if(a==='shootDown'){if(has){inp.charging=true;S.charge=0;}else if(c.slide<=0&&c.tackCd<=0&&!S.lockCtl&&S.phase==='play'){c.slide=0.5;c.tackCd=1.2;c.vx=Math.sin(c.ry)*8.8;c.vz=Math.cos(c.ry)*8.8;h.sfx('slide');}return;}
  if(a==='shootUp'){if(inp.charging){inp.charging=false;if(S.owner===c){const aim=dir?dir[1]:(Math.random()-0.5)*0.6;shoot(c,S.charge,aim);}S.charge=0;}return;}
  if(!has){if(a==='pass'&&S.owner&&S.owner.ti===1&&dist(c,S.owner)<1.6)tackle(c);return;}
  const m=pickMate(c,dir);if(a==='lob'){if(m)pass(c,m,false,true);else{const d=dir||[Math.sin(c.ry),Math.cos(c.ry)];kick(c,d[0],d[1],18,8);}return;}
  if(m)pass(c,m,a==='through',false);else{const d=dir||[Math.sin(c.ry),Math.cos(c.ry)];kick(c,d[0],d[1],12,0.3);}}
 // ---------- physics / rules ----------
 function ballPhys(dt){const b=ball.p,v=ball.v;v.y-=GR*dt;b.addScaledVector(v,dt);
  if(b.y<BR){b.y=BR;if(v.y<0){v.y=-v.y*0.45;if(v.y<1.2)v.y=0;}}const f=b.y<=BR+0.03?0.55:0.04;v.x*=1-f*dt;v.z*=1-f*dt;
  [1,-1].forEach(s=>{const gx=s*PW;[-GW,GW].forEach(pz=>{const dx=b.x-gx,dz=b.z-pz,d=Math.hypot(dx,dz);if(d<BR+0.07&&b.y<GH+BR&&d>0){const nx=dx/d,nz=dz/d,dot=v.x*nx+v.z*nz;if(dot<0){v.x-=1.6*dot*nx;v.z-=1.6*dot*nz;b.x=gx+nx*(BR+0.08);b.z=pz+nz*(BR+0.08);h.sfx('thud');say('Off the post!');audio.swell(0.3,1.5);}}});
   if(Math.abs(b.z)<GW&&Math.abs(b.x-gx)<BR+0.08&&Math.abs(b.y-GH)<BR+0.08){v.x*=-0.55;v.y=Math.abs(v.y)*0.4+1.5;h.sfx('thud');say('Off the crossbar!');audio.swell(0.3,1.5);}
   if(s*b.x>PW+0.05&&Math.abs(b.z)<GW+0.1&&b.y<GH){if(s*b.x>PW+1.8){b.x=s*(PW+1.8);v.x*=-0.1;v.z*=0.4;v.y*=0.5;nets[s].t=0.6;}if(Math.abs(b.z)>GW-BR){b.z=Math.sign(b.z)*(GW-BR);v.z*=-0.2;}if(b.y>GH-0.4&&s*b.x>PW+0.3){v.y=Math.min(v.y,0);}}});
  ballM.position.copy(b);ballM.rotation.x+=v.z*dt/BR;ballM.rotation.z-=v.x*dt/BR;}
 function possession(dt){const b=ball.p,v=ball.v;
  if(S.owner){const p=S.owner,fx=Math.sin(p.ry),fz=Math.cos(p.ry),sp=Math.hypot(p.vx,p.vz),off=0.55+sp*0.06,tx=p.x+fx*off,tz=p.z+fz*off;const k=Math.min(1,dt*14);b.x+=(tx-b.x)*k;b.z+=(tz-b.z)*k;b.y=BR;v.set(p.vx,0,p.vz);
   ballM.position.copy(b);ballM.rotation.x+=v.z*dt/BR;ballM.rotation.z-=v.x*dt/BR;
   if(p.gk&&p.ti!==0||p.gk){b.y=1.1;ballM.position.y=1.1;}}
  else{for(let i=0;i<2;i++)ballPhys(dt/2);let best=null,bd=0.85;
   ALL.forEach(p=>{if(p.kickCd>0)return;const d=Math.hypot(p.x-b.x,p.z-b.z);
    if(p.slide>0&&d<1.1&&b.y<0.8){ball.v.set(p.vx*0.9,0.4,p.vz*0.9);S.last={ti:p.ti,p};p.kickCd=0.3;return;}
    if(b.y>1.3&&b.y<2.5&&d<0.9&&!p.gk){const s=sg(p.ti),dg=Math.hypot(s*PW-p.x,p.z);p.kickCd=0.5;S.last={ti:p.ti,p};if(dg<18){const tz=(Math.random()*2-1)*(GW-0.4),dx=s*(PW+0.5)-p.x,dz=tz-p.z,dd=Math.hypot(dx,dz);ball.v.set(dx/dd*13,-1.5+Math.random()*2.5,dz/dd*13);S.stats.shots[p.ti]++;S.shot={ti:p.ti,id:++shotId};say(`Header from ${p.name}!`);audio.swell(0.25,1.5);}else{ball.v.set(s*8,4,(Math.random()-0.5)*6);}p.o.userData.kick=0.2;return;}
    if(d<bd&&b.y<(p.gk?2.4:1.0)){bd=d;best=p;}});
   if(best&&best.gk&&S.shot&&S.shot.ti!==best.ti&&best.saveFor===S.shot.id&&!best.willSave)best=null;
   if(best){const rel=Math.hypot(v.x-best.vx,v.z-best.vz);if(rel<11||best.gk&&Math.abs(best.x)>PW-17&&Math.abs(best.z)<20.2){if(best.gk&&S.shot&&S.shot.ti!==best.ti)S.stats.ont[1-best.ti]++;if(S.off===best){S.off=null;S.stats.offs[best.ti]++;audio.whistle(1);say(`Offside! ${best.name==='You'?'You were':best.name+' was'} beyond the last defender.`);restart('freekick',1-best.ti,best.x,best.z);return;}S.off=null;S.owner=best;S.last={ti:best.ti,p:best};S.passTarget=null;S.shot=null;if(best.ti===0&&!best.gk)S.ctl=best;}
    else{v.multiplyScalar(0.35);v.x+=(Math.random()-0.5)*3;v.z+=(Math.random()-0.5)*3;best.kickCd=0.25;S.last={ti:best.ti,p:best};}}}
  ALL.forEach(p=>{if(p.slide>0&&S.owner&&S.owner.ti!==p.ti&&dist(p,S.owner)<1.1){const o=S.owner,fx=Math.sin(o.ry),fz=Math.cos(o.ry),d=dist(p,o)||1;const behind=((p.x-o.x)*fx+(p.z-o.z)*fz)/d<-0.35;
   if(behind&&Math.random()<0.55){p.slide=0;foul(p,o);}else{S.owner=null;o.kickCd=0.7;ball.v.set(p.vx*0.8,0.4,p.vz*0.8);S.last={ti:p.ti,p};p.slide=0.1;say(p.ti===0?'Superb sliding tackle!':`${p.name} slides in and wins it.`);}}});}
 function rules(){const b=ball.p;if(S.phase!=='play')return;
  for(const s of [1,-1]){if(s*b.x>PW+BR&&Math.abs(b.z)<GW&&b.y<GH){return goal(s>0?0:1);}}
  if(Math.abs(b.z)>PH+BR){const ti=1-(S.last?S.last.ti:0);audio.whistle(1);return restart('throw',ti,clamp(b.x,-PW+1,PW-1),Math.sign(b.z)*PH);}
  if(Math.abs(b.x)>PW+BR){const s=Math.sign(b.x),def=s>0?1:0;audio.whistle(1);if(S.last&&S.last.ti===def)return restart('corner',1-def,s*PW,Math.sign(b.z||1)*PH);return restart('goalkick',def,s*(PW-5.5),Math.sign(b.z||1)*5);}}
 function goal(ti){S.phase='goal';S.score[ti]++;S.stats.ont[ti]++;const sc=S.last&&S.last.ti===ti?S.last.p:nearest(T[ti],ball.p.x,ball.p.z);S.scorer=sc;sc.r.g++;S.gt=3;const min=minute();S.goals.push({ti,min,name:sc.name});S.shot=null;
  say(`GOAAAL! ${sc.name==='You'?'YOU score':sc.name+' scores'} for ${ti?'Blue':'Red'} House! ${S.score[0]}–${S.score[1]}`);audio.swell(0.55,4.5);h.big(ti===0?'GOAL!':'GOAL…');S.cheer=4;S.cheerTeam=ti;}
 const minute=()=>Math.min(90,Math.floor(S.clock/S.dur*90));
 // ---------- replay ----------
 function record(dt){S.recT-=dt;if(S.recT>0)return;S.recT=1/30;const a=new Float32Array(22*4);ALL.forEach((p,k)=>{a[k*4]=p.x;a[k*4+1]=p.z;a[k*4+2]=p.ry;a[k*4+3]=Math.hypot(p.vx,p.vz);});S.buf.push({b:[ball.p.x,ball.p.y,ball.p.z],a});if(S.buf.length>260)S.buf.shift();}
 function startReplay(){const n=S.buf.length;if(n<40){afterGoal();return;}S.phase='replay';S.rp={i:Math.max(0,n-150),f:0,end:n-1};$('soTag').style.display='';}
 function replayStep(dt){const r=S.rp;r.f+=dt*30*0.5;while(r.f>=1){r.i++;r.f-=1;}if(r.i>=r.end){$('soTag').style.display='none';afterGoal();return;}
  const A=S.buf[r.i],B=S.buf[r.i+1],f=r.f;ball.p.set(A.b[0]+(B.b[0]-A.b[0])*f,A.b[1]+(B.b[1]-A.b[1])*f,A.b[2]+(B.b[2]-A.b[2])*f);ballM.position.copy(ball.p);
  ALL.forEach((p,k)=>{const x=A.a[k*4]+(B.a[k*4]-A.a[k*4])*f,z=A.a[k*4+1]+(B.a[k*4+1]-A.a[k*4+1])*f;p.o.position.set(x,0,z);p.o.rotation.y=angL(A.a[k*4+2],B.a[k*4+2],f);poseUpdate(p.o,dt*0.5,A.a[k*4+3]>0.4,null,A.a[k*4+3]/4.2);});}
 function afterGoal(){S.buf=[];const t=S.goals[S.goals.length-1].ti;restart('kickoff',1-t,0,0);}
 // ---------- movement + presentation ----------
 function movePlayers(dt){ALL.forEach(p=>{p.kickCd=Math.max(0,p.kickCd-dt);p.tackCd=Math.max(0,p.tackCd-dt);
  if(p.slide>0){p.slide-=dt;p.vx*=1-1.8*dt;p.vz*=1-1.8*dt;}else{const a=Math.min(1,dt*(p===S.ctl?8:5));p.vx+=(p.tvx-p.vx)*a;p.vz+=(p.tvz-p.vz)*a;}
  p.x=clamp(p.x+p.vx*dt,-PW-4,PW-(-4));p.z=clamp(p.z+p.vz*dt,-PH-3,PH+3);const sp=Math.hypot(p.vx,p.vz);
  if(S.lockCtl&&p===S.ctl){}else if(sp>0.35&&p.slide<=0)p.ry=angL(p.ry,Math.atan2(p.vx,p.vz),dt*10);else if(sp<=0.35)p.ry=angL(p.ry,Math.atan2(ball.p.x-p.x,ball.p.z-p.z),dt*3);
  if(p!==S.ctl)p.sta=Math.min(1,p.sta+dt*0.03);});
  for(let i=0;i<22;i++)for(let j=i+1;j<22;j++){const a=ALL[i],b=ALL[j],dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);if(d<0.62&&d>0.001){const push=(0.62-d)/2;a.x-=dx/d*push;a.z-=dz/d*push;b.x+=dx/d*push;b.z+=dz/d*push;}}
  ALL.forEach(p=>{const u=p.o.userData;p.o.position.set(p.x,0,p.z);p.o.rotation.y=p.ry;const sp=Math.hypot(p.vx,p.vz);poseUpdate(p.o,dt,sp>0.4,S.phase==='goal'&&p.ti===S.cheerTeam&&sp<0.5?'wave':null,sp/4.2);
   u.rig.rotation.x=p.slide>0?-1.1:0;if(p.slide>0)u.rig.position.y=-0.45;
   if(p.diveT>0){p.diveT-=dt;const k=Math.sin(Math.min(1,(0.7-p.diveT)/0.35)*Math.PI*0.5);u.rig.rotation.z=p.diveDir*Math.sin(p.ry)*1.35*k;u.rig.position.y=0.25*k;}else u.rig.rotation.z=0;
   p.lb.visible=p===S.ctl||p===S.owner;});}
 const camPos=new THREE.Vector3(0,30,60),camLook=new THREE.Vector3();
 function camStep(dt){const b=ball.p;let pos,look,fov=34;
  if(S.phase==='replay'){const s=Math.sign(b.x||1);pos=new THREE.Vector3(s*(PW-16),5,b.z+12);look=new THREE.Vector3(b.x,1,b.z);fov=40;camPos.lerp(pos,Math.min(1,dt*2));camLook.lerp(look,Math.min(1,dt*4));}
  else{if(camMode===0){look=new THREE.Vector3(clamp(b.x,-PW+10,PW-10)*0.97,0,b.z*0.5-2);pos=new THREE.Vector3(look.x,25,look.z+46);}
   else if(camMode===1){look=new THREE.Vector3(b.x*0.75,0,b.z*0.3);pos=new THREE.Vector3(look.x,52,look.z+72);fov=38;}
   else{const s=sg(possTeam());look=new THREE.Vector3(b.x+s*12,0,b.z*0.8);pos=new THREE.Vector3(b.x-s*21,11,b.z*0.7);fov=48;}
   camPos.lerp(pos,Math.min(1,dt*2.6));camLook.lerp(look,Math.min(1,dt*3.5));}
  if(Math.abs(camera.fov-fov)>0.1){camera.fov+=(fov-camera.fov)*Math.min(1,dt*3);camera.updateProjectionMatrix();}camera.position.copy(camPos);camera.lookAt(camLook);sun.target.position.set(camLook.x,0,0);sun.position.set(camLook.x-45,70,40);}
 function crowdStep(dt,t){if(S.cheer>0){S.cheer-=dt;const m=new THREE.Matrix4(),amp=Math.min(1,S.cheer)*0.35;baseB.forEach((bm,k)=>{const off=Math.abs(Math.sin(t*9+phase[k]))*amp;m.copy(bm);m.elements[13]+=off;crowdB.setMatrixAt(k,m);m.copy(baseH[k]);m.elements[13]+=off;crowdH.setMatrixAt(k,m);});crowdB.instanceMatrix.needsUpdate=true;crowdH.instanceMatrix.needsUpdate=true;}
  [1,-1].forEach(s=>{const n=nets[s];if(n.t>0){n.t-=dt;n.back.position.x=s*(PW+2)+s*Math.sin(n.t*30)*0.25*n.t;}});}
 function drawMini(){const c=mini,W=168,H=110,sx=W/(2*PW+6),sz=H/(2*PH+6);c.fillStyle='#6f9152';c.fillRect(0,0,W,H);c.strokeStyle='rgba(242,230,204,0.8)';c.lineWidth=1;c.strokeRect(3*sx,3*sz,2*PW*sx,2*PH*sz);c.beginPath();c.moveTo(W/2,3*sz);c.lineTo(W/2,H-3*sz);c.stroke();c.beginPath();c.arc(W/2,H/2,9.15*sx,0,7);c.stroke();
  [1,-1].forEach(s=>c.strokeRect(W/2+s*PW*sx-(s>0?16.5*sx:0),H/2-20.16*sz,16.5*sx,40.32*sz));
  const X=x=>(x+PW+3)*sx,Z=z=>(z+PH+3)*sz;ALL.forEach(p=>{c.fillStyle=p.ti?BLUE:RED;c.beginPath();c.arc(X(p.x),Z(p.z),p===S.ctl?3.6:2.4,0,7);c.fill();if(p===S.ctl){c.strokeStyle='#f0c24a';c.lineWidth=1.5;c.stroke();}});c.fillStyle='#fff';c.beginPath();c.arc(X(ball.p.x),Z(ball.p.z),2.2,0,7);c.fill();c.strokeStyle='#3a2a30';c.lineWidth=1;c.stroke();}
 function paintScore(){const m=minute();$('soScore').innerHTML=`<span style="background:${RED};color:#fff;">RED</span><span style="font-size:20px;font-family:'Patrick Hand',cursive;">${S.score[0]} – ${S.score[1]}</span><span style="background:${BLUE};color:#fff;">BLU</span><span style="background:#3a2a30;color:#f5ead3;">${S.phase==='half'?'HT':S.phase==='full'?'FT':m+"'"}</span>`;}
 // ---------- match flow ----------
 const rating=p=>Math.min(10,6+p.r.g*1.2+p.r.pa*0.05+p.r.sh*0.15+p.r.tk*0.3+(p.gk?(S.score[1-p.ti]===0?1:-0.3*S.score[1-p.ti]):0)+(S.score[p.ti]>S.score[1-p.ti]?0.4:0));
 function ratingsHTML(){const all=ALL.map(p=>({p,v:rating(p)})).sort((a,b)=>b.v-a.v),m=all[0],red=all.filter(x=>x.p.ti===0).slice(0,4);return `<div style="font-size:13px;line-height:1.5;"><b>Man of the match:</b> <span style="color:${m.p.ti?BLUE:RED};font-weight:700;">${m.p.name}</span> ${m.v.toFixed(1)}<br><b>Red House ratings:</b> ${red.map(x=>x.p.name+' '+x.v.toFixed(1)).join(' · ')}</div>`;}
 function statsHTML(){const st=S.stats,tp=st.poss[0]+st.poss[1]||1,row=(n,a,b)=>`<div style="display:grid;grid-template-columns:44px 1fr 44px;gap:6px;align-items:center;font-size:13px;"><b style="text-align:right;">${a}</b><div style="text-align:center;font-weight:700;opacity:.75;">${n}</div><b>${b}</b></div>`;
  return `<div style="display:flex;flex-direction:column;gap:4px;">${row('Possession',Math.round(st.poss[0]/tp*100)+'%',Math.round(st.poss[1]/tp*100)+'%')}${row('Shots',st.shots[0],st.shots[1])}${row('On target',st.ont[0],st.ont[1])}${row('Passes',st.passes[0],st.passes[1])}${row('Fouls',st.fouls[0],st.fouls[1])}${row('Offsides',st.offs[0],st.offs[1])}${row('Yellow cards',st.cards[0],st.cards[1])}</div>${ratingsHTML()}
  ${S.goals.length?`<div style="font-size:13px;line-height:1.5;">${S.goals.map(g=>`<span style="color:${g.ti?BLUE:RED};font-weight:700;">●</span> ${g.name} ${g.min}'`).join(' &nbsp; ')}</div>`:''}`;}
 function timeChecks(){if(S.phase!=='play')return;if(S.half===1&&S.clock>=S.dur/2&&!(S.owner&&Math.abs(S.owner.x)>PW-25)){S.phase='half';audio.whistle(3);paintScore();
   h.openSheet(`<div class="hand" style="font-size:20px;color:#a8553f;">Half time</div><div class="hand" style="font-size:44px;line-height:.9;">Red ${S.score[0]} – ${S.score[1]} Blue</div>${statsHTML()}<button class="btn pri" id="go">Second half</button>`,b=>b.querySelector('#go').onclick=()=>{h.closeSheet();S.half=2;restart('kickoff',1,0,0);});}
  if(S.half===2&&S.clock>=S.dur&&!(S.owner&&Math.abs(S.owner.x)>PW-25&&S.clock<S.dur+20)){S.phase='full';audio.whistle(3);paintScore();finish(false);}}
 function finish(quit){const sc=S.score;const res={kind:'match',quit,win:sc[0]>sc[1],draw:sc[0]===sc[1],score:sc.slice(),myGoals:S.goals.filter(g=>g.ti===0&&g.name==='You').length,goals:sc[0],title:quit?'Match abandoned':sc[0]>sc[1]?'RED HOUSE WIN!':sc[0]===sc[1]?'A DRAW':'BLUE HOUSE WIN',sub:`Red ${sc[0]} – ${sc[1]} Blue`,html:statsHTML()};S.phase='full';audio.stop();setTimeout(()=>h.onEnd(res),quit?0:1400);}
 function matchStep(dt,t){if(S.paused)return;if(S.phase==='replay'){replayStep(dt);return;}if(S.phase==='half'||S.phase==='full'){movePlayers(dt*0.3);return;}
  if(S.phase==='play'){S.clock+=dt;if(S.owner)S.stats.poss[S.owner.ti]+=dt;}
  if(S.phase==='goal'){S.gt-=dt;if(S.gt<=0){startReplay();return;}}
  if(S.owner&&S.owner.ti===1&&S.ctl&&(S.swT=(S.swT||0)-dt)<=0){S.swT=0.6;const n=nearest(T[0].filter(p=>!p.gk),S.owner.x,S.owner.z);if(n!==S.ctl&&dist(n,S.owner)+5<dist(S.ctl,S.owner))S.ctl=n;}
  roles();human(dt);ALL.forEach(p=>{if(p===S.ctl&&!(S.phase==='restart'&&S.rs.tk===p&&S.rs.ti===1))return;ai(p,dt);});if(S.phase==='restart')restartStep(dt);
  movePlayers(dt);if(S.phase==='play'||S.phase==='goal')possession(dt);else{ballM.position.copy(ball.p);}rules();record(dt);timeChecks();
  const c=S.ctl;if(c){ctlRing.position.set(c.x,0.06,c.z);ctlRing.material.color.set(c.sta>0.3?'#f0c24a':'#a8553f');}
  $('soPow').style.display=inp.charging?'':'none';$('soPow').firstChild.style.width=(S.charge*100)+'%';}
 // ---------- mini modes: pens / keepy / sprint ----------
 function hideAll(except){ALL.forEach(p=>{p.o.visible=except.includes(p);});}
 function lineUp(){[...T[0].slice(1,10),...T[1].slice(1,10)].forEach((p,k)=>{p.o.visible=true;p.x=-1+(k%2)*2;p.z=-9+Math.floor(k/2)*2;p.x+=PW-30;p.vx=p.vz=p.tvx=p.tvz=0;p.ry=Math.PI/2;p.o.position.set(p.x,0,p.z);p.o.rotation.y=p.ry;});}
 function pensSetup(){const sh=T[0][10],gk=T[1][0];S.pn={round:0,turn:0,res:[[],[]],phase:'aim',aim:[0,1.2],t:0,charge:0,charging:false,dive:null};hideAll([]);lineUp();
  ballM.visible=true;penNext();}
 function penNext(){const P=S.pn;const you=P.turn===0;const sh=you?T[0][10]:T[1][10],gk=you?T[1][0]:T[0][0];[T[0][10],T[1][10],T[0][0],T[1][0]].forEach(p=>p.o.visible=false);sh.o.visible=gk.o.visible=true;
  sh.x=PW-13.5;sh.z=0;sh.ry=Math.PI/2;gk.x=PW-0.4;gk.z=0;gk.ry=-Math.PI/2;gk.diveT=0;[sh,gk].forEach(p=>{p.vx=p.vz=p.tvx=p.tvz=0;});ball.p.set(PW-11,BR,0);ball.v.set(0,0,0);ballM.position.copy(ball.p);
  P.sh=sh;P.gk=gk;P.phase=you?'aim':'wait';P.t=0;P.aim=[0,1.2];P.dive=null;P.outcome=null;aimRing.visible=you;S.ctl=you?sh:gk;
  say(you?'Your penalty: aim with WASD, hold K (or SHOOT) and release.':'Save it! Dive with A / W / D (or the buttons) when he strikes.');paintPens();}
 function paintPens(){const P=S.pn;const dots=ti=>{let s='';for(let k=0;k<Math.max(5,P.res[ti].length);k++){const r=P.res[ti][k];s+=`<span style="width:12px;height:12px;border-radius:50%;display:inline-block;border:2px solid #3a2a30;background:${r===undefined?'#fff':r?'#55745c':'#a8553f'};margin-left:2px;"></span>`;}return s;};
  $('soScore').innerHTML=`<span style="background:${RED};color:#fff;">YOU</span><span>${dots(0)}</span><span style="background:${BLUE};color:#fff;">BLU</span><span>${dots(1)}</span>`;}
 function penKick(P,tz,ty,power,isYou){const sh=P.sh,gk=P.gk;sh.o.userData.kick=0.3;const sp=17+power*13,dx=PW+0.6-ball.p.x,dz=tz,d=Math.hypot(dx,dz),Tm=d/sp;ball.v.set(dx/d*sp,(ty-BR)/Tm+0.5*GR*Tm,dz/d*sp);audio.kick(1.3);
  const zone=tz<-1.2?-1:tz>1.2?1:0;let dive;if(isYou){const read=Math.random()<0.25+S.cpu*0.2;dive=read?zone:[-1,0,1][Math.floor(Math.random()*3)];}else dive=P.dive??0;
  const off=Math.abs(tz)>GW-0.1||ty>GH-0.05||ty<0.05;let saved=false;if(!off&&dive===zone){const corner=Math.abs(tz)>2.6&&ty>1.5;saved=Math.random()<(isYou?(corner?0.35:0.7)+S.cpu*0.12-power*0.15:(corner?0.5:0.8));}
  P.outcome=off?'miss':saved?'save':'goal';P.diveSide=dive;P.phase='fly';P.t=0;gk.diveT=0;setTimeout(()=>{if(S&&S.pn===P){gk.diveDir=dive||0;gk.diveT=dive?0.7:0;}},120);}
 function pensStep(dt,t){const P=S.pn;if(S.paused)return;P.t+=dt;const sh=P.sh,gk=P.gk;
  if(P.phase==='aim'){let ix=(K.KeyD||K.ArrowRight?1:0)-(K.KeyA||K.ArrowLeft?1:0)+joy[0],iy=(K.KeyW||K.ArrowUp?1:0)-(K.KeyS||K.ArrowDown?1:0)-joy[1];P.aim[0]=clamp(P.aim[0]+ix*dt*4,-GW-0.6,GW+0.6);P.aim[1]=clamp(P.aim[1]+iy*dt*2.5,0.15,GH+0.5);
   aimRing.position.set(PW+0.05,P.aim[1],P.aim[0]);if(P.charging)P.charge=Math.min(1,P.charge+dt*1.2);$('soPow').style.display=P.charging?'':'none';$('soPow').firstChild.style.width=P.charge*100+'%';}
  if(P.phase==='run'){const k=Math.min(1,P.t/0.45);sh.x=PW-13.5+k*2.0;poseUpdate(sh.o,dt,true,null,1.4);if(k>=1){const err=(0.08+P.charge*P.charge*0.45);penKick(P,P.aim[0]+(Math.random()*2-1)*err,P.aim[1]+(Math.random()*2-1)*err*0.7,P.charge,true);aimRing.visible=false;}}
  if(P.phase==='wait'&&P.t>1.6){P.phase='crun';P.t=0;}
  if(P.phase==='crun'){const k=Math.min(1,P.t/0.5);sh.x=PW-13.5+k*2.0;if(k>=1){const tz=(Math.random()<0.5?-1:1)*(Math.random()<0.25?0.5:2+Math.random()*1.3),ty=0.3+Math.random()*1.9;penKick(P,tz,ty,0.6+Math.random()*0.3,false);}}
  if(P.phase==='fly'){for(let i=0;i<2;i++)ballPhys(dt/2);const b=ball.p;if(P.outcome==='save'&&b.x>PW-1.3){ball.v.set(-4,3,(Math.random()-0.5)*6);P.outcome='saved';h.sfx('thud');audio.swell(0.3,2);say(P.turn===0?'Saved!':'WHAT A SAVE!');}
   if(P.t>2.2){const scored=P.outcome==='goal';P.res[P.turn].push(scored);if(scored){audio.swell(0.45,2.5);S.cheer=2;say(P.turn===0?'GOAL!':'He scores.');}else if(P.outcome==='miss')say(P.turn===0?'Off target!':'He misses!');
    paintPens();const [a,b]=[P.res[0],P.res[1]];const ga=a.filter(Boolean).length,gb=b.filter(Boolean).length;const done=a.length>=5&&b.length>=5&&a.length===b.length&&ga!==gb;
    const early=a.length<=5&&b.length<=5&&(ga+(5-a.length)<gb||gb+(5-b.length)<ga);
    if(done||early||a.length>=10&&a.length===b.length){P.phase='over';setTimeout(()=>{audio.stop();h.onEnd({kind:'pens',win:ga>gb,title:ga>gb?'SHOOTOUT WON!':ga===gb?'Draw':'SHOOTOUT LOST',sub:`You ${ga} – ${gb} Blue`,html:''});},1200);return;}
    P.turn=1-P.turn;penNext();}}
  [sh,gk].forEach(p=>{const u=p.o.userData;p.o.position.set(p.x,0,p.z);p.o.rotation.y=p.ry;if(!(P.phase==='run'&&p===sh))poseUpdate(p.o,dt,false);if(p.diveT>0){p.diveT-=dt;const k=Math.sin(Math.min(1,(0.7-p.diveT)/0.3)*Math.PI*0.5);u.rig.rotation.z=p.diveDir*Math.sin(p.ry)*1.35*k;u.rig.position.y=0.3*k;p.o.position.z=p.z+p.diveDir*1.8*k;}else u.rig.rotation.z=0;});
  ballM.position.copy(ball.p);}
 function keepySetup(){hideAll([T[0][10]]);const p=T[0][10];p.x=0;p.z=0;p.ry=0;p.vx=p.vz=0;ball.p.set(0,2.4,0.45);ball.v.set(0,0,0);S.kp={n:0,on:false,best:+(localStorage.getItem('bts3_keepy')||0)};S.ctl=p;say('Tap SPACE / KICK when the ball drops to your knee.');$('soScore').innerHTML=`<span style="background:${RED};color:#fff;">TOUCHES</span><span id="kpN" style="font-size:22px;font-family:'Patrick Hand',cursive;">0</span><span style="background:#3a2a30;color:#f5ead3;">BEST ${S.kp.best}</span>`;}
 function keepyStep(dt,t){const K_=S.kp,p=T[0][10];if(!K_.on){p.o.position.set(p.x,0,p.z);poseUpdate(p.o,dt,false);ballM.position.copy(ball.p);return;}
  let ix=(K.KeyD||K.ArrowRight?1:0)-(K.KeyA||K.ArrowLeft?1:0)+joy[0],iz=(K.KeyS||K.ArrowDown?1:0)-(K.KeyW||K.ArrowUp?1:0)+joy[1];p.x+=ix*dt*3.2;p.z+=iz*dt*3.2;const dx=ball.p.x-p.x,dz=ball.p.z-0.45-p.z;p.x+=dx*dt*1.2;p.z+=dz*dt*1.2;
  ball.v.y-=GR*(1+K_.n*0.012)*dt;ball.p.addScaledVector(ball.v,dt);if(ball.p.y<BR){K_.on=false;h.sfx('thud');const nb=K_.n>K_.best;if(nb)localStorage.setItem('bts3_keepy',K_.n);setTimeout(()=>h.onEnd({kind:'keepy',win:K_.n>=10,touches:K_.n,title:nb?'NEW BEST!':'Dropped it!',sub:`${K_.n} touches`,html:''}),900);}
  p.o.position.set(p.x,0,p.z);poseUpdate(p.o,dt,Math.abs(ix)+Math.abs(iz)>0.1);ballM.position.copy(ball.p);ballM.rotation.x+=dt*4;}
 function keepyKick(){const K_=S.kp,p=T[0][10];if(!K_.on){K_.on=true;return;}const d=Math.hypot(ball.p.x-p.x,ball.p.z-0.45-p.z);if(ball.v.y<0&&ball.p.y<1.25&&ball.p.y>BR&&d<1.0){ball.v.set((Math.random()-0.5)*(0.8+K_.n*0.04),5+Math.random()*0.8,(Math.random()-0.5)*(0.6+K_.n*0.03));K_.n++;p.o.userData.kick=0.25;audio.kick(0.7);const e=hud.querySelector('#kpN');if(e)e.textContent=K_.n;if(K_.n%10===0){say(`${K_.n}! Keep going!`);audio.swell(0.25,1.5);}}else if(ball.p.y>=1.25)say('Too early!');}
 function sprintSetup(){const rs=[T[0][10],T[0][7],T[1][6],T[1][9]];hideAll(rs);rs.forEach((p,k)=>{p.x=-PW+2;p.z=-4.5+k*3;p.ry=Math.PI/2;p.vx=p.vz=0;});S.sp={rs,t:-3,v:[0,0,0,0],x:[-PW+2,-PW+2,-PW+2,-PW+2],fin:[],last:null,top:[0,7.6+S.cpu*0.9+Math.random()*0.4,7.2+S.cpu*0.9+Math.random()*0.5,7.4+S.cpu*0.9+Math.random()*0.4]};ballM.visible=false;S.ctl=null;say('Alternate A and D (or LEFT / RIGHT) as fast as you can!');$('soScore').innerHTML=`<span style="background:${RED};color:#fff;">100 m</span><span id="spT" style="font-size:20px;font-family:'Patrick Hand',cursive;">0.00s</span>`;}
 function sprintStep(dt){const R=S.sp;R.t+=dt;if(R.t<0){const n=Math.ceil(-R.t);if(n!==R.cd){R.cd=n;h.big(String(n));audio.kick(0.6);}}else if(!R.go){R.go=true;h.big('GO!');audio.whistle(1);}
  R.rs.forEach((p,k)=>{if(R.t>0){if(k===0)R.v[0]*=1-0.9*dt;else R.v[k]+=(R.top[k]-R.v[k])*dt*1.3;R.x[k]+=R.v[k]*dt;if(R.x[k]>=PW-2&&!R.fin.find(f=>f.k===k))R.fin.push({k,t:R.t,n:k?p.name:'You'});}
   p.o.position.set(R.x[k],0,p.z);p.o.rotation.y=Math.PI/2;poseUpdate(p.o,dt,R.v[k]>0.4,null,R.v[k]/4);});
  if(R.t>0&&!R.done){const e=hud.querySelector('#spT');if(e)e.textContent=(R.fin.find(f=>f.k===0)?.t??R.t).toFixed(2)+'s';const me=R.fin.find(f=>f.k===0);if(me&&(R.fin.length===4||R.t-me.t>2.5)||R.t>25){R.done=true;const pl=me?R.fin.indexOf(me)+1:4;setTimeout(()=>h.onEnd({kind:'sprint',win:pl===1,place:pl,title:pl===1?'YOU WON THE RACE!':`You came ${['','1st','2nd','3rd','4th'][pl]}`,sub:me?`${me.t.toFixed(2)}s · `+R.fin.map(f=>f.n).join(', '):'Too slow!',html:''}),900);}}}
 function sprintTap(side){const R=S.sp;if(!R||R.t<0)return;if(side!==R.last){R.v[0]=Math.min(10.2,R.v[0]+0.95);R.last=side;}}
 function modeKey(c,down){if(!S||S.paused)return;
  if(S.kind==='pens'){const P=S.pn;if(P.phase==='aim'&&(c==='KeyK'||c==='Space')){if(down){P.charging=true;P.charge=0;}else if(P.charging){P.charging=false;$('soPow').style.display='none';P.phase='run';P.t=0;}}
   if((P.phase==='wait'||P.phase==='crun')&&down&&P.dive==null){if(c==='KeyA'||c==='ArrowLeft')P.dive=-1;if(c==='KeyD'||c==='ArrowRight')P.dive=1;if(c==='KeyW'||c==='ArrowUp')P.dive=0;}
   if(['KeyA','KeyD','KeyW','KeyS'].includes(c)||c.startsWith('Arrow'))K[c]=down;}
  if(S.kind==='keepy'){if(['KeyA','KeyD','KeyW','KeyS'].includes(c)||c.startsWith('Arrow'))K[c]=down;if(down&&(c==='Space'||c==='KeyK'))keepyKick();}
  if(S.kind==='sprint'&&down){if(c==='KeyA'||c==='ArrowLeft')sprintTap('L');if(c==='KeyD'||c==='ArrowRight')sprintTap('R');}}
 // ---------- API ----------
 function start(kind,o={}){stop(true);audio=audio||mkAudio();audio.set(kind==='match'?0.06:0.035);hud.style.display='';$('soTag').style.display='none';$('soPow').style.display='none';ALL.forEach(p=>{p.r={pa:0,sh:0,g:0,tk:0};p.o.visible=true;p.diveT=0;p.slide=0;p.sta=1;p.lb.visible=false;});ballM.visible=true;aimRing.visible=false;ctlRing.visible=kind==='match';
  const pl=T[0][10];const look=h.look();if(look){const np=makePerson({...look,shirt:RED,bottom:'#f4eedb',casual:1,skirt:0,gown:0,coat:0,vest:0,trousers:0});np.add(pl.lb);sc.remove(pl.o);sc.add(np);pl.o=np;}
  S={kind,cpu:o.cpu??0.5,dur:(o.min||10)*60,phase:'play',clock:0,half:1,score:[0,0],goals:[],stats:{poss:[0,0],shots:[0,0],ont:[0,0],passes:[0,0],fouls:[0,0],cards:[0,0],offs:[0,0]},owner:null,last:null,ctl:T[0][10],buf:[],recT:0,charge:0,cheer:0,paused:false};
  $('soHint').innerHTML=kind==='match'?HINT:kind==='pens'?'<b>Aim</b> WASD · <b>Shoot</b> hold & release K<br><b>Save</b> A = dive left · W = stay · D = dive right':kind==='keepy'?'<b>Kick</b> Space / K when the ball is at knee height · <b>Move</b> WASD':'Alternate <b>A</b> and <b>D</b> to sprint';
  setButtons(kind==='match'?[['lob','LOB'],['thru','THROUGH'],['shoot','SHOOT','k'],['switch','SWITCH'],['sprint','SPRINT','s'],['pass','PASS','p']]:kind==='pens'?[['left','DIVE'],['up','STAY'],['right','DIVE'],['shoot','SHOOT','k']]:kind==='keepy'?[['kick','KICK','k']]:[['left','LEFT','p'],['right','RIGHT','k']],
   kind==='pens'?{shoot:[8,70,92],right:[112,6,64],up:[186,6,64],left:[260,6,64]}:kind==='keepy'?{kick:[16,20,110]}:kind==='sprint'?{right:[10,16,110],left:[132,16,110]}:null);
  $('soJoy').style.display=kind==='sprint'||kind==='keepy'&&false?'none':'';
  if(kind==='pens'){camPos.set(PW-26,3.4,0);camLook.set(PW,1.2,0);}
  if(kind==='match'){restart('kickoff',0,0,0);say('Inter-house final! Red House kick off.');audio.whistle(1);paintScore();camPos.set(0,30,60);}
  if(kind==='pens')pensSetup();if(kind==='keepy')keepySetup();if(kind==='sprint')sprintSetup();}
 function stop(silent){if(S&&audio)audio.stop();S=null;hud.style.display='none';if(!silent)ALL.forEach(p=>p.o.visible=true);}
 // map touch buttons for pens to keys
 const _btn=btn;
 function update(dt,t){if(!S)return;tickT-=dt;if(tickT<=0)$('soTick').style.opacity=0;
  if(S.kind==='match'){matchStep(dt,t);camStep(dt);if(!S)return;paintScore();drawMini();}
  else if(S.kind==='pens'){pensStep(dt,t);if(!S)return;camPos.lerp(new THREE.Vector3(PW-25,3.3,0),Math.min(1,dt*2));camLook.lerp(new THREE.Vector3(PW,1.2,0),Math.min(1,dt*2));camera.position.copy(camPos);camera.lookAt(camLook);if(camera.fov!==40){camera.fov=40;camera.updateProjectionMatrix();}drawMini();}
  else if(S.kind==='keepy'){keepyStep(dt,t);const p=T[0][10];camera.position.set(p.x+3,2.1,p.z+6);camera.lookAt(p.x,1.0,p.z);if(camera.fov!==45){camera.fov=45;camera.updateProjectionMatrix();}}
  else if(S.kind==='sprint'){sprintStep(dt);const ax=S.sp.x.reduce((a,b)=>a+b,0)/4;camera.position.set(ax+3,7,22);camera.lookAt(ax+3,0.8,0);if(camera.fov!==40){camera.fov=40;camera.updateProjectionMatrix();}}
  if(S)crowdStep(dt,t);}
 // pens/keepy/sprint touch buttons
 function modeBtn(id,down){if(!S)return;const map={left:'KeyA',right:'KeyD',up:'KeyW',shoot:'KeyK',kick:'Space'};modeKey(map[id],down);}
 return{scene:sc,camera,start,stop,update,resize(a){camera.aspect=a;camera.updateProjectionMatrix();},active:()=>!!S,_modeBtn:modeBtn};
}
