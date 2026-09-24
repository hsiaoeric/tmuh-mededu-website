insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'public-media',
    'public-media',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  (
    'draft-media',
    'draft-media',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp']::text[]
  )
on conflict (id) do update
set name = excluded.name,
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists cms_draft_media_admin_read on storage.objects;
drop policy if exists cms_media_admin_insert on storage.objects;
drop policy if exists cms_media_admin_update on storage.objects;
drop policy if exists cms_media_admin_delete on storage.objects;

create policy cms_draft_media_admin_read
on storage.objects
for select
to authenticated
using (
  bucket_id = 'draft-media'
  and (select public.is_cms_admin())
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and name ~ (
    '^' || (select auth.uid())::text
    || '/[0-9a-f]{64}[.](jpg|jpeg|png|webp)$'
  )
  and (
    (name ~ '[.](jpg|jpeg)$' and metadata ->> 'mimetype' = 'image/jpeg')
    or (name ~ '[.]png$' and metadata ->> 'mimetype' = 'image/png')
    or (name ~ '[.]webp$' and metadata ->> 'mimetype' = 'image/webp')
  )
);

create policy cms_draft_media_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'draft-media'
  and (select public.is_cms_admin())
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and name ~ (
    '^' || (select auth.uid())::text
    || '/[0-9a-f]{64}[.](jpg|jpeg|png|webp)$'
  )
  and (
    (name ~ '[.](jpg|jpeg)$' and metadata ->> 'mimetype' = 'image/jpeg')
    or (name ~ '[.]png$' and metadata ->> 'mimetype' = 'image/png')
    or (name ~ '[.]webp$' and metadata ->> 'mimetype' = 'image/webp')
  )
);

create policy cms_draft_media_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'draft-media'
  and (select public.is_cms_admin())
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and name ~ (
    '^' || (select auth.uid())::text
    || '/[0-9a-f]{64}[.](jpg|jpeg|png|webp)$'
  )
  and (
    (name ~ '[.](jpg|jpeg)$' and metadata ->> 'mimetype' = 'image/jpeg')
    or (name ~ '[.]png$' and metadata ->> 'mimetype' = 'image/png')
    or (name ~ '[.]webp$' and metadata ->> 'mimetype' = 'image/webp')
  )
);
