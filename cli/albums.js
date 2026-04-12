const fs = require('fs');
const path = require('path');
const blessed = require('blessed');
const { exec } = require('child_process');
const https = require('https');
const terminalImageModule = require('terminal-image');
const terminalImage = terminalImageModule.default || terminalImageModule;
const sizeOf = require('image-size');
const exifr = require('exifr');

const dataPath = path.join(__dirname, '../data/typegrid.json');
const publicImagesPath = path.join(__dirname, '../'); // To resolve /images/...

// Load data
let typegridData = {};
try {
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  typegridData = JSON.parse(rawData);
} catch (error) {
  console.error('Error loading typegrid.json:', error.message);
  process.exit(1);
}

const projects = typegridData.projects || [];
let currentAlbumIndex = 0;
let currentImageIndex = 0;

let cliVersion = '1.0.0';
try {
  const pkgRaw = fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8');
  cliVersion = JSON.parse(pkgRaw).version;
} catch (e) {}

let needsSave = false;
if (typegridData.site && typegridData.site.version !== cliVersion) {
  typegridData.site.version = cliVersion;
  needsSave = true;
}
if (!typegridData.meta) typegridData.meta = {};
if (typegridData.meta.version !== cliVersion) {
  typegridData.meta.version = cliVersion;
  needsSave = true;
}

// Save helper
function saveData() {
  fs.writeFileSync(dataPath, JSON.stringify(typegridData, null, 2), 'utf-8');
}

if (needsSave) saveData();

// Create screen
const screen = blessed.screen({
  smartCSR: true,
  title: 'TypeGrid Album Manager',
  warnings: true,
  fullUnicode: true
});

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
const albumList = blessed.list({
  parent: screen,
  top: 0,
  left: 0,
  width: '30%',
  height: '90%',
  keys: true,
  vi: true,
  mouse: true,
  border: { type: 'line' },
  style: {
    fg: 'white',
    selected: { bg: '#ea9a97', fg: 'black' },
    border: { fg: '#ea9a97' }
  },
  label: ' Albums (Projects) ',
  items: projects.map(p => `${p.title} (${p.images ? p.images.length : 0})`)
});

const imageList = blessed.list({
  parent: screen,
  top: 0,
  left: '30%',
  width: '30%',
  height: '90%',
  keys: true,
  vi: true,
  mouse: true,
  border: { type: 'line' },
  style: {
    fg: 'white',
    selected: { bg: '#ea9a97', fg: 'black' },
    border: { fg: '#ea9a97' }
  },
  label: ' Images ',
  items: []
});

const previewBox = blessed.box({
  parent: screen,
  top: 0,
  left: '60%',
  width: '40%',
  height: '90%',
  border: { type: 'line' },
  tags: true,
  style: {
    fg: 'white',
    border: { fg: '#ea9a97' }
  },
  label: ' Preview & Details ',
  content: 'Select an image to preview.\n\nLocal images only.'
});

const helpBox = blessed.box({
  parent: screen,
  bottom: 0,
  left: 0,
  width: '100%',
  height: '10%',
  border: { type: 'line' },
  style: {
    fg: 'gray',
    border: { fg: 'gray' }
  },
  content: ' [?] Help | [q] Quit | [u] Update | Albums: [c]reate [e]dit [d]elete [s]can [r]eorder | Images: [a]dd [d]elete [e]dit [t]ags [c]amera [l]ens [p]rimary [o]pen [r]eorder'
});

const helpModal = blessed.box({
  parent: screen,
  top: 'center', left: 'center', width: '80%', height: '80%',
  border: 'line', hidden: true,
  style: { border: { fg: '#ea9a97' } },
  label: ` Help & Info (v${cliVersion}) `,
  content: '\n Global:\n  [q / C-c] Quit\n  [?] Toggle Help\n  [u] Check for Updates\n\n Albums List:\n  [l / Enter / Right] Focus Images\n  [J / K] Move Album Down/Up\n  [r] Reorder Album\n  [c] Create Album\n  [e] Edit Album Info\n  [d] Delete Album\n  [s] Autoscan Folder\n  [f] Toggle Favorite\n  [v] Toggle Draft Visibility\n\n Images List:\n  [h / Esc / Left] Back to Albums\n  [J / K] Move Image Down/Up\n  [r] Reorder Image\n  [a] Add Image\n  [d] Delete Image\n  [e] Edit All Metadata\n  [t] Edit Tags\n  [c] Edit Camera\n  [l] Edit Lens\n  [p] Set as Primary\n  [o] Open Image\n  [s] Autoscan Folder\n\nPress any key to close.'
});

