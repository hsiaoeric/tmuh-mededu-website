begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
set local request.jwt.claims = '{}';

select plan(25);

insert into auth.users (id, email)
values
  ('55555555-5555-5555-5555-555555555555', 'storage-admin@example.test'),
  ('66666666-6666-6666-6666-666666666666', 'storage-reader@example.test');

insert into public.cms_admins (user_id, created_by)
values (
  '55555555-5555-5555-5555-555555555555',
  '55555555-5555-5555-5555-555555555555'
);

insert into storage.objects (bucket_id, name, metadata)
values (
  'public-media',
  'sha256/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.jpg',
  '{"mimetype":"image/jpeg","size":1024}'
);

select results_eq(
  $$select id || '|' || public::text
    from storage.buckets
    where id in ('draft-media', 'public-media')
    order by id$$,
  array['draft-media|false'::text, 'public-media|true'::text],
  'CMS storage baseline has one private draft bucket and one public bucket'
);

select results_eq(
  $$select id || '|' || file_size_limit::text
    from storage.buckets
    where id in ('draft-media', 'public-media')
    order by id$$,
  array[
    'draft-media|10485760'::text,
    'public-media|10485760'::text
  ],
  'both CMS buckets configure file_size_limit to 10 MiB'
);

select results_eq(
  $$select id || '|' || array_to_string(allowed_mime_types, ',')
    from storage.buckets
    where id in ('draft-media', 'public-media')
    order by id$$,
  array[
    'draft-media|image/jpeg,image/png,image/webp'::text,
    'public-media|image/jpeg,image/png,image/webp'::text
  ],
  'both CMS buckets configure the exact JPEG, PNG, and WebP MIME allowlist'
);

set local role anon;
select results_eq(
  $$select count(*)::integer from storage.objects where bucket_id = 'public-media'$$,
  array[1],
  'anonymous users can read public media metadata'
);
select results_eq(
  $$select count(*)::integer from storage.objects where bucket_id = 'draft-media'$$,
  array[0],
  'anonymous users cannot disclose draft media metadata'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, metadata)
    values ('draft-media', 'anonymous.jpg', '{"mimetype":"image/jpeg","size":1}')$$,
  '42501',
  null,
  'RLS denies anonymous draft object insertion'
);
select results_eq(
  $$delete from storage.objects
    where bucket_id = 'public-media'
    returning name$$,
  array[]::text[],
  'anonymous users cannot delete public media'
);
reset role;

set local request.jwt.claims = '{"sub":"66666666-6666-6666-6666-666666666666","role":"authenticated"}';
set local role authenticated;
select throws_ok(
  $$insert into storage.objects (bucket_id, name, metadata)
    values (
      'draft-media',
      '66666666-6666-6666-6666-666666666666/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.jpg',
      '{"mimetype":"image/jpeg","size":1}'
    )$$,
  '42501',
  null,
  'RLS denies non-admin draft object insertion'
);
select results_eq(
  $$select count(*)::integer from storage.objects where bucket_id = 'draft-media'$$,
  array[0],
  'non-admin authenticated users cannot disclose draft media metadata'
);
reset role;

set local request.jwt.claims = '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';
set local role authenticated;
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id, metadata)
    values (
      'draft-media',
      '55555555-5555-5555-5555-555555555555/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.jpg',
      '55555555-5555-5555-5555-555555555555',
      '{"mimetype":"image/jpeg","size":10485760}'
    )$$,
  'RLS accepts allowlisted-admin JPEG metadata at the configured size boundary'
);
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id, metadata)
    values (
      'draft-media',
      '55555555-5555-5555-5555-555555555555/cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc.png',
      '55555555-5555-5555-5555-555555555555',
      '{"mimetype":"image/png","size":1024}'
    )$$,
  'RLS accepts allowlisted-admin PNG metadata'
);
select lives_ok(
  $$insert into storage.objects (bucket_id, name, owner_id, metadata)
    values (
      'draft-media',
      '55555555-5555-5555-5555-555555555555/dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd.webp',
      '55555555-5555-5555-5555-555555555555',
      '{"mimetype":"image/webp","size":1024}'
    )$$,
  'RLS accepts allowlisted-admin WebP metadata'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, metadata)
    values ('draft-media', '55555555-5555-5555-5555-555555555555/eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.svg', '{"mimetype":"image/svg+xml","size":1}')$$,
  '42501', null, 'RLS rejects declared SVG metadata'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, metadata)
    values ('draft-media', '55555555-5555-5555-5555-555555555555/eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.html', '{"mimetype":"text/html","size":1}')$$,
  '42501', null, 'RLS rejects declared HTML metadata'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, metadata)
    values ('draft-media', '55555555-5555-5555-5555-555555555555/eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.jpg', '{"mimetype":"image/gif","size":1}')$$,
  '42501', null, 'RLS rejects unsupported declared image MIME metadata'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, metadata)
    values ('draft-media', '55555555-5555-5555-5555-555555555555/eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.jpg', '{"mimetype":"image/png","size":1}')$$,
  '42501', null, 'RLS cross-checks filename extension with client-declared MIME metadata'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, metadata)
    values ('draft-media', '66666666-6666-6666-6666-666666666666/eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.jpg', '{"mimetype":"image/jpeg","size":1}')$$,
  '42501', null, 'admins cannot write outside their authenticated draft namespace'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, metadata)
    values ('draft-media', '55555555-5555-5555-5555-555555555555/../eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.jpg', '{"mimetype":"image/jpeg","size":1}')$$,
  '42501', null, 'path traversal names are denied'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, metadata)
    values ('draft-media', '55555555-5555-5555-5555-555555555555//eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.jpg', '{"mimetype":"image/jpeg","size":1}')$$,
  '42501', null, 'empty path segments are denied'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, metadata)
    values ('draft-media', '55555555-5555-5555-5555-555555555555/not-content-addressed.jpg', '{"mimetype":"image/jpeg","size":1}')$$,
  '42501', null, 'malformed draft names are denied'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, metadata)
    values ('public-media', 'sha256/eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.jpg', '{"mimetype":"image/jpeg","size":1}')$$,
  '42501', null, 'RLS denies authenticated public object insertion'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name, metadata)
    values ('public-media', 'mutable-name.jpg', '{"mimetype":"image/jpeg","size":1}')$$,
  '42501', null, 'non-content-addressed public names are denied'
);
select results_eq(
  $$update storage.objects
    set metadata = '{"mimetype":"image/jpeg","size":2}'
    where bucket_id = 'public-media'
    returning name$$,
  array[]::text[],
  'authenticated browser roles cannot overwrite public media'
);
select results_eq(
  $$delete from storage.objects
    where bucket_id = 'public-media'
    returning name$$,
  array[]::text[],
  'authenticated browser roles cannot delete public media'
);
select results_eq(
  $$with deleted as (
      delete from storage.objects
      where bucket_id = 'draft-media'
        and name like '55555555-5555-5555-5555-555555555555/%'
      returning name
    )
    select name from deleted order by name$$,
  array[
    '55555555-5555-5555-5555-555555555555/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.jpg'::text,
    '55555555-5555-5555-5555-555555555555/cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc.png'::text,
    '55555555-5555-5555-5555-555555555555/dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd.webp'::text
  ],
  'allowlisted admin can remove only owner-scoped draft objects'
);
reset role;

select * from finish();
rollback;
