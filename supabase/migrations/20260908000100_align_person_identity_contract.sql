-- allow: SIZE_OK - This forward migration atomically upgrades every persisted person scope before replacing the interdependent validators.
begin;

create function public.cms_normalize_person_identity(candidate text)
returns text language sql immutable strict security invoker set search_path = '' as $$
  select trim(both '-' from regexp_replace(lower(candidate) collate "C", '[^a-z0-9]+', '-', 'g'));
$$;

create function public.cms_upgrade_bilingual_person_array(zh_people jsonb, en_people jsonb)
returns jsonb language plpgsql immutable strict security invoker set search_path = '' as $$
declare
  zh_result jsonb := zh_people;
  en_result jsonb := en_people;
  zh_person jsonb;
  en_person jsonb;
  zh_has_id boolean;
  en_has_id boolean;
  preserved_id text;
  base_id text;
  assigned_id text;
  preserved_ids text[] := '{}'::text[];
  used_ids text[];
  person_index integer;
  collision_suffix integer;
begin
  if jsonb_typeof(zh_people) <> 'array'
    or jsonb_typeof(en_people) <> 'array'
    or jsonb_array_length(zh_people) <> jsonb_array_length(en_people) then
    raise exception 'ambiguous or partial person identity payload' using errcode = '23514';
  end if;

  if jsonb_array_length(zh_people) > 0 then
    for person_index in 0..jsonb_array_length(zh_people) - 1 loop
      zh_person := zh_people -> person_index;
      en_person := en_people -> person_index;
      if jsonb_typeof(zh_person) <> 'object' or jsonb_typeof(en_person) <> 'object' then
        raise exception 'ambiguous or partial person identity payload' using errcode = '23514';
      end if;

      zh_has_id := zh_person ? 'id';
      en_has_id := en_person ? 'id';
      if zh_has_id <> en_has_id then
        raise exception 'invalid bilingual person identity' using errcode = '23514';
      end if;
      if zh_has_id then
        if jsonb_typeof(zh_person -> 'id') <> 'string'
          or jsonb_typeof(en_person -> 'id') <> 'string'
          or btrim(zh_person ->> 'id') = ''
          or btrim(en_person ->> 'id') = ''
          or zh_person ->> 'id' is distinct from en_person ->> 'id' then
          raise exception 'invalid bilingual person identity' using errcode = '23514';
        end if;
        preserved_id := zh_person ->> 'id';
        if preserved_id = any(preserved_ids) then
          raise exception 'duplicate preserved person identity' using errcode = '23514';
        end if;
        preserved_ids := array_append(preserved_ids, preserved_id);
      end if;
    end loop;
  end if;

  used_ids := preserved_ids;
  if jsonb_array_length(zh_people) > 0 then
    for person_index in 0..jsonb_array_length(zh_people) - 1 loop
      zh_person := zh_result -> person_index;
      en_person := en_result -> person_index;
      if not (zh_person ? 'id') then
        base_id := coalesce(
          nullif(public.cms_normalize_person_identity(en_person ->> 'slug'), ''),
          nullif(public.cms_normalize_person_identity(en_person ->> 'hubId'), ''),
          nullif(public.cms_normalize_person_identity(lower(en_person ->> 'email')), ''),
          nullif(public.cms_normalize_person_identity(en_person ->> 'name'), ''),
          'person'
        );
        assigned_id := base_id;
        collision_suffix := 2;
        while assigned_id = any(used_ids) loop
          assigned_id := base_id || '-' || collision_suffix::text;
          collision_suffix := collision_suffix + 1;
        end loop;
        used_ids := array_append(used_ids, assigned_id);
        zh_result := jsonb_set(zh_result, array[person_index::text, 'id'], to_jsonb(assigned_id), true);
        en_result := jsonb_set(en_result, array[person_index::text, 'id'], to_jsonb(assigned_id), true);
      end if;
    end loop;
  end if;

  return jsonb_build_object('zh', zh_result, 'en', en_result);
end;
$$;

create function public.cms_upgrade_person_identity_payload(
  document_kind public.cms_document_kind,
  candidate jsonb
)
returns jsonb language plpgsql immutable strict security invoker set search_path = '' as $$
declare
  upgraded jsonb := candidate;
  paired jsonb;
  collection_name text;
  group_index integer;
  zh_groups jsonb;
  en_groups jsonb;
  zh_leads jsonb;
  en_leads jsonb;
