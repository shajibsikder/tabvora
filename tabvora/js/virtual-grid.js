import { getFaviconUrl, escapeHtml } from './utils.js';

const FALLBACK_WEB_ICON = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%2364748b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';

export function getCleanShortcutTitle(rawTitle, domain) {
  let title = (rawTitle || '').trim();
  if (!title) {
    if (domain) {
      const domainPart = domain.replace(/^www\./i, '').split('.')[0];
      return domainPart ? domainPart.charAt(0).toUpperCase() + domainPart.slice(1) : domain;
    }
    return 'Shortcut';
  }

  // 1. Delimiter-based splitting:
  // Delimiters: " - ", " – ", " — ", " · ", " • ", " | ", " : ", " / "
  // e.g. "GitHub - Where the world builds software" -> "GitHub"
  // "Momentum - Chrome Web Store" -> "Momentum"
  // "Bonjourr · Minimalist New Tab" -> "Bonjourr"
  // "New Tab — Infinity New Tab" -> "New Tab"
  // "Google - Search" -> "Google"
  // "Google | Search" -> "Google"
  const sepMatch = title.match(/^(.+?)\s*(?:[-–—·•|:/]+|\s+[-–—·•|:/]+\s*)\s*(.+)$/);
  if (sepMatch && sepMatch[1] && sepMatch[1].trim().length > 0) {
    title = sepMatch[1].trim();
  }

  // 2. Strip common generic suffixes (e.g. "Video site", "Web site", "Official site", "Search", "Home page", etc.)
  // Handles: "Example Video site" -> "Example"
  const suffixPattern = /\s+(?:video\s+(?:site|creator|editor)|official\s+site|web\s*site|website|home\s*page|web\s*store|chrome\s+web\s+store|search(?:\s+engine)?)$/i;
  title = title.replace(suffixPattern, '').trim();

  return title || rawTitle || 'Shortcut';
}

export class VirtualGrid {
  constructor(viewportEl, canvasEl, options = {}) {
    this.viewport = viewportEl;
    this.canvas = canvasEl;
    
    this.data = [];
    this.draggedIndex = null;

    this.onEditCallback = options.onEdit || null;
    this.onDeleteCallback = options.onDelete || null;
    this.onPinCallback = options.onPin || null;
    this.onArchiveCallback = options.onArchive || null;
    this.onContextMenuCallback = options.onContextMenu || null;
    this.onReorderCallback = options.onReorder || null;
    this.onShortcutClickCallback = options.onShortcutClick || null;
    this.onAddCallback = options.onAdd || null;

    this.init();
  }

  init() {
    window.addEventListener('resize', () => this.recalculateLayout());
  }

  setData(data) {
    this.data = Array.isArray(data) ? [...data] : [];
    this.render();
  }

  recalculateLayout() {
    this.render();
  }

  render() {
    if (!this.canvas) return;
    this.canvas.innerHTML = '';

    const totalCount = (this.data ? this.data.length : 0) + 1; // +1 for the dedicated Add New tile
    const rows = Math.ceil(totalCount / 4);

    const appsWidget = document.getElementById('appsWidget');
    if (appsWidget) {
      if (rows >= 3) {
        appsWidget.setAttribute('data-rows', '4');
      } else {
        appsWidget.setAttribute('data-rows', '2');
      }
    }

    // Render all shortcut cards
    if (this.data && this.data.length > 0) {
      this.data.forEach((item, index) => {
        const card = this.createCardElement(item, index);
        this.canvas.appendChild(card);
      });
    }

    // Always append dedicated '+ Add New' squircle tile at the end of the grid
    const addCard = this.createAddCardElement();
    this.canvas.appendChild(addCard);
  }

