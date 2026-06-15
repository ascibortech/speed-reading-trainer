# Speed Reading Trainer — System Design

**Project:** Web-based Speed Reading Learning Path Application
**Document type:** Technical architecture / system design
**Status:** Proposed — derived from kickoff (15 June 2026); backend sections revised per `architecture-plan.md` (no-backend / zero-cost decision)
**Companion to:** `speed-reading-app-kickoff.md` (source of truth), `architecture-plan.md` (delivery + infra)

> **Revision note (cost constraint).** The original design (still described below for context) proposed a tiny Cloudflare Workers + KV backend. A later hard constraint — *everything on already-paid (GitHub Team) or free infra, no new paid services* — superseded that. **ADR-003 in `architecture-plan.md` removes the backend entirely:** the app is 100% static on GitHub Pages, all data lives client-side in IndexedDB, and cross-device transfer is by user-initiated JSON export/import. Sections 3.5, 4, and the §11 backend trade-off are updated below to reflect this; the §6 data model is unchanged except that records persist locally rather than in a server KV.

---

## 0. How to read this document

The kickoff locked the requirements; this document turns them into an architecture. It follows the kickoff's own directive in §12 — *the exercises define the data and interaction requirements, and the architecture is built to serve them.* Every decision traces back to one of three non-negotiables from kickoff §2: **we never touch the text**, **simplicity over security**, and **incrementality (plugin/registry)**.

Where the kickoff left open questions (§11), this document resolves them with concrete recommendations and the trade-offs behind each. Recommendations are marked **[Decision]**; alternatives considered are noted so the team can revisit.

---

## 1. Requirements

### 1.1 Functional

The system must let an anonymous-ish user (username only, no email) create an account, upload a document client-side in several formats, run self-contained training exercises on that text, and track measured reading performance over time through a repeatable exam path. Six exercise types are in scope (pointer/pacer, RSVP, Schulte table, chunking, subvocalization reduction, comprehension assessment), plus a long-term exam path that benchmarks WPM and comprehension on re-test.

The exercise set must be extensible: a new exercise appears in the app by registration, not by modifying the core (kickoff §2.3).

### 1.2 Non-functional

The defining non-functional requirement is the **privacy posture**: uploaded text is processed entirely in the browser, never transmitted, never persisted anywhere off-device. In the revised (no-backend) design *nothing* — text or metadata — leaves the device unless the user exports it. This is simultaneously a legal stance (no copyrighted content ingested → no IP exposure; no PII → no GDPR scope) and a security simplification (nothing sensitive to protect, nothing to attack).

Scale is modest and unusual: **all** compute (parsing, rendering, timing, scoring, storage) happens on the client. There is no server to scale — a static site on a CDN serves any number of users, and the cost is fixed at zero. Latency requirements are tight *within the browser* — RSVP timing and pointer pacing are real-time rendering concerns — and there is no network on the hot path at all.

### 1.3 Constraints

Frontend-heavy SPA, **fully static / no backend** (see ADR-003 in `architecture-plan.md`; supersedes the kickoff §3 "minimal backend"). Client-side parsing for `.txt`, `.pdf`, `.docx`, `.epub`, `.mobi`. Local profiles (username, optional soft passphrase) — no server auth. Cross-device via JSON export/import. **Zero new infra cost**: hosted on GitHub Pages, everything else free or on the already-owned GitHub Team plan. Plugin architecture that can later accommodate a webcam eye-tracking layer (kickoff §8) without a core rewrite.

---

## 2. High-Level Design

### 2.1 Shape of the system

