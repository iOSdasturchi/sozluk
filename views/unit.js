// ============================================================
// views/unit.js — Unit detail screen
// ============================================================

import { getUnitProgress, getProgressSummary, getVocabProgress } from '../js/db.js';
import { navigate } from '../js/router.js';

const LESSON_TYPES = [
  { id: 'learn',     icon: '📚', label: "O'rganish",       desc: 'Yangi so\'zlar' },
  { id: 'practice',  icon: '🎯', label: 'Mashq',            desc: 'Bilimni mustahkamlash' },
  { id: 'listening', icon: '🎧', label: 'Tinglash',         desc: 'Eshitish ko\'nikmalari' },
  { id: 'challenge', icon: '🏆', label: 'Birlik sinovchisi', desc: 'Barcha so\'zlar' },
];

export function renderUnit(container, { unit, level }) {
  const unitProgress = getUnitProgress();
  const upKey = level ? `${level}-${unit.unitId}` : unit.unitId;
  const up = unitProgress[upKey] || {};
  const summary = getProgressSummary(unit.vocab);
  const totalLearned = summary.learning + summary.familiar + summary.strong + summary.mastered;
  const pct = unit.vocab.length > 0 ? Math.round((totalLearned / unit.vocab.length) * 100) : 0;

  const vp = getVocabProgress();
  const newWords = [];
  const learningWords = [];
  const masteredWords = [];
  
  unit.vocab.forEach(item => {
    const p = vp[`${unit.unitId}-${item.itemNumber}`];
    if (!p || p.status === 'new') newWords.push(item);
    else if (p.status === 'mastered' || p.status === 'strong') masteredWords.push(item);
    else learningWords.push(item);
  });

  function renderVocabCategory(title, words) {
    if (words.length === 0) return '';
    return `
      <div class="vocab-category">
        <div class="vocab-section-header" style="margin-top:20px; margin-bottom: 10px;">
          <h3 style="font-size:16px; color:var(--text);">${title}</h3>
          <span class="vocab-count">${words.length}</span>
        </div>
        <div class="vocab-list">
          ${words.map(item => `
            <div class="vocab-row" data-idx="${unit.vocab.indexOf(item)}">
              <span class="vocab-turkish">${item.turkish}</span>
              <span class="vocab-uzbek">${item.uzbek}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="unit-screen">
      <!-- Top bar -->
      <div class="unit-topbar">
        <button class="back-btn" id="unit-back">←</button>
        <h1 class="unit-title">${unit.label}</h1>
        <div style="width:40px"></div>
      </div>

      <!-- Unit Hero -->
      <div class="unit-hero">
        <div class="unit-hero-circle">${unit.unitNumber}</div>
        <div class="unit-hero-info">
          <div class="unit-hero-count">${unit.vocab.length} so'z</div>
          <div class="unit-progress-row">
            <div class="progress-track flex-1">
              <div class="progress-fill" style="width:${pct}%"></div>
            </div>
            <span class="ps-pct">${pct}%</span>
          </div>
          <div class="unit-stats-row">
            <span class="ustat">🆕 ${summary.new}</span>
            <span class="ustat">📖 ${summary.learning}</span>
            <span class="ustat">✅ ${summary.mastered}</span>
          </div>
        </div>
      </div>

      <!-- Lessons -->
      <div class="lessons-section">
        <h2 class="section-title">Darslar</h2>
        <div class="lessons-grid">
          ${LESSON_TYPES.map((lt, idx) => {
            return `
              <button class="lesson-card lesson-card--active" data-lesson="${lt.id}">
                <div class="lesson-card-icon">${lt.icon}</div>
                <div class="lesson-card-text">
                  <div class="lesson-card-label">${lt.label}</div>
                  <div class="lesson-card-desc">${lt.desc}</div>
                </div>
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Story section -->
      <div class="story-section" style="padding: 0 var(--sp-lg); margin-top: var(--sp-xl);">
        <button class="btn btn-primary" id="unit-story-btn" style="width:100%; border-radius: var(--r-full); padding: 12px; font-weight: 800; background: linear-gradient(135deg, var(--purple), var(--primary)); border: none; box-shadow: var(--shadow-glow-blue);">
          📖 Hikoyani O'qish
        </button>
      </div>

      <!-- Vocabulary section -->
      <div class="vocab-section">
        ${renderVocabCategory("🆕 Yangi so'zlar", newWords)}
        ${renderVocabCategory("📖 O'rganilmoqda", learningWords)}
        ${renderVocabCategory("✅ Yodlangan", masteredWords)}
      </div>

      <div style="height:90px"></div>
    </div>
  `;

  // Events
  container.querySelector('#unit-back').addEventListener('click', () => navigate('#home'));
  
  const storyBtn = container.querySelector('#unit-story-btn');
  if (storyBtn) {
    storyBtn.addEventListener('click', () => navigate('#story', { unit, level, unitId: unit.unitId }));
  }

  container.querySelectorAll('.lesson-card:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.lesson;
      navigate('#lesson', { unit, mode, level });
    });
  });



  // Vocab row click for detail
  container.querySelectorAll('.vocab-row').forEach(row => {
    row.addEventListener('click', () => {
      const idx = row.dataset.idx;
      navigate('#vocab', { item: unit.vocab[idx], unit, level });
    });
  });
}
