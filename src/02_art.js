// ================= ART: pixel sprites, icons, ground & walls =================
function mkc(w,h){const c=document.createElement('canvas');c.width=Math.max(1,w);c.height=Math.max(1,h);const g=c.getContext('2d');g.imageSmoothingEnabled=false;return[c,g];}
// Scale2x (EPX) rounds sprite corners the same way the world upscaler does; used for screen-space sprites
function scale2x(src){const w=src.width,h=src.height,s=new Uint32Array(src.getContext('2d').getImageData(0,0,w,h).data.buffer),[c,g]=mkc(w*2,h*2),od=g.createImageData(w*2,h*2),o=new Uint32Array(od.data.buffer),W2=w*2;
 const P=(x,y)=>x<0||y<0||x>=w||y>=h?0:s[y*w+x];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=s[y*w+x],A=P(x,y-1),B=P(x+1,y),C=P(x-1,y),D=P(x,y+1);let e0=p,e1=p,e2=p,e3=p;
  if(C===A&&C!==D&&A!==B)e0=A;if(A===B&&A!==C&&B!==D)e1=B;if(D===C&&D!==B&&C!==A)e2=C;if(B===D&&B!==A&&D!==C)e3=D;
  const q=y*2*W2+x*2;o[q]=e0;o[q+1]=e1;o[q+W2]=e2;o[q+W2+1]=e3;}
 g.putImageData(od,0,0);return c;}
function smoothSpr(c,n){const k='_s'+n;if(!c[k]){let r=c;for(let m=1;m<n;m*=2)r=scale2x(r);c[k]=r;}return c[k];}
let _g=null;
function F(c,x,y,w,h){_g.fillStyle=c;_g.fillRect(x,y,w==null?1:w,h==null?1:h);}
function outline(c,f){
 f=f||.42;const g=c.getContext('2d'),w=c.width,h=c.height,src=g.getImageData(0,0,w,h),d=src.data,o=new Uint8ClampedArray(d);
 const op=i=>d[i+3]>200;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(d[i+3]>0)continue;let b=-1;
  if(y<h-1&&op(i+w*4))b=i+w*4;else if(x>0&&op(i-4))b=i-4;else if(x<w-1&&op(i+4))b=i+4;else if(y>0&&op(i-w*4))b=i-w*4;
  if(b>=0){o[i]=d[b]*f;o[i+1]=d[b+1]*f;o[i+2]=Math.min(255,d[b+2]*f+10);o[i+3]=255;}}
 g.putImageData(new ImageData(o,w,h),0,0);return c;
}
const WOOD='#a5703f',WOODL='#c08a55',WOODD='#7a4f2b',WOODDD='#5a3a20',APP='#eef2f5',APPL='#ffffff',APPS='#cdd6de',APPD='#8c97a3',STEEL='#9aa6b2',DARK='#3a3d44',EYE='#2b2230';

// ---------- icons (10x10 pixel maps) ----------
const IP={k:'#2a1f2d',w:'#ffffff',W:'#ddd6e0',r:'#e0463c',R:'#a8302a',o:'#f08a2a',O:'#c9661d',y:'#f6d04a',Y:'#d29a22',g:'#6cbf4a',G:'#3f8a35',b:'#4f86d6',B:'#2e5aa8',l:'#9fd3f0',p:'#e27aa6',P:'#a8487a',n:'#a8743f',N:'#6b4423',s:'#f3c9a6',a:'#a9b3bf',A:'#5f6b78',v:'#8e5ba8',t:'#4fb3a8'};
const ICONS={
 hunger:['..kkkkkk..','.kooooook.','koowoowook','kooooooook','kggggggggk','kNNNNNNNNk','kyyyyyyyyk','kooooooook','.kOOOOOOk.','..kkkkkk..'],
 energy:['.....kkkk.','....kyyyk.','...kyyyk..','..kyyyk...','.kyyyyyyk.','.kkkyyyk..','...kyyk...','..kyyk....','..kyk.....','..kk......'],
 bladder:['....kk....','...kbbk...','...kbbk...','..kbbbbk..','.kblbbbbk.','.kblbbbbk.','kbbbbbbbbk','kbbbbbbBbk','.kbbbbBBk.','..kkkkkk..'],
 hygiene:['.kk....kk.','kwlk..kwlk','kllk..kllk','.kk.kk.kk.','...kwlk...','.kkkkkkkk.','kppwpppppk','kpppppppPk','kPPPPPPPPk','.kkkkkkkk.'],
 fun:['...kkkk...','..kppppk..','.kpwpppPk.','.kpppppPk.','.kppppPPk.','..kpPPPk..','...kkkk...','....kk....','.....k....','....k.....'],
 social:['..........','.kkkkkkkk.','kwwwwwwwwk','kwbwwbwwbk','kwwwwwwwwk','.kkwkkkkk.','..kwk.....','..kk......','..........','..........'],
 cooking:['..........','.kkkkk....','kAAAAAk...','kAwwwAk...','kAwywAkkkk','kAwwwAkNNk','kAAAAAkkkk','.kkkkk....','..........','..........'],
 logic:['....kk....','...kwwk...','...kwWk...','....kk....','...kwwk...','...kwWk...','..kwwwWk..','.kwwwwwWk.','.kkkkkkkk.','..........'],
 fitness:['..........','kk......kk','kak....kak','kakkkkkkak','kaaaaaaaak','kakkkkkkak','kak....kak','kk......kk','..........','..........'],
 charisma:['...kkkk...','..kaaaak..','..kawaak..','..kaaaak..','...kkkk...','....kk....','....kk....','...kkkk...','..kkkkkk..','..........'],
 painting:['..kkkkkk..','.knnnnnnk.','knrnnynnnk','knnnnnnbnk','knnkknnnnk','knnkknngnk','.knnnnnnk.','..kkknnk..','.....kk...','..........'],
 guitar:['.......kk.','......kNk.','.....kNk..','....kNk...','.kkkkNk...','koooookk..','kookkook..','kooooook..','.kooook...','..kkkk....'],
 gardening:['..kk..kk..','.kgGk.kgk.','.kggGkggk.','..kkgGkk..','....kgk...','....kgk...','.kkkkgkkk.','knnnnnnnnk','kNnnnnnnNk','.kkkkkkkk.'],
 coin:['..kkkkkk..','.kyyyyyyk.','kyyYYYYyyk','kyyYyyyyyk','kyyyYYyyyk','kyyyyyYyyk','kyyYYYYyyk','kYyyyyyyYk','.kYYYYYYk.','..kkkkkk..'],
 heart:['..........','.kkk..kkk.','krrrkkrrrk','krwrrrrrrk','krrrrrrrrk','.krrrrrrk.','..krrrrk..','...krrk...','....kk....','..........'],
 heartbreak:['..........','.kkk..kkk.','kPPPkkPPPk','kPPPkPPPPk','kPPPPkPPPk','.kPPkPPPk.','..kPPkPk..','...kPPk...','....kk....','..........'],
 star:['....kk....','...kyyk...','kkkkyykkkk','kyyyyyyyyk','.kyyywyyk.','..kyyyyk..','.kyykkyyk.','.kyk..kyk.','.kk....kk.','..........'],
 job:['..........','...kkkk...','..k....k..','kkkkkkkkkk','knnnnnnnnk','knnnyynnnk','kNNNNNNNNk','knnnnnnnnk','kkkkkkkkkk','..........'],
 people:['..kk...kk.','.kssk.kssk','.kssk.kssk','..kk...kk.','.kbbk.krrk','kbbbbkrrrk','kbbbbkrrrk','kbbbbkrrrk','.kkkk.kkk.','..........'],
 smile:['..kkkkkk..','.kggggggk.','kggkggkggk','kggkggkggk','kggggggggk','kgkggggkgk','kggkkkkggk','.kggggggk.','..kkkkkk..','..........'],
 frown:['..kkkkkk..','.krrrrrrk.','krrkrrkrrk','krrkrrkrrk','krrrrrrrrk','krrkkkkrrk','krkrrrrkrk','.krrrrrrk.','..kkkkkk..','..........'],
 meh:['..kkkkkk..','.kyyyyyyk.','kyykyykyyk','kyykyykyyk','kyyyyyyyyk','kyyyyyyyyk','kyykkkkyyk','.kyyyyyyk.','..kkkkkk..','..........'],
 zzz:['.....BBBB.','.......B..','......B...','.....BBBB.','BBBB......','..B.......','.B........','BBBB......','..........','..........'],
 food:['..........','...kkkk...','..kooook..','.koyoooOk.','kkkkkkkkkk','kwwwwwwwwk','.kWWWWWWk.','..kkkkkk..','..........','..........'],
 leaf:['....k....','...kok...','kk.kok.kk','kokkokkok','.koooook.','..koook..','.kkkokkk.','....k....','....k....'],
 home:['....kk....','...krrk...','..krrrrk..','.krrrrrrk.','kkkkkkkkkk','.kwwwwwwk.','.kwnnwllk.','.kwnnwllk.','.kwnnwwwk.','.kkkkkkkk.'],
 trophy:['..kkkkkk..','kkyyyyyykk','kykyyyykyk','kkyyyyyykk','..kyyyyk..','...kyyk...','....kk....','...kYYk...','..kkkkkk..','..........'],
 note:['.....kk...','.....kbk..','.....kbbk.','.....k.kbk','.....k..kk','..kkkk....','.kbbbk....','.kbbbk....','..kkk.....','..........'],
 book:['..........','.kkkkkkkk.','kbbbbbbbwk','kbbbbbbbwk','kbbybbbbwk','kbbbbbbbwk','kBBBBBBBwk','.kkkkkkkk.','..........','..........'],
 sun:['....yy....','.y..yy..y.','..ykkkky..','..kyyyyk..','yykyywykyy','yykyyyykyy','..kyyyyk..','..ykkkky..','.y..yy..y.','....yy....'],
 moon:['...kkkk...','..kyyyk...','.kyyyk....','.kyyk.....','.kyyk.....','.kyyk.....','.kyyyk....','..kyyyk...','...kkkk...','..........'],
 cloud:['..........','...kkk....','..kwwwkk..','.kwwwwwwk.','kwwwwwwwwk','kWWWWWWWWk','.kkkkkkkk.','..........','..........','..........'],
 rain:['..........','...kkk....','..kwwwkk..','.kwwwwwwk.','kwwwwwwwwk','kWWWWWWWWk','.kkkkkkkk.','.b..b..b..','b..b..b...','..........'],
 snow:['..........','...kkk....','..kwwwkk..','.kwwwwwwk.','kwwwwwwwwk','kWWWWWWWWk','.kkkkkkkk.','.l..l..l..','..l..l..l.','..........'],
 fire:['....k.....','...kok....','...koyk...','..koyyok..','.koyywyok.','.koyyyyok.','.kooyyook.','..kooook..','...kkkk...','..........'],
 sofa:['..........','.kkkkkkkk.','.krrrrrrk.','kkrrrrrrkk','krkkkkkkrk','krrrrrrrrk','kkkkkkkkkk','.kN....Nk.','..........','..........'],
 hammer:['.kkkkkkk..','kaaaaaaak.','kAAAAAAAk.','.kkkkNkk..','....kNk...','....kNk...','....kNk...','....kNk...','....kNk...','.....k....'],
 phone:['..kkkkkk..','.kAAAAAAk.','.kAllllAk.','.kAllllAk.','.kAllllAk.','.kAllllAk.','.kAllllAk.','.kAAkkAAk.','.kAAAAAAk.','..kkkkkk..'],
 gift:['..kk..kk..','.krrkkrrk.','..kkrrkk..','kkkkrrkkkk','kyyyrryyyk','kkkkrrkkkk','.kyyrryyk.','.kyyrryyk.','.kyyrryyk.','.kkkkkkkk.'],
 wall:['kkkkkkkkkk','krrrrkrrrk','kRRRRkRRRk','kkkkkkkkkk','krrkrrrrkk','kRRkRRRRkk','kkkkkkkkkk','krrrrkrrrk','kRRRRkRRRk','kkkkkkkkkk'],
 door:['.kkkkkkkk.','.knnnnnnk.','.knNnnNnk.','.knNnnNnk.','.knnnnnyk.','.knNnnNnk.','.knNnnNnk.','.knnnnnnk.','.knnnnnnk.','.kkkkkkkk.'],
 window:['kkkkkkkkkk','kllllkllwk','kllwlklllk','kllllkllll','kkkkkkkkkk','kllllkllwk','kllllkllll','kllllkllll','kkkkkkkkkk','..........'],
 floor:['kkkkkkkkkk','kwwnnwwnnk','kwwnnwwnnk','knnwwnnwwk','knnwwnnwwk','kwwnnwwnnk','kwwnnwwnnk','knnwwnnwwk','knnwwnnwwk','kkkkkkkkkk'],
 roller:['kkkkkkkk..','kppppppk..','kPPPPPPk..','kkkkkkkkk.','.......k..','....kkkk..','....k.....','...kNk....','...kNk....','...kkk....'],
 remove:['kk......kk','krk....krk','.krk..krk.','..krkkrk..','...krrk...','...krrk...','..krkkrk..','.krk..krk.','krk....krk','kk......kk'],
 walk:['..........','..kkk.....','.knnnk....','.knnnk.kkk','.knnnkknnk','..kkk.knnk','.......knk','..........','..........','..........'],
 box:['..........','.kkkkkkkk.','knnnnnnnnk','kkkkkkkkkk','knnnnnnnnk','knnnyynnnk','knnnnnnnnk','kNNNNNNNNk','.kkkkkkkk.','..........'],
 bag:['...kkkk...','..k....k..','.kkkkkkkk.','kggggggggk','kggggggggk','kgggwggggk','kggggggggk','kGGGGGGGGk','.kkkkkkkk.','..........'],
 fish:['..........','...kkkk...','..kllllk.k','.klkllllkk','kllllllllk','kbbbbbbbkk','.kbbbbbk.k','..kkkkk...','..........','..........'],
 flowers:['...kkk....','..kpppk...','..kpypk...','..kpppk...','...kgk.kk.','.kk.gkkggk','kggkgk.kk.','.kkkgk....','...kgk....','..kkkkk...'],
 map:['...kkkk...','..krrrrk..','.krrwwrrk.','.krwwwwrk.','.krrwwrrk.','..krrrrk..','...krrk...','....kk....','..kkkkkk..','..........'],
 tree:['...kkkk...','..kggggk..','.kggGgggk.','.kgggggGk.','.kgGgggGk.','..kgggGk..','...kNNk...','....kNk...','...kNNk...','..kkkkkk..'],
};
const ICON_CACHE={};
function iconCanvas(name,recol){
 const rows=ICONS[name]||ICONS.star;const w=rows[0].length,h=rows.length;const[c,g]=mkc(w,h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const ch=rows[y][x];if(ch==='.')continue;let col=IP[ch];if(recol&&recol[ch])col=recol[ch];if(!col)continue;g.fillStyle=col;g.fillRect(x,y,1,1);}
 return c;
}
function iconURL(name,recol){const k=name+(recol?JSON.stringify(recol):'');if(!ICON_CACHE[k])ICON_CACHE[k]=iconCanvas(name,recol).toDataURL();return ICON_CACHE[k];}
function ico(name,size,cls,recol){return `<img class="ico ${cls||''}" alt="" src="${iconURL(name,recol)}" width="${size||20}" height="${size||20}">`;}

