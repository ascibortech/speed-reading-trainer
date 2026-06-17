# CLAUDE.md

This file guides Claude Code when working in this repository. It overrides any
broader/global CLAUDE.md. **Source of truth lives in [`/docs`](./docs)** — when
this file and the docs disagree, the docs win; update this file to match.

## Project overview

**Speed Reading Trainer** — a frontend-heavy, **fully static SPA** that teaches
speed reading through interactive, incremental lessons that run on **text the
user brings themselves**.

The defining constraint — **"we never touch the text."** Every uploaded document
(`.txt`, `.pdf`, `.docx`, `.epub`, `.mobi`) is parsed and used **entirely in the
browser**, held transiently in memory, and discarded after the session. It is
never transmitted to or stored on any server. There is no server.

Two parallel systems: **session-based training lessons** (run on BYO text) and a
**long-term exam path** (runs on curated, app-supplied passages) that benchmarks
WPM × comprehension over time.

**Status:** Phases 0–3 implemented. Phase 0 (factory) + Phase 1 (MVP: Pointer,
`.txt`, profiles, export/import) + Phase 2 (lazy `.pdf`, RSVP, Schulte, progress
view) + Phase 3 (the **exam path** subsystem with curated passages + hand-authored
questions producing `ExamRun` trajectories; client-side **comprehension** question
generation; the **comprehension**, **chunking**, and **subvocalization** exercises
— all four kickoff pillars now represented). Runs on React 19. **Bilingual UI
(English / Polish)** via a custom i18n layer (`apps/web/src/i18n`, flag switcher,
choice persisted to `localStorage`), plus in-app **versioning + changelog**
(`apps/web/src/changelog.ts`, shown from the footer). Exercises localize their own
DOM strings through `ctx.t(key, englishFallback)` on the Exercise contract. CI/CD +
CodeQL + Dependabot wired. **Phase 4 ✓** added the **memorization / retention**
exercise (free / cued / sequence recall, scored in-memory) and a **spaced-repetition
Review tab** (curated re-test schedule with a recall-decay chart), backed by a new
`reviews` IndexedDB store (DB v2) — recalled text is never persisted. **Phase 5
(`.docx`/`.epub`/`.mobi`, hardening, optional in-browser LLM, a11y) is the next
step.**

## The three non-negotiables

Every architectural decision traces back to these (kickoff §2). Do not violate them.

1. **We never touch the text.** Uploaded text crosses exactly one boundary — file
   → browser memory — and never a second. No code path goes from `NormalizedText`
   to persistence, to the export file, or to any network call. The metrics layer
   is structurally incapable of seeing raw text (it receives only numbers, enums,
   booleans). A CI lint rule forbids the `storage`/export layer from importing the
   `NormalizedText` module — so an export can never contain user text.
2. **Simplicity over security.** No PII, no email, no payments → no GDPR scope and
   nothing sensitive to protect. "Auth" is a local profile (username + *optional*
   passphrase) that is a **soft local lock, not access control**. Say so honestly
   in UX; never imply it secures anything.
3. **Incrementality (plugin/registry).** Each exercise is a self-contained module
   that **appears in the app by registration, not by rewiring the core.** Adding
   exercise #N must require **zero** engine-core or backend changes.

## Tech stack & infrastructure

- **No backend, ever.** 100% static SPA. All state in **IndexedDB**; cross-device
  transfer and account recovery via **user-initiated JSON export/import** only.
  (ADR-003 removed the originally-proposed Cloudflare Workers + KV backend.)
