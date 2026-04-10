/**
 * Prompt enhancement template
 *
 * Expands brief user ideas into detailed specs AND selects a design direction
 * (fonts, colors, layout) from the curated catalog. The design direction details
 * are included in the enhanced prompt so the main LLM can just execute.
 */

import { type DesignDirection, designDirections } from "./design-directions";

/**
 * Build the enhance prompt with the design catalog embedded.
 * The fast model picks the best-fit direction and includes its full details.
 */
export function buildEnhancePrompt(userInput: string): string {
  const catalog = buildCompactCatalog(designDirections);

  return `You are a prompt enhancement assistant for a web app builder. Clarify the user's idea and select a matching design direction.

CRITICAL: Clarify, don't expand. Do NOT invent features the user didn't ask for. A "todo app" is just a todo app — not a todo app with drag-and-drop, priority levels, calendar, and analytics. Keep it simple. The user can ask for more in follow-ups.

## Proportionality
- Short input ("todo app") → 1 sentence description, no feature list
- Medium input ("recipe app with search and favorites") → 1-2 sentences covering what they said
- Detailed input (a full paragraph) → match their detail level

## Design direction
Pick the best-fit direction from the catalog below based on the app's purpose and mood. A recipe app needs warmth, a dev tool needs precision, a dating app needs romance — never mismatch.

## Catalog

${catalog}

## Output format

[1-2 sentence app description — only what the user asked for]

---DESIGN---
Name: [direction name]
Aesthetic: [the aesthetic description]
Layout: [the layout description]
Font import: @import url('[the font import URL]');
Body font: [body font-family value]
Heading font: [heading font-family value, or "same as body" if none]
Palette:
[full CSS variable block from the chosen direction, exactly as listed]
---END---

RULES:
- ALWAYS include the ---DESIGN--- block
- Copy the chosen direction's fonts and palette EXACTLY
- Do NOT add features, pages, or functionality the user didn't mention
- Output ONLY the format above, nothing else

User's idea: ${userInput}`;
}

function buildCompactCatalog(directions: DesignDirection[]): string {
  return directions
    .map((d) => {
      const headingLine = d.headingFont
        ? `  Heading font: ${d.headingFont}`
        : "";

      const paletteVars = Object.entries(d.palette)
        .map(([key, value]) => {
          const cssVar = key.replace(/([A-Z])/g, "-$1").toLowerCase();
          return `    --${cssVar}: ${value};`;
        })
        .join("\n");

      return `**${d.name}** — ${d.aesthetic}
  Layout: ${d.layout}
  Font import: @import url('${d.fontImport}');
  Body font: ${d.bodyFont}
${headingLine}
  Palette:
${paletteVars}`;
    })
    .join("\n\n");
}

/**
 * @deprecated Use buildEnhancePrompt() instead
 */
export const enhancePrompt = `You are a prompt enhancement assistant for a web app builder.
Given the user's input, expand it into a clear specification with a design direction.
Keep it concise: 200-600 characters. Output ONLY the enhanced prompt.
User's idea: {input}`;
