# Little Harbor

An English-learning aquarium game with a Godot 4.7.2 3D aquarium and an accessible English browser interface.

## Cloud-only development

Source is edited through GitHub. GitHub Actions downloads the official Godot editor and matching web templates, exports the game, and runs Chromium checks on an Ubuntu cloud runner. No local engine installation, source checkout, or build output is needed.

- `godot/`: 3D fish geometry, swimming, aquarium lighting, water, and owned decorations.
- `web/`: updated game interface and the validated message bridge to Godot.
- `legacy/`: preserved published game logic, dialogue, voice input, and original production artwork.
- `cloud/`: asset preservation, export, and browser verification.
- `review/`: cloud-generated screenshots and verification results.

The original public site remains available at https://little-harbor-english-aquarium.abloom-chub-6743.chatgpt.site/

## Gameplay

Start with Sunny and Bubbles. Meet Lily, Mia, Ben, and Captain Finn in town. Answer English prompts to earn coins, buy fish and ornaments, and upgrade from Cozy Lagoon to Wonder Bay and Ocean Palace. Voice input is the default; Type instead is always available. The game stores progress in the browser and supports progress export/import from Settings.

The aquarium uses solid species-specific geometry, animated tails and fins, speed-limited steering, separation, wall avoidance, depth, and feeding attraction. Purchased decorations can be dragged across the substrate. It is a make-believe mixed-species aquarium, not an animal-care simulator.

## Publication

In repository Settings → Pages, set Source to GitHub Actions once. The build workflow uploads its web output only after browser checks pass, then publishes it through GitHub Pages. Build and review artifacts stay in GitHub.

The initial render is a procedural 3D art pass; the repository keeps original generated shop and town artwork independently for further visual refinement.

## Credits

The aquarium uses [Godot Engine](https://godotengine.org/license/) under the MIT license. [Godot third-party notices](https://github.com/godotengine/godot/blob/4.7.2-stable/COPYRIGHT.txt). Original production raster artwork was generated for this project.
