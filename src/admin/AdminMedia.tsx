import { useId, useState, type ChangeEvent, type ReactNode, type RefObject } from 'react';
import { Icon } from '@/ui/Icon';
import type { UploadProgress } from './media';
import { AdminButton } from './AdminButton';
import { ZhCopy, ZhPhrase } from './AdminText';

type AdminMediaPickerProps = {
  readonly label: ReactNode;
  readonly labelLang?: string;
  readonly description: ReactNode;
  readonly descriptionLang?: string;
  readonly fileName?: string;
  readonly previewUrl?: string;
  readonly altText?: string;
  readonly disabled?: boolean;
  readonly uploading?: boolean;
  readonly progress?: UploadProgress;
  readonly feedback?: { readonly status: 'success' | 'error'; readonly message: ReactNode };
  readonly onSelect?: (file: File) => void;
  readonly onRemove?: () => void;
  readonly removeTriggerRef?: RefObject<HTMLButtonElement>;
  readonly labels?: {
    readonly empty: string;
    readonly guidance: ReactNode;
    readonly uploading: string;
    readonly choose: string;
    readonly replace: string;
    readonly remove: string;
    readonly requirements?: ReactNode;
    readonly previewUnavailable?: string;
  };
};

const DEFAULT_LABELS = { empty: '尚未選擇圖片', guidance: <ZhCopy><ZhPhrase>替代文字應描述</ZhPhrase><ZhPhrase>圖片中的人物、場合</ZhPhrase><ZhPhrase>與教學意義；</ZhPhrase><ZhPhrase>純裝飾圖片</ZhPhrase><ZhPhrase>可留空。</ZhPhrase></ZhCopy>, uploading: '上傳中，請勿關閉頁面', choose: '選擇圖片', replace: '更換圖片', remove: '移除圖片' } as const;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

export function AdminMediaPicker({ label, labelLang, description, descriptionLang, fileName, previewUrl, altText, disabled = false, uploading = false, progress, feedback, onSelect, onRemove, removeTriggerRef, labels = DEFAULT_LABELS }: AdminMediaPickerProps) {
  const id = useId();
  const inputId = `${id}-input`;
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const guidanceId = `${id}-guidance`;
  const requirementsId = `${id}-requirements`;
  const statusId = `${id}-status`;
  const [failedPreviewUrl, setFailedPreviewUrl] = useState<string | null>(null);
  const previewAvailable = previewUrl !== undefined && failedPreviewUrl !== previewUrl;
  const previewUnavailable = (previewUrl !== undefined && failedPreviewUrl === previewUrl)
    || (fileName !== undefined && previewUrl === undefined);
  const statusVisible = uploading || feedback !== undefined;
  const describedBy = [
    descriptionId,
    guidanceId,
    requirementsId,
    ...(statusVisible ? [statusId] : []),
  ].join(' ');
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.item(0);
    if (file === null || file === undefined) return;
    onSelect?.(file);
    event.currentTarget.value = '';
  };
  return (
    <section className="admin-media-picker" aria-labelledby={titleId} aria-busy={uploading} data-picker-state={uploading ? 'uploading' : disabled ? 'disabled' : fileName ? 'filled' : 'empty'}>
      <div className="admin-media-preview">
        {previewAvailable ? <img src={previewUrl} alt={altText ?? ''} width="640" height="480" onError={() => setFailedPreviewUrl(previewUrl)} /> : <span><Icon name="image" /><strong>{previewUnavailable ? (labels.previewUnavailable ?? '圖片無法預覽') : labels.empty}</strong></span>}
      </div>
      <div className="admin-media-copy">
        <div><h3 id={titleId} lang={labelLang}>{label}</h3><p id={descriptionId} lang={descriptionLang} data-media-slot-context={descriptionLang === undefined ? undefined : true}>{description}</p></div>
        {fileName ? <p className="mono admin-break">{fileName}</p> : null}
        <p id={guidanceId} className="admin-field-message">{labels.guidance}</p>
        <p id={requirementsId} className="admin-field-message mono">{labels.requirements ?? 'JPEG / PNG / WebP · 10 MiB max'}</p>
        {uploading ? <span id={statusId} className="admin-media-feedback" data-media-state="uploading" role="status"><Icon name="refresh" /><span>{labels.uploading}{progress === undefined ? null : <><progress max={progress.total} value={progress.loaded} />{` ${progress.total === 0 ? 0 : Math.round((progress.loaded / progress.total) * 100)}% · ${formatBytes(progress.loaded)} / ${formatBytes(progress.total)}`}</>}</span></span> : null}
        {!uploading && feedback ? <span id={statusId} className="admin-media-feedback" data-media-state={feedback.status} role={feedback.status === 'error' ? 'alert' : 'status'}><Icon name={feedback.status === 'success' ? 'check' : 'alert'} />{feedback.message}</span> : null}
        <div className="admin-cluster">
          <label className="admin-button admin-media-action" data-variant="secondary" aria-disabled={disabled || uploading} htmlFor={inputId}>
            <Icon name="upload" /><span>{fileName ? labels.replace : labels.choose}</span>
            <input id={inputId} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby={describedBy} disabled={disabled || uploading} onChange={handleChange} />
          </label>
          {fileName && onRemove ? <AdminButton ref={removeTriggerRef} variant="warning" icon="trash" disabled={disabled || uploading} onClick={onRemove}>{labels.remove}</AdminButton> : null}
        </div>
      </div>
    </section>
  );
}
