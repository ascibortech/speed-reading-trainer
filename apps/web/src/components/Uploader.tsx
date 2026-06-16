import { useRef, useState } from "react";
import type { NormalizedText } from "@srt/contracts";
import { EmptyTextError, extensionOf, parseFile, UnsupportedFormatError } from "@srt/parsers";
import { useT } from "../i18n/index.js";

interface Props {
  text: NormalizedText | null;
  fileName: string | null;
  onParsed: (text: NormalizedText, fileName: string) => void;
  onClear: () => void;
}

/** Client-side upload + parse. The file is read in-browser and never transmitted. */
export function Uploader({ text, fileName, onParsed, onClear }: Props) {
  const t = useT();
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
        setError(t("up.errUnsupported", undefined, { ext: extensionOf(file.name) }));
      } else if (err instanceof EmptyTextError) {
        setError(t("up.errEmpty"));
      } else {
        setError(t("up.errRead"));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h2>{t("up.heading")}</h2>
      <p className="muted small">{t("up.privacy")}</p>

      {!text && (
        <>
          <button
            className="primary"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? t("up.reading") : t("up.choose")}
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
            <span className="muted">
              {" "}
              · {text.wordCount.toLocaleString()} {t("common.words")}
            </span>
          </div>
          <button className="link" onClick={onClear}>
            {t("up.replace")}
          </button>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </section>
  );
}
