begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
set local request.jwt.claims = '{}';

select plan(88);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'cms-admin@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'reader@example.test');

insert into public.cms_admins (user_id, created_by)
values (
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111'
);

create temporary table cms_valid_payload_fixtures on commit drop as
select documents.kind, revisions.payload
from public.cms_documents as documents
join public.cms_revisions as revisions on revisions.document_id = documents.id
where revisions.status = 'published'
  and (documents.kind, documents.stable_key) in (
    ('site_copy', 'global'),
    ('centers', 'directory'),
    ('people', 'directory'),
    ('news', 'announcements'),
    ('activities', 'calendar'),
    ('kpis', 'department'),
    ('honors', 'department'),
    ('digital_materials', 'page'),
    ('facdev', 'page'),
    ('ebm', 'page'),
    ('holistic', 'page'),
    ('holistic_research', 'registry')
  );

insert into public.cms_documents (id, kind, stable_key)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'news', 'security-test'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'holistic', 'private-test'),
  ('99999999-9999-9999-9999-999999999999', 'news', 'trigger-test');

insert into public.cms_revisions (
  id, document_id, version, status, payload, published_at, published_by
)
values
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    1,
    'published',
    (select payload from cms_valid_payload_fixtures where kind = 'news'),
    statement_timestamp(),
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    2,
    'draft',
    (select payload from cms_valid_payload_fixtures where kind = 'news'),
    null,
    null
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    1,
    'draft',
    '{"zh":{},"en":{}}',
    null,
    null
  );

insert into storage.objects (bucket_id, name)
values
  ('public-media', 'published/test-image.jpg'),
  ('draft-media', 'draft/test-image.jpg');

select has_table('public', 'cms_documents', 'generic document table exists');
select has_table('public', 'cms_revisions', 'versioned revision table exists');
select has_table('public', 'cms_admins', 'single administrator allowlist exists');
select has_type('public', 'cms_document_kind', 'document domains use a constrained kind type');
select ok(
  public.cms_payload_is_publishable('news', '{"zh":{},"en":{}}'::jsonb) is not true,
  'empty bilingual news scaffolding cannot be published'
);
select ok(
  public.cms_payload_is_publishable(
    'news',
    (select payload from cms_valid_payload_fixtures where kind = 'news')
  ),
  'generated news payload satisfies its publication contract'
);

