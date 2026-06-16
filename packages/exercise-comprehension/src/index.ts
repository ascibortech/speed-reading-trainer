/**
 * Comprehension exercise (kickoff §6.6, system-design §8). The reader reads a
 * passage at their own pace (timed → WPM), then answers algorithmically-generated
 * questions (cloze / true-false) built from the passage itself. The collector
 * derives comprehension % from the emitted answer events and efficiency = WPM ×
 * comprehension.
 *
 * Questions are generated entirely client-side from the in-memory text — it is
 * never transmitted (the text boundary, system-design §2.2).
 */
import type {
  Exercise,
  ExerciseContext,
  ExerciseDescriptor,
  ExerciseProvider,
  Params,
} from "@srt/contracts";
import { generateQuestions, type Question } from "@srt/comprehension";

export const comprehensionDescriptor: ExerciseDescriptor = {
  id: "comprehension",
  title: "Comprehension",
  description:
    "Read a passage, then answer auto-generated questions — measures retention, not just speed.",
  pillar: "comprehension",
  stage: "intermediate",
  needsText: true,
  needsComprehension: true,
  paramSchema: [
    {
      key: "questionCount",
      label: "Questions",
      type: "number",
      default: 5,
      min: 3,
      max: 8,
      step: 1,
    },
  ],
};

class ComprehensionExercise implements Exercise {
  readonly descriptor = comprehensionDescriptor;

  private ctx!: ExerciseContext;
  private questions: Question[] = [];
  private selections: number[] = [];
  private startMs = 0;
  private quizStartMs = 0;
  private wordCount = 0;

  async init(ctx: ExerciseContext, params: Params): Promise<void> {
    this.ctx = ctx;
    this.wordCount = ctx.text.wordCount;
    const count = Math.round(numParam(params.questionCount, 5));
    this.questions = generateQuestions(ctx.text, { count });
    this.selections = new Array(this.questions.length).fill(-1);
    ctx.emit({ t: "param", key: "questionCount", value: this.questions.length });
    this.renderReading();
  }

  start(): void {
    this.startMs = this.ctx.clock.now();
  }

  // Reading is self-paced; pause/resume are no-ops beyond the engine state.
  pause(): void {}
  resume(): void {}

  teardown(): void {
    this.ctx?.surface.clear();
    this.questions = [];
    this.selections = [];
  }

  private renderReading(): void {
    const root = this.ctx.surface.root;
    root.replaceChildren();
    const wrap = el("div", "srt-comp");

    const pane = el("div", "srt-comp-pane");
    pane.textContent = this.ctx.text.words.join(" ");

    const done = document.createElement("button");
    done.className = "primary";
    done.textContent = "I've finished reading";
    done.addEventListener("click", () => this.onFinishedReading());

    wrap.append(pane, done);
    root.appendChild(wrap);
  }

  private onFinishedReading(): void {
    const min = (this.ctx.clock.now() - this.startMs) / 60000;
    const wpm = min > 0 ? this.wordCount / min : 0;
    this.ctx.emit({ t: "progress", wordsProcessed: this.wordCount, atMs: min * 60000 });
    this.ctx.emit({ t: "wpm", value: round(wpm) });

    if (this.questions.length === 0) {
      // Passage too small to generate questions — finish with speed only.
      this.ctx.complete();
      return;
    }
    this.quizStartMs = this.ctx.clock.now();
    this.renderQuiz();
  }

  private renderQuiz(): void {
    const root = this.ctx.surface.root;
    root.replaceChildren();
    const wrap = el("div", "srt-comp-quiz");
    wrap.appendChild(el("h3", "")).textContent = "Questions";

    this.questions.forEach((q, qi) => {
      const block = el("div", "srt-comp-q");
      block.appendChild(el("p", "srt-comp-prompt")).textContent = `${qi + 1}. ${q.prompt}`;
      const opts = el("div", "srt-comp-options");
      q.options.forEach((opt, oi) => {
        const btn = document.createElement("button");
        btn.className = "srt-comp-option";
        btn.textContent = opt;
        btn.addEventListener("click", () => {
          this.selections[qi] = oi;
          opts
            .querySelectorAll(".srt-comp-option")
            .forEach((b) => b.classList.remove("chosen"));
          btn.classList.add("chosen");
          this.refreshSubmit();
        });
        opts.appendChild(btn);
      });
      block.appendChild(opts);
      wrap.appendChild(block);
    });

    const submit = document.createElement("button");
    submit.className = "primary submit";
    submit.textContent = "Submit answers";
    submit.disabled = true;
    submit.addEventListener("click", () => this.onSubmit());
    wrap.appendChild(submit);

    root.appendChild(wrap);
    this.submitBtn = submit;
  }

  private submitBtn: HTMLButtonElement | null = null;

  private refreshSubmit(): void {
    if (this.submitBtn) {
      this.submitBtn.disabled = this.selections.some((s) => s < 0);
    }
  }

  private onSubmit(): void {
    const responseMs = this.ctx.clock.now() - this.quizStartMs;
    this.questions.forEach((q, i) => {
      this.ctx.emit({
        t: "answer",
        questionId: q.id,
        correct: this.selections[i] === q.answerIndex,
        responseMs: Math.round(responseMs / this.questions.length),
      });
    });
    this.ctx.complete();
  }
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

export function createComprehensionExercise(): Exercise {
  return new ComprehensionExercise();
}

export const comprehensionProvider: ExerciseProvider = {
  descriptor: comprehensionDescriptor,
  create: createComprehensionExercise,
};
