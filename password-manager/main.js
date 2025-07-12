// =====================
// PasswordManager 
// =====================

class PasswordManager {
  constructor() {
    this.DB_NAME = 'password_db';
    this.PASSWORDS_KEY = 'passwords';
    this.MASTER_PASSWORD_KEY = 'master_password_hash';
    this.SALT_KEY = 'salt';
    this.passwordList = [];
    this.currentEditId = null;
    this.searchKeyword = '';
    this.isAuthenticated = false;
    this.masterPassword = null;

    this.init();
  }
  
  /**
   * Initialize the plugin
   */
  async init() {
    // Check if master password is set
    const hasMasterPassword = await this.checkMasterPassword();
    
    if (hasMasterPassword) {
      // Show master password dialog
      this.showMasterPasswordDialog();
    } else {
      // First time setup - create master password
      this.showSetupMasterPasswordDialog();
    }
  }

  /**
   * Check if master password exists
   */
  async checkMasterPassword() {
    const result = await window.otools.getDbValue(this.DB_NAME, this.MASTER_PASSWORD_KEY);
    return result && result.success && result.value;
  }

  /**
   * Show master password setup dialog
   */
  showSetupMasterPasswordDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'master-password-dialog';
    dialog.innerHTML = `
      <div class="dialog-content">
        <h3>Set Master Password</h3>
        <p>This is your first time using the password manager. Please set a master password to protect all your passwords.</p>
        <div class="form-group">
          <label for="masterPassword">Master Password</label>
          <input type="password" id="masterPassword" placeholder="Enter master password...">
        </div>
        <div class="form-group">
          <label for="confirmMasterPassword">Confirm Master Password</label>
          <input type="password" id="confirmMasterPassword" placeholder="Enter master password again...">
        </div>
        <div class="dialog-buttons">
          <button class="btn-primary" id="setupMasterPassword">Set Master Password</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Bind events
    document.getElementById('setupMasterPassword').addEventListener('click', () => {
      this.setupMasterPassword();
    });
    
    // Handle Enter key
    const inputs = dialog.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.setupMasterPassword();
        }
      });
    });
  }

  /**
   * Show master password dialog
   */
  showMasterPasswordDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'master-password-dialog';
    dialog.innerHTML = `
      <div class="dialog-content">
        <h3>Enter Master Password</h3>
        <p>Please enter your master password to unlock the password manager.</p>
        <div class="form-group">
          <label for="masterPassword">Master Password</label>
          <input type="password" id="masterPassword" placeholder="Enter master password...">
        </div>
        <div class="dialog-buttons">
          <button class="btn-primary" id="unlockMasterPassword">Unlock</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Bind events
    document.getElementById('unlockMasterPassword').addEventListener('click', () => {
      this.unlockMasterPassword();
    });
    
