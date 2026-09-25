import { useCallback, useEffect, useReducer, useRef } from 'react';

/** Edits closer together than this, such as a run of keystrokes, undo as one step. */
const COALESCE_MS = 800;
const LIMIT = 200;

export type EditorHistory = {
  readonly change: (editorText: string) => void;
  readonly undo: () => void;
  readonly redo: () => void;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
};

/**
 * Document-wide undo and redo over the editor text, covering structural edits such as removing
 * or reordering items that a field's own undo cannot reach. Starts empty for each `resetKey`.
 */
export function useEditorHistory(editorText: string, setEditorText: (editorText: string) => void, resetKey: unknown): EditorHistory {
  const past = useRef<string[]>([]);
  const future = useRef<string[]>([]);
  const lastChangeAt = useRef(0);
  const current = useRef(editorText);
  current.current = editorText;
  const [, rerender] = useReducer((value: number) => value + 1, 0);

  useEffect(() => {
    past.current = [];
    future.current = [];
    lastChangeAt.current = 0;
    rerender();
  }, [resetKey]);

  const change = useCallback((next: string) => {
    if (next !== current.current) {
      const now = Date.now();
      if (now - lastChangeAt.current > COALESCE_MS || past.current.length === 0) {
        past.current.push(current.current);
        if (past.current.length > LIMIT) past.current.shift();
      }
      lastChangeAt.current = now;
      future.current = [];
      rerender();
    }
    setEditorText(next);
  }, [setEditorText]);

  const step = useCallback((from: string[], to: string[]) => {
    const target = from.pop();
    if (target === undefined) return;
    to.push(current.current);
    lastChangeAt.current = 0;
    setEditorText(target);
    rerender();
  }, [setEditorText]);

  const undo = useCallback(() => step(past.current, future.current), [step]);
  const redo = useCallback(() => step(future.current, past.current), [step]);

  return { change, undo, redo, canUndo: past.current.length > 0, canRedo: future.current.length > 0 };
}
