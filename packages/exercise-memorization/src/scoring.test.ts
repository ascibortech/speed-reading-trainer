import { describe, expect, it } from "vitest";
import { contentWordSet, orderingAccuracy, scoreRecallCoverage } from "./scoring.js";

describe("contentWordSet", () => {
  it("keeps content words and drops stopwords / short words", () => {
    const set = contentWordSet("the ancient library stored rare scrolls".split(" "));
    expect(set.has("ancient")).toBe(true);
    expect(set.has("library")).toBe(true);
    expect(set.has("the")).toBe(false); // stopword
    expect(set.has("rare")).toBe(true);
  });
});

describe("scoreRecallCoverage", () => {
  const source = "Ancient libraries stored fragile scrolls for visiting scholars".split(" ");

  it("is 100 when all content words are recalled", () => {
    expect(
      scoreRecallCoverage(source, "scholars scrolls fragile libraries ancient stored visiting"),
    ).toBe(100);
  });

  it("is partial when some are missing", () => {
    // recall has 'ancient' + 'scrolls' of {ancient, libraries, stored, fragile, scrolls, visiting, scholars} (7)
    expect(scoreRecallCoverage(source, "ancient scrolls")).toBe(Math.round((2 / 7) * 100));
  });

  it("is 0 for empty recall", () => {
    expect(scoreRecallCoverage(source, "")).toBe(0);
  });
});

describe("orderingAccuracy", () => {
  it("is 100 for a perfect ordering", () => {
    expect(orderingAccuracy([0, 1, 2, 3], [0, 1, 2, 3])).toBe(100);
  });
  it("scores per-position matches", () => {
    expect(orderingAccuracy([0, 1, 2, 3], [0, 2, 1, 3])).toBe(50);
  });
});
