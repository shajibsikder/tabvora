/**
 * Tabvora Official Website Core Application Script
 * Vanilla JS - Zero External Dependencies
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileMenu();
  initActiveLinks();
  initAccordion();
  initSearchFilter();
});

/* ==========================================================================
   Hero Section Keyboard Tooltip Access
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const disabledBtn = document.querySelector('.hero-btn-primary[disabled]');
  if (disabledBtn) {
    // Make disabled state explicit to screen readers while allowing keyboard focus for the tooltip
    disabledBtn.setAttribute('tabindex', '0');
    disabledBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); // Prevent accidental form triggers
      }
    });
  }
});

/* ==========================================================================
   1. Theme Toggle System (Dark Mode / Light Mode / System Default)
   ========================================================================== */
function initTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const storedTheme = localStorage.getItem('tabvora_theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  let currentTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      currentTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', currentTheme);
      localStorage.setItem('tabvora_theme', currentTheme);
      updateThemeIcon(currentTheme);
    });
  }
  
  // Listen for system theme updates
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('tabvora_theme')) {
      currentTheme = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', currentTheme);
      updateThemeIcon(currentTheme);
    }
  });
}

function updateThemeIcon(theme) {
  const themeIcon = document.getElementById('theme-icon');
  if (!themeIcon) return;
  if (theme === 'dark') {
    // Sun Icon for Switching to Light
    themeIcon.innerHTML = `<path fill="currentColor" d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0s-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41s-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>`;
    themeIcon.setAttribute('aria-label', 'Switch to Light Theme');
  } else {
    // Moon Icon for Switching to Dark
    themeIcon.innerHTML = `<path fill="currentColor" d="M12.3 2c-.43 0-.78.35-.78.78 0 .22.08.42.24.58 1.41 1.41 2.24 3.32 2.24 5.44 0 4.25-3.45 7.7-7.7 7.7-2.12 0-4.03-.83-5.44-2.24-.16-.16-.36-.24-.58-.24-.43 0-.78.35-.78.78 0 .2.08.39.21.53C1.88 18.27 6.6 22 12 22c5.52 0 10-4.48 10-10 0-5.4-3.73-10.12-9.17-10.47-.18-.02-.35-.03-.53-.03z"/>`;
    themeIcon.setAttribute('aria-label', 'Switch to Dark Theme');
  }
}

/* ==========================================================================
   2. Mobile Navigation Toggle
   ========================================================================== */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const navLinks = document.getElementById('nav-links');
  
  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      toggleBtn.setAttribute('aria-expanded', !expanded);
      navLinks.classList.toggle('active');
    });
  }
}

/* ==========================================================================
   3. Navigation Active Link Highlighter
   ========================================================================== */
function initActiveLinks() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const links = document.querySelectorAll('.nav-link, .footer-link');
  
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
}

/* ==========================================================================
   4. Accordion Logic (Used in FAQ Page)
   ========================================================================== */
function initAccordion() {
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      const isExpanded = header.getAttribute('aria-expanded') === 'true';
      
      // Close all other panels
      document.querySelectorAll('.accordion-header').forEach(h => {
        h.setAttribute('aria-expanded', 'false');
        if (h.nextElementSibling) h.nextElementSibling.style.display = 'none';
      });
      
      if (!isExpanded) {
        header.setAttribute('aria-expanded', 'true');
        content.style.display = 'block';
      }
    });
  });
}

/* ==========================================================================
   5. Dynamic Filtering (Used in FAQ/Permissions/Features Search)
   ========================================================================== */
function initSearchFilter() {
  const searchInput = document.getElementById('component-search');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const filter = e.target.value.toLowerCase();
    const searchableItems = document.querySelectorAll('[data-searchable]');

    searchableItems.forEach(item => {
      const text = item.textContent.toLowerCase();
      if (text.includes(filter)) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  });
}