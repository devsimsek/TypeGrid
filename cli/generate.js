const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');
const exifr = require('exifr');
const readline = require('readline');

// --- Constants & Config ---
const IMAGES_DIR = path.join(__dirname, '..', 'images');
const DATA_FILE = path.join(__dirname, '..', 'data', 'typegrid.json');
const VALID_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const TARGET_VERSION = "2.2.0";

// --- CLI Colors ---
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  rose: "\x1b[38;2;234;154;151m", // Rose Pine accent
  pine: "\x1b[38;2;62;143;176m",  // Rose Pine secondary
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m"
};

// --- Readline Setup ---
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (query, defaultVal = '') => {
  const prompt = `${colors.cyan}?${colors.reset} ${colors.bold}${query}${colors.reset} ${colors.dim}[${defaultVal}]${colors.reset}: `;
  return new Promise(resolve => {
    rl.question(prompt, answer => {
      resolve(answer.trim() || defaultVal.toString());
    });
  });
};

const askBool = (query, defaultVal = true) => {
  const defStr = defaultVal ? 'Y/n' : 'y/N';
  const prompt = `${colors.cyan}?${colors.reset} ${colors.bold}${query}${colors.reset} ${colors.dim}[${defStr}]${colors.reset}: `;
  return new Promise(resolve => {
    rl.question(prompt, answer => {
      const a = answer.trim().toLowerCase();
      if (a === 'y' || a === 'yes') resolve(true);
      if (a === 'n' || a === 'no') resolve(false);
      resolve(defaultVal);
    });
  });
};

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

/**
 * Migration engine to gracefully upgrade older TypeGrid data shapes.
 */
