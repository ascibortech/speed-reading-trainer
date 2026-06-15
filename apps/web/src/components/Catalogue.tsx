import type { ExerciseDescriptor } from "@srt/contracts";

interface Props {
  exercises: ExerciseDescriptor[];
  selectedId: string | null;
  textLoaded: boolean;
  onSelect: (id: string) => void;
}

const PILLAR_LABEL: Record<string, string> = {
  "eye-movement": "Eye movement",
  "visual-span": "Visual span",
  subvocalization: "Subvocalization",
  comprehension: "Comprehension",
  retention: "Retention",
};

/** Catalogue built entirely from the registry descriptors (system-design §3.2). */
export function Catalogue({ exercises, selectedId, textLoaded, onSelect }: Props) {
  return (
    <section className="card">
      <h2>2 · Choose an exercise</h2>
      <ul className="catalogue">
        {exercises.map((ex) => {
          const blocked = ex.needsText && !textLoaded;
          return (
            <li key={ex.id}>
              <button
                className={`exercise-card${selectedId === ex.id ? " selected" : ""}`}
                disabled={blocked}
                onClick={() => onSelect(ex.id)}
                title={blocked ? "Load text first" : undefined}
              >
                <div className="exercise-head">
                  <strong>{ex.title}</strong>
                  <span className={`badge stage-${ex.stage}`}>{ex.stage}</span>
                </div>
                <p className="muted small">{ex.description}</p>
                <span className="pillar">{PILLAR_LABEL[ex.pillar] ?? ex.pillar}</span>
                {blocked && <span className="hint">needs text</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
