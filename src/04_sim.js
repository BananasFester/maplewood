// ================= SIMS: people, needs, moodlets, actions, autonomy, social =================
class Sim{
 constructor(o){o=o||{};
  this.id=o.id||uid('s');this.first=o.first||'Sam';this.last=o.last||'Hart';
  this.app=Object.assign({skin:1,hair:'short',hairC:'#4a2f22',top:'#4f7fd6',topS:'tee',bot:'#2f3e5c',botS:'pants',shoes:'#3a2a25',beard:0},o.app||{});
  this.traits=(o.traits||[]).slice();this.needs=Object.assign({hunger:80,energy:85,bladder:80,hygiene:82,fun:70,social:65},o.needs||{});
  this.skills=Object.assign({},o.skills||{});this.moodlets=(o.moodlets||[]).slice();this.job=o.job?Object.assign({},o.job):null;
  this.rewards=(o.rewards||[]).slice();this.lhp=o.lhp||0;this.wishes=(o.wishes||[]).slice();this.wishCD=o.wishCD||0;
  this.role=o.role||'household';this.stats=Object.assign({},o.stats||{});
  this.x=o.x||0;this.y=o.y||0;this.dir=o.dir||'down';this.onLot=!!o.onLot;this.away=o.away||null;this.visit=o.visit||null;
  this.queue=[];this.act=null;this.path=null;this.pi=0;this.inObj=null;this.carry=null;
  this.anim={pose:'idle',t:0,walkD:0};this.bubble=null;this.autoAt=0;this.idleAt=0;this.blink=Math.random()*4;
  this.holdFor=null;this.holdUntil=0;this.convo=0;this.convoT=0;this.failed={};this.refreshApp();
 }
 refreshApp(){this.appKey=this.id+JSON.stringify(this.app);this._cols=null;}
 get name(){return this.first+' '+this.last;}
 has(t){return this.traits.includes(t);}
 reward(r){return this.rewards.includes(r);}
 level(k){return lvlOf(this.skills[k]||0);}
 tx(){return Math.floor(this.x/T);}ty(){return Math.floor(this.y/T);}
 place(x,y){this.x=x*T+8;this.y=y*T+9;this.path=null;}
 save(){const o={};for(const k of['id','first','last','app','traits','needs','skills','moodlets','job','rewards','lhp','wishes','wishCD','role','stats','dir','onLot','away'])o[k]=this[k];
  o.tx=this.tx();o.ty=this.ty();if(this.visit)o.visit=this.visit;return o;}
}
const isNight=()=>{const h=hourOf(G.time);return h>=21.5||h<6;};
const household=()=>G.people.filter(p=>p.role==='household');
const onLotSims=()=>G.people.filter(p=>p.onLot);
function personById(id){return G.people.find(p=>p.id===id);}
function rel(a,b){const k=a.id<b.id?a.id+'|'+b.id:b.id+'|'+a.id;return G.rels[k]||(G.rels[k]={f:0,r:0,met:false,partner:false,married:false});}
function relPeek(a,b){const k=a.id<b.id?a.id+'|'+b.id:b.id+'|'+a.id;return G.rels[k];}
function partnerOf(s){for(const k in G.rels){const r=G.rels[k];if(r.partner||r.married){const[a,b]=k.split('|');if(a===s.id)return b;if(b===s.id)return a;}}return null;}
function relLabel(r){if(!r||!r.met)return'Stranger';if(r.married)return'Spouse';if(r.partner)return'Partner';if(r.f>=80)return'Best Friend';if(r.f>=50)return'Good Friend';if(r.f>=25)return'Friend';if(r.f<=-40)return'Enemy';if(r.f<0)return'Disliked';return'Acquaintance';}

// ---------- needs & moodlets ----------
function decayNeeds(s,dm){
 const sleeping=s.act&&s.act.sleeping,work=s.away&&s.away.kind==='work',h=hourOf(G.time);
 for(const n of NEEDS){let r=n.decay;const id=n.id;
  if(id==='hygiene'){if(s.has('neat'))r*=.8;if(s.has('slob'))r*=1.3;if(s.reward('fresh'))r*=.6;}
  if(id==='social'){if(s.has('social'))r*=1.3;if(s.has('loner'))r*=.6;}
  if(id==='energy'){if(s.has('nightowl'))r*=(h>=20||h<4)?.6:(h>=6&&h<11?1.25:1);if(s.reward('energy'))r*=.75;}
  if(id==='hunger'){if(s.has('foodie'))r*=1.08;if(s.reward('appetite'))r*=.7;}
  if(id==='bladder'&&s.reward('bladder'))r*=.5;
  if(sleeping)r*={hunger:.45,energy:0,bladder:.45,hygiene:.4,fun:0,social:0}[id];
  if(work){r*={hunger:.55,energy:1.05,bladder:.25,hygiene:.6,fun:s.has('workaholic')?.35:.9,social:-.7}[id];}
  s.needs[id]=clamp(s.needs[id]-r*dm/60,0,100);}
}
function setM(s,id,on){const i=s.moodlets.findIndex(m=>m.id===id&&!m.until);if(on&&i<0)s.moodlets.push({id,until:0});else if(!on&&i>=0)s.moodlets.splice(i,1);}
function addMood(s,id,dur){const d=MOODLETS[id];if(!d)return;const until=G.time+(dur||d.dur||180);const m=s.moodlets.find(m=>m.id===id&&m.until);if(m)m.until=Math.max(m.until,until);else s.moodlets.push({id,until});}
function delMood(s,id){s.moodlets=s.moodlets.filter(m=>m.id!==id);}
function moodScore(s){let v=0;for(const m of s.moodlets){const d=MOODLETS[m.id];if(d)v+=d.v;}return v;}
function refreshMoodlets(s){
 const N=s.needs;const pair=(id,a,b,ma,mb)=>{setM(s,ma,N[id]<a&&N[id]>=b);setM(s,mb,N[id]<b);};
 pair('hunger',30,12,'hungry','starving');pair('energy',28,10,'tired','exhausted');pair('bladder',28,10,'gottago','bursting');
 pair('hygiene',30,12,'smelly','stinky');pair('fun',30,12,'bored','verybored');pair('social',28,10,'lonely','verylonely');
 setM(s,'content',NEED_IDS.every(k=>N[k]>=72));setM(s,'cheerful',s.has('cheerful'));setM(s,'sunshine',s.reward('sunshine'));
 setM(s,'comfy',!!(s.act&&s.act.comfy&&s.inObj));
 const r=s.onLot?roomOf(s.tx(),s.ty()):null;setM(s,'cozy',!!(r&&roomCozy(r)));
 const mess=G.items.filter(i=>i.kind==='dirty'||i.kind==='puddle').length;setM(s,'messy',s.role==='household'&&!s.has('slob')&&mess>=(s.has('neat')?1:3));
 setM(s,'cozyRain',G.weather==='rain'&&s.onLot&&isInt(s.tx(),s.ty()));
 s.moodlets=s.moodlets.filter(m=>!m.until||m.until>G.time);
}
function gainXP(s,k,amt){if(!amt||s.role!=='household'&&!s.visit)return;
 let m=[.5,.8,1,1.2,1.5][moodLevel(moodScore(s)).id];if(s.reward('study'))m*=1.3;
 const tb={logic:[['bookworm',1.25],['genius',1.6]],fitness:[['athletic',1.5],['couch',.7]],cooking:[['foodie',1.5]],painting:[['artistic',1.5]],guitar:[['musical',1.5]],gardening:[['green',1.5]],charisma:[['social',1.25]]}[k]||[];
 for(const[t,v]of tb)if(s.has(t))m*=v;
 const before=s.level(k);s.skills[k]=Math.min(SKILL_XP[10],(s.skills[k]||0)+amt*m);const after=s.level(k);
 if(after>before&&s.role==='household'){toast(`${s.first} reached ${SKILLS[k].l} level ${after}`,k);sfx('good');fxText(s.x,s.y-34,SKILLS[k].l+' '+after,'#ffd34d');wishCheck(s);}}
function urge(v){return v>=97?0:Math.pow((100-v)/100,1.6)*3.2;}
function think(s,icon,kind,dur){s.bubble={icon,kind:kind||'think',until:performance.now()+(dur||2200)};}
function zzz(s){addParticle({type:'z',x:s.x+4,y:s.y-26,vx:6,vy:-8,life:2.2});}

// ---------- actions ----------
function A(id,label,icon,steps,extra){return Object.assign({id,label,icon,steps,si:0,cancel:false},extra||{});}
function U(o,slot,pose,opt){return Object.assign({k:'use',obj:o,slot,pose},opt||{});}
function enqueue(s,a,front){if(!a)return false;if(s.queue.length>=6&&!front){toast(`${s.first}'s to-do list is full`,'frown');return false;}if(s.role==='household')TUT.orders++;
 a.user=a.user!==false;if(a.user&&s.act&&!s.act.user&&!s.act.sleeping&&s.act.id!=='passout')s.act.cancel=true;if(front)s.queue.unshift(a);else s.queue.push(a);UI.dirty=true;return true;}
