begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
set local request.jwt.claims = '{}';

select plan(24);

create temporary table draft_media_outcomes (
  name text primary key,
  returned text,
  sqlstate text,
  detail text
) on commit drop;

create function pg_temp.capture_draft_media_outcome(p_name text, p_statement text)
returns void language plpgsql as $$
declare captured text; state text; error_detail text;
begin
  begin
    execute p_statement into captured;
  exception when others then
    get stacked diagnostics state = returned_sqlstate, error_detail = pg_exception_detail;
  end;
  insert into pg_temp.draft_media_outcomes values (p_name, captured, state, error_detail)
  on conflict (name) do update
  set returned = excluded.returned, sqlstate = excluded.sqlstate, detail = excluded.detail;
end;
$$;

insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'draft-guard-admin@example.test'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'draft-guard-reader@example.test');
insert into public.cms_admins (user_id, created_by) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

insert into public.cms_documents (id, kind, stable_key) values
  ('81000000-0000-4000-8000-000000000001', 'people', 'draft-guard-one'),
  ('81000000-0000-4000-8000-000000000002', 'people', 'draft-guard-two'),
  ('81000000-0000-4000-8000-000000000003', 'people', 'draft-guard-save');

create temporary table draft_guard_payload on commit drop as
select revisions.payload
from public.cms_documents as documents
join public.cms_revisions as revisions on revisions.document_id = documents.id
where documents.kind = 'people'
  and revisions.status = 'published'
limit 1;

grant select on table draft_guard_payload to authenticated;

