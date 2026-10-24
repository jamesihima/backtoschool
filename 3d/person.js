import * as THREE from 'three';
// Organic humanoid: ~7-head teen proportions, lathe/capsule anatomy, physical skin with sheen, layered face, textured hair.
const GC={},MC={};const gg=(k,f)=>GC[k]||(GC[k]=f());const mc=(k,f)=>MC[k]||(MC[k]=f());
const V=(r,y)=>new THREE.Vector2(r,y);const lathe=(pts,seg=12)=>new THREE.LatheGeometry(pts.map(([r,y])=>V(r,y)),seg);
const cap=(r,l,rs=3,cs=8)=>new THREE.CapsuleGeometry(r,l,Math.min(rs,3),Math.min(cs,8));const sph=(r,w=10,h=8)=>new THREE.SphereGeometry(r,Math.min(w,16),Math.min(h,12));
function tex(w,h,f){const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
export const skinM=c=>c;const clothM=c=>c;const hairM=c=>c;const flatM=c=>c;
const SHARED=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.62,metalness:0});
const _c=new THREE.Color();
const BAKE={};
function bake(g,bones,skin,hc,key){const ph=[];g.traverse(o=>{if(o.userData.pg)ph.push(o);});const buckets=new Map();let lids=null;const lidHost=g.userData._head;const cached=key&&BAKE[key];let bi=0;
 const order=[];
 ph.forEach(o=>{let p=o.parent;const m=new THREE.Matrix4().compose(o.position,o.quaternion,o.scale);while(p&&!bones.has(p)){m.premultiply(new THREE.Matrix4().compose(p.position,p.quaternion,p.scale));p=p.parent;}
  const k=o.userData.pg.sep?'lids':p;if(!buckets.has(k)){buckets.set(k,{host:o.userData.pg.sep?lidHost:p,list:[]});order.push(k);}if(!cached)buckets.get(k).list.push({o,m});o.parent.remove(o);});
 const geos=cached||order.map(k=>{const b=buckets.get(k);let nv=0,ni=0;const items=b.list.map(({o,m})=>{let ge=o.userData.pg.geo;if(!ge.index){if(!ge.userData.idx){const n=ge.attributes.position.count,ix=new Uint32Array(n);for(let i=0;i<n;i++)ix[i]=i;ge.setIndex(new THREE.BufferAttribute(ix,1));ge.userData.idx=1;}}
   nv+=ge.attributes.position.count;ni+=ge.index.count;return{ge,m,col:o.userData.pg.col};});
  const P=new Float32Array(nv*3),N=new Float32Array(nv*3),C=new Float32Array(nv*3),I=new Uint32Array(ni);let vo=0,io=0;const v=new THREE.Vector3(),nm=new THREE.Matrix3();
  items.forEach(({ge,m,col})=>{const pa=ge.attributes.position,na=ge.attributes.normal,ia=ge.index;nm.getNormalMatrix(m);_c.set(col);const jit=(col===skin||col===hc)?0.06:0.02;
   for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(m);P.set([v.x,v.y,v.z],(vo+i)*3);v.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();N.set([v.x,v.y,v.z],(vo+i)*3);const j=1+Math.sin(i*12.9898+vo)*jit;C[(vo+i)*3]=_c.r*j;C[(vo+i)*3+1]=_c.g*j;C[(vo+i)*3+2]=_c.b*j;}
   for(let i=0;i<ia.count;i++)I[io+i]=ia.getX(i)+vo;vo+=pa.count;io+=ia.count;});
  const ge=new THREE.BufferGeometry();ge.setAttribute('position',new THREE.BufferAttribute(P,3));ge.setAttribute('normal',new THREE.BufferAttribute(N,3));ge.setAttribute('color',new THREE.BufferAttribute(C,3));ge.setIndex(new THREE.BufferAttribute(I,1));ge.computeBoundingSphere();return ge;});
 if(key&&!cached)BAKE[key]=geos;
 order.forEach((k,i)=>{const b=buckets.get(k);const me=new THREE.Mesh(geos[i],SHARED);me.castShadow=k===g.userData._up||k===lidHost;me.receiveShadow=true;b.host.add(me);if(k==='lids'){me.visible=false;me.castShadow=false;lids=me;}});
 const empty=[];g.traverse(o=>{if(o.isGroup&&!bones.has(o)&&o!==g&&o!==g.userData._rig&&o.children.length===0)empty.push(o);});empty.forEach(o=>o.parent&&o.parent.remove(o));return lids;}

