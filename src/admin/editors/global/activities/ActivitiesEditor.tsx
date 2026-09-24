import type {
  StructuredEditorCommit as GlobalEditorCommit,
  StructuredEditorCommitResult as GlobalEditorCommitResult,
} from '@/admin/editors/shared';
import {
  insertPaired,
  movePaired,
  nextCollectionId,
  removePaired,
  updatePaired,
  type PairedCollectionResult,
} from '../pairedCollections';
import { EditorCollection } from '../ui/EditorCollection';
import { EditorSection } from '../ui/EditorSection';
import { EditorValidation } from '../ui/EditorValidation';
import { ActivityFields } from './ActivityFields';
import { ACTIVITY_SCOPE_COPY } from './activityCopy';
import type {
  ActivitiesPayload,
  Activity,
  ActivityScope,
} from './activityTypes';
import { validateActivities } from './activityValidation';

const EMPTY_ACTIVITY: Activity = {
  id: '',
  sortDate: '1970-01-01',
  cat: '',
  date: '',
  enrolled: '',
  link: '',
  place: '',
  speaker: '',
  status: '',
  title: '',
  topic: '',
};

const SCOPES: readonly ActivityScope[] = ['department', 'holistic'];

export type ActivitiesEditorProps = {
  readonly payload: ActivitiesPayload;
  readonly onPayloadChange: GlobalEditorCommit<ActivitiesPayload>;
};

export function ActivitiesEditor({ payload, onPayloadChange }: ActivitiesEditorProps) {
  const issues = validateActivities(payload);

  const commitCollection = (
    scope: ActivityScope,
    result: PairedCollectionResult<Activity>,
  ): GlobalEditorCommitResult => {
    if (!result.ok) return { status: 'unchanged' };
    return onPayloadChange({
      zh: { ...payload.zh, [scope]: result.collection.zh },
      en: { ...payload.en, [scope]: result.collection.en },
    });
  };

  return (
    <EditorSection
      id="activities-editor"
      title="活動管理"
      description="依公開網站顯示順序，成對維護繁體中文與英文活動內容。日期、時間與連結會保留輸入原文。"
    >
      <EditorValidation
        issues={issues}
        title="部分活動內容需要修正"
        firstInvalidLabel="前往第一個問題"
      />
      {SCOPES.map((scope) => {
        const copy = ACTIVITY_SCOPE_COPY[scope];
        const collection = { zh: payload.zh[scope], en: payload.en[scope] };
        return (
          <EditorCollection
            key={scope}
            id={`activities-${scope}`}
            title={copy.title}
            description={copy.description}
            itemCount={collection.zh.length}
            revisionKeys={[collection.zh, collection.en]}
            copy={copy.collection}
            onAdd={() => {
              const id = nextCollectionId('new-activity', [
                ...payload.zh.department.map((row) => row.id),
                ...payload.zh.holistic.map((row) => row.id),
                ...payload.en.department.map((row) => row.id),
                ...payload.en.holistic.map((row) => row.id),
              ]);
              const row = { ...EMPTY_ACTIVITY, id };
              return commitCollection(scope, insertPaired(collection, {
                index: collection.zh.length,
                rows: { zh: row, en: row },
              }));
            }}
            onMove={(fromIndex, toIndex) => commitCollection(
              scope,
              movePaired(collection, { fromIndex, toIndex }),
            )}
            onRemove={(index) => commitCollection(scope, removePaired(collection, { index }))}
            renderItem={(index) => {
              const zh = collection.zh[index];
              const en = collection.en[index];
              if (zh === undefined || en === undefined) return null;
              return (
                <ActivityFields
                  scope={scope}
                  index={index}
                  pairLabel={copy.pairLabel(index + 1)}
                  zh={zh}
                  en={en}
                  issues={issues}
                  onZhChange={(field, value) => commitCollection(scope, updatePaired(collection, {
                    index,
                    rows: { zh: { ...zh, [field]: value }, en },
                  }))}
                  onEnChange={(field, value) => commitCollection(scope, updatePaired(collection, {
                    index,
                    rows: { zh, en: { ...en, [field]: value } },
                  }))}
                  onSharedChange={(field, value) => commitCollection(scope, updatePaired(collection, {
                    index,
                    rows: { zh: { ...zh, [field]: value }, en: { ...en, [field]: value } },
                  }))}
                />
              );
            }}
          />
        );
      })}
    </EditorSection>
  );
}
