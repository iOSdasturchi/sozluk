// ============================================================
// config.js — All gamification values in one place
// Edit here to change game balance without touching other code
// ============================================================

export const CONFIG = {
  // XP values
  xp: {
    correctAnswer:   5,
    lessonComplete:  20,
    unitComplete:    50,
    dailyGoalBonus:  30,
    reviewCorrect:   3,
  },

  // Hearts
  hearts: {
    max:          5,
    refillHours:  4,   // hours until one heart refills (future feature)
  },

  // Daily goal
  daily: {
    xpTarget: 50,       // XP needed to complete daily goal
  },

  // Streak
  streak: {
    graceHours: 28,     // hours after midnight before streak breaks (grace period)
  },

  // Lesson settings
  lesson: {
    questionsPerLesson:  10,   // questions per Learn/Practice session
    challengeQuestions:  20,   // questions in Unit Challenge
    newWordsPerLesson:   5,    // new words introduced per Learn session
    distractorCount:     3,    // wrong options in multiple choice (total 4)
  },

  // SRS intervals (days)
  srs: {
    // After each consecutive correct review, next interval (days)
    intervals: [1, 3, 7, 14, 30, 90],
    failPenalty: 0,   // reset to interval index 0 on fail
  },

  // Levels (only A1 active initially)
  levels: ['A1', 'A2', 'B1', 'B2'],
  activeLevel: 'A1',
};
