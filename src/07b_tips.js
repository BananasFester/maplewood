// ================= TIPS: press and hold (or hover) to learn what things are =================
const NEED_INFO={
 hunger:{b:'How full they are. Grab a snack or cook at the fridge, grill outside, or order pizza on the phone. Skilled cooks and better kitchens make tastier meals.',x:'Below 30% they feel Hungry, below 12% Starving.'},
 energy:{b:'How rested they are. Sleep in a bed (nicer beds work faster), nap or doze on a sofa, or make coffee for a small lift.',x:'If it runs out they pass out on the floor and wake up grumpy.'},
 bladder:{b:'How soon they need a bathroom. Use a toilet to reset it.',x:'If it runs out they have an accident and feel embarrassed.'},
 hygiene:{b:'How clean they are. Take a shower or bath, or wash hands and brush teeth at the bathroom sink.',x:'Low hygiene makes them feel Smelly, then Stinky.'},
 fun:{b:'How entertained they are. Watch TV, play on the computer, read, play chess or guitar, dance to the boombox, paint, or watch the fish.',x:'Low fun makes them Bored.'},
 social:{b:'How connected they feel. Tap another person to chat, call a friend on the phone, chat online, or invite neighbors over.',x:'Low social makes them Lonely.'}};
const MOOD_DESC={hungry:'Hunger is low. Eat something soon.',starving:'Hunger is nearly empty. Eat right away.',tired:'Energy is low. Time for bed or a nap.',exhausted:'Running on empty. Sleep now or they will pass out.',
 gottago:'Bladder is low. Find a toilet.',bursting:'About to have an accident. Toilet, now!',smelly:'Hygiene is low. A shower would help.',stinky:'Hygiene is very low. Shower or bathe right away.',
 bored:'Fun is low. Do something entertaining.',verybored:'Fun is very low. Play, read, watch TV or paint.',lonely:'Social is low. Talk to someone.',verylonely:'Social is very low. Chat, call a friend or invite people over.',
 content:'Every need is in good shape.',wellRested:'Got a full night of sleep.',dreamy:'Slept in a luxury bed. Best sleep ever.',sleptFloor:'Passed out and slept on the floor.',groggy:'Woke up before getting enough sleep.',
 greatMeal:'Ate a tasty meal.',amazingMeal:'Ate an excellent meal from a skilled cook.',badMeal:'The food did not turn out well.',gardenFresh:'Ate a dish made with home-grown produce.',
 fresh:'Freshly showered.',bathBliss:'Soaked in a bubble bath.',hadFun:'Had a great time doing something fun.',goodChat:'Enjoyed a nice conversation.',awkward:'A conversation went badly.',
 rejected:'A romantic move was turned down.',insulted:'Someone was mean to them.',firstKiss:'Shared a first kiss!',inLove:'Head over heels for someone.',newlywed:'Just got married!',
 promoted:'Moved up at work.',fired:'Lost their job.',goodWork:'Had a successful day at work.',badWork:'Work did not go well today.',skipped:'Missed a shift at work.',
 comfy:'Sitting or lying somewhere comfortable.',cozy:'The home feels warm and well decorated.',messy:'Dirty dishes or puddles are lying around. Clean up!',embarrassed:'Had an accident. How embarrassing.',
 caffeinated:'Had a cup of coffee.',workoutHigh:'Feeling great after exercising.',wish:'A wish came true.',masterpiece:'Painted something wonderful.',inspired:'Feeling creative. A good time to paint.',
 jamming:'Played music and found the groove.',cheerful:'Cheerful trait: always a little happier.',sunshine:'Lifetime reward: a sunny outlook on life.',cozyRain:'Enjoying the sound of rain from indoors.',
 firstSnow:'The first snow of the year!',party:'Went to a great party.',confident:'Practiced in the mirror and feels sure of themselves.',goodBook:'Read a good book.',harvest:'Brought in a big harvest.',
 crowd:'People loved their street performance.',repo:'Something was taken away for unpaid bills.',starry:'Gazed at the stars.',warm:'Warmed up by the wood stove.',
 fishing:'Spent a peaceful afternoon fishing at the lake.',bigCatch:'Landed a rare golden carp!',derby:'Competed in the fishing derby.',parkDay:'Enjoyed some fresh air at the park.',picnic:'Shared a meal with the whole neighborhood.',visited:'Spent time at a friend\'s house.',marketDay:'Sold goods at the farmers market.'};
