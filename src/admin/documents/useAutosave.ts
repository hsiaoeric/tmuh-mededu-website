import { useCallback, useEffect, useRef, useState } from 'react';
import { isWorkspaceDirty } from './workspaceState';
import type { DocumentWorkspace } from './workspaceTypes';

const PREFIX = 'tmuh-admin-autosave:';
const DELAY_MS = 1000;
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

/** Unsaved editor text kept in this browser, and the draft it was written against. */
export type AutosavedEdit = {
  readonly editorText: string;
  readonly baseRevisionId: string | null;
  readonly baseEditVersion: number | null;
  readonly savedAt: string;
};

function isAutosavedEdit(value: unknown): value is AutosavedEdit {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.editorText === 'string' && typeof candidate.savedAt === 'string';
}

function read(key: string): AutosavedEdit | null {
  try {
    const raw = localStorage.getItem(key);
    const parsed: unknown = raw === null ? null : JSON.parse(raw);
    return isAutosavedEdit(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function write(key: string, value: AutosavedEdit): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable: autosave is a safety net, and the editor still works without it.
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignored for the same reason as `write`.
  }
}

function autosaveKeys(): string[] {
  try {
    return Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter((key): key is string => key?.startsWith(PREFIX) === true);
  } catch {
    return [];
  }
}

/** Drops every autosaved edit, for signing out on a shared computer. */
export function clearAllAutosaves(): void {
  autosaveKeys().forEach(remove);
}

function sweepExpired(now: number): void {
  for (const key of autosaveKeys()) {
    const saved = read(key);
    if (saved === null || now - Date.parse(saved.savedAt) > MAX_AGE_MS) remove(key);
  }
}

export type Autosave = {
  /** Unsaved text found from an earlier visit, until it is restored or discarded. */
  readonly offer: AutosavedEdit | null;
  /** The offer was written against a draft that has changed since. */
  readonly stale: boolean;
  /** Another tab is editing the same document in this browser. */
  readonly otherTab: boolean;
  readonly accept: () => string | null;
  readonly discard: () => void;
};

/**
 * Keeps unsaved edits in this browser, about a second after typing stops, so a closed tab or a
 * crash does not lose work. Nothing is written to the server. Restoring is always offered, never
 * applied silently, and saving afterwards still passes the usual edit-version check.
 */
export function useAutosave(workspace: DocumentWorkspace, userId: string | null): Autosave {
  const key = `${PREFIX}${userId ?? 'local'}:${workspace.document.id}`;
  const editable = workspace.actionableRevision !== null;
  const dirty = editable && isWorkspaceDirty(workspace);
  const [offer, setOffer] = useState<AutosavedEdit | null>(null);
  const [otherTab, setOtherTab] = useState(false);
  const offerRef = useRef(offer);
  offerRef.current = offer;
  const textRef = useRef(workspace.editorText);
  textRef.current = workspace.editorText;

  // Once per document: look for edits left from an earlier visit.
  useEffect(() => {
    sweepExpired(Date.now());
    const saved = read(key);
    const found = saved !== null && editable && saved.editorText !== textRef.current ? saved : null;
    // Set the ref now, not on the next render: the save effect below runs in this same commit and
    // must not clear the copy it is about to offer.
    offerRef.current = found;
    setOffer(found);
    if (found === null && saved !== null) remove(key);
    setOtherTab(false);
    // Only a different document or user starts a new lookup; later text changes are this visit's own,
    // so `editable` and the text are read as they are at that moment rather than tracked.
  }, [key]);

  useEffect(() => {
    if (!editable) return undefined;
    if (!dirty) {
      // Saved, published or undone back to the saved text: nothing left to protect. An offer not
      // yet answered stays in storage so a reload can still restore it.
      if (offerRef.current === null) remove(key);
      return undefined;
    }
    const timer = window.setTimeout(() => write(key, {
      editorText: workspace.editorText,
      baseRevisionId: workspace.actionableRevision?.id ?? null,
      baseEditVersion: workspace.expectedEditVersion,
      savedAt: new Date().toISOString(),
    }), DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [dirty, editable, key, workspace.actionableRevision, workspace.editorText, workspace.expectedEditVersion]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== key || event.newValue === null) return;
      const saved = read(key);
      if (saved !== null && saved.editorText !== textRef.current) setOtherTab(true);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key]);

  const accept = useCallback(() => {
    const text = offerRef.current?.editorText ?? null;
    setOffer(null);
    return text;
  }, []);
  const discard = useCallback(() => {
    setOffer(null);
    if (textRef.current === offerRef.current?.editorText || !dirty) remove(key);
  }, [dirty, key]);

  const stale = offer !== null && (offer.baseRevisionId !== (workspace.actionableRevision?.id ?? null) || offer.baseEditVersion !== workspace.expectedEditVersion);
  return { offer, stale, otherTab, accept, discard };
}
