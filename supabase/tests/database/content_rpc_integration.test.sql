begin;

create extension if not exists pgtap with schema extensions;

select plan(31);

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
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    '{}'::jsonb,
    '{}'::jsonb,
    true,
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
  source_commit,
  default_fixture,
  analysis_profile_id
) values (
  'model/integration-test-v1',
  'model/integration-test',
  'Integration test model',
  '{"schemaId":"circleheart-studio-exact-model-kernel-v3","modelId":"model/integration-test-v1","modelFamilyId":"model/integration-test"}'::jsonb,
  'models/integration-test-v1.mjs',
  repeat('a', 64),
  repeat('b', 64),
  'integration-test',
  '{"schemaId":"fixture/integration-test-v1"}'::jsonb,
  'analysis/integration-test-v1'
);

insert into studio.model_release_availability (model_id, stage)
values ('model/integration-test-v1', 'stable');

insert into studio.model_surface_releases (
  surface_release_id, surface_series_id, predecessor_surface_release_id,
  model_family_id, display_name, manifest, source_commit
) values (
  'surface/integration-test-v1', 'surface-series/integration-test', null,
  'model/integration-test', 'Integration test Surface',
  '{
    "schemaId":"circleheart-studio-model-surface-release-v1",
    "surfaceReleaseId":"surface/integration-test-v1",
    "surfaceSeriesId":"surface-series/integration-test",
    "predecessorSurfaceReleaseId":null,
    "modelFamilyId":"model/integration-test",
    "displayName":"Integration test Surface",
    "controlCatalog":[],"derivedOutputCatalog":[],"graphCatalog":[],
    "knobCatalog":[],"protocolCatalog":[]
  }'::jsonb,
  'integration-test'
);
insert into studio.model_surface_release_availability (
  surface_release_id, stage
) values ('surface/integration-test-v1', 'stable');

insert into studio.model_surface_releases (
  surface_release_id, surface_series_id, predecessor_surface_release_id,
  model_family_id, display_name, manifest, source_commit
) values (
  'surface/integration-alternate-v1',
  'surface-series/integration-alternate',
  null,
  'model/integration-test',
  'Integration alternate Surface',
  '{
    "schemaId":"circleheart-studio-model-surface-release-v1",
    "surfaceReleaseId":"surface/integration-alternate-v1",
    "surfaceSeriesId":"surface-series/integration-alternate",
    "predecessorSurfaceReleaseId":null,
    "modelFamilyId":"model/integration-test",
    "displayName":"Integration alternate Surface",
    "controlCatalog":[],"derivedOutputCatalog":[],"graphCatalog":[],
    "knobCatalog":[],"protocolCatalog":[]
  }'::jsonb,
  'integration-test'
);
insert into studio.model_surface_release_availability (
  surface_release_id, stage
) values ('surface/integration-alternate-v1', 'stable');

select pg_catalog.set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated","is_anonymous":false}',
  true
);

create temporary table rpc_state (
  key text primary key,
  value jsonb not null
);

select is(
  public.claim_my_authoring_command_v1(
    '20000000-0000-0000-0000-000000000001',
    'experiment.apply',
    repeat('c', 64)
  ),
  null::jsonb,
  'An AI command reserves its UUID before the content mutation begins'
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
    "surfaceSeriesId":"surface-series/integration-test",
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
  public.read_my_authoring_operation_receipt_v1(
    '20000000-0000-0000-0000-000000000001'
  ) ->> 'status',
  'committed',
  'The author can read a committed AI authoring operation receipt'
);

select is(
  public.claim_my_authoring_command_v1(
    '20000000-0000-0000-0000-000000000001',
    'experiment.apply',
    repeat('c', 64)
  ) ->> 'status',
  'committed',
  'An AI command claim returns its already committed operation receipt'
);

select is(
  public.claim_my_authoring_command_v1(
    '20000000-0000-0000-0000-000000000001',
    'experiment.apply',
    repeat('c', 64)
  ) ->> 'status',
  'committed',
  'The same canonical AI command claim is idempotent'
);

