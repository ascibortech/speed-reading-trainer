/**
 * Exam path (system-design §7) — a distinct benchmark subsystem, NOT an exercise.
 * It runs the same set of equal-difficulty curated passages each time (baseline,
 * then re-tests every 4–6 weeks) and produces an immutable ExamRun. The progress
 * trajectory (speed × comprehension over time) is derived from ExamRun history.
 */
import type { ExamRun, PassageDifficulty } from "@srt/contracts/metadata";
import { EXAM_PASSAGES, type ExamPassage } from "./passages.js";

export { EXAM_PASSAGES } from "./passages.js";
export type { ExamPassage } from "./passages.js";

/** Recommended re-test cadence (kickoff §7). */
export const RETEST_MIN_DAYS = 28;
export const RETEST_MAX_DAYS = 42;

/** Word count of a passage (whitespace tokenization, matching the engine). */
export function passageWordCount(p: ExamPassage): number {
  return p.text.split(/\s+/).filter(Boolean).length;
}

export interface PassageResult {
  passage: ExamPassage;
  wpm: number;
  comprehensionPct: number;
}

export interface BuildExamRunInput {
  examRunId: string;
  username: string;
  isBaseline: boolean;
  date: string;
  results: PassageResult[];
}

/** Assemble an immutable ExamRun from per-passage results (pure + testable). */
export function buildExamRun(input: BuildExamRunInput): ExamRun {
  const passages: {
    difficulty: PassageDifficulty;
    wpm: number;
    comprehensionPct: number;
  }[] = input.results.map((r) => ({
    difficulty: r.passage.difficulty,
    wpm: r.wpm,
    comprehensionPct: r.comprehensionPct,
  }));

  const n = passages.length || 1;
  const meanWpm = round(passages.reduce((s, p) => s + p.wpm, 0) / n);
  const meanComprehensionPct = round(
    passages.reduce((s, p) => s + p.comprehensionPct, 0) / n,
  );

  return {
    examRunId: input.examRunId,
    username: input.username,
    isBaseline: input.isBaseline,
    date: input.date,
    passages,
    meanWpm,
    meanComprehensionPct,
  };
}

/** Days since the most recent exam run, or null if none. */
export function daysSinceLastExam(runs: ExamRun[], now: Date): number | null {
  if (runs.length === 0) return null;
  const latest = runs.reduce((a, b) => (a.date > b.date ? a : b));
  const ms = now.getTime() - new Date(latest.date).getTime();
  return Math.floor(ms / 86_400_000);
}

/** Whether a re-test is due (past the minimum cadence). */
export function isRetestDue(runs: ExamRun[], now: Date): boolean {
  const baseline = runs.some((r) => r.isBaseline);
  if (!baseline) return true; // need a baseline first
  const days = daysSinceLastExam(runs, now);
  return days !== null && days >= RETEST_MIN_DAYS;
}

export function totalExamPassages(): number {
  return EXAM_PASSAGES.length;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
