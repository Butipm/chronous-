const { contextBridge, ipcRenderer } = require('electron');

// contextIsolation:true means this script and the renderer's own JS no
// longer share a global scope - a direct `window.x = y` assignment here
// would not actually reach the page. contextBridge is the one sanctioned
// way across that boundary, and it's deliberately narrow: only send/on/
// removeAllListeners, never the full ipcRenderer object (which has far
// more surface, e.g. invoke/sendSync) or anything from `require` itself.
// Same method names/shapes the renderer code already used under the old
// nodeIntegration:true setup, so call sites didn't need to change, only
// the handful of `window.process?.type === 'renderer'` Electron-detection
// checks (see useElectronEvent.ts/linkUtils.ts/ErrorBoundary.jsx/
// ProtectedEditor.tsx) - window.process never existed via contextBridge
// and was never meant to be relied on for that; window.ipcRenderer's mere
// presence is itself the correct "are we in Electron" signal now.
contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, args) => ipcRenderer.send(channel, args),
  on: (channel, listener) => ipcRenderer.on(channel, listener),
  // Electron's own ipcRenderer.removeAllListeners already treats an omitted
  // channel as "every channel" - no need to special-case it here.
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
