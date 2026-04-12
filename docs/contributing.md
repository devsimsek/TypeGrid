# Contributing to TypeGrid

Welcome to TypeGrid! We appreciate your interest in contributing to this minimal, static portfolio generator for photographers. This document outlines our development process, architecture philosophy, and how you can get involved.

## Our Development Process

TypeGrid is built with a strong emphasis on simplicity, keyboard-first interaction, and zero-build-step static deployments. Our development process reflects these priorities:

### 1. The Unified CLI Ecosystem
We maintain a unified, terminal-first CLI suite (`npm run typegrid`) built heavily on `blessed`. 
- **TUI First:** All backend management (albums, config, API generation, updates) happens via this Terminal User Interface. 
- **Safety & Fallbacks:** When modifying file operations or the OTA updater (`cli/update.js` / `cli/albums.js`), prioritize user data safety. Always prompt before overwriting custom files (like `index.html`) or deleting physical assets.
- **Performance:** We rely on `sharp` to generate WebP thumbnails and extract dominant colors. Be mindful of terminal memory limits (e.g., capping `terminal-image` preview sizes to 5MB to avoid V8 memory crashes on massive JPEGs).

### 2. Frontend Philosophy
The frontend (`index.html`, `js/typegrid.js`) is entirely static and client-side.
- **No Build Tools:** We use vanilla CSS and Alpine.js. Do not introduce Webpack, Vite, or npm-based build steps for the frontend.
- **Progressive Enhancement:** Features like lightbox zooming (scroll wheel and click-to-zoom), metadata toggling, and keyboard navigation (vim-like bindings) should gracefully handle edge cases.
- **Data Fetching:** The frontend relies strictly on `data/typegrid.json` acting as the sole API. Ensure any changes to the data schema are backward-compatible.

### 3. Iterative Bug Fixing & Hardening
When discovering or fixing bugs, we follow a structured approach:
- **Reproduce & Isolate:** Identify if the issue originates in the CLI data generation (e.g., path normalization) or the frontend rendering (e.g., empty album crashes).
- **Graceful Degradation:** Avoid fatal frontend crashes at all costs. For example, if an album is missing a primary image, gracefully fall back to the first available image. If a user customizes HTML, the OTA updater must warn them before overwriting.
- **Documentation & Versioning:** Always bump versions strictly following SemVer in `package.json`, `cli/config.js`, and `cli/albums.js`, and meticulously update `CHANGELOG.md` with your fixes or features.

## Local Setup

1. Fork and clone the repository.
2. Install CLI dependencies:
   ```bash
   npm install
   ```
3. Start a local server for frontend testing:
   ```bash
   npx serve # or python3 -m http.server 8000
   ```
4. Run the interactive CLI to test backend changes:
   ```bash
   npm run typegrid
   ```

## Submitting Changes

1. **Create a branch:** `git checkout -b feature/your-feature-name` or `bugfix/issue-description`.
2. **Make your changes:** Ensure your code adheres to our vanilla JS/CSS and `blessed` TUI standards.
3. **Test:** Run the CLI tools and check the frontend to ensure no regressions (especially around Windows path normalization, empty album states, and responsive CSS).
4. **Commit:** Write clear, concise commit messages (e.g., `feat: add zoom by scroll wheel` or `fix: resolve missing primary image crash`).
5. **Open a PR:** Describe your changes in detail, noting any schema modifications to `typegrid.json`.

Thank you for helping make TypeGrid a solid, dependable tool for creatives!
