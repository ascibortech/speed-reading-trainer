import { useEffect, useMemo, useState } from "react";
import { defaultParams, type NormalizedText, type Params } from "@srt/contracts";
import type { SessionMetadata } from "@srt/contracts/metadata";
import { addSession, getSessions } from "@srt/storage";
import { registry } from "./engine.js";
import { ProfileGate } from "./components/ProfileGate.js";
import { Uploader } from "./components/Uploader.js";
import { Catalogue } from "./components/Catalogue.js";
import { ParamControls } from "./components/ParamControls.js";
import { SessionRunner } from "./components/SessionRunner.js";
import { ProgressView } from "./components/ProgressView.js";
import { ExportImport } from "./components/ExportImport.js";
import { ExamPanel } from "./exam/ExamPanel.js";
import { Changelog } from "./components/Changelog.js";
import { LanguageFlags, useT } from "./i18n/index.js";
import { APP_VERSION } from "./changelog.js";

type Tab = "train" | "exam" | "progress";

export function App() {
  const t = useT();
  const [username, setUsername] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("train");
  const [showChangelog, setShowChangelog] = useState(false);

  const [text, setText] = useState<NormalizedText | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [params, setParams] = useState<Params>({});
  const [running, setRunning] = useState(false);

  const [sessions, setSessions] = useState<SessionMetadata[]>([]);
  const [result, setResult] = useState<SessionMetadata | null>(null);

  const descriptors = useMemo(() => registry.list(), []);
  const selected = descriptors.find((d) => d.id === selectedId) ?? null;

  useEffect(() => {
    if (username) void refreshSessions(username);
  }, [username]);

  async function refreshSessions(user: string) {
    setSessions(await getSessions(user));
  }

  function selectExercise(id: string) {
    setSelectedId(id);
    const d = descriptors.find((x) => x.id === id);
    if (d) setParams(defaultParams(d.paramSchema));
    setResult(null);
  }

  async function handleComplete(meta: SessionMetadata) {
    await addSession(meta);
    setRunning(false);
    setResult(meta);
    if (username) await refreshSessions(username);
  }

  function switchProfile() {
    setUsername(null);
    setText(null);
    setFileName(null);
    setSelectedId(null);
    setRunning(false);
    setResult(null);
    setSessions([]);
  }

  const footer = (
    <footer className="app-footer">
      <p className="muted small">{t("footer.privacy")}</p>
      <button className="link version" onClick={() => setShowChangelog(true)}>
        {t("changelog.link", undefined, { version: APP_VERSION })}
      </button>
    </footer>
  );

  if (!username) {
    return (
      <>
        <ProfileGate onSelect={setUsername} />
        {footer}
        {showChangelog && <Changelog onClose={() => setShowChangelog(false)} />}
      </>
    );
  }

  const canStart = selected && (!selected.needsText || text);

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">Speed Reading Trainer</div>
        <div className="header-right">
          <LanguageFlags />
          <ExportImport
            username={username}
            onImported={() => void refreshSessions(username)}
          />
          <span className="profile-chip">
            {username}
            <button className="link" onClick={switchProfile}>
              {t("header.switch")}
            </button>
          </span>
        </div>
      </header>

      <nav className="tabs">
        <button
          className={tab === "train" ? "active" : ""}
          onClick={() => setTab("train")}
        >
          {t("nav.train")}
        </button>
        <button
          className={tab === "exam" ? "active" : ""}
          onClick={() => setTab("exam")}
        >
          {t("nav.exam")}
        </button>
        <button
          className={tab === "progress" ? "active" : ""}
          onClick={() => setTab("progress")}
        >
          {t("nav.progress")}
        </button>
      </nav>

      <main>
        {tab === "train" && !running && (
          <>
            <Uploader
              text={text}
              fileName={fileName}
              onParsed={(parsed, name) => {
                setText(parsed);
                setFileName(name);
              }}
              onClear={() => {
                setText(null);
                setFileName(null);
              }}
            />

            <Catalogue
              exercises={descriptors}
              selectedId={selectedId}
              textLoaded={!!text}
              onSelect={selectExercise}
            />

            {selected && (
              <section className="card">
                <h2>{t("settings.heading")}</h2>
                <ParamControls
                  schema={selected.paramSchema}
                  params={params}
                  onChange={setParams}
                />
                <button
                  className="primary big"
                  disabled={!canStart}
                  onClick={() => {
                    setResult(null);
                    setRunning(true);
                  }}
                >
                  {t("settings.start")}
                </button>
                {!canStart && selected.needsText && (
                  <p className="hint">{t("settings.loadFirst")}</p>
                )}
              </section>
            )}

            {result && (
              <section className="card result">
                <h2>{t("result.saved")}</h2>
                <div className="stats">
                  <div className="stat">
                    <span className="stat-value">{Math.round(result.wpm)}</span>
                    <span className="stat-label">{t("result.wpm")}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{result.wordsProcessed}</span>
                    <span className="stat-label">{t("result.words")}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">
                      {Math.round(result.durationSec)}s
                    </span>
                    <span className="stat-label">{t("result.duration")}</span>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {tab === "train" && running && selected && (
          <SessionRunner
            exerciseId={selected.id}
            descriptor={selected}
            text={text}
            params={params}
            username={username}
            onComplete={handleComplete}
            onCancel={() => setRunning(false)}
          />
        )}

        {tab === "exam" && <ExamPanel username={username} />}

        {tab === "progress" && (
          <ProgressView sessions={sessions} totalExercises={descriptors.length} />
        )}
      </main>

      {footer}
      {showChangelog && <Changelog onClose={() => setShowChangelog(false)} />}
    </div>
  );
}
