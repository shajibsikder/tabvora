/**
 * Tabvora v2.1.0 - Content Script
 * Draft Recovery, Single Website Limit Reminders, Global Browser Limit Popups,
 * & Digital Wellbeing Session Reminders.
 */

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const SUPPORTED_SELECTOR = 'textarea, input, [contenteditable="true"], [role="textbox"], .ql-editor, .note-editable, body#tinymce, body.mce-content-body';

function isSensitiveField(el) {
  if (!el) return true;

  // 1. Direct input type inspection
  const type = (el.type || '').toLowerCase();
  if (
    type === 'password' || 
    type === 'hidden' || 
    type === 'tel' || 
    type === 'file' || 
    type === 'button' || 
    type === 'submit' || 
    type === 'reset'
  ) {
    return true;
  }

  // 2. Computed / inline visibility check
  if (el.style && (el.style.display === 'none' || el.style.visibility === 'hidden' || el.hidden)) {
    return true;
  }

  // Helper: lowercased and stripped of non-alphanumerics
  const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // 3. Autocomplete attribute screening (W3C standard sensitive tokens)
  const rawAc = (el.getAttribute('autocomplete') || '').toLowerCase().trim();
  const normAc = normalize(rawAc);
  const sensitiveAutocompletes = [
    'ccnumber', 'ccexp', 'ccexpmonth', 'ccexpyear', 'cccsc', 'cctype', 'ccname',
    'onetimecode', 'currentpassword', 'newpassword', 'tel', 'telcountrycode',
    'telnational', 'telareacode', 'tellocal', 'bday', 'bdayday', 'bdaymonth',
    'bdayyear', 'transactionamount', 'transactioncurrency', 'sex'
  ];
  for (const ac of sensitiveAutocompletes) {
    if (normAc.includes(ac)) return true;
  }
  if (normAc.startsWith('cc') || normAc.startsWith('tel') || rawAc.startsWith('cc-') || rawAc.startsWith('tel')) return true;

  // 4. Attribute metadata inspection (name, id, placeholder, aria-label, title)
  // High-confidence class markers (only explicit sensitive patterns, avoiding generic class collisions)
  if (typeof el.className === 'string' && el.className) {
    const classNorm = normalize(el.className);
    if (
      classNorm.includes('password') ||
      classNorm.includes('cardnumber') ||
      classNorm.includes('creditcard') ||
      classNorm.includes('cvv') ||
      classNorm.includes('cvc') ||
      classNorm.includes('securitycode')
    ) {
      return true;
    }
  }

  // Placeholder check for MM/YY expiration dates
  const placeholderText = el.getAttribute('placeholder') || '';
  if (placeholderText && (/mm\s*[\/\-]\s*yy/i.test(placeholderText) || normalize(placeholderText).includes('mmyy'))) {
    return true;
  }

  const rawAttrs = [
    el.getAttribute('name'),
    el.id,
    placeholderText,
    el.getAttribute('aria-label'),
    el.getAttribute('title')
  ];

  const normAttrs = rawAttrs.map(normalize).filter(Boolean);

  const passAllowlist = ['passenger', 'passage', 'passion', 'compass', 'bypass', 'trespass', 'surpass'];

  const sensitiveKeywords = [
    'password', 'passcode', 'passphrase', 'currentpassword', 'newpassword',
    'passwd', 'userpass', 'loginpass', 'passport', 'biccode', 'pswd', 'pword',
    'otp', 'authenticat', 'verification', 'twofactor', '2fa', 'mfa',
    'cvc', 'cvv', 'csc', 'securitycode', 'cardverification',
    'iban', 'routing', 'sortcode', 'swift', 'swiftbic', 'accountnumber', 'bankaccount',
    'cardnumber', 'creditcard', 'debitcard', 'ccnumber', 'ccnum', 'cardholder', 'cardno',
    'ssn', 'taxid', 'nationalid', 'socialsecurity', 'identitynumber',
    'expiry', 'expiration', 'expdate', 'expmonth', 'expyear',
    'privatekey', 'apikey', 'secretkey',
    'phone', 'telephone', 'cellphone'
  ];

  const bareTokens = [
    'card', 'cc', 'pan', 'bic', 'swift', 'pin', 'otp', 'cvc', 'cvv', 'csc', 'cid', 'ssn', 'sortcode', 'nationalid',
    'pass', 'passwd', 'pw', 'pword', 'pswd', 'cell', 'dob', 'pwd', 'exp'
  ];

  for (const norm of normAttrs) {
    for (const kw of sensitiveKeywords) {
      if (norm.includes(kw)) return true;
    }
    for (const bt of bareTokens) {
      if (
        norm === bt ||
        norm.startsWith(bt + 'num') || norm.endsWith('num' + bt) ||
        norm.startsWith(bt + 'no') || norm.endsWith('no' + bt) ||
        norm.startsWith(bt + 'code') || norm.endsWith('code' + bt) ||
        norm.startsWith('user' + bt) || norm.startsWith('my' + bt) ||
        norm.startsWith('confirm' + bt) || norm.startsWith('new' + bt) ||
        norm.startsWith('old' + bt) || norm.startsWith('current' + bt)
      ) {
        return true;
      }
    }

    // Pass substring matching with safe word allowlist
    if (norm.includes('pass')) {
      const isAllowed = passAllowlist.some(allowed => norm.includes(allowed));
      if (!isAllowed) return true;
    }

    // Secret handling: exclude secretary
    if (norm.includes('secret') && !norm.includes('secretary')) return true;

    // Token handling: exclude tokenizer
    if (norm.includes('token') && !norm.includes('tokenizer')) return true;

    // PIN handling: match pin, pincode, securitypin, atm_pin, pin_number, etc. Ignore 'pinterest', 'shipping', 'spinning'
    if (
      norm === 'pin' || norm.includes('pincode') || norm.includes('securitypin') || norm.includes('atmpin') ||
      norm.endsWith('pin') || (norm.startsWith('pin') && (norm.length <= 4 || norm.startsWith('pinnum') || norm.startsWith('pincode') || norm.startsWith('pinno') || norm.startsWith('pinval')))
    ) {
      if (!norm.includes('shipping') && !norm.includes('spinning') && !norm.includes('pinpoint') && !norm.includes('pinterest')) {
        return true;
      }
    }
    // Auth handling: match auth token, but ignore 'author'
    if (norm === 'auth' || (norm.includes('auth') && !norm.includes('author'))) return true;
    // Mobile handling: match mobile as standalone or mobilephone
    if (norm === 'mobile' || norm.includes('mobilephone') || norm.includes('mobileno') || norm.includes('mobilenumber')) return true;

    if (norm === 'code' || (norm.includes('code') && (
      norm.includes('verify') || norm.includes('auth') || norm.includes('security') ||
      norm.includes('sms') || norm.includes('login') || norm.includes('pass') ||
      norm.includes('confirm') || norm.includes('twofactor') || norm.includes('2fa') || norm.includes('mfa')
    ))) {
      return true;
    }
  }

  // 5. Short numeric code heuristics (e.g. 6-digit SMS / 2FA code without explicit autocomplete)
  const isNumericMode = el.inputMode === 'numeric' || type === 'number' || el.getAttribute('pattern') === '[0-9]*';
  const hasShortLength = el.maxLength > 0 && el.maxLength <= 8;
  if (isNumericMode && hasShortLength) {
    for (const norm of normAttrs) {
      if (norm.includes('code') || norm.includes('digit') || norm.includes('pin') || norm.includes('val')) return true;
    }
  }

  // 6. Parent form & container contextual screening
  const parentForm = el.closest ? el.closest('form, [class*="login"], [class*="auth"], [class*="payment"], [class*="checkout"], [class*="billing"], [id*="login"], [id*="auth"]') : null;
  if (parentForm) {
    const formAction = normalize(parentForm.action);
    const formId = normalize(parentForm.id);
    const formClass = normalize(typeof parentForm.className === 'string' ? parentForm.className : '');

    if (
      formAction.includes('login') || formAction.includes('auth') || formAction.includes('signin') ||
      formAction.includes('checkout') || formAction.includes('payment') || formAction.includes('billing') ||
      formId.includes('login') || formId.includes('auth') || formId.includes('signin') ||
      formClass.includes('login') || formClass.includes('auth') || formClass.includes('payment') ||
      formClass.includes('checkout') || formClass.includes('billing')
    ) {
      const hasPasswordOrCard = parentForm.querySelector('input[type="password"], [autocomplete*="cc-"], [autocomplete*="password"], [name*="pass"], [name*="card"]');
      if (hasPasswordOrCard) {
        return true;
      }
    }
  }

  return false;
}

