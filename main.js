'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const store = require('./src/store');

// নাম স্পষ্ট করে বেঁধে দেওয়া হয়, যাতে সোর্স থেকে চালালে আর তৈরি করা .exe
// থেকে চালালে — দুই ক্ষেত্রেই একই ডেটা ফোল্ডার ব্যবহৃত হয়।
app.setName('NKFMS Service Charge');

const APP_ICON = path.join(__dirname, 'build', 'icon.ico');

// স্প্ল্যাশ অন্তত এতক্ষণ দেখা যাবে — লোগোটি যেন ঝলক দিয়ে মিলিয়ে না যায়
const SPLASH_MIN_MS = 1900;
// মূল উইন্ডো কোনো কারণে প্রস্তুত না হলেও স্প্ল্যাশ যেন আটকে না থাকে
const SPLASH_MAX_MS = 9000;

let mainWindow = null;
let splashWindow = null;

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 620,
    height: 400,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    center: true,
    show: false,
    icon: APP_ICON,
    webPreferences: { contextIsolation: true, nodeIntegration: false }
  });

  splashWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'splash.html'));
  splashWindow.once('ready-to-show', () => splashWindow.show());
  splashWindow.on('closed', () => { splashWindow = null; });
}

// মিলিয়ে যাওয়ার মতো করে স্প্ল্যাশ বন্ধ করা
function closeSplash() {
  const win = splashWindow;
  if (!win || win.isDestroyed()) return;
  splashWindow = null;

  let opacity = 1;
  const timer = setInterval(() => {
    if (win.isDestroyed()) { clearInterval(timer); return; }
    opacity -= 0.12;
    if (opacity <= 0) {
      clearInterval(timer);
      win.destroy();
    } else {
      win.setOpacity(opacity);
    }
  }, 22);
}

function createWindow() {
  const openedAt = Date.now();

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 680,
    title: 'নীলকণ্ঠ ফ্ল্যাট মালিক সমিতি — সার্ভিস চার্জ ব্যবস্থাপনা',
    backgroundColor: '#f4f6fa',
    autoHideMenuBar: true,
    icon: APP_ICON,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  });

  let revealed = false;
  const reveal = () => {
    if (revealed || mainWindow.isDestroyed()) return;
    revealed = true;
    closeSplash();
    mainWindow.show();
    mainWindow.focus();
  };

  mainWindow.once('ready-to-show', () => {
    setTimeout(reveal, Math.max(0, SPLASH_MIN_MS - (Date.now() - openedAt)));
  });
  setTimeout(reveal, SPLASH_MAX_MS);

  // পাতার <title> যেন উইন্ডোর শিরোনাম বদলে না দেয়
  mainWindow.on('page-title-updated', (e) => e.preventDefault());
  mainWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  store.init(app.getPath('userData'));
  createSplash();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/* ---------- ডেটা ---------- */

ipcMain.handle('data:load', () => store.load());

ipcMain.handle('data:save', (_e, data) => store.save(data));

ipcMain.handle('data:paths', () => store.paths());

ipcMain.handle('data:reveal', () => {
  shell.showItemInFolder(store.paths().dataFile);
  return { ok: true };
});

ipcMain.handle('data:export', async () => {
  const stamp = new Date().toISOString().slice(0, 10);
  const res = await dialog.showSaveDialog(mainWindow, {
    title: 'ডেটা ব্যাকআপ সংরক্ষণ',
    defaultPath: `nkfms-backup-${stamp}.json`,
    filters: [{ name: 'NKFMS ডেটা', extensions: ['json'] }]
  });
  if (res.canceled || !res.filePath) return { ok: false, canceled: true };
  return store.exportTo(res.filePath);
});

ipcMain.handle('data:import', async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'ব্যাকআপ ফাইল থেকে ডেটা ফেরত আনুন',
    properties: ['openFile'],
    filters: [{ name: 'NKFMS ডেটা', extensions: ['json'] }]
  });
  if (res.canceled || !res.filePaths.length) return { ok: false, canceled: true };
  try {
    const data = store.importFrom(res.filePaths[0]);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

/* ---------- রিপোর্ট: প্রিন্ট ও PDF ---------- */

function tempReportFile(html) {
  const dir = path.join(app.getPath('userData'), 'tmp');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'report.html');
  fs.writeFileSync(file, html, 'utf8');
  return file;
}

async function withReportWindow(html, fn) {
  const win = new BrowserWindow({
    show: false,
    webPreferences: { offscreen: false, contextIsolation: true, nodeIntegration: false }
  });
  try {
    await win.loadFile(tempReportFile(html));
    // ফন্ট ও লেআউট স্থির হওয়ার জন্য সামান্য অপেক্ষা
    await new Promise((resolve) => setTimeout(resolve, 350));
    return await fn(win);
  } finally {
    if (!win.isDestroyed()) win.destroy();
  }
}

const PDF_OPTIONS = {
  pageSize: 'A4',
  landscape: false,
  printBackground: true,
  margins: { marginType: 'custom', top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 }
};

ipcMain.handle('report:savePdf', async (_e, { html, defaultName }) => {
  const res = await dialog.showSaveDialog(mainWindow, {
    title: 'রিপোর্ট PDF হিসেবে সংরক্ষণ',
    defaultPath: defaultName || 'service-charge-report.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (res.canceled || !res.filePath) return { ok: false, canceled: true };

  try {
    const buffer = await withReportWindow(html, (win) => win.webContents.printToPDF(PDF_OPTIONS));
    fs.writeFileSync(res.filePath, buffer);
    return { ok: true, file: res.filePath };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('report:print', async (_e, { html }) => {
  try {
    return await withReportWindow(html, (win) => new Promise((resolve) => {
      win.webContents.print({ silent: false, printBackground: true }, (success, reason) => {
        resolve(success ? { ok: true } : { ok: false, error: reason });
      });
    }));
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('file:open', async (_e, filePath) => {
  await shell.openPath(filePath);
  return { ok: true };
});
