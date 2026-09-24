begin;

alter table public.cms_revisions
add column publication_expected_edit_version bigint,
add column publication_replacements jsonb,
add column publication_actor_id uuid;

alter table public.cms_revisions
add constraint cms_revisions_publication_retry_check check (
  (publication_expected_edit_version is null and publication_replacements is null and publication_actor_id is null)
  or (
    publication_expected_edit_version > 0
    and jsonb_typeof(publication_replacements) = 'object'
    and publication_actor_id is not null
  )
);

create function public.cms_jsonb_is_draft_media_like(candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select jsonb_typeof(candidate) = 'object'
    and (candidate ->> 'kind' = 'draft' or candidate ->> 'bucket' = 'draft-media');
$$;

create function public.cms_jsonb_is_draft_media_reference(candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select jsonb_typeof(candidate) = 'object'
    and (select array_agg(key order by key) from jsonb_object_keys(candidate) key)
      = array['bucket', 'kind', 'path']::text[]
    and candidate ->> 'kind' = 'draft'
    and candidate ->> 'bucket' = 'draft-media'
    and candidate ->> 'path' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{64}[.](jpg|png|webp)$';
$$;

create function public.cms_jsonb_is_public_media_replacement(candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select jsonb_typeof(candidate) = 'object'
    and (select array_agg(key order by key) from jsonb_object_keys(candidate) key)
      = array['bucket', 'kind', 'path']::text[]
    and candidate ->> 'kind' = 'public'
    and candidate ->> 'bucket' = 'public-media'
    and candidate ->> 'path' ~ '^[0-9a-f]{64}/[0-9a-f]{64}[.](jpg|png|webp)$'
    and split_part(candidate ->> 'path', '/', 1)
      = split_part(split_part(candidate ->> 'path', '/', 2), '.', 1);
$$;

create function public.cms_collect_draft_media_paths(candidate jsonb)
returns setof text language plpgsql immutable strict security invoker set search_path = '' as $$
declare child jsonb;
begin
  if public.cms_jsonb_is_draft_media_like(candidate) then
    if public.cms_jsonb_is_draft_media_reference(candidate) then
      return next candidate ->> 'path';
      return;
    end if;
    raise exception 'malformed draft-like media reference' using errcode = '22023', detail = 'invalid_draft_reference';
  elsif jsonb_typeof(candidate) = 'array' then
    for child in select value from jsonb_array_elements(candidate) loop
      return query select * from public.cms_collect_draft_media_paths(child);
    end loop;
  elsif jsonb_typeof(candidate) = 'object' then
    for child in select value from jsonb_each(candidate) loop
      return query select * from public.cms_collect_draft_media_paths(child);
    end loop;
  end if;
end;
$$;

create function public.cms_payload_has_draft_media(candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select exists(select 1 from public.cms_collect_draft_media_paths(candidate));
$$;

create function public.cms_apply_media_replacements(candidate jsonb, replacements jsonb)
returns jsonb language plpgsql immutable strict security invoker set search_path = '' as $$
declare child record; result jsonb;
begin
  if public.cms_jsonb_is_draft_media_like(candidate) then
    if public.cms_jsonb_is_draft_media_reference(candidate) then
      return coalesce(replacements -> (candidate ->> 'path'), candidate);
    end if;
    raise exception 'malformed draft-like media reference' using errcode = '22023', detail = 'invalid_draft_reference';
  elsif jsonb_typeof(candidate) = 'array' then
    select coalesce(jsonb_agg(public.cms_apply_media_replacements(value, replacements) order by ordinality), '[]'::jsonb)
      into result from jsonb_array_elements(candidate) with ordinality;
    return result;
  elsif jsonb_typeof(candidate) = 'object' then
    result := '{}'::jsonb;
    for child in select key, value from jsonb_each(candidate) loop
      result := result || jsonb_build_object(child.key, public.cms_apply_media_replacements(child.value, replacements));
    end loop;
    return result;
  end if;
  return candidate;
end;
$$;

create or replace function public.cms_enforce_revision_lifecycle()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  document_kind public.cms_document_kind;
  actor_id uuid := coalesce(nullif(current_setting('app.cms_actor_id', true), '')::uuid, auth.uid());
begin
  if tg_op = 'INSERT' then
    if new.publication_expected_edit_version is not null or new.publication_replacements is not null
      or new.publication_actor_id is not null then
      raise exception 'publication retry metadata is workflow-managed' using errcode = '55000';
    end if;
    new.edit_version := 1;
    new.created_at := statement_timestamp(); new.created_by := actor_id;
    new.updated_at := statement_timestamp(); new.updated_by := actor_id;
    if new.status = 'published' then
      select kind into document_kind from public.cms_documents where id = new.document_id;
      if public.cms_payload_is_publishable(document_kind, new.payload) is not true then
        raise exception 'payload does not match CMS document kind %', document_kind using errcode = '23514';
      end if;
    end if;
    return new;
  end if;
  if new.id <> old.id or new.document_id <> old.document_id or new.version <> old.version
    or new.created_at <> old.created_at or new.created_by is distinct from old.created_by then
    raise exception 'revision identity, version, and creation audit fields are immutable' using errcode = '55000';
  end if;
  if new.edit_version is distinct from old.edit_version then
    raise exception 'revision edit token is managed by CMS workflow RPCs' using errcode = '55000';
  end if;
  if old.status = 'draft' and new.status = 'published'
    and current_setting('app.cms_publication_finalize', true) = 'on' then
    if old.publication_expected_edit_version is not null or old.publication_replacements is not null
      or old.publication_actor_id is not null or new.publication_expected_edit_version is null
      or new.publication_replacements is null or new.publication_actor_id is null then
      raise exception 'invalid publication retry metadata transition' using errcode = '55000';
    end if;
  elsif new.publication_expected_edit_version is distinct from old.publication_expected_edit_version
    or new.publication_replacements is distinct from old.publication_replacements
    or new.publication_actor_id is distinct from old.publication_actor_id then
    raise exception 'publication retry metadata is immutable' using errcode = '55000';
  end if;
  if old.status = 'archived' then raise exception 'archived revisions are immutable' using errcode = '55000'; end if;
  if old.status = 'published' then
    if new.status <> 'archived' then raise exception 'published revisions may only transition to archived' using errcode = '55000'; end if;
    if new.payload <> old.payload or new.published_at is distinct from old.published_at
      or new.published_by is distinct from old.published_by then
      raise exception 'published revision content and publication audit fields are immutable' using errcode = '55000';
    end if;
  elsif old.status = 'draft' and new.status not in ('draft', 'published', 'archived') then
    raise exception 'invalid draft revision transition' using errcode = '55000';
  end if;
  if old.status = 'draft' and new.status = 'published' then
    select kind into document_kind from public.cms_documents where id = new.document_id;
    if public.cms_payload_is_publishable(document_kind, new.payload) is not true then
      raise exception 'payload does not match CMS document kind %', document_kind using errcode = '23514';
    end if;
  end if;
  new.edit_version := old.edit_version + 1;
  new.updated_at := statement_timestamp(); new.updated_by := actor_id;
  return new;
end;
$$;

create function public.cms_prepare_media_publication(
  p_document_id uuid,
  p_revision_id uuid,
  p_expected_edit_version bigint,
  p_actor_id uuid
)
returns table(kind public.cms_document_kind, status public.cms_revision_status, payload jsonb, persisted_replacements jsonb)
language plpgsql security definer set search_path = '' as $$
declare target public.cms_revisions%rowtype;
begin
  if not exists(select 1 from public.cms_admins where user_id = p_actor_id) then
    raise exception 'CMS administrator access required' using errcode = '42501';
  end if;
  select documents.kind into kind from public.cms_documents documents where id = p_document_id for update;
  if not found then raise exception 'CMS document not found' using errcode = 'P0002'; end if;
  select revisions.* into target from public.cms_revisions revisions where id = p_revision_id for update;
  if not found then raise exception 'CMS revision not found' using errcode = 'P0002'; end if;
  if target.document_id <> p_document_id then raise exception 'revision does not belong to document' using errcode = '22023'; end if;
  if target.status = 'draft' and target.edit_version = p_expected_edit_version then
    perform 1 from public.cms_collect_draft_media_paths(target.payload);
    status := target.status; payload := target.payload; persisted_replacements := '{}'::jsonb; return next; return;
  end if;
  if target.status = 'published' and target.edit_version = p_expected_edit_version + 1
    and target.publication_expected_edit_version = p_expected_edit_version
    and target.publication_actor_id = p_actor_id
    and target.publication_replacements is not null then
    status := target.status; payload := target.payload; persisted_replacements := target.publication_replacements; return next; return;
  end if;
  if target.status = 'archived' then raise exception 'revision was superseded' using errcode = 'PT409', detail = 'superseded_revision'; end if;
  raise exception 'draft edit token is stale' using errcode = 'PT409', detail = 'stale_edit_version';
end;
$$;

create function public.cms_finalize_media_publication(
  p_document_id uuid,
  p_revision_id uuid,
  p_expected_edit_version bigint,
  p_actor_id uuid,
  p_replacements jsonb
)
returns public.cms_revisions language plpgsql security definer set search_path = '' as $$
declare
  document_kind public.cms_document_kind; target public.cms_revisions%rowtype; published public.cms_revisions%rowtype;
  draft_paths text[]; replacement_paths text[]; entry record; promoted jsonb;
begin
  if not exists(select 1 from public.cms_admins where user_id = p_actor_id) then raise exception 'CMS administrator access required' using errcode = '42501'; end if;
  if jsonb_typeof(p_replacements) <> 'object' then raise exception 'replacements must be an object' using errcode = '22023', detail = 'invalid_replacements'; end if;
  select documents.kind into document_kind from public.cms_documents documents where id = p_document_id for update;
  if not found then raise exception 'CMS document not found' using errcode = 'P0002'; end if;
  select revisions.* into target from public.cms_revisions revisions where id = p_revision_id for update;
  if not found then raise exception 'CMS revision not found' using errcode = 'P0002'; end if;
  if target.document_id <> p_document_id then raise exception 'revision does not belong to document' using errcode = '22023'; end if;
  if target.status = 'published' and target.edit_version = p_expected_edit_version + 1
    and target.publication_expected_edit_version = p_expected_edit_version
    and target.publication_actor_id = p_actor_id
    and target.publication_replacements = p_replacements
    and exists(select 1 from public.cms_revisions where id = p_revision_id and document_id = p_document_id and status = 'published') then return target;
  end if;
  if target.status = 'archived' then raise exception 'revision was superseded' using errcode = 'PT409', detail = 'superseded_revision'; end if;
  if target.status <> 'draft' or target.edit_version <> p_expected_edit_version then raise exception 'draft edit token is stale' using errcode = 'PT409', detail = 'stale_edit_version'; end if;
  select coalesce(array_agg(path order by path), '{}'::text[]) into draft_paths from (select distinct public.cms_collect_draft_media_paths(target.payload) path) paths;
  select coalesce(array_agg(key order by key), '{}'::text[]) into replacement_paths from jsonb_object_keys(p_replacements) key;
  if draft_paths <> replacement_paths then raise exception 'replacement set does not match saved draft' using errcode = '22023', detail = 'replacement_set_mismatch'; end if;
  for entry in select key, value from jsonb_each(p_replacements) loop
    if not public.cms_jsonb_is_draft_media_reference(jsonb_build_object('kind','draft','bucket','draft-media','path',entry.key))
      or split_part(entry.key, '/', 1) <> p_actor_id::text then raise exception 'draft owner mismatch' using errcode = '42501', detail = 'draft_owner_mismatch'; end if;
    if not public.cms_jsonb_is_public_media_replacement(entry.value)
      or entry.value ->> 'path' <> split_part(split_part(entry.key, '/', 2), '.', 1) || '/' || split_part(entry.key, '/', 2) then
      raise exception 'invalid media replacement' using errcode = '22023', detail = 'invalid_replacement';
    end if;
  end loop;
  promoted := public.cms_apply_media_replacements(target.payload, p_replacements);
  if public.cms_payload_has_draft_media(promoted) then raise exception 'residual draft media' using errcode = '23514', detail = 'residual_draft_media'; end if;
  if public.cms_payload_is_publishable(document_kind, promoted) is not true then raise exception 'payload does not match CMS document kind %', document_kind using errcode = '23514'; end if;
  perform set_config('app.cms_actor_id', p_actor_id::text, true);
  perform set_config('app.cms_publication_finalize', 'on', true);
  update public.cms_revisions set status = 'archived', archived_at = statement_timestamp(), archived_by = p_actor_id where document_id = p_document_id and status = 'published';
  update public.cms_revisions set payload = promoted, status = 'published', published_at = statement_timestamp(), published_by = p_actor_id,
    publication_expected_edit_version = p_expected_edit_version, publication_replacements = p_replacements, publication_actor_id = p_actor_id
  where id = p_revision_id and document_id = p_document_id and status = 'draft' and edit_version = p_expected_edit_version returning * into published;
  if not found then raise exception 'draft edit token is stale' using errcode = 'PT409', detail = 'stale_edit_version'; end if;
  return published;
end;
$$;

alter function public.cms_jsonb_is_draft_media_reference(jsonb) owner to postgres;
alter function public.cms_jsonb_is_draft_media_like(jsonb) owner to postgres;
alter function public.cms_jsonb_is_public_media_replacement(jsonb) owner to postgres;
alter function public.cms_collect_draft_media_paths(jsonb) owner to postgres;
alter function public.cms_payload_has_draft_media(jsonb) owner to postgres;
alter function public.cms_apply_media_replacements(jsonb, jsonb) owner to postgres;
alter function public.cms_prepare_media_publication(uuid, uuid, bigint, uuid) owner to postgres;
alter function public.cms_finalize_media_publication(uuid, uuid, bigint, uuid, jsonb) owner to postgres;

revoke all on function public.cms_jsonb_is_draft_media_reference(jsonb), public.cms_jsonb_is_draft_media_like(jsonb), public.cms_jsonb_is_public_media_replacement(jsonb),
  public.cms_collect_draft_media_paths(jsonb), public.cms_payload_has_draft_media(jsonb), public.cms_apply_media_replacements(jsonb, jsonb),
  public.cms_prepare_media_publication(uuid, uuid, bigint, uuid), public.cms_finalize_media_publication(uuid, uuid, bigint, uuid, jsonb)
from public, anon, authenticated;
grant execute on function public.cms_prepare_media_publication(uuid, uuid, bigint, uuid) to service_role;
grant execute on function public.cms_finalize_media_publication(uuid, uuid, bigint, uuid, jsonb) to service_role;
revoke all on function public.cms_publish_revision(uuid, uuid, bigint) from public, anon, authenticated;

notify pgrst, 'reload schema';
commit;
