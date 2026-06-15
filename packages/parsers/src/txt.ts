/**
 * Plain-text parser (system-design §3.1). Reads a File/Blob as text, detecting
 * UTF-8/UTF-16 BOM, and normalizes it. 100% in-browser; the text is never
 * transmitted.
 */
import type { NormalizedText } from "@srt/contracts";
import { normalizeText } from "./normalize.js";

export class EmptyTextError extends Error {
  constructor() {
    super("The file contains no readable text.");
    this.name = "EmptyTextError";
  }
}

/** Decode an ArrayBuffer to a string, honoring a UTF-16/UTF-8 BOM. */
export function decodeText(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let encoding = "utf-8";
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    encoding = "utf-16le";
  } else if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    encoding = "utf-16be";
  }
  return new TextDecoder(encoding).decode(buf);
}

export async function parseTxtFile(file: Blob): Promise<NormalizedText> {
  const buf = await file.arrayBuffer();
  const raw = decodeText(buf);
  const normalized = normalizeText(raw, "txt");
  if (normalized.wordCount === 0) throw new EmptyTextError();
  return normalized;
}
