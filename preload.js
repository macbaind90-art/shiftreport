const fs = require('fs');
const path = require('path');

const SHARED_DATA_DIR = '\\\\pig-fs\\Security\\Supervisors\\data';
const STORAGE_FILENAME = 'pwadc-shift-report-storage.json';

function getFallbackDataPath() {
  const base = process.env.APPDATA || process.env.LOCALAPPDATA || process.cwd();
  return path.join(base, 'PWADC Security Shift Report');
}

function canUseDirectory(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch (_) {
    return false;
  }
}

const dataDir = canUseDirectory(SHARED_DATA_DIR) ? SHARED_DATA_DIR : getFallbackDataPath();
fs.mkdirSync(dataDir, { recursive: true });

const storageFile = path.join(dataDir, STORAGE_FILENAME);
const usingSharedStorage = dataDir === SHARED_DATA_DIR;

function readStore() {
  try {
    if (!fs.existsSync(storageFile)) return {};
    const raw = fs.readFileSync(storageFile, 'utf8');
    return raw.trim() ? JSON.parse(raw) : {};
  } catch (err) {
    const backup = storageFile + '.corrupt-' + new Date().toISOString().replace(/[:.]/g, '-');
    try { if (fs.existsSync(storageFile)) fs.copyFileSync(storageFile, backup); } catch (_) {}
    return {};
  }
}

function writeStore(data) {
  const temp = storageFile + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(temp, storageFile);
}

let cache = readStore();

const fileBackedLocalStorage = {
  get length() { return Object.keys(cache).length; },
  key(index) { return Object.keys(cache)[index] || null; },
  getItem(key) {
    key = String(key);
    return Object.prototype.hasOwnProperty.call(cache, key) ? String(cache[key]) : null;
  },
  setItem(key, value) {
    cache[String(key)] = String(value);
    writeStore(cache);
  },
  removeItem(key) {
    delete cache[String(key)];
    writeStore(cache);
  },
  clear() {
    cache = {};
    writeStore(cache);
  }
};

try {
  Object.defineProperty(window, 'localStorage', {
    value: fileBackedLocalStorage,
    configurable: false,
    enumerable: true,
    writable: false
  });
  window.PWADC_DESKTOP_STORAGE_FILE = storageFile;
  window.PWADC_DESKTOP_STORAGE_MODE = usingSharedStorage ? 'shared-network' : 'local-fallback';
  window.PWADC_DESKTOP_STORAGE_DIR = dataDir;
} catch (err) {
  console.error('Failed to install file-backed storage:', err);
}

try {
  const { ipcRenderer } = require('electron');
  window.PWADCDesktop = {
    createEmailWithPdf: (payload) => ipcRenderer.invoke('pwadc:create-email-with-pdf', payload),
    getDataLocations: () => ipcRenderer.invoke('pwadc:get-data-locations'),
    isDesktopApp: true
  };
} catch (err) {
  console.error('Failed to expose PWADC desktop helpers:', err);
}
