/**
 * Master Controller for Tabvora (v2.1.0).
 */
import { SpeedDialDB } from './db.js';
import { VirtualGrid } from './virtual-grid.js';
import { debounce, parseUrlDetails, getFaviconUrl, escapeHtml } from './utils.js';
import { WidgetsManager, WALLPAPER_VAULT } from './widgets.js';

const DEFAULT_SETTINGS = {
  theme: 'system',
  cardSize: 'small',
  gridDensity: 'comfortable',
  cornerRadius: 12,
  borderColor: '',
  cardShadow: true,
  hoverAnimation: true,
  showWorkspace: true,
  showClock: true,
  showNotes: true,
  showPomodoro: true,
  showDailyFocus: false,
  frostedGlass: true,
  showBrowserUsage: false,
  bgType: 'default',
  bgColor: '#121212',
  bgBlur: false,
  bgImageData: null,
  openTarget: 'new',
  autoFocus: true,
  confirmDelete: true,
  instantSearch: true,
  searchBy: { title: true, url: true, domain: true },
  reduceMotion: false,
  enableStats: false,
  enableDrafts: false,
  draftInterval: 5,
  draftRetention: 30,
  draftQuota: 250,
  enableGlobalLimit: false,
  globalLimitHours: 1,
  globalLimitMinutes: 0,
  enableWellbeing: false // Digital Wellbeing
};

const CONSENT_FEATURES = {
  settingShowDailyFocus: {
    key: 'showDailyFocus',
    title: 'Enable Daily Main Focus',
    iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    desc: 'Displays an intentional single-focus goal card on your dashboard to keep your core daily objective front and center.<br><br><span class="feature-consent-privacy">🔒 <strong>Privacy Notice:</strong> Saved directly to local browser storage. No cloud synchronization or external telemetry.</span>',
    confirmText: 'Enable Focus',
    onEnable: async (app) => {
      await app.updateSetting('showDailyFocus', true);
      app.showSnackbar('🎯 Daily Main Focus enabled.');
    },
    onDisable: async (app) => {
      await app.updateSetting('showDailyFocus', false);
      app.showSnackbar('Daily Main Focus hidden.');
    }
  },
  settingEnableStats: {
    key: 'enableStats',
    title: 'Enable Browser Usage Reports',
    iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/><path d="M4 20h16"/></svg>`,
    desc: 'Locally records time spent per website domain to provide visual productivity charts and session breakdowns.<br><br><span class="feature-consent-privacy">🔒 <strong>Privacy Notice:</strong> Processed and stored locally in browser IndexedDB. Browsing activity stays on your device.</span>',
    confirmText: 'Enable Reports',
    onEnable: async (app) => {
      await app.updateSetting('enableStats', true);
      const reportsAnalytics = document.getElementById('browserReportsAnalyticsContainer');
      const reportsDisabledMsg = document.getElementById('browserReportsDisabledMsg');
      if (reportsAnalytics) reportsAnalytics.classList.remove('hidden');
      if (reportsDisabledMsg) reportsDisabledMsg.classList.add('hidden');
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ action: 'SETTINGS_UPDATED' }, () => {
          if (chrome.runtime?.lastError) {}
        });
      }
      await app.renderBrowserReports();
      await app.renderUsageStatistics();
      app.showSnackbar('📊 Browser Usage Reports enabled.');
    },
    onDisable: async (app) => {
      await app.updateSetting('enableStats', false);
      const reportsAnalytics = document.getElementById('browserReportsAnalyticsContainer');
      const reportsDisabledMsg = document.getElementById('browserReportsDisabledMsg');
      if (reportsAnalytics) reportsAnalytics.classList.add('hidden');
      if (reportsDisabledMsg) reportsDisabledMsg.classList.remove('hidden');
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ action: 'SETTINGS_UPDATED' }, () => {
          if (chrome.runtime?.lastError) {}
        });
      }
      app.showSnackbar('Browser Usage Reports disabled.');
    }
  },
  settingEnableDrafts: {
    key: 'enableDrafts',
    title: 'Enable Draft Auto-Recovery',
    iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
    desc: 'Caches active form drafts in browser storage so you can easily recover text after sudden tab crashes or power cuts.<br><br><span class="feature-consent-privacy">🔒 <strong>Privacy Notice:</strong> Retained in local browser cache. Sensitive fields (passwords, PINs, OTPs, and payment data) are strictly excluded.</span>',
    confirmText: 'Enable Drafts',
    onEnable: async (app) => {
      await app.updateSetting('enableDrafts', true);
      app.showSnackbar('📝 Draft Recovery enabled (local cache).');
    },
    onDisable: async (app) => {
      await app.updateSetting('enableDrafts', false);
      app.showSnackbar('Draft Recovery disabled.');
    }
  },
  settingEnableGlobalLimit: {
    key: 'enableGlobalLimit',
    title: 'Enable Global Browsing Limit',
    iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    desc: 'Tracks overall daily Chrome screen time and provides a live progress meter on your dashboard to help prevent digital fatigue.<br><br><span class="feature-consent-privacy">🔒 <strong>Privacy Notice:</strong> Measured locally on your device with daily midnight resets. Zero remote transmission.</span>',
    confirmText: 'Enable Limit',
    onEnable: async (app) => {
      await app.updateSetting('enableGlobalLimit', true);
      const container = document.getElementById('globalLimitInputsContainer');
      if (container) container.classList.remove('hidden');
      await app.renderBrowserUsageCard();
      app.showSnackbar('🌐 Global Browser Limit enabled.');
    },
    onDisable: async (app) => {
      await app.updateSetting('enableGlobalLimit', false);
      const container = document.getElementById('globalLimitInputsContainer');
      if (container) container.classList.add('hidden');
      await app.renderBrowserUsageCard();
      app.showSnackbar('Global Browser Limit disabled.');
    }
  },
  settingEnableWellbeing: {
    key: 'enableWellbeing',
    title: 'Enable Digital Wellbeing',
    iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    desc: 'Sends gentle, non-intrusive reminder chimes for eye relaxation (45m) and ergonomic stretching (90m) during long sessions.<br><br><span class="feature-consent-privacy">🔒 <strong>Privacy Assurance:</strong> Runs strictly in memory while Chrome is active and stops automatically on browser exit. Zero tracking.</span>',
    confirmText: 'Enable Wellbeing',
    onEnable: async (app) => {
      await app.updateSetting('enableWellbeing', true);
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ action: 'START_WELLBEING_TRACKING' }, () => {
          if (chrome.runtime?.lastError) {}
        });
      }
      app.showSnackbar('🧘 Digital Wellbeing active (45m Eye • 90m Stretch • 180m Walk reminders).');
    },
    onDisable: async (app) => {
      await app.updateSetting('enableWellbeing', false);
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ action: 'STOP_WELLBEING_TRACKING' }, () => {
          if (chrome.runtime?.lastError) {}
        });
      }
      app.showSnackbar('Digital Wellbeing reminders disabled.');
    }
  },
  settingBgBlur: {
    key: 'bgBlur',
    title: 'Enable Background Blur',
    iconSvg: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M3 12h18"/><path d="m5.6 5.6 12.8 12.8"/><path d="m18.4 5.6-12.8 12.8"/></svg>`,
    desc: 'Applies a frosted-glass blur filter to the desktop background to increase shortcut contrast and text readability.<br><br><span class="feature-consent-privacy">🔒 <strong>Performance Assurance:</strong> Rendered with native GPU acceleration in your local browser engine. Zero remote downloads.</span>',
    confirmText: 'Enable Blur',
    onEnable: async (app) => {
      await app.updateSetting('bgBlur', true);
      app.showSnackbar('✨ Frosted background blur applied.');
    },
    onDisable: async (app) => {
      await app.updateSetting('bgBlur', false);
      app.showSnackbar('Background blur removed.');
    }
  }
};

