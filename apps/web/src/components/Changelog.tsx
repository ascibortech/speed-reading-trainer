import { useI18n } from "../i18n/index.js";
import { CHANGELOG } from "../changelog.js";

interface Props {
  onClose: () => void;
}

/** Bilingual in-app changelog modal (opened from the footer version link). */
export function Changelog({ onClose }: Props) {
  const { lang, t } = useI18n();
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>{t("changelog.title")}</h2>
          <button className="link" onClick={onClose}>
            {t("changelog.close")}
          </button>
        </div>
        <div className="changelog">
          {CHANGELOG.map((entry) => (
            <div className="changelog-entry" key={entry.version}>
              <div className="changelog-ver">
                <strong>v{entry.version}</strong>
                <span className="muted small">{entry.date}</span>
              </div>
              <ul>
                {(lang === "pl" ? entry.pl : entry.en).map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
