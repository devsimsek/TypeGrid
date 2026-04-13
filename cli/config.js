const fs = require('fs');
const path = require('path');
const blessed = require('blessed');

const DATA_FILE = path.join(__dirname, '../data/typegrid.json');
const TARGET_VERSION = "4.0.0";

// Load data
let apiData = {};
try {
  apiData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
} catch (error) {
  console.error('Error loading typegrid.json:', error.message);
  process.exit(1);
}

// Ensure defaults
if (!apiData.site) apiData.site = {};
if (!apiData.settings) {
  apiData.settings = {
    layout: { columns_desktop: 3, columns_tablet: 2, columns_mobile: 1 },
    sort: { field: "place", order: "asc" },
    show_thumbnails: true,
    ui: { monospace_font: "monospace", accent_color: apiData.site.accent || "#ea9a97" }
  };
}
if (!apiData.settings.layout) apiData.settings.layout = { columns_desktop: 3, columns_tablet: 2, columns_mobile: 1 };
if (!apiData.settings.sort) apiData.settings.sort = { field: "place", order: "asc" };
if (!apiData.settings.ui) apiData.settings.ui = { monospace_font: "monospace", accent_color: "#ea9a97" };
if (apiData.settings.show_thumbnails === undefined) apiData.settings.show_thumbnails = true;

if (!apiData.pagination) {
  apiData.pagination = { page_size: 12, total_projects: 0, total_pages: 1, pages: [] };
}
if (!apiData.socials) {
  apiData.socials = { links: [], share_templates: {} };
}
if (!apiData.socials.links) apiData.socials.links = [];

if (!apiData.site.authors) apiData.site.authors = [{}];
if (!apiData.site.authors[0]) apiData.site.authors[0] = {};
if (!apiData.site.authors[0].socials) apiData.site.authors[0].socials = [];

function saveData() {
  const total = (apiData.projects || []).length;
  apiData.pagination.total_projects = total;
  apiData.pagination.total_pages = Math.max(1, Math.ceil(total / apiData.pagination.page_size));
  if (apiData.site.accent) {
    apiData.settings.ui.accent_color = apiData.site.accent;
  }
  if (!apiData.meta) apiData.meta = {};
  apiData.meta.version = TARGET_VERSION;
  fs.writeFileSync(DATA_FILE, JSON.stringify(apiData, null, 2), 'utf-8');
}

// Screen setup
const screen = blessed.screen({ smartCSR: true, title: 'TypeGrid Configurator', warnings: true, fullUnicode: true });

const msg = blessed.message({
  parent: screen,
  top: 'center',
  left: 'center',
  width: 'shrink',
  height: 'shrink',
  padding: { top: 1, bottom: 1, left: 2, right: 2 },
  tags: true,
  border: { type: 'line' },
  style: {
    fg: 'white',
    bg: 'blue',
    border: { fg: 'white', bg: 'blue' }
  },
  hidden: true
});

function toast(text, time = 2) {
  msg.display(`{center}${text}{/center}`, time, () => {});
}

// Layouts
const categoryList = blessed.list({
  parent: screen, top: 0, left: 0, width: '30%', height: '90%',
  keys: true, vi: true, mouse: true, tags: true, border: { type: 'line' },
  style: { fg: 'white', selected: { bg: '#ea9a97', fg: 'black' }, border: { fg: '#ea9a97' } },
  label: ' Configuration ',
  items: [
    'Site Details', 
    'UI & Layout Settings',
    'Sorting Configuration', 
    'Pagination Settings', 
    'Global Social Links', 
    'Author Details',
    'Author Social Links'
  ]
});

const optionList = blessed.list({
  parent: screen, top: 0, left: '30%', width: '70%', height: '90%',
  keys: true, vi: true, mouse: true, tags: true, border: { type: 'line' },
  style: { fg: 'white', selected: { bg: '#ea9a97', fg: 'black' }, border: { fg: '#ea9a97' } },
  label: ' Options ',
  items: []
});

const helpBox = blessed.box({
  parent: screen, bottom: 0, left: 0, width: '100%', height: '10%',
  border: { type: 'line' },
  style: { fg: 'gray', border: { fg: 'gray' } },
  content: ' Global: [q]uit | Categories: [l/Enter] focus | Options: [h/Esc] back, [Enter] edit/toggle'
});

