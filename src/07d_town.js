// ================= TOWN VIEW: zoom out to see the whole town, shop for a home, and head out =================
const ROOFS=['#c4664a','#a95a48','#5f708a','#6f8e6b','#86627c','#c79a5a','#7c6a5c','#b8785a','#9a6f9a','#5d8a8a'];
const LAWNS=['#8cc06a','#86ba64','#91c46f','#82b562','#89bd67'];
const POI_ROOF={cafe:'#b9774d',library:'#7d6aa8',gym:'#c45f4a',museum:'#cdb88a',townhall:'#9aa6b2',bakery:'#d9a46b',florist:'#d98aa8',hardware:'#9a7c5c'};
function planPreview(P,s){s=s||6;const[c,g]=mkc(MW*s,MH*s);
 const col=f=>({grass:'#7cae5b',path:'#cdbb98',dirt:'#8e6a4b',side:'#cfd2d4',road:'#5d6168'})[f]||(FLOORS[f]&&FLOORS[f].c?FLOORS[f].c[0]:'#c99a63');
 for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const i=I(x,y);g.fillStyle=P.wt[i]?(P.wt[i]===2?'#c98a4e':P.wt[i]===3?'#8fd0ee':'#4b3447'):col(P.fl[i]);if(!P.wt[i]&&P.fl[i]==='grass'&&(x+y)%2)g.fillStyle='#78a957';g.fillRect(x*s,y*s,s,s);}
 g.fillStyle='rgba(255,255,255,.55)';for(let x=1;x<MW;x+=3)g.fillRect(x*s,(SIDEY+1.9)*s,s*1.4,Math.max(1,s/5));
 for(const[t,x,y]of P.objs){const d=CATALOG[t];if(!d)continue;const cx=(x+d.w/2)*s,cy=(y+d.h/2)*s;
  if(d.tree){g.fillStyle='#3f7a3a';g.beginPath();g.arc(cx,cy-s*.4,s*1.25,0,7);g.fill();g.fillStyle='#57994a';g.beginPath();g.arc(cx-s*.3,cy-s*.7,s*.6,0,7);g.fill();}
  else if(d.bush){g.fillStyle='#4c8a43';g.beginPath();g.arc(cx,cy,s*.45,0,7);g.fill();}else if(t==='flowers'){g.fillStyle='#e77fa6';g.fillRect(x*s+s*.2,y*s+s*.3,s*.6,s*.4);}
  else if(d.plot){g.fillStyle='#6b4a33';g.fillRect(x*s+1,y*s+1,s-2,s-2);g.fillStyle='#7ccf5a';g.fillRect(x*s+s*.35,y*s+s*.35,s*.3,s*.3);}
  else if(t==='mailbox'){g.fillStyle='#3d6fb3';g.fillRect(x*s+s*.3,y*s+s*.2,s*.4,s*.5);}else if(t==='streetlamp'||t==='lantern'){g.fillStyle='#f3cf63';g.beginPath();g.arc(cx,cy,s*.25,0,7);g.fill();}
  else if(!d.wall){g.fillStyle=d.rug?'rgba(180,90,70,.55)':({beds:'#f3e3c4',bath:'#e4f4fa',kitchen:'#eee7dc',seating:'#d9654b',electronics:'#3a3f4a',surfaces:'#7a4f33'})[d.c]||'#8a5f45';g.fillRect(x*s+.5,y*s+.5,d.w*s-1,d.h*s-1);g.strokeStyle='rgba(51,35,46,.55)';g.lineWidth=1;g.strokeRect(x*s+.5,y*s+.5,d.w*s-1,d.h*s-1);}}
 return c;}

// ---------- outings: trips to places in town (reuse the off-lot system) ----------
function outingSpec(dest){if(dest&&dest.startsWith('nb:'))return{l:'Visit',dur:120,fx:{social:30,fun:10,hunger:4},visit:+dest.slice(3),mood:'visited',wish:'visit'};const k=POI_KINDS[dest];return k&&k.out||null;}
function destName(dest){if(!dest)return'town';if(dest.startsWith('nb:')){const n=NEIGHBORS[+dest.slice(3)];return n?`the ${n.last} home`:'a friend\'s home';}const p=TOWN&&TOWN.pois.find(p=>p.id===dest);return p?p.name:'town';}
function neighborSim(i){const n=NEIGHBORS[i];return n?G.people.find(p=>p.role==='neighbor'&&p.first===n.first&&p.last===n.last):null;}
function outingBlock(s,dest){const O=outingSpec(dest);if(!O)return'Nothing to do here yet';if(!s)return'Select someone first';if(s.role!=='household')return'Select someone in your household';
 if(s.away)return s.away.kind==='work'?`${s.first} is at work`:`${s.first} is out`;if(!s.onLot)return`${s.first} is not home`;if(s.act&&s.act.sleeping)return`${s.first} is asleep`;
 const h=hourOf(G.time);if(h<6||h>=22)return'Everything is closed for the night';if(O.cost&&G.money<O.cost)return`Costs ${money(O.cost)}`;
 if(O.needEvent){const e=eventNow(dest);if(!e){const ev=TOWN_EVENTS.find(x=>x.id===O.needEvent);return`Open ${DAYS[ev.day]}s, ${hr12(ev.from)} to ${hr12(ev.to)}`;}}
 if(s.job){const sh=shiftOf(s),wd=wday(G.time);if(CAREERS[s.job.career].days.includes(wd)&&h<sh.start&&h+O.dur/60>sh.start-.6)return`${s.first} has work at ${hr12(sh.start)}`;}
 if(O.visit!=null){const n=neighborSim(O.visit);if(!n)return'Nobody is home';if(n.onLot)return`${n.first} is visiting you right now`;if(h<8||h>=21)return'Too late to drop by';}
 return null;}
function goOut(s,dest){const O=outingSpec(dest),why=outingBlock(s,dest);if(why){toast(why,'frown');return false;}
 enqueue(s,A('out',`Go to ${destName(dest)}`,O.visit!=null?'people':(POI_KINDS[dest]||{}).icon||'walk',[{k:'walk',x:CURB.x,y:SIDEY},{k:'fn',fn:(s)=>{if(O.cost)pay(O.cost,s);}},{k:'leave',kind:'out',dur:O.dur,dest}]));
 toast(`${s.first} is heading to ${destName(dest)}`,'walk');return true;}
function outingTick(s,dm){const a=s.away,O=outingSpec(a.dest);decayNeeds(s,dm);if(!O){if(G.time>=a.until)returnToLot(s,CURB.x,SIDEY);return;}
 const k=dm/O.dur,ev=eventNow(a.dest);for(const n in O.fx)s.needs[n]=clamp(s.needs[n]+O.fx[n]*k*(ev&&n==='social'?1.4:1),0,100);
 if(O.xp)for(const sk in O.xp)gainXP(s,sk,O.xp[sk]*k);if(ev&&ev.bonus.xp)for(const sk in ev.bonus.xp)gainXP(s,sk,ev.bonus.xp[sk]*k);
 if(G.time>=a.until)finishOuting(s);}
