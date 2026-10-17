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
  quantity: number;
  priceUsd?: string | null;
};

export type AddOwnedCardRequest = {
  setCode: string;
  collectorNumber: string;
  finish: string;
  quantity: number;
};

export type UpdateOwnedCardRequest = {
  quantity: number;
};
