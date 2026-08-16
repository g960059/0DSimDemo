begin;

create extension if not exists pgtap with schema extensions;

select plan(20);

select lives_ok(
  $$
    select public.register_model_release_v2(
      'model/dynamic-loader-test-v1',
      'model/dynamic-loader-test',
      'Dynamic loader test',
      '{"schemaId":"circleheart-studio-exact-model-kernel-v3","modelId":"model/dynamic-loader-test-v1","modelFamilyId":"model/dynamic-loader-test"}'::jsonb,
      repeat('b', 64),
      'model-releases/model/dynamic-loader-test-v1/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/model.mjs',
      repeat('a', 64),
      'dynamic-loader-test',
      '{"schemaId":"fixture/test-v1","value":1}'::jsonb,
      'analysis/test-v1',
      null,
      null
    )
  $$,
  'Standard registration atomically records a scientific model and its first artifact revision'
);

select lives_ok(
  $$
    select public.register_model_release_v2(
      'model/dynamic-loader-test-v1',
      'model/dynamic-loader-test',
      'Dynamic loader test',
      '{"schemaId":"circleheart-studio-exact-model-kernel-v3","modelId":"model/dynamic-loader-test-v1","modelFamilyId":"model/dynamic-loader-test"}'::jsonb,
      repeat('b', 64),
      'model-releases/model/dynamic-loader-test-v1/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/model.mjs',
      repeat('a', 64),
      'later-idempotent-publisher',
      '{"schemaId":"fixture/test-v1","value":1}'::jsonb,
      'analysis/test-v1',
      null,
      null
    )
  $$,
  'Artifact registration is idempotent across publisher source commits'
);

select throws_ok(
  $$
    select public.register_model_release_v2(
      'model/dynamic-loader-test-v1',
      'model/dynamic-loader-test',
      'Dynamic loader test',
      '{"schemaId":"circleheart-studio-exact-model-kernel-v3","modelId":"model/dynamic-loader-test-v1","modelFamilyId":"model/dynamic-loader-test"}'::jsonb,
      repeat('b', 64),
      'model-releases/model/dynamic-loader-test-v1/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/model.mjs',
      repeat('a', 64),
      'dynamic-loader-test',
      '{"schemaId":"fixture/test-v1","value":1}'::jsonb,
      'analysis/changed-v1',
      null,
      null
    )
  $$,
  '23505',
  'model_id model/dynamic-loader-test-v1 is already registered with another scientific contract',
  'Registration rejects a scientific-contract change under one modelId'
);

select throws_ok(
  $$
    select public.register_model_release_v2(
      'model/dynamic-loader-test-v1',
      'model/dynamic-loader-test',
      'Dynamic loader test',
      '{"schemaId":"circleheart-studio-exact-model-kernel-v3","modelId":"model/dynamic-loader-test-v1","modelFamilyId":"model/dynamic-loader-test"}'::jsonb,
      repeat('d', 64),
      'model-releases/model/dynamic-loader-test-v1/dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd/model.mjs',
      repeat('e', 64),
      'dynamic-loader-successor',
      '{"schemaId":"fixture/test-v1","value":1}'::jsonb,
      'analysis/test-v1',
      repeat('b', 64),
      null
    )
  $$,
  '22023',
  'a same-model artifact successor requires byte-exact equivalence evidence',
  'A same-model artifact successor requires explicit equivalence evidence'
);

select throws_ok(
  $$
    select public.register_model_release_v2(
      'model/dynamic-loader-test-v1',
      'model/dynamic-loader-test',
      'Dynamic loader test',
      '{"schemaId":"circleheart-studio-exact-model-kernel-v3","modelId":"model/dynamic-loader-test-v1","modelFamilyId":"model/dynamic-loader-test"}'::jsonb,
      repeat('d', 64),
      'model-releases/model/dynamic-loader-test-v1/dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd/model.mjs',
      repeat('e', 64),
      'dynamic-loader-successor',
      '{"schemaId":"fixture/test-v1","value":1}'::jsonb,
      'analysis/test-v1',
      repeat('f', 64),
      repeat('c', 64)
    )
  $$,
  '40001',
  'model artifact revision conflict',
  'Artifact pointer movement is compare-and-swap guarded'
);

