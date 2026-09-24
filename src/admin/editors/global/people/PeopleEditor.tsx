import { useSite } from '@/app/site';
import { InlineNotice } from '@/admin/AdminFeedback';
import type {
  StructuredEditorCommit as GlobalEditorCommit,
  StructuredEditorCommitResult as GlobalEditorCommitResult,
  StructuredEditorIssueSummary as GlobalEditorIssueSummary,
} from '@/admin/editors/shared';
import { EditorTextField } from '../ui/EditorFields';
import { EditorCollection } from '../ui/EditorCollection';
import { EditorSection } from '../ui/EditorSection';
import { EditorValidation } from '../ui/EditorValidation';
import { PeopleListEditor } from './PeopleListEditor';
import { peopleCollectionCopy } from './peopleEditorCopy';
import {
  addCenterGroup,
  changeCenterPeople,
  changeMemberGroupPeople,
  changePeopleList,
  moveCenterGroup,
  peopleFeedback,
  removeCenterGroup,
  updateCenterId,
  type PeopleListKey,
  type PeoplePayload,
} from './peopleEditorModel';

export type PeopleEditorProps = {
  readonly payload: PeoplePayload;
  readonly issues: readonly GlobalEditorIssueSummary[];
  readonly onChange: GlobalEditorCommit<PeoplePayload>;
};

const HOLISTIC_LISTS = [
  { key: 'holisticInstructors', id: 'holistic-instructors', zh: '全人照護指導員', en: 'Holistic care instructors' },
  { key: 'holisticSeedTeachers', id: 'holistic-seed-teachers', zh: '全人照護種子教師', en: 'Holistic care seed teachers' },
  { key: 'holisticAiTeam', id: 'holistic-ai-team', zh: '全人照護 AI 團隊', en: 'Holistic care AI team' },
] as const satisfies readonly { readonly key: PeopleListKey; readonly id: string; readonly zh: string; readonly en: string }[];

const MEMBER_GROUP_LABELS = [
  { zh: '教學部顧問', en: 'Department advisors' },
  { zh: '教學型主治', en: 'Teaching attendings' },
  { zh: '教學型醫事人員', en: 'Teaching allied health' },
] as const;

export function PeopleEditor({ payload, issues, onChange }: PeopleEditorProps) {
  const { isZh } = useSite();
  const feedback = peopleFeedback(payload);
  const accept = (next: PeoplePayload | null): GlobalEditorCommitResult => {
    if (next === null) return { status: 'unchanged' };
    return onChange(next);
  };
  return (
    <div className="admin-stack">
      <EditorValidation issues={issues} title={isZh ? '人員內容需要修正' : 'People content needs attention'} firstInvalidLabel={isZh ? '前往第一個問題' : 'Go to first issue'} />
      {feedback.length === 0 ? null : (
        <InlineNotice status="warning" title={isZh ? '中英文配對需要修正' : 'Bilingual pairing needs attention'}>
          <span className="admin-editor-validation-list">
            {feedback.map((message) => <span key={message}>{message}</span>)}
          </span>
        </InlineNotice>
      )}
      <EditorSection
        id="people-center-directory"
        title={isZh ? '中心與行政團隊' : 'Centers and administration'}
        description={isZh ? '中心群組與群組內人員皆依位置同步維護中英文資料。' : 'Center groups and their people stay positionally paired across both locales.'}
      >
        <EditorCollection
          id="people-center-groups"
          title={isZh ? '中心群組' : 'Center groups'}
          description={isZh ? '中心識別碼由中英文共用。' : 'The center identifier is shared by both locales.'}
          itemCount={Math.min(payload.zh.centerPeople.length, payload.en.centerPeople.length)}
          revisionKeys={[payload.zh.centerPeople, payload.en.centerPeople]}
          copy={peopleCollectionCopy(isZh, 'group')}
          onAdd={() => accept(addCenterGroup(payload))}
          onMove={(fromIndex, toIndex) => accept(moveCenterGroup(payload, fromIndex, toIndex))}
          onRemove={(index) => accept(removeCenterGroup(payload, index))}
          renderItem={(groupIndex) => {
            const zh = payload.zh.centerPeople[groupIndex];
            const en = payload.en.centerPeople[groupIndex];
            if (zh === undefined || en === undefined) return null;
            return (
              <>
                <EditorTextField label={isZh ? '中心識別碼（中英文共用）' : 'Center ID (shared)'} value={zh.centerId} path={['zh', 'centerPeople', groupIndex, 'centerId']} issues={issues} onChange={(event) => accept(updateCenterId(payload, groupIndex, event.currentTarget.value))} />
                <PeopleListEditor
                  id={`center-${groupIndex}-people`}
                  title={isZh ? '群組人員' : 'Group people'}
                  description={isZh ? '刪除只會移除內容列，不會刪除照片檔案。' : 'Deleting removes only payload rows, never portrait files.'}
                  people={{ zh: zh.people, en: en.people }}
                  zhPath={['zh', 'centerPeople', groupIndex, 'people']}
                  enPath={['en', 'centerPeople', groupIndex, 'people']}
                  issues={issues}
                  isZh={isZh}
                  onChange={(change) => accept(changeCenterPeople(payload, groupIndex, change))}
                />
              </>
            );
          }}
        />
      </EditorSection>
      <EditorSection
        id="people-glance-groups"
        title={isZh ? '教學部一覽成員' : 'Department Glance members'}
        description={isZh ? '三個固定群組與 KPI 識別碼連動；可調整群組內人員。' : 'Three fixed groups join canonical KPI IDs; people within each group remain editable.'}
      >
        {payload.zh.memberGroups.map((zh, groupIndex) => {
          const en = payload.en.memberGroups[groupIndex];
          const label = MEMBER_GROUP_LABELS[groupIndex];
          if (en === undefined || label === undefined) return null;
          return (
            <div className="admin-stack" key={zh.id}>
              <EditorTextField label={isZh ? '固定識別碼' : 'Stable ID'} value={zh.id} path={['zh', 'memberGroups', groupIndex, 'id']} issues={issues} readOnly />
              <PeopleListEditor
                id={`glance-${zh.id}`}
                title={isZh ? label.zh : label.en}
                description={isZh ? '人員順序會直接套用於首頁展開面板。' : 'Person order is used directly by the public expansion panel.'}
                people={{ zh: zh.people, en: en.people }}
                zhPath={['zh', 'memberGroups', groupIndex, 'people']}
                enPath={['en', 'memberGroups', groupIndex, 'people']}
                issues={issues}
                isZh={isZh}
                onChange={(change) => accept(changeMemberGroupPeople(payload, groupIndex, change))}
              />
            </div>
          );
        })}
      </EditorSection>
      <EditorSection
        id="people-holistic-lists"
        title={isZh ? '全人照護人員名單' : 'Holistic care people lists'}
        description={isZh ? '三份名單各自維持中英文位置配對。' : 'Each of the three lists keeps Chinese and English rows positionally paired.'}
      >
        {HOLISTIC_LISTS.map((list) => (
          <PeopleListEditor
            key={list.key}
            id={list.id}
            title={isZh ? list.zh : list.en}
            description={isZh ? '繁體中文在前，英文在後。' : 'Traditional Chinese appears before English.'}
            people={{ zh: payload.zh[list.key], en: payload.en[list.key] }}
            zhPath={['zh', list.key]}
            enPath={['en', list.key]}
            issues={issues}
            isZh={isZh}
            onChange={(change) => accept(changePeopleList(payload, list.key, change))}
          />
        ))}
      </EditorSection>
    </div>
  );
}