function cancelAct(s,a){if(s.act===a){a.cancel=true;}else{const i=s.queue.indexOf(a);if(i>=0)s.queue.splice(i,1);}UI.dirty=true;}
function clearQueue(s,hard){s.queue.length=0;if(s.act)s.act.cancel=true;if(hard)forceEnd(s);UI.dirty=true;}
function forceEnd(s){if(s.act){releaseAll(s);if(s.act.onEnd)try{s.act.onEnd(s,false);}catch(e){}}s.act=null;s.path=null;if(s.inObj){const sl=s.inObj.sl;if(sl)s.place(sl.ax,sl.ay);s.inObj=null;}s.anim.pose='idle';}
function releaseAll(s){for(const o of G.objects){for(const k in o.users)if(o.users[k]===s.id)delete o.users[k];}}
function endAct(s,ok){const a=s.act;if(!a)return;releaseAll(s);s.inObj=null;s.carry=null;if(a.onEnd)a.onEnd(s,ok);s.act=null;s.anim.pose='idle';s.idleAt=G.time;s.autoAt=G.time+ri(1,4);UI.dirty=true;}
function runAct(s,dm){
 const a=s.act;let guard=0;
 while(s.act===a&&a.si<a.steps.length&&guard++<12){const st=a.steps[a.si];const fn=STEP[st.k];const r=fn?fn(s,a,st,dm):'fail';
  if(r==='run')return;if(r==='fail'){endAct(s,false);return;}a.si++;dm=0;if(a.cancel){endAct(s,false);return;}}
 if(s.act===a&&a.si>=a.steps.length)endAct(s,true);
}
function moveAlong(s,dm){
 if(!s.path)return true;let d=WALK*dm;
 while(d>0&&s.pi<s.path.length){const[tx,ty]=s.path[s.pi],px=tx*T+8,py=ty*T+9,dx=px-s.x,dy=py-s.y,dist=Math.hypot(dx,dy);
  if(dist>.01)s.dir=Math.abs(dx)>Math.abs(dy)+.01?(dx<0?'left':'right'):(dy<0?'up':'down');
  if(dist<=d){s.x=px;s.y=py;d-=dist;s.pi++;s.anim.walkD+=dist;}else{s.x+=dx/dist*d;s.y+=dy/dist*d;s.anim.walkD+=d;d=0;}}
 s.anim.pose='walk';if(s.pi>=s.path.length){s.path=null;s.anim.pose='idle';return true;}return false;
}
function pathTo(s,x,y,adj){const p=findPath(s.tx(),s.ty(),x,y,adj);if(!p)return false;s.path=p;s.pi=0;return true;}