function finishOuting(s){const dest=s.away.dest,O=outingSpec(dest)||{},ev=eventNow(dest),notes=[];returnToLot(s,pick([CURB.x,1,MW-2]),SIDEY);
 if(O.fish){const n=Math.max(1,Math.round((1+Math.random()*2.2)*(ev&&ev.bonus.fishX||1))),got=[];let rare=false;
  for(let i=0;i<n;i++){const tot=Object.values(FISH).reduce((a,f)=>a+f.w,0);let r=Math.random()*tot,key='sunfish';for(const[k2,f]of Object.entries(FISH)){r-=f.w;if(r<=0){key=k2;break;}}G.fish[key]=(G.fish[key]||0)+1;got.push(FISH[key].l);if(key==='carp')rare=true;}
  notes.push(`caught ${n} fish (${[...new Set(got)].join(', ')})`);if(rare){addMood(s,'bigCatch');sfx('promo');}}
 if(O.meet){const m=(O.meet||0)+(ev&&ev.bonus.meet||0),pool=G.people.filter(p=>p.role==='neighbor'&&!p.onLot).sort(()=>Math.random()-.5).slice(0,m);
  for(const p of pool){const r=rel(s,p),was=r.met;r.met=true;r.f=clamp(r.f+ri(8,14),-100,100);r.last=G.time;if(!was){wishEvent(s,'meet');notes.push(`met ${p.first} ${p.last}`);}else notes.push(`caught up with ${p.first}`);}}
 if(O.visit!=null){const p=neighborSim(O.visit);if(p){const r=rel(s,p),was=r.met;r.met=true;r.f=clamp(r.f+ri(10,16),-100,100);r.last=G.time;p.needs&&(p.needs.social=100);notes.push(was?`had a lovely time with ${p.first}`:`met ${p.first} ${p.last}`);if(!was)wishEvent(s,'meet');}}
 if(O.sell){const val=sellGoods(O.sell);if(val)notes.push(`sold goods for ${money(val)}`);else notes.push('browsed the stalls');addMood(s,'marketDay');}
 if(O.mood&&!O.sell)addMood(s,O.mood);if(ev&&ev.bonus.mood)addMood(s,ev.bonus.mood);
 if(O.wish)wishEvent(s,O.wish);wishEvent(s,'outing');if(ev)wishEvent(s,'event');
 toast(`${s.first} is back from ${destName(dest)}${notes.length?' and '+notes.join(', '):''}.`,O.fish?'fish':'home');UI.dirty=true;}
function goodsValue(mult){mult=mult||1;let v=0;for(const[k,n]of Object.entries(G.produce))v+=n*(CROPS[k]?CROPS[k].sell:0);for(const[k,n]of Object.entries(G.fish||{}))v+=n*(FISH[k]?FISH[k].sell:0);return Math.round(v*mult);}
function goodsCount(){return Object.values(G.produce).reduce((a,b)=>a+b,0)+Object.values(G.fish||{}).reduce((a,b)=>a+b,0);}
function sellGoods(mult){const v=goodsValue(mult);if(!v)return 0;G.produce={};G.fish={};earn(v);return v;}
// value of the current home when moving out: the lot plus furniture at resale value
function homeValue(){const l=homeLot();let base=l?Math.round(lotPrice(l,false)*.85):3000;if(l&&l.kind==='empty'){let w=0;for(let i=0;i<N_TILES;i++)if(W.wt[i])w++;base+=Math.round(w*BUILD_COST.wall*.7);}return base+G.objects.reduce((a,o)=>a+(o.def.fixed||o.def.tree||o.def.bush||o.def.plot||o.type==='flowers'?0:Math.round((o.price||o.def.p||0)*.5)),0);}
function hrsTxt(min){const h=Math.round(min/60*10)/10;return h===1?'an hour':`${h} hours`;}
function setupMode(){return W.rooms.length?'buy':'build';}
function hasFurnChoice(l){return l.kind==='starter'||l.kind==='hart';}
function lotNeedsSetup(l,furn){return l.kind==='empty'||(hasFurnChoice(l)&&!(furn==null?l.furn!==false:furn));}
function moveHousehold(l,furn){const old=homeLot(),gain=homeValue();G.money+=gain-lotPrice(l,furn);if(hasFurnChoice(l)&&furn!=null)l.furn=furn;
 if(old){G.town.sold=G.town.sold||[];if(!G.town.sold.includes(old.id))G.town.sold.push(old.id);}
 for(const p of G.people){if(p.role!=='household'){if(p.onLot){p.onLot=false;p.visit=null;p.act=null;p.queue.length=0;p.path=null;p.inObj=null;}continue;}
  if(p.onLot){clearQueue(p,true);p.act=null;p.inObj=null;p.path=null;}}
 G.objects=[];G.items=[];G.cars=[];G.party=null;G.timers=G.timers.filter(t=>t.type!=='visit'&&t.type!=='pizza'&&t.type!=='party'&&t.type!=='partyEnd');
 loadTownLot(l,furn);refreshWorld();G.home=l.id;G.fresh=lotNeedsSetup(l,furn);G.lot=G.fresh?(l.kind==='empty'?'empty':'shell'):'cottage';applyTownOverrides();
 let i=0;for(const p of household())if(p.onLot&&!p.away){const[x,y]=nearestFree(12+(i%3)*2,16+((i/3)|0));p.place(x,y);i++;}
 roomDecorAll();W.groundDirty=true;UI.dirty=true;centerHome();autosave(true);}
// lots the player bought and sold are lived in by new families afterwards
function applyTownOverrides(){if(!TOWN||!G.town)return;for(const id of G.town.sold||[]){const l=townLot(id);if(l&&id!==G.home&&l.kind!=='private'){l.kind='private';if(l.tpl==null)l.tpl=(l.seed>>>5)%HOUSE_TPL.length;l.furn=true;delete TOWN.plans[id+':f'];delete TOWN.plans[id+':u'];}}}

