import type { SessionMetadata } from "@srt/contracts/metadata";
import { useT } from "../i18n/index.js";

interface Props {
  sessions: SessionMetadata[];
  totalExercises: number;
}

/**
 * Local progress view (system-design §6) assembled from stored session metadata.
 * Shows exercise coverage (a simple completion signal) and a per-exercise
 * breakdown, plus the recent-session log. The authoritative speed×comprehension
 * trajectory arrives with the exam path in Phase 3.
 */
export function ProgressView({ sessions, totalExercises }: Props) {
  const t = useT();
  if (sessions.length === 0) {
    return (
      <section className="card">
        <h2>{t("prog.heading")}</h2>
        <p className="muted">{t("prog.empty")}</p>
      </section>
    );
  }

  const groups = groupBy(sessions, (s) => s.exerciseId);
  const tried = Object.keys(groups).length;

  return (
    <section className="card">
      <h2>{t("prog.heading")}</h2>

      <p className="coverage muted">
        {t("prog.coverage", undefined, {
          tried,
          total: totalExercises,
          sessions: sessions.length,
        })}
      </p>

      <div className="exercise-progress">
        {Object.entries(groups).map(([id, rows]) => {
          const wpms = rows.map((r) => r.wpm);
          return (
            <div className="mini" key={id}>
              <h3>{t(`ex.${id}.title`, id)}</h3>
              <div className="stats">
                <Stat label={t("prog.runs")} value={String(rows.length)} />
                <Stat label={t("prog.best")} value={Math.round(Math.max(...wpms)).toString()} />
                <Stat
                  label={t("prog.latest")}
                  value={Math.round(rows[rows.length - 1].wpm).toString()}
                />
              </div>
              <Sparkline values={wpms} />
            </div>
          );
        })}
      </div>

      <table className="sessions">
        <thead>
          <tr>
            <th>{t("col.date")}</th>
            <th>{t("col.exercise")}</th>
            <th>{t("col.wpm")}</th>
            <th>{t("col.words")}</th>
            <th>{t("col.duration")}</th>
          </tr>
        </thead>
        <tbody>
          {[...sessions].reverse().map((s) => (
            <tr key={s.sessionId}>
              <td>{new Date(s.startedAt).toLocaleString()}</td>
              <td>{t(`ex.${s.exerciseId}.title`, s.exerciseId)}</td>
              <td>{Math.round(s.wpm)}</td>
              <td>{s.wordsProcessed.toLocaleString()}</td>
              <td>{formatDuration(s.durationSec)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const w = 200;
  const h = 40;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg className="sparkline" viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <polyline
        fill="none"
        stroke="var(--accent, #2563eb)"
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}

function groupBy<T>(items: T[], key: (t: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const item of items) {
    const k = key(item);
    (out[k] ??= []).push(item);
  }
  return out;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