// ---------- characters ----------
function simColors(a){
 const sk=SKINS[a.skin]!=null?SKINS[a.skin]:(typeof a.skin==='string'?a.skin:SKINS[1]);
 return{sk,skD:shade(sk,-.16),skL:shade(sk,.3),h:a.hairC,hD:shade(a.hairC,-.32),hL:shade(a.hairC,.3),t:a.top,tD:shade(a.top,-.22),tL:shade(a.top,.18),
  b:a.bot,bD:shade(a.bot,-.25),sh:a.shoes,shD:shade(a.shoes,-.32),style:a.hair,topS:a.topS,botS:a.botS,beard:a.beard,mouth:mix(sk,'#7a2626',.55),blush:mix(sk,'#ff6b6b',.32)};
}
function poseSpec(p,f){
 switch(p){
  case 'walk':case 'run':return{legs:f===1?'w1':f===3?'w3':'stand',arms:f===1?'swing1':f===3?'swing3':'down',by:(f===1||f===3)?-1:0};
  case 'use':case 'cook':case 'stargaze':case 'warm':return{legs:'stand',arms:f?'fwd2':'fwd'};
  case 'eat':return{legs:'stand',arms:f?'mouth':'hold',prop:'plate'};
  case 'sitEat':return{legs:'sit',arms:f?'mouth':'hold',by:2,prop:'plate'};
  case 'sit':case 'watch':case 'toilet':return{legs:'sit',arms:'down',by:2};
  case 'doze':case 'passout':return{legs:'sit',arms:'down',by:2,eyes:'closed'};
  case 'read':return{legs:'sit',arms:'fwd',by:2,prop:'book'};
  case 'readStand':return{legs:'stand',arms:'fwd',prop:'book'};
  case 'type':return{legs:'sit',arms:f?'type1':'type0',by:2,chair:1};
  case 'sitChess':return{legs:'sit',arms:f?'fwd2':'down',by:2,chair:1};
  case 'shower':return{legs:'stand',arms:f?'wash1':'wash0',eyes:'closed'};
  case 'dance':return{legs:f%2?'w1':'w3',arms:f%2?'upL':'upR',by:f%2?-1:0};
  case 'exercise':return{legs:f?'spread':'stand',arms:f?'up':'down',by:f?-1:0};
  case 'lift':return{legs:'stand',arms:f?'curl1':'curl0',prop:'dumbbell'};
  case 'guitar':return{legs:'stand',arms:f?'strum1':'strum0',prop:'guitar'};
  case 'paint':return{legs:'stand',arms:f?'paint1':'paint0',prop:'brush'};
  case 'talk':return{legs:'stand',arms:f?'gest':'down'};
  case 'phone':return{legs:'stand',arms:'ear',prop:'phone'};
  case 'garden':return{legs:'crouch',arms:f?'fwd2':'fwd',by:3};
  case 'water':return{legs:'stand',arms:'fwdR',prop:'can'};
  case 'cheer':return{legs:'stand',arms:'up',by:f?-2:0};
  case 'wave':return{legs:'stand',arms:f?'waveA':'waveB'};
  case 'hug':return{legs:'stand',arms:'hug'};
  case 'drink':return{legs:'stand',arms:f?'mouth':'fwdR',prop:'mug'};
  case 'sad':return{legs:'stand',arms:'down',by:1,face:'sad'};
  default:return{legs:'stand',arms:'down'};
 }
}
const POSE_FRAMES={walk:4,run:4,dance:4,use:2,cook:2,stargaze:1,warm:1,eat:2,sitEat:2,type:2,sitChess:2,shower:2,exercise:2,lift:2,guitar:2,paint:2,talk:2,garden:2,cheer:2,wave:2,drink:2};
const POSE_FPS={run:9,dance:4,use:3,cook:3,eat:1.5,sitEat:1.2,type:5,sitChess:.6,shower:2.5,exercise:3,lift:1.4,guitar:4,paint:2,talk:1.6,garden:1.5,cheer:3,wave:3,drink:1};

function hairFront(A,by){const H=A.h,L=A.hL,D=A.hD;
 switch(A.style){
  case 'short':F(H,5,3+by,8,1);F(H,4,4+by,10,2);F(L,6,4+by,3,1);F(H,4,6+by,1,2);F(H,13,6+by,1,2);F(H,5,6+by,3,1);F(D,12,6+by,1,1);break;
  case 'long':F(H,5,2+by,8,1);F(H,4,3+by,10,3);F(H,3,4+by,1,4);F(H,14,4+by,1,4);F(H,5,6+by,2,1);F(H,11,6+by,2,1);F(L,6,3+by,3,1);break;
  case 'bob':F(H,5,2+by,8,1);F(H,4,3+by,10,4);F(H,3,5+by,1,6);F(H,14,5+by,1,6);F(H,4,7+by,1,4);F(H,13,7+by,1,4);F(L,6,3+by,3,1);F(D,4,10+by,1,1);F(D,13,10+by,1,1);break;
  case 'ponytail':F(H,5,3+by,8,1);F(H,4,4+by,10,2);F(H,4,6+by,1,3);F(H,13,6+by,1,2);F(L,6,4+by,3,1);F(H,14,7+by,2,4);F(D,15,9+by,1,2);break;
  case 'bun':F(H,5,3+by,8,1);F(H,4,4+by,10,2);F(H,4,6+by,1,2);F(H,13,6+by,1,2);F(H,7,0+by,4,3);F(L,8,0+by,2,1);F(D,7,2+by,4,1);F(L,6,4+by,2,1);break;
  case 'curly':for(const x of [4,6,8,10,12])F(H,x,1+by,2,1);F(H,3,2+by,12,4);F(H,3,6+by,2,4);F(H,13,6+by,2,4);F(H,6,6+by,1,1);F(H,9,6+by,1,1);F(L,5,3+by,1,1);F(L,8,2+by,1,1);F(L,11,3+by,1,1);F(D,3,9+by,1,1);F(D,14,9+by,1,1);break;
  case 'spiky':F(H,5,1+by,1,2);F(H,8,0+by,2,3);F(H,12,1+by,1,2);F(H,4,3+by,10,3);F(H,4,6+by,1,1);F(H,13,6+by,1,1);F(L,6,3+by,2,1);F(L,9,1+by,1,1);break;
  case 'buzz':F(D,5,3+by,8,1);F(D,4,4+by,10,2);F(D,4,6+by,1,1);F(D,13,6+by,1,1);F(H,6,4+by,3,1);break;
  case 'bald':F(A.skL,6,5+by,2,1);break;
 }}
function hairBehindFront(A,by){if(A.style==='long'){F(A.h,3,6+by,2,10);F(A.h,13,6+by,2,10);F(A.hD,3,14+by,2,2);F(A.hD,13,14+by,2,2);}}
function hairBack(A,by){const H=A.h,L=A.hL,D=A.hD;
 switch(A.style){
  case 'short':F(H,5,3+by,8,1);F(H,4,4+by,10,8);F(L,6,4+by,3,1);F(D,4,11+by,10,1);break;
  case 'long':F(H,5,2+by,8,1);F(H,4,3+by,10,10);F(H,3,5+by,12,9);F(H,4,14+by,10,4);F(L,6,3+by,3,1);F(D,4,17+by,10,1);break;
  case 'bob':F(H,5,2+by,8,1);F(H,4,3+by,10,9);F(H,3,5+by,12,6);F(L,6,3+by,3,1);F(D,3,10+by,12,1);break;
  case 'ponytail':F(H,5,3+by,8,1);F(H,4,4+by,10,8);F(L,6,4+by,3,1);F('#e2453c',8,11+by,2,1);F(H,8,12+by,2,6);F(D,8,16+by,2,2);break;
  case 'bun':F(H,5,3+by,8,1);F(H,4,4+by,10,8);F(H,7,0+by,4,3);F(L,8,0+by,2,1);F(D,4,11+by,10,1);break;
  case 'curly':for(const x of [4,6,8,10,12])F(H,x,1+by,2,1);F(H,3,2+by,12,10);F(L,5,3+by,1,1);F(L,9,2+by,1,1);F(L,12,4+by,1,1);F(D,3,11+by,12,1);break;
  case 'spiky':F(H,5,1+by,1,2);F(H,8,0+by,2,3);F(H,12,1+by,1,2);F(H,4,3+by,10,9);F(L,6,3+by,2,1);break;
  case 'buzz':F(D,4,4+by,10,7);F(D,5,3+by,8,1);break;
 }}
