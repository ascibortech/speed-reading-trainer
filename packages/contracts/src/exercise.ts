/**
 * The Exercise plugin contract (system-design §5) — the heart of incrementality
 * (kickoff §2.3). Every exercise implements one interface; the core only knows
 * this interface. A new exercise "appears" in the app by registration, with zero
 * engine-core changes.
 */
import type { NormalizedText } from "./text.js";
import type { MetricEvent } from "./metrics.js";
import type { Stage } from "./common.js";

export type Pillar =
  | "eye-movement"
  | "visual-span"
  | "subvocalization"
  | "comprehension"
  | "retention";

/** The shared rendering surface the core provides to an exercise. */
export interface RenderSurface {
  /** Root element the exercise renders into. The core owns its lifecycle. */
  readonly root: HTMLElement;
  /** Remove all exercise-rendered content. */
  clear(): void;
}

/** A single webcam gaze sample (future eye-tracking capability, kickoff §8). */
export interface GazeSample {
  x: number;
  y: number;
  t: number;
}
export type GazeStream = AsyncIterable<GazeSample>;

/**
 * Localized-string lookup the host app supplies. Exercises call it with a stable
 * key and an English fallback so they render in the user's language without the
 * core knowing any specific language. `{var}` placeholders are interpolated.
 */
export type Translate = (
  key: string,
  fallback?: string,
  vars?: Record<string, string | number>,
) => string;

export interface ExerciseContext {
  /** In-memory text to operate on. Never persist or transmit it. */
  text: NormalizedText;
  surface: RenderSurface;
  /** High-resolution clock (performance.now wrapper). */
  clock: { now(): number };
  /** Emit a metric event to the collector. */
  emit(e: MetricEvent): void;
  /** Signal the exercise has finished; the engine finalizes metadata. */
  complete(): void;
  /** Translate a UI string (key + English fallback). Defaults to the fallback. */
  t: Translate;
  /** Optional capabilities the core may expose (future-proofing, kickoff §8). */
  capabilities: { eyeTracking?: GazeStream };
}

export type ParamType = "number" | "enum" | "boolean";

export interface ParamField {
  key: string;
  label: string;
  type: ParamType;
  default: number | string | boolean;
  /** number fields */
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  /** enum fields */
  options?: { value: string; label: string }[];
}

export type ParamSchema = ParamField[];
export type Params = Record<string, number | string | boolean>;

export interface ExerciseDescriptor {
  /** Stable id, e.g. 'pointer', 'rsvp', 'schulte'. */
  id: string;
  title: string;
  description?: string;
  pillar: Pillar;
  stage: Stage;
  /** Whether the exercise consumes user text (Schulte = false; RSVP = true). */
  needsText: boolean;
  /** Whether a comprehension check attaches to this exercise. */
  needsComprehension: boolean;
  paramSchema: ParamSchema;
}

export interface Exercise {
  descriptor: ExerciseDescriptor;
  init(ctx: ExerciseContext, params: Params): Promise<void>;
  start(): void;
  pause(): void;
  resume(): void;
  /** Tear down all rendering and RELEASE ALL TEXT REFERENCES. */
  teardown(): void;
}

/**
 * What an exercise module registers. The descriptor drives the catalogue without
 * instantiating anything; `create()` yields a FRESH instance per session so runs
 * never share mutable state. This is what `registry.register(...)` accepts.
 */
export interface ExerciseProvider {
  descriptor: ExerciseDescriptor;
  create(): Exercise;
}

/** Default values derived from a param schema. */
export function defaultParams(schema: ParamSchema): Params {
  const out: Params = {};
  for (const f of schema) out[f.key] = f.default;
  return out;
}
