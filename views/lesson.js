// ============================================================
// views/lesson.js — Lesson engine (exercise loop)
// ============================================================

import { CONFIG } from '../js/config.js';
import { buildLesson, speak } from '../js/exercise.js';
import { recordAnswer } from '../js/srs.js';
import { getStats, saveStats, getUnitProgress, saveUnitProgress } from '../js/db.js';
import { navigate } from '../js/router.js';

export function renderLesson(container, { unit, mode = 'learn', level }) {
  const count = mode === 'challenge'
    ? CONFIG.lesson.challengeQuestions
    : CONFIG.lesson.questionsPerLesson;

  const exercises = buildLesson(unit.vocab, mode, count);

  let currentIdx = 0;
  let hearts = CONFIG.hearts.max;
  let xpEarned = 0;
  let correctCount = 0;
  let answered = false;
  let selectedTiles = [];

  function renderExercise() {
    if (currentIdx >= exercises.length) {
      finishLesson();
      return;
    }

    const ex = exercises[currentIdx];
    const progress = ((currentIdx) / exercises.length) * 100;

    container.innerHTML = `
      <div class="lesson-screen">
        <!-- Top Bar -->
        <div class="lesson-topbar">
          <button class="exit-btn" id="lesson-exit">✕</button>
          <div class="lesson-progress-track">
            <div class="lesson-progress-fill" id="lesson-progress" style="width:${progress}%"></div>
          </div>
          <div class="hearts-display" id="hearts-display">
            ${renderHearts(hearts)}
          </div>
        </div>

        <!-- Exercise Area -->
        <div class="exercise-area" id="exercise-area">
          ${renderExerciseContent(ex)}
        </div>

        <!-- Answer Feedback Area -->
        <div class="answer-feedback" id="answer-feedback" style="display:none"></div>

        <!-- Check Button -->
        <div class="lesson-footer">
          <button class="check-btn" id="check-btn" disabled>Tekshirish</button>
        </div>
      </div>
    `;

    attachExerciseEvents(ex);

    container.querySelector('#lesson-exit').addEventListener('click', () => {
      if (confirm("Darsdan chiqmoqchimisiz?")) navigate('#unit', { unit, level });
    });
  }

  function renderExerciseContent(ex) {
    switch (ex.type) {
      case 'multiple-choice':
      case 'reverse-choice':
      case 'translation':
        return renderMCExercise(ex);
      case 'listening':
        return renderListeningExercise(ex);
      case 'word-ordering':
        return renderWordOrderExercise(ex);
      default:
        return renderMCExercise(ex);
    }
  }

  function renderMCExercise(ex) {
    return `
      <div class="ex-prompt-label">${ex.promptLabel}</div>
      <div class="ex-prompt-word">${ex.prompt}</div>
      <div class="mc-options" id="mc-options">
        ${ex.options.map((opt, i) => `
          <button class="mc-option" data-index="${i}" data-correct="${opt.correct}">
            ${opt.text}
          </button>
        `).join('')}
      </div>
    `;
  }

  function renderListeningExercise(ex) {
    return `
      <div class="ex-prompt-label">${ex.promptLabel}</div>
      <button class="listen-btn" id="listen-btn">
        <span class="listen-icon">🔊</span>
        <span>Eshitish</span>
      </button>
      <div class="mc-options" id="mc-options">
        ${ex.options.map((opt, i) => `
          <button class="mc-option" data-index="${i}" data-correct="${opt.correct}">
            ${opt.text}
          </button>
        `).join('')}
      </div>
    `;
  }

  function renderWordOrderExercise(ex) {
    return `
      <div class="ex-prompt-label">${ex.promptLabel}</div>
      <div class="ex-prompt-word uzbek-prompt">${ex.prompt}</div>
      <div class="word-answer-area" id="word-answer-area">
        <div class="word-slots" id="word-slots"></div>
        <div class="word-divider"></div>
        <div class="word-tiles" id="word-tiles">
          ${ex.tiles.map((tile, i) => `
            <button class="word-tile" data-word="${tile}" data-idx="${i}">${tile}</button>
          `).join('')}
        </div>
      </div>
    `;
  }

  function attachExerciseEvents(ex) {
    const checkBtn = container.querySelector('#check-btn');

    // Listen button
    const listenBtn = container.querySelector('#listen-btn');
    if (listenBtn) {
      speak(ex.audioText || ex.item.turkish);
      listenBtn.addEventListener('click', () => speak(ex.audioText || ex.item.turkish));
    }

    // MC options
    const mcOptions = container.querySelectorAll('.mc-option');
    mcOptions.forEach(btn => {
      btn.addEventListener('click', () => {
        if (answered) return;
        mcOptions.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        checkBtn.disabled = false;
      });
    });

    // Word ordering
    const wordTilesContainer = container.querySelector('#word-tiles');
    const wordSlotsContainer = container.querySelector('#word-slots');

    if (wordTilesContainer && wordSlotsContainer) {
      selectedTiles = [];

      container.querySelectorAll('.word-tile').forEach(tile => {
        tile.addEventListener('click', () => {
          if (answered) return;
          if (tile.classList.contains('used')) {
            // Remove from slots
            const word = tile.dataset.word;
            const idx = selectedTiles.indexOf(word);
            if (idx > -1) selectedTiles.splice(idx, 1);
            tile.classList.remove('used');
          } else {
            selectedTiles.push(tile.dataset.word);
            tile.classList.add('used');
          }
          updateWordSlots();
          checkBtn.disabled = selectedTiles.length === 0;
        });
      });

      function updateWordSlots() {
        wordSlotsContainer.innerHTML = selectedTiles.map(w =>
          `<span class="word-slot-item">${w}</span>`
        ).join(' ');
      }
    }

    // Check button
    checkBtn.addEventListener('click', () => {
      if (answered) {
        // Move to next
        currentIdx++;
        answered = false;
        selectedTiles = [];
        renderExercise();
        return;
      }

      answered = true;
      let correct = false;

      if (ex.type === 'word-ordering') {
        const userAnswer = selectedTiles.join(' ');
        correct = userAnswer.toLowerCase().trim() === ex.answer.toLowerCase().trim();
      } else {
        const selected = container.querySelector('.mc-option.selected');
        if (!selected) return;
        correct = selected.dataset.correct === 'true';
      }

      handleAnswer(ex, correct);
    });
  }

  function handleAnswer(ex, correct) {
    const checkBtn = container.querySelector('#check-btn');
    const feedbackEl = container.querySelector('#answer-feedback');

    // SRS update
    recordAnswer(ex.item, correct);

    if (correct) {
      xpEarned += CONFIG.xp.correctAnswer;
      correctCount++;
      checkBtn.textContent = 'Davom etish →';
      checkBtn.className = 'check-btn check-btn--correct';

      feedbackEl.style.display = 'flex';
      feedbackEl.className = 'answer-feedback answer-feedback--correct';
      feedbackEl.innerHTML = `
        <div class="feedback-icon">✅</div>
        <div class="feedback-text">
          <strong>To'g'ri!</strong>
          <span>${ex.item.turkish} — ${ex.item.uzbek}</span>
        </div>
      `;

      // Highlight correct option
      container.querySelectorAll('.mc-option').forEach(btn => {
        if (btn.dataset.correct === 'true') btn.classList.add('correct');
        else btn.classList.remove('selected');
      });

    } else {
      hearts = Math.max(0, hearts - 1);
      checkBtn.textContent = 'Davom etish →';
      checkBtn.className = 'check-btn check-btn--wrong';

      feedbackEl.style.display = 'flex';
      feedbackEl.className = 'answer-feedback answer-feedback--wrong';
      feedbackEl.innerHTML = `
        <div class="feedback-icon">❌</div>
        <div class="feedback-text">
          <strong>Noto'g'ri</strong>
          <span>To'g'ri javob: <strong>${ex.item.turkish}</strong> — ${ex.item.uzbek}</span>
        </div>
      `;

      // Update hearts display
      const heartsDisplay = container.querySelector('#hearts-display');
      if (heartsDisplay) heartsDisplay.innerHTML = renderHearts(hearts);

      // Shake animation on wrong
      container.querySelector('.exercise-area')?.classList.add('shake');
      setTimeout(() => container.querySelector('.exercise-area')?.classList.remove('shake'), 600);

      // Highlight wrong + show correct
      container.querySelectorAll('.mc-option').forEach(btn => {
        if (btn.dataset.correct === 'true') btn.classList.add('correct');
        else if (btn.classList.contains('selected')) btn.classList.add('wrong');
      });

      // If no hearts, end early
      if (hearts === 0) {
        setTimeout(() => finishLesson(true), 1200);
        return;
      }
    }

    checkBtn.disabled = false;
  }

  function renderHearts(n) {
    const max = CONFIG.hearts.max;
    let html = '';
    for (let i = 0; i < max; i++) {
      html += `<span class="heart ${i < n ? 'heart--full' : 'heart--empty'}">${i < n ? '❤️' : '🖤'}</span>`;
    }
    return html;
  }

  function finishLesson(outOfHearts = false) {
    // Update stats
    const stats = getStats();
    const bonusXP = CONFIG.xp.lessonComplete;
    xpEarned += bonusXP;
    stats.xp = (stats.xp || 0) + xpEarned;
    stats.totalXP = (stats.totalXP || 0) + xpEarned;
    stats.dailyXP = (stats.dailyXP || 0) + xpEarned;
    saveStats(stats);

    // Update unit progress
    const unitProgress = getUnitProgress();
    const upKey = level ? `${level}-${unit.unitId}` : unit.unitId;
    const up = unitProgress[upKey] || { unlocked: true };
    // No more artificial locking of lesson types or unit completion status.
    // Unit completion is fully derived from vocab mastery in home.js.
    unitProgress[upKey] = up;
    saveUnitProgress(unitProgress);

    navigate('#result', {
      unit,
      mode,
      level,
      xpEarned,
      correctCount,
      totalQuestions: exercises.length,
      heartsLeft: hearts,
      outOfHearts,
      unitCompleted: mode === 'challenge' && !outOfHearts,
    });
  }

  renderExercise();
}
