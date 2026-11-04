-- allow: SIZE_OK - This rollback-wrapped pgTAP corpus keeps the three localized-fields-v1 archive contracts, their named mutations, draft saves, nested draft-media substitution, and the relaxed published-envelope constraint auditable together.
begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
set local request.jwt.claims = '{}';

select plan(39);

insert into auth.users (id, email)
values
  ('88000000-0000-4000-8000-000000000001', 'archive-contract-admin@example.test'),
  ('88000000-0000-4000-8000-000000000002', 'archive-contract-other@example.test');

insert into public.cms_admins (user_id, created_by)
values (
  '88000000-0000-4000-8000-000000000001',
  '88000000-0000-4000-8000-000000000001'
);

create temporary table archive_valid_payloads (
  kind public.cms_document_kind primary key,
  payload jsonb not null
) on commit drop;

insert into archive_valid_payloads (kind, payload) values
(
  'posts',
  $json${
    "contentModel": "localized-fields-v1",
    "categories": [
      {"id": "hospital-courses", "channel": "news", "label": {"zh": "院內課程", "en": "Hospital Courses"}, "order": 0},
      {"id": "recruitment", "channel": "news", "label": {"zh": "招生訊息", "en": "Recruitment"}, "order": 1},
      {"id": "further-training", "channel": "news", "label": {"zh": "進修訊息"}, "order": 2},
      {"id": "faculty", "channel": "news", "label": {"zh": "師資培育", "en": "Faculty"}, "order": 3},
      {"id": "center-notices", "channel": "news", "label": {"zh": "中心公告", "en": "Center Notices"}, "order": 4},
      {"id": "trainee-notices", "channel": "news", "label": {"zh": "學員公告", "en": "Trainee Notices"}, "order": 5},
      {"id": "hospital-events", "channel": "news", "label": {"zh": "院內活動", "en": "Hospital Events"}, "order": 6},
      {"id": "external-events", "channel": "news", "label": {"zh": "院外活動", "en": "External Events"}, "order": 7},
      {"id": "teaching-recognition", "channel": "honors", "label": {"zh": "教學肯定", "en": "Teaching Recognition"}, "order": 8},
      {"id": "competitions-awards", "channel": "honors", "label": {"zh": "競賽獲獎", "en": "Competitions and Awards"}, "order": 9},
      {"id": "publications-training", "channel": "honors", "label": {"zh": "論文與培訓", "en": "Publications and Training"}, "order": 10},
      {"id": "faculty-certification", "channel": "honors", "label": {"zh": "師資認證", "en": "Faculty Certification"}, "order": 11},
      {"id": "center-about", "channel": "center", "label": {"zh": "中心簡介", "en": "About the Center"}, "order": 12},
      {"id": "center-events", "channel": "center", "label": {"zh": "中心活動", "en": "Center Events"}, "order": 13}
    ],
    "posts": [
      {
        "id": "185",
        "channel": "news",
        "categoryId": "hospital-courses",
        "owner": "department",
        "audiences": ["residents", "pgy"],
        "publishedOn": "2024-02-29",
        "pinned": true,
        "title": {"zh": "113年度教學課程公告", "en": "2024 Teaching Course Notice"},
        "summary": {"zh": "課程時間與報名方式"},
        "cover": {"kind": "local", "path": "assets/legacy/article/0123456789abcdef0123.webp"},
        "body": {
          "zh": [
            {"type": "paragraph", "runs": [
              {"text": "本院教學部舉辦課程\u3000歡迎參加，\n請踴躍報名。"},
              {"text": "報名連結", "strong": true, "href": "https://tmuh.example/apply?id=1#form"},
              {"text": "舊系統", "href": "http://eportfolio.example/login"},
              {"text": "公告頁", "href": "/announcements?category=hospital-courses#board"},
              {"text": "聯絡信箱", "href": "mailto:edu@tmuh.example"},
              {"text": "分機", "href": "tel:+886-2-2737-2181"}
            ]},
            {"type": "heading", "level": 2, "text": "課程內容"},
            {"type": "heading", "level": 3, "text": "上午場"},
            {"type": "list", "ordered": true, "items": [[{"text": "第一項"}], [{"text": "第二項", "strong": true}]]},
            {"type": "list", "ordered": false, "items": [[{"text": "要點"}]]},
            {"type": "image", "media": {"kind": "local", "path": "assets/legacy/article/abcdefabcdefabcdefab.webp"}, "alt": "113年度教學課程公告 — 圖 1", "caption": "課程海報", "width": 1600, "height": 900},
            {"type": "image", "media": {"kind": "public", "bucket": "public-media", "path": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp"}, "alt": "海報"},
            {"type": "table", "header": ["時間", "課程", ""], "rows": [["09:00", "開幕", ""], ["10:00", "講座"]]},
            {"type": "divider"},
            {"type": "video", "youtubeId": "dQw4w9WgXcQ"}
          ],
          "en": [
            {"type": "paragraph", "runs": [{"text": "English summary of the notice."}]}
          ]
        },
        "attachments": [
          {"id": "schedule", "label": {"zh": "課程表"}, "href": "files/legacy/2024/schedule-113.pdf"},
          {"id": "form", "label": {"zh": "報名表", "en": "Form"}, "href": "https://tmuh.example/form.docx"}
        ]
      },
      {
        "id": "center-ebm-about",
        "channel": "center",
        "categoryId": "center-about",
        "owner": "ebm",
        "publishedOn": "2023-01-01",
        "pinned": false,
        "title": {"zh": "實證醫學中心簡介"},
        "body": {"zh": [{"type": "paragraph", "runs": [{"text": "中心介紹"}]}]},
        "attachments": []
      },
      {
        "id": "honor-snq-2023",
        "channel": "honors",
        "categoryId": "teaching-recognition",
        "owner": "department",
        "publishedOn": "2023-12-31",
        "pinned": false,
        "title": {"zh": "榮獲 SNQ 認證"},
        "body": {"zh": [{"type": "divider"}]},
        "attachments": []
      }
    ]
  }$json$::jsonb
),
(
  'department_info',
  $json${
    "contentModel": "localized-fields-v1",
    "pages": [
      {"id": "director-message", "section": "about", "owner": "department", "order": 0,
       "title": {"zh": "主任的話", "en": "Message from the Director"}, "subtitle": {"zh": "教學部主任"}, "summary": {"zh": "歡迎"},
       "portrait": {"kind": "local", "path": "assets/legacy/page/0123456789abcdef0123.webp"},
       "body": {"zh": [{"type": "paragraph", "runs": [{"text": "內容"}]}], "en": [{"type": "paragraph", "runs": [{"text": "Content"}]}]},
       "updatedOn": "2024-05-01"},
      {"id": "teaching-committee", "section": "committee", "order": 1, "title": {"zh": "教學委員會"},
       "body": {"zh": [{"type": "paragraph", "runs": [{"text": "委員會"}]}]}},
      {"id": "residents-intro", "section": "program", "owner": "residents", "order": 0, "title": {"zh": "住院醫師訓練簡介"},
       "body": {"zh": [{"type": "paragraph", "runs": [{"text": "簡介"}]}]}},
      {"id": "residents-outcomes", "section": "program", "owner": "residents", "order": 1, "title": {"zh": "訓練成果"},
       "body": {"zh": [{"type": "divider"}]}},
      {"id": "pgy-schedule", "section": "program", "owner": "pgy", "order": 0, "title": {"zh": "訓練計劃與排程"},
       "body": {"zh": [{"type": "divider"}]}},
      {"id": "ebm-intro", "section": "center", "owner": "ebm", "order": 0, "title": {"zh": "中心簡介"},
       "body": {"zh": [{"type": "divider"}]}}
    ],
    "programs": [
      {"id": "residents", "order": 0, "title": {"zh": "住院醫師", "en": "Residents"}, "summary": {"zh": "住院醫師訓練", "en": "Residency training"},
       "cover": {"kind": "local", "path": "assets/legacy/page/aaaaaaaaaaaaaaaaaaaa.webp"},
       "introPageId": "residents-intro", "outcomesPageId": "residents-outcomes"},
      {"id": "pgy", "order": 1, "title": {"zh": "PGY", "en": "PGY"}, "summary": {"zh": "畢業後一般醫學訓練", "en": "Post-graduate year training"},
       "schedulePageId": "pgy-schedule"},
      {"id": "medical-students", "order": 2, "title": {"zh": "醫學生", "en": "Medical Students"}, "summary": {"zh": "醫學系見實習", "en": "Clerkship and internship"}},
      {"id": "allied-health-trainees", "order": 3, "title": {"zh": "醫事學員", "en": "Allied Health Trainees"}, "summary": {"zh": "醫事人員訓練", "en": "Allied health training"}},
      {"id": "joint-training", "order": 4, "title": {"zh": "聯合訓練", "en": "Joint Training"}, "summary": {"zh": "聯合訓練計畫", "en": "Joint training programme"}}
    ],
    "linkGroups": [
      {"id": "related-links", "owner": "department", "purpose": "related", "order": 0, "title": {"zh": "相關連結", "en": "Related Links"},
       "links": [
         {"id": "moe", "label": {"zh": "教育部"}, "description": {"zh": "教育部網站"}, "href": "https://www.edu.example"},
         {"id": "legacy-portal", "label": {"zh": "舊入口"}, "href": "http://portal.example/"}
       ]},
      {"id": "systems", "owner": "department", "purpose": "systems", "order": 1, "title": {"zh": "系統", "en": "Systems"},
       "links": [{"id": "moe", "label": {"zh": "E-Portfolio"}, "href": "https://eportfolio.example"}]},
      {"id": "pgy-common", "owner": "pgy", "purpose": "common", "order": 2, "title": {"zh": "常用資訊"}, "links": []}
    ],
    "downloads": [
      {"id": "forms", "owner": "department", "title": {"zh": "表單下載", "en": "Forms"},
       "items": [
         {"id": "leave-form", "label": {"zh": "請假單"}, "href": "files/legacy/forms/leave.docx", "publishedOn": "2022-03-01"},
         {"id": "online-form", "label": {"zh": "線上表單"}, "href": "https://forms.example/x"}
       ]}
    ]
  }$json$::jsonb
),
(
  'gallery',
  $json${
    "contentModel": "localized-fields-v1",
    "albums": [
      {"id": "alb-2023-orientation", "owner": "residents", "title": {"zh": "新進住院醫師迎新", "en": "Resident orientation"},
       "date": "2023-08-01", "description": {"zh": "活動花絮"},
       "cover": {"kind": "local", "path": "assets/legacy/album/aaaaaaaaaaaaaaaaaaaa.webp"},
       "photos": [
         {"id": "1", "media": {"kind": "local", "path": "assets/legacy/album/bbbbbbbbbbbbbbbbbbbb.webp"},
          "alt": {"zh": "合照"}, "caption": {"zh": "迎新合照", "en": "Group photo"}, "width": 1600, "height": 1067},
         {"id": "2", "media": {"kind": "public", "bucket": "public-media", "path": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.jpg"}}
       ]},
      {"id": "ebm-workshop", "owner": "ebm", "title": {"zh": "實證工作坊"},
       "photos": [{"id": "1", "media": {"kind": "local", "path": "assets/legacy/album/cccccccccccccccccccc.webp"}}]}
    ],
    "videos": [
      {"id": "pgy-intro", "owner": "pgy", "title": {"zh": "PGY 介紹"}, "youtubeId": "dQw4w9WgXcQ", "publishedOn": "2021-06-01",
       "description": {"zh": "影片介紹", "en": "Video introduction"}},
      {"id": "holistic-talk", "owner": "holistic", "title": {"zh": "全人照護講座", "en": "Holistic care talk"}, "youtubeId": "a_b-C1d2E3f"}
    ]
  }$json$::jsonb
);

create temporary table archive_boundary_payloads (
  name text primary key,
  kind public.cms_document_kind not null,
  payload jsonb not null
) on commit drop;

create temporary table archive_invalid_payloads (
  name text primary key,
  kind public.cms_document_kind not null,
  payload jsonb not null
) on commit drop;

create function pg_temp.archive_generated_posts(post_count integer)
returns jsonb language sql immutable as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', 'generated-' || series.n,
    'channel', 'news',
    'categoryId', 'faculty',
    'owner', 'department',
    'publishedOn', '2020-01-01',
    'pinned', false,
    'title', jsonb_build_object('zh', '公告 ' || series.n),
    'body', jsonb_build_object('zh', jsonb_build_array(jsonb_build_object('type', 'divider'))),
    'attachments', '[]'::jsonb
  ) order by series.n), '[]'::jsonb)
  from generate_series(1, post_count) as series(n);
$$;

create function pg_temp.archive_generated_photos(photo_count integer)
returns jsonb language sql immutable as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', 'photo-' || series.n,
    'media', jsonb_build_object('kind', 'local', 'path', 'assets/legacy/album/photo-' || series.n || '.webp')
  ) order by series.n), '[]'::jsonb)
  from generate_series(1, photo_count) as series(n);
