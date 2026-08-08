// ============================================================
// router.js — Simple hash-based router with param storage
// ============================================================

const routes = {};
let _params = {};
let currentCleanup = null;

export function registerRoute(hash, handler) {
  routes[hash] = handler;
}

export function navigate(hash, params = {}) {
  _params = params;
  // Prevent hashchange from re-rendering with empty params
  window._skipHashChange = true;
  window.location.hash = hash;
  window._skipHashChange = false;
  render(hash, params);
}

export function render(hash, params = {}) {
  if (currentCleanup) { currentCleanup(); currentCleanup = null; }

  const container = document.getElementById('app');
  container.innerHTML = '';

  const handler = routes[hash] || routes['#home'];
  if (handler) {
    currentCleanup = handler(container, params) || null;
  }
  window.scrollTo(0, 0);
}

export function initRouter() {
  window.addEventListener('hashchange', () => {
    if (window._skipHashChange) return;
    const hash = window.location.hash || '#home';
    // Use stored params if same hash, else empty
    render(hash, _params);
    _params = {};
  });

  const initial = window.location.hash || '#home';
  render(initial, {});
}

// Global nav helper exposed to inline scripts
window._nav = navigate;
