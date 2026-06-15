import { describe, expect, it, vi } from "vitest";
import type {
  Exercise,
  ExerciseContext,
  ExerciseDescriptor,
  ExerciseProvider,
  RenderSurface,
} from "@srt/contracts";
import type { SessionMetadata } from "@srt/contracts/metadata";
import { Engine } from "./engine.js";
import { ExerciseRegistry } from "./registry.js";

const surface: RenderSurface = { root: {} as HTMLElement, clear: () => {} };

const descriptor: ExerciseDescriptor = {
  id: "fake",
  title: "Fake",
  pillar: "eye-movement",
  stage: "beginner",
  needsText: true,
  needsComprehension: false,
  paramSchema: [],
};

function fakeExercise(): Exercise {
  let ctx: ExerciseContext;
  return {
    descriptor,
    async init(c) {
      ctx = c;
    },
    start() {
      ctx.emit({ t: "progress", wordsProcessed: 120, atMs: 60000 });
      ctx.complete();
    },
    pause() {},
    resume() {},
    teardown() {},
  };
}

function fakeProvider(): ExerciseProvider {
  return { descriptor, create: fakeExercise };
}

describe("Engine", () => {
  it("runs an exercise and finalizes metadata on completion", async () => {
    const registry = new ExerciseRegistry();
    registry.register(fakeProvider());
    const engine = new Engine(registry);

    let t = 1000;
    const onComplete = vi.fn();
    await engine.run(
      "fake",
      {
        words: ["a", "b", "c"],
        sentences: [],
        paragraphs: [],
        wordCount: 3,
        sourceFormat: "txt",
      },
      {
        username: "ada",
        stage: "beginner",
        difficulty: 1,
        params: { pace: 1 },
        surface,
        clock: { now: () => (t += 60000) },
        onComplete,
      },
    );

    expect(onComplete).toHaveBeenCalledOnce();
    const meta = onComplete.mock.calls[0][0] as SessionMetadata;
    expect(meta.wordsProcessed).toBe(120);
    expect(meta.username).toBe("ada");
    expect(meta.exerciseId).toBe("fake");
  });

  it("throws on an unknown exercise id", async () => {
    const engine = new Engine(new ExerciseRegistry());
    await expect(
      engine.run(
        "nope",
        { words: [], sentences: [], paragraphs: [], wordCount: 0, sourceFormat: "txt" },
        {
          username: "x",
          stage: "beginner",
          difficulty: 1,
          params: {},
          surface,
          onComplete: () => {},
        },
      ),
    ).rejects.toThrow(/Unknown exercise/);
  });
});
