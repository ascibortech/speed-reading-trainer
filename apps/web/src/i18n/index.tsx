import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { dictionaries, LANGS, type Lang } from "./dictionaries.js";

export type { Lang } from "./dictionaries.js";

/** Translate: key → string, with optional English/inline fallback and `{var}`s. */
export type Translate = (
  key: string,
  fallback?: string,
  vars?: Record<string, string | number>,
) => string;

const STORAGE_KEY = "srt.lang";

function detectInitialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "pl") return saved;
  } catch {
    /* localStorage unavailable */
  }
  return typeof navigator !== "undefined" && navigator.language?.startsWith("pl")
    ? "pl"
    : "en";
}

function interpolate(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function translate(
  lang: Lang,
  key: string,
  fallback?: string,
  vars?: Record<string, string | number>,
): string {
  const value =
    dictionaries[lang][key] ??
    dictionaries.en[key] ??
    fallback ??
    key;
  return interpolate(value, vars);
}

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translate;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitialLang);

  // Keep <html lang> in sync (initial load + every change) for a11y / correctness.
  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback<Translate>(
    (key, fallback, vars) => translate(lang, key, fallback, vars),
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useI18n(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
}

/** Convenience hook returning just the translate function. */
export function useT(): Translate {
  return useI18n().t;
}

/** Header flag switcher — persists the choice via setLang. */
export function LanguageFlags() {
  const { lang, setLang } = useI18n();
  return (
    <div className="lang-flags" role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button
          key={l.code}
          className={`flag${lang === l.code ? " active" : ""}`}
          title={l.label}
          aria-pressed={lang === l.code}
          onClick={() => setLang(l.code)}
        >
          {l.flag}
        </button>
      ))}
    </div>
  );
}
