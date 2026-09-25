import type { CmsDocumentKind } from '@/content/contracts/kinds';

/**
 * Documents with a live preview: those rendered by a home-page section or a whole public page. Kept apart from
 * `DocumentPreview` so checking a kind does not load the public sections and GSAP.
 */
const PREVIEWABLE_KINDS: ReadonlySet<CmsDocumentKind> = new Set(['news', 'activities', 'people', 'kpis', 'honors', 'digital_materials', 'facdev', 'ebm', 'holistic', 'holistic_research']);

export function isPreviewableKind(kind: CmsDocumentKind): boolean {
  return PREVIEWABLE_KINDS.has(kind);
}
