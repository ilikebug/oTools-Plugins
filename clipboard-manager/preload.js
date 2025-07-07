const { contextBridge, ipcRenderer } = require('electron');

// Key names for clipboard history and favorites
const HISTORY_KEY = 'clipboard_history';



// History functions
async function getHistory() {
  return (await ipcRenderer.invoke('get-db-value', HISTORY_KEY)) || [];
}
async function setHistory(list) {
  await ipcRenderer.invoke('set-db-value', HISTORY_KEY, list);
}
async function addHistoryItem(item) {
  let list = await getHistory();
  list = list.filter(i => i.id !== item.id);
  list.unshift(item);
  if (list.length > 50) list = list.slice(0, 50);
  await setHistory(list);
}

// Copy to clipboard
async function copyToClipboard(item) {
  if (item.type === 'text') {
    await ipcRenderer.invoke('write-clipboard', item.data);
  } else if (item.type === 'image') {
    await ipcRenderer.invoke('write-clipboard-image', item.data);
  }
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


contextBridge.exposeInMainWorld('clipboard', {
  readClipboardItem
});
 