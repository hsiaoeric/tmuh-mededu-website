import { useMemo, type ReactElement } from 'react';
import { useSite } from '@/app/site';
import { InlineNotice } from '@/admin/AdminFeedback';
import type { DocumentWorkspace } from '@/admin/documents';
import { parseDraftPayload, withPublishableMediaReferences } from '@/admin/documents/workspaceValidation';
import { ContentPreviewProvider } from '@/content/ContentProvider';
import { StillMotion } from '@/motion/MotionPreference';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import { CMS_DOCUMENT_STABLE_KEYS, type CmsDocumentKind } from '@/content/contracts/kinds';
import type { PublishedContent } from '@/content/domain';
import { Glance } from '@/pages/home/Glance';
import { Honors } from '@/pages/home/Honors';
import { News } from '@/pages/home/News';

/**
 * Public sections that render each previewable document. They are the same components the
 * live home page uses, so the preview cannot drift from the site's real design.
 */
const PREVIEW_SECTIONS: Readonly<Partial<Record<CmsDocumentKind, () => ReactElement>>> = {
  news: News,
  activities: News,
  people: Glance,
  kpis: Glance,
  honors: Honors,
};

/** Kinds with a preview section; must match `isPreviewableKind` (checked by a test). */
export const PREVIEW_SECTION_KINDS = Object.keys(PREVIEW_SECTIONS) as CmsDocumentKind[];

type DocumentPreviewProps = {
  readonly kind: CmsDocumentKind;
  readonly workspace: DocumentWorkspace;
};

type PreviewResult =
  | { readonly ok: true; readonly content: PublishedContent }
  | { readonly ok: false };

function previewContent(kind: CmsDocumentKind, workspace: DocumentWorkspace): PreviewResult {
  const revision = workspace.actionableRevision;
  const draft = parseDraftPayload(workspace.editorText);
  if (revision === null || !draft.ok) return { ok: false };
  const parsed = CMS_PAYLOAD_REGISTRY[kind].publishedSchema.safeParse(withPublishableMediaReferences(draft.payload));
  if (!parsed.success) return { ok: false };
  return {
    ok: true,
    content: {
      documentId: workspace.document.id,
      kind,
      stableKey: CMS_DOCUMENT_STABLE_KEYS[kind],
      revisionId: revision.id,
      version: revision.version,
      payload: parsed.data,
      publishedAt: revision.updatedAt,
    } as PublishedContent,
  };
}

/** The current editor text rendered by the live public section, before saving or publishing. */
export function DocumentPreview({ kind, workspace }: DocumentPreviewProps) {
  const { isZh } = useSite();
  const Section = PREVIEW_SECTIONS[kind];
  const result = useMemo(() => previewContent(kind, workspace), [kind, workspace]);
  if (Section === undefined) return null;
  if (!result.ok) {
    return (
      <InlineNotice status="warning" title={isZh ? '目前無法預覽' : 'Preview unavailable'} lang={isZh ? 'zh-Hant' : 'en'}>
        {isZh ? '內容尚未通過發佈檢查。修正編輯器中標示的欄位後，預覽會自動更新。' : 'The content does not pass the publication check yet. Fix the fields flagged in the editor and the preview updates.'}
      </InlineNotice>
    );
  }
  return (
    <div className="admin-preview">
      <p className="admin-preview-note">
        {isZh
          ? '以下為網站實際元件呈現的未發佈內容，隨編輯即時更新。新上傳的照片在發佈前以姓名縮寫顯示。'
          : 'Unpublished content rendered by the live site’s components, updating as you edit. Newly uploaded photos show initials until published.'}
      </p>
      {/* Links must not navigate away from unsaved edits; in-section toggles such as member panels still work. */}
      <div
        className="admin-preview-frame"
        onClickCapture={(event) => {
          if ((event.target as Element).closest('a') !== null) event.preventDefault();
        }}
      >
        {/* Scroll-triggered reveals watch the window, but the admin scrolls its own container. */}
        <StillMotion>
          <ContentPreviewProvider override={result.content}>
            <Section />
          </ContentPreviewProvider>
        </StillMotion>
      </div>
    </div>
  );
}
