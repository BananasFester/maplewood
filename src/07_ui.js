// ================= UI: HUD, sheet, menus, dialogs =================
const $=s=>document.querySelector(s);
const SVG={close:'<svg width="18" height="18" viewBox="0 0 18 18"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
 chevU:'<svg width="20" height="20" viewBox="0 0 20 20"><path d="M4 13l6-6 6 6" stroke="#33232e" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 chevD:'<svg width="20" height="20" viewBox="0 0 20 20"><path d="M4 7l6 6 6-6" stroke="#33232e" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 rot:'<svg width="18" height="18" viewBox="0 0 18 18"><path d="M14 9a5 5 0 1 1-2-4" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M10 2h4v4" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'};
function toast(msg,icon,fn){UI.toast(msg,icon,fn);}
function agoText(t){const m=Math.max(0,(Date.now()-t)/60000);if(m<2)return'just now';if(m<60)return Math.round(m)+' minutes ago';const h=m/60;if(h<24)return Math.round(h)===1?'an hour ago':Math.round(h)+' hours ago';const d=Math.round(h/24);return d===1?'yesterday':d+' days ago';}
function sfx(n){AU.sfx(n);}
function selectSim(s,center){if(!s)return;G.sel=s.id;UI.dirty=true;UI.ctxClose();if(center&&s.onLot)centerOn(s.x,s.y-12);}
function selectNextSim(){const h=household().filter(p=>p.onLot&&!p.away&&p.id!==G.sel);if(h.length)selectSim(h[0]);}
const selSim=()=>personById(G.sel);
const needColor=v=>v>=60?'#5fa64f':v>=30?'#e9b23a':'#d9483b';
function pcanvas(s,scale){const c=portrait(s);const src=R.smooth?smoothSpr(c,4):c;const o=document.createElement('canvas');o.width=src.width;o.height=src.height;o.getContext('2d').drawImage(src,0,0);return o;}
function actProgress(s){const a=s.act;if(!a)return 0;const st=a.steps[a.si];if(!st)return 0;const base=a.si/a.steps.length;let p=0;
 if((st.k==='use'&&st.ph==='do')||(st.k==='wait'&&st.on)){if(st.fill){p=s.needs[st.fill]/100;}else p=clamp((st.el||0)/(st.max||st.min||10),0,1);}
 return clamp(base+p/a.steps.length,0,1);}
