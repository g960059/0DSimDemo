begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

insert into auth.users (
  id,
  aud,
  role,
  raw_app_meta_data,
  raw_user_meta_data,
  is_anonymous,
  created_at,
  updated_at
) values (
  '30000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  '{}'::jsonb,
  '{}'::jsonb,
  false,
  now(),
  now()
);

insert into studio.model_releases (
  model_id,
  model_family_id,
  display_name,
  manifest,
  artifact_path,
  artifact_sha256,
  registry_fingerprint,
  source_commit
) values (
  'model/summary-test-v1',
  'model/summary-test',
  'Summary test model',
  '{"modelId":"model/summary-test-v1"}'::jsonb,
  'models/summary-test-v1.mjs',
  repeat('c', 64),
  repeat('d', 64),
  'summary-test'
);

create temporary table summary_state (
  key text primary key,
  value jsonb not null
);

with inserted as (
  insert into studio.experiment_contents (
    model_id,
    content,
    created_by
  ) values (
    'model/summary-test-v1',
    '{
      "modelId":"model/summary-test-v1",
      "scenarios":[{
        "scenarioId":"scenario/baseline",
        "label":"Baseline",
        "capture":{
          "fixture":{"control":1},
          "checkpoint":{"acceptedTimeSec":1}
        }
      }],
      "surface":{
        "graphPanes":[{"paneId":"graph/1"}],
        "outputPanes":[{"paneId":"output/1"}],
        "controlPanes":[]
      }
    }'::jsonb,
    '30000000-0000-0000-0000-000000000001'
  ) returning content_id
)
insert into summary_state (key, value)
select 'content', jsonb_build_object('contentId', content_id) from inserted;

insert into studio.experiments (
  experiment_id,
  owner_id,
  model_id,
  title,
  version,
  current_content_id,
  created_at,
  updated_at
) values
  (
    '31000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    'model/summary-test-v1',
    'Newest experiment',
    4,
    ((select value ->> 'contentId' from summary_state where key = 'content'))::uuid,
    '2026-08-06 00:00:00.123456+00',
    '2026-08-06 00:00:00.123456+00'
  ),
  (
    '31000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    'model/summary-test-v1',
    'Older experiment',
    2,
    ((select value ->> 'contentId' from summary_state where key = 'content'))::uuid,
    '2026-08-06 00:00:00.123400+00',
    '2026-08-06 00:00:00.123400+00'
  );

insert into studio.experiment_snapshots (
  snapshot_id,
  owner_id,
  content_id,
  created_at
) values (
  '32000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  ((select value ->> 'contentId' from summary_state where key = 'content'))::uuid,
  '2026-08-06 00:01:00+00'
);

insert into studio.experiment_snapshot_sources (
  snapshot_id,
  source_experiment_id
) values (
  '32000000-0000-0000-0000-000000000001',
  '31000000-0000-0000-0000-000000000001'
);

insert into studio.experiment_snapshot_retention (snapshot_id, retain_until)
values ('32000000-0000-0000-0000-000000000001', null);

insert into studio.experiment_publications (
  experiment_id,
  owner_id,
  current_snapshot_id,
  public_slug,
  published_at,
  updated_at
) values (
  '31000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  '32000000-0000-0000-0000-000000000001',
  'summary-public-experiment',
  '2026-08-06 00:02:00+00',
  '2026-08-06 00:02:00+00'
);

with inserted as (
  insert into studio.article_contents (
    owner_id,
    locale,
    title,
    blocks
  ) values (
    '30000000-0000-0000-0000-000000000001',
    'en',
    'Summary article',
    '[{"blockId":"block/1","kind":"paragraph","text":"Public summary excerpt"}]'::jsonb
  ) returning article_content_id
)
insert into summary_state (key, value)
select 'article-content', jsonb_build_object(
  'articleContentId', article_content_id
) from inserted;

insert into studio.articles (
  article_id,
  owner_id,
  version,
  current_draft_content_id,
  created_at,
  updated_at
) values (
  '33000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  3,
  ((select value ->> 'articleContentId' from summary_state where key = 'article-content'))::uuid,
  '2026-08-06 00:03:00+00',
  '2026-08-06 00:03:00+00'
);

