import { apiClient } from '@/lib/apiClient';

import type { Card, CardCollectionResponse } from '../types/card';

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
