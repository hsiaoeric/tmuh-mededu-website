begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
set local request.jwt.claims = '{}';

select plan(58);

create temporary table cms_test_outcomes (
  name text primary key,
  returned_value text,
  sqlstate text,
  message text,
  detail text
) on commit drop;

create function pg_temp.capture_cms_outcome(p_name text, p_statement text)
returns void
language plpgsql
as $$
declare
  captured_value text;
  captured_state text;
  captured_message text;
  captured_detail text;
begin
  begin
    execute p_statement into captured_value;
  exception when others then
    get stacked diagnostics
      captured_state = returned_sqlstate,
      captured_message = message_text,
      captured_detail = pg_exception_detail;
  end;

  insert into pg_temp.cms_test_outcomes (
    name, returned_value, sqlstate, message, detail
  ) values (
    p_name, captured_value, captured_state, captured_message, captured_detail
  )
  on conflict (name) do update
  set returned_value = excluded.returned_value,
      sqlstate = excluded.sqlstate,
      message = excluded.message,
      detail = excluded.detail;
end;
$$;

create function pg_temp.cms_value(p_statement text)
returns text
language plpgsql
as $$
declare
  captured_value text;
  captured_state text;
begin
  begin
    execute p_statement into captured_value;
    return captured_value;
  exception when others then
    get stacked diagnostics captured_state = returned_sqlstate;
    return 'ERROR:' || captured_state;
  end;
end;
$$;

insert into auth.users (id, email)
values
  ('33333333-3333-3333-3333-333333333333', 'wave3-admin@example.test'),
  ('44444444-4444-4444-4444-444444444444', 'wave3-reader@example.test');

insert into public.cms_admins (user_id, created_by)
values (
  '33333333-3333-3333-3333-333333333333',
  '33333333-3333-3333-3333-333333333333'
);

create temporary table cms_wave3_payloads on commit drop as
select
  news.payload as original_news,
  jsonb_set(
    jsonb_set(news.payload, '{zh,latestUpdate}', '"Wave 3 saved"'::jsonb),
    '{en,latestUpdate}',
    '"Wave 3 saved"'::jsonb
  ) as saved_news,
  digital_materials.payload as wrong_kind
from (
  select revisions.payload
  from public.cms_documents as documents
  join public.cms_revisions as revisions on revisions.document_id = documents.id
  where documents.kind = 'news'
    and revisions.status = 'published'
  order by documents.stable_key
  limit 1
) as news
cross join (
  select revisions.payload
  from public.cms_documents as documents
  join public.cms_revisions as revisions on revisions.document_id = documents.id
  where documents.kind = 'digital_materials'
    and revisions.status = 'published'
  order by documents.stable_key
  limit 1
) as digital_materials;

insert into public.cms_documents (id, kind, stable_key)
values
  ('31000000-0000-0000-0000-000000000001', 'news', 'wave3-save-publish'),
  ('32000000-0000-0000-0000-000000000002', 'news', 'wave3-wrong-kind'),
  ('33000000-0000-0000-0000-000000000003', 'news', 'wave3-archive'),
  ('34000000-0000-0000-0000-000000000004', 'news', 'wave3-source-check');

insert into public.cms_revisions (
  id, document_id, version, status, payload, published_at, published_by
)
values
  (
    '31000000-0000-0000-0000-000000000011',
    '31000000-0000-0000-0000-000000000001',
    1,
    'published',
    (select original_news from cms_wave3_payloads),
    statement_timestamp(),
    '33333333-3333-3333-3333-333333333333'
  ),
  (
    '32000000-0000-0000-0000-000000000021',
    '32000000-0000-0000-0000-000000000002',
    1,
    'published',
    (select original_news from cms_wave3_payloads),
    statement_timestamp(),
    '33333333-3333-3333-3333-333333333333'
  ),
  (
    '32000000-0000-0000-0000-000000000022',
    '32000000-0000-0000-0000-000000000002',
    2,
    'draft',
    (select wrong_kind from cms_wave3_payloads),
    null,
    null
  ),
  (
    '33000000-0000-0000-0000-000000000031',
    '33000000-0000-0000-0000-000000000003',
    1,
    'draft',
    (select original_news from cms_wave3_payloads),
    null,
    null
  );

