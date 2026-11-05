export interface DeckFormat {
  id: string;
  name: string;
  description?: string;
  scryfallKey: string;
  minCards: number;
  maxCards?: number | null;
  maxCopies: number;
  hasCommander: boolean;
  hasSideboard: boolean;
  active: boolean;
}

export interface DeckCardItem {
  id?: string;
  scryfallId: string;
  name: string;
  setCode?: string;
  collectorNumber?: string;
  manaCost?: string;
  typeLine?: string;
  imageUrl?: string;
  cmc?: number;
  quantity: number;
  category: 'MAINBOARD' | 'SIDEBOARD' | 'COMMANDER';
  colors?: string[];
  colorIdentity?: string[];
  isLegal?: boolean;
  legalityStatus?: 'legal' | 'not_legal' | 'banned' | 'restricted';
}

export interface Deck {
  id: string;
  accountId?: string;
  name: string;
  description?: string;
  format: DeckFormat;
  commanderCardId?: string;
  commanderCardName?: string;
  commanderColorIdentity?: string[];
  coverCardUri?: string;
  partnerCommanderCardId?: string;
  partnerCommanderCardName?: string;
  partnerCoverCardUri?: string;
  visibility?: 'PUBLIC' | 'UNLISTED' | 'PRIVATE' | string;
  cards: DeckCardItem[];
  mainboardCount: number;
  sideboardCount: number;
  totalCount: number;
  updatedAt: string;
}

export interface DeckSummary {
  id: string;
  name: string;
  description?: string;
  format: DeckFormat;
  commanderCardId?: string;
  commanderCardName?: string;
  commanderColorIdentity?: string[];
  coverCardUri?: string;
  partnerCommanderCardId?: string;
  partnerCommanderCardName?: string;
  partnerCoverCardUri?: string;
  visibility?: 'PUBLIC' | 'UNLISTED' | 'PRIVATE' | string;
  mainboardCount: number;
  sideboardCount: number;
  totalCount: number;
  updatedAt: string;
}

export interface CreateDeckPayload {
  name: string;
  description?: string;
  formatId: string;
  commanderCardId?: string;
  commanderCardName?: string;
  commanderColorIdentity?: string[];
  coverCardUri?: string;
  partnerCommanderCardId?: string;
  partnerCommanderCardName?: string;
  partnerCoverCardUri?: string;
  visibility?: 'PUBLIC' | 'UNLISTED' | 'PRIVATE' | string;
}

export interface UpdateDeckPayload {
  name: string;
  description?: string;
  formatId: string;
  commanderCardId?: string;
  commanderCardName?: string;
  commanderColorIdentity?: string[];
  coverCardUri?: string;
  partnerCommanderCardId?: string;
  partnerCommanderCardName?: string;
  partnerCoverCardUri?: string;
  visibility?: 'PUBLIC' | 'UNLISTED' | 'PRIVATE' | string;
}

export interface SyncDeckCardsPayload {
  cards: Array<{
    scryfallId: string;
    name: string;
    setCode?: string;
    collectorNumber?: string;
    manaCost?: string;
    typeLine?: string;
    imageUrl?: string;
    cmc?: number;
    quantity: number;
    category: string;
  }>;
}
