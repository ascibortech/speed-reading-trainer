import { describe, expect, it } from "vitest";
import { MetricsCollector } from "./metrics-collector.js";

function make() {
  return new MetricsCollector({
    username: "ada",
    exerciseId: "pointer",
    stage: "beginner",
    difficulty: 1,
    startedAtIso: "2026-06-15T10:00:00.000Z",
    startedAtMs: 1000,
    params: { linesPerSec: 1 },
  });
}

describe("MetricsCollector", () => {
  it("aggregates progress and computes WPM from elapsed time", () => {
    const c = make();
    c.handle({ t: "progress", wordsProcessed: 600, atMs: 60000 });
    // No explicit wpm event → computed from words / minutes.
    const m = c.finalize("s1", 1000 + 60000); // 60s elapsed → 600 wpm
    expect(m.wordsProcessed).toBe(600);
    expect(m.wpm).toBe(600);
    expect(m.durationSec).toBe(60);
  });

  it("prefers an explicit wpm event over computed", () => {
    const c = make();
    c.handle({ t: "progress", wordsProcessed: 300, atMs: 30000 });
    c.handle({ t: "wpm", value: 450 });
    expect(c.finalize("s2", 1000 + 30000).wpm).toBe(450);
  });

  it("derives comprehension % and efficiency from answers", () => {
    const c = make();
    c.handle({ t: "progress", wordsProcessed: 100, atMs: 60000 });
    c.handle({ t: "answer", questionId: "q1", correct: true, responseMs: 1000 });
    c.handle({ t: "answer", questionId: "q2", correct: false, responseMs: 1000 });
    const m = c.finalize("s3", 1000 + 60000); // 100 wpm
    expect(m.comprehensionPct).toBe(50);
    expect(m.efficiencyEwpm).toBe(50);
  });

  it("captures param and custom events without seeing text", () => {
    const c = make();
    c.handle({ t: "param", key: "marginWords", value: 2 });
    c.handle({ t: "custom", key: "adherence", value: 0.9 });
    const m = c.finalize("s4", 2000);
    expect(m.params.marginWords).toBe(2);
    expect(m.params.adherence).toBe(0.9);
  });
});
