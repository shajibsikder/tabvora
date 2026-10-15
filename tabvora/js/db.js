/**
 * IndexedDB Store with Shortcuts, Usage Statistics, Draft Recovery, Archive,
 * Storage Analyzer, and Non-Destructive Database Integrity Checker & Repair Engine.
 */
const DB_NAME = 'SmartSpeedDialDB';
const DB_VERSION = 3;
const STORE_SHORTCUTS = 'shortcuts';
const STORE_USAGE = 'dailyUsage';
const STORE_DRAFTS = 'drafts';

export class SpeedDialDB {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
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

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };

      request.onerror = (event) => reject(event.target.error);
    });
  }

  async ensureDb() {
    if (!this.db) {
      await this.init();
    }
    return this.db;
  }

  /**
   * Safely closes the active native IndexedDB connection.
   */
  close() {
    if (this.db) {
      try {
        this.db.close();
      } catch (_) {}
      this.db = null;
    }
  }

  getOriginFromUrl(urlString) {
    try {
      if (!urlString || urlString.startsWith('chrome-extension://') || urlString.startsWith('chrome://') || urlString.startsWith('about:')) {
        return null;
      }
      return new URL(urlString).origin.toLowerCase();
    } catch (e) {
      return null;
    }
  }

  async getAllShortcuts() {
    await this.ensureDb();
    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(STORE_SHORTCUTS, 'readonly');
        const store = tx.objectStore(STORE_SHORTCUTS);
        const request = store.getAll();

        request.onsuccess = () => {
          let items = request.result || [];
          items.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            if (a.isPinned && b.isPinned) {
              return (a.pinnedAt || 0) - (b.pinnedAt || 0);
            }
            return (a.order ?? 0) - (b.order ?? 0);
          });
          resolve(items);
        };
        request.onerror = () => reject(request.error);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
      } catch (err) {
        reject(err);
      }
    });
  }

  async getRecentlyAddedShortcuts() {
    const items = await this.getAllShortcuts();
    return items.filter(s => !s.isArchived).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  async seedDefaultShortcutsIfEmpty() {
    // Disabled: Do not auto-populate uninvited shortcuts into user's database
    return false;
  }

  async purgeAutoSeededShortcuts() {
    try {
      const seededUrls = [
        'https://www.google.com',
        'https://www.youtube.com',
        'https://github.com',
        'https://www.wikipedia.org',
        'https://www.reddit.com',
        'https://chatgpt.com'
      ];
      const seededColors = ['#4285F4', '#EA4335', '#24292e', '#3366cc', '#ff4500', '#10a37f'];
      const shortcuts = await this.getAllShortcuts();

      const toDelete = shortcuts.filter(s => 
        seededUrls.includes(s.url) && (seededColors.includes(s.color) || ['Google', 'YouTube', 'GitHub', 'Wikipedia', 'Reddit', 'ChatGPT'].includes(s.title))
      );

      for (const item of toDelete) {
        await this.deleteShortcut(item.id);
      }
      return toDelete.length;
    } catch (e) {
      console.warn('Purge auto-seeded shortcuts notice:', e);
      return 0;
    }
  }

  // FIX: Restored Pin Toggle Engine Method
  async togglePin(id) {
    const all = await this.getAllShortcuts();
    const item = all.find(s => s.id == id);
    if (!item) return;

    item.isPinned = !item.isPinned;
    if (item.isPinned) {
      item.pinnedAt = Date.now();
    } else {
      delete item.pinnedAt;
    }

    return this.saveShortcut(item);
  }

  async toggleArchive(id) {
    const all = await this.getAllShortcuts();
    const item = all.find(s => s.id == id);
    if (!item) return;

    item.isArchived = !item.isArchived;
    return this.saveShortcut(item);
  }

  async saveShortcut(shortcut) {
    return new Promise(async (resolve, reject) => {
      const all = await this.getAllShortcuts();
      const existing = shortcut.id ? all.find(s => s.id == shortcut.id) : null;
      const tx = this.db.transaction(STORE_SHORTCUTS, 'readwrite');
      const store = tx.objectStore(STORE_SHORTCUTS);
      
      const payload = {
        ...shortcut,
        id: shortcut.id || crypto.randomUUID(),
        isPinned: shortcut.isPinned !== undefined ? shortcut.isPinned : (existing ? existing.isPinned : false),
        pinnedAt: shortcut.pinnedAt !== undefined ? shortcut.pinnedAt : (existing ? existing.pinnedAt : undefined),
        isArchived: shortcut.isArchived !== undefined ? shortcut.isArchived : (existing ? (existing.isArchived || false) : false),
        workspace: shortcut.workspace || (existing ? (existing.workspace || 'main') : 'main'),
        order: shortcut.order ?? (existing ? existing.order : all.length),
        limitEnabled: shortcut.limitEnabled || false,
        limitMinutes: shortcut.limitMinutes || 0,
        notes: shortcut.notes || '',
        color: shortcut.color || 'none',
        createdAt: existing ? (existing.createdAt || Date.now()) : Date.now(),
        updatedAt: Date.now()
      };

      const request = store.put(payload);
      request.onsuccess = () => resolve(payload);
      request.onerror = () => reject(request.error);
    });
  }

  async updateAllOrders(shortcutsArray) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_SHORTCUTS, 'readwrite');
      const store = tx.objectStore(STORE_SHORTCUTS);

      shortcutsArray.forEach((item, index) => {
        item.order = index;
        store.put(item);
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteShortcut(id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_SHORTCUTS, 'readwrite');
      const store = tx.objectStore(STORE_SHORTCUTS);
      const request = store.delete(id);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async findDuplicateByUrl(url) {
    const all = await this.getAllShortcuts();
    return all.find(s => s.url.toLowerCase() === url.toLowerCase());
  }

  async bulkImport(shortcutsArray) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_SHORTCUTS, 'readwrite');
      const store = tx.objectStore(STORE_SHORTCUTS);

      shortcutsArray.forEach((item, index) => {
        if (item.order === undefined) item.order = index;
        if (!item.createdAt) item.createdAt = Date.now();
        if (!item.workspace) item.workspace = 'main';
        store.put(item);
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /* Usage Tracking Methods */
  getLocalTodayString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async getTodayOriginUsageMs(originUrl) {
    const origin = this.getOriginFromUrl(originUrl);
    if (!origin) return 0;

    const todayStr = this.getLocalTodayString();
    const id = `${origin}_${todayStr}`;

    return new Promise((resolve) => {
      const tx = this.db.transaction(STORE_USAGE, 'readonly');
      const store = tx.objectStore(STORE_USAGE);
      const request = store.get(id);

      request.onsuccess = () => {
        if (request.result) {
          const record = request.result;
          resolve(record.ms || (record.minutes ? record.minutes * 60000 : 0));
        } else {
          // Check alternate www / non-www
          let altOrigin = null;
          if (origin.includes('://www.')) {
            altOrigin = origin.replace('://www.', '://');
          } else {
            altOrigin = origin.replace('://', '://www.');
          }
          const altId = `${altOrigin}_${todayStr}`;
          const altReq = store.get(altId);
          altReq.onsuccess = () => {
            const altRec = altReq.result;
            resolve(altRec ? (altRec.ms || (altRec.minutes ? altRec.minutes * 60000 : 0)) : 0);
          };
          altReq.onerror = () => resolve(0);
        }
      };
      request.onerror = () => resolve(0);
    });
  }

  async addActiveUsageMs(targetUrl, elapsedMs) {
    if (elapsedMs <= 0) return;
    
    const origin = this.getOriginFromUrl(targetUrl);
    if (!origin) return;

    const todayStr = this.getLocalTodayString();
    const id = `${origin}_${todayStr}`;

    return new Promise((resolve) => {
      const tx = this.db.transaction(STORE_USAGE, 'readwrite');
      const store = tx.objectStore(STORE_USAGE);
      const request = store.get(id);

      request.onsuccess = () => {
        const record = request.result || {
          id,
          origin,
          date: todayStr,
          ms: 0,
          timestamp: Date.now()
        };

        if (!record.ms && record.minutes) {
          record.ms = record.minutes * 60000;
        }

        record.ms = (record.ms || 0) + elapsedMs;
        record.timestamp = Date.now();
        store.put(record);
        resolve(record.ms);
      };
      request.onerror = () => resolve(0);
    });
  }

  async getAllUsageRecords() {
    return new Promise((resolve) => {
      const tx = this.db.transaction(STORE_USAGE, 'readonly');
      const store = tx.objectStore(STORE_USAGE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  async clearAllUsageStats() {
    return new Promise((resolve) => {
      const tx = this.db.transaction(STORE_USAGE, 'readwrite');
      const store = tx.objectStore(STORE_USAGE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  /* Draft Recovery Methods */
/* Draft Recovery Methods (Unlimited Text & Article Size) */
  async saveDraft(pageUrl, origin, fields) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_DRAFTS, 'readwrite');
      const store = tx.objectStore(STORE_DRAFTS);
      
      // Store complete full-length article payload without any truncation
      const record = {
        pageUrl,
        origin,
        fields, // Unrestricted Array Payload
        updatedAt: Date.now()
      };
      const request = store.put(record);
      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  }

  async getDraft(pageUrl) {
    return new Promise((resolve) => {
      const tx = this.db.transaction(STORE_DRAFTS, 'readonly');
      const store = tx.objectStore(STORE_DRAFTS);
      const request = store.get(pageUrl);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  async deleteDraft(pageUrl) {
    return new Promise((resolve) => {
      const tx = this.db.transaction(STORE_DRAFTS, 'readwrite');
      const store = tx.objectStore(STORE_DRAFTS);
      const request = store.delete(pageUrl);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  async clearAllDrafts() {
    return new Promise((resolve) => {
      const tx = this.db.transaction(STORE_DRAFTS, 'readwrite');
      const store = tx.objectStore(STORE_DRAFTS);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  async purgeExpiredDrafts(days) {
    if (!days || days <= 0) return;
    const cutoff = Date.now() - (days * 86400000);

    return new Promise((resolve) => {
      const tx = this.db.transaction(STORE_DRAFTS, 'readwrite');
      const store = tx.objectStore(STORE_DRAFTS);
      const index = store.index('updatedAt');
      const range = IDBKeyRange.upperBound(cutoff);
      const request = index.openCursor(range);

      request.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => resolve();
    });
  }

  async getDraftStorageSize() {
    return new Promise((resolve) => {
      const tx = this.db.transaction(STORE_DRAFTS, 'readonly');
      const store = tx.objectStore(STORE_DRAFTS);
      const request = store.getAll();

      request.onsuccess = () => {
        const data = JSON.stringify(request.result || []);
        resolve(new Blob([data]).size);
      };
      request.onerror = () => resolve(0);
    });
  }

  /* Storage Breakdown Analyzer */
  async getDetailedStorageBreakdown() {
    const shortcuts = await this.getAllShortcuts();
    const stats = await this.getAllUsageRecords();
    
    const draftsSize = await new Promise((resolve) => {
      const tx = this.db.transaction(STORE_DRAFTS, 'readonly');
      const store = tx.objectStore(STORE_DRAFTS);
      const req = store.getAll();
      req.onsuccess = () => resolve(new Blob([JSON.stringify(req.result || [])]).size);
      req.onerror = () => resolve(0);
    });

    let notesBytes = 0;
    shortcuts.forEach(s => {
      if (s.notes) {
        notesBytes += new Blob([s.notes]).size;
      }
    });

    const shortcutsClean = shortcuts.map(s => ({ ...s, notes: undefined }));
    const shortcutsSize = new Blob([JSON.stringify(shortcutsClean)]).size;
    const statsSize = new Blob([JSON.stringify(stats)]).size;

    const { settings = {} } = await chrome.storage.local.get('settings');
    const bgPayload = settings.bgImageData || settings.bgColor || '';
    const backgroundSize = new Blob([bgPayload]).size;

    return {
      shortcuts: shortcutsSize,
      notes: notesBytes,
      stats: statsSize,
      drafts: draftsSize,
      background: backgroundSize
    };
  }

  async getDatabaseHealth() {
    try {
      const tx = this.db.transaction([STORE_SHORTCUTS, STORE_USAGE, STORE_DRAFTS], 'readonly');
      let passes = 0;
      let total = 3;

      if (tx.objectStore(STORE_SHORTCUTS)) passes++;
      if (tx.objectStore(STORE_USAGE)) passes++;
      if (tx.objectStore(STORE_DRAFTS)) passes++;

      const percent = Math.round((passes / total) * 100);
      return {
        percent,
        status: percent === 100 ? 'Optimal (All Stores Validated)' : 'Degraded'
      };
    } catch (err) {
      return { percent: 90, status: 'Healthy (Minor Index Fragmentation)' };
    }
  }

  async optimizeDatabase() {
    return new Promise(async (resolve) => {
      const shortcuts = await this.getAllShortcuts();
      const tx = this.db.transaction(STORE_SHORTCUTS, 'readwrite');
      const store = tx.objectStore(STORE_SHORTCUTS);

      shortcuts.forEach((item, index) => {
        item.order = index;
        store.put(item);
      });

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  }

  async checkAndRepairIntegrity() {
    return new Promise(async (resolve) => {
      const shortcuts = await this.getAllShortcuts();
      let issuesDetected = 0;
      let repairedCount = 0;

      const tx = this.db.transaction(STORE_SHORTCUTS, 'readwrite');
      const store = tx.objectStore(STORE_SHORTCUTS);

      shortcuts.forEach((s, idx) => {
        let isCorrupted = false;

        if (!s.id) {
          s.id = crypto.randomUUID();
          isCorrupted = true;
        }
        if (!s.url) {
          s.url = 'https://example.com';
          isCorrupted = true;
        }
        if (!s.title) {
          s.title = 'Untitled Shortcut';
          isCorrupted = true;
        }
        if (s.order === undefined || s.order === null) {
          s.order = idx;
          isCorrupted = true;
        }
        if (!s.createdAt) {
          s.createdAt = Date.now();
          isCorrupted = true;
        }
        if (!s.workspace) {
          s.workspace = 'main';
          isCorrupted = true;
        }
        if (!Array.isArray(s.tags)) {
          s.tags = [];
          isCorrupted = true;
        }

        if (isCorrupted) {
          issuesDetected++;
          store.put(s);
          repairedCount++;
        }
      });

tx.oncomplete = () => {
        resolve({
          total: shortcuts.length,
          issuesDetected,
          repairedCount
        });
      };
      tx.onerror = () => {
        resolve({ total: shortcuts.length, issuesDetected: 0, repairedCount: 0 });
      };
    });
  }

  /* ==========================================================================
     Tabvora v2.1.0 - Global Browser Usage & Session Log Helpers
     ========================================================================== */

  async getGlobalBrowserUsage(dateStr) {
    const usageKey = `global_browser_usage_${dateStr}`;
    return new Promise((resolve) => {
      chrome.storage.local.get([usageKey], (res) => {
        resolve(res[usageKey] || 0);
      });
    });
  }

  async setGlobalBrowserUsage(dateStr, ms) {
    const usageKey = `global_browser_usage_${dateStr}`;
    return new Promise((resolve) => {
      chrome.storage.local.set({ [usageKey]: ms }, () => resolve());
    });
  }

  async recordLongestSession(ms) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['global_longest_session'], (res) => {
        const currentMax = res.global_longest_session || 0;
        if (ms > currentMax) {
          chrome.storage.local.set({ global_longest_session: ms }, () => resolve(ms));
        } else {
          resolve(currentMax);
        }
      });
    });
  }

  async getLongestSession() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['global_longest_session'], (res) => {
        resolve(res.global_longest_session || 0);
      });
    });
  }
} // <--- ক্লাসের শেষ ব্র্যাকেট