const SKILL_INFO={cooking:'Better cooks make tastier meals and unlock new recipes. Train by cooking, reading cookbooks, or watching the cooking show on TV. Helps the Culinary career.',
 logic:'Train by playing chess, studying programming on the computer, reading logic puzzles, or stargazing at night. Helps the Tech career.',
 fitness:'Train on the treadmill or weight rack, by jogging around the block, working out to TV, or dancing. Helps the Sports career.',
 charisma:'Train by practicing speeches in the mirror and chatting with people. Helps the Business career.',
 painting:'Paint at the easel. Higher skill makes paintings worth more, and they can be hung or sold. Helps the Arts career.',
 guitar:'Play the guitar for fun. At level 3 they can busk for tips, and better players earn more. Helps the Music career.',
 gardening:'Plant seeds in garden plots, water them and harvest. Higher skill means bigger harvests. Gardening guides help.'};
const OBJ_DESC={bed_single:'A snug single bed. Sleep here to restore Energy.',bed_double:'A roomy bed for two. Restores Energy faster than a twin.',bed_lux:'The comfiest bed in town. Fastest Energy and the sweetest dreams.',
 chair_dining:'A simple chair. Pull it up to a table for meals.',chair_arm:'A soft armchair for sitting and dozing.',sofa:'A cozy two-seater for lounging, chatting and dozing.',sofa_lux:'A plush three-seater. Very comfortable and very stylish.',
 table_dining:'Meals are served here. Sit at it to eat together.',table_end:'A small side table. Holds lamps and plates.',counter:'Kitchen workspace. Food is prepped here.',sink_k:'Wash the dirty dishes here to keep the kitchen tidy.',
 fridge:'Grab a quick snack or start cooking a meal.',fridge_lux:'A premium fridge. Snacks and meals come out a little better.',stove:'Cooks most meals. Cooking trains the Cooking skill.',stove_pro:'A chef-grade range. Meals turn out better.',
 coffee:'Brew a cup for a quick Energy boost.',trash:'Leftovers and old plates get thrown out here.',toilet:'Resets Bladder.',toilet_lux:'A heated seat. Faster and comfier.',shower:'Restores Hygiene quickly.',
 tub:'A long soak for Hygiene and a little Fun.',sink_b:'Wash hands or brush teeth for a little Hygiene.',tv:'Watch shows for Fun, the cooking channel for Cooking, or work out for Fitness.',tv_big:'A big screen. More Fun than the box TV.',
 pc:'Games, browsing, chatting online, freelance coding, studying and job hunting.',pc_lux:'A fast gaming rig. More Fun than the home computer.',stereo:'Put on music and dance for Fun and a bit of Fitness.',
 bookshelf:'Read novels for Fun, or skill books for Cooking, Logic and Gardening.',chess:'Play chess for Fun and Logic.',easel:'Paint pictures to hang or sell. Trains Painting.',guitar:'Play for Fun and the Guitar skill. Busk outside for tips once skilled.',
 treadmill:'Jog to build Fitness.',dumbbells:'Lift weights to build Fitness.',mirror:'Practice speeches to build Charisma.',telescope:'Stargaze at night for Fun and Logic.',
 lamp_floor:'Lights up the room at night.',lamp_table:'A small lamp with a warm glow.',woodstove:'Keeps the house warm. Cozy up next to it in winter.',lantern:'Lights the yard at night.',
 plant_s:'Decoration. Makes the room cozier.',plant_l:'Decoration. A big leafy plant.',rug:'Decoration. Brightens up a room.',rug_big:'Decoration. A large patterned rug.',tank:'Watch the fish to relax. Great decoration.',
 art_wall:'Decoration for the walls.',clock_wall:'Decoration for the walls.',plot:'Plant seeds, water them, then harvest vegetables to cook with or sell.',tree:'Shade and seasonal color.',bush:'Garden decoration.',
 flowers:'Garden decoration.',bench:'A place to sit outside.',grill:'Cook burgers and more outdoors.',mailbox:'Bills arrive here each Monday. Pay within 3 days to avoid a late fee.',
 streetlamp:'Lights the street at night.',painting:'A painting made in this house.'};
