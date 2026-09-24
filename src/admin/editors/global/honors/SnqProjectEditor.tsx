import {
  insertPaired,
  movePaired,
  removePaired,
  updatePaired,
  type PairedRows,
} from '../pairedCollections';
import { EditorCollection } from '../ui/EditorCollection';
import type { StructuredEditorCommitResult as GlobalEditorCommitResult } from '@/admin/editors/shared';
import { BilingualTextField } from './BilingualTextField';
import { memberCopy } from './collectionCopy';
import {
  pairedCollection,
  type LocalizedText,
  type SnqMember,
  type SnqProject,
} from './honorsTypes';

type ProjectField = 'certYear' | 'badgeLabel' | 'title' | 'renewal';
type MemberField = keyof SnqMember;

const PROJECT_FIELDS = [
  { key: 'certYear', label: '認證年份' },
  { key: 'badgeLabel', label: '標章文字' },
  { key: 'title', label: '專案名稱' },
  { key: 'renewal', label: '續審文字' },
] as const satisfies readonly { readonly key: ProjectField; readonly label: string }[];

const MEMBER_FIELDS = [
  { key: 'unit', label: '單位' },
  { key: 'role', label: '職稱' },
  { key: 'person', label: '姓名' },
] as const satisfies readonly { readonly key: MemberField; readonly label: string }[];

const EMPTY_MEMBER: SnqMember = { unit: '', role: '', person: '' };

type SnqProjectEditorProps = {
  readonly projectIndex: number;
  readonly rows: PairedRows<SnqProject>;
  readonly onChange: (rows: PairedRows<SnqProject>) => GlobalEditorCommitResult;
};

export function SnqProjectEditor({ projectIndex, rows, onChange }: SnqProjectEditorProps) {
  const position = projectIndex + 1;
  const members = { zh: rows.zh.members, en: rows.en.members };
  const updateProject = (field: ProjectField, change: LocalizedText) => {
    onChange({ ...rows, [change.locale]: { ...rows[change.locale], [field]: change.value } });
  };
  const commitMembers = (result: ReturnType<typeof insertPaired<SnqMember>>): GlobalEditorCommitResult => {
    const collection = pairedCollection(result);
    return onChange({
      zh: { ...rows.zh, members: collection.zh },
      en: { ...rows.en, members: collection.en },
    });
  };
  const updateMember = (memberIndex: number, field: MemberField, change: LocalizedText) => {
    const current = members[change.locale][memberIndex];
    commitMembers(updatePaired(members, {
      index: memberIndex,
      rows: {
        ...{ zh: members.zh[memberIndex], en: members.en[memberIndex] },
        [change.locale]: { ...current, [field]: change.value },
      },
    }));
  };
  return (
    <div className="admin-editor-project-fields">
      {PROJECT_FIELDS.map((field) => (
        <BilingualTextField
          key={field.key}
          legend={field.label}
          labelPrefix={`SNQ 專案 ${position} ${field.label}`}
          path={['snqProjects', projectIndex, field.key]}
          zhValue={rows.zh[field.key]}
          enValue={rows.en[field.key]}
          onChange={(change) => updateProject(field.key, change)}
        />
      ))}
      <EditorCollection
        id={`snq-project-${projectIndex}-members`}
        title={`專案 ${position} 成員`}
        description="繁體中文與英文成員依相同位置配對。"
        itemCount={members.zh.length}
        revisionKeys={[members.zh, members.en]}
        copy={memberCopy(position)}
        onAdd={() => commitMembers(insertPaired(members, {
          index: members.zh.length,
          rows: { zh: EMPTY_MEMBER, en: EMPTY_MEMBER },
        }))}
        onMove={(fromIndex, toIndex) => commitMembers(movePaired(members, { fromIndex, toIndex }))}
        onRemove={(index) => commitMembers(removePaired(members, { index }))}
        renderItem={(memberIndex) => (
          <div className="admin-editor-member-fields">
            {MEMBER_FIELDS.map((field) => (
              <BilingualTextField
                key={field.key}
                legend={field.label}
                labelPrefix={`SNQ 專案 ${position} 成員 ${memberIndex + 1} ${field.label}`}
                path={['snqProjects', projectIndex, 'members', memberIndex, field.key]}
                zhValue={members.zh[memberIndex][field.key]}
                enValue={members.en[memberIndex][field.key]}
                onChange={(change) => updateMember(memberIndex, field.key, change)}
              />
            ))}
          </div>
        )}
      />
    </div>
  );
}
