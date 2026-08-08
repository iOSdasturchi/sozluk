# Turkish Learning App — A1 Duolingo-Style Skill

## Purpose

Build a modern, gamified Turkish vocabulary learning web application inspired by the learning experience and progression model of Duolingo.

The application will eventually support:

- A1
- A2
- B1
- B2

However, **the current implementation must focus ONLY on A1**.

The A1 vocabulary content is provided as a PDF file located in the user's **Downloads** folder.

The PDF is the **single source of truth for A1 vocabulary data**.

---

# CRITICAL REQUIREMENT — PDF DATA COMPLETENESS

This is the most important requirement of this skill.

The agent MUST locate the A1 PDF in the user's Downloads folder and extract its content completely.

## ZERO DATA LOSS POLICY

**Not a single vocabulary word, phrase, unit, translation, or relevant piece of vocabulary information from the PDF may be omitted.**

The agent must NOT:

- import only the first pages;
- import only selected units;
- manually choose vocabulary;
- summarize vocabulary;
- remove difficult words;
- skip duplicate-looking words without verification;
- invent replacement vocabulary;
- silently ignore parsing failures.

Every vocabulary item in the PDF must be represented in the application's structured data.

---

# PDF IMPORT PIPELINE

The required pipeline is:

```text
PDF
 ↓
PDF Discovery
 ↓
PDF Extraction
 ↓
Structure Detection
 ↓
Vocabulary Parsing
 ↓
Normalization
 ↓
Validation
 ↓
Database Import
 ↓
Post-import Validation
```

Do NOT skip validation.

---

# STEP 1 — FIND THE PDF

Search the user's Downloads folder for the A1 PDF.

If multiple PDFs exist:

1. Inspect filenames.
2. Inspect PDF metadata/content if necessary.
3. Identify the Turkish A1 vocabulary PDF.
4. Do not arbitrarily choose a file if the correct file cannot be determined.

If the PDF cannot be found, stop the data-import phase and report the exact problem.

---

# STEP 2 — EXTRACT THE PDF

Extract the entire PDF.

The agent must determine:

- total page count;
- all units;
- all vocabulary items;
- Turkish words;
- Uzbek translations;
- phrases;
- expressions;
- examples;
- notes;
- synonyms or explanations if present.

If the PDF contains tables, columns, headers, or structured vocabulary lists, preserve their logical structure.

Do not assume that visual order equals extraction order.

---

# STEP 3 — HANDLE EXTRACTION ERRORS

PDF extraction may produce:

- broken words;
- missing characters;
- incorrect column order;
- duplicated text;
- headers mixed with vocabulary;
- page numbers mixed with vocabulary;
- Turkish characters incorrectly decoded.

The agent must detect suspicious extraction results.

Pay particular attention to Turkish characters:

```text
ç
ğ
ı
İ
ö
ş
ü
```

They must be preserved correctly.

If the first extraction method produces suspicious results, use another extraction/processing method where possible and compare the results.

---

# STEP 4 — IDENTIFY UNITS

Detect every A1 Unit in the PDF.

Create structured relationships:

```text
A1
 ├── Unit 1
 │    ├── Vocabulary
 │    └── ...
 ├── Unit 2
 │    ├── Vocabulary
 │    └── ...
 ├── Unit 3
 │    └── ...
 └── ...
```

Do not hardcode the number of units.

The number of units must come from the actual PDF.

---

# STEP 5 — STRUCTURED VOCABULARY DATA

Each vocabulary item should have a stable structured representation.

Example:

```json
{
  "level": "A1",
  "unitId": "unit-01",
  "turkish": "merhaba",
  "uzbek": "salom",
  "phrase": null,
  "example": null,
  "source": "a1-pdf"
}
```

If the PDF contains additional information, preserve it.

Do not discard useful source information merely because the current UI does not use it.

---

# STEP 6 — DATA VALIDATION

Before considering the import complete, perform validation.

At minimum validate:

### Units

```text
PDF Unit count
=
Imported Unit count
```

### Vocabulary

```text
PDF vocabulary count
=
Imported vocabulary count
```

