// ================= TOWN: a seeded, procedurally generated town around your lot =================
// Units: 1 unit = 1 lot tile. Every residential lot is 28 x 20 units, and streets are 4 units wide,
// so the lot you play on lines up exactly with its outline on the town map.
const LW=28,LH=20,ST=4;
const TREE_NAMES=['Maple','Birch','Cedar','Willow','Aspen','Juniper','Hazel','Rowan','Alder','Linden','Magnolia','Sycamore','Chestnut','Poplar','Laurel','Elm'];
const TOWN_NAMES=['Willowbrook','Cedar Hollow','Juniper Falls','Hazelton','Briarwood','Oakmere','Fernvale','Larkspur','Thistledown','Ambergrove'];
// places around town; 'out' describes a trip a person can take there
const POI_KINDS={
 lake:{icon:'fish',col:'#3f8fd0',d:'Cast a line off the dock. Fish can be sold, and the quiet does wonders for the mood.',
  out:{l:'Go fishing',dur:150,fx:{fun:16,social:3,energy:-6,hunger:-6},fish:1,mood:'fishing',wish:'fish'}},
 park:{icon:'leaf',col:'#5fa64f',d:'Lawns, a fountain and a gazebo. Neighbors gather here, especially for the Sunday picnic.',
  out:{l:'Hang out at the park',dur:120,fx:{fun:16,social:22},meet:1,mood:'parkDay',wish:'outing'}},
 cafe:{icon:'food',col:'#a86a3c',d:'Coffee, pastries and friendly chatter on Main Street.',
  out:{l:'Coffee and a pastry',dur:60,cost:12,fx:{hunger:30,energy:14,social:12},mood:'caffeinated',wish:'outing'}},
 library:{icon:'book',col:'#6b5aa6',d:'Quiet reading rooms and a Wednesday evening book club.',
  out:{l:'Study at the library',dur:120,fx:{fun:6,social:2},xp:{logic:95},mood:'goodBook',wish:'outing'}},
 gym:{icon:'fitness',col:'#d0543f',d:'Weights, a track and hot showers.',
  out:{l:'Work out at the gym',dur:90,cost:10,fx:{energy:-14,fun:5,hygiene:10},xp:{fitness:115},mood:'workoutHigh',wish:'workout'}},
 museum:{icon:'painting',col:'#c99a3b',d:'Paintings, fossils and a little gift shop. Artists leave inspired.',
  out:{l:'Visit the museum',dur:100,cost:8,fx:{fun:18},xp:{painting:40},mood:'inspired',wish:'outing'}},
 market:{icon:'gardening',col:'#e8662e',d:'An open-air market every Saturday morning. Harvests and fish sell for more here.',
  out:{l:'Sell at the market',dur:90,fx:{social:14,fun:6},sell:1.35,needEvent:'market',wish:'outing'}},
 townhall:{icon:'home',col:'#7a8794',d:'The community board lists this week\'s events.'},
 bakery:{icon:'food',col:'#d99a5b',d:'Warm bread every morning.'},
 florist:{icon:'flowers',col:'#d6739a',d:'Seasonal bouquets and garden seedlings.'},
 hardware:{icon:'hammer',col:'#8a6d4b',d:'Nails, paint and plenty of advice.'}};
// weekly community events (day 0 = Monday)
const TOWN_EVENTS=[
 {id:'bookclub',day:2,from:18,to:21,poi:'library',l:'Book club',d:'Readers trade favorites. Great for conversation.',bonus:{xp:{charisma:60},social:12}},
 {id:'derby',day:4,from:17,to:21,poi:'lake',l:'Fishing derby',d:'Biggest catch wins bragging rights. Fish bite twice as often.',bonus:{fishX:2,mood:'derby'}},
 {id:'market',day:5,from:8,to:14,poi:'market',l:'Farmers market',d:'Stalls full of produce, and the best prices for your harvest.',bonus:{}},
 {id:'picnic',day:6,from:11,to:16,poi:'park',l:'Community picnic',d:'The whole neighborhood brings a dish. Easy to make friends.',bonus:{meet:2,social:15,mood:'picnic'}}];
const FISH={sunfish:{l:'Sunfish',sell:8,w:40},perch:{l:'Perch',sell:12,w:28},bass:{l:'Bass',sell:18,w:18},trout:{l:'Trout',sell:24,w:10},catfish:{l:'Catfish',sell:34,w:4},carp:{l:'Golden Carp',sell:150,w:.5}};

