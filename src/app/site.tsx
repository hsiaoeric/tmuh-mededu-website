import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { PublishedCmsPayloadByKind } from '@/content/contracts/registry';
import { strings, type Lang, type Strings } from '@/i18n';

export type Theme = 'light' | 'dark';

export type SiteStrings = Readonly<Record<Lang, Strings>>;
export type SiteInline = PublishedCmsPayloadByKind['site_copy']['zh']['inline'];
export type SiteInlineByLang = Readonly<Record<Lang, SiteInline>>;

const LANG_KEY = 'tmuh.lang';
const THEME_KEY = 'tmuh.theme';
const DEFAULT_SITE_INLINE: SiteInlineByLang = {
  zh: {
    skipToContent: '跳到主要內容',
    holisticAdministrativeTeam: '行政團隊',
    holisticResearchTeam: '研究團隊',
    holisticClosingTitle: '讓關懷成為本能',
  },
  en: {
    skipToContent: 'Skip to content',
    holisticAdministrativeTeam: 'Administrative Team',
    holisticResearchTeam: 'Research Team',
    holisticClosingTitle: 'Making care instinctive',
  },
};

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
  inline: SiteInline;
  theme: Theme;
  toggleLang: () => void;
  toggleTheme: () => void;
}

const SiteCtx = createContext<SiteValue | null>(null);

export function SiteProvider({
  children,
  siteStrings = strings,
  siteInline = DEFAULT_SITE_INLINE,
}: {
  readonly children: ReactNode;
  readonly siteStrings?: SiteStrings;
  readonly siteInline?: SiteInlineByLang;
}) {
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
    () => ({ lang, isZh: lang === 'zh', t: siteStrings[lang], inline: siteInline[lang], theme, toggleLang, toggleTheme }),
    [lang, siteInline, siteStrings, theme, toggleLang, toggleTheme],
  );

  return <SiteCtx.Provider value={value}>{children}</SiteCtx.Provider>;
}

export function useSite(): SiteValue {
  const ctx = useContext(SiteCtx);
  if (!ctx) throw new Error('useSite must be used inside <SiteProvider>');
  return ctx;
}

const PageTitleCtx = createContext(true);

/** Pages rendered inside, such as the admin preview, leave the document title alone. */
export function KeepPageTitle({ children }: { children: ReactNode }) {
  return <PageTitleCtx.Provider value={false}>{children}</PageTitleCtx.Provider>;
}

/** Set the document title for a page. */
export function usePageTitle(title: string) {
  const { isZh } = useSite();
  const owns = useContext(PageTitleCtx);
  useEffect(() => {
    if (!owns) return;
    const site = isZh ? '北醫附醫教學部' : 'TMUH Medical Education';
    document.title = title ? `${title} — ${site}` : site;
  }, [owns, title, isZh]);
}