select has_column(
  'public',
  'cms_revisions',
  'edit_version',
  'revisions expose an optimistic-concurrency edit token'
);
select is(
  (
    select format_type(attribute.atttypid, attribute.atttypmod)
    from pg_attribute as attribute
    where attribute.attrelid = 'public.cms_revisions'::regclass
      and attribute.attname = 'edit_version'
      and not attribute.attisdropped
  ),
  'bigint',
  'edit_version uses bigint tokens'
);
select ok(
  coalesce((
    select attribute.attnotnull
    from pg_attribute as attribute
    where attribute.attrelid = 'public.cms_revisions'::regclass
      and attribute.attname = 'edit_version'
      and not attribute.attisdropped
  ), false),
  'edit_version is required'
);
select ok(
  coalesce((
    select pg_get_expr(default_value.adbin, default_value.adrelid) in ('1', '1::bigint')
    from pg_attribute as attribute
    join pg_attrdef as default_value
      on default_value.adrelid = attribute.attrelid
     and default_value.adnum = attribute.attnum
    where attribute.attrelid = 'public.cms_revisions'::regclass
      and attribute.attname = 'edit_version'
  ), false),
  'edit_version defaults to one'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.cms_revisions'::regclass
      and conname = 'cms_revisions_edit_version_check'
      and contype = 'c'
      and position('edit_version > 0' in pg_get_constraintdef(oid)) > 0
  ),
  'edit_version has a positive-value check'
);
select ok(
  exists (
    select 1
    from pg_index as index_definition
    join pg_class as index_relation on index_relation.oid = index_definition.indexrelid
    join pg_attribute as indexed_attribute
      on indexed_attribute.attrelid = index_definition.indrelid
     and indexed_attribute.attnum = index_definition.indkey[0]
    where index_definition.indrelid = 'public.cms_revisions'::regclass
      and index_relation.relname = 'cms_revisions_one_draft_per_document_idx'
      and index_definition.indisunique
      and index_definition.indnkeyatts = 1
      and indexed_attribute.attname = 'document_id'
      and position('status = ''draft''' in pg_get_expr(
        index_definition.indpred,
        index_definition.indrelid
      )) > 0
  ),
  'a partial unique index permits only one draft per document'
);

select ok(
  (
    select count(*) = 4 and bool_and(to_regprocedure(signature) is not null)
    from unnest(array[
      'public.cms_clone_revision(uuid,uuid)',
      'public.cms_save_draft(uuid,uuid,bigint,jsonb)',
      'public.cms_publish_revision(uuid,uuid,bigint)',
      'public.cms_archive_revision(uuid,uuid,bigint)'
    ]) as expected(signature)
  ),
  'the exact Wave 3 RPC signatures exist'
);
select is(
  (
    select pronargdefaults::integer
    from pg_proc
    where oid = to_regprocedure('public.cms_clone_revision(uuid,uuid)')
  ),
  1,
  'clone keeps its source revision default'
);
select ok(
  to_regprocedure('public.cms_publish_revision(uuid,uuid)') is null,
  'the non-CAS publish signature is removed'
);
select ok(
  to_regprocedure('public.cms_archive_revision(uuid)') is null,
  'the non-CAS archive signature is removed'
);
select ok(
  (
    select count(*) = 4 and bool_and(pg_get_userbyid(proowner) = 'postgres')
    from pg_proc
    where oid = any(array[
      to_regprocedure('public.cms_clone_revision(uuid,uuid)'),
      to_regprocedure('public.cms_save_draft(uuid,uuid,bigint,jsonb)'),
      to_regprocedure('public.cms_publish_revision(uuid,uuid,bigint)'),
      to_regprocedure('public.cms_archive_revision(uuid,uuid,bigint)')
    ]::oid[])
  ),
  'Wave 3 RPCs have the trusted postgres owner'
);
select ok(
  (
    select count(*) = 4 and bool_and(prosecdef)
    from pg_proc
    where oid = any(array[
      to_regprocedure('public.cms_clone_revision(uuid,uuid)'),
      to_regprocedure('public.cms_save_draft(uuid,uuid,bigint,jsonb)'),
      to_regprocedure('public.cms_publish_revision(uuid,uuid,bigint)'),
      to_regprocedure('public.cms_archive_revision(uuid,uuid,bigint)')
    ]::oid[])
  ),
  'Wave 3 RPCs are SECURITY DEFINER boundaries'
);
select ok(
  (
    select count(*) = 4
      and bool_and(coalesce(proconfig, '{}'::text[]) @> array['search_path=""'])
    from pg_proc
    where oid = any(array[
      to_regprocedure('public.cms_clone_revision(uuid,uuid)'),
      to_regprocedure('public.cms_save_draft(uuid,uuid,bigint,jsonb)'),
      to_regprocedure('public.cms_publish_revision(uuid,uuid,bigint)'),
      to_regprocedure('public.cms_archive_revision(uuid,uuid,bigint)')
    ]::oid[])
  ),
  'Wave 3 RPCs fix an empty search path'
);
select ok(
  (
    select count(*) = 4 and bool_and(
      has_function_privilege('postgres', oid, 'EXECUTE')
        and has_function_privilege('authenticated', oid, 'EXECUTE')
        and not has_function_privilege('public', oid, 'EXECUTE')
        and not has_function_privilege('anon', oid, 'EXECUTE')
        and not exists (
          select 1
          from aclexplode(coalesce(proacl, acldefault('f', proowner))) as privilege
          where privilege.privilege_type = 'EXECUTE'
            and privilege.grantee not in (
              proowner,
              (select oid from pg_roles where rolname = 'authenticated')
            )
        )
    )
    from pg_proc
    where oid = any(array[
      to_regprocedure('public.cms_clone_revision(uuid,uuid)'),
      to_regprocedure('public.cms_save_draft(uuid,uuid,bigint,jsonb)'),
      to_regprocedure('public.cms_publish_revision(uuid,uuid,bigint)'),
      to_regprocedure('public.cms_archive_revision(uuid,uuid,bigint)')
    ]::oid[])
  ),
  'only the owner and authenticated role can execute Wave 3 RPCs'
);

