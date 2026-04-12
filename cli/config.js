const fs = require('fs');
const path = require('path');
const blessed = require('blessed');

const DATA_FILE = path.join(__dirname, '../data/typegrid.json');
const TARGET_VERSION = "2.3.0";

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
if (!apiData.settings.sort) apiData.settings.sort = { field: "place", order: "asc" };
if (!apiData.settings.ui) apiData.settings.ui = { accent_color: "#ea9a97" };

if (!apiData.pagination) {
  apiData.pagination = { page_size: 12, total_projects: 0, total_pages: 1, pages: [] };
}
if (!apiData.socials) {
  apiData.socials = { links: [], share_templates: {} };
}
if (!apiData.socials.links) apiData.socials.links = [];

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

// Layouts
const categoryList = blessed.list({
  parent: screen, top: 0, left: 0, width: '30%', height: '90%',
  keys: true, vi: true, mouse: true, border: { type: 'line' },
  style: { fg: 'white', selected: { bg: '#ea9a97', fg: 'black' }, border: { fg: '#ea9a97' } },
  label: ' Configuration ',
  items: ['Site Details', 'Sorting Configuration', 'Pagination Settings', 'Global Social Links']
});

const optionList = blessed.list({
  parent: screen, top: 0, left: '30%', width: '70%', height: '90%',
  keys: true, vi: true, mouse: true, border: { type: 'line' },
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
  border: 'line', hidden: true, style: { border: { fg: '#ea9a97' } }
});

const question = blessed.question({
  parent: screen, top: 'center', left: 'center', width: '50%', height: 'shrink',
  border: 'line', hidden: true, style: { border: { fg: '#ea9a97' } }
});

let currentCategoryIndex = 0;

function renderOptions() {
  const opts = [];
  if (currentCategoryIndex === 0) {
    opts.push(`Title: ${apiData.site.title || ''}`);
    opts.push(`Description: ${apiData.site.description || ''}`);
    opts.push(`Base URL: ${apiData.site.base_url || ''}`);
    opts.push(`Accent Color: ${apiData.site.accent || ''}`);
  } else if (currentCategoryIndex === 1) {
    opts.push(`Field: ${apiData.settings.sort.field || 'place'} (Press Enter to toggle)`);
    opts.push(`Order: ${apiData.settings.sort.order || 'asc'} (Press Enter to toggle)`);
  } else if (currentCategoryIndex === 2) {
    opts.push(`Albums per page: ${apiData.pagination.page_size || 12}`);
  } else if (currentCategoryIndex === 3) {
    opts.push(`[+] Add New Link`);
    apiData.socials.links.forEach(link => {
      opts.push(`[Delete] ${link.platform}: ${link.url}`);
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
    const fields = ['title', 'description', 'base_url', 'accent'];
    const labels = ['Site Title', 'Site Description', 'Base URL', 'Accent Color Hex'];
    const field = fields[idx];
    prompt.input(`Enter ${labels[idx]}:`, apiData.site[field] || '', (err, val) => {
      if (!err && val !== null) {
        apiData.site[field] = val;
        saveData();
        renderOptions();
        optionList.select(idx);
      } else {
        screen.render();
      }
    });
  } else if (currentCategoryIndex === 1) { // Sorting
    if (idx === 0) { // Field
      const fields = ['place', 'year', 'title', 'created_at'];
      let cur = fields.indexOf(apiData.settings.sort.field);
      apiData.settings.sort.field = fields[(cur + 1) % fields.length];
    } else if (idx === 1) { // Order
      apiData.settings.sort.order = apiData.settings.sort.order === 'asc' ? 'desc' : 'asc';
    }
    saveData();
    renderOptions();
    optionList.select(idx);
  } else if (currentCategoryIndex === 2) { // Pagination
    prompt.input('Enter albums per page:', String(apiData.pagination.page_size || 12), (err, val) => {
      if (!err && val !== null) {
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed) && parsed > 0) {
          apiData.pagination.page_size = parsed;
          saveData();
          renderOptions();
          optionList.select(idx);
        }
      }
      screen.render();
    });
  } else if (currentCategoryIndex === 3) { // Socials
    if (idx === 0) { // Add
      prompt.input('Enter platform name (e.g. twitter, github):', '', (err, platform) => {
        if (err || !platform) { screen.render(); return; }
        prompt.input('Enter full URL:', '', (err, url) => {
          if (!err && url) {
            apiData.socials.links.push({ platform: platform.toLowerCase(), url });
            saveData();
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
        if (!err && val && val.toLowerCase() === 'y') {
          apiData.socials.links.splice(linkIdx, 1);
          saveData();
          renderOptions();
          optionList.select(Math.max(0, idx - 1));
        } else {
          screen.render();
        }
        optionList.focus();
      });
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