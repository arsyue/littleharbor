import {houses} from './places.mjs';
import {extraRooms,extraBase,expandRoom} from './expansion-rooms.mjs';
export const ROOM={width:1280,height:800,top:285,bottom:758,exit:{id:'exit',name:'EXIT · Town',x:640,y:727}};
const themes={
 "library": {
  "color": "#9d784c"
 },
 "market": {
  "color": "#3b9a9e"
 },
 "workshop": {
  "color": "#be8952"
 },
 "harbor": {
  "color": "#498390"
 },
 "aquarium": {
  "color": "#4c9ea2"
 },
 "cafe": {
  "color": "#d38a70"
 },
 "garden": {
  "color": "#759459"
 },
 "lighthouse": {
  "color": "#7599af"
 },
 "bakery": {
  "color": "#c48989"
 },
 "studio": {
  "color": "#9b85b3"
 },
 "post": {
  "color": "#5e9f9d"
 },
 "music": {
  "color": "#ad8c66"
 }
};
export const roomJobs={
 "library": [
  [
   "Book returns",
   "Sort three returned books.",
   [
    [
     "A visitor wants a true book about dolphins. Which shelf should you choose?",
     "Nature",
     [
      "Nature",
      "Fairy tales",
      "Recipes"
     ]
    ],
    [
     "The books are ordered by title: Boats, Coral, Dolphins. Where does Clams belong?",
     "Between Boats and Coral",
     [
      "Before Boats",
      "Between Boats and Coral",
      "After Dolphins"
     ]
    ],
    [
     "A book is due on Friday. You return it on Thursday. Is it late?",
     "No, it is early",
     [
      "Yes, one day late",
      "No, it is early",
      "It has no due date"
     ]
    ]
   ]
  ],
  [
   "Reading desk",
   "Help a reader follow the clues.",
   [
    [
     "The note says: “After lunch, meet by the window.” When should you meet?",
     "After lunch",
     [
      "Before breakfast",
      "After lunch",
      "At midnight"
     ]
    ],
    [
     "“Please borrow this book, then bring it back.” What does borrow mean?",
     "Use it and return it",
     [
      "Keep it forever",
      "Use it and return it",
      "Throw it away"
     ]
    ],
    [
     "A story begins on a boat and ends at a lighthouse. Where does it end?",
     "At a lighthouse",
     [
      "On a boat",
      "In a bakery",
      "At a lighthouse"
     ]
    ]
   ]
  ]
 ],
 "market": [
  [
   "Care station",
   "Prepare the fish-care supplies.",
   [
    [
     "A small fish needs a safe hiding place. What should you add?",
     "A smooth cave",
     [
      "A sharp hook",
      "A smooth cave",
      "A paper bag"
     ]
    ],
    [
     "The label says “Feed a small pinch.” Which amount is right?",
     "A little food",
     [
      "A whole jar",
      "A little food",
      "No food ever"
     ]
    ],
    [
     "Mia checks the water before adding fish. Why?",
     "To keep the fish healthy",
     [
      "To change their names",
      "To keep the fish healthy",
      "To paint the tank"
     ]
    ]
   ]
  ],
  [
   "Order board",
   "Work out a customer’s order.",
   [
    [
     "A customer buys two guppies, then adds one more. How many guppies?",
     "Three",
     [
      "Two",
      "Three",
      "Four"
     ]
    ],
    [
     "The order says a blue fish and a green plant. Which pair is correct?",
     "Blue tang and seaweed",
     [
      "Goldfish and shell",
      "Blue tang and seaweed",
      "Betta and chest"
     ]
    ],
    [
     "The customer says, “Could I have another one?” What do they want?",
     "One more",
     [
      "A different shop",
      "One more",
      "Nothing"
     ]
    ]
   ]
  ]
 ],
 "workshop": [
  [
   "Tool bench",
   "Choose tools and follow a plan.",
   [
    [
     "Measure a shelf before cutting it. Which tool comes first?",
     "A ruler",
     [
      "A paintbrush",
      "A ruler",
      "A watering can"
     ]
    ],
    [
     "The instructions say: sand, paint, then dry. What comes after sanding?",
     "Painting",
     [
      "Painting",
      "Packing",
      "Washing"
     ]
    ],
    [
     "Two arches need three stones each. How many stones do you need?",
     "Six",
     [
      "Three",
      "Five",
      "Six"
     ]
    ]
   ]
  ],
  [
   "Packing table",
   "Get decorations ready for delivery.",
   [
    [
     "A fragile shell must travel safely. How should you pack it?",
     "Wrap it carefully",
     [
      "Drop it in loose",
      "Wrap it carefully",
      "Leave it uncovered"
     ]
    ],
    [
     "A label reads “Keep upright.” Which side stays on top?",
     "The top of the box",
     [
      "The bottom of the box",
      "The top of the box",
      "Any side"
     ]
    ],
    [
     "Ben packs four castles and sends one. How many remain?",
     "Three",
     [
      "Two",
      "Three",
      "Five"
     ]
    ]
   ]
  ]
 ],
 "harbor": [
  [
   "Chart table",
   "Plan a safe route for a boat.",
   [
    [
     "The island is east of the harbor. Which direction should the boat travel?",
     "East",
     [
      "West",
      "North",
      "East"
     ]
    ],
    [
     "A storm arrives at noon. A trip ends at ten in the morning. Is it before the storm?",
     "Yes, before noon",
     [
      "No, after noon",
      "Yes, before noon",
      "At midnight"
     ]
    ],
    [
     "The chart marks shallow water. What should a large boat do?",
     "Choose deeper water",
     [
      "Sail straight over it",
      "Choose deeper water",
      "Turn off its lights"
     ]
    ]
   ]
  ],
  [
   "Cargo desk",
   "Check a delivery for the captain.",
   [
    [
     "There are six boxes on one boat and five on another. Total?",
     "Eleven",
     [
      "Ten",
      "Eleven",
      "Twelve"
     ]
    ],
    [
     "A parcel is marked “For the bakery.” Where should it go?",
     "Rose Bakery",
     [
      "Glass Garden",
      "Rose Bakery",
      "Harbor Library"
     ]
    ],
    [
     "The boat leaves at nine. The crew must arrive earlier. Choose a time.",
     "Eight thirty",
     [
      "Eight thirty",
      "Nine thirty",
      "Ten"
     ]
    ]
   ]
  ]
 ],
 "aquarium": [
  [
   "Care notebook",
   "Make a healthy aquarium plan.",
   [
    [
     "You want room for more fish and plants. What should you upgrade?",
     "The tank",
     [
      "The notebook",
      "The tank",
      "The door"
     ]
    ],
    [
     "A plant is behind a rock. Which object is in front?",
     "The rock",
     [
      "The plant",
      "The rock",
      "Neither"
     ]
    ],
    [
     "Your tank holds twenty fish and has eighteen. How many spaces remain?",
     "Two",
     [
      "One",
      "Two",
      "Three"
     ]
    ]
   ]
  ],
  [
   "Observation point",
   "Look closely and compare.",
   [
    [
     "A fish moves with its fins. What helps a bird move through the air?",
     "Wings",
     [
      "Roots",
      "Wings",
      "Scales"
     ]
    ],
    [
     "A guppy is smaller than a goldfish. Which is larger?",
     "The goldfish",
     [
      "The guppy",
      "The goldfish",
      "They are the same"
     ]
    ],
    [
     "There are three striped fish and four plain fish. Total?",
     "Seven",
     [
      "Six",
      "Seven",
      "Eight"
     ]
    ]
   ]
  ]
 ],
 "cafe": [
  [
   "Order counter",
   "Listen to what the customer needs.",
   [
    [
     "“I would like milk, but no sugar.” What should you leave out?",
     "Sugar",
     [
      "Milk",
      "The cup",
      "Sugar"
     ]
    ],
    [
     "Table two wants two teas. Table three wants one tea. Total teas?",
     "Three",
     [
      "Two",
      "Three",
      "Four"
     ]
    ],
    [
     "The drink is too hot. What is a polite suggestion?",
     "Please let it cool first",
     [
      "Drink it quickly",
      "Please let it cool first",
      "Put the cup on the floor"
     ]
    ]
   ]
  ],
  [
   "Menu stand",
   "Help choose a meal within a budget.",
   [
    [
     "A cake costs four coins and milk costs three. Total?",
     "Seven coins",
     [
      "Six coins",
      "Seven coins",
      "Eight coins"
     ]
    ],
    [
     "You have ten coins and spend seven. Change?",
     "Three coins",
     [
      "Two coins",
      "Three coins",
      "Four coins"
     ]
    ],
    [
     "A guest says they are thirsty. Which item would help?",
     "A glass of water",
     [
      "A napkin",
      "A glass of water",
      "An empty plate"
     ]
    ]
   ]
  ]
 ],
 "garden": [
  [
   "Plant care",
   "Help the plants grow.",
   [
    [
     "The soil is dry. What should you use?",
     "A watering can",
     [
      "A hammer",
      "A watering can",
      "A violin"
     ]
    ],
    [
     "A seed grows roots first. Where do the roots grow?",
     "In the soil",
     [
      "In the clouds",
      "In the soil",
      "On a bookshelf"
     ]
    ],
    [
     "A plant needs sunlight. Choose a good place.",
     "Near a bright window",
     [
      "Inside a closed box",
      "Near a bright window",
      "Under a dark cupboard"
     ]
    ]
   ]
  ],
  [
   "Seed cabinet",
   "Sort the seeds and supplies.",
   [
    [
     "Two pots each need three seeds. How many seeds?",
     "Six",
     [
      "Three",
      "Five",
      "Six"
     ]
    ],
    [
     "The tall plant goes behind the short plant. Which is at the front?",
     "The short plant",
     [
      "The tall plant",
      "The short plant",
      "Both behind"
     ]
    ],
    [
     "The label says “Water every morning.” When should you water?",
     "In the morning",
     [
      "Only at midnight",
      "In the morning",
      "Once a year"
     ]
    ]
   ]
  ]
 ],
 "lighthouse": [
  [
   "Signal desk",
   "Help boats understand a message.",
   [
    [
     "A warning says “Fog ahead.” What may be difficult to see?",
     "The route",
     [
      "The lunch menu",
      "The route",
      "The calendar"
     ]
    ],
    [
     "The light flashes twice, pauses, then repeats. What comes after two flashes?",
     "A pause",
     [
      "Three bells",
      "A pause",
      "A new boat"
     ]
    ],
    [
     "A boat is lost after sunset. Which landmark helps it find shore?",
     "The lighthouse",
     [
      "A closed book",
      "The lighthouse",
      "A small flower"
     ]
    ]
   ]
  ],
  [
   "Weather station",
   "Read the weather and make a plan.",
   [
    [
     "Strong wind is expected this afternoon. When is the calmer trip?",
     "This morning",
     [
      "This evening",
      "This morning",
      "During the storm"
     ]
    ],
    [
     "The sea is rough. What is the safest plan?",
     "Wait in the harbor",
     [
      "Rush into the waves",
      "Wait in the harbor",
      "Ignore the weather"
     ]
    ],
    [
     "Yesterday was cloudy; today is clear. When can you see farther?",
     "Today",
     [
      "Yesterday",
      "Today",
      "Never"
     ]
    ]
   ]
  ]
 ],
 "bakery": [
  [
   "Bakery cart",
   "Follow a baker’s recipe.",
   [
    [
     "Mix the ingredients before baking. What happens first?",
     "Mixing",
     [
      "Baking",
      "Mixing",
      "Serving"
     ]
    ],
    [
     "Three trays hold four rolls each. How many rolls?",
     "Twelve",
     [
      "Seven",
      "Twelve",
      "Nine"
     ]
    ],
    [
     "The bread is hot from the oven. What should you do before packing it?",
     "Let it cool",
     [
      "Put it in your pocket",
      "Let it cool",
      "Add a book"
     ]
    ]
   ]
  ],
  [
   "Delivery baskets",
   "Fill the morning orders.",
   [
    [
     "One basket needs two rolls and one cake. Total items?",
     "Three",
     [
      "Two",
      "Three",
      "Four"
     ]
    ],
    [
     "You baked eight rolls and sold five. How many remain?",
     "Three",
     [
      "Two",
      "Three",
      "Four"
     ]
    ],
    [
     "A customer asks for fresh bread. Which bread should you choose?",
     "Bread baked today",
     [
      "Bread baked last month",
      "Bread baked today",
      "An empty basket"
     ]
    ]
   ]
  ]
 ],
 "studio": [
  [
   "Color table",
   "Plan a seaside painting.",
   [
    [
     "Mix blue and yellow paint. Which color do you get?",
     "Green",
     [
      "Purple",
      "Green",
      "Orange"
     ]
    ],
    [
     "Paint the sky before the small birds. What is painted first?",
     "The background",
     [
      "The bird eyes",
      "The background",
      "The frame"
     ]
    ],
    [
     "The shell is lighter than the rock. Which needs a darker shade?",
     "The rock",
     [
      "The shell",
      "The rock",
      "Both white"
     ]
    ]
   ]
  ],
  [
   "Gallery stand",
   "Arrange an art exhibition.",
   [
    [
     "Six paintings go equally on two walls. How many on each wall?",
     "Three",
     [
      "Two",
      "Three",
      "Four"
     ]
    ],
    [
     "Put the boat picture between the flowers and the lighthouse. Which is in the middle?",
     "The boat",
     [
      "The flowers",
      "The boat",
      "The lighthouse"
     ]
    ],
    [
     "A visitor says, “What a beautiful painting!” What is a polite reply?",
     "Thank you very much",
     [
      "Go away",
      "Thank you very much",
      "That is a table"
     ]
    ]
   ]
  ]
 ],
 "post": [
  [
   "Sorting desk",
   "Send each letter to the right place.",
   [
    [
     "A letter says “To Captain Finn, Harbor Office.” Who receives it?",
     "Captain Finn",
     [
      "Mia",
      "Captain Finn",
      "Ben"
     ]
    ],
    [
     "A parcel must arrive before Friday. Which day is early enough?",
     "Thursday",
     [
      "Saturday",
      "Thursday",
      "Sunday"
     ]
    ],
    [
     "You have nine letters and deliver four. How many are left?",
     "Five",
     [
      "Four",
      "Five",
      "Six"
     ]
    ]
   ]
  ],
  [
   "Parcel scales",
   "Prepare parcels for their journey.",
   [
    [
     "A small parcel is lighter than a large one. Which weighs more?",
     "The large parcel",
     [
      "The small parcel",
      "The large parcel",
      "They weigh the same"
     ]
    ],
    [
     "Two stamps cost three coins each. Total?",
     "Six coins",
     [
      "Three coins",
      "Five coins",
      "Six coins"
     ]
    ],
    [
     "The address is missing. What should you ask the sender?",
     "Where should it go?",
     [
      "What color is the sky?",
      "Where should it go?",
      "Can fish sing?"
     ]
    ]
   ]
  ]
 ],
 "music": [
  [
   "Instrument corner",
   "Choose instruments for the concert.",
   [
    [
     "Which instrument has black and white keys?",
     "A piano",
     [
      "A drum",
      "A piano",
      "A violin"
     ]
    ],
    [
     "A violin uses a bow. Which item belongs with it?",
     "The bow",
     [
      "A watering can",
      "The bow",
      "A rolling pin"
     ]
    ],
    [
     "The music says “Play softly.” How should it sound?",
     "Quiet",
     [
      "Very loud",
      "Quiet",
      "Silent forever"
     ]
    ]
   ]
  ],
  [
   "Concert board",
   "Organize a performance.",
   [
    [
     "The flute plays first and the piano plays after it. Which begins?",
     "The flute",
     [
      "The piano",
      "The flute",
      "Both last"
     ]
    ],
    [
     "Three musicians each need two pages. Total pages?",
     "Six",
     [
      "Five",
      "Six",
      "Eight"
     ]
    ],
    [
     "The audience is listening. What should you do between songs?",
     "Wait quietly",
     [
      "Shout over the music",
      "Wait quietly",
      "Run across the stage"
     ]
    ]
   ]
  ]
 ]
};

