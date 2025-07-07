const { contextBridge, ipcRenderer } = require('electron');

// Key names for clipboard history and favorites
const HISTORY_KEY = 'clipboard_history';
const FAVORITE_KEY = 'clipboard_favorites';

// Clipboard polling interval (ms)
const POLL_INTERVAL = 800;
let lastItem = null;
let timer = null;

// Read clipboard content (prefer text, then image)
async function readClipboardItem() {
  const text = await ipcRenderer.invoke('read-clipboard');
  if (text && text.trim()) {
    return { type: 'text', data: text };
  }
  const imageData = await ipcRenderer.invoke('read-clipboard-image');
  if (imageData) {
    return { type: 'image', data: imageData };
  }
  return null;
}

// Watch clipboard changes, post event on change
function startClipboardWatch() {
  if (timer) return;
  timer = setInterval(async () => {
    const item = await readClipboardItem();
    if (!item) return;
    const id = genId(item);
    if (!lastItem || lastItem.id !== id) {
      lastItem = { ...item, id, time: Date.now() };
      window.postMessage({ type: 'clipboard-changed', item: lastItem }, '*');
      await addHistoryItem(lastItem);
    }
  }, POLL_INTERVAL);
}

// Generate unique ID
function genId(item) {
  if (item.type === 'text') return 't_' + hashCode(item.data);
  if (item.type === 'image') return 'i_' + hashCode(item.data);
  return 'u_' + Date.now();
}
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

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

// Favorites functions
async function getFavorites() {
  return (await ipcRenderer.invoke('get-db-value', FAVORITE_KEY)) || [];
}
async function setFavorites(list) {
  await ipcRenderer.invoke('set-db-value', FAVORITE_KEY, list);
}
async function addFavorite(item) {
  let list = await getFavorites();
  if (!list.find(i => i.id === item.id)) {
    list.unshift(item);
    await setFavorites(list);
  }
}
async function removeFavorite(id) {
  let list = await getFavorites();
  list = list.filter(i => i.id !== id);
  await setFavorites(list);
}

// Copy to clipboard
async function copyToClipboard(item) {
  if (item.type === 'text') {
    await ipcRenderer.invoke('write-clipboard', item.data);
  } else if (item.type === 'image') {
    await ipcRenderer.invoke('write-clipboard-image', item.data);
  }
}

contextBridge.exposeInMainWorld('clipboardAPI', {
  startClipboardWatch,
  getHistory,
  getFavorites,
  addFavorite,
  removeFavorite,
  copyToClipboard,
});

// Start clipboard watcher on plugin load
startClipboardWatch(); 