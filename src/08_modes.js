// ================= BUY / BUILD modes, input, audio =================
const BB={cat:'seating',placing:null,tool:'room',drag:null,floor:'wood',wp:'cream',prev:null,prevIn:null,
 thumb(c){const S=Math.round(64*Math.min(3,Math.max(1,window.devicePixelRatio||1)));const[t,g]=mkc(S,S);const f=Math.max(1,Math.floor(Math.min(S/c.width,S/c.height)));const w=c.width*f,h=c.height*f;
  if(R.smooth){const sc=smoothSpr(c,f>=6?8:4);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(sc,0,0,sc.width,sc.height,(S-w)/2|0,(S-h)/2|0,w,h);}else g.drawImage(c,0,0,c.width,c.height,(S-w)/2|0,(S-h)/2|0,w,h);return t;},
 renderBuy(){const el=$('#buy');const cats=CATS.concat(G.inv.length?[['inv','Inventory']]:[]);if(!cats.some(c=>c[0]===this.cat))this.cat='seating';
  let h=`<div class="tabsx">${cats.map(([k,l])=>`<button data-c="${k}" class="${k===this.cat?'on':''}">${l}</button>`).join('')}</div><div class="items" id="bitems"></div>${sayHint('Tap an item, then tap where it goes. Tap something in the house to move or sell it.')}`;
  el.innerHTML=h;const box=$('#bitems');
  if(this.cat==='inv'){for(const it of G.inv){const d=document.createElement('button');d.className='item';const[c,g]=mkc(14,12);drawWallDecor(g,{type:'painting',state:{art:it.art}},0,0);d.appendChild(this.thumb(c));d.insertAdjacentHTML('beforeend',`<b>${esc(it.title)}</b><span>Worth ${money(it.value)}</span>`);d.onclick=()=>{sfx('click');this.startPlace('painting',{inv:it});};box.appendChild(d);}}
  else for(const[k,d]of Object.entries(CATALOG)){if(d.c!==this.cat)continue;const b=document.createElement('button');b.className='item'+(this.placing&&this.placing.type===k&&!this.placing.moving?' sel':'');b.appendChild(this.thumb(catalogThumb(k,0)));
   b.insertAdjacentHTML('beforeend',`<b>${esc(d.n)}</b><span>${money(d.p)}</span>`);b.setAttribute('aria-label',`${d.n}, ${money(d.p)}`);b.dataset.tip='obj:'+k;b.onclick=()=>{sfx('click');this.startPlace(k);};box.appendChild(b);}
  el.querySelector('.tabsx').onclick=e=>{const b=e.target.closest('[data-c]');if(!b)return;this.cat=b.dataset.c;sfx('click');this.renderBuy();};UI.layout();},
 startPlace(type,o){o=o||{};const d=defFor(type,o.moving?o.moving.rot:0);const c=screenToWorld(innerWidth/2,innerHeight*.42);let x=Math.floor(c.x/T)-Math.floor((d.w-1)/2),y=Math.floor(c.y/T)-Math.floor((d.h-1)/2);
  if(o.moving){x=o.moving.x;y=o.moving.y;}
  if(d.wall&&!o.moving){let best=null,bd=1e9;for(let yy=0;yy<LOTH;yy++)for(let xx=0;xx<MW;xx++){if(canPlace(type,xx,yy,0)===true){const dd=Math.hypot(xx-x,yy-y);if(dd<bd){bd=dd;best=[xx,yy];}}}if(best)[x,y]=best;}
  this.placing={type,variant:o.moving?o.moving.variant:0,rot:o.moving?o.moving.rot:0,x,y,moving:o.moving||null,inv:o.inv||null};this.renderPlaceBar();if(G.mode==='buy'&&!o.moving)this.renderBuy();},
 renderPlaceBar(){const p=this.placing,el=$('#place');if(!p){el.classList.add('hidden');return;}const d=CATALOG[p.type];const ok=canPlace(p.type,p.x,p.y,p.rot,p.moving)===true;
  const price=p.moving||p.inv?0:d.p;
  el.innerHTML=`${turnsOf(d)?`<button class="btn" data-p="rot" data-tip="place:turn">${SVG.rot} Turn</button>`:''}${d.cols?`<button class="btn" data-p="col"><span class="sw" style="width:20px;height:20px;background:${d.cols[p.variant]}"></span> Color</button>`:''}<button class="btn" data-p="x">Cancel</button><button class="btn ${ok?'good':'off'}" data-p="ok" ${ok?'':'aria-disabled="true"'}>${p.moving?'Move here':p.inv?'Hang it':'Buy '+money(price)}</button>`;
  el.classList.remove('hidden');el.onclick=e=>{const b=e.target.closest('[data-p]');if(!b)return;const a=b.dataset.p;sfx('click');if(a==='rot'){p.rot=nextRot(d,p.rot);}if(a==='col'){p.variant=(p.variant+1)%d.cols.length;}if(a==='x'){this.cancel();return;}if(a==='ok'){this.confirm();return;}this.renderPlaceBar();};UI.layout();},
 ghostTo(tx,ty){const p=this.placing;if(!p)return;const d=defFor(p.type,p.rot);
  if(d.wall){if(!(W.wt[I(clamp(tx,0,MW-1),clamp(ty,0,MH-1))]===1)&&isWall(tx,ty+1))ty++;p.x=tx;p.y=ty;}else{p.x=tx-Math.floor((d.w-1)/2);p.y=ty-Math.floor((d.h-1)/2);}this.renderPlaceBar();},
 onGhost(tx,ty){const p=this.placing;if(!p)return false;const d=defFor(p.type,p.rot);return tx>=p.x-1&&tx<=p.x+d.w&&ty>=p.y-1&&ty<=p.y+d.h;},
 confirm(){const p=this.placing;if(!p)return;const d=CATALOG[p.type];const v=canPlace(p.type,p.x,p.y,p.rot,p.moving);if(v!==true){toast(v,'frown');return;}
  if(p.moving){const o=p.moving;o.x=p.x;o.y=p.y;o.rot=p.rot;o.def=defFor(o.type,o.rot);o.variant=p.variant;}
  else if(p.inv){addObject('painting',p.x,p.y,{state:{art:p.inv.art,title:p.inv.title,value:p.inv.value},price:0});G.inv=G.inv.filter(i=>i!==p.inv);}
  else{if(G.money<d.p){toast('Not enough money','coin');sfx('bad');return;}G.money-=d.p;addObject(p.type,p.x,p.y,{rot:p.rot,variant:p.variant});for(const s of household())wishEvent(s,'buy',{cat:d.c});}
  refreshWorld();sfx('cash');addParticle({type:'spark',x:p.x*T+8,y:p.y*T,vx:0,vy:-10,life:.8});const keep=!p.moving&&!p.inv;const t=p.type;this.placing=null;$('#place').classList.add('hidden');
  if(keep&&G.money>=d.p&&d.c!=='beds'&&!d.wall&&(d.rug||d.out||d.c==='decor'||d.counter||d.seat||d.plot)){this.startPlace(t);this.placing.x=p.x+d.w<MW?p.x+d.w:p.x;this.placing.y=p.y;this.placing.rot=p.rot;this.placing.variant=p.variant;this.renderPlaceBar();}
  if(G.mode==='buy')this.renderBuy();UI.dirty=true;},
 cancel(){this.placing=null;this.drag=null;this.prev=null;$('#place').classList.add('hidden');UI.layout();},
 objTap(o,sx,sy){const d=o.def;if(d.fixed){toast(`The ${d.n.toLowerCase()} stays put`,'home');return;}
  const used=Object.keys(o.users).length||G.people.some(s=>s.inObj&&s.inObj.o===o);const val=o.type==='painting'?(o.state.value||100):Math.round((o.price||d.p)*.7);
  const opts=[{label:'Move',icon:'walk',dis:used,note:used?'Someone is using it':'',fn:()=>this.startPlace(o.type,{moving:o})},
   {label:`Sell for ${money(val)}`,icon:'coin',dis:used,fn:()=>{G.money+=val;removeObject(o);refreshWorld();sfx('cash');UI.dirty=true;if(G.mode==='buy')this.renderBuy();}}];
  if(o.type==='painting')opts.push({label:'Take down',icon:'painting',note:'Back to inventory',fn:()=>{G.inv.push({id:uid('v'),kind:'painting',title:o.state.title||'Painting',art:o.state.art,value:o.state.value||100});removeObject(o);refreshWorld();this.renderBuy();}});
  if(d.cols)opts.push({label:'Change color',icon:'painting',keep:1,fn:()=>{o.variant=((o.variant||0)+1)%d.cols.length;OBJ_SPR.clear();W.groundDirty=true;}});
  UI.ctxOpen(o.type==='painting'?(o.state.title||'Painting'):d.n,'',opts,sx,sy);},
 // ---------- build ----------
 renderBuild(){const el=$('#build');const tools=[['room','home','Room',''],['wall','wall','Walls',`${money(BUILD_COST.wall)} per tile`],['door','door','Door',money(BUILD_COST.door)],['window','window','Window',money(BUILD_COST.window)],['floor','floor','Floors',''],['paper','roller','Wallpaper',`${money(BUILD_COST.wallpaper)} per wall`],['remove','remove','Remove','Refunds half'],['ext','tree','Outside','']];
  let h=`<div class="tabsx">${tools.map(([k,i,l])=>`<button data-t="${k}" data-tip="tool:${k}" class="${this.tool===k?'on':''}">${ico(i,20)}${l}</button>`).join('')}</div>`;
  const hint={room:'Drag a box to build a room: walls around the edge, the floor below inside. Use two fingers to move the camera.',wall:'Drag a line to build walls. Use two fingers to move the camera.',door:'Tap a straight wall to add a door.',window:'Tap a straight wall to add a window.',floor:'Drag a box to lay flooring. Use two fingers to move the camera.',paper:'Tap the floor inside a room to paper its back walls.',remove:'Drag across walls, doors or windows to remove them.',ext:'Pick siding, a roof, shutters and a front door. The walls go up so you can see the outside.'}[this.tool];
  if(this.tool==='floor'||this.tool==='room')h+=`<div class="tabsx" style="margin-top:6px" id="sws">${Object.entries(FLOORS).filter(([k,f])=>f.l&&!(this.tool==='room'&&f.out)).map(([k,f])=>`<button data-f="${k}" data-tip="floor:${k}" class="${this.floor===k?'on':''}" aria-label="${f.l}"><canvas width="16" height="16" data-fl="${k}" style="width:24px;height:24px;image-rendering:pixelated"></canvas>${f.l} ${money(f.p)}</button>`).join('')}</div>`;
  if(this.tool==='paper')h+=`<div class="tabsx" style="margin-top:6px">${Object.entries(WALLPAPERS).map(([k,w])=>`<button data-w="${k}" data-tip="paper:${k}" class="${this.wp===k?'on':''}"><canvas width="16" height="16" data-wpp="${k}" style="width:24px;height:24px;image-rendering:pixelated"></canvas>${w.l}</button>`).join('')}</div>`;
  if(this.tool==='ext'){const E=G.ext,row=(k,l,btns)=>`<div class="exrow"><span class="exl">${l} <small>${money(EXT_COST[k])}</small></span><div class="tabsx">${btns}</div></div>`,
    sw=(k,cols,lab)=>cols.map((c,i)=>`<button data-ex="${k}" data-v="${c}" data-tip="ext:${k}" class="${E[k]===c?'on':''}" aria-label="${lab} ${i+1}"><span class="sw" style="width:22px;height:22px;background:${c}"></span></button>`).join('');
   h+=row('siding','Siding',Object.entries(SIDINGS).map(([k,s])=>`<button data-ex="siding" data-v="${k}" data-tip="ext:siding" class="${E.siding===k?'on':''}"><canvas width="16" height="16" data-sd="${k}" style="width:24px;height:24px;image-rendering:pixelated"></canvas>${s.l}</button>`).join(''))
    +row('roof','Roof',sw('roof',ROOF_COLS,'Roof color'))+row('shutter','Shutters',sw('shutter',SHUTTER_COLS,'Shutter color'))+row('door','Front door',sw('door',DOOR_COLS,'Door color'));}
  h+=sayHint(hint);el.innerHTML=h;el.querySelectorAll('canvas[data-sd]').forEach(c=>siding(c.getContext('2d'),0,0,16,0,16,c.dataset.sd));
  el.querySelectorAll('canvas[data-fl]').forEach(c=>tileFloor(c.getContext('2d'),c.dataset.fl,0,0));el.querySelectorAll('canvas[data-wpp]').forEach(c=>wallpaper(c.getContext('2d'),c.dataset.wpp,0,0,0,16,16));
  el.onclick=e=>{const b=e.target.closest('button');if(!b)return;sfx('click');if(b.dataset.ex){this.setExt(b.dataset.ex,b.dataset.v);this.renderBuild();return;}
   if(b.dataset.t){const was=this.tool;this.tool=b.dataset.t;if(this.tool==='ext'&&!R.wallsUp){this.autoWalls=1;setWallsUp(true);}else if(was==='ext'&&this.tool!=='ext'&&this.autoWalls){this.autoWalls=0;setWallsUp(false);}}if(b.dataset.f)this.floor=b.dataset.f;if(b.dataset.w)this.wp=b.dataset.w;this.renderBuild();};UI.layout();},
 // the Outside tool: one price per change, for the whole house
 setExt(k,v){if(G.ext[k]===v)return;const c=EXT_COST[k];if(G.money<c){toast(`That costs ${money(c)}`,'coin');sfx('bad');return;}G.money-=c;G.ext[k]=v;WALL_SPR.clear();sfx('build');UI.dirty=true;
  const h=W.rooms.length?roofList()[0]:null;if(h)fxText((h.x0+h.x1+1)*T/2,h.y1*T-HT,'-'+money(c),'#ffb3a8');},
 lineTiles(a,b){const L=[];const dx=b[0]-a[0],dy=b[1]-a[1];if(Math.abs(dx)>=Math.abs(dy)){const s=Math.sign(dx)||1;for(let x=a[0];x!==b[0]+s;x+=s)L.push([x,a[1]]);}else{const s=Math.sign(dy);for(let y=a[1];y!==b[1]+s;y+=s)L.push([a[0],y]);}return L;},
 rectTiles(a,b){const L=[];for(let y=Math.min(a[1],b[1]);y<=Math.max(a[1],b[1]);y++)for(let x=Math.min(a[0],b[0]);x<=Math.max(a[0],b[0]);x++)L.push([x,y]);return L;},
 down(tx,ty){this.drag={a:[tx,ty],b:[tx,ty]};this.updPrev();},
 move(tx,ty){if(!this.drag)return;this.drag.b=[tx,ty];this.updPrev();},
 cancelDrag(){this.drag=null;this.prev=null;this.prevIn=null;this.prevCross=false;},
 updPrev(){const d=this.drag;if(!d){this.prev=null;this.prevIn=null;return;}const t=this.tool;
  if(t==='room'){const x0=Math.min(d.a[0],d.b[0]),x1=Math.max(d.a[0],d.b[0]),y0=Math.min(d.a[1],d.b[1]),y1=Math.max(d.a[1],d.b[1]),per=[],inn=[];for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)(x===x0||x===x1||y===y0||y===y1?per:inn).push([x,y]);this.prev=per;this.prevIn=inn;this.prevCross=this.roomCross(per);return;}this.prev=(t==='wall'||t==='remove')?this.lineTiles(d.a,d.b):t==='floor'?this.rectTiles(d.a,d.b):[d.b];},
 up(){const d=this.drag;if(!d)return;const tiles=this.prev||[],inner=this.prevIn||[];this.drag=null;this.prev=null;this.prevIn=null;const t=this.tool;let n=0,cost=0;const occupied=(x,y)=>G.people.some(s=>s.onLot&&s.tx()===x&&s.ty()===y);
  if(t==='room'){if(!inner.length){toast('Drag a bigger box. A room needs space inside its walls.','home');return;}
   if(tiles.some(([x,y])=>this.roomBlocked(x,y))){toast('Something is in the way. Move it, or drag the room somewhere else.','frown');return;}
   if(this.roomCross(tiles)){toast('Rooms can share a wall, but they cannot overlap. Drag the new room beside the other one.','frown');sfx('bad');return;}
   const nw=tiles.filter(([x,y])=>!W.wt[I(x,y)]),fp=FLOORS[this.floor].p||0,nf=inner.filter(([x,y])=>!W.wt[I(x,y)]&&W.floor[I(x,y)]!==this.floor);cost=nw.length*BUILD_COST.wall+nf.length*fp;
   if(!nw.length&&!nf.length){toast('That room is already built','home');return;}if(G.money<cost){toast(`That room costs ${money(cost)}. Try a smaller one.`,'coin');return;}
   const pl=new Set();for(const[x,y]of tiles.concat(inner)){const o=W.objAt[I(x,y)];if(this.isPlant(o))pl.add(o);}this.clearPlants([...pl]);
   for(const[x,y]of nw){const i=I(x,y);W.wt[i]=1;W.floor[i]='wood';}for(const[x,y]of nf)W.floor[I(x,y)]=this.floor;G.money-=cost;n=nw.length+nf.length;fxText((tiles[0][0]+.5)*T,tiles[0][1]*T,'-'+money(cost),'#ffb3a8');}
  if(t==='wall')this.clearPlants(tiles.map(([x,y])=>inLot(x,y)&&!W.wt[I(x,y)]?W.objAt[I(x,y)]:null).filter((o,i,a)=>this.isPlant(o)&&a.indexOf(o)===i));
  if(t==='wall')for(const[x,y]of tiles){if(!inLot(x,y))continue;const i=I(x,y);if(W.wt[i]||W.objAt[i]||occupied(x,y))continue;const f=W.floor[i];if(f==='road'||f==='side')continue;if(G.money<BUILD_COST.wall){toast('Out of money','coin');break;}if(!G.objects.every(o=>!o.def.rug||!(x>=o.x&&x<o.x+o.def.w&&y>=o.y&&y<o.y+o.def.h))){continue;}W.wt[i]=1;G.money-=BUILD_COST.wall;n++;}
  if(t==='door'||t==='window'){const[x,y]=tiles[0]||[-1,-1];const i=I(x,y);if(!inLot(x,y)||W.wt[i]!==1){toast('Tap a wall first','frown');return;}const nn=isWall(x,y-1),s=isWall(x,y+1),e=isWall(x+1,y),w=isWall(x-1,y);
   if(!((nn&&s&&!e&&!w)||(e&&w&&!nn&&!s))){toast('Needs a straight piece of wall','frown');return;}if(W.decor[i]){toast('Take down the wall decor first','frown');return;}const c=t==='door'?BUILD_COST.door:BUILD_COST.window;if(G.money<c){toast('Not enough money','coin');return;}W.wt[i]=t==='door'?2:3;G.money-=c;n=1;if(t==='door'&&e&&w)this.walkway(x,y);}
  if(t==='floor')for(const[x,y]of tiles){if(!inLot(x,y))continue;const i=I(x,y);if(W.wt[i]||W.floor[i]===this.floor)continue;const c=FLOORS[this.floor].p||0;if(G.money<c){toast('Out of money','coin');break;}W.floor[i]=this.floor;G.money-=c;n++;}
  if(t==='paper'){const[x,y]=tiles[0]||[-1,-1];const r=roomOf(x,y);if(!r){toast('Tap the floor inside a room','frown');return;}const set=new Set();for(const ti of r.tiles){const tx=ti%MW,ty=(ti/MW)|0;for(const dx of[-1,0,1]){const wx=tx+dx,wy=ty-1;if(isWall(wx,wy)&&(dx===0||W.tall[I(wx,wy)]))set.add(I(wx,wy));}if(isWall(tx-1,ty))set.add(I(tx-1,ty));if(isWall(tx+1,ty))set.add(I(tx+1,ty));}
   for(const i of set){if(W.wp[i]===this.wp)continue;if(G.money<BUILD_COST.wallpaper)break;W.wp[i]=this.wp;G.money-=BUILD_COST.wallpaper;n++;}if(!n)toast('Those walls already have that wallpaper','roller');}
  if(t==='remove')for(const[x,y]of tiles){if(!inLot(x,y))continue;const i=I(x,y);const wt=W.wt[i];if(!wt)continue;const dc=W.decor[i];if(dc){if(dc.type==='painting')G.inv.push({id:uid('v'),kind:'painting',title:dc.state.title||'Painting',art:dc.state.art,value:dc.state.value||100});else G.money+=Math.round(dc.price*.7);removeObject(dc);}
   G.money+=Math.round((wt===1?BUILD_COST.wall:wt===2?BUILD_COST.door:BUILD_COST.window)*.5);W.wt[i]=0;const nb=[[x,y+1],[x,y-1],[x-1,y],[x+1,y]].find(([a,b])=>inMap(a,b)&&!W.wt[I(a,b)]&&!FLOORS[W.floor[I(a,b)]].out);W.floor[i]=nb?W.floor[I(nb[0],nb[1])]:(isOutdoor(x,y+1)?'grass':W.floor[i]);n++;}
  if(n){refreshWorld();repathAll();sfx('build');UI.dirty=true;}},
 walkway(x,y){if(roomOf(x,y+1)||!roomOf(x,y-1))return;const L=[];for(let j=y+1;j<SIDEY;j++){const i=I(x,j);if(W.floor[i]==='path')break;if(W.wt[i]||W.floor[i]!=='grass'||W.objAt[i])return;L.push(i);}
  for(const i of L)W.floor[i]='path';if(L.length)W.groundDirty=true;},
 roomCross(per){const ins=new Set();for(const[x,y]of per){if(!inMap(x,y))continue;const i=I(x,y);if(!W.wt[i]&&W.room[i]>=0)ins.add(W.room[i]);}
  for(const r of ins)for(const[x,y]of per){if(!inMap(x,y))continue;const i=I(x,y);if(!W.wt[i]&&W.room[i]!==r)return true;}return false;},
 isPlant(o){return!!(o&&o.def.out&&o.def.decor);},
 clearPlants(list){if(!list.length)return;let v=0;for(const o of list){v+=Math.round((o.price||o.def.p)*.7);removeObject(o);}G.money+=v;refreshWorld();toast(`Cleared ${list.length===1?'a plant':list.length+' plants'} to make room (+${money(v)})`,'leaf');},
 roomBlocked(x,y){if(!inLot(x,y))return true;const i=I(x,y);if(W.wt[i])return false;const f=W.floor[i];if(f==='road'||f==='side')return true;if(W.objAt[i]&&!this.isPlant(W.objAt[i]))return true;return G.objects.some(o=>o.def.rug&&x>=o.x&&x<o.x+o.def.w&&y>=o.y&&y<o.y+o.def.h);},
 drawWorld(b){_g=b;b.fillStyle='rgba(255,255,255,.09)';for(let x=0;x<=MW;x++)b.fillRect(x*T,0,1,LOTH*T);for(let y=0;y<=LOTH;y++)b.fillRect(0,y*T,MW*T,1);
  const p=this.placing;if(p){const d=defFor(p.type,p.rot);const o={type:p.type,def:d,x:p.x,y:p.y,rot:p.rot,variant:p.variant,state:p.inv?{art:p.inv.art}:{},users:{}};const ok=canPlace(p.type,p.x,p.y,p.rot,p.moving)===true;
   b.globalAlpha=.85;if(d.rug)drawRug(b,o,p.x*T,p.y*T);else if(d.wall){const[c,g]=mkc(14,12);drawWallDecor(g,o,0,0);b.drawImage(c,p.x*T+1,p.y*T-12);}else{const sp=objSprites(o);if(sp){b.drawImage(sp.base.c,p.x*T+sp.base.ox,p.y*T+sp.base.oy);if(sp.top)b.drawImage(sp.top.c,p.x*T+sp.top.ox,p.y*T+sp.top.oy);}}b.globalAlpha=1;
   b.fillStyle=ok?'rgba(95,200,90,.35)':'rgba(230,70,60,.4)';if(d.wall)b.fillRect(p.x*T,p.y*T-14,T,T);else b.fillRect(p.x*T,p.y*T,d.w*T,d.h*T);
   if(d.acts&&!d.wall&&!d.rug){b.fillStyle='rgba(255,255,255,.35)';for(let i=0;i<d.w;i++)b.fillRect((p.x+i)*T+5,(p.y+d.h)*T+5,6,6);}}
  if(this.prevIn){b.fillStyle='rgba(255,230,150,.38)';for(const[x,y]of this.prevIn)if(inLot(x,y))b.fillRect(x*T,y*T,T,T);}
  if(this.prev&&this.tool==='room'){for(const[x,y]of this.prev){b.fillStyle=this.prevCross||this.roomBlocked(x,y)?'rgba(230,70,60,.6)':'rgba(90,70,85,.6)';if(inMap(x,y))b.fillRect(x*T,y*T,T,T);}}
  else if(this.prev){const t=this.tool;b.fillStyle=t==='remove'?'rgba(230,70,60,.45)':t==='floor'?'rgba(255,230,150,.35)':t==='wall'?'rgba(90,70,85,.55)':'rgba(120,180,255,.45)';for(const[x,y]of this.prev)if(inLot(x,y))b.fillRect(x*T,y*T,T,T);}
  // mouse hover in build mode: mark the tile a click or drag would start on
  else if(G.mode==='build'&&this.hov&&inLot(this.hov[0],this.hov[1])){const[x,y]=this.hov;b.fillStyle='rgba(255,255,255,.22)';b.fillRect(x*T,y*T,T,T);b.fillStyle='rgba(255,255,255,.7)';b.fillRect(x*T,y*T,T,1);b.fillRect(x*T,y*T+T-1,T,1);b.fillRect(x*T,y*T,1,T);b.fillRect(x*T+T-1,y*T,1,T);}}
};

