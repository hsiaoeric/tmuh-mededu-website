import {
  insertPaired,
  movePaired,
  removePaired,
  updatePaired,
  type PairedCollection,
} from '../pairedCollections';
import { EditorCollection } from '../ui/EditorCollection';
import type { StructuredEditorCommitResult as GlobalEditorCommitResult } from '@/admin/editors/shared';
import { EditorSection } from '../ui/EditorSection';
import { BilingualTextField } from './BilingualTextField';
import { nhqaListCopy } from './collectionCopy';
import { pairedCollection, type LocalizedText, type Nhqa } from './honorsTypes';

type NhqaScalar = Exclude<keyof Nhqa, 'leads' | 'keywords'>;
type NhqaList = 'leads' | 'keywords';

const NHQA_FIELDS = [
  { key: 'year', label: '年度' },
  { key: 'event', label: '活動資訊' },
  { key: 'awardNote', label: '獎項註記' },
  { key: 'group', label: '組別' },
  { key: 'domain', label: '領域' },
  { key: 'project', label: '專案名稱' },
] as const satisfies readonly { readonly key: NhqaScalar; readonly label: string }[];

const NHQA_LISTS = [
  { key: 'leads', label: '負責人' },
  { key: 'keywords', label: '關鍵字' },
] as const satisfies readonly { readonly key: NhqaList; readonly label: '負責人' | '關鍵字' }[];

type NhqaEditorProps = {
  readonly zh: Nhqa;
  readonly en: Nhqa;
  readonly onChange: (value: { readonly zh: Nhqa; readonly en: Nhqa }) => GlobalEditorCommitResult;
};

export function NhqaEditor({ zh, en, onChange }: NhqaEditorProps) {
  const rows = { zh, en };
  const updateScalar = (field: NhqaScalar, change: LocalizedText) => {
    onChange({ ...rows, [change.locale]: { ...rows[change.locale], [field]: change.value } });
  };
  const listValue = (field: NhqaList): PairedCollection<string> => ({ zh: zh[field], en: en[field] });
  const commitList = (field: NhqaList, value: PairedCollection<string>): GlobalEditorCommitResult => {
    return onChange({ zh: { ...zh, [field]: value.zh }, en: { ...en, [field]: value.en } });
  };
  return (
    <EditorSection id="honors-nhqa" title="NHQA 獎項內容" description="維護獎項文字、負責人與關鍵字，繁體中文優先。">
      {NHQA_FIELDS.map((field) => (
        <BilingualTextField
          key={field.key}
          legend={`NHQA ${field.label}`}
          labelPrefix={`NHQA ${field.label}`}
          path={['nhqa', field.key]}
          zhValue={zh[field.key]}
          enValue={en[field.key]}
          onChange={(change) => updateScalar(field.key, change)}
        />
      ))}
      {NHQA_LISTS.map((list) => {
        const value = listValue(list.key);
        return (
          <EditorCollection
            key={list.key}
            id={`nhqa-${list.key}`}
            title={`NHQA ${list.label}`}
            description="繁體中文與英文依相同位置配對。"
            itemCount={value.zh.length}
            revisionKeys={[value.zh, value.en]}
            copy={nhqaListCopy(list.label)}
            onAdd={() => commitList(list.key, pairedCollection(insertPaired(value, {
              index: value.zh.length,
              rows: { zh: '', en: '' },
            })))}
            onMove={(fromIndex, toIndex) => commitList(list.key, pairedCollection(movePaired(value, { fromIndex, toIndex })))}
            onRemove={(index) => commitList(list.key, pairedCollection(removePaired(value, { index })))}
            renderItem={(index) => (
              <BilingualTextField
                legend={`NHQA ${list.label} ${index + 1}`}
                labelPrefix={`NHQA ${list.label} ${index + 1}`}
                path={['nhqa', list.key, index]}
                zhValue={value.zh[index]}
                enValue={value.en[index]}
                onChange={(change) => commitList(list.key, pairedCollection(updatePaired(value, {
                  index,
                  rows: { ...{ zh: value.zh[index], en: value.en[index] }, [change.locale]: change.value },
                })))}
              />
            )}
          />
        );
      })}
    </EditorSection>
  );
}
