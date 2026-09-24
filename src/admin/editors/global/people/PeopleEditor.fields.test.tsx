// @vitest-environment jsdom
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import {
  compactFixture,
  ControlledPeopleEditor,
  type PeoplePayload,
} from './PeopleEditor.testHarness';

afterEach(cleanup);

function renderedPayload(view: ReturnType<typeof render>): PeoplePayload {
  return CMS_PAYLOAD_REGISTRY.people.schema.parse(
    JSON.parse(view.getByTestId('people-payload').textContent ?? '{}'),
  );
}

describe('people editor person fields', () => {
  it('edits every scalar field exactly and preserves the portrait reference', () => {
    // Given
    const view = render(<ControlledPeopleEditor />);
    const list = view.container.querySelector('[data-editor-collection="holistic-instructors"]');
    const item = list?.querySelector('[data-editor-item-index="0"]');
    if (!(item instanceof HTMLElement)) throw new TypeError('Missing instructor editor row');
    const row = within(item);
    const fields = [
      ['繁體中文姓名', '測試姓名'],
      ['English name', 'Test Name'],
      ['繁體中文別名', 'Test Name'],
      ['English alternate name', '測試姓名'],
      ['繁體中文職稱鍵', 'advisor'],
      ['English role key', 'advisor'],
      ['繁體中文職稱', '顧問'],
      ['English role', 'Advisor'],
      ['繁體中文部門', '測試部門'],
      ['English department', 'Test Department'],
      ['繁體中文照片代稱', 'test-slug'],
      ['English portrait slug', 'test-slug'],
      ['繁體中文學術檔案 ID', 'hub'],
      ['English academic profile ID', 'hub'],
      ['繁體中文職務', '中文職務'],
      ['English duty', 'English duty'],
      ['繁體中文分機', '1001'],
      ['English extension', '1001'],
      ['繁體中文電子郵件', 'person@example.test'],
      ['English email', 'person@example.test'],
    ] as const;
    const before = compactFixture().zh.holisticInstructors[0]?.portrait;

    // When
    for (const [label, value] of fields) {
      fireEvent.change(row.getByRole(label.includes('職稱鍵') || label.includes('role key') ? 'combobox' : 'textbox', { name: label }), {
        target: { value },
      });
    }

    // Then
    const payload = renderedPayload(view);
    expect(payload.zh.holisticInstructors[0]).toMatchObject({
      name: '測試姓名', alternateName: 'Test Name', roleKey: 'advisor', role: '顧問',
      department: '測試部門', slug: 'test-slug', hubId: 'hub', duty: '中文職務',
      ext: '1001', email: 'person@example.test',
    });
    expect(payload.en.holisticInstructors[0]).toMatchObject({
      name: 'Test Name', alternateName: '測試姓名', roleKey: 'advisor', role: 'Advisor',
      department: 'Test Department', slug: 'test-slug', hubId: 'hub', duty: 'English duty',
      ext: '1001', email: 'person@example.test',
    });
    expect(payload.zh.holisticInstructors[0]?.portrait).toEqual(before);
  });

  it('adds a new paired person without a portrait', async () => {
    // Given
    const view = render(<ControlledPeopleEditor />);
    const list = view.container.querySelector('[data-editor-collection="holistic-instructors"]');
    if (!(list instanceof HTMLElement)) throw new TypeError('Missing instructor collection');

    // When
    fireEvent.click(within(list).getByRole('button', { name: '新增人員' }));

    // Then
    const payload = renderedPayload(view);
    expect(payload.zh.holisticInstructors).toHaveLength(2);
    expect(payload.en.holisticInstructors).toHaveLength(2);
    expect(payload.zh.holisticInstructors[1]).not.toHaveProperty('portrait');
    expect(payload.en.holisticInstructors[1]).not.toHaveProperty('portrait');
  });
});
