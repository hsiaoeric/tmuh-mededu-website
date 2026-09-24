import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const projectFile = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const componentsCss = projectFile('src/design/components.css');

const affectedFontRules = [
  componentsCss.match(/\.tag\s*\{[^}]+\}/)?.[0],
  componentsCss.match(/\.stat-sub\s*\{[^}]+\}/)?.[0],
  componentsCss.match(/\.table th\s*\{[^}]+\}/)?.[0],
];

describe('public CJK font fallback contracts', () => {
  it('prevents tofu in public tags, stat metadata, and table headers while preserving the Latin mono face', () => {
    // Given
    const cjkCapableMonoStack = "font-family: 'IBM Plex Mono', 'Noto Sans TC', ui-monospace, monospace";

    // When
    const matchingRules = affectedFontRules.filter((rule) => rule?.includes(cjkCapableMonoStack));

    // Then
    expect(affectedFontRules).not.toContain(undefined);
    expect(matchingRules).toHaveLength(affectedFontRules.length);
  });
});
