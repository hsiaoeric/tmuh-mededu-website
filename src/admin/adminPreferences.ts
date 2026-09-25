import { useCallback, useState } from 'react';

export const ADMIN_TEXT_SIZES = ['sm', 'md', 'lg'] as const;
export type AdminTextSize = (typeof ADMIN_TEXT_SIZES)[number];

const TEXT_SIZE_KEY = 'tmuh-admin-text-size';
const NAV_COLLAPSED_KEY = 'tmuh-admin-nav-collapsed';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode); the choice then lasts for this page only.
  }
}

/** A per-browser admin preference that survives reloads when storage is available. */
function usePersistentPreference<T>(key: string, parse: (stored: string | null) => T, serialize: (value: T) => string): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(() => parse(read(key)));
  const update = useCallback((next: T) => {
    setValue(next);
    write(key, serialize(next));
  }, [key, serialize]);
  return [value, update];
}

const parseTextSize = (stored: string | null): AdminTextSize => ADMIN_TEXT_SIZES.find((size) => size === stored) ?? 'md';
const parseCollapsed = (stored: string | null): boolean => stored === 'true';
const identity = (value: AdminTextSize) => value;
const serializeBoolean = (value: boolean) => String(value);

export function useAdminTextSize(): [AdminTextSize, (next: AdminTextSize) => void] {
  return usePersistentPreference(TEXT_SIZE_KEY, parseTextSize, identity);
}

export function useAdminNavCollapsed(): [boolean, (next: boolean) => void] {
  return usePersistentPreference(NAV_COLLAPSED_KEY, parseCollapsed, serializeBoolean);
}

const PREVIEW_SPLIT_KEY = 'tmuh-admin-preview-split';
/** The editor's share of the split view, in percent; the preview gets the rest. */
export const PREVIEW_SPLIT_DEFAULT = 53;
export const PREVIEW_SPLIT_MIN = 30;
export const PREVIEW_SPLIT_MAX = 75;

export const clampPreviewSplit = (value: number): number => Math.round(Math.min(PREVIEW_SPLIT_MAX, Math.max(PREVIEW_SPLIT_MIN, value)));
const parseSplit = (stored: string | null): number => {
  const value = stored === null ? Number.NaN : Number(stored);
  return Number.isFinite(value) ? clampPreviewSplit(value) : PREVIEW_SPLIT_DEFAULT;
};
const serializeNumber = (value: number) => String(value);

export function useAdminPreviewSplit(): [number, (next: number) => void] {
  return usePersistentPreference(PREVIEW_SPLIT_KEY, parseSplit, serializeNumber);
}
