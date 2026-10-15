/**
 * Tabvora v2.1.0 - Dashboard Widgets Engine (Safe & High-Performance Version)
 * Handles:
 * 1. Live Clock
 * 2. Quick Notes & Interactive Checklist (Taskade-style)
 * 3. Pomodoro Focus Timer with Web Audio Bell (SmartTab & WebCatalog-style)
 * 4. Daily Main Focus (Momentum-style)
 * 5. Zen / Focus Mode Toggle (Bonjourr & WebCatalog-style)
 * 6. 1-Click Smart RAM Saver / Tab Sleep (OneTab-style)
 * Client-Side Architecture, Zero External APIs, Web Store Policy Compliant.
 */

import { DynamicBackgroundEngine } from './dynamic-bg.js';

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const SOUND_VAULT = [
  {
    id: 'crystal',
    name: 'Crystal Bell',
    desc: 'Crisp dual-tone bell (E5 & A5)',
    cost: 0,
    play: (ctx, now) => {
      const tones = [
        { freq: 659.25, time: 0, dur: 0.35, gain: 0.82, type: 'sine' },
        { freq: 1318.5, time: 0, dur: 0.22, gain: 0.35, type: 'sine' },
        { freq: 880.00, time: 0.14, dur: 0.85, gain: 0.88, type: 'sine' },
        { freq: 1760.0, time: 0.14, dur: 0.45, gain: 0.35, type: 'sine' }
      ];
      tones.forEach(t => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = t.type || 'sine';
        osc.frequency.setValueAtTime(t.freq, now + t.time);
        gain.gain.setValueAtTime(t.gain, now + t.time);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t.time + t.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t.time);
        osc.stop(now + t.time + t.dur);
      });
    }
  },
  {
    id: 'zen',
    name: 'Zen Singing Bowl',
    desc: '432Hz deep meditative resonance',
    cost: 3,
    play: (ctx, now) => {
      const tones = [
        { freq: 432.0, time: 0, dur: 1.8, gain: 0.85, type: 'sine' },
        { freq: 864.0, time: 0.04, dur: 1.2, gain: 0.55, type: 'sine' },
        { freq: 1296.0, time: 0.06, dur: 0.7, gain: 0.28, type: 'sine' }
      ];
      tones.forEach(t => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = t.type || 'sine';
        osc.frequency.setValueAtTime(t.freq, now + t.time);
        gain.gain.setValueAtTime(t.gain, now + t.time);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t.time + t.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t.time);
        osc.stop(now + t.time + t.dur);
      });
    }
  },
  {
    id: 'celestial',
    name: 'Celestial Harp',
    desc: '4-tone ascending sweep (C5 to C6)',
    cost: 5,
    play: (ctx, now) => {
      const tones = [
        { freq: 523.25, time: 0, dur: 0.40, gain: 0.75 },
        { freq: 659.25, time: 0.09, dur: 0.45, gain: 0.78 },
        { freq: 783.99, time: 0.18, dur: 0.55, gain: 0.82 },
        { freq: 1046.50, time: 0.27, dur: 0.95, gain: 0.88 }
      ];
      tones.forEach(t => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(t.freq, now + t.time);
        gain.gain.setValueAtTime(t.gain, now + t.time);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t.time + t.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t.time);
        osc.stop(now + t.time + t.dur);
      });
    }
  },
  {
    id: 'lofi',
    name: 'Lofi Digital Bell',
    desc: 'Warm 528Hz calming tone',
    cost: 5,
    play: (ctx, now) => {
      const tones = [
        { freq: 528.0, time: 0, dur: 0.95, gain: 0.88 },
        { freq: 1056.0, time: 0, dur: 0.45, gain: 0.35 }
      ];
      tones.forEach(t => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(t.freq, now + t.time);
        gain.gain.setValueAtTime(t.gain, now + t.time);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t.time + t.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t.time);
        osc.stop(now + t.time + t.dur);
      });
    }
  },
  {
    id: 'temple',
    name: 'Mindful Temple Gong',
    desc: 'Organic 216Hz sacred temple chime',
    cost: 8,
    play: (ctx, now) => {
      const tones = [
        { freq: 216.0, endFreq: 210.0, time: 0, dur: 1.6, gain: 0.88 },
        { freq: 432.0, endFreq: 420.0, time: 0.02, dur: 1.1, gain: 0.45 }
      ];
      tones.forEach(t => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(t.freq, now + t.time);
        osc.frequency.exponentialRampToValueAtTime(t.endFreq, now + t.time + t.dur);
        gain.gain.setValueAtTime(t.gain, now + t.time);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t.time + t.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t.time);
        osc.stop(now + t.time + t.dur);
      });
    }
  },
  {
    id: 'marimba',
    name: 'Calm Bamboo Marimba',
    desc: 'Warm organic wooden chord (F#4, A#4, C#5, F#5)',
    cost: 4,
    play: (ctx, now) => {
      const tones = [
        { freq: 369.99, time: 0, dur: 0.45, gain: 0.82, type: 'triangle' },
        { freq: 466.16, time: 0.08, dur: 0.48, gain: 0.82, type: 'triangle' },
        { freq: 554.37, time: 0.16, dur: 0.52, gain: 0.85, type: 'triangle' },
        { freq: 739.99, time: 0.24, dur: 0.75, gain: 0.88, type: 'sine' }
      ];
      tones.forEach(t => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = t.type || 'triangle';
        osc.frequency.setValueAtTime(t.freq, now + t.time);
        gain.gain.setValueAtTime(t.gain, now + t.time);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t.time + t.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t.time);
        osc.stop(now + t.time + t.dur);
      });
    }
  },
  {
    id: 'shimmer',
    name: 'Cosmic Shimmer',
    desc: 'Sparkling high-crystal luxury chime (E6, B6, E7)',
    cost: 6,
    play: (ctx, now) => {
      const tones = [
        { freq: 1318.51, time: 0, dur: 0.50, gain: 0.75, type: 'sine' },
        { freq: 1975.53, time: 0.07, dur: 0.60, gain: 0.78, type: 'sine' },
        { freq: 2637.02, time: 0.14, dur: 0.85, gain: 0.82, type: 'sine' }
      ];
      tones.forEach(t => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = t.type || 'sine';
        osc.frequency.setValueAtTime(t.freq, now + t.time);
        gain.gain.setValueAtTime(t.gain, now + t.time);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t.time + t.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t.time);
        osc.stop(now + t.time + t.dur);
      });
    }
  },
  {
    id: 'kalimba',
    name: 'Peaceful Kalimba',
    desc: 'Sweet meditative thumb piano harmony (G5, B5, D6)',
    cost: 7,
    play: (ctx, now) => {
      const tones = [
        { freq: 783.99, time: 0, dur: 0.55, gain: 0.80, type: 'sine' },
        { freq: 987.77, time: 0.10, dur: 0.65, gain: 0.84, type: 'sine' },
        { freq: 1174.66, time: 0.20, dur: 0.90, gain: 0.88, type: 'sine' }
      ];
      tones.forEach(t => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = t.type || 'sine';
        osc.frequency.setValueAtTime(t.freq, now + t.time);
        gain.gain.setValueAtTime(t.gain, now + t.time);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t.time + t.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t.time);
        osc.stop(now + t.time + t.dur);
      });
    }
  }
];

export const WALLPAPER_VAULT = [
  // 1. 360° Interactive Realistic Panoramas (4-Way Mouse Drag & Gyroscopic Tilt)
  { id: 'pan_matterhorn', aliasId: 'pan_alps', name: '360° Matterhorn Alpine Reflection', type: '360', file: 'backgrounds/bg_pan_matterhorn.jpg', cost: 0 },
  { id: 'pan_bamboo_real', aliasId: 'pan_bamboo', name: '360° Kyoto Bamboo Sanctuary', type: '360', file: 'backgrounds/bg_pan_bamboo_real.jpg', cost: 0 },
  { id: 'pan_norway_fjord', aliasId: 'pan_fjord', name: '360° Nordic Fjord Valley', type: '360', file: 'backgrounds/bg_pan_norway_fjord.jpg', cost: 6 },
  { id: 'pan_redwood', name: '360° Misty Redwood Forest', type: '360', file: 'backgrounds/bg_pan_redwood.jpg', cost: 8 },
  { id: 'pan_milkyway', aliasId: 'pan_space', name: '360° Starlit Milky Way Summit', type: '360', file: 'backgrounds/bg_pan_milkyway.jpg', cost: 10 },
  { id: 'pan_dolomites', aliasId: 'pan_cyber', name: '360° Dolomites Alpine Lake', type: '360', file: 'backgrounds/bg_pan_dolomites.jpg', cost: 12 },
  { id: 'pan_lavender', name: '360° Provence Sunset Lavender', type: '360', file: 'backgrounds/bg_pan_lavender.jpg', cost: 15 },

  // 2. Live Animated Motion Photographic Wallpapers (Real HD Photography + Zero-CPU Particle Canvas)
  { id: 'live_fireflies', name: 'Live Zen Firefly Forest', type: 'live', liveEffect: 'fireflies', file: 'backgrounds/bg_live_firefly_forest.jpg', cost: 0 },
  { id: 'live_aurora', name: 'Live Arctic Aurora Fjord', type: 'live', liveEffect: 'aurora', file: 'backgrounds/bg_live_aurora_real.jpg', cost: 0 },
  { id: 'live_ocean', name: 'Live Calm Bioluminescent Ocean', type: 'live', liveEffect: 'ocean', file: 'backgrounds/bg_live_calm_ocean.jpg', cost: 6 },
  { id: 'live_rain', name: 'Live Rainy Focus Window', type: 'live', liveEffect: 'rain', file: 'backgrounds/bg_live_rain_window.jpg', cost: 8 },
  { id: 'live_stars', name: 'Live Stargazer Alpine Mist', type: 'live', liveEffect: 'stars', file: 'backgrounds/bg_live_cosmic_lake.jpg', cost: 10 },

  // 3. Developer, Marketer & Hustle Mindset (Low-Light, Deep Focus, Eye-Cooling)
  { id: 'freelancer_desk', name: 'Freelancer Deep Work Desk', file: 'backgrounds/bg_freelancer_desk.jpg', cost: 0 },
  { id: 'bluehour_pier', name: 'Tranquil Lake Pier at Blue Hour', file: 'backgrounds/bg_bluehour_pier.jpg', cost: 0 },
  { id: 'minimal_terminal', name: 'Mindful Developer Haven', file: 'backgrounds/bg_minimal_terminal.jpg', cost: 0 },
  { id: 'deep_mist_path', name: 'Deep Emerald Forest Walk', file: 'backgrounds/bg_deep_mist_path.jpg', cost: 5 },
  { id: 'mystic_gorge', name: 'Emerald Gorge & Mystic Bridge', file: 'backgrounds/bg_mystic_gorge.jpg', cost: 6 },
  { id: 'code_flow', name: 'Late Night Code & Flow State', file: 'backgrounds/bg_code_flow.jpg', cost: 7 },
  { id: 'summit_success', name: 'The Peak of Success & Freedom', file: 'backgrounds/bg_summit_success.jpg', cost: 8 },
  { id: 'midnight_city', name: 'High-Rise Midnight Skyline', file: 'backgrounds/bg_midnight_city.jpg', cost: 9 },
  { id: 'alpine_fog', name: 'Nordic Alpine Fog & Solitude', file: 'backgrounds/bg_alpine_fog.jpg', cost: 10 },
  { id: 'night_neon_rain', name: 'Rainy Midnight Street Reflection', file: 'backgrounds/bg_night_neon_rain.jpg', cost: 11 },
  { id: 'cyber_workspace', name: 'Cyberpunk Studio & Amber Glow', file: 'backgrounds/bg_cyber_workspace.jpg', cost: 12 },
  { id: 'solitary_oak', name: 'Lone Tree of Resilience', file: 'backgrounds/bg_solitary_oak.jpg', cost: 14 },

  // 4. Classic Realistic Nature & Zen Masterpieces (Eye-Rest & Flow State)
  { id: 'hallstatt', name: 'Hallstatt Alpine Mirror Lake', file: 'backgrounds/bg_hallstatt.jpg', cost: 0 },
  { id: 'river', name: 'Turquoise River & Alps', file: 'backgrounds/bg_nature_river.jpg', cost: 0 },
  { id: 'forest', name: 'Emerald Forest Canopy', file: 'backgrounds/bg_emerald_forest.jpg', cost: 0 },
  { id: 'lake', name: 'Alpine Lake Urnersee', file: 'backgrounds/bg_mountain_lake.jpg', cost: 0 },
  { id: 'pyrenees', name: 'Pyrenees Snowy Peaks', file: 'backgrounds/bg_snow_pyrenees.jpg', cost: 0 },
  { id: 'moraine', name: 'Moraine Glacial Turquoise Lake', file: 'backgrounds/bg_moraine.jpg', cost: 5 },
  { id: 'sunlit_canopy', name: 'Sunlit Emerald Canopy', file: 'backgrounds/bg_sunlit_canopy.jpg', cost: 6 },
  { id: 'zen_stones', name: 'Mindful Zen Stone Sanctuary', file: 'backgrounds/bg_zen_stones.jpg', cost: 7 },
  { id: 'tuscany_dawn', name: 'Tuscany Golden Dawn', file: 'backgrounds/bg_tuscany_dawn.jpg', cost: 8 },
  { id: 'swiss_waterfall', name: 'Swiss Alpine Valley & Waterfall', file: 'backgrounds/bg_swiss_waterfall.jpg', cost: 9 },
  { id: 'foggy_ridge', name: 'Misty Alpine Mountain Ridge', file: 'backgrounds/bg_foggy_ridge.jpg', cost: 10 },
  { id: 'autumn_creek', name: 'Autumn Mountain Haven', file: 'backgrounds/bg_autumn_creek.jpg', cost: 11 },
  { id: 'cozy_coffee', name: 'Cozy Focus Cafe Ambience', file: 'backgrounds/bg_cozy_coffee.jpg', cost: 12 },
  { id: 'bioluminescent_shore', name: 'Bioluminescent Twilight Waves', file: 'backgrounds/bg_bioluminescent_shore.jpg', cost: 13 },
  { id: 'minimal_desk', name: 'Nordic Minimal Focus Studio', file: 'backgrounds/bg_minimal_desk.jpg', cost: 14 },
  { id: 'snowy_forest', name: 'Winter Solitude Forest', file: 'backgrounds/bg_snowy_forest.jpg', cost: 15 }
];

