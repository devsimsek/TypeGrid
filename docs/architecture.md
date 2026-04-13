# Architecture

TypeGrid is built on a radically simple, dependency-free architecture. It eschews modern build tools (like Webpack, Vite, or Node.js) in favor of a static, client-side runtime powered by vanilla web technologies and Alpine.js.

This document outlines the core structural decisions and data flow of TypeGrid.

## Core Philosophy

1. **Zero Build Step:** Serve directly from a static file host. HTML, CSS, and JS are sent to the browser exactly as written.
2. **Data-Driven:** The entire state of the website (projects, theme, authors, SEO) is derived from a single JSON file.
3. **Progressive Enhancement:** Lightweight JavaScript (Alpine.js) layers reactivity, routing, and advanced interactions (like the lightbox and keyboard navigation) over a semantic HTML shell.

---

## 1. Data Layer (`data/typegrid.json`)

TypeGrid operates as a "headless" static site. The browser fetches `data/typegrid.json` on load, which acts as the database.

The JSON schema is strictly defined into functional areas:
- **`site`**: Global metadata, Open Graph defaults, and Author profiles (including avatars and social links).
- **`projects`**: The core entities. Arrays of project objects containing metadata, SEO overrides, and arrays of `images` (with exact dimensions, sizes, and a required `primary` flag).
- **`collections`**: Curated lists referencing project IDs.
- **`posts`**: Array of text-heavy blog posts. Content is fetched dynamically from external Markdown files, while metadata remains in JSON.
- **`pages`**: Array of standalone static pages (e.g., About, Contact). Content is fetched dynamically from external Markdown files.
- **`pagination`**: Controls how the grid renders (e.g., `page_size`).
- **`settings` & `socials`**: UI configurations and share templates.

*Data Loading:* The `DataLoader` class (`assets/js/loader.js`) is responsible for fetching, parsing, and caching this JSON. It provides helper methods to query projects by slug, tag, or page.

---

## 2. Application Layer (`assets/js/typegrid.js`)

The imperative vanilla JavaScript logic was completely migrated to **Alpine.js**, which now acts as the primary runtime.

### Alpine Stores
TypeGrid uses `Alpine.store` for global state management:
- **`theme`**: Manages the Rose Pine Moon (dark) and Rose Pine Dawn (light) themes. It initializes by checking `localStorage`, falling back to `window.matchMedia`, and listens for OS-level scheme changes. It directly mutates the `data-theme` attribute on the `<html>` element.
- **`lightbox`**: Manages the state of the fullscreen image viewer. It tracks the current image array, index, zoom level (`scale`), pan coordinates (`translate`), and metadata visibility.

### The `typegrid` Component
The main `<body x-data="typegrid">` component holds the application state:
- **Routing:** Listens to `hashchange` events. It parses `#/project/:slug`, `#/tag/:tag`, `#/post/:slug`, `#/page/:slug`, or `?page=N` and updates the `route`, `currentProject`, `currentPost`, and `paginatedProjects` state variables.
- **Keyboard Manager:** A centralized `handleKeydown(e)` method intercepts keystrokes to provide Vim-like navigation (`h/j/k/l`, `gg`, `G`, `Enter`, `Esc`). It handles contextual logic (e.g., routing keyboard events to the Lightbox store if it's open, or navigating the grid if closed).

---

## 3. Styling Architecture

TypeGrid uses a strict Mobile-First CSS architecture, utilizing CSS Custom Properties (Variables) for theming.

1. **`assets/css/variables.css`**: Defines the Rose Pine color palettes. Media queries (`@media (prefers-color-scheme)`) and attribute selectors (`[data-theme="..."]`) flip the variables between Dark and Light modes seamlessly. It also enforces the global `border-radius: 0` (sharp edges) and monospace font stacks.
2. **`assets/css/reset.css`**: Normalizes browser styles, applying the monospace font to all elements (including form inputs and buttons) and stripping default browser styling.
3. **`assets/css/mobile.css`**: The baseline styles for the application. Everything is styled for a single-column, touch-friendly interface first.
4. **`assets/css/responsive.css`**: Progressively enhances the layout for larger screens (e.g., converting the 1-column grid to 2 and 3 columns, transforming the mobile hamburger menu into a desktop header, and re-flowing the footer).

---

## 4. View Rendering

Because TypeGrid uses Alpine.js, HTML rendering is completely declarative.

- **`x-show` and `x-cloak`**: Used to toggle between the Loading Spinner, Grid View, and Project Detail View without flashing unstyled content.
- **`x-for`**: Iterates over `paginatedProjects` for the grid, and `currentProject.images` for the detail gallery.
- **Data Binding (`:src`, `x-text`)**: Automatically updates DOM elements when the route changes, instantly swapping out image URLs, text content, and metadata tags without full page reloads.

## 5. Advanced Interactions

### Zoomable Lightbox
The Lightbox utilizes CSS `transform: scale() translate()` bound to Alpine state variables. 
- Mouse/Touch events update the `panX` and `panY` variables.
- Keyboard/Button clicks update the `zoom` variable.
- The `transformStyle` getter in the store computes the final CSS string applied to the `<img />` element dynamically.

### Vim Navigation
The application tracks a `focusedIndex` integer for grid navigation. Pressing `j` or `k` increments/decrements this index, adding a `.ring-focus` CSS class to the corresponding DOM element and calling native `scrollIntoView()` to ensure the focused item remains visible.

---

## 6. SEO & Discovery

TypeGrid embraces static deployment for optimal indexability:
- **Dynamic Metadata:** The Alpine.js router automatically injects the appropriate `<title>`, `<meta name="description">`, and Open Graph tags for every project, post, and page as the user navigates.
- **Sitemap Generation:** The CLI tools auto-generate a `sitemap.xml` mapping all active projects, posts, and pages to ensure search engines can properly crawl the entire portfolio.
