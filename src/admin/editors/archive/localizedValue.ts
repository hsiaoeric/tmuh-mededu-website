import {
  setOptionalEnglish,
  setOptionalEnglishBlocks,
  type EditableLocalizedText,
} from '@/content/contracts/localized';
import type { EditableLocalizedBlocks } from '@/content/contracts/blocks';

export { setOptionalEnglish, setOptionalEnglishBlocks };

/**
 * An optional localized field with nothing typed on either side is removed from the payload, so
 * a summary or caption someone opened and cleared does not publish as an empty string.
 */
export function compactOptionalLocalized(value: EditableLocalizedText): EditableLocalizedText | undefined {
  return value.zh === '' && value.en === undefined ? undefined : value;
}

export function withChinese(value: EditableLocalizedText | undefined, zh: string): EditableLocalizedText {
  return value === undefined ? { zh } : { ...value, zh };
}

/** `{ ...object, [key]: value }`, or the object without `key` when `value` is undefined. */
export function withOptional<T extends object, K extends keyof T>(object: T, key: K, value: T[K] | undefined): T {
  const { [key]: _removed, ...rest } = object;
  return (value === undefined ? rest : { ...rest, [key]: value }) as T;
}

export function hasEnglishBlocks(value: EditableLocalizedBlocks): boolean {
  return value.en !== undefined && value.en.length > 0;
}

/** Whether a localized value still needs an English translation. */
export function isUntranslated(value: EditableLocalizedText | undefined): boolean {
  return value !== undefined && value.zh !== '' && value.en === undefined;
}
