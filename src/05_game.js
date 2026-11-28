// ================= GAME: state, time, work, visitors, weather, wishes, saving =================
const G={time:0,speed:1,money:0,people:[],sel:null,rels:{},objects:[],items:[],inv:[],produce:{},bills:null,timers:[],cars:[],
 season:2,seasonStart:2,weather:'clear',mode:'live',freeWill:'full',paused:false,day:0,settings:{music:true,sfx:true,smooth:true},stats:{},party:null,started:false,lot:'cottage',fresh:false,tut:{done:{}},town:{seed:2611},home:null,fish:{},ext:defaultExt()};
function pay(n,s){if(!n)return;G.money-=n;if(s&&s.onLot&&n>=3)fxText(s.x,s.y-30,'-'+money(n),'#ffb3a8');UI.dirty=true;}
function earn(n,s){if(!n)return;G.money+=n;if(s&&s.onLot)fxText(s.x,s.y-30,'+'+money(n),'#9fe870');sfx('cash');UI.dirty=true;for(const p of household())wishCheck(p);}

// ---------- the main step ----------
function gameStep(dm){
 const prev=Math.floor(G.time);G.time+=dm;const now=Math.floor(G.time);
 for(const s of G.people)if(s.onLot||s.away)simUpdate(s,dm);
 updateCars(dm);
 for(let m=prev+1;m<=now;m++)minuteTick(m);
}
function minuteTick(m){
 const d=dayOf(m),mm=m%60,h=Math.floor((m%1440)/60);
 if(d!==G.day){G.day=d;newDay(d);}
 if(mm===0)hourTick(h,d);
 for(const s of G.people)if(s.onLot||s.away)refreshMoodlets(s);
 syncObjectStates();plantsTick();workSchedule(m);timersTick(m);
 if(m%10===0)spawnTick(m);
 if(m%20===0)for(const s of household())wishCheck(s);
 if(G.bills&&G.time>=G.bills.due){const late=Math.round(G.bills.amount*1.1);if(G.money>=late){G.money-=late;toast(`Bills were paid late with a 10% fee: ${money(late)}`,'coin');G.bills=null;UI.dirty=true;}else repo();}
}
function syncObjectStates(){
 for(const o of G.objects)o._busy=0;
 for(const s of G.people){if(!s.onLot||!s.act)continue;const a=s.act,st=a.steps[a.si];if(!st)continue;const live=(st.k==='use'&&st.ph==='do')||(st.k==='wait'&&st.on);
  if(!live)continue;if(a.obj)a.obj._busy=(a.obj._busy||0)+1;if(st.obj)st.obj._busy=(st.obj._busy||0)+1;}
}
function hourTick(h,d){
 if(TOWN)for(const e of eventsOn(wday(G.time))){const p=TOWN.pois.find(q=>q.kind===e.poi);if(!p)continue;const go=G.mode==='live'&&!G.fresh?()=>TV.showPoi(e.poi):null;
  if(h===8&&e.from>8)toast(`Today: ${e.l} at ${p.name}, ${hr12(e.from)} to ${hr12(e.to)}.${go?' Tap to see it on the map.':''}`,'star',go);
  if(h===e.from)toast(`The ${e.l.toLowerCase()} is starting at ${p.name}.${go?' Tap to go.':''}`,'star',go);}
 if(h===6)for(const s of household())if(s.reward('penny')&&s.onLot){earn(75,s);toast(`${s.first} found $75 on the porch`,'coin');}
 if(h===9&&wday(G.time)===0&&!G.bills){const amt=Math.round(110+lotValue()*.018);G.bills={amount:amt,due:G.time+3*1440};toast(`Bills arrived: ${money(amt)}. Pay at the mailbox or by phone.`,'coin');sfx('bad');}
 for(const s of household()){if(s.wishes.length<3&&G.time>=s.wishCD)addWish(s);}
 if(h>=7&&h<=21&&chance(.5))spawnCar('traffic');
 if(G.started)autosave();
}
function newDay(d){
 const ns=(G.seasonStart+Math.floor(d/7))%4;
 if(ns!==G.season){G.season=ns;W.groundDirty=true;OBJ_SPR.clear();toast(`${SEASONS[ns]} has come to ${TOWN?TOWN.name:'the neighborhood'}`,ns===3?'snow':ns===2?'leaf':'sun');
  if(ns===3){for(const s of household())addMood(s,'firstSnow');let lost=0;for(const o of G.objects)if(o.def.plot&&o.state.crop){o.state={};lost++;}if(lost)toast('The first frost ended the garden season','gardening');}}
 const pr=[[.3,'rain'],[.1,'rain'],[.3,'rain'],[.55,'snow']][G.season];G.weather=chance(pr[0])?pr[1]:'clear';
 if(G.weather!=='clear')toast(G.weather==='rain'?'Rain is on the way today':'Snow is falling today',G.weather);
 for(const k in G.rels){const r=G.rels[k];if(r.last&&G.time-r.last>1440*2){if(Math.abs(r.f)>10&&!r.married)r.f+=r.f>0?-1:1;}}
 for(const s of household())if(s.job)s.job.pending=null;
}

