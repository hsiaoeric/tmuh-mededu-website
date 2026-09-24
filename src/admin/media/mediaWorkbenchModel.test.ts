import { describe, expect, it } from 'vitest';
import snapshot from '@/content/generated/cms-snapshot.json';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import { CmsDocumentIdSchema } from '@/content/contracts/primitives';
import { DraftMediaReferenceSchema, MediaReferenceSchema } from '@/content/media';
import { draftMediaClaimsFor } from './draftMediaClaims';
import { createDraftMediaOwnershipScope } from './draftMediaOwnership';
import {
  changePortraitReference,
  deriveDraftDeleteGuard,
  deriveMediaWorkbench,
} from './index';

function fixturePayload(kind: 'people' | 'facdev'): unknown {
  const document = snapshot.find((candidate) => candidate.kind === kind);
  if (document === undefined) throw new TypeError(`Missing ${kind} fixture`);
  return document.payload;
}

function requireValue<Value>(value: Value | undefined): Value {
  if (value === undefined) throw new TypeError('Expected fixture value');
  return value;
}

const replacement = MediaReferenceSchema.parse({
  kind: 'local',
  path: 'assets/workbench-replacement.webp',
});

describe('media workbench portrait slots', () => {
  it('returns unsupported when the document kind has no portrait workbench', () => {
    // Given
    const editorText = JSON.stringify({ zh: {}, en: {} });

    // When
    const result = deriveMediaWorkbench('news', editorText);

    // Then
    expect(result).toEqual({ status: 'unsupported' });
  });

  it('preserves malformed editor text byte-for-byte when parsing fails', () => {
    // Given
    const editorText = '{\n  "zh":';

    // When
    const result = deriveMediaWorkbench('people', editorText);

    // Then
    expect(result).toEqual({
      status: 'invalid',
      reason: 'invalid-json',
      editorText,
    });
  });

  it('extracts every people portrait slot even when a portrait is absent', () => {
    // Given
    const payload = CMS_PAYLOAD_REGISTRY.people.schema.parse(fixturePayload('people'));
    const firstGroup = requireValue(payload.zh.centerPeople[0]);
    const firstPerson = requireValue(firstGroup.people[0]);
    const personWithoutPortrait = { ...firstPerson };
    delete personWithoutPortrait.portrait;
    const changedPayload = {
      ...payload,
      zh: {
        ...payload.zh,
        centerPeople: [
          {
            ...firstGroup,
            people: [personWithoutPortrait, ...firstGroup.people.slice(1)],
          },
          ...payload.zh.centerPeople.slice(1),
        ],
      },
    };

    // When
    const result = deriveMediaWorkbench('people', JSON.stringify(changedPayload));

    // Then
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new TypeError('Expected ready workbench');
    const slot = result.slots.find(
      (candidate) => candidate.key === 'zh.centerPeople[0].people[0].portrait',
    );
    expect(slot).toMatchObject({
      locale: 'zh',
      personName: firstPerson.name,
      reference: null,
    });
  });

  it('updates only the selected people portrait and serializes deterministically', () => {
    // Given
    const payload = CMS_PAYLOAD_REGISTRY.people.schema.parse(fixturePayload('people'));
    const editorText = JSON.stringify(payload, null, 4);
    const workbench = deriveMediaWorkbench('people', editorText);
    if (workbench.status !== 'ready') throw new TypeError('Expected ready workbench');
    const slot = requireValue(workbench.slots.find(
      (candidate) => candidate.key === 'en.holisticSeedTeachers[0].portrait',
    ));

    // When
    const result = changePortraitReference({
      kind: 'people',
      editorText,
      slot,
      reference: replacement,
    });

    // Then
    expect(result.ok).toBe(true);
    if (!result.ok) throw new TypeError('Expected successful portrait update');
    const updated = CMS_PAYLOAD_REGISTRY.people.schema.parse(JSON.parse(result.editorText));
    expect(updated.en.holisticSeedTeachers[0]?.portrait).toEqual(replacement);
    expect(updated.zh).toEqual(payload.zh);
    expect(updated.en.holisticInstructors).toEqual(payload.en.holisticInstructors);
    expect(result.editorText).toBe(`${JSON.stringify(updated, null, 2)}\n`);
    expect(editorText).toBe(JSON.stringify(payload, null, 4));
  });

  it('unlinks a facdev group lead portrait without deleting sibling content', () => {
    // Given
    const payload = CMS_PAYLOAD_REGISTRY.facdev.schema.parse(fixturePayload('facdev'));
    const editorText = JSON.stringify(payload);
    const workbench = deriveMediaWorkbench('facdev', editorText);
    if (workbench.status !== 'ready') throw new TypeError('Expected ready workbench');
    const slot = requireValue(workbench.slots.find(
      (candidate) => candidate.key === 'zh.groups[0].lead.portrait',
    ));

    // When
    const result = changePortraitReference({
      kind: 'facdev',
      editorText,
      slot,
      reference: null,
    });

    // Then
    expect(result.ok).toBe(true);
    if (!result.ok) throw new TypeError('Expected successful portrait update');
    const updated = CMS_PAYLOAD_REGISTRY.facdev.schema.parse(JSON.parse(result.editorText));
    expect(updated.zh.groups[0]?.lead.portrait).toBeUndefined();
    expect(updated.zh.groups[0]?.name).toBe(payload.zh.groups[0]?.name);
    expect(updated.en).toEqual(payload.en);
  });
});

describe('draft deletion guards', () => {
  it('blocks deletion when the exact path remains in either editor or saved draft', () => {
    // Given
    const reference = DraftMediaReferenceSchema.parse({
      kind: 'draft',
      bucket: 'draft-media',
      path: '11111111-1111-4111-8111-111111111111/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp',
    });
    const claims = draftMediaClaimsFor(createDraftMediaOwnershipScope());
    const documentId = CmsDocumentIdSchema.parse('22222222-2222-4222-8222-222222222222');
    claims.updateEditor(documentId, JSON.stringify({ portrait: reference }));
    claims.updateSaved(documentId, { nested: { portrait: reference } });

    // When
    const result = deriveDraftDeleteGuard({
      claims,
      editorText: JSON.stringify({ portrait: reference }),
      savedDraftPayload: { nested: { portrait: reference } },
      reference,
    });

    // Then
    expect(result).toEqual({
      referencedByEditor: true,
      referencedBySavedDraft: true,
    });
  });

  it('blocks deletion pessimistically when current editor text is malformed', () => {
    // Given
    const reference = DraftMediaReferenceSchema.parse({
      kind: 'draft',
      bucket: 'draft-media',
      path: '11111111-1111-4111-8111-111111111111/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.jpg',
    });
    const claims = draftMediaClaimsFor(createDraftMediaOwnershipScope());
    const documentId = CmsDocumentIdSchema.parse('22222222-2222-4222-8222-222222222222');
    claims.updateEditor(documentId, '{"portrait":');

    // When
    const result = deriveDraftDeleteGuard({
      claims,
      editorText: '{"portrait":',
      savedDraftPayload: null,
      reference,
    });

    // Then
    expect(result).toEqual({
      referencedByEditor: true,
      referencedBySavedDraft: false,
    });
  });
});
