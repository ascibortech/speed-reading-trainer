/**
 * The in-memory representation of uploaded text (system-design §5).
 *
 * THE TEXT BOUNDARY (system-design §2.2): `NormalizedText` is produced by the
 * parsing layer and read by the engine/exercises. It must NEVER be serialized to
 * the network or to persistence. The storage/export layer is forbidden from
 * importing this module (enforced by scripts/check-text-boundary.mjs).
 */

export type SourceFormat = "txt" | "pdf" | "docx" | "epub" | "mobi";

/** An index range `[start, end)` into the `words` array. */
export interface Span {
  start: number;
  end: number;
}

export interface NormalizedText {
  /** Tokenized words, in reading order. */
  words: string[];
  /** Sentence boundaries as spans into `words`. */
  sentences: Span[];
  /** Paragraph boundaries as spans into `words`. */
  paragraphs: Span[];
  /** Optional source-derived line grouping, used by pacing exercises. */
  lineHints?: Span[];
  /** Total word count (== words.length; kept explicit per the contract). */
  wordCount: number;
  sourceFormat: SourceFormat;
}
