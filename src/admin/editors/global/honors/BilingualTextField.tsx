import type { ChangeEvent } from 'react';
import { EditorBilingualFields, EditorTextField } from '../ui/EditorFields';
import type { LocalizedText } from './honorsTypes';

type BilingualTextFieldProps = {
  readonly legend: string;
  readonly labelPrefix: string;
  readonly path: readonly PropertyKey[];
  readonly zhValue: string;
  readonly enValue: string;
  readonly onChange: (change: LocalizedText) => void;
};

export function BilingualTextField({
  legend,
  labelPrefix,
  path,
  zhValue,
  enValue,
  onChange,
}: BilingualTextFieldProps) {
  const update = (locale: LocalizedText['locale']) => (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ locale, value: event.currentTarget.value });
  };
  return (
    <EditorBilingualFields
      label={legend}
      zh={(
        <EditorTextField
          label={`${labelPrefix}（繁體中文）`}
          lang="zh-Hant"
          path={['zh', ...path]}
          issues={[]}
          value={zhValue}
          onChange={update('zh')}
        />
      )}
      en={(
        <EditorTextField
          label={`${labelPrefix}（英文）`}
          lang="en"
          path={['en', ...path]}
          issues={[]}
          value={enValue}
          onChange={update('en')}
        />
      )}
    />
  );
}
