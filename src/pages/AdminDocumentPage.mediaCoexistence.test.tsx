// @vitest-environment jsdom

import { cleanup, fireEvent, type RenderResult, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DraftMediaClient } from '@/admin/media/types';
import { uploadedReference } from '@/admin/media/AdminMediaWorkbench.testHarness';
import { parseDraftPayload } from '@/admin/documents';
import { CMS_PAYLOAD_REGISTRY, type CmsPayloadByKind } from '@/content/contracts/registry';
import snapshot from '@/content/generated/cms-snapshot.json';
import { document, FakeDocumentRepository, revision } from '@/admin/workflows/testHarness';
import { renderDocumentRouteWithMedia } from './AdminDocumentPage.testHarness';

type PeoplePayload = CmsPayloadByKind['people'];

const source = snapshot.find((candidate) => candidate.kind === 'people');
if (source === undefined) throw new TypeError('Missing people fixture');
const fullPayload: PeoplePayload = CMS_PAYLOAD_REGISTRY.people.schema.parse(source.payload);
const minimalLocale = (locale: PeoplePayload['zh']): PeoplePayload['zh'] => ({
  ...locale,
  centerPeople: locale.centerPeople.slice(0, 1).map((center) => ({
    ...center,
    people: center.people.slice(0, 2),
  })),
  holisticInstructors: [],
  holisticSeedTeachers: [],
  holisticAiTeam: [],
  memberGroups: locale.memberGroups.map((group) => ({ ...group, people: [] })),
});
const INITIAL_PAYLOAD: PeoplePayload = CMS_PAYLOAD_REGISTRY.people.schema.parse({
  zh: minimalLocale(fullPayload.zh),
  en: minimalLocale(fullPayload.en),
});
const initialDraft = parseDraftPayload(JSON.stringify(INITIAL_PAYLOAD));
if (!initialDraft.ok) throw new TypeError('Invalid people fixture');
const INITIAL_JSON = initialDraft.payload;

function mediaClient(remove = vi.fn<DraftMediaClient['delete']>()): DraftMediaClient {
  return {
    upload: () => Promise.resolve({
      ok: true,
      outcome: 'created',
      reference: uploadedReference,
      sha256: 'a'.repeat(64),
    }),
    createPreview: () => Promise.resolve({
      ok: true,
      url: 'https://signed.example/portrait',
      expiresAt: Date.now() + 300_000,
    }),
    delete: remove,
  };
}

async function readyPeople(client: DraftMediaClient) {
  const repository = new FakeDocumentRepository();
  repository.listResults.push(Promise.resolve({ ok: true, value: [document('people')] }));
  repository.readResults.push(Promise.resolve({ ok: true, value: {
    document: document('people'), revisions: [revision({ payload: INITIAL_JSON })],
  } }));
  const view = renderDocumentRouteWithMedia(repository, client);
  await view.findByRole('heading', { name: '視覺媒體工作區' });
  return view;
}

function firstPortraitField(view: RenderResult): HTMLElement {
  const field = view.container.querySelector('[data-slot-key="zh.centerPeople[0].people[0].portrait"]');
  if (!(field instanceof HTMLElement)) throw new TypeError('Missing first portrait field');
  return field;
}

async function uploadFirstPortrait(view: RenderResult): Promise<void> {
  const input = firstPortraitField(view).querySelector('input[type="file"]');
  if (!(input instanceof HTMLInputElement)) throw new TypeError('Missing portrait input');
  const file = new File(['portrait'], 'portrait.webp', { type: 'image/webp' });
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: { 0: file, length: 1, item: () => file },
  });
  fireEvent.change(input);
  await within(firstPortraitField(view)).findByText('照片已連結至此欄位。');
}

async function editorPayload(view: RenderResult): Promise<PeoplePayload> {
  if (view.queryByRole('textbox', { name: '雙語 JSON 內容' }) === null) {
    fireEvent.click(view.getByRole('button', { name: '進階 JSON' }));
  }
  const editor = await view.findByRole('textbox', { name: '雙語 JSON 內容' });
  if (!(editor instanceof HTMLTextAreaElement)) throw new TypeError('Missing JSON editor');
  return CMS_PAYLOAD_REGISTRY.people.schema.parse(JSON.parse(editor.value));
}

