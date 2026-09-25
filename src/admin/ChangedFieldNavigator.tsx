import { useSite } from '@/app/site';
import { AdminIconButton } from './AdminButton';
import { jumpToEditorElement } from './editorOutline';

const CONTROL = 'input:not([type="hidden"]), textarea, select';

function changedFields(): HTMLElement[] {
  const editor = document.querySelector('.admin-workspace-editor');
  return editor === null ? [] : [...editor.querySelectorAll<HTMLElement>('.admin-field[data-changed]')];
}

/** Index of the changed field to go to next (or previous) from the focused field or the scroll position. */
function targetIndex(fields: readonly HTMLElement[], direction: 1 | -1): number {
  const focused = fields.findIndex((field) => field.contains(document.activeElement));
  if (focused >= 0) return (focused + direction + fields.length) % fields.length;
  const main = document.querySelector('.admin-main');
  const bar = main?.querySelector('.admin-action-bar');
  const line = (main?.getBoundingClientRect().top ?? 0) + (bar?.getBoundingClientRect().height ?? 0) + 24;
  // Hidden fields in collapsed items measure at their item, so compare against the nearest shown box.
  const top = (field: HTMLElement) => {
    const shown = field.closest('[hidden]')?.closest<HTMLElement>('.admin-editor-collection-item') ?? field;
    return shown.getBoundingClientRect().top;
  };
  if (direction === 1) {
    const next = fields.findIndex((field) => top(field) > line + 1);
    return next < 0 ? 0 : next;
  }
  for (let index = fields.length - 1; index >= 0; index -= 1) if (top(fields[index]!) < line - 1) return index;
  return fields.length - 1;
}

/** Steps through the fields that differ from the published revision, in document order. */
export function ChangedFieldNavigator({ count }: { readonly count: number }) {
  const { isZh } = useSite();
  if (count === 0) return null;
  const go = (direction: 1 | -1) => {
    const fields = changedFields();
    if (fields.length === 0) return;
    const field = fields[targetIndex(fields, direction)]!;
    jumpToEditorElement(field.querySelector<HTMLElement>(CONTROL) ?? field);
  };
  return (
    <div className="admin-changed-nav" role="group" aria-label={isZh ? '與已發布版本的差異' : 'Differences from the published version'}>
      <span className="admin-changed-dot" aria-hidden="true" />
      <span className="admin-changed-nav-count">{isZh ? `${count} 處變更` : `${count} change${count === 1 ? '' : 's'}`}</span>
      <AdminIconButton icon="arrowDown" className="admin-changed-nav-prev" label={isZh ? '上一個變更' : 'Previous change'} onClick={() => go(-1)} />
      <AdminIconButton icon="arrowDown" label={isZh ? '下一個變更' : 'Next change'} onClick={() => go(1)} />
    </div>
  );
}
