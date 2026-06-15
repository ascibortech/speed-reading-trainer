/**
 * Pointer / Pacer exercise (kickoff §6.1) — the MVP exercise (system-design §9).
 *
 * A visual pointer guides the eye across each line at a controlled pace (baseline
 * 1 line/sec). It starts ~2 words in and ends ~2 words before the line end — the
 * eyes use peripheral vision for the margins. Self-contained: owns its rendering
 * and params, consumes NormalizedText, and registers via the Exercise contract
 * with zero engine-core changes.
 *
 * Captured metadata: pace (lines/sec), words processed, calculated WPM, duration.
 * (True pointer-adherence needs the eye-tracking capability — kickoff §8 — so it
 * is intentionally NOT fabricated here.)
 */
import type {
  Exercise,
  ExerciseContext,
  ExerciseDescriptor,
  ExerciseProvider,
  Params,
} from "@srt/contracts";

export const pointerDescriptor: ExerciseDescriptor = {
  id: "pointer",
  title: "Pointer / Pacer",
  description:
    "A pacer sweeps each line at a steady pace to curb regression and enforce rhythm.",
  pillar: "eye-movement",
  stage: "beginner",
  needsText: true,
  needsComprehension: false,
  paramSchema: [
    {
      key: "linesPerSec",
      label: "Pace",
      type: "number",
      default: 1,
      min: 0.3,
      max: 3,
      step: 0.1,
      unit: "lines/sec",
    },
    {
      key: "marginWords",
      label: "Edge margin",
      type: "number",
      default: 2,
      min: 0,
      max: 4,
      step: 1,
      unit: "words",
    },
  ],
};

interface Line {
  spans: HTMLElement[];
  top: number;
  startX: number;
  endX: number;
}

class PointerExercise implements Exercise {
  readonly descriptor = pointerDescriptor;

  private ctx!: ExerciseContext;
  private linesPerSec = 1;
  private marginWords = 2;

  private container: HTMLElement | null = null;
  private pointerEl: HTMLElement | null = null;
  private spans: HTMLElement[] = [];
  private lines: Line[] = [];

  private rafId = 0;
  private running = false;
  private startMs = 0;
  private lineIndex = 0;
  private lineElapsed = 0;
  private lastTs = 0;
  private wordsProcessed = 0;

  async init(ctx: ExerciseContext, params: Params): Promise<void> {
    this.ctx = ctx;
    this.linesPerSec = numParam(params.linesPerSec, 1);
    this.marginWords = Math.round(numParam(params.marginWords, 2));

    // Reset run state — the registry reuses one instance across sessions.
    this.spans = [];
    this.lines = [];
    this.lineIndex = 0;
    this.lineElapsed = 0;
    this.wordsProcessed = 0;
    this.running = false;
    cancelAnimationFrame(this.rafId);

    ctx.emit({ t: "param", key: "linesPerSec", value: this.linesPerSec });
    ctx.emit({ t: "param", key: "marginWords", value: this.marginWords });

    const root = ctx.surface.root;
    root.replaceChildren();

    const container = document.createElement("div");
    container.className = "srt-pointer-pane";
    container.style.position = "relative";
    container.style.lineHeight = "2.2";

    for (const word of ctx.text.words) {
      const span = document.createElement("span");
      span.className = "srt-word";
      span.textContent = word;
      container.appendChild(span);
      container.appendChild(document.createTextNode(" "));
      this.spans.push(span);
    }

    const pointer = document.createElement("div");
    pointer.className = "srt-pointer";
    pointer.style.position = "absolute";
    pointer.style.height = "3px";
    pointer.style.width = "1.6em";
    pointer.style.background = "var(--accent, #2563eb)";
    pointer.style.borderRadius = "2px";
    pointer.style.pointerEvents = "none";
    pointer.style.transition = "none";
    container.appendChild(pointer);

    root.appendChild(container);
    this.container = container;
    this.pointerEl = pointer;

    this.computeLines();
  }

