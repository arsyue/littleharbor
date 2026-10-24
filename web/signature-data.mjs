export const signatureKinds=['library','market','workshop','harbor','aquarium','cafe','garden','lighthouse','studio','post','music','inn'];
const row=(id,type,text,more={})=>({id:'place-'+id,type,text,...more});
const reply=(id,text,hint,groups,title='Your turn to speak')=>row(id,'speak',text,{hint,groups,title});
const choose=(id,text,title,choices,answer)=>row(id,'choose',text,{title,choices,answer});
const order=(id,text,title,answer)=>row(id,'sequence',text,{title,choices:[...answer.slice(1),answer[0]],answer});
const match=(id,text,title,fields,choices)=>row(id,'sort',text,{title,fields,choices});
const paint=(id,text,title,fields,palette)=>row(id,'paint',text,{title,fields,palette});
const route=(id,text,title,answer)=>row(id,'route',text,{title,answer,start:[0,2],goal:[3,0],width:4,height:3,blocked:[[1,2],[1,1]]});
const plans={
 library:[
  reply('library-welcome','A storm scattered three books and the pages of a sea adventure. Help us rebuild the story. Tell me how you can help in the library.','I can sort the books and put the story in order.',[['sort','organize'],['book','books'],['story']],'Become a story detective'),
  match('library-shelves','A book called Ocean Animals belongs with nature. The Lost Compass is an adventure. Garden Soup contains recipes. Return each book to its correct shelf.','Return the books',{'Ocean Animals':'Nature','The Lost Compass':'Adventure','Garden Soup':'Cooking'},['Adventure','Cooking','Nature']),
  order('library-story','Milo found a map before he packed his bag. He packed before he sailed. Only after sailing did he discover the island. Put these events in order.','Rebuild the story',['Find the map','Pack the bag','Sail across the bay','Discover the island']),
  choose('library-clue','Milo carries a compass because clouds hide the sun. What can you infer about the compass? Think about why it is useful when the sky is cloudy.','Read between the lines',['It helps him find a direction','It makes the clouds disappear','It tells him what to eat'],'It helps him find a direction'),
  reply('library-explain','A younger reader asks why Milo packed before sailing. Explain how planning helped him. Use the words before and prepared in your answer.','Milo packed before sailing so he was prepared.',[['before'],['prepared']],'Explain the character’s choice')
 ],
 market:[
  reply('market-order','A customer has forty coins and wants two guppies and one tetra. They do not want a goldfish today. Repeat the order before you use the shopping basket.','You would like two guppies and one tetra.',[['two','2'],['guppy','guppies'],['one','1'],['tetra']],'Listen to the fish order'),
  row('market-basket','basket','Guppies cost eight coins each, a tetra costs twelve, and a goldfish costs eighteen. Add exactly two guppies and one tetra. Watch the basket total and keep within forty coins.',{title:'Build the fish basket',fields:{Guppy:2,Tetra:1},limit:40,unit:'coins',catalog:[['Guppy',8],['Tetra',12],['Goldfish',18]]}),
  row('market-change','number','Your basket costs twenty-eight coins. The customer pays with forty coins. Count the change carefully. How many coins should you return?',{title:'Count the change',answer:12}),
  choose('market-care','The customer asks whether more fish always make a better aquarium. Which reply explains the importance of space?','Give helpful advice',['Every fish needs enough swimming space','Fill every corner with fish','Water never needs checking'],'Every fish needs enough swimming space'),
  reply('market-finish','Finish the sale politely. Tell the customer that the total is twenty-eight coins and the change is twelve coins. You may say the numbers or type them.','The total is twenty-eight coins and your change is twelve coins.',[['28','twenty eight'],['12','twelve'],['change']],'Explain the receipt')
 ],
 workshop:[
  reply('workshop-brief','Our customer wants a peaceful aquarium with a plant on the left, a cave in the middle, and a shell on the right. Confirm the three decorations before you design it.','I will use a plant, a cave and a shell.',[['plant'],['cave'],['shell']],'Read the design brief'),
  paint('workshop-layout','Use the bottom row of the design board. Place the plant at bottom left, the cave at bottom center, and the shell at bottom right. Leave the other six spaces empty for swimming.','Arrange the aquarium',{6:'Plant',7:'Cave',8:'Shell'},['Empty','Plant','Cave','Shell']),
  choose('workshop-tools','The customer wants to check the width of the cave before buying it. Choose the tool that measures length accurately.','Choose your measuring tool',['Ruler','Paintbrush','Watering can'],'Ruler'),
  order('workshop-process','A careful designer first measures the tank, then draws a plan, then places the decorations, and finally checks the swimming space. Put the work cards in that order.','Plan the installation',['Measure the tank','Draw a plan','Place decorations','Check swimming space']),
  reply('workshop-explain','Show the customer your finished design. Explain where the cave is. Use between to describe its position in relation to the plant and shell.','The cave is between the plant and the shell.',[['cave'],['between'],['plant'],['shell']],'Present your design')
 ],
 harbor:[
  reply('harbor-order','A boat must carry two food crates and one medicine box. Its safe cargo limit is ten kilograms. Confirm the cargo before we prepare the loading plan.','We need two food crates and one medicine box.',[['two','2'],['food'],['one','1'],['medicine']],'Become the cargo captain'),
  row('harbor-cargo','basket','Each food crate weighs three kilograms. A medicine box weighs two, and a tool chest weighs five. Load two food crates and one medicine box. Stay within the ten-kilogram limit.',{title:'Load the safe cargo',fields:{'Food crate':2,'Medicine box':1},limit:10,unit:'kg',catalog:[['Food crate',3],['Medicine box',2],['Tool chest',5]]}),
  route('harbor-route','The boat starts at the bottom-left dock. Rocks block the middle channel. Go north twice, then east three times to reach the lighthouse dock. Follow each direction carefully.','Navigate the harbor',['North','North','East','East','East']),
  order('harbor-depart','Before departure, check the weather, count the cargo, close the cargo hatch, and then untie the boat. Arrange the safety checklist in order.','Prepare to sail',['Check the weather','Count the cargo','Close the hatch','Untie the boat']),
  reply('harbor-report','Tell Captain Finn that the cargo weighs eight kilograms and the boat is ready. Include the weight and the word ready in your report.','The cargo weighs eight kilograms and the boat is ready.',[['eight','8'],['kilograms','kg'],['ready']],'Report to the captain')
 ],
 aquarium:[
  reply('aquarium-help','Welcome to the aquarium care lab. This is a pretend tank for learning. Today we will check the water, feed the fish carefully, and keep their home clean. Tell me you are ready to help.','I am ready to care for the fish.',[['ready'],['fish']],'Meet the aquarium keeper'),
  row('aquarium-controls','dials','Read our game care card: this pretend tank needs a temperature of twenty-four degrees and a filter level of three. Move both controls to match the care card.',{title:'Match the game care card',fields:{Temperature:24,'Filter level':3},ranges:{Temperature:[20,28,1],'Filter level':[0,5,1]},units:{Temperature:'°C','Filter level':''}}),
  choose('aquarium-food','There is leftover food at the bottom of the tank. More food would make the water dirty. What should the keeper do next?','Notice what the fish need',['Remove the leftover food','Add three more meals','Turn off every filter'],'Remove the leftover food'),
  order('aquarium-clean','Put the care routine in order: observe the fish, check the water, remove leftover food, and then record your observations.','Build a care routine',['Observe the fish','Check the water','Remove leftover food','Record observations']),
  reply('aquarium-report','Explain one reason to keep the water clean. You can say that clean water helps the fish stay healthy. Use clean water and healthy in your reply.','Clean water helps the fish stay healthy.',[['clean'],['water'],['healthy']],'Share your care report')
 ],
 cafe:[
  reply('cafe-order','A visitor wants a warm honey tea with lemon. They would like one spoonful of honey and no milk. Repeat the important parts of the drink order.','You would like honey tea with lemon and no milk.',[['tea'],['honey'],['lemon'],['no','without'],['milk']],'Take a café order'),
  order('cafe-layers','First place the tea bag in the cup. Next add warm water. Then stir in honey, and add lemon last. Build the drink in the same order.','Build the drink',['Tea bag','Warm water','Honey','Lemon']),
  row('cafe-tray','basket','Prepare the takeaway tray with one tea and two biscuits. Tea costs five coins and each biscuit costs two. The visitor has ten coins. Keep the tray within the budget.',{title:'Prepare a takeaway tray',fields:{Tea:1,Biscuit:2},limit:10,unit:'coins',catalog:[['Tea',5],['Biscuit',2],['Cake',4]]}),
  row('cafe-total','number','The tea costs five coins and the two biscuits cost four coins altogether. What is the total price of this takeaway order?',{title:'Add the café bill',answer:9}),
  reply('cafe-deliver','Hand over the order politely. Tell the visitor that the tea is warm and ask them to carry it carefully.','Here is your warm tea. Please carry it carefully.',[['warm'],['tea'],['carefully']],'Serve with care')
 ],
 garden:[
  reply('garden-plan','We are planting a small garden. We need a rose on the left and a sunflower on the right. Tell me which two flowers you will plant.','I will plant a rose and a sunflower.',[['rose'],['sunflower']],'Plan a flower bed'),
  paint('garden-plant','Use the bottom row of the garden bed. Plant a rose in the bottom-left patch and a sunflower in the bottom-right patch. Leave the center empty as a little path.','Plant your garden',{6:'Rose',8:'Sunflower'},['Empty','Rose','Sunflower','Stone']),
  row('garden-care','dials','For this game, our care card asks for two cups of water and six hours of sunlight. Adjust the two controls to match the card. Too much water is not always helpful.',{title:'Balance water and light',fields:{Water:2,Sunlight:6},ranges:{Water:[0,5,1],Sunlight:[0,10,1]},units:{Water:'cups',Sunlight:'hours'}}),
  choose('garden-weather','Rain is coming this afternoon and the soil is already wet. What is the most thoughtful choice for the garden?','Respond to the weather',['Wait before adding more water','Water it five more times','Hide the flowers in a box'],'Wait before adding more water'),
  reply('garden-explain','Tell a visitor how sunlight helps your garden. Use flowers, sunlight and grow in one clear sentence.','The flowers need sunlight to grow.',[['flower','flowers'],['sunlight'],['grow']],'Explain your growing garden')
 ],
 lighthouse:[
  reply('lighthouse-watch','The harbor fog is thick tonight. We will use colored signals to guide a boat safely home. Tell me that you are ready to watch the light and help the boat.','I am ready to watch the light and help the boat.',[['ready'],['light'],['boat']],'Take the lighthouse watch'),
  match('lighthouse-code','Our harbor code is simple: red means stop, green means proceed, and yellow means wait. Match the three lights to their meanings before you send a signal.','Decode the light signals',{Red:'Stop',Green:'Proceed',Yellow:'Wait'},['Wait','Proceed','Stop']),
  row('lighthouse-flash','pattern','The captain asks for this signal: yellow, yellow, green. Listen or watch the demonstration, then press the colored pads in the same order. You can replay it as often as you need.',{title:'Send the requested signal',choices:['Red','Yellow','Green'],answer:['Yellow','Yellow','Green'],tones:[220,330,440]}),
  route('lighthouse-guide','Guide the rescue boat around the rocks. From the bottom-left dock, travel north twice and east three times. The lighthouse marks the safe destination.','Guide the rescue boat',['North','North','East','East','East']),
  reply('lighthouse-report','Explain your signal to the captain. Tell him that yellow means wait and green means proceed.','Yellow means wait and green means proceed.',[['yellow'],['wait'],['green'],['proceed','go']],'Explain the harbor code')
 ],
 studio:[
  reply('studio-brief','We are painting a tiny harbor picture from spoken instructions. The sky will be blue, the sun yellow, and the water green. Repeat the three colors before you pick up your brush.','The sky is blue, the sun is yellow and the water is green.',[['blue'],['yellow'],['green']],'Listen to the artist’s brief'),
  paint('studio-paint','Paint all three squares in the top row blue. Paint the center square yellow. Paint all three squares in the bottom row green. Leave the two remaining squares empty.','Paint by listening',{0:'Blue',1:'Blue',2:'Blue',4:'Yellow',6:'Green',7:'Green',8:'Green'},['Empty','Blue','Yellow','Green','Red']),
  choose('studio-mix','The artist mixes blue paint with yellow paint to make the water color. Which color should appear?','Mix your colors',['Green','Purple','Orange'],'Green'),
  order('studio-process','Before a gallery opens, an artist sketches the idea, paints the picture, lets it dry, and finally adds a title. Arrange those steps.','Prepare the gallery display',['Sketch the idea','Paint the picture','Let it dry','Add a title']),
  reply('studio-present','Describe your picture to a visitor. Explain that the yellow sun is above the green water. Use above in your sentence.','The yellow sun is above the green water.',[['yellow'],['sun'],['above'],['green'],['water']],'Present your picture')
 ],
 post:[
  reply('post-welcome','Three letters need delivering. One goes to the library, one to the bakery, and one to the inn. Tell me the three destinations before we sort the mail.','The letters go to the library, bakery and inn.',[['library'],['bakery'],['inn']],'Join the post team'),
  match('post-sort','Lily works at the library on Book Lane. Oliver works at the bakery on Rose Street. Mrs. Reed manages the inn on Sea Road. Match each addressed envelope to its destination.','Sort the addressed letters',{'Lily · Book Lane':'Library','Oliver · Rose Street':'Bakery','Mrs. Reed · Sea Road':'Inn'},['Bakery','Inn','Library']),
  order('post-priority','The bakery closes first, the library closes next, and the inn stays open late. Deliver the bakery letter first, the library letter second, and the inn letter last.','Plan the delivery order',['Bakery','Library','Inn']),
  choose('post-damaged','A parcel has a torn address label and you cannot read the house number. Which action will help it reach the correct person?','Solve a delivery problem',['Ask the sender to confirm the address','Guess a house and leave it','Remove the rest of the label'],'Ask the sender to confirm the address'),
  reply('post-finish','Tell the postmaster your route using first and then. Explain that you will visit the bakery first and the library next.','First I will visit the bakery, then the library.',[['first'],['bakery'],['then'],['library']],'Report your delivery route')
 ],
 music:[
  reply('music-welcome','Welcome to the harbor sound studio. We will listen to a short melody, copy it, and get ready for a performance. Tell me that you are ready to listen and play.','I am ready to listen and play.',[['ready'],['listen'],['play']],'Meet the music teacher'),
  row('music-notes','pattern','Our first melody is do, mi, so. Listen to the three notes, then press the matching pads in order. You can replay the melody and take as much time as you need.',{title:'Copy the short melody',choices:['Do','Re','Mi','So'],answer:['Do','Mi','So'],tones:[261.63,293.66,329.63,392]}),
  row('music-memory','pattern','Now try a longer phrase: so, mi, re, do. Listen carefully for the melody moving down. Copy all four notes in order.',{title:'Remember the longer phrase',choices:['Do','Re','Mi','So'],answer:['So','Mi','Re','Do'],tones:[261.63,293.66,329.63,392]}),
  order('music-show','A considerate performer listens to the count-in, plays the melody, lets the final note finish, and then bows. Put the performance cards in order.','Prepare a performance',['Listen to the count-in','Play the melody','Let the final note finish','Bow to the audience']),
  reply('music-finish','Describe the longer melody. It starts high and ends low. Use high and low to explain what you heard.','The melody starts high and ends low.',[['high'],['low']],'Describe what you heard')
 ],
 inn:[
  reply('inn-welcome','Two travelers need rooms. A family needs two beds on the ground floor. A writer needs a quiet upstairs room away from music. Welcome them and offer to help find suitable rooms.','Welcome! I can help you find suitable rooms.',[['welcome','hello'],['help'],['room','rooms']],'Welcome the travelers'),
  match('inn-rooms','Room one has two beds on the ground floor. Room two is upstairs beside the music room. Room three is a quiet upstairs room facing the garden. Match the family and the writer to suitable rooms.','Choose the perfect rooms',{'Family · two beds · no stairs':'Room 1','Writer · upstairs · quiet':'Room 3'},['Room 1','Room 2','Room 3']),
  row('inn-price','number','The family room costs thirty coins per night. The family is staying for two nights. What is the room charge before any extras?',{title:'Calculate the stay',answer:60}),
  match('inn-requests','The family asks for an extra towel. The writer asks for a desk lamp. Send each item to the correct room and check the request before delivery.','Prepare room service',{'Extra towel':'Room 1','Desk lamp':'Room 3'},['Room 1','Room 2','Room 3']),
  reply('inn-directions','Explain to the writer that room three is upstairs and faces the garden. Include the room number, upstairs and garden in your directions.','Room three is upstairs and faces the garden.',[['three','3'],['upstairs'],['garden']],'Give clear directions')
 ]
};
const people={library:'lily',market:'mia',workshop:'ben',harbor:'finn',aquarium:'mia',cafe:'lily',garden:'ben',lighthouse:'finn',studio:'ben',post:'lily',music:'lily',inn:'lily'};
const portrait={lily:2,mia:0,ben:1,finn:3};
export function signaturePlan(kind){return(plans[kind]||[]).map(s=>({person:people[kind],portrait:portrait[people[kind]],sceneArt:kind==='inn'?'assets/expansion-v7/room-inn.webp':'assets/rooms-v5/'+kind+'.webp',...s}));}
