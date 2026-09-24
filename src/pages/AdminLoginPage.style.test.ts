import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const authCss = readFileSync(
  new URL('../design/admin/auth.css', import.meta.url),
  'utf8',
);
const shellCss = readFileSync(
  new URL('../design/admin/shell.css', import.meta.url),
  'utf8',
);
const baseCss = readFileSync(
  new URL('../design/base.css', import.meta.url),
  'utf8',
);

describe('AdminLoginPage mobile style contract', () => {
  it('gives a focused sign-in alert one full-width copy track on mobile', () => {
    // Given
    const mobileRules = authCss.match(/@media \(max-width: 620px\)\s*\{[\s\S]*?\n\}/)?.[0];

    // When
    const alertRule = mobileRules?.match(
      /\.admin-auth-alert \.admin-state-panel\s*\{[^}]+\}/,
    )?.[0];

    // Then
    expect(alertRule).toContain('grid-template-columns: minmax(0, 1fr)');
  });

  it('keeps the complete admin skip-link focus outline inside the viewport', () => {
    // Given
    const focusedSlotRule = shellCss.match(
      /\.admin-skip-slot:focus-within\s*\{[^}]+\}/,
    )?.[0];

    // When
    const publicSkipRule = baseCss.match(/\.skip-link\s*\{[^}]+\}/)?.[0];

    // Then
    expect(focusedSlotRule).toContain(
      'block-size: calc(var(--admin-control-h) + var(--admin-space-3))',
    );
    expect(publicSkipRule).toContain('position: fixed');
    expect(publicSkipRule).toContain('top: 12px');
  });

  it('bounds route-heading focus paint to its visible label instead of the full column', () => {
    // Given
    const headingFocusRule = authCss.match(
      /\.admin-auth-heading h1:focus-visible\s*\{[^}]+\}/,
    )?.[0];

    // When
    const labelFocusRule = authCss.match(
      /\.admin-auth-heading h1:focus-visible \.admin-auth-focus-label\s*\{[^}]+\}/,
    )?.[0];

    // Then
    expect(headingFocusRule).toContain('outline: none');
    expect(labelFocusRule).toContain('outline: 2px solid var(--accent-bright)');
    expect(labelFocusRule).toContain('outline-offset: 3px');
  });

  it('prettifies only the English login intro without forcing or hiding wraps', () => {
    // Given / When
    const englishIntroRule = authCss.match(
      /\.admin-auth-heading p:lang\(en\)\s*\{[^}]+\}/,
    )?.[0];

    // Then
    expect(englishIntroRule ?? '').toContain('text-wrap: pretty');
    expect(authCss).not.toMatch(/(^|[},]\s*)p:lang\(en\)/m);
    expect(englishIntroRule ?? '').not.toMatch(/white-space|font-size|inline-size|overflow:\s*hidden/);
  });
});