### Missing items

```text
Missing = 0
```

### Unexpected items

```text
Unexpected = 0
```

### Unresolved extraction items

```text
Unresolved = 0
```

### Duplicates

Duplicates must be investigated.

Do not automatically delete duplicates.

A word appearing twice may intentionally belong to different Units or contexts.

---

# REQUIRED VALIDATION REPORT

Generate a report similar to:

```text
=====================================
A1 PDF IMPORT VALIDATION
=====================================

Source:
Downloads/<A1 PDF>

PDF pages:
XX

Units detected:
XX

Vocabulary items detected:
XXX

Vocabulary items imported:
XXX

Missing:
0

Unexpected:
0

Unresolved:
0

Potential duplicates:
0

Turkish character errors:
0

=====================================
STATUS: PASS
=====================================
```

If any important value is not zero:

```text
STATUS: FAIL
```

The agent must NOT claim the import is complete when validation fails.

---

# SOURCE OF TRUTH

For A1 vocabulary:

```text
PDF = Source of Truth
```

Do not replace PDF data with AI-generated vocabulary.

Do not invent vocabulary.

Do not add random vocabulary merely to make the app look more complete.

Additional AI-generated content may be introduced later, but the original PDF vocabulary must remain intact.

---

# APPLICATION CONCEPT

The application should feel like a dedicated Turkish-learning game.

Core philosophy:

```text
Learn
 ↓
Practice
 ↓
Make mistakes
 ↓
Review
 ↓
Master
 ↓
Unlock
```

The experience should be inspired by Duolingo's:

- learning path;
- short lessons;
- XP;
- streak;
- hearts;
- progression;
- gamification;
- unit completion;
- review system.

However, do NOT copy Duolingo's:

- logo;
- branding;
- copyrighted assets;
- exact visual design;
- proprietary content.

Create an original Turkish-learning identity.

---

# LEARNING PATH

The main screen should present a visual progression path.

Example:

```text
🇹🇷 TÜRKÇE

A1

        🟢
        │
     UNIT 1
        │
        🟢
        │
     UNIT 2
        │
        🔒
        │
     UNIT 3
        │
        🔒
        │
     UNIT 4
```

Completed Units should visually indicate completion.

Locked Units should not be accessible until their prerequisites are completed.

---

# UNIT STRUCTURE

Each Unit should contain multiple short learning activities.

Example:

```text
UNIT 1

📚 Learn
🎯 Practice
🎧 Listening
🧩 Sentence Builder
✍️ Writing
🏆 Unit Challenge
```

The exact number of lessons should be generated based on the vocabulary content available in that Unit.

Do not arbitrarily discard vocabulary because a Unit contains many words.

---

# LESSON ENGINE

Lessons should be short and interactive.

Possible exercise types:

## Multiple Choice

```text
merhaba

Bu ne demek?

○ Rahmat
● Salom
○ Xayr
○ Iltimos
```

## Listening

```text
🔊 Merhaba

Eshitgan so‘zingizni tanlang.

○ merhaba
○ merdiven
○ market
```

## Word Ordering

```text
Ben / Ahmet'im
```

User rearranges words into the correct sentence.

## Translation

```text
Salom

[ merhaba ]
```

## Fill in the Blank

```text
_____, nasılsın?
```

Exercise generation must use the imported vocabulary.

---

# VOCABULARY CARD

Every vocabulary item should have a detail view.

Example:

```text
🇹🇷 merhaba

🔊 Audio

🇺🇿 salom

Example:
...
```

If an example exists in the PDF, preserve it.

Do not replace original PDF information.

---

# SPACED REPETITION

Implement a review/memory system.

Vocabulary states can be:

```text
NEW
 ↓
LEARNING
 ↓
FAMILIAR
 ↓
STRONG
 ↓
MASTERED
```

Incorrectly answered vocabulary should return sooner.

Correctly mastered vocabulary should return less frequently.

The architecture must allow a future implementation of FSRS or another spaced-repetition algorithm.

Do not hardcode review intervals throughout the UI.