const UI={dirty:true,tab:'mood',open:false,t:0,toasts:[],mq:[],casSt:null,
 init(){
  $('#wx').src=iconURL('sun');$('#coinIco').src=iconURL('coin');
  const mi={live:['leaf',{o:'#6fbd52',k:'#2a1f2d'}],buy:['sofa'],build:['hammer']};
  document.querySelectorAll('#modes .mode').forEach(b=>{const m=mi[b.dataset.m];b.innerHTML=`<img class="ico" width="30" height="30" alt="" src="${iconURL(m[0],m[1])}">`;b.onclick=()=>{AU.init();sfx('click');UI.setMode(b.dataset.m);};});
  $('#phoneBtn').innerHTML=`<img class="ico" width="30" height="30" alt="" src="${iconURL('phone')}">`;$('#phoneBtn').onclick=()=>{AU.init();sfx('click');UI.phone();};
  document.querySelectorAll('#speed button').forEach(b=>b.onclick=()=>{AU.init();G.speed=+b.dataset.s;G.skip=false;sfx('click');UI.dirty=true;});
  $('#menuBtn').onclick=()=>{AU.init();sfx('click');UI.menu();};
  $('#zoom').onclick=e=>{const b=e.target.closest('[data-z]');if(!b)return;sfx('click');AU.init();const z=b.dataset.z;if(z==='walls'){if(!TV.on)toggleWalls();return;}if(z==='town'){if(TV.on){if(TV.mode==='pick')TV.cancelPick();else TV.close();}else if(G.started&&!UI.welcomeOn)TV.open('browse');return;}if(TV.on)TV.zoomStep(+z);else zoomStep(+z);};
  $('#skip').onclick=()=>{G.skip=true;sfx('click');$('#skip').classList.add('hidden');};
  $('#queue').onclick=(e)=>{const b=e.target.closest('.qchip');if(!b)return;const s=selSim();if(!s)return;const i=+b.dataset.i;const a=i<0?s.act:s.queue[i];if(a){cancelAct(s,a);sfx('pop');}};
  $('#portraits').onclick=(e)=>{const b=e.target.closest('.pbtn');if(!b)return;const s=personById(b.dataset.id);if(!s)return;if(s.id===G.sel&&s.onLot)centerOn(s.x,s.y-12);selectSim(s,true);sfx('click');};
  this.buildSheet();this.layout();
  $('#modal').addEventListener('pointerdown',e=>{if(e.target.id==='modal'&&this.mCancel){const f=this.mCancel;this.closeModal();f();}});
 },
 layout(){const sh=G.mode==='live'?$('#sheet'):G.mode==='buy'?$('#buy'):$('#build');const vis=sh&&!sh.classList.contains('hidden');const r=vis?sh.getBoundingClientRect():null;
  const above=r?Math.round(innerHeight-r.top+10):18,wide=r&&(innerWidth-r.right)>250,base=r?Math.round(innerHeight-r.bottom):8;
  $('#modes').style.bottom=(wide||(r&&innerWidth-r.right>74)?base:above)+'px';const q=$('#queue');if(wide&&G.mode==='live'){q.style.left=Math.round(r.right+10)+'px';q.style.bottom=base+'px';q.style.maxWidth=Math.max(120,innerWidth-r.right-90)+'px';}else{q.style.left='';q.style.maxWidth='';q.style.bottom=(above-4)+'px';}
  $('#skip').style.bottom=(wide?base+60:above+58)+'px';
  $('#place').style.bottom=above+'px';},
 toast(msg,icon,fn){if(G.quiet)return;const el=document.createElement('div');el.className='toast'+(fn?' tap':'');el.innerHTML=`${ico(icon||'star',20)}<span>${esc(say(msg))}</span>${fn?ico('map',18,'tgo'):''}`;const box=$('#toasts');box.appendChild(el);while(box.children.length>2)box.firstChild.remove();
  if(fn)el.onclick=e=>{e.stopPropagation();el.remove();sfx('click');fn();};
  setTimeout(()=>{el.classList.add('out');setTimeout(()=>el.remove(),450);},fn?6500:3800);},
 // ---------- per-frame update ----------
 update(dt){this.t+=dt;if(this.t<.15&&!this.dirty)return;this.t=0;
  $('#time').textContent=clockStr(G.time);const d=dayOf(G.time);$('#day').textContent=`${DAYS[d%7]} · ${SEASONS[G.season]}, day ${(d%7)+1}`;
  const wxi=G.weather==='rain'?'rain':G.weather==='snow'?'snow':brightness()<.5?'moon':'sun';if(this._wx!==wxi){this._wx=wxi;$('#wx').src=iconURL(wxi);}
  document.querySelectorAll('#speed button').forEach(b=>b.classList.toggle('on',+b.dataset.s===G.speed));
  $('#cash').textContent=money(G.money);$('#cash').style.color=G.money<0?'#c0392b':'';
  document.querySelectorAll('#modes .mode').forEach(b=>b.classList.toggle('on',b.dataset.m===G.mode));
  const pb=$('#phoneBtn');const tag=G.bills?'<span class="tag">$</span>':'';if(pb._t!==tag){pb._t=tag;pb.innerHTML=`<img class="ico" width="30" height="30" alt="" src="${iconURL('phone')}">${tag}`;}
  const hh=household().filter(p=>p.onLot&&!p.away);const allAsleep=hh.length===0||hh.every(p=>p.act&&p.act.sleeping);$('#skip').textContent=hh.length?'Everyone is asleep. Skip ahead':'Everyone is out. Skip ahead';
  $('#skip').classList.toggle('hidden',!(allAsleep&&G.mode==='live'&&!G.skip&&G.speed>0&&!this.modalOpen()&&G.started&&!this.welcomeOn));
  this.renderQueue();this.renderSheetLive();if(this.dirty){this.renderPortraits();if(this.open)this.renderTab();this.dirty=false;}else if(this.open&&(this.tab==='mood'||this.tab==='job'))this.renderTab();
  this.layout();},
 renderQueue(){const s=selSim();const el=$('#queue');if(!s||G.mode!=='live'){el.innerHTML='';return;}
  let h='';if(s.act&&s.act.id!=='wander'){h+=`<button class="qchip cur ${s.act.user?'':'auto'}" data-i="-1" data-tip="q:-1" style="--p:${Math.round(actProgress(s)*100)}%" aria-label="Cancel ${esc(s.act.label)}">${ico(s.act.icon,24)}</button><span class="qname">${esc(s.act.label)}</span>`;}
  s.queue.forEach((a,i)=>{h+=`<button class="qchip" data-i="${i}" data-tip="q:${i}" aria-label="Cancel ${esc(a.label)}">${ico(a.icon,24)}</button>`;});
  if(el._h!==h){el._h=h;el.innerHTML=h;}else{const c=el.querySelector('.qchip.cur');if(c)c.style.setProperty('--p',Math.round(actProgress(s)*100)+'%');}},
 buildSheet(){const el=$('#sheet');
  el.innerHTML=`<div class="head"><div class="portrait" id="sp" data-tip="sim:sel"></div><div class="who"><b id="sname"></b><div class="mood" id="smood" data-tip="moodsum"></div></div><button class="round" id="sexp" style="width:44px;height:44px" aria-label="Show details">${SVG.chevU}</button></div>
  <div class="needs" id="sneeds">${NEEDS.map(n=>`<div class="need" data-tip="need:${n.id}">${ico(n.id,20)}<div class="bar" aria-label="${n.l}"><i id="nb_${n.id}"></i></div></div>`).join('')}</div>
  <div id="sx" class="hidden"><div class="tabs" id="stabs">${[['mood','smile'],['skills','book'],['job','job'],['people','people'],['wishes','star']].map(([k,i])=>`<button data-t="${k}" data-tip="tab:${k}" aria-label="${k}">${ico(i,24)}</button>`).join('')}</div><div class="tabbody" id="sbody"></div></div>`;
  $('#sexp').onclick=()=>{this.open=!this.open;sfx('click');$('#sx').classList.toggle('hidden',!this.open);$('#sexp').innerHTML=this.open?SVG.chevD:SVG.chevU;this.dirty=true;this.layout();};
  $('#sneeds').onclick=()=>{if(!this.open)$('#sexp').click();};
  $('#stabs').onclick=e=>{const b=e.target.closest('button');if(!b)return;this.tab=b.dataset.t;sfx('click');this.dirty=true;};
  $('#sbody').onclick=e=>{const b=e.target.closest('[data-a]');if(!b)return;const s=selSim();const a=b.dataset.a;
   if(a==='findjob')this.careers(s);if(a==='quit')this.confirm('Quit your job?',`${esc(s.first)} will leave the ${CAREERS[s.job.career].l} career.`,'Quit job',()=>{s.job=null;toast(`${s.first} quit their job`,'job');UI.dirty=true;});
   if(a==='rewards')this.rewards(s);if(a==='dropwish'){s.wishes=s.wishes.filter(w=>w.id!==b.dataset.id);s.wishCD=G.time+30;this.dirty=true;}
   if(a==='talkto'){const p=personById(b.dataset.id);if(p&&p.onLot)this.simMenu(p,innerWidth/2,innerHeight/2);else this.phone();}};},
 renderSheetLive(){const s=selSim();if(!s)return;const ml=moodLevel(moodScore(s));
  const sp=$('#sp');if(sp._k!==s.appKey){sp._k=s.appKey;sp.innerHTML='';sp.appendChild(pcanvas(s));}sp.style.setProperty('--mood',ml.c);
  $('#sname').textContent=s.name;
  let st=ml.l;if(s.away)st=s.away.kind==='work'?`At work until ${hr12(shiftOf(s).end)}`:s.away.kind==='jog'?'Out jogging':s.away.kind==='out'?`At ${destName(s.away.dest)}`:'Away';else if(s.act&&s.act.id!=='wander')st+=' · '+s.act.label;
  const top=s.moodlets.slice().sort((a,b)=>Math.abs(MOODLETS[b.id].v)-Math.abs(MOODLETS[a.id].v)).slice(0,3);
  const mh=`<span class="dot" style="--mood:${ml.c}"></span><span>${esc(st)}</span><span class="mini">${top.map(m=>ico(MOODLETS[m.id].i,16)).join('')}</span>`;
  const sm=$('#smood');if(sm._h!==mh){sm._h=mh;sm.innerHTML=mh;}
  for(const n of NEEDS){const v=s.needs[n.id],b=$('#nb_'+n.id);b.style.width=Math.max(3,v)+'%';b.style.background=needColor(v);}
  document.querySelectorAll('#stabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===this.tab));},
 renderTab(){const s=selSim();if(!s)return;const el=$('#sbody');let h='';
  if(this.tab==='mood'){h+=`<div class="row" style="flex-wrap:wrap;gap:6px">${s.traits.map(t=>`<span class="chip" data-tip="trait:${t}">${esc(TRAITS[t].l)}</span>`).join('')||'<span class="small">No traits</span>'}</div>`;
   const ms=s.moodlets.slice().sort((a,b)=>MOODLETS[b.id].v-MOODLETS[a.id].v);
   h+=ms.length?ms.map(m=>{const d=MOODLETS[m.id];const left=m.until?Math.max(0,m.until-G.time):0;return`<div class="row" data-tip="mood:${m.id}">${ico(d.i,24)}<div class="grow"><span class="lbl">${esc(d.l)}</span>${left?`<div class="small">${left>=60?Math.round(left/60)+' hr':Math.ceil(left)+' min'} left</div>`:''}</div><span class="${d.v>0?'pos':'neg'}">${d.v>0?'+':''}${d.v}</span></div>`;}).join(''):`<div class="row small">No moodlets right now. Mood is ${moodLevel(0).l.toLowerCase()}.</div>`;}
  if(this.tab==='skills'){const L=SKILL_IDS.map(k=>[k,s.skills[k]||0]).sort((a,b)=>b[1]-a[1]);
   h+=L.map(([k,xp])=>{const lv=lvlOf(xp),nx=lv<10?SKILL_XP[lv+1]:SKILL_XP[10],pv=lv<10?SKILL_XP[lv]:SKILL_XP[9],p=lv<10?(xp-pv)/(nx-pv):1;
    return`<div class="row" data-tip="skill:${k}">${ico(k,24)}<div class="grow"><span class="lbl">${SKILLS[k].l}</span> <span class="small">level ${lv}</span><div class="meter"><i style="width:${Math.round(p*100)}%;background:var(--acc2)"></i></div></div><div class="pips">${Array.from({length:10},(_,i)=>`<i class="${i<lv?'on':''}"></i>`).join('')}</div></div>`;}).join('');
   h+=`<p class="small">Practice with objects: stove and cookbooks for Cooking, chess and the computer for Logic, treadmill or weights for Fitness, the mirror and conversation for Charisma, the easel, the guitar, and the garden.</p>`;}
  if(this.tab==='job'){if(s.job){const{C,L,start,end,pay}=shiftOf(s);const j=s.job,nx=j.level<4?C.lv[j.level+1]:null,need=nx?PROMO[j.level+1]:0;
    h+=`<div class="row" data-tip="job">${ico('job',24)}<div class="grow"><span class="lbl">${esc(L[0])}</span><div class="small">${C.l} career · level ${j.level+1} of 5</div></div><b class="px">${money(pay)}/hr</b></div>
    <div class="row">${ico('sun',24)}<div class="grow"><span class="lbl">${C.days.map(d=>DAYS[d]).join(', ')}</span><div class="small">${hr12(start)} to ${hr12(end)} · carpool 30 min before</div></div></div>
    <div class="row">${ico('trophy',24)}<div class="grow"><span class="lbl">Performance ${Math.round(j.perf)}%</span><div class="meter"><i style="width:${j.perf}%;background:${j.perf>=60?'var(--good)':j.perf>=30?'var(--acc2)':'var(--bad)'}"></i></div>
    <div class="small">${nx?`Next: ${esc(nx[0])} (${money(nx[1])}/hr). Needs 100% performance and ${SKILLS[C.skill].l} ${need} (now ${s.level(C.skill)}).`:'Top of the career!'} Good moods at work raise performance.</div></div></div>
    <div class="actions"><button class="btn sm" data-a="quit">Quit job</button></div>`;}
   else h+=`<div class="row">${ico('job',24)}<div class="grow"><span class="lbl">No job yet</span><div class="small">Pick a career from the phone or a computer. Pay rises with promotions.</div></div></div><div class="actions"><button class="btn primary" data-a="findjob">Find a job</button></div>`;}
  if(this.tab==='people'){const L=G.people.filter(p=>p!==s).map(p=>[p,relPeek(s,p)]).filter(([p,r])=>r&&r.met).sort((a,b)=>(b[1].f+b[1].r)-(a[1].f+a[1].r));
   h+=L.length?L.map(([p,r])=>{const c=pcanvas(p).toDataURL();return`<div class="row" data-a="talkto" data-id="${p.id}" data-tip="rel:${p.id}"><img class="ico pp" src="${c}" width="36" height="36" alt=""><div class="grow"><span class="lbl">${esc(p.name)}</span> <span class="small">${relLabel(r)}${p.role==='household'?' · household':''}</span>
    <div class="meter"><i style="width:${Math.abs(r.f)}%;background:${r.f>=0?'var(--good)':'var(--bad)'}"></i></div>${r.r>0?`<div class="meter"><i style="width:${r.r}%;background:#e27aa6"></i></div>`:''}</div></div>`;}).join(''):`<div class="row small">${esc(s.first)} hasn't met anyone yet. Wave down a neighbor walking past, or invite one over by phone.</div>`;}
  if(this.tab==='wishes'){h+=`<div class="row" data-tip="rewards">${ico('gift',24)}<div class="grow"><span class="lbl">${s.lhp.toLocaleString()} happiness points</span><div class="small">Fulfilled wishes earn points for lifetime rewards.</div></div><button class="btn sm primary" data-a="rewards">Rewards</button></div>`;
   h+=s.wishes.length?s.wishes.map(w=>`<div class="row" data-tip="wish">${ico('star',24)}<div class="grow"><span class="lbl">${esc(w.txt)}</span><div class="small">+${w.pts.toLocaleString()} points</div></div><button class="btn sm" data-a="dropwish" data-id="${w.id}" aria-label="Dismiss wish">${SVG.close}</button></div>`).join(''):`<div class="row small">New wishes will appear soon.</div>`;}
  if(el._h!==h){el._h=h;el.innerHTML=h;}},
 renderPortraits(){const el=$('#portraits');const hh=household();if(G.mode!=='live'||hh.length<2){el.innerHTML='';el._k='';return;}
  const k=hh.map(p=>p.id+p.appKey+(p.id===G.sel)+(!!p.away)+moodLevel(moodScore(p)).id).join();if(el._k===k)return;el._k=k;el.innerHTML='';
  for(const p of hh){const b=document.createElement('button');b.className='pbtn'+(p.id===G.sel?' sel':'')+(p.away?' away':'');b.dataset.id=p.id;b.dataset.tip='sim:'+p.id;b.style.setProperty('--mood',moodLevel(moodScore(p)).c);b.setAttribute('aria-label','Select '+p.name);b.appendChild(pcanvas(p));
   if(p.away){const bd=document.createElement('span');bd.className='badge';bd.innerHTML=ico(p.away.kind==='work'?'job':p.away.kind==='out'?'map':'fitness',16);b.appendChild(bd);}el.appendChild(b);}},
 // ---------- modes ----------
 setMode(m){if(m===G.mode)return;if(BB.autoWalls&&m!=='build'){BB.autoWalls=0;setWallsUp(false);}
  if(m==='live'&&G.fresh&&G.started){const miss=homeChecks().filter(c=>!c.ok);const go=()=>{G.fresh=false;this.setMode('live');sfx('good');toast(`Welcome home! The ${household()[0].last} household moved in.`,'home');autosave(true);};
   if(miss.length){this.confirm('Move in now?',`Your home is still missing: ${miss.map(c=>esc(c.l.toLowerCase())).join(', ')}. Needs start dropping once the clock runs.`,'Move in anyway',go);return;}G.fresh=false;setTimeout(()=>toast(`Welcome home! The ${household()[0].last} household moved in.`,'home'),50);sfx('good');}
  this.ctxClose();if(m!=='live'&&this.welcomeOn)this.hideWelcome();G.mode=m;$('#sheet').classList.toggle('hidden',m!=='live');$('#buy').classList.toggle('hidden',m!=='buy');$('#build').classList.toggle('hidden',m!=='build');
  $('#queue').classList.toggle('hidden',m!=='live');BB.cancel();if(m==='buy')BB.renderBuy();if(m==='build')BB.renderBuild();if(m==='live')repathAll();this.dirty=true;this.layout();},
 // ---------- context menu ----------
 ctxOpen(title,sub,opts,sx,sy,cats){const el=$('#ctx');this.ctxData={title,sub,opts,sx,sy,cats};
  let h=`<h3>${esc(title)}</h3>${sub?`<div class="sub">${sub}</div>`:''}`;
  if(cats){h+=`<div class="cats">${cats.list.map(c=>`<button data-c="${c}" class="${c===cats.on?'on':''}">${c}</button>`).join('')}</div>`;}
  h+=opts.map((o,i)=>`<button class="opt" data-i="${i}" ${o.dis?'disabled':''}>${ico(o.icon||'star',24)}<span>${esc(o.label)}${o.note?`<small>${esc(o.note)}</small>`:''}</span></button>`).join('');
  if(!opts.length)h+=`<div class="sub">Nothing to do here right now.</div>`;
  el.innerHTML=h;el.classList.remove('hidden');
  el.onclick=e=>{const c=e.target.closest('[data-c]');if(c&&cats){cats.pick(c.dataset.c);return;}const b=e.target.closest('.opt');if(!b)return;const o=opts[+b.dataset.i];if(!o||o.dis)return;AU.init();sfx('click');if(!o.keep)this.ctxClose();o.fn();};
  const r=el.getBoundingClientRect(),W2=innerWidth,H2=innerHeight;let x=clamp(sx-r.width/2,10,W2-r.width-10),y=sy-r.height-24;if(y<70)y=clamp(sy+24,70,H2-r.height-10);el.style.left=x+'px';el.style.top=y+'px';},
 ctxClose(){$('#ctx').classList.add('hidden');this.ctxData=null;},
 objMenu(o,sx,sy){const s=selSim();const d=o.def;if(!s){return;}if(s.away){toast(`${s.first} isn't home right now`,'job');return;}
  const opts=[];let sub='';
  if(d.plot){const st=o.state;sub=st.crop?`${CROPS[st.crop].l} · ${Math.floor(st.g)}% grown · water ${Math.round(st.water)}%`:G.season===3?'Frozen for winter':'Empty and ready to plant';}
  if(o.type==='easel'&&o.state.art)sub=`Painting in progress: ${Math.floor(o.state.prog||0)}%`;
  if(o.type==='mailbox')sub=G.bills?`Bills due: ${money(G.bills.amount)} by ${DAYS[wday(G.bills.due)]} ${clockStr(G.bills.due)}`:'No mail today';
  for(const id of d.acts||[]){const R=ACTS[id];if(!R)continue;const av=R.avail?R.avail(s,o):true;
   if(R.menu==='recipes'){opts.push({label:R.l,icon:R.i,dis:av!==true,note:av!==true?av:'',keep:1,fn:()=>this.recipeMenu(s,o,R.group,sx,sy)});continue;}
   if(R.menu==='crops'){opts.push({label:R.l,icon:R.i,dis:av!==true,note:av!==true?av:'',keep:1,fn:()=>this.cropMenu(s,o,sx,sy)});continue;}
   if(R.menu==='grill'){opts.push({label:R.l,icon:R.i,keep:1,fn:()=>this.grillMenu(s,o,sx,sy)});continue;}
   if(R.ui){opts.push({label:R.l,icon:R.i,fn:()=>this.careers(s)});continue;}
   if(id==='cleanAll'){opts.push({label:R.l,icon:R.i,dis:av!==true,note:av!==true?av:'',fn:()=>{for(const it of G.items.filter(i=>i.kind==='dirty').slice(0,4))enqueue(s,cleanAct(s,it));}});continue;}
   opts.push({label:R.l,icon:R.i,dis:av!==true,note:av!==true?av:'',fn:()=>{const a=R.build(s,o);if(a)enqueue(s,a);}});}
  this.ctxOpen(d.n,sub||OBJ_DESC[o.type]||'',opts,sx,sy);},
 recipeMenu(s,o,group,sx,sy){const lv=s.level('cooking');const opts=RECIPES.map(r=>{const lock=r.lvl>lv,pro=r.produce&&totalProduce()<r.produce,need=r.needs&&!(G.produce[r.needs]>0);
  return{label:r.l,icon:'food',dis:lock||pro||need||G.money<r.cost,note:lock?`Needs Cooking ${r.lvl}`:pro?`Needs ${r.produce} garden produce`:need?`Needs a ${r.needs}`:(r.cost?money(r.cost):'Free from the garden'),fn:()=>{const a=cookAct(s,o.def.fridge?o:nearestObj(s,x=>x.def.fridge),r,group);if(a)enqueue(s,a);else toast('You need a stove to cook','cooking');}};});
  this.ctxOpen(group?'Cook for everyone':'Cook a meal',`${esc(s.first)}'s Cooking: level ${lv}`,opts,sx,sy);},
 grillMenu(s,o,sx,sy){const lv=s.level('cooking');this.ctxOpen('Grill',`Cooking level ${lv}`,GRILL.map(r=>{const lock=r.lvl>lv,pro=r.produce&&totalProduce()<r.produce;return{label:r.l,icon:'fire',dis:lock||pro||G.money<r.cost,note:lock?`Needs Cooking ${r.lvl}`:pro?'Needs garden produce':money(r.cost),fn:()=>{const a=cookAct(s,null,r,household().filter(p=>p.onLot).length>1,o);if(a)enqueue(s,a);}};}),sx,sy);},
 cropMenu(s,o,sx,sy){const lv=s.level('gardening');this.ctxOpen('Plant seeds',`${esc(s.first)}'s Gardening: level ${lv}`,Object.entries(CROPS).map(([k,c])=>({label:c.l,icon:'gardening',dis:c.lvl>lv||G.money<c.cost,note:c.lvl>lv?`Needs Gardening ${c.lvl}`:`Seeds ${money(c.cost)} · sells for ${money(c.sell)} each`,fn:()=>enqueue(s,plantAct(s,o,k))})),sx,sy);},
 itemMenu(it,sx,sy){const s=selSim();if(!s||s.away)return;const opts=[];
  if(it.kind==='meal'){opts.push({label:'Eat',icon:'food',note:it.servings>1?`${it.servings} servings left`:'',fn:()=>enqueue(s,eatAct(s,it))});opts.push({label:'Throw Out',icon:'remove',fn:()=>removeItem(it)});}
  if(it.kind==='dirty')opts.push({label:'Clean Up',icon:'hygiene',fn:()=>enqueue(s,cleanAct(s,it))});
  if(it.kind==='puddle')opts.push({label:'Mop Up',icon:'hygiene',fn:()=>enqueue(s,cleanAct(s,it))});
  this.ctxOpen(it.kind==='meal'?it.label:it.kind==='dirty'?'Dirty Dishes':'Puddle',it.kind==='meal'?['Burnt','Okay','Good','Great','Amazing'][it.q]+' quality':'',opts,sx,sy);},
 simMenu(t,sx,sy){const s=selSim();if(!s)return;
  if(t.role==='household'&&t.id===s.id){const opts=[{label:'Go Jogging',icon:'fitness',note:'An hour around the block',fn:()=>enqueue(s,A('jog','Go Jogging','fitness',[{k:'walk',x:pick([1,MW-2]),y:SIDEY},{k:'leave',kind:'jog',dur:60}]))},
    {label:'Use the Phone',icon:'phone',fn:()=>this.phone()},{label:'Change Look',icon:'smile',fn:()=>this.cas('edit',s)},
    {label:'Cheer Up',icon:'star',note:'A little happy dance',fn:()=>enqueue(s,A('cheer','Cheer','star',[{k:'wait',pose:'cheer',min:3,rates:{fun:60}}]))}];
   if(s.act||s.queue.length)opts.unshift({label:'Stop Everything',icon:'remove',fn:()=>clearQueue(s)});
   this.ctxOpen(s.name,`${moodLevel(moodScore(s)).l} · ${s.traits.map(x=>TRAITS[x].l).join(', ')}`,opts,sx,sy);return;}
  if(s.away){toast(`${s.first} isn't home right now`,'job');return;}
  const r=rel(s,t);const sub=`${relLabel(r)}${t.visit&&t.visit.kind==='walker'?' · walking by':t.role==='household'?' · household':' · visiting'}`;
  const cats=['Friendly','Romantic','Mean','Special'];let on=this._cat&&cats.includes(this._cat)?this._cat:'Friendly';
  const build=()=>{const opts=[];if(t.role==='household'&&t.onLot&&!t.away)opts.push({label:`Control ${t.first}`,icon:'leaf',fn:()=>selectSim(t,true)});
   for(const[k,S]of Object.entries(SOCIALS)){if(S.cat!==on)continue;if(!S.req(r,s,t))continue;opts.push({label:S.l,icon:S.icon||'social',fn:()=>{if(t.visit&&t.visit.kind==='walker'){t.visit.waitUntil=G.time+40;t.path=null;}enqueue(s,socialAct(s,t,k));}});}
   if(on==='Romantic'&&!opts.length)opts.push({label:'Not close enough yet',icon:'heart',dis:1,note:'Build friendship first, then flirt'});
   return opts;};
  const cs={list:cats,on,pick:(c)=>{this._cat=c;cs.on=c;on=c;this.ctxOpen(t.name,sub,build(),sx,sy,cs);}};
  this.ctxOpen(t.name,sub,build(),sx,sy,cs);},
 // ---------- dialogs ----------
 modal(html,cancel){this.mCancel=cancel||null;$('#mcard').classList.remove('wide');$('#mcard').innerHTML=html;$('#modal').classList.remove('hidden');this.ctxClose();},
 closeModal(){$('#modal').classList.add('hidden');$('#mcard').innerHTML='';this.mCancel=null;if(this.mq.length){const f=this.mq.shift();setTimeout(f,60);}},
 modalOpen(){return!$('#modal').classList.contains('hidden')||!$('#cas').classList.contains('hidden');},
 confirm(title,body,ok,fn){this.modal(`<h2>${esc(title)}</h2><p>${body}</p><div class="actions"><button class="btn" id="mno">Cancel</button><button class="btn primary" id="myes">${esc(ok)}</button></div>`,()=>{});$('#mno').onclick=()=>this.closeModal();$('#myes').onclick=()=>{this.closeModal();fn();};},
 queueModal(f){if(this.modalOpen())this.mq.push(f);else f();},
 workEvent(s,ev){this.queueModal(()=>{const C=CAREERS[s.job?s.job.career:'tech'];sfx('pop');
  this.modal(`<h2>${esc(s.first)} at work</h2><p class="small">${esc(C.l)} · ${esc(C.lv[s.job?s.job.level:0][0])}</p><p>${esc(ev.t)}</p><div class="actions"><button class="btn" id="wb">${esc(ev.b[0])}</button><button class="btn primary" id="wa">${esc(ev.a[0])}</button></div>`);
  const go=(ch)=>{const res=applyWorkChoice(s,ch);$('#mcard').innerHTML=`<h2>${esc(ch[0])}</h2><p>${esc(res)}</p><div class="actions"><button class="btn primary" id="wok">Back to it</button></div>`;$('#wok').onclick=()=>this.closeModal();UI.dirty=true;};
  $('#wa').onclick=()=>go(ev.a);$('#wb').onclick=()=>go(ev.b);});},
 paintingDone(p){this.queueModal(()=>{sfx('wish');const[c,g]=mkc(12,10);artPixels(g,p.art,0,0,12,10);const url=c.toDataURL();
  this.modal(`<h2>${esc(p.painter)} finished “${esc(p.title)}”</h2><img src="${url}" width="192" height="160" alt="The new painting" style="image-rendering:pixelated;display:block;margin:6px auto 8px;border:6px solid #c9a227;border-radius:4px"><p>Quality: <b>${esc(p.tier)}</b>. A gallery will pay <b>${money(p.value)}</b>.</p>
   <div class="actions"><button class="btn" id="pk">Keep it to hang</button><button class="btn good" id="ps">Sell for ${money(p.value)}</button></div>`);
  $('#ps').onclick=()=>{earn(p.value);this.closeModal();};$('#pk').onclick=()=>{G.inv.push({id:uid('v'),kind:'painting',title:p.title,art:p.art,value:p.value});toast('Saved to your inventory. Hang it from Buy mode.','painting');this.closeModal();};});},
 careers(s){if(!s)return;const rows=Object.entries(CAREERS).map(([k,C])=>{const L=C.lv[0];return`<div class="row">${ico(C.skill,24)}<div class="grow"><span class="lbl">${C.l}: ${esc(L[0])}</span><div class="small">${money(L[1])}/hr · ${C.days.map(d=>DAYS[d]).join(' ')} · ${hr12(L[2])} to ${hr12(L[3])} · promoted with ${SKILLS[C.skill].l}</div><div class="small">Top job: ${esc(C.lv[4][0])}, ${money(C.lv[4][1])}/hr</div></div><button class="btn sm primary" data-k="${k}" ${s.job&&s.job.career===k?'disabled':''}>Join</button></div>`;}).join('');
  this.modal(`<h2>Find a job for ${esc(s.first)}</h2>${s.job?`<p class="small">Joining a new career replaces ${esc(CAREERS[s.job.career].l)}.</p>`:''}${rows}<div class="actions"><button class="btn" id="mx">Close</button></div>`,()=>{});
  $('#mcard').onclick=e=>{const b=e.target.closest('[data-k]');if(b&&!b.disabled){joinCareer(s,b.dataset.k);this.closeModal();}};$('#mx').onclick=()=>this.closeModal();},
 rewards(s){const rows=REWARDS.map(r=>{const own=s.reward(r.id);return`<div class="row">${ico('gift',24)}<div class="grow"><span class="lbl">${r.l}</span><div class="small">${r.d}</div></div><button class="btn sm ${own?'':'primary'}" data-r="${r.id}" ${own||s.lhp<r.cost?'disabled':''}>${own?'Owned':r.cost.toLocaleString()}</button></div>`;}).join('');
  this.modal(`<h2>Lifetime rewards</h2><p class="small">${esc(s.first)} has ${s.lhp.toLocaleString()} happiness points.</p>${rows}<div class="actions"><button class="btn" id="mx">Close</button></div>`,()=>{});
  $('#mcard').onclick=e=>{const b=e.target.closest('[data-r]');if(!b||b.disabled)return;const r=REWARDS.find(x=>x.id===b.dataset.r);if(s.lhp<r.cost)return;s.lhp-=r.cost;s.rewards.push(r.id);sfx('promo');toast(`${s.first} earned ${r.l}`,'gift');this.rewards(s);UI.dirty=true;};$('#mx').onclick=()=>this.closeModal();},
 phone(){const s=selSim();if(!s)return;if(s.away){toast(`${s.first} is away. Select someone at home.`,'phone');return;}
  const known=G.people.filter(p=>p.role==='neighbor'&&!p.onLot).map(p=>[p,relPeek(s,p)]).filter(([p,r])=>r&&r.met).sort((a,b)=>b[1].f-a[1].f);
  const late=hourOf(G.time)>=22||hourOf(G.time)<7;const prod=goodsCount();const prodVal=goodsValue(1);
  const h=`<h2>${esc(s.first)}'s phone</h2>
  <div class="sec">Friends</div>${known.length?known.map(([p,r])=>`<div class="row"><img class="ico pp" src="${pcanvas(p).toDataURL()}" width="36" height="36" alt=""><div class="grow"><span class="lbl">${esc(p.name)}</span><div class="small">${relLabel(r)}</div></div><button class="btn sm" data-c="${p.id}">Chat</button><button class="btn sm primary" data-v="${p.id}" ${late?'disabled':''}>Invite</button></div>`).join(''):`<p class="small">No numbers yet. Meet neighbors when they walk past on the sidewalk.</p>`}
  <div class="sec">Around town</div>
  <div class="row">${ico('food',24)}<div class="grow"><span class="lbl">Order pizza</span><div class="small">$30 · 4 slices, here in about 40 minutes</div></div><button class="btn sm primary" data-x="pizza" ${G.money<30?'disabled':''}>Order</button></div>
  <div class="row">${ico('star',24)}<div class="grow"><span class="lbl">Throw a party</span><div class="small">$80 · up to 4 neighbors arrive in an hour</div></div><button class="btn sm primary" data-x="party" ${G.money<80||late||G.party?'disabled':''}>Plan</button></div>
  <div class="row">${ico('gardening',24)}<div class="grow"><span class="lbl">Sell harvest and fish</span><div class="small">${prod?`${prod} items for ${money(prodVal)}. The Saturday market pays more.`:'Nothing to sell yet'}</div></div><button class="btn sm" data-x="sell" ${prod?'':'disabled'}>Sell</button></div>
  <div class="row">${ico('job',24)}<div class="grow"><span class="lbl">${s.job?esc(CAREERS[s.job.career].lv[s.job.level][0]):'Find a job'}</span><div class="small">${s.job?'Change careers':'Six careers are hiring'}</div></div><button class="btn sm" data-x="job">Careers</button></div>
  ${G.bills?`<div class="row">${ico('coin',24)}<div class="grow"><span class="lbl">Pay bills</span><div class="small">${money(G.bills.amount)} due ${DAYS[wday(G.bills.due)]}</div></div><button class="btn sm good" data-x="bills">Pay</button></div>`:''}
  <div class="actions"><button class="btn" id="mx">Hang up</button></div>`;
  this.modal(h,()=>{});$('#mx').onclick=()=>this.closeModal();
  $('#mcard').onclick=e=>{const b=e.target.closest('button');if(!b||b.disabled)return;
   if(b.dataset.c){const p=personById(b.dataset.c);enqueue(s,A('call','Call '+p.first,'phone',[{k:'wait',pose:'phone',min:20,max:20,rates:{social:36,fun:6},onEnd:(s)=>{const r=rel(s,p);r.f=clamp(r.f+5,-100,100);r.last=G.time;wishEvent(s,'call');}}]));this.closeModal();}
   if(b.dataset.v){const p=personById(b.dataset.v);const r=rel(s,p);enqueue(s,A('call','Invite '+p.first,'phone',[{k:'wait',pose:'phone',min:4,max:4,onEnd:(s)=>{if(chance(.55+r.f/120)){G.timers.push({at:Math.floor(G.time)+ri(30,60),type:'visit',id:p.id});toast(`${p.first} is on the way over`,'home');}else toast(`${p.first} is busy right now`,'phone');}}]));this.closeModal();}
   const x=b.dataset.x;if(x==='pizza'){pay(30);G.timers.push({at:Math.floor(G.time)+40,type:'pizza'});toast('Pizza ordered. It will arrive in about 40 minutes.','food');this.closeModal();}
   if(x==='party'){pay(80);G.timers.push({at:Math.floor(G.time)+60,type:'party',host:s.id});toast('Party planned! Guests arrive in an hour.','star');this.closeModal();}
   if(x==='sell'){const v=sellGoods(1);toast(`Sold everything for ${money(v)}`,'gardening');this.closeModal();}
   if(x==='job'){this.closeModal();this.careers(s);}if(x==='bills'){payBills();this.closeModal();}};},
 menu(){const fw=G.freeWill,cl=CLOUD.ok?'Saved to your account and this device':'Saved on this device';
  this.modal(`<h2>Maplewood</h2><p class="small">${esc(cl)}. The game also saves every game hour.</p>
  <div class="sec">Sound</div><div class="line" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm ${G.settings.music?'primary':''}" data-x="music">Music ${G.settings.music?'on':'off'}</button><button class="btn sm ${G.settings.sfx?'primary':''}" data-x="sfx">Sounds ${G.settings.sfx?'on':'off'}</button></div>${G.settings.music&&MUS.track?`<div class="row">${ico('note',24)}<div class="grow"><span class="lbl">${esc(MUS.T[MUS.track])}</span><div class="small">Now playing</div></div><button class="btn sm" data-x="nextsong">Next song</button></div>`:''}
  <div class="sec">Display</div><div class="line" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">${GLS.ok?`<button class="btn sm ${R.smooth?'primary':''}" data-x="smooth">Smooth art ${R.smooth?'on':'off'}</button><span class="small">${R.smooth?'Rounded, easy-to-read pixels':'Classic crisp pixels'}</span>`:'<span class="small">Smooth art needs WebGL, which this browser has turned off.</span>'}</div>
  <div class="sec">Free will</div><div style="display:flex;gap:8px;flex-wrap:wrap">${[['full','Everyone'],['others','All but selected'],['off','Off']].map(([k,l])=>`<button class="btn sm ${fw===k?'primary':''}" data-f="${k}">${l}</button>`).join('')}</div>
  <p class="small">With free will, people look after their own needs when you leave them idle.</p>
  <div class="actions" style="justify-content:flex-start"><button class="btn" data-x="help">How to play</button><button class="btn" data-x="tour">Replay tour</button><button class="btn" data-x="cas">New household</button><button class="btn" data-x="harts">Restart with the Harts</button><button class="btn good" data-x="save">Save now</button><button class="btn" data-x="title">Main menu</button></div>
  <div class="actions"><button class="btn primary" id="mx">Back to the game</button></div>`,()=>{});
  $('#mx').onclick=()=>this.closeModal();
  $('#mcard').onclick=e=>{const b=e.target.closest('button');if(!b)return;const x=b.dataset.x;
   if(b.dataset.f){G.freeWill=b.dataset.f;this.menu();}
   if(x==='music'){G.settings.music=!G.settings.music;AU.init();AU.apply();this.menu();}if(x==='sfx'){G.settings.sfx=!G.settings.sfx;this.menu();}if(x==='nextsong'){MUS.skip();setTimeout(()=>{if(this.modalOpen())this.menu();},80);}if(x==='smooth'){G.settings.smooth=!R.smooth;applySmooth(G.settings.smooth);if(G.mode==='buy')BB.renderBuy();this.menu();}
   if(x==='save'){autosave(true);toast('Game saved','star');this.closeModal();}if(x==='title'){autosave(true);G.loadedAt=Date.now();this.closeModal();this.welcome('continue');}if(x==='help')this.help();if(x==='tour'){this.closeModal();TUT.start(G.fresh?'fresh':'harts',true);}
   if(x==='cas'){this.closeModal();this.cas('new');}if(x==='harts')this.confirm('Restart with the Harts?','This replaces your current household and house.','Restart',()=>{startSample();centerHome();autosave(true);});};},
 help(){const rows=[[ico('leaf',24,'',{o:'#6fbd52'}),'Tap furniture to choose what your person does. Actions line up at the top left; tap one to cancel it.'],
   [ico('hammer',24),'In Build mode, Room draws four walls and a floor in one drag. Add a door so people can get in.'],
   [ico('walk',24),'Tap the floor to walk there. Drag to look around. Pinch, scroll or use the magnifier buttons to zoom.'],
   [ico('star',24),'Press and hold any bar, button, person or object to see what it is and what it does. With a mouse, just hover.'],
   [ico('hunger',24),'Keep the six needs up. Low needs bring bad moodlets; good moods make work and practice go better.'],
   [ico('people',24),'Tap a neighbor walking by to introduce yourself. Friends can be invited over, romanced, and asked to move in.'],
   [ico('job',24),'Get a job from the phone. The carpool comes 30 minutes before each shift. Build the career skill to get promoted.'],
   [ico('sofa',24),'Buy mode places furniture; Build mode draws walls, doors, windows, floors and wallpaper. The game pauses in both.'],
   [ico('star',24),'Wishes earn happiness points. Spend them on lifetime rewards in the Wishes tab.']];
  if(DESK.mouse)rows.push([ico('sun',24),'Keys: Space pauses and 1 to 3 set the speed. Arrows or WASD move the camera, and + and - zoom. H puts the walls up or down. In Buy mode, R turns an item and Enter places it. Esc closes menus and the town map.']);
  this.modal(`<h2>How to play</h2>${rows.map(([i,t])=>`<div class="row">${i}<div class="grow">${esc(say(t))}</div></div>`).join('')}
  <div class="actions"><button class="btn primary" id="mx">Got it</button></div>`,()=>{});$('#mx').onclick=()=>this.closeModal();},
 offerCloud(d){this.queueModal(()=>this.modal(`<h2>Newer save found</h2><p>Your account has a saved game from ${esc(DAYS[wday(d.time)])} ${esc(clockStr(d.time))}, day ${dayOf(d.time)+1}, with ${money(d.money)}. Load it?</p><div class="actions"><button class="btn" id="mn">Keep this one</button><button class="btn primary" id="my">Load it</button></div>`,()=>{}));
  setTimeout(()=>{const y=$('#my'),n=$('#mn');if(y)y.onclick=()=>{loadGame(d);G.loadedAt=d.savedAt;centerHome();this.closeModal();toast('Loaded your saved game','star');};if(n)n.onclick=()=>this.closeModal();},80);},
 // the start menu: continue the saved game, or start a new one (the Harts, or a household of your own)
 welcome(kind,step){const el=$('#welcome'),has=kind==='continue',hh=household(),last=hh[0]?hh[0].last:'';this.welcomeOn=true;G.paused=true;this.ctxClose();
  const title=`<h1 class="px">${ico('leaf',32,'',{o:'#e8662e'})}Maplewood</h1>`;let body;
  if(has&&step!=='new'){let where='';try{const l=homeLot();where=l?`${lotName(l)}, ${TOWN.name}`:'';}catch(_){}
   const faces=hh.map(p=>`<img src="${pcanvas(p).toDataURL()}" alt="" width="44" height="44">`).join('');
   body=`<p class="wsub">Welcome back.</p><div class="wsave"><div class="wfaces">${faces}</div><div class="grow"><b>The ${esc(last)} household</b>
    <div class="small">${esc(hh.map(p=>p.first).join(', '))}${where?' · '+esc(where):''}</div>
    <div class="small">Day ${dayOf(G.time)+1} · ${DAYS[wday(G.time)]} ${clockStr(G.time)} · ${money(G.money)}</div>${G.loadedAt?`<div class="small">Last played ${esc(agoText(G.loadedAt))}</div>`:''}</div></div>
    <div class="wacts"><button class="btn primary big" id="wp">Continue</button><button class="btn" id="wn">New game</button></div>`;}
  else body=`<p class="wsub">${has?'Start a new game':esc(say('Meet Jamie and Alex Hart, just settling in on Maple Lane in the town of Maplewood this fall. Tap anything in the house to give them something to do, or start fresh with people of your own.'))}</p>
    <div class="wopts"><button class="wopt" id="wp">${ico('home',28)}<span><b>Play the Harts</b><span>A furnished cottage on Maple Lane, ready to move in.</span></span></button>
    <button class="wopt" id="wn">${ico('people',28)}<span><b>Create a household</b><span>Make your own people, then pick a home in a brand new town.</span></span></button></div>
    ${has?`<p class="small wwarn">A new game replaces your saved game with the ${esc(last)} household.</p><div class="wacts"><button class="btn" id="wb">Back</button></div>`:''}`;
  el.innerHTML=`<div class="wcard card">${title}${body}<p class="small wnote">Your game saves by itself in this browser, on this device.</p></div>`;
  el.classList.remove('hidden');$('#sheet').classList.add('hidden');document.body.classList.add('wel');
  if(has&&step!=='new'){$('#wp').onclick=()=>{AU.init();sfx('good');this.hideWelcome();};$('#wn').onclick=()=>{AU.init();sfx('click');this.welcome('continue','new');};return;}
  const go=fn=>{AU.init();if(has)this.confirm('Start a new game?',`Your saved game with the ${esc(last)} household will be replaced.`,'Start new game',fn);else fn();};
  $('#wp').onclick=()=>go(()=>{sfx('good');if(has){startSample();centerHome();autosave(true);}this.hideWelcome();TUT.start('harts');});
  $('#wn').onclick=()=>go(()=>{this.hideWelcome();this.cas('new',null,{back:has?'continue':'new'});});
  if(has)$('#wb').onclick=()=>{sfx('click');this.welcome('continue');};},
 hideWelcome(){this.welcomeOn=false;G.paused=false;document.body.classList.remove('wel');$('#welcome').classList.add('hidden');if(G.mode==='live')$('#sheet').classList.remove('hidden');this.dirty=true;this.layout();
  if(G.fresh&&G.mode==='live')this.setMode(G.lot==='shell'?'buy':'build');
  setTimeout(()=>{if(TUT.active())return;try{if(localStorage.getItem('mapleLane.tipHint'))return;localStorage.setItem('mapleLane.tipHint','1');}catch(_){}toast('Tip: press and hold anything to see what it is and what it does.','star');},1800);},
};

// ---------- Create a Sim ----------
function randomLook(body){body=body||(chance(.5)?'f':'m');const f=body==='f';
 return{body,skin:ri(0,5),hair:pick(f?['long','bob','ponytail','bun','curly','short']:['short','curly','spiky','buzz','bald','short']),hairC:pick(HAIR_COLS.slice(0,7)),top:pick(TOP_COLS),topS:pick(['tee','long']),bot:pick(BOT_COLS),botS:pick(f?['pants','shorts','skirt','skirt']:['pants','pants','shorts']),shoes:pick(SHOE_COLS),beard:!f&&chance(.3)?1:0};}
function randomPerson(last,body){const app=randomLook(body);return{first:pick(app.body==='f'?FIRSTS_F:FIRSTS_M),last,app,traits:[],autoName:1};}
function randomTraits(){const L=[];const keys=Object.keys(TRAITS);while(L.length<3){const k=pick(keys);if(L.includes(k)||L.some(t=>TRAITS[t].opp===k||TRAITS[k].opp===t))continue;L.push(k);}return L;}
function previewSprite(app,dir,pose,f){const tmp={id:'cas',app,appKey:'cas'+JSON.stringify(app),_cols:null};return simSprite(tmp,dir,pose||'idle',f||0,'happy');}
UI.cas=function(mode,sim,opt){const st={mode,sim,cur:0,dir:'down',members:[],back:opt&&opt.back};
 if(mode==='edit')st.members=[{first:sim.first,last:sim.last,app:Object.assign({},sim.app),traits:sim.traits.slice()}];
 else st.members=[randomPerson(pick(LASTS))];
 this.casSt=st;$('#cas').classList.remove('hidden');this.ctxClose();this.renderCas();};
UI.renderCas=function(){const st=this.casSt,m=st.members[st.cur],a=m.app,el=$('#cas');const sw=(k,cols,val)=>cols.map((c,i)=>`<button class="sw ${(typeof val==='number'?i===val:c===val)?'on':''}" style="background:${c}" data-k="${k}" data-v="${typeof val==='number'?i:c}" aria-label="${k} option ${i+1}"></button>`).join('');
 const hairBtns=HAIRS.map(hs=>`<button class="opt-ico ${a.hair===hs?'on':''}" data-k="hair" data-v="${hs}" aria-label="${hs} hair"><canvas data-hp="${hs}" width="18" height="18"></canvas></button>`).join('');
 const seg=(k,opts,val)=>opts.map(([v,l])=>`<button class="btn sm ${val===v?'primary':''}" data-k="${k}" data-v="${v}">${l}</button>`).join('');
 const tsel=m.traits;const traits=Object.entries(TRAITS).map(([k,t])=>{const on=tsel.includes(k),block=!on&&(tsel.length>=3||tsel.some(x=>TRAITS[x].opp===k||t.opp===x));return`<button class="trait ${on?'on':''}" data-t="${k}" ${block?'disabled':''}>${t.l}<small>${t.d}</small></button>`;}).join('');
 el.innerHTML=`<div class="wrap"><div><h2>${st.mode==='edit'?'Change look':'Create a household'}</h2>
  ${st.mode==='new'?`<div class="members" style="margin-top:10px">${st.members.map((x,i)=>`<button class="btn sm ${i===st.cur?'primary':''} ${st.need&&x.traits.length<3?'needm':''}" data-mem="${i}">${esc(x.first||'New')}${x.traits.length<3?` <small>${x.traits.length}/3</small>`:''}</button>`).join('')}${st.members.length<4?'<button class="btn sm" data-mem="add">+ Add person</button>':''}${st.members.length>1?'<button class="btn sm" data-mem="del">Remove</button>':''}</div>`:''}
  <div class="stage" style="margin-top:10px"><canvas id="casPrev" width="18" height="30" style="width:108px;height:180px"></canvas><button class="round rot" style="left:10px;transform:scaleX(-1)" data-rot="-1" aria-label="Turn left">${SVG.rot}</button><button class="round rot" style="right:10px" data-rot="1" aria-label="Turn right">${SVG.rot}</button></div></div>
  <div class="card opts"><div class="namegrid"><div><label for="fn">First name</label><input id="fn" maxlength="14" value="${esc(m.first)}" autocomplete="off"></div><div><label for="ln">Last name</label><input id="ln" maxlength="16" value="${esc(m.last)}" autocomplete="off"></div></div>
  <label>Gender</label><div class="line">${seg('body',[['f','Female'],['m','Male']],bodyOf(a))}</div>
  <label>Skin</label><div class="line">${sw('skin',SKINS,a.skin)}</div>
  <label>Hair</label><div class="line">${hairBtns}</div><div class="line">${sw('hairC',HAIR_COLS,a.hairC)}</div>
  ${bodyOf(a)==='m'?`<label>Facial hair</label><div class="line">${seg('beard',[[0,'None'],[1,'Beard']],a.beard?1:0)}</div>`:''}
  <label>Top</label><div class="line">${seg('topS',[['tee','T-shirt'],['long','Long sleeves']],a.topS)}</div><div class="line">${sw('top',TOP_COLS,a.top)}</div>
  <label>Bottom</label><div class="line">${seg('botS',[['pants','Pants'],['shorts','Shorts'],['skirt','Skirt']],a.botS)}</div><div class="line">${sw('bot',BOT_COLS,a.bot)}</div>
  <label>Shoes</label><div class="line">${sw('shoes',SHOE_COLS,a.shoes)}</div>
  ${st.mode==='new'?`<label id="ctl" class="${tsel.length<3&&st.need?'need':''}">Traits (${tsel.length} of 3)${tsel.length<3?` · pick ${3-tsel.length} more`:''}</label><div class="traits">${traits}</div>`:''}</div></div>
  <div class="foot"><button class="btn" data-x="rand">Randomize</button>${G.started?'<button class="btn" data-x="cancel">Cancel</button>':''}<button class="btn primary ${st.mode==='new'&&st.members.some(x=>x.traits.length<3)?'off':''}" data-x="done">${st.mode==='edit'?'Done':'Choose a lot'}</button></div>`;
 el.querySelectorAll('canvas[data-hp]').forEach(c=>{const app=Object.assign({},a,{hair:c.dataset.hp});const sp=previewSprite(app,'down');c.getContext('2d').drawImage(sp,0,0,18,18,0,0,18,18);});
 this.drawCasPrev();
 $('#fn').oninput=e=>{m.first=e.target.value;m.autoName=0;};$('#ln').oninput=e=>{m.last=e.target.value;if(st.mode==='new')st.members.forEach(x=>x.last=m.last);};
 el.onclick=e=>{const b=e.target.closest('button');if(!b)return;AU.init();sfx('click');
  if(b.dataset.k){const k=b.dataset.k;let v=b.dataset.v;if(k==='skin'||k==='beard')v=+v;a[k]=v;if(k==='body'&&v==='f')a.beard=0;if(k==='body'&&m.autoName&&st.mode==='new')m.first=pick(v==='f'?FIRSTS_F:FIRSTS_M);this.renderCas();return;}
  if(b.dataset.t){const k=b.dataset.t;if(m.traits.includes(k))m.traits=m.traits.filter(x=>x!==k);else if(m.traits.length<3)m.traits.push(k);this.renderCas();return;}
  if(b.dataset.rot){const ds=['down','left','up','right'];st.dir=ds[(ds.indexOf(st.dir)+(+b.dataset.rot)+4)%4];this.drawCasPrev();return;}
  if(b.dataset.mem){if(b.dataset.mem==='add'){st.members.push(randomPerson(st.members[0].last));st.cur=st.members.length-1;}else if(b.dataset.mem==='del'){st.members.splice(st.cur,1);st.cur=0;}else st.cur=+b.dataset.mem;this.renderCas();return;}
  const x=b.dataset.x;if(x==='rand'){m.app=randomLook(bodyOf(m.app));if(st.mode==='new')m.traits=randomTraits();if(st.mode==='new'&&!m.first)m.first=pick(bodyOf(m.app)==='f'?FIRSTS_F:FIRSTS_M);this.renderCas();}
  if(x==='cancel'){$('#cas').classList.add('hidden');this.casSt=null;if(st.back)this.welcome(st.back);}
  if(x==='done'&&st.mode==='new'){const miss=st.members.findIndex(mm=>mm.traits.length<3);if(miss>=0){st.cur=miss;st.need=1;sfx('bad');this.renderCas();const L=$('#ctl');if(L)L.scrollIntoView({behavior:'smooth',block:'center'});return;}}
  if(x==='done'){if(st.mode==='edit'){const s=st.sim;s.app=Object.assign({},m.app);s.first=(m.first||s.first).trim().slice(0,14);s.last=(m.last||s.last).trim().slice(0,16);s.refreshApp();$('#cas').classList.add('hidden');this.casSt=null;UI.dirty=true;return;}
   for(const mm of st.members){mm.first=(mm.first||pick(FIRSTS)).trim().slice(0,14)||pick(FIRSTS);mm.last=(mm.last||st.members[0].last||pick(LASTS)).trim().slice(0,16);if(mm.traits.length<3){const fill=randomTraits().filter(t=>!mm.traits.includes(t)&&!mm.traits.some(x=>TRAITS[x].opp===t||TRAITS[t].opp===x));while(mm.traits.length<3&&fill.length)mm.traits.push(fill.shift());}}
   const defs=st.members.map(mm=>({first:mm.first,last:mm.last,app:mm.app,traits:mm.traits,skills:{}}));
   $('#cas').classList.add('hidden');TV.open('pick',{defs});}};};
UI.drawCasPrev=function(){const st=this.casSt;if(!st)return;const c=$('#casPrev');if(!c)return;const sp=previewSprite(st.members[st.cur].app,st.dir,'idle'),k=R.smooth?8:1;if(c.width!==18*k){c.width=18*k;c.height=30*k;c.style.imageRendering=R.smooth?'auto':'pixelated';}const g=c.getContext('2d');g.imageSmoothingEnabled=R.smooth;g.clearRect(0,0,c.width,c.height);g.drawImage(R.smooth?smoothSpr(sp,8):sp,0,0,c.width,c.height);};
function centerHome(){centerOn(14*T,10*T);}
function repathAll(){for(const s of G.people){if(!s.onLot)continue;if(s.path&&s.path.length){const last=s.path[s.path.length-1];if(!pathTo(s,last[0],last[1])){if(s.act)s.act.cancel=true;s.path=null;}}if(!s.inObj&&!freeTile(s.tx(),s.ty())){const[x,y]=nearestFree(s.tx(),s.ty());s.place(x,y);}}}
