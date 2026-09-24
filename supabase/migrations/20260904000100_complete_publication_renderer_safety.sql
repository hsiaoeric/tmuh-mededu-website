-- allow: SIZE_OK — this forward migration atomically replaces one interdependent publication-validation graph.
begin;

create function public.cms_jsonb_array_has_exact_field_values(
  candidate jsonb,
  field_name text,
  expected_values text[]
)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select case when jsonb_typeof(candidate) <> 'array' then false else
    jsonb_array_length(candidate) = cardinality(expected_values)
      and not exists (
        select 1
        from jsonb_array_elements(candidate) as item(value)
        where jsonb_typeof(item.value) <> 'object'
          or item.value ->> field_name is null
          or item.value ->> field_name <> all(expected_values)
      )
      and (
        select count(distinct item.value ->> field_name) = cardinality(expected_values)
        from jsonb_array_elements(candidate) as item(value)
      )
  end;
$$;

create or replace function public.cms_centers_payload_is_publishable(candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
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
                array['id', 'name', 'intro', 'contact', 'ext', 'branches'],
                array['externalUrl', 'deep']
              )
              and jsonb_typeof(center.value -> 'id') = 'string'
              and jsonb_typeof(center.value -> 'name') = 'string'
              and jsonb_typeof(center.value -> 'intro') = 'string'
              and jsonb_typeof(center.value -> 'contact') = 'string'
              and jsonb_typeof(center.value -> 'ext') = 'string'
              and (not center.value ? 'externalUrl' or public.cms_jsonb_is_credential_free_https_url(center.value -> 'externalUrl'))
              and (not center.value ? 'deep' or jsonb_typeof(center.value -> 'deep') = 'boolean')
              and case when jsonb_typeof(center.value -> 'branches') <> 'array' then false else
                not exists (
                  select 1 from jsonb_array_elements(center.value -> 'branches') as branch(value)
                  where not (
                    public.cms_jsonb_has_exact_keys(
                      branch.value,
                      array['id', 'name', 'description'],
                      array[]::text[]
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
          and public.cms_jsonb_array_has_exact_field_values(
            locale.value -> 'centers',
            'id',
            array['faculty_dev', 'clinical_skills', 'ebm', 'holistic', 'med_edu_research', 'admin']
          )
          and not exists (
            select 1
            from jsonb_array_elements(locale.value -> 'centers') as center(value)
            where public.cms_jsonb_array_has_exact_field_values(
              center.value -> 'branches',
              'id',
              case center.value ->> 'id'
                when 'faculty_dev' then array['about', 'services', 'contact']
                when 'clinical_skills' then array['about', 'services', 'contact']
                when 'ebm' then array['about', 'services', 'contact']
                when 'holistic' then array['about', 'services', 'contact']
                when 'med_edu_research' then array['about', 'services', 'contact']
                when 'admin' then array['leadership', 'duties', 'extensions']
                else array[]::text[]
              end
            ) is not true
          )
        end
      )
      from jsonb_array_elements(jsonb_build_array(candidate -> 'zh', candidate -> 'en')) as locale(value)
    );
$$;

create or replace function public.cms_people_payload_is_publishable(candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select public.cms_jsonb_has_exact_keys(candidate, array['zh', 'en'], array[]::text[])
    and (
      select bool_and(
        public.cms_jsonb_has_exact_keys(
          locale.value,
          array['centerPeople', 'holisticInstructors', 'holisticSeedTeachers', 'holisticAiTeam', 'memberGroups'],
          array[]::text[]
        )
        and not exists (
          select 1
          from jsonb_each(locale.value - 'memberGroups') as collection(key, value)
          where case when jsonb_typeof(collection.value) <> 'array' then true else exists (
            select 1 from jsonb_array_elements(collection.value) as item(value)
            where case when collection.key = 'centerPeople' then not (
              public.cms_jsonb_has_exact_keys(item.value, array['centerId', 'people'], array[]::text[])
              and jsonb_typeof(item.value -> 'centerId') = 'string'
              and case when jsonb_typeof(item.value -> 'people') <> 'array' then false else not exists (
                select 1 from jsonb_array_elements(item.value -> 'people') as person(value)
                where not public.cms_jsonb_is_person(person.value)
              ) end
            ) else not public.cms_jsonb_is_person(item.value) end
          ) end
        )
        and public.cms_jsonb_array_has_exact_field_values(
          locale.value -> 'centerPeople',
          'centerId',
          array['faculty_dev', 'clinical_skills', 'ebm', 'holistic', 'med_edu_research', 'admin']
        )
        and case when jsonb_typeof(locale.value -> 'memberGroups') <> 'array' then false else
          (select jsonb_agg(item.value -> 'id' order by item.ordinality)
            from jsonb_array_elements(locale.value -> 'memberGroups') with ordinality as item(value, ordinality))
            = '["department_advisors","teaching_attendings","teaching_allied_health"]'::jsonb
          and not exists (
            select 1 from jsonb_array_elements(locale.value -> 'memberGroups') as member_group(value)
            where not (
              public.cms_jsonb_has_exact_keys(member_group.value, array['id', 'people'], array[]::text[])
              and jsonb_typeof(member_group.value -> 'id') = 'string'
              and case when jsonb_typeof(member_group.value -> 'people') <> 'array' then false else not exists (
                select 1 from jsonb_array_elements(member_group.value -> 'people') as person(value)
                where not public.cms_jsonb_is_person(person.value)
                  or person.value ->> 'roleKey' <> all(array[
                    'director', 'deputy', 'cadmin', 'instructor', 'seed', 'vp', 'lead', 'ddir',
                    'ddep', 'head', 'spec', 'pm', 'advisor', 'ai', 'eng'
                  ])
              ) end
            )
          )
        end
      )
      from jsonb_array_elements(jsonb_build_array(candidate -> 'zh', candidate -> 'en')) as locale(value)
    )
    and public.cms_jsonb_arrays_have_matching_field(candidate #> '{zh,centerPeople}', candidate #> '{en,centerPeople}', 'centerId')
    and public.cms_jsonb_paired_nested_arrays_have_equal_length(candidate #> '{zh,centerPeople}', candidate #> '{en,centerPeople}', 'people')
    and public.cms_jsonb_arrays_have_matching_field(candidate #> '{zh,memberGroups}', candidate #> '{en,memberGroups}', 'id')
    and public.cms_jsonb_paired_nested_arrays_have_equal_length(candidate #> '{zh,memberGroups}', candidate #> '{en,memberGroups}', 'people');
$$;

create or replace function public.cms_facdev_payload_is_publishable(candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select public.cms_jsonb_has_exact_keys(candidate, array['zh', 'en'], array[]::text[])
    and (
      select bool_and(
        public.cms_jsonb_has_exact_keys(locale.value, array[
          'aboutBody', 'aboutBody2', 'aboutEyebrow', 'aboutTitle', 'actEyebrow', 'actTitle',
          'closingBody', 'closingTitle', 'contactExt', 'contactPerson', 'contactPlace',
          'contactQuote', 'eyebrow', 'groupLeadLabel', 'groupRoot', 'groups', 'groupsDesc',
          'groupsEyebrow', 'groupsTitle', 'heroTag', 'heroTitle', 'kpis', 'membersTitle',
          'newsEyebrow', 'newsTitle', 'reservedNote', 'reservedTag', 'services', 'servicesDesc',
          'servicesEyebrow', 'servicesTitle'
        ], array[]::text[])
        and not exists (
          select 1 from jsonb_each(case when jsonb_typeof(locale.value) = 'object' then locale.value - array['groups', 'kpis', 'services'] else '{}'::jsonb end) as field(key, value)
          where jsonb_typeof(field.value) <> 'string'
        )
        and case when jsonb_typeof(locale.value -> 'groups') <> 'array' then false else
          not exists (
            select 1 from jsonb_array_elements(locale.value -> 'groups') as group_item(value)
            where not (
              public.cms_jsonb_has_exact_keys(group_item.value, array['desc', 'lead', 'name'], array[]::text[])
              and jsonb_typeof(group_item.value -> 'desc') = 'string'
              and public.cms_jsonb_is_person(group_item.value -> 'lead')
              and jsonb_typeof(group_item.value -> 'name') = 'string'
            )
          )
        end
        and case when jsonb_typeof(locale.value -> 'kpis') <> 'array' then false else
          not exists (select 1 from jsonb_array_elements(locale.value -> 'kpis') as kpi(value) where not (
            public.cms_jsonb_has_exact_keys(kpi.value, array['num', 'suffix', 'label', 'en'], array[]::text[])
            and jsonb_typeof(kpi.value -> 'num') = 'number'
            and jsonb_typeof(kpi.value -> 'suffix') = 'string'
            and jsonb_typeof(kpi.value -> 'label') = 'string'
            and jsonb_typeof(kpi.value -> 'en') = 'string'
          ))
        end
        and case when jsonb_typeof(locale.value -> 'services') <> 'array' then false else
          not exists (
            select 1 from jsonb_array_elements(locale.value -> 'services') as service(value)
            where not (
              public.cms_jsonb_has_exact_keys(service.value, array['desc', 'title'], array[]::text[])
              and jsonb_typeof(service.value -> 'desc') = 'string'
              and jsonb_typeof(service.value -> 'title') = 'string'
            )
          )
        end
      )
      from jsonb_array_elements(jsonb_build_array(candidate -> 'zh', candidate -> 'en')) as locale(value)
    );
$$;

create or replace function public.cms_ebm_payload_is_publishable(candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select public.cms_jsonb_has_exact_keys(candidate, array['zh', 'en'], array[]::text[])
    and (
      select bool_and(
        public.cms_jsonb_has_exact_keys(locale.value, array[
          'eyebrow', 'heroTitle', 'heroTag', 'aboutEyebrow', 'aboutTitle', 'aboutBody',
          'aboutBody2', 'membersTitle', 'missionsEyebrow', 'missionsTitle', 'missionsDesc',
          'awardsEyebrow', 'awardsTitle', 'awardsDesc', 'awardsLitTitle', 'awardsClinTitle',
          'awardsTransTitle', 'colSession', 'colAward', 'journeyEyebrow', 'journeyTitle',
          'journeyDesc', 'coursesEyebrow', 'coursesTitle', 'coursesDesc', 'closingTitle',
          'closingBody', 'contactPerson', 'contactExt', 'contactPlace', 'contactQuote', 'kpis',
          'missions', 'awardsLit', 'awardsClin', 'awardsTrans', 'stages', 'courseGroups'
        ], array[]::text[])
        and not exists (
          select 1 from jsonb_each(case when jsonb_typeof(locale.value) = 'object' then locale.value - array[
            'kpis', 'missions', 'awardsLit', 'awardsClin', 'awardsTrans', 'stages', 'courseGroups'
          ] else '{}'::jsonb end) as field(key, value)
          where jsonb_typeof(field.value) <> 'string'
        )
        and case when jsonb_typeof(locale.value -> 'kpis') <> 'array' then false else
          not exists (select 1 from jsonb_array_elements(locale.value -> 'kpis') as kpi(value) where not (
            public.cms_jsonb_has_exact_keys(kpi.value, array['num', 'suffix', 'label', 'en'], array[]::text[])
            and jsonb_typeof(kpi.value -> 'num') = 'number'
            and jsonb_typeof(kpi.value -> 'suffix') = 'string'
            and jsonb_typeof(kpi.value -> 'label') = 'string'
            and jsonb_typeof(kpi.value -> 'en') = 'string'
          ))
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
                public.cms_jsonb_has_exact_keys(award.value, array['sess', 'award'], array['note'])
                and jsonb_typeof(award.value -> 'sess') = 'string'
                and jsonb_typeof(award.value -> 'award') = 'string'
                and (not award.value ? 'note' or jsonb_typeof(award.value -> 'note') = 'string')
              )
            )
          end
        )
        and case when jsonb_typeof(locale.value -> 'stages') <> 'array' then false else
          not exists (
            select 1 from jsonb_array_elements(locale.value -> 'stages') as stage(value)
            where not (
              public.cms_jsonb_has_exact_keys(stage.value, array['phase', 'name', 'years', 'items'], array[]::text[])
              and jsonb_typeof(stage.value -> 'phase') = 'string'
              and jsonb_typeof(stage.value -> 'name') = 'string'
              and jsonb_typeof(stage.value -> 'years') = 'string'
              and public.cms_jsonb_is_text_array(stage.value -> 'items')
            )
          )
        end
        and case when jsonb_typeof(locale.value -> 'courseGroups') <> 'array' then false else
          not exists (
            select 1 from jsonb_array_elements(locale.value -> 'courseGroups') as course_group(value)
            where not (
              public.cms_jsonb_has_exact_keys(course_group.value, array['title', 'rows'], array[]::text[])
              and jsonb_typeof(course_group.value -> 'title') = 'string'
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

create or replace function public.cms_holistic_payload_is_publishable(candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
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
              and feature.value ->> 'iconId' = any(array['cap', 'skills', 'chart', 'holistic', 'heart', 'research', 'admin', 'book', 'phone', 'clipboard', 'bulb', 'team', 'brain', 'sprout', 'network', 'award', 'globe', 'sun', 'moon', 'arrow', 'arrowUpRight', 'arrowDown', 'close', 'menu', 'plus', 'minus', 'quote', 'pin', 'calendar', 'spark', 'check', 'alert', 'upload', 'image', 'trash', 'refresh', 'search'])
              and jsonb_typeof(feature.value -> 'title') = 'string'
            )
          )
        end
        and case when jsonb_typeof(locale.value -> 'algee') <> 'array' then false else
          jsonb_array_length(locale.value -> 'algee') > 0
          and not exists (
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

create or replace function public.cms_payload_is_publishable(
  document_kind public.cms_document_kind,
  candidate jsonb
)
returns boolean language sql immutable strict security invoker set search_path = '' as $$
  select (document_kind = 'centers' or public.cms_wave5_global_payload_is_valid(document_kind, candidate) is true)
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
      else false
    end) is true;
$$;

alter function public.cms_jsonb_array_has_exact_field_values(jsonb, text, text[]) owner to postgres;
alter function public.cms_centers_payload_is_publishable(jsonb) owner to postgres;
alter function public.cms_people_payload_is_publishable(jsonb) owner to postgres;
alter function public.cms_facdev_payload_is_publishable(jsonb) owner to postgres;
alter function public.cms_ebm_payload_is_publishable(jsonb) owner to postgres;
alter function public.cms_holistic_payload_is_publishable(jsonb) owner to postgres;
alter function public.cms_payload_is_publishable(public.cms_document_kind, jsonb) owner to postgres;

revoke all on function
  public.cms_jsonb_array_has_exact_field_values(jsonb, text, text[]),
  public.cms_centers_payload_is_publishable(jsonb),
  public.cms_people_payload_is_publishable(jsonb),
  public.cms_facdev_payload_is_publishable(jsonb),
  public.cms_ebm_payload_is_publishable(jsonb),
  public.cms_holistic_payload_is_publishable(jsonb),
  public.cms_payload_is_publishable(public.cms_document_kind, jsonb)
from public, anon, authenticated;

comment on function public.cms_jsonb_array_has_exact_field_values(jsonb, text, text[]) is
  'Internal order-independent exact identity-set predicate for renderer-safe publication payloads.';
comment on function public.cms_centers_payload_is_publishable(jsonb) is
  'Internal centers publication validator requiring canonical order-independent renderer identities.';
comment on function public.cms_people_payload_is_publishable(jsonb) is
  'Internal people publication validator requiring every canonical center group.';
comment on function public.cms_facdev_payload_is_publishable(jsonb) is
  'Internal facdev publication validator excluding presentation fields owned by the public application.';
comment on function public.cms_ebm_payload_is_publishable(jsonb) is
  'Internal ebm publication validator excluding presentation fields owned by the public application.';
comment on function public.cms_holistic_payload_is_publishable(jsonb) is
  'Internal holistic publication validator requiring renderer-safe icons and non-empty ALGEE content.';
comment on function public.cms_payload_is_publishable(public.cms_document_kind, jsonb) is
  'Fail-closed exhaustive publication validator binding a CMS document kind to its payload shape.';

commit;
