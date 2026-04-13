const fs = require('fs');
const path = require('path');
const blessed = require('blessed');

const DATA_FILE = path.join(__dirname, '../data/typegrid.json');

// Load data
let apiData = {};
try {
  apiData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
} catch (error) {
  console.error('Error loading typegrid.json:', error.message);
  process.exit(1);
}

// Ensure defaults
if (!apiData.posts) apiData.posts = [];
if (!apiData.pages) apiData.pages = [];

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(apiData, null, 2), 'utf-8');
}

// Screen setup
const screen = blessed.screen({ smartCSR: true, title: 'TypeGrid Post & Page Manager', warnings: true, fullUnicode: true });

const msg = blessed.message({
  parent: screen,
  top: 'center',
  left: 'center',
  width: 'shrink',
  height: 'shrink',
  padding: { top: 1, bottom: 1, left: 2, right: 2 },
  tags: true,
  border: { type: 'line' },
  style: { fg: 'white', bg: 'blue', border: { fg: 'white', bg: 'blue' } },
  hidden: true
});

function toast(text, time = 2) {
  msg.display(`{center}${text}{/center}`, time, () => {});
}

// Layouts
const categoryList = blessed.list({
  parent: screen, top: 0, left: 0, width: '20%', height: '90%',
  keys: true, vi: true, mouse: true, tags: true, border: { type: 'line' },
  style: { fg: 'white', selected: { bg: '#ea9a97', fg: 'black' }, border: { fg: '#ea9a97' } },
  label: ' Category ',
  items: ['Posts', 'Pages']
});

const itemList = blessed.list({
  parent: screen, top: 0, left: '20%', width: '30%', height: '90%',
  keys: true, vi: true, mouse: true, tags: true, border: { type: 'line' },
  style: { fg: 'white', selected: { bg: '#ea9a97', fg: 'black' }, border: { fg: '#ea9a97' } },
  label: ' Items '
});

const previewBox = blessed.box({
  parent: screen, top: 0, left: '50%', width: '50%', height: '90%',
  tags: true, border: { type: 'line' },
  style: { fg: 'white', border: { fg: '#ea9a97' } },
  label: ' Preview '
});

const footer = blessed.box({
  parent: screen, bottom: 0, left: 0, width: '100%', height: '10%',
  tags: true, border: { type: 'line' },
  style: { fg: 'white', border: { fg: '#ea9a97' } },
  content: ' {bold}q{/bold}: Quit | {bold}a{/bold}: Add | {bold}e{/bold}: Edit | {bold}d{/bold}: Delete | {bold}Enter{/bold}: View'
});

// Input Prompts
const promptBox = blessed.box({
  parent: screen, top: 'center', left: 'center', width: '60%', height: 'shrink',
  border: 'line', hidden: true, tags: true, padding: 1,
  style: { fg: 'white', border: { fg: '#ea9a97' } }
});

const promptText = blessed.text({
  parent: promptBox, top: 0, left: 0, width: '100%', content: '', tags: true
});

const promptInput = blessed.textbox({
  parent: promptBox, top: 2, left: 0, height: 1, width: '100%',
  keys: true, mouse: true, inputOnFocus: true, style: { bg: 'black', fg: 'white' }
});

const prompt = {
  input: function(label, value, cb) {
    promptText.setContent(`{bold}${label}{/bold}`);
    promptInput.value = value;
    promptBox.show();
    promptInput.focus();
    screen.render();
    
    promptInput.removeAllListeners('submit');
    promptInput.removeAllListeners('cancel');
    
    promptInput.on('submit', (val) => {
      promptBox.hide();
      cb(null, val);
    });
    promptInput.on('cancel', () => {
      promptBox.hide();
      cb(new Error('cancelled'), null);
    });
  }
};

const question = {
  ask: function(q, cb) {
    prompt.input(q, '', (err, val) => {
      if (err) return cb(err, false);
      const a = val.toLowerCase();
      cb(null, a === 'y' || a === 'yes');
    });
  }
};

let currentCategory = 0; // 0 = Posts, 1 = Pages
let currentItemIdx = 0;

function getActiveArray() {
  return currentCategory === 0 ? apiData.posts : apiData.pages;
}

function updateItemList() {
  const arr = getActiveArray();
  itemList.setItems(arr.map((item, i) => `${i + 1}. ${item.title || item.id}`));
  if (arr.length === 0) {
    previewBox.setContent('No items found.');
  }
  screen.render();
}