// ---------- input ----------
const IN={ptrs:new Map(),pan:false,pinch:null,downAt:0,sx:0,sy:0,cx:0,cy:0,mode:null,errShown:false};
function hitSim(wx,wy){let best=null;for(const s of G.people){if(!s.onLot)continue;const lying=s.inObj&&s.inObj.sl&&s.inObj.sl.lie,top=lying?s.y-17:s.y-27,bot=lying?s.y-2:s.y+3;if(wx>=s.x-7&&wx<=s.x+7&&wy>=top&&wy<=bot&&(!best||s.y>best.y))best=s;}return best;}
function hitItem(wx,wy){for(const it of G.items){const o=G.objects.find(x=>x.id===it.surf);const x=it.x*T+8,y=it.y*T+(it.kind==='puddle'?8:o&&o.def.table?1:-1);if(Math.abs(wx-x)<=6&&wy>=y-5&&wy<=y+6)return it;}return null;}
function alphaAt(spr,x,y){if(!spr.a)spr.a=spr.c.getContext('2d').getImageData(0,0,spr.c.width,spr.c.height).data;return spr.a[(y*spr.c.width+x)*4+3]>40;}
function hitObject(wx,wy,buy){let rug=null;const L=G.objects.slice().sort((a,b)=>(b.y+b.def.h)-(a.y+a.def.h));
 for(const o of L){const d=o.def;if(!buy&&!d.acts)continue;
  if(d.wall){if(!buy)continue;if(wx>=o.x*T&&wx<o.x*T+T&&wy>=o.y*T-14&&wy<o.y*T)return o;continue;}
  if(d.rug){if(buy&&wx>=o.x*T&&wx<(o.x+d.w)*T&&wy>=o.y*T&&wy<(o.y+d.h)*T)rug=rug||o;continue;}
  const sp=objSprites(o);if(!sp)continue;const lx=Math.floor(wx-(o.x*T+sp.base.ox)),ly=Math.floor(wy-(o.y*T+sp.base.oy));
  if(lx<0||ly<0||lx>=sp.base.c.width||ly>=sp.base.c.height)continue;if(alphaAt(sp.base,lx,ly)||(sp.top&&alphaAt(sp.top,lx,ly)))return o;}
 return rug;}
