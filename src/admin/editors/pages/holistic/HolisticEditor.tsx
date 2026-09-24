import { EditorValidation } from '@/admin/editors/global/ui/EditorValidation';
import { HolisticAiEcosystemEditor } from './AiEcosystemEditor';
import { HolisticAlgeeEditor } from './AlgeeEditor';
import { HolisticFeaturesEditor } from './FeaturesEditor';
import { HolisticKpisEditor } from './KpisEditor';
import { HolisticOutcomesEditor } from './OutcomesEditor';
import { HolisticSymposiumsEditor } from './SymposiumsEditor';
import type { HolisticEditorProps } from './types';

export function HolisticEditor(props: HolisticEditorProps) {
  return (
    <div className="admin-stack">
      <EditorValidation issues={props.issues} title="全人照護內容需要修正" firstInvalidLabel="前往第一個問題" />
      <HolisticKpisEditor {...props} />
      <HolisticFeaturesEditor {...props} />
      <HolisticAlgeeEditor {...props} />
      <HolisticAiEcosystemEditor {...props} />
      <HolisticOutcomesEditor {...props} />
      <HolisticSymposiumsEditor {...props} />
    </div>
  );
}
