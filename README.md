# Mixed Text Converter (Bidi Fixer)

A lightweight, zero-dependency web tool that fixes bidirectional (BiDi) text rendering. It uses invisible Unicode control characters to ensure mixed Persian/English (RTL/LTR) text displays correctly on unsupported platforms.

## ✨ Features

- **Converter:** Automatically detects line direction and wraps text with `RLE` or `LRE` embeddings.
- **Cleaner:** Removes all invisible BiDi control characters (`U+202A` to `U+202E`).
- **UI/UX:** Fluid 3D flip animation, dark mode, and fully keyboard accessible.
- **Copy to Clipboard:** One-click copy with ARIA feedback.
- **Zero Dependencies:** Pure HTML, CSS, and Vanilla JavaScript.

## 🚀 Usage

You can use it directly online or run it locally:

- **Online:** Visit [https://mehrazino.github.io/bidi/](https://mehrazino.github.io/bidi/)
- **Locally:** Download or clone the repository and open `index.html` in your browser.

**Privacy:** This tool runs entirely in your browser. No data is ever sent to any server.

## 🧠 How It Works

The script scans each line for the first strong character (Persian/Arabic for RTL, Latin for LTR) and wraps the line in Unicode direction embeddings (`RLE`/`LRE` + `PDF`) to force correct rendering.
