/**
 * The persisted data model (system-design §6). METADATA ONLY.
 *
 * This module deliberately imports nothing from `./text` — it has no knowledge of
 * `NormalizedText`. The storage/export layer imports ONLY this module
 * (`@srt/contracts/metadata`), which is what guarantees an export can never carry
 * user text. See scripts/check-text-boundary.mjs.
 *
 * NEVER stored: uploaded text, email / real name, payments.
 */
import type { Stage } from "./common.js";

export type { Stage };

export interface SessionMetadata {
  sessionId: string;
  username: string;
  exerciseId: string;
  stage: Stage;
  difficulty: number;
  /** ISO timestamp. */
  startedAt: string;
  durationSec: number;
  wordsProcessed: number;
  wpm: number;
  comprehensionPct?: number;
  /** wpm × comprehension (reading efficiency, kickoff §5). */
  efficiencyEwpm?: number;
  recallCoveragePct?: number;
  retentionIntervalDays?: number;
  /** Exercise-specific params (pointer speed, RSVP rate, grid size, ...). */
  params: Record<string, number | string>;
  regressionCount?: number;
  fixationsPerLine?: number;
}

export interface PassageDifficulty {
  approxWordCount: number;
  lexicalComplexity: number;
  meanSentenceLength: number;
  conceptualAbstraction: number;
}

export interface ExamRun {
  examRunId: string;
  username: string;
  isBaseline: boolean;
  date: string;
  passages: {
    difficulty: PassageDifficulty;
    wpm: number;
    comprehensionPct: number;
  }[];
  meanWpm: number;
  meanComprehensionPct: number;
}

export interface ProgressProfile {
  username: string;
  baseline?: { date: string; wpm: number; comprehensionPct: number };
  trajectory: {
    date: string;
    wpm: number;
    comprehensionPct: number;
    efficiencyEwpm: number;
  }[];
  /** % completion per stage/exercise, for motivation (kickoff §10). */
  completion: Record<string, number>;
}

/** A local profile. The passphrase is a soft local lock, NOT access control. */
export interface Profile {
  username: string;
  createdAt: string;
  /** salt:hash (SHA-256). Absent if no passphrase set. */
  passphraseHash?: string;
}

/** Current export schema version. Bump + migrate on import (architecture §5). */
export const EXPORT_SCHEMA_VERSION = 1;

/**
 * The portable, user-initiated export document (ADR-003). Metadata only — the
 * text boundary guarantees no `NormalizedText` can ever appear here.
 */
export interface ProgressExport {
  schemaVersion: number;
  exportedAt: string;
  /** Profile without the local passphrase hash (it is device-local only). */
  profile: Omit<Profile, "passphraseHash">;
  sessions: SessionMetadata[];
  examRuns: ExamRun[];
  progress?: ProgressProfile;
}