function getAllElementsDeep(root = document, selector = SUPPORTED_SELECTOR) {
  let elements = Array.from(root.querySelectorAll(selector));
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
  
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.shadowRoot) {
      elements = elements.concat(getAllElementsDeep(node.shadowRoot, selector));
    }
  }
  return elements;
}

/* ==========================================================================
   1. DRAFT RECOVERY ENGINE
   ========================================================================== */

class ContentDraftManager {
  constructor() {
    this.settings = null;
    this.debounceTimer = null;
    this.currentDraft = null;
    this.isMainFrame = (window.top === window.self);
    // Strict CWS security: Skip cross-origin frames and iframes completely for draft capture
    if (!this.isMainFrame) return;
    this.init();
  }

  async init() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      try {
        chrome.runtime.sendMessage({ action: 'GET_DRAFT_SETTINGS' }, (response) => {
          if (chrome.runtime.lastError || !response || !response.enableDrafts) return;
          this.settings = response;

          if (this.isMainFrame) {
            this.checkAndPromptRestore();
          }
          this.attachTypingListeners();
        });
      } catch (e) {}
    }
  }

  attachTypingListeners() {
    if (!this.isMainFrame) return;
    const handler = (e) => {
      const target = e.target;
      if (target && (target.matches(SUPPORTED_SELECTOR) || target.isContentEditable || (target.closest && target.closest('.ql-editor, [contenteditable="true"]'))) && !isSensitiveField(target)) {
        this.scheduleSave();
      }
    };

    document.addEventListener('input', handler, true);
    document.addEventListener('change', handler, true);
    document.addEventListener('keyup', handler, true);
    document.addEventListener('submit', () => {
      this.safelyDeleteDraft();
      const toast = document.getElementById('tabvora-draft-toast') || document.getElementById('smart-speed-dial-draft-modal');
      if (toast) toast.remove();
    }, true);
  }

  scheduleSave() {
    if (!this.settings || !this.settings.enableDrafts || !this.isMainFrame) return;
    clearTimeout(this.debounceTimer);

    const intervalMs = (this.settings.draftInterval || 3) * 1000;
    this.debounceTimer = setTimeout(() => {
      this.captureAndSaveDraft();
    }, intervalMs);
  }

  getTopPageUrl() {
    try {
      const loc = window.location;
      // Strip query parameters and URL fragments to prevent accidental storage of URL tokens or secrets
      return `${loc.origin}${loc.pathname}`;
    } catch (e) {
      return '';
    }
  }

  captureAndSaveDraft() {
    if (!this.isMainFrame) return;
    const fields = [];

    const elements = getAllElementsDeep(document, SUPPORTED_SELECTOR);
    elements.forEach((el, index) => {
      if (!isSensitiveField(el)) {
        let val = '';
        if (el.isContentEditable || el.id === 'tinymce' || el.classList.contains('mce-content-body') || el.classList.contains('ql-editor') || el.classList.contains('note-editable')) {
          val = el.innerHTML;
        } else {
          val = el.value || '';
        }

        if (val && val.trim().length > 0) {
          fields.push({
            frameUrl: this.getTopPageUrl(),
            index,
            id: el.id || null,
            className: el.className || null,
            name: el.getAttribute('name') || null,
            isEditable: !!el.isContentEditable || el.id === 'tinymce' || el.classList.contains('ql-editor') || el.classList.contains('note-editable'),
            value: val
          });
        }
      }
    });

    if (this.isMainFrame && window.tinymce && window.tinymce.editors) {
      window.tinymce.editors.forEach((editor, idx) => {
        try {
          const content = editor.getContent();
          if (content && content.trim().length > 0) {
            fields.push({
              isTinyMceApi: true,
              editorId: editor.id || `tinymce_${idx}`,
              value: content
            });
          }
        } catch (e) {}
      });
    }

    if (fields.length > 0 && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      try {
        chrome.runtime.sendMessage({
          action: 'SAVE_DRAFT',
          pageUrl: this.getTopPageUrl(),
          origin: window.location.origin,
          fields
        }, () => {
          if (chrome.runtime.lastError) {}
        });
      } catch (err) {}
    }
  }

  checkAndPromptRestore() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      try {
        const topUrl = this.getTopPageUrl();
        const pageKey = encodeURIComponent(topUrl);
        try {
          if (sessionStorage.getItem('tabvora_draft_dismissed_' + pageKey)) {
            return;
          }
        } catch (_) {}

        chrome.runtime.sendMessage({
          action: 'CHECK_DRAFT',
          pageUrl: topUrl
        }, (draft) => {
          if (chrome.runtime.lastError || !draft || !draft.fields || draft.fields.length === 0) return;
          this.currentDraft = draft;
          this.showRestoreDialog(draft);
        });
      } catch (e) {}
    }
  }

  showRestoreDialog(draft) {
    if (document.getElementById('tabvora-draft-toast') || document.getElementById('smart-speed-dial-draft-modal')) return;

    const toast = document.createElement('div');
    toast.id = 'tabvora-draft-toast';
    
    toast.innerHTML = `
      <style>
        @keyframes tabvoraDraftSlideUp {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        #tabvora-draft-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 2147483647;
          background: #18181b;
          color: #f4f4f5;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 14px;
          padding: 10px 14px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 13px;
          animation: tabvoraDraftSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
        }
        #tabvora-draft-toast .ssd-title {
          font-weight: 600;
          color: #f4f4f5;
          font-size: 12px;
          line-height: 1.2;
        }
        #tabvora-draft-toast .ssd-sub {
          font-size: 11px;
          color: #a1a1aa;
        }
        #tabvora-draft-toast .ssd-btn-restore {
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 5px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        #tabvora-draft-toast .ssd-btn-restore:hover {
          background: #1d4ed8;
        }
        #tabvora-draft-toast .ssd-btn-close {
          background: transparent;
          color: #71717a;
          border: none;
          padding: 4px 6px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          line-height: 1;
        }
        #tabvora-draft-toast .ssd-btn-close:hover {
          color: #f4f4f5;
          background: rgba(255,255,255,0.08);
        }
      </style>
      <span style="font-size: 18px; line-height: 1;">📝</span>
      <div>
        <div class="ssd-title">Unsaved Draft Available</div>
        <div class="ssd-sub">Restore form text from previous session?</div>
      </div>
      <div style="display: flex; align-items: center; gap: 6px; margin-left: 4px;">
        <button id="ssd-restore-btn" class="ssd-btn-restore">Restore</button>
        <button id="ssd-dismiss-btn" class="ssd-btn-close" title="Dismiss" aria-label="Dismiss">✕</button>
      </div>
    `;

    document.body.appendChild(toast);

    const pageKey = encodeURIComponent(this.getTopPageUrl());

    document.getElementById('ssd-restore-btn')?.addEventListener('click', () => {
      try {
        this.applyDraft(draft);
      } catch (err) {
      } finally {
        toast.remove();
        this.safelyDeleteDraft();
      }
    });

    document.getElementById('ssd-dismiss-btn')?.addEventListener('click', () => {
      try {
        sessionStorage.setItem('tabvora_draft_dismissed_' + pageKey, '1');
      } catch (_) {}
      toast.remove();
    });
  }

  safelyDeleteDraft() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      try {
        chrome.runtime.sendMessage({ action: 'DELETE_DRAFT', pageUrl: this.getTopPageUrl() }, () => {
          if (chrome.runtime.lastError) {}
        });
      } catch (e) {}
    }
  }

  applyDraft(draft) {
    if (!draft || !Array.isArray(draft.fields)) return;
    const elements = getAllElementsDeep(document, SUPPORTED_SELECTOR);

    draft.fields.forEach(f => {
      try {
        let target = null;

        if (f.isTinyMceApi && window.tinymce) {
          try {
            const editor = window.tinymce.get(f.editorId) || window.tinymce.activeEditor;
            if (editor) {
              editor.setContent(f.value);
              return;
            }
          } catch (e) {}
        }

        // 1. Try by element ID
        if (f.id) {
          try {
            target = document.getElementById(f.id);
          } catch (_) {}
        }

        // 2. Try by name attribute with CSS.escape
        if (!target && f.name) {
          try {
            const safeName = (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(f.name) : f.name.replace(/["\\]/g, '\\$&');
            target = document.querySelector(`[name="${safeName}"]`);
          } catch (_) {}
        }

        // 3. Try by class name with CSS.escape
        if (!target && f.className && typeof f.className === 'string') {
          try {
            const classes = f.className.trim().split(/\s+/).filter(Boolean);
            if (classes.length > 0) {
              const safeSelector = classes.map(c => (typeof CSS !== 'undefined' && CSS.escape) ? '.' + CSS.escape(c) : '.' + c).join('');
              target = document.querySelector(safeSelector);
            }
          } catch (_) {}
        }

        // 4. Fallback to DOM tree index
        if (!target && elements[f.index]) {
          target = elements[f.index];
        }

        if (target && !isSensitiveField(target)) {
          if (f.isEditable || target.isContentEditable || target.id === 'tinymce' || target.classList?.contains('ql-editor')) {
            target.innerHTML = f.value;
          } else {
            target.value = f.value;
          }

          try {
            target.dispatchEvent(new Event('input', { bubbles: true }));
            target.dispatchEvent(new Event('change', { bubbles: true }));
            target.dispatchEvent(new Event('blur', { bubbles: true }));
          } catch (e) {}
        }
      } catch (err) {
        console.warn('Field restoration skipped due to error:', err);
      }
    });
  }
}

new ContentDraftManager();

/* ==========================================================================
   2. REAL-TIME SINGLE WEBSITE LIMIT POPUP CONTROLLER (Native Modern Glass)
   ========================================================================== */

let isLimitReminderShownInSession = false;

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'SHOW_REALTIME_LIMIT_REMINDER') {
    if (window.top !== window.self) return;
    if (isLimitReminderShownInSession) return;

    isLimitReminderShownInSession = true;
    showRealTimeLimitDialog(message);
  }
});

