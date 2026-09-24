import type { EditableCmsPayloadByKind } from '@/content/contracts/registry';
import type {
  StructuredEditorCommit as GlobalEditorCommit,
  StructuredEditorIssueSummary as GlobalEditorIssueSummary,
} from '@/admin/editors/shared';
import { EditorSection } from '../ui/EditorSection';
import { updatePaired, type PairedRows } from '../pairedCollections';
import { KpiPairFields } from './KpiPairFields';

type KpisPayload = EditableCmsPayloadByKind['kpis'];
type KpiRow = KpisPayload['zh']['items'][number];

export type KpisEditorProps = {
  readonly payload: KpisPayload;
  readonly issues: readonly GlobalEditorIssueSummary[];
  readonly onChange: GlobalEditorCommit<KpisPayload>;
};

export function KpisEditor({ payload, issues, onChange }: KpisEditorProps) {
  const collection = { zh: payload.zh.items, en: payload.en.items };
  const commit = (index: number, rows: PairedRows<KpiRow>) => {
    const result = updatePaired(collection, { index, rows });
    if (!result.ok) return { status: 'unchanged' };
    return onChange({
      zh: { ...payload.zh, items: result.collection.zh },
      en: { ...payload.en, items: result.collection.en },
    });
  };

  return (
    <EditorSection
      id="kpis-editor"
      title="首頁關鍵數據"
      description="四個固定識別碼依顯示順序維護；可編輯雙語數值、標籤與展開面板文字。"
    >
      <ol className="admin-editor-collection-list" data-editor-collection="kpis">
        {collection.zh.map((zh, index) => {
          const en = collection.en[index];
          if (zh === undefined || en === undefined) return null;
          return (
            <li key={zh.id} className="admin-editor-collection-item" data-editor-item-index={index}>
              <div className="admin-editor-collection-item-header"><h4>KPI {index + 1}</h4></div>
              <div className="admin-editor-collection-item-content">
                <KpiPairFields index={index} rows={{ zh, en }} issues={issues} onChange={(rows) => commit(index, rows)} />
              </div>
            </li>
          );
        })}
      </ol>
    </EditorSection>
  );
}
