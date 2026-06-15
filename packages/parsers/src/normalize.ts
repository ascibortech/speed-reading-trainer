/**
 * Text normalization (system-design §3.1). Turns a raw string into the
 * content-source-agnostic `NormalizedText` the engine operates on: tokenized
 * words, with sentence / paragraph / line spans. Every format parser funnels
 * through here so the engine never sees format quirks.
 *
 * Output lives in browser memory only and must never be persisted (the text
 * boundary, system-design §2.2).
 */
import type { NormalizedText, SourceFormat, Span } from "@srt/contracts";

const SENTENCE_END = /[.!?]["')\]]?$/;

/**
 * Normalize raw text into NormalizedText.
 *
 * Paragraphs are separated by blank lines. Within the source, non-empty physical
 * lines become `lineHints` (used by the pointer/pacer exercise). Words are
 * whitespace-delimited tokens. Sentences end on terminal punctuation.
 */
export function normalizeText(
  raw: string,
  sourceFormat: SourceFormat,
): NormalizedText {
  // Strip a UTF BOM and normalize newlines.
  const text = raw.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");

  const words: string[] = [];
  const sentences: Span[] = [];
  const paragraphs: Span[] = [];
  const lineHints: Span[] = [];

  let sentenceStart = 0;

  const blocks = text.split(/\n[ \t]*\n+/); // blank-line-separated paragraphs
  for (const block of blocks) {
    const paraStart = words.length;
    const lines = block.split("\n");

    for (const line of lines) {
      const lineStart = words.length;
      const tokens = line.split(/\s+/).filter(Boolean);
      for (const tok of tokens) {
        words.push(tok);
        if (SENTENCE_END.test(tok)) {
          sentences.push({ start: sentenceStart, end: words.length });
          sentenceStart = words.length;
        }
      }
      if (words.length > lineStart) {
        lineHints.push({ start: lineStart, end: words.length });
      }
    }

    if (words.length > paraStart) {
      paragraphs.push({ start: paraStart, end: words.length });
    }
  }

  // Flush any trailing words not closed by terminal punctuation.
  if (sentenceStart < words.length) {
    sentences.push({ start: sentenceStart, end: words.length });
  }

  return {
    words,
    sentences,
    paragraphs,
    lineHints,
    wordCount: words.length,
    sourceFormat,
  };
}
