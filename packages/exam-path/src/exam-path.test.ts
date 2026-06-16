import { describe, expect, it } from "vitest";
import {
  buildExamRun,
  daysSinceLastExam,
  EXAM_PASSAGES,
  isRetestDue,
  passageWordCount,
} from "./index.js";

describe("exam passages", () => {
  it("ships three passages, each with hand-authored questions", () => {
    expect(EXAM_PASSAGES).toHaveLength(3);
    for (const p of EXAM_PASSAGES) {
      expect(p.questions.length).toBeGreaterThanOrEqual(4);
      for (const q of p.questions) {
        expect(q.options[q.answerIndex]).toBeTruthy();
      }
      expect(passageWordCount(p)).toBeGreaterThan(100);
    }
  });
});

describe("buildExamRun", () => {
  it("computes mean WPM and comprehension across passages", () => {
    const run = buildExamRun({
      examRunId: "e1",
      username: "ada",
      isBaseline: true,
      date: "2026-06-16T00:00:00.000Z",
      results: [
        { passage: EXAM_PASSAGES[0], wpm: 200, comprehensionPct: 80 },
        { passage: EXAM_PASSAGES[1], wpm: 300, comprehensionPct: 60 },
      ],
    });
    expect(run.meanWpm).toBe(250);
    expect(run.meanComprehensionPct).toBe(70);
    expect(run.passages).toHaveLength(2);
    expect(run.isBaseline).toBe(true);
  });
});

describe("re-test cadence", () => {
  const baseline = buildExamRun({
    examRunId: "e1",
    username: "ada",
    isBaseline: true,
    date: "2026-05-01T00:00:00.000Z",
    results: [{ passage: EXAM_PASSAGES[0], wpm: 200, comprehensionPct: 80 }],
  });

  it("requires a baseline before anything else", () => {
    expect(isRetestDue([], new Date("2026-06-16"))).toBe(true);
  });

  it("is due once past the minimum cadence", () => {
    expect(daysSinceLastExam([baseline], new Date("2026-06-16"))).toBe(46);
    expect(isRetestDue([baseline], new Date("2026-06-16"))).toBe(true);
    expect(isRetestDue([baseline], new Date("2026-05-10"))).toBe(false);
  });
});
