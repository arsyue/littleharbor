import {assessAnswer} from './speech-rules.mjs';
export const adventures=[
  {
    "id": "welcome",
    "person": "lily",
    "title": "The Welcome-Day Plan",
    "reward": 120,
    "legacy": "hello",
    "summary": "Help Lily plan an afternoon for new visitors.",
    "steps": [
      {
        "say": "Welcome to Little Harbor! We are planning a welcome day for new visitors. Introduce yourself with an explorer name, and tell me something you enjoy.",
        "hint": "My explorer name is Sunny, and I enjoy learning about animals.",
        "min": 9,
        "groups": [
          [
            "name",
            "enjoy"
          ],
          [
            "name",
            "like"
          ],
          [
            "im",
            "like"
          ],
          [
            "i",
            "am",
            "enjoy"
          ]
        ],
        "feedback": "Lovely to meet you! Your interests will help us choose a good first stop.",
        "word": "introduce"
      },
      {
        "say": "We can start at the library or the fish market. Which place would you choose, and why? Give me a reason, not just the name.",
        "hint": "I would choose the library because I enjoy reading animal stories.",
        "min": 9,
        "groups": [
          [
            "library",
            "because"
          ],
          [
            "market",
            "because"
          ]
        ],
        "feedback": "That sounds like a thoughtful choice. A reason helps other people understand your plan.",
        "word": "because"
      },
      {
        "say": "Please check the sign outside the library. When does it open, and when does it close? Tell me both times in one sentence.",
        "hint": "The library opens at nine and closes at five.",
        "min": 9,
        "groups": [
          [
            "opens",
            "nine",
            "closes",
            "five"
          ],
          [
            "opens",
            "9",
            "closes",
            "5"
          ],
          [
            "open",
            "9",
            "close",
            "5"
          ],
          [
            "open",
            "nine",
            "close",
            "five"
          ]
        ],
        "requires": "library",
        "feedback": "Exactly. We can visit during the afternoon and still have plenty of time.",
        "word": "opening hours"
      },
      {
        "say": "A visitor is standing at the library and wants to reach the fish market. The fountain is between them. Give directions using past and then.",
        "hint": "Walk past the fountain, and then continue east to the fish market.",
        "min": 10,
        "groups": [
          [
            "past",
            "fountain",
            "then",
            "market"
          ]
        ],
        "feedback": "Clear directions! Mentioning a landmark makes a route easier to follow.",
        "word": "directions"
      },
      {
        "say": "Let's invite Mia to meet us in the town square at three o'clock. Make the invitation friendly, and remember the place and the time.",
        "hint": "Would you like to meet us in the town square at three o'clock?",
        "min": 11,
        "groups": [
          [
            "would",
            "like",
            "square",
            "three"
          ],
          [
            "can",
            "meet",
            "square",
            "three"
          ],
          [
            "would",
            "like",
            "square",
            "3"
          ],
          [
            "can",
            "meet",
            "square",
            "3"
          ]
        ],
        "feedback": "That is a friendly invitation. Mia will know exactly where and when to meet us.",
        "word": "invite"
      },
      {
        "say": "Oh dear, the forecast says it may rain. The library has room indoors. Suggest a change to our plan and explain why it would help.",
        "hint": "We could meet inside the library because it will keep everyone dry.",
        "min": 10,
        "groups": [
          [
            "library",
            "because",
            "dry"
          ],
          [
            "library",
            "because",
            "rain"
          ],
          [
            "library",
            "because",
            "inside"
          ]
        ],
        "feedback": "Good thinking. Changing a plan can help everyone stay comfortable.",
        "word": "indoors"
      },
      {
        "say": "Now give our visitors a short plan. Use first and then, name two places, and finish by reminding them to meet us at three.",
        "hint": "First we will visit the library, then the fish market, and meet at three.",
        "min": 13,
        "groups": [
          [
            "first",
            "then",
            "library",
            "market",
            "three"
          ],
          [
            "first",
            "then",
            "library",
            "market",
            "3"
          ]
        ],
        "feedback": "Our welcome-day plan is ready. You introduced yourself, gave directions, and solved a problem. Thank you!",
        "word": "plan"
      }
    ]
  },
  {
    "id": "market",
    "person": "mia",
    "title": "A Customer's Fish Budget",
    "reward": 140,
    "legacy": "color",
    "summary": "Compare prices and help a customer plan a purchase.",
    "steps": [
      {
        "say": "A customer needs help choosing fish for a make-believe aquarium. They have one hundred and ten coins. Offer to help them, using a polite full sentence.",
        "hint": "I would be happy to help you choose some fish today.",
        "min": 9,
        "groups": [
          [
            "i",
            "would",
            "help"
          ],
          [
            "i",
            "can",
            "help"
          ],
          [
            "may",
            "i",
            "help"
          ]
        ],
        "feedback": "Thank you. Let's compare the choices before we make a recommendation.",
        "word": "recommend"
      },
      {
        "say": "Read the price board beside my market. Which is cheaper, the goldfish or the blue tang? Explain your answer using both prices.",
        "hint": "The goldfish is cheaper because it costs forty-five coins, not sixty.",
        "min": 10,
        "groups": [
          [
            "goldfish",
            "cheaper",
            "45",
            "60"
          ],
          [
            "goldfish",
            "cheaper",
            "forty",
            "five",
            "sixty"
          ]
        ],
        "requires": "market-board",
        "feedback": "Correct. The goldfish costs fifteen coins less than the blue tang.",
        "word": "cheaper"
      },
      {
        "say": "The customer likes a guppy for fifty coins and a blue tang for sixty. How much would they spend altogether, and would their budget be enough?",
        "hint": "They would spend one hundred and ten coins, so their budget is enough.",
        "min": 10,
        "groups": [
          [
            "110",
            "enough"
          ],
          [
            "hundred",
            "ten",
            "enough"
          ]
        ],
        "feedback": "Exactly. The two fish use the whole budget, so there would be no coins left.",
        "word": "altogether"
      },
      {
        "say": "The customer's aquarium has room for only two more fish. Should they buy three small fish or the pair we discussed? Explain your choice.",
        "hint": "They should buy the pair because there is only room for two fish.",
        "min": 10,
        "groups": [
          [
            "pair",
            "because",
            "two"
          ],
          [
            "two",
            "because",
            "room"
          ],
          [
            "two",
            "because",
            "space"
          ]
        ],
        "feedback": "Yes. Checking the available space is just as important as checking the price.",
        "word": "available"
      },
      {
        "say": "The customer also asks where tall plants should go. Suggest a place that leaves open water for swimming, and give a reason.",
        "hint": "Put the tall plants at the back so the fish have space to swim.",
        "min": 11,
        "groups": [
          [
            "back",
            "swim"
          ],
          [
            "back",
            "space"
          ],
          [
            "sides",
            "swim"
          ],
          [
            "sides",
            "space"
          ]
        ],
        "feedback": "That layout keeps a clear swimming area and makes the aquarium easy to see.",
        "word": "layout"
      },
      {
        "say": "You are not sure whether a decoration costs thirty or forty coins. Ask me to check the price. Use a polite question instead of guessing.",
        "hint": "Could you please tell me how much this decoration costs?",
        "min": 9,
        "groups": [
          [
            "could",
            "please",
            "how",
            "much"
          ],
          [
            "can",
            "please",
            "how",
            "much"
          ],
          [
            "would",
            "please",
            "price"
          ]
        ],
        "feedback": "Of course. Asking for clarification is a useful skill whenever you are shopping.",
        "word": "clarification"
      },
      {
        "say": "Tell me the customer's final order: a guppy and a blue tang. Include please and the total price in a complete sentence.",
        "hint": "We would like a guppy and a blue tang, please, for one hundred and ten coins.",
        "min": 12,
        "groups": [
          [
            "guppy",
            "blue",
            "tang",
            "please",
            "110"
          ],
          [
            "guppy",
            "blue",
            "tang",
            "please",
            "hundred",
            "ten"
          ]
        ],
        "feedback": "The shopping plan is complete. You compared prices, checked space, and placed a clear order. Well done!",
        "word": "order"
      }
    ]
  },
  {
    "id": "design",
    "person": "ben",
    "title": "The Aquarium Design Brief",
    "reward": 130,
    "summary": "Plan a beautiful aquarium within a customer's budget.",
    "steps": [
      {
        "say": "A visitor wants an aquarium that feels peaceful. Describe the kind of aquarium you would design. Include at least one detail about its colors or decorations.",
        "hint": "I would design a peaceful aquarium with green plants and smooth stones.",
        "min": 10,
        "groups": [
          [
            "aquarium",
            "plants"
          ],
          [
            "aquarium",
            "stones"
          ],
          [
            "aquarium",
            "green"
          ],
          [
            "aquarium",
            "blue"
          ]
        ],
        "feedback": "That gives us a useful starting point. Now let's work out what we can afford.",
        "word": "design"
      },
      {
        "say": "Look at the design board beside my workshop. A pebble arch costs fifty coins and seaweed costs thirty-five. Tell me the cost of both together.",
        "hint": "The pebble arch and the seaweed cost eighty-five coins altogether.",
        "min": 10,
        "groups": [
          [
            "arch",
            "seaweed",
            "85"
          ],
          [
            "arch",
            "seaweed",
            "eighty",
            "five"
          ]
        ],
        "requires": "workshop",
        "feedback": "Yes, eighty-five coins altogether. We should always add the prices before buying.",
        "word": "budget"
      },
      {
        "say": "Our customer has one hundred coins. After spending eighty-five, how much will be left? Explain the subtraction in a sentence.",
        "hint": "After spending eighty-five coins, the customer will have fifteen coins left.",
        "min": 9,
        "groups": [
          [
            "15",
            "left"
          ],
          [
            "fifteen",
            "left"
          ]
        ],
        "feedback": "Correct. Saving the remaining coins could help with a future aquarium upgrade.",
        "word": "remaining"
      },
      {
        "say": "Now describe where the two decorations should go. Put the seaweed at the back and choose a position for the arch. Use two location phrases.",
        "hint": "The seaweed goes at the back, and the arch goes in the middle.",
        "min": 12,
        "groups": [
          [
            "seaweed",
            "back",
            "arch",
            "middle"
          ],
          [
            "seaweed",
            "back",
            "arch",
            "left"
          ],
          [
            "seaweed",
            "back",
            "arch",
            "right"
          ]
        ],
        "feedback": "I can picture your layout. Location words make your instructions much clearer.",
        "word": "position"
      },
      {
        "say": "Why did you leave the middle of the aquarium fairly open? Explain how that choice helps the fish or helps us see them.",
        "hint": "I left some open space because the fish need room to swim around.",
        "min": 11,
        "groups": [
          [
            "because",
            "fish",
            "swim"
          ],
          [
            "because",
            "see",
            "fish"
          ],
          [
            "because",
            "fish",
            "space"
          ]
        ],
        "feedback": "Exactly. A useful design considers the living space as well as the decorations.",
        "word": "space"
      },
      {
        "say": "Imagine that the arch is difficult to move. Ask me for help with moving it. Be specific, and make your request polite.",
        "hint": "Could you please help me move the arch a little to the left?",
        "min": 10,
        "groups": [
          [
            "could",
            "please",
            "help",
            "arch"
          ],
          [
            "can",
            "please",
            "help",
            "arch"
          ],
          [
            "would",
            "please",
            "move",
            "arch"
          ]
        ],
        "feedback": "Of course. A specific request tells the other person what help you need.",
        "word": "request"
      },
      {
        "say": "Give the customer your final recommendation. Name both decorations, explain where the seaweed goes, and say how much the plan costs.",
        "hint": "Choose the arch and seaweed, put the seaweed at the back, and spend eighty-five coins.",
        "min": 13,
        "groups": [
          [
            "arch",
            "seaweed",
            "back",
            "85"
          ],
          [
            "arch",
            "seaweed",
            "back",
            "eighty",
            "five"
          ]
        ],
        "feedback": "Your design brief is complete. You planned the cost, described a layout, and explained your choices. Beautiful work!",
        "word": "recommendation"
      }
    ]
  },
  {
    "id": "delivery",
    "person": "finn",
    "title": "The Harbor Delivery",
    "reward": 160,
    "legacy": "count",
    "summary": "Read a schedule, organize a delivery, and respond to changing weather.",
    "steps": [
      {
        "say": "Ahoy! We have a delivery to organize before a boat leaves the harbor. Offer to help, and tell me one job you could do.",
        "hint": "I can help with the delivery by counting the boxes for you.",
        "min": 10,
        "groups": [
          [
            "help",
            "boxes"
          ],
          [
            "help",
            "delivery"
          ],
          [
            "help",
            "count"
          ],
          [
            "help",
            "schedule"
          ]
        ],
        "feedback": "Excellent. Let's read the schedule carefully before we start moving anything.",
        "word": "delivery"
      },
      {
        "say": "Check the notice beside the harbor gate. Which pier is the delivery going to, and what time does the boat leave? Include both details.",
        "hint": "The delivery goes to East Pier, and the boat leaves at four thirty.",
        "min": 11,
        "groups": [
          [
            "east",
            "pier",
            "four",
            "thirty"
          ],
          [
            "east",
            "pier",
            "4",
            "30"
          ]
        ],
        "requires": "harbor-board",
        "feedback": "That's right: East Pier, at four thirty. Clear details prevent a lot of confusion.",
        "word": "schedule"
      },
      {
        "say": "There are three red boxes and two blue boxes. Tell me how many boxes we have altogether, using a complete sentence.",
        "hint": "There are five boxes altogether, with three red boxes and two blue boxes.",
        "min": 10,
        "groups": [
          [
            "five",
            "boxes",
            "altogether"
          ],
          [
            "5",
            "boxes",
            "altogether"
          ]
        ],
        "feedback": "Five boxes. Now we can check that every box arrives at the right place.",
        "word": "altogether"
      },
      {
        "say": "It is four o'clock now, and the boat leaves at four thirty. How much time do we have left? Tell me what we should do next.",
        "hint": "We have thirty minutes left, so we should move the boxes to East Pier.",
        "min": 12,
        "groups": [
          [
            "thirty",
            "minutes",
            "boxes"
          ],
          [
            "30",
            "minutes",
            "boxes"
          ],
          [
            "half",
            "hour",
            "boxes"
          ]
        ],
        "feedback": "Good planning. We have enough time if we stay organized and work carefully.",
        "word": "minutes"
      },
      {
        "say": "We need a rope, and Ben has one at his workshop. What would you say to ask if you may borrow it? Include the reason you need it.",
        "hint": "Could I please borrow a rope because we need it for the delivery?",
        "min": 11,
        "groups": [
          [
            "borrow",
            "rope",
            "please",
            "delivery"
          ],
          [
            "borrow",
            "rope",
            "please",
            "boxes"
          ]
        ],
        "feedback": "That request is polite and clear. Giving a reason helps Ben understand the situation.",
        "word": "borrow"
      },
      {
        "say": "The wind has become stronger. Read the notice at the lighthouse lookout. Should we leave immediately, or wait? Explain what the sign tells us to do.",
        "hint": "We should wait in the harbor until the light turns green because of the wind.",
        "min": 12,
        "groups": [
          [
            "wait",
            "green",
            "wind"
          ],
          [
            "wait",
            "green",
            "safe"
          ],
          [
            "wait",
            "green",
            "notice"
          ]
        ],
        "requires": "lighthouse",
        "feedback": "Exactly. We wait for the green signal. A schedule is important, but safe decisions come first.",
        "word": "signal"
      },
      {
        "say": "The signal is green now. Give me a final delivery report with the number of boxes, the destination, and the reason we waited.",
        "hint": "The five boxes are going to East Pier, and we waited because of the strong wind.",
        "min": 14,
        "groups": [
          [
            "five",
            "boxes",
            "east",
            "pier",
            "because",
            "wind"
          ],
          [
            "5",
            "boxes",
            "east",
            "pier",
            "because",
            "wind"
          ]
        ],
        "feedback": "Delivery complete! You followed a schedule, asked for help, and adapted to a change. A fine job, harbor helper!",
        "word": "report"
      }
    ]
  }
];
export const greetings={
  "lily": "Hello again! I am planning a welcome day for new visitors. Could you help me make a thoughtful plan?",
  "mia": "Welcome to the fish market! Today we are helping a customer compare prices and choose fish within a budget.",
  "ben": "Hello, designer! I have a new aquarium design brief. We need a beautiful layout and a sensible budget.",
  "finn": "Ahoy, explorer! A boat is waiting for a delivery. Let's check the schedule, count the boxes, and keep an eye on the weather."
};
export const discoveries=[
  {
    "id": "library",
    "name": "Library Notice",
    "x": 620,
    "y": 500,
    "title": "Harbor Library",
    "text": "Open every day from 9:00 a.m. to 5:00 p.m. The reading room is indoors. Visitors are welcome to meet here on rainy afternoons.",
    "tag": "Opening hours"
  },
  {
    "id": "market-board",
    "name": "Market Price Board",
    "x": 1940,
    "y": 570,
    "title": "Mia's Fish Market",
    "text": "Goldfish: 45 coins. Guppy: 50 coins. Blue tang: 60 coins. Compare prices, check your aquarium's space, and ask questions before choosing.",
    "tag": "Compare prices"
  },
  {
    "id": "workshop",
    "name": "Design Board",
    "x": 720,
    "y": 1060,
    "title": "Ben's Design Workshop",
    "text": "Pebble arch: 50 coins. Dancing seaweed: 35 coins. Peach coral: 45 coins. Design challenge: choose an arch and seaweed with a budget of 100 coins.",
    "tag": "Plan a budget"
  },
  {
    "id": "harbor-board",
    "name": "Harbor Schedule",
    "x": 2020,
    "y": 1300,
    "title": "Today's Delivery",
    "text": "Destination: East Pier. Departure: 4:30 p.m. Cargo: 3 red boxes and 2 blue boxes. Check the lighthouse signal before leaving the harbor.",
    "tag": "Read a schedule"
  },
  {
    "id": "lighthouse",
    "name": "Lighthouse Lookout",
    "x": 2330,
    "y": 1350,
    "title": "Harbor Weather Notice",
    "text": "Strong winds near the harbor entrance. Boats must wait in the harbor until the lighthouse signal turns green. Ask the captain before setting off.",
    "tag": "Solve a problem"
  },
  {
    "id": "garden",
    "name": "Garden Trail",
    "x": 2290,
    "y": 610,
    "title": "The Quiet Garden",
    "text": "Welcome to the garden. Please stay on the paths, leave flowers for everyone to enjoy, and put any litter in the bins. What could you do to keep this place beautiful?",
    "tag": "Explore"
  },
  {
    "id": "beach",
    "name": "Shell Beach",
    "x": 1220,
    "y": 1420,
    "title": "Shell Beach",
    "text": "Look at the shapes and colors along the shore. Describe three things you can see, and compare the biggest and smallest shells. Leave living creatures where you found them.",
    "tag": "Explore"
  }
];

