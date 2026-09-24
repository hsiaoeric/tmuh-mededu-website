import type { CmsDocumentKind } from '@/content/contracts/kinds';

type WorkspaceTitleSegment = {
  readonly lead: string;
  readonly tail: string;
};

const PAGE_WORKSPACE_TITLE_SEGMENTS: Readonly<Partial<Record<CmsDocumentKind, WorkspaceTitleSegment>>> = {
  digital_materials: { lead: '數位', tail: '教材室' },
  facdev: { lead: '教師', tail: '發展中心' },
  ebm: { lead: '實證', tail: '醫學中心' },
  holistic: { lead: '全人照護', tail: '教育中心' },
  holistic_research: { lead: '全人', tail: '照護研究' },
};

type AdminWorkspaceTitleProps = {
  readonly isZh: boolean;
  readonly kind: CmsDocumentKind;
  readonly label: string;
};

export function AdminWorkspaceTitle({ isZh, kind, label }: AdminWorkspaceTitleProps) {
  if (!isZh) {
    return <><span className="admin-workspace-title-label" lang="en">{label}</span>{' JSON workspace'}</>;
  }

  const segment = PAGE_WORKSPACE_TITLE_SEGMENTS[kind];
  if (segment === undefined) {
    return <><span className="admin-workspace-title-label" lang="zh-Hant">{label}</span>{' JSON 工作區'}</>;
  }

  return (
    <span className="admin-workspace-title-label" lang="zh-Hant" aria-label={`${label} JSON 工作區`}>
      {segment.lead}<wbr /><span className="admin-workspace-title-tail">{segment.tail}</span>{' JSON 工作區'}
    </span>
  );
}
