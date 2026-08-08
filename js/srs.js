// ============================================================
// srs.js — Spaced Repetition System
// Isolated module — can be upgraded to FSRS later
// ============================================================

import { CONFIG } from './config.js';
import { getItemProgress, saveItemProgress } from './db.js';

const STATUS_ORDER = ['new', 'learning', 'familiar', 'strong', 'mastered'];

export function recordAnswer(item, correct) {
  const progress = getItemProgress(item.unitId, item.itemNumber);

  if (correct) {
    progress.correctCount++;
    progress.mastery = Math.min(5, (progress.mastery || 0) + 1);
  } else {
    progress.incorrectCount++;
    progress.mastery = Math.max(0, (progress.mastery || 0) - 1);
  }

  // Update status based on mastery
  const m = progress.mastery;
  if (m <= 0)      progress.status = 'new';
  else if (m <= 1) progress.status = 'learning';
  else if (m <= 2) progress.status = 'familiar';
  else if (m <= 3) progress.status = 'strong';
  else             progress.status = 'mastered';

  // Calculate next review time
  const intervals = CONFIG.srs.intervals;
  const intervalIndex = correct
    ? Math.min(m, intervals.length - 1)
    : CONFIG.srs.failPenalty;
  const days = intervals[intervalIndex];
  progress.lastReviewedAt = Date.now();
  progress.nextReviewAt   = Date.now() + days * 24 * 60 * 60 * 1000;

  saveItemProgress(item.unitId, item.itemNumber, progress);
  return progress;
}

export function getMastery(item) {
  const p = getItemProgress(item.unitId, item.itemNumber);
  return p.mastery || 0;
}

export function getStatus(item) {
  const p = getItemProgress(item.unitId, item.itemNumber);
  return p.status || 'new';
}

export function masteryLabel(status) {
  const labels = {
    new:      'Yangi',
    learning: "O'rganmoqda",
    familiar: 'Tanish',
    strong:   'Kuchli',
    mastered: 'O\'zlashtirilgan',
  };
  return labels[status] || status;
}
