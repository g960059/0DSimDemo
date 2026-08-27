begin;

-- Every Surface, including a series root, must explicitly pin the exact
-- outputs it presents. Missing JSON keys evaluate to SQL NULL, so use
-- IS DISTINCT FROM instead of ordinary inequality at this boundary.
create or replace function studio.assert_model_surface_exact_output_exposure_v1(
  p_manifest jsonb
)
returns void
language plpgsql immutable
set search_path to ''
as $$
begin
  if pg_catalog.jsonb_typeof(
    p_manifest -> 'exposedExactOutputIds'
  ) is distinct from 'array'
  then
    raise exception 'model surface exact-output exposure must be an array'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(
      p_manifest -> 'exposedExactOutputIds'
    ) as output(value)
    where pg_catalog.jsonb_typeof(output.value) <> 'string'
      or nullif(pg_catalog.btrim(output.value #>> '{}'), '') is null
  ) or exists (
    select 1
    from pg_catalog.jsonb_array_elements(
      p_manifest -> 'exposedExactOutputIds'
    ) as output(value)
    group by output.value
    having count(*) > 1
  ) then
    raise exception
      'model surface exact-output exposure contains invalid or duplicate IDs'
      using errcode = '22023';
  end if;
end;
$$;

alter function studio.assert_model_surface_exact_output_exposure_v1(jsonb)
  owner to postgres;

create or replace function studio.assert_model_surface_registration_manifest_v1(
  p_manifest jsonb
)
returns void
language plpgsql immutable
set search_path to ''
as $$
declare
  catalog_name text;
  catalog_id_key text;
begin
  perform studio.assert_model_surface_exact_output_exposure_v1(p_manifest);

  foreach catalog_name in array array[
    'controlCatalog',
    'derivedOutputCatalog',
    'graphCatalog',
    'knobCatalog',
    'protocolCatalog'
  ]
  loop
    catalog_id_key := case catalog_name
      when 'controlCatalog' then 'controlId'
      when 'derivedOutputCatalog' then 'outputId'
      when 'graphCatalog' then 'graphId'
      when 'knobCatalog' then 'knobId'
      when 'protocolCatalog' then 'protocolId'
    end;
    if pg_catalog.jsonb_typeof(
      p_manifest -> catalog_name
    ) is distinct from 'array'
    then
      raise exception 'model surface % must be an array', catalog_name
        using errcode = '22023';
    end if;
    if exists (
      select 1
      from pg_catalog.jsonb_array_elements(
        p_manifest -> catalog_name
      ) as item(value)
      where pg_catalog.jsonb_typeof(item.value) <> 'object'
        or nullif(pg_catalog.btrim(item.value ->> catalog_id_key), '') is null
    ) or exists (
      select 1
      from pg_catalog.jsonb_array_elements(
        p_manifest -> catalog_name
      ) as item(value)
      group by item.value ->> catalog_id_key
      having count(*) > 1
    ) then
      raise exception 'model surface % contains invalid or duplicate item IDs',
        catalog_name using errcode = '22023';
    end if;
  end loop;
end;
$$;

alter function studio.assert_model_surface_registration_manifest_v1(jsonb)
  owner to postgres;

-- Keep the database boundary aligned with the TypeScript Surface validator.
-- An additive release may expose more exact outputs, but it cannot silently
-- hide an output already exposed by its series.
create or replace function studio.assert_additive_model_surface_upgrade_v1(
  p_previous_manifest jsonb,
  p_next_manifest jsonb
)
returns void
language plpgsql immutable
set search_path to ''
as $$
declare
  catalog_name text;
  catalog_id_key text;
begin
  perform studio.assert_model_surface_registration_manifest_v1(
    p_previous_manifest
  );
  perform studio.assert_model_surface_registration_manifest_v1(
    p_next_manifest
  );

  foreach catalog_name in array array[
    'controlCatalog',
    'derivedOutputCatalog',
    'graphCatalog',
    'knobCatalog',
    'protocolCatalog'
  ]
  loop
    catalog_id_key := case catalog_name
      when 'controlCatalog' then 'controlId'
      when 'derivedOutputCatalog' then 'outputId'
      when 'graphCatalog' then 'graphId'
      when 'knobCatalog' then 'knobId'
      when 'protocolCatalog' then 'protocolId'
    end;
    if exists (
      select 1
      from pg_catalog.jsonb_array_elements(
        p_previous_manifest -> catalog_name
      ) as previous_item(value)
      where not exists (
        select 1
        from pg_catalog.jsonb_array_elements(
          p_next_manifest -> catalog_name
        ) as next_item(value)
        where next_item.value = previous_item.value
      )
    ) then
      raise exception 'model surface upgrade cannot remove or redefine %',
        catalog_name using errcode = '22023';
    end if;
  end loop;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(
      p_previous_manifest -> 'exposedExactOutputIds'
    ) as previous_output(value)
    where not exists (
      select 1
      from pg_catalog.jsonb_array_elements(
        p_next_manifest -> 'exposedExactOutputIds'
      ) as next_output(value)
      where next_output.value = previous_output.value
    )
  ) then
    raise exception 'model surface upgrade cannot hide an exact output'
      using errcode = '22023';
  end if;
