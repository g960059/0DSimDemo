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
) values
  (
    '10000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    '{}'::jsonb,
    '{}'::jsonb,
    false,
    now(),
    now()
  ),
  (
    '10000000-0000-0000-0000-000000000002',
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
  'model/integration-test-v1',
  'model/integration-test',
  'Integration test model',
  '{"modelId":"model/integration-test-v1"}'::jsonb,
  'models/integration-test-v1.mjs',
  repeat('a', 64),
  repeat('b', 64),
  'integration-test'
);

select pg_catalog.set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","is_anonymous":false}',
  true
);

create temporary table rpc_state (
  key text primary key,
  value jsonb not null
);

insert into rpc_state (key, value)
select 'save', public.save_experiment_v1(
  '20000000-0000-0000-0000-000000000001',
  null,
  null,
  'Integration baseline',
  'model/integration-test-v1',
  '{
    "modelId":"model/integration-test-v1",
    "scenarios":[{
      "scenarioId":"scenario/baseline",
      "label":"Baseline",
      "capture":{"fixture":{"control":1},"checkpoint":{"acceptedTimeSec":1}}
    }],
    "surface":{}
  }'::jsonb
);

select ok(
  not (select value from rpc_state where key = 'save') ? 'content',
  'Save RPC returns a compact result'
);

select is(
  (select (value ->> 'version')::bigint from rpc_state where key = 'save'),
  0::bigint,
  'First Save creates version zero'
);

select ok(
  not (
    select request
    from studio.operation_receipts
    where operation_id = '20000000-0000-0000-0000-000000000001'
  ) ? 'content',
  'Committed operation receipt does not duplicate Experiment content'
);

select matches(
  (
    select request ->> 'contentSha256'
    from studio.operation_receipts
    where operation_id = '20000000-0000-0000-0000-000000000001'
  ),
  '^[0-9a-f]{64}$',
  'Committed operation receipt fingerprints Experiment content'
);

select is(
  public.save_experiment_v1(
    '20000000-0000-0000-0000-000000000001',
    null,
    null,
    'Integration baseline',
    'model/integration-test-v1',
    '{
      "modelId":"model/integration-test-v1",
      "scenarios":[{
        "scenarioId":"scenario/baseline",
        "label":"Baseline",
        "capture":{"fixture":{"control":1},"checkpoint":{"acceptedTimeSec":1}}
      }],
      "surface":{}
    }'::jsonb
  ),
  (select value from rpc_state where key = 'save'),
  'Exact operation replay returns the original committed result'
);

select is(
  (select count(*) from studio.experiment_contents),
  1::bigint,
  'Exact operation replay creates no duplicate immutable content'
);

select throws_ok(
  $$
    select public.save_experiment_v1(
      '20000000-0000-0000-0000-000000000002',
      ((select value ->> 'experimentId' from rpc_state where key = 'save'))::uuid,
      99,
      'Stale update',
      'model/integration-test-v1',
      '{
        "modelId":"model/integration-test-v1",
        "scenarios":[{
          "scenarioId":"scenario/baseline",
          "label":"Baseline",
          "capture":{"fixture":{"control":1},"checkpoint":{"acceptedTimeSec":1}}
        }],
        "surface":{}
      }'::jsonb
    )
  $$,
  '40001',
  'Experiment version conflict',
  'Stale compare-and-swap is rejected'
);

insert into rpc_state (key, value)
select 'snapshot', public.commit_admitted_experiment_snapshot_v1(
  '20000000-0000-0000-0000-000000000003',
  null,
  'model/integration-test-v1',
  '{
    "modelId":"model/integration-test-v1",
    "scenarios":[{
      "scenarioId":"scenario/baseline",
      "label":"Baseline",
      "capture":{"fixture":{"control":1},"checkpoint":{"acceptedTimeSec":2}}
    }],
    "surface":{}
  }'::jsonb,
  ((select value ->> 'experimentId' from rpc_state where key = 'save'))::uuid,
  0
);

select ok(
  not (select value from rpc_state where key = 'snapshot') ? 'content',
  'Snapshot RPC returns identity without duplicating content'
);

select ok(
  (
    select r.retain_until
      >= pg_catalog.statement_timestamp() + interval '23 hours'
    from studio.experiment_snapshot_retention r
    where r.snapshot_id = (
      (select value ->> 'snapshotId' from rpc_state where key = 'snapshot')
    )::uuid
  ),
  'New unreferenced Snapshot has a 24-hour handoff grace'
);

select public.publish_experiment_v1(
  '20000000-0000-0000-0000-000000000004',
  ((select value ->> 'experimentId' from rpc_state where key = 'save'))::uuid,
  0,
  ((select value ->> 'snapshotId' from rpc_state where key = 'snapshot'))::uuid,
  'integration-public-experiment'
);

select is(
  public.read_public_experiment_v1('integration-public-experiment')
    #>> '{snapshot,snapshotId}',
  (select value ->> 'snapshotId' from rpc_state where key = 'snapshot'),
  'Published Experiment resolves to the admitted Snapshot'
);

select is(
  (
    select r.retain_until
    from studio.experiment_snapshot_retention r
    where r.snapshot_id = (
      (select value ->> 'snapshotId' from rpc_state where key = 'snapshot')
    )::uuid
  ),
  null::timestamptz,
  'Published Snapshot is retained without an expiry'
);

select public.unpublish_experiment_v1(
  '20000000-0000-0000-0000-000000000005',
  ((select value ->> 'experimentId' from rpc_state where key = 'save'))::uuid,
  0
);

select is(
  public.read_public_experiment_v1('integration-public-experiment'),
  null::jsonb,
  'Unpublished Experiment is no longer publicly readable'
);

select ok(
  (
    select r.retain_until between
      pg_catalog.statement_timestamp() + interval '50 minutes'
      and pg_catalog.statement_timestamp() + interval '70 minutes'
    from studio.experiment_snapshot_retention r
    where r.snapshot_id = (
      (select value ->> 'snapshotId' from rpc_state where key = 'snapshot')
    )::uuid
  ),
  'Unpublished Snapshot receives the explicit one-hour recovery window'
);

select pg_catalog.set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated","is_anonymous":false}',
  true
);

select is(
  public.read_my_experiment_v1(
    ((select value ->> 'experimentId' from rpc_state where key = 'save'))::uuid
  ),
  null::jsonb,
  'Another authenticated owner cannot read the private Experiment'
);

select * from finish();

rollback;
