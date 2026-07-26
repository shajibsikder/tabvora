<div align="left">

## 🗂️ Tabvora - Smart Tab & Workspace Dashboard for Chrome

A fast, local-first New Tab dashboard for organizing shortcuts, workspaces, and daily browsing — with **zero telemetry** and **zero cloud storage**.

<img src="https://raw.githubusercontent.com/shajibsikder/tabvora/refs/heads/main/images/ff1.png" alt="Available on the Chrome Web Store" width="220"/>

<br/>

<!--
  IMPORTANT: Replace CHROME_WEB_STORE_URL below with your real Chrome Web Store
  listing link once the extension is published/approved. Until then this button
  will not point anywhere valid — do not publish the README with a placeholder link live.
-->
<a href="CHROME_WEB_STORE_URL" target="_blank">
  <img src="https://raw.githubusercontent.com/shajibsikder/tabvora/refs/heads/main/images/chrome.png" alt="Available on the Chrome Web Store" width="220"/>
</a>

<br/><br/>

[![Manifest](https://img.shields.io/badge/Manifest-V3-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](manifest.json)
[![Privacy](https://img.shields.io/badge/Privacy-Local--First-10b981?style=flat-square)](https://shajibsikder.github.io/tabvora/privacy.html)
[![Open Source](https://img.shields.io/badge/Open%20Source-Yes-blue?style=flat-square)](https://github.com/shajibsikder/tabvora)
[![Issues](https://img.shields.io/github/issues/shajibsikder/tabvora?style=flat-square)](https://github.com/shajibsikder/tabvora/issues)

[Install](#-installation) · [Features](#-features) · [Privacy](#-privacy--data-handling) · [Permissions](#-permissions-explained) · [Architecture](#-architecture) · [Contributing](#-contributing)

</div>

---

## 📖 About

**Tabvora** replaces Chrome's default New Tab page with a fast, customizable dashboard built around one idea: your browsing data should stay on your device, under your control.

Instead of a static grid of a few recent sites, Tabvora gives you an **unlimited, virtually-scrolled shortcut grid** organized into custom **workspaces**, with search, drag-and-drop reordering, pinning, color labels, and one-click bookmark import. A handful of optional productivity tools — draft recovery, usage statistics, and daily time limits — are available if you want them, and are **off by default**.

Every piece of data Tabvora creates — shortcuts, notes, settings, drafts, usage stats — is stored locally in your browser using `chrome.storage.local` and `IndexedDB`. Nothing is uploaded, synced to a server, or shared with any third party.

---

## ✨ Features

### Dashboard & Shortcuts
- **Unlimited shortcuts** rendered with virtual scrolling, so the dashboard stays smooth even with hundreds of saved links
- **Custom workspaces** to group shortcuts by project, topic, or context
- **Drag-and-drop reordering** and **pinning** for your most-used links
- **Color labels** for quick visual sorting
- **Instant search** across all saved shortcuts
- **Right-click "Add to Tabvora"** context menu — save the current page or any link without opening the dashboard
- **One-click bookmark import** from your existing Chrome bookmarks
- **Duplicate finder** to detect and clean up repeated shortcuts
- **Archive** for shortcuts you want to keep but don't need on the main grid
- **Broken link detection** (optional) — checks whether saved shortcuts are still reachable

### Productivity Widgets
- **Quick Notes** — a local scratchpad with character count and one-click export to a `.txt` file
- **Live clock & date** widget

### Data Portability
- **Backup & Restore** — export your entire shortcut collection to a local file and re-import it anytime, on any device

### Appearance
- **Light & Dark themes** (with automatic system preference support)
- **Adjustable card size and grid density** to fit your screen and preference

### Optional Features (disabled by default)
These are the only features that require broader site access, and they only activate if you turn them on in Settings:

| Feature | What it does | Default |
|---|---|---|
| **Draft Recovery** | Locally saves unsaved text from web form fields so you don't lose it if a tab closes unexpectedly. Password, payment, and other sensitive fields are automatically excluded. | Off |
| **Website Usage Statistics** | Locally calculates and displays how much time you spend on specific sites. | Off |
| **Daily Time Limits** | Lets you set a daily time budget for a saved shortcut and shows a local reminder when it's reached. | Off |

---

## 🔒 Privacy & Data Handling

Tabvora is built local-first, on purpose:

- ❌ No analytics
- ❌ No advertising trackers
- ❌ No remote telemetry
- ❌ No cloud sync
- ❌ No backend servers collecting your browsing data
- ✅ All shortcuts, notes, settings, and optional-feature data stay in your browser's local storage unless *you* explicitly export them
- ✅ Draft Recovery automatically excludes password fields, payment fields, and other sensitive inputs before anything is saved
- ✅ Sensitive/optional features are off until you turn them on

The one exception to "no network activity": the optional **broken-link check** sends a direct request to a website *you already saved* to see if it's still reachable — that request goes straight to that site, never to a Tabvora-controlled server.

Full details: **[Privacy Policy](https://shajibsikder.github.io/tabvora/privacy.html)**

---

## 🔑 Permissions Explained

Tabvora requests only the permissions its implemented features actually use:

| Permission | Why it's needed |
|---|---|
| `storage` | Save shortcuts, notes, workspaces, and preferences locally |
| `tabs` | Open shortcuts, identify the active tab for optional Usage Statistics, and manage dashboard navigation |
| `bookmarks` | Read bookmarks only when you use the "Import Bookmarks" action |
| `contextMenus` | Power the right-click "Add to Tabvora" option |
| `alarms` | Reliably resume optional Usage Statistics tracking after the browser suspends the extension's background service worker |
| `favicon` | Display each shortcut's site icon via Chrome's built-in favicon service |
| Host access (`http://*/*`, `https://*/*`) | Required **only** for the optional, off-by-default Draft Recovery and Daily Time Limit features, plus the optional broken-link check |

No permission is requested "just in case" — each one maps directly to a feature described above.

---

## 🚀 Installation

### From the Chrome Web Store (recommended)
1. Click the **Chrome Web Store** button at the top of this page, or visit the [listing directly](CHROME_WEB_STORE_URL).
2. Click **Add to Chrome**.
3. Open a new tab — Tabvora is ready to use.

### Manual / Developer Mode
Useful for trying the latest source before it hits the Web Store, or for contributing:

1. Clone this repository:
   ```bash
   git clone https://github.com/shajibsikder/tabvora.git
   ```
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the cloned `tabvora` folder.
5. Open a new tab to see it in action.

No build step, no package manager, and no compilation pipeline are required — Tabvora runs directly from source.

---

## 🏗️ Architecture

Tabvora is intentionally dependency-free: vanilla JavaScript (ES modules), the native `chrome.*` extension APIs, `IndexedDB` for structured local data, and `chrome.storage` for settings/session state. No frameworks, no bundlers, no build pipeline.

```
tabvora/
├── manifest.json          # Manifest V3 configuration
├── newtab.html             # New Tab dashboard entry point
├── privacy.html             # Privacy policy page (served via GitHub Pages)
├── js/
│   ├── background.js        # Service worker — usage tracking, alarms, context menus, messaging
│   ├── content-script.js    # Draft Recovery & daily-limit reminder UI (runs on visited pages)
│   ├── app.js                # Dashboard controller — shortcuts, workspaces, settings, import/export
│   ├── db.js                  # IndexedDB access layer
│   ├── virtual-grid.js        # Virtualized shortcut grid renderer
│   ├── widgets.js             # Clock & Quick Notes widgets
│   └── utils.js               # Shared helpers (URL parsing, favicon URLs, HTML escaping)
├── css/
│   ├── tokens.css             # Design tokens (colors, spacing, theme variables)
│   ├── base.css                # Base layout and reset
│   └── components.css          # Component-level styles
└── icons/                    # Extension icons
```

**Key engineering details:**
- **Virtual scrolling** in the shortcut grid keeps rendering smooth regardless of collection size — only visible rows are mounted to the DOM at any time.
- **Service worker resilience**: Manifest V3 service workers can be suspended by the browser at any time. Tabvora persists active tracking state to `chrome.storage.session` and uses a `chrome.alarms` fallback to recover Usage Statistics tracking accurately after a suspension, rather than relying solely on a `setInterval` timer.
- **Defense-in-depth against XSS**: all user-influenced strings (shortcut titles, notes, imported backup data) are HTML-escaped before being rendered, and backup imports are validated and whitelisted field-by-field before being written to storage.
- **Sensitive-field exclusion**: Draft Recovery actively screens out password, payment, OTP, and other sensitive inputs using both attribute heuristics and structural (form context) checks — both when capturing and when restoring a draft.

---

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are welcome.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes with clear messages
4. Open a Pull Request describing what changed and why

For bugs or security concerns, please open an issue rather than a public discussion of exploit details — see [Reporting a Vulnerability](#-security) below.

---

## 🛡️ Security

If you discover a security or privacy issue in Tabvora, please report it via [GitHub Issues](https://github.com/shajibsikder/tabvora/issues) or by contacting the maintainer directly. Please avoid disclosing exploit details in a public issue until a fix has shipped.

---

## 📄 License

<!-- TODO: Add a LICENSE file to the repository and name it here, e.g. MIT, Apache-2.0, GPL-3.0 -->
This project's license is specified in the [LICENSE](LICENSE) file of this repository.

---

## 🔗 Links

| Resource | Link |
|---|---|
| GitHub Repository | [github.com/shajibsikder/tabvora](https://github.com/shajibsikder/tabvora) |
| Report an Issue | [github.com/shajibsikder/tabvora/issues](https://github.com/shajibsikder/tabvora/issues) |
| Privacy Policy | [shajibsikder.github.io/tabvora/privacy.html](https://shajibsikder.github.io/tabvora/privacy.html) |
| Chrome Web Store | _Add link once published_ |

---

## 🌐 About This Repository

This repository contains both the **extension source code** and the **official Tabvora website** (privacy policy and supporting pages), published via GitHub Pages.

### Website Deployment
The website is built with zero package managers or compilation pipelines and runs directly on GitHub Pages.

1. Push all files to the `main` branch.
2. Enable **GitHub Pages** in repository settings, selecting `/ (root)`.
3. The site goes live automatically at your GitHub Pages address.

---

<div align="center">

Made with care for people who keep a lot of tabs open.

**Tabvora** — Local-first. Privacy-first. Yours.

</div>
