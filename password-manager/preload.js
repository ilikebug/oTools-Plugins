// Preload script for Password Manager plugin
// This file provides necessary APIs for the password manager to function

const { contextBridge } = require('electron');
const { authenticator } = require('otplib');

// Expose plugin object with generateTotp and platform info
contextBridge.exposeInMainWorld('plugin', {
  getplatformName: () => {
    // This would be implemented by the main process
    return process.platform; // Default to macOS
  },
  generateTotp: (secret) => {
    try {
      // Clean up secret: remove spaces, uppercase
      const cleanSecret = (secret || '').replace(/\s+/g, '').toUpperCase();
      if (!cleanSecret) return '';
      return authenticator.generate(cleanSecret);
    } catch (e) {
      return '';
    }
  }
}); 