// ============================================================
// exercise.js — Exercise Generator
// Generates 5 exercise types from vocabulary data
// ============================================================

import { CONFIG } from './config.js';
import { ALL_VOCAB } from '../data/vocab.js';
import { getVocabProgress, getCurrentBatch, saveCurrentBatch } from './db.js';

// --- Utility ---

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr, n, exclude = []) {
  const pool = arr.filter(x => !exclude.includes(x));
  return shuffle(pool).slice(0, n);
}

// Get distractors for a given vocab item (from same level & unit first, then broader)
function getDistractors(item, field, count) {
  // Same level, same unit first
  const pool = ALL_VOCAB.filter(v =>
    v[field] !== item[field] &&
    v.level === item.level &&
    v.unitId === item.unitId
  );
  let picks = pickRandom(pool, count);
  // Fill from same level, different unit
  if (picks.length < count) {
    const extra = ALL_VOCAB.filter(v =>
      v[field] !== item[field] &&
      v.level === item.level &&
      !picks.some(p => p[field] === v[field])
    );
    picks = [...picks, ...pickRandom(extra, count - picks.length)];
  }
  return picks.slice(0, count);
}

// ---- Exercise Builders ----

/**
 * Type 1: Multiple Choice — Turkish → pick Uzbek
 */
export function buildMultipleChoice(item) {
  const distractors = getDistractors(item, 'uzbek', CONFIG.lesson.distractorCount);
  const options = shuffle([
    { text: item.uzbek, correct: true },
    ...distractors.map(d => ({ text: d.uzbek, correct: false }))
  ]);
  return {
    type: 'multiple-choice',
    prompt: item.turkish,
    promptLabel: "Bu so'zning o'zbek ma'nosi nima?",
    options,
    item,
  };
}

/**
 * Type 2: Reverse Multiple Choice — Uzbek → pick Turkish
 */
export function buildReverseChoice(item) {
  const distractors = getDistractors(item, 'turkish', CONFIG.lesson.distractorCount);
  const options = shuffle([
    { text: item.turkish, correct: true },
    ...distractors.map(d => ({ text: d.turkish, correct: false }))
  ]);
  return {
    type: 'reverse-choice',
    prompt: item.uzbek,
    promptLabel: "Bu so'z turkchada qanday aytiladi?",
    options,
    item,
  };
}

/**
 * Type 3: Translation (Tile-based) — Uzbek shown, pick Turkish from word tiles
 */
export function buildTranslation(item) {
  // For now: show Uzbek, user picks correct Turkish from 4 options
  // (same UI as MC but framed as translation)
  const distractors = getDistractors(item, 'turkish', CONFIG.lesson.distractorCount);
  const options = shuffle([
    { text: item.turkish, correct: true },
    ...distractors.map(d => ({ text: d.turkish, correct: false }))
  ]);
  return {
    type: 'translation',
    prompt: item.uzbek,
    promptLabel: "Turkchaga tarjima qiling:",
    options,
    item,
  };
}

/**
 * Type 4: Word Ordering — Rearrange shuffled letters/tiles
 * For simplicity: show jumbled letters of the Turkish word, user types answer
 */
export function buildWordOrdering(item) {
  // Split turkish word into tiles (by space for phrases, by char for single words)
  const words = item.turkish.split(' ');
  const tiles = shuffle(words);
  return {
    type: 'word-ordering',
    prompt: item.uzbek,
    promptLabel: "So'zlarni to'g'ri tartibga soling:",
    tiles,
    answer: item.turkish,
    item,
  };
}

/**
 * Type 5: Listening — TTS plays Turkish, pick correct word
 */
export function buildListening(item) {
  const distractors = getDistractors(item, 'turkish', CONFIG.lesson.distractorCount);
  const options = shuffle([
    { text: item.turkish, correct: true },
    ...distractors.map(d => ({ text: d.turkish, correct: false }))
  ]);
  return {
    type: 'listening',
    audioText: item.turkish,
    promptLabel: "Eshitgan so'zni tanlang:",
    options,
    item,
  };
}

// ---- Exercise Type Selector ----

const EXERCISE_BUILDERS = [
  buildMultipleChoice,
  buildReverseChoice,
  buildTranslation,
  buildWordOrdering,
  buildListening,
];

export function buildExercise(item, preferredType = null) {
  if (preferredType !== null && EXERCISE_BUILDERS[preferredType]) {
    return EXERCISE_BUILDERS[preferredType](item);
  }
  // Pick random type weighted toward MC for beginners
  const idx = Math.floor(Math.random() * EXERCISE_BUILDERS.length);
  return EXERCISE_BUILDERS[idx](item);
}

// ---- Lesson Builder ----

/**
 * Build a queue of exercises for a lesson.
 * @param {Array} vocabItems - subset of vocab for this lesson
 * @param {string} mode - 'learn' | 'practice' | 'challenge' | 'review' | 'listening'
 * @param {number} count - number of exercises
 */
