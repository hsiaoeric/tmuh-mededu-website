import { createContext, useContext, type ReactNode } from 'react';
import { prefersReducedMotion } from './gsap';

const StillContext = createContext(false);

/**
 * Renders its subtree as if reduced motion were requested: no hidden-then-revealed content,
 * no scroll triggers, final counter values. For embedding public sections somewhere that
 * does not scroll the window, such as the admin preview.
 */
export function StillMotion({ children }: { readonly children: ReactNode }) {
  return <StillContext.Provider value>{children}</StillContext.Provider>;
}

/** `prefersReducedMotion()` that also honours an enclosing `StillMotion`. */
export function useReducedMotion(): boolean {
  const still = useContext(StillContext);
  return still || prefersReducedMotion();
}
