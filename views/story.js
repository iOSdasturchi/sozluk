// ============================================================
// views/story.js — Story reading and TTS screen
// ============================================================

import { getStoryForUnit } from '../data/stories.js';
import { navigate } from '../js/router.js';
import { speak, pauseSpeech, resumeSpeech, cancelSpeech } from '../js/exercise.js';

export function renderStory(container, { level, unitId, unit }) {
  const story = getStoryForUnit(level, unitId);
  
  if (!story) {
    container.innerHTML = `
      <div class="story-screen" style="padding:20px;text-align:center;">
        <p>Bu unit uchun hikoya hali kiritilmagan.</p>
        <button class="btn btn-primary" id="story-back" style="margin-top:20px">Orqaga</button>
      </div>
    `;
    container.querySelector('#story-back').addEventListener('click', () => navigate('#unit', { unit, level }));
    return;
  }

  // Parse text for [word|translation]
  // We'll replace it with a span that has data attributes
  const rawText = story.text.replace(/\n/g, '<br><br>');
  const htmlText = rawText.replace(/\[([^|]+)\|([^\]]+)\]/g, (match, word, translation) => {
    return `<span class="story-word" data-trans="${translation}">${word}</span>`;
  });

  // Plain text for TTS (remove brackets and translations)
  const plainTextForSpeech = story.text.replace(/\[([^|]+)\|([^\]]+)\]/g, '$1');

  container.innerHTML = `
    <div class="story-screen">
      <!-- Top bar -->
      <header class="unit-header">
        <button class="back-btn" id="story-back">←</button>
        <div class="unit-header-title">${story.title}</div>
        <div style="width:40px"></div>
      </header>

      <div class="story-content" style="padding: var(--sp-lg);">
        <div class="story-controls" style="margin-bottom: var(--sp-lg); text-align: center; display: flex; gap: 10px; justify-content: center;">
          <button class="btn btn-primary" id="story-play" style="flex: 1; border-radius: var(--r-full); padding: 12px; font-weight: 800; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); box-shadow: var(--shadow-glow-blue);">
            <span class="icon">▶️</span> <span class="btn-text">Tinglash</span>
          </button>
        </div>
        
        <div class="story-text" id="story-text" style="position: relative; line-height: 1.8; font-size: 18px; color: var(--text);">
          ${htmlText}
          <!-- Tooltip for translation -->
          <div id="story-tooltip" class="story-tooltip" style="display:none;"></div>
        </div>
      </div>
      
      <div style="height:90px"></div>
    </div>
  `;

  // Events
  container.querySelector('#story-back').addEventListener('click', () => {
    cancelSpeech();
    navigate('#unit', { unit, level });
  });

  let playState = 'idle'; // idle | playing | paused
  const playBtn = container.querySelector('#story-play');
  const playIcon = playBtn.querySelector('.icon');
  const playText = playBtn.querySelector('.btn-text');

  playBtn.addEventListener('click', () => {
    if (playState === 'idle') {
      speak(plainTextForSpeech);
      playState = 'playing';
      playIcon.textContent = '⏸️';
      playText.textContent = 'To\'xtatish';
      playBtn.style.background = 'linear-gradient(135deg, var(--warning), var(--warning-dark))';
      playBtn.style.boxShadow = '0 4px 15px rgba(255, 200, 0, 0.4)';
    } else if (playState === 'playing') {
      pauseSpeech();
      playState = 'paused';
      playIcon.textContent = '▶️';
      playText.textContent = 'Davom etish';
      playBtn.style.background = 'linear-gradient(135deg, var(--success), var(--success-dark))';
      playBtn.style.boxShadow = '0 4px 15px rgba(88, 204, 2, 0.4)';
    } else if (playState === 'paused') {
      resumeSpeech();
      playState = 'playing';
      playIcon.textContent = '⏸️';
      playText.textContent = 'To\'xtatish';
      playBtn.style.background = 'linear-gradient(135deg, var(--warning), var(--warning-dark))';
      playBtn.style.boxShadow = '0 4px 15px rgba(255, 200, 0, 0.4)';
    }
  });

  // Reset UI when speech ends naturally (using an interval since onend is buggy on some browsers)
  const speechCheck = setInterval(() => {
    if (playState !== 'idle' && window.speechSynthesis && !window.speechSynthesis.speaking) {
      playState = 'idle';
      playIcon.textContent = '▶️';
      playText.textContent = 'Tinglash';
      playBtn.style.background = 'linear-gradient(135deg, var(--primary), var(--primary-dark))';
      playBtn.style.boxShadow = 'var(--shadow-glow-blue)';
    }
  }, 1000);
  
  // Clear interval on unmount
  const observer = new MutationObserver(() => {
    if (!document.contains(playBtn)) {
      clearInterval(speechCheck);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Clickable words
  const tooltip = container.querySelector('#story-tooltip');
  const storyText = container.querySelector('#story-text');
  
  container.querySelectorAll('.story-word').forEach(wordEl => {
    wordEl.addEventListener('click', (e) => {
      // Clear active classes
      container.querySelectorAll('.story-word.active').forEach(el => el.classList.remove('active'));
      
      const trans = wordEl.dataset.trans;
      wordEl.classList.add('active');
      
      // Position tooltip near the word
      const rect = wordEl.getBoundingClientRect();
      const parentRect = storyText.getBoundingClientRect();
      
      tooltip.textContent = trans;
      tooltip.style.display = 'block';
      
      // Basic positioning relative to storyText
      const topPos = wordEl.offsetTop - 35;
      const leftPos = wordEl.offsetLeft + (wordEl.offsetWidth / 2) - (tooltip.offsetWidth / 2);
      
      tooltip.style.top = topPos + 'px';
      // clamp left position
      tooltip.style.left = Math.max(0, leftPos) + 'px';
      
      e.stopPropagation(); // prevent document click from hiding it immediately
    });
  });

  // Hide tooltip when clicking elsewhere
  document.addEventListener('click', (e) => {
    if (tooltip && !e.target.classList.contains('story-word')) {
      tooltip.style.display = 'none';
      container.querySelectorAll('.story-word.active').forEach(el => el.classList.remove('active'));
    }
  });
}
