/**
 * Global Tracking Engine (Service Worker) - Tabvora v2.1.0
 * Handles Usage Tracking, Real-Time Daily Limit Reminders, Global Browser Time,
 * Digital Wellbeing Session Reminders, Draft Recovery Messages, & Native Context Menus.
 */

const DB_NAME = 'SmartSpeedDialDB';
const DB_VERSION = 3;
const STORE_SHORTCUTS = 'shortcuts';
const STORE_USAGE = 'dailyUsage';
const STORE_DRAFTS = 'drafts';

const ALARM_FALLBACK_RECOVERY = 'tabvora_fallback_recovery';
const ALARM_WELLBEING_TICK = 'tabvora_wellbeing_tick';
const ALARM_POMODORO_FINISH = 'tabvora_pomodoro_finish';

// Global Storage Keys
const KEY_GLOBAL_USAGE_PREFIX = 'global_browser_usage_';
const KEY_GLOBAL_DISMISS_PREFIX = 'global_limit_dismiss_';
const KEY_WELLBEING_SESSION = 'wellbeing_session_ms';

// Timing and Inactivity Safety Thresholds
const MAX_DWELL_CAP_MS = 3 * 60 * 1000; // 3-minute cap to prevent sleep from skewing usage stats
const WELLBEING_PAUSE_GAP_MS = 3 * 60 * 1000; // >3 minutes inactivity is treated as an active pause/break
const WELLBEING_RESET_GAP_MS = 15 * 60 * 1000; // >15 minutes away resets the continuous sitting session

// Safe Session Storage Wrapper for Multi-Browser / Multi-Version Chromium Resilience
const sessionStore = {
  get: (keys) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
      return chrome.storage.session.get(keys);
    }
    return (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local)
      ? chrome.storage.local.get(keys)
      : Promise.resolve({});
  },
  set: (items, cb) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
      return chrome.storage.session.set(items, cb);
    }
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return chrome.storage.local.set(items, cb);
    }
    if (typeof cb === 'function') cb();
    return Promise.resolve();
  },
  remove: (keys, cb) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
      return chrome.storage.session.remove(keys, cb);
    }
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return chrome.storage.local.remove(keys, cb);
    }
    if (typeof cb === 'function') cb();
    return Promise.resolve();
  },
  clear: (cb) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
      return chrome.storage.session.clear(cb);
    }
    if (typeof cb === 'function') cb();
    return Promise.resolve();
  }
};

let activeOrigin = null;
let lastTimestamp = null;
let isTracking = false;
let currentSessionMs = 0;

let wellbeingStartTimestamp = null;

let tickInFlight = false;
let secondsSinceLastStorageSave = 0;

function getOriginFromUrl(urlString) {
  try {
    if (!urlString || urlString.startsWith('chrome-extension://') || urlString.startsWith('chrome://') || urlString.startsWith('about:')) {
      return null;
    }
    return new URL(urlString).origin.toLowerCase();
  } catch (e) {
    return null;
  }
}

function getLocalTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function openDb() {
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_SHORTCUTS)) {
        const store = db.createObjectStore(STORE_SHORTCUTS, { keyPath: 'id' });
        store.createIndex('url', 'url', { unique: false });
        store.createIndex('order', 'order', { unique: false });
        store.createIndex('isPinned', 'isPinned', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_USAGE)) {
        const usageStore = db.createObjectStore(STORE_USAGE, { keyPath: 'id' });
        usageStore.createIndex('origin', 'origin', { unique: false });
        usageStore.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
        const draftStore = db.createObjectStore(STORE_DRAFTS, { keyPath: 'pageUrl' });
        draftStore.createIndex('origin', 'origin', { unique: false });
        draftStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => resolve(null);
  });
}

