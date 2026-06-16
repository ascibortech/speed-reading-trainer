import { useEffect, useRef, useState } from "react";
import type { ExamRun } from "@srt/contracts/metadata";
import { addExamRun, getExamRuns } from "@srt/storage";
import {
  buildExamRun,
  daysSinceLastExam,
  EXAM_PASSAGES,
  isRetestDue,
  passageWordCount,
  RETEST_MIN_DAYS,
  type ExamPassage,
  type PassageResult,
} from "@srt/exam-path";
import { scoreAnswers, type AnsweredQuestion } from "@srt/comprehension";

interface Props {
  username: string;
}

type Mode = "idle" | "running" | "summary";

/**
 * The exam path (system-design §7) — a benchmark, not an exercise. The user reads
 * the same three curated passages each run (baseline, then re-tests) and answers
 * hand-authored questions; we record an immutable ExamRun and chart the
 * speed × comprehension trajectory over time.
 */
export function ExamPanel({ username }: Props) {
  const [runs, setRuns] = useState<ExamRun[]>([]);
  const [mode, setMode] = useState<Mode>("idle");
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<PassageResult[]>([]);
  const [lastRun, setLastRun] = useState<ExamRun | null>(null);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  async function refresh() {
    setRuns(await getExamRuns(username));
  }

  const hasBaseline = runs.some((r) => r.isBaseline);
  const willBeBaseline = !hasBaseline;
  const days = daysSinceLastExam(runs, new Date());
  const due = isRetestDue(runs, new Date());

  function start() {
    setResults([]);
    setIndex(0);
    setMode("running");
  }

  async function onPassageDone(result: PassageResult) {
    const next = [...results, result];
    if (index + 1 < EXAM_PASSAGES.length) {
      setResults(next);
      setIndex(index + 1);
      return;
    }
    const run = buildExamRun({
      examRunId: crypto.randomUUID(),
      username,
      isBaseline: willBeBaseline,
      date: new Date().toISOString(),
      results: next,
    });
    await addExamRun(run);
    setLastRun(run);
    await refresh();
    setMode("summary");
  }

  if (mode === "running") {
    return (
      <section className="card">
        <ExamProgressBar index={index} total={EXAM_PASSAGES.length} />
        <PassageStep
          key={index}
          passage={EXAM_PASSAGES[index]}
          n={index + 1}
          total={EXAM_PASSAGES.length}
          onDone={onPassageDone}
        />
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Exam path</h2>
      <p className="muted small">
        A fixed benchmark on curated passages — separate from training. Re-take it
        every {RETEST_MIN_DAYS}–42 days to chart real progress.
      </p>

      {mode === "summary" && lastRun && (
        <div className="result" style={{ padding: "0.75rem", marginBottom: "1rem" }}>
          <strong>{lastRun.isBaseline ? "Baseline" : "Re-test"} complete ✓</strong>
          <div className="stats">
            <Stat label="Mean WPM" value={Math.round(lastRun.meanWpm).toString()} />
            <Stat
              label="Comprehension"
              value={`${Math.round(lastRun.meanComprehensionPct)}%`}
            />
            <Stat label="Efficiency" value={efficiency(lastRun).toString()} />
          </div>
        </div>
      )}

      {!hasBaseline ? (
        <button className="primary big" onClick={start}>
          Start baseline exam ({EXAM_PASSAGES.length} passages)
        </button>
      ) : (
        <>
          <Trajectory runs={runs} />
          <p className="muted small">
            {days !== null && `Last exam ${days} day${days === 1 ? "" : "s"} ago. `}
            {due ? "A re-test is due." : "Re-test not due yet."}
          </p>
          <button className="primary big" onClick={start}>
            {due ? "Start re-test" : "Re-test anyway"}
          </button>
        </>
      )}
    </section>
  );
}

function PassageStep({
  passage,
  n,
  total,
  onDone,
}: {
  passage: ExamPassage;
  n: number;
  total: number;
  onDone: (r: PassageResult) => void;
}) {
  const [phase, setPhase] = useState<"read" | "quiz">("read");
  const [wpm, setWpm] = useState(0);
  const [selections, setSelections] = useState<number[]>(
    passage.questions.map(() => -1),
  );
  const startRef = useRef(0);

  useEffect(() => {
    startRef.current = performance.now();
  }, []);

  function finishReading() {
    const min = (performance.now() - startRef.current) / 60000;
    const words = passageWordCount(passage);
    setWpm(min > 0 ? Math.round((words / min) * 100) / 100 : 0);
    setPhase("quiz");
  }

  function submit() {
    const answered: AnsweredQuestion[] = passage.questions.map((q, i) => ({
      question: q,
      selectedIndex: selections[i],
    }));
    onDone({ passage, wpm, comprehensionPct: scoreAnswers(answered).pct });
  }

  if (phase === "read") {
    return (
      <div className="srt-comp">
        <h3>
          Passage {n} of {total}: {passage.title}
        </h3>
        <p className="muted small">Read at a natural pace, then continue.</p>
        <div className="srt-comp-pane">{passage.text}</div>
        <button className="primary" onClick={finishReading}>
          I've finished reading
        </button>
      </div>
    );
  }

  const allAnswered = selections.every((s) => s >= 0);
  return (
    <div className="srt-comp-quiz">
      <h3>
        Questions — passage {n} of {total}
      </h3>
      {passage.questions.map((q, qi) => (
        <div className="srt-comp-q" key={q.id}>
          <p className="srt-comp-prompt">
            {qi + 1}. {q.prompt}
          </p>
          <div className="srt-comp-options">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                className={`srt-comp-option${selections[qi] === oi ? " chosen" : ""}`}
                onClick={() =>
                  setSelections((s) => s.map((v, i) => (i === qi ? oi : v)))
                }
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button className="primary submit" disabled={!allAnswered} onClick={submit}>
        {n < total ? "Next passage" : "Finish exam"}
      </button>
    </div>
  );
}

function Trajectory({ runs }: { runs: ExamRun[] }) {
  const ordered = [...runs].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <table className="sessions">
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>WPM</th>
          <th>Comp.</th>
          <th>Efficiency</th>
        </tr>
      </thead>
      <tbody>
        {ordered.map((r) => (
          <tr key={r.examRunId}>
            <td>{new Date(r.date).toLocaleDateString()}</td>
            <td>{r.isBaseline ? "Baseline" : "Re-test"}</td>
            <td>{Math.round(r.meanWpm)}</td>
            <td>{Math.round(r.meanComprehensionPct)}%</td>
            <td>{efficiency(r)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ExamProgressBar({ index, total }: { index: number; total: number }) {
  return (
    <p className="muted small">
      Passage {index + 1} of {total}
    </p>
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

/** Reading efficiency = WPM × comprehension (effective WPM, kickoff §5). */
function efficiency(r: ExamRun): number {
  return Math.round(r.meanWpm * (r.meanComprehensionPct / 100));
}
