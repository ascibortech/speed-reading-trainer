import { useRef, useState } from "react";
import type { ProgressExport } from "@srt/contracts/metadata";
import { exportProgressJson, importProgress } from "@srt/storage";

interface Props {
  username: string;
  onImported: () => void;
}

/**
 * Export / import is a FIRST-CLASS feature (ADR-003 action item): it is the only
 * way data leaves the device, and doubles as backup + cross-device transfer +
 * account recovery. Metadata only — the text boundary guarantees no user text.
 */
export function ExportImport({ username, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleExport() {
    const json = await exportProgressJson(username);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `speed-reading-${username}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg("Progress exported.");
  }

  async function handleImport(file: File) {
    setMsg(null);
    try {
      const doc = JSON.parse(await file.text()) as ProgressExport;
      await importProgress(doc);
      setMsg("Progress imported.");
      onImported();
    } catch {
      setMsg("Could not import that file.");
    }
  }

  return (
    <div className="export-import">
      <button onClick={handleExport} title="Download a backup of your progress">
        ⭳ Export my progress
      </button>
      <button onClick={() => inputRef.current?.click()}>⭱ Import</button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleImport(f);
          e.target.value = "";
        }}
      />
      {msg && <span className="muted small">{msg}</span>}
    </div>
  );
}