    // Handle Enter key
    const input = dialog.querySelector('input');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.unlockMasterPassword();
      }
    });
    
    input.focus();
  }

  /**
   * Setup master password
   */
  async setupMasterPassword() {
    const masterPassword = document.getElementById('masterPassword').value;
    const confirmPassword = document.getElementById('confirmMasterPassword').value;
    
    if (!masterPassword || masterPassword.length < 6) {
      this.showNotification('Master password must be at least 6 characters', 'error');
      return;
    }
    
    if (masterPassword !== confirmPassword) {
      this.showNotification('Passwords do not match', 'error');
      return;
    }
    
    try {
      // Generate salt and hash
      const salt = this.generateSalt();
      const hash = await this.hashPassword(masterPassword, salt);
      
      // Save master password hash and salt
      await window.otools.setDbValue(this.DB_NAME, this.MASTER_PASSWORD_KEY, hash);
      await window.otools.setDbValue(this.DB_NAME, this.SALT_KEY, salt);
      
      // Remove dialog and initialize
      document.querySelector('.master-password-dialog').remove();
      this.masterPassword = masterPassword;
      this.isAuthenticated = true;
      this.initializeAfterAuth();
      
      this.showNotification('Master password set successfully!', 'success');
    } catch (error) {
      this.showNotification('Failed to set master password', 'error');
    }
  }

  /**
   * Unlock with master password
   */
  async unlockMasterPassword() {
    const masterPassword = document.getElementById('masterPassword').value;
    
    if (!masterPassword) {
      this.showNotification('Please enter master password', 'error');
      return;
    }
    
    try {
      // Get stored hash and salt
      const hashResult = await window.otools.getDbValue(this.DB_NAME, this.MASTER_PASSWORD_KEY);
      const saltResult = await window.otools.getDbValue(this.DB_NAME, this.SALT_KEY);
      
      if (!hashResult.success || !saltResult.success) {
        this.showNotification('Master password verification failed', 'error');
        return;
      }
      
      const storedHash = hashResult.value;
      const salt = saltResult.value;
      
      // Verify password
      const inputHash = await this.hashPassword(masterPassword, salt);
      
      if (inputHash === storedHash) {
        // Remove dialog and initialize
        document.querySelector('.master-password-dialog').remove();
        this.masterPassword = masterPassword;
        this.isAuthenticated = true;
        this.initializeAfterAuth();
        
        this.showNotification('Unlocked successfully!', 'success');
      } else {
        this.showNotification('Incorrect master password', 'error');
        document.getElementById('masterPassword').value = '';
      }
    } catch (error) {
      this.showNotification('Verification failed', 'error');
    }
  }

  /**
   * Initialize after authentication
   */
  async initializeAfterAuth() {
    // Load encrypted passwords from database
    this.passwordList = await this.getEncryptedPasswords();
    
    // Render password list
    this.renderPasswordList();
    
    // Bind events
    this.bindEvents();
    
    // Auto save passwords
    setInterval(() => {
      this.saveEncryptedPasswords();
    }, 5000);
  }

  /**
   * Generate random salt
   */
  generateSalt() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Hash password with salt
   */
  async hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Encrypt data with AES
   */
  async encryptData(data, password) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = encoder.encode(JSON.stringify(data));
    
    const encryptedContent = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encodedData
    );
    
    return {
      encrypted: Array.from(new Uint8Array(encryptedContent)),
      iv: Array.from(iv),
      salt: Array.from(salt)
    };
  }

  /**
   * Decrypt data with AES
   */
  async decryptData(encryptedData, password) {
    try {
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
      
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: new Uint8Array(encryptedData.salt),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['decrypt']
      );
      
      const decryptedContent = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: new Uint8Array(encryptedData.iv)
        },
        key,
        new Uint8Array(encryptedData.encrypted)
      );
      
      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decryptedContent));
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  /**
   * Bind all event listeners
   */
  bindEvents() {
    // Search functionality
    const searchInput = document.querySelector('.top-bar input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        if (!this.isAuthenticated) return;
        this.searchKeyword = e.target.value.trim().toLowerCase();
        this.renderPasswordList();
      });
    }

    // Add new password button
    const addBtn = document.querySelector('.add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if (!this.isAuthenticated) {
          this.showNotification('Please unlock the password manager first', 'error');
          return;
        }
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
    const generatePasswordBtn = document.getElementById('generatePassword');

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
      saveBtn.addEventListener('click', async () => {
        await this.savePassword();
      });
    }

    // Toggle password visibility
    if (togglePasswordBtn) {
      togglePasswordBtn.addEventListener('click', () => {
        this.togglePasswordVisibility();
      });
    }

    // Generate password
    if (generatePasswordBtn) {
      generatePasswordBtn.addEventListener('click', () => {
        // Generate a strong password and fill the input
        const password = this.generateStrongPassword();
        document.getElementById('password').value = password;
        // Optionally, show a notification
        this.showNotification('Password generated!', 'success');
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
      input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter' && e.target.type !== 'textarea') {
          e.preventDefault();
          await this.savePassword();
        }
      });
    });
  }

  /**
   * Generate a strong random password
   * @param {number} length - Password length (default 16)
   * @param {boolean} useUpper - Include uppercase letters
   * @param {boolean} useLower - Include lowercase letters
   * @param {boolean} useNumbers - Include numbers
   * @param {boolean} useSymbols - Include symbols
   * @returns {string} Generated password
   */
  generateStrongPassword(length = 16, useUpper = true, useLower = true, useNumbers = true, useSymbols = true) {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()-_=+[]{}|;:,.<>?';
    let chars = '';
    if (useUpper) chars += upper;
    if (useLower) chars += lower;
    if (useNumbers) chars += numbers;
    if (useSymbols) chars += symbols;
    if (!chars) chars = lower;
    let password = '';
    for (let i = 0; i < length; i++) {
      const idx = Math.floor(Math.random() * chars.length);
      password += chars[idx];
    }
    return password;
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

      // Don't handle keyboard events when not authenticated
      if (!this.isAuthenticated) {
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
            if (!this.isAuthenticated) {
              this.showNotification('Please unlock the password manager first', 'error');
              return;
            }
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
   * Render password list with TOTP code if available
   */
  renderPasswordList() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    // Check if authenticated
    if (!this.isAuthenticated) {
      mainContent.innerHTML = `<div class="empty">Please unlock the password manager first</div>`;
      return;
    }

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
      const emptyMessage = this.searchKeyword ? 'No passwords found' : 'No passwords yet. Click + to add one.';
      mainContent.innerHTML = `<div class="empty">${emptyMessage}</div>`;
      return;
    }

    const passwordListHtml = filteredPasswords.map(password => {
      const id = password.id;
      // Generate TOTP code if totpSecret exists
      let totpHtml = '';
      if (password.totpSecret) {
        const code = this.getTotpCode(password.totpSecret);
        const remaining = this.getTotpRemaining();
        totpHtml = `<div class="totp-section"><span class="totp-code" id="totp-code-${id}">${code}</span><span class="totp-timer" id="totp-timer-${id}">${remaining}s</span></div>`;
      }
      return `
        <div class="password-item" data-id="${id}">
          <div class="password-info">
            <div class="password-title">${this.escapeHtml(password.title)}</div>
            <div class="password-username">${this.escapeHtml(password.username)}</div>
            ${totpHtml}
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

    // Start TOTP timer if any entry has TOTP
    if (filteredPasswords.some(p => p.totpSecret)) {
      this.startTotpTimer(filteredPasswords);
    }
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
    if (!this.isAuthenticated) {
      this.showNotification('Please unlock the password manager first', 'error');
      return;
    }
    
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
    if (!this.isAuthenticated) {
      this.showNotification('Please unlock the password manager first', 'error');
      return;
    }
    
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
    document.getElementById('totpSecret').value = '';
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
    document.getElementById('totpSecret').value = password.totpSecret || '';
  }

  /**
   * Save password (including TOTP secret)
   */
  async savePassword() {
    if (!this.isAuthenticated) {
      this.showNotification('Please unlock the password manager first', 'error');
      return;
    }

    const title = document.getElementById('title').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const url = document.getElementById('url').value.trim();
    const notes = document.getElementById('notes').value.trim();
    const totpSecret = document.getElementById('totpSecret').value.trim();

    // If TOTP secret is provided, only title is required
    if (totpSecret) {
      if (!title) {
        this.showNotification('Please fill in title', 'error');
        return;
      }
    } else {
      // If no TOTP secret, require title, username and password
      if (!title || !username || !password) {
        this.showNotification('Please fill in title, username and password', 'error');
        return;
      }
    }

    const passwordData = {
      title,
      username,
      password,
      url,
      notes,
      totpSecret,
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
   * Copy password or TOTP code to clipboard
   */
  async copyPassword(passwordId) {
    if (!this.isAuthenticated) {
      this.showNotification('Please unlock the password manager first', 'error');
      return;
    }

    const password = this.passwordList.find(p => p.id === passwordId);
    if (!password) return;

    try {
      let contentToCopy;
      let notificationMessage;

      // If TOTP secret exists, copy TOTP code instead of password
      if (password.totpSecret) {
        const totpCode = this.getTotpCode(password.totpSecret);
        if (totpCode && totpCode !== 'Invalid' && totpCode !== 'N/A') {
          contentToCopy = totpCode;
          notificationMessage = 'TOTP code copied to clipboard!';
        } else {
          this.showNotification('Invalid TOTP secret', 'error');
          return;
        }
      } else {
        // Copy password if no TOTP secret
        contentToCopy = password.password;
        notificationMessage = 'Password copied to clipboard!';
      }

      await window.otools.writeClipboard(contentToCopy);
      this.showNotification(notificationMessage, 'success');
    } catch (error) {
      this.showNotification('Failed to copy to clipboard', 'error');
    }
  }

  /**
   * Delete password
   */
  deletePassword(passwordId) {
    if (!this.isAuthenticated) {
      this.showNotification('Please unlock the password manager first', 'error');
      return;
    }

    if (confirm('Are you sure you want to delete this password?')) {
      this.passwordList = this.passwordList.filter(p => p.id !== passwordId);
      this.renderPasswordList();
      this.showNotification('Password deleted successfully!', 'success');
    }
  }

  /**
   * Toggle password visibility and update eye icon
   */
  togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('togglePassword');
    const icon = document.getElementById('togglePasswordIcon');

    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      // Switch to eye-off icon
      icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0120 12c0-5.52-4.48-10-10-10S0 6.48 0 12c0 1.76.46 3.4 1.26 4.82L17.94 17.94z"/><path d="M1 1l22 22"/>';
    } else {
      passwordInput.type = 'password';
      // Switch to eye icon
      icon.innerHTML = '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>';
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

  /**
   * Get encrypted passwords from database
   */
  async getEncryptedPasswords() {
    const result = await window.otools.getDbValue(this.DB_NAME, this.PASSWORDS_KEY);
    if (result && result.success && result.value) {
      // Decrypt the passwords
      const decryptedPasswords = await Promise.all(result.value.map(async (encryptedPassword) => {
        const decrypted = await this.decryptData(encryptedPassword, this.masterPassword);
        return decrypted;
      }));
      return decryptedPasswords;
    }
    return [];
  }

  /**
   * Save encrypted passwords to database
   */
  async saveEncryptedPasswords() {
    // Encrypt the passwords before saving
    const encryptedPasswords = await Promise.all(this.passwordList.map(async (password) => {
      const encrypted = await this.encryptData(password, this.masterPassword);
      return encrypted;
    }));
    await window.otools.setDbValue(this.DB_NAME, this.PASSWORDS_KEY, encryptedPasswords);
  }

  /**
   * Get current TOTP code using plugin.generateTotp from preload
   */
  getTotpCode(secret) {
    try {
      if (!window.plugin || typeof window.plugin.generateTotp !== 'function') return 'N/A';
      const code = window.plugin.generateTotp(secret);
      return code || 'Invalid';
    } catch (e) {
      return 'Invalid';
    }
  }

  /**
   * Get seconds remaining for current TOTP code
   */
  getTotpRemaining() {
    const step = 30;
    const now = Math.floor(Date.now() / 1000);
    return step - (now % step);  
  }

  /**
   * Start TOTP timer to update codes and countdown
   */
  startTotpTimer(passwords) {
    if (this._totpInterval) clearInterval(this._totpInterval);
    this._totpInterval = setInterval(() => {
      passwords.forEach(p => {
        if (p.totpSecret) {
          const codeElem = document.getElementById(`totp-code-${p.id}`);
          const timerElem = document.getElementById(`totp-timer-${p.id}`);
          if (codeElem) codeElem.textContent = this.getTotpCode(p.totpSecret);
          if (timerElem) timerElem.textContent = this.getTotpRemaining() + 's';
        }
      });
    }, 1000);
  }
}

// Initialize password manager
window.passwordManager = new PasswordManager(); 