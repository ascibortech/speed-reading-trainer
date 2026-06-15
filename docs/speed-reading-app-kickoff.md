# Speed Reading Trainer — Project Kickoff Document

**Project:** Web-based Speed Reading Learning Path Application
**Document type:** Kickoff note / source of truth
**Status:** Pre-architecture — requirements locked, ready for technical design
**Date:** 15 June 2026

---

## 1. Vision & Core Concept

A frontend-heavy web application that teaches speed reading through interactive,
incremental lessons. The defining feature: **the user brings their own text.**
Lessons run on whatever content the user uploads, making every exercise personal
and relevant.

The app combines:
- **Session-based lessons** — individual exercises run on user-supplied text
- **Long-term progress tracking** — an exam path that benchmarks reading speed
  over time, independent of any single lesson

The user can take a baseline assessment, train through lessons, then re-take the
assessment weeks later to see measurable improvement.

---

## 2. Foundational Principles (Non-Negotiable)

### 2.1 Privacy & legal posture — "we never touch the text"
- The user uploads text **client-side only**. It lives in browser memory for the
  duration of the session and is then discarded.
- The text is **never** sent to, processed by, or stored on any server.
- We store **metadata only**: word counts, durations, calculated reading speed,
  comprehension scores, exercise parameters.
- Rationale: the uploaded content (books, articles) may be copyrighted. By never
  ingesting, transmitting, or persisting it, we stay completely clear of
  intellectual-property and data-protection exposure. The client's machine
  processes the client's own legally-obtained material for a personal exercise.

### 2.2 Simplicity over security
- No sensitive personal data is collected, so there is nothing to secure.
- Authentication is deliberately minimal:
  - **Unique username** (NOT an email address)
  - **Simple password**
  - Purpose is only to separate users from one another, not to protect secrets.
- No payments, no email, no PII → **no GDPR scope.**

### 2.3 Incrementality
- Each exercise is built as an **independent, self-contained module.**
- Architecture must support a **plugin / registry pattern**: ship exercise #1
  fully working and useful, then add exercise #2 without refactoring the core.
- New exercises "appear" in the app by registration, not by rewiring.

---

## 3. Architecture Constraints (Summary — full design TBD)

| Concern | Decision |
|---|---|
| App type | Frontend-heavy web application (SPA) |
| Backend | Minimal — a small key-value store for user data + a dumb auth/session endpoint |
| Text handling | 100% client-side; never persisted server-side |
| Storage (server) | Username, password, and per-user session **metadata** only |
| Storage (client) | Uploaded text held transiently in browser memory during session |
| Auth | Username (non-email) + simple password → session token |
| Exercise model | Plugin/registry architecture; each exercise independently deployable |
| Scaling priority | Simplicity > security (nothing sensitive to protect) |

---

## 4. Supported Input Formats

The client must parse and normalize text from multiple formats on upload:
- Plain text (`.txt`)
- PDF (`.pdf`)
- Word (`.docx`)
- EPUB (`.epub`)
- Mobi (`.mobi`)

A **client-side document parsing layer** extracts and normalizes text, feeds it
to the exercise engine for that session, then discards it. The exercise engine
itself is **content-source agnostic** — it operates on normalized text regardless
of original format.

---

## 5. Speed Reading — Pedagogical Framework

Speed reading rests on **four core pillars**, each addressed by specific exercises:

1. **Eye-movement control** — reduce regression (backtracking), enforce steady pacing
2. **Visual-span expansion** — see more words per fixation
3. **Subvocalization reduction** — quiet the inner voice (the ~150–180 WPM bottleneck)
4. **Comprehension measurement** — ensure speed gains don't sacrifice retention

Reference benchmarks:
- Average adult silent reading: ~200–300 WPM at ~60% comprehension
- Subvocalizing ("mental") readers: ~250 WPM
- Auditory readers: ~450 WPM
- Visual readers: ~700 WPM
- College-level target: 350–450 WPM
- Reading **efficiency** = WPM × comprehension rate (effective WPM / ewpm)

---

## 6. Exercise Catalogue (Granular Specifications)

Each exercise below includes the mechanics and the **metadata to capture**. These
specs drive the data model and the architecture — architecture follows from here.

### 6.1 Pointer / Pacer Exercise
- **Mechanic:** A visual pointer guides the eye across each line at a controlled
  pace. Optimal baseline: **1 line per second.** Pointer begins ~2 words in from
  the line start and ends ~2 words before the line end (eyes use peripheral vision
  for the margins).
- **Progression:** Increase pace each page; advanced drills push to ~0.5 sec/line.
- **Capture:** pointer speed (px/ms or lines/sec), fixations per line, regression
  count, words processed, calculated WPM, pointer-adherence score (did the user
  stay within the 2-word margins), duration (typ. 5–15 min).

### 6.2 RSVP (Rapid Serial Visual Presentation)
- **Mechanic:** Words (or small word-groups) flash one at a time at a single fixed
  point, eliminating saccades entirely. Each word aligned on its **Optimal Reading
  Point (ORP)** for consistent visual flow.
- **Parameters:** start at 200–300 WPM; increment in **50–100 WPM** steps once the
  user holds ≥80% comprehension. (Some implementations use finer 10 WPM steps.)
  Minimum word-display floor ~100 ms.
- **Capture:** presentation rate (ms/word), chunk size (words/frame), comprehension
  %, peak WPM reached, pauses/replays, ORP alignment, time-to-comprehension.
