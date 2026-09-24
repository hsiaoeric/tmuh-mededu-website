-- allow: SIZE_OK - One rollback-wrapped pgTAP mutation corpus shares fixtures, temporary tables, and role transitions across direct save, dispatcher, finalization, and lifecycle assertions; splitting duplicates state and weakens correspondence.
begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
set local request.jwt.claims = '{}';

select plan(20);

insert into auth.users (id, email)
values ('85000000-0000-4000-8000-000000000001', 'wave5-validation-admin@example.test');

insert into public.cms_admins (user_id, created_by)
values (
  '85000000-0000-4000-8000-000000000001',
  '85000000-0000-4000-8000-000000000001'
);

create temporary table wave5_valid_payloads on commit drop as
select documents.kind, revisions.payload
from public.cms_documents as documents
join public.cms_revisions as revisions on revisions.document_id = documents.id
where revisions.status = 'published'
  and documents.kind in ('centers', 'people', 'news', 'activities', 'kpis', 'honors');

create temporary table wave5_invalid_payloads (
  name text primary key,
  kind public.cms_document_kind not null,
  payload jsonb not null
) on commit drop;

with fixture as (
  select payload from wave5_valid_payloads where kind = 'news'
)
insert into wave5_invalid_payloads (name, kind, payload)
select 'news_wrong_locale_date', 'news'::public.cms_document_kind, jsonb_set(payload, '{zh,department,0,publishedOn}', '"2020-01-01"') from fixture
union all
select 'news_wrong_english_locale_date', 'news'::public.cms_document_kind, jsonb_set(payload, '{en,department,0,publishedOn}', '"2020-01-01"') from fixture
union all
select 'news_wrong_zh_latest_update', 'news'::public.cms_document_kind, jsonb_set(payload, '{zh,latestUpdate}', '"1999/01/01"') from fixture
union all
select 'news_wrong_en_latest_update', 'news'::public.cms_document_kind, jsonb_set(payload, '{en,latestUpdate}', '"Jan 1, 1999"') from fixture
union all
select 'news_invalid_calendar_date', 'news'::public.cms_document_kind, jsonb_set(payload, '{zh,department,0,publishedOn}', '"2026-02-30"') from fixture
union all
select 'news_non_string_title', 'news'::public.cms_document_kind, jsonb_set(payload, '{zh,department,0,title}', '42') from fixture
union all
select 'news_department_parity', 'news'::public.cms_document_kind, payload #- '{en,department,0}' from fixture
union all
select 'news_holistic_parity', 'news'::public.cms_document_kind, payload #- '{en,holistic,0}' from fixture
union all
select 'news_department_category_parity', 'news'::public.cms_document_kind, jsonb_set(payload, '{en,department}', (select coalesce(jsonb_agg(item.value order by item.ordinality desc), '[]'::jsonb) from jsonb_array_elements(payload #> '{en,department}') with ordinality as item(value, ordinality))) from fixture
union all
select 'news_holistic_category_parity', 'news'::public.cms_document_kind, jsonb_set(payload, '{en,holistic}', (select coalesce(jsonb_agg(jsonb_set(item.value, '{category}', '"department"') order by item.ordinality), '[]'::jsonb) from jsonb_array_elements(payload #> '{en,holistic}') with ordinality as item(value, ordinality))) from fixture;

with fixture as (
  select payload from wave5_valid_payloads where kind = 'activities'
)
insert into wave5_invalid_payloads (name, kind, payload)
select 'activities_wrong_locale_date', 'activities'::public.cms_document_kind, jsonb_set(payload, '{zh,holistic,0,date}', payload #> '{en,holistic,0,date}') from fixture
union all
select 'activities_wrong_english_locale_date', 'activities'::public.cms_document_kind, jsonb_set(payload, '{en,holistic,0,date}', payload #> '{zh,holistic,0,date}') from fixture
union all
select 'activities_invalid_calendar_date', 'activities'::public.cms_document_kind, jsonb_set(payload, '{zh,holistic,0,date}', '"2026/02/30（一）12:30–13:30"') from fixture
union all
select 'activities_invalid_clock', 'activities'::public.cms_document_kind, jsonb_set(payload, '{en,holistic,0,date}', '"Wed 2026/07/22 12:70–13:30"') from fixture
union all
select 'activities_reversed_time', 'activities'::public.cms_document_kind, jsonb_set(payload, '{zh,holistic,0,date}', '"2026/07/22（三）13:30–12:30"') from fixture
union all
select 'activities_http_url', 'activities'::public.cms_document_kind, jsonb_set(payload, '{zh,holistic,0,link}', '"http://example.test/course"') from fixture
union all
select 'activities_credentialed_url', 'activities'::public.cms_document_kind, jsonb_set(payload, '{zh,holistic,0,link}', '"https://user:secret@example.test/course"') from fixture
union all
select 'activities_whitespace_url', 'activities'::public.cms_document_kind, jsonb_set(payload, '{zh,holistic,0,link}', '" https://example.test/course"') from fixture
union all
select 'activities_embedded_whitespace_url', 'activities'::public.cms_document_kind, jsonb_set(payload, '{zh,holistic,0,link}', to_jsonb(E'https://exam\tple.test/course'::text)) from fixture
union all
select 'activities_malformed_percent_host_url', 'activities'::public.cms_document_kind, jsonb_set(payload, '{zh,holistic,0,link}', '"https://%zz/course"') from fixture
union all
select 'activities_malformed_ipv6_url', 'activities'::public.cms_document_kind, jsonb_set(payload, '{zh,holistic,0,link}', '"https://[:::]/course"') from fixture
union all
select 'activities_department_parity', 'activities'::public.cms_document_kind, jsonb_set(payload, '{en,department}', jsonb_build_array(payload #> '{en,holistic,0}')) from fixture
union all
select 'activities_holistic_parity', 'activities'::public.cms_document_kind, payload #- '{en,holistic,0}' from fixture;

with fixture as (
  select payload from wave5_valid_payloads where kind = 'centers'
)
insert into wave5_invalid_payloads (name, kind, payload)
select 'centers_http_url', 'centers'::public.cms_document_kind, jsonb_set(payload, '{zh,centers,0,externalUrl}', '"http://example.test/center"') from fixture
union all
select 'centers_credentialed_url', 'centers'::public.cms_document_kind, jsonb_set(payload, '{zh,centers,0,externalUrl}', '"https://user:secret@example.test/center"') from fixture
union all
select 'centers_whitespace_url', 'centers'::public.cms_document_kind, jsonb_set(payload, '{zh,centers,0,externalUrl}', '"https://example.test/center "') from fixture
union all
select 'centers_malformed_port_url', 'centers'::public.cms_document_kind, jsonb_set(payload, '{zh,centers,0,externalUrl}', '"https://example.test:not-a-port/center"') from fixture
union all
select 'centers_empty_port_url', 'centers'::public.cms_document_kind, jsonb_set(payload, '{zh,centers,0,externalUrl}', '"https://example.test:/center"') from fixture
union all
select 'centers_out_of_range_port_url', 'centers'::public.cms_document_kind, jsonb_set(payload, '{zh,centers,0,externalUrl}', '"https://example.test:65536/center"') from fixture
union all
select 'centers_ordered_id_parity', 'centers'::public.cms_document_kind, jsonb_set(payload, '{en,centers,0,id}', '"mismatch"') from fixture
union all
select 'centers_branch_id_parity', 'centers'::public.cms_document_kind, payload #- '{en,centers,0,branches,0}' from fixture;

with fixture as (
  select payload from wave5_valid_payloads where kind = 'people'
)
insert into wave5_invalid_payloads (name, kind, payload)
select 'people_group_id_parity', 'people'::public.cms_document_kind, jsonb_set(payload, '{en,centerPeople,0,centerId}', '"mismatch"') from fixture
union all
select 'people_nested_people_parity', 'people'::public.cms_document_kind, payload #- '{en,centerPeople,0,people,0}' from fixture
union all
select 'people_holistic_instructors_parity', 'people'::public.cms_document_kind, payload #- '{en,holisticInstructors,0}' from fixture
union all
select 'people_holistic_seed_teachers_parity', 'people'::public.cms_document_kind, payload #- '{en,holisticSeedTeachers,0}' from fixture
union all
select 'people_holistic_ai_team_parity', 'people'::public.cms_document_kind, payload #- '{en,holisticAiTeam,0}' from fixture;

with fixture as (
  select payload from wave5_valid_payloads where kind = 'kpis'
)
insert into wave5_invalid_payloads (name, kind, payload)
select 'kpis_items_parity', 'kpis'::public.cms_document_kind, payload #- '{en,items,0}' from fixture;

with fixture as (
  select payload from wave5_valid_payloads where kind = 'honors'
)
insert into wave5_invalid_payloads (name, kind, payload)
select 'honors_projects_parity', 'honors'::public.cms_document_kind, payload #- '{en,snqProjects,0}' from fixture
union all
select 'honors_members_parity', 'honors'::public.cms_document_kind, payload #- '{en,snqProjects,0,members,0}' from fixture
union all
select 'honors_year_counts_parity', 'honors'::public.cms_document_kind, payload #- '{en,snqYearCounts,0}' from fixture
union all
select 'honors_leads_parity', 'honors'::public.cms_document_kind, payload #- '{en,nhqa,leads,0}' from fixture
union all
select 'honors_keywords_parity', 'honors'::public.cms_document_kind, payload #- '{en,nhqa,keywords,0}' from fixture;

create temporary table wave5_save_outcomes (
  name text primary key,
  sqlstate text,
  detail text
) on commit drop;

grant select on table wave5_invalid_payloads, wave5_valid_payloads to authenticated;
grant select, insert on table wave5_save_outcomes to authenticated;

insert into public.cms_documents (id, kind, stable_key)
values
  ('85000000-0000-4000-8000-000000000010', 'centers', 'wave5-validation-centers'),
  ('85000000-0000-4000-8000-000000000020', 'people', 'wave5-validation-people'),
  ('85000000-0000-4000-8000-000000000030', 'news', 'wave5-validation-news'),
  ('85000000-0000-4000-8000-000000000040', 'activities', 'wave5-validation-activities'),
  ('85000000-0000-4000-8000-000000000050', 'kpis', 'wave5-validation-kpis'),
  ('85000000-0000-4000-8000-000000000060', 'honors', 'wave5-validation-honors'),
  ('85000000-0000-4000-8000-000000000070', 'news', 'wave5-validation-finalize'),
  ('85000000-0000-4000-8000-000000000080', 'news', 'wave5-validation-trigger');

insert into public.cms_revisions (id, document_id, version, status, payload)
select
  ('85000000-0000-4000-8000-' || lpad((row_number() over (order by kind))::text, 12, '0'))::uuid,
  case kind
    when 'centers' then '85000000-0000-4000-8000-000000000010'::uuid
    when 'people' then '85000000-0000-4000-8000-000000000020'::uuid
    when 'news' then '85000000-0000-4000-8000-000000000030'::uuid
    when 'activities' then '85000000-0000-4000-8000-000000000040'::uuid
    when 'kpis' then '85000000-0000-4000-8000-000000000050'::uuid
    when 'honors' then '85000000-0000-4000-8000-000000000060'::uuid
    else null
  end,
  1,
  'draft',
  payload
from wave5_valid_payloads;

insert into public.cms_revisions (id, document_id, version, status, payload)
values (
  '85000000-0000-4000-8000-000000000071',
  '85000000-0000-4000-8000-000000000070',
  1,
  'draft',
  (select payload from wave5_invalid_payloads where name = 'news_wrong_locale_date')
);

create function pg_temp.exercise_invalid_saves()
returns void
language plpgsql
as $$
declare
  invalid_case record;
  target_document_id uuid;
  revision_id uuid;
  captured_state text;
  captured_detail text;
begin
  for invalid_case in select * from pg_temp.wave5_invalid_payloads order by name loop
    target_document_id := case invalid_case.kind
      when 'centers' then '85000000-0000-4000-8000-000000000010'::uuid
      when 'people' then '85000000-0000-4000-8000-000000000020'::uuid
      when 'news' then '85000000-0000-4000-8000-000000000030'::uuid
      when 'activities' then '85000000-0000-4000-8000-000000000040'::uuid
      when 'kpis' then '85000000-0000-4000-8000-000000000050'::uuid
      when 'honors' then '85000000-0000-4000-8000-000000000060'::uuid
      else null
    end;
    select id into revision_id
    from public.cms_revisions
    where cms_revisions.document_id = target_document_id
      and status = 'draft';
    captured_state := null;
    captured_detail := null;
    begin
      perform public.cms_save_draft(target_document_id, revision_id, 1, invalid_case.payload);
    exception when others then
      get stacked diagnostics
        captured_state = returned_sqlstate,
        captured_detail = pg_exception_detail;
    end;
    insert into pg_temp.wave5_save_outcomes (name, sqlstate, detail)
    values (invalid_case.name, captured_state, captured_detail);
  end loop;
end;
$$;

select ok(
  to_regprocedure('public.cms_jsonb_is_credential_free_https_url(jsonb)') is not null
    and to_regprocedure('public.cms_jsonb_is_localized_calendar_date(jsonb,text)') is not null
    and to_regprocedure('public.cms_jsonb_is_localized_activity_datetime(jsonb,text)') is not null
    and to_regprocedure('public.cms_jsonb_arrays_have_equal_length(jsonb,jsonb)') is not null
    and to_regprocedure('public.cms_jsonb_arrays_have_matching_field(jsonb,jsonb,text)') is not null
    and to_regprocedure('public.cms_jsonb_paired_nested_arrays_have_equal_length(jsonb,jsonb,text)') is not null
    and to_regprocedure('public.cms_jsonb_paired_nested_arrays_have_matching_field(jsonb,jsonb,text,text)') is not null
    and to_regprocedure('public.cms_wave5_global_payload_is_valid(public.cms_document_kind,jsonb)') is not null,
  'Wave 5 helper and predicate signatures exist'
);
select ok(
  (
    select count(*) = 8
      and bool_and(provolatile = 'i' and proisstrict and not prosecdef)
      and bool_and(coalesce(proconfig, '{}'::text[]) @> array['search_path=""'])
      and bool_and(pg_get_userbyid(proowner) = 'postgres')
    from pg_proc
    where oid = any(array[
      to_regprocedure('public.cms_jsonb_is_credential_free_https_url(jsonb)'),
      to_regprocedure('public.cms_jsonb_is_localized_calendar_date(jsonb,text)'),
      to_regprocedure('public.cms_jsonb_is_localized_activity_datetime(jsonb,text)'),
      to_regprocedure('public.cms_jsonb_arrays_have_equal_length(jsonb,jsonb)'),
      to_regprocedure('public.cms_jsonb_arrays_have_matching_field(jsonb,jsonb,text)'),
      to_regprocedure('public.cms_jsonb_paired_nested_arrays_have_equal_length(jsonb,jsonb,text)'),
      to_regprocedure('public.cms_jsonb_paired_nested_arrays_have_matching_field(jsonb,jsonb,text,text)'),
      to_regprocedure('public.cms_wave5_global_payload_is_valid(public.cms_document_kind,jsonb)')
    ]::oid[])
  ),
  'Wave 5 predicates are immutable strict invokers owned by postgres with empty search paths'
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
      to_regprocedure('public.cms_jsonb_is_credential_free_https_url(jsonb)'),
      to_regprocedure('public.cms_jsonb_is_localized_calendar_date(jsonb,text)'),
      to_regprocedure('public.cms_jsonb_is_localized_activity_datetime(jsonb,text)'),
      to_regprocedure('public.cms_jsonb_arrays_have_equal_length(jsonb,jsonb)'),
      to_regprocedure('public.cms_jsonb_arrays_have_matching_field(jsonb,jsonb,text)'),
      to_regprocedure('public.cms_jsonb_paired_nested_arrays_have_equal_length(jsonb,jsonb,text)'),
      to_regprocedure('public.cms_jsonb_paired_nested_arrays_have_matching_field(jsonb,jsonb,text,text)'),
      to_regprocedure('public.cms_wave5_global_payload_is_valid(public.cms_document_kind,jsonb)')
    ]::oid[])
  ),
  'API roles cannot execute Wave 5 predicates'
);
select ok(public.cms_jsonb_is_credential_free_https_url('"https://example.test/path?q=1#ok"'), 'HTTPS helper accepts a credential-free absolute URL');
select ok(public.cms_jsonb_is_credential_free_https_url('"http://example.test"') is not true, 'HTTPS helper rejects HTTP');
select ok(public.cms_jsonb_is_credential_free_https_url('"https://user:secret@example.test/path"') is not true, 'HTTPS helper rejects credentials');
select ok(public.cms_jsonb_is_credential_free_https_url('" https://example.test/path"') is not true, 'HTTPS helper rejects surrounding whitespace');
select ok(public.cms_jsonb_is_credential_free_https_url('"https://example.test:not-a-port/path"') is not true, 'HTTPS helper rejects a malformed port');
select results_eq(
  $$
    select name
    from (values
      ('ordinary_dns', 'https://tmuh.org.tw/education', true),
      ('valid_port', 'https://tmuh.org.tw:443/education', true),
      ('highest_valid_port', 'https://tmuh.org.tw:65535/education', true),
      ('embedded_whitespace', E'https://tmuh.org.tw/edu\tcation', false),
      ('malformed_percent_host', 'https://%zz/education', false),
      ('malformed_ipv6', 'https://[:::]/education', false),
      ('credentials', 'https://editor:secret@tmuh.org.tw/education', false),
      ('empty_port', 'https://tmuh.org.tw:/education', false),
      ('zero_port', 'https://tmuh.org.tw:0/education', false),
      ('out_of_range_port', 'https://tmuh.org.tw:65536/education', false),
      ('malformed_dns_host', 'https://-tmuh.org.tw/education', false)
    ) as corpus(name, value, expected)
    where public.cms_jsonb_is_credential_free_https_url(to_jsonb(value)) is distinct from expected
    order by name
  $$,
  array[]::text[],
  'HTTPS helper matches the supported credential-free URL corpus'
);
select results_eq(
  -- centers, news, and activities bypass the Wave 5 predicate in the dispatcher; their dedicated validators own those shapes.
  $$select kind::text from wave5_valid_payloads where kind not in ('centers', 'news', 'activities') and not public.cms_wave5_global_payload_is_valid(kind, payload) order by kind$$,
  array[]::text[],
  'Wave 5 predicate accepts every current global snapshot it still governs'
);
select results_eq(
  $$select kind::text from wave5_valid_payloads where not public.cms_payload_is_publishable(kind, payload) order by kind$$,
  array[]::text[],
  'publication dispatcher accepts every current global snapshot'
);
select results_eq(
  $$select name from wave5_invalid_payloads where public.cms_wave5_global_payload_is_valid(kind, payload) order by name$$,
  array[]::text[],
  'Wave 5 predicate rejects the complete invalid mutation corpus'
);
select results_eq(
  $$select name from wave5_invalid_payloads where public.cms_payload_is_publishable(kind, payload) order by name$$,
  array[]::text[],
  'publication dispatcher rejects the complete invalid mutation corpus'
);

set local request.jwt.claims = '{"sub":"85000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;
select pg_temp.exercise_invalid_saves();
select is((select count(*)::integer from wave5_save_outcomes), 42, 'direct draft save exercises every invalid mutation');
select results_eq(
  $$select name from wave5_save_outcomes where sqlstate is distinct from '23514' or detail is distinct from 'cms_contract_invalid' order by name$$,
  array[]::text[],
  'direct draft save rejects every TypeScript-invalid mutation with a stable contract error'
);
select ok(
  (select bool_and(edit_version = 1) from public.cms_revisions where document_id in (
    '85000000-0000-4000-8000-000000000010', '85000000-0000-4000-8000-000000000020',
    '85000000-0000-4000-8000-000000000030', '85000000-0000-4000-8000-000000000040',
    '85000000-0000-4000-8000-000000000050', '85000000-0000-4000-8000-000000000060'
  )),
  'rejected draft saves preserve every payload and edit token'
);
reset role;

set local role service_role;
select throws_ok(
  $$select public.cms_finalize_media_publication(
    '85000000-0000-4000-8000-000000000070',
    '85000000-0000-4000-8000-000000000071',
    1,
    '85000000-0000-4000-8000-000000000001',
    '{}'::jsonb
  )$$,
  '23514',
  'payload does not match CMS document kind news',
  'service finalization rejects a TypeScript-invalid saved payload'
);
reset role;
select is(
  (select status::text || '|' || edit_version::text from public.cms_revisions where id = '85000000-0000-4000-8000-000000000071'),
  'draft|1',
  'rejected finalization preserves the draft lifecycle'
);
select throws_ok(
  $$insert into public.cms_revisions (
      id, document_id, version, status, payload, published_at, published_by
    ) values (
      '85000000-0000-4000-8000-000000000081',
      '85000000-0000-4000-8000-000000000080',
      1,
      'published',
      (select payload from wave5_invalid_payloads where name = 'news_wrong_locale_date'),
      statement_timestamp(),
      '85000000-0000-4000-8000-000000000001'
    )$$,
  '23514',
  'payload does not match CMS document kind news',
  'lifecycle trigger rejects a direct TypeScript-invalid publication'
);
select is(
  (select count(*)::integer from public.cms_revisions where document_id = '85000000-0000-4000-8000-000000000080'),
  0,
  'rejected direct publication leaves no revision row'
);

select * from finish();
rollback;
