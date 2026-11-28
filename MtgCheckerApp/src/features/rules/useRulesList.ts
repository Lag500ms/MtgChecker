import { useEffect, useState } from 'react';

// Show the local snapshot first, then refresh from the API.
export function useRulesList<T>(readLocal: () => Promise<T[]>, refresh: () => Promise<T[]>) {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    let active = true;
    async function load() {
      for (const read of [readLocal, refresh]) {
        try {
          const next = await read();
          if (!active) return;
          setItems(next);
        } catch {
          if (!active) return;
          // Keep the last available snapshot.
        }
      }
    }
    void load();
    return () => { active = false; };
  }, [readLocal, refresh]);
  return items;
}
