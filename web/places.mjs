export const WORLD={width:3600,height:2400,sx:18/13,sy:4/3};
export const houseLevels=['Easy · 简单','Medium · 中等','Hard · 困难'];
const raw=[
 ['library','Harbor Library',265,230,290,210,'library',2,'sentence','lily'],
 ['market','Fish Market',1580,245,320,250,'market',0,'colors','mia'],
 ['workshop','Design Workshop',350,790,300,205,'workshop',1,'tools','ben'],
 ['harbor','Harbor Office',1650,1080,330,180,'harbor',2,'voyage','finn'],
 ['aquarium','My Aquarium',160,835,155,190,'home',0,'count','mia'],
 ['cafe','Sunbeam Café',960,180,245,185,'cafe',1,'order','lily'],
 ['garden','Glass Garden',2180,285,230,190,'garden',0,'garden','ben'],
 ['lighthouse','Lighthouse',2230,1050,180,220,'lighthouse',2,'riddle','finn'],
 ['bakery','Rose Bakery',80,120,130,140,'home',0,'food','lily'],
 ['studio','Shell Art Studio',680,150,150,160,'home',1,'memory','ben'],
 ['post','Seabreeze Post',1400,100,160,150,'home',2,'spell','lily'],
 ['music','Melody Cottage',2060,80,175,145,'home',1,'listen','lily']
];
export const houses=raw.map(([id,name,x,y,w,h,detail,level,game,person])=>({id:'house-'+id,name,x:Math.round(x*WORLD.sx),y:Math.round(y*WORLD.sy),w,h,detail,title:name,level,game,person}));
export const entrances=houses.map(b=>({id:b.id,name:b.name+' · '+houseLevels[b.level],x:b.x+b.w/2,y:b.y+b.h+72,house:true}));