const lipC=c=>'#'+new THREE.Color(c).multiplyScalar(0.7).lerp(new THREE.Color('#7a3330'),0.3).getHexString();
const bumpy=(k,amp)=>gg('bump'+k,()=>{const ge=new THREE.IcosahedronGeometry(1,2),p=ge.attributes.position,v=new THREE.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const n=1+amp*(Math.sin(v.x*11+k)*Math.sin(v.y*13)*Math.sin(v.z*9+k*2)+0.5*Math.sin(v.x*23+v.y*19));v.multiplyScalar(n);p.setXYZ(i,v.x,v.y,v.z);}ge.computeVertexNormals();return ge;});
const TORSO={m:[[0,0],[0.13,0],[0.142,0.08],[0.138,0.2],[0.15,0.32],[0.168,0.42],[0.176,0.48],[0.162,0.54],[0.115,0.585],[0.055,0.605],[0,0.61]],
 f:[[0,0],[0.138,0],[0.142,0.08],[0.124,0.2],[0.138,0.31],[0.152,0.39],[0.156,0.46],[0.146,0.53],[0.105,0.58],[0.05,0.6],[0,0.605]]};
function mesh(geo,col){const o=new THREE.Object3D();o.userData.pg={geo,col};return o;}
function put(parent,m,x,y,z,sx,sy,sz){m.position.set(x,y,z);if(sx!=null)m.scale.set(sx,sy??sx,sz??sx);parent.add(m);return m;}
export function makePerson(look){
 const g=new THREE.Group(),rig=new THREE.Group();g.add(rig);const adult=!!look.adult,fem=!!look.skirt||['puffs','braids','bun','wrap'].includes(look.hair);
 const SK=skinM(look.skin),SH=clothM(look.coat?(look.coatC||'#f4f4f0'):look.shirt),BT=clothM(look.bottom),SHOE=flatM(adult?'#2a1c16':'#1d1d1d',{roughness:0.45}),SOLE=flatM(adult?'#3a2a20':'#ecebe6'),HC=look.hair==='wrap'?'#c0392b':'#17110d';
 // legs: hip -> knee -> ankle
 const legs=[],knees=[];
 [-1,1].forEach(s=>{const p=new THREE.Group();p.position.set(s*0.085,0.8,0);rig.add(p);const trousers=adult||look.trousers;
  p.add(mesh(gg('thigh',()=>lathe([[0,-0.42],[0.054,-0.4],[0.066,-0.3],[0.079,-0.12],[0.076,-0.02],[0,0.01]],12)),trousers?BT:SK));
  if(!trousers&&!look.skirt)put(p,mesh(gg('shortleg',()=>new THREE.CylinderGeometry(0.088,0.083,0.22,10)),BT),0,-0.09,0);
  const k=new THREE.Group();k.position.y=-0.4;p.add(k);
  k.add(mesh(gg('shin',()=>lathe([[0,-0.4],[0.036,-0.38],[0.043,-0.3],[0.057,-0.13],[0.054,-0.03],[0,0.02]],12)),trousers?BT:SK));
  if(!trousers)put(k,mesh(gg('sock',()=>new THREE.CylinderGeometry(0.047,0.043,0.13,10)),flatM('#efefea',{roughness:0.9})),0,-0.33,0);
  const shoe=put(k,mesh(gg('shoe',()=>{const ge=cap(0.05,0.12,5,12);ge.rotateX(Math.PI/2);return ge;}),SHOE),0,-0.37,0.035,1.05,0.72,1);
  put(k,mesh(gg('sole',()=>new THREE.BoxGeometry(0.105,0.026,0.24)),SOLE,false),0,-0.405,0.035);
  legs.push(p);knees.push(k);});
 const upper=new THREE.Group();upper.position.y=0.8;rig.add(upper);
 // pelvis / skirt
 if(look.gown)put(upper,mesh(gg('gown',()=>lathe([[0,-0.8],[0.29,-0.8],[0.25,-0.55],[0.19,-0.22],[0.15,0],[0.14,0.08],[0,0.08]],16)),BT),0,0,0,1,1,0.82);
 else if(look.skirt)put(upper,mesh(gg('skirt',()=>lathe([[0,-0.38],[0.235,-0.38],[0.21,-0.22],[0.165,0],[0.145,0.08],[0,0.08]],12)),BT),0,0,0,1,1,0.8);
 else put(upper,mesh(gg('pelvis',()=>lathe([[0,-0.13],[0.12,-0.14],[0.156,-0.06],[0.15,0.04],[0.14,0.1],[0,0.1]],12)),BT),0,0,0,1,1,0.72);
 // torso
 put(upper,mesh(gg('torso'+(fem?'f':'m'),()=>lathe(TORSO[fem?'f':'m'],24)),SH),0,0.0,0,1,1,0.66);
 if(look.vest)put(upper,mesh(gg('torso'+(fem?'f':'m'),()=>0),clothM('#1e2a44')),0,0.01,0,1.04,0.95,0.7);
 if(look.coat)put(upper,mesh(gg('coatHem',()=>new THREE.CylinderGeometry(0.16,0.185,0.34,10)),SH),0,-0.1,0,1,1,0.72);
 if(!adult&&!look.casual){put(upper,mesh(gg('placket',()=>new THREE.BoxGeometry(0.028,0.46,0.01)),clothM('#ffffff'),false),0,0.31,0.104);
  const bm=flatM('#d9d4c8');for(let k=0;k<3;k++)put(upper,mesh(gg('btn',()=>sph(0.008,8,6)),bm,false),0,0.18+k*0.12,0.11);
  put(upper,mesh(gg('badge',()=>new THREE.BoxGeometry(0.06,0.07,0.01)),flatM('#3f6fa3'),false),0.075,0.43,0.108);}
 put(upper,mesh(gg('belt',()=>new THREE.TorusGeometry(0.142,0.014,5,12)),flatM('#2a2226',{roughness:0.4}),false),0,0.05,0,1,1,0.7).rotation.x=Math.PI/2;
 put(upper,mesh(gg('collar',()=>new THREE.TorusGeometry(0.058,0.017,5,12)),SH,false),0,0.6,0.005,1,1,0.85).rotation.x=Math.PI/2;
 put(upper,mesh(gg('neck',()=>new THREE.CylinderGeometry(0.043,0.048,0.16,10)),SK),0,0.67,0);
 // arms: shoulder -> elbow -> wrist
 const arms=[],elbows=[];const longSleeve=adult||look.coat;
 [-1,1].forEach(s=>{const p=new THREE.Group();p.position.set(s*0.19,0.53,0);upper.add(p);
  put(p,mesh(gg('delt',()=>sph(0.062,16,12)),SH),0,-0.01,0,1,1,0.92);
  put(p,mesh(gg('uarm',()=>cap(0.047,0.18)),longSleeve?SH:SK),0,-0.13,0);
  put(p,mesh(gg('sleeve',()=>new THREE.CylinderGeometry(0.064,0.059,0.15,10)),SH),0,-0.07,0);
  const e=new THREE.Group();e.position.y=-0.27;p.add(e);
  put(e,mesh(gg('farm',()=>cap(0.04,0.17)),longSleeve?SH:SK),0,-0.11,0);
  if(longSleeve)put(e,mesh(gg('cuff',()=>new THREE.CylinderGeometry(0.041,0.041,0.03,10)),SK,false),0,-0.215,0);
  const hand=new THREE.Group();hand.position.y=-0.245;e.add(hand);
  put(hand,mesh(gg('palm',()=>sph(0.045,14,10)),SK),0,-0.035,0.004,0.72,1.12,0.48);
  const th=put(hand,mesh(gg('thumb',()=>cap(0.013,0.03,3,8)),SK,false),-s*0.022,-0.02,0.02);th.rotation.z=s*0.5;
  put(hand,mesh(gg('fingers',()=>cap(0.026,0.03,4,10)),SK,false),0,-0.085,0.006,1.2,1,0.65);
  arms.push(p);elbows.push(e);});
 // head
 const head=new THREE.Group();head.position.y=0.74;upper.add(head);
 put(head,mesh(gg('skull',()=>sph(0.12,16,12)),SK),0,0.145,-0.005,0.92,1.05,1.0);
 put(head,mesh(gg('jaw',()=>sph(0.086,14,10)),SK),0,0.075,0.03,fem?0.92:1,0.9,0.95);
 put(head,mesh(gg('cheek',()=>sph(0.05,14,10)),SK,false),-0.055,0.1,0.07,1,0.8,0.8);put(head,mesh(gg('cheek',()=>0),SK,false),0.055,0.1,0.07,1,0.8,0.8);
 [-1,1].forEach(s=>{put(head,mesh(gg('ear',()=>sph(0.03,12,10)),SK,false),s*0.112,0.13,0.0,0.42,1,0.75);});
 const eyes=[];const SC=flatM('#f3eee4',{roughness:0.25}),IR=flatM('#2b170c',{roughness:0.2}),HL=flatM('#ffffff',{emissive:'#ffffff',emissiveIntensity:0.8});
 [-1,1].forEach(s=>{const e=new THREE.Group();e.position.set(s*0.042,0.152,0.099);head.add(e);
  put(e,mesh(gg('sclera',()=>sph(0.019,14,10)),SC,false),0,0,0,1,0.78,0.6);put(e,mesh(gg('iris',()=>sph(0.011,12,8)),IR,false),0,0,0.009,1,1,0.5);put(e,mesh(gg('hl',()=>sph(0.0035,6,4)),HL,false),0.004,0.005,0.0145);
  const lid=put(head,mesh(gg('lid',()=>new THREE.SphereGeometry(0.021,8,6)),SK),s*0.042,0.153,0.1,1.08,0.85,0.7);lid.userData.pg.sep=1;
  const br=put(head,mesh(gg('brow',()=>cap(0.0065,0.032,3,6)),hairM(HC==='#c0392b'?'#17110d':HC,false),false),s*0.044,0.183,0.111);br.rotation.z=Math.PI/2+s*0.12;
  eyes.push({e,lid});});
 put(head,mesh(gg('nose',()=>sph(0.021,14,10)),SK,false),0,0.118,0.117,1.05,0.85,0.95);
 put(head,mesh(gg('bridge',()=>cap(0.011,0.04,3,8)),SK,false),0,0.14,0.112).rotation.x=-0.25;
 const LP=skinM(lipC(look.skin));
 put(head,mesh(gg('lipU',()=>cap(0.0085,0.034,3,8)),LP,false),0,0.087,0.108).rotation.z=Math.PI/2;
 put(head,mesh(gg('lipL',()=>cap(0.0105,0.03,3,8)),LP,false),0,0.074,0.104).rotation.z=Math.PI/2;
 // hair
 const HM=hairM(HC,look.hair==='afro'||look.hair==='puffs'||look.hair==='bun');
 const capH=(sc=1)=>{const m=put(head,mesh(gg('hairCap',()=>new THREE.SphereGeometry(0.128,16,9,0,Math.PI*2,0,Math.PI*0.56)),HM),0,0.15,-0.01,0.95*sc,1.04*sc,1.06*sc);m.rotation.x=-0.32;return m;};
 const bump=(k,r,x,y,z,sx=1,sy=1,sz=1)=>put(head,mesh(bumpy(k,0.05),HM),x,y,z,r*sx,r*sy,r*sz);
 if(look.hair==='wrap'){const W=clothM('#c0392b');put(head,mesh(bumpy(3,0.08),W),0,0.24,-0.02,0.15,0.1,0.15);put(head,mesh(gg('wrapBand',()=>new THREE.TorusGeometry(0.12,0.035,5,12)),W),0,0.2,-0.01,1,1,1).rotation.x=Math.PI/2-0.3;put(head,mesh(bumpy(5,0.1),W),0.06,0.3,-0.05,0.07,0.06,0.09);}
 else if(look.hair==='cap'){capH(0.98);const c=put(head,mesh(gg('hat',()=>new THREE.CylinderGeometry(0.125,0.13,0.1,10)),clothM(look.capC||'#8a3a6b')),0,0.25,-0.005);c.rotation.x=-0.12;put(head,mesh(gg('brim',()=>new THREE.CylinderGeometry(0.1,0.1,0.012,10,1,false,-Math.PI/2,Math.PI)),clothM(look.capC||'#8a3a6b')),0,0.215,0.09,1,1,0.9);}
 else{capH(1);
  if(look.hair==='afro')bump(1,0.16,0,0.2,-0.025,1.08,0.95,1.05);
  if(look.hair==='puffs'){bump(2,0.08,-0.105,0.24,-0.02);bump(4,0.08,0.105,0.24,-0.02);[-1,1].forEach(s=>put(head,mesh(gg('tie',()=>new THREE.TorusGeometry(0.035,0.012,5,12)),clothM('#2f7a5a'),false),s*0.085,0.215,-0.015).rotation.z=s*0.7);}
  if(look.hair==='bun')bump(6,0.065,0,0.25,-0.095);
  if(look.hair==='braids'){const bg=gg('braid',()=>cap(0.014,0.22,3,8));for(let k=0;k<7;k++){const a=Math.PI*0.25+k*Math.PI*0.5/6;put(head,mesh(bg,HM,false),Math.cos(a)*0.11*(k%2?1:0.95)-0.0,0.0,-Math.sin(a)*0.1-0.01).rotation.x=0.18;}head.children.slice(-7).forEach((m,k)=>{const a=Math.PI+0.35+k*(Math.PI-0.7)/6;m.position.set(Math.cos(a)*0.105,0.02,Math.sin(a)*0.1-0.015);});}
  if(look.hair==='short'&&!fem)put(head,mesh(gg('fade',()=>new THREE.SphereGeometry(0.124,16,4,0,Math.PI*2,Math.PI*0.4,Math.PI*0.25)),HM,false),0,0.15,-0.012,0.97,1.02,1.04);}
 if(look.glasses){const gm=flatM('#2a2226',{roughness:0.3});[-1,1].forEach(s=>put(head,mesh(gg('rim',()=>new THREE.TorusGeometry(0.025,0.004,5,12)),gm,false),s*0.043,0.152,0.122));put(head,mesh(gg('gbr',()=>new THREE.BoxGeometry(0.03,0.004,0.004)),gm,false),0,0.156,0.123);}
 if(look.tray){const tr=put(head,mesh(gg('tray',()=>new THREE.CylinderGeometry(0.3,0.26,0.05,10)),flatM('#b8b8b8',{metalness:0.5,roughness:0.35})),0,0.33,0);const om=flatM(look.trayC||'#e8901e',{roughness:0.5});for(let k=0;k<6;k++)put(head,mesh(gg('fruit',()=>sph(0.065,10,8)),om),Math.cos(k)*0.15,0.39,Math.sin(k)*0.15);}
 g.userData._head=head;g.userData._rig=rig;g.userData._up=upper;const lids=bake(g,new Set([...legs,...knees,upper,...arms,...elbows,head]),look.skin,HC,JSON.stringify(look));
 g.scale.setScalar(adult?1.1:1);
 g.userData={rig,legs,knees,arms,elbows,upper,head,lids,blink:2+Math.random()*3,phase:Math.random()*6,look,kick:0};return g;}
