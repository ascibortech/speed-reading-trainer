/**
 * Metric events emitted by exercises to the collector (system-design §5).
 *
 * PRIVACY INVARIANT: a MetricEvent carries NO user text — numbers, enums and
 * booleans only. This is what makes the metrics collector structurally incapable
 * of seeing raw content (system-design §2.2, §3.3).
 */
export type MetricEvent =
  | { t: "progress"; wordsProcessed: number; atMs: number }
  | { t: "wpm"; value: number }
  | { t: "fixation"; perLine: number }
  | { t: "regression"; count: number }
  | { t: "answer"; questionId: string; correct: boolean; responseMs: number }
  | { t: "param"; key: string; value: number | string }
  | { t: "custom"; key: string; value: number };
