begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
set local request.jwt.claims = '{}';

select plan(20);

create temporary table page_valid_payloads on commit drop as
select documents.kind, revisions.payload
from public.cms_documents as documents
join public.cms_revisions as revisions on revisions.document_id = documents.id
where revisions.status = 'published'
  and documents.kind in ('digital_materials', 'facdev', 'ebm', 'holistic', 'holistic_research');

create temporary table page_invalid_payloads (
  name text primary key,
  kind public.cms_document_kind not null,
  payload jsonb not null,
  focused boolean not null default true
) on commit drop;

create temporary table local_ownership_valid_payloads on commit drop as
select documents.kind, revisions.payload
from public.cms_documents as documents
join public.cms_revisions as revisions on revisions.document_id = documents.id
where revisions.status = 'published'
  and documents.kind in ('centers', 'facdev', 'ebm');

create temporary table local_ownership_invalid_payloads (
  name text primary key,
  kind public.cms_document_kind not null,
  payload jsonb not null
) on commit drop;

create temporary table local_ownership_valid_variants (
  name text primary key,
  kind public.cms_document_kind not null,
  payload jsonb not null
) on commit drop;

with fixture as (select payload from local_ownership_valid_payloads where kind = 'centers')
insert into local_ownership_valid_variants (name, kind, payload)
select 'centers_reordered', 'centers'::public.cms_document_kind,
  jsonb_set(
    jsonb_set(payload, '{zh,centers}', (select jsonb_agg(center.value order by center.ordinality desc) from jsonb_array_elements(payload #> '{zh,centers}') with ordinality as center(value, ordinality))),
    '{en,centers}', (select jsonb_agg(center.value order by center.ordinality desc) from jsonb_array_elements(payload #> '{en,centers}') with ordinality as center(value, ordinality))
  ) from fixture
union all select 'centers_locale_order_difference', 'centers',
  jsonb_set(payload, '{en,centers}', (select jsonb_agg(center.value order by center.ordinality desc) from jsonb_array_elements(payload #> '{en,centers}') with ordinality as center(value, ordinality))) from fixture
union all select 'branches_locale_order_difference', 'centers',
  jsonb_set(payload, '{en,centers,0,branches}', (select jsonb_agg(branch.value order by branch.ordinality desc) from jsonb_array_elements(payload #> '{en,centers,0,branches}') with ordinality as branch(value, ordinality))) from fixture;

with fixture as (select payload from local_ownership_valid_payloads where kind = 'centers')
insert into local_ownership_invalid_payloads (name, kind, payload)
select 'centers_legacy_color', 'centers'::public.cms_document_kind, jsonb_set(payload, '{zh,centers,0}', (payload #> '{zh,centers,0}') || '{"color":"#123456"}') from fixture
union all select 'centers_legacy_branch_icon', 'centers', jsonb_set(payload, '{zh,centers,0,branches,0}', (payload #> '{zh,centers,0,branches,0}') || '{"icon":"book"}') from fixture
union all select 'centers_legacy_branch_page_section', 'centers', jsonb_set(payload, '{zh,centers,0,branches,0}', (payload #> '{zh,centers,0,branches,0}') || '{"pageSection":"about"}') from fixture
union all select 'centers_legacy_branch_panel_section', 'centers', jsonb_set(payload, '{zh,centers,0,branches,0}', (payload #> '{zh,centers,0,branches,0}') || '{"panelSection":"overview"}') from fixture;

with fixture as (select payload from local_ownership_valid_payloads where kind = 'centers')
insert into local_ownership_invalid_payloads (name, kind, payload)
select 'centers_missing_canonical', 'centers'::public.cms_document_kind,
  jsonb_set(jsonb_set(payload, '{zh,centers}', (payload #> '{zh,centers}') - 0), '{en,centers}', (payload #> '{en,centers}') - 0) from fixture
union all select 'centers_renamed_canonical', 'centers',
  jsonb_set(jsonb_set(payload, '{zh,centers,0,id}', '"renamed"'), '{en,centers,0,id}', '"renamed"') from fixture
union all select 'centers_extra_canonical', 'centers',
  jsonb_set(
    jsonb_set(payload, '{zh,centers}', (payload #> '{zh,centers}') || jsonb_build_array((payload #> '{zh,centers,0}') || '{"id":"extra"}')),
    '{en,centers}', (payload #> '{en,centers}') || jsonb_build_array((payload #> '{en,centers,0}') || '{"id":"extra"}')
  ) from fixture
union all select 'centers_duplicate_canonical', 'centers',
  jsonb_set(
    jsonb_set(payload, '{zh,centers}', (payload #> '{zh,centers}') || jsonb_build_array(payload #> '{zh,centers,0}')),
    '{en,centers}', (payload #> '{en,centers}') || jsonb_build_array(payload #> '{en,centers,0}')
  ) from fixture
union all select 'branches_missing_canonical', 'centers',
  jsonb_set(jsonb_set(payload, '{zh,centers,0,branches}', (payload #> '{zh,centers,0,branches}') - 0), '{en,centers,0,branches}', (payload #> '{en,centers,0,branches}') - 0) from fixture
union all select 'branches_renamed_canonical', 'centers',
  jsonb_set(jsonb_set(payload, '{zh,centers,0,branches,0,id}', '"renamed"'), '{en,centers,0,branches,0,id}', '"renamed"') from fixture
union all select 'branches_extra_canonical', 'centers',
  jsonb_set(
    jsonb_set(payload, '{zh,centers,0,branches}', (payload #> '{zh,centers,0,branches}') || jsonb_build_array((payload #> '{zh,centers,0,branches,0}') || '{"id":"extra"}')),
    '{en,centers,0,branches}', (payload #> '{en,centers,0,branches}') || jsonb_build_array((payload #> '{en,centers,0,branches,0}') || '{"id":"extra"}')
  ) from fixture
union all select 'branches_duplicate_canonical', 'centers',
  jsonb_set(
    jsonb_set(payload, '{zh,centers,0,branches}', (payload #> '{zh,centers,0,branches}') || jsonb_build_array(payload #> '{zh,centers,0,branches,0}')),
    '{en,centers,0,branches}', (payload #> '{en,centers,0,branches}') || jsonb_build_array(payload #> '{en,centers,0,branches,0}')
  ) from fixture;

with fixture as (
  select revisions.payload
  from public.cms_documents as documents
  join public.cms_revisions as revisions on revisions.document_id = documents.id
  where revisions.status = 'published' and documents.kind = 'people'
)
insert into local_ownership_invalid_payloads (name, kind, payload)
select 'people_groups_missing_canonical', 'people'::public.cms_document_kind,
  jsonb_set(jsonb_set(payload, '{zh,centerPeople}', (payload #> '{zh,centerPeople}') - 0), '{en,centerPeople}', (payload #> '{en,centerPeople}') - 0) from fixture
union all select 'people_groups_renamed_canonical', 'people',
  jsonb_set(jsonb_set(payload, '{zh,centerPeople,0,centerId}', '"renamed"'), '{en,centerPeople,0,centerId}', '"renamed"') from fixture
union all select 'people_groups_extra_canonical', 'people',
  jsonb_set(
    jsonb_set(payload, '{zh,centerPeople}', (payload #> '{zh,centerPeople}') || jsonb_build_array((payload #> '{zh,centerPeople,0}') || '{"centerId":"extra"}')),
    '{en,centerPeople}', (payload #> '{en,centerPeople}') || jsonb_build_array((payload #> '{en,centerPeople,0}') || '{"centerId":"extra"}')
  ) from fixture
union all select 'people_groups_duplicate_canonical', 'people',
  jsonb_set(
    jsonb_set(payload, '{zh,centerPeople}', (payload #> '{zh,centerPeople}') || jsonb_build_array(payload #> '{zh,centerPeople,0}')),
    '{en,centerPeople}', (payload #> '{en,centerPeople}') || jsonb_build_array(payload #> '{en,centerPeople,0}')
  ) from fixture;

with fixture as (select payload from page_valid_payloads where kind = 'holistic')
insert into local_ownership_invalid_payloads (name, kind, payload)
select 'holistic_invalid_feature_icon', 'holistic'::public.cms_document_kind, jsonb_set(payload, '{zh,features,0,iconId}', '"arbitrary"') from fixture
union all select 'holistic_empty_algee', 'holistic', jsonb_set(jsonb_set(payload, '{zh,algee}', '[]'), '{en,algee}', '[]') from fixture;

with fixture as (select payload from local_ownership_valid_payloads where kind = 'facdev')
insert into local_ownership_invalid_payloads (name, kind, payload)
select 'facdev_legacy_colors', 'facdev'::public.cms_document_kind, jsonb_set(payload, '{zh}', (payload -> 'zh') || '{"colors":{}}') from fixture
union all select 'facdev_legacy_group_tone', 'facdev', jsonb_set(payload, '{zh,groups,0}', (payload #> '{zh,groups,0}') || '{"tone":"#123456"}') from fixture
union all select 'facdev_legacy_kpi_color', 'facdev', jsonb_set(payload, '{zh,kpis,0}', (payload #> '{zh,kpis,0}') || '{"color":"#123456"}') from fixture
union all select 'facdev_legacy_kpi_delay', 'facdev', jsonb_set(payload, '{zh,kpis,0}', (payload #> '{zh,kpis,0}') || '{"delay":0}') from fixture
union all select 'facdev_legacy_service_icon', 'facdev', jsonb_set(payload, '{zh,services,0}', (payload #> '{zh,services,0}') || '{"icon":"book"}') from fixture
union all select 'facdev_legacy_service_tone', 'facdev', jsonb_set(payload, '{zh,services,0}', (payload #> '{zh,services,0}') || '{"tone":"#123456"}') from fixture;

with fixture as (select payload from local_ownership_valid_payloads where kind = 'ebm')
insert into local_ownership_invalid_payloads (name, kind, payload)
select 'ebm_legacy_colors', 'ebm'::public.cms_document_kind, jsonb_set(payload, '{zh}', (payload -> 'zh') || '{"colors":{}}') from fixture
union all select 'ebm_legacy_kpi_color', 'ebm', jsonb_set(payload, '{zh,kpis,0}', (payload #> '{zh,kpis,0}') || '{"color":"#123456"}') from fixture
union all select 'ebm_legacy_kpi_delay', 'ebm', jsonb_set(payload, '{zh,kpis,0}', (payload #> '{zh,kpis,0}') || '{"delay":0}') from fixture
union all select 'ebm_legacy_award_tone', 'ebm', jsonb_set(payload, '{zh,awardsLit,0}', (payload #> '{zh,awardsLit,0}') || '{"tone":"#123456"}') from fixture
union all select 'ebm_legacy_stage_color', 'ebm', jsonb_set(payload, '{zh,stages,0}', (payload #> '{zh,stages,0}') || '{"color":"#123456"}') from fixture
union all select 'ebm_legacy_course_icon', 'ebm', jsonb_set(payload, '{zh,courseGroups,0}', (payload #> '{zh,courseGroups,0}') || '{"gicon":"book"}') from fixture
union all select 'ebm_legacy_course_color', 'ebm', jsonb_set(payload, '{zh,courseGroups,0}', (payload #> '{zh,courseGroups,0}') || '{"color":"#123456"}') from fixture;

with fixture as (select payload from page_valid_payloads where kind = 'facdev')
insert into page_invalid_payloads (name, kind, payload)
select 'facdev_kpis_parity', 'facdev'::public.cms_document_kind, payload #- '{en,kpis,0}' from fixture
union all select 'facdev_services_parity', 'facdev', payload #- '{en,services,0}' from fixture
union all select 'facdev_groups_parity', 'facdev', payload #- '{en,groups,0}' from fixture;

with fixture as (select payload from page_valid_payloads where kind = 'ebm')
insert into page_invalid_payloads (name, kind, payload)
select 'ebm_kpis_parity', 'ebm'::public.cms_document_kind, payload #- '{en,kpis,0}' from fixture
union all select 'ebm_missions_parity', 'ebm', payload #- '{en,missions,0}' from fixture
union all select 'ebm_awards_lit_parity', 'ebm', payload #- '{en,awardsLit,0}' from fixture
union all select 'ebm_awards_clin_parity', 'ebm', payload #- '{en,awardsClin,0}' from fixture
union all select 'ebm_awards_trans_parity', 'ebm', payload #- '{en,awardsTrans,0}' from fixture
union all select 'ebm_stages_parity', 'ebm', payload #- '{en,stages,0}' from fixture
union all select 'ebm_stage_items_shorter_parity', 'ebm', payload #- '{en,stages,0,items,0}' from fixture
union all select 'ebm_stage_items_longer_parity', 'ebm', jsonb_set(payload, '{en,stages,0,items}', (payload #> '{en,stages,0,items}') || '"additional item"'::jsonb) from fixture
union all select 'ebm_course_groups_parity', 'ebm', payload #- '{en,courseGroups,0}' from fixture
union all select 'ebm_course_rows_parity', 'ebm', payload #- '{en,courseGroups,0,rows,0}' from fixture;

with fixture as (select payload from page_valid_payloads where kind = 'holistic')
insert into page_invalid_payloads (name, kind, payload)
select 'holistic_kpis_parity', 'holistic'::public.cms_document_kind, payload #- '{en,kpis,0}' from fixture
union all select 'holistic_features_parity', 'holistic', payload #- '{en,features,0}' from fixture
union all select 'holistic_algee_parity', 'holistic', payload #- '{en,algee,0}' from fixture
union all select 'holistic_flow_parity', 'holistic', payload #- '{en,aiEcosystem,flow,0}' from fixture
union all select 'holistic_problems_parity', 'holistic', payload #- '{en,aiEcosystem,problems,0}' from fixture
union all select 'holistic_symposiums_parity', 'holistic', payload #- '{en,outcomes,symposiums,0}' from fixture
union all select 'holistic_invalid_symposium_date', 'holistic', jsonb_set(payload, '{zh,outcomes,symposiums,0,dates}', '"2026/02/30"') from fixture
union all select 'holistic_invalid_symposium_time', 'holistic', jsonb_set(payload, '{zh,outcomes,symposiums,0,time}', '"10:00–09:00"') from fixture
union all select 'holistic_invalid_symposium_year', 'holistic', jsonb_set(payload, '{zh,outcomes,symposiums,0,year}', '2025') from fixture
union all select 'holistic_missing_symposium_dates', 'holistic', payload #- '{zh,outcomes,symposiums,0,dates}' from fixture
union all select 'holistic_missing_symposium_time', 'holistic', payload #- '{zh,outcomes,symposiums,0,time}' from fixture
union all select 'holistic_missing_symposium_year', 'holistic', payload #- '{zh,outcomes,symposiums,0,year}' from fixture
union all select 'holistic_fractional_symposium_year', 'holistic', jsonb_set(payload, '{zh,outcomes,symposiums,0,year}', '2026.5') from fixture;

with fixture as (select payload from page_valid_payloads where kind = 'holistic_research')
insert into page_invalid_payloads (name, kind, payload)
select 'holistic_research_by_year_parity', 'holistic_research'::public.cms_document_kind, payload #- '{en,byYear,0}' from fixture
union all select 'holistic_research_clinical_stats_parity', 'holistic_research', payload #- '{en,clinicalStats,0}' from fixture
union all select 'holistic_research_papers_parity', 'holistic_research', payload #- '{en,papers,0}' from fixture
union all select 'holistic_research_authors_parity', 'holistic_research', payload #- '{en,papers,0,authors,0}' from fixture;

with fixture as (select payload from page_valid_payloads where kind = 'facdev')
insert into page_invalid_payloads (name, kind, payload, focused)
select 'facdev_invalid_kpi_num', 'facdev'::public.cms_document_kind, jsonb_set(payload, '{zh,kpis,0,num}', '""'), false from fixture;

with fixture as (select payload from page_valid_payloads where kind = 'ebm')
insert into page_invalid_payloads (name, kind, payload, focused)
select 'ebm_invalid_kpi_num', 'ebm'::public.cms_document_kind, jsonb_set(payload, '{zh,kpis,0,num}', '""'), false from fixture;

with fixture as (select payload from page_valid_payloads where kind = 'holistic')
insert into page_invalid_payloads (name, kind, payload, focused)
select 'holistic_invalid_kpi_num', 'holistic'::public.cms_document_kind, jsonb_set(payload, '{zh,kpis,0,num}', '""'), false from fixture
union all select 'holistic_invalid_kpi_color', 'holistic', jsonb_set(payload, '{zh,kpis,0,color}', '"repair"'), false from fixture
union all select 'holistic_invalid_feature_delay', 'holistic', jsonb_set(payload, '{zh,features,0,delay}', '"2e"'), false from fixture
union all select 'holistic_invalid_flow_color', 'holistic', jsonb_set(payload, '{zh,aiEcosystem,flow,0,color}', '"repair"'), false from fixture
union all select 'holistic_invalid_symposium_attendees', 'holistic', jsonb_set(payload, '{zh,outcomes,symposiums,0,attendees}', '"1."'), false from fixture
union all select 'holistic_invalid_symposium_satisfaction', 'holistic', jsonb_set(payload, '{zh,outcomes,symposiums,0,satisfaction}', '""'), false from fixture
union all select 'holistic_invalid_training_num', 'holistic', jsonb_set(payload, '{zh,outcomes,trainingParticipants,num}', '""'), false from fixture;

with fixture as (select payload from page_valid_payloads where kind = 'holistic_research')
insert into page_invalid_payloads (name, kind, payload, focused)
select 'research_invalid_by_year_clinical', 'holistic_research'::public.cms_document_kind, jsonb_set(payload, '{zh,byYear,0,clinical}', '"8e"'), false from fixture
union all select 'research_invalid_by_year_edu', 'holistic_research', jsonb_set(payload, '{zh,byYear,0,edu}', '""'), false from fixture
union all select 'research_invalid_by_year_year', 'holistic_research', jsonb_set(payload, '{zh,byYear,0,year}', '"20x6"'), false from fixture
union all select 'research_invalid_clinical_stat_num', 'holistic_research', jsonb_set(payload, '{zh,clinicalStats,0,num}', '"1."'), false from fixture
union all select 'research_invalid_paper_month', 'holistic_research', jsonb_set(payload, '{zh,papers,0,month}', '"13"'), false from fixture
union all select 'research_invalid_paper_year', 'holistic_research', jsonb_set(payload, '{zh,papers,0,year}', '""'), false from fixture;

select ok(
  to_regprocedure('public.cms_jsonb_is_holistic_symposium(jsonb)') is not null
    and to_regprocedure('public.cms_wave5_page_payload_is_valid(public.cms_document_kind,jsonb)') is not null,
  'Wave 5 page parity predicate signature exists'
);
select ok(
  (
    select count(*) = 2
      and bool_and(provolatile = 'i' and proisstrict and not prosecdef)
      and bool_and(coalesce(proconfig, '{}'::text[]) @> array['search_path=""'])
      and bool_and(pg_get_userbyid(proowner) = 'postgres')
    from pg_proc
    where oid = any(array[
      to_regprocedure('public.cms_jsonb_is_holistic_symposium(jsonb)'),
      to_regprocedure('public.cms_wave5_page_payload_is_valid(public.cms_document_kind,jsonb)')
    ]::oid[])
  ),
  'Wave 5 page predicates are immutable strict invokers owned by postgres with empty search paths'
);
select ok(
  (
    select bool_and(
      not has_function_privilege('public', oid, 'execute')
        and not has_function_privilege('anon', oid, 'execute')
        and not has_function_privilege('authenticated', oid, 'execute')
    )
    from pg_proc
    where oid = any(array[
      to_regprocedure('public.cms_jsonb_is_holistic_symposium(jsonb)'),
      to_regprocedure('public.cms_wave5_page_payload_is_valid(public.cms_document_kind,jsonb)')
    ]::oid[])
  ),
  'API roles cannot execute the page predicates'
);
select ok(
  (
    select count(*) = 7
      and bool_and(provolatile = 'i' and proisstrict and not prosecdef)
      and bool_and(coalesce(proconfig, '{}'::text[]) @> array['search_path=""'])
      and bool_and(pg_get_userbyid(proowner) = 'postgres')
    from pg_proc
    where oid = any(array[
      to_regprocedure('public.cms_jsonb_array_has_exact_field_values(jsonb,text,text[])'),
      to_regprocedure('public.cms_centers_payload_is_publishable(jsonb)'),
      to_regprocedure('public.cms_people_payload_is_publishable(jsonb)'),
      to_regprocedure('public.cms_facdev_payload_is_publishable(jsonb)'),
      to_regprocedure('public.cms_ebm_payload_is_publishable(jsonb)'),
      to_regprocedure('public.cms_holistic_payload_is_publishable(jsonb)'),
      to_regprocedure('public.cms_payload_is_publishable(public.cms_document_kind,jsonb)')
    ]::oid[])
  ),
  'locally owned publication predicates preserve immutable strict invoker metadata'
);
select ok(
  (
    select count(*) = 7 and bool_and(
      not has_function_privilege('public', oid, 'execute')
        and not has_function_privilege('anon', oid, 'execute')
        and not has_function_privilege('authenticated', oid, 'execute')
    )
    from pg_proc
    where oid = any(array[
      to_regprocedure('public.cms_jsonb_array_has_exact_field_values(jsonb,text,text[])'),
      to_regprocedure('public.cms_centers_payload_is_publishable(jsonb)'),
      to_regprocedure('public.cms_people_payload_is_publishable(jsonb)'),
      to_regprocedure('public.cms_facdev_payload_is_publishable(jsonb)'),
      to_regprocedure('public.cms_ebm_payload_is_publishable(jsonb)'),
      to_regprocedure('public.cms_holistic_payload_is_publishable(jsonb)'),
      to_regprocedure('public.cms_payload_is_publishable(public.cms_document_kind,jsonb)')
    ]::oid[])
  ),
  'API roles cannot execute the locally owned publication predicates'
);
select is(
  (select count(*) from local_ownership_valid_payloads),
  3::bigint,
  'the locally owned canonical corpus contains centers, facdev, and ebm'
);
select results_eq(
  $$select kind::text from local_ownership_valid_payloads where public.cms_payload_is_publishable(kind, payload) is not true order by kind$$,
  array[]::text[],
  'publication dispatcher accepts current locally owned payloads'
);
select is(
  (select count(*) from local_ownership_invalid_payloads),
  31::bigint,
  'the renderer-safety invalid corpus is non-empty and complete'
);
select results_eq(
  $$select name from local_ownership_invalid_payloads where public.cms_payload_is_publishable(kind, payload) is not false order by name$$,
  array[]::text[],
  'publication dispatcher rejects every renderer-safety violation'
);
select is(
  (select count(*) from local_ownership_valid_variants),
  3::bigint,
  'the order-independent center corpus is non-empty and complete'
);
select results_eq(
  $$select name from local_ownership_valid_variants where public.cms_payload_is_publishable(kind, payload) is not true order by name$$,
  array[]::text[],
  'publication dispatcher accepts canonical centers and branches regardless of payload order'
);
select is(
  (select count(*) from page_valid_payloads),
  5::bigint,
  'the canonical page corpus contains exactly five fixtures'
);
select results_eq(
  $$select kind::text from page_valid_payloads order by kind$$,
  array['digital_materials', 'ebm', 'facdev', 'holistic', 'holistic_research']::text[],
  'the canonical page corpus contains each expected kind exactly once'
);
select is(
  (select count(*) from page_invalid_payloads),
  46::bigint,
  'the invalid page corpus contains every named TypeScript mutation'
);
select is(
  (select count(*) from page_invalid_payloads where focused),
  30::bigint,
  'the focused page predicate corpus is non-empty and complete'
);
select results_eq(
  $$select kind::text from page_valid_payloads where public.cms_wave5_page_payload_is_valid(kind, payload) is not true order by kind$$,
  array[]::text[],
  'page parity predicate accepts all five current page snapshots'
);
select results_eq(
  $$select kind::text from page_valid_payloads where public.cms_payload_is_publishable(kind, payload) is not true order by kind$$,
  array[]::text[],
  'publication dispatcher accepts all five current page snapshots'
);
select results_eq(
  $$select name from page_invalid_payloads where focused and public.cms_wave5_page_payload_is_valid(kind, payload) is not false order by name$$,
  array[]::text[],
  'page parity predicate rejects the complete TypeScript parity corpus'
);
select results_eq(
  $$select name from page_invalid_payloads where public.cms_payload_is_publishable(kind, payload) is not false order by name$$,
  array[]::text[],
  'publication dispatcher rejects the complete TypeScript parity corpus'
);
select ok(
  (
    select public.cms_wave5_page_payload_is_valid(
      kind,
      jsonb_set(jsonb_set(payload, '{zh,outcomes,symposiums,0,year}', '2021.0'), '{en,outcomes,symposiums,0,year}', '2021.0')
    ) is true
      and public.cms_payload_is_publishable(
        kind,
        jsonb_set(jsonb_set(payload, '{zh,outcomes,symposiums,0,year}', '2021.0'), '{en,outcomes,symposiums,0,year}', '2021.0')
      ) is true
    from page_valid_payloads
    where kind = 'holistic'
  ),
  'JSON integral decimal years have TypeScript number semantics'
);

select * from finish();
rollback;
