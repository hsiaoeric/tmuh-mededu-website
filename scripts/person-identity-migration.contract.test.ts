import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  new URL('../supabase/migrations/20260908000100_align_person_identity_contract.sql', import.meta.url),
  'utf8',
);
const pgTap = readFileSync(
  new URL('../supabase/tests/database/013_person_identity_contract.test.sql', import.meta.url),
  'utf8',
);

const PERSON_COLLECTION_PATHS = [
  'centerPeople',
  'holisticInstructors',
  'holisticSeedTeachers',
  'holisticAiTeam',
  'memberGroups',
] as const;
const ROLE_KEYS = [
  'director', 'deputy', 'cadmin', 'instructor', 'seed', 'vp', 'lead', 'ddir',
  'ddep', 'head', 'spec', 'pm', 'advisor', 'ai', 'eng',
] as const;
const INVALID_CASES = [
  { name: 'people_missing_id', input: "payload #- '{zh,centerPeople,0,people,0,id}' #- '{en,centerPeople,0,people,0,id}'" },
  { name: 'people_blank_id', input: "'{en,centerPeople,0,people,0,id}', '\"\"'" },
  { name: 'people_non_string_id', input: "'{en,centerPeople,0,people,0,id}', '42'" },
  { name: 'people_duplicate_id', input: "'{en,centerPeople,0,people,1}', payload #> '{en,centerPeople,0,people,0}'" },
  { name: 'people_divergent_id', input: "'{en,centerPeople,0,people,0,id}', '\"different-person\"'" },
  { name: 'people_invalid_role', input: "'{en,centerPeople,0,people,0,roleKey}', '\"unknown\"'" },
  { name: 'people_role_key_parity', input: "'{en,centerPeople,0,people,0,roleKey}', '\"advisor\"'" },
  { name: 'people_slug_parity', input: "'{en,centerPeople,0,people,0,slug}', '\"different-slug\"'" },
  { name: 'people_hub_id_parity', input: "'{en,centerPeople,0,people,0,hubId}', '\"different-hub\"'" },
  { name: 'people_ext_parity', input: "'{en,centerPeople,0,people,0,ext}', '\"9999\"'" },
  { name: 'people_email_parity', input: "'{en,centerPeople,0,people,0,email}', '\"different@example.test\"'" },
  { name: 'people_english_alternate_name_parity', input: "'{en,centerPeople,0,people,0,alternateName}', '\"錯誤姓名\"'" },
  { name: 'people_chinese_alternate_name_parity', input: "'{zh,centerPeople,0,people,0,alternateName}', '\"Wrong name\"'" },
  { name: 'people_unequal_array', input: "payload #- '{en,centerPeople,0,people,0}'" },
  { name: 'people_reordered_array', input: "'{en,centerPeople,0,people,1}', payload #> '{en,centerPeople,0,people,0}'" },
] as const;
const MIGRATION_WIRING = [
  'update public.cms_revisions as revisions',
  'public.cms_upgrade_person_identity_payload(documents.kind, revisions.payload)',
  "paired := public.cms_upgrade_bilingual_person_array( zh_groups #> array[group_index::text, 'people']",
  "paired := public.cms_upgrade_bilingual_person_array( candidate #> array['zh', collection_name]",
  'return public.cms_jsonb_bilingual_person_arrays_are_valid(zh_leads, en_leads);',
] as const;

