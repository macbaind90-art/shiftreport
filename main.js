const { app, BrowserWindow, shell, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

const APP_NAME = 'PWADC Security Shift Report';
const SHARED_DATA_DIR = '\\\\pig-fs\\Security\\Supervisors\\data';

function getDataDir() {
  try {
    fs.mkdirSync(SHARED_DATA_DIR, { recursive: true });
    fs.accessSync(SHARED_DATA_DIR, fs.constants.R_OK | fs.constants.W_OK);
    return SHARED_DATA_DIR;
  } catch (err) {
    const fallback = app.getPath('userData');
    fs.mkdirSync(fallback, { recursive: true });
    return fallback;
  }
}

function ensureDataDir() {
  return getDataDir();
}

function createWindow() {
  ensureDataDir();

  const win = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    title: APP_NAME,
    backgroundColor: '#111827',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: false,
      sandbox: false,
      webSecurity: true
    }
  });

  win.loadFile(path.join(__dirname, 'app', 'index.html'));

  win.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('mailto:')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('mailto:') || url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  win.webContents.session.on('will-download', (event, item) => {
    const downloads = app.getPath('downloads');
    const filename = item.getFilename();
    item.setSavePath(path.join(downloads, filename));
  });
}

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open App Data Folder',
          click: () => shell.openPath(getDataDir())
        },
        {
          label: 'Show Storage File Location',
          click: () => {
            const file = path.join(getDataDir(), 'pwadc-shift-report-storage.json');
            dialog.showMessageBox({
              type: 'info',
              title: 'Storage File',
              message: 'Shift Report storage file',
              detail: file
            });
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
