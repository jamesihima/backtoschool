import {CURRICULUM} from './curriculum.js';
const later=(api,fn,ms)=>{const go=()=>{if(api.dead)return;if(api.paused()){setTimeout(go,250);return;}fn();};setTimeout(go,ms);};
const sh=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const BTN="font-family:'Patrick Hand',cursive;font-size:18px;padding:5px 14px;border-radius:10px;border:2.5px solid #3a2a30;background:#e3a347;color:#3a2a30;cursor:pointer;box-shadow:0 3px 0 #3a2a30;";
export function whot(el,api){const SH=['●','▲','✚','■','★'],COL=['#a8323a','#1f3a6b','#2f7a5a','#b06a1e','#6b4a7a'];
 const deck=[];SH.forEach((s,i)=>[1,2,3,4,5,7,8,10,11,12,13,14].forEach(n=>{if(i===4&&n>8)return;deck.push({s:i,n});}));sh(deck);
 const me=deck.splice(0,5),op=deck.splice(0,5);let pile=deck.pop();while([1,2,14].includes(pile.n)){deck.unshift(pile);pile=deck.pop();}
 let turn='me',msg='Match shape or number. 2 = Pick Two · 14 = General Market · 1 = Hold On.',over=false;
 const ok=c=>c.s===pile.s||c.n===pile.n,draw=(h,n)=>{for(let k=0;k<n&&deck.length;k++)h.push(deck.pop());};
 const card=(c,attr='',st='')=>`<div ${attr} style="width:48px;height:70px;border-radius:7px;background:#fffdf6;border:2px solid #3a2a30;display:flex;align-items:center;justify-content:center;position:relative;color:${COL[c.s]};flex:none;transition:transform .1s;${st}"><span style="position:absolute;top:2px;left:5px;font-size:13px;font-weight:700;">${c.n}</span><span style="font-size:24px;">${SH[c.s]}</span></div>`;
 function render(){if(api.dead)return;el.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;"><span style="font-size:12px;font-weight:700;">Chidi · ${op.length} cards</span><div style="display:flex;gap:2px;">${op.map(()=>'<div style="width:14px;height:22px;border-radius:3px;border:1.5px solid #3a2a30;background:repeating-linear-gradient(45deg,#a8323a 0 4px,#c0563f 4px 8px);"></div>').join('')}</div><span style="font-size:12px;">Market ${deck.length}</span></div>
  <div style="display:flex;gap:12px;align-items:center;justify-content:center;margin:8px 0;">${card(pile)}<div style="font-size:13px;max-width:280px;line-height:1.35;">${msg}</div></div>
  <div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:center;">${me.map((c,i)=>card(c,`data-i="${i}"`,turn==='me'&&!over?(ok(c)?'cursor:pointer;box-shadow:0 0 0 3px #e3a347;transform:translateY(-4px);':'opacity:.5;'):'')).join('')}</div>
  <div style="display:flex;justify-content:center;margin-top:8px;"><button data-d style="${BTN}" ${turn!=='me'||over?'disabled':''}>Go to market</button></div>`;
  el.querySelectorAll('[data-i]').forEach(x=>x.onclick=()=>play(+x.dataset.i));const d=el.querySelector('[data-d]');if(d)d.onclick=market;}
 function play(i){if(turn!=='me'||over)return;const c=me[i];if(!ok(c))return;me.splice(i,1);pile=c;api.sfx('coin');if(!me.length)return end(true);
  if(c.n===2){draw(op,2);msg='Pick Two! Chidi picks 2. Your turn again.';return render();}
  if(c.n===14){draw(op,1);msg='General Market! Chidi picks 1. Your turn again.';return render();}
  if(c.n===1){msg='Hold On! Play again.';return render();}
  msg=`You played ${c.n} ${SH[c.s]}.`+(me.length===1?' Last card!':'');turn='op';render();later(api,opTurn,900);}
 function market(){if(turn!=='me'||over)return;if(!deck.length)return end(me.length<=op.length);draw(me,1);msg='You went to market.';turn='op';render();later(api,opTurn,900);}
 function opTurn(){if(over)return;let i=op.findIndex(c=>ok(c)&&[1,2,14].includes(c.n));if(i<0)i=op.findIndex(ok);
  if(i<0){if(!deck.length)return end(me.length<=op.length);draw(op,1);msg='Chidi went to market.';turn='me';return render();}
  const c=op.splice(i,1)[0];pile=c;api.sfx('swish');if(!op.length)return end(false);
  if(c.n===2){draw(me,2);msg='Chidi: "Pick Two!" You pick 2.';render();return later(api,opTurn,1000);}
  if(c.n===14){draw(me,1);msg='Chidi: "General Market!" You pick 1.';render();return later(api,opTurn,1000);}
  if(c.n===1){msg='Chidi: "Hold On!"';render();return later(api,opTurn,1000);}
  msg=`Chidi played ${c.n} ${SH[c.s]}.`+(op.length===1?' "Last card!"':'');turn='me';render();}
 function end(w){over=true;msg=w?'CHECK UP! You win.':'Chidi: "Check up!" He wins.';render();setTimeout(()=>w?api.win('You beat Chidi at Whot!'):api.lose('Chidi won at Whot.'),900);}
 render();}
export function ludo(el,api){const N=24,ST={me:0,op:12};const tok={me:[-1,-1],op:[-1,-1]};let turn='me',die=0,rolled=false,msg='Roll a 6 to bring a seed out. Land on Tunde to send him home.',over=false;
 const abs=(w,p)=>(ST[w]+p)%N;const cells=[];for(let x=0;x<7;x++)cells.push([x,0]);for(let y=1;y<7;y++)cells.push([6,y]);for(let x=5;x>=0;x--)cells.push([x,6]);for(let y=5;y>=1;y--)cells.push([0,y]);
 const can=(w,i,d)=>{const p=tok[w][i];return p<N&&(p>=0||d===6);},moves=(w,d)=>[0,1].filter(i=>can(w,i,d));
 function move(w,i,d){const p=tok[w][i];const np=p<0?0:p+d;tok[w][i]=np;let cap=false;if(np<N){const a=abs(w,np),o=w==='me'?'op':'me';if(a!==ST.me&&a!==ST.op)tok[o].forEach((q,k)=>{if(q>=0&&q<N&&abs(o,q)===a){tok[o][k]=-1;cap=true;}});}return{cap,home:np>=N};}
 const dot=(w,i,big)=>`<span data-t="${w}${i}" style="width:${big?18:14}px;height:${big?18:14}px;border-radius:50%;background:${w==='me'?'#a8553f':'#4f6e8a'};border:2px solid #3a2a30;display:inline-block;${w==='me'&&turn==='me'&&rolled&&can('me',i,die)?'box-shadow:0 0 0 3px #e3a347;cursor:pointer;':''}"></span>`;
 function render(){if(api.dead)return;const occ={};['me','op'].forEach(w=>tok[w].forEach((p,i)=>{if(p>=0&&p<N)(occ[abs(w,p)]=occ[abs(w,p)]||[]).push([w,i]);}));
  const g=cells.map(([x,y],a)=>`<div style="grid-column:${x+1};grid-row:${y+1};border:1.5px solid #3a2a30;border-radius:5px;background:${a===ST.me?'#ecc8b6':a===ST.op?'#c6d6e6':'#fffdf6'};display:flex;align-items:center;justify-content:center;gap:1px;">${(occ[a]||[]).map(([w,i])=>dot(w,i)).join('')}</div>`).join('');
  const home=w=>tok[w].map((p,i)=>p<0?dot(w,i,1):p>=N?'<span style="font-size:15px;">★</span>':'').join(' ');
  el.innerHTML=`<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;justify-content:center;"><div style="display:grid;grid-template-columns:repeat(7,26px);grid-template-rows:repeat(7,26px);gap:2px;">${g}<div style="grid-column:2/7;grid-row:2/7;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;font-size:11px;font-weight:700;"><div>Tunde ${home('op')}</div><div style="width:42px;height:42px;border:2.5px solid #3a2a30;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;">${die||'–'}</div><div>You ${home('me')}</div></div></div>
   <div style="display:flex;flex-direction:column;gap:8px;max-width:210px;"><div style="font-size:13px;line-height:1.35;">${msg}</div><button data-r style="${BTN}" ${turn!=='me'||rolled||over?'disabled':''}>Roll die</button></div></div>`;
  el.querySelectorAll('[data-t^="me"]').forEach(x=>x.onclick=()=>pick(+x.dataset.t.slice(2)));const r=el.querySelector('[data-r]');if(r)r.onclick=roll;}
 function roll(){if(turn!=='me'||rolled||over)return;die=1+Math.floor(Math.random()*6);api.sfx('swish');if(!moves('me',die).length){msg=`You rolled ${die}. No moves.`;turn='op';render();return later(api,opTurn,900);}rolled=true;msg=`You rolled ${die}. Tap a glowing seed.`;render();}
 function pick(i){if(turn!=='me'||!rolled||over||!can('me',i,die))return;const r=move('me',i,die);rolled=false;api.sfx(r.cap?'power':'coin');if(tok.me.every(p=>p>=N))return end(true);
  msg=r.cap?'You sent Tunde home!':r.home?'Seed home!':'Moved.';if(die===6||r.cap){msg+=' Roll again.';return render();}turn='op';render();later(api,opTurn,900);}
 function opTurn(){if(over)return;die=1+Math.floor(Math.random()*6);const m=moves('op',die);if(!m.length){msg=`Tunde rolled ${die}. No moves.`;turn='me';return render();}
  let best=m[0],bs=-1;m.forEach(i=>{const p=tok.op[i],np=p<0?0:p+die;let s=np/10;if(p<0)s+=5;if(np<N&&tok.me.some(q=>q>=0&&q<N&&abs('me',q)===abs('op',np)))s+=10;if(s>bs){bs=s;best=i;}});
  const r=move('op',best,die);api.sfx('swish');if(tok.op.every(p=>p>=N))return end(false);msg=`Tunde rolled ${die}.`+(r.cap?' He sent your seed home!':'');
  if(die===6||r.cap){render();return later(api,opTurn,1000);}turn='me';render();}
 function end(w){over=true;msg=w?'Both seeds home. You win!':'Tunde got both seeds home.';render();setTimeout(()=>w?api.win('You beat Tunde at Ludo!'):api.lose('Tunde won at Ludo.'),900);}
 render();}
export function ayo(el,api){let pits=Array(12).fill(4),cap={me:0,op:0},turn='me',msg="Pick a pit on your side (bottom row). If your last seed makes 2 or 3 on Amaka's side, you capture.",over=false,moves=0,last=-1;
 function sow(i,w){let n=pits[i];pits[i]=0;let j=i;while(n>0){j=(j+1)%12;if(j===i)continue;pits[j]++;n--;}let got=0;const opp=w==='me'?k=>k>=6:k=>k<6;
  while(opp(j)&&(pits[j]===2||pits[j]===3)){got+=pits[j];pits[j]=0;j=(j+11)%12;}cap[w]+=got;moves++;last=i;return got;}
 const empty=w=>(w==='me'?[0,1,2,3,4,5]:[6,7,8,9,10,11]).every(k=>!pits[k]);
 function checkEnd(){if(cap.me<20&&cap.op<20&&moves<70&&!empty(turn))return false;for(let k=0;k<12;k++){if(k<6)cap.me+=pits[k];else cap.op+=pits[k];pits[k]=0;}over=true;
  const w=cap.me>cap.op;msg=w?`You win ${cap.me}–${cap.op}!`:cap.me===cap.op?`Draw ${cap.me}–${cap.op}.`:`Amaka wins ${cap.op}–${cap.me}.`;render();setTimeout(()=>w?api.win('You beat Amaka at Ayo!'):api.lose(cap.me===cap.op?'Ayo ended in a draw.':'Amaka won at Ayo.'),1000);return true;}
 const pit=(k,c)=>`<div ${c?`data-p="${k}"`:''} style="width:42px;height:42px;border-radius:50%;background:#5a3a22;border:2px solid #3a2a30;box-shadow:inset 0 3px 6px rgba(0,0,0,.45)${k===last?',0 0 0 3px #e3a347':''};display:flex;align-items:center;justify-content:center;color:#f6efe0;font-weight:700;font-size:16px;${c?'cursor:pointer;outline:2px dashed #e3a347;outline-offset:2px;':''}">${pits[k]}</div>`;
 function render(){if(api.dead)return;const c=k=>turn==='me'&&!over&&pits[k]>0;
  el.innerHTML=`<div style="display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap;"><div style="background:#a0703f;border:3px solid #3a2a30;border-radius:28px;padding:10px 14px;display:flex;flex-direction:column;gap:8px;"><div style="display:flex;gap:5px;">${[11,10,9,8,7,6].map(k=>pit(k,false)).join('')}</div><div style="display:flex;gap:5px;">${[0,1,2,3,4,5].map(k=>pit(k,c(k))).join('')}</div></div>
   <div style="display:flex;flex-direction:column;gap:6px;max-width:210px;"><div style="font-size:12px;font-weight:700;">Amaka ${cap.op} · You ${cap.me}</div><div style="font-size:13px;line-height:1.35;">${msg}</div></div></div>`;
  el.querySelectorAll('[data-p]').forEach(x=>x.onclick=()=>play(+x.dataset.p));}
 function play(k){if(turn!=='me'||over||!pits[k])return;const g=sow(k,'me');api.sfx(g?'power':'coin');msg=g?`You captured ${g}!`:'Seeds sown.';turn='op';if(checkEnd())return;render();later(api,opTurn,1000);}
 function opTurn(){if(over)return;let best=-1,bg=-1;for(let k=6;k<12;k++){if(!pits[k])continue;const sp=pits.slice(),sc={...cap},sm=moves,sl=last;const g=sow(k,'op');pits=sp;cap=sc;moves=sm;last=sl;const s=g+Math.random()*0.5;if(s>bg){bg=s;best=k;}}
  const g=sow(best,'op');api.sfx('swish');msg=g?`Amaka captured ${g}!`:'Amaka sowed her seeds.';turn='me';if(checkEnd())return;render();}
 render();}
export function lesson(el,api){let L=null,bi=0,qi=0,score=0,qs=[],typer=null,shown=0;
 const H=s=>{el.innerHTML=s;};const esc=s=>s.replace(/</g,'&lt;');
 function pickSubj(){api.beat&&api.beat('tell',['CHOOSE A SUBJECT','Maths · Biology · Physics · Chemistry','Economics · English · Geography · Civic'],3);
  H(`<div style="font-size:12px;font-weight:700;margin-bottom:6px;">What are we learning today? The teacher has gist for every subject.</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px;">${CURRICULUM.map((c,k)=>`<button data-s="${k}" style="${BTN}background:#fffdf6;text-align:left;font-size:16px;line-height:1.1;padding:6px 10px;"><b>${c.subj}</b><br><span style="font-family:'Atkinson Hyperlegible',sans-serif;font-size:11px;">${c.topic}</span></button>`).join('')}</div>`);
  el.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{L=CURRICULUM[+b.dataset.s];qs=sh(L.quiz.slice()).slice(0,4);bi=0;shown=1;beat();});}
 function beat(){if(api.dead)return;if(bi>=L.beats.length)return quizIntro();const B=L.beats[bi];if(B.b!=null)shown=B.b;api.beat&&api.beat(B.k,L.board,Math.max(1,shown));
  const where=B.k==='whisper'?'leans over your desk':B.k==='write'?'writes on the board':'leans in';
  H(`<div style="display:flex;justify-content:space-between;gap:8px;font-size:12px;font-weight:700;"><span>${L.subj} · ${L.topic}</span><span>${bi+1}/${L.beats.length}</span></div>
   <div style="font-size:12px;margin-top:4px;opacity:.75;">${L.teacher} ${where}…</div>
   <div class="hand" data-t style="font-size:21px;line-height:1.25;margin:6px 0;min-height:78px;"></div>
   <div data-r style="font-size:13px;font-style:italic;color:#a8553f;min-height:18px;"></div>
   <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:6px;"><button data-n style="${BTN}">${bi===L.beats.length-1?'Quiz time ▸':'Next ▸'}</button></div>`);
  const tEl=el.querySelector('[data-t]'),rEl=el.querySelector('[data-r]');const txt=B.t;let n=0;clearInterval(typer);
  typer=setInterval(()=>{if(api.dead){clearInterval(typer);return;}if(api.paused())return;n+=2;tEl.textContent='"'+txt.slice(0,n)+(n<txt.length?'':'"');if(n>=txt.length){clearInterval(typer);if(B.r)setTimeout(()=>{if(!api.dead){rEl.textContent=B.r;api.sfx&&api.sfx('swish');}},350);}},28);
  el.querySelector('[data-n]').onclick=()=>{if(n<txt.length){n=txt.length;tEl.textContent='"'+txt+'"';clearInterval(typer);if(B.r)rEl.textContent=B.r;return;}bi++;beat();};}
 function quizIntro(){api.beat&&api.beat('tell',L.board,L.board.length);H(`<div class="hand" style="font-size:22px;line-height:1.25;">"Okay! Enough gist. Let me see who was listening…"</div><div style="font-size:13px;margin-top:6px;">${L.teacher} will ask you ${qs.length} questions.</div><div style="display:flex;justify-content:flex-end;margin-top:8px;"><button data-n style="${BTN}">I'm ready ▸</button></div>`);el.querySelector('[data-n]').onclick=ask;}
 function ask(){if(api.dead)return;if(qi>=qs.length)return api.done(score);const [q,o,a,why]=qs[qi];let answered=false;api.beat&&api.beat(qi%2?'whisper':'tell',L.board,L.board.length);
  H(`<div style="font-size:12px;font-weight:700;">Question ${qi+1} of ${qs.length} · ${L.teacher} points at you</div><div class="hand" style="font-size:24px;line-height:1.15;margin:6px 0;">"${esc(q)}"</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:6px;">${o.map((x,k)=>`<button data-a="${k}" style="${BTN}background:#fffdf6;font-size:16px;">${esc(x)}</button>`).join('')}</div><div style="height:6px;border:1.5px solid #3a2a30;border-radius:4px;overflow:hidden;margin-top:8px;"><div data-b style="height:100%;width:100%;background:#a8553f;transition:width 14s linear;"></div></div>`);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{const b=el.querySelector('[data-b]');if(b)b.style.width='0%';}));
  const res=(ok,k)=>{if(answered)return;answered=true;if(ok){score++;api.sfx('power');}else api.sfx('thud');el.querySelectorAll('[data-a]').forEach((b,j)=>{b.disabled=true;if(j===a)b.style.background='#b9d3a8';else if(j===k)b.style.background='#f0b9a8';});
   const box=document.createElement('div');box.style.cssText='margin-top:8px;font-size:14px;line-height:1.4;';box.innerHTML=`<b style="color:${ok?'#55745c':'#a8553f'}">${ok?['"Correct! See this one!"','"Ehen! You were listening!"','"Brilliant!"'][qi%3]:'"No o. Listen:"'}</b> ${esc(why)}<div style="display:flex;justify-content:flex-end;margin-top:6px;"><button data-n style="${BTN}">${qi===qs.length-1?'Finish ▸':'Next question ▸'}</button></div>`;el.appendChild(box);
   box.querySelector('[data-n]').onclick=()=>{qi++;ask();};};
  el.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>res(+b.dataset.a===a,+b.dataset.a));const myQ=qi;later(api,()=>{if(qi===myQ)res(false,-1);},14000);}
 pickSubj();}

