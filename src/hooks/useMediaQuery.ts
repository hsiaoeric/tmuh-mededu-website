import { useEffect, useState } from 'react';

/**
 * Tracks whether a CSS media query currently matches.
 *
 * Use this only when JavaScript genuinely needs the answer — layout that CSS
 * can express on its own belongs in a stylesheet. The hub chart needs it
 * because its SVG connector coordinates are computed in JS and have to agree
 * with the card positions.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    setMatches(list.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
