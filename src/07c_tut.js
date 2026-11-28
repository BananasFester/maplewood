// ================= TOURS: guided popups for the Harts, and building a first home on an empty lot =================
function hasFrontDoor(){for(let y=0;y<LOTH;y++)for(let x=0;x<MW;x++){if(W.wt[I(x,y)]!==2)continue;
  if((isOutdoor(x,y-1)&&isInt(x,y+1))||(isInt(x,y-1)&&isOutdoor(x,y+1))||(isOutdoor(x-1,y)&&isInt(x+1,y))||(isInt(x-1,y)&&isOutdoor(x+1,y)))return true;}return false;}
// tiles the household can walk to right now (doors count, walls and furniture do not)
function reachMap(){const seen=new Uint8Array(N_TILES),q=[];const seed=(x,y)=>{if(!inMap(x,y))return;const i=I(x,y);if(W.block[i]||seen[i])return;seen[i]=1;q.push(i);};
 const hh=household().filter(s=>s.onLot&&!s.away);if(hh.length)for(const s of hh){const[x,y]=nearestFree(s.tx(),s.ty());seed(x,y);}else seed(13,SIDEY-1);
 while(q.length){const c=q.pop(),x=c%MW,y=(c/MW)|0;seed(x+1,y);seed(x-1,y);seed(x,y+1);seed(x,y-1);}return seen;}
function canReach(o,seen){const d=o.def,ok=(x,y)=>inMap(x,y)&&seen[I(x,y)]&&sameSide(o,x,y);
 for(let x=o.x;x<o.x+d.w;x++)if(ok(x,o.y-1)||ok(x,o.y+d.h))return true;for(let y=o.y;y<o.y+d.h;y++)if(ok(o.x-1,y)||ok(o.x+d.w,y))return true;return false;}
function homeChecks(){const hh=Math.max(1,household().length),acts=(d,a)=>!!(d.acts&&d.acts.includes(a)),seen=reachMap();
 const st=f=>{const L=G.objects.filter(o=>f(o.def));return!L.length?0:L.some(o=>canReach(o,seen))?2:1;};
 const beds=G.objects.filter(o=>acts(o.def,'sleep')),bedCap=beds.filter(o=>canReach(o,seen)).reduce((n,o)=>n+(o.def.w>=2?2:1),0);
 const row=(k,l,sh,s,go)=>({k,l:s===1?l+' (can\'t reach it)':l,s:s===1?sh+' (blocked)':sh,ok:s===2,go:s===1?'see:'+k:go});
 return[{k:'room',l:'Walls and a room',s:'Room',ok:W.rooms.length>0,go:'build:room'},{k:'door',l:'A front door',s:'Front door',ok:hasFrontDoor(),go:'build:door'},
  row('bed',hh>1?`Beds for ${hh}`:'A bed',hh>1?`Beds for ${hh}`:'Bed',bedCap>=hh?2:beds.length&&!bedCap?1:0,'buy:beds'),row('toilet','A toilet','Toilet',st(d=>acts(d,'toilet')),'buy:bath'),
  row('wash','A shower or tub','Shower or tub',st(d=>acts(d,'shower')||acts(d,'bath')),'buy:bath'),row('fridge','A fridge','Fridge',st(d=>!!d.fridge),'buy:kitchen'),row('stove','A stove','Stove',st(d=>!!d.stove),'buy:kitchen')];}
function tutGo(go){const[m,k]=go.split(':');if(m==='see'){const f={bed:d=>d.acts&&d.acts.includes('sleep'),toilet:d=>d.acts&&d.acts.includes('toilet'),wash:d=>d.acts&&(d.acts.includes('shower')||d.acts.includes('bath')),fridge:d=>d.fridge,stove:d=>d.stove}[k],o=f&&G.objects.find(o=>f(o.def));if(o)centerOn(o.x*T+8,o.y*T+8);toast('Nobody can get to this. Add a door to its room, or move whatever blocks the way.','door');return;}if(m==='build'){UI.setMode('build');if(G.mode==='build'){BB.tool=k;BB.renderBuild();}}else if(m==='buy'){UI.setMode('buy');if(G.mode==='buy'){BB.cat=k;BB.renderBuy();}}}
function jobless(){return household().find(s=>!s.job)||null;}
function tutShowCareer(){UI.setMode('live');if(!UI.open)$('#sexp').click();UI.tab='job';UI.dirty=true;}
const JOB_STEP={i:'job',t:'Find a job',b:()=>{const p=jobless();return`${esc(p?p.first:'Everyone')} needs a job. Each career has its own hours, pay and a skill that earns promotions.`;},
 tg:'#phoneBtn',act:['Find a job',()=>{const p=jobless();if(p)UI.careers(p);}],done:B=>household().filter(s=>s.job).length>B.jobs,skip:()=>!jobless()};
