// ================= RENDER: camera, world drawing, lighting, particles =================
const R={cv:null,ctx:null,glcv:null,smooth:false,dpr:1,W:0,H:0,Z:0,Zdef:4,Zmin:2,Zmax:10,zt:null,zax:0,zay:0,camX:MW*T/2,camY:12*T,buf:null,bctx:null,bw:0,bh:0,light:null,lctx:null,lw:0,lh:0,glow:null,gctx:null,t:0,marker:null};
const PARTS=[],TEXTS=[],AMB={flies:[],bugs:[],rain:[]};
function initRender(){R.cv=document.getElementById('game');R.ctx=R.cv.getContext('2d');R.glcv=document.getElementById('gl');if(R.glcv)GLS.init(R.glcv);resize();window.addEventListener('resize',resize);
 for(let i=0;i<14;i++)AMB.flies.push({x:rnd()*MW*T,y:rnd()*LOTH*T,p:rnd()*9});for(let i=0;i<3;i++)AMB.bugs.push({x:rnd()*MW*T,y:rnd()*LOTH*T,vx:0,vy:0,p:rnd()*9,c:pick(['#f6d04a','#ffffff','#e27aa6','#9fd3f0'])});}
// Smooth art uses the WebGL upscaler when the device supports it; otherwise crisp pixels at whole-number zoom.
function applySmooth(want){const on=!!want&&GLS.ok;if(on===R.smooth&&R.W)return;R.smooth=on;if(R.glcv)R.glcv.style.display=on?'block':'none';document.body.classList.toggle('smooth',on);resize();R.Z=R.Zdef;alloc();clampCam();if(window.UI&&UI.init){const sp=document.getElementById('sp');if(sp)sp._k='';const pt=document.getElementById('portraits');if(pt)pt._k='';UI.dirty=true;}}
function resize(){R.dpr=Math.min(window.devicePixelRatio||1,3);const w=window.innerWidth,h=window.innerHeight;R.W=Math.max(1,Math.round(w*R.dpr));R.H=Math.max(1,Math.round(h*R.dpr));R.cv.width=R.W;R.cv.height=R.H;if(R.smooth)GLS.size(R.W,R.H);
 const first=!R.Z,m=Math.min(R.W,R.H);
 if(R.smooth){R.Zdef=Math.max(1.5,m/(13*T));R.Zmin=Math.max(.75,Math.min(R.Zdef*.8,R.W/(MW*T+T*4)));R.Zmax=R.Zdef*2.6;}
 else{R.Zdef=Math.max(2,Math.floor(m/(14*T)));R.Zmin=Math.max(1,Math.min(R.Zdef,Math.floor(Math.max(R.W/(MW*T),R.H/(MH*T)))));R.Zmax=Math.max(R.Zdef+2,R.Zdef*2);}
 if(first)R.Z=R.Zdef;R.Z=clamp(R.smooth?R.Z:Math.round(R.Z),R.Zmin,R.Zmax);R.zt=null;alloc();clampCam();if(window.UI&&UI.layout)UI.layout();}
// buffers keep spare room so smooth zooming does not reallocate every frame
function alloc(){const bw=Math.ceil(R.W/R.Z)+6,bh=Math.ceil(R.H/R.Z)+6;R.bw=bw;R.bh=bh;R.lw=Math.ceil(bw/2)+1;R.lh=Math.ceil(bh/2)+1;const b=R.buf;
 if(!b||b.width<bw||b.height<bh||b.width>bw*2+40||b.height>bh*2+40){const cw=Math.ceil(bw*1.2)+8,ch=Math.ceil(bh*1.2)+8;[R.buf,R.bctx]=mkc(cw,ch);[R.light,R.lctx]=mkc(Math.ceil(cw/2)+2,Math.ceil(ch/2)+2);R.lctx.imageSmoothingEnabled=true;R.glow=null;R.gctx=null;}
 if(R.smooth&&!R.glow){[R.glow,R.gctx]=mkc(R.buf.width,R.buf.height);R.gctx.imageSmoothingEnabled=true;}}
