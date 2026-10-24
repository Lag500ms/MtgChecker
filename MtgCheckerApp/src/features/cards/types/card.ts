export type CardPrice = {
  usd?: string | null;
  usdFoil?: string | null;
  usdEtched?: string | null;
  eur?: string | null;
  eurFoil?: string | null;
  tix?: string | null;
};

export type Card = {
  id: string;
  oracleId?: string;
  name: string;
  lang?: string;
  set: string;
  setName: string;
  collectorNumber: string;
  manaCost?: string;
  typeLine?: string;
  oracleText?: string;
  rarity?: string;
  finishes?: string[];
  prices?: CardPrice;
  imageUris?: Record<string, string>;
  cardFaces?: Array<{
    name?: string;
    imageUris?: Record<string, string>;
  }>;
  colors?: string[];
  colorIdentity?: string[];
  keywords?: string[];
  legalities?: Record<string, string>;
  power?: string;
  toughness?: string;
  loyalty?: string;
  artist?: string;
  flavorText?: string;
  releasedAt?: string;
  scryfallUri?: string;
  edhrecRank?: number;
};

export type CardCollectionResponse = {
  cards?: Card[];
  found?: Card[];
  notFound?: string[];
  totalCards?: number;
  hasMore?: boolean;
  nextPage?: string | null;
};

export type SearchCardsParams = {
  q: string;
  unique?: 'cards' | 'art' | 'prints';
  order?: 'name' | 'set' | 'released' | 'rarity' | 'color' | 'usd' | 'tix' | 'eur' | 'cmc' | 'power' | 'toughness' | 'edhrec';
  dir?: 'auto' | 'asc' | 'desc';
  page?: number;
};
