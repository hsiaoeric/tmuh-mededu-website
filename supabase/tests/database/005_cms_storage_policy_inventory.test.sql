begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(8);

-- A fresh reset has no platform-owned storage.objects policies. Keep this exact
-- inventory so stale or manually-added policies cannot silently widen access.
select results_eq(
  $$select policyname::text || '|' || cmd || '|' || array_to_string(roles::text[], ',')
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
    order by policyname$$,
  array[
    'cms_draft_media_admin_delete|DELETE|authenticated'::text,
    'cms_draft_media_admin_insert|INSERT|authenticated'::text,
    'cms_draft_media_admin_read|SELECT|authenticated'::text,
    'cms_public_media_read|SELECT|anon,authenticated'::text
  ],
  'storage.objects has the exact fresh-reset policy inventory'
);

select results_eq(
  $$select cmd || '|' || policyname::text
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and cmd in ('INSERT', 'UPDATE', 'DELETE')
    order by cmd, policyname$$,
  array[
    'DELETE|cms_draft_media_admin_delete'::text,
    'INSERT|cms_draft_media_admin_insert'::text
  ],
  'browser write policies exist only for owner-scoped drafts'
);

select ok(
  (
    select roles = array['anon'::name, 'authenticated'::name]
      and cmd = 'SELECT'
      and qual = '(bucket_id = ''public-media''::text)'
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'cms_public_media_read'
  ),
  'public-media exposes only the exact anonymous and authenticated read policy'
);

select ok(
  (
    select count(*) = 3
      and bool_and(roles = array['authenticated'::name])
      and bool_and(coalesce(qual, with_check) like '%is_cms_admin%')
      and bool_and(coalesce(qual, with_check) like '%auth.uid%')
      and bool_and(coalesce(qual, with_check) like '%draft-media%')
      and bool_and(coalesce(qual, with_check) not like '%public-media%')
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname like 'cms_draft_media_%'
  ),
  'every draft policy requires authenticated admin and owner-scoped draft access'
);

select ok(
  (
    select qual like '%owner_id%auth.uid%'
      and qual like '%private.cms_draft_media_delete_allowed(owner_id, name)%'
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'cms_draft_media_admin_delete'
  ),
  'draft deletion requires Storage ownership and the authoritative persisted-reference guard'
);

select ok(
  has_function_privilege('authenticated', 'private.cms_draft_media_delete_allowed(text,text)', 'EXECUTE')
    and not has_function_privilege('public', 'private.cms_draft_media_delete_allowed(text,text)', 'EXECUTE')
    and not has_function_privilege('anon', 'private.cms_draft_media_delete_allowed(text,text)', 'EXECUTE'),
  'only authenticated callers and the owner may enter the private delete-policy helper'
);

select ok(
  has_table_privilege('anon', 'storage.objects', 'SELECT')
    and has_table_privilege('authenticated', 'storage.objects', 'SELECT')
    and has_table_privilege('authenticated', 'storage.objects', 'INSERT')
    and has_table_privilege('authenticated', 'storage.objects', 'UPDATE')
    and has_table_privilege('authenticated', 'storage.objects', 'DELETE'),
  'platform table grants permit operations while RLS policies remain authoritative'
);

select ok(
  (
    select relrowsecurity and not relforcerowsecurity
    from pg_class
    where oid = 'storage.objects'::regclass
  ),
  'storage.objects keeps platform RLS enabled without changing platform ownership semantics'
);

select * from finish();
rollback;