set local role anon;
select throws_ok(
  $sql$select public.cms_clone_revision('31000000-0000-0000-0000-000000000001', null)$sql$,
  '42501',
  null,
  'anonymous users cannot clone drafts'
);
select throws_ok(
  $sql$select public.cms_save_draft(
      '31000000-0000-0000-0000-000000000001',
      '31000000-0000-0000-0000-000000000012',
      1,
      '{}'::jsonb
    )$sql$,
  '42501',
  null,
  'anonymous users cannot save drafts'
);
select throws_ok(
  $sql$select public.cms_publish_revision(
      '31000000-0000-0000-0000-000000000001',
      '31000000-0000-0000-0000-000000000012',
      1
    )$sql$,
  '42501',
  null,
  'anonymous users cannot publish drafts'
);
select throws_ok(
  $sql$select public.cms_archive_revision(
      '33000000-0000-0000-0000-000000000003',
      '33000000-0000-0000-0000-000000000031',
      1
    )$sql$,
  '42501',
  null,
  'anonymous users cannot archive revisions'
);
reset role;

set local request.jwt.claims = '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}';
set local role authenticated;
select throws_ok(
  $sql$select public.cms_clone_revision('31000000-0000-0000-0000-000000000001', null)$sql$,
  '42501',
  null,
  'non-admin users cannot clone drafts'
);
select throws_ok(
  $sql$select public.cms_save_draft(
      '31000000-0000-0000-0000-000000000001',
      '31000000-0000-0000-0000-000000000012',
      1,
      '{}'::jsonb
    )$sql$,
  '42501',
  null,
  'non-admin users cannot save drafts'
);
select throws_ok(
  $sql$select public.cms_publish_revision(
      '31000000-0000-0000-0000-000000000001',
      '31000000-0000-0000-0000-000000000012',
      1
    )$sql$,
  '42501',
  null,
  'non-admin users cannot publish drafts'
);
select throws_ok(
  $sql$select public.cms_archive_revision(
      '33000000-0000-0000-0000-000000000003',
      '33000000-0000-0000-0000-000000000031',
      1
    )$sql$,
  '42501',
  null,
  'non-admin users cannot archive revisions'
);
reset role;

set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
set local role authenticated;

