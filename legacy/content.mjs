export const fish = [
{id:'goldfish',name:'Goldfish',color:'orange',price:45,blurb:'A little ray of sunshine with a floaty golden tail.',word:'golden',size:106},
{id:'blue-tang',name:'Blue Tang',color:'blue',price:60,blurb:'A vivid blue surgeonfish with a bright yellow tail.',word:'blue',size:112},
{id:'clownfish',name:'Clownfish',color:'orange',price:65,blurb:'A cheerful little swimmer in a stripy sweater.',word:'stripes',size:96},
{id:'guppy',name:'Guppy',color:'rainbow',price:50,blurb:'Small, curious, and dressed in rainbow colors.',word:'small',size:91},
{id:'angelfish',name:'Angelfish',color:'purple',price:85,blurb:'A graceful friend with beautiful sweeping fins.',word:'fins',size:112},
{id:'betta',name:'Betta',color:'pink',price:95,blurb:'A pink ribbon of color, dancing through the water.',word:'pink',size:118},
{id:'pufferfish',name:'Pufferfish',color:'yellow',price:110,blurb:'Round, sunny, and wonderfully full of personality.',word:'round',size:100},
{id:'seahorse',name:'Seahorse',color:'green',price:140,blurb:'A tiny ocean wonder with a curly little tail.',word:'curly',size:98}
];
export const decor=[
{id:'seaweed',name:'Dancing Seaweed',price:35,size:152,blurb:'A leafy green hideaway.'},
{id:'pebble-arch',name:'Pebble Arch',price:50,size:163,blurb:'A tiny tunnel for big adventures.'},
{id:'coral',name:'Peach Coral',price:45,size:143,blurb:'A soft splash of peachy color.'},
{id:'treasure-chest',name:'Treasure Chest',price:80,size:139,blurb:'Every ocean needs a little treasure.'},
{id:'sandcastle',name:'Sandcastle',price:90,size:170,blurb:'A castle fit for your finned friends.'},
{id:'shell',name:'Pearl Shell',price:65,size:136,blurb:'A little pearl of happiness.'},
{id:'mushroom-house',name:'Tiny Hideaway',price:110,size:176,blurb:'The coziest house under the sea.'},
{id:'rainbow',name:'Rainbow Arch',price:125,size:180,blurb:'Swim right into a rainbow.'}
];
export const tanks=[
{name:'Cozy Lagoon',fish:6,decor:5,price:0,width:74},
{name:'Wonder Bay',fish:12,decor:10,price:240,width:85},
{name:'Ocean Palace',fish:20,decor:18,price:600,width:95}
];
export const people={
mia:{name:'Mia',role:'Your friendly fish keeper',place:'Fish Market',color:'#d9efe6'},
ben:{name:'Ben',role:'A maker of lovely things',place:'Decoration Shop',color:'#fff0c7'},
finn:{name:'Captain Finn',role:'The harbor’s story collector',place:'Sunny Harbor',color:'#dcebf8'},
lily:{name:'Lily',role:'Your new next-door friend',place:'Town Square',color:'#eee4f4'}
};
export const quests=[
{id:'hello',title:'A new friend',description:'Meet Lily in town and say hello.',reward:50,icon:'heart',location:'lily'},
{id:'feed',title:'Breakfast, little fish!',description:'Feed your fish in My Aquarium.',reward:40,icon:'food',location:'home'},
{id:'color',title:'A splash of blue',description:'Help Mia find the blue fish.',reward:60,icon:'fish',location:'mia'},
{id:'buyFish',title:'Welcome home',description:'Buy a new friend at the Fish Market.',reward:60,icon:'bag',location:'mia'},
{id:'buyDecor',title:'Make it yours',description:'Buy a decoration from Ben.',reward:70,icon:'plant',location:'ben'},
{id:'count',title:'Count with Captain Finn',description:'Help Captain Finn count his shells.',reward:70,icon:'shell',location:'finn'},
{id:'place',title:'A lovely little home',description:'Move a decoration in your aquarium.',reward:50,icon:'move',location:'home'},
{id:'upgrade',title:'Room for more wonder',description:'Upgrade your aquarium to Wonder Bay.',reward:100,icon:'star',location:'upgrade'}
];
export const lessons=[
{question:'What color is this fish?',hint:'It is blue.',accept:[['blue']],image:'fish/blue-tang',word:'blue'},
{question:'How many shells can you see? One, two, three!',hint:'Three shells.',accept:[['three'],['3']],image:'decor/shell',word:'three'},
{question:'What do we say when someone helps us?',hint:'Thank you!',accept:[['thank']],image:'npc/lily',word:'thank you'},
{question:'What color is this lovely coral?',hint:'It is pink.',accept:[['pink'],['peach']],image:'decor/coral',word:'pink'},
{question:'Would you like a big fish or a small fish?',hint:'A small fish, please.',accept:[['small'],['big']],image:'fish/guppy',word:'small'},
{question:'Where does a fish live?',hint:'In the water.',accept:[['water'],['ocean'],['sea'],['aquarium']],image:'fish/goldfish',word:'water'},
{question:'How do we ask for something politely?',hint:'Please!',accept:[['please']],image:'npc/mia',word:'please'},
{question:'What animal is this?',hint:'It is a seahorse.',accept:[['seahorse'],['sea','horse']],image:'fish/seahorse',word:'seahorse'}
];
export const asset=(kind,id)=>`assets/${kind}/${id}.webp`;