// ---------- work ----------
function shiftOf(s){const C=CAREERS[s.job.career],L=C.lv[s.job.level];return{C,L,start:L[2],end:L[3],pay:L[1]};}
function workSchedule(m){
 for(const s of household()){const j=s.job;if(!j)continue;const{C,start,end}=shiftOf(s);const d=dayOf(m),wd=d%7,h=(m%1440)/60;
  if(!C.days.includes(wd)||j.day===d)continue;
  if(s.onLot&&!s.away&&j.pending!==d&&h>=start-.5&&h<start+.5){j.pending=d;callCarpool(s);}
  if(j.pending===d&&!s.away&&h>=start+1){j.pending=null;j.day=d;j.perf=clamp(j.perf-15,0,100);addMood(s,'skipped');toast(`${s.first} missed work. Performance dropped.`,'job');sfx('bad');carLeave(s.id);checkFired(s);}
  if(s.away&&s.away.kind==='jog'&&h>=start&&h<start+.02){j.day=d;j.perf=clamp(j.perf-15,0,100);toast(`${s.first} was out jogging and missed work`,'job');}
 }
}
function callCarpool(s){const car=spawnCar('carpool',s.id);toast(`The carpool is here for ${s.first}`,'job');sfx('pop');
 if(s.act){s.act.cancel=true;}const a=A('work','Go to Work','job',[{k:'walk',x:CURB.x,y:SIDEY},{k:'fn',fn:(s)=>boardCarpool(s)}]);a.user=true;s.queue.unshift(a);UI.dirty=true;}
function boardCarpool(s){const{start,end}=shiftOf(s);const d=dayOf(G.time),j=s.job;j.day=d;j.pending=null;
 const until=d*1440+end*60;goOffLot(s,'work',0);s.away={kind:'work',until,start:G.time,evAt:G.time+ri(60,Math.max(90,(end-start)*60-60)),mood0:moodScore(s)};
 carDepart(s.id);if(G.sel===s.id)selectNextSim();UI.dirty=true;}
function workTick(s,dm){const a=s.away;if(!a.evDone&&G.time>=a.evAt){a.evDone=1;if(chance(.45))UI.workEvent(s,pick(WORK_EVENTS));}}
function finishWork(s){const{C,L,pay:wage,start,end}=shiftOf(s);const j=s.job;const hours=end-start;const amt=Math.round(wage*hours);
 const m=(moodScore(s)+(s.away.mood0||0))/2;let gain=10+m/6+(s.level(C.skill)>=PROMO[Math.min(4,j.level+1)]?3:0)+(s.has('workaholic')?4:0);
 for(const n of NEED_IDS)if(s.needs[n]<15)gain-=3;if(s.reward('office'))gain*=1.3;gain=Math.round(clamp(gain,-15,30));
 j.perf=clamp(j.perf+gain,0,100);j.days=(j.days||0)+1;
 returnToLot(s,CURB.x,SIDEY);spawnCar('dropoff',s.id);G.money+=amt;sfx('cash');fxText(s.x,s.y-30,'+'+money(amt),'#9fe870');
 addMood(s,gain>=14?'goodWork':gain<6?'badWork':'goodWork',gain>=6&&gain<14?60:null);
 toast(`${s.first} is home from work: +${money(amt)}, performance ${gain>=0?'+':''}${gain}`,'job');
 if(j.perf>=100&&j.level<4){const need=PROMO[j.level+1];if(s.level(C.skill)>=need){j.level++;j.perf=35;const bonus=C.lv[j.level][1]*8;G.money+=bonus;addMood(s,'promoted');wishCheck(s);
   toast(`${s.first} was promoted to ${C.lv[j.level][0]}! Bonus ${money(bonus)}`,'trophy');sfx('promo');addParticle({type:'confetti',x:s.x,y:s.y-20,life:2});}
  else toast(`${s.first} needs ${SKILLS[C.skill].l} level ${need} to be promoted`,C.skill);}
 checkFired(s);for(const p of household())wishCheck(p);UI.dirty=true;}