select ok(
  (
    select count(*) = 21
      and bool_and(to_regprocedure(signature) is not null)
    from unnest(array[
      'public.cms_jsonb_has_exact_keys(jsonb,text[],text[])',
      'public.cms_jsonb_is_text_array(jsonb)',
      'public.cms_jsonb_is_hex_color(jsonb)',
      'public.cms_jsonb_is_https_url(jsonb)',
      'public.cms_jsonb_is_published_media_reference(jsonb)',
      'public.cms_jsonb_is_person(jsonb)',
      'public.cms_jsonb_is_kpi(jsonb)',
      'public.cms_site_copy_payload_is_publishable(jsonb)',
      'public.cms_centers_payload_is_publishable(jsonb)',
      'public.cms_people_payload_is_publishable(jsonb)',
      'public.cms_news_payload_is_publishable(jsonb)',
      'public.cms_activities_payload_is_publishable(jsonb)',
      'public.cms_kpis_payload_is_publishable(jsonb)',
      'public.cms_honors_payload_is_publishable(jsonb)',
      'public.cms_digital_materials_payload_is_publishable(jsonb)',
      'public.cms_facdev_payload_is_publishable(jsonb)',
      'public.cms_ebm_payload_is_publishable(jsonb)',
      'public.cms_holistic_payload_is_publishable(jsonb)',
      'public.cms_holistic_research_payload_is_publishable(jsonb)',
      'public.cms_payload_is_publishable(jsonb)',
      'public.cms_payload_is_publishable(public.cms_document_kind,jsonb)'
    ]) as expected(signature)
  ),
  'exact validator signature inventory exists'
);
select ok(
  (select bool_and(provolatile = 'i') from pg_proc where oid = any(array[
    to_regprocedure('public.cms_jsonb_has_exact_keys(jsonb,text[],text[])'),
    to_regprocedure('public.cms_jsonb_is_text_array(jsonb)'),
    to_regprocedure('public.cms_jsonb_is_hex_color(jsonb)'),
    to_regprocedure('public.cms_jsonb_is_https_url(jsonb)'),
    to_regprocedure('public.cms_jsonb_is_published_media_reference(jsonb)'),
    to_regprocedure('public.cms_jsonb_is_person(jsonb)'),
    to_regprocedure('public.cms_jsonb_is_kpi(jsonb)'),
    to_regprocedure('public.cms_site_copy_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_centers_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_people_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_news_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_activities_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_kpis_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_honors_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_digital_materials_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_facdev_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_ebm_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_holistic_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_holistic_research_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_payload_is_publishable(public.cms_document_kind,jsonb)')
  ]::oid[])),
  'every publication predicate is immutable'
);
select ok(
  (select count(*) = 21 and bool_and(proisstrict) from pg_proc where oid = any(array[
    to_regprocedure('public.cms_jsonb_has_exact_keys(jsonb,text[],text[])'),
    to_regprocedure('public.cms_jsonb_is_text_array(jsonb)'),
    to_regprocedure('public.cms_jsonb_is_hex_color(jsonb)'),
    to_regprocedure('public.cms_jsonb_is_https_url(jsonb)'),
    to_regprocedure('public.cms_jsonb_is_published_media_reference(jsonb)'),
    to_regprocedure('public.cms_jsonb_is_person(jsonb)'),
    to_regprocedure('public.cms_jsonb_is_kpi(jsonb)'),
    to_regprocedure('public.cms_site_copy_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_centers_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_people_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_news_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_activities_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_kpis_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_honors_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_digital_materials_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_facdev_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_ebm_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_holistic_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_holistic_research_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_payload_is_publishable(jsonb)'),
    to_regprocedure('public.cms_payload_is_publishable(public.cms_document_kind,jsonb)')
  ]::oid[])),
  'every publication predicate is strict'
);
select ok(
  (select count(*) = 21 and bool_and(not prosecdef) from pg_proc where pronamespace = 'public'::regnamespace and proname like 'cms_%' and (proname like 'cms_jsonb_%' or proname like 'cms_%_payload_is_publishable' or proname = 'cms_payload_is_publishable')),
  'every publication predicate is security invoker'
);
select ok(
  (select count(*) = 21 and bool_and(coalesce(proconfig, '{}'::text[]) @> array['search_path=""']) from pg_proc where pronamespace = 'public'::regnamespace and (proname like 'cms_jsonb_%' or proname like 'cms_%_payload_is_publishable' or proname = 'cms_payload_is_publishable')),
  'every publication predicate fixes an empty search path'
);
select ok(
  (select bool_and(not has_function_privilege('public', oid, 'EXECUTE')) from pg_proc where pronamespace = 'public'::regnamespace and (proname like 'cms_jsonb_%' or proname like 'cms_%_payload_is_publishable' or proname = 'cms_payload_is_publishable')),
  'PUBLIC cannot execute publication predicates'
);
select ok(
  (select bool_and(not has_function_privilege('anon', oid, 'EXECUTE') and not has_function_privilege('authenticated', oid, 'EXECUTE')) from pg_proc where pronamespace = 'public'::regnamespace and (proname like 'cms_jsonb_%' or proname like 'cms_%_payload_is_publishable' or proname = 'cms_payload_is_publishable')),
  'API roles cannot execute publication predicates'
);
select ok(
  (select prosecdef
      and coalesce(proconfig, '{}'::text[]) @> array['search_path=""']
      and has_function_privilege('authenticated', oid, 'EXECUTE')
      and not has_function_privilege('public', oid, 'EXECUTE')
      and not has_function_privilege('anon', oid, 'EXECUTE')
    from pg_proc where oid = 'public.cms_publish_revision(uuid,uuid,bigint)'::regprocedure),
  'publish RPC remains hardened and authenticated-only'
);

