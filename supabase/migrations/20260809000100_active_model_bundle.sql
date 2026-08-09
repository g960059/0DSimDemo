begin;

-- New authoring Sessions need one coherent launch decision, not two mutable
-- channel reads that can observe different releases. Historical content keeps
-- resolving its exact modelId and Surface pins through the immutable release
-- registries.
create table studio.active_model_bundle (
  singleton boolean primary key default true,
  version bigint not null default 0,
  model_id text not null
    references studio.model_releases(model_id) on delete restrict,
  surface_release_id text not null
    references studio.model_surface_releases(surface_release_id)
    on delete restrict,
  updated_at timestamptz not null default now(),
  constraint active_model_bundle_singleton check (singleton),
  constraint active_model_bundle_version check (version >= 0)
);

comment on table studio.active_model_bundle is
  'Singleton CAS pointer for the exact model and Model Surface used by new Sessions. It is not content identity and never repins existing content.';

alter table studio.active_model_bundle enable row level security;
revoke all on studio.active_model_bundle from public, anon, authenticated;
grant all on studio.active_model_bundle to service_role;

-- Preserve an already coherent stable default pair when upgrading an existing
-- pre-release registry. An empty pointer is allowed until the release operator
-- explicitly activates a stable bundle.
insert into studio.active_model_bundle (
  singleton,
  version,
  model_id,
  surface_release_id
)
select
  true,
  0,
  model_channel.model_id,
  surface_channel.surface_release_id
from studio.model_release_channels as model_channel
join studio.model_releases as model
  on model.model_id = model_channel.model_id
join studio.model_release_availability as model_availability
  on model_availability.model_id = model.model_id
join studio.model_release_modules as model_module
  on model_module.model_id = model.model_id
join studio.model_surface_release_channels as surface_channel
  on surface_channel.model_family_id = model.model_family_id
 and surface_channel.channel = 'default'
join studio.model_surface_releases as surface
  on surface.surface_release_id = surface_channel.surface_release_id
join studio.model_surface_release_availability as surface_availability
  on surface_availability.surface_release_id = surface.surface_release_id
where model_channel.channel = 'default'
  and model_availability.loadable
  and model_availability.stage = 'stable'
  and model_module.module_abi = 'circleheart-exact-model-esm-v1'
  and surface_availability.stage = 'stable'
limit 1;

create function public.set_active_model_bundle_v1(
  p_expected_version bigint,
  p_model_id text,
  p_surface_release_id text
)
returns table (
  version bigint,
  model_id text,
  surface_release_id text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_bundle studio.active_model_bundle%rowtype;
  model_family text;
  model_stage text;
  model_loadable boolean;
  model_module_abi text;
  surface_family text;
  surface_stage text;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('circleheart-active-model-bundle-v1', 0)
  );

  select
    release.model_family_id,
    availability.stage,
    availability.loadable,
    module.module_abi
  into model_family, model_stage, model_loadable, model_module_abi
  from studio.model_releases as release
  join studio.model_release_availability as availability
    on availability.model_id = release.model_id
  join studio.model_release_modules as module
    on module.model_id = release.model_id
  where release.model_id = p_model_id;
  if not found or not model_loadable then
    raise exception 'active model release % is not registered and loadable',
      p_model_id using errcode = '23503';
  end if;
  if model_stage <> 'stable' then
    raise exception 'active model release % must be stable, not %',
      p_model_id, model_stage using errcode = '22023';
  end if;
  if model_module_abi <> 'circleheart-exact-model-esm-v1' then
    raise exception 'active model release % must use the Standard module ABI, not %',
      p_model_id, model_module_abi using errcode = '22023';
  end if;

  select release.model_family_id, availability.stage
  into surface_family, surface_stage
  from studio.model_surface_releases as release
  join studio.model_surface_release_availability as availability
    on availability.surface_release_id = release.surface_release_id
  where release.surface_release_id = p_surface_release_id;
  if not found then
    raise exception 'active Model Surface release % is not registered',
      p_surface_release_id using errcode = '23503';
  end if;
  if surface_stage <> 'stable' then
    raise exception 'active Model Surface release % must be stable, not %',
      p_surface_release_id, surface_stage using errcode = '22023';
  end if;
  if surface_family <> model_family then
    raise exception 'active model and Model Surface must share a model family'
      using errcode = '22023';
  end if;

  select * into current_bundle
  from studio.active_model_bundle
  where singleton
  for update;

  if not found then
    if p_expected_version is not null then
      raise exception 'active model bundle version conflict'
        using errcode = '40001';
    end if;
    insert into studio.active_model_bundle (
      singleton, version, model_id, surface_release_id
    ) values (
      true, 0, p_model_id, p_surface_release_id
    ) returning * into current_bundle;
  else
    if p_expected_version is null
      or current_bundle.version <> p_expected_version
    then
      raise exception 'active model bundle version conflict'
        using errcode = '40001';
    end if;
    if current_bundle.model_id <> p_model_id
      or current_bundle.surface_release_id <> p_surface_release_id
    then
      update studio.active_model_bundle
      set version = current_bundle.version + 1,
          model_id = p_model_id,
          surface_release_id = p_surface_release_id,
          updated_at = now()
      where singleton
      returning * into current_bundle;
    end if;
  end if;

  return query select
    current_bundle.version,
    current_bundle.model_id,
    current_bundle.surface_release_id,
    current_bundle.updated_at;
