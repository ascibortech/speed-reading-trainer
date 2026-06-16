import { useEffect, useState } from "react";
import type { Profile } from "@srt/contracts/metadata";
import {
  createProfile,
  listProfiles,
  ProfileExistsError,
  unlockProfile,
} from "@srt/storage";
import { LanguageFlags, useT } from "../i18n/index.js";

interface Props {
  onSelect: (username: string) => void;
}

/**
 * Local-profile gate (system-design §4.2). Profiles separate users on a device;
 * the optional passphrase is a SOFT LOCK, not access control — stated plainly.
 */
export function ProfileGate({ onSelect }: Props) {
  const t = useT();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [mode, setMode] = useState<"select" | "create">("select");
  const [username, setUsername] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listProfiles().then((p) => {
      setProfiles(p);
      if (p.length === 0) setMode("create");
    });
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const p = await createProfile(username, passphrase || undefined);
      onSelect(p.username);
    } catch (err) {
      setError(
        err instanceof ProfileExistsError
          ? t("gate.errExists", undefined, { name: username.trim() })
          : t("gate.errCreate"),
      );
    }
  }

  async function handleSelect(name: string, hasPass: boolean) {
    setError(null);
    if (!hasPass) return onSelect(name);
    const ok = await unlockProfile(name, passphrase);
    if (ok) onSelect(name);
    else setError(t("gate.errPass"));
  }

  return (
    <div className="card gate">
      <div className="gate-top">
        <LanguageFlags />
      </div>
      <h1>Speed Reading Trainer</h1>
      <p className="muted">{t("gate.intro")}</p>

      {mode === "select" && profiles.length > 0 && (
        <>
          <h2>{t("gate.choose")}</h2>
          <ul className="profile-list">
            {profiles.map((p) => (
              <li key={p.username}>
                <button
                  className="profile-btn"
                  onClick={() => handleSelect(p.username, !!p.passphraseHash)}
                >
                  <span>{p.username}</span>
                  {p.passphraseHash && <span className="lock">🔒</span>}
                </button>
              </li>
            ))}
          </ul>
          {profiles.some((p) => p.passphraseHash) && (
            <label className="field">
              {t("gate.passLocked")}
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                autoComplete="off"
              />
            </label>
          )}
          <button className="link" onClick={() => setMode("create")}>
            {t("gate.new")}
          </button>
        </>
      )}

      {mode === "create" && (
        <form onSubmit={handleCreate}>
          <h2>{t("gate.newTitle")}</h2>
          <label className="field">
            {t("gate.username")}
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="off"
            />
          </label>
          <label className="field">
            {t("gate.passphrase")}{" "}
            <span className="muted">{t("gate.passHint")}</span>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <div className="row">
            <button className="primary" type="submit">
              {t("gate.create")}
            </button>
            {profiles.length > 0 && (
              <button
                type="button"
                className="link"
                onClick={() => setMode("select")}
              >
                {t("gate.back")}
              </button>
            )}
          </div>
        </form>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
}
