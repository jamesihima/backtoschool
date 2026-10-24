import * as THREE from 'three';
import {PAL,L,bx,cy,Batch,windMat,sunRig,wind} from './look.js';
import {makePerson,poseUpdate} from '../common.js';
// "Late for Assembly" — 3-lane endless runner down the street to the school gate.
const LANES=[-1.7,0,1.7],CH=24,NCH=8;
export function createRunner(hooks){
 const sc=new THREE.Scene();sc.background=new THREE.Color('#e9c99a');sc.fog=new THREE.Fog('#e9c99a',38,92);
 const sun=sunRig(sc,2.5);sun.position.set(-12,30,14);Object.assign(sun.shadow.camera,{left:-20,right:20,top:30,bottom:-40});sun.target.position.set(0,0,-10);
 const cam=new THREE.PerspectiveCamera(52,1,0.1,200);
 // ---- recyclable street chunks
 const chunks=[];const FAC=[[PAL.ochre,PAL.ochreD],[PAL.sage,PAL.sageD],[PAL.cream,PAL.creamD],[PAL.brick,PAL.brickD]];
 const winG=new THREE.BoxGeometry(0.9,1.1,0.1);
 for(let k=0;k<NCH;k++){const g=new THREE.Group();g.name='SM_RunChunk_'+k;
  const road=new THREE.Mesh(new THREE.PlaneGeometry(6,CH),L(k%2?PAL.road:PAL.road2));road.rotation.x=-Math.PI/2;road.receiveShadow=true;g.add(road);
  [-0.85,0.85].forEach(x=>{for(let z=-CH/2+1;z<CH/2;z+=3)g.add(bx(0.12,0.02,1.4,PAL.line,x,0.02,z));});
  [-1,1].forEach(s=>{const w=new THREE.Mesh(new THREE.PlaneGeometry(3,CH),L(PAL.walk));w.rotation.x=-Math.PI/2;w.position.set(s*4.5,0.12,0);w.receiveShadow=true;g.add(w);g.add(bx(0.2,0.24,CH,PAL.curb,s*3.05,0.12,0));
   const grass=new THREE.Mesh(new THREE.PlaneGeometry(30,CH),L(PAL.grass));grass.rotation.x=-Math.PI/2;grass.position.set(s*21,0.1,0);g.add(grass);
   let z=-CH/2;while(z<CH/2-2){const w=4+Math.random()*4,[c,d]=FAC[Math.floor(Math.random()*4)],fl=2+Math.floor(Math.random()*3),H=fl*3,dep=6;const cx=s*(6+dep/2+Math.random()*0.6),cz=z+w/2;
    g.add(bx(dep,H,w,c,cx,H/2,cz),bx(dep+0.1,0.5,w+0.1,d,cx,0.25,cz),bx(dep+0.25,0.5,w+0.25,d,cx,H+0.25,cz));
    for(let f=0;f<fl;f++)for(let q=-w/2+1;q<w/2-0.5;q+=1.6){const m=new THREE.Mesh(winG,L(PAL.frame));m.position.set(cx-s*dep/2-s*0.04,f*3+1.7,cz+q);m.rotation.y=Math.PI/2;g.add(m);const gl=new THREE.Mesh(winG,L(PAL.glass));gl.scale.set(0.78,0.8,1);gl.position.set(cx-s*dep/2-s*0.08,f*3+1.72,cz+q);gl.rotation.y=Math.PI/2;g.add(gl);}
    if(Math.random()<0.5){const a=bx(1.3,0.1,w*0.8,[PAL.sage,PAL.cream,PAL.brick][Math.floor(Math.random()*3)],cx-s*(dep/2+0.6),2.8,cz);a.rotation.z=s*0.2;g.add(a);}
    if(Math.random()<0.4)g.add(cy(0.6,0.6,1.2,PAL.tank,cx,H+1.1,cz,10));
    z+=w+0.3;}
   for(let t=-CH/2+3;t<CH/2;t+=8){const h=2.8+Math.random();g.add(cy(0.1,0.16,h,PAL.trunk,s*4.9,h/2,t,6));const lm=windMat(PAL.leaf2);for(let q=0;q<3;q++){const b=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),lm);b.position.set(s*4.9+(q-1)*0.5,h+0.4+(q%2)*0.4,t+(q-1)*0.4);b.scale.set(1.1,0.8,1.1);b.castShadow=true;g.add(b);}}
   g.add(cy(0.05,0.07,3.6,PAL.fence,s*3.6,1.8,8,6));});
  g.position.z=-k*CH;sc.add(g);chunks.push(g);}
 // ---- player
 let player=null;function setLook(look){if(player)sc.remove(player);player=makePerson(look);player.rotation.y=Math.PI;sc.add(player);}
 // ---- pools
 const objs=[];
 const coinM=L('#f0c24a',{emissive:'#6a4a10'}),coinG=new THREE.CylinderGeometry(0.32,0.32,0.07,16);coinG.rotateX(Math.PI/2);
 function mkObs(type,lane,z){const g=new THREE.Group();g.position.set(LANES[lane],0,z);let h=0;
  if(type==='bench'){g.add(bx(1.5,0.08,0.5,PAL.trunk,0,0.55,0),bx(1.5,0.36,0.07,PAL.trunk,0,0.82,-0.2),bx(0.08,0.55,0.45,PAL.fence,-0.65,0.27,0),bx(0.08,0.55,0.45,PAL.fence,0.65,0.27,0));h=0.95;}
  if(type==='banner'){g.add(cy(0.05,0.05,2.4,PAL.fence,-0.8,1.2,0,6),cy(0.05,0.05,2.4,PAL.fence,0.8,1.2,0,6));const b=new THREE.Mesh(new THREE.BoxGeometry(1.7,0.75,0.06),new THREE.MeshLambertMaterial({map:bannerTex()}));b.position.y=1.85;b.castShadow=true;g.add(b);h=1.45;}
  if(type==='keke'){g.add(bx(1.5,1.2,2,'#e8b33c',0,1.0,0),bx(1.55,0.1,2.1,PAL.fence,0,2.0,0),bx(1.3,0.6,0.05,PAL.glass,0,1.5,1.0));[-0.6,0.6].forEach(x=>{const w=cy(0.3,0.3,0.2,'#231c1e',x,0.3,-0.6,10);w.rotation.z=Math.PI/2;g.add(w);});const f=cy(0.3,0.3,0.2,'#231c1e',0,0.3,0.8,10);f.rotation.z=Math.PI/2;g.add(f);h=9;}
  if(type==='prefect'){const p=makePerson({skin:'#5c3520',shirt:'#f4eedb',bottom:'#22345e',hair:'short',vest:1});p.scale.setScalar(1.05);g.add(p);g.userData.p=p;const b=bx(0.5,0.32,0.02,'#c0392b',0.12,1.45,0.16);g.add(b);h=9;}
  if(type==='puddle'){const p=new THREE.Mesh(new THREE.CircleGeometry(0.75,16),L('#7c98a0',{transparent:true,opacity:0.8}));p.rotation.x=-Math.PI/2;p.position.y=0.03;p.scale.x=1.2;g.add(p);h=0;}
  sc.add(g);const o={g,type,lane,h,z,dead:false,vz:type==='keke'?5:0};objs.push(o);return o;}
 function mkCoin(lane,z,y){const m=new THREE.Mesh(coinG,coinM);m.position.set(LANES[lane],y,z);m.castShadow=true;sc.add(m);const o={g:m,type:'coin',lane,z,y,dead:false};objs.push(o);return o;}
 const PW={magnet:['Puff-puff magnet','#c98a3c'],double:['Zobo x2','#a8323a'],shield:['Exercise-book shield','#4f6e8a']};
 function mkPower(lane,z,kind){const g=new THREE.Group();g.position.set(LANES[lane],1.1,z);const c=PW[kind][1];
  if(kind==='magnet'){for(let q=0;q<3;q++)g.add(new THREE.Mesh(new THREE.SphereGeometry(0.2,10,8),L(c)).translateX((q-1)*0.28));}
  if(kind==='double')g.add(cy(0.18,0.15,0.55,c,0,0,0,10),cy(0.1,0.1,0.12,PAL.white,0,0.33,0,8));
  if(kind==='shield')g.add(bx(0.55,0.72,0.08,c,0,0,0),bx(0.45,0.08,0.09,PAL.white,0,0.15,0));
  const halo=new THREE.Mesh(new THREE.RingGeometry(0.55,0.65,24),new THREE.MeshBasicMaterial({color:'#fff3c4',transparent:true,opacity:0.7,side:THREE.DoubleSide}));g.add(halo);sc.add(g);const o={g,type:'power',kind,lane,z,dead:false};objs.push(o);return o;}
 // ---- race mode (100 m dash, classmates side by side)
 const RIV=[{n:'Tunde',look:{skin:'#5c3520',shirt:'#55745c',bottom:'#22345e',hair:'short',casual:1},x:-3.7,top:10.3},{n:'Funmi',look:{skin:'#7a4a2e',shirt:'#e3a347',bottom:'#22345e',hair:'braids',casual:1},x:3.7,top:9.9},{n:'Chidi',look:{skin:'#86553a',shirt:'#4f6e8a',bottom:'#22345e',hair:'afro',casual:1},x:1.7,top:9.7,weave:1}];
 RIV.forEach(v=>{v.o=makePerson(v.look);v.o.visible=false;sc.add(v.o);});
 const lineG=new THREE.Group();const fin=new THREE.Group();
 {const ck=document.createElement('canvas');ck.width=128;ck.height=16;const g=ck.getContext('2d');for(let k=0;k<16;k++){g.fillStyle=k%2?'#231c1e':'#fff';g.fillRect(k*8,0,8,8);g.fillStyle=k%2?'#fff':'#231c1e';g.fillRect(k*8,8,8,8);}const t=new THREE.CanvasTexture(ck);t.colorSpace=THREE.SRGBColorSpace;
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(12,0.9),new THREE.MeshLambertMaterial({map:t}));fl.rotation.x=-Math.PI/2;fl.position.y=0.15;fin.add(fl);
  [-6,6].forEach(x=>fin.add(cy(0.12,0.12,4,PAL.fence,x,2,0,8)));const bc=document.createElement('canvas');bc.width=512;bc.height=96;const bg=bc.getContext('2d');bg.fillStyle='#a8553f';bg.fillRect(0,0,512,96);bg.fillStyle='#fff3c4';bg.font='bold 64px "Patrick Hand",cursive';bg.textAlign='center';bg.fillText('FINISH · 100 m',256,70);const bt=new THREE.CanvasTexture(bc);bt.colorSpace=THREE.SRGBColorSpace;
  const ban=new THREE.Mesh(new THREE.BoxGeometry(12,1,0.08),new THREE.MeshLambertMaterial({map:bt}));ban.position.y=3.6;ban.castShadow=true;fin.add(ban);
  const sl=new THREE.Mesh(new THREE.PlaneGeometry(12,0.25),L('#f2e6cc'));sl.rotation.x=-Math.PI/2;sl.position.y=0.15;lineG.add(sl);for(let m=10;m<100;m+=10){const tk=new THREE.Mesh(new THREE.PlaneGeometry(12,0.08),L('#f2e6cc',{transparent:true,opacity:0.6}));tk.rotation.x=-Math.PI/2;tk.position.set(0,0.14,-m);lineG.add(tk);}}
 fin.visible=lineG.visible=false;sc.add(fin,lineG);
 // ---- state
 let S=null;
 function reset(look,opt){objs.forEach(o=>sc.remove(o.g));objs.length=0;setLook(look);chunks.forEach((c,k)=>c.position.z=-k*CH);const race=!!(opt&&opt.race),cpu=opt&&opt.cpu!=null?opt.cpu:0.5;
  RIV.forEach((v,k)=>{v.o.visible=race;v.d=0;v.v=0;v.fin=null;v.st=0;v.lane=2;v.tp=v.top-0.5+cpu*0.9+Math.random()*0.3;v.stAt=Math.random()<0.45?20+Math.random()*60:999;v.y=0;v.vy=0;});fin.visible=lineG.visible=race;
  S={race,cd:race?3.2:0,fin:null,stumble:0,on:false,over:false,t:0,dist:0,speed:race?0:11,lane:1,x:0,y:0,vy:0,slide:0,coins:0,jumps:0,slides:0,next:26,pw:{},shake:0,revived:false,lastSafe:1,combo:0};
  player.position.set(0,0,0);if(race)S.next=16;for(let k=0;k<(race?6:4);k++)spawn();}
 function spawn(){if(S.race&&S.next>92)return void(S.next+=999);const z=-S.next;S.next+=Math.max(9,17-S.speed*0.28)+Math.random()*6;
  const r=Math.random();const free=Math.floor(Math.random()*3);
  if(r<0.18){for(let k=0;k<7;k++)mkCoin(free,z+k*1.4,0.9);const o=[0,1,2].filter(l=>l!==free);mkObs(Math.random()<0.5?'prefect':'keke',o[0],z-2);if(S.speed>15)mkObs('bench',o[1],z-1);return;}
  if(r<0.42){const l=Math.floor(Math.random()*3);mkObs('bench',l,z);for(let k=0;k<5;k++){const t=(k-2)/2;mkCoin(l,z+t*2.2,1.0+(1-t*t)*1.4);}if(Math.random()<0.5)mkObs('banner',(l+1+Math.floor(Math.random()*2))%3,z);return;}
  if(r<0.6){const b=[0,1,2].filter(()=>Math.random()<0.7);if(b.length===0)b.push(free);b.forEach(l=>mkObs('banner',l,z));for(let k=0;k<4;k++)mkCoin(b[0],z+2+k*1.4,0.6);return;}
  if(r<0.75){mkObs('keke',free,z-6);const o=(free+1)%3;for(let k=0;k<6;k++)mkCoin(o,z+k*1.4,0.9);if(Math.random()<0.5)mkObs('puddle',(free+2)%3,z);return;}
  if(r<0.82){const kinds=Object.keys(PW);mkPower(free,z,kinds[Math.floor(Math.random()*3)]);return;}
  const ls=[0,1,2].filter(l=>l!==free);ls.forEach((l,i)=>mkObs(i?'bench':'prefect',l,z));for(let k=0;k<6;k++)mkCoin(free,z+k*1.4,0.9);}
 // ---- input
 function input(a){if(!S||!S.on||S.over)return;if(a==='left'&&S.lane>0){S.lane--;hooks.sfx('swish');}if(a==='right'&&S.lane<2){S.lane++;hooks.sfx('swish');}
  if(a==='up'&&S.y<0.05){S.vy=9.6;S.slide=0;S.jumps++;hooks.sfx('jump');}if(a==='down'){if(S.y>0.05)S.vy=-16;S.slide=0.75;S.slides++;hooks.sfx('slide');}}
 function crash(o){if(S.race){o.dead=true;sc.remove(o.g);S.stumble=0.9;S.speed*=0.35;S.shake=0.45;hooks.sfx('crash');hooks.toast({bench:'Tripped over a bench!',banner:'Hit the banner!',keke:'Dodged the keke… barely!',prefect:'The prefect blocked you!'}[o.type]||'Stumble!');return;}
  if(S.pw.shield>0){S.pw.shield=0;o.dead=true;sc.remove(o.g);S.shake=0.4;hooks.sfx('thud');hooks.toast('Shield saved you!');return;}
  S.over=true;S.shake=0.6;hooks.sfx('crash');const why={bench:'You tripped over a bench!',banner:'You ran into the banner!',keke:'Keke almost got you!',prefect:'The prefect caught you!'}[o.type]||'Ouch!';
  setTimeout(()=>hooks.over({dist:Math.floor(S.dist),coins:S.coins,jumps:S.jumps,slides:S.slides,why,canRevive:!S.revived}),700);}
 function revive(){S.revived=true;S.over=false;S.pw.shield=3;objs.forEach(o=>{if(o.type!=='coin'&&o.z>-14&&o.z<4){o.dead=true;sc.remove(o.g);}});hooks.sfx('power');}
 function update(dt,t){if(!S)return;const u=player.userData;
  if(S.on&&!S.over&&S.race&&S.cd>0){const pc=Math.ceil(S.cd);S.cd-=dt;const nc=Math.ceil(S.cd);if(nc!==pc){hooks.big&&hooks.big(nc>0?String(nc):'GO!');hooks.sfx(nc>0?'coin':'power');}poseUpdate(player,dt,false);RIV.forEach(v=>{v.o.position.set(v.x,0,0);v.o.rotation.y=Math.PI;poseUpdate(v.o,dt,false);});}
  else if(S.on&&!S.over){S.t+=dt;if(S.race){S.stumble=Math.max(0,S.stumble-dt);const top=10.2+(S.pw.double?0.6:0);S.speed+=(S.stumble>0?0:(top-S.speed))*Math.min(1,dt*1.15);}else S.speed=Math.min(27,11+S.t*0.22);const mv=S.speed*dt;S.dist+=mv;
   if(S.race)raceStep(dt,mv);
   chunks.forEach(c=>{c.position.z+=mv;if(c.position.z>CH)c.position.z-=CH*NCH;});
   S.x+=(LANES[S.lane]-S.x)*Math.min(1,dt*14);S.vy-=28*dt;S.y=Math.max(0,S.y+S.vy*dt);if(S.y===0)S.vy=Math.max(0,S.vy);S.slide=Math.max(0,S.slide-dt);
   Object.keys(S.pw).forEach(k=>{S.pw[k]-=dt;if(S.pw[k]<=0)delete S.pw[k];});
   while(S.next-S.dist<90)spawn();
   const sliding=S.slide>0,topY=S.y+(sliding?0.85:1.75);
   objs.forEach(o=>{if(o.dead)return;o.z+=mv+(o.vz||0)*dt;
    if(o.type==='coin'){if(S.pw.magnet){const dx=S.x-o.g.position.x,dz=-o.z,d=Math.hypot(dx,dz);if(d<7){o.g.position.x+=dx*Math.min(1,dt*8);o.z+=dz*Math.min(1,dt*8)*0.5;o.g.position.y+=(S.y+0.9-o.g.position.y)*Math.min(1,dt*8);}}
     o.g.position.z=o.z;o.g.rotation.y+=dt*5;if(Math.abs(o.z)<0.6&&Math.abs(o.g.position.x-S.x)<0.85&&Math.abs(o.g.position.y-(S.y+0.9))<1.0){o.dead=true;sc.remove(o.g);S.coins+=S.pw.double?2:1;hooks.sfx('coin');}}
    else if(o.type==='power'){o.g.position.z=o.z;o.g.rotation.y+=dt*3;o.g.position.y=1.1+Math.sin(t*4)*0.15;if(Math.abs(o.z)<0.7&&Math.abs(LANES[o.lane]-S.x)<0.9){o.dead=true;sc.remove(o.g);S.pw[o.kind]=o.kind==='shield'?20:9;hooks.sfx('power');hooks.toast(PW[o.kind][0]+'!');}}
    else{o.g.position.z=o.z;if(o.g.userData.p)poseUpdate(o.g.userData.p,dt,false,'wave');
     if(o.type!=='puddle'&&Math.abs(o.z)<(o.type==='keke'?1.1:0.45)&&Math.abs(LANES[o.lane]-S.x)<0.95){
      if(o.type==='bench'&&S.y>o.h-0.05){}else if(o.type==='banner'&&topY<o.h){}else crash(o);}
     if(o.type==='puddle'&&Math.abs(o.z)<0.6&&Math.abs(LANES[o.lane]-S.x)<0.9&&S.y<0.1&&!o.splash){o.splash=1;S.speed*=0.9;hooks.sfx('splash');}
     if(!o.passed&&o.z>1){o.passed=true;if(o.type==='bench'||o.type==='banner'){S.combo++;}}}
    if(o.z>12){o.dead=true;sc.remove(o.g);}});
   for(let k=objs.length-1;k>=0;k--)if(objs[k].dead)objs.splice(k,1);
   player.position.set(S.x,S.y,0);poseUpdate(player,dt,S.y===0&&!sliding,null,S.speed/7);
   u.rig.rotation.x=sliding?-1.15:0;u.rig.position.y=sliding?-0.55:u.rig.position.y;player.rotation.z=(LANES[S.lane]-S.x)*-0.12;
   if(S.y>0){u.legs[0].rotation.x=-1.1;u.legs[1].rotation.x=0.4;u.arms.forEach(a=>a.rotation.x=-2.2);}}
  else if(!S.on){poseUpdate(player,dt,false,'wave');}
  else if(S.race){u.rig.rotation.x=0;u.rig.position.y=0;poseUpdate(player,dt,false,'wave');}
  else{u.rig.rotation.x=Math.min(1.4,u.rig.rotation.x+dt*5);}
  S.shake=Math.max(0,S.shake-dt);const sh=S.shake*0.5;
  cam.position.set(S.x*0.6+(Math.random()-0.5)*sh,3.6+S.y*0.35+(Math.random()-0.5)*sh,6.2);cam.lookAt(S.x*0.5,1.2,-8);
  wind.value=t;sun.position.set(-12,30,14);}
 function raceStep(dt,mv){fin.position.z=-(100-S.dist);lineG.position.z=S.dist;
  RIV.forEach(v=>{if(!v.fin){v.st=Math.max(0,v.st-dt);if(v.d>v.stAt){v.stAt=999;v.st=0.9;v.v*=0.35;}v.v+=(v.st>0?0:(v.tp-v.v))*Math.min(1,dt*1.2);v.d+=v.v*dt;if(v.d>=100)v.fin=S.t;}else v.d+=v.v*dt*0.6;
   const z=-(v.d-S.dist);if(v.weave){let best=v.lane,bd=-1;[0,1,2].forEach(l=>{let nd=99;objs.forEach(o=>{if(o.type!=='coin'&&o.type!=='power'&&o.lane===l&&o.z<z+0.5&&o.z>z-12)nd=Math.min(nd,z-o.z);});const pen=l===S.lane&&Math.abs(z)<2?50:0;if(nd-pen>bd){bd=nd-pen;best=l;}});v.lane=best;v.x+=(LANES[v.lane]-v.x)*Math.min(1,dt*6);}
   v.vy-=28*dt;v.y=Math.max(0,v.y+v.vy*dt);v.o.position.set(v.x,v.y,z);v.o.rotation.y=Math.PI;v.o.visible=z>-60&&z<10;poseUpdate(v.o,dt,v.v>0.5&&v.y===0,null,v.v/7);});
  if(!S.fin&&S.dist>=100){S.fin=S.t;hooks.sfx('level');const place=1+RIV.filter(v=>v.fin!=null&&v.fin<S.fin).length;hooks.big&&hooks.big(['','1ST!','2ND','3RD','4TH'][place]);}
  if(S.fin!=null&&(RIV.every(v=>v.fin!=null)||S.t-S.fin>2.2)&&!S.over){S.over=true;const res=[{n:'You',t:S.fin},...RIV.map(v=>({n:v.n,t:v.fin!=null?v.fin:S.fin+(100-v.d)/Math.max(1,v.v)}))].sort((a,b)=>a.t-b.t);
   setTimeout(()=>hooks.over({race:true,place:res.findIndex(x=>x.n==='You')+1,time:S.fin,res,coins:S.coins,dist:100,jumps:S.jumps,slides:S.slides}),600);}}
 return{scene:sc,camera:cam,reset,start:()=>{S.on=true;},input,update,revive,state:()=>S,powers:()=>S?S.pw:{}};}
let _bt=null;function bannerTex(){if(_bt)return _bt;const c=document.createElement('canvas');c.width=256;c.height=112;const g=c.getContext('2d');g.fillStyle='#c0563f';g.fillRect(0,0,256,112);g.fillStyle='#ecdcbc';g.fillRect(6,6,244,100);g.fillStyle='#3a2a30';g.font='700 34px "Atkinson Hyperlegible",sans-serif';g.textAlign='center';g.fillText('INTER-HOUSE',128,48);g.fillStyle='#c0563f';g.fillText('SPORTS',128,88);_bt=new THREE.CanvasTexture(c);_bt.colorSpace=THREE.SRGBColorSpace;return _bt;}
