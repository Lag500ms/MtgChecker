export type ParsedCardCode = {
  setCode: string;
  collectorNumber: string;
  rawMatch: string;
};

const KNOWN_EXCLUSIONS = new Set(['THE', 'AND', 'FOR', 'NOT', 'YOU', 'CAN', 'ALL', 'HAS']);

export function parseMtgCardCode(rawText: string): ParsedCardCode | null {
  if (!rawText || rawText.length < 4) return null;

  const normalized = rawText.toUpperCase().replace(/\r?\n/g, ' ');

  const footerPattern = /\b([A-Z0-9]{3,5})\s*[\s•·\-\*]\s*0*([0-9]{1,4})(?:\s*\/\s*[0-9]{1,4})?\b/;
  const footerMatch = normalized.match(footerPattern);
  if (footerMatch) {
    const candidateSet = footerMatch[1].toLowerCase();
    const candidateNumber = footerMatch[2];
    if (!KNOWN_EXCLUSIONS.has(footerMatch[1])) {
      return {
        setCode: candidateSet,
        collectorNumber: candidateNumber,
        rawMatch: footerMatch[0],
      };
    }
  }

  const hashPattern = /\b([A-Z0-9]{3,5})\s*#\s*0*([0-9]{1,4})\b/;
  const hashMatch = normalized.match(hashPattern);
  if (hashMatch) {
    if (!KNOWN_EXCLUSIONS.has(hashMatch[1])) {
      return {
        setCode: hashMatch[1].toLowerCase(),
        collectorNumber: hashMatch[2],
        rawMatch: hashMatch[0],
      };
    }
  }

  const slashPattern = /\b([A-Z0-9]{3,5})\s+0*([0-9]{1,4})\s*\/\s*[0-9]{1,4}\b/;
  const slashMatch = normalized.match(slashPattern);
  if (slashMatch) {
    if (!KNOWN_EXCLUSIONS.has(slashMatch[1])) {
      return {
        setCode: slashMatch[1].toLowerCase(),
        collectorNumber: slashMatch[2],
        rawMatch: slashMatch[0],
      };
    }
  }

  const simplePattern = /\b([A-Z]{3,4})\s+0*([1-9][0-9]{0,3})\b/;
  const simpleMatch = normalized.match(simplePattern);
  if (simpleMatch) {
    if (!KNOWN_EXCLUSIONS.has(simpleMatch[1])) {
      return {
        setCode: simpleMatch[1].toLowerCase(),
        collectorNumber: simpleMatch[2],
        rawMatch: simpleMatch[0],
      };
    }
  }

  return null;
}