end;
$$;

alter function studio.assert_additive_model_surface_upgrade_v1(jsonb, jsonb)
  owner to postgres;

create or replace function studio.guard_model_surface_registration_manifest_v1()
returns trigger
language plpgsql
set search_path to ''
as $$
begin
  perform studio.assert_model_surface_registration_manifest_v1(new.manifest);
  return new;
end;
$$;

alter function studio.guard_model_surface_registration_manifest_v1()
  owner to postgres;

create trigger model_surface_registration_manifest_is_valid
before insert on studio.model_surface_releases
for each row execute function
  studio.guard_model_surface_registration_manifest_v1();

-- The default fixture affects only a newly launched Session. Saved content
-- already owns its fixture/checkpoint, and visible naming belongs to the
-- immutable Model Surface.
create table studio.model_launch_defaults (
  model_id text primary key references studio.model_releases(model_id),
  default_fixture jsonb not null check (
    jsonb_typeof(default_fixture) = 'object'
  ),
  version bigint not null default 1 check (version >= 1),
  updated_at timestamptz not null default now()
);

insert into studio.model_launch_defaults (model_id, default_fixture)
select model_id, default_fixture
from studio.model_releases
on conflict (model_id) do nothing;

alter table studio.model_launch_defaults enable row level security;
revoke all on table studio.model_launch_defaults from public;
grant select on table studio.model_launch_defaults to service_role;

-- Analysis methods are selected by immutable method IDs in the Model Surface.
-- The old model column remains only as physical migration storage. Current
-- tickets and APIs neither accept nor expose it as a third selector.
create function public.register_model_release_v3(
  p_model_id text,
  p_model_family_id text,
  p_display_name text,
  p_manifest jsonb,
  p_artifact_revision_id text,
  p_artifact_path text,
  p_artifact_sha256 text,
  p_source_commit text,
  p_default_fixture jsonb,
  p_expected_artifact_revision_id text,
  p_equivalence_report_sha256 text
)
returns jsonb
language plpgsql security definer
set search_path to ''
as $$
declare
  existing studio.model_releases%rowtype;
  registration jsonb;
  launch_version bigint;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('model-release:' || p_model_id, 0)
  );

  select * into existing
  from studio.model_releases
  where model_id = p_model_id;

  registration := public.register_model_release_v2(
    p_model_id,
    p_model_family_id,
    coalesce(existing.display_name, p_display_name),
    p_manifest,
    p_artifact_revision_id,
    p_artifact_path,
    p_artifact_sha256,
    p_source_commit,
    coalesce(existing.default_fixture, p_default_fixture),
    coalesce(existing.analysis_profile_id, 'surface-owned-methods-v1'),
    p_expected_artifact_revision_id,
    p_equivalence_report_sha256
  );

  insert into studio.model_launch_defaults as launch (
    model_id,
    default_fixture
  ) values (
    p_model_id,
    p_default_fixture
  )
  on conflict (model_id) do nothing
  returning version into launch_version;

  if launch_version is null then
    select version into launch_version
    from studio.model_launch_defaults
    where model_id = p_model_id;
  end if;

  return registration || jsonb_build_object(
    'launchDefaultVersion', launch_version
  );
end;
$$;

create function public.set_model_launch_default_fixture_v1(
  p_model_id text,
  p_default_fixture jsonb
)
returns jsonb
language plpgsql security definer
set search_path to ''
as $$
declare
  launch_version bigint;
