begin;

create extension if not exists pgtap with schema extensions;

select plan(19);

select lives_ok(
  $$
    select public.register_model_release_v2(
      'model/lifecycle-test-v1',
      'model/lifecycle-test',
      'Lifecycle test',
      '{"modelId":"model/lifecycle-test-v1"}'::jsonb,
      'model-releases/model/lifecycle-test-v1.mjs',
      repeat('1', 64),
      repeat('2', 64),
      'lifecycle-test',
      'circleheart-exact-model-esm-v1',
      '{"schemaId":"fixture/lifecycle-v1"}'::jsonb,
      'analysis/lifecycle-v1'
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
  $$select public.set_model_release_channel_v1('default', 'model/lifecycle-test-v1')$$,
  '22023',
  'model release model/lifecycle-test-v1 at stage dev cannot serve channel default',
  'Dev exact release cannot become default'
);

select lives_ok(
  $$select public.set_model_release_channel_v1('research', 'model/lifecycle-test-v1')$$,
  'Dev exact release may serve research'
);

select lives_ok(
  $$select public.set_model_release_stage_v1('model/lifecycle-test-v1', 'stable')$$,
  'Dev exact release can promote to stable'
);

select lives_ok(
  $$select public.set_model_release_channel_v1('default', 'model/lifecycle-test-v1')$$,
  'Stable exact release may become default'
);

select is(
  (
    select stage
    from public.get_model_release_v3('model/lifecycle-test-v1')
  ),
  'stable',
  'Exact read exposes immutable release lifecycle without changing the ticket'
);

select is(
  (
    select stage
    from public.get_model_release_channel_v3('default')
  ),
  'stable',
  'Channel read exposes the resolved release stage'
);

select lives_ok(
  $$
    select public.register_model_surface_release_v1(
      'surface/lifecycle-test-v1',
      'model/lifecycle-test',
      'Lifecycle surface',
      '{
        "schemaId":"circleheart-studio-model-surface-release-v1",
        "surfaceReleaseId":"surface/lifecycle-test-v1",
        "modelFamilyId":"model/lifecycle-test",
        "displayName":"Lifecycle surface",
        "requiredCapabilities":[],
        "controlCatalog":[],
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
      'model/lifecycle-test',
      'Lifecycle surface',
      '{
        "schemaId":"circleheart-studio-model-surface-release-v1",
        "surfaceReleaseId":"surface/lifecycle-test-v1",
        "modelFamilyId":"model/lifecycle-test",
        "displayName":"Lifecycle surface",
        "requiredCapabilities":[],
        "controlCatalog":[],
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
    select public.set_model_surface_release_channel_v1(
      'model/lifecycle-test', 'default', 'surface/lifecycle-test-v1'
    )
  $$,
  '22023',
  'model surface release surface/lifecycle-test-v1 at stage dev cannot serve channel default',
  'Dev Surface cannot become default'
);

select lives_ok(
  $$
    select public.set_model_surface_release_channel_v1(
      'model/lifecycle-test', 'research', 'surface/lifecycle-test-v1'
    )
  $$,
  'Dev Surface may serve research'
);

select lives_ok(
  $$
    select public.set_model_surface_release_stage_v1(
      'surface/lifecycle-test-v1', 'stable'
    )
  $$,
  'Surface promotes from dev to stable'
);

select lives_ok(
  $$
    select public.set_model_surface_release_channel_v1(
      'model/lifecycle-test', 'default', 'surface/lifecycle-test-v1'
    )
  $$,
  'Stable Surface may become default'
);

select is(
  (
    select surface_release_id
    from public.get_model_surface_release_channel_v1(
      'model/lifecycle-test', 'default'
    )
  ),
  'surface/lifecycle-test-v1',
  'Surface channel resolves the immutable release'
);

select lives_ok(
  $$select public.set_model_release_stage_v1('model/lifecycle-test-v1', 'retired')$$,
  'Stable exact release can retire'
);

select is(
  (
    select count(*)::integer
    from studio.model_release_channels
    where model_id = 'model/lifecycle-test-v1'
  ),
  0,
  'Retirement removes mutable channel pointers'
);

select throws_ok(
  $$select public.set_model_release_stage_v1('model/lifecycle-test-v1', 'stable')$$,
  '22023',
  'model release model/lifecycle-test-v1 cannot move from retired to stable',
  'Retired release cannot return to stable'
);

select * from finish();

rollback;
