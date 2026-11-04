-- allow: SIZE_OK - This forward migration atomically adds the localized-fields-v1 helper graph, the three archive validators, their dispatcher binding, and the relaxed published-envelope constraint that must replay together.
begin;

-- Shared text rule (mirrors plainTextProblem in src/content/contracts/localized.ts):
--   * a JSON string, non-empty, at most max_length UTF-16 code units (JavaScript String length);
--   * no U+0001-U+0008, U+000B-U+001F or U+007F (U+0000 cannot occur in PostgreSQL text), so TAB is
--     the only interior control in single-line text and CR never encodes a line break;
--   * single-line text rejects LF; multiline text allows it;
--   * trimmed text rejects ASCII whitespace (space, TAB, LF, VT, FF, CR) at either end, so a leading
--     ideographic-space (U+3000) indent survives, and rejects text made only of ECMAScript \s.
create function public.cms_jsonb_is_text_value(candidate jsonb, max_length integer, multiline boolean, trimmed boolean)
returns boolean language plpgsql immutable strict security invoker set search_path = '' as $$
declare
  value text;
begin
  if jsonb_typeof(candidate) <> 'string' then
    return false;
  end if;
  value := candidate #>> '{}';
  if value = '' then
    return false;
  end if;
  if char_length(value)
    + char_length(regexp_replace(value collate "C", '[^\U00010000-\U0010FFFF]', '', 'g')) > max_length then
    return false;
  end if;
  if value collate "C" ~ '[\u0001-\u0008\u000B-\u001F\u007F]' then
    return false;
  end if;
  if not multiline and value collate "C" ~ '\u000A' then
    return false;
  end if;
  if trimmed and (
    value collate "C" ~ '^[\u0009-\u000D\u0020]'
    or value collate "C" ~ '[\u0009-\u000D\u0020]$'
    or value collate "C" ~ '^[\u0009-\u000D\u0020\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]*$'
  ) then
    return false;
  end if;
  return true;
end;
$$;

-- Trimmed text for titles, labels, summaries, alt text, captions, headings, and table cells.
create function public.cms_jsonb_is_plain_text(candidate jsonb, max_length integer, multiline boolean)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select public.cms_jsonb_is_text_value(candidate, max_length, multiline, true);
$$;

