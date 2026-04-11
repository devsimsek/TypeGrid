const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');
const exifr = require('exifr');

const IMAGES_DIR = path.join(__dirname, 'images');
const DATA_FILE = path.join(__dirname, 'data', 'typegrid.json');

// Ensure directories exist
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  console.log(`[Info] Created ${IMAGES_DIR}. Please add subdirectories with images to generate projects.`);
  process.exit(0);
}

if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Supported image extensions
const VALID_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// Helper to generate a slug from a string
function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// Generate the API
async function generateAPI() {
  console.log('[Info] Scanning local images directory...');
  
  // Load existing config to preserve site settings if it exists
  let apiData = {};
  if (fs.existsSync(DATA_FILE)) {
    try {
      apiData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      console.log('[Info] Found existing typegrid.json, preserving site settings.');
    } catch (e) {
      console.warn('[Warn] Existing typegrid.json is invalid, starting fresh.');
    }
  }

  // Base Data Structure
  const site = apiData.site || {
    title: "Local TypeGrid Portfolio",
    description: "Auto-generated local image gallery.",
    base_url: "",
    lang: "en-US",
    accent: "#ea9a97",
    version: "2.0.0",
    created_at: new Date().toISOString(),
    authors: []
  };

  const projects = [];
  const entries = fs.readdirSync(IMAGES_DIR, { withFileTypes: true });

  // Process subdirectories as projects
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const projectDir = path.join(IMAGES_DIR, entry.name);
    const files = fs.readdirSync(projectDir)
      .filter(file => VALID_EXTENSIONS.has(path.extname(file).toLowerCase()));

    if (files.length === 0) continue;

    console.log(`[Process] Building project: ${entry.name} (${files.length} images)`);

    const projectImages = [];
    let projectCamera = '';
    let projectLens = '';
    let projectYear = new Date().getFullYear();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = path.join(projectDir, file);
      const relativeUrl = `./images/${entry.name}/${file}`;
      
      const stats = fs.statSync(filePath);
      let dimensions = { width: 1920, height: 1080 }; // Fallback
      
      try {
        dimensions = sizeOf(filePath);
      } catch (e) {
        console.warn(`[Warn] Could not read dimensions for ${file}`);
      }

      // Extract EXIF
      let camera = '';
      let lens = '';
      let date = stats.birthtime;

      try {
        const exif = await exifr.parse(filePath).catch(() => null);
        if (exif) {
          const make = exif.Make || '';
          const model = exif.Model || '';
          camera = [make, model].filter(Boolean).join(' ').trim();
          lens = exif.LensModel || '';
          date = exif.CreateDate || exif.DateTimeOriginal || date;
        }
      } catch (e) {
        // EXIF parsing failed, ignore silently
      }

      // Track project-level meta (use first image's EXIF as default)
      if (i === 0) {
        projectCamera = camera;
        projectLens = lens;
        projectYear = new Date(date).getFullYear();
      }

      projectImages.push({
        id: `img-${slugify(entry.name)}-${i}`,
        filename: file,
        url: relativeUrl,
        width: dimensions.width,
        height: dimensions.height,
        size: stats.size,
        primary: i === 0
      });
    }

    const slug = slugify(entry.name);
    const title = entry.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    projects.push({
      id: slug,
      slug: slug,
      title: title,
      year: projectYear || new Date().getFullYear(),
      tags: [slug.split('-')[0]],
      description: `Gallery for ${title}.`,
      excerpt: `${files.length} photos`,
      camera: projectCamera || null,
      lens: projectLens || null,
      favorite: false,
      images: projectImages,
      seo: {
        meta_title: `${title} — ${site.title}`,
        meta_description: `Viewing gallery: ${title}`,
        canonical_url: `/projects/${slug}/`
      },
      open_graph: {
        title: title,
        description: `Gallery for ${title}.`,
        image: projectImages[0].url
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      draft: false,
      url: `/projects/${slug}/`
    });
  }

  // Sort projects by year descending
  projects.sort((a, b) => b.year - a.year);

  // Compile final JSON payload
  const finalJSON = {
    site: site,
    projects: projects,
    collections: apiData.collections || [],
    posts: apiData.posts || [],
    pagination: {
      page_size: apiData.pagination?.page_size || 12,
      total_projects: projects.length,
      total_pages: Math.ceil(projects.length / (apiData.pagination?.page_size || 12)),
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
      next_project_id: projects.length + 1,
      version: "2.0.0"
    }
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(finalJSON, null, 2));
  console.log(`[Success] Generated API with ${projects.length} local projects saved to ${DATA_FILE}`);
}

generateAPI().catch(err => {
  console.error('[Error] Failed to generate API:', err);
  process.exit(1);
});