// ============================================================================
// OCR PLUGIN CLASS
// ============================================================================

class OCRPlugin {
    constructor() {
        this.currentImageData = null;
        this.currentText = '';
        this.isProcessing = false;
        
        this.init();
    }
    
    /**
     * Initialize the plugin
     */
    init() {
        this.bindEvents();
        this.initializePage();
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOM loaded, initializing plugin...');
            this.checkElements();
            this.testStatusUpdate();
        });
        
        // Update timestamp periodically
        setInterval(() => this.updateTimestamp(), 1000);
    }
    
    /**
     * Initialize the page
     */
    initializePage() {
        this.hideLoading();
        this.showImagePlaceholder();
        this.resetTextContent();
        this.clearErrorMessages();
        this.updateStatus('Ready');
    }
    
    /**
     * Check if required elements exist
     */
    checkElements() {
        const statusText = document.getElementById('statusText');
        const timestamp = document.getElementById('timestamp');
        console.log('Status text element:', statusText);
        console.log('Timestamp element:', timestamp);
    }
    
    /**
     * Test status update
     */
    testStatusUpdate() {
        setTimeout(() => {
            this.updateStatus('Page loaded successfully');
        }, 1000);
    }
    
    // ============================================================================
    // DOM ELEMENT HELPERS
    // ============================================================================
    
    /**
     * Get DOM element by ID
     * @param {string} id - Element ID
     * @returns {HTMLElement|null}
     */
    getElement(id) {
        return document.getElementById(id);
    }
    
    /**
     * Hide loading state
     */
    hideLoading() {
        const loading = this.getElement('imageLoading');
        if (loading) {
            loading.style.display = 'none';
        }
    }
    
    /**
     * Show loading state
     */
    showLoading() {
        const loading = this.getElement('imageLoading');
        if (loading) {
            loading.style.display = 'flex';
        }
    }
    
    /**
     * Clear image container
     */
    clearImageContainer() {
        const container = this.getElement('imageContainer');
        if (container) {
            container.innerHTML = '';
        }
    }
    
    /**
     * Add element to image container
     * @param {HTMLElement} element - Element to add
     */
    addToImageContainer(element) {
        const container = this.getElement('imageContainer');
        if (container && element) {
            container.appendChild(element);
        }
    }
    
    /**
     * Clear error messages
     */
    clearErrorMessages() {
        const errorContainer = this.getElement('errorContainer');
        if (errorContainer) {
            errorContainer.innerHTML = '';
        }
    }
    
    // ============================================================================
    // DISPLAY FUNCTIONS
    // ============================================================================
    
    /**
     * Show image placeholder
     */
    showImagePlaceholder() {
        const container = this.getElement('imageContainer');
        if (container) {
            container.innerHTML = `
                <div class="image-placeholder">
                    <div class="placeholder-icon">📷</div>
                    <div class="placeholder-text">No Image Selected</div>
                    <div class="placeholder-subtext">Click "Screenshot" to capture or "Load File" to select an image for OCR</div>
                </div>
            `;
        }
    }
    
    /**
     * Display OCR result
     * @param {Object} data - Result data
     */
    displayResult(data) {
        if (data.imageData) {
            if (data.imageData.startsWith('data:')) {
                this.displayImageFromDataUrl(data.imageData);
            } else {
                this.displayImage(data.imageData);
            }
        }
        
        if (data.text) {
            this.displayText(data.text);
        }
        
        this.updateStatus('Recognition complete');
    }
    
    /**
     * Display image from base64
     * @param {string} imageBase64 - Base64 data
     * @param {string} filePath - Optional file path
     */
    displayImage(imageBase64, filePath = null) {
        console.log('Displaying image, base64 length:', imageBase64.length);
        this.currentImageData = imageBase64;
        
        this.hideLoading();
        
        const img = this.createImageElement(imageBase64, filePath);
        this.clearImageContainer();
        this.addToImageContainer(img);
    }
    
    /**
     * Display image from data URL
     * @param {string} dataUrl - Data URL
     */
    displayImageFromDataUrl(dataUrl) {
        console.log('Displaying image from data URL, length:', dataUrl.length);
        this.currentImageData = dataUrl;
        
        this.hideLoading();
        
        const img = this.createImageElementFromDataUrl(dataUrl);
        this.clearImageContainer();
        this.addToImageContainer(img);
    }
    
    /**
     * Create image element from base64
     * @param {string} imageBase64 - Base64 data
     * @param {string} filePath - Optional file path
     * @returns {HTMLImageElement}
     */
    createImageElement(imageBase64, filePath = null) {
        const img = document.createElement('img');
        const mimeType = this.getMimeType(filePath);
        
        img.src = `data:${mimeType};base64,${imageBase64}`;
        img.className = 'screenshot-image';
        img.alt = 'Screenshot Preview';
        
        this.addImageEventListeners(img, 'base64');
        
        return img;
    }
    
    /**
     * Create image element from data URL
     * @param {string} dataUrl - Data URL
     * @returns {HTMLImageElement}
     */
    createImageElementFromDataUrl(dataUrl) {
        const img = document.createElement('img');
        
        img.src = dataUrl;
        img.className = 'screenshot-image';
        img.alt = 'Screenshot Preview';
        
        this.addImageEventListeners(img, 'data URL');
        
        return img;
    }
    
    /**
     * Add event listeners to image
     * @param {HTMLImageElement} img - Image element
     * @param {string} type - Image type for logging
     */
    addImageEventListeners(img, type) {
        img.onload = () => {
            console.log(`Image loaded successfully from ${type}`);
        };
        
        img.onerror = (error) => {
            console.error(`Image failed to load from ${type}:`, error);
            this.displayError('Failed to load image');
        };
    }
    
    /**
     * Get MIME type from file path
     * @param {string} filePath - File path
     * @returns {string} MIME type
     */
    getMimeType(filePath) {
        if (!filePath) return 'image/png';
        
        const fileExtension = filePath.split('.').pop().toLowerCase();
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'bmp': 'image/bmp',
            'tiff': 'image/tiff',
            'tif': 'image/tiff'
        };
        
        return mimeTypes[fileExtension] || 'image/png';
    }
    
    /**
     * Display text
     * @param {string} text - Text to display
     */
    displayText(text) {
        this.currentText = text;
        const textContent = this.getElement('textContent');
        
        if (text && text.trim()) {
            textContent.textContent = text;
            textContent.className = 'text-content';
        } else {
            textContent.textContent = 'No text recognized';
            textContent.className = 'text-content empty';
        }
    }
    
    /**
     * Display error message
     * @param {string} message - Error message
     */
    displayError(message) {
        const errorContainer = this.getElement('errorContainer');
        errorContainer.innerHTML = `<div class="error-message">${message}</div>`;
        this.updateStatus('Recognition failed');
    }
    
    // ============================================================================
    // COPY FUNCTIONS
    // ============================================================================
    
    /**
     * Copy text to clipboard
     */
    async copyText() {
        if (!this.currentText) {
            this.updateStatus('No text to copy');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(this.currentText);
            this.updateStatus('Text copied to clipboard', 'copy-success');
            setTimeout(() => this.updateStatus('Ready'), 2000);
        } catch (error) {
            console.error('Copy failed:', error);
            this.updateStatus('Copy failed');
        }
    }
    
    /**
     * Copy image to clipboard
     */
    async copyImage() {
        if (!this.currentImageData) {
            this.updateStatus('No image to copy');
            return;
        }
        
        try {
            const imageUrl = this.currentImageData.startsWith('data:') 
                ? this.currentImageData 
                : `data:image/png;base64,${this.currentImageData}`;
            
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            
            this.updateStatus('Image copied to clipboard', 'copy-success');
            setTimeout(() => this.updateStatus('Ready'), 2000);
        } catch (error) {
            console.error('Copy image failed:', error);
            this.updateStatus('Copy image failed');
        }
    }
    
    // ============================================================================
    // SAVE FUNCTIONS
    // ============================================================================
    
    /**
     * Save image to file
     */
    async saveImage() {
        if (!this.currentImageData) {
            this.updateStatus('No image to save');
            return;
        }
        
        const result = await window.otools.showSaveDialog();
        if (result && result.filePath) {
            try {
                await window.otools.writeFile(result.filePath, `data:image/png;base64,${this.currentImageData}`);
                this.updateStatus('Image saved successfully', 'copy-success');
            } catch (error) {
                console.error('Save failed:', error);
                this.updateStatus('Save failed');
            }
        }
    }
    
    // ============================================================================
    // CLEAR FUNCTIONS
    // ============================================================================
    
    /**
     * Clear text
     */
    clearText() {
        this.currentText = '';
        const textContent = this.getElement('textContent');
        textContent.textContent = 'Waiting for OCR result...';
        textContent.className = 'text-content empty';
        
        if (!this.currentImageData) {
            this.showImagePlaceholder();
        }
        
        this.updateStatus('Text cleared');
    }
    
    /**
     * Clear image
     */
    clearImage() {
        this.currentImageData = null;
        this.showImagePlaceholder();
        this.updateStatus('Image cleared');
    }
    
    // ============================================================================
    // PROCESSING FUNCTIONS
    // ============================================================================
    
    /**
     * Prepare for processing
     */
    prepareForProcessing() {
        this.isProcessing = true;
        this.showLoading();
        this.clearImageContainer();
        this.addToImageContainer(this.getElement('imageLoading'));
        this.resetTextContent();
        this.clearErrorMessages();
    }
    
    /**
     * Reset text content for processing
     */
    resetTextContent() {
        const textContent = this.getElement('textContent');
        if (textContent) {
            textContent.textContent = 'Waiting for OCR result...';
            textContent.className = 'text-content empty';
        }
    }
    
    /**
     * Set processing text
     * @param {string} text - Processing text
     */
    setProcessingText(text) {
        const textContent = this.getElement('textContent');
        if (textContent) {
            textContent.textContent = text;
            textContent.className = 'text-content empty';
        }
    }
    
    /**
     * Finish processing
     */
    finishProcessing() {
        this.isProcessing = false;
    }
    
    // ============================================================================
    // SCREENSHOT FUNCTIONS
    // ============================================================================
    
    /**
     * Take screenshot and perform OCR (separately)
     */
    async Screenshot() {
        this.updateStatus('Taking screenshot...');
        this.prepareForProcessing();
        this.setProcessingText('Waiting for OCR result...');

        window.otools.hideWindow();
        let imageData = null;
        try {
            // Only capture screenshot, do not perform OCR yet
            const result = await window.otools.captureScreen();
            if (result && result.imageData) {
                imageData = result.imageData;
                if (imageData instanceof Uint8Array || (typeof Buffer !== 'undefined' && imageData instanceof Buffer)) {
                    if (typeof Buffer !== 'undefined' && imageData instanceof Buffer) {
                        imageData = imageData.toString('base64');
                    } else {
                        // 浏览器环境
                        const binaryString = Array.from(imageData, byte => String.fromCharCode(byte)).join('');
                        imageData = btoa(binaryString);
                    }
                }

                if (typeof imageData === 'string' && !imageData.startsWith('data:')) {
                    imageData = 'data:image/png;base64,' + imageData;
                }
                // Show window and image immediately
                setTimeout(() => window.otools.showWindow(), 100);
                this.displayImageFromDataUrl(imageData);
                this.currentImageData = imageData;
                this.setProcessingText('Waiting for OCR result...');
                this.updateStatus('Recognizing text...');
            } else {
                setTimeout(() => window.otools.showWindow(), 100);
                this.displayError('No valid screenshot obtained');
                this.finishProcessing();
                return;
            }
        } catch (e) {
            setTimeout(() => window.otools.showWindow(), 100);
            this.displayError('Screenshot failed: ' + e.message);
            this.finishProcessing();
            return;
        }

        // Perform OCR asynchronously
        try {
            const ocrResult = await window.otools.performOcr(imageData);
            if (ocrResult && ocrResult.text) {
                this.displayText(ocrResult.text);
                this.updateStatus('Recognition complete');
            } else {
                this.displayText('');
                this.updateStatus('No text found in image');
            }
        } catch (e) {
            this.displayError('OCR failed: ' + e.message);
            this.updateStatus('Recognition failed');
        } finally {
            this.finishProcessing();
        }
    }
    
    /**
     * Load file and perform OCR
     */
    async loadFileAndOcr() {
        try {
            const result = await window.otools.showOpenDialog({
                properties: ['openFile'],
                filters: [
                    { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'tiff'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });
            
            if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
                this.updateStatus('File selection cancelled');
                return;
            }
            
            const filePath = result.filePaths[0];
            this.updateStatus('Loading file...');
            this.prepareForProcessing();
            this.setProcessingText('Processing file...');
            
            const fileData = await window.otools.readFile(filePath);
            console.log('File data received:', fileData);
            console.log('File data type:', typeof fileData);
            
            if (!fileData || !fileData.success) {
                throw new Error('Failed to read file');
            }
            
            const imageData = this.processFileData(fileData, filePath);
            this.displayImageFromDataUrl(imageData);
            this.currentImageData = imageData;
            
            this.updateStatus('Performing OCR...');
            const ocrResult = await window.otools.performOcr(imageData);
            
            if (ocrResult && ocrResult.text) {
                this.displayText(ocrResult.text);
                this.updateStatus('OCR completed');
            } else {
                this.displayText('');
                this.updateStatus('No text found in image');
            }
            
        } catch (e) {
            console.error('File OCR failed:', e);
            this.displayError('File OCR failed: ' + e.message);
            this.updateStatus('OCR failed');
        } finally {
            this.finishProcessing();
        }
    }
    
    /**
     * Process file data
     * @param {Object} fileData - File data
     * @param {string} filePath - File path
     * @returns {string} Processed image data
     */
    processFileData(fileData, filePath) {
        if (fileData.content && fileData.content.startsWith('data:')) {
            console.log('File data is already a data URL');
            return fileData.content;
        }
        
        let base64Data;
        if (typeof Buffer !== 'undefined') {
            base64Data = Buffer.from(fileData.content || fileData).toString('base64');
        } else {
            const arrayBuffer = new Uint8Array(fileData.content || fileData);
            const binaryString = Array.from(arrayBuffer, byte => String.fromCharCode(byte)).join('');
            base64Data = btoa(binaryString);
        }
        
        const mimeType = this.getMimeType(filePath);
        const imageData = `data:${mimeType};base64,${base64Data}`;
        console.log('Converted to data URL, length:', imageData.length);
        
        return imageData;
    }
    
    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================
    
    /**
     * Update status
     * @param {string} message - Status message
     * @param {string} className - CSS class
     */
    updateStatus(message, className = '') {
        const statusText = this.getElement('statusText');
        if (statusText) {
            statusText.style.opacity = '0.7';
            statusText.textContent = message;
            statusText.className = className;
            
            setTimeout(() => {
                statusText.style.opacity = '1';
            }, 150);
            
            console.log('Status updated:', message);
        } else {
            console.error('statusText element not found');
        }
    }
    
    /**
     * Update timestamp
     */
    updateTimestamp() {
        const timestamp = this.getElement('timestamp');
        if (timestamp) {
            timestamp.textContent = new Date().toLocaleString('en-US');
        }
    }
}

// ============================================================================
// INITIALIZE PLUGIN
// ============================================================================

// Create global plugin instance
window.ocrPlugin = new OCRPlugin();

// Expose methods to global scope for HTML onclick handlers
window.Screenshot = () => window.ocrPlugin.Screenshot();
window.loadFileAndOcr = () => window.ocrPlugin.loadFileAndOcr();
window.copyText = () => window.ocrPlugin.copyText();
window.copyImage = () => window.ocrPlugin.copyImage();
window.saveImage = () => window.ocrPlugin.saveImage();
window.clearText = () => window.ocrPlugin.clearText();
window.clearImage = () => window.ocrPlugin.clearImage();