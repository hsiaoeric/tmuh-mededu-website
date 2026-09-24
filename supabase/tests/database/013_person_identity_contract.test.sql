-- allow: SIZE_OK - This rollback-wrapped pgTAP corpus keeps seed fixtures, identity mutations, upgrader failures, and draft-media checks in one auditable contract.
begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(23);

create temporary table person_identity_payloads on commit drop as
select documents.kind, revisions.payload
from public.cms_documents as documents
join public.cms_revisions as revisions on revisions.document_id = documents.id
where revisions.status = 'published'
  and documents.kind in ('people', 'facdev');

create temporary table person_identity_invalid_payloads (
  name text primary key,
  payload jsonb not null
) on commit drop;

with fixture as (
  select payload from person_identity_payloads where kind = 'people'
)
insert into person_identity_invalid_payloads (name, payload)
select 'people_missing_id', payload #- '{zh,centerPeople,0,people,0,id}' #- '{en,centerPeople,0,people,0,id}' from fixture
union all select 'people_blank_id', jsonb_set(jsonb_set(payload, '{zh,centerPeople,0,people,0,id}', '""'), '{en,centerPeople,0,people,0,id}', '""') from fixture
union all select 'people_non_string_id', jsonb_set(jsonb_set(payload, '{zh,centerPeople,0,people,0,id}', '42'), '{en,centerPeople,0,people,0,id}', '42') from fixture
union all select 'people_duplicate_id', jsonb_set(jsonb_set(payload, '{zh,centerPeople,0,people,1}', payload #> '{zh,centerPeople,0,people,0}'), '{en,centerPeople,0,people,1}', payload #> '{en,centerPeople,0,people,0}') from fixture
union all select 'people_divergent_id', jsonb_set(payload, '{en,centerPeople,0,people,0,id}', '"different-person"') from fixture
union all select 'people_invalid_role', jsonb_set(jsonb_set(payload, '{zh,centerPeople,0,people,0,roleKey}', '"unknown"'), '{en,centerPeople,0,people,0,roleKey}', '"unknown"') from fixture
union all select 'people_role_key_parity', jsonb_set(payload, '{en,centerPeople,0,people,0,roleKey}', '"advisor"') from fixture
union all select 'people_slug_parity', jsonb_set(payload, '{en,centerPeople,0,people,0,slug}', '"different-slug"') from fixture
union all select 'people_hub_id_parity', jsonb_set(payload, '{en,centerPeople,0,people,0,hubId}', '"different-hub"') from fixture
union all select 'people_ext_parity', jsonb_set(payload, '{en,centerPeople,0,people,0,ext}', '"9999"') from fixture
union all select 'people_email_parity', jsonb_set(payload, '{en,centerPeople,0,people,0,email}', '"different@example.test"') from fixture
union all select 'people_english_alternate_name_parity', jsonb_set(payload, '{en,centerPeople,0,people,0,alternateName}', '"錯誤姓名"') from fixture
union all select 'people_chinese_alternate_name_parity', jsonb_set(payload, '{zh,centerPeople,0,people,0,alternateName}', '"Wrong name"') from fixture
union all select 'people_unequal_array', payload #- '{en,centerPeople,0,people,0}' from fixture
union all select 'people_reordered_array',
  jsonb_set(
    jsonb_set(payload, '{en,centerPeople,0,people,0}', payload #> '{en,centerPeople,0,people,1}'),
    '{en,centerPeople,0,people,1}', payload #> '{en,centerPeople,0,people,0}'
  ) from fixture;

create temporary table person_identity_upgraded_people on commit drop as
select public.cms_upgrade_person_identity_payload(
  'people',
  payload
    #- '{zh,centerPeople,0,people,0,id}' #- '{en,centerPeople,0,people,0,id}'
    #- '{zh,holisticInstructors,0,id}' #- '{en,holisticInstructors,0,id}'
    #- '{zh,holisticSeedTeachers,0,id}' #- '{en,holisticSeedTeachers,0,id}'
    #- '{zh,holisticAiTeam,0,id}' #- '{en,holisticAiTeam,0,id}'
    #- '{zh,memberGroups,0,people,0,id}' #- '{en,memberGroups,0,people,0,id}'
) as payload
from person_identity_payloads
where kind = 'people';

create temporary table person_identity_upgraded_facdev on commit drop as
with fixture as (
  select payload from person_identity_payloads where kind = 'facdev'
), stripped as (
  select jsonb_set(
    jsonb_set(fixture.payload, '{zh,groups}', (
      select jsonb_agg(group_item.value || jsonb_build_object('lead', (group_item.value -> 'lead') - 'id') order by group_item.ordinality)
      from jsonb_array_elements(fixture.payload #> '{zh,groups}') with ordinality as group_item(value, ordinality)
    )),
    '{en,groups}', (
      select jsonb_agg(group_item.value || jsonb_build_object('lead', (group_item.value -> 'lead') - 'id') order by group_item.ordinality)
      from jsonb_array_elements(fixture.payload #> '{en,groups}') with ordinality as group_item(value, ordinality)
    )
  ) as payload
  from fixture
)
select public.cms_upgrade_person_identity_payload('facdev', payload) as payload from stripped;

create temporary table person_identity_draft_payload on commit drop as
with fixture as (
  select payload from person_identity_payloads where kind = 'people'
), draft_reference as (
  select jsonb_build_object(
    'kind', 'draft',
    'bucket', 'draft-media',
    'path', '87000000-0000-4000-8000-000000000001/' || repeat('a', 64) || '.png'
  ) as value
)
select public.cms_upgrade_person_identity_payload(
  'people',
  jsonb_set(
    jsonb_set(
      fixture.payload #- '{zh,centerPeople,0,people,0,id}' #- '{en,centerPeople,0,people,0,id}',
      '{zh,centerPeople,0,people,0,portrait}', draft_reference.value
    ),
    '{en,centerPeople,0,people,0,portrait}', draft_reference.value
  )
) as payload, draft_reference.value as draft_reference
from fixture cross join draft_reference;

select ok(
  (
    select count(*) = 7
      and bool_and(provolatile = 'i' and proisstrict and not prosecdef)
      and bool_and(coalesce(proconfig, '{}'::text[]) @> array['search_path=""'])
      and bool_and(pg_get_userbyid(proowner) = 'postgres')
    from pg_proc
    where oid = any(array[
      to_regprocedure('public.cms_normalize_person_identity(text)'),
      to_regprocedure('public.cms_upgrade_bilingual_person_array(jsonb,jsonb)'),
      to_regprocedure('public.cms_upgrade_person_identity_payload(public.cms_document_kind,jsonb)'),
      to_regprocedure('public.cms_jsonb_bilingual_person_arrays_are_valid(jsonb,jsonb)'),
      to_regprocedure('public.cms_jsonb_is_person(jsonb)'),
      to_regprocedure('public.cms_people_payload_is_publishable(jsonb)'),
      to_regprocedure('public.cms_facdev_payload_is_publishable(jsonb)')
    ]::oid[])
  ),
  'person_identity_functions_are_hardened'
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
      to_regprocedure('public.cms_normalize_person_identity(text)'),
      to_regprocedure('public.cms_upgrade_bilingual_person_array(jsonb,jsonb)'),
      to_regprocedure('public.cms_upgrade_person_identity_payload(public.cms_document_kind,jsonb)'),
      to_regprocedure('public.cms_jsonb_bilingual_person_arrays_are_valid(jsonb,jsonb)'),
      to_regprocedure('public.cms_jsonb_is_person(jsonb)'),
      to_regprocedure('public.cms_people_payload_is_publishable(jsonb)'),
      to_regprocedure('public.cms_facdev_payload_is_publishable(jsonb)')
    ]::oid[])
  ),
  'person_identity_functions_are_not_api_executable'
);
select is((select count(*) from person_identity_payloads), 2::bigint, 'person_identity_fixture_cardinality');
select results_eq(
  $$select kind::text from person_identity_payloads where case kind when 'people' then public.cms_people_payload_is_publishable(payload) when 'facdev' then public.cms_facdev_payload_is_publishable(payload) else false end is not true order by kind$$,
  array[]::text[],
  'person_identity_valid_seed_payloads'
);
select results_eq(
  $$select kind::text from person_identity_payloads where public.cms_payload_is_publishable(kind, payload) is not true order by kind$$,
  array[]::text[],
  'person_identity_valid_seed_dispatch'
);
select ok(
  public.cms_jsonb_is_person((select payload #> '{zh,centerPeople,0,people,0}' from person_identity_payloads where kind = 'people'))
    and public.cms_jsonb_is_person(jsonb_set((select payload #> '{zh,centerPeople,0,people,0}' from person_identity_payloads where kind = 'people'), '{portrait}', 'null'))
    and public.cms_jsonb_is_person((select (payload #> '{zh,centerPeople,0,people,0}') - 'portrait' from person_identity_payloads where kind = 'people')),
  'person_identity_portrait_optional_nullable_or_published'
);
select ok(
  public.cms_people_payload_is_publishable(
    jsonb_set((select payload from person_identity_payloads where kind = 'people'), '{en,centerPeople,0,people,0,portrait}', 'null')
  ),
  'person_identity_portraits_may_differ'
);
select ok(
  public.cms_people_payload_is_publishable(
    jsonb_set(
      jsonb_set(
        (select payload from person_identity_payloads where kind = 'people'),
        '{zh,centerPeople,0,people,0,portrait}',
        '{"kind":"draft","bucket":"draft-media","path":"87000000-0000-4000-8000-000000000001/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png"}'
      ),
      '{en,centerPeople,0,people,0,portrait}',
      '{"kind":"draft","bucket":"draft-media","path":"87000000-0000-4000-8000-000000000001/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png"}'
    )
  ) is false,
  'person_identity_draft_portrait_rejected_for_publication'
);
select is((select count(*) from person_identity_invalid_payloads), 15::bigint, 'person_identity_invalid_corpus_cardinality');
select results_eq(
  $$select name from person_identity_invalid_payloads where public.cms_people_payload_is_publishable(payload) is not false order by name$$,
  array[]::text[],
  'person_identity_invalid_corpus_rejected'
);
select ok(
  public.cms_people_payload_is_publishable((select payload from person_identity_upgraded_people)),
  'person_identity_people_upgrade_covers_every_scope'
);
select ok(
  public.cms_facdev_payload_is_publishable((select payload from person_identity_upgraded_facdev)),
  'person_identity_facdev_upgrade_covers_every_lead'
);
select ok(
  (
    select bool_and(public.cms_upgrade_person_identity_payload(kind, payload) = payload)
    from person_identity_payloads
  ),
  'person_identity_upgrade_preserves_existing_ids'
);
select is(
  (
    select jsonb_agg(person.value ->> 'id' order by person.ordinality)
    from jsonb_array_elements(public.cms_upgrade_bilingual_person_array(
      '[{"slug":"Slug Value","hubId":"ignored","email":"ignored","name":"甲"},{"slug":"","hubId":"Hub Value","email":"ignored","name":"乙"},{"slug":"","hubId":"","email":"User@Example.COM","name":"丙"},{"slug":"","hubId":"","email":"","name":"丁"},{"slug":"","hubId":"","email":"","name":"戊"}]',
      '[{"slug":"Slug Value","hubId":"ignored","email":"ignored","name":"Ignored"},{"slug":"","hubId":"Hub Value","email":"ignored","name":"Ignored"},{"slug":"","hubId":"","email":"User@Example.COM","name":"Ignored"},{"slug":"","hubId":"","email":"","name":"English Name"},{"slug":"","hubId":"","email":"","name":"中文"}]'
    ) -> 'zh') with ordinality as person(value, ordinality)
  ),
  '["slug-value","hub-value","user-example-com","english-name","person"]'::jsonb,
  'person_identity_upgrade_seed_fallback_order'
);
select is(
  (
    select jsonb_agg(person.value ->> 'id' order by person.ordinality)
    from jsonb_array_elements(public.cms_upgrade_bilingual_person_array(
      '[{"slug":"same base"},{"slug":"same base"}]',
      '[{"slug":"same base"},{"slug":"same base"}]'
    ) -> 'zh') with ordinality as person(value, ordinality)
  ),
  '["same-base","same-base-2"]'::jsonb,
  'person_identity_upgrade_collision_suffixes'
);
select throws_ok(
  $$select public.cms_upgrade_bilingual_person_array('[{"id":"kept"}]', '[{}]')$$,
  '23514', 'invalid bilingual person identity', 'person_identity_upgrade_rejects_one_sided_id'
);
select throws_ok(
  $$select public.cms_upgrade_bilingual_person_array('[{"id":"left"}]', '[{"id":"right"}]')$$,
  '23514', 'invalid bilingual person identity', 'person_identity_upgrade_rejects_divergent_id'
);
select throws_ok(
  $$select public.cms_upgrade_bilingual_person_array('[{"id":" "}]', '[{"id":" "}]')$$,
  '23514', 'invalid bilingual person identity', 'person_identity_upgrade_rejects_blank_id'
);
select throws_ok(
  $$select public.cms_upgrade_bilingual_person_array('[{"id":1}]', '[{"id":1}]')$$,
  '23514', 'invalid bilingual person identity', 'person_identity_upgrade_rejects_non_string_id'
);
select throws_ok(
  $$select public.cms_upgrade_bilingual_person_array('[{"id":"same"},{"id":"same"}]', '[{"id":"same"},{"id":"same"}]')$$,
  '23514', 'duplicate preserved person identity', 'person_identity_upgrade_rejects_duplicate_preserved_id'
);
select ok(
  public.cms_people_payload_is_publishable(
    public.cms_apply_media_replacements(
      (select payload from person_identity_draft_payload),
      jsonb_build_object(
        (select draft_reference ->> 'path' from person_identity_draft_payload),
        jsonb_build_object('kind', 'local', 'path', 'assets/validation-placeholder.jpg')
      )
    )
  ),
  'person_identity_valid_draft_transiently_validates'
);
select is(
  (select payload #> '{zh,centerPeople,0,people,0,portrait}' from person_identity_draft_payload),
  (select draft_reference from person_identity_draft_payload),
  'person_identity_valid_draft_stays_unchanged'
);
select throws_ok(
  $$select public.cms_collect_draft_media_paths(
    jsonb_set(
      (select payload from person_identity_draft_payload),
      '{zh,centerPeople,0,people,0,portrait}',
      '{"kind":"draft","bucket":"draft-media","path":"malformed"}'
    )
  )$$,
  '22023', 'malformed draft-like media reference', 'person_identity_malformed_draft_like_rejected'
);

select * from finish();
rollback;
