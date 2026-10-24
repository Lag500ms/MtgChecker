import type { Card } from '../types/card';

type ImageMap = Record<string, string> | undefined;

const SMALL_KEYS = ['small', 'normal', 'art_crop', 'large', 'png', 'border_crop'] as const;
const NORMAL_KEYS = ['normal', 'large', 'png', 'small', 'art_crop', 'border_crop'] as const;

function asMap(value: unknown): ImageMap {
  if (!value || typeof value !== 'object') return undefined;
  return value as Record<string, string>;
}

function mapsFrom(card: Card): ImageMap[] {
  const raw = card as Card & { image_uris?: ImageMap; card_faces?: Array<{ imageUris?: ImageMap; image_uris?: ImageMap }> };
  return [
    asMap(card.imageUris),
    asMap(raw.image_uris),
    asMap(card.cardFaces?.[0]?.imageUris),
    asMap(raw.card_faces?.[0]?.imageUris),
    asMap(raw.card_faces?.[0]?.image_uris),
  ];
}

function firstUri(maps: ImageMap[], keys: readonly string[]): string | undefined {
  for (const map of maps) {
    if (!map) continue;
    for (const key of keys) {
      const uri = map[key];
      if (typeof uri === 'string' && uri.length > 8) {
        return uri.replace(/^http:\/\//i, 'https://');
      }
    }
  }
  return undefined;
}

function scryfallFallback(card: Card, version: 'small' | 'normal'): string | undefined {
  if (!card.set || !card.collectorNumber) return undefined;
  const set = encodeURIComponent(card.set.toLowerCase());
  const number = encodeURIComponent(card.collectorNumber);
  return `https://api.scryfall.com/cards/${set}/${number}?format=image&version=${version}`;
}

export function pickCardImageUri(card: Card | null | undefined, size: 'small' | 'normal' = 'normal'): string | undefined {
  if (!card) return undefined;
  const keys = size === 'small' ? SMALL_KEYS : NORMAL_KEYS;
  return firstUri(mapsFrom(card), keys) || scryfallFallback(card, size);
}
