import { describe, expect, it } from 'vitest';
import { collectNewsIssues, parseNewsEditorText } from './newsValidation';
import { newsFixture } from './testFixture';

describe('news semantic validation', () => {
  it('keeps invalid canonical dates editable and reports their field path', () => {
    // Given
    const source = newsFixture();
    const changed = {
      ...source,
      zh: { ...source.zh, department: source.zh.department.map((row, index) => index === 0 ? { ...row, publishedOn: '2026-02-30' } : row) },
      en: { ...source.en, department: source.en.department.map((row, index) => index === 0 ? { ...row, publishedOn: '2026-02-30' } : row) },
    };

    // When
    const editable = parseNewsEditorText(JSON.stringify(changed));
    const issues = collectNewsIssues(changed);

    // Then
    expect(editable).not.toBeNull();
    expect(issues.map((issue) => issue.issue.path)).toContainEqual(['zh', 'department', 0, 'publishedOn']);
  });

  it('reports duplicate and locale-divergent announcement identities', () => {
    // Given
    const source = newsFixture();
    const first = source.en.department[0];
    if (first === undefined) throw new TypeError('Missing news fixture');
    const changed = { ...source, en: { ...source.en, department: source.en.department.map((row, index) => index === 1 ? { ...row, id: first.id } : row) } };

    // When
    const issues = collectNewsIssues(changed);

    // Then
    expect(issues.length).toBeGreaterThan(0);
  });
});
