# Changelog

All notable changes to TypeGrid will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.3.0] - 2026-04-14

### Added
- **CLI Markdown Parsing**: The CLI Post & Page Manager now features a custom syntax highlighter that parses and formats Markdown content (headers, bold, italic, code blocks, blockquotes, lists, links) into terminal-friendly ANSI colors and styles for the preview window.
- **Extended Preview**: The content preview length in the CLI has been expanded from 500 to 1500 characters.

## [4.2.0] - 2026-04-14

### Added
- **Content Editing**: Added the `o` (Edit Content) keybinding to the Post & Page CLI Manager to open the associated `.md` file directly in the system's default `$EDITOR` (e.g., nano, vim).
- **Path Autocomplete**: Pressing `Tab` while editing a File Path in the CLI Manager now auto-completes local directory paths and `.md` files.

### Fixed
- **UI Bleed-through**: Fixed a visual bug in the CLI where the background list items visibly bled through the floating input prompts.

## [4.1.0] - 2026-04-14

### Added
- **Expanded Post & Page Editing**: The `Manage Posts & Pages` CLI now allows comprehensive editing of all metadata fields (Slug/ID, Date, Tags, and File Path) sequentially, in addition to Title and Excerpt.
- **Improved CLI Navigation**: The `e` (Edit) action can now be triggered directly from the Category list in the Post Manager without needing to focus the Items list first.

## [4.0.0] - 2026-04-14

### Changed
- **Project Structure:** Moved the root `css/` and `js/` directories into a unified `assets/` folder to clean up the project structure.
- Updated `index.html`, the OTA updater (`cli/update.js`), and architecture documentation to resolve the new `assets/css/` and `assets/js/` paths.

### Added
- **CLI Banner:** The current installed TypeGrid version is now explicitly displayed at the top of the main CLI menu (`npm run typegrid`).

## [3.3.1] - 2026-04-14

### Added
- **Scan Posts & Pages**: Added `s` (Scan) functionality in the Post & Page CLI Manager to automatically detect and import untracked `.md` files in the `/posts` and `/pages` directories.
- **Updater Enhancements**: Added `--dry-run` and `--force` flags to the OTA updater (`cli/update.js`) to preview file changes without downloading, and bypass prompts for automated environments.

## [3.3.0] - 2026-04-14

### Added
- **CLI Post & Page Managers**: Added an interactive terminal UI menu to seamlessly create, edit, and delete text-heavy markdown posts and static pages.
- **Automatic Markdown Generation**: Creating a new post/page via the CLI automatically provisions a physical `.md` placeholder file locally.
- **Frontend Markdown Rendering**: Added a lightweight, zero-dependency Markdown parser in Alpine.js that fetches and renders markdown files instantly on route change.
- **New Routing**: Added `#/post/:slug` and `#/page/:slug` routes to support text content alongside the existing photography portfolio.
- **Reading Layout**: Added a clean, typography-focused reading layout template in `index.html` specifically designed for long-form text (max-width 768px, optimized line height).
- **Sitemap Generation**: The CLI auto-generator now outputs a comprehensive `sitemap.xml` mapping all active projects, posts, and pages using the `site.base_url` for optimal search engine crawling.

## [3.2.0] - 2026-04-14

### Added
- Added scroll wheel zoom and click-to-zoom functionality to the image lightbox viewer.

## [3.1.7] - 2026-04-14

### Fixed
- Fixed fatal frontend crash when loading empty albums.
- Fixed fatal frontend crash when the only primary image is deleted.
- Fixed hardcoded aspect ratio layout warp when manually adding local images via TUI.
- Fixed missing HTML prompt safety in TUI updater (`cli/albums.js`).
- Fixed crash when pressing `[p]` to set a primary image in TUI.
- Fixed Autoscan incorrectly injecting generated `.webp` thumbnails as new photos.
- Fixed silent data loss when editing comma-separated tags in TUI.

## [3.1.6] - 2026-04-14

### Fixed
- Generator Garbage Collection: `cli/generate.js` now actively unlinks any orphaned `-thumb.webp` files if the original hi-res file was manually deleted from the disk by the user.
- Unsafe OTA Updates: Both `cli/update.js` and `cli/albums.js` OTA updaters now explicitly prompt the user before downloading and overwriting `index.html`, preserving any custom `<head>` tags, analytics, or CSS edits the user might have deployed.


## [3.1.5] - 2026-04-14

### Fixed
- Added a strict 5MB physical file size limit on the terminal ASCII image rendering pipeline to completely prevent V8 memory crashes when a user previews a giant un-optimized camera JPEG. The TUI will now display a placeholder instructing them to press `x` to generate a lightweight thumbnail if the image is too large.


## [3.1.4] - 2026-04-14

