import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Icon } from '@/ui/Icon';
import { useFieldDecorations } from './fieldDecorations';
import { FieldLanguageProvider, useFieldLabel, type FieldLabelPresentation } from './fieldLabels';

type FieldFrameProps = {
  readonly id: string;
  readonly label: string;
  readonly helper?: string;
  readonly error?: string;
  readonly status?: 'valid' | 'warning';
  readonly required?: boolean;
  readonly requiredText?: string;
  readonly presentation: FieldLabelPresentation;
  readonly children: ReactNode;
};

function FieldFrame({ id, label, helper, error, status, required, requiredText = '必填', presentation, children }: FieldFrameProps) {
  const messageId = `${id}-${error ? 'error' : 'help'}`;
  const decorations = useFieldDecorations();
  const changed = decorations?.isChanged?.(id) === true;
  return (
    <div className="admin-field" data-field-state={error ? 'error' : status} data-changed={changed || undefined} data-lang={presentation.lang ?? undefined}>
      {/* Inside a bilingual pair the label is for screen readers; the pair's title and a language tag show instead. */}
      <label htmlFor={id} className={presentation.visible === null ? 'admin-field-label sr-only' : 'admin-field-label'}>
        {changed ? <span className="admin-changed-dot" title={decorations?.isZh === false ? 'Changed since publishing' : '與已發布版本不同'}><span className="sr-only">{decorations?.isZh === false ? '(changed) ' : '（已變更）'}</span></span> : null}
        {presentation.visible ?? label}{required ? <span className="admin-required">{requiredText}</span> : null}
      </label>
      {presentation.lang === null ? children : (
        <div className="admin-field-control">
          <span className="admin-field-lang" aria-hidden="true" data-required={required || undefined}>{presentation.lang === 'zh' ? '中' : 'EN'}</span>
          {children}
        </div>
      )}
      {error ? <p id={messageId} className="admin-field-message admin-field-error" role="alert">{error}</p> : helper ? <p id={messageId} className="admin-field-message">{helper}</p> : null}
    </div>
  );
}

type AdminFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  readonly label: string;
  readonly helper?: string;
  readonly error?: string;
  readonly status?: 'valid' | 'warning';
  readonly requiredText?: string;
};

export function AdminField({ label, helper, error, status, requiredText, id: suppliedId, required, readOnly, className = '', 'aria-describedby': externalDescribedBy, ...inputProps }: AdminFieldProps) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  const fieldMessageId = error || helper ? `${id}-${error ? 'error' : 'help'}` : undefined;
  const describedBy = [externalDescribedBy, fieldMessageId].filter(Boolean).join(' ') || undefined;
  const presentation = useFieldLabel(label);
  return (
    <FieldFrame id={id} label={label} helper={helper} error={error} status={status} required={required} requiredText={requiredText} presentation={presentation}>
      <input aria-label={presentation.accessibleName} {...inputProps} id={id} required={required} readOnly={readOnly} aria-invalid={Boolean(error) || undefined} aria-describedby={describedBy} className={`admin-control ${className}`} />
    </FieldFrame>
  );
}

type AdminTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  readonly label: string;
  readonly helper?: string;
  readonly error?: string;
  readonly requiredText?: string;
};

export function AdminTextarea({ label, helper, error, requiredText, id: suppliedId, required, className = '', ...textareaProps }: AdminTextareaProps) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  const describedBy = error || helper ? `${id}-${error ? 'error' : 'help'}` : undefined;
  const presentation = useFieldLabel(label);
  return (
    <FieldFrame id={id} label={label} helper={helper} error={error} required={required} requiredText={requiredText} presentation={presentation}>
      <textarea aria-label={presentation.accessibleName} {...textareaProps} id={id} required={required} aria-invalid={Boolean(error) || undefined} aria-describedby={describedBy} className={`admin-control admin-textarea ${className}`} />
    </FieldFrame>
  );
}

export type AdminSelectOption = { readonly value: string; readonly label: string };
type AdminSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  readonly label: string;
  readonly helper?: string;
  readonly error?: string;
  readonly options: readonly AdminSelectOption[];
  readonly loadingOptions?: boolean;
  readonly loadingLabel?: string;
};

export function AdminSelect({ label, helper, error, options, loadingOptions = false, loadingLabel = '載入選項中', id: suppliedId, className = '', ...selectProps }: AdminSelectProps) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  const describedBy = error || helper ? `${id}-${error ? 'error' : 'help'}` : undefined;
  const presentation = useFieldLabel(label);
  return (
    <FieldFrame id={id} label={label} helper={helper} error={error} required={selectProps.required} presentation={presentation}>
      <select aria-label={presentation.accessibleName} {...selectProps} id={id} disabled={selectProps.disabled || loadingOptions} aria-busy={loadingOptions || undefined} aria-invalid={Boolean(error) || undefined} aria-describedby={describedBy} className={`admin-control admin-select ${className}`}>
        {loadingOptions ? <option>{loadingLabel}</option> : options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </FieldFrame>
  );
}

type AdminCheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  readonly label: ReactNode;
  readonly description?: ReactNode;
  readonly switchControl?: boolean;
};

export function AdminCheckbox({ label, description, switchControl = false, id: suppliedId, className = '', ...inputProps }: AdminCheckboxProps) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  return (
    <label className={`admin-check ${className}`} htmlFor={id} data-switch={switchControl || undefined} data-disabled={inputProps.disabled || undefined}>
      <input {...inputProps} id={id} type="checkbox" role={switchControl ? 'switch' : undefined} />
      <span className="admin-check-mark" aria-hidden="true">{switchControl ? null : <Icon className="admin-check-glyph" name="check" strokeWidth={2.4} />}</span>
      <span><strong>{label}</strong>{description ? <small>{description}</small> : null}</span>
    </label>
  );
}

type BilingualFieldPairProps = {
  readonly label: string;
  readonly description?: ReactNode;
  readonly zh: ReactNode;
  readonly en: ReactNode;
};

export function BilingualFieldPair({ label, description, zh, en }: BilingualFieldPairProps) {
  return (
    <fieldset className="admin-bilingual">
      <legend>{label}</legend>
      {description ? <p className="admin-field-message">{description}</p> : null}
      <div className="admin-bilingual-grid">
        <div lang="zh-Hant"><FieldLanguageProvider lang="zh">{zh}</FieldLanguageProvider></div>
        <div lang="en"><FieldLanguageProvider lang="en">{en}</FieldLanguageProvider></div>
      </div>
    </fieldset>
  );
}
