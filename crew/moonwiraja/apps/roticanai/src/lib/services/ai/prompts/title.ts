/**
 * Prompt for generating app titles
 */

export const titlePrompt = `Generate a concise, descriptive title (3-6 words max) for a web app based on this user request:

"{description}"

Rules:
- No quotes or punctuation
- Title case
- Describe what the app does, not the technology
- Examples: "Task Manager", "Weather Dashboard", "Recipe Finder"

Respond with ONLY the title, nothing else.`;
