const { contextBridge, ipcRenderer } = require('electron');

// ============================================================================
// EXPOSE PLUGIN API TO RENDERER PROCESS
// ============================================================================


const HISTORY_KEY = 'clipboard_history';
const DB_NAME = 'clipboard_db'

// Get History 
async function getHistory() {
  const result = await window.otools.getDbValue(DB_NAME, HISTORY_KEY); 
  if (result && result.success && result.value) {
    return result.value
  }
  return []
}
 
// Set History
async function setHistory(list) {
  await window.otools.setDbValue(DB_NAME, HISTORY_KEY, list);
}

// Read clipboard content (prefer text, then image)
async function readClipboardItem() {
  const textData = await window.otools.readClipboard();
  if (textData && textData.success) {
    return { type: 'text', data: textData.text };
  }
  const imageData = await window.otools.readClipboardImage(); 
  if (imageData && imageData.success) {
    return { type: 'image', data: imageData.imageData };
  }
  return null; 
}

// Copy to clipboard
async function copyToClipboard(item) {
  if (item.type === 'text') {
    await window.otools.writeClipboard(item.data); 
  } else if (item.type === 'image') {
    await window.otools.writeClipboardImage(item.data);
  }
}

// Hide window
async function hideWindow() {
  await window.otools.hideWindow();
}

// Simulate paste 
async function paste() {
  const pos = await window.otools.getMousePosition();
  if (pos && pos.success) {
    await window.otools.simulateMouse('click', 
      { x: pos.x, y: pos.y, button: 'left' }); 
  }
  let modifiers = ['command'];
  if (process.platform === 'win32' || process.platform === 'linux') {
    modifiers = ['control'];
  }
  setTimeout(() => {
    window.otools.simulateKeyboard('keyTap', { key: 'v', modifiers });
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
 