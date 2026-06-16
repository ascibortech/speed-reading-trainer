/**
 * PDF parser (system-design §3.1) — pdf.js (Mozilla), 100% in-browser. This
 * module is loaded lazily (dynamic import from index.ts) so a .txt-only user
 * never downloads the PDF engine. The text is never transmitted.
 *
 * Scanned / image-only PDFs yield no extractable text — surfaced as EmptyTextError
 * rather than a silent empty result.
 */
import * as pdfjs from "pdfjs-dist";
import type { NormalizedText } from "@srt/contracts";
import { normalizeText } from "./normalize.js";
import { EmptyTextError } from "./txt.js";

// Bundled worker (Vite resolves this to a hashed asset; no CDN, no network).
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export async function parsePdfFile(file: Blob): Promise<NormalizedText> {
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  try {
    const pages: string[] = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      const line = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      pages.push(line);
    }
    const normalized = normalizeText(pages.join("\n\n"), "pdf");
    if (normalized.wordCount === 0) throw new EmptyTextError();
    return normalized;
  } finally {
    await doc.destroy();
  }
}
