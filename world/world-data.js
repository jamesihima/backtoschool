(function(){
const N=30;
const B=[
 {id:'classroom',name:'SS1 CLASSROOM BLOCK',i:3,j:16,w:10,d:3,h:50,roof:'gable',rh:26,wall:'#efe4cf',band:'#b5583e',roofC:'#3f6fa3',door:[8,19],doors:[2,5,8],win:true},
 {id:'canteen',name:'CANTEEN',i:18,j:17,w:6,d:4,h:46,roof:'hip',rh:30,wall:'#efe4cf',band:'#b5583e',roofC:'#3f6fa3',door:[20,21],doors:[2.2],win:true},
 {id:'admin',name:'ADMINISTRATIVE BLOCK',i:18,j:23,w:5,d:3,h:84,floors:2,roof:'flat',wall:'#e9dfcc',band:'#a9563f',roofC:'#3f6fa3',door:[20,26],doors:[2.2],win:true},
 {id:'lab',name:'SCIENCE LABORATORY',i:18,j:8,w:7,d:3,h:52,roof:'gable',rh:24,wall:'#d9d6cf',band:null,roofC:'#3f6fa3',door:[21,11],doors:[3.2],win:true},
 {id:'library',name:'LIBRARY',i:4,j:8,w:5,d:4,h:72,floors:2,roof:'flat',wall:'#d8d3c8',band:null,roofC:'#cfc8ba',door:[6,12],doors:[2.2],win:true,glass:true},
 {id:'common',name:'COMMON ROOM',i:4,j:2,w:6,d:3,h:48,roof:'hip',rh:26,wall:'#efe4cf',band:'#b5583e',roofC:'#3f6fa3',door:[7,5],doors:[3.2],win:true}
];
const FIELD={id:'field',name:'SCHOOL FIELD',i:17,j:1,w:11,d:6,door:[22,4]};
const COURT={id:'courtyard',name:'COURTYARD',i:9,j:12,w:5,d:2,door:[12,13]};
const TREES=[[2,14,'mango'],[1,7,'palm'],[12,7,'round'],[26,12,'palm'],[27,21,'round'],[10,23,'flame'],[3,24,'round'],[12,2,'palm'],[26,26,'palm'],[11,13,'mango'],[1,20,'palm'],[24,14,'round'],[8,26,'flame'],[2,1,'round']];
const BENCHES=[[12,15],[17,13]];
const tiles=[];for(let j=0;j<N;j++){tiles.push([]);for(let i=0;i<N;i++)tiles[j].push('g');}
const set=(i,j,k)=>{if(i>=0&&j>=0&&i<N&&j<N)tiles[j][i]=k;};
for(let j=0;j<28;j++){set(14,j,'p');set(15,j,'p');}
for(let i=1;i<29;i++){set(i,14,'p');set(i,15,'p');}
for(let i=3;i<14;i++)set(i,19,'p');
for(let i=16;i<22;i++)set(i,21,'p');
for(let i=16;i<22;i++)set(i,26,'p');
for(let i=16;i<23;i++)set(i,11,'p');
for(let i=6;i<14;i++)set(i,12,'p');
for(let i=7;i<14;i++)set(i,5,'p');
for(let j=12;j<14;j++)for(let i=9;i<14;i++)set(i,j,'p');
for(let j=7;j<14;j++)set(22,j,'p');
for(let i=0;i<N;i++){set(i,28,'r');set(i,29,'r');}
for(let i=12;i<18;i++)set(i,27,'p');
for(let j=FIELD.j;j<FIELD.j+FIELD.d;j++)for(let i=FIELD.i;i<FIELD.i+FIELD.w;i++)set(i,j,'f');
const walk=[];for(let j=0;j<N;j++){walk.push([]);for(let i=0;i<N;i++)walk[j].push(true);}
B.forEach(b=>{for(let j=b.j;j<b.j+b.d;j++)for(let i=b.i;i<b.i+b.w;i++)walk[j][i]=false;});
TREES.forEach(([i,j])=>{walk[j][i]=false;});
BENCHES.forEach(([i,j])=>{walk[j][i]=false;});
for(let i=0;i<N;i++)if(i<13||i>16)walk[27][i]=false;
walk[27][13]=false;walk[27][16]=false;
const pathTiles=[];for(let j=0;j<28;j++)for(let i=0;i<N;i++)if((tiles[j][i]==='p'||tiles[j][i]==='f')&&walk[j][i])pathTiles.push([i,j]);
const SK=['#6b3f26','#7a4a2e','#5c3520','#86553a'];
const NPCS=[
 {name:'Chidi',shirt:'#f4eedb',bottom:'#22345e',hair:'afro'},{name:'Amaka',shirt:'#f4eedb',bottom:'#22345e',hair:'braids',skirt:1,glasses:1},
 {name:'Tunde',shirt:'#f4eedb',bottom:'#22345e',hair:'short'},{name:'Zainab',shirt:'#f4eedb',bottom:'#22345e',hair:'bun',skirt:1},
 {name:'Emeka',shirt:'#f4eedb',bottom:'#22345e',hair:'short'},{name:'Bayo',shirt:'#f4eedb',bottom:'#22345e',hair:'short'},
 {name:'Funmi',shirt:'#f4eedb',bottom:'#22345e',hair:'puffs',skirt:1},{name:'Ike',shirt:'#f4eedb',bottom:'#22345e',hair:'short'},
 {name:'Halima',shirt:'#f4eedb',bottom:'#22345e',hair:'braids',skirt:1},{name:'Seyi',shirt:'#f4eedb',bottom:'#22345e',hair:'afro'},
 {name:'Mr. Adeyemi',shirt:'#cfe3ef',bottom:'#4a4d55',hair:'short',adult:1},{name:'Mrs. Okafor',shirt:'#b8722e',bottom:'#22345e',hair:'bun',skirt:1,adult:1}
].map((n,k)=>({...n,skin:SK[k%4]}));
const STATIC=[{name:'Mr. Ibrahim',shirt:'#8fb6d9',bottom:'#1e2a44',hair:'short',adult:1,skin:'#5c3520',i:12.5,j:26.5,vest:1},{name:'Mama Titi',shirt:'#e9e3d6',bottom:'#7a3a2e',hair:'wrap',skirt:1,adult:1,skin:'#7a4a2e',i:21.5,j:21.6}];
window.BTS_WORLD={N,B,FIELD,ZONES:[FIELD,COURT],TREES,BENCHES,tiles,walk,pathTiles,NPCS,STATIC,spawn:[8.5,20.5]};
})();
