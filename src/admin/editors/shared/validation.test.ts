import { describe, expect, it } from 'vitest';
import {
  displayStructuredEditorIssue,
  fieldIdForStructuredEditorIssuePath as fieldIdForIssuePath,
  mapStructuredEditorIssues as mapGlobalEditorIssues,
  type StructuredEditorIssue as GlobalEditorIssue,
} from '@/admin/editors/shared';

describe('structured editor validation mapping', () => {
  it.each([
    [[], 'global-editor-field-root'],
    [
      ['zh', 'items', 2, 'label'],
      'global-editor-field-s-7a_68-s-69_74_65_6d_73-n-2-s-6c_61_62_65_6c',
    ],
    [['space and/slash'], 'global-editor-field-s-73_70_61_63_65_20_61_6e_64_2f_73_6c_61_73_68'],
    [[''], 'global-editor-field-s-empty'],
  ] satisfies readonly (readonly [readonly PropertyKey[], string])[])(
    'maps path %# to a deterministic DOM-safe field id',
    (path, expected) => {
      expect(fieldIdForIssuePath(path)).toBe(expected);
      expect(fieldIdForIssuePath(path)).toMatch(/^[A-Za-z][A-Za-z0-9_-]*$/);
    },
  );

  it('maps summary entries to their target fields while preserving each issue', () => {
    const issues: readonly GlobalEditorIssue[] = [
      { path: ['en', 'items', 1, 'value'], message: 'constraint-token', code: 'custom' },
      { path: [], message: 'root-token' },
    ];

    const summary = mapGlobalEditorIssues(issues);

    expect(summary.map((entry) => entry.fieldId)).toEqual([
      fieldIdForIssuePath(issues[0]?.path ?? []),
      fieldIdForIssuePath(issues[1]?.path ?? []),
    ]);
    expect(summary.map((entry) => entry.issue)).toEqual(issues);
    expect(summary[0]?.issue).toBe(issues[0]);
  });

  it.each([
    [{ path: [], message: 'Malformed JSON', code: 'invalid_json' }, 'JSON 格式不正確，請修正語法後再試。'],
    [{ path: [], message: 'Expected a JSON object', code: 'invalid_type' }, '最外層內容必須是 JSON 物件。'],
    [{ path: ['zh', 'title'], message: 'Invalid input: expected string, received undefined', code: 'invalid_type' }, '此欄位為必填，請輸入內容。'],
    [{ path: ['zh', 'title'], message: 'Invalid input: expected string, received number', code: 'invalid_type' }, '請輸入文字。'],
    [{ path: ['zh', 'count'], message: 'Invalid input: expected number, received string', code: 'invalid_type' }, '請輸入數字。'],
    [{ path: ['zh', 'count'], message: 'Too small: expected number to be >=1', code: 'too_small' }, '數值不得小於 1。'],
    [{ path: ['zh', 'count'], message: 'Too big: expected number to be <=12', code: 'too_big' }, '數值不得大於 12。'],
    [{ path: ['zh', 'color'], message: 'Invalid string: must match pattern /^#[0-9a-f]{6}$/i', code: 'invalid_format' }, '請輸入 6 位十六進位色碼，例如 #286f5d。'],
    [{ path: ['en', 'date'], message: 'English dates must use Mon D, YYYY', code: 'custom' }, '英文日期請使用「Mon D, YYYY」格式。'],
    [{ path: ['zh', 'papers', 0, 'month'], message: 'Invalid research publication month', code: 'custom' }, '論文發表月份必須介於 1 至 12。'],
    [{ path: ['en', 'items'], message: 'Localized collections must contain the same number of items', code: 'custom' }, '繁體中文與英文的項目數量必須一致。'],
    [{ path: ['en', 'items', 0, 'id'], message: 'Localized identifiers must match and remain in the same order', code: 'custom' }, '繁體中文與英文的識別碼及順序必須一致。'],
    [{ path: ['zh', 'value'], message: 'Invalid input', code: 'invalid_union' }, '此欄位的值不符合驗證規則，請檢查內容。'],
  ] satisfies readonly (readonly [GlobalEditorIssue, string])[])(
    'shows a specific Traditional Chinese validation message for issue %#',
    (issue, expected) => {
      expect(displayStructuredEditorIssue(issue, true)).toBe(expected);
    },
  );

  it.each([
    [{ path: ['en', 'title'], message: 'Invalid input: expected string, received undefined', code: 'invalid_type' }, 'This field is required.'],
    [{ path: ['en', 'count'], message: 'Invalid input: expected number, received string', code: 'invalid_type' }, 'Enter a number.'],
    [{ path: ['en', 'color'], message: 'Invalid string: must match pattern /^#[0-9a-f]{6}$/i', code: 'invalid_format' }, 'Enter a six-digit hex color, such as #286f5d.'],
    [{ path: ['en', 'value'], message: 'Invalid input', code: 'invalid_union' }, 'This value does not satisfy the field validation requirements.'],
  ] satisfies readonly (readonly [GlobalEditorIssue, string])[])(
    'keeps English validation useful and specific for issue %#',
    (issue, expected) => {
      expect(displayStructuredEditorIssue(issue, false)).toBe(expected);
    },
  );

  it('does not translate domain-authored content or proper nouns', () => {
    const issue: GlobalEditorIssue = {
      path: ['zh', 'title'],
      message: 'TMUH authored recovery: Dr. Wang',
      code: 'custom',
    };

    expect(displayStructuredEditorIssue(issue, true)).toBe(issue.message);
    expect(displayStructuredEditorIssue(issue, false)).toBe(issue.message);
  });
});