begin
  if not public.cms_jsonb_has_exact_keys(candidate, array['zh', 'en'], array[]::text[])
    or jsonb_typeof(candidate -> 'zh') <> 'object'
    or jsonb_typeof(candidate -> 'en') <> 'object' then
    raise exception 'ambiguous or partial person identity payload' using errcode = '23514';
  end if;

  case document_kind
    when 'people' then
      if exists (
        select 1
        from (values ('zh'), ('en')) as locale(name)
        cross join (values
          ('centerPeople'), ('holisticInstructors'), ('holisticSeedTeachers'),
          ('holisticAiTeam'), ('memberGroups')
        ) as collection(name)
        where jsonb_typeof(candidate #> array[locale.name, collection.name]) <> 'array'
      ) then
        raise exception 'ambiguous or partial person identity payload' using errcode = '23514';
      end if;

      zh_groups := candidate #> '{zh,centerPeople}';
      en_groups := candidate #> '{en,centerPeople}';
      if jsonb_array_length(zh_groups) <> jsonb_array_length(en_groups) then
        raise exception 'ambiguous or partial person identity payload' using errcode = '23514';
      end if;
      if jsonb_array_length(zh_groups) > 0 then
        for group_index in 0..jsonb_array_length(zh_groups) - 1 loop
          paired := public.cms_upgrade_bilingual_person_array(
            zh_groups #> array[group_index::text, 'people'],
            en_groups #> array[group_index::text, 'people']
          );
          upgraded := jsonb_set(upgraded, array['zh', 'centerPeople', group_index::text, 'people'], paired -> 'zh');
          upgraded := jsonb_set(upgraded, array['en', 'centerPeople', group_index::text, 'people'], paired -> 'en');
        end loop;
      end if;

      foreach collection_name in array array['holisticInstructors', 'holisticSeedTeachers', 'holisticAiTeam'] loop
        paired := public.cms_upgrade_bilingual_person_array(
          candidate #> array['zh', collection_name],
          candidate #> array['en', collection_name]
        );
        upgraded := jsonb_set(upgraded, array['zh', collection_name], paired -> 'zh');
        upgraded := jsonb_set(upgraded, array['en', collection_name], paired -> 'en');
      end loop;

      zh_groups := candidate #> '{zh,memberGroups}';
      en_groups := candidate #> '{en,memberGroups}';
      if jsonb_array_length(zh_groups) <> jsonb_array_length(en_groups) then
        raise exception 'ambiguous or partial person identity payload' using errcode = '23514';
      end if;
      if jsonb_array_length(zh_groups) > 0 then
        for group_index in 0..jsonb_array_length(zh_groups) - 1 loop
          paired := public.cms_upgrade_bilingual_person_array(
            zh_groups #> array[group_index::text, 'people'],
            en_groups #> array[group_index::text, 'people']
          );
          upgraded := jsonb_set(upgraded, array['zh', 'memberGroups', group_index::text, 'people'], paired -> 'zh');
          upgraded := jsonb_set(upgraded, array['en', 'memberGroups', group_index::text, 'people'], paired -> 'en');
        end loop;
      end if;
    when 'facdev' then
      zh_groups := candidate #> '{zh,groups}';
      en_groups := candidate #> '{en,groups}';
      if jsonb_typeof(zh_groups) <> 'array'
        or jsonb_typeof(en_groups) <> 'array'
        or jsonb_array_length(zh_groups) <> jsonb_array_length(en_groups) then
        raise exception 'ambiguous or partial person identity payload' using errcode = '23514';
      end if;
      select coalesce(jsonb_agg(group_item.value -> 'lead' order by group_item.ordinality), '[]'::jsonb)
      into zh_leads
      from jsonb_array_elements(zh_groups) with ordinality as group_item(value, ordinality);
      select coalesce(jsonb_agg(group_item.value -> 'lead' order by group_item.ordinality), '[]'::jsonb)
      into en_leads
      from jsonb_array_elements(en_groups) with ordinality as group_item(value, ordinality);
      paired := public.cms_upgrade_bilingual_person_array(zh_leads, en_leads);
      if jsonb_array_length(zh_groups) > 0 then
        for group_index in 0..jsonb_array_length(zh_groups) - 1 loop
          upgraded := jsonb_set(upgraded, array['zh', 'groups', group_index::text, 'lead'], paired #> array['zh', group_index::text]);
          upgraded := jsonb_set(upgraded, array['en', 'groups', group_index::text, 'lead'], paired #> array['en', group_index::text]);
        end loop;
      end if;
    else
      raise exception 'person identity upgrader does not support CMS document kind %', document_kind using errcode = '23514';
  end case;

  return upgraded;
end;
$$;

alter table public.cms_revisions disable trigger cms_revisions_enforce_lifecycle;

with upgrades as (
  select revisions.id, public.cms_upgrade_person_identity_payload(documents.kind, revisions.payload) as payload
  from public.cms_revisions as revisions
  join public.cms_documents as documents on documents.id = revisions.document_id
  where documents.kind in ('people', 'facdev')
    and revisions.status in ('draft', 'published', 'archived')
)
update public.cms_revisions as revisions
set payload = upgrades.payload
from upgrades
where revisions.id = upgrades.id
  and revisions.payload is distinct from upgrades.payload;

alter table public.cms_revisions enable trigger cms_revisions_enforce_lifecycle;

create function public.cms_jsonb_bilingual_person_arrays_are_valid(zh_people jsonb, en_people jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select case
    when jsonb_typeof(zh_people) <> 'array'
      or jsonb_typeof(en_people) <> 'array'
      or jsonb_array_length(zh_people) <> jsonb_array_length(en_people) then false
    else
      not exists (
        select 1
        from jsonb_array_elements(zh_people) as person(value)
        where public.cms_jsonb_is_person(person.value) is not true
      )
      and not exists (
        select 1
        from jsonb_array_elements(en_people) as person(value)
        where public.cms_jsonb_is_person(person.value) is not true
      )
      and (select count(*) = count(distinct person.value ->> 'id') from jsonb_array_elements(zh_people) as person(value))
      and (select count(*) = count(distinct person.value ->> 'id') from jsonb_array_elements(en_people) as person(value))
      and not exists (
        select 1
        from jsonb_array_elements(zh_people) with ordinality as zh_person(value, ordinality)
        join jsonb_array_elements(en_people) with ordinality as en_person(value, ordinality) using (ordinality)
        where zh_person.value ->> 'id' is distinct from en_person.value ->> 'id'
          or zh_person.value ->> 'roleKey' is distinct from en_person.value ->> 'roleKey'
          or zh_person.value ->> 'slug' is distinct from en_person.value ->> 'slug'
          or zh_person.value ->> 'hubId' is distinct from en_person.value ->> 'hubId'
          or zh_person.value ->> 'ext' is distinct from en_person.value ->> 'ext'
          or zh_person.value ->> 'email' is distinct from en_person.value ->> 'email'
          or zh_person.value ->> 'name' is distinct from en_person.value ->> 'alternateName'
          or zh_person.value ->> 'alternateName' is distinct from en_person.value ->> 'name'
      )
  end;
$$;

create or replace function public.cms_jsonb_is_person(candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select case when jsonb_typeof(candidate) <> 'object' then false else
    public.cms_jsonb_has_exact_keys(
      candidate,
      array['id', 'name', 'alternateName', 'roleKey', 'role', 'department', 'slug', 'hubId', 'duty', 'ext', 'email'],
      array['portrait']
    )
    and not exists (
      select 1 from jsonb_each(candidate - 'portrait') as field(key, value)
      where jsonb_typeof(field.value) <> 'string'
    )
    and length(candidate ->> 'id') > 0
    and candidate ->> 'roleKey' = any(array[
      'director', 'deputy', 'cadmin', 'instructor', 'seed', 'vp', 'lead', 'ddir',
      'ddep', 'head', 'spec', 'pm', 'advisor', 'ai', 'eng'
    ])
    and (
      not candidate ? 'portrait'
      or jsonb_typeof(candidate -> 'portrait') = 'null'
      or public.cms_jsonb_is_published_media_reference(candidate -> 'portrait')
    )
  end;
$$;

create or replace function public.cms_people_payload_is_publishable(candidate jsonb)
returns boolean language plpgsql immutable strict security invoker set search_path = '' as $$
declare
  zh_groups jsonb;
  en_groups jsonb;
  collection_name text;
  group_index integer;
begin
  if not public.cms_jsonb_has_exact_keys(candidate, array['zh', 'en'], array[]::text[])
    or not public.cms_jsonb_has_exact_keys(candidate -> 'zh', array['centerPeople', 'holisticInstructors', 'holisticSeedTeachers', 'holisticAiTeam', 'memberGroups'], array[]::text[])
    or not public.cms_jsonb_has_exact_keys(candidate -> 'en', array['centerPeople', 'holisticInstructors', 'holisticSeedTeachers', 'holisticAiTeam', 'memberGroups'], array[]::text[]) then
    return false;
  end if;

  zh_groups := candidate #> '{zh,centerPeople}';
  en_groups := candidate #> '{en,centerPeople}';
  if public.cms_jsonb_array_has_exact_field_values(zh_groups, 'centerId', array['faculty_dev', 'clinical_skills', 'ebm', 'holistic', 'med_edu_research', 'admin']) is not true
    or public.cms_jsonb_array_has_exact_field_values(en_groups, 'centerId', array['faculty_dev', 'clinical_skills', 'ebm', 'holistic', 'med_edu_research', 'admin']) is not true
    or public.cms_jsonb_arrays_have_matching_field(zh_groups, en_groups, 'centerId') is not true then
    return false;
  end if;
  for group_index in 0..jsonb_array_length(zh_groups) - 1 loop
    if not public.cms_jsonb_has_exact_keys(zh_groups -> group_index, array['centerId', 'people'], array[]::text[])
      or not public.cms_jsonb_has_exact_keys(en_groups -> group_index, array['centerId', 'people'], array[]::text[])
      or public.cms_jsonb_bilingual_person_arrays_are_valid(
        zh_groups #> array[group_index::text, 'people'],
        en_groups #> array[group_index::text, 'people']
      ) is not true then
      return false;
    end if;
  end loop;

  foreach collection_name in array array['holisticInstructors', 'holisticSeedTeachers', 'holisticAiTeam'] loop
    if public.cms_jsonb_bilingual_person_arrays_are_valid(
      candidate #> array['zh', collection_name],
      candidate #> array['en', collection_name]
    ) is not true then
      return false;
    end if;
  end loop;

  zh_groups := candidate #> '{zh,memberGroups}';
  en_groups := candidate #> '{en,memberGroups}';
  if jsonb_typeof(zh_groups) <> 'array'
    or jsonb_typeof(en_groups) <> 'array'
    or (select jsonb_agg(group_item.value -> 'id' order by group_item.ordinality) from jsonb_array_elements(zh_groups) with ordinality as group_item(value, ordinality))
      is distinct from '["department_advisors","teaching_attendings","teaching_allied_health"]'::jsonb
    or (select jsonb_agg(group_item.value -> 'id' order by group_item.ordinality) from jsonb_array_elements(en_groups) with ordinality as group_item(value, ordinality))
      is distinct from '["department_advisors","teaching_attendings","teaching_allied_health"]'::jsonb
    or public.cms_jsonb_arrays_have_matching_field(zh_groups, en_groups, 'id') is not true then
    return false;
  end if;
  for group_index in 0..jsonb_array_length(zh_groups) - 1 loop
    if not public.cms_jsonb_has_exact_keys(zh_groups -> group_index, array['id', 'people'], array[]::text[])
      or not public.cms_jsonb_has_exact_keys(en_groups -> group_index, array['id', 'people'], array[]::text[])
      or public.cms_jsonb_bilingual_person_arrays_are_valid(
        zh_groups #> array[group_index::text, 'people'],
        en_groups #> array[group_index::text, 'people']
      ) is not true then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

create or replace function public.cms_facdev_payload_is_publishable(candidate jsonb)
returns boolean language plpgsql immutable strict security invoker set search_path = '' as $$
declare
  locale_name text;
  locale_value jsonb;
  item jsonb;
  zh_leads jsonb;
  en_leads jsonb;
begin
  if not public.cms_jsonb_has_exact_keys(candidate, array['zh', 'en'], array[]::text[]) then
    return false;
  end if;
  foreach locale_name in array array['zh', 'en'] loop
    locale_value := candidate -> locale_name;
    if not public.cms_jsonb_has_exact_keys(locale_value, array[
      'aboutBody', 'aboutBody2', 'aboutEyebrow', 'aboutTitle', 'actEyebrow', 'actTitle',
      'closingBody', 'closingTitle', 'contactExt', 'contactPerson', 'contactPlace',
      'contactQuote', 'eyebrow', 'groupLeadLabel', 'groupRoot', 'groups', 'groupsDesc',
      'groupsEyebrow', 'groupsTitle', 'heroTag', 'heroTitle', 'kpis', 'membersTitle',
      'newsEyebrow', 'newsTitle', 'reservedNote', 'reservedTag', 'services', 'servicesDesc',
      'servicesEyebrow', 'servicesTitle'
    ], array[]::text[])
      or exists (
        select 1 from jsonb_each(locale_value - array['groups', 'kpis', 'services']) as field(key, value)
        where jsonb_typeof(field.value) <> 'string'
      ) then
      return false;
    end if;
    if jsonb_typeof(locale_value -> 'groups') <> 'array'
      or jsonb_typeof(locale_value -> 'kpis') <> 'array'
      or jsonb_typeof(locale_value -> 'services') <> 'array' then
      return false;
    end if;
    for item in select value from jsonb_array_elements(locale_value -> 'groups') loop
      if not public.cms_jsonb_has_exact_keys(item, array['desc', 'lead', 'name'], array[]::text[])
        or jsonb_typeof(item -> 'desc') <> 'string'
        or jsonb_typeof(item -> 'name') <> 'string'
        or public.cms_jsonb_is_person(item -> 'lead') is not true then
        return false;
      end if;
    end loop;
    for item in select value from jsonb_array_elements(locale_value -> 'kpis') loop
      if not public.cms_jsonb_has_exact_keys(item, array['num', 'suffix', 'label', 'en'], array[]::text[])
        or jsonb_typeof(item -> 'num') <> 'number'
        or jsonb_typeof(item -> 'suffix') <> 'string'
        or jsonb_typeof(item -> 'label') <> 'string'
        or jsonb_typeof(item -> 'en') <> 'string' then
        return false;
      end if;
    end loop;
    for item in select value from jsonb_array_elements(locale_value -> 'services') loop
      if not public.cms_jsonb_has_exact_keys(item, array['desc', 'title'], array[]::text[])
        or jsonb_typeof(item -> 'desc') <> 'string'
        or jsonb_typeof(item -> 'title') <> 'string' then
        return false;
      end if;
    end loop;
  end loop;

  if public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,groups}', candidate #> '{en,groups}') is not true
    or public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,kpis}', candidate #> '{en,kpis}') is not true
    or public.cms_jsonb_arrays_have_equal_length(candidate #> '{zh,services}', candidate #> '{en,services}') is not true then
    return false;
  end if;
  select coalesce(jsonb_agg(group_item.value -> 'lead' order by group_item.ordinality), '[]'::jsonb)
  into zh_leads
  from jsonb_array_elements(candidate #> '{zh,groups}') with ordinality as group_item(value, ordinality);
  select coalesce(jsonb_agg(group_item.value -> 'lead' order by group_item.ordinality), '[]'::jsonb)
  into en_leads
  from jsonb_array_elements(candidate #> '{en,groups}') with ordinality as group_item(value, ordinality);
  return public.cms_jsonb_bilingual_person_arrays_are_valid(zh_leads, en_leads);
end;
$$;

create or replace function public.cms_upgrade_legacy_people_payload(candidate jsonb)
returns jsonb language plpgsql immutable strict security invoker set search_path = '' as $$
declare
  upgraded jsonb := candidate;
  empty_groups constant jsonb := '[{"id":"department_advisors","people":[]},{"id":"teaching_attendings","people":[]},{"id":"teaching_allied_health","people":[]}]';
begin
  if not (candidate #> '{zh}') ? 'memberGroups' and not (candidate #> '{en}') ? 'memberGroups' then
    if not public.cms_jsonb_has_exact_keys(candidate -> 'zh', array['centerPeople', 'holisticInstructors', 'holisticSeedTeachers', 'holisticAiTeam'], array[]::text[])
      or not public.cms_jsonb_has_exact_keys(candidate -> 'en', array['centerPeople', 'holisticInstructors', 'holisticSeedTeachers', 'holisticAiTeam'], array[]::text[]) then
      raise exception 'ambiguous or partial legacy people payload' using errcode = '23514';
    end if;
    upgraded := jsonb_set(upgraded, '{zh,memberGroups}', empty_groups);
    upgraded := jsonb_set(upgraded, '{en,memberGroups}', empty_groups);
  elsif not ((candidate #> '{zh}') ? 'memberGroups' and (candidate #> '{en}') ? 'memberGroups') then
    raise exception 'ambiguous or partial legacy people payload' using errcode = '23514';
  end if;
  upgraded := public.cms_upgrade_person_identity_payload('people', upgraded);
  if public.cms_people_payload_is_publishable(upgraded) is not true then
    raise exception 'ambiguous or partial legacy people payload' using errcode = '23514';
  end if;
  return upgraded;
end;
$$;

do $$
declare
  revision record;
  validation_payload jsonb;
  validation_replacements jsonb;
begin
  for revision in
    select documents.kind, revisions.status, revisions.payload
    from public.cms_revisions as revisions
    join public.cms_documents as documents on documents.id = revisions.document_id
    where documents.kind in ('people', 'facdev')
      and revisions.status in ('draft', 'published', 'archived')
  loop
    validation_payload := revision.payload;
    if revision.status = 'draft' then
      select coalesce(
        jsonb_object_agg(
          paths.path,
          jsonb_build_object('kind', 'local', 'path', 'assets/validation-placeholder.jpg')
          order by paths.path
        ),
        '{}'::jsonb
      )
      into validation_replacements
      from public.cms_collect_draft_media_paths(revision.payload) as paths(path);
      validation_payload := public.cms_apply_media_replacements(revision.payload, validation_replacements);
    end if;
    if public.cms_payload_is_publishable(revision.kind, validation_payload) is not true then
      raise exception 'person identity revision upgrade left an invalid % payload', revision.kind using errcode = '23514';
    end if;
  end loop;
end;
$$;

alter function public.cms_normalize_person_identity(text) owner to postgres;
alter function public.cms_upgrade_bilingual_person_array(jsonb, jsonb) owner to postgres;
alter function public.cms_upgrade_person_identity_payload(public.cms_document_kind, jsonb) owner to postgres;
alter function public.cms_jsonb_bilingual_person_arrays_are_valid(jsonb, jsonb) owner to postgres;
alter function public.cms_jsonb_is_person(jsonb) owner to postgres;
alter function public.cms_people_payload_is_publishable(jsonb) owner to postgres;
alter function public.cms_facdev_payload_is_publishable(jsonb) owner to postgres;
alter function public.cms_upgrade_legacy_people_payload(jsonb) owner to postgres;
alter function public.cms_enforce_revision_lifecycle() owner to postgres;
alter function public.cms_enforce_revision_lifecycle() security definer;
alter function public.cms_enforce_revision_lifecycle() set search_path = '';

revoke all on function
  public.cms_normalize_person_identity(text),
  public.cms_upgrade_bilingual_person_array(jsonb, jsonb),
  public.cms_upgrade_person_identity_payload(public.cms_document_kind, jsonb),
  public.cms_jsonb_bilingual_person_arrays_are_valid(jsonb, jsonb),
  public.cms_jsonb_is_person(jsonb),
  public.cms_people_payload_is_publishable(jsonb),
  public.cms_facdev_payload_is_publishable(jsonb),
  public.cms_upgrade_legacy_people_payload(jsonb),
  public.cms_enforce_revision_lifecycle()
from public, anon, authenticated;

comment on function public.cms_normalize_person_identity(text) is
  'Normalizes one person identity seed to lowercase ASCII hyphen form.';
comment on function public.cms_upgrade_bilingual_person_array(jsonb, jsonb) is
  'Upgrades one ordered bilingual person scope while preserving valid IDs and deterministically suffixing generated collisions.';
comment on function public.cms_upgrade_person_identity_payload(public.cms_document_kind, jsonb) is
  'Upgrades every people collection or facdev group lead without changing other authored fields or media references.';
comment on function public.cms_jsonb_bilingual_person_arrays_are_valid(jsonb, jsonb) is
  'Validates ordered bilingual person parity and per-scope identity uniqueness while allowing locale-specific portraits.';
comment on function public.cms_jsonb_is_person(jsonb) is
  'Validates the exact published person shape, required non-empty identity, role vocabulary, and optional nullable local or public portrait.';
comment on function public.cms_people_payload_is_publishable(jsonb) is
  'Validates canonical people collections with ordered bilingual person identity and shared-field parity.';
comment on function public.cms_facdev_payload_is_publishable(jsonb) is
  'Validates faculty-development content with ordered bilingual group-lead identity and shared-field parity.';
comment on function public.cms_upgrade_legacy_people_payload(jsonb) is
  'Idempotently upgrades pre-Glance people payloads through the current person identity contract.';
comment on function public.cms_enforce_revision_lifecycle() is
  'Internal SECURITY DEFINER trigger boundary with a fixed empty search path, trusted owner, and no API-role execution privilege.';

notify pgrst, 'reload schema';
commit;