insert into studio.article_publications (
  article_id,
  owner_id,
  current_content_id,
  public_slug,
  published_at,
  updated_at
) values (
  '33000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  ((select value ->> 'articleContentId' from summary_state where key = 'article-content'))::uuid,
  'summary-public-article',
  '2026-08-06 00:04:00+00',
  '2026-08-06 00:04:00+00'
);

select pg_catalog.set_config(
  'request.jwt.claims',
  '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated","is_anonymous":false}',
  true
);

insert into summary_state (key, value)
select 'experiment-page-1', public.list_my_experiment_summaries_v1(1, null, null);

select is(
  (select value #>> '{items,0,experimentId}' from summary_state where key = 'experiment-page-1'),
  '31000000-0000-0000-0000-000000000001',
  'Experiment summary page starts with the newest Experiment'
);

select ok(
  not (select value #> '{items,0}' from summary_state where key = 'experiment-page-1') ? 'content',
  'Experiment list item does not contain complete content'
);

select ok(
  (select value -> 'nextCursor' from summary_state where key = 'experiment-page-1') is not null,
  'Experiment summary page returns an opaque continuation cursor'
);

insert into summary_state (key, value)
select 'experiment-page-2', public.list_my_experiment_summaries_v1(
  1,
  ((select value #>> '{nextCursor,timestamp}' from summary_state where key = 'experiment-page-1'))::timestamptz,
  ((select value #>> '{nextCursor,id}' from summary_state where key = 'experiment-page-1'))::uuid
);

select is(
  (select value #>> '{items,0,experimentId}' from summary_state where key = 'experiment-page-2'),
  '31000000-0000-0000-0000-000000000002',
  'Experiment cursor advances within the same millisecond without skipping'
);

select throws_ok(
  $$ select public.list_my_experiment_summaries_v1(50, now(), null) $$,
  '22023',
  'List cursor timestamp and ID must be supplied together',
  'Partial summary cursor is rejected'
);

insert into summary_state (key, value)
select 'snapshot-page', public.list_my_snapshot_summaries_v1(50, null, null);

select is(
  (select value #>> '{items,0,title}' from summary_state where key = 'snapshot-page'),
  'Newest experiment',
  'Snapshot summary uses saved Experiment title when available'
);

select is(
  (select (value #>> '{items,0,paneCount}')::integer from summary_state where key = 'snapshot-page'),
  2,
  'Snapshot summary exposes presentation count without checkpoint data'
);

select ok(
  not (select value #> '{items,0}' from summary_state where key = 'snapshot-page') ? 'content',
  'Snapshot list item does not contain fixture or checkpoint content'
);

insert into summary_state (key, value)
select 'article-page', public.list_my_article_summaries_v1(50, null, null);

select ok(
  not (select value #> '{items,0}' from summary_state where key = 'article-page') ? 'blocks',
  'Article list item does not contain authored blocks'
);

insert into summary_state (key, value)
select 'public-experiment-page', public.list_public_experiment_summaries_v1(50, null, null);

select is(
  (select value #>> '{items,0,snapshotId}' from summary_state where key = 'public-experiment-page'),
  '32000000-0000-0000-0000-000000000001',
  'Public Experiment summary identifies its immutable Snapshot'
);

select ok(
  not (select value #> '{items,0}' from summary_state where key = 'public-experiment-page') ? 'snapshot',
  'Public Experiment list does not embed full Snapshot content'
);

insert into summary_state (key, value)
select 'public-article-page', public.list_public_article_summaries_v1(50, null, null);

select is(
  (select value #>> '{items,0,excerpt}' from summary_state where key = 'public-article-page'),
  'Public summary excerpt',
  'Public Article summary derives a bounded text excerpt'
);

select ok(
  not (select value #> '{items,0}' from summary_state where key = 'public-article-page') ? 'blocks',
  'Public Article list does not embed authored blocks'
);

select throws_ok(
  $$ select public.list_public_article_summaries_v1(101, null, null) $$,
  '22023',
  'List page limit must be within [1, 100]',
  'Summary page size is bounded'
);

select * from finish();

rollback;
