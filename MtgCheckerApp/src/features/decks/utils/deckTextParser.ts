export interface ParsedDeckLine {
  quantity: number;
  name: string;
  setCode?: string;
  collectorNumber?: string;
  category: 'COMMANDER' | 'MAINBOARD' | 'SIDEBOARD';
  raw: string;
}

export interface DeckParseResult {
  lines: ParsedDeckLine[];
  totalCards: number;
  errors: string[];
}

const LINE_REGEX = /^(\d+)[xX]?\s+([^(]+?)(?:\s+\(?([A-Za-z0-9]{3,5})\)?\s*(\S+)?|\s*$)/;

export function parseDeckText(rawText: string): DeckParseResult {
  const result: ParsedDeckLine[] = [];
  const errors: string[] = [];
  let currentCategory: 'COMMANDER' | 'MAINBOARD' | 'SIDEBOARD' = 'MAINBOARD';

  if (!rawText || !rawText.trim()) {
    return { lines: [], totalCards: 0, errors: [] };
  }

  const rawLines = rawText.split(/\r?\n/);

  for (let idx = 0; idx < rawLines.length; idx++) {
    const original = rawLines[idx].trim();
    if (!original) continue;

    const lower = original.toLowerCase();

    /* Check for section headers */
    if (lower.startsWith('commander') || lower.startsWith('// commander')) {
      currentCategory = 'COMMANDER';
      continue;
    }
    if (lower.startsWith('sideboard') || lower.startsWith('// sideboard')) {
      currentCategory = 'SIDEBOARD';
      continue;
    }
    if (
      lower.startsWith('deck') ||
      lower.startsWith('mainboard') ||
      lower.startsWith('// deck') ||
      lower.startsWith('// main')
    ) {
      currentCategory = 'MAINBOARD';
      continue;
    }
    if (original.startsWith('//') || original.startsWith('#')) {
      continue;
    }

    const match = original.match(LINE_REGEX);
    if (match) {
      const qty = parseInt(match[1], 10) || 1;
      let cardName = match[2].trim();

      /* Strip trailing foil or collector tags */
      cardName = cardName.replace(/\*F\*|\*E\*|\[foil\]/gi, '').trim();

      const setCode = match[3] ? match[3].toLowerCase() : undefined;
      const collectorNumber = match[4] ? match[4].replace(/[#]/g, '').trim() : undefined;

      result.push({
        quantity: qty,
        name: cardName,
        setCode,
        collectorNumber,
        category: currentCategory,
        raw: original,
      });
    } else {
      /* Fallback: maybe just card name without quantity */
      const cleanFallback = original.replace(/^\d+\s*/, '').trim();
      if (cleanFallback.length > 1) {
        result.push({
          quantity: 1,
          name: cleanFallback,
          category: currentCategory,
          raw: original,
        });
      } else {
        errors.push(`Line ${idx + 1}: Unrecognized card line: "${original}"`);
      }
    }
  }

  const totalCards = result.reduce((sum, item) => sum + item.quantity, 0);

  return {
    lines: result,
    totalCards,
    errors,
  };
}
