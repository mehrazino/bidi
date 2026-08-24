// ==========================================
// DOM Elements
// ==========================================
const pageWrapper = document.getElementById('pageWrapper');
const inputText = document.getElementById('inputText');
const outputBox = document.getElementById('outputBox');
const copyBtn = document.getElementById('copyBtn');
const themeBtn = document.getElementById('themeBtn');
const sunIcon = document.getElementById('sunIcon');
const moonIcon = document.getElementById('moonIcon');
const inputText2 = document.getElementById('inputText2');
const outputBox2 = document.getElementById('outputBox2');
const copyBtn2 = document.getElementById('copyBtn2');
const themeBtn2 = document.getElementById('themeBtn2');
const sunIcon2 = document.getElementById('sunIcon2');
const moonIcon2 = document.getElementById('moonIcon2');
const backBtn = document.getElementById('backBtn');
const cleanerBtn = document.getElementById('cleanerBtn');

// ==========================================
// Unicode Control Characters
// ==========================================
const RLE = '\u202B'; // RIGHT-TO-LEFT EMBEDDING
const LRE = '\u202A'; // LEFT-TO-RIGHT EMBEDDING
const PDF = '\u202C'; // POP DIRECTIONAL FORMATTING
const LRM = '\u200E'; // LEFT-TO-RIGHT MARK
const RLM = '\u200F'; // RIGHT-TO-LEFT MARK
const LRI = '\u2066'; // LEFT-TO-RIGHT ISOLATE
const RLI = '\u2067'; // RIGHT-TO-LEFT ISOLATE
const PDI = '\u2069'; // POP DIRECTIONAL ISOLATE
const LRO = '\u202D'; // LEFT-TO-RIGHT OVERRIDE
const RLO = '\u202E'; // RIGHT-TO-LEFT OVERRIDE

// ==========================================
// Sets
// ==========================================
// Bracket characters to skip during LTR detection
const BRACKETS = new Set(['(', ')', '[', ']', '{', '}', '<', '>']);

// Bidirectional control characters for cleanup
const CTRL_CHARS = new Set([RLE, LRE, PDF, LRM, RLM, LRI, RLI, PDI, LRO, RLO]);

// ==========================================
// Helper Functions
// ==========================================

/**
 * Check if character is RTL (Persian, Arabic, Hebrew, Persian digits)
 * @param {string} char - Single character
 * @returns {boolean}
 */
function isRTLChar(char) {
    const code = char.charCodeAt(0);
    return (
        (code >= 0x0590 && code <= 0x05FF) || // Hebrew
        (code >= 0x0600 && code <= 0x06FF) || // Arabic
        (code >= 0x0750 && code <= 0x077F) || // Arabic Supplement
        (code >= 0x08A0 && code <= 0x08FF) || // Arabic Extended-A
        (code >= 0xFB50 && code <= 0xFDFF) || // Arabic Presentation Forms-A
        (code >= 0x06F0 && code <= 0x06F9)    // Persian digits
    );
}

/**
 * Check if string contains any RTL character
 * @param {string} str
 * @returns {boolean}
 */
function hasRTLChar(str) {
    for (const char of str) {
        if (isRTLChar(char)) return true;
    }
    return false;
}

/**
 * Check if string is pure LTR (no RTL chars, at least one LTR char)
 * @param {string} str
 * @returns {boolean}
 */
function isPureLTR(str) {
    let hasLTR = false;
    let hasRTL = false;

    for (const char of str) {
        // Skip brackets
        if (BRACKETS.has(char)) continue;

        if (isRTLChar(char)) {
            hasRTL = true;
        } else {
            const code = char.charCodeAt(0);
            if (code >= 0x21 && code <= 0x7E) {
                hasLTR = true;
            }
        }
    }

    return hasLTR && !hasRTL;
}

/**
 * Process a single token
 * @param {string} token
 * @returns {string}
 */
