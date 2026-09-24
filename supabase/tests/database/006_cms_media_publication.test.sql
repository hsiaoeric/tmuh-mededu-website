begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
set local request.jwt.claims = '{}';

select plan(47);

create temporary table media_outcomes (
  name text primary key,
  returned jsonb,
  sqlstate text,
  detail text
) on commit drop;

create function pg_temp.capture_media_outcome(p_name text, p_statement text)
returns void language plpgsql as $$
declare captured jsonb; state text; error_detail text;
begin
  begin
    execute p_statement into captured;
  exception when others then
    get stacked diagnostics state = returned_sqlstate, error_detail = pg_exception_detail;
  end;
  insert into pg_temp.media_outcomes values (p_name, captured, state, error_detail)
  on conflict (name) do update set returned = excluded.returned, sqlstate = excluded.sqlstate, detail = excluded.detail;
end;
$$;

insert into auth.users (id, email) values
  ('77777777-7777-4777-8777-777777777777', 'media-admin@example.test'),
  ('88888888-8888-4888-8888-888888888888', 'media-reader@example.test'),
  ('99999999-9999-4999-8999-999999999999', 'media-other-admin@example.test');
insert into public.cms_admins (user_id, created_by) values
  ('77777777-7777-4777-8777-777777777777', '77777777-7777-4777-8777-777777777777'),
  ('99999999-9999-4999-8999-999999999999', '77777777-7777-4777-8777-777777777777');

create temporary table media_payloads on commit drop as
with source as (
  select revisions.payload
  from public.cms_documents documents
  join public.cms_revisions revisions on revisions.document_id = documents.id
  where documents.kind = 'people' and revisions.status = 'published'
  limit 1
), constants as (
  select
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::text digest,
    '77777777-7777-4777-8777-777777777777/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png'::text draft_path
)
select source.payload original,
  jsonb_set(
    jsonb_set(source.payload, '{zh,centerPeople,0,people,0,portrait}', jsonb_build_object('kind','draft','bucket','draft-media','path',constants.draft_path), true),
    '{en,centerPeople,0,people,0,portrait}', jsonb_build_object('kind','draft','bucket','draft-media','path',constants.draft_path), true
  ) draft_payload,
  constants.draft_path,
  constants.digest || '/' || constants.digest || '.png' public_path
from source cross join constants;

grant select, insert, update on table media_outcomes to service_role;
grant select on table media_payloads to service_role;

create function pg_temp.fail_media_finalization()
returns trigger language plpgsql as $$
begin
  if current_setting('app.test_fail_media_finalize', true) = 'on'
    and new.id = '71000000-0000-4000-8000-000000000012'::uuid
    and new.status = 'published' then
    raise exception 'forced finalization failure' using errcode = 'P0001', detail = 'forced_finalization_failure';
  end if;
  return new;
end;
$$;
create trigger z_test_fail_media_finalization before update on public.cms_revisions
for each row execute function pg_temp.fail_media_finalization();

insert into public.cms_documents (id, kind, stable_key) values
  ('71000000-0000-4000-8000-000000000001', 'people', 'wave4-media');
insert into public.cms_revisions (id, document_id, version, status, payload, published_at, published_by) values
  ('71000000-0000-4000-8000-000000000011', '71000000-0000-4000-8000-000000000001', 1, 'published', (select original from media_payloads), statement_timestamp(), '77777777-7777-4777-8777-777777777777'),
  ('71000000-0000-4000-8000-000000000012', '71000000-0000-4000-8000-000000000001', 2, 'draft', (select draft_payload from media_payloads), null, null),
  ('71000000-0000-4000-8000-000000000013', '71000000-0000-4000-8000-000000000001', 3, 'draft', jsonb_set((select draft_payload from media_payloads), '{zh,centerPeople,0,people,0,portrait,kind}', '"public"'), null, null);

select ok((select count(*) = 2 from unnest(array[
  'public.cms_prepare_media_publication(uuid,uuid,bigint,uuid)',
  'public.cms_finalize_media_publication(uuid,uuid,bigint,uuid,jsonb)'
]) signature where to_regprocedure(signature) is not null), 'exact service RPC signatures exist');
select ok((select bool_and(prosecdef and pg_get_userbyid(proowner) = 'postgres' and coalesce(proconfig, '{}') @> array['search_path=""']) from pg_proc where oid = any(array[
  to_regprocedure('public.cms_prepare_media_publication(uuid,uuid,bigint,uuid)'),
  to_regprocedure('public.cms_finalize_media_publication(uuid,uuid,bigint,uuid,jsonb)')
]::oid[])), 'service RPCs are postgres-owned definers with empty search paths');
select ok((select bool_and(has_function_privilege('service_role', oid, 'execute') and not has_function_privilege('public', oid, 'execute') and not has_function_privilege('anon', oid, 'execute') and not has_function_privilege('authenticated', oid, 'execute')) from pg_proc where oid = any(array[
  to_regprocedure('public.cms_prepare_media_publication(uuid,uuid,bigint,uuid)'),
  to_regprocedure('public.cms_finalize_media_publication(uuid,uuid,bigint,uuid,jsonb)')
]::oid[])), 'only service_role and the owner execute media publication RPCs');
select ok(not has_function_privilege('authenticated', 'public.cms_publish_revision(uuid,uuid,bigint)', 'execute'), 'browser publication RPC execution is revoked');

