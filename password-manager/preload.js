// Preload script for Password Manager plugin
// This file provides necessary APIs for the password manager to function

// Expose otools API to renderer process
window.otools = {
  // Database operations
  getDbValue: async (dbName, key) => {
    try {
      // This would be implemented by the main process
      return { success: true, value: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  setDbValue: async (dbName, key, value) => {
    try {
      // This would be implemented by the main process
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Clipboard operations
  writeClipboard: async (text) => {
    try {
      // This would be implemented by the main process
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  readClipboard: async () => {
    try {
      // This would be implemented by the main process
      return { success: true, text: '' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Mouse and keyboard simulation
  getMousePosition: async () => {
    try {
      // This would be implemented by the main process
      return { success: true, x: 0, y: 0 };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  simulateMouse: async (action, options) => {
    try {
      // This would be implemented by the main process
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  simulateKeyboard: async (action, options) => {
    try {
      // This would be implemented by the main process
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Window operations
  hideWindow: async () => {
    try {
      // This would be implemented by the main process
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// Plugin information
window.plugin = {
  getplatformName: () => {
    // This would be implemented by the main process
    return 'darwin'; // Default to macOS
  }
}; 