function setZoom(z,fx,fy){z=clamp(z,R.Zmin,R.Zmax);if(!R.smooth)z=Math.round(z);if(Math.abs(z-R.Z)<1e-6)return;const sx=fx==null?R.W/2:fx,sy=fy==null?R.H/2:fy;const wx=R.camX+(sx-R.W/2)/R.Z,wy=R.camY+(sy-R.H/2)/R.Z;R.Z=z;alloc();R.camX=wx-(sx-R.W/2)/R.Z;R.camY=wy-(sy-R.H/2)/R.Z;clampCam();}
// animated zoom for buttons, wheel and keys (instant whole steps in crisp-pixel mode)
function zoomTo(z,fx,fy){z=clamp(z,R.Zmin,R.Zmax);if(!R.smooth){R.zt=null;setZoom(z,fx,fy);return;}R.zt=z;R.zax=fx==null?R.W/2:fx;R.zay=fy==null?R.H/2:fy;}
function zoomStep(dir,fx,fy){if(dir<0&&G.mode==='live'&&G.started&&!UI.welcomeOn&&!UI.modalOpen()&&R.Z<=R.Zmin*1.002&&(R.zt==null||R.zt<=R.Zmin*1.002)){TV.open('browse');return;}if(!R.smooth){zoomTo(Math.round(R.Z)+dir,fx,fy);return;}zoomTo((R.zt!=null?R.zt:R.Z)*Math.pow(1.3,dir),fx,fy);}
function zoomTick(dt){if(R.zt==null)return;let z=R.Z+(R.zt-R.Z)*(1-Math.exp(-dt*16));if(Math.abs(R.zt-z)<.003*R.zt){z=R.zt;R.zt=null;}setZoom(z,R.zax,R.zay);}
function clampCam(){const vw=R.W/R.Z,vh=R.H/R.Z,mw=MW*T,mh=MH*T,pad=T*2;
 R.camX=vw>=mw+pad*2?mw/2:clamp(R.camX,vw/2-pad,mw-vw/2+pad);R.camY=vh>=mh+pad*2?mh/2:clamp(R.camY,vh/2-pad-T*2,mh-vh/2+pad+T*4);}
function screenToWorld(sx,sy){return{x:R.camX+(sx*R.dpr-R.W/2)/R.Z,y:R.camY+(sy*R.dpr-R.H/2)/R.Z};}
function worldToScreen(x,y){return{x:(x-R.camX)*R.Z+R.W/2,y:(y-R.camY)*R.Z+R.H/2};}
function centerOn(x,y){R.camX=x;R.camY=y;clampCam();}

// ---------- time of day ----------
const AMBK=[[0,[74,84,138]],[4.5,[78,86,140]],[5.5,[150,120,150]],[6.5,[238,190,160]],[7.5,[255,240,225]],[9,[255,255,255]],[16.5,[255,255,255]],[17.5,[255,236,210]],[18.5,[250,190,140]],[19.5,[205,135,142]],[20.5,[118,108,166]],[21.5,[80,90,144]],[24,[74,84,138]]];
function ambientAt(t){const h=hourOf(t);let a=AMBK[0],b=AMBK[1];for(let i=0;i<AMBK.length-1;i++)if(h>=AMBK[i][0]&&h<=AMBK[i+1][0]){a=AMBK[i];b=AMBK[i+1];break;}
 const k=(h-a[0])/Math.max(.001,b[0]-a[0]);let c=[0,1,2].map(i=>lerp(a[1][i],b[1][i],k));
 if(G.weather==='rain')c=[c[0]*.78,c[1]*.82,c[2]*.9];else if(G.weather==='snow')c=[c[0]*.93,c[1]*.95,c[2]];return c;}
function brightness(){const a=ambientAt(G.time);return(a[0]+a[1]+a[2])/765;}
function lightsOn(o){if(brightness()>.8)return false;if(o&&(o.def.out||o.def.fixed))return true;return household().some(s=>s.onLot&&!(s.act&&s.act.sleeping));}
const rgb=c=>`rgb(${c[0]|0},${c[1]|0},${c[2]|0})`;

// ---------- particles & floating text ----------
function addParticle(p){p.max=p.life;PARTS.push(p);if(PARTS.length>260)PARTS.shift();}
function fxText(x,y,txt,col){TEXTS.push({x,y,txt,col,t:0});if(TEXTS.length>12)TEXTS.shift();}
function updateFx(dt){
 for(const p of PARTS){p.life-=dt;p.x+=(p.vx||0)*dt;p.y+=(p.vy||0)*dt;if(p.type==='leaf'){p.vx=Math.sin(R.t*2+p.s)*8;}if(p.type==='confetti')p.vy+=40*dt;}
 for(let i=PARTS.length-1;i>=0;i--)if(PARTS[i].life<=0)PARTS.splice(i,1);
 for(const t of TEXTS)t.t+=dt;for(let i=TEXTS.length-1;i>=0;i--)if(TEXTS[i].t>1.8)TEXTS.splice(i,1);
 if(G.season===2&&chance(dt*1.6)){const trees=G.objects.filter(o=>o.def.tree);if(trees.length){const tr=pick(trees);addParticle({type:'leaf',x:tr.x*T+8+rnd()*28-14,y:tr.y*T-30+rnd()*16,vx:0,vy:9,life:3.5,s:rnd()*9,c:pick(['#e2732b','#c9472a','#f2b33d'])});}}
 const day=brightness()>.75;
 for(const b of AMB.bugs){b.p+=dt;b.vx+=(rnd()-.5)*40*dt;b.vy+=(rnd()-.5)*40*dt;b.vx*=.97;b.vy*=.97;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.x<0||b.x>MW*T||b.y<0||b.y>LOTH*T||isInt(Math.floor(b.x/T),Math.floor(b.y/T))){b.x=pick([2,24])*T+rnd()*40;b.y=rnd()*LOTH*T;}}
 for(const f of AMB.flies){f.p+=dt;f.x+=Math.sin(f.p*.7)*6*dt;f.y+=Math.cos(f.p*.5)*5*dt;}
}

