import * as THREE from 'three';
import {poseUpdate} from '../common.js';
import {TAJ} from './excursion-data.js';
import {buildOut,INTERIORS,DOORS,PHOTOS,hAt,planCanvas,PLAN} from './taj-build.js';
// Taj Mahal excursion logic: guided stops, free exploration, building entry/exit, activities, photos, checklist.
const V=(x,y,z)=>new THREE.Vector3(x,y,z),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const CN=TAJ.coordinator;
const ROUTES={0:[[0,62],[0,55.5]],1:[[0,50],[0,46],[0,41.5],[3.4,38.5],[3.4,15.5]],2:[[5.5,11],[5.5,-1],[3.4,-3],[3.4,-29],[1.5,-33]],3:[[0,-35],[0,-38.3],[0,-42.3]],
 4:[[0,-38.3],[0,-35],[-6,-33.5],[-24,-38],[-31,-48]],5:[[-24,-38],[-6,-33],[-3.4,-29],[-3.4,-3],[-5.5,-1],[-5.5,11],[-3.4,15],[-3.4,38.5],[0,41.5],[0,46],[0,50],[0,56],[0,63]]};
const BUILD_LIST=[['v_ticket','Ticket & Security Office'],['v_gate','Great Gate (walk through)'],['v_info','Visitor Information Centre'],['v_tomb','Mausoleum'],['v_mosque','Mosque'],['v_jawab','Jawab'],['v_shop','Gift Shop'],['v_cafe','Refreshment Kiosk'],['v_guard','Security Booth']];
export function createTaj(X){const {h,kids,coord,camera}=X;
 const OUT=buildOut();const INT={};const getInt=id=>INT[id]||(INT[id]=INTERIORS[id]());
 let S=null;const you=()=>X.you();
 // exterior interaction points
 const OPTS=[{x:-3,z:67.4,r:1.4,t:'Read: Welcome board',sign:0},{x:7.4,z:13,r:1.5,t:'Read: The charbagh',sign:2},{x:-25,z:-38.8,y:1,r:1.5,t:'Read: Mosque and jawab',sign:5},{x:4.8,z:-35,y:1,r:1.3,t:'Read: The marble platform',sign:3},
  {x:11.8,z:-40.4,y:3.5,r:1.4,t:'Read: The minarets',panel:'minaret'},{x:-1.8,z:-67.4,y:3.5,r:1.4,t:'Read: The Yamuna River',panel:'river'},
  {x:-6,z:-40.2,y:3.5,r:1.6,t:'Look up at the great dome',disc:'d_dome'},{x:12.2,z:-42.6,y:3.5,r:1.4,t:'Inspect the minaret',disc:'d_minaret'},{x:3.8,z:-43,y:3.5,r:1.2,t:'Study the main arch',disc:'d_arch'},
  {x:-11.2,z:-47,y:3.5,r:1.5,t:'Examine the marble inlay',disc:'d_inlay'},{x:0,z:-0.9,r:1.5,t:'Check the symmetry',disc:'d_sym'},{x:2,z:-68.6,y:3.5,r:1.6,t:'Look out over the river',disc:'d_river'},
  {x:-4.6,z:46,r:1.4,t:'Read: How the gate frames the view',panel:'gate1'},{x:4.6,z:46,r:1.4,t:'Read: Lettering that grows',panel:'gate2',disc:'d_cal'},
  {x:4.6,z:-34.2,y:1,r:1.3,t:S=>S.done.shoes?'Shoe covers on \u2713':'Collect shoe covers',act:'shoes'}];
 const DESC={d_dome:'d_dome',d_minaret:'d_minaret'};
 const panelSheet=(t,x,after)=>h.openSheet(`<div class="hand" style="font-size:28px;line-height:1;">${t}</div><div style="font-size:15px;line-height:1.45;">${x}</div><button class="btn pri" id="ok">Close</button>`,b=>b.querySelector('#ok').onclick=()=>{h.closeSheet();after&&after();});
 const save=()=>h.saveProg&&h.saveProg({done:S.done,photos:S.photos,bought:S.bought||[]});
 function mark(k){if(!S.done[k]){S.done[k]=1;save();refreshObj();}}
 // ---------- movement ----------
 function moveOn(nav,p,tx,tz,sp,dt){const dx=tx-p.x,dz=tz-p.z,d=Math.hypot(dx,dz);if(d<0.15)return false;const m=Math.min(d,sp*dt),nx=p.x+dx/d*m,nz=p.z+dz/d*m;const y=hAt(nav,nx,nz,p.y);if(y!=null){p.x=nx;p.z=nz;p.y=y;p.ry=Math.atan2(dx,dz);return true;}
  const y2=hAt(nav,nx,p.z,p.y);if(y2!=null){p.x=nx;p.y=y2;p.ry=Math.atan2(dx,dz);return true;}const y3=hAt(nav,p.x,nz,p.y);if(y3!=null){p.z=nz;p.y=y3;p.ry=Math.atan2(dx,dz);return true;}return null;}
 const turn=(p,fx,fz,dt,k=3)=>{if(Math.hypot(fx,fz)<0.3)return;p.ry+=(((Math.atan2(fx,fz)-p.ry+Math.PI*3)%(Math.PI*2))-Math.PI)*Math.min(1,dt*k);};
 const pExt=()=>S.loc==='out'?{x:S.px,z:S.pz,y:S.py}:{x:S.back.x,z:S.back.z,y:S.back.y};
 // ---------- arrival ----------
 function arrive(){S=X.S();Object.assign(S,{ph:'taj',sc:OUT.sc,loc:'out',st:'ARRIVING',t:0,stop:-1,route:null,walking:0,trail:[],off:0,ready:0,awaitStop:null,awaitEnter:0,inKids:[],coordIn:0,chatT:9,gp:0,sit:null,ruleT:0,bought:[]});
  const prev=h.loadProg&&h.loadProg();if(prev){Object.assign(S.done,prev.done||{});Object.assign(S.photos,prev.photos||{});S.bought=prev.bought||[];delete S.done.final;if(Object.keys(prev.done||{}).length)setTimeout(()=>h.toast('Your earlier progress at the Taj Mahal has been restored.'),1500);}
  X.unseat(OUT.sc);kids.forEach((k,i)=>{k.x=29+(i%4)*0.9;k.z=93.6+Math.floor(i/4)*0.8;k.y=0;k.o.visible=false;k.inside=0;});coord.x=27;coord.z=93;coord.y=0;coord.o.visible=false;you().visible=false;
  S.px=28;S.pz=94.2;S.py=0;S.yaw=-Math.PI/2;OUT.coach.position.set(95,0,96);X.setCam(0.85,0.5,18);X.ambience('nature');
  X.obj('Arriving in Agra','The coach pulls into the Taj Mahal car park. Petrol and diesel vehicles must stop here, away from the monument.');paintTop();}
 // ---------- guided stops ----------
 const needOk=k=>k==='tickets'?S.done.tickets:k==='shoes'?S.done.shoes:k==='flanks'?(S.done.v_mosque&&S.done.v_jawab):true;
 function hint(){const n=S.stop,D=S.done,ck=v=>v?'\u2713':'\u25cb';
  if(n===0)return D.tickets?'\u2713 Tickets collected. Tap Continue when you\u2019re ready.':'Collect the class tickets inside the Ticket Office (red building, right side).';
  if(n===1)return 'Read the panels inside the gate, then walk through with the group.';
  if(n===2)return `Explore the garden. Photos: ${['ph_frame','ph_pool'].filter(k=>S.photos[k]).length}/2 · Group photo ${ck(S.photos.group)} · Symmetry ${ck(D.d_sym)}`;
  if(n===3)return `${ck(D.shoes)} Shoe covers · Discoveries on the platform: ${['d_dome','d_minaret','d_arch','d_inlay','d_river'].filter(k=>D[k]).length}/5`;
  if(n===4)return 'Explore quietly: inlay (east hall), calligraphy (west hall), reconstruction (north hall).';
  if(n===5)return `${ck(D.v_mosque)} Mosque (west) · ${ck(D.v_jawab)} Jawab (east)`;
  if(n===6)return 'Free time: Visitor Centre, gift shop, kiosk. Tap "Ready to go home" when you\u2019re done.';return '';}
 function refreshObj(){if(!S)return;if(S.loc!=='out'){const I=INT[S.loc];X.obj(I.name,(S.stop===4&&S.loc==='tomb'?hint():I.sub));return;}if(S.ready&&S.stop>=0)X.obj(TAJ.stops[S.stop].title,hint());}
 function stopBegin(n){S.stop=n;S.ready=0;const s=TAJ.stops[n];X.obj(s.title,`Stop ${n+1} of 8 \u00b7 listen to ${CN}`);if(n===7)return finalHead();
  X.say(CN,s.lines,()=>{S.ready=1;refreshObj();paintTop();});}
 function next(){const n=S.stop,s=TAJ.stops[n];if(!S.ready||X.dlg())return;if(s.need&&!needOk(s.need))return X.say(CN,[s.needMsg]);S.ready=0;paintTop();
  if(n===4)return exitInterior();if(n===6){return stopBegin(7);}
  S.route=ROUTES[n].map(p=>p.slice());S.walking=1;S.st='GUIDING';S.nextStop=n===3?null:n+1;S.toDoor=n===3?1:0;X.obj('Follow '+CN,'Stay close to the group.');}
 function routeDone(){S.route=null;S.walking=0;if(S.toDoor){S.toDoor=0;S.awaitEnter=1;X.obj('Enter the mausoleum',`${CN} is waiting at the doorway. Walk up and go in with the group.`);h.toast(`${CN}: "In we go. Quietly, please."`);return;}
  if(S.nextStop!=null){S.awaitStop=S.nextStop;S.nextStop=null;X.obj('Regroup',`Gather round ${CN}.`);}}
 function coachMenu(){const s=TAJ.stops[S.stop]||{};const b=[];if(s.sign)b.push(['Read the sign','sign']);if(s.quiz)b.push(['Questions','quiz']);if(S.stop===2&&!S.photos.group)b.push(['Group photo','gp']);b.push([s.next?s.next+' \u25b8':'Okay','go']);
  X.say(CN,[S.stop===6?'Enjoy your free time. Tell me when you\u2019re ready.':'Yes? Have a good look around. Shout when you\u2019re ready to move on.'],id=>{if(id==='sign'){S.done['sign'+S.stop]=1;save();return panelSheet(s.sign[0],s.sign[1],coachMenu);}if(id==='quiz')return X.quiz(s.quiz,()=>{S.done['quiz'+S.stop]=1;save();coachMenu();},'t'+S.stop);if(id==='gp')return groupPhoto();if(id==='go')next();},b);}
 function groupPhoto(){if(S.photos.group)return;S.gp=3.4;X.obj('Group photo!','Everyone squeeze in by the marble tank\u2026');S.px=0;S.pz=10.7;S.py=0;S.yaw=0;
  setTimeout(()=>{if(!S)return;X.flash();h.sfx&&h.sfx('level');S.photos.group=1;S.gp=0;save();h.memory('Class photo at the Taj Mahal',X.NAMES.slice(0,4).join(', ')+' & co.',`The whole class with ${CN} by the marble tank, the Taj Mahal behind us.`,'#c97a9a');refreshObj();paintTop();},3500);}
 function finalHead(){S.st='FINAL_HEADCOUNT';let i=0;const n=()=>{if(!S)return;if(i<kids.length){h.toast(`${CN}: "${i+1}\u2026"`);i++;setTimeout(n,260);}else X.say(CN,['Everyone is here. Quick reflection before the coach: what did you learn today?'],()=>X.quiz(TAJ.recap,()=>X.say(CN,[`${kids.length+1} students, all present. You were respectful and curious today. Well done! To the coach.`],()=>{S.done.final=1;save();X.startReturn();}),'recap'));};n();}
 // ---------- photos & checklist ----------
 function photo(){if(!S.off)return;if(S.loc==='tomb')return h.toast('Photography is not allowed inside the mausoleum.');if(S.loc==='mosque')return h.toast('Please don\u2019t take photos inside the prayer hall.');X.flash();h.sfx&&h.sfx('swish');
  const sp=PHOTOS.find(p=>p.loc===S.loc&&Math.hypot(S.px-p.x,S.pz-p.z)<4.5&&Math.abs(p.y-S.py)<1.5);if(!sp)return h.toast('Snap! For the photo challenge, stand by one of the green camera posts.');
  if(S.photos[sp.id])return h.toast('You already have this shot.');S.photos[sp.id]=1;save();h.memory('Photo: '+sp.t,'',sp.m,'#c97a9a');refreshObj();}
 function checklist(){const D=S.done,P=S.photos,row=(ok,t)=>`<div style="display:flex;gap:8px;align-items:center;font-size:14px;"><b style="width:18px;color:${ok?'#55745c':'#a8553f'}">${ok?'\u2713':'\u25cb'}</b><span>${t}</span></div>`;
  const sec=(t,list)=>`<div style="font-size:12px;font-weight:700;margin-top:6px;">${t} (${list.filter(x=>x[0]).length}/${list.length})</div>${list.map(([o,t])=>row(o,t)).join('')}`;
  h.openSheet(`<div class="hand" style="font-size:30px;line-height:1;">Taj Mahal checklist</div><div style="max-height:62vh;overflow:auto;display:flex;flex-direction:column;gap:2px;">
   ${sec('Getting in',[[D.tickets,'Collect the class tickets'],[D.shoes,'Put on shoe covers']])}
   ${sec('Architectural discoveries',TAJ.disc.map(d=>[D[d.id],d.t]))}
   ${sec('Buildings explored',BUILD_LIST.map(([k,t])=>[D[k],t]))}
   ${sec('Photo challenge',[...PHOTOS.map(p=>[P[p.id],p.t]),[P.group,'Class group photo']])}
   ${sec('Extras',[[D.map,'Use the interactive map'],[D.staff,'Ask staff for directions'],[D.symq,'Solve the symmetry puzzle'],[D.souv,'Buy a souvenir (optional)']])}</div><button class="btn pri" id="ok">Close</button>`,b=>b.querySelector('#ok').onclick=h.closeSheet);}
 function mapSheet(){const c=planCanvas(),g=c.getContext('2d'),{X:MX,Z:MZ}=c.userData;const p=pExt();g.fillStyle='#c0563f';g.beginPath();g.arc(MX(p.x),MZ(p.z),9,0,7);g.fill();g.strokeStyle='#fff';g.lineWidth=3;g.stroke();
  const st=TAJ.stops.slice(0,7).map((s,i)=>`<div style="font-size:13px;">${S.stop>i?'\u2713':i===S.stop?'\u25b8':'\u25cb'} ${i+1}. ${s.title}</div>`).join('');
  h.openSheet(`<div class="hand" style="font-size:28px;line-height:1;">Site map</div><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-start;"><img src="${c.toDataURL()}" style="width:min(240px,42vw);border:2px solid #3a2a30;border-radius:8px;"><div style="flex:1;min-width:160px;display:flex;flex-direction:column;gap:3px;"><b style="font-size:13px;">Today\u2019s route</b>${st}<div style="font-size:12px;opacity:.8;margin-top:4px;">Red dot: you are here. North (the river) is at the top.</div></div></div><button class="btn pri" id="ok">Close</button>`,b=>b.querySelector('#ok').onclick=h.closeSheet);}
 function shopSheet(){h.openSheet(`<div class="row" style="justify-content:space-between;"><span class="hand" style="font-size:30px;line-height:1;">Taj Gift Shop</span><span class="card chip"><span class="coin"></span>\u20a6${h.bank()}</span></div><div style="font-size:13px;">Optional. You pay from your own pocket money; souvenirs go into your bag.</div>${TAJ.shop.map(([k,n,p,d])=>`<button class="opt" data-k="${k}"><span class="glyph">\u20a6</span><div style="flex:1;text-align:left;"><b>${n} \u00b7 \u20a6${p}</b><small>${d}</small></div></button>`).join('')}<button class="btn pri" id="ok">Done</button>`,b=>{b.querySelector('#ok').onclick=h.closeSheet;
  b.querySelectorAll('[data-k]').forEach(e=>e.onclick=()=>{const it=TAJ.shop.find(x=>x[0]===e.dataset.k);if(!h.spend(it[2])){h.sfx&&h.sfx('thud');return h.toast('Shopkeeper: "Sorry, that\u2019s more than you have."');}h.give(it[0]);S.bought.push(it[1]);mark('souv');save();h.sfx&&h.sfx('power');h.toast(`Bought: ${it[1]}. It\u2019s in your bag.`);shopSheet();});});}
 function cafeSheet(){h.openSheet(`<div class="row" style="justify-content:space-between;"><span class="hand" style="font-size:30px;line-height:1;">Refreshment Kiosk</span><span class="card chip"><span class="coin"></span>\u20a6${h.bank()}</span></div>${TAJ.cafe.map(([n,p,d],i)=>`<button class="opt" data-i="${i}"><span class="glyph">\u20a6</span><div style="flex:1;text-align:left;"><b>${n} \u00b7 \u20a6${p}</b><small>${d} +5 XP</small></div></button>`).join('')}<button class="btn pri" id="ok">Done</button>`,b=>{b.querySelector('#ok').onclick=h.closeSheet;
  b.querySelectorAll('[data-i]').forEach(e=>e.onclick=()=>{const [n,p]=TAJ.cafe[+e.dataset.i];if(!h.spend(p))return h.toast('Vendor: "Not enough money, my friend."');h.xp(5);h.sfx&&h.sfx('coin');h.toast(`${n}: delicious.`);cafeSheet();});});}
 // ---------- entering & leaving buildings ----------
 function enterInterior(id){const I=getInt(id),D=DOORS[id];const group=id==='tomb'&&S.awaitEnter;S.back={x:D.ret[0],z:D.ret[1],y:D.y,ry:D.ret[2]};
  const ks=group?kids.filter(k=>k.o.visible):kids.filter(k=>k.o.visible&&!k.inside).sort((a,b)=>Math.hypot(a.x-S.px,a.z-S.pz)-Math.hypot(b.x-S.px,b.z-S.pz)).filter(k=>Math.hypot(k.x-S.px,k.z-S.pz)<16).slice(0,3);
  S.loc=id;S.sc=I.sc;S.sit=null;X.putIn(I.sc,you());you().children.forEach(c=>{if(c.isSprite)c.visible=false;});[S.px,S.pz,S.yaw]=I.spawn;S.py=0;
  S.inKids=ks;ks.forEach((k,i)=>{k.inside=1;X.putIn(I.sc,k.o);let px=I.spawn[0]+((i%4)-1.5)*0.75,pz=I.spawn[1]+(i<4?-0.8:i<8?-1.6:-2.4);if(hAt(I.nav,px,pz,0)==null){px=I.spawn[0];pz=I.spawn[1]-0.6;}k.ip={x:px,z:pz,y:0,ry:I.spawn[2]};k.istuck=0;});
  if(group){S.awaitEnter=0;S.coordIn=1;X.putIn(I.sc,coord.o);coord.ip={x:I.spawn[0]+0.9,z:I.spawn[1],y:0,ry:Math.PI};S.iroute=[[0,8.2],[4.4,2.8]];S.stop=4;S.ready=0;}
  mark('v_'+id);{const c=X.cam();X.setCam(I.spawn[2]+Math.PI,0.45,Math.min(c.dist,I.camD||6.5));}X.ambience('indoor');h.sfx&&h.sfx('swish');refreshObj();paintTop();h.toast(id==='tomb'?'Cool marble and soft light. Everyone lowers their voices.':id==='mosque'?'Shoes off at the door. The prayer hall is calm and quiet.':`You step inside: ${I.name}.`);}
 function exitInterior(){const id=S.loc,D=DOORS[id];if(!D)return;if(S.coordIn||X.dlg())X.hideDlg();S.loc='out';S.sc=OUT.sc;S.sit=null;X.putIn(OUT.sc,you());you().children.forEach(c=>{if(c.isSprite)c.visible=true;});S.px=D.ret[0];S.pz=D.ret[1];S.py=D.y;S.yaw=D.ret[2];
  S.inKids.forEach((k,i)=>{X.putIn(OUT.sc,k.o);k.inside=0;const fx=Math.sin(D.ret[2]),fz=Math.cos(D.ret[2]),side=((i%3)-1)*0.9,back=1.2+Math.floor(i/3)*0.8;const ox=D.ret[0]+fx*back+fz*side,oz=D.ret[1]+fz*back-fx*side;const y=hAt(OUT.nav,ox,oz,D.y);if(y!=null){k.x=ox;k.z=oz;k.y=y;}else{k.x=D.ret[0];k.z=D.ret[1];k.y=D.y;}k.ry=D.ret[2];});S.inKids=[];
  if(S.coordIn){S.coordIn=0;X.putIn(OUT.sc,coord.o);coord.x=D.ret[0]+0.9;coord.z=D.ret[1]+0.4;coord.y=D.y;S.trail=[];S.stop=4;S.ready=0;S.awaitStop=null;S.route=ROUTES[4].map(p=>p.slice());S.walking=1;S.nextStop=5;X.obj('Follow '+CN,'On to the mosque and the jawab.');}
  {const c=X.cam();X.setCam(D.ret[2]+Math.PI,0.5,Math.max(12,c.dist));}X.ambience('nature');refreshObj();paintTop();}
 function regroup(){if(S.loc!=='out')exitInterior();const c=coord;const y=hAt(OUT.nav,c.x+1.4,c.z+1.4,c.y);if(y!=null){S.px=c.x+1.4;S.pz=c.z+1.4;S.py=y;}else{S.px=c.x;S.pz=c.z;S.py=c.y;}S.sit=null;h.toast('You hurry back to the group.');}
 // ---------- interactions ----------
 function doAct(p){const D=S.done;
  if(p.sign!=null){const s=TAJ.stops[p.sign].sign;D['sign'+p.sign]=1;save();return panelSheet(s[0],s[1]);}
  if(p.panel){const P=TAJ.panels[p.panel];mark('p_'+p.panel);if(p.disc)discover(p.disc,true);return panelSheet(P[0],P[1]);}
  if(p.disc)return discover(p.disc);
  const a=p.act;
  if(a==='shoes'){if(D.shoes)return h.toast('Your shoe covers are on.');mark('shoes');h.sfx&&h.sfx('coin');return h.toast('Attendant: "Shoe covers on, please. They protect the marble." You pull them over your shoes.');}
  if(a==='tickets'){if(D.tickets)return X.say('Ticket clerk',['Your group is all set. Remember: no photos inside the mausoleum, and the monument is closed on Fridays.']);
   return X.say('Ticket clerk',['Namaste! You must be the school group from Nigeria.',`Here are your tickets: one for each student and one for ${CN}. Your school has paid for everything.`,'Shoe covers are at the stand by the platform stairs. Enjoy your visit!'],()=>{mark('tickets');h.sfx&&h.sfx('level');h.toast('Got the class tickets! Take them back to '+CN+'.');paintTop();});}
  if(a==='staff'){mark('staff');return X.say('Information officer',['Welcome! The Great Gate is straight ahead, past the meeting point.','The tomb is at the far end of the garden, by the river. The mosque is on the west side and the jawab on the east.','Take a map from the table if you like. And please keep to the paths.'],()=>{});}
  if(a==='map'){mark('map');return mapSheet();}
  if(a==='shop')return shopSheet();
  if(a==='models'){mark('inspect');return h.toast('Little marble models, polished smooth. Each has four tiny minarets and an onion dome.');}
  if(a==='cards')return h.toast('Postcards: the tomb at sunrise, the gate, the gardens, and a view from across the river.');
  if(a==='cafe')return cafeSheet();
  if(a==='chat'){const k=S.inKids[0];if(!k)return h.toast('You sit for a moment and watch the visitors go by.');h.bond&&h.bond(k.n,1,'Shared a break at the Taj Mahal');return h.toast(`${k.n}: "${['This is the best trip ever.','Did you see the reflection in the pool?','I want to come back with my family one day.'][Math.floor(Math.random()*3)]}"`);}
  if(a==='lost')return h.toast('A sun hat, three water bottles and a single sandal. Nothing of yours, thankfully.');
  if(a==='sym'){if(D.symq)return h.toast('You\u2019ve solved the symmetry puzzle. Nice work.');return X.quiz(TAJ.sym,()=>{mark('symq');},'sym');}
  if(a==='bench'){S.sit=p.b;return;}}
 function discover(id,quiet){const d=TAJ.disc.find(x=>x.id===id);if(S.done[id]){if(!quiet)h.toast(d.t+': '+d.x);return;}mark(id);h.sfx&&h.sfx('power');const n=TAJ.disc.filter(x=>S.done[x.id]).length;if(!quiet)panelSheet('Discovery: '+d.t,`${d.x}<br><br><b>${n}/${TAJ.disc.length}</b> discoveries found.`);else h.toast(`Discovery: ${d.t} (${n}/${TAJ.disc.length})`);}
 function actions(){let act=null;if(!S.off||X.dlg()||h.sheetOpen()||S.gp>0){X.setAct(null);return;}
  if(S.sit){X.setAct('Stand up',()=>{S.sit=null;});return;}
  const near=(p,r)=>Math.hypot(S.px-p.x,S.pz-p.z)<r&&Math.abs((p.y||0)-S.py)<1.2;
  if(S.loc==='out'){const c=coord;if(S.ready&&Math.hypot(S.px-c.x,S.pz-c.z)<3)act=['Talk to '+CN,coachMenu];
   if(!act)for(const [id,D] of Object.entries(DOORS)){if(near(D,1.9)){if(id==='tomb'&&!S.done.shoes){act=['Shoe covers needed first',()=>h.toast('Collect shoe covers at the stand by the stairs.')];break;}act=[(id==='tomb'&&S.awaitEnter?'Go inside with the group: ':'Enter: ')+D.n,()=>enterInterior(id)];break;}}
   if(!act)for(const p of OPTS){if(near(p,p.r)){act=[typeof p.t==='function'?p.t(S):p.t,()=>doAct(p)];break;}}
   if(!act)for(const b of OUT.BENCH){if(Math.hypot(S.px-b.x,S.pz-b.z)<1.3){act=['Sit on the bench',()=>doAct({act:'bench',b})];break;}}
   if(!act){const sp=PHOTOS.find(p=>p.loc==='out'&&!S.photos[p.id]&&near(p,2.6));if(sp)act=['Take a photo: '+sp.t,photo];}}
  else{const I=INT[S.loc];const ex=I.exit;const exits=[[ex.x,ex.z],...(ex.also||[])];if(exits.some(([x,z])=>Math.hypot(S.px-x,S.pz-z)<ex.r+0.4))act=['Leave: '+I.name,exitInterior];
   if(!act&&S.coordIn&&S.ready&&Math.hypot(S.px-coord.ip.x,S.pz-coord.ip.z)<2.6)act=['Talk to '+CN,coachMenu];
   if(!act)for(const p of I.pts){if(near(p,p.r)){act=[typeof p.t==='function'?p.t(S):p.t,()=>doAct(p)];break;}}
   if(!act&&S.loc==='info'){const sp=PHOTOS.find(p=>p.loc==='info'&&!S.photos[p.id]&&near(p,2.4));if(sp)act=['Take a photo: '+sp.t,photo];}}
  X.setAct(act&&act[0],act&&act[1]);}
 // ---------- per-frame ----------
 function coordOut(dt,t){const c=coord;let mv=false;const P=pExt();if(S.coordIn)return;
  if(S.route&&S.route.length){const [tx,tz]=S.route[0];const far=Math.hypot(P.x-c.x,P.z-c.z)>18;if(far&&S.st==='GUIDING'){c.wait=(c.wait||0)+dt;if(c.wait>1.5&&!S.warned){S.warned=1;h.toast(`${CN}: "Stay with the group, please!"`);}}
   else{c.wait=0;S.warned=0;const r=moveOn(OUT.nav,c,tx,tz,2.3,dt);mv=!!r;if(!r)S.route.shift();}if(S.route&&!S.route.length)routeDone();}
  if(S.awaitStop!=null&&S.loc==='out'&&Math.hypot(S.px-c.x,S.pz-c.z)<8&&!X.dlg()&&!h.sheetOpen()){const n=S.awaitStop;S.awaitStop=null;stopBegin(n);}
  if(mv){const lt=S.trail[S.trail.length-1];if(!lt||Math.hypot(lt[0]-c.x,lt[2]-c.z)>0.35){S.trail.push([c.x,c.y,c.z]);if(S.trail.length>300)S.trail.shift();}}else turn(c,P.x-c.x,P.z-c.z,dt);
  c.o.position.set(c.x,c.y,c.z);c.o.rotation.y=c.ry;poseUpdate(c.o,dt,mv,null,0.85);if(!mv&&X.dlg())c.o.userData.arms[1].rotation.x=-0.9+Math.sin(t*3)*0.4;}
 function kidsOut(dt,t){const c=coord,n=kids.length;kids.forEach((k,i)=>{if(!k.o.visible||k.inside)return;let tx,tz,ty=c.y;
   if(S.gp>0){tx=-5+i*(10/(n-1));tz=i===n>>1?11.4:10.7+(i%2)*0.6;ty=0;}
   else if(S.walking&&S.trail.length){const p=S.trail[Math.max(0,S.trail.length-1-(3+i*2))];const side=i%2?0.55:-0.55;tx=p[0]+side*Math.cos(c.ry);tz=p[2]-side*Math.sin(c.ry);ty=p[1];if(hAt(OUT.nav,tx,tz,p[1])==null){tx=p[0];tz=p[2];}}
   else{const P=pExt();const a=(i/(n-1)-0.5)*2.4+Math.atan2(P.x-c.x,P.z-c.z),r=2.3+(i%3)*0.8;tx=c.x+Math.sin(a)*r;tz=c.z+Math.cos(a)*r;if(hAt(OUT.nav,tx,tz,c.y)==null){const p=S.trail[Math.max(0,S.trail.length-1-i*2)];if(p){tx=p[0];tz=p[2];ty=p[1];}else{tx=c.x;tz=c.z;}}}
   const r=moveOn(OUT.nav,k,tx,tz,2.7,dt);if(r===null)k.stuck+=dt;else k.stuck=0;if(k.stuck>1.2||Math.hypot(k.x-tx,k.z-tz)>22){const y=hAt(OUT.nav,tx,tz,ty);if(y!=null){k.x=tx;k.z=tz;k.y=y;}else{k.x=c.x;k.z=c.z;k.y=c.y;}k.stuck=0;}
   const mv=!!r;if(!mv){if(S.gp>0)k.ry=0;else turn(k,c.x-k.x,c.z-k.z,dt,2);}
   k.o.position.set(k.x,k.y,k.z);k.o.rotation.y=k.ry;poseUpdate(k.o,dt,mv,!mv&&S.gp>0&&i%3===0?'wave':null,1.1);if(!mv)k.o.userData.head.rotation.y=Math.sin(t*0.6+i*1.3)*0.5;});}
 function interiorStep(dt,t){const I=INT[S.loc];
  if(S.coordIn){const c=coord,p=c.ip;let mv=false;if(S.iroute&&S.iroute.length){const r=moveOn(I.nav,p,S.iroute[0][0],S.iroute[0][1],1.8,dt);mv=!!r;if(!r)S.iroute.shift();if(!S.iroute.length){S.iroute=null;S.awaitStop=4;}}
   if(S.awaitStop===4&&Math.hypot(S.px-p.x,S.pz-p.z)<9&&!X.dlg()&&!h.sheetOpen()){S.awaitStop=null;stopBegin(4);}
   if(!mv)turn(p,S.px-p.x,S.pz-p.z,dt);c.o.position.set(p.x,0,p.z);c.o.rotation.y=p.ry;poseUpdate(c.o,dt,mv,null,0.8);if(!mv&&X.dlg())c.o.userData.arms[1].rotation.x=-0.9+Math.sin(t*3)*0.4;}
  const n=S.inKids.length;S.inKids.forEach((k,i)=>{const p=k.ip;let tx,tz,fx,fz;
   if(S.coordIn&&!S.iroute){const a=-1.0+(i/Math.max(1,n-1))*1.6,r=4.6+(i%2)*0.75;tx=Math.sin(a)*r;tz=Math.cos(a)*r;fx=0;fz=0;}
   else{const back=-0.3-(i%3)*0.5,side=(i%2?1:-1)*(1.2+Math.floor(i/2)*0.6);tx=S.px-Math.sin(S.yaw)*back+Math.cos(S.yaw)*side;tz=S.pz-Math.cos(S.yaw)*back-Math.sin(S.yaw)*side;fx=S.px;fz=S.pz;
    if(Math.hypot(p.x-S.px,p.z-S.pz)<2.6&&Math.hypot(p.x-tx,p.z-tz)<2.2){tx=p.x;tz=p.z;}}
   const r=moveOn(I.nav,p,tx,tz,2.4,dt);if(r===null)k.istuck+=dt;else k.istuck=0;if(k.istuck>1.5){const y=hAt(I.nav,S.px-Math.sin(S.yaw)*1.2,S.pz-Math.cos(S.yaw)*1.2,0);if(y!=null){p.x=S.px-Math.sin(S.yaw)*1.2;p.z=S.pz-Math.cos(S.yaw)*1.2;}k.istuck=0;}
   const mv=!!r;if(!mv)turn(p,fx-p.x,fz-p.z,dt,2);k.o.position.set(p.x,0,p.z);k.o.rotation.y=p.ry;poseUpdate(k.o,dt,mv,null,1);if(!mv)k.o.userData.head.rotation.y=Math.sin(t*0.5+i)*0.4;});
  I.npcs.forEach(q=>poseUpdate(q.o,dt,false,q.pose));}
 function playerStep(dt){const Y=you();const nav=S.loc==='out'?OUT.nav:INT[S.loc].nav;const {joy,K}=X.input();
  let f=-joy[1]+((K.w||K.arrowup)?1:0)-((K.s||K.arrowdown)?1:0),s=joy[0]+((K.d||K.arrowright)?1:0)-((K.a||K.arrowleft)?1:0);const l=Math.hypot(f,s);let mv=false;
  if(S.sit){if(l>0.3)S.sit=null;else{const b=S.sit;Y.position.set(b.x,0.08,b.z);Y.rotation.y=b.ry;poseUpdate(Y,dt,false,'chat');return;}}
  if(S.off&&!h.sheetOpen()&&!(S.gp>0)&&l>0.08){if(l>1){f/=l;s/=l;}const cm=X.cam();const fx=-Math.sin(cm.yaw),fz=-Math.cos(cm.yaw);const mx=fx*f-fz*s,mz=fz*f+fx*s,sp=(K.shift?5.4:3.8)*Math.min(1,l);const P={x:S.px,y:S.py,z:S.pz,ry:S.yaw};const r=moveOn(nav,P,S.px+mx*3,S.pz+mz*3,sp,dt);if(r){S.px=P.x;S.pz=P.z;S.py=P.y;mv=true;S.yaw=Math.atan2(mx,mz);}}
  Y.position.set(S.px,S.py,S.pz);Y.rotation.y=S.gp>0?0:S.yaw;poseUpdate(Y,dt,mv,null,1.1);}
 function rules(dt){S.ruleT-=dt;if(S.loc!=='out')return;
  if(!S.done.tickets&&S.pz<51.6&&S.pz>40&&Math.abs(S.px)<6){S.pz=52.4;if(S.ruleT<=0){S.ruleT=3;h.toast('Guard: "Tickets first, please. The Ticket Office is in the forecourt."');}}
  if(!S.done.shoes&&S.py>1.25&&S.pz<-34&&S.pz>-38.4&&Math.abs(S.px)<3.3){S.pz=-33.6;S.py=1;if(S.ruleT<=0){S.ruleT=3;h.toast('Attendant: "Shoe covers on first, please. They\u2019re at the stand."');}}
  if(S.pz>42&&S.pz<50&&Math.abs(S.px)<2.6)mark('v_gate');}
 function chatter(dt){S.chatT-=dt;if(S.chatT>0||!S.off)return;S.chatT=16+Math.random()*10;const pool=S.loc==='out'?kids.filter(k=>k.o.visible&&!k.inside&&Math.hypot(k.x-S.px,k.z-S.pz)<12):S.inKids;const k=pool[Math.floor(Math.random()*pool.length)];if(!k)return;
  const L_=S.loc==='tomb'?['(whispering) It\u2019s so quiet in here.','(whispering) Look at the flowers in the marble.','(whispering) The screen looks like lace.']:S.loc!=='out'?['Look at this!','Can we stay a bit longer?','I\u2019m reading everything.']:S.pz>52?['It\u2019s so much bigger than in the pictures.','Can we visit the gift shop later?','I can see a dome over the gate!']:S.pz>-30?['The pool is like a mirror.','Everything matches on both sides!','Take my picture by the water.']:['The marble is warm from the sun.','Look how tall the minarets are.','You can see the river from here!'];
  h.toast(`${k.n}: "${L_[Math.floor(Math.random()*L_.length)]}"`);}
 function clampCam(I,des,tgt){const inside=p=>I.cam.find(r=>p.x>r[0]&&p.x<r[1]&&p.z>r[2]&&p.z<r[3]);let r=inside(des);if(!r){let lo=0,hi=1;for(let i=0;i<7;i++){const m=(lo+hi)/2;if(inside(tgt.clone().lerp(des,m)))lo=m;else hi=m;}des=tgt.clone().lerp(des,lo);r=inside(des);}const hz=Math.hypot(des.x-tgt.x,des.z-tgt.z),want=I.camD||6.5;if(r&&hz<3.2)des.y=Math.max(des.y,tgt.y+(want-hz)*0.45);if(r)des.y=Math.min(des.y,r[4]-0.25);return des;}
 function cameraStep(dt){const cm=X.cam();const tgt=V(S.px,S.py+1.2,S.pz);
  if(!S.off){camera.position.lerp(V(52,11,118),Math.min(1,dt*2));camera.lookAt(OUT.coach.position.x,1,96);}
  else if(S.gp>0){camera.position.lerp(V(0,2.8,19.5),Math.min(1,dt*3));camera.lookAt(0,4.2,-20);}
  else if(S.loc!=='out'){const I=INT[S.loc];const d=Math.min(cm.dist,I.camD||6.5),p=clamp(cm.pitch,0.3,0.95);const off=V(Math.sin(cm.yaw)*Math.cos(p),Math.sin(p),Math.cos(cm.yaw)*Math.cos(p)).multiplyScalar(d);camera.position.lerp(clampCam(I,tgt.clone().add(off),tgt),Math.min(1,dt*6));camera.lookAt(tgt);}
  else{const inGate=S.px>-6&&S.px<6&&S.pz>40.2&&S.pz<51.8&&S.py<0.5;const d=inGate?4.2:cm.dist,p=inGate?0.2:cm.pitch;const off=V(Math.sin(cm.yaw)*Math.cos(p),Math.sin(p),Math.cos(cm.yaw)*Math.cos(p)).multiplyScalar(d);const des=tgt.clone().add(off);
   if(inGate&&des.z>40.6&&des.z<51.4){des.x=clamp(des.x,-2.2,2.2);des.y=Math.min(des.y,5.2);if(Math.abs(des.z-46)<1.8)des.x=clamp(des.x,-5.2,5.2);}if(des.y<0.6)des.y=0.6;camera.position.lerp(des,Math.min(1,dt*(inGate?6:4)));camera.lookAt(tgt);}
  camera.near=S.loc==='out'?0.3:0.1;camera.far=S.loc==='out'?2000:120;camera.updateProjectionMatrix();}
 function step(dt,t){S.t+=dt;OUT.anim(t,dt);
  if(S.st==='ARRIVING'){const k=clamp(S.t/5,0,1),e=1-Math.pow(1-k,3);OUT.coach.position.x=95-(95-36)*e;
   if(S.t>5.4&&!S.off){S.off=1;kids.forEach(k=>k.o.visible=true);coord.o.visible=true;you().visible=true;S.route=[[22,92],[6,88],[0,84],[0,72]];S.walking=1;S.st='GUIDING';S.nextStop=0;h.toast('Doors open. Everyone off the coach!');X.obj('Follow '+CN,'Walk with the class to the meeting point in the forecourt.');paintTop();}}
  if(S.loc==='out'){coordOut(dt,t);kidsOut(dt,t);}else interiorStep(dt,t);
  playerStep(dt);rules(dt);actions();chatter(dt);cameraStep(dt);}
 function paintTop(){if(!S)return;const t=[['photo','Camera'],['check','Checklist']];if(S.ready&&S.stop>=0&&S.stop<7&&TAJ.stops[S.stop].next)t.push(['next',TAJ.stops[S.stop].next+' \u25b8',1]);if(S.off)t.push(['regroup','Return to group']);t.push(['quit','Leave trip']);X.tops(t);}
 function top(id){if(id==='photo')photo();if(id==='check')checklist();if(id==='next')next();if(id==='regroup')regroup();}
 function leave(){if(!S)return;if(S.loc!=='out'){S.inKids.forEach(k=>k.inside=0);S.inKids=[];S.coordIn=0;S.loc='out';}}
 function result(){const D=S.done;return{dest:TAJ.id,disc:TAJ.disc.filter(d=>D[d.id]).length,ndisc:TAJ.disc.length,visited:BUILD_LIST.filter(([k])=>D[k]).length,nvis:BUILD_LIST.length,bought:S.bought||[]};}
 window.__TAJ={get S(){return S;},enter:id=>enterInterior(id),exit:()=>exitInterior(),tp:(x,z,y=0,yaw)=>{S.px=x;S.pz=z;S.py=y;if(yaw!=null)S.yaw=yaw;},stop:n=>stopBegin(n),cam:(y,p,d)=>X.setCam(y,p,d)};
 return{arrive,step,top,paintTop,leave,result,get scene(){return S?S.sc:OUT.sc;}};}
