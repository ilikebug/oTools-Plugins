// =====================
// ClipboardManager 
// =====================

class ClipboardManager {
  constructor() {
    this.POLL_INTERVAL = 100;
    this.HISTORY_LIST_MAX = 100
  
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

    window.addEventListener('DOMContentLoaded', renderHistoryList);
    setInterval(renderHistoryList, 300);
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

  async checkClipboard() {
    const content = await window.clipboard.readClipboardItem();
    if (!content) return; 
     const uniqID = this.generateContentUniqID(content); 
     if (uniqID == this.lastUniqID) return;  
     this.lastUniqID = uniqID
     // todo: execute set history item
     this.addContent2HistoryList(content)
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

  renderHistoryList() {
    const list = this.getHistoryList();
    const mainContent = document.querySelector('.main-content');
    if (!list || list.length === 0) {
      mainContent.innerHTML = '<div class="empty">No clipboard history.</div>';
      return;
    }
    mainContent.innerHTML = '<div class="clip-list">' + list.map(item => {
      if (item.type === 'text') {
        return `<div class='clip-item'><div class='clip-content'>${item.data}</div></div>`; 
      } else if (item.type === 'image') {
        return `<div class='clip-item'><img class='clip-img' src='${item.data}' /></div>`;
      } else {
        return `<div class='clip-item'><div class='clip-content'>[Unknown type]</div></div>`; 
      } 
    }).join('') + '</div>';
  }

} 

window.Clipboard = new ClipboardManager()
window.renderHistoryList = () => window.Clipboard.renderHistoryList()