function checkFired(s){const j=s.job;if(!j)return;if(j.perf<=0){if(j.warned){toast(`${s.first} was fired from ${CAREERS[j.career].l}`,'frown');addMood(s,'fired');s.job=null;sfx('bad');}else{j.warned=1;j.perf=10;toast(`${s.first}'s boss is not happy. One more slip and they're out.`,'frown');}}else if(j.perf>30)j.warned=0;}
function applyWorkChoice(s,ch){const C=CAREERS[s.job?s.job.career:'tech'];let fx;
 if(typeof ch[1]==='string'||typeof ch[1]==='number'){let p;if(typeof ch[1]==='number')p=ch[1];else{const k=ch[1]==='$'?C.skill:ch[1];p=clamp(.3+s.level(k)*.07+(moodLevel(moodScore(s)).id>=3?.1:0),.1,.95);}fx=chance(p)?ch[2]:ch[3];fx=Object.assign({},fx,{ok:fx===ch[2]});}else fx=ch[1];
 if(fx.perf&&s.job)s.job.perf=clamp(s.job.perf+fx.perf*(s.reward('office')?1.3:1),0,100);
 for(const n of NEED_IDS)if(fx[n])s.needs[n]=clamp(s.needs[n]+fx[n],0,100);
 if(fx.money){G.money+=fx.money;}if(fx.mood)addMood(s,fx.mood);if(fx.xp)gainXP(s,C.skill,fx.xp);
 const parts=[];if(fx.perf)parts.push(`performance ${fx.perf>0?'+':''}${fx.perf}`);if(fx.money)parts.push((fx.money>0?'+':'-')+money(Math.abs(fx.money)));if(fx.xp)parts.push(`+${SKILLS[C.skill].l} practice`);
 return(fx.ok===false?'It did not go well. ':fx.ok?'It worked out! ':'')+(parts.length?parts.join(', '):'Nothing much changed.');}
function joinCareer(s,k){s.job={career:k,level:0,perf:40};wishCheck(s);toast(`${s.first} joined the ${CAREERS[k].l} career as ${CAREERS[k].lv[0][0]}`,'job');sfx('good');UI.dirty=true;}

// ---------- cars ----------
function spawnCar(kind,simId){const dir=kind==='traffic'?(chance(.5)?1:-1):1;const cols=['#d9603b','#4f7fd6','#e2a53a','#6fa35a','#8e5ba8','#f2efe6','#3a3338'];
 const c={kind,simId,dir,x:dir>0?-40:MW*T+40,y:(dir>0?22:21)*T-6,stopX:kind==='traffic'?null:CURB.x*T-12,state:'drive',col:kind==='carpool'||kind==='dropoff'?'#f2c14e':pick(cols),t:0};
 if(kind!=='traffic'){c.dir=1;c.x=-40;c.y=21*T+2;}G.cars.push(c);return c;}
function carDepart(id){for(const c of G.cars)if(c.simId===id&&c.kind==='carpool')c.state='leave';}
function carLeave(id){carDepart(id);}
function updateCars(dm){for(const c of G.cars){const sp=60*dm;
 if(c.state==='drive'){if(c.stopX!=null&&Math.abs(c.x-c.stopX)<sp+1){c.x=c.stopX;c.state='wait';c.t=0;}else c.x+=c.dir*sp;}
 else if(c.state==='wait'){c.t+=dm;if(c.kind==='dropoff'&&c.t>3)c.state='leave';if(c.kind==='carpool'&&c.t>120)c.state='leave';}
 else if(c.state==='leave')c.x+=c.dir*sp*1.2;}
 G.cars=G.cars.filter(c=>c.x>-60&&c.x<MW*T+60);}

// ---------- visitors ----------
function neighbors(){return G.people.filter(p=>p.role==='neighbor');}
function spawnTick(m){const h=(m%1440)/60;if(h<7||h>21)return;if(G.people.filter(p=>p.onLot&&p.visit).length>=5)return;
 if(chance(.16)){const c=neighbors().filter(p=>!p.onLot&&!p.away);if(c.length)spawnWalker(pick(c));}}
function resetVisitor(p){p.queue.length=0;p.act=null;p.path=null;p.inObj=null;p.holdFor=null;p.away=null;for(const k of NEED_IDS)p.needs[k]=ri(55,88);p.moodlets=p.moodlets.filter(m=>m.until&&m.until>G.time);}
function spawnWalker(p){resetVisitor(p);const left=chance(.5);p.onLot=true;p.place(left?0:MW-1,SIDEY);p.visit={kind:'walker',ex:left?MW-1:0};p.dir=left?'right':'left';}
function spawnVisitor(p,kind,dur){resetVisitor(p);const left=chance(.5);p.onLot=true;p.place(left?0:MW-1,SIDEY);p.visit={kind:kind||'visitor',until:G.time+(dur||ri(150,280))};
 p.act=A('arrive','Arrive','home',[{k:'walk',x:13,y:16}]);p.act.user=false;p.idleAt=G.time;}
