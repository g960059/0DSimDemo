begin;

create table studio.model_release_modules (
  model_id text primary key
    references studio.model_releases(model_id) on delete restrict,
  module_abi text not null,
  default_fixture jsonb not null,
  analysis_profile_id text not null,
  registered_at timestamptz not null default now(),
  constraint model_release_modules_supported_abi check (
    module_abi in (
      'legacy-main-wire-v3-development-36',
      'circleheart-exact-model-esm-v1'
    )
  ),
  constraint model_release_modules_default_fixture_object
    check (jsonb_typeof(default_fixture) = 'object'),
  constraint model_release_modules_analysis_profile_nonempty
    check (
      analysis_profile_id = btrim(analysis_profile_id)
      and char_length(analysis_profile_id) between 1 and 256
    )
);

comment on table studio.model_release_modules is
  'Immutable loader ABI metadata for exact-model ESM artifacts. It selects an entry point and is not model identity or client integrity metadata.';

create trigger model_release_modules_are_immutable
before update or delete on studio.model_release_modules
for each row execute function studio.reject_immutable_row_mutation_v1();

alter table studio.model_release_modules enable row level security;
revoke all on studio.model_release_modules from public, anon, authenticated;
grant all on studio.model_release_modules to service_role;

-- The committed development-36 artifact predates the standard ABI. Keep its
-- bytes, lock, and modelId unchanged and attach only registry loader metadata.
insert into studio.model_release_modules (
  model_id,
  module_abi,
  default_fixture,
  analysis_profile_id
)
select
  model_id,
  'legacy-main-wire-v3-development-36',
  '{
    "schemaId":"circleheart.main-wire-integrated-v3-regular-sinus-all-off-fixture.v5",
    "rhythm":{"mode":"regular-sinus-v3"},
    "coronary":{"diseaseProfile":"normal-coronary-v2"},
    "dynamicMechanicalSupport":{"mode":"all-off-zero-inertance-v3"},
    "hemodynamicResearchInputs":{
      "systemicResistance":1.0,
      "pulmonaryResistance":0.625,
      "venousTone":0.15,
      "arterialStiffness":0.75,
      "heartRateBpm":60,
      "totalBloodVolumeMl":5600,
      "peepCmH2O":0
    }
  }'::jsonb,
  'main-wire-integrated-v3'
from studio.model_releases
where model_id =
  'circleheart.main-wire-integrated-transaction-v3.regular-sinus-all-off.development-36'
on conflict (model_id) do nothing;

create or replace function public.register_model_release_v2(
  p_model_id text,
  p_model_family_id text,
  p_display_name text,
  p_manifest jsonb,
  p_artifact_path text,
  p_artifact_sha256 text,
  p_registry_fingerprint text,
  p_source_commit text,
  p_module_abi text,
  p_default_fixture jsonb,
  p_analysis_profile_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  release_row jsonb;
  existing_module studio.model_release_modules%rowtype;
begin
  if p_module_abi not in (
    'legacy-main-wire-v3-development-36',
    'circleheart-exact-model-esm-v1'
  ) then
    raise exception 'unsupported exact-model module ABI %', p_module_abi
      using errcode = '22023';
  end if;
  if jsonb_typeof(p_default_fixture) is distinct from 'object' then
    raise exception 'default fixture must be a JSON object'
      using errcode = '22023';
  end if;

  -- V1 remains the byte/manifest authority. Its transaction-scoped advisory
  -- lock also serializes the ABI attachment below for the same exact modelId.
  release_row := public.register_model_release_v1(
    p_model_id,
    p_model_family_id,
    p_display_name,
    p_manifest,
    p_artifact_path,
    p_artifact_sha256,
    p_registry_fingerprint,
    p_source_commit
  );

  select * into existing_module
  from studio.model_release_modules
  where model_id = p_model_id;

  if found then
    if existing_module.module_abi is distinct from p_module_abi
      or existing_module.default_fixture is distinct from p_default_fixture
      or existing_module.analysis_profile_id is distinct from p_analysis_profile_id
    then
      raise exception 'model_id % is already registered with another module launch contract',
        p_model_id using errcode = '23505';
    end if;
  else
    insert into studio.model_release_modules (
      model_id,
      module_abi,
      default_fixture,
      analysis_profile_id
    ) values (
      p_model_id,
      p_module_abi,
      p_default_fixture,
      p_analysis_profile_id
    );
  end if;

  return release_row || jsonb_build_object(
    'module_abi', p_module_abi,
    'default_fixture', p_default_fixture,
    'analysis_profile_id', p_analysis_profile_id
  );
end;
$$;

create or replace function public.get_model_release_v2(
  p_model_id text
)
returns table (
  model_id text,
  model_family_id text,
  display_name text,
  manifest jsonb,
  artifact_path text,
  module_abi text,
  default_fixture jsonb,
  analysis_profile_id text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.model_id,
    r.model_family_id,
    r.display_name,
    r.manifest,
    r.artifact_path,
    m.module_abi,
    m.default_fixture,
    m.analysis_profile_id
  from studio.model_releases as r
  join studio.model_release_availability as a on a.model_id = r.model_id
  join studio.model_release_modules as m on m.model_id = r.model_id
  where r.model_id = p_model_id and a.loadable;
$$;

create or replace function public.get_model_release_channel_v2(
  p_channel text
)
returns table (
  channel text,
  model_id text,
  model_family_id text,
  display_name text,
  manifest jsonb,
  artifact_path text,
  module_abi text,
  default_fixture jsonb,
  analysis_profile_id text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.channel,
    r.model_id,
    r.model_family_id,
    r.display_name,
    r.manifest,
    r.artifact_path,
    m.module_abi,
    m.default_fixture,
    m.analysis_profile_id
  from studio.model_release_channels as c
  join studio.model_releases as r on r.model_id = c.model_id
  join studio.model_release_availability as a on a.model_id = r.model_id
  join studio.model_release_modules as m on m.model_id = r.model_id
  where c.channel = p_channel and a.loadable;
$$;

revoke all on function public.register_model_release_v2(
  text, text, text, jsonb, text, text, text, text, text, jsonb, text
) from public, anon, authenticated;
grant execute on function public.register_model_release_v2(
  text, text, text, jsonb, text, text, text, text, text, jsonb, text
) to service_role;

revoke all on function public.get_model_release_v2(text) from public;
grant execute on function public.get_model_release_v2(text) to anon, authenticated;
revoke all on function public.get_model_release_channel_v2(text) from public;
grant execute on function public.get_model_release_channel_v2(text)
  to anon, authenticated;

commit;