// Midnight Reset Checker: Resets dismiss states and daily notification flags at midnight safely without wiping active tracking state or continuous session counters
function checkAndPerformMidnightReset() {
  const todayStr = getLocalTodayString();
  chrome.storage.local.get(['last_reset_date'], async (res) => {
    if (res.last_reset_date !== todayStr) {
      chrome.storage.local.set({ last_reset_date: todayStr });
      try {
        const allSession = await sessionStore.get(null);
        if (allSession && typeof allSession === 'object') {
          // Remove only daily dismissal and notification flags that belong to previous days
          const keysToRemove = Object.keys(allSession).filter(k => 
            (k.startsWith('dismiss_limit_') || 
             k.startsWith(KEY_GLOBAL_DISMISS_PREFIX) || 
             k.startsWith('notif_limit_') || 
             k.startsWith('notif_global_limit_')) &&
            !k.endsWith(`_${todayStr}`)
          );
          if (keysToRemove.length > 0) {
            await sessionStore.remove(keysToRemove);
          }
        }
      } catch (err) {
        console.warn('Midnight reset session cleanup error:', err);
      }
    }
  });
}

/* ==========================================================================
   DIGITAL WELLBEING SESSION TRACKING ENGINE
   ========================================================================== */

async function initWellbeingTracker() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  if (!settings.enableWellbeing) {
    stopWellbeingTimer();
    return;
  }

  wellbeingStartTimestamp = Date.now();
  startWellbeingTimer();
}

function startWellbeingTimer() {
  chrome.alarms.get(ALARM_WELLBEING_TICK, (alarm) => {
    if (!alarm) {
      chrome.alarms.create(ALARM_WELLBEING_TICK, { periodInMinutes: 1 });
    }
  });
}

function stopWellbeingTimer() {
  chrome.alarms.clear(ALARM_WELLBEING_TICK);
  wellbeingStartTimestamp = null;
  sessionStore.remove([KEY_WELLBEING_SESSION, 'wellbeing_last_tick_time', 'wellbeing_last_milestone_min']);
}

async function checkWellbeingMilestones() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  if (!settings.enableWellbeing) return;

  const sessionData = await sessionStore.get([KEY_WELLBEING_SESSION, 'wellbeing_last_tick_time', 'wellbeing_last_milestone_min']);
  const now = Date.now();
  const lastTick = sessionData.wellbeing_last_tick_time || wellbeingStartTimestamp || now;
  const elapsed = Math.max(0, now - lastTick);

  let currentMs = sessionData[KEY_WELLBEING_SESSION] || 0;
  const prevTotalMinutes = Math.floor(currentMs / 60000);

  // If user was away for >= 15 minutes, treat it as a restful break and reset continuous sitting session
  if (elapsed >= WELLBEING_RESET_GAP_MS) {
    await sessionStore.set({ 
      [KEY_WELLBEING_SESSION]: 0,
      wellbeing_last_tick_time: now,
      wellbeing_last_milestone_min: 0
    });
    return;
  }

  // If away between 3 and 15 minutes (machine sleep/screen lock), pause and do not credit inactive time
  if (elapsed > WELLBEING_PAUSE_GAP_MS) {
    await sessionStore.set({ 
      wellbeing_last_tick_time: now
    });
    return;
  }

  // Normal active focus tick (elapsed <= 3 minutes)
  currentMs += elapsed;
  await sessionStore.set({ 
    [KEY_WELLBEING_SESSION]: currentMs,
    wellbeing_last_tick_time: now
  });

  const currTotalMinutes = Math.floor(currentMs / 60000);
  if (currTotalMinutes <= prevTotalMinutes) return;

  const lastMilestoneMin = sessionData.wellbeing_last_milestone_min || 0;

  const MILESTONES = [
    {
      min: 45,
      type: 'eye',
      title: '👁 45-Min Checkpoint • Eye Rest',
      message: "You've been in this browser session for 45 minutes.\nLook 20 feet away for 20 seconds, take 3 deep breaths, and blink your eyes."
    },
    {
      min: 90,
      type: 'stretch',
      title: '🧍 90-Min Checkpoint • Stretch & Relax',
      message: "You've reached 90 minutes in this browser session!\nStand up, roll your shoulders, stretch your wrists and neck."
    },
    {
      min: 180,
      type: 'walk',
      title: '🚶 3-Hour Checkpoint • Hydrate & Walk',
      message: "3 hours in this browser session!\nStep away from your desk, drink a glass of water, and walk for 3–5 minutes."
    },
    {
      min: 240,
      type: 'long_break',
      title: '☕ 4-Hour Checkpoint • Time for a Break',
      message: "You've reached 4 hours of screen time.\nTake a restful 15–20 minute break away from screens to recharge."
    }
  ];

  // Detect whether any cadence milestone was crossed between prevTotalMinutes and currTotalMinutes
  for (let m = prevTotalMinutes + 1; m <= currTotalMinutes; m++) {
    const cycleMin = ((m - 1) % 240) + 1;
    const hit = MILESTONES.find(item => item.min === cycleMin);
    if (hit && lastMilestoneMin !== m) {
      await sessionStore.set({ wellbeing_last_milestone_min: m });
      dispatchWellbeingReminder({
        type: hit.type,
        title: hit.title,
        message: hit.message
      });
      break; // Fire one milestone alert per tick
    }
  }
}