select ok(public.cms_jsonb_is_draft_media_reference(jsonb_build_object('kind','draft','bucket','draft-media','path',(select draft_path from media_payloads))), 'strict draft predicate accepts the canonical contract');
select ok(public.cms_jsonb_is_draft_media_reference('{"kind":"draft","bucket":"draft-media","path":"77777777-7777-4777-8777-777777777777/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpeg"}'::jsonb) is not true, 'draft predicate rejects noncanonical jpeg extension');
select ok(public.cms_jsonb_is_public_media_replacement(jsonb_build_object('kind','public','bucket','public-media','path',(select public_path from media_payloads))), 'replacement predicate accepts repeated digest public paths');
select ok(public.cms_jsonb_is_public_media_replacement('{"kind":"public","bucket":"public-media","path":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/other.png"}'::jsonb) is not true, 'replacement predicate rejects a filename digest mismatch');
select results_eq($$select distinct path from public.cms_collect_draft_media_paths((select draft_payload from media_payloads)) path$$, array[(select draft_path from media_payloads)], 'collector supports set-wise deduplication of repeated draft references');
select is(public.cms_apply_media_replacements(
  (select draft_payload from media_payloads),
  jsonb_build_object((select draft_path from media_payloads), jsonb_build_object('kind','public','bucket','public-media','path',(select public_path from media_payloads)))
) #>> '{zh,centerPeople,0,people,0,portrait,path}', (select public_path from media_payloads), 'replacement recursively changes the exact matching draft');
select is(public.cms_apply_media_replacements('{"keep":{"kind":"local","path":"assets/a.jpg"}}', '{}'::jsonb), '{"keep":{"kind":"local","path":"assets/a.jpg"}}'::jsonb, 'replacement preserves local references exactly');
select ok(public.cms_payload_has_draft_media((select draft_payload from media_payloads)), 'residual-draft predicate finds nested drafts');
select ok(public.cms_jsonb_is_draft_media_like('{"kind":"draft","bucket":"wrong","path":"x"}'::jsonb), 'kind sentinel alone is draft-like');
select ok(public.cms_jsonb_is_draft_media_like('{"kind":"public","bucket":"draft-media","path":"x"}'::jsonb), 'bucket sentinel alone is draft-like');
select ok(public.cms_jsonb_is_draft_media_reference('{"kind":"public","bucket":"draft-media","path":"x"}'::jsonb) is not true, 'draft-like malformed object is not canonical');
select throws_ok(
  $$select * from public.cms_collect_draft_media_paths('{"image":{"kind":"public","bucket":"draft-media","path":"x"}}'::jsonb)$$,
  '22023', 'malformed draft-like media reference', 'collector rejects malformed draft-like objects with stable validation SQLSTATE'
);
select throws_ok(
  $$insert into public.cms_revisions (id,document_id,version,status,payload,publication_expected_edit_version,publication_replacements,publication_actor_id)
    values ('71000000-0000-4000-8000-000000000099','71000000-0000-4000-8000-000000000001',99,'draft',(select original from media_payloads),1,'{}','77777777-7777-4777-8777-777777777777')$$,
  '55000', 'publication retry metadata is workflow-managed', 'direct insert cannot seed retry metadata'
);
select throws_ok(
  $$update public.cms_revisions set publication_actor_id = '77777777-7777-4777-8777-777777777777' where id = '71000000-0000-4000-8000-000000000012'$$,
  '55000', 'publication retry metadata is workflow-managed', 'draft update cannot mutate retry metadata'
);

set local role service_role;
select pg_temp.capture_media_outcome('malformed_draft_like', $$select to_jsonb(public.cms_finalize_media_publication('71000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000013',1,'77777777-7777-4777-8777-777777777777',jsonb_build_object((select draft_path from media_payloads),jsonb_build_object('kind','public','bucket','public-media','path',(select public_path from media_payloads))))))$$);
select is((select detail from media_outcomes where name = 'malformed_draft_like'), 'invalid_draft_reference', 'finalizer rejects malformed draft-like payload with stable validation detail');
select pg_temp.capture_media_outcome('prepare_non_admin', $$select to_jsonb(public.cms_prepare_media_publication('71000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000012',1,'88888888-8888-4888-8888-888888888888'))$$);
select is((select sqlstate from media_outcomes where name = 'prepare_non_admin'), '42501', 'prepare validates the explicit actor allowlist');
select pg_temp.capture_media_outcome('prepare_success', $$select to_jsonb(public.cms_prepare_media_publication('71000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000012',1,'77777777-7777-4777-8777-777777777777'))$$);
select is((select sqlstate from media_outcomes where name = 'prepare_success'), null::text, 'prepare accepts the locked saved draft');
select is((select returned ->> 'kind' from media_outcomes where name = 'prepare_success'), 'people', 'prepare returns the authoritative document kind');
select is((select returned -> 'payload' from media_outcomes where name = 'prepare_success'), (select draft_payload from media_payloads), 'prepare returns only the saved payload');
select is((select edit_version from public.cms_revisions where id = '71000000-0000-4000-8000-000000000012'), 1::bigint, 'prepare does not mutate lifecycle or edit token');

