/* ============================================================
   Mixed Text Converter — script.js (final)
   ------------------------------------------------------------
   Responsibilities:
     - Light / dark theme with localStorage + system preference
     - 3D page flip between converter (front) and cleaner (back),
       with `inert` management so only one page is reachable
     - Live bidirectional text conversion (per line) using
       RLE / LRE / PDF Unicode control characters
     - Cleaner that strips every BiDi control character
     - Copy-to-clipboard with visual + ARIA feedback
     - Keyboard activation on the focusable output boxes
   ============================================================ */

(function () {
    'use strict';

    /* ------------------------------------------------------------------
       Unicode BiDi control constants
       ------------------------------------------------------------------ */
    const RLE = '\u202B'; // Right-to-Left Embedding
    const LRE = '\u202A'; // Left-to-Right Embedding
    const PDF = '\u202C'; // Pop Directional Formatting

    // Every BiDi control we know of — used by the cleaner
    const BIDI_RE =
        /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

    // Strong characters that decide a line's base direction
    const RTL_STRONG_RE =
        /[\u0590-\u05FF\u0600-\u06FF\u0700-\u07BF\u07C0-\u07FF\u0800-\u083F\u0840-\u085F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
    const LTR_STRONG_RE =
        /[A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u0530-\u058F]/;

    /* ------------------------------------------------------------------
       DOM references
       ------------------------------------------------------------------ */
    const $ = (id) => document.getElementById(id);

    const pageWrapper   = $('pageWrapper');
    const converterPage = $('converterPage');
    const cleanerPage   = $('cleanerPage');

    const inputText  = $('inputText');
    const inputText2 = $('inputText2');
    const outputBox  = $('outputBox');
    const outputBox2 = $('outputBox2');

    const copyBtn    = $('copyBtn');
    const copyBtn2   = $('copyBtn2');
    const cleanerBtn = $('cleanerBtn');
    const backBtn    = $('backBtn');

    const themeBtns = [$('themeBtn'), $('themeBtn2')].filter(Boolean);
    const sunIcons  = [$('sunIcon'),  $('sunIcon2')].filter(Boolean);
    const moonIcons = [$('moonIcon'), $('moonIcon2')].filter(Boolean);

    /* ------------------------------------------------------------------
       Hidden live region for screen-reader announcements
       ------------------------------------------------------------------ */
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.cssText =
        'position:absolute;width:1px;height:1px;padding:0;margin:-1px;' +
        'overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);' +
        'white-space:nowrap;border:0;';
    document.body.appendChild(liveRegion);

    function announce(message) {
        liveRegion.textContent = '';
        requestAnimationFrame(() => { liveRegion.textContent = message; });
    }

    /* ==================================================================
       1. Theme
       ================================================================== */
    const THEME_KEY = 'mixedTextConverter.theme';
    let themeMetaEl = null;

    function applyTheme(isDark) {
        document.body.classList.toggle('dark', isDark);

        themeBtns.forEach((btn) => {
            btn.setAttribute('aria-pressed', String(isDark));
            btn.setAttribute(
                'aria-label',
                isDark ? 'غیرفعال کردن حالت تاریک' : 'فعال کردن حالت تاریک'
            );
        });

        sunIcons.forEach((el)  => { el.style.display = isDark ? 'none' : ''; });
        moonIcons.forEach((el) => { el.style.display = isDark ? '' : 'none'; });

        // Keep the mobile browser chrome in sync
        if (!themeMetaEl) {
            themeMetaEl = document.querySelector('meta[name="theme-color"]');
            if (!themeMetaEl) {
                themeMetaEl = document.createElement('meta');
                themeMetaEl.name = 'theme-color';
                document.head.appendChild(themeMetaEl);
            }
        }
        themeMetaEl.content = isDark ? '#0f172a' : '#fafafa';
    }

    function toggleTheme() {
        const isDark = !document.body.classList.contains('dark');
        applyTheme(isDark);
        try {
            localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
        } catch (_) { /* storage may be unavailable */ }
    }

    function initTheme() {
        let saved = null;
        try { saved = localStorage.getItem(THEME_KEY); } catch (_) {}

        let isDark;
        if (saved === 'dark') {
            isDark = true;
        } else if (saved === 'light') {
            isDark = false;
        } else {
            isDark = !!(window.matchMedia &&
                window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        applyTheme(isDark);
    }

    themeBtns.forEach((btn) => btn.addEventListener('click', toggleTheme));

    /* ==================================================================
       2. Page flip
       ================================================================== */
    function setPage(isCleaner) {
        pageWrapper.classList.toggle('flipped', isCleaner);

        // Exactly one page is in the tab order and the a11y tree
        converterPage.toggleAttribute('inert', isCleaner);
        cleanerPage.toggleAttribute('inert', !isCleaner);

        // Move focus into the newly active page
        const focusTarget = isCleaner ? inputText2 : inputText;
        if (focusTarget) focusTarget.focus({ preventScroll: true });
    }

    cleanerBtn.addEventListener('click', () => setPage(true));
    backBtn.addEventListener('click', () => setPage(false));

    /* ==================================================================
       3. Conversion / cleaning
       ================================================================== */

    /**
     * Return the direction of the first "strong" character in a line.
     * BiDi control characters already present are skipped so the
     * operation is idempotent when the user re-processes an output.
     * @returns {'RTL' | 'LTR' | null}
     */
    function detectLineDirection(line) {
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];

            if (
                ch === '\u061C' || ch === '\u200E' || ch === '\u200F' ||
                (ch >= '\u202A' && ch <= '\u202E') ||
                (ch >= '\u2066' && ch <= '\u2069')
            ) {
                continue;
            }

            const code = ch.charCodeAt(0);

            // Fast path for ASCII: only A–Z / a–z are "strong"
            if (code < 0x80) {
                if ((code >= 0x41 && code <= 0x5A) ||
                    (code >= 0x61 && code <= 0x7A)) {
                    return 'LTR';
                }
                continue;
            }

            if (RTL_STRONG_RE.test(ch)) return 'RTL';
            if (LTR_STRONG_RE.test(ch)) return 'LTR';
        }
        return null;
    }

    /**
     * Wrap a single line in the correct directional embedding:
     *   RTL first strong → RLE … PDF
     *   LTR first strong → LRE … PDF
     *   No strong char   → unchanged
     */
    function convertLine(line) {
        if (!line) return line;
        const dir = detectLineDirection(line);
        if (dir === 'RTL') return RLE + line + PDF;
        if (dir === 'LTR') return LRE + line + PDF;
        return line;
    }

    function convertText(text) {
        if (!text) return '';
        return text.split('\n').map(convertLine).join('\n');
    }

    function cleanText(text) {
        if (!text) return '';
        return text.replace(BIDI_RE, '');
    }

    /* ==================================================================
       4. Rendering with placeholder
       ================================================================== */
    function renderOutput(box, text, emptyMessage) {
        if (!text) {
            box.textContent = '';
            const span = document.createElement('span');
            span.className = 'placeholder';
            span.textContent = emptyMessage;
            box.appendChild(span);
            return;
        }
        // Plain textContent — safe against HTML injection
        box.textContent = text;
    }

    function readOutput(box) {
        // A box showing only the placeholder has no real content
        if (box.querySelector(':scope > .placeholder')) return '';
        return box.textContent;
    }

    function updateConverted() {
        renderOutput(
            outputBox,
            convertText(inputText.value),
            'خروجی اینجا نمایش داده می‌شود...'
        );
    }

    function updateCleaned() {
        renderOutput(
            outputBox2,
            cleanText(inputText2.value),
            'خروجی اینجا نمایش داده می‌شود...'
        );
    }

    inputText.addEventListener('input', updateConverted);
    inputText2.addEventListener('input', updateCleaned);

    /* ==================================================================
       5. Copy to clipboard
       ================================================================== */
    const COPY_FEEDBACK_MS = 1400;

    async function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (_) { /* fall through to legacy path */ }
        }

        // Legacy fallback for insecure contexts or older browsers
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.cssText =
                'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;';
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(ta);
            return ok;
        } catch (_) {
            return false;
        }
    }

    // Preserve base label and cancel pending restore per button
    const baseLabels    = new WeakMap();
    const restoreTimers = new WeakMap();

    async function copyAndFlash(box, button) {
        const text = readOutput(box);
        if (!text) {
            announce('چیزی برای کپی کردن وجود ندارد');
            return;
        }

        if (!baseLabels.has(button)) {
            baseLabels.set(button, button.textContent);
        }

        const pending = restoreTimers.get(button);
        if (pending) clearTimeout(pending);

        const ok = await copyToClipboard(text);

        if (ok) {
            button.textContent = 'کپی شد ✅';
            button.classList.add('btn-success');
            announce('خروجی با موفقیت کپی شد');
        } else {
            button.textContent = 'خطا در کپی';
            announce('کپی خروجی ناموفق بود');
        }

        const timerId = setTimeout(() => {
            button.textContent = baseLabels.get(button);
            button.classList.remove('btn-success');
            restoreTimers.delete(button);
        }, COPY_FEEDBACK_MS);

        restoreTimers.set(button, timerId);
    }

    copyBtn.addEventListener('click',  () => copyAndFlash(outputBox,  copyBtn));
    copyBtn2.addEventListener('click', () => copyAndFlash(outputBox2, copyBtn2));

    // Clicking the box itself, or pressing Enter/Space while focused on it,
    // also copies — matching the `cursor: copy` affordance in CSS.
    function wireOutputCopy(box, button) {
        box.addEventListener('click', () => copyAndFlash(box, button));
        box.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                copyAndFlash(box, button);
            }
        });
    }
    wireOutputCopy(outputBox,  copyBtn);
    wireOutputCopy(outputBox2, copyBtn2);

    /* ==================================================================
       6. Initialisation
       ================================================================== */
    initTheme();

    // Front page active, back page inert by default
    converterPage.removeAttribute('inert');
    cleanerPage.setAttribute('inert', '');
    pageWrapper.classList.remove('flipped');

    // Re-run conversion only if the browser restored textarea content
    if (inputText.value)  updateConverted();
    if (inputText2.value) updateCleaned();
})();
