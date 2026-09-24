begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
set local request.jwt.claims = '{}';

select plan(12);

create temporary table news_board_payload on commit drop as
select revisions.payload
from public.cms_documents as documents
join public.cms_revisions as revisions on revisions.document_id = documents.id
where documents.kind = 'news' and revisions.status = 'published'
limit 1;

select is(
  (select count(*) from news_board_payload),
  1::bigint,
  'news_board_fixture_cardinality'
);
select ok(
  public.cms_news_payload_is_publishable((select payload from news_board_payload)) is true,
  'news_board_valid'
);
select ok(
  public.cms_news_payload_is_publishable((select payload from news_board_payload) - 'announcementBoardUrl') is false,
  'news_board_missing'
);
select ok(
  public.cms_news_payload_is_publishable(jsonb_set((select payload from news_board_payload), '{announcementBoardUrl}', '"http://example.test/board"')) is false,
  'news_board_http'
);
select ok(
  public.cms_news_payload_is_publishable(jsonb_set((select payload from news_board_payload), '{announcementBoardUrl}', '"https://editor:secret@example.test/board"')) is false,
  'news_board_credentials'
);
select ok(
  public.cms_news_payload_is_publishable(jsonb_set((select payload from news_board_payload), '{announcementBoardUrl}', '" https://example.test/board"')) is false,
  'news_board_leading_whitespace'
);
select ok(
  public.cms_news_payload_is_publishable(jsonb_set((select payload from news_board_payload), '{announcementBoardUrl}', '"https://example.test/board "')) is false,
  'news_board_trailing_whitespace'
);
select ok(
  public.cms_news_payload_is_publishable(jsonb_set((select payload from news_board_payload), '{announcementBoardUrl}', '"https://-example.test/board"')) is false,
  'news_board_malformed_host'
);
select ok(
  public.cms_news_payload_is_publishable(jsonb_set((select payload from news_board_payload), '{announcementBoardUrl}', to_jsonb('https://K.example/board'::text))) is false,
  'news_board_unicode_host'
);
select ok(
  public.cms_news_payload_is_publishable(jsonb_set((select payload from news_board_payload), '{announcementBoardUrl}', '"https://example.test:/board"')) is false,
  'news_board_empty_port'
);
select ok(
  public.cms_news_payload_is_publishable(jsonb_set((select payload from news_board_payload), '{announcementBoardUrl}', '"https://example.test:0/board"')) is false,
  'news_board_zero_port'
);
select ok(
  public.cms_news_payload_is_publishable(jsonb_set((select payload from news_board_payload), '{announcementBoardUrl}', '"https://example.test:65536/board"')) is false,
  'news_board_out_of_range_port'
);

select * from finish();
rollback;