function tap(cx,cy){
 if(UI.modalOpen())return;if(!$('#ctx').classList.contains('hidden')){UI.ctxClose();return;}if(UI.welcomeOn)return;
 const w=screenToWorld(cx,cy),tx=Math.floor(w.x/T),ty=Math.floor(w.y/T);
 if((G.mode==='live'||(G.mode==='buy'&&!BB.placing))&&roofAt(w.x,w.y)){toastOnceG('Walls are up. Tap the house button by the zoom buttons to see inside.');return;}
 if(G.mode==='buy'){if(BB.placing){BB.ghostTo(tx,ty);return;}const o=hitObject(w.x,w.y,true);if(o)BB.objTap(o,cx,cy);return;}
 if(G.mode!=='live')return;
 const s=hitSim(w.x,w.y);if(s){UI.simMenu(s,cx,cy);return;}
 const it=hitItem(w.x,w.y);if(it){UI.itemMenu(it,cx,cy);return;}
 const o=hitObject(w.x,w.y,false);if(o){UI.objMenu(o,cx,cy);return;}
 const sel=selSim();if(sel&&!sel.away&&sel.onLot&&freeTile(tx,ty)){enqueue(sel,A('goto','Go Here','walk',[{k:'walk',x:tx,y:ty}]));R.marker={x:tx,y:ty,until:R.t+1.4};sfx('pop');}
}
function toastOnceG(msg){const k='g:'+msg;if(_toastOnce[k]&&performance.now()-_toastOnce[k]<6000)return;_toastOnce[k]=performance.now();toast(msg,'home');}
// right-click without dragging: cancel placing, close a menu, or act like a tap (menus, walk here)
function rightClick(cx,cy){if(UI.modalOpen()||UI.welcomeOn)return;if(!$('#ctx').classList.contains('hidden')){UI.ctxClose();return;}
 if(G.mode==='buy'&&BB.placing){BB.cancel();sfx('click');return;}if(G.mode==='build')return;tap(cx,cy);}