// Modals
const addBox = blessed.box({
  parent: screen,
  top: 'center',
  left: 'center',
  width: '60%',
  height: 5,
  border: 'line',
  hidden: true,
  style: { border: { fg: '#ea9a97' } },
  label: ' Add Image '
});

const addInput = blessed.textbox({
  parent: addBox,
  top: 1,
  left: 1,
  right: 1,
  height: 1,
  keys: true,
  inputOnFocus: true,
  style: { fg: 'white', focus: { bg: 'blue' } }
});

blessed.text({
  parent: addBox,
  top: 0,
  left: 1,
  content: 'Enter URL or local path (Tab to autocomplete):'
});

addInput.key('tab', function(ch, key) {
  if (this.value) this.value = this.value.replace(/\t/g, '');
  const val = this.value || '';
  if (!val.startsWith('/')) return false;
  
  // To handle paths, we search locally for matches
  const searchPath = path.join(publicImagesPath, val);
  const dir = val.endsWith('/') ? searchPath : path.dirname(searchPath);
  const base = val.endsWith('/') ? '' : path.basename(searchPath);
  
  try {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      const matches = files.filter(f => f.startsWith(base));
      
      if (matches.length === 1) {
        let newVal = path.join(val.endsWith('/') ? val : path.dirname(val), matches[0]);
        if (fs.statSync(path.join(dir, matches[0])).isDirectory()) newVal += '/';
        this.value = newVal;
        this.screen.render();
      } else if (matches.length > 1) {
        let prefix = matches[0];
        for (let i = 1; i < matches.length; i++) {
          while (!matches[i].startsWith(prefix)) {
            prefix = prefix.slice(0, -1);
            if (!prefix) break;
          }
        }
        if (prefix && prefix !== base) {
          this.value = path.join(val.endsWith('/') ? val : path.dirname(val), prefix);
          this.screen.render();
        }
      }
    }
  } catch(e) {}
  
  return false;
});

const prompt = blessed.prompt({
  parent: screen,
  top: 'center',
  left: 'center',
  width: '50%',
  height: 'shrink',
  border: 'line',
  hidden: true,
  tags: true,
  padding: 1,
  style: {
    fg: 'white',
    bold: true,
    border: { fg: '#ea9a97' }
  }
});

const question = blessed.question({
  parent: screen,
  top: 'center',
  left: 'center',
  width: '50%',
  height: 'shrink',
  border: 'line',
  hidden: true,
  tags: true,
  padding: 1,
  style: {
    fg: 'white',
    bold: true,
    border: { fg: '#ea9a97' }
  }
});

// Helpers
function handleCreateAlbum() {
  prompt.input('Enter new album title:', '', (err, title) => {
    if (err || !title) {
      screen.render();
      return;
    }
    prompt.input('Enter folder name (slug):', title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), (err, slug) => {
      if (err || !slug) {
        screen.render();
        return;
      }
      
      const newAlbumPath = path.join(publicImagesPath, 'images', slug);
      if (!fs.existsSync(newAlbumPath)) {
        fs.mkdirSync(newAlbumPath, { recursive: true });
      }
      
      const newProject = {
        id: slug,
        slug: slug,
        title: title,
        year: new Date().getFullYear(),
        tags: [],
        description: "",
        place: projects.length + 1,
        images: []
      };
      
      projects.push(newProject);
      saveData();
      updateAlbumList();
      albumList.select(projects.length - 1);
      showAlbumImages(projects.length - 1);
    });
  });
}

function handleEditAlbum() {
  const project = projects[currentAlbumIndex];
  if (!project) return;
  prompt.input('Enter Title (current: ' + project.title + '):', project.title || '', (err, title) => {
    if (err || title === null) { screen.render(); return; }
    prompt.input('Enter Year (current: ' + project.year + '):', String(project.year || ''), (err, year) => {
      if (err || year === null) { screen.render(); return; }
      prompt.input('Enter Description:', project.description || '', (err, desc) => {
        if (err || desc === null) { screen.render(); return; }
        prompt.input('Enter Tags (comma separated):', (project.tags || []).join(', '), (err, tags) => {
          if (err || tags === null) { screen.render(); return; }
          project.title = title;
          project.year = parseInt(year, 10) || new Date().getFullYear();
          project.description = desc;
          saveData();
          toast('Album updated.');
          updateAlbumList();
          albumList.select(currentAlbumIndex);
        });
      });
    });
  });
}