function runMigrations(apiData) {
  if (!apiData.meta) apiData.meta = { version: "1.0.0" };
  let version = apiData.meta.version;

  if (version !== TARGET_VERSION) {
    console.log(`${colors.dim}[Migration] Upgrading database from v${version} to v${TARGET_VERSION}...${colors.reset}`);

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

// --- Main Wizard ---
async function runWizard() {
  console.clear();
  console.log(`${colors.rose}${colors.bold}======================================================${colors.reset}`);
  console.log(`${colors.rose}${colors.bold}               TYPEGRID SETUP WIZARD 📸               ${colors.reset}`);
  console.log(`${colors.rose}${colors.bold}======================================================${colors.reset}\n`);

  // Ensure directories exist
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
  if (!fs.existsSync(path.join(__dirname, '..', 'data'))) fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });

  let apiData = {};
  let isFirstRun = true;

  if (fs.existsSync(DATA_FILE)) {
    try {
      apiData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      isFirstRun = false;
      apiData = runMigrations(apiData);
    } catch (e) {
      console.log(`${colors.red}[Warn] Existing typegrid.json is invalid. Starting fresh.${colors.reset}\n`);
    }
  }

  // --- STEP 1: Site Configuration ---
  console.log(`${colors.pine}${colors.bold}--- Step 1: Site Configuration ---${colors.reset}`);

  if (!apiData.site) apiData.site = {};

  if (isFirstRun || await askBool('Update site settings?', false)) {
    apiData.site.title = await ask('Site Title', apiData.site.title || 'My Portfolio');
    apiData.site.description = await ask('Site Description', apiData.site.description || 'A minimal photography portfolio.');
    apiData.site.base_url = await ask('Base URL (e.g., https://my-site.com)', apiData.site.base_url || '');
    apiData.site.accent = await ask('Accent Color (Hex)', apiData.site.accent || '#ea9a97');
    apiData.site.lang = apiData.site.lang || 'en-US';
    apiData.site.created_at = apiData.site.created_at || new Date().toISOString();
    apiData.site.version = TARGET_VERSION;
    apiData.site.open_graph = apiData.site.open_graph || {
      title: `${apiData.site.title} — Portfolio`,
      description: apiData.site.description,
      image: ""
    };

    // Author Setup
    if (!apiData.site.authors) apiData.site.authors = [];
    console.log(`\n${colors.dim}Let's set up the primary author for the footer.${colors.reset}`);
    const authorName = await ask('Author Name', apiData.site.authors[0]?.name || 'Photographer');
    const authorInsta = await ask('Instagram Username (optional)', '');

    let socials = apiData.site.authors[0]?.socials || [];
    if (authorInsta) {
      // Update or add instagram
      const existingInsta = socials.find(s => s.platform === 'instagram');
      if (existingInsta) {
        existingInsta.url = `https://instagram.com/${authorInsta.replace('@', '')}`;
      } else {
        socials.push({ platform: 'instagram', url: `https://instagram.com/${authorInsta.replace('@', '')}` });
      }
    }

    apiData.site.authors[0] = {
      name: authorName,
      url: apiData.site.authors[0]?.url || '',
      avatar: apiData.site.authors[0]?.avatar || '',
      socials: socials
    };
    console.log('');
  } else {
    console.log(`${colors.dim}Skipping site configuration...${colors.reset}\n`);
  }

  // --- STEP 2: Process Images ---
  console.log(`${colors.pine}${colors.bold}--- Step 2: Scanning Local Images ---${colors.reset}`);

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
      console.log(`\n${colors.green}${colors.bold}[+] Discovered New Album: "${defaultTitle}"${colors.reset}`);
      const title = await ask(`Album Title`, defaultTitle);
      const tagsInput = await ask(`Tags (comma separated)`, '');
      const tags = tagsInput.split(',').map(s => s.trim()).filter(Boolean);
      const placeInput = await ask(`Placement Order (1, 2, 3...)`, 'Auto');
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
      console.log(`\n${colors.cyan}[~] Existing Album: "${project.title}"${colors.reset}`);
    }

    const projectImages = [];
    let albumCamera = project.camera;
    let albumLens = project.lens;
    let albumYear = project.year;
    let newImagesCount = 0;

    process.stdout.write(`${colors.dim}    Extracting EXIF & Dimensions... ${colors.reset}`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativeUrl = `./images/${entry.name}/${file}`;

      // Prevent overwriting existing images
      const existingImage = project.images.find(img => img.filename === file);
      if (existingImage) {
        projectImages.push(existingImage);
        continue;
      }

      newImagesCount++;
      const filePath = path.join(projectDir, file);
      const stats = fs.statSync(filePath);
      let dimensions = { width: 1920, height: 1080 };

      try {
        dimensions = sizeOf(filePath);
      } catch (e) {
        // Silently fallback
      }

      let camera = null;
      let lens = null;
      let date = stats.birthtime;

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

    console.log(`${colors.green}Done!${colors.reset}`);
    if (newImagesCount > 0) {
      console.log(`${colors.dim}    Added ${newImagesCount} new photo(s).${colors.reset}`);
    } else {
      console.log(`${colors.dim}    No new photos added.${colors.reset}`);
    }

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
    console.log(`\n${colors.yellow}[!] No albums found in /images/. Add some folders with photos and run this again.${colors.reset}\n`);
  }

  // --- STEP 3: Cleanup Collisions ---
  const finalProjects = [];
  for (const existing of existingProjects) {
    const existsOnDisk = processedProjects.some(p => p.id === existing.id);
    if (!existsOnDisk) {
      console.log('');
      const keep = await askBool(`Album "${existing.title}" is in config but missing from /images/ directory. Keep it in config anyway?`, true);
      if (keep) {
        finalProjects.push(existing);
      } else {
        console.log(`    ${colors.red}-> Removed "${existing.title}".${colors.reset}`);
      }
    }
  }

  for (const processed of processedProjects) {
    if (!finalProjects.some(p => p.id === processed.id)) {
      finalProjects.push(processed);
    }
  }

  // Sort logically based on config or fallback to place/year
  const sortField = apiData.settings?.sort?.field || "place";
  const sortOrder = apiData.settings?.sort?.order || "asc";

  finalProjects.sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (valA === null || valA === undefined) valA = sortOrder === "asc" ? Infinity : -Infinity;
    if (valB === null || valB === undefined) valB = sortOrder === "asc" ? Infinity : -Infinity;

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;

    return b.year - a.year;
  });

  // --- STEP 4: Save & Finish ---
  const finalJSON = {
    site: apiData.site,
    projects: finalProjects,
    collections: apiData.collections || [],
    posts: apiData.posts || [],
    pagination: {
      page_size: apiData.pagination?.page_size || 12,
      total_projects: finalProjects.length,
      total_pages: Math.ceil(finalProjects.length / (apiData.pagination?.page_size || 12)),
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

  console.log(`\n${colors.rose}${colors.bold}======================================================${colors.reset}`);
  console.log(`${colors.green}${colors.bold}  SUCCESS! API Generated ✨${colors.reset}`);
  console.log(`${colors.dim}  Tracked ${finalProjects.length} albums. Saved to data/typegrid.json${colors.reset}`);
  console.log(`${colors.rose}${colors.bold}======================================================${colors.reset}\n`);

  rl.close();
}

runWizard().catch(err => {
  console.error(`\n${colors.red}[Error] Setup Wizard failed:${colors.reset}`, err);
  rl.close();
  process.exit(1);
});
