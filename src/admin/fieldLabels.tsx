import { createContext, useContext, type ReactNode } from 'react';

type FieldLanguage = 'zh' | 'en';

const FieldLanguageContext = createContext<FieldLanguage | null>(null);
const FieldItemContext = createContext<number | null>(null);

/** Marks the fields of one column of a bilingual pair, which then show a language tag instead of a label. */
export function FieldLanguageProvider({ lang, children }: { readonly lang: FieldLanguage; readonly children: ReactNode }) {
  return <FieldLanguageContext.Provider value={lang}>{children}</FieldLanguageContext.Provider>;
}

/** The 1-based position of the collection item the fields belong to, whose card already names it. */
export function FieldItemProvider({ position, children }: { readonly position: number; readonly children: ReactNode }) {
  return <FieldItemContext.Provider value={position}>{children}</FieldItemContext.Provider>;
}

const LANGUAGE_SUFFIX = /\s*[（(](?:繁體中文|中文|英文|English|Chinese)[）)]\s*$/u;
const LANGUAGE_PREFIX = /^(?:繁體中文|中文|英文|English)\s*/u;

function escape(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

/**
 * A field's label without what its surroundings already say: the item number its card shows
 * ("，第 3 則公告", "SNQ 專案 3 ", ", announcement 3") and, inside a bilingual pair, the language.
 * Only the item's own position is removed, so unrelated numbers in a label are kept.
 */
export function shortFieldLabel(label: string, position: number | null, inPair: boolean): string {
  let short = label;
  if (position !== null) {
    const n = escape(String(position));
    short = short
      .replace(new RegExp(`\\s*[，,][^，,]*?(?<![\\d])${n}(?![\\d])[^，,\\d]*$`, 'u'), '')
      .replace(new RegExp(`^[^，,\\d]+?(?<!第)\\s${n}\\s+`, 'u'), '');
  }
  if (inPair) short = short.replace(LANGUAGE_SUFFIX, '').replace(LANGUAGE_PREFIX, '');
  short = short.trim();
  // A label reduced to a character or two ("則") says nothing; keep the original then.
  return Array.from(short).length < 2 ? label : short;
}

export type FieldLabelPresentation = {
  /** What the label shows; `null` inside a bilingual pair, where the pair's title and a language tag stand in. */
  readonly visible: string | null;
  readonly lang: FieldLanguage | null;
  /** The full label, for the control's accessible name, when the visible one is shorter. */
  readonly accessibleName: string | undefined;
};

export function useFieldLabel(label: string): FieldLabelPresentation {
  const lang = useContext(FieldLanguageContext);
  const position = useContext(FieldItemContext);
  if (lang !== null) return { visible: null, lang, accessibleName: undefined };
  const short = shortFieldLabel(label, position, false);
  return { visible: short, lang: null, accessibleName: short === label ? undefined : label };
}
