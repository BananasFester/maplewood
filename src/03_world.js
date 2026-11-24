// ================= WORLD: map, objects, rooms, pathfinding =================
const N_TILES=MW*MH;
const W={floor:new Array(N_TILES).fill('grass'),wt:new Uint8Array(N_TILES),wp:new Array(N_TILES).fill('cream'),tall:new Uint8Array(N_TILES),open:new Uint8Array(N_TILES),
 block:new Uint8Array(N_TILES),objAt:new Array(N_TILES).fill(null),decor:new Array(N_TILES).fill(null),room:new Int16Array(N_TILES).fill(-1),rooms:[],ground:null,groundDirty:true};
const I=(x,y)=>x+y*MW;
const inMap=(x,y)=>x>=0&&y>=0&&x<MW&&y<MH;
const isWall=(x,y)=>inMap(x,y)&&W.wt[I(x,y)]>0;
function isInt(x,y){if(!inMap(x,y))return false;const i=I(x,y);return !W.wt[i]&&!FLOORS[W.floor[i]].out;}
function isOutdoor(x,y){if(!inMap(x,y))return true;const i=I(x,y);return !W.wt[i]&&!!FLOORS[W.floor[i]].out;}
function inLot(x,y){return x>=0&&y>=0&&x<MW&&y<LOTH;}
function objAt(x,y){return inMap(x,y)?W.objAt[I(x,y)]:null;}
function wallDecorAt(x,y){return inMap(x,y)?W.decor[I(x,y)]:null;}

// ---------- lots: the furnished starter cottage and empty lots for new households ----------
const START_FUNDS=20000;
const LOTS={
 empty:{n:'Willow Lot',p:2500,k:'Build from scratch',d:'An open lawn with a stone path and two shade trees. Build your home from the ground up.'},
 garden:{n:'Orchard Corner',p:4000,k:'Build from scratch',d:'A roomy lot with shade trees, flower beds and a garden patch ready to plant.'},
 shell:{n:"Builder's Cottage",p:8500,k:'Just add furniture',d:'Walls, floors, doors and windows are done. Furnish it your way.'},
 cottage:{n:'Maple Cottage',p:15500,k:'Ready to live in',d:'A furnished three-room home with a vegetable garden. Move right in.'}};
function blankPlan(){const fl=new Array(N_TILES).fill('grass'),wt=new Uint8Array(N_TILES),wp=new Array(N_TILES).fill('cream');
 for(let x=0;x<MW;x++){fl[I(x,SIDEY)]='side';fl[I(x,SIDEY+1)]='road';fl[I(x,SIDEY+2)]='road';fl[I(x,SIDEY+3)]='side';}
 return{fl,wt,wp,objs:[]};}
function rowsInto(P,rows,y0){rows.forEach((r,dy)=>{for(let x=0;x<MW;x++){const ch=r[x],i=I(x,y0+dy);if(ch==='#'||ch==='D'||ch==='W'){P.wt[i]=ch==='#'?1:ch==='D'?2:3;P.fl[i]='wood';}else if(ch&&ch!==' ')P.fl[i]=FCODE[ch]||'grass';}});}
function starterPlan(){const P=blankPlan();
 rowsInto(P,['......##W#W###W###W#W#......',
  '......#kkkkk#bbb#cccc#......','......#kkkkk#bbb#cccc#......','......#kkkkk#bbb#cccc#......','......#kkkkk#bbb#cccc#......',
  '......#wwwww##D###D###......',
  '......#wwwwwwwwwwwwww#......','......#wwwwwwwwwwwwww#......','......#wwwwwwwwwwwwww#......','......#wwwwwwwwwwwwww#......',
  '......###W###D###W####......'],4);
 for(let y=15;y<20;y++)P.fl[I(13,y)]='path';for(const x of[12,14])P.fl[I(x,15)]='path';
 for(let y=8;y<11;y++)for(let x=1;x<6;x++)P.fl[I(x,y)]='dirt';
 for(let x=6;x<=21;x++)P.wp[I(x,4)]=x<=12?'sage':x<=16?'tile':'dusk';
 P.objs=STARTER_FURN;return P;}