const CAREER_STEP={i:'trophy',t:'Careers and promotions',b:()=>{const w=household().filter(p=>p.job);return`${w.map(p=>{const j=CAREERS[p.job.career].lv[p.job.level][0];return`${esc(p.first)} is ${/^[AEIOU]/.test(j)?'an':'a'} ${esc(j)}`;}).join(' and ')}. The carpool comes 30 minutes before each shift. Every career has five levels: a promotion needs full performance and enough of the career skill.`;},
 act:['Show career',tutShowCareer],next:true,skip:()=>!household().some(p=>p.job)};
const TOURS={
 harts:[
  {i:'leaf',t:'Welcome to Maplewood',b:s=>`Meet ${esc(s.first)}. The leaf floats over the person you control, and their needs fill the panel at the bottom.`,tg:{sim:1},next:true},
  {i:'hunger',t:'Needs',b:'Six needs drain over time: Hunger, Energy, Bladder, Hygiene, Fun and Social. Green is good and red is urgent. Press and hold a bar to see what it means.',tg:'#sneeds',next:true,done:()=>TUT.tipped},
  {i:'sofa',t:'Give an order',b:'Tap a piece of furniture to see what it does, then pick an action. Try the TV.',tg:{obj:'tv'},done:B=>TUT.orders>B.orders,
   enter:()=>{const o=G.objects.find(o=>o.type==='tv');if(o)centerOn(o.x*T+8,o.y*T+40);}},
  {i:'walk',t:'The action queue',b:'Orders line up here. Tap one to cancel it. Dashed ones were picked on their own, with free will.',tg:'#queue',pos:'top',next:true},
  {i:'people',t:'Switch people',b:()=>{const o=household().find(p=>p.id!==G.sel);return`Tap ${esc(o?o.first:'someone else')} in the top left to take control.`;},tg:'#portraits .pbtn:not(.sel)',done:B=>G.sel!==B.sel,skip:()=>household().length<2},
  {i:'sun',t:'Time',b:'Pause to plan, or speed up with the arrows. Use the fastest speed while everyone sleeps or works.',tg:'#speed',next:true},
  {i:'star',t:'Moods, skills and wishes',b:'Open the details panel to see moods, skills, career, friends and wishes.',tg:'#sexp',done:()=>UI.open,skip:()=>UI.open},
  JOB_STEP,CAREER_STEP,
  {i:'map',t:'Your town',b:'Tap the map button, or keep zooming out, to see the whole town. Visit the lake, the park and downtown, drop by neighbors, and check this week\'s events.',tg:'#zoom [data-z="town"]',next:true,done:()=>TV.on},
  {i:'sofa',t:'Shop and build',b:'The sofa opens Buy mode for furniture. The hammer opens Build mode for rooms, walls, floors and wallpaper. Time stops while you shop.',tg:'#modes',next:true},
  {i:'heart',t:'You are all set',b:'Keep needs up, make friends with neighbors walking by, learn skills and climb a career. Press and hold anything if you get stuck.',next:'Start playing'}],
 fresh:[
  {i:'home',t:'Welcome home',b:()=>W.rooms.length?`The house is yours, and you have ${money(G.money)} to furnish it. Time stays paused until you move in.`:`This lot is all yours, and you have ${money(G.money)} to build and furnish a home. Time stays paused until you move in.`,next:true,skip:()=>!G.fresh},
  {i:'home',t:'Build a room',b:'Pick Room, then drag a box on the grass with one finger. Walls go around it and the floor fills the inside.',tg:'#build [data-t="room"]',
   enter:()=>tutGo('build:room'),done:()=>W.rooms.length>0,skip:()=>!G.fresh||W.rooms.length>0},
  {i:'door',t:'Add a front door',b:'Pick Door, then tap the wall that faces the street. A path to the sidewalk appears on its own.',tg:'#build [data-t="door"]',enter:()=>tutGo('build:door'),done:()=>hasFrontDoor(),skip:()=>!G.fresh||hasFrontDoor()},
  {i:'hammer',t:'Make it yours',b:'Add a bathroom and a bedroom, each with a door. Try Windows, Floors and Wallpaper too. Tap Next when you are done.',tg:'#build .tabsx',next:true,
   enter:()=>tutGo('build:room'),skip:()=>!G.fresh||G.lot==='shell'},
  {i:'sofa',t:'Furnish your home',b:'Tap what you still need to shop for it, then tap the floor to place it.',chk:true,tg:'#buy .items',
   enter:()=>{const c=homeChecks().find(c=>!c.ok&&c.go.startsWith('buy'));tutGo(c?c.go:'buy:beds');},done:()=>homeChecks().every(c=>c.ok),skip:()=>!G.fresh},
  {i:'leaf',t:'Move in',b:'Your home has the basics. Tap the leaf to move in and start the clock.',tg:'#modes [data-m="live"]',done:()=>G.mode==='live'&&!G.fresh,skip:()=>!G.fresh},
  JOB_STEP,
  CAREER_STEP,
  {i:'heart',t:'Enjoy your new life',b:'Bills arrive at the mailbox each Monday. Wave to neighbors walking by to make friends. Press and hold anything to learn more.',next:'Start playing'}],
 movein:[]};
