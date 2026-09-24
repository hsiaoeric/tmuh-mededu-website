begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
set local request.jwt.claims = '{}';

select plan(12);

insert into auth.users (id, email)
values ('86000000-0000-4000-8000-000000000001', 'contract-parity-admin@example.test');
insert into public.cms_admins (user_id, created_by)
values (
  '86000000-0000-4000-8000-000000000001',
  '86000000-0000-4000-8000-000000000001'
);

create temporary table contract_parity_payloads on commit drop as
with source as (
  select revisions.payload
  from public.cms_documents as documents
  join public.cms_revisions as revisions on revisions.document_id = documents.id
  where documents.kind = 'people' and revisions.status = 'published'
  limit 1
), media as (
  select
    jsonb_build_object(
      'kind', 'public', 'bucket', 'public-media',
      'path', repeat('a', 64) || '/' || repeat('b', 64) || '.webp'
    ) as mismatched,
    jsonb_build_object(
      'kind', 'public', 'bucket', 'public-media',
      'path', repeat('a', 64) || '/' || repeat('a', 64) || '.webp'
    ) as matching
)
select
  jsonb_set(
    jsonb_set(source.payload, '{zh,centerPeople,0,people,0,portrait}', media.mismatched, true),
    '{en,centerPeople,0,people,0,portrait}', media.mismatched, true
  ) as mismatched,
  jsonb_set(
    jsonb_set(source.payload, '{zh,centerPeople,0,people,0,portrait}', media.matching, true),
    '{en,centerPeople,0,people,0,portrait}', media.matching, true
  ) as matching,
  media.mismatched as mismatched_reference,
  media.matching as matching_reference
from source cross join media;

grant select on table contract_parity_payloads to authenticated;

insert into public.cms_documents (id, kind, stable_key) values
  ('86000000-0000-4000-8000-000000000010', 'people', 'contract-parity-save'),
  ('86000000-0000-4000-8000-000000000020', 'people', 'contract-parity-invalid-publish'),
  ('86000000-0000-4000-8000-000000000030', 'people', 'contract-parity-valid-publish');
insert into public.cms_revisions (id, document_id, version, status, payload) values (
  '86000000-0000-4000-8000-000000000011',
  '86000000-0000-4000-8000-000000000010',
  1,
  'draft',
  (select matching from contract_parity_payloads)
);

select ok(
  to_regprocedure('public.cms_jsonb_is_credential_free_https_url(jsonb)') is not null
    and to_regprocedure('public.cms_jsonb_is_https_url(jsonb)') is not null
    and to_regprocedure('public.cms_jsonb_is_published_media_reference(jsonb)') is not null,
  'contract parity helper signatures exist'
);
select ok(
  (
    select count(*) = 3
      and bool_and(provolatile = 'i' and proisstrict and not prosecdef)
      and bool_and(coalesce(proconfig, '{}'::text[]) @> array['search_path=""'])
      and bool_and(pg_get_userbyid(proowner) = 'postgres')
    from pg_proc
    where oid = any(array[
      to_regprocedure('public.cms_jsonb_is_credential_free_https_url(jsonb)'),
      to_regprocedure('public.cms_jsonb_is_https_url(jsonb)'),
      to_regprocedure('public.cms_jsonb_is_published_media_reference(jsonb)')
    ]::oid[])
  ),
  'contract parity helpers are immutable strict invokers owned by postgres with empty search paths'
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
      to_regprocedure('public.cms_jsonb_is_https_url(jsonb)'),
      to_regprocedure('public.cms_jsonb_is_published_media_reference(jsonb)')
    ]::oid[])
  ),
  'API roles cannot execute contract parity helpers'
);
select results_eq(
  $$
    select name
    from (values
      ('uppercase_ascii_host', 'https://TMUH.EXAMPLE/path', true),
      ('kelvin_sign_host', 'https://K.example/path', false),
      ('dotted_i_host', 'https://İ.example/path', false),
      ('tab', E'https://example.test/a\tb', false),
      ('vertical_tab', U&'https://example.test/a\000Bb', false),
      ('form_feed', U&'https://example.test/a\000Cb', false),
      ('nbsp', U&'https://example.test/a\00A0b', false),
      ('figure_space', U&'https://example.test/a\2007b', false),
      ('line_separator', U&'https://example.test/a\2028b', false),
      ('paragraph_separator', U&'https://example.test/a\2029b', false),
      ('narrow_nbsp', U&'https://example.test/a\202Fb', false),
      ('bom', U&'https://example.test/a\FEFFb', false)
    ) as corpus(name, value, expected)
    where public.cms_jsonb_is_credential_free_https_url(to_jsonb(value)) is distinct from expected
      or public.cms_jsonb_is_https_url(to_jsonb(value)) is distinct from expected
    order by name
  $$,
  array[]::text[],
  'SQL HTTPS helpers match the ECMAScript ASCII DNS and whitespace subset'
);
select ok(
  public.cms_jsonb_is_published_media_reference(
    (select mismatched_reference from contract_parity_payloads)
  ) is not true,
  'published media helper rejects a filename digest mismatch'
);
select ok(
  public.cms_jsonb_is_published_media_reference(
    (select matching_reference from contract_parity_payloads)
  ),
  'published media helper accepts an exact digest match'
);
select ok(
  public.cms_payload_is_publishable('people', (select mismatched from contract_parity_payloads)) is not true,
  'publication dispatcher rejects a filename digest mismatch'
);
select ok(
  public.cms_payload_is_publishable('people', (select matching from contract_parity_payloads)),
  'publication dispatcher accepts an exact digest match'
);

set local request.jwt.claims = '{"sub":"86000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;
select throws_ok(
  $$select public.cms_save_draft(
    '86000000-0000-4000-8000-000000000010',
    '86000000-0000-4000-8000-000000000011',
    1,
    (select mismatched from contract_parity_payloads)
  )$$,
  '23514',
  'payload violates the CMS document contract',
  'published save rejects a filename digest mismatch'
);
select lives_ok(
  $$select public.cms_save_draft(
    '86000000-0000-4000-8000-000000000010',
    '86000000-0000-4000-8000-000000000011',
    1,
    (select matching from contract_parity_payloads)
  )$$,
  'published save accepts an exact digest match'
);
reset role;

select throws_ok(
  $$insert into public.cms_revisions (
    id, document_id, version, status, payload, published_at, published_by
  ) values (
    '86000000-0000-4000-8000-000000000021',
    '86000000-0000-4000-8000-000000000020',
    1, 'published',
    (select mismatched from contract_parity_payloads),
    statement_timestamp(),
    '86000000-0000-4000-8000-000000000001'
  )$$,
  '23514',
  'payload does not match CMS document kind people',
  'direct publication rejects a filename digest mismatch'
);
select lives_ok(
  $$insert into public.cms_revisions (
    id, document_id, version, status, payload, published_at, published_by
  ) values (
    '86000000-0000-4000-8000-000000000031',
    '86000000-0000-4000-8000-000000000030',
    1, 'published',
    (select matching from contract_parity_payloads),
    statement_timestamp(),
    '86000000-0000-4000-8000-000000000001'
  )$$,
  'direct publication accepts an exact digest match'
);

select * from finish();
rollback;