// slots: where a sim stands or sits to use an object
function slotsFor(o,kind){
 const d=o.def,X=o.x,Y=o.y,w=d.w,h=d.h,L=[];const add=(key,ax,ay,px,py,dir,inside,ex)=>L.push(Object.assign({key,ax,ay,px,py,dir,inside,kind},ex||{}));
 const r=turnsOf(d)?(o.rot||0):0,face=FACES[r],[vx,vy]=FVEC[r],at=(x,y,dir,key,ex)=>add(key,x,y,x*T+8,y*T+9,dir,false,ex);
 switch(kind){
  case 'front':{const fd=d.frontDir==='down'?face:OPPF[face],back=d.out||d.plot||d.easel;
   if(r===0){for(let i=0;i<w;i++)add('f'+i,X+i,Y+h,(X+i)*T+8,(Y+h)*T+9,fd,false);
    add('fw',X-1,Y+h-1,(X-1)*T+8,(Y+h-1)*T+9,'right',false,{fb:1});add('fe',X+w,Y+h-1,(X+w)*T+8,(Y+h-1)*T+9,'left',false,{fb:1});
    if(back)for(let i=0;i<w;i++)add('fn'+i,X+i,Y-1,(X+i)*T+8,(Y-1)*T+9,'down',false,{fb:1});}
   else if(r===1){for(let i=0;i<w;i++)at(X+i,Y-1,fd,'f'+i);at(X-1,Y,'right','fw',{fb:1});at(X+w,Y,'left','fe',{fb:1});if(back)for(let i=0;i<w;i++)at(X+i,Y+h,'up','fn'+i,{fb:1});}
   else{const fx=r===2?X-1:X+w,bx=r===2?X+w:X-1;for(let i=0;i<h;i++)at(fx,Y+i,fd,'f'+i);at(X,Y-1,'down','fw',{fb:1});at(X,Y+h,'up','fe',{fb:1});if(back)for(let i=0;i<h;i++)at(bx,Y+i,face,'fn'+i,{fb:1});}
   break;}
  case 'sit':{if(r>=2){for(let i=0;i<h;i++)add('s'+i,r===2?X-1:X+w,Y+i,X*T+8,(Y+i)*T+12,face,true,{alt:[i===0?[X,Y-1]:null,i===h-1?[X,Y+h]:null].filter(Boolean)});break;}
   for(let i=0;i<w;i++){if(!r)add('s'+i,X+i,Y+1,(X+i)*T+8,Y*T+13,'down',true,{alt:[[X-1,Y],[X+w,Y]]});else add('s'+i,X+i,Y-1,(X+i)*T+8,Y*T+12,'up',true,{alt:[[X-1,Y],[X+w,Y]]});}break;}
  case 'lie':{for(let i=0;i<w;i++){const c=[];if(i===0)c.push([X-1,Y+1],[X-1,Y]);if(i===w-1)c.push([X+w,Y+1],[X+w,Y]);c.push([X+i,Y+h]);
    add('b'+i,c[0][0],c[0][1],(X+i)*T+8,Y*T+16,'down',true,{alt:c.slice(1),lie:1});}break;}
  case 'in':{const off=d.inPos||(o.type==='tub'?[12,6]:o.type==='toilet'||o.type==='toilet_lux'?[8,13]:[8,11]),idir=d.inDir==='up'?OPPF[face]:face;
   if(r===0){add('i',X,Y+h,X*T+off[0],Y*T+off[1],d.inDir||'down',true,{alt:[[X-1,Y],[X+w,Y],[X+1,Y+h]],lie:o.type==='tub'?1:0});break;}
   const toi=o.type==='toilet'||o.type==='toilet_lux',px=r===2?(toi?7:8):r===3?(toi?9:8):off[0],py=r===1?(toi?8:off[1]-1):(toi?11:off[1]);
   add('i',X+vx,Y+vy,X*T+px,Y*T+py,idir,true,{alt:r===1?[[X-1,Y],[X+1,Y]]:[[X,Y-1],[X,Y+1]]});break;}
  case 'chess':add('c0',X,Y+1,X*T+8,(Y+1)*T+9,'up',false);add('c1',X,Y-1,X*T+8,(Y-1)*T+9,'down',false);break;
  case 'pc':at(X+vx,Y+vy,OPPF[face],'p0');break;
  case 'near':{let k=0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){if(!dx&&!dy)continue;const ax=X+dx,ay=Y+dy;if(freeTile(ax,ay))add('n'+(k++),ax,ay,ax*T+8,ay*T+9,dy>0?'up':dy<0?'down':dx>0?'left':'right',false);}break;}
  case 'tvstand':{if(r>=2){for(let i=0;i<h;i++)for(const k of[2,3,1])at(r===2?X-k:X+w-1+k,Y+i,OPPF[face],'t'+i+k);break;}
   for(let i=0;i<w;i++)for(const dy of[2,3,1]){const ty=r?Y-dy:Y+h+dy-1;add('t'+i+dy,X+i,ty,(X+i)*T+8,ty*T+9,r?'down':'up',false);}break;}
 }
 return L;
}
function pickSlot(s,o,kind,D){
 D=D||distField(s.tx(),s.ty());let best=null,bd=Infinity,taken=0,tot=0;
 const ok=(x,y)=>freeTile(x,y)&&sameSide(o,x,y);
 for(const sl of slotsFor(o,kind)){const opts=[[sl.ax,sl.ay]].concat(sl.alt||[]);if(!opts.some(([ax,ay])=>ok(ax,ay)))continue;tot++;if(o.users[sl.key]&&o.users[sl.key]!==s.id){taken++;continue;}
for(const[ax,ay]of opts){if(!ok(ax,ay))continue;const dd=D[I(ax,ay)]+(sl.fb?6:0)+(ax!==sl.ax||ay!==sl.ay?3:0);if(dd<bd){bd=dd;best=Object.assign({},sl,{ax,ay});}break;}}
 if(!best)pickSlot.full=tot>0&&taken===tot;return best;
}
const STEP={
 walk(s,a,st,dm){if(a.cancel)return'fail';if(!st.on){st.on=1;if(!pathTo(s,st.x,st.y,st.adj)){think(s,'frown','bad');return'fail';}}return moveAlong(s,dm)?'done':'run';},
 fn(s,a,st){return st.fn(s,a,st)===false?'fail':'done';},
 wait(s,a,st,dm){if(!st.on){st.on=1;st.el=0;if(st.dir)s.dir=st.dir;if(st.onDo)st.onDo(s,a,st);}s.anim.pose=st.pose||'idle';st.el+=dm;
  if(st.face&&st.face.onLot)faceToward(s,st.face);
  if(st.rates)for(const k in st.rates)s.needs[k]=clamp(s.needs[k]+st.rates[k]*dm/60,0,100);if(st.xp)for(const k in st.xp)gainXP(s,k,st.xp[k]*dm/60);if(st.tick)st.tick(s,a,st,dm);
  const done=a.cancel||st.el>=(st.max||st.min||5)||(st.fill&&s.needs[st.fill]>=99.5&&st.el>=(st.min||0))||(st.until&&st.until(s,a,st));
  if(done){if(st.onEnd)st.onEnd(s,a,st);return'done';}return'run';},
 use(s,a,st,dm){const o=st.obj;
  if(!st.ph){if(!objAlive(o))return'fail';pickSlot.full=false;const fs=st.fixedSlot;const sl=(fs&&!(o.users[fs.key]&&o.users[fs.key]!==s.id)&&freeTile(fs.ax,fs.ay))?fs:pickSlot(s,o,st.slot);if(!sl&&pickSlot.full&&a.user&&(st.wt=(st.wt||0)+dm)<30&&!a.cancel){s.anim.pose='idle';if(chance(dm*.05))think(s,'meh','think',1500);return'run';}
   if(!sl){think(s,'frown','bad');s.failed[o.id]=G.time+45;if(a.user)toastOnce(s,pickSlot.full?`Someone is already using the ${o.def.n.toLowerCase()}`:`${s.first} can't reach the ${o.def.n.toLowerCase()}`);return'fail';}
   st.sl=sl;o.users[sl.key]=s.id;st.ph='route';if(!pathTo(s,sl.ax,sl.ay)){delete o.users[sl.key];think(s,'frown','bad');s.failed[o.id]=G.time+45;if(a.user)toastOnce(s,`${s.first} can't reach the ${o.def.n.toLowerCase()}`);return'fail';}}
  if(st.ph==='route'){if(a.cancel){delete o.users[st.sl.key];return'fail';}if(!objAlive(o))return'fail';if(!moveAlong(s,dm))return'run';st.ph='enter';st.et=0;st.fx=s.x;st.fy=s.y;dm=0;}
  if(st.ph==='enter'){st.et+=dm;const k=st.sl.inside?clamp(st.et/.6,0,1):1;s.x=lerp(st.fx,st.sl.px,k);s.y=lerp(st.fy,st.sl.py,k);s.dir=st.sl.dir;if(k<1){s.anim.pose='walk';return'run';}
   st.ph='do';st.el=0;s.inObj=st.sl.inside?{o,sl:st.sl}:null;s.anim.pose=st.pose||'use';a.comfy=!!(o.def.comfort&&st.sl.inside);
   if(st.onDo&&st.onDo(s,a,st)===false){st.ph='exit';st.xt=0;st.ok=false;return'run';}return'run';}
  if(st.ph==='do'){if(!objAlive(o)){s.inObj=null;return'fail';}st.el+=dm;s.dir=st.sl.dir;s.anim.pose=st.pose||'use';
   if(st.rates)for(const k in st.rates){s.needs[k]=clamp(s.needs[k]+st.rates[k]*dm/60,0,100);}
   if(st.xp)for(const k in st.xp)gainXP(s,k,st.xp[k]*dm/60);if(st.tick)st.tick(s,a,st,dm);
   let done=st.el>=(st.max||60);if(st.fill&&s.needs[st.fill]>=99.5&&st.el>=(st.min||0))done=true;if(st.until&&st.until(s,a,st))done=true;
   if(a.cancel&&st.el>=.3)done=true;if(!done&&st.el>(st.min||0)&&urgentOther(s,st))done=true;
   if(!done)return'run';st.ph='exit';st.xt=0;st.ok=!a.cancel;s.anim.pose='idle';if(st.onEnd)st.onEnd(s,a,st);dm=0;}
  if(st.ph==='exit'){st.xt+=dm;if(st.sl.inside){const k=clamp(st.xt/.5,0,1);s.x=lerp(st.sl.px,st.sl.ax*T+8,k);s.y=lerp(st.sl.py,st.sl.ay*T+9,k);if(k<1)return'run';}
   s.inObj=null;delete o.users[st.sl.key];return st.ok===false&&!a.cancel?'fail':'done';}
  return'run';},
 approach(s,a,st,dm){const t=st.target;if(a.cancel||!t.onLot||t.away)return'fail';t.holdFor=s.id;t.holdUntil=G.time+20;
  const near=()=>Math.hypot(t.x-s.x,t.y-s.y)<40;
  if(!s.path){if(near())return'done';st.tries=(st.tries||0)+1;if(st.tries>6)return'fail';if(!pathTo(s,t.tx(),t.ty(),true)){think(s,'frown','bad');return'fail';}if(!s.path.length){s.path=null;return'done';}}
  if(moveAlong(s,dm)){s.path=null;if(near())return'done';}return'run';},
 social(s,a,st,dm){const t=st.target,S=SOCIALS[st.key];if(a.cancel||!t.onLot)return'fail';
  if(!st.on){st.on=1;st.el=0;st.bt=0;t.holdFor=s.id;t.holdUntil=G.time+S.dur+3;}
  st.el+=dm;faceToward(s,t);if(!t.inObj)faceToward(t,s);s.anim.pose=S.pose||'talk';if(!t.inObj)t.anim.pose=S.pose||'talk';
  st.bt-=dm;if(st.bt<=0){st.bt=2.2;const who=(Math.floor(st.el/2.2)%2)?t:s;think(who,S.icon||pick(['social','social','smile','star','note']),'say',1500);}
  if(st.el<S.dur)return'run';resolveSocial(s,t,st.key);t.holdFor=null;if(!t.inObj)t.anim.pose='idle';return'done';},
 seat(s,a,st){const pr=st.purpose;let best=null,bd=Infinity,bt=null;const D=distField(s.tx(),s.ty());
  for(const o of G.objects){if(!o.def.seat)continue;for(const sl of slotsFor(o,'sit')){if(o.users[sl.key])continue;const opts=[[sl.ax,sl.ay]].concat(sl.alt||[]);let dd=Infinity,ax,ay;
    for(const[x,y]of opts){if(freeTile(x,y)&&sameSide(o,x,y)&&D[I(x,y)]<dd){dd=D[I(x,y)];ax=x;ay=y;}}if(dd===Infinity)continue;
    let tbl=null;if(pr==='eat'){const sr=turnsOf(o.def)?(o.rot||0):0,fv=FVEC[sr],si=Number(sl.key.slice(1)),tx=o.x+(sr>=2?0:si)+fv[0],ty=o.y+(sr>=2?si:0)+fv[1];const t2=objAt(tx,ty);if(t2&&t2.def.table)tbl={o:t2,x:tx,y:ty};}
    const sc=dd+(pr==='eat'&&!tbl?14:0)+(st.near?Math.hypot(o.x-st.near.x,o.y-st.near.y)*1.5:0);
    if(sc<bd&&dd<40){bd=sc;best={o,sl:Object.assign({},sl,{ax,ay})};bt=tbl;}}}
  const base={rates:st.rates,xp:st.xp,min:st.min,max:st.max,fill:st.fill,onEnd:st.onEnd,tick:st.tick,onDo:st.onDo};
  if(best){a.table=bt;best.o.users[best.sl.key]=s.id;a.steps.splice(a.si+1,0,Object.assign({k:'use',obj:best.o,slot:'sit',pose:st.pose,fixedSlot:best.sl},base));}
  else a.steps.splice(a.si+1,0,Object.assign({k:'wait',pose:st.standPose||'idle'},base));
  return'done';},
 leave(s,a,st){goOffLot(s,st.kind,st.dur);if(st.dest)s.away.dest=st.dest;return'done';},
};
function urgentOther(s,st){if(s.role!=='household')return false;const n=s.needs;
 if(n.bladder<9&&st.fill!=='bladder')return true;if(n.hunger<8&&st.fill!=='hunger'&&!(st.rates&&st.rates.hunger))return true;if(n.energy<6&&st.fill!=='energy'&&!(st.rates&&st.rates.energy>0))return true;return false;}