export class WidgetsManager {
  constructor(app) {
    this.app = app;
    this.dynamicBg = new DynamicBackgroundEngine();
    
    // DOM Elements - Clock & Notes
    this.clockWidget = document.getElementById('clockWidget');
    this.notesWidget = document.getElementById('notesWidget');
    this.notesInput = document.getElementById('quickNotesInput');
    this.clearNotesBtn = document.getElementById('clearNotesBtn');
    this.exportNotesBtn = document.getElementById('exportNotesBtn');
    
    this.clockInterval = null;
  }

  async init() {
    try { this.initClock(); } catch (e) { console.error('Error initializing clock widget:', e); }
    try { await this.initWallpaper(); } catch (e) { console.error('Error initializing wallpaper:', e); }
    try { this.initQuotes(); } catch (e) { console.error('Error initializing quotes:', e); }
    try { await this.initNotes(); } catch (e) { console.error('Error initializing notes:', e); }
    try { await this.initChecklist(); } catch (e) { console.error('Error initializing checklist:', e); }
    try { await this.initDailyFocus(); } catch (e) { console.error('Error initializing daily focus:', e); }
    try { this.initPomodoro(); } catch (e) { console.error('Error initializing pomodoro timer:', e); }
    try { this.initZenMode(); } catch (e) { console.error('Error initializing zen mode:', e); }
    try { this.initRamSaver(); } catch (e) { console.error('Error initializing RAM saver:', e); }
    try { this.initDock(); } catch (e) { console.error('Error initializing dock:', e); }
    try { this.initRewards(); } catch (e) { console.error('Error initializing rewards vault:', e); }
    try { this.initSpotlight(); } catch (e) { console.error('Error initializing spotlight search:', e); }
  }

  /* =========================================================
     1. LIVE CLOCK WIDGET
     ========================================================= */
  initClock() {
    const updateClock = () => {
      try {
        const now = new Date();
        let rawHours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = rawHours >= 12 ? 'PM' : 'AM';
        const hours = rawHours % 12 || 12;

        let greeting = 'Good day';
        if (rawHours >= 5 && rawHours < 12) {
          greeting = 'Good morning';
        } else if (rawHours >= 12 && rawHours < 17) {
          greeting = 'Good afternoon';
        } else if (rawHours >= 17 && rawHours < 22) {
          greeting = 'Good evening';
        } else {
          greeting = 'Good night';
        }

        const heroGreeting = document.getElementById('heroGreeting');
        const heroClockDigits = document.getElementById('heroClockDigits');
        const heroClockAmPm = document.getElementById('heroClockAmPm');
        const heroDateDisplay = document.getElementById('heroDateDisplay');
        const topDateStatus = document.getElementById('topDateStatus');

        chrome.storage.local.get('userName', ({ userName }) => {
          const name = (userName || '').trim();
          if (heroGreeting) {
            heroGreeting.textContent = name ? `${greeting}, ${name}.` : `${greeting}.`;
          }
        });

        const formattedHours = hours.toString().padStart(2, '0');

        if (heroClockDigits) heroClockDigits.textContent = `${formattedHours}:${minutes}`;
        if (heroClockAmPm) heroClockAmPm.textContent = ampm;
        if (heroDateDisplay) heroDateDisplay.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        if (topDateStatus) topDateStatus.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

        const timeStr = `${hours}:${minutes} ${ampm}`;
        const dayStr = now.toLocaleDateString('en-US', { weekday: 'long' });
        const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        const greetingEl = document.getElementById('clockGreeting');
        const timeEl = document.getElementById('clockTime');
        const dayEl = document.getElementById('clockDay');
        const dateEl = document.getElementById('clockDate');

        if (greetingEl) greetingEl.textContent = greeting;
        if (timeEl) timeEl.textContent = timeStr;
        if (dayEl) dayEl.textContent = dayStr.toUpperCase();
        if (dateEl) dateEl.textContent = dateStr;
      } catch (err) {
        console.error('Error inside updateClock:', err);
      }
    };

    updateClock();
    this.clockInterval = setInterval(updateClock, 1000);
  }