select ok(public.cms_payload_is_publishable('site_copy', (select payload from cms_valid_payload_fixtures where kind = 'site_copy')), 'generated site_copy payload is valid');
select ok(public.cms_payload_is_publishable('centers', (select payload from cms_valid_payload_fixtures where kind = 'centers')), 'generated centers payload is valid');
select ok(public.cms_payload_is_publishable('people', (select payload from cms_valid_payload_fixtures where kind = 'people')), 'generated people payload is valid');
select ok(public.cms_payload_is_publishable('activities', (select payload from cms_valid_payload_fixtures where kind = 'activities')), 'generated activities payload is valid');
select ok(public.cms_payload_is_publishable('kpis', (select payload from cms_valid_payload_fixtures where kind = 'kpis')), 'generated kpis payload is valid');
select ok(public.cms_payload_is_publishable('honors', (select payload from cms_valid_payload_fixtures where kind = 'honors')), 'generated honors payload is valid');
select ok(public.cms_payload_is_publishable('digital_materials', (select payload from cms_valid_payload_fixtures where kind = 'digital_materials')), 'generated digital_materials payload is valid');
select ok(public.cms_payload_is_publishable('facdev', (select payload from cms_valid_payload_fixtures where kind = 'facdev')), 'generated facdev payload is valid');
select ok(public.cms_payload_is_publishable('ebm', (select payload from cms_valid_payload_fixtures where kind = 'ebm')), 'generated ebm payload is valid');
select ok(public.cms_payload_is_publishable('holistic', (select payload from cms_valid_payload_fixtures where kind = 'holistic')), 'generated holistic payload is valid');
select ok(public.cms_payload_is_publishable('holistic_research', (select payload from cms_valid_payload_fixtures where kind = 'holistic_research')), 'generated holistic_research payload is valid');

select ok(public.cms_payload_is_publishable('site_copy', (select payload from cms_valid_payload_fixtures where kind = 'centers')) is not true, 'site_copy rejects centers payload');
select ok(public.cms_payload_is_publishable('centers', (select payload from cms_valid_payload_fixtures where kind = 'people')) is not true, 'centers rejects people payload');
select ok(public.cms_payload_is_publishable('people', (select payload from cms_valid_payload_fixtures where kind = 'news')) is not true, 'people rejects news payload');
select ok(public.cms_payload_is_publishable('news', (select payload from cms_valid_payload_fixtures where kind = 'digital_materials')) is not true, 'news rejects digital_materials payload');
select ok(public.cms_payload_is_publishable('activities', (select payload from cms_valid_payload_fixtures where kind = 'kpis')) is not true, 'activities rejects kpis payload');
select ok(public.cms_payload_is_publishable('kpis', (select payload from cms_valid_payload_fixtures where kind = 'honors')) is not true, 'kpis rejects honors payload');
select ok(public.cms_payload_is_publishable('honors', (select payload from cms_valid_payload_fixtures where kind = 'activities')) is not true, 'honors rejects activities payload');
select ok(public.cms_payload_is_publishable('digital_materials', (select payload from cms_valid_payload_fixtures where kind = 'facdev')) is not true, 'digital_materials rejects facdev payload');
select ok(public.cms_payload_is_publishable('facdev', (select payload from cms_valid_payload_fixtures where kind = 'ebm')) is not true, 'facdev rejects ebm payload');
select ok(public.cms_payload_is_publishable('ebm', (select payload from cms_valid_payload_fixtures where kind = 'holistic')) is not true, 'ebm rejects holistic payload');
select ok(public.cms_payload_is_publishable('holistic', (select payload from cms_valid_payload_fixtures where kind = 'holistic_research')) is not true, 'holistic rejects holistic_research payload');
select ok(public.cms_payload_is_publishable('holistic_research', (select payload from cms_valid_payload_fixtures where kind = 'site_copy')) is not true, 'holistic_research rejects site_copy payload');

