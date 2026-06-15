import { describe, expect, it } from "vitest";
import { normalizeText } from "./normalize.js";
import { decodeText } from "./txt.js";

describe("normalizeText", () => {
  it("tokenizes words, sentences, paragraphs and lines", () => {
    const raw = "Hello world. This is\na test.\n\nSecond paragraph here.";
    const nt = normalizeText(raw, "txt");
    expect(nt.wordCount).toBe(9);
    expect(nt.words[0]).toBe("Hello");
    expect(nt.paragraphs).toHaveLength(2);
    // "Hello world." and "This is a test." and "Second paragraph here."
    expect(nt.sentences).toHaveLength(3);
    // two physical lines in paragraph 1, one in paragraph 2
    expect(nt.lineHints).toHaveLength(3);
    expect(nt.sourceFormat).toBe("txt");
  });

  it("handles trailing text with no terminal punctuation", () => {
    const nt = normalizeText("no period here", "txt");
    expect(nt.sentences).toHaveLength(1);
    expect(nt.sentences[0]).toEqual({ start: 0, end: 3 });
  });

  it("strips a UTF-8 BOM", () => {
    const nt = normalizeText("\uFEFFword one", "txt");
    expect(nt.words[0]).toBe("word");
  });

  it("returns zero words for empty input", () => {
    expect(normalizeText("   \n\n  ", "txt").wordCount).toBe(0);
  });
});

describe("decodeText", () => {
  it("decodes UTF-8 by default", () => {
    const bytes = new TextEncoder().encode("café");
    expect(decodeText(bytes.buffer)).toBe("café");
  });
});
