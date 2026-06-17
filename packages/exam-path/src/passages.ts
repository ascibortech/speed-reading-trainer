/**
 * Curated exam passages (system-design §7). These are APP-AUTHORED (original,
 * ours) — the one place the app ships its own text, so there is no IP concern.
 * They are of controlled, roughly equal difficulty so re-tests are apples-to-
 * apples. Questions are hand-authored across the three diagnostic types
 * (factual MC, cloze, inference — kickoff §6.6).
 *
 * Each passage is provided in every supported UI language so the exam reads in
 * the language the user picked (EN / PL). `getExamPassages(lang)` returns the set
 * for a language, falling back to English.
 *
 * NB: kept to ~130 words each for a usable demo; the kickoff's ~1000-word
 * baseline can be slotted in later without any code change.
 */
import type { PassageDifficulty } from "@srt/contracts/metadata";
import type { Question } from "@srt/comprehension";

export type PassageLang = "en" | "pl";

export interface ExamPassage {
  id: string;
  title: string;
  text: string;
  difficulty: PassageDifficulty;
  questions: Question[];
}

const COMMON_DIFFICULTY: PassageDifficulty = {
  approxWordCount: 130,
  lexicalComplexity: 5,
  meanSentenceLength: 18,
  conceptualAbstraction: 4,
};

const EN: ExamPassage[] = [
  {
    id: "bees",
    title: "How Bees Navigate",
    text: "Honeybees travel surprising distances to gather nectar, sometimes ranging several kilometres from the hive. To find their way home they rely on the position of the sun, which they track even on cloudy days by reading patterns of polarised light in the sky. When a forager discovers a rich source of food, it returns and performs a waggle dance on the comb. The angle of the dance relative to vertical encodes the direction of the food relative to the sun, while the duration of the waggle signals the distance. Other bees follow the dancer closely, then set out in the indicated direction. This remarkable form of communication lets a colony share precise navigational information without any sound, allowing thousands of workers to exploit the same flowering meadow efficiently.",
    difficulty: COMMON_DIFFICULTY,
    questions: [
      {
        id: "bees-q1",
        type: "mc",
        prompt: "How do bees track the sun on cloudy days?",
        options: [
          "By reading polarised light in the sky",
          "By following landmarks on the ground",
          "By listening for other bees",
          "By sensing changes in temperature",
        ],
        answerIndex: 0,
      },
      {
        id: "bees-q2",
        type: "mc",
        prompt: "What does the duration of the waggle signal?",
        options: [
          "The distance to the food",
          "The type of flower",
          "The number of bees needed",
          "The time of day",
        ],
        answerIndex: 0,
      },
      {
        id: "bees-q3",
        type: "cloze",
        prompt:
          "The angle of the dance relative to vertical encodes the _____ of the food relative to the sun.",
        options: ["direction", "colour", "weight", "freshness"],
        answerIndex: 0,
      },
      {
        id: "bees-q4",
        type: "inference",
        prompt: "What can we infer about the bees' communication?",
        options: [
          "It conveys precise information without sound",
          "It only works at night",
          "It requires the queen's approval",
          "It is unreliable over long distances",
        ],
        answerIndex: 0,
      },
    ],
  },
  {
    id: "lighthouse",
    title: "The Work of Lighthouses",
    text: "For centuries lighthouses have guarded dangerous coastlines, warning ships away from rocks and guiding them safely into harbour. Early towers burned coal or wood in open fires, but these were dim and unreliable in bad weather. The breakthrough came with the Fresnel lens, a tiered ring of glass prisms that gathers scattered light and bends it into a single concentrated beam. With it, even a modest lamp could be seen far out at sea. Each lighthouse flashes a distinct pattern, called its character, so that a navigator can identify exactly which light is in view and fix the ship's position. Today most lighthouses are automated and powered by electricity, yet their fundamental purpose endures: to turn a fixed point of light into a dependable message about where danger lies.",
    difficulty: COMMON_DIFFICULTY,
    questions: [
      {
        id: "lighthouse-q1",
        type: "mc",
        prompt: "What problem did early coal or wood fires have?",
        options: [
          "They were dim and unreliable in bad weather",
          "They were too expensive to build",
          "They attracted too many ships",
          "They were illegal in most ports",
        ],
        answerIndex: 0,
      },
      {
        id: "lighthouse-q2",
        type: "cloze",
        prompt:
          "The Fresnel lens bends scattered light into a single concentrated _____.",
        options: ["beam", "shadow", "colour", "sound"],
        answerIndex: 0,
      },
      {
        id: "lighthouse-q3",
        type: "mc",
        prompt: "Why does each lighthouse flash a distinct pattern?",
        options: [
          "So navigators can identify which light it is",
          "To save electricity",
          "To celebrate local festivals",
          "To frighten away seabirds",
        ],
        answerIndex: 0,
      },
      {
        id: "lighthouse-q4",
        type: "inference",
        prompt: "What is the passage's main point about lighthouses?",
        options: [
          "Their purpose endures even as technology changes",
          "They are no longer used anywhere",
          "They were a failed experiment",
          "They work only in calm seas",
        ],
        answerIndex: 0,
      },
    ],
  },
  {
    id: "glaciers",
    title: "Rivers of Ice",
    text: "A glacier is often described as a river of ice, and the comparison is apt. Snow that falls high in the mountains does not melt completely in summer; year after year it piles up, and its own weight presses the lower layers into dense ice. Once the ice grows thick enough, gravity sets it moving slowly downhill, sometimes only a few centimetres a day. As it creeps along, the glacier grinds the rock beneath it, carving wide valleys and carrying away enormous quantities of debris. When the ice finally reaches warmer elevations it melts, releasing this rubble in long ridges. Much of the dramatic mountain scenery we admire today was shaped by glaciers that have since vanished, leaving their signature in the land long after the ice itself disappeared.",
    difficulty: COMMON_DIFFICULTY,
    questions: [
      {
        id: "glaciers-q1",
        type: "mc",
        prompt: "What turns the lower layers of snow into dense ice?",
        options: [
          "The weight of the snow above",
          "Rainfall in winter",
          "Wind from the valley",
          "Heat from the rock",
        ],
        answerIndex: 0,
      },
      {
        id: "glaciers-q2",
        type: "cloze",
        prompt:
          "As it creeps along, the glacier grinds the rock beneath it, carving wide _____.",
        options: ["valleys", "lakes", "forests", "clouds"],
        answerIndex: 0,
      },
      {
        id: "glaciers-q3",
        type: "mc",
        prompt: "What sets the thick ice moving downhill?",
        options: ["Gravity", "Earthquakes", "Ocean tides", "Sunlight"],
        answerIndex: 0,
      },
      {
        id: "glaciers-q4",
        type: "inference",
        prompt: "What can we infer about much mountain scenery today?",
        options: [
          "It was shaped by glaciers that have since vanished",
          "It is entirely man-made",
          "It formed in a single winter",
          "It is unaffected by ice",
        ],
        answerIndex: 0,
      },
    ],
  },
];