function playLimitAlertChime() {
  try {
    chrome.storage?.local?.get('activeSoundId', ({ activeSoundId }) => {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const id = activeSoundId || 'crystal';

      if (id === 'zen') {
        // Zen Tibetan Singing Bowl 432Hz
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
      } else if (id === 'celestial') {
        // Celestial Harp arpeggio
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
      } else if (id === 'lofi') {
        // Lofi Bell 528Hz
        const tones = [
          { freq: 528.0, time: 0, dur: 0.95, gain: 0.88 },
          { freq: 1056.0, time: 0.45, dur: 0.45, gain: 0.35 }
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
      } else if (id === 'temple') {
        // Temple Gong 216Hz
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
      } else if (id === 'marimba') {
        // Calm Bamboo Marimba
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
      } else if (id === 'shimmer') {
        // Cosmic Shimmer
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
      } else if (id === 'kalimba') {
        // Peaceful Kalimba
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
      } else {
        // Default Crystal Bell (Crisp, High-Gain)
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
      setTimeout(() => {
        try { if (ctx && ctx.state !== 'closed') ctx.close(); } catch (_) {}
      }, 2200);
    });
  } catch (_) {}
}

let limitChimeTimeouts = [];

function stopLimitAlertChimeSequence() {
  if (Array.isArray(limitChimeTimeouts)) {
    limitChimeTimeouts.forEach(t => clearTimeout(t));
    limitChimeTimeouts = [];
  }
}

function playLimitAlertChimeSequence(pulses = 5, intervalMs = 1900) {
  stopLimitAlertChimeSequence();
  playLimitAlertChime();
  limitChimeTimeouts = [];
  for (let i = 1; i < pulses; i++) {
    const tid = setTimeout(() => {
      playLimitAlertChime();
    }, i * intervalMs);
    limitChimeTimeouts.push(tid);
  }
}

function showRealTimeLimitDialog(data) {
  if (document.getElementById('ssd-realtime-limit-modal')) return;

  // Play pleasant dual-tone alert chime 5 times
  playLimitAlertChimeSequence(5, 1900);

  const modalHost = document.createElement('div');
  modalHost.id = 'ssd-realtime-limit-modal';

  modalHost.innerHTML = `
    <div style="position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); z-index: 2147483647; display: flex; align-items: center; justify-content: center; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="background: #18181b; color: #f4f4f5; border: 1px solid #27272a; border-radius: 24px; padding: 28px; width: 380px; max-width: 90vw; box-shadow: 0 20px 50px rgba(0,0,0,0.7); text-align: center; box-sizing: border-box;">
        <div style="background: rgba(239, 68, 68, 0.12); width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; border: 1px solid rgba(239, 68, 68, 0.2);">
          <svg viewBox="0 0 24 24" width="26" height="26"><path fill="#ef4444" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
        </div>
        <h2 style="margin: 0 0 6px 0; font-size: 19px; font-weight: 600; color: #f4f4f5; letter-spacing: -0.02em;">Website Limit Reached</h2>
        <p style="font-size: 13px; color: #a1a1aa; margin-bottom: 20px; line-height: 1.4;">
          You have reached today's usage limit for this website.
        </p>
        <div style="background: #09090b; border: 1px solid #27272a; border-radius: 14px; padding: 14px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; font-size: 12.5px; text-align: left;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #71717a;">Website:</span>
            <strong style="color: #f4f4f5; font-weight: 600;">${escapeHtml(data.siteName)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #71717a;">Today's Usage:</span>
            <strong style="color: #60a5fa;">${escapeHtml(data.usedMinutes)} Mins</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #71717a;">Configured Limit:</span>
            <strong style="color: #60a5fa;">${escapeHtml(data.limitMinutes)} Mins</strong>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button id="ssd-limit-continue-btn" style="background: #3b82f6; color: #ffffff; border: none; padding: 11px; border-radius: 14px; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s ease;">Continue Browsing</button>
          <button id="ssd-limit-change-btn" style="background: #27272a; color: #e4e4e7; border: 1px solid #3f3f46; padding: 9px; border-radius: 14px; font-weight: 500; font-size: 12.5px; cursor: pointer; transition: all 0.2s ease;">Change Limit</button>
          <button id="ssd-limit-dismiss-btn" style="background: transparent; color: #71717a; border: none; padding: 6px; font-size: 12px; cursor: pointer;">Dismiss For Session</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalHost);

  document.getElementById('ssd-limit-continue-btn').addEventListener('click', () => {
    stopLimitAlertChimeSequence();
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      try {
        chrome.runtime.sendMessage({
          action: 'DISMISS_LIMIT_TODAY',
          originUrl: data.originUrl
        });
      } catch (e) {}
    }
    modalHost.remove();
  });

  document.getElementById('ssd-limit-change-btn').addEventListener('click', () => {
    stopLimitAlertChimeSequence();
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      try {
        chrome.runtime.sendMessage({
          action: 'OPEN_EDIT_SHORTCUT',
          shortcutId: data.shortcutId
        });
      } catch (e) {}
    }
    modalHost.remove();
  });

  document.getElementById('ssd-limit-dismiss-btn').addEventListener('click', () => {
    stopLimitAlertChimeSequence();
    modalHost.remove();
  });
}

/* ==========================================================================
   3. GLOBAL BROWSER LIMIT POPUP CONTROLLER (Native Modern Glass)
   ========================================================================== */

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'SHOW_GLOBAL_LIMIT_REMINDER') {
    if (window.top !== window.self) return;
    showGlobalBrowserLimitDialog(message);
  }
});

function showGlobalBrowserLimitDialog(data) {
  if (document.getElementById('tabvora-global-limit-modal')) return;

  // Play pleasant dual-tone alert chime 5 times
  playLimitAlertChimeSequence(5, 1900);

  const modalHost = document.createElement('div');
  modalHost.id = 'tabvora-global-limit-modal';

  modalHost.innerHTML = `
    <div style="position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); z-index: 2147483647; display: flex; align-items: center; justify-content: center; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="background: #18181b; color: #f4f4f5; border: 1px solid #27272a; border-radius: 24px; padding: 28px; width: 380px; max-width: 90vw; box-shadow: 0 20px 50px rgba(0,0,0,0.7); text-align: center; box-sizing: border-box;">
        <div style="background: rgba(59, 130, 246, 0.12); width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; border: 1px solid rgba(59, 130, 246, 0.2);">
          <span style="font-size: 24px;">🌐</span>
        </div>
        <h2 style="margin: 0 0 6px 0; font-size: 19px; font-weight: 600; color: #f4f4f5; letter-spacing: -0.02em;">Daily Browser Limit Reached</h2>
        <p style="font-size: 13px; color: #a1a1aa; margin-bottom: 20px; line-height: 1.4;">
          You have reached your total daily Chrome browsing time limit.
        </p>
        <div style="background: #09090b; border: 1px solid #27272a; border-radius: 14px; padding: 14px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; font-size: 12.5px; text-align: left;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #71717a;">Total Time Browsed:</span>
            <strong style="color: #60a5fa;">${escapeHtml(data.usedMinutes)} Mins</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #71717a;">Global Limit Set:</span>
            <strong style="color: #60a5fa;">${escapeHtml(data.limitMinutes)} Mins</strong>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button id="tabvora-global-continue-btn" style="background: #3b82f6; color: #ffffff; border: none; padding: 11px; border-radius: 14px; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s ease;">Continue Browsing</button>
          <button id="tabvora-global-change-btn" style="background: #27272a; color: #e4e4e7; border: 1px solid #3f3f46; padding: 9px; border-radius: 14px; font-weight: 500; font-size: 12.5px; cursor: pointer; transition: all 0.2s ease;">Change Limit</button>
          <button id="tabvora-global-later-btn" style="background: transparent; color: #71717a; border: none; padding: 6px; font-size: 12px; cursor: pointer;">Later</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalHost);

  document.getElementById('tabvora-global-continue-btn').addEventListener('click', () => {
    stopLimitAlertChimeSequence();
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      try {
        chrome.runtime.sendMessage({ action: 'DISMISS_GLOBAL_LIMIT_CONTINUE' });
      } catch (e) {}
    }
    modalHost.remove();
  });

  document.getElementById('tabvora-global-change-btn').addEventListener('click', () => {
    stopLimitAlertChimeSequence();
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      try {
        chrome.runtime.sendMessage({ action: 'OPEN_SETTINGS_GLOBAL_LIMIT' });
      } catch (e) {}
    }
    modalHost.remove();
  });

  document.getElementById('tabvora-global-later-btn').addEventListener('click', () => {
    stopLimitAlertChimeSequence();
    modalHost.remove();
  });
}