// ---------- break-time games ----------
export function tenten(el,api){const PADS=[['CLAP','#e3a347'],['LEFT','#55745c'],['RIGHT','#4f6e8a'],['JUMP','#c0563f']];let round=1,lives=3,seq=[],inp=0,showing=false,over=false,msg='Watch Zainab, then copy the pattern. Clear 5 rounds to win.';
 const render=(lit=-1)=>{el.innerHTML=`<div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;"><span>Round ${round}/5</span><span>Lives ${'●'.repeat(lives)}${'○'.repeat(3-lives)}</span></div><div style="font-size:13px;margin:4px 0 8px;min-height:18px;">${msg}</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">${PADS.map(([n,c],k)=>`<button data-p="${k}" style="${BTN}height:64px;background:${k===lit?c:'#fffdf6'};color:${k===lit?'#fff':'#3a2a30'};transform:${k===lit?'scale(1.06)':'none'};" ${showing||over?'disabled':''}>${n}</button>`).join('')}</div>`;
  el.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>tap(+b.dataset.p));};
 function play(){seq=[];for(let k=0;k<round+2;k++)seq.push(Math.floor(Math.random()*4));inp=0;showing=true;msg='Zainab: "Watch o!"';let i=0;
  const step=()=>{if(api.dead)return;if(i>=seq.length){showing=false;msg='Your turn: copy it!';render();return;}render(seq[i]);api.sfx('swish');later(api,()=>{render();i++;later(api,step,140);},Math.max(260,520-round*40));};later(api,step,600);}
 function tap(k){if(showing||over)return;const ok=k===seq[inp];render(k);setTimeout(()=>{if(!over&&!showing)render();},140);
  if(!ok){lives--;api.sfx('thud');if(lives<=0){over=true;msg='Off beat! Zainab laughs.';render();return later(api,()=>api.lose('Zainab out-clapped you.',{coins:5,xp:15}),900);}msg='Missed! Again…';render();return later(api,play,800);}
  api.sfx('coin');inp++;if(inp>=seq.length){round++;if(round>5){over=true;msg='Perfect rhythm! The crowd cheers.';render();api.bond('Zainab',3,'Ten-Ten champion at break');api.bond('Funmi',2,'Your rhythm impressed her');return later(api,()=>api.win('You won Ten-Ten!',{coins:20,xp:40}),900);}msg='Nice! Faster now…';render();later(api,play,700);}}
 render();play();}