function centerPeopleCollection(view: RenderResult): HTMLElement {
  const collection = view.container.querySelector('[data-editor-collection="center-0-people"]');
  if (!(collection instanceof HTMLElement)) throw new TypeError('Missing center people collection');
  return collection;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('AdminDocumentPage people media coexistence', () => {
  it('feeds upload through editorText and preserves the portrait through a structured edit and reorder', async () => {
    // Given
    const view = await readyPeople(mediaClient());
    await uploadFirstPortrait(view);
    expect(within(firstPortraitField(view)).getByText(uploadedReference.path)).toBeTruthy();
    const collection = centerPeopleCollection(view);
    const firstRow = collection.querySelector('[data-editor-item-index="0"]');
    if (!(firstRow instanceof HTMLElement)) throw new TypeError('Missing first person row');
    const expand = within(firstRow).queryByRole('button', { name: /^展開/u });
    if (expand !== null) fireEvent.click(expand);
    fireEvent.change(within(firstRow).getByRole('textbox', { name: '繁體中文職務' }), {
      target: { value: '媒體後編輯' },
    });

    // When
    fireEvent.click(within(collection).getByRole('button', { name: '下移第 1 位人員' }));

    // Then
    const payload = await editorPayload(view);
    expect(payload.zh.centerPeople[0]?.people[1]?.portrait).toEqual(uploadedReference);
    expect(payload.zh.centerPeople[0]?.people[1]?.duty).toBe('媒體後編輯');
    expect(view.getByText('尚有未儲存變更')).toBeTruthy();
  });

  it('unlinks through editorText and keeps the created object available for explicit cleanup', async () => {
    // Given
    const remove = vi.fn<DraftMediaClient['delete']>(() => Promise.resolve({ ok: true }));
    const view = await readyPeople(mediaClient(remove));
    await uploadFirstPortrait(view);

    // When
    fireEvent.click(within(firstPortraitField(view)).getByRole('button', { name: '取消連結' }));
    fireEvent.click(view.getByRole('button', { name: '確認取消連結' }));

    // Then
    expect((await editorPayload(view)).zh.centerPeople[0]?.people[0]).not.toHaveProperty('portrait');
    expect(remove).not.toHaveBeenCalled();
    const cleanupButton = view.getByRole('button', { name: '刪除未使用的上傳' });
    expect(cleanupButton.hasAttribute('disabled')).toBe(false);
    expect(view.getAllByText(uploadedReference.path).length).toBeGreaterThan(0);
  });

  it('deletes only the paired payload row and retains abandoned-upload cleanup ownership', async () => {
    // Given
    const remove = vi.fn<DraftMediaClient['delete']>(() => Promise.resolve({ ok: true }));
    const view = await readyPeople(mediaClient(remove));
    const removedZhName = INITIAL_PAYLOAD.zh.centerPeople[0]?.people[0]?.name;
    const removedEnName = INITIAL_PAYLOAD.en.centerPeople[0]?.people[0]?.name;
    await uploadFirstPortrait(view);
    const collection = centerPeopleCollection(view);

    // When
    fireEvent.click(within(collection).getByRole('button', { name: '刪除第 1 位人員' }));
    fireEvent.click(view.getByRole('button', { name: '確認刪除人員' }));

    // Then
    const payload = await editorPayload(view);
    expect(payload.zh.centerPeople[0]?.people.some((person) => person.name === removedZhName)).toBe(false);
    expect(payload.en.centerPeople[0]?.people.some((person) => person.name === removedEnName)).toBe(false);
    expect(remove).not.toHaveBeenCalled();
    await waitFor(() => expect(view.getAllByText(uploadedReference.path).length).toBeGreaterThan(0));
    expect(view.getByRole('button', { name: '刪除未使用的上傳' }).hasAttribute('disabled')).toBe(false);
  });
});