select throws_ok(
  $$
    select public.claim_my_authoring_command_v1(
      '20000000-0000-0000-0000-000000000001',
      'experiment.apply',
      repeat('d', 64)
    )
  $$,
  '23505',
  'command_id was already used for a different authoring command',
  'A command UUID cannot be rebound to different semantic input'
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
      "surfaceSeriesId":"surface-series/integration-test",
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

insert into studio.operation_receipts (
  actor_id,
  operation_id,
  operation_kind,
  request,
  status,
  result,
  completed_at
) values (
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000014',
  'save-article-v1',
  '{}'::jsonb,
  'committed',
  '{"articleId":"30000000-0000-0000-0000-000000000014"}'::jsonb,
  now()
);

select throws_ok(
  $$
    select public.claim_my_authoring_command_v1(
      '20000000-0000-0000-0000-000000000014',
      'article.save',
      repeat('f', 64)
    )
  $$,
  '23505',
  'command_id already belongs to an unbound content operation',
  'An AI command cannot adopt an older unbound content receipt'
);

insert into studio.operation_receipts (
  actor_id,
  operation_id,
  operation_kind,
  request,
  status,
  created_at
) values (
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000015',
  'save-experiment-v1',
  '{}'::jsonb,
  'running',
  '2026-08-11T00:00:00.000Z'
);

insert into studio.authoring_command_bindings (
  actor_id,
  command_id,
  command_action,
  command_digest,
  created_at
) values (
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000015',
  'experiment.apply',
  repeat('a', 64),
  '2026-08-11T00:00:01.000Z'
);

update studio.operation_receipts
set status = 'committed',
    result = '{"experimentId":"30000000-0000-0000-0000-000000000015","version":0}'::jsonb,
    completed_at = '2026-08-11T00:00:02.000Z'
where actor_id = '10000000-0000-0000-0000-000000000001'
  and operation_id = '20000000-0000-0000-0000-000000000015';

select is(
  (
    select committed_operation_kind
    from studio.authoring_command_bindings
    where actor_id = '10000000-0000-0000-0000-000000000001'
      and command_id = '20000000-0000-0000-0000-000000000015'
  ),
  null::text,
  'A late concurrent command binding cannot adopt an earlier operation on commit'
);

select throws_ok(
  $$
    select public.claim_my_authoring_command_v1(
      '20000000-0000-0000-0000-000000000015',
      'experiment.apply',
      repeat('a', 64)
    )
  $$,
  '23505',
  'command_id already belongs to an unbound content operation',
  'A retry fails closed after the concurrent unbound-operation race'
);

delete from studio.operation_receipts
where actor_id = '10000000-0000-0000-0000-000000000001'
  and operation_id = '20000000-0000-0000-0000-000000000001';

select is(
  public.claim_my_authoring_command_v1(
    '20000000-0000-0000-0000-000000000001',
    'experiment.apply',
    repeat('c', 64)
  ) ->> 'status',
  'committed',
  'A bound AI command remains replayable after general receipt GC'
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
        "surfaceSeriesId":"surface-series/integration-test",
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

select throws_ok(
  $$
    select public.commit_admitted_experiment_snapshot_v1(
      '20000000-0000-0000-0000-000000000016',
      null,
      'model/integration-test-v1',
      '{
        "modelId":"model/integration-test-v1",
        "surfaceSeriesId":"surface-series/integration-alternate",
        "scenarios":[{
          "scenarioId":"scenario/baseline",
          "label":"Baseline",
          "capture":{"fixture":{"control":1},"checkpoint":{"acceptedTimeSec":2}}
        }],
        "surface":{}
      }'::jsonb,
      'surface/integration-alternate-v1',
      ((select value ->> 'experimentId' from rpc_state where key = 'save'))::uuid,
      0
    )
  $$,
  '22023',
  'Snapshot candidate is not the clean saved Experiment head',
  'A Snapshot cannot switch the saved Experiment to another Surface series'
);

insert into rpc_state (key, value)
select 'snapshot', public.commit_admitted_experiment_snapshot_v1(
  '20000000-0000-0000-0000-000000000003',
  null,
  'model/integration-test-v1',
  '{
    "modelId":"model/integration-test-v1",
    "surfaceSeriesId":"surface-series/integration-test",
    "scenarios":[{
      "scenarioId":"scenario/baseline",
      "label":"Baseline",
      "capture":{"fixture":{"control":1},"checkpoint":{"acceptedTimeSec":2}}
    }],
    "surface":{}
  }'::jsonb,
  'surface/integration-test-v1',
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

insert into studio.model_releases (
  model_id,
  model_family_id,
  display_name,
  manifest,
  artifact_path,
  artifact_sha256,
  registry_fingerprint,
  source_commit,
  default_fixture,
  analysis_profile_id
) values (
  'model/integration-test-dev-v2',
  'model/integration-test',
  'Integration test dev model',
  '{"schemaId":"circleheart-studio-exact-model-kernel-v3","modelId":"model/integration-test-dev-v2","modelFamilyId":"model/integration-test"}'::jsonb,
  'models/integration-test-dev-v2.mjs',
  repeat('c', 64),
  repeat('d', 64),
  'integration-test-dev',
  '{"schemaId":"fixture/integration-test-v1"}'::jsonb,
  'analysis/integration-test-v1'
);
insert into studio.model_release_availability (model_id)
values ('model/integration-test-dev-v2');

select throws_ok(
  $$
    select public.save_experiment_v1(
      '20000000-0000-0000-0000-000000000011',
      null,
      null,
      'Surface-less content must fail',
      'model/integration-test-dev-v2',
      '{
        "modelId":"model/integration-test-dev-v2",
        "scenarios":[{
          "scenarioId":"scenario/dev",
          "label":"Development",
          "capture":{"fixture":{"control":1},"checkpoint":{"acceptedTimeSec":1}}
        }],
        "surface":{}
      }'::jsonb
    )
  $$,
  '22023',
  'Standard Experiment content must pin a Surface series',
  'Surface-less Experiment content is rejected at the authority boundary'
);