const HUD_TIPS={clock:['sun','Clock and calendar','Each season lasts 7 days. Weather changes from day to day.'],
 'speed:0':['meh','Pause','Stops the clock. You can still give orders while paused.'],'speed:1':['walk','Normal speed','Time runs at the normal pace.'],
 'speed:2':['walk','Fast','About 3 times faster.'],'speed:3':['walk','Fastest','About 10 times faster. Handy for sleep and work hours.'],
 menu:['home','Menu','Sound, free will, saving, help and starting over.'],'zoom:in':['star','Zoom in','Get a closer look. You can also pinch or scroll.'],'zoom:out':['star','Zoom out','See more of the neighborhood. Keep zooming out to see the whole town.'],'zoom:town':['map','Town map','See the whole town: places to visit, community events, neighbors\' homes and lots for sale.'],
 'mode:live':['leaf','Live mode','Play with your household. Tap furniture, people or the floor.'],'mode:buy':['sofa','Buy mode','Shop for furniture and decor, or move and sell what you own.'],
 'mode:build':['hammer','Build mode','Walls, doors, windows, floors and wallpaper.'],phone:['phone','Phone','Call or invite friends, order pizza, throw a party, find a job, sell your harvest and pay bills.'],
 'tab:mood':['smile','Mood','Traits and the moodlets adding up to their mood.'],'tab:skills':['book','Skills','Skill levels from 0 to 10 and how to train them.'],'tab:job':['job','Career','Job, schedule, pay and promotion progress.'],
 'tab:people':['people','Relationships','Everyone they have met. Tap a person to interact.'],'tab:wishes':['star','Wishes','Little goals. Make them come true for happiness points, then spend points on lifetime rewards.'],
 'tool:wall':['wall','Walls','Drag along tile edges to build walls.'],'tool:door':['door','Door','Tap a straight wall to add a door.'],'tool:window':['window','Window','Tap a straight wall to add a window. Lets in daylight.'],
 'tool:floor':['floor','Floors','Pick a style, then drag a box to lay flooring.'],'tool:paper':['roller','Wallpaper','Pick a pattern, then tap the floor inside a room to paper its walls.'],'tool:remove':['remove','Remove','Drag across walls, doors or windows to take them down. Refunds half.']};
const needWord=v=>v>=72?'Great':v>=45?'Okay':v>=30?'Getting low':v>=12?'Low':'Very low';
const spanLeft=m=>m>=60?Math.round(m/60)+' hr':Math.max(1,Math.ceil(m))+' min';
function objStats(d){const o=[];if(d.energy)o.push('Energy '+'★'.repeat(Math.max(1,d.energy-9)));if(d.comfort)o.push('Comfort '+'★'.repeat(d.comfort));if(d.fun)o.push('Fun '+'★'.repeat(Math.round(d.fun/11)));if(d.decor)o.push('Decor +'+d.decor);return o;}
function personTip(p){const ml=moodLevel(moodScore(p)),s=selSim();let st=ml.l;if(p.away)st=p.away.kind==='work'?'At work':'Away';else if(p.act&&p.act.id!=='wander')st+=' · '+p.act.label;
 const r=s&&s!==p?relPeek(s,p):null;const job=p.job?CAREERS[p.job.career].lv[p.job.level][0]:'';
 return{i:'people',t:p.name,s:st,b:(p.role==='household'?'Lives here.':p.visit?'Visiting.':'A neighbor.')+(r&&r.met?` ${s.first}: ${relLabel(r)}.`:r?` ${s.first} has not met them yet.`:''),u:p.traits.map(t=>TRAITS[t].l),x:job?'Works as '+job+'.':''};}