const WYR=[['Surprise maths quiz','Unprepared speech at assembly'],['Puff-puff every break for a week','Never eat it again'],['Score the winning goal','Win the talent show'],['Sit beside the class clown','Sit beside the strictest prefect'],['Teleport to school','Never have homework again'],['Read minds in exams','Talk to animals at the farm'],['Lead Red House','Be star of Blue House'],['Rainy day indoors','Sunny day on the field']];
const LEAN={Chidi:[1,0,1,0,0,1,0,0],Tunde:[0,0,0,1,1,1,0,1],Amaka:[0,0,1,1,1,0,0,0],Zainab:[1,0,1,0,0,1,1,0],Emeka:[0,0,0,0,1,1,1,0],Funmi:[1,1,1,0,0,1,1,0],Bayo:[0,1,0,1,0,0,1,0],Halima:[0,1,0,1,0,0,0,0]};
export function wyr(el,api){const qs=sh(WYR.map((q,i)=>[q,i])).slice(0,5);let i=0;const agree={};const gang=sh(Object.keys(LEAN)).slice(0,4);
 function ask(){if(api.dead)return;if(i>=qs.length)return end();const [[a,b],qi]=qs[i];el.innerHTML=`<div style="font-size:12px;font-weight:700;">Question ${i+1}/${qs.length} · with ${gang.join(', ')}</div><div class="hand" style="font-size:24px;margin:6px 0;">Would you rather…</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;"><button data-c="0" style="${BTN}background:#fffdf6;min-height:58px;">${a}</button><button data-c="1" style="${BTN}background:#fffdf6;min-height:58px;">${b}</button></div><div data-r style="margin-top:8px;font-size:13px;line-height:1.5;"></div>`;
  el.querySelectorAll('[data-c]').forEach(x=>x.onclick=()=>{const c=+x.dataset.c;el.querySelectorAll('[data-c]').forEach(y=>y.disabled=true);x.style.background='#e3a347';
   const lines=gang.map(n=>{const v=(LEAN[n][qi]+(Math.random()<0.15?1:0))%2;if(v===c)agree[n]=(agree[n]||0)+1;return `<b>${n}</b> picks <i>${v?b:a}</i>${v===c?' ✓':''}`;});
   const box=el.querySelector('[data-r]');box.innerHTML=lines.join('<br>')+`<div style="text-align:right;margin-top:6px;"><button data-n style="${BTN}">${i===qs.length-1?'Finish ▸':'Next ▸'}</button></div>`;api.sfx('swish');box.querySelector('[data-n]').onclick=()=>{i++;ask();};});}
 function end(){const best=Object.entries(agree).sort((a,b)=>b[1]-a[1]);best.forEach(([n,k])=>api.bond(n,k,'Agreed with you at Would You Rather'));const top=best[0];api.win(top?`You and ${top[0]} think alike (${top[1]}/${qs.length}).`:'Nobody agreed with you. Bold!',{coins:8,xp:30});}
 ask();}
