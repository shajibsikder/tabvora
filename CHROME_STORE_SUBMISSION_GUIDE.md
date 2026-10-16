# Chrome Web Store Developer Console Submission Guide
**Tabvora - Smart Tab & Dashboard Manager**  
Version 2.1.0 • Manifest V3 Store Guide

*(Note: This guide is for your developer dashboard submission. It is excluded from the final extension zip package.)*

---

## 1. Store Listing Details

### Extension Name (Max 45 chars)
```text
Tabvora - Smart Tab & Dashboard Manager
```

### Summary / Short Description (Max 132 chars)
```text
A local-first new tab dashboard with visual shortcuts, custom workspaces, Pomodoro timer, notes, and memory optimizer.
```

### Category
- **Category:** Productivity

### Detailed Description
```text
Tabvora is a fast, local-first New Tab dashboard designed to organize shortcuts, workspaces, and everyday browsing in one clean, customizable interface. Replace Chrome's default New Tab page with a customizable dashboard while keeping all your data stored locally on your device.

KEY FEATURES

Dashboard & Shortcuts
• Responsive Shortcut Grid: Handles extensive collections of websites smoothly with responsive layouts and instant search.
• Custom Workspaces: Group and organize links by category or context (Main, Work, Study, Personal, Shopping).
• Quick Customization: Drag-and-drop reordering, link pinning, notes indicators, and adjustable grid layouts.
• One-Click Search & Import: Instant search across all saved links and simple Chrome bookmark import.
• Context Menu Integration: Right-click any webpage or link to save it directly with "Add to Tabvora".
• Organization Tools: Built-in duplicate finder and archive for unused shortcuts.
• Automatic Favicons: Renders clean site icons using Chrome's native favicon service without third-party network calls.

Productivity Widgets & Controls
• RAM Saver (Memory Optimizer): One-click memory optimization using native tab sleeping (chrome.tabs.discard) to hibernate inactive background tabs, automatically safeguarding pinned tabs and media playback.
• Integrated Focus Pomodoro Timer: 25-minute focus intervals and 5-minute break cycles with real-time countdown, chime alerts synthesized via W3C Web Audio API, and desktop notifications.
• Quick Notes & Task Checklist: Local scratchpad widget with character counter, 1-click clipboard paste, text file export, and an integrated task checklist with progress tracking.
• Browser Usage Card: Dashboard widget to track daily browsing dwell time and limit progress locally.
• Live Clock, Date & Quotes: Clean, real-time desktop clock display (12h/24h) and curated offline motivational quote bank.
• Widget Visibility Controls: Toggle individual widgets on or off via Appearance settings.
• Native Glassmorphism UI: Modern overlay dialogs for reminders, limits, and system notices.

Personalization & Environments
• 40 Curated HD Wallpapers: High-resolution offline landscapes, architecture, and minimal textures.
• Dynamic Live Canvas Effects: Real-time procedural atmospheric animations (Aurora Borealis, Rain on Window, Fireflies, Cosmic Lake, Starlight).
• Zen Minimalist Mode: Clean hide/reveal toggle that clears the UI for zero-distraction focus.
• Appearance Customization: Light, Dark, and System themes with adjustable card sizes and spacing.
• Backup & Restore: Export and import your dashboard configurations as a local JSON file anytime.

OPTIONAL FEATURES (Disabled by Default)

• Digital Wellbeing: Provides session-based break reminders (Eye, Stretch, Walk, Long Break) to reduce screen fatigue. Resets automatically when Chrome closes. This feature is intended only for productivity and break reminders. It does not collect health or personal data.
• Browser Usage Dashboard: Optionally displays your locally calculated daily browsing time and progress toward configured limits.
• Website & Global Browsing Time Limits: Set custom daily time budgets per website or globally across Chrome, with real-time popups that work during full-screen media playback.
• Draft Recovery: Optionally saves supported unsaved text entered into compatible web forms to help recover accidental tab closures. Password fields, payment fields, OTPs, tokens, and phone numbers are automatically excluded by sensitive field screening.
• Website Usage Statistics: Optionally calculates browsing time and visit activity for websites and displays the results locally on your dashboard.

PRIVACY & ZERO TELEMETRY GUARANTEE

Tabvora operates strictly on a local-first architecture. All user data—including shortcuts, workspaces, notes, settings, limits, and optional feature records—remains stored on your device via chrome.storage.local, chrome.storage.session, and IndexedDB.

• Zero Tracking: No analytics, telemetry, advertising trackers, or user profiling.
• Zero Cloud Storage: No backend servers, cloud databases, user accounts, or cloud synchronization.
• Zero Remote Code: Complies with strict CSP. No eval(), no remote scripts, and no external CDNs. All scripts and styles are bundled locally.
• Data Integrity: We do not collect, transmit, share, or sell user data.
• Session Safety: Temporary session data (Digital Wellbeing states and limit dismissals) automatically clears upon ending your browser session.

PERMISSIONS

• Storage: Saves shortcuts, workspaces, notes, settings, and local preferences on your device.
• Tabs: Required for RAM Saver tab sleeping (chrome.tabs.discard) and workspace tab navigation.
• Bookmarks: Used exclusively when you manually click "Import Bookmarks".
• Context Menus: Powers the right-click "Add to Tabvora" shortcut creation menu.
• Alarms: Schedules local reminder events and maintains Pomodoro timers after service worker suspension.
• Favicon: Renders website icons using Chrome's built-in favicon API without third-party network calls.
• Search: Dispatches search bar queries to your chosen search engine.
• ClipboardRead: Powers the single-click paste button inside the Quick Notes scratchpad upon user click.
• Notifications: Displays native desktop notifications for Pomodoro cycles and website limits.
• Content Scripts (http://*/*, https://*/*): Scoped strictly to top-level pages (all_frames: false) to display in-tab limit overlays and power the optional form draft recovery feature.

TRANSPARENCY & RESOURCES

Tabvora provides public documentation, a public GitHub repository, and supporting resources for transparency. Review the repository, inspect our privacy practices, or report issues directly on GitHub.

GitHub Repository
https://github.com/shajibsikder/tabvora

Privacy Policy
https://shajibsikder.github.io/tabvora/privacy.html

Report Issues
https://github.com/shajibsikder/tabvora/issues

Built with Manifest V3
Privacy First • Local First • Transparent & Secure
```