select pg_temp.capture_cms_outcome(
  'clone_success',
  $sql$select public.cms_clone_revision('31000000-0000-0000-0000-000000000001', null)$sql$
);
select is((select sqlstate from cms_test_outcomes where name = 'clone_success'), null::text, 'an administrator can clone the published revision');
select is(
  pg_temp.cms_value($sql$
    select concat_ws('|', version, status, edit_version)
    from public.cms_revisions
    where document_id = '31000000-0000-0000-0000-000000000001'
      and status = 'draft'
  $sql$),
  '2|draft|1',
  'clone creates the next version with edit token one'
);
select is(
  pg_temp.cms_value($sql$
    select (payload = (select original_news from pg_temp.cms_wave3_payloads))::text
      || '|' || created_by::text
    from public.cms_revisions
    where document_id = '31000000-0000-0000-0000-000000000001'
      and status = 'draft'
  $sql$),
  'true|33333333-3333-3333-3333-333333333333',
  'default clone copies the publication and records the actor'
);

select pg_temp.capture_cms_outcome(
  'clone_conflict',
  $sql$select public.cms_clone_revision('31000000-0000-0000-0000-000000000001', null)$sql$
);
select is((select sqlstate from cms_test_outcomes where name = 'clone_conflict'), 'PT409', 'a second active draft is a conflict');
select is((select detail from cms_test_outcomes where name = 'clone_conflict'), 'active_draft_exists', 'clone conflict exposes a stable detail code');
select is(
  pg_temp.cms_value($sql$
    select count(*)::text
    from public.cms_revisions
    where document_id = '31000000-0000-0000-0000-000000000001'
      and status = 'draft'
  $sql$),
  '1',
  'clone conflict does not create another draft'
);
select pg_temp.capture_cms_outcome(
  'clone_missing',
  $sql$select public.cms_clone_revision('39000000-0000-0000-0000-000000000099', null)$sql$
);
select is((select sqlstate from cms_test_outcomes where name = 'clone_missing'), 'P0002', 'clone reports a missing document');
select pg_temp.capture_cms_outcome(
  'clone_wrong_source',
  $sql$select public.cms_clone_revision(
    '34000000-0000-0000-0000-000000000004',
    '32000000-0000-0000-0000-000000000022'
  )$sql$
);
select is((select sqlstate from cms_test_outcomes where name = 'clone_wrong_source'), '22023', 'clone rejects a source from another document');

select pg_temp.capture_cms_outcome(
  'save_success',
  $sql$select public.cms_save_draft(
    '31000000-0000-0000-0000-000000000001',
    (
      select id from public.cms_revisions
      where document_id = '31000000-0000-0000-0000-000000000001'
        and status = 'draft'
    ),
    1,
    (select saved_news from pg_temp.cms_wave3_payloads)
  )$sql$
);
select is((select sqlstate from cms_test_outcomes where name = 'save_success'), null::text, 'an administrator can save the active draft');
select is(
  pg_temp.cms_value($sql$
    select (payload = (select saved_news from pg_temp.cms_wave3_payloads))::text
    from public.cms_revisions
    where document_id = '31000000-0000-0000-0000-000000000001'
      and status = 'draft'
  $sql$),
  'true',
  'save replaces the draft payload'
);
select is(
  pg_temp.cms_value($sql$
    select edit_version::text || '|' || updated_by::text
    from public.cms_revisions
    where document_id = '31000000-0000-0000-0000-000000000001'
      and status = 'draft'
  $sql$),
  '2|33333333-3333-3333-3333-333333333333',
  'save increments the edit token and records the actor'
);

select pg_temp.capture_cms_outcome(
  'save_stale',
  $sql$select public.cms_save_draft(
    '31000000-0000-0000-0000-000000000001',
    (
      select id from public.cms_revisions
      where document_id = '31000000-0000-0000-0000-000000000001'
        and status = 'draft'
    ),
    1,
    '{"zh":{"stale":true},"en":{"stale":true}}'::jsonb
  )$sql$
);
select is((select sqlstate from cms_test_outcomes where name = 'save_stale'), 'PT409', 'a stale save is a conflict');
select is((select detail from cms_test_outcomes where name = 'save_stale'), 'stale_edit_version', 'stale save exposes a stable detail code');
select is(
  pg_temp.cms_value($sql$
    select edit_version::text || '|'
      || (payload = (select saved_news from pg_temp.cms_wave3_payloads))::text
    from public.cms_revisions
    where document_id = '31000000-0000-0000-0000-000000000001'
      and status = 'draft'
  $sql$),
  '2|true',
  'stale save leaves token and payload unchanged'
);
select pg_temp.capture_cms_outcome(
  'save_missing',
  $sql$select public.cms_save_draft(
    '39000000-0000-0000-0000-000000000099',
    '39000000-0000-0000-0000-000000000098',
    1,
    '{}'::jsonb
  )$sql$
);
select is((select sqlstate from cms_test_outcomes where name = 'save_missing'), 'P0002', 'save reports a missing document');
select pg_temp.capture_cms_outcome(
  'save_invalid_lifecycle',
  $sql$select public.cms_save_draft(
    '32000000-0000-0000-0000-000000000002',
    '32000000-0000-0000-0000-000000000021',
    1,
    (select original_news from pg_temp.cms_wave3_payloads)
  )$sql$
);
select is((select sqlstate from cms_test_outcomes where name = 'save_invalid_lifecycle'), '22023', 'save rejects a non-draft revision');

