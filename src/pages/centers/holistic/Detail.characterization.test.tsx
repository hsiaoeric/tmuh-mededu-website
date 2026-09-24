// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SiteProvider } from '@/app/site';
import { ContentProvider } from '@/content/ContentProvider';
import { parseSupabaseConfiguration } from '@/content/env';
import { HolisticDetail } from './Detail';

vi.mock('@/motion/Reveal', () => ({
  Reveal: ({ children, className }: { readonly children: ReactNode; readonly className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('@/motion/SplitLines', () => ({
  SplitLines: ({ children, className }: { readonly children: ReactNode; readonly className?: string }) => (
    <h1 className={className}>{children}</h1>
  ),
}));

const DISABLED = parseSupabaseConfiguration({});

function renderDetail(path: string, lang: 'zh' | 'en' = 'zh') {
  localStorage.setItem('tmuh.lang', lang);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SiteProvider>
        <ContentProvider configuration={DISABLED}>
          <Routes>
            <Route path="/centers/holistic-care/:kind/:year" element={<HolisticDetail />} />
          </Routes>
        </ContentProvider>
      </SiteProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(cleanup);

describe('HolisticDetail snapshot characterization', () => {
  it('preserves the symposium detail route', () => {
    // Given / When
    const view = renderDetail('/centers/holistic-care/symposia/2024');

    // Then
    expect(view.getByRole('heading', { level: 1 }).textContent).toBe('全人照護核心能力研討會');
    expect(view.getByText('2024/06/15')).toBeTruthy();
    expect(view.getByText('08:30–12:30')).toBeTruthy();
    expect(view.queryByText(/滿意度/u)).toBeNull();
  });

  it('preserves research paper and author ordering in both languages', () => {
    // Given / When
    const zh = renderDetail('/centers/holistic-care/research/2025');

    // Then
    expect([...zh.container.querySelectorAll('.italic')].map((node) => node.textContent)).toEqual([
      'Medical Teacher', 'Medical Education', 'MedEdPublish',
    ]);
    expect([...zh.container.querySelectorAll('.tag')].map((node) => node.textContent)).toEqual([
      '吳人傑', '吳人傑', '廖若帆',
    ]);
    cleanup();
    const en = renderDetail('/centers/holistic-care/research/2025', 'en');
    expect([...en.container.querySelectorAll('.tag')].map((node) => node.textContent)).toEqual([
      'Jen-Chieh Wu', 'Jen-Chieh Wu', 'Faith Ruofan Liao',
    ]);
  });
});
