const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

let mainWindow;
let pendingSpotifyUrl = process.argv.find((argument) => argument.startsWith('music-player://'));
const isSingleInstance = app.requestSingleInstanceLock();

if (!isSingleInstance) app.quit();

function sendSpotifyCallback(url) {
  if (!url?.startsWith('music-player://')) return;
  pendingSpotifyUrl = url;
  if (mainWindow?.webContents) mainWindow.webContents.send('spotify-callback', url);
}

app.on('second-instance', (_event, commandLine) => {
  sendSpotifyCallback(commandLine.find((argument) => argument.startsWith('music-player://')));
  if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 360,
    minHeight: 180,
    autoHideMenuBar: true,
    backgroundColor: '#090816',
    title: 'Music Player',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  const devServer = process.env.VITE_DEV_SERVER_URL || process.argv.find((argument) => argument.startsWith('http'));
  if (devServer) mainWindow.loadURL(devServer);
  else mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

  mainWindow.webContents.once('did-finish-load', () => sendSpotifyCallback(pendingSpotifyUrl));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  app.setAsDefaultProtocolClient('music-player');
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