function tipData(key){const ix=key.indexOf(':'),k=ix<0?key:key.slice(0,ix),a=ix<0?'':key.slice(ix+1),s=selSim();
 if(HUD_TIPS[key]){const[i,t,b]=HUD_TIPS[key];return{i,t,b};}
 switch(k){
  case 'need':{const n=NEEDS.find(x=>x.id===a),I=NEED_INFO[a];if(!n)return null;const v=s?Math.round(s.needs[a]):null;return{i:a,t:n.l,s:v==null?'':`${s.first}: ${v}% · ${needWord(v)}`,b:I.b,x:`${I.x} A full bar lasts about ${Math.round(100/n.decay)} game hours.`};}
  case 'mood':{const d=MOODLETS[a];if(!d)return null;const m=s&&s.moodlets.find(x=>x.id===a),left=m&&m.until?m.until-G.time:0;return{i:d.i,t:d.l,s:`Mood ${d.v>0?'+':''}${d.v}${left>0?' · '+spanLeft(left)+' left':''}`,b:MOOD_DESC[a]||''};}
  case 'moodsum':{if(!s)return null;const ml=moodLevel(moodScore(s));return{i:'smile',t:`${s.first} feels ${ml.l.toLowerCase()}`,b:'Mood adds up all their moodlets. Keep needs up and do things they enjoy. A good mood at work raises job performance.',u:s.moodlets.map(m=>{const d=MOODLETS[m.id];return`${d.l} ${d.v>0?'+':''}${d.v}`;})};}
  case 'skill':{const sk=SKILLS[a];if(!sk)return null;return{i:a,t:sk.l,s:s?`${s.first}: level ${s.level(a)} of 10`:'',b:SKILL_INFO[a]};}
  case 'trait':{const t=TRAITS[a];return t?{i:'heart',t:t.l,s:'Personality trait',b:t.d}:null;}
  case 'job':{if(!s)return null;if(!s.job)return{i:'job',t:'No job yet',b:'Pick a career from the phone or a computer. Six careers are hiring, and pay rises with each promotion.'};const C=CAREERS[s.job.career];return{i:'job',t:C.lv[s.job.level][0],s:`${C.l} career · level ${s.job.level+1} of 5`,b:`The carpool arrives 30 minutes before each shift. Promotions need full performance and enough ${SKILLS[C.skill].l} skill. A good mood at work raises performance.`};}
  case 'rel':{const p=personById(a);if(!p||!s)return null;const r=relPeek(s,p);return{i:'people',t:p.name,s:r?relLabel(r):'',b:'The green bar is friendship and the pink bar is romance. Friendly chats grow them; mean actions shrink them. Tap to interact.'};}
  case 'wish':return{i:'star',t:'Wish',b:'Something they would love to do. Make it happen to earn happiness points, or dismiss it to get a new wish later.'};
  case 'rewards':return{i:'gift',t:'Happiness points',b:'Earned from fulfilled wishes. Spend them on lifetime rewards that make life easier.'};
  case 'q':{if(!s)return null;const i=+a,act=i<0?s.act:s.queue[i];if(!act)return null;return{i:act.icon,t:act.label,s:i<0?`Doing now · ${Math.round(actProgress(s)*100)}%`:`Up next · #${i+1}`,b:(act.user?'':'Chosen on their own (free will). ')+'Tap to cancel.'};}
  case 'sim':{const p=a==='sel'?s:personById(a);return p?personTip(p):null;}
  case 'money':return{i:'coin',t:'Household money',s:money(G.money),b:'Earn it from jobs, freelance coding, busking, and selling paintings or harvests. Spend it in Buy and Build mode.',x:G.bills?`Bills of ${money(G.bills.amount)} are due ${DAYS[wday(G.bills.due)]}. Pay at the mailbox or by phone.`:'Bills arrive in the mailbox every Monday.'};
  case 'obj':{const d=CATALOG[a];if(!d)return null;return{i:'sofa',t:d.n,s:d.p?money(d.p):'',b:OBJ_DESC[a]||'',u:(d.acts||[]).map(x=>ACTS[x]&&ACTS[x].l).filter(Boolean).map(l=>l.replace('...','')),x:objStats(d).join(' · ')};}
  case 'floor':{const f=FLOORS[a];return f?{i:'floor',t:f.l,s:money(f.p)+' per tile',b:'Drag a box on the ground to lay this floor.'}:null;}
  case 'paper':{const w=WALLPAPERS[a];return w?{i:'roller',t:w.l,s:money(BUILD_COST.wallpaper)+' per wall',b:'Tap the floor inside a room to paper its walls.'}:null;}
 }
 return null;}
