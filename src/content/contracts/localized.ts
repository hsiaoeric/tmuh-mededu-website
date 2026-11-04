import { z } from 'zod';

/**
 * Archive-era documents (posts, department_info, gallery) do not use the `{ zh, en }` locale tree.
 * Every localized leaf carries its own `{ zh, en? }` pair instead, so imported Chinese-only content
 * can be published without inventing an English translation. The marker below sits at the top of
 * each such payload and is what the database envelope check keys on.
 */
export const LOCALIZED_CONTENT_MODEL = 'localized-fields-v1';
export const ContentModelSchema = z.literal(LOCALIZED_CONTENT_MODEL);

/** Maximum lengths, in UTF-16 code units as JavaScript and Postgres `char_length` agree for BMP text. */
export const TEXT_LIMITS = {
  title: 200,
  label: 120,
  summary: 500,
  alt: 300,
  caption: 300,
  run: 10_000,
  cell: 1_000,
} as const;

export type TextLimit = keyof typeof TEXT_LIMITS;

/**
 * C0 controls and DEL, except TAB (U+0009) and LF (U+000A). CR is rejected so line breaks have
 * exactly one encoding. Single-line text additionally rejects LF.
 */
export const FORBIDDEN_CONTROL_CHARACTERS = /[\u0000-\u0008\u000B-\u001F\u007F]/;
const LINE_FEED = /\n/;
/** Edge whitespace is ASCII only, so a leading ideographic space (U+3000) indent survives. */
const EDGE_WHITESPACE = /^[ \t\n\r\f\v]|[ \t\n\r\f\v]$/;
/** Exactly JavaScript's `\s` class, spelled out so the SQL validator can mirror it. */
const BLANK = /^[\u0009-\u000D\u0020\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]*$/;

export type PlainTextRule = {
  readonly max: number;
  /** Allow LF inside the text. */
  readonly multiline?: boolean;
  /** Allow the empty string (table cells). */
  readonly allowEmpty?: boolean;
  /** Reject ASCII whitespace at either end. Defaults to true. */
  readonly trimmed?: boolean;
};

export function plainTextProblem(value: string, rule: PlainTextRule): string | null {
  if (value.length === 0) return rule.allowEmpty === true ? null : 'Text must not be empty';
  if (value.length > rule.max) return `Text must be at most ${rule.max} characters`;
  if (FORBIDDEN_CONTROL_CHARACTERS.test(value)) return 'Text must not contain control characters';
  if (rule.multiline !== true && LINE_FEED.test(value)) return 'Text must be a single line';
  if (rule.trimmed !== false && EDGE_WHITESPACE.test(value)) {
    return 'Text must not start or end with whitespace';
  }
  if (rule.trimmed !== false && BLANK.test(value)) return 'Text must not be blank';
  return null;
}

export function plainText(rule: PlainTextRule) {
  return z.string().check((context) => {
    const problem = plainTextProblem(context.value, rule);
    if (problem !== null) context.issues.push({ code: 'custom', message: problem, input: context.value });
  });
}

export const TitleTextSchema = plainText({ max: TEXT_LIMITS.title });
export const LabelTextSchema = plainText({ max: TEXT_LIMITS.label });
export const SummaryTextSchema = plainText({ max: TEXT_LIMITS.summary });
export const AltTextSchema = plainText({ max: TEXT_LIMITS.alt });
export const CaptionTextSchema = plainText({ max: TEXT_LIMITS.caption });
/**
 * Inline runs sit next to each other inside one paragraph, so their edges may carry the spaces
 * between words ("See " + link). They still must not be empty or contain control characters.
 */
export const RunTextSchema = plainText({ max: TEXT_LIMITS.run, multiline: true, trimmed: false });
export const TableCellTextSchema = plainText({ max: TEXT_LIMITS.cell, allowEmpty: true });

/**
 * A published localized string. Chinese is required; English is either absent or real text.
 * `en: ""` is rejected: absence is the only encoding of "not translated yet".
 */
export function localizedText(limit: TextLimit) {
  const text = plainText({ max: TEXT_LIMITS[limit] });
  return z.strictObject({ zh: text, en: text.optional() }).readonly();
}

/** The authoring shape: either side may be empty while an editor types. */
export const EditableLocalizedTextSchema = z.strictObject({
  zh: z.string(),
  en: z.string().optional(),
}).readonly();

export const LocalizedTitleSchema = localizedText('title');
export const LocalizedLabelSchema = localizedText('label');
export const LocalizedSummarySchema = localizedText('summary');
export const LocalizedAltSchema = localizedText('alt');
export const LocalizedCaptionSchema = localizedText('caption');

export type LocalizedText = z.output<typeof LocalizedTitleSchema>;
export type EditableLocalizedText = z.output<typeof EditableLocalizedTextSchema>;

/** Sets or clears the English side; a blank value deletes the key rather than storing `""`. */
export function setOptionalEnglish<T extends { readonly zh: string; readonly en?: string }>(
  value: T,
  english: string,
): T {
  const { en: _previous, ...rest } = value;
  return (english.length === 0 ? rest : { ...rest, en: english }) as T;
}

/** Block-list twin of `setOptionalEnglish`: an empty list deletes the English side. */
export function setOptionalEnglishBlocks<T extends { readonly zh: readonly unknown[]; readonly en?: readonly unknown[] }>(
  value: T,
  english: T['zh'] | undefined,
): T {
  const { en: _previous, ...rest } = value;
  return (english === undefined || english.length === 0 ? rest : { ...rest, en: english }) as T;
}
