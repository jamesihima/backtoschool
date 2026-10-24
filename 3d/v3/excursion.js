import * as THREE from 'three';
import {L,bx,cy,Batch,sunRig} from './look.js';
import {makePerson,poseUpdate,label} from '../common.js';
import {OLUMO,TAJ} from './excursion-data.js';
import {createTaj} from './taj.js';
const RT={'olumo-rock':{short:'Olumo Rock',flight:'Naija Air NA 214 \u00b7 Abuja \u2192 Ibadan',back:'Naija Air NA 215 \u00b7 Ibadan \u2192 Abuja',cruise:['From Ibadan Airport, a coach takes us about an hour and a half to Abeokuta.','Look out of the window: see the clouds? We\u2019re above them!'],cruiseSub:'Switch between Cabin and Outside views. About an hour to Ibadan.',land:'Landing at Ibadan Airport',home:'Coach to Ibadan Airport, then the flight back to Abuja.'},
 'taj-mahal-agra':{short:'the Taj Mahal',flight:'Naija Air NA 801 \u00b7 Abuja \u2192 New Delhi',back:'Naija Air NA 802 \u00b7 New Delhi \u2192 Abuja',cruise:['It\u2019s a long flight to New Delhi, the capital of India. Rest while you can.','From Delhi our coach drives to Agra on the Yamuna Expressway. That takes about three to four hours.'],cruiseSub:'Switch between Cabin and Outside views. A long flight to New Delhi.',land:'Landing in New Delhi',home:'Coach back to Delhi, then the long flight home to Abuja.'}};
// Excursion: airport -> flight (inside/outside views) -> landing -> coach -> Olumo Rock guided trip -> return.
const ct=(w,h,f)=>{const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),V=(x,y,z)=>new THREE.Vector3(x,y,z);
const hsh=(x,y,z)=>{const s=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return s-Math.floor(s);};
function vn(x,y,z){const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=x-ix,fy=y-iy,fz=z-iz,s=t=>t*t*(3-2*t),u=s(fx),v=s(fy),w=s(fz);let r=0;
 for(let a=0;a<2;a++)for(let b=0;b<2;b++)for(let c=0;c<2;c++)r+=hsh(ix+a,iy+b,iz+c)*(a?u:1-u)*(b?v:1-v)*(c?w:1-w);return r;}
