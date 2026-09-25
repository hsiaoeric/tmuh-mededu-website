import { lazy, Suspense, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useSite } from '@/app/site';
import { DocumentOutline } from '@/admin/DocumentOutline';
import { formatAdminTimestamp, type DocumentWorkspace } from '@/admin/documents';
import { assertNever } from '@/admin/documents/assertNever';
import { GlobalDocumentEditor } from '@/admin/editors/global';
import { PageDocumentEditor } from '@/admin/editors/pages';
import { EditorDensityProvider } from '@/admin/editors/global/ui/EditorDensity';
import { AdminMediaWorkbench } from '@/admin/media';
import { changedFieldIds, isFieldChanged } from '@/admin/documents/changedFields';
import { FieldDecorationsProvider, type FieldDecorations } from '@/admin/fieldDecorations';
import type { PreviewLocateRequest } from '@/admin/preview/DocumentPreview';
import type { EditorControl } from '@/admin/preview/previewLinking';
import { StableKey } from '@/admin/StableKey';
import { CMS_DOCUMENT_STABLE_KEYS, type CmsDocumentKind } from '@/content/contracts/kinds';

// Loaded on first use: the preview renders public sections and pages and their GSAP motion
// code, which the editor itself never needs.
const DocumentPreview = lazy(() => import('@/admin/preview/DocumentPreview').then((module) => ({ default: module.DocumentPreview })));

export type AdminWorkspaceEditorRegionProps = {
  readonly workspace: DocumentWorkspace;
  readonly kind: CmsDocumentKind;
  readonly onChange: (editorText: string) => void;
  /** Show the live public preview beside the editor, in place of the full outline. */
  readonly previewing?: boolean;
  /** Opens the preview, for a field's "show in preview" button; absent when there is no preview. */
  readonly onRequestPreview?: () => void;
};

const EDITABLE_TEXT = 'input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="hidden"]), textarea';
const RELOCATE_DELAY_MS = 350;

/** The text field under the pointer, positioned relative to the editor, for its locate button. */
function useHoveredField(editorRef: RefObject<HTMLElement>, enabled: boolean) {
  const [target, setTarget] = useState<{ readonly control: EditorControl; readonly top: number } | null>(null);
  useEffect(() => {
    const editor = editorRef.current;
    if (editor === null || !enabled) return undefined;
    const handleOver = (event: PointerEvent) => {
      if (!(event.target instanceof Element) || event.target.closest('.admin-field-locate') !== null) return;
      const field = event.target.closest('.admin-field');
      const control = field?.querySelector<EditorControl>(EDITABLE_TEXT) ?? null;
      if (field === null || field === undefined || control === null) return;
      const top = field.getBoundingClientRect().top - editor.getBoundingClientRect().top;
      setTarget((current) => (current?.control === control && current.top === top ? current : { control, top }));
    };
    const handleLeave = () => setTarget(null);
    editor.addEventListener('pointerover', handleOver);
    editor.addEventListener('pointerleave', handleLeave);
    return () => {
      editor.removeEventListener('pointerover', handleOver);
      editor.removeEventListener('pointerleave', handleLeave);
    };
  }, [editorRef, enabled]);
  return target;
}

/** Which field the preview should point at, following focus and typing in the editor. */
function usePreviewLocate(editorRef: RefObject<HTMLElement>, previewing: boolean) {
  const [locate, setLocate] = useState<PreviewLocateRequest | null>(null);
  const nonce = useRef(0);
  const request = (control: EditorControl) => {
    nonce.current += 1;
    setLocate({ control, nonce: nonce.current });
  };
  useEffect(() => {
    const editor = editorRef.current;
    if (editor === null || !previewing) return undefined;
    let timer = 0;
    const handleFocus = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement && event.target.matches(EDITABLE_TEXT)) request(event.target as EditorControl);
    };
    const handleInput = (event: Event) => {
      if (!(event.target instanceof HTMLElement) || !event.target.matches(EDITABLE_TEXT)) return;
      const control = event.target as EditorControl;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => request(control), RELOCATE_DELAY_MS);
    };
    editor.addEventListener('focusin', handleFocus);
    editor.addEventListener('input', handleInput);
    return () => {
      window.clearTimeout(timer);
      editor.removeEventListener('focusin', handleFocus);
      editor.removeEventListener('input', handleInput);
    };
  }, [editorRef, previewing]);
  return { locate, request };
}

