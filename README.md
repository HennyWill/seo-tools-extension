# SEO Tools - Chrome Extension

**Version 1.0.0** | Modern SEO toolkit by HennyWill

A powerful and modern Chrome extension for SEO professionals and web developers. Quick access to analysis tools and popular SEO services with a beautiful, themeable interface.

---

## ✨ Features

### 🔍 Analysis Tools
- **Check Indexability** - Verify robots.txt rules, meta tags, and canonical URLs
- **Check Schema Markup** - Test structured data with Google Rich Results
- **Copy All Headings** - Extract H1-H6 headings for content analysis
- **Copy All Links** - Extract all external links from the page
- **Highlight All Links** - Visually highlight all links on the page

### 🌐 External Services Integration
- **Google Search** - Find the current page in Google search results
- **Google Search Console** - Open page analytics directly
- **Ahrefs** - View site/page analysis
- **Ahrefs Backlinks** - Access backlink report with pre-configured filters
- **Archive.org** - Check page history on Wayback Machine

### 🎨 Modern UI/UX
- ✅ Light & Dark theme support
- ✅ Auto theme detection (system preference)
- ✅ Toast notifications instead of alerts
- ✅ Loading indicators for async operations
- ✅ SVG icons for all buttons
- ✅ Smooth animations and transitions
- ✅ Categorized tool sections
- ✅ Glassmorphism effects
- ✅ Gradient accents

### ⌨️ Keyboard Shortcuts
- `Ctrl+Shift+H` - Copy all headings
- `Ctrl+Shift+L` - Highlight all links
- `Ctrl+Shift+I` - Check indexability
- `Ctrl+Shift+T` - Toggle theme

---

## 🚀 Installation

### From Source
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the extension folder

### From Chrome Web Store
*(Coming soon)*

---

## 📖 Usage

1. Click the extension icon in your browser toolbar
2. Select any tool from the categorized sections
3. Use keyboard shortcuts for quick access to common tools
4. Toggle between light/dark themes with the moon icon

---

## 🛠️ Technical Details

### Technologies
- **Manifest V3** - Latest Chrome Extension API
- **ES6+ JavaScript** - Modern async/await, modules
- **CSS Variables** - Dynamic theming system
- **Fetch API** - Modern HTTP requests
- **SVG Icons** - Scalable vector graphics
- **LocalStorage** - Theme preference persistence

### Architecture
```
/seo/
├── manifest.json           # Extension configuration
├── popup.html              # Main UI with SVG icons
├── popup.css               # Modern styles with theme support
├── popup.js                # Refactored ES6+ code
├── popup/utils/
│   ├── url.js             # URL utility functions
│   └── ui.js              # Toast & loading utilities
└── scripts/                # Content scripts
    ├── checkIndexability.js
    ├── copyHeadings.js
    ├── copyLinks.js
    ├── getLinkUrls.js
    └── highlightLinks.js
```

### Code Improvements (v1.0)
- ✅ Refactored from `var` to `const/let`
- ✅ Replaced XMLHttpRequest with `fetch()`
- ✅ Added comprehensive error handling
- ✅ Implemented async/await throughout
- ✅ Removed unused background.js
- ✅ Created modular utility system
- ✅ Added toast notification system
- ✅ Implemented loading states
- ✅ Added keyboard shortcuts
- ✅ Created theme system

---

## 🎨 Theme System

The extension supports three theme modes:
- **Light** - Clean, bright interface
- **Dark** - Eye-friendly dark mode
- **Auto** - Follows system preference (default)

Themes use CSS variables for instant switching without page reload.

---

## 🔒 Permissions

This extension requires minimal permissions:
- `activeTab` - Access the current tab's URL and DOM
- `scripting` - Execute content scripts for analysis

**No data collection. No tracking. Privacy-focused.**

---

## 🤝 Support

If you find this extension useful, consider supporting the developer:

☕ [Buy me a coffee](https://www.buymeacoffee.com/hennywill)

---

## 📝 Changelog

### Version 1.0.0 (December 2025)
- 🎨 Complete UI/UX redesign with modern interface
- 🌓 Added dark theme support with auto-detection
- ⌨️ Implemented keyboard shortcuts
- 🔔 Replaced alerts with toast notifications
- ⚡ Added loading indicators for async operations
- 📂 Organized tools into categories
- 🎯 Added SVG icons for all buttons
- 💅 Implemented glassmorphism and gradient effects
- ⚙️ Code refactoring: ES6+, async/await, fetch API
- 🐛 Improved error handling throughout
- 🗑️ Removed unused background.js
- 📦 Updated to semantic versioning (1.0.0)

### Version 0.8 (Previous)
- Initial release with basic features

---

## 📄 License

Copyright © 2026 HennyWill. All rights reserved.

---

## 🐛 Bug Reports & Feature Requests

Found a bug or have a feature request? Feel free to:
1. Open an issue on GitHub
2. Contact via [buymeacoffee.com/hennywill](https://www.buymeacoffee.com/hennywill)

---

**Made with ❤️ by HennyWill**
