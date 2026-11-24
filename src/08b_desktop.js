// ================= DESKTOP: playing with a mouse and keyboard =================
// The game is built touch first. With a mouse: right-drag (or middle-drag) moves the camera in every mode,
// hovering shows tooltips, the buy ghost follows the pointer and a click places it, the wheel and a drag
// scroll the catalog strips, and the words say "click" and "hover" instead of "tap" and "press and hold".
// DESK.mouse follows the last pointer used, so a touch laptop switches back and forth.
const DESK={mouse:false,keys:new Set(),hov:null,hovT:0,tipAt:null,strip:null,stripDrag:0,
 init(){let m=false;try{m=matchMedia('(hover:hover) and (pointer:fine)').matches;}catch(_){}this.setMouse(m,true);
  const seen=e=>{if(e.pointerType==='mouse')this.setMouse(true);else if(e.pointerType==='touch'||e.pointerType==='pen')this.setMouse(false);};
  document.addEventListener('pointerdown',seen,true);document.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&!this.mouse)seen(e);},true);
  // clicking a button with the mouse should not leave it focused, or Space (pause) would also press it
  document.addEventListener('mousedown',e=>{if(e.target.closest&&e.target.closest('button'))e.preventDefault();});
  this.strips();
  window.addEventListener('blur',()=>this.keys.clear());},
 setMouse(v,force){if(v===this.mouse&&!force)return;this.mouse=v;document.body.classList.toggle('mouse',v);
  document.querySelectorAll('[data-say]').forEach(el=>{el.textContent=say(el.dataset.say);});},
 // horizontal strips (catalog, tools, swatches): the wheel scrolls them sideways, and a mouse drag pulls them
 strips(){const S='.tabsx,.items';
  document.addEventListener('wheel',e=>{const s=e.target.closest&&e.target.closest(S);if(!s||s.scrollWidth<=s.clientWidth+1)return;
   const d=(Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY)*(e.deltaMode===1?33:e.deltaMode===2?s.clientWidth:1);s.scrollLeft+=d;e.preventDefault();},{passive:false});
  document.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;const s=e.target.closest&&e.target.closest(S);
   this.strip=s&&s.scrollWidth>s.clientWidth+1?{s,x:e.clientX,l:s.scrollLeft,on:false}:null;});
  document.addEventListener('pointermove',e=>{const d=this.strip;if(!d)return;if(!(e.buttons&1)){this.strip=null;return;}const dx=e.clientX-d.x;
   if(!d.on&&Math.abs(dx)>6){d.on=true;d.s.style.scrollSnapType='none';d.s.style.cursor='grabbing';}if(d.on)d.s.scrollLeft=d.l-dx;});
  const end=()=>{const d=this.strip;this.strip=null;if(!d||!d.on)return;d.s.style.scrollSnapType='';d.s.style.cursor='';this.stripDrag=performance.now();};
  document.addEventListener('pointerup',end);document.addEventListener('pointercancel',end);
  // a drag that scrolled a strip is not a click on the button under it
  document.addEventListener('click',e=>{if(performance.now()-this.stripDrag<60){e.stopPropagation();e.preventDefault();this.stripDrag=0;}},true);},
 // hovering the lot with no button pressed: the cursor shows what can be clicked, things get a tooltip,
 // the buy ghost follows the pointer and build mode marks the tile
 hover(e){const cv=R.cv,w=screenToWorld(e.clientX,e.clientY),tx=Math.floor(w.x/T),ty=Math.floor(w.y/T),busy=UI.modalOpen()||UI.welcomeOn;
  let cur='',thing=null;
  if(!busy&&G.mode==='buy'&&BB.placing){if(!this.hov||this.hov.tx!==tx||this.hov.ty!==ty)BB.ghostTo(tx,ty);cur='move';}
  else if(!busy&&G.mode==='build'){BB.hov=[tx,ty];cur='crosshair';}
  else if(!busy&&G.mode==='buy'){thing=hitObject(w.x,w.y,true);if(thing)cur='pointer';}
  else if(!busy&&G.mode==='live'){thing=hitSim(w.x,w.y)||hitItem(w.x,w.y)||hitObject(w.x,w.y,false);if(thing)cur='pointer';}
  if(cv.style.cursor!==cur)cv.style.cursor=cur;
  const moved=this.tipAt&&Math.hypot(e.clientX-this.tipAt.x,e.clientY-this.tipAt.y)>6;
  if(TIP.tgt==='world'&&TIP.mode==='hover'&&(moved||!thing))TIP.hide();
  if(!this.hov||this.hov.thing!==thing||moved){clearTimeout(this.hovT);this.tipAt=null;
   if(thing&&$('#ctx').classList.contains('hidden')){const x=e.clientX,y=e.clientY;this.hovT=setTimeout(()=>{const w2=screenToWorld(x,y),d=worldTip(w2.x,w2.y);if(d&&!IN.ptrs.size&&TIP.showAt(d,x,y,'hover'))this.tipAt={x,y};},550);}}
  this.hov={tx,ty,thing};},
 leave(){clearTimeout(this.hovT);this.hov=null;this.tipAt=null;BB.hov=null;R.cv.style.cursor='';if(TIP.tgt==='world'&&TIP.mode==='hover')TIP.hide();},
 // held arrow keys or WASD move the camera smoothly, on the lot or on the town map
 PAN:{ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1],a:[-1,0],d:[1,0],w:[0,-1],s:[0,1]},
 frame(dt){if(!this.keys.size)return;let vx=0,vy=0;for(const k of this.keys){const v=this.PAN[k];if(v){vx+=v[0];vy+=v[1];}}if(!vx&&!vy)return;
  const sp=720*dt,n=Math.hypot(vx,vy);vx*=sp/n;vy*=sp/n;
  if(TV.on){const c=TV.cam;c.x+=vx*TV.dpr/c.z;c.y+=vy*TV.dpr/c.z;TV.anim=null;TV.clampCam();TV.dirty=true;}
  else{R.camX+=vx*R.dpr/R.Z;R.camY+=vy*R.dpr/R.Z;clampCam();}}
};
// Player-facing text is written for touch. With a mouse, swap the words that only make sense on a phone.
const SAY_MOUSE=[
 ['Use two fingers to move the camera.','Right-drag or use the arrow keys to move the camera.'],
 ['Two fingers move the camera.','Right-drag or the arrow keys move the camera.'],
 [' with one finger',''],
 ['Pinch, scroll or use the magnifier buttons to zoom.','Scroll the wheel or use the magnifier buttons to zoom. Right-drag also moves the camera.'],
 ['You can also pinch or scroll.','You can also scroll the mouse wheel.'],
 [' With a mouse, just hover.',''],
 ['Tap an item, then tap where it goes.','Click an item, then click where it goes. R turns it, right-click cancels.'],
 [/\bPress and hold\b/g,'Hover over'],[/\bpress and hold\b/g,'hover over'],
 [/\bTap\b/g,'Click'],[/\btap\b/g,'click']];
function say(s){if(!DESK.mouse||typeof s!=='string')return s;for(const[a,b]of SAY_MOUSE)s=typeof a==='string'?s.split(a).join(b):s.replace(a,b);return s;}
// a hint paragraph that rewords itself when the player switches between touch and mouse
function sayHint(s){return`<p class="hint" data-say="${esc(s)}">${esc(say(s))}</p>`;}