---

## 2. Single Purpose Justification

When prompted in the Developer Dashboard for your extension's **Single Purpose**:
```text
Tabvora serves the single purpose of providing a local-first, privacy-focused new-tab productivity dashboard that helps users organize web shortcuts, switch project workspaces, free background memory, and maintain healthy browsing habits with offline timers and notes.
```

---

## 3. Permission Justifications (Copy-Paste Table)

Use these exact justifications in the **Privacy > Permission Justification** section:

| Permission | Justification for Chrome Web Store Reviewers |
|---|---|
| `storage` | Required to store user shortcuts, workspaces, quick notes, and dashboard settings locally on the user's device via `chrome.storage.local` and `chrome.storage.session`. |
| `favicon` | Required to display website favicons on user shortcut tiles using Chrome's native internal favicon service. Tabvora itself makes no outbound network requests. |
| `tabs` | Required to query active tab domain focus for optional user-configured website limits, and to sleep inactive background tabs via `chrome.tabs.discard` when the user clicks the RAM Saver memory optimizer. |
| `bookmarks` | Required exclusively when the user clicks the "Import Bookmarks" button to let users migrate existing browser bookmarks into Tabvora dashboard shortcuts. |
| `contextMenus` | Required to provide a right-click "Add to Tabvora Shortcuts" context menu item allowing users to save web pages directly into their dashboard. |
| `alarms` | Required for event-driven local periodic tasks: Pomodoro timer interval countdowns, optional Digital Wellbeing break reminders, and midnight usage resets. |
| `search` | Required to execute search queries typed into the dashboard search bar using the user's selected search engine. |
| `clipboardRead` | Required strictly when the user explicitly clicks the "Paste" button in the Quick Notes widget to insert clipboard text into their notes. Never runs in the background. |
| `notifications` | Required to show native desktop notifications when the Pomodoro focus timer finishes or when a user-configured website usage limit is reached. |

