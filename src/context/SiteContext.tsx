import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { strings, type Lang, type Strings } from '@/i18n';
import { scrollToId } from '@/utils/scroll';

export type Theme = 'light' | 'dark';
export type ViewId = 'dept' | 'holistic' | 'ebm' | 'facdev' | 'building';
export type CenterId =
  | 'faculty_dev'
  | 'clinical_skills'
  | 'ebm'
  | 'holistic'
  | 'med_edu_research'
  | 'admin';

/** Single source of truth mapping each view to its URL path. */
export const VIEW_PATH: Record<Exclude<ViewId, 'building'>, string> = {
  dept: '/',
  holistic: '/holistic',
  ebm: '/ebm',
  facdev: '/facdev',
};

/** Centers that have a dedicated deep-page route. */
const CENTER_ROUTE: Partial<Record<CenterId, string>> = {
  holistic: VIEW_PATH.holistic,
  ebm: VIEW_PATH.ebm,
  faculty_dev: VIEW_PATH.facdev,
};

const VIEW_TITLE: Record<ViewId, { zh: string; en: string }> = {
  dept: { zh: '教學部', en: 'Dept. of Medical Education' },
  holistic: { zh: '全人照護教育中心', en: 'Holistic Care Education Center' },
  ebm: { zh: '實證醫學中心', en: 'Evidence-Based Medicine Center' },
  facdev: { zh: '教師發展中心', en: 'Faculty Development Center' },
  building: { zh: '中心專頁', en: 'Center Page' },
};
const SITE_NAME = { zh: '北醫附醫教學部', en: 'TMUH Medical Education' };

function parsePath(pathname: string): {
  view: ViewId;
  buildingId: CenterId | null;
} {
  if (pathname.startsWith('/holistic')) return { view: 'holistic', buildingId: null };
  if (pathname.startsWith('/ebm')) return { view: 'ebm', buildingId: null };
  if (pathname.startsWith('/facdev')) return { view: 'facdev', buildingId: null };
  if (pathname.startsWith('/center/')) {
    const id = pathname.slice('/center/'.length) as CenterId;
    return { view: 'building', buildingId: id || null };
  }
  return { view: 'dept', buildingId: null };
}

interface SiteContextValue {
  lang: Lang;
  isZh: boolean;
  t: Strings;
  theme: Theme;
  view: ViewId;
  buildingId: CenterId | null;
  toggleLang: () => void;
  toggleTheme: () => void;
  setView: (view: ViewId) => void;
  enterCenter: (id: CenterId, sectionId?: string) => void;
  goHome: () => void;
}

const SiteContext = createContext<SiteContextValue | null>(null);

interface ProviderProps {
  children: ReactNode;
  defaultLang?: Lang;
  defaultDark?: boolean;
}

export function SiteProvider({
  children,
  defaultLang = 'zh',
  defaultDark = false,
}: ProviderProps) {
  const [lang, setLang] = useState<Lang>(defaultLang);
  const [theme, setTheme] = useState<Theme>(defaultDark ? 'dark' : 'light');

  const location = useLocation();
  const navigate = useNavigate();
  const { view, buildingId } = parsePath(location.pathname);
  const pendingSectionRef = useRef<string | null>(null);

  const toggleLang = useCallback(
    () => setLang((l) => (l === 'zh' ? 'en' : 'zh')),
    [],
  );
  const toggleTheme = useCallback(
    () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
    [],
  );

  const setView = useCallback(
    (next: ViewId) => {
      navigate(next === 'building' ? '/' : VIEW_PATH[next]);
    },
    [navigate],
  );

  const enterCenter = useCallback(
    (id: CenterId, sectionId?: string) => {
      if (sectionId) pendingSectionRef.current = sectionId;
      navigate(CENTER_ROUTE[id] ?? `/center/${id}`);
    },
    [navigate],
  );

  const goHome = useCallback(() => navigate('/'), [navigate]);

  // Scroll to top on route change, unless a section anchor is pending.
  useEffect(() => {
    const pending = pendingSectionRef.current;
    if (pending) {
      pendingSectionRef.current = null;
      const timer = window.setTimeout(() => scrollToId(pending), 80);
      return () => window.clearTimeout(timer);
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  // Reflect the document language for accessibility, and keep the tab title in
  // sync with the current page so links/bookmarks are meaningful (A2 / A5).
  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
  }, [lang]);

  useEffect(() => {
    const name = VIEW_TITLE[view][lang];
    document.title =
      view === 'dept' ? `${name} — ${SITE_NAME[lang]}` : `${name} · ${SITE_NAME[lang]}`;
  }, [view, lang]);

  const value = useMemo<SiteContextValue>(
    () => ({
      lang,
      isZh: lang === 'zh',
      t: strings[lang],
      theme,
      view,
      buildingId,
      toggleLang,
      toggleTheme,
      setView,
      enterCenter,
      goHome,
    }),
    [lang, theme, view, buildingId, toggleLang, toggleTheme, setView, enterCenter, goHome],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteContextValue {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within a SiteProvider');
  return ctx;
}