function initInput(){const c=R.cv;
 c.addEventListener('pointerdown',e=>{
  // mouse: the right or middle button moves the camera in every mode, so the left button stays free for tools
  if(e.pointerType==='mouse'&&e.button!==0){if(e.button===1||e.button===2){try{c.setPointerCapture(e.pointerId);}catch(_){}AU.init();clearTimeout(IN.lp);R.zt=null;DESK.leave();IN.rp={x:e.clientX,y:e.clientY,cx:R.camX,cy:R.camY,moved:false,b:e.button};e.preventDefault();}return;}
  try{c.setPointerCapture(e.pointerId);}catch(_){}AU.init();IN.ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  clearTimeout(IN.lp);if(IN.ptrs.size===1){IN.sx=e.clientX;IN.sy=e.clientY;IN.downAt=performance.now();IN.pan=false;IN.cx=R.camX;IN.cy=R.camY;IN.mode=null;R.zt=null;
   const w=screenToWorld(e.clientX,e.clientY),tx=Math.floor(w.x/T),ty=Math.floor(w.y/T);
   if(G.mode==='build'&&!UI.modalOpen()&&BB.tool!=='ext'){IN.mode='tool';BB.down(tx,ty);}else if(G.mode==='buy'&&BB.placing&&BB.onGhost(tx,ty))IN.mode='ghost';
   else if(!UI.modalOpen()&&!UI.welcomeOn&&!(G.mode==='buy'&&BB.placing)){const px=e.clientX,py=e.clientY;IN.lp=setTimeout(()=>{if(IN.ptrs.size!==1||IN.pan||IN.mode)return;const w2=screenToWorld(px,py),d=worldTip(w2.x,w2.y);if(d&&TIP.showAt(d,px,py)){IN.mode='tip';UI.ctxClose();try{navigator.vibrate&&navigator.vibrate(8);}catch(_){}}},450);}}
  else if(IN.ptrs.size===2){const[a,b]=[...IN.ptrs.values()];if(IN.mode==='tool')BB.cancelDrag();if(IN.mode==='tip')TIP.hide();IN.mode='pinch';IN.pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,z:R.Z,mx:(a.x+b.x)/2,my:(a.y+b.y)/2};}});
 c.addEventListener('pointermove',e=>{
  if(IN.rp&&e.pointerType==='mouse'){const r=IN.rp,dx=e.clientX-r.x,dy=e.clientY-r.y;if(!r.moved&&Math.hypot(dx,dy)>4){r.moved=true;c.style.cursor='grabbing';UI.ctxClose();}
   if(r.moved){R.camX=r.cx-dx*R.dpr/R.Z;R.camY=r.cy-dy*R.dpr/R.Z;clampCam();}return;}
  if(e.pointerType==='mouse'&&!IN.ptrs.size){DESK.hover(e);return;}
  if(!IN.ptrs.has(e.pointerId))return;IN.ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(IN.mode==='pinch'&&IN.ptrs.size>=2){const[a,b]=[...IN.ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;R.camX-=(mx-IN.pinch.mx)*R.dpr/R.Z;R.camY-=(my-IN.pinch.my)*R.dpr/R.Z;IN.pinch.mx=mx;IN.pinch.my=my;
   const zw=IN.pinch.z*d/IN.pinch.d;if(zw<R.Zmin*.72&&G.mode==='live'&&G.started&&!UI.welcomeOn){IN.ptrs.clear();IN.mode=null;IN.pinch=null;TV.open('browse');return;}setZoom(zw,mx*R.dpr,my*R.dpr);clampCam();return;}
  if(IN.ptrs.size!==1)return;const w=screenToWorld(e.clientX,e.clientY),tx=Math.floor(w.x/T),ty=Math.floor(w.y/T);
  if(IN.mode==='tool'){BB.move(tx,ty);return;}if(IN.mode==='ghost'){BB.ghostTo(tx,ty);return;}if(IN.mode==='tip')return;
  const dx=e.clientX-IN.sx,dy=e.clientY-IN.sy;if(!IN.pan&&Math.hypot(dx,dy)>8){IN.pan=true;clearTimeout(IN.lp);UI.ctxClose();}
  if(IN.pan){R.camX=IN.cx-dx*R.dpr/R.Z;R.camY=IN.cy-dy*R.dpr/R.Z;clampCam();}});
 const up=e=>{
  if(IN.rp&&e.pointerType==='mouse'){const r=IN.rp;IN.rp=null;c.style.cursor='';if(!r.moved&&r.b===2&&e.type==='pointerup')rightClick(e.clientX,e.clientY);return;}
  if(!IN.ptrs.has(e.pointerId))return;IN.ptrs.delete(e.pointerId);clearTimeout(IN.lp);
  if(IN.mode==='pinch'){if(IN.ptrs.size===0)IN.mode=null;else{const p=[...IN.ptrs.values()][0];IN.sx=p.x;IN.sy=p.y;IN.cx=R.camX;IN.cy=R.camY;IN.pan=true;IN.mode='after';}return;}
  if(IN.ptrs.size>0)return;
  if(IN.mode==='tool'){BB.up();IN.mode=null;return;}
  // with a mouse the ghost already follows the pointer, so a click (not a drag) places it
  if(IN.mode==='ghost'&&e.pointerType==='mouse'&&e.type==='pointerup'&&Math.hypot(e.clientX-IN.sx,e.clientY-IN.sy)<6&&performance.now()-IN.downAt<650){IN.mode=null;IN.pan=false;BB.confirm();return;}
  if(IN.mode==='ghost'||IN.mode==='tip'){IN.mode=null;IN.pan=false;return;}
  if(IN.mode!=='after'&&!IN.pan&&performance.now()-IN.downAt<650&&e.type==='pointerup')tap(e.clientX,e.clientY);IN.pan=false;IN.mode=null;};
 c.addEventListener('pointerup',up);c.addEventListener('pointercancel',up);c.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&!IN.ptrs.size&&!IN.rp)DESK.leave();});
 c.addEventListener('wheel',e=>{e.preventDefault();const x=e.clientX*R.dpr,y=e.clientY*R.dpr,d=e.deltaY*(e.deltaMode===1?33:e.deltaMode===2?400:1);
  if(d>0&&R.Z<=R.Zmin*1.002&&G.mode==='live'&&G.started&&!UI.welcomeOn){IN.wout=(IN.wout||0)+d;if(IN.wout>260){IN.wout=0;TV.open('browse');}return;}IN.wout=0;
  if(R.smooth)zoomTo((R.zt!=null?R.zt:R.Z)*Math.exp(-clamp(d,-240,240)*(e.ctrlKey?.012:.0024)),x,y);else{IN.wacc=(IN.wacc||0)+d;if(Math.abs(IN.wacc)>=40){zoomStep(IN.wacc<0?1:-1,x,y);IN.wacc=0;}}},{passive:false});
 c.addEventListener('contextmenu',e=>e.preventDefault());
 document.addEventListener('gesturestart',e=>e.preventDefault());
 // keyboard: Space pauses, 0-3 set the speed, arrows or WASD move the camera (held, in DESK.frame), + and - zoom,
 // Esc backs out of menus, placing and the town map, R turns and Enter places the item being placed
 window.addEventListener('keydown',e=>{const tg=e.target&&e.target.tagName;if(tg==='INPUT'||tg==='TEXTAREA'||tg==='SELECT')return;if(e.ctrlKey||e.metaKey||e.altKey)return;
  const k=e.key.length===1?e.key.toLowerCase():e.key,busy=UI.modalOpen()||UI.welcomeOn||!$('#cas').classList.contains('hidden');
  if(DESK.PAN[k]){if(!busy){DESK.keys.add(k);e.preventDefault();}return;}
  if(k===' '){G.speed=G.speed?0:1;UI.dirty=true;e.preventDefault();}else if(k>='0'&&k<='3'){G.speed=+k;UI.dirty=true;}
  else if(k==='Escape'){if(TIP.open())TIP.hide();if(!$('#ctx').classList.contains('hidden')){UI.ctxClose();return;}if(BB.placing){BB.cancel();return;}
   if(UI.modalOpen()){if($('#cas').classList.contains('hidden')&&UI.mCancel){const f=UI.mCancel;UI.closeModal();f();}return;}
   if(TV.on&&!busy){if(TV.sel)TV.select(null);else if(TV.mode==='pick')TV.cancelPick();else TV.close();sfx('click');}}
  else if(k==='+'||k==='='){if(TV.on)TV.zoomStep(1);else zoomStep(1);}else if(k==='-'||k==='_'){if(TV.on)TV.zoomStep(-1);else zoomStep(-1);}
  else if(k==='r'&&BB.placing&&!busy){const p=BB.placing,d=CATALOG[p.type];if(turnsOf(d)){p.rot=nextRot(d,p.rot);BB.renderPlaceBar();sfx('click');}else toast(`The ${d.n.toLowerCase()} only goes one way`,'frown');}
  else if(k==='Enter'&&BB.placing&&!busy){BB.confirm();e.preventDefault();}
  else if(k==='h'&&!busy&&!TV.on&&G.started){toggleWalls();}});
 window.addEventListener('keyup',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;DESK.keys.delete(k);});
}