class App {
  constructor() {
    this.db = new SpeedDialDB();
    this.widgetsManager = null;
    this.shortcuts = [];
    this.filteredShortcuts = [];
    this.grid = null;
    this.settings = { ...DEFAULT_SETTINGS };
    this.activeContextItem = null;
    this.limitBlockedItem = null;
    this.currentStatsRange = 'today';
    this.currentBrowserReportRange = 'today';
    this.activeColorFilter = 'all';
    this.isRecentFilterActive = false;
    this.activeWorkspace = 'all';

    // Auto-sync when system theme changes
    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.settings && this.settings.theme === 'system') {
          this.applySettingsUI();
        }
      });
    } catch (_) {}

    // DOM Elements
    this.loadingState = document.getElementById('loadingState');
    this.viewport = document.getElementById('viewport');
    this.canvas = document.getElementById('virtualCanvas');
    this.emptyState = document.getElementById('emptyState');
    this.searchInput = document.getElementById('searchInput');
    this.clearSearchBtn = document.getElementById('clearSearchBtn');
    this.addBtn = document.getElementById('addBtn');
    this.emptyAddBtn = document.getElementById('emptyAddBtn');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.searchForm = document.getElementById('searchForm'); // 👈 Fixed for CWS Compliance
    this.toastContainer = document.getElementById('toastContainer');
    
    // Modals
    this.contextMenu = document.getElementById('contextMenu');
    this.shortcutModal = document.getElementById('shortcutModal');
    this.shortcutForm = document.getElementById('shortcutForm');
    this.settingsModal = document.getElementById('settingsModal');
    this.limitReachedModal = document.getElementById('limitReachedModal');
    this.duplicateDetectedModal = document.getElementById('duplicateDetectedModal');
    this.tutorialModal = document.getElementById('tutorialModal');
    this.urlErrorMsg = document.getElementById('urlErrorMsg');

    this.enableLimitToggle = document.getElementById('enableLimitToggle');
    this.limitOptionsContainer = document.getElementById('limitOptionsContainer');
    this.limitPresetSelect = document.getElementById('limitPresetSelect');
    this.customLimitContainer = document.getElementById('customLimitContainer');
    this.customLimitHours = document.getElementById('customLimitHours');

    this.notesInput = document.getElementById('notesInput');
    this.colorLabelSelect = document.getElementById('colorLabelSelect');
    this.customColorPicker = document.getElementById('customColorPicker');
    this.workspaceSelect = document.getElementById('workspaceSelect');

    this.filterAllBtn = document.getElementById('filterAllBtn');
    this.filterRecentBtn = document.getElementById('filterRecentBtn');

    this.navItems = document.querySelectorAll('.settings-nav .nav-item');
    this.tabPanels = document.querySelectorAll('.tab-panel');

    this.currentTutorialStep = 1;
  }

  async init() {
    try {
      // 0. Instant Onboarding State Check (Hide dashboard completely on first-run)
      const { hasCompletedOnboarding, userName } = await chrome.storage.local.get(['hasCompletedOnboarding', 'userName']);
      if (!hasCompletedOnboarding && !userName) {
        document.body.classList.add('onboarding-mode');
        this.showOnboardingWelcome();
      } else {
        try { localStorage.setItem('tabvora_onboarding_done', 'true'); } catch (_) {}
        document.body.classList.remove('onboarding-mode');
      }

      // 1. Instant UI & Widgets initialization (Clock, Dock, Wallpapers, Quotes, Focus)
      this.widgetsManager = new WidgetsManager(this);
      await this.widgetsManager.init();

      // 2. Instant Button & Navigation Bindings
      this.bindEvents();
      this.bindSettingsEvents();
      this.bindFeature123Events();
      this.bindPart2FeatureEvents();
      this.bindPart3FeatureEvents();
      this.bindPart4FeatureEvents();
      this.bindPart6TutorialEvents();
      this.bindAboutSupportEvents();
      this.bindDailyJourneyEvents();
      this.checkDailyAttendance();

      // 3. Storage and Database Engines
      await this.db.init();
      await this.db.purgeAutoSeededShortcuts();
      await this.loadAndMigrateSettings();

      if (this.settings.enableDrafts && this.settings.draftRetention > 0) {
        await this.db.purgeExpiredDrafts(parseInt(this.settings.draftRetention, 10));
      }

      this.grid = new VirtualGrid(this.viewport, this.canvas, {
        onEdit: (shortcut) => this.openEditModal(shortcut),
        onDelete: (id) => this.deleteShortcut(id),
        onPin: async (id) => {
          await this.db.togglePin(id);
          await this.refreshData();
        },
        onArchive: async (id) => {
          await this.archiveShortcutWithUndo(id);
        },
        onContextMenu: (e, item) => this.showContextMenu(e, item),
        onReorder: async (reorderedList) => {
          await this.db.updateAllOrders(reorderedList);
          this.shortcuts = [...reorderedList];
        },
        onShortcutClick: (e, item) => this.handleShortcutClick(e, item),
        onAdd: () => this.openAddModal()
      });

      this.bindUsageEvents();
      this.bindDraftEvents();
      this.bindGlobalLimitEvents();
      this.bindBrowserReportEvents();
      this.bindWellbeingEvents();
      await this.renderBrowserUsageCard();

      this.initAdvancedWindowControls();
      await this.refreshData();

      this.loadingState.classList.add('hidden');
      this.viewport.classList.remove('hidden');

      setTimeout(() => {
        if (this.grid) this.grid.recalculateLayout();
      }, 50);

      this.processIncomingUrlParams();
      this.checkAndShowFirstRunTutorial();
    } catch (err) {
      console.error('Tabvora init error:', err);
    }
  }

  showSnackbar(message, actionLabel = null, onActionCallback = null, durationMs = 5000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const msgSpan = document.createElement('span');
    msgSpan.textContent = message;
    toast.appendChild(msgSpan);

    if (actionLabel) {
      const actionBtn = document.createElement('button');
      actionBtn.className = 'toast-undo-btn';
      actionBtn.textContent = actionLabel;
      actionBtn.addEventListener('click', () => {
        if (onActionCallback) onActionCallback();
        toast.remove();
      });
      toast.appendChild(actionBtn);
    }

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, durationMs);
  }

  async checkAndShowFirstRunTutorial() {
    // First-run name onboarding is now initialized at the start of init() for zero-flash display
  }

  showOnboardingWelcome() {
    const overlay = document.getElementById('onboardingOverlay');
    const input = document.getElementById('onboardingNameInput');
    const continueBtn = document.getElementById('onboardingContinueBtn');
    if (!overlay) return;

    overlay.classList.remove('hidden');
    overlay.style.opacity = '1';

    setTimeout(() => {
      input?.focus();
    }, 150);

    const submitName = async () => {
      const name = (input?.value || '').trim();
      await chrome.storage.local.set({ userName: name, hasCompletedOnboarding: true });
      try { localStorage.setItem('tabvora_onboarding_done', 'true'); } catch (_) {}

      const heroGreeting = document.getElementById('heroGreeting');
      if (heroGreeting) {
        const hour = new Date().getHours();
        let greeting = 'Good day';
        if (hour >= 5 && hour < 12) greeting = 'Good morning';
        else if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
        else if (hour >= 17 && hour < 22) greeting = 'Good evening';
        else greeting = 'Good night';
        heroGreeting.textContent = name ? `${greeting}, ${name}.` : `${greeting}.`;
      }

      const settingNameEl = document.getElementById('settingUserName');
      if (settingNameEl) settingNameEl.value = name;

      overlay.style.pointerEvents = 'none';
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.classList.add('hidden');
        document.body.classList.remove('onboarding-mode');
        const appEl = document.getElementById('app');
        if (appEl) {
          appEl.classList.add('revealing');
        }
        if (this.grid) {
          this.grid.recalculateLayout();
        }
      }, 350);
    };

    continueBtn?.addEventListener('click', submitName);
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitName();
      }
    });
  }

  startTutorial() {
    this.currentTutorialStep = 1;
    this.renderTutorialStep(1);
    this.tutorialModal.showModal();
  }

  renderTutorialStep(step) {
    const stepsData = {
      1: {
        icon: '🚀',
        title: 'Welcome to Tabvora',
        body: 'Fast, private and customizable smart tab and shortcut manager. Access all your favorite web links instantly.'
      },
      2: {
        icon: '📌',
        title: 'Organize & Customize',
        body: 'Assign workspaces (Work, Study, Shopping), pin items, or add notes and color labels to cards.'
      },
      3: {
        icon: '🔍',
        title: 'Deep Search & Shortcuts',
        body: 'Press Ctrl+K anytime to focus search. Switch workspaces quickly with Alt+1 through Alt+5.'
      },
      4: {
        icon: '🔒',
        title: 'Local Privacy Guaranteed',
        body: 'Zero tracking, zero analytics. Your bookmarks, settings, and notes stay securely on your local device.'
      }
    };

    const data = stepsData[step];
    document.getElementById('tutorialStepIcon').textContent = data.icon;
    document.getElementById('tutorialTitle').textContent = data.title;
    document.getElementById('tutorialBody').textContent = data.body;

    document.querySelectorAll('.tutorial-dot').forEach(dot => {
      dot.classList.toggle('active', parseInt(dot.dataset.step, 10) === step);
    });

    const nextBtn = document.getElementById('nextTutorialBtn');
    if (step === 4) {
      nextBtn.textContent = 'Finish';
    } else {
      nextBtn.textContent = 'Next Step';
    }
  }

  bindPart6TutorialEvents() {
    document.getElementById('nextTutorialBtn')?.addEventListener('click', async () => {
      if (this.currentTutorialStep < 4) {
        this.currentTutorialStep++;
        this.renderTutorialStep(this.currentTutorialStep);
      } else {
        await chrome.storage.local.set({ hasCompletedOnboarding: true });
        this.tutorialModal.close();
      }
    });

    document.getElementById('skipTutorialBtn')?.addEventListener('click', async () => {
      await chrome.storage.local.set({ hasCompletedOnboarding: true });
      this.tutorialModal.close();
    });

    document.getElementById('relaunchTutorialBtn')?.addEventListener('click', () => {
      this.settingsModal.close();
      this.startTutorial();
    });

    document.getElementById('heroGreeting')?.addEventListener('click', () => {
      chrome.storage.local.get('userName', ({ userName }) => {
        const current = userName || '';
        const promptName = prompt("What's your name?", current);
        if (promptName !== null) {
          const cleanName = promptName.trim();
          chrome.storage.local.set({ userName: cleanName });
          const heroGreeting = document.getElementById('heroGreeting');
          if (heroGreeting) {
            const hour = new Date().getHours();
            let greeting = 'Good day';
            if (hour >= 5 && hour < 12) greeting = 'Good morning';
            else if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
            else if (hour >= 17 && hour < 22) greeting = 'Good evening';
            else greeting = 'Good night';
            heroGreeting.textContent = cleanName ? `${greeting}, ${cleanName}.` : `${greeting}.`;
          }
          const settingNameEl = document.getElementById('settingUserName');
          if (settingNameEl) settingNameEl.value = cleanName;
        }
      });
    });

    document.querySelectorAll('.md-switch').forEach(sw => {
      sw.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          const checkbox = sw.querySelector('input[type="checkbox"]');
          if (checkbox) {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      });
    });
  }

  bindAboutSupportEvents() {
    try {
      const manifest = chrome.runtime.getManifest();
      const versionLabel = document.getElementById('manifestVersionLabel');
      if (versionLabel && manifest.version) {
        versionLabel.textContent = `v${manifest.version}`;
      }
    } catch (e) {}

    document.getElementById('btnOfficialWebsite')?.addEventListener('click', () => {
      window.open('https://shajibsikder.github.io/tabvora/', '_blank');
    });

    document.getElementById('btnGithubRepo')?.addEventListener('click', () => {
      window.open('https://github.com/shajibsikder/tabvora', '_blank');
    });

    document.getElementById('btnPrivacyPolicy')?.addEventListener('click', () => {
      window.open('privacy.html', '_blank');
    });

    document.getElementById('btnReportIssue')?.addEventListener('click', () => {
      window.open('https://github.com/shajibsikder/tabvora/issues/new', '_blank');
    });

    const rateBtn = document.getElementById('btnRateExtension');
    if (rateBtn) {
      const manifest = chrome.runtime.getManifest();
      const isWebStoreInstall = Boolean(manifest.update_url && manifest.update_url.includes('clients2.google.com/service/update2/crx'));

      if (isWebStoreInstall) {
        rateBtn.classList.remove('hidden', 'disabled');
        rateBtn.removeAttribute('disabled');
        rateBtn.style.display = '';
        rateBtn.addEventListener('click', () => {
          const storeUrl = `https://chromewebstore.google.com/detail/${chrome.runtime.id}/reviews`;
          window.open(storeUrl, '_blank');
        });
      } else {
        rateBtn.classList.add('hidden');
        rateBtn.style.display = 'none';
      }
    }
  }

  /* =========================================================
     DAILY FOCUS JOURNEY & ATTENDANCE REWARDS ENGINE (v2.1.0)
     1 Point per unique calendar day, infinite 10-day stages
     ========================================================= */
  async checkDailyAttendance() {
    try {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const {
        user_points = 0,
        attendance_dates = [],
        total_login_days = 0
      } = await chrome.storage.local.get(['user_points', 'attendance_dates', 'total_login_days']);

      let dates = Array.isArray(attendance_dates) ? [...attendance_dates] : [];
      let currentPoints = typeof user_points === 'number' ? user_points : 0;
      let totalDays = typeof total_login_days === 'number' && total_login_days > 0 ? total_login_days : dates.length;

      const isNewDay = !dates.includes(todayStr);
      if (isNewDay) {
        dates.push(todayStr);
        currentPoints += 1;
        totalDays += 1;
        await chrome.storage.local.set({
          user_points: currentPoints,
          attendance_dates: dates,
          total_login_days: totalDays
        });

        setTimeout(() => {
          this.showSnackbar(`✨ Daily Check-in: +1 Heart Earned! (Total: ${currentPoints} Hearts)`);
        }, 1200);
      }

      this.updatePointsUI(currentPoints, totalDays);
    } catch (e) {
      console.warn('Daily attendance check error:', e);
    }
  }

  updatePointsUI(points, totalDays) {
    const ptsText = document.getElementById('userPointsText');
    if (ptsText) ptsText.textContent = points;

    const streakPill = document.getElementById('userStreakPill');
    if (streakPill && totalDays != null) {
      streakPill.textContent = `Day ${totalDays}`;
    }

    const vaultPts = document.getElementById('rewardsVaultPointsText');
    if (vaultPts) vaultPts.textContent = points;
  }

  bindDailyJourneyEvents() {
    const pointsBadgeBtn = document.getElementById('dailyPointsBadge');
    const storePtsChip = document.getElementById('rewardsDrawerPtsChip');
    const journeyModal = document.getElementById('dailyJourneyModal');
    const closeJourneyBtn = document.getElementById('closeDailyJourneyBtn');
    const prevStageBtn = document.getElementById('journeyPrevStageBtn');
    const nextStageBtn = document.getElementById('journeyNextStageBtn');
    const stageTitle = document.getElementById('journeyStageTitle');
    const stageStatus = document.getElementById('journeyStageStatus');
    const daysGrid = document.getElementById('journeyDaysGrid');
    const timelineTrack = document.getElementById('rewardTimelineTrack');
    const okBtn = document.getElementById('dailyRewardOkBtn');
    const totalPointsText = document.getElementById('journeyTotalPointsText');
    const streakDaysText = document.getElementById('journeyStreakDaysText');
    const totalDaysText = document.getElementById('journeyTotalDaysText');

    let currentViewingStage = 1;
    let actualMaxStage = 1;
    let cachedTotalDays = 1;

    // 7 Rich Gamified Vector Item SVGs (Day 1: Coin, Day 2: Hourglass, Day 3: Bomb, Day 4: Cyan Potion, Day 5: Ruby Elixir, Day 6: Diamond Gem, Day 7: Gift Box)
    const REWARD_ITEMS = [
      {
        day: 1,
        name: 'Gold Coin',
        rewardText: '+1',
        hearts: 1,
        svg: `<svg viewBox="0 0 64 64" width="46" height="46" class="reward-item-svg" aria-label="Gold Coin">
          <defs>
            <radialGradient id="coinGlow" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stop-color="#fff8db"/>
              <stop offset="45%" stop-color="#facc15"/>
              <stop offset="85%" stop-color="#ca8a04"/>
              <stop offset="100%" stop-color="#854d0e"/>
            </radialGradient>
            <linearGradient id="coinRim" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#fef08a"/>
              <stop offset="100%" stop-color="#713f12"/>
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="56" rx="20" ry="4" fill="rgba(0,0,0,0.3)"/>
          <circle cx="32" cy="32" r="23" fill="url(#coinRim)"/>
          <circle cx="32" cy="32" r="19" fill="url(#coinGlow)"/>
          <circle cx="32" cy="32" r="16" fill="none" stroke="#713f12" stroke-width="1.2" stroke-dasharray="2,2"/>
          <path d="M32 21l2.8 5.7 6.3.9-4.5 4.4 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.5-4.4 6.3-.9z" fill="#fef9c3" stroke="#854d0e" stroke-width="0.8"/>
        </svg>`
      },
      {
        day: 2,
        name: 'Focus Hourglass',
        rewardText: '+1',
        hearts: 1,
        svg: `<svg viewBox="0 0 64 64" width="46" height="46" class="reward-item-svg" aria-label="Hourglass">
          <defs>
            <linearGradient id="woodGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#92400e"/><stop offset="50%" stop-color="#d97706"/><stop offset="100%" stop-color="#78350f"/>
            </linearGradient>
            <linearGradient id="sandGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#fef08a"/><stop offset="100%" stop-color="#eab308"/>
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="56" rx="18" ry="4" fill="rgba(0,0,0,0.3)"/>
          <rect x="16" y="10" width="32" height="6" rx="3" fill="url(#woodGrad)" stroke="#451a03" stroke-width="0.8"/>
          <rect x="16" y="48" width="32" height="6" rx="3" fill="url(#woodGrad)" stroke="#451a03" stroke-width="0.8"/>
          <path d="M20 16c0 10 10 14 12 16-2 2-12 6-12 16h24c0-10-10-14-12-16 2-2 12-6 12-16H20z" fill="rgba(255,255,255,0.18)" stroke="#fbbf24" stroke-width="1.2"/>
          <path d="M22 20h20c0 4-7 10-10 11-3-1-10-7-10-11z" fill="url(#sandGrad)"/>
          <line x1="32" y1="31" x2="32" y2="44" stroke="#fef08a" stroke-width="1.5" stroke-dasharray="2,2"/>
          <path d="M23 48c1-4 6-7 9-7s8 3 9 7H23z" fill="url(#sandGrad)"/>
          <polygon points="42,18 43,21 46,22 43,23 42,26 41,23 38,22 41,21" fill="#ffffff"/>
        </svg>`
      },
      {
        day: 3,
        name: 'Magic Focus Bomb',
        rewardText: '+1',
        hearts: 1,
        svg: `<svg viewBox="0 0 64 64" width="46" height="46" class="reward-item-svg" aria-label="Bomb">
          <defs>
            <radialGradient id="bombBody" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stop-color="#475569"/><stop offset="40%" stop-color="#1e293b"/><stop offset="90%" stop-color="#0f172a"/><stop offset="100%" stop-color="#020617"/>
            </radialGradient>
            <linearGradient id="fuseGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#fbbf24"/><stop offset="50%" stop-color="#f97316"/><stop offset="100%" stop-color="#dc2626"/>
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="56" rx="18" ry="4" fill="rgba(0,0,0,0.3)"/>
          <rect x="27" y="18" width="10" height="5" rx="1.5" fill="#ca8a04" stroke="#713f12" stroke-width="0.8"/>
          <path d="M32 18c0-5 6-8 10-6" fill="none" stroke="#d97706" stroke-width="2.2" stroke-linecap="round"/>
          <polygon points="44,8 46,12 50,11 47,15 49,19 45,17 42,20 43,15 39,13 43,12" fill="url(#fuseGrad)"/>
          <circle cx="44.5" cy="13.5" r="2" fill="#fef08a"/>
          <circle cx="32" cy="37" r="18" fill="url(#bombBody)" stroke="#334155" stroke-width="1"/>
          <ellipse cx="32" cy="37" rx="16" ry="6" fill="none" stroke="#eab308" stroke-width="1.5" opacity="0.85"/>
          <ellipse cx="25" cy="27" rx="5" ry="2.5" transform="rotate(-30 25 27)" fill="rgba(255,255,255,0.45)"/>
        </svg>`
      },
      {
        day: 4,
        name: 'Cyan Mana Potion',
        rewardText: '+1',
        hearts: 1,
        svg: `<svg viewBox="0 0 64 64" width="46" height="46" class="reward-item-svg" aria-label="Cyan Potion">
          <defs>
            <radialGradient id="cyanLiquid" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stop-color="#67e8f9"/><stop offset="50%" stop-color="#06b6d4"/><stop offset="85%" stop-color="#0891b2"/><stop offset="100%" stop-color="#0e7490"/>
            </radialGradient>
            <linearGradient id="corkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#d97706"/><stop offset="100%" stop-color="#78350f"/>
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="56" rx="18" ry="4" fill="rgba(0,0,0,0.3)"/>
          <polygon points="26,12 38,12 36,18 28,18" fill="url(#corkGrad)" stroke="#451a03" stroke-width="0.8"/>
          <ellipse cx="32" cy="18" rx="7" ry="2" fill="#cbd5e1" stroke="#64748b" stroke-width="0.8"/>
          <rect x="27" y="18" width="10" height="7" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" stroke-width="0.8"/>
          <path d="M27 25c-8 3-12 10-12 18 0 7 7 12 17 12s17-5 17-12c0-8-4-15-12-18H27z" fill="url(#cyanLiquid)" stroke="#22d3ee" stroke-width="1.2"/>
          <circle cx="28" cy="45" r="2" fill="#cffafe" opacity="0.8"/>
          <circle cx="36" cy="41" r="2.5" fill="#cffafe" opacity="0.9"/>
          <circle cx="31" cy="35" r="1.5" fill="#cffafe" opacity="0.7"/>
          <path d="M20 33c-3 4-3 10-1 14" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2" stroke-linecap="round"/>
          <polygon points="41,27 42,30 45,31 42,32 41,35 40,32 37,31 40,30" fill="#ffffff"/>
        </svg>`
      },
      {
        day: 5,
        name: 'Ruby Magic Elixir',
        rewardText: '+2',
        hearts: 2,
        svg: `<svg viewBox="0 0 64 64" width="46" height="46" class="reward-item-svg" aria-label="Ruby Elixir">
          <defs>
            <radialGradient id="rubyLiquid" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stop-color="#fda4af"/><stop offset="45%" stop-color="#f43f5e"/><stop offset="85%" stop-color="#be123c"/><stop offset="100%" stop-color="#881337"/>
            </radialGradient>
            <linearGradient id="goldCap" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#fef08a"/><stop offset="50%" stop-color="#eab308"/><stop offset="100%" stop-color="#854d0e"/>
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="56" rx="18" ry="4" fill="rgba(0,0,0,0.3)"/>
          <path d="M29 9c0-3 6-3 6 0 0 2-2 3-3 4-1-1-3-2-3-4z" fill="url(#goldCap)" stroke="#713f12" stroke-width="0.8"/>
          <rect x="25" y="13" width="14" height="4" rx="2" fill="url(#goldCap)" stroke="#713f12" stroke-width="0.8"/>
          <rect x="28" y="17" width="8" height="7" fill="rgba(255,255,255,0.2)"/>
          <path d="M28 24L15 37l17 17 17-17L36 24H28z" fill="url(#rubyLiquid)" stroke="#fb7185" stroke-width="1.2"/>
          <path d="M15 37l17 4 17-4" fill="none" stroke="url(#goldCap)" stroke-width="2"/>
          <circle cx="32" cy="46" r="2" fill="#fff1f2"/>
          <polygon points="23,31 24,33 26,34 24,35 23,37 22,35 20,34 22,33" fill="#ffffff"/>
        </svg>`
      },
      {
        day: 6,
        name: 'Diamond Gem',
        rewardText: '+2',
        hearts: 2,
        svg: `<svg viewBox="0 0 64 64" width="46" height="46" class="reward-item-svg" aria-label="Diamond Gem">
          <defs>
            <linearGradient id="gemTop" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#93c5fd"/><stop offset="100%" stop-color="#3b82f6"/>
            </linearGradient>
            <linearGradient id="gemLeft" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#1d4ed8"/>
            </linearGradient>
            <linearGradient id="gemCenter" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#2563eb"/>
            </linearGradient>
            <linearGradient id="gemRight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#2563eb"/><stop offset="100%" stop-color="#1e40af"/>
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="56" rx="18" ry="4" fill="rgba(0,0,0,0.3)"/>
          <polygon points="22,17 42,17 38,27 26,27" fill="#bfdbfe"/>
          <polygon points="13,27 22,17 26,27" fill="url(#gemTop)"/>
          <polygon points="42,17 51,27 38,27" fill="url(#gemTop)"/>
          <polygon points="13,27 26,27 32,52" fill="url(#gemLeft)" stroke="#1d4ed8" stroke-width="0.5"/>
          <polygon points="26,27 38,27 32,52" fill="url(#gemCenter)" stroke="#2563eb" stroke-width="0.5"/>
          <polygon points="38,27 51,27 32,52" fill="url(#gemRight)" stroke="#1e40af" stroke-width="0.5"/>
          <polygon points="22,19 23,22 26,23 23,24 22,27 21,24 18,23 21,22" fill="#ffffff"/>
          <polygon points="41,33 42,35 44,36 42,37 41,39 40,37 38,36 40,35" fill="#ffffff"/>
        </svg>`
      },
      {
        day: 7,
        name: 'Royal Gift Box',
        rewardText: '+5',
        hearts: 5,
        svg: `<svg viewBox="0 0 64 64" width="48" height="48" class="reward-item-svg" aria-label="Royal Gift Box">
          <defs>
            <linearGradient id="boxGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#f59e0b"/><stop offset="50%" stop-color="#d97706"/><stop offset="100%" stop-color="#b45309"/>
            </linearGradient>
            <linearGradient id="ribbonGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#fda4af"/><stop offset="50%" stop-color="#f43f5e"/><stop offset="100%" stop-color="#be123c"/>
            </linearGradient>
          </defs>
          <ellipse cx="32" cy="56" rx="20" ry="4" fill="rgba(0,0,0,0.3)"/>
          <rect x="14" y="30" width="36" height="23" rx="4" fill="url(#boxGrad)" stroke="#78350f" stroke-width="1"/>
          <rect x="12" y="24" width="40" height="9" rx="3" fill="#fbbf24" stroke="#78350f" stroke-width="1"/>
          <rect x="29" y="30" width="6" height="23" fill="url(#ribbonGrad)"/>
          <rect x="29" y="24" width="6" height="9" fill="url(#ribbonGrad)"/>
          <rect x="12" y="26.5" width="40" height="4" fill="url(#ribbonGrad)"/>
          <ellipse cx="25" cy="19" rx="6" ry="4" transform="rotate(-25 25 19)" fill="url(#ribbonGrad)" stroke="#9f1239" stroke-width="0.8"/>
          <ellipse cx="39" cy="19" rx="6" ry="4" transform="rotate(25 39 19)" fill="url(#ribbonGrad)" stroke="#9f1239" stroke-width="0.8"/>
          <circle cx="32" cy="22" r="3.5" fill="#f43f5e" stroke="#9f1239" stroke-width="0.8"/>
          <polygon points="18,17 19,20 22,21 19,22 18,25 17,22 14,21 17,20" fill="#fef08a"/>
          <polygon points="46,38 47,40 49,41 47,42 46,44 45,42 43,41 45,40" fill="#ffffff"/>
        </svg>`
      }
    ];

    const renderStage = (stage) => {
      if (!daysGrid) return;
      currentViewingStage = stage;
      const startDay = (stage - 1) * 7 + 1;
      const endDay = stage * 7;

      if (stageTitle) stageTitle.textContent = `Cycle ${stage} (Days ${startDay}–${endDay})`;
      if (stageStatus) {
        if (stage === actualMaxStage) {
          stageStatus.textContent = "Active";
          stageStatus.className = "hud-cycle-badge active";
        } else if (stage < actualMaxStage) {
          stageStatus.textContent = "Completed";
          stageStatus.className = "hud-cycle-badge completed";
        } else {
          stageStatus.textContent = "Upcoming";
          stageStatus.className = "hud-cycle-badge upcoming";
        }
      }

      if (prevStageBtn) prevStageBtn.disabled = stage <= 1;
      if (nextStageBtn) nextStageBtn.disabled = stage >= actualMaxStage;

      // 1. Build the 7 Horizontal Reward Shield Cards
      daysGrid.innerHTML = '';
      for (let idx = 0; idx < 7; idx++) {
        const dayNumber = startDay + idx;
        const item = REWARD_ITEMS[idx];
        const isClaimed = dayNumber < cachedTotalDays;
        const isToday = dayNumber === cachedTotalDays;
        const isUpcoming = dayNumber > cachedTotalDays;
        const isMilestone = (idx === 6); // Day 7 grand reward

        const card = document.createElement('div');
        let cardClass = 'reward-shield-card';
        if (isToday) cardClass += ' card-hero-today';
        else if (isClaimed) cardClass += ' card-claimed';
        else cardClass += ' card-upcoming';
        if (isMilestone) cardClass += ' card-milestone-grand';
        card.className = cardClass;
        card.setAttribute('role', 'listitem');
        card.setAttribute('title', `Day ${dayNumber}: ${item.name} (${item.rewardText} Hearts)`);

        card.innerHTML = `
          ${isToday ? '<div class="shield-today-banner">TODAY</div>' : ''}
          <div class="shield-inner">
            <div class="shield-halo"></div>
            <div class="shield-item-icon">
              ${item.svg}
            </div>
            <div class="shield-reward-pill">
              <span class="shield-reward-qty">${item.rewardText}</span>
              <span class="shield-heart-icon" aria-hidden="true">❤️</span>
            </div>
            ${isClaimed ? `
              <div class="shield-claimed-overlay" title="Claimed">
                <div class="claimed-check-wrap">
                  <svg viewBox="0 0 54 44" width="36" height="30" class="claimed-check-3d" aria-hidden="true">
                    <defs>
                      <filter id="checkExtrude" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2.5" stdDeviation="1" flood-color="#052e16" flood-opacity="0.9"/>
                      </filter>
                      <linearGradient id="checkGradBody" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#86efac"/>
                        <stop offset="30%" stop-color="#4ade80"/>
                        <stop offset="75%" stop-color="#22c55e"/>
                        <stop offset="100%" stop-color="#16a34a"/>
                      </linearGradient>
                      <linearGradient id="checkGlossSpecular" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
                        <stop offset="45%" stop-color="#bbf7d0" stop-opacity="0.65"/>
                        <stop offset="100%" stop-color="#4ade80" stop-opacity="0"/>
                      </linearGradient>
                    </defs>
                    <path d="M 20,38 L 5,23 L 11,17 L 20,26 L 43,3 L 49,9 Z" fill="#062e14" filter="url(#checkExtrude)"/>
                    <path d="M 20,35 L 5,20 L 11,14 L 20,23 L 43,1 L 49,7 Z" fill="url(#checkGradBody)" stroke="#14532d" stroke-width="1.8" stroke-linejoin="round"/>
                    <polygon points="11,14 20,23 43,1 45,3 20,27 9,16" fill="url(#checkGlossSpecular)"/>
                    <polygon points="26,17 43,1 47,5 30,21" fill="rgba(255,255,255,0.45)"/>
                  </svg>
                </div>
                <span class="claimed-text-badge">Claimed!</span>
              </div>` : ''}
          </div>
        `;

        daysGrid.appendChild(card);
      }

      // 2. Build the Golden Timeline Track (Connecting Bar + 7 Jewel Nodes)
      if (timelineTrack) {
        let cycleCompleted = 0;
        if (cachedTotalDays >= endDay) cycleCompleted = 7;
        else if (cachedTotalDays < startDay) cycleCompleted = 0;
        else cycleCompleted = (cachedTotalDays - startDay) + 1;

        const progressPercent = Math.max(0, Math.min(100, Math.round(((cycleCompleted - 1) / 6) * 100)));

        let nodesHtml = '';
        for (let idx = 0; idx < 7; idx++) {
          const dayNum = startDay + idx;
          const isCompleted = dayNum < cachedTotalDays;
          const isToday = dayNum === cachedTotalDays;
          const nodeState = isToday ? 'node-today' : (isCompleted ? 'node-completed' : 'node-upcoming');

          nodesHtml += `
            <div class="timeline-step ${nodeState}" style="left: ${(idx / 6) * 100}%">
              <div class="timeline-jewel">
                <span class="jewel-gem"></span>
              </div>
              <span class="timeline-label">DAY ${idx + 1}</span>
            </div>
          `;
        }

        timelineTrack.innerHTML = `
          <div class="timeline-rail">
            <div class="timeline-rail-fill" style="width: ${progressPercent}%"></div>
          </div>
          <div class="timeline-nodes-wrap">
            ${nodesHtml}
          </div>
        `;
      }
    };

    const openJourneyModal = async () => {
      const {
        user_points = 0,
        total_login_days = 1,
        attendance_dates = []
      } = await chrome.storage.local.get(['user_points', 'total_login_days', 'attendance_dates']);

      cachedTotalDays = Math.max(1, total_login_days || (Array.isArray(attendance_dates) ? attendance_dates.length : 1));
      actualMaxStage = Math.floor((cachedTotalDays - 1) / 7) + 1;

      if (totalPointsText) totalPointsText.textContent = user_points;
      const ptsUnit = document.getElementById('journeyPointsUnit');
      if (ptsUnit) ptsUnit.textContent = user_points === 1 ? 'Heart' : 'Hearts';
      if (streakDaysText) streakDaysText.textContent = `Day ${cachedTotalDays}`;
      if (totalDaysText) totalDaysText.textContent = `${cachedTotalDays} ${cachedTotalDays === 1 ? 'Day' : 'Days'}`;

      renderStage(actualMaxStage);
      journeyModal?.showModal();
    };

    pointsBadgeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      openJourneyModal();
    });

    storePtsChip?.addEventListener('click', (e) => {
      e.stopPropagation();
      openJourneyModal();
    });

    closeJourneyBtn?.addEventListener('click', () => {
      journeyModal?.close();
    });

    okBtn?.addEventListener('click', () => {
      journeyModal?.close();
    });

    journeyModal?.addEventListener('click', (e) => {
      if (e.target === journeyModal) {
        journeyModal.close();
      }
    });

    prevStageBtn?.addEventListener('click', () => {
      if (currentViewingStage > 1) {
        renderStage(currentViewingStage - 1);
      }
    });

    nextStageBtn?.addEventListener('click', () => {
      if (currentViewingStage < actualMaxStage) {
        renderStage(currentViewingStage + 1);
      }
    });

    document.getElementById('journeyOpenStoreBtn')?.addEventListener('click', () => {
      journeyModal?.close();
      const dockRewardsBtn = document.getElementById('dockRewardsBtn');
      if (dockRewardsBtn) dockRewardsBtn.click();
    });
  }

  async processIncomingUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');

    if (action === 'open_settings_global') {
      window.history.replaceState({}, document.title, window.location.pathname);
      this.settingsModal.showModal();
      const reportsTabBtn = document.querySelector('.nav-item[data-tab="tab-reports"]');
      if (reportsTabBtn) reportsTabBtn.click();
      return;
    }

    const rawUrl = params.get('url');
    const rawTitle = params.get('title');
    const targetShortcutId = params.get('id');

    if (action === 'add_shortcut' && rawUrl) {
      window.history.replaceState({}, document.title, window.location.pathname);

      const parsed = parseUrlDetails(rawUrl);
      if (!parsed.valid) return;

      const existing = await this.db.findDuplicateByUrl(parsed.url);
      if (existing) {
        this.showDuplicateDetectedModal(existing);
      } else {
        this.openAddModalWithPrefill(parsed.url, rawTitle || parsed.defaultTitle);
      }
    } else if (action === 'edit_shortcut' && targetShortcutId) {
      window.history.replaceState({}, document.title, window.location.pathname);
      const all = await this.db.getAllShortcuts();
      const matched = all.find(s => s.id === targetShortcutId);
      if (matched) {
        this.openEditModal(matched);
      }
    }
  }

  showDuplicateDetectedModal(existingItem) {
    document.getElementById('dupeSiteTitle').textContent = existingItem.title;
    document.getElementById('dupeSiteUrl').textContent = existingItem.url;

    const openBtn = document.getElementById('openExistingDupeBtn');
    const editBtn = document.getElementById('editExistingDupeBtn');
    const cancelBtn = document.getElementById('cancelDupeBtn');

    openBtn.onclick = () => {
      this.duplicateDetectedModal.close();
      window.open(existingItem.url, '_blank');
    };

    editBtn.onclick = () => {
      this.duplicateDetectedModal.close();
      this.openEditModal(existingItem);
    };

    cancelBtn.onclick = () => {
      this.duplicateDetectedModal.close();
    };

    this.duplicateDetectedModal.showModal();
  }

  openAddModalWithPrefill(url, title) {
    this.openAddModal();
    document.getElementById('urlInput').value = url;
    document.getElementById('titleInput').value = title;
  }

  initAdvancedWindowControls() {
    const dialog = this.settingsModal;
    if (!dialog) return;

    const directions = ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'];
    directions.forEach(dir => {
      if (!dialog.querySelector(`.resize-${dir}`)) {
        const handle = document.createElement('div');
        handle.className = `resize-handle resize-${dir}`;
        handle.dataset.dir = dir;
        dialog.appendChild(handle);
      }
    });

    let isResizing = false;
    let isDragging = false;
    let currentDir = '';
    let startX, startY, startWidth, startHeight, startLeft, startTop;

    dialog.addEventListener('mousedown', (e) => {
      const handle = e.target.closest('.resize-handle');
      if (handle) {
        e.stopPropagation();
        e.preventDefault();
        isResizing = true;
        currentDir = handle.dataset.dir;

        startX = e.clientX;
        startY = e.clientY;

        const rect = dialog.getBoundingClientRect();
        startWidth = rect.width;
        startHeight = rect.height;
        startLeft = rect.left;
        startTop = rect.top;

        dialog.style.margin = '0';
        dialog.style.left = `${startLeft}px`;
        dialog.style.top = `${startTop}px`;

        document.addEventListener('mousemove', onResizeMove);
        document.addEventListener('mouseup', onResizeEnd);
      }
    });

    const onResizeMove = (e) => {
      if (!isResizing) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const minW = 450;
      const minH = 350;
      const maxW = window.innerWidth;
      const maxH = window.innerHeight;

      let newW = startWidth;
      let newH = startHeight;
      let newLeft = startLeft;
      let newTop = startTop;

      if (currentDir.includes('e')) {
        newW = Math.min(maxW - startLeft, Math.max(minW, startWidth + dx));
      }
      if (currentDir.includes('s')) {
        newH = Math.min(maxH - startTop, Math.max(minH, startHeight + dy));
      }

      if (currentDir.includes('w')) {
        const calculatedW = startWidth - dx;
        if (calculatedW >= minW && (startLeft + dx) >= 0) {
          newW = calculatedW;
          newLeft = startLeft + dx;
        }
      }

      if (currentDir.includes('n')) {
        const calculatedH = startHeight - dy;
        if (calculatedH >= minH && (startTop + dy) >= 0) {
          newH = calculatedH;
          newTop = startTop + dy;
        }
      }

      dialog.style.width = `${newW}px`;
      dialog.style.height = `${newH}px`;
      dialog.style.left = `${newLeft}px`;
      dialog.style.top = `${newTop}px`;
    };

    const onResizeEnd = () => {
      isResizing = false;
      document.removeEventListener('mousemove', onResizeMove);
      document.removeEventListener('mouseup', onResizeEnd);
    };

    dialog.addEventListener('mousedown', (e) => {
      if (
        e.target.closest('button, input, select, textarea, label, a, .resize-handle') ||
        isResizing
      ) {
        return;
      }

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = dialog.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;

      dialog.style.margin = '0';
      dialog.style.left = `${startLeft}px`;
      dialog.style.top = `${startTop}px`;

      document.addEventListener('mousemove', onDragMove);
      document.addEventListener('mouseup', onDragEnd);
    });

    const onDragMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const newLeft = Math.max(0, Math.min(window.innerWidth - dialog.offsetWidth, startLeft + dx));
      const newTop = Math.max(0, Math.min(window.innerHeight - dialog.offsetHeight, startTop + dy));

      dialog.style.left = `${newLeft}px`;
      dialog.style.top = `${newTop}px`;
    };

    const onDragEnd = () => {
      isDragging = false;
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('mouseup', onDragEnd);
    };
  }

  async handleShortcutClick(e, item) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (item.limitEnabled && item.limitMinutes > 0) {
      const todayMs = await this.db.getTodayOriginUsageMs(item.url);
      const usedMinutes = Math.floor(todayMs / 60000);

      if (usedMinutes >= item.limitMinutes) {
        this.showLimitReachedDialog(item, usedMinutes);
        return;
      }
    }

    if (this.settings.openTarget === 'new') {
      window.open(item.url, '_blank');
    } else {
      window.location.href = item.url;
    }
  }

  stopLimitAlertChime() {
    if (Array.isArray(this.limitChimeTimeouts)) {
      this.limitChimeTimeouts.forEach(t => clearTimeout(t));
      this.limitChimeTimeouts = [];
    }
  }

  playSingleLimitChime() {
    try {
      chrome.storage.local.get('activeSoundId', ({ activeSoundId }) => {
        if (this.widgetsManager && typeof this.widgetsManager.playSoundById === 'function') {
          this.widgetsManager.playSoundById(activeSoundId || 'crystal');
        } else {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (!AudioCtx) return;
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') ctx.resume().catch(() => {});
          const now = ctx.currentTime;
          const tones = [
            { freq: 659.25, time: 0, dur: 0.35, gain: 0.82 },
            { freq: 1318.5, time: 0, dur: 0.22, gain: 0.35 },
            { freq: 880.00, time: 0.14, dur: 0.85, gain: 0.88 },
            { freq: 1760.0, time: 0.14, dur: 0.45, gain: 0.35 }
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
          setTimeout(() => {
            try { if (ctx && ctx.state !== 'closed') ctx.close(); } catch (_) {}
          }, 2000);
        }
      });
    } catch (_) {}
  }

  playLimitAlertChime(pulses = 5, intervalMs = 1900) {
    this.stopLimitAlertChime();
    this.playSingleLimitChime();
    this.limitChimeTimeouts = [];
    for (let i = 1; i < pulses; i++) {
      const tid = setTimeout(() => {
        this.playSingleLimitChime();
      }, i * intervalMs);
      this.limitChimeTimeouts.push(tid);
    }
  }

  showLimitReachedDialog(item, usedMinutes) {
    this.playLimitAlertChime(5, 1900);
    this.limitBlockedItem = item;
    document.getElementById('limitSiteName').textContent = item.title;
    document.getElementById('limitTodayUsage').textContent = `${usedMinutes} Mins`;
    document.getElementById('limitMaxAllowed').textContent = `${item.limitMinutes} Mins`;
    this.limitReachedModal.showModal();
  }

  async loadAndMigrateSettings() {
    const { settings = {} } = await chrome.storage.local.get('settings');
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
    await chrome.storage.local.set({ settings: this.settings });
    this.applySettingsUI();
  }

  applySettingsUI() {
    const root = document.documentElement;
    const isDark = this.settings.theme === 'dark' || 
      (this.settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.setAttribute('data-theme', this.settings.theme);
    root.setAttribute('data-resolved-theme', isDark ? 'dark' : 'light');
    root.setAttribute('data-card-size', 'medium');
    root.setAttribute('data-grid-density', 'comfortable');
    root.style.setProperty('--radius-md', '14px');
    root.style.removeProperty('--card-border-color');

    document.body.classList.remove('reduce-motion');
    document.body.classList.remove('frosted-glass');

    const setElem = (id, val, prop = 'value') => {
      const el = document.getElementById(id);
      if (el) el[prop] = val;
    };

    setElem('settingTheme', this.settings.theme);
    chrome.storage.local.get('userName', ({ userName }) => {
      setElem('settingUserName', userName || '');
    });

    setElem('settingShowWorkspace', this.settings.showWorkspace, 'checked');
    setElem('settingShowClock', this.settings.showClock, 'checked');
    setElem('settingShowDailyFocus', this.settings.showDailyFocus, 'checked');
    setElem('settingShowPomodoro', this.settings.showPomodoro, 'checked');
    setElem('settingShowNotes', this.settings.showNotes, 'checked');

    setElem('settingBgType', this.settings.bgType);
    setElem('settingBgColorVal', this.settings.bgColor);
    setElem('settingBgBlur', this.settings.bgBlur, 'checked');

    const radioTarget = document.querySelector(`input[name="openTarget"][value="${this.settings.openTarget}"]`);
    if (radioTarget) radioTarget.checked = true;

    setElem('settingAutoFocus', this.settings.autoFocus, 'checked');
    setElem('settingConfirmDelete', this.settings.confirmDelete, 'checked');
    setElem('settingInstantSearch', this.settings.instantSearch, 'checked');

    setElem('settingEnableGlobalLimit', this.settings.enableGlobalLimit, 'checked');
    setElem('settingEnableWellbeing', this.settings.enableWellbeing, 'checked');
    setElem('settingEnableDrafts', this.settings.enableDrafts, 'checked');
    setElem('settingEnableStats', this.settings.enableStats, 'checked');

    const reportsAnalytics = document.getElementById('browserReportsAnalyticsContainer');
    const reportsDisabledMsg = document.getElementById('browserReportsDisabledMsg');
    if (reportsAnalytics) {
      reportsAnalytics.classList.toggle('hidden', !this.settings.enableStats);
    }
    if (reportsDisabledMsg) {
      reportsDisabledMsg.classList.toggle('hidden', !!this.settings.enableStats);
    }

    const workspaceEl = document.querySelector('.workspace-toolbar');
    const workspaceWrapper = document.querySelector('.workspace-toolbar-wrapper');
    if (workspaceEl) {
      workspaceEl.classList.toggle('hidden', !this.settings.showWorkspace);
    }
    if (workspaceWrapper) {
      workspaceWrapper.classList.toggle('hidden', !this.settings.showWorkspace);
    }

    const heroTimeSection = document.getElementById('heroTimeSection');
    if (heroTimeSection) {
      heroTimeSection.classList.toggle('hidden', !this.settings.showClock);
    }

    const dailyFocusSection = document.getElementById('dailyFocusSection');
    if (dailyFocusSection) {
      dailyFocusSection.classList.toggle('hidden', !this.settings.showDailyFocus);
    }

    const clockWidget = document.getElementById('clockWidget');
    if (clockWidget) {
      clockWidget.classList.toggle('hidden', !this.settings.showClock);
    }

    const dockTimersBtn = document.getElementById('dockTimersBtn');
    const dockPomoBtn = document.getElementById('dockPomoBtn');
    if (dockTimersBtn) {
      dockTimersBtn.classList.toggle('hidden', !this.settings.showPomodoro);
    }
    if (dockPomoBtn) {
      dockPomoBtn.classList.toggle('hidden', !this.settings.showPomodoro);
    }
    if (!this.settings.showPomodoro) {
      const pomodoroWidget = document.getElementById('pomodoroWidget');
      pomodoroWidget?.classList.remove('flyout-active');
      pomodoroWidget?.classList.add('hidden');
      dockTimersBtn?.classList.remove('active');
    } else {
      document.getElementById('pomodoroWidget')?.classList.remove('hidden');
    }

    const dockNotesBtn = document.getElementById('dockNotesBtn');
    const dockTasksBtn = document.getElementById('dockTasksBtn');
    if (dockNotesBtn) {
      dockNotesBtn.classList.toggle('hidden', !this.settings.showNotes);
    }
    if (dockTasksBtn) {
      dockTasksBtn.classList.toggle('hidden', !this.settings.showNotes);
    }
    if (!this.settings.showNotes) {
      document.getElementById('notesWidget')?.classList.remove('flyout-active');
      document.getElementById('tasksWidget')?.classList.remove('flyout-active');
      document.getElementById('notesWidget')?.classList.add('hidden');
      document.getElementById('tasksWidget')?.classList.add('hidden');
      dockNotesBtn?.classList.remove('active');
      dockTasksBtn?.classList.remove('active');
    } else {
      document.getElementById('notesWidget')?.classList.remove('hidden');
      document.getElementById('tasksWidget')?.classList.remove('hidden');
    }

    const widgetsContainer = document.getElementById('widgetsContainer');
    if (widgetsContainer) {
      const allHidden = !this.settings.showClock && !this.settings.showNotes && !this.settings.showPomodoro;
      widgetsContainer.classList.toggle('all-hidden', allHidden);
    }

    const bgType = this.settings.bgType || 'default';
    document.getElementById('bgOptionsColor')?.classList.toggle('hidden', bgType !== 'color');
    document.getElementById('bgOptionsImage')?.classList.toggle('hidden', bgType !== 'image');

    this.applyBackgroundStyle();

    if (this.grid) {
      this.grid.recalculateLayout();
    }
  }

  async applyBackgroundStyle() {
    const body = document.body;

    if (this.settings.bgType === 'color') {
      if (this.widgetsManager && this.widgetsManager.dynamicBg) {
        this.widgetsManager.dynamicBg.clear();
      }
      body.style.backgroundColor = this.settings.bgColor;
      body.style.backgroundImage = 'none';
    } else if (this.settings.bgType === 'image' && this.settings.bgImageData) {
      if (this.widgetsManager && this.widgetsManager.dynamicBg) {
        this.widgetsManager.dynamicBg.clear();
      }
      body.style.backgroundImage = `url(${this.settings.bgImageData})`;
      body.style.backgroundSize = 'cover';
      body.style.backgroundPosition = 'center';
      body.style.backgroundRepeat = 'no-repeat';
    } else {
      // Cinematic Nature, 360° Parallax & Live Vault Wallpapers
      const { activeWallpaper } = await chrome.storage.local.get('activeWallpaper');
      const currId = activeWallpaper || 'river';
      if (this.widgetsManager && typeof this.widgetsManager.applyWallpaper === 'function') {
        this.widgetsManager.applyWallpaper(currId);
      } else {
        const selected = WALLPAPER_VAULT.find(w => w.id === currId || (w.aliasId && w.aliasId === currId)) || WALLPAPER_VAULT[0];
        const mediaEl = document.getElementById('tabvoraBgMedia');
        if (mediaEl) {
          if (selected && selected.file) {
            mediaEl.style.backgroundImage = `url("${selected.file}")`;
          } else if (selected && selected.gradient) {
            mediaEl.style.backgroundImage = selected.gradient;
          }
        }
        body.style.backgroundImage = 'none';
        body.style.backgroundColor = '#080d1a';
      }
    }

    body.classList.toggle('bg-blurred', !!this.settings.bgBlur);
    body.classList.toggle('frosted-glass', !!this.settings.frostedGlass);
  }

  async updateSetting(key, value) {
    this.settings[key] = value;
    await chrome.storage.local.set({ settings: this.settings });
    this.applySettingsUI();
  }

  playActiveChimeOnce() {
    try {
      if (this.widgetsManager && typeof this.widgetsManager.playChimeSound === 'function') {
        this.widgetsManager.playChimeSound();
      } else {
        chrome.storage.local.get('activeSoundId', ({ activeSoundId }) => {
          if (this.widgetsManager && typeof this.widgetsManager.playSoundById === 'function') {
            this.widgetsManager.playSoundById(activeSoundId || 'crystal');
          }
        });
      }
    } catch (e) {
      console.warn('Error playing setting chime:', e);
    }
  }

  showFeatureConsentModal({ title, iconSvg, desc, confirmText = 'Enable Feature', onConfirm, onCancel }) {
    const dialog = document.getElementById('featureConsentModal');
    if (!dialog) {
      if (typeof onConfirm === 'function') onConfirm();
      return;
    }

    const titleEl = document.getElementById('featureConsentTitle');
    const descEl = document.getElementById('featureConsentDesc');
    const iconEl = document.getElementById('featureConsentIcon');
    const confirmBtn = document.getElementById('featureConsentConfirmBtn');
    const cancelBtn = document.getElementById('featureConsentCancelBtn');

    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.innerHTML = desc;
    if (iconEl && iconSvg) iconEl.innerHTML = iconSvg;
    if (confirmBtn) confirmBtn.textContent = confirmText;

    let resolved = false;

    const cleanup = () => {
      confirmBtn?.removeEventListener('click', handleConfirm);
      cancelBtn?.removeEventListener('click', handleCancel);
      dialog.removeEventListener('click', handleBackdrop);
      dialog.removeEventListener('cancel', handleEsc);
    };

    const handleConfirm = () => {
      if (resolved) return;
      resolved = true;
      cleanup();
      dialog.close();
      if (typeof onConfirm === 'function') onConfirm();
    };

    const handleCancel = () => {
      if (resolved) return;
      resolved = true;
      cleanup();
      dialog.close();
      if (typeof onCancel === 'function') onCancel();
    };

    const handleBackdrop = (e) => {
      if (e.target === dialog) {
        handleCancel();
      }
    };

    const handleEsc = () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        if (typeof onCancel === 'function') onCancel();
      }
    };

    confirmBtn?.addEventListener('click', handleConfirm);
    cancelBtn?.addEventListener('click', handleCancel);
    dialog.addEventListener('click', handleBackdrop);
    dialog.addEventListener('cancel', handleEsc);

    try {
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
    } catch (e) {
      console.warn('Dialog showModal fallback:', e);
    }
  }

  bindConsentFeatureToggles() {
    Object.keys(CONSENT_FEATURES).forEach(toggleId => {
      const toggle = document.getElementById(toggleId);
      const config = CONSENT_FEATURES[toggleId];
      if (!toggle || !config) return;

      // Sync checkbox state with current settings
      toggle.checked = !!this.settings[config.key];

      toggle.addEventListener('change', async () => {
        if (toggle.checked) {
          // Keep toggle visually false while prompt is pending
          toggle.checked = false;

          this.showFeatureConsentModal({
            title: config.title,
            iconSvg: config.iconSvg,
            desc: config.desc,
            confirmText: config.confirmText || 'Enable Feature',
            onConfirm: async () => {
              toggle.checked = true;
              if (typeof config.onEnable === 'function') {
                await config.onEnable(this);
              }
              this.playActiveChimeOnce();
            },
            onCancel: () => {
              toggle.checked = false;
            }
          });
        } else {
          // Turning OFF requires zero popups; disable immediately and play active chime
          if (typeof config.onDisable === 'function') {
            await config.onDisable(this);
          }
          this.playActiveChimeOnce();
        }
      });
    });
  }

  bindEvents() {
    // 🔴 CWS Policy Compliant Native Search Event Listener
    if (this.searchForm) {
      this.searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = this.searchInput.value.trim();
        if (!query) return;
        const sr = document.getElementById('spotlightResults');
        if (sr) { sr.classList.add('hidden'); sr.innerHTML = ''; }
        this.executeWebSearch(query);
      });
    }

    this.searchInput.addEventListener('input', (e) => {
      const q = e.target.value;
      this.clearSearchBtn.classList.toggle('hidden', !q);
      if (this.settings.instantSearch) {
        this.renderSpotlightInstantResults(q);
      } else {
        const sr = document.getElementById('spotlightResults');
        if (sr) { sr.classList.add('hidden'); sr.innerHTML = ''; }
      }
      this.debouncedSearch(q);
    });

    this.searchInput.addEventListener('keydown', (e) => {
      const container = document.getElementById('spotlightResults');
      if (!container || container.classList.contains('hidden')) return;

      const items = Array.from(container.querySelectorAll('.spotlight-result-item'));
      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.activeSpotlightIndex = ((this.activeSpotlightIndex ?? -1) + 1) % items.length;
        items.forEach((el, idx) => el.classList.toggle('selected', idx === this.activeSpotlightIndex));
        items[this.activeSpotlightIndex]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.activeSpotlightIndex = ((this.activeSpotlightIndex ?? 0) - 1 + items.length) % items.length;
        items.forEach((el, idx) => el.classList.toggle('selected', idx === this.activeSpotlightIndex));
        items[this.activeSpotlightIndex]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        const selected = items[this.activeSpotlightIndex] || items[0];
        if (selected) {
          e.preventDefault();
          selected.click();
        }
      } else if (e.key === 'Escape') {
        container.classList.add('hidden');
        container.innerHTML = '';
      }
    });

    this.clearSearchBtn.addEventListener('click', () => {
      this.searchInput.value = '';
      this.clearSearchBtn.classList.add('hidden');
      const sr = document.getElementById('spotlightResults');
      if (sr) { sr.classList.add('hidden'); sr.innerHTML = ''; }
      this.applySearch('');
      this.searchInput.focus();
    });

    this.debouncedSearch = debounce((q) => this.applySearch(q), 100);

    document.addEventListener('click', (e) => {
      this.hideContextMenu();
      if (!e.target.closest('#searchForm') && !e.target.closest('#spotlightResults')) {
        const sr = document.getElementById('spotlightResults');
        if (sr) sr.classList.add('hidden');
      }
    });

    this.contextMenu.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (btn && this.activeContextItem) {
        const action = btn.dataset.action;
        if (action === 'open-new') window.open(this.activeContextItem.url, '_blank');
        if (action === 'pin') {
          await this.db.togglePin(this.activeContextItem.id);
          await this.refreshData();
        }
        if (action === 'archive') {
          await this.archiveShortcutWithUndo(this.activeContextItem.id);
        }
        if (action === 'copy') navigator.clipboard.writeText(this.activeContextItem.url);
        if (action === 'edit') this.openEditModal(this.activeContextItem);
        if (action === 'delete') this.deleteShortcut(this.activeContextItem.id);
      }
    });

    this.addBtn?.addEventListener('click', () => this.openAddModal());
    document.getElementById('appsAddBtn')?.addEventListener('click', () => this.openAddModal());
    this.emptyAddBtn?.addEventListener('click', () => this.openAddModal());
    this.settingsBtn?.addEventListener('click', () => this.settingsModal?.showModal());
    document.getElementById('closeSettingsBtn')?.addEventListener('click', () => this.settingsModal?.close());
    document.getElementById('cancelModalBtn')?.addEventListener('click', () => this.shortcutModal?.close());
    document.getElementById('closeShortcutModalBtn')?.addEventListener('click', () => this.shortcutModal?.close());

    this.shortcutModal?.addEventListener('click', (e) => {
      if (e.target === this.shortcutModal) this.shortcutModal.close();
    });
    this.settingsModal?.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) this.settingsModal.close();
    });

    document.getElementById('closeLimitBtn')?.addEventListener('click', () => {
      this.stopLimitAlertChime();
      this.limitReachedModal?.close();
    });
    document.getElementById('changeLimitBtn')?.addEventListener('click', () => {
      this.stopLimitAlertChime();
      this.limitReachedModal?.close();
      if (this.limitBlockedItem) {
        this.openEditModal(this.limitBlockedItem);
      }
    });
    this.limitReachedModal?.addEventListener('close', () => this.stopLimitAlertChime());

    this.enableLimitToggle?.addEventListener('change', (e) => {
      this.limitOptionsContainer?.classList.toggle('hidden', !e.target.checked);
      if (!e.target.checked) {
        this.customLimitContainer?.classList.add('hidden');
      } else {
        this.customLimitContainer?.classList.toggle('hidden', this.limitPresetSelect?.value !== 'custom');
      }
    });

    this.limitPresetSelect?.addEventListener('change', (e) => {
      this.customLimitContainer?.classList.toggle('hidden', e.target.value !== 'custom');
    });

    const urlInputEl = document.getElementById('urlInput');
    const titleInputEl = document.getElementById('titleInput');

    urlInputEl?.addEventListener('blur', () => {
      const val = (urlInputEl.value || '').trim();
      if (val && titleInputEl && !titleInputEl.value.trim()) {
        const details = parseUrlDetails(val);
        if (details.valid && details.defaultTitle) {
          titleInputEl.value = details.defaultTitle;
        }
      }
    });

    urlInputEl?.addEventListener('input', () => {
      this.urlErrorMsg?.classList.add('hidden');
    });

    this.shortcutForm?.addEventListener('submit', (e) => this.handleFormSubmit(e));
  }

  bindFeature123Events() {
    this.colorLabelSelect?.addEventListener('change', (e) => {
      this.customColorPicker?.classList.toggle('hidden', e.target.value !== 'custom');
    });

    if (this.filterAllBtn) {
      this.filterAllBtn.addEventListener('click', () => {
        this.isRecentFilterActive = false;
        this.activeColorFilter = 'all';
        this.filterAllBtn.classList.add('active');
        this.filterRecentBtn?.classList.remove('active');
        document.querySelectorAll('.color-dot-filter').forEach(d => d.classList.remove('active'));
        this.applySearch(this.searchInput.value);
      });
    }

    if (this.filterRecentBtn) {
      this.filterRecentBtn.addEventListener('click', () => {
        this.isRecentFilterActive = true;
        this.filterRecentBtn.classList.add('active');
        this.filterAllBtn?.classList.remove('active');
        this.applySearch(this.searchInput.value);
      });
    }

    document.querySelectorAll('.color-dot-filter').forEach(dot => {
      dot.addEventListener('click', () => {
        document.querySelectorAll('.color-dot-filter').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        this.activeColorFilter = dot.dataset.color;
        this.applySearch(this.searchInput.value);
      });
      dot.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          dot.click();
        }
      });
    });
  }

  bindPart2FeatureEvents() {
    document.getElementById('findDuplicatesBtn')?.addEventListener('click', async () => {
      const container = document.getElementById('duplicateResultsContainer');
      container.classList.remove('hidden');
      container.innerHTML = '';
      
      const loadingEl = document.createElement('div');
      loadingEl.className = 'setting-desc';
      loadingEl.style.padding = '12px';
      loadingEl.textContent = 'Scanning for duplicates...';
      container.appendChild(loadingEl);

      const all = await this.db.getAllShortcuts();
      const duplicatesMap = {};

      all.forEach(s => {
        const normUrl = s.url.toLowerCase().replace(/\/$/, '');
        if (!duplicatesMap[normUrl]) duplicatesMap[normUrl] = [];
        duplicatesMap[normUrl].push(s);
      });

      const dupeGroups = Object.values(duplicatesMap).filter(group => group.length > 1);
      container.innerHTML = '';

      if (dupeGroups.length === 0) {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'setting-desc';
        emptyEl.style.padding = '12px';
        emptyEl.textContent = 'No duplicate shortcuts found!';
        container.appendChild(emptyEl);
        return;
      }

      dupeGroups.forEach(group => {
        const groupEl = document.createElement('div');
        groupEl.className = 'usage-stat-item';
        
        const headerEl = document.createElement('div');
        headerEl.className = 'usage-stat-header';
        
        const titleStrong = document.createElement('strong');
        titleStrong.textContent = `Duplicate Group (${group.length} items)`;
        
        const mergeBtn = document.createElement('button');
        mergeBtn.className = 'btn btn-secondary merge-dupe-btn';
        mergeBtn.style.padding = '4px 10px';
        mergeBtn.style.fontSize = '11px';
        mergeBtn.textContent = 'Merge Group';
        mergeBtn.dataset.ids = group.map(g => g.id).join(',');

        headerEl.appendChild(titleStrong);
        headerEl.appendChild(mergeBtn);
        groupEl.appendChild(headerEl);

        group.forEach(item => {
          const itemRow = document.createElement('div');
          itemRow.style.display = 'flex';
          itemRow.style.alignItems = 'center';
          itemRow.style.justifyContent = 'space-between';
          itemRow.style.marginTop = '6px';
          itemRow.style.fontSize = '12px';

          const itemText = document.createElement('span');
          itemText.textContent = `${item.title} (${item.url})`;

          const delBtn = document.createElement('button');
          delBtn.className = 'btn btn-danger-subtle delete-dupe-btn';
          delBtn.style.padding = '4px 10px';
          delBtn.style.fontSize = '11px';
          delBtn.textContent = 'Delete';
          delBtn.dataset.id = item.id;

          itemRow.appendChild(itemText);
          itemRow.appendChild(delBtn);
          groupEl.appendChild(itemRow);
        });

        container.appendChild(groupEl);
      });

      container.querySelectorAll('.delete-dupe-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          await this.db.deleteShortcut(btn.dataset.id);
          btn.closest('div').remove();
          await this.refreshData();
        });
      });

      container.querySelectorAll('.merge-dupe-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const ids = btn.dataset.ids.split(',');
          const deleteIds = ids.slice(1);

          for (const dId of deleteIds) {
            await this.db.deleteShortcut(dId);
          }
          this.showSnackbar('Duplicates merged successfully!');
          btn.closest('.usage-stat-item').remove();
          await this.refreshData();
        });
      });
    });

  }

  bindPart3FeatureEvents() {
    document.getElementById('importBookmarksBtn')?.addEventListener('click', async () => {
      if (!chrome.bookmarks) {
        this.showSnackbar('Bookmarks API permission unavailable.');
        return;
      }

      if (confirm('Import all Chrome Bookmarks into Tabvora Shortcuts? Existing shortcuts will not be duplicated.')) {
        chrome.bookmarks.getTree(async (tree) => {
          const importedList = [];

          const isValidImportUrl = (urlString) => {
            if (!urlString) return false;
            try {
              const parsedUrl = new URL(urlString);
              return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
            } catch (e) {
              return false;
            }
          };

          const extractNodes = (nodes) => {
            nodes.forEach(node => {
              if (node.url && isValidImportUrl(node.url)) {
                importedList.push({
                  title: node.title || 'Bookmark',
                  url: node.url
                });
              }
              if (node.children) extractNodes(node.children);
            });
          };

          extractNodes(tree);

          if (importedList.length === 0) {
            this.showSnackbar('No valid bookmarks (http/https) found to import.');
            return;
          }

          let addedCount = 0;
          for (const item of importedList) {
            const dup = await this.db.findDuplicateByUrl(item.url);
            if (!dup) {
              await this.db.saveShortcut({
                url: item.url,
                title: item.title,
                category: 'Bookmarks'
              });
              addedCount++;
            }
          }

          this.showSnackbar(`Successfully imported ${addedCount} bookmark(s)!`);
          await this.refreshData();
          await this.calculateDatabaseStats();
        });
      }
    });

    document.getElementById('optimizeDbBtn')?.addEventListener('click', async () => {
      const btn = document.getElementById('optimizeDbBtn');
      btn.disabled = true;
      btn.textContent = 'Optimizing...';

      const success = await this.db.optimizeDatabase();
      if (success) {
        this.showSnackbar('Database indices optimized & validated successfully!');
      } else {
        this.showSnackbar('Database optimization completed.');
      }

      btn.disabled = false;
      btn.textContent = 'Optimize Database';
      await this.calculateDatabaseStats();
    });
  }

  bindPart4FeatureEvents() {
    document.querySelectorAll('.workspace-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.workspace-pill').forEach(p => { p.classList.remove('active'); p.setAttribute('aria-pressed', 'false'); });
        pill.classList.add('active');
        pill.setAttribute('aria-pressed', 'true');
        this.activeWorkspace = pill.dataset.workspace;
        this.applySearch(this.searchInput.value);
      });
    });

    window.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.isContentEditable
      );

      if (e.key === 'Escape') {
        this.hideContextMenu();
        if (this.shortcutModal && this.shortcutModal.open) this.shortcutModal.close();
        if (this.settingsModal && this.settingsModal.open) this.settingsModal.close();
        if (this.limitReachedModal && this.limitReachedModal.open) this.limitReachedModal.close();
        if (this.duplicateDetectedModal && this.duplicateDetectedModal.open) this.duplicateDetectedModal.close();
        if (this.tutorialModal && this.tutorialModal.open) this.tutorialModal.close();

        const globalOptModal = document.getElementById('globalLimitOptInModal');
        if (globalOptModal && globalOptModal.open) {
          globalOptModal.close();
        }

        const wellbeingOptModal = document.getElementById('wellbeingOptInModal');
        if (wellbeingOptModal && wellbeingOptModal.open) {
          wellbeingOptModal.close();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'f')) {
        e.preventDefault();
        this.searchInput.focus();
        return;
      }

      if (isTyping) return;

      if ((e.altKey && e.key.toLowerCase() === 'a') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        this.openAddModal();
        return;
      }

      if ((e.altKey && e.key.toLowerCase() === 's') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's')) {
        e.preventDefault();
        this.settingsModal.showModal();
        return;
      }

      if (e.altKey && ['1','2','3','4','5'].includes(e.key)) {
        e.preventDefault();
        const map = { '1': 'all', '2': 'main', '3': 'work', '4': 'study', '5': 'personal' };
        const wsKey = map[e.key];
        const targetPill = document.querySelector(`.workspace-pill[data-workspace="${wsKey}"]`);
        if (targetPill) targetPill.click();
      }
    });

    document.getElementById('runIntegrityCheckBtn')?.addEventListener('click', async () => {
      const reportText = document.getElementById('integrityReportText');
      reportText.textContent = 'Scanning and repairing records...';

      const result = await this.db.checkAndRepairIntegrity();
      reportText.textContent = `Scan complete. Checked ${result.total} records. ${result.repairedCount} item(s) safely repaired.`;
      
      await this.calculateDatabaseStats();
      await this.refreshData();
    });
  }

  async renderArchiveList() {
    const all = await this.db.getAllShortcuts();
    const archived = all.filter(s => s.isArchived);
    const active = all.filter(s => !s.isArchived);
    const container = document.getElementById('archiveListContainer');
    const select = document.getElementById('quickArchiveSelect');
    const archiveBtn = document.getElementById('quickArchiveBtn');

    if (select) {
      select.innerHTML = '<option value="">Select a shortcut to archive...</option>';
      active.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.title} (${s.url})`;
        select.appendChild(opt);
      });
    }

    if (archiveBtn && !archiveBtn.dataset.bound) {
      archiveBtn.dataset.bound = 'true';
      archiveBtn.addEventListener('click', async () => {
        const id = select?.value;
        if (!id) {
          this.showSnackbar('Please select a shortcut to archive first.');
          return;
        }
        await this.db.toggleArchive(id);
        await this.renderArchiveList();
        await this.refreshData();
        this.showSnackbar('Shortcut moved to archive');
      });
    }

    if (!container) return;

    container.innerHTML = '';
    if (archived.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'empty-desc';
      emptyEl.style.padding = '24px';
      emptyEl.textContent = 'No archived shortcuts found. You can archive any shortcut using its card menu or the selector above.';
      container.appendChild(emptyEl);
      return;
    }

    archived.forEach(s => {
      const itemEl = document.createElement('div');
      itemEl.className = 'usage-stat-item';

      const headerEl = document.createElement('div');
      headerEl.className = 'usage-stat-header';

      const infoEl = document.createElement('div');
      infoEl.className = 'usage-stat-info';

      const iconImg = document.createElement('img');
      iconImg.className = 'usage-stat-icon';
      iconImg.src = getFaviconUrl(s.url);
      iconImg.alt = '';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'usage-stat-name';
      nameSpan.textContent = s.title;

      infoEl.appendChild(iconImg);
      infoEl.appendChild(nameSpan);

      const btnGroup = document.createElement('div');
      btnGroup.style.display = 'flex';
      btnGroup.style.gap = '6px';

      const restoreBtn = document.createElement('button');
      restoreBtn.className = 'btn btn-secondary restore-archive-btn';
      restoreBtn.style.padding = '4px 10px';
      restoreBtn.style.fontSize = '11px';
      restoreBtn.textContent = 'Restore';
      restoreBtn.dataset.id = s.id;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-danger-subtle delete-archive-btn';
      deleteBtn.style.padding = '4px 10px';
      deleteBtn.style.fontSize = '11px';
      deleteBtn.textContent = 'Delete';
      deleteBtn.dataset.id = s.id;

      btnGroup.appendChild(restoreBtn);
      btnGroup.appendChild(deleteBtn);

      headerEl.appendChild(infoEl);
      headerEl.appendChild(btnGroup);
      itemEl.appendChild(headerEl);

      container.appendChild(itemEl);
    });

    container.querySelectorAll('.restore-archive-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await this.db.toggleArchive(btn.dataset.id);
        await this.renderArchiveList();
        await this.refreshData();
        if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
          chrome.runtime.sendMessage({ action: 'SHORTCUTS_UPDATED' }, () => {
            if (chrome.runtime.lastError) {}
          });
        }
        this.showSnackbar('Shortcut restored from archive');
      });
    });

    container.querySelectorAll('.delete-archive-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await this.deleteShortcut(btn.dataset.id);
        await this.renderArchiveList();
      });
    });
  }

  bindUsageEvents() {
    document.querySelectorAll('.stats-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.stats-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentStatsRange = btn.dataset.range;
        document.getElementById('statsCustomRangeContainer')?.classList.toggle('hidden', this.currentStatsRange !== 'custom');
        this.renderUsageStatistics();
      });
    });

    document.getElementById('browserStartDate')?.addEventListener('change', () => this.renderUsageStatistics());
    document.getElementById('browserEndDate')?.addEventListener('change', () => this.renderUsageStatistics());
    document.getElementById('statsStartDate')?.addEventListener('change', () => this.renderUsageStatistics());
    document.getElementById('statsEndDate')?.addEventListener('change', () => this.renderUsageStatistics());

    document.getElementById('clearStatsBtn')?.addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear all usage statistics?')) {
        await this.db.clearAllUsageStats();
        try {
          const allLocal = await chrome.storage.local.get(null);
          const keysToRemove = Object.keys(allLocal).filter(k => 
            k.startsWith('site_usage_') || 
            k.startsWith('global_browser_usage_') || 
            k === 'global_longest_session'
          );
          if (keysToRemove.length > 0) {
            await chrome.storage.local.remove(keysToRemove);
          }
        } catch (e) {}
        await this.renderBrowserReports();
        await this.renderUsageStatistics();
        this.showSnackbar('Usage statistics cleared.');
      }
    });

    document.getElementById('exportStatsBtn')?.addEventListener('click', async () => {
      try {
        const records = await this.db.getAllUsageRecords();
        const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tabvora-stats-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showSnackbar('Statistics exported successfully.');
      } catch (e) {
        this.showSnackbar('Failed to export statistics.');
      }
    });
  }

  bindGlobalLimitEvents() {
    const toggle = document.getElementById('settingEnableGlobalLimit');
    const container = document.getElementById('globalLimitInputsContainer');
    const hoursInput = document.getElementById('globalLimitHours');
    const minsInput = document.getElementById('globalLimitMinutes');
    const saveBtn = document.getElementById('saveGlobalLimitBtn');

    if (toggle) {
      toggle.checked = !!this.settings.enableGlobalLimit;
      if (container) container.classList.toggle('hidden', !this.settings.enableGlobalLimit);
    }

    if (hoursInput) hoursInput.value = this.settings.globalLimitHours || 1;
    if (minsInput) minsInput.value = this.settings.globalLimitMinutes || 0;

    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const h = parseInt(hoursInput.value, 10) || 0;
        const m = parseInt(minsInput.value, 10) || 0;
        await this.updateSetting('globalLimitHours', h);
        await this.updateSetting('globalLimitMinutes', m);
        this.showSnackbar('Global Browser Limit saved!');
        await this.renderBrowserUsageCard();
      });
    }
  }

  showGlobalLimitOptInModal() {
    const cfg = CONSENT_FEATURES.settingEnableGlobalLimit;
    if (!cfg) return;
    this.showFeatureConsentModal({
      title: cfg.title,
      iconSvg: cfg.iconSvg,
      desc: cfg.desc,
      confirmText: cfg.confirmText,
      onConfirm: async () => {
        const toggle = document.getElementById('settingEnableGlobalLimit');
        if (toggle) toggle.checked = true;
        await cfg.onEnable(this);
        this.playActiveChimeOnce();
      }
    });
  }

  bindWellbeingEvents() {
    const toggle = document.getElementById('settingEnableWellbeing');
    if (toggle) {
      toggle.checked = !!this.settings.enableWellbeing;
    }

    document.getElementById('testWellbeingChimeBtn')?.addEventListener('click', () => {
      this.playWellbeingTestChime();
      this.showSnackbar('🎵 Playing harmonic focus chime (C5, E5, G5)');
    });
  }

  playWellbeingTestChime() {
    try {
      chrome.storage.local.get('activeSoundId', ({ activeSoundId }) => {
        if (this.widgetsManager && typeof this.widgetsManager.playSoundById === 'function') {
          this.widgetsManager.playSoundById(activeSoundId || 'crystal');
        } else {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (!AudioCtx) return;
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') ctx.resume().catch(() => {});
          const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 harmonic chord
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
            gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + idx * 0.12 + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.12 + 0.45);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.12);
            osc.stop(ctx.currentTime + idx * 0.12 + 0.5);
          });
          setTimeout(() => {
            try { if (ctx && ctx.state !== 'closed') ctx.close(); } catch (_) {}
          }, 1500);
        }
      });
    } catch (_) {}
  }

  showWellbeingOptInModal() {
    const cfg = CONSENT_FEATURES.settingEnableWellbeing;
    if (!cfg) return;
    this.showFeatureConsentModal({
      title: cfg.title,
      iconSvg: cfg.iconSvg,
      desc: cfg.desc,
      confirmText: cfg.confirmText,
      onConfirm: async () => {
        const toggle = document.getElementById('settingEnableWellbeing');
        if (toggle) toggle.checked = true;
        await cfg.onEnable(this);
        this.playActiveChimeOnce();
      }
    });
  }

  async renderBrowserUsageCard() {
    const widget = document.getElementById('browserUsageWidget');
    if (!widget) return;

    if (!this.settings.showBrowserUsage || !this.settings.enableGlobalLimit) {
      widget.classList.add('hidden');
      return;
    }

    widget.classList.remove('hidden');

    const todayStr = this.db.getLocalTodayString();
    const usedMs = await this.db.getGlobalBrowserUsage(todayStr);
    const usedMins = Math.floor(usedMs / 60000);

    const limitMins = (parseInt(this.settings.globalLimitHours || 0, 10) * 60) + parseInt(this.settings.globalLimitMinutes || 0, 10);

    const timeText = document.getElementById('browserUsageTimeText');
    const fill = document.getElementById('browserUsageProgressFill');
    const remText = document.getElementById('browserUsageRemainingText');

    if (timeText) timeText.textContent = `${usedMins}m / ${limitMins}m`;

    let pct = limitMins > 0 ? Math.min(100, Math.round((usedMins / limitMins) * 100)) : 0;
    if (fill) fill.style.width = `${pct}%`;

    const remainingMins = Math.max(0, limitMins - usedMins);
    if (remText) remText.textContent = `Remaining: ${remainingMins}m`;
  }

  bindBrowserReportEvents() {
    document.querySelectorAll('.browser-report-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.browser-report-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentBrowserReportRange = btn.dataset.range;
        this.currentStatsRange = btn.dataset.range;
        document.getElementById('browserCustomRangeContainer')?.classList.toggle('hidden', this.currentBrowserReportRange !== 'custom');
        this.renderBrowserReports();
        this.renderUsageStatistics();
      });
    });

    document.getElementById('browserStartDate')?.addEventListener('change', () => {
      this.renderBrowserReports();
      this.renderUsageStatistics();
    });
    document.getElementById('browserEndDate')?.addEventListener('change', () => {
      this.renderBrowserReports();
      this.renderUsageStatistics();
    });

    // Auto live-sync when storage updates (Usage, Wallpapers, Rewards)
    if (chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
          if (changes.activeWallpaper) {
            this.applyBackgroundStyle();
          }
          if (changes.activeWallpaper || changes.unlockedWallpapers || changes.user_points) {
            if (this.widgetsManager && typeof this.widgetsManager.refreshRewardsView === 'function') {
              this.widgetsManager.refreshRewardsView();
            }
          }
          const hasUsageUpdate = Object.keys(changes).some(k => k.startsWith('site_usage_') || k.startsWith('global_browser_usage_'));
          if (hasUsageUpdate) {
            const reportPanel = document.getElementById('tab-reports');
            if (reportPanel && !reportPanel.classList.contains('hidden')) {
              this.renderBrowserReports();
              this.renderUsageStatistics();
            }
          }
        }
      });
    }

    // Refresh when user returns focus to Tabvora
    window.addEventListener('focus', () => {
      const reportPanel = document.getElementById('tab-reports');
      if (reportPanel && !reportPanel.classList.contains('hidden')) {
        this.renderBrowserReports();
        this.renderUsageStatistics();
      }
    });
  }

  getDatesForRange(range) {
    const todayStr = this.db.getLocalTodayString();
    let datesToQuery = [];

    if (range === 'today') {
      datesToQuery = [todayStr];
    } else if (range === 'week') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        datesToQuery.push(`${y}-${m}-${day}`);
      }
    } else if (range === 'month') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        datesToQuery.push(`${y}-${m}-${day}`);
      }
    } else if (range === 'custom') {
      const startVal = document.getElementById('browserStartDate')?.value;
      const endVal = document.getElementById('browserEndDate')?.value;
      if (startVal && endVal) {
        let curr = new Date(startVal);
        const end = new Date(endVal);
        while (curr <= end) {
          const y = curr.getFullYear();
          const m = String(curr.getMonth() + 1).padStart(2, '0');
          const day = String(curr.getDate()).padStart(2, '0');
          datesToQuery.push(`${y}-${m}-${day}`);
          curr.setDate(curr.getDate() + 1);
        }
      } else {
        datesToQuery = [todayStr];
      }
    } else {
      datesToQuery = [todayStr];
    }
    return datesToQuery;
  }

  async renderBrowserReports() {
    const range = this.currentBrowserReportRange || this.currentStatsRange || 'today';
    const datesToQuery = this.getDatesForRange(range);

    // 1. Fetch website records from IndexedDB
    const records = await this.db.getAllUsageRecords();
    const validRecords = (records || []).filter(r => {
      const target = r.origin || r.shortcutId || '';
      return target && !target.startsWith('chrome-extension://') && !target.startsWith('chrome://');
    });

    const matchingRecords = validRecords.filter(r => datesToQuery.includes(r.date));
    const siteUsageTotalMs = matchingRecords.reduce((acc, r) => acc + (r.ms || 0), 0);

    // 2. Fetch site usage from chrome.storage.local
    const storageKeys = datesToQuery.map(d => `site_usage_${d}`);
    const storageData = await chrome.storage.local.get(storageKeys);
    let storageSiteUsageMs = 0;
    const allSiteMsValues = [];

    for (const dStr of datesToQuery) {
      const daySites = storageData[`site_usage_${dStr}`] || {};
      for (const ms of Object.values(daySites)) {
        storageSiteUsageMs += (ms || 0);
        allSiteMsValues.push(ms || 0);
      }
    }

    // 3. Fetch global browser usage from storage
    let globalUsageTotalMs = 0;
    for (const dStr of datesToQuery) {
      const ms = await this.db.getGlobalBrowserUsage(dStr);
      globalUsageTotalMs += ms;
    }

    const totalMs = Math.max(siteUsageTotalMs, globalUsageTotalMs, storageSiteUsageMs);
    const daysCount = Math.max(1, datesToQuery.length);
    const avgMs = Math.round(totalMs / daysCount);

    let longestSessionMs = await this.db.getLongestSession();
    const maxSingleSiteMs = Math.max(
      matchingRecords.reduce((max, r) => Math.max(max, r.ms || 0), 0),
      allSiteMsValues.length > 0 ? Math.max(...allSiteMsValues) : 0
    );
    longestSessionMs = Math.max(longestSessionMs, maxSingleSiteMs);

    const totalEl = document.getElementById('reportTotalUsage');
    const avgEl = document.getElementById('reportAvgDaily');
    const longestEl = document.getElementById('reportLongestSession');

    if (totalEl) totalEl.textContent = this.formatDuration(totalMs);
    if (avgEl) avgEl.textContent = this.formatDuration(avgMs);
    if (longestEl) longestEl.textContent = this.formatDuration(longestSessionMs);
  }

  bindDraftEvents() {
    const toggle = document.getElementById('settingEnableDrafts');
    if (toggle) {
      toggle.checked = !!this.settings.enableDrafts;
    }

    document.getElementById('settingDraftInterval')?.addEventListener('change', (e) => {
      this.updateSetting('draftInterval', parseInt(e.target.value, 10));
    });

    document.getElementById('settingDraftRetention')?.addEventListener('change', (e) => {
      this.updateSetting('draftRetention', parseInt(e.target.value, 10));
    });

    document.getElementById('settingDraftQuota')?.addEventListener('change', (e) => {
      this.updateSetting('draftQuota', parseInt(e.target.value, 10));
    });

    document.getElementById('clearAllDraftsBtn')?.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete all saved drafts?')) {
        await this.db.clearAllDrafts();
        this.updateDraftStorageUI();
        this.showSnackbar('All drafts deleted.');
      }
    });
  }

  showDraftOptInModal() {
    const cfg = CONSENT_FEATURES.settingEnableDrafts;
    if (!cfg) return;
    this.showFeatureConsentModal({
      title: cfg.title,
      iconSvg: cfg.iconSvg,
      desc: cfg.desc,
      confirmText: cfg.confirmText,
      onConfirm: async () => {
        const toggle = document.getElementById('settingEnableDrafts');
        if (toggle) toggle.checked = true;
        await cfg.onEnable(this);
        this.playActiveChimeOnce();
      }
    });
  }

  showStatsOptInModal() {
    const cfg = CONSENT_FEATURES.settingEnableStats;
    if (!cfg) return;
    this.showFeatureConsentModal({
      title: cfg.title,
      iconSvg: cfg.iconSvg,
      desc: cfg.desc,
      confirmText: cfg.confirmText,
      onConfirm: async () => {
        const toggle = document.getElementById('settingEnableStats');
        if (toggle) toggle.checked = true;
        await cfg.onEnable(this);
        this.playActiveChimeOnce();
      }
    });
  }

  async updateDraftStorageUI() {
    const bytes = await this.db.getDraftStorageSize();
    const kb = (bytes / 1024).toFixed(1);
    const quotaMb = this.settings.draftQuota || 250;
    const textEl = document.getElementById('draftStorageUsedText');
    if (textEl) {
      textEl.textContent = `${kb} KB / ${quotaMb} MB`;
    }
  }

  formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  async renderUsageStatistics() {
    const container = document.getElementById('statsListContainer');
    if (!container) return;
    container.innerHTML = '';

    const range = this.currentBrowserReportRange || this.currentStatsRange || 'today';
    const datesToQuery = this.getDatesForRange(range);

    // 1. Fetch website records from IndexedDB
    const records = await this.db.getAllUsageRecords();
    const validRecords = (records || []).filter(r => {
      const target = r.origin || r.shortcutId || '';
      return target && !target.startsWith('chrome-extension://') && !target.startsWith('chrome://');
    });

    // 2. Fetch site usage from chrome.storage.local
    const storageKeys = datesToQuery.map(d => `site_usage_${d}`);
    let storageData = {};
    try {
      storageData = await chrome.storage.local.get(storageKeys);
    } catch (e) {}

    // 3. Aggregate total duration per website origin
    const aggregated = {};

    // From IndexedDB records matching selected dates
    const matchingRecords = validRecords.filter(r => datesToQuery.includes(r.date));
    matchingRecords.forEach(r => {
      let key = r.origin;
      if (!key || !key.startsWith('http')) {
        const found = this.shortcuts.find(s => s.id === r.shortcutId);
        if (found) {
          key = this.db.getOriginFromUrl(found.url);
        }
      }

      if (key && !key.startsWith('chrome-extension://') && !key.startsWith('chrome://')) {
        const ms = r.ms || (r.minutes ? r.minutes * 60000 : 0);
        aggregated[key] = (aggregated[key] || 0) + ms;
      }
    });

    // Merge from chrome.storage.local (taking max or adding uncommitted time)
    for (const dStr of datesToQuery) {
      const daySites = storageData[`site_usage_${dStr}`] || {};
      for (const [origin, ms] of Object.entries(daySites)) {
        if (origin && ms > 0 && !origin.startsWith('chrome-extension://') && !origin.startsWith('chrome://')) {
          aggregated[origin] = Math.max(aggregated[origin] || 0, ms);
        }
      }
    }

    const originUsageList = [];
    for (const [originKey, ms] of Object.entries(aggregated)) {
      if (!ms || ms < 1000) continue; // Skip negligible < 1s

      const matchedShortcut = this.shortcuts.find(s => this.db.getOriginFromUrl(s.url) === originKey);
      
      let title = matchedShortcut ? matchedShortcut.title : '';
      if (!title) {
        try {
          const parsed = new URL(originKey);
          let host = parsed.hostname.replace(/^www\./, '');
          title = host.charAt(0).toUpperCase() + host.slice(1);
        } catch (e) {
          title = originKey;
        }
      }

      const iconUrl = matchedShortcut ? getFaviconUrl(matchedShortcut.url) : getFaviconUrl(originKey);
      originUsageList.push({ originKey, title, iconUrl, ms });
    }

    originUsageList.sort((a, b) => b.ms - a.ms);

    if (originUsageList.length === 0) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'empty-desc';
      emptyEl.style.padding = '24px';
      emptyEl.style.textAlign = 'center';
      emptyEl.textContent = 'No website usage recorded for selected period.';
      container.appendChild(emptyEl);
      return;
    }

    const maxMs = originUsageList[0].ms || 1;

    originUsageList.forEach(({ originKey, title, iconUrl, ms }) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'usage-stat-item';
      const percentage = Math.min(100, Math.max(4, Math.round((ms / maxMs) * 100)));

      const headerEl = document.createElement('div');
      headerEl.className = 'usage-stat-header';

      const infoEl = document.createElement('div');
      infoEl.className = 'usage-stat-info';
      infoEl.style.display = 'flex';
      infoEl.style.alignItems = 'center';
      infoEl.style.gap = '8px';

      const iconImg = document.createElement('img');
      iconImg.className = 'usage-stat-icon';
      iconImg.src = iconUrl;
      iconImg.alt = '';
      iconImg.style.width = '18px';
      iconImg.style.height = '18px';
      iconImg.style.borderRadius = '4px';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'usage-stat-name';
      nameSpan.textContent = title;
      nameSpan.title = originKey;

      infoEl.appendChild(iconImg);
      infoEl.appendChild(nameSpan);

      const timeSpan = document.createElement('span');
      timeSpan.className = 'usage-stat-time';
      timeSpan.textContent = this.formatDuration(ms);
      timeSpan.style.fontWeight = '600';
      timeSpan.style.fontSize = '12px';
      timeSpan.style.color = 'var(--text-primary)';

      headerEl.appendChild(infoEl);
      headerEl.appendChild(timeSpan);

      const progressBg = document.createElement('div');
      progressBg.className = 'usage-progress-bg';

      const progressFill = document.createElement('div');
      progressFill.className = 'usage-progress-fill';
      progressFill.style.width = `${percentage}%`;

      progressBg.appendChild(progressFill);

      itemEl.appendChild(headerEl);
      itemEl.appendChild(progressBg);

      container.appendChild(itemEl);
    });
  }

  showContextMenu(e, item) {
    this.activeContextItem = item;
    this.contextMenu.style.left = `${Math.min(e.clientX, window.innerWidth - 190)}px`;
    this.contextMenu.style.top = `${Math.min(e.clientY, window.innerHeight - 180)}px`;
    this.contextMenu.classList.remove('hidden');
  }

  hideContextMenu() {
    this.contextMenu.classList.add('hidden');
    this.activeContextItem = null;
  }

  bindSettingsEvents() {
    this.navItems.forEach(btn => {
      btn.addEventListener('click', () => {
        this.navItems.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
        this.tabPanels.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        document.getElementById(btn.dataset.tab).classList.add('active');

        if (btn.dataset.tab === 'tab-reports') {
          const reportsAnalytics = document.getElementById('browserReportsAnalyticsContainer');
          const reportsDisabledMsg = document.getElementById('browserReportsDisabledMsg');
          if (reportsAnalytics) reportsAnalytics.classList.toggle('hidden', !this.settings.enableStats);
          if (reportsDisabledMsg) reportsDisabledMsg.classList.toggle('hidden', !!this.settings.enableStats);

          if (this.settings.enableStats) {
            this.renderBrowserReports();
            this.renderUsageStatistics();
          }
        }
        if (btn.dataset.tab === 'tab-data') {
          this.calculateDatabaseStats();
          this.updateDraftStorageUI();
        }
        if (btn.dataset.tab === 'tab-archive') {
          this.renderArchiveList();
        }
      });
    });

    // 🔔 Play Active Chime 1x on Any Setting Toggle (On/Off switches & radio buttons across all 9 tabs)
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
      settingsModal.addEventListener('change', (e) => {
        if (e.target && (e.target.type === 'checkbox' || e.target.type === 'radio')) {
          if (CONSENT_FEATURES && CONSENT_FEATURES[e.target.id]) {
            return; // Handled exclusively by consent feature toggle system
          }
          this.playActiveChimeOnce();
        }
      });
    }

    // Initialize 7 Consent Feature Toggles with Executive Confirmation Modals
    this.bindConsentFeatureToggles();

    // Also support website limit toggle inside Add/Edit Shortcut modal
    document.getElementById('enableLimitToggle')?.addEventListener('change', () => {
      this.playActiveChimeOnce();
    });

    document.getElementById('settingTheme')?.addEventListener('change', (e) => this.updateSetting('theme', e.target.value));

    document.getElementById('settingUserName')?.addEventListener('input', debounce((e) => {
      const newName = (e.target.value || '').trim();
      chrome.storage.local.set({ userName: newName });
      const heroGreeting = document.getElementById('heroGreeting');
      if (heroGreeting) {
        const hour = new Date().getHours();
        let greeting = 'Good day';
        if (hour >= 5 && hour < 12) greeting = 'Good morning';
        else if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
        else if (hour >= 17 && hour < 22) greeting = 'Good evening';
        else greeting = 'Good night';
        heroGreeting.textContent = newName ? `${greeting}, ${newName}.` : `${greeting}.`;
      }
    }, 200));

    document.getElementById('settingShowWorkspace')?.addEventListener('change', (e) => this.updateSetting('showWorkspace', e.target.checked));
    document.getElementById('settingShowClock')?.addEventListener('change', (e) => {
      this.updateSetting('showClock', e.target.checked);
      this.showSnackbar(e.target.checked ? '🕒 Clock & Date widget enabled.' : 'Clock & Date widget hidden.');
    });
    document.getElementById('settingShowPomodoro')?.addEventListener('change', (e) => {
      this.updateSetting('showPomodoro', e.target.checked);
      this.showSnackbar(e.target.checked ? '⏱️ Focus & Pomodoro Timer shown on dock.' : 'Focus & Pomodoro Timer hidden from dock.');
    });
    document.getElementById('settingShowNotes')?.addEventListener('change', (e) => {
      this.updateSetting('showNotes', e.target.checked);
      this.showSnackbar(e.target.checked ? '📝 Notes & Tasks shown on dock.' : 'Notes & Tasks hidden from dock.');
    });

    document.getElementById('settingBgType')?.addEventListener('change', (e) => this.updateSetting('bgType', e.target.value));
    document.getElementById('settingBgColorVal')?.addEventListener('input', (e) => this.updateSetting('bgColor', e.target.value));

    const uploadBtn = document.getElementById('uploadBgBtn');
    const fileInput = document.getElementById('bgFileInput');
    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            this.settings.bgImageData = evt.target.result;
            this.updateSetting('bgType', 'image');
          };
          reader.readAsDataURL(file);
        }
      });
    }

    document.getElementById('resetBgBtn')?.addEventListener('click', () => {
      this.settings.bgImageData = null;
      this.updateSetting('bgType', 'default');
    });

    document.querySelectorAll('input[name="openTarget"]').forEach(r => {
      r.addEventListener('change', (e) => this.updateSetting('openTarget', e.target.value));
    });
    document.getElementById('settingAutoFocus')?.addEventListener('change', (e) => this.updateSetting('autoFocus', e.target.checked));
    document.getElementById('settingConfirmDelete')?.addEventListener('change', (e) => this.updateSetting('confirmDelete', e.target.checked));

    document.getElementById('settingInstantSearch')?.addEventListener('change', (e) => {
      this.updateSetting('instantSearch', e.target.checked);
      if (!e.target.checked) {
        const sr = document.getElementById('spotlightResults');
        if (sr) { sr.classList.add('hidden'); sr.innerHTML = ''; }
      }
      this.showSnackbar(e.target.checked ? '⚡ Instant Spotlight Search enabled.' : 'Instant Spotlight Search disabled.');
    });

    const privacyBtn = document.getElementById('openPrivacyBtn') || document.getElementById('btnPrivacyPolicy');
    privacyBtn?.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('privacy.html') });
    });

    document.getElementById('settingReduceMotion')?.addEventListener('change', (e) => this.updateSetting('reduceMotion', e.target.checked));

    document.getElementById('exportBtn')?.addEventListener('click', () => this.exportBackup());
    document.getElementById('importBtn')?.addEventListener('click', () => document.getElementById('importFileInput').click());
    document.getElementById('importFileInput')?.addEventListener('change', (e) => this.importBackup(e));
    
    document.getElementById('factoryResetBtn')?.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to reset all settings and data? This action cannot be undone and will permanently delete all shortcuts, usage stats, and drafts.')) {
        return;
      }

      try {
        if (this.db) {
          try {
            await Promise.all([
              typeof this.db.clearAllShortcuts === 'function' ? this.db.clearAllShortcuts() : Promise.resolve(),
              typeof this.db.clearAllUsageStats === 'function' ? this.db.clearAllUsageStats() : Promise.resolve(),
              typeof this.db.clearAllDrafts === 'function' ? this.db.clearAllDrafts() : Promise.resolve()
            ]);
          } catch (storeClearError) {
            console.warn('Store pre-clear notice:', storeClearError);
          }

          if (typeof this.db.close === 'function') {
            this.db.close();
          }
        }

        const targetDbName = 'SmartSpeedDialDB';

        await new Promise((resolve, reject) => {
          const req = indexedDB.deleteDatabase(targetDbName);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(new Error(`Failed to delete database: ${req.error?.message || 'IndexedDB deletion failed.'}`));
          req.onblocked = () => {
            const timeout = setTimeout(() => {
              reject(new Error('Factory Reset blocked. Please close other Tabvora tabs and try again.'));
            }, 3000);
            req.onsuccess = () => {
              clearTimeout(timeout);
              resolve();
            };
          };
        });

        if (chrome.storage && chrome.storage.local) {
          await chrome.storage.local.clear();
        }

        if (chrome.storage && chrome.storage.session) {
          await chrome.storage.session.clear();
        }

        location.reload();

      } catch (err) {
        console.error('Factory Reset Error:', err);
        if (typeof this.showSnackbar === 'function') {
          this.showSnackbar(err.message || 'Factory Reset failed. Please try again.');
        } else {
          alert(err.message || 'Factory Reset failed. Please try again.');
        }
      }
    });
  }

  async calculateDatabaseStats() {
    const shortcuts = await this.db.getAllShortcuts();
    const breakdown = await this.db.getDetailedStorageBreakdown();
    const fmt = (bytes) => (bytes / 1024).toFixed(1) + ' KB';

    const setIf = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setIf('sizeShortcuts', fmt(breakdown.shortcuts));
    setIf('sizeNotes', fmt(breakdown.notes));
    setIf('sizeStats', fmt(breakdown.stats));
    setIf('sizeDrafts', fmt(breakdown.drafts));
    setIf('sizeBackground', fmt(breakdown.background));

    setIf('statShortcuts', shortcuts.length);
    const folders = new Set(shortcuts.map(s => s.category).filter(Boolean));
    setIf('statFolders', folders.size);
    const totalBytes = breakdown.shortcuts + breakdown.notes + breakdown.stats + breakdown.drafts + breakdown.background;
    setIf('statDbSize', fmt(totalBytes));

    const health = await this.db.getDatabaseHealth();
    setIf('dbHealthBadge', `${health.percent}%`);
    setIf('dbHealthDesc', health.status);
  }

  async refreshData() {
    this.shortcuts = await this.db.getAllShortcuts();
    const dockAppsBadge = document.getElementById('dockAppsBadge');
    if (dockAppsBadge) {
      dockAppsBadge.textContent = this.shortcuts.length;
    }
    const appsHeaderCount = document.getElementById('appsHeaderCount');
    if (appsHeaderCount) {
      appsHeaderCount.textContent = this.shortcuts.length;
    }
    this.applySearch(this.searchInput ? this.searchInput.value : '');
  }

  applySearch(query) {
    const term = (query || '').trim().toLowerCase();
    let list = this.shortcuts.filter(s => !s.isArchived);

    if (this.activeWorkspace && this.activeWorkspace !== 'all') {
      list = list.filter(s => (s.workspace || 'main') === this.activeWorkspace);
    }

    if (this.isRecentFilterActive) {
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    if (this.activeColorFilter && this.activeColorFilter !== 'all') {
      list = list.filter(s => s.color === this.activeColorFilter);
    }

    if (!term) {
      this.filteredShortcuts = list;
    } else {
      this.filteredShortcuts = list.filter(s => {
        const matchTitle = s.title && s.title.toLowerCase().includes(term);
        const matchUrl = s.url && s.url.toLowerCase().includes(term);
        const matchNotes = s.notes && s.notes.toLowerCase().includes(term);
        return matchTitle || matchUrl || matchNotes;
      });
    }

    const appsHeaderCount = document.getElementById('appsHeaderCount');
    if (appsHeaderCount) {
      appsHeaderCount.textContent = this.filteredShortcuts.length;
    }

    // Keep viewport always visible so cards and the dedicated '+ Add New' tile are displayed
    if (this.viewport) {
      this.viewport.classList.remove('hidden');
    }

    if (this.filteredShortcuts.length === 0 && term) {
      this.emptyState?.classList.remove('hidden');
      const emptyTitle = this.emptyState?.querySelector('h3, .empty-title, strong');
      const emptyDesc = this.emptyState?.querySelector('p, .empty-desc');
      const emptyBtn = this.emptyAddBtn || this.emptyState?.querySelector('button');

      if (emptyTitle) emptyTitle.textContent = 'No matching shortcuts found';
      if (emptyDesc) emptyDesc.textContent = `Press Enter to search "${term}" on the web`;
      if (emptyBtn) emptyBtn.style.display = 'none';
    } else {
      this.emptyState?.classList.add('hidden');
    }

    this.grid.setData(this.filteredShortcuts);
  }

  executeWebSearch(query) {
    const q = (query || '').trim();
    if (!q) return;

    if (/^https?:\/\//i.test(q) || (q.includes('.') && !q.includes(' '))) {
      const targetUrl = /^https?:\/\//i.test(q) ? q : `https://${q}`;
      window.location.href = targetUrl;
    } else if (typeof chrome !== 'undefined' && chrome.search && typeof chrome.search.query === 'function') {
      try {
        chrome.search.query({ text: q, disposition: "CURRENT_TAB" });
      } catch (err) {
        window.location.href = "https://www.google.com/search?q=" + encodeURIComponent(q);
      }
    } else {
      window.location.href = "https://www.google.com/search?q=" + encodeURIComponent(q);
    }
  }

  renderSpotlightInstantResults(query) {
    const container = document.getElementById('spotlightResults');
    if (!container) return;

    const trimmed = (query || '').trim();
    if (!trimmed || !this.settings.instantSearch) {
      container.classList.add('hidden');
      container.innerHTML = '';
      this.activeSpotlightIndex = -1;
      return;
    }

    const termLower = trimmed.toLowerCase();
    const activeList = (this.shortcuts || []).filter(s => !s.isArchived);
    const matches = activeList.filter(s => {
      const title = (s.title || '').toLowerCase();
      const url = (s.url || '').toLowerCase();
      const notes = (s.notes || '').toLowerCase();
      const tags = Array.isArray(s.tags) ? s.tags.join(' ').toLowerCase() : '';
      return title.includes(termLower) || url.includes(termLower) || notes.includes(termLower) || tags.includes(termLower);
    }).slice(0, 6);

    container.innerHTML = '';
    this.activeSpotlightIndex = 0;

    matches.forEach((s, idx) => {
      const itemEl = document.createElement('div');
      itemEl.className = `spotlight-result-item ${idx === 0 ? 'selected' : ''}`;
      itemEl.dataset.type = 'shortcut';
      itemEl.dataset.url = s.url;
      itemEl.dataset.index = idx;

      const iconBox = document.createElement('div');
      iconBox.className = 'spotlight-result-icon-box';
      const icon = document.createElement('img');
      icon.className = 'spotlight-result-icon';
      icon.src = getFaviconUrl(s.url);
      icon.alt = '';
      iconBox.appendChild(icon);

      const info = document.createElement('div');
      info.className = 'spotlight-result-info';

      const title = document.createElement('div');
      title.className = 'spotlight-result-title';
      title.textContent = s.title || s.url;

      const url = document.createElement('div');
      url.className = 'spotlight-result-url';
      url.textContent = s.url;

      info.appendChild(title);
      info.appendChild(url);

      const badge = document.createElement('span');
      badge.className = 'spotlight-result-badge';
      badge.textContent = s.workspace ? s.workspace.toUpperCase() : 'APP';

      itemEl.appendChild(iconBox);
      itemEl.appendChild(info);
      itemEl.appendChild(badge);

      itemEl.addEventListener('mouseenter', () => {
        container.querySelectorAll('.spotlight-result-item').forEach(el => el.classList.remove('selected'));
        itemEl.classList.add('selected');
        this.activeSpotlightIndex = idx;
      });

      itemEl.addEventListener('click', () => {
        container.classList.add('hidden');
        this.handleShortcutClick(null, s);
      });

      container.appendChild(itemEl);
    });

    const searchIdx = matches.length;
    const webSearchEl = document.createElement('div');
    webSearchEl.className = `spotlight-result-item ${matches.length === 0 ? 'selected' : ''}`;
    webSearchEl.dataset.type = 'search';
    webSearchEl.dataset.query = trimmed;
    webSearchEl.dataset.index = searchIdx;

    const gIconBox = document.createElement('div');
    gIconBox.className = 'spotlight-result-icon-box';
    gIconBox.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-secondary);">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    `;

    const gInfo = document.createElement('div');
    gInfo.className = 'spotlight-result-info';

    const gTitle = document.createElement('div');
    gTitle.className = 'spotlight-result-title';
    gTitle.textContent = `Search Web for "${trimmed}"`;

    const gUrl = document.createElement('div');
    gUrl.className = 'spotlight-result-url';
    gUrl.textContent = 'Press Enter to search the web';

    gInfo.appendChild(gTitle);
    gInfo.appendChild(gUrl);

    const gBadge = document.createElement('span');
    gBadge.className = 'spotlight-result-badge';
    gBadge.textContent = '↵ Enter';

    webSearchEl.appendChild(gIconBox);
    webSearchEl.appendChild(gInfo);
    webSearchEl.appendChild(gBadge);

    webSearchEl.addEventListener('mouseenter', () => {
      container.querySelectorAll('.spotlight-result-item').forEach(el => el.classList.remove('selected'));
      webSearchEl.classList.add('selected');
      this.activeSpotlightIndex = searchIdx;
    });

    webSearchEl.addEventListener('click', () => {
      container.classList.add('hidden');
      this.executeWebSearch(trimmed);
    });

    container.appendChild(webSearchEl);
    container.classList.remove('hidden');
  }

  openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Shortcut';
    document.getElementById('shortcutId').value = '';
    delete this.shortcutModal.dataset.isPinned;
    delete this.shortcutModal.dataset.pinnedAt;

    this.urlErrorMsg.classList.add('hidden');
    this.shortcutForm.reset();
    
    this.notesInput.value = '';
    if (this.colorLabelSelect) this.colorLabelSelect.value = 'none';
    if (this.customColorPicker) this.customColorPicker.classList.add('hidden');
    this.workspaceSelect.value = (this.activeWorkspace !== 'all') ? this.activeWorkspace : 'main';

    this.enableLimitToggle.checked = false;
    this.limitOptionsContainer.classList.add('hidden');
    this.customLimitContainer.classList.add('hidden');

    this.shortcutModal.showModal();
  }

  openEditModal(shortcut) {
    document.getElementById('modalTitle').textContent = 'Edit Shortcut';
    document.getElementById('shortcutId').value = shortcut.id;
    document.getElementById('urlInput').value = shortcut.url;
    document.getElementById('titleInput').value = shortcut.title;
    
    const catInput = document.getElementById('categoryInput');
    if (catInput) catInput.value = shortcut.category || '';
    const tagsInput = document.getElementById('tagsInput');
    if (tagsInput) tagsInput.value = shortcut.tags ? shortcut.tags.join(', ') : '';
    
    this.urlErrorMsg.classList.add('hidden');

    this.notesInput.value = shortcut.notes || '';
    this.workspaceSelect.value = shortcut.workspace || 'main';

    if (this.colorLabelSelect) {
      if (shortcut.color && ['#4285F4', '#34A853', '#FBBC04', '#EA4335', 'none'].includes(shortcut.color)) {
        this.colorLabelSelect.value = shortcut.color;
        this.customColorPicker?.classList.add('hidden');
      } else if (shortcut.color && shortcut.color !== 'none') {
        this.colorLabelSelect.value = 'custom';
        if (this.customColorPicker) {
          this.customColorPicker.value = shortcut.color;
          this.customColorPicker.classList.remove('hidden');
        }
      } else {
        this.colorLabelSelect.value = 'none';
        this.customColorPicker?.classList.add('hidden');
      }
    }

    this.shortcutModal.dataset.isPinned = shortcut.isPinned ? 'true' : 'false';
    if (shortcut.pinnedAt) {
      this.shortcutModal.dataset.pinnedAt = shortcut.pinnedAt;
    } else {
      delete this.shortcutModal.dataset.pinnedAt;
    }

    this.enableLimitToggle.checked = !!shortcut.limitEnabled;
    this.limitOptionsContainer.classList.toggle('hidden', !shortcut.limitEnabled);

    if (shortcut.limitEnabled && shortcut.limitMinutes) {
      const mins = shortcut.limitMinutes;
      if ([15, 30, 60, 120].includes(mins)) {
        this.limitPresetSelect.value = String(mins);
        this.customLimitContainer.classList.add('hidden');
      } else {
        this.limitPresetSelect.value = 'custom';
        this.customLimitContainer.classList.remove('hidden');
        this.customLimitHours.value = mins / 60;
      }
    } else {
      this.limitPresetSelect.value = '15';
      this.customLimitContainer.classList.add('hidden');
    }

    this.shortcutModal.showModal();
  }

  async handleFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('shortcutId').value;
    const rawUrl = (document.getElementById('urlInput').value || '').trim();
    const title = (document.getElementById('titleInput').value || '').trim();
    const category = document.getElementById('categoryInput')?.value || '';
    const tagsRaw = document.getElementById('tagsInput')?.value || '';

    if (!rawUrl) {
      this.urlErrorMsg.textContent = 'Please enter a website URL (e.g. google.com or https://...)';
      this.urlErrorMsg.classList.remove('hidden');
      return;
    }

    const parsed = parseUrlDetails(rawUrl);
    if (!parsed.valid) {
      this.urlErrorMsg.textContent = 'Please enter a valid website URL (e.g. google.com or https://...)';
      this.urlErrorMsg.classList.remove('hidden');
      return;
    }

    if (!id) {
      const dup = await this.db.findDuplicateByUrl(parsed.url);
      if (dup) {
        this.shortcutModal.close();
        this.showDuplicateDetectedModal(dup);
        return;
      }
    }

    let limitEnabled = this.enableLimitToggle.checked;
    let limitMinutes = 0;

    if (limitEnabled) {
      const preset = this.limitPresetSelect.value;
      if (preset === 'custom') {
        const hrs = parseFloat(this.customLimitHours.value) || 0;
        limitMinutes = Math.round(hrs * 60);
      } else {
        limitMinutes = parseInt(preset, 10);
      }
    }

    let selectedColor = this.colorLabelSelect?.value || 'none';
    if (selectedColor === 'custom' && this.customColorPicker) {
      selectedColor = this.customColorPicker.value;
    }

    const isPinned = id ? (this.shortcutModal.dataset.isPinned === 'true') : false;
    const pinnedAt = id && this.shortcutModal.dataset.pinnedAt ? parseInt(this.shortcutModal.dataset.pinnedAt, 10) : undefined;

    const shortcut = {
      id: id || undefined,
      url: parsed.url,
      title: title || parsed.defaultTitle,
      category,
      tags: tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [],
      visitCount: 0,
      limitEnabled,
      limitMinutes,
      isPinned,
      pinnedAt,
      notes: this.notesInput.value ? this.notesInput.value.trim() : '',
      color: selectedColor,
      workspace: this.workspaceSelect.value || 'main'
    };

    try {
      const savedRecord = await this.db.saveShortcut(shortcut);
      this.shortcutModal.close();
      await this.refreshData();

      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ action: 'SHORTCUTS_UPDATED' }, () => {
          if (chrome.runtime.lastError) {}
        });
      }

      if (!id) {
        this.showSnackbar('✅ Website Added Successfully', 'Open', () => {
          window.open(savedRecord.url, '_blank');
        });
      }
    } catch (err) {
      this.showSnackbar('Failed to save shortcut. Storage limits may be reached.');
    }
  }

  async deleteShortcut(id) {
    const target = this.shortcuts.find(s => s.id === id);
    if (!target) return;

    if (!this.settings.confirmDelete || confirm(`Delete "${target.title}"?`)) {
      await this.db.deleteShortcut(id);
      await this.refreshData();

      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ action: 'SHORTCUTS_UPDATED' }, () => {
          if (chrome.runtime.lastError) {}
        });
      }

      this.showSnackbar(`Shortcut "${target.title}" deleted.`, 'UNDO', async () => {
        await this.db.saveShortcut(target);
        await this.refreshData();
        if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
          chrome.runtime.sendMessage({ action: 'SHORTCUTS_UPDATED' }, () => {
            if (chrome.runtime.lastError) {}
          });
        }
      });
    }
  }

  async archiveShortcutWithUndo(id) {
    const target = this.shortcuts.find(s => s.id === id);
    if (!target) return;

    await this.db.toggleArchive(id);
    await this.refreshData();

    this.showSnackbar(`"${target.title}" moved to archive.`, 'UNDO', async () => {
      await this.db.toggleArchive(id);
      await this.refreshData();
    });
  }

  async exportBackup() {
    try {
      const data = await this.db.getAllShortcuts();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tabvora-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showSnackbar('Backup exported successfully.');
    } catch (err) {
      this.showSnackbar('Export failed. Please check storage permissions.');
    }
  }

  async importBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawData = JSON.parse(event.target.result);
        if (!Array.isArray(rawData)) {
          this.showSnackbar('Import failed: Backup file must contain a JSON array.');
          return;
        }

        const validAllowedWorkspaces = ['main', 'work', 'study', 'personal'];
        const sanitizedShortcuts = [];
        let skippedCount = 0;

        for (const item of rawData) {
          if (!item || typeof item !== 'object') {
            skippedCount++;
            continue;
          }

          const title = (typeof item.title === 'string') ? item.title.trim() : '';
          if (!title) {
            skippedCount++;
            continue;
          }

          if (typeof item.url !== 'string' || !item.url.trim()) {
            skippedCount++;
            continue;
          }

          let parsedUrl;
          try {
            parsedUrl = new URL(item.url.trim());
          } catch (err) {
            skippedCount++;
            continue;
          }

          if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            skippedCount++;
            continue;
          }

          const workspace = (typeof item.workspace === 'string' && validAllowedWorkspaces.includes(item.workspace.trim()))
            ? item.workspace.trim()
            : 'main';

          const cleanRecord = {
            id: (item.id && typeof item.id === 'string') ? item.id : undefined,
            url: parsedUrl.href,
            title: title,
            category: (typeof item.category === 'string') ? item.category : '',
            tags: Array.isArray(item.tags) ? item.tags.filter(t => typeof t === 'string') : [],
            visitCount: (typeof item.visitCount === 'number' && !isNaN(item.visitCount)) ? item.visitCount : 0,
            limitEnabled: !!item.limitEnabled,
            limitMinutes: (typeof item.limitMinutes === 'number' && !isNaN(item.limitMinutes)) ? item.limitMinutes : 0,
            isPinned: !!item.isPinned,
            pinnedAt: (typeof item.pinnedAt === 'number') ? item.pinnedAt : undefined,
            notes: (typeof item.notes === 'string') ? item.notes : '',
            color: (typeof item.color === 'string') ? item.color : 'none',
            workspace: workspace,
            isArchived: !!item.isArchived,
            createdAt: (typeof item.createdAt === 'number') ? item.createdAt : Date.now()
          };

          sanitizedShortcuts.push(cleanRecord);
        }

        if (sanitizedShortcuts.length === 0) {
          this.showSnackbar('Import failed: No valid shortcuts found in file.');
          return;
        }

        await this.db.bulkImport(sanitizedShortcuts);
        await this.refreshData();

        if (skippedCount > 0) {
          this.showSnackbar(`Imported ${sanitizedShortcuts.length} valid shortcut(s). ${skippedCount} invalid item(s) skipped.`);
        } else {
          this.showSnackbar('Import completed successfully!');
        }

      } catch (err) {
        this.showSnackbar('Import failed: Invalid JSON structure or unreadable file.');
      } finally {
        e.target.value = '';
      }
    };

    reader.onerror = () => {
      this.showSnackbar('Import failed: Unable to read file.');
      e.target.value = '';
    };

    reader.readAsText(file);
  }
}

function startApp() {
  try {
    if (!localStorage.getItem('tabvora_onboarding_done')) {
      if (document.body) {
        document.body.classList.add('onboarding-mode');
      }
    }
  } catch (_) {}
  const app = new App();
  window.tabvoraApp = app;
  app.init().catch(err => console.error("Tabvora App init fatal error:", err));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}