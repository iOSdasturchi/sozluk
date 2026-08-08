// ============================================================
// views/home.js — Home screen: multi-level learning path
// ============================================================

import { LEVELS_CONFIG, getUnitsForLevel } from '../data/vocab.js';
import { getStats, getUnitProgress, getProgressSummary } from '../js/db.js';
import { CONFIG } from '../js/config.js';
import { navigate } from '../js/router.js';

export function renderHome(container) {
  const stats = getStats();
  const unitProgress = getUnitProgress();

  // Active levels (A1 and A2 are active per config)
  const activeLevels = LEVELS_CONFIG.filter(lc => lc.active);

  const allActiveVocab = activeLevels.flatMap(lc => lc.vocab);
  const summary = getProgressSummary(allActiveVocab);

  const dailyPct = Math.min(100, Math.round((stats.dailyXP || 0) / CONFIG.daily.xpTarget * 100));
  const totalLearned = summary.learning + summary.familiar + summary.strong + summary.mastered;
  const totalPct = allActiveVocab.length > 0
    ? Math.round(totalLearned / allActiveVocab.length * 100)
    : 0;

  container.innerHTML = `
    <div class="home-screen">

      <!-- Header -->
      <header class="home-header">
        <div class="home-logo">
          <span class="logo-flag">🇹🇷</span>
          <span class="logo-text">TÜRKÇE</span>
        </div>
        <div class="home-badges">
          <div class="badge theme-toggle-btn" id="theme-toggle" title="Mavzuni o'zgartirish" style="cursor: pointer;">
            🌓
          </div>
          <div class="badge streak-badge" title="Streak">
            🔥 <span>${stats.streak || 0}</span>
          </div>
          <div class="badge xp-badge" title="XP">
            ⚡ <span>${stats.xp || 0}</span>
          </div>
        </div>
      </header>

      <!-- 16-day Challenge Widget -->
      <div class="daily-goal-bar" style="background: linear-gradient(135deg, var(--primary), var(--purple)); padding: 20px; border-radius: 16px; margin-bottom: 20px; color: white;">
        <h2 style="margin:0 0 10px 0; font-size: 18px; font-weight: 800; display:flex; align-items:center; gap:8px;">
          🚀 16-Kunlik Bootcamp
        </h2>
        <div style="display:flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; font-weight: 600;">
          <span>Umumiy yodlangan: ${totalLearned} / ${allActiveVocab.length}</span>
          <span>${totalPct}%</span>
        </div>
        <div class="progress-track" style="background: rgba(255,255,255,0.2); height: 10px; margin-bottom: 12px;">
          <div class="progress-fill" style="width:${totalPct}%; background: white;"></div>
        </div>
        <div style="font-size: 13px; opacity: 0.9;">
          🎯 Kunlik maqsad: <strong>160 ta so'z</strong> yodlash. (O'rganish rejimi orqali bajariladi).
        </div>
      </div>

      <!-- Progress Summary -->
      <div class="progress-summary-card">
        <div class="ps-title">Darajalar progressi</div>
        <div class="ps-bar-row">
          <div class="progress-track flex-1">
            <div class="progress-fill" style="width:${totalPct}%"></div>
          </div>
          <span class="ps-pct">${totalPct}%</span>
        </div>
        <div class="ps-stats">
          <div class="ps-stat"><span class="ps-num">${totalLearned}</span><span class="ps-lbl">O'rganildi</span></div>
          <div class="ps-stat"><span class="ps-num">${summary.mastered}</span><span class="ps-lbl">Ustun</span></div>
          <div class="ps-stat"><span class="ps-num">${allActiveVocab.length}</span><span class="ps-lbl">Jami</span></div>
        </div>
      </div>

      <!-- Learning Path: all active levels -->
      ${activeLevels.map(lc => renderLevelSection(lc, unitProgress)).join('')}

      <!-- Locked future levels -->
      <div class="locked-levels">
        ${LEVELS_CONFIG.filter(lc => !lc.active).map(lc => `
          <div class="locked-level-card">
            <div class="locked-level-icon">🔒</div>
            <div class="locked-level-info">
              <div class="locked-level-name">${lc.level}</div>
              <div class="locked-level-label">${lc.label}</div>
              <div class="locked-level-count">${lc.totalWords} so'z</div>
            </div>
            <div class="locked-level-badge">Yaqinda</div>
          </div>
        `).join('')}
      </div>

      <div style="height:90px"></div>
    </div>
  `;

  // Attach unit click events for all levels
  activeLevels.forEach(lc => {
    const units = getUnitsForLevel(lc.level);
    units.forEach(unit => {
      const btn = container.querySelector(`#unit-btn-${lc.level}-${unit.unitNumber}`);
      if (btn) {
        btn.addEventListener('click', () => {
          const up = unitProgress[`${lc.level}-${unit.unitId}`] || unitProgress[unit.unitId];
          if (btn.disabled) return;
          navigate('#unit', { unit, level: lc.level });
        });
      }
    });
  });

  // Theme toggle logic
  const themeToggle = container.querySelector('#theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isLight = document.documentElement.classList.toggle('light-mode');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
  }
}

