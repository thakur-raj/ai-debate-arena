const { contextBridge } = require('electron');

// Expose minimal API — webview control happens directly in renderer
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
});
