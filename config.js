const fs = require('fs');
const path = require('path');
const readline = require('readline');

const DATA_FILE = path.join(__dirname, 'data', 'typegrid.json');
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

const askOptions = async (query, options, defaultVal) => {
  const validValues = options.map(o => o.value);
  const displayOptions = options.map(o => `${o.value} (${o.label})`).join(', ');
  
  while (true) {
    const answer = await ask(`${query} - Options: ${displayOptions}`, defaultVal);
    if (validValues.includes(answer)) {
      return answer;
    }
    console.log(`${colors.red}[!] Invalid option. Please choose from: ${validValues.join(', ')}${colors.reset}`);
  }
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

// --- Main Config Wizard ---
async function runConfigWizard() {
  console.clear();
  console.log(`${colors.rose}${colors.bold}======================================================${colors.reset}`);
  console.log(`${colors.rose}${colors.bold}              TYPEGRID CONFIG WIZARD ⚙️                ${colors.reset}`);
  console.log(`${colors.rose}${colors.bold}======================================================${colors.reset}\n`);

  if (!fs.existsSync(DATA_FILE)) {
    console.log(`${colors.red}[!] Configuration file not found at ${DATA_FILE}.${colors.reset}`);
    console.log(`${colors.dim}Please run 'npm run generate' first to create the base configuration.${colors.reset}\n`);
    rl.close();
    return;
  }

  let apiData;
  try {
    apiData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    console.log(`${colors.red}[Error] Failed to parse typegrid.json. It might be corrupted.${colors.reset}\n`);
    rl.close();
    return;
  }

  // Ensure settings object exists
  if (!apiData.settings) {
    apiData.settings = {
      layout: { columns_desktop: 3, columns_tablet: 2, columns_mobile: 1 },
      sort: { field: "place", order: "asc" },
      show_thumbnails: true,
      ui: { monospace_font: "monospace", accent_color: apiData.site?.accent || "#ea9a97" }
    };
  }
  
  if (!apiData.pagination) {
    apiData.pagination = { page_size: 12, total_projects: 0, total_pages: 1, pages: [] };
  }

  let continueConfig = true;

  while (continueConfig) {
    console.log(`\n${colors.pine}${colors.bold}What would you like to configure?${colors.reset}`);
    console.log(`1. Site Details (Title, Description, URLs)`);
    console.log(`2. Default Sorting Configuration`);
    console.log(`3. Pagination Settings`);
    console.log(`4. Social Links (Footer)`);
    console.log(`5. Exit and Save\n`);

    const choice = await ask('Select an option (1-5)', '5');

    switch (choice) {
      case '1':
        console.log(`\n${colors.pine}${colors.bold}--- Site Details ---${colors.reset}`);
        apiData.site.title = await ask('Site Title', apiData.site.title);
        apiData.site.description = await ask('Site Description', apiData.site.description);
        apiData.site.base_url = await ask('Base URL', apiData.site.base_url);
        apiData.site.accent = await ask('Accent Color Hex (e.g. #ea9a97)', apiData.site.accent);
        
        // Keep UI setting in sync with Site setting
        if (apiData.settings.ui) {
            apiData.settings.ui.accent_color = apiData.site.accent;
        }
        console.log(`${colors.green}Site details updated.${colors.reset}`);
        break;

      case '2':
        console.log(`\n${colors.pine}${colors.bold}--- Default Sorting Configuration ---${colors.reset}`);
        console.log(`${colors.dim}This controls how albums are ordered when visitors first load the site.${colors.reset}`);
        
        const sortField = await askOptions('Sort By', [
            { value: 'place', label: 'Curated Placement Order' },
            { value: 'year', label: 'Chronological Year' },
            { value: 'title', label: 'Alphabetical' }
        ], apiData.settings.sort.field || 'place');
        
        const sortOrder = await askOptions('Sort Direction', [
            { value: 'asc', label: 'Ascending (1-9, A-Z, Oldest First)' },
            { value: 'desc', label: 'Descending (9-1, Z-A, Newest First)' }
        ], apiData.settings.sort.order || 'asc');

        apiData.settings.sort = { field: sortField, order: sortOrder };
        console.log(`${colors.green}Default sorting updated.${colors.reset}`);
        break;

      case '3':
        console.log(`\n${colors.pine}${colors.bold}--- Pagination Settings ---${colors.reset}`);
        const pageSizeInput = await ask('Albums per page', apiData.pagination.page_size);
        const pageSize = parseInt(pageSizeInput, 10);
        
        if (!isNaN(pageSize) && pageSize > 0) {
            apiData.pagination.page_size = pageSize;
            
            // Recalculate totals based on new page size
            const totalProjects = apiData.projects ? apiData.projects.length : 0;
            apiData.pagination.total_projects = totalProjects;
            apiData.pagination.total_pages = Math.ceil(totalProjects / pageSize);
            
            console.log(`${colors.green}Pagination set to ${pageSize} albums per page.${colors.reset}`);
        } else {
            console.log(`${colors.red}Invalid number. Skipping.${colors.reset}`);
        }
        break;
        
      case '4':
        console.log(`\n${colors.pine}${colors.bold}--- Global Social Links ---${colors.reset}`);
        console.log(`${colors.dim}These appear at the bottom of the footer.${colors.reset}`);
        
        if (!apiData.socials) apiData.socials = { links: [], share_templates: {} };
        if (!apiData.socials.links) apiData.socials.links = [];
        
        let editingSocials = true;
        while(editingSocials) {
            console.log(`\nCurrent Links:`);
            if (apiData.socials.links.length === 0) {
                console.log(`  (None)`);
            } else {
                apiData.socials.links.forEach((l, idx) => {
                    console.log(`  ${idx + 1}. ${l.platform}: ${l.url}`);
                });
            }
            
            const action = await ask(`\nOptions: [a]dd, [r]emove, [d]one`, 'd');
            
            if (action.toLowerCase() === 'a') {
                const platform = await ask('Platform name (e.g., twitter, instagram, github, email)');
                const url = await ask('Full URL (e.g., https://github.com/myusername)');
                if (platform && url) {
                    apiData.socials.links.push({ platform: platform.toLowerCase(), url: url });
                }
            } else if (action.toLowerCase() === 'r') {
                const indexInput = await ask('Enter the number to remove');
                const idx = parseInt(indexInput, 10) - 1;
                if (!isNaN(idx) && idx >= 0 && idx < apiData.socials.links.length) {
                    const removed = apiData.socials.links.splice(idx, 1);
                    console.log(`${colors.dim}Removed ${removed[0].platform}${colors.reset}`);
                }
            } else if (action.toLowerCase() === 'd') {
                editingSocials = false;
            }
        }
        break;

      case '5':
        continueConfig = false;
        break;

      default:
        console.log(`${colors.red}Invalid option.${colors.reset}`);
    }
  }

  // --- Save Changes ---
  apiData.meta.version = TARGET_VERSION;
  fs.writeFileSync(DATA_FILE, JSON.stringify(apiData, null, 2));

  console.log(`\n${colors.rose}${colors.bold}======================================================${colors.reset}`);
  console.log(`${colors.green}${colors.bold}  SUCCESS! Configuration Saved ✨${colors.reset}`);
  console.log(`${colors.dim}  Updated data/typegrid.json${colors.reset}`);
  console.log(`${colors.rose}${colors.bold}======================================================${colors.reset}\n`);

  rl.close();
}

runConfigWizard().catch(err => {
  console.error(`\n${colors.red}[Error] Config Wizard failed:${colors.reset}`, err);
  rl.close();
  process.exit(1);
});