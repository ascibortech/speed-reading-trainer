import type { SessionMetadata } from "@srt/contracts/metadata";

interface Props {
  sessions: SessionMetadata[];
}

/** Local progress view assembled from stored session metadata (system-design §6). */
export function ProgressView({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <section className="card">
        <h2>Progress</h2>
        <p className="muted">No sessions yet. Run an exercise to start tracking.</p>
      </section>
    );
  }

  const best = Math.max(...sessions.map((s) => s.wpm));
  const latest = sessions[sessions.length - 1];
  const avg =
    sessions.reduce((sum, s) => sum + s.wpm, 0) / sessions.length;

  return (
    <section className="card">
      <h2>Progress</h2>
      <div className="stats">
        <Stat label="Sessions" value={String(sessions.length)} />
        <Stat label="Latest WPM" value={Math.round(latest.wpm).toString()} />
        <Stat label="Best WPM" value={Math.round(best).toString()} />
        <Stat label="Avg WPM" value={Math.round(avg).toString()} />
      </div>

      <Sparkline values={sessions.map((s) => s.wpm)} />

      <table className="sessions">
        <thead>
          <tr>
            <th>Date</th>
            <th>Exercise</th>
            <th>WPM</th>
            <th>Words</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          {[...sessions].reverse().map((s) => (
            <tr key={s.sessionId}>
              <td>{new Date(s.startedAt).toLocaleString()}</td>
              <td>{s.exerciseId}</td>
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
  const w = 280;
  const h = 56;
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

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
