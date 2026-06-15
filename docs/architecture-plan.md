# Speed Reading Trainer — Architecture & Implementation Plan

**Project:** Web-based Speed Reading Learning Path Application
**Document type:** Architecture plan + ADRs + phased implementation roadmap
**Status:** Proposed
**Date:** 15 June 2026
**Deciders:** Albert (owner), engineering lead
**Builds on:** `speed-reading-app-kickoff.md` (requirements, source of truth) and `system-design.md` (technical architecture)
**Infra anchor:** GitHub organisation **`ascibortech`** (paid plan — GitHub Team) — https://github.com/orgs/ascibortech/repositories

> **Hard cost constraint (this revision):** everything runs on **infrastructure we already pay for (GitHub Team) or free tiers — no new paid services, ever.** This forces two decisions: a **fully client-side app with no backend**, and a **public repository** (which makes all the security tooling free). Both are reflected throughout below.

---

## 0. Purpose & summary

This document converts the locked requirements (kickoff) and the technical architecture (system design) into an **executable, phased delivery plan that runs entirely on GitHub at zero marginal cost.**

The guiding constraints from the prior docs carry through unchanged — **we never touch the user's text** (client-side only), **simplicity over security** (no PII, minimal auth), **incrementality** (plugin/registry) — and are now joined by the cost rule above.

### 0.1 The decision that shapes everything: no backend at all

GitHub provides no always-on backend host and no managed database — its native compute (Actions) is batch CI/CD, and Pages serves static files only. Rather than bolt on a third-party runtime, this plan **removes the backend entirely.** The app is a **100% static SPA on GitHub Pages**; all data lives in the browser (IndexedDB); cross-device transfer happens by **user-initiated export/import of a small JSON progress file.**

This is not a compromise forced by cost — it is *more faithful* to the kickoff's privacy posture than the original server-backed design. The kickoff promised the server stores "metadata only" and "never touches the text." With no server, **nothing — text or metadata — ever leaves the user's device** unless they deliberately export it. The legal/IP/GDPR surface drops to essentially zero, and the operational surface drops to "publish static files."

What we give up: automatic cross-device sync and a server-enforced account system. We replace them with local profiles and an export/import file — which also serves as the account-recovery mechanism the earlier design lacked. See ADR-003.

---

## 1. ADR-001 — GitHub as the entire platform (Pages + Actions)

**Status:** Proposed · **Deciders:** Albert, engineering lead

### Context
We own a paid GitHub Team org (`ascibortech`) and must add no new paid services. The app is a frontend-heavy SPA whose backend (per the no-backend decision in §0.1 / ADR-003) is eliminated.

### Decision
Use GitHub as the **single platform** for the whole lifecycle and runtime: source (public repo), CI/CD (Actions), artifact registry (Packages, if ever needed), **static hosting of the entire app (Pages)**, security (CodeQL + secret scanning + Dependabot — all free on a public repo), planning (Projects/Issues/Milestones), and reproducible dev environments (Codespaces). There is no second platform.

### Options Considered

#### Option A: 100% GitHub (Pages + Actions), public repo — **chosen**
| Dimension | Assessment |
|-----------|------------|
| Complexity | Very low — one platform, one deploy target |
| Cost | £0 marginal — Pages free, Actions within plan, scanning free on public repos |
| Scalability | High — static CDN; no server to scale |
| Team familiarity | High |

**Pros:** Zero new spend; one place for everything; free HTTPS; free security tooling on public repos; nothing to operate at runtime.
**Cons:** No server-side capability at all (must do auth/sync client-side); public source code.

#### Option B: GitHub + a free-tier third-party backend (e.g. Cloudflare Workers free tier)
**Pros:** Enables real accounts + auto cross-device sync.
**Cons:** New vendor/account; free tier could hit limits and *become* a payment — directly against the cost rule; more to operate. **Rejected on the cost constraint.**

#### Option C: Separate PaaS for everything (Vercel/Netlify)
**Pros:** Good DX.
**Cons:** New paid/again-limited tier; duplicates GitHub capabilities we already pay for. **Rejected.**

### Trade-off analysis
Option A is the only one that guarantees "no new payments" with certainty (a free tier elsewhere can silently convert to a bill). It also collapses operations to publishing static files. The cost is going public and doing everything client-side — both acceptable: there are no secrets in a frontend-only app, and the privacy posture *wants* client-side-only anyway.

