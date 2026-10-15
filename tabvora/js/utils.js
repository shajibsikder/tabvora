/**
 * Utility functions for Tabvora.
 */

/**
 * Escapes HTML characters in user-controlled strings to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function debounce(fn, delay = 150) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(null, args), delay);
  };
}

export function parseUrlDetails(urlString) {
  try {
    let formattedUrl = (urlString || '').trim();
    if (!formattedUrl) return { valid: false };

    // If no protocol is provided (e.g., "example.com"), default to https://
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const parsed = new URL(formattedUrl);
    // Ensure there is a hostname and it contains a domain dot or is localhost
    if (!parsed.hostname || (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost')) {
      return { valid: false };
    }

    const domain = parsed.hostname.replace(/^www\./, '');
    const baseName = domain.split('.')[0] || domain;
    const defaultTitle = baseName.charAt(0).toUpperCase() + baseName.slice(1);

    return {
      valid: true,
      url: parsed.href,
      domain,
      defaultTitle
    };
  } catch (e) {
    return { valid: false };
  }
}

export function getFaviconUrl(u) {
  try {
    const url = new URL(chrome.runtime.getURL("/_favicon/"));
    url.searchParams.set("pageUrl", u);
    url.searchParams.set("size", "64");
    return url.href;
  } catch (e) {
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%2364748b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
  }
}