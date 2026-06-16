import { describe, expect, it } from "vitest";
import { generateGrid, shuffle } from "./index.js";

describe("shuffle", () => {
  it("is a permutation of the input", () => {
    const out = shuffle([1, 2, 3, 4, 5], (max) => max - 1); // deterministic
    expect([...out].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it("does not mutate the input", () => {
    const input = [1, 2, 3];
    shuffle(input, () => 0);
    expect(input).toEqual([1, 2, 3]);
  });
});

describe("generateGrid", () => {
  it("produces exactly 1..n² for a 5×5 grid", () => {
    const grid = generateGrid(5);
    expect(grid).toHaveLength(25);
    expect([...grid].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 25 }, (_, i) => i + 1),
    );
  });
});
