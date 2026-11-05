import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/lib/apiClient';
import type {
  CreateDeckPayload,
  Deck,
  DeckFormat,
  DeckSummary,
  SyncDeckCardsPayload,
  UpdateDeckPayload,
} from '../types/deck';

const STORAGE_KEY_FORMATS = 'mtgchecker.decks.formats';
const STORAGE_KEY_DECKS = 'mtgchecker.decks.list';
const STORAGE_KEY_DECK_DETAIL_PREFIX = 'mtgchecker.decks.detail.';

export const DEFAULT_FORMATS: DeckFormat[] = [
  {
    id: 'commander',
    name: 'Commander / EDH',
    description: '100-card singleton format led by a legendary creature as your Commander.',
    scryfallKey: 'commander',
    minCards: 100,
    maxCards: 100,
    maxCopies: 1,
    hasCommander: true,
    hasSideboard: false,
    active: true,
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Rotating 60-card constructed format using sets from the past three years.',
    scryfallKey: 'standard',
    minCards: 60,
    maxCards: null,
    maxCopies: 4,
    hasCommander: false,
    hasSideboard: true,
    active: true,
  },
  {
    id: 'pauper',
    name: 'Pauper',
    description: '60-card constructed format where every card must have been printed at Common rarity.',
    scryfallKey: 'pauper',
    minCards: 60,
    maxCards: null,
    maxCopies: 4,
    hasCommander: false,
    hasSideboard: true,
    active: true,
  },
];

export async function fetchActiveFormats(): Promise<DeckFormat[]> {
  try {
    const response = await apiClient.get<DeckFormat[]>('/deck-formats');
    if (Array.isArray(response.data) && response.data.length > 0) {
      await AsyncStorage.setItem(STORAGE_KEY_FORMATS, JSON.stringify(response.data));
      return response.data;
    }
  } catch {
  }

  const cached = await AsyncStorage.getItem(STORAGE_KEY_FORMATS);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
    }
  }

  return DEFAULT_FORMATS;
}

export async function listUserDecks(): Promise<DeckSummary[]> {
  try {
    const response = await apiClient.get<DeckSummary[]>('/decks');
    if (Array.isArray(response.data)) {
      await AsyncStorage.setItem(STORAGE_KEY_DECKS, JSON.stringify(response.data));
      return response.data;
    }
  } catch {
  }

  const cached = await AsyncStorage.getItem(STORAGE_KEY_DECKS);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
    }
  }

  return [];
}

export async function getDeckDetail(id: string): Promise<Deck | null> {
  try {
    const response = await apiClient.get<Deck>(`/decks/${id}`);
    if (response.data) {
      await AsyncStorage.setItem(
        `${STORAGE_KEY_DECK_DETAIL_PREFIX}${id}`,
        JSON.stringify(response.data)
      );
      return response.data;
    }
  } catch {
  }

  const cached = await AsyncStorage.getItem(`${STORAGE_KEY_DECK_DETAIL_PREFIX}${id}`);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
    }
  }

  return null;
}

export async function createDeck(payload: CreateDeckPayload): Promise<Deck> {
  const response = await apiClient.post<Deck>('/decks', payload);
  const created = response.data;

  await AsyncStorage.setItem(
    `${STORAGE_KEY_DECK_DETAIL_PREFIX}${created.id}`,
    JSON.stringify(created)
  );

  const localList = await listUserDecks();
  const summary: DeckSummary = {
    id: created.id,
    name: created.name,
    description: created.description,
    format: created.format,
    commanderCardId: created.commanderCardId,
    commanderCardName: created.commanderCardName,
    coverCardUri: created.coverCardUri,
    mainboardCount: created.mainboardCount,
    sideboardCount: created.sideboardCount,
    totalCount: created.totalCount,
    updatedAt: created.updatedAt,
  };
  await AsyncStorage.setItem(
    STORAGE_KEY_DECKS,
    JSON.stringify([summary, ...localList.filter((d) => d.id !== created.id)])
  );

  return created;
}

export async function updateDeck(id: string, payload: UpdateDeckPayload): Promise<Deck> {
  const response = await apiClient.put<Deck>(`/decks/${id}`, payload);
  const updated = response.data;

  await AsyncStorage.setItem(
    `${STORAGE_KEY_DECK_DETAIL_PREFIX}${id}`,
    JSON.stringify(updated)
  );

  const localList = await listUserDecks();
  const nextList = localList.map((d) =>
    d.id === id
      ? {
          ...d,
          name: updated.name,
          description: updated.description,
          format: updated.format,
          commanderCardId: updated.commanderCardId,
          commanderCardName: updated.commanderCardName,
          coverCardUri: updated.coverCardUri,
          updatedAt: updated.updatedAt,
        }
      : d
  );
  await AsyncStorage.setItem(STORAGE_KEY_DECKS, JSON.stringify(nextList));

  return updated;
}

export async function syncDeckCards(id: string, payload: SyncDeckCardsPayload): Promise<Deck> {
  const response = await apiClient.put<Deck>(`/decks/${id}/cards`, payload);
  const synced = response.data;

  await AsyncStorage.setItem(
    `${STORAGE_KEY_DECK_DETAIL_PREFIX}${id}`,
    JSON.stringify(synced)
  );

  const localList = await listUserDecks();
  const nextList = localList.map((d) =>
    d.id === id
      ? {
          ...d,
          mainboardCount: synced.mainboardCount,
          sideboardCount: synced.sideboardCount,
          totalCount: synced.totalCount,
          updatedAt: synced.updatedAt,
        }
      : d
  );
  await AsyncStorage.setItem(STORAGE_KEY_DECKS, JSON.stringify(nextList));

  return synced;
}

export async function deleteDeck(id: string): Promise<void> {
  await apiClient.delete(`/decks/${id}`);
  await AsyncStorage.removeItem(`${STORAGE_KEY_DECK_DETAIL_PREFIX}${id}`);

  const localList = await listUserDecks();
  const nextList = localList.filter((d) => d.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY_DECKS, JSON.stringify(nextList));
}
