/**
 * Storage / export layer (system-design §3.5, §4; ADR-003). All persistence lives
 * here: IndexedDB for profiles/sessions/exam runs, plus JSON export/import for
 * backup and cross-device transfer.
 *
 * TEXT BOUNDARY: this module imports ONLY `@srt/contracts/metadata`. It has no
 * access to `NormalizedText` — enforced by scripts/check-text-boundary.mjs — so an
 * export can never contain user text.
 */
import {
  EXPORT_SCHEMA_VERSION,
  type ExamRun,
  type Profile,
  type ProgressExport,
  type ReviewItem,
  type SessionMetadata,
} from "@srt/contracts/metadata";
import { STORE, get, getAll, getAllByIndex, put, writeMany } from "./db.js";
import { hashPassphrase, verifyPassphrase } from "./crypto.js";

export { hashPassphrase, verifyPassphrase } from "./crypto.js";
export { DB_NAME, DB_VERSION, _resetConnectionForTests } from "./db.js";

interface ProgressIndexRecord {
  username: string;
  sessionIds: string[];
  examRunIds: string[];
}

export class ProfileExistsError extends Error {
  constructor(username: string) {
    super(`Profile "${username}" already exists.`);
    this.name = "ProfileExistsError";
  }
}

export class ImportSchemaError extends Error {
  constructor(version: unknown) {
    super(`Unsupported export schema version: ${String(version)}`);
    this.name = "ImportSchemaError";
  }
}

// ── Profiles ────────────────────────────────────────────────────────────────

export async function listProfiles(): Promise<Profile[]> {
  return getAll<Profile>(STORE.profiles);
}

export async function getProfile(username: string): Promise<Profile | undefined> {
  return get<Profile>(STORE.profiles, username);
}

export async function createProfile(
  username: string,
  passphrase?: string,
): Promise<Profile> {
  const name = username.trim();
  if (!name) throw new Error("Username is required.");
  if (await getProfile(name)) throw new ProfileExistsError(name);
  const profile: Profile = {
    username: name,
    createdAt: new Date().toISOString(),
    passphraseHash: passphrase ? await hashPassphrase(passphrase) : undefined,
  };
  await put(STORE.profiles, profile);
  await put<ProgressIndexRecord>(STORE.progressIndex, {
    username: name,
    sessionIds: [],
    examRunIds: [],
  });
  return profile;
}

/** Soft local unlock. Profiles with no passphrase always unlock. */
export async function unlockProfile(
  username: string,
  passphrase: string,
): Promise<boolean> {
  const profile = await getProfile(username);
  if (!profile) return false;
  if (!profile.passphraseHash) return true;
  return verifyPassphrase(passphrase, profile.passphraseHash);
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function addSession(session: SessionMetadata): Promise<void> {
  await writeMany([STORE.sessions, STORE.progressIndex], (tx) => {
    tx.objectStore(STORE.sessions).put(session);
    const idx = tx.objectStore(STORE.progressIndex);
    const req = idx.get(session.username);
    req.onsuccess = () => {
      const cur: ProgressIndexRecord = req.result ?? {
        username: session.username,
        sessionIds: [],
        examRunIds: [],
      };
      if (!cur.sessionIds.includes(session.sessionId)) {
        cur.sessionIds.push(session.sessionId);
      }
      idx.put(cur);
    };
  });
}

export async function getSessions(username: string): Promise<SessionMetadata[]> {
  const rows = await getAllByIndex<SessionMetadata>(
    STORE.sessions,
    "by-username",
    username,
  );
  return rows.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}

// ── Exam runs ───────────────────────────────────────────────────────────────

export async function addExamRun(run: ExamRun): Promise<void> {
  await writeMany([STORE.examRuns, STORE.progressIndex], (tx) => {
    tx.objectStore(STORE.examRuns).put(run);
    const idx = tx.objectStore(STORE.progressIndex);
    const req = idx.get(run.username);
    req.onsuccess = () => {
      const cur: ProgressIndexRecord = req.result ?? {
        username: run.username,
        sessionIds: [],
        examRunIds: [],
      };
      if (!cur.examRunIds.includes(run.examRunId)) {
        cur.examRunIds.push(run.examRunId);
      }
      idx.put(cur);
    };
  });
}

export async function getExamRuns(username: string): Promise<ExamRun[]> {
  const rows = await getAllByIndex<ExamRun>(
    STORE.examRuns,
    "by-username",
    username,
  );
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

// ── Review items (spaced repetition, §5.1) ───────────────────────────────────

export async function addReview(review: ReviewItem): Promise<void> {
  await put(STORE.reviews, review);
}

export async function getReviews(username: string): Promise<ReviewItem[]> {
  const rows = await getAllByIndex<ReviewItem>(STORE.reviews, "by-username", username);
  return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// ── Export / Import (ADR-003) ─────────────────────────────────────────────────

/** Build the portable, metadata-only export document for a profile. */
export async function exportProgress(username: string): Promise<ProgressExport> {
  const profile = await getProfile(username);
  if (!profile) throw new Error(`Unknown profile: ${username}`);
  const [sessions, examRuns, reviews] = await Promise.all([
    getSessions(username),
    getExamRuns(username),
    getReviews(username),
  ]);
  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    profile: { username: profile.username, createdAt: profile.createdAt },
    sessions,
    examRuns,
    reviews,
  };
}

/** Serialize the export document to a downloadable JSON string. */
export async function exportProgressJson(username: string): Promise<string> {
  return JSON.stringify(await exportProgress(username), null, 2);
}

/**
 * Import a progress document. Creates the profile if absent (no passphrase — the
 * export never carries one), then writes all sessions and exam runs and rebuilds
 * the progress index. Records are immutable, so import is idempotent on id.
 */
export async function importProgress(doc: ProgressExport): Promise<Profile> {
  if (doc.schemaVersion !== EXPORT_SCHEMA_VERSION) {
    // Only v1 exists today; future versions migrate here before this guard.
    throw new ImportSchemaError(doc.schemaVersion);
  }
  const username = doc.profile.username;
  let profile = await getProfile(username);
  if (!profile) {
    profile = {
      username,
      createdAt: doc.profile.createdAt ?? new Date().toISOString(),
    };
    await put(STORE.profiles, profile);
  }

  for (const s of doc.sessions) await addSession({ ...s, username });
  for (const r of doc.examRuns) await addExamRun({ ...r, username });
  for (const rv of doc.reviews ?? []) await addReview({ ...rv, username });
  return profile;
}
