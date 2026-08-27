begin;

create extension if not exists pgtap with schema extensions;

select plan(28);

select lives_ok(
  $$
    select public.register_model_release_v2(
      'model/lifecycle-test-v1',
      'model/lifecycle-test',
      'Lifecycle test',
      '{"schemaId":"circleheart-studio-exact-model-kernel-v3","modelId":"model/lifecycle-test-v1","modelFamilyId":"model/lifecycle-test"}'::jsonb,
      repeat('2', 64),
      'model-releases/model/lifecycle-test-v1/2222222222222222222222222222222222222222222222222222222222222222/model.mjs',
      repeat('1', 64),
      'lifecycle-test',
      '{"schemaId":"fixture/lifecycle-v1"}'::jsonb,
      'analysis/lifecycle-v1',
      null,
      null
    )
  $$,
  'New exact releases register at dev stage'
);

select is(
  (select stage from studio.model_release_availability
    where model_id = 'model/lifecycle-test-v1'),
  'dev',
  'Exact release starts as dev'
);

select throws_ok(
  $$
    select public.register_model_release_succession_v1(
      'model/lifecycle-test-v1', 'model/lifecycle-test-v1', 'drop-in'
    )
  $$,
  '22023',
  'only successor lineage is available until drop-in evidence verification exists',
  'Unverified drop-in succession cannot be registered'
);

select lives_ok(
  $$select public.set_model_release_stage_v1('model/lifecycle-test-v1', 'stable')$$,
  'Dev exact release can promote to stable'
);

select is(
  (
    select stage
    from public.get_model_release_v1('model/lifecycle-test-v1')
  ),
  'stable',
  'Exact read exposes immutable release lifecycle without changing the ticket'
);

select lives_ok(
  $$
    select public.register_model_surface_release_v1(
      'surface/lifecycle-test-v1',
      'surface-series/lifecycle-test',
      null,
      'model/lifecycle-test',
      'Lifecycle surface',
      '{
        "schemaId":"circleheart-studio-model-surface-release-v1",
        "surfaceReleaseId":"surface/lifecycle-test-v1",
        "surfaceSeriesId":"surface-series/lifecycle-test",
        "predecessorSurfaceReleaseId":null,
        "modelFamilyId":"model/lifecycle-test",
        "displayName":"Lifecycle surface",
        "exposedExactOutputIds":[],
        "controlCatalog":[{
          "controlId":"control/tbv",
          "preferredPresentation":"slider",
          "requiredCapabilities":["control/control/tbv"]
        }],
        "derivedOutputCatalog":[],
        "graphCatalog":[],
        "knobCatalog":[],
        "protocolCatalog":[]
      }'::jsonb,
      'lifecycle-test'
    )
  $$,
  'Surface release registration succeeds'
);

select is(
  (select stage from studio.model_surface_release_availability
    where surface_release_id = 'surface/lifecycle-test-v1'),
  'dev',
  'Surface release starts as dev'
);

select lives_ok(
  $$
    select public.register_model_surface_release_v1(
      'surface/lifecycle-test-v1',
      'surface-series/lifecycle-test',
      null,
      'model/lifecycle-test',
      'Lifecycle surface',
      '{
        "schemaId":"circleheart-studio-model-surface-release-v1",
        "surfaceReleaseId":"surface/lifecycle-test-v1",
        "surfaceSeriesId":"surface-series/lifecycle-test",
        "predecessorSurfaceReleaseId":null,
        "modelFamilyId":"model/lifecycle-test",
        "displayName":"Lifecycle surface",
        "exposedExactOutputIds":[],
        "controlCatalog":[{
          "controlId":"control/tbv",
          "preferredPresentation":"slider",
          "requiredCapabilities":["control/control/tbv"]
        }],
        "derivedOutputCatalog":[],
        "graphCatalog":[],
        "knobCatalog":[],
        "protocolCatalog":[]
      }'::jsonb,
      'later-operational-retry'
    )
  $$,
  'Identical Surface registration is idempotent across source commits'
);

select throws_ok(
  $$
    select public.set_active_model_bundle_v1(
      null, 'model/lifecycle-test-v1', 'surface/lifecycle-test-v1'
    )
  $$,
  '22023',
  'active Model Surface release surface/lifecycle-test-v1 must be stable, not dev',
  'A dev Surface cannot become the active bundle'
);

