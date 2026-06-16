/**
 * Subvocalization-reduction exercise (kickoff §6.5). The reader occupies the
 * phonological loop (silent counting, humming, or light tapping) so the
 * speech-motor system can't narrate. It is an A/B drill: read one segment
 * normally (baseline), then another while applying a technique, then self-report.
 * Goal is *reduction*, not elimination.
 *
 * Captured: technique, baseline WPM, WPM-with-technique, speed delta, self-rated
 * difficulty (1–10), comprehension maintained (Y/N). Pillar: subvocalization.
 */
import type {
  Exercise,
  ExerciseContext,
  ExerciseDescriptor,
  ExerciseProvider,
  Params,
} from "@srt/contracts";

export const subvocalizationDescriptor: ExerciseDescriptor = {
  id: "subvocalization",
  title: "Subvocalization",
  description:
    "Read once normally, then again while occupying your inner voice — measures the speed gain.",
  pillar: "subvocalization",
  stage: "advanced",
  needsText: true,
  needsComprehension: false,
  paramSchema: [
    {
      key: "technique",
      label: "Technique",
      type: "enum",
      default: "count",
      options: [
        { value: "count", label: "Silent counting (1-2-3-4)" },
        { value: "hum", label: "Humming" },
        { value: "tap", label: "Rhythmic tapping" },
      ],
    },
  ],
};

const TECHNIQUE_HINT: Record<string, string> = {
  count: "While reading, silently count “1-2-3-4” on a loop.",
  hum: "While reading, hum a steady note under your breath.",
  tap: "While reading, tap a steady rhythm with your finger.",
};

type Phase = "baselineRead" | "techniqueRead" | "report";

class SubvocalizationExercise implements Exercise {
  readonly descriptor = subvocalizationDescriptor;

  private ctx!: ExerciseContext;
  private technique = "count";
  private firstHalf: string[] = [];
  private secondHalf: string[] = [];
  private segStartMs = 0;
  private baselineWpm = 0;
  private techniqueWpm = 0;

  async init(ctx: ExerciseContext, params: Params): Promise<void> {
    this.ctx = ctx;
    this.technique = String(params.technique ?? "count");
    const words = ctx.text.words;
    const mid = Math.floor(words.length / 2);
    this.firstHalf = words.slice(0, mid);
    this.secondHalf = words.slice(mid);
    ctx.emit({ t: "param", key: "technique", value: this.technique });
  }

  start(): void {
    this.renderRead(
      "baselineRead",
      this.ctx.t("subvoc.baselineTitle", "Read normally — no technique"),
      this.firstHalf,
    );
  }

  pause(): void {}
  resume(): void {}

  teardown(): void {
    this.ctx?.surface.clear();
    this.firstHalf = [];
    this.secondHalf = [];
  }

  private renderRead(phase: Phase, title: string, words: string[]): void {
    const root = this.ctx.surface.root;
    root.replaceChildren();
    const wrap = el("div", "srt-subvoc");
    wrap.appendChild(el("h3", "")).textContent = title;

    if (phase === "techniqueRead") {
      wrap.appendChild(el("p", "srt-subvoc-hint")).textContent = this.ctx.t(
        `subvoc.hint.${this.technique}`,
        TECHNIQUE_HINT[this.technique] ?? "",
      );
    }

    const pane = el("div", "srt-comp-pane");
    pane.textContent = words.join(" ");
    wrap.appendChild(pane);

    const done = document.createElement("button");
    done.className = "primary";
    done.textContent = this.ctx.t("subvoc.done", "Done reading");
    done.addEventListener("click", () => this.onSegmentDone(phase, words.length));
    wrap.appendChild(done);

    root.appendChild(wrap);
    this.segStartMs = this.ctx.clock.now();
  }

  private onSegmentDone(phase: Phase, wordCount: number): void {
    const min = (this.ctx.clock.now() - this.segStartMs) / 60000;
    const wpm = min > 0 ? round(wordCount / min) : 0;
    if (phase === "baselineRead") {
      this.baselineWpm = wpm;
      this.ctx.emit({ t: "custom", key: "baselineWpm", value: wpm });
      this.renderRead(
        "techniqueRead",
        this.ctx.t("subvoc.techniqueTitle", "Now read with your technique"),
        this.secondHalf,
      );
    } else {
      this.techniqueWpm = wpm;
      this.ctx.emit({ t: "custom", key: "techniqueWpm", value: wpm });
      this.renderReport();
    }
  }

  private renderReport(): void {
    const root = this.ctx.surface.root;
    root.replaceChildren();
    const wrap = el("div", "srt-subvoc");
    wrap.appendChild(el("h3", "")).textContent = this.ctx.t(
      "subvoc.report",
      "How did it go?",
    );

    const summary = el("p", "srt-subvoc-summary");
    const delta = round(this.techniqueWpm - this.baselineWpm);
    summary.textContent = this.ctx.t(
      "subvoc.summary",
      "Baseline {b} WPM → with technique {t} WPM ({d}).",
      {
        b: this.baselineWpm,
        t: this.techniqueWpm,
        d: `${delta >= 0 ? "+" : ""}${delta}`,
      },
    );
    wrap.appendChild(summary);

    const diffLabel = el("label", "field");
    diffLabel.appendChild(
      document.createTextNode(this.ctx.t("subvoc.difficulty", "Difficulty (1–10)")),
    );
    const diff = document.createElement("input");
    diff.type = "range";
    diff.min = "1";
    diff.max = "10";
    diff.value = "5";
    diffLabel.appendChild(diff);
    wrap.appendChild(diffLabel);

    const compLabel = el("label", "row");
    const comp = document.createElement("input");
    comp.type = "checkbox";
    comp.checked = true;
    compLabel.append(
      comp,
      document.createTextNode(this.ctx.t("subvoc.maintained", " I maintained comprehension")),
    );
    wrap.appendChild(compLabel);

    const finish = document.createElement("button");
    finish.className = "primary";
    finish.textContent = this.ctx.t("subvoc.finish", "Finish & save");
    finish.addEventListener("click", () => {
      this.ctx.emit({ t: "custom", key: "difficulty", value: Number(diff.value) });
      this.ctx.emit({ t: "custom", key: "speedDeltaWpm", value: delta });
      this.ctx.emit({
        t: "custom",
        key: "comprehensionMaintained",
        value: comp.checked ? 1 : 0,
      });
      const total = this.firstHalf.length + this.secondHalf.length;
      this.ctx.emit({ t: "progress", wordsProcessed: total, atMs: 0 });
      this.ctx.emit({ t: "wpm", value: this.techniqueWpm });
      this.ctx.complete();
    });
    wrap.appendChild(finish);

    root.appendChild(wrap);
  }
}

function el(tag: string, className: string): HTMLElement {
  const e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function createSubvocalizationExercise(): Exercise {
  return new SubvocalizationExercise();
}

export const subvocalizationProvider: ExerciseProvider = {
  descriptor: subvocalizationDescriptor,
  create: createSubvocalizationExercise,
};
