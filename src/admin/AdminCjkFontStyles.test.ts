import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const projectFile = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const shellCss = projectFile('src/design/admin/shell.css');
const controlsCss = projectFile('src/design/admin/controls.css');

const affectedFontRules = [
  shellCss.match(/\.admin-nav-label,\s*\.admin-language-key,\s*\.admin-page-eyebrow\s*\{[^}]+\}/)?.[0],
  controlsCss.match(/\.admin-required\s*\{[^}]+\}/)?.[0],
  controlsCss.match(/\.admin-status\s*\{[^}]+\}/)?.[0],
];

describe('admin CJK font fallback contracts', () => {
  it('keeps the Latin mono face primary and adds a Traditional Chinese fallback', () => {
    // Given
    const cjkCapableMonoStack = "font-family: 'IBM Plex Mono', 'Noto Sans TC', ui-monospace, monospace";

    // When
    const matchingRules = affectedFontRules.filter((rule) => rule?.includes(cjkCapableMonoStack));

    // Then
    expect(affectedFontRules).not.toContain(undefined);
    expect(matchingRules).toHaveLength(affectedFontRules.length);
  });
});