// ---------- drawing ----------
function render(dt){
 R.t+=dt;if(W.groundDirty)renderGround();updateFx(dt);zoomTick(dt);
 const Z=R.Z,vw=R.W/Z,vh=R.H/Z,left=R.camX-vw/2,top=R.camY-vh/2,ix=Math.floor(left)-2,iy=Math.floor(top)-2;
 const b=R.bctx;b.setTransform(1,0,0,1,0,0);b.globalAlpha=1;b.globalCompositeOperation='source-over';b.fillStyle=G.season===3?'#c9d4de':'#3d5c3a';b.fillRect(0,0,R.bw,R.bh);
 b.setTransform(1,0,0,1,-ix,-iy);b.drawImage(W.ground,0,0);
 drawGroundItems(b);drawShadows(b);drawSorted(b,ix,iy,vw+6,vh+6);drawParts(b,false);drawWeather(b,ix+2,iy+2,vw,vh);
 if(G.mode!=='live')BB.drawWorld(b);
 const ctx=R.ctx;ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
 const ox=-(left-ix)*Z,oy=-(top-iy)*Z,li=buildLight(ix,iy);
 if(R.smooth&&GLS.ok){ctx.clearRect(0,0,R.W,R.H);const gw=drawGlowLayer(li,ix,iy);GLS.draw(R.buf,li?R.light:null,gw?R.glow:null,ox,oy,Z,true);}
 else{ctx.drawImage(R.buf,0,0,R.bw,R.bh,ox,oy,R.bw*Z,R.bh*Z);drawLighting2D(ctx,li,ix,iy,ox,oy);}
 drawOverlays(ctx);
}
function drawGroundItems(b){_g=b;for(const it of G.items)if(it.kind==='puddle'){const x=it.x*T+3,y=it.y*T+6;F('rgba(140,200,240,.65)',x+1,y,9,5);F('rgba(140,200,240,.65)',x,y+1,11,3);F('rgba(255,255,255,.6)',x+2,y+1,3,1);}
 if(R.marker&&R.t<R.marker.until){const m=R.marker,k=Math.sin(R.t*8)*1.5;F('rgba(255,255,255,.8)',m.x*T+4,m.y*T+11,8,1);F('rgba(255,255,255,.8)',m.x*T+3,m.y*T+12,10,1);F('#f6d04a',m.x*T+6,m.y*T-2+k,4,5);F('#f6d04a',m.x*T+4,m.y*T+3+k,8,1);F('#f6d04a',m.x*T+5,m.y*T+4+k,6,1);F('#f6d04a',m.x*T+6,m.y*T+5+k,4,1);F('#f6d04a',m.x*T+7,m.y*T+6+k,2,1);}}
function drawShadows(b){_g=b;
 for(const o of G.objects){if(o.def.tree){const x=o.x*T+8,y=o.y*T+12;b.fillStyle='rgba(20,30,20,.22)';b.fillRect(x-13,y-2,26,5);b.fillRect(x-10,y-3,20,7);}else if(o.def.bush){b.fillStyle='rgba(20,30,20,.18)';b.fillRect(o.x*T+2,o.y*T+11,12,3);}}
 for(const s of G.people){if(!s.onLot||s.inObj)continue;const x=Math.round(s.x),y=Math.round(s.y);b.fillStyle='rgba(30,20,40,.25)';b.fillRect(x-4,y-1,8,3);b.fillRect(x-5,y,10,1);
  if(s.id===G.sel&&G.mode==='live'){const c=moodLevel(moodScore(s)).c;b.fillStyle=c;b.fillRect(x-6,y+1,12,1);b.fillRect(x-7,y,1,1);b.fillRect(x+6,y,1,1);b.fillRect(x-6,y-1,1,1);b.fillRect(x+5,y-1,1,1);}}}
