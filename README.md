# Little Harbor

An English-learning aquarium game with an original lightweight Canvas aquarium and an English interface.

## Cloud-only development

Source is edited through GitHub. GitHub Actions prepares and verifies the game in Chromium on a cloud runner, then publishes it. No local source checkout, engine installation, or build output is needed.

- web/aquarium/: original fish drawing, gradual steering, feeding, plants, depth, glass, water, and movable purchased ornaments.
- web/: game interface and same-origin validated aquarium messages.
- legacy/: preserved lessons, voice input, game rules and independently generated shop/town artwork.
- godot/: archived previous 3D implementation, excluded from the current deployment.
- cloud/: packaging and browser verification.
- review/: cloud-generated review screenshots and test results.

## Gameplay

Start with Sunny and Bubbles. Meet Lily, Mia, Ben, and Captain Finn. Answer English prompts to earn coins, buy fish and decorations, and upgrade your aquarium. Every conversation starts with voice input and always offers Type instead. Progress is stored in the browser and supports export/import.

Click empty water or use Feed fish to feed the aquarium. Click a fish to meet and name it. In Decorate mode, drag purchased ornaments. Daylight, pause and immersion controls are in the aquarium. The aquarium uses 2D drawings, layered depth, shading and perspective; it is not a full 3D scene.

## Performance and publication

The aquarium renderer has no package dependencies, engine download, fonts or external imagery. Main aquarium visuals draw immediately from code. Town and shop artwork is requested when those screens are opened. The cloud build enforces a 180 KB budget for initial uncompressed HTML, styles and JavaScript.

The GitHub Pages workflow only publishes after browser checks pass. The original GPT Site is a separate publication and is not automatically updated by this workflow.

## Art and reference

Polyquarium was selected by the user as an experience reference: calm swimming, feeding interaction and a planted aquarium. No Polyquarium source or artwork is included. The Canvas code and drawings are original to Little Harbor. Existing raster shop and town artwork was generated independently for this project.