// ---------- starter home designs (front wall always on row 14, centered so they mirror cleanly) ----------
// K kitchen, B bath, R and Q bedrooms, L living room; '#' wall, 'D' door, 'W' window
const HOUSE_TPL=[
 {n:'Cozy Cottage',beds:1,baths:1,base:6500,x0:7,y0:5,
  rows:['##W####W###W##','#KKKKK#BB#RRR#','#KKKKK#BB#RRR#','#KKKKK#BB#RRR#','###D###D###D##','#LLLLLLLLLLLL#','#LLLLLLLLLLLL#','#LLLLLLLLLLLL#','#LLLLLLLLLLLL#','##W###D###W###'],
  wp:[[7,13,'K'],[13,16,'B'],[16,20,'R']],
  furn:[['fridge',8,6],['counter',9,6],['stove',10,6],['counter',11,6],['sink_k',12,6],['trash',8,8],['shower',14,6],['toilet',15,6],['sink_b',15,8],
   ['bed_double',17,6],['lamp_table',19,6],['table_dining',8,11],['chair_dining',8,10],['chair_dining',9,10],['chair_dining',8,12,{rot:1}],['chair_dining',9,12,{rot:1}],
   ['tv',16,10],['sofa',16,12,{rot:1}],['lamp_floor',19,12],['plant_s',19,10]]},
 {n:'Garden Bungalow',beds:2,baths:1,base:10000,x0:5,y0:5,
  rows:['##W###W###W####W##','#RRRR#BB#QQQQ#KKK#','#RRRR#BB#QQQQ#KKK#','#RRRR#BB#QQQQ#KKK#','###D##D####D###D##','#LLLLLLLLLLLLLLLL#','#LLLLLLLLLLLLLLLL#','#LLLLLLLLLLLLLLLL#','#LLLLLLLLLLLLLLLL#','###W####D####W####'],
  wp:[[5,10,'R'],[10,13,'B'],[13,18,'Q'],[18,22,'K']],
  furn:[['bed_double',6,6],['lamp_table',9,6],['shower',11,6],['toilet',12,6],['sink_b',12,8],['bed_single',14,6],['bed_single',17,6],['lamp_table',15,6],
   ['fridge',19,6],['stove',20,6],['sink_k',21,6],['trash',19,8],['table_dining',18,11],['chair_dining',18,10],['chair_dining',19,10],['chair_dining',18,12,{rot:1}],['chair_dining',19,12,{rot:1}],
   ['tv',9,10],['sofa',9,12,{rot:1}],['lamp_floor',6,10],['plant_s',21,13],['bookshelf',6,13]]},
 {n:'Starter Studio',beds:1,baths:1,base:4000,x0:9,y0:7,
  rows:['##W##W##W#','#LLLLL#BB#','#LLLLL#BB#','#LLLLL#BB#','#LLLLL#D##','#LLLLLLLL#','#LLLLLLLL#','##W#D##W##'],
  wp:[[9,15,'L'],[15,18,'B']],
  furn:[['bed_single',10,8],['lamp_table',11,8],['fridge',12,8],['stove',13,8],['sink_k',14,8],['shower',16,8],['toilet',17,8],['sink_b',17,10],
   ['sofa',11,13,{rot:1}],['tv',11,11],['table_end',10,12],['plant_s',17,13]]}];
for(const t of HOUSE_TPL)t.premium=Math.round(t.furn.reduce((a,f)=>a+CATALOG[f[0]].p,0)*.8/50)*50;
const PAL={K:['k','b','m'],B:['b','m'],R:['c','u','o','w','n'],Q:['c','u','o','w'],L:['w','n','c','w']};
const WPAL={K:['sage','cream','mustard','tile'],B:['tile','tile','cream','rose'],R:['dusk','rose','cream','navy','sage'],Q:['rose','dusk','mustard','cream'],L:['cream','panel','sage','brick']};