```
┌───────────────────────────────────────────────────────────────────────┐
│              BROWSER (the entire app — static, served by Pages)          │
│                                                                          │
│  ┌────────────┐   ┌──────────────────┐   ┌──────────────────────────┐  │
│  │  Upload &  │   │  Document Parsing │   │   Exercise Engine Core    │  │
│  │  File I/O  │──▶│  Layer (per-format│──▶│  ┌─────────────────────┐  │  │
│  │            │   │  → NormalizedText)│   │  │  Exercise Registry  │  │  │
│  └────────────┘   └──────────────────┘   │  │  (plugin contract)  │  │  │
│        │                  │               │  └─────────┬───────────┘  │  │
│   text never             text never       │   pointer│rsvp│schulte... │  │
│   leaves device ─────────┘ persisted      │  chunking│subvoc│comp│mem  │  │
│                                           └────────────┬──────────────┘  │
│                                                        │ emits           │
│  ┌────────────────────┐                      ┌─────────▼──────────┐      │
│  │  Storage layer      │◀── metadata ────────│  Metrics Collector │      │
│  │  (IndexedDB)        │     only             │  (METADATA ONLY)   │      │
│  │  + local profiles   │                      └────────────────────┘      │
│  └─────────┬──────────┘                                                  │
│            │  user-initiated                                             │
│            ▼                                                             │
│  ┌────────────────────┐     ── NO server, NO network data path ──        │
│  │  JSON export/import │       (cross-device + recovery = this file)      │
│  │  (metadata only)    │                                                  │
│  └────────────────────┘                                                  │
└───────────────────────────────────────────────────────────────────────┘
   Hosting: GitHub Pages (static files only)  ·  no backend  ·  no database
```

The architectural center of gravity is the browser — in fact it is the *entire* system. There is no backend: the app is static files on GitHub Pages, all state lives in IndexedDB, and the only way data ever leaves the device is a user-initiated JSON export (metadata only). This is the strongest form of the kickoff's "we never touch the text" promise — we never touch *anything*.

### 2.2 The text boundary (the most important line in the system)

The single most important invariant is that uploaded text crosses exactly one boundary — from file into browser memory — and never crosses a second one. To make this enforceable rather than aspirational:

The parsing layer outputs an in-memory `NormalizedText` object. The exercise engine reads from it. The metrics collector is architecturally downstream of the engine and is **structurally incapable of seeing raw text** — it receives only numeric/enumerated events (a word *count*, a duration, a WPM, a correctness boolean), never word content. The storage/export layer only ever serializes from the metrics store. There is no code path from `NormalizedText` to persistence or to the export file. This separation is enforced by a CI lint rule: `NormalizedText` lives in a module the storage/export layer cannot import, so a metadata export can never contain user text.

### 2.3 Data flow, end to end

A training session flows: user picks a file → parsing layer extracts and normalizes to `NormalizedText` (in memory) → user picks an exercise → registry instantiates the exercise module with the normalized text and parameters → exercise runs, emitting metric events to the collector → on completion (or periodically) the collector produces a `SessionMetadata` record → the storage layer writes it to IndexedDB → `NormalizedText` is dropped when the session ends or the tab closes. The progress profile is later assembled by reading `SessionMetadata` and `ExamRun` records back from IndexedDB. Cross-device transfer is a separate, explicit user action: export the local metadata to a JSON file and import it elsewhere.

---

## 3. Component Design

### 3.1 Document Parsing Layer

A pluggable set of per-format parsers behind one interface. Each parser takes a `File`/`ArrayBuffer` and returns `NormalizedText`. Normalization is where format quirks die: strip layout artifacts, collapse whitespace, split into paragraphs → sentences → words, and attach light structural metadata (paragraph indices, approximate line groupings) that pacing exercises need.

**[Decision] Parsing libraries (resolves kickoff §11.2), all in-browser:**

| Format | Library | Notes |
|---|---|---|
| `.txt` | native | Read as text, normalize whitespace/encoding (detect UTF-8/UTF-16 BOM). |
| `.pdf` | **pdf.js** (Mozilla) | Mature, pure-browser, extracts text runs per page. Layout-based PDFs need careful reflow; accept that scanned/image PDFs yield no text (surface a clear error). |
| `.docx` | **mammoth.js** | Converts docx to clean HTML/text in-browser; we keep the text, discard styling. |
| `.epub` | **ep.js / epubjs** + JSZip | EPUB is a zip of XHTML; unzip client-side, concatenate spine documents, strip markup. |
| `.mobi` | **foliate-js** mobi parser (or a wasm-compiled `libmobi`) | Mobi/AZW is the hardest in-browser case. **[Decision] Ship `.mobi` last**; if parsing proves unreliable, gate it behind a "convert to epub" hint rather than block MVP. |

