begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(9);

select ok(
  (
    select prosecdef
      and pg_get_userbyid(proowner) = 'postgres'
      and coalesce(proconfig, '{}'::text[]) @> array['search_path=""']
    from pg_proc
    where oid = 'public.cms_enforce_revision_lifecycle()'::regprocedure
  ),
  'revision lifecycle trigger uses a trusted definer and an empty search path'
);

select ok(
  has_function_privilege('postgres', 'public.cms_enforce_revision_lifecycle()', 'EXECUTE'),
  'trusted trigger owner can execute the lifecycle trigger function'
);

select ok(
  not has_function_privilege('public', 'public.cms_enforce_revision_lifecycle()', 'EXECUTE')
    and not has_function_privilege('anon', 'public.cms_enforce_revision_lifecycle()', 'EXECUTE')
    and not has_function_privilege('authenticated', 'public.cms_enforce_revision_lifecycle()', 'EXECUTE'),
  'API roles cannot execute the lifecycle trigger function directly'
);

select ok(
  (
    select bool_and(
      has_function_privilege('postgres', oid, 'EXECUTE')
        and not has_function_privilege('public', oid, 'EXECUTE')
        and not has_function_privilege('anon', oid, 'EXECUTE')
        and not has_function_privilege('authenticated', oid, 'EXECUTE')
    )
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and (
        proname like 'cms_jsonb_%'
        or proname like 'cms_%_payload_is_publishable'
        or proname = 'cms_payload_is_publishable'
      )
  ),
  'only the trusted owner can traverse the internal validator call graph'
);

select ok(
  exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.cms_revisions'::regclass
      and tgfoid = 'public.cms_enforce_revision_lifecycle()'::regprocedure
      and not tgisinternal
      and tgenabled = 'O'
  ),
  'hardened lifecycle function remains attached to cms_revisions'
);

select ok(
  position('cms_payload_is_publishable' in (
    select pg_get_constraintdef(oid)
    from pg_constraint
    where conrelid = 'public.cms_revisions'::regclass
      and conname = 'cms_revisions_published_payload_check'
  )) = 0,
  'published payload CHECK no longer invokes a revoked function'
);

select ok(
  position('jsonb_typeof(payload)' in (
    select pg_get_constraintdef(oid)
    from pg_constraint
    where conrelid = 'public.cms_revisions'::regclass
      and conname = 'cms_revisions_published_payload_check'
  )) > 0,
  'published payload CHECK retains inline bilingual envelope validation'
);

select ok(
  not has_schema_privilege('anon', 'public', 'CREATE')
    and not has_schema_privilege('authenticated', 'public', 'CREATE'),
  'API roles cannot create shadow objects in the public schema'
);

select ok(
  not pg_has_role('anon', 'postgres', 'MEMBER')
    and not pg_has_role('authenticated', 'postgres', 'MEMBER'),
  'API roles cannot inherit the trusted trigger owner'
);

select * from finish();
rollback;