let TOWN=null;
function genTown(seed){seed=(seed>>>0)||1;const R=mulberry(seed),ri=(a,b)=>a+Math.floor(R()*(b-a+1)),pk=a=>a[Math.floor(R()*a.length)],
  shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const C=4,RB=6,M=46,trees=shuffle(TREE_NAMES.slice());
 const T={seed,name:pk(TOWN_NAMES),blocks:[],lots:[],pois:[],roads:[],trees:[],hstreets:[],vstreets:[],lake:null,park:null,plans:{}};
 const ks=[];for(let c=0;c<C;c++)ks.push(R()<.25?4:3);
 const vx=[];let x=M;for(let c=0;c<C;c++){vx.push(x);x+=ST+ks[c]*LW;}vx.push(x);T.W=x+ST+M;
 const hy=[];let y=M;for(let r=0;r<RB;r++){hy.push(y);y+=ST+2*LH;}hy.push(y);T.H=y+ST+M;T.vx=vx;T.hy=hy;
 const B=(r,c)=>r>=0&&c>=0&&r<RB&&c<C?T.blocks[r*C+c]:null;
 for(let r=0;r<RB;r++)for(let c=0;c<C;c++)T.blocks.push({r,c,x0:vx[c]+ST,y0:hy[r]+ST,x1:vx[c+1],y1:hy[r+1],k:ks[c],zone:'res'});
 // a lake fills two by two blocks in one corner, a downtown block near the middle, and a park beside it
 const lc=pk([[0,0],[0,C-2],[RB-2,0],[RB-2,C-2]]);for(let r=lc[0];r<lc[0]+2;r++)for(let c=lc[1];c<lc[1]+2;c++)B(r,c).zone='lake';
 const dt=pk(T.blocks.filter(b=>b.zone==='res'&&b.r>=1&&b.r<=RB-2&&b.c>=1&&b.c<=C-2&&![[-1,0],[1,0],[0,-1],[0,1]].some(([a,b2])=>B(b.r+a,b.c+b2)&&B(b.r+a,b.c+b2).zone==='lake')))||pk(T.blocks.filter(b=>b.zone==='res'));dt.zone='down';
 const pkb=pk(T.blocks.filter(b=>b.zone==='res'&&Math.abs(b.r-dt.r)+Math.abs(b.c-dt.c)===1))||pk(T.blocks.filter(b=>b.zone==='res'));pkb.zone='park';
 // street names (one of them is always Maple Lane)
 const hn=[],vn=[];for(let r=0;r<=RB;r++)hn.push(`${trees[r%trees.length]} ${pk(['Lane','Street','Avenue','Drive','Lane'])}`);
 for(let c=0;c<=C;c++)vn.push(`${trees[(c+7)%trees.length]} ${pk(['Road','Way','Road','Court'])}`);
 const resRows=[];for(let r=1;r<RB;r++)if(B(r-1,0)&&[0,1,2,3].some(c=>B(r-1,c).zone==='res'||B(r,c).zone==='res'))resRows.push(r);
 const mapleRow=resRows.length?resRows[Math.floor(resRows.length/2)]:1;hn[mapleRow]='Maple Lane';
 // road pieces along each block edge, skipping the ones that would run through the lake
 const isLake=b=>!b||b.zone==='lake';
 for(let r=0;r<=RB;r++)for(let c=0;c<C;c++){if(isLake(B(r-1,c))&&isLake(B(r,c)))continue;T.roads.push({x:vx[c],y:hy[r],w:vx[c+1]+ST-vx[c],h:ST,hz:1,name:hn[r]});}
 for(let c=0;c<=C;c++)for(let r=0;r<RB;r++){if(isLake(B(r,c-1))&&isLake(B(r,c)))continue;T.roads.push({x:vx[c],y:hy[r],w:ST,h:hy[r+1]+ST-hy[r],hz:0,name:vn[c]});}
 T.hstreets=hn;T.vstreets=vn;
 // lake: a wobbly ellipse inside its blocks, with a shore path and a fishing dock facing town
 {const a=B(lc[0],lc[1]),b=B(lc[0]+1,lc[1]+1),x0=a.x0-ST,y0=a.y0-ST,x1=b.x1+ST,y1=b.y1+ST,cx=(x0+x1)/2,cy=(y0+y1)/2,rx=(x1-x0)/2*.74,ry=(y1-y0)/2*.72;
  const p1=R()*6,p2=R()*6,p3=R()*6,pts=[];for(let i=0;i<56;i++){const t=i/56*Math.PI*2,k=1+.09*Math.sin(3*t+p1)+.06*Math.sin(5*t+p2)+.04*Math.sin(2*t+p3);pts.push([cx+Math.cos(t)*rx*k,cy+Math.sin(t)*ry*k]);}
  const tx=T.W/2,ty=T.H/2;let best=pts[0];for(const p of pts)if(Math.hypot(p[0]-tx,p[1]-ty)<Math.hypot(best[0]-tx,best[1]-ty))best=p;
  const ang=Math.atan2(cy-best[1],cx-best[0]);T.lake={x0,y0,x1,y1,cx,cy,pts,dock:{x:best[0],y:best[1],a:ang}};
  T.pois.push({id:'lake',kind:'lake',name:`${trees[8]} Lake`,x:x0,y:y0,w:x1-x0,h:y1-y0,bx:best[0]+Math.cos(ang)*6,by:best[1]+Math.sin(ang)*6});}
 // park block
 T.park=pkb;T.down=dt;T.pois.push({id:'park',kind:'park',name:`${trees[9]} Park`,x:pkb.x0,y:pkb.y0,w:pkb.x1-pkb.x0,h:pkb.y1-pkb.y0,bx:(pkb.x0+pkb.x1)/2,by:(pkb.y0+pkb.y1)/2});
 // downtown: one building per slot, facing its street
 {const kinds=shuffle(['cafe','library','gym','museum','market','townhall']).concat(shuffle(['bakery','florist','hardware']));const slots=[];
  for(let row=0;row<2;row++)for(let i=0;i<dt.k;i++)slots.push({x:dt.x0+i*LW,y:dt.y0+row*LH,face:row?'s':'n'});
  const names={cafe:pk(['The Daily Grind','Bean There','The Copper Kettle','Morning Glory Cafe']),library:`${trees[10]} Library`,gym:pk(['Iron Oak Gym','Peak Fitness','Granite Gym']),
   museum:`${T.name} Museum`,market:'Market Square',townhall:'Town Hall',bakery:'Rise and Shine Bakery',florist:'Petal and Stem',hardware:'Nuts and Bolts'};
  slots.forEach((s,i)=>{const k=kinds[i];if(!k)return;T.pois.push({id:k,kind:k,name:names[k],x:s.x,y:s.y,w:LW,h:LH,face:s.face,bx:s.x+LW/2,by:s.y+LH/2,ri:R()});});}
 // residential lots, back to back in every remaining block
 const nearZone=(b,z)=>[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,1],[-1,1],[1,-1]].some(([a,c])=>B(b.r+a,b.c+c)&&B(b.r+a,b.c+c).zone===z);
 for(const b of T.blocks){if(b.zone!=='res')continue;for(let row=0;row<2;row++)for(let i=0;i<b.k;i++){const face=row?'s':'n',street=row?b.r+1:b.r;
  const lot={id:'L'+T.lots.length,x:b.x0+i*LW,y:b.y0+row*LH,w:LW,h:LH,face,street:hn[street],num:10+Math.round((b.x0+i*LW-M)/LW)*2+(row?2:1),seed:(seed*7919+T.lots.length*104729)>>>0,
   corner:i===0||i===b.k-1,park:nearZone(b,'park'),lake:nearZone(b,'lake'),kind:'private',tpl:ri(0,2),mir:R()<.5,furn:true,garden:R()<.35,block:b.r*C+b.c};
  T.lots.push(lot);}}
 // who lives where, and what is for sale
 const lots=shuffle(T.lots.slice());const take=f=>{const i=lots.findIndex(f);return i<0?null:lots.splice(i,1)[0];};
 if(seed===2611)T.name='Maplewood';
 const hart=take(l=>l.street==='Maple Lane'&&l.face==='s')||take(l=>l.street==='Maple Lane')||lots.shift();hart.kind='hart';hart.tpl=null;
 NEIGHBORS.forEach((n,i)=>{const l=take(l=>!l.lake||i%2)||lots.shift();if(l){l.kind='neighbor';l.owner=i;}});
 for(let i=0;i<9;i++){const l=take(l=>i%3!==0||l.lake||l.park);if(l){l.kind='empty';l.tpl=null;}}
 for(let i=0;i<7;i++){const l=take(()=>true);if(l){l.kind='starter';l.furn=true;}}
 for(const l of T.lots){l.price=lotPrice(l);if(l.kind==='starter'){l.priceU=lotPrice(l,false);l.priceF=lotPrice(l,true);}}
 // forest ring and scattered trees
 for(let i=0;i<520;i++){const x2=R()*T.W,y2=R()*T.H;const inner=x2>M-6&&x2<T.W-M+6&&y2>M-6&&y2<T.H-M+6;if(inner)continue;if(T.lake&&inPoly(x2,y2,T.lake.pts,8))continue;T.trees.push([x2,y2,.8+R()*.6,R()]);}
 {const L=T.lake;for(let i=0;i<70;i++){const x2=L.x0+R()*(L.x1-L.x0),y2=L.y0+R()*(L.y1-L.y0);if(inPoly(x2,y2,L.pts,7))continue;if(T.roads.some(r=>x2>r.x-2&&x2<r.x+r.w+2&&y2>r.y-2&&y2<r.y+r.h+2))continue;T.trees.push([x2,y2,.7+R()*.5,R()]);}}
 {const p=T.park;for(let i=0;i<26;i++){const x2=p.x0+3+R()*(p.x1-p.x0-6),y2=p.y0+3+R()*(p.y1-p.y0-6),cx=(p.x0+p.x1)/2,cy=(p.y0+p.y1)/2;if(Math.abs(x2-cx)<16&&Math.abs(y2-cy)<12)continue;if(Math.abs(y2-cy)<2.5||Math.abs(x2-cx)<2.5)continue;T.trees.push([x2,y2,.7+R()*.5,R()]);}}
 return T;}