-- Inline run text: multiline and untrimmed, because adjacent runs carry the spaces between words.
create function public.cms_jsonb_is_run_text(candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select public.cms_jsonb_is_text_value(candidate, 10000, true, false);
$$;

-- LocalizedText = { zh: string; en?: string }. Absence of en is the only "untranslated" encoding.
create function public.cms_jsonb_is_localized_text(candidate jsonb, max_length integer)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select public.cms_jsonb_has_exact_keys(candidate, array['zh'], array['en'])
    and public.cms_jsonb_is_plain_text(candidate -> 'zh', max_length, false) is true
    and (not (candidate ? 'en') or public.cms_jsonb_is_plain_text(candidate -> 'en', max_length, false) is true);
$$;

create function public.cms_jsonb_is_slug_id(candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select jsonb_typeof(candidate) = 'string'
    and char_length(candidate #>> '{}') between 1 and 80
    and (candidate #>> '{}') collate "C" ~ '^[a-z0-9]+(-[a-z0-9]+)*$';
$$;

create function public.cms_jsonb_is_iso_calendar_date(candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select jsonb_typeof(candidate) = 'string'
    and (candidate #>> '{}') collate "C" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    and public.cms_jsonb_is_localized_calendar_date(to_jsonb(replace(candidate #>> '{}', '-', '/')), 'zh') is true;
$$;

-- Mirrors z.number().int().min(minimum): JavaScript safe integers only.
create function public.cms_jsonb_is_safe_integer(candidate jsonb, minimum numeric)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select case when jsonb_typeof(candidate) <> 'number' then false else
    (candidate #>> '{}')::numeric = trunc((candidate #>> '{}')::numeric)
      and (candidate #>> '{}')::numeric between minimum and 9007199254740991
  end;
$$;

create function public.cms_jsonb_array_has_unique_field(candidate jsonb, field_name text)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select case when jsonb_typeof(candidate) <> 'array' then false else (
    select count(*) = count(distinct item.value -> field_name)
    from jsonb_array_elements(candidate) as item(value)
  ) end;
$$;

-- LinkHref = HttpsUrl | ExternalHttpUrl | InternalPath | Mailto | Tel (anchors only, never media).
-- ExternalHttpUrl is a case-insensitive "http://" prefix whose remainder satisfies the existing
-- credential-free HTTPS host/port/whitespace contract. The mailto local part excludes exactly the
-- ECMAScript \s set plus @ < > ( ).
create function public.cms_jsonb_is_link_href(candidate jsonb)
returns boolean language plpgsql immutable strict security invoker set search_path = '' as $$
declare
  value text;
begin
  if jsonb_typeof(candidate) <> 'string' then
    return false;
  end if;
  value := candidate #>> '{}';
  if public.cms_jsonb_is_credential_free_https_url(candidate) is true then
    return true;
  end if;
  if value collate "C" ~ '^[Hh][Tt][Tt][Pp]://' then
    return public.cms_jsonb_is_credential_free_https_url(to_jsonb('https://' || substr(value, 8))) is true;
  end if;
  return value collate "C" ~ '^/(?!/)[A-Za-z0-9._~%!$&''()*+,;=:@/-]*(\?[A-Za-z0-9._~%!$&''()*+,;=:@/?-]*)?(#[A-Za-z0-9_-]+)?$'
    or value collate "C" ~ '^mailto:[^\u0009-\u000D\u0020\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF@<>()]+@[A-Za-z0-9.-]+$'
    or value collate "C" ~ '^tel:\+?[0-9-]{3,20}$';
end;
$$;

-- LocalFilePath: committed public/files/legacy/... documents (import only).
create function public.cms_jsonb_is_local_file_path(candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select jsonb_typeof(candidate) = 'string'
    and (candidate #>> '{}') collate "C" ~ '^files/legacy/([a-z0-9._-]+/)*[a-z0-9][a-z0-9._-]*\.(pdf|docx?|xlsx?|pptx?)$'
    and not exists (
      select 1 from unnest(string_to_array(candidate #>> '{}', '/')) as segment(value)
      where segment.value in ('.', '..')
    );
$$;

create function public.cms_jsonb_is_youtube_id(candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select jsonb_typeof(candidate) = 'string'
    and (candidate #>> '{}') collate "C" ~ '^[A-Za-z0-9_-]{11}$';
$$;

-- Run = { text: RunText; strong?: true; href?: LinkHref }
create function public.cms_jsonb_is_content_runs(candidate jsonb)
returns boolean language plpgsql immutable strict security invoker set search_path = '' as $$
declare
  run jsonb;
begin
  if jsonb_typeof(candidate) <> 'array' then
    return false;
  end if;
  if jsonb_array_length(candidate) = 0 then
    return false;
  end if;
  for run in select value from jsonb_array_elements(candidate) loop
    if (
      not public.cms_jsonb_has_exact_keys(run, array['text'], array['strong', 'href'])
      or public.cms_jsonb_is_run_text(run -> 'text') is not true
      or (run ? 'strong' and run -> 'strong' is distinct from 'true'::jsonb)
      or (run ? 'href' and public.cms_jsonb_is_link_href(run -> 'href') is not true)
    ) is not false then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

-- Table rows and header: 1..50 cells; a cell is '' or single-line text of at most 1000 code units.
create function public.cms_jsonb_is_table_row(candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select case when jsonb_typeof(candidate) <> 'array' then false else
    jsonb_array_length(candidate) between 1 and 50
      and not exists (
        select 1 from jsonb_array_elements(candidate) as cell(value)
        where cell.value is distinct from '""'::jsonb
          and public.cms_jsonb_is_plain_text(cell.value, 1000, false) is not true
      )
  end;
$$;

create function public.cms_jsonb_is_content_block(candidate jsonb)
returns boolean language plpgsql immutable strict security invoker set search_path = '' as $$
declare
  item jsonb;
begin
  if jsonb_typeof(candidate) <> 'object' or jsonb_typeof(candidate -> 'type') is distinct from 'string' then
    return false;
  end if;
  case candidate ->> 'type'
    when 'paragraph' then
      return public.cms_jsonb_has_exact_keys(candidate, array['type', 'runs'], array[]::text[])
        and public.cms_jsonb_is_content_runs(candidate -> 'runs') is true;
    when 'heading' then
      return public.cms_jsonb_has_exact_keys(candidate, array['type', 'level', 'text'], array[]::text[])
        and (candidate -> 'level' = '2'::jsonb or candidate -> 'level' = '3'::jsonb)
        and public.cms_jsonb_is_plain_text(candidate -> 'text', 200, false) is true;
    when 'list' then
      if not public.cms_jsonb_has_exact_keys(candidate, array['type', 'ordered', 'items'], array[]::text[])
        or jsonb_typeof(candidate -> 'ordered') <> 'boolean'
        or jsonb_typeof(candidate -> 'items') <> 'array' then
        return false;
      end if;
      if jsonb_array_length(candidate -> 'items') = 0 then
        return false;
      end if;
      for item in select value from jsonb_array_elements(candidate -> 'items') loop
        if public.cms_jsonb_is_content_runs(item) is not true then
          return false;
        end if;
      end loop;
      return true;
    when 'image' then
      return (
        public.cms_jsonb_has_exact_keys(candidate, array['type', 'media', 'alt'], array['caption', 'width', 'height'])
        and public.cms_jsonb_is_published_media_reference(candidate -> 'media') is true
        and public.cms_jsonb_is_plain_text(candidate -> 'alt', 300, false) is true
        and (not (candidate ? 'caption') or public.cms_jsonb_is_plain_text(candidate -> 'caption', 300, false) is true)
        and (not (candidate ? 'width') or public.cms_jsonb_is_safe_integer(candidate -> 'width', 1) is true)
        and (not (candidate ? 'height') or public.cms_jsonb_is_safe_integer(candidate -> 'height', 1) is true)
      ) is true;
    when 'table' then
      if not public.cms_jsonb_has_exact_keys(candidate, array['type', 'rows'], array['header'])
        or (candidate ? 'header' and public.cms_jsonb_is_table_row(candidate -> 'header') is not true)
        or jsonb_typeof(candidate -> 'rows') <> 'array' then
        return false;
      end if;
      if jsonb_array_length(candidate -> 'rows') = 0 then
        return false;
      end if;
      for item in select value from jsonb_array_elements(candidate -> 'rows') loop
        if public.cms_jsonb_is_table_row(item) is not true then
          return false;
        end if;
      end loop;
      return true;
    when 'divider' then
      return public.cms_jsonb_has_exact_keys(candidate, array['type'], array[]::text[]);
    when 'video' then
      return public.cms_jsonb_has_exact_keys(candidate, array['type', 'youtubeId'], array[]::text[])
        and public.cms_jsonb_is_youtube_id(candidate -> 'youtubeId') is true;
    else
      return false;
  end case;
end;
$$;

create function public.cms_jsonb_is_content_block_array(candidate jsonb, minimum_blocks integer)
returns boolean language plpgsql immutable strict security invoker set search_path = '' as $$
declare
  block jsonb;
begin
  if jsonb_typeof(candidate) <> 'array' then
    return false;
  end if;
  if jsonb_array_length(candidate) not between minimum_blocks and 500 then
    return false;
  end if;
  for block in select value from jsonb_array_elements(candidate) loop
    if public.cms_jsonb_is_content_block(block) is not true then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

-- LocalizedBlocks = { zh: Block[0..500]; en?: Block[1..500] } (an attachment-only post has no zh blocks).
create function public.cms_jsonb_is_localized_blocks(candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select public.cms_jsonb_has_exact_keys(candidate, array['zh'], array['en'])
    and public.cms_jsonb_is_content_block_array(candidate -> 'zh', 0) is true
    and (not (candidate ? 'en') or public.cms_jsonb_is_content_block_array(candidate -> 'en', 1) is true);
$$;

create function public.cms_posts_payload_is_publishable(candidate jsonb)
returns boolean language plpgsql immutable strict security invoker set search_path = '' as $$
declare
  channel_by_category constant jsonb := '{
    "hospital-courses": "news", "recruitment": "news", "further-training": "news", "faculty": "news",
    "center-notices": "news", "trainee-notices": "news", "hospital-events": "news", "external-events": "news",
    "teaching-recognition": "honors", "competitions-awards": "honors", "publications-training": "honors",
    "faculty-certification": "honors", "center-about": "center", "center-events": "center"
  }'::jsonb;
  owner_ids constant text[] := array['department', 'faculty_dev', 'clinical_skills', 'ebm', 'holistic', 'med_edu_research', 'digital_materials'];
  program_ids constant text[] := array['residents', 'pgy', 'medical-students', 'allied-health-trainees', 'joint-training'];
  category jsonb;
  post jsonb;
  attachment jsonb;
begin
  if (
    not public.cms_jsonb_has_exact_keys(candidate, array['contentModel', 'categories', 'posts'], array[]::text[])
    or candidate -> 'contentModel' is distinct from '"localized-fields-v1"'::jsonb
    or public.cms_jsonb_array_has_exact_field_values(
      candidate -> 'categories', 'id', array(select jsonb_object_keys(channel_by_category))
    ) is not true
    or jsonb_typeof(candidate -> 'posts') is distinct from 'array'
  ) is not false then
    return false;
  end if;
  if jsonb_array_length(candidate -> 'posts') > 3000
    or public.cms_jsonb_array_has_unique_field(candidate -> 'posts', 'id') is not true then
    return false;
  end if;

  for category in select value from jsonb_array_elements(candidate -> 'categories') loop
    if (
      not public.cms_jsonb_has_exact_keys(category, array['id', 'channel', 'label', 'order'], array[]::text[])
      or jsonb_typeof(category -> 'id') <> 'string'
      or category -> 'channel' is distinct from channel_by_category -> (category ->> 'id')
      or public.cms_jsonb_is_localized_text(category -> 'label', 120) is not true
      or public.cms_jsonb_is_safe_integer(category -> 'order', 0) is not true
    ) is not false then
      return false;
    end if;
  end loop;

  for post in select value from jsonb_array_elements(candidate -> 'posts') loop
    if (
      not public.cms_jsonb_has_exact_keys(
        post,
        array['id', 'channel', 'categoryId', 'owner', 'publishedOn', 'pinned', 'title', 'body', 'attachments'],
        array['audiences', 'summary', 'cover']
      )
      or public.cms_jsonb_is_slug_id(post -> 'id') is not true
      or jsonb_typeof(post -> 'channel') <> 'string'
      or post ->> 'channel' <> all(array['news', 'honors', 'center'])
      or jsonb_typeof(post -> 'categoryId') <> 'string'
      or channel_by_category -> (post ->> 'categoryId') is distinct from post -> 'channel'
      or jsonb_typeof(post -> 'owner') <> 'string'
      or post ->> 'owner' <> all(owner_ids)
      or (post ->> 'channel' = 'center' and post ->> 'owner' = 'department')
      or public.cms_jsonb_is_iso_calendar_date(post -> 'publishedOn') is not true
      or jsonb_typeof(post -> 'pinned') <> 'boolean'
      or public.cms_jsonb_is_localized_text(post -> 'title', 200) is not true
      or (post ? 'summary' and public.cms_jsonb_is_localized_text(post -> 'summary', 500) is not true)
      or (post ? 'cover' and public.cms_jsonb_is_published_media_reference(post -> 'cover') is not true)
      or public.cms_jsonb_is_localized_blocks(post -> 'body') is not true
      or jsonb_typeof(post -> 'attachments') <> 'array'
    ) is not false then
      return false;
    end if;

    if post ? 'audiences' then
      if jsonb_typeof(post -> 'audiences') is distinct from 'array' then
        return false;
      end if;
      if exists (
          select 1 from jsonb_array_elements(post -> 'audiences') as audience(value)
          where jsonb_typeof(audience.value) <> 'string' or (audience.value #>> '{}') <> all(program_ids)
        )
        or (select count(*) <> count(distinct audience.value) from jsonb_array_elements(post -> 'audiences') as audience(value)) then
        return false;
      end if;
    end if;

    for attachment in select value from jsonb_array_elements(post -> 'attachments') loop
      if (
        not public.cms_jsonb_has_exact_keys(attachment, array['id', 'label', 'href'], array[]::text[])
        or public.cms_jsonb_is_slug_id(attachment -> 'id') is not true
        or public.cms_jsonb_is_localized_text(attachment -> 'label', 120) is not true
        or (
          public.cms_jsonb_is_link_href(attachment -> 'href') is not true
          and public.cms_jsonb_is_local_file_path(attachment -> 'href') is not true
        )
      ) is not false then
        return false;
      end if;
    end loop;
    if public.cms_jsonb_array_has_unique_field(post -> 'attachments', 'id') is not true then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

create function public.cms_department_info_payload_is_publishable(candidate jsonb)
returns boolean language plpgsql immutable strict security invoker set search_path = '' as $$
declare
  audience_ids constant text[] := array[
    'department', 'faculty_dev', 'clinical_skills', 'ebm', 'holistic', 'med_edu_research', 'digital_materials',
    'residents', 'pgy', 'medical-students', 'allied-health-trainees', 'joint-training'
  ];
  program_ids constant text[] := array['residents', 'pgy', 'medical-students', 'allied-health-trainees', 'joint-training'];
  page jsonb;
  program jsonb;
  link_group jsonb;
  link jsonb;
  download jsonb;
  download_item jsonb;
  reference_field text;
begin
  if (
    not public.cms_jsonb_has_exact_keys(
      candidate, array['contentModel', 'pages', 'programs', 'linkGroups', 'downloads'], array[]::text[]
    )
    or candidate -> 'contentModel' is distinct from '"localized-fields-v1"'::jsonb
    or public.cms_jsonb_array_has_unique_field(candidate -> 'pages', 'id') is not true
    or public.cms_jsonb_array_has_exact_field_values(candidate -> 'programs', 'id', program_ids) is not true
    or public.cms_jsonb_array_has_unique_field(candidate -> 'linkGroups', 'id') is not true
    or public.cms_jsonb_array_has_unique_field(candidate -> 'downloads', 'id') is not true
  ) is not false then
    return false;
  end if;

  for page in select value from jsonb_array_elements(candidate -> 'pages') loop
    if (
      not public.cms_jsonb_has_exact_keys(
        page,
        array['id', 'section', 'order', 'title', 'body'],
        array['owner', 'subtitle', 'summary', 'portrait', 'updatedOn']
      )
      or public.cms_jsonb_is_slug_id(page -> 'id') is not true
      or jsonb_typeof(page -> 'section') <> 'string'
      or page ->> 'section' <> all(array['about', 'committee', 'program', 'center'])
      or (page ? 'owner' and (jsonb_typeof(page -> 'owner') <> 'string' or page ->> 'owner' <> all(audience_ids)))
      or public.cms_jsonb_is_safe_integer(page -> 'order', 0) is not true
      or public.cms_jsonb_is_localized_text(page -> 'title', 200) is not true
      or (page ? 'subtitle' and public.cms_jsonb_is_localized_text(page -> 'subtitle', 200) is not true)
      or (page ? 'summary' and public.cms_jsonb_is_localized_text(page -> 'summary', 500) is not true)
      or (page ? 'portrait' and public.cms_jsonb_is_published_media_reference(page -> 'portrait') is not true)
      or public.cms_jsonb_is_localized_blocks(page -> 'body') is not true
      or (page ? 'updatedOn' and public.cms_jsonb_is_iso_calendar_date(page -> 'updatedOn') is not true)
    ) is not false then
      return false;
    end if;
  end loop;

  for program in select value from jsonb_array_elements(candidate -> 'programs') loop
    if (
      not public.cms_jsonb_has_exact_keys(
        program,
        array['id', 'order', 'title', 'summary'],
        array['cover', 'introPageId', 'outcomesPageId', 'schedulePageId']
      )
      or jsonb_typeof(program -> 'id') <> 'string'
      or public.cms_jsonb_is_safe_integer(program -> 'order', 0) is not true
      or public.cms_jsonb_is_localized_text(program -> 'title', 200) is not true
      or public.cms_jsonb_is_localized_text(program -> 'summary', 500) is not true
      or (program ? 'cover' and public.cms_jsonb_is_published_media_reference(program -> 'cover') is not true)
    ) is not false then
      return false;
    end if;
    foreach reference_field in array array['introPageId', 'outcomesPageId', 'schedulePageId'] loop
      if program ? reference_field and (
        public.cms_jsonb_is_slug_id(program -> reference_field) is not true
        or not exists (
          select 1 from jsonb_array_elements(candidate -> 'pages') as referenced(value)
          where referenced.value -> 'id' = program -> reference_field
            and referenced.value ->> 'section' = 'program'
            and referenced.value -> 'owner' = program -> 'id'
        )
      ) is not false then
        return false;
      end if;
    end loop;
  end loop;

  for link_group in select value from jsonb_array_elements(candidate -> 'linkGroups') loop
    if (
      not public.cms_jsonb_has_exact_keys(
        link_group, array['id', 'owner', 'purpose', 'order', 'title', 'links'], array[]::text[]
      )
      or public.cms_jsonb_is_slug_id(link_group -> 'id') is not true
      or jsonb_typeof(link_group -> 'owner') <> 'string'
      or link_group ->> 'owner' <> all(audience_ids)
      or jsonb_typeof(link_group -> 'purpose') <> 'string'
      or link_group ->> 'purpose' <> all(array['related', 'common', 'systems'])
      or public.cms_jsonb_is_safe_integer(link_group -> 'order', 0) is not true
      or public.cms_jsonb_is_localized_text(link_group -> 'title', 200) is not true
      or public.cms_jsonb_array_has_unique_field(link_group -> 'links', 'id') is not true
    ) is not false then
      return false;
    end if;
    for link in select value from jsonb_array_elements(link_group -> 'links') loop
      if (
        not public.cms_jsonb_has_exact_keys(link, array['id', 'label', 'href'], array['description'])
        or public.cms_jsonb_is_slug_id(link -> 'id') is not true
        or public.cms_jsonb_is_localized_text(link -> 'label', 120) is not true
        or (link ? 'description' and public.cms_jsonb_is_localized_text(link -> 'description', 500) is not true)
        or public.cms_jsonb_is_link_href(link -> 'href') is not true
      ) is not false then
        return false;
      end if;
    end loop;
  end loop;

  for download in select value from jsonb_array_elements(candidate -> 'downloads') loop
    if (
      not public.cms_jsonb_has_exact_keys(download, array['id', 'owner', 'title', 'items'], array[]::text[])
      or public.cms_jsonb_is_slug_id(download -> 'id') is not true
      or jsonb_typeof(download -> 'owner') <> 'string'
      or download ->> 'owner' <> all(audience_ids)
      or public.cms_jsonb_is_localized_text(download -> 'title', 200) is not true
      or public.cms_jsonb_array_has_unique_field(download -> 'items', 'id') is not true
    ) is not false then
      return false;
    end if;
    for download_item in select value from jsonb_array_elements(download -> 'items') loop
      if (
        not public.cms_jsonb_has_exact_keys(download_item, array['id', 'label', 'href'], array['publishedOn'])
        or public.cms_jsonb_is_slug_id(download_item -> 'id') is not true
        or public.cms_jsonb_is_localized_text(download_item -> 'label', 120) is not true
        or (
          public.cms_jsonb_is_link_href(download_item -> 'href') is not true
          and public.cms_jsonb_is_local_file_path(download_item -> 'href') is not true
        )
        or (download_item ? 'publishedOn' and public.cms_jsonb_is_iso_calendar_date(download_item -> 'publishedOn') is not true)
      ) is not false then
        return false;
      end if;
    end loop;
  end loop;
  return true;
end;
$$;

create function public.cms_gallery_payload_is_publishable(candidate jsonb)
returns boolean language plpgsql immutable strict security invoker set search_path = '' as $$
declare
  audience_ids constant text[] := array[
    'department', 'faculty_dev', 'clinical_skills', 'ebm', 'holistic', 'med_edu_research', 'digital_materials',
    'residents', 'pgy', 'medical-students', 'allied-health-trainees', 'joint-training'
  ];
  album jsonb;
  photo jsonb;
  video jsonb;
begin
  if (
    not public.cms_jsonb_has_exact_keys(candidate, array['contentModel', 'albums', 'videos'], array[]::text[])
    or candidate -> 'contentModel' is distinct from '"localized-fields-v1"'::jsonb
    or public.cms_jsonb_array_has_unique_field(candidate -> 'albums', 'id') is not true
    or public.cms_jsonb_array_has_unique_field(candidate -> 'videos', 'id') is not true
    or public.cms_jsonb_array_has_unique_field(candidate -> 'videos', 'youtubeId') is not true
  ) is not false then
    return false;
  end if;

  for album in select value from jsonb_array_elements(candidate -> 'albums') loop
    if (
      not public.cms_jsonb_has_exact_keys(album, array['id', 'owner', 'title', 'photos'], array['date', 'description', 'cover'])
      or public.cms_jsonb_is_slug_id(album -> 'id') is not true
      or jsonb_typeof(album -> 'owner') <> 'string'
      or album ->> 'owner' <> all(audience_ids)
      or public.cms_jsonb_is_localized_text(album -> 'title', 200) is not true
      or (album ? 'date' and public.cms_jsonb_is_iso_calendar_date(album -> 'date') is not true)
      or (album ? 'description' and public.cms_jsonb_is_localized_text(album -> 'description', 500) is not true)
      or (album ? 'cover' and public.cms_jsonb_is_published_media_reference(album -> 'cover') is not true)
      or public.cms_jsonb_array_has_unique_field(album -> 'photos', 'id') is not true
    ) is not false then
      return false;
    end if;
    if jsonb_array_length(album -> 'photos') not between 1 and 500 then
      return false;
    end if;
    for photo in select value from jsonb_array_elements(album -> 'photos') loop
      if (
        not public.cms_jsonb_has_exact_keys(photo, array['id', 'media'], array['alt', 'caption', 'width', 'height'])
        or public.cms_jsonb_is_slug_id(photo -> 'id') is not true
        or public.cms_jsonb_is_published_media_reference(photo -> 'media') is not true
        or (photo ? 'alt' and public.cms_jsonb_is_localized_text(photo -> 'alt', 300) is not true)
        or (photo ? 'caption' and public.cms_jsonb_is_localized_text(photo -> 'caption', 300) is not true)
        or (photo ? 'width' and public.cms_jsonb_is_safe_integer(photo -> 'width', 1) is not true)
        or (photo ? 'height' and public.cms_jsonb_is_safe_integer(photo -> 'height', 1) is not true)
      ) is not false then
        return false;
      end if;
    end loop;
  end loop;

  for video in select value from jsonb_array_elements(candidate -> 'videos') loop
    if (
      not public.cms_jsonb_has_exact_keys(video, array['id', 'owner', 'title', 'youtubeId'], array['publishedOn', 'description'])
      or public.cms_jsonb_is_slug_id(video -> 'id') is not true
      or jsonb_typeof(video -> 'owner') <> 'string'
      or video ->> 'owner' <> all(audience_ids)
      or public.cms_jsonb_is_localized_text(video -> 'title', 200) is not true
      or public.cms_jsonb_is_youtube_id(video -> 'youtubeId') is not true
      or (video ? 'publishedOn' and public.cms_jsonb_is_iso_calendar_date(video -> 'publishedOn') is not true)
      or (video ? 'description' and public.cms_jsonb_is_localized_text(video -> 'description', 500) is not true)
    ) is not false then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

create or replace function public.cms_payload_is_publishable(
  document_kind public.cms_document_kind,
  candidate jsonb
)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select (document_kind = any(array['centers', 'news', 'activities']::public.cms_document_kind[])
      or public.cms_wave5_global_payload_is_valid(document_kind, candidate) is true)
    and public.cms_wave5_page_payload_is_valid(document_kind, candidate) is true
    and (case document_kind
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
      when 'posts' then public.cms_posts_payload_is_publishable(candidate)
      when 'department_info' then public.cms_department_info_payload_is_publishable(candidate)
      when 'gallery' then public.cms_gallery_payload_is_publishable(candidate)
      else false
    end) is true;
$$;

-- Published rows keep the inline bilingual-envelope guard for the twelve {zh,en} kinds and accept the
-- localized-fields-v1 model for the archive kinds; the lifecycle trigger still binds every published
-- payload to its exact kind validator.
alter table public.cms_revisions
drop constraint cms_revisions_published_payload_check;

alter table public.cms_revisions
add constraint cms_revisions_published_payload_check
check ((
  status <> 'published'
  or (
    jsonb_typeof(payload) = 'object'
    and (
      (
        jsonb_typeof(payload -> 'zh') = 'object'
        and jsonb_typeof(payload -> 'en') = 'object'
        and payload -> 'zh' <> '{}'::jsonb
        and payload -> 'en' <> '{}'::jsonb
      )
      or payload -> 'contentModel' = '"localized-fields-v1"'::jsonb
    )
  )
) is true);

alter function public.cms_jsonb_is_text_value(jsonb, integer, boolean, boolean) owner to postgres;
alter function public.cms_jsonb_is_plain_text(jsonb, integer, boolean) owner to postgres;
alter function public.cms_jsonb_is_run_text(jsonb) owner to postgres;
alter function public.cms_jsonb_is_localized_text(jsonb, integer) owner to postgres;
alter function public.cms_jsonb_is_slug_id(jsonb) owner to postgres;
alter function public.cms_jsonb_is_iso_calendar_date(jsonb) owner to postgres;
alter function public.cms_jsonb_is_safe_integer(jsonb, numeric) owner to postgres;
alter function public.cms_jsonb_array_has_unique_field(jsonb, text) owner to postgres;
alter function public.cms_jsonb_is_link_href(jsonb) owner to postgres;
alter function public.cms_jsonb_is_local_file_path(jsonb) owner to postgres;
alter function public.cms_jsonb_is_youtube_id(jsonb) owner to postgres;
alter function public.cms_jsonb_is_content_runs(jsonb) owner to postgres;
alter function public.cms_jsonb_is_table_row(jsonb) owner to postgres;
alter function public.cms_jsonb_is_content_block(jsonb) owner to postgres;
alter function public.cms_jsonb_is_content_block_array(jsonb, integer) owner to postgres;
alter function public.cms_jsonb_is_localized_blocks(jsonb) owner to postgres;
alter function public.cms_posts_payload_is_publishable(jsonb) owner to postgres;
alter function public.cms_department_info_payload_is_publishable(jsonb) owner to postgres;
alter function public.cms_gallery_payload_is_publishable(jsonb) owner to postgres;
alter function public.cms_payload_is_publishable(public.cms_document_kind, jsonb) owner to postgres;

revoke all on function
  public.cms_jsonb_is_text_value(jsonb, integer, boolean, boolean),
  public.cms_jsonb_is_plain_text(jsonb, integer, boolean),
  public.cms_jsonb_is_run_text(jsonb),
  public.cms_jsonb_is_localized_text(jsonb, integer),
  public.cms_jsonb_is_slug_id(jsonb),
  public.cms_jsonb_is_iso_calendar_date(jsonb),
  public.cms_jsonb_is_safe_integer(jsonb, numeric),
  public.cms_jsonb_array_has_unique_field(jsonb, text),
  public.cms_jsonb_is_link_href(jsonb),
  public.cms_jsonb_is_local_file_path(jsonb),
  public.cms_jsonb_is_youtube_id(jsonb),
  public.cms_jsonb_is_content_runs(jsonb),
  public.cms_jsonb_is_table_row(jsonb),
  public.cms_jsonb_is_content_block(jsonb),
  public.cms_jsonb_is_content_block_array(jsonb, integer),
  public.cms_jsonb_is_localized_blocks(jsonb),
  public.cms_posts_payload_is_publishable(jsonb),
  public.cms_department_info_payload_is_publishable(jsonb),
  public.cms_gallery_payload_is_publishable(jsonb),
  public.cms_payload_is_publishable(public.cms_document_kind, jsonb)
from public, anon, authenticated;

comment on function public.cms_jsonb_is_text_value(jsonb, integer, boolean, boolean) is
  'Internal localized-fields-v1 text rule: non-empty string, UTF-16 length cap, no C0/DEL controls except TAB and (multiline) LF, and optionally no ASCII edge whitespace or blank text.';
comment on function public.cms_jsonb_is_plain_text(jsonb, integer, boolean) is
  'Internal trimmed localized-fields-v1 text for titles, labels, summaries, alt text, captions, headings, and table cells.';
comment on function public.cms_jsonb_is_run_text(jsonb) is
  'Internal multiline, untrimmed rich-text run text of at most 10000 UTF-16 code units.';
comment on function public.cms_jsonb_is_localized_text(jsonb, integer) is
  'Internal localized-fields-v1 text: required zh, optional en that is never empty.';
comment on function public.cms_jsonb_is_slug_id(jsonb) is
  'Internal archive identifier rule: lowercase ASCII kebab-case slug of 1-80 characters.';
comment on function public.cms_jsonb_is_iso_calendar_date(jsonb) is
  'Internal YYYY-MM-DD calendar-date predicate matching the TypeScript ISO date contract.';
comment on function public.cms_jsonb_is_safe_integer(jsonb, numeric) is
  'Internal JavaScript safe-integer predicate with an inclusive lower bound.';
comment on function public.cms_jsonb_array_has_unique_field(jsonb, text) is
  'Internal predicate requiring an array whose items carry pairwise-distinct values for one field.';
comment on function public.cms_jsonb_is_link_href(jsonb) is
  'Internal anchor href predicate: credential-free HTTPS or HTTP, single-slash internal path, mailto, or tel.';
comment on function public.cms_jsonb_is_local_file_path(jsonb) is
  'Internal predicate for committed files/legacy document paths without dot segments.';
comment on function public.cms_jsonb_is_youtube_id(jsonb) is
  'Internal predicate for an 11-character YouTube video identifier.';
comment on function public.cms_jsonb_is_content_runs(jsonb) is
  'Internal predicate for a non-empty array of rich-text runs with optional strong and link marks.';
comment on function public.cms_jsonb_is_table_row(jsonb) is
  'Internal predicate for a 1-50 cell table row of empty or single-line text cells.';
comment on function public.cms_jsonb_is_content_block(jsonb) is
  'Internal renderer-safe content block predicate for paragraph, heading, list, image, table, divider, and video blocks.';
comment on function public.cms_jsonb_is_content_block_array(jsonb, integer) is
  'Internal predicate for one locale of at most 500 renderer-safe content blocks with a caller-supplied minimum.';
comment on function public.cms_jsonb_is_localized_blocks(jsonb) is
  'Internal localized-fields-v1 block body: required zh blocks (possibly none) and optional non-empty en blocks.';
comment on function public.cms_posts_payload_is_publishable(jsonb) is
  'Internal posts archive publication validator: canonical categories and channels, owners, audiences, unique ids, blocks, and attachments.';
comment on function public.cms_department_info_payload_is_publishable(jsonb) is
  'Internal department_info publication validator: pages, the five canonical programs and their page references, link groups, and downloads.';
comment on function public.cms_gallery_payload_is_publishable(jsonb) is
  'Internal gallery publication validator: albums with 1-500 published photos and unique YouTube videos.';
comment on function public.cms_payload_is_publishable(public.cms_document_kind, jsonb) is
  'Fail-closed exhaustive publication validator binding a CMS document kind to its current payload shape.';

notify pgrst, 'reload schema';
commit;
