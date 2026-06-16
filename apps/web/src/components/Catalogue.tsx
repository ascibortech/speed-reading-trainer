import type { ExerciseDescriptor } from "@srt/contracts";
import { useT } from "../i18n/index.js";

interface Props {
  exercises: ExerciseDescriptor[];
  selectedId: string | null;
  textLoaded: boolean;
  onSelect: (id: string) => void;
}

/** Catalogue built entirely from the registry descriptors (system-design §3.2). */
export function Catalogue({ exercises, selectedId, textLoaded, onSelect }: Props) {
  const t = useT();
  return (
    <section className="card">
      <h2>{t("cat.heading")}</h2>
      <ul className="catalogue">
        {exercises.map((ex) => {
          const blocked = ex.needsText && !textLoaded;
          return (
            <li key={ex.id}>
              <button
                className={`exercise-card${selectedId === ex.id ? " selected" : ""}`}
                disabled={blocked}
                onClick={() => onSelect(ex.id)}
                title={blocked ? t("cat.loadFirst") : undefined}
              >
                <div className="exercise-head">
                  <strong>{t(`ex.${ex.id}.title`, ex.title)}</strong>
                  <span className={`badge stage-${ex.stage}`}>
                    {t(`stage.${ex.stage}`, ex.stage)}
                  </span>
                </div>
                <p className="muted small">
                  {t(`ex.${ex.id}.desc`, ex.description)}
                </p>
                <span className="pillar">{t(`pillar.${ex.pillar}`, ex.pillar)}</span>
                {blocked && <span className="hint">{t("cat.needsText")}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
