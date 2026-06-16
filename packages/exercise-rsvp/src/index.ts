/**
 * RSVP — Rapid Serial Visual Presentation (kickoff §6.2). Words flash one (or a
 * small group) at a time at a single fixed point, eliminating saccades. Each
 * frame is aligned on its Optimal Recognition Point (ORP) for consistent visual
 * flow. Start 200–300 WPM; step 50–100 WPM; minimum display floor ~100 ms.
 *
 * Self-contained plugin: consumes NormalizedText, owns its rendering and params,
 * registers via the Exercise contract with zero engine-core changes.
 */
import type {
  Exercise,
  ExerciseContext,
  ExerciseDescriptor,
  ExerciseProvider,
  Params,
} from "@srt/contracts";

/** Minimum per-frame display time (kickoff §6.2). */
export const MIN_FRAME_MS = 100;

/** Optimal Recognition Point: the pivot letter index, left of centre. */
export function computeOrp(len: number): number {
  if (len <= 1) return 0;
  if (len <= 5) return 1;
  if (len <= 9) return 2;
  if (len <= 13) return 3;
  return 4;
}

/** Per-frame duration for a target WPM and chunk size, with the floor applied. */
export function frameDurationMs(wpm: number, chunkSize: number): number {
  return Math.max(MIN_FRAME_MS, (60000 / wpm) * chunkSize);
}

export const rsvpDescriptor: ExerciseDescriptor = {
  id: "rsvp",
  title: "RSVP",
  description:
    "Words flash at a fixed point so the eyes never move — pushes raw recognition speed.",
  pillar: "eye-movement",
  stage: "intermediate",
  needsText: true,
  needsComprehension: false,
  paramSchema: [
    {
      key: "wpm",
      label: "Speed",
      type: "number",
      default: 300,
      min: 100,
      max: 900,
      step: 25,
      unit: "WPM",
    },
    {
      key: "chunkSize",
      label: "Words per frame",
      type: "number",
      default: 1,
      min: 1,
      max: 4,
      step: 1,
    },
  ],
};

class RsvpExercise implements Exercise {
  readonly descriptor = rsvpDescriptor;

  private ctx!: ExerciseContext;
  private wpm = 300;
  private chunkSize = 1;

  private frames: string[][] = [];
  private leftEl: HTMLElement | null = null;
  private pivotEl: HTMLElement | null = null;
  private rightEl: HTMLElement | null = null;

  private rafId = 0;
  private running = false;
  private startMs = 0;
  private frameIndex = 0;
  private frameElapsed = 0;
  private lastTs = 0;
  private wordsProcessed = 0;

  async init(ctx: ExerciseContext, params: Params): Promise<void> {
    this.ctx = ctx;
    this.wpm = numParam(params.wpm, 300);
    this.chunkSize = Math.max(1, Math.round(numParam(params.chunkSize, 1)));

    this.frames = chunkWords(ctx.text.words, this.chunkSize);
    this.frameIndex = 0;
    this.frameElapsed = 0;
    this.wordsProcessed = 0;
    this.running = false;
    cancelAnimationFrame(this.rafId);

    ctx.emit({ t: "param", key: "wpm", value: this.wpm });
    ctx.emit({ t: "param", key: "chunkSize", value: this.chunkSize });

    const root = ctx.surface.root;
    root.replaceChildren();

    const stage = document.createElement("div");
    stage.className = "srt-rsvp-stage";

    const ticks = ["srt-rsvp-tick top", "srt-rsvp-tick bottom"];
    const row = document.createElement("div");
    row.className = "srt-rsvp-row";
    const left = el("span", "srt-rsvp-left");
    const pivot = el("span", "srt-rsvp-pivot");
    const right = el("span", "srt-rsvp-right");
    row.append(left, pivot, right);

    stage.append(el("div", ticks[0]), row, el("div", ticks[1]));
    root.appendChild(stage);

    this.leftEl = left;
    this.pivotEl = pivot;
    this.rightEl = right;
    this.renderFrame();
  }

  start(): void {
    this.startMs = this.ctx.clock.now();
    this.lastTs = this.startMs;
    this.running = true;
    if (this.frames.length === 0) {
      this.ctx.complete();
      return;
    }
    this.loop();
  }

  pause(): void {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  resume(): void {
    if (this.running || this.frameIndex >= this.frames.length) return;
    this.running = true;
    this.lastTs = this.ctx.clock.now();
    this.loop();
  }

  teardown(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.ctx?.surface.clear();
    this.frames = [];
    this.leftEl = this.pivotEl = this.rightEl = null;
  }

  private loop = (): void => {
    if (!this.running) return;
    const now = this.ctx.clock.now();
    this.frameElapsed += now - this.lastTs;
    this.lastTs = now;

    const frameMs = frameDurationMs(this.wpm, this.chunkSize);
    if (this.frameElapsed >= frameMs) {
      this.wordsProcessed += this.frames[this.frameIndex].length;
      this.frameIndex += 1;
      this.frameElapsed = 0;
      this.emitProgress();
      if (this.frameIndex >= this.frames.length) {
        this.running = false;
        this.ctx.complete();
        return;
      }
      this.renderFrame();
    }
    this.rafId = requestAnimationFrame(this.loop);
  };

  private renderFrame(): void {
    const frame = this.frames[this.frameIndex];
    if (!frame || !this.pivotEl || !this.leftEl || !this.rightEl) return;
    const word = frame.join(" ");
    const orp = computeOrp(word.length);
    this.leftEl.textContent = word.slice(0, orp);
    this.pivotEl.textContent = word.slice(orp, orp + 1);
    this.rightEl.textContent = word.slice(orp + 1);
  }

  private emitProgress(): void {
    this.ctx.emit({
      t: "progress",
      wordsProcessed: this.wordsProcessed,
      atMs: this.ctx.clock.now() - this.startMs,
    });
    this.ctx.emit({ t: "wpm", value: this.wpm });
  }
}

function chunkWords(words: string[], size: number): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < words.length; i += size) {
    out.push(words.slice(i, i + size));
  }
  return out;
}

function el(tag: string, className: string): HTMLElement {
  const e = document.createElement(tag);
  e.className = className;
  return e;
}

function numParam(v: unknown, fallback: number): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
}

export function createRsvpExercise(): Exercise {
  return new RsvpExercise();
}

export const rsvpProvider: ExerciseProvider = {
  descriptor: rsvpDescriptor,
  create: createRsvpExercise,
};
