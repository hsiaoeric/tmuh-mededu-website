import type { CmsDocumentKind } from '@/content/contracts/kinds';

/**
 * Documents with a live preview: those rendered by home-page sections. Kept apart from
 * `DocumentPreview` so checking a kind does not load the public sections and GSAP.
 */
const PREVIEWABLE_KINDS: ReadonlySet<CmsDocumentKind> = new Set(['news', 'activities', 'people', 'kpis', 'honors']);

export function isPreviewableKind(kind: CmsDocumentKind): boolean {
  return PREVIEWABLE_KINDS.has(kind);
}