select pg_temp.capture_media_outcome('missing_mapping', $$select to_jsonb(public.cms_finalize_media_publication('71000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000012',1,'77777777-7777-4777-8777-777777777777','{}'))$$);
select is((select detail from media_outcomes where name = 'missing_mapping'), 'replacement_set_mismatch', 'finalize rejects missing mappings');
select pg_temp.capture_media_outcome('extra_mapping', $$select to_jsonb(public.cms_finalize_media_publication('71000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000012',1,'77777777-7777-4777-8777-777777777777',jsonb_build_object((select draft_path from media_payloads),jsonb_build_object('kind','public','bucket','public-media','path',(select public_path from media_payloads)),'extra/path.png',jsonb_build_object('kind','public','bucket','public-media','path',(select public_path from media_payloads))))))$$);
select is((select detail from media_outcomes where name = 'extra_mapping'), 'replacement_set_mismatch', 'finalize rejects extra mappings');
select pg_temp.capture_media_outcome('malformed_mapping', $$select to_jsonb(public.cms_finalize_media_publication('71000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000012',1,'77777777-7777-4777-8777-777777777777',jsonb_build_object((select draft_path from media_payloads),jsonb_build_object('kind','public','bucket','wrong','path',(select public_path from media_payloads))))))$$);
select is((select detail from media_outcomes where name = 'malformed_mapping'), 'invalid_replacement', 'finalize rejects malformed replacement values');
select pg_temp.capture_media_outcome('cross_owner', $$select to_jsonb(public.cms_finalize_media_publication('71000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000012',1,'99999999-9999-4999-8999-999999999999',jsonb_build_object((select draft_path from media_payloads),jsonb_build_object('kind','public','bucket','public-media','path',(select public_path from media_payloads))))))$$);
select is((select sqlstate from media_outcomes where name = 'cross_owner'), '42501', 'finalize rejects an allowlisted actor for another owner namespace');
select is((select detail from media_outcomes where name = 'cross_owner'), 'draft_owner_mismatch', 'cross-owner rejection has a stable detail code');
select pg_temp.capture_media_outcome('stale_finalize', $$select to_jsonb(public.cms_finalize_media_publication('71000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000012',2,'77777777-7777-4777-8777-777777777777',jsonb_build_object((select draft_path from media_payloads),jsonb_build_object('kind','public','bucket','public-media','path',(select public_path from media_payloads))))))$$);
select is((select detail from media_outcomes where name = 'stale_finalize'), 'stale_edit_version', 'finalize enforces the expected CAS token');
select set_config('app.test_fail_media_finalize', 'on', true);
select pg_temp.capture_media_outcome('forced_finalize_failure', $$select to_jsonb(public.cms_finalize_media_publication('71000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000012',1,'77777777-7777-4777-8777-777777777777',jsonb_build_object((select draft_path from media_payloads),jsonb_build_object('kind','public','bucket','public-media','path',(select public_path from media_payloads))))))$$);
select is((select detail from media_outcomes where name = 'forced_finalize_failure'), 'forced_finalization_failure', 'forced failure reaches the final draft update after prior archive work');
select is((select status::text from public.cms_revisions where id = '71000000-0000-4000-8000-000000000011'), 'published', 'failed finalization rolls back the prior publication archive');
select is((select status::text from public.cms_revisions where id = '71000000-0000-4000-8000-000000000012'), 'draft', 'failed finalization leaves the chosen draft unchanged');
select set_config('app.test_fail_media_finalize', 'off', true);
drop trigger z_test_fail_media_finalization on public.cms_revisions;
select pg_temp.capture_media_outcome('finalize_success', $$select to_jsonb(public.cms_finalize_media_publication('71000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000012',1,'77777777-7777-4777-8777-777777777777',jsonb_build_object((select draft_path from media_payloads),jsonb_build_object('kind','public','bucket','public-media','path',(select public_path from media_payloads))))))$$);
select is((select sqlstate from media_outcomes where name = 'finalize_success'), null::text, 'finalize publishes through one CAS transaction');
select is((select status::text from public.cms_revisions where id = '71000000-0000-4000-8000-000000000012'), 'published', 'chosen revision is published');
select ok(not public.cms_payload_has_draft_media((select payload from public.cms_revisions where id = '71000000-0000-4000-8000-000000000012')), 'published payload has no draft references');
select is((select updated_by from public.cms_revisions where id = '71000000-0000-4000-8000-000000000012'), '77777777-7777-4777-8777-777777777777'::uuid, 'trigger audit preserves the explicit actor');
select is((select status::text from public.cms_revisions where id = '71000000-0000-4000-8000-000000000011'), 'archived', 'prior publication is archived atomically');
select is((select publication_actor_id from public.cms_revisions where id = '71000000-0000-4000-8000-000000000012'), '77777777-7777-4777-8777-777777777777'::uuid, 'publication persists exact actor identity');
select is((select publication_replacements from public.cms_revisions where id = '71000000-0000-4000-8000-000000000012'), jsonb_build_object((select draft_path from media_payloads),jsonb_build_object('kind','public','bucket','public-media','path',(select public_path from media_payloads))), 'publication persists exact replacement mapping');
select pg_temp.capture_media_outcome('response_loss_retry', $$select to_jsonb(public.cms_finalize_media_publication('71000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000012',1,'77777777-7777-4777-8777-777777777777',jsonb_build_object((select draft_path from media_payloads),jsonb_build_object('kind','public','bucket','public-media','path',(select public_path from media_payloads))))))$$);
select is((select returned ->> 'id' from media_outcomes where name = 'response_loss_retry'), '71000000-0000-4000-8000-000000000012', 'response-loss retry returns the same publication');
select pg_temp.capture_media_outcome('wrong_mapping_retry', $$select to_jsonb(public.cms_finalize_media_publication('71000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000012',1,'77777777-7777-4777-8777-777777777777',jsonb_build_object((select draft_path from media_payloads),jsonb_build_object('kind','public','bucket','public-media','path',repeat('b',64)||'/'||repeat('b',64)||'.png')))))$$);
select is((select detail from media_outcomes where name = 'wrong_mapping_retry'), 'stale_edit_version', 'published retry rejects a different exact mapping');
select pg_temp.capture_media_outcome('wrong_actor_retry', $$select to_jsonb(public.cms_finalize_media_publication('71000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000012',1,'99999999-9999-4999-8999-999999999999',jsonb_build_object((select draft_path from media_payloads),jsonb_build_object('kind','public','bucket','public-media','path',(select public_path from media_payloads))))))$$);
select is((select detail from media_outcomes where name = 'wrong_actor_retry'), 'stale_edit_version', 'published retry rejects a different actor identity');
select throws_ok(
  $$update public.cms_revisions set publication_replacements = '{}'::jsonb where id = '71000000-0000-4000-8000-000000000012'$$,
  '55000', 'publication retry metadata is immutable', 'privileged update cannot alter published retry metadata'
);
update public.cms_revisions set status = 'archived', archived_at = statement_timestamp(), archived_by = '77777777-7777-4777-8777-777777777777' where id = '71000000-0000-4000-8000-000000000012';
select is((select publication_actor_id from public.cms_revisions where id = '71000000-0000-4000-8000-000000000012'), '77777777-7777-4777-8777-777777777777'::uuid, 'archive transition preserves retry metadata');
select throws_ok(
  $$update public.cms_revisions set publication_actor_id = '99999999-9999-4999-8999-999999999999' where id = '71000000-0000-4000-8000-000000000012'$$,
  '55000', 'archived revisions are immutable', 'archived retry metadata cannot be altered'
);
select pg_temp.capture_media_outcome('superseded_retry', $$select to_jsonb(public.cms_finalize_media_publication('71000000-0000-4000-8000-000000000001','71000000-0000-4000-8000-000000000012',1,'77777777-7777-4777-8777-777777777777',jsonb_build_object((select draft_path from media_payloads),jsonb_build_object('kind','public','bucket','public-media','path',(select public_path from media_payloads))))))$$);
select is((select detail from media_outcomes where name = 'superseded_retry'), 'superseded_revision', 'retry never falsely accepts a superseded revision');
reset role;

select * from finish();
rollback;
