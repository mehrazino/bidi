// ========== DOM Elements ==========
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

// ========== Unicode Control Characters ==========
const RLE = '\u202B';
const LRE = '\u202A';
const PDF = '\u202C';
const LRM = '\u200E';
const RLM = '\u200F';
const LRI = '\u2066';
const RLI = '\u2067';
const PDI = '\u2069';
const LRO = '\u202D';
const RLO = '\u202E';

// ========== Sets ==========
const BRACKETS = new Set(['(', ')', '[', ']', '{', '}', '<', '>']);
const CTRL_CHARS = new Set([RLE, LRE, PDF, LRM, RLM, LRI, RLI, PDI, LRO, RLO]);

// ========== Helper Functions ==========
function isRTLChar(char) {
    const code = char.charCodeAt(0);
    return (
        (code >= 0x0590 && code <= 0x05FF) ||
        (code >= 0x0600 && code <= 0x06FF) ||
        (code >= 0x0750 && code <= 0x077F) ||
        (code >= 0x08A0 && code <= 0x08FF) ||
        (code >= 0xFB50 && code <= 0xFDFF) ||
        (code >= 0x06F0 && code <= 0x06F9)
    );
}

function hasRTLChar(str) {
    for (const char of str) {
        if (isRTLChar(char)) return true;
    }
    return false;
}

function isPureLTR(str) {
    let hasLTR = false;
    let hasRTL = false;

    for (const char of str) {
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

function processToken(token) {
    if (!token) return token;
    if (isPureLTR(token)) return LRE + token + PDF;
    return token;
}

function normalizeText(input) {
    if (!input) return '';

    return input.split('\n').map(line => {
        if (!line.trim()) return '';

        const direction = hasRTLChar(line) ? RLE : LRE;
        const parts = line.split(/(\s+)/);

        const processed = parts.map(part => {
            if (!part || part.trim() === '') return part;
            return processToken(part);
        });

        return direction + processed.join('') + PDF;
    }).join('\n');
}

function cleanText(input) {
    let result = '';
    for (const char of input) {
        if (!CTRL_CHARS.has(char)) {
            result += char;
        }
    }
    return result;
}

// ========== Update Functions ==========
function updateConverter() {
    const normalized = normalizeText(inputText.value);
    if (normalized) {
        outputBox.textContent = normalized;
    } else {
        outputBox.innerHTML = '<span class="placeholder">خروجی اینجا نمایش داده می‌شود...</span>';
    }
}

function updateCleaner() {
    const cleaned = cleanText(inputText2.value);
    if (cleaned) {
        outputBox2.textContent = cleaned;
    } else {
        outputBox2.innerHTML = '<span class="placeholder">خروجی اینجا نمایش داده می‌شود...</span>';
    }
}

// ========== Copy Function ==========
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

// ========== Theme Toggle ==========
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');

    sunIcon.style.display = isDark ? 'none' : 'block';
    moonIcon.style.display = isDark ? 'block' : 'none';
    sunIcon2.style.display = isDark ? 'none' : 'block';
    moonIcon2.style.display = isDark ? 'block' : 'none';

    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// ========== Page Flip ==========
function flipPage() {
    pageWrapper.classList.toggle('flipped');
}

// ========== Event Listeners ==========
cleanerBtn.addEventListener('click', flipPage);
backBtn.addEventListener('click', flipPage);

copyBtn.addEventListener('click', () => copyText(outputBox, copyBtn));
outputBox.addEventListener('click', () => copyText(outputBox, copyBtn));

copyBtn2.addEventListener('click', () => copyText(outputBox2, copyBtn2));
outputBox2.addEventListener('click', () => copyText(outputBox2, copyBtn2));

inputText.addEventListener('input', updateConverter);
inputText2.addEventListener('input', updateCleaner);

themeBtn.addEventListener('click', toggleTheme);
themeBtn2.addEventListener('click', toggleTheme);

// ========== Load Saved Theme ==========
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
    sunIcon2.style.display = 'none';
    moonIcon2.style.display = 'block';
}

// ========== Initialize ==========
updateConverter();
updateCleaner();
