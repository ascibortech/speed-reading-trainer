/**
 * App-level engine wiring. Exercises register here — this is the ONLY place that
 * knows which exercises exist. Adding a new exercise = one import + one register
 * line, with zero engine-core changes (kickoff §2.3).
 */
import { Engine, registry } from "@srt/engine-core";
import { pointerProvider } from "@srt/exercise-pointer";
import { rsvpProvider } from "@srt/exercise-rsvp";
import { schulteProvider } from "@srt/exercise-schulte";

registry.register(pointerProvider);
registry.register(rsvpProvider);
registry.register(schulteProvider);
// Phase 3+: comprehension, chunking, subvocalization, memorization ...

export const engine = new Engine(registry);
export { registry };
