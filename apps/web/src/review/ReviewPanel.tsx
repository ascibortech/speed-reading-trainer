import { useEffect, useMemo, useState } from "react";
import type { NormalizedText } from "@srt/contracts";
import type { ReviewItem, SessionMetadata } from "@srt/contracts/metadata";
import { addReview, addSession, getReviews } from "@srt/storage";
import { daysSince, firstSchedule, isDue, nextSchedule } from "@srt/spaced-repetition";
import { registry } from "../engine.js";
import { Uploader } from "../components/Uploader.js";
import { SessionRunner } from "../components/SessionRunner.js";
import { useT } from "../i18n/index.js";

interface Props {
  username: string;
}

type View = "list" | "new" | "review";

/**
 * Spaced-repetition review (system-design §5.1). The user memorizes a passage,
 * names it, and the app schedules expanding re-tests. Each review re-runs the
 * memorization exercise on the re-uploaded text (we never store the text) and
 * records the recall score, charting decay over time.
 */
export function ReviewPanel({ username }: Props) {
  const t = useT();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [view, setView] = useState<View>("list");
  const [active, setActive] = useState<ReviewItem | null>(null);
  const [label, setLabel] = useState("");
  const [text, setText] = useState<NormalizedText | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const descriptor = useMemo(
    () => registry.get("memorization")?.descriptor ?? null,
    [],
  );

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  async function refresh() {
    setReviews(await getReviews(username));
  }

  function reset() {
    setView("list");
    setActive(null);
    setLabel("");
    setText(null);
    setFileName(null);
    setRunning(false);
  }

  const intervalDays =
    view === "review" && active ? daysSince(active.createdAt, new Date()) : 0;
  const runParams = { mode: "free", technique: "none", retentionIntervalDays: intervalDays };

  async function onComplete(meta: SessionMetadata) {
    await addSession(meta);
    const pct = Number(meta.params.recallCoveragePct ?? 0);
    const now = new Date().toISOString();

    if (view === "new") {
      const sched = firstSchedule(now);
      await addReview({
        reviewId: crypto.randomUUID(),
        username,
        label: label.trim() || "Untitled",
        createdAt: now,
        intervalIndex: sched.intervalIndex,
        dueAt: sched.dueAt,
        history: [{ date: now, recallPct: pct, intervalDays: 0 }],
      });
    } else if (view === "review" && active) {
      const sched = nextSchedule(active.intervalIndex, pct, now);
      await addReview({
        ...active,
        intervalIndex: sched.intervalIndex,
        dueAt: sched.dueAt,
        history: [
          ...active.history,
          { date: now, recallPct: pct, intervalDays: intervalDays },
        ],
      });
    }
    reset();
    await refresh();
  }

  // ── Running the memorization exercise ───────────────────────────────────────
  if (running && descriptor) {
    return (
      <SessionRunner
        exerciseId="memorization"
        descriptor={descriptor}
        text={text}
        params={runParams}
        username={username}
        onComplete={onComplete}
        onCancel={reset}
      />
    );
  }

  // ── New / review setup (label + upload) ─────────────────────────────────────
  if (view === "new" || view === "review") {
    const title =
      view === "new"
        ? t("rev.newTitle", "New review item")
        : t("rev.reviewTitle", "Review: {label}", { label: active?.label ?? "" });
    return (
      <section className="card">
        <h2>{title}</h2>
        {view === "new" && (
          <label className="field">
            {t("rev.label", "Name this passage")}
            <input value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />
          </label>
        )}
        <Uploader
          text={text}
          fileName={fileName}
          onParsed={(p, name) => {
            setText(p);
            setFileName(name);
          }}
          onClear={() => {
            setText(null);
            setFileName(null);
          }}
        />
        <div className="row">
          <button
            className="primary"
            disabled={!text || (view === "new" && !label.trim())}
            onClick={() => setRunning(true)}
          >
            {t("rev.start", "Start memorizing")}
          </button>
          <button className="link" onClick={reset}>
            {t("rev.back", "Back")}
          </button>
        </div>
      </section>
    );
  }

  // ── List ─────────────────────────────────────────────────────────────────--
  const now = new Date();
  return (
    <section className="card">
      <h2>{t("rev.heading", "Memorize & review")}</h2>
      <p className="muted small">
        {t(
          "rev.intro",
          "Memorize a passage, then re-test it at expanding intervals to see what sticks.",
        )}
      </p>

      {reviews.length === 0 ? (
        <p className="muted">{t("rev.empty", "No review items yet.")}</p>
      ) : (
        <ul className="review-list">
          {reviews.map((r) => {
            const due = isDue(r.dueAt, now);
            const last = r.history[r.history.length - 1];
            const dueInDays = Math.max(
              0,
              Math.ceil((new Date(r.dueAt).getTime() - now.getTime()) / 86_400_000),
            );
            return (
              <li key={r.reviewId} className="review-item">
                <div className="review-main">
                  <strong>{r.label}</strong>
                  <span className="muted small">
                    {due
                      ? t("rev.due", "Due now")
                      : t("rev.dueIn", "Due in {days}d", { days: dueInDays })}{" "}
                    · {t("rev.lastRecall", "last {pct}%", { pct: last.recallPct })} ·{" "}
                    {t("rev.reviews", "{n} reviews", { n: r.history.length })}
                  </span>
                </div>
                <DecayChart history={r.history} />
                <button
                  className={due ? "primary" : ""}
                  onClick={() => {
                    setActive(r);
                    setView("review");
                  }}
                >
                  {t("rev.reviewNow", "Review")}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button className="primary big" onClick={() => setView("new")}>
        {t("rev.add", "New review item")}
      </button>
    </section>
  );
}

/** Recall-over-time sparkline (the decay curve, §5.1). */
function DecayChart({ history }: { history: ReviewItem["history"] }) {
  if (history.length < 2) return <span className="muted small">—</span>;
  const w = 160;
  const h = 36;
  const pts = history
    .map((p, i) => {
      const x = (i / (history.length - 1)) * w;
      const y = h - (p.recallPct / 100) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg className="sparkline" viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <polyline fill="none" stroke="var(--accent, #2563eb)" strokeWidth="2" points={pts} />
    </svg>
  );
}