const PHR=['Bring your exercise book to the staff room','The inter-house sports is on Friday','Mama Titi has fresh puff-puff today','Mr Bello said no homework this weekend','Meet me by the water tank after break'];
const MIS={book:'cook',staff:'stuff',room:'broom',sports:'shorts',Friday:'fried rice',fresh:'French',today:'Tuesday',homework:'home walk',weekend:'week end party',water:'waiter',tank:'bank',break:'bread',exercise:'extra rice',inter:'winter',puff:'pop',Mama:'Mummy',said:'sang',after:'after-party'};
export function phone(el,api){const orig=PHR[Math.floor(Math.random()*PHR.length)];const c=sh(Object.keys(LEAN)).slice(0,5);const order=[c[0],c[1],'YOU',c[2],c[3],c[4]];let msg=orig,hist=[];
 const garble=(s,p)=>s.split(' ').map(w=>MIS[w]&&Math.random()<p?MIS[w]:w).join(' ');
 const show=(extra)=>{el.innerHTML=`<div style="font-size:12px;font-weight:700;">Broken Telephone · pass the message down the row</div><div style="font-size:13px;line-height:1.6;margin-top:6px;">${hist.join('<br>')}</div>${extra||''}`;};
 function step(k){if(api.dead)return;if(k>=order.length)return end();const n=order[k];
  if(n==='YOU'){let opts=sh([orig,garble(orig,0.9),garble(orig,0.9),msg]).filter((v,i,a)=>a.indexOf(v)===i);
   show(`<div class="hand" style="font-size:20px;margin:8px 0 4px;">${order[k-1]} whispers: "${msg}"</div><div style="font-size:12px;margin-bottom:6px;">What do you pass on? Guess what it really was.</div><div style="display:flex;flex-direction:column;gap:6px;">${opts.map((o,i)=>`<button data-o="${i}" style="${BTN}background:#fffdf6;font-size:15px;text-align:left;">"${o}"</button>`).join('')}</div>`);
   el.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{msg=opts[+b.dataset.o];hist.push(`<b>You</b> pass: "${msg}"`);api.sfx('swish');later(api,()=>step(k+1),700);});return;}
  msg=garble(msg,n==='Bayo'||n==='Halima'?0.15:n==='Chidi'||n==='Zainab'?0.6:0.35);hist.push(`<b>${n}</b>: "${msg}"`);show();later(api,()=>step(k+1),1300);}
 function end(){const ok=msg===orig;show(`<div style="margin-top:8px;padding:8px;border:2px solid #3a2a30;border-radius:10px;background:${ok?'#dfe8d8':'#fff3c4'};font-size:14px;"><b>Original:</b> "${orig}"<br><b>Final:</b> "${msg}"</div>`);
  c.forEach(n=>api.bond(n,2,'Played Broken Telephone together'));later(api,()=>ok?api.win('The message survived! Everyone is shocked.',{coins:15,xp:35}):api.lose(`It became "${msg}". The class is rolling on the floor.`,{coins:5,xp:25}),2600);}
 hist.push(`<b>${order[0]}</b> starts: "${orig}"`);show();later(api,()=>step(1),1400);}