Review logic should be isolated in its own module/service.

---

# HEART SYSTEM

Lessons should have a heart system.

Example:

```text
❤️ ❤️ ❤️ ❤️ ❤️
```

Incorrect answers reduce hearts.

When hearts reach zero, show an appropriate review/retry state.

The number of hearts must be configurable.

---

# XP SYSTEM

Award XP for learning activity.

Example:

```text
Correct answer: +5 XP
Lesson completed: +20 XP
Unit completed: +50 XP
Daily goal completed: +30 XP
```

These values must be configurable rather than scattered throughout the codebase.

---

# DAILY GOAL

Display daily progress:

```text
Today's Goal

████████░░ 80%

40 / 50 XP
```

The user should be able to complete a daily learning target.

---

# STREAK

Implement a daily streak.

Example:

```text
🔥 7 day streak
```

Completing a lesson on a qualifying day increases the streak.

The streak system should be isolated so that its rules can be changed later.

---

# PROGRESS

Display real progress based on database state.

Example:

```text
A1 Progress

████████░░ 82%

Words learned
348 / 487

Mastered
215

Learning
83

New
50
```

Do not use hardcoded numbers.

---

# REVIEW

Create a dedicated Review experience.

Example:

```text
🔁 Review

Today's Review
23 words

[ START REVIEW ]
```

Prioritize:

1. overdue vocabulary;
2. frequently incorrect vocabulary;
3. weak vocabulary;
4. new vocabulary when appropriate.

---

# UNIT CHALLENGE

Each Unit should end with a final challenge.

Example:

```text
🏆 UNIT CHALLENGE

Vocabulary
Listening
Translation
Sentence
Writing
```

When the user reaches the required score:

```text
🎉 UNIT COMPLETE

+50 XP

🏆 Unit Mastered
```

The next Unit becomes unlocked.

---

# DATA ARCHITECTURE

The application must be designed for future A2/B1/B2 expansion.

Recommended conceptual structure:

```text
Level
 └── Unit
      └── Vocabulary
           ├── Turkish
           ├── Uzbek
           ├── Example
           ├── Audio
           ├── Source
           └── Mastery
```

Levels:

```text
A1
A2
B1
B2
```

Currently only:

```text
A1
```

should be enabled.

Adding A2/B1/B2 later must NOT require rewriting the core application architecture.

---

# USER PROGRESS DATA

Separate source vocabulary from user progress.

Conceptually:

```text
Vocabulary
     ↓
UserVocabularyProgress
```

Do not mutate the original PDF vocabulary when the user answers questions.

User-specific fields should include things such as:

```text
status
mastery
correctCount
incorrectCount
lastReviewedAt
nextReviewAt
```

This allows multiple users to learn the same vocabulary independently.

---

# PDF SOURCE TRACEABILITY

Every imported vocabulary item should retain enough information to trace it back to the PDF.

For example:

```json
{
  "source": "a1-pdf",
  "sourcePage": 12,
  "sourceUnit": "Unit 3"
}
```

This makes debugging and validation easier.

---

# ERROR HANDLING

Never silently ignore errors.

If:

- PDF is missing;
- PDF cannot be read;
- Unit cannot be detected;
- vocabulary parsing fails;
- Turkish characters are corrupted;
- vocabulary count does not match;
- some pages cannot be processed;

report the issue clearly.

Example:

```text
❌ A1 IMPORT INCOMPLETE

Expected:
487

Imported:
481

Missing:
6

Status:
FAIL
```

Do not mark the project complete until the problem is resolved.

---

# UI REQUIREMENTS

The interface should be:

- modern;
- clean;
- friendly;
- mobile-first;
- responsive;
- gamified;
- accessible;
- easy to understand;
- visually rewarding.

Use:

- rounded cards;
- progress indicators;
- icons;
- subtle animations;
- clear typography;
- visual feedback for correct/incorrect answers;
- completion animations.

Avoid excessive animation that slows learning.

---

# MOBILE FIRST

The primary usage environment is mobile.

The app must work well on:

- iPhone;
- Android;
- tablet;
- desktop.