export function AdminWorkspaceEditorRegion({
  workspace,
  kind,
  onChange,
  previewing = false,
  onRequestPreview,
}: AdminWorkspaceEditorRegionProps) {
  const { isZh } = useSite();
  const editorRef = useRef<HTMLDivElement>(null);
  const { locate, request } = usePreviewLocate(editorRef, previewing);
  const requestRef = useRef(request);
  requestRef.current = request;
  const published = workspace.revisions.find((revision) => revision.status === 'published')?.payload ?? null;
  // Keyed by content, not identity: most keystrokes leave the set of changed fields as it was, and
  // a new context value would re-render every field in the document.
  const changedKey = useMemo(() => changedFieldIds(published, workspace.editorText).join('\n'), [published, workspace.editorText]);
  const decorations = useMemo<FieldDecorations>(() => {
    const changed = changedKey === '' ? [] : changedKey.split('\n');
    return {
    isZh,
    isChanged: (fieldId) => isFieldChanged(changed, fieldId),
    };
  }, [changedKey, isZh]);
  const locateTarget = useHoveredField(editorRef, onRequestPreview !== undefined);
  const editor = (() => {
    switch (kind) {
      case 'site_copy':
      case 'centers':
      case 'people':
      case 'news':
      case 'activities':
      case 'kpis':
      case 'honors':
        return <GlobalDocumentEditor kind={kind} workspace={workspace} onChange={onChange} />;
      case 'digital_materials':
      case 'facdev':
      case 'ebm':
      case 'holistic':
      case 'holistic_research':
        return <PageDocumentEditor kind={kind} workspace={workspace} onChange={onChange} />;
      default:
        return assertNever(kind, 'CMS document kind');
    }
  })();

  return (
    <section className="admin-workspace-grid" data-previewing={previewing || undefined}>
      <div ref={editorRef} className="admin-workspace-editor">
        {kind === 'people' || kind === 'facdev' ? (
          <AdminMediaWorkbench
            kind={kind}
            documentId={workspace.document.id}
            editorText={workspace.editorText}
            savedDraftPayload={workspace.activeDraft?.payload ?? null}
            onEditorTextChange={onChange}
          />
        ) : null}
        {locateTarget === null || onRequestPreview === undefined ? null : (
          // A pointer shortcut; keyboard users get the same by focusing a field while previewing.
          <button
            type="button"
            className="admin-field-locate"
            tabIndex={-1}
            style={{ top: locateTarget.top }}
            aria-label={isZh ? '在預覽中顯示' : 'Show in preview'}
            title={isZh ? '在預覽中顯示' : 'Show in preview'}
            onClick={() => { onRequestPreview(); requestRef.current(locateTarget.control); locateTarget.control.focus({ preventScroll: true }); }}
          />
        )}
        <FieldDecorationsProvider value={decorations}>
          <EditorDensityProvider collapseItemsByDefault isZh={isZh}>{editor}</EditorDensityProvider>
        </FieldDecorationsProvider>
      </div>
      <aside className="admin-workspace-rail" aria-label={isZh ? '文件資訊' : 'Document details'}>
        <DocumentOutline editorRef={editorRef} revision={workspace.editorText} compact={previewing} />
        {previewing ? (
          <Suspense fallback={<p className="admin-preview-note" role="status">{isZh ? '正在載入預覽…' : 'Loading preview…'}</p>}>
            <DocumentPreview kind={kind} workspace={workspace} editorRef={editorRef} locate={locate} />
          </Suspense>
        ) : null}
      </aside>
    </section>
  );
}

/** Content kind, stable key, and revision tokens: rarely needed, so kept behind the action bar's menu. */
export function DocumentTechnicalDetails({ workspace, kind }: { readonly workspace: DocumentWorkspace; readonly kind: CmsDocumentKind }) {
  const { isZh, lang } = useSite();
  const publishedRevision = workspace.revisions.find((revision) => revision.status === 'published');
  return (
    <div className="admin-document-details">
      <h3>{isZh ? '技術資訊' : 'Technical details'}</h3>
      <dl className="admin-document-context">
        <div><dt>{isZh ? '內容類型' : 'Content kind'}</dt><dd><StableKey value={kind} /></dd></div>
        <div><dt>{isZh ? '穩定鍵' : 'Stable key'}</dt><dd><StableKey value={CMS_DOCUMENT_STABLE_KEYS[kind]} /></dd></div>
        {workspace.actionableRevision === null ? null : <>
          <div><dt>{isZh ? '目前版本' : 'Current version'}</dt><dd>{workspace.actionableRevision.version}</dd></div>
          <div><dt>{isZh ? '編輯權杖' : 'Edit token'}</dt><dd>{workspace.expectedEditVersion}</dd></div>
        </>}
        <div><dt>{isZh ? '最後更新' : 'Last updated'}</dt><dd>{formatAdminTimestamp(workspace.document.updatedAt, lang)}</dd></div>
        <div><dt>{isZh ? '發布修訂' : 'Published revision'}</dt><dd>{publishedRevision?.version ?? (isZh ? '尚未發布' : 'Not published')}</dd></div>
      </dl>
    </div>
  );
}
