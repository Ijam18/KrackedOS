"use client";

import { ShuffleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

/** Suggestion keys — used to look up translations and English prompts */
const ALL_SUGGESTION_KEYS = [
  // Productivity
  "pomodoroTimer",
  "habitTracker",
  "dailyJournal",
  "weeklyMealPlanner",
  "expenseTracker",
  "readingListTracker",
  "studyTimer",
  // Fun & Games
  "typingSpeedTest",
  "memoryMatchingGame",
  "ticTacToe",
  "snakeGame",
  "guessTheNumber",
  "rockPaperScissors",
  "quizGameBuilder",
  // Utilities
  "qrCodeGenerator",
  "colorPaletteGenerator",
  "unitConverter",
  "passwordGenerator",
  "countdownTimer",
  "tipCalculator",
  "randomQuoteGenerator",
  // Creative
  "gradientMaker",
  "pixelArtCanvas",
  "memeGenerator",
  "asciiArtGenerator",
  "photoCollageMaker",
  "markdownPreview",
  // Fun & Lifestyle
  "wouldYouRather",
  "truthOrDareGenerator",
  "loveCalculator",
  "babyNameGenerator",
  "movieNightPicker",
  "bucketListMaker",
  "fortuneCookieGenerator",
  "dreamJournalApp",
  "zodiacCompatibilityChecker",
  "travelDestinationSpinner",
  "birthdayCountdown",
  "nicknameMaker",
  "complimentGenerator",
  "emojiStoryMaker",
  "whatShouldIEatPicker",
  "playlistMoodMaker",
  "friendshipQuiz",
  "petNameGenerator",
  "dailyAffirmations",
  "randomDateIdeaGenerator",
  "vibeCheckQuiz",
  // Malaysian
  "mamakMenuRoulette",
  "splitBillMalaysia",
  "grabVsWalkCalculator",
  "malaysianSlangQuiz",
  "kopiBuildYourOwn",
  "publicHolidayCountdown",
  "whatToTapauDecider",
  "malaysianFlagQuiz",
  "tollFareCalculator",
  "whichMalaysianFoodAreYou",
  "parkingTimerReminder",
  "malaysianDialectTranslator",
  "roadTripPlaylistMaker",
  "mamakVsFancyDinner",
  "cnyAngPauCalculator",
  "malaysianMemeGenerator",
  "touchNGoBalanceTracker",
  "hawkerFoodRanker",
  // Lifestyle & Misc
  "spotifyWrappedClone",
  "aestheticMoodBoard",
  "screenTimeTracker",
  "hotTakesGenerator",
  "twoTruthsOneLie",
  "charadesWordGenerator",
  "sleepSoundMixer",
  "auraPointsCalculator",
  "fitnessBingoCard",
  "redFlagGreenFlagQuiz",
  "mainCharacterGenerator",
  "unpopularOpinionRanker",
  "romanticDinnerPlanner",
  "skinCareRoutineBuilder",
] as const;

/**
 * English prompts sent to the AI — always English regardless of UI language
 */
const SUGGESTION_PROMPTS: Record<string, string> = {
  pomodoroTimer: "Pomodoro timer",
  habitTracker: "Habit tracker with streaks",
  dailyJournal: "Daily journal",
  weeklyMealPlanner: "Weekly meal planner",
  expenseTracker: "Expense tracker",
  readingListTracker: "Reading list tracker",
  studyTimer: "Study timer with breaks",
  typingSpeedTest: "Typing speed test",
  memoryMatchingGame: "Memory matching game",
  ticTacToe: "Tic-tac-toe",
  snakeGame: "Snake game",
  guessTheNumber: "Guess the number",
  rockPaperScissors: "Rock paper scissors",
  quizGameBuilder: "Quiz game builder",
  qrCodeGenerator: "QR code generator",
  colorPaletteGenerator: "Color palette generator",
  unitConverter: "Unit converter",
  passwordGenerator: "Password generator",
  countdownTimer: "Countdown timer",
  tipCalculator: "Tip calculator",
  randomQuoteGenerator: "Random quote generator",
  gradientMaker: "Gradient maker",
  pixelArtCanvas: "Pixel art canvas",
  memeGenerator: "Meme generator",
  asciiArtGenerator: "ASCII art generator",
  photoCollageMaker: "Photo collage maker",
  markdownPreview: "Markdown preview",
  wouldYouRather: "Would you rather game",
  truthOrDareGenerator: "Truth or dare generator",
  loveCalculator: "Love calculator",
  babyNameGenerator: "Baby name generator",
  movieNightPicker: "Movie night picker",
  bucketListMaker: "Bucket list maker",
  fortuneCookieGenerator: "Fortune cookie generator",
  dreamJournalApp: "Dream journal",
  zodiacCompatibilityChecker: "Zodiac compatibility checker",
  travelDestinationSpinner: "Travel destination spinner",
  birthdayCountdown: "Birthday countdown",
  nicknameMaker: "Nickname maker",
  complimentGenerator: "Compliment generator",
  emojiStoryMaker: "Emoji story maker",
  whatShouldIEatPicker: "What should I eat picker",
  playlistMoodMaker: "Playlist mood maker",
  friendshipQuiz: "Friendship quiz",
  petNameGenerator: "Pet name generator",
  dailyAffirmations: "Daily affirmations",
  randomDateIdeaGenerator: "Random date idea generator",
  vibeCheckQuiz: "Vibe check quiz",
  mamakMenuRoulette: "Mamak menu roulette spinner",
  splitBillMalaysia: "Split bill calculator",
  grabVsWalkCalculator: "Grab vs walk calculator",
  malaysianSlangQuiz: "Malaysian slang quiz",
  kopiBuildYourOwn: "Build your own kopi order",
  publicHolidayCountdown: "Public holiday countdown",
  whatToTapauDecider: "What to tapau decider",
  malaysianFlagQuiz: "Malaysian state flag quiz",
  tollFareCalculator: "Toll fare calculator",
  whichMalaysianFoodAreYou: "Which Malaysian food are you quiz",
  parkingTimerReminder: "Parking timer reminder",
  malaysianDialectTranslator: "Malaysian dialect translator",
  roadTripPlaylistMaker: "Road trip playlist maker",
  mamakVsFancyDinner: "Mamak vs fancy dinner picker",
  cnyAngPauCalculator: "Ang pau calculator",
  malaysianMemeGenerator: "Malaysian meme generator",
  touchNGoBalanceTracker: "Touch n Go balance tracker",
  hawkerFoodRanker: "Hawker food ranker",
  spotifyWrappedClone: "Spotify Wrapped clone",
  aestheticMoodBoard: "Aesthetic mood board",
  screenTimeTracker: "Screen time tracker",
  hotTakesGenerator: "Hot takes generator",
  twoTruthsOneLie: "Two truths one lie game",
  charadesWordGenerator: "Charades word generator",
  sleepSoundMixer: "Sleep sound mixer",
  auraPointsCalculator: "Aura points calculator",
  fitnessBingoCard: "Fitness bingo card",
  redFlagGreenFlagQuiz: "Red flag green flag quiz",
  mainCharacterGenerator: "Main character energy generator",
  unpopularOpinionRanker: "Unpopular opinion ranker",
  romanticDinnerPlanner: "Romantic dinner planner",
  skinCareRoutineBuilder: "Skincare routine builder",
};

function getRandomSuggestionKeys(count: number): string[] {
  const shuffled = [...ALL_SUGGESTION_KEYS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** Staggered animation delays */
const ANIMATION_DELAYS = [
  "delay-[0ms]",
  "delay-[100ms]",
  "delay-[200ms]",
  "delay-[300ms]",
  "delay-[400ms]",
  "delay-[500ms]",
] as const;

interface IdeaSuggestionsProps {
  onSelect: (idea: string) => void;
  disabled?: boolean;
  count?: number;
}

export function IdeaSuggestions({
  onSelect,
  disabled,
  count = 3,
}: IdeaSuggestionsProps) {
  const ts = useTranslations("suggestions");
  const [shuffleSeed, setShuffleSeed] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: shuffleSeed triggers re-render
  const keys = useMemo(
    () => getRandomSuggestionKeys(count),
    [count, shuffleSeed],
  );
  const handleShuffle = useCallback(() => setShuffleSeed((s) => s + 1), []);

  return (
    <div className="flex items-center gap-2 overflow-x-auto md:overflow-visible md:flex-wrap md:justify-center pb-2 scrollbar-hide">
      <button
        type="button"
        onClick={handleShuffle}
        disabled={disabled}
        className="inline-flex items-center justify-center size-8 text-muted-foreground border border-muted-foreground/30 rounded-lg hover:border-primary hover:text-primary transition-all disabled:opacity-50 shrink-0"
      >
        <ShuffleIcon className="size-3.5" />
      </button>
      {keys.map((key, i) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(SUGGESTION_PROMPTS[key])}
          disabled={disabled}
          className={`px-3 py-2 text-sm font-mono text-muted-foreground border border-muted-foreground/30 rounded-lg hover:border-primary hover:text-primary transition-all disabled:opacity-50 animate-fade-in-up shrink-0 whitespace-nowrap ${ANIMATION_DELAYS[i % ANIMATION_DELAYS.length]}`}
        >
          {ts(key)}
        </button>
      ))}
    </div>
  );
}