select lives_ok(
  $$
    select public.register_model_release_v2(
      'model/dynamic-loader-test-v1',
      'model/dynamic-loader-test',
      'Dynamic loader test',
      '{"schemaId":"circleheart-studio-exact-model-kernel-v3","modelId":"model/dynamic-loader-test-v1","modelFamilyId":"model/dynamic-loader-test"}'::jsonb,
      repeat('d', 64),
      'model-releases/model/dynamic-loader-test-v1/dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd/model.mjs',
      repeat('e', 64),
      'dynamic-loader-successor',
      '{"schemaId":"fixture/test-v1","value":1}'::jsonb,
      'analysis/test-v1',
      repeat('b', 64),
      repeat('c', 64)
    )
  $$,
  'A byte-exact implementation successor moves the artifact pointer without changing modelId'
);

select is(
  (select artifact_revision_id
    from public.get_model_release_v1('model/dynamic-loader-test-v1')),
  repeat('d', 64),
  'Exact lookup resolves the current certified implementation revision'
);

select is(
  (select version from studio.model_artifact_bindings
    where model_id = 'model/dynamic-loader-test-v1'),
  1::bigint,
  'Same-model artifact replacement increments its independent binding version'
);

select is(
  (select count(*) from studio.model_artifact_revisions
    where model_id = 'model/dynamic-loader-test-v1'),
  2::bigint,
  'Both immutable implementation revisions remain registered'
);

select lives_ok(
  $$
    select public.rebind_model_artifact_revision_v1(
      'model/dynamic-loader-test-v1',
      repeat('d', 64),
      repeat('b', 64)
    )
  $$,
  'A certified successor can roll back to its directly equivalent predecessor'
);

select is(
  (select artifact_revision_id
    from public.get_model_release_v1('model/dynamic-loader-test-v1')),
  repeat('b', 64),
  'Rollback moves only the implementation binding'
);

select is(
  (select version from studio.model_artifact_bindings
    where model_id = 'model/dynamic-loader-test-v1'),
  2::bigint,
  'Rollback increments the artifact binding CAS version'
);

select throws_ok(
  $$
    select public.rebind_model_artifact_revision_v1(
      'model/dynamic-loader-test-v1',
      repeat('d', 64),
      repeat('d', 64)
    )
  $$,
  '40001',
  'model artifact revision conflict',
  'Rollback rejects a stale expected revision'
);

select lives_ok(
  $$
    select public.rebind_model_artifact_revision_v1(
      'model/dynamic-loader-test-v1',
      repeat('b', 64),
      repeat('d', 64)
    )
  $$,
  'A rollback can be reversed through the same stored equivalence edge'
);

select lives_ok(
  $$
    select public.rebind_model_artifact_revision_v1(
      'model/dynamic-loader-test-v1',
      repeat('d', 64),
      repeat('d', 64)
    )
  $$,
  'Rebinding to the current revision is idempotent'
);

select throws_ok(
  $$
    select public.rebind_model_artifact_revision_v1(
      'model/dynamic-loader-test-v1',
      repeat('d', 64),
      repeat('f', 64)
    )
  $$,
  '23503',
  'target model artifact revision ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff is not registered for model/dynamic-loader-test-v1',
  'Rebinding rejects an unregistered target revision'
);

select ok(
  not pg_catalog.has_table_privilege(
    'service_role',
    'studio.model_artifact_bindings',
    'UPDATE'
  ),
  'The service role cannot bypass artifact-binding CAS through direct table writes'
);

select is(
  (select module_abi
    from public.get_model_release_v1('model/dynamic-loader-test-v1')),
  'circleheart-exact-model-esm-v1',
  'Exact release lookup exposes the supported Standard module ABI'
);

select is(
  (select default_fixture
    from public.get_model_release_v1('model/dynamic-loader-test-v1')),
  '{"schemaId":"fixture/test-v1","value":1}'::jsonb,
  'Exact release lookup returns the immutable default fixture'
);

select ok(
  not (
    select to_jsonb(release)
    from public.get_model_release_v1('model/dynamic-loader-test-v1') as release
  ) ?| array['artifact_sha256', 'equivalence_report_sha256', 'source_commit'],
  'Browser release lookup exposes only the opaque revision, not integrity evidence'
);

select * from finish();

rollback;
