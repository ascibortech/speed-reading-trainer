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

Pre-implementation. Architecture and delivery plan complete; Phase 0 (factory setup) is the next step.