function showPreview(idx) {
  const arr = getActiveArray();
  if (!arr[idx]) {
    previewBox.setContent('No item selected.');
    screen.render();
    return;
  }
  
  const item = arr[idx];
  let text = `{bold}ID/Slug:{/bold} ${item.id}\n`;
  text += `{bold}Title:{/bold} ${item.title}\n`;
  if (currentCategory === 0) {
    text += `{bold}Date:{/bold} ${item.date || 'N/A'}\n`;
    text += `{bold}Tags:{/bold} ${(item.tags || []).join(', ') || 'N/A'}\n`;
    text += `{bold}Excerpt:{/bold} ${item.excerpt || 'N/A'}\n`;
  }
  text += `{bold}File Path:{/bold} ${item.file || 'N/A'}\n`;
  
  let fileContent = '';
  if (item.file) {
    const fullPath = path.join(__dirname, '../', item.file);
    if (fs.existsSync(fullPath)) {
      fileContent = fs.readFileSync(fullPath, 'utf-8').substring(0, 500) + '...';
    } else {
      fileContent = '[File not found]';
    }
  }
  
  text += `\n{bold}--- File Preview ---{/bold}\n${fileContent}`;
  previewBox.setContent(text);
  screen.render();
}

categoryList.on('select item', (item, index) => {
  currentCategory = index;
  currentItemIdx = 0;
  updateItemList();
  showPreview(0);
});

categoryList.key(['right', 'l', 'enter'], () => {
  if (getActiveArray().length > 0) {
    itemList.focus();
  }
});

itemList.key(['left', 'h', 'escape'], () => {
  categoryList.focus();
});

itemList.on('select item', (item, index) => {
  currentItemIdx = index;
  showPreview(index);
});

itemList.key(['a'], () => {
  const isPost = currentCategory === 0;
  const arr = getActiveArray();
  
  prompt.input('Enter title:', '', (err, title) => {
    if (err || !title) { itemList.focus(); screen.render(); return; }
    
    prompt.input('Enter slug/id:', title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), (err, slug) => {
      if (err || !slug) { itemList.focus(); screen.render(); return; }
      
      const folderName = isPost ? 'posts' : 'pages';
      const defaultFile = `./${folderName}/${slug}.md`;
      const fullPath = path.join(__dirname, '../', folderName, `${slug}.md`);
      
      if (!fs.existsSync(path.join(__dirname, '../', folderName))) {
        fs.mkdirSync(path.join(__dirname, '../', folderName), { recursive: true });
      }
      
      if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, `# ${title}\n\nContent goes here...`, 'utf-8');
      }
      
      const newItem = {
        id: slug,
        slug: slug,
        title: title,
        file: defaultFile,
        seo: {}
      };
      
      if (isPost) {
        newItem.date = new Date().toISOString().split('T')[0];
        newItem.excerpt = '';
        newItem.tags = [];
      }
      
      arr.push(newItem);
      saveData();
      toast('Item created!');
      updateItemList();
      itemList.select(arr.length - 1);
      itemList.focus();
    });
  });
});

itemList.key(['e'], () => {
  const arr = getActiveArray();
  if (arr.length === 0) return;
  const item = arr[currentItemIdx];
  
  prompt.input(`Edit Title (current: ${item.title}):`, item.title, (err, title) => {
    if (err || !title) { itemList.focus(); screen.render(); return; }
    item.title = title;
    
    if (currentCategory === 0) {
      prompt.input(`Edit Tags (comma separated):`, (item.tags || []).join(', '), (err, tags) => {
        if (!err && tags !== null) item.tags = tags.split(',').map(t => t.trim()).filter(Boolean);
        prompt.input(`Edit Excerpt:`, item.excerpt || '', (err, excerpt) => {
          if (!err && excerpt !== null) item.excerpt = excerpt;
          saveData();
          toast('Saved!');
          showPreview(currentItemIdx);
          updateItemList();
          itemList.focus();
        });
      });
    } else {
      saveData();
      toast('Saved!');
      showPreview(currentItemIdx);
      updateItemList();
      itemList.focus();
    }
  });
});

itemList.key(['d'], () => {
  const arr = getActiveArray();
  if (arr.length === 0) return;
  
  question.ask('Are you sure you want to delete this item? (y/n)', (err, val) => {
    if (!err && val) {
      arr.splice(currentItemIdx, 1);
      saveData();
      currentItemIdx = Math.max(0, currentItemIdx - 1);
      updateItemList();
      showPreview(currentItemIdx);
      toast('Deleted.');
    }
    itemList.focus();
  });
});

screen.key(['q', 'C-c'], () => {
  return process.exit(0);
});

// Init
updateItemList();
showPreview(0);
categoryList.focus();
screen.render();