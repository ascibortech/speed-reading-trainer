/**
 * Memorization / retention exercise (system-design §5.1) — the fifth pedagogical
 * pillar. The reader studies a passage, the text is removed, and they reconstruct
 * it. Three modes share one contract:
 *   • free      — type everything you remember; scored by content-word coverage.
 *   • cued      — cloze-from-memory (reuses the §8 cloze generator).
 *   • sequence  — reorder shuffled sentences; scored by position accuracy.
 *
 * Recalled/typed text is scored IN MEMORY and dropped — only the resulting score
 * is emitted (the text boundary, §2.2). Proves the plugin pattern handles a brand
 * new pillar with zero engine-core changes.
 */
import type {
  Exercise,
  ExerciseContext,
  ExerciseDescriptor,
  ExerciseProvider,
  Params,
} from "@srt/contracts";
import { generateQuestions, type Question } from "@srt/comprehension";
import { orderingAccuracy, scoreRecallCoverage } from "./scoring.js";

export { scoreRecallCoverage, orderingAccuracy, contentWordSet } from "./scoring.js";

type Mode = "free" | "cued" | "sequence";

const TECHNIQUE_HINT: Record<string, string> = {
  none: "",
  chunk: "Group the ideas into a few chunks and link them as you read.",
  loci: "Place each idea at a spot along a familiar route (method of loci).",
  keyword: "Turn key ideas into vivid mental images as you read.",
};

export const memorizationDescriptor: ExerciseDescriptor = {
  id: "memorization",
  title: "Memorization",
  description:
    "Study a passage, then reconstruct it from memory — trains retention, the fifth pillar.",
  pillar: "retention",
  stage: "advanced",
  needsText: true,
  needsComprehension: false,
  paramSchema: [
    {
      key: "mode",
      label: "Recall mode",
      type: "enum",
      default: "free",
      options: [
        { value: "free", label: "Free recall" },
        { value: "cued", label: "Cued (fill the blanks)" },
        { value: "sequence", label: "Reorder sentences" },
      ],
    },
    {
      key: "technique",
      label: "Memory technique",
      type: "enum",
      default: "none",
      options: [
        { value: "none", label: "None" },
        { value: "chunk", label: "Chunk & associate" },
        { value: "loci", label: "Method of loci" },
        { value: "keyword", label: "Keyword imaging" },
      ],
    },
  ],
};

class MemorizationExercise implements Exercise {
  readonly descriptor = memorizationDescriptor;

  private ctx!: ExerciseContext;
  private mode: Mode = "free";
  private technique = "none";
  private retentionIntervalDays = 0;
  private startMs = 0;
  private wordCount = 0;

  async init(ctx: ExerciseContext, params: Params): Promise<void> {
    this.ctx = ctx;
    this.mode = (String(params.mode ?? "free") as Mode) || "free";
    this.technique = String(params.technique ?? "none");
    this.retentionIntervalDays = numParam(params.retentionIntervalDays, 0);
    this.wordCount = ctx.text.wordCount;
    ctx.emit({ t: "param", key: "mode", value: this.mode });
    ctx.emit({ t: "param", key: "technique", value: this.technique });
    this.renderStudy();
  }

  start(): void {
    this.startMs = this.ctx.clock.now();
  }
  pause(): void {}
  resume(): void {}

  teardown(): void {
    this.ctx?.surface.clear();
  }

  // ── Study phase ────────────────────────────────────────────────────────────
  private renderStudy(): void {
    const root = this.ctx.surface.root;
    root.replaceChildren();
    const wrap = el("div", "srt-comp");
    wrap.appendChild(el("h3", "")).textContent = this.ctx.t("mem.study", "Study this passage");

    const hint = TECHNIQUE_HINT[this.technique];
    if (hint) {
      wrap.appendChild(el("p", "srt-subvoc-hint")).textContent = this.ctx.t(
        `mem.hint.${this.technique}`,
        hint,
      );
    }

    const pane = el("div", "srt-comp-pane");
    pane.textContent = this.ctx.text.words.join(" ");
    wrap.appendChild(pane);

    const done = document.createElement("button");
    done.className = "primary";
    done.textContent = this.ctx.t("mem.done", "Hide & recall");
    done.addEventListener("click", () => this.onStudied());
    wrap.appendChild(done);
    root.appendChild(wrap);
  }

  private onStudied(): void {
    const min = (this.ctx.clock.now() - this.startMs) / 60000;
    if (min > 0) this.ctx.emit({ t: "wpm", value: round(this.wordCount / min) });
    if (this.mode === "cued") this.renderCued();
    else if (this.mode === "sequence") this.renderSequence();
    else this.renderFree();
  }

