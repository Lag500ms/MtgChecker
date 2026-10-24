export type OwnedCard = {
  id: string;
  scryfallId: string;
  oracleId?: string;
  name: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  lang: string;
  finish: string;
  condition?: string;
  acquiredPriceUsd?: string | null;
  storageLocation?: string | null;
  quantity: number;
  priceUsd?: string | null;
  totalPriceUsd?: string | null;
  imageUri?: string | null;
  rarity?: string | null;
  manaCost?: string | null;
};

export type CollectionSummary = {
  totalValueUsd: number;
  totalCardsCount: number;
  uniqueCardsCount: number;
  deltaValue7d?: number | null;
  deltaPercent7d?: number | null;
  cards: OwnedCard[];
};

export type AddOwnedCardRequest = {
  setCode: string;
  collectorNumber: string;
  finish: string;
  quantity: number;
  condition?: string;
  acquiredPriceUsd?: string;
  storageLocation?: string;
};

export type UpdateOwnedCardRequest = {
  quantity: number;
  condition?: string;
  acquiredPriceUsd?: string;
  storageLocation?: string;
};