const SIGN=(txt,bg,fg,w=512,h=96,font='bold 46px "Atkinson Hyperlegible",sans-serif')=>ct(w,h,(g,W,H)=>{g.fillStyle=bg;g.fillRect(0,0,W,H);g.fillStyle=fg;g.font=font;g.textAlign='center';g.textBaseline='middle';g.fillText(txt,W/2,H/2+2);});
const signMesh=(tex,w,h)=>new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshLambertMaterial({map:tex}));
const CSS=`.ex-hud{position:absolute;inset:0;z-index:8;pointer-events:none;font-family:'Atkinson Hyperlegible',sans-serif;color:#3a2a30;}
.ex-hud .card,.ex-hud button{pointer-events:auto;}
#exLook{position:absolute;inset:0;pointer-events:auto;touch-action:none;}
#exObj{position:absolute;left:10px;top:10px;padding:6px 12px;max-width:min(360px,calc(100% - 20px));font-size:13px;line-height:1.35;}
#exObj b{font-family:'Patrick Hand',cursive;font-size:20px;display:block;line-height:1;}
#exTop{position:absolute;right:10px;top:10px;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;max-width:60%;}
#exTop button{font-size:15px;padding:3px 10px;}
#exDlg{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);width:min(560px,calc(100% - 24px));padding:10px 14px;}
#exDlg .who{font-size:12px;font-weight:700;color:#a8553f;}#exDlg .txt{font-family:'Patrick Hand',cursive;font-size:21px;line-height:1.2;margin:2px 0 6px;}
#exDlg .row{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;}#exDlg button{font-size:16px;padding:3px 12px;}
#exAct{position:absolute;right:16px;bottom:170px;font-size:17px;padding:6px 14px;}
#exJoy{position:absolute;left:22px;bottom:150px;width:120px;height:120px;border-radius:50%;background:rgba(245,234,211,.4);border:2.5px solid rgba(58,42,48,.55);pointer-events:auto;touch-action:none;}
#exJoy div{position:absolute;left:50%;top:50%;width:50px;height:50px;margin:-25px 0 0 -25px;border-radius:50%;background:#f5ead3;border:2.5px solid #3a2a30;box-shadow:0 3px 0 #3a2a30;}
#exFlash{position:absolute;inset:0;background:#fff;opacity:0;transition:opacity .5s;pointer-events:none;}
@media (hover:hover) and (pointer:fine){#exJoy{display:none}#exAct{bottom:150px}}
@media (max-height:520px){#exObj{font-size:12px;padding:4px 10px;max-width:min(300px,45%)}#exObj b{font-size:17px}#exTop button{font-size:13px;padding:2px 8px}
#exJoy{left:calc(14px + env(safe-area-inset-left));bottom:12px;width:100px;height:100px}#exJoy div{width:42px;height:42px;margin:-21px 0 0 -21px}
#exDlg{bottom:8px;width:min(520px,calc(100% - 270px));min-width:260px;padding:6px 10px}#exDlg .txt{font-size:17px}#exDlg button{font-size:14px;padding:2px 10px}
#exAct{right:calc(12px + env(safe-area-inset-right));bottom:12px;font-size:15px}}`;
export function createExcursion(h){
 // ================= shared people =================
 const NAMES=[...h.names,'Ngozi','Segun'].slice(0,10);const SKN=['#5c3520','#7a4a2e','#86553a','#6b3f26'],HR=['short','afro','braids','puffs','bun','short'],TOP=['#c0563f','#4f6e8a','#e3a347','#55745c','#9b86c4','#d9822b','#3f7a8a','#c97a8a','#f2efe6','#6b4a7a'];
 const bagM=L('#3a2a30');
 const mk=(k)=>{const fem=k%2===1;const o=makePerson({skin:SKN[k%4],shirt:TOP[k%10],bottom:fem?'#3f5a7a':'#22252b',trousers:fem?0:1,skirt:fem?1:0,hair:HR[(k*2+1)%6],casual:1},{lod:1});
  const b=new THREE.Mesh(new THREE.BoxGeometry(0.26,0.32,0.13),k%3?bagM:L(TOP[(k+4)%10]));b.position.set(0,0.28,-0.17);b.castShadow=true;o.userData.upper.add(b);return o;};
 const kids=NAMES.map((n,k)=>({n,o:mk(k),x:0,y:0,z:0,ry:0,stuck:0,act:null,k}));
 const coord={n:OLUMO.coordinator,o:makePerson({skin:'#6b3f26',shirt:'#2f6f6a',bottom:'#2b2b33',skirt:1,hair:'wrap',adult:1,glasses:1,casual:1}),x:0,y:0,z:0,ry:0};
 {const u=coord.o.userData;const clip=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.3,0.02),L('#c9a064'));clip.position.set(0,-0.42,0.1);clip.rotation.x=-0.6;(u.elbows&&u.elbows[0]||u.arms[0]).add(clip);
  const lb=label(OLUMO.coordinator+' · Coordinator','#2f6f6a');lb.position.y=2.35;lb.scale.set(2.6,0.42,1);coord.o.add(lb);}
 let you=null;const youLb=label('YOU','#a8553f');youLb.position.y=2.3;
 function buildYou(){if(you&&you.parent)you.parent.remove(you);you=makePerson(h.look());you.add(youLb);}
 // ================= HUD =================
 if(!document.getElementById('ex-css')){const st=document.createElement('style');st.id='ex-css';st.textContent=CSS;document.head.appendChild(st);}
 const hud=document.createElement('div');hud.className='ex-hud';hud.style.display='none';
 hud.innerHTML=`<div id="exLook"></div><div class="card" id="exObj"></div><div id="exTop"></div><div id="exJoy"><div></div></div><button class="btn pri" id="exAct" style="display:none"></button><div class="card" id="exDlg" style="display:none"><div class="who"></div><div class="txt"></div><div class="row"></div></div><div id="exFlash"></div>`;
 document.getElementById('root').appendChild(hud);const $=id=>hud.querySelector('#'+id);
 const K={};let joy=[0,0],camYaw=0.55,camPitch=0.62,camDist=17,cabYaw=-0.35,cabPitch=0;
 const kd=e=>{if(!S)return;const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();K[k]=true;if(k==='e'&&actFn)actFn();};const ku=e=>{K[e.key.toLowerCase()]=false;};
 addEventListener('keydown',kd);addEventListener('keyup',ku);
 {const j=$('exJoy'),kn=j.firstChild;let id=null;const mv=e=>{const r=j.getBoundingClientRect();let dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2;const l=Math.hypot(dx,dy),m=46;if(l>m){dx*=m/l;dy*=m/l;}kn.style.transform=`translate(${dx}px,${dy}px)`;joy=[dx/m,dy/m];};
  j.addEventListener('pointerdown',e=>{e.stopPropagation();id=e.pointerId;j.setPointerCapture(id);mv(e);});j.addEventListener('pointermove',e=>{if(e.pointerId===id)mv(e);});const end=()=>{id=null;joy=[0,0];kn.style.transform='';};j.addEventListener('pointerup',end);j.addEventListener('pointercancel',end);
  const lk=$('exLook');let lid=null,lx=0,ly=0,pin=null;const pts=new Map();
  lk.addEventListener('pointerdown',e=>{pts.set(e.pointerId,[e.clientX,e.clientY]);lk.setPointerCapture(e.pointerId);lid=e.pointerId;lx=e.clientX;ly=e.clientY;if(pts.size===2){const [a,b]=[...pts.values()];pin=Math.hypot(a[0]-b[0],a[1]-b[1]);}});
  lk.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,[e.clientX,e.clientY]);if(pts.size===2&&pin){const [a,b]=[...pts.values()];const d=Math.hypot(a[0]-b[0],a[1]-b[1]);camDist=clamp(camDist*pin/d,8,40);pin=d;return;}if(e.pointerId!==lid)return;
   const dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;if(view==='cabin'){cabYaw-=dx*0.005;cabPitch=clamp(cabPitch-dy*0.004,-0.5,0.5);}else{camYaw-=dx*0.006;camPitch=clamp(camPitch+dy*0.004,0.15,1.3);}});
  const up=e=>{pts.delete(e.pointerId);if(pts.size<2)pin=null;};lk.addEventListener('pointerup',up);lk.addEventListener('pointercancel',up);
  lk.addEventListener('wheel',e=>{camDist=clamp(camDist*(e.deltaY>0?1.1:0.9),8,40);},{passive:true});}
 let actFn=null;function setAct(t,fn){actFn=fn;const b=$('exAct');if(!t){b.style.display='none';return;}if(b._t!==t){b._t=t;b.textContent=t+' (E)';}b.style.display='';b.onclick=fn;}
 function obj(t,s){$('exObj').innerHTML=`<b>${t}</b>${s||''}`;}
 function tops(list){$('exTop').innerHTML=list.map(([id,t,pri])=>`<button class="btn ${pri?'pri':''}" data-b="${id}">${t}</button>`).join('');$('exTop').querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>topAct(b.dataset.b));}
 let dlgQ=null;function say(who,lines,done,btns){const D=$('exDlg');let i=0;const show=()=>{D.style.display='';D.querySelector('.who').textContent=who;D.querySelector('.txt').textContent=lines[i];const last=i===lines.length-1;
   D.querySelector('.row').innerHTML=(last&&btns?btns.map(([t,id])=>`<button class="btn ${id==='go'?'pri':''}" data-d="${id}">${t}</button>`).join(''):'')+(!last||!btns?`<button class="btn pri" data-d="next">${last?'Okay':'Next ▸'}</button>`:'');
   D.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{const id=b.dataset.d;if(id==='next'){if(last){D.style.display='none';dlgQ=null;done&&done('next');}else{i++;show();}}else{D.style.display='none';dlgQ=null;done&&done(id);}});};dlgQ=1;show();}
 const hideDlg=()=>{$('exDlg').style.display='none';dlgQ=null;};
 const flash=()=>{const f=$('exFlash');f.style.transition='none';f.style.opacity=0.95;requestAnimationFrame(()=>{f.style.transition='opacity .6s';f.style.opacity=0;});};
 // ================= audio =================
 let AU=null;function ambience(kind){try{if(AU){AU.stop();AU=null;}if(!kind)return;const ac=new (window.AudioContext||window.webkitAudioContext)();const len=ac.sampleRate*2,buf=ac.createBuffer(1,len,ac.sampleRate),d=buf.getChannelData(0);let l=0;for(let i=0;i<len;i++){l=(l+0.02*(Math.random()*2-1))/1.02;d[i]=l*3.5;}
  const src=ac.createBufferSource();src.buffer=buf;src.loop=true;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=kind==='jet'?700:400;const g=ac.createGain();g.gain.value=kind==='jet'?0.09:0.035;src.connect(lp);lp.connect(g);g.connect(ac.destination);src.start();
  let iv=null;if(kind==='nature')iv=setInterval(()=>{if(Math.random()<0.55){const o=ac.createOscillator(),e=ac.createGain(),t=ac.currentTime,f=2200+Math.random()*1800;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*1.4,t+0.08);o.frequency.exponentialRampToValueAtTime(f*0.9,t+0.16);e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(0.02,t+0.02);e.gain.linearRampToValueAtTime(0,t+0.18);o.connect(e);e.connect(ac.destination);o.start(t);o.stop(t+0.2);}},900);
  AU={stop(){clearInterval(iv);try{ac.close();}catch(e){}},g,lp};}catch(e){}}
 // ================= AIRPORT / FLIGHT scene =================
 const air=new THREE.Scene();air.background=new THREE.Color('#bcd9e8');air.fog=new THREE.Fog('#d4e4ea',300,1800);const aSun=sunRig(air,2.6);aSun.shadow.mapSize.set(2048,2048);
 {const gT=ct(512,512,(g,w,hh)=>{g.fillStyle='#7f9a58';g.fillRect(0,0,w,hh);for(let k=0;k<140;k++){g.fillStyle=['#8aa762','#6f8c4c','#9aa86a','#b5a06a','#7a8f4f'][k%5];const x=(k*97)%w,y=(k*61)%hh;g.fillRect(x,y,30+(k%5)*14,22+(k%7)*10);}});gT.wrapS=gT.wrapT=THREE.RepeatWrapping;gT.repeat.set(60,60);
  const gr=new THREE.Mesh(new THREE.PlaneGeometry(9000,9000),new THREE.MeshLambertMaterial({map:gT}));gr.rotation.x=-Math.PI/2;gr.receiveShadow=true;air.add(gr);}
 air.add(bx(1000,0.1,46,'#4a4a50',0,0.05,0),bx(240,0.1,22,'#55555b',-200,0.05,32));
 {const D=new Batch(new THREE.BoxGeometry(1,0.02,1),L('#f2efe6'),false);for(let x=-480;x<480;x+=24)D.add(x,0.12,0,12,1,0.8);[-21,21].forEach(z=>D.add(0,0.12,z,1000,1,0.5));for(let k=0;k<8;k++){D.add(-470,0.12,-15+k*4.2,18,1,1.6);D.add(470,0.12,-15+k*4.2,18,1,1.6);}D.flush(air);}
 air.add(bx(150,0.1,70,'#8f9096',-200,0.06,75));
 const term=new THREE.Group();term.position.set(-200,0,120);air.add(term);
 term.add(bx(120,12,22,'#e8e4da',0,6,0),bx(122,1,24,'#b8b4aa',0,12.4,0),bx(116,8,0.3,'#5f8aa6',0,5.5,-11.1));{const T=new Batch(new THREE.BoxGeometry(0.3,8,0.3),L('#d9d4c8'));for(let x=-57;x<=57;x+=4)T.add(x,5.5,-11.3);T.flush(term);}
 const tSignT={dep:SIGN('NNAMDI AZIKIWE INTERNATIONAL AIRPORT · ABUJA','#2f6f6a','#fff',1024,96,'bold 40px "Atkinson Hyperlegible",sans-serif'),arr:SIGN('IBADAN AIRPORT','#2f6f6a','#fff',1024,96,'bold 52px "Atkinson Hyperlegible",sans-serif'),del:SIGN('INDIRA GANDHI INTERNATIONAL AIRPORT \u00b7 NEW DELHI','#2f6f6a','#fff',1024,96,'bold 36px "Atkinson Hyperlegible",sans-serif')};
 const tSign=signMesh(tSignT.dep,40,3.8);tSign.position.set(0,10,-11.3);tSign.rotation.y=Math.PI;term.add(tSign);
 const tSign2=signMesh(tSignT.dep,40,3.8);tSign2.position.set(0,10,11.3);term.add(tSign2);
 term.add(bx(130,0.1,14,'#cfc8b8',0,0.06,18));air.add(cy(2.2,3,24,'#e8e4da',-110,12,140,10),cy(6,5,4,'#5f8aa6',-110,26,140,12),cy(6.6,6.6,0.8,'#d9d4c8',-110,28.4,140,12));
 {const T=new Batch(new THREE.IcosahedronGeometry(1,1),L('#ffffff'));const TT=new Batch(new THREE.CylinderGeometry(0.3,0.45,1,6),L('#6b4a2e'));for(let k=0;k<160;k++){const a=k*2.39,r=160+(k%9)*40;const x=Math.cos(a)*r*2.2,z=Math.sin(a)*r+60;if(Math.abs(z)<40)continue;const s=3+(k%4);TT.add(x,s,z,s*0.7,s*2,s*0.7);T.add(x,s*2.6,z,s*1.6,s*1.3,s*1.6,k,['#5f8a4e','#6e9a56','#4f7a45'][k%3]);}T.flush(air);TT.flush(air);}
 // cloud layer
 const clouds=new Batch(new THREE.IcosahedronGeometry(1,2),new THREE.MeshLambertMaterial({color:'#ffffff',emissive:'#ffffff',emissiveIntensity:0.6,transparent:true,opacity:0.95}),false);const CL=[];
 for(let k=0;k<160;k++){const x=(hsh(k,1,2)-0.5)*3000,z=(hsh(k,3,4)-0.5)*1400,y=190+hsh(k,5,6)*45;for(let p=0;p<4;p++){const s=18+hsh(k,p,7)*26;clouds.add(x+p*s*0.9,y+hsh(k,p,8)*8,z+(hsh(k,p,9)-0.5)*s,s*1.4,s*0.45,s);CL.push(1);}}
 const cloudIM=clouds.flush(air);if(cloudIM){cloudIM.visible=false;cloudIM.receiveShadow=false;cloudIM.castShadow=false;}
 // plane
 const plane=new THREE.Group();air.add(plane);const FY=3.2,R=2.2;
 {const W=L('#f4f2ec'),G=L('#2f7a5a'),DK=L('#3a3f48'),ENG=L('#d8dadf');const fus=new THREE.Mesh(new THREE.CylinderGeometry(R,R,26,24,1,true),new THREE.MeshLambertMaterial({color:'#f4f2ec',side:THREE.FrontSide}));fus.rotation.x=Math.PI/2;fus.position.y=FY;fus.castShadow=true;plane.add(fus);
  const nose=new THREE.Mesh(new THREE.SphereGeometry(R,24,14,0,Math.PI*2,0,Math.PI/2),W);nose.rotation.x=Math.PI/2;nose.scale.set(1,1.9,1);nose.position.set(0,FY,13);nose.castShadow=true;plane.add(nose);
  const tail=new THREE.Mesh(new THREE.CylinderGeometry(R,0.45,9,24,1,true),W);tail.rotation.x=Math.PI/2+0.06;tail.position.set(0,FY+0.35,-17.4);tail.castShadow=true;plane.add(tail);
  const cock=new THREE.Mesh(new THREE.BoxGeometry(2.0,0.45,0.9),DK);cock.position.set(0,FY+1.15,15.4);cock.rotation.x=-0.5;plane.add(cock);
  [-1,1].forEach(s=>{const w=new THREE.Mesh(new THREE.BoxGeometry(13,0.35,4.4),W);w.position.set(s*8,FY-1.1,0.5);w.rotation.y=s*0.32;w.castShadow=true;plane.add(w);const tip=new THREE.Mesh(new THREE.BoxGeometry(0.25,1.4,1.2),G);tip.position.set(s*14.2,FY-0.4,-2.6);plane.add(tip);
   const e=new THREE.Mesh(new THREE.CylinderGeometry(0.95,0.8,3.4,16),ENG);e.rotation.x=Math.PI/2;e.position.set(s*5.6,FY-2.1,2.3);e.castShadow=true;plane.add(e);const ei=new THREE.Mesh(new THREE.CircleGeometry(0.8,16),DK);ei.position.set(s*5.6,FY-2.1,4.01);plane.add(ei);
   const hs=new THREE.Mesh(new THREE.BoxGeometry(5,0.25,2.2),W);hs.position.set(s*3,FY+0.9,-19.5);hs.rotation.y=s*0.3;plane.add(hs);
   for(let z=-10.5;z<=11;z+=0.95)if(Math.abs(z-9.6)>0.6){const wn=new THREE.Mesh(new THREE.PlaneGeometry(0.3,0.42),DK);wn.position.set(s*(R+0.006),FY+0.42,z);wn.rotation.y=s*Math.PI/2;plane.add(wn);}
   const st=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.22,24),G);st.position.set(s*(R+0.005),FY-0.15,-0.5);plane.add(st);});
  const fin=new THREE.Mesh(new THREE.BoxGeometry(0.3,5.5,4),G);fin.position.set(0,FY+3.6,-19.6);fin.rotation.x=-0.42;fin.castShadow=true;plane.add(fin);
  const door=new THREE.Mesh(new THREE.BoxGeometry(0.05,1.9,0.95),L('#d4d2cc'));door.position.set(R,FY-0.1,9.6);plane.add(door);
  const nm=signMesh(SIGN('NAIJA AIR','#f4f2ec','#2f7a5a',512,96,'bold 70px "Patrick Hand",cursive'),6,1.1);nm.position.set(R+0.02,FY+1.25,4);nm.rotation.y=Math.PI/2;plane.add(nm);const nm2=nm.clone();nm2.position.x=-R-0.02;nm2.rotation.y=-Math.PI/2;plane.add(nm2);
  const gear=new THREE.Group();plane.add(gear);plane.userData.gear=gear;[[0,11],[-2.6,-0.5],[2.6,-0.5]].forEach(([x,z])=>{gear.add(cy(0.12,0.12,1.4,'#9a9da2',x,FY-R-0.2,z,6));const wh=cy(0.42,0.42,0.35,'#22252b',x,0.42,z,12);wh.rotation.z=Math.PI/2;gear.add(wh);});
  // cabin interior (windows are real holes: look out and see the sky)
  const wT=ct(2048,1024,(g,w,hh)=>{g.fillStyle='#ece6da';g.fillRect(0,0,w,hh);g.fillStyle='#d9d1c2';g.fillRect(0,0,w,hh*0.02);[0.2817,0.7183].forEach(u=>{for(let z=-10.5;z<=11;z+=0.95){const v=z/25+0.5,cx=u*w,cy_=(1-v)*hh;g.clearRect(cx-34,cy_-7,68,14);g.strokeStyle='#bdb5a6';g.lineWidth=3;g.strokeRect(cx-38,cy_-10,76,20);}});});
  const cab=new THREE.Mesh(new THREE.CylinderGeometry(R-0.12,R-0.12,25,32,1,true),new THREE.MeshLambertMaterial({map:wT,side:THREE.BackSide,alphaTest:0.5}));cab.rotation.x=Math.PI/2;cab.position.y=FY;plane.add(cab);
  [[11.8,1],[-12.3,0]].forEach(([z,front])=>{const bh=new THREE.Mesh(new THREE.CircleGeometry(R-0.1,32),new THREE.MeshLambertMaterial({color:'#e2dccf',side:THREE.DoubleSide}));bh.position.set(0,FY,z);plane.add(bh);
   const dr=new THREE.Mesh(new THREE.PlaneGeometry(0.85,1.9),L(front?'#7a8290':'#b9b2a6'));dr.position.set(0,FY-0.15,z+(front?-0.02:0.02));if(front)dr.rotation.y=Math.PI;plane.add(dr);
   if(front){const sg=new THREE.Mesh(new THREE.PlaneGeometry(0.9,0.22),new THREE.MeshBasicMaterial({map:SIGN('FASTEN SEAT BELT','#3a3f48','#f0c24a',512,128,'bold 54px sans-serif')}));sg.position.set(0,FY+1.0,z-0.03);sg.rotation.y=Math.PI;plane.add(sg);}});
  plane.add(bx(3.6,0.1,25,'#4f5a6a',0,FY-1.1,0));const bins=new THREE.Mesh(new THREE.BoxGeometry(3.4,0.05,24),L('#e6e0d4'));bins.position.set(0,FY+1.55,0);plane.add(bins);[-1,1].forEach(s=>{const b=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.5,24),L('#e6e0d4'));b.position.set(s*1.45,FY+1.25,0);plane.add(b);});
  const SB=new Batch(new THREE.BoxGeometry(0.48,0.14,0.46),L('#2f4f7a'),false),SK=new Batch(new THREE.BoxGeometry(0.48,0.7,0.1),L('#2f4f7a'),false);
  for(let z=-8;z<=9;z+=0.86)[-1.25,-0.72,0.72,1.25].forEach(x=>{SB.add(x,FY-0.62,z);SK.add(x,FY-0.25,z-0.26);});SB.flush(plane);SK.flush(plane);
  const cl=new THREE.PointLight('#fff4e0',6,20,1.2);cl.position.set(0,FY+1,2);plane.add(cl);}
 const seatPos=[];for(let z=0.6;z<=6.5;z+=0.86)[-1.25,-0.72,0.72,1.25].forEach(x=>seatPos.push([x,z]));
 // ================= OLUMO ROCK scene =================
 const rock=new THREE.Scene();rock.background=new THREE.Color('#cfe2ea');rock.fog=new THREE.Fog('#e2e6dc',110,380);const rSun=sunRig(rock,2.7);rSun.position.set(40,70,45);rSun.target.position.set(0,0,-10);rSun.shadow.mapSize.set(2048,2048);Object.assign(rSun.shadow.camera,{left:-50,right:50,top:50,bottom:-50,far:260});
 {const g=new THREE.Mesh(new THREE.PlaneGeometry(1400,1400),L('#8c9a5c'));g.rotation.x=-Math.PI/2;g.receiveShadow=true;rock.add(g);}
 const WK=[],OB=[];const rect=(x0,x1,z0,z1,y,tag)=>WK.push({x0,x1,z0,z1,y,tag}),ramp=(x0,x1,z0,z1,ax,ya,yb)=>WK.push({x0,x1,z0,z1,r:1,ax,ya,yb});
 rect(-16,44,0,32,0,'plaza');rect(14,24,-12,0,0,'east');ramp(-6,-3.5,-7,0,'z',5,0);rect(-14,0,-11,-7,5,'t1');ramp(0,7,-10,-8,'x',5,10);rect(7,14,-14,-8,10,'t2');rect(14,16,-10.5,-8.5,10,'bridge');
 ramp(9,11.5,-20,-14,'z',15,10);rect(-4,12,-24,-20,15,'t3');rect(-12,-4,-24,-19,15,'cave');ramp(-3,-0.5,-28,-24,'z',20,15);rect(-8,4,-34,-28,20,'t4');
 const sY=(s,x,z)=>s.r?s.ya+(s.yb-s.ya)*(s.ax==='x'?(x-s.x0)/(s.x1-s.x0):(z-s.z0)/(s.z1-s.z0)):s.y;
 function hAt(x,z,cur){let best=null,bd=1e9;for(const s of WK){if(x>=s.x0&&x<=s.x1&&z>=s.z0&&z<=s.z1){const y=sY(s,x,z),d=Math.abs(y-cur);if(d<bd){bd=d;best=y;}}}if(bd>0.9)return null;for(const o of OB)if(x>o[0]&&x<o[2]&&z>o[1]&&z<o[3]&&Math.abs(best-o[4])<1.2)return null;return best;}
 const tagAt=(x,z,y)=>{for(const s of WK)if(!s.r&&x>=s.x0&&x<=s.x1&&z>=s.z0&&z<=s.z1&&Math.abs(s.y-y)<0.5)return s.tag;return null;};
 const ob=(x0,z0,x1,z1,y=0)=>OB.push([x0,z0,x1,z1,y]);
 // granite blobs
 const rockMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.93,metalness:0}),roofMat=rockMat.clone();roofMat.transparent=true;
 const blobG=[0,1,2,3,4,5].map(sd=>{const ge=new THREE.IcosahedronGeometry(1,3),p=ge.attributes.position,col=new Float32Array(p.count*3),v=new THREE.Vector3(),c=new THREE.Color(),A=new THREE.Color('#857b72'),B=new THREE.Color('#c2a67e'),D=new THREE.Color('#4f463f');
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const n=vn(v.x*1.7+sd*7,v.y*1.7,v.z*1.7)*0.22+vn(v.x*5+sd,v.y*5,v.z*5)*0.06;v.multiplyScalar(0.86+n);if(v.y<-0.4)v.y=-0.4-(v.y+0.4)*0.3;p.setXYZ(i,v.x,v.y,v.z);
   const t=vn(v.x*3+sd*3,v.y*6,v.z*3);c.copy(A).lerp(B,clamp(t*1.3-0.15+v.y*0.25,0,1));const cr=vn(v.x*9+sd,v.y*2.5,v.z*9);if(cr>0.72)c.lerp(D,(cr-0.72)*2.6);col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}
  ge.setAttribute('color',new THREE.BufferAttribute(col,3));ge.computeVertexNormals();{const nA=ge.attributes.normal,acc=new Map(),key=i=>`${Math.round(p.getX(i)*1e3)},${Math.round(p.getY(i)*1e3)},${Math.round(p.getZ(i)*1e3)}`;for(let i=0;i<p.count;i++){const k=key(i),a=acc.get(k)||[0,0,0];a[0]+=nA.getX(i);a[1]+=nA.getY(i);a[2]+=nA.getZ(i);acc.set(k,a);}for(let i=0;i<p.count;i++){const a=acc.get(key(i)),l=Math.hypot(a[0],a[1],a[2])||1;nA.setXYZ(i,a[0]/l,a[1]/l,a[2]/l);}}return ge;});
 const samples=[];WK.forEach(s=>{for(let x=s.x0+0.3;x<s.x1;x+=0.9)for(let z=s.z0+0.3;z<s.z1;z+=0.9){const y=sY(s,x,z);if(s.tag==='plaza'&&z>3)continue;samples.push([x,y,z]);}});
 const roofs=[];let bi=0;
 function blob(cx,cyy,cz,rx,ry,rz,opt={}){for(let tries=0;tries<7;tries++){let hit=false;const m=1.12;for(const [x,y,z] of samples){for(const dy of [0.2,1.2,2.3]){const a=(x-cx)/(rx*m),b=(y+dy-cyy)/(ry*m),c=(z-cz)/(rz*m);if(a*a+b*b+c*c<1){hit=true;break;}}if(hit)break;}
   if(!hit){const me=new THREE.Mesh(blobG[bi++%6],opt.roof?roofMat:rockMat);me.position.set(cx,cyy,cz);me.scale.set(rx,ry,rz);me.rotation.y=hsh(cx,cz,1)*6;me.castShadow=true;me.receiveShadow=true;rock.add(me);if(opt.roof)roofs.push(me);return me;}
   if(opt.fixed)return null;rx*=0.84;ry*=0.84;rz*=0.84;cyy*=0.95;}return null;}
 // supports under terraces + main mass
 blob(-7,1.4,-9,7.5,3.4,3.6);blob(10.5,4.5,-11,4.6,5.2,4.2);blob(4,7,-22,9,7.6,3.6);blob(-2,10.5,-31,6.8,9.2,4.2);blob(-8,6.8,-21.5,5,7.6,3.2);
 for(let x=-26;x<=22;x+=3.6)for(let z=-46;z<=-6;z+=3.6){const jx=x+(hsh(x,z,2)-0.5)*2.4,jz=z+(hsh(x,z,3)-0.5)*2.4;const dx=(jx+3)/25,dz=(jz+26)/20,d2=dx*dx+dz*dz;if(d2>1)continue;const H=3+25*Math.pow(1-d2,0.75)+(hsh(x,z,4)-0.5)*4;
  const r=2.8+hsh(x,z,5)*2.8;blob(jx,H*0.5,jz,r*1.15,H*0.56,r);}
 for(let k=0;k<26;k++){const x=-24+k*1.9+(hsh(k,1,1)-0.5),z=-4.5+(hsh(k,2,2)-0.5)*3;const s=1.2+hsh(k,3,3)*2.2;blob(x,s*0.6,z,s*1.3,s,s);}
 blob(-8,19.6,-21.5,6.4,1.8,4.4,{roof:1,fixed:1});blob(-11,18,-20,3.5,2.2,3,{roof:1});
 // cave walls dim light + floor
 {const cl=new THREE.PointLight('#ffc98a',5,9,1.6);cl.position.set(-8,17,-21.5);rock.add(cl);const fl=new THREE.Mesh(new THREE.PlaneGeometry(8,5),L('#6e5a48'));fl.rotation.x=-Math.PI/2;fl.position.set(-8,15.02,-21.5);rock.add(fl);
  const mouth=new THREE.Mesh(new THREE.CircleGeometry(1.4,20),new THREE.MeshBasicMaterial({color:'#1e1714'}));mouth.scale.y=1.2;mouth.position.set(-11,6.4,-11.3);rock.add(mouth);}
 // terraces, stairs, railings
 const CON='#d9cdb8',railM=L('#8d9096');const inst=(geo,mat,ms)=>{const im=new THREE.InstancedMesh(geo,mat,ms.length);ms.forEach((m,i)=>im.setMatrixAt(i,m));im.castShadow=true;im.receiveShadow=true;rock.add(im);return im;};
 const postM=[],barM=[],stepM=[];const q=new THREE.Quaternion(),up=V(0,1,0);
 function rail(ax,ay,az,bx_,by,bz){const a=V(ax,ay,az),b=V(bx_,by,bz),L_=a.distanceTo(b),n=Math.max(1,Math.round(L_/1.4));for(let i=0;i<=n;i++){const p=a.clone().lerp(b,i/n);postM.push(new THREE.Matrix4().compose(V(p.x,p.y+0.5,p.z),q.identity(),V(1,1,1)));}
  [1.0,0.55].forEach(hh=>{const mid=a.clone().add(b).multiplyScalar(0.5);mid.y+=hh;const dir=b.clone().sub(a).normalize();const qq=new THREE.Quaternion().setFromUnitVectors(V(0,0,1),dir);barM.push(new THREE.Matrix4().compose(mid,qq,V(1,1,L_)));});}
 WK.forEach(s=>{if(s.tag==='plaza'||s.tag==='east')return;if(!s.r){if(s.tag!=='cave'){const sl=bx(s.x1-s.x0,0.5,s.z1-s.z0,CON,(s.x0+s.x1)/2,s.y-0.25,(s.z0+s.z1)/2);rock.add(sl);}else{}return;}
  const len=s.ax==='x'?s.x1-s.x0:s.z1-s.z0,n=Math.ceil(len/0.42),w=s.ax==='x'?s.z1-s.z0:s.x1-s.x0;for(let i=0;i<n;i++){const t=(i+0.5)/n,y=s.ya+(s.yb-s.ya)*t;const p=s.ax==='x'?V(s.x0+t*len,y-0.12,(s.z0+s.z1)/2):V((s.x0+s.x1)/2,y-0.12,s.z0+t*len);const hg=y-(Math.min(s.ya,s.yb)-0.6);p.y=y-hg/2;stepM.push(new THREE.Matrix4().compose(p,q.identity(),s.ax==='x'?V(len/n+0.02,hg,w):V(w,hg,len/n+0.02)));}
  const lo=V(s.x0,0,s.z0),hi=s.ax==='x'?V(s.x1,0,s.z0):V(s.x0,0,s.z1);[0,1].forEach(side=>{if(s.ax==='x'){const z=side?s.z1:s.z0;rail(s.x0,s.ya,z,s.x1,s.yb,z);}else{const x=side?s.x1:s.x0;rail(x,s.ya,s.z0,x,s.yb,s.z1);}});});
 rail(-14,5,-7,-6,5,-7);rail(-3.5,5,-7,0,5,-7);rail(-14,5,-11,-14,5,-7);rail(7,10,-8,14,10,-8);rail(14,10,-14,14,10,-10.5);rail(7,10,-14,9,10,-14);rail(11.5,10,-14,14,10,-14);rail(14,10,-8.5,16,10,-8.5);rail(14,10,-10.5,16,10,-10.5);
 rail(-4,15,-20,9,15,-20);rail(11.5,15,-20,12,15,-20);rail(12,15,-24,12,15,-20);rail(-0.5,15,-24,12,15,-24);
 rail(-8,20,-28,-3,20,-28);rail(-0.5,20,-28,4,20,-28);rail(-8,20,-34,4,20,-34);rail(-8,20,-34,-8,20,-28);rail(4,20,-34,4,20,-28);
 inst(new THREE.BoxGeometry(1,1,1),L(CON),stepM);inst(new THREE.CylinderGeometry(0.05,0.05,1,6),railM,postM);inst(new THREE.BoxGeometry(0.06,0.06,1),railM,barM);
 rock.add(bx(2,0.5,2,CON,15,9.75,-9.5));// bridge slab
 // glass lift tower (works: take it up/down)
 {const g=new THREE.Group();g.position.set(17.5,0,-9.5);rock.add(g);const S='#4e5258';[[-1.5,-1.5],[1.5,-1.5],[-1.5,1.5],[1.5,1.5]].forEach(([x,z])=>g.add(bx(0.25,12.6,0.25,S,x,6.3,z)));for(let y=1;y<12;y+=2.2)[-1.5,1.5].forEach(z=>{const d=bx(0.08,0.08,3.6,S,-1.5,y+1,z*0);d.rotation.x=0;g.add(bx(3,0.1,0.1,S,0,y,z),bx(0.1,0.1,3,S,z,y,0));});
  const gl=new THREE.Mesh(new THREE.BoxGeometry(2.4,12,2.4),new THREE.MeshStandardMaterial({color:'#9fd3df',transparent:true,opacity:0.35,roughness:0.1}));gl.position.y=6;g.add(gl);g.add(bx(3.4,0.3,3.4,S,0,12.6,0));ob(16,-11,19,-8,0);}
 // plaza: tourist centre, gift shop, fountain, café, gate, parking
 {const pv=new THREE.Mesh(new THREE.PlaneGeometry(38,22),L('#e6ddcb'));pv.rotation.x=-Math.PI/2;pv.position.set(4,0.02,11);pv.receiveShadow=true;rock.add(pv);const pk=new THREE.Mesh(new THREE.PlaneGeometry(30,20),L('#b5654a'));pk.rotation.x=-Math.PI/2;pk.position.set(32,0.03,21);rock.add(pk);
  const PL=new Batch(new THREE.BoxGeometry(1,0.02,1),L('#f2efe6'),false);for(let x=20;x<=44;x+=3.4)PL.add(x,0.05,15.5,0.12,1,4);PL.flush(rock);
  rock.add(bx(12,4.2,7,'#e3a347',11,2.1,6.5),bx(12.6,0.5,7.6,'#c98a3c',11,4.45,6.5),bx(10,2,0.1,'#46606c',11,1.8,10.05));const ts=signMesh(SIGN('OLUMO ROCK TOURIST CENTRE','#f5ead3','#3a2a30',1024,128,'bold 60px "Atkinson Hyperlegible",sans-serif'),7,0.9);ts.position.set(11,3.6,10.06);rock.add(ts);ob(5,3,17,10.2);
  rock.add(bx(6,3.2,5,'#d9cdb8',-9,1.6,10.5),bx(6.4,0.3,5.4,'#b8ab94',-9,3.35,10.5));const aw=bx(6.2,0.08,1.2,'#c0563f',-9,2.6,13.4);aw.rotation.x=0.35;rock.add(aw);const gs=signMesh(SIGN('GIFT SHOP','#f5ead3','#a8553f'),3.2,0.6);gs.position.set(-9,2.95,13.05);rock.add(gs);ob(-12,8,-6,13.1);
  rock.add(cy(2.4,2.6,0.7,'#d9d4c8',2,0.35,15,24),cy(2.1,2.1,0.1,'#6fb3c9',2,0.66,15,24),cy(0.4,0.6,1.6,'#d9d4c8',2,1.2,15,12),cy(1.0,1.0,0.25,'#d9d4c8',2,2.0,15,16),cy(0.25,0.25,0.8,'#9fd3df',2,2.5,15,10));ob(-0.6,12.4,4.6,17.6);
  [[9,15],[12.5,16.5],[9.5,19],[13,20]].forEach(([x,z],k)=>{const um=new THREE.Mesh(new THREE.ConeGeometry(1.5,0.6,8),L(['#e3a347','#55745c','#c0563f','#4f6e8a'][k]));um.position.set(x,2.5,z);um.castShadow=true;rock.add(um,cy(0.05,0.05,2.4,'#3a2a30',x,1.2,z,5),cy(0.6,0.6,0.06,'#f2efe6',x,0.75,z,12));ob(x-0.7,z-0.7,x+0.7,z+0.7);});
  rock.add(bx(9,3.4,6,'#efe2c6',22,1.7,6),bx(9.6,0.25,6.6,'#b5573e',22,3.5,6));{const rf=new THREE.ConeGeometry(1,1.6,4);rf.rotateY(Math.PI/4);const m=new THREE.Mesh(rf,L('#b5573e'));m.scale.set(7,1,4.6);m.position.set(22,4.4,6);m.castShadow=true;rock.add(m);}ob(17.5,3,26.5,9);
  rock.add(bx(2.6,2.6,2.6,'#efe2c6',19,1.3,26),bx(3,0.2,3,'#b5573e',19,2.7,26),bx(5,0.15,0.15,'#d9b14a',23,1.2,26));ob(17.7,24.7,20.3,27.3);
  const HD=new Batch(new THREE.BoxGeometry(1,1,1),L('#5f7f4e'));[[4,3.4,36,0.8],[4,27,36,0.8]].forEach(([x,z,w,d])=>HD.add(x,0.4,z,w,0.8,d));HD.add(-15.5,0.4,15,0.8,0.8,26);HD.flush(rock);
  const BN=new Batch(new THREE.BoxGeometry(1.6,0.1,0.45),L('#8a6243'));[[-3,20],[6,24],[-6,24],[14,24]].forEach(([x,z])=>{BN.add(x,0.45,z);ob(x-0.8,z-0.25,x+0.8,z+0.25);});BN.flush(rock);
  const info=signMesh(SIGN('MEETING POINT','#2f6f6a','#fff',512,96),2.2,0.42);info.position.set(-1,2.2,5.3);rock.add(info,cy(0.06,0.06,2.2,'#3a2a30',-1,1.1,5.2,6));
  // parked buses & cars
  const busG=(col)=>{const g=new THREE.Group();g.add(bx(9,2.4,2.4,col,0,1.6,0),bx(8.6,0.9,2.42,'#2f3c44',-0.2,2.1,0),bx(9.05,0.3,2.45,'#3a2a30',0,0.55,0));[-3,3].forEach(x=>[-1.1,1.1].forEach(z=>{const w=cy(0.48,0.48,0.3,'#22252b',x,0.48,z,12);w.rotation.x=Math.PI/2;g.add(w);}));return g;};
  [[38,25.5],[38,28.8]].forEach(([x,z])=>{const b=busG('#e8b33c');b.position.set(x,0,z);b.rotation.y=Math.PI/2*0;rock.add(b);});
  const CR=new Batch(new THREE.BoxGeometry(4,1.3,1.9),L('#ffffff'));[[24,13.6],[27.4,13.6],[34.2,13.6],[37.6,13.6],[41,13.6]].forEach(([x,z],k)=>CR.add(x,0.75,z,1,1,1,Math.PI/2,['#c0563f','#4f6e8a','#f2efe6','#55745c','#8d9096'][k]));CR.flush(rock);
  rock.userData.coach=busG('#e8b33c');rock.add(rock.userData.coach);}
 // stop signs
 const SIGNS=[[0,-1,5.3],[1,-8.5,-10.4,5],[2,12.6,-12.8,10],[3,-6.5,-23,15],[4,2.6,-32.8,20]];SIGNS.forEach(([i,x,z,y=0])=>{if(i===0)return;rock.add(bx(1.4,1,0.1,'#6b4a2e',x,y+1.3,z),cy(0.05,0.05,1.3,'#3a2a30',x-0.5,y+0.6,z,5),cy(0.05,0.05,1.3,'#3a2a30',x+0.5,y+0.6,z,5));const t=signMesh(SIGN(OLUMO.stops[i].sign[0].toUpperCase(),'#f2e6cc','#3a2a30',512,128,'bold 30px "Atkinson Hyperlegible",sans-serif'),1.3,0.36);t.position.set(x,y+1.55,z+0.06);rock.add(t);});
 // trees, city, hills
 {const TT=new Batch(new THREE.CylinderGeometry(0.25,0.4,1,6),L('#6b4a2e')),TL=new Batch(new THREE.IcosahedronGeometry(1,1),L('#ffffff'));const tree=(x,z,s)=>{TT.add(x,1.6*s,z,s,3.2*s,s);TL.add(x,3.8*s,z,2.3*s,1.6*s,2.3*s,x*z,['#5f8a4e','#6e9a56','#4f7a45','#7aa35e'][Math.abs(Math.round(x*3+z))%4]);};
  for(let k=0;k<70;k++){const a=k*2.4,r=34+(k%6)*5;const x=-4+Math.cos(a)*r*1.1,z=-24+Math.sin(a)*r*0.9;if(z>-2&&x>-18&&x<46)continue;tree(x,z,1+hsh(k,1,1)*0.6);}
  [[-14,20],[-14,28],[-12,4.5],[24,0],[28,12],[44,10],[44,30],[-2,29],[30,30],[17,30]].forEach(([x,z],k)=>tree(x,z,1.1));
  const HS=new Batch(new THREE.BoxGeometry(1,1,1),L('#ffffff')),RF=new Batch((()=>{const g=new THREE.ConeGeometry(0.75,0.5,4);g.rotateY(Math.PI/4);return g;})(),L('#ffffff'));
  for(let k=0;k<700;k++){const a=hsh(k,2,9)*Math.PI*2,r=60+Math.pow(hsh(k,5,1),0.7)*240;const x=Math.cos(a)*r,z=Math.sin(a)*r-20;if(z>-10&&z<50&&x>-30&&x<70)continue;const w=4+hsh(k,1,3)*5,d=4+hsh(k,4,4)*5,hh=2.6+hsh(k,7,7)*3,ry=Math.round(hsh(k,8,8)*3)*Math.PI/2+(hsh(k,9,9)-0.5)*0.3;
   HS.add(x,hh/2,z,w,hh,d,ry,['#efe2c6','#e3c79a','#f2efe6','#d9b58a','#cfc2a8'][k%5]);RF.add(x,hh+0.6*1.2,z,w*0.98,2.4,d*0.98,ry,['#b5573e','#a8553f','#9c9a94','#8a4a3a','#c26a4a'][k%5]);if(k%3===0)tree(x+w,z+d,1.2);}
  HS.flush(rock);RF.flush(rock);TT.flush(rock);TL.flush(rock);
  const mq=new THREE.Group();mq.position.set(90,0,-60);rock.add(mq);mq.add(bx(16,7,14,'#efe6d2',0,3.5,0));const dm=new THREE.Mesh(new THREE.SphereGeometry(5,20,12,0,Math.PI*2,0,Math.PI/2),L('#e6dcc4'));dm.position.y=7;mq.add(dm);[-9,9].forEach(x=>{mq.add(cy(0.8,1,22,'#efe6d2',x,11,6,12));const c=new THREE.Mesh(new THREE.ConeGeometry(1,2.4,12),L('#e6dcc4'));c.position.set(x,23.2,6);mq.add(c);});
  for(let k=0;k<9;k++){const a=k/9*Math.PI*2,r=330;const hl=new THREE.Mesh(new THREE.SphereGeometry(1,16,8),L('#a7b495'));hl.scale.set(80,22,60);hl.position.set(Math.cos(a)*r,-6,Math.sin(a)*r-20);rock.add(hl);}}
 // ================= state =================
 let S=null,view='out';const scenes={air,rock};
 const camera=new THREE.PerspectiveCamera(52,1,0.2,4000);
 const putIn=(sc,o)=>{if(o.parent!==sc)sc.add(o);};
 function start(opts){stop(true);buildYou();hud.style.display='';S={ph:'assembly',t:0,st:'ASSEMBLING',sc:air,ret:false,stop:-1,quiz:0,qn:0,photos:{},done:{},opts,trail:[],chatT:6,warnT:0,dest:RT[opts.dest]?opts.dest:'olumo-rock'};S.R=RT[S.dest];
  kids.forEach(k=>putIn(air,k.o));putIn(air,coord.o);putIn(air,you);plane.visible=true;plane.position.set(-205,0,62);plane.rotation.set(0,Math.PI,0);plane.userData.gear.visible=true;tSign.material.map=tSignT.dep;tSign2.material.map=tSignT.dep;
  kids.forEach((k,i)=>{k.x=-212+(i%5)*1.5;k.z=136+Math.floor(i/5)*1.6;k.y=0;k.ry=Math.PI;});coord.x=-205;coord.z=133.5;coord.ry=0;S.px=-206;S.pz=138;view='out';ambience(null);
  obj('Assembly point','Abuja airport forecourt · Mrs. Adebayo is taking the roll.');tops([['skip','Skip to '+S.R.short+' ▸▸',1],['quit','Cancel trip']]);
  setTimeout(()=>rollCall(),700);}
 function rollCall(){S.st='TAKING_ATTENDANCE';let i=0;const next=()=>{if(!S||S.ph!=='assembly')return;if(i<kids.length){const n=kids[i].n;h.toast(`${OLUMO.coordinator}: "${n}?"  ${n}: "Present!"`);kids[i].o.userData.kick=0.3;i++;setTimeout(next,520);}
   else say(OLUMO.coordinator,['And our last name\u2026 are you here?'],()=>{},[['Present, ma!','go']]);};
  say(OLUMO.coordinator,['Good morning! Our bus has dropped us at the airport. Before we check in: roll call.'],()=>next());
  const _say=say;S.after=id=>{};$('exDlg').addEventListener('click',function f(e){if(e.target.dataset&&e.target.dataset.d==='go'&&S&&S.ph==='assembly'){$('exDlg').removeEventListener('click',f);toBoard();}});}
 function toBoard(){S.ph='boarding';S.st='BOARDING';S.t=0;h.sfx&&h.sfx('coin');say(OLUMO.coordinator,['Everyone is here. Stay together, follow me to the plane, and hold the railing on the stairs.'],null);
  obj('Boarding','Walk out to the plane with your class. Climb the stairs at the front door.');S.stairs=V(-205+(-2.2-1.2),0,62-9.6);
  plane.userData.stair=plane.userData.stair||(()=>{const s=new THREE.Group();for(let k=0;k<10;k++)s.add(bx(1.2,0.12,0.45,'#d9d4c8',0,0.3+k*0.3,k*0.32));s.add(bx(0.06,3.6,0.06,'#8d9096',0.6,1.8,1.6),bx(0.06,3.6,0.06,'#8d9096',-0.6,1.8,1.6),bx(1.6,0.5,3.6,'#e8b33c',0,0.25,0.6));air.add(s);return s;})();
  const st=plane.userData.stair;st.visible=true;st.position.set(-205-(2.2+0.4),0,62-9.6-3.6);st.rotation.y=0;}
 function topAct(id){if(!S)return;if(id==='skip'){hideDlg();if(S.ret)return finishTrip();return arriveDest();}if(id==='quit'){if((S.ph==='rock'||S.ph==='taj')&&!S.ret)return S.done.final?null:confirmLeave();h.onEnd({cancelled:true});return stop();}
  if(S.ph==='taj'){return TJ&&TJ.top(id);}
  if(id==='view'){view=view==='cabin'?'out':'cabin';paintTop();}if(id==='regroup'){const c=coord;S.px=c.x+1.5;S.pz=c.z+1.5;S.py=c.y;h.toast('You hurry back to the group.');}if(id==='photo'){photo();}}
 function confirmLeave(){say(OLUMO.coordinator,['You want to leave early? We\u2019ll head straight back to the bus together. Are you sure?'],id=>{if(id==='go')startReturn();},[['Stay','no'],['Yes, head back','go']]);}
 function paintTop(){if(S.ph==='taj')return TJ.paintTop();const t=[];if(['takeoff','cruise','landing','rtakeoff','rcruise','rland'].includes(S.ph))t.push(['view',view==='cabin'?'Outside view':'Cabin view']);if(S.ph==='rock'){t.push(['photo','Camera']);t.push(['regroup','Return to group']);}
  t.push(['skip',S.ret?'Skip to school ▸▸':'Skip to '+S.R.short+' ▸▸',1]);if(S.ph==='rock'&&S.st!=='FINAL_HEADCOUNT')t.splice(t.length-1,1);if(!S.ret||S.ph!=='rock')t.push(['quit',S.ph==='rock'?'Leave trip':'Cancel trip']);tops(t);}
 // ---------- transit animation ----------
 function setPhase(p){S.ph=p;S.t=0;S.sc=air;hideDlg();if(p==='takeoff'||p==='rtakeoff'){hideDlg();kids.forEach(k=>putIn(air,k.o));plane.userData.stair&&(plane.userData.stair.visible=false);plane.position.set(-430,0,0);plane.rotation.set(0,Math.PI/2,0);plane.userData.gear.visible=true;S.v=0;seatEveryone();ambience('jet');
   obj(p==='takeoff'?'Take-off':'Flying home',S.ret?S.R.back:S.R.flight);h.toast('Captain: "Cabin crew, prepare for take-off."');}
  if(p==='cruise'||p==='rcruise'){plane.position.set(0,300,0);plane.rotation.set(0,Math.PI/2,0);plane.userData.gear.visible=false;if(cloudIM)cloudIM.visible=true;air.fog.near=600;air.fog.far=3200;air.background.set('#9ec8e6');
   obj('Cruising at 30,000 ft',S.R.cruiseSub);setTimeout(()=>S&&S.ph===p&&say(OLUMO.coordinator,S.ret?['What a day. Rest now; we land in Abuja soon.']:S.R.cruise),2000);}
  if(p==='landing'||p==='rland'){if(cloudIM)cloudIM.visible=false;air.fog.near=300;air.fog.far=1800;air.background.set('#bcd9e8');plane.userData.gear.visible=true;const m=S.ret?tSignT.dep:S.dest==='taj-mahal-agra'?tSignT.del:tSignT.arr;tSign.material.map=m;tSign2.material.map=m;tSign.material.needsUpdate=tSign2.material.needsUpdate=true;
   plane.position.set(-1300,150,0);plane.rotation.set(0,Math.PI/2,0);S.v=75;obj(S.ret?'Landing in Abuja':S.R.land,'Seat belts on. Watch the runway come up to meet you.');h.toast('Captain: "Cabin crew, seats for landing."');}
  paintTop();}
 function seatEveryone(){const all=[...kids,coord];all.forEach((p,i)=>{putIn(plane,p.o);const [x,z]=seatPos[i+1]||seatPos[0];p.o.position.set(x,FY-1.05,z);p.o.rotation.set(0,0,0);p.seat=1;});putIn(plane,you);const [x,z]=seatPos[0];you.position.set(x,FY-1.05,z);you.rotation.set(0,0,0);youLb.visible=false;}
 function unseat(sc){[...kids,coord,{o:you}].forEach(p=>{p.seat=0;putIn(sc,p.o);p.o.rotation.set(0,0,0);const u=p.o.userData;u.rig.position.y=0;u.legs.forEach(l=>l.rotation.x=0);(u.knees||[]).forEach(k=>k.rotation.x=0);u.upper.rotation.x=0;p.o.visible=true;});youLb.visible=true;}
 function transit(dt,t){const P=plane;
  if(S.ph==='assembly'){[...kids,coord].forEach(p=>{p.o.position.set(p.x,0,p.z);p.o.rotation.y=p.ry;poseUpdate(p.o,dt,false,null);});you.position.set(S.px,0,S.pz);you.rotation.y=Math.PI;poseUpdate(you,dt,false);
   aSun.position.set(-150,120,170);aSun.target.position.set(-205,0,110);camera.position.set(-197,3.6,147);camera.lookAt(-207,1.3,136);return;}
  if(S.ph==='boarding'){S.t+=dt;const st=V(-207.6,0,46.6);const path=(i,tt)=>{const a=V(-212+(i%5)*1.5,0,134+Math.floor(i/5)*1.6),door=V(-207.6,0,97);const k=clamp(tt,0,1);return k<0.4?a.lerp(door,k/0.4):door.lerp(st,(k-0.4)/0.6);};
   [...kids,coord].forEach((p,i)=>{const tt=(S.t-i*0.55)/9;const pos=path(i,tt);const nx=path(i,tt+0.01);p.o.visible=tt<1;p.o.position.copy(pos);if(tt<1){p.o.rotation.y=Math.atan2(nx.x-pos.x,nx.z-pos.z);poseUpdate(p.o,dt,tt>0,null,1.2);}});
   const yt=(S.t-6.5)/9,yp=path(11,yt),yn=path(11,yt+0.01);you.position.copy(yp);if(yt<1){you.rotation.y=Math.atan2(yn.x-yp.x,yn.z-yp.z);poseUpdate(you,dt,yt>0,null,1.2);}you.visible=yt<1;
   aSun.position.set(-150,120,120);aSun.target.position.set(-205,0,70);camera.position.lerp(V(-190,10,80),Math.min(1,dt*1.5));camera.lookAt(-207,2,60);
   if(S.t>16.5){[...kids,coord].forEach(p=>p.o.visible=true);you.visible=true;setPhase('takeoff');}return;}
  if(S.ph==='takeoff'||S.ph==='rtakeoff'){S.t+=dt;S.v=Math.min(78,S.v+dt*7);P.position.x+=S.v*dt;let pitch=0;if(S.v>62){pitch=Math.min(0.2,(S.v-62)*0.02+S.t*0.0);P.position.y+=S.v*Math.sin(Math.min(0.17,P.rotation.x? 0.17:0.17))*dt*((S.v-62)/16);}
   if(P.position.y>40)P.userData.gear.visible=false;P.rotation.set(0,Math.PI/2,0);P.rotateX(-clamp((S.v-62)*0.012,0,0.18));if(AU)AU.lp.frequency.value=500+S.v*6;if(S.t>17)setPhase(S.ret?'rcruise':'cruise');}
  else if(S.ph==='cruise'||S.ph==='rcruise'){S.t+=dt;P.position.x+=70*dt;P.position.y=300+Math.sin(S.t*0.4)*0.6;P.rotation.set(0,Math.PI/2,0);P.rotateZ(Math.sin(S.t*0.3)*0.03);if(cloudIM)cloudIM.position.x=Math.floor((P.position.x)/3000)*3000;
   if(S.t>(S.ret?12:20))setPhase(S.ret?'rland':'landing');}
  else if(S.ph==='landing'||S.ph==='rland'){S.t+=dt;const x0=-1300,xT=-380;if(P.position.x<xT){P.position.x+=S.v*dt;const k=(P.position.x-x0)/(xT-x0);P.position.y=150*(1-k)+0.0;P.rotation.set(0,Math.PI/2,0);P.rotateX(0.055-k*0.12);}
   else{S.v=Math.max(0,S.v-dt*14);P.position.x+=S.v*dt;P.position.y=0;P.rotation.set(0,Math.PI/2,0);if(!S.touch){S.touch=1;h.toast('Touchdown! The class claps.');kids.forEach(k=>k.o.userData.kick=0.4);}
    if(S.v<=0&&!S.landDone){S.landDone=1;ambience(null);if(S.ret)setTimeout(()=>S&&finishTrip(),1500);else setTimeout(()=>S&&arriveDest(),1500);}}}
  // seated passengers
  if(['takeoff','cruise','landing','rtakeoff','rcruise','rland'].includes(S.ph)){[...kids,coord].forEach((p,i)=>{poseUpdate(p.o,dt,false,'chat');p.o.userData.head.rotation.y=Math.sin(t*0.7+i)*0.5;});poseUpdate(you,dt,false,'chat');you.visible=view!=='cabin';
   P.updateMatrixWorld(true);aSun.position.copy(P.position).add(V(60,120,50));aSun.target.position.copy(P.position);
   if(view==='cabin'){const eye=V(0,FY+0.55,seatPos[0][1]-1.2);const dir=V(Math.sin(cabYaw)*Math.cos(cabPitch),Math.sin(cabPitch),Math.cos(cabYaw)*Math.cos(cabPitch));camera.position.copy(P.localToWorld(eye.clone()));camera.lookAt(P.localToWorld(eye.clone().add(dir)));camera.near=0.05;}
   else{camera.near=0.5;const off=V(Math.sin(camYaw+Math.PI)*camDist*3.2,camDist*Math.sin(camPitch)*2.2,Math.cos(camYaw+Math.PI)*camDist*3.2);const tgt=P.position.clone().add(V(0,FY,0));camera.position.copy(tgt.clone().add(off.applyAxisAngle(V(0,1,0),P.rotation.y)));if(camera.position.y<2)camera.position.y=2;camera.lookAt(tgt);}camera.updateProjectionMatrix();}}
 // ---------- rock ----------
 const ROUTE=[[[2,6],[-4.75,1],[-4.75,-7.6],[-7,-8.8]],[[-1,-9],[0.5,-9],[7.6,-9],[10.8,-10.6]],[[10.25,-13.2],[10.25,-20.6],[2,-22],[-6.5,-21.5]],[[-2,-22],[-1.75,-23.6],[-1.75,-28.6],[-2,-31]],[[-1.75,-28.6],[-1.75,-23.6],[3,-22],[10.25,-20.6],[10.25,-13.2],[7.6,-9],[0.5,-9],[-4.75,-7.6],[-4.75,1],[2,6]]];
 let TJ=null;
 function arriveDest(){if(S.dest!=='taj-mahal-agra')return arriveRock();hideDlg();view='out';
  if(!TJ)TJ=createTaj({h,kids,coord,camera,you:()=>you,say,hideDlg,obj,tops,setAct,flash,quiz,ambience,input:()=>({joy,K}),cam:()=>({yaw:camYaw,pitch:camPitch,dist:camDist}),setCam:(y,p,d)=>{camYaw=y;camPitch=p;camDist=d;},S:()=>S,startReturn,unseat,putIn,dlg:()=>!!dlgQ,NAMES});
  TJ.arrive();}
 function arriveRock(){hideDlg();ambience('nature');S.ph='rock';S.sc=rock;S.st='ARRIVING';S.t=0;unseat(rock);view='out';kids.forEach((k,i)=>{k.x=30+(i%4)*0.9;k.z=19.5+Math.floor(i/4)*0.9;k.y=0;k.o.visible=false;});coord.x=28;coord.y=0;coord.z=18.5;coord.o.visible=false;you.visible=false;
  const cb=rock.userData.coach;cb.position.set(70,0,20);cb.rotation.y=0;S.px=29;S.pz=18;S.py=0;S.yaw=Math.PI;camYaw=0.55;camDist=17;camPitch=0.55;obj('Arriving in Abeokuta','The coach turns into the Olumo Rock Tourist Complex.');paintTop();S.trail=[];S.stop=-1;S.route=null;}
 function stopBegin(i){S.stop=i;S.st='GUIDING';const s=OLUMO.stops[i];coord.wait=0;S.ready=0;obj(s.title,`Stop ${i+1} of 6 · ${s.sign?'read the sign, then continue':'final headcount'}`);
  say(OLUMO.coordinator,s.lines,()=>{if(i===5)return finalHead();S.ready=1;S.st=i===4?'FREE_EXPLORATION':'REGROUPING';obj(s.title,i===4?'Free time at the lookout: photos, the view, the group photo.':'Explore here, read the sign and try the questions. Tap Continue when you\u2019re ready.');showContinue();});}
 function showContinue(){const i=S.stop;const b=[['Read the sign','sign']];if(OLUMO.stops[i].quiz)b.push(['Questions','quiz']);if(i===4)b.push(['Group photo','gp']);b.push([i===4?'Head back down ▸':'Continue ▸','go']);
  say(OLUMO.coordinator,[i===4?'Take your time. When you\u2019re ready we\u2019ll head down together.':'Have a look around. Shout when you\u2019re ready to move on.'],id=>{if(id==='sign')return signSheet(i);if(id==='quiz')return quiz(OLUMO.stops[i].quiz,showContinue,i);if(id==='gp')return groupPhoto();if(id==='go'){S.route=ROUTE[i].slice();S.st='GUIDING';S.walking=1;obj('Follow '+OLUMO.coordinator,'Stay within sight of the group.');}},b);}
 function signSheet(i){const s=OLUMO.stops[i].sign;h.openSheet(`<div class="hand" style="font-size:28px;line-height:1;">${s[0]}</div><div style="font-size:15px;line-height:1.45;">${s[1]}</div><button class="btn pri" id="ok">Close</button>`,b=>b.querySelector('#ok').onclick=()=>{h.closeSheet();S.done['sign'+i]=1;showContinue();});}
 function quiz(qs,after,tag){let k=0,sc=0;const ask=()=>{if(k>=qs.length){S.quiz+=sc;S.qn+=qs.length;S.done['quiz'+tag]=1;h.closeSheet();h.toast(`${sc}/${qs.length} correct`);return after&&after();}const [q,o,a,why]=qs[k];
   h.openSheet(`<div style="font-size:12px;font-weight:700;">${OLUMO.coordinator} asks · ${k+1}/${qs.length}</div><div class="hand" style="font-size:24px;line-height:1.15;">${q}</div>${o.map((x,j)=>`<button class="opt" data-a="${j}"><span class="glyph">${'ABC'[j]}</span><div style="flex:1;text-align:left;"><b>${x}</b></div></button>`).join('')}`,b=>b.querySelectorAll('[data-a]').forEach(e=>e.onclick=()=>{const ok=+e.dataset.a===a;if(ok)sc++;h.sfx&&h.sfx(ok?'power':'thud');
    h.openSheet(`<div class="hand" style="font-size:26px;">${ok?'Correct!':'Not quite.'}</div><div style="font-size:14px;">${why}</div><button class="btn pri" id="n">Next</button>`,x=>x.querySelector('#n').onclick=()=>{k++;ask();});}));};ask();}
 let photoCam=null;function photo(){if(S.ph!=='rock')return;flash();h.sfx&&h.sfx('swish');const where=S.stop>=0?OLUMO.stops[S.stop].title:'Olumo Rock';const key='p'+S.stop;if(S.photos[key])return h.toast('Snap! (Already saved a photo here.)');S.photos[key]=1;
  h.memory(`Photo: ${where}`,'',S.stop===4?'The view over Abeokuta from the top of Olumo Rock.':`A snapshot at ${where}.`,'#8a6a3a');}
 function groupPhoto(){if(S.photos.group)return showContinue();S.gp=3.2;S.st='FREE_EXPLORATION';obj('Group photo!','Everyone squeeze in by the railing\u2026');setTimeout(()=>{if(!S)return;flash();h.sfx&&h.sfx('level');S.photos.group=1;S.gp=0;h.memory('Class photo at Olumo Rock',NAMES.slice(0,4).join(', ')+' & co.',`The whole class with ${OLUMO.coordinator} at the summit, Abeokuta behind us.`,'#55745c');showContinue();},3300);}
 function finalHead(){S.st='FINAL_HEADCOUNT';let i=0;const n=()=>{if(!S)return;if(i<kids.length){h.toast(`${OLUMO.coordinator}: "${i+1}\u2026"`);i++;setTimeout(n,280);}else quiz(OLUMO.recap,()=>say(OLUMO.coordinator,[`Everyone accounted for: ${kids.length+1} students. Brilliant work today. To the coach!`],()=>{S.done.final=1;startReturn();}),'recap');};n();}
 function startReturn(){if(TJ&&S.ph==='taj')TJ.leave();S.ret=true;S.st='RETURNING';hideDlg();h.closeSheet&&h.closeSheet();ambience(null);setPhase('rtakeoff');unseat(air);seatEveryone();obj('Heading home',S.R.home);paintTop();}
 function finishTrip(){if(!S)return;const r={completed:!!S.done.final,quiz:S.quiz,qn:S.qn,photos:Object.keys(S.photos).length,signs:Object.keys(S.done).filter(k=>k.startsWith('sign')).length,kids:NAMES,dest:S.dest,...(S.dest==='taj-mahal-agra'&&TJ?TJ.result():{})};S.st='COMPLETED';stop();h.onEnd(r);}
 const near=(a,b,r)=>Math.hypot(a.x-b.x,a.z-b.z)<r;
 function moveOn(p,tx,tz,sp,dt){const dx=tx-p.x,dz=tz-p.z,d=Math.hypot(dx,dz);if(d<0.15)return false;const m=Math.min(d,sp*dt),nx=p.x+dx/d*m,nz=p.z+dz/d*m;const y=hAt(nx,nz,p.y);if(y!=null){p.x=nx;p.z=nz;p.y=y;p.ry=Math.atan2(dx,dz);return true;}const y2=hAt(nx,p.z,p.y);if(y2!=null){p.x=nx;p.y=y2;return true;}const y3=hAt(p.x,nz,p.y);if(y3!=null){p.z=nz;p.y=y3;return true;}return null;}
 function rockStep(dt,t){S.t+=dt;const cb=rock.userData.coach;
  if(S.st==='ARRIVING'){const k=clamp(S.t/5,0,1),e=1-Math.pow(1-k,3);cb.position.x=70-(70-34)*e;cb.position.z=20;if(S.t>5.4){if(!S.off){S.off=1;kids.forEach(k=>k.o.visible=true);coord.o.visible=true;you.visible=true;S.route=[[24,16],[4,12],[2,6]];S.walking=1;S.st='GUIDING';h.toast('Doors open. Everyone off the coach!');obj('Meeting point','Follow the group to the meeting point by the fountain.');}}}
  // coordinator
  const c=coord;let cMove=false;
  if(S.route&&S.route.length){const [tx,tz]=S.route[0];const anyFar=Math.hypot(S.px-c.x,S.pz-c.z)>16;if(anyFar&&S.st==='GUIDING'){c.wait+=dt;if(c.wait>1&&!S.warned){S.warned=1;h.toast(`${OLUMO.coordinator}: "Stay within sight of the group, please!"`);}}else{c.wait=0;S.warned=0;const r=moveOn(c,tx,tz,1.7,dt);cMove=!!r;if(r===false||r===null)S.route.shift();}
   if(!S.route.length){S.route=null;S.walking=0;const next=S.stop+1;if(next<=5){S.awaitStop=next;S.st='REGROUPING';obj('Regroup',`Gather round ${OLUMO.coordinator}.`);}}}
  if(S.awaitStop!=null&&Math.hypot(S.px-c.x,S.pz-c.z)<7&&!dlgQ){const n=S.awaitStop;S.awaitStop=null;stopBegin(n);}
  if(cMove){const lt=S.trail[S.trail.length-1];if(!lt||Math.hypot(lt[0]-c.x,lt[2]-c.z)>0.35){S.trail.push([c.x,c.y,c.z]);if(S.trail.length>300)S.trail.shift();}}
  else if(!S.walking){const fx=S.px-c.x,fz=S.pz-c.z;if(Math.hypot(fx,fz)>0.5)c.ry+=(((Math.atan2(fx,fz)-c.ry+Math.PI*3)%(Math.PI*2))-Math.PI)*Math.min(1,dt*3);}
  c.o.position.set(c.x,c.y,c.z);c.o.rotation.y=c.ry;poseUpdate(c.o,dt,cMove,null,0.8);if(!cMove&&dlgQ){c.o.userData.arms[1].rotation.x=-0.9+Math.sin(t*3)*0.4;}
  // students
  kids.forEach((k,i)=>{if(!k.o.visible)return;let tx,tz;if(S.gp>0){tx=-6+i*1.0;tz=-29.2;}else if(S.walking&&S.trail.length){const idx=Math.max(0,S.trail.length-1-(3+i*2));const p=S.trail[idx];const side=i%2?0.55:-0.55;tx=p[0]+side*Math.cos(c.ry);tz=p[2]-side*Math.sin(c.ry);if(hAt(tx,tz,p[1])==null){tx=p[0];tz=p[2];}}
   else{const a=(i/(kids.length-1)-0.5)*2.4+Math.atan2(S.px-c.x,S.pz-c.z),r=2.2+(i%3)*0.8;tx=c.x+Math.sin(a)*r;tz=c.z+Math.cos(a)*r;if(hAt(tx,tz,c.y)==null){const p=S.trail[Math.max(0,S.trail.length-1-i*2)];if(p){tx=p[0];tz=p[2];}else{tx=c.x;tz=c.z;}}}
   const r=moveOn(k,tx,tz,2.6,dt);if(r===null){k.stuck+=dt;}else k.stuck=0;if(k.stuck>1.2||Math.hypot(k.x-tx,k.z-tz)>18){const y=hAt(tx,tz,c.y);if(y!=null){k.x=tx;k.z=tz;k.y=y;}else{k.x=c.x;k.z=c.z;k.y=c.y;}k.stuck=0;}
   const moving=!!r;if(!moving){const fx=(S.gp>0?0:c.x)-k.x,fz=(S.gp>0?10:c.z)-k.z;k.ry+=(((Math.atan2(fx,fz)-k.ry+Math.PI*3)%(Math.PI*2))-Math.PI)*Math.min(1,dt*2);}
   k.o.position.set(k.x,k.y,k.z);k.o.rotation.y=k.ry;poseUpdate(k.o,dt,moving,!moving&&S.stop===4&&i%3===0?'wave':null,1.1);if(!moving)k.o.userData.head.rotation.y=Math.sin(t*0.6+i*1.3)*0.5;});
  // player
  if(S.off&&!h.sheetOpen()){let f=-joy[1]+((K.w||K.arrowup)?1:0)-((K.s||K.arrowdown)?1:0),s=joy[0]+((K.d||K.arrowright)?1:0)-((K.a||K.arrowleft)?1:0);const l=Math.hypot(f,s);let mv=false;
   if(l>0.08){if(l>1){f/=l;s/=l;}const fx=-Math.sin(camYaw),fz=-Math.cos(camYaw);const mx=fx*f-fz*s,mz=fz*f+fx*s,sp=(K.shift?5:3.4)*Math.min(1,l);const P={x:S.px,y:S.py,z:S.pz,ry:S.yaw};const r=moveOn(P,S.px+mx*sp*dt*3,S.pz+mz*sp*dt*3,sp,dt);if(r){S.px=P.x;S.pz=P.z;S.py=P.y;mv=true;S.yaw=Math.atan2(mx,mz);}}
   you.position.set(S.px,S.py,S.pz);you.rotation.y=S.yaw;poseUpdate(you,dt,mv,null,1.1);}
  else{you.position.set(S.px,S.py,S.pz);poseUpdate(you,dt,false);}
  const inCave=tagAt(S.px,S.pz,S.py)==='cave';roofMat.opacity+=((inCave?0.18:1)-roofMat.opacity)*Math.min(1,dt*4);roofMat.depthWrite=roofMat.opacity>0.9;
  if(inCave&&!S.done.cave){S.done.cave=1;h.toast('It\u2019s cool and quiet inside the shelter. The granite forms a natural roof.');}
  // lift + signs prompt
  let act=null;if(Math.hypot(S.px-17.5,S.pz-(-7))<2.4&&S.py<1)act=['Take the glass lift up',()=>{S.px=15;S.pz=-9.5;S.py=10;h.toast('Ding! The lift glides up the tower.');}];
  else if(Math.hypot(S.px-15.4,S.pz+9.5)<1.4&&S.py>9)act=['Take the lift down',()=>{S.px=17.5;S.pz=-6.2;S.py=0;}];
  else SIGNS.forEach(([i,x,z,y=0])=>{if(i&&Math.hypot(S.px-x,S.pz-z)<2&&Math.abs(S.py-y)<1)act=['Read: '+OLUMO.stops[i].sign[0],()=>{h.openSheet(`<div class="hand" style="font-size:28px;line-height:1;">${OLUMO.stops[i].sign[0]}</div><div style="font-size:15px;line-height:1.45;">${OLUMO.stops[i].sign[1]}</div><button class="btn pri" id="ok">Close</button>`,b=>b.querySelector('#ok').onclick=()=>{h.closeSheet();S.done['sign'+i]=1;});}];});
  if(!act&&S.py>=19.5&&!S.photos.p4)act=['Photograph the view',()=>{const s=S.stop;S.stop=4;photo();S.stop=s;}];
  setAct(act&&act[0],act&&act[1]);
  // chatter
  S.chatT-=dt;if(S.chatT<=0&&S.off){S.chatT=16+Math.random()*10;const k=kids[Math.floor(Math.random()*kids.length)];const L_=S.py>18?['You can see the whole of Abeokuta from here!','Look, a mosque with two towers!','My legs are shaking, but this view is worth it.']:S.py>8?['These stairs are a workout.','Imagine hiding up here hundreds of years ago.','The rock is warm from the sun.']:['It\u2019s so much bigger than in the pictures.','Can we buy something at the gift shop later?','I\u2019m taking a selfie with the rock.'];h.toast(`${k.n}: "${L_[Math.floor(Math.random()*L_.length)]}"`);}
  // camera
  const tgt=V(S.px,S.py+1.2,S.pz);const off=V(Math.sin(camYaw)*Math.cos(camPitch),Math.sin(camPitch),Math.cos(camYaw)*Math.cos(camPitch)).multiplyScalar(camDist);
  if(S.st==='ARRIVING'&&!S.off){camera.position.lerp(V(42,10,40),Math.min(1,dt*2));camera.lookAt(cb.position.x,1,20);}else if(S.gp>0){camera.position.lerp(V(-1.5,22.2,-23.5),Math.min(1,dt*3));camera.lookAt(-1.5,20.8,-29.5);}
  else if(inCave){camera.position.lerp(V(-3.2,17.6,-20.6),Math.min(1,dt*4));camera.lookAt(S.px,S.py+1,S.pz);}
  else{camera.position.lerp(tgt.clone().add(off),Math.min(1,dt*4));camera.lookAt(tgt);}camera.near=0.3;camera.updateProjectionMatrix();}
 function update(dt,t){if(!S)return;if(S.ph==='taj')TJ.step(dt,t);else if(S.ph==='rock')rockStep(dt,t);else transit(dt,t);}
 function stop(silent){ambience(null);hud.style.display='none';hideDlg();setAct(null);S=null;}
 return{get scene(){return S?S.sc:air;},camera,start,stop,update,resize(a){camera.aspect=a;camera.updateProjectionMatrix();},active:()=>!!S};}