select pg_temp.capture_cms_outcome(
  'direct_update',
  $sql$update public.cms_revisions
    set payload = payload || '{"bypass":true}'::jsonb
    where document_id = '31000000-0000-0000-0000-000000000001'
      and status = 'draft'$sql$
);
select is((select sqlstate from cms_test_outcomes where name = 'direct_update'), '42501', 'authenticated clients cannot update draft payloads directly');
select is(
  pg_temp.cms_value($sql$
    select edit_version::text || '|'
      || (payload = (select saved_news from pg_temp.cms_wave3_payloads))::text
    from public.cms_revisions
    where document_id = '31000000-0000-0000-0000-000000000001'
      and status = 'draft'
  $sql$),
  '2|true',
  'denied direct update leaves token and payload unchanged'
);

select pg_temp.capture_cms_outcome(
  'publish_stale',
  $sql$select public.cms_publish_revision(
    '31000000-0000-0000-0000-000000000001',
    (
      select id from public.cms_revisions
      where document_id = '31000000-0000-0000-0000-000000000001'
        and status = 'draft'
    ),
    1
  )$sql$
);
select is((select sqlstate from cms_test_outcomes where name = 'publish_stale'), 'PT409', 'publish rejects a stale edit token');
select is((select detail from cms_test_outcomes where name = 'publish_stale'), 'stale_edit_version', 'publish conflict exposes a stable detail code');
select is(
  pg_temp.cms_value($sql$
    select count(*) filter (where status = 'published')::text || '|'
      || count(*) filter (where status = 'draft')::text || '|'
      || max(edit_version) filter (where status = 'draft')::text
    from public.cms_revisions
    where document_id = '31000000-0000-0000-0000-000000000001'
  $sql$),
  '1|1|2',
  'stale publish atomically preserves the publication and draft'
);

select pg_temp.capture_cms_outcome(
  'publish_success',
  $sql$select public.cms_publish_revision(
    '31000000-0000-0000-0000-000000000001',
    (
      select id from public.cms_revisions
      where document_id = '31000000-0000-0000-0000-000000000001'
        and status = 'draft'
    ),
    2
  )$sql$
);
select is((select sqlstate from cms_test_outcomes where name = 'publish_success'), null::text, 'an administrator can publish with the current edit token');
select is(
  pg_temp.cms_value($sql$
    select status::text || '|' || edit_version::text || '|'
      || published_by::text || '|'
      || (payload = (select saved_news from pg_temp.cms_wave3_payloads))::text
    from public.cms_revisions
    where document_id = '31000000-0000-0000-0000-000000000001'
      and version = 2
  $sql$),
  'published|3|33333333-3333-3333-3333-333333333333|true',
  'valid publish increments the token and records the publication actor'
);
select is(
  pg_temp.cms_value($sql$
    select count(*) filter (where status = 'published')::text || '|'
      || count(*) filter (
        where version = 1
          and status = 'archived'
          and archived_by = '33333333-3333-3333-3333-333333333333'
      )::text
    from public.cms_revisions
    where document_id = '31000000-0000-0000-0000-000000000001'
  $sql$),
  '1|1',
  'valid publish atomically archives the prior publication'
);