Trade-off: doing PDF/EPUB/Mobi parsing in-browser is heavier than a server would be, and bundle size grows. We accept this because server-side parsing would violate the text boundary — the whole point. Parsers are **lazy-loaded** (dynamic `import()` per format) so a `.txt` user never downloads the PDF engine.

Failure handling: every parser must distinguish "unsupported/corrupt file" from "valid file, no extractable text" (e.g. scanned PDF) and report both as user-facing errors, never silent empties.

### 3.2 Exercise Engine Core + Registry

The core owns the lifecycle (`init → run → pause/resume → complete → teardown`), the shared rendering surface, a high-resolution timing service (`performance.now()`), and the metrics event bus. It knows nothing about any *specific* exercise. The registry is the plugin mechanism: each exercise is a module that registers itself with a descriptor and an implementation conforming to the **Exercise Contract** (§5). The core renders the catalogue from the registry, so adding exercise #N is: write the module, register it, ship it — no core change (kickoff §2.3).

This is also where the future eye-tracking layer slots in (kickoff §8): it is an *optional capability* the core can expose to exercises (a gaze-event stream), not a new exercise. Exercises declare whether they consume it; if the capability is absent, they run without it.

### 3.3 Metrics Collector

Subscribes to the engine event bus, aggregates per-exercise raw events into a normalized `SessionMetadata` record. This is the privacy choke point: its input types contain no strings of user content. It also computes derived metrics — WPM, reading efficiency (`WPM × comprehension`, kickoff §5), pointer-adherence, etc. — so the math is centralized and consistent across exercises.

### 3.4 Session Persistence (client-side)

