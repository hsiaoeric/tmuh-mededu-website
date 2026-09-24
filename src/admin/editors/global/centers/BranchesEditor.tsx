import { StatePanel } from '@/admin/AdminFeedback';
import {
  fieldIdForStructuredEditorIssuePath as fieldIdForIssuePath,
  type StructuredEditorCommit as GlobalEditorCommit,
  type StructuredEditorCommitResult as GlobalEditorCommitResult,
  type StructuredEditorIssueSummary as GlobalEditorIssueSummary,
} from '@/admin/editors/shared';
import { EditorCollection } from '../ui/EditorCollection';
import { BranchFields } from './BranchFields';
import { BRANCH_COLLECTION_COPY } from './copy';
import { addBranch, removeBranch } from './operations';
import type { CenterRecord, CentersPayload } from './types';

type BranchesEditorProps = {
  readonly centerIndex: number;
  readonly zh: CenterRecord;
  readonly en: CenterRecord;
  readonly payload: CentersPayload;
  readonly issues: readonly GlobalEditorIssueSummary[];
  readonly onChange: GlobalEditorCommit<CentersPayload>;
};

export function BranchesEditor({ centerIndex, zh, en, payload, issues, onChange }: BranchesEditorProps) {
  const itemCount = Math.max(zh.branches.length, en.branches.length);
  const commit = (next: CentersPayload): GlobalEditorCommitResult => {
    if (next === payload) return { status: 'unchanged' };
    return onChange(next);
  };
  return (
    <div
      id={fieldIdForIssuePath(['en', 'centers', centerIndex, 'branches'])}
      tabIndex={-1}
    >
      <EditorCollection
        id={`center-${centerIndex}-branches`}
        title="中心分支"
        description="分支新增與刪除會同步套用至繁體中文與英文；公開頁排序由網站設定管理。"
        itemCount={itemCount}
        revisionKeys={[zh.branches, en.branches]}
        copy={BRANCH_COLLECTION_COPY}
        onAdd={() => commit(addBranch(payload, centerIndex))}
        onRemove={(index) => commit(removeBranch(payload, { centerIndex, index }))}
        renderItem={(index) => {
          const zhBranch = zh.branches[index];
          const enBranch = en.branches[index];
          if (zhBranch === undefined || enBranch === undefined) {
            return (
              <StatePanel
                kind="error"
                title="中英文分支資料未配對"
                description="此位置只有一種語言的分支資料。請先修正中英文識別碼與順序，再進行結構操作。"
              />
            );
          }
          return (
            <BranchFields
              centerIndex={centerIndex}
              index={index}
              zh={zhBranch}
              en={enBranch}
              payload={payload}
              issues={issues}
              onChange={onChange}
            />
          );
        }}
      />
    </div>
  );
}