select throws_ok(
  $$
    select public.register_model_surface_release_v1(
      'surface/lifecycle-test-bad-v2',
      'surface-series/lifecycle-test',
      'surface/lifecycle-test-v1',
      'model/lifecycle-test',
      'Invalid shrinking surface',
      '{
        "schemaId":"circleheart-studio-model-surface-release-v1",
        "surfaceReleaseId":"surface/lifecycle-test-bad-v2",
        "surfaceSeriesId":"surface-series/lifecycle-test",
        "predecessorSurfaceReleaseId":"surface/lifecycle-test-v1",
        "modelFamilyId":"model/lifecycle-test",
        "displayName":"Invalid shrinking surface",
        "exposedExactOutputIds":[],
        "controlCatalog":[],
        "derivedOutputCatalog":[],
        "graphCatalog":[],
        "knobCatalog":[],
        "protocolCatalog":[]
      }'::jsonb,
      'lifecycle-test'
    )
  $$,
  '22023',
  'model surface upgrade cannot remove or redefine controlCatalog',
  'Registry rejects a Surface that removes a predecessor item'
);

select throws_ok(
  $$
    select public.register_model_surface_release_v1(
      'surface/lifecycle-test-redefined-v2',
      'surface-series/lifecycle-test',
      'surface/lifecycle-test-v1',
      'model/lifecycle-test',
      'Invalid redefined surface',
      '{
        "schemaId":"circleheart-studio-model-surface-release-v1",
        "surfaceReleaseId":"surface/lifecycle-test-redefined-v2",
        "surfaceSeriesId":"surface-series/lifecycle-test",
        "predecessorSurfaceReleaseId":"surface/lifecycle-test-v1",
        "modelFamilyId":"model/lifecycle-test",
        "displayName":"Invalid redefined surface",
        "exposedExactOutputIds":[],
        "controlCatalog":[{
          "controlId":"control/tbv",
          "preferredPresentation":"slider",
          "requiredCapabilities":["control/control/tbv"],
          "laterMetadata":"not byte-equivalent"
        }],
        "derivedOutputCatalog":[],
        "graphCatalog":[],
        "knobCatalog":[],
        "protocolCatalog":[]
      }'::jsonb,
      'lifecycle-test'
    )
  $$,
  '22023',
  'model surface upgrade cannot remove or redefine controlCatalog',
  'Registry requires an existing Surface item to remain exactly identical'
);

select lives_ok(
  $$
    select public.register_model_surface_release_v1(
      'surface/lifecycle-test-v2',
      'surface-series/lifecycle-test',
      'surface/lifecycle-test-v1',
      'model/lifecycle-test',
      'Lifecycle surface v2',
      '{
        "schemaId":"circleheart-studio-model-surface-release-v1",
        "surfaceReleaseId":"surface/lifecycle-test-v2",
        "surfaceSeriesId":"surface-series/lifecycle-test",
        "predecessorSurfaceReleaseId":"surface/lifecycle-test-v1",
        "modelFamilyId":"model/lifecycle-test",
        "displayName":"Lifecycle surface v2",
        "exposedExactOutputIds":[],
        "controlCatalog":[{
          "controlId":"control/tbv",
          "preferredPresentation":"slider",
          "requiredCapabilities":["control/control/tbv"]
        }],
        "derivedOutputCatalog":[],
        "graphCatalog":[],
        "knobCatalog":[],
        "protocolCatalog":[{
          "protocolId":"protocol/fluid",
          "requiredCapabilities":["control/control/tbv"],
          "steps":[{"atSec":0,"actions":[{
            "controlId":"control/tbv","value":5250
          }]}]
        }]
      }'::jsonb,
      'lifecycle-test'
    )
  $$,
  'Registry accepts an additive Surface successor'
);

select lives_ok(
  $$
    select public.register_model_surface_release_v1(
      'surface/lifecycle-test-final',
      'surface-series/lifecycle-test',
      'surface/lifecycle-test-v2',
      'model/lifecycle-test',
      'Lifecycle surface v3',
      '{
        "schemaId":"circleheart-studio-model-surface-release-v1",
        "surfaceReleaseId":"surface/lifecycle-test-final",
        "surfaceSeriesId":"surface-series/lifecycle-test",
        "predecessorSurfaceReleaseId":"surface/lifecycle-test-v2",
        "modelFamilyId":"model/lifecycle-test",
        "displayName":"Lifecycle surface v3",
        "exposedExactOutputIds":[],
        "controlCatalog":[{
          "controlId":"control/tbv",
          "preferredPresentation":"slider",
          "requiredCapabilities":["control/control/tbv"]
        }],
        "derivedOutputCatalog":[],
        "graphCatalog":[],
        "knobCatalog":[],
        "protocolCatalog":[{
          "protocolId":"protocol/fluid",
          "requiredCapabilities":["control/control/tbv"],
          "steps":[{"atSec":0,"actions":[{
            "controlId":"control/tbv","value":5250
          }]}]
        }]
      }'::jsonb,
      'lifecycle-test'
    )
  $$,
  'Registry accepts the next linear Surface successor'
);

