import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const projectFile = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const shellCss = projectFile('src/design/admin/shell.css');
const responsiveCss = projectFile('src/design/admin/responsive.css');
const baseCss = projectFile('src/design/base.css');

describe('packet 21 Pass B style contracts', () => {
  it('reserves an admin-only skip-link band without changing the public rule', () => {
    // Given
    const focusedSlotRule = shellCss.match(/\.admin-skip-slot:focus-within\s*\{[^}]+\}/)?.[0];
    const publicSkipRule = baseCss.match(/\.skip-link\s*\{[^}]+\}/)?.[0];

    // When
    const reservesBand = focusedSlotRule?.includes('block-size: calc(var(--admin-control-h) + var(--admin-space-3))');

    // Then
    expect(reservesBand).toBe(true);
    expect(shellCss).toContain('grid-template-rows: auto minmax(0, 1fr)');
    expect(responsiveCss).toContain('.admin-skip-slot');
    expect(publicSkipRule).toContain('position: fixed');
  });

  it('swaps concise copy only inside the ultra-narrow admin contract', () => {
    // Given
    const ultraNarrowRules = responsiveCss.slice(responsiveCss.indexOf('@media (max-width: 220px)'));

    // When
    const swapsCopy = ultraNarrowRules.includes('.admin-default-copy') && ultraNarrowRules.includes('.admin-narrow-copy');

    // Then
    expect(swapsCopy).toBe(true);
    expect(ultraNarrowRules).not.toContain('font-size:');
    expect(ultraNarrowRules).not.toContain('overflow-x: hidden');
  });

  it('uses the compact admin header before tablet controls become crowded', () => {
    // Given
    const tabletRules = responsiveCss.slice(
      responsiveCss.indexOf('@media (max-width: 900px)'),
      responsiveCss.indexOf('@media (max-width: 620px)'),
    );
    const phoneRules = responsiveCss.slice(
      responsiveCss.indexOf('@media (max-width: 420px)'),
      responsiveCss.indexOf('@media (max-width: 220px)'),
    );

    // When
    const hidesLongHeaderCopy = tabletRules.includes('.admin-header-tools .admin-save-status')
      && tabletRules.includes('.admin-header-location > span { display: none; }');
    const showsCompactLabel = tabletRules.includes('.admin-mobile-label { display: inline; }');

    // Then
    expect(hidesLongHeaderCopy).toBe(true);
    expect(showsCompactLabel).toBe(true);
    expect(phoneRules).toContain('.admin-mobile-label { display: none; }');
  });
});
