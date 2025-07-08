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

    // init history list
    this.historyList = await window.clipboard.getHistory() 
    // render history list
    this.renderHistoryList()
    // scheduled storage history
    setInterval(() => this.saveHistoryList(), 5000);  
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
    const content = await window.clipboard.readClipboardItem();
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
    await window.clipboard.setHistory(this.historyList)
  } 

  renderHistoryList(list) {
    if (!list) { list = this.getHistoryList() }
    const mainContent = document.querySelector('.main-content');
    if (!list || list.length === 0) {
      mainContent.innerHTML = '<div class="empty">No clipboard history.</div>';
      return;
    }
    mainContent.innerHTML = '<div class="clip-list">' + list.map((item, idx) => {
      if (item.type === 'text') {
        return `<div class='clip-item' data-index='${idx}'><div class='clip-content'>${item.data}</div></div>`; 
      } else if (item.type === 'image') {
        return `<div class='clip-item' data-index='${idx}'><img class='clip-img' src='${item.data}' /></div>`;
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
        await window.clipboard.copyToClipboard(content);
        await window.clipboard.hideWindow();
      }
    });
  }

} 

window.Clipboard = new ClipboardManager() 
window.renderHistoryList = () => window.Clipboard.renderHistoryList()