function handleDeleteAlbum() {
  const project = projects[currentAlbumIndex];
  if (!project) return;
  question.ask(`Are you sure you want to delete album "${project.title}"? (y/n)`, (err, val) => {
    if (!err && val) {
      projects.splice(currentAlbumIndex, 1);
      saveData();
      currentAlbumIndex = Math.max(0, Math.min(currentAlbumIndex, projects.length - 1));
      updateAlbumList();
      showAlbumImages(currentAlbumIndex);
    }
    albumList.focus();
    screen.render();
  });
}

function updateAlbumList() {
  albumList.setItems(projects.map(p => `${p.title} (${p.images ? p.images.length : 0})${p.favorite ? ' {yellow-fg}[Fav]{/yellow-fg}' : ''}${p.draft ? ' {red-fg}[Draft]{/red-fg}' : ''}`));
  screen.render();
}

function showAlbumImages(index) {
  currentAlbumIndex = index;
  const project = projects[index];
  if (!project || !project.images || project.images.length === 0) {
    imageList.setItems(['(No images)']);
    previewBox.setContent('No images in this album.');
  } else {
    imageList.setItems(project.images.map(img => `${img.filename || img.url || 'Unknown Image'}${img.primary ? ' {blue-fg}[Primary]{/blue-fg}' : ''}`));
    showImagePreview(0);
  }
  screen.render();
}

async function showImagePreview(index) {
  currentImageIndex = index;
  const project = projects[currentAlbumIndex];
  if (!project || !project.images || !project.images[index]) {
    previewBox.setContent('No image selected.');
    screen.render();
    return;
  }

  const img = project.images[index];
  let metaText = `ID: ${img.id || 'N/A'}\nFile: ${img.filename || 'N/A'}\nURL: ${img.url || 'N/A'}\nSize: ${img.width || '?'}x${img.height || '?'}\nPrimary: ${img.primary ? 'Yes' : 'No'}\nCamera: ${img.camera || 'N/A'}\nLens: ${img.lens || 'N/A'}\nTags: ${(img.tags || []).join(', ') || 'None'}\n\n`;

  previewBox.setContent(metaText + '\n{cyan-fg}[ Loading Preview... ]{/cyan-fg}\n');
  screen.render();

  try {
    // Attempt to render image if it's a local file path
    if (img.url && img.url.startsWith('/images/')) {
      const fullPath = path.join(publicImagesPath, img.url);
      if (fs.existsSync(fullPath)) {
        const availableWidth = Math.max(10, previewBox.width - 4);
        const availableHeight = Math.max(5, previewBox.height - 10);
        const imageStr = await terminalImage.file(fullPath, { width: availableWidth, height: availableHeight });
        previewBox.setContent(metaText + imageStr);
      } else {
        previewBox.setContent(metaText + '[Local file not found]\nPath: ' + fullPath);
      }
    } else {
      previewBox.setContent(metaText + '[Remote/Absolute URL: Preview not supported]');
    }
  } catch (err) {
    previewBox.setContent(metaText + '[Error rendering image preview: ' + err.message + ']');
  }
  screen.render();
}

// Album reorder helper
function handleReorderAlbum() {
  const project = projects[currentAlbumIndex];
  if (!project) return;
  prompt.input(`Enter new position (1-${projects.length}):`, String(currentAlbumIndex + 1), (err, val) => {
    if (err || val === null) { screen.render(); return; }
    const newPos = parseInt(val, 10) - 1;
    if (!isNaN(newPos) && newPos >= 0 && newPos < projects.length) {
      projects.splice(currentAlbumIndex, 1);
      projects.splice(newPos, 0, project);
      projects.forEach((p, i) => { p.place = i + 1; });
      saveData();
      currentAlbumIndex = newPos;
      updateAlbumList();
      albumList.select(currentAlbumIndex);
      showAlbumImages(currentAlbumIndex);
    }
    albumList.focus();
    screen.render();
  });
}

function swapAlbums(idx1, idx2) {
  if (idx1 < 0 || idx2 < 0 || idx1 >= projects.length || idx2 >= projects.length) return;
  const temp = projects[idx1];
  projects[idx1] = projects[idx2];
  projects[idx2] = temp;
  
  projects.forEach((p, i) => { p.place = i + 1; });
  
  saveData();
  updateAlbumList();
  albumList.select(idx2);
  showAlbumImages(idx2);
  screen.render();
}

