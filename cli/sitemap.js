const fs = require('fs');
const path = require('path');
const blessed = require('blessed');

const screen = blessed.screen({
  smartCSR: true,
  title: 'TypeGrid Sitemap Generator',
  warnings: true,
  fullUnicode: true
});

const logBox = blessed.log({
  parent: screen,
  top: 'center',
  left: 'center',
  width: '80%',
  height: '80%',
  border: { type: 'line' },
  style: { fg: 'white', border: { fg: '#ea9a97' } },
  label: ' Sitemap Generator '
});

screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

function generateSitemap(data) {
  const baseUrl = data.site && data.site.base_url ? data.site.base_url.replace(/\/$/, '') : null;
  if (!baseUrl) throw new Error("No base_url defined in Site Configuration. Please add it first in the config manager.");

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Home
  xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

  // Projects
  if (data.projects) {
    data.projects.forEach(p => {
      if (p.draft) return;
      xml += `  <url>\n    <loc>${baseUrl}/#/project/${p.slug || p.id}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });
  }

  // Posts
  if (data.posts) {
    data.posts.forEach(p => {
      if (p.draft) return;
      xml += `  <url>\n    <loc>${baseUrl}/#/post/${p.slug || p.id}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    });
  }

  // Pages
  if (data.pages) {
    data.pages.forEach(p => {
      if (p.draft) return;
      xml += `  <url>\n    <loc>${baseUrl}/#/page/${p.slug || p.id}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    });
  }

  xml += `</urlset>`;
  fs.writeFileSync(path.join(__dirname, '../sitemap.xml'), xml, 'utf-8');
}

async function run() {
  logBox.add('Loading typegrid.json...');
  screen.render();
  
  try {
    const dataPath = path.join(__dirname, '../data/typegrid.json');
    if (!fs.existsSync(dataPath)) {
      throw new Error('typegrid.json not found in data/ directory.');
    }
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    logBox.add('Generating sitemap.xml...');
    screen.render();
    
    generateSitemap(data);
    
    logBox.add('Successfully generated sitemap.xml in root directory.');
    logBox.add('\nPress any key to return to main menu.');
    screen.render();
    
    screen.onceKey(['any'], () => {
      process.exit(0);
    });
  } catch (error) {
    logBox.add(`Error: ${error.message}`);
    logBox.add('\nPress any key to exit.');
    screen.render();
    screen.onceKey(['any'], () => process.exit(1));
  }
}

run();