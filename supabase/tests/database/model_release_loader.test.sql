begin;

create extension if not exists pgtap with schema extensions;

select plan(43);

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
  'model_id model/dynamic-loader-test-v1 is already registered with different immutable launch metadata',
  'Registration distinguishes immutable launch metadata from model identity'
);

select throws_ok(
  $$
    select public.register_model_release_v2(
      'model/dynamic-loader-test-v1',
      'model/dynamic-loader-test',
      'Dynamic loader test',
      '{"schemaId":"circleheart-studio-exact-model-kernel-v3","modelId":"model/dynamic-loader-test-v1","modelFamilyId":"model/dynamic-loader-test","checkpointSemantics":"changed"}'::jsonb,
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
  '23505',
  'model_id model/dynamic-loader-test-v1 is already registered with another scientific contract',
  'Registration rejects a scientific-manifest change under one modelId'
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
    select public.register_model_release_v2(
      'model/dynamic-loader-test-v1',
      'model/dynamic-loader-test',
      'Dynamic loader test',
      '{"schemaId":"circleheart-studio-exact-model-kernel-v3","modelId":"model/dynamic-loader-test-v1","modelFamilyId":"model/dynamic-loader-test"}'::jsonb,
      repeat('d', 64),
      'model-releases/model/dynamic-loader-test-v1/dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd/model.mjs',
      repeat('e', 64),
      'dynamic-loader-successor-redeploy',
      '{"schemaId":"fixture/test-v1","value":1}'::jsonb,
      'analysis/test-v1',
      repeat('b', 64),
      repeat('c', 64)
    )
  $$,
  'Redeploying an already registered successor safely rolls forward through the stored equivalence edge'
);

select is(
  (select version from studio.model_artifact_bindings
    where model_id = 'model/dynamic-loader-test-v1'),
  3::bigint,
  'Roll-forward redeployment increments the artifact binding CAS version'
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

select is(
  (select version from studio.model_artifact_bindings
    where model_id = 'model/dynamic-loader-test-v1'),
  3::bigint,
  'An idempotent rebind does not increment the artifact binding version'
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

select lives_ok(
  $$
    select public.set_model_launch_default_fixture_v1(
      'model/dynamic-loader-test-v1',
      '{"schemaId":"fixture/test-v1","value":2}'::jsonb
    )
  $$,
  'The launch fixture can change without publishing an exact artifact'
);

select is(
  (select display_name
    from public.get_model_release_v2('model/dynamic-loader-test-v1')),
  'Dynamic loader test',
  'Visible model-row metadata remains immutable; Surface owns product naming'
);

select is(
  (select default_fixture
    from public.get_model_release_v2('model/dynamic-loader-test-v1')),
  '{"schemaId":"fixture/test-v1","value":2}'::jsonb,
  'Current lookup resolves the independently mutable launch fixture'
);

select is(
  (select manifest
    from public.get_model_release_v2('model/dynamic-loader-test-v1')),
  '{"schemaId":"circleheart-studio-exact-model-kernel-v3","modelId":"model/dynamic-loader-test-v1","modelFamilyId":"model/dynamic-loader-test"}'::jsonb,
  'A launch-default update leaves the exact manifest unchanged'
);

select throws_ok(
  $$
    select public.register_model_release_v3(
      'model/dynamic-loader-test-v1',
      'model/dynamic-loader-test',
      'Ignored replacement name',
      '{"schemaId":"circleheart-studio-exact-model-kernel-v3","modelId":"model/dynamic-loader-test-v1","modelFamilyId":"model/dynamic-loader-test","primitiveSignalCatalog":[{"outputId":"signal/new"}]}'::jsonb,
      repeat('d', 64),
      'model-releases/model/dynamic-loader-test-v1/dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd/model.mjs',
      repeat('e', 64),
      'invalid-same-model-primitive-addition',
      '{"schemaId":"fixture/test-v1","value":2}'::jsonb,
      null,
      null
    )
  $$,
  '23505',
  'model_id model/dynamic-loader-test-v1 is already registered with another scientific contract',
  'A primitive-catalog change cannot reuse an existing modelId'
);

select ok(
  not pg_catalog.has_function_privilege(
    'service_role',
    'public.register_model_release_v2(text,text,text,jsonb,text,text,text,text,jsonb,text,text,text)',
    'EXECUTE'
  ),
  'Current publishers cannot register a legacy analysis-profile selector'
);

select ok(
  not (
    select to_jsonb(release)
    from public.get_model_release_v2('model/dynamic-loader-test-v1') as release
  ) ? 'analysis_profile_id',
  'Current release reads do not expose the legacy analysis-profile selector'
);

select is(
  (
    public.register_model_release_v3(
      'model/dynamic-loader-v3-test-v1',
      'model/dynamic-loader-v3-test',
      'V3 registration test',
      '{"schemaId":"circleheart-studio-exact-model-kernel-v3","modelId":"model/dynamic-loader-v3-test-v1","modelFamilyId":"model/dynamic-loader-v3-test"}'::jsonb,
      repeat('4', 64),
      'model-releases/model/dynamic-loader-v3-test-v1/4444444444444444444444444444444444444444444444444444444444444444/model.mjs',
      repeat('5', 64),
      'dynamic-loader-v3-test',
      '{"schemaId":"fixture/v3-test-v1","value":1}'::jsonb,
      null,
      null
    ) ->> 'launchDefaultVersion'
  )::bigint,
  1::bigint,
  'V3 registration seeds one independently versioned launch default'
);

select lives_ok(
  $$
    select public.set_model_launch_default_fixture_v1(
      'model/dynamic-loader-v3-test-v1',
      '{"schemaId":"fixture/v3-test-v1","value":2}'::jsonb
    )
  $$,
  'The operator can update a V3-registered launch default'
);

select is(
  (
    public.register_model_release_v3(
      'model/dynamic-loader-v3-test-v1',
      'model/dynamic-loader-v3-test',
      'Ignored replacement name',
      '{"schemaId":"circleheart-studio-exact-model-kernel-v3","modelId":"model/dynamic-loader-v3-test-v1","modelFamilyId":"model/dynamic-loader-v3-test"}'::jsonb,
      repeat('4', 64),
      'model-releases/model/dynamic-loader-v3-test-v1/4444444444444444444444444444444444444444444444444444444444444444/model.mjs',
      repeat('5', 64),
      'dynamic-loader-v3-republish',
      '{"schemaId":"fixture/v3-test-v1","value":3}'::jsonb,
      null,
      null
    ) ->> 'launchDefaultVersion'
  )::bigint,
  2::bigint,
  'Artifact republish preserves the independently updated launch-default version'
);

select is(
  (select default_fixture
    from public.get_model_release_v2('model/dynamic-loader-v3-test-v1')),
  '{"schemaId":"fixture/v3-test-v1","value":2}'::jsonb,
  'Artifact republish does not overwrite the operator launch default'
);

select is(
  (select display_name
    from public.get_model_release_v2('model/dynamic-loader-v3-test-v1')),
  'V3 registration test',
  'Artifact republish does not mutate legacy model-row naming metadata'
);

select ok(
  pg_catalog.has_function_privilege(
    'service_role',
    'public.register_model_release_v3(text,text,text,jsonb,text,text,text,text,jsonb,text,text)',
    'EXECUTE'
  )
  and pg_catalog.has_function_privilege(
    'service_role',
    'public.set_model_launch_default_fixture_v1(text,jsonb)',
    'EXECUTE'
  )
  and pg_catalog.has_function_privilege(
    'service_role',
    'public.get_model_release_v2(text)',
    'EXECUTE'
  )
  and pg_catalog.has_function_privilege(
    'service_role',
    'public.get_active_model_bundle_v2()',
    'EXECUTE'
  ),
  'The service role can publish and resolve through only the current APIs'
);

select lives_ok(
  $$
    select public.register_model_surface_release_v1(
      'surface/dynamic-loader-v3-test-v1',
      'surface-series/dynamic-loader-v3-test',
      null,
      'model/dynamic-loader-v3-test',
      'V3 test surface',
      '{
        "schemaId":"circleheart-studio-model-surface-release-v1",
        "surfaceReleaseId":"surface/dynamic-loader-v3-test-v1",
        "surfaceSeriesId":"surface-series/dynamic-loader-v3-test",
        "predecessorSurfaceReleaseId":null,
        "modelFamilyId":"model/dynamic-loader-v3-test",
        "displayName":"V3 test surface",
        "exposedExactOutputIds":[],
        "controlCatalog":[],
        "derivedOutputCatalog":[],
        "graphCatalog":[],
        "knobCatalog":[],
        "protocolCatalog":[]
      }'::jsonb,
      'dynamic-loader-v3-test'
    )
  $$,
  'A Surface can be registered for the V3 exact release'
);

select lives_ok(
  $$
    select public.register_model_surface_release_v1(
      'surface/dynamic-loader-v3-test-v2',
      'surface-series/dynamic-loader-v3-test',
      'surface/dynamic-loader-v3-test-v1',
      'model/dynamic-loader-v3-test',
      'V3 test surface v2',
      '{
        "schemaId":"circleheart-studio-model-surface-release-v1",
        "surfaceReleaseId":"surface/dynamic-loader-v3-test-v2",
        "surfaceSeriesId":"surface-series/dynamic-loader-v3-test",
        "predecessorSurfaceReleaseId":"surface/dynamic-loader-v3-test-v1",
        "modelFamilyId":"model/dynamic-loader-v3-test",
        "displayName":"V3 test surface v2",
        "exposedExactOutputIds":["signal/test"],
        "controlCatalog":[],
        "derivedOutputCatalog":[],
        "graphCatalog":[],
        "knobCatalog":[],
        "protocolCatalog":[]
      }'::jsonb,
      'dynamic-loader-v3-test'
    )
  $$,
  'An additive Surface successor may expose another exact output'
);

select throws_ok(
  $$
    select public.register_model_surface_release_v1(
      'surface/dynamic-loader-v3-test-v3-invalid',
      'surface-series/dynamic-loader-v3-test',
      'surface/dynamic-loader-v3-test-v2',
      'model/dynamic-loader-v3-test',
      'Invalid V3 test surface v3',
      '{
        "schemaId":"circleheart-studio-model-surface-release-v1",
        "surfaceReleaseId":"surface/dynamic-loader-v3-test-v3-invalid",
        "surfaceSeriesId":"surface-series/dynamic-loader-v3-test",
        "predecessorSurfaceReleaseId":"surface/dynamic-loader-v3-test-v2",
        "modelFamilyId":"model/dynamic-loader-v3-test",
        "displayName":"Invalid V3 test surface v3",
        "exposedExactOutputIds":[],
        "controlCatalog":[],
        "derivedOutputCatalog":[],
        "graphCatalog":[],
        "knobCatalog":[],
        "protocolCatalog":[]
      }'::jsonb,
      'dynamic-loader-v3-test'
    )
  $$,
  '22023',
  'model surface upgrade cannot hide an exact output',
  'A Surface successor cannot hide an exact output in the same series'
);

select lives_ok(
  $$select public.set_model_release_stage_v1(
    'model/dynamic-loader-v3-test-v1', 'stable'
  )$$,
  'The V3 exact release can be promoted'
);

select lives_ok(
  $$select public.set_model_surface_release_stage_v1(
    'surface/dynamic-loader-v3-test-v1', 'stable'
  )$$,
  'The V3 Surface can be promoted'
);

select lives_ok(
  $$
    select public.set_active_model_bundle_v1(
      null,
      'model/dynamic-loader-v3-test-v1',
      'surface/dynamic-loader-v3-test-v1'
    )
  $$,
  'The V3 exact/Surface pair can become the launch bundle'
);

select is(
  (select default_fixture from public.get_active_model_bundle_v2()),
  '{"schemaId":"fixture/v3-test-v1","value":2}'::jsonb,
  'Active-bundle V2 resolves the operator launch default'
);

select * from finish();

rollback;