function handleReorderImage() {
  const project = projects[currentAlbumIndex];
  if (!project || !project.images || project.images.length === 0) return;
  const img = project.images[currentImageIndex];
  prompt.input(`Enter new position (1-${project.images.length}):`, String(currentImageIndex + 1), (err, val) => {
    if (err || val === null) { screen.render(); return; }
    const newPos = parseInt(val, 10) - 1;
    if (!isNaN(newPos) && newPos >= 0 && newPos < project.images.length) {
      project.images.splice(currentImageIndex, 1);
      project.images.splice(newPos, 0, img);
      saveData();
      currentImageIndex = newPos;
      showAlbumImages(currentAlbumIndex);
      imageList.select(currentImageIndex);
    }
    imageList.focus();
    screen.render();
  });
}

// Reorder helper
function swapImages(albumIdx, idx1, idx2) {
  const images = projects[albumIdx].images;
  if (!images || idx1 < 0 || idx2 < 0 || idx1 >= images.length || idx2 >= images.length) return;
  const temp = images[idx1];
  images[idx1] = images[idx2];
  images[idx2] = temp;
  saveData();
  showAlbumImages(albumIdx);
  imageList.select(idx2);
  screen.render();
}

// Add Image Helper
function handleAddImage() {
  const project = projects[currentAlbumIndex];
  if (!project) return;
  if (!project.images) project.images = [];

  addBox.show();
  addInput.value = '/images/';
  addInput.focus();
  screen.render();

  addInput.removeAllListeners('submit');
  addInput.removeAllListeners('cancel');

  addInput.on('submit', (value) => {
    addBox.hide();
    if (!value || value.trim() === '' || value === '/images/') {
      imageList.focus();
      screen.render();
      return;
    }
    const newImage = {
      id: `img-${Date.now()}`,
      filename: value.split('/').pop(),
      url: value,
      width: 1920,
      height: 1080,
      primary: project.images.length === 0
    };
    project.images.push(newImage);
    saveData();
    updateAlbumList();
    showAlbumImages(currentAlbumIndex);
    imageList.select(project.images.length - 1);
    imageList.focus();
  });

  addInput.on('cancel', () => {
    addBox.hide();
    imageList.focus();
    screen.render();
  });
}

function handleEditMetadata() {
  const project = projects[currentAlbumIndex];
  if (!project || !project.images || project.images.length === 0) return;
  const img = project.images[currentImageIndex];
  
  prompt.input('Enter camera (current: ' + (img.camera || '') + '):', img.camera || '', (err, cam) => {
    if (err || cam === null) { screen.render(); return; }
    prompt.input('Enter lens (current: ' + (img.lens || '') + '):', img.lens || '', (err, lens) => {
      if (err || lens === null) { screen.render(); return; }
      prompt.input('Enter tags (comma separated):', (img.tags || []).join(', '), (err, tagsStr) => {
        if (err || tagsStr === null) { screen.render(); return; }
        img.camera = cam;
        img.lens = lens;
        img.tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);
        saveData();
        showImagePreview(currentImageIndex);
      });
    });
  });
}

function handleEditImageField(field) {
  const project = projects[currentAlbumIndex];
  if (!project || !project.images || project.images.length === 0) return;
  const img = project.images[currentImageIndex];
  
  let currentVal = img[field] || '';
  if (field === 'tags') currentVal = (img.tags || []).join(', ');

  prompt.input(`Enter ${field} (current: ${currentVal}):`, currentVal, (err, val) => {
    if (err || val === null) { screen.render(); return; }
    if (field === 'tags') {
      img.tags = val.split(',').map(t => t.trim()).filter(Boolean);
    } else {
      img[field] = val;
    }
    saveData();
    showImagePreview(currentImageIndex);
  });
}

function handleSetPrimary() {
  const project = projects[currentAlbumIndex];
  if (!project || !project.images || project.images.length === 0) return;
  
  project.images.forEach((img, idx) => {
    img.primary = (idx === currentImageIndex);
  });
  saveData();
  toast('Set as Primary Image.');
  updateImageList();
  showImagePreview(currentImageIndex);
}

function handleOpenImage() {
  const project = projects[currentAlbumIndex];
  if (!project || !project.images || project.images.length === 0) return;
  const img = project.images[currentImageIndex];
  if (!img.url) return;

  let targetPath = img.url;
  if (img.url.startsWith('/images/') || img.url.startsWith('./images/')) {
    targetPath = path.join(publicImagesPath, img.url);
  }

  import('open').then((openModule) => {
    openModule.default(targetPath);
  }).catch(err => {
    previewBox.setContent('Error opening image: ' + err.message);
    screen.render();
  });
}