function dispatchWellbeingReminder(payload) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs.length > 0 && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'SHOW_WELLBEING_REMINDER',
        payload
      }, () => {
        if (chrome.runtime.lastError) {} // Catch safely
      });
    }
  });

  try {
    if (chrome.notifications) {
      chrome.notifications.create('tabvora-wellbeing-' + Date.now(), {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: payload.title,
        message: payload.message.replace(/\n/g, ' ')
      });
    }
  } catch (_) {}
}

/* ==========================================================================
   USAGE & LIMIT TRACKING ENGINE (REAL-TIME ACTIVE TAB FOCUS TRACKING)
   ========================================================================== */

let originUsageBuffer = {};
let lastBufferFlushTime = Date.now();
let isWindowFocused = true;

async function addUsageToDb(origin, elapsedMs) {
  if (!origin || elapsedMs <= 0) return 0;
  const todayStr = getLocalTodayString();
  const id = `${origin}_${todayStr}`;

  const db = await openDb();
  if (!db || !db.objectStoreNames.contains(STORE_USAGE)) {
    if (db) db.close();
    return 0;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_USAGE, 'readwrite');
      const store = tx.objectStore(STORE_USAGE);
      const getReq = store.get(id);

      let updatedMs = 0;
      getReq.onsuccess = () => {
        const record = getReq.result || {
          id,
          origin,
          date: todayStr,
          ms: 0,
          timestamp: Date.now()
        };

        record.ms = (record.ms || 0) + elapsedMs;
        record.timestamp = Date.now();
        updatedMs = record.ms;
        store.put(record);
      };

      tx.oncomplete = () => {
        db.close();
        resolve(updatedMs);
      };
      tx.onerror = () => { db.close(); resolve(0); };
      tx.onabort = () => { db.close(); resolve(0); };
    } catch (e) {
      if (db) db.close();
      resolve(0);
    }
  });
}

let activeShortcutLimitsCache = null;
let lastShortcutLimitsCheck = 0;

function normalizeDomain(urlString) {
  try {
    if (!urlString) return '';
    const url = new URL(urlString);
    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch (e) {
    return '';
  }
}

async function getActiveShortcutLimits() {
  const now = Date.now();
  if (activeShortcutLimitsCache !== null && (now - lastShortcutLimitsCheck < 5000)) {
    return activeShortcutLimitsCache;
  }

  try {
    const db = await openDb();
    if (!db || !db.objectStoreNames.contains(STORE_SHORTCUTS)) {
      if (db) db.close();
      activeShortcutLimitsCache = [];
      lastShortcutLimitsCheck = now;
      return [];
    }

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SHORTCUTS, 'readonly');
      const store = tx.objectStore(STORE_SHORTCUTS);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result || [];
        db.close();
        const active = list.filter(s => s.limitEnabled && s.limitMinutes > 0 && s.url);
        activeShortcutLimitsCache = active;
        lastShortcutLimitsCheck = Date.now();
        resolve(active);
      };
      req.onerror = () => {
        if (db) db.close();
        resolve([]);
      };
    });
  } catch (e) {
    return [];
  }
}

function invalidateShortcutLimitsCache() {
  activeShortcutLimitsCache = null;
  lastShortcutLimitsCheck = 0;
}

function isOriginLimited(origin, activeLimits) {
  if (!origin || !activeLimits || activeLimits.length === 0) return false;
  const originNorm = normalizeDomain(origin);
  return activeLimits.some(s => {
    return getOriginFromUrl(s.url) === origin || normalizeDomain(s.url) === originNorm;
  });
}