do $$
begin
  perform public.register_model_release_v2(
    'model/lifecycle-dev-v1',
    'model/lifecycle-test',
    'Dev lifecycle model',
    '{"schemaId":"circleheart-studio-exact-model-kernel-v3","modelId":"model/lifecycle-dev-v1","modelFamilyId":"model/lifecycle-test"}'::jsonb,
    repeat('8', 64),
    'model-releases/model/lifecycle-dev-v1/8888888888888888888888888888888888888888888888888888888888888888/model.mjs',
    repeat('7', 64),
    'lifecycle-test',
    '{"schemaId":"fixture/lifecycle-v1"}'::jsonb,
    'analysis/lifecycle-v1',
    null,
    null
  );
end;
$$;

select is(
  (
    select surface_release_id
    from public.get_model_surface_series_latest_v1(
      'surface-series/lifecycle-test',
      'model/lifecycle-dev-v1'
    )
  ),
  'surface/lifecycle-test-final',
  'A saved dev-model Experiment can reopen on its deepest dev Surface'
);

select lives_ok(
  $$
    select public.set_model_surface_release_stage_v1(
      'surface/lifecycle-test-v1', 'stable'
    )
  $$,
  'Surface promotes from dev to stable'
);

select is(
  (
    select surface_release_id
    from public.get_model_surface_series_latest_v1(
      'surface-series/lifecycle-test',
      'model/lifecycle-test-v1'
    )
  ),
  'surface/lifecycle-test-v1',
  'A mutable Experiment ignores newer dev Surface successors'
);

select lives_ok(
  $$
    select public.set_active_model_bundle_v1(
      null, 'model/lifecycle-test-v1', 'surface/lifecycle-test-v1'
    )
  $$,
  'The first stable exact-model and Surface pair becomes active atomically'
);

select is(
  (select bundle_version from public.get_active_model_bundle_v1()),
  0::bigint,
  'The first active bundle starts at version zero'
);

select is(
  (select model_id from public.get_active_model_bundle_v1()),
  'model/lifecycle-test-v1',
  'Active bundle resolves the exact model in one read'
);

select throws_ok(
  $$
    select public.set_active_model_bundle_v1(
      7, 'model/lifecycle-test-v1', 'surface/lifecycle-test-v1'
    )
  $$,
  '40001',
  'active model bundle version conflict',
  'Active bundle update rejects a stale expected version'
);

select lives_ok(
  $$
    select public.set_active_model_bundle_v1(
      0, 'model/lifecycle-test-v1', 'surface/lifecycle-test-v1'
    )
  $$,
  'An idempotent active-bundle retry keeps the same version'
);

select lives_ok(
  $$
    select public.set_model_surface_release_stage_v1(
      'surface/lifecycle-test-final', 'stable'
    )
  $$,
  'A later additive Surface may promote independently'
);

select is(
  (
    select surface_release_id
    from public.get_model_surface_series_latest_v1(
      'surface-series/lifecycle-test',
      'model/lifecycle-test-v1'
    )
  ),
  'surface/lifecycle-test-final',
  'A mutable Experiment follows the deepest stable additive Surface even when its ID sorts earlier'
);

select is(
  (select stage from studio.model_surface_release_availability
    where surface_release_id = 'surface/lifecycle-test-v2'),
  'dev',
  'An abandoned intermediate Surface may remain dev'
);

select lives_ok(
  $$
    select public.set_active_model_bundle_v1(
      0, 'model/lifecycle-test-v1', 'surface/lifecycle-test-final'
    )
  $$,
  'Active bundle may move atomically to a later stable Surface'
);

select is(
  (select surface_release_id from public.get_active_model_bundle_v1()),
  'surface/lifecycle-test-final',
  'Active bundle read resolves the updated Surface'
);

select throws_ok(
  $$select public.set_model_release_stage_v1('model/lifecycle-test-v1', 'retired')$$,
  '55000',
  'active model release must be replaced before retirement',
  'The active exact model cannot retire before an atomic replacement'
);

select throws_ok(
  $$
    select public.set_model_surface_release_stage_v1(
      'surface/lifecycle-test-final', 'retired'
    )
  $$,
  '55000',
  'active Model Surface release must be replaced before retirement',
  'The active Surface cannot retire before an atomic replacement'
);

select * from finish();

rollback;