**[Decision] IndexedDB for in-progress sessions (resolves kickoff §11.5).** Rationale: exercises produce structured records and possibly mid-session snapshots; IndexedDB handles structured objects and larger payloads better than `localStorage`, and is async (won't jank the RSVP render loop). `localStorage` is reserved for tiny flags (session token, last-used settings).

Important nuance: we persist **session metadata and progress locally**, never the uploaded text. If a user reloads mid-exercise, the in-progress *parameters and accumulated metrics* survive, but they must re-upload the source text (it was never stored — by design). This is an explicit UX trade-off we surface to the user ("your text stays on your device and isn't saved; reloading will ask for it again").

### 3.5 Data layer (revised — client-side only, no sync server)

**[Revised]** There is no backend and no network sync. `packages/storage` owns all persistence: IndexedDB for profiles, sessions, exam runs, and the progress index, plus **JSON export/import** for backup and cross-device transfer. Records are append-only and immutable once written (sessions, exam runs), so there is no conflict resolution to do. The export file is the user's portable copy of their own metadata — and doubles as the account-recovery mechanism the original server design lacked. Crucially, the storage/export layer **cannot import `NormalizedText`** (enforced by a CI lint rule), so the export file can never contain user text — only metadata.

---

## 4. Data Persistence Design (revised — no backend)

### 4.1 What replaced the backend

The original design (below, kept for context) used a tiny Cloudflare Workers + KV backend for auth and per-user metadata. Under the zero-cost / GitHub-only constraint (`architecture-plan.md` ADR-003), **the backend is removed**. Its two responsibilities are re-homed entirely on the client:

- **"Separate users from one another" (kickoff §2.2)** → **local profiles** in IndexedDB. Multiple profiles can coexist on one device, each labelled by a username, with an optional passphrase as a *soft local lock* (not access control — there is nothing sensitive to protect and the data never leaves the device).
- **Store per-user metadata** → **IndexedDB**, with **JSON export/import** for backup and moving between devices.

This is strictly stronger on privacy: with no server, neither text nor metadata leaves the device unless the user explicitly exports it. Legal/IP/GDPR surface is effectively nil.

### 4.2 Auth model (revised)

No server means no real authentication — and none is needed (kickoff §2.2: nothing sensitive to protect). A "profile" is created with a username and an optional passphrase that gates local access on that device only. There are no session tokens, no server credential store, no password transmission. Account recovery is the **export file**: users are prompted at first run to download a backup, and importing it restores or transfers their progress.

### 4.3 Storage layout (IndexedDB)

```
db: speed-reading-trainer
├─ profiles        { username (key), createdAt, passphraseHash? }   // soft local lock only
├─ sessions        SessionMetadata   (keyed by sessionId; append-only)
├─ examRuns        ExamRun           (keyed by examRunId; append-only)
└─ progressIndex   { username → { sessionIds[], examRunIds[], profile } }

Export/Import: a single versioned JSON document
  { schemaVersion, profile (no passphrase), sessions[], examRuns[], progress }
  — metadata only; the CI import-boundary rule guarantees no NormalizedText leaks in.
```

The progress index lets the app assemble the full trajectory locally in one read — the same "dumb store, smart client" shape as before, just with IndexedDB instead of a server KV.

> **Original server design (superseded — kept for context):** a serverless function layer (Cloudflare Workers) in front of Workers KV; username + argon2-hashed password → session token; KV keys `user:`, `session:`, `meta:…`, `index:`. Removed because it would add a third-party service whose free tier could convert to a charge, violating the no-new-payments constraint. Reintroduce only as a deliberate, opt-in future trade if seamless multi-device sync becomes a hard requirement.

---

## 5. The Exercise Plugin Contract (resolves kickoff §11.3)

This is the heart of incrementality. Every exercise implements one interface; the core only knows this interface.

```ts
// Normalized text the engine operates on — produced by the parsing layer,
// never serialized to the network.
interface NormalizedText {
  words: string[];                 // tokenized
  sentences: Span[];               // index ranges into words
  paragraphs: Span[];
  lineHints?: Span[];              // optional layout grouping for pacing
  wordCount: number;
  sourceFormat: 'txt'|'pdf'|'docx'|'epub'|'mobi';
}

// A metric event carries NO user text — numbers, enums, booleans only.
type MetricEvent =
  | { t:'progress'; wordsProcessed:number; atMs:number }
  | { t:'wpm'; value:number }
  | { t:'fixation'; perLine:number }
  | { t:'regression'; count:number }
  | { t:'answer'; questionId:string; correct:boolean; responseMs:number }
  | { t:'param'; key:string; value:number|string }
  | { t:'custom'; key:string; value:number };

interface ExerciseContext {
  text: NormalizedText;
  surface: RenderSurface;          // the shared canvas/DOM the core provides
  clock: { now(): number };        // performance.now wrapper
  emit(e: MetricEvent): void;      // → metrics collector
  capabilities: { eyeTracking?: GazeStream }; // optional, future
}

interface ExerciseDescriptor {
  id: string;                      // 'rsvp', 'pointer', 'schulte', ...
  title: string;
  pillar: 'eye-movement'|'visual-span'|'subvocalization'|'comprehension'|'retention';
  stage: 'beginner'|'intermediate'|'advanced';
  needsText: boolean;              // Schulte = false; RSVP = true
  needsComprehension: boolean;     // attaches a comprehension check
  paramSchema: ParamSchema;        // pace, chunk size, grid size, etc.
}

interface Exercise {
  descriptor: ExerciseDescriptor;
  init(ctx: ExerciseContext, params: Params): Promise<void>;
  start(): void;
  pause(): void;
  resume(): void;
  teardown(): void;                // must release all text references
}

// Registration — this is how an exercise "appears" in the app.
registry.register(exerciseModule);
```

Three properties make this support the kickoff's incrementality goal: exercises are **self-contained** (own their rendering and params), **content-source agnostic** (they consume `NormalizedText`, never a raw file — kickoff §4), and **declaratively described** (the core builds the catalogue and learning path from descriptors). The `needsText:false` flag is what lets a Schulte table (numbers, no user content) live under the exact same contract as RSVP.

### 5.1 Memorization / Retention Exercise (new — beyond kickoff §6)

This exercise extends the catalogue with a **fifth pedagogical pillar — retention** — addressing what the four kickoff pillars don't: whether the reader can *hold onto* content, not just read it fast or answer a check immediately after. It is the first exercise of pillar `'retention'` and proves that pillar fits the existing contract with zero core changes — exactly the incrementality test from kickoff §2.3.

**Mechanic.** The reader is shown a passage (BYO text or an exam passage) at a chosen pace, then the text is removed and they must reconstruct or recall it. Three difficulty modes share one contract:

- **Free recall** — after reading, the user types/dictates everything they remember. Scored locally by overlap against the (in-memory only) source word/keyword set — a recall-coverage percentage. The source text used for scoring stays in browser memory and is discarded with the session; only the resulting percentage is emitted.
- **Cued recall (cloze-from-memory)** — key sentences reappear with content words blanked; the user fills them from memory. Reuses the §8 algorithmic cloze generator, so no new question-generation machinery.
- **Sequence/structure recall** — paragraph or bullet fragments are shuffled; the user reorders them, training memory for *structure* (useful for studying, not just speed).

**Optional memory-technique scaffolding.** For advanced users the exercise can prompt a technique before reading — chunk-and-associate, method-of-loci tagging, or keyword imaging — then compare recall with vs. without the technique, mirroring the A/B structure of the subvocalization exercise (kickoff §6.5).

**Spaced repetition.** Retention's signal only appears over time, so this exercise schedules re-tests of the *same* passage at expanding intervals (e.g. 1 day → 3 days → 1 week) and records recall decay. This rides on the existing append-only metadata and the client scheduler; it does not need a new backend.

**Capture (metadata only):** recall mode, recall-coverage %, items correct / total, ordering accuracy, time-to-recall, technique used (if any), recall-with vs. recall-without delta, retention-interval (days since exposure), and decay curve points across re-tests. As with every exercise, **no recalled or source text is stored** — only the scores. The user's typed recall is compared in memory and then dropped.

**Privacy note.** Free recall is the one mode where the *user types content*. That typed text is treated exactly like uploaded text: scored client-side, never transmitted, never persisted. The text boundary (§2.2) covers it without modification.

This exercise demonstrates the plugin pattern working as intended: a genuinely new capability (retention + spaced repetition) added entirely through registration and the existing metadata schema.

---

## 6. Data Model

Mapping kickoff §9 to concrete records. **Never stored:** uploaded text, email/real name, payments. **Stored:** metadata only.

```ts
interface SessionMetadata {
  sessionId: string;
  username: string;
  exerciseId: string;
  stage: 'beginner'|'intermediate'|'advanced';
  difficulty: number;
  startedAt: string;               // ISO timestamp
  durationSec: number;
  wordsProcessed: number;
  wpm: number;
  comprehensionPct?: number;       // where applicable
  efficiencyEwpm?: number;         // wpm × comprehension
  recallCoveragePct?: number;      // memorization exercise (§5.1)
  retentionIntervalDays?: number;  // days since exposure, for spaced re-tests
  params: Record<string, number|string>;  // pointer speed, RSVP rate, grid size, chunk size, recall mode...
  regressionCount?: number;
  fixationsPerLine?: number;
  // exercise-specific extras live in `params` to keep the schema open
}

interface ExamRun {
  examRunId: string;
  username: string;
  isBaseline: boolean;
  date: string;
  passages: { difficulty: PassageDifficulty; wpm: number; comprehensionPct: number }[];
  meanWpm: number;
  meanComprehensionPct: number;
}

interface PassageDifficulty {
  approxWordCount: number;         // baseline ~1000 (kickoff §6.6)
  lexicalComplexity: number;       // controlled scale
  meanSentenceLength: number;
  conceptualAbstraction: number;
}

interface ProgressProfile {
  username: string;
  baseline?: { date:string; wpm:number; comprehensionPct:number };
  trajectory: { date:string; wpm:number; comprehensionPct:number; efficiencyEwpm:number }[];
  completion: Record<string, number>;  // % per stage/exercise for motivation (kickoff §10)
}
```

The schema keeps exercise-specific numbers inside `params` so a new exercise adds fields without a migration — consistent with the plugin philosophy. Exam runs are immutable and append-only; the trajectory in §7 is derived, not separately authored.

---

## 7. The Exam Path

A distinct subsystem, not an exercise (kickoff §7). It runs the *same* set of equal-difficulty passages each time (baseline + re-tests every 4–6 weeks) and records `ExamRun` records. Because the comparison must be apples-to-apples, the exam path needs **stable passages of known difficulty** — which collides with "the user brings their own text." Resolution: the exam path uses a **small set of app-provided, fixed-difficulty passages** (public-domain or original, authored by us), not user uploads. This is the one place the app ships its own text — and it's our text, so no IP concern. Training exercises remain BYO-text; the exam path is the controlled benchmark.

The progress trajectory (speed × comprehension over time) is computed client-side from the `ExamRun` history and rendered as the motivational progress view.

---

## 8. Comprehension Questions on User Text (resolves kickoff §11.4)

This is the thorniest open question: we can't pre-author questions for text we never see, and we've committed never to send the text to a server.

**[Decision] Two-track approach:**

1. **Technique exercises need no questions.** Pointer, Schulte, chunking, and subvocalization drills measure speed/control mechanics. For these, comprehension is optional or self-reported (kickoff §6.5 already specifies self-report for subvocalization). Ship these first — they sidestep the problem entirely.

2. **For comprehension on user text:** generate questions **client-side**, never server-side.
   - **MVP (no AI):** algorithmic cloze generation — pick salient sentences, blank a content word, offer distractors drawn from the passage's own vocabulary. Plus simple factual recall via sentence-level true/false. This is crude but 100% local and zero-cost, and it preserves the text boundary absolutely.
   - **Better (optional, opt-in):** in-browser LLM (WebLLM / a small quantized model running via WebGPU) to generate MC/cloze/inference questions locally. Heavier download, but text still never leaves the device. Gated behind an explicit opt-in and a capability check.
   - **Explicitly rejected:** sending text to a server-side LLM. It would be the cleanest engineering path and produce the best questions — and it directly violates kickoff §2.1. Not an option.
   - **Always available fallback:** the curated **exam path** (§7) uses our own passages with hand-authored questions of all three types (MC factual, cloze, inference — kickoff §6.6). So rigorous comprehension measurement always exists on controlled text, even if auto-generation on user text stays shallow.

Trade-off stated plainly: the privacy posture caps how good auto-generated questions on arbitrary user text can be. We accept shallower in-session comprehension checks on BYO text in exchange for the legal/privacy guarantee, and we lean on the curated exam path for the authoritative comprehension signal.

---

## 9. MVP — First Exercise to Ship (resolves kickoff §11.6)

**[Decision] Ship the Pointer/Pacer exercise (kickoff §6.1) as the standalone MVP**, paired with `.txt` and `.pdf` upload, username auth, and the metadata sync path.

Rationale: it exercises the entire architecture end-to-end (upload → parse → normalized text → exercise → metrics → sync) while being the simplest exercise to render and time correctly. It needs text but **not** comprehension questions, so it dodges the §8 problem on day one. It's the beginner-stage entry point in the learning path (kickoff §10), so it's also the natural first thing a real user does. RSVP is the strong second ship (more timing-sensitive, benefits from the metrics plumbing being proven first). Schulte is a good early add too since `needsText:false` lets it ship without any parsing dependency.

Build order: (1) auth + KV + sync skeleton; (2) `.txt` parser + `NormalizedText`; (3) engine core + registry + metrics collector; (4) Pointer exercise; (5) `.pdf` parser; (6) progress profile view; then iterate exercises via the registry. The **Memorization/Retention exercise (§5.1)** slots in as an intermediate-to-advanced add: it depends on the algorithmic cloze generator (§8) and the spaced-repetition scheduler, so it ships after the comprehension plumbing exists — but it requires no core or backend changes, which is the point.

---

## 10. Scale, Reliability, Cost

All work runs on each user's own device; there is no server, so there is no per-user infra cost and nothing to scale — a static bundle on GitHub's CDN serves any number of users at fixed (zero) cost. No data tier, no media storage, no streaming.

Reliability is entirely client-side: the RSVP/pointer render loops must stay smooth (use `requestAnimationFrame`, keep IndexedDB writes async and off the critical path). Persistence is robust given immutable, append-only records keyed by `sessionId`/`examRunId`. The one durability risk is local browser-data loss (cleared cache/profile) — mitigated by making export prominent and offering periodic export reminders. No server uptime to monitor.

Offline: because the entire app is client-side and static, it works fully offline after first load (a service worker can make it installable/PWA); there is no network dependency during use.

---

## 11. Trade-offs Summary

| Decision | Chose | Gave up | Why |
|---|---|---|---|
| Where text lives | Browser only | Server-side parsing convenience, better comprehension Q-gen | Non-negotiable privacy/IP posture (§2.1) |
| Backend *(revised)* | **None — client-side only** | Automatic cross-device sync; server accounts | Zero cost / zero ops / strongest privacy; cross-device via JSON export/import (ADR-003) |
| Auth *(revised)* | Local profiles + optional soft passphrase | Real authentication | No server, nothing sensitive to protect; recovery via export file |
| Client persistence | IndexedDB | Simplicity of localStorage | Structured records + async, won't jank render loop |
| Comprehension on user text | Local algorithmic / opt-in in-browser LLM | Quality of server LLM questions | Preserves text boundary; curated exam path carries authoritative signal |
| Mobi support | Ship last / optional | Day-one format completeness | Hardest in-browser parse; don't block MVP |
| MVP exercise | Pointer/Pacer | Flashier RSVP first | Proves whole pipeline, no comprehension-Q dependency |

---

## 12. What I'd Revisit as the System Grows

If user counts or feature ambition rise, the first thing to reconsider is **optional cross-device sync** — the no-backend model means progress lives per-device with manual export/import; if users demand seamless multi-device, evaluate an opt-in sync via a free service as a deliberate trade (kept out of scope now to honour the zero-cost constraint). Second, the **in-browser LLM** for comprehension questions: today it's a heavy optional download; as WebGPU/local-model tooling matures it could become the default, finally giving good comprehension checks on user text without breaking the privacy posture. Third, the **eye-tracking capability** (kickoff §8) will stress the engine's timing and event throughput (≥60 Hz gaze sampling) — the contract reserves a slot for it, but the metrics bus and IndexedDB write cadence should be load-tested before that ships. Finally, **local-data durability**: since data lives only in the browser, a cleared profile loses progress — mitigated now by prominent export, but worth revisiting (e.g. periodic export reminders or the optional sync above).

---

## Appendix A — Assumptions

- Static-only hosting (GitHub Pages); no server runtime; global reach via GitHub's CDN.
- Modern evergreen browsers only (WebGPU/IndexedDB/`performance.now` assumed).
- All data is client-side; the optional profile passphrase is a soft local lock, not authentication.
- Cross-device transfer and recovery are via user-initiated JSON export/import (no automatic sync).
- Exam-path passages are app-supplied (ours or public-domain), distinct from user uploads.
- No payments, email, PII, or backend anywhere → no GDPR scope and zero marginal infra cost, per kickoff §2.2 and `architecture-plan.md`.
