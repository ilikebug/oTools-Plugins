const { contextBridge, ipcRenderer } = require('electron');

// ============================================================================
// EXPOSE PLUGIN API TO RENDERER PROCESS
// ============================================================================

contextBridge.exposeInMainWorld('plugin', {
    getplatformName: () => {
        return process.platform;
    },
  });