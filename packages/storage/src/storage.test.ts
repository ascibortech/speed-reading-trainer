import { describe, expect, it } from "vitest";
import type { SessionMetadata } from "@srt/contracts/metadata";
import {
  addSession,
  createProfile,
  exportProgress,
  getSessions,
  importProgress,
  ProfileExistsError,
  unlockProfile,
} from "./index.js";

function session(username: string, id: string, wpm: number): SessionMetadata {
  return {
    sessionId: id,
    username,
    exerciseId: "pointer",
    stage: "beginner",
    difficulty: 1,
    startedAt: new Date().toISOString(),
    durationSec: 60,
    wordsProcessed: wpm,
    wpm,
    params: {},
  };
}

describe("storage", () => {
  it("creates a profile and records sessions", async () => {
    await createProfile("ada");
    await addSession(session("ada", "s1", 250));
    await addSession(session("ada", "s2", 300));
    const sessions = await getSessions("ada");
    expect(sessions.map((s) => s.wpm)).toEqual([250, 300]);
  });

  it("rejects duplicate usernames", async () => {
    await createProfile("grace");
    await expect(createProfile("grace")).rejects.toBeInstanceOf(
      ProfileExistsError,
    );
  });

  it("treats the passphrase as a soft lock", async () => {
    await createProfile("locked", "hunter2");
    expect(await unlockProfile("locked", "hunter2")).toBe(true);
    expect(await unlockProfile("locked", "wrong")).toBe(false);
  });

  it("exports metadata only and re-imports into a fresh profile", async () => {
    await createProfile("linus");
    await addSession(session("linus", "x1", 400));
    const doc = await exportProgress("linus");

    // The export carries no passphrase and no text — metadata only.
    expect(doc.profile).not.toHaveProperty("passphraseHash");
    expect(JSON.stringify(doc)).not.toMatch(/passphrase/i);
    expect(doc.sessions).toHaveLength(1);

    const transferred = { ...doc, profile: { ...doc.profile, username: "linus2" } };
    await importProgress(transferred);
    const imported = await getSessions("linus2");
    expect(imported).toHaveLength(1);
    expect(imported[0].wpm).toBe(400);
  });
});