- **Note:** RSVP reliably raises *measured* speed; empirical studies show mixed
  retention at extreme rates → always pair with comprehension checks.

### 6.3 Visual-Span Expansion — Schulte Table
- **Mechanic:** A grid of numbers (classic 5×5, values 1–25). User fixates the
  centre and locates numbers in sequence using peripheral vision.
- **Physical constraint:** table fully visible at **35–40 cm** viewing distance.
- **Progression:** start 3×3 → 4×4 → 5×5 and beyond.
- **Capture:** completion time per grid size, fixation point, peripheral catches,
  visual-field spread score, gaze stability (BCEA — bivariate contour elliptical
  area; lower = steadier).

### 6.4 Chunking Exercise
- **Mechanic:** Train the reader to absorb **4–5 words per fixation** instead of
  2–3. Use marked phrase boundaries or vertical indentation; advanced form is
  vertical scanning down a narrow column.
- **Targets:** drop fixations/line from 4–5 down to 1–2.
- **Reference data:** skilled-reader perceptual span ≈ 14–15 chars right of
  fixation, 3–4 left; useful word ID out to ~7–8 chars. Fixation duration ~200–300
  ms (skilled) vs ~400+ ms (beginner).
- **Capture:** fixations per line, saccade amplitude (deg visual angle), regression
  count, words/fixation achieved, WPM, comprehension %.

### 6.5 Subvocalization Reduction
- **Mechanic:** Occupy the phonological loop while reading — silent counting
  ("1-2-3-4"), humming, or light rhythmic tapping — so the speech-motor system
  can't narrate. Goal is *reduction*, not elimination (full elimination is
  impossible and counter-productive to fight).
- **Capture:** technique used, baseline WPM (no technique), WPM with technique
  active, self-reported difficulty (1–10), comprehension maintained (Y/N), speed
  delta.

### 6.6 Comprehension Assessment (attached to passages)
- **Mechanic:** After a reading passage, present **4–6 questions** mixing three
  types for diagnostic depth:
  - **Multiple-choice factual** — surface recall
  - **Cloze (fill-in-the-blank)** — tests syntax & semantics
  - **Inference** — tests inter-sentential / contextual processing
- **Passage design:** baseline ~1,000 words; controlled difficulty via lexical
  complexity, sentence length, conceptual abstraction; ≤10–20% unknown vocabulary.
- **Capture:** per-question response, correctness, response time/question,
  total comprehension %.

---

## 7. The Exam Path (Long-Term Progress Tracking)

A distinct, repeatable benchmark separate from training lessons.

- **Baseline run:** user reads 3 passages of equal difficulty at natural speed
  (no technique) → record baseline WPM + comprehension %.
- **Re-test cadence:** repeat the *identical* exam path every **4–6 weeks** after
  training to chart improvement.
- **Capture:** baseline date, baseline WPM, baseline comprehension %, passage
  difficulty metadata; each subsequent run stores the same so the system can plot
  a progress trajectory (speed × comprehension over time).

---

## 8. Optional: Eye-Tracking Layer (future)

If/when webcam eye-tracking is added, capture:
- Fixation duration (ms) — fixation = stable gaze ≥ ~100 ms
- Saccade amplitude (deg), peak velocity (deg/sec)
- Regression count per line
- Gaze stability (BCEA)
- **Sampling:** ≥60 Hz minimum; 120 Hz preferred for reliable fast-saccade detection.

This is explicitly a later increment — the plugin architecture should leave room
for it without requiring it.

---

## 9. Data Model — What We Store vs. What We Never Store

### NEVER stored
- Uploaded text content (any format)
- Email, real name, or any PII
- Payment data

### Stored (metadata only)
**User record**
- `username` (unique, non-email)
- `password` (simple)
- session token

**Per-session metadata**
- exercise type + difficulty level
- duration (sec)
- words processed
- calculated reading speed (WPM)
- comprehension % (where applicable)
- exercise-specific params (pointer speed, RSVP rate, grid size, chunk size, etc.)
- regression / fixation counts (where measured)
- timestamp

**Progress / exam record**
- baseline WPM, baseline comprehension %, baseline date
- each re-test: WPM, comprehension %, date, passage difficulty
- aggregate trajectory

The session metadata rolls up into a per-user progress profile.

---

## 10. Learning Path Progression

| Stage | Focus | Exercises |
|---|---|---|
| **Beginner** | Foundational eye control & pacing | Pointer drills (5–15 min), early visual-span work |
| **Intermediate** | Speed + chunking | RSVP training, chunking, visual-span expansion (Schulte) |
| **Advanced** | Integration & subvocalization | Combined techniques, subvocalization reduction, push toward 700+ WPM @ 80–85% comprehension |

The path is **self-paced**. Completion percentages and milestone markers sustain
motivation. The exam path runs orthogonally to provide objective progress signals.

---

## 11. Open Questions for Architecture Phase

1. Exact backend choice for the "small bucket" (key-value store) and session endpoint.
2. Client-side parsing libraries per format (esp. EPUB/Mobi/PDF in-browser).
3. Exercise registry/plugin contract — interface each exercise module must implement.
4. How comprehension questions are generated when the text is user-supplied
   (we can't pre-author questions for unknown text → auto-generation vs.
   technique-only exercises that don't need questions).
5. Client-side persistence strategy for in-progress sessions.
6. First exercise to ship as the standalone MVP.

---

## 12. Immediate Next Step

Design the technical architecture **driven by the exercise specs in §6** — the
exercises define the data and interaction requirements, and the architecture is
built to serve them, not the other way around.