function drawSorted(b,ix,iy,vw,vh){
 const L=[];const x0=Math.max(0,Math.floor(ix/T)-2),x1=Math.min(MW-1,Math.ceil((ix+vw)/T)+2),y0=Math.max(0,Math.floor(iy/T)-1),y1=Math.min(MH-1,Math.ceil((iy+vh)/T)+3);
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=I(x,y);if(!W.wt[i])continue;
  if(W.wt[i]===2){const open=G.people.some(s=>s.onLot&&Math.abs(s.x-(x*T+8))<14&&Math.abs(s.y-(y*T+8))<16);if(open!==!!W.open[i])W.open[i]=open?1:0;}
  for(const p of wallPieces(x,y))L.push({y:y*T+p.sort,x:x*T,k:0,p,tx:x,ty:y});}
 for(const o of G.objects){const d=o.def;if(d.rug||d.wall)continue;if((o.x+d.w+3)*T<ix||(o.x-3)*T>ix+vw||(o.y+d.h)*T<iy||(o.y-4)*T>iy+vh)continue;L.push({y:(o.y+d.h)*T-.5,x:o.x*T,k:1,o});}
 for(const s of G.people){if(!s.onLot||s.inObj)continue;let sy=s.y;const ti=I(clamp(s.tx(),0,MW-1),clamp(s.ty(),0,MH-1));if(W.wt[ti]===2)sy=Math.max(sy,s.ty()*T+11);L.push({y:sy,x:s.x,k:2,s});}
 for(const c of G.cars)L.push({y:c.y+20,x:c.x,k:3,c});
 L.sort((a,b)=>a.y-b.y||a.x-b.x);
 for(const d of L){if(d.k===0){const p=d.p;if(p.glass){b.fillStyle=skyColor();b.fillRect(d.tx*T+p.glass[0],d.ty*T+p.oy+p.glass[1],p.glass[2],p.glass[3]);}b.drawImage(p.c,d.tx*T+p.ox,d.ty*T+p.oy);}
  else if(d.k===1)drawObj(b,d.o);else if(d.k===2)drawSim(b,d.s);else{const c=d.c;b.drawImage(carSprite(c.col,c.dir),Math.round(c.x)-19,Math.round(c.y));}}
}
function skyColor(){const a=ambientAt(G.time);const day=brightness();return day>.8?(G.weather==='clear'?'#a9d8f2':'#b9c7d3'):rgb([a[0]*.55,a[1]*.6,a[2]*.85]);}
function drawObj(b,o){const sp=objSprites(o);if(!sp)return;const px=o.x*T,py=o.y*T;
 b.drawImage(sp.base.c,px+sp.base.ox,py+sp.base.oy);_g=b;dynObj(b,o,px,py);
 for(const it of G.items)if(it.surf===o.id)drawItem(b,it,o);
 for(const s of G.people)if(s.onLot&&s.inObj&&s.inObj.o===o)drawSim(b,s);
 if(sp.top){let tx=px+sp.top.ox;if(o.def.tree)tx+=Math.round(Math.sin(R.t*1.1+o.x*1.7)*.9);b.drawImage(sp.top.c,tx,py+sp.top.oy);}}
