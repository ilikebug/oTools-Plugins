const { contextBridge, ipcRenderer } = require('electron');

const HISTORY_KEY = 'clipboard_history';
const DB_NAME = 'clipboard_db'

// Get History 
async function getHistory() {
  const result = await ipcRenderer.invoke('get-db-value', DB_NAME, HISTORY_KEY); 
  if (result && result.success && result.value) {
    return result.value
  }
  return []
}
 
// Set History
async function setHistory(list) {
  await ipcRenderer.invoke('set-db-value', DB_NAME, HISTORY_KEY, list);
}

// Read clipboard content (prefer text, then image)
async function readClipboardItem() {
  const textData = await ipcRenderer.invoke('read-clipboard');
  if (textData && textData.success) {
    return { type: 'text', data: textData.text };
  }
  const imageData = await ipcRenderer.invoke('read-clipboard-image'); 
  if (imageData && imageData.success) {
    return { type: 'image', data: imageData.imageData };
  }
  return null; 
}

// Copy to clipboard
async function copyToClipboard(item) {
  if (item.type === 'text') {
    await ipcRenderer.invoke('write-clipboard', item.data); 
  } else if (item.type === 'image') {
    await ipcRenderer.invoke('write-clipboard-image', item.data);
  }
}

// Hide window
async function hideWindow() {
  await ipcRenderer.invoke('hide-window');
}

// Simulate paste 
async function paste() {
  const pos = await ipcRenderer.invoke('get-mouse-position');
  if (pos && pos.success) {
    await ipcRenderer.invoke('simulate-mouse', 'click', 
      { x: pos.x, y: pos.y, button: 'left' }); 
  }
  let modifiers = ['command'];
  if (process.platform === 'win32' || process.platform === 'linux') {
    modifiers = ['control'];
  }
  setTimeout(() => {
    ipcRenderer.invoke('simulate-keyboard', 'keyTap', { key: 'v', modifiers });
  }, 100);
}

contextBridge.exposeInMainWorld('clipboard', {
  getHistory,
  setHistory,

  readClipboardItem,
  copyToClipboard,
  hideWindow,
  paste,
});
 