function hairSide(A,by){const H=A.h,L=A.hL,D=A.hD;
 switch(A.style){
  case 'short':F(H,6,3+by,6,1);F(H,5,4+by,8,2);F(H,9,6+by,4,4);F(H,10,10+by,3,1);F(H,5,6+by,2,1);F(L,7,4+by,3,1);break;
  case 'long':F(H,6,3+by,6,1);F(H,5,4+by,8,2);F(H,9,6+by,4,4);F(H,10,10+by,3,8);F(H,5,6+by,2,1);F(L,7,4+by,3,1);F(D,12,12+by,1,6);break;
  case 'bob':F(H,6,3+by,6,1);F(H,5,4+by,8,3);F(H,9,7+by,4,5);F(H,13,6+by,1,5);F(L,7,4+by,3,1);break;
  case 'ponytail':F(H,6,3+by,6,1);F(H,5,4+by,8,2);F(H,9,6+by,4,4);F(H,5,6+by,2,1);F(L,7,4+by,3,1);F('#e2453c',13,6+by,1,1);F(H,13,7+by,2,2);F(H,14,9+by,2,4);F(D,15,11+by,1,2);break;
  case 'bun':F(H,6,3+by,6,1);F(H,5,4+by,8,2);F(H,9,6+by,4,4);F(H,5,6+by,2,1);F(H,11,1+by,3,3);F(L,12,1+by,1,1);break;
  case 'curly':F(H,5,2+by,8,1);F(H,4,3+by,10,3);F(H,8,6+by,6,6);F(H,13,5+by,1,5);F(H,5,6+by,1,1);F(L,6,3+by,1,1);F(L,10,4+by,1,1);break;
  case 'spiky':F(H,6,1+by,1,2);F(H,9,0+by,1,3);F(H,12,1+by,1,2);F(H,5,3+by,8,3);F(H,9,6+by,4,3);F(L,7,3+by,2,1);break;
  case 'buzz':F(D,6,3+by,6,1);F(D,5,4+by,8,2);F(D,10,6+by,3,3);break;
  case 'bald':F(A.skL,7,5+by,2,1);break;
 }}
function armDownFB(A,x,by,len){const long=A.topS==='long',inner=x<9?0:1,y0=14+by;
 if(long){F(A.t,x,y0,2,len-1);F(A.tD,x+inner,y0,1,len-1);F(A.sk,x,y0+len-1,2,1);}else{F(A.t,x,y0,2,3);F(A.sk,x,y0+3,2,len-3);F(A.skD,x+inner,y0+3,1,len-3);}}
function armsFB(A,P,back,by){const a=P.arms,long=A.topS==='long',arm=long?A.t:A.sk;
 const up=(x)=>{F(arm,x,8+by,2,6);F(A.t,x,12+by,2,2);F(A.sk,x,7+by,2,1);if(long)F(A.sk,x,7+by,2,1);};
 switch(a){
  case 'down':armDownFB(A,3,by,7);armDownFB(A,13,by,7);break;
  case 'swing1':armDownFB(A,3,by,6);armDownFB(A,13,by,7);break;
  case 'swing3':armDownFB(A,3,by,7);armDownFB(A,13,by,6);break;
  case 'fwd':case 'fwd2':case 'hold':{const d=a==='fwd2'?-1:0;F(A.t,3,14+by,2,3);F(A.t,13,14+by,2,3);if(!back){F(arm,4,17+by+d,2,2);F(arm,12,17+by+d,2,2);F(A.sk,6,18+by+d,2,2);F(A.sk,10,18+by+d,2,2);}else{F(arm,4,17+by,1,2);F(arm,13,17+by,1,2);}break;}
  case 'up':up(2);up(14);break;
  case 'upL':up(2);armDownFB(A,13,by,7);break;
  case 'upR':armDownFB(A,3,by,7);up(14);break;
  case 'waveA':case 'waveB':armDownFB(A,3,by,7);{const x=a==='waveA'?14:15;F(arm,x,9+by,2,5);F(A.t,14,12+by,2,2);F(A.sk,x,7+by,2,2);}break;
  case 'wash0':case 'wash1':{const d=a==='wash1'?1:0;F(arm,3,9+by,2,5);F(arm,13,9+by,2,5);F(A.sk,4+d,5+by,2,2);F(A.sk,12-d,5+by,2,2);F(A.t,3,13+by,2,2);F(A.t,13,13+by,2,2);break;}
  case 'ear':armDownFB(A,3,by,7);F(A.t,13,14+by,2,2);F(arm,13,10+by,2,4);F(A.sk,12,9+by,2,2);break;
  case 'mouth':F(A.t,3,14+by,2,3);F(arm,4,17+by,2,2);F(A.sk,5,18+by,2,2);F(A.t,13,14+by,2,2);F(arm,12,13+by,2,2);if(!back)F(A.sk,10,11+by,2,2);break;
  case 'strum0':case 'strum1':F(A.t,3,14+by,2,2);F(arm,2,16+by,2,2);F(A.sk,1,16+by,2,2);F(A.t,13,14+by,2,3);F(arm,11,17+by,2,2);F(A.sk,10,(a==='strum1'?17:18)+by,2,2);break;
  case 'curl0':armDownFB(A,3,by,7);armDownFB(A,13,by,7);break;
  case 'curl1':F(A.t,3,14+by,2,3);F(A.t,13,14+by,2,3);F(A.sk,3,15+by,2,2);F(A.sk,13,15+by,2,2);break;
  case 'paint0':case 'paint1':armDownFB(A,3,by,7);F(A.t,13,13+by,2,3);F(arm,14,11+by,2,3);F(A.sk,14,(a==='paint1'?10:9)+by,2,2);break;
  case 'type0':case 'type1':F(A.t,3,14+by,2,4);F(A.t,13,14+by+(a==='type1'?1:0),2,4);break;
  case 'gest':armDownFB(A,3,by,7);F(A.t,13,14+by,2,2);F(arm,14,15+by,2,2);F(A.sk,15,13+by,2,2);break;
  case 'hug':F(A.t,2,14+by,3,2);F(arm,1,16+by,2,2);F(A.sk,1,18+by,2,1);F(A.t,13,14+by,3,2);F(arm,15,16+by,2,2);F(A.sk,15,18+by,2,1);break;
  case 'fwdR':armDownFB(A,3,by,7);F(A.t,13,14+by,2,3);F(arm,13,17+by,2,2);F(A.sk,13,19+by,2,1);break;
  default:armDownFB(A,3,by,7);armDownFB(A,13,by,7);
 }}
function legsFB(A,P,back){const L=P.legs,bS=A.botS;
 if(L==='sit'){if(back)return;F(A.b,5,23,8,2);F(A.bD,5,24,8,1);
  if(bS==='skirt'){F(A.b,4,22,10,2);F(A.sk,6,25,2,1);F(A.sk,10,25,2,1);}else if(bS==='shorts'){F(A.sk,6,25,2,1);F(A.sk,10,25,2,1);}else{F(A.b,6,25,2,1);F(A.b,10,25,2,1);}
  F(A.sh,6,26,2,2);F(A.sh,10,26,2,2);F(A.shD,6,27,2,1);F(A.shD,10,27,2,1);return;}
 if(L==='crouch'){F(A.b,5,22,8,2);F(A.bD,5,23,8,1);F(A.sh,5,24,3,2);F(A.sh,10,24,3,2);F(A.shD,5,25,3,1);F(A.shD,10,25,3,1);return;}
 const lUp=L==='w3'?1:0,rUp=L==='w1'?1:0,sp=L==='spread';
 const leg=(x,up)=>{const top=21,bot=25-up;
  if(bS==='shorts'){F(A.b,x,top,3,2);F(A.sk,x,top+2,3,bot-top-1);F(A.skD,x+2,top+2,1,bot-top-1);}
  else if(bS==='skirt'){F(A.sk,x,top+2,3,bot-top-1);F(A.skD,x+2,top+2,1,bot-top-1);}
  else{F(A.b,x,top,3,bot-top+1);F(A.bD,x+2,top,1,bot-top+1);}
  F(A.sh,x,bot+1,3,2);F(A.shD,x,bot+2,3,1);};
 leg(sp?5:6,lUp);leg(sp?10:9,rUp);
 if(bS==='skirt'){F(A.b,5,20,8,2);F(A.b,4,22,10,1);F(A.bD,4,22,10,1);}}
function propsFB(A,P,back,by,stage){const p=P.prop;if(!p)return;
 if(stage===0){if(p==='guitar'&&!back){F('#c8742d',8,17+by,6,5);F('#a85e22',8,21+by,6,1);F('#e09a55',9,17+by,4,1);F('#3b2a22',10,19+by,2,2);
   for(const[x,y]of[[7,17],[6,16],[5,16],[4,15],[3,15]])F('#6b4423',x,y+by,1,1);F('#3b2a22',1,14+by,2,2);}return;}
 if(back){if(p==='guitar'){F('#6b4423',2,14+by,2,2);F('#c8742d',13,17+by,2,4);}return;}
 switch(p){
  case 'plate':F('#ffffff',3,19+by,6,1);F('#e6e2da',4,20+by,4,1);F(A.food||'#e8b25c',4,18+by,4,1);break;
  case 'book':F('#4f7fd6',6,16+by,6,4);F('#2e5aa8',8,16+by,2,4);F('#f7f4ee',6,15+by,6,1);break;
  case 'phone':F('#2b2e35',12,8+by,2,3);break;
  case 'mug':F('#ffffff',13,18+by,2,2);F('#d9d4cc',14,19+by,1,1);break;
  case 'can':F('#7aa58f',14,18+by,3,3);F('#5f8a74',16,17+by,2,1);F('#9fc3b0',14,18+by,3,1);break;
  case 'brush':F('#6b4423',15,7+by,1,3);F('#e2453c',15,6+by,1,1);break;
  case 'dumbbell':if(P.arms==='curl1'){F('#4a4f57',2,14+by,3,2);F('#4a4f57',13,14+by,3,2);}else{F('#4a4f57',2,21+by,3,2);F('#4a4f57',13,21+by,3,2);}break;
 }}
function faceFB(A,face,by){const ey=8+by;
 if(face==='closed'||face==='blink'){F(EYE,5,ey+1,2,1);F(EYE,11,ey+1,2,1);}else{F(EYE,6,ey,1,2);F(EYE,11,ey,1,2);}
 F(A.blush,5,ey+2,1,1);F(A.blush,12,ey+2,1,1);
 if(face==='happy'){F(A.mouth,8,11+by,2,1);F(A.mouth,7,10+by,1,1);F(A.mouth,10,10+by,1,1);}
 else if(face==='sad'){F(A.mouth,8,10+by,2,1);F(A.mouth,7,11+by,1,1);F(A.mouth,10,11+by,1,1);}
 else F(A.mouth,8,11+by,2,1);}
