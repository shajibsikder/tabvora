<div align="left">

## 🗂️ Tabvora - Smart Tab & Workspace Dashboard for Chrome

A fast, local-first New Tab dashboard for organizing shortcuts, workspaces, and improving daily browsing productivity — with zero telemetry, zero analytics, and no cloud storage.

[![Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-v2.1.0-blue?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/ibejmhkigcbnfnobfkeebfnpodlpgjab)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Local First](https://img.shields.io/badge/Local--First-Active-success)](#-privacy--data-handling)
[![Privacy First](https://img.shields.io/badge/Privacy-Device--Level-brightgreen)](#-privacy--data-handling)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Install](#-installation) · [What's New in v2.1](#-whats-new-in-v21) · [Features](#-features) · [Privacy](#-privacy--data-handling) · [Permissions](#-permissions-explained) · [Contributing](#-contributing)

---

### 📖 About: Tabvora - Smart Tab & Workspace

**Tabvora** replaces Chrome's default New Tab page with a fast, customizable dashboard built around one idea: your browsing data should stay on your device, under your control.

<img src="https://raw.githubusercontent.com/shajibsikder/tabvora/refs/heads/main/images/cover.png" alt="Available on the Chrome Web Store"/>

<br/>

Instead of a static grid of a few recent sites, Tabvora gives you an **unlimited, virtually-scrolled shortcut grid** organized into custom **workspaces**, with search, drag-and-drop reordering, pinning, color labels, and one-click bookmark import. A suite of optional productivity tools — Digital Wellbeing, Browser Usage Dashboard, Draft Recovery, Website Usage Statistics, and browsing time limits — are available if you want them, and are **off by default**.

<div align="center">
<a href="https://chromewebstore.google.com/detail/ibejmhkigcbnfnobfkeebfnpodlpgjab?utm_source=item-share-cb" target="_blank">
  <img src="https://raw.githubusercontent.com/shajibsikder/tabvora/refs/heads/main/images/chrome.png" alt="Available on the Chrome Web Store" width="300"/>
</a>
</div>

Every piece of data Tabvora creates — shortcuts, notes, settings, drafts, Digital Wellbeing settings, usage stats — is stored locally in your browser using `chrome.storage.local`, `chrome.storage.session`, and `IndexedDB`. Nothing is uploaded, synced to a server, or shared with any third party.

</div>

---

## 🚀 What's New in v2.1.0

Tabvora v2.1.0 delivers major performance, security hardening, and Chrome Web Store policy compliance improvements:

- 🧹 **RAM Saver (Memory Optimizer)**: One-click background tab sleeping via `chrome.tabs.discard` to reduce system memory footprint, automatically protecting pinned tabs and media playback.
- 🛡️ **Hardened Draft Recovery Screening**: Multi-tier input inspection that filters out passwords, payment forms, CVVs, tokens, authentication parameters, and phone numbers.
- 🎨 **40 Curated Wallpapers & Live Effects**: High-definition aesthetic backgrounds featuring dynamic CSS/canvas live effects (aurora, rain, fireflies, cosmic lake, stars).
- 🔒 **Zero Host Permissions**: Eliminated broad host access permissions from manifest; uses strictly scoped top-level content scripts.
- 📜 **Complete Asset Attribution**: Bundled `LICENSES.md` and `ATTRIBUTION.md` catalogues documenting third-party assets and MIT licensing.

## 🚀 What's New in v2.0.1

Tabvora v2.0.1 is a maintenance and compliance-focused update.

- 🔎 Improved web-search wording to accurately reflect Chrome's default search engine.
- 🧹 Minor UI and code cleanup.
- 🛡️ No changes to the local-first privacy architecture or data-handling model.

## 🚀 What's New in v2.0

Tabvora v2.0.0 introduced significant productivity and Digital Wellbeing enhancements while maintaining our strict local-first, zero-telemetry architecture:

- 🧘 **Digital Wellbeing Engine**: Session-only, local break reminders (Eye, Stretch, Walk, Long Break) to reduce eye strain and encourage screen breaks.
- 🌐 **Browser Usage Dashboard & Widget Card**: Track your total daily Chrome browsing duration with an optional dashboard widget card and real-time usage progress tracking.
- ⏱️ **Website & Global Browsing Time Limits**: Set custom daily browsing allowances per website or globally across Chrome. Features real-time auto-popups that work even during full-screen video playback.
- 🎨 **Native Glassmorphism Reminders**: Reminder dialogs redesigned with a modern native glassmorphism interface.
- ⚙️ **Dashboard Widget Controls**: Toggle individual widgets on or off directly via Appearance Settings (including the Browser Usage Card).
- 🛡️ **Session-Only Memory Safety**: Digital Wellbeing state and limit dismissal flags utilize `chrome.storage.session` and automatically clear when Chrome closes.

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
- **RAM Saver (Memory Optimizer)** — One-click sleep for inactive background tabs (safeguarding pinned tabs and media playback) to reclaim system RAM

### Productivity & Digital Wellbeing Widgets
- **Browser Usage Card** — Optional dashboard widget displaying daily Chrome time spent and progress toward configured global limits
- **Digital Wellbeing** — Session-based periodic wellness break reminders (Eye, Stretch, Walk, Long Break)
- **Quick Notes** — Scratchpad with character count, one-click clipboard paste, and export to `.txt`
- **Pomodoro Timer & Clock** — Focused work cycles with short/long breaks and synthetic Web Audio chimes

### Data Portability
- **Backup & Restore** — Export your entire shortcut collection to a local JSON file and re-import it anytime

### Appearance
- **40 Curated Wallpapers** — High-definition aesthetic backgrounds with dynamic live animation effects (aurora, rain, fireflies, cosmic lake, stars)
- **Light & Dark themes** — Seamless automatic system preference detection and Zen minimalist mode
- **Adjustable card size and grid density** to fit any screen resolution

### Optional Features (disabled by default)
These features activate only if you explicitly choose to turn them on in Settings:

| Feature | What it does | Default |
|---|---|---|
| **Digital Wellbeing** | Session-only reminders for Eye, Stretch, Walk, and Long Breaks. Runs locally and resets automatically when Chrome closes. | Off |
| **Browser Usage Dashboard** | Locally calculates total daily Chrome usage time and provides progress tracking on the dashboard. | Off |
| **Website & Global Limits** | Lets you set daily time budgets for individual shortcuts or overall Chrome usage with real-time popup alerts. | Off |
| **Draft Recovery** | Locally saves unsaved text from web form fields so you don't lose it if a tab closes unexpectedly. Password, payment, and sensitive fields are excluded. | Off |
| **Website Usage Statistics** | Locally calculates and displays domain visit frequency and duration charts. | Off |

---

## 🔒 Privacy & Data Handling

Tabvora is built local-first, on purpose:

- ❌ No analytics
- ❌ No advertising trackers or SDKs
- ❌ No remote telemetry
- ❌ No cloud sync
- ❌ No user accounts or sign-in
- ❌ No backend servers collecting your browsing data
- ❌ No health data collection or medical profiling
- ✅ All shortcuts, notes, settings, and optional-feature data stay in your browser's local storage unless *you* explicitly export them
- ✅ Digital Wellbeing uses session-only storage (`chrome.storage.session`) and resets automatically when Chrome closes
- ✅ Reminder data is temporary and automatically cleared when the browser session ends
- ✅ Draft Recovery automatically excludes password fields, payment fields, CVVs, tokens, authentication forms, and phone numbers
- ✅ All sensitive and productivity monitoring features are off until you turn them on
- ✅ Zero automated background network requests: All operations execute entirely on your machine

Full details: **[Privacy Policy](https://shajibsikder.github.io/tabvora/privacy.html)**

---

## 🔑 Permissions Explained

Tabvora requests only permissions directly needed for implemented features:

| Permission | Why it's needed |
|---|---|
| `storage` | Save shortcuts, notes, workspaces, Pomodoro timer state, and preferences locally |
| `favicon` | Render website icons cleanly via Chrome's native favicon provider (`chrome://favicon2/`) |
| `tabs` | Open shortcuts, determine active domain for optional usage stats, and sleep background tabs via `chrome.tabs.discard` (RAM Saver) |
| `bookmarks` | Read bookmarks only when you explicitly click "Import Bookmarks" |
| `contextMenus` | Provide right-click "Add to Tabvora" context menu options |
| `alarms` | Schedule local periodic tasks, Pomodoro intervals, wellbeing breaks, and midnight reset checks |
| `search` | Execute searches from the dashboard search bar through your default search engine |
| `clipboardRead` | Allow one-click pasting into the Quick Notes scratchpad widget when you click "Paste" |
| `notifications` | Deliver local desktop notifications for Pomodoro cycles and website limits |
| `content_scripts` (`http://*/*`, `https://*/*`) | Scoped strictly to top-level pages (`all_frames: false`) for optional Draft Recovery and Limit Overlays. No broad host permissions requested. |

---

## 🚀 Installation

### From the Chrome Web Store (recommended)
1. Click the **Chrome Web Store** button at the top of this page, or visit the [listing directly](https://chromewebstore.google.com/detail/ibejmhkigcbnfnobfkeebfnpodlpgjab?utm_source=item-share-cb).
2. Click **Add to Chrome**.
3. Open a new tab — Tabvora is ready to use.

### Manual / Developer Mode
Useful for trying the latest source before it hits the Web Store, or for contributing:

1. Clone this repository:
   ```bash
   git clone https://github.com/shajibsikder/tabvora.git
   ```
2. Open Chrome (or Edge / Brave / Opera / Vivaldi / Arc) and navigate to `chrome://extensions` (or `edge://extensions`).
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the `tabvora` directory inside this repository.
5. Open a new tab to see Tabvora in action.

---

## 🌐 Supported Browsers

Tabvora is built strictly to the W3C WebExtensions standard and Chromium Manifest V3 specifications. It is fully compatible with:

- **Google Chrome** (v102+) — Primary distribution target
- **Microsoft Edge** (v102+) — 1-click install (enable "Allow extensions from other stores")
- **Brave Browser** (v1.40+) — Full compatibility with Brave Shields
- **Opera & Opera GX** (v88+) — Full workspace & RAM Saver support
- **Vivaldi** (v5.0+) — Full compatibility with tab stacks
- **Arc Browser** — Native feature parity within Arc Spaces