async function flushUsageBuffer() {
  lastBufferFlushTime = Date.now();
  const origins = Object.keys(originUsageBuffer);
  if (origins.length === 0) return;

  const bufferCopy = { ...originUsageBuffer };
  originUsageBuffer = {};

  const todayStr = getLocalTodayString();
  const siteUsageKey = `site_usage_${todayStr}`;

  try {
    const { settings = {} } = await chrome.storage.local.get('settings');

    // 1. Update chrome.storage.local only if browser reports/analytics are enabled
    if (settings.enableStats) {
      const storageRes = await chrome.storage.local.get(siteUsageKey);
      const daySites = storageRes[siteUsageKey] || {};

      for (const [orig, addedMs] of Object.entries(bufferCopy)) {
        daySites[orig] = (daySites[orig] || 0) + addedMs;
      }

      await chrome.storage.local.set({ [siteUsageKey]: daySites });
    }

    // 2. Commit to IndexedDB for persistent storage & verify real-time site limits
    for (const [orig, addedMs] of Object.entries(bufferCopy)) {
      const totalMs = await addUsageToDb(orig, addedMs);
      if (totalMs > 0) {
        await checkRealTimeDailyLimit(orig, totalMs);
      }
    }
  } catch (err) {
    console.error('Error flushing usage buffer:', err);
  }
}

async function recordOriginUsage(origin, elapsedMs) {
  if (!origin || elapsedMs <= 0) return;

  const { settings = {} } = await chrome.storage.local.get('settings');
  const activeLimits = await getActiveShortcutLimits();
  const hasShortcutLimits = activeLimits.length > 0;

  // If both general reports and global limit are OFF, only record if this origin has a shortcut limit
  if (!settings.enableStats && !settings.enableGlobalLimit) {
    if (!hasShortcutLimits || !isOriginLimited(origin, activeLimits)) {
      return;
    }
  }

  originUsageBuffer[origin] = (originUsageBuffer[origin] || 0) + elapsedMs;

  if (settings.enableGlobalLimit || settings.enableStats) {
    await trackGlobalBrowserTime(elapsedMs);
  }

  const timeSinceFlush = Date.now() - lastBufferFlushTime;
  if (timeSinceFlush >= 2000 || (originUsageBuffer[origin] || 0) >= 5000) {
    await flushUsageBuffer();
  }
}

function flushCurrentOriginTime() {
  if (!activeOrigin || !lastTimestamp) return;
  const now = Date.now();
  const elapsed = now - lastTimestamp;
  lastTimestamp = now;

  if (elapsed >= 300 && elapsed <= MAX_DWELL_CAP_MS) {
    recordOriginUsage(activeOrigin, elapsed);
  }
}

async function trackGlobalBrowserTime(elapsedMs) {
  if (elapsedMs <= 0) return;

  const { settings = {} } = await chrome.storage.local.get('settings');
  if (!settings.enableGlobalLimit && !settings.enableStats) return;

  checkAndPerformMidnightReset();

  const todayStr = getLocalTodayString();
  const usageKey = `${KEY_GLOBAL_USAGE_PREFIX}${todayStr}`;

  const res = await chrome.storage.local.get([usageKey, 'global_longest_session']);
  const currentMs = (res[usageKey] || 0) + elapsedMs;
  currentSessionMs += elapsedMs;

  const updates = { [usageKey]: currentMs };
  if (currentSessionMs > (res.global_longest_session || 0)) {
    updates.global_longest_session = currentSessionMs;
  }

  await chrome.storage.local.set(updates);

  if (settings.enableGlobalLimit) {
    const totalLimitMins = (parseInt(settings.globalLimitHours || 0, 10) * 60) + parseInt(settings.globalLimitMinutes || 0, 10);
    const currentMins = Math.floor(currentMs / 60000);

    if (totalLimitMins > 0 && currentMins >= totalLimitMins) {
      checkAndTriggerGlobalLimitReminder(currentMins, totalLimitMins);
    }
  }
}

