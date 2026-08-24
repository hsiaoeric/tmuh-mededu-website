create or replace function public.cms_payload_is_publishable(candidate jsonb)
returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select jsonb_typeof(candidate) = 'object'
    and jsonb_typeof(candidate -> 'zh') = 'object'
    and jsonb_typeof(candidate -> 'en') = 'object'
    and candidate -> 'zh' <> '{}'::jsonb
    and candidate -> 'en' <> '{}'::jsonb;
$$;

create function public.cms_jsonb_has_exact_keys(
  candidate jsonb,
  required_keys text[],
  optional_keys text[]
)
returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select case when jsonb_typeof(candidate) <> 'object' then false else
    candidate ?& required_keys
      and not exists (
        select 1
        from jsonb_object_keys(candidate) as present(key)
        where not (present.key = any(required_keys || optional_keys))
      )
  end;
$$;

create function public.cms_jsonb_is_text_array(candidate jsonb)
returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select case
    when jsonb_typeof(candidate) <> 'array' then false
    else not exists (
      select 1 from jsonb_array_elements(candidate) as item(value)
      where jsonb_typeof(item.value) <> 'string'
    )
  end;
$$;

create function public.cms_jsonb_is_hex_color(candidate jsonb)
returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select jsonb_typeof(candidate) = 'string'
    and candidate #>> '{}' ~ '^#[0-9A-Fa-f]{6}$';
$$;

create function public.cms_jsonb_is_https_url(candidate jsonb)
returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select jsonb_typeof(candidate) = 'string'
    and candidate #>> '{}' = btrim(candidate #>> '{}')
    and candidate #>> '{}' ~ '^https://[^[:space:]]+$';
$$;

create function public.cms_jsonb_is_published_media_reference(candidate jsonb)
returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select case candidate ->> 'kind'
    when 'local' then
      public.cms_jsonb_has_exact_keys(candidate, array['kind', 'path'], array[]::text[])
      and jsonb_typeof(candidate -> 'path') = 'string'
      and candidate ->> 'path' ~* '^assets/([A-Za-z0-9._-]+/)*[A-Za-z0-9][A-Za-z0-9._-]*\.(jpe?g|png|webp)$'
      and not exists (
        select 1 from unnest(string_to_array(candidate ->> 'path', '/')) as segment(value)
        where segment.value in ('.', '..')
      )
    when 'public' then
      public.cms_jsonb_has_exact_keys(candidate, array['kind', 'bucket', 'path'], array[]::text[])
      and candidate ->> 'bucket' = 'public-media'
      and jsonb_typeof(candidate -> 'path') = 'string'
      and candidate ->> 'path' ~ '^[0-9a-f]{64}/[A-Za-z0-9][A-Za-z0-9._-]*\.([Jj][Pp][Ee]?[Gg]|[Pp][Nn][Gg]|[Ww][Ee][Bb][Pp])$'
    else false
  end;
$$;

create function public.cms_jsonb_is_person(candidate jsonb)
returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select case when jsonb_typeof(candidate) <> 'object' then false else
    public.cms_jsonb_has_exact_keys(
      candidate,
      array['name', 'alternateName', 'roleKey', 'role', 'department', 'slug', 'hubId', 'duty', 'ext', 'email'],
      array['portrait']
    )
    and not exists (
      select 1 from jsonb_each(candidate - 'portrait') as field(key, value)
      where jsonb_typeof(field.value) <> 'string'
    )
    and (
      not candidate ? 'portrait'
      or public.cms_jsonb_is_published_media_reference(candidate -> 'portrait')
    )
  end;
$$;

create function public.cms_jsonb_is_kpi(candidate jsonb)
returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select case when jsonb_typeof(candidate) <> 'object' then false else
    public.cms_jsonb_has_exact_keys(
      candidate,
      array['num', 'suffix', 'label', 'en', 'color', 'delay'],
      array[]::text[]
    )
    and jsonb_typeof(candidate -> 'num') = 'number'
    and jsonb_typeof(candidate -> 'suffix') = 'string'
    and jsonb_typeof(candidate -> 'label') = 'string'
    and jsonb_typeof(candidate -> 'en') = 'string'
    and public.cms_jsonb_is_hex_color(candidate -> 'color')
    and jsonb_typeof(candidate -> 'delay') = 'number'
  end;
$$;

create function public.cms_site_copy_payload_is_publishable(candidate jsonb)
returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select public.cms_jsonb_has_exact_keys(candidate, array['zh', 'en'], array[]::text[])
    and (
      select bool_and(
        public.cms_jsonb_has_exact_keys(locale.value, array['strings', 'inline'], array[]::text[])
        and public.cms_jsonb_has_exact_keys(locale.value -> 'strings', array[
          'aiBody', 'aiTitle', 'backDept', 'brand1', 'brand2', 'chipCenters', 'chipSeed',
          'comingSoon', 'contactTitle', 'ctaOrg', 'dept', 'deptShort', 'eventsDesc', 'eventsEn',
          'eventsZh', 'footAddr', 'footBrand', 'footBrandEn', 'footNote', 'footTel', 'formingTeam',
          'hAboutBody', 'hAboutTitle', 'hContactExt', 'hContactPerson', 'hContactPlace',
          'hContactQuote', 'hCtaMhfa', 'hHeroTag', 'hHeroTitle', 'heroEyebrow', 'heroTag',
          'heroTitle1', 'heroTitle2', 'hospital', 'instructorsTitle', 'kpiEyebrow', 'kpiTitle',
          'langBtn', 'layoutHub', 'layoutTree', 'members', 'mhfaIntro', 'mhfaTitle', 'navAbout',
          'navContact', 'navHolistic', 'navMhfa', 'navNews', 'navOrg', 'navSeed', 'newsDesc',
          'newsEn', 'newsZh', 'orgDesc', 'orgTitle', 'seedDesc', 'seedTitle'
        ], array[]::text[])
        and not exists (
          select 1 from jsonb_each(case when jsonb_typeof(locale.value -> 'strings') = 'object' then locale.value -> 'strings' else '{}'::jsonb end) as field(key, value)
          where jsonb_typeof(field.value) <> 'string'
        )
        and public.cms_jsonb_has_exact_keys(
          locale.value -> 'inline',
          array['skipToContent', 'holisticAdministrativeTeam', 'holisticResearchTeam', 'holisticClosingTitle'],
          array[]::text[]
        )
        and not exists (
          select 1 from jsonb_each(case when jsonb_typeof(locale.value -> 'inline') = 'object' then locale.value -> 'inline' else '{}'::jsonb end) as field(key, value)
          where jsonb_typeof(field.value) <> 'string'
        )
      )
      from jsonb_array_elements(jsonb_build_array(candidate -> 'zh', candidate -> 'en')) as locale(value)
    );
