begin;

lock table public.cms_revisions in access exclusive mode;

do $$
begin
  if exists (
    select 1
    from public.cms_revisions
    where status = 'draft'
    group by document_id
    having count(*) > 1
  ) then
    raise exception 'multiple active drafts exist for a CMS document'
      using errcode = '23505';
  end if;
end;
$$;

alter table public.cms_revisions
add column edit_version bigint not null default 1;

alter table public.cms_revisions
add constraint cms_revisions_edit_version_check
check (edit_version > 0);

create unique index cms_revisions_one_draft_per_document_idx
on public.cms_revisions (document_id)
where status = 'draft';

drop policy cms_revisions_admin_update_draft on public.cms_revisions;
revoke update on table public.cms_revisions from authenticated;
revoke update (payload) on table public.cms_revisions from authenticated;

create or replace function public.cms_enforce_revision_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  document_kind public.cms_document_kind;
begin
  if tg_op = 'INSERT' then
    new.edit_version := 1;
    new.created_at := statement_timestamp();
    new.created_by := auth.uid();
    new.updated_at := statement_timestamp();
    new.updated_by := auth.uid();

    if new.status = 'published' then
      select documents.kind into document_kind
      from public.cms_documents as documents
      where documents.id = new.document_id;

      if public.cms_payload_is_publishable(document_kind, new.payload) is not true then
        raise exception 'payload does not match CMS document kind %', document_kind
          using errcode = '23514';
      end if;
    end if;

    return new;
  end if;

  if new.id <> old.id
    or new.document_id <> old.document_id
    or new.version <> old.version
    or new.created_at <> old.created_at
    or new.created_by is distinct from old.created_by then
    raise exception 'revision identity, version, and creation audit fields are immutable'
      using errcode = '55000';
  end if;

  if new.edit_version is distinct from old.edit_version then
    raise exception 'revision edit token is managed by CMS workflow RPCs'
      using errcode = '55000';
  end if;

  if old.status = 'archived' then
    raise exception 'archived revisions are immutable' using errcode = '55000';
  end if;

  if old.status = 'published' then
    if new.status <> 'archived' then
      raise exception 'published revisions may only transition to archived'
        using errcode = '55000';
    end if;
    if new.payload <> old.payload
      or new.published_at is distinct from old.published_at
      or new.published_by is distinct from old.published_by then
      raise exception 'published revision content and publication audit fields are immutable'
        using errcode = '55000';
    end if;
  elsif old.status = 'draft' and new.status not in ('draft', 'published', 'archived') then
    raise exception 'invalid draft revision transition' using errcode = '55000';
  end if;

  if old.status = 'draft' and new.status = 'published' then
    select documents.kind into document_kind
    from public.cms_documents as documents
    where documents.id = new.document_id;

    if public.cms_payload_is_publishable(document_kind, new.payload) is not true then
      raise exception 'payload does not match CMS document kind %', document_kind
        using errcode = '23514';
    end if;
  end if;

  new.edit_version := old.edit_version + 1;
  new.updated_at := statement_timestamp();
  new.updated_by := auth.uid();
  return new;
end;
$$;

alter function public.cms_enforce_revision_lifecycle() owner to postgres;
revoke all on function public.cms_enforce_revision_lifecycle()
from public, anon, authenticated;

drop function public.cms_publish_revision(uuid, uuid);
drop function public.cms_archive_revision(uuid);

create or replace function public.cms_clone_revision(
  p_document_id uuid,
  p_source_revision_id uuid default null
)
returns public.cms_revisions
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  source_revision public.cms_revisions%rowtype;
  cloned_revision public.cms_revisions%rowtype;
  next_version integer;
  cloned_payload jsonb := jsonb_build_object(
    'zh', jsonb_build_object(),
    'en', jsonb_build_object()
  );
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

  perform revisions.id
  from public.cms_revisions as revisions
  where revisions.document_id = p_document_id
  order by revisions.id
  for update;

  if exists (
    select 1
    from public.cms_revisions as revisions
    where revisions.document_id = p_document_id
      and revisions.status = 'draft'
  ) then
    raise exception 'CMS document already has an active draft'
      using errcode = 'PT409', detail = 'active_draft_exists';
  end if;

  if p_source_revision_id is not null then
    select revisions.* into source_revision
    from public.cms_revisions as revisions
    where revisions.id = p_source_revision_id
      and revisions.document_id = p_document_id;

    if not found then
      raise exception 'source revision does not belong to document'
        using errcode = '22023';
    end if;

    cloned_payload := source_revision.payload;
  else
    select revisions.* into source_revision
    from public.cms_revisions as revisions
    where revisions.document_id = p_document_id
      and revisions.status = 'published';

    if found then
      cloned_payload := source_revision.payload;
    end if;
  end if;

  select coalesce(max(revisions.version), 0) + 1 into next_version
  from public.cms_revisions as revisions
  where revisions.document_id = p_document_id;

  insert into public.cms_revisions (document_id, version, status, payload)
  values (p_document_id, next_version, 'draft', cloned_payload)
  returning * into cloned_revision;

  return cloned_revision;
end;
$$;

