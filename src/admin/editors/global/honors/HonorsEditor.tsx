import { StatePanel } from '@/admin/AdminFeedback';
import {
  insertPaired,
  movePaired,
  removePaired,
  updatePaired,
} from '../pairedCollections';
import {
  type StructuredEditorCommitResult as GlobalEditorCommitResult,
  useStructuredEditorModel as useGlobalEditorModel,
} from '@/admin/editors/shared';
import { EditorCollection } from '../ui/EditorCollection';
import { EditorSection } from '../ui/EditorSection';
import { BilingualTextField } from './BilingualTextField';
import { PROJECT_COPY } from './collectionCopy';
import {
  pairedCollection,
  type HonorsLocale,
  type HonorsPayload,
  type LocaleKey,
  type LocalizedText,
  type SnqProject,
} from './honorsTypes';
import { NhqaEditor } from './NhqaEditor';
import { SnqProjectEditor } from './SnqProjectEditor';
import { YearCountsEditor } from './YearCountsEditor';

type TopScalar = {
  readonly [K in keyof HonorsLocale]: HonorsLocale[K] extends string ? K : never;
}[keyof HonorsLocale];

const TOP_FIELDS = [
  { key: 'eyebrow', label: '頁面眉標' },
  { key: 'title', label: '頁面標題' },
  { key: 'desc', label: '頁面說明' },
  { key: 'snqTitle', label: 'SNQ 區塊標題' },
  { key: 'nhqaTitle', label: 'NHQA 區塊標題' },
  { key: 'colUnit', label: '單位欄標題' },
  { key: 'colRole', label: '職稱欄標題' },
  { key: 'colPerson', label: '負責人欄標題' },
  { key: 'renewalLabel', label: '續審標籤' },
  { key: 'nhqaEbmLink', label: 'NHQA 實證連結文案' },
  { key: 'dataSource', label: '資料來源' },
] as const satisfies readonly { readonly key: TopScalar; readonly label: string }[];

const EMPTY_PROJECT: SnqProject = {
  badgeLabel: '',
  certYear: '',
  members: [],
  renewal: '',
  title: '',
};

export type HonorsEditorProps = {
  readonly editorText: string;
  readonly onEditorTextChange: (editorText: string) => void;
};

type TopScalarChange = LocalizedText & {
  readonly field: TopScalar;
};

export function HonorsEditor({ editorText, onEditorTextChange }: HonorsEditorProps) {
  const model = useGlobalEditorModel({ kind: 'honors', editorText, onEditorTextChange });
  if (model.status !== 'valid') {
    return (
      <StatePanel
        kind="error"
        title="無法載入結構化榮譽內容"
        description="請先在 JSON 編輯模式修正內容格式，再返回結構化編輯。"
      />
    );
  }
  const payload = model.payload;
  const projects = { zh: payload.zh.snqProjects, en: payload.en.snqProjects };
  const commit = (nextPayload: HonorsPayload) => model.commitPayload(nextPayload);
  const updateTopScalar = (change: TopScalarChange) => {
    commit({
      ...payload,
      [change.locale]: {
        ...payload[change.locale],
        [change.field]: change.value,
      },
    });
  };
  const commitProjects = (value: typeof projects): GlobalEditorCommitResult => {
    return commit({
      zh: { ...payload.zh, snqProjects: value.zh },
      en: { ...payload.en, snqProjects: value.en },
    });
  };
  const updateProject = (index: number, rows: { readonly zh: SnqProject; readonly en: SnqProject }): GlobalEditorCommitResult => {
    return commitProjects(pairedCollection(updatePaired(projects, { index, rows })));
  };
  const localeValue = (locale: LocaleKey, field: TopScalar): string => payload[locale][field];
  return (
    <div className="admin-editor honors-editor">
      <EditorSection id="honors-overview" title="品質榮譽內容" description="依序維護繁體中文與英文，所有清單操作會同步處理兩個語言版本。">
        {TOP_FIELDS.map((field) => (
          <BilingualTextField
            key={field.key}
            legend={field.label}
            labelPrefix={field.label}
            path={[field.key]}
            zhValue={localeValue('zh', field.key)}
            enValue={localeValue('en', field.key)}
            onChange={(change) => updateTopScalar({ ...change, field: field.key })}
          />
        ))}
      </EditorSection>
      <EditorSection id="honors-snq" title="SNQ 國家品質標章" description="專案、成員與年度統計皆依位置維持雙語配對。">
        <YearCountsEditor
          value={{ zh: payload.zh.snqYearCounts, en: payload.en.snqYearCounts }}
          onChange={(value) => commit({
            zh: { ...payload.zh, snqYearCounts: value.zh },
            en: { ...payload.en, snqYearCounts: value.en },
          })}
        />
        <EditorCollection
          id="snq-projects"
          title="SNQ 專案"
          description="新增、排序或刪除時，繁體中文與英文專案會一起變更。"
          itemCount={projects.zh.length}
          revisionKeys={[projects.zh, projects.en]}
          copy={PROJECT_COPY}
          onAdd={() => commitProjects(pairedCollection(insertPaired(projects, {
            index: projects.zh.length,
            rows: { zh: EMPTY_PROJECT, en: EMPTY_PROJECT },
          })))}
          onMove={(fromIndex, toIndex) => commitProjects(pairedCollection(movePaired(projects, { fromIndex, toIndex })))}
          onRemove={(index) => commitProjects(pairedCollection(removePaired(projects, { index })))}
          renderItem={(index) => (
            <SnqProjectEditor
              projectIndex={index}
              rows={{ zh: projects.zh[index], en: projects.en[index] }}
              onChange={(rows) => updateProject(index, rows)}
            />
          )}
        />
      </EditorSection>
      <NhqaEditor
        zh={payload.zh.nhqa}
        en={payload.en.nhqa}
        onChange={(value) => commit({
          zh: { ...payload.zh, nhqa: value.zh },
          en: { ...payload.en, nhqa: value.en },
        })}
      />
    </div>
  );
}
