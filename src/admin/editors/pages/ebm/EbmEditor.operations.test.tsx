// @vitest-environment jsdom
import { cleanup, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import { renderEbmEditor } from './EbmEditor.testHarness';
import type { EbmPayload } from './types';

afterEach(cleanup);

function payload(view: ReturnType<typeof renderEbmEditor>): EbmPayload {
  return CMS_PAYLOAD_REGISTRY.ebm.editableSchema.parse(
    JSON.parse(view.getByTestId('ebm-editor-text').textContent ?? '{}'),
  );
}

function collection(view: ReturnType<typeof renderEbmEditor>, id: string): HTMLElement {
  const element = view.container.querySelector<HTMLElement>(`[data-editor-collection="${id}"]`);
  if (element === null) throw new TypeError(`Missing ${id} collection`);
  return element;
}

function action(root: HTMLElement, label: string): HTMLButtonElement {
  const button = Array.from(root.querySelectorAll('button')).find((candidate) => candidate.getAttribute('aria-label') === label || candidate.textContent === label);
  if (button === undefined) throw new TypeError(`Missing action: ${label}`);
  return button;
}

function confirm(label: string): void {
  const button = Array.from(document.querySelectorAll('button')).find((candidate) => candidate.textContent === label);
  if (button === undefined) throw new TypeError(`Missing confirmation: ${label}`);
  fireEvent.click(button);
}

type RootCollectionKey = 'kpis' | 'missions' | 'awardsLit' | 'awardsClin' | 'awardsTrans' | 'stages' | 'courseGroups';

function identities(value: EbmPayload, locale: 'zh' | 'en', key: RootCollectionKey): readonly string[] {
  switch (key) {
    case 'kpis':
      return value[locale].kpis.map((row) => row.label);
    case 'missions':
      return value[locale].missions.map((row) => row.title);
    case 'awardsLit':
    case 'awardsClin':
    case 'awardsTrans':
      return value[locale][key].map((row) => row.award);
    case 'stages':
      return value[locale].stages.map((row) => row.name);
    case 'courseGroups':
      return value[locale].courseGroups.map((row) => row.title);
  }
}

describe('EBM paired collection operations', () => {
  it('adds, moves, and removes every top-level family without changing pair order', () => {
    // Given
    const view = renderEbmEditor();
    const cases = [
      ['ebm-kpis', 'KPI', '確認刪除KPI', 'kpis'],
      ['ebm-missions', '任務', '確認刪除任務', 'missions'],
      ['ebm-awards-lit', '文獻查證組獎項', '確認刪除文獻查證組獎項', 'awardsLit'],
      ['ebm-awards-clin', '臨床應用組獎項', '確認刪除臨床應用組獎項', 'awardsClin'],
      ['ebm-awards-trans', '知識轉譯組獎項', '確認刪除知識轉譯組獎項', 'awardsTrans'],
      ['ebm-stages', '發展階段', '確認刪除發展階段', 'stages'],
      ['ebm-course-groups', '課程群組', '確認刪除課程群組', 'courseGroups'],
    ] as const satisfies readonly (readonly [string, string, string, RootCollectionKey])[];

    // When
    for (const [id, noun, confirmLabel, key] of cases) {
      const root = collection(view, id);
      const before = payload(view);
      const secondZh = identities(before, 'zh', key)[1];
      const secondEn = identities(before, 'en', key)[1];
      fireEvent.click(action(root, `下移第 1 個${noun}`));
      expect(identities(payload(view), 'zh', key)[0]).toBe(secondZh);
      expect(identities(payload(view), 'en', key)[0]).toBe(secondEn);
      fireEvent.click(action(root, `刪除第 1 個${noun}`));
      confirm(confirmLabel);
      fireEvent.click(action(root, noun === 'KPI' ? '新增 KPI' : `新增${noun}`));
    }

    // Then
    const emitted = view.getByTestId('ebm-editor-text').textContent ?? '';
    const finalPayload = CMS_PAYLOAD_REGISTRY.ebm.editableSchema.parse(JSON.parse(emitted));
    expect(JSON.stringify(finalPayload, null, 2)).toBe(emitted);
    for (const [, , , key] of cases) {
      expect(finalPayload.zh[key]).toHaveLength(2);
      expect(finalPayload.en[key]).toHaveLength(2);
    }
  });

  it('edits paired rows and removes optional note keys when cleared', () => {
    // Given
    const view = renderEbmEditor();

    // When
    fireEvent.change(view.getByLabelText('KPI 1 標籤（繁體中文）'), { target: { value: '修訂 KPI' } });
    fireEvent.change(view.getByLabelText('任務 1 標題（英文）'), { target: { value: 'Revised mission' } });
    fireEvent.change(view.getByLabelText('文獻查證組 1 備註（繁體中文）'), { target: { value: '新增備註' } });
    fireEvent.change(view.getByLabelText('文獻查證組 1 備註（繁體中文）'), { target: { value: '' } });
    fireEvent.change(view.getByLabelText('階段 1 名稱（繁體中文）'), { target: { value: '修訂階段' } });
    fireEvent.change(view.getByLabelText('課程群組 1 標題（英文）'), { target: { value: 'Revised courses' } });

    // Then
    const next = payload(view);
    expect(next.zh.kpis[0]?.label).toBe('修訂 KPI');
    expect(next.en.missions[0]?.title).toBe('Revised mission');
    expect(Object.keys(next.zh.awardsLit[0] ?? {})).toEqual(['sess', 'award']);
    expect(next.zh.stages[0]?.name).toBe('修訂階段');
    expect(next.en.courseGroups[0]?.title).toBe('Revised courses');
  });
});