const PL: ExamPassage[] = [
  {
    id: "bees",
    title: "Jak pszczoły nawigują",
    text: "Pszczoły miodne pokonują zaskakujące odległości w poszukiwaniu nektaru, czasem oddalając się o kilka kilometrów od ula. Aby trafić z powrotem, kierują się położeniem słońca, które śledzą nawet w pochmurne dni, odczytując wzory światła spolaryzowanego na niebie. Gdy robotnica znajdzie bogate źródło pożywienia, wraca i wykonuje na plastrze taniec wywijany. Kąt tańca względem pionu koduje kierunek pożywienia względem słońca, a czas trwania wywijania sygnalizuje odległość. Inne pszczoły uważnie śledzą tancerkę, a potem ruszają we wskazanym kierunku. Ta niezwykła forma komunikacji pozwala rodzinie dzielić się dokładnymi informacjami nawigacyjnymi bez żadnego dźwięku, dzięki czemu tysiące robotnic może sprawnie korzystać z tej samej kwitnącej łąki.",
    difficulty: COMMON_DIFFICULTY,
    questions: [
      {
        id: "bees-q1",
        type: "mc",
        prompt: "Jak pszczoły śledzą słońce w pochmurne dni?",
        options: [
          "Odczytując światło spolaryzowane na niebie",
          "Kierując się punktami na ziemi",
          "Słuchając innych pszczół",
          "Wyczuwając zmiany temperatury",
        ],
        answerIndex: 0,
      },
      {
        id: "bees-q2",
        type: "mc",
        prompt: "Co sygnalizuje czas trwania wywijania?",
        options: [
          "Odległość do pożywienia",
          "Rodzaj kwiatu",
          "Liczbę potrzebnych pszczół",
          "Porę dnia",
        ],
        answerIndex: 0,
      },
      {
        id: "bees-q3",
        type: "cloze",
        prompt:
          "Kąt tańca względem pionu koduje _____ pożywienia względem słońca.",
        options: ["kierunek", "kolor", "wagę", "świeżość"],
        answerIndex: 0,
      },
      {
        id: "bees-q4",
        type: "inference",
        prompt: "Co możemy wywnioskować o komunikacji pszczół?",
        options: [
          "Przekazuje dokładne informacje bez dźwięku",
          "Działa tylko nocą",
          "Wymaga zgody królowej",
          "Jest zawodna na duże odległości",
        ],
        answerIndex: 0,
      },
    ],
  },
  {
    id: "lighthouse",
    title: "Praca latarni morskich",
    text: "Od wieków latarnie morskie strzegą niebezpiecznych wybrzeży, ostrzegając statki przed skałami i prowadząc je bezpiecznie do portu. Wczesne wieże paliły węgiel lub drewno w otwartym ogniu, ale dawał on słabe i zawodne światło przy złej pogodzie. Przełom przyniosła soczewka Fresnela — pierścień szklanych pryzmatów, który zbiera rozproszone światło i skupia je w jedną silną wiązkę. Dzięki niej nawet skromna lampa była widoczna daleko na morzu. Każda latarnia błyska w odrębnym rytmie, zwanym jej charakterem, aby żeglarz mógł rozpoznać, którą latarnię widzi, i ustalić pozycję statku. Dziś większość latarni jest zautomatyzowana i zasilana elektrycznie, lecz ich podstawowy cel pozostaje ten sam: zamienić stały punkt światła w niezawodny komunikat o tym, gdzie czyha niebezpieczeństwo.",
    difficulty: COMMON_DIFFICULTY,
    questions: [
      {
        id: "lighthouse-q1",
        type: "mc",
        prompt: "Jaki problem miały wczesne ognie z węgla lub drewna?",
        options: [
          "Dawały słabe i zawodne światło przy złej pogodzie",
          "Były zbyt drogie w budowie",
          "Przyciągały zbyt wiele statków",
          "Były nielegalne w większości portów",
        ],
        answerIndex: 0,
      },
      {
        id: "lighthouse-q2",
        type: "cloze",
        prompt: "Soczewka Fresnela skupia rozproszone światło w jedną silną _____.",
        options: ["wiązkę", "cień", "barwę", "melodię"],
        answerIndex: 0,
      },
      {
        id: "lighthouse-q3",
        type: "mc",
        prompt: "Dlaczego każda latarnia błyska w odrębnym rytmie?",
        options: [
          "Aby żeglarze rozpoznali, która to latarnia",
          "Aby oszczędzać prąd",
          "Aby uczcić lokalne święta",
          "Aby odstraszać ptaki morskie",
        ],
        answerIndex: 0,
      },
      {
        id: "lighthouse-q4",
        type: "inference",
        prompt: "Jaka jest główna myśl fragmentu o latarniach?",
        options: [
          "Ich cel trwa mimo zmian technologii",
          "Nie są już nigdzie używane",
          "Były nieudanym eksperymentem",
          "Działają tylko na spokojnym morzu",
        ],
        answerIndex: 0,
      },
    ],
  },
  {
    id: "glaciers",
    title: "Rzeki lodu",
    text: "Lodowiec często opisuje się jako rzekę lodu i porównanie to jest trafne. Śnieg, który spada wysoko w górach, nie topnieje całkowicie latem; rok po roku narasta, a jego własny ciężar sprasowuje dolne warstwy w gęsty lód. Gdy lód zgrubieje wystarczająco, grawitacja wprawia go w powolny ruch w dół, czasem zaledwie o kilka centymetrów dziennie. Pełznąc, lodowiec szlifuje skałę pod sobą, żłobiąc szerokie doliny i unosząc ogromne ilości gruzu. Gdy lód dociera w końcu na cieplejsze wysokości, topnieje, uwalniając ten rumosz w postaci długich wałów. Wiele z dramatycznych górskich krajobrazów, które dziś podziwiamy, ukształtowały lodowce, które od tamtej pory zniknęły, pozostawiając swój ślad w krajobrazie długo po tym, jak sam lód przepadł.",
    difficulty: COMMON_DIFFICULTY,
    questions: [
      {
        id: "glaciers-q1",
        type: "mc",
        prompt: "Co zamienia dolne warstwy śniegu w gęsty lód?",
        options: [
          "Ciężar śniegu powyżej",
          "Opady deszczu zimą",
          "Wiatr z doliny",
          "Ciepło skały",
        ],
        answerIndex: 0,
      },
      {
        id: "glaciers-q2",
        type: "cloze",
        prompt:
          "Pełznąc, lodowiec szlifuje skałę pod sobą, żłobiąc szerokie _____.",
        options: ["doliny", "jeziora", "lasy", "chmury"],
        answerIndex: 0,
      },
      {
        id: "glaciers-q3",
        type: "mc",
        prompt: "Co wprawia gruby lód w ruch w dół?",
        options: ["Grawitacja", "Trzęsienia ziemi", "Pływy oceanu", "Światło słoneczne"],
        answerIndex: 0,
      },
      {
        id: "glaciers-q4",
        type: "inference",
        prompt: "Co możemy wywnioskować o wielu dzisiejszych górskich krajobrazach?",
        options: [
          "Ukształtowały je lodowce, które już zniknęły",
          "Są całkowicie sztuczne",
          "Powstały w jedną zimę",
          "Lód nie ma na nie wpływu",
        ],
        answerIndex: 0,
      },
    ],
  },
];

const BY_LANG: Record<PassageLang, ExamPassage[]> = { en: EN, pl: PL };

/** Default (English) passage set — kept for back-compat and tests. */
export const EXAM_PASSAGES = EN;

/** Passages in the requested UI language, falling back to English. */
export function getExamPassages(lang: string): ExamPassage[] {
  return BY_LANG[lang as PassageLang] ?? EN;
}