function drawFB(A,P,face,back){const by=P.by||0;
 if(P.chair&&!back){F(WOOD,4,9+by,10,2);F(WOODL,4,9+by,10,1);F(WOOD,4,11+by,1,11);F(WOOD,13,11+by,1,11);F(WOODL,4,22,10,2);F(WOODD,4,24,1,4);F(WOODD,13,24,1,4);}
 if(!back)hairBehindFront(A,by);
 legsFB(A,P,back);
 F(A.t,5,14+by,8,7);F(A.tD,11,14+by,2,7);F(A.tL,5,14+by,1,6);
 if(!back){F(A.sk,8,14+by,2,1);F(A.tD,5,20+by,8,1);}else F(A.tD,6,14+by,6,1);
 propsFB(A,P,back,by,0);
 armsFB(A,P,back,by);
 F(A.sk,5,4+by,8,10);F(A.sk,4,5+by,10,8);F(A.skD,13,5+by,1,8);F(A.skD,5,13+by,8,1);
 if(back){if(['short','buzz','bald','spiky','ponytail','bun'].includes(A.style)){F(A.sk,3,8+by,1,2);F(A.sk,14,8+by,1,2);}hairBack(A,by);}
 else{faceFB(A,face,by);hairFront(A,by);
  if(A.beard){const H=A.hD;F(H,4,9+by,1,3);F(H,13,9+by,1,3);F(H,5,11+by,8,2);F(H,7,10+by,4,1);F(A.h,6,12+by,6,1);}}
 propsFB(A,P,back,by,1);
 if(P.chair&&back){F(WOOD,4,19,10,2);F(WOODL,4,19,10,1);for(const x of[5,8,11])F(WOOD,x,21,2,4);F(WOODL,4,25,10,1);F(WOODD,4,26,1,2);F(WOODD,13,26,1,2);}
}
function armSide(A,P,by,far){const a=P.arms,long=A.topS==='long',col=far?A.tD:A.t,sk=far?A.skD:A.sk,arm=long?col:sk;
 let dx=0;if(a==='swing1')dx=far?1:-1;if(a==='swing3')dx=far?-1:1;
 if(far||['down','swing1','swing3','gest','curl0','type0','type1'].includes(a)){const x=8+dx+(far?1:0);if(long){F(col,x,14+by,2,6);F(sk,x,20+by,2,1);}else{F(col,x,14+by,2,3);F(sk,x,17+by,2,4);}return;}
 if(['up','upL','upR','wash0','wash1','waveA','waveB'].includes(a)){F(arm,8,9+by,2,5);F(col,8,13+by,2,2);F(sk,8,7+by,2,2);return;}
 if(a==='ear'){F(col,8,14+by,2,2);F(arm,7,11+by,2,3);F(sk,6,10+by,2,2);return;}
 if(a==='mouth'){F(col,8,14+by,2,2);F(arm,6,13+by,2,2);F(sk,5,11+by,2,2);return;}
 if(a==='hug'){F(col,8,14+by,2,2);F(arm,4,16+by,4,2);F(sk,2,16+by,2,2);return;}
 if(a==='curl1'){F(col,8,14+by,2,3);F(sk,7,13+by,2,3);return;}
 const d=a==='fwd2'||a==='strum1'||a==='paint1'?-1:0;F(col,8,14+by,2,3);F(arm,6,17+by+d,3,2);F(sk,4,17+by+d,2,2);}
function legsSide(A,P){const L=P.legs,bS=A.botS;
 if(L==='crouch'){F(A.b,5,22,7,2);F(A.bD,5,23,7,1);F(A.sh,4,24,4,2);F(A.shD,8,24,3,2);return;}
 if(L==='sit'){F(A.b,4,22,7,3);F(A.bD,4,24,7,1);F(bS==='pants'?A.b:A.sk,4,25,2,1);F(A.sh,3,26,4,2);return;}
 const draw=(x0,x1,front)=>{const lo=bS==='pants'?(front?A.b:A.bD):(front?A.sk:A.skD),hi=bS==='skirt'?(front?A.sk:A.skD):(front?A.b:A.bD);
  F(hi,x0,21,3,3);F(lo,x1,24,3,2);F(front?A.sh:A.shD,x1-1,26,4,2);};
 if(L==='w1'||L==='spread'){draw(8,9,false);draw(6,5,true);}else if(L==='w3'){draw(6,5,false);draw(8,9,true);}else{draw(7,8,false);draw(7,7,true);}
 if(bS==='skirt'){F(A.b,5,20,8,3);F(A.bD,5,22,8,1);}}
function drawSide(A,P,face){const by=P.by||0;
 armSide(A,P,by,true);legsSide(A,P);
 F(A.t,6,14+by,6,7);F(A.tD,10,14+by,2,7);F(A.tL,6,14+by,1,6);
 F(A.sk,6,4+by,6,10);F(A.sk,5,5+by,8,8);F(A.skD,12,5+by,1,8);F(A.skD,6,13+by,6,1);F(A.sk,4,9+by,1,1);
 if(face==='closed'||face==='blink')F(EYE,5,9+by,2,1);else F(EYE,6,8+by,1,2);
 F(A.blush,6,10+by,1,1);if(face==='happy'){F(A.mouth,5,11+by,2,1);}else if(face==='sad')F(A.mouth,5,12+by,2,1);else F(A.mouth,5,11+by,1,1);
 hairSide(A,by);
 if(['short','buzz','bald','spiky','ponytail','bun'].includes(A.style))F(A.skD,9,8+by,1,2);
 if(A.beard){F(A.hD,6,10+by,5,3);F(A.hD,9,8+by,2,2);F(A.h,5,11+by,2,1);}
 if(P.prop==='guitar'){F('#c8742d',3,17+by,6,5);F('#3b2a22',5,19+by,2,1);F('#6b4423',8,15+by,6,1);}
 armSide(A,P,by,false);
 if(P.prop==='book'){F('#4f7fd6',3,16+by,3,4);F('#f7f4ee',2,16+by,1,4);}
 if(P.prop==='plate'){F('#ffffff',2,19+by,5,1);F(A.food||'#e8b25c',3,18+by,3,1);}
 if(P.prop==='mug'){F('#ffffff',3,17+by,2,2);}
 if(P.prop==='can'){F('#7aa58f',1,18+by,3,3);F('#5f8a74',0,17+by,1,1);}
 if(P.prop==='phone')F('#2b2e35',6,9+by,2,3);
 if(P.prop==='dumbbell')F('#4a4f57',P.arms==='curl1'?6:7,P.arms==='curl1'?13+by:21+by,3,2);
 if(P.prop==='brush')F('#6b4423',4,14+by,1,3);
}
const SIM_SPR=new Map();
function simSprite(s,dir,pose,f,face){
 const key=s.appKey+'|'+dir+'|'+pose+'|'+f+'|'+face;let c=SIM_SPR.get(key);if(c)return c;
 const A=s._cols||(s._cols=simColors(s.app));const P=poseSpec(pose,f);if(P.eyes==='closed')face='closed';if(P.face&&face!=='closed'&&face!=='blink')face=P.face;
 if(pose==='sleep'||pose==='bath'||pose==='lieAwake'){c=lyingSprite(A,pose==='sleep'?'closed':face);SIM_SPR.set(key,c);return c;}
 let cc,g;[cc,g]=mkc(18,30);_g=g;
 if(dir==='left'||dir==='right')drawSide(A,P,face);else drawFB(A,P,face,dir==='up');
 outline(cc);
 if(dir==='right'){const[c2,g2]=mkc(18,30);g2.translate(18,0);g2.scale(-1,1);g2.drawImage(cc,0,0);cc=c2;}
 if(SIM_SPR.size>4000)SIM_SPR.clear();SIM_SPR.set(key,cc);return cc;
}
function lyingSprite(A,face){const[c,g]=mkc(18,20);_g=g;const by=-1;
 F(A.t,4,13,10,5);F(A.tD,11,13,3,5);F(A.t,2,13,2,4);F(A.t,14,13,2,4);
 F(A.sk,5,4+by,8,10);F(A.sk,4,5+by,10,8);F(A.skD,13,5+by,1,8);
 faceFB(A,face,by);hairFront(A,by);hairBehindFront(A,by);
 if(A.beard){F(A.hD,5,11+by,8,2);F(A.hD,7,10+by,4,1);}
 outline(c);return c;}
function portrait(s,size){const sp=simSprite(s,'down','idle',0,'happy');const[c,g]=mkc(18,18);g.drawImage(sp,0,0,18,18,0,0,18,18);return c;}