function normalized(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

function expectMigrationContract(sqlSource: string): void {
  const sql = normalized(sqlSource);
  expect(sql).toContain('begin;');
  expect(sql).toMatch(/commit;$/);
  expect(sql).toContain('create or replace function public.cms_jsonb_is_person(candidate jsonb)');
  expect(sql).toContain("array['id', 'name', 'alternateName', 'roleKey', 'role', 'department', 'slug', 'hubId', 'duty', 'ext', 'email']");
  expect(sql).toContain("candidate ->> 'roleKey' = any(array[");
  const personValidator = sql.slice(
    sql.indexOf('create or replace function public.cms_jsonb_is_person(candidate jsonb)'),
    sql.indexOf('create or replace function public.cms_people_payload_is_publishable(candidate jsonb)'),
  );
  for (const roleKey of ROLE_KEYS) expect(personValidator, roleKey).toContain(`'${roleKey}'`);
  expect(sql).toContain('create or replace function public.cms_people_payload_is_publishable(candidate jsonb)');
  expect(sql).toContain('create or replace function public.cms_facdev_payload_is_publishable(candidate jsonb)');
  expect(sql).toContain('public.cms_jsonb_bilingual_person_arrays_are_valid');
  expect(sql).toContain("documents.kind in ('people', 'facdev')");
  expect(sql).toContain("revisions.status in ('draft', 'published', 'archived')");
  expect(sql).toContain('alter table public.cms_revisions disable trigger cms_revisions_enforce_lifecycle');
  expect(sql).toContain('alter table public.cms_revisions enable trigger cms_revisions_enforce_lifecycle');
  expect(sql).toContain('public.cms_collect_draft_media_paths(revision.payload)');
  expect(sql).toContain('public.cms_apply_media_replacements(revision.payload, validation_replacements)');
  expect(sql).toContain('alter function public.cms_enforce_revision_lifecycle() security definer');
  expect(sql).toContain('alter function public.cms_enforce_revision_lifecycle() set search_path =');
  for (const wiring of MIGRATION_WIRING) expect(sql, wiring).toContain(normalized(wiring));
  for (const path of PERSON_COLLECTION_PATHS) expect(sql, path).toContain(path);
}

function expectPgTapContract(sqlSource: string): void {
  const sql = normalized(sqlSource);
  expect(sql).toContain('select plan(23);');
  expect(sql).toContain("2::bigint, 'person_identity_fixture_cardinality'");
  expect(sql).toContain("15::bigint, 'person_identity_invalid_corpus_cardinality'");
  expect(sql).toContain("'person_identity_valid_seed_payloads'");
  expect(sql).toContain("'person_identity_invalid_corpus_rejected'");
  for (const invalidCase of INVALID_CASES) {
    expect(sql, invalidCase.name).toContain(`'${invalidCase.name}'`);
    expect(sql, invalidCase.name).toContain(normalized(invalidCase.input));
  }
  for (const label of [
    'person_identity_portraits_may_differ',
    'person_identity_draft_portrait_rejected_for_publication',
    'person_identity_people_upgrade_covers_every_scope',
    'person_identity_facdev_upgrade_covers_every_lead',
    'person_identity_upgrade_preserves_existing_ids',
    'person_identity_upgrade_seed_fallback_order',
    'person_identity_upgrade_collision_suffixes',
    'person_identity_upgrade_rejects_one_sided_id',
    'person_identity_upgrade_rejects_divergent_id',
    'person_identity_upgrade_rejects_blank_id',
    'person_identity_upgrade_rejects_non_string_id',
    'person_identity_upgrade_rejects_duplicate_preserved_id',
    'person_identity_valid_draft_transiently_validates',
    'person_identity_valid_draft_stays_unchanged',
    'person_identity_malformed_draft_like_rejected',
  ] as const) expect(sql, label).toContain(`'${label}'`);
}

describe('CMS person identity forward migration', () => {
  it('upgrades both persisted person payload kinds before replacing the final validators', () => {
    // Given / When / Then
    expectMigrationContract(migration);
    const updateIndex = migration.indexOf('update public.cms_revisions as revisions');
    expect(updateIndex).toBeGreaterThan(-1);
    expect(updateIndex).toBeLessThan(migration.indexOf('create or replace function public.cms_jsonb_is_person'));
  });

  it('keeps the pgTAP corpus complete and non-vacuous', () => {
    // Given / When / Then
    expectPgTapContract(pgTap);
  });

  it.each(PERSON_COLLECTION_PATHS)('fails contract verification when %s upgrade wiring is removed', (path) => {
    // Given / When
    const mutated = migration.replaceAll(path, 'REMOVED_COLLECTION');

    // Then
    expect(mutated).not.toBe(migration);
    expect(() => expectMigrationContract(mutated)).toThrow();
  });

  it.each(MIGRATION_WIRING)('fails contract verification when migration wiring is removed', (wiring) => {
    // Given / When
    const mutated = normalized(migration).replaceAll(normalized(wiring), 'REMOVED_WIRING');

    // Then
    expect(mutated).not.toBe(normalized(migration));
    expect(() => expectMigrationContract(mutated)).toThrow();
  });

  it('fails contract verification when fixture cardinality is removed', () => {
    // Given / When
    const mutated = pgTap.replace("2::bigint, 'person_identity_fixture_cardinality'", '2::bigint');

    // Then
    expect(mutated).not.toBe(pgTap);
    expect(() => expectPgTapContract(mutated)).toThrow();
  });

  it.each(INVALID_CASES)('fails contract verification when pgTAP case $name is weakened', (invalidCase) => {
    // Given / When
    const mutated = normalized(pgTap).replaceAll(normalized(invalidCase.input), 'REMOVED_INPUT');

    // Then
    expect(mutated).not.toBe(normalized(pgTap));
    expect(() => expectPgTapContract(mutated)).toThrow();
  });
});