// Modals
const prompt = blessed.prompt({
  parent: screen, top: 'center', left: 'center', width: '60%', height: 'shrink',
  border: 'line', hidden: true, tags: true, padding: 1,
  style: { fg: 'white', bold: true, border: { fg: '#ea9a97' } }
});

const question = blessed.question({
  parent: screen, top: 'center', left: 'center', width: '50%', height: 'shrink',
  border: 'line', hidden: true, tags: true, padding: 1,
  style: { fg: 'white', bold: true, border: { fg: '#ea9a97' } }
});

let currentCategoryIndex = 0;

function renderOptions() {
  const opts = [];
  if (currentCategoryIndex === 0) {
    opts.push(`{cyan-fg}Title:{/cyan-fg} ${apiData.site.title || ''}`);
    opts.push(`{cyan-fg}Description:{/cyan-fg} ${apiData.site.description || ''}`);
    opts.push(`{cyan-fg}Base URL:{/cyan-fg} ${apiData.site.base_url || ''}`);
    opts.push(`{cyan-fg}Accent Color:{/cyan-fg} ${apiData.site.accent || ''}`);
    opts.push(`{cyan-fg}Language:{/cyan-fg} ${apiData.site.lang || 'en-US'}`);
    opts.push(`{cyan-fg}Favicon:{/cyan-fg} ${apiData.site.favicon || ''}`);
  } else if (currentCategoryIndex === 1) {
    opts.push(`{cyan-fg}Desktop Columns:{/cyan-fg} ${apiData.settings.layout.columns_desktop}`);
    opts.push(`{cyan-fg}Tablet Columns:{/cyan-fg} ${apiData.settings.layout.columns_tablet}`);
    opts.push(`{cyan-fg}Mobile Columns:{/cyan-fg} ${apiData.settings.layout.columns_mobile}`);
    opts.push(`{cyan-fg}Show Thumbnails:{/cyan-fg} ${apiData.settings.show_thumbnails ? 'Yes' : 'No'} (Press Enter to toggle)`);
    opts.push(`{cyan-fg}Monospace Font:{/cyan-fg} ${apiData.settings.ui.monospace_font || 'monospace'}`);
  } else if (currentCategoryIndex === 2) {
    opts.push(`{cyan-fg}Field:{/cyan-fg} ${apiData.settings.sort.field || 'place'} (Press Enter to toggle)`);
    opts.push(`{cyan-fg}Order:{/cyan-fg} ${apiData.settings.sort.order || 'asc'} (Press Enter to toggle)`);
  } else if (currentCategoryIndex === 3) {
    opts.push(`{cyan-fg}Albums per page:{/cyan-fg} ${apiData.pagination.page_size || 12}`);
  } else if (currentCategoryIndex === 4) {
    opts.push(`{green-fg}[+] Add New Link{/green-fg}`);
    apiData.socials.links.forEach(link => {
      opts.push(`{red-fg}[Delete]{/red-fg} {cyan-fg}${link.platform}:{/cyan-fg} ${link.url}`);
    });
  } else if (currentCategoryIndex === 5) {
    opts.push(`{green-fg}[+] Add New Author{/green-fg}`);
    apiData.site.authors.forEach((author, i) => {
      opts.push(`{magenta-fg}[Author ${i+1}]{/magenta-fg} {cyan-fg}Name:{/cyan-fg} ${author.name || ''}`);
      opts.push(`{magenta-fg}[Author ${i+1}]{/magenta-fg} {cyan-fg}URL:{/cyan-fg} ${author.url || ''}`);
      opts.push(`{magenta-fg}[Author ${i+1}]{/magenta-fg} {cyan-fg}Avatar:{/cyan-fg} ${author.avatar || ''}`);
      opts.push(`{magenta-fg}[Author ${i+1}]{/magenta-fg} {red-fg}[-] Delete Author{/red-fg}`);
    });
  } else if (currentCategoryIndex === 6) {
    opts.push(`{green-fg}[+] Add New Author Link{/green-fg}`);
    apiData.site.authors.forEach((author, i) => {
      (author.socials || []).forEach(link => {
        opts.push(`{magenta-fg}[Author ${i+1}]{/magenta-fg} {red-fg}[Delete]{/red-fg} {cyan-fg}${link.platform}:{/cyan-fg} ${link.url}`);
      });
    });
  }
  optionList.setItems(opts);
  screen.render();
}