---

## 4. Content Script Justification (`http://*/*`, `https://*/*`)

Chrome Web Store will display a prompt asking why your extension injects content scripts on web pages:

**Paste this justification:**
```text
The content script (`js/content-script.js`) is strictly utilized to power two optional, user-enabled productivity features that are disabled by default:

1. Optional Draft Recovery: Captures text from standard input fields so users can recover unsaved form drafts after accidental browser crashes. It utilizes best-effort filtering to exclude sensitive fields (passwords, OTPs, credit cards, CVVs, tokens, authentication inputs, phone numbers), runs only in top-level frames, and stores data solely in local IndexedDB.
2. In-Tab Limit & Wellbeing Reminders: Displays an unobtrusive in-tab visual modal when a user reaches their self-imposed daily website limit or when a Digital Wellbeing break milestone is reached.

The content script executes entirely offline, sends no data across the network, and injects zero external scripts.
```

---

## 5. Data Usage / User Data Disclosures

In the **Privacy Practices** tab of the Chrome Web Store Developer Console:

### Certification of Limited Use
- Check the box: **"I certify that my extension adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements."**
- Check the box: **"I certify that my extension does not sell user data to third parties."**
- Check the box: **"I certify that my extension does not use or transfer user data for purposes unrelated to its single purpose."**
- Check the box: **"I certify that my extension does not use or transfer user data to determine creditworthiness or for lending purposes."**

### Data Collection Declarations

| Data Category | Collected? | Declaration Details |
|---|---|---|
| **Personally Identifiable Information** | **YES (Local only)** | *Select "Personally Identifiable Information"*. Check **"Stored locally on the device"**. Description: *"Stored locally on the device only. If the optional Draft Recovery feature is enabled by the user, text typed into standard web forms (such as names or email addresses) is temporarily saved in local IndexedDB to recover lost form text after crashes. Data is never transmitted externally."* |
| **Personal Communications** | **YES (Local only)** | *Select "Personal Communications"*. Check **"Stored locally on the device"**. Description: *"Stored locally on the device only. If the optional Draft Recovery feature is enabled by the user, draft messages typed into web textareas are cached locally on device to prevent accidental data loss. Data is never sent to any external server."* |
| **Web History** | **YES (Local only)** | *Select "Web History"*. Check **"Stored locally on the device"**. Description: *"The extension optionally tracks the domain origin and dwell time of the currently focused tab solely on the user's device to calculate daily usage stats and enforce user-configured daily website limits. This data is never transmitted to any external server."* |
| **User Content** | **YES (Local only)** | *Select "User Content"*. Check **"Stored locally on the device"**. Description: *"Stores user-created shortcuts, workspace names, scratchpad notes, and optional unsaved form drafts locally in chrome.storage and IndexedDB. Zero data is transmitted off the device."* |
| **Website Content** | **YES (Local only)** | *Select "Website Content"*. Check **"Stored locally on the device"**. Description: *"Used only for the optional Draft Recovery feature to store unsaved text inputs in standard textareas and text fields locally. Sensitive fields are filtered out."* |
| **Health Information** | **NO** | Not collected. |
| **Financial & Payment Information** | **NO** | Not collected. Payment/card fields are filtered out by best-effort screening. |
| **Authentication Information** | **NO** | Not collected. Password and auth fields are explicitly excluded. |
| **Location Information** | **NO** | Not collected. |

---

## 6. Official URLs to Provide

- **Privacy Policy URL:**  
  `https://shajibsikder.github.io/tabvora/privacy.html`
- **Homepage / Website URL:**  
  `https://shajibsikder.github.io/tabvora`
- **Support / Issue URL:**  
  `https://github.com/shajibsikder/tabvora/issues`