export const upstairsJobs={"lighthouse":[["Telescope","Read the explorer’s observation log.",[["The red sail is north of the island. The blue sail is south. Which sail is farther north?","The red sail",["The red sail","The blue sail","Both south"]],["A boat was small in the distance and now looks larger. What is it doing?","Coming closer",["Moving farther away","Coming closer","Disappearing"]],["The log says “Visibility is excellent.” What does that mean?","You can see clearly",["You cannot see far","You can see clearly","It is raining heavily"]]]],["Lantern log","Keep the lighthouse ready for the night.",[["The lantern was checked at four. Sunset is at six. How long before sunset was the check?","Two hours",["One hour","Two hours","Three hours"]],["The glass is dusty. What should happen before lighting the lantern?","Clean the glass",["Cover the windows","Clean the glass","Hide the logbook"]],["A steady light does not flicker. Which description matches?","It shines continuously",["It flashes randomly","It shines continuously","It never shines"]]]]],"post":[["Loft parcels","Sort parcels for tomorrow’s deliveries.",[["Eight parcels go to the east street and seven go west. How many parcels in all?","Fifteen",["Fourteen","Fifteen","Sixteen"]],["The note says “Deliver after breakfast, before lunch.” Choose a time.","Ten in the morning",["Ten in the morning","Six in the evening","Midnight"]],["The parcel is too heavy for one person. What should you do?","Ask for help",["Carry it on your head","Ask for help","Throw it downstairs"]]]],["Delivery map","Plan the post carrier’s route.",[["Visit the bakery first, the cafe second, and the library last. Where do you finish?","The library",["The bakery","The cafe","The library"]],["The workshop is next to the garden. “Next to” means…","Beside",["Far from","Beside","Inside"]],["A street is closed. What should the carrier do?","Find another route",["Ignore the sign","Find another route","Stop delivering forever"]]]]]};
const furniture={"library":[["reading-table",680,535,325]],"market":[["display-tank",715,540,340]],"workshop":[["workbench",680,540,330]],"harbor":[["chart-table",680,535,320]],"aquarium":[["display-tank",615,525,350],["planter",1000,550,185]],"cafe":[["cafe-table",650,525,250],["cafe-table",975,545,210]],"garden":[["planter",660,540,300],["planter",985,550,190]],"lighthouse":[["chart-table",720,545,300]],"bakery":[["bread-table",675,540,325]],"studio":[["art-easel",710,520,245]],"post":[["parcel-table",665,540,320]],"music":[["piano",710,535,350]]};
function baseRoomFor(house,floor=0){
 const id=house.id.replace('house-','');floor=floor&&upstairsJobs[id]?1:0;const jobs=floor?upstairsJobs[id]:roomJobs[id];
 const pieces=(floor?[[id==='post'?'parcel-table':'chart-table',790,430,280]]:furniture[id]).map(([asset,x,y,width],i)=>({id:'furniture-'+i,asset,x,y,width,box:{x:x-width*.42,y:y-65,w:width*.84,h:80}}));
 const center=pieces[0],second=pieces[1];
 const exit={...ROOM.exit,y:floor?(id==='lighthouse'?520:625):ROOM.exit.y,name:floor?'DOWNSTAIRS':'EXIT · Town',kind:'exit'};
 const holes=floor?[{x:435,y:id==='lighthouse'?552:660,w:410,h:250}]:[];
 const spawn=floor?{x:310,y:560}:{x:430,y:650};
 const spots=[
 {id:'host',name:({lily:'Lily',mia:'Mia',ben:'Ben',finn:'Captain Finn'})[house.person],detail:'Help a friend',x:id==='lighthouse'&&!floor?350:410,y:id==='lighthouse'&&!floor?430:385,kind:'person',person:house.person,reward:[20,35,50][house.level]},
 ...jobs.map((j,i)=>({id:'job-'+i,name:j[0],detail:j[1],x:i?(second?.x??950):center.x,y:i?(second?second.y+58:385):center.y+58,kind:'object',furniture:i?(second?.id??null):center.id,reward:[25,35,45][house.level]})),
 exit
 ];
 if(!floor&&upstairsJobs[id])spots.push({id:'stairs',name:'UPSTAIRS',detail:id==='post'?'Explore the Sorting Loft':'Explore the Observatory',kind:'stairs',x:id==='post'?1030:430,y:id==='post'?345:305});
 return {id:house.id,theme:id,floor,name:house.name+(floor?(id==='post'?' · Sorting Loft':' · Observatory'):''),color:themes[id].color,image:'../assets/rooms-v5/'+id+(floor?'-upstairs':'')+'.webp',objects:pieces,holes,exit,spawn,spots};
}
const defaultFloor=[[245,285],[1035,285],[1230,758],[50,758]];
function closestPoint(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return{x:a[0]+t*dx,y:a[1]+t*dy};}
export function onFloor(x,y,room=null){const polygon=room?.polygon||defaultFloor;let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j],p=closestPoint(x,y,a,b);if(Math.hypot(p.x-x,p.y-y)<.02)return true;if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
export function floorPoint(x,y,room=null){if(onFloor(x,y,room))return{x,y};const p=room?.polygon||defaultFloor;let best=null,d=Infinity;for(let i=0;i<p.length;i++){const q=closestPoint(x,y,p[i],p[(i+1)%p.length]),n=Math.hypot(q.x-x,q.y-y);if(n<d){best=q;d=n;}}return best;}
export function roomWalkable(room,x,y){return onFloor(x,y,room)&&![...room.objects.map(o=>o.box),...room.holes].some(b=>x>b.x-12&&x<b.x+b.w+12&&y>b.y-12&&y<b.y+b.h+12);}
export function nearestSpot(room,p){return room.spots.map(s=>({...s,distance:Math.hypot(s.x-p.x,s.y-p.y)})).filter(s=>s.distance<(s.id==='exit'?82:s.id==='stairs'?68:75)).sort((a,b)=>a.distance-b.distance)[0]||null;}
export function activityFor(id,spotId){
 const house=houses.find(h=>h.id===id);if(!house)return null;
 const floor=spotId.startsWith('balcony-')?2:spotId.startsWith('up-')?1:0,localId=spotId.replace(/^(up-|balcony-)/,'');
 const room=roomFor(house,floor),spot=room.spots.find(s=>s.id===localId);
 if(!spot||spot.kind!=='object'||room.floor!==floor)return null;
 const jobs=room.activityJobs||(floor?upstairsJobs[room.theme]:roomJobs[room.theme]),job=jobs[Number(localId.slice(4))];
 return {...spot,questions:job[2].map(([q,a,choices])=>[q,'',choices,a])};
}
// Route around the real furniture footprints; diagonal steps cannot cut corners.
export function roomRoute(room,start,target){
 const step=24,cols=Math.ceil(ROOM.width/step),rows=Math.ceil(ROOM.height/step),nodes=[];
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const p={x:x*step+step/2,y:y*step+step/2,k:y*cols+x};if(roomWalkable(room,p.x,p.y))nodes.push(p);}
 const closest=p=>nodes.reduce((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)<Math.hypot(b.x-p.x,b.y-p.y)?a:b);
 const a=closest(start),b=closest(target),valid=new Map(nodes.map(n=>[n.k,n])),queue=[a.k],prev=new Map([[a.k,null]]);
 for(let i=0;i<queue.length&&!prev.has(b.k);i++){const k=queue[i],x=k%cols,y=Math.floor(k/cols);
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const nx=x+dx,ny=y+dy,n=ny*cols+nx;if(nx<0||nx>=cols||ny<0||ny>=rows||!valid.has(n)||prev.has(n))continue;
   if(dx&&dy&&(!valid.has(y*cols+nx)||!valid.has(ny*cols+x)))continue;prev.set(n,k);queue.push(n);
  }
 }
 if(!prev.has(b.k))return [];
 const route=[];for(let k=b.k;k!==null;k=prev.get(k))route.push({x:valid.get(k).x,y:valid.get(k).y});route.reverse();
 // Keep the exact requested endpoint only if its final segment is clear.
 const end=route.at(-1);if(roomWalkable(room,target.x,target.y)&&Array.from({length:9},(_,i)=>roomWalkable(room,end.x+(target.x-end.x)*i/8,end.y+(target.y-end.y)*i/8)).every(Boolean))route.push({x:target.x,y:target.y});
 return route;
}

export function roomFor(house,floor=0){return expandRoom(floor===2?null:extraRooms[house.id.slice(6)]?extraBase(house,floor):baseRoomFor(house,floor),house,floor);}

export function roomArrival(room,spotId){
 const spot=room.spots.find(s=>s.id===spotId);if(!spot)return{...room.spawn};
 const desired=floorPoint(spot.x,spot.y+80,room);
 if(roomWalkable(room,desired.x,desired.y))return desired;
 // Follow the clear path away from the doorway when furniture blocks its front.
 const route=roomRoute(room,spot,room.spawn);
 return route.find(p=>Math.hypot(p.x-spot.x,p.y-spot.y)>=80)||route.at(-1)||{...room.spawn};
}
