import type { CmsDocumentKind } from '@/content/contracts/kinds';
import { CMS_DOCUMENT_METADATA } from './documents/cmsDocumentMetadata';
import { ZhCopy, ZhPhrase } from './AdminText';

export const PAGE_WORKSPACE_DESCRIPTION_PHRASES = {
  digital_materials: ['管理', '數位教材室', '頁面的', '雙語內容。'],
  facdev: ['管理', '教師發展中心', '專頁內容與', '服務資訊。'],
  ebm: ['管理', '實證醫學中心', '專頁內容與', '教學資源。'],
  holistic: ['管理', '全人照護教育中心', '專頁與', '年度內容。'],
  holistic_research: ['管理', '全院全人照護研究', '論文與', '索引資料。'],
} as const satisfies Readonly<Partial<Record<CmsDocumentKind, readonly string[]>>>;

export type PageWorkspaceDescriptionKind = keyof typeof PAGE_WORKSPACE_DESCRIPTION_PHRASES;

export function isPageWorkspaceDescriptionKind(kind: CmsDocumentKind): kind is PageWorkspaceDescriptionKind {
  return kind in PAGE_WORKSPACE_DESCRIPTION_PHRASES;
}

export function AdminWorkspaceDescription({ kind }: { readonly kind: PageWorkspaceDescriptionKind }) {
  const phrases = PAGE_WORKSPACE_DESCRIPTION_PHRASES[kind];
  const canonicalDescription = CMS_DOCUMENT_METADATA[kind].description.zh;
  if (phrases.join('') !== canonicalDescription) {
    throw new TypeError(`Workspace description phrases drifted from CMS_DOCUMENT_METADATA for ${kind}`);
  }

  return <ZhCopy>{phrases.map((phrase) => <ZhPhrase key={phrase}>{phrase}</ZhPhrase>)}</ZhCopy>;
}