// ---------- object sprites ----------
const OBJ_SPR=new Map();
function sprBuild(w,h,ext,pad,fn,noOutline){const[c,g]=mkc(w*T+2+pad*2,h*T+ext+2);_g=g;g.save();g.translate(1+pad,1+ext);fn();g.restore();if(!noOutline)outline(c);return{c,ox:-1-pad,oy:-ext-1};}
function bookColors(seed){const r=mulberry(seed),cols=['#d9603b','#4f7fd6','#6fa35a','#e2a53a','#8e5ba8','#3e9e9a','#c95b7d','#f2efe6','#2f4a7a'];return()=>cols[Math.floor(r()*cols.length)];}
const OA={
 fridge:{ext:14,base(o){const lux=o.type==='fridge_lux',b=lux?'#c9d1d8':APP,l=lux?'#e4e9ed':APPL,s=lux?'#a9b3bc':APPS;
  F(b,1,-13,14,28);F(l,1,-13,14,3);F(s,13,-10,2,25);F(APPD,2,13,12,1);
  if(lux){F(s,7,-10,1,17);F(APPD,1,7,14,1);F(STEEL,5,-6,1,6);F(STEEL,9,-6,1,6);F('#5a6a7a',2,-8,3,4);F('#9fd3f0',3,-7,1,2);F(STEEL,4,10,8,1);}
  else{F(APPD,1,-3,14,1);F(STEEL,3,-9,1,4);F(STEEL,3,0,1,6);F('#f4d35e',8,-7,3,3);F('#e26d5a',10,2,2,2);F('#6cbf4a',6,5,2,2);}}},
 fridge_lux:null,
 stove:{ext:6,base(o){const pro=o.type==='stove_pro',body=pro?'#c9d1d8':'#f1efe9',sd=pro?'#a9b3bc':'#d9d4c9';
  F(body,1,-5,14,20);F(sd,13,-3,2,18);F(DARK,1,-5,14,7);F('#2b2e35',1,1,14,1);
  const bz=pro?[[2,-4],[6,-4],[10,-4],[2,-1],[6,-1],[10,-1]]:[[3,-4],[9,-4],[3,-1],[9,-1]];
  for(const[x,y]of bz){F('#5b606b',x,y,3,2);F('#7a8290',x+1,y,1,1);}
  F(sd,1,-6,14,2);for(let i=0;i<4;i++)F(pro?'#e2453c':'#3a3d44',3+i*3,-6,1,1);
  F(pro?'#b8c2cc':'#e3ded3',2,4,12,9);F('#2b2d33',4,6,8,4);F(STEEL,3,3,10,1);F('#555555',2,14,2,1);F('#555555',12,14,2,1);}},
 stove_pro:null,
 counter:{ext:9,base(o){const top='#d9b38c',topD='#b88f66',cab='#7fa7b5',cabD='#5f8796';
  F(top,0,-4,16,7);F(shade(top,.18),0,-4,16,1);F(topD,0,3,16,1);
  F(cab,0,4,16,10);F(cabD,0,4,16,1);F(cabD,8,5,1,8);F('#e9d9a8',6,8,1,1);F('#e9d9a8',10,8,1,1);F('#3a3d44',1,14,14,1);
  if(o.type==='sink_k'){F('#aab4bd',3,-3,10,4);F('#7d8994',4,-2,8,2);F(STEEL,7,-8,2,5);F(STEEL,7,-9,4,1);F(STEEL,10,-8,1,2);}
  if(o.type==='coffee'){F('#2f2b2e',4,-9,8,8);F('#4a4448',5,-8,6,3);F('#ff4d4d',10,-8,1,1);F('#a8d0e6',6,-4,4,3);F('#5a3a22',6,-2,4,1);F('#ffffff',12,-3,2,2);}}},
 sink_k:null,coffee:null,
 trash:{ext:4,base(){F('#7b8794',4,-3,8,17);F('#95a1ae',3,-4,10,2);F('#5f6b78',10,-2,2,15);F('#5f6b78',6,0,1,12);F('#5f6b78',9,0,1,12);}},
 toilet:{ext:6,base(o){const lux=o.type==='toilet_lux',p='#f3f6f8',pd='#d9e1e7';
  F(p,3,-6,10,7);F('#ffffff',2,-6,12,2);F(pd,11,-4,2,5);F(lux?'#c9a227':STEEL,3,-3,2,1);
  F(p,3,1,10,4);F(lux?'#a0703f':'#e9eef2',3,1,10,2);F('#cfe3ee',5,3,6,2);},
  top(o){const lux=o.type==='toilet_lux',p='#f3f6f8',pd='#d9e1e7';F(p,3,5,10,4);F(p,4,9,8,1);F(lux?'#a0703f':'#e9eef2',3,5,10,1);F(pd,5,10,6,3);F(pd,11,6,2,3);}},
 toilet_lux:null,
 shower:{ext:18,base(){F('#dfeef0',0,-18,16,22);for(let y=-18;y<4;y+=4)F('#c4dde2',0,y,16,1);for(let x=0;x<16;x+=4)F('#c4dde2',x,-18,1,22);
  F('#cfd8dd',0,4,16,10);F('#b8c4ca',0,13,16,1);F('#8a97a3',7,9,2,1);F(STEEL,7,-18,1,3);F(STEEL,5,-16,5,2);F('#dfe7ec',6,-14,3,1);},
  top(){F('rgba(170,215,235,0.42)',1,-9,14,22);F('#b8c2cc',0,-10,16,1);F('#b8c2cc',0,-10,1,24);F('#b8c2cc',15,-10,1,24);F('#b8c2cc',0,13,16,1);
  F('rgba(255,255,255,0.7)',3,-7,1,6);F('rgba(255,255,255,0.7)',4,-8,1,2);F('rgba(255,255,255,0.5)',11,2,1,4);}},
 tub:{ext:7,base(){F('#f4f6f8',1,-4,30,16);F('#ffffff',1,-4,30,2);F('#dbe4ea',3,-2,26,8);F('#c9a227',2,-7,2,3);F('#c9a227',1,-5,4,1);},
  top(){F('#f4f6f8',1,5,30,7);F('#ffffff',1,5,30,1);F('#d9e1e7',1,10,30,2);F('#c9a227',3,12,2,2);F('#c9a227',27,12,2,2);}},
 sink_b:{ext:12,base(){F('#c9a227',3,-13,10,9);F('#a9d3e6',4,-12,8,7);F('#d6ecf5',5,-11,2,3);F('#e9e1d3',1,-2,14,16);F('#ffffff',1,-3,14,3);F('#cfe3ee',4,-2,8,2);F(STEEL,7,-4,2,2);F('#d4c9b6',8,2,1,10);F('#c9a227',6,6,1,1);F('#c9a227',10,6,1,1);F('#b8ab95',1,13,14,1);}},
 bed:{ext:5,base(o){const W2=o.def.w*16,wood=o.def.lux?'#6b4a33':WOOD;
  F(wood,0,-4,W2,8);F(shade(wood,.2),1,-4,W2-2,1);F(shade(wood,-.2),0,3,W2,1);
  if(o.def.lux){F('#e6d3b0',2,-3,W2-4,6);for(let x=4;x<W2-3;x+=4)F('#c9b48d',x,-1,1,1);F('#c9a227',0,-5,W2,1);}
  F('#f7f4ee',1,2,W2-2,26);F('#e7e2d8',W2-3,2,2,26);
  const pl=o.def.w===2?[[3,11],[18,11]]:[[3,10]];for(const[px,pw]of pl){F('#ffffff',px,3,pw,5);F('#e6e2da',px,7,pw,1);F('#f0ece4',px+pw-1,3,1,5);}
  F(wood,0,27,W2,4);F(shade(wood,-.22),0,30,W2,1);F(shade(wood,.15),0,27,W2,1);},
  top(o){const W2=o.def.w*16,col=o.def.cols[o.variant||0];F(col,1,10,W2-2,18);F(shade(col,.25),1,10,W2-2,2);F(shade(col,-.18),W2-3,12,2,16);F(shade(col,-.1),1,26,W2-2,2);
  for(let x=4;x<W2-3;x+=6)F(shade(col,.1),x,14,2,10);}},
 sofa:{ext:9,base(o){const W2=o.def.w*16,col=o.def.cols[o.variant||0],L=shade(col,.18),D=shade(col,-.2);
  if(!o.rot){F(col,0,-8,W2,11);F(L,1,-8,W2-2,2);for(let i=1;i<o.def.w;i++)F(D,i*16,-6,1,8);if(o.def.lux)for(let x=5;x<W2-4;x+=5)F(D,x,-4,1,1);
   for(let i=0;i<o.def.w;i++)F(L,(i?i*16:3),3,i===o.def.w-1?(i?13:10):16-(i?0:3),5);F(col,2,8,W2-4,4);F(D,2,11,W2-4,1);F(WOODD,2,12,2,2);F(WOODD,W2-4,12,2,2);}
  else{F(D,0,-6,W2,4);F(col,0,-4,W2,8);F(L,2,-4,W2-4,6);}},
  top(o){const W2=o.def.w*16,col=o.def.cols[o.variant||0],L=shade(col,.18),D=shade(col,-.2),DD=shade(col,-.34);
  if(!o.rot){F(col,0,-3,4,14);F(L,0,-3,4,2);F(D,3,-1,1,12);F(col,W2-4,-3,4,14);F(L,W2-4,-3,4,2);F(D,W2-4,-1,1,12);}
  else{F(col,0,3,W2,10);F(L,0,3,W2,2);F(D,0,11,W2,2);F(DD,0,12,W2,1);F(col,0,-5,3,15);F(L,0,-5,3,1);F(col,W2-3,-5,3,15);F(L,W2-3,-5,3,1);F(WOODD,2,13,2,1);F(WOODD,W2-4,13,2,1);if(o.def.lux)for(let x=5;x<W2-4;x+=5)F(D,x,7,1,1);}}},
 chair_dining:{ext:12,base(o){if(!o.rot){F(WOOD,2,-11,12,3);F(WOODL,2,-11,12,1);for(const x of[3,7,11])F(WOOD,x,-8,2,8);F(WOODL,2,0,12,4);F(WOOD,2,3,12,1);F(WOODD,2,4,2,9);F(WOODD,12,4,2,9);}
  else{F(WOODD,2,-1,2,6);F(WOODD,12,-1,2,6);F(WOODL,2,-3,12,4);F(WOOD,2,0,12,1);}},
  top(o){if(o.rot){F(WOOD,2,1,12,3);F(WOODL,2,1,12,1);for(const x of[3,7,11])F(WOOD,x,4,2,6);F(WOODD,2,9,2,4);F(WOODD,12,9,2,4);}}},
 table:{ext:3,base(o){const W2=o.def.w*16;F(WOOD,0,-3,W2,10);F(WOODL,0,-3,W2,2);F(shade(WOOD,.08),1,1,W2-2,1);F(WOODD,0,7,W2,2);F(WOODDD,2,9,3,5);F(WOODDD,W2-5,9,3,5);F(WOODD,3,9,1,5);}},
 tv:{ext:15,base(o){if(o.type==='tv_big'){F(WOOD,0,4,32,10);F(WOODL,0,4,32,1);F(WOODD,10,5,1,8);F(WOODD,21,5,1,8);F(WOODD,0,13,32,1);F('#1b1d22',1,-12,30,16);F('#2c2f36',1,-12,30,1);F('#111722',2,-11,28,13);F('#3a3f49',14,3,4,1);return;}
  F(WOOD,0,4,16,10);F(WOODL,0,4,16,1);F(WOODD,8,5,1,8);F(WOODD,0,13,16,1);F('#e9d9a8',6,9,1,1);F('#e9d9a8',10,9,1,1);
  F('#3b3f47',1,-10,14,14);F('#4c515b',1,-10,14,1);F('#2a2d33',1,3,14,1);F('#1d2430',2,-9,10,10);F('#c9a227',13,-7,1,1);F('#c9a227',13,-4,1,1);
  F('#555555',5,-13,1,3);F('#555555',4,-14,1,1);F('#555555',10,-13,1,3);F('#555555',11,-14,1,1);}},
 pc:{ext:11,base(o){const lux=o.type==='pc_lux';F(WOOD,0,-1,16,4);F(WOODL,0,-1,16,1);F(WOODD,0,3,16,3);F(WOODD,1,6,2,8);F(WOODD,13,6,2,8);
  F('#2b2e35',2,-11,12,9);F('#1d2533',3,-10,10,7);F('#2b2e35',7,-2,2,1);F('#d9dde2',4,0,8,2);F('#b9bec6',4,1,8,1);
  if(lux){F('#2b2e35',13,-6,3,7);F('#ff5fa8',14,-5,1,1);F('#46e0ff',14,-3,1,1);}else F('#ffffff',13,-1,2,2);}},
 stereo:{ext:7,base(){F(WOOD,1,2,14,12);F(WOODD,1,13,14,1);F('#2b2e35',1,-4,14,7);F('#2b2e35',3,-6,10,1);F('#2b2e35',3,-6,1,2);F('#2b2e35',12,-6,1,2);F('#5b606b',2,-3,4,4);F('#5b606b',10,-3,4,4);F('#3a3d44',3,-2,2,2);F('#3a3d44',11,-2,2,2);F('#9fc9dd',7,-3,2,2);F('#e2453c',7,0,1,1);}},
 bookshelf:{ext:19,base(o){F(WOOD,0,-18,16,32);F(WOODL,0,-18,16,1);F(WOODDD,2,-16,12,28);for(const y of[-10,-2,6])F(WOOD,2,y,12,2);F(WOODD,0,13,16,1);
  const bc=bookColors(hash(o.x,o.y,7)*1e9|0);for(const y0 of[-16,-8,0]){let x=2;while(x<14){const bw=1+(hash(x,y0,o.x)*2|0),bh=4+(hash(y0,x,o.y)*3|0);if(x+bw>14)break;F(bc(),x,y0+6-bh,bw,bh);x+=bw;}}
  F(WOODD,0,-18,1,32);F(WOODD,15,-18,1,32);}},
 chess:{ext:3,base(){F('#e9e1d3',1,-2,14,9);for(let y=0;y<3;y++)for(let x=0;x<5;x++)if((x+y)%2)F('#7a5238',3+x*2,-1+y*2,2,2);else F('#f4efe6',3+x*2,-1+y*2,2,2);F('#2b2230',4,-3,1,2);F('#ffffff',10,3,1,2);F('#2b2230',8,-2,1,2);F('#c9b48d',1,6,14,1);F(WOODD,6,7,4,6);F(WOODD,3,12,10,2);}},
 easel:{ext:20,base(){F(WOOD,2,-4,2,18);F(WOOD,12,-4,2,18);F(WOODD,7,-2,2,14);F(WOOD,7,-19,2,3);F('#f7f4ee',1,-17,14,12);F('#e6e2da',1,-6,14,1);F(WOOD,0,-5,16,2);F('#e2453c',3,-5,1,1);F('#4f86d6',6,-5,1,1);F('#f6d04a',9,-5,1,1);}},
 guitar:{ext:14,base(o){F('#2b2e35',5,10,6,2);F('#2b2e35',4,12,1,2);F('#2b2e35',11,12,1,2);F('#2b2e35',7,-2,2,12);
  if(!(o.state&&o.state.out)){F('#c8742d',4,-1,8,10);F('#e09a55',5,-1,6,1);F('#a85e22',4,8,8,1);F('#3b2a22',7,2,2,2);F('#6b4423',7,-12,2,11);F('#3b2a22',6,-14,4,3);F('#c9a227',6,-13,1,1);F('#c9a227',9,-13,1,1);}}},
 treadmill:{ext:10,base(){F('#33363d',2,-2,12,15);F('#444852',3,-1,10,13);F('#8c97a3',1,-2,1,15);F('#8c97a3',14,-2,1,15);F('#2b2e35',2,-10,12,5);F('#62d26f',5,-9,6,2);F('#8c97a3',2,-6,1,5);F('#8c97a3',13,-6,1,5);F('#2b2e35',2,13,12,1);}},
 dumbbells:{ext:7,base(){F('#4a4f57',1,-3,14,2);F('#4a4f57',1,4,14,2);F('#3a3d44',1,-1,2,13);F('#3a3d44',13,-1,2,13);for(const x of[3,7,11]){F('#2b2e35',x,-6,2,3);F('#2b2e35',x,1,2,3);F('#b8c2cc',x+1,-5,1,1);}}},
 mirror:{ext:20,base(){F('#c9a227',3,-19,10,24);F('#e6c45a',3,-19,10,1);F('#a9d3e6',4,-18,8,21);F('#d6ecf5',5,-16,2,8);F('#c9e5f1',8,-6,2,6);F(WOOD,2,10,12,2);F(WOODD,4,5,2,5);F(WOODD,10,5,2,5);}},
 telescope:{ext:14,base(){F('#6b4423',4,0,1,13);F('#6b4423',11,0,1,13);F('#6b4423',8,-1,1,12);F('#c9a227',3,-9,4,4);F('#c9a227',6,-11,4,4);F('#c9a227',9,-13,4,3);F('#e6c45a',4,-9,8,1);F('#2b2e35',12,-13,2,2);}},
 lamp_floor:{ext:21,base(o){const on=o._on;F('#3b3f47',5,11,6,2);F('#3b3f47',7,-12,2,23);F(on?'#fff1bf':'#efe1bd',5,-20,6,1);F(on?'#ffe9a8':'#e8d6ad',4,-19,8,6);F(on?'#f5cf7a':'#cdb98c',4,-14,8,1);}},
 lamp_table:{ext:13,base(o){const on=o._on;F(WOOD,2,0,12,13);F(WOODL,2,0,12,1);F(WOODD,2,12,12,1);F('#7fa7b5',6,-4,4,4);F(on?'#ffe9a8':'#e8d6ad',4,-12,8,7);F(on?'#fff1bf':'#efe1bd',5,-13,6,1);F(on?'#f5cf7a':'#cdb98c',4,-6,8,1);}},
 woodstove:{ext:23,base(){F('#3d393c',6,-22,4,15);F('#4d484b',6,-22,1,15);F('#2d2a2c',2,-6,12,18);F('#3d393c',2,-8,12,3);F('#4d484b',2,-8,12,1);F('#1a1214',5,-2,6,6);F('#2d2a2c',3,12,2,2);F('#2d2a2c',11,12,2,2);F('#5a5558',4,6,8,1);}},
 lantern:{ext:15,base(o){const on=o._on;F('#3b3f47',7,-6,2,19);F('#3b3f47',5,-14,6,9);F('#2b2e35',4,-15,8,2);F(on?'#fff1bf':'#c9bb93',6,-12,4,5);F('#3b3f47',5,12,6,2);}},
 streetlamp:{ext:31,base(o){const on=o._on;F('#3b3f47',7,-26,2,39);F('#4d525c',7,-26,1,39);F('#3b3f47',4,-30,8,4);F('#2b2e35',3,-31,10,2);F(on?'#fff1bf':'#c9bb93',5,-27,6,2);F('#3b3f47',5,11,6,3);}},
 plant_s:{ext:7,base(){F('#c8693c',4,4,8,9);F('#d98252',3,3,10,2);F('#a8542e',10,5,2,8);const g=['#4f9e45','#6cbf4a','#3f8a35'];for(let i=0;i<14;i++){const a=i/14*Math.PI*2;F(g[i%3],8+Math.cos(a)*(3+i%3)|0,0+Math.sin(a)*3-2|0,2,1);}F('#6cbf4a',6,-5,1,5);F('#4f9e45',9,-6,1,6);F('#3f8a35',7,-3,3,4);}},
 plant_l:{ext:21,base(){F('#efe6d8',4,5,8,8);F('#ffffff',4,5,8,1);F('#d6cbb8',10,6,2,7);F('#6b4423',7,-6,2,11);const g=['#3f8a35','#4f9e45','#2f6f2a'];const L=[[3,-19],[9,-20],[1,-13],[10,-14],[5,-11],[2,-7],[11,-8],[6,-16]];L.forEach(([x,y],i)=>{F(g[i%3],x,y,5,4);F(g[(i+1)%3],x+1,y+1,3,2);F('#6cbf4a',x+1,y,2,1);});}},
 tank:{ext:13,base(){F(WOOD,0,2,32,12);F(WOODL,0,2,32,1);F(WOODD,0,13,32,1);F('#e8f6fb',1,-12,30,14);F('#4aa3c9',2,-9,28,10);F('#3a8bb0',2,-2,28,1);F('#e8d39a',2,-1,28,2);F('#3f9a5a',5,-7,1,6);F('#3f9a5a',6,-5,1,4);F('#3f9a5a',24,-8,1,7);F('#4fb36a',25,-6,1,5);F('#8a8f99',14,-2,4,1);F('#cfeaf5',2,-11,28,2);}},
 plot:{ext:2,base(o){const wet=o.state&&o.state.crop&&o.state.water>30;const c=wet?'#5e3d25':'#8a5a36',d=wet?'#4a2f1c':'#6e4529';F(c,1,2,14,12);F(shade(c,.12),1,2,14,1);F(d,2,5,12,1);F(d,2,9,12,1);F(d,1,13,14,1);}},
 tree:{ext:44,pad:12,base(o){F('#5e3c22',6,-10,4,22);F('#7a5230',6,-10,2,22);F('#4a2f1a',9,-6,1,18);F('#5e3c22',4,10,8,2);F('#4a2f1a',3,11,3,1);F('#4a2f1a',10,11,3,1);},
  top(o){const s=G.season,seed=hash(o.x,o.y,3);const pal=[['#8fd16a','#6fbd52','#b7e38a','#f4a9c4'],['#4f9e45','#3f8a35','#6fbd52','#2f6f2a'],['#e2732b','#c9472a','#f2b33d','#a8331f'],['#8a6a50','#6e5038','#a88a70','#ffffff']][s];
  if(s===3){F('#6e5038',7,-30,2,22);F('#6e5038',2,-24,6,1);F('#6e5038',9,-27,7,1);F('#6e5038',3,-34,2,6);F('#6e5038',12,-36,2,9);F('#6e5038',0,-20,3,1);F('#6e5038',13,-20,4,1);F('#ffffff',2,-25,6,1);F('#ffffff',9,-28,7,1);F('#ffffff',12,-37,2,1);F('#ffffff',3,-35,2,1);F('#eef3f8',0,-21,3,1);F('#eef3f8',13,-21,4,1);return;}
  const blobs=[[8,-26,12],[1,-20,8],[15,-20,8],[4,-33,8],[13,-32,8],[8,-16,9]];
  blobs.forEach(([x,y,r],i)=>{for(let yy=-r;yy<=r;yy++){const w=Math.floor(Math.sqrt(r*r-yy*yy));F(pal[1],x-w,y+yy,w*2+1,1);}});
  blobs.forEach(([x,y,r])=>{for(let yy=-r;yy<=r-2;yy++){const w=Math.floor(Math.sqrt((r-2)*(r-2)-yy*yy));if(w>0)F(pal[0],x-w-1,y+yy-1,w*2,1);}});
  for(let i=0;i<34;i++){const x=Math.floor(hash(i,7,seed*1e6|0)*30)-7,y=Math.floor(hash(i,9,seed*1e6|0)*32)-40;F(i%3?pal[2]:pal[3],x,y,i%4?1:2,1);}}},
 bush:{ext:7,base(){const s=G.season,c=[['#6fbd52','#8fd16a'],['#3f8a35','#4f9e45'],['#7a8a3a','#c9472a'],['#5a6e50','#ffffff']][s];for(let y=-6;y<=6;y++){const w=Math.floor(Math.sqrt(49-y*y));F(c[0],8-w,4+y-2,w*2,1);}for(let y=-4;y<=3;y++){const w=Math.floor(Math.sqrt(16-y*y));F(c[1],6-w,1+y-2,w*2,1);}if(s===0){F('#f4a9c4',5,-2,1,1);F('#f4a9c4',10,1,1,1);F('#ffffff',7,4,1,1);}}},
 flowers:{ext:5,base(){const s=G.season;F('#6b4a2f',1,6,14,8);F('#7d5838',1,6,14,1);if(s===3){F('#ffffff',1,5,14,2);return;}const cols=s===2?['#e2732b','#c9472a','#f2b33d']:['#e2453c','#f6d04a','#e27aa6','#ffffff','#8e5ba8'];for(let i=0;i<6;i++){const x=2+i*2+(i%2),y=-3+(i%3)*2;F('#3f8a35',x,y+2,1,5);F(cols[i%cols.length],x-1,y,3,2);F(shade(cols[i%cols.length],.4),x,y,1,1);}}},
 bench:{ext:8,base(){F('#2b2e35',1,6,2,8);F('#2b2e35',29,6,2,8);F(WOOD,0,-7,32,3);F(WOODL,0,-7,32,1);F(WOOD,0,-3,32,2);F('#2b2e35',2,-4,1,8);F('#2b2e35',29,-4,1,8);F(WOODL,0,1,32,3);F(WOOD,0,4,32,2);F(WOODD,0,5,32,1);}},
 grill:{ext:11,base(){F('#2b2e35',4,1,1,12);F('#2b2e35',11,1,1,12);F('#2b2e35',7,2,2,10);F('#2d2a2c',3,-6,10,7);F('#3d393c',4,-9,8,3);F('#4d484b',5,-9,6,1);F('#8a8f99',7,-10,2,1);F('#3a3d44',3,0,10,1);F('#1a1a1a',3,12,3,2);F('#1a1a1a',10,12,3,2);}},
 mailbox:{ext:13,base(o){F(WOOD,7,-4,2,17);F(WOODD,8,-4,1,17);F('#3f5f8f',3,-12,10,8);F('#5378b0',4,-13,8,1);F('#2e4870',3,-5,10,1);F('#e9e1d3',5,-10,1,1);if(o._flag){F('#e2453c',12,-16,1,6);F('#e2453c',13,-16,2,2);}else F('#e2453c',12,-11,3,1);}},
};
OA.fridge_lux=OA.fridge;OA.stove_pro=OA.stove;OA.sink_k=OA.counter;OA.coffee=OA.counter;OA.toilet_lux=OA.toilet;
OA.bed_single=OA.bed_double=OA.bed_lux=OA.bed;OA.chair_arm=OA.sofa_lux=OA.sofa;OA.table_dining=OA.table_end=OA.table;OA.tv_big=OA.tv;OA.pc_lux=OA.pc;
function counterLike(o){return o&&(o.type==='counter'||o.type==='sink_k'||o.type==='coffee');}
function objSprites(o){
 const A=OA[o.type];if(!A)return null;
 let st='';if(o.type==='lamp_floor'||o.type==='lamp_table'||o.type==='lantern'||o.type==='streetlamp'){o._on=lightsOn(o);st=o._on?'1':'0';}
 if(o.type==='mailbox'){o._flag=!!G.bills;st=o._flag?'1':'0';}
 if(o.type==='guitar')st=o.state&&o.state.out?'1':'0';
 if(o.type==='plot')st=(o.state&&o.state.crop&&o.state.water>30)?'1':'0';
 let cl=0,cr=0;if(counterLike(o)){cl=counterLike(objAt(o.x-1,o.y))?1:0;cr=counterLike(objAt(o.x+1,o.y))?1:0;st+=cl+''+cr;}
 if(o.type==='tree'||o.type==='bush'||o.type==='flowers')st+='s'+G.season;
 const key=o.type+'|'+(o.variant||0)+'|'+(o.rot||0)+'|'+st+'|'+(o.type==='bookshelf'?o.x+','+o.y:'')+(o.type==='tree'?o.x+','+o.y:'');
 let r=OBJ_SPR.get(key);if(r)return r;
 const d=o.def,pad=A.pad||0;r={base:sprBuild(d.w,d.h,A.ext,pad,()=>A.base(o))};
 if(cl){r.base.c.getContext('2d').clearRect(0,0,1,r.base.c.height);}if(cr){r.base.c.getContext('2d').clearRect(r.base.c.width-1,0,1,r.base.c.height);}
 if(A.top){r.top=sprBuild(d.w,d.h,A.ext,pad,()=>A.top(o));}
 if(OBJ_SPR.size>800)OBJ_SPR.clear();OBJ_SPR.set(key,r);return r;
}
function catalogThumb(type,variant){const d=CATALOG[type];const o={type,def:d,x:0,y:0,variant:variant||0,rot:0,state:{}};
 if(d.rug){const[c,g]=mkc(d.w*T,d.h*T);_g=g;drawRug(g,o,0,0);return c;}
 if(d.wall){const[c,g]=mkc(14,12);_g=g;drawWallDecor(g,o,0,0);return c;}
 const s=objSprites(o);if(!s)return mkc(16,16)[0];const[c,g]=mkc(s.base.c.width,s.base.c.height);g.drawImage(s.base.c,0,0);if(s.top)g.drawImage(s.top.c,0,0);return c;}

