# Features

TypeGrid is packed with advanced features designed for photographers and developers who appreciate minimal, keyboard-centric, and highly performant interfaces.

## ⚡️ Alpine.js Powered Reactivity
TypeGrid uses [Alpine.js](https://alpinejs.dev/) to handle UI state, routing, and reactivity. This provides the power of a modern JavaScript framework while remaining lightweight and entirely static. No build steps, no complex dependencies.

## ⌨️ Vim-like Keyboard Navigation
Navigate your entire portfolio without touching the mouse. TypeGrid features a global keyboard manager.

**Global Navigation:**
- `h` / `l`: Navigate Left/Right (Previous/Next Page or Project)
- `j` / `k`: Navigate Down/Up (Focus next/previous project in the grid)
- `Enter` or `o`: Open the currently focused project
- `gg`: Scroll to the absolute top
- `G`: Scroll to the absolute bottom
- `t`: Toggle Dark/Light theme
- `?`: Open the Keyboard Shortcuts Help Overlay
- `Esc`: Close modals or return to the grid

**Photo Viewer (Lightbox):**
- `h` / `l` or `←` / `→`: Previous/Next photo
- `+` / `-`: Zoom in/out
- `0`: Reset zoom to 1:1
- `z`: Toggle zoom state
- `m`: Toggle image metadata (Camera, Lens, Size, etc.)
- `d`: Download the current image
- `Esc`: Close the viewer

## 🔍 Advanced Zoomable Lightbox
Clicking any image opens the fullscreen lightbox. 
- **Zoom & Pan**: Smoothly zoom into high-resolution photos and pan around using the mouse scroll wheel, click-to-zoom, touch gestures, or keyboard shortcuts.
- **EXIF & Metadata**: Instantly view the image's dimensions, file size, camera model, and lens information.
- **Downloads**: One-click download button for your visitors to save images.

## 🎨 Rose Pine Themes & Retro Aesthetics
TypeGrid strictly adheres to a minimalist, retro-terminal aesthetic:
- **Dual Themes**: Built-in support for [Rosé Pine Moon](https://rosepinetheme.com/) (Dark Mode) and Rosé Pine Dawn (Light Mode). The app respects your system's `prefers-color-scheme` but allows manual toggling that persists via `localStorage`.
- **Monospace Everywhere**: Every single text element uses monospaced fonts (`SF Mono`, `Monaco`, `Cascadia Code`, etc.).
- **Sharp Geometry**: Absolutely no rounded corners (`border-radius: 0`). Buttons, cards, and images feature clean, sharp edges.

## 📱 Mobile-First Responsive Design
The UI is built from the ground up for mobile devices first. 
- Single column layouts on mobile scale beautifully to 2-column on tablets and 3-column on desktop displays.
- Touch targets are optimized for fingers (minimum 44x44px).
- Image galleries use CSS Grid and Flexbox for fluid scaling.
- The Desktop footer includes an elegant, responsive grid layout and "Powered by TypeGrid" branding.

## 🗄️ JSON Data-Driven
Your entire site is generated from a single `data/typegrid.json` file. 
There is no database to configure. Simply update the JSON file to add new projects, collections, or change site-wide SEO metadata. TypeGrid handles the rest, automatically paginating large galleries and generating dynamic routes.

## 📝 Integrated Blog & Pages
Beyond photography portfolios, TypeGrid natively supports text-heavy content like blog posts and standalone pages (e.g., "About", "Contact").
- **External Markdown**: Store your metadata cleanly in `typegrid.json` while fetching post and page content dynamically from standard `.md` files.
- **Unified Routing**: Seamlessly handles `#/post/:slug` and `#/page/:slug` without any extra configuration.
- **Advanced SEO & Sitemap**: Every post supports dedicated metadata and cover images. The CLI tools automatically generate a `sitemap.xml` mapping all active projects, posts, and pages to ensure search engines can properly crawl your portfolio.

## 🛠️ Interactive CLI Tools & TUI
If you prefer to host images locally, TypeGrid includes a suite of powerful interactive CLI tools to manage your portfolio effortlessly:

### 🖥️ Unified Master CLI (TUI)
Run `npm run typegrid` to launch a fully-featured, raw mode master menu right in your terminal, which provides access to the Album Manager, Post & Page Managers, Configurator, API Generator, and the OTA Updater.

#### 📁 Album Manager
- **Visual Previews**: View your local images as ASCII/ANSI previews directly in your terminal.
- **Album Management**: Create (`c`), edit (`e`), delete (`d`), toggle favorite (`f`), toggle visibility/draft (`v`), and reorder (`r` or `Shift+J/K`) albums without touching JSON.
- **Image Management**: Add (`a`), delete (`d`), open (`o`), and reorder (`r` or `Shift+J/K`) images.
- **Granular Edits**: Quickly edit individual image properties (`t` for tags, `c` for camera, `l` for lens).
- **Set Primary**: Mark any image as the album cover instantly (`p`).
- **Autoscan**: Press `s` to automatically scan an album's folder on disk, extracting EXIF data, generating WebP thumbnails, and adding new photos.
- **Scan EXIF**: Press `x` on any individual image to instantly extract its Dimensions, Camera, Lens, Creation Date, and generate a dominant-color placeholder.
- **OTA Updates**: Press `u` (or use the main menu) to check for and safely install over-the-air updates from the TypeGrid repository (prompts before overwriting user HTML).

#### 📝 Post & Page Managers
- **Content Management**: Interactive menus to create and manage your markdown blog posts and standalone pages directly from the terminal.
- **Metadata Handling**: Easily update SEO tags, slugs, cover images, and publish dates while keeping your markdown files clean and separate.

#### ⚙️ Configurator & API Generator
- **Configurator**: An interactive wizard to maintain site settings (language, favicon), layout & UI (columns, thumbnails, font), sorting algorithms, pagination, multiple authors, and global/author social links.
- **API Generator**: A batch scanner that auto-generates your `typegrid.json` from the `/images/` directory. It features smart EXIF extraction, WebP thumbnail generation, automatic garbage collection for orphaned thumbnails, collision handling, and non-destructive updates.
- **Automated Migrations**: Upgrades older `typegrid.json` shapes to the latest schema without data loss.