# TypeGrid Development Plan

## Project Overview
TypeGrid is a static, minimal photographers' portfolio with a monospace, retro-UI aesthetic. This plan outlines the development approach with a **mobile-first design philosophy**.

## Design Principles

### Mobile-First Approach
- **Base Design**: Optimize for mobile (1 column) first
- **Progressive Enhancement**: Layer in desktop features (2-3 columns) via CSS media queries
- **Touch-Friendly**: All interactive elements minimum 44x44px touch targets
- **Performance**: Minimize initial payload; lazy-load images and paginated content
- **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation throughout

### Visual Identity
- **Monospace, retro-UI aesthetic**: All fonts monospaced (SF Mono → Monaco → Cascadia Code → Roboto Mono)
- **Sharp corners**: No rounded corners anywhere (border-radius: 0) for clean, geometric design
- **Rose Pine Themes**:
  - Dark mode (default): Rose Pine Moon (#191724 bg, #e0def4 text, #ea9a97 accent)
  - Light mode: Rose Pine Dawn (#faf4ed bg, #575279 text, #d9484f accent)
  - Automatic switching based on `prefers-color-scheme` system preference
- High contrast for readability and accessibility
- Minimal animations (performant on mobile)
- Fullscreen lightbox image viewer with metadata and download functionality

---

## File Structure

```
TypeGrid/
├── index.html                 # Entry point (grid view)
├── plan.md                    # This file
├── readme.md                  # Schema & spec documentation
├── typegrid.json              # Sample data file
├── css/
│   ├── variables.css          # CSS variables (colors, spacing, fonts)
│   ├── reset.css              # Normalize & baseline styles
│   ├── mobile.css             # Mobile-first base styles (1 column)
│   ├── tablet.css             # Tablet breakpoint (2 columns)
│   ├── desktop.css            # Desktop breakpoint (3 columns)
│   ├── components.css         # Reusable UI components
│   └── animations.css         # Transitions & keyframes
├── js/
│   ├── app.js                 # Core application logic
│   ├── loader.js              # JSON loading & pagination
│   ├── renderer.js            # Grid & project page rendering
│   ├── lightbox.js            # Fullscreen image viewer with metadata & download
│   ├── importer.js            # Import/merge functionality
│   ├── exporter.js            # Export typegrid.json & optional ZIP
│   ├── utils.js               # Helper functions (slugify, validation)
│   └── share.js               # Social share integration
├── templates/
│   ├── grid.html              # Grid layout template
│   ├── project.html           # Project detail template
│   ├── footer.html            # Footer with authors & socials
│   └── header.html            # Header & navigation
├── assets/
│   ├── favicon.ico
│   ├── og-default.jpg
│   ├── avatars/               # Author avatars
│   └── icons/                 # Social platform icons (SVG)
└── data/
    ├── typegrid.json          # Main data file
    └── projects-page-*.json   # Optional paginated project files
```

---

## Mobile-First Component Breakdown

### 1. Header / Navigation
**Mobile:**
- Full-width header with site title
- Hamburger menu (touch-friendly, 48x48px minimum)
- Logo/favicon left-aligned
- No secondary nav on mobile

**Tablet/Desktop:**
- Horizontal nav with collections
- Breadcrumbs on detail pages
- Optional search/filter bar

### 2. Grid (Home Page)
**Mobile:**
- 1 column, full viewport width with padding
- Project cards as tall stacked blocks
- Primary image as thumbnail (responsive, `max-width: 100%`)
- Project title, year, excerpt below image
- Tap to expand or navigate to detail page

**Tablet:**
- 2 columns with appropriate gutter

**Desktop:**
- 3 columns (configurable via `settings.layout.columns_desktop`)
- Hover effects (reveal camera/lens info, expand social share options)

### 3. Project Detail Page
**Mobile:**
- Full-screen image carousel (vertical scroll or simple navigation)
- All metadata stacked below first image
- Camera/lens info in monospace
- Tags as small pill badges
- Excerpt/description in readable measure (max ~65 chars)

**Tablet/Desktop:**
- Two-column layout: images on left, metadata on right
- Sticky metadata sidebar (desktop)
- Next/previous project navigation

### 4. Footer with Authors & Socials
**Mobile:**
- Stacked layout
- Site description at top
- Author cards (name, avatar, socials) stacked vertically
- Each author's social links inline as icon buttons (24x24px minimum)
- Site-wide socials at bottom as horizontal button row

**Tablet/Desktop:**
- Grid layout: authors in a 2-column row
- Social icons inline with author name
- Site description and site socials side-by-side

### 5. Modal / Share Panel
**Mobile:**
- Full-screen or bottom-sheet modal
- Project social share templates expanded
- Copy-to-clipboard for URLs
- Large, tappable share buttons

**Desktop:**
- Compact modal overlay
- Share button in header or project detail

---

## Implementation Phases

### Phase 1: Core Rendering (Mobile MVP)
- [x] Sample `typegrid.json` created
- [x] Implement data loading and schema validation for typegrid.json
- [x] Migrate rendering layer to Alpine components (mobile-first templates)
- [x] Build Alpine store for app state (route, projects, current project, pagination, filters)
- [x] Rebuild header/navigation in Alpine (theme toggle + hamburger + keyboard hints)
- [x] Rebuild footer in Alpine with improved laptop layout + branding
- [x] Keep all components square-cornered and monospaced by default

**Deliverable:** Alpine-driven mobile-first app shell with working grid/project routing and data binding.

### Phase 2: Responsive Design & UX Polish
- [x] Add `responsive.css` media queries (2 columns at ~768px, 3 columns at ~1024px)
- [x] Implement image lazy-loading (loading="lazy" attribute)
- [x] Add smooth transitions & animations (CSS, minimal perf impact)
- [x] Touch-friendly interaction feedback (active states, hover on desktop)
- [x] Accessibility baseline: ARIA labels + keyboard navigation foundations
- [x] Rose Pine Moon (dark) & Rose Pine Dawn (light) themes
- [x] All monospaced fonts throughout
- [x] Remove all rounded corners for retro aesthetic
- [x] Redesign desktop/laptop footer composition for clarity and balance
- [x] Add explicit in-UI theme switcher affordance with persistent state feedback

**Deliverable:** Responsive, mobile-first UI system with stable dark/light theming and improved desktop ergonomics.

### Phase 3: Advanced Features
- [x] Fullscreen image viewer with metadata + download button
- [x] Prev/next project navigation
- [x] Click-to-fullscreen image interactions on project detail pages
- [x] Add album control system (project/image navigation, metadata toggle, download/share actions)
- [x] Implement zoomable photo view (buttons, keyboard, wheel/pinch; reset and bounds)
- [x] Add improved gallery interaction model for touch + keyboard parity
- [ ] Implement `utils.js`: slug generation, validation, date formatting
- [ ] Implement `pagination.js`: client-side paging with ?page=N and /page/N/ routes
- [ ] Implement `share.js`: expand social share templates, open share modals
- [ ] Add search/filter by tags or year (tag routing partially implemented)

**Deliverable:** Feature-complete album experience with fullscreen viewing, zoom, controls, and sharing.

### Phase 4: Client-Side Data Management
- [ ] Implement `importer.js`: import typegrid.json, merge with existing, conflict resolution
- [ ] Implement `exporter.js`: download updated typegrid.json
- [ ] Client-side form UI for editing project metadata
- [ ] Confirm on unsaved changes

**Deliverable:** Full import/export, in-browser editing capability.

### Phase 5: Export to Static Files (Optional ZIP Builder)
- [ ] Generate per-project HTML with prerendered meta tags
- [ ] Absolute OG image URLs in exported HTML
- [ ] Optional ZIP builder: HTML + images + typegrid.json
- [ ] Robots.txt and sitemap.xml generation

**Deliverable:** Exportable static site ready for deployment.

---

## Technical Stack

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Mobile-first, CSS variables, Grid/Flexbox for layouts
- **Alpine.js** (primary UI runtime): lightweight reactivity for routing state, gallery state, theme switching, filters, and UI interactions
  - Alpine stores/components for route, projects, current project, lightbox, and controls
  - Progressive enhancement with minimal JS bundle overhead
  - localStorage for persisted user preferences (theme, UI behavior)
- **Vanilla JavaScript utilities**: focused helpers for data loading, keyboard manager, and media interactions

### Data Format
- **JSON**: typegrid.json as the single source of truth
- Optional **paginated JSON files** for large portfolios (projects-page-1.json, etc.)

### Performance Targets (Mobile-First)
- Initial load: < 3s on 4G
- Lazy-load images: ~500ms per image on 4G
- JSON payload: < 500KB uncompressed
- CSS: < 50KB minified
- JS: < 100KB minified (including all logic)

---

## Styling Approach (Mobile-First)

### CSS Architecture
1. **variables.css**: Define --color-accent, --font-mono, --spacing-unit, etc.
2. **reset.css**: Normalize across browsers; set base font, line-height
3. **mobile.css**: Single-column layout, baseline typography, component styles
4. **tablet.css**: @media (min-width: 768px) — 2-column grid
5. **desktop.css**: @media (min-width: 1024px) — 3-column grid
6. **components.css**: Reusable classes: .btn, .card, .badge, etc.
7. **animations.css**: Smooth transitions for interactive elements

### Breakpoints
- **Mobile**: 0px – 767px (1 column)
- **Tablet**: 768px – 1023px (2 columns)
- **Desktop**: 1024px+ (3 columns)

### Touch & Hover States
- Buttons: `:active` (mobile tap feedback) + `:hover` (desktop)
- Links: Underline on focus, color change on active
- All touch targets: minimum 44x44px (44x48px recommended)

---

## Data Flow

```
typegrid.json (local/remote)
    ↓
loader.js (fetch, parse, validate)
    ↓
app.js (state management, route handling)
    ↓
renderer.js (generate HTML from data)
    ↓
UI (grid, detail pages, footer)
    ↓
[User interaction: scroll, click, share]
    ↓
importer.js (merge new data) / exporter.js (download JSON/ZIP)
```

---

## Key Implementation Details

### Rendering Grid (Mobile)
- Loop `projects[]` → create `.card` divs (1 per row on mobile)
- Each card: primary image + title + year + tags
- On click: navigate to `/projects/{slug}/` or modal detail view

### Rendering Project Detail
- Display all images from `project.images[]`
- Render meta: title, year, camera, lens, tags, description
- Generate SEO meta tags in `<head>` (title, description, OG, canonical)
- Render social share buttons from `socials.share_templates`

### Footer with Authors
```
For each site.authors[]:
  - Render author avatar (img)
  - Render author name (linked if site.authors[].url present)
  - For each site.authors[].socials[]:
    - Render social icon + link (platform-specific icon SVG)
```

### Pagination
- If `pagination.pages[]` absent: compute client-side
  - `page = floor((index / page_size) + 1)`
  - Render page nav: prev/next buttons, page indicators
- If `pagination.pages[]` present: fetch projects-page-N.json on demand

---

## SEO & Meta Tags

### Per-Project Page (Generated at Render Time)
```html
<title>{title} — {site.title}</title>
<meta name="description" content="{excerpt or description}">
<link rel="canonical" href="{canonical_url or site.base_url/projects/{slug}/}">

<meta property="og:title" content="{title}">
<meta property="og:description" content="{excerpt}">
<meta property="og:image" content="{absolute_og_image_url}">
<meta property="og:url" content="{project.url}">
<meta property="og:type" content="website">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{excerpt}">
<meta name="twitter:image" content="{absolute_og_image_url}">
```

---

## Accessibility Checklist

- [ ] Semantic HTML: `<header>`, `<nav>`, `<main>`, `<footer>`, `<article>`, `<section>`
- [ ] ARIA labels on interactive elements (buttons, icons, modals)
- [ ] Keyboard navigation: Tab, Enter, Escape in all interfaces
- [ ] Color contrast: WCAG AA minimum (4.5:1 for text)
- [ ] Images: `alt` text for all photos and avatars
- [ ] Focus indicators: visible `:focus` styles on all interactive elements
- [ ] Screen reader testing: VoiceOver (Mac), NVDA (Windows)
- [ ] Mobile screen reader: iOS VoiceOver, Android TalkBack

---

## Testing Strategy

### Manual Testing
- [ ] Grid renders correctly on iPhone SE (375px), iPad (768px), Desktop (1024px+)
- [ ] Project detail pages load all images and metadata
- [ ] Social share buttons open correct URLs
- [ ] Footer authors and socials display properly
- [ ] Pagination works (if > page_size projects)
- [ ] Import/export roundtrip: JSON → edit → export → re-import

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Android

---

## Deployment

- **Static hosting**: GitHub Pages, Netlify, Vercel (no backend needed)
- **Optional**: Build step (minify CSS/JS, optimize images)
- **SEO**: robots.txt, sitemap.xml (auto-generated from projects[])
- **CDN**: Serve images from CDN for fast delivery on mobile networks

---

## Future Enhancements

- [x] Complete Alpine migration for all UI rendering/state paths
- [x] Vim-like keyboard navigation layer across the full UI
  - [x] Global navigation keys (h/j/k/l, gg, G, Enter/o, Esc, /, ?)
  - [x] Photo viewer keys (h/l, +/-, z, 0, d)
  - [x] Focus management and visible keyboard target states
- [x] Add keyboard shortcut help overlay and discoverability cues
- [x] Add “Powered by TypeGrid” branding block in footer/system surfaces
- [ ] Blog posts feature (with `/posts/{slug}/` routes)
- [ ] Admin auth panel for client-side editing (localStorage + passphrase)
- [ ] Infinite scroll option (fetch next page on scroll)
- [ ] PWA manifest for installable web app
- [ ] Image optimization pipeline (WebP, srcset generation)
- [ ] Analytics integration (privacy-respecting)