select pg_temp.capture_cms_outcome(
  'publish_wrong_kind',
  $sql$select public.cms_publish_revision(
    '32000000-0000-0000-0000-000000000002',
    '32000000-0000-0000-0000-000000000022',
    1
  )$sql$
);
select is((select sqlstate from cms_test_outcomes where name = 'publish_wrong_kind'), '23514', 'publish rejects a payload for the wrong document kind');
select is(
  pg_temp.cms_value($sql$
    select status::text || '|' || edit_version::text || '|'
      || (published_at is null)::text || '|'
      || (published_by is null)::text || '|'
      || (archived_at is null)::text || '|'
      || (archived_by is null)::text
    from public.cms_revisions
    where id = '32000000-0000-0000-0000-000000000022'
  $sql$),
  'draft|1|true|true|true|true',
  'wrong-kind publish rolls back every draft lifecycle field'
);
select is(
  pg_temp.cms_value($sql$
    select count(*)::text
    from public.cms_revisions
    where document_id = '32000000-0000-0000-0000-000000000002'
      and version = 1
      and status = 'published'
      and archived_at is null
      and archived_by is null
  $sql$),
  '1',
  'wrong-kind publish preserves the current publication'
);

select pg_temp.capture_cms_outcome(
  'archive_stale',
  $sql$select public.cms_archive_revision(
    '33000000-0000-0000-0000-000000000003',
    '33000000-0000-0000-0000-000000000031',
    0
  )$sql$
);
select is((select sqlstate from cms_test_outcomes where name = 'archive_stale'), 'PT409', 'archive rejects a stale edit token');
select is((select detail from cms_test_outcomes where name = 'archive_stale'), 'stale_edit_version', 'archive conflict exposes a stable detail code');
select is(
  pg_temp.cms_value($sql$
    select status::text || '|' || edit_version::text || '|'
      || (archived_at is null)::text || '|'
      || (archived_by is null)::text
    from public.cms_revisions
    where id = '33000000-0000-0000-0000-000000000031'
  $sql$),
  'draft|1|true|true',
  'stale archive leaves the draft lifecycle untouched'
);

select pg_temp.capture_cms_outcome(
  'archive_success',
  $sql$select public.cms_archive_revision(
    '33000000-0000-0000-0000-000000000003',
    '33000000-0000-0000-0000-000000000031',
    1
  )$sql$
);
select is((select sqlstate from cms_test_outcomes where name = 'archive_success'), null::text, 'an administrator can archive with the current edit token');
select is(
  pg_temp.cms_value($sql$
    select status::text || '|' || edit_version::text || '|'
      || archived_by::text || '|'
      || (archived_at is not null)::text
    from public.cms_revisions
    where id = '33000000-0000-0000-0000-000000000031'
  $sql$),
  'archived|2|33333333-3333-3333-3333-333333333333|true',
  'archive increments the token and records the actor'
);
select pg_temp.capture_cms_outcome(
  'archive_missing',
  $sql$select public.cms_archive_revision(
    '39000000-0000-0000-0000-000000000099',
    '39000000-0000-0000-0000-000000000098',
    1
  )$sql$
);
select is((select sqlstate from cms_test_outcomes where name = 'archive_missing'), 'P0002', 'archive reports a missing document');

reset role;
select pg_temp.capture_cms_outcome(
  'published_immutable',
  $sql$update public.cms_revisions
    set payload = payload || '{"tampered":true}'::jsonb
    where document_id = '31000000-0000-0000-0000-000000000001'
      and version = 2$sql$
);
select pg_temp.capture_cms_outcome(
  'archived_immutable',
  $sql$update public.cms_revisions
    set payload = payload || '{"tampered":true}'::jsonb
    where id = '33000000-0000-0000-0000-000000000031'$sql$
);
select is((select sqlstate from cms_test_outcomes where name = 'published_immutable'), '55000', 'published revisions remain immutable');
select is((select sqlstate from cms_test_outcomes where name = 'archived_immutable'), '55000', 'archived revisions remain immutable');
select is(
  pg_temp.cms_value($sql$
    select
      (select (payload = (select saved_news from pg_temp.cms_wave3_payloads))::text
       from public.cms_revisions
       where document_id = '31000000-0000-0000-0000-000000000001' and version = 2)
      || '|'
      ||
      (select (payload = (select original_news from pg_temp.cms_wave3_payloads))::text
       from public.cms_revisions
       where id = '33000000-0000-0000-0000-000000000031')
  $sql$),
  'true|true',
  'failed lifecycle mutations leave both payloads unchanged'
);

select * from finish();
rollback;
