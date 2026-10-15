# Licenses & Legal Notices

**Tabvora - Smart Tab & Dashboard Manager**  
Version 2.1.0 • Manifest V3 • Local-First Architecture

---

## 1. Software License

```
Custom Source-Available & Protective Distribution License

Copyright (c) 2026 Md Shajib Sikder. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to inspect,
study, review, and run locally for personal non-commercial educational purposes,
subject to the following conditions:

1. TRADEMARK & BRANDING:
The name "Tabvora", the logo, icons, branding assets, and visual presentation are
the exclusive intellectual property of Md Shajib Sikder. No license or permission
is granted to use the Tabvora trademark or branding in any derivative works.

2. BROWSER EXTENSION STORE DISTRIBUTION RESTRICTION:
Re-publishing, re-uploading, mirroring, repackaging, or distributing this extension
or any derivative work on any public browser extension marketplace or store (including,
without limitation, the Google Chrome Web Store, Microsoft Edge Add-ons, Firefox Add-ons,
or Opera Addons) is STRICTLY PROHIBITED without prior express written permission
from Md Shajib Sikder.

3. COMMERCIAL RESALE:
Selling, sublicensing, or monetizing this software, its source code, or any derivative
works as a paid product or paid service is strictly prohibited.

4. ATTRIBUTION:
The above copyright notice, this permission notice, and all original author attributions
must be retained in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 2. Visual Assets & Wallpapers

Tabvora bundles 40 photographic and live background wallpapers inside `backgrounds/` to provide offline visual customization for the new tab dashboard:
- The 40 bundled wallpapers are curated landscape, architecture, and workspace captures collected from open stock photography platforms (such as Unsplash, Pexels, and Pixabay) operating under royalty-free licenses that grant free commercial and non-commercial desktop display rights.
- A detailed file-by-file technical breakdown is maintained in [ATTRIBUTION.md](ATTRIBUTION.md).
- **Takedown & Attribution Notice:** If you are a copyright owner or photographer of any included image and wish to have specific attribution added or request image replacement, please submit a request via our [GitHub Issues Tracker](https://github.com/shajibsikder/tabvora/issues) or via our [Contact Form](https://shajibsikder.github.io/tabvora/contact.html). We will promptly address and respect all requests.

### C. Technical ICC Color Management Headers
Certain photographic image files contain standardized International Color Consortium (ICC) color space profile headers:
- **29 files** contain standard sRGB IEC61966-2.1 ICC profile headers (bearing the historical `Hewlett-Packard Company 1998` color profile copyright string).
- **7 files** contain standard Adobe RGB (1998) ICC profile headers (bearing the historical `Adobe Systems Incorporated 1999` profile string).
- **4 files** contain no embedded ICC profile tags.
- Embedded hardware EXIF tags (such as `Canon EOS 5D Mark II` in `bg_snow_pyrenees.jpg`) represent camera metadata preserved during image export, not third-party software claims.

---

## 3. Audio & Sound Engine

All audio notifications (timer completions and mindfulness chime intervals) are synthesized programmatically in real-time using the **W3C Web Audio API** (`AudioContext`, `OscillatorNode`, and `GainNode` envelopes):
- Zero external audio binary files (MP3/WAV) are bundled or streamed.
- Completely royalty-free, code-generated synthetic sound design.

---

## 4. Icons & Brand Assets

All extension icons (`icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`, and `icons/logo.png`) are proprietary brand assets designed specifically for Tabvora and reserved under copyright. Re-use of the Tabvora trademark, logo, and brand identity in any derivative works is strictly prohibited.
