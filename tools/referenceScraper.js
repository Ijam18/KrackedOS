function decodeHtmlEntities(value) {
  if (typeof value !== 'string' || !value) return '';
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function cleanText(value) {
  return decodeHtmlEntities(String(value || ''))
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniq(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeColorToken(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const hex = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!hex) return '';
  const normalized = hex[0].length === 4
    ? `#${hex[1].split('').map((part) => `${part}${part}`).join('')}`
    : raw.toUpperCase();
  return normalized.toUpperCase();
}

function pickTopColors(rawValues, limit = 5) {
  const frequency = new Map();
  rawValues.forEach((value) => {
    const normalized = normalizeColorToken(value);
    if (!normalized) return;
    if (['#FFFFFF', '#000000', '#F5F5F5'].includes(normalized)) return;
    frequency.set(normalized, (frequency.get(normalized) || 0) + 1);
  });
  return [...frequency.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([color]) => color);
}

function inferFontDirectionFromCss(cssText) {
  const families = [];
  const regex = /font-family\s*:\s*([^;}{]+)/gi;
  let match;
  while ((match = regex.exec(cssText))) {
    const familyParts = match[1]
      .split(',')
      .map((part) => part.replace(/["']/g, '').trim())
      .filter(Boolean);
    familyParts.forEach((part) => {
      if (/^(sans-serif|serif|monospace|system-ui|ui-sans-serif|ui-serif|ui-monospace)$/i.test(part)) return;
      families.push(part);
    });
  }

  const uniqueFamilies = uniq(families).slice(0, 4);
  const lowerCss = cssText.toLowerCase();
  const vibe = lowerCss.includes('serif')
    ? 'serif-led'
    : lowerCss.includes('monospace')
      ? 'monospace-led'
      : 'sans-serif-led';

  if (uniqueFamilies.length) {
    return `${vibe} typography with likely families such as ${uniqueFamilies.join(', ')}.`;
  }

  return `${vibe} typography with a likely modern web hierarchy.`;
}

function inferDesignTheme({ htmlText, cssText, titleText }) {
  const corpus = `${titleText} ${htmlText} ${cssText}`.toLowerCase();
  const traits = [];

  if (/gradient|blur|glass|backdrop-filter/.test(corpus)) traits.push('polished gradient/glass styling');
  if (/minimal|clean|neutral|whitespace|space-y/.test(corpus)) traits.push('minimal clean layout');
  if (/editorial|magazine|story|case-study/.test(corpus)) traits.push('editorial storytelling vibe');
  if (/dashboard|table|analytics|sidebar|workspace/.test(corpus)) traits.push('structured product/dashboard feel');
  if (/playful|fun|bold|colorful|illustration/.test(corpus)) traits.push('playful expressive direction');
  if (/dark|#0f172a|#111827|#020617/.test(corpus)) traits.push('dark high-contrast mood');

  if (!traits.length) {
    traits.push('modern web product aesthetic');
  }

  return uniq(traits).slice(0, 3).join(', ');
}

function inferFlowStructure(htmlText) {
  const bodyMatch = htmlText.match(/<body[\s\S]*?>([\s\S]*?)<\/body>/i);
  const body = bodyMatch?.[1] || htmlText;
  const structuralRegex = /<(header|nav|main|section|article|footer|aside)\b([^>]*)>/gi;
  const steps = [];
  let match;

  while ((match = structuralRegex.exec(body)) && steps.length < 8) {
    const tag = match[1].toLowerCase();
    const attrs = match[2] || '';
    const labelSource = attrs.match(/(?:id|class)=["']([^"']+)["']/i)?.[1] || '';
    const label = cleanText(labelSource.replace(/[-_]/g, ' '));
    if (tag === 'section') {
      steps.push(label ? `section: ${label}` : 'content section');
    } else if (tag === 'nav') {
      steps.push('navigation');
    } else if (tag === 'header') {
      steps.push('header / hero');
    } else if (tag === 'main') {
      steps.push('main content');
    } else if (tag === 'footer') {
      steps.push('footer / closing CTA');
    } else {
      steps.push(tag);
    }
  }

  const headingMatches = [...htmlText.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)]
    .slice(0, 5)
    .map((heading) => cleanText(heading[1]))
    .filter(Boolean);

  const structure = uniq(steps).slice(0, 6);
  if (headingMatches.length) {
    structure.push(`headline cues: ${headingMatches.join(' -> ')}`);
  }

  return structure.length
    ? structure.join(' -> ')
    : 'Likely landing flow from hero to supporting sections to closing call-to-action.';
}

function extractStylesheetUrls(htmlText, baseUrl) {
  const urls = [];
  const regex = /<link[^>]+rel=["'][^"']*stylesheet[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = regex.exec(htmlText)) && urls.length < 6) {
    try {
      urls.push(new URL(match[1], baseUrl).toString());
    } catch {
      // Ignore malformed stylesheet urls.
    }
  }
  return urls;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'KRACKED_OS IdeaToPrompt Reference Scraper'
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url} (${response.status})`);
  }
  return response.text();
}

export async function scrapeReferenceUrl(url) {
  if (!url) return null;
  const htmlText = await fetchText(url);
  const stylesheetUrls = extractStylesheetUrls(htmlText, url);
  const stylesheetTexts = await Promise.all(
    stylesheetUrls.map(async (stylesheetUrl) => {
      try {
        return await fetchText(stylesheetUrl);
      } catch {
        return '';
      }
    })
  );
  const cssText = stylesheetTexts.join('\n');
  const titleText = cleanText(htmlText.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
  const colorMatches = [
    ...(htmlText.match(/#[0-9a-fA-F]{3,6}\b/g) || []),
    ...(cssText.match(/#[0-9a-fA-F]{3,6}\b/g) || [])
  ];
  const palette = pickTopColors(colorMatches);
  const themeColor = cleanText(htmlText.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i)?.[1] || '');
  if (themeColor) {
    palette.unshift(themeColor);
  }

  return {
    url,
    title: titleText || new URL(url).hostname,
    designTheme: inferDesignTheme({ htmlText, cssText, titleText }),
    fontDirection: inferFontDirectionFromCss(cssText || htmlText),
    colorPalette: uniq(palette.map(normalizeColorToken)).filter(Boolean).slice(0, 5).join(', ') || 'Neutral web palette with limited obvious theme colors.',
    flowStructure: inferFlowStructure(htmlText)
  };
}

export function mergeScrapeResults(results) {
  const validResults = results.filter(Boolean);
  const mergedTheme = uniq(validResults.map((result) => result.designTheme)).join(' | ') || 'No design theme extracted yet.';
  const mergedFonts = uniq(validResults.map((result) => result.fontDirection)).join(' | ') || 'No font direction extracted yet.';
  const mergedPalette = uniq(
    validResults.flatMap((result) => String(result.colorPalette || '').split(',').map((item) => item.trim()))
  ).filter(Boolean).slice(0, 6).join(', ') || 'No palette extracted yet.';
  const mergedFlow = validResults.length
    ? validResults.map((result) => `${result.title}: ${result.flowStructure}`).join(' | ')
    : 'No flow structure extracted yet.';

  return {
    designTheme: mergedTheme,
    fontDirection: mergedFonts,
    colorPalette: mergedPalette,
    flowStructure: mergedFlow
  };
}

export async function scrapeReferencePayload({ referenceUrl = '', websiteReferenceUrl = '', designReferenceUrl = '' } = {}) {
  const resolvedReferenceUrl = referenceUrl || websiteReferenceUrl || designReferenceUrl;
  const reference = await scrapeReferenceUrl(resolvedReferenceUrl);

  return {
    status: 'ready',
    reference,
    merged: mergeScrapeResults([reference]),
    fetchedAt: new Date().toISOString()
  };
}
