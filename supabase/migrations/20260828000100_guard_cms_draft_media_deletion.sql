begin;

create schema if not exists private;
alter schema private owner to postgres;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create function private.cms_unique_draft_media_paths(candidate jsonb)
returns table(path text)
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select distinct collected.path
  from public.cms_collect_draft_media_paths(candidate) as collected(path)
  order by collected.path;
$$;

create function private.cms_draft_media_delete_allowed(
  p_owner_id text,
  p_path text
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is null
    or p_owner_id is distinct from actor_id::text
    or p_path !~ (
      '^' || actor_id::text
      || '/[0-9a-f]{64}[.](jpg|jpeg|png|webp)$'
    ) then
    return false;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('draft-media/' || p_path, 0)
  );

  return not exists (
    select 1
    from public.cms_revisions as revisions
    cross join lateral private.cms_unique_draft_media_paths(revisions.payload) as referenced
    where revisions.status = 'draft'
      and referenced.path = p_path
  );
end;
$$;

alter function private.cms_unique_draft_media_paths(jsonb) owner to postgres;
alter function private.cms_draft_media_delete_allowed(text, text) owner to postgres;
revoke all on function private.cms_unique_draft_media_paths(jsonb)
from public, anon, authenticated;
revoke all on function private.cms_draft_media_delete_allowed(text, text)
from public, anon, authenticated;
grant execute on function private.cms_draft_media_delete_allowed(text, text)
to authenticated;

drop policy if exists cms_draft_media_admin_delete on storage.objects;

create policy cms_draft_media_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'draft-media'
  and (select public.is_cms_admin())
  and owner_id = (select auth.uid())::text
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
  and private.cms_draft_media_delete_allowed(owner_id, name)
);

create or replace function public.cms_save_draft(
  p_document_id uuid,
  p_revision_id uuid,
  p_expected_edit_version bigint,
  p_payload jsonb
)
returns public.cms_revisions
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target_revision public.cms_revisions%rowtype;
  saved_revision public.cms_revisions%rowtype;
  draft_paths text[];
  draft_path text;
begin
  if actor_id is null or not exists (
    select 1
    from public.cms_admins as administrators
    where administrators.user_id = actor_id
  ) then
    raise exception 'CMS administrator access required' using errcode = '42501';
  end if;

  perform 1
  from public.cms_documents as documents
  where documents.id = p_document_id
  for update;

  if not found then
    raise exception 'CMS document not found' using errcode = 'P0002';
  end if;

  select revisions.* into target_revision
  from public.cms_revisions as revisions
  where revisions.id = p_revision_id
  for update;

  if not found then
    raise exception 'CMS revision not found' using errcode = 'P0002';
  end if;

  if target_revision.document_id <> p_document_id
    or target_revision.status <> 'draft' then
    raise exception 'chosen revision must be a draft belonging to the document'
      using errcode = '22023';
  end if;

  if target_revision.edit_version <> p_expected_edit_version then
    raise exception 'draft edit token is stale'
      using errcode = 'PT409', detail = 'stale_edit_version';
  end if;

  select coalesce(array_agg(paths.path order by paths.path), '{}'::text[])
  into draft_paths
  from private.cms_unique_draft_media_paths(p_payload) as paths;

  foreach draft_path in array draft_paths loop
    if split_part(draft_path, '/', 1) <> actor_id::text then
      raise exception 'draft owner mismatch'
        using errcode = '42501', detail = 'draft_owner_mismatch';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('draft-media/' || draft_path, 0)
    );
  end loop;

  foreach draft_path in array draft_paths loop
    if not exists (
      select 1
      from storage.objects as objects
      where objects.bucket_id = 'draft-media'
        and objects.name = draft_path
        and objects.owner_id = actor_id::text
    ) then
      raise exception 'draft media object is missing'
        using errcode = '23503', detail = 'draft_media_missing';
    end if;
  end loop;

  update public.cms_revisions as revisions
  set payload = p_payload
  where revisions.id = p_revision_id
    and revisions.document_id = p_document_id
    and revisions.status = 'draft'
    and revisions.edit_version = p_expected_edit_version
  returning revisions.* into saved_revision;

  if not found then
    raise exception 'draft edit token is stale'
      using errcode = 'PT409', detail = 'stale_edit_version';
  end if;

  return saved_revision;
end;
$$;

alter function public.cms_save_draft(uuid, uuid, bigint, jsonb) owner to postgres;
revoke all on function public.cms_save_draft(uuid, uuid, bigint, jsonb)
from public, anon, authenticated;
grant execute on function public.cms_save_draft(uuid, uuid, bigint, jsonb)
to authenticated;

comment on function public.cms_save_draft(uuid, uuid, bigint, jsonb) is
  'Saves one optimistic draft after serialized owner-scoped draft-media existence checks.';

notify pgrst, 'reload schema';

commit;
