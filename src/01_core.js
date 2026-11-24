// ================= CORE: constants, helpers, game data =================
const T=16,MW=28,MH=24,LOTH=20,SIDEY=20;
const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const SEASONS=['Spring','Summer','Fall','Winter'];
const SPEEDS=[0,1.5,5,15];
const WALK=30; // px per game minute
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
const rnd=Math.random, ri=(a,b)=>a+Math.floor(rnd()*(b-a+1)), pick=a=>a[Math.floor(rnd()*a.length)], chance=p=>rnd()<p;
function hash(x,y,s){let h=((x|0)*374761393+(y|0)*668265263+(s|0)*1442695041)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function h2r(h){const n=parseInt(h.slice(1,7),16);return[n>>16&255,n>>8&255,n&255];}
function r2h(r,g,b){return'#'+((1<<24)|(clamp(Math.round(r),0,255)<<16)|(clamp(Math.round(g),0,255)<<8)|clamp(Math.round(b),0,255)).toString(16).slice(1);}
function shade(h,f){const[r,g,b]=h2r(h);return f>=0?r2h(r+(255-r)*f,g+(255-g)*f,b+(255-b)*f):r2h(r*(1+f),g*(1+f),b*(1+f));}
function mix(a,b,t){const A=h2r(a),B=h2r(b);return r2h(lerp(A[0],B[0],t),lerp(A[1],B[1],t),lerp(A[2],B[2],t));}
const dayOf=t=>Math.floor(t/1440), hourOf=t=>(t%1440)/60, wday=t=>dayOf(t)%7;
function clockStr(t){const m=Math.floor(t%1440),h=Math.floor(m/60),mm=m%60;return((h%12)||12)+':'+String(mm).padStart(2,'0')+(h<12?' AM':' PM');}
function hr12(h){h=((h%24)+24)%24;return((h%12)||12)+(h<12?' AM':' PM');}
const money=n=>'$'+Math.round(n).toLocaleString('en-US');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let UID=1; const uid=p=>(p||'o')+(UID++);

// ---------- needs, skills, traits ----------
const NEEDS=[
 {id:'hunger',l:'Hunger',decay:5.4},{id:'energy',l:'Energy',decay:4.6},{id:'bladder',l:'Bladder',decay:7.2},
 {id:'hygiene',l:'Hygiene',decay:3.6},{id:'fun',l:'Fun',decay:4.8},{id:'social',l:'Social',decay:3.6}];
const NEED_IDS=NEEDS.map(n=>n.id);
const SKILLS={cooking:{l:'Cooking'},logic:{l:'Logic'},fitness:{l:'Fitness'},charisma:{l:'Charisma'},painting:{l:'Painting'},guitar:{l:'Guitar'},gardening:{l:'Gardening'}};
const SKILL_IDS=Object.keys(SKILLS);
const SKILL_XP=[0,120,300,560,900,1350,1900,2600,3450,4450,5600];
const lvlOf=xp=>{let l=0;while(l<10&&xp>=SKILL_XP[l+1])l++;return l;};
const TRAITS={
 neat:{l:'Neat',d:'Hygiene drains slower. Hates a messy house.',opp:'slob'},
 slob:{l:'Slob',d:'Hygiene drains faster. Messes never bother them.',opp:'neat'},
 bookworm:{l:'Bookworm',d:'Reading is extra fun. Learns Logic faster.'},
 athletic:{l:'Athletic',d:'Workouts are fun. Learns Fitness faster.',opp:'couch'},
 couch:{l:'Couch Potato',d:'TV is extra fun. Workouts are a drag.',opp:'athletic'},
 social:{l:'Social Butterfly',d:'Needs people more, and gets more from them.',opp:'loner'},
 loner:{l:'Loner',d:'Social drains slowly. Small talk is tiring.',opp:'social'},
 foodie:{l:'Foodie',d:'Cooks better meals and learns Cooking faster.'},
 artistic:{l:'Artistic',d:'Paints faster. Paintings sell for more.'},
 musical:{l:'Musical',d:'Learns Guitar faster. Music is extra fun.'},
 green:{l:'Green Thumb',d:'Plants grow faster. Learns Gardening faster.'},
 nightowl:{l:'Night Owl',d:'Lively at night, groggy in the morning.'},
 workaholic:{l:'Workaholic',d:'Better at work, and work is less draining.'},
 charmer:{l:'Charmer',d:'Flirts land more often. Romance grows faster.'},
 genius:{l:'Genius',d:'Learns Logic much faster.'},
 cheerful:{l:'Cheerful',d:'Naturally upbeat. A small mood boost, always.'},
};
const MOODLETS={
 hungry:{l:'Hungry',i:'hunger',v:-12},starving:{l:'Starving',i:'hunger',v:-30},
 tired:{l:'Tired',i:'energy',v:-12},exhausted:{l:'Exhausted',i:'energy',v:-30},
 gottago:{l:'Gotta Go',i:'bladder',v:-12},bursting:{l:'Bursting',i:'bladder',v:-30},
 smelly:{l:'Smelly',i:'hygiene',v:-10},stinky:{l:'Stinky',i:'hygiene',v:-24},
 bored:{l:'Bored',i:'fun',v:-10},verybored:{l:'Very Bored',i:'fun',v:-22},
 lonely:{l:'Lonely',i:'social',v:-10},verylonely:{l:'Very Lonely',i:'social',v:-22},
 content:{l:'Content',i:'smile',v:10},
 wellRested:{l:'Well Rested',i:'zzz',v:15,dur:360},dreamy:{l:'Slept Like a Baby',i:'zzz',v:24,dur:480},
 sleptFloor:{l:'Slept on the Floor',i:'frown',v:-15,dur:300},groggy:{l:'Groggy',i:'energy',v:-8,dur:120},
 greatMeal:{l:'Great Meal',i:'food',v:15,dur:240},amazingMeal:{l:'Amazing Meal',i:'food',v:25,dur:300},
 badMeal:{l:'Yucky Meal',i:'frown',v:-12,dur:180},gardenFresh:{l:'Garden Fresh',i:'gardening',v:12,dur:240},
 fresh:{l:'Fresh and Clean',i:'hygiene',v:10,dur:180},bathBliss:{l:'Bubble Bath Bliss',i:'hygiene',v:15,dur:240},
 hadFun:{l:'Had a Blast',i:'fun',v:12,dur:180},goodChat:{l:'Good Conversation',i:'social',v:12,dur:180},
 awkward:{l:'Awkward',i:'frown',v:-8,dur:120},rejected:{l:'Rejected',i:'heartbreak',v:-18,dur:240},
 insulted:{l:'Insulted',i:'frown',v:-15,dur:180},firstKiss:{l:'First Kiss',i:'heart',v:30,dur:480},
 inLove:{l:'In Love',i:'heart',v:20,dur:720},newlywed:{l:'Just Married',i:'heart',v:35,dur:1440},
 promoted:{l:'Promoted!',i:'trophy',v:30,dur:1440},fired:{l:'Fired',i:'frown',v:-30,dur:1440},
 goodWork:{l:'Great Day at Work',i:'job',v:12,dur:240},badWork:{l:'Rough Day at Work',i:'job',v:-12,dur:240},
 skipped:{l:'Skipped Work',i:'frown',v:-10,dur:240},comfy:{l:'Comfy',i:'smile',v:6},
 cozy:{l:'Cozy Home',i:'home',v:10},messy:{l:'Messy House',i:'frown',v:-8},
 embarrassed:{l:'Embarrassed',i:'frown',v:-20,dur:240},caffeinated:{l:'Caffeinated',i:'energy',v:6,dur:120},
 workoutHigh:{l:'Workout High',i:'fitness',v:12,dur:180},wish:{l:'Wish Fulfilled',i:'star',v:12,dur:240},
 masterpiece:{l:'Made a Masterpiece',i:'painting',v:25,dur:480},inspired:{l:'Inspired',i:'painting',v:10,dur:180},
 jamming:{l:'In the Groove',i:'note',v:10,dur:180},cheerful:{l:'Cheerful',i:'smile',v:10},
 sunshine:{l:'Sunshine Soul',i:'sun',v:15},cozyRain:{l:'Cozy Rain',i:'rain',v:5},
 firstSnow:{l:'First Snow',i:'snow',v:12,dur:480},party:{l:'Great Party',i:'star',v:20,dur:360},
 confident:{l:'Feeling Confident',i:'smile',v:8,dur:180},goodBook:{l:'Good Book',i:'book',v:10,dur:180},
 harvest:{l:'Bountiful Harvest',i:'gardening',v:12,dur:240},crowd:{l:'Crowd Pleaser',i:'note',v:15,dur:240},
 repo:{l:'Repossessed',i:'frown',v:-15,dur:480},starry:{l:'Starry Eyed',i:'star',v:10,dur:180},
 warm:{l:'Toasty Warm',i:'fire',v:8,dur:120},
 fishing:{l:'Gone Fishing',i:'fish',v:12,dur:240},bigCatch:{l:'The Big One',i:'fish',v:25,dur:480},derby:{l:'Derby Day',i:'trophy',v:16,dur:300},
 parkDay:{l:'Fresh Air',i:'tree',v:12,dur:240},picnic:{l:'Neighborhood Picnic',i:'people',v:20,dur:360},visited:{l:'Good Company',i:'people',v:14,dur:240},marketDay:{l:'Market Day',i:'gardening',v:10,dur:240},
};
function moodLevel(m){
 if(m>=45)return{id:4,l:'Ecstatic',c:'#2fbf5f'};if(m>=15)return{id:3,l:'Happy',c:'#8acb3f'};
 if(m>-10)return{id:2,l:'Fine',c:'#e9c93a'};if(m>-40)return{id:1,l:'Uncomfortable',c:'#ee8a2e'};return{id:0,l:'Miserable',c:'#e2453c'};
}

// ---------- careers ----------
const CAREERS={
 tech:{l:'Tech',skill:'logic',days:[0,1,2,3,4],lv:[['Help Desk Tech',20,9,17],['Junior Developer',30,9,17],['Software Engineer',44,9,17],['Lead Engineer',62,10,17],['Chief Technology Officer',95,10,16]]},
 culinary:{l:'Culinary',skill:'cooking',days:[1,2,3,4,5],lv:[['Dishwasher',17,15,21],['Line Cook',26,15,21],['Sous Chef',38,15,22],['Head Chef',56,15,21],['Celebrity Chef',90,13,19]]},
 business:{l:'Business',skill:'charisma',days:[0,1,2,3,4],lv:[['Mailroom Clerk',18,9,17],['Sales Associate',28,9,17],['Account Manager',42,9,17],['Director',60,9,16],['CEO',100,10,15]]},
 sports:{l:'Athletics',skill:'fitness',days:[0,1,2,3,5],lv:[['Team Mascot',16,12,18],['Rookie',27,12,18],['Starter',41,12,18],['All-Star',60,12,17],['Hall of Famer',98,13,17]]},
 music:{l:'Music',skill:'guitar',days:[2,3,4,5,6],lv:[['Street Performer',15,17,22],['Session Musician',25,17,22],['Band Member',39,18,23],['Headliner',58,19,23],['Rock Legend',100,20,23]]},
 arts:{l:'Fine Arts',skill:'painting',days:[0,1,2,3,4],lv:[['Gallery Assistant',16,10,16],['Art Restorer',26,10,16],['Studio Artist',40,10,16],['Gallery Curator',58,10,16],['Visionary Artist',96,11,15]]},
};
const PROMO=[0,2,4,6,8];

// ---------- food & garden ----------
const RECIPES=[
 {id:'pancakes',l:'Pancakes',lvl:0,time:25,hunger:55,cost:6,c:'#e8b25c'},
 {id:'grilled',l:'Grilled Cheese',lvl:0,time:20,hunger:50,cost:5,c:'#f0c445'},
 {id:'salad',l:'Garden Salad',lvl:1,time:15,hunger:48,cost:0,produce:2,fresh:1,c:'#7cc94a'},
 {id:'mac',l:'Mac and Cheese',lvl:1,time:30,hunger:62,cost:8,c:'#f2b33d'},
 {id:'spaghetti',l:'Spaghetti',lvl:2,time:40,hunger:72,cost:10,c:'#d9603b'},
 {id:'stirfry',l:'Veggie Stir-Fry',lvl:3,time:35,hunger:70,cost:9,c:'#8ab84a'},
 {id:'chili',l:'Hearty Chili',lvl:4,time:50,hunger:80,cost:12,c:'#a8402e'},
 {id:'pie',l:'Pumpkin Pie',lvl:4,time:45,hunger:60,cost:6,needs:'pumpkin',fresh:1,c:'#e0862c'},
 {id:'roast',l:'Roast Chicken',lvl:5,time:60,hunger:88,cost:16,c:'#c88a45'},
 {id:'salmon',l:'Cedar Salmon',lvl:7,time:50,hunger:90,cost:24,c:'#f09a7a'},
 {id:'lobster',l:'Lobster Thermidor',lvl:9,time:70,hunger:98,cost:40,c:'#e2453c'},
];
const GRILL=[
 {id:'hotdogs',l:'Hot Dogs',lvl:0,time:20,hunger:55,cost:6,c:'#c8553d'},
 {id:'burgers',l:'Burgers',lvl:0,time:30,hunger:70,cost:10,c:'#8a5a36'},
 {id:'kebabs',l:'Veggie Kebabs',lvl:3,time:30,hunger:65,cost:0,produce:2,fresh:1,c:'#8ab84a'},
 {id:'ribs',l:'BBQ Ribs',lvl:6,time:60,hunger:92,cost:20,c:'#8f3a24'},
];
const CROPS={
 lettuce:{l:'Lettuce',lvl:0,cost:3,grow:44,sell:12,c:'#86d04f'},
 tomato:{l:'Tomatoes',lvl:0,cost:5,grow:56,sell:18,c:'#e2452f'},
 carrot:{l:'Carrots',lvl:1,cost:4,grow:50,sell:15,c:'#f08a24'},
 strawberry:{l:'Strawberries',lvl:2,cost:8,grow:64,sell:30,c:'#e83a5a'},
 pumpkin:{l:'Pumpkins',lvl:4,cost:12,grow:84,sell:55,c:'#f2902c'},
};

// ---------- catalog ----------
const CATS=[['seating','Seating'],['surfaces','Surfaces'],['beds','Beds'],['kitchen','Kitchen'],['bath','Bathroom'],['electronics','Electronics'],['hobbies','Hobbies'],['lighting','Lighting'],['decor','Decor'],['outdoor','Outdoor']];
const FAB=['#d9603b','#4f7fd6','#6fa35a','#e2a53a','#8e5ba8','#3e9e9a','#c95b7d','#7a8796'];
const CATALOG={
 bed_single:{n:'Cozy Twin Bed',c:'beds',p:350,w:1,h:2,energy:10,comfort:2,acts:['sleep','nap','relax'],cols:FAB},
 bed_double:{n:'Maple Double Bed',c:'beds',p:900,w:2,h:2,energy:11,comfort:3,decor:1,acts:['sleep','nap','relax'],cols:FAB},
 bed_lux:{n:'Cloud Nine Bed',c:'beds',p:2600,w:2,h:2,energy:14,comfort:5,decor:3,lux:1,acts:['sleep','nap','relax'],cols:FAB},
 chair_dining:{n:'Spindle Chair',c:'seating',p:90,w:1,h:1,turn:4,comfort:1,seat:1,acts:['sit']},
 chair_arm:{n:'Puffy Armchair',c:'seating',p:380,w:1,h:1,turn:4,comfort:3,decor:1,seat:1,acts:['sit','doze'],cols:FAB},
 sofa:{n:'Weekend Loveseat',c:'seating',p:650,w:2,h:1,turn:4,comfort:3,decor:1,seat:1,acts:['sit','doze'],cols:FAB},
 sofa_lux:{n:'Velvet Chesterfield',c:'seating',p:1600,w:3,h:1,turn:4,comfort:5,decor:3,seat:1,lux:1,acts:['sit','doze'],cols:FAB},
 table_dining:{n:'Farmhouse Table',c:'surfaces',p:280,w:2,h:1,turn:4,decor:1,surf:1,table:1},
 table_end:{n:'End Table',c:'surfaces',p:70,w:1,h:1,surf:1,table:1},
 counter:{n:'Butcher-Block Counter',c:'kitchen',p:160,w:1,h:1,turn:4,surf:1,counter:1},
 sink_k:{n:'Farmhouse Sink',c:'kitchen',p:280,w:1,h:1,turn:4,counter:1,sink:1,acts:['cleanAll']},
 fridge:{n:'ChillMax Fridge',c:'kitchen',p:650,w:1,h:1,turn:4,fridge:1,q:0,acts:['snack','cook','cookGroup']},
 fridge_lux:{n:'Frost Royale Fridge',c:'kitchen',p:1700,w:1,h:1,turn:4,fridge:1,q:1,decor:1,acts:['snack','cook','cookGroup']},
 stove:{n:'Basic Range',c:'kitchen',p:480,w:1,h:1,turn:4,stove:1,q:0,acts:['cook']},
 stove_pro:{n:"Chef's Pro Range",c:'kitchen',p:2000,w:1,h:1,turn:4,stove:1,q:2,decor:1,acts:['cook']},
 coffee:{n:'Coffee Station',c:'kitchen',p:150,w:1,h:1,turn:4,acts:['coffee']},
 trash:{n:'Trash Can',c:'kitchen',p:50,w:1,h:1,trash:1},
 toilet:{n:'Standard Toilet',c:'bath',p:320,w:1,h:1,turn:4,rate:1,acts:['toilet']},
 toilet_lux:{n:'Heated Toilet',c:'bath',p:1200,w:1,h:1,turn:4,rate:1.4,comfort:3,decor:1,acts:['toilet']},
 shower:{n:'Rainfall Shower',c:'bath',p:700,w:1,h:1,turn:4,acts:['shower']},
 tub:{n:'Clawfoot Tub',c:'bath',p:1400,w:2,h:1,decor:2,acts:['bath']},
 sink_b:{n:'Vanity Sink',c:'bath',p:240,w:1,h:1,turn:4,decor:1,bsink:1,acts:['washHands','brushTeeth']},
 tv:{n:'Retro Box TV',c:'electronics',p:520,w:1,h:1,turn:4,tv:1,fun:22,acts:['watchTV','watchCooking','watchWorkout']},
 tv_big:{n:'Cinema Wall TV',c:'electronics',p:2800,w:2,h:1,turn:4,tv:1,fun:34,decor:2,acts:['watchTV','watchCooking','watchWorkout']},
 pc:{n:'Home Computer',c:'electronics',p:850,w:1,h:1,turn:4,pc:1,fun:24,acts:['playGames','browse','chatOnline','freelance','study','findJob']},
 pc_lux:{n:'Gamer Rig X',c:'electronics',p:2200,w:1,h:1,turn:4,pc:1,fun:34,q:1,decor:1,acts:['playGames','browse','chatOnline','freelance','study','findJob']},
 stereo:{n:'Boombox',c:'electronics',p:320,w:1,h:1,stereo:1,acts:['dance']},
 bookshelf:{n:'Oak Bookshelf',c:'hobbies',p:420,w:1,h:1,turn:4,decor:1,acts:['readNovel','readCooking','readLogic','readGarden']},
 chess:{n:'Chess Table',c:'hobbies',p:460,w:1,h:1,acts:['chess']},
 easel:{n:'Artist Easel',c:'hobbies',p:520,w:1,h:1,turn:4,acts:['paint']},
 guitar:{n:'Acoustic Guitar',c:'hobbies',p:380,w:1,h:1,frontDir:'down',acts:['playGuitar','busk']},
 treadmill:{n:'Treadmill',c:'hobbies',p:820,w:1,h:1,turn:4,inPos:[8,10],inDir:'up',acts:['run']},
 dumbbells:{n:'Dumbbell Rack',c:'hobbies',p:450,w:1,h:1,frontDir:'down',acts:['lift']},
 mirror:{n:'Standing Mirror',c:'hobbies',p:260,w:1,h:1,turn:4,decor:1,acts:['speech','admire']},
 telescope:{n:'Brass Telescope',c:'hobbies',p:950,w:1,h:1,decor:1,acts:['stargaze']},
 lamp_floor:{n:'Floor Lamp',c:'lighting',p:120,w:1,h:1,light:{r:70,c:'warm',y:-18}},
 lamp_table:{n:'Lamp on End Table',c:'lighting',p:110,w:1,h:1,light:{r:58,c:'warm',y:-8}},
 woodstove:{n:'Cast-Iron Wood Stove',c:'lighting',p:950,w:1,h:1,decor:2,light:{r:80,c:'fire',y:-2},acts:['warmUp']},
 lantern:{n:'Garden Lantern',c:'lighting',p:110,w:1,h:1,decor:1,out:1,light:{r:58,c:'warm',y:-11}},
 lamp_arc:{n:'Arc Floor Lamp',c:'lighting',p:260,w:1,h:1,decor:1,light:{r:80,c:'warm',y:-6,x:5}},
 lamp_paper:{n:'Paper Lantern Lamp',c:'lighting',p:90,w:1,h:1,decor:1,light:{r:62,c:'warm',y:-4}},
 sconce:{n:'Brass Wall Sconce',c:'lighting',p:140,w:1,h:1,decor:1,wall:1,light:{r:66,c:'warm',y:4,gy:-8}},
 sconce_globe:{n:'Globe Wall Light',c:'lighting',p:95,w:1,h:1,wall:1,light:{r:60,c:'cool',y:4,gy:-8}},
 lamp_post:{n:'Garden Lamp Post',c:'lighting',p:240,w:1,h:1,decor:1,out:1,light:{r:86,c:'warm',y:-22}},
 string_lights:{n:'String Lights',c:'lighting',p:180,w:2,h:1,decor:2,out:1,light:{r:74,c:'warm',y:-14,x:16}},
 plant_s:{n:'Potted Fern',c:'decor',p:60,w:1,h:1,decor:1},
 plant_l:{n:'Fiddle-Leaf Fig',c:'decor',p:190,w:1,h:1,decor:2},
 rug:{n:'Woven Rug',c:'decor',p:160,w:2,h:2,decor:2,rug:1,cols:FAB},
 rug_big:{n:'Medallion Rug',c:'decor',p:420,w:3,h:2,turn:4,decor:3,rug:1,cols:FAB},
 tank:{n:'Aquarium',c:'decor',p:750,w:2,h:1,turn:4,decor:3,acts:['watchFish']},
 art_wall:{n:'Landscape Print',c:'decor',p:280,w:1,h:1,decor:2,wall:1},
 clock_wall:{n:'Wall Clock',c:'decor',p:90,w:1,h:1,decor:1,wall:1},
 plot:{n:'Garden Plot',c:'outdoor',p:60,w:1,h:1,plot:1,out:1,acts:['plant','water','harvest','dig']},
 tree:{n:'Maple Tree',c:'outdoor',p:300,w:1,h:1,decor:2,tree:1,out:1},
 bush:{n:'Round Shrub',c:'outdoor',p:80,w:1,h:1,decor:1,out:1},
 flowers:{n:'Flower Bed',c:'outdoor',p:45,w:1,h:1,decor:1,out:1},
 bench:{n:'Park Bench',c:'outdoor',p:220,w:2,h:1,turn:4,comfort:1,seat:1,out:1,acts:['sit']},
 grill:{n:'Charcoal Grill',c:'outdoor',p:420,w:1,h:1,grill:1,out:1,acts:['grill']},
 mailbox:{n:'Mailbox',c:null,p:0,w:1,h:1,fixed:1,acts:['payBills']},
 streetlamp:{n:'Street Lamp',c:null,p:0,w:1,h:1,fixed:1,light:{r:84,c:'warm',y:-27}},
 painting:{n:'Painting',c:null,p:0,w:1,h:1,wall:1,decor:2},
};
const FLOORS={
 grass:{out:1},path:{out:1,l:'Stone Path',p:4},dirt:{out:1},side:{out:1},road:{out:1},
 wood:{l:'Oak Planks',p:6,c:['#c08a55','#b07b48','#cc9862']},
 walnut:{l:'Walnut Planks',p:8,c:['#7a5238','#6b4630','#87603f']},
 check:{l:'Checker Tile',p:7,c:['#f1e9dc','#86b0a8']},
 white:{l:'White Tile',p:6,c:['#eef2f4','#d3dbe1']},
 carpet:{l:'Sage Carpet',p:5,c:['#8fa881']},
 bluecarpet:{l:'Blue Carpet',p:5,c:['#6f86b5']},
 rosecarpet:{l:'Rose Carpet',p:5,c:['#c08a92']},
 marble:{l:'Marble',p:14,c:['#f2efea','#d9d4cc']},
};
const FCODE={'.':'grass','p':'path','d':'dirt','s':'side','r':'road','w':'wood','n':'walnut','k':'check','b':'white','c':'carpet','u':'bluecarpet','o':'rosecarpet','m':'marble'};
const FCODE_R=Object.fromEntries(Object.entries(FCODE).map(([k,v])=>[v,k]));
const WALLPAPERS={
 cream:{l:'Cream Paint',c:'#efe3c8',c2:'#e4d6b8',pat:'plain'},
 sage:{l:'Sage Stripes',c:'#a8bf98',c2:'#97b087',pat:'stripe'},
 dusk:{l:'Dusty Blue',c:'#93aacb',c2:'#869ec0',pat:'plain'},
 rose:{l:'Rose Sprig',c:'#e6b8b4',c2:'#f6dcd5',pat:'dots'},
 panel:{l:'Wood Panel',c:'#a06e45',c2:'#8a5c38',pat:'panel'},
 brick:{l:'Old Brick',c:'#b55a40',c2:'#8f4331',pat:'brick'},
 tile:{l:'Bath Tile',c:'#dceef0',c2:'#b5d1d6',pat:'tile'},
 navy:{l:'Midnight',c:'#35476c',c2:'#2c3c5c',pat:'plain'},
 mustard:{l:'Mustard Damask',c:'#dab35c',c2:'#c79d47',pat:'damask'},
};
const BUILD_COST={wall:12,door:120,window:90,wallpaper:3};
// ---------- the outside of the house (Build mode, Outside tool) ----------
const SIDINGS={sky:{l:'Sky Blue',c:'#8fb1c2',c2:'#7d9eb0',d:'#6b8ea0'},white:{l:'Cottage White',c:'#eeeae2',c2:'#dcd6cc',d:'#c4bdb1'},
 butter:{l:'Butter',c:'#ecd38c',c2:'#dcc078',d:'#c4a862'},sage:{l:'Sage',c:'#a8bb94',c2:'#96aa82',d:'#7f936b'},rose:{l:'Rose',c:'#d9a3a0',c2:'#c88f8c',d:'#b07774'},
 slate:{l:'Slate Gray',c:'#8a929c',c2:'#7a828c',d:'#666e78'},brick:{l:'Red Brick',c:'#b5583f',c2:'#8f4130',d:'#7a3626',pat:'brick'},
 stone:{l:'Fieldstone',c:'#a9a49a',c2:'#8a857b',d:'#77736a',pat:'stone'},shingle:{l:'Cedar Shingles',c:'#a87a52',c2:'#8f6440',d:'#77522f',pat:'shingle'}};
const ROOF_COLS=['#5f708a','#3f4650','#c4664a','#a95a48','#7c6a5c','#6f8e6b','#86627c','#c79a5a','#4f6f8f'];
const SHUTTER_COLS=['#c95b7d','#4f7fd6','#3e7a4f','#2f3a4a','#f2efe6','#e2a53a','#a83f3a'];
const DOOR_COLS=['#9a6a43','#c4453a','#2f4a7a','#3e7a4f','#e2a53a','#3a3338','#f2efe6'];
const EXT_COST={siding:150,roof:200,shutter:40,door:40};
function defaultExt(){return{siding:'sky',roof:'#5f708a',shutter:'#c95b7d',door:'#9a6a43'};}

// ---------- people ----------
const SKINS=['#ffe1c9','#f6caa7','#e2ac80','#c68b5f','#9c623e','#6e4529'];
const HAIRS=['short','long','bob','ponytail','bun','curly','spiky','buzz','bald'];
const HAIR_COLS=['#221c22','#4a2f22','#7b4a2a','#b0632f','#dcb35e','#ece0bd','#9a9aa5','#d0607f','#4f7fd6'];
const TOP_COLS=['#d9603b','#e2a53a','#6fa35a','#3e9e9a','#4f7fd6','#2f4a7a','#8e5ba8','#c95b7d','#f2efe6','#3a3338','#a3734a','#7fb8d6'];
const BOT_COLS=['#2f3e5c','#3a3338','#6b4a33','#556b45','#8a8f99','#c7b48d','#a83f3a','#4f7fd6','#e6dfd0','#6f4f8a'];
const SHOE_COLS=['#3a2a25','#f2efe6','#a83f3a','#2f3e5c','#6b4a33','#3a3338'];
const FIRSTS=['Avery','Jordan','Sam','Riley','Casey','Morgan','Quinn','Rowan','Emery','Jamie','Alex','Taylor','Noah','Mia','Leo','Ivy','Ezra','Nora','Milo','Ada','Felix','Hazel','Oscar','Luna','Jude','Iris','Silas','Clara','Otis','Wren'];
// gendered first names for create-a-sim (FIRSTS stays as it is: town generation draws from it)
const FIRSTS_F=['Avery','Riley','Casey','Quinn','Emery','Jamie','Mia','Ivy','Nora','Ada','Hazel','Luna','Iris','Clara','Wren','Rosa','June','Maya','Elsie','Pearl'];
const FIRSTS_M=['Jordan','Sam','Morgan','Rowan','Alex','Taylor','Noah','Leo','Ezra','Milo','Felix','Oscar','Jude','Silas','Otis','Theo','Hank','Arlo','Gus','Owen'];
const LASTS=['Hart','Rivers','Bloom','Fairway','Calloway','Thorne','Waverly','Pemberton','Ashby','Holloway','Kestrel','Marsh','Larkin','Sutter','Vance','Ember','Lowell','Finch'];
const NEIGHBORS=[
 {first:'Rosa',last:'Delgado',app:{body:'f',skin:2,hair:'long',hairC:'#221c22',top:'#d9603b',topS:'tee',bot:'#2f3e5c',botS:'skirt',shoes:'#3a2a25',beard:0},traits:['social','foodie','cheerful']},
 {first:'Marcus',last:'Bell',app:{body:'m',skin:4,hair:'buzz',hairC:'#221c22',top:'#4f7fd6',topS:'tee',bot:'#3a3338',botS:'pants',shoes:'#f2efe6',beard:1},traits:['athletic','workaholic','charmer']},
 {first:'Priya',last:'Raman',app:{body:'f',skin:3,hair:'bun',hairC:'#221c22',top:'#3e9e9a',topS:'long',bot:'#e6dfd0',botS:'pants',shoes:'#6b4a33',beard:0},traits:['genius','bookworm','neat']},
 {first:'Theo',last:'Lindqvist',app:{body:'m',skin:0,hair:'curly',hairC:'#dcb35e',top:'#8e5ba8',topS:'tee',bot:'#556b45',botS:'shorts',shoes:'#a83f3a',beard:0},traits:['musical','slob','nightowl']},
 {first:'June',last:'Park',app:{body:'f',skin:1,hair:'bob',hairC:'#221c22',top:'#e2a53a',topS:'long',bot:'#6f4f8a',botS:'skirt',shoes:'#3a3338',beard:0},traits:['artistic','loner','green']},
 {first:'Hank',last:'Ortiz',app:{body:'m',skin:2,hair:'bald',hairC:'#4a2f22',top:'#6fa35a',topS:'tee',bot:'#c7b48d',botS:'pants',shoes:'#6b4a33',beard:1},traits:['couch','cheerful','social']},
 {first:'Willa',last:'Moss',app:{body:'f',skin:1,hair:'ponytail',hairC:'#b0632f',top:'#c95b7d',topS:'tee',bot:'#2f3e5c',botS:'shorts',shoes:'#f2efe6',beard:0},traits:['athletic','green','charmer']},
 {first:'Dev',last:'Okafor',app:{body:'m',skin:5,hair:'short',hairC:'#221c22',top:'#f2efe6',topS:'long',bot:'#2f3e5c',botS:'pants',shoes:'#3a2a25',beard:0},traits:['genius','workaholic','loner']},
];
const SAMPLE=[
 {first:'Jamie',last:'Hart',app:{body:'f',skin:1,hair:'ponytail',hairC:'#7b4a2a',top:'#e2a53a',topS:'tee',bot:'#2f3e5c',botS:'pants',shoes:'#a83f3a',beard:0},traits:['foodie','social','cheerful'],job:{career:'culinary',level:0,perf:45},skills:{cooking:280,charisma:120}},
 {first:'Alex',last:'Hart',app:{body:'m',skin:3,hair:'short',hairC:'#221c22',top:'#3e9e9a',topS:'long',bot:'#3a3338',botS:'pants',shoes:'#f2efe6',beard:1},traits:['bookworm','musical','neat'],job:{career:'tech',level:0,perf:40},skills:{logic:300,guitar:110}},
];

// ---------- socials ----------
const SOCIALS={
 greet:{l:'Introduce Yourself',cat:'Friendly',dur:6,base:.95,f:[8,0],soc:10,req:(r)=>!r.met},
 chat:{l:'Chat',cat:'Friendly',dur:10,base:.9,f:[4,-2],soc:14,req:(r)=>r.met},
 joke:{l:'Tell a Joke',cat:'Friendly',dur:8,base:.7,f:[6,-4],soc:12,fun:10,req:(r)=>r.met,icon:'fun'},
 compliment:{l:'Compliment',cat:'Friendly',dur:6,base:.85,f:[6,-3],soc:10,req:(r)=>r.f>=10},
 hobbies:{l:'Talk About Hobbies',cat:'Friendly',dur:12,base:.85,f:[8,-2],soc:16,fun:6,req:(r)=>r.f>=25},
 hug:{l:'Hug',cat:'Friendly',dur:5,base:.85,f:[8,-6],soc:14,req:(r)=>r.f>=40,pose:'hug',icon:'heart'},
 flirt:{l:'Flirt',cat:'Romantic',dur:8,base:.55,r:[8,-4],f:[2,-4],soc:10,req:(r)=>r.f>=15,rom:1,icon:'heart'},
 admire:{l:'Admire Their Looks',cat:'Romantic',dur:6,base:.7,r:[6,-3],soc:8,req:(r)=>r.r>=10,rom:1,icon:'heart'},
 kiss:{l:'Kiss',cat:'Romantic',dur:5,base:.65,r:[12,-8],soc:12,req:(r)=>r.r>=35,rom:1,pose:'hug',icon:'heart'},
 partner:{l:'Ask to Be Partners',cat:'Romantic',dur:8,base:.75,soc:10,req:(r)=>r.r>=55&&r.f>=40&&!r.partner,rom:1,special:'partner',icon:'heart'},
 propose:{l:'Propose',cat:'Romantic',dur:10,base:.8,soc:12,req:(r)=>r.partner&&!r.married&&r.r>=75,rom:1,special:'propose',icon:'heart'},
 moveIn:{l:'Ask to Move In',cat:'Special',dur:8,base:.85,soc:8,req:(r,a,b)=>b.role!=='household'&&(r.partner||r.f>=70),special:'moveIn',icon:'home'},
 invite:{l:'Invite Inside',cat:'Special',dur:4,base:.8,soc:6,req:(r,a,b)=>b.visit&&b.visit.kind==='walker',special:'invite',icon:'home'},
 goodbye:{l:'Say Goodbye',cat:'Special',dur:3,base:1,soc:4,req:(r,a,b)=>b.visit&&b.visit.kind!=='walker'&&b.role!=='household',special:'leave'},
 insult:{l:'Insult',cat:'Mean',dur:6,base:.95,f:[-12,-12],soc:4,mean:1,req:(r)=>r.met,icon:'frown'},
 argue:{l:'Argue',cat:'Mean',dur:10,base:.95,f:[-8,-8],soc:6,mean:1,req:(r)=>r.met,icon:'frown'},
 prank:{l:'Prank',cat:'Mean',dur:8,base:.5,f:[4,-8],soc:8,fun:12,req:(r)=>r.met,icon:'fun'},
};

// ---------- work events ----------
const WORK_EVENTS=[
 {t:'Your boss asks you to stay late to finish a big project.',a:['Stay late',{perf:12,energy:-15,fun:-10}],b:['Head home on time',{perf:-4}]},
 {t:'A coworker takes credit for your idea in a meeting.',a:['Speak up','charisma',{perf:14,mood:'confident'},{perf:-6,mood:'awkward'}],b:['Let it go',{fun:-8}]},
 {t:'There is a surprise inspection today.',a:['Prepare extra','$',{perf:15},{perf:-8}],b:['Wing it',0.5,{perf:6},{perf:-10}]},
 {t:'The team is ordering lunch. Treat everyone for $60?',a:['My treat',{money:-60,perf:8,social:15}],b:['Pass',{}]},
 {t:'You spot a way to save the company a lot of money.',a:['Pitch it','logic',{perf:16,money:200},{perf:-4}],b:['Keep quiet',{}]},
 {t:'A mentor offers to teach you after hours.',a:['Learn from them',{xp:120,energy:-10}],b:['No thanks',{}]},
 {t:'The office is holding a charity bake-off.',a:['Bake something','cooking',{perf:10,mood:'hadFun'},{perf:-3,mood:'awkward'}],b:['Just eat',{hunger:20,fun:6}]},
 {t:'You are offered the lead on the next big project.',a:['Take the lead','$',{perf:20},{perf:-10}],b:['Support the team',{perf:5}]},
 {t:'A storm knocks out the power at work.',a:['Help get things running','logic',{perf:12},{perf:-2}],b:['Nap at your desk',{energy:20,perf:-5}]},
 {t:'Your rival challenges you to a friendly race after work.',a:['You are on','fitness',{perf:12,mood:'hadFun'},{perf:-5}],b:['Decline',{fun:-5}]},
 {t:'An angry client demands to see the manager.',a:['Calm them down','charisma',{perf:15},{perf:-8,mood:'awkward'}],b:['Pass it up the chain',{perf:-3}]},
 {t:'A coworker invites you to the after-work trivia team.',a:['Join in','logic',{social:25,perf:6,mood:'hadFun'},{social:20,mood:'awkward'}],b:['Go straight home',{energy:5}]},
];

// ---------- wishes & rewards ----------
const REWARDS=[
 {id:'bladder',l:'Iron Bladder',cost:2500,d:'Bladder drains half as fast.'},
 {id:'fresh',l:'Always Fresh',cost:2500,d:'Hygiene drains 40% slower.'},
 {id:'appetite',l:'Light Eater',cost:3000,d:'Hunger drains 30% slower.'},
 {id:'energy',l:'Bottomless Energy',cost:3500,d:'Energy drains 25% slower.'},
 {id:'study',l:'Quick Study',cost:4000,d:'Every skill is learned 30% faster.'},
 {id:'magnet',l:'Magnetic Personality',cost:5000,d:'Relationships grow 50% faster.'},
 {id:'office',l:'Office Star',cost:5000,d:'Work performance rises 30% faster.'},
 {id:'sunshine',l:'Sunshine Soul',cost:7500,d:'A permanent +15 mood boost.'},
 {id:'penny',l:'Lucky Penny',cost:9000,d:'Find $75 on the porch every morning.'},
];
const ART_ADJ=['Quiet','Golden','Blue','Autumn','Hidden','Restless','Gentle','Wild','Lonely','Bright','Misty','Velvet','Paper','Distant','Evening','Copper'];
const ART_NOUN=['Harbor','Maples','Reverie','Fields','Lighthouse','Garden','Window','Hills','River','Morning','Orchard','Street','Meadow','Rooftops','Lantern','Pines'];