// 🔴 AUTO-SHOW FIX: Global Browser Limit
async function checkAndTriggerGlobalLimitReminder(currentMins, totalLimitMins) {
  const todayStr = getLocalTodayString();
  const dismissKey = `${KEY_GLOBAL_DISMISS_PREFIX}${todayStr}`;

  const sessionRes = await sessionStore.get([dismissKey]);
  if (sessionRes[dismissKey]) return; // Session dismissed

  const notifGlobalKey = `notif_global_limit_${todayStr}`;
  const notifGlobalRes = await sessionStore.get([notifGlobalKey]);
  if (!notifGlobalRes[notifGlobalKey]) {
    await sessionStore.set({ [notifGlobalKey]: true });
    try {
      if (chrome.notifications) {
        chrome.notifications.create(`tabvora-global-${Date.now()}`, {
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icons/icon128.png'),
          title: '⏰ Daily Browser Limit Reached • Tabvora',
          message: `You've reached your ${totalLimitMins}m daily browser limit (${currentMins}m used).`,
          priority: 2
        });
      }
    } catch (_) {}
  }

  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    if (tabs && tabs.length > 0) {
      tabs.forEach(tab => {
        if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'SHOW_GLOBAL_LIMIT_REMINDER',
            usedMinutes: currentMins,
            limitMinutes: totalLimitMins
          }, () => {
            if (chrome.runtime.lastError) {} // Catch safely
          });
        }
      });
    }
  });
}

async function checkRealTimeDailyLimit(origin, currentUsedMs) {
  const shortcuts = await getActiveShortcutLimits();
  if (!shortcuts || shortcuts.length === 0) return;

  const originNorm = normalizeDomain(origin);
  const matchedShortcut = shortcuts.find(s => {
    return getOriginFromUrl(s.url) === origin || normalizeDomain(s.url) === originNorm;
  });

  if (!matchedShortcut) return;

  const usedMinutes = Math.floor(currentUsedMs / 60000);
  if (usedMinutes >= matchedShortcut.limitMinutes) {
    const todayStr = getLocalTodayString();
    const dismissKey = `dismiss_limit_${origin}_${todayStr}`;

    const sessionData = await sessionStore.get([dismissKey]);
    if (sessionData[dismissKey]) return;

    const notifKey = `notif_limit_${origin}_${todayStr}`;
    const notifRes = await sessionStore.get([notifKey]);
    if (!notifRes[notifKey]) {
      await sessionStore.set({ [notifKey]: true });
      try {
        if (chrome.notifications) {
          chrome.notifications.create(`tabvora-limit-${Date.now()}`, {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon128.png'),
            title: `⏰ Website Limit Reached • ${matchedShortcut.title || new URL(origin).hostname}`,
            message: `You've used ${usedMinutes}m of your ${matchedShortcut.limitMinutes}m daily limit for today.`,
            priority: 2
          });
        }
      } catch (_) {}
    }

    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        tabs.forEach(tab => {
          if (tab.id && tab.url) {
            const tabOrigin = getOriginFromUrl(tab.url);
            const tabNorm = normalizeDomain(tab.url);
            if (tabOrigin === origin || tabNorm === originNorm) {
              chrome.tabs.sendMessage(tab.id, {
                action: 'SHOW_REALTIME_LIMIT_REMINDER',
                shortcutId: matchedShortcut.id,
                siteName: matchedShortcut.title || new URL(origin).hostname,
                originUrl: origin,
                usedMinutes,
                limitMinutes: matchedShortcut.limitMinutes
              }, () => {
                if (chrome.runtime.lastError) {}
              });
            }
          }
        });
      }
    });
  }
}

function persistTrackingState() {
  if (activeOrigin && lastTimestamp) {
    sessionStore.set({
      trackingState: {
        activeOrigin,
        lastTimestamp,
        isTracking
      }
    });
  } else {
    sessionStore.remove('trackingState');
  }
}

async function tick() {
  if (tickInFlight) return;
  tickInFlight = true;

  try {
    if (!isWindowFocused || !activeOrigin || !lastTimestamp) return;

    const now = Date.now();
    const elapsed = now - lastTimestamp;
    lastTimestamp = now;

    if (elapsed > 0 && elapsed <= MAX_DWELL_CAP_MS) {
      await recordOriginUsage(activeOrigin, elapsed);
      persistTrackingState();
    }
  } finally {
    tickInFlight = false;
  }
}