function faceToward(s,t){const dx=t.x-s.x,dy=t.y-s.y;s.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');}
let _toastOnce={};function toastOnce(s,msg){if(s.role!=='household')return;const k=msg;if(_toastOnce[k]&&performance.now()-_toastOnce[k]<8000)return;_toastOnce[k]=performance.now();toast(msg,'frown');}

// ---------- the interaction catalog ----------
const nearestObj=(s,f)=>{let b=null,bd=1e9;for(const o of G.objects)if(f(o)){const d=Math.hypot(o.x*T-s.x,o.y*T-s.y);if(d<bd){bd=d;b=o;}}return b;};
const useAct=(id,o,slot,pose,opt)=>{const R=ACTS[id];return A(id,R.l,R.i,[U(o,slot,pose,opt)],{obj:o});};
const skillAct=(id,o,slot,pose,k,rate,opt)=>useAct(id,o,slot,pose,Object.assign({xp:{[k]:rate},min:45,max:120},opt||{}));
const ACTS={
 sleep:{l:'Sleep',i:'zzz',adv:{energy:4.2},autoIf:s=>s.needs.energy<32||(isNight()&&s.needs.energy<74),
  build:(s,o)=>useAct('sleep',o,'lie','sleep',{fill:'energy',min:120,max:900,rates:{energy:o.def.energy},onDo:(s,a)=>{a.sleeping=1;},tick:(s,a,st,dm)=>{if(chance(dm*.04))zzz(s);},
   onEnd:(s,a,st)=>{a.sleeping=0;if(st.el>=300&&s.needs.energy>=88){addMood(s,o.def.lux?'dreamy':'wellRested');wishEvent(s,'rested');}else if(st.el<150&&s.needs.energy<45)addMood(s,'groggy');}})},
 nap:{l:'Take a Nap',i:'zzz',adv:{energy:2.2},autoIf:s=>s.needs.energy<48&&!isNight(),build:(s,o)=>useAct('nap',o,'lie','sleep',{fill:'energy',min:30,max:90,rates:{energy:o.def.energy*.85},onDo:(s,a)=>{a.sleeping=1;},onEnd:(s,a)=>{a.sleeping=0;}})},
 relax:{l:'Relax',i:'smile',adv:{fun:.5,energy:.4},build:(s,o)=>useAct('relax',o,'lie','lieAwake',{min:20,max:60,rates:{energy:2,fun:6}})},
 sit:{l:'Sit',i:'smile',vis:1,adv:{energy:.35,fun:.2},build:(s,o)=>useAct('sit',o,'sit','sit',{min:15,max:40,rates:{energy:1.5,fun:1.5}})},
 doze:{l:'Doze Off',i:'zzz',adv:{energy:1.7},autoIf:s=>s.needs.energy<38,build:(s,o)=>useAct('doze',o,'sit','doze',{fill:'energy',min:30,max:90,rates:{energy:7}})},
 snack:{l:'Grab a Snack',i:'food',adv:{hunger:2},autoIf:s=>s.needs.hunger<62,avail:()=>G.money>=4||'Not enough money',
  build:(s,o)=>useAct('snack',o,'front','eat',{min:12,max:12,rates:{hunger:130},onDo:(s)=>{pay(4,s);}})},
 cook:{l:'Cook...',i:'cooking',adv:{hunger:3.1},autoIf:(s,o)=>s.needs.hunger<55&&!G.items.some(i=>i.kind==='meal')&&!G.people.some(p=>p!==s&&p.act&&p.act.id==='cook'),menu:'recipes',
  avail:()=>nearestObj({x:0,y:0},o=>o.def.stove&&!o.def.grill)?true:'Needs a stove'},
 cookGroup:{l:'Cook for Everyone...',i:'cooking',menu:'recipes',group:1,avail:()=>household().filter(p=>p.onLot).length>1||'Only one person is home'},
 cleanAll:{l:'Do the Dishes',i:'hygiene',avail:()=>G.items.some(i=>i.kind==='dirty')||'No dirty dishes'},
 coffee:{l:'Make Coffee',i:'energy',adv:{energy:1.3},autoIf:s=>s.needs.energy<58&&hourOf(G.time)>=5&&hourOf(G.time)<14,
  build:(s,o)=>A('coffee','Make Coffee','energy',[U(o,'front','use',{min:4,max:4,onDo:s=>pay(2,s)}),{k:'wait',pose:'drink',min:5,onEnd:(s)=>{s.needs.energy=clamp(s.needs.energy+18,0,100);s.needs.bladder=clamp(s.needs.bladder-10,0,100);addMood(s,'caffeinated');}}])},
 toilet:{l:'Use Toilet',i:'bladder',vis:1,adv:{bladder:5},autoIf:s=>s.needs.bladder<55,
  build:(s,o)=>useAct('toilet',o,'in','toilet',{fill:'bladder',min:4,max:14,rates:{bladder:650*(o.def.rate||1)},onEnd:(s)=>{if(s.has('neat')||chance(.3)){const sk=nearestObj(s,x=>x.def.bsink||x.def.sink);if(sk&&s.role==='household')enqueue(s,ACTS.washHands.build(s,sk),true);}}})},
 shower:{l:'Take a Shower',i:'hygiene',adv:{hygiene:3.2},autoIf:s=>s.needs.hygiene<55,
  build:(s,o)=>useAct('shower',o,'in','shower',{fill:'hygiene',min:10,max:40,rates:{hygiene:260},tick:(s,a,st,dm)=>{if(chance(dm*1.5))addParticle({type:'steam',x:o.x*T+4+rnd()*8,y:o.y*T-6,vx:0,vy:-10,life:1.4});},onEnd:(s)=>{if(s.needs.hygiene>=95)addMood(s,'fresh');}})},
 bath:{l:'Take a Bath',i:'hygiene',adv:{hygiene:3,fun:.6},autoIf:s=>s.needs.hygiene<60,
  build:(s,o)=>useAct('bath',o,'in','bath',{fill:'hygiene',min:25,max:70,rates:{hygiene:170,fun:22},onEnd:(s,a,st)=>{if(st.el>=25)addMood(s,'bathBliss');}})},
 washHands:{l:'Wash Hands',i:'hygiene',vis:1,adv:{hygiene:.7},autoIf:s=>s.needs.hygiene<85,build:(s,o)=>useAct('washHands',o,'front','use',{min:3,max:3,rates:{hygiene:180}})},
 brushTeeth:{l:'Brush Teeth',i:'hygiene',adv:{hygiene:.9},autoIf:s=>s.needs.hygiene<80&&(hourOf(G.time)<10||hourOf(G.time)>20),build:(s,o)=>useAct('brushTeeth',o,'front','use',{min:5,max:5,rates:{hygiene:150}})},
 watchTV:{l:'Watch TV',i:'fun',vis:1,adv:{fun:2.3},trait:{couch:1.2},build:(s,o)=>tvAct('watchTV','Watch TV',s,o,{fill:'fun',min:30,max:180,rates:{fun:o.def.fun*(s.has('couch')?1.5:1),energy:.5}})},
 watchCooking:{l:'Watch Cooking Show',i:'cooking',skill:'cooking',build:(s,o)=>tvAct('watchCooking','Cooking Show',s,o,{min:30,max:120,rates:{fun:o.def.fun*.6},xp:{cooking:28}})},
 watchWorkout:{l:'Work Out to TV',i:'fitness',skill:'fitness',build:(s,o)=>A('watchWorkout','TV Workout','fitness',[U(o,'tvstand','exercise',{min:30,max:90,rates:{energy:-10,hygiene:-7,fun:s.has('athletic')?10:2},xp:{fitness:45},onDo:()=>{o.state.on=1;},onEnd:(s,a,st)=>{o.state.on=0;if(st.el>=40){addMood(s,'workoutHigh');wishEvent(s,'workout');}}})],{obj:o})},
 playGames:{l:'Play Video Games',i:'fun',adv:{fun:2.1},build:(s,o)=>pcAct('playGames','Play Games','fun',s,o,{fill:'fun',min:30,max:150,rates:{fun:o.def.fun},xp:{logic:8}})},
 browse:{l:'Browse the Web',i:'fun',adv:{fun:.9,social:.6},build:(s,o)=>pcAct('browse','Browse the Web','fun',s,o,{min:20,max:60,rates:{fun:14,social:8}})},
 chatOnline:{l:'Chat Online',i:'social',adv:{social:1.6},build:(s,o)=>pcAct('chatOnline','Chat Online','social',s,o,{fill:'social',min:20,max:60,rates:{social:32,fun:4}})},
 freelance:{l:'Freelance Coding',i:'coin',avail:s=>s.level('logic')>=2||'Needs Logic 2',
  build:(s,o)=>pcAct('freelance','Freelance Coding','coin',s,o,{min:60,max:240,rates:{fun:-6,energy:-4},xp:{logic:30},tick:(s,a,st,dm)=>{st.earn=(st.earn||0)+(12+s.level('logic')*9)*(o.def.q?1.2:1)*dm/60;if(st.earn>=20){earn(Math.floor(st.earn),s);st.earn-=Math.floor(st.earn);}}})},
 study:{l:'Study Programming',i:'logic',skill:'logic',build:(s,o)=>pcAct('study','Study Programming','logic',s,o,{min:60,max:180,rates:{fun:-3},xp:{logic:60}})},
 findJob:{l:'Find a Job...',i:'job',ui:1},
 dance:{l:'Dance',i:'note',vis:1,adv:{fun:1.9},trait:{musical:.8,athletic:.3},build:(s,o)=>useAct('dance',o,'near','dance',{fill:'fun',min:20,max:90,rates:{fun:26*(s.has('musical')?1.3:1),energy:-6},xp:{fitness:10},onDo:()=>{o.state.on=1;},onEnd:()=>{o.state.on=0;}})},
 readNovel:{l:'Read a Novel',i:'book',vis:1,adv:{fun:1.4},trait:{bookworm:1.3},build:(s,o)=>readAct('readNovel','Read a Novel',s,o,{fill:'fun',min:30,max:120,rates:{fun:16*(s.has('bookworm')?1.7:1)},onEnd:(s,a,st)=>{if(s.has('bookworm')&&(st.el||0)>=30)addMood(s,'goodBook');}})},
 readCooking:{l:'Read a Cookbook',i:'cooking',skill:'cooking',build:(s,o)=>readAct('readCooking','Read a Cookbook',s,o,{min:60,max:120,rates:{fun:3},xp:{cooking:40}})},
 readLogic:{l:'Read Logic Puzzles',i:'logic',skill:'logic',build:(s,o)=>readAct('readLogic','Read Logic Puzzles',s,o,{min:60,max:120,rates:{fun:3},xp:{logic:40}})},
 readGarden:{l:'Read a Gardening Guide',i:'gardening',skill:'gardening',build:(s,o)=>readAct('readGarden','Gardening Guide',s,o,{min:60,max:120,rates:{fun:3},xp:{gardening:40}})},
 chess:{l:'Play Chess',i:'logic',vis:1,adv:{fun:1.1},skill:'logic',trait:{genius:.6,bookworm:.4},build:(s,o)=>A('chess','Play Chess','logic',[U(o,'chess','sitChess',{min:45,max:150,rates:{fun:12},xp:{logic:65},tick:(s,a,st,dm)=>{const oth=Object.values(o.users).find(id=>id!==s.id);const p=oth&&personById(oth);if(p&&p.act&&p.act.id==='chess'){s.needs.social=clamp(s.needs.social+14*dm/60,0,100);if(chance(dm*.05)){const r=rel(s,p);r.met=true;r.f=clamp(r.f+1,-100,100);}}},onEnd:(s,a,st)=>{if(st.el>=40)wishEvent(s,'chess');}})],{obj:o})},
 paint:{l:'Paint',i:'painting',adv:{fun:.8},skill:'painting',trait:{artistic:1.4},build:(s,o)=>useAct('paint',o,'front','paint',{min:60,max:240,rates:{fun:s.has('artistic')?20:9},xp:{painting:70},
  onDo:()=>{if(!o.state.art)o.state.art=randomArt(0);o.state.prog=o.state.prog||0;},tick:(s,a,st,dm)=>{o.state.prog+=(25+6*s.level('painting'))*(s.has('artistic')?1.3:1)*dm/60;},until:()=>o.state.prog>=100,onEnd:(s)=>{if(o.state.prog>=100)finishPainting(s,o);}})},
 playGuitar:{l:'Play Guitar',i:'guitar',vis:1,adv:{fun:1.2},skill:'guitar',trait:{musical:1.4},build:(s,o)=>useAct('playGuitar',o,'front','guitar',{min:30,max:150,rates:{fun:s.has('musical')?24:15},xp:{guitar:70},onDo:()=>{o.state.out=1;},tick:(s,a,st,dm)=>{if(chance(dm*.8))addParticle({type:'note',x:s.x+rnd()*10-5,y:s.y-24,vx:rnd()*10-5,vy:-14,life:1.6});},onEnd:(s,a,st)=>{o.state.out=0;if(st.el>=60)addMood(s,'jamming');}})},
 busk:{l:'Busk for Tips',i:'coin',avail:s=>s.level('guitar')>=3||'Needs Guitar 3',build:(s,o)=>buskAct(s,o)},
 run:{l:'Jog on Treadmill',i:'fitness',adv:{fun:0},skill:'fitness',trait:{athletic:1.4},build:(s,o)=>useAct('run',o,'in','run',{min:30,max:120,rates:{energy:-12,hygiene:-10,fun:s.has('athletic')?14:-3},xp:{fitness:75},onEnd:(s,a,st)=>{if(st.el>=40){addMood(s,'workoutHigh');wishEvent(s,'workout');}}})},
 lift:{l:'Lift Weights',i:'fitness',skill:'fitness',trait:{athletic:1.2},build:(s,o)=>useAct('lift',o,'front','lift',{min:30,max:90,rates:{energy:-10,hygiene:-9,fun:s.has('athletic')?12:-3},xp:{fitness:70},onEnd:(s,a,st)=>{if(st.el>=40){addMood(s,'workoutHigh');wishEvent(s,'workout');}}})},
 speech:{l:'Practice Speech',i:'charisma',skill:'charisma',trait:{social:.5},build:(s,o)=>useAct('speech',o,'front','talk',{min:30,max:90,rates:{fun:-2},xp:{charisma:60}})},
 admire:{l:'Admire Reflection',i:'smile',adv:{fun:.3},build:(s,o)=>useAct('admire',o,'front','idle',{min:5,max:5,rates:{fun:50},onEnd:(s)=>addMood(s,'confident')})},
 stargaze:{l:'Stargaze',i:'star',adv:{fun:1.2},skill:'logic',avail:()=>(hourOf(G.time)>=19||hourOf(G.time)<5)||'Only at night',build:(s,o)=>useAct('stargaze',o,'front','stargaze',{min:30,max:90,rates:{fun:18},xp:{logic:45},onEnd:(s,a,st)=>{if(st.el>=30)addMood(s,'starry');}})},
 warmUp:{l:'Warm Up',i:'fire',vis:1,adv:{fun:.8},autoIf:()=>G.season===3||isNight(),build:(s,o)=>useAct('warmUp',o,'front','warm',{min:15,max:45,rates:{fun:8,energy:2},onEnd:(s)=>addMood(s,'warm')})},
 watchFish:{l:'Watch the Fish',i:'fun',vis:1,adv:{fun:.9},build:(s,o)=>useAct('watchFish',o,'front','idle',{min:15,max:45,rates:{fun:10}})},
 plant:{l:'Plant...',i:'gardening',menu:'crops',avail:(s,o)=>G.season===3?'Too cold to plant':!(o.state&&o.state.crop)||'Already planted'},
 water:{l:'Water',i:'bladder',adv:{fun:.3},trait:{green:1},autoIf:(s,o)=>o.state&&o.state.crop&&o.state.water<35,skill:'gardening',avail:(s,o)=>(o.state&&o.state.crop)?true:'Nothing planted',
  build:(s,o)=>useAct('water',o,'front','water',{min:5,max:5,xp:{gardening:22},onEnd:()=>{o.state.water=100;}})},
 harvest:{l:'Harvest',i:'gardening',adv:{fun:.6},trait:{green:1},autoIf:(s,o)=>o.state&&o.state.g>=100,avail:(s,o)=>(o.state&&o.state.g>=100)?true:'Not ripe yet',
  build:(s,o)=>useAct('harvest',o,'front','garden',{min:6,max:6,xp:{gardening:40},onEnd:(s)=>harvestPlot(s,o)})},
 dig:{l:'Dig Up Plant',i:'remove',avail:(s,o)=>(o.state&&o.state.crop)?true:'Nothing planted',build:(s,o)=>useAct('dig',o,'front','garden',{min:5,max:5,onEnd:()=>{o.state={};}})},
 grill:{l:'Grill...',i:'fire',menu:'grill'},
 payBills:{l:'Pay Bills',i:'coin',avail:()=>G.bills?true:'No bills right now',build:(s,o)=>useAct('payBills',o,'front','use',{min:3,max:3,onEnd:()=>payBills()})},
};
function tvAct(id,label,s,o,opt){
 const D=distField(s.tx(),s.ty());let best=null,bd=Infinity;const tr=turnsOf(o.def)?(o.rot||0):0,[fx,fy]=FVEC[tr],cx=o.x+o.def.w/2,cy=o.y+o.def.h/2;
 for(const so of G.objects){if(!so.def.seat||(turnsOf(so.def)?(so.rot||0):0)!==OPP_ROT[tr]||!sameSide(o,so.x,so.y))continue;
  for(const sl of slotsFor(so,'sit')){if(so.users[sl.key])continue;const si=Number(sl.key.slice(1)),sw=(so.rot||0)>=2,dx=so.x+(sw?0:si)+.5-cx,dy=so.y+(sw?si:0)+.5-cy,along=dx*fx+dy*fy,across=Math.abs(dx*fy-dy*fx);
   if(along<=0||along>7.5||across>2.6)continue;const opts=[[sl.ax,sl.ay]].concat(sl.alt||[]);
   for(const[x,y]of opts)if(freeTile(x,y)&&sameSide(so,x,y)&&D[I(x,y)]<bd){bd=D[I(x,y)];best={so,sl:Object.assign({},sl,{ax:x,ay:y})};}}}
 const on={onDo:(s,a,st)=>{o.state.on=(o.state.on||0)+1;if(opt.onDo)opt.onDo(s,a,st);},onEnd:(s,a,st)=>{o.state.on=Math.max(0,(o.state.on||1)-1);if(st.el>=60&&id==='watchTV')addMood(s,'hadFun');if(opt.onEnd)opt.onEnd(s,a,st);}};
 const step=best?Object.assign({k:'use',obj:best.so,slot:'sit',pose:'watch',fixedSlot:best.sl},opt,on):Object.assign({k:'use',obj:o,slot:'tvstand',pose:'idle'},opt,on);
 return A(id,label,ACTS[id].i,[step],{obj:o});
}
function pcAct(id,label,icon,s,o,opt){return A(id,label,icon,[Object.assign(U(o,'pc','type'),opt,{onDo:(s,a,st)=>{o.state.on=1;if(opt.onDo)opt.onDo(s,a,st);},onEnd:(s,a,st)=>{o.state.on=0;if(opt.onEnd)opt.onEnd(s,a,st);}})],{obj:o});}
function readAct(id,label,s,o,opt){return A(id,label,ACTS[id].i,[U(o,'front','use',{min:2,max:2}),Object.assign({k:'seat',purpose:'read',pose:'read',standPose:'readStand',near:o},opt)],{obj:o});}
function buskAct(s,o){const xs=[];for(let x=8;x<20;x++)if(freeTile(x,SIDEY))xs.push(x);const x=pick(xs.length?xs:[12]);
 return A('busk','Busk for Tips','coin',[{k:'walk',x,y:SIDEY},{k:'wait',pose:'guitar',dir:'down',min:60,max:150,rates:{fun:10,social:10},xp:{guitar:50},onDo:()=>{o.state.out=1;},
  tick:(s,a,st,dm)=>{if(chance(dm*.8))addParticle({type:'note',x:s.x,y:s.y-24,vx:rnd()*10-5,vy:-14,life:1.6});if(chance(dm*.06)){const tip=ri(2,6)+s.level('guitar')*ri(1,3);st.tips=(st.tips||0)+tip;earn(tip,s);}},
  onEnd:(s,a,st)=>{o.state.out=0;if((st.tips||0)>=40){addMood(s,'crowd');wishEvent(s,'tips');}}}],{obj:o,onEnd:()=>{o.state.out=0;}});}

// cooking
function cookAct(s,fridge,rc,group,grill){
 const stove=grill||nearestObj(s,o=>o.def.stove&&!o.def.grill);if(!stove)return null;
 const steps=[];
 if(fridge)steps.push(U(fridge,'front','use',{min:3,max:3,onDo:(s,a)=>{if(!buyIngredients(s,rc))return false;a.paid=1;}}));
 else steps.push({k:'fn',fn:(s,a)=>{if(!buyIngredients(s,rc))return false;a.paid=1;}});
 steps.push(U(stove,'front','cook',{min:rc.time,max:rc.time,xp:{cooking:grill?40:44},onDo:()=>{stove.state.cooking=1;},
  tick:(s,a,st,dm)=>{if(chance(dm*.7))addParticle({type:'steam',x:stove.x*T+4+rnd()*8,y:stove.y*T-6,vx:0,vy:-9,life:1.3});},
  onEnd:(s,a,st)=>{stove.state.cooking=0;if(st.el>=rc.time-.01)a.dish=makeDish(s,rc,stove,fridge,group);}}));
 steps.push({k:'fn',fn:(s,a)=>{if(!a.dish)return false;const it=placeDish(a.dish,stove);if(!it)return false;a.item=it;if(a.dish.q===0){addParticle({type:'smoke',x:stove.x*T+8,y:stove.y*T-8,vx:0,vy:-10,life:2});}return true;}});
 steps.push({k:'fn',fn:(s,a)=>{if(a.item)enqueue(s,eatAct(s,a.item),true);}});
 return A('cook','Cook '+rc.l,grill?'fire':'cooking',steps,{obj:stove});
}
function buyIngredients(s,rc){if(rc.produce){if(totalProduce()<rc.produce){toast('Not enough garden produce','gardening');return false;}useProduce(rc.produce);}
 if(rc.needs){if(!(G.produce[rc.needs]>0)){toast('Needs a '+rc.needs+' from the garden','gardening');return false;}G.produce[rc.needs]--;}
 if(G.money<rc.cost){toast('Not enough money for ingredients','coin');return false;}pay(rc.cost,s);return true;}
function makeDish(s,rc,stove,fridge,group){const lv=s.level('cooking');
 const burn=lv<5&&chance(Math.max(0,.22-lv*.05-(s.has('foodie')?.08:0)));
 let q=lv*.9+(stove.def.q||0)*1.2+(fridge&&fridge.def.q?.6:0)+(s.has('foodie')?2:0)-rc.lvl*.3+(rnd()*4-2);
 const tier=burn?0:q<2?1:q<4.5?2:q<7?3:4;const n=group?Math.max(2,household().filter(p=>p.onLot).length+G.people.filter(p=>p.onLot&&p.visit&&p.visit.kind!=='walker').length):1;
 if(tier>=3)wishEvent(s,'meal');return{recipe:rc.id,label:rc.l,q:tier,hunger:rc.hunger*[.5,.9,1,1.1,1.2][tier],servings:n,fresh:!!rc.fresh,c:rc.c,cook:s.id};}
function surfaceSpots(){const L=[];for(const o of G.objects){const d=o.def;if(!(d.surf||d.counter||d.stove||d.grill)||d.sink)continue;for(let i=0;i<d.w;i++){const x=o.x+i,y=o.y;if(!G.items.some(it=>it.x===x&&it.y===y))L.push({o,x,y});}}return L;}
function placeDish(dish,near){const sp=surfaceSpots().filter(p=>!(p.o.def.stove||p.o.def.grill)||p.o===near);sp.sort((a,b)=>Math.hypot(a.x-near.x,a.y-near.y)-Math.hypot(b.x-near.x,b.y-near.y)+(a.o.def.table?-.5:0)-(b.o.def.table?-.5:0));
 const p=sp[0];if(!p)return null;const it=Object.assign({id:uid('i'),kind:'meal',x:p.x,y:p.y,surf:p.o.id},dish);G.items.push(it);return it;}
function eatAct(s,it){return A('eat','Eat '+it.label,'food',[
 {k:'walk',x:it.x,y:it.y,adj:true},
 {k:'fn',fn:(s,a)=>{if(!G.items.includes(it)||it.servings<=0)return false;it.servings--;a.meal=Object.assign({},it);if(it.servings<=0)removeItem(it);s.carry='plate';s._food=it.c;return true;}},
 {k:'seat',purpose:'eat',pose:'sitEat',standPose:'eat',min:22,max:22,tick:(s,a,st,dm)=>{s.needs.hunger=clamp(s.needs.hunger+a.meal.hunger*dm/22,0,100);},
  onEnd:(s,a,st)=>{finishMeal(s,a);}}],{onEnd:(s,ok)=>{s.carry=null;}});}
function finishMeal(s,a){const m=a.meal;if(!m)return;
 if(m.q===0)addMood(s,'badMeal');else if(m.q===3)addMood(s,'greatMeal');else if(m.q===4)addMood(s,'amazingMeal');if(m.fresh)addMood(s,'gardenFresh');
 if(s.role!=='household'&&m.q>=3){const c=personById(m.cook);if(c){const r=rel(s,c);r.f=clamp(r.f+4,-100,100);}}
 let spot=null;if(a.table&&!G.items.some(i=>i.x===a.table.x&&i.y===a.table.y))spot={x:a.table.x,y:a.table.y,surf:a.table.o.id};
 if(!spot){const sp=surfaceSpots().filter(p=>!p.o.def.stove&&!p.o.def.grill).sort((p,q)=>Math.hypot(p.x*T-s.x,p.y*T-s.y)-Math.hypot(q.x*T-s.x,q.y*T-s.y))[0];if(sp&&Math.hypot(sp.x*T-s.x,sp.y*T-s.y)<T*5)spot={x:sp.x,y:sp.y,surf:sp.o.id};}
 if(spot){G.items.push({id:uid('i'),kind:'dirty',x:spot.x,y:spot.y,surf:spot.surf});roomDecorAll();}
 if(s.has('neat')&&spot&&s.role==='household'){const it=G.items[G.items.length-1];enqueue(s,cleanAct(s,it),true);}}
function cleanAct(s,it){const sink=()=>nearestObj(s,o=>o.def.sink||o.def.trash);
 return A('clean',it.kind==='puddle'?'Mop Up':'Clean Up','hygiene',[{k:'walk',x:it.x,y:it.y,adj:it.kind!=='puddle'},
  {k:'fn',fn:(s,a)=>{if(!G.items.includes(it))return false;if(it.kind==='puddle')return true;removeItem(it);s.carry='dirty';return true;}},
  it.kind==='puddle'?{k:'wait',pose:'garden',min:8,onEnd:()=>{removeItem(it);}}:{k:'fn',fn:(s,a)=>{const k=sink();if(k)a.steps.splice(a.si+1,0,U(k,'front','use',{min:3,max:3}));}}
 ],{onEnd:(s)=>{s.carry=null;}});}
function removeItem(it){const i=G.items.indexOf(it);if(i>=0)G.items.splice(i,1);roomDecorAll();}
function totalProduce(){return Object.values(G.produce).reduce((a,b)=>a+b,0);}
function useProduce(n){for(const k of Object.keys(G.produce)){while(n>0&&G.produce[k]>0){G.produce[k]--;n--;}}}

// painting & garden results
function finishPainting(s,o){const lv=s.level('painting');let q=lv+(s.has('artistic')?2:0)+(moodLevel(moodScore(s)).id>=3?1:0)+(rnd()*3-1.5);
 const tier=q<2?0:q<4?1:q<6?2:q<8?3:4;const names=['Amateur','Decent','Fine','Gallery-Worthy','Masterpiece'];
 const base=[[40,80],[90,180],[200,400],[450,900],[1000,2500]][tier];let val=ri(base[0],base[1])*(s.has('artistic')?1.25:1);val=Math.round(val/5)*5;
 const art=o.state.art;art.q=tier;const title=pick(ART_ADJ)+' '+pick(ART_NOUN);o.state={};
 if(tier===4)addMood(s,'masterpiece');else addMood(s,'inspired');wishEvent(s,'painting');gainXP(s,'painting',30);
 UI.paintingDone({title,tier:names[tier],value:val,art,painter:s.first});}
function harvestPlot(s,o){const c=CROPS[o.state.crop];if(!c)return;const n=1+Math.floor(s.level('gardening')/3)+(chance(.35)?1:0);G.produce[o.state.crop]=(G.produce[o.state.crop]||0)+n;
 toast(`${s.first} harvested ${n} ${c.l.toLowerCase()}`,'gardening');addMood(s,'harvest');wishEvent(s,'harvest');o.state={};fxText(o.x*T+8,o.y*T-6,'+'+n+' '+c.l,'#9fe870');}

// ---------- social ----------
function socialAct(s,t,key){const S=SOCIALS[key];return A('social',S.l+' with '+t.first,S.icon||'social',[{k:'approach',target:t},{k:'social',target:t,key}],{target:t});}
function canSocial(a,b){return b!==a&&b.onLot&&!b.away&&!(b.holdFor&&b.holdFor!==a.id&&G.time<b.holdUntil)&&!(b.act&&b.act.sleeping);}
function resolveSocial(a,b,key){const S=SOCIALS[key],r=rel(a,b);
 let p=S.base+r.f/250+a.level('charisma')*.02;
 if(S.rom){p+=(a.has('charmer')?.15:0)+r.r/250-(r.f<20?.2:0);const ot=partnerOf(b);if(ot&&ot!==a.id)p-=.35;}
 if(!S.mean&&!S.rom){if(b.has('loner'))p-=.06;if(b.has('social'))p+=.06;}
 p+=[-.2,-.08,0,.05,.1][moodLevel(moodScore(b)).id];p=clamp(p,.05,.97);const ok=chance(p);
 const mul=(a.reward('magnet')||b.reward('magnet')?1.5:1)*(a.has('social')?1.1:1);
 const firstMeet=!r.met;r.met=true;r.last=G.time;
 if(S.f)r.f=clamp(r.f+(ok?S.f[0]*mul:S.f[1]),-100,100);
 if(S.r)r.r=clamp(r.r+(ok?S.r[0]*mul*(a.has('charmer')?1.4:1):S.r[1]),0,100);
 for(const[x,m]of[[a,1],[b,.8]]){let g=(S.soc||8)*m;if(x.has('loner'))g*=.7;if(x.has('social'))g*=1.3;x.needs.social=clamp(x.needs.social+g*(ok?1:.4),0,100);if(S.fun&&ok)x.needs.fun=clamp(x.needs.fun+S.fun,0,100);}
 gainXP(a,'charisma',ok?10:5);
 if(firstMeet){wishEvent(a,'meet');if(b.role!=='household')toast(`${a.first} met ${b.first} ${b.last}`,'people');}
 if(ok){if(!S.mean){if(G.time-a.convoT>120)a.convo=0;a.convo++;a.convoT=G.time;if(a.convo>=3){addMood(a,'goodChat');addMood(b,'goodChat');a.convo=0;}}
  if(key==='insult')addMood(b,'insulted');
  if(key==='kiss'&&!r.kissed){r.kissed=1;addMood(a,'firstKiss');addMood(b,'firstKiss');wishEvent(a,'kiss');}
  if(key==='kiss')wishEvent(a,'kiss');
  if(S.special==='partner'){r.partner=true;addMood(a,'inLove');addMood(b,'inLove');wishEvent(a,'partner');toast(`${a.first} and ${b.first} are now partners`,'heart');sfx('promo');}
  if(S.special==='propose'){r.married=true;r.partner=true;addMood(a,'newlywed');addMood(b,'newlywed');toast(`${a.first} and ${b.first} got married!`,'heart');sfx('promo');if(b.role!=='household')moveIn(b);}
  if(S.special==='moveIn')moveIn(b);
  if(S.special==='invite'){b.visit={kind:'visitor',until:G.time+ri(150,300)};clearQueue(b,true);b.autoAt=0;toast(`${b.first} came inside`,'home');}
  if(S.special==='leave')sendHome(b);
  if(S.rom)for(let i=0;i<3;i++)addParticle({type:'heart',x:(a.x+b.x)/2+rnd()*10-5,y:Math.min(a.y,b.y)-26,vx:rnd()*8-4,vy:-12,life:1.6});
 }else{if(S.rom){addMood(a,'rejected');addMood(b,'awkward');}else if(!S.mean)addMood(a,'awkward');
  if(S.special==='moveIn'||S.special==='propose'||S.special==='partner')toast(`${b.first} said no`,'heartbreak');}
 if(a.role==='household'||b.role==='household'){const dv=(S.f?(ok?S.f[0]:S.f[1]):0)+(S.r?(ok?S.r[0]:S.r[1]):0);if(dv)fxText(b.x,b.y-36,(dv>0?'+':'')+Math.round(dv),dv>0?'#9fe870':'#ff8a7a');}
 UI.dirty=true;return ok;}
function moveIn(b){if(household().length>=6){toast('The house is full (6 people max)','home');return;}
 b.role='household';b.visit=null;const cash=ri(800,2500);earn(cash);toast(`${b.first} moved in and brought ${money(cash)}`,'home');sfx('promo');b.wishes=[];b.wishCD=G.time+30;
 if(b.job==null&&chance(.5)){}UI.dirty=true;}

// ---------- autonomy ----------
function advScore(s,R,o){let sc=0;if(R.adv)for(const k in R.adv)sc+=R.adv[k]*urge(s.needs[k]);
 if(R.trait)for(const t in R.trait)if(s.has(t))sc+=R.trait[t]*(.4+urge(s.needs.fun)*.4);
 if(R.skill&&s.role==='household'){const free=Math.min(...NEED_IDS.map(k=>s.needs[k]))/100;sc+=(.22+s.level(R.skill)*.04+(s.job&&CAREERS[s.job.career].skill===R.skill?.45:0))*free;}
 return sc;}
function objDist(D,o){let b=Infinity;for(let dy=-1;dy<=o.def.h;dy++)for(let dx=-1;dx<=o.def.w;dx++){const x=o.x+dx,y=o.y+dy;if(inMap(x,y))b=Math.min(b,D[I(x,y)]);}return b;}
function chooseAuto(s){
 const vis=s.role!=='household',D=distField(s.tx(),s.ty()),C=[];
 for(const o of G.objects){const acts=o.def.acts;if(!acts)continue;if(s.failed[o.id]>G.time)continue;let od=null;
  for(const id of acts){const R=ACTS[id];if(!R||!R.build||R.menu||R.ui)continue;if(!R.adv&&!R.skill&&!R.trait)continue;if(vis&&!R.vis)continue;
   if(R.autoIf&&!R.autoIf(s,o))continue;if(R.avail&&R.avail(s,o)!==true)continue;const sc=advScore(s,R,o);if(sc<=.1)continue;
   if(od==null)od=objDist(D,o);if(od===Infinity)break;C.push({sc:sc-od*.012,go:()=>R.build(s,o)});}
  if(o.def.fridge&&!vis){const R=ACTS.cook;if(R.autoIf(s,o)&&R.avail()===true){const rc=bestRecipe(s);if(rc){const sc=advScore(s,R,o);if(od==null)od=objDist(D,o);if(od<Infinity)C.push({sc:sc-od*.012,go:()=>cookAct(s,o,rc,household().filter(p=>p.onLot).length>1)});}}}}
 for(const it of G.items){if(it.kind==='meal'&&s.needs.hunger<82){const d=D[I(it.x,it.y)];C.push({sc:4.6*urge(s.needs.hunger)+.4-Math.min(d,40)*.01,go:()=>eatAct(s,it)});}
  if(!vis&&(it.kind==='dirty'||it.kind==='puddle')){const w=s.has('neat')?1.3:s.has('slob')?0:.3;if(w)C.push({sc:w-0.005*Math.min(D[I(it.x,it.y)],40),go:()=>cleanAct(s,it)});}}
 if(s.needs.social<85)for(const t of G.people){if(!canSocial(s,t))continue;if(t.visit&&t.visit.kind==='walker')continue;if(vis&&t.role!=='household')continue;const r=relPeek(s,t);
  const sc=3*urge(s.needs.social)+(r&&r.f>30?.3:0)+(s.has('social')?.4:0)-(s.has('loner')?.3:0);C.push({sc,go:()=>socialAct(s,t,autoSocialKey(s,t))});}
 if(!C.length)return null;C.sort((a,b)=>b.sc-a.sc);if(C[0].sc<.15)return null;
 const top=C.slice(0,3).filter(c=>c.sc>C[0].sc*.7);const ch=top[Math.random()<.65?0:Math.floor(Math.random()*top.length)];
 const a=ch.go();if(a)a.user=false;return a;}
function bestRecipe(s){const lv=s.level('cooking');const L=RECIPES.filter(r=>r.lvl<=lv&&r.cost<=G.money&&!r.produce&&!r.needs);return L.length?L[Math.min(L.length-1,Math.floor(rnd()*2)+L.length-2)]||L[L.length-1]:null;}
function autoSocialKey(a,b){const r=rel(a,b);if(!r.met)return'greet';if(r.f<-30)return chance(.5)?'argue':'insult';
 const opts=['chat','chat','joke'];if(r.f>=10)opts.push('compliment');if(r.f>=25)opts.push('hobbies');if(r.f>=40)opts.push('hug');if(r.partner||r.married){opts.push('kiss','flirt');}return pick(opts);}

// ---------- per-sim update ----------
function simUpdate(s,dm){
 if(s.away){awayTick(s,dm);return;}
 if(!s.onLot)return;
 decayNeeds(s,dm);
 if(s.role==='household'){
  if(s.needs.bladder<=0.5&&!(s.act&&s.act.id==='toilet')){accident(s);}
  if(s.needs.energy<=0.5&&!(s.act&&(s.act.sleeping||s.act.id==='passout'))){clearQueue(s,true);s.act=A('passout','Passed Out','zzz',[{k:'wait',pose:'passout',min:60,max:240,fill:'energy',rates:{energy:9},onDo:(s,a)=>{a.sleeping=1;},onEnd:(s,a)=>{a.sleeping=0;addMood(s,'sleptFloor');}}]);toast(`${s.first} passed out from exhaustion`,'zzz');}
 }
 if(s.holdFor&&G.time<s.holdUntil){const h=personById(s.holdFor);if(h&&h.onLot){if(!s.inObj&&!(s.act&&s.act.steps[s.act.si]&&s.act.steps[s.act.si].k==='social'))faceToward(s,h);s.anim.pose=s.inObj?s.anim.pose:'talk';return;}s.holdFor=null;}
 if(s.holdFor&&G.time>=s.holdUntil)s.holdFor=null;
 if(!s.act&&s.queue.length&&s.role==='household'&&(s.needs.bladder<12||s.needs.hunger<10||s.needs.energy<8)&&!['toilet','eat','sleep','snack','cook','nap'].includes(s.queue[0].id)){const a=chooseAuto(s);if(a&&a.id!=='social'){s.act=a;a.si=0;UI.dirty=true;}}
 if(!s.act&&s.queue.length){s.act=s.queue.shift();s.act.si=0;s.act.cancel=false;UI.dirty=true;}
 if(s.act){runAct(s,dm);return;}
 // idle
 s.anim.pose=s.visit&&s.visit.kind==='walker'?'idle':'idle';
 if(s.visit&&s.visit.kind==='walker'){walkerTick(s,dm);return;}
 if(s.visit&&G.time>=s.visit.until){sendHome(s);return;}
 if(G.time>=s.autoAt){const sel=s.id===G.sel;const wait=sel?(G.freeWill==='full'?20:1e9):(G.freeWill==='off'&&s.role==='household'?1e9:0);
  const critical=s.role==='household'&&(s.needs.bladder<14||s.needs.hunger<14||s.needs.energy<12);
  if(G.time-s.idleAt>=wait||critical){const a=chooseAuto(s);if(a){s.act=a;a.si=0;UI.dirty=true;}else{s.autoAt=G.time+ri(6,14);if(chance(.35))wander(s);}}
  else s.autoAt=G.time+3;}
 if(s.role==='household'&&chance(dm*.012)){const low=NEED_IDS.filter(k=>s.needs[k]<22);if(low.length)think(s,pick(low),'think',2400);}
}
function wander(s){const x=s.tx()+ri(-4,4),y=s.ty()+ri(-3,3);if(!freeTile(x,y))return;if(s.role==='household'&&!isInt(x,y)&&isInt(s.tx(),s.ty())&&chance(.7))return;s.act=A('wander','Wander','walk',[{k:'walk',x,y}]);s.act.user=false;}
function accident(s){clearQueue(s,true);s.needs.bladder=100;s.needs.hygiene=Math.max(0,s.needs.hygiene-45);addMood(s,'embarrassed');const[x,y]=[s.tx(),s.ty()];G.items.push({id:uid('i'),kind:'puddle',x,y});roomDecorAll();toast(`${s.first} couldn't hold it`,'bladder');sfx('bad');}

// leaving & returning
const CURB={x:13,y:SIDEY};
function goOffLot(s,kind,dur){s.onLot=false;s.inObj=null;s.path=null;s.act=null;s.queue.length=0;s.away={kind,until:G.time+(dur||60)};releaseAll(s);UI.dirty=true;}
function returnToLot(s,x,y){s.away=null;s.onLot=true;s.place(x,y);s.act=null;s.queue.length=0;s.idleAt=G.time;s.autoAt=G.time+1;UI.dirty=true;}
function awayTick(s,dm){const a=s.away;
 if(a.kind==='work'){decayNeeds(s,dm);workTick(s,dm);if(G.time>=a.until)finishWork(s);return;}
 if(a.kind==='jog'){decayNeeds(s,dm);s.needs.energy=clamp(s.needs.energy-6*dm/60,0,100);s.needs.hygiene=clamp(s.needs.hygiene-10*dm/60,0,100);s.needs.fun=clamp(s.needs.fun+(s.has('athletic')?16:3)*dm/60,0,100);s.needs.social=clamp(s.needs.social+5*dm/60,0,100);gainXP(s,'fitness',60*dm/60);
  if(G.time>=a.until){returnToLot(s,pick([0,MW-1]),SIDEY);addMood(s,'workoutHigh');wishEvent(s,'workout');}return;}
 if(a.kind==='out'){outingTick(s,dm);return;}
 if(a.kind==='home'){if(G.time>=a.until){s.away=null;}}
}
function sendHome(s){if(s.role==='household')return;s.visit={kind:'leaving'};clearQueue(s,true);const ex=s.tx()<MW/2?0:MW-1;s.act=A('leave','Head Home','home',[{k:'walk',x:CURB.x,y:SIDEY},{k:'walk',x:ex,y:SIDEY},{k:'fn',fn:(s)=>{s.onLot=false;s.visit=null;s.away=null;}}]);s.act.user=false;}
function walkerTick(s,dm){const v=s.visit;if(!s.path){if(v.waitUntil&&G.time<v.waitUntil){s.anim.pose='idle';return;}if(!pathTo(s,v.ex,SIDEY)){s.onLot=false;s.visit=null;return;}}
 if(moveAlong(s,dm)){s.onLot=false;s.visit=null;}}