function handleAutoscan() {
  const project = projects[currentAlbumIndex];
  if (!project) return;
  
  const albumFolder = path.join(publicImagesPath, 'images', project.slug || project.id);
  if (!fs.existsSync(albumFolder)) {
    previewBox.setContent('Album folder not found on disk:\n' + albumFolder);
    screen.render();
    return;
  }

  const files = fs.readdirSync(albumFolder).filter(f => /\.(jpe?g|png|webp|avif)$/i.test(f));
  const existingUrls = (project.images || []).map(img => img.url);
  const existingFilenames = (project.images || []).map(img => img.filename);

  const unmapped = files.filter(f => {
    const relUrl = `/images/${project.slug || project.id}/${f}`;
    return !existingUrls.includes(relUrl) && !existingFilenames.includes(f);
  });

  if (unmapped.length === 0) {
    previewBox.setContent('No new images found in folder.');
    screen.render();
    return;
  }

  let i = 0;
  let added = 0;
  const processNext = async () => {
    if (i >= unmapped.length) {
      previewBox.setContent(`Autoscan complete. Added ${added} images.`);
      updateAlbumList();
      showAlbumImages(currentAlbumIndex);
      return;
    }

    const file = unmapped[i];
    question.ask(`Found new image ${file}. Add to album? (y/n)`, async (err, val) => {
      if (!err && val) {
        const fullPath = path.join(albumFolder, file);
        const relUrl = `/images/${project.slug || project.id}/${file}`;
        
        let width = 1920, height = 1080;
        try { const dims = sizeOf(fullPath); width = dims.width; height = dims.height; } catch(e) {}
        
        let camera, lens, date;
        try {
          const exifData = await exifr.parse(fullPath);
          if (exifData) {
            if (exifData.Make || exifData.Model) camera = `${exifData.Make || ''} ${exifData.Model || ''}`.trim();
            if (exifData.LensModel) lens = exifData.LensModel;
            if (exifData.DateTimeOriginal) date = exifData.DateTimeOriginal;
          }
        } catch(e) {}

        if (!project.images) project.images = [];
        project.images.push({
          id: `img-${Date.now()}-${i}`,
          filename: file,
          url: relUrl,
          width,
          height,
          camera: camera || '',
          lens: lens || '',
          tags: [],
          primary: project.images.length === 0
        });
        saveData();
        added++;
      }
      i++;
      processNext();
    });
  };
  processNext();
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'TypeGrid-CLI' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function compareVersions(v1, v2) {
  const p1 = v1.split('.').map(Number);
  const p2 = v2.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((p1[i] || 0) > (p2[i] || 0)) return 1;
    if ((p1[i] || 0) < (p2[i] || 0)) return -1;
  }
  return 0;
}

async function handleUpdate() {
  previewBox.setContent('Checking for updates...');
  screen.render();
  try {
    const pkgStr = await fetchUrl('https://raw.githubusercontent.com/devsimsek/TypeGrid/main/package.json');
    const remotePkg = JSON.parse(pkgStr);
    const localPkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));
    
    if (compareVersions(remotePkg.version, localPkg.version) > 0) {
      previewBox.setContent(`New version found: v${remotePkg.version} (Current: v${localPkg.version})\nFetching changelog...`);
      screen.render();
      
      const changelog = await fetchUrl('https://raw.githubusercontent.com/devsimsek/TypeGrid/main/CHANGELOG.md');
      const latestChanges = changelog.split('\n## ').slice(0, 2).join('\n## ');
      
      question.ask(`Update to v${remotePkg.version}?\n\n${latestChanges.substring(0, 200)}...\n\n(y/n)`, async (err, val) => {
        if (!err && val) {
          previewBox.setContent('Updating files from GitHub...');
          screen.render();
          
          const files = [
            'package.json',
            'cli/albums.js',
            'cli/generate.js',
            'cli/config.js',
            'css/theme-dawn.css',
            'css/theme-moon.css',
            'js/utils.js'
          ];
          
          for (const file of files) {
            try {
              const content = await fetchUrl(`https://raw.githubusercontent.com/devsimsek/TypeGrid/main/${file}`);
              if (content && content !== '404: Not Found') {
                const targetPath = path.join(__dirname, '../', file);
                if (fs.existsSync(path.dirname(targetPath))) {
                  fs.writeFileSync(targetPath, content, 'utf-8');
                }
              }
            } catch(e) {}
          }
          
          previewBox.setContent('Update complete! Please restart the CLI.');
          screen.render();
          setTimeout(() => process.exit(0), 3000);
        } else {
          previewBox.setContent('Update cancelled.');
          screen.render();
        }
      });
    } else {
      previewBox.setContent(`You are up to date! (v${localPkg.version})`);
      screen.render();
    }
  } catch (e) {
    previewBox.setContent('Failed to check for updates: ' + e.message);
    screen.render();
  }
}

