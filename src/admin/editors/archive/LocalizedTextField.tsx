import { useEffect, useRef, useState } from 'react';
import { AdminButton, AdminIconButton } from '@/admin/AdminButton';
import { StatusBadge } from '@/admin/AdminFeedback';
import { AdminField, AdminTextarea, BilingualFieldPair } from '@/admin/AdminFields';
import { fieldIdForStructuredEditorIssuePath } from '@/admin/editors/shared';
import type { EditableLocalizedText } from '@/content/contracts/localized';
import type { ArchiveCommitResult, ArchiveIssues, JsonPath } from './archiveTypes';
import { pairLabels, untranslatedLabel } from './copy';
import { issueFor, requiredText, useIsZh } from './fields';
import { compactOptionalLocalized, setOptionalEnglish, withChinese } from './localizedValue';

type Pair = { readonly zh: string; readonly en: string };

export type LocalizedTextFieldProps = {
  /** JSON path of the `{ zh, en? }` object. */
  readonly path: JsonPath;
  readonly label: Pair | string;
  readonly value: EditableLocalizedText | undefined;
  /** `undefined` removes an optional field whose both sides are empty. */
  readonly onChange: (value: EditableLocalizedText | undefined) => ArchiveCommitResult;
  readonly issues: ArchiveIssues;
  /** Chinese must be filled before publishing. */
  readonly required?: boolean;
  /** The whole field may be absent; clearing it removes it from the payload. */
  readonly optional?: boolean;
  readonly multiline?: boolean;
  readonly description?: string;
  readonly maxLength?: number;
};

/**
 * A Chinese field with an optional English translation. English stays closed until someone adds
 * it, and clearing it deletes the `en` key, because absence is the only way the contract records
 * "not translated yet" (an empty string is rejected at publish). The public site then shows the
 * Chinese text, so the field says so instead of looking like a missing value.
 */
export function LocalizedTextField({ path, label, value, onChange, issues, required = false, optional = false, multiline = false, description, maxLength }: LocalizedTextFieldProps) {
  const isZh = useIsZh();
  const labels = pairLabels(label, isZh);
  const english = value?.en;
  const [englishOpen, setEnglishOpen] = useState(english !== undefined);
  const focusAfterRender = useRef<'english' | 'add' | null>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const englishPath = [...path, 'en'];
  const englishId = fieldIdForStructuredEditorIssuePath(englishPath);
  const showEnglish = englishOpen || english !== undefined;

  // Adding English moves focus into the new field; removing it returns focus to the add button.
  useEffect(() => {
    const target = focusAfterRender.current;
    if (target === null) return;
    focusAfterRender.current = null;
    if (target === 'english') document.getElementById(englishId)?.focus();
    else addButtonRef.current?.focus();
  });

  const commit = (next: EditableLocalizedText) => onChange(optional ? compactOptionalLocalized(next) : next);
  const changeChinese = (zh: string) => commit(withChinese(value, zh));
  const changeEnglish = (en: string) => commit(setOptionalEnglish(value ?? { zh: '' }, en));
  const removeEnglish = () => {
    focusAfterRender.current = 'add';
    setEnglishOpen(false);
    if (english !== undefined) commit(setOptionalEnglish(value ?? { zh: '' }, ''));
  };
  const Control = multiline ? AdminTextarea : AdminField;
  const untranslated = (value?.zh ?? '') !== '' && english === undefined;

  return (
    <div className="admin-localized" data-english={showEnglish ? 'open' : 'closed'} data-untranslated={untranslated || undefined}>
      <BilingualFieldPair
        label={labels.legend}
        description={description}
        zh={(
          <Control
            id={fieldIdForStructuredEditorIssuePath([...path, 'zh'])}
            label={labels.zh}
            required={required}
            requiredText={requiredText(isZh)}
            error={issueFor([...path, 'zh'], issues) ?? issueFor(path, issues)}
            value={value?.zh ?? ''}
            maxLength={maxLength}
            lang="zh-Hant"
            onChange={(event) => { changeChinese(event.currentTarget.value); }}
          />
        )}
        en={showEnglish ? (
          <div className="admin-localized-english">
            <Control
              id={englishId}
              label={labels.en}
              helper={english === undefined ? (isZh ? '留白表示尚未翻譯，網站會顯示中文。' : 'Leave blank while untranslated; the site shows the Chinese.') : undefined}
              error={issueFor(englishPath, issues)}
              value={english ?? ''}
              maxLength={maxLength}
              lang="en"
              onChange={(event) => { changeEnglish(event.currentTarget.value); }}
            />
            <AdminIconButton
              className="admin-localized-remove"
              icon="close"
              label={isZh ? `移除英文：${labels.legend}` : `Remove English: ${labels.legend}`}
              onClick={removeEnglish}
            />
          </div>
        ) : (
          <div className="admin-localized-missing">
            {untranslated ? <StatusBadge status="warning">{untranslatedLabel(isZh)}</StatusBadge> : null}
            <AdminButton
              ref={addButtonRef}
              variant="quiet"
              icon="plus"
              aria-label={isZh ? `加入英文：${labels.legend}` : `Add English: ${labels.legend}`}
              onClick={() => { focusAfterRender.current = 'english'; setEnglishOpen(true); }}
            >
              {isZh ? '加入英文' : 'Add English'}
            </AdminButton>
          </div>
        )}
      />
    </div>
  );
}
