const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('musicPlayer', {
  isDesktop: true,
  openSpotifyAuthorization: (url) => ipcRenderer.invoke('open-spotify-authorization', url),
  onSpotifyCallback: (listener) => {
    const wrapped = (_event, url) => listener(url);
    ipcRenderer.on('spotify-callback', wrapped);
    return () => ipcRenderer.removeListener('spotify-callback', wrapped);
  },
});
