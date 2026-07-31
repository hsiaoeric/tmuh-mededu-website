import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { strings, type Lang, type Strings } from '@/i18n';

export type Theme = 'light' | 'dark';

const LANG_KEY = 'tmuh.lang';
const THEME_KEY = 'tmuh.theme';

function readStored<T extends string>(key: string, allowed: readonly T[]): T | null {
  try {
    const v = localStorage.getItem(key);
    return v && (allowed as readonly string[]).includes(v) ? (v as T) : null;
  } catch {
    return null;
  }
}

function preferredTheme(): Theme {
  return readStored<Theme>(THEME_KEY, ['light', 'dark']) ??
    (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

interface SiteValue {
  lang: Lang;
  isZh: boolean;
  t: Strings;
  theme: Theme;
  toggleLang: () => void;
  toggleTheme: () => void;
}

const SiteCtx = createContext<SiteValue | null>(null);

export function SiteProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => readStored<Lang>(LANG_KEY, ['zh', 'en']) ?? 'zh');
  const [theme, setTheme] = useState<Theme>(preferredTheme);

  const toggleLang = useCallback(
    () => setLang((l) => (l === 'zh' ? 'en' : 'zh')),
    [],
  );
  const toggleTheme = useCallback(
    () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
    [],
  );

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* storage unavailable — the toggle still works for this session */
    }
  }, [lang]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0b100e' : '#f2efe8');
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignored */
    }
  }, [theme]);

  const value = useMemo<SiteValue>(
    () => ({ lang, isZh: lang === 'zh', t: strings[lang], theme, toggleLang, toggleTheme }),
    [lang, theme, toggleLang, toggleTheme],
  );

  return <SiteCtx.Provider value={value}>{children}</SiteCtx.Provider>;
}

export function useSite(): SiteValue {
  const ctx = useContext(SiteCtx);
  if (!ctx) throw new Error('useSite must be used inside <SiteProvider>');
  return ctx;
}

/** Set the document title for a page. */
export function usePageTitle(title: string) {
  const { isZh } = useSite();
  useEffect(() => {
    const site = isZh ? '北醫附醫教學部' : 'TMUH Medical Education';
    document.title = title ? `${title} — ${site}` : site;
  }, [title, isZh]);
}
