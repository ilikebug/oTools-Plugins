// =====================
// ClipboardManager 
// =====================

class ClipboardManager {
  constructor() {
    this.POLL_INTERVAL = 100;
    this.HISTORY_LIST_MAX = 100
    this.HISTORY_KEY = 'clipboard_history';
    this.DB_NAME = 'clipboard_db'
  
    this.listenerEnable = false
    this.lastUniqID = null;

    this.historyList = [] 

    this.init();
  }
  
  /**
   * Initialize the plugin
   */
  async init() {
    await this.startClipboardListener();

    // init history list
    this.historyList = await this.getHistory() 
    // render history list
    this.renderHistoryList()
    // scheduled storage history
    setInterval(() => this.saveHistoryList(), 5000);  

    // Bind search events
    this.bindSearchEvents();
  }  

  /**
   * start up clipboard listener
   */
  async startClipboardListener() {
    if (this.listenerEnable) {
      return
    } 
    setInterval(() => this.checkClipboard(), this.POLL_INTERVAL)
    this.listenerEnable = true
  } 

  /**
   * check clipboard
   */
  async checkClipboard() {
    const content = await this.readClipboardItem();
    if (!content) return; 
     const uniqID = this.generateContentUniqID(content); 
     if (uniqID == this.lastUniqID) return;  
     this.lastUniqID = uniqID
     // execute set history item
     this.addContent2HistoryList(content)
     // render content
     this.renderHistoryList()
  }

  // Generate unique ID
  generateContentUniqID(content) {
    if (content.type === 'text') return 't_' + this.hashCode(content.data);
    if (content.type === 'image') return 'i_' + this.hashCode(content.data);
    return 'u_' + Date.now();
  } 
  
  // hash code by clipboard content
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i); 
      hash |= 0;
    }
    return hash.toString(36);
  }

  addContent2HistoryList(content) {
    if (this.historyList.length >= this.HISTORY_LIST_MAX) {
      this.historyList.shift();
    }
    this.historyList.push(content); 
  }

  getHistoryList() {
    return this.historyList;
  }

  async saveHistoryList() {
    await this.setHistory(this.historyList)
  } 

  renderHistoryList(list) {
    if (!list) { list = this.getHistoryList() }
    list = [...list].reverse();
    const mainContent = document.querySelector('.main-content');
    if (!list || list.length === 0) {
      mainContent.innerHTML = '<div class="empty">No clipboard history.</div>';
      return;
    }
    mainContent.innerHTML = '<div class="clip-list">' + list.map((item, idx) => {
      if (item.type === 'text') {
        return `<div class='clip-item' data-index='${idx}'><div class='clip-content' data-fulltext="${this.escapeHtml(item.data)}">${this.escapeHtml(item.data)}</div></div>`; 
      } else if (item.type === 'image') {
        return `<div class='clip-item' data-index='${idx}'><img class='clip-img' src='${item.data}' loading="lazy" /></div>`;
      } else {
        return `<div class='clip-item' data-index='${idx}'><div class='clip-content'>[Unknown type]</div></div>`; 
      } 
    }).join('') + '</div>';

    // bind click event
    const items = mainContent.querySelectorAll('.clip-item');
    items.forEach(item => {
      item.onclick = async (e) => {
        const idx = item.getAttribute('data-index');
        const content = list[idx];
        await this.copyToClipboard(content);
        await window.otools.hideWindow();
        setTimeout(() => this.paste(), 100);
      }
    });

    // bind keyboard navigation
    this.bindKeyboardNavigation(list);

    // bind tooltip for text content
    const textContents = mainContent.querySelectorAll('.clip-content');
    textContents.forEach(el => {
      el.addEventListener('mouseenter', (e) => {
        el.style.maxHeight = 'none';
        el.style.webkitLineClamp = 'unset';
        el.style.overflow = 'visible';
      });
      el.addEventListener('mouseleave', (e) => {
        el.style.maxHeight = '60px';
        el.style.webkitLineClamp = 3;
        el.style.overflow = 'hidden';
      });
    });
  }

  // Keyboard navigation for clipboard items
  bindKeyboardNavigation(list) {
    // Remove previous listeners
    if (this._keydownHandler) {
      document.removeEventListener('keydown', this._keydownHandler);
    }
    let selectedIdx = 0;
    const items = document.querySelectorAll('.clip-item');
    if (items.length === 0) return;  
    // Set initial highlight
    items.forEach((el, idx) => {
      el.classList.toggle('selected', idx === selectedIdx);
    });
    this._keydownHandler = (e) => {
      if (e.key === 'ArrowDown') {
        selectedIdx = (selectedIdx + 1) % items.length;
        items.forEach((el, idx) => {
          el.classList.toggle('selected', idx === selectedIdx);
        });
        items[selectedIdx].scrollIntoView({block: 'nearest'});
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        selectedIdx = (selectedIdx - 1 + items.length) % items.length;
        items.forEach((el, idx) => {
          el.classList.toggle('selected', idx === selectedIdx);
        });
        items[selectedIdx].scrollIntoView({block: 'nearest'});
        e.preventDefault();
      } else if (e.key === 'Enter') {
        const content = list[selectedIdx];
        this.copyToClipboard(content);
        this.hideWindow();
        e.preventDefault();
        setTimeout(() => this.paste(), 100);
      }
    };
    document.addEventListener('keydown', this._keydownHandler);
  }

  /**
   * Bind search input and button events
   */
  bindSearchEvents() {
    const input = document.querySelector('.search-bar input');
    const btn = document.querySelector('.search-btn');
    if (!input || !btn) return;
    // Search on Enter key
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleSearch(input.value);
      }
    });
    // Search on button click
    btn.addEventListener('click', () => {
      this.handleSearch(input.value);
    });
    // Restore all history when input is empty
    input.addEventListener('input', () => {
      if (input.value === '') {
        this.renderHistoryList();
      }
    });
  }

  /**
   * Search and render results
   */
  handleSearch(keyword) {
    keyword = keyword.trim().toLowerCase();
    if (!keyword) {
      this.renderHistoryList();
      return;
    }
    const filtered = this.historyList.filter(item => {
      if (item.type === 'text') {
        return item.data.toLowerCase().includes(keyword);
      }
      // Extend for other types if needed
      return false;
    });
    this.renderHistoryList(filtered);
  }

  // Add a helper to escape HTML for tooltip
  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(tag) {
      const charsToReplace = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return charsToReplace[tag] || tag;
    });
  }

  // Get History 
  async getHistory() {
    const result = await window.otools.getDbValue(this.DB_NAME, this.HISTORY_KEY); 
    if (result && result.success && result.value) {
      return result.value
    }
    return []
  }
 
  // Set History
  async setHistory(list) {
    await window.otools.setDbValue(this.DB_NAME, this.HISTORY_KEY, list);
  }

  // Read clipboard content (prefer text, then image)
  async readClipboardItem() {
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
async copyToClipboard(item) {
  if (item.type === 'text') {
    await window.otools.writeClipboard(item.data); 
  } else if (item.type === 'image') {
    await window.otools.writeClipboardImage(item.data);
  }
}

  // Simulate paste 
  async paste() {
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
} 

new ClipboardManager() 
