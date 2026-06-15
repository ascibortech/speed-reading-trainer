import { useRef, useState } from "react";
import type { NormalizedText } from "@srt/contracts";
import { EmptyTextError, parseFile, UnsupportedFormatError } from "@srt/parsers";

interface Props {
  text: NormalizedText | null;
  fileName: string | null;
  onParsed: (text: NormalizedText, fileName: string) => void;
  onClear: () => void;
}

/** Client-side upload + parse. The file is read in-browser and never transmitted. */
export function Uploader({ text, fileName, onParsed, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const parsed = await parseFile(file);
      onParsed(parsed, file.name);
    } catch (err) {
      if (err instanceof UnsupportedFormatError) {
        setError(`${err.message} (Supported now: .txt and .pdf.)`);
      } else if (err instanceof EmptyTextError) {
        setError(err.message);
      } else {
        setError("Could not read this file.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h2>1 · Your text</h2>
      <p className="muted small">
        Held in memory for this session only — never uploaded, never stored.
      </p>

      {!text && (
        <>
          <button
            className="primary"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "Reading…" : "Choose a .txt or .pdf file"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".txt,text/plain,.pdf,application/pdf"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = "";
            }}
          />
        </>
      )}

      {text && (
        <div className="loaded">
          <div>
            <strong>{fileName}</strong>
            <span className="muted"> · {text.wordCount.toLocaleString()} words</span>
          </div>
          <button className="link" onClick={onClear}>
            Replace
          </button>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </section>
  );
}