// Delete Image Helper
function handleDeleteImage() {
  const project = projects[currentAlbumIndex];
  if (!project || !project.images || project.images.length === 0) return;

  question.ask('Are you sure you want to remove this image from the album? (y/n)', (err, val) => {
    if (!err && val) {
      project.images.splice(currentImageIndex, 1);
      saveData();
      updateAlbumList();
      showAlbumImages(currentAlbumIndex);
    }
    imageList.focus();
    screen.render();
  });
}

// Event Listeners

albumList.on('select item', (item, index) => {
  showAlbumImages(index);
});

albumList.key(['right', 'l', 'enter'], () => {
  if (projects[currentAlbumIndex] && projects[currentAlbumIndex].images && projects[currentAlbumIndex].images.length > 0) {
    imageList.focus();
  }
});

imageList.on('select item', (item, index) => {
  showImagePreview(index);
});

imageList.key(['left', 'h', 'escape'], () => {
  albumList.focus();
});

// Image management keybindings
imageList.key(['S-k', 'K'], () => {
  swapImages(currentAlbumIndex, currentImageIndex, currentImageIndex - 1);
});

imageList.key(['S-j', 'J'], () => {
  swapImages(currentAlbumIndex, currentImageIndex, currentImageIndex + 1);
});

imageList.key(['a'], () => {
  handleAddImage();
});

imageList.key(['d', 'delete'], () => {
  handleDeleteImage();
});

imageList.key(['e'], () => {
  handleEditMetadata();
});

imageList.key(['p'], () => {
  handleSetPrimary();
});

imageList.key(['o'], () => {
  handleOpenImage();
});

imageList.key(['s'], () => {
  handleAutoscan();
});

imageList.key(['r'], () => {
  handleReorderImage();
});

imageList.key(['t'], () => handleEditImageField('tags'));
imageList.key(['c'], () => handleEditImageField('camera'));
imageList.key(['l'], () => handleEditImageField('lens'));

// Add from album list as well
albumList.key(['a'], () => {
  handleAddImage();
});

albumList.key(['c'], () => {
  handleCreateAlbum();
});

albumList.key(['s'], () => {
  handleAutoscan();
});

albumList.key(['e'], () => {
  handleEditAlbum();
});

albumList.key(['r'], () => {
  handleReorderAlbum();
});

albumList.key(['f'], () => {
  const project = projects[currentAlbumIndex];
  if (!project) return;
  project.favorite = !project.favorite;
  saveData();
  toast(project.favorite ? 'Marked as Favorite.' : 'Removed from Favorites.');
  updateAlbumList();
  albumList.select(currentAlbumIndex);
});

albumList.key(['v'], () => {
  const project = projects[currentAlbumIndex];
  project.draft = !project.draft;
  saveData();
  toast(project.draft ? 'Marked as Draft.' : 'Marked as Published.');
  updateAlbumList();
  albumList.select(currentAlbumIndex);
});

albumList.key(['d', 'delete'], () => {
  handleDeleteAlbum();
});

// Global Keybindings
screen.key(['u'], () => {
  handleUpdate();
});

albumList.key(['S-k', 'K'], () => {
  swapAlbums(currentAlbumIndex, currentAlbumIndex - 1);
});

albumList.key(['S-j', 'J'], () => {
  swapAlbums(currentAlbumIndex, currentAlbumIndex + 1);
});

// Help Menu Global
screen.key(['?'], () => {
  if (helpModal.hidden) {
    helpModal.show();
    helpModal.focus();
  } else {
    helpModal.hide();
  }
  screen.render();
});
helpModal.on('keypress', (ch, key) => {
  helpModal.hide();
  screen.render();
});

// Quit on q or Control-C.
screen.key(['q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

// Initialize
if (projects.length > 0) {
  showAlbumImages(0);
}
albumList.focus();

// Render the screen
screen.render();