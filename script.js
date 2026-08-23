// ========== DOM Elements ==========
const inputEl = document.getElementById('inputText');
const outputBox = document.getElementById('outputBox');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');

// ========== Unicode Control Characters ==========
const RLE = '\u202B'; // RIGHT-TO-LEFT EMBEDDING
const LRE = '\u202A'; // LEFT-TO-RIGHT EMBEDDING
const PDF = '\u202C'; // POP DIRECTIONAL FORMATTING

// ========== Helper Functions ==========

/**
 * Check if character is RTL (Persian, Arabic, Hebrew)
 * @param {string} char - Single character to check
 * @returns {boolean} True if character is RTL
 */
function isRTLChar(char) {
    if (!char) return false;
    const code = char.charCodeAt(0);
    return (
        (code >= 0x0590 && code <= 0x05FF) || // Hebrew
        (code >= 0x0600 && code <= 0x06FF) || // Arabic
        (code >= 0x0750 && code <= 0x077F) || // Arabic Supplement
        (code >= 0x08A0 && code <= 0x08FF) || // Arabic Extended-A
        (code >= 0xFB50 && code <= 0xFDFF) || // Arabic Presentation Forms-A
        (code >= 0xFE70 && code <= 0xFEFF)    // Arabic Presentation Forms-B
    );
}

/**
 * Check if character is a Persian digit (۰-۹)
 * @param {string} char - Single character to check
 * @returns {boolean} True if character is a Persian digit
 */
function isPersianDigit(char) {
    if (!char) return false;
    const code = char.charCodeAt(0);
    return code >= 0x06F0 && code <= 0x06F9;
}

/**
 * Check if character is LTR (Latin, numbers, common symbols)
 * @param {string} char - Single character to check
 * @returns {boolean} True if character is LTR
 */
function isLTRChar(char) {
    if (!char) return false;
    const code = char.charCodeAt(0);
    
    return (
        (code >= 0x20 && code <= 0x7E) ||    // Basic Latin
        (code >= 0xA0 && code <= 0xFF) ||    // Latin-1 Supplement
        (code >= 0x100 && code <= 0x17F) ||  // Latin Extended-A
        (code >= 0x180 && code <= 0x24F) ||  // Latin Extended-B
        (code >= 0x2000 && code <= 0x206F) || // General Punctuation
        (code >= 0x20A0 && code <= 0x20CF) || // Currency Symbols
        (code >= 0x2100 && code <= 0x214F) || // Letterlike Symbols
        (code >= 0x2190 && code <= 0x21FF) || // Arrows
        (code >= 0x2200 && code <= 0x22FF) || // Mathematical Operators
        (code >= 0x2300 && code <= 0x23FF)    // Miscellaneous Technical
    );
}

/**
 * Check if character is whitespace
 * @param {string} char - Single character to check
 * @returns {boolean} True if character is whitespace
 */
function isWhitespace(char) {
    return char === ' ' || char === '\t' || char === '\n' || char === '\r';
}

/**
 * Determine if a string is LTR (contains LTR chars and no RTL chars)
 * @param {string} str - String to check
 * @returns {boolean} True if string is LTR
 */
function isLTRString(str) {
    let hasLTR = false;
    let hasRTL = false;
    
    for (let char of str) {
        if (isLTRChar(char) && !isWhitespace(char)) {
            hasLTR = true;
        } else if (isRTLChar(char) || isPersianDigit(char)) {
            hasRTL = true;
        }
    }
    
    return hasLTR && !hasRTL;
}

/**
 * Normalize text by wrapping LTR segments with directional markers
 * @param {string} input - Raw input text
 * @returns {string} Normalized text with Unicode control characters
 */
function normalizeText(input) {
    if (!input) return '';
    
    // Split into lines
    const lines = input.split('\n');
    
    // Process each line
    const processedLines = lines.map(line => {
        if (!line.trim()) return '';
        
        // Split line into words and spaces
        const parts = line.split(/(\s+)/);
        
        // Wrap LTR words with LRE and PDF
        const processedParts = parts.map(part => {
            if (!part) return part;
            if (part.trim() === '') return part;
            
            if (isLTRString(part)) {
                return LRE + part + PDF;
            }
            
            return part;
        });
        
        // Join parts and wrap entire line with RLE and PDF
        let processedLine = processedParts.join('');
        return RLE + processedLine + PDF;
    });
    
    return processedLines.join('\n');
}

/**
 * Update output display
 */
function updateOutput() {
    const rawInput = inputEl.value;
    const normalized = normalizeText(rawInput);
    
    // Update output display
    if (normalized) {
        outputBox.textContent = normalized;
    } else {
        outputBox.innerHTML = '<span class="placeholder">خروجی اینجا نمایش داده می‌شود...</span>';
    }
}

/**
 * Show success state on copy button
 */
function showCopySuccess() {
    copyBtn.textContent = 'کپی شد';
    copyBtn.classList.add('btn-success');
    
    // Revert after 1.5 seconds
    setTimeout(() => {
        copyBtn.textContent = 'کپی خروجی';
        copyBtn.classList.remove('btn-success');
    }, 1500);
}

/**
 * Copy normalized output to clipboard
 */
function copyOutput() {
    const normalizedText = outputBox.textContent;
    if (!normalizedText || outputBox.querySelector('.placeholder')) return;
    
    navigator.clipboard.writeText(normalizedText).then(() => {
        showCopySuccess();
    }).catch(err => {
        alert('خطا در کپی: ' + err);
    });
}

/**
 * Clear both input and output
 */
function clearAll() {
    inputEl.value = '';
    outputBox.innerHTML = '<span class="placeholder">خروجی اینجا نمایش داده می‌شود...</span>';
    inputEl.focus();
}

// ========== Event Listeners ==========
inputEl.addEventListener('input', updateOutput);
copyBtn.addEventListener('click', copyOutput);
clearBtn.addEventListener('click', clearAll);

// Copy when clicking on output box
outputBox.addEventListener('click', copyOutput);

// ========== Initialize ==========
updateOutput();