function dynObj(b,o,px,py){const t=o.type,busy=o._busy>0,tt=R.t;
 if(t==='tv'||t==='tv_big'){if(!busy)return;const r=t==='tv'?[2,-9,10,10]:[2,-11,28,13];const ch=Math.floor(tt/3)%4,cols=[['#5ab0ff','#ffe08a','#7fd16a'],['#ff8a7a','#ffd34d','#ffffff'],['#9fe870','#46c2ff','#2a6a9a'],['#e27aa6','#8e5ba8','#ffd34d']][ch];
  F(cols[0],px+r[0],py+r[1],r[2],r[3]);F(cols[1],px+r[0]+((tt*6|0)%(r[2]-3)),py+r[1]+2,3,r[3]-4);F(cols[2],px+r[0],py+r[1]+r[3]-3,r[2],3);if(((tt*10)|0)%7===0)F('rgba(255,255,255,.35)',px+r[0],py+r[1],r[2],r[3]);}
 else if(t==='pc'||t==='pc_lux'){if(!busy)return;F('#3a7bd5',px+3,py-10,10,7);for(let i=0;i<3;i++)F('#bfe0ff',px+4,py-9+i*2,2+((tt*3+i*5)|0)%6,1);}
 else if(t==='stove'||t==='stove_pro'){if(!o.state.cooking)return;const f=((tt*8)|0)%2;F(f?'#ff6b3d':'#ffa53d',px+3,py-4,3,2);F(f?'#ffa53d':'#ff6b3d',px+9,py-1,3,2);F('rgba(255,140,60,.8)',px+4,py+6,8,4);}
 else if(t==='grill'){if(!busy)return;F(((tt*8)|0)%2?'#ff6b3d':'#ffa53d',px+5,py-6,6,1);if(chance(.15))addParticle({type:'smoke',x:px+8,y:py-10,vx:rnd()*4-2,vy:-8,life:1.6});}
 else if(t==='woodstove'){const lit=brightness()<.85||G.season===3;const f=((tt*7)|0)%3;if(lit){F(['#ff6b3d','#ffa53d','#ffd34d'][f],px+6,py-1,4,4);F('#ffd34d',px+7,py+1,2,2);}else F('#5a2a1a',px+6,py+1,4,2);}
 else if(t==='easel'){if(o.state.art)artPixels(b,o.state.art,px+2,py-16,12,10,clamp((o.state.prog||0)/100,0,1));}
 else if(t==='plot')drawPlant(b,o,px,py);
 else if(t==='tank'){for(let i=0;i<3;i++){const fx=px+4+((tt*(6+i*3)+i*30)%24),fy=py-7+i*2+Math.sin(tt*2+i)*1.5;F(['#ffa53d','#ff6b6b','#ffd34d'][i],fx|0,fy|0,2,1);}if(((tt*2)|0)%3===0)F('#cfeaf5',px+20,py-8-((tt*6)%6|0),1,1);}
 else if(t==='stereo'){if(busy){const k=((tt*6)|0)%2;F('#7a8290',px+3,py-2,2,2);if(k){F('#9aa6b2',px+2,py-3,4,4);F('#9aa6b2',px+10,py-3,4,4);}if(chance(.08))addParticle({type:'note',x:px+8,y:py-8,vx:rnd()*12-6,vy:-12,life:1.6});}}
}
function drawPlant(b,o,px,py){const st=o.state;if(!st||!st.crop)return;const c=CROPS[st.crop],g=st.g,dry=st.water<=0;const L=dry?'#b5a64a':'#5fae45',D=dry?'#8a8238':'#3f8a35',H=dry?'#cfc066':'#86d04f';
 for(const[x0,y0]of[[4,10],[8,7],[12,11]]){const x=px+x0,y=py+y0;
  if(g<20){F(L,x,y,1,2);F(H,x-1,y,1,1);F(H,x+1,y-1,1,1);continue;}
  if(st.crop==='lettuce'){const r=g<60?2:3;F(D,x-r,y-r+1,r*2+1,r+1);F(L,x-r+1,y-r,r*2-1,r);F(H,x-1,y-r,2,1);continue;}
  if(st.crop==='carrot'){F(D,x,y-(g<60?3:5),1,g<60?3:5);F(L,x-1,y-(g<60?3:5),3,1);F(H,x-2,y-(g<60?4:6),2,1);if(g>=100)F(c.c,x-1,y,3,2);continue;}
  if(st.crop==='pumpkin'){F(D,x-2,y-2,5,1);F(L,x-3,y-3,2,2);if(g>=60){const r=g>=100?3:2;F(g>=100?c.c:'#9fbf4a',x-r,y-r+1,r*2+1,r+1);F(shade(c.c,.3),x-r+1,y-r+1,1,1);F('#5a3a22',x,y-r,1,1);}continue;}
  const h=g<60?5:8;F(D,x,y-h,1,h);F(L,x-2,y-h+1,2,2);F(L,x+1,y-h+3,2,2);F(H,x-1,y-h,2,1);
  if(g>=100){const fc=c.c;F(fc,x-2,y-h+4,2,2);F(fc,x+1,y-h+1,2,2);if(st.crop==='strawberry')F('#ffffff',x+1,y-h+1,1,1);}}
 if(g>=100&&((R.t*2)|0)%2)F('#fff6b0',px+13,py-2,1,1);}
function drawItem(b,it,o){_g=b;const x=it.x*T+8,top=o.def.counter||o.def.stove?-1:o.def.grill?-4:o.def.table?1:0,y=it.y*T+top;
 if(it.recipe==='pizza'&&it.kind==='meal'){F('#c9a26a',x-6,y-2,12,5);F('#e8c48e',x-6,y-2,12,1);F('#e2453c',x-2,y,4,1);F('#8a6a3a',x-6,y+2,12,1);return;}
 const big=it.kind==='meal'&&it.servings>1;const w=big?10:8;F('#ffffff',x-w/2,y,w,3);F('#e6e2da',x-w/2+1,y+2,w-2,1);
 if(it.kind==='meal'){F(it.c||'#e8b25c',x-w/2+2,y-1,w-4,2);F(shade(it.c||'#e8b25c',.3),x-w/2+2,y-1,2,1);if(chance(.03))addParticle({type:'steam',x:x,y:y-3,vx:0,vy:-6,life:1});}
 else{F('#c9b99a',x-2,y+1,2,1);F('#d9603b',x+1,y,1,1);F('#b5a88f',x,y,1,1);}}
