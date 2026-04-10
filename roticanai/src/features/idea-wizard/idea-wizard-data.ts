export interface IdeaWizardPreference {
  id: string;
  labelKey: string;
  descriptionKey: string;
}

export interface IdeaWizardCategory {
  id: string;
  icon: "gamepad" | "globe" | "wrench" | "chart" | "palette" | "heart";
  labelKey: string;
  descriptionKey: string;
  preferenceAxisKey: string;
  preferences: IdeaWizardPreference[];
}

export const IDEA_WIZARD_CATEGORIES: IdeaWizardCategory[] = [
  {
    id: "game",
    icon: "gamepad",
    labelKey: "categories.game.label",
    descriptionKey: "categories.game.description",
    preferenceAxisKey: "axes.game",
    preferences: [
      {
        id: "arcade",
        labelKey: "preferences.game.arcade.label",
        descriptionKey: "preferences.game.arcade.description",
      },
      {
        id: "puzzle",
        labelKey: "preferences.game.puzzle.label",
        descriptionKey: "preferences.game.puzzle.description",
      },
      {
        id: "quiz",
        labelKey: "preferences.game.quiz.label",
        descriptionKey: "preferences.game.quiz.description",
      },
      {
        id: "cozy",
        labelKey: "preferences.game.cozy.label",
        descriptionKey: "preferences.game.cozy.description",
      },
    ],
  },
  {
    id: "website",
    icon: "globe",
    labelKey: "categories.website.label",
    descriptionKey: "categories.website.description",
    preferenceAxisKey: "axes.website",
    preferences: [
      {
        id: "portfolio",
        labelKey: "preferences.website.portfolio.label",
        descriptionKey: "preferences.website.portfolio.description",
      },
      {
        id: "small-business",
        labelKey: "preferences.website.smallBusiness.label",
        descriptionKey: "preferences.website.smallBusiness.description",
      },
      {
        id: "event",
        labelKey: "preferences.website.event.label",
        descriptionKey: "preferences.website.event.description",
      },
      {
        id: "fan-page",
        labelKey: "preferences.website.fanPage.label",
        descriptionKey: "preferences.website.fanPage.description",
      },
    ],
  },
  {
    id: "tool",
    icon: "wrench",
    labelKey: "categories.tool.label",
    descriptionKey: "categories.tool.description",
    preferenceAxisKey: "axes.tool",
    preferences: [
      {
        id: "generator",
        labelKey: "preferences.tool.generator.label",
        descriptionKey: "preferences.tool.generator.description",
      },
      {
        id: "calculator",
        labelKey: "preferences.tool.calculator.label",
        descriptionKey: "preferences.tool.calculator.description",
      },
      {
        id: "planner",
        labelKey: "preferences.tool.planner.label",
        descriptionKey: "preferences.tool.planner.description",
      },
      {
        id: "comparer",
        labelKey: "preferences.tool.comparer.label",
        descriptionKey: "preferences.tool.comparer.description",
      },
    ],
  },
  {
    id: "tracker",
    icon: "chart",
    labelKey: "categories.tracker.label",
    descriptionKey: "categories.tracker.description",
    preferenceAxisKey: "axes.tracker",
    preferences: [
      {
        id: "habits",
        labelKey: "preferences.tracker.habits.label",
        descriptionKey: "preferences.tracker.habits.description",
      },
      {
        id: "money",
        labelKey: "preferences.tracker.money.label",
        descriptionKey: "preferences.tracker.money.description",
      },
      {
        id: "fitness",
        labelKey: "preferences.tracker.fitness.label",
        descriptionKey: "preferences.tracker.fitness.description",
      },
      {
        id: "collection",
        labelKey: "preferences.tracker.collection.label",
        descriptionKey: "preferences.tracker.collection.description",
      },
    ],
  },
  {
    id: "creative",
    icon: "palette",
    labelKey: "categories.creative.label",
    descriptionKey: "categories.creative.description",
    preferenceAxisKey: "axes.creative",
    preferences: [
      {
        id: "visual",
        labelKey: "preferences.creative.visual.label",
        descriptionKey: "preferences.creative.visual.description",
      },
      {
        id: "writing",
        labelKey: "preferences.creative.writing.label",
        descriptionKey: "preferences.creative.writing.description",
      },
      {
        id: "music",
        labelKey: "preferences.creative.music.label",
        descriptionKey: "preferences.creative.music.description",
      },
      {
        id: "meme",
        labelKey: "preferences.creative.meme.label",
        descriptionKey: "preferences.creative.meme.description",
      },
    ],
  },
  {
    id: "personal",
    icon: "heart",
    labelKey: "categories.personal.label",
    descriptionKey: "categories.personal.description",
    preferenceAxisKey: "axes.personal",
    preferences: [
      {
        id: "food",
        labelKey: "preferences.personal.food.label",
        descriptionKey: "preferences.personal.food.description",
      },
      {
        id: "travel",
        labelKey: "preferences.personal.travel.label",
        descriptionKey: "preferences.personal.travel.description",
      },
      {
        id: "relationships",
        labelKey: "preferences.personal.relationships.label",
        descriptionKey: "preferences.personal.relationships.description",
      },
      {
        id: "self-care",
        labelKey: "preferences.personal.selfCare.label",
        descriptionKey: "preferences.personal.selfCare.description",
      },
    ],
  },
];
