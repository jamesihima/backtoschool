import * as THREE from 'three';
import {makePerson,poseUpdate,Walker,label} from '../common.js';
const CREW=[['Chidi','#c0563f','afro',0],['Amaka','#4f6e8a','braids',1],['Tunde','#55745c','short',0],['Zainab','#c97a8a','bun',1],['Emeka','#6b4a7a','short',0],['Funmi','#e3a347','puffs',1],['Bayo','#d07a3a','short',0],['Halima','#3f8a8a','braids',1]];
const SKIN=['#5c3520','#7a4a2e','#86553a','#6b3f26'];
const LN={classroom:'SS1 block',canteen:'canteen',admin:'admin block',lab:'science lab',library:'library',common:'common room',field:'field'};
const TASKS=[{n:'Wipe the blackboard',at:'classroom',mini:'smudge'},{n:'Return library books',at:'library',mini:'sort'},{n:'Fill the water tank',at:'canteen',mini:'hold'},{n:'Set the bell timer',at:'admin',mini:'order'},{n:'Label the beakers',at:'lab',mini:'order'},{n:'Pump the football',at:'field',mini:'hold'},{n:'Sweep the common room',at:'common',mini:'smudge'}];
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const rpick=a=>a[Math.floor(Math.random()*a.length)];
export function createImpostor(h){
 const world=h.world,sc=world.scene,G=world.G;const LOCS=Object.keys(LN);const spot={};
 LOCS.forEach(id=>{let p;if(id==='field'){const F=world.field;p=[(F.x0+F.x1)/2,(F.z0+F.z1)/2];}else{const d=world.doorOf(id);p=[d[0]+1.3,d[1]+0.3];if(!G.free(p[0],p[1]))p=[d[0],d[1]];}spot[id]=p;});
 const nearLoc=(x,z,max=1e9)=>{let b=null,bd=max;LOCS.forEach(l=>{const d=Math.hypot(spot[l][0]-x,spot[l][1]-z);if(d<bd){bd=d;b=l;}});return b;};
 let S=null;const tmp=[];const add=o=>{sc.add(o);tmp.push(o);return o;};
 const dist=(a,b)=>Math.hypot(a.w.x-b.w.x,a.w.z-b.w.z);const nm=e=>e.isPlayer?'YOU':e.name;
 function freeNear(x,z,r){for(let k=0;k<14;k++){const a=Math.random()*6.28,d=Math.random()*r,px=x+Math.cos(a)*d,pz=z+Math.sin(a)*d;if(G.free(px,pz))return[px,pz];}return[x,z];}
 function marker(id){const g=new THREE.Group();const r=new THREE.Mesh(new THREE.RingGeometry(0.75,1.0,32),new THREE.MeshBasicMaterial({color:'#f0c24a',transparent:true,opacity:0.95,side:THREE.DoubleSide}));r.rotation.x=-Math.PI/2;r.position.y=0.13;g.add(r);
  const s=label('TASK','#e3a347','#3a2a30');s.scale.set(1.5,0.3,1);s.position.y=2.6;g.add(s);g.userData.bob=1;g.position.set(spot[id][0],0,spot[id][1]);return add(g);}
 function nextTask(e){e.goal=rpick(LOCS.filter(l=>l!==e.goal));e.arrived=false;e.doing=0;const [x,z]=freeNear(spot[e.goal][0],spot[e.goal][1],1.6);if(!e.w.goTo(G,x,z,true,0.3))e.goal=null;}
 function start(role){cleanup();const {P,player}=h.getP();const imp=role==='imp';const ents=[];
  const [sx,sz]=freeNear(spot.classroom[0],spot.classroom[1],1);P.place(sx,sz);P.lock=false;
  const me={name:'You',col:'#a8553f',o:player,w:P,alive:true,isImp:imp,isPlayer:true,lastLoc:'classroom'};ents.push(me);
  shuf(CREW).slice(0,6).forEach(([name,col,hair,sk],k)=>{const o=makePerson({skin:SKIN[k%4],shirt:col,bottom:'#2b2b33',hair,skirt:sk,casual:1});const l=label(name,col);l.position.y=2.25;l.scale.set(1.7,0.34,1);o.add(l);add(o);
   const [x,z]=freeNear(spot.classroom[0],spot.classroom[1],4);ents.push({name,col,o,w:new Walker(o,x,z,2.0),alive:true,isImp:false,isPlayer:false,tasksLeft:imp?6:4,doing:0,wait:Math.random()*2,lastLoc:'classroom'});});
  let I=me;if(!imp){I=rpick(ents.slice(1));I.isImp=true;I.tasksLeft=0;}
  const mine=imp?[]:shuf(TASKS).slice(0,4).map(t=>({...t,done:false}));
  S={role,ents,me,I,bodies:[],puffs:[],done:0,total:mine.length+ents.reduce((n,e)=>n+(e.isPlayer?0:e.tasksLeft),0),phase:'intro',t:0,cd:imp?12:20,emerg:1,mine,myDone:0,kills:0,hudT:0};
  mine.forEach(t=>t.mk=marker(t.at));h.big(imp?'IMPOSTOR':'CREW');hud();
  setTimeout(()=>h.openSheet(`<div class="hand" style="font-size:20px;color:${imp?'#a8553f':'#55745c'}">You are ${imp?'the IMPOSTOR':'CREW'}</div><div class="hand" style="font-size:32px;line-height:1;">Who stole the chalk?</div>
   <div style="font-size:14px;line-height:1.5;">${imp?'Chalk-dust classmates when nobody is watching (anyone within sight becomes a witness). Fake tasks to blend in. Get voted out and you lose. Win when only one classmate is left.':'Someone stole the chalk box and is chalk-dusting classmates. Do your 4 tasks (yellow rings), stick with others, report anyone you find chalk-dusted, then vote. Check stories against each other. The impostor lies.'}</div>
   <div style="font-size:12px;opacity:.8;">WASD / tap to move · E to use · Emergency bell at the SS1 door (once)</div><button class="btn pri" id="go">Start</button>`,b=>b.querySelector('#go').onclick=()=>{h.closeSheet();S.phase='play';S.ents.forEach(e=>{if(!e.isPlayer)nextTask(e);});}),1000);}
 function isolated(I,c,bold){for(const o of S.ents){if(!o.alive||o===I||o===c)continue;const d=Math.hypot(o.w.x-c.w.x,o.w.z-c.w.z);if(o.isPlayer){if(!bold&&d<10)return false;}else if(d<7)return false;}return true;}
 function impAI(dt){const I=S.I;
  if(I.chase){const c=I.chase;if(!c.alive||!isolated(I,c,I.bold)){I.chase=null;nextTask(I);return;}I.re-=dt;if(I.re<=0){I.re=0.35;I.w.goTo(G,c.w.x,c.w.z,true);}if(dist(I,c)<1.3){kill(I,c);I.chase=null;nextTask(I);}return;}
  if(S.cd<=0&&S.t>8){const bold=Math.random()<0.12;const cs=S.ents.filter(c=>c.alive&&c!==I&&dist(I,c)<22&&isolated(I,c,bold)).sort((a,b)=>dist(I,a)-dist(I,b));if(cs.length){I.chase=cs[0];I.bold=bold;I.re=0;I.goal=null;I.doing=0;}}}
 function kill(k,v){v.alive=false;v.w.path=[];const x=v.w.x,z=v.w.z;
  if(v.isPlayer){end(false,`${k.name} was the impostor and caught you alone!`);return;}
  const u=v.o.userData;u.rig.rotation.x=-1.45;u.rig.position.y=0.2;
  const g=new THREE.Group();g.position.set(x,0,z);for(let i=0;i<7;i++){const s=new THREE.Mesh(new THREE.SphereGeometry(0.35,8,6),new THREE.MeshLambertMaterial({color:'#f6efe0',flatShading:true,transparent:true,opacity:0.85}));s.position.set(Math.cos(i)*0.4,0.4,Math.sin(i*1.7)*0.5);g.add(s);}add(g);S.puffs.push({g,t:0});
  const near=S.ents.filter(e=>e.alive&&Math.hypot(e.w.x-x,e.w.z-z)<13);if(!near.includes(k))near.push(k);
  S.ents.forEach(e=>{if(e.alive&&!e.isPlayer&&e!==k&&Math.hypot(e.w.x-x,e.w.z-z)<9)e.saw={k,v};});
  if(!S.me.isImp&&Math.hypot(S.me.w.x-x,S.me.w.z-z)<11){S.me.saw={k,v};h.toast(`You saw ${k.name} chalk-dust ${v.name}!`);}
  S.total-=v.tasksLeft||0;v.tasksLeft=0;v.doing=0;
  S.bodies.push({e:v,x,z,loc:nearLoc(x,z),near:shuf(near),found:false,g});
  S.cd=k.isPlayer?16:22+Math.random()*8;h.sfx('thud');if(k.isPlayer){S.kills++;h.toast(`${v.name} is chalk-dusted. Get away before anyone sees!`);}checkEnd();}
 function meeting(reason){if(S.phase!=='play')return;S.phase='meeting';S.ents.forEach(e=>{e.w.path=[];e.chase=null;});h.closeSheet();h.sfx('level');h.big('MEETING!');setTimeout(()=>discuss(reason),1000);}
 function discuss(reason){const alive=S.ents.filter(e=>e.alive);const lines=[{sys:1,t:reason}];
  S.bodies.forEach(b=>lines.push({sys:1,t:`${b.e.name} was chalk-dusted near the ${LN[b.loc]}. Around there at the time: ${b.near.map(nm).join(', ')}.`}));
  shuf(alive.filter(e=>!e.isPlayer)).forEach(e=>{
   if(e.isImp){const v=alive.filter(o=>o!==e);if(Math.random()<0.55&&v.length){const t=rpick(v);e.accuse=t;lines.push({e,t:`${t.isPlayer?'YOU were':t.name+' was'} acting sus near the ${LN[t.lastLoc]}.`});}else lines.push({e,t:`I was doing my task at the ${LN[rpick(LOCS.filter(l=>l!==e.lastLoc))]} the whole time.`});}
   else if(e.saw&&e.saw.k.alive&&Math.random()<0.85){e.accuse=e.saw.k;lines.push({e,t:`I SAW ${nm(e.saw.k)} chalk-dust ${e.saw.v.name}!`,hot:1});}
   else{const o=rpick(alive.filter(x=>x!==e));lines.push({e,t:`I was at the ${LN[e.lastLoc]}.`+(o&&Math.random()<0.7?` I saw ${o.isPlayer?'you':o.name} at the ${LN[o.lastLoc]}.`:'')});}});
  if(S.me.saw&&S.me.saw.k.alive)lines.push({sys:1,t:`You saw ${S.me.saw.k.name} do it.`});
  const row=l=>l.sys?`<div style="font-size:13px;font-weight:700;background:#fff3c4;border:2px solid #3a2a30;border-radius:10px;padding:6px 10px;">${l.t}</div>`:`<div class="row" style="align-items:flex-start;"><span class="glyph" style="background:${l.e.col};color:#fff;flex:none;">${l.e.name[0]}</span><div style="font-size:14px;line-height:1.35;${l.hot?'font-weight:700;color:#a8553f;':''}"><b style="font-family:'Patrick Hand',cursive;font-size:18px;font-weight:400;">${l.e.name}:</b> ${l.t}</div></div>`;
  const btns=alive.filter(e=>!e.isPlayer).map(e=>`<button class="opt" data-v="${e.name}" style="padding:6px 10px;"><span class="glyph" style="background:${e.col}"></span><b style="font-size:19px;flex:1;">${e.name}</b></button>`).join('');
  h.openSheet(`<div class="hand" style="font-size:32px;line-height:1;">Emergency meeting</div>${lines.map(row).join('')}<div class="hand" style="font-size:22px;">${S.me.isImp?'Vote: blame someone else':'Who is the impostor?'}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">${btns}</div><button class="btn" data-v="skip">Skip vote</button>`,b=>b.querySelectorAll('[data-v]').forEach(el=>el.onclick=()=>tally(el.dataset.v)));}
 function tally(pv){const alive=S.ents.filter(e=>e.alive);const target=pv==='skip'?null:alive.find(e=>e.name===pv);const votes=[{from:S.me,to:target}];
  const hot=alive.filter(e=>e.accuse&&e.saw&&!e.isImp).map(e=>e.accuse);const nearAll=S.bodies.flatMap(b=>b.near).filter(e=>e.alive);
  alive.forEach(e=>{if(e.isPlayer)return;let to=null;
   if(e.isImp){const acc=alive.filter(o=>o.accuse===e);to=acc.length?rpick(acc):(target&&target!==e?target:(e.accuse&&e.accuse.alive?e.accuse:null));}
   else if(e.saw&&e.saw.k.alive)to=e.saw.k;else if(hot.length&&Math.random()<0.75)to=rpick(hot);else if(target&&target!==e&&Math.random()<0.35)to=target;
   else{const n=nearAll.filter(o=>o!==e);if(n.length&&Math.random()<0.45)to=rpick(n);}
   if(to===e)to=null;votes.push({from:e,to});});
  const c=new Map();let skip=0;votes.forEach(v=>{if(!v.to)skip++;else c.set(v.to,(c.get(v.to)||0)+1);});
  let top=null,tn=0,tie=false;c.forEach((n,e)=>{if(n>tn){tn=n;top=e;tie=false;}else if(n===tn)tie=true;});const out=(!top||tie||tn<=skip)?null:top;
  const vr=(e,n)=>`<div class="row"><span class="glyph" style="background:${e?e.col:'#fff'}">${e?'':'–'}</span><b style="font-family:'Patrick Hand',cursive;font-size:19px;font-weight:400;flex:1;">${e?nm(e):'Skipped'}</b><span style="letter-spacing:2px;">${'●'.repeat(n)}</span></div>`;
  const list=[...c.entries()].sort((a,b)=>b[1]-a[1]).map(([e,n])=>vr(e,n)).join('')+vr(null,skip);
  const verdict=!out?'No one was voted out.':out.isPlayer?`You were ejected… ${out.isImp?'You were the impostor!':''}`:`${out.name} was ejected… ${out.isImp?'and was the impostor!':'and was NOT the impostor.'}`;
  h.sfx(out&&out.isImp?'power':'thud');
  h.openSheet(`<div class="hand" style="font-size:30px;line-height:1;">Votes</div>${list}<div class="card" style="padding:10px 12px;font-family:'Patrick Hand',cursive;font-size:24px;text-align:center;background:${out&&out.isImp!==S.me.isImp?'#dfe8d8':'#f5ead3'};">${verdict}</div><button class="btn pri" id="go">Continue</button>`,b=>b.querySelector('#go').onclick=()=>{h.closeSheet();afterVote(out);});}
 function afterVote(out){S.bodies.forEach(b=>{sc.remove(b.e.o);sc.remove(b.g);});S.bodies=[];S.puffs=[];S.ents.forEach(e=>{e.saw=null;e.accuse=null;});
  if(out){out.alive=false;if(out.isPlayer){end(false,'You were voted out! The class saw right through you.');return;}sc.remove(out.o);S.total-=out.tasksLeft||0;out.tasksLeft=0;if(out.isImp){end(true,`You caught ${out.name}! The chalk box was in their bag all along.`);return;}}
  S.cd=Math.max(S.cd,10);S.phase='play';S.ents.forEach(e=>{if(!e.isPlayer&&e.alive)nextTask(e);});checkEnd();}
 function checkEnd(){if(!S||S.phase==='over')return;const crew=S.ents.filter(e=>e.alive&&!e.isImp).length;
  if(S.I.alive&&crew<=1){end(S.me.isImp,S.me.isImp?'Only one classmate left standing. You got away with the chalk!':`${S.I.name} was the impostor. Too many classmates got chalk-dusted.`);return;}
  if(S.total>0&&S.done>=S.total)end(!S.me.isImp,S.me.isImp?'The crew finished all their tasks before you could stop them.':'All tasks done. The chalk box is back!');}
 function end(win,msg){if(!S||S.phase==='over')return;S.phase='over';h.closeSheet();const I=S.I;setTimeout(()=>h.onEnd({win,msg,role:S.role,impName:I.isPlayer?'You':I.name,impCol:I.col,tasks:S.myDone,kills:S.kills}),700);}
 function update(dt,t){if(!S)return;S.t+=dt;
  S.puffs.forEach(p=>{p.t+=dt;const k=Math.min(1,p.t/0.6);p.g.children.forEach((s,i)=>{s.scale.setScalar(0.2+k*(0.6+(i%3)*0.2));s.position.y=0.4+k*(0.3+i*0.05);});});
  tmp.forEach(o=>{if(o.userData.bob)o.children[1].position.y=2.6+Math.sin(t*4)*0.15;});
  if(S.phase!=='play'){S.ents.forEach(e=>{if(!e.isPlayer&&e.alive)poseUpdate(e.o,dt,false);});hudTick(dt);return;}
  if(S.cd>0)S.cd-=dt;
  S.ents.forEach(e=>{if(e.alive){const l=nearLoc(e.w.x,e.w.z,7);if(l)e.lastLoc=l;}});
  for(const e of S.ents){if(e.isPlayer||!e.alive)continue;if(e===S.I)impAI(dt);if(S.phase!=='play')break;
   const mv=e.w.step(dt);
   if(!mv&&!e.chase){if(e.goal&&!e.arrived){e.arrived=true;e.doing=(S.role==='imp'?6:4)+Math.random()*3;}
    if(e.doing>0){e.doing-=dt;if(e.doing<=0){if(e.tasksLeft>0){e.tasksLeft--;S.done++;}nextTask(e);}}else if(!e.goal){e.wait-=dt;if(e.wait<=0){e.wait=1;nextTask(e);}}}
   poseUpdate(e.o,dt,mv,(!mv&&e.doing>0)?'wave':null);
   if(!e.isImp){const b=S.bodies.find(b=>!b.found&&Math.hypot(b.x-e.w.x,b.z-e.w.z)<3.4);if(b){b.found=true;meeting(`${e.name} found ${b.e.name} chalk-dusted!`);break;}}}
  {const R=0.62,al=S.ents.filter(e=>e.alive);for(let i=0;i<al.length;i++)for(let j=i+1;j<al.length;j++){const a=al[i],b=al[j],dx=b.w.x-a.w.x,dz=b.w.z-a.w.z,d2=dx*dx+dz*dz;if(d2<R*R&&d2>1e-6){const d=Math.sqrt(d2),k=(R-d)/d;
    const ka=a.isPlayer?0:b.isPlayer?k:k/2,kb=b.isPlayer?0:a.isPlayer?k:k/2;const ax=a.w.x-dx*ka,az=a.w.z-dz*ka,bx=b.w.x+dx*kb,bz=b.w.z+dz*kb;if(G.free(ax,az)){a.w.x=ax;a.w.z=az;a.o.position.set(ax,0,az);}if(G.free(bx,bz)){b.w.x=bx;b.w.z=bz;b.o.position.set(bx,0,bz);}}}}
  checkEnd();hudTick(dt);}
 function prompt(){if(!S||S.phase!=='play'||h.isSheet())return null;const me=S.me,px=me.w.x,pz=me.w.z;
  const b=S.bodies.find(b=>Math.hypot(b.x-px,b.z-pz)<2.6);if(b)return{text:`${b.e.name} is chalk-dusted!`,btn:'REPORT',on:()=>{b.found=true;meeting(`You reported ${b.e.name}.`);}};
  if(me.isImp){const c=S.ents.find(e=>e.alive&&!e.isPlayer&&Math.hypot(e.w.x-px,e.w.z-pz)<1.9);if(c)return S.cd>0?{text:`${c.name} is right here…`,btn:`Ready in ${Math.ceil(S.cd)}s`,on:()=>{}}:{text:`${c.name} is right here…`,btn:'Chalk-dust',on:()=>kill(me,c)};}
  else{const t=S.mine.find(t=>!t.done&&Math.hypot(spot[t.at][0]-px,spot[t.at][1]-pz)<2.2);if(t)return{text:t.n,btn:'Do task',on:()=>runTask(t)};}
  if(S.emerg>0&&Math.hypot(spot.classroom[0]-px,spot.classroom[1]-pz)<2.6)return{text:'Emergency bell',btn:'Ring it',on:()=>{S.emerg--;meeting('You rang the emergency bell!');}};
  if(me.isImp){const l=nearLoc(px,pz,2.2);if(l)return{text:`Task spot: ${LN[l]}`,btn:'Fake task',on:()=>h.toast('You pretend to work. Nobody suspects a thing…')};}
  return null;}
 function runTask(t){const done=()=>{if(t.done)return;t.done=true;S.done++;S.myDone++;sc.remove(t.mk);h.closeSheet();h.sfx('power');h.toast(`Task done: ${t.n}`);checkEnd();};
  const head=`<div class="hand" style="font-size:28px;line-height:1;">${t.n}</div>`,stop=`<button class="btn" id="stop">Stop</button>`,bs=b=>b.querySelector('#stop').onclick=h.closeSheet;
  if(t.mini==='smudge')h.openSheet(`${head}<div style="font-size:13px;">Tap every chalk smudge.</div><div id="mg" style="position:relative;height:180px;background:#2f4536;border:6px solid #8a5a34;border-radius:8px;overflow:hidden;"></div>${stop}`,b=>{bs(b);const mg=b.querySelector('#mg');let n=7;
   for(let i=0;i<7;i++){const s=document.createElement('div');s.style.cssText=`position:absolute;left:${5+Math.random()*72}%;top:${8+Math.random()*62}%;width:${46+Math.random()*24}px;height:${30+Math.random()*14}px;border-radius:50%;background:rgba(240,234,220,0.75);cursor:pointer;`;s.onpointerdown=()=>{s.remove();h.sfx('swish');if(--n===0)done();};mg.appendChild(s);}});
  if(t.mini==='order')h.openSheet(`${head}<div style="font-size:13px;">Tap 1 → 6 in order.</div><div id="mg" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;"></div>${stop}`,b=>{bs(b);const mg=b.querySelector('#mg');let next=1;
   const build=()=>{mg.innerHTML='';next=1;shuf([1,2,3,4,5,6]).forEach(n=>{const e=document.createElement('button');e.className='btn';e.style.fontSize='28px';e.textContent=n;e.onclick=()=>{if(n===next){e.style.background='#55745c';e.style.color='#fff';e.disabled=true;h.sfx('coin');if(++next>6)done();}else{h.sfx('thud');h.toast('Wrong order. Start again.');build();}};mg.appendChild(e);});};build();});
  if(t.mini==='hold')h.openSheet(`${head}<div style="font-size:13px;">Hold, then let go inside the green zone.</div><div style="position:relative;height:34px;border:2.5px solid #3a2a30;border-radius:10px;background:#fff;overflow:hidden;"><div style="position:absolute;left:68%;width:16%;top:0;bottom:0;background:#b9d3a8;"></div><div id="fill" style="position:absolute;left:0;top:0;bottom:0;width:0%;background:#4f6e8a;opacity:.85;"></div></div><button class="btn pri" id="hold" style="font-size:26px;touch-action:none;">HOLD</button>${stop}`,b=>{bs(b);const f=b.querySelector('#fill'),hb=b.querySelector('#hold');let v=0,on=false,raf;
   const tick=()=>{if(!on)return;v=Math.min(100,v+0.9);f.style.width=v+'%';raf=requestAnimationFrame(tick);};hb.onpointerdown=e=>{e.preventDefault();on=true;tick();};
   const rel=()=>{if(!on)return;on=false;cancelAnimationFrame(raf);if(v>=68&&v<=84)done();else{h.toast(v<68?'Not enough!':'Overflow! Try again.');v=0;f.style.width='0%';}};hb.onpointerup=rel;hb.onpointerleave=rel;});
  if(t.mini==='sort'){const C=[['#c0563f','Red'],['#4f6e8a','Blue'],['#55745c','Green'],['#e3a347','Yellow']];
   h.openSheet(`${head}<div style="font-size:13px;">Put each book on the shelf of the same colour.</div><div class="row" style="justify-content:center;gap:16px;"><div id="book" style="width:46px;height:70px;border:2.5px solid #3a2a30;border-radius:4px;"></div><span id="cnt" class="hand" style="font-size:22px;">1/5</span></div><div id="mg" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;"></div>${stop}`,b=>{bs(b);let r=0,cur;const book=b.querySelector('#book'),cnt=b.querySelector('#cnt'),mg=b.querySelector('#mg');
    const nb=()=>{cur=Math.floor(Math.random()*4);book.style.background=C[cur][0];cnt.textContent=(r+1)+'/5';};
    C.forEach(([c,n],i)=>{const e=document.createElement('button');e.className='btn';e.style.background=c;e.style.color='#fff';e.style.height='64px';e.textContent=n;e.onclick=()=>{if(i===cur){h.sfx('coin');if(++r>=5)done();else nb();}else h.sfx('thud');};mg.appendChild(e);});nb();});}}
 function hudTick(dt){S.hudT-=dt;if(S.hudT>0)return;S.hudT=0.25;hud();}
 function hud(){const el=document.getElementById('impHud');if(!el||!S)return;const me=S.me;
  const roster=S.ents.filter(e=>!e.isPlayer).map(e=>`<span title="${e.name}" style="width:16px;height:16px;border-radius:50%;background:${e.col};border:2px solid #3a2a30;opacity:${e.alive?1:0.25};display:inline-block;"></span>`).join('');
  const tl=me.isImp?`<div style="font-size:12px;font-weight:700;">${S.cd>0?'Chalk-dust ready in '+Math.ceil(S.cd)+'s':'Chalk-dust READY. Find someone alone.'}</div><div style="font-size:12px;">Crew left: ${S.ents.filter(e=>e.alive&&!e.isImp).length}</div>`
   :S.mine.map(t=>`<div style="font-size:12px;${t.done?'text-decoration:line-through;opacity:.55;':''}">${t.done?'✓':'•'} ${t.n} <span style="opacity:.7">(${LN[t.at]})</span></div>`).join('');
  el.innerHTML=`<div class="hand" style="font-size:24px;line-height:1;color:${me.isImp?'#a8553f':'#55745c'}">${me.isImp?'IMPOSTOR':'CREW'}</div><div style="font-size:11px;font-weight:700;margin-top:4px;">CLASS TASKS ${Math.min(S.done,S.total)}/${S.total}</div><div class="qbar"><div style="width:${Math.min(100,S.done/Math.max(1,S.total)*100)}%;background:#55745c"></div></div><div style="display:flex;flex-direction:column;gap:2px;margin-top:6px;">${tl}</div><div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap;">${roster}</div><div style="display:flex;gap:8px;margin-top:8px;align-items:center;"><button class="btn" id="impQuit" style="font-size:15px;padding:3px 10px;">Quit</button>${S.emerg>0?'<span style="font-size:11px;">Emergency bell at the SS1 door</span>':''}</div>`;}
 function cleanup(){tmp.forEach(o=>sc.remove(o));tmp.length=0;if(S){S.ents.forEach(e=>{if(!e.isPlayer)sc.remove(e.o);});const u=S.me.o.userData;u.rig.rotation.x=0;}S=null;}
 return{start,update,prompt,cleanup,canMove:()=>!!S&&S.phase==='play'};}
