/**
 * Client-side comprehension question generation (system-design §8).
 *
 * For user-supplied text we cannot pre-author questions and we must never send
 * the text anywhere — so we generate questions ALGORITHMICALLY, in-browser:
 *   • cloze (fill-in-the-blank) with distractors drawn from the passage's own
 *     vocabulary, and
 *   • sentence-level true/false (a real sentence, or one with a content word
 *     swapped).
 * This is intentionally shallow (the privacy posture caps question quality on
 * arbitrary text); the curated exam path carries the authoritative signal with
 * hand-authored questions. No text leaves the device.
 */
import type { NormalizedText, Span } from "@srt/contracts";

export type QuestionType = "cloze" | "tf" | "mc" | "inference";

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  /** Index into `options` of the correct answer. */
  answerIndex: number;
}

export interface AnsweredQuestion {
  question: Question;
  selectedIndex: number;
}

export interface Score {
  correct: number;
  total: number;
  pct: number;
}

const STOPWORDS = new Set(
  "the a an and or but of to in on at for with as by from into over under than then this that these those is are was were be been being it its his her their our your they them we you he she him i not no do does did have has had will would can could should may might must about which who whom whose what when where why how".split(
    " ",
  ),
);

const clean = (w: string): string => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");

function isContentWord(word: string): boolean {
  const c = clean(word).toLowerCase();
  return c.length >= 4 && /^[\p{L}]+$/u.test(c) && !STOPWORDS.has(c);
}

/** Crypto-backed integer in [0, max) — never Math.random. */
function secureRandomInt(max: number): number {
  if (max <= 0) return 0;
  const u = new Uint32Array(1);
  crypto.getRandomValues(u);
  return u[0] % max;
}

function shuffle<T>(arr: readonly T[], rnd: (max: number) => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface GenerateOptions {
  count?: number;
  /** Injectable RNG for tests; defaults to crypto-backed. */
  randomInt?: (max: number) => number;
}

/**
 * Generate up to `count` questions from normalized text. Returns fewer if the
 * passage is too small to support more. Deterministic given a fixed `randomInt`.
 */
export function generateQuestions(
  text: NormalizedText,
  opts: GenerateOptions = {},
): Question[] {
  const count = opts.count ?? 5;
  const rnd = opts.randomInt ?? secureRandomInt;

  // Vocabulary pool for distractors (unique content words, original form kept).
  const vocab = new Map<string, string>();
  for (const w of text.words) {
    if (isContentWord(w)) {
      const c = clean(w).toLowerCase();
      if (!vocab.has(c)) vocab.set(c, clean(w));
    }
  }
  const pool = [...vocab.values()];
  if (pool.length < 2) return [];

  // Candidate sentences: long enough to give context and hold a content word.
  const candidates = text.sentences
    .map((span, idx) => ({ span, idx }))
    .filter(({ span }) => span.end - span.start >= 6);

  const ordered = spread(candidates, count * 2, rnd); // a few extra to allow skips
  const questions: Question[] = [];

  for (const { span, idx } of ordered) {
    if (questions.length >= count) break;
    const q = makeCloze(text, span, idx, pool, rnd);
    if (q) questions.push(q);
  }

  // Backfill with true/false if cloze didn't reach the target.
  for (const { span, idx } of ordered) {
    if (questions.length >= count) break;
    const q = makeTrueFalse(text, span, idx, pool, rnd);
    if (q) questions.push(q);
  }

  return questions.slice(0, count);
}

function sentenceWords(text: NormalizedText, span: Span): string[] {
  return text.words.slice(span.start, span.end);
}

function makeCloze(
  text: NormalizedText,
  span: Span,
  idx: number,
  pool: string[],
  rnd: (max: number) => number,
): Question | null {
  const words = sentenceWords(text, span);
  // Pick the longest content word as the blank.
  let blankPos = -1;
  let blankLen = 0;
  words.forEach((w, i) => {
    if (isContentWord(w) && clean(w).length > blankLen) {
      blankLen = clean(w).length;
      blankPos = i;
    }
  });
  if (blankPos < 0) return null;

  const answer = clean(words[blankPos]);
  const answerLc = answer.toLowerCase();
  const distractors = pickDistractors(pool, answerLc, answer.length, 3, rnd);
  if (distractors.length < 1) return null;

  const promptWords = words.slice();
  promptWords[blankPos] = "_____";
  const options = shuffle([answer, ...distractors], rnd);

  return {
    id: `cloze-${idx}`,
    type: "cloze",
    prompt: promptWords.join(" "),
    options,
    answerIndex: options.indexOf(answer),
  };
}

function makeTrueFalse(
  text: NormalizedText,
  span: Span,
  idx: number,
  pool: string[],
  rnd: (max: number) => number,
): Question | null {
  const words = sentenceWords(text, span);
  const makeFalse = rnd(2) === 0;
  const options = ["True", "False"];

  if (!makeFalse) {
    return {
      id: `tf-${idx}`,
      type: "tf",
      prompt: `True or false: "${words.join(" ")}"`,
      options,
      answerIndex: 0,
    };
  }

  // Corrupt one content word with a different pool word to make it false.
  const positions = words
    .map((w, i) => (isContentWord(w) ? i : -1))
    .filter((i) => i >= 0);
  if (positions.length === 0) return null;
  const pos = positions[rnd(positions.length)];
  const original = clean(words[pos]).toLowerCase();
  const replacement = pool.find((p) => p.toLowerCase() !== original);
  if (!replacement) return null;

  const corrupted = words.slice();
  corrupted[pos] = replacement;
  return {
    id: `tf-${idx}`,
    type: "tf",
    prompt: `True or false: "${corrupted.join(" ")}"`,
    options,
    answerIndex: 1,
  };
}

function pickDistractors(
  pool: string[],
  answerLc: string,
  answerLen: number,
  n: number,
  rnd: (max: number) => number,
): string[] {
  const similar = pool.filter(
    (p) => p.toLowerCase() !== answerLc && Math.abs(p.length - answerLen) <= 3,
  );
  const fallback = pool.filter((p) => p.toLowerCase() !== answerLc);
  const source = similar.length >= n ? similar : fallback;
  return shuffle(source, rnd).slice(0, n);
}

/** Evenly sample up to `n` items across the list (keeps questions spread out). */
function spread<T>(items: T[], n: number, rnd: (max: number) => number): T[] {
  if (items.length <= n) return shuffle(items, rnd);
  const step = items.length / n;
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(items[Math.floor(i * step)]);
  return out;
}

export function scoreAnswers(answers: AnsweredQuestion[]): Score {
  const total = answers.length;
  const correct = answers.filter(
    (a) => a.selectedIndex === a.question.answerIndex,
  ).length;
  return { correct, total, pct: total ? Math.round((correct / total) * 100) : 0 };
}