  // ── Free recall ──────────────────────────────────────────────────────────--
  private renderFree(): void {
    const root = this.ctx.surface.root;
    root.replaceChildren();
    const wrap = el("div", "srt-comp");
    wrap.appendChild(el("h3", "")).textContent = this.ctx.t(
      "mem.freePrompt",
      "Type everything you remember",
    );
    const area = document.createElement("textarea");
    area.className = "srt-mem-recall";
    area.rows = 8;
    wrap.appendChild(area);

    const score = document.createElement("button");
    score.className = "primary";
    score.textContent = this.ctx.t("mem.score", "Score recall");
    score.addEventListener("click", () => {
      // Scored in memory; the typed text is never emitted or stored.
      const pct = scoreRecallCoverage(this.ctx.text.words, area.value);
      area.value = "";
      this.finish(pct);
    });
    wrap.appendChild(score);
    root.appendChild(wrap);
  }

  // ── Cued recall (cloze from memory) ─────────────────────────────────────────
  private renderCued(): void {
    const questions = generateQuestions(this.ctx.text, { count: 5 });
    if (questions.length === 0) return this.finish(0);
    const root = this.ctx.surface.root;
    root.replaceChildren();
    const wrap = el("div", "srt-comp-quiz");
    wrap.appendChild(el("h3", "")).textContent = this.ctx.t(
      "mem.cuedPrompt",
      "Fill the blanks from memory",
    );
    const selections = new Array<number>(questions.length).fill(-1);

    questions.forEach((q: Question, qi: number) => {
      const block = el("div", "srt-comp-q");
      block.appendChild(el("p", "srt-comp-prompt")).textContent = `${qi + 1}. ${q.prompt}`;
      const opts = el("div", "srt-comp-options");
      q.options.forEach((opt, oi) => {
        const btn = document.createElement("button");
        btn.className = "srt-comp-option";
        btn.textContent = opt;
        btn.addEventListener("click", () => {
          selections[qi] = oi;
          opts.querySelectorAll(".srt-comp-option").forEach((b) => b.classList.remove("chosen"));
          btn.classList.add("chosen");
          submit.disabled = selections.some((s) => s < 0);
        });
        opts.appendChild(btn);
      });
      block.appendChild(opts);
      wrap.appendChild(block);
    });

    const submit = document.createElement("button");
    submit.className = "primary submit";
    submit.disabled = true;
    submit.textContent = this.ctx.t("comp.submit", "Submit answers");
    submit.addEventListener("click", () => {
      const correct = questions.filter((q, i) => selections[i] === q.answerIndex).length;
      this.finish(Math.round((correct / questions.length) * 100));
    });
    wrap.appendChild(submit);
    root.appendChild(wrap);
  }

  // ── Sequence / structure recall ─────────────────────────────────────────────
  private renderSequence(): void {
    const sentences = this.ctx.text.sentences
      .slice(0, 6)
      .map((s) => this.ctx.text.words.slice(s.start, s.end).join(" "));
    if (sentences.length < 2) return this.finish(0);

    const order = sentences.map((_, i) => i);
    const shuffled = shuffle(order);
    const given: number[] = [];

    const root = this.ctx.surface.root;
    root.replaceChildren();
    const wrap = el("div", "srt-comp");
    wrap.appendChild(el("h3", "")).textContent = this.ctx.t(
      "mem.seqPrompt",
      "Click the sentences back in their original order",
    );

    const chips = el("div", "srt-mem-chips");
    for (const idx of shuffled) {
      const chip = document.createElement("button");
      chip.className = "srt-mem-chip";
      chip.textContent = sentences[idx];
      chip.addEventListener("click", () => {
        if (chip.disabled) return;
        chip.disabled = true;
        chip.classList.add("picked");
        given.push(idx);
        if (given.length === sentences.length) {
          this.finish(orderingAccuracy(order, given));
        }
      });
      chips.appendChild(chip);
    }
    wrap.appendChild(chips);
    root.appendChild(wrap);
  }

  // ── Completion ──────────────────────────────────────────────────────────────
  private finish(recallPct: number): void {
    this.ctx.emit({ t: "custom", key: "recallCoveragePct", value: recallPct });
    this.ctx.emit({
      t: "custom",
      key: "retentionIntervalDays",
      value: this.retentionIntervalDays,
    });
    this.ctx.emit({ t: "progress", wordsProcessed: this.wordCount, atMs: 0 });

    const root = this.ctx.surface.root;
    root.replaceChildren();
    const wrap = el("div", "srt-comp");
    const h = el("h3", "");
    h.textContent = this.ctx.t("mem.result", "Recall: {pct}%", { pct: recallPct });
    wrap.appendChild(h);
    const done = document.createElement("button");
    done.className = "primary";
    done.textContent = this.ctx.t("mem.finish", "Finish & save");
    done.addEventListener("click", () => this.ctx.complete());
    wrap.appendChild(done);
    root.appendChild(wrap);
  }
}

function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const u = new Uint32Array(1);
    crypto.getRandomValues(u);
    const j = u[0] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function el(tag: string, className: string): HTMLElement {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}
function numParam(v: unknown, fallback: number): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
}
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function createMemorizationExercise(): Exercise {
  return new MemorizationExercise();
}

export const memorizationProvider: ExerciseProvider = {
  descriptor: memorizationDescriptor,
  create: createMemorizationExercise,
};