- **GitHub is the entire platform** (ADR-001). Public repo
  [`ascibortech/speed-reading-trainer`](https://github.com/ascibortech/speed-reading-trainer);
  hosted on **GitHub Pages** (free `github.io` domain, enforced HTTPS); CI/CD via
  **GitHub Actions**; CodeQL + secret scanning + Dependabot (free on public repo).
- **Hard cost constraint: £0 marginal spend.** No new paid services and no
  free tiers that can convert to a bill. A custom domain is the only thing that
  would cost money — deliberately skipped.
- **Monorepo** (ADR-002): **pnpm workspaces + Turborepo**. Exercises load via lazy
  dynamic `import()` and register at runtime.
- **Client libs:** TypeScript; pdf.js (`.pdf`), mammoth.js (`.docx`), epub.js +
  JSZip (`.epub`), foliate-js / wasm libmobi (`.mobi`, shipped last). Parsers are
  **lazy-loaded** per format. Timing via `performance.now()`; render loops use
  `requestAnimationFrame`; IndexedDB writes stay async and off the hot path.

## Planned repository structure

```
apps/web/                    # the entire app → built static → GitHub Pages
packages/
  contracts/                 # NormalizedText, MetricEvent, Exercise contract
  engine-core/               # lifecycle, timing, registry, metrics collector
  storage/                   # IndexedDB + JSON export/import + local profiles
  parsers/                   # lazy per-format: txt, pdf, docx, epub, mobi
  exercise-pointer/          # MVP exercise
  exercise-rsvp/  exercise-schulte/  exercise-chunking/
  exercise-subvocalization/  exercise-comprehension/  exercise-memorization/
  exam-path/                 # curated passages + benchmark logic
docs/                        # kickoff (source of truth), system-design, arch plan
.github/workflows/           # ci.yml, deploy-pages.yml, codeql.yml, release.yml
```

There is **no `apps/api`** — the backend is gone by design.

## Architecture essentials

**Data flow (training session):** pick file → parsing layer normalizes to
`NormalizedText` (in memory) → registry instantiates the chosen exercise with
text + params → exercise emits `MetricEvent`s to the collector → collector
produces a `SessionMetadata` record → storage writes it to IndexedDB →
`NormalizedText` is dropped at session end. The progress profile is derived by
reading `SessionMetadata` + `ExamRun` records back.

**Exercise plugin contract** (the heart of incrementality — full def in
[system-design §5](./docs/system-design.md)): every exercise implements one
`Exercise` interface (`init / start / pause / resume / teardown`) and ships an
`ExerciseDescriptor` (`id`, `pillar`, `stage`, `needsText`, `needsComprehension`,
`paramSchema`). The core builds the catalogue and learning path from descriptors.
`needsText: false` (e.g. Schulte) lets number-only exercises use the same contract.
`teardown()` **must release all text references.**

**Five pedagogical pillars:** eye-movement, visual-span, subvocalization,
comprehension, retention. Six kickoff exercises + memorization/retention (system-
design §5.1) proves the plugin pattern with a genuinely new capability.

**Comprehension on BYO text** (system-design §8): generated **client-side only**.
MVP = algorithmic cloze; optional opt-in in-browser LLM (WebLLM/WebGPU) later.
Sending text to a server LLM is **explicitly rejected**. The curated **exam path**
(app-supplied passages, hand-authored questions) carries the authoritative signal.

## Data model (metadata only)

**NEVER stored:** uploaded text (any format), email/real name, payments.
**Stored:** `SessionMetadata`, `ExamRun`, `PassageDifficulty`, `ProgressProfile`
(see [system-design §6](./docs/system-design.md)). Records are append-only and
immutable; exercise-specific numbers live in an open `params` map to avoid
migrations. IndexedDB stores `profiles`, `sessions`, `examRuns`, `progressIndex`.

## Implementation phases

Each phase is a GitHub Milestone; exit criteria gate the next. (Full detail in
[architecture-plan §5](./docs/architecture-plan.md).)

- **Phase 0** ✓ — GitHub factory: public repo, pnpm+Turborepo scaffold, CI/CD, Pages,
  CodeQL/Dependabot, `packages/contracts`, devcontainer.
- **Phase 1 (MVP)** ✓ — local profiles + IndexedDB + export/import + `.txt` parser +
  engine core + **Pointer/Pacer exercise**. Ships a usable standalone product.
- **Phase 2** ✓ — lazy `.pdf` parser (pdf.js), RSVP, Schulte, progress profile view.
- **Phase 3** ✓ — exam path + comprehension (cloze) + chunking + subvocalization.
- **Phase 4** ✓ — memorization/retention + spaced repetition.
- **Phase 5** — `.docx`/`.epub`/`.mobi`, hardening, optional in-browser LLM, a11y.
- **Phase 6 (stretch)** — webcam eye-tracking as an engine capability.

## Commands

Requires `pnpm` (the repo pins `pnpm@9` via `packageManager`; if missing,
`npm i -g pnpm@9` or enable corepack).

```bash
pnpm install              # install workspace deps
pnpm dev                  # Vite dev server for apps/web (localhost:5173)
pnpm build                # turbo build → apps/web/dist (deployed to Pages)
pnpm typecheck            # turbo: tsc --noEmit per package
pnpm test                 # turbo: vitest run per package
pnpm lint                 # text-boundary check (check-boundary) + eslint
pnpm check-boundary       # privacy CI guard, runs scripts/check-text-boundary.mjs
pnpm preview              # preview the production build
```

Packages are source-only TS libraries (consumed directly by Vite/Vitest via
`exports` → `src/*.ts`); only `apps/web` has a real build step.

## Working conventions

- **Match the docs.** This is a doc-driven project; when implementing, cite the
  governing doc section and keep behavior faithful to it.
- **Guard the text boundary** in every change. If a change could let text reach
  storage, export, or the network, stop — that is the one inviolable rule.
- **New exercise = new package + registration only.** If you find yourself editing
  `engine-core` to add an exercise, the contract is being violated — reconsider.
- **Zero-cost discipline.** Don't introduce a dependency on any paid service or a
  free tier that can convert to a charge.
