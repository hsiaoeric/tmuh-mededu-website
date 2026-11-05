import { createContext, useContext, useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { AdminButton } from '@/admin/AdminButton';
import { AdminField } from '@/admin/AdminFields';
import { fieldIdForStructuredEditorIssuePath } from '@/admin/editors/shared';
import { resolveStoredMediaUrl } from '@/admin/media/mediaPreview';
import { parseSupabaseConfiguration } from '@/content/env';
import { LocalMediaReferenceSchema, type MediaReference } from '@/content/media';
import { Icon } from '@/ui/Icon';
import type { ArchiveCommitResult, ArchiveIssues } from '../archiveTypes';
import { issueFor, useIsZh } from '../fields';
import type { ArchiveMediaSlot } from './archiveMediaSlots';

/** Pixel size an upload can report with its reference, so image blocks and photos keep it. */
export type ArchiveMediaMeta = { readonly width?: number; readonly height?: number };

export type ArchiveMediaFieldProps = {
  readonly slot: ArchiveMediaSlot;
  /** Visible name of the slot, such as "封面圖片" or "照片 3". */
  readonly label: string;
  /** The image's alt text, for the preview. */
  readonly altText?: string;
  readonly issues: ArchiveIssues;
  /**
   * Links (or, for an optional slot, clears) the image. For a pending slot this creates the item
   * that will hold it, such as a new image block or photo.
   */
  readonly onChange: (reference: MediaReference | null, meta?: ArchiveMediaMeta) => ArchiveCommitResult;
  /** The item does not exist yet; choosing an image creates it. */
  readonly pending?: boolean;
  readonly onCancel?: () => void;
};

/**
 * Seam for the media workbench: wrap the editor in `ArchiveMediaFieldProvider` with a renderer
 * that uploads (and downsizes) files, and every archive image slot uses it. Without a provider the
 * field links images already committed under `public/assets/`.
 */
export type ArchiveMediaFieldRenderer = (props: ArchiveMediaFieldProps) => ReactNode;

const ArchiveMediaRendererContext = createContext<ArchiveMediaFieldRenderer | null>(null);

export function ArchiveMediaFieldProvider({ render, children }: { readonly render: ArchiveMediaFieldRenderer; readonly children: ReactNode }) {
  return <ArchiveMediaRendererContext.Provider value={render}>{children}</ArchiveMediaRendererContext.Provider>;
}

export function ArchiveMediaField(props: ArchiveMediaFieldProps): ReactElement {
  const render = useContext(ArchiveMediaRendererContext);
  return <>{render === null ? <LocalArchiveMediaField {...props} /> : render(props)}</>;
}

const CONFIGURATION = parseSupabaseConfiguration({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
});

/** A preview URL for committed and published images; draft media needs a signed URL from W9's field. */
export function archiveMediaPreviewUrl(reference: MediaReference | null): string | null {
  if (reference === null) return null;
  switch (reference.kind) {
    case 'local':
      return resolveStoredMediaUrl({ reference });
    case 'public':
      return resolveStoredMediaUrl({ reference, configuration: CONFIGURATION.kind === 'configured' ? CONFIGURATION.config : undefined });
    case 'draft':
      return null;
  }
}

function LocalArchiveMediaField({ slot, label, altText, issues, onChange, pending = false, onCancel }: ArchiveMediaFieldProps) {
  const isZh = useIsZh();
  const reference = slot.reference;
  const storedPath = reference?.kind === 'local' ? reference.path : '';
  const [draft, setDraft] = useState(storedPath);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  useEffect(() => { setDraft(storedPath); }, [storedPath]);
  const previewUrl = archiveMediaPreviewUrl(reference);
  const fieldId = fieldIdForStructuredEditorIssuePath(slot.path);
  const parsed = LocalMediaReferenceSchema.safeParse({ kind: 'local', path: draft });
  const localError = draft === '' || parsed.success
    ? undefined
    : (isZh ? '請輸入 assets/ 下的 JPEG、PNG 或 WebP 檔案路徑，例如 assets/legacy/article/xxxx.webp。' : 'Enter a JPEG, PNG, or WebP path under assets/, such as assets/legacy/article/xxxx.webp.');
  const storedError = issueFor(slot.path, issues) ?? issueFor([...slot.path, 'path'], issues);
  const emptyRequired = slot.required && reference === null && !pending;

  return (
    <section className="admin-archive-media" aria-label={label} data-slot-kind={slot.slotKind} data-media-state={reference === null ? 'empty' : reference.kind}>
      <div className="admin-media-preview admin-archive-media-preview">
        {previewUrl !== null && failedUrl !== previewUrl
          ? <img src={previewUrl} alt={altText ?? ''} loading="lazy" decoding="async" onError={() => setFailedUrl(previewUrl)} />
          : <span><Icon name="image" /><strong>{reference === null ? (isZh ? '尚未連結圖片' : 'No image linked') : (isZh ? '無法預覽' : 'No preview')}</strong></span>}
      </div>
      <div className="admin-archive-media-copy">
        <strong className="admin-archive-media-title">{label}</strong>
        {reference !== null && reference.kind !== 'local' ? (
          <p className="mono admin-break admin-field-message">{reference.kind === 'draft' ? (isZh ? '草稿圖片：' : 'Draft image: ') : (isZh ? '已發布圖片：' : 'Published image: ')}{reference.path}</p>
        ) : null}
        <AdminField
          id={fieldId}
          label={isZh ? '網站圖片路徑' : 'Site image path'}
          aria-label={isZh ? `${label}：網站圖片路徑` : `${label}: site image path`}
          helper={isZh ? '連結網站已收錄的圖片。上傳新圖片請使用媒體工作區。' : 'Link an image already on the site. Upload new images from the media workbench.'}
          error={localError ?? (emptyRequired ? (isZh ? '請連結一張圖片。' : 'Link an image.') : storedError)}
          value={draft}
          className="mono"
          spellCheck={false}
          autoComplete="off"
          placeholder="assets/…"
          onChange={(event) => {
            const next = event.currentTarget.value.trim();
            setDraft(next);
            const candidate = LocalMediaReferenceSchema.safeParse({ kind: 'local', path: next });
            if (candidate.success) onChange(candidate.data);
          }}
        />
        <div className="admin-cluster">
          {!slot.required && reference !== null ? (
            <AdminButton variant="warning" icon="trash" onClick={() => { setDraft(''); onChange(null); }}>{isZh ? '移除圖片' : 'Remove image'}</AdminButton>
          ) : null}
          {pending && onCancel !== undefined ? <AdminButton variant="quiet" onClick={onCancel}>{isZh ? '取消' : 'Cancel'}</AdminButton> : null}
        </div>
      </div>
    </section>
  );
}
