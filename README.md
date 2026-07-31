<div align="left">

## 🗂️ Tabvora - Smart Tab & Workspace Dashboard for Chrome

A fast, local-first New Tab dashboard for organizing shortcuts, workspaces, and improving daily browsing productivity — with zero telemetry, zero analytics, and no cloud storage.

[![Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-v2.0.0-blue?logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/ibejmhkigcbnfnobfkeebfnpodlpgjab)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Local First](https://img.shields.io/badge/Local--First-100%25-success)](#-privacy--data-handling)
[![Privacy First](https://img.shields.io/badge/Privacy-100%25_Local-brightgreen)](#-privacy--data-handling)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Install](#-installation) · [What's New in v2.0](#-whats-new-in-v20) · [Features](#-features) · [Privacy](#-privacy--data-handling) · [Permissions](#-permissions-explained) · [Contributing](#-contributing)

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

## 🚀 What's New in v2.0

Tabvora v2.0.0 introduces significant productivity and Digital Wellbeing enhancements while maintaining our strict local-first, zero-telemetry architecture:

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
- **Broken link detection** (optional) — checks whether saved shortcuts are still reachable

### Productivity & Digital Wellbeing Widgets
- **Browser Usage Card (v2.0)** — Optional dashboard widget displaying daily Chrome time spent and progress toward configured global limits
- **Digital Wellbeing (v2.0)** — Session-based periodic wellness break reminders
- **Quick Notes** — a local scratchpad with character count and one-click export to a `.txt` file
- **Live clock & date** widget

### Data Portability
- **Backup & Restore** — export your entire shortcut collection to a local file and re-import it anytime, on any device

### Appearance
- **Light & Dark themes** (with automatic system preference support)
- **Adjustable card size and grid density** to fit your screen and preference
- **Widget Visibility Controls (v2.0)** — Hide or show specific widgets (Browser Usage Card, Live Clock, Quick Notes) in Appearance Settings

### Optional Features (disabled by default)
These are the only features that require broader site access, and they only activate if you turn them on in Settings:

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
| `tabs` | Open shortcuts, identify the active tab for optional Usage Statistics and limits, and manage dashboard navigation |
| `bookmarks` | Read bookmarks only when you use the "Import Bookmarks" action |
| `contextMenus` | Power the right-click "Add to Tabvora" option |
| `alarms` | Schedules local reminder events and maintains optional background functionality |
| `favicon` | Display each shortcut's site icon via Chrome's built-in favicon service |
| Host access (`http://*/*`, `https://*/*`) | Required **only** for optional user-enabled features: Website Usage Statistics, Draft Recovery, Browsing Time Limits, and broken-link checks |

No permission is requested "just in case" — each one maps directly to a feature described above.

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
   git clone [https://github.com/shajibsikder/tabvora.git](https://github.com/shajibsikder/tabvora.git)
