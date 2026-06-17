import { describe, expect, it } from "vitest";
import {
  ADVANCE_THRESHOLD_PCT,
  daysSince,
  firstSchedule,
  INTERVALS_DAYS,
  isDue,
  nextSchedule,
} from "./index.js";

const ANCHOR = "2026-06-16T00:00:00.000Z";

describe("firstSchedule", () => {
  it("starts at the first interval (1 day)", () => {
    const s = firstSchedule(ANCHOR);
    expect(s.intervalIndex).toBe(0);
    expect(s.dueAt).toBe("2026-06-17T00:00:00.000Z");
  });
});

describe("nextSchedule", () => {
  it("advances the interval on strong recall", () => {
    const s = nextSchedule(0, ADVANCE_THRESHOLD_PCT, ANCHOR);
    expect(s.intervalIndex).toBe(1);
    expect(s.dueAt).toBe("2026-06-19T00:00:00.000Z"); // +3 days
  });

  it("repeats the interval on weak recall", () => {
    const s = nextSchedule(2, 40, ANCHOR);
    expect(s.intervalIndex).toBe(2);
    expect(s.dueAt).toBe("2026-06-23T00:00:00.000Z"); // +7 days
  });

  it("caps at the longest interval", () => {
    const last = INTERVALS_DAYS.length - 1;
    expect(nextSchedule(last, 100, ANCHOR).intervalIndex).toBe(last);
  });
});

describe("isDue / daysSince", () => {
  it("is due once now passes dueAt", () => {
    expect(isDue("2026-06-17T00:00:00.000Z", new Date("2026-06-18"))).toBe(true);
    expect(isDue("2026-06-17T00:00:00.000Z", new Date("2026-06-16"))).toBe(false);
  });

  it("counts whole days since a timestamp", () => {
    expect(daysSince(ANCHOR, new Date("2026-06-23T00:00:00.000Z"))).toBe(7);
  });
});
