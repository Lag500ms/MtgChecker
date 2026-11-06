import { apiClient } from '@/lib/apiClient';
import { getAccessToken } from '@/lib/tokenStorage';

import type {
  AddOwnedCardRequest,
  CollectionSummary,
  OwnedCard,
  UpdateOwnedCardRequest,
} from '../types/inventory';

let isCollectionDirty = false;
const listeners = new Set<() => void>();

export function markCollectionDirty(): void {
  isCollectionDirty = true;
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
    }
  });
}

export function isCollectionCacheDirty(): boolean {
  return isCollectionDirty;
}

export function clearCollectionDirty(): void {
  isCollectionDirty = false;
}

export function subscribeToCollectionChanges(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function listOwnedCards(): Promise<OwnedCard[]> {
  const token = await getAccessToken();
  if (!token) {
    return [];
  }
  const { data } = await apiClient.get<OwnedCard[]>('/inventory');
  return data;
}

export async function getCollectionSummary(): Promise<CollectionSummary> {
  const { data } = await apiClient.get<CollectionSummary>('/inventory/summary');
  return data;
}

export async function addOwnedCard(payload: AddOwnedCardRequest): Promise<OwnedCard> {
  const { data } = await apiClient.post<OwnedCard>('/inventory', payload);
  markCollectionDirty();
  return data;
}

export async function updateOwnedQuantity(
  id: string,
  payload: UpdateOwnedCardRequest,
): Promise<OwnedCard> {
  const { data } = await apiClient.put<OwnedCard>(`/inventory/${id}`, payload);
  markCollectionDirty();
  return data;
}

export async function deleteOwnedCard(id: string): Promise<void> {
  await apiClient.delete(`/inventory/${id}`);
  markCollectionDirty();
}