// ---------- rugs & wall decor ----------
function drawRug(g,o,px,py){_g=g;const d=o.def,W2=d.w*T,H2=d.h*T,col=d.cols[o.variant||0],L=shade(col,.35),D=shade(col,-.25),cr='#f2e6c8';
 F(D,px+1,py+1,W2-2,H2-2);F(col,px+2,py+2,W2-4,H2-4);F(cr,px+3,py+3,W2-6,1);F(cr,px+3,py+H2-4,W2-6,1);F(cr,px+3,py+3,1,H2-6);F(cr,px+W2-4,py+3,1,H2-6);
 if(d.w===3){const cx=px+W2/2,cy=py+H2/2;for(let y=-6;y<=6;y++){const w=6-Math.abs(y);F(y%2?L:cr,cx-w*2,cy+y,w*4,1);}F(D,cx-2,cy-1,4,2);}
 else for(let y=6;y<H2-6;y+=4)for(let x=6;x<W2-6;x+=4)F(((x+y)/4)%2?L:shade(col,.12),px+x,py+y,2,2);
 for(let y=2;y<H2-2;y+=2){F(cr,px,py+y,1,1);F(cr,px+W2-1,py+y,1,1);}}
function artPixels(g,art,x,y,w,h,reveal){_g=g;const r=mulberry(art.seed||1);const sky=art.sky||['#9fd3f0','#f4c9a6'];
 for(let i=0;i<h;i++)F(mix(sky[0],sky[1],i/h),x,y+i,w,1);
 if(art.sun)F('#fff1bf',x+Math.floor(r()*(w-3))+1,y+1,2,2);
 const hc=art.hill||'#6fa35a';for(let i=0;i<w;i++){const hy=Math.floor(h*.55+Math.sin(i*.9+art.seed)*1.5+r()*1.2);F(hc,x+i,y+hy,1,h-hy);}
 if(art.style===1){F(shade(hc,-.3),x+Math.floor(w*.6),y+Math.floor(h*.3),1,Math.floor(h*.4));F(shade(hc,-.2),x+Math.floor(w*.6)-1,y+Math.floor(h*.3),3,2);}
 if(art.style===2)for(let i=0;i<3;i++)F('#ffffff',x+Math.floor(r()*w),y+Math.floor(r()*h*.4),1,1);
 if(art.style===3){F(shade(hc,-.35),x,y+h-2,w,2);F('#e2453c',x+Math.floor(w/2),y+h-4,1,2);}
 if(reveal!=null&&reveal<1){g.clearRect(x+Math.floor(w*reveal),y,w,h);}}
