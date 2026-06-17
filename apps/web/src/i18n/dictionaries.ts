/**
 * Bilingual UI strings (English / Polish). The active language is chosen with the
 * header flags and persisted to localStorage. Lookup falls back: active-lang →
 * English → caller-supplied fallback → key. `{var}` placeholders are interpolated.
 *
 * App-shell keys are defined in both languages. Exercise-internal strings (rendered
 * imperatively inside exercise packages) pass an English fallback inline, so only
 * their Polish entries live here.
 */
export type Lang = "en" | "pl";

export const LANGS: { code: Lang; flag: string; label: string }[] = [
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "pl", flag: "🇵🇱", label: "Polski" },
];

type Dict = Record<string, string>;

const en: Dict = {
  // nav / header / footer
  "nav.train": "Train",
  "nav.exam": "Exam",
  "nav.review": "Review",
  "nav.progress": "Progress",
  "header.export": "⭳ Export my progress",
  "header.import": "⭱ Import",
  "header.switch": "switch",
  "footer.privacy":
    "Your text and progress stay on this device. Export to back up or move to another browser.",
  "common.words": "words",

  // profile gate
  "gate.intro":
    "Train on your own text — parsed and used entirely in your browser. Nothing you upload ever leaves this device.",
  "gate.choose": "Choose a profile",
  "gate.passLocked": "Passphrase (for locked profiles)",
  "gate.new": "+ New profile",
  "gate.newTitle": "New profile",
  "gate.username": "Username (not an email)",
  "gate.passphrase": "Passphrase",
  "gate.passHint": "(optional — a soft local lock, not security)",
  "gate.create": "Create",
  "gate.back": "Back",
  "gate.errExists": 'Profile "{name}" already exists.',
  "gate.errCreate": "Could not create profile.",
  "gate.errPass": "Incorrect passphrase.",

  // uploader
  "up.heading": "1 · Your text",
  "up.privacy": "Held in memory for this session only — never uploaded, never stored.",
  "up.choose": "Choose a .txt or .pdf file",
  "up.reading": "Reading…",
  "up.replace": "Replace",
  "up.errUnsupported": 'Format ".{ext}" is not supported yet. Supported now: .txt and .pdf.',
  "up.errEmpty": "The file contains no readable text.",
  "up.errRead": "Could not read this file.",

  // catalogue
  "cat.heading": "2 · Choose an exercise",
  "cat.needsText": "needs text",
  "cat.loadFirst": "Load text first",
  "pillar.eye-movement": "Eye movement",
  "pillar.visual-span": "Visual span",
  "pillar.subvocalization": "Subvocalization",
  "pillar.comprehension": "Comprehension",
  "pillar.retention": "Retention",
  "stage.beginner": "beginner",
  "stage.intermediate": "intermediate",
  "stage.advanced": "advanced",

  // settings / result
  "settings.heading": "3 · Settings",
  "settings.start": "Start",
  "settings.loadFirst": "Load a text file first.",
  "result.saved": "Session saved ✓",
  "result.wpm": "WPM",
  "result.words": "words",
  "result.duration": "duration",

  // runner
  "runner.pause": "Pause",
  "runner.resume": "Resume",
  "runner.stop": "Stop & save",
  "runner.discard": "Discard",

  // progress
  "prog.heading": "Progress",
  "prog.empty": "No sessions yet. Run an exercise to start tracking.",
  "prog.coverage": "Explored {tried} of {total} exercises · {sessions} sessions total",
  "prog.runs": "Runs",
  "prog.best": "Best",
  "prog.latest": "Latest",
  "col.date": "Date",
  "col.exercise": "Exercise",
  "col.wpm": "WPM",
  "col.words": "Words",
  "col.duration": "Duration",
  "col.type": "Type",
  "col.comp": "Comp.",
  "col.efficiency": "Efficiency",

  // exam
  "exam.heading": "Exam path",
  "exam.intro":
    "A fixed benchmark on curated passages — separate from training. Re-take it every {min}–42 days to chart real progress.",
  "exam.baselineDone": "Baseline complete ✓",
  "exam.retestDone": "Re-test complete ✓",
  "exam.meanWpm": "Mean WPM",
  "exam.comprehension": "Comprehension",
  "exam.efficiency": "Efficiency",
  "exam.startBaseline": "Start baseline exam ({n} passages)",
  "exam.lastExam": "Last exam {days} day(s) ago.",
  "exam.due": "A re-test is due.",
  "exam.notDue": "Re-test not due yet.",
  "exam.startRetest": "Start re-test",
  "exam.retestAnyway": "Re-test anyway",
  "exam.passageOf": "Passage {n} of {total}",
  "exam.passageHead": "Passage {n} of {total}: {title}",
  "exam.readNatural": "Read at a natural pace, then continue.",
  "exam.finishedReading": "I've finished reading",
  "exam.questionsHead": "Questions — passage {n} of {total}",
  "exam.next": "Next passage",
  "exam.finish": "Finish exam",
  "exam.baseline": "Baseline",
  "exam.retest": "Re-test",

  // import/export messages
  "ie.exported": "Progress exported.",
  "ie.imported": "Progress imported.",
  "ie.errImport": "Could not import that file.",

  // changelog
  "changelog.title": "What's new",
  "changelog.close": "Close",
  "changelog.link": "v{version} · changelog",

  // exercise titles / descriptions (keyed by id)
  "ex.pointer.title": "Pointer / Pacer",
  "ex.pointer.desc":
    "A pacer sweeps each line at a steady pace to curb regression and enforce rhythm.",
  "ex.rsvp.title": "RSVP",
  "ex.rsvp.desc":
    "Words flash at a fixed point so the eyes never move — pushes raw recognition speed.",
  "ex.schulte.title": "Schulte Table",
  "ex.schulte.desc":
    "Fixate the centre and find numbers in order using peripheral vision — widens your visual span.",
  "ex.chunking.title": "Chunking",
  "ex.chunking.desc":
    "Highlights word-groups one at a time so you read in chunks, not single words.",
  "ex.comprehension.title": "Comprehension",
  "ex.comprehension.desc":
    "Read a passage, then answer auto-generated questions — measures retention, not just speed.",
  "ex.subvocalization.title": "Subvocalization",
  "ex.subvocalization.desc":
    "Read once normally, then again while occupying your inner voice — measures the speed gain.",
  "ex.memorization.title": "Memorization",
  "ex.memorization.desc":
    "Study a passage, then reconstruct it from memory — trains retention, the fifth pillar.",

  // param labels / units / options
  "param.linesPerSec": "Pace",
  "param.marginWords": "Edge margin",
  "param.wpm": "Speed",
  "param.chunkSize": "Words per chunk",
  "param.chunksPerSec": "Pace",
  "param.gridSize": "Grid size",
  "param.questionCount": "Questions",
  "param.technique": "Technique",
  "unit.linesPerSec": "lines/sec",
  "unit.marginWords": "words",
  "unit.wpm": "WPM",
  "unit.chunksPerSec": "chunks/sec",
  "opt.technique.count": "Silent counting (1-2-3-4)",
  "opt.technique.hum": "Humming",
  "opt.technique.tap": "Rhythmic tapping",
  "param.mode": "Recall mode",
  "opt.mode.free": "Free recall",
  "opt.mode.cued": "Cued (fill the blanks)",
  "opt.mode.sequence": "Reorder sentences",
  "opt.technique.none": "None",
  "opt.technique.chunk": "Chunk & associate",
  "opt.technique.loci": "Method of loci",
  "opt.technique.keyword": "Keyword imaging",
};

