-- allow: SIZE_OK - Historical forward-only validation migration: its helper replacements, dispatcher, and save enforcement must replay atomically; modifying migration boundaries would invalidate history.
begin;

create or replace function public.cms_jsonb_is_credential_free_https_url(candidate jsonb)
returns boolean language plpgsql immutable strict security invoker set search_path = '' as $$
declare
  value text;
  authority text;
  port_value text;
begin
  if jsonb_typeof(candidate) <> 'string' then
    return false;
  end if;

  value := candidate #>> '{}';
  if value <> btrim(value)
    or value ~ '[[:space:]]'
    or value !~* '^https://[^/?#]+' then
    return false;
  end if;

  authority := substring(lower(value) from '^https://([^/?#]+)');
  if authority is null or authority ~ '@' then
    return false;
  end if;

  if authority ~ '^\[' then
    if authority !~ '^\[[0-9A-Fa-f:.]+\](:[0-9]*)?$' then
      return false;
    end if;
    port_value := substring(authority from '\]:([0-9]*)$');
  elsif authority ~ ':' then
    if authority !~ '^[^:]+:[0-9]*$' then
      return false;
    end if;
    port_value := substring(authority from ':([0-9]*)$');
  end if;

  return port_value is null
    or port_value = ''
    or port_value::numeric between 0 and 65535;
end;
$$;