// ---------- audio: small synth for UI sounds; music is a playlist of recorded tracks (MUS) ----------
const AU={ctx:null,master:null,sfxG:null,musG:null,
 init(){if(this.ctx){if(this.ctx.state!=='running')this.ctx.resume().catch(()=>{});MUS.resume();return;}
  try{const C=window.AudioContext||window.webkitAudioContext;if(C){const c=new C();this.ctx=c;this.master=c.createGain();this.master.gain.value=.8;this.master.connect(c.destination);
   this.sfxG=c.createGain();this.sfxG.gain.value=.5;this.sfxG.connect(this.master);this.musG=c.createGain();this.musG.gain.value=G.settings.music?MUS.VOL:0;this.musG.connect(this.master);
   if(c.state==='suspended')c.resume().catch(()=>{});}}catch(e){this.ctx=null;}
  MUS.init();MUS.kick();},
 apply(){if(this.musG)this.musG.gain.setTargetAtTime(G.settings.music?MUS.VOL:0,this.ctx.currentTime,.3);MUS.kick();},
 tone(f,t,d,type,g,dest,att){const c=this.ctx,o=c.createOscillator(),a=c.createGain();o.type=type||'sine';o.frequency.value=f;a.gain.setValueAtTime(0.0001,t);a.gain.linearRampToValueAtTime(g,t+(att||.012));a.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(a);a.connect(dest||this.sfxG);o.start(t);o.stop(t+d+.05);return a;},
 sfx(n){if(!this.ctx||!G.settings.sfx||this.ctx.state!=='running')return;const t=this.ctx.currentTime;
  switch(n){case 'click':this.tone(880,t,.06,'triangle',.1);break;case 'pop':this.tone(660,t,.08,'sine',.16);this.tone(990,t+.05,.08,'sine',.1);break;
   case 'cash':this.tone(1568,t,.16,'triangle',.08);this.tone(2093,t+.07,.3,'sine',.07);break;
   case 'good':[523,659,784].forEach((f,i)=>this.tone(f,t+i*.07,.22,'triangle',.11));break;
   case 'wish':[659,784,988,1318].forEach((f,i)=>this.tone(f,t+i*.08,.3,'triangle',.09));break;
   case 'promo':[523,659,784,1046,784,1046].forEach((f,i)=>this.tone(f,t+i*.09,.34,'triangle',.09));break;
   case 'bad':this.tone(392,t,.22,'triangle',.08);this.tone(311,t+.13,.34,'triangle',.07);break;
   case 'build':this.tone(180,t,.1,'triangle',.14);this.tone(120,t+.04,.14,'sine',.12);break;}}
};