function lotPlan(key){if(key==='cottage')return starterPlan();const P=blankPlan(),O=P.objs;
 for(let y=15;y<SIDEY;y++)P.fl[I(13,y)]='path';
 O.push(['mailbox',14,19],['streetlamp',3,19],['streetlamp',24,19]);
 if(key==='empty')O.push(['tree',3,3],['tree',24,4],['bush',10,18],['bush',17,18],['flowers',12,17],['flowers',14,17]);
 if(key==='garden'){for(let y=8;y<11;y++)for(let x=1;x<6;x++)P.fl[I(x,y)]='dirt';
  O.push(['tree',2,2],['tree',7,2],['tree',25,2],['tree',25,12],['tree',2,15],['plot',2,9],['plot',3,9],['plot',4,9],['bench',20,17],
   ['flowers',10,17],['flowers',11,17],['flowers',15,17],['flowers',16,17],['lantern',12,16],['lantern',14,16],['bush',24,17]);}
 if(key==='shell'){
  rowsInto(P,['.......##W####W###W##.......',
   '.......#kkkkk#bb#ccc#.......','.......#kkkkk#bb#ccc#.......','.......#kkkkk#bb#ccc#.......',
   '.......###D###D###D##.......',
   '.......#wwwwwwwwwwww#.......','.......#wwwwwwwwwwww#.......','.......#wwwwwwwwwwww#.......','.......#wwwwwwwwwwww#.......',
   '.......##W###D###W###.......'],5);
  for(let x=7;x<=20;x++)P.wp[I(x,5)]=x<=13?'sage':x<=16?'tile':'dusk';
  O.push(['tree',2,2],['tree',25,2],['tree',25,16],['tree',2,16],['bush',8,15],['bush',19,15],['flowers',9,15],['flowers',10,15],['flowers',16,15],['flowers',17,15],['lantern',12,16],['lantern',14,16]);}
 return P;}
function applyPlan(P){W.wt.set(P.wt);for(let i=0;i<N_TILES;i++){W.floor[i]=P.fl[i];W.wp[i]=P.wp[i];}}
function loadStarterMap(){applyPlan(starterPlan());refreshWorld();}
function loadLot(key){if(key==='cottage'){loadStarterMap();furnishStarter();return;}
 const P=lotPlan(key);applyPlan(P);refreshWorld();for(const[t,x,y,o]of P.objs)addObject(t,x,y,Object.assign({},o||{}));for(const o of G.objects)o.bought=1;}
// little map used on the lot picker
function lotPreview(key,s){s=s||6;const P=lotPlan(key),[c,g]=mkc(MW*s,MH*s);
 const col=f=>({grass:'#7cae5b',path:'#cdbb98',dirt:'#8e6a4b',side:'#cfd2d4',road:'#5d6168'})[f]||(FLOORS[f]&&FLOORS[f].c?FLOORS[f].c[0]:'#c99a63');
 for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const i=I(x,y);g.fillStyle=P.wt[i]?(P.wt[i]===2?'#c98a4e':P.wt[i]===3?'#8fd0ee':'#4b3447'):col(P.fl[i]);
  if(!P.wt[i]&&P.fl[i]==='grass'&&(x+y)%2)g.fillStyle='#78a957';g.fillRect(x*s,y*s,s,s);}
 g.fillStyle='rgba(255,255,255,.55)';for(let x=1;x<MW;x+=3)g.fillRect(x*s,(SIDEY+1.9)*s,s*1.4,Math.max(1,s/5));
 for(const[t,x,y]of P.objs){const d=CATALOG[t];if(!d)continue;const cx=(x+d.w/2)*s,cy=(y+d.h/2)*s;
  if(d.tree){g.fillStyle='#3f7a3a';g.beginPath();g.arc(cx,cy-s*.4,s*1.25,0,7);g.fill();g.fillStyle='#57994a';g.beginPath();g.arc(cx-s*.3,cy-s*.7,s*.6,0,7);g.fill();}
  else if(d.bush){g.fillStyle='#4c8a43';g.beginPath();g.arc(cx,cy,s*.45,0,7);g.fill();}
  else if(t==='flowers'){g.fillStyle='#e77fa6';g.fillRect(x*s+s*.2,y*s+s*.3,s*.6,s*.4);}
  else if(d.plot){g.fillStyle='#6b4a33';g.fillRect(x*s+1,y*s+1,s-2,s-2);g.fillStyle='#7ccf5a';g.fillRect(x*s+s*.35,y*s+s*.35,s*.3,s*.3);}
  else if(t==='mailbox'){g.fillStyle='#3d6fb3';g.fillRect(x*s+s*.3,y*s+s*.2,s*.4,s*.5);}
  else if(t==='streetlamp'||t==='lantern'){g.fillStyle='#f3cf63';g.beginPath();g.arc(cx,cy,s*.25,0,7);g.fill();}
  else if(!d.wall){g.fillStyle=d.rug?'rgba(180,90,70,.55)':'#a7795a';g.fillRect(x*s+1,y*s+1,d.w*s-2,d.h*s-2);}}
 return c;}
