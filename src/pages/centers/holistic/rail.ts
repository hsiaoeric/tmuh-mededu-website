import { type HolisticSection } from '@/app/routes';
import { pick, type Lang } from '@/i18n';
import { type PageSection } from '@/ui/SectionRail';

/** Rail labels. Keyed by `HolisticSection`, so a new section id fails the build
 *  until it is given a label here. */
const SECTION_LABELS: Record<HolisticSection, [zh: string, en: string]> = {
  'h-about': ['關於中心', 'About'],
  'h-news': ['近期活動', 'Activities'],
  symposia: ['國內外研討會', 'Symposia'],
  'h-members': ['行政團隊', 'Administration'],
  'h-research-team': ['研究團隊', 'Research Team'],
  ai: ['生態系', 'Ecosystem'],
  mhfa: ['心理健康急救', 'MHFA'],
  training: ['師資培訓', 'Training'],
  'h-intl': ['國際合作', 'International'],
  research: ['研究成果', 'Research'],
  contact: ['聯絡資訊', 'Contact'],
};

/**
 * The banner across the top of the page. Sections that belong together are
 * gathered under one heading and opened from a dropdown, so the eight entries
 * here stand for the eleven sections below.
 *
 * This lives apart from the page because the section components need to read
 * it too — see `RAIL_INDEX` — and importing it back out of `HolisticPage`
 * would close a cycle, since that is what renders them.
 */
const RAIL: Array<[zh: string, en: string, of: HolisticSection[]]> = [
  ['關於中心', 'About', ['h-about']],
  ['最新消息', 'News', ['h-news', 'symposia']],
  ['中心成員', 'Members', ['h-members', 'h-research-team']],
  ['全人專案', 'Programs', ['ai', 'mhfa']],
  ['師資培訓', 'Training', ['training']],
  ['國際合作', 'International', ['h-intl']],
  ['研究成果', 'Research', ['research']],
  ['聯絡資訊', 'Contact', ['contact']],
];

export function railSections(lang: Lang): PageSection[] {
  return RAIL.map(([zh, en, of]) => {
    const label = pick(lang, zh, en);
    const child = (id: HolisticSection) => ({ id, label: pick(lang, ...SECTION_LABELS[id]) });
    return of.length === 1
      ? { id: of[0], label }
      : { id: of[0], label, children: of.map(child) };
  });
}

/**
 * The banner number a section sits under, for its `SectionHeader`.
 *
 * Derived from `RAIL` rather than written out beside each header, which is how
 * the two drifted apart in the first place: the headers were numbered when
 * every section stood on its own, then grouping the banner renumbered it and
 * left them counting to eleven against a banner that counts to eight.
 *
 * Grouped sections therefore share one number. The figure names a place in the
 * banner, not a position on the page, so two sections under one heading being
 * both `02` is the point rather than a collision.
 */
export const RAIL_INDEX = Object.fromEntries(
  RAIL.flatMap(([, , of], i) => of.map((id) => [id, String(i + 1).padStart(2, '0')])),
) as Record<HolisticSection, string>;