// Music: five recorded pieces (rendered from original compositions). Day, night and build-mode playlists,
// shuffled without quick repeats, with short pauses between songs and crossfades when the mode changes.
const MUS={VOL:.62,T:{maple_morning:'Maple Morning',saturday_errands:'Saturday Errands',corner_cafe:'Corner Café',porch_swing:'Porch Swing',streetlights:'Streetlights'},
 L:{day:['maple_morning','saturday_errands','corner_cafe','porch_swing'],night:['streetlights','porch_swing','corner_cafe'],build:['porch_swing','corner_cafe','saturday_errands']},
 SILENT:'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=',
 els:[],gs:[],cur:-1,kind:null,track:null,recent:[],next:0,fails:0,hid:false,
 init(){if(this.els.length)return;
  for(let i=0;i<2;i++){const a=document.createElement('audio');a.preload='auto';a.setAttribute('playsinline','');
   a.addEventListener('ended',()=>{if(i===this.cur&&this.kind)this.onEnd();});a.addEventListener('error',()=>{if(i===this.cur&&this.kind&&!String(a.currentSrc||a.src).startsWith('data:'))this.onErr();});
   let g=null;if(AU.ctx){try{const src=AU.ctx.createMediaElementSource(a);g=AU.ctx.createGain();g.gain.value=0;src.connect(g);g.connect(AU.musG);}catch(e){g=null;}}
   if(!g)a.volume=0;this.els.push(a);this.gs.push(g);
   if(i===1||!G.settings.music){a.src=this.SILENT;this.play(a);}}
  document.addEventListener('visibilitychange',()=>{const a=this.els[this.cur];if(!a)return;if(document.hidden){if(!a.paused){a.pause();this.hid=true;}}else if(this.hid){this.hid=false;if(this.kind)this.play(a);}});
  setInterval(()=>this.tick(),500);},
 play(a){try{const p=a.play();if(p&&p.catch)p.catch(()=>{});}catch(e){}},
 want(){if(!G.settings.music)return null;if(G.mode!=='live')return'build';const h=hourOf(G.time);return h>=20||h<6?'night':'day';},
 pick(kind){const L=this.L[kind],o=L.filter(t=>!this.recent.includes(t)),arr=o.length?o:L.filter(t=>t!==this.track);return arr.length?pick(arr):L[0];},
 vol(i,v,t){const g=this.gs[i],a=this.els[i];if(!a)return;
  if(g&&AU.ctx){const now=AU.ctx.currentTime;g.gain.cancelScheduledValues(now);g.gain.setValueAtTime(g.gain.value,now);g.gain.linearRampToValueAtTime(v,now+Math.max(.02,t));return;}
  const v0=a.volume,v1=v*MUS.VOL,st=performance.now(),f=()=>{const k=Math.min(1,(performance.now()-st)/Math.max(20,t*1000));a.volume=clamp(v0+(v1-v0)*k,0,1);if(k<1)setTimeout(f,50);};f();},
 start(kind,fade){const id=this.pick(kind),i=this.cur<0?0:1-this.cur,a=this.els[i];if(!a)return;
  if(this.cur>=0){const o=this.cur,oa=this.els[o];this.vol(o,0,fade);setTimeout(()=>{if(this.cur!==o)oa.pause();},fade*1000+150);}
  a.src='music/'+id+'.mp3';this.vol(i,0,.01);this.play(a);this.vol(i,1,fade);
  this.cur=i;this.kind=kind;this.track=id;this.recent.push(id);if(this.recent.length>2)this.recent.shift();},
 onEnd(){this.kind=null;this.track=null;this.next=performance.now()+3000+Math.random()*7000;},
 onErr(){this.fails++;this.kind=null;this.track=null;this.next=performance.now()+(this.fails>3?180000:8000);},
 stop(){const i=this.cur,a=this.els[i];this.kind=null;this.track=null;if(!a)return;this.vol(i,0,1);setTimeout(()=>{if(!this.kind)a.pause();},1100);},
 resume(){const a=this.els[this.cur];if(a&&this.kind&&a.paused&&!document.hidden)this.play(a);},
 kick(){this.next=0;this.tick();},
 skip(){if(G.settings.music&&this.els.length)this.start(this.want()||'day',1.2);},
 tick(){if(!this.els.length||document.hidden)return;const k=this.want();
  if(!k){if(this.kind)this.stop();return;}
  if(this.kind){if((k==='build')!==(this.kind==='build'))this.start(k,1.8);return;}
  if(performance.now()>=this.next)this.start(k,this.cur<0?1.2:2);}
};
