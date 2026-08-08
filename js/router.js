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

// App initialization
export function initRouter() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.documentElement.classList.add('light-mode');
  }
  
  // Auto sync from Gist if configured
  const token = localStorage.getItem('turkce_gist_token');
  const gistId = localStorage.getItem('turkce_gist_id');
  if (token && gistId) {
    import('./db.js').then(db => {
      db.syncFromGist(token, gistId).then(updated => {
        db.checkStreak();
        if (updated) {
          console.log("Auto-synced from Github Gist.");
          // Refresh current view if needed
          const hash = window.location.hash || '#home';
          render(hash, _params);
        }
      }).catch(e => {
        console.error("Auto-sync error:", e);
        db.checkStreak();
      });
    });
  } else {
    import('./db.js').then(db => db.checkStreak());
  }

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
