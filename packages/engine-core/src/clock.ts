/** High-resolution clock service (system-design §3.2). */
export interface Clock {
  now(): number;
}

export const realClock: Clock = {
  now: () =>
    typeof performance !== "undefined" ? performance.now() : Date.now(),
};
