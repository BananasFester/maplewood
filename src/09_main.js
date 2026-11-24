// ================= MAIN: loop & boot =================
let lastT=0,errCount=0;
function step(dt){if(!G.started)return;if(G.paused||UI.modalOpen()||G.mode!=='live'||G.speed===0)return;
 const rate=G.skip?45:SPEEDS[G.speed];let dm=dt*rate;while(dm>1e-6){const s=Math.min(dm,.5);gameStep(s);dm-=s;}
 if(G.skip){const hh=household().filter(p=>p.onLot&&!p.away);const still=hh.length?hh.every(p=>p.act&&p.act.sleeping):household().every(p=>p.away);if(!still)G.skip=false;}}
function frame(t){const dt=lastT?Math.min(.1,(t-lastT)/1000):.016;lastT=t;
 try{step(dt);DESK.frame(dt);if(TV.on)TV.render(dt);else render(dt);UI.update(dt);TUT.frame(dt);}catch(e){errCount++;console.error(e);if(errCount===1)toast('Something hiccuped. The game keeps going.','frown');}
 requestAnimationFrame(frame);}
function start(hot){
 hot=hot||{};initRender();DESK.init();UI.init();TIP.init();TUT.init();TV.init();initInput();
 let d=hot.save||null;if(!d)d=loadLocal();let ok=false;
 if(d){try{loadGame(d);G.loadedAt=d.savedAt||0;ok=true;}catch(e){console.error('load failed',e);}}
 if(!ok)startSample();
 applySmooth(G.settings.smooth!==false);setWallsUp(!!G.settings.wallsUp);
 if(hot.cam){if(hot.cam.z)setZoom(hot.cam.z);R.camX=hot.cam.x;R.camY=hot.cam.y;clampCam();}else centerHome();
 if(hot.save){UI.dirty=true;}else UI.welcome(ok?'continue':'new');
 try{window.claude&&window.claude.hot&&window.claude.hot.snapshot&&window.claude.hot.snapshot(()=>({save:serialize(),cam:{x:R.camX,y:R.camY,z:R.Z}}));}catch(e){}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)autosave(true);});window.addEventListener('pagehide',()=>autosave(true));
 if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{UI.dirty=true;});
 window.__ML={G,W,R,UI,BB,gameStep,startSample,serialize,loadGame,household,personById,ACTS,enqueue,cookAct,RECIPES,socialAct,CATALOG,setZoom,centerOn,AU,MUS,GLS,TIP,applySmooth,zoomStep,tipData,worldTip,TUT,LOTS,startFresh,homeChecks,BB_:BB,loadLot,startHousehold,TV,genTown,getTown:()=>TOWN,lotPlanFor,moveHousehold,goOut,finishOuting,outingBlock,sellGoods};/*DEBUG*/window.__ML.ev=(c)=>eval(c);
 requestAnimationFrame(frame);setTimeout(cloudInit,120);
}
{const H=window.claude&&window.claude.hot;if(H&&H.ready)H.ready(start);else start((H&&H.data)||{});}
