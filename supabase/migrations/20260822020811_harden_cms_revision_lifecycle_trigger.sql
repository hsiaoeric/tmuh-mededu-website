begin;

alter function public.cms_enforce_revision_lifecycle() owner to postgres;
alter function public.cms_enforce_revision_lifecycle() security definer;
alter function public.cms_enforce_revision_lifecycle() set search_path = '';

revoke all on function public.cms_enforce_revision_lifecycle()
from public, anon, authenticated;

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

grant execute on function
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
to postgres;

alter table public.cms_revisions
drop constraint cms_revisions_published_payload_check;

alter table public.cms_revisions
add constraint cms_revisions_published_payload_check
check ((
  status <> 'published'
  or (
    jsonb_typeof(payload) = 'object'
    and jsonb_typeof(payload -> 'zh') = 'object'
    and jsonb_typeof(payload -> 'en') = 'object'
    and payload -> 'zh' <> '{}'::jsonb
    and payload -> 'en' <> '{}'::jsonb
  )
) is true);

comment on function public.cms_enforce_revision_lifecycle() is
  'Internal SECURITY DEFINER trigger boundary with a fixed empty search path, trusted owner, and no API-role execution privilege.';

commit;