function timersTick(m){const due=G.timers.filter(t=>t.at<=m);if(!due.length)return;G.timers=G.timers.filter(t=>t.at>m);
 for(const t of due){
  if(t.type==='visit'){const p=personById(t.id);if(p&&!p.onLot&&p.role==='neighbor'){spawnVisitor(p);toast(`${p.first} has come over`,'home');}}
  if(t.type==='pizza'){const spots=surfaceSpots().filter(s=>!s.o.def.stove&&!s.o.def.grill).sort((a,b)=>Math.hypot(a.x-13,a.y-13)-Math.hypot(b.x-13,b.y-13));const sp=spots[0];
   if(sp){G.items.push({id:uid('i'),kind:'meal',x:sp.x,y:sp.y,surf:sp.o.id,recipe:'pizza',label:'Pizza',q:2,hunger:52,servings:4,c:'#e2a53a'});toast('Pizza is here!','food');sfx('pop');}
   else{G.money+=30;toast('The pizza driver found nowhere to put it. Refunded.','food');}}
  if(t.type==='party'){G.party={until:G.time+240,host:t.host};const ppl=neighbors().filter(p=>!p.onLot).sort((a,b)=>(relPeek(b,personById(t.host))||{f:0}).f-(relPeek(a,personById(t.host))||{f:0}).f).slice(0,4);
   ppl.forEach((p,i)=>{spawnVisitor(p,'party',240);p.act.steps.unshift({k:'wait',min:i*4,pose:'idle'});});toast(`Guests are arriving for the party!`,'star');sfx('promo');G.timers.push({at:G.time+240,type:'partyEnd'});}
  if(t.type==='partyEnd'&&G.party){const guests=G.people.filter(p=>p.visit&&p.visit.kind==='party');const sc=guests.length?guests.reduce((a,p)=>a+(p.needs.fun+p.needs.social)/2,0)/guests.length:0;
   const host=personById(G.party.host);if(sc>=55&&guests.length){for(const s of household())if(s.onLot)addMood(s,'party');if(host)wishEvent(host,'party');toast('That was a great party!','star');sfx('promo');}else toast('The party fizzled out early','frown');
   for(const p of guests)sendHome(p);G.party=null;}
 }}

// ---------- garden ----------
function plantAct(s,o,crop){const c=CROPS[crop];return A('plant','Plant '+c.l,'gardening',[U(o,'front','garden',{min:10,max:10,xp:{gardening:30},onDo:(s)=>{if(G.money<c.cost){toast('Not enough money for seeds','coin');return false;}pay(c.cost,s);},onEnd:(s,a,st)=>{if(st.el>=9.9)o.state={crop,g:0,water:70};}})],{obj:o});}
function plantsTick(){let best=0;for(const s of household())best=Math.max(best,s.level('gardening'));const green=household().some(s=>s.has('green'));
 for(const o of G.objects){if(!o.def.plot||!o.state.crop)continue;const st=o.state,c=CROPS[st.crop];if(G.weather==='rain')st.water=100;else st.water=Math.max(0,st.water-4.2/60);
  if(G.season===3||st.g>=100)continue;st.g=Math.min(100,st.g+(100/c.grow/60)*(st.water>0?1:.15)*(green?1.4:1)*(1+best*.04));}}

// ---------- bills ----------
function payBills(){if(!G.bills)return false;if(G.money<G.bills.amount){toast('Not enough money to pay the bills','coin');sfx('bad');return false;}G.money-=G.bills.amount;toast(`Paid ${money(G.bills.amount)} in bills`,'coin');G.bills=null;sfx('cash');UI.dirty=true;return true;}
function repo(){const amt=G.bills.amount;let got=0;const L=G.objects.filter(o=>!o.def.fixed&&!o.def.plot&&o.price>0).sort((a,b)=>b.price-a.price);const taken=[];
 for(const o of L){if(got>=amt*1.2)break;if(Object.keys(o.users).length)continue;got+=o.price;taken.push(o.def.n);removeObject(o);}
 refreshWorld();G.bills=null;for(const s of household())addMood(s,'repo');toast(`Unpaid bills. The repo crew took: ${taken.slice(0,3).join(', ')}${taken.length>3?' and more':''}`,'box');sfx('bad');UI.dirty=true;}

