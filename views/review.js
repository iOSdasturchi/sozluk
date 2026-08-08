// ============================================================
// views/review.js — Daily review screen
// ============================================================

import { LEVELS_CONFIG } from '../data/vocab.js';
import { getDueForReview, getProgressSummary } from '../js/db.js';
import { navigate } from '../js/router.js';

export function renderReview(container) {
  const allVocab = LEVELS_CONFIG.flatMap(lc => lc.vocab);
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
          <p class="review-done-msg" style="margin-bottom: 10px;">Ajoyib! Keyingi takrorlash ertaga.</p>
          <button class="btn btn-primary" id="learn-new-btn" style="width: 100%; border-radius: var(--r-full); padding: 12px; font-weight: 800; background: linear-gradient(135deg, var(--teal), var(--primary)); border: none;">
            Yangi so'zlarni o'rganish
          </button>
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

      <!-- Status cards are rendered but static. In future updates they can trigger specific filtered sessions -->
      <div style="height:90px"></div>
    </div>
  `;

  // Learn new words button
  const learnNewBtn = container.querySelector('#learn-new-btn');
  if (learnNewBtn) {
    learnNewBtn.addEventListener('click', () => {
      navigate('#home'); // Direct user to home to pick a unit
    });
  }

  const startBtn = container.querySelector('#start-review');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      // Pick the unit ID with most due items
      const unitCounts = [];
      const unitGroups = {};
      dueItems.forEach(d => {
        unitGroups[d.unitId] = (unitGroups[d.unitId] || 0) + 1;
      });
      for (const [unitId, count] of Object.entries(unitGroups)) {
        unitCounts.push({ unitId, count });
      }

      if (unitCounts.length > 0) {
        unitCounts.sort((a, b) => b.count - a.count);
        // Find the unit config
        const bestUnitData = allVocab.find(v => v.unitId === unitCounts[0].unitId);
        if (bestUnitData) {
          navigate('#lesson', { 
            unit: { unitId: bestUnitData.unitId, label: 'Takrorlash' }, 
            mode: 'practice' 
          });
        }
      }
    });
  }
}

function renderStatusCard(icon, label, count, color) {
  return `
    <div class="breakdown-card" style="border-top: 3px solid ${color}; cursor: pointer;" onclick="window.location.hash='#home'">
      <div class="breakdown-icon">${icon}</div>
      <div class="breakdown-count" style="color:${color}">${count}</div>
      <div class="breakdown-label">${label}</div>
    </div>
  `;
}
