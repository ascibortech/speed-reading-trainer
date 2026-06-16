/**
 * Chunking exercise (kickoff §6.4) — trains the reader to absorb 4–5 words per
 * fixation instead of 2–3. The passage is rendered in place and a "fixation box"
 * highlights successive word-groups at a controlled pace, so the eye learns to
 * take in a whole chunk at once rather than word-by-word.
 *
 * Pillar: visual-span. Self-contained plugin; consumes NormalizedText; registers
 * via the Exercise contract with zero engine-core changes.
 */
import type {
  Exercise,
  ExerciseContext,
  ExerciseDescriptor,
  ExerciseProvider,
  Params,
} from "@srt/contracts";

export const chunkingDescriptor: ExerciseDescriptor = {
  id: "chunking",
  title: "Chunking",
  description:
    "Highlights word-groups one at a time so you read in chunks, not single words.",
  pillar: "visual-span",
  stage: "intermediate",
  needsText: true,
  needsComprehension: false,
  paramSchema: [
    {
      key: "chunkSize",
      label: "Words per chunk",
      type: "number",
      default: 4,
      min: 2,
      max: 6,
      step: 1,
    },
    {
      key: "chunksPerSec",
      label: "Pace",
      type: "number",
      default: 1.2,
      min: 0.5,
      max: 3,
      step: 0.1,
      unit: "chunks/sec",
    },
  ],
};

class ChunkingExercise implements Exercise {
  readonly descriptor = chunkingDescriptor;

  private ctx!: ExerciseContext;
  private chunkSize = 4;
  private chunksPerSec = 1.2;

  private chunks: HTMLElement[][] = [];
  private rafId = 0;
  private running = false;
  private startMs = 0;
  private chunkIndex = 0;
  private chunkElapsed = 0;
  private lastTs = 0;
  private wordsProcessed = 0;

  async init(ctx: ExerciseContext, params: Params): Promise<void> {
    this.ctx = ctx;
    this.chunkSize = clamp(Math.round(numParam(params.chunkSize, 4)), 2, 6);
    this.chunksPerSec = numParam(params.chunksPerSec, 1.2);
    this.chunks = [];
    this.chunkIndex = 0;
    this.chunkElapsed = 0;
    this.wordsProcessed = 0;
    this.running = false;
    cancelAnimationFrame(this.rafId);

    ctx.emit({ t: "param", key: "chunkSize", value: this.chunkSize });
    ctx.emit({ t: "param", key: "chunksPerSec", value: this.chunksPerSec });

    const root = ctx.surface.root;
    root.replaceChildren();
    const pane = document.createElement("div");
    pane.className = "srt-chunk-pane";

    let current: HTMLElement[] = [];
    ctx.text.words.forEach((word, i) => {
      const span = document.createElement("span");
      span.className = "srt-chunk-word";
      span.textContent = word;
      pane.appendChild(span);
      pane.appendChild(document.createTextNode(" "));
      current.push(span);
      if (current.length === this.chunkSize || i === ctx.text.words.length - 1) {
        this.chunks.push(current);
        current = [];
      }
    });

    root.appendChild(pane);
  }

  start(): void {
    this.startMs = this.ctx.clock.now();
    this.lastTs = this.startMs;
    this.running = true;
    if (this.chunks.length === 0) {
      this.ctx.complete();
      return;
    }
    this.activate(0);
    this.loop();
  }

  pause(): void {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  resume(): void {
    if (this.running || this.chunkIndex >= this.chunks.length) return;
    this.running = true;
    this.lastTs = this.ctx.clock.now();
    this.loop();
  }

  teardown(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.ctx?.surface.clear();
    this.chunks = [];
  }

  private loop = (): void => {
    if (!this.running) return;
    const now = this.ctx.clock.now();
    this.chunkElapsed += now - this.lastTs;
    this.lastTs = now;

    const chunkMs = 1000 / this.chunksPerSec;
    if (this.chunkElapsed >= chunkMs) {
      this.wordsProcessed += this.chunks[this.chunkIndex].length;
      this.deactivate(this.chunkIndex);
      this.chunkIndex += 1;
      this.chunkElapsed = 0;
      this.emitProgress();
      if (this.chunkIndex >= this.chunks.length) {
        this.running = false;
        this.ctx.complete();
        return;
      }
      this.activate(this.chunkIndex);
    }
    this.rafId = requestAnimationFrame(this.loop);
  };

  private activate(i: number): void {
    this.chunks[i]?.forEach((s) => s.classList.add("active"));
  }
  private deactivate(i: number): void {
    this.chunks[i]?.forEach((s) => s.classList.remove("active"));
  }

  private emitProgress(): void {
    this.ctx.emit({
      t: "progress",
      wordsProcessed: this.wordsProcessed,
      atMs: this.ctx.clock.now() - this.startMs,
    });
    const min = (this.ctx.clock.now() - this.startMs) / 60000;
    if (min > 0) this.ctx.emit({ t: "wpm", value: this.wordsProcessed / min });
  }
}

function numParam(v: unknown, fallback: number): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function createChunkingExercise(): Exercise {
  return new ChunkingExercise();
}

export const chunkingProvider: ExerciseProvider = {
  descriptor: chunkingDescriptor,
  create: createChunkingExercise,
};
