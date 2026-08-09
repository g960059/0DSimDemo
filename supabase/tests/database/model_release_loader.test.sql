begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

select lives_ok(
  $$
    select public.register_model_release_v1(
      'model/dynamic-loader-test-v1',
      'model/dynamic-loader-test',
      'Dynamic loader test',
      '{"schemaId":"circleheart-studio-exact-model-kernel-v3","modelId":"model/dynamic-loader-test-v1","modelFamilyId":"model/dynamic-loader-test"}'::jsonb,
      'model-releases/model/dynamic-loader-test-v1.mjs',
      repeat('a', 64),
      repeat('b', 64),
      'dynamic-loader-test',
      '{"schemaId":"fixture/test-v1","value":1}'::jsonb,
      'analysis/test-v1'
    )
  $$,
  'Standard registration atomically records immutable launch metadata'
);

select lives_ok(
  $$
    select public.register_model_release_v1(
      'model/dynamic-loader-test-v1',
      'model/dynamic-loader-test',
      'Dynamic loader test',
      '{"schemaId":"circleheart-studio-exact-model-kernel-v3","modelId":"model/dynamic-loader-test-v1","modelFamilyId":"model/dynamic-loader-test"}'::jsonb,
      'model-releases/model/dynamic-loader-test-v1.mjs',
      repeat('a', 64),
      repeat('b', 64),
      'dynamic-loader-test',
      '{"schemaId":"fixture/test-v1","value":1}'::jsonb,
      'analysis/test-v1'
    )
  $$,
  'Standard registration is idempotent for the same immutable launch contract'
);

select throws_ok(
  $$
    select public.register_model_release_v1(
      'model/dynamic-loader-test-v1',
      'model/dynamic-loader-test',
      'Dynamic loader test',
      '{"schemaId":"circleheart-studio-exact-model-kernel-v3","modelId":"model/dynamic-loader-test-v1","modelFamilyId":"model/dynamic-loader-test"}'::jsonb,
      'model-releases/model/dynamic-loader-test-v1.mjs',
      repeat('a', 64),
      repeat('b', 64),
      'dynamic-loader-test',
      '{"schemaId":"fixture/test-v1","value":1}'::jsonb,
      'analysis/changed-v1'
    )
  $$,
  '23505',
  'model_id model/dynamic-loader-test-v1 is already registered with different release bytes or contract',
  'Standard registration rejects rebinding launch metadata for an exact modelId'
);

select is(
  (
    select module_abi
    from public.get_model_release_v1('model/dynamic-loader-test-v1')
  ),
  'circleheart-exact-model-esm-v1',
  'Exact release lookup exposes the only supported Standard module ABI'
);

select is(
  (
    select default_fixture
    from public.get_model_release_v1('model/dynamic-loader-test-v1')
  ),
  '{"schemaId":"fixture/test-v1","value":1}'::jsonb,
  'Exact release lookup returns the immutable default fixture'
);

select ok(
  not (
    select to_jsonb(release)
    from public.get_model_release_v1('model/dynamic-loader-test-v1') as release
  ) ?| array['artifact_sha256', 'registry_fingerprint', 'source_commit'],
  'Browser release lookup does not expose registry integrity metadata'
);

select * from finish();

rollback;