export function buildLesson(vocabItems, mode = 'learn', count = 10) {
  if (vocabItems.length === 0) return [];
  const unitId = vocabItems[0].unitId;
  const level = vocabItems[0].level;
  
  let items = [];
  
  // Strict Batch Logic
  const currentBatch = getCurrentBatch();
  
  if (currentBatch && currentBatch.unitId === unitId && currentBatch.items && currentBatch.items.length > 0) {
    // Re-hydrate the full objects since DB might only store keys or partial objects, but let's assume we just store the raw array for simplicity,
    // or better, map them back to full items if they were saved cleanly.
    // To be safe, let's map by itemNumber if they match.
    const batchNumbers = currentBatch.items.map(i => i.itemNumber);
    items = vocabItems.filter(v => batchNumbers.includes(v.itemNumber));
  } else {
    // Generate a NEW batch of 10 unseen/learning words
    const vp = getVocabProgress();
    const sorted = [...vocabItems].sort((a, b) => {
      const pA = vp[`${a.level}-${a.unitId}-${a.itemNumber}`];
      const pB = vp[`${b.level}-${b.unitId}-${b.itemNumber}`];
      // Sort by mastery (0 first), then status
      const scoreA = pA ? (pA.status === 'mastered' ? 10 : (pA.mastery || 0)) : 0;
      const scoreB = pB ? (pB.status === 'mastered' ? 10 : (pB.mastery || 0)) : 0;
      if (scoreA !== scoreB) return scoreA - scoreB;
      return a.itemNumber - b.itemNumber; // keep sequential order for new words
    });
    items = sorted.slice(0, count);
    saveCurrentBatch({ unitId, items });
  }

  // Optionally shuffle for non-learn modes, but keep exactly these items
  if (mode !== 'learn') {
    items = shuffle(items);
  }

  let exercises = [];

  if (mode === 'learn') {
    // Start with MC then mix
    items.forEach((item, i) => {
      if (i < 3) exercises.push(buildMultipleChoice(item));
      else exercises.push(buildExercise(item));
    });
  } else if (mode === 'listening') {
    items.forEach(item => exercises.push(buildListening(item)));
  } else if (mode === 'challenge') {
    // All types
    items.forEach((item, i) => {
      exercises.push(EXERCISE_BUILDERS[i % EXERCISE_BUILDERS.length](item));
    });
  } else {
    items.forEach(item => exercises.push(buildExercise(item)));
  }

  // Ensure we have enough exercises if the batch is smaller than count, though it shouldn't happen often
  while (exercises.length < count && items.length > 0) {
    const extra = shuffle(items)[0];
    exercises.push(buildExercise(extra));
  }

  return exercises.slice(0, count);
}

// ---- TTS — Improved Turkish pronunciation ----

// Cache the best Turkish voice
let _trVoice = null;
let _voicesLoaded = false;

function loadVoices() {
  return new Promise(resolve => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) { resolve(voices); return; }
    speechSynthesis.onvoiceschanged = () => resolve(speechSynthesis.getVoices());
    // Fallback timeout
    setTimeout(() => resolve(speechSynthesis.getVoices()), 1000);
  });
}

async function getBestTurkishVoice() {
  if (_trVoice) return _trVoice;
  const voices = await loadVoices();

  // Priority list: prefer high-quality online voices, then local ones.
  // Prefer Male if possible for clearer enunciation as requested.
  const priority = [
    v => v.lang === 'tr-TR' && !v.localService && v.name.toLowerCase().includes('male'),
    v => v.lang === 'tr-TR' && !v.localService,  // Online/cloud TTS (best quality)
    v => v.lang === 'tr-TR' && v.name.toLowerCase().includes('male'),
    v => v.lang === 'tr-TR',                      // Any Turkish
    v => v.lang.startsWith('tr'),                 // Turkish variant
  ];

  for (const test of priority) {
    const match = voices.find(test);
    if (match) { _trVoice = match; break; }
  }

  return _trVoice;
}

export async function speak(text, lang = 'tr-TR') {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;

  // Try to get the best voice
  const voice = await getBestTurkishVoice();
  if (voice) utter.voice = voice;

  // Tuned for clear, normal CEFR-speed Turkish pronunciation
  utter.rate   = 0.95;   // Normal speed, clear
  utter.pitch  = 1.0;
  utter.volume = 1.0;

  // Small delay to ensure cancel takes effect
  setTimeout(() => window.speechSynthesis.speak(utter), 50);
}

export function pauseSpeech() {
  if (window.speechSynthesis) window.speechSynthesis.pause();
}

export function resumeSpeech() {
  if (window.speechSynthesis) window.speechSynthesis.resume();
}

export function cancelSpeech() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

// Pre-warm voice loading on first import
if (window.speechSynthesis) {
  getBestTurkishVoice();
}