function processToken(token) {
    if (!token) return token;
    if (isPureLTR(token)) return LRE + token + PDF;
    return token;
}

/**
 * Normalize text by wrapping LTR segments with directional markers
 * @param {string} input
 * @returns {string}
 */
function normalizeText(input) {
    if (!input) return '';

    return input.split('\n').map(line => {
        if (!line.trim()) return '';

        // Determine line direction
        const direction = hasRTLChar(line) ? RLE : LRE;

        // Split by spaces and process each token
        const parts = line.split(/(\s+)/);
        const processed = parts.map(part => {
            if (!part || part.trim() === '') return part;
            return processToken(part);
        });

        return direction + processed.join('') + PDF;
    }).join('\n');
}

/**
 * Clean bidirectional control characters from text
 * @param {string} input
 * @returns {string}
 */
function cleanText(input) {
    let result = '';
    for (const char of input) {
        if (!CTRL_CHARS.has(char)) {
            result += char;
        }
    }
    return result;
}

// ==========================================
// Update Functions
// ==========================================

/**
 * Update converter output
 */
function updateConverter() {
    const normalized = normalizeText(inputText.value);
    if (normalized) {
        outputBox.textContent = normalized;
    } else {
        outputBox.innerHTML = '<span class="placeholder">خروجی اینجا نمایش داده می‌شود...</span>';
    }
}

/**
 * Update cleaner output
 */
function updateCleaner() {
    const cleaned = cleanText(inputText2.value);
    if (cleaned) {
        outputBox2.textContent = cleaned;
    } else {
        outputBox2.innerHTML = '<span class="placeholder">خروجی اینجا نمایش داده می‌شود...</span>';
    }
}

// ==========================================
// Copy Function
// ==========================================

/**
 * Copy text to clipboard with visual feedback
 * @param {HTMLElement} box - Output box element
 * @param {HTMLElement} button - Copy button element
 */
function copyText(box, button) {
    const text = box.textContent;
    if (!text || box.querySelector('.placeholder')) return;

    navigator.clipboard.writeText(text).then(() => {
        button.textContent = 'کپی شد!';
        button.classList.add('btn-success');

        setTimeout(() => {
            button.textContent = 'کپی خروجی';
            button.classList.remove('btn-success');
        }, 1500);
    }).catch(() => {});
}

// ==========================================
// Theme Toggle
// ==========================================

/**
 * Toggle dark/light theme
 */
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');

    sunIcon.style.display = isDark ? 'none' : 'block';
    moonIcon.style.display = isDark ? 'block' : 'none';
    sunIcon2.style.display = isDark ? 'none' : 'block';
    moonIcon2.style.display = isDark ? 'block' : 'none';

    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// ==========================================
// Page Flip
// ==========================================

/**
 * Flip page (clockwise)
 */
function flipPage() {
    pageWrapper.classList.toggle('flipped');
}

// ==========================================
// Event Listeners
// ==========================================

// Page flip buttons
cleanerBtn.addEventListener('click', flipPage);
backBtn.addEventListener('click', flipPage);

// Copy buttons
copyBtn.addEventListener('click', () => copyText(outputBox, copyBtn));
outputBox.addEventListener('click', () => copyText(outputBox, copyBtn));

copyBtn2.addEventListener('click', () => copyText(outputBox2, copyBtn2));
outputBox2.addEventListener('click', () => copyText(outputBox2, copyBtn2));

// Input events
inputText.addEventListener('input', updateConverter);
inputText2.addEventListener('input', updateCleaner);

// Theme toggle buttons
themeBtn.addEventListener('click', toggleTheme);
themeBtn2.addEventListener('click', toggleTheme);

// ==========================================
// Load Saved Theme
// ==========================================
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
    sunIcon2.style.display = 'none';
    moonIcon2.style.display = 'block';
}

// ==========================================
// Initialize
// ==========================================
updateConverter();
updateCleaner();
