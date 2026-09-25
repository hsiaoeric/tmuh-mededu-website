import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CMS_DOCUMENT_METADATA } from './documents/cmsDocumentMetadata';
import { StableKey } from './StableKey';
import {
  AdminWorkspaceDescription,
  isPageWorkspaceDescriptionKind,
  PAGE_WORKSPACE_DESCRIPTION_PHRASES,
} from './AdminWorkspaceDescription';
import { AdminWorkspaceTitle } from './AdminWorkspaceTitle';

const projectFile = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const shellCss = projectFile('src/design/admin/shell.css');
const responsiveCss = projectFile('src/design/admin/responsive.css');
const workspaceCss = projectFile('src/design/admin/workspace.css');

describe('admin typography and reflow contracts', () => {
  it('contains long editors while reserving vertical scroll for admin main', () => {
    // Given
    const rootRouteRule = shellCss.match(/^html\.admin-route,[\s\S]*?^\}/m)?.[0];
    const shellColumnRules = [...shellCss.matchAll(/^\.admin-shell-column\s*\{[^}]+\}/gm)].map((match) => match[0]);
    const mainRule = shellCss.match(/^\.admin-main\s*\{[^}]+\}/m)?.[0];

    // When
    const rootClipsOverflow = rootRouteRule?.includes('overflow: clip') ?? false;
    const columnIsBounded = shellColumnRules.some((rule) => rule.includes('block-size: 100%'));
    const mainUsesZeroFlexBasis = mainRule?.includes('flex: 1 1 0') ?? false;
    const mainContainsPositionedDescendants = mainRule?.includes('position: relative') ?? false;

    // Then
    expect(rootClipsOverflow).toBe(true);
    expect(columnIsBounded).toBe(true);
    expect(mainUsesZeroFlexBasis).toBe(true);
    expect(mainContainsPositionedDescendants).toBe(true);
  });

  it('keeps Traditional Chinese phrases intact before emergency wrapping', () => {
    // Given
    const cjkCopyRule = shellCss.match(/^\.admin-zh-copy\[lang=['"]zh-Hant['"]\]\s*\{[^}]+\}/m)?.[0];
    const cjkParagraphRule = shellCss.match(/^\.admin-page-header p:lang\(['"]?zh-Hant['"]?\),[\s\S]*?\}/m)?.[0];

    // When
    const groupedCopyKeepsPhrases = cjkCopyRule?.includes('word-break: keep-all')
      && cjkCopyRule.includes('overflow-wrap: break-word');
    const editorCopyKeepsPhrases = cjkParagraphRule?.includes('.admin-section-heading p:lang(zh-Hant)')
      && cjkParagraphRule.includes('word-break: keep-all')
      && cjkParagraphRule.includes('overflow-wrap: break-word');

    // Then
    expect(groupedCopyKeepsPhrases).toBe(true);
    expect(editorCopyKeepsPhrases).toBe(true);
  });

  it('uses the shipped CJK sans stack for Traditional Chinese admin headings', () => {
    // Given
    const cjkHeadingRules = [
      shellCss.match(/^\.admin-page-header h1:lang\(['"]?zh-Hant['"]?\)\s*\{(?=[^}]*font-family)[^}]+\}/m)?.[0],
      shellCss.match(/^\.admin-section-heading h2:lang\(['"]?zh-Hant['"]?\)\s*\{(?=[^}]*font-family)[^}]+\}/m)?.[0],
      workspaceCss.match(/^\.admin-media-workbench > header h2:lang\(['"]?zh-Hant['"]?\)\s*\{(?=[^}]*font-family)[^}]+\}/m)?.[0],
    ];

    // When
    const shippedCjkStack = "font-family: 'Inter', 'Noto Sans TC', system-ui, sans-serif";

    // Then
    expect(cjkHeadingRules).not.toContain(undefined);
    expect(cjkHeadingRules.every((rule) => rule?.includes(shippedCjkStack))).toBe(true);
  });

  it('reflows shell headers and workspaces at effective 200 percent zoom', () => {
    // Given
    const narrowRules = responsiveCss.slice(responsiveCss.indexOf('@media (max-width: 420px)'));
    const pageHeaderLeadRule = shellCss.match(/^\.admin-page-header > div:first-child\s*\{[^}]+\}/m)?.[0];

    // When
    const wrapsHeader = narrowRules.includes('.admin-header') && narrowRules.includes('flex-wrap: wrap');
    const wrapsTools = narrowRules.includes('.admin-header-tools') && narrowRules.includes('flex-wrap: wrap');
    const wrapsTitle = narrowRules.includes('.admin-workspace-title-label') && narrowRules.includes('white-space: normal');
    const collapsesWorkspaceTrack = workspaceCss.includes('minmax(min(13rem, 100%), 16rem)');

    // Then
    expect(wrapsHeader).toBe(true);
    expect(wrapsTools).toBe(true);
    expect(wrapsTitle).toBe(true);
    expect(collapsesWorkspaceTrack).toBe(true);
    expect(pageHeaderLeadRule).toContain('min-inline-size: 0');
    expect(narrowRules).not.toContain('overflow-x: hidden');
  });

  it('reserves separator-aware stable-key wrapping without arbitrary glyph breaks', () => {
    // Given
    const stableKeyRule = workspaceCss.match(/^\.admin-stable-key\s*\{[^}]+\}/m)?.[0];

    // When
    const preservesSegments = stableKeyRule?.includes('overflow-wrap: normal')
      && stableKeyRule.includes('word-break: normal');

    // Then
    expect(preservesSegments).toBe(true);
    expect(workspaceCss).toContain('.admin-stable-key wbr');
  });

  it('preserves exact stable-key text while exposing separator break opportunities', () => {
    // Given
    const stableKey = 'holistic_research-page';

    // When
    const renderedKey = renderToStaticMarkup(createElement(StableKey, { value: stableKey }));
    const renderedText = renderedKey.replace(/<[^>]*>/gu, '');

    // Then
    expect(renderedKey).toContain(`aria-label="${stableKey}"`);
    expect(renderedText).toBe(stableKey);
    expect(renderedKey.match(/<wbr\/>/gu)).toHaveLength(2);
    expect(renderedKey).not.toContain('admin-stable-key-segment');
    expect(shellCss).toContain('code.admin-stable-key { white-space: nowrap; }');
  });

  it.each([
    ['digital_materials', '數位', '教材室', '數位教材室'],
    ['facdev', '教師', '發展中心', '教師發展中心'],
    ['ebm', '實證', '醫學中心', '實證醫學中心'],
    ['holistic', '全人照護', '教育中心', '全人照護教育中心'],
    ['holistic_research', '全人', '照護研究', '全人照護研究'],
  ] as const)('preserves the %s workspace title while keeping only its semantic tail atomic', (kind, lead, tail, label) => {
    // Given
    const expectedTitle = label;

    // When
    const renderedTitle = renderToStaticMarkup(createElement(AdminWorkspaceTitle, { isZh: true, kind, label }));
    const renderedText = renderedTitle.replace(/<[^>]*>/gu, '');

    // Then
    expect(renderedText).toBe(expectedTitle);
    expect(renderedTitle).toContain(`aria-label="${expectedTitle}"`);
    expect(renderedTitle.match(/<wbr\/>/gu)).toHaveLength(1);
    expect(renderedTitle).toContain(`${lead}<wbr/><span class="admin-workspace-title-tail">${tail}</span></span>`);
    expect(shellCss).toContain('.admin-workspace-title-tail { display: inline-block; max-inline-size: 100%; white-space: nowrap; }');
  });

  it('preserves the English workspace title rendering', () => {
    // Given
    const label = 'Digital materials';

    // When
    const renderedTitle = renderToStaticMarkup(createElement(AdminWorkspaceTitle, {
      isZh: false,
      kind: 'digital_materials',
      label,
    }));
    const renderedText = renderedTitle.replace(/<[^>]*>/gu, '');

    // Then
    expect(renderedText).toBe('Digital materials');
    expect(renderedTitle).toBe('<span class="admin-workspace-title-label" lang="en">Digital materials</span>');
  });

  it.each([
    ['digital_materials', ['管理', '數位教材室', '頁面的', '雙語內容。']],
    ['facdev', ['管理', '教師發展中心', '專頁內容與', '服務資訊。']],
    ['ebm', ['管理', '實證醫學中心', '專頁內容與', '教學資源。']],
    ['holistic', ['管理', '全人照護教育中心', '專頁與', '年度內容。']],
    ['holistic_research', ['管理', '全院全人照護研究', '論文與', '索引資料。']],
  ] as const)('preserves the %s description while grouping semantic phrases', (kind, phrases) => {
    // Given
    const canonicalDescription = CMS_DOCUMENT_METADATA[kind].description.zh;

    // When
    const renderedDescription = renderToStaticMarkup(createElement(AdminWorkspaceDescription, { kind }));
    const renderedText = renderedDescription.replace(/<[^>]*>/gu, '');

    // Then
    expect(renderedText).toBe(canonicalDescription);
    expect(phrases.join('')).toBe(canonicalDescription);
    expect(renderedDescription).toContain('class="admin-zh-copy" data-cjk-groups="true" lang="zh-Hant"');
    expect(renderedDescription.match(/class="admin-phrase-group"/gu)).toHaveLength(phrases.length);
    for (const phrase of phrases) {
      expect(renderedDescription).toContain(`<span class="admin-phrase-group" lang="zh-Hant">${phrase}</span>`);
    }
  });

  it('limits grouped descriptions to Chinese page workspaces', () => {
    // Given
    const pageKinds = ['digital_materials', 'facdev', 'ebm', 'holistic', 'holistic_research'] as const;
    const globalKinds = ['site_copy', 'centers', 'people', 'news', 'activities', 'kpis', 'honors'] as const;
    const workspaceViewSource = projectFile('src/pages/AdminDocumentWorkspaceView.tsx');

    // When
    const groupedKinds = Object.keys(PAGE_WORKSPACE_DESCRIPTION_PHRASES);

    // Then
    expect(groupedKinds).toEqual(pageKinds);
    expect(pageKinds.every((kind) => isPageWorkspaceDescriptionKind(kind))).toBe(true);
    expect(globalKinds.some((kind) => isPageWorkspaceDescriptionKind(kind))).toBe(false);
    expect(workspaceViewSource).toContain('isZh && isPageWorkspaceDescriptionKind(kind)');
    expect(workspaceViewSource).toContain(': (isZh ? metadata.description.zh : metadata.description.en);');
  });
});