create function public.cms_save_draft(
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

create function public.cms_publish_revision(
  p_document_id uuid,
  p_revision_id uuid,
  p_expected_edit_version bigint
)
returns public.cms_revisions
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  document_kind public.cms_document_kind;
  chosen_revision public.cms_revisions%rowtype;
  published_revision public.cms_revisions%rowtype;
begin
  if actor_id is null or not exists (
    select 1
    from public.cms_admins as administrators
    where administrators.user_id = actor_id
  ) then
    raise exception 'CMS administrator access required' using errcode = '42501';
  end if;

  select documents.kind into document_kind
  from public.cms_documents as documents
  where documents.id = p_document_id
  for update;

  if not found then
    raise exception 'CMS document not found' using errcode = 'P0002';
  end if;

  select revisions.* into chosen_revision
  from public.cms_revisions as revisions
  where revisions.id = p_revision_id
  for update;

  if not found then
    raise exception 'CMS revision not found' using errcode = 'P0002';
  end if;

  if chosen_revision.document_id <> p_document_id
    or chosen_revision.status <> 'draft' then
    raise exception 'chosen revision must be a draft belonging to the document'
      using errcode = '22023';
  end if;

  if chosen_revision.edit_version <> p_expected_edit_version then
    raise exception 'draft edit token is stale'
      using errcode = 'PT409', detail = 'stale_edit_version';
  end if;

  if public.cms_payload_is_publishable(document_kind, chosen_revision.payload) is not true then
    raise exception 'payload does not match CMS document kind %', document_kind
      using errcode = '23514';
  end if;

  update public.cms_revisions as revisions
  set status = 'archived',
      archived_at = statement_timestamp(),
      archived_by = actor_id
  where revisions.document_id = p_document_id
    and revisions.status = 'published';

  update public.cms_revisions as revisions
  set status = 'published',
      published_at = statement_timestamp(),
      published_by = actor_id
  where revisions.id = p_revision_id
    and revisions.document_id = p_document_id
    and revisions.status = 'draft'
    and revisions.edit_version = p_expected_edit_version
  returning revisions.* into published_revision;

  if not found then
    raise exception 'draft edit token is stale'
      using errcode = 'PT409', detail = 'stale_edit_version';
  end if;

  return published_revision;
end;
$$;

create function public.cms_archive_revision(
  p_document_id uuid,
  p_revision_id uuid,
  p_expected_edit_version bigint
)
returns public.cms_revisions
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target_revision public.cms_revisions%rowtype;
  archived_revision public.cms_revisions%rowtype;
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
    or target_revision.status = 'archived' then
    raise exception 'chosen revision must be active and belong to the document'
      using errcode = '22023';
  end if;

  if target_revision.edit_version <> p_expected_edit_version then
    raise exception 'revision edit token is stale'
      using errcode = 'PT409', detail = 'stale_edit_version';
  end if;

  update public.cms_revisions as revisions
  set status = 'archived',
      archived_at = statement_timestamp(),
      archived_by = actor_id
  where revisions.id = p_revision_id
    and revisions.document_id = p_document_id
    and revisions.status <> 'archived'
    and revisions.edit_version = p_expected_edit_version
  returning revisions.* into archived_revision;

  if not found then
    raise exception 'revision edit token is stale'
      using errcode = 'PT409', detail = 'stale_edit_version';
  end if;

  return archived_revision;
end;
$$;

alter function public.cms_clone_revision(uuid, uuid) owner to postgres;
alter function public.cms_save_draft(uuid, uuid, bigint, jsonb) owner to postgres;
alter function public.cms_publish_revision(uuid, uuid, bigint) owner to postgres;
alter function public.cms_archive_revision(uuid, uuid, bigint) owner to postgres;

revoke all on function public.cms_clone_revision(uuid, uuid)
from public, anon, authenticated;
revoke all on function public.cms_save_draft(uuid, uuid, bigint, jsonb)
from public, anon, authenticated;
revoke all on function public.cms_publish_revision(uuid, uuid, bigint)
from public, anon, authenticated;
revoke all on function public.cms_archive_revision(uuid, uuid, bigint)
from public, anon, authenticated;

grant execute on function public.cms_clone_revision(uuid, uuid) to authenticated;
grant execute on function public.cms_save_draft(uuid, uuid, bigint, jsonb) to authenticated;
grant execute on function public.cms_publish_revision(uuid, uuid, bigint) to authenticated;
grant execute on function public.cms_archive_revision(uuid, uuid, bigint) to authenticated;

comment on function public.cms_clone_revision(uuid, uuid) is
  'Creates one serialized active draft, optionally cloned from a revision in the same document.';
comment on function public.cms_save_draft(uuid, uuid, bigint, jsonb) is
  'Saves one draft with optimistic concurrency and a trigger-managed edit token.';
comment on function public.cms_publish_revision(uuid, uuid, bigint) is
  'Atomically validates and publishes a draft after an expected-token check.';
comment on function public.cms_archive_revision(uuid, uuid, bigint) is
  'Archives an active revision after an expected-token check.';

notify pgrst, 'reload schema';

commit;