function computeTall(){
 for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const i=I(x,y);if(!W.wt[i]){W.tall[i]=0;continue;}
  const hz=isWall(x-1,y)||isWall(x+1,y);
  W.tall[i]=(hz&&isOutdoor(x,y-1)&&(isInt(x,y+1)||isInt(x-1,y+1)||isInt(x+1,y+1)))?1:0;}
}
function indexObjects(){
 W.objAt.fill(null);W.decor.fill(null);
 for(const o of G.objects){if(o.def.wall){W.decor[I(o.x,o.y)]=o;continue;}if(o.def.rug)continue;
  for(let dy=0;dy<o.def.h;dy++)for(let dx=0;dx<o.def.w;dx++)if(inMap(o.x+dx,o.y+dy))W.objAt[I(o.x+dx,o.y+dy)]=o;}
 rebuildBlock();
}
function rebuildBlock(){for(let i=0;i<N_TILES;i++){const t=W.wt[i];W.block[i]=(t===1||t===3||W.objAt[i])?1:0;}}
function refreshWorld(){computeTall();indexObjects();computeRooms();W.groundDirty=true;WALL_SPR.clear();OBJ_SPR.clear();}

// rooms & decor
function computeRooms(){
 W.room.fill(-1);W.rooms=[];
 for(let y=0;y<LOTH;y++)for(let x=0;x<MW;x++){const i=I(x,y);if(W.room[i]>=0||!isInt(x,y))continue;
  const id=W.rooms.length,tiles=[],st=[i];W.room[i]=id;
  while(st.length){const c=st.pop();tiles.push(c);const cx=c%MW,cy=(c/MW)|0;
   for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy;if(!inMap(nx,ny))continue;const ni=I(nx,ny);if(W.room[ni]>=0||!isInt(nx,ny))continue;W.room[ni]=id;st.push(ni);}}
  W.rooms.push({id,tiles,size:tiles.length,decor:0});}
 roomDecorAll();
}
function roomDecorAll(){
 for(const r of W.rooms)r.decor=0;
 for(const o of G.objects){const d=o.def;let v=d.decor||0;if(!v)continue;
  let tx=o.x,ty=o.y+(d.h-1);if(d.wall)ty=o.y+1;const ri2=inMap(tx,ty)?W.room[I(tx,ty)]:-1;if(ri2>=0)W.rooms[ri2].decor+=v;}
 for(let y=0;y<LOTH;y++)for(let x=0;x<MW;x++)if(W.wt[I(x,y)]===3){for(const[dx,dy]of[[0,1],[0,-1],[1,0],[-1,0]]){const r=inMap(x+dx,y+dy)?W.room[I(x+dx,y+dy)]:-1;if(r>=0){W.rooms[r].decor+=.75;break;}}}
 for(const it of G.items||[])if(it.kind==='dirty'||it.kind==='puddle'){const r=W.room[I(it.x,it.y)];if(r>=0)W.rooms[r].decor-=1.5;}
}
function roomOf(x,y){const r=inMap(x,y)?W.room[I(x,y)]:-1;return r>=0?W.rooms[r]:null;}
function roomCozy(r){return r&&r.decor>=2+r.size/8;}

// ---------- pathfinding ----------
const DIRS8=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
class Heap{constructor(){this.a=[];this.p=[];}get size(){return this.a.length;}
 push(v,pr){const a=this.a,p=this.p;a.push(v);p.push(pr);let i=a.length-1;while(i>0){const j=(i-1)>>1;if(p[j]<=p[i])break;[a[i],a[j]]=[a[j],a[i]];[p[i],p[j]]=[p[j],p[i]];i=j;}}
 pop(){const a=this.a,p=this.p,top=a[0];const lv=a.pop(),lp=p.pop();if(a.length){a[0]=lv;p[0]=lp;let i=0;for(;;){const l=i*2+1,r=l+1;let m=i;if(l<a.length&&p[l]<p[m])m=l;if(r<a.length&&p[r]<p[m])m=r;if(m===i)break;[a[i],a[m]]=[a[m],a[i]];[p[i],p[m]]=[p[m],p[i]];i=m;}}return top;}}
function stepOK(cx,cy,dx,dy,goal){const nx=cx+dx,ny=cy+dy;if(!inMap(nx,ny))return false;const ni=I(nx,ny);if(W.block[ni]&&ni!==goal)return false;
 if(dx&&dy){if(W.block[I(cx+dx,cy)]||W.block[I(cx,cy+dy)])return false;if(W.wt[ni]===2||W.wt[I(cx,cy)]===2)return false;if(W.wt[I(cx+dx,cy)]||W.wt[I(cx,cy+dy)])return false;}return true;}