function inPoly(x,y,pts,pad){let c=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const[xi,yi]=pts[i],[xj,yj]=pts[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c;}
 if(c||!pad)return c;for(const p of pts)if(Math.hypot(p[0]-x,p[1]-y)<pad)return true;return false;}
// price of a lot; for a house, furn says whether it comes furnished (defaults to how the lot is set up)
function lotPrice(l,furn){const R=mulberry(l.seed^0x9e37),f=(l.park?900:0)+(l.lake?1400:0)+(l.corner?500:0);let p;
 if(l.kind==='hart')p=furn===false?11000:15500;else if(l.kind==='empty')p=1900+f+Math.floor(R()*5)*150+(l.garden?400:0);
 else{const t=HOUSE_TPL[l.tpl||0];p=t.base+Math.round(f*.6)+Math.floor(R()*6)*100+((furn==null?l.furn:furn)?t.premium:0);}
 return Math.round(p/50)*50;}
function lotName(l){return `${l.num} ${l.street}`;}
function lotTitle(l){if(l.kind==='empty')return'Empty lot';if(l.kind==='hart')return'Maple Cottage';return HOUSE_TPL[l.tpl||0].n;}
function lotFeatures(l){const t=l.tpl!=null&&l.kind!=='empty'?HOUSE_TPL[l.tpl]:null,F=[];
 if(l.kind==='hart')F.push('3 rooms','Vegetable garden');else if(t)F.push(`${t.beds} bed, ${t.baths} bath`);
 if(l.lake)F.push('Lake view');if(l.park)F.push('Near the park');if(l.corner)F.push('Corner lot');if(l.garden&&l.kind!=='hart')F.push('Garden patch');return F;}