insert into public.cms_revisions (id, document_id, version, status, payload) values
  (
    '81000000-0000-4000-8000-000000000011',
    '81000000-0000-4000-8000-000000000001',
    1,
    'draft',
    jsonb_set(
      (select payload from draft_guard_payload),
      '{zh,centerPeople,0,people,0,portrait}',
      jsonb_build_object(
        'kind', 'draft', 'bucket', 'draft-media',
        'path', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/' || repeat('1', 64) || '.png'
      )
    )
  ),
  (
    '81000000-0000-4000-8000-000000000012',
    '81000000-0000-4000-8000-000000000002',
    1,
    'draft',
    jsonb_set(
      jsonb_set(
        (select payload from draft_guard_payload),
        '{zh,centerPeople,0,people,0,portrait}',
        jsonb_build_object('kind', 'draft', 'bucket', 'draft-media', 'path', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/' || repeat('1', 64) || '.png')
      ),
      '{zh,centerPeople,0,people,1,portrait}',
      jsonb_build_object('kind', 'draft', 'bucket', 'draft-media', 'path', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/' || repeat('1', 64) || '.png')
    )
  ),
  (
    '81000000-0000-4000-8000-000000000013',
    '81000000-0000-4000-8000-000000000003',
    1,
    'draft',
    (select payload from draft_guard_payload)
  );

insert into storage.objects (bucket_id, name, owner_id, metadata) values
  ('draft-media', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/' || repeat('1', 64) || '.png', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '{"mimetype":"image/png","size":1}'),
  ('draft-media', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/' || repeat('2', 64) || '.png', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '{"mimetype":"image/png","size":1}'),
  ('draft-media', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/' || repeat('3', 64) || '.webp', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '{"mimetype":"image/webp","size":1}');

select ok(to_regprocedure('private.cms_unique_draft_media_paths(jsonb)') is not null, 'private unique canonical path extractor exists');
select ok(to_regprocedure('private.cms_draft_media_delete_allowed(text,text)') is not null, 'private delete-policy helper exists');
select ok((select prosecdef and pg_get_userbyid(proowner) = 'postgres' and coalesce(proconfig, '{}') @> array['search_path=""'] from pg_proc where oid = to_regprocedure('private.cms_draft_media_delete_allowed(text,text)')), 'delete helper is a hardened postgres-owned definer');
select ok((select not prosecdef and pg_get_userbyid(proowner) = 'postgres' and coalesce(proconfig, '{}') @> array['search_path=""'] from pg_proc where oid = to_regprocedure('private.cms_unique_draft_media_paths(jsonb)')), 'path extraction stays invoker-safe with an empty search path');
select ok(not has_function_privilege('public', 'private.cms_unique_draft_media_paths(jsonb)', 'EXECUTE') and not has_function_privilege('authenticated', 'private.cms_unique_draft_media_paths(jsonb)', 'EXECUTE'), 'path extractor is not directly exposed to API roles');

select results_eq(
  $$select path from private.cms_unique_draft_media_paths(jsonb_build_object(
      'z', jsonb_build_object('kind','draft','bucket','draft-media','path','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/' || repeat('3',64) || '.webp'),
      'a', jsonb_build_array(
        jsonb_build_object('kind','draft','bucket','draft-media','path','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/' || repeat('2',64) || '.png'),
        jsonb_build_object('kind','draft','bucket','draft-media','path','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/' || repeat('2',64) || '.png')
      )
    ))$$,
  array[
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/' || repeat('2',64) || '.png',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/' || repeat('3',64) || '.webp'
  ],
  'extractor returns unique canonical paths in stable lexical order'
);

select ok((select position('hashtextextended(''draft-media/'' || p_path, 0)' in pg_get_functiondef(to_regprocedure('private.cms_draft_media_delete_allowed(text,text)'))) > 0), 'delete helper acquires the exact-path transaction lock');
select ok((select position('hashtextextended(''draft-media/'' || draft_path, 0)' in pg_get_functiondef(to_regprocedure('public.cms_save_draft(uuid,uuid,bigint,jsonb)'))) > 0), 'save acquires the same exact-path transaction lock');
select ok((select position('array_agg(paths.path order by paths.path)' in pg_get_functiondef(to_regprocedure('public.cms_save_draft(uuid,uuid,bigint,jsonb)'))) > 0), 'save derives stable sorted lock order');
select ok((select position('pg_advisory_xact_lock' in pg_get_functiondef(to_regprocedure('public.cms_save_draft(uuid,uuid,bigint,jsonb)'))) < position('draft media object is missing' in pg_get_functiondef(to_regprocedure('public.cms_save_draft(uuid,uuid,bigint,jsonb)')))), 'save locks every path before object existence failures are evaluated');
select ok((select pg_get_functiondef(to_regprocedure('public.cms_save_draft(uuid,uuid,bigint,jsonb)')) not like '%insert into storage.objects%' and pg_get_functiondef(to_regprocedure('public.cms_save_draft(uuid,uuid,bigint,jsonb)')) not like '%delete from storage.objects%'), 'save never mutates managed Storage rows');
select ok((select qual like '%is_cms_admin%' and qual like '%owner_id%' and qual like '%draft-media%' and qual like '%mimetype%' from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'cms_draft_media_admin_delete'), 'guarded delete preserves admin, ownership, bucket, canonical path, and MIME constraints');

set local request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}';
set local role authenticated;
select results_eq(
  $$delete from storage.objects where bucket_id = 'draft-media' and name = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/' || repeat('1',64) || '.png' returning name$$,
  array[]::text[],
  'active draft in another unvisited document blocks exact-path deletion'
);
reset role;

update public.cms_revisions set status = 'archived', archived_at = statement_timestamp(), archived_by = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' where id = '81000000-0000-4000-8000-000000000011';
set local role authenticated;
select results_eq(
  $$delete from storage.objects where bucket_id = 'draft-media' and name = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/' || repeat('1',64) || '.png' returning name$$,
  array[]::text[],
  'one remaining active draft reference still blocks deletion'
);
reset role;

update public.cms_revisions set status = 'archived', archived_at = statement_timestamp(), archived_by = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' where id = '81000000-0000-4000-8000-000000000012';
set local role authenticated;
select results_eq(
  $$delete from storage.objects where bucket_id = 'draft-media' and name = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/' || repeat('1',64) || '.png' returning name$$,
  array['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/' || repeat('1',64) || '.png'],
  'deletion succeeds only after every active reference is gone'
);

select pg_temp.capture_draft_media_outcome('missing_object', $$select public.cms_save_draft(
  '81000000-0000-4000-8000-000000000003', '81000000-0000-4000-8000-000000000013', 1,
  jsonb_set((select payload from draft_guard_payload),'{zh,centerPeople,0,people,0,portrait}',jsonb_build_object('kind','draft','bucket','draft-media','path','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/' || repeat('9',64) || '.png'))
)::text$$);
select is((select sqlstate from draft_media_outcomes where name = 'missing_object'), '23503', 'save rejects a missing referenced object');
select is((select detail from draft_media_outcomes where name = 'missing_object'), 'draft_media_missing', 'missing-object rejection has a stable detail code');

select pg_temp.capture_draft_media_outcome('cross_owner', $$select public.cms_save_draft(
  '81000000-0000-4000-8000-000000000003', '81000000-0000-4000-8000-000000000013', 1,
  jsonb_set((select payload from draft_guard_payload),'{zh,centerPeople,0,people,0,portrait}',jsonb_build_object('kind','draft','bucket','draft-media','path','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/' || repeat('2',64) || '.png'))
)::text$$);
select is((select sqlstate from draft_media_outcomes where name = 'cross_owner'), '42501', 'save rejects a cross-owner draft path');
select is((select detail from draft_media_outcomes where name = 'cross_owner'), 'draft_owner_mismatch', 'cross-owner rejection has a stable detail code');

select pg_temp.capture_draft_media_outcome('save_two_objects', $$select public.cms_save_draft(
  '81000000-0000-4000-8000-000000000003', '81000000-0000-4000-8000-000000000013', 1,
  jsonb_set(
    jsonb_set((select payload from draft_guard_payload),'{zh,centerPeople,0,people,0,portrait}',jsonb_build_object('kind','draft','bucket','draft-media','path','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/' || repeat('3',64) || '.webp')),
    '{zh,centerPeople,0,people,1,portrait}',jsonb_build_object('kind','draft','bucket','draft-media','path','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/' || repeat('2',64) || '.png')
  )
)::text$$);
select is((select sqlstate from draft_media_outcomes where name = 'save_two_objects'), null::text, 'save accepts multiple existing owner-scoped objects after sorted locking');
select is((select edit_version from public.cms_revisions where id = '81000000-0000-4000-8000-000000000013'), 2::bigint, 'serialized save preserves optimistic edit-token behavior');
reset role;

set local request.jwt.claims = '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}';
set local role authenticated;
select results_eq(
  $$delete from storage.objects where bucket_id = 'draft-media' and name = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/' || repeat('2',64) || '.png' returning name$$,
  array[]::text[],
  'non-admin RLS denial remains policy-filtered'
);
select throws_ok(
  $$select public.cms_save_draft('81000000-0000-4000-8000-000000000003','81000000-0000-4000-8000-000000000013',2,'{}'::jsonb)$$,
  '42501', null, 'non-admin draft save remains denied'
);
reset role;

set local role anon;
select throws_ok(
  $$select private.cms_draft_media_delete_allowed('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/' || repeat('2',64) || '.png')$$,
  '42501', null, 'anonymous callers cannot execute the private policy helper'
);
reset role;

select * from finish();
rollback;