function worldTip(wx,wy){const s=hitSim(wx,wy);if(s)return personTip(s);
 const it=hitItem(wx,wy);if(it){if(it.kind==='meal')return{i:'food',t:it.label,s:['Burnt','Okay','Good','Great','Amazing'][it.q]+' quality'+(it.servings>1?` · ${it.servings} servings`:''),b:'Tap to eat it or throw it out.'};
  if(it.kind==='dirty')return{i:'hygiene',t:'Dirty dishes',b:'Makes the home feel messy. Tap to clean up, or do the dishes at the kitchen sink.'};
  if(it.kind==='puddle')return{i:'bladder',t:'Puddle',b:'Makes the home feel messy. Tap to mop it up.'};}
 const o=hitObject(wx,wy,true);if(o){const d=o.def;let st=d.p?'Worth '+money(Math.round(d.p*.6)):'';
  if(o.type==='painting'&&o.state&&o.state.title)st=`“${o.state.title}”`+(o.state.value?' · worth '+money(o.state.value):'');
  if(d.plot&&o.state){const p=o.state;st=p.crop?`${CROPS[p.crop].l} · ${Math.floor(p.g)}% grown · water ${Math.round(p.water)}%`:'Empty';}
  return{i:'sofa',t:d.n,s:st,b:OBJ_DESC[o.type]||'',u:(d.acts||[]).map(x=>ACTS[x]&&ACTS[x].l).filter(Boolean).map(l=>l.replace('...','')),x:objStats(d).join(' · ')};}
 const tx=Math.floor(wx/T),ty=Math.floor(wy/T);if(!inMap(tx,ty))return null;
 if(ty>=SIDEY)return{i:'walk',t:ty>SIDEY?(homeLot()?homeLot().street:'Maple Lane'):'Sidewalk',b:'Neighbors stroll by here. Tap one to say hello. The carpool and pizza stop at the curb.'};
 if(isInt(tx,ty))return{i:'home',t:'Floor',b:'Tap to walk here. Build mode changes floors, walls and wallpaper.'};
 return{i:'leaf',t:'Yard',b:'Tap to walk here. Buy mode has garden plots, trees, flowers and a grill.'};}
