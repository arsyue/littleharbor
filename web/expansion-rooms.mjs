export const extraRooms={
 bistro:{color:'#789389',pieces:[['cafe-table',640,500,240],['cafe-table',960,570,210]],door:[885,345],host:[410,390],work:'restaurant'},
 inn:{color:'#a98760',pieces:[['parcel-table',840,530,260]],door:[255,370],host:[700,400]},
 pottery:{color:'#bc8863',pieces:[['workbench',560,510,310],['planter',975,570,180]],door:[920,345],host:[430,395],work:'pottery'},
 museum:{color:'#7e9c9e',pieces:[['reading-table',780,520,310]],door:[895,345],host:[415,420],work:'museum'}
};
const jobs=[
 ['Visitor desk','Help a visitor understand the directions.',[
 ['A visitor asks where the exit is. What should you do?','Give clear directions',['Ignore the question','Give clear directions','Hide the sign']],
 ['The garden is beside this building. Beside means…','Next to',['Above','Next to','Far away']],
 ['Someone says “Could you help me, please?” Choose a friendly reply.','Of course, how can I help?',['Go away','Of course, how can I help?','Do not ask']]]],
 ['Packing station','Prepare a careful delivery.',[
 ['An item is fragile. What does that mean?','Easy to break',['Easy to break','Very fast','Always blue']],
 ['Wrap the item, put it in a box, then add the label. What comes last?','Add the label',['Wrap the item','Add the label','Open the box']],
 ['Three parcels go east and two go west. How many parcels?','Five',['Four','Five','Six']]]]
];
const balconyJobs=[
 ['View finder','Observe the view and describe it.',[
 ['A sailboat moves beyond the railing. Where is it?','Beyond the balcony',['Inside the room','Beyond the balcony','Under the table']],
 ['A breeze moves the leaves. What is a breeze?','A light wind',['A heavy storm','A light wind','A warm lamp']],
 ['The balcony is higher than the street. Which direction is the street?','Below',['Above','Below','Inside']]]],
 ['Garden care','Keep the balcony welcoming.',[
 ['The soil is dry. What should the plant receive?','A little water',['A little water','A blanket','A book']],
 ['A chair is blocking the doorway. Where should it go?','Beside the wall',['Across the door','Beside the wall','On the railing']],
 ['Flowers need sunlight. Where should you place them?','In a bright spot',['In a drawer','In a bright spot','Under a bed']]]]
];
const plans={
 library:[[245,285],[1035,285],[1230,758],[50,758]],
 market:[[210,280],[1070,280],[1230,758],[50,758]],
 workshop:[[200,285],[810,285],[810,340],[1100,340],[1230,758],[50,758]],
 harbor:[[270,285],[1010,285],[1160,480],[1230,758],[50,758],[120,480]],
 aquarium:[[200,300],[1080,300],[1230,758],[50,758]],
 cafe:[[240,290],[1040,290],[1200,690],[1100,758],[80,758]],
 garden:[[170,285],[1110,285],[1180,758],[100,758]],
 lighthouse:[[250,285],[1030,285],[1180,520],[1200,758],[80,758],[100,520]],
 bakery:[[200,285],[1080,285],[1230,758],[50,758]],studio:[[280,285],[1000,285],[1210,758],[70,758]],
 post:[[240,285],[1040,285],[1230,758],[50,758]],music:[[225,285],[1055,285],[1200,758],[80,758]],
 bistro:[[220,290],[1070,290],[1070,375],[1205,375],[1205,758],[75,758],[75,375],[220,375]],
 inn:[[220,295],[1050,295],[1050,420],[1210,420],[1210,758],[70,758],[70,500],[220,500]],
 pottery:[[190,285],[1090,285],[1210,758],[70,758]],
 museum:[[260,285],[1020,285],[1170,410],[1220,758],[60,758],[110,410]]
};
function piece([asset,x,y,width],i){return{id:'furniture-'+i,asset,x,y,width,box:{x:x-width*.42,y:y-65,w:width*.84,h:80}};}
export function extraBase(house,floor=0){
 const id=house.id.slice(6),spec=extraRooms[id],upper=id==='inn'&&floor===1;
 const objects=(upper?[['reading-table',780,510,280]]:spec.pieces).map(piece);
 const exit={id:'exit',kind:'exit',name:upper?'DOWNSTAIRS':'EXIT · Town',x:upper?900:640,y:upper?620:727};
 const spots=[{id:'host',name:({lily:'Lily',mia:'Mia',ben:'Ben',finn:'Captain Finn'})[house.person],kind:'person',person:house.person,detail:'Help a friend',x:upper?400:spec.host[0],y:upper?410:spec.host[1],reward:35},...jobs.map((j,i)=>({id:'job-'+i,name:j[0],detail:j[1],kind:'object',x:i?(upper?450:990):objects[0].x,y:i?(upper?560:645):objects[0].y+65,furniture:i?null:objects[0].id,reward:35})),exit];
 if(id==='inn'&&!upper)spots.push({id:'stairs',kind:'stairs',name:'UPSTAIRS',detail:'Explore the Guest Lounge',x:440,y:370});
 return{id:house.id,theme:id,floor:upper?1:0,name:house.name+(upper?' · Guest Lounge':''),color:spec.color,image:'../assets/expansion-v7/room-'+id+(upper?'-upstairs':'')+'.webp',objects,holes:upper?[{x:965,y:500,w:315,h:300}]:[],spawn:{x:430,y:650},exit,spots,activityJobs:jobs};
}
export function expandRoom(base,house,floor){
 const id=house.id.slice(6);
 if(floor===2){
  const theme=['harbor','bistro','inn','aquarium','market'].includes(id)?'sea':id==='lighthouse'?'lighthouse':['workshop','pottery','studio','post'].includes(id)?'workshop':'garden';
  const exit={id:'exit',kind:'exit',name:'BACK INSIDE',x:640,y:710};
  const objects=[piece(['cafe-table',875,520,210],0),piece(['planter',310,490,170],1)];
  return{id:house.id,theme:id,floor:2,balcony:true,name:house.name+' · '+(theme==='sea'?'Sea Terrace':theme==='garden'?'Garden Balcony':theme==='lighthouse'?'Viewing Balcony':'Rooftop Terrace'),color:'#8daeb0',image:'../assets/expansion-v7/balcony-'+theme+'.webp',objects,holes:[],spawn:{x:640,y:645},exit,polygon:[[180,400],[1100,400],[1190,755],[90,755]],activityJobs:balconyJobs,spots:[{id:'host',kind:'person',person:house.person,name:'Balcony guide',detail:'Share the view',x:480,y:460,reward:30},{id:'job-0',kind:'object',name:'View finder',detail:'Describe the view',x:875,y:590,furniture:'furniture-0',reward:35},{id:'job-1',kind:'object',name:'Garden care',detail:'Care for the balcony',x:310,y:565,furniture:'furniture-1',reward:30},exit]};
 }
 base.polygon=base.floor?null:plans[id];
 const embedded=extraRooms[id]&&(!base.floor||id==='inn'),door=embedded?(base.floor?[290,390]:extraRooms[id].door):['library','studio','cafe'].includes(id)?[290,470]:[1060,470];
 const [x,y]=door;
 if(!embedded)base.objects.push({id:'balcony-door',asset:'balcony-door',url:'../assets/expansion-v7/balcony-door.webp',x,y:y-50,width:115,box:{x:x-40,y:y-65,w:80,h:16}});
 base.spots.push({id:'balcony',kind:'balcony',name:'BALCONY',detail:'Walk outside and explore',x,y});
 const work=id==='bakery'?'bakery':extraRooms[id]?.work;
 if(!base.floor&&work){const spot=base.spots.find(s=>s.id==='job-0');Object.assign(spot,{id:'work',kind:'work',name:({bakery:'Bake bread',restaurant:'Restaurant shift',pottery:'Pottery studio',museum:'Curator challenge'})[work],detail:'Listen, make choices and finish a real job',work,reward:({bakery:90,restaurant:120,pottery:75,museum:70})[work]});}
 return base;
}