function townLot(id){return TOWN&&TOWN.lots.find(l=>l.id===id)||null;}
function homeLot(){return townLot(G.home);}
function ensureTown(){if(!G.town||!G.town.seed)G.town={seed:2611};if(!TOWN||TOWN.seed!==G.town.seed)TOWN=genTown(G.town.seed);
 if(!G.home||!townLot(G.home)){const h=TOWN.lots.find(l=>l.kind==='hart');G.home=h.id;}return TOWN;}

// ---------- the lot you actually play on, generated from a town lot ----------
function lotPlanFor(l,furn){const fu=furn==null?!!l.furn:!!furn,key=l.id+(fu?':f':':u');if(TOWN&&TOWN.plans[key])return TOWN.plans[key];let P;
 if(l.kind==='hart'){P=starterPlan();if(!fu)P.objs=P.objs.filter(([t])=>isYardItem(t));}
 else{P=blankPlan();const R=mulberry(l.seed),RV=mulberry(l.seed^0x5bd1),pk=a=>a[Math.floor(R()*a.length)],O=P.objs,mx=x=>l.mir?27-x:x,emp=l.kind==='empty';let door=13,hx0=11,hx1=16,hy0=9;
  if(l.kind!=='empty'){const t=HOUSE_TPL[l.tpl||0],pal={},wpl={};for(const k in PAL)pal[k]=pk(PAL[k]);for(const k in WPAL)wpl[k]=pk(WPAL[k]);
   const rows=t.rows.map(r=>{let s=r.replace(/[KBRQL]/g,c=>pal[c]);if(l.mir)s=s.split('').reverse().join('');return'.'.repeat(t.x0)+s+'.'.repeat(28-t.x0-s.length);});
   rowsInto(P,rows,t.y0);hx0=t.x0;hx1=t.x0+t.rows[0].length-1;hy0=t.y0;
   for(const[a,b,k]of t.wp)for(let x=a;x<=b;x++)P.wp[I(mx(x),t.y0)]=wpl[k];
   for(let x=0;x<MW;x++)if(P.wt[I(x,14)]===2)door=x;
   if(fu)for(const[ty,x,y,o]of t.furn){const d=CATALOG[ty];O.push([ty,l.mir?27-x-(d.w-1):x,y,Object.assign({variant:Math.floor(RV()*4)},o||{})]);}}
  if(!emp)for(let y=15;y<SIDEY;y++)P.fl[I(door,y)]='path';
  O.push(['mailbox',door+(door<14?1:-1),19],['streetlamp',3,19],['streetlamp',24,19]);
  const free=(x,y,w,h)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++){if(i<0||j<0||i>=MW||j>=LOTH)return false;if(P.wt[I(i,j)]||P.fl[I(i,j)]!=='grass')return false;if(i>=hx0-1&&i<=hx1+1&&j>=hy0-1&&j<=15)return false;if(Math.abs(i-door)<2&&j>=13)return false;}
   return!O.some(([t2,ox,oy])=>{const d=CATALOG[t2];return i2(ox,oy,d.w,d.h,x-1,y-1,w+2,h+2);});};
  if(l.garden){const gx=l.mir?23:1;let ok=true;for(let y=8;y<11;y++)for(let x=gx;x<gx+4;x++)if(P.wt[I(x,y)]||x>=hx0-1&&x<=hx1+1)ok=false;
   if(ok){for(let y=8;y<11;y++)for(let x=gx;x<gx+4;x++)P.fl[I(x,y)]='dirt';for(let x=gx+1;x<gx+4;x++)O.push(['plot',x,9]);}}
  const spots=[[2,2],[25,2],[6,1],[21,1],[2,16],[25,16],[1,12],[26,12],[4,18],[23,18]].concat(emp?[]:[[9,2],[18,2],[13,3]]);let n=l.kind==='empty'?2+Math.floor(R()*4):1+Math.floor(R()*3);
  for(const[x,y]of spots.sort(()=>R()-.5)){if(n<=0)break;if(free(x,y,1,1)){O.push(['tree',x,y]);n--;}}
  if(l.kind!=='empty'){for(const x of[hx0+1,hx1-1])if(free(x,15,1,1)||Math.abs(x-door)>1)O.push(['bush',x,15]);for(const x of[door-2,door+2])if(x>hx0&&x<hx1&&!O.some(o=>o[1]===x&&o[2]===15))O.push(['flowers',x,15]);}
  }
 if(TOWN)TOWN.plans[key]=P;return P;}
