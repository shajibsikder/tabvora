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
```markdown
Tabvora transforms your browser's new tab page into a clean, distraction-free productivity dashboard built on a strict local-first, zero-telemetry architecture.

Organize your daily web tools into visual shortcuts, switch seamlessly between custom project workspaces, stay focused with an integrated Pomodoro timer, take quick scratchpad notes, and monitor your digital wellbeing — without sending a single byte of your data to external servers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ KEY PRODUCTIVITY FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ VISUAL SHORTCUTS & SPEED DIAL
• Custom visual shortcut tiles with website icons displayed using Chrome's native built-in favicon service.
• Group shortcuts into custom categories or tags.
• Instant search filtering across all your shortcuts.
• One-click bookmark import to quickly bring your existing browser links into Tabvora.

📂 CUSTOM WORKSPACES
• Create dedicated workspaces for Work, Personal, Research, or Projects.
• Switch contexts instantly without cluttering your main view.

⏱️ INTEGRATED FOCUS POMODORO TIMER
• 25-minute focus intervals and 5-minute break timers.
• Real-time countdown display directly on your dashboard.
• Local desktop notifications when intervals complete with a 5-minute snooze option.
• Procedural synthetic audio chimes generated in-browser via the W3C Web Audio API.

📝 QUICK SCRATCHPAD NOTES
• Instant note-taking right on your new tab.
• One-click clipboard paste button for quick snippet capture.
• Notes are persisted purely inside your browser's local storage (`chrome.storage.local`).

🧹 RAM SAVER (MEMORY OPTIMIZER)
• One-click memory optimization to sleep inactive background tabs (via `chrome.tabs.discard`) and free up system RAM, automatically protecting pinned tabs and audible media.

🌿 DIGITAL WELLBEING & USAGE LIMITS (OPTIONAL)
• Set gentle daily usage limits on distracting websites.
• Periodic break reminders (45m eye-rest, 90m stretch, 3h hydrate & walk) measuring active browser session time.
• Disabled by default — you have complete opt-in control.

🛡️ OPTIONAL DRAFT RECOVERY
• Helps prevent lost form text if a tab accidentally crashes or closes.
• Disabled by default.
• Best-effort security filtering: automatically screens out passwords, credit cards, CVVs, tokens, authentication fields, and phone numbers.

🎨 IMMERSIVE VISUAL CUSTOMIZATION
• 40 curated wallpapers, including dynamic live effects (aurora, rain, fireflies, ocean, stars).
• Light, Dark, and System theme support with full Zen minimalist mode.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 PRIVACY & ZERO TELEMETRY GUARANTEE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Local-First: All of your data (shortcuts, notes, preferences, history stats) is stored on your machine in `chrome.storage.local` and `IndexedDB`.
• Zero Tracking: No analytics, no Google Analytics, no tracking pixels, no telemetry scripts.
• Zero Remote Code: No eval(), no remote scripts, and no external CDNs. All scripts and styles are bundled locally.
• No Account Required: No signup, no passwords, no cloud sync required.
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