/* ==========================================================================
   4. DIGITAL WELLBEING POPUP CONTROLLER (Native Glass & Smooth UI)
   ========================================================================== */

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'SHOW_WELLBEING_REMINDER' && message.payload) {
    if (window.top !== window.self) return;
    showWellbeingDialog(message.payload);
  }
});

function playWellbeingChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    // 3-tone gentle harmonic chime (C5 - E5 - G5)
    const tones = [
      { freq: 523.25, time: 0, dur: 0.45 },
      { freq: 659.25, time: 0.22, dur: 0.45 },
      { freq: 783.99, time: 0.44, dur: 0.65 }
    ];
    tones.forEach(t => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(t.freq, now + t.time);
      gain.gain.setValueAtTime(0.78, now + t.time);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t.time + t.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + t.time);
      osc.stop(now + t.time + t.dur);
    });
    setTimeout(() => {
      try { if (ctx && ctx.state !== 'closed') ctx.close(); } catch (_) {}
    }, 1800);
  } catch (_) {}
}

function showWellbeingDialog(data) {
  if (document.getElementById('tabvora-wellbeing-toast') || document.getElementById('tabvora-wellbeing-modal')) return;

  // Play pleasant 3-tone chime
  playWellbeingChime();

  const toast = document.createElement('div');
  toast.id = 'tabvora-wellbeing-toast';

  const formattedMsg = escapeHtml(data.message).replace(/\n/g, '<br>');

  toast.innerHTML = `
    <style>
      @keyframes tabvoraSlideDown {
        from { opacity: 0; transform: translateY(-16px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      #tabvora-wellbeing-toast {
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 2147483646;
        background: #18181b;
        color: #f4f4f5;
        border: 1px solid rgba(16, 185, 129, 0.35);
        border-radius: 16px;
        padding: 16px 18px;
        width: 360px;
        max-width: 90vw;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: tabvoraSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        box-sizing: border-box;
        user-select: none;
      }
      #tabvora-wellbeing-toast .wb-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
      }
      #tabvora-wellbeing-toast .wb-title-box {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      #tabvora-wellbeing-toast .wb-icon {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(16, 185, 129, 0.15);
        border: 1px solid rgba(16, 185, 129, 0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        flex-shrink: 0;
      }
      #tabvora-wellbeing-toast .wb-title {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #f4f4f5;
        line-height: 1.3;
      }
      #tabvora-wellbeing-toast .wb-close {
        background: transparent;
        border: none;
        color: #71717a;
        font-size: 16px;
        cursor: pointer;
        padding: 2px 6px;
        line-height: 1;
        border-radius: 4px;
      }
      #tabvora-wellbeing-toast .wb-close:hover {
        color: #f4f4f5;
        background: rgba(255,255,255,0.08);
      }
      #tabvora-wellbeing-toast .wb-body {
        margin: 0 0 14px 0;
        font-size: 12px;
        color: #a1a1aa;
        line-height: 1.5;
        padding-left: 42px;
      }
      #tabvora-wellbeing-toast .wb-footer {
        display: flex;
        justify-content: flex-end;
        padding-left: 42px;
      }
      #tabvora-wellbeing-toast .wb-btn {
        background: #10b981;
        color: #ffffff;
        border: none;
        padding: 6px 16px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 12px;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      #tabvora-wellbeing-toast .wb-btn:hover {
        background: #059669;
      }
    </style>
    <div class="wb-header">
      <div class="wb-title-box">
        <div class="wb-icon">🌿</div>
        <h4 class="wb-title">${escapeHtml(data.title)}</h4>
      </div>
      <button id="tabvora-wellbeing-close-btn" class="wb-close" title="Close">✕</button>
    </div>
    <div class="wb-body">
      ${formattedMsg}
    </div>
    <div class="wb-footer">
      <button id="tabvora-wellbeing-ok-btn" class="wb-btn">Got It</button>
    </div>
  `;

  document.body.appendChild(toast);

  const dismiss = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  };

  document.getElementById('tabvora-wellbeing-ok-btn')?.addEventListener('click', dismiss);
  document.getElementById('tabvora-wellbeing-close-btn')?.addEventListener('click', dismiss);

  // Auto-dismiss after 20 seconds so user never feels trapped
  setTimeout(() => {
    if (document.getElementById('tabvora-wellbeing-toast')) {
      dismiss();
    }
  }, 20000);
}