const pl: Dict = {
  "nav.train": "Trenuj",
  "nav.exam": "Egzamin",
  "nav.review": "Powtórki",
  "nav.progress": "Postępy",
  "header.export": "⭳ Eksportuj postępy",
  "header.import": "⭱ Importuj",
  "header.switch": "zmień",
  "footer.privacy":
    "Twój tekst i postępy zostają na tym urządzeniu. Eksportuj, aby zrobić kopię lub przenieść do innej przeglądarki.",
  "common.words": "słów",

  "gate.intro":
    "Trenuj na własnym tekście — przetwarzanym i używanym wyłącznie w Twojej przeglądarce. Nic, co wgrasz, nie opuszcza tego urządzenia.",
  "gate.choose": "Wybierz profil",
  "gate.passLocked": "Hasło (dla zablokowanych profili)",
  "gate.new": "+ Nowy profil",
  "gate.newTitle": "Nowy profil",
  "gate.username": "Nazwa użytkownika (nie e-mail)",
  "gate.passphrase": "Hasło",
  "gate.passHint": "(opcjonalne — miękka blokada lokalna, nie zabezpieczenie)",
  "gate.create": "Utwórz",
  "gate.back": "Wstecz",
  "gate.errExists": 'Profil „{name}” już istnieje.',
  "gate.errCreate": "Nie udało się utworzyć profilu.",
  "gate.errPass": "Nieprawidłowe hasło.",

  "up.heading": "1 · Twój tekst",
  "up.privacy":
    "Przechowywany w pamięci tylko na czas tej sesji — nigdy nie wysyłany, nigdy nie zapisywany.",
  "up.choose": "Wybierz plik .txt lub .pdf",
  "up.reading": "Wczytywanie…",
  "up.replace": "Zmień",
  "up.errUnsupported":
    'Format „.{ext}” nie jest jeszcze obsługiwany. Obecnie obsługiwane: .txt i .pdf.',
  "up.errEmpty": "Plik nie zawiera czytelnego tekstu.",
  "up.errRead": "Nie udało się odczytać tego pliku.",

  "cat.heading": "2 · Wybierz ćwiczenie",
  "cat.needsText": "wymaga tekstu",
  "cat.loadFirst": "Najpierw wczytaj tekst",
  "pillar.eye-movement": "Ruch oczu",
  "pillar.visual-span": "Zakres widzenia",
  "pillar.subvocalization": "Subwokalizacja",
  "pillar.comprehension": "Rozumienie",
  "pillar.retention": "Zapamiętywanie",
  "stage.beginner": "początkujący",
  "stage.intermediate": "średnio zaawansowany",
  "stage.advanced": "zaawansowany",

  "settings.heading": "3 · Ustawienia",
  "settings.start": "Rozpocznij",
  "settings.loadFirst": "Najpierw wczytaj plik tekstowy.",
  "result.saved": "Zapisano sesję ✓",
  "result.wpm": "sł/min",
  "result.words": "słów",
  "result.duration": "czas",

  "runner.pause": "Pauza",
  "runner.resume": "Wznów",
  "runner.stop": "Zatrzymaj i zapisz",
  "runner.discard": "Odrzuć",

  "prog.heading": "Postępy",
  "prog.empty": "Brak sesji. Wykonaj ćwiczenie, aby zacząć śledzić postępy.",
  "prog.coverage": "Wypróbowano {tried} z {total} ćwiczeń · łącznie {sessions} sesji",
  "prog.runs": "Próby",
  "prog.best": "Najlepszy",
  "prog.latest": "Ostatni",
  "col.date": "Data",
  "col.exercise": "Ćwiczenie",
  "col.wpm": "sł/min",
  "col.words": "Słowa",
  "col.duration": "Czas",
  "col.type": "Typ",
  "col.comp": "Rozum.",
  "col.efficiency": "Efektywność",

  "exam.heading": "Ścieżka egzaminacyjna",
  "exam.intro":
    "Stały sprawdzian na wyselekcjonowanych fragmentach — niezależny od treningu. Powtarzaj co {min}–42 dni, aby śledzić realne postępy.",
  "exam.baselineDone": "Test bazowy ukończony ✓",
  "exam.retestDone": "Ponowny test ukończony ✓",
  "exam.meanWpm": "Śr. sł/min",
  "exam.comprehension": "Rozumienie",
  "exam.efficiency": "Efektywność",
  "exam.startBaseline": "Rozpocznij test bazowy ({n} fragmenty)",
  "exam.lastExam": "Ostatni egzamin {days} dni temu.",
  "exam.due": "Należy wykonać ponowny test.",
  "exam.notDue": "Ponowny test jeszcze nie jest wymagany.",
  "exam.startRetest": "Rozpocznij ponowny test",
  "exam.retestAnyway": "Testuj mimo to",
  "exam.passageOf": "Fragment {n} z {total}",
  "exam.passageHead": "Fragment {n} z {total}: {title}",
  "exam.readNatural": "Czytaj w naturalnym tempie, potem przejdź dalej.",
  "exam.finishedReading": "Skończyłem czytać",
  "exam.questionsHead": "Pytania — fragment {n} z {total}",
  "exam.next": "Następny fragment",
  "exam.finish": "Zakończ egzamin",
  "exam.baseline": "Bazowy",
  "exam.retest": "Ponowny",

  "ie.exported": "Postępy wyeksportowane.",
  "ie.imported": "Postępy zaimportowane.",
  "ie.errImport": "Nie udało się zaimportować tego pliku.",

  "changelog.title": "Co nowego",
  "changelog.close": "Zamknij",
  "changelog.link": "v{version} · zmiany",

  "ex.pointer.title": "Wskaźnik / Pacer",
  "ex.pointer.desc":
    "Wskaźnik przesuwa się po każdej linii w stałym tempie — ogranicza regresję i wymusza rytm.",
  "ex.rsvp.title": "RSVP",
  "ex.rsvp.desc":
    "Słowa migają w jednym punkcie, więc oczy się nie poruszają — podnosi surową szybkość rozpoznawania.",
  "ex.schulte.title": "Tablica Schultego",
  "ex.schulte.desc":
    "Patrz w środek i znajduj liczby po kolei wzrokiem peryferyjnym — poszerza zakres widzenia.",
  "ex.chunking.title": "Grupowanie",
  "ex.chunking.desc":
    "Podświetla grupy słów po kolei, byś czytał porcjami, a nie pojedynczymi słowami.",
  "ex.comprehension.title": "Rozumienie",
  "ex.comprehension.desc":
    "Przeczytaj fragment, potem odpowiedz na wygenerowane pytania — mierzy zapamiętywanie, nie tylko szybkość.",
  "ex.subvocalization.title": "Subwokalizacja",
  "ex.subvocalization.desc":
    "Przeczytaj raz normalnie, a potem zajmując wewnętrzny głos — mierzy przyrost szybkości.",
  "ex.memorization.title": "Zapamiętywanie",
  "ex.memorization.desc":
    "Przeczytaj fragment, a potem odtwórz go z pamięci — trenuje retencję, piąty filar.",
  "param.mode": "Tryb odtwarzania",
  "opt.mode.free": "Swobodne odtwarzanie",
  "opt.mode.cued": "Z podpowiedzią (uzupełnij luki)",
  "opt.mode.sequence": "Ułóż zdania",
  "opt.technique.none": "Brak",
  "opt.technique.chunk": "Grupuj i kojarz",
  "opt.technique.loci": "Metoda miejsc (loci)",
  "opt.technique.keyword": "Obrazy słów kluczy",

  // review (spaced repetition)
  "rev.heading": "Zapamiętuj i powtarzaj",
  "rev.intro":
    "Zapamiętaj fragment, a potem powtarzaj go w rosnących odstępach, by sprawdzić, co zostaje.",
  "rev.empty": "Brak pozycji do powtórek.",
  "rev.add": "Nowa pozycja do powtórki",
  "rev.newTitle": "Nowa pozycja do powtórki",
  "rev.reviewTitle": "Powtórka: {label}",
  "rev.label": "Nazwij ten fragment",
  "rev.start": "Zacznij zapamiętywanie",
  "rev.back": "Wstecz",
  "rev.due": "Do powtórki teraz",
  "rev.dueIn": "Za {days} dni",
  "rev.lastRecall": "ostatnio {pct}%",
  "rev.reviews": "{n} powtórek",
  "rev.reviewNow": "Powtórz",

  // memorization exercise (rendered inside the package)
  "mem.study": "Przeczytaj ten fragment",
  "mem.done": "Ukryj i odtwórz",
  "mem.freePrompt": "Wpisz wszystko, co pamiętasz",
  "mem.cuedPrompt": "Uzupełnij luki z pamięci",
  "mem.seqPrompt": "Klikaj zdania w ich pierwotnej kolejności",
  "mem.score": "Oceń odtworzenie",
  "mem.result": "Odtworzenie: {pct}%",
  "mem.finish": "Zakończ i zapisz",
  "mem.hint.chunk": "Pogrupuj myśli w kilka części i połącz je podczas czytania.",
  "mem.hint.loci": "Umieść każdą myśl w punkcie znanej trasy (metoda miejsc).",
  "mem.hint.keyword": "Zamieniaj kluczowe myśli w wyraziste obrazy podczas czytania.",

  "param.linesPerSec": "Tempo",
  "param.marginWords": "Margines krawędzi",
  "param.wpm": "Szybkość",
  "param.chunkSize": "Słów w grupie",
  "param.chunksPerSec": "Tempo",
  "param.gridSize": "Rozmiar siatki",
  "param.questionCount": "Pytania",
  "param.technique": "Technika",
  "unit.linesPerSec": "linii/s",
  "unit.marginWords": "słów",
  "unit.wpm": "sł/min",
  "unit.chunksPerSec": "grup/s",
  "opt.technique.count": "Ciche liczenie (1-2-3-4)",
  "opt.technique.hum": "Nucenie",
  "opt.technique.tap": "Rytmiczne stukanie",

  // exercise-internal (English provided as inline fallback in packages)
  "schulte.find": "Szukaj: {n}",
  "schulte.done": "Gotowe ✓",
  "comp.finishedReading": "Skończyłem czytać",
  "comp.questions": "Pytania",
  "comp.submit": "Zatwierdź odpowiedzi",
  "subvoc.baselineTitle": "Czytaj normalnie — bez techniki",
  "subvoc.techniqueTitle": "Teraz czytaj ze swoją techniką",
  "subvoc.hint.count": "Podczas czytania licz w myślach „1-2-3-4” w pętli.",
  "subvoc.hint.hum": "Podczas czytania nuć równy dźwięk pod nosem.",
  "subvoc.hint.tap": "Podczas czytania wystukuj równy rytm palcem.",
  "subvoc.done": "Przeczytane",
  "subvoc.report": "Jak poszło?",
  "subvoc.summary":
    "Baza {b} sł/min → z techniką {t} sł/min ({d}).",
  "subvoc.difficulty": "Trudność (1–10)",
  "subvoc.maintained": " Utrzymałem rozumienie",
  "subvoc.finish": "Zakończ i zapisz",
};

export const dictionaries: Record<Lang, Dict> = { en, pl };
