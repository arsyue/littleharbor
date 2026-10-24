export const gameCatalog={
 "bakery": {
  "kind": "bakery",
  "name": "Baker for a Day",
  "description": "Measure, knead and bake three bread orders.",
  "level": 2,
  "reward": 90,
  "person": "ben"
 },
 "bistro": {
  "kind": "restaurant",
  "name": "Welcome & Serve",
  "description": "Welcome guests, remember requests and serve their meals.",
  "level": 2,
  "reward": 120,
  "person": "mia"
 },
 "pottery": {
  "kind": "pottery",
  "name": "Clay & Color",
  "description": "Shape, glaze and decorate a keepsake.",
  "level": 2,
  "reward": 75,
  "person": "ben"
 },
 "museum": {
  "kind": "museum",
  "name": "Junior Curator",
  "description": "Sort exhibits and explain their history.",
  "level": 3,
  "reward": 70,
  "person": "finn"
 },
 "library": {
  "kind": "library",
  "name": "The Missing Story",
  "description": "Sort books, rebuild a story and explain its clues.",
  "level": 3,
  "reward": 95,
  "person": "lily"
 },
 "market": {
  "kind": "market",
  "name": "Fish Market Budget",
  "description": "Choose fish, follow an order and calculate change.",
  "level": 2,
  "reward": 80,
  "person": "mia"
 },
 "workshop": {
  "kind": "workshop",
  "name": "Aquarium Designer",
  "description": "Place decorations according to a customer brief.",
  "level": 2,
  "reward": 85,
  "person": "ben"
 },
 "harbor": {
  "kind": "harbor",
  "name": "Cargo Captain",
  "description": "Load cargo and follow a route through the harbor.",
  "level": 3,
  "reward": 100,
  "person": "finn"
 },
 "aquarium": {
  "kind": "aquarium",
  "name": "Aquarium Care Lab",
  "description": "Read the care chart and restore a healthy tank.",
  "level": 1,
  "reward": 60,
  "person": "mia"
 },
 "cafe": {
  "kind": "cafe",
  "name": "Tea Garden Barista",
  "description": "Build drinks in order and prepare a takeaway tray.",
  "level": 2,
  "reward": 75,
  "person": "lily"
 },
 "garden": {
  "kind": "garden",
  "name": "Grow a Little Garden",
  "description": "Plant a flower bed and balance water and sunlight.",
  "level": 1,
  "reward": 60,
  "person": "ben"
 },
 "lighthouse": {
  "kind": "lighthouse",
  "name": "Signal Keeper",
  "description": "Decode light signals and guide a boat to safety.",
  "level": 3,
  "reward": 100,
  "person": "finn"
 },
 "studio": {
  "kind": "studio",
  "name": "Paint by Listening",
  "description": "Paint a picture from spoken directions.",
  "level": 2,
  "reward": 80,
  "person": "ben"
 },
 "post": {
  "kind": "post",
  "name": "Special Delivery",
  "description": "Sort letters and plan a delivery route.",
  "level": 2,
  "reward": 85,
  "person": "lily"
 },
 "music": {
  "kind": "music",
  "name": "Harbor Sound Studio",
  "description": "Listen to note patterns and create a short performance.",
  "level": 1,
  "reward": 65,
  "person": "lily"
 },
 "inn": {
  "kind": "inn",
  "name": "The Perfect Room",
  "description": "Match travelers to rooms and manage their requests.",
  "level": 3,
  "reward": 100,
  "person": "lily"
 }
};
export const gameByKind=Object.fromEntries(Object.values(gameCatalog).map(g=>[g.kind,g]));
export const difficultyNames=['','Explorer','Adventurer','Navigator'];
