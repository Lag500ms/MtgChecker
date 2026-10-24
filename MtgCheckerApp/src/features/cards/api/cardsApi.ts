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