categoryList.on('select item', (item, index) => {
  currentCategoryIndex = index;
  renderOptions();
});

categoryList.key(['right', 'l', 'enter'], () => {
  optionList.focus();
});

optionList.key(['left', 'h', 'escape'], () => {
  categoryList.focus();
});

optionList.key(['enter', 'e'], () => {
  const idx = optionList.selected;

  if (currentCategoryIndex === 0) { // Site Details
    const fields = ['title', 'description', 'base_url', 'accent', 'lang', 'favicon'];
    const labels = ['Site Title', 'Site Description', 'Base URL', 'Accent Color Hex', 'Language (e.g. en-US)', 'Favicon URL/Path'];
    const field = fields[idx];
    prompt.input(`Enter ${labels[idx]}:`, apiData.site[field] || '', (err, val) => {
      if (!err && val !== null) {
        apiData.site[field] = val;
        saveData();
        toast('Settings saved.');
        renderOptions();
        optionList.select(idx);
      } else {
        screen.render();
      }
    });
  } else if (currentCategoryIndex === 1) { // UI & Layout
    if (idx >= 0 && idx <= 2) {
      const fields = ['columns_desktop', 'columns_tablet', 'columns_mobile'];
      const labels = ['Desktop Columns', 'Tablet Columns', 'Mobile Columns'];
      prompt.input(`Enter ${labels[idx]}:`, String(apiData.settings.layout[fields[idx]]), (err, val) => {
        if (!err && val !== null) {
          const parsed = parseInt(val, 10);
          if (!isNaN(parsed) && parsed > 0) {
            apiData.settings.layout[fields[idx]] = parsed;
            saveData();
            toast('Settings saved.');
            renderOptions();
            optionList.select(idx);
          }
        }
        screen.render();
      });
    } else if (idx === 3) { // Toggle Show Thumbnails
      apiData.settings.show_thumbnails = !apiData.settings.show_thumbnails;
      saveData();
      toast('Settings saved.');
      renderOptions();
      optionList.select(idx);
    } else if (idx === 4) { // Monospace Font
      prompt.input(`Enter Monospace Font Family:`, apiData.settings.ui.monospace_font || '', (err, val) => {
        if (!err && val !== null) {
          apiData.settings.ui.monospace_font = val;
          saveData();
          toast('Settings saved.');
          renderOptions();
          optionList.select(idx);
        } else {
          screen.render();
        }
      });
    }
  } else if (currentCategoryIndex === 2) { // Sorting
    if (idx === 0) { // Field
      const fields = ['place', 'year', 'title', 'created_at'];
      let cur = fields.indexOf(apiData.settings.sort.field);
      apiData.settings.sort.field = fields[(cur + 1) % fields.length];
    } else if (idx === 1) { // Order
      apiData.settings.sort.order = apiData.settings.sort.order === 'asc' ? 'desc' : 'asc';
    }
    saveData();
    toast('Settings saved.');
    renderOptions();
    optionList.select(idx);
  } else if (currentCategoryIndex === 3) { // Pagination
    prompt.input('Enter albums per page:', String(apiData.pagination.page_size || 12), (err, val) => {
      if (!err && val !== null) {
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed) && parsed > 0) {
          apiData.pagination.page_size = parsed;
          saveData();
          toast('Settings saved.');
          renderOptions();
          optionList.select(idx);
        }
      }
      screen.render();
    });
  } else if (currentCategoryIndex === 4) { // Global Socials
    if (idx === 0) { // Add
      prompt.input('Enter platform name (e.g. twitter, github):', '', (err, platform) => {
        if (err || !platform) { screen.render(); return; }
        prompt.input('Enter full URL:', '', (err, url) => {
          if (!err && url) {
            apiData.socials.links.push({ platform: platform.toLowerCase(), url });
            saveData();
            toast('Settings saved.');
            renderOptions();
            optionList.select(apiData.socials.links.length); // select newly added
          } else {
            screen.render();
          }
        });
      });
    } else { // Delete
      const linkIdx = idx - 1;
      question.ask(`Delete ${apiData.socials.links[linkIdx].platform} link? (y/n)`, (err, val) => {
        if (!err && val) {
          apiData.socials.links.splice(linkIdx, 1);
          saveData();
          toast('Settings saved.');
          renderOptions();
          optionList.select(Math.max(0, idx - 1));
        } else {
          screen.render();
        }
        optionList.focus();
      });
    }
  } else if (currentCategoryIndex === 5) { // Author Details
    if (idx === 0) {
      apiData.site.authors.push({ name: '', url: '', avatar: '', socials: [] });
      saveData();
      toast('Settings saved.');
      renderOptions();
      optionList.select(apiData.site.authors.length * 4 - 3);
    } else {
      const authorIdx = Math.floor((idx - 1) / 4);
      const fieldIdx = (idx - 1) % 4;
      if (fieldIdx === 3) {
        question.ask(`Delete Author ${authorIdx + 1}? (y/n)`, (err, val) => {
          if (!err && val) {
            apiData.site.authors.splice(authorIdx, 1);
            saveData();
            toast('Settings saved.');
            renderOptions();
            optionList.select(0);
          } else {
            screen.render();
          }
          optionList.focus();
        });
      } else {
        const fields = ['name', 'url', 'avatar'];
        const labels = ['Author Name', 'Author URL', 'Author Avatar URL'];
        const field = fields[fieldIdx];
        prompt.input(`Enter ${labels[fieldIdx]}:`, apiData.site.authors[authorIdx][field] || '', (err, val) => {
          if (!err && val !== null) {
            apiData.site.authors[authorIdx][field] = val;
            saveData();
            renderOptions();
            optionList.select(idx);
          } else {
            screen.render();
          }
        });
      }
    }
  } else if (currentCategoryIndex === 6) { // Author Socials
    if (idx === 0) { // Add
      if (apiData.site.authors.length === 0) return;
      let promptStr = 'Enter Author Number (1';
      if (apiData.site.authors.length > 1) promptStr += `-${apiData.site.authors.length}`;
      promptStr += '):';
      prompt.input(promptStr, '1', (err, num) => {
        const aIdx = parseInt(num, 10) - 1;
        if (err || isNaN(aIdx) || aIdx < 0 || aIdx >= apiData.site.authors.length) { screen.render(); return; }
        prompt.input('Enter platform name (e.g. twitter, instagram):', '', (err, platform) => {
          if (err || !platform) { screen.render(); return; }
          prompt.input('Enter full URL:', '', (err, url) => {
            if (!err && url) {
              if (!apiData.site.authors[aIdx].socials) apiData.site.authors[aIdx].socials = [];
              apiData.site.authors[aIdx].socials.push({ platform: platform.toLowerCase(), url });
              saveData();
              toast('Settings saved.');
              renderOptions();
              optionList.select(idx);
            } else {
              screen.render();
            }
          });
        });
      });
    } else { // Delete
      let targetIdx = idx - 1;
      let foundAIdx = -1;
      let foundSIdx = -1;
      for (let i = 0; i < apiData.site.authors.length; i++) {
        const socials = apiData.site.authors[i].socials || [];
        if (targetIdx < socials.length) {
          foundAIdx = i;
          foundSIdx = targetIdx;
          break;
        }
        targetIdx -= socials.length;
      }
      if (foundAIdx !== -1) {
        question.ask(`Delete Author ${foundAIdx + 1}'s ${apiData.site.authors[foundAIdx].socials[foundSIdx].platform} link? (y/n)`, (err, val) => {
          if (!err && val) {
            apiData.site.authors[foundAIdx].socials.splice(foundSIdx, 1);
            saveData();
            toast('Settings saved.');
            renderOptions();
            optionList.select(Math.max(0, idx - 1));
          } else {
            screen.render();
          }
          optionList.focus();
        });
      }
    }
  }
});

screen.key(['q', 'C-c'], () => {
  return process.exit(0);
});

// Initialize
renderOptions();
categoryList.focus();
screen.render();