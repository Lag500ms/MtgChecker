import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiClient } from '@/lib/apiClient';

import type { Card, CardCollectionResponse, SearchCardsParams } from '../types/card';

export async function findCardByName(name: string): Promise<Card> {
  const { data } = await apiClient.get<Card>('/cards', { params: { name } });
  return data;
}

export async function findPrintings(name: string): Promise<Card[]> {
  const { data } = await apiClient.get<Card[]>('/cards/printings', { params: { name } });
  return data;
}

export async function findCollection(names: string[]): Promise<CardCollectionResponse> {
  const { data } = await apiClient.post<CardCollectionResponse>('/cards/collection', { names });
  return data;
}

export async function autocompleteCardNames(q: string): Promise<string[]> {
  const query = q.trim();
  if (!query) return [];
  const { data } = await apiClient.get<string[]>('/cards/autocomplete', { params: { q: query } });
  return data;
}

export async function searchCards(params: SearchCardsParams): Promise<CardCollectionResponse> {
  const { data } = await apiClient.get<CardCollectionResponse>('/cards/search', { params });
  return data;
}

export async function findCardBySetAndNumber(
  set: string,
  number: string,
  lang?: string
): Promise<Card> {
  const { data } = await apiClient.get<Card>('/cards/by-set', {
    params: { set: set.toLowerCase().trim(), number: number.trim(), lang },
  });
  return data;
}

export interface ScanCardBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScanCardResult {
  card: Card;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  recognizedText: string;
  bounds?: ScanCardBounds;
  triedCandidates: string[];
}

export async function scanCardBase64(base64Image: string): Promise<ScanCardResult> {
  const { data } = await apiClient.post<ScanCardResult>('/cards/scan-base64', {
    image: base64Image,
  });
  return data;
}

export interface CardRuling {
  source: string;
  publishedAt: string;
  comment: string;
  oracleId?: string;
}

export async function fetchCardRulings(cardId: string): Promise<CardRuling[]> {
  const cacheKey = `mtgchecker.rulings.${cardId}`;
  try {
    const { data } = await apiClient.get<CardRuling[]>(`/rulings/card/${cardId}`);
    if (Array.isArray(data)) {
      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (storageErr) {
        /* Silently ignore cache storage error */
      }
      return data;
    }
  } catch (apiErr) {
    /* If network or API fails, try offline storage */
  }

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (readErr) {
    /* Ignore read cache errors */
  }

  return [];
}
