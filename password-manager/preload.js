// Preload script for Password Manager plugin
// This file provides necessary APIs for the password manager to function

// Plugin information
window.plugin = {
  getplatformName: () => {
    // This would be implemented by the main process
    return process.platform; // Default to macOS
  }
}; 