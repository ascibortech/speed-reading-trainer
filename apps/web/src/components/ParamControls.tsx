import type { Params, ParamSchema } from "@srt/contracts";
import { useT } from "../i18n/index.js";

interface Props {
  schema: ParamSchema;
  params: Params;
  onChange: (params: Params) => void;
}

/** Renders an exercise's declared param schema (system-design §5). */
export function ParamControls({ schema, params, onChange }: Props) {
  const t = useT();
  function set(key: string, value: number | string | boolean) {
    onChange({ ...params, [key]: value });
  }

  return (
    <div className="params">
      {schema.map((f) => (
        <label key={f.key} className="field">
          <span>
            {t(`param.${f.key}`, f.label)}
            {f.unit && <span className="muted"> ({t(`unit.${f.key}`, f.unit)})</span>}
          </span>

          {f.type === "number" && (
            <span className="range-row">
              <input
                type="range"
                min={f.min}
                max={f.max}
                step={f.step}
                value={Number(params[f.key])}
                onChange={(e) => set(f.key, Number(e.target.value))}
              />
              <output>{Number(params[f.key])}</output>
            </span>
          )}

          {f.type === "enum" && (
            <select
              value={String(params[f.key])}
              onChange={(e) => set(f.key, e.target.value)}
            >
              {f.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {t(`opt.${f.key}.${o.value}`, o.label)}
                </option>
              ))}
            </select>
          )}

          {f.type === "boolean" && (
            <input
              type="checkbox"
              checked={Boolean(params[f.key])}
              onChange={(e) => set(f.key, e.target.checked)}
            />
          )}
        </label>
      ))}
    </div>
  );
}
