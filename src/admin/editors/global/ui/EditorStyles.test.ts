import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const projectFile = (path: string) => readFileSync(new URL(`../../../../../${path}`, import.meta.url), 'utf8');
const editorCss = projectFile('src/design/admin/editors.css');
const adminCss = projectFile('src/design/admin.css');

describe('editor style isolation', () => {
  it('imports the editor stylesheet exactly once from the admin entrypoint', () => {
    // Given / When
    const imports = adminCss.match(/@import '\.\/admin\/editors\.css';/g) ?? [];

    // Then
    expect(imports).toHaveLength(1);
  });

  it('uses existing tokens and leaves vertical scrolling with the admin shell', () => {
    // Given / When
    const rawColors = editorCss.match(/#[0-9a-f]{3,8}|rgba?\(/giu) ?? [];
    const newTokens = editorCss.match(/--[a-z0-9-]+\s*:/giu) ?? [];

    // Then
    expect(rawColors).toEqual([]);
    expect(newTokens).toEqual([]);
    expect(editorCss).not.toMatch(/overflow-y\s*:\s*(auto|scroll)/u);
    expect(editorCss).toContain('overflow-wrap: anywhere');
    expect(editorCss).toContain('min-inline-size: 0');
  });

  it('stacks collection actions and bilingual content at the approved narrow breakpoint', () => {
    // Given / When
    const narrowRules = editorCss.slice(editorCss.indexOf('@media (max-width: 620px)'));

    // Then
    expect(narrowRules).toContain('.admin-editor-collection-actions');
    expect(narrowRules).toContain('grid-template-columns: minmax(0, 1fr)');
    expect(narrowRules).not.toContain('overflow-x: hidden');
  });
});
