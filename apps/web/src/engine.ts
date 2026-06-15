/**
 * App-level engine wiring. Exercises register here — this is the ONLY place that
 * knows which exercises exist. Adding a new exercise = one import + one register
 * line, with zero engine-core changes (kickoff §2.3).
 */
import { Engine, registry } from "@srt/engine-core";
import { pointerProvider } from "@srt/exercise-pointer";

registry.register(pointerProvider);
// Phase 2+: registry.register(rsvpProvider), schulteProvider, ...

export const engine = new Engine(registry);
export { registry };