function renderLevelSection(lc, unitProgress) {
  const units = getUnitsForLevel(lc.level);
  const levelSummary = getProgressSummary(lc.vocab);
  const learned = levelSummary.learning + levelSummary.familiar + levelSummary.strong + levelSummary.mastered;
  const pct = lc.vocab.length > 0 ? Math.round(learned / lc.vocab.length * 100) : 0;

  return `
    <div class="level-section">
      <div class="level-section-header">
        <div class="level-section-badge">${lc.level}</div>
        <div class="level-section-info">
          <div class="level-section-name">${lc.label}</div>
          <div class="level-section-count">${lc.unitCount} birlik · ${lc.totalWords} so'z</div>
        </div>
        <div class="level-section-pct">${pct}%</div>
      </div>
      <div class="learning-path">
        ${units.map((unit, idx) => renderUnitNode(unit, idx, lc.level, unitProgress)).join('')}
      </div>
    </div>
  `;
}

function renderUnitNode(unit, idx, levelCode, unitProgress) {
  // Check progress for this unit (try level-prefixed key first, then plain)
  const up = unitProgress[`${levelCode}-${unit.unitId}`]
          || unitProgress[unit.unitId]
          || {};

  // A1 Unit 1 is always unlocked; A2 Unit 1 unlocks after A1 is done; others chain
  let isUnlocked;
  if (levelCode === 'A1' && idx === 0) {
    isUnlocked = true;
  } else if (idx === 0) {
    // First unit of a level: unlocked if all A1 units are completed
    const a1Progress = unitProgress;
    const a1Units = getUnitsForLevel('A1');
    const a1Done = a1Units.every(u => (a1Progress[u.unitId] || {}).completed);
    isUnlocked = a1Done || (levelCode === 'A2'); // A2 available by default for now
  } else {
    isUnlocked = up.unlocked || false;
  }

  const unitSummary = getProgressSummary(unit.vocab);
  const wordsLearned = unitSummary.learning + unitSummary.familiar + unitSummary.strong + unitSummary.mastered;
  const progress = unit.vocab.length > 0 ? Math.round((wordsLearned / unit.vocab.length) * 100) : 0;
  const isCompleted = progress === 100;

  const stateClass = isCompleted ? 'unit-node--complete'
                   : isUnlocked  ? 'unit-node--unlocked'
                   : 'unit-node--locked';

  const icon = isCompleted ? '✓'
             : isUnlocked  ? `${unit.unitNumber}`
             : '🔒';

  const side = idx % 2 === 0 ? 'path-left' : 'path-right';

  return `
    <div class="path-step ${side}">
      ${idx > 0 ? `<div class="path-connector"></div>` : ''}
      <button
        id="unit-btn-${levelCode}-${unit.unitNumber}"
        class="unit-node ${stateClass}"
        ${isUnlocked ? '' : 'disabled'}
        aria-label="${unit.label}"
      >
        <div class="unit-node-icon">${icon}</div>
        ${isUnlocked && !isCompleted ? `
          <div class="unit-node-ring">
            <svg viewBox="0 0 36 36" class="unit-ring-svg">
              <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>
              <circle cx="18" cy="18" r="16" fill="none" stroke="white" stroke-width="3"
                stroke-dasharray="${progress * 1.005}, 100"
                stroke-linecap="round"
                transform="rotate(-90 18 18)"/>
            </svg>
          </div>
        ` : ''}
      </button>
      <div class="unit-label ${isUnlocked ? '' : 'unit-label--locked'}">
        <div class="unit-label-name">${unit.label}</div>
        <div class="unit-label-count">${unit.vocab.length} so'z</div>
      </div>
    </div>
  `;
}