function drawWallDecor(g,o,px,py){_g=g;
 if(o.type==='clock_wall'){F('#6b4423',px+3,py+1,8,8);F('#f7f4ee',px+4,py+2,6,6);F('#2b2230',px+7,py+3,1,3);F('#2b2230',px+7,py+5,2,1);F('#c9a227',px+3,py+1,8,1);return;}
 const art=o.type==='painting'?(o.state&&o.state.art)||{seed:3}:{seed:hash(o.x,o.y,1)*1000|0,sky:['#9fd3f0','#f9e2b8'],hill:'#6fa35a',sun:1,style:1};
 F('#c9a227',px+1,py,12,10);F('#e6c45a',px+1,py,12,1);F('#9a7a1a',px+1,py+9,12,1);artPixels(g,art,px+2,py+1,10,8);}
function randomArt(q){const skies=[['#9fd3f0','#f4c9a6'],['#f4a46a','#6a4a8a'],['#2a3a6a','#8e5ba8'],['#cfe8f0','#ffffff'],['#f9e2b8','#e27aa6'],['#4f86d6','#9fd3f0']];const hills=['#6fa35a','#3e9e9a','#a8743f','#2f4a7a','#8e5ba8','#e2732b'];
 return{seed:ri(1,99999),sky:pick(skies),hill:pick(hills),sun:chance(.5)?1:0,style:ri(0,3),q};}

// ---------- ground ----------
function seasonPal(){return[
 {g:['#7cc55a','#6db54d','#8fd46a'],t:'#5a9e3f',fl:['#ffffff','#ffd84a','#f59bc0'],fr:.12},
 {g:['#5fae45','#53a03c','#6fbd52'],t:'#468a33',fl:['#ffffff','#ffd84a'],fr:.06},
 {g:['#9cab48','#8d9c3e','#adbb57'],t:'#7f8a35',fl:['#e2732b','#c9472a','#f2b33d','#a8331f'],fr:.55,leaves:1},
 {g:['#eef3f8','#e2eaf2','#f8fbfd'],t:'#d3dfeb',fl:['#ffffff'],fr:.05,snow:1}][G.season];}
function tileFloor(g,type,x,y){_g=g;const px=x*T,py=y*T;
 switch(type){
  case 'grass':{const P=seasonPal();F(P.g[0],px,py,16,16);for(let i=0;i<16;i++){F(P.g[hash(x,y,i)<.5?1:2],px+(hash(x,y,i+50)*16|0),py+(hash(x,y,i+90)*16|0),1,1);}
   for(let k=0;k<3;k++)if(hash(x,y,7+k)<.5){const xx=px+(hash(x,y,20+k)*13|0),yy=py+(hash(x,y,30+k)*13|0);F(P.t,xx,yy,1,2);F(P.t,xx+2,yy,1,2);F(P.t,xx+1,yy+1,1,2);if(!P.snow)F(P.g[2],xx+1,yy,1,1);}
   if(hash(x,y,9)<P.fr){const xx=px+2+(hash(x,y,40)*11|0),yy=py+2+(hash(x,y,41)*11|0),c=P.fl[hash(x,y,42)*P.fl.length|0];if(P.leaves){F(c,xx,yy,2,2);F(shade(c,-.25),xx+1,yy+1,1,1);}else{F(c,xx,yy,1,1);if(hash(x,y,43)<.5)F(c,xx+3,yy+2,1,1);}}
   if(P.snow&&hash(x,y,44)<.4)F('#ffffff',px+(hash(x,y,45)*15|0),py+(hash(x,y,46)*15|0),1,1);break;}
  case 'path':{F('#a89c88',px,py,16,16);const pat=hash(x,y,3)<.5?[[1,1,8,6],[10,1,5,7],[1,8,6,7],[8,9,7,6]]:[[1,1,6,7],[8,1,7,5],[8,7,7,8],[1,9,6,6]];
   for(const[a,b,w,h]of pat){const c=hash(x+a,y+b,5)<.5?'#d5cab6':'#cbbfa9';F(c,px+a+1,py+b,w-2,h);F(c,px+a,py+b+1,w,h-2);F(shade(c,.12),px+a+1,py+b,w-2,1);F(shade(c,-.12),px+a+1,py+b+h-1,w-2,1);}
   if(G.season===3){F('#eef3f8',px,py,16,2);F('#eef3f8',px,py+14,4,2);}break;}
  case 'side':{F('#cfcac1',px,py,16,16);F('#b3ada3',px,py,16,1);F('#b3ada3',px,py,1,16);for(let i=0;i<6;i++)F(hash(x,y,i)<.5?'#c4bfb5':'#d9d4cb',px+(hash(x,y,i+9)*15|0)+1,py+(hash(x,y,i+19)*14|0)+1,1,1);if(G.season===3&&hash(x,y,2)<.5)F('#eef3f8',px+2,py+12,6,3);break;}
  case 'road':{F('#4c4f57',px,py,16,16);for(let i=0;i<10;i++)F(hash(x,y,i)<.5?'#575a62':'#44474e',px+(hash(x,y,i+9)*16|0),py+(hash(x,y,i+19)*16|0),1,1);
   if(y===21){F('#38393e',px,py,16,2);if(x%2===0)F('#e8c34a',px+3,py+15,10,1);}if(y===22){if(x%2===0)F('#e8c34a',px+3,py,10,1);F('#38393e',px,py+14,16,2);}break;}
  case 'dirt':{F('#8a5a36',px,py,16,16);for(let i=0;i<14;i++)F(hash(x,y,i)<.5?'#7a4e2e':'#9b6a42',px+(hash(x,y,i+9)*16|0),py+(hash(x,y,i+19)*16|0),1,1);break;}
  case 'wood':case 'walnut':{const C=FLOORS[type].c;for(let r=0;r<4;r++){const R=y*4+r,off=hash(R,1,type.length)*24|0;
    for(let i=0;i<16;i++){const wx=px+i,pid=Math.floor((wx+off)/24);_g.fillStyle=C[(hash(pid,R,2)*3)|0];_g.fillRect(wx,py+r*4,1,3);if((wx+off)%24===0)F(shade(C[0],-.3),wx,py+r*4,1,3);}
    F(shade(C[0],-.25),px,py+r*4+3,16,1);if(hash(x,R,5)<.6)F(shade(C[1],-.12),px+(hash(x,R,6)*14|0),py+r*4+1,2,1);}break;}
  case 'check':{const C=FLOORS.check.c;for(let qy=0;qy<2;qy++)for(let qx=0;qx<2;qx++){const c=C[(x*2+qx+y*2+qy)%2];F(c,px+qx*8,py+qy*8,8,8);F(shade(c,.12),px+qx*8,py+qy*8,8,1);}break;}
  case 'white':{F('#c4ced6',px,py,16,16);for(let r=0;r<4;r++){const off=(y*4+r)%2?4:0;for(let i=-1;i<3;i++){const tx=px+i*8+off,x0=Math.max(px,tx+1),x1=Math.min(px+16,tx+8);if(x1>x0)F(r%2?'#eef2f4':'#e8edf0',x0,py+r*4+1,x1-x0,3);}}break;}
  case 'carpet':case 'bluecarpet':case 'rosecarpet':{const c=FLOORS[type].c[0];F(c,px,py,16,16);for(let i=0;i<22;i++)F(hash(x,y,i)<.5?shade(c,.1):shade(c,-.08),px+(hash(x,y,i+9)*16|0),py+(hash(x,y,i+19)*16|0),1,1);break;}
  case 'marble':{F('#f2efea',px,py,16,16);F('#e4ded5',px,py,16,1);F('#e4ded5',px,py,1,16);const s=hash(x,y,1)*16|0;for(let i=0;i<16;i++)if(hash(x,i,y)<.6)F('#d9d4cc',px+((s+i)%16),py+i,1,1);break;}
  default:F('#888888',px,py,16,16);
 }}
function renderGround(){
 const[c,g]=mkc(MW*T,MH*T);
 for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){
  const i=x+y*MW;
  if(!W.wt[i]){tileFloor(g,W.floor[i],x,y);continue;}
  const n=isWall(x,y-1),s=isWall(x,y+1),e=isWall(x+1,y),w=isWall(x-1,y),hz=e||w||(!n&&!s);
  const pickF=(a,b)=>{const A=a&&!isWall(a[0],a[1])&&inMap(a[0],a[1])?W.floor[a[0]+a[1]*MW]:null,B=b&&!isWall(b[0],b[1])&&inMap(b[0],b[1])?W.floor[b[0]+b[1]*MW]:null;return A||B||W.floor[i];};
  const Q=[[0,0,hz?[x,y-1]:[x-1,y],hz?[x-1,y]:[x,y-1]],[8,0,hz?[x,y-1]:[x+1,y],hz?[x+1,y]:[x,y-1]],[0,8,hz?[x,y+1]:[x-1,y],hz?[x-1,y]:[x,y+1]],[8,8,hz?[x,y+1]:[x+1,y],hz?[x+1,y]:[x,y+1]]];
  for(const[qx,qy,a,b]of Q){g.save();g.beginPath();g.rect(x*T+qx,y*T+qy,8,8);g.clip();tileFloor(g,pickF(a,b),x,y);g.restore();}
 }
 // soft shadows under walls
 for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){if(!W.wt[x+y*MW]||isWall(x,y+1))continue;_g=g;const tall=W.tall[x+y*MW];g.fillStyle='rgba(30,20,40,'+(tall?.22:.14)+')';g.fillRect(x*T,(y+1)*T-6,16,tall?4:2);}
 for(const o of G.objects)if(o.def.rug)drawRug(g,o,o.x*T,o.y*T);
 W.ground=c;W.groundDirty=false;
}