  /* =========================================================
     2. DEDICATED SMART QUICK NOTES (Multilingual & Fast)
     ========================================================= */
  async initNotes() {
    const notesWidget = document.getElementById('notesWidget');
    const notesInput = document.getElementById('quickNotesInput');
    const copyNotesBtn = document.getElementById('copyNotesBtn');
    const copyNotesLabel = document.getElementById('copyNotesLabel');
    const pasteNotesBtn = document.getElementById('pasteNotesBtn');
    const pasteNotesLabel = document.getElementById('pasteNotesLabel');
    const timestampNotesBtn = document.getElementById('timestampNotesBtn');
    const exportNotesBtn = document.getElementById('exportNotesBtn');
    const clearNotesBtn = document.getElementById('clearNotesBtn');
    const notesWordCount = document.getElementById('notesWordCount');
    const notesCharCount = document.getElementById('notesCharCount');
    const notesContentWrap = notesWidget?.querySelector('.notes-content-wrap');

    if (!notesInput) return;

    // Word and character stats counter
    const updateStats = () => {
      const val = notesInput.value || '';
      const chars = val.length;
      const words = val.trim() ? val.trim().split(/\s+/).length : 0;
      if (notesWordCount) notesWordCount.textContent = words + ' words';
      if (notesCharCount) notesCharCount.textContent = chars + ' chars';
    };

    // Smart Responsive Auto-expanding Height (120px up to 7-9 lines / 250px, then smooth scroll)
    const adjustHeight = () => {
      if (!notesInput) return;
      notesInput.style.height = 'auto';
      const minH = 120; // compact initial height (~4-5 lines)
      const maxH = 250; // max auto-expand height (~8-9 lines)
      const scrollH = notesInput.scrollHeight || minH;
      const targetH = Math.min(Math.max(scrollH, minH), maxH);
      notesInput.style.height = targetH + 'px';
      
      // Ensure the outer card container never scrolls and header stays permanently pinned
      if (notesWidget) {
        notesWidget.scrollTop = 0;
      }
    };
    this.adjustNotesHeight = adjustHeight;

    // Load persisted notes
    try {
      const { quickNotes } = await chrome.storage.local.get('quickNotes');
      if (quickNotes) {
        notesInput.value = quickNotes;
        updateStats();
      }
    } catch (e) {
      console.warn('Could not load quickNotes from storage:', e);
    }
    adjustHeight();

    // Auto-save & stats & auto-resize on input
    notesInput.addEventListener('input', () => {
      chrome.storage.local.set({ quickNotes: notesInput.value });
      updateStats();
      adjustHeight();
    });

    // Native paste & Ctrl+V sync
    notesInput.addEventListener('paste', () => {
      setTimeout(() => {
        chrome.storage.local.set({ quickNotes: notesInput.value });
        updateStats();
        adjustHeight();
      }, 15);
    });

    notesInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V' || e.code === 'KeyV')) {
        setTimeout(() => {
          chrome.storage.local.set({ quickNotes: notesInput.value });
          updateStats();
          adjustHeight();
        }, 15);
      }
    });

    // Ensure clicking anywhere in the notes content wrapper focuses the textarea
    notesContentWrap?.addEventListener('click', (e) => {
      if (e.target !== notesInput) {
        notesInput.focus();
      }
    });

    // Prevent widget outer container from ever scrolling its header out of view
    notesWidget?.addEventListener('scroll', () => {
      if (notesWidget.scrollTop !== 0) {
        notesWidget.scrollTop = 0;
      }
    });

    // 1-Click Smart Copy
    copyNotesBtn?.addEventListener('click', async () => {
      const text = notesInput.value;
      if (!text) {
        if (this.app && typeof this.app.showSnackbar === 'function') {
          this.app.showSnackbar('Notes are empty.');
        }
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
        if (copyNotesLabel) copyNotesLabel.textContent = 'Copied!';
        copyNotesBtn.classList.add('copied');
        if (this.app && typeof this.app.showSnackbar === 'function') {
          this.app.showSnackbar('📋 Notes copied to clipboard!');
        }
        setTimeout(() => {
          if (copyNotesLabel) copyNotesLabel.textContent = 'Copy';
          copyNotesBtn.classList.remove('copied');
        }, 1800);
      } catch (err) {
        console.error('Clipboard copy failed:', err);
      }
    });

    // 1-Click Smart Paste (Clipboard API with fallback)
    pasteNotesBtn?.addEventListener('click', async () => {
      try {
        let text = '';
        if (navigator.clipboard && navigator.clipboard.readText) {
          text = await navigator.clipboard.readText();
        }
        if (!text) {
          if (this.app && typeof this.app.showSnackbar === 'function') {
            this.app.showSnackbar('Clipboard is empty.');
          }
          notesInput.focus();
          return;
        }

        const start = notesInput.selectionStart || 0;
        const end = notesInput.selectionEnd || 0;
        const current = notesInput.value;

        notesInput.value = current.substring(0, start) + text + current.substring(end);
        notesInput.selectionStart = notesInput.selectionEnd = start + text.length;
        notesInput.focus();
        chrome.storage.local.set({ quickNotes: notesInput.value });
        updateStats();
        adjustHeight();

        if (pasteNotesLabel) pasteNotesLabel.textContent = 'Pasted!';
        pasteNotesBtn.classList.add('copied');
        if (this.app && typeof this.app.showSnackbar === 'function') {
          this.app.showSnackbar('📋 Text pasted into notes!');
        }
        setTimeout(() => {
          if (pasteNotesLabel) pasteNotesLabel.textContent = 'Paste';
          pasteNotesBtn.classList.remove('copied');
        }, 1800);
      } catch (err) {
        console.warn('Clipboard readText failed, focusing textarea for Ctrl+V:', err);
        notesInput.focus();
        if (this.app && typeof this.app.showSnackbar === 'function') {
          this.app.showSnackbar('Please press Ctrl+V to paste.');
        }
      }
    });

    // Smart Date & Time Stamp insertion
    timestampNotesBtn?.addEventListener('click', () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
      const stamp = '\n[' + timeStr + ', ' + dateStr + '] ';
      
      const start = notesInput.selectionStart || 0;
      const end = notesInput.selectionEnd || 0;
      const current = notesInput.value;
      
      notesInput.value = current.substring(0, start) + stamp + current.substring(end);
      notesInput.selectionStart = notesInput.selectionEnd = start + stamp.length;
      notesInput.focus();
      chrome.storage.local.set({ quickNotes: notesInput.value });
      updateStats();
      adjustHeight();
    });

    // Smart Export as TXT file
    exportNotesBtn?.addEventListener('click', () => {
      if (!notesInput.value.trim()) {
        if (this.app && typeof this.app.showSnackbar === 'function') {
          this.app.showSnackbar('Notes are empty to export.');
        }
        return;
      }
      const blob = new Blob([notesInput.value], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tabvora-notes-' + new Date().toISOString().slice(0, 10) + '.txt';
      a.click();
      URL.revokeObjectURL(url);
      if (this.app && typeof this.app.showSnackbar === 'function') {
        this.app.showSnackbar('💾 Notes exported successfully!');
      }
    });

    // Clear Notes
    clearNotesBtn?.addEventListener('click', () => {
      if (!notesInput.value.trim()) return;
      if (confirm('Are you sure you want to clear your notes?')) {
        notesInput.value = '';
        chrome.storage.local.remove('quickNotes');
        updateStats();
        adjustHeight();
        if (this.app && typeof this.app.showSnackbar === 'function') {
          this.app.showSnackbar('Notes cleared.');
        }
      }
    });


    window.addEventListener('resize', () => {
      if (notesWidget?.classList.contains('flyout-active')) {
        adjustHeight();
      }
    });
  }

    /* =========================================================
     2B. DEDICATED TASKS CHECKLIST (Taskade-style)
     ========================================================= */
  async initChecklist() {
    const todoList = document.getElementById('todoList');
    const newTodoInput = document.getElementById('newTodoInput');
    const addTodoBtn = document.getElementById('addTodoBtn');
    const todoProgressBar = document.getElementById('todoProgressBar');
    const todoProgressFill = document.getElementById('todoProgressFill');
    const todoPendingCount = document.getElementById('todoPendingCount');
    const notesFooterLeft = document.getElementById('notesFooterLeft');
    const clearDoneTodosBtn = document.getElementById('clearDoneTodosBtn');
    const dockTasksBadge = document.getElementById('dockTasksBadge');

    if (!todoList || !newTodoInput) return;

    let todos = [];
    try {
      const saved = await chrome.storage.local.get('quickTodos');
      todos = Array.isArray(saved.quickTodos) ? saved.quickTodos : [];
    } catch (e) {
      console.warn('Storage unavailable or empty for quickTodos:', e);
      todos = [];
    }

    const saveTodos = () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ quickTodos: todos });
        }
      } catch (err) {
        console.warn('Storage set failed:', err);
      }
    };

    const updateFooter = () => {
      const pending = todos.filter(t => (typeof t === 'object' && t !== null ? !Boolean(t.done || t.completed) : true)).length;
      if (todoPendingCount) todoPendingCount.textContent = pending;
      if (dockTasksBadge) {
        dockTasksBadge.textContent = pending;
        dockTasksBadge.classList.toggle('hidden', pending === 0);
      }
      if (notesFooterLeft) {
        notesFooterLeft.textContent = (todos.length - pending) + '/' + todos.length + ' done';
      }
      const pct = todos.length > 0 ? Math.round(((todos.length - pending) / todos.length) * 100) : 0;
      if (todoProgressFill) todoProgressFill.style.width = pct + '%';
    };

    const renderTodos = () => {
      todoList.innerHTML = '';

      if (todos.length === 0) {
        if (todoProgressBar) todoProgressBar.style.display = 'none';
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'todo-empty-state';
        emptyDiv.innerHTML = 
          '<div class="todo-empty-icon">' +
            '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>' +
              '<polyline points="22 4 12 14.01 9 11.01"></polyline>' +
            '</svg>' +
          '</div>' +
          '<p class="todo-empty-title">All caught up!</p>' +
          '<p class="todo-empty-subtitle">Add a task above to plan your day.</p>';
        todoList.appendChild(emptyDiv);
      } else {
        if (todoProgressBar) todoProgressBar.style.display = 'block';
        todos.forEach((todo, idx) => {
          const todoText = typeof todo === 'string' ? todo : (todo.text || todo.title || todo.name || '');
          const isDone = typeof todo === 'object' && todo !== null ? Boolean(todo.done || todo.completed) : false;

          const li = document.createElement('li');
          li.className = 'todo-item ' + (isDone ? 'done' : '');
          li.innerHTML = 
            '<label class="todo-item-label">' +
              '<input type="checkbox" class="todo-checkbox" ' + (isDone ? 'checked' : '') + ' data-idx="' + idx + '">' +
              '<span class="todo-text">' + escapeHtml(todoText) + '</span>' +
            '</label>' +
            '<button class="btn btn-icon btn-delete-todo" data-idx="' + idx + '" title="Delete task" aria-label="Delete task">' +
              '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>' +
            '</button>';
          todoList.appendChild(li);
        });

        todoList.querySelectorAll('.todo-checkbox').forEach(cb => {
          cb.addEventListener('change', (e) => {
            e.stopPropagation();
            const i = parseInt(e.target.dataset.idx, 10);
            if (todos[i]) {
              if (typeof todos[i] === 'object' && todos[i] !== null) {
                todos[i].done = e.target.checked;
              } else {
                todos[i] = { id: Date.now(), text: todos[i], done: e.target.checked };
              }
              saveTodos();
              renderTodos();
            }
          });
          cb.addEventListener('click', (e) => {
            e.stopPropagation();
          });
        });

        todoList.querySelectorAll('.btn-delete-todo').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const i = parseInt(btn.dataset.idx, 10);
            todos.splice(i, 1);
            saveTodos();
            renderTodos();
          });
        });
      }

      updateFooter();
    };

    const addNewTodo = () => {
      const text = newTodoInput.value.trim();
      if (!text) return;
      todos.unshift({ id: Date.now(), text: text, done: false });
      newTodoInput.value = '';
      saveTodos();
      renderTodos();
    };

    addTodoBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      addNewTodo();
    });

    newTodoInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        addNewTodo();
      }
    });

    clearDoneTodosBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const completedCount = todos.filter(t => (typeof t === 'object' && t !== null ? Boolean(t.done || t.completed) : false)).length;
      if (completedCount === 0) return;
      todos = todos.filter(t => (typeof t === 'object' && t !== null ? !Boolean(t.done || t.completed) : true));
      saveTodos();
      renderTodos();
      if (this.app && typeof this.app.showSnackbar === 'function') {
        this.app.showSnackbar('Cleared ' + completedCount + ' completed task(s).');
      }
    });

    renderTodos();
  }

  /* =========================================================
     3. POMODORO FOCUS TIMER
 (SmartTab & WebCatalog-style)
     ========================================================= */
  initPomodoro() {
    const widget = document.getElementById('pomodoroWidget');
    if (!widget) return;

    const timeDisplay = document.getElementById('pomoTimeDisplay');
    const startBtn = document.getElementById('pomoStartBtn');
    const resetBtn = document.getElementById('pomoResetBtn');
    const startBtnText = document.getElementById('pomoStartBtnText');
    const playIcon = document.getElementById('pomoPlayIcon');
    const pauseIcon = document.getElementById('pomoPauseIcon');
    const doneIcon = document.getElementById('pomoDoneIcon');
    const statusText = document.getElementById('pomoStatusText');
    const statusDot = document.getElementById('pomoStatusDot');
    const sessionCountEl = document.getElementById('pomoSessionCount');
    const progressFill = document.getElementById('pomoProgressFill');

    // Mode elements
    const modeBtns = widget.querySelectorAll('.pomo-mode-btn');
    const customOptions = document.getElementById('pomoCustomOptions');
    const customMinsText = document.getElementById('pomoCustomMinsText');
    const stepMinusBtn = document.getElementById('pomoStepMinus');
    const stepPlusBtn = document.getElementById('pomoStepPlus');

    let currentMode = 'focus'; // 'focus' | 'custom'
    const FOCUS_MINS = 25; // Focus is fixed to 25m
    let customMins = 30;   // Custom default 30m
    let timeLeft = FOCUS_MINS * 60;
    let totalDuration = timeLeft;
    let isRunning = false;
    let isFinished = false;
    let timerInterval = null;
    let completedSessions = 0;

    // Tab Title Flashing
    let titleInterval = null;
    let originalDocTitle = document.title || 'Tabvora Dashboard';

    const startTitleFlashing = () => {
      if (titleInterval) return;
      originalDocTitle = document.title || 'Tabvora Dashboard';
      let flip = false;
      titleInterval = setInterval(() => {
        document.title = flip ? "⏰ (00:00) Time's Up! • Tabvora" : "🔔 Finished! • Tabvora";
        flip = !flip;
      }, 1200);
    };

    const stopTitleFlashing = () => {
      if (titleInterval) {
        clearInterval(titleInterval);
        titleInterval = null;
        document.title = originalDocTitle;
      }
    };

    window.addEventListener('focus', () => {
      stopTitleFlashing();
    });

    const formatTime = (secs) => {
      const m = Math.floor(secs / 60).toString().padStart(2, '0');
      const s = (secs % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    };

    const updateUI = () => {
      if (timeDisplay) {
        if (isFinished) {
          timeDisplay.textContent = '00:00';
          timeDisplay.classList.add('finished');
        } else {
          timeDisplay.textContent = formatTime(timeLeft);
          timeDisplay.classList.remove('finished');
        }
      }
      
      const dockPomoBadge = document.getElementById('dockPomoBadge');
      if (dockPomoBadge) {
        dockPomoBadge.textContent = isFinished ? 'Done' : Math.ceil(timeLeft / 60) + 'm';
      }

      // Progress bar fill
      if (progressFill) {
        if (isFinished) {
          progressFill.style.width = '100%';
        } else {
          const pct = totalDuration > 0 ? Math.min(100, Math.max(0, ((totalDuration - timeLeft) / totalDuration) * 100)) : 0;
          progressFill.style.width = `${pct}%`;
        }
      }

      // Play/Pause / Got It button
      if (startBtn) {
        if (isFinished) {
          startBtn.className = 'pomo-btn-start pomo-finish-btn';
        } else {
          startBtn.classList.remove('pomo-finish-btn');
          startBtn.classList.toggle('btn-secondary', isRunning);
          startBtn.classList.toggle('btn-primary', !isRunning);
        }
      }
      if (startBtnText) {
        if (isFinished) {
          startBtnText.textContent = 'Got It';
        } else {
          startBtnText.textContent = isRunning ? 'Pause' : 'Start';
        }
      }
      if (playIcon && pauseIcon) {
        if (isFinished) {
          playIcon.classList.add('hidden');
          pauseIcon.classList.add('hidden');
          if (doneIcon) doneIcon.classList.remove('hidden');
        } else {
          if (doneIcon) doneIcon.classList.add('hidden');
          playIcon.classList.toggle('hidden', isRunning);
          pauseIcon.classList.toggle('hidden', !isRunning);
        }
      }

      // Status dot pulsing
      if (statusDot) {
        if (isFinished) {
          statusDot.className = 'pomo-status-dot finished';
        } else {
          statusDot.className = 'pomo-status-dot' + (isRunning ? ' active-pulse' : '');
        }
      }

      // Status text
      if (statusText) {
        if (isFinished) {
          statusText.textContent = currentMode === 'focus' ? '🎉 Focus session complete!' : "⏰ Time's up! Finished";
        } else if (isRunning) {
          statusText.textContent = currentMode === 'focus' ? 'Deep focus active' : 'Custom timer running';
        } else if (timeLeft < totalDuration) {
          statusText.textContent = 'Timer paused';
        } else {
          statusText.textContent = currentMode === 'focus' ? 'Ready to focus (25m)' : 'Ready to start';
        }
      }

      if (sessionCountEl) {
        sessionCountEl.textContent = `🎯 ${completedSessions} ${completedSessions === 1 ? 'Session' : 'Sessions'}`;
      }

      // Custom mins text in stepper
      if (customMinsText) {
        customMinsText.textContent = customMins;
      }
    };

    const saveState = () => {
      const state = {
        mode: currentMode,
        customMins,
        timeLeft,
        totalDuration,
        isRunning,
        isFinished,
        endTime: isRunning ? Date.now() + (timeLeft * 1000) : null,
        completedSessions
      };
      chrome.storage.local.set({ pomodoroState: state });

      if (isRunning && state.endTime) {
        try {
          chrome.alarms?.create('tabvora_pomodoro_finish', { when: state.endTime });
        } catch (e) {}
      } else {
        try {
          chrome.alarms?.clear('tabvora_pomodoro_finish');
        } catch (e) {}
      }
    };

    const switchMode = (mode) => {
      if (currentMode === mode && !isFinished) return;
      clearInterval(timerInterval);
      isRunning = false;
      isFinished = false;
      this.stopChimeSequence();
      stopTitleFlashing();
      try { chrome.notifications?.clear('tabvora-timer-finished'); } catch (e) {}
      currentMode = mode;

      modeBtns.forEach(btn => {
        const isActive = btn.dataset.mode === mode;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      if (mode === 'focus') {
        customOptions?.classList.add('hidden');
        timeLeft = FOCUS_MINS * 60;
        totalDuration = timeLeft;
      } else {
        customOptions?.classList.remove('hidden');
        timeLeft = customMins * 60;
        totalDuration = timeLeft;
      }

      updateUI();
      saveState();
    };

    const setCustomMins = (mins) => {
      customMins = Math.max(1, Math.min(180, mins));
      if (!isRunning && !isFinished) {
        timeLeft = customMins * 60;
        totalDuration = timeLeft;
        updateUI();
        saveState();
      } else {
        if (customMinsText) customMinsText.textContent = customMins;
      }
    };

    const onTimerComplete = (skipChime = false) => {
      clearInterval(timerInterval);
      isRunning = false;
      isFinished = true;
      timeLeft = 0;

      if (currentMode === 'focus') {
        completedSessions++;
        if (this.app?.showSnackbar) this.app.showSnackbar('🎉 Focus session completed! Great job!');
      } else {
        if (this.app?.showSnackbar) this.app.showSnackbar('⏰ Custom timer finished!');
      }

      if (!skipChime) {
        this.playChimeSequence(5, 2000);
      }

      this.showTimerNotification(currentMode);

      if (document.hidden) {
        startTitleFlashing();
      }

      updateUI();
      saveState();
    };

    const acknowledgeFinished = () => {
      if (!isFinished) return;
      isFinished = false;
      this.stopChimeSequence();
      stopTitleFlashing();
      try { chrome.notifications?.clear('tabvora-timer-finished'); } catch (e) {}
      timeLeft = (currentMode === 'focus' ? FOCUS_MINS : customMins) * 60;
      totalDuration = timeLeft;
      updateUI();
      saveState();
    };

    const tick = () => {
      if (timeLeft > 1) {
        timeLeft--;
        updateUI();
      } else {
        onTimerComplete(false);
      }
    };

    const startTimer = () => {
      if (isFinished) {
        acknowledgeFinished();
        return;
      }
      if (isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
      } else {
        isRunning = true;
        if (timeLeft <= 0) {
          timeLeft = (currentMode === 'focus' ? FOCUS_MINS : customMins) * 60;
          totalDuration = timeLeft;
        }
        timerInterval = setInterval(tick, 1000);
      }
      updateUI();
      saveState();
    };

    const resetTimer = () => {
      clearInterval(timerInterval);
      this.stopChimeSequence();
      stopTitleFlashing();
      try { chrome.notifications?.clear('tabvora-timer-finished'); } catch (e) {}
      isRunning = false;
      isFinished = false;
      timeLeft = (currentMode === 'focus' ? FOCUS_MINS : customMins) * 60;
      totalDuration = timeLeft;
      updateUI();
      saveState();
    };

    // Mode Switcher listeners
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    });

    // Custom Stepper listeners
    stepMinusBtn?.addEventListener('click', () => {
      const step = customMins <= 5 ? 1 : 5;
      setCustomMins(customMins - step);
    });

    stepPlusBtn?.addEventListener('click', () => {
      const step = customMins < 5 ? 1 : 5;
      setCustomMins(customMins + step);
    });

    // Start / Reset buttons
    startBtn?.addEventListener('click', startTimer);
    resetBtn?.addEventListener('click', resetTimer);

    // Cross-tab sync via storage change
    chrome.storage.onChanged?.addListener((changes, area) => {
      if (area === 'local' && changes.pomodoroState) {
        const state = changes.pomodoroState.newValue;
        if (!state) return;
        currentMode = state.mode || currentMode;
        customMins = state.customMins || customMins;
        completedSessions = state.completedSessions || completedSessions;

        modeBtns.forEach(btn => {
          const isActive = btn.dataset.mode === currentMode;
          btn.classList.toggle('active', isActive);
          btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        if (currentMode === 'focus') {
          customOptions?.classList.add('hidden');
        } else {
          customOptions?.classList.remove('hidden');
        }

        if (state.isFinished && !isFinished) {
          onTimerComplete(false);
        } else if (!state.isFinished && isFinished) {
          isFinished = false;
          stopTitleFlashing();
          this.stopChimeSequence();
          timeLeft = state.timeLeft || (currentMode === 'focus' ? FOCUS_MINS : customMins) * 60;
          totalDuration = state.totalDuration || timeLeft;
          isRunning = !!state.isRunning;
          if (isRunning) {
            clearInterval(timerInterval);
            timerInterval = setInterval(tick, 1000);
          }
          updateUI();
        }
      }
    });

    // Restore saved state
    chrome.storage.local.get('pomodoroState', ({ pomodoroState }) => {
      if (pomodoroState) {
        currentMode = pomodoroState.mode || 'focus';
        customMins = pomodoroState.customMins || 30;
        completedSessions = pomodoroState.completedSessions || 0;

        modeBtns.forEach(btn => {
          const isActive = btn.dataset.mode === currentMode;
          btn.classList.toggle('active', isActive);
          btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        if (currentMode === 'focus') {
          customOptions?.classList.add('hidden');
        } else {
          customOptions?.classList.remove('hidden');
        }

        if (pomodoroState.isFinished) {
          isFinished = true;
          isRunning = false;
          timeLeft = 0;
          totalDuration = pomodoroState.totalDuration || ((currentMode === 'focus' ? FOCUS_MINS : customMins) * 60);
        } else if (pomodoroState.isRunning && pomodoroState.endTime) {
          const remaining = Math.round((pomodoroState.endTime - Date.now()) / 1000);
          if (remaining > 0) {
            timeLeft = remaining;
            totalDuration = pomodoroState.totalDuration || ((currentMode === 'focus' ? FOCUS_MINS : customMins) * 60);
            isRunning = true;
            timerInterval = setInterval(tick, 1000);
          } else {
            // Expired while tab was closed/inactive
            isFinished = true;
            isRunning = false;
            timeLeft = 0;
            totalDuration = pomodoroState.totalDuration || ((currentMode === 'focus' ? FOCUS_MINS : customMins) * 60);
            this.playChimeSequence(2, 2200);
            this.showTimerNotification(currentMode);
          }
        } else {
          timeLeft = pomodoroState.timeLeft != null ? pomodoroState.timeLeft : ((currentMode === 'focus' ? FOCUS_MINS : customMins) * 60);
          totalDuration = pomodoroState.totalDuration || ((currentMode === 'focus' ? FOCUS_MINS : customMins) * 60);
          isRunning = false;
          isFinished = false;
        }
      }
      updateUI();
    });
  }

  showTimerNotification(mode) {
    if (!chrome.notifications) return;
    try {
      const isFocus = mode === 'focus';
      chrome.notifications.create('tabvora-timer-finished', {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: "⏰ Time's Up! • Tabvora",
        message: isFocus
          ? "Your 25-minute focus session is complete! Great work!"
          : "Your timer has reached 00:00!",
        buttons: [
          { title: "✓ Got It" },
          { title: "+5m (Snooze)" }
        ],
        requireInteraction: true,
        priority: 2
      });
    } catch (err) {
      console.warn('Could not trigger notification:', err);
    }
  }

  /* Synthesizes user-selected or default chime via Web Audio API */
  playChimeSound() {
    try {
      chrome.storage.local.get('activeSoundId', ({ activeSoundId }) => {
        if (typeof this.playSoundById === 'function') {
          this.playSoundById(activeSoundId || 'crystal');
        } else {
          const sound = SOUND_VAULT.find(s => s.id === (activeSoundId || 'crystal')) || SOUND_VAULT[0];
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
          sound.play(audioCtx, audioCtx.currentTime);
          setTimeout(() => {
            try { if (audioCtx && audioCtx.state !== 'closed') audioCtx.close(); } catch (_) {}
          }, 2500);
        }
      });
    } catch (err) {
      console.warn('Web Audio chime sound could not play:', err);
    }
  }

  playChimeSequence(pulses = 5, intervalMs = 2000) {
    this.stopChimeSequence();
    this.playChimeSound();
    this.chimeTimeouts = [];
    for (let i = 1; i < pulses; i++) {
      const tid = setTimeout(() => {
        this.playChimeSound();
      }, i * intervalMs);
      this.chimeTimeouts.push(tid);
    }
  }

  stopChimeSequence() {
    if (this.chimeTimeouts && this.chimeTimeouts.length > 0) {
      this.chimeTimeouts.forEach(tid => clearTimeout(tid));
      this.chimeTimeouts = [];
    }
  }


  /* =========================================================
     4. DAILY MAIN FOCUS (Momentum-style)
     ========================================================= */
  async initDailyFocus() {
    const prompt = document.getElementById('dailyFocusPrompt');
    const display = document.getElementById('dailyFocusDisplay');
    const input = document.getElementById('dailyFocusInput');
    const textEl = document.getElementById('dailyFocusText');
    const toggleBtn = document.getElementById('dailyFocusToggleBtn');
    const clearBtn = document.getElementById('dailyFocusClearBtn');

    if (!prompt || !input) return;

    const todayStr = new Date().toLocaleDateString('en-CA');
    const { dailyFocus } = await chrome.storage.local.get('dailyFocus');

    const renderFocus = (focusData) => {
      if (focusData && focusData.text && focusData.date === todayStr) {
        prompt.classList.add('hidden');
        display.classList.remove('hidden');
        if (textEl) textEl.textContent = focusData.text;
        textEl?.classList.toggle('completed', !!focusData.done);
        toggleBtn?.classList.toggle('checked', !!focusData.done);
      } else {
        prompt.classList.remove('hidden');
        display.classList.add('hidden');
        input.value = '';
      }
    };

    renderFocus(dailyFocus);

    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const val = input.value.trim();
        if (!val) return;
        const newFocus = { text: val, done: false, date: todayStr };
        await chrome.storage.local.set({ dailyFocus: newFocus });
        renderFocus(newFocus);
      }
    });

    toggleBtn?.addEventListener('click', async () => {
      const { dailyFocus: curr } = await chrome.storage.local.get('dailyFocus');
      if (curr) {
        curr.done = !curr.done;
        await chrome.storage.local.set({ dailyFocus: curr });
        renderFocus(curr);
      }
    });

    clearBtn?.addEventListener('click', async () => {
      await chrome.storage.local.remove('dailyFocus');
      renderFocus(null);
    });
  }

  /* =========================================================
     5. ZEN / FOCUS MODE (Bonjourr & Momentum Pro Minimalist Style)
     ========================================================= */
  initZenMode() {
    const zenBtn = document.getElementById('zenModeBtn');
    if (!zenBtn) return;

    const label = zenBtn.querySelector('.zen-btn-label') || zenBtn.querySelector('span:not(.zen-active-dot)');

    const toggleZen = (forceState) => {
      const isZen = forceState !== undefined ? forceState : !document.body.classList.contains('zen-mode');
      document.body.classList.toggle('zen-mode', isZen);
      zenBtn.classList.toggle('active', isZen);
      zenBtn.setAttribute('aria-pressed', isZen ? 'true' : 'false');
      chrome.storage.local.set({ isZenMode: isZen });

      if (isZen) {
        // text stays Zen
        zenBtn.title = 'Zen Mode Active • Click to exit (Esc)';
        if (this.app?.showSnackbar) {
          this.app.showSnackbar('🧘 Zen Mode Active. Click Zen or press Esc to exit.');
        }
      } else {
        if (label) label.textContent = 'Zen';
        zenBtn.title = 'Zen Focus Mode (Hide Distractions)';
        if (forceState === undefined && this.app?.showSnackbar) {
          this.app.showSnackbar('✨ Dashboard restored.');
        }
      }
    };

    zenBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleZen();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('zen-mode')) {
        toggleZen(false);
      }
    });

    chrome.storage.local.get('isZenMode', ({ isZenMode }) => {
      if (isZenMode) toggleZen(true);
    });
  }

  /* =========================================================
     6. SMART RAM SAVER / TAB SLEEP (Settings Native Inline Engine)
     ========================================================= */
  initRamSaver() {
    const ramBtn = document.getElementById('ramSaverBtn');
    if (!ramBtn) return;

    const iconSpan = document.getElementById('ramBtnIcon');
    const textSpan = document.getElementById('ramBtnText');
    const statusBadge = document.getElementById('ramStatusBadge');
    const indicatorText = document.getElementById('ramIndicatorText');

    let isCleaning = false;
    let resetTimer = null;

    ramBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (isCleaning) return;
      isCleaning = true;
      if (resetTimer) clearTimeout(resetTimer);

      // 1. Loading / In-Progress State
      ramBtn.disabled = true;
      ramBtn.classList.add('btn-optimizing');
      ramBtn.classList.remove('btn-optimized-success');

      if (iconSpan) {
        iconSpan.innerHTML = `<svg class="spin-ram-loader" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path></svg>`;
      }
      if (textSpan) textSpan.textContent = 'Optimizing Memory...';
      if (statusBadge) {
        statusBadge.textContent = 'Scanning...';
        statusBadge.style.background = 'rgba(59, 130, 246, 0.15)';
        statusBadge.style.color = '#3b82f6';
        statusBadge.style.borderColor = 'rgba(59, 130, 246, 0.3)';
      }
      if (indicatorText) indicatorText.textContent = 'Analyzing and sleeping idle background tabs...';

      try {
        let discardedCount = 0;

        if (chrome?.tabs?.query && chrome?.tabs?.discard) {
          const tabs = await chrome.tabs.query({ active: false });

          for (const tab of tabs) {
            if (tab.discarded || tab.audible || tab.pinned) continue;
            
            const url = (tab.url || '').toLowerCase();
            if (url.startsWith('chrome://') || url.startsWith('edge://') || url.startsWith('about:')) {
              continue;
            }

            try {
              await chrome.tabs.discard(tab.id);
              discardedCount++;
            } catch (discardErr) {
              // Protected tab or already discarded
            }
          }
        }

        // Natural micro-pause (~600ms) for tactile UI response
        await new Promise(resolve => setTimeout(resolve, 600));

        // 2. Success State (Green Tick & Success Message)
        ramBtn.classList.remove('btn-optimizing');
        ramBtn.classList.add('btn-optimized-success');

        if (iconSpan) {
          iconSpan.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        }

        if (discardedCount > 0) {
          if (textSpan) textSpan.textContent = `✓ ${discardedCount} Tab${discardedCount > 1 ? 's' : ''} Put to Sleep (Success)`;
          if (indicatorText) indicatorText.textContent = `Success: ${discardedCount} inactive tab${discardedCount > 1 ? 's' : ''} hibernated to free RAM`;
        } else {
          if (textSpan) textSpan.textContent = '✓ Memory Already Optimized!';
          if (indicatorText) indicatorText.textContent = 'All background tabs are already clean & optimized';
        }

        if (statusBadge) {
          statusBadge.textContent = '✓ Optimized';
          statusBadge.style.background = 'rgba(16, 185, 129, 0.18)';
          statusBadge.style.color = '#10b981';
          statusBadge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        }

        if (this.app?.showSnackbar) {
          const msg = discardedCount > 0
            ? `⚡ RAM Optimized: ${discardedCount} background tab(s) put to sleep safely.`
            : `⚡ Memory is clean. System is running at peak performance.`;
          this.app.showSnackbar(msg);
        }

        // 3. Reset to Ready after 3.2 seconds
        resetTimer = setTimeout(() => {
          ramBtn.classList.remove('btn-optimized-success');
          ramBtn.disabled = false;
          isCleaning = false;

          if (iconSpan) {
            iconSpan.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
          }
          if (textSpan) textSpan.textContent = 'Optimize Memory Now';
          if (statusBadge) {
            statusBadge.textContent = 'System Ready';
            statusBadge.style.background = '';
            statusBadge.style.color = '';
            statusBadge.style.borderColor = '';
          }
          if (indicatorText) indicatorText.textContent = 'Lossless Discard • Tabs restore immediately on click';
        }, 3200);

      } catch (err) {
        console.error('Error in RAM Saver:', err);
        ramBtn.classList.remove('btn-optimizing', 'btn-optimized-success');
        ramBtn.disabled = false;
        isCleaning = false;

        if (iconSpan) {
          iconSpan.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
        }
        if (textSpan) textSpan.textContent = 'Optimize Memory Now';
        if (statusBadge) {
          statusBadge.textContent = 'System Ready';
          statusBadge.style.background = '';
          statusBadge.style.color = '';
          statusBadge.style.borderColor = '';
        }
        if (this.app?.showSnackbar) {
          this.app.showSnackbar('Memory optimization completed.');
        }
      }
    });
  }

  /* =========================================================
     7. FLOATING CORNER DOCK & FLYOUT TRAYS (Momentum & Infinity style)
     ========================================================= */
  initDock() {
    const dockTasksBtn = document.getElementById('dockTasksBtn');
    const dockNotesBtn = document.getElementById('dockNotesBtn');
    const dockAppsBtn = document.getElementById('dockAppsBtn');
    const dockTimersBtn = document.getElementById('dockTimersBtn');
    const dockRewardsBtn = document.getElementById('dockRewardsBtn') || document.getElementById('dockWallpaperBtn');

    const tasksWidget = document.getElementById('tasksWidget');
    const notesWidget = document.getElementById('notesWidget');
    const appsWidget = document.getElementById('appsWidget');
    const pomoWidget = document.getElementById('pomodoroWidget');
    const rewardsWidget = document.getElementById('rewardsWidget');

    const closeAll = () => {
      tasksWidget?.classList.remove('flyout-active');
      notesWidget?.classList.remove('flyout-active');
      appsWidget?.classList.remove('flyout-active');
      pomoWidget?.classList.remove('flyout-active');
      rewardsWidget?.classList.remove('flyout-active');

      dockTasksBtn?.classList.remove('active');
      dockNotesBtn?.classList.remove('active');
      dockAppsBtn?.classList.remove('active');
      dockTimersBtn?.classList.remove('active');
      dockRewardsBtn?.classList.remove('active');
    };

    // 1. Tasks button -> Open dedicated tasksWidget
    dockTasksBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasActive = dockTasksBtn.classList.contains('active');
      closeAll();
      if (!wasActive) {
        tasksWidget?.classList.add('flyout-active');
        dockTasksBtn.classList.add('active');
        document.getElementById('newTodoInput')?.focus();
      }
    });

    // 2. Notes button -> Open dedicated notesWidget
    dockNotesBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasActive = dockNotesBtn.classList.contains('active');
      closeAll();
      if (!wasActive) {
        notesWidget?.classList.add('flyout-active');
        dockNotesBtn.classList.add('active');
        if (typeof this.adjustNotesHeight === 'function') {
          this.adjustNotesHeight();
        }
        setTimeout(() => {
          document.getElementById('quickNotesInput')?.focus();
        }, 50);
      }
    });

    // 3. Apps button -> Open appsWidget Launchpad
    dockAppsBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasActive = dockAppsBtn.classList.contains('active');
      closeAll();
      if (!wasActive) {
        appsWidget?.classList.add('flyout-active');
        dockAppsBtn.classList.add('active');
        if (this.app?.refreshData) {
          this.app.refreshData();
        } else if (this.app?.grid?.recalculateLayout) {
          this.app.grid.recalculateLayout();
        }
      }
    });

    // 4. Timers button -> Open Pomodoro timer
    dockTimersBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasActive = dockTimersBtn.classList.contains('active');
      closeAll();
      if (!wasActive) {
        pomoWidget?.classList.add('flyout-active');
        dockTimersBtn.classList.add('active');
      }
    });

    // 5. Rewards Vault button -> Open Rewards Vault flyout drawer
    dockRewardsBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasActive = dockRewardsBtn.classList.contains('active');
      closeAll();
      if (!wasActive) {
        rewardsWidget?.classList.add('flyout-active');
        dockRewardsBtn.classList.add('active');
        if (typeof this.refreshRewardsView === 'function') {
          this.refreshRewardsView();
        }
      }
    });

    // Stop propagation from within flyout container so inner interactions don't close flyouts
    const dockFlyoutWrapper = document.getElementById('dockFlyoutWrapper');
    dockFlyoutWrapper?.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Click outside to close flyouts
    document.addEventListener('click', (e) => {
      if (!e.target.isConnected) return;
      if (!e.target.closest('.sidebar-floating-dock') && 
          !e.target.closest('.dock-flyout-wrapper') &&
          !e.target.closest('.modal')) {
        closeAll();
      }
    });

    // Escape closes active flyouts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAll();
      }
    });
  }

  /* =========================================================
     8. CINEMATIC WALLPAPER ENGINE (Momentum & Infinity style)
     ========================================================= */
  async initWallpaper() {
    this.applyWallpaper = (wpId) => {
      const selected = WALLPAPER_VAULT.find(w => w.id === wpId || (w.aliasId && w.aliasId === wpId)) || WALLPAPER_VAULT[0];
      if (this.dynamicBg) {
        this.dynamicBg.render(selected);
      } else {
        const mediaEl = document.getElementById('tabvoraBgMedia');
        if (mediaEl) {
          if (selected.file) {
            mediaEl.style.backgroundImage = `url("${selected.file}")`;
          } else if (selected.gradient) {
            mediaEl.style.backgroundImage = selected.gradient;
          }
        }
        document.body.style.backgroundColor = '#0b101b';
        document.body.style.backgroundImage = 'none';
      }

      if (this.app && this.app.settings && this.app.settings.bgType !== 'default') {
        this.app.settings.bgType = 'default';
        chrome.storage.local.set({ settings: this.app.settings });
      }
      return selected;
    };

    const { activeWallpaper } = await chrome.storage.local.get('activeWallpaper');
    const curr = activeWallpaper || 'river';
    this.applyWallpaper(curr);

    this.cycleWallpaper = async () => {
      const { activeWallpaper, unlockedWallpapers = ['river', 'forest', 'lake', 'pyrenees'] } = await chrome.storage.local.get(['activeWallpaper', 'unlockedWallpapers']);
      const available = WALLPAPER_VAULT.filter(w => (Array.isArray(unlockedWallpapers) && (unlockedWallpapers.includes(w.id) || (w.aliasId && unlockedWallpapers.includes(w.aliasId)))) || w.cost === 0);
      const currId = activeWallpaper || 'river';
      const currIdx = available.findIndex(w => w.id === currId || (w.aliasId && w.aliasId === currId));
      const nextIdx = (currIdx + 1) % (available.length || 1);
      const nextWp = available[nextIdx] || available[0] || WALLPAPER_VAULT[0];

      this.applyWallpaper(nextWp.id);
      await chrome.storage.local.set({ activeWallpaper: nextWp.id });
      if (this.app && typeof this.app.applyBackgroundStyle === 'function') {
        this.app.applyBackgroundStyle();
      }

      if (this.app && typeof this.app.showSnackbar === 'function') {
        this.app.showSnackbar(`Wallpaper: ${nextWp.name}`);
      }
    };
  }

  /* =========================================================
     8B. REWARDS VAULT & SOUND ENGINE (Gamified Points & Audio)
     ========================================================= */
  initRewards() {
    const rewardsWidget = document.getElementById('rewardsWidget');
    if (!rewardsWidget) return;

    const tabWallpapers = document.getElementById('rewardsTabWallpapers');
    const tabSounds = document.getElementById('rewardsTabSounds');
    const panelWallpapers = document.getElementById('rewardsWallpapersPanel');
    const panelSounds = document.getElementById('rewardsSoundsPanel');

    // Dual Tab switching
    tabWallpapers?.addEventListener('click', () => {
      tabWallpapers.classList.add('active');
      tabWallpapers.setAttribute('aria-selected', 'true');
      tabSounds?.classList.remove('active');
      tabSounds?.setAttribute('aria-selected', 'false');
      panelWallpapers?.classList.remove('hidden');
      panelSounds?.classList.add('hidden');
    });

    tabSounds?.addEventListener('click', () => {
      tabSounds.classList.add('active');
      tabSounds.setAttribute('aria-selected', 'true');
      tabWallpapers?.classList.remove('active');
      tabWallpapers?.setAttribute('aria-selected', 'false');
      panelSounds?.classList.remove('hidden');
      panelWallpapers?.classList.add('hidden');
    });

    // Sound Synthesizer Dispatcher (Bulletproof async AudioContext)
    this.playSoundById = async (soundId) => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        const sound = SOUND_VAULT.find(s => s.id === soundId) || SOUND_VAULT[0];
        if (sound && typeof sound.play === 'function') {
          sound.play(ctx, ctx.currentTime);
          setTimeout(() => {
            try { if (ctx && ctx.state !== 'closed') ctx.close(); } catch (_) {}
          }, 2500);
        }
      } catch (err) {
        console.warn('Web Audio error:', err);
      }
    };

    // Sound Preview with Visual Pulse and Snackbar
    this.previewSound = (soundId, btnEl) => {
      this.playSoundById(soundId);
      if (btnEl) {
        btnEl.classList.add('playing');
        setTimeout(() => {
          btnEl.classList.remove('playing');
        }, 1100);
      }
      if (this.app && typeof this.app.showSnackbar === 'function') {
        const sound = SOUND_VAULT.find(s => s.id === soundId);
        if (sound) this.app.showSnackbar(`🎶 Playing: ${sound.name}`);
      }
    };

    // Live Fullscreen Wallpaper Preview HUD
    let currentPreviewWp = null;

    const closeWallpaperPreview = async () => {
      if (!currentPreviewWp) return;
      const { activeWallpaper } = await chrome.storage.local.get('activeWallpaper');
      this.applyWallpaper(activeWallpaper || 'river');
      currentPreviewWp = null;
      const hud = document.getElementById('wallpaperPreviewHUD');
      if (hud) hud.remove();
    };

    const startWallpaperPreview = async (wp) => {
      currentPreviewWp = wp;
      // Temporarily apply wallpaper to background for live visual review
      if (this.dynamicBg) {
        this.dynamicBg.render(wp);
      } else {
        const mediaEl = document.getElementById('tabvoraBgMedia');
        if (mediaEl) {
          if (wp.file) {
            mediaEl.style.backgroundImage = `url("${wp.file}")`;
          } else if (wp.gradient) {
            mediaEl.style.backgroundImage = wp.gradient;
          }
        }
        document.body.style.backgroundColor = '#080d1a';
        document.body.style.backgroundImage = 'none';
      }

      const { unlockedWallpapers = ['river', 'forest', 'lake', 'pyrenees'], activeWallpaper } = await chrome.storage.local.get(['unlockedWallpapers', 'activeWallpaper']);
      const isUnlocked = wp.cost === 0 || (Array.isArray(unlockedWallpapers) && (unlockedWallpapers.includes(wp.id) || (wp.aliasId && unlockedWallpapers.includes(wp.aliasId))));
      const isActive = (activeWallpaper === wp.id) || (wp.aliasId && activeWallpaper === wp.aliasId);

      let hud = document.getElementById('wallpaperPreviewHUD');
      if (!hud) {
        hud = document.createElement('div');
        hud.id = 'wallpaperPreviewHUD';
        hud.className = 'wallpaper-preview-hud';
        document.body.appendChild(hud);
      }

      hud.innerHTML = `
        <div class="preview-hud-title">
          <span>👁️ Preview:</span>
          <strong>${escapeHtml(wp.name)}</strong>
        </div>
        ${
          wp.type === '360'
            ? `<div class="hud-360-pan-group">
                <button type="button" class="preview-hud-btn btn-pan" id="hudPanLeftBtn" title="Pan Left (←)">◀ Left</button>
                <button type="button" class="preview-hud-btn btn-pan" id="hudPanRightBtn" title="Pan Right (→)">Right ▶</button>
               </div>`
            : ''
        }
        ${
          isUnlocked
            ? `<button type="button" class="preview-hud-btn btn-apply" id="hudApplyBtn">${isActive ? 'Re-apply' : 'Apply'} Wallpaper</button>`
            : `<button type="button" class="preview-hud-btn btn-unlock" id="hudUnlockBtn">Unlock (❤️ ${wp.cost})</button>`
        }
        <button type="button" class="preview-hud-btn btn-close" id="hudExitBtn" title="Exit Preview">Exit Preview ✕</button>
      `;

      document.getElementById('hudPanLeftBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.dynamicBg) this.dynamicBg.stepPan(160);
      });

      document.getElementById('hudPanRightBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.dynamicBg) this.dynamicBg.stepPan(-160);
      });

      document.getElementById('hudExitBtn')?.addEventListener('click', () => {
        closeWallpaperPreview();
      });

      document.getElementById('hudApplyBtn')?.addEventListener('click', async () => {
        this.applyWallpaper(wp.id);
        await chrome.storage.local.set({ activeWallpaper: wp.id });
        if (this.app && typeof this.app.applyBackgroundStyle === 'function') {
          this.app.applyBackgroundStyle();
        }
        currentPreviewWp = null;
        hud.remove();
        this.refreshRewardsView();
        if (this.app && typeof this.app.showSnackbar === 'function') {
          this.app.showSnackbar(`✨ Wallpaper applied: ${wp.name}`);
        }
      });

      document.getElementById('hudUnlockBtn')?.addEventListener('click', () => {
        openUnlockDialog(wp, 'wallpaper');
      });
    };

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && currentPreviewWp) {
        closeWallpaperPreview();
      }
    });

    // Unlock Confirmation Dialog
    const unlockModal = document.getElementById('rewardUnlockModal');
    const closeUnlockModalBtn = document.getElementById('closeUnlockModalBtn');
    const unlockItemIcon = document.getElementById('unlockItemIcon');
    const unlockItemName = document.getElementById('unlockItemName');
    const unlockItemCostText = document.getElementById('unlockItemCostText');
    const unlockCurrentBalText = document.getElementById('unlockCurrentBalText');
    const unlockRemainingBalText = document.getElementById('unlockRemainingBalText');
    const unlockBalanceLabel = document.getElementById('unlockBalanceLabel');
    const unlockNoticeText = document.getElementById('unlockNoticeText');
    const confirmUnlockBtn = document.getElementById('confirmUnlockBtn');
    const cancelUnlockBtn = document.getElementById('cancelUnlockBtn');

    let pendingUnlock = null;

    const handleCloseUnlockDialog = () => {
      pendingUnlock = null;
      unlockModal?.close();
    };

    closeUnlockModalBtn?.addEventListener('click', handleCloseUnlockDialog);
    cancelUnlockBtn?.addEventListener('click', handleCloseUnlockDialog);

    unlockModal?.addEventListener('click', (e) => {
      if (e.target === unlockModal) {
        handleCloseUnlockDialog();
      }
    });

    confirmUnlockBtn?.addEventListener('click', async () => {
      if (!pendingUnlock) return;
      const { item, type } = pendingUnlock;
      const {
        user_points = 0,
        unlockedWallpapers = ['river', 'forest', 'lake', 'pyrenees'],
        unlockedSounds = ['crystal']
      } = await chrome.storage.local.get(['user_points', 'unlockedWallpapers', 'unlockedSounds']);

      if (user_points < item.cost) {
        return;
      }

      const newPoints = user_points - item.cost;
      const updates = { user_points: newPoints };

      if (type === 'wallpaper') {
        const wpList = Array.isArray(unlockedWallpapers) ? [...unlockedWallpapers] : ['river', 'forest', 'lake', 'pyrenees'];
        if (!wpList.includes(item.id)) wpList.push(item.id);
        updates.unlockedWallpapers = wpList;
        updates.activeWallpaper = item.id;
        this.applyWallpaper(item.id);
        if (currentPreviewWp) {
          const hud = document.getElementById('wallpaperPreviewHUD');
          if (hud) hud.remove();
          currentPreviewWp = null;
        }
      } else if (type === 'sound') {
        const sndList = Array.isArray(unlockedSounds) ? [...unlockedSounds] : ['crystal'];
        if (!sndList.includes(item.id)) sndList.push(item.id);
        updates.unlockedSounds = sndList;
        updates.activeSoundId = item.id;
        this.playSoundById(item.id);
      }

      await chrome.storage.local.set(updates);

      if (type === 'wallpaper' && this.app && typeof this.app.applyBackgroundStyle === 'function') {
        this.app.applyBackgroundStyle();
      }

      // Sync across open UI elements
      if (this.app && typeof this.app.updatePointsUI === 'function') {
        this.app.updatePointsUI(newPoints);
      }
      this.refreshRewardsView();

      unlockModal?.close();
      pendingUnlock = null;

      if (this.app && typeof this.app.showSnackbar === 'function') {
        this.app.showSnackbar(`✨ Unlocked: ${item.name}! Applied successfully.`);
      }
    });

    const openUnlockDialog = async (item, type) => {
      const { user_points = 0 } = await chrome.storage.local.get('user_points');
      pendingUnlock = { item, type };

      const unlockWpPreview = document.getElementById('unlockWpPreview');
      const unlockWpImage = document.getElementById('unlockWpImage');
      const unlockSoundPreview = document.getElementById('unlockSoundPreview');
      const unlockModalPlayBtn = document.getElementById('unlockModalPlayBtn');
      const unlockSoundDesc = document.getElementById('unlockSoundDesc');
      const unlockBalanceLabel = document.getElementById('unlockBalanceLabel');

      if (type === 'wallpaper') {
        if (unlockWpPreview) {
          unlockWpPreview.classList.remove('hidden');
          unlockWpPreview.style.display = 'block';
        }
        if (unlockSoundPreview) {
          unlockSoundPreview.classList.add('hidden');
          unlockSoundPreview.style.display = 'none';
        }
        if (unlockWpImage) {
          if (item.file) {
            unlockWpImage.style.backgroundImage = `url("${item.file}")`;
          } else if (item.gradient) {
            unlockWpImage.style.backgroundImage = item.gradient;
          }
        }
        if (unlockModalTitle) unlockModalTitle.textContent = 'Unlock Wallpaper';
      } else {
        if (unlockWpPreview) {
          unlockWpPreview.classList.add('hidden');
          unlockWpPreview.style.display = 'none';
        }
        if (unlockSoundPreview) {
          unlockSoundPreview.classList.remove('hidden');
          unlockSoundPreview.style.display = 'flex';
        }
        if (unlockSoundDesc) unlockSoundDesc.textContent = item.desc || 'Custom notification chime alert';
        if (unlockModalTitle) unlockModalTitle.textContent = 'Unlock Sound Chime';

        if (unlockModalPlayBtn) {
          unlockModalPlayBtn.onclick = (e) => {
            e.stopPropagation();
            this.previewSound(item.id, unlockModalPlayBtn);
          };
        }
      }

      if (unlockItemName) unlockItemName.textContent = item.name;
      if (unlockItemCostText) unlockItemCostText.textContent = `❤️ ${item.cost} Hearts`;
      if (unlockCurrentBalText) unlockCurrentBalText.textContent = `${user_points} Hearts`;

      const remaining = user_points - item.cost;
      if (user_points < item.cost) {
        if (unlockBalanceLabel) unlockBalanceLabel.textContent = 'Status';
        if (unlockRemainingBalText) {
          unlockRemainingBalText.textContent = 'Insufficient Hearts';
          unlockRemainingBalText.className = 'cost-value text-danger-badge';
        }
        if (unlockNoticeText) {
          unlockNoticeText.innerHTML = `<span>⚠️ You need <strong>${item.cost - user_points} more Hearts</strong>! Check in daily to earn Hearts.</span>`;
          unlockNoticeText.classList.remove('hidden');
          unlockNoticeText.style.display = 'flex';
        }
        if (confirmUnlockBtn) {
          confirmUnlockBtn.disabled = true;
          confirmUnlockBtn.style.opacity = '0.45';
          confirmUnlockBtn.style.cursor = 'not-allowed';
        }
      } else {
        if (unlockBalanceLabel) unlockBalanceLabel.textContent = 'Hearts After';
        if (unlockRemainingBalText) {
          unlockRemainingBalText.textContent = `${remaining} Hearts`;
          unlockRemainingBalText.className = 'cost-value text-emerald';
        }
        if (unlockNoticeText) {
          unlockNoticeText.classList.add('hidden');
          unlockNoticeText.style.display = 'none';
        }
        if (confirmUnlockBtn) {
          confirmUnlockBtn.disabled = false;
          confirmUnlockBtn.style.opacity = '1';
          confirmUnlockBtn.style.cursor = 'pointer';
        }
      }

      unlockModal?.showModal();
    };

    // Render Wallpapers and Sounds views
    this.refreshRewardsView = async () => {
      try {
        const {
          user_points = 0,
          unlockedWallpapers = ['river', 'forest', 'lake', 'pyrenees'],
          activeWallpaper = 'river',
          unlockedSounds = ['crystal'],
          activeSoundId = 'crystal'
        } = await chrome.storage.local.get(['user_points', 'unlockedWallpapers', 'activeWallpaper', 'unlockedSounds', 'activeSoundId']);

        // Update Points in Drawer Header
        const ptsEl = document.getElementById('rewardsVaultPointsText');
        if (ptsEl) ptsEl.textContent = user_points;

        // 1. Render Wallpapers List
        const wpContainer = document.getElementById('rewardsWallpaperList');
        if (wpContainer) {
          wpContainer.innerHTML = '';
          WALLPAPER_VAULT.forEach(wp => {
            const isUnlocked = wp.cost === 0 || (Array.isArray(unlockedWallpapers) && (unlockedWallpapers.includes(wp.id) || (wp.aliasId && unlockedWallpapers.includes(wp.aliasId))));
            const isActive = activeWallpaper === wp.id || (wp.aliasId && activeWallpaper === wp.aliasId);

            const card = document.createElement('div');
            card.className = `reward-wp-card ${isActive ? 'active-card' : ''}`;

            const thumb = document.createElement('div');
            thumb.className = 'reward-wp-thumb';
            thumb.title = `Click to preview ${wp.name}`;
            if (wp.file) {
              thumb.style.backgroundImage = `url("${wp.file}")`;
            } else if (wp.gradient) {
              thumb.style.backgroundImage = wp.gradient;
            }

            // Thumbnail click triggers live preview
            thumb.addEventListener('click', () => startWallpaperPreview(wp));

            if (isActive) {
              const badge = document.createElement('span');
              badge.className = 'reward-wp-badge active-badge';
              badge.textContent = '✓ Active';
              thumb.appendChild(badge);
            } else if (!isUnlocked) {
              const badge = document.createElement('span');
              badge.className = 'reward-wp-badge locked-badge';
              badge.textContent = `❤️ ${wp.cost}`;
              thumb.appendChild(badge);
            }

            card.appendChild(thumb);

            const info = document.createElement('div');
            info.className = 'reward-wp-info';

            const title = document.createElement('span');
            title.className = 'reward-wp-name';
            title.textContent = wp.name;
            title.title = wp.name;
            info.appendChild(title);

            const btnRow = document.createElement('div');
            btnRow.className = 'reward-btn-row';

            // Preview button
            const previewBtn = document.createElement('button');
            previewBtn.type = 'button';
            previewBtn.className = 'reward-action-btn preview-btn';
            previewBtn.textContent = 'Preview';
            previewBtn.title = `Full preview of ${wp.name}`;
            previewBtn.addEventListener('click', () => startWallpaperPreview(wp));
            btnRow.appendChild(previewBtn);

            if (isActive) {
              const activeBtn = document.createElement('button');
              activeBtn.type = 'button';
              activeBtn.className = 'reward-action-btn active-now';
              activeBtn.textContent = 'Active';
              activeBtn.title = 'Active wallpaper (Click to re-apply)';
              activeBtn.addEventListener('click', async () => {
                this.applyWallpaper(wp.id);
                await chrome.storage.local.set({ activeWallpaper: wp.id });
                if (this.app && typeof this.app.applyBackgroundStyle === 'function') {
                  this.app.applyBackgroundStyle();
                }
                if (this.app && typeof this.app.showSnackbar === 'function') {
                  this.app.showSnackbar(`Wallpaper applied: ${wp.name}`);
                }
              });
              btnRow.appendChild(activeBtn);
            } else if (isUnlocked) {
              const applyBtn = document.createElement('button');
              applyBtn.type = 'button';
              applyBtn.className = 'reward-action-btn apply-btn';
              applyBtn.textContent = 'Apply';
              applyBtn.addEventListener('click', async () => {
                this.applyWallpaper(wp.id);
                await chrome.storage.local.set({ activeWallpaper: wp.id });
                if (this.app && typeof this.app.applyBackgroundStyle === 'function') {
                  this.app.applyBackgroundStyle();
                }
                this.refreshRewardsView();
                if (this.app && typeof this.app.showSnackbar === 'function') {
                  this.app.showSnackbar(`Wallpaper applied: ${wp.name}`);
                }
              });
              btnRow.appendChild(applyBtn);
            } else {
              const unlockBtn = document.createElement('button');
              unlockBtn.type = 'button';
              unlockBtn.className = 'reward-action-btn unlock-btn';
              unlockBtn.textContent = 'Unlock';
              unlockBtn.title = `Unlock for ${wp.cost} Hearts`;
              unlockBtn.addEventListener('click', () => openUnlockDialog(wp, 'wallpaper'));
              btnRow.appendChild(unlockBtn);
            }

            info.appendChild(btnRow);
            card.appendChild(info);

            wpContainer.appendChild(card);
          });
        }

        // 2. Render Sound Chimes List
        const soundContainer = document.getElementById('rewardsSoundList');
        if (soundContainer) {
          soundContainer.innerHTML = '';
          SOUND_VAULT.forEach(sound => {
            const isUnlocked = sound.cost === 0 || (Array.isArray(unlockedSounds) && unlockedSounds.includes(sound.id));
            const isActive = activeSoundId === sound.id;

            const card = document.createElement('div');
            card.className = `reward-sound-card ${isActive ? 'active-sound' : ''}`;

            const left = document.createElement('div');
            left.className = 'sound-card-left';
            left.style.cursor = 'pointer';
            left.title = `Click to listen to ${sound.name}`;

            const playBtn = document.createElement('button');
            playBtn.type = 'button';
            playBtn.className = 'sound-play-preview-btn';
            playBtn.title = `Preview ${sound.name}`;
            playBtn.setAttribute('aria-label', `Play ${sound.name}`);
            playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
            playBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              this.previewSound(sound.id, playBtn);
            });
            left.appendChild(playBtn);

            const details = document.createElement('div');
            details.className = 'sound-details';

            const nameEl = document.createElement('span');
            nameEl.className = 'sound-title';
            nameEl.textContent = sound.name;
            if (!isUnlocked) {
              const chip = document.createElement('span');
              chip.className = 'sound-cost-chip';
              chip.textContent = `❤️ ${sound.cost}`;
              nameEl.appendChild(chip);
            }
            details.appendChild(nameEl);

            const subEl = document.createElement('span');
            subEl.className = 'sound-subtitle';
            subEl.textContent = sound.desc;
            details.appendChild(subEl);

            left.appendChild(details);

            // Clicking anywhere on left plays preview sound
            left.addEventListener('click', () => this.previewSound(sound.id, playBtn));

            card.appendChild(left);

            const right = document.createElement('div');
            right.className = 'sound-card-right';

            const actBtn = document.createElement('button');
            actBtn.type = 'button';
            if (isActive) {
              actBtn.className = 'sound-btn btn-active-chime';
              actBtn.textContent = 'Active';
              actBtn.disabled = true;
            } else if (isUnlocked) {
              actBtn.className = 'sound-btn btn-select-chime';
              actBtn.textContent = 'Select';
              actBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await this.playSoundById(sound.id);
                await chrome.storage.local.set({ activeSoundId: sound.id });
                this.refreshRewardsView();
                if (this.app && typeof this.app.showSnackbar === 'function') {
                  this.app.showSnackbar(`🔔 Sound activated: ${sound.name}`);
                }
              });
            } else {
              actBtn.className = 'sound-btn btn-unlock-chime';
              actBtn.textContent = 'Unlock';
              actBtn.title = `Unlock for ${sound.cost} Hearts`;
              actBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openUnlockDialog(sound, 'sound');
              });
            }
            right.appendChild(actBtn);
            card.appendChild(right);

            soundContainer.appendChild(card);
          });
        }
      } catch (err) {
        console.error('Error refreshing rewards view:', err);
      }
    };

    // Initial render
    this.refreshRewardsView();
  }

  /* =========================================================
     9. MOMENTUM-STYLE DAILY INSPIRATIONAL QUOTES (Smart 10s Auto-Rotate)
     ========================================================= */
  initQuotes() {
    const quotes = [
      // 1. Perseverance & Patience (ধৈর্য ও সহনশীলতা)
      { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
      { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
      { text: "Patience and perseverance have a magical effect before which difficulties disappear and obstacles vanish.", author: "John Quincy Adams" },
      { text: "If you are going through hell, keep going.", author: "Winston Churchill" },
      { text: "A river cuts through rock, not because of its power, but because of its persistence.", author: "Jim Watkins" },
      { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
      { text: "Patience is bitter, but its fruit is sweet.", author: "Aristotle" },
      { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
      { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
      { text: "Through perseverance many people win success out of what seemed destined to be certain failure.", author: "Anne Sullivan" },
      { text: "Our greatest glory is not in never falling, but in rising every time we fall.", author: "Confucius" },
      { text: "With patience and time, the mulberry leaf becomes a silk gown.", author: "Chinese Proverb" },
      { text: "Never give up on a dream just because of the time it will take to accomplish it. The time will pass anyway.", author: "Earl Nightingale" },
      { text: "Perseverance is not a long race; it is many short races one after the other.", author: "Walter Elliot" },
      { text: "Rivers know this: there is no hurry. We shall get there some day.", author: "A.A. Milne" },
      { text: "Turn your wounds into wisdom.", author: "Oprah Winfrey" },

      // 2. Hard Work & Dedication (পরিশ্রম ও একাগ্রতা)
      { text: "Hard work beats talent when talent fails to work hard.", author: "Tim Notke" },
      { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
      { text: "Genius is one percent inspiration and ninety-nine percent perspiration.", author: "Thomas Edison" },
      { text: "There is no substitute for hard work.", author: "Thomas Edison" },
      { text: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
      { text: "Work hard in silence, let your success be your noise.", author: "Frank Ocean" },
      { text: "Dreams don't work unless you do.", author: "John C. Maxwell" },
      { text: "Opportunities are usually disguised as hard work, so most people don't recognize them.", author: "Ann Landers" },
      { text: "Satisfaction lies in the effort, not in the attainment. Full effort is full victory.", author: "Mahatma Gandhi" },
      { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
      { text: "Great things are done by a series of small things brought together.", author: "Vincent Van Gogh" },
      { text: "I never dreamed about success. I worked for it.", author: "Estée Lauder" },
      { text: "Success is no accident. It is hard work, perseverance, learning, and love of what you are doing.", author: "Pelé" },
      { text: "Do not wait to strike till the iron is hot; but make it hot by striking.", author: "William Butler Yeats" },
      { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant" },
      { text: "Either you run the day or the day runs you.", author: "Jim Rohn" },

      // 3. Honesty & Integrity (সততা ও নীতিবোধ)
      { text: "Honesty is the first chapter in the book of wisdom.", author: "Thomas Jefferson" },
      { text: "Real integrity is doing the right thing, knowing that nobody's going to know whether you did it or not.", author: "Oprah Winfrey" },
      { text: "Integrity is doing the right thing, even when no one is watching.", author: "C.S. Lewis" },
      { text: "Whoever is careless with the truth in small matters cannot be trusted with important matters.", author: "Albert Einstein" },
      { text: "Truth is the only safe ground to stand upon.", author: "Elizabeth Cady Stanton" },
      { text: "No legacy is so rich as honesty.", author: "William Shakespeare" },
      { text: "The time is always right to do what is right.", author: "Martin Luther King Jr." },
      { text: "Character is like a tree and reputation like a shadow. The shadow is what we think of it; the tree is the real thing.", author: "Abraham Lincoln" },
      { text: "Live so that when your children think of fairness, caring, and integrity, they think of you.", author: "H. Jackson Brown Jr." },
      { text: "Honesty and transparency make you vulnerable. Be honest and transparent anyway.", author: "Mother Teresa" },
      { text: "Truth will always be truth, regardless of lack of understanding, disbelief or ignorance.", author: "W. Clement Stone" },

      // 4. Success & Achievement (সাফল্য ও অগ্রগতি)
      { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
      { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
      { text: "There are no secrets to success. It is the result of preparation, hard work, and learning from failure.", author: "Colin Powell" },
      { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
      { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
      { text: "The road to success and the road to failure are almost exactly the same.", author: "Colin R. Davis" },
      { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
      { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
      { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
      { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
      { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
      { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
      { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
      { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },

      // 5. Focus & Daily Motivation (একাগ্রতা ও কর্মপ্রেরণা)
      { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
      { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
      { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
      { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
      { text: "What you do today can improve all your tomorrows.", author: "Ralph Marston" },
      { text: "Make each day your masterpiece.", author: "John Wooden" },
      { text: "Concentrate all your thoughts upon the work in hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
      { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" }
    ];

    const quoteContainer = document.getElementById('quoteContainer');
    const quoteText = document.getElementById('quoteText');
    const quoteAuthor = document.getElementById('quoteAuthor');

    if (!quoteContainer || !quoteText) return;

    let currentIndex = Math.floor(Math.random() * quotes.length);
    let autoInterval = null;
    let isHovered = false;

    const displayQuote = (idx, withAnimation = true) => {
      const q = quotes[idx];
      if (withAnimation) {
        quoteContainer.style.opacity = '0';
        quoteContainer.style.transform = 'translateX(-50%) translateY(4px)';
        setTimeout(() => {
          quoteText.textContent = `"${q.text}"`;
          if (quoteAuthor) quoteAuthor.textContent = '- ' + q.author;
          quoteContainer.style.opacity = '1';
          quoteContainer.style.transform = 'translateX(-50%) translateY(0)';
        }, 320);
      } else {
        quoteText.textContent = `"${q.text}"`;
        if (quoteAuthor) quoteAuthor.textContent = '- ' + q.author;
      }
    };

    const nextQuote = () => {
      currentIndex = (currentIndex + 1) % quotes.length;
      displayQuote(currentIndex, true);
    };

    const startAutoRotation = () => {
      clearInterval(autoInterval);
      // Auto change every 10 seconds (10000ms)
      autoInterval = setInterval(() => {
        if (!isHovered) {
          nextQuote();
        }
      }, 10000);
    };

    // Click to cycle to next quote immediately and refresh timer
    quoteContainer.addEventListener('click', () => {
      nextQuote();
      startAutoRotation();
    });

    // Pause on hover so user can read comfortably, resume on mouse leave
    quoteContainer.addEventListener('mouseenter', () => {
      isHovered = true;
    });

    quoteContainer.addEventListener('mouseleave', () => {
      isHovered = false;
    });

    // Initial render
    displayQuote(currentIndex, false);
    startAutoRotation();
  }

  /* =========================================================
     10. APPLE-STYLE SPOTLIGHT SEARCH (Ctrl + K)
     ========================================================= */
  initSpotlight() {
    const overlay = document.getElementById('spotlightOverlay');
    const input = document.getElementById('searchInput');
    const trigger = document.getElementById('searchTriggerBtn');

    if (!overlay || !input) return;

    const openSpotlight = () => {
      overlay.classList.remove('hidden');
      setTimeout(() => input.focus(), 60);
    };

    const closeSpotlight = () => {
      overlay.classList.add('hidden');
    };

    trigger?.addEventListener('click', (e) => {
      e.stopPropagation();
      openSpotlight();
    });

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (overlay.classList.contains('hidden')) {
          openSpotlight();
        } else {
          closeSpotlight();
        }
      } else if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
        closeSpotlight();
      }
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeSpotlight();
      }
    });
  }
}