function startTimer() {
  if (!isTracking) {
    isTracking = true;
    lastTimestamp = Date.now();
    secondsSinceLastStorageSave = 0;
    persistTrackingState();
  }
  chrome.alarms.get(ALARM_FALLBACK_RECOVERY, (alarm) => {
    if (!alarm) {
      chrome.alarms.create(ALARM_FALLBACK_RECOVERY, { periodInMinutes: 1 });
    }
  });
}

function stopTimer() {
  isTracking = false;
  flushCurrentOriginTime();
  lastTimestamp = null;
  currentSessionMs = 0;
  chrome.alarms.clear(ALARM_FALLBACK_RECOVERY);
  secondsSinceLastStorageSave = 0;
  persistTrackingState();
}

async function updateActiveTab() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  const activeLimits = await getActiveShortcutLimits();
  const hasShortcutLimits = activeLimits.length > 0;

  if (!settings.enableStats && !settings.enableGlobalLimit && !hasShortcutLimits) {
    flushCurrentOriginTime();
    await flushUsageBuffer();
    stopTimer();
    activeOrigin = null;
    return;
  }

  try {
    const lastWin = await chrome.windows.getLastFocused();
    if (!lastWin || !lastWin.focused) {
      isWindowFocused = false;
      flushCurrentOriginTime();
      await flushUsageBuffer();
      stopTimer();
      activeOrigin = null;
      return;
    }
  } catch (e) {}

  isWindowFocused = true;

  chrome.tabs.query({ active: true, lastFocusedWindow: true }, async (tabs) => {
    const tab = tabs && tabs.length > 0 ? tabs[0] : null;
    const newOrigin = tab && tab.url ? getOriginFromUrl(tab.url) : null;

    if (newOrigin !== activeOrigin) {
      flushCurrentOriginTime();
      await flushUsageBuffer();
      activeOrigin = newOrigin;
      if (activeOrigin) {
        lastTimestamp = Date.now();
        startTimer();
      } else {
        stopTimer();
      }
    }
  });
}

async function recoverStateAndSync() {
  const { settings = {} } = await chrome.storage.local.get('settings');
  const activeLimits = await getActiveShortcutLimits();
  const hasShortcutLimits = activeLimits.length > 0;

  if (!settings.enableStats && !settings.enableGlobalLimit && !hasShortcutLimits) return;

  const session = await sessionStore.get('trackingState');
  const savedState = session.trackingState;

  if (savedState && savedState.activeOrigin && savedState.lastTimestamp && savedState.isTracking) {
    const now = Date.now();
    const elapsed = now - savedState.lastTimestamp;

    // Credit previously accumulated dwell time to savedState.activeOrigin before switching tabs.
    // Capped at MAX_DWELL_CAP_MS (3 mins) to prevent machine sleep from inflating stats.
    if (elapsed >= 300 && elapsed <= MAX_DWELL_CAP_MS) {
      await recordOriginUsage(savedState.activeOrigin, elapsed);
      await flushUsageBuffer();
    }
  }

  // Synchronize with currently focused active tab
  await updateActiveTab();
}

let recoveryPromise = null;

function ensureStateRecovered() {
  if (!recoveryPromise) {
    recoveryPromise = recoverStateAndSync().catch((err) => {
      console.warn('Recovery error handled safely:', err);
    });
  }
  return recoveryPromise;
}

/* Event Listeners */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_FALLBACK_RECOVERY) {
    await ensureStateRecovered();
    await tick();
  }
  if (alarm.name === ALARM_WELLBEING_TICK) {
    checkWellbeingMilestones().catch((err) => console.warn('Wellbeing milestone error:', err));
  }
  if (alarm.name === ALARM_POMODORO_FINISH) handlePomodoroAlarmFinish();
});

