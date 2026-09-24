import { describe, expect, expectTypeOf, it } from 'vitest';
import snapshot from '@/content/generated/cms-snapshot.json';
import {
  CMS_DOCUMENT_KINDS,
  type CmsDocumentKind,
} from '@/content/contracts/kinds';
import { CMS_PAYLOAD_REGISTRY, type CmsPayloadByKind } from '@/content/contracts/registry';
import {
  emitStructuredEditorText as emitGlobalEditorText,
  parseStructuredEditorText as parseGlobalEditorText,
} from '@/admin/editors/shared';
import {
  GLOBAL_EDITOR_KINDS,
  isGlobalEditorKind,
  type GlobalEditorKind,
} from '../global/types';

function fixtureText(kind: GlobalEditorKind): string {
  const fixture = snapshot.find((candidate) => candidate.kind === kind);
  if (fixture === undefined) throw new TypeError(`Missing ${kind} fixture`);
  return JSON.stringify(fixture.payload);
}

function cmsFixtureText(kind: CmsDocumentKind): string {
  const fixture = snapshot.find((candidate) => candidate.kind === kind);
  if (fixture === undefined) throw new TypeError(`Missing ${kind} fixture`);
  return JSON.stringify(fixture.payload);
}

describe('structured editor codec', () => {
  it('recognizes exactly the seven global editor kinds', () => {
    expect(GLOBAL_EDITOR_KINDS.every(isGlobalEditorKind)).toBe(true);
    expect(['facdev', '', null, 7].some(isGlobalEditorKind)).toBe(false);
  });

  it.each(GLOBAL_EDITOR_KINDS)('parses the generated %s fixture without loss', (kind) => {
    // Given
    const editorText = fixtureText(kind);

    // When
    const result = parseGlobalEditorText(kind, editorText);

    // Then
    expect(result.status).toBe('valid');
    if (result.status !== 'valid') return;
    expect(result.payload).toEqual(JSON.parse(editorText));
  });

  it.each(CMS_DOCUMENT_KINDS)('round-trips the generated %s fixture through the neutral codec', (kind) => {
    const parsed = parseGlobalEditorText(kind, cmsFixtureText(kind));

    expect(parsed.status).toBe('valid');
    if (parsed.status !== 'valid') return;
    expect(emitGlobalEditorText(kind, parsed.payload)).toBe(
      JSON.stringify(parsed.payload, null, 2),
    );
  });

  it('infers the exact payload type from every kind', () => {
    const siteCopy = parseGlobalEditorText('site_copy', fixtureText('site_copy'));
    const centers = parseGlobalEditorText('centers', fixtureText('centers'));
    const people = parseGlobalEditorText('people', fixtureText('people'));
    const news = parseGlobalEditorText('news', fixtureText('news'));
    const activities = parseGlobalEditorText('activities', fixtureText('activities'));
    const kpis = parseGlobalEditorText('kpis', fixtureText('kpis'));
    const honors = parseGlobalEditorText('honors', fixtureText('honors'));

    if (siteCopy.status === 'valid') expectTypeOf(siteCopy.payload).toEqualTypeOf<CmsPayloadByKind['site_copy']>();
    if (centers.status === 'valid') expectTypeOf(centers.payload).toEqualTypeOf<CmsPayloadByKind['centers']>();
    if (people.status === 'valid') expectTypeOf(people.payload).toEqualTypeOf<CmsPayloadByKind['people']>();
    if (news.status === 'valid') expectTypeOf(news.payload).toEqualTypeOf<CmsPayloadByKind['news']>();
    if (activities.status === 'valid') expectTypeOf(activities.payload).toEqualTypeOf<CmsPayloadByKind['activities']>();
    if (kpis.status === 'valid') expectTypeOf(kpis.payload).toEqualTypeOf<CmsPayloadByKind['kpis']>();
    if (honors.status === 'valid') expectTypeOf(honors.payload).toEqualTypeOf<CmsPayloadByKind['honors']>();
  });

  it('preserves and classifies malformed JSON', () => {
    const editorText = '{\n  "zh":';

    const result = parseGlobalEditorText('site_copy', editorText);

    expect(result).toEqual({
      status: 'malformed-json', kind: 'site_copy', editorText,
      issues: [{ path: [], message: 'Malformed JSON', code: 'invalid_json' }],
    });
  });

  it.each(['[]', 'null', '"text"', '42'])('preserves and classifies a non-object root: %s', (editorText) => {
    const result = parseGlobalEditorText('kpis', editorText);

    expect(result).toEqual({
      status: 'invalid-root', kind: 'kpis', editorText,
      issues: [{ path: [], message: 'Expected a JSON object', code: 'invalid_type' }],
    });
  });

  it('preserves a missing locale and its schema path', () => {
    const payload = CMS_PAYLOAD_REGISTRY.site_copy.schema.parse(JSON.parse(fixtureText('site_copy')));
    const editorText = JSON.stringify({ zh: payload.zh });

    const result = parseGlobalEditorText('site_copy', editorText);

    expect(result.status).toBe('invalid-payload');
    if (result.status !== 'invalid-payload') return;
    expect(result.editorText).toBe(editorText);
    expect(result.issues.map((issue) => issue.path)).toContainEqual(['en']);
    expect(result.issues.find((issue) => issue.path[0] === 'en')?.code).toBe('invalid_type');
    expect(result.issues.find((issue) => issue.path[0] === 'en')?.message).toMatch(/^Invalid input/);
  });

  it('preserves missing required nested fields and their schema paths', () => {
    const editorText = '{"zh":{},"en":{}}';

    const result = parseGlobalEditorText('kpis', editorText);

    expect(result.status).toBe('invalid-payload');
    if (result.status !== 'invalid-payload') return;
    expect(result.editorText).toBe(editorText);
    expect(result.issues.map((issue) => issue.path)).toContainEqual(['zh', 'items']);
  });

  it('delegates duplicate-ID checks without losing the indexed path', () => {
    const branch = { id: 'same', name: '', description: '' };
    const center = {
      id: 'same', name: '', intro: '', contact: '', ext: '',
      branches: [branch, branch],
    };
    const locale = { centers: [center, center] };
    const editorText = JSON.stringify({ zh: locale, en: locale });

    const result = parseGlobalEditorText('centers', editorText);

    expect(result.status).toBe('editable-invalid');
    if (result.status !== 'editable-invalid') return;
    expect(result.issues.map((issue) => issue.path)).toContainEqual(['zh', 'centers', 1, 'id']);
    expect(result.issues.map((issue) => issue.path)).toContainEqual([
      'zh', 'centers', 0, 'branches', 1, 'id',
    ]);
  });

  it('delegates unsafe-value checks without changing source text', () => {
    const activity = {
      id: 'activity', sortDate: '2026-07-22',
      cat: '', date: 'Wed 2026/07/22 12:30–13:30', enrolled: '',
      link: 'javascript:alert(1)', place: '', speaker: '', status: '', title: '', topic: '',
    };
    const locale = { department: [activity], holistic: [] };
    const editorText = JSON.stringify({ zh: locale, en: locale });

    const result = parseGlobalEditorText('activities', editorText);

    expect(result.status).toBe('editable-invalid');
    if (result.status !== 'editable-invalid') return;
    expect(result.editorText).toBe(editorText);
    expect(result.issues.map((issue) => issue.path)).toContainEqual(['zh', 'department', 0, 'link']);
  });

  it('rejects unknown strict keys instead of stripping them', () => {
    const payload = CMS_PAYLOAD_REGISTRY.honors.schema.parse(JSON.parse(fixtureText('honors')));
    const editorText = JSON.stringify({ ...payload, unexpected: true });

    const result = parseGlobalEditorText('honors', editorText);

    expect(result.status).toBe('invalid-payload');
    if (result.status !== 'invalid-payload') return;
    expect(result.editorText).toBe(editorText);
    expect(result.issues.some((issue) => issue.path.length === 0)).toBe(true);
  });

  it.each(GLOBAL_EDITOR_KINDS)('emits deterministic lossless %s JSON only when explicit', (kind) => {
    const parsed = parseGlobalEditorText(kind, fixtureText(kind));
    expect(parsed.status).toBe('valid');
    if (parsed.status !== 'valid') return;

    const emitted = emitGlobalEditorText(kind, parsed.payload);
    const reparsed = parseGlobalEditorText(kind, emitted);

    expect(emitted).toBe(JSON.stringify(parsed.payload, null, 2));
    expect(emitted.endsWith('\n')).toBe(false);
    expect(reparsed.status).toBe('valid');
    if (reparsed.status === 'valid') expect(reparsed.payload).toEqual(parsed.payload);
  });

  it('preserves existing object-key order through parse and emit', () => {
    const fixture = CMS_PAYLOAD_REGISTRY.kpis.schema.parse(JSON.parse(fixtureText('kpis')));
    const payload: CmsPayloadByKind['kpis'] = {
      en: fixture.en,
      zh: fixture.zh,
    };
    const editorText = JSON.stringify(payload);

    const parsed = parseGlobalEditorText('kpis', editorText);

    expect(parsed.status).toBe('valid');
    if (parsed.status !== 'valid') return;
    expect(Object.keys(parsed.payload)).toEqual(['en', 'zh']);
    expect(parsed.payload.en.items).toEqual(payload.en.items);
    expect(emitGlobalEditorText('kpis', parsed.payload)).toBe(JSON.stringify(payload, null, 2));
  });

  it('accepts a non-global CMS document kind through the neutral codec seam', () => {
    const kind: CmsDocumentKind = 'facdev';
    const fixture = snapshot.find((candidate) => candidate.kind === kind);
    if (fixture === undefined) throw new TypeError(`Missing ${kind} fixture`);
    const editorText = JSON.stringify(fixture.payload);

    const parsed = parseGlobalEditorText(kind, editorText);

    expect(parsed.status).toBe('valid');
    if (parsed.status !== 'valid') return;
    expect(emitGlobalEditorText(kind, parsed.payload)).toBe(
      JSON.stringify(parsed.payload, null, 2),
    );
  });
});
