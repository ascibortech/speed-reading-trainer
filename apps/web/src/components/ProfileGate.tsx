import { useEffect, useState } from "react";
import type { Profile } from "@srt/contracts/metadata";
import {
  createProfile,
  listProfiles,
  ProfileExistsError,
  unlockProfile,
} from "@srt/storage";

interface Props {
  onSelect: (username: string) => void;
}

/**
 * Local-profile gate (system-design §4.2). Profiles separate users on a device;
 * the optional passphrase is a SOFT LOCK, not access control — stated plainly.
 */
export function ProfileGate({ onSelect }: Props) {
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
          ? err.message
          : "Could not create profile.",
      );
    }
  }

  async function handleSelect(name: string, hasPass: boolean) {
    setError(null);
    if (!hasPass) return onSelect(name);
    const ok = await unlockProfile(name, passphrase);
    if (ok) onSelect(name);
    else setError("Incorrect passphrase.");
  }

  return (
    <div className="card gate">
      <h1>Speed Reading Trainer</h1>
      <p className="muted">
        Train on your own text — parsed and used entirely in your browser. Nothing
        you upload ever leaves this device.
      </p>

      {mode === "select" && profiles.length > 0 && (
        <>
          <h2>Choose a profile</h2>
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
              Passphrase (for locked profiles)
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                autoComplete="off"
              />
            </label>
          )}
          <button className="link" onClick={() => setMode("create")}>
            + New profile
          </button>
        </>
      )}

      {mode === "create" && (
        <form onSubmit={handleCreate}>
          <h2>New profile</h2>
          <label className="field">
            Username (not an email)
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="off"
            />
          </label>
          <label className="field">
            Passphrase <span className="muted">(optional — a soft local lock,
            not security)</span>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <div className="row">
            <button className="primary" type="submit">
              Create
            </button>
            {profiles.length > 0 && (
              <button
                type="button"
                className="link"
                onClick={() => setMode("select")}
              >
                Back
              </button>
            )}
          </div>
        </form>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
}