### Consequences
- **Easier:** Deploy, security scanning, previews, planning — all free, all in one org.
- **Harder:** No server means auth/sync are client-side patterns (ADR-003).
- **Revisit when:** a feature genuinely requires server compute (e.g. mandatory cross-device sync for non-technical users) — then, and only then, evaluate a free or paid runtime as a deliberate trade.

### Action items
1. [ ] Create **public** repo in `ascibortech`; enable Pages + enforced HTTPS.
2. [ ] Decide domain: default **free** `ascibortech.github.io/speed-reading-trainer` (a custom domain is optional and the only thing that would cost money — skip unless you already own one).

---

## 2. ADR-002 — Monorepo with per-exercise packages

**Status:** Proposed · **Deciders:** Albert, engineering lead

### Context
The kickoff mandates a plugin/registry architecture where each exercise is independent and "appears by registration" (kickoff §2.3, system-design §5). We need a layout that keeps exercises independently buildable/shippable while sharing the `NormalizedText` contract and engine core.

### Decision
A **single public monorepo** managed with **pnpm workspaces + Turborepo**: app shell, engine core, shared contracts package, one package per exercise, parsers. Exercises load via **lazy dynamic `import()`** and register at runtime — satisfying "independently deployable" in a static-frontend context (each is a separately built, lazily-loaded chunk) without polyrepo overhead.

### Options Considered

#### Option A: Monorepo + per-exercise packages — **chosen**
**Pros:** Shared contract/types in one place; atomic cross-package changes; one CI config; Turborepo per-package caching; exercises still ship independently as lazy chunks; ideal for a small team; free CI on public repo.
**Cons:** Single repo grows; CI must be path-filtered.

#### Option B: Polyrepo (one repo per exercise)
**Pros:** Hard isolation; independent release per exercise.
**Cons:** Contract/version drift; heavier coordination; overkill now.

### Trade-off analysis
Same runtime independence (registry-driven lazy modules) with far less coordination. Promote an exercise to its own repo/Package only if it ever needs an independent release cadence.

### Consequences
- **Easier:** Contract refactors; consistent tooling.
- **Harder:** Path-aware CI; bundle hygiene (lazy-load parsers + exercises).
- **Revisit when:** an exercise needs its own release train.

---

## 3. ADR-003 — No backend: client-side data with export/import sync

**Status:** Proposed · **Deciders:** Albert, engineering lead

### Context
System-design §4 originally specified a tiny auth + KV backend. GitHub can't host one, and the cost rule forbids adding a paid (or limit-capped free) service. The data is non-sensitive metadata; the privacy posture already wants everything client-side.

### Decision
**Eliminate the backend.** Persist everything in the browser via **IndexedDB**. Replace server accounts with **local profiles** (multiple profiles can coexist on one device, each labelled by a username; an optional passphrase is a soft local lock, *not* security). Provide **export/import of a JSON progress file** for backup and cross-device transfer; this file is also the account-recovery mechanism.

### Options Considered

#### Option A: Client-side only, IndexedDB + export/import — **chosen**
| Dimension | Assessment |
|-----------|------------|
| Complexity | Low |
| Cost | £0 — no runtime |
| Scalability | N/A — per-device |
| Privacy | Strongest — nothing leaves device by default |

**Pros:** No vendor, no cost, no ops; maximal privacy; offline by default; recovery file fills the gap the old email-less design had.
**Cons:** No automatic cross-device sync (manual file move); a cleared browser/profile loses data unless exported; "auth" isn't real access control.

#### Option B: Free-tier backend (Cloudflare Workers + KV)
**Pros:** Real accounts + auto sync.
**Cons:** New vendor; free-tier limits can become a bill — **violates the cost rule.** Rejected.

#### Option C: GitHub repo/Gist as a data store via API
**Pros:** Stays "on GitHub."
**Cons:** Abuse of the platform; tokens in a public client; data exposure; brittle. Rejected.

### Trade-off analysis
For non-sensitive, mostly single-device training data, client-side storage is the right size of solution and the only one that is certainly free forever. The export/import file is a clean, honest substitute for sync and recovery that keeps the zero-server promise.

