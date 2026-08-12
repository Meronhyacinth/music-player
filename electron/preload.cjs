const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('musicPlayer', {
  isDesktop: true,
  openExternal: (url) => shell.openExternal(url),
  onSpotifyCallback: (listener) => {
    const wrapped = (_event, url) => listener(url);
    ipcRenderer.on('spotify-callback', wrapped);
    return () => ipcRenderer.removeListener('spotify-callback', wrapped);
  },
});
