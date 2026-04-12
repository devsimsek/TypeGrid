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

## Managing Your Portfolio

TypeGrid reads from `data/typegrid.json` on load. This file acts as your database and API. While you can edit it manually, TypeGrid comes with powerful interactive CLI tools to manage your portfolio effortlessly.

First, install the required dependencies:
```bash
npm install
```

### The Interactive Album Manager (TUI)

TypeGrid includes a full Terminal User Interface (TUI) built for keyboard-first management of your photo library:

```bash
npm run albums
```

- **Visual Navigation:** View your albums, images, and visual ASCII previews directly in the terminal.
- **Album Management:** Create (`c`), edit (`e`), and delete (`d`) albums.
- **Image Management:** Add (`a`), delete (`d`), and reorder images using Vim bindings (`Shift+J` / `Shift+K`).
- **Metadata Editing:** Quickly edit tags (`t`), camera (`c`), lens (`l`), or edit everything (`e`). Set primary images (`p`).
- **Autoscan:** Press `s` to automatically scan an album's folder on disk, extract EXIF data, calculate dimensions, and import new photos seamlessly.
- **Updates:** Press `u` to check for and install OTA updates from the TypeGrid repository.

### Configuration & Generation CLI

- `npm run config`: An interactive wizard to update your site title, description, SEO, themes, and social links.
- `npm run generate`: A batch scanner that auto-generates your `typegrid.json` from the `/images/` directory, extracting EXIF data and handling collisions.

### Manual Edits
You can always edit `data/typegrid.json` manually if you prefer. Read the [API Reference](api.md) for the complete JSON schema.

Alpine.js handles the routing, rendering, and state management completely client-side.

---

Explore the [Features](features.md), [Architecture](architecture.md), and [API Reference](api.md) pages for deep dives into TypeGrid's capabilities and structural design.