### Consequences
- **Easier:** Zero ops/cost; strongest privacy; trivial offline support.
- **Harder:** Cross-device requires a manual file; must teach users to export (and we must make export prominent and painless); browser-data loss is a real risk we surface clearly.
- **Revisit when:** users demand seamless multi-device — then evaluate an optional, opt-in sync via a free service as a deliberate future trade (kept out of scope now).

### Action items
1. [ ] Make export/import a first-class, prominent feature (not buried in settings).
2. [ ] Warn at signup that data is on-device and to export a backup; offer a one-tap "download my progress."

---

## 4. GitHub infrastructure mapping (all free / already-paid)

| Concern | GitHub capability | Cost |
|---|---|---|
| Source of truth | **Public** monorepo `ascibortech/speed-reading-trainer` | Free |
| Hosting (entire app) | **GitHub Pages** (static SPA) | Free — incl. HTTPS via Let's Encrypt; free `*.github.io` domain |
| CI/CD | **GitHub Actions** | Free for public repos (no minute metering); Team plan unaffected |
| Code scanning | **CodeQL** | Free on public repos |
| Secret scanning + push protection | **GitHub secret scanning** | Free on public repos |
| Dependency updates | **Dependabot** | Free |
| Planning | **Projects + Issues + Milestones** | Included |
| Code ownership / gates | **CODEOWNERS + branch protection** | Included |
| Dev environment | **Codespaces** | Included on Team (monthly free quota) |
| Releases | **GitHub Releases + tags** | Free |
| Optional shared package | **GitHub Packages** | Free for public packages (only if ever needed) |
| Docs | Repo `/docs` (kickoff, system-design, this plan) | Free |

**Net new spend: £0.** The only thing that would cost money is a custom domain — explicitly skipped; we use the free `github.io` domain.

### 4.1 Repository structure (monorepo, no backend)

```
ascibortech/speed-reading-trainer/            (public)
├─ .github/
│  ├─ workflows/                 # ci.yml, deploy-pages.yml, codeql.yml, release.yml
│  ├─ CODEOWNERS
│  └─ dependabot.yml
├─ .devcontainer/                # Codespaces: node + pnpm
├─ apps/
│  └─ web/                       # the entire app → built static → GitHub Pages
├─ packages/
│  ├─ contracts/                 # NormalizedText, MetricEvent, Exercise contract
│  ├─ engine-core/               # lifecycle, timing, registry, metrics collector
│  ├─ storage/                   # IndexedDB layer + JSON export/import + local profiles
│  ├─ parsers/                   # lazy per-format: txt, pdf, docx, epub, mobi
│  ├─ exercise-pointer/          # MVP exercise
│  ├─ exercise-rsvp/
│  ├─ exercise-schulte/
│  ├─ exercise-chunking/
│  ├─ exercise-subvocalization/
│  ├─ exercise-comprehension/
│  ├─ exercise-memorization/     # retention + spaced repetition (system-design §5.1)
│  └─ exam-path/                 # curated passages + benchmark logic
├─ docs/
├─ turbo.json
└─ pnpm-workspace.yaml
```

Note there is **no `apps/api`** — the backend is gone. The old "sync client" is replaced by `packages/storage` (IndexedDB + export/import).

### 4.2 CI/CD pipeline (GitHub Actions, free on public repo)

```
Push / PR ──▶ [ci.yml]
              ├─ install (pnpm, cached)
              ├─ turbo lint + typecheck + unit test (path-filtered)
              ├─ build affected packages
              └─ CodeQL analysis  +  secret scanning (free, public repo)

Merge to main ──▶ [deploy-pages.yml]
                  ├─ build apps/web (static)
                  ├─ publish to GitHub Pages (production)
                  └─ create GitHub Release on version tag
```

One deploy target (Pages), no secrets to manage (no backend, no third-party tokens). Branching: trunk-based with short-lived feature branches; branch protection requires green CI + 1 CODEOWNERS review. The text-boundary invariant (system-design §2.2) is enforced by a CI lint rule forbidding the `storage`/export layer from importing the `NormalizedText` module — so the export file can *never* contain user text, only metadata.

---

## 5. Implementation phases

Each phase is a **GitHub Milestone** with a **Project board**; deliverables are issues; exit criteria gate the next phase.

