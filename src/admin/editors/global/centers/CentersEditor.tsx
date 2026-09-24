import { StatePanel } from '@/admin/AdminFeedback';
import { fieldIdForStructuredEditorIssuePath as fieldIdForIssuePath } from '@/admin/editors/shared';
import { EditorCollection } from '../ui/EditorCollection';
import { EditorSection } from '../ui/EditorSection';
import { EditorValidation } from '../ui/EditorValidation';
import { CenterItem } from './CenterItem';
import { CENTER_COLLECTION_COPY } from './copy';
import { addCenter, removeCenter } from './operations';
import type { CentersEditorProps } from './types';

export function CentersEditor({ payload, issues, onChange }: CentersEditorProps) {
  const itemCount = Math.max(payload.zh.centers.length, payload.en.centers.length);
  const add = () => {
    const next = addCenter(payload);
    return next === payload ? { status: 'unchanged' } as const : onChange(next);
  };
  const remove = (index: number) => {
    const next = removeCenter(payload, { index });
    return next === payload ? { status: 'unchanged' } as const : onChange(next);
  };
  return (
    <EditorSection
      id="centers-editor"
      title="中心與分支"
      description="同步維護繁體中文與英文中心資料；結構操作會成對套用。"
    >
      <EditorValidation issues={issues} title="中心資料需要修正" firstInvalidLabel="移至第一個錯誤" />
      <div id={fieldIdForIssuePath(['en', 'centers'])} tabIndex={-1}>
        <EditorCollection
          id="centers"
          title="中心清單"
          description="識別碼屬於內容，不會另存編輯器專用鍵值。"
          itemCount={itemCount}
          revisionKeys={[payload.zh.centers, payload.en.centers]}
          copy={CENTER_COLLECTION_COPY}
          onAdd={add}
          onRemove={remove}
          renderItem={(index) => {
            const zhCenter = payload.zh.centers[index];
            const enCenter = payload.en.centers[index];
            if (zhCenter === undefined || enCenter === undefined) {
              return (
                <StatePanel
                  kind="error"
                  title="中英文中心資料未配對"
                  description="此位置只有一種語言的中心資料。請先修正中英文識別碼與順序，再進行結構操作。"
                />
              );
            }
            return (
              <CenterItem
                index={index}
                zh={zhCenter}
                en={enCenter}
                payload={payload}
                issues={issues}
                onChange={onChange}
              />
            );
          }}
        />
      </div>
    </EditorSection>
  );
}
