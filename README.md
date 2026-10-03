# The Biome of Minecraft Modding

A hands-on academy for Minecraft Java modding, primarily Fabric 26.3 and Java 25.

## Learn online

GitHub Pages publishes the academy at https://biomeofminecraftmodding.esmp.app.

The online edition includes 100 lessons in 25 units, seven guided chapters, Minecraft-style machine interactions, UI design, Blockbench modelling, Piskel texture editing, debugging, Markdown, publishing, quizzes and project briefs. Progress, code drafts and notes are saved in your browser. Export progress from the progress page.

Java compilation and Ollama chat require the local edition. The website does not pretend to execute either on GitHub Pages.

## Run locally

Install Node.js 22+, Java 25 for coding labs, and Ollama with an installed model for the tutor.

    npm run build
    npm start

Open http://127.0.0.1:4320. On Windows, Start-Biome.cmd starts the local server and installed Ollama service. Local progress lives in data/progress.json and is excluded from Git.

The local edition compiles and runs 20 Java exercises with 91 cases. Submitted Java runs on your machine and is not a security sandbox.

## Build and deploy

    npm run build

The build creates dist/ using native Minecraft reference textures and browser storage. GitHub Actions publishes that folder to Pages after changes to main. Pages settings use GitHub Actions and the custom domain biomeofminecraftmodding.esmp.app. At your DNS provider, the subdomain CNAME target is tjtjklra529.github.io.

## Editors and art

The modelling editor embeds the official Blockbench web bundle with a Biome companion plugin for lesson loading, snapshots and bounds checks. The texture studio embeds the official Piskel example; export a PNG and import it into a 16×16 lesson to run its checks.

The academy uses selected unchanged Minecraft Java 26.3 item, block, GUI, font, creeper and zombie textures. Items and block faces retain native 16×16 resolution; mob skins retain their original atlases. Provenance, image dimensions and SHA-256 hashes are recorded in public/minecraft/provenance.json. Minecraft assets belong to Mojang/Microsoft and are excluded from the Biome MIT license. Original Biome press artwork is identified separately. The renderer uses six-face 3D meshes with nearest-neighbor texture sampling, UV-mapped mob parts and camera controls. No complete game archive or personal progress is published.

Biome source is MIT licensed. Blockbench resources and fonts retain upstream licenses; see public/vendor/THIRD_PARTY.md.
