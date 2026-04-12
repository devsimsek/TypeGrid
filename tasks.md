### **UX Enhancements & CLI Consolidation**

- [ ] **1. Merge CLI Scripts (`npm run typegrid`)**
  - Consolidate `albums.js`, `config.js`, and `generate.js` into a single, unified entry point (e.g., `cli/index.js`).
  - Add a main menu TUI that lets the user choose between: "Manage Albums", "Site Configuration", "Auto-Generate API", and "Exit".
  - Update `package.json` to use a single master command instead of three separate ones.

- [ ] **2. Visual Polish & Colors**
  - Add colorized tags to lists (e.g., gold `[★]`/`[Fav]`, dim `[Draft]`).
  - Clearly mark the primary image in the image list (e.g., `[Primary]`).

- [ ] **3. Feedback & Notifications**
  - Implement a global Toast Notification system (a floating box that pops up with messages like "✅ Saved" or "🗑️ Deleted" and auto-hides after a few seconds).

- [ ] **4. Config Spacing & Grouping**
  - Add spacing and colored section headers to complex lists (like Author Details in Config) to make them easier to read and manage.

- [ ] **5. Modal & Prompt Styling**
  - Improve the padding, borders, and bolding of `blessed` prompts and questions so they feel like native, polished dialog boxes.

- [ ] **6. Loading States**
  - Add clear, stylized `[ Loading Preview... ]` indicators for heavy operations like rendering large ANSI images so the UI never feels frozen.