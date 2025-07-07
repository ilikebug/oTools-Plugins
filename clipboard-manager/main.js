// =====================
// ClipboardManager Main Logic
// =====================

const historyList = document.getElementById('historyList');
const favoriteList = document.getElementById('favoriteList');
const statusBar = document.getElementById('statusBar');

// Render clipboard history
async function renderHistory() {
  const history = await window.clipboardAPI.getHistory();
  historyList.innerHTML = '';
  if (!history.length) {
    historyList.innerHTML = '<div class="empty">No clipboard history</div>';
    return;
  }
  for (const item of history) {
    const el = createItemElement(item, false);
    historyList.appendChild(el);
  }
}

// Render favorites
async function renderFavorites() {
  const favorites = await window.clipboardAPI.getFavorites();
  favoriteList.innerHTML = '';
  if (!favorites.length) {
    favoriteList.innerHTML = '<div class="empty">No favorites</div>';
    return;
  }
  for (const item of favorites) {
    const el = createItemElement(item, true);
    favoriteList.appendChild(el);
  }
}

// Create item element
function createItemElement(item, isFavorite) {
  const div = document.createElement('div');
  div.className = 'clip-item';
  if (item.type === 'text') {
    div.innerHTML = `<div class="clip-content">${escapeHtml(item.data)}</div>`;
  } else if (item.type === 'image') {
    div.innerHTML = `<img class="clip-img" src="${item.data}" alt="Clipboard Image" />`;
  }
  // Action buttons
  const btns = document.createElement('div');
  btns.className = 'clip-actions';
  // Favorite/Unfavorite
  const favBtn = document.createElement('button');
  favBtn.className = 'btn-fav';
  favBtn.innerText = isFavorite ? 'Unfavorite' : 'Favorite';
  favBtn.onclick = async (e) => {
    e.stopPropagation();
    if (isFavorite) {
      await window.clipboardAPI.removeFavorite(item.id);
      showStatus('Removed from favorites');
    } else {
      await window.clipboardAPI.addFavorite(item);
      showStatus('Added to favorites');
    }
    renderFavorites();
    renderHistory();
  };
  btns.appendChild(favBtn);
  // Copy
  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn-copy';
  copyBtn.innerText = 'Copy';
  copyBtn.onclick = async (e) => {
    e.stopPropagation();
    await window.clipboardAPI.copyToClipboard(item);
    showStatus('Copied to clipboard');
  };
  btns.appendChild(copyBtn);
  div.appendChild(btns);
  return div;
}

// Status message
function showStatus(msg) {
  statusBar.innerText = msg;
  statusBar.style.opacity = 1;
  setTimeout(() => { statusBar.style.opacity = 0.6; }, 1200);
}

// HTML escape
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
}

// Listen for clipboard changes
window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'clipboard-changed') {
    renderHistory();
  }
});

// Init
(async function init() {
  await renderHistory();
  await renderFavorites();
})(); 