// ---------- wishes ----------
const TRAIT_SKILL={foodie:'cooking',bookworm:'logic',genius:'logic',athletic:'fitness',social:'charisma',charmer:'charisma',artistic:'painting',musical:'guitar',green:'gardening'};
const friendCount=s=>G.people.filter(p=>p!==s&&(relPeek(s,p)||{f:0}).f>=30).length;
const WISH_T={
 skill:{gen:s=>{const pool=SKILL_IDS.slice();for(const t of s.traits)if(TRAIT_SKILL[t])pool.push(TRAIT_SKILL[t],TRAIT_SKILL[t]);if(s.job)pool.push(CAREERS[s.job.career].skill,CAREERS[s.job.career].skill);const k=pick(pool),lv=s.level(k)+1;if(lv>10)return null;return{k,lv,txt:`Reach ${SKILLS[k].l} level ${lv}`,pts:150+lv*110};},chk:(s,w)=>s.level(w.k)>=w.lv},
 job:{gen:s=>s.job?null:{txt:'Join a career',pts:300},chk:s=>!!s.job},
 promo:{gen:s=>(!s.job||s.job.level>=4)?null:{lv:s.job.level+1,txt:'Get a promotion',pts:500+s.job.level*250},chk:(s,w)=>s.job&&s.job.level>=w.lv},
 friend:{gen:s=>{const n=friendCount(s);return{n:n+1,txt:n?'Make another friend':'Make a friend',pts:350+n*100};},chk:(s,w)=>friendCount(s)>=w.n},
 money:{gen:()=>{const t=Math.ceil((G.money+1500)/500)*500;return{t,txt:`Have ${money(t)} in the bank`,pts:Math.round(200+t/40)};},chk:(s,w)=>G.money>=w.t},
 buy:{gen:()=>{const c=pick(CATS);return{cat:c[0],txt:`Buy something new: ${c[1]}`,pts:250};},ev:'buy'},
 meal:{gen:()=>({txt:'Cook a great meal',pts:300}),ev:'meal'},
 painting:{gen:s=>(G.objects.some(o=>o.type==='easel')||s.has('artistic'))?{txt:'Finish a painting',pts:400}:null,ev:'painting'},
 harvest:{gen:()=>G.objects.some(o=>o.def.plot&&o.state.crop)?{txt:'Harvest something from the garden',pts:300}:null,ev:'harvest'},
 happy:{gen:()=>({txt:'Be in a Happy mood',pts:200}),chk:s=>moodLevel(moodScore(s)).id>=3},
 ecstatic:{gen:()=>({txt:'Feel Ecstatic',pts:600}),chk:s=>moodLevel(moodScore(s)).id>=4},
 party:{gen:s=>(s.has('social')||chance(.4))?{txt:'Throw a party',pts:700}:null,ev:'party'},
 meet:{gen:()=>({txt:'Meet someone new',pts:250}),ev:'meet'},
 kiss:{gen:s=>(partnerOf(s)||s.has('charmer'))?{txt:'Share a kiss',pts:400}:null,ev:'kiss'},
 partner:{gen:s=>partnerOf(s)?null:{txt:'Start a romance',pts:900},ev:'partner'},
 workout:{gen:s=>({txt:'Get a good workout',pts:s.has('athletic')?200:300}),ev:'workout'},
 rested:{gen:()=>({txt:'Wake up well rested',pts:200}),ev:'rested'},
 chess:{gen:()=>G.objects.some(o=>o.type==='chess')?{txt:'Play a game of chess',pts:250}:null,ev:'chess'},
 tips:{gen:s=>s.level('guitar')>=3?{txt:'Earn $40 busking',pts:450}:null,ev:'tips'},
 call:{gen:()=>({txt:'Catch up with a friend on the phone',pts:200}),ev:'call'},
 cozy:{gen:()=>W.rooms.some(r=>roomCozy(r))?null:{txt:'Decorate a room until it feels cozy',pts:450},chk:s=>s.moodlets.some(m=>m.id==='cozy')},
 fish:{gen:()=>({txt:'Go fishing at the lake',pts:300}),ev:'fish'},outing:{gen:()=>({txt:'Spend time somewhere in town',pts:250}),ev:'outing'},
 visit:{gen:s=>G.people.some(p=>p.role==='neighbor'&&relPeek(s,p)&&relPeek(s,p).met)?{txt:'Visit a neighbor at home',pts:350}:null,ev:'visit'},event:{gen:()=>({txt:'Join a community event',pts:500}),ev:'event'},
};
function addWish(s){const keys=Object.keys(WISH_T);for(let i=0;i<12;i++){const k=pick(keys.concat(['skill','skill','friend']));if(s.wishes.some(w=>w.t===k&&k!=='skill'))continue;const w=WISH_T[k].gen(s);if(!w)continue;
 if(k==='skill'&&s.wishes.some(x=>x.t==='skill'&&x.k===w.k))continue;w.t=k;w.id=uid('w');if(WISH_T[k].chk&&WISH_T[k].chk(s,w))continue;s.wishes.push(w);UI.dirty=true;return;}}
