import { useEffect, useRef, useState } from "react";
import type {
  ExerciseDescriptor,
  NormalizedText,
  Params,
  RenderSurface,
} from "@srt/contracts";
import type { SessionMetadata } from "@srt/contracts/metadata";
import type { RunningSession, SessionState } from "@srt/engine-core";
import { engine } from "../engine.js";

interface Props {
  exerciseId: string;
  descriptor: ExerciseDescriptor;
  text: NormalizedText | null;
  params: Params;
  username: string;
  onComplete: (metadata: SessionMetadata) => void;
  onCancel: () => void;
}

/**
 * Mounts the engine on a render surface and drives one exercise session
 * (system-design §2.3). On natural completion or Stop the finalized
 * SessionMetadata bubbles up; unmounting without finishing cancels (no record).
 */
export function SessionRunner({
  exerciseId,
  descriptor,
  text,
  params,
  username,
  onComplete,
  onCancel,
}: Props) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<RunningSession | null>(null);
  const [state, setState] = useState<SessionState>("running");

  useEffect(() => {
    let cancelled = false;
    const host = surfaceRef.current!;
    // Each run gets its OWN mount node. Under React StrictMode the effect runs
    // setup→cleanup→setup; a per-run node means a stale run's teardown can never
    // clear the DOM the live run rendered (the bug a shared root would cause).
    const mount = document.createElement("div");
    mount.style.position = "relative";
    host.appendChild(mount);
    const surface: RenderSurface = {
      root: mount,
      clear: () => mount.replaceChildren(),
    };
    // Schulte-style (needsText:false) exercises run without text; pointer needs it.
    const runText: NormalizedText =
      text ?? { words: [], sentences: [], paragraphs: [], wordCount: 0, sourceFormat: "txt" };

    void engine
      .run(exerciseId, runText, {
        username,
        stage: descriptor.stage,
        difficulty: 1,
        params,
        surface,
        onComplete: (meta) => {
          sessionRef.current = null;
          onComplete(meta);
        },
      })
      .then((session) => {
        if (cancelled) {
          session.cancel();
          mount.remove();
          return;
        }
        sessionRef.current = session;
      });

    return () => {
      cancelled = true;
      sessionRef.current?.cancel();
      sessionRef.current = null;
      mount.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pause() {
    sessionRef.current?.pause();
    setState("paused");
  }
  function resume() {
    sessionRef.current?.resume();
    setState("running");
  }
  function stop() {
    sessionRef.current?.stop(); // finalizes + records via onComplete
  }

  return (
    <section className="card runner">
      <div className="runner-head">
        <h2>{descriptor.title}</h2>
        <div className="row">
          {state === "running" ? (
            <button onClick={pause}>Pause</button>
          ) : (
            <button onClick={resume}>Resume</button>
          )}
          <button className="primary" onClick={stop} title="Stop now and save what's measured so far">
            Stop &amp; save
          </button>
          <button className="link" onClick={onCancel}>
            Discard
          </button>
        </div>
      </div>
      <div ref={surfaceRef} className="surface" aria-live="off" />
    </section>
  );
}
