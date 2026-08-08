// ============================================================
// views/review.js — Daily review screen
// ============================================================

import { UNITS } from '../data/vocab.js';
import { getDueForReview, getProgressSummary } from '../js/db.js';
import { navigate } from '../js/router.js';

export function renderReview(container) {
  const allVocab = UNITS.flatMap(u => u.vocab);
  const dueItems = getDueForReview(allVocab);
  const summary = getProgressSummary(allVocab);
  const totalLearned = summary.learning + summary.familiar + summary.strong + summary.mastered;

  container.innerHTML = `
    <div class="review-screen">
      <header class="screen-header">
        <h1 class="screen-header-title">🔁 Takrorlash</h1>
      </header>

      <!-- Due today card -->
      <div class="review-hero-card ${dueItems.length > 0 ? 'review-hero-card--active' : 'review-hero-card--empty'}">
        <div class="review-hero-icon">${dueItems.length > 0 ? '📚' : '✅'}</div>
        <div class="review-hero-text">
          <div class="review-hero-count">${dueItems.length}</div>
          <div class="review-hero-label">
            ${dueItems.length > 0 ? "Bugun takrorlash kerak" : "Hammasi takrorlandi!"}
          </div>
        </div>
        ${dueItems.length > 0 ? `
          <button class="start-review-btn" id="start-review">
            Boshlash →
          </button>
        ` : `
          <p class="review-done-msg">Ajoyib! Keyingi takrorlash ertaga.</p>
        `}
      </div>

      <!-- Progress breakdown -->
      <div class="review-breakdown-section">
        <h2 class="section-title">So'z holati</h2>
        <div class="breakdown-cards">
          ${renderStatusCard('🆕', 'Yangi', summary.new, '#6366f1')}
          ${renderStatusCard('📖', "O'rganmoqda", summary.learning, '#f59e0b')}
          ${renderStatusCard('🤝', 'Tanish', summary.familiar, '#10b981')}
          ${renderStatusCard('💪', 'Kuchli', summary.strong, '#06b6d4')}
          ${renderStatusCard('⭐', "O'zlashtirilgan", summary.mastered, '#a855f7')}
        </div>
      </div>

      <!-- Unit breakdown -->
      <div class="review-units-section">
        <h2 class="section-title">Birliklar bo'yicha</h2>
        ${UNITS.map(unit => {
          const unitSummary = getProgressSummary(unit.vocab);
          const learned = unitSummary.learning + unitSummary.familiar + unitSummary.strong + unitSummary.mastered;
          const pct = Math.round(learned / unitSummary.total * 100);
          return `
            <div class="review-unit-row">
              <div class="review-unit-name">${unit.label}</div>
              <div class="review-unit-bar">
                <div class="progress-track flex-1">
                  <div class="progress-fill" style="width:${pct}%"></div>
                </div>
                <span class="review-unit-pct">${pct}%</span>
              </div>
              <div class="review-unit-count">${learned}/${unitSummary.total}</div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="height:90px"></div>
    </div>
  `;

  const startBtn = container.querySelector('#start-review');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      // Pick the unit with most due items
      const unitCounts = UNITS.map(u => ({
        unit: u,
        count: dueItems.filter(d => d.unitId === u.unitId).length
      })).filter(x => x.count > 0);

      if (unitCounts.length > 0) {
        unitCounts.sort((a, b) => b.count - a.count);
        const bestUnit = unitCounts[0].unit;
        navigate('#lesson', { unit: bestUnit, mode: 'practice' });
      }
    });
  }
}

function renderStatusCard(icon, label, count, color) {
  return `
    <div class="breakdown-card" style="border-top: 3px solid ${color}">
      <div class="breakdown-icon">${icon}</div>
      <div class="breakdown-count" style="color:${color}">${count}</div>
      <div class="breakdown-label">${label}</div>
    </div>
  `;
}