function i2(ax,ay,aw,ah,bx,by,bw,bh){return ax<bx+bw&&ax+aw>bx&&ay<by+bh&&ay+ah>by;}
// live a household into a town lot
function loadTownLot(l,furn){G.ext=defaultExt();if(l.kind!=='hart')G.ext.roof=ROOFS[(l.seed>>>3)%ROOFS.length];if(l.kind==='hart'){loadStarterMap();furnishStarter(furn===false);return;}const P=lotPlanFor(l,furn);applyPlan(P);refreshWorld();
 for(const[t,x,y,o]of P.objs)addObject(t,x,y,Object.assign({},o||{}));for(const o of G.objects)o.bought=1;}
function eventsOn(day){return TOWN_EVENTS.filter(e=>e.day===day%7);}
function eventNow(poiKind){const h=hourOf(G.time),d=wday(G.time);return TOWN_EVENTS.find(e=>e.poi===poiKind&&e.day===d&&h>=e.from&&h<e.to)||null;}
function nextEvents(n){const out=[],d0=dayOf(G.time),h=hourOf(G.time);for(let k=0;k<8&&out.length<n;k++){const d=d0+k;for(const e of TOWN_EVENTS)if(e.day===wday(d*1440)&&(k>0||h<e.to))out.push({e,day:d,today:k===0,live:k===0&&h>=e.from});}return out.slice(0,n);}