$$;

create function public.cms_centers_payload_is_publishable(candidate jsonb)
returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select public.cms_jsonb_has_exact_keys(candidate, array['zh', 'en'], array[]::text[])
    and (
      select bool_and(
        public.cms_jsonb_has_exact_keys(locale.value, array['centers'], array[]::text[])
        and case when jsonb_typeof(locale.value -> 'centers') <> 'array' then false else
          not exists (
            select 1
            from jsonb_array_elements(locale.value -> 'centers') as center(value)
            where not (
              public.cms_jsonb_has_exact_keys(
                center.value,
                array['id', 'name', 'color', 'intro', 'contact', 'ext', 'branches'],
                array['externalUrl', 'deep']
              )
              and jsonb_typeof(center.value -> 'id') = 'string'
              and jsonb_typeof(center.value -> 'name') = 'string'
              and public.cms_jsonb_is_hex_color(center.value -> 'color')
              and jsonb_typeof(center.value -> 'intro') = 'string'
              and jsonb_typeof(center.value -> 'contact') = 'string'
              and jsonb_typeof(center.value -> 'ext') = 'string'
              and (not center.value ? 'externalUrl' or public.cms_jsonb_is_https_url(center.value -> 'externalUrl'))
              and (not center.value ? 'deep' or jsonb_typeof(center.value -> 'deep') = 'boolean')
              and case when jsonb_typeof(center.value -> 'branches') <> 'array' then false else
                not exists (
                  select 1 from jsonb_array_elements(center.value -> 'branches') as branch(value)
                  where not (
                    public.cms_jsonb_has_exact_keys(
                      branch.value,
                      array['id', 'name', 'description', 'icon', 'panelSection'],
                      array['pageSection']
                    )
                    and not exists (
                      select 1 from jsonb_each(case when jsonb_typeof(branch.value) = 'object' then branch.value else '{}'::jsonb end) as field(key, value)
                      where jsonb_typeof(field.value) <> 'string'
                    )
                  )
                )
                and (select count(*) = count(distinct branch.value ->> 'id') from jsonb_array_elements(center.value -> 'branches') as branch(value))
              end
            )
          )
          and (select count(*) = count(distinct center.value ->> 'id') from jsonb_array_elements(locale.value -> 'centers') as center(value))
        end
      )
      from jsonb_array_elements(jsonb_build_array(candidate -> 'zh', candidate -> 'en')) as locale(value)
    )
    and case
      when jsonb_typeof(candidate #> '{zh,centers}') <> 'array'
        or jsonb_typeof(candidate #> '{en,centers}') <> 'array' then false
      else
        (select jsonb_agg(center.value -> 'id' order by center.ordinality) from jsonb_array_elements(candidate #> '{zh,centers}') with ordinality as center(value, ordinality))
          is not distinct from
        (select jsonb_agg(center.value -> 'id' order by center.ordinality) from jsonb_array_elements(candidate #> '{en,centers}') with ordinality as center(value, ordinality))
        and not exists (
          select 1
          from jsonb_array_elements(candidate #> '{zh,centers}') with ordinality as zh_center(value, ordinality)
          join jsonb_array_elements(candidate #> '{en,centers}') with ordinality as en_center(value, ordinality) using (ordinality)
          where (select jsonb_agg(branch.value -> 'id' order by branch.ordinality) from jsonb_array_elements(case when jsonb_typeof(zh_center.value -> 'branches') = 'array' then zh_center.value -> 'branches' else '[]'::jsonb end) with ordinality as branch(value, ordinality))
            is distinct from
            (select jsonb_agg(branch.value -> 'id' order by branch.ordinality) from jsonb_array_elements(case when jsonb_typeof(en_center.value -> 'branches') = 'array' then en_center.value -> 'branches' else '[]'::jsonb end) with ordinality as branch(value, ordinality))
        )
    end;
$$;

create function public.cms_people_payload_is_publishable(candidate jsonb)
returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select public.cms_jsonb_has_exact_keys(candidate, array['zh', 'en'], array[]::text[])
    and (
      select bool_and(
        public.cms_jsonb_has_exact_keys(
          locale.value,
          array['centerPeople', 'holisticInstructors', 'holisticSeedTeachers', 'holisticAiTeam'],
          array[]::text[]
        )
        and not exists (
          select 1
          from jsonb_each(case when jsonb_typeof(locale.value) = 'object' then locale.value else '{}'::jsonb end) as collection(key, value)
          where case when jsonb_typeof(collection.value) <> 'array' then true else
            exists (
              select 1 from jsonb_array_elements(collection.value) as item(value)
              where case when collection.key = 'centerPeople' then not (
                public.cms_jsonb_has_exact_keys(item.value, array['centerId', 'people'], array[]::text[])
                and jsonb_typeof(item.value -> 'centerId') = 'string'
                and case when jsonb_typeof(item.value -> 'people') <> 'array' then false else
                  not exists (
                    select 1 from jsonb_array_elements(item.value -> 'people') as person(value)
                    where not public.cms_jsonb_is_person(person.value)
                  )
                end
              ) else not public.cms_jsonb_is_person(item.value) end
            )
          end
        )
        and case when jsonb_typeof(locale.value -> 'centerPeople') <> 'array' then false else
          (select count(*) = count(distinct group_item.value ->> 'centerId') from jsonb_array_elements(locale.value -> 'centerPeople') as group_item(value))
        end
      )
      from jsonb_array_elements(jsonb_build_array(candidate -> 'zh', candidate -> 'en')) as locale(value)
    )
    and case
      when jsonb_typeof(candidate #> '{zh,centerPeople}') <> 'array'
        or jsonb_typeof(candidate #> '{en,centerPeople}') <> 'array' then false
      else
        (select jsonb_agg(group_item.value -> 'centerId' order by group_item.ordinality) from jsonb_array_elements(candidate #> '{zh,centerPeople}') with ordinality as group_item(value, ordinality))
          is not distinct from
        (select jsonb_agg(group_item.value -> 'centerId' order by group_item.ordinality) from jsonb_array_elements(candidate #> '{en,centerPeople}') with ordinality as group_item(value, ordinality))
    end;
$$;

create function public.cms_news_payload_is_publishable(candidate jsonb)
returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select public.cms_jsonb_has_exact_keys(candidate, array['zh', 'en'], array[]::text[])
    and (
      select bool_and(
        public.cms_jsonb_has_exact_keys(locale.value, array['department', 'holistic', 'categories', 'latestUpdate'], array[]::text[])
        and jsonb_typeof(locale.value -> 'latestUpdate') = 'string'
        and not exists (
          select 1
          from (values ('department'), ('holistic')) as scope(name)
          where case when jsonb_typeof(locale.value -> scope.name) <> 'array' then true else
            exists (
              select 1 from jsonb_array_elements(locale.value -> scope.name) as announcement(value)
              where not (
                public.cms_jsonb_has_exact_keys(
                  announcement.value,
                  array['category', 'categoryLabel', 'pinned', 'tag', 'date', 'title', 'lines', 'tagColor', 'tagBg', 'statFont', 'delay'],
                  array['statTop', 'statTopLabel', 'statBot', 'statBotLabel']
                )
                and jsonb_typeof(announcement.value -> 'category') = 'string'
                and jsonb_typeof(announcement.value -> 'categoryLabel') = 'string'
                and jsonb_typeof(announcement.value -> 'pinned') = 'boolean'
                and jsonb_typeof(announcement.value -> 'tag') = 'string'
                and jsonb_typeof(announcement.value -> 'date') = 'string'
                and jsonb_typeof(announcement.value -> 'title') = 'string'
                and public.cms_jsonb_is_text_array(announcement.value -> 'lines')
                and public.cms_jsonb_is_hex_color(announcement.value -> 'tagColor')
                and jsonb_typeof(announcement.value -> 'tagBg') = 'string'
                and jsonb_typeof(announcement.value -> 'statFont') = 'string'
                and jsonb_typeof(announcement.value -> 'delay') = 'number'
                and not exists (
                  select 1 from jsonb_each(case when jsonb_typeof(announcement.value) = 'object' then announcement.value else '{}'::jsonb end) as field(key, value)
                  where field.key = any(array['statTop', 'statTopLabel', 'statBot', 'statBotLabel'])
                    and jsonb_typeof(field.value) <> 'string'
                )
              )
            )
          end
        )
        and public.cms_jsonb_has_exact_keys(locale.value -> 'categories', array['department', 'holistic'], array[]::text[])
        and not exists (
          select 1
          from (values ('department'), ('holistic')) as scope(name)
          where case when jsonb_typeof(locale.value #> array['categories', scope.name]) <> 'array' then true else
            exists (
              select 1 from jsonb_array_elements(locale.value #> array['categories', scope.name]) as category(value)
              where not (
                public.cms_jsonb_has_exact_keys(category.value, array['id', 'label'], array[]::text[])
                and jsonb_typeof(category.value -> 'id') = 'string'
                and jsonb_typeof(category.value -> 'label') = 'string'
              )
            )
            or (select count(*) <> count(distinct category.value ->> 'id') from jsonb_array_elements(locale.value #> array['categories', scope.name]) as category(value))
          end
        )
      )
      from jsonb_array_elements(jsonb_build_array(candidate -> 'zh', candidate -> 'en')) as locale(value)
    )
    and not exists (
      select 1 from (values ('department'), ('holistic')) as scope(name)
      where case
        when jsonb_typeof(candidate #> array['zh', 'categories', scope.name]) <> 'array'
          or jsonb_typeof(candidate #> array['en', 'categories', scope.name]) <> 'array' then true
        else
          (select jsonb_agg(category.value -> 'id' order by category.ordinality) from jsonb_array_elements(candidate #> array['zh', 'categories', scope.name]) with ordinality as category(value, ordinality))
            is distinct from
          (select jsonb_agg(category.value -> 'id' order by category.ordinality) from jsonb_array_elements(candidate #> array['en', 'categories', scope.name]) with ordinality as category(value, ordinality))
      end
    );
$$;

create function public.cms_activities_payload_is_publishable(candidate jsonb)
returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select public.cms_jsonb_has_exact_keys(candidate, array['zh', 'en'], array[]::text[])
    and (
      select bool_and(
        public.cms_jsonb_has_exact_keys(locale.value, array['department', 'holistic'], array[]::text[])
        and not exists (
          select 1 from jsonb_each(case when jsonb_typeof(locale.value) = 'object' then locale.value else '{}'::jsonb end) as collection(key, value)
          where case when jsonb_typeof(collection.value) <> 'array' then true else
            exists (
              select 1 from jsonb_array_elements(collection.value) as activity(value)
              where not (
                public.cms_jsonb_has_exact_keys(
                  activity.value,
                  array['cat', 'date', 'enrolled', 'link', 'place', 'speaker', 'status', 'title', 'topic'],
                  array[]::text[]
                )
                and not exists (
                  select 1 from jsonb_each(case when jsonb_typeof(activity.value) = 'object' then activity.value else '{}'::jsonb end) as field(key, value)
                  where jsonb_typeof(field.value) <> 'string'
                )
                and (activity.value ->> 'link' = '' or public.cms_jsonb_is_https_url(activity.value -> 'link'))
              )
            )
          end
        )
      )
      from jsonb_array_elements(jsonb_build_array(candidate -> 'zh', candidate -> 'en')) as locale(value)
    );
$$;

create function public.cms_kpis_payload_is_publishable(candidate jsonb)
returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select public.cms_jsonb_has_exact_keys(candidate, array['zh', 'en'], array[]::text[])
    and (
      select bool_and(
        public.cms_jsonb_has_exact_keys(locale.value, array['items'], array[]::text[])
        and case when jsonb_typeof(locale.value -> 'items') <> 'array' then false else
          not exists (
            select 1 from jsonb_array_elements(locale.value -> 'items') as item(value)
            where not public.cms_jsonb_is_kpi(item.value)
          )
        end
      )
      from jsonb_array_elements(jsonb_build_array(candidate -> 'zh', candidate -> 'en')) as locale(value)
    );
$$;

create function public.cms_honors_payload_is_publishable(candidate jsonb)
returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select public.cms_jsonb_has_exact_keys(candidate, array['zh', 'en'], array[]::text[])
    and (
      select bool_and(
        public.cms_jsonb_has_exact_keys(locale.value, array[
          'colPerson', 'colRole', 'colUnit', 'dataSource', 'desc', 'eyebrow', 'nhqa',
          'nhqaEbmLink', 'nhqaTitle', 'renewalLabel', 'snqProjects', 'snqTitle',
          'snqYearCounts', 'title'
        ], array[]::text[])
        and not exists (
          select 1 from jsonb_each(case when jsonb_typeof(locale.value) = 'object' then locale.value - array['nhqa', 'snqProjects', 'snqYearCounts'] else '{}'::jsonb end) as field(key, value)
          where jsonb_typeof(field.value) <> 'string'
        )
        and public.cms_jsonb_has_exact_keys(locale.value -> 'nhqa', array[
          'awardNote', 'domain', 'event', 'group', 'keywords', 'leads', 'project', 'year'
        ], array[]::text[])
        and not exists (
          select 1 from jsonb_each(case when jsonb_typeof(locale.value -> 'nhqa') = 'object' then locale.value -> 'nhqa' else '{}'::jsonb end) as field(key, value)
          where case when field.key in ('keywords', 'leads') then not public.cms_jsonb_is_text_array(field.value)
            else jsonb_typeof(field.value) <> 'string' end
        )
        and case when jsonb_typeof(locale.value -> 'snqProjects') <> 'array' then false else
          not exists (
            select 1 from jsonb_array_elements(locale.value -> 'snqProjects') as project(value)
            where not (
              public.cms_jsonb_has_exact_keys(project.value, array['badgeLabel', 'certYear', 'members', 'renewal', 'title'], array[]::text[])
              and not exists (
                select 1 from jsonb_each(case when jsonb_typeof(project.value) = 'object' then project.value - 'members' else '{}'::jsonb end) as field(key, value)
                where jsonb_typeof(field.value) <> 'string'
              )
              and case when jsonb_typeof(project.value -> 'members') <> 'array' then false else
                not exists (
                  select 1 from jsonb_array_elements(project.value -> 'members') as member(value)
                  where not (
                    public.cms_jsonb_has_exact_keys(member.value, array['person', 'role', 'unit'], array[]::text[])
                    and not exists (select 1 from jsonb_each(case when jsonb_typeof(member.value) = 'object' then member.value else '{}'::jsonb end) as field(key, value) where jsonb_typeof(field.value) <> 'string')
                  )
                )
              end
            )
          )
        end
        and case when jsonb_typeof(locale.value -> 'snqYearCounts') <> 'array' then false else
          not exists (
            select 1 from jsonb_array_elements(locale.value -> 'snqYearCounts') as year_count(value)
            where not (
              public.cms_jsonb_has_exact_keys(year_count.value, array['count', 'year'], array[]::text[])
              and jsonb_typeof(year_count.value -> 'count') = 'number'
              and jsonb_typeof(year_count.value -> 'year') = 'string'
            )
          )
        end
      )
      from jsonb_array_elements(jsonb_build_array(candidate -> 'zh', candidate -> 'en')) as locale(value)
    );
$$;

create function public.cms_digital_materials_payload_is_publishable(candidate jsonb)
returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select public.cms_jsonb_has_exact_keys(candidate, array['zh', 'en'], array[]::text[])
    and (
      select bool_and(
        public.cms_jsonb_has_exact_keys(locale.value, array['eyebrow', 'title', 'status', 'body', 'backLabel'], array[]::text[])
        and not exists (
          select 1 from jsonb_each(case when jsonb_typeof(locale.value) = 'object' then locale.value else '{}'::jsonb end) as field(key, value)
          where jsonb_typeof(field.value) <> 'string'
        )
      )
      from jsonb_array_elements(jsonb_build_array(candidate -> 'zh', candidate -> 'en')) as locale(value)
    );
$$;

create function public.cms_facdev_payload_is_publishable(candidate jsonb)
returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select public.cms_jsonb_has_exact_keys(candidate, array['zh', 'en'], array[]::text[])
    and (
      select bool_and(
        public.cms_jsonb_has_exact_keys(locale.value, array[
          'aboutBody', 'aboutBody2', 'aboutEyebrow', 'aboutTitle', 'actEyebrow', 'actTitle',
          'closingBody', 'closingTitle', 'colors', 'contactExt', 'contactPerson', 'contactPlace',
          'contactQuote', 'eyebrow', 'groupLeadLabel', 'groupRoot', 'groups', 'groupsDesc',
          'groupsEyebrow', 'groupsTitle', 'heroTag', 'heroTitle', 'kpis', 'membersTitle',
          'newsEyebrow', 'newsTitle', 'reservedNote', 'reservedTag', 'services', 'servicesDesc',
          'servicesEyebrow', 'servicesTitle'
        ], array[]::text[])
        and not exists (
          select 1 from jsonb_each(case when jsonb_typeof(locale.value) = 'object' then locale.value - array['colors', 'groups', 'kpis', 'services'] else '{}'::jsonb end) as field(key, value)
          where jsonb_typeof(field.value) <> 'string'
        )
        and public.cms_jsonb_has_exact_keys(locale.value -> 'colors', array['blue', 'clay', 'claySoft', 'ink', 'ochre', 'sage'], array[]::text[])
        and not exists (
          select 1 from jsonb_each(case when jsonb_typeof(locale.value -> 'colors') = 'object' then locale.value -> 'colors' else '{}'::jsonb end) as color(key, value)
          where not public.cms_jsonb_is_hex_color(color.value)
        )
        and case when jsonb_typeof(locale.value -> 'groups') <> 'array' then false else
          not exists (
            select 1 from jsonb_array_elements(locale.value -> 'groups') as group_item(value)
            where not (
              public.cms_jsonb_has_exact_keys(group_item.value, array['desc', 'lead', 'name', 'tone'], array[]::text[])
              and jsonb_typeof(group_item.value -> 'desc') = 'string'
              and public.cms_jsonb_is_person(group_item.value -> 'lead')
              and jsonb_typeof(group_item.value -> 'name') = 'string'
              and public.cms_jsonb_is_hex_color(group_item.value -> 'tone')
            )
          )
        end
        and case when jsonb_typeof(locale.value -> 'kpis') <> 'array' then false else
          not exists (select 1 from jsonb_array_elements(locale.value -> 'kpis') as kpi(value) where not public.cms_jsonb_is_kpi(kpi.value))
        end
        and case when jsonb_typeof(locale.value -> 'services') <> 'array' then false else
          not exists (
            select 1 from jsonb_array_elements(locale.value -> 'services') as service(value)
            where not (
              public.cms_jsonb_has_exact_keys(service.value, array['desc', 'icon', 'title', 'tone'], array[]::text[])
              and jsonb_typeof(service.value -> 'desc') = 'string'
              and jsonb_typeof(service.value -> 'icon') = 'string'
              and jsonb_typeof(service.value -> 'title') = 'string'
              and public.cms_jsonb_is_hex_color(service.value -> 'tone')
            )
          )
        end
      )
      from jsonb_array_elements(jsonb_build_array(candidate -> 'zh', candidate -> 'en')) as locale(value)
    );
$$;

create function public.cms_ebm_payload_is_publishable(candidate jsonb)
returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select public.cms_jsonb_has_exact_keys(candidate, array['zh', 'en'], array[]::text[])
    and (
      select bool_and(
        public.cms_jsonb_has_exact_keys(locale.value, array[
          'colors', 'eyebrow', 'heroTitle', 'heroTag', 'aboutEyebrow', 'aboutTitle', 'aboutBody',
          'aboutBody2', 'membersTitle', 'missionsEyebrow', 'missionsTitle', 'missionsDesc',
          'awardsEyebrow', 'awardsTitle', 'awardsDesc', 'awardsLitTitle', 'awardsClinTitle',
          'awardsTransTitle', 'colSession', 'colAward', 'journeyEyebrow', 'journeyTitle',
          'journeyDesc', 'coursesEyebrow', 'coursesTitle', 'coursesDesc', 'closingTitle',
          'closingBody', 'contactPerson', 'contactExt', 'contactPlace', 'contactQuote', 'kpis',
          'missions', 'awardsLit', 'awardsClin', 'awardsTrans', 'stages', 'courseGroups'
        ], array[]::text[])
        and not exists (
          select 1 from jsonb_each(case when jsonb_typeof(locale.value) = 'object' then locale.value - array[
            'colors', 'kpis', 'missions', 'awardsLit', 'awardsClin', 'awardsTrans', 'stages', 'courseGroups'
          ] else '{}'::jsonb end) as field(key, value)
          where jsonb_typeof(field.value) <> 'string'
        )
        and public.cms_jsonb_has_exact_keys(locale.value -> 'colors', array['ink', 'gold', 'goldSoft', 'blue'], array[]::text[])
        and not exists (select 1 from jsonb_each(case when jsonb_typeof(locale.value -> 'colors') = 'object' then locale.value -> 'colors' else '{}'::jsonb end) as color(key, value) where not public.cms_jsonb_is_hex_color(color.value))
        and case when jsonb_typeof(locale.value -> 'kpis') <> 'array' then false else
          not exists (select 1 from jsonb_array_elements(locale.value -> 'kpis') as kpi(value) where not public.cms_jsonb_is_kpi(kpi.value))
        end
        and case when jsonb_typeof(locale.value -> 'missions') <> 'array' then false else
          not exists (
            select 1 from jsonb_array_elements(locale.value -> 'missions') as mission(value)
            where not (
              public.cms_jsonb_has_exact_keys(mission.value, array['tag', 'title', 'desc'], array[]::text[])
              and not exists (select 1 from jsonb_each(case when jsonb_typeof(mission.value) = 'object' then mission.value else '{}'::jsonb end) as field(key, value) where jsonb_typeof(field.value) <> 'string')
            )
          )
        end
        and not exists (
          select 1 from (values ('awardsLit'), ('awardsClin'), ('awardsTrans')) as collection(name)
          where case when jsonb_typeof(locale.value -> collection.name) <> 'array' then true else
            exists (
              select 1 from jsonb_array_elements(locale.value -> collection.name) as award(value)
              where not (
                public.cms_jsonb_has_exact_keys(award.value, array['sess', 'award', 'tone'], array['note'])
                and jsonb_typeof(award.value -> 'sess') = 'string'
                and jsonb_typeof(award.value -> 'award') = 'string'
                and public.cms_jsonb_is_hex_color(award.value -> 'tone')
                and (not award.value ? 'note' or jsonb_typeof(award.value -> 'note') = 'string')
              )
            )
          end
        )
        and case when jsonb_typeof(locale.value -> 'stages') <> 'array' then false else
          not exists (
            select 1 from jsonb_array_elements(locale.value -> 'stages') as stage(value)
            where not (
              public.cms_jsonb_has_exact_keys(stage.value, array['phase', 'name', 'years', 'color', 'items'], array[]::text[])
              and jsonb_typeof(stage.value -> 'phase') = 'string'
              and jsonb_typeof(stage.value -> 'name') = 'string'
              and jsonb_typeof(stage.value -> 'years') = 'string'
              and public.cms_jsonb_is_hex_color(stage.value -> 'color')
              and public.cms_jsonb_is_text_array(stage.value -> 'items')
            )
          )
        end
        and case when jsonb_typeof(locale.value -> 'courseGroups') <> 'array' then false else
          not exists (
            select 1 from jsonb_array_elements(locale.value -> 'courseGroups') as course_group(value)
            where not (
              public.cms_jsonb_has_exact_keys(course_group.value, array['gicon', 'title', 'color', 'rows'], array[]::text[])
              and jsonb_typeof(course_group.value -> 'gicon') = 'string'
              and jsonb_typeof(course_group.value -> 'title') = 'string'
              and public.cms_jsonb_is_hex_color(course_group.value -> 'color')
              and case when jsonb_typeof(course_group.value -> 'rows') <> 'array' then false else
                not exists (
                  select 1 from jsonb_array_elements(course_group.value -> 'rows') as row_item(value)
                  where not (
                    public.cms_jsonb_has_exact_keys(row_item.value, array['name', 'detail'], array[]::text[])
                    and jsonb_typeof(row_item.value -> 'name') = 'string'
                    and jsonb_typeof(row_item.value -> 'detail') = 'string'
                  )
                )
              end
            )
          )
        end
      )
      from jsonb_array_elements(jsonb_build_array(candidate -> 'zh', candidate -> 'en')) as locale(value)
    );
$$;

create function public.cms_holistic_payload_is_publishable(candidate jsonb)
returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select public.cms_jsonb_has_exact_keys(candidate, array['zh', 'en'], array[]::text[])
    and (
      select bool_and(
        public.cms_jsonb_has_exact_keys(locale.value, array['kpis', 'features', 'algee', 'aiEcosystem', 'outcomes'], array[]::text[])
        and case when jsonb_typeof(locale.value -> 'kpis') <> 'array' then false else
          not exists (
            select 1 from jsonb_array_elements(locale.value -> 'kpis') as kpi(value)
            where not (
              public.cms_jsonb_has_exact_keys(kpi.value, array['num', 'display', 'isStatic', 'label', 'color'], array['subtitle'])
              and jsonb_typeof(kpi.value -> 'num') = 'number'
              and jsonb_typeof(kpi.value -> 'display') = 'string'
              and jsonb_typeof(kpi.value -> 'isStatic') = 'boolean'
              and jsonb_typeof(kpi.value -> 'label') = 'string'
              and public.cms_jsonb_is_hex_color(kpi.value -> 'color')
              and (not kpi.value ? 'subtitle' or jsonb_typeof(kpi.value -> 'subtitle') = 'string')
            )
          )
        end
        and case when jsonb_typeof(locale.value -> 'features') <> 'array' then false else
          not exists (
            select 1 from jsonb_array_elements(locale.value -> 'features') as feature(value)
            where not (
              public.cms_jsonb_has_exact_keys(feature.value, array['delay', 'desc', 'iconId', 'title'], array[]::text[])
              and jsonb_typeof(feature.value -> 'delay') = 'number'
              and jsonb_typeof(feature.value -> 'desc') = 'string'
              and jsonb_typeof(feature.value -> 'iconId') = 'string'
              and jsonb_typeof(feature.value -> 'title') = 'string'
            )
          )
        end
        and case when jsonb_typeof(locale.value -> 'algee') <> 'array' then false else
          not exists (
            select 1 from jsonb_array_elements(locale.value -> 'algee') as algee(value)
            where not (
              public.cms_jsonb_has_exact_keys(algee.value, array['description', 'letter', 'title'], array[]::text[])
              and not exists (select 1 from jsonb_each(case when jsonb_typeof(algee.value) = 'object' then algee.value else '{}'::jsonb end) as field(key, value) where jsonb_typeof(field.value) <> 'string')
            )
          )
        end
        and public.cms_jsonb_has_exact_keys(locale.value -> 'aiEcosystem', array['body', 'flow', 'problems', 'problemsTitle', 'teamLabel', 'title'], array[]::text[])
        and jsonb_typeof(locale.value #> '{aiEcosystem,body}') = 'string'
        and public.cms_jsonb_is_text_array(locale.value #> '{aiEcosystem,problems}')
        and jsonb_typeof(locale.value #> '{aiEcosystem,problemsTitle}') = 'string'
        and jsonb_typeof(locale.value #> '{aiEcosystem,teamLabel}') = 'string'
        and jsonb_typeof(locale.value #> '{aiEcosystem,title}') = 'string'
        and case when jsonb_typeof(locale.value #> '{aiEcosystem,flow}') <> 'array' then false else
          not exists (
            select 1 from jsonb_array_elements(locale.value #> '{aiEcosystem,flow}') as flow_item(value)
            where not (
              public.cms_jsonb_has_exact_keys(flow_item.value, array['color', 'role', 'text', 'title'], array[]::text[])
              and public.cms_jsonb_is_hex_color(flow_item.value -> 'color')
              and jsonb_typeof(flow_item.value -> 'role') = 'string'
              and jsonb_typeof(flow_item.value -> 'text') = 'string'
              and jsonb_typeof(flow_item.value -> 'title') = 'string'
            )
          )
        end
        and public.cms_jsonb_has_exact_keys(locale.value -> 'outcomes', array[
          'attendeesLabel', 'hostLabel', 'satisfactionLabel', 'symposiumDesc', 'symposiumEyebrow',
          'symposiumTitle', 'symposiums', 'trainingDesc', 'trainingEyebrow', 'trainingParticipants',
          'trainingSatisfaction', 'trainingSessions', 'trainingTitle'
        ], array[]::text[])
        and not exists (
          select 1 from jsonb_each(case when jsonb_typeof(locale.value -> 'outcomes') = 'object' then (locale.value -> 'outcomes') - array['symposiums', 'trainingParticipants', 'trainingSatisfaction', 'trainingSessions'] else '{}'::jsonb end) as field(key, value)
          where jsonb_typeof(field.value) <> 'string'
        )
        and case when jsonb_typeof(locale.value #> '{outcomes,symposiums}') <> 'array' then false else
          not exists (
            select 1 from jsonb_array_elements(locale.value #> '{outcomes,symposiums}') as symposium(value)
            where not (
              public.cms_jsonb_has_exact_keys(symposium.value, array['dates', 'edition', 'time', 'title', 'year'], array['attendees', 'satisfaction'])
              and jsonb_typeof(symposium.value -> 'dates') = 'string'
              and jsonb_typeof(symposium.value -> 'edition') = 'string'
              and jsonb_typeof(symposium.value -> 'time') = 'string'
              and jsonb_typeof(symposium.value -> 'title') = 'string'
              and case when jsonb_typeof(symposium.value -> 'year') <> 'number' then false else
                (symposium.value ->> 'year')::numeric = trunc((symposium.value ->> 'year')::numeric)
              end
              and (not symposium.value ? 'attendees' or jsonb_typeof(symposium.value -> 'attendees') = 'number')
              and (not symposium.value ? 'satisfaction' or jsonb_typeof(symposium.value -> 'satisfaction') = 'number')
            )
          )
        end
        and public.cms_jsonb_has_exact_keys(locale.value #> '{outcomes,trainingParticipants}', array['label', 'num'], array[]::text[])
        and jsonb_typeof(locale.value #> '{outcomes,trainingParticipants,label}') = 'string'
        and jsonb_typeof(locale.value #> '{outcomes,trainingParticipants,num}') = 'number'
        and public.cms_jsonb_has_exact_keys(locale.value #> '{outcomes,trainingSatisfaction}', array['label', 'num', 'suffix'], array[]::text[])
        and jsonb_typeof(locale.value #> '{outcomes,trainingSatisfaction,label}') = 'string'
        and jsonb_typeof(locale.value #> '{outcomes,trainingSatisfaction,num}') = 'number'
        and jsonb_typeof(locale.value #> '{outcomes,trainingSatisfaction,suffix}') = 'string'
        and public.cms_jsonb_has_exact_keys(locale.value #> '{outcomes,trainingSessions}', array['label', 'num'], array[]::text[])
        and jsonb_typeof(locale.value #> '{outcomes,trainingSessions,label}') = 'string'
        and jsonb_typeof(locale.value #> '{outcomes,trainingSessions,num}') = 'number'
      )
      from jsonb_array_elements(jsonb_build_array(candidate -> 'zh', candidate -> 'en')) as locale(value)
    );
$$;

create function public.cms_holistic_research_payload_is_publishable(candidate jsonb)
returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select public.cms_jsonb_has_exact_keys(candidate, array['zh', 'en'], array[]::text[])
    and (
      select bool_and(
        public.cms_jsonb_has_exact_keys(locale.value, array[
          'authorsLabel', 'byYear', 'byYearTitle', 'clinicalDesc', 'clinicalLegend', 'clinicalStats',
          'clinicalTitle', 'desc', 'eduDesc', 'eduLegend', 'eduTitle', 'eyebrow', 'papers', 'title',
          'total', 'totalLabel'
        ], array[]::text[])
        and not exists (
          select 1 from jsonb_each(case when jsonb_typeof(locale.value) = 'object' then locale.value - array['byYear', 'clinicalStats', 'papers', 'total'] else '{}'::jsonb end) as field(key, value)
          where jsonb_typeof(field.value) <> 'string'
        )
        and jsonb_typeof(locale.value -> 'total') = 'number'
        and case when jsonb_typeof(locale.value -> 'byYear') <> 'array' then false else
          not exists (
            select 1 from jsonb_array_elements(locale.value -> 'byYear') as year_item(value)
            where not (
              public.cms_jsonb_has_exact_keys(year_item.value, array['clinical', 'edu', 'year'], array[]::text[])
              and jsonb_typeof(year_item.value -> 'clinical') = 'number'
              and jsonb_typeof(year_item.value -> 'edu') = 'number'
              and case when jsonb_typeof(year_item.value -> 'year') <> 'number' then false else
                (year_item.value ->> 'year')::numeric = trunc((year_item.value ->> 'year')::numeric)
              end
            )
          )
        end
        and case when jsonb_typeof(locale.value -> 'clinicalStats') <> 'array' then false else
          not exists (
            select 1 from jsonb_array_elements(locale.value -> 'clinicalStats') as stat(value)
            where not (
              public.cms_jsonb_has_exact_keys(stat.value, array['label', 'num'], array[]::text[])
              and jsonb_typeof(stat.value -> 'label') = 'string'
              and jsonb_typeof(stat.value -> 'num') = 'number'
            )
          )
        end
        and case when jsonb_typeof(locale.value -> 'papers') <> 'array' then false else
          not exists (
            select 1 from jsonb_array_elements(locale.value -> 'papers') as paper(value)
            where not (
              public.cms_jsonb_has_exact_keys(paper.value, array['authors', 'byline', 'journal', 'month', 'title', 'year'], array[]::text[])
              and public.cms_jsonb_is_text_array(paper.value -> 'authors')
              and jsonb_typeof(paper.value -> 'byline') = 'string'
              and jsonb_typeof(paper.value -> 'journal') = 'string'
              and case when jsonb_typeof(paper.value -> 'month') <> 'number' then false else
                (paper.value ->> 'month')::numeric = trunc((paper.value ->> 'month')::numeric)
                  and (paper.value ->> 'month')::numeric between 1 and 12
              end
              and jsonb_typeof(paper.value -> 'title') = 'string'
              and case when jsonb_typeof(paper.value -> 'year') <> 'number' then false else
                (paper.value ->> 'year')::numeric = trunc((paper.value ->> 'year')::numeric)
                  and (paper.value ->> 'year')::numeric between 1900 and 2100
              end
            )
          )
        end
      )
      from jsonb_array_elements(jsonb_build_array(candidate -> 'zh', candidate -> 'en')) as locale(value)
    );
$$;

create function public.cms_payload_is_publishable(
  document_kind public.cms_document_kind,
  candidate jsonb
)
returns boolean
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select case document_kind
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
    else false
  end;
$$;

create or replace function public.cms_enforce_revision_lifecycle()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  document_kind public.cms_document_kind;
begin
  if tg_op = 'INSERT' then
    new.created_at := statement_timestamp();
    new.created_by := auth.uid();
    new.updated_at := statement_timestamp();
    new.updated_by := auth.uid();

    if new.status = 'published' then
      select kind into document_kind
      from public.cms_documents
      where id = new.document_id;

      if public.cms_payload_is_publishable(document_kind, new.payload) is not true then
        raise exception 'payload does not match CMS document kind %', document_kind using errcode = '23514';
      end if;
    end if;

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

  if old.status = 'draft' and new.status = 'published' then
    select kind into document_kind
    from public.cms_documents
    where id = new.document_id;

    if public.cms_payload_is_publishable(document_kind, new.payload) is not true then
      raise exception 'payload does not match CMS document kind %', document_kind using errcode = '23514';
    end if;
  end if;

  new.updated_at := statement_timestamp();
  new.updated_by := auth.uid();
  return new;
end;
$$;

create or replace function public.cms_publish_revision(
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
  document_kind public.cms_document_kind;
  actor_id uuid := auth.uid();
begin
  if not public.is_cms_admin() then
    raise exception 'CMS administrator access required' using errcode = '42501';
  end if;

  select kind into document_kind
  from public.cms_documents
  where id = p_document_id
  for update;

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

  if public.cms_payload_is_publishable(document_kind, chosen_revision.payload) is not true then
    raise exception 'payload does not match CMS document kind %', document_kind using errcode = '23514';
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

revoke all on function
  public.cms_jsonb_has_exact_keys(jsonb, text[], text[]),
  public.cms_jsonb_is_text_array(jsonb),
  public.cms_jsonb_is_hex_color(jsonb),
  public.cms_jsonb_is_https_url(jsonb),
  public.cms_jsonb_is_published_media_reference(jsonb),
  public.cms_jsonb_is_person(jsonb),
  public.cms_jsonb_is_kpi(jsonb),
  public.cms_site_copy_payload_is_publishable(jsonb),
  public.cms_centers_payload_is_publishable(jsonb),
  public.cms_people_payload_is_publishable(jsonb),
  public.cms_news_payload_is_publishable(jsonb),
  public.cms_activities_payload_is_publishable(jsonb),
  public.cms_kpis_payload_is_publishable(jsonb),
  public.cms_honors_payload_is_publishable(jsonb),
  public.cms_digital_materials_payload_is_publishable(jsonb),
  public.cms_facdev_payload_is_publishable(jsonb),
  public.cms_ebm_payload_is_publishable(jsonb),
  public.cms_holistic_payload_is_publishable(jsonb),
  public.cms_holistic_research_payload_is_publishable(jsonb),
  public.cms_payload_is_publishable(jsonb),
  public.cms_payload_is_publishable(public.cms_document_kind, jsonb)
from public, anon, authenticated;

revoke all on function public.cms_publish_revision(uuid, uuid) from public, anon, authenticated;
grant execute on function public.cms_publish_revision(uuid, uuid) to authenticated;

comment on function public.cms_jsonb_has_exact_keys(jsonb, text[], text[]) is 'Internal immutable CMS JSON predicate; API roles have no direct execution privilege.';
comment on function public.cms_jsonb_is_text_array(jsonb) is 'Internal immutable CMS JSON predicate; API roles have no direct execution privilege.';
comment on function public.cms_jsonb_is_hex_color(jsonb) is 'Internal immutable CMS JSON predicate; API roles have no direct execution privilege.';
comment on function public.cms_jsonb_is_https_url(jsonb) is 'Internal immutable CMS JSON predicate; API roles have no direct execution privilege.';
comment on function public.cms_jsonb_is_published_media_reference(jsonb) is 'Internal immutable CMS JSON predicate; API roles have no direct execution privilege.';
comment on function public.cms_jsonb_is_person(jsonb) is 'Internal immutable CMS JSON predicate; API roles have no direct execution privilege.';
comment on function public.cms_jsonb_is_kpi(jsonb) is 'Internal immutable CMS JSON predicate; API roles have no direct execution privilege.';
comment on function public.cms_site_copy_payload_is_publishable(jsonb) is 'Internal site_copy publication-shape validator used by the exhaustive CMS dispatcher.';
comment on function public.cms_centers_payload_is_publishable(jsonb) is 'Internal centers publication-shape validator used by the exhaustive CMS dispatcher.';
comment on function public.cms_people_payload_is_publishable(jsonb) is 'Internal people publication-shape validator used by the exhaustive CMS dispatcher.';
comment on function public.cms_news_payload_is_publishable(jsonb) is 'Internal news publication-shape validator used by the exhaustive CMS dispatcher.';
comment on function public.cms_activities_payload_is_publishable(jsonb) is 'Internal activities publication-shape validator used by the exhaustive CMS dispatcher.';
comment on function public.cms_kpis_payload_is_publishable(jsonb) is 'Internal kpis publication-shape validator used by the exhaustive CMS dispatcher.';
comment on function public.cms_honors_payload_is_publishable(jsonb) is 'Internal honors publication-shape validator used by the exhaustive CMS dispatcher.';
comment on function public.cms_digital_materials_payload_is_publishable(jsonb) is 'Internal digital_materials publication-shape validator used by the exhaustive CMS dispatcher.';
comment on function public.cms_facdev_payload_is_publishable(jsonb) is 'Internal facdev publication-shape validator used by the exhaustive CMS dispatcher.';
comment on function public.cms_ebm_payload_is_publishable(jsonb) is 'Internal ebm publication-shape validator used by the exhaustive CMS dispatcher.';
comment on function public.cms_holistic_payload_is_publishable(jsonb) is 'Internal holistic publication-shape validator used by the exhaustive CMS dispatcher.';
comment on function public.cms_holistic_research_payload_is_publishable(jsonb) is 'Internal holistic_research publication-shape validator used by the exhaustive CMS dispatcher.';
comment on function public.cms_payload_is_publishable(jsonb) is 'Legacy bilingual-envelope predicate retained for the published-row check constraint.';
comment on function public.cms_payload_is_publishable(public.cms_document_kind, jsonb) is 'Fail-closed exhaustive publication validator binding a CMS document kind to its payload shape.';
comment on function public.cms_enforce_revision_lifecycle() is 'Enforces revision transitions, immutable audit fields, and kind-specific validation for every published-row write.';
comment on function public.cms_publish_revision(uuid, uuid) is 'Security-definer RPC validates kind and payload before atomically replacing the prior publication.';