create or replace function public.cms_jsonb_is_https_url(candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select public.cms_jsonb_is_credential_free_https_url(candidate);
$$;

create or replace function public.cms_jsonb_is_localized_calendar_date(candidate jsonb, locale text)
returns boolean language plpgsql immutable strict security invoker set search_path = '' as $$
declare value text; parts text[]; year_value integer; month_value integer; day_value integer; max_day integer;
begin
  if jsonb_typeof(candidate) <> 'string' then return false; end if;
  value := candidate #>> '{}';
  if locale = 'zh' then
    parts := regexp_match(value, '^([0-9]{4})/([0-9]{2})/([0-9]{2})$');
  elsif locale = 'en' then
    parts := regexp_match(value, '^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ([0-9]{1,2}), ([0-9]{4})$');
    if parts is not null then
      parts := array[parts[3], (array_position(array['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], parts[1]))::text, parts[2]];
    end if;
  else return false;
  end if;
  if parts is null then return false; end if;
  year_value := parts[1]::integer; month_value := parts[2]::integer; day_value := parts[3]::integer;
  if month_value not between 1 and 12 then return false; end if;
  max_day := case month_value when 2 then case when year_value % 400 = 0 or (year_value % 4 = 0 and year_value % 100 <> 0) then 29 else 28 end
    when 4 then 30 when 6 then 30 when 9 then 30 when 11 then 30 else 31 end;
  return day_value between 1 and max_day;
end;
$$;

create or replace function public.cms_jsonb_is_localized_activity_datetime(candidate jsonb, locale text)
returns boolean language plpgsql immutable strict security invoker set search_path = '' as $$
declare value text; parts text[]; date_value jsonb; start_minutes integer; end_minutes integer;
begin
  if jsonb_typeof(candidate) <> 'string' then return false; end if;
  value := candidate #>> '{}';
  if locale = 'zh' then
    parts := regexp_match(value, '^([0-9]{4})/([0-9]{2})/([0-9]{2})（[日一二三四五六]）([0-9]{2}):([0-9]{2})–([0-9]{2}):([0-9]{2})$');
  elsif locale = 'en' then
    parts := regexp_match(value, '^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) ([0-9]{4})/([0-9]{2})/([0-9]{2}) ([0-9]{2}):([0-9]{2})–([0-9]{2}):([0-9]{2})$');
    if parts is not null then parts := parts[2:8]; end if;
  else return false;
  end if;
  if parts is null then return false; end if;
  date_value := to_jsonb(parts[1] || '/' || parts[2] || '/' || parts[3]);
  if public.cms_jsonb_is_localized_calendar_date(date_value, 'zh') is not true then return false; end if;
  if parts[4]::integer > 23 or parts[5]::integer > 59 or parts[6]::integer > 23 or parts[7]::integer > 59 then return false; end if;
  start_minutes := parts[4]::integer * 60 + parts[5]::integer;
  end_minutes := parts[6]::integer * 60 + parts[7]::integer;
  return start_minutes < end_minutes;
end;
$$;

create or replace function public.cms_jsonb_arrays_have_equal_length(left_value jsonb, right_value jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select case when jsonb_typeof(left_value) = 'array' and jsonb_typeof(right_value) = 'array'
    then jsonb_array_length(left_value) = jsonb_array_length(right_value) else false end;
$$;

create or replace function public.cms_jsonb_arrays_have_matching_field(left_value jsonb, right_value jsonb, field_name text)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select case when public.cms_jsonb_arrays_have_equal_length(left_value, right_value) then
    not exists (
      select 1 from jsonb_array_elements(left_value) with ordinality as left_item(value, position)
      join jsonb_array_elements(right_value) with ordinality as right_item(value, position) using (position)
      where jsonb_typeof(left_item.value -> field_name) <> 'string'
        or jsonb_typeof(right_item.value -> field_name) <> 'string'
        or left_item.value ->> field_name is distinct from right_item.value ->> field_name
    ) else false end;
$$;

create or replace function public.cms_jsonb_paired_nested_arrays_have_equal_length(left_value jsonb, right_value jsonb, nested_field text)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select case when public.cms_jsonb_arrays_have_equal_length(left_value, right_value) then
    not exists (
      select 1 from jsonb_array_elements(left_value) with ordinality as left_item(value, position)
      join jsonb_array_elements(right_value) with ordinality as right_item(value, position) using (position)
      where public.cms_jsonb_arrays_have_equal_length(left_item.value -> nested_field, right_item.value -> nested_field) is not true
    ) else false end;
$$;

create or replace function public.cms_jsonb_paired_nested_arrays_have_matching_field(left_value jsonb, right_value jsonb, nested_field text, field_name text)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select case when public.cms_jsonb_arrays_have_equal_length(left_value, right_value) then
    not exists (
      select 1 from jsonb_array_elements(left_value) with ordinality as left_item(value, position)
      join jsonb_array_elements(right_value) with ordinality as right_item(value, position) using (position)
      where public.cms_jsonb_arrays_have_matching_field(left_item.value -> nested_field, right_item.value -> nested_field, field_name) is not true
    ) else false end;
$$;

create or replace function public.cms_wave5_global_payload_is_valid(document_kind public.cms_document_kind, candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select case document_kind
    when 'centers' then
      public.cms_jsonb_arrays_have_matching_field(candidate #> '{zh,centers}', candidate #> '{en,centers}', 'id')
      and public.cms_jsonb_paired_nested_arrays_have_matching_field(candidate #> '{zh,centers}', candidate #> '{en,centers}', 'branches', 'id')
      and not exists (
        select 1 from jsonb_array_elements(case
          when jsonb_typeof(candidate #> '{zh,centers}') = 'array' and jsonb_typeof(candidate #> '{en,centers}') = 'array'
            then (candidate #> '{zh,centers}') || (candidate #> '{en,centers}') else '[]'::jsonb end) as center(value)
        where center.value ? 'externalUrl' and public.cms_jsonb_is_credential_free_https_url(center.value -> 'externalUrl') is not true
      )
    when 'people' then
      public.cms_jsonb_arrays_have_matching_field(candidate #> '{zh,centerPeople}', candidate #> '{en,centerPeople}', 'centerId')
      and public.cms_jsonb_paired_nested_arrays_have_equal_length(candidate #> '{zh,centerPeople}', candidate #> '{en,centerPeople}', 'people')
      and public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,holisticInstructors}', candidate #> '{en,holisticInstructors}')
      and public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,holisticSeedTeachers}', candidate #> '{en,holisticSeedTeachers}')
      and public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,holisticAiTeam}', candidate #> '{en,holisticAiTeam}')
    when 'news' then
      public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,department}', candidate #> '{en,department}')
      and public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,holistic}', candidate #> '{en,holistic}')
      and public.cms_jsonb_arrays_have_matching_field(candidate #> '{zh,categories,department}', candidate #> '{en,categories,department}', 'id')
      and public.cms_jsonb_arrays_have_matching_field(candidate #> '{zh,categories,holistic}', candidate #> '{en,categories,holistic}', 'id')
      and public.cms_jsonb_is_localized_calendar_date(candidate #> '{zh,latestUpdate}', 'zh')
      and public.cms_jsonb_is_localized_calendar_date(candidate #> '{en,latestUpdate}', 'en')
      and not exists (
        select 1 from (values
          (candidate #> '{zh,department}', 'zh'), (candidate #> '{zh,holistic}', 'zh'),
          (candidate #> '{en,department}', 'en'), (candidate #> '{en,holistic}', 'en')
        ) as collection(items, locale)
        cross join lateral jsonb_array_elements(case when jsonb_typeof(collection.items) = 'array' then collection.items else '[]'::jsonb end) as announcement(value)
        where public.cms_jsonb_is_localized_calendar_date(announcement.value -> 'date', collection.locale) is not true
      )
    when 'activities' then
      public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,department}', candidate #> '{en,department}')
      and public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,holistic}', candidate #> '{en,holistic}')
      and not exists (
        select 1 from (values
          (candidate #> '{zh,department}', 'zh'), (candidate #> '{zh,holistic}', 'zh'),
          (candidate #> '{en,department}', 'en'), (candidate #> '{en,holistic}', 'en')
        ) as collection(items, locale)
        cross join lateral jsonb_array_elements(case when jsonb_typeof(collection.items) = 'array' then collection.items else '[]'::jsonb end) as activity(value)
        where public.cms_jsonb_is_localized_activity_datetime(activity.value -> 'date', collection.locale) is not true
          or (activity.value ->> 'link' <> '' and public.cms_jsonb_is_credential_free_https_url(activity.value -> 'link') is not true)
      )
    when 'kpis' then public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,items}', candidate #> '{en,items}')
    when 'honors' then
      public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,snqProjects}', candidate #> '{en,snqProjects}')
      and public.cms_jsonb_paired_nested_arrays_have_equal_length(candidate #> '{zh,snqProjects}', candidate #> '{en,snqProjects}', 'members')
      and public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,snqYearCounts}', candidate #> '{en,snqYearCounts}')
      and public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,nhqa,leads}', candidate #> '{en,nhqa,leads}')
      and public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,nhqa,keywords}', candidate #> '{en,nhqa,keywords}')
    else true
  end;
$$;

create or replace function public.cms_payload_is_publishable(document_kind public.cms_document_kind, candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select public.cms_wave5_global_payload_is_valid(document_kind, candidate) and case document_kind
    when 'site_copy' then public.cms_site_copy_payload_is_publishable(candidate)
    when 'centers' then public.cms_centers_payload_is_publishable(candidate)
    when 'people' then public.cms_people_payload_is_publishable(candidate)
    when 'news' then public.cms_news_payload_is_publishable(candidate)
    when 'activities' then public.cms_activities_payload_is_publishable(candidate)
    when 'kpis' then public.cms_kpis_payload_is_publishable(candidate)
    when 'honors' then public.cms_honors_payload_is_publishable(candidate)
    when 'digital_materials' then public.cms_digital_materials_payload_is_publishable(candidate)
    when 'facdev' then public.cms_facdev_payload_is_publishable(candidate)
    when 'ebm' then public.cms_ebm_payload_is_publishable(candidate)
    when 'holistic' then public.cms_holistic_payload_is_publishable(candidate)
    when 'holistic_research' then public.cms_holistic_research_payload_is_publishable(candidate)
    else false end;
$$;

create or replace function public.cms_save_draft(p_document_id uuid, p_revision_id uuid, p_expected_edit_version bigint, p_payload jsonb)
returns public.cms_revisions language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid(); document_kind public.cms_document_kind; target_revision public.cms_revisions%rowtype;
  saved_revision public.cms_revisions%rowtype; draft_paths text[]; draft_path text;
  validation_payload jsonb; validation_replacements jsonb;
begin
  if actor_id is null or not exists (select 1 from public.cms_admins as administrators where administrators.user_id = actor_id) then
    raise exception 'CMS administrator access required' using errcode = '42501';
  end if;
  select documents.kind into document_kind from public.cms_documents as documents where documents.id = p_document_id for update;
  if not found then raise exception 'CMS document not found' using errcode = 'P0002'; end if;
  select revisions.* into target_revision from public.cms_revisions as revisions where revisions.id = p_revision_id for update;
  if not found then raise exception 'CMS revision not found' using errcode = 'P0002'; end if;
  if target_revision.document_id <> p_document_id or target_revision.status <> 'draft' then
    raise exception 'chosen revision must be a draft belonging to the document' using errcode = '22023';
  end if;
  if target_revision.edit_version <> p_expected_edit_version then
    raise exception 'draft edit token is stale' using errcode = 'PT409', detail = 'stale_edit_version';
  end if;
  select coalesce(
    jsonb_object_agg(
      paths.path,
      jsonb_build_object('kind', 'local', 'path', 'assets/validation-placeholder.jpg')
      order by paths.path
    ),
    '{}'::jsonb
  )
  into validation_replacements
  from private.cms_unique_draft_media_paths(p_payload) as paths;
  validation_payload := public.cms_apply_media_replacements(
    p_payload,
    validation_replacements
  );
  if public.cms_payload_is_publishable(document_kind, validation_payload) is not true then
    raise exception 'payload violates the CMS document contract'
      using errcode = '23514', detail = 'cms_contract_invalid';
  end if;
  select coalesce(array_agg(paths.path order by paths.path), '{}'::text[]) into draft_paths
  from private.cms_unique_draft_media_paths(p_payload) as paths;
  foreach draft_path in array draft_paths loop
    if split_part(draft_path, '/', 1) <> actor_id::text then
      raise exception 'draft owner mismatch' using errcode = '42501', detail = 'draft_owner_mismatch';
    end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('draft-media/' || draft_path, 0));
  end loop;
  foreach draft_path in array draft_paths loop
    if not exists (select 1 from storage.objects as objects where objects.bucket_id = 'draft-media'
      and objects.name = draft_path and objects.owner_id = actor_id::text) then
      raise exception 'draft media object is missing' using errcode = '23503', detail = 'draft_media_missing';
    end if;
  end loop;
  update public.cms_revisions as revisions set payload = p_payload where revisions.id = p_revision_id
    and revisions.document_id = p_document_id and revisions.status = 'draft'
    and revisions.edit_version = p_expected_edit_version returning revisions.* into saved_revision;
  if not found then raise exception 'draft edit token is stale' using errcode = 'PT409', detail = 'stale_edit_version'; end if;
  return saved_revision;
end;
$$;

alter function public.cms_jsonb_is_credential_free_https_url(jsonb) owner to postgres;
alter function public.cms_jsonb_is_https_url(jsonb) owner to postgres;
alter function public.cms_jsonb_is_localized_calendar_date(jsonb, text) owner to postgres;
alter function public.cms_jsonb_is_localized_activity_datetime(jsonb, text) owner to postgres;
alter function public.cms_jsonb_arrays_have_equal_length(jsonb, jsonb) owner to postgres;
alter function public.cms_jsonb_arrays_have_matching_field(jsonb, jsonb, text) owner to postgres;
alter function public.cms_jsonb_paired_nested_arrays_have_equal_length(jsonb, jsonb, text) owner to postgres;
alter function public.cms_jsonb_paired_nested_arrays_have_matching_field(jsonb, jsonb, text, text) owner to postgres;
alter function public.cms_wave5_global_payload_is_valid(public.cms_document_kind, jsonb) owner to postgres;
alter function public.cms_payload_is_publishable(public.cms_document_kind, jsonb) owner to postgres;
alter function public.cms_save_draft(uuid, uuid, bigint, jsonb) owner to postgres;

revoke all on function public.cms_jsonb_is_credential_free_https_url(jsonb), public.cms_jsonb_is_https_url(jsonb),
  public.cms_jsonb_is_localized_calendar_date(jsonb, text), public.cms_jsonb_is_localized_activity_datetime(jsonb, text),
  public.cms_jsonb_arrays_have_equal_length(jsonb, jsonb), public.cms_jsonb_arrays_have_matching_field(jsonb, jsonb, text),
  public.cms_jsonb_paired_nested_arrays_have_equal_length(jsonb, jsonb, text),
  public.cms_jsonb_paired_nested_arrays_have_matching_field(jsonb, jsonb, text, text),
  public.cms_wave5_global_payload_is_valid(public.cms_document_kind, jsonb),
  public.cms_payload_is_publishable(public.cms_document_kind, jsonb)
from public, anon, authenticated;
revoke all on function public.cms_save_draft(uuid, uuid, bigint, jsonb) from public, anon, authenticated;
grant execute on function public.cms_save_draft(uuid, uuid, bigint, jsonb) to authenticated;

comment on function public.cms_save_draft(uuid, uuid, bigint, jsonb) is
  'Saves one optimistic schema-valid draft after serialized owner-scoped draft-media checks.';

notify pgrst, 'reload schema';
commit;
