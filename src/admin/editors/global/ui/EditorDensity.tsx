import { createContext, useContext, type ReactNode } from 'react';

type EditorDensity = {
  /** Start multi-field collection items collapsed to a one-line summary. */
  readonly collapseItemsByDefault: boolean;
  /** Admin UI language, for collection controls that sit outside any editor's own copy. */
  readonly isZh: boolean;
};

const EditorDensityContext = createContext<EditorDensity>({ collapseItemsByDefault: false, isZh: true });

export function EditorDensityProvider({ collapseItemsByDefault, isZh, children }: EditorDensity & { readonly children: ReactNode }) {
  return <EditorDensityContext.Provider value={{ collapseItemsByDefault, isZh }}>{children}</EditorDensityContext.Provider>;
}

export function useEditorDensity(): EditorDensity {
  return useContext(EditorDensityContext);
}

/** Event a field dispatches so any collapsed collection item containing it opens first. */
export const EDITOR_REVEAL_EVENT = 'admin:editor-reveal';

/** Opens every collapsed item around `element`, then focuses it once it is rendered visible. */
export function revealAndFocus(element: HTMLElement | null): void {
  if (element === null) return;
  const wasHidden = element.closest('[hidden]') !== null;
  element.dispatchEvent(new CustomEvent(EDITOR_REVEAL_EVENT, { bubbles: true }));
  // A field inside a collapsed item only becomes focusable after the item re-renders open.
  if (wasHidden) window.requestAnimationFrame(() => element.focus());
  else element.focus();
}
