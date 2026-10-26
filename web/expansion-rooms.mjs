import {gameCatalog} from './activity-catalog.mjs';
export const extraRooms={
 bistro:{color:'#789389',pieces:[['cafe-table',640,500,240],['cafe-table',960,570,210]],host:[410,390],work:'restaurant'},
 inn:{color:'#a98760',pieces:[['parcel-table',840,530,260]],host:[700,400]},
 pottery:{color:'#bc8863',pieces:[['workbench',560,510,310],['planter',975,570,180]],host:[430,395],work:'pottery'},
 museum:{color:'#7e9c9e',pieces:[['reading-table',780,520,310]],host:[415,420],work:'museum'}
};

// Feet coordinates follow the painted thresholds in the 1280 x 800 room art.
// Rooms without a painted doorway use an unobstructed side edge, never a door prop.
const balconyEntrances={
 library:{x:80,y:730,direction:'left',arrival:{x:180,y:690}},
 market:{x:1210,y:735,direction:'right',arrival:{x:1100,y:700}},
 workshop:{x:75,y:730,direction:'left',arrival:{x:180,y:690}},
 harbor:{x:1210,y:725,direction:'right',arrival:{x:1100,y:685}},
 aquarium:{x:135,y:650,direction:'left',arrival:{x:240,y:650}},
 cafe:{x:1110,y:285,direction:'up',arrival:{x:1080,y:390}},
 garden:{x:675,y:285,direction:'up',arrival:{x:675,y:385}},
 lighthouse:{x:1220,y:465,direction:'right',arrival:{x:1120,y:485}},
 bakery:{x:1210,y:730,direction:'right',arrival:{x:1100,y:690}},
 studio:{x:95,y:730,direction:'left',arrival:{x:200,y:690}},
 post:{x:1000,y:245,direction:'up',arrival:{x:950,y:320}},
 music:{x:1190,y:730,direction:'right',arrival:{x:1080,y:690}},
 bistro:{x:885,y:315,direction:'up',arrival:{x:885,y:415}},
 inn:{x:255,y:340,direction:'up',arrival:{x:310,y:440}},
 pottery:{x:920,y:330,direction:'up',arrival:{x:920,y:430}},
 museum:{x:895,y:320,direction:'up',arrival:{x:895,y:420}}
};
const upperEntrances={
 lighthouse:{x:1205,y:720,direction:'right',arrival:{x:1100,y:680}},
 post:{x:1150,y:600,direction:'right',arrival:{x:1040,y:600}},
 inn:{x:315,y:380,direction:'up',arrival:{x:315,y:485}}
};
const terraceEntrances={
 garden:{x:1200,y:505,direction:'right',spawn:{x:1090,y:570},polygon:[[180,400],[1050,400],[1110,470],[1240,460],[1250,540],[1190,755],[90,755]]},
 sea:{x:1240,y:470,direction:'right',spawn:{x:1125,y:550},polygon:[[180,400],[1100,400],[1250,435],[1250,510],[1190,755],[90,755]]},
 workshop:{x:125,y:430,direction:'left',spawn:{x:195,y:600},polygon:[[90,420],[180,400],[1100,400],[1190,755],[90,755]]},
 lighthouse:{x:1150,y:700,direction:'right',spawn:{x:1040,y:690},polygon:[[180,400],[1100,400],[1190,755],[90,755]]}
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
 cafe:[[240,290],[1040,290],[1100,250],[1140,275],[1115,350],[1200,690],[1100,758],[80,758]],
 garden:[[170,285],[1110,285],[1180,758],[100,758]],
 lighthouse:[[250,285],[1030,285],[1140,455],[1200,410],[1250,440],[1250,505],[1180,520],[1200,758],[80,758],[100,520]],
 bakery:[[200,285],[1080,285],[1230,758],[50,758]],studio:[[280,285],[1000,285],[1210,758],[70,758]],
 post:[[240,285],[940,285],[940,235],[1030,235],[1040,285],[1230,758],[50,758]],music:[[225,285],[1055,285],[1200,758],[80,758]],
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
 const spots=[{id:'host',name:({lily:'Lily',mia:'Mia',ben:'Ben',finn:'Captain Finn'})[house.person],kind:'person',person:house.person,detail:'Help a friend',x:upper?400:spec.host[0],y:upper?410:spec.host[1],reward:[20,35,50][house.level]},...jobs.map((j,i)=>({id:'job-'+i,name:j[0],detail:j[1],kind:'object',x:i?(upper?450:990):objects[0].x,y:i?(upper?560:645):objects[0].y+65,furniture:i?null:objects[0].id,reward:35})),exit];
 if(id==='inn'&&!upper)spots.push({id:'stairs',kind:'stairs',name:'UPSTAIRS',detail:'Explore the Guest Lounge',x:440,y:370});
 return{id:house.id,theme:id,floor:upper?1:0,name:house.name+(upper?' · Guest Lounge':''),color:spec.color,image:'../assets/expansion-v7/room-'+id+(upper?'-upstairs':'')+'.webp',objects,holes:upper?[{x:965,y:500,w:315,h:300}]:[],spawn:{x:430,y:650},exit,spots,activityJobs:jobs};
}
export function expandRoom(base,house,floor){
 const id=house.id.slice(6);
 if(floor===2){
  const theme=['harbor','bistro','inn','aquarium','market'].includes(id)?'sea':id==='lighthouse'?'lighthouse':['workshop','pottery','studio','post'].includes(id)?'workshop':'garden';
  const entrance=terraceEntrances[theme];
  const exit={id:'exit',kind:'exit',name:'BACK INSIDE',x:entrance.x,y:entrance.y,direction:entrance.direction};
  const objects=[piece(['cafe-table',875,520,210],0),piece(['planter',310,490,170],1)];
  return{id:house.id,theme:id,floor:2,balcony:true,name:house.name+' · '+(theme==='sea'?'Sea Terrace':theme==='garden'?'Garden Balcony':theme==='lighthouse'?'Viewing Balcony':'Rooftop Terrace'),color:'#8daeb0',image:'../assets/expansion-v7/balcony-'+theme+'.webp',objects,holes:[],spawn:{...entrance.spawn},exit,polygon:entrance.polygon,activityJobs:balconyJobs,spots:[{id:'host',kind:'person',person:house.person,name:'Balcony guide',detail:'Share the view',x:480,y:460,reward:[20,35,50][house.level]},{id:'job-0',kind:'object',name:'View finder',detail:'Describe the view',x:875,y:590,furniture:'furniture-0',reward:35},{id:'job-1',kind:'object',name:'Garden care',detail:'Care for the balcony',x:310,y:565,furniture:'furniture-1',reward:30},exit]};
 }
 base.polygon=base.floor?null:plans[id];
 const entrance=base.floor?upperEntrances[id]:balconyEntrances[id];
 base.spots.push({id:'balcony',kind:'balcony',name:'BALCONY',detail:'Walk to the edge, then press E to go outside',...entrance});
 const meta=gameCatalog[id],work=meta?.kind;
 if(!base.floor&&work){const spot=base.spots.find(s=>s.id==='job-0');Object.assign(spot,{id:'work',kind:'work',name:meta.name,detail:meta.description,work,reward:meta.reward});}
 return base;
}
