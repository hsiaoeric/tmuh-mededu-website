import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CMS_PAYLOAD_REGISTRY } from '@/content/contracts/registry';
import snapshot from '@/content/generated/cms-snapshot.json';
import { ICON_NAMES } from '@/data/iconNames';

const PAGE_PARITY_CASES = [
  'facdev_kpis_parity', 'facdev_services_parity', 'facdev_groups_parity',
  'ebm_kpis_parity', 'ebm_missions_parity', 'ebm_awards_lit_parity',
  'ebm_awards_clin_parity', 'ebm_awards_trans_parity', 'ebm_stages_parity',
  'ebm_stage_items_shorter_parity', 'ebm_stage_items_longer_parity',
  'ebm_course_groups_parity', 'ebm_course_rows_parity', 'holistic_kpis_parity',
  'holistic_features_parity', 'holistic_algee_parity', 'holistic_flow_parity',
  'holistic_problems_parity', 'holistic_symposiums_parity',
  'holistic_invalid_symposium_date', 'holistic_invalid_symposium_time',
  'holistic_invalid_symposium_year', 'holistic_research_by_year_parity',
  'holistic_research_clinical_stats_parity', 'holistic_research_papers_parity',
  'holistic_research_authors_parity', 'facdev_invalid_kpi_num', 'ebm_invalid_kpi_num',
  'holistic_invalid_kpi_num', 'holistic_invalid_kpi_color',
  'holistic_invalid_feature_delay', 'holistic_invalid_flow_color',
  'holistic_invalid_symposium_attendees', 'holistic_invalid_symposium_satisfaction',
  'holistic_invalid_training_num', 'research_invalid_by_year_clinical',
  'research_invalid_by_year_edu', 'research_invalid_by_year_year',
  'research_invalid_clinical_stat_num', 'research_invalid_paper_month',
  'research_invalid_paper_year', 'holistic_missing_symposium_dates',
  'holistic_missing_symposium_time', 'holistic_missing_symposium_year',
  'holistic_fractional_symposium_year',
] as const;

const GLANCE_PARITY_CASES = [
  'glance_caption_not_identity', 'glance_kpi_id_invalid', 'glance_kpi_id_order',
  'glance_member_group_count', 'glance_member_group_order',
  'glance_education_centers_group', 'glance_member_people_parity',
  'glance_member_role_key',
] as const;

const LOCAL_OWNERSHIP_CASES = [
  'centers_legacy_color', 'centers_legacy_branch_icon',
  'centers_legacy_branch_page_section', 'centers_legacy_branch_panel_section',
  'facdev_legacy_colors', 'facdev_legacy_group_tone', 'facdev_legacy_kpi_color',
  'facdev_legacy_kpi_delay', 'facdev_legacy_service_icon', 'facdev_legacy_service_tone',
  'ebm_legacy_colors', 'ebm_legacy_kpi_color', 'ebm_legacy_kpi_delay',
  'ebm_legacy_award_tone', 'ebm_legacy_stage_color', 'ebm_legacy_course_icon',
  'ebm_legacy_course_color',
] as const;

const RENDERER_SAFETY_CASES = [
  'centers_missing_canonical', 'centers_renamed_canonical',
  'centers_extra_canonical', 'centers_duplicate_canonical',
  'branches_missing_canonical', 'branches_renamed_canonical',
  'branches_extra_canonical', 'branches_duplicate_canonical',
  'people_groups_missing_canonical', 'people_groups_renamed_canonical',
  'people_groups_extra_canonical', 'people_groups_duplicate_canonical',
  'holistic_invalid_feature_icon', 'holistic_empty_algee',
] as const;

const ORDER_INDEPENDENT_CASES = [
  'centers_reordered', 'centers_locale_order_difference', 'branches_locale_order_difference',
] as const;

