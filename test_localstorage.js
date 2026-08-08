import fs from 'fs';

// Mock localStorage
const store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => store[k] = v,
  removeItem: (k) => delete store[k]
};

const DB_KEY = 'turkce_progress_v1';
let data = {
  vocabProgress: {
    'A1-unit-01-1': { status: 'mastered' }
  },
  updatedAt: Date.now()
};

localStorage.setItem(DB_KEY, JSON.stringify(data));

// Now simulate loadAll()
function loadAll() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.vocabProgress) {
        let migrated = false;
        for (const key in parsed.vocabProgress) {
          if (key.startsWith('unit-')) { 
            parsed.vocabProgress['A1-' + key] = parsed.vocabProgress[key];
            delete parsed.vocabProgress[key];
            migrated = true;
          }
        }
        if (migrated) {
          localStorage.setItem(DB_KEY, JSON.stringify(parsed));
        }
      }
      return parsed;
    }
  } catch (e) {
    console.error(e);
  }
  return {};
}

console.log(loadAll());
