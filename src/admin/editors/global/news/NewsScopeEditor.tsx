import type {
  StructuredEditorCommitResult as GlobalEditorCommitResult,
  StructuredEditorIssueSummary as GlobalEditorIssueSummary,
} from '@/admin/editors/shared';
import { EditorCollection } from '../ui/EditorCollection';
import { EditorSection } from '../ui/EditorSection';
import {
  addAnnouncement,
  moveAnnouncement,
  removeAnnouncement,
} from './newsModel';
import { announcementCopy } from './newsCopy';
import type { NewsMutationResult, NewsPayload, NewsScope } from './newsTypes';
import { NewsAnnouncementFields } from './NewsAnnouncementFields';

type NewsScopeEditorProps = {
  readonly payload: NewsPayload;
  readonly scope: NewsScope;
  readonly issues: readonly GlobalEditorIssueSummary[];
  readonly onChange: (result: NewsMutationResult) => GlobalEditorCommitResult;
};

const SCOPE_COPY = {
  department: {
    title: '教學部公告',
    description: '維護教學部首頁與公告頁資料。置頂與日期不會改變此處的手動順序。',
  },
  holistic: {
    title: '全人照護公告',
    description: '維護全人照護教育中心公告。兩種語言的公告結構會配對增刪與排序。',
  },
} as const;

export function NewsScopeEditor({ payload, scope, issues, onChange }: NewsScopeEditorProps) {
  const copy = SCOPE_COPY[scope];
  const announcements = payload.zh[scope];
  return (
    <EditorSection id={`news-${scope}`} title={copy.title} description={copy.description}>
      <EditorCollection
        id={`${scope}-announcements`}
        title="公告清單"
        description="此處保存手動順序；公開網站可另行依置頂與日期排序。"
        itemCount={announcements.length}
        revisionKeys={[payload.zh[scope], payload.en[scope]]}
        copy={announcementCopy()}
        onAdd={() => onChange(addAnnouncement(payload, scope))}
        onMove={(fromIndex, toIndex) => onChange(moveAnnouncement(payload, scope, fromIndex, toIndex))}
        onRemove={(index) => onChange(removeAnnouncement(payload, scope, index))}
        renderItem={(index) => <NewsAnnouncementFields payload={payload} scope={scope} index={index} issues={issues} onChange={onChange} />}
      />
    </EditorSection>
  );
}