### Fixed
- Addressed an issue where thumbnails and new images generated by `generate.js` saved absolute URLs (`/images/`) into the JSON config. This broke the frontend for sites hosted on a sub-domain root (e.g. `devsimsek.github.io/simsekframe/`). All generated URL paths now correctly use explicit relative paths (`./images/`) to ensure agnostic static site routing.
- `albums.js` and `generate.js` now instantly auto-migrate broken absolute paths to relative paths the moment they launch.


## [3.1.3] - 2026-04-14

### Fixed
- Addressed an unhandled case where the Auto-Generate API tool clobbered album array order. Previously, the CLI forcefully sorted albums at the end of the script using fallback logic. The CLI now rigidly retains the exact array order as saved in `typegrid.json` and perfectly inserts newly discovered albums into their prompted placement.
- Fixed an issue where the generator dropped and resurrected existing images (wiping their metadata) if the filename casing didn't exactly match the file system (e.g. `.JPG` vs `.jpg`). File resolution is now safely case-insensitive.


## [3.1.2] - 2026-04-14

### Added
- **Retroactive Optimization**: The Auto-Generate API script (`cli/generate.js`) now detects if existing, previously mapped photos in `typegrid.json` are missing `.webp` thumbnails or dominant colors. It will automatically process and heal them during the scan without destroying existing metadata.


## [3.1.1] - 2026-04-14

### Fixed
- Resolved `[Error rendering image preview: maxMemoryUsageInMB limit exceeded]` memory crashes in the TUI when viewing extremely high-resolution original images. The `Album Manager` now utilizes the lightweight auto-generated `-thumb.webp` files for the terminal ANSI preview instead.


## [3.1.0] - 2026-04-14

### Added
- **Performance:** Integrated `sharp` into the CLI to automatically generate ultra-fast `1200px` WebP thumbnails for all local images.
- **Performance:** Integrated dominant color extraction to provide beautifully seamless `background-color` placeholders while full images load.
- **Frontend:** Updated the portfolio grid and project list to utilize lazy-loading (`loading="lazy"`), asynchronous decoding (`decoding="async"`), and the new WebP thumbnails. The original full-res files are now exclusively fetched only when users open the fullscreen Lightbox.


## [3.0.5] - 2026-04-14

### Fixed
- Resolved a `TypeError: val.toLowerCase is not a function` crash in the OTA Updater (`cli/update.js`) when confirming the prompt to download the latest updates. The `blessed` TUI library internally returns booleans for question prompts, not strings.


## [3.0.4] - 2026-04-14

### Fixed
- Resolved a critical bug where the `Auto-Generate API` tool wiped out custom image order and rebuilt it alphabetically by discarding existing `typegrid.json` configurations.
- Fixed the API Generator overwriting custom `excerpt` properties on already existing albums.
- Added physical file/folder deletion prompts to the TUI `[d]` actions. Previously, deleting an item in the TUI only removed it from JSON, causing the `Auto-Generate API` script to constantly resurrect the deleted items because they still existed on disk.


## [3.0.3] - 2026-04-14

### Fixed
- Fixed a `TypeError: value.replace is not a function` crash in the Auto-Generate API (`cli/generate.js`) when a prompt was provided with a numeric default value (like Placement Order).


## [3.0.2] - 2026-04-14

### Added
- **Check for Updates**: Added a dedicated `Check for Updates` option to the main CLI menu (`npm run typegrid`), which safely encapsulates the OTA updater logic into its own `update.js` component.
- **Per-Image EXIF Scanner**: Pressing `x` in the Album Manager Image List will extract and save Camera, Lens, and Creation Date EXIF metadata for the focused image, while refreshing its dimensions.

### Fixed
- Resolved a bug where Album Autoscan crashed if a physical image directory did not perfectly match the project's slug ID (e.g., `26" Red` vs `26-red`).
- Resolved an issue in the ANSI image viewer where files prefixed with `./images/` rather than `/images/` were skipped and threw a "Preview not supported" error.


## [3.0.1] - 2026-04-14

### Fixed
- Fixed the OTA Updater omitting the newly introduced `cli/index.js` master entrypoint file.
- Corrected the OTA Updater's hardcoded UI file map to synchronize the correct static CSS and JS architecture.


## [3.0.0] - 2026-04-14

### Added
- **Unified CLI Entrypoint (`npm run typegrid`)**: Merged `albums.js`, `config.js`, and `generate.js` into a single master CLI with a main menu.
- **Toast Notifications**: Added a global transient notification system across all TUI screens for immediate feedback on saves, deletions, and generation events.
- **Visual Polish & Colors**: Added colorized tags (`[Fav]`, `[Draft]`, `[Primary]`) and syntax highlighting for configuration fields to improve readability.
- **Loading States**: Introduced stylized `[ Loading Preview... ]` indicators to prevent the UI from feeling frozen during heavy ANSI image rendering operations.

### Changed
- **Modal & Prompt Styling**: Improved padding, borders, and bolding of all `blessed` prompts and questions to feel like native dialog boxes.
- **Config Spacing & Grouping**: Added spacing and colored section headers to complex lists (like Author Details in Config) for easier management.

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