  /** Group word spans into visual lines by vertical offset, after layout. */
  private computeLines(): void {
    const container = this.container;
    if (!container) return;
    const cRect = container.getBoundingClientRect();
    const byTop = new Map<number, HTMLElement[]>();
    for (const span of this.spans) {
      const top = Math.round(span.offsetTop);
      const arr = byTop.get(top) ?? [];
      arr.push(span);
      byTop.set(top, arr);
    }

    const lines: Line[] = [];
    for (const top of [...byTop.keys()].sort((a, b) => a - b)) {
      const spans = byTop.get(top)!;
      const m = Math.min(this.marginWords, Math.floor((spans.length - 1) / 2));
      const startSpan = spans[m] ?? spans[0];
      const endSpan = spans[spans.length - 1 - m] ?? spans[spans.length - 1];
      const startRect = startSpan.getBoundingClientRect();
      const endRect = endSpan.getBoundingClientRect();
      lines.push({
        spans,
        top: top,
        startX: startRect.left - cRect.left,
        endX: endRect.right - cRect.left,
      });
    }
    this.lines = lines;
  }

  start(): void {
    this.startMs = this.ctx.clock.now();
    this.lastTs = this.startMs;
    this.running = true;
    if (this.lines.length === 0) {
      // No measurable layout (e.g. headless) — nothing to pace; finish cleanly.
      this.wordsProcessed = this.ctx.text.wordCount;
      this.emitProgress();
      this.ctx.complete();
      return;
    }
    this.placePointer();
    this.loop();
  }

  pause(): void {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  resume(): void {
    if (this.running || this.lineIndex >= this.lines.length) return;
    this.running = true;
    this.lastTs = this.ctx.clock.now();
    this.loop();
  }

  teardown(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.ctx?.surface.clear();
    // Release all references to rendered text (text boundary hygiene).
    this.spans = [];
    this.lines = [];
    this.container = null;
    this.pointerEl = null;
  }

  private loop = (): void => {
    if (!this.running) return;
    const now = this.ctx.clock.now();
    const dt = now - this.lastTs;
    this.lastTs = now;

    const lineMs = 1000 / this.linesPerSec;
    this.lineElapsed += dt;

    const line = this.lines[this.lineIndex];
    const frac = Math.min(1, this.lineElapsed / lineMs);
    this.movePointer(line, frac);

    if (frac >= 1) {
      this.wordsProcessed += line.spans.length;
      this.lineIndex += 1;
      this.lineElapsed = 0;
      this.emitProgress();
      if (this.lineIndex >= this.lines.length) {
        this.emitWpm();
        this.running = false;
        this.ctx.complete();
        return;
      }
      this.placePointer();
    }

    this.rafId = requestAnimationFrame(this.loop);
  };

  private placePointer(): void {
    const line = this.lines[this.lineIndex];
    if (line) this.movePointer(line, 0);
  }

  private movePointer(line: Line, frac: number): void {
    if (!this.pointerEl) return;
    const x = line.startX + frac * (line.endX - line.startX);
    this.pointerEl.style.left = `${x}px`;
    this.pointerEl.style.top = `${line.top}px`;
  }

  private emitProgress(): void {
    this.ctx.emit({
      t: "progress",
      wordsProcessed: this.wordsProcessed,
      atMs: this.ctx.clock.now() - this.startMs,
    });
    this.emitWpm();
  }

  private emitWpm(): void {
    const elapsedMin = (this.ctx.clock.now() - this.startMs) / 60000;
    if (elapsedMin > 0) {
      this.ctx.emit({ t: "wpm", value: this.wordsProcessed / elapsedMin });
    }
  }
}

function numParam(v: unknown, fallback: number): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
}

/** Factory — a fresh instance per run. */
export function createPointerExercise(): Exercise {
  return new PointerExercise();
}

/** What the app registers (system-design §3.2). */
export const pointerProvider: ExerciseProvider = {
  descriptor: pointerDescriptor,
  create: createPointerExercise,
};
