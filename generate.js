const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');
const exifr = require('exifr');
const readline = require('readline');

const IMAGES_DIR = path.join(__dirname, 'images');
const DATA_FILE = path.join(__dirname, 'data', 'typegrid.json');
const VALID_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const TARGET_VERSION = "2.2.0";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Migration engine to gracefully upgrade older TypeGrid data shapes.
 */
function runMigrations(apiData) {
  if (!apiData.meta) apiData.meta = { version: "1.0.0" };
  let version = apiData.meta.version;

  if (version === "1.0.0" || version === "2.0.0" || version === "2.1.0") {
    console.log(`[Migration] Upgrading database from v${version} to v${TARGET_VERSION}...`);
    
    if (apiData.projects) {
      apiData.projects.forEach(p => {
        // V2.2.0 introduces album placement order
        if (p.place === undefined) p.place = null;
        
        p.images.forEach(img => {
          // V2.1.0 introduces image-level tags, cameras, and lenses
          if (!img.tags) img.tags = [];
          if (img.lens === undefined) img.lens = null;
          if (img.camera === undefined) img.camera = null;
        });
      });
    }
    
    apiData.meta.version = TARGET_VERSION;
    console.log(`[Migration] Successfully upgraded to v${TARGET_VERSION}.`);
  }
  
  return apiData;
}

async function generateAPI() {
  console.log('\n=== TypeGrid Interactive API Generator ===\n');

  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
    console.log(`[Info] Created ${IMAGES_DIR}. Please add subdirectories with images to generate projects.`);
    rl.close();
    return;
  }

  if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
  }

  let apiData = {};
  if (fs.existsSync(DATA_FILE)) {
    try {
      apiData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      console.log('[Info] Found existing typegrid.json. Checking migrations...');
      apiData = runMigrations(apiData);
    } catch (e) {
      console.warn('[Warn] Existing typegrid.json is invalid. Starting fresh.');
    }
  }

  const site = apiData.site || {
    title: "Local TypeGrid Portfolio",
    description: "Auto-generated local image gallery.",
    base_url: "",
    lang: "en-US",
    accent: "#ea9a97",
    version: TARGET_VERSION,
    created_at: new Date().toISOString(),
    authors: []
  };

  const existingProjects = apiData.projects || [];
  const processedProjects = [];
  const entries = fs.readdirSync(IMAGES_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const projectDir = path.join(IMAGES_DIR, entry.name);
    const files = fs.readdirSync(projectDir)
      .filter(file => VALID_EXTENSIONS.has(path.extname(file).toLowerCase()));

    if (files.length === 0) continue;

    const slug = slugify(entry.name);
    let title = entry.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    let project = existingProjects.find(p => p.id === slug);
    let isNewProject = !project;

    if (isNewProject) {
      console.log(`\n[+] Discovered New Album: "${title}"`);
      const tagsInput = await question(`    Enter comma-separated tags for this album (or press Enter to skip): `);
      const tags = tagsInput.split(',').map(s => s.trim()).filter(Boolean);
      
      const placeInput = await question(`    Enter album placement order (number, or press Enter to skip): `);
      const place = placeInput.trim() ? parseInt(placeInput, 10) : null;
      
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
          meta_title: `${title} — ${site.title}`,
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
      console.log(`\n[~] Existing Album Found: "${project.title}"`);
    }

    const projectImages = [];
    let albumCamera = project.camera;
    let albumLens = project.lens;
    let albumYear = project.year;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativeUrl = `./images/${entry.name}/${file}`;
      
      // Prevent overwriting existing images
      const existingImage = project.images.find(img => img.filename === file);
      
      if (existingImage) {
        console.log(`    - [Skip] Image "${file}" already tracked in config.`);
        projectImages.push(existingImage);
        continue;
      }

      console.log(`    - [Process] Reading EXIF for new image "${file}"...`);
      
      const filePath = path.join(projectDir, file);
      const stats = fs.statSync(filePath);
      let dimensions = { width: 1920, height: 1080 };
      
      try {
        dimensions = sizeOf(filePath);
      } catch (e) {
        console.warn(`      [Warn] Could not extract dimensions for ${file}`);
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
      } catch (e) {
        // Silently skip if EXIF is missing/corrupted
      }

      // Use the first new image to seed album defaults if they are blank
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
        tags: [], // New images default to empty tags
        camera: camera,
        lens: lens
      });
    }

    // Guarantee at least one primary image for thumbnails
    if (projectImages.length > 0 && !projectImages.some(img => img.primary)) {
      projectImages[0].primary = true;
    }

    // Merge changes
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

  // Handle deletions: Ask user if a project in JSON no longer exists in /images/ directory
  const finalProjects = [];
  for (const existing of existingProjects) {
    const existsOnDisk = processedProjects.some(p => p.id === existing.id);
    if (!existsOnDisk) {
      const keep = await question(`\n[Collision] Album "${existing.title}" is in config but missing from /images/ directory.\nKeep it in the config anyway? (Y/n): `);
      if (keep.trim().toLowerCase() !== 'n') {
        finalProjects.push(existing);
      } else {
        console.log(`    -> Removed "${existing.title}" from configuration.`);
      }
    }
  }
  
  for (const processed of processedProjects) {
    if (!finalProjects.some(p => p.id === processed.id)) {
      finalProjects.push(processed);
    }
  }

  // Sort logically based on config or fallback to place/year
  const sortField = apiData.settings?.sort?.field || "year";
  const sortOrder = apiData.settings?.sort?.order || "desc";

  finalProjects.sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    
    // Special fallback handling if values are missing or null
    if (valA === null || valA === undefined) valA = sortOrder === "asc" ? Infinity : -Infinity;
    if (valB === null || valB === undefined) valB = sortOrder === "asc" ? Infinity : -Infinity;

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    
    // Tie-breaker: Always fallback to year descending
    return b.year - a.year;
  });

  // Re-assemble TypeGrid API
  const finalJSON = {
    site: site,
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
      sort: { field: "year", order: "desc" },
      show_thumbnails: true,
      ui: { monospace_font: "monospace", accent_color: site.accent }
    },
    meta: {
      next_project_id: finalProjects.length + 1,
      version: TARGET_VERSION
    }
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(finalJSON, null, 2));
  console.log(`\n[Success] API successfully generated! Tracked ${finalProjects.length} albums in ${DATA_FILE}\n`);
  
  rl.close();
}

generateAPI().catch(err => {
  console.error('\n[Error] Failed to generate API:', err);
  rl.close();
  process.exit(1);
});