function findPath(sx,sy,tx,ty,adj){
 if(!inMap(tx,ty)||!inMap(sx,sy))return null;
 if(sx===tx&&sy===ty&&!adj)return[];
 const goal=I(tx,ty),start=I(sx,sy);
 if(!adj&&W.block[goal])return null;
 const g=new Float32Array(N_TILES).fill(1e9),came=new Int32Array(N_TILES).fill(-1),closed=new Uint8Array(N_TILES),open=new Heap();
 const hh=(i)=>{const x=i%MW,y=(i/MW)|0,dx=Math.abs(x-tx),dy=Math.abs(y-ty);return Math.max(dx,dy)+.414*Math.min(dx,dy);};
 g[start]=0;open.push(start,hh(start));
 while(open.size){const cur=open.pop();if(closed[cur])continue;closed[cur]=1;const cx=cur%MW,cy=(cur/MW)|0;
  const atGoal=cur===goal&&!adj, nearGoal=adj&&Math.max(Math.abs(cx-tx),Math.abs(cy-ty))<=1&&!W.block[cur]&&!(cx===tx&&cy===ty&&W.block[cur]);
  if(atGoal||nearGoal){const p=[];let c=cur;while(c!==start&&c>=0){p.push([c%MW,(c/MW)|0]);c=came[c];}p.reverse();return p;}
  for(const[dx,dy,cost]of DIRS8){if(!stepOK(cx,cy,dx,dy,adj?-1:goal))continue;const ni=I(cx+dx,cy+dy);const ng=g[cur]+cost+(W.wt[ni]===2?.2:0);if(ng<g[ni]){g[ni]=ng;came[ni]=cur;open.push(ni,ng+hh(ni));}}}
 return null;
}
function distField(sx,sy){
 const d=new Float32Array(N_TILES).fill(Infinity);if(!inMap(sx,sy))return d;const open=new Heap(),s=I(sx,sy);d[s]=0;open.push(s,0);
 while(open.size){const cur=open.pop();const cx=cur%MW,cy=(cur/MW)|0;
  for(const[dx,dy,cost]of DIRS8){if(!stepOK(cx,cy,dx,dy,-1))continue;const ni=I(cx+dx,cy+dy);const nd=d[cur]+cost;if(nd<d[ni]){d[ni]=nd;open.push(ni,nd);}}}
 return d;
}
function freeTile(x,y){return inMap(x,y)&&!W.block[I(x,y)];}
function nearestFree(x,y){if(freeTile(x,y))return[x,y];for(let r=1;r<8;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;if(freeTile(x+dx,y+dy))return[x+dx,y+dy];}return[x,y];}

// ---------- objects ----------
function addObject(type,x,y,opt){opt=opt||{};const def=CATALOG[type];if(!def)return null;
 const o={id:opt.id||uid('o'),type,def,x,y,rot:opt.rot||0,variant:opt.variant||0,state:opt.state||{},users:{},price:opt.price!=null?opt.price:def.p,bought:opt.bought||0};
 G.objects.push(o);return o;}
function removeObject(o){const i=G.objects.indexOf(o);if(i>=0)G.objects.splice(i,1);for(const s of G.people)if(s.inObj&&s.inObj.o===o)s.inObj=null;}
function objAlive(o){return o&&G.objects.includes(o);}
function canPlace(type,x,y,rot,ignore){
 const d=CATALOG[type];
 if(d.wall){if(!inLot(x,y))return'Off the lot';const i=I(x,y);if(W.wt[i]!==1||!W.tall[i])return'Hang on a back wall';const e=W.decor[i];if(e&&e!==ignore)return'Something is already here';return true;}
 for(let dy=0;dy<d.h;dy++)for(let dx=0;dx<d.w;dx++){const tx=x+dx,ty=y+dy;if(!inLot(tx,ty))return'Off the lot';const i=I(tx,ty);
  if(W.wt[i])return'Blocked by a wall';const f=W.floor[i];if(f==='road'||f==='side')return'Not on the street';
  if(d.rug){for(const o of G.objects)if(o!==ignore&&o.def.rug&&tx>=o.x&&tx<o.x+o.def.w&&ty>=o.y&&ty<o.y+o.def.h)return'Rugs cannot overlap';continue;}
  const oa=W.objAt[i];if(oa&&oa!==ignore)return'Something is in the way';
  if(doorFront(tx,ty))return'Keep the doorway clear';
  if((d.tree||d.plot)&&!FLOORS[f].out)return'Needs to go outside';}
 return true;
}
// tiles directly in front of or behind a door must stay free so people can walk through
function doorFront(x,y){const door=(a,b)=>inMap(a,b)&&W.wt[I(a,b)]===2,hz=(a,b)=>isWall(a-1,b)&&isWall(a+1,b),vt=(a,b)=>isWall(a,b-1)&&isWall(a,b+1);
 return(door(x,y-1)&&hz(x,y-1))||(door(x,y+1)&&hz(x,y+1))||(door(x-1,y)&&vt(x-1,y))||(door(x+1,y)&&vt(x+1,y));}
function lotValue(){return G.objects.reduce((a,o)=>a+(o.def.fixed?0:(o.price||0)),0);}
