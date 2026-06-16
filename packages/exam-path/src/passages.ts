/**
 * Curated exam passages (system-design §7). These are APP-AUTHORED (original,
 * ours) — the one place the app ships its own text, so there is no IP concern.
 * They are of controlled, roughly equal difficulty so re-tests are apples-to-
 * apples. Questions are hand-authored across the three diagnostic types
 * (factual MC, cloze, inference — kickoff §6.6).
 *
 * NB: kept to ~130 words each for a usable demo; the kickoff's ~1000-word
 * baseline can be slotted in later without any code change.
 */
import type { PassageDifficulty } from "@srt/contracts/metadata";
import type { Question } from "@srt/comprehension";

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

export const EXAM_PASSAGES: ExamPassage[] = [
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
