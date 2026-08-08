// ============================================================
// db.js — User progress persistence (IndexedDB via localStorage fallback)
// Separates source vocabulary from user-specific progress
// ============================================================

const DB_KEY = 'turkce_progress_v1';

function loadAll() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      // Migration for old keys that lacked level (assume A1)
      if (data.vocabProgress) {
        let migrated = false;
        for (const key in data.vocabProgress) {
          if (key.startsWith('unit-')) { // old format: unit-01-1
            data.vocabProgress['A1-' + key] = data.vocabProgress[key];
            delete data.vocabProgress[key];
            migrated = true;
          }
        }
        if (migrated) {
          localStorage.setItem(DB_KEY, JSON.stringify(data));
        }
      }
      return data;
    }
  } catch (_) {}
  return {};
}

let syncTimeout = null;
function saveAll(data, skipAutoSync = false) {
  try {
    data.updatedAt = Date.now();
    localStorage.setItem(DB_KEY, JSON.stringify(data));
    
    if (!skipAutoSync) {
      const token = localStorage.getItem('turkce_gist_token');
      const gistId = localStorage.getItem('turkce_gist_id');
      if (token && gistId) {
        clearTimeout(syncTimeout);
        syncTimeout = setTimeout(() => {
          syncToGist(token, gistId).catch(console.error);
        }, 3000);
      }
    }
  } catch (_) {}
}

export function checkStreak() {
  const stats = getStats();
  const today = new Date().toDateString();
  if (stats.lastStudyDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (stats.lastStudyDate !== yesterday && stats.lastStudyDate != null) {
      stats.streak = 0;
    }
    stats.dailyXP = 0;
    stats.dailyDate = today;
    saveStats(stats);
  }
}

// ---- User Stats ----

export function getStats() {
  const d = loadAll();
  return d.stats || {
    xp:            0,
    totalXP:       0,
    streak:        0,
    lastStudyDate: null,
    dailyXP:       0,
    dailyDate:     null,
  };
}

export function saveStats(stats) {
  const d = loadAll();
  d.stats = stats;
  saveAll(d);
}

// ---- Unit Progress ----
// unitProgress[unitId] = { unlocked, lessonsCompleted, challenged, completed }

export function getUnitProgress() {
  const d = loadAll();
  return d.unitProgress || { 'unit-01': { unlocked: true, lessonsCompleted: 0, challenged: false, completed: false } };
}

export function saveUnitProgress(up) {
  const d = loadAll();
  d.unitProgress = up;
  saveAll(d);
}

// ---- Vocabulary Progress ----
// vocabProgress[`unit-XX-NNN`] = { status, mastery, correctCount, incorrectCount, lastReviewedAt, nextReviewAt }

export function getVocabProgress() {
  const d = loadAll();
  return d.vocabProgress || {};
}

export function saveVocabProgress(vp) {
  const d = loadAll();
  d.vocabProgress = vp;
  saveAll(d);
}

export function getItemProgress(level, unitId, itemNumber) {
  const vp = getVocabProgress();
  const key = `${level}-${unitId}-${itemNumber}`;
  return vp[key] || {
    key,
    status:        'new',   // new | learning | familiar | strong | mastered
    mastery:       0,       // 0..5
    correctCount:  0,
    incorrectCount: 0,
    lastReviewedAt: null,
    nextReviewAt:   null,
  };
}

export function saveItemProgress(level, unitId, itemNumber, progress) {
  const vp = getVocabProgress();
  const key = `${level}-${unitId}-${itemNumber}`;
  vp[key] = { ...progress, key };
  saveVocabProgress(vp);
}

// ---- Batch Progress ----
export function getCurrentBatch() {
  const d = loadAll();
  return d.currentBatch || null; // { unitId: string, items: Array }
}

export function saveCurrentBatch(batch) {
  const d = loadAll();
  d.currentBatch = batch;
  saveAll(d);
}

export function clearCurrentBatch() {
  const d = loadAll();
  d.currentBatch = null;
  saveAll(d);
}

// ---- Helpers ----

export function getProgressSummary(vocab) {
  const vp = getVocabProgress();
  let newCount = 0, learning = 0, familiar = 0, strong = 0, mastered = 0;

  for (const item of vocab) {
    const key = `${item.level}-${item.unitId}-${item.itemNumber}`;
    const p = vp[key];
    if (!p || p.status === 'new') newCount++;
    else if (p.status === 'learning') learning++;
    else if (p.status === 'familiar') familiar++;
    else if (p.status === 'strong') strong++;
    else if (p.status === 'mastered') mastered++;
  }

  return { new: newCount, learning, familiar, strong, mastered, total: vocab.length };
}

export function getDueForReview(vocab) {
  const vp = getVocabProgress();
  const now = Date.now();
  return vocab.filter(item => {
    const key = `${item.level}-${item.unitId}-${item.itemNumber}`;
    const p = vp[key];
    if (!p || p.status === 'new') return false;
    if (!p.nextReviewAt) return true;
    return p.nextReviewAt <= now;
  });
}

export function clearAll() {
  localStorage.removeItem(DB_KEY);
}

// ============================================================
// GIST SYNC LOGIC
// ============================================================

export async function createGist(token) {
  const data = loadAll();
  data.updatedAt = Date.now();
  
  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      description: "Turkce App Progress Sync",
      public: false,
      files: {
        "turkce_progress.json": {
          content: JSON.stringify(data)
        }
      }
    })
  });
  
  if (!res.ok) throw new Error("Gist yaratishda xatolik");
  const gist = await res.json();
  return gist.id;
}

export async function syncToGist(token, gistId) {
  if (!token || !gistId) return;
  const data = loadAll();
  data.updatedAt = Date.now();
  saveAll(data, true); // skip auto sync to prevent infinite loop

  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      files: {
        "turkce_progress.json": {
          content: JSON.stringify(data)
        }
      }
    })
  });
  if (!res.ok) throw new Error("Sinxronizatsiyada xatolik (Yuklash)");
  return await res.json();
}

export async function syncFromGist(token, gistId) {
  if (!token || !gistId) return false;
  
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    },
    cache: 'no-store'
  });
  
  if (!res.ok) throw new Error("Sinxronizatsiyada xatolik (O'qish)");
  
  const gist = await res.json();
  const file = gist.files["turkce_progress.json"];
  if (!file) return false;
  
  const remoteData = JSON.parse(file.content);
  const localData = loadAll();
  
  const remoteTime = remoteData.updatedAt || 0;
  const localTime = localData.updatedAt || 0;
  
  // Only overwrite if remote is newer
  if (remoteTime > localTime) {
    localStorage.setItem(DB_KEY, JSON.stringify(remoteData));
    return true; // updated
  }
  return false; // local is newer or same
}
