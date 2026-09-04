'use strict';

const path = require('node:path');
const { app, BrowserWindow, shell, session } = require('electron');

const GAME_URL = 'https://hero-gridle.eyad-zaki2007.chatgpt.site/game.html';
const GAME_ORIGIN = new URL(GAME_URL).origin;

let mainWindow;

function isTrustedGameUrl(rawUrl) {
  try {
    return new URL(rawUrl).origin === GAME_ORIGIN;
  } catch {
    return false;
  }
}

async function openExternalSafely(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === 'https:') {
      await shell.openExternal(parsed.toString());
    }
  } catch {
    // Ignore invalid links.
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'Hero Gridle',
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#020a12',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: !app.isPackaged
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isTrustedGameUrl(url)) {
      mainWindow.loadURL(url);
    } else {
      openExternalSafely(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isTrustedGameUrl(url)) {
      event.preventDefault();
      openExternalSafely(url);
    }
  });

  mainWindow.webContents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, _description, validatedUrl, isMainFrame) => {
    if (isMainFrame && errorCode !== -3 && validatedUrl.startsWith('https://')) {
      mainWindow.loadFile('offline.html');
    }
  });

  mainWindow.loadFile('loading.html').then(() => mainWindow.loadURL(GAME_URL));
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
  session.defaultSession.setPermissionCheckHandler(() => false);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