const SIT={listen:1,notes:1,chat:1,doodle:1,sleep:1,eat:1,read:1,tv:1,cards:1};
const ease=(a,b,k)=>a+(b-a)*k;
export function poseUpdate(p,dt,moving,pose,spd=1){const u=p.userData;if(u.kick>0)u.kick-=dt;const kn=u.knees||[],el=u.elbows||[];const f=Math.min(1,dt*10);
 u.blink-=dt;if(u.lids){u.lids.visible=u.blink<0.12&&u.blink>0;if(u.blink<=0)u.blink=2+Math.random()*4;}
 if(pose&&SIT[pose]){u.rig.position.y=-0.36;u.legs.forEach(l=>l.rotation.x=-Math.PI/2);kn.forEach(k=>k.rotation.x=Math.PI/2);
  const lean=pose==='sleep'?0.95:(pose==='notes'||pose==='doodle'||pose==='read'||pose==='eat'||pose==='cards')?0.25:0;
  u.upper.rotation.x+=(lean-u.upper.rotation.x)*Math.min(1,dt*5);u.phase+=dt*(pose==='notes'?8:pose==='doodle'?5:pose==='eat'?3:1.5);
  u.arms.forEach((a,k)=>{let v=pose==='sleep'?-1.5:(pose==='listen'||pose==='tv')?-0.45:-0.75;let ev=pose==='sleep'?-0.9:(pose==='listen'||pose==='tv')?-0.5:-0.7;
   if(k&&(pose==='notes'||pose==='doodle'))ev+=Math.sin(u.phase)*0.15;if(k&&pose==='eat'){v=-0.6-Math.max(0,Math.sin(u.phase))*0.5;ev=-0.9-Math.max(0,Math.sin(u.phase))*1.2;}
   if(pose==='cards'){v=-0.8;ev=-0.75+(k?Math.sin(u.phase)*0.08:0);}a.rotation.x=v;a.rotation.z=0;if(el[k])el[k].rotation.x=ev;});
  u.head.rotation.y=pose==='chat'?Math.sin(u.phase*2)*0.15+0.9*(u.chatSide||1):0;u.head.rotation.x=pose==='sleep'?0.3:(pose==='notes'||pose==='read')?0.35:0;return;}
 u.rig.position.y=0;u.upper.rotation.x*=0.8;u.head.rotation.set(0,0,0);
 if(moving){u.phase+=dt*9*spd;const s=Math.sin(u.phase),c=Math.cos(u.phase),a=Math.min(1.05,0.6*Math.max(1,spd*0.8)),run=Math.min(1,Math.max(0,spd-1.1));
  u.legs[0].rotation.x=s*a;u.legs[1].rotation.x=-s*a;
  if(kn[0]){kn[0].rotation.x=0.08+Math.max(0,-c)*a*(1.1+run*0.9);kn[1].rotation.x=0.08+Math.max(0,c)*a*(1.1+run*0.9);}
  u.arms[0].rotation.x=-s*a*0.8;u.arms[1].rotation.x=s*a*0.8;u.arms.forEach((q,k)=>q.rotation.z=(k?-1:1)*0.06);el.forEach(e=>e.rotation.x=ease(e.rotation.x,-0.25-run*0.95,f));
  u.upper.rotation.x=run*0.18;u.upper.rotation.y=s*0.06;u.rig.position.y=Math.abs(c)*0.035*Math.max(1,spd*0.7);}
 else{u.phase+=dt*1.5;u.legs.forEach(l=>l.rotation.x*=0.8);kn.forEach(k=>k.rotation.x=ease(k.rotation.x,0.03,f));u.upper.rotation.y*=0.8;
  u.arms.forEach((q,k)=>{q.rotation.x*=0.8;q.rotation.z=(k?-1:1)*(0.07+0.02*Math.sin(u.phase));});el.forEach(e=>e.rotation.x=ease(e.rotation.x,-0.12,f));u.rig.position.y=Math.sin(u.phase*0.8)*0.004;}
 if(pose==='wave'){u.arms[1].rotation.x=-2.6;u.arms[1].rotation.z=Math.sin(u.phase*6)*0.3;if(el[1])el[1].rotation.x=-0.5;}
 if(u.kick>0){const k=u.kick/0.3,sw=Math.sin((1-k)*Math.PI);u.legs[1].rotation.x=-sw*1.3;if(kn[1])kn[1].rotation.x=0.9*(1-sw)*(k>0.5?1:0.2);}}
