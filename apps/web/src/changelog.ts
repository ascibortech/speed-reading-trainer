/**
 * App version + changelog. The version is shown in the footer and opens an
 * in-app changelog (bilingual). Bump APP_VERSION and prepend an entry on each
 * user-facing release. Newest first.
 */
export const APP_VERSION = "0.5.0";

export interface ChangelogEntry {
  version: string;
  date: string; // ISO yyyy-mm-dd
  en: string[];
  pl: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.5.0",
    date: "2026-06-16",
    en: [
      "New Memorization exercise: free recall, fill-the-blanks, and reorder modes.",
      "Review tab: memorize a passage and re-test it at expanding intervals.",
      "Recall decay is charted over time for each saved passage.",
    ],
    pl: [
      "Nowe ćwiczenie Zapamiętywanie: swobodne odtwarzanie, uzupełnianie luk i układanie.",
      "Zakładka Powtórki: zapamiętaj fragment i powtarzaj go w rosnących odstępach.",
      "Zanik pamięci jest pokazywany na wykresie w czasie dla każdego fragmentu.",
    ],
  },
  {
    version: "0.4.0",
    date: "2026-06-16",
    en: [
      "English and Polish interface, switchable with the header flags.",
      "Your language choice is remembered on this device.",
      "Added in-app versioning and this changelog.",
    ],
    pl: [
      "Interfejs po angielsku i polsku, przełączany flagami w nagłówku.",
      "Wybór języka jest zapamiętywany na tym urządzeniu.",
      "Dodano wersjonowanie aplikacji i ten changelog.",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-06-16",
    en: [
      "New exercises: Comprehension, Chunking, and Subvocalization.",
      "Exam path: baseline + re-test on curated passages with a progress trajectory.",
      "Automatic, on-device comprehension questions for your own text.",
    ],
    pl: [
      "Nowe ćwiczenia: Rozumienie, Grupowanie i Subwokalizacja.",
      "Ścieżka egzaminacyjna: test bazowy i ponowny na wyselekcjonowanych fragmentach z wykresem postępów.",
      "Automatyczne pytania na rozumienie (lokalnie) dla Twojego tekstu.",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-06-15",
    en: [
      "New exercises: RSVP and the Schulte table.",
      "PDF files are now supported in addition to plain text.",
      "Progress view with a per-exercise breakdown.",
    ],
    pl: [
      "Nowe ćwiczenia: RSVP i tablica Schultego.",
      "Obsługa plików PDF obok zwykłego tekstu.",
      "Widok postępów z podziałem na ćwiczenia.",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-06-15",
    en: [
      "First release: the Pointer / Pacer exercise.",
      "Upload .txt, train, and track your reading speed — entirely in your browser.",
      "Local profiles with progress export / import.",
    ],
    pl: [
      "Pierwsze wydanie: ćwiczenie Wskaźnik / Pacer.",
      "Wgraj .txt, trenuj i śledź szybkość czytania — w całości w przeglądarce.",
      "Lokalne profile z eksportem / importem postępów.",
    ],
  },
];
