// ============================================================
// views/result.js — Lesson / Unit complete result screen
// ============================================================

import { navigate } from '../js/router.js';
import { CONFIG } from '../js/config.js';
import { getStats } from '../js/db.js';

export function renderResult(container, params) {
  const {
    unit,
    mode,
    xpEarned = 0,
    correctCount = 0,
    totalQuestions = 0,
    heartsLeft = CONFIG.hearts.max,
    outOfHearts = false,
    unitCompleted = false,
  } = params;

  const accuracy = totalQuestions > 0
    ? Math.round((correctCount / totalQuestions) * 100)
    : 0;

  const stats = getStats();

  // Determine screen type
  const isUnitComplete = unitCompleted;
  const isOutOfHearts = outOfHearts;

  container.innerHTML = `
    <div class="result-screen ${isUnitComplete ? 'result-screen--celebration' : ''}">

      ${isUnitComplete ? renderUnitComplete(unit, xpEarned, accuracy, stats) : ''}
      ${isOutOfHearts ? renderOutOfHearts(unit, correctCount, totalQuestions) : ''}
      ${!isUnitComplete && !isOutOfHearts ? renderLessonComplete(unit, mode, xpEarned, accuracy, correctCount, totalQuestions, heartsLeft) : ''}

    </div>
  `;

  const level = params.level || 'A1';

  // Buttons
  container.querySelector('#result-home')?.addEventListener('click', () => navigate('#home'));
  container.querySelector('#result-retry')?.addEventListener('click', () => navigate('#lesson', { unit, mode, level }));
  container.querySelector('#result-next')?.addEventListener('click', () => navigate('#unit', { unit, level }));

  // Confetti for unit complete
  if (isUnitComplete) {
    launchConfetti();
  }
}

function renderLessonComplete(unit, mode, xpEarned, accuracy, correctCount, totalQuestions, heartsLeft) {
  const modeLabels = {
    learn: "O'rganish",
    practice: 'Mashq',
    listening: 'Tinglash',
    challenge: 'Sinov',
  };
  return `
    <div class="result-card">
      <div class="result-emoji">🎉</div>
      <h1 class="result-title">Dars tugadi!</h1>
      <p class="result-subtitle">${modeLabels[mode] || mode} — ${unit.label}</p>

      <div class="result-stats">
        <div class="result-stat">
          <div class="result-stat-icon">⚡</div>
          <div class="result-stat-value">+${xpEarned}</div>
          <div class="result-stat-label">XP</div>
        </div>
        <div class="result-stat">
          <div class="result-stat-icon">🎯</div>
          <div class="result-stat-value">${accuracy}%</div>
          <div class="result-stat-label">Aniqlik</div>
        </div>
        <div class="result-stat">
          <div class="result-stat-icon">✅</div>
          <div class="result-stat-value">${correctCount}/${totalQuestions}</div>
          <div class="result-stat-label">To'g'ri</div>
        </div>
        <div class="result-stat">
          <div class="result-stat-icon">❤️</div>
          <div class="result-stat-value">${heartsLeft}</div>
          <div class="result-stat-label">Qolgan</div>
        </div>
      </div>

      <div class="result-actions">
        <button class="result-btn result-btn--secondary" id="result-home">🏠 Asosiy</button>
        <button class="result-btn result-btn--primary" id="result-next">Davom etish →</button>
      </div>
    </div>
  `;
}

function renderUnitComplete(unit, xpEarned, accuracy, stats) {
  return `
    <div class="result-card result-card--celebration">
      <div class="celebration-rings">
        <div class="c-ring c-ring-1"></div>
        <div class="c-ring c-ring-2"></div>
        <div class="c-ring c-ring-3"></div>
      </div>
      <div class="result-emoji trophy">🏆</div>
      <h1 class="result-title">Birlik tugallandi!</h1>
      <p class="result-subtitle">${unit.label} muvaffaqiyatli yakunlandi</p>

      <div class="xp-burst">
        <span class="xp-burst-num">+${xpEarned + CONFIG.xp.unitComplete}</span>
        <span class="xp-burst-label">XP</span>
      </div>

      <div class="result-stats">
        <div class="result-stat">
          <div class="result-stat-icon">🎯</div>
          <div class="result-stat-value">${accuracy}%</div>
          <div class="result-stat-label">Aniqlik</div>
        </div>
        <div class="result-stat">
          <div class="result-stat-icon">⚡</div>
          <div class="result-stat-value">${stats.xp || 0}</div>
          <div class="result-stat-label">Jami XP</div>
        </div>
      </div>

      <div class="unlock-banner">
        🔓 Keyingi birlik ochildi!
      </div>

      <div class="result-actions">
        <button class="result-btn result-btn--primary result-btn--full" id="result-home">
          🏠 Asosiy menyu
        </button>
      </div>
    </div>
  `;
}

function renderOutOfHearts(unit, correctCount, totalQuestions) {
  return `
    <div class="result-card result-card--fail">
      <div class="result-emoji">💔</div>
      <h1 class="result-title">Yuraklar tugadi</h1>
      <p class="result-subtitle">
        ${correctCount}/${totalQuestions} savol to'g'ri javoblandi
      </p>
      <p class="result-hint">Qaytadan urinib ko'ring!</p>

      <div class="result-actions">
        <button class="result-btn result-btn--secondary" id="result-home">🏠 Asosiy</button>
        <button class="result-btn result-btn--primary" id="result-retry">🔄 Qayta</button>
      </div>
    </div>
  `;
}

function launchConfetti() {
  const canvas = document.createElement('canvas');
  canvas.id = 'confetti-canvas';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const COLORS = ['#f94144','#f3722c','#f8961e','#f9c74f','#90be6d','#43aa8b','#577590','#a855f7'];
  const particles = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: -20,
    r: Math.random() * 8 + 4,
    d: Math.random() * 2 + 1,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    tilt: Math.random() * 10 - 5,
    tiltSpeed: Math.random() * 0.1 + 0.05,
    angle: 0,
  }));

  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.angle += p.tiltSpeed;
      p.tilt = Math.sin(p.angle) * 12;
      p.y += p.d;
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x + p.tilt, p.y, p.r, p.r * 2);
    });
    frame++;
    if (frame < 200) requestAnimationFrame(draw);
    else canvas.remove();
  }
  requestAnimationFrame(draw);
}
