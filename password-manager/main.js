// =====================
// PasswordManager 
// =====================

class PasswordManager {
  constructor() {
    this.DB_NAME = 'password_db';
    this.PASSWORDS_KEY = 'passwords';
    this.passwordList = [];
    this.currentEditId = null;
    this.searchKeyword = '';

    this.init();
  }
  
  /**
   * Initialize the plugin
   */
  async init() {
    // Load passwords from database
    this.passwordList = await this.getPasswords();
    
    // Render password list
    this.renderPasswordList();
    
    // Bind events
    this.bindEvents();
    
    // Auto save passwords
    setInterval(() => {
      this.savePasswords();
    }, 5000);
  }

  /**
   * Bind all event listeners
   */
  bindEvents() {
    // Search functionality
    const searchInput = document.querySelector('.top-bar input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchKeyword = e.target.value.trim().toLowerCase();
        this.renderPasswordList();
      });
    }

    // Add new password button
    const addBtn = document.querySelector('.add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.showAddModal();
      });
    }

    // Modal events
    this.bindModalEvents();
    
    // Keyboard navigation
    this.bindKeyboardNavigation();
  }

  /**
   * Bind modal events
   */
  bindModalEvents() {
    const modal = document.getElementById('passwordModal');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const saveBtn = document.getElementById('saveBtn');
    const togglePasswordBtn = document.getElementById('togglePassword');

    // Close modal
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hideModal();
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.hideModal();
      });
    }

    // Save password
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.savePassword();
      });
    }

    // Toggle password visibility
    if (togglePasswordBtn) {
      togglePasswordBtn.addEventListener('click', () => {
        this.togglePasswordVisibility();
      });
    }

    // Close modal on outside click
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideModal();
        }
      });
    }

    // Handle Enter key in modal
    const modalInputs = modal.querySelectorAll('input, textarea');
    modalInputs.forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.type !== 'textarea') {
          e.preventDefault();
          this.savePassword();
        }
      });
    });
  }

  /**
   * Bind keyboard navigation
   */
  bindKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Don't handle keyboard events when modal is open
      if (document.getElementById('passwordModal').classList.contains('show')) {
        return;
      }

      const items = document.querySelectorAll('.password-item');
      const selectedItem = document.querySelector('.password-item.selected');
      let selectedIndex = Array.from(items).indexOf(selectedItem);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
          this.selectPasswordItem(selectedIndex);
          break;
        case 'ArrowUp':
          e.preventDefault();
          selectedIndex = Math.max(selectedIndex - 1, 0);
          this.selectPasswordItem(selectedIndex);
          break;
        case 'Enter':
          if (selectedItem) {
            e.preventDefault();
            const passwordId = selectedItem.getAttribute('data-id');
            this.copyPassword(passwordId);
          }
          break;
        case 'n':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.showAddModal();
          }
          break;
      }
    });
  }

  /**
   * Select password item by index
   */
  selectPasswordItem(index) {
    const items = document.querySelectorAll('.password-item');
    items.forEach((item, i) => {
      item.classList.toggle('selected', i === index);
    });
    
    if (items[index]) {
      items[index].scrollIntoView({ block: 'nearest' });
    }
  }

  /**
   * Render password list
   */
  renderPasswordList() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    let filteredPasswords = this.passwordList;
    
    // Filter by search keyword
    if (this.searchKeyword) {
      filteredPasswords = this.passwordList.filter(password => 
        password.title.toLowerCase().includes(this.searchKeyword) ||
        password.username.toLowerCase().includes(this.searchKeyword) ||
        (password.url && password.url.toLowerCase().includes(this.searchKeyword)) ||
        (password.notes && password.notes.toLowerCase().includes(this.searchKeyword))
      );
    }

    if (filteredPasswords.length === 0) {
      const emptyMessage = this.searchKeyword ? 'No passwords found.' : 'No passwords yet. Click + to add one.';
      mainContent.innerHTML = `<div class="empty">${emptyMessage}</div>`;
      return;
    }

    const passwordListHtml = filteredPasswords.map(password => {
      const id = password.id;
      return `
        <div class="password-item" data-id="${id}">
          <div class="password-info">
            <div class="password-title">${this.escapeHtml(password.title)}</div>
            <div class="password-username">${this.escapeHtml(password.username)}</div>
          </div>
          <div class="password-actions">
            <button class="action-btn copy-btn" title="Copy Password" data-id="${id}">
              <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2h-3M8 3H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2h-2" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="action-btn edit-btn" title="Edit" data-id="${id}">
              <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-7" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="action-btn delete-btn" title="Delete" data-id="${id}">
              <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6h14M8 6V4a2 2 0 012-2h0a2 2 0 012 2v2m3 0v10a2 2 0 01-2 2H7a2 2 0 01-2-2V6h12z" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    mainContent.innerHTML = `<div class="password-list">${passwordListHtml}</div>`;

    // Bind password item events
    this.bindPasswordItemEvents();
  }

  /**
   * Bind password item events
   */
  bindPasswordItemEvents() {
    const passwordItems = document.querySelectorAll('.password-item');
    const copyBtns = document.querySelectorAll('.copy-btn');
    const editBtns = document.querySelectorAll('.edit-btn');
    const deleteBtns = document.querySelectorAll('.delete-btn');

    // Password item click
    passwordItems.forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.action-btn')) {
          const passwordId = item.getAttribute('data-id');
          this.copyPassword(passwordId);
        }
      });
    });

    // Copy button
    copyBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const passwordId = btn.getAttribute('data-id');
        this.copyPassword(passwordId);
      });
    });

    // Edit button
    editBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const passwordId = btn.getAttribute('data-id');
        this.showEditModal(passwordId);
      });
    });

    // Delete button
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const passwordId = btn.getAttribute('data-id');
        this.deletePassword(passwordId);
      });
    });
  }

  /**
   * Show add password modal
   */
  showAddModal() {
    this.currentEditId = null;
    this.clearModalForm();
    document.getElementById('modalTitle').textContent = 'Add New Password';
    document.getElementById('passwordModal').classList.add('show');
    document.getElementById('title').focus();
  }

  /**
   * Show edit password modal
   */
  showEditModal(passwordId) {
    const password = this.passwordList.find(p => p.id === passwordId);
    if (!password) return;

    this.currentEditId = passwordId;
    this.fillModalForm(password);
    document.getElementById('modalTitle').textContent = 'Edit Password';
    document.getElementById('passwordModal').classList.add('show');
    document.getElementById('title').focus();
  }

  /**
   * Hide modal
   */
  hideModal() {
    document.getElementById('passwordModal').classList.remove('show');
    this.currentEditId = null;
  }

  /**
   * Clear modal form
   */
  clearModalForm() {
    document.getElementById('title').value = '';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('url').value = '';
    document.getElementById('notes').value = '';
  }

  /**
   * Fill modal form with password data
   */
  fillModalForm(password) {
    document.getElementById('title').value = password.title || '';
    document.getElementById('username').value = password.username || '';
    document.getElementById('password').value = password.password || '';
    document.getElementById('url').value = password.url || '';
    document.getElementById('notes').value = password.notes || '';
  }

  /**
   * Save password
   */
  savePassword() {
    const title = document.getElementById('title').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const url = document.getElementById('url').value.trim();
    const notes = document.getElementById('notes').value.trim();

    if (!title || !username || !password) {
      this.showNotification('Please fill in title, username and password.', 'error');
      return;
    }

    const passwordData = {
      title,
      username,
      password,
      url,
      notes,
      createdAt: new Date().toISOString()
    };

    if (this.currentEditId) {
      // Edit existing password
      const index = this.passwordList.findIndex(p => p.id === this.currentEditId);
      if (index !== -1) {
        passwordData.id = this.currentEditId;
        passwordData.createdAt = this.passwordList[index].createdAt;
        passwordData.updatedAt = new Date().toISOString();
        this.passwordList[index] = passwordData;
      }
    } else {
      // Add new password
      passwordData.id = this.generateId();
      this.passwordList.unshift(passwordData);
    }

    this.renderPasswordList();
    this.hideModal();
    this.showNotification('Password saved successfully!', 'success');
  }

  /**
   * Copy password to clipboard
   */
  async copyPassword(passwordId) {
    const password = this.passwordList.find(p => p.id === passwordId);
    if (!password) return;

    try {
      await window.otools.writeClipboard(password.password);
      this.showNotification('Password copied to clipboard!', 'success');
      
      // Auto paste after a short delay
      setTimeout(() => {
        this.pastePassword();
      }, 100);
    } catch (error) {
      this.showNotification('Failed to copy password.', 'error');
    }
  }

  /**
   * Paste password
   */
  async pastePassword() {
    const pos = await window.otools.getMousePosition();
    if (pos && pos.success) {
      await window.otools.simulateMouse('click', 
        { x: pos.x, y: pos.y, button: 'left' }); 
    }
    let modifiers = ['command'];
    if (window.plugin.getplatformName() === 'win32' ||
        window.plugin.getplatformName() === 'linux') {
      modifiers = ['control'];
    }
    setTimeout(() => {
      window.otools.simulateKeyboard('keyTap', { key: 'v', modifiers });
    }, 100);
  }

  /**
   * Delete password
   */
  deletePassword(passwordId) {
    if (confirm('Are you sure you want to delete this password?')) {
      this.passwordList = this.passwordList.filter(p => p.id !== passwordId);
      this.renderPasswordList();
      this.showNotification('Password deleted successfully!', 'success');
    }
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('togglePassword');
    
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      toggleBtn.innerHTML = `
        <svg viewBox="0 0 20 20" fill="none" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.94 17.94A10.07 10.07 0 0120 10c0-5.52-4.48-10-10-10S0 4.48 0 10c0 1.76.46 3.4 1.26 4.82L17.94 17.94zM14.82 14.82L1.26 1.26A10.07 10.07 0 000 10c0 5.52 4.48 10 10 10 1.76 0 3.4-.46 4.82-1.26L14.82 14.82z" stroke="#666" stroke-width="2"/>
          <path d="M10 13a3 3 0 100-6 3 3 0 000 6z" stroke="#666" stroke-width="2"/>
        </svg>
      `;
    } else {
      passwordInput.type = 'password';
      toggleBtn.innerHTML = `
        <svg viewBox="0 0 20 20" fill="none" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 10s4-8 9-8 9 8 9 8-4 8-9 8-9-8-9-8z" stroke="#666" stroke-width="2"/>
          <circle cx="10" cy="10" r="3" stroke="#666" stroke-width="2"/>
        </svg>
      `;
    }
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.copy-success');
    existingNotifications.forEach(notification => notification.remove());

    // Create new notification
    const notification = document.createElement('div');
    notification.className = 'copy-success';
    notification.style.background = type === 'success' ? 'var(--success-color)' : 'var(--danger-color)';
    notification.textContent = message;
    
    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Escape HTML
   */
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

  /**
   * Get passwords from database
   */
  async getPasswords() {
    const result = await window.otools.getDbValue(this.DB_NAME, this.PASSWORDS_KEY);
    if (result && result.success && result.value) {
      return result.value;
    }
    return [];
  }

  /**
   * Save passwords to database
   */
  async savePasswords() {
    await window.otools.setDbValue(this.DB_NAME, this.PASSWORDS_KEY, this.passwordList);
  }
}

// Initialize password manager
window.passwordManager = new PasswordManager(); 