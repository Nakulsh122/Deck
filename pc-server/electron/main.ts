import { app, BrowserWindow, Tray, Menu, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { keyboard, Key, mouse, Point } from '@nut-tree-fork/nut-js';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.VITE_DEV_SERVER_URL !== undefined;

let mainWindow: Electron.BrowserWindow | null = null;
let tray: Electron.Tray | null = null;
let wss: WebSocketServer | null = null;

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    if (!iface) continue;
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
        return alias.address;
    }
  }
  return '127.0.0.1';
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 500,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL!);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.webContents.openDevTools();
    const ip = getLocalIp();
    const port = 8080;
    // Send raw IP/Port to React UI. The UI will encrypt/upload it to Firestore.
    mainWindow?.webContents.send('pairing-info', { ip, port });
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

let expectedSecret: string | null = null;
ipcMain.on('set-uid', (event, secret) => {
  expectedSecret = secret;
});

function setupTray() {
  tray = new Tray(path.join(__dirname, '../public/vite.svg')); 
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => mainWindow?.show() },
    { label: 'Quit', click: () => {
      app.isQuitting = true;
      app.quit();
    }}
  ]);
  
  tray.setToolTip('Deck PC Server');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    mainWindow?.show();
  });
}

function setupWebSocket() {
  wss = new WebSocketServer({ port: 8080 });
  
  wss.on('connection', (ws) => {
    console.log('Client connected. Waiting for authentication...');
    let authenticated = false;

    ws.on('message', async (message) => {
      try {
        const cmd = JSON.parse(message.toString());

        if (!authenticated) {
          if (cmd.type === 'AUTH' && expectedSecret && cmd.secret === expectedSecret) {
            authenticated = true;
            console.log('Client authenticated securely!');
            ws.send(JSON.stringify({ type: 'AUTH_SUCCESS' }));
          } else {
            console.log('Client authentication failed. Closing connection.');
            ws.close();
          }
          return;
        }
        
        if (cmd.type === 'KEY_PRESS') {
          console.log('Key pressed:', cmd.keys);
        }
      } catch (e) {
        console.error('Error parsing command', e);
      }
    });
  });
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.on('window-all-closed', (e: Event) => {
    e.preventDefault();
  });

  app.whenReady().then(() => {
    app.setLoginItemSettings({
      openAtLogin: true,
      path: app.getPath('exe')
    });
    createWindow();
    try { setupTray(); } catch(e) { console.error('Tray setup failed', e); }
    setupWebSocket();
  });
}

declare namespace Electron {
  interface App {
    isQuitting: boolean;
  }
}
app.isQuitting = false;