// ---------- School-opoly (Monopoly-style property trading) ----------
const SQ=[{n:'GO',t:'go'},{n:'Puff-puff Stall',t:'p',g:0,c:60},{n:'Gist',t:'gist'},{n:'Zobo Stand',t:'p',g:0,c:60},{n:'School Fees',t:'tax',c:100},{n:'Reading Corner',t:'p',g:1,c:100},{n:'Archive',t:'p',g:1,c:120},{n:'Detention',t:'jail'},{n:'Bio Lab',t:'p',g:2,c:140},{n:'Gist',t:'gist'},
 {n:'Chem Lab',t:'p',g:2,c:160},{n:'School Bus',t:'bus',c:150},{n:'Free Period',t:'free'},{n:'Running Track',t:'p',g:3,c:180},{n:'Football Pitch',t:'p',g:3,c:200},{n:'Danfo Park',t:'bus',c:150},{n:'Gist',t:'gist'},{n:'Go to Detention',t:'gojail'},{n:'Staff Room',t:'p',g:4,c:220},{n:"Principal's Office",t:'p',g:4,c:260}];
const GC=['#9a6a52','#7fb6d6','#c97a9a','#e0853a','#55745c'];
const CELL=i=>i<=5?[5,5-i]:i<=9?[14-i-5+5-5+ (9-i)+1-1, 0].reverse():null;
const POS=[];for(let i=0;i<6;i++)POS.push([5,5-i]);for(let i=6;i<10;i++)POS.push([10-i,0]);for(let i=10;i<16;i++)POS.push([0,i-10]);for(let i=16;i<20;i++)POS.push([i-15,5]);
const GIST=[['Mama Titi gave you too much change. You returned it: the Principal rewards you ₦50.',p=>p.m+=50],['You lost your biro in the exam hall. Pay ₦20.',p=>p.m-=20],['Your team won the debate! Collect ₦100.',p=>p.m+=100],['Assembly is starting! Advance to GO.',(p,G)=>{p.pos=0;p.m+=200;}],
 ['Caught sleeping in class. Go to Detention!',(p,G)=>G.jail(p)],['Inter-house sports prize. Collect ₦75.',p=>p.m+=75],['It\'s your birthday! Your opponent pays you ₦30.',(p,G)=>{p.m+=30;G.other(p).m-=30;}],['You broke a window with a football. Pay ₦80.',p=>p.m-=80]];