$$;

with posts as (select payload from archive_valid_payloads where kind = 'posts'),
gallery as (select payload from archive_valid_payloads where kind = 'gallery'),
department as (select payload from archive_valid_payloads where kind = 'department_info')
insert into archive_boundary_payloads (name, kind, payload)
select 'archive_posts_at_post_cap', 'posts'::public.cms_document_kind, jsonb_set(payload, '{posts}', pg_temp.archive_generated_posts(3000)) from posts
union all select 'archive_posts_at_block_cap', 'posts', jsonb_set(payload, '{posts,1,body,zh}', (select jsonb_agg('{"type":"divider"}'::jsonb) from generate_series(1, 500))) from posts
union all select 'archive_posts_at_length_caps', 'posts', jsonb_set(jsonb_set(jsonb_set(payload,
    '{posts,1,title}', jsonb_build_object('zh', repeat('字', 200), 'en', repeat('a', 200))),
    '{posts,1,summary}', jsonb_build_object('zh', repeat('字', 500))),
    '{posts,1,body,zh,0,runs,0,text}', to_jsonb(repeat('字', 10000))) from posts
union all select 'archive_posts_without_optional_english', 'posts', jsonb_set(payload #- '{posts,0,title,en}' #- '{posts,0,body,en}', '{categories,0,label}', '{"zh":"院內課程"}') from posts
union all select 'archive_posts_run_edge_whitespace', 'posts', jsonb_set(payload, '{posts,0,body,zh,0,runs,0,text}', to_jsonb(text U&'\3000本院 ')) from posts
union all select 'archive_posts_run_single_space', 'posts', jsonb_set(payload, '{posts,0,body,zh,0,runs,0,text}', '" "') from posts
union all select 'archive_posts_title_ideographic_indent', 'posts', jsonb_set(payload, '{posts,0,title,zh}', to_jsonb(text U&'\3000公告\3000')) from posts
union all select 'archive_posts_title_interior_tab', 'posts', jsonb_set(payload, '{posts,0,title,zh}', to_jsonb(text E'公\t告')) from posts
union all select 'archive_posts_attachment_only_body', 'posts', jsonb_set(payload, '{posts,1,body,zh}', '[]') from posts
union all select 'archive_posts_empty_audiences', 'posts', jsonb_set(payload, '{posts,0,audiences}', '[]') from posts
union all select 'archive_posts_uppercase_http_scheme', 'posts', jsonb_set(payload, '{posts,0,body,zh,0,runs,2,href}', '"HTTP://eportfolio.example/login"') from posts
union all select 'archive_gallery_at_photo_cap', 'gallery', jsonb_set(payload, '{albums,1,photos}', pg_temp.archive_generated_photos(500)) from gallery
union all select 'archive_gallery_empty_collections', 'gallery', '{"contentModel":"localized-fields-v1","albums":[],"videos":[]}'::jsonb from gallery
union all select 'archive_department_without_pages', 'department_info', jsonb_set(
    jsonb_set(payload, '{pages}', '[]'),
    '{programs}', (select jsonb_agg(program.value - 'introPageId' - 'outcomesPageId' - 'schedulePageId') from jsonb_array_elements(payload -> 'programs') as program(value))
  ) from department;

with fixture as (select payload from archive_valid_payloads where kind = 'posts')
insert into archive_invalid_payloads (name, kind, payload)
select 'archive_posts_title_en_empty', 'posts'::public.cms_document_kind, jsonb_set(payload, '{posts,0,title,en}', '""') from fixture
union all select 'archive_posts_title_missing_zh', 'posts', jsonb_set(payload, '{posts,0,title}', '{"en":"Title"}') from fixture
union all select 'archive_posts_title_unknown_locale', 'posts', jsonb_set(payload, '{posts,0,title,ja}', '"タイトル"') from fixture
union all select 'archive_posts_title_control_character', 'posts', jsonb_set(payload, '{posts,0,title,zh}', '"公告\u0007"') from fixture
union all select 'archive_posts_title_delete_character', 'posts', jsonb_set(payload, '{posts,0,title,zh}', '"公告\u007f"') from fixture
union all select 'archive_posts_title_leading_whitespace', 'posts', jsonb_set(payload, '{posts,0,title,zh}', '" 公告"') from fixture
union all select 'archive_posts_title_blank', 'posts', jsonb_set(payload, '{posts,0,title,zh}', to_jsonb(text U&'\3000\3000')) from fixture
union all select 'archive_posts_title_leading_tab', 'posts', jsonb_set(payload, '{posts,0,title,zh}', to_jsonb(text E'\t公告')) from fixture
union all select 'archive_posts_title_newline', 'posts', jsonb_set(payload, '{posts,0,title,zh}', '"公告\n標題"') from fixture
union all select 'archive_posts_title_over_length', 'posts', jsonb_set(payload, '{posts,0,title,zh}', to_jsonb(repeat('字', 201))) from fixture
union all select 'archive_posts_title_astral_over_length', 'posts', jsonb_set(payload, '{posts,0,title,zh}', to_jsonb(repeat(U&'\+01F600', 101))) from fixture
union all select 'archive_posts_summary_over_length', 'posts', jsonb_set(payload, '{posts,0,summary,zh}', to_jsonb(repeat('字', 501))) from fixture
union all select 'archive_posts_category_label_over_length', 'posts', jsonb_set(payload, '{categories,0,label,zh}', to_jsonb(repeat('字', 121))) from fixture
union all select 'archive_posts_run_over_length', 'posts', jsonb_set(payload, '{posts,0,body,zh,0,runs,0,text}', to_jsonb(repeat('字', 10001))) from fixture
union all select 'archive_posts_run_empty_text', 'posts', jsonb_set(payload, '{posts,0,body,zh,0,runs,0,text}', '""') from fixture
union all select 'archive_posts_run_carriage_return', 'posts', jsonb_set(payload, '{posts,0,body,zh,0,runs,0,text}', '"本院\r\n教學"') from fixture
union all select 'archive_posts_run_strong_false', 'posts', jsonb_set(payload, '{posts,0,body,zh,0,runs,1,strong}', 'false') from fixture
union all select 'archive_posts_run_unknown_mark', 'posts', jsonb_set(payload, '{posts,0,body,zh,0,runs,1,italic}', 'true') from fixture
union all select 'archive_posts_empty_runs', 'posts', jsonb_set(payload, '{posts,0,body,zh,0,runs}', '[]') from fixture
union all select 'archive_posts_href_javascript', 'posts', jsonb_set(payload, '{posts,0,body,zh,0,runs,1,href}', '"javascript:alert(1)"') from fixture
union all select 'archive_posts_href_data', 'posts', jsonb_set(payload, '{posts,0,body,zh,0,runs,1,href}', '"data:text/html,<p>x</p>"') from fixture
union all select 'archive_posts_href_credentials', 'posts', jsonb_set(payload, '{posts,0,body,zh,0,runs,1,href}', '"https://user:secret@tmuh.example/apply"') from fixture
union all select 'archive_posts_href_http_credentials', 'posts', jsonb_set(payload, '{posts,0,body,zh,0,runs,2,href}', '"http://user@eportfolio.example/login"') from fixture
union all select 'archive_posts_href_protocol_relative', 'posts', jsonb_set(payload, '{posts,0,body,zh,0,runs,3,href}', '"//evil.example/announcements"') from fixture
union all select 'archive_posts_href_malformed_double_scheme', 'posts', jsonb_set(payload, '{posts,0,body,zh,0,runs,2,href}', '"http://https://library.example/"') from fixture
union all select 'archive_posts_href_relative_path', 'posts', jsonb_set(payload, '{posts,0,body,zh,0,runs,3,href}', '"announcements"') from fixture
union all select 'archive_posts_href_internal_whitespace', 'posts', jsonb_set(payload, '{posts,0,body,zh,0,runs,3,href}', '"/announcements page"') from fixture
union all select 'archive_posts_href_mailto_whitespace', 'posts', jsonb_set(payload, '{posts,0,body,zh,0,runs,4,href}', '"mailto:edu team@tmuh.example"') from fixture
union all select 'archive_posts_href_tel_letters', 'posts', jsonb_set(payload, '{posts,0,body,zh,0,runs,5,href}', '"tel:02-TMUH"') from fixture
union all select 'archive_posts_href_ftp', 'posts', jsonb_set(payload, '{posts,0,body,zh,0,runs,1,href}', '"ftp://tmuh.example/file"') from fixture
union all select 'archive_posts_unknown_category', 'posts', jsonb_set(payload, '{posts,0,categoryId}', '"other"') from fixture
union all select 'archive_posts_channel_mismatch', 'posts', jsonb_set(payload, '{posts,0,channel}', '"honors"') from fixture
union all select 'archive_posts_unknown_channel', 'posts', jsonb_set(payload, '{posts,0,channel}', '"blog"') from fixture
union all select 'archive_posts_center_department_owner', 'posts', jsonb_set(payload, '{posts,1,owner}', '"department"') from fixture
union all select 'archive_posts_unknown_owner', 'posts', jsonb_set(payload, '{posts,0,owner}', '"residents"') from fixture
union all select 'archive_posts_duplicate_id', 'posts', jsonb_set(payload, '{posts,1,id}', '"185"') from fixture
union all select 'archive_posts_invalid_id', 'posts', jsonb_set(payload, '{posts,0,id}', '"Bad_ID"') from fixture
union all select 'archive_posts_id_over_length', 'posts', jsonb_set(payload, '{posts,0,id}', to_jsonb(repeat('a', 81))) from fixture
union all select 'archive_posts_duplicate_attachment_id', 'posts', jsonb_set(payload, '{posts,0,attachments,1,id}', '"schedule"') from fixture
union all select 'archive_posts_attachment_dot_segment', 'posts', jsonb_set(payload, '{posts,0,attachments,0,href}', '"files/legacy/../secret.pdf"') from fixture
union all select 'archive_posts_attachment_bad_extension', 'posts', jsonb_set(payload, '{posts,0,attachments,0,href}', '"files/legacy/2024/run.exe"') from fixture
union all select 'archive_posts_attachment_outside_legacy', 'posts', jsonb_set(payload, '{posts,0,attachments,0,href}', '"files/other/schedule.pdf"') from fixture
union all select 'archive_posts_duplicate_audience', 'posts', jsonb_set(payload, '{posts,0,audiences}', '["pgy","pgy"]') from fixture
union all select 'archive_posts_unknown_audience', 'posts', jsonb_set(payload, '{posts,0,audiences}', '["department"]') from fixture
union all select 'archive_posts_invalid_published_on', 'posts', jsonb_set(payload, '{posts,0,publishedOn}', '"2023-02-29"') from fixture
union all select 'archive_posts_pinned_string', 'posts', jsonb_set(payload, '{posts,0,pinned}', '"true"') from fixture
union all select 'archive_posts_missing_category', 'posts', payload #- '{categories,13}' from fixture
union all select 'archive_posts_duplicate_category', 'posts', jsonb_set(payload, '{categories,13}', payload #> '{categories,0}') from fixture
union all select 'archive_posts_extra_category', 'posts', jsonb_set(payload, '{categories}', (payload -> 'categories') || '[{"id":"blog","channel":"news","label":{"zh":"部落格"},"order":14}]') from fixture
union all select 'archive_posts_category_channel_changed', 'posts', jsonb_set(payload, '{categories,0,channel}', '"honors"') from fixture
union all select 'archive_posts_category_negative_order', 'posts', jsonb_set(payload, '{categories,0,order}', '-1') from fixture
union all select 'archive_posts_category_fractional_order', 'posts', jsonb_set(payload, '{categories,0,order}', '1.5') from fixture
union all select 'archive_posts_draft_cover', 'posts', jsonb_set(payload, '{posts,0,cover}', '{"kind":"draft","bucket":"draft-media","path":"88000000-0000-4000-8000-000000000001/1111111111111111111111111111111111111111111111111111111111111111.webp"}') from fixture
union all select 'archive_posts_unknown_block_type', 'posts', jsonb_set(payload, '{posts,0,body,zh,8}', '{"type":"html","html":"<b>x</b>"}') from fixture
union all select 'archive_posts_heading_level_four', 'posts', jsonb_set(payload, '{posts,0,body,zh,1,level}', '4') from fixture
union all select 'archive_posts_heading_over_length', 'posts', jsonb_set(payload, '{posts,0,body,zh,1,text}', to_jsonb(repeat('字', 201))) from fixture
union all select 'archive_posts_empty_en_blocks', 'posts', jsonb_set(payload, '{posts,0,body,en}', '[]') from fixture
union all select 'archive_posts_body_missing_zh', 'posts', payload #- '{posts,0,body,zh}' from fixture
union all select 'archive_posts_too_many_blocks', 'posts', jsonb_set(payload, '{posts,1,body,zh}', (select jsonb_agg('{"type":"divider"}'::jsonb) from generate_series(1, 501))) from fixture
union all select 'archive_posts_bad_block_youtube_id', 'posts', jsonb_set(payload, '{posts,0,body,zh,9,youtubeId}', '"dQw4w9WgXc"') from fixture
union all select 'archive_posts_table_too_many_columns', 'posts', jsonb_set(payload, '{posts,0,body,zh,7,rows,0}', (select jsonb_agg(to_jsonb(n::text)) from generate_series(1, 51) as n)) from fixture
union all select 'archive_posts_table_empty_rows', 'posts', jsonb_set(payload, '{posts,0,body,zh,7,rows}', '[]') from fixture
union all select 'archive_posts_table_empty_row', 'posts', jsonb_set(payload, '{posts,0,body,zh,7,rows,0}', '[]') from fixture
union all select 'archive_posts_table_cell_whitespace', 'posts', jsonb_set(payload, '{posts,0,body,zh,7,rows,0,0}', '" 09:00"') from fixture
union all select 'archive_posts_table_cell_blank', 'posts', jsonb_set(payload, '{posts,0,body,zh,7,rows,0,0}', to_jsonb(text U&'\3000')) from fixture
union all select 'archive_posts_table_cell_over_length', 'posts', jsonb_set(payload, '{posts,0,body,zh,7,rows,0,0}', to_jsonb(repeat('字', 1001))) from fixture
union all select 'archive_posts_image_zero_width', 'posts', jsonb_set(payload, '{posts,0,body,zh,5,width}', '0') from fixture
union all select 'archive_posts_image_missing_alt', 'posts', payload #- '{posts,0,body,zh,5,alt}' from fixture
union all select 'archive_posts_image_url_media', 'posts', jsonb_set(payload, '{posts,0,body,zh,5,media}', '"https://tmuh.example/poster.jpg"') from fixture
union all select 'archive_posts_empty_list_item', 'posts', jsonb_set(payload, '{posts,0,body,zh,3,items,0}', '[]') from fixture
union all select 'archive_posts_empty_list', 'posts', jsonb_set(payload, '{posts,0,body,zh,3,items}', '[]') from fixture
union all select 'archive_posts_divider_extra_key', 'posts', jsonb_set(payload, '{posts,0,body,zh,8,style}', '"dashed"') from fixture
union all select 'archive_posts_wrong_content_model', 'posts', jsonb_set(payload, '{contentModel}', '"localized-fields-v2"') from fixture
union all select 'archive_posts_missing_content_model', 'posts', payload - 'contentModel' from fixture
union all select 'archive_posts_unknown_top_key', 'posts', jsonb_set(payload, '{zh}', '{}') from fixture
union all select 'archive_posts_over_post_cap', 'posts', jsonb_set(payload, '{posts}', pg_temp.archive_generated_posts(3001)) from fixture;

with fixture as (select payload from archive_valid_payloads where kind = 'department_info')
insert into archive_invalid_payloads (name, kind, payload)
select 'archive_department_wrong_program_set', 'department_info'::public.cms_document_kind, payload #- '{programs,4}' from fixture
union all select 'archive_department_unknown_program', 'department_info', jsonb_set(payload, '{programs,4,id}', '"fellows"') from fixture
union all select 'archive_department_duplicate_program', 'department_info', jsonb_set(payload, '{programs,4}', payload #> '{programs,3}') from fixture
union all select 'archive_department_dangling_program_page_ref', 'department_info', jsonb_set(payload, '{programs,0,introPageId}', '"missing-page"') from fixture
union all select 'archive_department_program_ref_wrong_section', 'department_info', jsonb_set(payload, '{programs,0,introPageId}', '"director-message"') from fixture
union all select 'archive_department_program_ref_wrong_owner', 'department_info', jsonb_set(payload, '{programs,0,outcomesPageId}', '"pgy-schedule"') from fixture
union all select 'archive_department_program_ref_ownerless_page', 'department_info', payload #- '{pages,2,owner}' from fixture
union all select 'archive_department_program_title_en_empty', 'department_info', jsonb_set(payload, '{programs,1,title,en}', '""') from fixture
union all select 'archive_department_duplicate_page_id', 'department_info', jsonb_set(payload, '{pages,1,id}', '"director-message"') from fixture
union all select 'archive_department_unknown_section', 'department_info', jsonb_set(payload, '{pages,1,section}', '"news"') from fixture
union all select 'archive_department_unknown_page_owner', 'department_info', jsonb_set(payload, '{pages,0,owner}', '"admin"') from fixture
union all select 'archive_department_page_title_en_empty', 'department_info', jsonb_set(payload, '{pages,0,title,en}', '""') from fixture
union all select 'archive_department_page_body_en_empty', 'department_info', jsonb_set(payload, '{pages,1,body,en}', '[]') from fixture
union all select 'archive_department_page_invalid_updated_on', 'department_info', jsonb_set(payload, '{pages,0,updatedOn}', '"2024-04-31"') from fixture
union all select 'archive_department_draft_portrait', 'department_info', jsonb_set(payload, '{pages,0,portrait}', '{"kind":"draft","bucket":"draft-media","path":"88000000-0000-4000-8000-000000000001/1111111111111111111111111111111111111111111111111111111111111111.webp"}') from fixture
union all select 'archive_department_duplicate_link_group_id', 'department_info', jsonb_set(payload, '{linkGroups,1,id}', '"related-links"') from fixture
union all select 'archive_department_duplicate_link_id', 'department_info', jsonb_set(payload, '{linkGroups,0,links,1,id}', '"moe"') from fixture
union all select 'archive_department_unknown_purpose', 'department_info', jsonb_set(payload, '{linkGroups,0,purpose}', '"misc"') from fixture
union all select 'archive_department_link_href_javascript', 'department_info', jsonb_set(payload, '{linkGroups,0,links,0,href}', '"javascript:void(0)"') from fixture
union all select 'archive_department_link_local_file_href', 'department_info', jsonb_set(payload, '{linkGroups,0,links,0,href}', '"files/legacy/forms/leave.docx"') from fixture
union all select 'archive_department_link_description_en_empty', 'department_info', jsonb_set(payload, '{linkGroups,0,links,0,description,en}', '""') from fixture
union all select 'archive_department_download_bad_href', 'department_info', jsonb_set(payload, '{downloads,0,items,0,href}', '"C:\\forms\\leave.docx"') from fixture
union all select 'archive_department_duplicate_download_item_id', 'department_info', jsonb_set(payload, '{downloads,0,items,1,id}', '"leave-form"') from fixture
union all select 'archive_department_duplicate_download_id', 'department_info', jsonb_set(payload, '{downloads}', (payload -> 'downloads') || (payload -> 'downloads')) from fixture
union all select 'archive_department_wrong_content_model', 'department_info', jsonb_set(payload, '{contentModel}', '"bilingual"') from fixture;

with fixture as (select payload from archive_valid_payloads where kind = 'gallery')
insert into archive_invalid_payloads (name, kind, payload)
select 'archive_gallery_empty_album_photos', 'gallery'::public.cms_document_kind, jsonb_set(payload, '{albums,1,photos}', '[]') from fixture
union all select 'archive_gallery_too_many_photos', 'gallery', jsonb_set(payload, '{albums,1,photos}', pg_temp.archive_generated_photos(501)) from fixture
union all select 'archive_gallery_duplicate_album_id', 'gallery', jsonb_set(payload, '{albums,1,id}', '"alb-2023-orientation"') from fixture
union all select 'archive_gallery_duplicate_photo_id', 'gallery', jsonb_set(payload, '{albums,0,photos,1,id}', '"1"') from fixture
union all select 'archive_gallery_duplicate_youtube_id', 'gallery', jsonb_set(payload, '{videos,1,youtubeId}', '"dQw4w9WgXcQ"') from fixture
union all select 'archive_gallery_duplicate_video_id', 'gallery', jsonb_set(payload, '{videos,1,id}', '"pgy-intro"') from fixture
union all select 'archive_gallery_bad_youtube_id', 'gallery', jsonb_set(payload, '{videos,0,youtubeId}', '"dQw4w9WgXc!"') from fixture
union all select 'archive_gallery_short_youtube_id', 'gallery', jsonb_set(payload, '{videos,0,youtubeId}', '"dQw4w9WgXc"') from fixture
union all select 'archive_gallery_youtube_url_instead_of_id', 'gallery', jsonb_set(payload, '{videos,0,youtubeId}', '"https://www.youtube.com/watch?v=dQw4w9WgXcQ"') from fixture
union all select 'archive_gallery_photo_zero_height', 'gallery', jsonb_set(payload, '{albums,0,photos,0,height}', '0') from fixture
union all select 'archive_gallery_photo_alt_en_empty', 'gallery', jsonb_set(payload, '{albums,0,photos,0,alt,en}', '""') from fixture
union all select 'archive_gallery_photo_url_media', 'gallery', jsonb_set(payload, '{albums,0,photos,0,media}', '"https://tmuh.example/photo.jpg"') from fixture
union all select 'archive_gallery_draft_photo_media', 'gallery', jsonb_set(payload, '{albums,0,photos,0,media}', '{"kind":"draft","bucket":"draft-media","path":"88000000-0000-4000-8000-000000000001/1111111111111111111111111111111111111111111111111111111111111111.webp"}') from fixture
union all select 'archive_gallery_unknown_owner', 'gallery', jsonb_set(payload, '{albums,0,owner}', '"admin"') from fixture
union all select 'archive_gallery_unknown_video_owner', 'gallery', jsonb_set(payload, '{videos,0,owner}', '"tmuh"') from fixture
union all select 'archive_gallery_invalid_album_date', 'gallery', jsonb_set(payload, '{albums,0,date}', '"2023/08/01"') from fixture
union all select 'archive_gallery_album_title_missing_zh', 'gallery', jsonb_set(payload, '{albums,0,title}', '{"en":"Resident orientation"}') from fixture
union all select 'archive_gallery_video_description_whitespace', 'gallery', jsonb_set(payload, '{videos,0,description,zh}', '"影片介紹 "') from fixture
union all select 'archive_gallery_missing_content_model', 'gallery', payload - 'contentModel' from fixture;

create temporary table archive_save_outcomes (
  name text primary key,
  sqlstate text,
  detail text
) on commit drop;

grant select on table archive_valid_payloads, archive_boundary_payloads, archive_invalid_payloads to authenticated;
grant select, insert on table archive_save_outcomes to authenticated;

insert into public.cms_documents (id, kind, stable_key)
values
  ('88000000-0000-4000-8000-000000000010', 'posts', 'archive-contract-save'),
  ('88000000-0000-4000-8000-000000000020', 'department_info', 'archive-contract-save'),
  ('88000000-0000-4000-8000-000000000030', 'gallery', 'archive-contract-save'),
  ('88000000-0000-4000-8000-000000000040', 'gallery', 'archive-contract-media'),
  ('88000000-0000-4000-8000-000000000050', 'posts', 'archive-contract-publish'),
  ('88000000-0000-4000-8000-000000000060', 'department_info', 'archive-contract-publish'),
  ('88000000-0000-4000-8000-000000000070', 'gallery', 'archive-contract-publish'),
  ('88000000-0000-4000-8000-000000000080', 'posts', 'archive-contract-constraint-empty'),
  ('88000000-0000-4000-8000-000000000081', 'posts', 'archive-contract-constraint-envelope'),
  ('88000000-0000-4000-8000-000000000082', 'posts', 'archive-contract-constraint-model'),
  ('88000000-0000-4000-8000-000000000083', 'news', 'archive-contract-constraint-bilingual');

insert into public.cms_revisions (id, document_id, version, status, payload)
values
  ('88000000-0000-4000-8000-000000000011', '88000000-0000-4000-8000-000000000010', 1, 'draft', '{"zh":{},"en":{}}'),
  ('88000000-0000-4000-8000-000000000021', '88000000-0000-4000-8000-000000000020', 1, 'draft', '{"zh":{},"en":{}}'),
  ('88000000-0000-4000-8000-000000000031', '88000000-0000-4000-8000-000000000030', 1, 'draft', '{"zh":{},"en":{}}'),
  ('88000000-0000-4000-8000-000000000041', '88000000-0000-4000-8000-000000000040', 1, 'draft', '{"zh":{},"en":{}}');

insert into storage.objects (bucket_id, name, owner_id, metadata) values
  ('draft-media', '88000000-0000-4000-8000-000000000001/' || repeat('1', 64) || '.webp', '88000000-0000-4000-8000-000000000001', '{"mimetype":"image/webp","size":1}'),
  ('draft-media', '88000000-0000-4000-8000-000000000001/' || repeat('2', 64) || '.jpg', '88000000-0000-4000-8000-000000000001', '{"mimetype":"image/jpeg","size":1}'),
  ('draft-media', '88000000-0000-4000-8000-000000000002/' || repeat('3', 64) || '.png', '88000000-0000-4000-8000-000000000002', '{"mimetype":"image/png","size":1}');

create temporary table archive_draft_media_payloads on commit drop as
with refs as (
  select
    jsonb_build_object('kind', 'draft', 'bucket', 'draft-media', 'path', '88000000-0000-4000-8000-000000000001/' || repeat('1', 64) || '.webp') as first_ref,
    jsonb_build_object('kind', 'draft', 'bucket', 'draft-media', 'path', '88000000-0000-4000-8000-000000000001/' || repeat('2', 64) || '.jpg') as second_ref,
    jsonb_build_object('kind', 'draft', 'bucket', 'draft-media', 'path', '88000000-0000-4000-8000-000000000002/' || repeat('3', 64) || '.png') as foreign_ref
)
select
  jsonb_set(
    jsonb_set((select payload from archive_valid_payloads where kind = 'posts'), '{posts,0,body,zh,5,media}', refs.first_ref),
    '{posts,0,cover}', refs.second_ref
  ) as posts_payload,
  jsonb_set(
    jsonb_set(
      jsonb_set((select payload from archive_valid_payloads where kind = 'department_info'), '{pages,0,portrait}', refs.second_ref),
      '{pages,0,body,zh}', (select payload #> '{pages,0,body,zh}' from archive_valid_payloads where kind = 'department_info')
        || jsonb_build_array(jsonb_build_object('type', 'image', 'media', refs.first_ref, 'alt', '主任照片'))
    ),
    '{programs,0,cover}', refs.first_ref
  ) as department_payload,
  jsonb_set(
    jsonb_set((select payload from archive_valid_payloads where kind = 'gallery'), '{albums,0,photos,0,media}', refs.first_ref),
    '{albums,0,cover}', refs.second_ref
  ) as gallery_payload,
  jsonb_set((select payload from archive_valid_payloads where kind = 'gallery'), '{albums,0,photos,1,media}', refs.foreign_ref) as foreign_gallery_payload,
  jsonb_set(
    (select payload from archive_valid_payloads where kind = 'posts'),
    '{posts,0,body,zh,5,media}',
    '{"kind":"draft","bucket":"draft-media","path":"malformed"}'
  ) as malformed_posts_payload,
  jsonb_build_object(
    '88000000-0000-4000-8000-000000000001/' || repeat('1', 64) || '.webp',
    jsonb_build_object('kind', 'public', 'bucket', 'public-media', 'path', repeat('1', 64) || '/' || repeat('1', 64) || '.webp'),
    '88000000-0000-4000-8000-000000000001/' || repeat('2', 64) || '.jpg',
    jsonb_build_object('kind', 'public', 'bucket', 'public-media', 'path', repeat('2', 64) || '/' || repeat('2', 64) || '.jpg')
  ) as replacements
from refs;

grant select on table archive_draft_media_payloads to authenticated, service_role;

-- Kind enum, helper graph, and privileges.
select is(
  (select (enum_range(null::public.cms_document_kind))[13:15]::text[]),
  array['posts', 'department_info', 'gallery'],
  'archive_kinds_appended_after_existing_kinds'
);
select ok(
  (
    select count(*) = 19
      and bool_and(provolatile = 'i' and proisstrict and not prosecdef)
      and bool_and(coalesce(proconfig, '{}'::text[]) @> array['search_path=""'])
      and bool_and(pg_get_userbyid(proowner) = 'postgres')
      and bool_and(
        not has_function_privilege('public', oid, 'execute')
        and not has_function_privilege('anon', oid, 'execute')
        and not has_function_privilege('authenticated', oid, 'execute')
      )
    from pg_proc
    where oid = any(array[
      to_regprocedure('public.cms_jsonb_is_text_value(jsonb,integer,boolean,boolean)'),
      to_regprocedure('public.cms_jsonb_is_plain_text(jsonb,integer,boolean)'),
      to_regprocedure('public.cms_jsonb_is_run_text(jsonb)'),
      to_regprocedure('public.cms_jsonb_is_localized_text(jsonb,integer)'),
      to_regprocedure('public.cms_jsonb_is_slug_id(jsonb)'),
      to_regprocedure('public.cms_jsonb_is_iso_calendar_date(jsonb)'),
      to_regprocedure('public.cms_jsonb_is_safe_integer(jsonb,numeric)'),
      to_regprocedure('public.cms_jsonb_array_has_unique_field(jsonb,text)'),
      to_regprocedure('public.cms_jsonb_is_link_href(jsonb)'),
      to_regprocedure('public.cms_jsonb_is_local_file_path(jsonb)'),
      to_regprocedure('public.cms_jsonb_is_youtube_id(jsonb)'),
      to_regprocedure('public.cms_jsonb_is_content_runs(jsonb)'),
      to_regprocedure('public.cms_jsonb_is_table_row(jsonb)'),
      to_regprocedure('public.cms_jsonb_is_content_block(jsonb)'),
      to_regprocedure('public.cms_jsonb_is_content_block_array(jsonb,integer)'),
      to_regprocedure('public.cms_jsonb_is_localized_blocks(jsonb)'),
      to_regprocedure('public.cms_posts_payload_is_publishable(jsonb)'),
      to_regprocedure('public.cms_department_info_payload_is_publishable(jsonb)'),
      to_regprocedure('public.cms_gallery_payload_is_publishable(jsonb)')
    ]::oid[])
  ),
  'archive_validators_are_hardened_internal_predicates'
);

-- Text and href corpora.
select results_eq(
  $$
    select name
    from (values
      ('plain', '公告', false, true),
      ('interior_ideographic_space', U&'公\3000告', false, true),
      ('interior_newline_single_line', E'公\n告', false, false),
      ('interior_newline_multiline', E'公\n告', true, true),
      ('interior_tab_single_line', E'公\t告', false, true),
      ('interior_tab_multiline', E'公\t告', true, true),
      ('carriage_return_multiline', E'公\r告', true, false),
      ('bell', E'公\x07告', true, false),
      ('escape', E'公\x1b告', true, false),
      ('delete', E'公\x7f告', true, false),
      ('empty', '', true, false),
      ('leading_space', ' 公告', true, false),
      ('trailing_newline_multiline', E'公告\n', true, false),
      ('leading_tab', E'\t公告', false, false),
      ('trailing_form_feed', E'公告\f', true, false),
      ('leading_nbsp', U&'\00A0公告', true, true),
      ('leading_ideographic_space', U&'\3000公告', false, true),
      ('trailing_ideographic_space', U&'公告\3000', true, true),
      ('leading_bom', U&'\FEFF公告', true, true),
      ('trailing_line_separator', U&'公告\2028', true, true),
      ('blank_ideographic_spaces', U&'\3000\3000', false, false),
      ('blank_nbsp', U&'\00A0', false, false),
      ('blank_mixed_unicode_spaces', U&'\2003\FEFF\205F', true, false),
      ('at_limit', repeat('字', 10), false, true),
      ('over_limit', repeat('字', 11), false, false),
      ('astral_at_limit', repeat(U&'\+01F600', 5), false, true),
      ('astral_over_limit', repeat(U&'\+01F600', 5) || '字', false, false)
    ) as corpus(name, value, multiline, expected)
    where public.cms_jsonb_is_plain_text(to_jsonb(value), 10, multiline) is distinct from expected
    order by name
  $$,
  array[]::text[],
  'archive_plain_text_rule_corpus'
);
select results_eq(
  $$
    select name
    from (values
      ('plain', '公告', true),
      ('edge_spaces', ' 公告 ', true),
      ('single_space', ' ', true),
      ('ideographic_indent', U&'\3000本院', true),
      ('newline', E'第一行\n第二行', true),
      ('tab', E'a\tb', true),
      ('empty', '', false),
      ('carriage_return', E'a\r\nb', false),
      ('bell', E'a\x07b', false),
      ('at_limit', repeat('字', 10000), true),
      ('over_limit', repeat('字', 10001), false)
    ) as corpus(name, value, expected)
    where public.cms_jsonb_is_run_text(to_jsonb(value)) is distinct from expected
    order by name
  $$,
  array[]::text[],
  'archive_run_text_rule_corpus'
);
select results_eq(
  $$
    select name
    from (values
      ('https', 'https://tmuh.example/a?b=1#c', true),
      ('http', 'http://eportfolio.example/login', true),
      ('internal_root', '/', true),
      ('internal_query_fragment', '/announcements?category=recruitment&page=2#board', true),
      ('internal_reserved', '/a-b_c.d~e/%E5%85%AC!$&''()*+,;=:@', true),
      ('mailto', 'mailto:edu@tmuh.example', true),
      ('tel', 'tel:+886-2-2737-2181', true),
      ('tel_short', 'tel:123', true),
      ('javascript', 'javascript:alert(1)', false),
      ('javascript_mixed_case', 'JavaScript:alert(1)', false),
      ('data', 'data:text/html,x', false),
      ('vbscript', 'vbscript:msgbox', false),
      ('protocol_relative', '//evil.example/a', false),
      ('backslash_relative', '/\evil.example', false),
      ('relative', 'announcements', false),
      ('https_credentials', 'https://user:secret@tmuh.example/', false),
      ('http_credentials', 'http://user@tmuh.example/', false),
      ('http_uppercase_scheme', 'HTTP://tmuh.example/', true),
      ('http_double_scheme', 'http://https://library.example/', false),
      ('http_whitespace', 'http://tmuh.example/a b', false),
      ('internal_whitespace', '/a b', false),
      ('internal_fragment_dot', '/a#b.c', false),
      ('internal_control', E'/a\x01', false),
      ('mailto_whitespace', 'mailto:a b@tmuh.example', false),
      ('mailto_angle', 'mailto:<a>@tmuh.example', false),
      ('mailto_missing_domain', 'mailto:edu@', false),
      ('tel_too_short', 'tel:12', false),
      ('tel_too_long', 'tel:' || repeat('1', 21), false),
      ('tel_letters', 'tel:02-TMUH', false),
      ('ftp', 'ftp://tmuh.example/', false),
      ('empty', '', false)
    ) as corpus(name, value, expected)
    where public.cms_jsonb_is_link_href(to_jsonb(value)) is distinct from expected
    order by name
  $$,
  array[]::text[],
  'archive_link_href_corpus'
);
select results_eq(
  $$
    select name
    from (values
      ('pdf', 'files/legacy/2024/schedule.pdf', true),
      ('docx', 'files/legacy/forms/leave.docx', true),
      ('xls', 'files/legacy/a.xls', true),
      ('pptx', 'files/legacy/a/b/c.pptx', true),
      ('dot_segment', 'files/legacy/../a.pdf', false),
      ('current_segment', 'files/legacy/./a.pdf', false),
      ('uppercase', 'files/legacy/A.pdf', false),
      ('image', 'files/legacy/a.jpg', false),
      ('outside', 'files/a.pdf', false),
      ('leading_slash', '/files/legacy/a.pdf', false)
    ) as corpus(name, value, expected)
    where public.cms_jsonb_is_local_file_path(to_jsonb(value)) is distinct from expected
    order by name
  $$,
  array[]::text[],
  'archive_local_file_path_corpus'
);

-- Valid fixtures and boundaries.
select is((select count(*) from archive_valid_payloads), 3::bigint, 'archive_valid_fixture_cardinality');
select ok(public.cms_posts_payload_is_publishable((select payload from archive_valid_payloads where kind = 'posts')), 'archive_posts_fixture_valid');
select ok(public.cms_department_info_payload_is_publishable((select payload from archive_valid_payloads where kind = 'department_info')), 'archive_department_info_fixture_valid');
select ok(public.cms_gallery_payload_is_publishable((select payload from archive_valid_payloads where kind = 'gallery')), 'archive_gallery_fixture_valid');
select results_eq(
  $$select kind::text from archive_valid_payloads where public.cms_payload_is_publishable(kind, payload) is not true order by kind$$,
  array[]::text[],
  'archive_dispatcher_accepts_every_valid_fixture'
);
select results_eq(
  $$select name from archive_boundary_payloads where public.cms_payload_is_publishable(kind, payload) is not true order by name$$,
  array[]::text[],
  'archive_dispatcher_accepts_every_boundary_fixture'
);
select results_eq(
  $$
    select fixture.kind::text || '->' || target.kind::text
    from archive_valid_payloads as fixture
    cross join (values ('posts'::public.cms_document_kind), ('department_info'), ('gallery'), ('news'), ('site_copy')) as target(kind)
    where fixture.kind <> target.kind
      and public.cms_payload_is_publishable(target.kind, fixture.payload) is not false
    order by 1
  $$,
  array[]::text[],
  'archive_dispatcher_rejects_cross_kind_payloads'
);
select ok(
  public.cms_payload_is_publishable('posts', (select payload from cms_documents as documents join cms_revisions as revisions on revisions.document_id = documents.id where documents.kind = 'news' and revisions.status = 'published' limit 1)) is not true,
  'archive_posts_rejects_bilingual_news_payload'
);

-- Named mutation corpus.
select is((select count(*) from archive_invalid_payloads), 120::bigint, 'archive_invalid_corpus_cardinality');
select results_eq(
  $$
    select invalid.name
    from archive_invalid_payloads as invalid
    join archive_valid_payloads as valid using (kind)
    where invalid.payload = valid.payload
    order by invalid.name
  $$,
  array[]::text[],
  'archive_every_invalid_mutation_changes_its_fixture'
);
select results_eq(
  $$
    select name from archive_invalid_payloads
    where case kind
      when 'posts' then public.cms_posts_payload_is_publishable(payload)
      when 'department_info' then public.cms_department_info_payload_is_publishable(payload)
      when 'gallery' then public.cms_gallery_payload_is_publishable(payload)
    end is not false
    order by name
  $$,
  array[]::text[],
  'archive_kind_validators_reject_every_invalid_mutation'
);
select results_eq(
  $$select name from archive_invalid_payloads where public.cms_payload_is_publishable(kind, payload) is not false order by name$$,
  array[]::text[],
  'archive_dispatcher_rejects_every_invalid_mutation'
);

-- Direct publication through the lifecycle trigger.
select lives_ok(
  $$
    insert into public.cms_revisions (id, document_id, version, status, payload, published_at, published_by)
    values
      ('88000000-0000-4000-8000-000000000051', '88000000-0000-4000-8000-000000000050', 1, 'published',
        (select payload from archive_valid_payloads where kind = 'posts'), statement_timestamp(), '88000000-0000-4000-8000-000000000001'),
      ('88000000-0000-4000-8000-000000000061', '88000000-0000-4000-8000-000000000060', 1, 'published',
        (select payload from archive_valid_payloads where kind = 'department_info'), statement_timestamp(), '88000000-0000-4000-8000-000000000001'),
      ('88000000-0000-4000-8000-000000000071', '88000000-0000-4000-8000-000000000070', 1, 'published',
        (select payload from archive_valid_payloads where kind = 'gallery'), statement_timestamp(), '88000000-0000-4000-8000-000000000001')
  $$,
  'archive_valid_fixtures_publish_directly'
);
select throws_ok(
  $$
    insert into public.cms_revisions (id, document_id, version, status, payload, published_at, published_by)
    values ('88000000-0000-4000-8000-000000000072', '88000000-0000-4000-8000-000000000070', 2, 'published',
      (select payload from archive_invalid_payloads where name = 'archive_gallery_empty_album_photos'), statement_timestamp(), '88000000-0000-4000-8000-000000000001')
  $$,
  '23514',
  'payload does not match CMS document kind gallery',
  'archive_trigger_rejects_invalid_direct_publication'
);
set local role anon;
select results_eq(
  $$select kind::text from public.cms_published_content where stable_key = 'archive-contract-publish' order by 1$$,
  array['department_info', 'gallery', 'posts'],
  'archive_published_rows_are_publicly_readable'
);
reset role;

-- Draft saves.
set local request.jwt.claims = '{"sub":"88000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;
select lives_ok(
  $$
    select public.cms_save_draft('88000000-0000-4000-8000-000000000010', '88000000-0000-4000-8000-000000000011', 1,
      (select payload from archive_valid_payloads where kind = 'posts'));
    select public.cms_save_draft('88000000-0000-4000-8000-000000000020', '88000000-0000-4000-8000-000000000021', 1,
      (select payload from archive_valid_payloads where kind = 'department_info'));
    select public.cms_save_draft('88000000-0000-4000-8000-000000000030', '88000000-0000-4000-8000-000000000031', 1,
      (select payload from archive_valid_payloads where kind = 'gallery'));
  $$,
  'archive_save_draft_accepts_valid_payloads'
);
reset role;
select results_eq(
  $$select edit_version from public.cms_revisions where id in ('88000000-0000-4000-8000-000000000011', '88000000-0000-4000-8000-000000000021', '88000000-0000-4000-8000-000000000031') order by id$$,
  array[2::bigint, 2::bigint, 2::bigint],
  'archive_valid_saves_advance_edit_tokens'
);

-- Every invalid save runs in its own subtransaction against the current edit token; a save that
-- unexpectedly succeeds is recorded and rolled back so it cannot advance the token for later cases.
create function pg_temp.exercise_archive_invalid_saves()
returns void
language plpgsql
as $$
declare
  invalid_case record;
  target_document_id uuid;
  target_revision_id uuid;
  current_edit_version bigint;
  captured_state text;
  captured_detail text;
begin
  for invalid_case in select * from pg_temp.archive_invalid_payloads order by name loop
    target_document_id := case invalid_case.kind
      when 'posts' then '88000000-0000-4000-8000-000000000010'::uuid
      when 'department_info' then '88000000-0000-4000-8000-000000000020'::uuid
      when 'gallery' then '88000000-0000-4000-8000-000000000030'::uuid
    end;
    target_revision_id := case invalid_case.kind
      when 'posts' then '88000000-0000-4000-8000-000000000011'::uuid
      when 'department_info' then '88000000-0000-4000-8000-000000000021'::uuid
      when 'gallery' then '88000000-0000-4000-8000-000000000031'::uuid
    end;
    select revisions.edit_version into current_edit_version
    from public.cms_revisions as revisions where revisions.id = target_revision_id;
    captured_state := null;
    captured_detail := null;
    begin
      perform public.cms_save_draft(target_document_id, target_revision_id, current_edit_version, invalid_case.payload);
      raise exception 'archive save sentinel' using errcode = 'P0001', detail = 'saved';
    exception when others then
      get stacked diagnostics
        captured_state = returned_sqlstate,
        captured_detail = pg_exception_detail;
    end;
    insert into pg_temp.archive_save_outcomes (name, sqlstate, detail)
    values (invalid_case.name, captured_state, captured_detail);
  end loop;
end;
$$;

set local role authenticated;
select pg_temp.exercise_archive_invalid_saves();
reset role;
select is((select count(*) from archive_save_outcomes), 120::bigint, 'archive_save_draft_exercises_every_invalid_mutation');
select results_eq(
  $$
    select name from archive_save_outcomes
    where name not in ('archive_posts_draft_cover', 'archive_department_draft_portrait', 'archive_gallery_draft_photo_media')
      and (sqlstate is distinct from '23514' or detail is distinct from 'cms_contract_invalid')
    order by name
  $$,
  array[]::text[],
  'archive_save_draft_rejects_invalid_payloads_with_contract_error'
);
select results_eq(
  $$
    select name || ':' || coalesce(detail, 'none')
    from archive_save_outcomes
    where name in ('archive_posts_draft_cover', 'archive_department_draft_portrait', 'archive_gallery_draft_photo_media')
    order by name
  $$,
  array['archive_department_draft_portrait:saved', 'archive_gallery_draft_photo_media:saved', 'archive_posts_draft_cover:saved'],
  'archive_owned_draft_media_is_publish_invalid_but_saveable'
);
select ok(
  (select bool_and(edit_version = 2) from public.cms_revisions where id in ('88000000-0000-4000-8000-000000000011', '88000000-0000-4000-8000-000000000021', '88000000-0000-4000-8000-000000000031')),
  'archive_rejected_saves_do_not_advance_edit_tokens'
);

-- Nested draft-media placeholder substitution, ownership, and promotion.
set local role authenticated;
select lives_ok(
  $$select public.cms_save_draft('88000000-0000-4000-8000-000000000040', '88000000-0000-4000-8000-000000000041', 1,
    (select gallery_payload from archive_draft_media_payloads))$$,
  'archive_save_draft_substitutes_nested_gallery_draft_media'
);
reset role;
select is(
  (select array_agg(path order by path) from private.cms_unique_draft_media_paths((select payload from public.cms_revisions where id = '88000000-0000-4000-8000-000000000041')) as paths(path)),
  array[
    '88000000-0000-4000-8000-000000000001/' || repeat('1', 64) || '.webp',
    '88000000-0000-4000-8000-000000000001/' || repeat('2', 64) || '.jpg'
  ],
  'archive_saved_gallery_draft_keeps_nested_draft_references'
);
select ok(
  public.cms_payload_is_publishable('posts', public.cms_apply_media_replacements(
    (select posts_payload from archive_draft_media_payloads),
    jsonb_build_object(
      '88000000-0000-4000-8000-000000000001/' || repeat('1', 64) || '.webp', '{"kind":"local","path":"assets/validation-placeholder.jpg"}'::jsonb,
      '88000000-0000-4000-8000-000000000001/' || repeat('2', 64) || '.jpg', '{"kind":"local","path":"assets/validation-placeholder.jpg"}'::jsonb
    )
  ))
    and public.cms_payload_is_publishable('posts', (select posts_payload from archive_draft_media_payloads)) is false,
  'archive_placeholder_substitution_reaches_image_blocks_and_covers'
);
set local role authenticated;
select lives_ok(
  $$
    select public.cms_save_draft('88000000-0000-4000-8000-000000000010', '88000000-0000-4000-8000-000000000011', 2,
      (select posts_payload from archive_draft_media_payloads));
    select public.cms_save_draft('88000000-0000-4000-8000-000000000020', '88000000-0000-4000-8000-000000000021', 2,
      (select department_payload from archive_draft_media_payloads));
  $$,
  'archive_save_draft_substitutes_draft_media_in_blocks_covers_and_portraits'
);
select throws_ok(
  $$select public.cms_save_draft('88000000-0000-4000-8000-000000000010', '88000000-0000-4000-8000-000000000011', 3,
    (select malformed_posts_payload from archive_draft_media_payloads))$$,
  '22023',
  'malformed draft-like media reference',
  'archive_save_draft_rejects_malformed_nested_draft_reference'
);
select throws_ok(
  $$select public.cms_save_draft('88000000-0000-4000-8000-000000000040', '88000000-0000-4000-8000-000000000041', 2,
    (select foreign_gallery_payload from archive_draft_media_payloads))$$,
  '42501',
  'draft owner mismatch',
  'archive_save_draft_rejects_foreign_nested_draft_media'
);
reset role;

set local role service_role;
select lives_ok(
  $$select public.cms_finalize_media_publication(
    '88000000-0000-4000-8000-000000000040',
    '88000000-0000-4000-8000-000000000041',
    2,
    '88000000-0000-4000-8000-000000000001',
    (select replacements from archive_draft_media_payloads)
  )$$,
  'archive_finalize_promotes_nested_gallery_draft_media'
);
reset role;
select ok(
  (
    select status = 'published'
      and not public.cms_payload_has_draft_media(payload)
      and payload #> '{albums,0,photos,0,media}' = jsonb_build_object('kind', 'public', 'bucket', 'public-media', 'path', repeat('1', 64) || '/' || repeat('1', 64) || '.webp')
      and payload #> '{albums,0,cover}' = jsonb_build_object('kind', 'public', 'bucket', 'public-media', 'path', repeat('2', 64) || '/' || repeat('2', 64) || '.jpg')
    from public.cms_revisions where id = '88000000-0000-4000-8000-000000000041'
  ),
  'archive_finalized_gallery_payload_has_only_public_media'
);

-- Relaxed published-envelope constraint, isolated from the kind-aware lifecycle trigger.
select ok(
  (
    select pg_get_constraintdef(oid) like '%localized-fields-v1%'
      and pg_get_constraintdef(oid) like '%jsonb_typeof(payload)%'
      and pg_get_constraintdef(oid) not like '%cms_payload_is_publishable%'
    from pg_constraint
    where conrelid = 'public.cms_revisions'::regclass and conname = 'cms_revisions_published_payload_check'
  ),
  'archive_constraint_accepts_bilingual_or_localized_fields_envelope'
);
alter table public.cms_revisions disable trigger cms_revisions_enforce_lifecycle;
select throws_ok(
  $$insert into public.cms_revisions (id, document_id, version, status, payload, published_at)
    values ('88000000-0000-4000-8000-000000000090', '88000000-0000-4000-8000-000000000080', 1, 'published', '{}', statement_timestamp())$$,
  '23514',
  'new row for relation "cms_revisions" violates check constraint "cms_revisions_published_payload_check"',
  'archive_constraint_rejects_empty_published_payload'
);
select throws_ok(
  $$insert into public.cms_revisions (id, document_id, version, status, payload, published_at)
    values ('88000000-0000-4000-8000-000000000091', '88000000-0000-4000-8000-000000000081', 1, 'published',
      (select payload - 'contentModel' from archive_valid_payloads where kind = 'posts'), statement_timestamp())$$,
  '23514',
  'new row for relation "cms_revisions" violates check constraint "cms_revisions_published_payload_check"',
  'archive_constraint_rejects_envelope_less_payload_without_content_model'
);
select lives_ok(
  $$insert into public.cms_revisions (id, document_id, version, status, payload, published_at)
    values
      ('88000000-0000-4000-8000-000000000092', '88000000-0000-4000-8000-000000000082', 1, 'published', '{"contentModel":"localized-fields-v1"}', statement_timestamp()),
      ('88000000-0000-4000-8000-000000000093', '88000000-0000-4000-8000-000000000083', 1, 'published', '{"zh":{"a":1},"en":{"a":1}}', statement_timestamp())$$,
  'archive_constraint_admits_both_published_envelopes'
);
alter table public.cms_revisions enable trigger cms_revisions_enforce_lifecycle;

select * from finish();
rollback;