TOURS.movein=[TOURS.fresh[1],TOURS.fresh[2],TOURS.fresh[4],TOURS.fresh[5],JOB_STEP,CAREER_STEP];
TOURS.settled=[{i:'home',t:'Welcome home',b:()=>`Your new home is furnished and ready. You have ${money(G.money)} left for upgrades.`,next:true},JOB_STEP,CAREER_STEP,TOURS.harts.find(x=>x.t==='Your town')];
const TUT={el:null,ring:null,orders:0,tipped:false,base:{},acc:0,sig:'',
 init(){const ui=$('#ui');this.el=document.createElement('div');this.el.id='tut';this.el.className='card hidden';this.el.setAttribute('role','status');ui.appendChild(this.el);
  this.ring=document.createElement('div');this.ring.id='tutRing';this.ring.className='hidden';ui.appendChild(this.ring);
  this.el.addEventListener('click',e=>{const h=e.target.closest('[data-tut="max"]');if(h){this.min=false;this.render();return;}const b=e.target.closest('button');if(!b)return;AU.init();const k=b.dataset.tut;if(k==='min'){this.min=true;this.render();return;}
   if(b.dataset.go){sfx('click');tutGo(b.dataset.go);return;}if(k==='skip'){this.skip();return;}if(k==='next'){this.next();return;}
   if(k==='act'){const st=this.cur();sfx('click');if(st&&st.act)st.act[1]();}});
  window.addEventListener('resize',()=>this.place());},
 active(){return!!(G.tut&&G.tut.s&&TOURS[G.tut.s]);},
 list(){return(G.tut&&TOURS[G.tut.s])||[];},
 cur(){return this.active()?this.list()[G.tut.i]:null;},
 start(name,force){if(!G.tut)G.tut={done:{}};G.tut.done=G.tut.done||{};if(!force&&G.tut.done[name])return;G.tut.s=name;G.tut.i=0;this.enter();},
 enter(){this.min=false;const L=this.list();while(G.tut.i<L.length&&L[G.tut.i].skip&&L[G.tut.i].skip())G.tut.i++;
  if(G.tut.i>=L.length){this.finish();return;}const st=L[G.tut.i];
  this.base={sel:G.sel,orders:this.orders,jobs:household().filter(s=>s.job).length};this.tipped=false;this.sig='';
  try{if(st.enter)st.enter();}catch(e){console.error(e);}this.render();},
 next(){if(!this.active())return;G.tut.i++;sfx('pop');this.enter();},
 finish(){if(G.tut&&G.tut.s){G.tut.done=G.tut.done||{};G.tut.done[G.tut.s==='movein'?'fresh':G.tut.s]=1;G.tut.s=null;}this.hide();},
 skip(){this.finish();toast('Tour skipped. You can replay it from the menu.','star');},
 hide(){if(!this.el)return;this.el.classList.add('hidden');this.ring.classList.add('hidden');$('#toasts').style.top='';},
 chkHTML(tail){const L=homeChecks(),n=L.filter(c=>c.ok).length;return`<div class="chk"><span class="cn">${n} of ${L.length} done</span>${L.filter(c=>!c.ok).map(c=>`<button data-go="${c.go}"><span>+</span>${esc(c.s)}</button>`).join('')}${tail||''}</div>`;},
 render(){const st=this.cur();if(!st){this.hide();return;}const s=selSim()||household()[0];if(!s)return;const L=this.list();
  const skip='<button class="lnk" data-tut="skip">Skip tour</button>',body=typeof st.b==='function'?st.b(s):st.b,title=typeof st.t==='function'?st.t(s):st.t,nx=st.next===true?'Next':st.next;
  this.el.classList.toggle('min',!!this.min);this.el.innerHTML=`<div class="th" data-tut="${this.min?'max':''}">${ico(st.i||'star',22)}<b>${esc(title)}</b><span class="tn">${G.tut.i+1} of ${L.length}</span><button class="tmin" data-tut="${this.min?'max':'min'}" aria-label="${this.min?'Show tip':'Hide tip'}">${this.min?'+':'–'}</button></div><p class="tb">${say(body)}${!st.act&&!nx&&!st.chk?' '+skip:''}</p>${st.chk?this.chkHTML(!st.act&&!nx?skip:''):''}
   ${st.act||nx?`<div class="ta">${skip}<span class="grow"></span>${st.act?`<button class="btn sm" data-tut="act">${esc(st.act[0])}</button>`:''}${nx?`<button class="btn sm primary" data-tut="next">${esc(nx)}</button>`:''}</div>`:''}`;
  this.el.classList.remove('hidden');this.place();this.frame(0);},
 // In Buy and Build mode the card stays at the top, out of the way of the house and the shop: in the gap between
 // the top corners when there is room (tablets, landscape), or just under them on a phone. It steps aside while an
 // item is being placed or a room is being dragged. In Live mode it sits above the bottom panel on phones in
 // portrait, and top centre on wide or short screens.
 place(){const el=this.el;if(!el||el.classList.contains('hidden'))return;const st=this.cur()||{};const wide=innerWidth>=760||innerHeight<560;
  el.style.transform='';el.style.left='';el.style.right='';el.style.top='';el.style.bottom='';el.style.width='';el.style.maxHeight='';
  const shop=G.mode==='buy'||G.mode==='build';el.classList.toggle('shop',shop);
  el.classList.toggle('aside',shop&&!!(BB.placing||BB.drag));this.ring.classList.toggle('aside',shop&&!!(BB.placing||BB.drag));
  if(shop){const rs=s=>{const e=$(s);return e&&!e.classList.contains('hidden')?e.getBoundingClientRect():null;};
   const L=['#clock','#speed'].map(rs).filter(Boolean),Rt=['#moneyPill','#menuBtn','#zoom'].map(rs).filter(Boolean);
   const lx=Math.max(8,...L.map(r=>r.right))+8,rx=Math.min(innerWidth-8,...Rt.map(r=>r.left))-8,hb=Math.max(0,...L.concat(Rt).map(r=>r.bottom));
   const panel=rs(G.mode==='buy'?'#buy':'#build'),floor=panel?panel.top-8:innerHeight-8;
   if(rx-lx>=300){const w=Math.min(440,rx-lx);el.style.left=Math.round(lx+(rx-lx-w)/2)+'px';el.style.width=w+'px';el.style.top='calc(env(safe-area-inset-top,0px) + 8px)';el.style.maxHeight=Math.max(120,Math.round(floor-8))+'px';}
   else{el.style.left='calc(env(safe-area-inset-left,0px) + 8px)';el.style.top=Math.round(hb+8)+'px';el.style.maxHeight=Math.max(120,Math.round(floor-hb-16))+'px';
    const md=rs('#modes');el.style.width='min(440px,calc(100vw - 16px))';if(md&&el.getBoundingClientRect().bottom>md.top-8)el.style.width='min(440px,calc(100vw - 76px))';}}
  else if(wide){el.style.left='50%';el.style.transform='translateX(-50%)';el.style.top=`calc(env(safe-area-inset-top,0px) + ${innerHeight<560?60:110}px)`;el.style.width=`min(420px,calc(100vw - ${innerWidth>=980?460:innerWidth>=760?300:16}px))`;}
  else{el.style.left='calc(env(safe-area-inset-left,0px) + 8px)';el.style.width='min(440px,calc(100vw - 76px))';
   if(st.pos==='top')el.style.top='calc(env(safe-area-inset-top,0px) + 118px)';
   else{const sh=G.mode==='live'?$('#sheet'):G.mode==='buy'?$('#buy'):$('#build');const r=sh&&!sh.classList.contains('hidden')?sh.getBoundingClientRect():null;el.style.bottom=((r?innerHeight-r.top:0)+(G.mode==='live'?62:12))+'px';}}
  const r=el.getBoundingClientRect(),tb=$('#toasts');tb.style.top=r.top<230&&!el.classList.contains('aside')?Math.round(r.bottom+8)+'px':'';},
 rect(){const st=this.cur();if(!st||!st.tg)return null;const t=st.tg;
  if(typeof t==='string'){const e=document.querySelector(t);if(!e)return null;const r=e.getBoundingClientRect();return r.width||r.height?r:null;}
  const box=(x0,y0,x1,y1)=>{const a=worldToScreen(x0,y0),b=worldToScreen(x1,y1),d=R.dpr;return{left:a.x/d,top:a.y/d,width:(b.x-a.x)/d,height:(b.y-a.y)/d};};
  if(t.obj){const o=G.objects.find(o=>o.type===t.obj);if(!o)return null;return box(o.x*T-2,o.y*T-20,(o.x+o.def.w)*T+2,(o.y+o.def.h)*T+2);}
  if(t.sim){const s=selSim();if(!s||!s.onLot)return null;return box(s.x-11,s.y-48,s.x+11,s.y+4);}return null;},
 frame(dt){if(!this.el||!this.active()||UI.welcomeOn){if(this.el&&!this.el.classList.contains('hidden')&&UI.welcomeOn)this.hide();return;}
  if(this.el.classList.contains('hidden')){this.render();return;}
  const r=this.rect(),g=this.ring;
  if(r&&r.left+r.width>0&&r.top+r.height>0&&r.left<innerWidth&&r.top<innerHeight&&!UI.modalOpen()&&!this.el.classList.contains('aside')){g.classList.remove('hidden');g.style.left=Math.round(r.left-6)+'px';g.style.top=Math.round(r.top-6)+'px';g.style.width=Math.round(r.width+12)+'px';g.style.height=Math.round(r.height+12)+'px';}
  else g.classList.add('hidden');
  const aside=(G.mode==='buy'||G.mode==='build')&&!!(BB.placing||BB.drag);if(aside!==this.el.classList.contains('aside'))this.place();
  this.acc+=dt||0;if(this.acc<.25)return;this.acc=0;const st=this.cur();if(!st)return;
  if(st.done&&!UI.modalOpen()&&st.done(this.base)){setTimeout(()=>{if(this.cur()===st)this.next();},350);this.acc=-1;return;}
  if(st.chk){const sig=homeChecks().map(c=>c.ok?1:0).join('');if(sig!==this.sig){this.sig=sig;this.render();}}
  this.place();}
};