begin
  if jsonb_typeof(p_default_fixture) is distinct from 'object' then
    raise exception 'default fixture must be a JSON object'
      using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('model-release:' || p_model_id, 0)
  );

  if not exists (
    select 1 from studio.model_releases where model_id = p_model_id
  ) then
    raise exception 'model release % is not registered', p_model_id
      using errcode = 'P0002';
  end if;

  insert into studio.model_launch_defaults as launch (
    model_id,
    default_fixture
  ) values (
    p_model_id,
    p_default_fixture
  )
  on conflict (model_id) do update
  set default_fixture = excluded.default_fixture,
      version = case
        when launch.default_fixture is distinct from excluded.default_fixture
        then launch.version + 1
        else launch.version
      end,
      updated_at = case
        when launch.default_fixture is distinct from excluded.default_fixture
        then now()
        else launch.updated_at
      end
  returning version into launch_version;

  return jsonb_build_object(
    'modelId', p_model_id,
    'launchDefaultVersion', launch_version
  );
end;
$$;

create function public.get_model_release_v2(p_model_id text)
returns table(
  model_id text,
  model_family_id text,
  display_name text,
  manifest jsonb,
  artifact_revision_id text,
  artifact_path text,
  module_abi text,
  default_fixture jsonb,
  stage text
)
language sql stable security definer
set search_path to ''
as $$
  select
    release.model_id,
    release.model_family_id,
    release.display_name,
    release.manifest,
    release.artifact_revision_id,
    release.artifact_path,
    release.module_abi,
    coalesce(launch.default_fixture, release.default_fixture),
    release.stage
  from public.get_model_release_v1(p_model_id) as release
  left join studio.model_launch_defaults as launch
    on launch.model_id = release.model_id;
$$;

create function public.get_active_model_bundle_v2()
returns table(
  bundle_version bigint,
  model_id text,
  model_family_id text,
  display_name text,
  manifest jsonb,
  artifact_revision_id text,
  artifact_path text,
  module_abi text,
  default_fixture jsonb,
  model_stage text,
  surface_release_id text,
  surface_manifest jsonb,
  surface_stage text
)
language sql stable security definer
set search_path to ''
as $$
  select
    bundle.bundle_version,
    bundle.model_id,
    bundle.model_family_id,
    bundle.display_name,
    bundle.manifest,
    bundle.artifact_revision_id,
    bundle.artifact_path,
    bundle.module_abi,
    coalesce(launch.default_fixture, bundle.default_fixture),
    bundle.model_stage,
    bundle.surface_release_id,
    bundle.surface_manifest,
    bundle.surface_stage
  from public.get_active_model_bundle_v1() as bundle
  left join studio.model_launch_defaults as launch
    on launch.model_id = bundle.model_id;
$$;

comment on column studio.model_releases.analysis_profile_id is
  'Legacy compatibility field. Current clients select versioned analysis methods from the pinned Model Surface.';
comment on column studio.model_releases.default_fixture is
  'Legacy fallback. Current new-Session default fixtures are stored in studio.model_launch_defaults.';

revoke all on function public.register_model_release_v3(
  text, text, text, jsonb, text, text, text, text, jsonb, text, text
) from public;
grant all on function public.register_model_release_v3(
  text, text, text, jsonb, text, text, text, text, jsonb, text, text
) to service_role;
revoke all on function public.set_model_launch_default_fixture_v1(
  text, jsonb
) from public;
grant all on function public.set_model_launch_default_fixture_v1(
  text, jsonb
) to service_role;

-- V2 registration is an internal storage adapter for the postgres-owned V3
-- wrapper and cannot be called by current publishers.
revoke all on function public.register_model_release_v2(
  text, text, text, jsonb, text, text, text, text, jsonb, text, text, text
) from service_role;

revoke all on function public.get_model_release_v2(text) from public;
grant all on function public.get_model_release_v2(text) to anon;
grant all on function public.get_model_release_v2(text) to authenticated;
grant all on function public.get_model_release_v2(text) to service_role;
revoke all on function public.get_active_model_bundle_v2() from public;
grant all on function public.get_active_model_bundle_v2() to anon;
grant all on function public.get_active_model_bundle_v2() to authenticated;
grant all on function public.get_active_model_bundle_v2() to service_role;

alter function public.register_model_release_v3(
  text, text, text, jsonb, text, text, text, text, jsonb, text, text
) owner to postgres;
alter function public.set_model_launch_default_fixture_v1(text, jsonb)
  owner to postgres;
alter function public.get_model_release_v2(text) owner to postgres;
alter function public.get_active_model_bundle_v2() owner to postgres;

commit;
