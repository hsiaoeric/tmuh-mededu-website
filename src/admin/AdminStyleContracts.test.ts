import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const projectFile = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const adminCss = [
  'src/design/admin.css',
  'src/design/admin/shell.css',
  'src/design/admin/controls.css',
  'src/design/admin/data.css',
  'src/design/admin/overlays.css',
  'src/design/admin/responsive.css',
].map(projectFile).join('\n');
const tokensCss = projectFile('src/design/tokens.css');
const shellCss = projectFile('src/design/admin/shell.css');
const overlaysCss = projectFile('src/design/admin/overlays.css');
const dataCss = projectFile('src/design/admin/data.css');
const indexHtml = projectFile('index.html');
const mainSource = projectFile('src/main.tsx');
const packageJson = projectFile('package.json');

function themeToken(selector: ':root' | "[data-theme='dark']", token: string): string {
  const blockStart = tokensCss.indexOf(`${selector} {`);
  const blockEnd = tokensCss.indexOf('\n}', blockStart);
  const value = tokensCss.slice(blockStart, blockEnd).match(new RegExp(`${token}:\\s*(#[0-9a-fA-F]{6})`))?.[1];
  if (value === undefined) throw new TypeError(`Missing ${token} in ${selector}`);
  return value;
}

function relativeLuminance(hex: string): number {
  const channels = hex.slice(1).match(/.{2}/g)?.map((channel) => Number.parseInt(channel, 16) / 255);
  if (channels === undefined) throw new TypeError(`Invalid hex color: ${hex}`);
  const [red, green, blue] = channels.map((channel) => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

describe('admin visual contracts', () => {
  it('keeps programmatic route focus on page headings visually neutral', () => {
    const headingFocusRule = shellCss.match(/\.admin-page-header h1:focus-visible\s*\{[^}]+\}/)?.[0];

    expect(headingFocusRule).toContain('outline: none');
  });

  it('disables reduced motion without resetting descendant transforms', () => {
    // Given
    const reducedMotionRules = adminCss.slice(adminCss.indexOf('@media (prefers-reduced-motion: reduce)'));

    // When
    const resetsTransforms = reducedMotionRules.includes('transform: none !important');

    // Then
    expect(resetsTransforms).toBe(false);
  });

  it('provides narrow notice, wrapping feedback, dark date, and CJK label treatments', () => {
    // Given
    const requiredSelectors = [
      '.admin-notice-copy',
      '.admin-media-feedback',
      "[type='date']",
      '.admin-short-label',
    ];

    // When
    const missingSelectors = requiredSelectors.filter((selector) => !adminCss.includes(selector));

    // Then
    expect(missingSelectors).toEqual([]);
    expect(adminCss).toContain('color-scheme: dark');
    expect(adminCss).toContain('word-break: keep-all');
  });

  it('keeps small sidenav sequence labels readable on the active dark surface', () => {
    // Given
    const navSequenceRule = adminCss.match(/\.admin-nav-group a small\s*\{[^}]+\}/)?.[0];

    // When
    const usesReadableTextToken = navSequenceRule?.includes('color: color-mix(in srgb, var(--muted) 80%, var(--ink))');

    // Then
    expect(usesReadableTextToken).toBe(true);
  });

  it('keeps faint admin labels and media fallbacks at WCAG AA contrast in both themes', () => {
    // Given
    const navLabelRule = shellCss.match(/\.admin-nav-label,\s*\.admin-language-key,\s*\.admin-page-eyebrow\s*\{[^}]+\}/)?.[0];
    const sideNavRule = [...shellCss.matchAll(/\.admin-sidenav\s*\{[^}]+\}/g)]
      .map(([rule]) => rule)
      .find((rule) => rule.includes('background:'));
    const mediaFallbackRule = overlaysCss.match(/\.admin-media-preview > span\s*\{[^}]+\}/)?.[0];
    const mediaPreviewRule = overlaysCss.match(/\.admin-media-preview\s*\{[^}]+\}/)?.[0];

    // When
    const lightContrast = contrastRatio(themeToken(':root', '--faint'), themeToken(':root', '--surface-sunk'));
    const darkContrast = contrastRatio(themeToken("[data-theme='dark']", '--faint'), themeToken("[data-theme='dark']", '--surface-sunk'));

    // Then
    expect(lightContrast).toBeGreaterThanOrEqual(4.5);
    expect(darkContrast).toBeGreaterThanOrEqual(4.5);
    expect(navLabelRule).toContain('color: var(--faint)');
    expect(sideNavRule).toContain('background: var(--surface-sunk)');
    expect(mediaFallbackRule).toContain('color: var(--faint)');
    expect(mediaPreviewRule).toContain('background: var(--surface-sunk)');
  });

  it('keeps explicit Traditional Chinese semantic groups intact at narrow widths', () => {
    // Given
    const phraseGroupRule = adminCss.match(/\.admin-phrase-group\[lang='zh-Hant'\]\s*\{[^}]+\}/)?.[0];

    // When
    const preservesGroup = phraseGroupRule?.includes('display: inline-block');

    // Then
    expect(preservesGroup).toBe(true);
  });

  it('reflows intrinsic controls and fixed-track panels at the 188px contract', () => {
    // Given
    const ultraNarrowRules = adminCss.slice(adminCss.indexOf('@media (max-width: 220px)'));

    // When
    const wrapsControls = ultraNarrowRules.includes('.admin-button') && ultraNarrowRules.includes('white-space: normal');
    const stacksFixedTracks = ultraNarrowRules.includes('.admin-state-panel') && ultraNarrowRules.includes('.admin-toast') && ultraNarrowRules.includes('.admin-check') && ultraNarrowRules.includes('grid-template-columns: minmax(0, 1fr)');
    const improvesMainMeasure = ultraNarrowRules.includes('.admin-main') && ultraNarrowRules.includes('padding-inline: var(--admin-space-1)');
    const usesTokenPadding = ultraNarrowRules.includes('padding: var(--admin-space-2)');
    const wrapsOnlyTheConstrainedMediaHeading = ultraNarrowRules.includes('.admin-media-copy h3') && ultraNarrowRules.includes('overflow-wrap: anywhere');

    // Then
    expect(wrapsControls).toBe(true);
    expect(stacksFixedTracks).toBe(true);
    expect(improvesMainMeasure).toBe(true);
    expect(usesTokenPadding).toBe(true);
    expect(wrapsOnlyTheConstrainedMediaHeading).toBe(true);
    expect(ultraNarrowRules).not.toContain('overflow-x: hidden');
    expect(ultraNarrowRules).not.toContain('font-size:');
  });

  it('uses a token-driven pressed cue distinct from hover without layout shift', () => {
    // Given
    const activeRule = adminCss.match(/\.admin-button:active:not\(:disabled\),\s*\.admin-icon-button:active:not\(:disabled\)\s*\{[^}]+\}/)?.[0];
    const primaryActiveRule = adminCss.match(/\.admin-button\[data-variant='primary'\]:active:not\(:disabled\)\s*\{[^}]+\}/)?.[0];
    const warningActiveRule = adminCss.match(/\.admin-button\[data-variant='warning'\]:active:not\(:disabled\)\s*\{[^}]+\}/)?.[0];

    // When
    const activeUsesDepth = activeRule?.includes('background:') && activeRule.includes('border-color:') && activeRule.includes('box-shadow: inset');
    const preservesPrimary = primaryActiveRule?.includes('var(--accent-deep)') && primaryActiveRule.includes('var(--on-accent)');
    const preservesWarning = warningActiveRule?.includes('var(--amber)') && warningActiveRule.includes('var(--amber-wash)');

    // Then
    expect(activeUsesDepth).toBe(true);
    expect(preservesPrimary).toBe(true);
    expect(preservesWarning).toBe(true);
    expect(activeRule).not.toMatch(/padding|margin|border-width/);
  });

  it('styles a disabled checkbox as one coherent token-driven row surface', () => {
    // Given
    const rowRule = adminCss.match(/\.admin-check\[data-disabled='true'\]\s*\{[^}]+\}/)?.[0];
    const checkboxRule = adminCss.match(/\.admin-check\s*\{[^}]+\}/)?.[0];

    // When
    const usesWholeRowSurface = rowRule?.includes('background: var(--surface-sunk)') && rowRule.includes('border: 1px solid var(--line-soft)');

    // Then
    expect(usesWholeRowSurface).toBe(true);
    expect(rowRule).toContain('cursor: not-allowed');
    expect(checkboxRule).toContain('min-block-size: var(--admin-control-h)');
    expect(adminCss).not.toContain(".admin-check input:disabled ~ span");
  });

  it('always block-stacks bilingual record-title languages without a separator rule', () => {
    // Given
    const titleRule = dataCss.match(/\.admin-record-title-primary,\s*\.admin-record-title-secondary\s*\{[^}]+\}/)?.[0];

    // When
    const stacksLanguages = titleRule?.includes('display: block');
    const keepsLanguagesShrinkable = titleRule?.includes('min-inline-size: 0');

    // Then
    expect(stacksLanguages).toBe(true);
    expect(keepsLanguagesShrinkable).toBe(true);
    expect(adminCss).not.toContain('.admin-record-title-separator');
  });

  it('reserves table title width while keeping mixed-language atoms unbreakable', () => {
    // Given
    const titleColumnRule = dataCss.match(/\.admin-table \[data-column-key='title'\]\s*\{[^}]+\}/)?.[0];
    const tableMixedPhraseRule = dataCss.match(/\.admin-table \.admin-mixed-phrase-group\s*\{[^}]+\}/)?.[0];
    const sharedMixedPhraseRule = adminCss.match(/\.admin-mixed-phrase-group\s*\{[^}]+\}/)?.[0];

    // When
    const reservesTitleWidth = titleColumnRule?.includes('min-inline-size');
    const keepsTablePhraseTogether = tableMixedPhraseRule?.includes('white-space: nowrap');

    // Then
    expect(reservesTitleWidth).toBe(true);
    expect(keepsTablePhraseTogether).toBe(true);
    expect(sharedMixedPhraseRule).not.toContain('white-space: nowrap');
    expect(titleColumnRule).not.toContain('font-size');
    expect(titleColumnRule).not.toContain('display: none');
  });

  it('keeps desktop table timestamps on one line without changing shared metadata', () => {
    // Given
    const updatedColumnRule = dataCss.match(/\.admin-table \[data-column-key='updated'\]\s*\{[^}]+\}/)?.[0];
    const sharedMonoRule = adminCss.match(/\.mono\s*\{[^}]+\}/)?.[0];

    // When
    const reservesTimestampWidth = updatedColumnRule?.includes('min-inline-size');
    const keepsTimestampTogether = updatedColumnRule?.includes('white-space: nowrap');

    // Then
    expect(reservesTimestampWidth).toBe(true);
    expect(keepsTimestampTogether).toBe(true);
    expect(sharedMonoRule).not.toContain('white-space: nowrap');
    expect(updatedColumnRule).not.toContain('font-size');
    expect(updatedColumnRule).not.toContain('display: none');
  });

  it('shows an SVG checkbox glyph only for the checked custom state', () => {
    // Given
    const glyphRule = adminCss.match(/\.admin-check-glyph\s*\{[^}]+\}/)?.[0];
    const checkedGlyphRule = adminCss.match(/\.admin-check input:checked \+ \.admin-check-mark \.admin-check-glyph\s*\{[^}]+\}/)?.[0];

    // When
    const hidesUncheckedGlyph = glyphRule?.includes('opacity: 0');
    const showsCheckedGlyph = checkedGlyphRule?.includes('opacity: 1');

    // Then
    expect(hidesUncheckedGlyph).toBe(true);
    expect(showsCheckedGlyph).toBe(true);
  });

  it('themes native table checkboxes while preserving their target and focus contracts', () => {
    // Given
    const checkboxRule = adminCss.match(/\.admin-table input\[type='checkbox'\]\s*\{[^}]+\}/)?.[0];
    const darkCheckboxRule = adminCss.match(/\[data-theme='dark'\] \.admin-table input\[type='checkbox'\]\s*\{[^}]+\}/)?.[0];

    // When
    const usesLightTheme = checkboxRule?.includes('color-scheme: light');
    const usesDarkTheme = darkCheckboxRule?.includes('color-scheme: dark');

    // Then
    expect(checkboxRule).toContain('var(--admin-control-h)');
    expect(checkboxRule).toContain('accent-color: var(--accent)');
    expect(usesLightTheme).toBe(true);
    expect(usesDarkTheme).toBe(true);
  });

  it('provides visible table scroll guidance and language-aware textarea wrapping', () => {
    // Given
    const scrollHintRule = adminCss.match(/\.admin-table-scroll-hint\s*\{[^}]+\}/)?.[0];
    const chineseTextareaRule = adminCss.match(/\.admin-textarea\[lang='zh-Hant'\]\s*\{[^}]+\}/)?.[0];

    // When
    const exposesHint = scrollHintRule?.includes('display: flex');
    const pinsHintDuringScroll = scrollHintRule?.includes('position: sticky') && scrollHintRule.includes('inset-inline-start: 0');
    const usesPhraseWrapping = chineseTextareaRule?.includes('word-break: auto-phrase');

    // Then
    expect(exposesHint).toBe(true);
    expect(pinsHintDuringScroll).toBe(true);
    expect(usesPhraseWrapping).toBe(true);
  });

  it('self-hosts all design-system fonts through Fontsource', () => {
    // Given
    const packages = [
      '@fontsource/instrument-serif',
      '@fontsource/inter',
      '@fontsource/ibm-plex-mono',
      '@fontsource/noto-sans-tc',
      '@fontsource/noto-serif-tc',
    ];

    // When
    const missingPackages = packages.filter((packageName) => !packageJson.includes(`"${packageName}"`));
    const missingImports = packages.filter((packageName) => !mainSource.includes(packageName));

    // Then
    expect(indexHtml).not.toContain('fonts.googleapis.com');
    expect(indexHtml).not.toContain('fonts.gstatic.com');
    expect(missingPackages).toEqual([]);
    expect(missingImports).toEqual([]);
  });
});