### Phase 0 — Foundations & GitHub infra (Week 1)
**Goal:** A working factory before any feature.
**Deliverables:**
- Create **public** monorepo; pnpm + Turborepo scaffold; `.devcontainer` for Codespaces.
- `.github/`: CI (lint/typecheck/test), CodeQL, Dependabot, CODEOWNERS, branch protection.
- GitHub Pages enabled on the free `github.io` domain with enforced HTTPS; empty SPA deploys green.
- `packages/contracts` with `NormalizedText`, `MetricEvent`, `Exercise` interfaces.
- Projects board + Milestones for all phases.

**Exit criteria:** A trivial commit flows commit → CI → Pages automatically; CodeQL + secret scanning run free; Codespaces boots a ready dev env.

### Phase 1 — MVP: local profiles + Pointer exercise (Weeks 2–4)
**Goal:** Prove the full client-side pipeline end-to-end (system-design §9 MVP).
**Deliverables:**
- `packages/storage`: IndexedDB schema (profiles, sessions, exam runs, progress index) + JSON **export/import** + local profile creation (username + optional soft passphrase).
- `apps/web`: profile create/select, upload UI, session lifecycle, prominent "export my progress" action.
- `packages/parsers/txt` → `NormalizedText`.
- `packages/engine-core`: lifecycle, `performance.now` clock, registry, metrics collector (privacy choke point).
- `packages/exercise-pointer`: pointer/pacer (1 line/sec, 2-word margins — kickoff §6.1), registered via the contract.

**Exit criteria:** A user creates a local profile, uploads `.txt`, runs the pointer exercise, sees WPM/adherence stored in IndexedDB, and can export/import their progress to another browser — text never leaves the device (verified by network inspection: there are zero outbound data requests).
**Milestone:** 1 — *Standalone MVP.*

### Phase 2 — Speed exercises + progress profile (Weeks 5–7)
**Deliverables:**
- `packages/parsers/pdf` (pdf.js, lazy-loaded).
- `packages/exercise-rsvp` (ORP alignment, 200–300 WPM start, 50–100 WPM steps, ≥100 ms floor — kickoff §6.2).
- `packages/exercise-schulte` (`needsText:false` — ships without parsing, proving the contract flag — kickoff §6.3).
- `apps/web`: progress profile view (trajectory, completion %) read from the local index.

**Exit criteria:** Registry-driven catalogue with three exercises; progress profile renders local metadata; PDF parses or fails with a clear error (scanned-PDF handled).
**Milestone:** 2 — *Speed core + progress.*

### Phase 3 — Comprehension + exam path (Weeks 8–11)
**Deliverables:**
- `packages/exam-path`: curated app-supplied passages of controlled difficulty; baseline (3 passages) + re-test cadence 4–6 weeks; `ExamRun` records (system-design §7).
- `packages/exercise-comprehension`: MC factual + cloze + inference on curated passages; algorithmic **client-side** cloze generator for BYO text (system-design §8 — never server-side, trivially satisfied since there is no server).
- `packages/exercise-chunking` and `packages/exercise-subvocalization` (kickoff §6.4–6.5).

**Exit criteria:** Baseline exam + at least one re-test complete; comprehension % and efficiency (WPM × comprehension) in the trajectory; all four kickoff pillars represented.
**Milestone:** 3 — *Comprehension + benchmark.*

### Phase 4 — Memorization / retention (Weeks 12–14)
**Goal:** Add the fifth pillar (system-design §5.1) — proves the plugin pattern with a new capability and no core change.
**Deliverables:**
- `packages/exercise-memorization`: free recall, cued recall (reuses §8 cloze generator), sequence/structure recall; optional memory-technique scaffolding; recall scored **in-memory only**.
- Client spaced-repetition scheduler writing `recallCoveragePct` + `retentionIntervalDays` to local metadata; expanding re-test intervals + decay curve in the progress view.

**Exit criteria:** Memorization registers with zero engine-core changes; recall scored client-side, only scores persisted; spaced re-tests schedule and chart decay.
**Milestone:** 4 — *Retention.*

### Phase 5 — Format completeness + hardening (Weeks 15–18)
**Deliverables:**
- `packages/parsers/docx` (mammoth), `parsers/epub` (epubjs + JSZip), `parsers/mobi` (foliate-js / wasm) — mobi last, with "convert to epub" fallback (system-design §3.1).
- Tighten CodeQL gates (free); load-test RSVP/pointer render loops and IndexedDB write cadence.
- Optional opt-in **in-browser** LLM (WebLLM/WebGPU) for richer comprehension questions on BYO text — local only, no service, no cost (system-design §8).
- Accessibility + performance-budget pass; robust export/import (versioned schema, migration on import).

