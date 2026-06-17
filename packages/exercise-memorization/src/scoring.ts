/**
 * Pure recall-scoring helpers (system-design §5.1). These run ENTIRELY in memory
 * on text the user typed from recall; the recalled text is scored and then dropped
 * — never emitted, never persisted (the text boundary, §2.2). Only the resulting
 * percentage leaves these functions.
 */
const STOPWORDS = new Set(
  "the a an and or but of to in on at for with as by from into over under than then this that these those is are was were be been being it its his her their our your they them we you he she him not no do does did have has had will would can could should may might must about which who whom whose what when where why how".split(
    " ",
  ),
);

const clean = (w: string): string =>
  w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").toLowerCase();

/** Set of distinct content words (length ≥ 4, alphabetic, non-stopword). */
export function contentWordSet(words: string[]): Set<string> {
  const set = new Set<string>();
  for (const w of words) {
    const c = clean(w);
    if (c.length >= 4 && /^[\p{L}]+$/u.test(c) && !STOPWORDS.has(c)) set.add(c);
  }
  return set;
}

/**
 * Free-recall coverage: the share of the source's content words that appear in
 * the user's recall (0–100). A blunt but local proxy for retention.
 */
export function scoreRecallCoverage(
  sourceWords: string[],
  recallText: string,
): number {
  const source = contentWordSet(sourceWords);
  if (source.size === 0) return 0;
  const recalled = contentWordSet(recallText.split(/\s+/));
  let hits = 0;
  for (const w of source) if (recalled.has(w)) hits++;
  return Math.round((hits / source.size) * 100);
}

/**
 * Sequence/structure recall: fraction of items placed in their correct position
 * (0–100). `given` is the original indices in the order the user arranged them.
 */
export function orderingAccuracy(expected: number[], given: number[]): number {
  if (expected.length === 0) return 0;
  let correct = 0;
  for (let i = 0; i < expected.length; i++) {
    if (given[i] === expected[i]) correct++;
  }
  return Math.round((correct / expected.length) * 100);
}