for(const d of discoveries){d.x=Math.round(d.x*18/13);d.y=Math.round(d.y*4/3);}
const ids=new Set(adventures.map(a=>a.id)),spotIds=new Set(discoveries.map(s=>s.id));
export function ensureAdventures(state){
 if(!state.adventures)state.adventures={progress:{},completed:[],discovered:[]};
 if(!state.town)state.town={x:1030,y:980};
 if(state.townMapVersion!==2){state.town={x:Math.round(state.town.x*18/13),y:Math.round(state.town.y*4/3)};state.townMapVersion=2;}
 return state.adventures;
}
export function validAdventures(a){
 if(a===undefined)return true;
 return a&&a.progress&&typeof a.progress==='object'&&!Array.isArray(a.progress)&&Array.isArray(a.completed)&&Array.isArray(a.discovered)&&
 Object.entries(a.progress).every(([id,n])=>ids.has(id)&&Number.isInteger(n)&&n>=0&&n<=adventures.find(x=>x.id===id).steps.length)&&
 a.completed.every(id=>ids.has(id))&&new Set(a.completed).size===a.completed.length&&a.discovered.every(id=>spotIds.has(id))&&new Set(a.discovered).size===a.discovered.length;
}
export function checkAnswer(text,step,mode='standard'){
 return assessAnswer(text,step,mode);
}
export function finishAdventure(state,id){
 const a=ensureAdventures(state),mission=adventures.find(m=>m.id===id);
 if(!mission||a.progress[id]!==mission.steps.length)return null;
 const replay=a.completed.includes(id),paid=replay?35:mission.reward;
 if(!replay)a.completed.push(id);state.coins+=paid;a.progress[id]=0;
 if(mission.legacy&&!state.completed.includes(mission.legacy))state.completed.push(mission.legacy);
 return {...mission,paid,replay};
}