function simFrame(s,pose){const n=POSE_FRAMES[pose]||1;if(pose==='walk')return Math.floor(s.anim.walkD/5)%4;if(n>1)return Math.floor(R.t*(POSE_FPS[pose]||2)+(s.id.charCodeAt(s.id.length-1)%3))%n;return 0;}
function simFace(s){if(((R.t+s.blink)%3.7)<.13)return'blink';const ml=moodLevel(moodScore(s)).id;return ml>=3?'happy':ml<=1?'sad':'ok';}
function drawSim(b,s){let pose=s.anim.pose;if(pose==='walk'&&!s.path&&!(s.act&&s.act.steps[s.act.si]&&s.act.steps[s.act.si].ph==='enter'))pose='idle';
 if(s.carry&&(pose==='walk'||pose==='idle')&&s.role)pose=pose;const f=simFrame(s,pose),face=simFace(s);const spr=simSprite(s,s.dir,pose,f,face);
 if(pose==='sleep'||pose==='bath'||pose==='lieAwake'){b.drawImage(spr,Math.round(s.x)-9,Math.round(s.y)-16);return;}
 b.drawImage(spr,Math.round(s.x)-9,Math.round(s.y)-28);
 if(pose==='toilet'){const A=s._cols||simColors(s.app),cs=[A.sk,A.t,A.b,'#ffffff',A.tD],tt=Math.floor(R.t*5),x0=Math.round(s.x)-6,y0=Math.round(s.y)-13;for(let yy=0;yy<4;yy++)for(let xx=0;xx<6;xx++){b.fillStyle=cs[(hash(xx,yy,tt)*cs.length)|0];b.fillRect(x0+xx*2,y0+yy*2,2,2);}}
 if(s.carry){_g=b;const x=Math.round(s.x),y=Math.round(s.y)-11;if(s.dir!=='up'){F('#2a1f2d',x-5,y,10,1);F('#ffffff',x-4,y-1,8,1);F(s.carry==='plate'?'#e8b25c':'#c9b99a',x-2,y-2,4,1);}}}
function drawParts(b){_g=b;for(const p of PARTS){const a=clamp(p.life/p.max,0,1),x=Math.round(p.x),y=Math.round(p.y);
 switch(p.type){
  case 'steam':b.globalAlpha=a*.6;F('#ffffff',x,y,2,2);F('#ffffff',x+1,y-1,1,1);b.globalAlpha=1;break;
  case 'smoke':b.globalAlpha=a*.55;F('#5a5558',x-1,y-1,3,3);b.globalAlpha=1;break;
  case 'note':b.globalAlpha=a;F('#2a1f2d',x,y,2,2);F('#2a1f2d',x+1,y-4,1,4);F('#2a1f2d',x+2,y-4,1,1);F('#ffd34d',x,y,1,1);b.globalAlpha=1;break;
  case 'heart':b.globalAlpha=a;F('#e0463c',x,y,2,2);F('#e0463c',x+3,y,2,2);F('#e0463c',x,y+1,5,2);F('#e0463c',x+1,y+3,3,1);F('#e0463c',x+2,y+4,1,1);F('#ffb3a8',x+1,y,1,1);b.globalAlpha=1;break;
  case 'spark':b.globalAlpha=a;F('#fff1a8',x,y-1,1,3);F('#fff1a8',x-1,y,3,1);b.globalAlpha=1;break;
  case 'z':b.globalAlpha=a;F('#4f86d6',x,y,3,1);F('#4f86d6',x+1,y+1,1,1);F('#4f86d6',x,y+2,3,1);b.globalAlpha=1;break;
  case 'confetti':for(let i=0;i<10;i++){F(['#e0463c','#f6d04a','#4f86d6','#6cbf4a','#e27aa6'][i%5],x+Math.cos(i*2.3)*(1-a)*24,y+Math.sin(i*1.7)*(1-a)*14+(1-a)*10,1,1);}break;
  case 'leaf':b.globalAlpha=Math.min(1,a*2);F(p.c,x,y,2,1);F(shade(p.c,-.2),x+1,y+1,1,1);b.globalAlpha=1;break;
 }}
 const day=brightness()>.75;if(day&&G.season<3&&G.weather==='clear')for(const bg of AMB.bugs){const f=((bg.p*8)|0)%2;F(bg.c,bg.x|0,bg.y|0,1,1);F(bg.c,(bg.x|0)-1,(bg.y|0)-(f?1:0),1,1);F(bg.c,(bg.x|0)+1,(bg.y|0)-(f?1:0),1,1);}}
function drawWeather(b,ix,iy,vw,vh){if(G.weather==='clear')return;_g=b;const snow=G.weather==='snow',n=snow?70:110;
 while(AMB.rain.length<n)AMB.rain.push({x:rnd(),y:rnd(),s:.6+rnd()*.6});const sp=Math.max(.2,SPEEDS[G.speed]||0)/1.5;
 for(const d of AMB.rain){d.y+=(snow?.0025:.03)*d.s*(G.paused?0:1)*Math.min(3,sp);d.x+=(snow?Math.sin(R.t+d.s*9)*.0008:.004)*d.s;if(d.y>1){d.y-=1;d.x=rnd();}if(d.x>1)d.x-=1;if(d.x<0)d.x+=1;
  const wx=ix+d.x*vw,wy=iy+d.y*vh,tx=Math.floor(wx/T),ty=Math.floor(wy/T);if(inMap(tx,ty)&&(isInt(tx,ty)||W.wt[I(tx,ty)]))continue;
  if(snow){F('rgba(255,255,255,.9)',wx|0,wy|0,1,1);}else{F('rgba(190,215,240,.55)',wx|0,wy|0,1,3);}}}