  createAddCardElement() {
    const card = document.createElement('div');
    card.className = 'shortcut-card add-shortcut-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'Add new shortcut');
    card.title = 'Add new shortcut';

    card.innerHTML = `
      <div class="shortcut-icon-tile add-icon-tile">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>
      <span class="shortcut-title">+ Add New</span>
    `;

    const handleAdd = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.onAddCallback) {
        this.onAddCallback();
      } else {
        const btn = document.getElementById('appsAddBtn') || document.getElementById('emptyAddBtn');
        if (btn) btn.click();
      }
    };

    card.addEventListener('click', handleAdd);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleAdd(e);
      }
    });

    return card;
  }

  createCardElement(item, index) {
    const card = document.createElement('a');
    card.className = `shortcut-card ${item.isPinned ? 'pinned' : ''}`;
    card.href = item.url || '#';
    card.dataset.id = item.id;
    card.dataset.index = index;
    card.draggable = true;
    card.setAttribute('role', 'gridcell');

    let domainText = '';
    try {
      const urlToParse = (item.url && (item.url.startsWith('http://') || item.url.startsWith('https://')))
        ? item.url 
        : `https://${item.url || 'example.com'}`;
      domainText = new URL(urlToParse).hostname.replace(/^www\./, '');
    } catch (e) {
      domainText = item.url || '';
    }

    const faviconSrc = getFaviconUrl(item.url || '');
    const fullTitle = item.title || domainText || 'Shortcut';
    const safeFullTitle = escapeHtml(fullTitle);
    const cleanTitle = getCleanShortcutTitle(item.title, domainText);
    const safeDisplayTitle = escapeHtml(cleanTitle);
    const safeNotes = escapeHtml(item.notes || '');

    const notesIndicator = (item.notes && item.notes.trim().length > 0)
      ? `<span class="notes-indicator" title="Has Note: ${safeNotes.substring(0, 30)}...">📝</span>`
      : '';

    card.innerHTML = `
      <div class="shortcut-icon-tile">
        ${item.isPinned ? '<span class="pin-badge" title="Pinned"></span>' : ''}
        ${notesIndicator}
        <img class="shortcut-icon" src="${faviconSrc}" alt="${safeFullTitle}" loading="lazy" />
      </div>
      <span class="shortcut-title" title="${safeFullTitle}">${safeDisplayTitle}</span>
      
      <div class="card-actions" role="toolbar" aria-label="Shortcut actions">
        <button type="button" class="card-action-btn edit-btn" title="Edit Shortcut" data-action="edit" aria-label="Edit Shortcut">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
          </svg>
        </button>
        <button type="button" class="card-action-btn archive-btn" title="Archive Shortcut" data-action="archive" aria-label="Archive Shortcut">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="21 8 21 21 3 21 3 8"></polyline>
            <rect x="1" y="3" width="22" height="5"></rect>
            <line x1="10" y1="12" x2="14" y2="12"></line>
          </svg>
        </button>
        <button type="button" class="card-action-btn delete-btn" title="Delete Shortcut" data-action="delete" aria-label="Delete Shortcut">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="14" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </div>
    `;

    // Offline local fallback for favicon:
    // When the local Chrome favicon service fails or icon is unreachable, fallback directly to local SVG Web Globe
    const iconImg = card.querySelector('.shortcut-icon');
    if (iconImg) {
      iconImg.addEventListener('error', () => {
        iconImg.src = FALLBACK_WEB_ICON;
      }, { once: true });
    }

    card.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        e.preventDefault();
        e.stopPropagation();
        const action = actionBtn.dataset.action;
        if (action === 'pin' && this.onPinCallback) this.onPinCallback(item.id);
        if (action === 'edit' && this.onEditCallback) this.onEditCallback(item);
        if (action === 'archive' && this.onArchiveCallback) this.onArchiveCallback(item.id);
        if (action === 'delete' && this.onDeleteCallback) this.onDeleteCallback(item.id);
      } else {
        e.preventDefault();
        if (this.onShortcutClickCallback) {
          this.onShortcutClickCallback(e, item);
        }
      }
    });

    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (this.onContextMenuCallback) {
        this.onContextMenuCallback(e, item);
      }
    });

    card.addEventListener('dragstart', (e) => {
      this.draggedIndex = parseInt(card.dataset.index, 10);
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      card.classList.add('drag-over');
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over');
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('drag-over');
      const targetIndex = parseInt(card.dataset.index, 10);

      if (this.draggedIndex !== null && this.draggedIndex !== targetIndex && !isNaN(targetIndex)) {
        const movedItem = this.data.splice(this.draggedIndex, 1)[0];
        this.data.splice(targetIndex, 0, movedItem);

        this.render();
        if (this.onReorderCallback) {
          this.onReorderCallback(this.data);
        }
      }
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      this.draggedIndex = null;
    });

    return card;
  }
}