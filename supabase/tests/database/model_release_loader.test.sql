begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

select lives_ok(
  $$
    select public.register_model_release_v2(
      'model/dynamic-loader-test-v1',
      'model/dynamic-loader-test',
      'Dynamic loader test',
      '{"modelId":"model/dynamic-loader-test-v1"}'::jsonb,
      'model-releases/model/dynamic-loader-test-v1.mjs',
      repeat('a', 64),
      repeat('b', 64),
      'dynamic-loader-test',
      'circleheart-exact-model-esm-v1',
      '{"schemaId":"fixture/test-v1","value":1}'::jsonb,
      'analysis/test-v1'
    )
  $$,
  'V2 registration atomically attaches immutable module launch metadata'
);

select lives_ok(
  $$
    select public.register_model_release_v2(
      'model/dynamic-loader-test-v1',
      'model/dynamic-loader-test',
      'Dynamic loader test',
      '{"modelId":"model/dynamic-loader-test-v1"}'::jsonb,
      'model-releases/model/dynamic-loader-test-v1.mjs',
      repeat('a', 64),
      repeat('b', 64),
      'dynamic-loader-test',
      'circleheart-exact-model-esm-v1',
      '{"schemaId":"fixture/test-v1","value":1}'::jsonb,
      'analysis/test-v1'
    )
  $$,
  'V2 registration is idempotent for the same immutable launch contract'
);

select throws_ok(
  $$
    select public.register_model_release_v2(
      'model/dynamic-loader-test-v1',
      'model/dynamic-loader-test',
      'Dynamic loader test',
      '{"modelId":"model/dynamic-loader-test-v1"}'::jsonb,
      'model-releases/model/dynamic-loader-test-v1.mjs',
      repeat('a', 64),
      repeat('b', 64),
      'dynamic-loader-test',
      'circleheart-exact-model-esm-v1',
      '{"schemaId":"fixture/test-v1","value":1}'::jsonb,
      'analysis/changed-v1'
    )
  $$,
  '23505',
  'model_id model/dynamic-loader-test-v1 is already registered with another module launch contract',
  'V2 registration rejects rebinding loader metadata for an exact modelId'
);

select is(
  (
    select module_abi
    from public.get_model_release_v2('model/dynamic-loader-test-v1')
  ),
  'circleheart-exact-model-esm-v1',
  'Exact release lookup returns the registered module ABI'
);

select is(
  (
    select default_fixture
    from public.get_model_release_v2('model/dynamic-loader-test-v1')
  ),
  '{"schemaId":"fixture/test-v1","value":1}'::jsonb,
  'Exact release lookup returns the immutable default fixture'
);

select ok(
  not (
    select to_jsonb(release)
    from public.get_model_release_v2('model/dynamic-loader-test-v1') as release
  ) ?| array['artifact_sha256', 'registry_fingerprint', 'source_commit'],
  'Browser release lookup does not expose registry integrity metadata'
);

select lives_ok(
  $$
    select public.set_model_release_channel_v1(
      'research',
      'model/dynamic-loader-test-v1'
    )
  $$,
  'A channel can point to the loadable exact release'
);

select results_eq(
  $$
    select model_id, module_abi, analysis_profile_id
    from public.get_model_release_channel_v2('research')
  $$,
  $$
    values (
      'model/dynamic-loader-test-v1'::text,
      'circleheart-exact-model-esm-v1'::text,
      'analysis/test-v1'::text
    )
  $$,
  'Channel resolution returns one immediately pinnable exact release'
);

select * from finish();

rollback;
