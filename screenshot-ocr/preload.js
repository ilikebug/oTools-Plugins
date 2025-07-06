const { contextBridge, ipcRenderer } = require('electron');

// ============================================================================
// EXPOSE PLUGIN API TO RENDERER PROCESS
// ============================================================================

contextBridge.exposeInMainWorld('plugin', {
  // Plugin execution callback
  onPluginsExecute: (callback) => ipcRenderer.on('plugin-execute', (event, args) => callback(args)),
  
  // OCR functions
  performOcr: (imageData) => ipcRenderer.invoke('perform-ocr', imageData),
  captureAndOcr: () => ipcRenderer.invoke('capture-and-ocr'),
  
  // Window control
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  showWindow: () => ipcRenderer.invoke('show-window'),

  // File operations
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
})
