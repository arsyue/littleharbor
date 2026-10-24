#!/usr/bin/env bash
set -euo pipefail
# All work runs on the GitHub-hosted runner. The browser renderer has no engine dependency.
node cloud/assets.mjs
node cloud/town-assets.mjs
node cloud/ground-assets.mjs
node cloud/room-assets.mjs
node cloud/expansion-assets.mjs
mkdir -p public
cp -R legacy/. public/
cp -R web/. public/
touch public/.nojekyll
test -s public/aquarium/aquarium.mjs
if find public -type f -name '*.wasm' | grep -q .; then
  echo "Unexpected engine binary in lightweight build" >&2
  exit 1
fi
node --check public/town/town.mjs
node --check public/town/scenery.mjs
node --check public/adventures.mjs
node --check public/app.mjs
node --check public/aquarium/aquarium.mjs
node --check public/aquarium/motion.mjs
node cloud/motion.test.mjs
node cloud/improvements.test.mjs
node cloud/interiors.test.mjs
node cloud/work.test.mjs
node cloud/signature.test.mjs
node --check public/work-game.mjs
node --check public/signature-controls.mjs
node --check public/signature-data.mjs
node --check public/room-data.mjs
node --check public/indoor-games.mjs
node -e "const fs=require('fs');const files=['index.html','app.mjs','style.css','aquarium.css','content.mjs','state.mjs','voice.mjs','speech-rules.mjs','readability.css','screen-mode.mjs','screen-mode.css','adventures.mjs','story-town.css','aquarium/index.html','aquarium/aquarium.mjs','aquarium/motion.mjs'];let total=0;for(const p of files)total+=fs.statSync('public/'+p).size;console.log('Initial game source:',total,'bytes');if(total>180000)throw Error('Initial download budget exceeded');"
