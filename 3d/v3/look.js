import * as THREE from 'three';
// Palette lifted from the isometric reference: warm ochre, sage, maroon asphalt, cream stone, plum shadows.
export const PAL={grass:'#6e8b5c',grass2:'#62804f',path:'#dcc6a0',road:'#6b3934',road2:'#5e322e',line:'#ead7b4',walk:'#d2b991',curb:'#b89c76',
 ochre:'#e3a347',ochreD:'#c7842f',sage:'#55745c',sageD:'#46624d',cream:'#ecdcbc',creamD:'#d6c19c',brick:'#a8553f',brickD:'#8e4433',plum:'#4a3340',
 trunk:'#c98a3c',leaf:'#5a7a5c',leaf2:'#6f8f68',leaf3:'#4b6a52',fence:'#3a2a2c',glass:'#3f5560',glassL:'#8fb0b4',frame:'#f2e6cc',tank:'#2a2526',
 court:'#7d3d34',courtL:'#f0dfc0',earth:'#5a3a30',earth2:'#46302a',white:'#f6efe0'};
const MC={};
export const L=(c,o={})=>{const k=c+JSON.stringify(o);return MC[k]||(MC[k]=new THREE.MeshLambertMaterial({color:c,flatShading:true,...o}));};
export function bx(w,h,d,c,x=0,y=0,z=0,name){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),c.isMaterial?c:L(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;if(name)m.name=name;return m;}
export function cy(rt,rb,h,c,x=0,y=0,z=0,seg=10){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),c.isMaterial?c:L(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;return m;}
// instanced batches: collect transforms then flush once (keeps draw calls low)
export class Batch{constructor(geo,mat,cast=true){this.geo=geo;this.mat=mat;this.m=[];this.c=[];this.cast=cast;}
 add(x,y,z,sx=1,sy=1,sz=1,ry=0,col){const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),ry);this.m.push(new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),q,new THREE.Vector3(sx,sy,sz)));this.c.push(col||null);}
 flush(parent,name){if(!this.m.length)return null;const im=new THREE.InstancedMesh(this.geo,this.mat,this.m.length);this.m.forEach((m,k)=>{im.setMatrixAt(k,m);if(this.c[k])im.setColorAt(k,new THREE.Color(this.c[k]));});im.castShadow=this.cast;im.receiveShadow=true;if(name)im.name=name;parent.add(im);return im;}}
// wind: vertex sway weighted by local height (VC_Wind equivalent: trunk 0 -> tips 1)
export const wind={value:0};
export function windMat(color){const m=new THREE.MeshLambertMaterial({color,flatShading:true});m.onBeforeCompile=s=>{s.uniforms.uTime=wind;s.vertexShader='uniform float uTime;\n'+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 #ifdef USE_INSTANCING
 vec4 wp=instanceMatrix*vec4(0.,0.,0.,1.);
 #else
 vec4 wp=vec4(0.);
 #endif
 float wgt=clamp(position.y+0.6,0.,1.6);
 transformed.x+=sin(uTime*1.4+wp.x*0.35+wp.z*0.2)*0.07*wgt;
 transformed.z+=cos(uTime*1.1+wp.z*0.3)*0.05*wgt;`);};return m;}
// Compositing pass: AgX-ish soft shoulder -> sRGB -> lift/gamma/gain grade (plum shadows, warm highlights) -> soft posterize -> vignette -> grain.
export function makePost(renderer){
 const rt=new THREE.WebGLRenderTarget(4,4,{samples:0});let sf=0,every=3;renderer.shadowMap.autoUpdate=false;
 const mat=new THREE.ShaderMaterial({uniforms:{tDiffuse:{value:rt.texture},uTime:{value:0},uRes:{value:new THREE.Vector2(1,1)},uVig:{value:1},uDark:{value:0},uRad:{value:0.45}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:`uniform sampler2D tDiffuse;uniform float uTime;uniform vec2 uRes;uniform float uVig;uniform float uDark;uniform float uRad;varying vec2 vUv;
  vec3 toS(vec3 c){return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-0.055,step(0.0031308,c));}
  void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;
   c=c/(1.+c*0.18);c=toS(clamp(c,0.,1.));
   float l=dot(c,vec3(.299,.587,.114));
   vec3 lift=vec3(0.075,0.04,0.075),gain=vec3(1.04,0.99,0.92);
   c=lift+c*(gain-lift);c=pow(c,vec3(0.97,1.0,1.04));
   c=mix(vec3(l),c,0.9);
   vec3 q=floor(c*28.+0.5)/28.;c=mix(c,q,0.35);
   vec2 e2=vUv-0.5;e2.x*=uRes.x/uRes.y;c*=mix(1.,0.16+0.84*smoothstep(uRad,uRad*0.55,length(e2)),uDark);
   vec2 d=vUv-0.5;d.x*=uRes.x/uRes.y;float v=smoothstep(1.05,0.25,length(d));c*=mix(1.,mix(0.72,1.,v),uVig);
   float n=fract(sin(dot(floor(vUv*uRes)+fract(uTime)*91.,vec2(12.9898,78.233)))*43758.5453);c+=(n-0.5)*0.05;
   gl_FragColor=vec4(c,1.);}`,depthTest:false,depthWrite:false});
 const qs=new THREE.Scene();const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),mat);quad.frustumCulled=false;qs.add(quad);const qc=new THREE.Camera();
 return{setShadowEvery(n){every=n;},setVision(d,r){mat.uniforms.uDark.value=d;mat.uniforms.uRad.value=r;},setSize(w,h){const p=renderer.getPixelRatio();rt.setSize(Math.round(w*p),Math.round(h*p));mat.uniforms.uRes.value.set(w*p,h*p);},
  render(scene,cam,t){if((sf++%every)===0)renderer.shadowMap.needsUpdate=true;renderer.setRenderTarget(rt);renderer.render(scene,cam);renderer.setRenderTarget(null);mat.uniforms.uTime.value=t;renderer.render(qs,qc);}};}
export function sunRig(scene,intensity=2.7){scene.add(new THREE.HemisphereLight('#f4e6d0','#5a4450',1.05));
 const sun=new THREE.DirectionalLight('#ffe2b8',intensity);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.bias=-0.0004;sun.shadow.normalBias=0.03;
 Object.assign(sun.shadow.camera,{left:-45,right:45,top:45,bottom:-45,near:1,far:220});scene.add(sun,sun.target);return sun;}
