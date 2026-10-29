export const fish = [
{id:'goldfish',name:'Goldfish',color:'orange',price:45,blurb:'A little ray of sunshine with a floaty golden tail.',word:'golden',size:106},
{id:'blue-tang',name:'Blue Tang',color:'blue',price:60,blurb:'A vivid blue surgeonfish with a bright yellow tail.',word:'blue',size:112},
{id:'clownfish',name:'Clownfish',color:'orange',price:65,blurb:'A cheerful little swimmer in a stripy sweater.',word:'stripes',size:96},
{id:'guppy',name:'Guppy',color:'rainbow',price:50,blurb:'Small, curious, and dressed in rainbow colors.',word:'small',size:91},
{id:'angelfish',name:'Angelfish',color:'purple',price:85,blurb:'A graceful friend with beautiful sweeping fins.',word:'fins',size:112},
{id:'betta',name:'Betta',color:'pink',price:95,blurb:'A pink ribbon of color, dancing through the water.',word:'pink',size:118},
{id:'pufferfish',name:'Pufferfish',color:'yellow',price:110,blurb:'Round, sunny, and wonderfully full of personality.',word:'round',size:100},
{id:'seahorse',name:'Seahorse',color:'green',price:140,blurb:'A tiny ocean wonder with a curly little tail.',word:'curly',size:98},
{"id":"neon-tetra","name":"Neon Tetra","color":"blue","price":55,"blurb":"A silver swimmer with a bright blue stripe.","word":"stripe","size":88},
{"id":"yellow-tang","name":"Yellow Tang","color":"yellow","price":100,"blurb":"A sunny reef fish with a pointed snout.","word":"yellow","size":108},
{"id":"discus","name":"Turquoise Discus","color":"blue","price":135,"blurb":"A round jewel with beautiful turquoise markings.","word":"round","size":115},
{"id":"platy","name":"Sunset Platy","color":"orange","price":55,"blurb":"A warm orange fish with a neat fan-shaped tail.","word":"orange","size":91},
{"id":"molly","name":"Black Molly","color":"black","price":65,"blurb":"Dark velvet scales and a graceful dorsal fin.","word":"black","size":101},
{"id":"swordtail","name":"Green Swordtail","color":"green","price":85,"blurb":"A sleek fish with a long sword-shaped tail.","word":"long","size":112},
{"id":"zebra-danio","name":"Zebra Danio","color":"blue","price":60,"blurb":"A lively silver fish with dark horizontal stripes.","word":"striped","size":91},
{"id":"rainbowfish","name":"Rainbowfish","color":"rainbow","price":125,"blurb":"Blue at the front, golden orange at the tail.","word":"bright","size":109}
];
export const decor=[
{id:'seaweed',name:'Dancing Seaweed',price:35,size:152,blurb:'A leafy green hideaway.'},
{id:'pebble-arch',name:'Pebble Arch',price:50,size:163,blurb:'A tiny tunnel for big adventures.'},
{id:'coral',name:'Peach Coral',price:45,size:143,blurb:'A soft splash of peachy color.'},
{id:'treasure-chest',name:'Treasure Chest',price:80,size:139,blurb:'Every ocean needs a little treasure.'},
{id:'sandcastle',name:'Sandcastle',price:90,size:170,blurb:'A castle fit for your finned friends.'},
{id:'shell',name:'Pearl Shell',price:65,size:136,blurb:'A little pearl of happiness.'},
{id:'mushroom-house',name:'Tiny Hideaway',price:110,size:176,blurb:'The coziest house under the sea.'},
{id:'rainbow',name:'Rainbow Arch',price:125,size:180,blurb:'Swim right into a rainbow.'},
{"id":"driftwood","name":"Branching Driftwood","price":70,"size":175,"blurb":"Natural wooden branches for a beautiful underwater landscape."},
{"id":"java-fern","name":"Java Fern","price":45,"size":155,"blurb":"A leafy green plant growing around a smooth stone."},
{"id":"red-ludwigia","name":"Red Ludwigia","price":55,"size":160,"blurb":"A rich red cluster of underwater leaves."},
{"id":"stone-cave","name":"Stone Cave","price":95,"size":170,"blurb":"A sheltered stone hideaway with a wide entrance."},
{"id":"air-bubbler","name":"Bubble Stone","price":75,"size":140,"blurb":"A stream of sparkling bubbles from a small stone."},
{"id":"shipwreck","name":"Sunken Sailboat","price":160,"size":180,"blurb":"A weathered little ship with a story to tell."},
{"id":"clay-pot","name":"Terracotta Hideout","price":60,"size":145,"blurb":"A smooth clay pot for curious fish to explore."},
{"id":"water-lily","name":"Water Lily","price":90,"size":155,"blurb":"Green leaves and a soft pink flower."},
{id:'hanging-shell',name:'Hanging Pearl Shell',price:110,size:165,mount:'hanging',blurb:'A pearl shell on a golden chain. Hang it above your fish.'},
{id:'hanging-fern',name:'Hanging Fern Basket',price:95,size:170,mount:'hanging',blurb:'A leafy basket that sways gently in the water.'},
{id:'glass-coral',name:'Glass Coral Garden',price:100,size:150,mount:'wall',blurb:'A coral garden with clear suction cups for the back glass.'},
{id:'floating-lily',name:'Floating Lily Island',price:115,size:160,mount:'surface',blurb:'A lily island that floats near the surface.'}
];
export const decorLimits=id=>{
 const mount=decor.find(d=>d.id===id)?.mount||'floor';
 return mount==='hanging'?{mount,min:24,max:68,start:42}:mount==='wall'?{mount,min:22,max:75,start:42}:mount==='surface'?{mount,min:8,max:20,start:12}:{mount,min:60,max:94,start:82};
};
export const tanks=[
{name:'Cozy Lagoon',fish:20,decor:16,price:0,width:74},
{name:'Wonder Bay',fish:40,decor:32,price:240,width:85},
{name:'Ocean Palace',fish:60,decor:48,price:600,width:95}
];
export const people={
mia:{name:'Mia',role:'Your friendly fish keeper',place:'Fish Market',color:'#d9efe6'},
ben:{name:'Ben',role:'A maker of lovely things',place:'Decoration Shop',color:'#fff0c7'},
finn:{name:'Captain Finn',role:'The harbor’s story collector',place:'Sunny Harbor',color:'#dcebf8'},
lily:{name:'Lily',role:'Your new next-door friend',place:'Town Square',color:'#eee4f4'}
};
export const quests=[
{id:'hello',title:'The Welcome-Day Plan',description:'Complete Lily’s seven-turn welcome-day story.',reward:120,icon:'heart',location:'lily'},
{id:'feed',title:'Breakfast, little fish!',description:'Feed your fish in My Aquarium.',reward:40,icon:'food',location:'home'},
{id:'color',title:'A Customer’s Fish Budget',description:'Help Mia compare prices and plan a purchase.',reward:140,icon:'fish',location:'mia'},
{id:'buyFish',title:'Welcome home',description:'Buy a new friend at the Fish Market.',reward:60,icon:'bag',location:'mia'},
{id:'buyDecor',title:'Make it yours',description:'Buy a decoration from Ben.',reward:70,icon:'plant',location:'ben'},
{id:'count',title:'The Harbor Delivery',description:'Complete Captain Finn’s seven-turn delivery story.',reward:160,icon:'shell',location:'finn'},
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
