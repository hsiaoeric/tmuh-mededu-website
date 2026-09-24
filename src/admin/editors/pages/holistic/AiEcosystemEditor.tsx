import type { StructuredEditorCommitResult } from '@/admin/editors/shared';
import { insertPaired, movePaired, removePaired, updatePaired, type PairedCollectionResult, type PairedRows } from '@/admin/editors/global/pairedCollections';
import { EditorCollection } from '@/admin/editors/global/ui/EditorCollection';
import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { holisticCollectionCopy } from './collectionCopy';
import { PairedColorField, PairedTextField } from './fieldPrimitives';
import type { FlowRow, HolisticEditorProps } from './types';

const FLOW_COPY = holisticCollectionCopy({ item: '流程節點', empty: '流程節點', paired: '流程節點' });
const PROBLEM_COPY = holisticCollectionCopy({ item: '問題', empty: '問題', paired: '問題' });
const NEW_FLOW: PairedRows<FlowRow> = {
  zh: { color: '#4f8c7d', role: '', text: '', title: '' },
  en: { color: '#4f8c7d', role: '', text: '', title: '' },
};
const NEW_PROBLEM: PairedRows<string> = { zh: '', en: '' };

export function HolisticAiEcosystemEditor({ payload, issues, onChange }: HolisticEditorProps) {
  const flow = { zh: payload.zh.aiEcosystem.flow, en: payload.en.aiEcosystem.flow };
  const problems = { zh: payload.zh.aiEcosystem.problems, en: payload.en.aiEcosystem.problems };
  const commitFlow = (result: PairedCollectionResult<FlowRow>): StructuredEditorCommitResult => result.ok
    ? onChange({
        zh: { ...payload.zh, aiEcosystem: { ...payload.zh.aiEcosystem, flow: result.collection.zh } },
        en: { ...payload.en, aiEcosystem: { ...payload.en.aiEcosystem, flow: result.collection.en } },
      })
    : { status: 'unchanged' };
  const commitProblems = (result: PairedCollectionResult<string>): StructuredEditorCommitResult => result.ok
    ? onChange({
        zh: { ...payload.zh, aiEcosystem: { ...payload.zh.aiEcosystem, problems: result.collection.zh } },
        en: { ...payload.en, aiEcosystem: { ...payload.en.aiEcosystem, problems: result.collection.en } },
      })
    : { status: 'unchanged' };
  const scalar = (field: 'title' | 'teamLabel' | 'body' | 'problemsTitle', copy: { readonly label: string; readonly zh: string; readonly en: string }, multiline = false) => (
    <PairedTextField multiline={multiline} copy={copy} paths={{ zh: ['zh', 'aiEcosystem', field], en: ['en', 'aiEcosystem', field] }} values={{ zh: payload.zh.aiEcosystem[field], en: payload.en.aiEcosystem[field] }} issues={issues} onChange={{ zh: (value) => onChange({ ...payload, zh: { ...payload.zh, aiEcosystem: { ...payload.zh.aiEcosystem, [field]: value } } }), en: (value) => onChange({ ...payload, en: { ...payload.en, aiEcosystem: { ...payload.en.aiEcosystem, [field]: value } } }) }} />
  );
  return (
    <EditorSection id="holistic-ai-editor" title="AI 教學生態系" description="維護生態系說明、流程節點與要解決的問題；所有清單都保留作者順序。">
      <div className="admin-stack">
        {scalar('title', { label: '生態系標題', zh: '生態系標題（繁體中文）', en: 'Ecosystem title (English)' })}
        {scalar('teamLabel', { label: '團隊標籤', zh: '團隊標籤（繁體中文）', en: 'Team label (English)' })}
        {scalar('body', { label: '生態系說明', zh: '生態系說明（繁體中文）', en: 'Ecosystem description (English)' }, true)}
        {scalar('problemsTitle', { label: '問題區標題', zh: '問題區標題（繁體中文）', en: 'Problems title (English)' })}
        <EditorCollection id="holistic-ai-flow" title="流程節點" itemCount={flow.zh.length} revisionKeys={[flow.zh, flow.en]} copy={FLOW_COPY} onAdd={() => commitFlow(insertPaired(flow, { index: flow.zh.length, rows: NEW_FLOW }))} onMove={(fromIndex, toIndex) => commitFlow(movePaired(flow, { fromIndex, toIndex }))} onRemove={(index) => commitFlow(removePaired(flow, { index }))} renderItem={(index) => {
          const zh = flow.zh[index];
          const en = flow.en[index];
          if (zh === undefined || en === undefined) return null;
          const update = (rows: PairedRows<FlowRow>) => commitFlow(updatePaired(flow, { index, rows }));
          const paths = (field: keyof FlowRow) => ({ zh: ['zh', 'aiEcosystem', 'flow', index, field], en: ['en', 'aiEcosystem', 'flow', index, field] });
          return <div className="admin-stack">
            <PairedTextField copy={{ label: '節點角色', zh: '節點角色（繁體中文）', en: 'Node role (English)' }} paths={paths('role')} values={{ zh: zh.role, en: en.role }} issues={issues} onChange={{ zh: (role) => update({ zh: { ...zh, role }, en }), en: (role) => update({ zh, en: { ...en, role } }) }} />
            <PairedTextField copy={{ label: '節點標題', zh: '節點標題（繁體中文）', en: 'Node title (English)' }} paths={paths('title')} values={{ zh: zh.title, en: en.title }} issues={issues} onChange={{ zh: (title) => update({ zh: { ...zh, title }, en }), en: (title) => update({ zh, en: { ...en, title } }) }} />
            <PairedTextField multiline copy={{ label: '節點說明', zh: '節點說明（繁體中文）', en: 'Node text (English)' }} paths={paths('text')} values={{ zh: zh.text, en: en.text }} issues={issues} onChange={{ zh: (text) => update({ zh: { ...zh, text }, en }), en: (text) => update({ zh, en: { ...en, text } }) }} />
            <PairedColorField copy={{ label: '節點色碼', zh: '節點色碼（繁體中文）', en: 'Node color (English)' }} paths={paths('color')} values={{ zh: zh.color, en: en.color }} issues={issues} onChange={{ zh: (color) => update({ zh: { ...zh, color }, en }), en: (color) => update({ zh, en: { ...en, color } }) }} />
          </div>;
        }} />
        <EditorCollection id="holistic-ai-problems" title="問題列表" itemCount={problems.zh.length} revisionKeys={[problems.zh, problems.en]} copy={PROBLEM_COPY} onAdd={() => commitProblems(insertPaired(problems, { index: problems.zh.length, rows: NEW_PROBLEM }))} onMove={(fromIndex, toIndex) => commitProblems(movePaired(problems, { fromIndex, toIndex }))} onRemove={(index) => commitProblems(removePaired(problems, { index }))} renderItem={(index) => {
          const zh = problems.zh[index];
          const en = problems.en[index];
          if (zh === undefined || en === undefined) return null;
          return <PairedTextField multiline copy={{ label: `問題 ${index + 1}`, zh: '問題（繁體中文）', en: 'Problem (English)' }} paths={{ zh: ['zh', 'aiEcosystem', 'problems', index], en: ['en', 'aiEcosystem', 'problems', index] }} values={{ zh, en }} issues={issues} onChange={{ zh: (value) => commitProblems(updatePaired(problems, { index, rows: { zh: value, en } })), en: (value) => commitProblems(updatePaired(problems, { index, rows: { zh, en: value } })) }} />;
        }} />
      </div>
    </EditorSection>
  );
}
