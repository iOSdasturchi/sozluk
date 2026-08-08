// ============================================================
// views/vocab.js — Vocabulary card detail view
// ============================================================

import { navigate } from '../js/router.js';
import { speak } from '../js/exercise.js';
import { getItemProgress } from '../js/db.js';
import { masteryLabel } from '../js/srs.js';

const MASTERY_COLORS = {
  new:      '#6366f1',
  learning: '#f59e0b',
  familiar: '#10b981',
  strong:   '#06b6d4',
  mastered: '#a855f7',
};

export function renderVocab(container, { item, unit }) {
  const progress = getItemProgress(item.level, item.unitId, item.itemNumber);
  const status = progress.status || 'new';
  const statusColor = MASTERY_COLORS[status] || '#6366f1';

  container.innerHTML = `
    <div class="vocab-detail-screen">
      <div class="vocab-detail-topbar">
        <button class="back-btn" id="vocab-back">←</button>
        <span class="vocab-detail-unit">${unit.label}</span>
        <div style="width:40px"></div>
      </div>

      <div class="vocab-detail-card">
        <!-- Turkish word -->
        <div class="vocab-detail-flag">🇹🇷</div>
        <div class="vocab-detail-word">${item.turkish}</div>
        <button class="vocab-audio-btn" id="vocab-audio" title="Tinglash">
          🔊
        </button>

        <!-- Divider -->
        <div class="vocab-detail-divider"></div>

        <!-- Uzbek translation -->
        <div class="vocab-detail-flag">🇺🇿</div>
        <div class="vocab-detail-translation">${item.uzbek}</div>

        <!-- Word type -->
        <div class="vocab-word-type">
          ${item.wordType === 'verb' ? '🔵 Fe\'l' : item.wordType === 'adjective' ? '🟡 Sifat' : '🟢 Ot'}
        </div>
      </div>

      <!-- Mastery status -->
      <div class="vocab-mastery-card" style="border-left: 4px solid ${statusColor}">
        <div class="vocab-mastery-label">Daraja</div>
        <div class="vocab-mastery-status" style="color:${statusColor}">
          ${masteryLabel(status)}
        </div>
        <div class="vocab-mastery-bar">
          <div class="progress-track">
            <div class="progress-fill" style="width:${(progress.mastery || 0) * 20}%;background:${statusColor}"></div>
          </div>
        </div>
        <div class="vocab-mastery-stats">
          <span>✅ ${progress.correctCount || 0} to'g'ri</span>
          <span>❌ ${progress.incorrectCount || 0} noto'g'ri</span>
        </div>
      </div>

      <!-- Source info -->
      <div class="vocab-source-info">
        📄 Manba: A1 Sözlük • ${unit.label} • #${item.itemNumber}
      </div>

      <!-- Practice button -->
      <div class="vocab-detail-actions">
        <button class="vocab-practice-btn" id="vocab-practice">
          🎯 Bu so'zni mashq qilish
        </button>
      </div>

      <div style="height:90px"></div>
    </div>
  `;
  const level = item.level || 'A1';

  container.querySelector('#vocab-back').addEventListener('click', () => navigate('#unit', { unit, level }));

  container.querySelector('#vocab-audio').addEventListener('click', () => {
    speak(item.turkish);
  });

  container.querySelector('#vocab-practice').addEventListener('click', () => {
    navigate('#lesson', { unit, mode: 'practice', level });
  });

  // Auto-speak on load
  setTimeout(() => speak(item.turkish), 300);
}
