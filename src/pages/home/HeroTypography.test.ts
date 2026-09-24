import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const baseCss = readFileSync(new URL('../../design/base.css', import.meta.url), 'utf8');

describe('homepage hero typography', () => {
  it('keeps narrow Traditional Chinese lede phrases intact before emergency wrapping', () => {
    const narrowRules = baseCss.slice(baseCss.indexOf('@media (max-width: 520px)'));
    const heroLedeRule = narrowRules.match(/^  #top \.lede\.measure:lang\(zh-Hant\)\s*\{[^}]+\}/m)?.[0];

    expect(heroLedeRule).toContain('text-wrap: pretty');
    expect(heroLedeRule).toContain('word-break: keep-all');
    expect(heroLedeRule).toContain('overflow-wrap: break-word');
    expect(heroLedeRule).not.toContain('font-size');
  });
});
