# Welcome to TypeGrid

TypeGrid is a static, minimal photographers' portfolio designed with a monospace, retro-UI aesthetic and a developer-first experience.

## Why TypeGrid?

- **Zero Build Step:** Runs entirely on Vanilla HTML/CSS and Alpine.js. No Node modules, no Webpack, no Vite.
- **Vim-like Navigation:** Navigate your entire gallery using `h/j/k/l`, `Enter`, `Esc`, `gg`, and `G`.
- **Fully Data-Driven:** Your entire portfolio (projects, collections, SEO, themes) is defined in a single `data/typegrid.json` file.
- **Dual Themes:** Built-in, toggleable support for the gorgeous Rose Pine Moon (Dark) and Rose Pine Dawn (Light) themes.
- **Responsive & Fast:** Mobile-first CSS architecture, lazy-loaded images, and a highly optimized, lightweight DOM.
- **Advanced Lightbox:** Fullscreen image viewing with native zooming, panning, image metadata, and instant downloads.

## Quick Start

Since TypeGrid requires no build tools, you can run it using any static file server.

```bash
git clone <repository-url> TypeGrid
cd TypeGrid
python3 -m http.server 8000
```

Then visit `http://localhost:8000` in your browser.

## Editing Your Portfolio

TypeGrid reads from `data/typegrid.json` on load. This file acts as your database and API. Read the [API Reference](api.md) for the complete JSON schema.

To add a new project manually:
1. Open `data/typegrid.json`.
2. Add a new object to the `projects` array.
3. Refresh the page.

### Auto-Generating the API (Local Images)

If you host your images locally in the `/images/` directory (grouped into subdirectories for each project), you can use the built-in API Generator to automatically populate your portfolio!

1. Place your project folders inside `/images/` (e.g., `/images/my-trip/photo1.jpg`).
2. Install the generator dependencies and run the script:
   ```bash
   npm install
   npm run generate
   ```
3. The interactive CLI will scan your directories and automatically rewrite your `typegrid.json` by doing the following:
   - **Extract EXIF Data:** Pulls Camera, Lens, and Date for individual images and calculates exact dimensions.
   - **Prompt for New Albums:** Asks you to input tags when it discovers a new directory.
   - **Non-Destructive Updates:** Preserves your existing custom titles, descriptions, SEO overrides, and skips already tracked images.
   - **Collision Handling:** Prompts for confirmation before deleting albums from the config that no longer exist in the `/images/` directory.

Alpine.js handles the routing, rendering, and state management completely client-side.

---

Explore the [Features](features.md), [Architecture](architecture.md), and [API Reference](api.md) pages for deep dives into TypeGrid's capabilities and structural design.