insert into rpc_state (key, value)
select 'dev-save', public.save_experiment_v1(
  '20000000-0000-0000-0000-000000000007',
  null,
  null,
  'Development model experiment',
  'model/integration-test-dev-v2',
  '{
    "modelId":"model/integration-test-dev-v2",
    "surfaceSeriesId":"surface-series/integration-test",
    "scenarios":[{
      "scenarioId":"scenario/dev",
      "label":"Development",
      "capture":{"fixture":{"control":1},"checkpoint":{"acceptedTimeSec":1}}
    }],
    "surface":{}
  }'::jsonb
);

select throws_ok(
  $$
    select public.commit_admitted_experiment_snapshot_v1(
      '20000000-0000-0000-0000-000000000012',
      null,
      'model/integration-test-dev-v2',
      '{
        "modelId":"model/integration-test-dev-v2",
        "surfaceSeriesId":"surface-series/integration-test",
        "scenarios":[{
          "scenarioId":"scenario/dev",
          "label":"Development",
          "capture":{"fixture":{"control":1},"checkpoint":{"acceptedTimeSec":2}}
        }],
        "surface":{}
      }'::jsonb,
      null,
      ((select value ->> 'experimentId' from rpc_state where key = 'dev-save'))::uuid,
      0
    )
  $$,
  '22023',
  'Standard Snapshot must pin a Surface release',
  'Surface-less Snapshot capture is rejected at the authority boundary'
);

insert into rpc_state (key, value)
select 'dev-snapshot', public.commit_admitted_experiment_snapshot_v1(
  '20000000-0000-0000-0000-000000000008',
  null,
  'model/integration-test-dev-v2',
  '{
    "modelId":"model/integration-test-dev-v2",
    "surfaceSeriesId":"surface-series/integration-test",
    "scenarios":[{
      "scenarioId":"scenario/dev",
      "label":"Development",
      "capture":{"fixture":{"control":1},"checkpoint":{"acceptedTimeSec":2}}
    }],
    "surface":{}
  }'::jsonb,
  'surface/integration-test-v1',
  ((select value ->> 'experimentId' from rpc_state where key = 'dev-save'))::uuid,
  0
);

select throws_ok(
  $$
    select public.publish_experiment_v1(
      '20000000-0000-0000-0000-000000000009',
      ((select value ->> 'experimentId' from rpc_state where key = 'dev-save'))::uuid,
      0,
      ((select value ->> 'snapshotId' from rpc_state where key = 'dev-snapshot'))::uuid,
      'development-model-must-not-publish'
    )
  $$,
  '22023',
  'Only stable model releases may be published (found dev)',
  'Dev model content may be saved and captured but not published'
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

update studio.model_release_availability
set loadable = false
where model_id = 'model/integration-test-v1';

select throws_ok(
  $$
    select public.publish_experiment_v1(
      '20000000-0000-0000-0000-000000000010',
      ((select value ->> 'experimentId' from rpc_state where key = 'save'))::uuid,
      0,
      ((select value ->> 'snapshotId' from rpc_state where key = 'snapshot'))::uuid,
      'disabled-model-must-not-publish'
    )
  $$,
  '22023',
  'Snapshot model release is disabled',
  'Emergency-disabled exact models cannot create new publications'
);

update studio.model_release_availability
set loadable = true
where model_id = 'model/integration-test-v1';

select pg_catalog.set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated","is_anonymous":false}',
  true
);

select is(
  public.read_my_authoring_operation_receipt_v1(
    '20000000-0000-0000-0000-000000000001'
  ),
  null::jsonb,
  'Another authenticated actor cannot read the operation receipt'
);

select is(
  public.read_my_experiment_v1(
    ((select value ->> 'experimentId' from rpc_state where key = 'save'))::uuid
  ),
  null::jsonb,
  'Another authenticated owner cannot read the private Experiment'
);

select pg_catalog.set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated","is_anonymous":true}',
  true
);

select throws_ok(
  $$
    select public.claim_my_authoring_command_v1(
      '20000000-0000-0000-0000-000000000013',
      'article.save',
      repeat('e', 64)
    )
  $$,
  '42501',
  'AI authoring command claims require a signed-in user',
  'Anonymous readers cannot allocate permanent AI command bindings'
);

select ok(
  public.save_experiment_v1(
    '20000000-0000-0000-0000-000000000006',
    null,
    null,
    'Anonymous baseline',
    'model/integration-test-v1',
    '{
      "modelId":"model/integration-test-v1",
      "surfaceSeriesId":"surface-series/integration-test",
      "scenarios":[{
        "scenarioId":"scenario/anonymous",
        "label":"Anonymous",
        "capture":{"fixture":{"control":1},"checkpoint":{"acceptedTimeSec":1}}
      }],
      "surface":{}
    }'::jsonb
  ) ? 'experimentId',
  'Anonymous Save crosses the polymorphic storage-quota trigger'
);

select * from finish();

rollback;
