const LANGUAGE_NAMES = {
  en: "English",
  ms: "Bahasa Melayu",
} as const;

export function buildGuidedIdeasPrompt(input: {
  locale: "en" | "ms";
  categoryLabel: string;
  preferenceLabel: string;
  refreshCount: number;
}): string {
  const language = LANGUAGE_NAMES[input.locale];
  const avoidPreviousAngle =
    input.refreshCount > 0
      ? "Avoid repeating the same angle as the previous batch. Push the ideas into a clearly different direction while staying relevant."
      : "Produce the strongest first batch with varied but on-topic ideas.";

  return `You generate starter app ideas for a prompt-to-app builder.

The user is undecided. They chose:
- Category: ${input.categoryLabel}
- Direction: ${input.preferenceLabel}

Return exactly 4 ideas in ${language}.

Rules:
- Keep each idea simple, buildable, and specific
- Avoid startup pitches, marketplaces, AI agents, social networks, or feature-heavy products
- Favor single-purpose apps someone could plausibly build in one prompt-driven session
- Make the four ideas meaningfully different from each other
- ${avoidPreviousAngle}

Output JSON only with this exact shape:
{
  "ideas": [
    {
      "title": "short title",
      "description": "one sentence describing what the app does",
      "starter": "very short app concept phrase"
    }
  ]
}`;
}

export function buildGuidedPromptPrompt(input: {
  categoryLabel: string;
  preferenceLabel: string;
  ideaTitle: string;
  ideaDescription: string;
  ideaStarter: string;
}): string {
  return `You write a starter prompt for a web app builder.

The user selected:
- Category: ${input.categoryLabel}
- Direction: ${input.preferenceLabel}
- Chosen idea: ${input.ideaTitle}
- Idea description: ${input.ideaDescription}
- Starter concept: ${input.ideaStarter}

Write one plain-English prompt for building this app.

Rules:
- 1 to 3 sentences only
- Keep it concrete and buildable
- Include the core interaction, key screen or interface, and tone
- Do not invent bloated features, auth systems, dashboards, or admin panels unless implied
- Do not mention implementation tech or design tokens
- Output only the prompt text`;
}
