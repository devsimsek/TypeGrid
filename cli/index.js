const blessed = require('blessed');
const { spawnSync } = require('child_process');
const path = require('path');

function showMainMenu() {
  const screen = blessed.screen({
    smartCSR: true,
    title: 'TypeGrid CLI',
    cursor: {
      artificial: true,
      shape: 'line',
      blink: true,
      color: null // null for default background
    }
  });

  const box = blessed.box({
    top: 'center',
    left: 'center',
    width: '50%',
    height: '50%',
    content: '{bold}TypeGrid CLI{/bold}\n\nSelect an option:',
    tags: true,
    border: {
      type: 'line'
    },
    style: {
      fg: 'white',
      border: {
        fg: '#ea9a97'
      }
    }
  });

  const list = blessed.list({
    parent: box,
    top: 3,
    left: 1,
    width: '90%',
    height: '70%',
    keys: true,
    vi: true,
    mouse: true,
    items: [
      '1. Manage Albums',
      '2. Site Configuration',
      '3. Auto-Generate API',
      '4. Check for Updates',
      '5. Exit'
    ],
    style: {
      selected: {
        bg: '#ea9a97',
        fg: 'black',
        bold: true
      },
      item: {
        fg: 'white'
      }
    }
  });

  screen.append(box);

  list.focus();

  list.on('select', (item, index) => {
    screen.destroy();
    
    let script = null;
    switch (index) {
      case 0:
        script = 'albums.js';
        break;
      case 1:
        script = 'config.js';
        break;
      case 2:
        script = 'generate.js';
        break;
      case 3:
        script = 'update.js';
        break;
      case 4:
        process.exit(0);
        break;
    }

    if (script) {
      const scriptPath = path.join(__dirname, script);
      spawnSync('node', [scriptPath], { stdio: 'inherit' });
      // When the child process exits, show the main menu again.
      showMainMenu();
    }
  });

  screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
  });

  screen.render();
}

showMainMenu();