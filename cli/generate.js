const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');
const exifr = require('exifr');
const blessed = require('blessed');

// --- Constants & Config ---
const IMAGES_DIR = path.join(__dirname, '../images');
const DATA_FILE = path.join(__dirname, '../data/typegrid.json');
const VALID_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const TARGET_VERSION = "3.0.1";

// --- Helpers ---
function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function formatTitle(text) {
  return text.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function runMigrations(apiData) {
  if (!apiData.meta) apiData.meta = { version: "1.0.0" };
  let version = apiData.meta.version;

  if (version !== TARGET_VERSION) {
    if (apiData.projects) {
      apiData.projects.forEach(p => {
        if (p.place === undefined) p.place = null;

        p.images.forEach(img => {
          if (!img.tags) img.tags = [];
          if (img.lens === undefined) img.lens = null;
          if (img.camera === undefined) img.camera = null;
        });
      });
    }
    apiData.meta.version = TARGET_VERSION;
  }
  return apiData;
}

// --- Screen Setup ---
const screen = blessed.screen({ smartCSR: true, title: 'TypeGrid API Generator', warnings: true, fullUnicode: true });

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

const logBox = blessed.log({
  parent: screen,
  top: 'center', left: 'center',
  width: '80%', height: '80%',
  border: 'line',
  style: { fg: 'white', border: { fg: '#ea9a97' } },
  label: ' Generator Log ',
  keys: true, scrollable: true, mouse: true
});

const prompt = blessed.prompt({
  parent: screen, top: 'center', left: 'center', width: '60%', height: 'shrink',
  border: 'line', hidden: true, tags: true, padding: 1,
  style: { fg: 'white', bold: true, border: { fg: '#ea9a97' } }
});

const question = blessed.question({
  parent: screen, top: 'center', left: 'center', width: '60%', height: 'shrink',
  border: 'line', hidden: true, tags: true, padding: 1,
  style: { fg: 'white', bold: true, border: { fg: '#ea9a97' } }
});

screen.key(['q', 'C-c'], () => process.exit(0));

// --- Async Prompts ---
const ask = (query, defaultVal = '') => new Promise(resolve => {
  prompt.input(query, defaultVal, (err, val) => {
    if (err || val === null) resolve(defaultVal);
    else resolve(val.trim() || defaultVal.toString());
  });
});

const askBool = (query, defaultVal = true) => new Promise(resolve => {
  question.ask(query, (err, val) => {
    if (err || val === null) resolve(defaultVal);
    else {
      const a = val.toLowerCase();
      if (a === 'y' || a === 'yes') resolve(true);
      else if (a === 'n' || a === 'no') resolve(false);
      else resolve(defaultVal);
    }
  });
});

// --- Main Wizard ---
async function runWizard() {
  logBox.add('Initializing TypeGrid Generator...');
  screen.render();

  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
  if (!fs.existsSync(path.join(__dirname, '../data'))) fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });

  let apiData = {};
  let isFirstRun = true;

  if (fs.existsSync(DATA_FILE)) {
    try {
      apiData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      isFirstRun = false;
      apiData = runMigrations(apiData);
    } catch (e) {
      logBox.add('![Warn] Existing typegrid.json is invalid. Starting fresh.');
    }
  }

  // Ensure defaults
  if (!apiData.site) {
    apiData.site = {
      title: 'My Portfolio',
      description: 'A minimal photography portfolio.',
      base_url: '',
      accent: '#ea9a97',
      lang: 'en-US',
      created_at: new Date().toISOString(),
      version: TARGET_VERSION,
      open_graph: { title: 'My Portfolio', description: 'A minimal photography portfolio.', image: '' },
      authors: [{ name: 'Photographer', url: '', avatar: '', socials: [] }]
    };
  }

  logBox.add('\n--- Scanning Local Images ---');
  screen.render();

  const existingProjects = apiData.projects || [];
  const processedProjects = [];
  const entries = fs.readdirSync(IMAGES_DIR, { withFileTypes: true });

  let scannedCount = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const projectDir = path.join(IMAGES_DIR, entry.name);
    const files = fs.readdirSync(projectDir)
      .filter(file => VALID_EXTENSIONS.has(path.extname(file).toLowerCase()));

    if (files.length === 0) continue;
    scannedCount++;

    const slug = slugify(entry.name);
    let defaultTitle = formatTitle(entry.name);
    let project = existingProjects.find(p => p.id === slug);
    let isNewProject = !project;

    if (isNewProject) {
      logBox.add(`\n[+] Discovered New Album Directory: "${defaultTitle}"`);
      screen.render();

      const title = await ask(`Album Title`, defaultTitle);
      const tagsInput = await ask(`Tags for "${title}" (comma separated)`, '');
      const tags = tagsInput.split(',').map(s => s.trim()).filter(Boolean);
      const placeInput = await ask(`Placement Order for "${title}" (1, 2, 3... or Auto)`, existingProjects.length + 1);
      const parsedPlace = parseInt(placeInput, 10);
      const place = isNaN(parsedPlace) ? null : parsedPlace;

      project = {
        id: slug,
        slug: slug,
        title: title,
        year: new Date().getFullYear(),
        place: place,
        tags: tags,
        description: `Gallery for ${title}.`,
        excerpt: `${files.length} photos`,
        camera: null,
        lens: null,
        favorite: false,
        images: [],
        seo: {
          meta_title: `${title} — ${apiData.site.title}`,
          meta_description: `Viewing gallery: ${title}`,
          canonical_url: `/projects/${slug}/`
        },
        open_graph: {
          title: title,
          description: `Gallery for ${title}.`,
          image: ''
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        draft: false,
        url: `/projects/${slug}/`
      };
    } else {
      logBox.add(`\n[~] Existing Album: "${project.title}"`);
      screen.render();
    }

    const projectImages = [];
    let albumCamera = project.camera;
    let albumLens = project.lens;
    let albumYear = project.year;
    let newImagesCount = 0;

    logBox.add(`    Extracting EXIF & Dimensions for ${files.length} files...`);
    screen.render();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativeUrl = `/images/${entry.name}/${file}`;

      const existingImage = project.images.find(img => img.filename === file);
      if (existingImage) {
        projectImages.push(existingImage);
        continue;
      }

      newImagesCount++;
      const filePath = path.join(projectDir, file);
      const stats = fs.statSync(filePath);
      let dimensions = { width: 1920, height: 1080 };

      try { dimensions = sizeOf(filePath); } catch (e) {}

      let camera = null, lens = null, date = stats.birthtime;

      try {
        const exif = await exifr.parse(filePath).catch(() => null);
        if (exif) {
          const make = exif.Make || '';
          const model = exif.Model || '';
          camera = [make, model].filter(Boolean).join(' ').trim() || null;
          lens = exif.LensModel || null;
          date = exif.CreateDate || exif.DateTimeOriginal || date;
        }
      } catch (e) {}

      if (isNewProject && i === 0) {
         albumCamera = albumCamera || camera;
         albumLens = albumLens || lens;
         albumYear = new Date(date).getFullYear() || albumYear;
      }

      projectImages.push({
        id: `img-${slug}-${Date.now()}-${i}`,
        filename: file,
        url: relativeUrl,
        width: dimensions.width,
        height: dimensions.height,
        size: stats.size,
        primary: false,
        tags: [],
        camera: camera,
        lens: lens
      });
    }

    if (newImagesCount > 0) {
      logBox.add(`    Added ${newImagesCount} new photo(s).`);
    } else {
      logBox.add(`    No new photos added.`);
    }
    screen.render();

    if (projectImages.length > 0 && !projectImages.some(img => img.primary)) {
      projectImages[0].primary = true;
    }

    project.images = projectImages;
    project.camera = project.camera || albumCamera;
    project.lens = project.lens || albumLens;
    project.year = albumYear;
    project.excerpt = `${projectImages.length} photos`;

    if (isNewProject && projectImages.length > 0) {
      project.open_graph.image = projectImages[0].url;
    }

    processedProjects.push(project);
  }

  if (scannedCount === 0) {
    logBox.add(`\n[!] No albums found in /images/. Add some folders with photos and run this again.\n`);
    screen.render();
  }

  // --- STEP 3: Cleanup Collisions ---
  logBox.add('\n--- Cleaning up missing albums ---');
  screen.render();

  const finalProjects = [];
  for (const existing of existingProjects) {
    const existsOnDisk = processedProjects.some(p => p.id === existing.id);
    if (!existsOnDisk) {
      const keep = await askBool(`Album "${existing.title}" is in config but missing from /images/ directory. Keep it in config anyway? (y/n)`, true);
      if (keep) {
        finalProjects.push(existing);
        logBox.add(`    Kept "${existing.title}".`);
      } else {
        logBox.add(`    -> Removed "${existing.title}".`);
      }
      screen.render();
    }
  }

  for (const processed of processedProjects) {
    if (!finalProjects.some(p => p.id === processed.id)) {
      finalProjects.push(processed);
    }
  }

  // Sort logically
  const sortField = apiData.settings?.sort?.field || "place";
  const sortOrder = apiData.settings?.sort?.order || "asc";

  finalProjects.sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (valA === null || valA === undefined) valA = sortOrder === "asc" ? Infinity : -Infinity;
    if (valB === null || valB === undefined) valB = sortOrder
 === "asc" ? Infinity : -Infinity;

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;

    return b.year - a.year;
  });

  // Re-index places strictly to avoid gaps
  finalProjects.forEach((p, idx) => p.place = idx + 1);

  // --- STEP 4: Save & Finish ---
  const finalJSON = {
    site: apiData.site,
    projects: finalProjects,
    collections: apiData.collections || [],
    posts: apiData.posts || [],
    pagination: {
      page_size: apiData.pagination?.page_size || 12,
      total_projects: finalProjects.length,
      total_pages: Math.ceil(finalProjects.length / (apiData.pagination?.page_size || 12)) || 1,
      pages: []
    },
    socials: apiData.socials || { links: [], share_templates: {} },
    settings: apiData.settings || {
      layout: { columns_desktop: 3, columns_tablet: 2, columns_mobile: 1 },
      sort: { field: "place", order: "asc" },
      show_thumbnails: true,
      ui: { monospace_font: "monospace", accent_color: apiData.site.accent }
    },
    meta: {
      next_project_id: finalProjects.length + 1,
      version: TARGET_VERSION
    }
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(finalJSON, null, 2));
  toast('API Generated Successfully!');

  logBox.add(`\n======================================================`);
  logBox.add(`  SUCCESS! API Generated ✨`);
  logBox.add(`  Tracked ${finalProjects.length} albums. Saved to data/typegrid.json`);
  logBox.add(`======================================================\n`);
  logBox.add(`Exiting in 3 seconds...`);
  screen.render();
  
  setTimeout(() => process.exit(0), 3000);
}

runWizard().catch(err => {
  logBox.add(`\n[Error] Setup Wizard failed: ${err.message}`);
  screen.render();
  setTimeout(() => process.exit(1), 5000);
});