const TV={on:false,mode:'browse',cv:null,g:null,W:0,H:0,dpr:1,cam:{x:0,y:0,z:1},anim:null,dirty:true,sel:null,ptrs:new Map(),pinch:null,down:null,defs:null,prev:'live',seed:0,t:0,
 init(){const c=document.createElement('canvas');c.id='town';c.className='hidden';c.setAttribute('aria-label','Town map');document.body.insertBefore(c,$('#ui'));this.cv=c;this.g=c.getContext('2d');
  const ui=$('#ui'),mk=(id,cls,tag)=>{const e=document.createElement(tag||'div');e.id=id;e.className=cls;ui.appendChild(e);return e;};
  this.bar=mk('tbar','pill hidden','button');this.card=mk('tcard','card hidden');
  this.bar.onclick=()=>{AU.init();sfx('click');if(this.mode==='pick')this.cancelPick();else this.close();};
  c.addEventListener('pointerdown',e=>this.pdown(e));c.addEventListener('pointermove',e=>this.pmove(e));
  const up=e=>this.pup(e);c.addEventListener('pointerup',up);c.addEventListener('pointercancel',up);
  c.addEventListener('wheel',e=>{e.preventDefault();const f=Math.exp(-clamp(e.deltaY*(e.deltaMode===1?33:1),-240,240)*(e.ctrlKey?.012:.0024));this.zoomAt(this.cam.z*f,e.clientX*this.dpr,e.clientY*this.dpr);},{passive:false});
  c.addEventListener('contextmenu',e=>e.preventDefault());window.addEventListener('resize',()=>{if(this.on)this.size();});},
 size(){this.dpr=Math.min(window.devicePixelRatio||1,2.5);this.W=Math.round(innerWidth*this.dpr);this.H=Math.round(innerHeight*this.dpr);this.cv.width=this.W;this.cv.height=this.H;this.dirty=true;this.clampCam();},
 // the free area is the part of the screen between the top buttons and the bottom card
 freeArea(){const top=innerHeight<560?56:112,cr=this.card&&!this.card.classList.contains('hidden')?this.card.getBoundingClientRect():null,side=cr&&cr.width<innerWidth*.7&&innerHeight<560;
  return{top,bot:cr&&!side?Math.max(top+80,cr.top-8):innerHeight-8,left:0,right:side?Math.max(160,cr.left-8):innerWidth};},
 fitZ(){const f=this.freeArea();return Math.min(this.W/TOWN.W,(f.bot-f.top)*this.dpr/TOWN.H);},zMin(){return this.fitZ()*.9;},zMax(){return 9*this.dpr;},
 focusY(y,z){const f=this.freeArea();return y-((f.top+f.bot)/2*this.dpr-this.H/2)/z;},focusX(x,z){const f=this.freeArea();return x-((f.left+f.right)/2*this.dpr-this.W/2)/z;},
 clampCam(){if(!TOWN)return;const c=this.cam;c.z=clamp(c.z,this.zMin(),this.zMax());const hw=this.W/2/c.z,hh=this.H/2/c.z,f=this.freeArea(),pt=f.top*this.dpr/c.z,pb=(innerHeight-f.bot)*this.dpr/c.z,pr=(innerWidth-f.right)*this.dpr/c.z;
  const x0=hw,x1=TOWN.W-hw+pr;c.x=x0>x1?(x0+x1)/2:clamp(c.x,x0,x1);const y0=hh-pt,y1=TOWN.H-hh+pb;c.y=y0>y1?(y0+y1)/2:clamp(c.y,y0,y1);},
 // modes: 'pick' to choose a lot for a new household, 'browse' to look around once you live here
 open(mode,opts){opts=opts||{};this.mode=mode;this.defs=opts.defs||null;this.furn=true;
  if(mode==='pick'){if(this.pickSeed&&!opts.reroll){this.seed=this.pickSeed;TOWN=genTown(this.seed);}else{const was=TOWN&&TOWN.name;for(let k=0;k<6;k++){this.seed=opts.seed||((Math.random()*1e9)>>>0);TOWN=genTown(this.seed);if(opts.seed||TOWN.name!==was)break;}}this.pickSeed=this.seed;}else{ensureTown();applyTownOverrides();}
  this.on=true;this.prev=G.mode==='town'?this.prev:G.mode;G.mode='town';UI.ctxClose();TIP.hide();document.body.classList.add('town');this.cv.classList.remove('hidden');this.size();this.sel=null;
  this.bar.classList.remove('hidden');this.bar.innerHTML=mode==='pick'?`${SVG.chevL||''}<span>Back</span>`:`${ico('home',20)}<span>Back home</span>`;this.panel();
  const h=homeLot();if(mode==='browse'&&h){const cx=h.x+LW/2,cy=h.y+LH/2,z=Math.max(this.fitZ()*1.8,this.zMin());this.cam={x:cx,y:cy,z:this.zMax()*.7};this.clampCam();this.flyTo(this.focusX(cx,z),this.focusY(cy,z),z,.9);}
  else{const z=this.fitZ();this.cam={x:TOWN.W/2,y:this.focusY(TOWN.H/2,z),z};this.clampCam();}
  this.dirty=true;AU.init();},
 hideTown(){this.on=false;document.body.classList.remove('town');this.cv.classList.add('hidden');this.bar.classList.add('hidden');this.card.classList.add('hidden');this.sel=null;},
 close(){if(!this.on)return;this.hideTown();const m=this.prev&&this.prev!=='town'?this.prev:'live';G.mode='town';UI.setMode(G.fresh&&m==='live'?setupMode():m);if(G.mode==='town'){G.mode='build';UI.setMode('live');}UI.dirty=true;UI.layout();},
 cancelPick(){this.close();TOWN=null;ensureTown();applyTownOverrides();if(UI.casSt){$('#cas').classList.remove('hidden');UI.renderCas();}},
 showPoi(kind){if(!this.on){if(G.mode!=='live'||UI.welcomeOn)return;this.open('browse');}const p=TOWN.pois.find(q=>q.kind===kind);if(p)this.focusPoi(p,.8);},
 focusPoi(p,dur){this.select({t:'poi',p});const z=Math.max(this.cam.z,(['lake','park'].includes(p.kind)?1.6:2)*this.dpr);this.flyTo(this.focusX(p.bx,z),this.focusY(p.by,z),z,dur);},
 reroll(){this.open('pick',{defs:this.defs,reroll:1});toast(`Welcome to ${TOWN.name}`,'map');},
 flyTo(x,y,z,dur){const c=this.cam;this.anim={a:{x:c.x,y:c.y,z:c.z},b:{x,y,z:clamp(z,this.zMin(),this.zMax())},t:0,d:dur||.6};},
 zoomAt(z,sx,sy){const c=this.cam;sx=sx==null?this.W/2:sx;sy=sy==null?this.H/2:sy;const wx=c.x+(sx-this.W/2)/c.z,wy=c.y+(sy-this.H/2)/c.z;c.z=clamp(z,this.zMin(),this.zMax());c.x=wx-(sx-this.W/2)/c.z;c.y=wy-(sy-this.H/2)/c.z;this.anim=null;this.clampCam();this.dirty=true;},
 zoomStep(d){this.flyTo(this.cam.x,this.cam.y,this.cam.z*Math.pow(1.45,d),.25);},
 s2w(sx,sy){const c=this.cam;return{x:c.x+(sx*this.dpr-this.W/2)/c.z,y:c.y+(sy*this.dpr-this.H/2)/c.z};},
 w2s(x,y){const c=this.cam;return[(x-c.x)*c.z+this.W/2,(y-c.y)*c.z+this.H/2];},
 pdown(e){try{this.cv.setPointerCapture(e.pointerId);}catch(_){}AU.init();this.ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});this.anim=null;
  if(this.ptrs.size===1){this.down={x:e.clientX,y:e.clientY,t:performance.now(),cx:this.cam.x,cy:this.cam.y,moved:false};}
  else if(this.ptrs.size===2){const[a,b]=[...this.ptrs.values()];this.pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,z:this.cam.z,mx:(a.x+b.x)/2,my:(a.y+b.y)/2};if(this.down)this.down.moved=true;}},
 pmove(e){if(!this.ptrs.has(e.pointerId))return;this.ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(this.pinch&&this.ptrs.size>=2){const[a,b]=[...this.ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
   this.cam.x-=(mx-this.pinch.mx)*this.dpr/this.cam.z;this.cam.y-=(my-this.pinch.my)*this.dpr/this.cam.z;this.pinch.mx=mx;this.pinch.my=my;this.zoomAt(this.pinch.z*d/this.pinch.d,mx*this.dpr,my*this.dpr);return;}
  const d=this.down;if(!d||this.ptrs.size!==1)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;if(!d.moved&&Math.hypot(dx,dy)>8)d.moved=true;
  if(d.moved){this.cam.x=d.cx-dx*this.dpr/this.cam.z;this.cam.y=d.cy-dy*this.dpr/this.cam.z;this.clampCam();this.dirty=true;}},
 pup(e){if(!this.ptrs.has(e.pointerId))return;this.ptrs.delete(e.pointerId);if(this.ptrs.size<2)this.pinch=null;
  if(this.ptrs.size===0){const d=this.down;this.down=null;if(d&&!d.moved&&performance.now()-d.t<600&&e.type==='pointerup')this.tap(e.clientX,e.clientY);}
  else{const p=[...this.ptrs.values()][0];this.down={x:p.x,y:p.y,t:0,cx:this.cam.x,cy:this.cam.y,moved:true};}},
 // ---------- picking things on the map ----------
 tap(cx,cy){const w=this.s2w(cx,cy),z=this.cam.z/this.dpr;
  if(this.cluster&&TOWN.down){const b=TOWN.down,[sx,sy]=this.w2s((b.x0+b.x1)/2,(b.y0+b.y1)/2);if(Math.hypot(sx/this.dpr-cx,sy/this.dpr-cy)<26){this.flyTo((b.x0+b.x1)/2,(b.y0+b.y1)/2,2.4*this.dpr,.5);sfx('pop');return;}}
  for(const p of TOWN.pois){if(this.cluster&&!['lake','park'].includes(p.kind))continue;const[sx,sy]=this.w2s(p.bx,p.by);if(Math.hypot(sx/this.dpr-cx,sy/this.dpr-cy)<24){this.select({t:'poi',p});return;}}
  for(const l of TOWN.lots)if(w.x>=l.x&&w.x<l.x+l.w&&w.y>=l.y&&w.y<l.y+l.h){this.select({t:'lot',l});return;}
  for(const p of TOWN.pois){if(p.kind==='lake'){if(inPoly(w.x,w.y,TOWN.lake.pts,3)){this.select({t:'poi',p});return;}continue;}if(w.x>=p.x&&w.x<p.x+p.w&&w.y>=p.y&&w.y<p.y+p.h){this.select({t:'poi',p});return;}}
  this.select(null);},
 select(o){this.sel=o;this.dirty=true;sfx(o?'pop':'click');this.panel();
  if(o){const r=o.t==='lot'?o.l:o.p,cx=o.t==='poi'?o.p.bx:r.x+r.w/2,cy=o.t==='poi'?o.p.by:r.y+r.h/2,[sx,sy]=this.w2s(cx,cy),f=this.freeArea(),x=sx/this.dpr,y=sy/this.dpr;if(y>f.bot-30||y<f.top+20||x<f.left+24||x>f.right-24)this.flyTo(this.focusX(cx,this.cam.z),this.focusY(cy,this.cam.z),this.cam.z,.4);}},
 isSale(l){return l.kind==='empty'||l.kind==='starter'||(l.kind==='hart'&&!(G.started&&household().length&&G.home===l.id&&this.mode!=='pick')&&!(this.mode==='browse'&&G.home===l.id));},
 isHome(l){return this.mode==='browse'&&G.home===l.id;},
 saleCat(l){return l.kind==='empty'?'empty':'starter';},
 saleList(l,cat){cat=cat||this.saleCat(l);return TOWN.lots.filter(x=>this.lotKind(x)==='sale'&&this.saleCat(x)===cat).sort((a,b)=>(a.priceU||a.price)-(b.priceU||b.price)||a.x-b.x||a.y-b.y);},
 showLot(l){this.select({t:'lot',l});const z=Math.max(this.cam.z,2.3*this.dpr);this.flyTo(this.focusX(l.x+LW/2,z),this.focusY(l.y+LH/2,z),z,.55);},
 lotKind(l){if(this.isHome(l))return'home';if(l.kind==='hart'&&this.mode==='browse'&&G.home!==l.id)return'sale';return l.kind==='neighbor'?'neighbor':l.kind==='private'?'private':'sale';},
 // ---------- the panel at the bottom ----------
 panel(){const el=this.card,o=this.sel,s=selSim();let h='';
  if(!o){const ev=nextEvents(3),pick=this.mode==='pick',em=pick?this.saleList(null,'empty'):[],sh=pick?this.saleList(null,'starter'):[],lo=a=>a.length?money(Math.min(...a.map(x=>x.priceU||x.price))):'';
   h=`<div class="tt"><b>${esc(TOWN.name)}</b><span class="small">${pick?`${esc(this.defs?this.defs[0].last:'New')} household · ${money(START_FUNDS)} to spend`:'Your town'}</span></div>
    <p class="small tp">${esc(say(pick?'Where will you live? Pick one to browse, or tap a dot on the map.':'Tap a place to visit it, a neighbor\'s home to drop by, or a For Sale sign to move.'))}</p>
    ${pick?`<div class="cats"><button class="catb" data-cat="empty"><i class="dot w"></i><span><b>Empty lot</b><span class="small">No house. Build your own. ${em.length} from ${lo(em)}</span></span></button><button class="catb" data-cat="starter"><i class="dot o"></i><span><b>Starter home</b><span class="small">Furnished or unfurnished. ${sh.length} from ${lo(sh)}</span></span></button></div>`:''}
    <div class="tev">${ev.map(x=>`<button class="chip" data-ev="${x.e.poi}">${x.live?'<i class="live"></i>':''}${esc(x.today?'Today':DAYS[wday(x.day*1440)])} ${hr12(x.e.from)} · ${esc(x.e.l)}</button>`).join('')}</div>
    ${this.mode==='pick'?'<div class="actions" style="margin-top:8px"><button class="btn sm" data-x="reroll">Show me a different town</button></div>':''}`;}
  else if(o.t==='lot'){const l=o.l,k=this.lotKind(l);
   if(k==='sale'){const st=hasFurnChoice(l),fu=st?this.furn!==false:undefined,price=lotPrice(l,fu),after=(this.mode==='pick'?START_FUNDS:G.money+homeValue())-price,ok=after>=0,list=this.saleList(l),ix=list.indexOf(l);
    h=`<div class="tt"><b>${esc(lotTitle(l))}</b><span class="small">${esc(lotName(l))}</span></div>
     ${st?`<div class="fseg" role="radiogroup" aria-label="Furniture"><button data-furn="1" class="${fu?'on':''}" role="radio" aria-checked="${fu}"><span>Furnished</span><b>${money(lotPrice(l,true))}</b></button><button data-furn="0" class="${fu?'':'on'}" role="radio" aria-checked="${!fu}"><span>Unfurnished</span><b>${money(lotPrice(l,false))}</b></button></div>`:''}
     <div class="lotrow"><canvas width="224" height="192" id="tprev"></canvas><div class="grow">
     <div class="small">${l.kind==='empty'?'No house yet. You build your own home from scratch.':fu?'Move right in. Beds, kitchen and bathroom are all set up.':'Walls, floors, doors and windows are done. You pick the furniture.'}</div>
     <div class="feat">${lotFeatures(l).map(f=>`<span class="chip">${esc(f)}</span>`).join('')}</div><div class="lp">${money(price)}</div><div class="small">${ok?`You will have ${money(after)} left${this.mode==='browse'?`, after selling your home for ${money(homeValue())}`:''}.`:'Not enough money yet.'}</div></div></div>
     <div class="actions">${list.length>1?`<span class="lnav"><button class="btn sm" data-nav="-1" aria-label="Previous ${l.kind==='empty'?'lot':'home'}">‹</button><span class="small">${ix+1} of ${list.length}</span><button class="btn sm" data-nav="1" aria-label="Next ${l.kind==='empty'?'lot':'home'}">›</button></span>`:''}<button class="btn" data-x="close">Close</button><button class="btn primary" data-x="buy" ${ok?'':'disabled'}>Move here</button></div>`;}
   else if(k==='home')h=`<div class="tt"><b>Home</b><span class="small">${esc(lotName(l))}</span></div><p class="small tp">The ${esc(household()[0]?household()[0].last:'')} household lives here.</p><div class="actions"><button class="btn" data-x="close">Close</button><button class="btn primary" data-x="home">Go home</button></div>`;
   else if(k==='neighbor'){const n=NEIGHBORS[l.owner],p=neighborSim(l.owner),r=s&&p?relPeek(s,p):null,dest='nb:'+l.owner,why=this.mode==='browse'?outingBlock(s,dest):'Move in first';
    h=`<div class="tt"><b>The ${esc(n.last)} home</b><span class="small">${esc(lotName(l))}</span></div><div class="lotrow">${p?`<img class="ico pp" src="${pcanvas(p).toDataURL()}" width="44" height="44" alt="">`:''}<div class="grow"><span class="lbl">${esc(n.first)} ${esc(n.last)}</span><div class="small">${r&&r.met?esc(relLabel(r)):'Not met yet'}${p&&p.traits?' · '+p.traits.map(t=>TRAITS[t].l).join(', '):''}</div></div></div>
     ${why&&this.mode==='browse'?`<p class="small tp">${esc(why)}</p>`:s&&this.mode==='browse'?`<p class="small tp">${esc(s.first)} will drop by for about 2 hours.</p>`:''}<div class="actions"><button class="btn" data-x="close">Close</button><button class="btn primary" data-x="go" data-d="${dest}" ${why?'disabled':''}>Visit ${esc(n.first)}</button></div>`;}
   else h=`<div class="tt"><b>A neighbor's home</b><span class="small">${esc(lotName(l))}</span></div><p class="small tp">Another family lives here. Not for sale.</p><div class="actions"><button class="btn" data-x="close">Close</button></div>`;}
  else if(o.t==='poi'){const p=o.p,K=POI_KINDS[p.kind],O=K.out,evs=TOWN_EVENTS.filter(e=>e.poi===p.kind),now=eventNow(p.kind),why=O&&this.mode==='browse'?outingBlock(s,p.id):null,who=s?s.first:'';
   h=`<div class="tt">${ico(K.icon,22)}<b>${esc(p.name)}</b>${!O&&p.kind!=='townhall'?'<span class="chip">Coming soon</span>':''}</div><p class="small tp">${esc(K.d)}${!O&&p.kind!=='townhall'?' Visits open up in a future update.':''}</p>
    ${evs.map(e=>`<div class="evrow ${now===e?'on':''}">${ico('star',18)}<span><b>${esc(e.l)}</b> · ${DAYS[e.day]} ${hr12(e.from)} to ${hr12(e.to)}${now===e?' · happening now':''}<br><span class="small">${esc(e.d)}</span></span></div>`).join('')}
    ${p.kind==='townhall'?`<div class="evrow">${ico('star',18)}<span>${nextEvents(4).map(x=>`${x.today?'Today':DAYS[wday(x.day*1440)]}: ${esc(x.e.l)}`).join('<br>')}</span></div>`:''}
    ${p.kind==='market'&&goodsCount()?`<p class="small tp">You have ${goodsCount()} items to sell, worth about ${money(goodsValue(O.sell))} here.</p>`:''}
    ${O?`<p class="small tp">${this.mode==='pick'?'Move in first to visit.':why?esc(why):`${esc(who)} will go for about ${hrsTxt(O.dur)}${O.cost?` and it costs ${money(O.cost)}`:''}.`}</p>`:''}
    <div class="actions"><button class="btn" data-x="close">Close</button>${O?`<button class="btn primary" data-x="go" data-d="${p.id}" ${why||this.mode==='pick'?'disabled':''}>${esc(O.l)}</button>`:''}</div>`;}
  el.innerHTML=h;el.classList.remove('hidden');
  const pv=$('#tprev');if(pv&&o&&o.t==='lot'){const l=o.l,P=lotPlanFor(l,hasFurnChoice(l)?this.furn!==false:undefined),src=planPreview(P,10),g2=pv.getContext('2d');
   // zoom the little preview in on the house so the furniture (or the lack of it) is easy to see
   let x0=MW,y0=LOTH,x1=-1,y1=-1;for(let y=0;y<LOTH;y++)for(let x=0;x<MW;x++)if(P.wt[I(x,y)]){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
   let sx=0,sy=0,sw=MW,sh=MH;if(x1>=0){sw=Math.min(MW,Math.max(x1-x0+5,(y1-y0+5)*7/6));sh=sw*6/7;sx=clamp((x0+x1+1)/2-sw/2,0,MW-sw);sy=clamp((y0+y1+1)/2-sh/2,0,MH-sh);}
   g2.imageSmoothingEnabled=false;g2.clearRect(0,0,pv.width,pv.height);g2.drawImage(src,sx*10,sy*10,sw*10,sh*10,0,0,pv.width,pv.height);}
  el.onclick=e=>{const b=e.target.closest('button');if(!b||b.disabled)return;AU.init();sfx('click');const x=b.dataset.x;
   if(b.dataset.ev){const p=TOWN.pois.find(q=>q.kind===b.dataset.ev);if(p)this.focusPoi(p,.6);return;}
   if(b.dataset.cat){const L=this.saleList(null,b.dataset.cat);if(L.length)this.showLot(L[0]);return;}
   if(b.dataset.nav){const L=this.saleList(this.sel.l);if(L.length)this.showLot(L[(L.indexOf(this.sel.l)+ +b.dataset.nav+L.length)%L.length]);return;}
   if(b.dataset.furn){this.furn=b.dataset.furn==='1';this.panel();return;}
   if(x==='close')this.select(null);if(x==='reroll')this.reroll();if(x==='home')this.close();
   if(x==='go'){const s2=selSim();if(goOut(s2,b.dataset.d))this.close();}
   if(x==='buy')this.buy(this.sel.l);};},
 buy(l){const st=hasFurnChoice(l),furn=st?this.furn!==false:undefined,price=lotPrice(l,furn);
  if(this.mode==='pick'){const defs=this.defs;G.town={seed:this.seed};this.pickSeed=null;this.hideTown();startHousehold(defs,START_FUNDS-price,8*60,{married:false,townLot:l.id,furn});
   G.mode='town';UI.setMode(G.fresh?setupMode():'live');UI.casSt=null;$('#cas').classList.add('hidden');UI.hideWelcome();centerHome();sfx('promo');toast(`The ${defs[0].last} household bought ${lotName(l)}`,'home');
   TUT.start(G.fresh?(G.tut&&G.tut.done&&G.tut.done.fresh?'movein':'fresh'):'settled',true);autosave(true);return;}
  const gain=homeValue();UI.confirm('Move to a new home?',`You will sell your home for ${money(gain)} and buy ${esc(lotName(l))}${st?(furn?', furnished,':', unfurnished,'):''} for ${money(price)}, leaving ${money(G.money+gain-price)}. Your household keeps its friends, jobs and skills.`,'Move',()=>{this.close();moveHousehold(l,furn);
   if(G.fresh){UI.setMode(setupMode());TUT.start('movein',true);}toast(`Welcome to ${lotName(l)}!`,'home');sfx('promo');});},
 // ---------- drawing ----------
 render(dt){this.t+=dt;if(this.anim){const A2=this.anim;A2.t+=dt;const k=Math.min(1,A2.t/A2.d),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
   this.cam.x=lerp(A2.a.x,A2.b.x,e);this.cam.y=lerp(A2.a.y,A2.b.y,e);this.cam.z=A2.a.z*Math.pow(A2.b.z/A2.a.z,e);this.clampCam();if(k>=1)this.anim=null;this.dirty=true;}
  if(!this.dirty&&Math.floor(this.t*2)===this._tk)return;this._tk=Math.floor(this.t*2);this.dirty=false;this.draw();},
 draw(){const g=this.g,c=this.cam,Z=c.z,dpr=this.dpr,T2=TOWN,zc=Z/dpr;g.setTransform(1,0,0,1,0,0);g.fillStyle='#6a9a4f';g.fillRect(0,0,this.W,this.H);
  g.setTransform(Z,0,0,Z,this.W/2-c.x*Z,this.H/2-c.y*Z);const vx0=c.x-this.W/2/Z-30,vx1=c.x+this.W/2/Z+30,vy0=c.y-this.H/2/Z-30,vy1=c.y+this.H/2/Z+30,vis=(x,y,w,h)=>x<vx1&&x+w>vx0&&y<vy1&&y+h>vy0;
  g.fillStyle='#87b866';g.fillRect(T2.vx[0]-8,T2.hy[0]-8,T2.vx[T2.vx.length-1]+ST+16-T2.vx[0],T2.hy[T2.hy.length-1]+ST+16-T2.hy[0]);
  this.drawLake(g,zc);
  // roads: sidewalks, asphalt, lane dashes
  g.fillStyle='#d8dad3';for(const r of T2.roads)if(vis(r.x,r.y,r.w,r.h))g.fillRect(r.x,r.y,r.w,r.h);
  g.fillStyle='#696e75';for(const r of T2.roads)if(vis(r.x,r.y,r.w,r.h)){if(r.hz)g.fillRect(r.x,r.y+.9,r.w,2.2);else g.fillRect(r.x+.9,r.y,2.2,r.h);}
  if(zc>1.2){g.fillStyle='rgba(250,246,230,.85)';for(const r of T2.roads)if(vis(r.x,r.y,r.w,r.h)){if(r.hz)for(let x=r.x+5;x<r.x+r.w-5;x+=6)g.fillRect(x,r.y+1.92,2.6,.16);else for(let y=r.y+5;y<r.y+r.h-5;y+=6)g.fillRect(r.x+1.92,y,.16,2.6);}}
  for(const l of T2.lots)if(vis(l.x,l.y,l.w,l.h))this.drawLot(g,l,zc);
  this.drawPark(g,zc);for(const p of T2.pois)if(p.kind!=='lake'&&p.kind!=='park'&&vis(p.x,p.y,p.w,p.h))this.drawShop(g,p,zc);
  for(const t of T2.trees)if(t[0]>vx0&&t[0]<vx1&&t[1]>vy0&&t[1]<vy1)this.tree(g,t[0],t[1],2.6*t[2],t[3]);
  // highlight the selection
  const o=this.sel;if(o){g.lineWidth=3/zc;g.strokeStyle='#e8662e';const r=o.t==='lot'?o.l:o.p;if(o.t==='poi'&&o.p.kind==='lake'){g.beginPath();T2.lake.pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.stroke();}else{if(o.t==='lot'){g.lineWidth=4/zc;g.fillStyle='rgba(232,102,46,.14)';rr(g,r.x+.4,r.y+.4,r.w-.8,r.h-.8,1.5);g.fill();}rr(g,r.x+.4,r.y+.4,r.w-.8,r.h-.8,1.5);g.stroke();}}
  g.setTransform(1,0,0,1,0,0);this.drawLabels(g,zc,vis);},
 tree(g,x,y,r,k){g.fillStyle='rgba(30,50,25,.22)';g.beginPath();g.ellipse(x+r*.25,y+r*.35,r,r*.8,0,0,7);g.fill();g.fillStyle=k<.5?'#3f7d3c':'#4a8a40';g.beginPath();g.arc(x,y,r,0,7);g.fill();
  g.fillStyle=k<.5?'#56984a':'#63a552';g.beginPath();g.arc(x-r*.28,y-r*.3,r*.55,0,7);g.fill();},
 drawLake(g,zc){const L=TOWN.lake;if(!L)return;const P=L.pts,path=(s,dx,dy)=>{g.beginPath();P.forEach((p,i)=>{const x=L.cx+(p[0]-L.cx)*s+(dx||0),y=L.cy+(p[1]-L.cy)*s+(dy||0);i?g.lineTo(x,y):g.moveTo(x,y);});g.closePath();};
  g.fillStyle='#93c473';g.fillRect(L.x0,L.y0,L.x1-L.x0,L.y1-L.y0);
  path(1.07);g.fillStyle='#e6d6a6';g.fill();path(1);g.fillStyle='#4f9dd2';g.fill();path(.82);g.fillStyle='#62afe0';g.fill();path(.55);g.fillStyle='#71bbe8';g.fill();
  g.strokeStyle='rgba(255,255,255,.45)';g.lineWidth=.5;for(let i=0;i<14;i++){const a=i*2.4+this.t*.2,rx=(L.x1-L.x0)*.25,ry=(L.y1-L.y0)*.22,x=L.cx+Math.cos(a)*rx*(.3+(i%4)*.18),y=L.cy+Math.sin(a*1.3)*ry*(.3+(i%3)*.2);g.beginPath();g.moveTo(x-2,y);g.quadraticCurveTo(x,y-.8,x+2,y);g.stroke();}
  // walking path ring and the fishing dock
  path(1.2);g.strokeStyle='rgba(236,220,170,.9)';g.lineWidth=1.6;g.setLineDash([3,2]);g.stroke();g.setLineDash([]);
  const d=L.dock;g.save();g.translate(d.x,d.y);g.rotate(d.a);g.fillStyle='#a5784e';g.fillRect(-1.5,-1.6,10,3.2);g.fillStyle='#8a6340';for(let i=0;i<10;i+=1.6)g.fillRect(i-1.5,-1.6,.25,3.2);g.fillRect(7.5,-2.2,.9,.9);g.fillRect(7.5,1.3,.9,.9);g.restore();},
 drawPark(g,zc){const p=TOWN.park;if(!p)return;const cx=(p.x0+p.x1)/2,cy=(p.y0+p.y1)/2,w=p.x1-p.x0,h=p.y1-p.y0;
  g.fillStyle='#95cd74';g.fillRect(p.x0,p.y0,w,h);g.fillStyle='#eadaab';g.fillRect(p.x0,cy-1.2,w,2.4);g.fillRect(cx-1.2,p.y0,2.4,h);
  g.beginPath();g.ellipse(cx,cy,w*.32,h*.32,0,0,7);g.strokeStyle='#eadaab';g.lineWidth=2.2;g.stroke();
  g.fillStyle='#d8d0bd';g.beginPath();g.arc(cx,cy,5,0,7);g.fill();g.fillStyle='#8fd0ee';g.beginPath();g.arc(cx,cy,3.8,0,7);g.fill();g.fillStyle='#c5ecfb';g.beginPath();g.arc(cx,cy,1.4,0,7);g.fill();
  // gazebo, playground, picnic tables
  const gx=p.x0+w*.2,gy=p.y0+h*.25;g.fillStyle='rgba(0,0,0,.18)';g.beginPath();g.arc(gx+.6,gy+.7,4.4,0,7);g.fill();g.fillStyle='#c98a5a';g.beginPath();for(let i=0;i<8;i++){const a=i/8*Math.PI*2+Math.PI/8;g.lineTo(gx+Math.cos(a)*4.4,gy+Math.sin(a)*4.4);}g.closePath();g.fill();g.fillStyle='#a86d43';g.beginPath();g.arc(gx,gy,1.2,0,7);g.fill();
  const px=p.x1-w*.24,py=p.y1-h*.26;g.fillStyle='#e9d9b0';g.fillRect(px-5,py-4,10,8);g.fillStyle='#e0463c';g.fillRect(px-4,py-3,3,2.4);g.fillStyle='#f6d04a';g.fillRect(px+1,py-3,3,2.4);g.fillStyle='#4f86d6';g.fillRect(px-2,py+.6,4,2);
  g.fillStyle='#9a6b45';for(const[a,b]of[[.75,.22],[.82,.3],[.22,.75],[.3,.82]])g.fillRect(p.x0+w*a-1.5,p.y0+h*b-1,3,2);},
 drawShop(g,p,zc){const n=p.face==='n',x=p.x,y=p.y,front=n?y:y+LH,by=n?y+6:y+2,bh=12;
  g.fillStyle='#e4dac6';g.fillRect(x,y,LW,LH);
  if(p.kind==='market'){const cols=['#e0463c','#4f86d6','#f6d04a','#5fa64f','#e27aa6','#f08a2a'];for(let i=0;i<6;i++){const sx=x+3+(i%3)*8.5,sy=by+((i/3)|0)*6.5;g.fillStyle='rgba(0,0,0,.15)';g.fillRect(sx+.5,sy+.6,6,4.6);g.fillStyle=cols[i];g.fillRect(sx,sy,6,4.6);g.fillStyle='rgba(255,255,255,.7)';for(let k=0;k<6;k+=1.5)g.fillRect(sx+k,sy,.75,4.6);}return;}
  const col=POI_ROOF[p.kind]||'#a99',bx=x+2,bw=LW-4;g.fillStyle='rgba(0,0,0,.2)';g.fillRect(bx+.8,by+.9,bw,bh);g.fillStyle=col;rr(g,bx,by,bw,bh,.8);g.fill();
  g.fillStyle=shade(col,.12);g.fillRect(bx+1,by+1,bw-2,bh*.45);g.fillStyle=shade(col,-.18);g.fillRect(bx,n?by:by+bh-1,bw,1);
  g.fillStyle='rgba(255,255,255,.35)';g.fillRect(bx+3,by+3,3,2);g.fillRect(bx+bw-7,by+3,4,2.5);
  const aw=n?by-1.6:by+bh;for(let i=0;i<bw;i+=2){g.fillStyle=i%4?'#fffaf1':(p.kind==='cafe'?'#c0392b':p.kind==='bakery'?'#e8a23b':'#e8662e');g.fillRect(bx+i,aw,2,1.6);}
  if(p.kind==='townhall'){g.fillStyle='#7d8893';g.fillRect(x+LW/2-2.5,by+3,5,5);g.fillStyle='#fffaf1';g.beginPath();g.arc(x+LW/2,by+5.5,1.6,0,7);g.fill();}
  if(p.kind==='museum'){g.fillStyle='#efe6cf';for(let i=0;i<6;i++)g.fillRect(bx+3+i*3.6,n?by+.6:by+bh-2.4,1.2,1.8);}},
 drawLot(g,l,zc){const k=this.lotKind(l),flip=l.face==='n',X=x=>l.x+x,Y=y=>flip?l.y+LH-1-y:l.y+y,Yp=y=>flip?l.y+LH-y:l.y+y;
  g.fillStyle=LAWNS[l.seed%LAWNS.length];g.fillRect(l.x,l.y,l.w,l.h);if(zc>1.1){g.strokeStyle='rgba(60,100,45,.35)';g.lineWidth=.25;g.strokeRect(l.x+.15,l.y+.15,l.w-.3,l.h-.3);}
  if(k==='home'){this.drawHome(g,l,zc);return;}
  const P=lotPlanFor(l);if(!P._d){const paths=[];let x0=99,y0=99,x1=-1,y1=-1;for(let y=0;y<LOTH;y++)for(let x=0;x<MW;x++){const i=I(x,y);if(P.fl[i]==='path'||P.fl[i]==='dirt')paths.push([x,y,P.fl[i]==='path']);if(P.wt[i]){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}}P._d={paths,box:x1>=0?[x0,y0,x1,y1]:null};}
  for(const[x,y,pa]of P._d.paths){g.fillStyle=pa?'#e5d4a6':'#8e6a4b';g.fillRect(X(x),Y(y),1.02,1.02);}
  const bx=P._d.box;if(bx)this.roof(g,X(bx[0]),flip?Y(bx[3]):Y(bx[1]),bx[2]-bx[0]+1,bx[3]-bx[1]+1,ROOFS[(l.seed>>>3)%ROOFS.length],flip,zc);
  for(const[t,x,y]of P.objs){const d=CATALOG[t];if(!d)continue;if(d.tree)this.tree(g,X(x)+.5,Yp(y)+(flip?-.2:.2),2.3,(l.seed+x)%2?.3:.7);else if(d.bush){g.fillStyle='#4c8a43';g.beginPath();g.arc(X(x)+.5,Y(y)+.5,.7,0,7);g.fill();}
   else if(d.plot&&zc>.8){g.fillStyle='#6b4a33';g.fillRect(X(x)+.1,Y(y)+.1,.8,.8);g.fillStyle='#7ccf5a';g.fillRect(X(x)+.35,Y(y)+.35,.3,.3);}else if(t==='flowers'&&zc>1.4){g.fillStyle='#e77fa6';g.fillRect(X(x)+.2,Y(y)+.3,.6,.4);}}
  if(k==='sale'){const sx=l.x+LW/2+5,sy=flip?l.y+1.6:l.y+LH-2.6;g.fillStyle='#6b4423';g.fillRect(sx-.15,sy,.3,1.6);g.fillStyle='#fffaf1';g.fillRect(sx-1.6,sy-1.1,3.2,1.5);g.fillStyle='#e8662e';g.fillRect(sx-1.6,sy-1.1,3.2,.45);}},
 roof(g,x,y,w,h,col,flip,zc){g.fillStyle='rgba(30,20,25,.22)';g.fillRect(x+.8,y+.9,w,h);g.fillStyle=col;rr(g,x,y,w,h,.6);g.fill();
  const top=flip?y+h/2:y,bot=flip?y:y+h/2;g.fillStyle=shade(col,.14);g.fillRect(x+.3,top+.3,w-.6,h/2-.3);g.fillStyle=shade(col,-.12);g.fillRect(x+.3,bot,w-.6,h/2-.3);
  g.fillStyle=shade(col,-.32);g.fillRect(x+.3,y+h/2-.15,w-.6,.3);g.fillStyle='#6b5a55';g.fillRect(x+w*.75,y+h*.2,1.2,1.2);},
 drawHome(g,l,zc){const flip=l.face==='n',X=x=>l.x+x,Y=y=>flip?l.y+LH-1-y:l.y+y,col='#e8662e';
  for(let y=0;y<LOTH;y++)for(let x=0;x<MW;x++){const i=I(x,y),f=W.floor[i];if(f==='path'||f==='dirt'){g.fillStyle=f==='path'?'#e5d4a6':'#8e6a4b';g.fillRect(X(x),Y(y),1,1);}}
  g.fillStyle='rgba(30,20,25,.22)';for(let y=0;y<LOTH;y++)for(let x=0;x<MW;x++){const i=I(x,y);if(W.wt[i]||isInt(x,y))g.fillRect(X(x)+.8,Y(y)+.9,1,1);}
  for(let y=0;y<LOTH;y++)for(let x=0;x<MW;x++){const i=I(x,y);if(!W.wt[i]&&!isInt(x,y))continue;g.fillStyle=W.wt[i]?shade(col,-.12):((x+y)%2?col:shade(col,.05));g.fillRect(X(x),Y(y),1.02,1.02);}
  for(const o of G.objects){const d=o.def;if(d.tree)this.tree(g,X(o.x)+.5,Y(o.y)+.5,2.3,.5);else if(d.bush){g.fillStyle='#4c8a43';g.beginPath();g.arc(X(o.x)+.5,Y(o.y)+.5,.7,0,7);g.fill();}else if(d.plot){g.fillStyle='#6b4a33';g.fillRect(X(o.x)+.1,Y(o.y)+.1,.8,.8);}}},
 drawLabels(g,zc,vis){const family=n=>'The '+n+(/(s|x|z|ch|sh)$/.test(n)?'es':'s');const d=this.dpr,T2=TOWN,font=(px)=>`700 ${Math.round(px*d)}px "Pixelify Sans",Nunito,sans-serif`;g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';
  // labels are placed in priority order and skipped when they would overlap something already drawn
  const placed=[],fits=(x,y,w,h)=>{for(const r of placed)if(x<r[0]+r[2]&&x+w>r[0]&&y<r[1]+r[3]&&y+h>r[1])return false;placed.push([x,y,w,h]);return true;};
  const txt=(s,x,y,px,fill,force)=>{g.font=font(px);const w=g.measureText(s).width+6*d,h=(px+6)*d;if(!force&&!fits(x-w/2,y-h/2,w,h))return false;if(force)placed.push([x-w/2,y-h/2,w,h]);
   g.lineWidth=3.2*d;g.strokeStyle='rgba(42,31,45,.92)';g.strokeText(s,x,y);g.fillStyle=fill||'#fffaf1';g.fillText(s,x,y);return true;};
  const people=(list,sx,sy)=>list.forEach((m,i)=>{g.save();g.beginPath();g.arc(sx-i*16*d,sy,9*d,0,7);g.fillStyle='#fffaf1';g.fill();g.lineWidth=2*d;g.strokeStyle='#5fa64f';g.stroke();g.clip();g.imageSmoothingEnabled=true;g.drawImage(pcanvas(m),sx-9*d-i*16*d,sy-9*d,18*d,18*d);g.restore();});
  const cluster=zc<1.7&&T2.down;this.cluster=cluster;
  // 1. home
  for(const l of T2.lots)if(this.lotKind(l)==='home'&&vis(l.x,l.y,l.w,l.h)){const[sx,sy]=this.w2s(l.x+LW/2,l.y+LH/2);this.badge(g,sx,sy-6*d,'leaf','#5fa64f');placed.push([sx-16*d,sy-22*d,32*d,32*d]);txt('Home',sx,sy+16*d,12,'#fffaf1',true);}
  // 2. places (downtown folds into one badge when zoomed out)
  if(cluster){const b=T2.down,[sx,sy]=this.w2s((b.x0+b.x1)/2,(b.y0+b.y1)/2);this.badge(g,sx,sy,'bag','#e8662e');placed.push([sx-16*d,sy-16*d,32*d,32*d]);txt('Downtown',sx,sy+22*d,12,'#fffaf1',true);
   const here=household().filter(m=>m.away&&m.away.kind==='out'&&TOWN.pois.some(p=>p.id===m.away.dest&&!['lake','park'].includes(p.kind)));people(here,sx-22*d,sy-12*d);}
  for(const p of T2.pois){if(cluster&&!['lake','park'].includes(p.kind))continue;if(!vis(p.x-20,p.y-20,p.w+40,p.h+40))continue;
   const K=POI_KINDS[p.kind],[sx,sy]=this.w2s(p.bx,p.by),now=eventNow(p.kind),today=TOWN_EVENTS.some(e=>e.poi===p.kind&&e.day===wday(G.time)&&hourOf(G.time)<e.to),big=!!K.out||p.kind==='townhall';
   this.badge(g,sx,sy,K.icon,K.col,!big);placed.push([sx-16*d,sy-16*d,32*d,32*d]);txt(p.name,sx,sy+(big?22:18)*d,big?12:10);
   if(today&&this.mode==='browse'){const lbl=now?'Now':'Today';g.font=font(10);const w=g.measureText(lbl).width+10*d;g.fillStyle=now?'#e0463c':'#e8662e';rr(g,sx+8*d,sy-24*d,w,15*d,7*d);g.fill();g.fillStyle='#fff';g.fillText(lbl,sx+8*d+w/2,sy-16.5*d);placed.push([sx+8*d,sy-24*d,w,15*d]);}
   people(household().filter(m=>m.away&&m.away.kind==='out'&&m.away.dest===p.id),sx-22*d,sy-12*d);}
  for(const m of household())if(m.away&&m.away.kind==='out'&&m.away.dest&&m.away.dest.startsWith('nb:')){const l=T2.lots.find(l=>l.kind==='neighbor'&&l.owner===+m.away.dest.slice(3));if(!l)continue;const[sx,sy]=this.w2s(l.x+LW/2,l.y+LH/2);people([m],sx,sy-14*d);}
  // 3. homes for sale: dots when far away, price tags up close
  const sl=this.sel&&this.sel.t==='lot'?this.sel.l:null;if(sl&&vis(sl.x,sl.y,sl.w,sl.h)){const[sx,sy]=this.w2s(sl.x+LW/2,sl.y);g.fillStyle='#e8662e';g.strokeStyle='#33232e';g.lineWidth=2*d;g.beginPath();g.moveTo(sx,sy+2*d);g.lineTo(sx-7*d,sy-12*d);g.arc(sx,sy-15*d,8.5*d,Math.PI*.8,Math.PI*.2,false);g.closePath();g.fill();g.stroke();g.fillStyle='#fffaf1';g.beginPath();g.arc(sx,sy-15*d,3.5*d,0,7);g.fill();placed.push([sx-10*d,sy-26*d,20*d,30*d]);}
  for(const l of T2.lots){if(l===sl||this.lotKind(l)!=='sale'||!vis(l.x,l.y,l.w,l.h))continue;const[sx,sy]=this.w2s(l.x+LW/2,l.y+LH/2),emp=l.kind==='empty';
   if(zc<1.25){g.beginPath();g.arc(sx,sy,6*d,0,7);g.fillStyle=emp?'#fffaf1':'#e8662e';g.fill();g.lineWidth=2*d;g.strokeStyle=emp?'#e8662e':'#33232e';g.stroke();continue;}
   const tag='$'+(Math.round((l.priceU||l.price)/100)/10)+'k';g.font=font(11);const w=g.measureText(tag).width+12*d,h=18*d;if(!fits(sx-w/2,sy-h/2,w,h))continue;
   g.fillStyle=emp?'#fffaf1':'#e8662e';g.strokeStyle='#33232e';g.lineWidth=1.5*d;rr(g,sx-w/2,sy-h/2,w,h,6*d);g.fill();g.stroke();g.fillStyle=emp?'#33232e':'#fff';g.fillText(tag,sx,sy+.5*d);}
  // 4. neighbors' family names, then street names
  if(zc>1.25)for(const l of T2.lots)if(this.lotKind(l)==='neighbor'&&vis(l.x,l.y,l.w,l.h)){const[sx,sy]=this.w2s(l.x+LW/2,l.y+LH/2);txt(family(NEIGHBORS[l.owner].last),sx,sy,11);}
  if(zc>2.1)for(const r of T2.roads){if(!r.hz||!vis(r.x,r.y,r.w,r.h)||r.w<60)continue;const[sx,sy]=this.w2s(r.x+r.w/2,r.y+2);g.font=font(11);const w=g.measureText(r.name).width+6*d;if(!fits(sx-w/2,sy-7*d,w,14*d))continue;g.fillStyle='rgba(255,255,255,.82)';g.fillText(r.name,sx,sy);}},
 badge(g,x,y,icon,col,small){const d=this.dpr,r=(small?11:15)*d;g.fillStyle='rgba(30,20,25,.28)';g.beginPath();g.arc(x+1.5*d,y+2*d,r,0,7);g.fill();g.fillStyle='#fffaf1';g.beginPath();g.arc(x,y,r,0,7);g.fill();
  g.lineWidth=2.5*d;g.strokeStyle=col||'#33232e';g.stroke();const ic=smoothSpr(iconCanvas(icon),4),s=(small?13:18)*d;g.imageSmoothingEnabled=true;g.drawImage(ic,x-s/2,y-s/2,s,s);}
};
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