describe('forward SQL contract parity migration', () => {
  it('maps every Glance identity mutation into the forward migration and focused pgTAP corpus', () => {
    const migration = readFileSync(new URL('../supabase/migrations/20260903000100_add_glance_canonical_ids.sql', import.meta.url), 'utf8');
    const pgTap = readFileSync(new URL('../supabase/tests/database/012_glance_canonical_ids.test.sql', import.meta.url), 'utf8');
    for (const name of GLANCE_PARITY_CASES) expect(pgTap).toContain(`'${name}'`);
    expect(migration).toContain('["department_advisors","teaching_attendings","teaching_allied_health","education_centers"]');
    expect(migration).toContain('["department_advisors","teaching_attendings","teaching_allied_health"]');
    expect(migration).toContain("candidate #> '{zh,memberGroups}'");
    expect(migration).toContain("candidate #> '{zh,items}'");
  });

  it('locks deterministic HTTPS and exact published-media digest validation', () => {
    // Given
    const migration = readFileSync(new URL('../supabase/migrations/20260831000100_fix_url_media_contract_parity.sql', import.meta.url), 'utf8');
    const pgTap = readFileSync(new URL('../supabase/tests/database/009_url_media_contract_parity.test.sql', import.meta.url), 'utf8');

    // When / Then
    expect(migration).toContain('collate "C"');
    expect(migration).not.toMatch(/lower\s*\(|\[\[:(?:space|cntrl):\]\]/i);
    expect(migration).toContain("split_part(candidate ->> 'path', '/', 1)");
    expect(migration).toContain("split_part(split_part(candidate ->> 'path', '/', 2), '.', 1)");
    expect(pgTap).toContain('https://K.example/path');
    expect(pgTap).toContain('https://İ.example/path');
    expect(pgTap).toContain('published save rejects a filename digest mismatch');
    expect(pgTap).toContain('direct publication rejects a filename digest mismatch');
  });

  it('maps every page-editor TypeScript parity mutation into the focused pgTAP corpus', () => {
    const typeScriptCorpus = [
      '../src/content/contracts/pageEditors.contract.test.ts',
      '../src/content/contracts/pageEditors.parity.test.ts',
      '../src/content/contracts/pageEditors.strictSemantics.test.ts',
    ].map((path) => readFileSync(new URL(path, import.meta.url), 'utf8')).join('\n');
    const pgTap = readFileSync(new URL('../supabase/tests/database/010_page_editor_contract_parity.test.sql', import.meta.url), 'utf8');
    for (const name of PAGE_PARITY_CASES) {
      expect(typeScriptCorpus, `${name}: TypeScript`).toContain(`'${name}'`);
      expect(pgTap, `${name}: pgTAP`).toContain(`'${name}'`);
    }
  });

  it('composes the forward-only page parity predicate into publication dispatch', () => {
    const migration = readFileSync(new URL('../supabase/migrations/20260901000100_add_page_editor_contract_parity.sql', import.meta.url), 'utf8');
    expect(migration).toContain('cms_wave5_page_payload_is_valid(document_kind, candidate)');
    expect(migration).toContain("candidate #> '{zh,courseGroups}'");
    expect(migration).toContain("candidate #> '{zh,outcomes,symposiums}'");
    expect(migration).toContain("candidate #> '{zh,papers}'");
    expect(migration).toContain("jsonb_typeof(candidate -> 'dates') is distinct from 'string'");
    expect(migration).toContain('year_number <> trunc(year_number)');
    expect(migration).toContain('end) is true');
  });

  it('composes renderer-safe publication predicates into one forward migration', () => {
    // Given
    const migration = readFileSync(new URL('../supabase/migrations/20260904000100_complete_publication_renderer_safety.sql', import.meta.url), 'utf8');
    const pgTap = readFileSync(new URL('../supabase/tests/database/010_page_editor_contract_parity.test.sql', import.meta.url), 'utf8');

    // When / Then
    for (const predicate of ['centers', 'people', 'facdev', 'ebm', 'holistic']) {
      expect(migration).toContain(`create or replace function public.cms_${predicate}_payload_is_publishable`);
      expect(migration).toContain(`when '${predicate}' then public.cms_${predicate}_payload_is_publishable(candidate)`);
      expect(migration).toContain(`alter function public.cms_${predicate}_payload_is_publishable(jsonb) owner to postgres`);
    }
    expect(migration).toContain("array['faculty_dev', 'clinical_skills', 'ebm', 'holistic', 'med_edu_research', 'admin']");
    expect(migration).toContain("when 'admin' then array['leadership', 'duties', 'extensions']");
    expect(migration).toContain(`array[${ICON_NAMES.map((name) => `'${name}'`).join(', ')}]`);
    expect(migration).toContain('alter function public.cms_jsonb_array_has_exact_field_values(jsonb, text, text[]) owner to postgres');
    expect(migration).toContain('cms_wave5_page_payload_is_valid(document_kind, candidate)');
    expect(migration).toContain("document_kind = 'centers' or public.cms_wave5_global_payload_is_valid(document_kind, candidate)");
    expect(migration).toContain('immutable strict security invoker set search_path = \'\'');
    expect(migration).toContain('from public, anon, authenticated');
    for (const name of LOCAL_OWNERSHIP_CASES) expect(pgTap, name).toContain(`'${name}'`);
    for (const name of RENDERER_SAFETY_CASES) expect(pgTap, name).toContain(`'${name}'`);
    for (const name of ORDER_INDEPENDENT_CASES) expect(pgTap, name).toContain(`'${name}'`);
  });

  it('locks non-vacuous canonical and invalid pgTAP corpus sizes', () => {
    const pgTap = readFileSync(new URL('../supabase/tests/database/010_page_editor_contract_parity.test.sql', import.meta.url), 'utf8');
    expect(pgTap).toContain('5::bigint');
    expect(pgTap).toContain('46::bigint');
    expect(pgTap).toContain('30::bigint');
    expect(pgTap).toContain('31::bigint');
    expect(pgTap).toContain('3::bigint');
    expect(pgTap).toContain('is not true');
    expect(pgTap).toContain('is not false');
  });

  it('preserves the symposium semantic year in the integral-decimal pgTAP mutation', () => {
    const source = snapshot.find((candidate) => candidate.kind === 'holistic');
    if (source === undefined) throw new TypeError('Missing holistic snapshot');
    const holistic = CMS_PAYLOAD_REGISTRY.holistic.publishedSchema.parse(structuredClone(source.payload));
    const symposium = holistic.zh.outcomes.symposiums[0];
    if (symposium === undefined) throw new TypeError('Holistic snapshot must contain a symposium');
    const pgTap = readFileSync(new URL('../supabase/tests/database/010_page_editor_contract_parity.test.sql', import.meta.url), 'utf8');
    const mutations = [...pgTap.matchAll(
      /jsonb_set\(jsonb_set\(payload, '\{zh,outcomes,symposiums,0,year\}', '([0-9]+\.0)'\), '\{en,outcomes,symposiums,0,year\}', '([0-9]+\.0)'\)/g,
    )].map((match) => [match[1], match[2]]);

    const expectedMutation = [`${symposium.year}.0`, `${symposium.year}.0`];
    expect(mutations).toEqual([expectedMutation, expectedMutation]);
  });
});