const TIP={el:null,tgt:null,mode:null,timer:0,hideT:0,hovT:0,hov:null,press:null,suppress:0,
 init(){const el=document.createElement('div');el.id='tip';el.className='card hidden';el.setAttribute('role','tooltip');$('#ui').appendChild(el);this.el=el;
  const tipEl=e=>e.target&&e.target.closest?e.target.closest('[data-tip]'):null;
  document.addEventListener('pointerdown',e=>{const t=tipEl(e);if(e.pointerType==='mouse'){clearTimeout(this.hovT);if(this.mode==='hover')this.hide();this.hovBlock=t;if(e.button!==0)return;}if(this.mode&&this.mode!=='hover'&&t!==this.tgt)this.hide();
   if(!t)return;clearTimeout(this.timer);this.press={x:e.clientX,y:e.clientY};this.timer=setTimeout(()=>{this.press=null;if(this.show(t,'press')){this.suppress=performance.now()+900;try{navigator.vibrate&&navigator.vibrate(8);}catch(_){}}},430);},true);
  document.addEventListener('pointermove',e=>{if(this.press&&Math.hypot(e.clientX-this.press.x,e.clientY-this.press.y)>10){clearTimeout(this.timer);this.press=null;}},true);
  const end=()=>{clearTimeout(this.timer);this.press=null;if(this.mode==='press'){clearTimeout(this.hideT);this.hideT=setTimeout(()=>this.hide(),4000);}};
  document.addEventListener('pointerup',end,true);document.addEventListener('pointercancel',end,true);
  document.addEventListener('click',e=>{if(performance.now()<this.suppress){e.stopPropagation();e.preventDefault();this.suppress=0;}},true);
  document.addEventListener('contextmenu',e=>{if(tipEl(e))e.preventDefault();},true);
  document.addEventListener('pointerover',e=>{if(e.pointerType!=='mouse')return;const t=tipEl(e);if(t===this.hov)return;this.hov=t;clearTimeout(this.hovT);if(t!==this.hovBlock)this.hovBlock=null;
   if(!t){if(this.mode==='hover')this.hide();return;}if(t===this.hovBlock)return;this.hovT=setTimeout(()=>{if(this.hov===t&&this.mode!=='press')this.show(t,'hover');},500);},true);
  document.addEventListener('scroll',()=>this.hide(),true);},
 html(d){return`<div class="tt">${d.i?ico(d.i,22):''}<span>${esc(d.t)}</span></div>${d.s?`<div class="ts">${esc(say(d.s))}</div>`:''}${d.b?`<p>${esc(say(d.b))}</p>`:''}${d.u&&d.u.length?`<div class="tu">${d.u.map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div>`:''}${d.x?`<div class="tx">${esc(d.x)}</div>`:''}`;},
 show(t,mode){const d=tipData(t.dataset.tip);if(!d)return false;this.tgt=t;TUT.tipped=true;const r=t.getBoundingClientRect();this.place(d,r.left+r.width/2,r.top,r.bottom,mode);return true;},
 // world tooltip at a screen point (finger covers the point, so prefer above it); mode 'hover' stays until the mouse moves
 showAt(d,x,y,mode){if(!d)return false;this.tgt='world';TUT.tipped=true;this.place(d,x,y-36,y+30,mode||'press');clearTimeout(this.hideT);if(mode!=='hover')this.hideT=setTimeout(()=>this.hide(),4500);return true;},
 place(d,cx,top,bottom,mode){const el=this.el;el.innerHTML=this.html(d);el.classList.remove('hidden');el.style.left='0px';el.style.top='0px';this.mode=mode;clearTimeout(this.hideT);
  const w=el.offsetWidth,h=el.offsetHeight,W2=innerWidth,H2=innerHeight,m=8;let y=top-h-10;if(y<m+40)y=Math.min(H2-h-m,bottom+10);
  el.style.left=Math.round(clamp(cx-w/2,m,W2-w-m))+'px';el.style.top=Math.round(Math.max(m,y))+'px';},
 hide(){if(!this.el)return;this.el.classList.add('hidden');this.mode=null;this.tgt=null;clearTimeout(this.hideT);},
 open(){return!!this.mode;}
};
