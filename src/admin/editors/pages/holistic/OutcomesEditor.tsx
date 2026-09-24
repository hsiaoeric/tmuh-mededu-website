import { EditorSection } from '@/admin/editors/global/ui/EditorSection';
import { PairedNumberField, PairedTextField } from './fieldPrimitives';
import type { HolisticEditorProps } from './types';

export function HolisticOutcomesEditor({ payload, issues, onChange }: HolisticEditorProps) {
  const zh = payload.zh.outcomes;
  const en = payload.en.outcomes;
  const text = (field: keyof Pick<typeof zh, 'trainingEyebrow' | 'trainingTitle' | 'trainingDesc'>, label: string, multiline = false) => (
    <PairedTextField multiline={multiline} copy={{ label, zh: `${label}（繁體中文）`, en: `${label} (English)` }} paths={{ zh: ['zh', 'outcomes', field], en: ['en', 'outcomes', field] }} values={{ zh: zh[field], en: en[field] }} issues={issues} onChange={{ zh: (value) => onChange({ ...payload, zh: { ...payload.zh, outcomes: { ...zh, [field]: value } } }), en: (value) => onChange({ ...payload, en: { ...payload.en, outcomes: { ...en, [field]: value } } }) }} />
  );
  const stat = (field: 'trainingParticipants' | 'trainingSessions', label: string) => (
    <div className="admin-stack">
      <PairedTextField copy={{ label: `${label}標籤`, zh: `${label}標籤（繁體中文）`, en: `${label} label (English)` }} paths={{ zh: ['zh', 'outcomes', field, 'label'], en: ['en', 'outcomes', field, 'label'] }} values={{ zh: zh[field].label, en: en[field].label }} issues={issues} onChange={{ zh: (value) => onChange({ ...payload, zh: { ...payload.zh, outcomes: { ...zh, [field]: { ...zh[field], label: value } } } }), en: (value) => onChange({ ...payload, en: { ...payload.en, outcomes: { ...en, [field]: { ...en[field], label: value } } } }) }} />
      <PairedNumberField copy={{ label: `${label}數值`, zh: `${label}數值（繁體中文）`, en: `${label} number (English)` }} paths={{ zh: ['zh', 'outcomes', field, 'num'], en: ['en', 'outcomes', field, 'num'] }} values={{ zh: zh[field].num, en: en[field].num }} issues={issues} onChange={{ zh: (value) => onChange({ ...payload, zh: { ...payload.zh, outcomes: { ...zh, [field]: { ...zh[field], num: value ?? '' } } } }), en: (value) => onChange({ ...payload, en: { ...payload.en, outcomes: { ...en, [field]: { ...en[field], num: value ?? '' } } } }) }} />
    </div>
  );
  return (
    <EditorSection id="holistic-outcomes-editor" title="培訓成果" description="維護師資培訓標題、說明、場次、參與人次與滿意度。">
      <div className="admin-stack">
        {text('trainingEyebrow', '培訓眉標')}
        {text('trainingTitle', '培訓標題')}
        {text('trainingDesc', '培訓說明', true)}
        {stat('trainingParticipants', '參與人次')}
        {stat('trainingSessions', '培訓場次')}
        <PairedTextField copy={{ label: '滿意度標籤', zh: '滿意度標籤（繁體中文）', en: 'Satisfaction label (English)' }} paths={{ zh: ['zh', 'outcomes', 'trainingSatisfaction', 'label'], en: ['en', 'outcomes', 'trainingSatisfaction', 'label'] }} values={{ zh: zh.trainingSatisfaction.label, en: en.trainingSatisfaction.label }} issues={issues} onChange={{ zh: (label) => onChange({ ...payload, zh: { ...payload.zh, outcomes: { ...zh, trainingSatisfaction: { ...zh.trainingSatisfaction, label } } } }), en: (label) => onChange({ ...payload, en: { ...payload.en, outcomes: { ...en, trainingSatisfaction: { ...en.trainingSatisfaction, label } } } }) }} />
        <PairedNumberField copy={{ label: '滿意度數值', zh: '滿意度數值（繁體中文）', en: 'Satisfaction number (English)' }} paths={{ zh: ['zh', 'outcomes', 'trainingSatisfaction', 'num'], en: ['en', 'outcomes', 'trainingSatisfaction', 'num'] }} values={{ zh: zh.trainingSatisfaction.num, en: en.trainingSatisfaction.num }} issues={issues} onChange={{ zh: (num) => onChange({ ...payload, zh: { ...payload.zh, outcomes: { ...zh, trainingSatisfaction: { ...zh.trainingSatisfaction, num: num ?? '' } } } }), en: (num) => onChange({ ...payload, en: { ...payload.en, outcomes: { ...en, trainingSatisfaction: { ...en.trainingSatisfaction, num: num ?? '' } } } }) }} />
        <PairedTextField copy={{ label: '滿意度後綴', zh: '滿意度後綴（繁體中文）', en: 'Satisfaction suffix (English)' }} paths={{ zh: ['zh', 'outcomes', 'trainingSatisfaction', 'suffix'], en: ['en', 'outcomes', 'trainingSatisfaction', 'suffix'] }} values={{ zh: zh.trainingSatisfaction.suffix, en: en.trainingSatisfaction.suffix }} issues={issues} onChange={{ zh: (suffix) => onChange({ ...payload, zh: { ...payload.zh, outcomes: { ...zh, trainingSatisfaction: { ...zh.trainingSatisfaction, suffix } } } }), en: (suffix) => onChange({ ...payload, en: { ...payload.en, outcomes: { ...en, trainingSatisfaction: { ...en.trainingSatisfaction, suffix } } } }) }} />
      </div>
    </EditorSection>
  );
}