function lightList(){const L=[];const dark=brightness()<.82;
 for(const o of G.objects){const d=o.def;if(d.light&&o._on)L.push({x:o.x*T+8,y:o.y*T+d.light.y,r:d.light.r,c:[255,204,140],a:.95,glow:1});
  if(o.type==='woodstove'&&(dark||G.season===3))L.push({x:o.x*T+8,y:o.y*T,r:80,c:[255,150,70],a:.8+Math.sin(R.t*9)*.1,glow:1});
  if((o.type==='tv'||o.type==='tv_big')&&o._busy)L.push({x:o.x*T+o.def.w*8,y:o.y*T,r:o.def.w*34+14,c:[120,170,255],a:.65+Math.sin(R.t*7)*.15});
  if((o.type==='pc'||o.type==='pc_lux')&&o._busy)L.push({x:o.x*T+8,y:o.y*T-4,r:30,c:[140,190,255],a:.7});
  if((d.stove&&o.state.cooking)||(o.type==='grill'&&o._busy))L.push({x:o.x*T+8,y:o.y*T,r:30,c:[255,140,60],a:.75});
  if(o.type==='tank')L.push({x:o.x*T+16,y:o.y*T-2,r:34,c:[90,180,230],a:.55});}
 if(dark){L.push({x:13*T+8,y:15*T+2,r:46,c:[255,210,150],a:.7});for(const c of G.cars)L.push({x:c.x+c.dir*20,y:c.y+12,r:34,c:[255,240,200],a:.7});}
 return L;}
// light map (half art resolution): ambient colour, warm lit rooms, then lamp pools added on top
function buildLight(ix,iy){const amb=ambientAt(G.time),br=(amb[0]+amb[1]+amb[2])/765;if(br>=.995)return null;
 const L=R.lctx;L.setTransform(1,0,0,1,0,0);L.globalCompositeOperation='source-over';L.globalAlpha=1;L.fillStyle=rgb(amb);L.fillRect(0,0,R.lw,R.lh);
 const ind=rgb([amb[0]*.88,amb[1]*.89,amb[2]*.93]);const lit=new Set();if(br<.8)for(const s of G.people){if(!s.onLot||(s.act&&s.act.sleeping))continue;const r=W.room[I(clamp(s.tx(),0,MW-1),clamp(s.ty(),0,MH-1))];if(r>=0)lit.add(r);}
 const k=clamp((.8-br)/.4,0,1),warm=rgb([lerp(amb[0]*.88,236,k*.8),lerp(amb[1]*.89,214,k*.8),lerp(amb[2]*.93,186,k*.8)]);
 const x0=Math.max(0,Math.floor(ix/T)),x1=Math.min(MW-1,Math.ceil((ix+R.bw)/T)),y0=Math.max(0,Math.floor(iy/T)),y1=Math.min(MH-1,Math.ceil((iy+R.bh)/T));
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=I(x,y);if(!W.wt[i]){const r=W.room[i];if(r<0)continue;L.fillStyle=lit.has(r)?warm:ind;L.fillRect((x*T-ix)/2,(y*T-iy)/2,T/2+.5,T/2+.5);continue;}
  for(const[dx,dy,hx,hy,hw,hh]of[[0,1,0,8,16,8],[0,-1,0,0,16,8],[1,0,8,0,8,16],[-1,0,0,0,8,16]]){const rr=inMap(x+dx,y+dy)?W.room[I(x+dx,y+dy)]:-1;if(rr<0)continue;L.fillStyle=lit.has(rr)?warm:ind;L.fillRect((x*T+hx-ix)/2,(y*T+hy-iy)/2,hw/2+.5,hh/2+.5);if(dy===1&&W.tall[i])L.fillRect((x*T-ix)/2,(y*T-22-iy)/2,8.5,15.5);}}
 L.globalCompositeOperation='lighter';const lights=lightList();
 for(const li of lights){const st=lightStamp(li.c),r=li.r/2;L.globalAlpha=clamp(li.a*(1-br)*1.25,0,1);L.drawImage(st,(li.x-ix)/2-r,(li.y-iy)/2-r,r*2,r*2);}
 L.globalAlpha=1;L.globalCompositeOperation='source-over';return{br,lights};}