function wishEvent(s,ev,data){if(!s||s.role!=='household')return;for(const w of s.wishes.slice()){const T2=WISH_T[w.t];if(T2&&T2.ev===ev&&(!w.cat||(data&&data.cat===w.cat)))fulfill(s,w);}}
function wishCheck(s){if(!s||s.role!=='household')return;for(const w of s.wishes.slice()){const T2=WISH_T[w.t];if(T2&&T2.chk&&T2.chk(s,w))fulfill(s,w);}}
function fulfill(s,w){s.wishes=s.wishes.filter(x=>x!==w);s.lhp+=w.pts;addMood(s,'wish');s.wishCD=G.time+ri(30,90);s.stats.wishes=(s.stats.wishes||0)+1;
 toast(`${s.first}'s wish came true: ${w.txt} (+${w.pts.toLocaleString()} happiness)`,'star');sfx('wish');if(s.onLot)for(let i=0;i<6;i++)addParticle({type:'spark',x:s.x+rnd()*16-8,y:s.y-20-rnd()*10,vx:rnd()*20-10,vy:-20-rnd()*10,life:1.2});UI.dirty=true;}

// ---------- new game / starter house ----------
const STARTER_FURN=[['fridge',7,5],['counter',8,5],['sink_k',9,5],['stove',10,5],['counter',11,5],['coffee',7,8],
 ['table_dining',8,11],['chair_dining',8,10],['chair_dining',9,10],['chair_dining',8,12,{rot:1}],['chair_dining',9,12,{rot:1}],['plant_s',7,13],
 ['toilet',13,5],['sink_b',14,5],['shower',15,5],
 ['bed_double',18,5,{variant:1}],['lamp_table',17,5],['lamp_table',20,5],['rug',18,7,{variant:3}],['plant_l',20,8],
 ['tv',16,10],['sofa',16,12,{rot:1,variant:5}],['rug_big',15,11,{variant:0}],['lamp_floor',18,12],['guitar',12,10],['bookshelf',13,10],['pc',20,10],['plant_l',20,13],
 ['clock_wall',9,4],['art_wall',19,4],
 ['plot',2,9],['plot',3,9],['plot',4,9],
 ['tree',2,2],['tree',25,2],['tree',25,16],['tree',2,16],
 ['bush',7,15],['bush',20,15],['flowers',8,15],['flowers',9,15],['flowers',10,15],['flowers',16,15],['flowers',17,15],['flowers',18,15],
 ['lantern',12,16],['lantern',14,16],['bench',17,17],
 ['mailbox',14,19],['streetlamp',3,19],['streetlamp',24,19]];
function furnishStarter(outdoorOnly){for(const[t,x,y,o]of STARTER_FURN){if(outdoorOnly&&!isYardItem(t))continue;addObject(t,x,y,Object.assign({},o||{}));}for(const o of G.objects)o.bought=1;}
function isYardItem(t){const d=CATALOG[t];return!!(d&&(d.c==='outdoor'||d.fixed));}
function resetState(){TEXTS.length=0;PARTS.length=0;const tb=document.getElementById('toasts');if(tb)tb.innerHTML='';G.time=0;G.people=[];G.rels={};G.objects=[];G.items=[];G.inv=[];G.produce={};G.bills=null;G.timers=[];G.cars=[];G.party=null;G.stats={};G.day=0;G.fish={};G.ext=defaultExt();}
function makeNeighbors(){for(const n of NEIGHBORS){const p=new Sim(Object.assign({},n,{role:'neighbor'}));p.skills={charisma:ri(50,400),[pick(SKILL_IDS)]:ri(100,900)};G.people.push(p);}}
function startHousehold(defs,cash,startMin,opts){opts=opts||{};
 if(SLOT.fresh){SLOT.fresh=false;SLOT.use(SLOT.free());G.tut={done:{}};}SLOT.hold=false;
 resetState();G.time=startMin;G.day=dayOf(startMin);G.season=(G.seasonStart+Math.floor(G.day/7))%4;G.weather='clear';
 let spots;if(opts.lot){const lot=opts.lot;loadLot(lot);refreshWorld();G.lot=lot;G.fresh=lot!=='cottage';ensureTown();G.home=TOWN.lots.find(l=>l.kind==='hart').id;
  spots=lot==='cottage'?[[10,7],[14,12],[12,12],[18,11],[9,12],[16,7]]:lot==='shell'?[[11,11],[13,12],[15,11],[17,12]]:[[12,16],[14,16],[12,18],[15,18]];}
 else{ensureTown();const l=(opts.townLot&&townLot(opts.townLot))||TOWN.lots.find(x=>x.kind==='hart');if((l.kind==='starter'||l.kind==='hart')&&opts.furn!=null)l.furn=opts.furn;loadTownLot(l,opts.furn);refreshWorld();G.home=l.id;G.fresh=lotNeedsSetup(l,opts.furn);G.lot=G.fresh?(l.kind==='empty'?'empty':'shell'):'cottage';
  const px=[...Array(MW).keys()].find(x=>W.floor[I(x,17)]==='path');const dx=px==null?13:px;spots=l.kind==='hart'?[[10,7],[14,12],[12,12],[18,11],[9,12],[16,7]]:[[dx-1,16],[dx+1,16],[dx-1,18],[dx+1,18]];}
 defs.forEach((d,i)=>{const s=new Sim(Object.assign({},d,{role:'household',onLot:true}));const sp=spots[i%spots.length];const[x,y]=nearestFree(sp[0],sp[1]);s.place(x,y);s.dir='down';G.people.push(s);});
 const hh=household();for(let i=0;i<hh.length;i++)for(let j=i+1;j<hh.length;j++){const r=rel(hh[i],hh[j]);r.met=true;r.f=opts&&opts.married?72:45;if(opts&&opts.married){r.r=68;r.partner=r.married=true;r.kissed=1;}}
 makeNeighbors();G.money=cash;G.sel=hh[0].id;roomDecorAll();for(const s of hh){refreshMoodlets(s);s.wishCD=0;addWish(s);addWish(s);addWish(s);}
 G.started=true;UI.dirty=true;
}
function startSample(){
 G.town={seed:2611};TOWN=null;
 startHousehold(SAMPLE,4200,7*60+18,{married:true});
 const[j,a]=household();Object.assign(j.needs,{hunger:44,energy:82,bladder:74,hygiene:78,fun:58,social:52});Object.assign(a.needs,{hunger:52,energy:70,bladder:66,hygiene:88,fun:50,social:60});
 const fr=G.objects.find(o=>o.type==='fridge');j.place(9,6);enqueue(j,cookAct(j,fr,RECIPES[0],true));
 const bs=G.objects.find(o=>o.type==='bookshelf');a.place(14,11);enqueue(a,ACTS.readNovel.build(a,bs));
 const r=neighbors()[0];spawnWalker(r);r.place(5,SIDEY);r.visit.ex=MW-1;r.dir='right';
 G.quiet=true;for(let i=0;i<34;i++)gameStep(.5);G.quiet=false;TEXTS.length=0;PARTS.length=0;
 G.objects.find(o=>o.type==='plot').state={crop:'tomato',g:72,water:80};G.objects.filter(o=>o.def.plot)[1].state={crop:'lettuce',g:35,water:60};
 W.groundDirty=true;
}

