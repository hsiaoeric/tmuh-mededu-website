create type public.cms_document_kind as enum (
  'site_copy',
  'centers',
  'people',
  'news',
  'activities',
  'kpis',
  'honors',
  'digital_materials',
  'facdev',
  'ebm',
  'holistic',
  'holistic_research'
);

create type public.cms_revision_status as enum (
  'draft',
  'published',
  'archived'
);

create table public.cms_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default statement_timestamp(),
  created_by uuid references auth.users (id) on delete set null
);

create table public.cms_documents (
  id uuid primary key default gen_random_uuid(),
  kind public.cms_document_kind not null,
  stable_key text not null,
  created_at timestamptz not null default statement_timestamp(),
  created_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default statement_timestamp(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint cms_documents_kind_stable_key_key unique (kind, stable_key),
  constraint cms_documents_stable_key_check check (
    stable_key = btrim(stable_key)
    and char_length(stable_key) between 1 and 160
    and stable_key ~ '^[a-z0-9]+([._/-][a-z0-9]+)*$'
  )
);

create table public.cms_revisions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.cms_documents (id) on delete restrict,
  version integer not null,
  status public.cms_revision_status not null default 'draft',
  payload jsonb not null,
  created_at timestamptz not null default statement_timestamp(),
  created_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default statement_timestamp(),
  updated_by uuid references auth.users (id) on delete set null,
  published_at timestamptz,
  published_by uuid references auth.users (id) on delete set null,
  archived_at timestamptz,
  archived_by uuid references auth.users (id) on delete set null,
  constraint cms_revisions_document_version_key unique (document_id, version),
  constraint cms_revisions_version_check check (version > 0),
  constraint cms_revisions_payload_object_check check (jsonb_typeof(payload) = 'object'),
  constraint cms_revisions_lifecycle_check check (
    (status = 'draft' and published_at is null and published_by is null and archived_at is null and archived_by is null)
    or (status = 'published' and published_at is not null and archived_at is null and archived_by is null)
    or (status = 'archived' and archived_at is not null)
  )
);

create unique index cms_revisions_one_published_per_document_idx
  on public.cms_revisions (document_id)
  where status = 'published';

create index cms_revisions_document_status_idx
  on public.cms_revisions (document_id, status);

create function public.is_cms_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.cms_admins
    where user_id = (select auth.uid())
  );
$$;

comment on function public.is_cms_admin() is
  'Security-definer predicate keeps the administrator allowlist unreadable to API roles.';

