/**
 * Document parsing layer (system-design §3.1). One interface, per-format parsers.
 * Parsers are lazy-loaded so a .txt user never downloads the PDF/EPUB engines.
 *
 * Phase 1 shipped `.txt`; Phase 2 adds `.pdf` (lazy-loaded). `.docx`/`.epub`/
 * `.mobi` (Phase 5) register here via dynamic import() as they land.
 */
import type { NormalizedText, SourceFormat } from "@srt/contracts";
import { parseTxtFile } from "./txt.js";

export { normalizeText } from "./normalize.js";
export { parseTxtFile, decodeText, EmptyTextError } from "./txt.js";

export class UnsupportedFormatError extends Error {
  constructor(public readonly ext: string) {
    super(`Format ".${ext}" is not supported yet.`);
    this.name = "UnsupportedFormatError";
  }
}

const SUPPORTED_NOW: SourceFormat[] = ["txt", "pdf"];
/** Formats the architecture targets, in ship order (system-design §3.1). */
export const PLANNED_FORMATS: SourceFormat[] = [
  "txt",
  "pdf",
  "docx",
  "epub",
  "mobi",
];

export function extensionOf(filename: string): string {
  const m = /\.([^.]+)$/.exec(filename.toLowerCase());
  return m ? m[1] : "";
}

export function isSupported(filename: string): boolean {
  return SUPPORTED_NOW.includes(extensionOf(filename) as SourceFormat);
}

/** Dispatch a file to the right parser by extension (lazy where heavy). */
export async function parseFile(file: File): Promise<NormalizedText> {
  const ext = extensionOf(file.name);
  switch (ext) {
    case "txt":
    case "":
      return parseTxtFile(file);
    case "pdf":
      return (await import("./pdf.js")).parsePdfFile(file);
    default:
      // Phase 5: docx (mammoth), epub (epubjs+JSZip), mobi (foliate-js).
      throw new UnsupportedFormatError(ext);
  }
}
