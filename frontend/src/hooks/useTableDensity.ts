import { useCallback, useEffect, useState } from 'react';
import { TableDensity } from '../types/datatable';

export const TABLE_DENSITY_STORAGE_KEY = 'nanhr.table.density';

// Density is a personal reading preference, so every table on the page — and
// every open tab — follows the same choice the moment it changes.
const DENSITY_CHANGE_EVENT = 'nanhr:table-density-change';

const isTableDensity = (value: unknown): value is TableDensity =>
  value === 'comfortable' || value === 'compact';

function readStoredDensity(storageKey: string): TableDensity | null {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return isTableDensity(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function useTableDensity(fallback: TableDensity, storageKey = TABLE_DENSITY_STORAGE_KEY) {
  const [density, setDensity] = useState<TableDensity>(
    () => readStoredDensity(storageKey) ?? fallback
  );

  useEffect(() => {
    const sync = () => setDensity(readStoredDensity(storageKey) ?? fallback);
    sync();
    window.addEventListener(DENSITY_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(DENSITY_CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [storageKey, fallback]);

  const changeDensity = useCallback(
    (next: TableDensity) => {
      try {
        window.localStorage.setItem(storageKey, next);
      } catch {
        // Storage can be unavailable (private mode) — the in-memory value still applies.
      }
      setDensity(next);
      window.dispatchEvent(new Event(DENSITY_CHANGE_EVENT));
    },
    [storageKey]
  );

  return [density, changeDensity] as const;
}
