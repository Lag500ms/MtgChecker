import { apiClient } from '@/lib/apiClient';

import type {
  AddOwnedCardRequest,
  CollectionSummary,
  OwnedCard,
  UpdateOwnedCardRequest,
} from '../types/inventory';

export async function listOwnedCards(): Promise<OwnedCard[]> {
  const { data } = await apiClient.get<OwnedCard[]>('/inventory');
  return data;
}

export async function getCollectionSummary(): Promise<CollectionSummary> {
  const { data } = await apiClient.get<CollectionSummary>('/inventory/summary');
  return data;
}

export async function addOwnedCard(payload: AddOwnedCardRequest): Promise<OwnedCard> {
  const { data } = await apiClient.post<OwnedCard>('/inventory', payload);
  return data;
}

export async function updateOwnedQuantity(
  id: string,
  payload: UpdateOwnedCardRequest,
): Promise<OwnedCard> {
  const { data } = await apiClient.put<OwnedCard>(`/inventory/${id}`, payload);
  return data;
}

export async function deleteOwnedCard(id: string): Promise<void> {
  await apiClient.delete(`/inventory/${id}`);
}
