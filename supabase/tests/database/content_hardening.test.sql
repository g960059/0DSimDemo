begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

select ok(
  not studio.operation_request_fingerprint_v1(
    'save-experiment-v1',
    '{"experimentId":null,"content":{"modelId":"model/test"}}'::jsonb
  ) ? 'content',
  'Experiment operation receipts do not duplicate content'
);

select matches(
  studio.operation_request_fingerprint_v1(
    'save-experiment-v1',
    '{"experimentId":null,"content":{"modelId":"model/test"}}'::jsonb
  ) ->> 'contentSha256',
  '^[0-9a-f]{64}$',
  'Experiment receipt stores a SHA-256 fingerprint'
);

select is(
  studio.operation_result_receipt_v1(
    'save-experiment-v1',
    '{"experimentId":"11111111-1111-1111-1111-111111111111","version":2,"content":{"large":true}}'::jsonb
  ),
  '{"experimentId":"11111111-1111-1111-1111-111111111111","version":2}'::jsonb,
  'Experiment replay result contains only durable identity'
);

select is(
  studio.operation_result_receipt_v1(
    'commit-admitted-experiment-snapshot-v1',
    '{"schemaId":"circleheart-studio-experiment-snapshot-v2","snapshotId":"22222222-2222-2222-2222-222222222222","createdAt":"2026-08-06T00:00:00.000Z","content":{"large":true}}'::jsonb
  ),
  '{"schemaId":"circleheart-studio-experiment-snapshot-v2","snapshotId":"22222222-2222-2222-2222-222222222222","createdAt":"2026-08-06T00:00:00.000Z"}'::jsonb,
  'Snapshot replay result contains no duplicate content'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'studio.experiment_contents'::regclass
      and conname = 'experiment_contents_size'
      and pg_catalog.pg_get_constraintdef(oid) like '%8388608%'
  ),
  'Experiment content has an explicit byte ceiling'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_constraint
    where conrelid = 'studio.article_contents'::regclass
      and conname = 'article_contents_size'
      and pg_catalog.pg_get_constraintdef(oid) like '%2097152%'
  ),
  'Article content has an explicit byte ceiling'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_trigger
    where tgrelid = 'studio.experiment_snapshot_retention'::regclass
      and tgname = 'extend_new_snapshot_retention'
      and not tgisinternal
  ),
  'New unreferenced Snapshots receive the handoff retention window'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'studio'
      and p.proname = 'enforce_anonymous_storage_quota_v1'
  ),
  'Anonymous immutable storage has a quota gate'
);

-- Exercise the deployed shape constraint without depending on auth/model
-- fixtures or inserting durable content into the actual repository.
create temporary table scenario_count_probe (model_id text, content jsonb);
do $$
declare shape_check text;
begin
  select pg_get_expr(conbin, conrelid) into strict shape_check
  from pg_constraint
  where conrelid = 'studio.experiment_contents'::regclass
    and conname = 'experiment_contents_object';
  execute 'alter table scenario_count_probe add constraint scenario_count_probe_shape check (' || shape_check || ')';
end $$;

select lives_ok($$
  insert into scenario_count_probe values ('model/test', jsonb_build_object(
    'modelId', 'model/test',
    'scenarios', (select jsonb_agg(jsonb_build_object('scenarioId', 'baseline-' || n)) from generate_series(1, 5) as n),
    'surface', '{}'::jsonb
  ))
$$, 'Five independent Scenarios are accepted by the content shape constraint');

select throws_ok($$
  insert into scenario_count_probe values ('model/test', '{"modelId":"model/test","scenarios":[],"surface":{}}'::jsonb)
$$, '23514', null, 'At least one Scenario is still required');

select * from finish();

rollback;
