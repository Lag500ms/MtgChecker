import type { DeckFormat } from '../types/deck';

export interface LegalityResult {
  isLegal: boolean;
  status: 'legal' | 'not_legal' | 'banned' | 'restricted';
  badgeText: string;
  badgeColor: string;
  reason: string;
}

export function checkCardLegality(
  card: {
    legalities?: Record<string, string>;
    rarity?: string;
    type_line?: string;
    typeLine?: string;
    colorIdentity?: string[];
    color_identity?: string[];
  },
  format?: DeckFormat,
  commanderColorIdentity?: string[]
): LegalityResult {
  if (!format) {
    return {
      isLegal: true,
      status: 'legal',
      badgeText: 'LEGAL',
      badgeColor: '#10B981',
      reason: 'Legal for play',
    };
  }

  const formatKey = format.scryfallKey ? format.scryfallKey.toLowerCase() : format.id.toLowerCase();

  if (format.hasCommander && commanderColorIdentity && commanderColorIdentity.length > 0) {
    const cardIdColors = card.colorIdentity || card.color_identity || [];
    const invalidColors = cardIdColors.filter((c) => !commanderColorIdentity.includes(c.toUpperCase()));
    if (invalidColors.length > 0) {
      return {
        isLegal: false,
        status: 'not_legal',
        badgeText: `MISMATCH: ${invalidColors.join('')}`,
        badgeColor: '#EF4444',
        reason: `Card color [${invalidColors.join(', ')}] outside Commander's color identity [${commanderColorIdentity.join(', ')}] (CR 904.4)`,
      };
    }
  }
  const rawStatus = card.legalities && card.legalities[formatKey]
    ? card.legalities[formatKey].toLowerCase()
    : 'not_legal';

  if (rawStatus === 'banned') {
    return {
      isLegal: false,
      status: 'banned',
      badgeText: 'BANNED',
      badgeColor: '#EF4444',
      reason: `Banned in ${format.name}`,
    };
  }

  if (rawStatus === 'restricted') {
    return {
      isLegal: true,
      status: 'restricted',
      badgeText: 'RESTRICTED',
      badgeColor: '#F59E0B',
      reason: `Restricted to 1 copy in ${format.name}`,
    };
  }

  if (formatKey === 'pauper') {
    const rarity = card.rarity ? card.rarity.toLowerCase() : '';
    if (rarity && rarity !== 'common') {
      return {
        isLegal: false,
        status: 'not_legal',
        badgeText: 'NOT COMMON',
        badgeColor: '#F97316',
        reason: 'Pauper format only allows cards printed at common rarity',
      };
    }
  }

  if (rawStatus === 'legal') {
    return {
      isLegal: true,
      status: 'legal',
      badgeText: 'LEGAL',
      badgeColor: '#10B981',
      reason: `Legal in ${format.name}`,
    };
  }

  return {
    isLegal: false,
    status: 'not_legal',
    badgeText: 'NOT LEGAL',
    badgeColor: '#EF4444',
    reason: `Not legal in ${format.name}`,
  };
}