function handlePomodoroAlarmFinish() {
  chrome.storage.local.get(['pomodoroState'], ({ pomodoroState }) => {
    const isFocus = !pomodoroState || pomodoroState.mode === 'focus';
    const title = "⏰ Time's Up! • Tabvora";
    const message = isFocus 
      ? "Your 25-minute focus session is complete! Great work!" 
      : "Your timer has reached 00:00!";

    try {
      chrome.notifications.create('tabvora-timer-finished', {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: title,
        message: message,
        buttons: [
          { title: "✓ Got It" },
          { title: "+5m (Snooze)" }
        ],
        requireInteraction: true,
        priority: 2
      });
    } catch (e) {
      console.warn('Could not create timer notification:', e);
    }

    if (pomodoroState) {
      pomodoroState.isRunning = false;
      pomodoroState.isFinished = true;
      pomodoroState.timeLeft = 0;
      chrome.storage.local.set({ pomodoroState });
    }
  });
}

if (chrome.notifications) {
  chrome.notifications.onButtonClicked.addListener((notifId, btnIdx) => {
    if (notifId === 'tabvora-timer-finished') {
      if (btnIdx === 0) {
        // Got It
        chrome.notifications.clear('tabvora-timer-finished');
        chrome.storage.local.get(['pomodoroState'], ({ pomodoroState }) => {
          if (pomodoroState) {
            pomodoroState.isFinished = false;
            pomodoroState.isRunning = false;
            const mins = pomodoroState.mode === 'focus' ? 25 : (pomodoroState.customMins || 30);
            pomodoroState.timeLeft = mins * 60;
            pomodoroState.totalDuration = mins * 60;
            chrome.storage.local.set({ pomodoroState });
          }
        });
      } else if (btnIdx === 1) {
        // +5m Snooze
        chrome.notifications.clear('tabvora-timer-finished');
        const snoozeSecs = 5 * 60;
        const endTime = Date.now() + (snoozeSecs * 1000);
        chrome.alarms.create(ALARM_POMODORO_FINISH, { when: endTime });
        chrome.storage.local.get(['pomodoroState'], ({ pomodoroState }) => {
          const state = pomodoroState || {};
          state.mode = 'custom';
          state.customMins = 5;
          state.timeLeft = snoozeSecs;
          state.totalDuration = snoozeSecs;
          state.isRunning = true;
          state.isFinished = false;
          state.endTime = endTime;
          chrome.storage.local.set({ pomodoroState: state });
        });
      }
    }
  });

  chrome.notifications.onClosed.addListener((notifId) => {
    if (notifId === 'tabvora-timer-finished') {
      chrome.storage.local.get(['pomodoroState'], ({ pomodoroState }) => {
        if (pomodoroState && pomodoroState.isFinished) {
          pomodoroState.isFinished = false;
          chrome.storage.local.set({ pomodoroState });
        }
      });
    }
  });
}


chrome.tabs.onActivated.addListener(async () => {
  await ensureStateRecovered();
  await updateActiveTab();
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tab.active && (changeInfo.url || changeInfo.status === 'complete')) {
    await ensureStateRecovered();
    await updateActiveTab();
  }
});

chrome.tabs.onRemoved.addListener(async () => {
  await ensureStateRecovered();
  setTimeout(() => updateActiveTab(), 100);
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  await ensureStateRecovered();
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    isWindowFocused = false;
    flushCurrentOriginTime();
    await flushUsageBuffer();
    stopTimer();
    activeOrigin = null;
  } else {
    isWindowFocused = true;
    await updateActiveTab();
  }
});

ensureStateRecovered();
initWellbeingTracker();

/* Context Menus Implementation */
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.contextMenus) {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'ADD_CURRENT_PAGE',
        title: '⭐ Add to Tabvora Shortcuts',
        contexts: ['page']
      });

      chrome.contextMenus.create({
        id: 'ADD_HYPERLINK',
        title: '⭐ Add Link to Tabvora',
        contexts: ['link']
      });
    });
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  let targetUrl = '';
  let targetTitle = '';

  if (info.menuItemId === 'ADD_CURRENT_PAGE') {
    targetUrl = info.pageUrl || tab?.url || '';
    targetTitle = tab?.title || 'Website Shortcut';
  } else if (info.menuItemId === 'ADD_HYPERLINK') {
    targetUrl = info.linkUrl || '';
    targetTitle = info.selectionText || 'Linked Page';
  }

  if (targetUrl && !targetUrl.startsWith('chrome://') && !targetUrl.startsWith('chrome-extension://')) {
    const newTabUrl = chrome.runtime.getURL('newtab.html') + `?action=add_shortcut&url=${encodeURIComponent(targetUrl)}&title=${encodeURIComponent(targetTitle)}`;
    chrome.tabs.create({ url: newTabUrl });
  }
});

