# Changelog

All notable changes to TypeGrid will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.1] - 2026-04-14

### Added
- **Explicit Reorder (`r`)**: Added a dedicated `r` keybinding to both Album and Image lists in the TUI to easily move items to specific positions.
- **Config TUI Expansion**: Added UI & Layout settings (columns, thumbnails, font), Site Language, and Favicon to the Configurator.
- **Multi-Author Support**: Overhauled the Config TUI to natively manage infinite Authors and their isolated nested social links.
- **Album Toggles**: Added `f` to toggle Album Favorite status and `v` to toggle Album Draft (Visibility) status in the Album Manager.

### Changed
- Swapped raw `exec()` shell commands with the robust cross-platform `open` npm package for launching images (`o`), securely handling absolute `https://` URLs and complex local paths on macOS/Windows/Linux.

### Fixed
- Resolved a crash (`TypeError: val.toLowerCase is not a function`) when answering `y/n` prompts for album deletion and OTA updates.
- Fixed an issue where the `?` Help menu displayed the outdated site version instead of the CLI version.
- Improved the OTA updater to use strict Semantic Versioning comparisons.
- Auto-syncs `typegrid.json` version strings with `package.json` upon TUI launch.

## [2.3.0] - 2026-04-14

### Added
- **Interactive Album Manager TUI (`npm run albums`):** A fully-featured raw mode terminal user interface built with `blessed` for managing your photo library.
- **Visual Image Previews:** View local images directly in the terminal using `terminal-image`.
- **Album Management:** Create, edit (title, year, description, tags), and delete albums without touching JSON.
- **Image Management:** Add, delete, and easily reorder images using Vim-like bindings (`Shift+J`/`Shift+K`).
- **Granular Metadata Editing:** Quickly edit individual image properties like Tags (`t`), Camera (`c`), and Lens (`l`), or edit them sequentially (`e`).
- **Set Primary Image:** Mark any image as the album cover instantly (`p`).
- **Open in OS:** Launch images in your system's default viewer (`o`).
- **Autoscan Directory (`s`):** Automatically scan physical album folders for new files, prompt for inclusion, and auto-extract EXIF metadata and dimensions.
- **OTA Updates (`u`):** Built-in updater that checks GitHub for the latest versions of the CLI tools and themes, fetching them directly into your local setup.
- **Help Menu (`?`):** Comprehensive in-app keybinding reference.

## [2.2.0] - 2026-04-12

### Added
- **Album Placement & Sorting:** Added `place` field to albums for curated ordering.
- **Dynamic Sorting UI:** Added a sort dropdown in the grid view to sort by Curated (place), Latest, Oldest, Recently Added (created_at), and A-Z.
- **Dynamic Tag Filtering:** Added a filter dropdown to instantly filter albums by category tags directly from the UI.
- **Settings Configurator CLI:** Added `npm run config` (`cli/config.js`) to interactively maintain site settings, sorting, pagination, and footer social links.
- **CLI Reorganization:** Moved `generate.js` and `config.js` into a dedicated `cli/` directory. Added `package.json` scripts to run them cleanly.
- Added `Created_At` date string parsing to the sorting algorithm.

### Fixed
- Fixed an Alpine expression error (`null is not an object`) when an image didn't contain specific tags in the lightbox.
- Fixed an `e.target.tagName` error in the keyboard manager triggered by programmatic navigation.
- Fixed mobile navigation z-index overlap issues and added an explicit "Close Menu" button on mobile.

## [2.1.0] - 2026-04-10

### Added
- **Interactive API Generator (`npm run generate`):** A beautiful CLI wizard that scans the `/images` folder, extracts EXIF metadata (Camera, Lens, Date), calculates dimensions, and non-destructively updates `data/typegrid.json`.
- **Image-Level Schemas:** Images now support individual `camera`, `lens`, and `tags` properties, which the lightbox prefers before falling back to album-level defaults.
- **Automated Migrations:** The CLI tool automatically updates `v1.x` and `v2.0` schema definitions to `v2.1.0` and `v2.2.0` safely.
- **Documentation:** Added comprehensive documentation under `/docs` (Features, Architecture, API Reference).
- Local images support explicitly documented (`/images/README.md`).

## [2.0.0] - 2026-04-08

### Changed
- **Alpine.js Migration:** Completely rewrote the frontend from imperative Vanilla JavaScript to a declarative Alpine.js architecture. Replaced `app.js`, `loader.js`, and `lightbox.js` logic with `typegrid.js` (Alpine Stores and Data).
- **Theme Overhaul:** Replaced all default styles with strict **Rose Pine Moon** (Dark) and **Rose Pine Dawn** (Light) themes.
- **Typography & Geometry:** Switched entirely to monospaced fonts (`SF Mono`, `Monaco`, `Cascadia Code`). Removed all `border-radius` properties for a sharp, retro aesthetic.
- **Footer Redesign:** Improved the laptop/desktop footer layout and added "Powered by TypeGrid" branding.

### Added
- **Vim-like Keyboard Navigation:**
  - `h`/`j`/`k`/`l` for directional navigation.
  - `Enter`/`o` to open projects.
  - `gg` to go to top, `G` to bottom.
  - `t` to toggle themes.
  - `?` to open a dedicated keyboard shortcut help modal.
- **Advanced Lightbox:** Added native zooming, panning, EXIF metadata display, and image downloads directly to the photo viewer.
- **Pagination UI:** Added Next/Prev page buttons to the bottom of the grid view.
- Explicit inline script to prevent Flash of Unstyled Content (FOUC) when loading the theme preference.

## [1.0.0] - 2026-04-01

### Added
- Initial TypeGrid core.
- JSON-driven static database structure (`data/typegrid.json`).
- Mobile-first CSS variables and responsive breakpoints.
- Schema definitions for Sites, Projects, Collections, and Meta.