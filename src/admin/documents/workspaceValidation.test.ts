import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { Json } from '@/content/database.types';
import { createDocumentWorkspace } from './workspaceState';
import {
  getWorkspaceCapabilities,
  parseDraftPayload,
} from './workspaceValidation';
import { CmsDocumentIdSchema, CmsRevisionIdSchema } from '@/content/contracts/primitives';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import { CENTER_IDS } from '@/data/centerIdentities';
import type { GlobalEditorKind } from '@/admin/editors/global/types';
import snapshot from '@/content/generated/cms-snapshot.json';
import { document, revision } from '@/admin/workflows/testHarness';

const DOCUMENT_ID = CmsDocumentIdSchema.parse('11111111-1111-4111-8111-111111111111');
const REVISION_ID = CmsRevisionIdSchema.parse('22222222-2222-4222-8222-222222222222');
const DRAFT_PORTRAIT = {
  kind: 'draft',
  bucket: 'draft-media',
  path: `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/${'a'.repeat(64)}.jpg`,
} as const;

function workspace(editorText: string, payload: Json = {}) {
  const ready = createDocumentWorkspace({
    document: {
      id: DOCUMENT_ID,
      kind: 'people',
      stableKey: 'directory',
      createdAt: '2026-08-22T01:00:00Z',
      createdBy: null,
      updatedAt: '2026-08-22T02:00:00Z',
      updatedBy: null,
    },
    revisions: [{
      id: REVISION_ID,
      documentId: DOCUMENT_ID,
      version: 1,
      editVersion: 2,
      status: 'draft',
      payload,
      createdAt: '2026-08-22T01:00:00Z',
      createdBy: null,
      updatedAt: '2026-08-22T02:00:00Z',
      updatedBy: null,
      publishedAt: null,
      publishedBy: null,
      archivedAt: null,
      archivedBy: null,
      publicationExpectedEditVersion: null,
      publicationReplacements: null,
      publicationActorId: null,
    }],
  });
  return { ...ready, editorText };
}

function peoplePayload(portrait?: Json) {
  const person = (id: string, name: string, alternateName: string) => ({
    id,
    name, alternateName, roleKey: 'director', role: 'Director',
    department: 'Department', slug: 'portrait', hubId: '', duty: '', ext: '', email: '',
    ...(portrait === undefined ? {} : { portrait }),
  });
  const locale = (lang: 'zh' | 'en') => {
    const localizedPerson = (id: string) => lang === 'zh'
      ? person(id, '姓名', 'Name')
      : person(id, 'Name', '姓名');
    return {
    centerPeople: CENTER_IDS.map((centerId) => ({
      centerId,
      people: [localizedPerson(`${centerId}-person`)],
    })),
    holisticInstructors: [], holisticSeedTeachers: [], holisticAiTeam: [],
    memberGroups: [
      { id: 'department_advisors', people: [localizedPerson('advisor-person')] },
      { id: 'teaching_attendings', people: [localizedPerson('attending-person')] },
      { id: 'teaching_allied_health', people: [localizedPerson('allied-health-person')] },
    ],
  };
  };
  return { zh: locale('zh'), en: locale('en') };
}

function globalPayload(kind: GlobalEditorKind): Json {
  const source = snapshot.find((candidate) => candidate.kind === kind);
  if (source === undefined) throw new TypeError(`Missing ${kind} fixture`);
  return structuredClone(source.payload);
}

function globalWorkspace(kind: GlobalEditorKind, baseline: unknown, editorPayload: unknown) {
  const ready = createDocumentWorkspace({
    document: document(kind),
    revisions: [revision({ payload: z.json().parse(baseline) })],
  });
  return { ...ready, editorText: JSON.stringify(editorPayload, null, 2) };
}