/* Message Routing Engine */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_DRAFT_SETTINGS') {
    chrome.storage.local.get('settings', ({ settings = {} }) => {
      sendResponse({
        enableDrafts: !!settings.enableDrafts,
        draftInterval: settings.draftInterval || 5,
        draftRetention: settings.draftRetention || 30,
        draftQuota: settings.draftQuota || 250
      });
    });
    return true;
  }

  if (request.action === 'SETTINGS_UPDATED') {
    invalidateShortcutLimitsCache();
    ensureStateRecovered().then(() => updateActiveTab()).catch(err => console.warn('Settings update sync error:', err));
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'SHORTCUTS_UPDATED') {
    invalidateShortcutLimitsCache();
    ensureStateRecovered().then(() => updateActiveTab()).catch(err => console.warn('Shortcuts update sync error:', err));
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'START_WELLBEING_TRACKING') {
    initWellbeingTracker();
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'STOP_WELLBEING_TRACKING') {
    stopWellbeingTimer();
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'SAVE_DRAFT') {
    saveDraftToDb(request.pageUrl, request.origin, request.fields);
    return false;
  }

  if (request.action === 'CHECK_DRAFT') {
    getDraftFromDb(request.pageUrl).then((draft) => sendResponse(draft));
    return true;
  }

  if (request.action === 'DELETE_DRAFT') {
    deleteDraftFromDb(request.pageUrl);
    return false;
  }

  if (request.action === 'DISMISS_LIMIT_TODAY') {
    const todayStr = getLocalTodayString();
    const key = `dismiss_limit_${request.originUrl}_${todayStr}`;
    sessionStore.set({ [key]: true }, () => sendResponse({ success: true }));
    return true;
  }

  if (request.action === 'DISMISS_GLOBAL_LIMIT_CONTINUE') {
    const todayStr = getLocalTodayString();
    const dismissKey = `${KEY_GLOBAL_DISMISS_PREFIX}${todayStr}`;
    sessionStore.set({ [dismissKey]: true }, () => sendResponse({ success: true }));
    return true;
  }

  if (request.action === 'OPEN_EDIT_SHORTCUT') {
    const editUrl = chrome.runtime.getURL('newtab.html') + `?action=edit_shortcut&id=${encodeURIComponent(request.shortcutId)}`;
    chrome.tabs.create({ url: editUrl });
    sendResponse({ success: true });
    return false;
  }

  if (request.action === 'OPEN_SETTINGS_GLOBAL_LIMIT') {
    const settingsUrl = chrome.runtime.getURL('newtab.html') + '?action=open_settings_global';
    chrome.tabs.create({ url: settingsUrl });
    sendResponse({ success: true });
    return false;
  }
});

async function saveDraftToDb(pageUrl, origin, fields) {
  const db = await openDb();
  if (!db || !db.objectStoreNames.contains(STORE_DRAFTS)) return;

  const tx = db.transaction(STORE_DRAFTS, 'readwrite');
  const store = tx.objectStore(STORE_DRAFTS);
  store.put({ pageUrl, origin, fields, updatedAt: Date.now() });
  tx.oncomplete = () => db.close();
}

async function getDraftFromDb(pageUrl) {
  const db = await openDb();
  if (!db || !db.objectStoreNames.contains(STORE_DRAFTS)) return null;

  return new Promise((resolve) => {
    const tx = db.transaction(STORE_DRAFTS, 'readonly');
    const store = tx.objectStore(STORE_DRAFTS);
    const req = store.get(pageUrl);
    req.onsuccess = () => { db.close(); resolve(req.result || null); };
    req.onerror = () => { db.close(); resolve(null); };
  });
}

async function deleteDraftFromDb(pageUrl) {
  const db = await openDb();
  if (!db || !db.objectStoreNames.contains(STORE_DRAFTS)) return;

  const tx = db.transaction(STORE_DRAFTS, 'readwrite');
  const store = tx.objectStore(STORE_DRAFTS);
  store.delete(pageUrl);
  tx.oncomplete = () => db.close();
}

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('newtab.html') });
});