// ---------- walls (three pieces per tile so people sort correctly) ----------
const WALL_SPR=new Map();
const HT=22,HL=6;
function siding(g,wx,y0,h,x0,w){_g=g;for(let i=0;i<h;i++)F((i%3===0)?'#7d9eb0':'#8fb1c2',x0,y0+i,w,1);F('#6b8ea0',x0,y0+h-1,w,1);}
function wallpaper(g,wp,wx,x0,y0,w,h){_g=g;const P=WALLPAPERS[wp]||WALLPAPERS.cream;F(P.c,x0,y0,w,h);
 for(let i=0;i<w;i++){const X=wx+i;
  if(P.pat==='stripe'&&X%6<2)F(P.c2,x0+i,y0,1,h);
  if(P.pat==='panel'&&X%8===0)F(P.c2,x0+i,y0,1,h);
  if(P.pat==='dots')for(let j=2;j<h;j+=5)if((X+j)%6===0){F(P.c2,x0+i,y0+j,1,1);F('#8fb07a',x0+i,y0+j+1,1,1);}
  if(P.pat==='damask')for(let j=2;j<h;j+=6)if((X+(j%12?3:0))%6===0){F(P.c2,x0+i,y0+j,1,2);}
  if(P.pat==='tile'){if(X%4===0)F(P.c2,x0+i,y0,1,h);}
 }
 if(P.pat==='tile')for(let j=0;j<h;j+=4)F(P.c2,x0,y0+j,w,1);
 if(P.pat==='brick')for(let j=0;j<h;j+=3){F(P.c2,x0,y0+j,w,1);for(let i=0;i<w;i++)if((wx+i+(j%6?3:0))%6===0)F(P.c2,x0+i,y0+j,1,3);}
}
function wallPieces(x,y){
 const i=x+y*MW,t=W.wt[i],n=isWall(x,y-1),s=isWall(x,y+1),e=isWall(x+1,y),w=isWall(x-1,y),tall=W.tall[i];
 const intS=isInt(x,y+1)||(tall&&(isInt(x-1,y+1)||isInt(x+1,y+1)));
 const wp=intS?(W.wp[i]||'cream'):'ext',open=t===2?!!W.open[i]:false;
 const deco=t===1&&tall?wallDecorAt(x,y):null;
 const key=t+'|'+(n?1:0)+(e?2:0)+(s?4:0)+(w?8:0)+'|'+(tall?1:0)+'|'+wp+'|'+(open?1:0)+'|'+(deco?deco.type+(deco.state&&deco.state.art?deco.state.art.seed:'')+deco.x:'');
 let r=WALL_SPR.get(key);if(r)return r;
 const H=tall?HT:HL,cap='#5b4a55',capL='#7d6a75',capD='#463842',endC='#8a7882';
 const vert=(n||s)&&!(e||w);
 const pieces=[];
 const mk=(rects,sortOff)=>{const[c,g]=mkc(16,16+H+2);_g=g;const O=H;let any=false;
  for(const[rx,ry,rw,rh,hh,kind]of rects){any=true;const fy0=ry+rh+O-hh,fy1=ry+rh+O,cy0=ry+O-hh;
   if(kind==='h'){if(wp==='ext')siding(g,x*16+rx,fy0,fy1-fy0,rx,rw);else{wallpaper(g,wp,x*16+rx,rx,fy0,rw,fy1-fy0);if(hh>8){F('rgba(255,255,255,.25)',rx,fy0,rw,1);F(shade((WALLPAPERS[wp]||WALLPAPERS.cream).c,-.35),rx,fy1-2,rw,2);}else F('rgba(0,0,0,.12)',rx,fy1-1,rw,1);}}
   else{F(endC,rx,fy0,rw,fy1-fy0);F(shade(endC,-.2),rx+rw-1,fy0,1,fy1-fy0);}
   F(cap,rx,cy0,rw,rh);if(kind==='h'){F(capL,rx,cy0,rw,1);F(capD,rx,cy0+rh-1,rw,1);}else{F(capL,rx,cy0,1,rh);F(capD,rx+rw-1,cy0,1,rh);}
  }
  return any?{c,ox:0,oy:-H,sort:sortOff}:null;};
 const rN=[],rM=[],rS=[];
 if(t===2&&vert){ // door in a vertical wall
  rN.push([6,0,4,3,HL,'v']);rS.push([6,13,4,3,HL,'v']);
 }else if(t===2){ // door in a horizontal wall
  if(n)rN.push([6,0,4,6,HL,'v']);
  rM.push([0,6,3,4,H,'h']);rM.push([13,6,3,4,H,'h']);
  if(s)rS.push([6,10,4,6,HL,'v']);
 }else{
  if(n)rN.push([6,0,4,6,HL,'v']);
  if(vert){rM.push([6,6,4,4,HL,'v']);}else{rM.push([6,6,4,4,H,'h']);if(w)rM.push([0,6,6,4,H,'h']);if(e)rM.push([10,6,6,4,H,'h']);}
  if(s)rS.push([6,10,4,6,HL,'v']);
 }
 const pN=mk(rN,6),pM=mk(rM,10),pS=mk(rS,16);
 // door / window details
 if(t===2&&pM&&!vert){const g=pM.c.getContext('2d');_g=g;const O=H;
  if(tall){F(cap,3,6+O-H,10,4);F(capL,3,6+O-H,10,1);if(wp==='ext')siding(g,x*16+3,10+O-H,6,3,10);else wallpaper(g,wp,x*16+3,3,10+O-H,10,4);
   if(!open){F('#9a6a43',3,10+O-H+4,10,H-4);F('#b07c50',4,10+O-H+5,8,1);F('#7a5232',5,10+O-H+7,2,6);F('#7a5232',9,10+O-H+7,2,6);F('#f6d04a',11,O+2,1,1);}
   else F('#7a5232',3,6+O-H+6,1,H-2);}
  else{if(!open){F('#9a6a43',3,6+O-HL,10,4+HL);F('#b07c50',3,6+O-HL,10,1);F('#7a5232',3,9+O-HL,10,1);F('#f6d04a',11,8+O-HL,1,1);}else{F('#9a6a43',3,0+O-HL,2,6);F('#b07c50',3,0+O-HL,2,1);}}}
 if(t===2&&vert){const O=HL;
  if(pN&&!open){const gN=pN.c.getContext('2d');_g=gN;F('#9a6a43',7,3+O-HL,2,10+HL);F('#b07c50',7,3+O-HL,1,10);}
  if(pN&&open){const gN=pN.c.getContext('2d');_g=gN;F('#9a6a43',8,3+O-HL,6,2);F('#b07c50',8,3+O-HL,6,1);}}
 if(t===3&&pM){const g=pM.c.getContext('2d');_g=g;const O=H;
  if(tall&&!vert){const fy=6+O-H+4;F('#f4efe6',3,fy-1,10,14);g.clearRect(4,fy,8,12);F('#f4efe6',7,fy,2,12);F('#f4efe6',4,fy+5,8,1);F('#e8e0d2',2,fy+13,12,2);F('#c9b9a2',2,fy+14,12,1);F('#c95b7d',3,fy-1,2,8);F('#a8487a',4,fy,1,7);F('#c95b7d',11,fy-1,2,8);F('#a8487a',11,fy,1,7);pM.glass=[4,fy,8,12];}
  else if(!vert){F('#a9d3e6',1,6+O-HL,14,4);F('#d6ecf5',2,6+O-HL,4,1);F('#f4efe6',0,6+O-HL,1,4);F('#f4efe6',15,6+O-HL,1,4);F('#f4efe6',7,6+O-HL,1,4);}
  else{F('#a9d3e6',6,1+O-HL,4,14);F('#d6ecf5',6,2+O-HL,1,4);}}
 if(deco&&pM&&tall){const g=pM.c.getContext('2d');drawWallDecor(g,deco,1,6+H-H+4);}
 r=[pN,pM,pS].filter(Boolean);WALL_SPR.set(key,r);if(WALL_SPR.size>3000)WALL_SPR.clear();return r;
}

// ---------- misc sprites ----------
const MISC={};
function leafSprite(col){const k='leaf'+col;if(MISC[k])return MISC[k];const c=iconCanvas('leaf',{o:col,k:shade(col,-.55)});const[c2,g]=mkc(c.width+4,c.height+4);
 g.drawImage(c,2,2);const d=g.getImageData(0,0,c2.width,c2.height),D=d.data,o=new Uint8ClampedArray(D);
 for(let y=0;y<c2.height;y++)for(let x=0;x<c2.width;x++){const i=(y*c2.width+x)*4;if(D[i+3])continue;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=c2.width||yy>=c2.height)continue;if(D[((yy*c2.width)+xx)*4+3]){o[i]=255;o[i+1]=250;o[i+2]=235;o[i+3]=235;break;}}}
 g.putImageData(new ImageData(o,c2.width,c2.height),0,0);g.fillStyle='rgba(255,255,255,.6)';g.fillRect(5,5,1,1);MISC[k]=c2;return c2;}
function bubbleSprite(icon,kind){const k='b'+icon+kind;if(MISC[k])return MISC[k];const[c,g]=mkc(18,18);_g=g;const bg=kind==='bad'?'#ffe1dc':kind==='think'?'#f4f1ff':'#ffffff',ed='#2a1f2d';
 F(ed,2,0,12,1);F(ed,1,1,1,1);F(ed,14,1,1,1);F(ed,0,2,1,10);F(ed,15,2,1,10);F(ed,1,12,1,1);F(ed,14,12,1,1);F(ed,2,13,12,1);F(bg,1,2,14,10);F(bg,2,1,12,12);
 if(kind==='think'){F(ed,4,15,3,2);F(bg,5,15,1,1);F(ed,2,17,1,1);}else{F(bg,6,13,3,1);F(ed,6,14,1,1);F(ed,8,14,1,2);F(bg,7,14,1,1);F(ed,7,16,1,1);}
 g.drawImage(iconCanvas(icon),3,2);MISC[k]=c;return c;}
function carSprite(col,dir){const k='car'+col+dir;if(MISC[k])return MISC[k];const[c,g]=mkc(38,22);_g=g;const D=shade(col,-.25),L=shade(col,.25);
 F(D,2,8,34,8);F(col,2,7,34,7);F(L,3,7,32,1);F(D,9,1,19,7);F(col,10,1,17,6);F('#a9d3e6',11,2,7,4);F('#a9d3e6',19,2,7,4);F('#d6ecf5',11,2,2,1);F('#d6ecf5',19,2,2,1);
 F('#222222',6,13,7,6);F('#222222',25,13,7,6);F('#8a8f99',8,15,3,2);F('#8a8f99',27,15,3,2);F('#fff3c4',35,9,1,3);F('#e2453c',2,9,1,3);F(D,2,15,34,1);
 outline(c);if(dir<0){const[c2,g2]=mkc(38,22);g2.translate(38,0);g2.scale(-1,1);g2.drawImage(c,0,0);MISC[k]=c2;return c2;}MISC[k]=c;return c;}
function lightStamp(col){const k='ls'+col;if(MISC[k])return MISC[k];const[c,g]=mkc(64,64);const gr=g.createRadialGradient(32,32,0,32,32,32);const[r,gg,b]=col;
 gr.addColorStop(0,`rgba(${r},${gg},${b},1)`);gr.addColorStop(.45,`rgba(${r},${gg},${b},.55)`);gr.addColorStop(1,`rgba(${r},${gg},${b},0)`);g.fillStyle=gr;g.fillRect(0,0,64,64);MISC[k]=c;return c;}