describe('document workspace validation', () => {
  it.each(['[]', 'null', '"text"', '{broken'])('rejects non-object draft JSON: %s', (editorText) => {
    // Given
    const input = editorText;

    // When
    const result = parseDraftPayload(input);

    // Then
    expect(result).toEqual({ ok: false, failure: { kind: 'invalid-json-object' } });
  });

  it('rejects saving a top-level object outside the document contract', () => {
    // Given
    const state = workspace('{"draftOnly":true}');

    // When
    const capabilities = getWorkspaceCapabilities(state, { status: 'idle' });

    // Then
    expect(capabilities.canSave).toBe(false);
    expect(capabilities.canPublish).toBe(false);
  });

  it('keeps a semantic-invalid global payload unsaveable and unpublishable', () => {
    const valid = peoplePayload();
    const locale = valid.zh;
    const invalid = {
      zh: { ...locale, centerPeople: [...locale.centerPeople, ...locale.centerPeople] },
      en: { ...locale, centerPeople: [...locale.centerPeople, ...locale.centerPeople] },
    };
    const state = workspace(JSON.stringify(invalid), valid);

    const capabilities = getWorkspaceCapabilities(state);

    expect(capabilities.canSave).toBe(false);
    expect(capabilities.canPublish).toBe(false);
  });

  it.each(['news', 'activities'] as const)('blocks wrong-locale %s dates until inline correction', (kind) => {
    // Given
    const baseline = CMS_PAYLOAD_REGISTRY[kind].schema.parse(globalPayload(kind));
    const wrongLocale = kind === 'news'
      ? {
          ...baseline,
          zh: {
            ...baseline.zh,
            department: baseline.zh.department.map((row, index) => index === 0
              ? { ...row, publishedOn: '2026-08-28' }
              : row),
          },
        }
      : {
          ...baseline,
          zh: {
            ...baseline.zh,
            holistic: baseline.zh.holistic.map((row, index) => index === 0
              ? { ...row, date: 'Wed 2026/07/22 12:30–13:30' }
              : row),
          },
        };
    const corrected = kind === 'news'
      ? {
          ...baseline,
          zh: { ...baseline.zh, department: baseline.zh.department.map((row, index) => index === 0 ? { ...row, publishedOn: '2026-08-28' } : row) },
          en: { ...baseline.en, department: baseline.en.department.map((row, index) => index === 0 ? { ...row, publishedOn: '2026-08-28' } : row) },
        }
      : {
          ...baseline,
          zh: {
            ...baseline.zh,
            holistic: baseline.zh.holistic.map((row, index) => index === 0
              ? { ...row, date: '2026/07/22（三）13:00–14:00' }
              : row),
          },
        };

    // When
    const invalidCapabilities = getWorkspaceCapabilities(globalWorkspace(kind, baseline, wrongLocale));
    const correctedDirtyCapabilities = getWorkspaceCapabilities(globalWorkspace(kind, baseline, corrected));
    const correctedCleanCapabilities = getWorkspaceCapabilities(globalWorkspace(kind, corrected, corrected));

    // Then
    expect(invalidCapabilities.canSave).toBe(false);
    expect(invalidCapabilities.canPublish).toBe(false);
    expect(correctedDirtyCapabilities.canSave).toBe(true);
    expect(correctedDirtyCapabilities.canPublish).toBe(false);
    expect(correctedCleanCapabilities.canPublish).toBe(true);
  });

  it('disables publish and archive while dirty', () => {
    // Given
    const state = workspace('{"changed":true}');

    // When
    const capabilities = getWorkspaceCapabilities(state, { status: 'idle' });

    // Then
    expect(capabilities.canPublish).toBe(false);
    expect(capabilities.canArchive).toBe(false);
  });

  it('disables every mutation while an operation is active', () => {
    // Given
    const state = workspace('{}');

    // When
    const capabilities = getWorkspaceCapabilities(state, {
      status: 'saving',
      mutationId: 1,
      submittedEditorText: state.editorText,
    });

    // Then
    expect(capabilities).toEqual({
      canSave: false,
      canPublish: false,
      canArchive: false,
      draftPayload: null,
    });
  });

  it('disables every mutation when only an archived reference remains', () => {
    // Given
    const archived = createDocumentWorkspace({
      document: document('news'),
      revisions: [revision({ status: 'archived', archivedAt: '2026-08-28T01:00:00Z' })],
    });

    // When
    const capabilities = getWorkspaceCapabilities(archived);

    // Then
    expect(capabilities).toEqual({
      canSave: false,
      canPublish: false,
      canArchive: false,
      draftPayload: null,
    });
  });

  it('allows a saved general payload whose only published-schema failure is a valid draft reference', () => {
    // Given
    const payload = peoplePayload(DRAFT_PORTRAIT);
    const state = workspace(JSON.stringify(payload, null, 2), payload);

    // When
    const capabilities = getWorkspaceCapabilities(state);

    // Then
    expect(capabilities.canPublish).toBe(true);
    expect(capabilities.draftPayload).toEqual(payload);
  });

  it('keeps unrelated published-person failures blocked when a valid draft reference exists', () => {
    // Given
    const payload = peoplePayload(DRAFT_PORTRAIT);
    const invalid = structuredClone(payload);
    const zhPerson = invalid.zh.centerPeople[0]?.people[0];
    const enPerson = invalid.en.centerPeople[0]?.people[0];
    if (zhPerson === undefined || enPerson === undefined) throw new TypeError('Missing person fixture');
    zhPerson.roleKey = 'unknown';
    enPerson.roleKey = 'unknown';
    const state = workspace(JSON.stringify(invalid, null, 2), invalid);

    // When
    const capabilities = getWorkspaceCapabilities(state);

    // Then
    expect(capabilities.canPublish).toBe(false);
    expect(capabilities.draftPayload).toEqual(invalid);
  });

  it('blocks malformed draft-like portraits instead of substituting them for publication validation', () => {
    // Given
    const payload = peoplePayload({ ...DRAFT_PORTRAIT, path: 'malformed' });
    const state = workspace(JSON.stringify(payload, null, 2), payload);

    // When
    const capabilities = getWorkspaceCapabilities(state);

    // Then
    expect(capabilities.canPublish).toBe(false);
  });

  it('allows a saved published-schema payload without draft media', () => {
    // Given
    const payload = peoplePayload();
    const state = workspace(JSON.stringify(payload, null, 2), payload);

    // When
    const capabilities = getWorkspaceCapabilities(state);

    // Then
    expect(capabilities.canPublish).toBe(true);
  });

  it('blocks dirty and malformed general payloads even when they contain draft-like data', () => {
    // Given
    const valid = peoplePayload(DRAFT_PORTRAIT);
    const dirty = workspace(`${JSON.stringify(valid, null, 2)}\n`, valid);
    const malformed = workspace('{"draftOnly":true}', { draftOnly: true });

    // When
    const results = [getWorkspaceCapabilities(dirty), getWorkspaceCapabilities(malformed)];

    // Then
    expect(results.map((result) => result.canPublish)).toEqual([false, false]);
  });
});