end;
$$;

create function public.get_active_model_bundle_v1()
returns table (
  bundle_version bigint,
  model_id text,
  model_family_id text,
  display_name text,
  manifest jsonb,
  artifact_path text,
  module_abi text,
  default_fixture jsonb,
  analysis_profile_id text,
  model_stage text,
  surface_release_id text,
  surface_manifest jsonb,
  surface_stage text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    bundle.version,
    model.model_id,
    model.model_family_id,
    model.display_name,
    model.manifest,
    model.artifact_path,
    module.module_abi,
    module.default_fixture,
    module.analysis_profile_id,
    model_availability.stage,
    surface.surface_release_id,
    surface.manifest,
    surface_availability.stage
  from studio.active_model_bundle as bundle
  join studio.model_releases as model on model.model_id = bundle.model_id
  join studio.model_release_availability as model_availability
    on model_availability.model_id = model.model_id
  join studio.model_release_modules as module
    on module.model_id = model.model_id
  join studio.model_surface_releases as surface
    on surface.surface_release_id = bundle.surface_release_id
   and surface.model_family_id = model.model_family_id
  join studio.model_surface_release_availability as surface_availability
    on surface_availability.surface_release_id = surface.surface_release_id
  where bundle.singleton
    and model_availability.loadable
    and model_availability.stage = 'stable'
    and surface_availability.stage = 'stable';
$$;

-- Mutable Experiments may adopt additive presentation releases, but only
-- after those releases are stable. A newly registered dev Surface remains an
-- explicit Model Lab/release-review concern and cannot silently alter an
-- ordinary saved Experiment.
drop function public.get_model_surface_series_latest_v1(text);

create function public.get_model_surface_series_latest_v1(
  p_surface_series_id text,
  p_model_id text
)
returns table (
  surface_release_id text,
  model_family_id text,
  display_name text,
  manifest jsonb,
  stage text
)
language sql
stable
security definer
set search_path = ''
as $$
  with recursive model_context as (
    select release.model_family_id, availability.stage
    from studio.model_releases as release
    join studio.model_release_availability as availability
      on availability.model_id = release.model_id
    where release.model_id = p_model_id
      and availability.loadable
  ), lineage as (
    select release.*, 0::bigint as lineage_depth
    from studio.model_surface_releases as release
    join model_context
      on model_context.model_family_id = release.model_family_id
    where release.surface_series_id = p_surface_series_id
      and release.predecessor_surface_release_id is null
    union all
    select child.*, parent.lineage_depth + 1
    from studio.model_surface_releases as child
    join lineage as parent
      on child.predecessor_surface_release_id = parent.surface_release_id
    where child.surface_series_id = p_surface_series_id
  )
  select
    lineage.surface_release_id,
    lineage.model_family_id,
    lineage.display_name,
    lineage.manifest,
    availability.stage
  from lineage
  join studio.model_surface_release_availability as availability
    on availability.surface_release_id = lineage.surface_release_id
  cross join model_context
  where availability.stage = 'stable'
    or (
      model_context.stage = 'dev'
      and availability.stage = 'dev'
    )
  order by lineage.lineage_depth desc
  limit 1;
$$;

-- Active releases must be replaced atomically before retirement. Historical
-- content remains loadable after retirement through the exact registries.
create or replace function public.set_model_release_stage_v1(
  p_model_id text,
  p_stage text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_stage text;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('circleheart-active-model-bundle-v1', 0)
  );
  select stage into current_stage
  from studio.model_release_availability
  where model_id = p_model_id
  for update;
  if not found then
    raise exception 'model release % is not registered', p_model_id
      using errcode = '23503';
  end if;
  perform studio.assert_release_stage_transition_v1(
    current_stage,
    p_stage,
    'model release ' || p_model_id
  );
  if p_stage = 'retired' and exists (
    select 1 from studio.active_model_bundle where model_id = p_model_id
  ) then
    raise exception 'active model release must be replaced before retirement'
      using errcode = '55000';
  end if;
  update studio.model_release_availability
  set stage = p_stage, updated_at = now()
  where model_id = p_model_id;
end;
$$;

create or replace function public.set_model_surface_release_stage_v1(
  p_surface_release_id text,
  p_stage text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_stage text;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('circleheart-active-model-bundle-v1', 0)
  );
  select stage into current_stage
  from studio.model_surface_release_availability
  where surface_release_id = p_surface_release_id
  for update;
  if not found then
    raise exception 'model surface release % is not registered',
      p_surface_release_id using errcode = '23503';
  end if;
  perform studio.assert_release_stage_transition_v1(
    current_stage,
    p_stage,
    'model surface release ' || p_surface_release_id
  );
  if p_stage = 'retired' and exists (
    select 1 from studio.active_model_bundle
    where surface_release_id = p_surface_release_id
  ) then
    raise exception 'active Model Surface release must be replaced before retirement'
      using errcode = '55000';
  end if;
  update studio.model_surface_release_availability
  set stage = p_stage, updated_at = now()
  where surface_release_id = p_surface_release_id;
end;
$$;

-- Generic launch channels are removed. Development work uses explicit exact
-- model/Surface IDs or the local Model Lab; new ordinary Sessions use only the
-- singleton bundle above.
drop function if exists public.set_model_release_channel_v1(text, text);
drop function if exists public.get_model_release_channel_v1(text);
drop function if exists public.get_model_release_channel_v2(text);
drop function if exists public.get_model_release_channel_v3(text);
drop function if exists public.set_model_surface_release_channel_v1(text, text, text);
drop function if exists public.get_model_surface_release_channel_v1(text, text);
drop table studio.model_surface_release_channels;
drop table studio.model_release_channels;

revoke all on function public.set_active_model_bundle_v1(bigint, text, text)
  from public, anon, authenticated;
grant execute on function public.set_active_model_bundle_v1(bigint, text, text)
  to service_role;
revoke all on function public.get_active_model_bundle_v1()
  from public;
grant execute on function public.get_active_model_bundle_v1()
  to anon, authenticated;
revoke all on function public.get_model_surface_series_latest_v1(text, text)
  from public;
grant execute on function public.get_model_surface_series_latest_v1(text, text)
  to anon, authenticated;

commit;
