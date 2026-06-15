import { describe, expect, it } from "vitest";
import { computeOrp, frameDurationMs, MIN_FRAME_MS } from "./index.js";

describe("computeOrp", () => {
  it("places the pivot left of centre, scaling with length", () => {
    expect(computeOrp(1)).toBe(0);
    expect(computeOrp(4)).toBe(1);
    expect(computeOrp(7)).toBe(2);
    expect(computeOrp(12)).toBe(3);
    expect(computeOrp(20)).toBe(4);
  });
});

describe("frameDurationMs", () => {
  it("derives per-frame ms from WPM and chunk size", () => {
    expect(frameDurationMs(300, 1)).toBe(200); // 60000/300
    expect(frameDurationMs(300, 2)).toBe(400);
  });

  it("clamps to the minimum display floor", () => {
    expect(frameDurationMs(1200, 1)).toBe(MIN_FRAME_MS); // 50ms → floored to 100
  });
});
