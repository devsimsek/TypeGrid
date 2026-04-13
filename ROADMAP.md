# TypeGrid Roadmap

Welcome to the TypeGrid Roadmap! This document outlines the planned features, architectural changes, and core goals for the project. TypeGrid is evolving from a strictly CLI-managed static photo portfolio into a highly capable, zero-dependency content management system.

## 🚀 Upcoming Milestones

### Phase 1: Core Enhancements (Short-term)
- **Advanced Markdown Parsing:** Transition from the lightweight custom Alpine.js parser to a robust, extensible library to support tables, syntax-highlighted code blocks, and complex inline HTML.
- **RSS & Atom Feeds:** Auto-generate `rss.xml` during the `npm run generate` step to allow readers to subscribe to new blog posts and portfolio updates.
- **Drafts & Preview Workflow:** Enhance the router and generator to safely exclude `draft` posts from `sitemap.xml` and production views while allowing local previews.
- **Image Processing Polish:** Add support for automated AVIF generation alongside WebP for even smaller payload sizes.
- **CLI Git Management:** Integrate local Git operations (commit, push, branch management) directly into the CLI tools to seamlessly version control configuration, images, and posts.

### Phase 2: Local Web Admin Interface (Medium-term)
*The primary focus for the next major architectural shift. We will build a local graphical interface to supplement (and eventually replicate) the CLI.*

- **Local Dashboard:** Build a local Node.js-based server (e.g., `localhost:3000`) that provides a beautiful, web-based admin panel.
- **Visual Media Management:** Implement drag-and-drop file uploads for photos, allowing users to visually upload, reorder, and delete images without touching the filesystem manually.
- **Browser-Based Content Editing:** Replace the reliance on `$EDITOR` with a built-in split-pane Markdown editor for writing posts and pages directly in the browser.
- **Live Theme & Config Preview:** Allow users to tweak UI variables, colors, typography, and sorting algorithms in the web UI and see the changes reflected live.
- **API Consolidation:** Unify the disparate `cli/*.js` scripts into a clean local REST API that powers the new web dashboard.
- **Dashboard Git Management:** Provide a visual interface for Git operations (commit, push, branch management) directly within the web admin panel.

### Phase 3: Ecosystem & Extensibility (Long-term)
- **Client-Side Search:** Implement a lightweight, zero-dependency static search index (e.g., using a pre-compiled JSON index) to search across posts, pages, and image tags.
- **Theme Engine:** Decouple the core HTML from the Rose Pine CSS variables to support community-authored, hot-swappable themes.
- **1-Click Deployments:** Add integration tokens to the local dashboard to allow one-click publishing of the static site output to Vercel, Netlify, or GitHub Pages.
- **Plugin Hooks:** Create a middleware system for users to inject custom scripts (like analytics, comment systems, or external media hosts) seamlessly.

## 💡 How to Contribute
If you're interested in helping build any of the features listed above, check out the `docs/contributing.md` guide and open an issue or pull request on GitHub!