# Speed Reading Trainer

A frontend-heavy web app that teaches speed reading through interactive, incremental lessons that run on **text the user brings themselves**. The defining constraint: **we never touch the text** — every uploaded document is parsed and used entirely in the browser, never transmitted or stored on any server.

## Core ideas

- **Bring-your-own-text lessons** — exercises run on whatever the user uploads (`.txt`, `.pdf`, `.docx`, `.epub`, `.mobi`), parsed client-side and discarded after the session.
- **Plugin/registry architecture** — each exercise is a self-contained module that appears in the app by registration, not by rewiring the core. Exercises: pointer/pacer, RSVP, Schulte table, chunking, subvocalization reduction, comprehension, and memorization/retention.
- **Long-term exam path** — a repeatable benchmark that charts reading speed × comprehension over time, separate from training lessons.
- **Zero backend, zero cost** — a fully static SPA hosted on GitHub Pages. All progress lives in the browser (IndexedDB); cross-device transfer is by user-initiated JSON export/import. Nothing — text or metadata — leaves the device unless the user exports it.

## Documentation

See [`/docs`](./docs):

- [`speed-reading-app-kickoff.md`](./docs/speed-reading-app-kickoff.md) — requirements / source of truth
- [`system-design.md`](./docs/system-design.md) — technical architecture
- [`architecture-plan.md`](./docs/architecture-plan.md) — ADRs + phased implementation roadmap (GitHub infra, zero-cost)

## Status

Phases 0–4 implemented: a pnpm + Turborepo monorepo with the engine core, plugin registry, IndexedDB storage + JSON export/import, `.txt` and `.pdf` parsing, **seven exercises** (Pointer, RSVP, Schulte, Chunking, Comprehension, Subvocalization, Memorization — all five pedagogical pillars), client-side comprehension question generation, the **exam path** benchmark (curated passages → baseline + re-test trajectory), a **spaced-repetition Review** tab with recall-decay charting, and a bilingual EN/PL UI. Phase 5 (`.docx`/`.epub`/`.mobi`, hardening, a11y) is next.

### Develop

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm test && pnpm typecheck && pnpm lint
```

### Layout

```
apps/web                  # React SPA (the entire app → GitHub Pages)
packages/contracts        # shared types: NormalizedText, MetricEvent, Exercise, metadata
packages/engine-core      # registry, clock, metrics collector, session engine
packages/storage          # IndexedDB + export/import + local profiles (metadata only)
packages/parsers          # client-side document parsing (.txt, .pdf; .docx/.epub/.mobi next)
packages/comprehension    # client-side cloze / true-false question generation
packages/exam-path        # curated passages + hand-authored questions + ExamRun logic
packages/exercise-*       # plugin exercises: pointer, rsvp, schulte, chunking,
                          #   comprehension, subvocalization
```