export function monopoly(el,api){const N=api.people&&api.people.Emeka?'Emeka':'Emeka';
 const pl=[{n:'You',m:1500,pos:0,jail:0,col:'#a8553f'},{n:N,m:1500,pos:0,jail:0,col:'#6b4a7a'}];const own=SQ.map(()=>-1),hs=SQ.map(()=>0);let turn=0,round=1,phase='roll',dice=[1,1],log='Emeka: "Welcome to School-opoly! Buy the canteen, get rich."',over=false,tradeOpen=false;const MAXR=14;
 const G={jail:p=>{p.pos=7;p.jail=1;},other:p=>pl[1-pl.indexOf(p)]};
 const setOf=g=>SQ.map((s,i)=>s.g===g&&s.t==='p'?i:-1).filter(i=>i>=0);const hasSet=(o,g)=>setOf(g).every(i=>own[i]===o);
 const rent=i=>{const s=SQ[i];if(s.t==='bus'){const k=[11,15].filter(j=>own[j]===own[i]).length;return 25*k*k;}const b=Math.round(s.c/10);return hs[i]?b*[1,4,9,16][hs[i]]:hasSet(own[i],s.g)?b*2:b;};
 const worth=o=>pl[o].m+SQ.reduce((a,s,i)=>a+(own[i]===o?s.c+hs[i]*s.c/2:0),0);
 function draw(){const me=pl[0],cur=pl[turn];const sq=SQ[me.pos];
  const cells=SQ.map((s,i)=>{const [r,c]=POS[i];const tk=pl.map((p,k)=>p.pos===i?`<span style="width:9px;height:9px;border-radius:50%;background:${p.col};border:1.5px solid #fff;display:inline-block;"></span>`:'').join('');
   const ob=own[i]>=0?`<div style="position:absolute;right:2px;top:2px;width:7px;height:7px;border-radius:50%;background:${pl[own[i]].col};"></div>`:'';
   return `<div style="grid-row:${r+1};grid-column:${c+1};position:relative;border:1.5px solid #3a2a30;border-radius:4px;background:#fffdf6;font-size:8.5px;line-height:1.05;padding:${s.g!=null?'7px':'2px'} 2px 2px;overflow:hidden;">${s.g!=null?`<div style="position:absolute;left:0;right:0;top:0;height:5px;background:${GC[s.g]};"></div>`:''}${ob}<b>${s.n}</b>${s.c&&s.t!=='tax'?`<div>₦${s.c}</div>`:''}${hs[i]?`<div style="color:#55745c;font-weight:700;">${'▲'.repeat(hs[i])}</div>`:''}<div style="position:absolute;left:2px;bottom:2px;display:flex;gap:1px;">${tk}</div></div>`;}).join('');
  const canBuy=turn===0&&phase==='buy',build=turn===0&&phase!=='roll'?[]:[];
  const myBuild=SQ.map((s,i)=>i).filter(i=>SQ[i].t==='p'&&own[i]===0&&hasSet(0,SQ[i].g)&&hs[i]<3&&pl[0].m>=SQ[i].c/2);
  const btns=over?'':turn!==0?`<div style="font-size:12px;opacity:.75;">${N} is playing…</div>`:phase==='roll'?`<button data-a="roll" style="${BTN}">Roll dice</button>`:phase==='buy'?`<button data-a="buy" style="${BTN}background:#e3a347;">Buy ${sq.n} ₦${sq.c}</button><button data-a="pass" style="${BTN}">Pass</button>`:`<button data-a="end" style="${BTN}background:#e3a347;">End turn</button>`;
  const extra=!over&&turn===0&&phase!=='buy'?`${myBuild.length?`<button data-a="build" style="${BTN}font-size:14px;">Build (${myBuild.length})</button>`:''}<button data-a="trade" style="${BTN}font-size:14px;">Trade</button>`:'';
  el.innerHTML=`<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-start;">
   <div style="display:grid;grid-template-columns:repeat(6,46px);grid-template-rows:repeat(6,46px);gap:2px;position:relative;flex:none;">${cells}
    <div style="grid-row:2/6;grid-column:2/6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;"><div class="hand" style="font-size:20px;line-height:1;color:#a8553f;">School-opoly</div>
     <div style="display:flex;gap:6px;">${dice.map(d=>`<div style="width:30px;height:30px;border:2px solid #3a2a30;border-radius:6px;background:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;">${d}</div>`).join('')}</div><div style="font-size:10px;">Round ${Math.min(round,MAXR)}/${MAXR}</div></div></div>
   <div style="flex:1;min-width:170px;display:flex;flex-direction:column;gap:6px;">
    ${pl.map((p,k)=>`<div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;padding:3px 6px;border-radius:6px;background:${turn===k&&!over?'#fff3c4':'transparent'};"><span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.col};margin-right:5px;"></span>${p.n}${p.jail?' (detention)':''}</span><span>₦${p.m}</span></div>`).join('')}
    <div style="font-size:13px;line-height:1.35;min-height:52px;">${log}</div><div style="display:flex;gap:6px;flex-wrap:wrap;">${btns}${extra}</div><div data-x></div></div></div>`;
  el.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>act(b.dataset.a));}
 function move(p,n,done){let k=0;const st=()=>{if(api.dead)return;p.pos=(p.pos+1)%20;if(p.pos===0){p.m+=200;log=`${p.n} passed GO: collect ₦200.`;}k++;api.sfx('swish');draw();if(k<n)later(api,st,130);else later(api,done,250);};later(api,st,150);}
 function land(p,i){const s=SQ[i],me=pl.indexOf(p);
  if(s.t==='p'||s.t==='bus'){if(own[i]<0){if(me===0){phase='buy';log=`${s.n} is for sale: ₦${s.c}.`;return draw();}if(p.m-s.c>=120){p.m-=s.c;own[i]=1;log=`Emeka buys ${s.n}. "Business is business."`;api.sfx('coin');}else log=`Emeka skips ${s.n}.`;}
   else if(own[i]!==me){const r=rent(i);p.m-=r;pl[own[i]].m+=r;log=`${p.n} pay${me?'s':''} ₦${r} rent for ${s.n}.`;api.sfx(me===0?'thud':'coin');}else log=`${p.n} visit${me?'s':''} own ${s.n}.`;}
  else if(s.t==='tax'){p.m-=100;log=`${p.n} pay${me?'s':''} ₦100 school fees.`;}
  else if(s.t==='gist'){const g=GIST[Math.floor(Math.random()*GIST.length)];g[1](p,G);log=`Gist: ${g[0]}`;}
  else if(s.t==='gojail'){G.jail(p);log=`${p.n} ${me?'goes':'go'} to Detention!`;api.sfx('thud');}
  else log=`${p.n}: ${s.n}.`;phase='done';check();draw();if(me===1&&!over)later(api,()=>{aiBuild();next();},900);}
 function check(){pl.forEach((p,k)=>{while(p.m<0){const i=hs.findIndex((h,j)=>h>0&&own[j]===k);if(i>=0){hs[i]--;p.m+=SQ[i].c/4;continue;}const j=own.findIndex(o=>o===k);if(j>=0){own[j]=-1;p.m+=SQ[j].c/2;continue;}break;}});
  const bk=pl.findIndex(p=>p.m<0);if(bk>=0)return finish(bk===1);}
 function finish(win){if(over)return;over=true;draw();const a=worth(0),b=worth(1);later(api,()=>win?api.win(`You out-traded Emeka! Net worth ₦${a} vs ₦${b}.`,{coins:35,xp:70}):api.lose(`Emeka owns the school. ₦${b} vs your ₦${a}.`,{coins:8,xp:30}),1000);}
 function roll(p){dice=[1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6)];const n=dice[0]+dice[1];api.sfx('swish');
  if(p.jail){if(dice[0]===dice[1]||p.jail>=2){p.jail=0;log=`${p.n} leave${pl.indexOf(p)?'s':''} detention.`;}else{p.jail++;log=`${p.n} ${pl.indexOf(p)?'is':'are'} still in detention.`;phase='done';draw();if(pl.indexOf(p)===1)later(api,next,900);return;}}
  draw();move(p,n,()=>land(p,p.pos));}
 function next(){if(over)return;turn=1-turn;if(turn===0){round++;if(round>MAXR)return finish(worth(0)>=worth(1));}phase='roll';draw();if(turn===1)later(api,()=>roll(pl[1]),900);}
 function aiBuild(){const e=pl[1];SQ.forEach((s,i)=>{if(s.t==='p'&&own[i]===1&&hasSet(1,s.g)&&hs[i]<3&&e.m-s.c/2>300){e.m-=s.c/2;hs[i]++;log+=` Emeka builds on ${s.n}!`;}});}
 function act(a){if(over||turn!==0)return;const me=pl[0],i=me.pos;
  if(a==='roll'&&phase==='roll'){phase='moving';roll(me);}
  if(a==='buy'&&phase==='buy'){if(me.m<SQ[i].c){log='Not enough money.';return draw();}me.m-=SQ[i].c;own[i]=0;phase='done';log=`You bought ${SQ[i].n}!${SQ[i].g!=null&&hasSet(0,SQ[i].g)?' Full set: rent doubles, and you can build.':''}`;api.sfx('coin');draw();}
  if(a==='pass'&&phase==='buy'){phase='done';log=`You passed on ${SQ[i].n}.`;draw();}
  if(a==='end'&&phase==='done')next();
  if(a==='build'){const c=SQ.map((s,j)=>j).filter(j=>SQ[j].t==='p'&&own[j]===0&&hasSet(0,SQ[j].g)&&hs[j]<3&&me.m>=SQ[j].c/2);const box=el.querySelector('[data-x]');
   box.innerHTML=`<div style="font-size:12px;font-weight:700;margin-top:4px;">Build a study block (raises rent):</div><div style="display:flex;gap:4px;flex-wrap:wrap;">${c.map(j=>`<button data-b="${j}" style="${BTN}font-size:13px;padding:3px 8px;">${SQ[j].n} ₦${SQ[j].c/2}</button>`).join('')}</div>`;
   box.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{const j=+b.dataset.b;me.m-=SQ[j].c/2;hs[j]++;log=`You built on ${SQ[j].n}. Rent is now ₦${rent(j)}.`;api.sfx('power');draw();});}
  if(a==='trade')tradeUI();}
 function tradeUI(){const box=el.querySelector('[data-x]');const mine=SQ.map((s,j)=>j).filter(j=>own[j]===0&&!hs[j]),theirs=SQ.map((s,j)=>j).filter(j=>own[j]===1&&!hs[j]);
  box.innerHTML=`<div style="font-size:12px;font-weight:700;margin-top:4px;">Make Emeka an offer</div><div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:3px;">
   ${theirs.map(j=>[1.2,1.6,2.2].map(k=>`<button data-buy="${j},${k}" style="${BTN}font-size:12px;padding:2px 6px;">Buy ${SQ[j].n} for ₦${Math.round(SQ[j].c*k)}</button>`).join('')).join('')}
   ${mine.map(j=>[0.9,1.3,1.8].map(k=>`<button data-sell="${j},${k}" style="${BTN}font-size:12px;padding:2px 6px;background:#fffdf6;">Sell ${SQ[j].n} for ₦${Math.round(SQ[j].c*k)}</button>`).join('')).join('')}
   ${!mine.length&&!theirs.length?'<span style="font-size:12px;">No properties to trade yet.</span>':''}</div>`;
  box.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{const [j,k]=b.dataset.buy.split(',').map(Number);const price=Math.round(SQ[j].c*k);const g=SQ[j].g;const breaks=g!=null&&setOf(g).filter(x=>own[x]===1).length>=setOf(g).length-0&&hasSet(1,g);const givesSet=g!=null&&setOf(g).every(x=>x===j||own[x]===0);
   const need=breaks?3:givesSet?2.0:1.15;if(pl[0].m<price){log='You can\'t afford that offer.';return draw();}
   if(k>=need){pl[0].m-=price;pl[1].m+=price;own[j]=0;log=`Deal! You bought ${SQ[j].n} for ₦${price}. Emeka: "Pleasure doing business."`;api.sfx('coin');}else log=givesSet?`Emeka: "And give you the full set? Ha! Bring more money."`:`Emeka: "₦${price}? My guy, that's too small."`;draw();});
  box.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>{const [j,k]=b.dataset.sell.split(',').map(Number);const price=Math.round(SQ[j].c*k);const g=SQ[j].g;const completes=g!=null&&setOf(g).every(x=>x===j||own[x]===1);
   const max=completes?2.0:1.0;if(pl[1].m-price<100){log='Emeka: "I no get that kind money now."';return draw();}
   if(k<=max){pl[1].m-=price;pl[0].m+=price;own[j]=1;log=`Sold ${SQ[j].n} to Emeka for ₦${price}.${completes?' Careful: that gives him a full set!':''}`;api.sfx('coin');}else log=`Emeka: "₦${price} for ${SQ[j].n}? Na robbery!"`;draw();});}
 draw();}