// additive glows: lamp halos and fireflies. Maps world (x,y) to target as ((x-ix)*s+ox,(y-iy)*s+oy)
function drawGlows(c,li,ix,iy,ox,oy,s){const br=li.br,gs=lightStamp([255,220,160]);
 for(const l of li.lights)if(l.glow){const x=(l.x-ix)*s+ox,y=(l.y-iy)*s+oy,r=7*s;c.globalAlpha=.55*(1-br);c.drawImage(gs,x-r,y-r,r*2,r*2);}
 if(br<.5&&G.season<=2&&G.weather==='clear'){const fs=lightStamp([200,255,120]);for(const f of AMB.flies){const k=(Math.sin(f.p*2.3)+1)/2;if(k<.25)continue;const x=(f.x-ix)*s+ox,y=(f.y-iy)*s+oy,r=3*s;c.globalAlpha=k*.9;c.drawImage(fs,x-r,y-r,r*2,r*2);c.fillStyle='#f4ffb0';c.fillRect(x-s/2,y-s/2,s,s);}}
 c.globalAlpha=1;}
function shaftsOn(){const h=hourOf(G.time);return h>6.5&&h<18.5&&G.weather!=='snow';}
// soft daylight falling through windows onto the floor
function drawShafts(c,ix,iy,ox,oy,s){const h=hourOf(G.time),sun=Math.sin((h-6.5)/12*Math.PI),k=sun*(G.weather==='clear'?.16:.06),sl=(h-12.5)/6;
 for(let y=0;y<LOTH;y++)for(let x=0;x<MW;x++){const i=I(x,y);if(W.wt[i]!==3||!W.tall[i])continue;
  const ax=(x*T+4-ix)*s+ox,bx=(x*T+12-ix)*s+ox,ay=((y+1)*T-6-iy)*s+oy,len=2.6*T*s,dx=-sl*1.4*T*s;
  const gr=c.createLinearGradient(0,ay,0,ay+len);gr.addColorStop(0,`rgba(255,236,190,${k})`);gr.addColorStop(1,'rgba(255,236,190,0)');c.fillStyle=gr;c.beginPath();c.moveTo(ax,ay);c.lineTo(bx,ay);c.lineTo(bx+dx+4*s,ay+len);c.lineTo(ax+dx-4*s,ay+len);c.closePath();c.fill();}}
function drawLighting2D(ctx,li,ix,iy,ox,oy){const Z=R.Z;
 if(li){ctx.save();ctx.globalCompositeOperation='multiply';ctx.imageSmoothingEnabled=true;ctx.drawImage(R.light,0,0,R.lw,R.lh,ox,oy,R.lw*2*Z,R.lh*2*Z);ctx.restore();
  ctx.save();ctx.globalCompositeOperation='lighter';drawGlows(ctx,li,ix,iy,ox,oy,Z);ctx.restore();}
 if(shaftsOn()){ctx.save();ctx.globalCompositeOperation='lighter';drawShafts(ctx,ix,iy,ox,oy,Z);ctx.restore();}}
// same effects drawn at art resolution for the WebGL pass to add on top
function drawGlowLayer(li,ix,iy){const sh=shaftsOn();if(!li&&!sh)return false;const g=R.gctx;g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.fillStyle='#000';g.fillRect(0,0,R.bw+2,R.bh+2);
 g.globalCompositeOperation='lighter';if(li)drawGlows(g,li,ix,iy,0,0,1);if(sh)drawShafts(g,ix,iy,0,0,1);g.globalCompositeOperation='source-over';g.globalAlpha=1;return true;}
function drawOverlays(ctx){const Z=R.Z,sm=R.smooth;ctx.imageSmoothingEnabled=sm;const now=performance.now(),SS=c=>sm?smoothSpr(c,Z>6?8:4):c;
 for(const s of G.people){if(!s.onLot)continue;const lying=s.inObj&&s.inObj.sl&&s.inObj.sl.lie;const top=s.y-(lying?18:31);
  if(s.id===G.sel&&G.mode==='live'){const lf=leafSprite(moodLevel(moodScore(s)).c),p=worldToScreen(s.x-lf.width/2,top-13+Math.sin(R.t*3)*1.2);ctx.drawImage(SS(lf),Math.round(p.x),Math.round(p.y),lf.width*Z,lf.height*Z);}
  if(s.bubble&&s.bubble.until>now){const bs=bubbleSprite(s.bubble.icon,s.bubble.kind==='bad'?'bad':s.bubble.kind==='say'?'say':'think');const p=worldToScreen(s.x-(s.bubble.kind==='say'?14:2),top-(s.id===G.sel?32:20));ctx.drawImage(SS(bs),Math.round(p.x),Math.round(p.y),18*Z,18*Z);}}
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`700 ${Math.round(Math.min(6*Z,22*R.dpr))}px "Pixelify Sans",Nunito,sans-serif`;ctx.lineJoin='round';
 for(const t of TEXTS){const p=worldToScreen(t.x,t.y-t.t*10);ctx.globalAlpha=clamp(2-t.t*1.1,0,1);ctx.lineWidth=Math.min(Z,3.7*R.dpr)*1.4;ctx.strokeStyle='#2a1f2d';ctx.strokeText(t.txt,p.x,p.y);ctx.fillStyle=t.col;ctx.fillText(t.txt,p.x,p.y);}
 ctx.globalAlpha=1;}
