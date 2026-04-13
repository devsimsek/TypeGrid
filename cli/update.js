const fs = require('fs');
const path = require('path');
const https = require('https');
const blessed = require('blessed');

const isDryRun = process.argv.includes('--dry-run');
const isForce = process.argv.includes('--force');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error('Status ' + res.statusCode));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((parts1[i] || 0) > (parts2[i] || 0)) return 1;
    if ((parts1[i] || 0) < (parts2[i] || 0)) return -1;
  }
  return 0;
}

const screen = blessed.screen({
  smartCSR: true,
  title: 'TypeGrid OTA Updater',
  warnings: true,
  fullUnicode: true
});

const logBox = blessed.box({
  parent: screen,
  top: 'center',
  left: 'center',
  width: '80%',
  height: '80%',
  content: 'Starting updater...',
  border: { type: 'line' },
  style: {
    fg: 'white',
    border: { fg: '#ea9a97' }
  },
  label: ' Updater '
});

const question = blessed.question({
  parent: screen,
  top: 'center',
  left: 'center',
  width: '60%',
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

screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

async function runUpdate() {
  logBox.setContent('Checking for updates...');
  screen.render();
  
  try {
    const pkgStr = await fetchUrl('https://raw.githubusercontent.com/devsimsek/TypeGrid/main/package.json');
    const remotePkg = JSON.parse(pkgStr);
    const localPkgPath = path.join(__dirname, '../package.json');
    const localPkg = JSON.parse(fs.readFileSync(localPkgPath, 'utf-8'));

    if (compareVersions(remotePkg.version, localPkg.version) > 0) {
      logBox.setContent(`New version found: v${remotePkg.version} (Current: v${localPkg.version})\nFetching changelog...`);
      screen.render();

      const changelog = await fetchUrl('https://raw.githubusercontent.com/devsimsek/TypeGrid/main/CHANGELOG.md');
      const latestChanges = changelog.split('\n## ').slice(0, 2).join('\n## ');

      const executeUpdate = async (updateHtml) => {
        logBox.setContent(isDryRun ? 'DRY RUN: Simulating update...\n' : 'Updating files from GitHub...\n');
        screen.render();

        const files = [
            'package.json',
            'cli/index.js',
            'cli/albums.js',
            'cli/generate.js',
            'cli/config.js',
            'cli/update.js',
            'cli/posts.js',
            'assets/css/reset.css',
            'assets/css/variables.css',
            'assets/css/responsive.css',
            'assets/css/mobile.css',
            'assets/js/typegrid.js',
            'assets/js/loader.js'
          ];

          if (updateHtml) {
            files.push('index.html');
          }
          for (const file of files) {
            try {
              const content = await fetchUrl(`https://raw.githubusercontent.com/devsimsek/TypeGrid/main/${file}`);
              if (content && content !== '404: Not Found') {
                const targetPath = path.join(__dirname, '../', file);
                if (fs.existsSync(path.dirname(targetPath))) {
                  const localContent = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf-8') : '';
                  if (localContent !== content) {
                    logBox.setContent(logBox.content + `\n[Changed] ${file}`);
                    if (!isDryRun) fs.writeFileSync(targetPath, content, 'utf-8');
                  } else {
                    logBox.setContent(logBox.content + `\n[Unchanged] ${file}`);
                  }
                  screen.render();
                }
              }
            } catch(e) {}
          }

          logBox.setContent(logBox.content + `\n\n${isDryRun ? 'Dry run' : 'Update'} complete! Press any key to exit.`);
          screen.render();
          screen.onceKey(['any'], () => process.exit(0));
      };

      if (isForce) {
        executeUpdate(true);
      } else {
        question.ask(`Update to v${remotePkg.version}?\n\n${latestChanges.substring(0, 300)}...\n\n(y/n)`, async (err, val) => {
          if (!err && val) {
            question.ask(`Overwrite index.html?\n\nWarning: Custom frontend edits (analytics, extra CSS) will be lost if you hit 'y'. (y/n)`, async (errHtml, htmlVal) => {
              executeUpdate(!errHtml && htmlVal);
            });
          } else {
            logBox.setContent('Update cancelled. Press any key to exit.');
            screen.render();
            screen.onceKey(['any'], () => process.exit(0));
          }
        });
      }
    } else {
      logBox.setContent(`You are up to date! (v${localPkg.version})\n\nPress any key to exit.`);
      screen.render();
      screen.onceKey(['any'], () => process.exit(0));
    }
  } catch (e) {
    logBox.setContent('Failed to check for updates: ' + e.message + '\n\nPress any key to exit.');
    screen.render();
    screen.onceKey(['any'], () => process.exit(0));
  }
}

runUpdate();