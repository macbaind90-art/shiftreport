const { app, BrowserWindow, shell, dialog, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

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

function getReportsDir() {
  const dir = app.getPath('downloads');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function sanitizeFileName(name) {
  return String(name || 'shift-report.pdf').replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
}

function psEscape(value) {
  return String(value ?? '').replace(/'/g, "''");
}


function savePdfToReports(payload) {
  const reportsDir = getReportsDir();
  const fileName = sanitizeFileName(payload.fileName || 'shift-report.pdf');
  const pdfPath = path.join(reportsDir, fileName);
  const pdfBytes = Buffer.from(String(payload.pdfBase64 || ''), 'base64');
  if (!pdfBytes.length) throw new Error('PDF was empty.');
  fs.writeFileSync(pdfPath, pdfBytes);
  return { ok: true, pdfPath, reportsDir, fileName };
}

function createOutlookDraftWithAttachment(payload) {
  return new Promise((resolve, reject) => {
    try {
      const saved = savePdfToReports(payload);
      const reportsDir = saved.reportsDir;
      const pdfPath = saved.pdfPath;

      const jsonPath = path.join(os.tmpdir(), 'pwadc-shift-report-mail-' + Date.now() + '.json');
      fs.writeFileSync(jsonPath, JSON.stringify({
        to: payload.to || '',
        cc: payload.cc || '',
        subject: payload.subject || '',
        body: payload.body || '',
        attachment: pdfPath
      }, null, 2), 'utf8');

      const ps = `
$ErrorActionPreference = 'Stop'
$data = Get-Content -LiteralPath '${psEscape(jsonPath)}' -Raw | ConvertFrom-Json
$outlook = New-Object -ComObject Outlook.Application
$mail = $outlook.CreateItem(0)
$mail.To = [string]$data.to
$mail.CC = [string]$data.cc
$mail.Subject = [string]$data.subject
$mail.Body = [string]$data.body
[void]$mail.Attachments.Add([string]$data.attachment)
$mail.Display()
Remove-Item -LiteralPath '${psEscape(jsonPath)}' -Force -ErrorAction SilentlyContinue
`;

      const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps], {
        windowsHide: true
      });
      let stderr = '';
      child.stderr.on('data', d => stderr += d.toString());
      child.on('error', reject);
      child.on('close', code => {
        if (code === 0) resolve({ ok: true, pdfPath, reportsDir });
        else reject(new Error(stderr || 'Outlook automation failed with exit code ' + code));
      });
    } catch (err) {
      reject(err);
    }
  });
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
          label: 'Open Downloads Folder',
          click: () => shell.openPath(getReportsDir())
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

ipcMain.handle('pwadc:create-email-with-pdf', async (_event, payload) => createOutlookDraftWithAttachment(payload));
ipcMain.handle('pwadc:save-pdf-to-reports', async (_event, payload) => savePdfToReports(payload));

ipcMain.handle('pwadc:get-data-locations', async () => ({ dataDir: getDataDir(), reportsDir: getReportsDir(), downloadsDir: getReportsDir() }));

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