// ---------- lot picker for a brand-new household ----------
UI.lots=function(defs){this.lotDefs=defs;const cards=Object.entries(LOTS).map(([k,L])=>`<button class="lot" data-lot="${k}"><canvas data-prev="${k}" width="${MW*6}" height="${MH*6}" aria-hidden="true"></canvas><span class="li"><b>${esc(L.n)}</b><span class="chip">${esc(L.k)}</span><span class="small">${esc(L.d)}</span><span class="lp">${money(L.p)}<small> · leaves ${money(START_FUNDS-L.p)} to spend</small></span></span></button>`).join('');
 this.modal(`<h2>Choose a lot</h2><p class="small">The ${esc(defs[0].last)} household has ${money(START_FUNDS)}. Pick a place to live, then build and furnish your home.</p><div class="lots">${cards}</div><div class="actions"><button class="btn" id="lback">Back</button></div>`,()=>{});
 $('#mcard').classList.add('wide');$('#mcard').querySelectorAll('canvas[data-prev]').forEach(c=>{c.getContext('2d').drawImage(lotPreview(c.dataset.prev,6),0,0);});
 $('#lback').onclick=()=>{this.closeModal();if(this.casSt){$('#cas').classList.remove('hidden');this.renderCas();}};
 $('#mcard').onclick=e=>{const b=e.target.closest('[data-lot]');if(!b)return;AU.init();this.closeModal();startFresh(this.lotDefs,b.dataset.lot);};};
function startFresh(defs,lot){const L=LOTS[lot];startHousehold(defs,START_FUNDS-L.p,8*60,{married:false,lot});
 UI.casSt=null;$('#cas').classList.add('hidden');UI.hideWelcome();centerHome();sfx('promo');
 if(G.fresh)UI.setMode(lot==='shell'?'buy':'build');
 toast(`The ${defs[0].last} household bought ${L.n}`,'home');
 TUT.start(G.tut&&G.tut.done&&G.tut.done.fresh?'movein':'fresh',true);autosave(true);}
