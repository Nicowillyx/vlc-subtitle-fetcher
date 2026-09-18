const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  globalShortcut,
  ipcMain
} = require('electron');

const path = require('path');
const fs = require('fs');

const {
  fetchSubtitle,
  getSettings,
  saveSettings
} = require('./subtitle-engine');

let tray = null;
let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 400,
    height: 500,
    show: false,
    resizable: false,
    maximizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, '..', 'index.html'));

  win.on('close', (event) => {
    event.preventDefault();
    win.hide();
  });
}

function showWindow() {
  if (!win) return;

  win.show();
  win.focus();
}

function showSettings() {
  showWindow();

  win.webContents.once('did-finish-load', () => {
    win.webContents.send('open-settings');
  });

  // If page is already loaded
  win.webContents.send('open-settings');
}

function sendStatus(type, msg, file = '') {
  if (!win) return;

  win.webContents.send('status', {
    type,
    msg,
    file
  });
}

async function runFetch() {
  showWindow();

  sendStatus(
    'loading',
    'Checking VLC & searching...'
  );

  try {
    const result = await fetchSubtitle();

    sendStatus(
      'success',
      result.message,
      result.file || ''
    );

    if (tray) {
      tray.displayBalloon({
        title: 'VLC Subtitle Fetcher',
        content: result.message
      });
    }

    return result;

  } catch (error) {
    const message = error.message || 'Something went wrong.';

    sendStatus(
      'error',
      message
    );

    if (tray) {
      tray.displayBalloon({
        title: 'Subtitle Fetcher',
        content: message
      });
    }

    return {
      success: false,
      message
    };
  }
}

function createTray() {
  const iconPath = path.join(
    __dirname,
    '..',
    'assets',
    'icon.png'
  );

  let trayIcon;

  try {
    if (fs.existsSync(iconPath)) {
      trayIcon = iconPath;
    }

    tray = new Tray(
      trayIcon ||
      path.join(
        __dirname,
        '..',
        'node_modules',
        'electron',
        'dist',
        'electron.ico'
      )
    );

  } catch (error) {
    console.error('Tray error:', error);
    return;
  }

  tray.setToolTip('VLC Subtitle Fetcher');

  const menu = Menu.buildFromTemplate([
    {
      label: '⚡ Fetch Subtitle',
      click: () => runFetch()
    },

    {
      label: '⚙️ Settings',
      click: () => showSettings()
    },

    {
      type: 'separator'
    },

    {
      label: '👀 Show App',
      click: () => showWindow()
    },

    {
      type: 'separator'
    },

    {
      label: '❌ Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(menu);

  tray.on('click', () => {
    if (win.isVisible()) {
      win.hide();
    } else {
      showWindow();
    }
  });
}

// ============================
// IPC
// ============================

ipcMain.handle('fetch-subtitle', () => {
  return runFetch();
});

ipcMain.handle('save-settings', (_, settings) => {
  saveSettings(settings);
  return true;
});

ipcMain.handle('get-settings', () => {
  return getSettings();
});

// ============================
// APP
// ============================

app.whenReady().then(() => {
  createWindow();
  createTray();

  globalShortcut.register(
    'CommandOrControl+Shift+S',
    () => runFetch()
  );
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', (event) => {
  event.preventDefault();
});