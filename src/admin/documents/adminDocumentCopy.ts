import type { WorkflowFailure } from './workflowFailure';

export type AdminLocalizedCopy = {
  readonly title: string;
  readonly description: string;
};

const FAILURE_COPY = {
  'active-draft-exists': {
    zh: { title: '已有其他草稿版本', description: '編輯器文字已保留，系統不會自動重新載入。' },
    en: { title: 'Another draft already exists', description: 'Your editor text is preserved and will not reload automatically.' },
  },
  'stale-edit-version': {
    zh: { title: '內容版本已過期', description: '伺服器已有較新的版本。編輯器文字已保留，系統不會自動重新載入。' },
    en: { title: 'Version conflict detected', description: 'A newer server revision exists. Your editor text is preserved and will not reload automatically.' },
  },
  'superseded-revision': {
    zh: { title: '此版本已被取代', description: '伺服器已有更新版本。編輯器文字已保留，請重新載入後確認。' },
    en: { title: 'This revision was superseded', description: 'A newer server revision exists. Your editor text is preserved; reload and review it.' },
  },
  forbidden: {
    zh: { title: '沒有執行此作業的權限', description: '內容文字未變更。請聯絡系統管理員。' },
    en: { title: 'Permission required', description: 'Your text was not changed. Contact an administrator.' },
  },
  'not-found': {
    zh: { title: '找不到此管理文件', description: '文件可能尚未建立，或已由其他管理者移除。' },
    en: { title: 'Admin document not found', description: 'The document may not exist yet or may have been removed.' },
  },
  'invalid-request': {
    zh: { title: '無法執行內容作業', description: '編輯器文字已保留。請確認文件狀態後再試。' },
    en: { title: 'Content operation is not available', description: 'Your editor text is preserved. Check the document state and retry.' },
  },
  'validation-failed': {
    zh: { title: '內容格式不符合文件規格', description: '編輯器文字已保留。請修正 JSON 內容後再試。' },
    en: { title: 'Content does not match the document contract', description: 'Your editor text is preserved. Correct the JSON content and retry.' },
  },
  'schema-unavailable': {
    zh: { title: '內容資料結構尚未就緒', description: '編輯器文字已保留。請聯絡系統管理員。' },
    en: { title: 'Content schema is unavailable', description: 'Your editor text is preserved. Contact an administrator.' },
  },
  'transport-error': {
    zh: { title: '內容服務暫時無法使用', description: '內容文字未變更。請確認連線後再試一次。' },
    en: { title: 'Content service is unavailable', description: 'Your text was not changed. Check the connection and retry.' },
  },
  'malformed-payload': {
    zh: { title: '收到無法辨識的內容資料', description: '編輯器文字已保留。請稍後再試。' },
    en: { title: 'Unrecognized content data received', description: 'Your editor text is preserved. Try again later.' },
  },
  aborted: {
    zh: { title: '內容作業已取消', description: '編輯器文字未變更。' },
    en: { title: 'Content operation was canceled', description: 'Your editor text was not changed.' },
  },
} as const satisfies Readonly<Record<Exclude<WorkflowFailure['kind'], 'publication-error'>, { readonly zh: AdminLocalizedCopy; readonly en: AdminLocalizedCopy }>>;

const PUBLICATION_COPY = {
  authorization: {
    zh: { title: '發佈權限驗證失敗', description: '草稿與編輯器文字均已保留。請重新登入或聯絡系統管理員。' },
    en: { title: 'Publication authorization failed', description: 'The draft and editor text were preserved. Sign in again or contact an administrator.' },
  },
  media: {
    zh: { title: '草稿媒體無法發佈', description: '草稿與編輯器文字均已保留。請檢查圖片參照、擁有者與檔案內容。' },
    en: { title: 'Draft media could not be published', description: 'The draft and editor text were preserved. Check the image reference, owner, and file content.' },
  },
  service: {
    zh: { title: '發佈服務暫時無法完成作業', description: '草稿與編輯器文字均已保留。請稍後再試。' },
    en: { title: 'Publication service could not complete the operation', description: 'The draft and editor text were preserved. Try again later.' },
  },
} as const;

export function getAdminDocumentFailureCopy(failure: WorkflowFailure, isZh: boolean): AdminLocalizedCopy {
  if (failure.kind === 'publication-error') {
    const category = failure.code === 'authentication-required' ||
      failure.code === 'administrator-required' || failure.code === 'origin-denied'
      ? 'authorization'
      : failure.code === 'deadline-exceeded' || failure.code === 'publication-failed' ||
          failure.code === 'storage-failure' || failure.code === 'public-integrity-conflict'
        ? 'service'
        : 'media';
    return PUBLICATION_COPY[category][isZh ? 'zh' : 'en'];
  }
  return FAILURE_COPY[failure.kind][isZh ? 'zh' : 'en'];
}
