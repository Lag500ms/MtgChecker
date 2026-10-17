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
};

export type CardCollectionResponse = {
  found: Card[];
  notFound: string[];
};