create function public.cms_payload_is_publishable(candidate jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(candidate) = 'object'
    and jsonb_typeof(candidate -> 'zh') = 'object'
    and jsonb_typeof(candidate -> 'en') = 'object'
    and candidate -> 'zh' <> '{}'::jsonb
    and candidate -> 'en' <> '{}'::jsonb;
$$;

alter table public.cms_revisions
add constraint cms_revisions_published_payload_check
check (status <> 'published' or public.cms_payload_is_publishable(payload));

create function public.cms_set_document_audit_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := statement_timestamp();
    new.created_by := auth.uid();
  else
    if new.id <> old.id or new.created_at <> old.created_at or new.created_by is distinct from old.created_by then
      raise exception 'document identity and creation audit fields are immutable' using errcode = '55000';
    end if;
  end if;

  new.updated_at := statement_timestamp();
  new.updated_by := auth.uid();
  return new;
end;
$$;

create trigger cms_documents_set_audit_fields
before insert or update on public.cms_documents
for each row execute function public.cms_set_document_audit_fields();

create function public.cms_enforce_revision_lifecycle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := statement_timestamp();
    new.created_by := auth.uid();
    new.updated_at := statement_timestamp();
    new.updated_by := auth.uid();
    return new;
  end if;

  if new.id <> old.id
    or new.document_id <> old.document_id
    or new.version <> old.version
    or new.created_at <> old.created_at
    or new.created_by is distinct from old.created_by then
    raise exception 'revision identity, version, and creation audit fields are immutable' using errcode = '55000';
  end if;

  if old.status = 'archived' then
    raise exception 'archived revisions are immutable' using errcode = '55000';
  end if;

  if old.status = 'published' then
    if new.status <> 'archived' then
      raise exception 'published revisions may only transition to archived' using errcode = '55000';
    end if;
    if new.payload <> old.payload
      or new.published_at is distinct from old.published_at
      or new.published_by is distinct from old.published_by then
      raise exception 'published revision content and publication audit fields are immutable' using errcode = '55000';
    end if;
  elsif old.status = 'draft' and new.status not in ('draft', 'published', 'archived') then
    raise exception 'invalid draft revision transition' using errcode = '55000';
  end if;

  new.updated_at := statement_timestamp();
  new.updated_by := auth.uid();
  return new;
end;
$$;

create trigger cms_revisions_enforce_lifecycle
before insert or update on public.cms_revisions
for each row execute function public.cms_enforce_revision_lifecycle();

create function public.cms_clone_revision(
  p_document_id uuid,
  p_source_revision_id uuid default null
)
returns public.cms_revisions
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_revision public.cms_revisions%rowtype;
  cloned_revision public.cms_revisions%rowtype;
  next_version integer;
  cloned_payload jsonb := jsonb_build_object('zh', jsonb_build_object(), 'en', jsonb_build_object());
begin
  if not public.is_cms_admin() then
    raise exception 'CMS administrator access required' using errcode = '42501';
  end if;

  perform 1 from public.cms_documents where id = p_document_id for update;
  if not found then
    raise exception 'CMS document not found' using errcode = 'P0002';
  end if;

  if p_source_revision_id is not null then
    select * into source_revision
    from public.cms_revisions
    where id = p_source_revision_id and document_id = p_document_id;
    if not found then
      raise exception 'source revision does not belong to document' using errcode = '22023';
    end if;
    cloned_payload := source_revision.payload;
  else
    select * into source_revision
    from public.cms_revisions
    where document_id = p_document_id and status = 'published';
    if found then
      cloned_payload := source_revision.payload;
    end if;
  end if;

  select coalesce(max(version), 0) + 1 into next_version
  from public.cms_revisions
  where document_id = p_document_id;

  insert into public.cms_revisions (document_id, version, status, payload)
  values (p_document_id, next_version, 'draft', cloned_payload)
  returning * into cloned_revision;

  return cloned_revision;
end;
$$;

create function public.cms_publish_revision(
  p_document_id uuid,
  p_revision_id uuid
)
returns public.cms_revisions
language plpgsql
security definer
set search_path = ''
as $$
declare
  chosen_revision public.cms_revisions%rowtype;
  published_revision public.cms_revisions%rowtype;
  actor_id uuid := auth.uid();
begin
  if not public.is_cms_admin() then
    raise exception 'CMS administrator access required' using errcode = '42501';
  end if;

  perform 1 from public.cms_documents where id = p_document_id for update;
  if not found then
    raise exception 'CMS document not found' using errcode = 'P0002';
  end if;

  select * into chosen_revision
  from public.cms_revisions
  where id = p_revision_id and document_id = p_document_id
  for update;

  if not found or chosen_revision.status <> 'draft' then
    raise exception 'chosen revision must be a draft belonging to the document' using errcode = '22023';
  end if;

  if not public.cms_payload_is_publishable(chosen_revision.payload) then
    raise exception 'published payload requires non-empty zh and en objects' using errcode = '23514';
  end if;

  update public.cms_revisions
  set status = 'archived', archived_at = statement_timestamp(), archived_by = actor_id
  where document_id = p_document_id and status = 'published';

  update public.cms_revisions
  set status = 'published', published_at = statement_timestamp(), published_by = actor_id
  where id = p_revision_id
  returning * into published_revision;

  return published_revision;
end;
$$;

create function public.cms_archive_revision(p_revision_id uuid)
returns public.cms_revisions
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_revision public.cms_revisions%rowtype;
  archived_revision public.cms_revisions%rowtype;
begin
  if not public.is_cms_admin() then
    raise exception 'CMS administrator access required' using errcode = '42501';
  end if;

  select * into target_revision
  from public.cms_revisions
  where id = p_revision_id;

  if not found then
    raise exception 'CMS revision not found' using errcode = 'P0002';
  end if;
  if target_revision.status = 'archived' then
    raise exception 'revision is already archived' using errcode = '22023';
  end if;

  perform 1 from public.cms_documents where id = target_revision.document_id for update;

  select * into target_revision
  from public.cms_revisions
  where id = p_revision_id
  for update;

  if target_revision.status = 'archived' then
    raise exception 'revision is already archived' using errcode = '22023';
  end if;

  update public.cms_revisions
  set status = 'archived', archived_at = statement_timestamp(), archived_by = auth.uid()
  where id = p_revision_id
  returning * into archived_revision;

  return archived_revision;
end;
$$;

comment on function public.cms_clone_revision(uuid, uuid) is
  'Security-definer RPC serializes revision numbering and records the authenticated actor.';
comment on function public.cms_publish_revision(uuid, uuid) is
  'Security-definer RPC atomically archives the prior publication and publishes one validated draft.';
comment on function public.cms_archive_revision(uuid) is
  'Security-definer RPC is the only API path for lifecycle status changes.';
