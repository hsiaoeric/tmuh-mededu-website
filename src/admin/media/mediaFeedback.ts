import { assertNever } from '@/admin/documents/assertNever';
import type { DraftMediaFailure } from './types';

export type DraftMediaOperation = 'upload' | 'preview' | 'cleanup';
export type MediaFeedbackLanguage = 'zh' | 'en';

type InvalidFileFailure = Extract<DraftMediaFailure, { readonly kind: 'invalid-file' }>;
type LocalizedCopy = Readonly<Record<MediaFeedbackLanguage, string>>;
type OperationCopy = Readonly<Record<DraftMediaOperation, LocalizedCopy>>;

const INVALID_FILE_COPY = {
  empty: {
    zh: '選取的圖片是空白檔案。請選擇含有內容的 JPEG、PNG 或 WebP。',
    en: 'The selected image is empty. Choose a JPEG, PNG, or WebP file with content.',
  },
  'too-large': {
    zh: '圖片超過 10 MiB。請壓縮圖片或選擇較小的檔案。',
    en: 'The image exceeds 10 MiB. Compress it or choose a smaller file.',
  },
  'unsupported-type': {
    zh: '不支援此檔案格式。請選擇 JPEG、PNG 或 WebP。',
    en: 'This file type is unsupported. Choose a JPEG, PNG, or WebP image.',
  },
} as const satisfies Readonly<Record<InvalidFileFailure['reason'], LocalizedCopy>>;

const AUTHENTICATION_COPY = {
  upload: { zh: '登入狀態已失效。請重新登入後再上傳照片。', en: 'Your session has expired. Sign in again, then upload the portrait.' },
  preview: { zh: '登入狀態已失效。請重新登入後再建立照片預覽。', en: 'Your session has expired. Sign in again, then prepare the portrait preview.' },
  cleanup: { zh: '登入狀態已失效。請重新登入後再刪除檔案。', en: 'Your session has expired. Sign in again, then delete the file.' },
} as const satisfies OperationCopy;

const OWNER_COPY = {
  upload: { zh: '此上傳不屬於目前帳號。請重新登入後再試。', en: 'This upload does not belong to the current account. Sign in again and retry.' },
  preview: { zh: '目前帳號無法預覽這張照片。請重新登入後再試。', en: 'The current account cannot preview this portrait. Sign in again and retry.' },
  cleanup: { zh: '目前帳號無法刪除這個檔案。請確認帳號後再試。', en: 'The current account cannot delete this file. Check the account and retry.' },
} as const satisfies OperationCopy;

const REFERENCED_COPY = {
  upload: { zh: '照片仍被內容引用。請重新整理內容後再試。', en: 'The portrait is still referenced. Refresh the content and try again.' },
  preview: { zh: '照片連結已變更。請重新整理後再建立預覽。', en: 'The portrait link changed. Refresh before preparing another preview.' },
  cleanup: { zh: '檔案仍被內容引用，無法刪除。請先移除連結後再試。', en: 'The file is still referenced and cannot be deleted. Unlink it, then retry.' },
} as const satisfies OperationCopy;

const STORAGE_COPY = {
  upload: { zh: 'Storage 無法儲存照片。請稍後再試。', en: 'Storage could not save the portrait. Try again later.' },
  preview: { zh: 'Storage 無法建立照片預覽。照片連結未變更，請稍後再試。', en: 'Storage could not prepare the portrait preview. The link is unchanged; try again later.' },
  cleanup: { zh: 'Storage 無法刪除檔案。檔案仍保留，請再試一次。', en: 'Storage could not delete the file. It remains available; try again.' },
} as const satisfies OperationCopy;

const TRANSPORT_COPY = {
  upload: { zh: '照片上傳連線中斷。請確認網路後再試。', en: 'The portrait upload was interrupted. Check the connection and try again.' },
  preview: { zh: '無法建立照片預覽。請確認網路後再試。', en: 'The portrait preview could not be prepared. Check the connection and try again.' },
  cleanup: { zh: '刪除檔案時連線中斷。檔案仍保留，請再試一次。', en: 'The connection was interrupted while deleting. The file remains available; try again.' },
} as const satisfies OperationCopy;

const RESPONSE_COPY = {
  upload: { zh: '上傳服務回傳無法辨識的資料。請重新整理後再試。', en: 'The upload service returned an unreadable response. Refresh and try again.' },
  preview: { zh: '預覽服務回傳無法辨識的資料。請重新整理後再試。', en: 'The preview service returned an unreadable response. Refresh and try again.' },
  cleanup: { zh: '刪除服務回傳無法辨識的資料。檔案可能仍保留，請重新整理後再試。', en: 'The delete service returned an unreadable response. The file may remain; refresh and retry.' },
} as const satisfies OperationCopy;

export function draftMediaFailureMessage(
  failure: DraftMediaFailure,
  operation: DraftMediaOperation,
  language: MediaFeedbackLanguage,
): string | null {
  switch (failure.kind) {
    case 'invalid-file':
      return INVALID_FILE_COPY[failure.reason][language];
    case 'authentication-required':
      return AUTHENTICATION_COPY[operation][language];
    case 'owner-mismatch':
      return OWNER_COPY[operation][language];
    case 'still-referenced':
      return REFERENCED_COPY[operation][language];
    case 'storage-failure':
      return STORAGE_COPY[operation][language];
    case 'transport-error':
      return TRANSPORT_COPY[operation][language];
    case 'malformed-response':
      return RESPONSE_COPY[operation][language];
    case 'aborted':
      return null;
    default:
      return assertNever(failure, 'draft media failure');
  }
}