select ok(public.cms_payload_is_publishable('site_copy', (select payload #- '{en,inline,skipToContent}' from cms_valid_payload_fixtures where kind = 'site_copy')) is not true, 'site_copy rejects a missing nested key');
select ok(public.cms_payload_is_publishable('centers', (select jsonb_set(payload, '{zh,centers,0,unknown}', 'true') from cms_valid_payload_fixtures where kind = 'centers')) is not true, 'centers rejects an unknown center key');
select ok(public.cms_payload_is_publishable('people', (select jsonb_set(payload, '{zh,centerPeople}', '{}'::jsonb) from cms_valid_payload_fixtures where kind = 'people')) is not true, 'people rejects a wrong collection container');
select ok(public.cms_payload_is_publishable('news', (select jsonb_set(payload, '{zh,latestUpdate}', 'null'::jsonb) from cms_valid_payload_fixtures where kind = 'news')) is not true, 'news rejects JSON null latestUpdate');
select ok(public.cms_payload_is_publishable('activities', (select jsonb_set(payload, '{zh,holistic,0,link}', '"http://example.test"'::jsonb) from cms_valid_payload_fixtures where kind = 'activities')) is not true, 'activities rejects an unsafe activity link');
select ok(public.cms_payload_is_publishable('kpis', (select jsonb_set(payload, '{zh,items,0,unknown}', 'true') from cms_valid_payload_fixtures where kind = 'kpis')) is not true, 'kpis rejects an unknown KPI key');
select ok(public.cms_payload_is_publishable('honors', (select jsonb_set(payload, '{zh,snqYearCounts,0,count}', '"1"'::jsonb) from cms_valid_payload_fixtures where kind = 'honors')) is not true, 'honors rejects a string year count');
select ok(public.cms_payload_is_publishable('digital_materials', (select jsonb_set(payload, '{zh,unknown}', 'true') from cms_valid_payload_fixtures where kind = 'digital_materials')) is not true, 'digital_materials rejects an unknown locale key');
select ok(public.cms_payload_is_publishable('facdev', (select jsonb_set(payload, '{zh,groups,0,lead,portrait}', '{"kind":"draft","bucket":"draft-media","path":"11111111-1111-1111-1111-111111111111/person.jpg"}'::jsonb) from cms_valid_payload_fixtures where kind = 'facdev')) is not true, 'facdev rejects draft lead media');
select ok(public.cms_payload_is_publishable('ebm', (select jsonb_set(payload, '{zh,kpis}', 'null'::jsonb) from cms_valid_payload_fixtures where kind = 'ebm')) is not true, 'ebm rejects JSON null KPI collection');
select ok(public.cms_payload_is_publishable('holistic', (select jsonb_set(payload, '{zh,outcomes,symposiums,0,year}', '2026.5'::jsonb) from cms_valid_payload_fixtures where kind = 'holistic')) is not true, 'holistic rejects a fractional symposium year');
select ok(public.cms_payload_is_publishable('holistic_research', (select jsonb_set(payload, '{zh,papers,0,month}', '13'::jsonb) from cms_valid_payload_fixtures where kind = 'holistic_research')) is not true, 'holistic_research rejects an out-of-range month');

set local role anon;
select throws_ok(
  $$select public.cms_payload_is_publishable('news', '{}'::jsonb)$$,
  '42501',
  null,
  'anonymous users cannot execute the kind-aware validator'
);
select results_eq(
  $$select count(*)::integer from public.cms_documents
    where id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')$$,
  array[1],
  'anonymous users see only documents with a publication'
);
select results_eq(
  $$select count(*)::integer from public.cms_revisions
    where document_id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')$$,
  array[1],
  'anonymous users see only published revisions'
);
select results_eq(
  $$select count(*)::integer from public.cms_published_content
    where document_id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')$$,
  array[1],
  'public view exposes one published document'
);
select results_eq(
  $$select count(*)::integer from public.cms_get_published_content('news', 'security-test')$$,
  array[1],
  'public RPC exposes the selected published document'
);
select throws_ok(
  $$select * from public.cms_admins$$,
  '42501',
  null,
  'anonymous users cannot select the administrator allowlist'
);
select results_eq(
  $$select count(*)::integer from storage.objects where bucket_id = 'public-media'$$,
  array[1],
  'anonymous users can read public media metadata'
);
select results_eq(
  $$select count(*)::integer from storage.objects where bucket_id = 'draft-media'$$,
  array[0],
  'anonymous users cannot read draft media metadata'
);
reset role;

set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
set local role authenticated;
select results_eq(
  $$select count(*)::integer from public.cms_documents
    where id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')$$,
  array[1],
  'non-admin authenticated users see the anonymous document set'
);
select results_eq(
  $$select count(*)::integer from public.cms_revisions
    where document_id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')$$,
  array[1],
  'non-admin authenticated users see the anonymous revision set'
);
select throws_ok(
  $$update public.cms_revisions
    set payload = '{"zh":{"x":1},"en":{"x":1}}'
    where id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'$$,
  '42501',
  null,
  'non-admin users cannot update drafts'
);
select throws_ok(
  $$select public.cms_clone_revision('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')$$,
  '42501',
  'CMS administrator access required',
  'non-admin users cannot clone revisions'
);
select throws_ok(
  $$select public.cms_publish_revision(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'dddddddd-dddd-dddd-dddd-dddddddddddd',
      1
    )$$,
  '42501',
  'CMS administrator access required',
  'non-admin users cannot publish revisions'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('public-media', 'unauthorized.jpg')$$,
  '42501',
  null,
  'non-admin users cannot write public media'
);
select results_eq(
  $$select count(*)::integer from storage.objects where bucket_id = 'draft-media'$$,
  array[0],
  'non-admin users cannot read draft media metadata'
);
reset role;

set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
set local role authenticated;
select ok(public.is_cms_admin(), 'allowlisted authenticated user is an administrator');
select throws_ok(
  $$select public.cms_payload_is_publishable('news', '{}'::jsonb)$$,
  '42501',
  null,
  'administrators cannot directly execute the kind-aware validator'
);
select results_eq(
  $$select count(*)::integer from public.cms_documents
    where id in (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    )$$,
  array[2],
  'administrators can read unpublished documents'
);
select results_eq(
  $$select count(*)::integer from public.cms_revisions
    where document_id in (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    )$$,
  array[3],
  'administrators can read every revision status'
);
select throws_ok(
  $$select * from public.cms_admins$$,
  '42501',
  null,
  'administrators use the predicate but cannot enumerate the allowlist'
);
select throws_ok(
  $$update public.cms_revisions
    set payload = '{"zh":{"title":"私密草稿"},"en":{"title":"Private draft"}}'
    where id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'$$,
  '42501',
  null,
  'administrators cannot edit draft payloads outside the save RPC'
);
select throws_ok(
  $$update public.cms_revisions
    set status = 'archived', archived_at = statement_timestamp(), archived_by = auth.uid()
    where id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'$$,
  '42501',
  null,
  'clients cannot bypass lifecycle RPCs with direct status updates'
);
select results_eq(
  $$select count(*)::integer from storage.objects where bucket_id = 'draft-media'$$,
  array[1],
  'administrators can read draft media metadata'
);
select lives_ok(
  $$insert into storage.objects (bucket_id, name) values ('draft-media', 'draft/admin-upload.jpg')$$,
  'administrators can write draft media'
);
reset role;

select throws_ok(
  $$update public.cms_revisions
    set payload = '{"zh":{"title":"竄改"},"en":{"title":"Tampered"}}'
    where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'$$,
  '55000',
  'published revisions may only transition to archived',
  'published rows reject direct payload mutation even for a database owner'
);

set local role authenticated;
select results_eq(
  $$select published.status::text || '|' || published.edit_version::text
    from public.cms_publish_revision(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'dddddddd-dddd-dddd-dddd-dddddddddddd',
      1
    ) as published$$,
  array['published|2'::text],
  'administrator can publish a valid bilingual draft with one token increment'
);
select results_eq(
  $$select count(*)::integer from public.cms_revisions
    where document_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and status = 'published'$$,
  array[1],
  'publication leaves exactly one published revision'
);
select results_eq(
  $$select status::text from public.cms_revisions where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'$$,
  array['archived'::text],
  'publication archives the prior published revision in the same transaction'
);
select results_eq(
  $$select published_by::text from public.cms_revisions where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'$$,
  array['11111111-1111-1111-1111-111111111111'::text],
  'publication audit actor comes from auth.uid()'
);
reset role;

set local role anon;
select results_eq(
  $$select version from public.cms_get_published_content('news', 'security-test')$$,
  array[2],
  'anonymous readers immediately see the newly published revision'
);
reset role;

insert into public.cms_revisions (
  id, document_id, version, status, payload
)
values (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  3,
  'draft',
  (select payload from cms_valid_payload_fixtures where kind = 'digital_materials')
);

set local role authenticated;
select throws_ok(
  $$select public.cms_publish_revision(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      1
    )$$,
  '23514',
  'payload does not match CMS document kind news',
  'publication rejects a wrong-kind draft'
);
select results_eq(
  $$select count(*)::integer from public.cms_revisions
    where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
      and status = 'draft'
      and published_at is null
      and published_by is null
      and archived_at is null
      and archived_by is null$$,
  array[1],
  'failed publication leaves the rejected draft lifecycle audit fields untouched'
);
select results_eq(
  $$select version from public.cms_revisions
    where document_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and status = 'published'$$,
  array[2],
  'failed publication preserves the existing published revision'
);
do $$
begin
  perform public.cms_archive_revision(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    1
  );
end;
$$;
select results_eq(
  $$select (public.cms_clone_revision('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')).version$$,
  array[4],
  'clone allocates the next document-scoped version atomically'
);
select results_eq(
  $$select count(*)::integer from public.cms_revisions
    where document_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      and version = 4
      and status = 'draft'
      and payload = (
        select published.payload
        from public.cms_revisions as published
        where published.document_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
          and published.status = 'published'
      )$$,
  array[1],
  'default clone copies the current published payload into a draft'
);
select results_eq(
  $$select archived.status::text || '|' || archived.edit_version::text
    from public.cms_archive_revision(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      (select id from public.cms_revisions
       where document_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and version = 4),
      1
    ) as archived$$,
  array['archived|2'::text],
  'archive RPC transitions a draft and increments its token once'
);
select results_eq(
  $$select archived_by::text from public.cms_revisions
    where document_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and version = 4$$,
  array['11111111-1111-1111-1111-111111111111'::text],
  'archive audit actor comes from auth.uid()'
);
reset role;

select throws_ok(
  $$insert into public.cms_revisions (
      document_id, version, status, payload, published_at, published_by
    ) values (
      '99999999-9999-9999-9999-999999999999',
      1,
      'published',
      (select payload from cms_valid_payload_fixtures where kind = 'digital_materials'),
      statement_timestamp(),
      '11111111-1111-1111-1111-111111111111'
    )$$,
  '23514',
  'payload does not match CMS document kind news',
  'trigger rejects a direct wrong-kind published insert'
);

select throws_ok(
  $$insert into public.cms_revisions (
      document_id, version, status, payload, published_at, published_by
    ) values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      5,
      'published',
      (select payload from cms_valid_payload_fixtures where kind = 'news'),
      statement_timestamp(),
      '11111111-1111-1111-1111-111111111111'
    )$$,
  '23505',
  null,
  'partial unique index independently prevents a second publication'
);

select * from finish();
rollback;