**Exit criteria:** All five formats parse or degrade gracefully; scans clean; performance budgets met; export/import survives schema changes.
**Milestone:** 5 — *Complete & hardened.*

### Phase 6 — Eye-tracking layer (future, kickoff §8)
**Deliverables:** webcam gaze stream as an engine `capability` (runs client-side, no service); exercises opt in; capture fixation duration, saccade amplitude, regression count, BCEA at ≥60 Hz (120 Hz preferred); load-test the metrics bus at high event rates.
**Exit criteria:** At least one exercise consumes gaze data; without the capability all exercises still run unchanged.
**Milestone:** 6 — *Eye-tracking (stretch).*

### 5.1 Phase dependency view

```
Phase 0 ─▶ Phase 1 ─▶ Phase 2 ─▶ Phase 3 ─▶ Phase 4 ─▶ Phase 5 ─▶ Phase 6
(infra)    (MVP)      (speed)     (compre-    (memory)   (formats   (eye-
                                   hension+              + harden)   tracking)
                                   exam)
   │          │
   │          └─ ships a usable standalone product (Pointer + .txt + local profile)
   └─ everything depends on the factory existing first
```

---

## 6. Cross-cutting concerns

**Security & privacy.** Strongest possible posture: with no backend, no data — text *or* metadata — leaves the device unless the user exports it. The text boundary is enforced in CI (the storage/export layer cannot import `NormalizedText`), in architecture (metrics collector sees only numbers), and in deployment (there is no server to receive anything). The public repo contains no secrets (it's a static frontend). Local "passphrase" is explicitly a soft lock, not access control — communicated to users honestly.

**Cost.** Marginal spend is **£0**: Pages free, Actions free on public repos, CodeQL/secret scanning/Dependabot free on public repos, Codespaces within the Team quota. No third-party services. No custom domain (free `github.io`).

**Scaling/reliability.** A static site on GitHub's CDN scales effortlessly and has no runtime to fail. All compute is on the user's device. The only durability risk is local browser data loss — mitigated by making export prominent and offering periodic export reminders.

**What we'll revisit (system-design §12):** optional opt-in cross-device sync via a free service *if* users demand it (deliberate future trade, not now); in-browser LLM becoming default for comprehension questions; eye-tracking load on the metrics bus; promoting an exercise to its own Package/repo if it needs an independent release cadence.

---

## 7. Consolidated action items

1. [ ] Create **public** repo `ascibortech/speed-reading-trainer`; enable Pages (free `github.io` domain) + enforced HTTPS.
2. [ ] Set up Projects board + phase Milestones; enable CodeQL, Dependabot, branch protection, CODEOWNERS.
3. [ ] Land Phase 0 factory (scaffold, CI/CD, Pages, contracts package, devcontainer).
4. [ ] Implement Phase 1 MVP (local profiles + IndexedDB + export/import + .txt parser + engine core + Pointer) and ship to Pages.
5. [ ] Add CI lint rule enforcing the text-boundary import restriction on the storage/export layer.
6. [ ] Make "export my progress" a prominent, first-run-educated feature.
7. [ ] Proceed through Phases 2–6, one Milestone at a time, exits gating entries.

---

## Appendix — Cost/infra facts used (verified June 2026)

- **GitHub Pages** is free, includes free Let's Encrypt HTTPS and a free `*.github.io` domain; serves static content only (perfect for a no-backend SPA).
- **GitHub Actions** has no minute metering for **public** repositories.
- **CodeQL code scanning** and **secret scanning + push protection** are **free for public repositories** (no Advanced Security purchase needed).
- **GitHub Team** (already owned) adds private-repo features we no longer need here, plus Codespaces quota and org management — so the plan stays within infra already paid for, with **no new charges**.
- A **custom domain** is the only element that would cost money; it is deliberately excluded in favour of the free `github.io` domain.

Sources: [GitHub Pages docs — securing with HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https), [GitHub Actions billing (free for public repos)](https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions), [GitHub's plans](https://docs.github.com/get-started/learning-about-github/githubs-products)
