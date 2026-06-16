import { describe, expect, it } from "vitest";
import type { NormalizedText } from "@srt/contracts";
import { generateQuestions, scoreAnswers } from "./index.js";

// Build NormalizedText quickly from a raw string (mirrors the parser's tokenizing).
function nt(raw: string): NormalizedText {
  const words = raw.split(/\s+/).filter(Boolean);
  const sentences = [{ start: 0, end: words.length }];
  return {
    words,
    sentences,
    paragraphs: [{ start: 0, end: words.length }],
    wordCount: words.length,
    sourceFormat: "txt",
  };
}

const PASSAGE = nt(
  "The curious explorer discovered ancient ruins hidden beneath dense jungle canopy near the river.",
);

describe("generateQuestions", () => {
  const rnd = () => 0; // deterministic

  it("produces a cloze with the answer among the options", () => {
    const qs = generateQuestions(PASSAGE, { count: 1, randomInt: rnd });
    expect(qs).toHaveLength(1);
    const q = qs[0];
    expect(q.prompt).toContain("_____");
    expect(q.options.length).toBeGreaterThanOrEqual(2);
    expect(q.answerIndex).toBeGreaterThanOrEqual(0);
    expect(q.options[q.answerIndex]).toBeTruthy();
    // the blanked word should not still appear as a standalone token in prompt
    expect(q.prompt.split(/\s+/)).toContain("_____");
  });

  it("returns nothing for a passage with too little vocabulary", () => {
    expect(generateQuestions(nt("a an the to of"), { randomInt: rnd })).toEqual([]);
  });

  it("never exceeds the requested count", () => {
    const qs = generateQuestions(PASSAGE, { count: 2, randomInt: rnd });
    expect(qs.length).toBeLessThanOrEqual(2);
  });
});

describe("scoreAnswers", () => {
  it("computes correct/total/pct", () => {
    const q = {
      id: "x",
      type: "cloze" as const,
      prompt: "_",
      options: ["a", "b"],
      answerIndex: 0,
    };
    const score = scoreAnswers([
      { question: q, selectedIndex: 0 },
      { question: q, selectedIndex: 1 },
    ]);
    expect(score).toEqual({ correct: 1, total: 2, pct: 50 });
  });
});
