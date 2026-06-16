/**
 * Exercise engine (system-design §3.2). Owns the session lifecycle
 * (init → run → pause/resume → complete → teardown), constructs the
 * ExerciseContext, wires the exercise's emitted events into the MetricsCollector,
 * and finalizes a SessionMetadata record on completion.
 *
 * Data flow (system-design §2.3): the engine hands NormalizedText to the exercise
 * but routes ONLY MetricEvents to the collector — the collector never sees text.
 */
import type {
  Exercise,
  ExerciseContext,
  NormalizedText,
  Params,
  RenderSurface,
} from "@srt/contracts";
import type { SessionMetadata, Stage } from "@srt/contracts/metadata";
import { realClock, type Clock } from "./clock.js";
import { MetricsCollector } from "./metrics-collector.js";
import type { ExerciseRegistry } from "./registry.js";

export interface RunOptions {
  username: string;
  stage: Stage;
  difficulty: number;
  params: Params;
  surface: RenderSurface;
  clock?: Clock;
  /** Called once with the finalized record when the session completes/stops. */
  onComplete: (metadata: SessionMetadata) => void;
}

export type SessionState = "running" | "paused" | "completed";

export class RunningSession {
  state: SessionState = "running";
  private finalized = false;

  constructor(
    private readonly exercise: Exercise,
    private readonly collector: MetricsCollector,
    private readonly clock: Clock,
    private readonly onComplete: (m: SessionMetadata) => void,
    private readonly sessionId: string,
  ) {}

  pause(): void {
    if (this.state !== "running") return;
    this.exercise.pause();
    this.state = "paused";
  }

  resume(): void {
    if (this.state !== "paused") return;
    this.exercise.resume();
    this.state = "running";
  }

  /** Finalize metadata, tear the exercise down (releasing text), and notify. */
  stop(): void {
    if (this.finalized) return;
    this.finalized = true;
    this.state = "completed";
    const metadata = this.collector.finalize(this.sessionId, this.clock.now());
    this.exercise.teardown();
    this.onComplete(metadata);
  }

  /** Abandon the session: tear down WITHOUT finalizing or recording metadata. */
  cancel(): void {
    if (this.finalized) return;
    this.finalized = true;
    this.state = "completed";
    this.exercise.teardown();
  }
}

export class Engine {
  constructor(private readonly registry: ExerciseRegistry) {}

  async run(
    exerciseId: string,
    text: NormalizedText,
    opts: RunOptions,
  ): Promise<RunningSession> {
    const provider = this.registry.get(exerciseId);
    if (!provider) throw new Error(`Unknown exercise: ${exerciseId}`);
    const exercise = provider.create();

    const clock = opts.clock ?? realClock;
    const sessionId = newId();
    const collector = new MetricsCollector({
      username: opts.username,
      exerciseId,
      stage: opts.stage,
      difficulty: opts.difficulty,
      startedAtIso: new Date().toISOString(),
      startedAtMs: clock.now(),
      params: flattenParams(opts.params),
    });

    const session = new RunningSession(
      exercise,
      collector,
      clock,
      opts.onComplete,
      sessionId,
    );

    const ctx: ExerciseContext = {
      text,
      surface: opts.surface,
      clock,
      emit: (e) => collector.handle(e),
      complete: () => session.stop(),
      capabilities: {},
    };

    await exercise.init(ctx, opts.params);
    exercise.start();
    return session;
  }
}

function flattenParams(p: Params): Record<string, number | string> {
  const out: Record<string, number | string> = {};
  for (const [k, v] of Object.entries(p)) {
    out[k] = typeof v === "boolean" ? String(v) : v;
  }
  return out;
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback: RFC-4122 v4 from Web Crypto random bytes (never Math.random).
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0"));
  return `${h.slice(0, 4).join("")}-${h.slice(4, 6).join("")}-${h
    .slice(6, 8)
    .join("")}-${h.slice(8, 10).join("")}-${h.slice(10, 16).join("")}`;
}