// ---------- save / load ----------
// Save slots: each household keeps its own save, so several people can play on one device. Slot 1 keeps the
// original key, so older saves load as slot 1; slot n saves under SAVE_KEY+'.'+n. SLOT_KEY remembers the last one
// played. SLOT.hold stops autosaves while the game behind the start menu is only the unplayed sample, and
// SLOT.fresh makes the next startHousehold() open a new slot instead of replacing the current one.
const SAVE_KEY='mapleLane.save.v1',SLOT_KEY='mapleLane.slot',MAX_SLOTS=8;
const SLOT={cur:1,hold:false,fresh:false,
 key(n){return n===1?SAVE_KEY:SAVE_KEY+'.'+n;},
 list(){const L=[];try{for(let i=0;i<localStorage.length;i++){const m=/^mapleLane\.save\.v1(?:\.(\d+))?$/.exec(localStorage.key(i)||'');if(m)L.push(m[1]?+m[1]:1);}}catch(e){}return L.sort((a,b)=>a-b);},
 read(n){try{const s=localStorage.getItem(this.key(n));return s?JSON.parse(s):null;}catch(e){return null;}},
 free(){const L=this.list();let n=1;while(L.includes(n))n++;return n;},
 use(n){this.cur=n;try{localStorage.setItem(SLOT_KEY,String(n));}catch(e){}},
 last(){const L=this.list();let n=0;try{n=+localStorage.getItem(SLOT_KEY);}catch(e){}return L.includes(n)?n:L.length?L[0]:1;},
 remove(n){try{localStorage.removeItem(this.key(n));}catch(e){}},
 full(){return this.list().length>=MAX_SLOTS;}};
const WP_KEYS=Object.keys(WALLPAPERS);
function serialize(){return{v:1,savedAt:Date.now(),time:G.time,money:G.money,sel:G.sel,rels:G.rels,inv:G.inv,produce:G.produce,bills:G.bills,timers:G.timers,season:G.season,seasonStart:G.seasonStart,weather:G.weather,
 freeWill:G.freeWill,settings:G.settings,stats:G.stats,day:G.day,uid:UID,party:G.party,lot:G.lot,fresh:G.fresh,tut:G.tut,town:G.town,home:G.home,fish:G.fish,ext:G.ext,
 people:G.people.map(p=>p.save()),objects:G.objects.map(o=>({id:o.id,type:o.type,x:o.x,y:o.y,rot:o.rot,variant:o.variant,state:o.state,price:o.price})),items:G.items,
 map:{f:W.floor.map(f=>FCODE_R[f]||'.').join(''),w:Array.from(W.wt).join(''),p:W.wp.map(p=>String.fromCharCode(97+Math.max(0,WP_KEYS.indexOf(p)))).join('')}};}