Responsive behavior must be intentional, not merely stretched desktop UI.

---

# COMPONENTIZATION

Keep the application modular.

Conceptual modules:

```text
PDF Import
Data Validation
Vocabulary
Levels
Units
Lessons
Exercise Engine
Spaced Repetition
User Progress
XP
Hearts
Streak
Daily Goal
Review
Unit Challenge
```

Exercise types should be extensible.

Adding a new exercise type should not require rewriting the entire lesson engine.

---

# EXERCISE GENERATION

Exercises should be generated from structured vocabulary data.

For example:

```text
Vocabulary
     ↓
Exercise Generator
     ├── Multiple Choice
     ├── Translation
     ├── Listening
     ├── Fill Blank
     ├── Word Ordering
     └── Writing
```

Avoid manually creating every exercise.

The same architecture should support future A2/B1/B2 vocabulary.

---

# IMPORTANT: NO MOCK DATA IN FINAL A1

During development, temporary mock data may be used only if necessary.

Before the application is considered complete:

**Remove or isolate mock data.**

The A1 learning path must use the real vocabulary imported from the PDF.

---

# FINAL ACCEPTANCE CRITERIA

The implementation is complete only when ALL of the following are true:

## PDF

- [ ] A1 PDF found in Downloads
- [ ] Entire PDF processed
- [ ] Every Unit detected
- [ ] Every vocabulary item extracted
- [ ] Turkish characters preserved
- [ ] No important vocabulary information lost
- [ ] Source page information preserved where possible

## Validation

- [ ] Expected vocabulary count calculated
- [ ] Imported vocabulary count calculated
- [ ] Missing = 0
- [ ] Unexpected = 0
- [ ] Unresolved = 0
- [ ] Extraction errors resolved
- [ ] Validation PASS

## Application

- [ ] Home screen
- [ ] A1 learning path
- [ ] Unit screen
- [ ] Lesson engine
- [ ] Multiple choice
- [ ] Listening structure
- [ ] Translation
- [ ] Word ordering
- [ ] Writing
- [ ] XP
- [ ] Hearts
- [ ] Streak
- [ ] Daily goal
- [ ] Progress
- [ ] Review
- [ ] Unit Challenge
- [ ] Unit unlock system

## Architecture

- [ ] A2 can be added later
- [ ] B1 can be added later
- [ ] B2 can be added later
- [ ] Vocabulary is separated from user progress
- [ ] Exercise engine is extensible
- [ ] Review logic is modular
- [ ] Gamification values are configurable
- [ ] PDF data remains traceable

---

# DEVELOPMENT ORDER

Follow this order:

```text
1. Find A1 PDF
        ↓
2. Analyze PDF
        ↓
3. Extract ALL content
        ↓
4. Build structured vocabulary data
        ↓
5. Validate against PDF
        ↓
6. Import into database
        ↓
7. Validate database again
        ↓
8. Build data layer
        ↓
9. Build exercise engine
        ↓
10. Build lesson UI
        ↓
11. Build learning path
        ↓
12. Add XP / Hearts / Streak
        ↓
13. Add Review
        ↓
14. Add Unit Challenge
        ↓
15. Test entire A1 flow
        ↓
16. Run final PDF-to-database completeness validation
```

**Do not start by building a beautiful UI with fake data while ignoring the PDF import.**

The A1 PDF data must be correctly imported and validated first.

---

# FINAL PRODUCT VISION

The final product should feel like:

> **A Turkish language learning game built around the user's A1–B2 vocabulary curriculum.**

The user should feel:

```text
I learn
 ↓
I play
 ↓
I earn XP
 ↓
I maintain my streak
 ↓
I unlock Units
 ↓
I review weak words
 ↓
I master A1
 ↓
A2 unlocks
 ↓
B1 unlocks
 ↓
B2 unlocks
```

The long-term goal is a complete:

**A1 → A2 → B1 → B2 Turkish learning platform**

with vocabulary-driven lessons, gamification, spaced repetition, listening, writing, and future AI-powered speaking/conversation features.
