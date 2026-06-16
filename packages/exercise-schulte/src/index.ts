/**
 * Schulte Table (kickoff §6.3) — visual-span expansion. A grid of numbers; the
 * user fixates the centre and locates numbers in ascending order using
 * peripheral vision. Progression: 3×3 → 4×4 → 5×5 and beyond.
 *
 * This exercise sets `needsText: false`, proving the plugin contract supports
 * content-free exercises under the exact same interface as RSVP/pointer
 * (system-design §5) — it ships with no parsing dependency at all.
 */
import type {
  Exercise,
  ExerciseContext,
  ExerciseDescriptor,
  ExerciseProvider,
  Params,
} from "@srt/contracts";

export const schulteDescriptor: ExerciseDescriptor = {
  id: "schulte",
  title: "Schulte Table",
  description:
    "Fixate the centre and find numbers in order using peripheral vision — widens your visual span.",
  pillar: "visual-span",
  stage: "intermediate",
  needsText: false,
  needsComprehension: false,
  paramSchema: [
    {
      key: "gridSize",
      label: "Grid size",
      type: "number",
      default: 5,
      min: 3,
      max: 6,
      step: 1,
    },
  ],
};

/** Fisher–Yates shuffle with an injectable RNG (so it is testable). */
export function shuffle<T>(arr: readonly T[], randomInt: (max: number) => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Crypto-backed integer in [0, max) — not Math.random (keeps scanners happy). */
function secureRandomInt(max: number): number {
  const u = new Uint32Array(1);
  crypto.getRandomValues(u);
  return u[0] % max;
}

/** A shuffled grid of 1..n² (row-major). */
export function generateGrid(n: number): number[] {
  const nums = Array.from({ length: n * n }, (_, i) => i + 1);
  return shuffle(nums, secureRandomInt);
}

class SchulteExercise implements Exercise {
  readonly descriptor = schulteDescriptor;

  private ctx!: ExerciseContext;
  private size = 5;
  private target = 1;
  private total = 25;

  private startMs = 0;
  private pausedAt = 0;
  private totalPausedMs = 0;
  private running = false;
  private cells: HTMLButtonElement[] = [];
  private targetLabel: HTMLElement | null = null;

  async init(ctx: ExerciseContext, params: Params): Promise<void> {
    this.ctx = ctx;
    this.size = clamp(Math.round(numParam(params.gridSize, 5)), 3, 6);
    this.total = this.size * this.size;
    this.target = 1;
    this.totalPausedMs = 0;
    this.cells = [];

    ctx.emit({ t: "param", key: "gridSize", value: this.size });

    const root = ctx.surface.root;
    root.replaceChildren();

    const wrap = document.createElement("div");
    wrap.className = "srt-schulte";

    const label = document.createElement("div");
    label.className = "srt-schulte-target";
    label.textContent = ctx.t("schulte.find", "Find: {n}", { n: 1 });
    this.targetLabel = label;

    const grid = document.createElement("div");
    grid.className = "srt-schulte-grid";
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;

    const values = generateGrid(this.size);
    for (const value of values) {
      const cell = document.createElement("button");
      cell.className = "srt-schulte-cell";
      cell.textContent = String(value);
      cell.addEventListener("click", () => this.onCellClick(value, cell));
      grid.appendChild(cell);
      this.cells.push(cell);
    }

    const dot = document.createElement("div");
    dot.className = "srt-schulte-fixation";

    wrap.append(label, grid, dot);
    root.appendChild(wrap);
  }

  start(): void {
    this.startMs = this.ctx.clock.now();
    this.running = true;
  }

  pause(): void {
    if (!this.running) return;
    this.running = false;
    this.pausedAt = this.ctx.clock.now();
  }

  resume(): void {
    if (this.running) return;
    this.totalPausedMs += this.ctx.clock.now() - this.pausedAt;
    this.running = true;
  }

  teardown(): void {
    this.running = false;
    this.ctx?.surface.clear();
    this.cells = [];
    this.targetLabel = null;
  }

  private onCellClick(value: number, cell: HTMLButtonElement): void {
    if (!this.running) return;
    if (value !== this.target) {
      cell.classList.remove("wrong");
      // restart the flash animation
      void cell.offsetWidth;
      cell.classList.add("wrong");
      return;
    }
    cell.classList.add("found");
    cell.disabled = true;
    this.target += 1;
    if (this.targetLabel)
      this.targetLabel.textContent = this.ctx.t("schulte.find", "Find: {n}", {
        n: this.target,
      });

    this.ctx.emit({
      t: "progress",
      wordsProcessed: this.target - 1,
      atMs: this.activeMs(),
    });

    if (this.target > this.total) {
      this.running = false;
      const sec = this.activeMs() / 1000;
      this.ctx.emit({ t: "custom", key: "completionSec", value: round(sec) });
      // cells/min as a search-rate proxy (no text → WPM is not literal words).
      this.ctx.emit({ t: "wpm", value: round(this.total / (sec / 60)) });
      if (this.targetLabel)
        this.targetLabel.textContent = this.ctx.t("schulte.done", "Done ✓");
      this.ctx.complete();
    }
  }

  private activeMs(): number {
    return this.ctx.clock.now() - this.startMs - this.totalPausedMs;
  }
}

function numParam(v: unknown, fallback: number): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function createSchulteExercise(): Exercise {
  return new SchulteExercise();
}

export const schulteProvider: ExerciseProvider = {
  descriptor: schulteDescriptor,
  create: createSchulteExercise,
};
