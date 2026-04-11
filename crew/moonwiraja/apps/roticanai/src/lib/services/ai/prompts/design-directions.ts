/**
 * Curated design directions for injecting variety into AI generations.
 *
 * One direction is randomly selected per generation and injected into the
 * system prompt, ensuring every app looks distinct.
 */

export interface DesignDirection {
  /** Short name for logging/debugging */
  name: string;
  /** Aesthetic description injected into the prompt */
  aesthetic: string;
  /** Google Fonts import URL */
  fontImport: string;
  /** CSS font-family for body */
  bodyFont: string;
  /** CSS font-family for headings (optional, if different) */
  headingFont?: string;
  /** oklch CSS variable overrides for :root */
  palette: {
    background: string;
    foreground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    border: string;
    input: string;
    ring: string;
    card: string;
    cardForeground: string;
    destructive: string;
    destructiveForeground: string;
  };
  /** Layout suggestion */
  layout: string;
}

export const designDirections: DesignDirection[] = [
  {
    name: "Warm Ink Editorial",
    aesthetic:
      "Dark editorial aesthetic with warm undertones. Serif headings with clean sans-serif body text. Feels like a premium literary magazine. Use generous whitespace and typographic hierarchy as the primary design tool.",
    fontImport:
      "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@400;500;600&display=swap",
    bodyFont: "'Inter Tight', sans-serif",
    headingFont: "'Instrument Serif', serif",
    palette: {
      background: "oklch(0.16 0.015 55)",
      foreground: "oklch(0.93 0.01 80)",
      primary: "oklch(0.78 0.11 60)",
      primaryForeground: "oklch(0.16 0.015 55)",
      secondary: "oklch(0.22 0.01 55)",
      secondaryForeground: "oklch(0.88 0.01 80)",
      muted: "oklch(0.22 0.01 55)",
      mutedForeground: "oklch(0.65 0.02 60)",
      accent: "oklch(0.68 0.16 35)",
      accentForeground: "oklch(0.16 0.015 55)",
      border: "oklch(0.28 0.01 55)",
      input: "oklch(0.25 0.01 55)",
      ring: "oklch(0.78 0.11 60)",
      card: "oklch(0.20 0.015 55)",
      cardForeground: "oklch(0.93 0.01 80)",
      destructive: "oklch(0.65 0.2 25)",
      destructiveForeground: "oklch(0.97 0.01 80)",
    },
    layout:
      "Asymmetric editorial grid with varied column widths. Large typographic headers, pull-quote styling, generous vertical rhythm.",
  },
  {
    name: "Desert Sand",
    aesthetic:
      "Light, warm aesthetic inspired by desert landscapes. Earthy tones with terracotta accents. Feels handcrafted and organic, like a ceramics studio website. Use texture through borders and subtle shadows rather than effects.",
    fontImport:
      "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=Commissioner:wght@400;500;600&display=swap",
    bodyFont: "'Commissioner', sans-serif",
    headingFont: "'Fraunces', serif",
    palette: {
      background: "oklch(0.96 0.015 75)",
      foreground: "oklch(0.22 0.03 50)",
      primary: "oklch(0.55 0.14 40)",
      primaryForeground: "oklch(0.97 0.01 75)",
      secondary: "oklch(0.92 0.02 75)",
      secondaryForeground: "oklch(0.30 0.03 50)",
      muted: "oklch(0.92 0.015 75)",
      mutedForeground: "oklch(0.50 0.03 50)",
      accent: "oklch(0.62 0.15 55)",
      accentForeground: "oklch(0.97 0.01 75)",
      border: "oklch(0.85 0.02 65)",
      input: "oklch(0.88 0.02 70)",
      ring: "oklch(0.55 0.14 40)",
      card: "oklch(0.98 0.01 75)",
      cardForeground: "oklch(0.22 0.03 50)",
      destructive: "oklch(0.58 0.2 25)",
      destructiveForeground: "oklch(0.97 0.01 75)",
    },
    layout:
      "Organic, relaxed layout with rounded containers and generous padding. Card-based content areas with warm shadows. Avoid rigid grids — let content breathe.",
  },
  {
    name: "Deep Ocean",
    aesthetic:
      "Dark, cool-toned interface with oceanic depth. Teal and cyan accents on deep navy. Feels like a premium SaaS dashboard or developer tool. Clean, information-dense, with clear data hierarchy.",
    fontImport:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap",
    bodyFont: "'IBM Plex Sans', sans-serif",
    headingFont: "'IBM Plex Sans', sans-serif",
    palette: {
      background: "oklch(0.14 0.03 245)",
      foreground: "oklch(0.92 0.02 220)",
      primary: "oklch(0.72 0.12 200)",
      primaryForeground: "oklch(0.14 0.03 245)",
      secondary: "oklch(0.20 0.025 245)",
      secondaryForeground: "oklch(0.88 0.02 220)",
      muted: "oklch(0.20 0.025 245)",
      mutedForeground: "oklch(0.62 0.03 220)",
      accent: "oklch(0.78 0.14 180)",
      accentForeground: "oklch(0.14 0.03 245)",
      border: "oklch(0.26 0.025 245)",
      input: "oklch(0.22 0.025 245)",
      ring: "oklch(0.72 0.12 200)",
      card: "oklch(0.18 0.028 245)",
      cardForeground: "oklch(0.92 0.02 220)",
      destructive: "oklch(0.65 0.2 25)",
      destructiveForeground: "oklch(0.97 0.01 220)",
    },
    layout:
      "Dashboard-style with sidebar navigation or top nav. Dense card grids for data. Monospace accents for technical content. Fixed headers with scrollable content areas.",
  },
  {
    name: "Forest Floor",
    aesthetic:
      "Dark, natural aesthetic with deep greens and amber accents. Feels like a luxury outdoor brand or sustainable tech company. Rich and grounded, with organic visual metaphors.",
    fontImport:
      "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Karla:wght@400;500;600;700&display=swap",
    bodyFont: "'Karla', sans-serif",
    headingFont: "'Lora', serif",
    palette: {
      background: "oklch(0.15 0.03 148)",
      foreground: "oklch(0.92 0.025 135)",
      primary: "oklch(0.68 0.14 150)",
      primaryForeground: "oklch(0.15 0.03 148)",
      secondary: "oklch(0.22 0.025 148)",
      secondaryForeground: "oklch(0.88 0.02 135)",
      muted: "oklch(0.22 0.025 148)",
      mutedForeground: "oklch(0.60 0.03 140)",
      accent: "oklch(0.72 0.13 80)",
      accentForeground: "oklch(0.15 0.03 148)",
      border: "oklch(0.27 0.025 148)",
      input: "oklch(0.24 0.025 148)",
      ring: "oklch(0.68 0.14 150)",
      card: "oklch(0.19 0.028 148)",
      cardForeground: "oklch(0.92 0.025 135)",
      destructive: "oklch(0.62 0.2 25)",
      destructiveForeground: "oklch(0.97 0.01 135)",
    },
    layout:
      "Full-width sections with alternating dark backgrounds. Large imagery placeholders, split-screen hero layouts. Left-aligned text with generous line height.",
  },
  {
    name: "Concrete Brutalist",
    aesthetic:
      "Light brutalist aesthetic with stark contrast. Black and white with a single bold accent color. Raw, honest, typography-driven. Feels like a contemporary art gallery website or architecture portfolio. Borders are sharp, no rounded corners.",
    fontImport:
      "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700&display=swap",
    bodyFont: "'Barlow', sans-serif",
    headingFont: "'Bebas Neue', sans-serif",
    palette: {
      background: "oklch(0.95 0 0)",
      foreground: "oklch(0.13 0 0)",
      primary: "oklch(0.13 0 0)",
      primaryForeground: "oklch(0.97 0 0)",
      secondary: "oklch(0.90 0 0)",
      secondaryForeground: "oklch(0.13 0 0)",
      muted: "oklch(0.90 0 0)",
      mutedForeground: "oklch(0.45 0 0)",
      accent: "oklch(0.63 0.24 28)",
      accentForeground: "oklch(0.97 0 0)",
      border: "oklch(0.13 0 0)",
      input: "oklch(0.88 0 0)",
      ring: "oklch(0.13 0 0)",
      card: "oklch(0.97 0 0)",
      cardForeground: "oklch(0.13 0 0)",
      destructive: "oklch(0.58 0.22 28)",
      destructiveForeground: "oklch(0.97 0 0)",
    },
    layout:
      "Strong grid structure with visible borders. Oversized typography (text-7xl, text-8xl). Asymmetric layouts. Content blocks with heavy borders rather than shadows.",
  },
  {
    name: "Lavender Dusk",
    aesthetic:
      "Soft, elegant light theme with cool purple-pink undertones. Feels like a wellness app or luxury beauty brand. Refined and calming, with smooth visual transitions and delicate typography.",
    fontImport:
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Nunito+Sans:wght@400;500;600;700&display=swap",
    bodyFont: "'Nunito Sans', sans-serif",
    headingFont: "'Cormorant Garamond', serif",
    palette: {
      background: "oklch(0.97 0.012 295)",
      foreground: "oklch(0.22 0.03 280)",
      primary: "oklch(0.52 0.14 290)",
      primaryForeground: "oklch(0.97 0.01 295)",
      secondary: "oklch(0.93 0.015 295)",
      secondaryForeground: "oklch(0.30 0.03 280)",
      muted: "oklch(0.93 0.012 295)",
      mutedForeground: "oklch(0.52 0.03 280)",
      accent: "oklch(0.68 0.14 340)",
      accentForeground: "oklch(0.22 0.03 280)",
      border: "oklch(0.88 0.015 290)",
      input: "oklch(0.90 0.012 295)",
      ring: "oklch(0.52 0.14 290)",
      card: "oklch(0.99 0.008 295)",
      cardForeground: "oklch(0.22 0.03 280)",
      destructive: "oklch(0.60 0.2 25)",
      destructiveForeground: "oklch(0.97 0.01 295)",
    },
    layout:
      "Centered content with generous padding. Soft card containers with subtle shadows. Flowing vertical layout, large hero sections with elegant type. Think premium product landing page.",
  },
  {
    name: "Midnight Terminal",
    aesthetic:
      "Dark hacker/terminal aesthetic with phosphor green on near-black. Feels like a cybersecurity dashboard or developer tool. Monospace typography throughout, scanline effects, data-dense layouts.",
    fontImport:
      "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Syne:wght@400;500;600;700;800&display=swap",
    bodyFont: "'JetBrains Mono', monospace",
    headingFont: "'Syne', sans-serif",
    palette: {
      background: "oklch(0.12 0.02 148)",
      foreground: "oklch(0.82 0.14 148)",
      primary: "oklch(0.75 0.18 150)",
      primaryForeground: "oklch(0.12 0.02 148)",
      secondary: "oklch(0.18 0.015 148)",
      secondaryForeground: "oklch(0.78 0.12 148)",
      muted: "oklch(0.18 0.015 148)",
      mutedForeground: "oklch(0.55 0.06 148)",
      accent: "oklch(0.82 0.10 95)",
      accentForeground: "oklch(0.12 0.02 148)",
      border: "oklch(0.25 0.03 148)",
      input: "oklch(0.18 0.02 148)",
      ring: "oklch(0.75 0.18 150)",
      card: "oklch(0.15 0.02 148)",
      cardForeground: "oklch(0.82 0.14 148)",
      destructive: "oklch(0.65 0.22 25)",
      destructiveForeground: "oklch(0.97 0.01 148)",
    },
    layout:
      "Dense, information-packed layout. Fixed sidebar or top bar with monospace labels. Tables and data grids. ASCII-art inspired dividers. Small text sizes for data, large for titles.",
  },
  {
    name: "Burnt Sienna Vintage",
    aesthetic:
      "Light vintage aesthetic with warm sienna, cream, and dusty blue accents. Feels like a well-designed cookbook or artisan coffee brand. Textured and warm, with serif typography and hand-crafted feel.",
    fontImport:
      "https://fonts.googleapis.com/css2?family=Vollkorn:ital,wght@0,400;0,600;0,700;1,400&family=Nunito:wght@400;500;600;700&display=swap",
    bodyFont: "'Nunito', sans-serif",
    headingFont: "'Vollkorn', serif",
    palette: {
      background: "oklch(0.96 0.018 72)",
      foreground: "oklch(0.25 0.04 42)",
      primary: "oklch(0.55 0.15 38)",
      primaryForeground: "oklch(0.97 0.01 72)",
      secondary: "oklch(0.91 0.02 72)",
      secondaryForeground: "oklch(0.30 0.04 42)",
      muted: "oklch(0.91 0.015 72)",
      mutedForeground: "oklch(0.50 0.03 50)",
      accent: "oklch(0.55 0.08 240)",
      accentForeground: "oklch(0.97 0.01 72)",
      border: "oklch(0.85 0.02 65)",
      input: "oklch(0.88 0.018 72)",
      ring: "oklch(0.55 0.15 38)",
      card: "oklch(0.98 0.012 72)",
      cardForeground: "oklch(0.25 0.04 42)",
      destructive: "oklch(0.58 0.2 25)",
      destructiveForeground: "oklch(0.97 0.01 72)",
    },
    layout:
      "Magazine-style layout with image-heavy sections, pull quotes, and varied grid columns. Card-based content with warm shadows. Border-bottom dividers between sections.",
  },
  {
    name: "Arctic Noir",
    aesthetic:
      "Dark, cool-toned minimal aesthetic. Ice blue accents on near-black with blue undertone. Feels like a premium fintech app or luxury automotive interface. Ultra-clean with precise spacing.",
    fontImport:
      "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inconsolata:wght@400;500;600&display=swap",
    bodyFont: "'Manrope', sans-serif",
    headingFont: "'Manrope', sans-serif",
    palette: {
      background: "oklch(0.13 0.015 260)",
      foreground: "oklch(0.92 0.01 240)",
      primary: "oklch(0.72 0.10 235)",
      primaryForeground: "oklch(0.13 0.015 260)",
      secondary: "oklch(0.19 0.012 260)",
      secondaryForeground: "oklch(0.88 0.01 240)",
      muted: "oklch(0.19 0.012 260)",
      mutedForeground: "oklch(0.58 0.02 250)",
      accent: "oklch(0.80 0.08 210)",
      accentForeground: "oklch(0.13 0.015 260)",
      border: "oklch(0.25 0.012 260)",
      input: "oklch(0.20 0.012 260)",
      ring: "oklch(0.72 0.10 235)",
      card: "oklch(0.17 0.014 260)",
      cardForeground: "oklch(0.92 0.01 240)",
      destructive: "oklch(0.62 0.2 25)",
      destructiveForeground: "oklch(0.97 0.01 240)",
    },
    layout:
      "Clean grid layout with consistent spacing. Cards with subtle borders, no heavy shadows. Tabular data presentation. Minimalist navigation with icon + text.",
  },
  {
    name: "Coral Sunrise",
    aesthetic:
      "Light, energetic aesthetic with warm coral and peach tones. Feels like a modern fitness app or social platform. Vibrant but not overwhelming, with playful typography and dynamic layouts.",
    fontImport:
      "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
    bodyFont: "'Plus Jakarta Sans', sans-serif",
    headingFont: "'Syne', sans-serif",
    palette: {
      background: "oklch(0.98 0.01 60)",
      foreground: "oklch(0.20 0.02 40)",
      primary: "oklch(0.68 0.18 25)",
      primaryForeground: "oklch(0.98 0.01 60)",
      secondary: "oklch(0.94 0.015 55)",
      secondaryForeground: "oklch(0.25 0.02 40)",
      muted: "oklch(0.94 0.012 60)",
      mutedForeground: "oklch(0.50 0.02 40)",
      accent: "oklch(0.75 0.15 55)",
      accentForeground: "oklch(0.20 0.02 40)",
      border: "oklch(0.88 0.015 50)",
      input: "oklch(0.90 0.012 55)",
      ring: "oklch(0.68 0.18 25)",
      card: "oklch(0.99 0.008 60)",
      cardForeground: "oklch(0.20 0.02 40)",
      destructive: "oklch(0.58 0.22 15)",
      destructiveForeground: "oklch(0.98 0.01 60)",
    },
    layout:
      "Bento grid layout with varied card sizes. Bold section headers, playful hover effects. Rounded containers (rounded-xl) with warm shadows. Split-screen hero.",
  },
  {
    name: "Slate Monochrome",
    aesthetic:
      "Dark monochrome with blue-gray undertones and a single vibrant accent. Feels like a premium code editor or design tool. Ultra-precise, with clear information hierarchy and minimal color usage.",
    fontImport:
      "https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;500;600;700;800&family=Fira+Code:wght@400;500;600&display=swap",
    bodyFont: "'Albert Sans', sans-serif",
    headingFont: "'Albert Sans', sans-serif",
    palette: {
      background: "oklch(0.15 0.01 260)",
      foreground: "oklch(0.88 0.01 250)",
      primary: "oklch(0.70 0.17 145)",
      primaryForeground: "oklch(0.15 0.01 260)",
      secondary: "oklch(0.21 0.008 260)",
      secondaryForeground: "oklch(0.85 0.01 250)",
      muted: "oklch(0.21 0.008 260)",
      mutedForeground: "oklch(0.55 0.01 255)",
      accent: "oklch(0.70 0.17 145)",
      accentForeground: "oklch(0.15 0.01 260)",
      border: "oklch(0.27 0.008 260)",
      input: "oklch(0.22 0.008 260)",
      ring: "oklch(0.70 0.17 145)",
      card: "oklch(0.19 0.01 260)",
      cardForeground: "oklch(0.88 0.01 250)",
      destructive: "oklch(0.62 0.2 25)",
      destructiveForeground: "oklch(0.97 0.01 250)",
    },
    layout:
      "Sidebar + main content layout. Dense but well-spaced cards. Tabbed interfaces, collapsible sections. Monospace for data/code, sans-serif for UI text.",
  },
  {
    name: "Sage & Cream",
    aesthetic:
      "Light, calming aesthetic with sage green and cream. Feels like a wellness app, meditation tool, or organic brand. Soft, breathable, with rounded shapes and gentle typography.",
    fontImport:
      "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap",
    bodyFont: "'DM Sans', sans-serif",
    headingFont: "'DM Serif Display', serif",
    palette: {
      background: "oklch(0.97 0.01 120)",
      foreground: "oklch(0.22 0.03 150)",
      primary: "oklch(0.58 0.10 155)",
      primaryForeground: "oklch(0.97 0.01 120)",
      secondary: "oklch(0.93 0.015 130)",
      secondaryForeground: "oklch(0.28 0.03 150)",
      muted: "oklch(0.93 0.012 125)",
      mutedForeground: "oklch(0.50 0.03 145)",
      accent: "oklch(0.72 0.08 95)",
      accentForeground: "oklch(0.22 0.03 150)",
      border: "oklch(0.88 0.015 130)",
      input: "oklch(0.90 0.012 125)",
      ring: "oklch(0.58 0.10 155)",
      card: "oklch(0.99 0.008 120)",
      cardForeground: "oklch(0.22 0.03 150)",
      destructive: "oklch(0.58 0.2 25)",
      destructiveForeground: "oklch(0.97 0.01 120)",
    },
    layout:
      "Centered, flowing layout with generous padding (p-16, p-20). Large rounded containers (rounded-2xl). Gentle hover animations. Single-column content with wide margins.",
  },
  {
    name: "Neon Noir",
    aesthetic:
      "Dark with electric neon accents — think cyberpunk Tokyo signage. Deep black backgrounds with high-saturation accent colors. Feels like a gaming platform, music app, or nightlife brand. Bold and unapologetic.",
    fontImport:
      "https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600;700;800;900&family=Work+Sans:wght@400;500;600;700&display=swap",
    bodyFont: "'Work Sans', sans-serif",
    headingFont: "'Unbounded', sans-serif",
    palette: {
      background: "oklch(0.10 0.01 290)",
      foreground: "oklch(0.92 0.01 290)",
      primary: "oklch(0.72 0.25 330)",
      primaryForeground: "oklch(0.10 0.01 290)",
      secondary: "oklch(0.17 0.015 290)",
      secondaryForeground: "oklch(0.88 0.01 290)",
      muted: "oklch(0.17 0.012 290)",
      mutedForeground: "oklch(0.55 0.02 290)",
      accent: "oklch(0.78 0.20 190)",
      accentForeground: "oklch(0.10 0.01 290)",
      border: "oklch(0.22 0.02 290)",
      input: "oklch(0.17 0.015 290)",
      ring: "oklch(0.72 0.25 330)",
      card: "oklch(0.14 0.015 290)",
      cardForeground: "oklch(0.92 0.01 290)",
      destructive: "oklch(0.65 0.25 25)",
      destructiveForeground: "oklch(0.97 0.01 290)",
    },
    layout:
      "Bold, asymmetric sections. Large display type (text-7xl+). Bento grid with varied card sizes. Dark cards with neon-colored borders or accents. Generous negative space between sections.",
  },
  {
    name: "Paper & Ink",
    aesthetic:
      "Minimal, print-inspired light theme. Off-white paper background with pure black text and a single muted accent. Feels like a beautifully typeset newspaper or academic journal. Let typography do ALL the work.",
    fontImport:
      "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Source+Sans+3:wght@400;500;600;700&display=swap",
    bodyFont: "'Source Sans 3', sans-serif",
    headingFont: "'Playfair Display', serif",
    palette: {
      background: "oklch(0.97 0.005 90)",
      foreground: "oklch(0.14 0 0)",
      primary: "oklch(0.14 0 0)",
      primaryForeground: "oklch(0.97 0.005 90)",
      secondary: "oklch(0.93 0.005 90)",
      secondaryForeground: "oklch(0.14 0 0)",
      muted: "oklch(0.93 0.005 90)",
      mutedForeground: "oklch(0.48 0.01 80)",
      accent: "oklch(0.50 0.08 240)",
      accentForeground: "oklch(0.97 0.005 90)",
      border: "oklch(0.82 0.005 85)",
      input: "oklch(0.90 0.005 90)",
      ring: "oklch(0.14 0 0)",
      card: "oklch(0.99 0.003 90)",
      cardForeground: "oklch(0.14 0 0)",
      destructive: "oklch(0.55 0.2 25)",
      destructiveForeground: "oklch(0.97 0.005 90)",
    },
    layout:
      "Multi-column editorial layout (2-3 columns on desktop). Large drop caps, pull quotes, horizontal rules as dividers. Serif headings with dramatic size contrast. Think New York Times or The Outline.",
  },
  {
    name: "Indigo Night",
    aesthetic:
      "Rich dark theme with deep indigo and gold accents. Feels like a luxury fintech app or premium membership platform. Sophisticated and confident, with crisp typography and precise alignment.",
    fontImport:
      "https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800&family=Libre+Franklin:wght@400;500;600;700&display=swap",
    bodyFont: "'Libre Franklin', sans-serif",
    headingFont: "'Schibsted Grotesk', sans-serif",
    palette: {
      background: "oklch(0.14 0.035 275)",
      foreground: "oklch(0.92 0.01 270)",
      primary: "oklch(0.78 0.12 85)",
      primaryForeground: "oklch(0.14 0.035 275)",
      secondary: "oklch(0.20 0.03 275)",
      secondaryForeground: "oklch(0.88 0.01 270)",
      muted: "oklch(0.20 0.025 275)",
      mutedForeground: "oklch(0.58 0.02 270)",
      accent: "oklch(0.78 0.12 85)",
      accentForeground: "oklch(0.14 0.035 275)",
      border: "oklch(0.26 0.03 275)",
      input: "oklch(0.22 0.03 275)",
      ring: "oklch(0.78 0.12 85)",
      card: "oklch(0.18 0.032 275)",
      cardForeground: "oklch(0.92 0.01 270)",
      destructive: "oklch(0.62 0.2 25)",
      destructiveForeground: "oklch(0.97 0.01 270)",
    },
    layout:
      "Premium app layout with top navigation bar. Card grid with consistent spacing. Status badges, data tables, metric cards. Clean, corporate-grade information architecture.",
  },
  {
    name: "Terracotta Studio",
    aesthetic:
      "Warm, artistic light theme with terracotta, clay, and dusty rose. Feels like a design studio or art gallery. Handcrafted quality with intentional imperfection — uneven grids, mixed type sizes, art-directed layout.",
    fontImport:
      "https://fonts.googleapis.com/css2?family=Bitter:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Raleway:wght@400;500;600;700&display=swap",
    bodyFont: "'Raleway', sans-serif",
    headingFont: "'Bitter', serif",
    palette: {
      background: "oklch(0.96 0.012 55)",
      foreground: "oklch(0.24 0.04 35)",
      primary: "oklch(0.58 0.13 30)",
      primaryForeground: "oklch(0.97 0.01 55)",
      secondary: "oklch(0.92 0.015 50)",
      secondaryForeground: "oklch(0.28 0.04 35)",
      muted: "oklch(0.92 0.012 55)",
      mutedForeground: "oklch(0.50 0.03 40)",
      accent: "oklch(0.65 0.10 350)",
      accentForeground: "oklch(0.24 0.04 35)",
      border: "oklch(0.86 0.015 50)",
      input: "oklch(0.90 0.012 55)",
      ring: "oklch(0.58 0.13 30)",
      card: "oklch(0.98 0.008 55)",
      cardForeground: "oklch(0.24 0.04 35)",
      destructive: "oklch(0.55 0.2 25)",
      destructiveForeground: "oklch(0.97 0.01 55)",
    },
    layout:
      "Masonry-style grid or asymmetric columns. Large image areas mixed with text blocks. Horizontal scroll sections for galleries. Warm, visible borders on containers.",
  },
];

/**
 * Select a random design direction.
 */
export function getRandomDesignDirection(): DesignDirection {
  const index = Math.floor(Math.random() * designDirections.length);
  return designDirections[index];
}
