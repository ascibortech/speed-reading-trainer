/**
 * Metrics collector (system-design §3.3) — the privacy choke point. It subscribes
 * to MetricEvents (numbers/enums/booleans only) and aggregates them into a
 * SessionMetadata record. It is structurally incapable of seeing user text. All
 * derived-metric math (WPM, efficiency) is centralized here for consistency.
 */
import type { MetricEvent } from "@srt/contracts";
import type { SessionMetadata, Stage } from "@srt/contracts/metadata";

export interface CollectorInit {
  username: string;
  exerciseId: string;
  stage: Stage;
  difficulty: number;
  startedAtIso: string;
  /** Clock value (ms) at session start. */
  startedAtMs: number;
  /** Initial exercise params. */
  params: Record<string, number | string>;
}

export class MetricsCollector {
  private wordsProcessed = 0;
  private lastWpm?: number;
  private fixationsPerLine?: number;
  private regressionCount?: number;
  private answersCorrect = 0;
  private answersTotal = 0;
  private readonly params: Record<string, number | string>;

  constructor(private readonly init: CollectorInit) {
    this.params = { ...init.params };
  }

  /** Handle one metric event. Pure aggregation — no text ever enters here. */
  handle(e: MetricEvent): void {
    switch (e.t) {
      case "progress":
        this.wordsProcessed = Math.max(this.wordsProcessed, e.wordsProcessed);
        break;
      case "wpm":
        this.lastWpm = e.value;
        break;
      case "fixation":
        this.fixationsPerLine = e.perLine;
        break;
      case "regression":
        this.regressionCount = e.count;
        break;
      case "answer":
        this.answersTotal += 1;
        if (e.correct) this.answersCorrect += 1;
        break;
      case "param":
        this.params[e.key] = e.value;
        break;
      case "custom":
        this.params[e.key] = e.value;
        break;
    }
  }

  /** Produce the final immutable SessionMetadata record. */
  finalize(sessionId: string, endedAtMs: number): SessionMetadata {
    const durationSec = Math.max(0, (endedAtMs - this.init.startedAtMs) / 1000);
    const computedWpm =
      durationSec > 0 ? this.wordsProcessed / (durationSec / 60) : 0;
    const wpm = round(this.lastWpm ?? computedWpm);

    const comprehensionPct =
      this.answersTotal > 0
        ? round((this.answersCorrect / this.answersTotal) * 100)
        : undefined;

    const efficiencyEwpm =
      comprehensionPct !== undefined
        ? round(wpm * (comprehensionPct / 100))
        : undefined;

    return {
      sessionId,
      username: this.init.username,
      exerciseId: this.init.exerciseId,
      stage: this.init.stage,
      difficulty: this.init.difficulty,
      startedAt: this.init.startedAtIso,
      durationSec: round(durationSec),
      wordsProcessed: this.wordsProcessed,
      wpm,
      comprehensionPct,
      efficiencyEwpm,
      params: this.params,
      regressionCount: this.regressionCount,
      fixationsPerLine: this.fixationsPerLine,
    };
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
