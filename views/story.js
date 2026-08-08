// ============================================================
// views/story.js — Story reading and TTS screen
// ============================================================

import { getStoryForUnit } from '../data/stories.js';
import { navigate } from '../js/router.js';
import { speak } from '../js/exercise.js';

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
        <div class="story-controls" style="margin-bottom: var(--sp-lg); text-align: center;">
          <button class="btn btn-primary" id="story-play" style="width:100%; border-radius: var(--r-full); padding: 12px; font-weight: 800;">
            <span class="icon">🔊</span> Hikoyani Tinglash
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
    if(window.speechSynthesis) window.speechSynthesis.cancel();
    navigate('#unit', { unit, level });
  });

  container.querySelector('#story-play').addEventListener('click', () => {
    speak(plainTextForSpeech);
  });

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