function loadGame(d){
 resetState();Object.assign(G,{time:d.time,money:d.money,sel:d.sel,rels:d.rels||{},inv:d.inv||[],produce:d.produce||{},bills:d.bills||null,timers:d.timers||[],season:d.season||0,seasonStart:d.seasonStart!=null?d.seasonStart:2,
  weather:d.weather||'clear',freeWill:d.freeWill||'full',settings:Object.assign({music:true,sfx:true,smooth:true},d.settings||{}),stats:d.stats||{},day:d.day!=null?d.day:dayOf(d.time),party:null,lot:d.lot||'cottage',fresh:!!d.fresh,tut:d.tut||{done:{harts:1}},town:d.town||{seed:2611},home:d.home||null,fish:d.fish||{},ext:Object.assign(defaultExt(),d.ext||{})});
 TOWN=null;ensureTown();applyTownOverrides();
 UID=Math.max(UID,d.uid||1000);
 for(let i=0;i<N_TILES;i++){W.floor[i]=FCODE[d.map.f[i]]||'grass';W.wt[i]=+d.map.w[i]||0;W.wp[i]=WP_KEYS[(d.map.p.charCodeAt(i)||97)-97]||'cream';}
 for(const o of d.objects)addObject(o.type,o.x,o.y,{id:o.id,rot:o.rot,variant:o.variant,state:o.state||{},price:o.price});
 G.items=(d.items||[]).filter(i=>i&&i.kind);
 G.people=d.people.map(p=>{const s=new Sim(p);if(s.role!=='household'){s.onLot=false;s.visit=null;if(s.away&&s.away.kind!=='home')s.away=null;}else if(s.onLot&&!s.away)s.place(p.tx,p.ty);return s;});
 refreshWorld();for(const s of household())if(s.onLot&&!s.away&&!freeTile(s.tx(),s.ty())){const[x,y]=nearestFree(s.tx(),s.ty());s.place(x,y);}
 if(!personById(G.sel)||personById(G.sel).role!=='household')G.sel=household()[0]&&household()[0].id;
 G.timers=G.timers.filter(t=>t.type!=='partyEnd'&&t.type!=='party');G.started=true;UI.dirty=true;W.groundDirty=true;if(R.cv)setWallsUp(!!G.settings.wallsUp);
}
let lastSave=0;
function autosave(force){if(!G.started||SLOT.hold)return;const now=performance.now();if(!force&&now-lastSave<20000)return;lastSave=now;let d;
 try{d=serialize();localStorage.setItem(SLOT.key(SLOT.cur),JSON.stringify(d));}catch(e){if(d&&!autosave.warned){autosave.warned=1;toast('This device is out of room for saves. Delete an old save from the main menu.','frown');}}
 if(d){CLOUD.pending={d,slot:SLOT.cur};cloudFlush(force);}}
function loadLocal(){return SLOT.read(SLOT.cur);}
// cloud saves (claude.ai artifact only): one document per slot
const CLOUD={db:null,uid:null,ok:false,busy:false,pending:null,lastWrite:0};
function cloudRef(n){return CLOUD.db.doc('data/users/'+CLOUD.uid+'/save'+(n===1?'':n));}
async function cloudInit(){try{const c=window.claude;if(!c||!c.use)return;const db=await c.use('db');const user=await c.use('user');if(!db||!user)return;const id=await user.id();if(!id)return;
 CLOUD.db=db;CLOUD.uid=id;const slot=SLOT.cur;const snap=await Promise.race([cloudRef(slot).get(),new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),10000))]);CLOUD.ok=true;if(slot!==SLOT.cur)return;
 if(snap&&snap.exists){const v=snap.data();if(v&&v.json){const d=JSON.parse(v.json);const cur=G.loadedAt||0;if(d.savedAt>cur+60000)UI.offerCloud(d);}}}catch(e){CLOUD.ok=false;}}
async function cloudFlush(force){if(!CLOUD.ok||!CLOUD.db||CLOUD.busy||!CLOUD.pending)return;const now=performance.now();if(!force&&now-CLOUD.lastWrite<90000)return;
 CLOUD.busy=true;const{d,slot}=CLOUD.pending;CLOUD.pending=null;CLOUD.lastWrite=now;
 try{await cloudRef(slot).set({json:JSON.stringify(d),savedAt:d.savedAt,label:DAYS[wday(d.time)]+' '+clockStr(d.time)});}catch(e){if(e&&e.code==='invalid_argument')CLOUD.ok=false;}CLOUD.busy=false;}
