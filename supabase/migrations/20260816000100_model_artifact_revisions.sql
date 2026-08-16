begin;

create table studio.model_artifact_revisions (
  artifact_revision_id text primary key,
  model_id text not null,
  artifact_path text not null unique,
  artifact_sha256 text not null,
  source_commit text not null,
  predecessor_artifact_revision_id text,
  equivalence_report_sha256 text,
  registered_at timestamptz not null default now(),
  constraint model_artifact_revisions_revision_digest
    check (artifact_revision_id ~ '^[0-9a-f]{64}$'),
  constraint model_artifact_revisions_artifact_path_nonempty
    check (artifact_path = btrim(artifact_path) and char_length(artifact_path) > 0),
  constraint model_artifact_revisions_artifact_digest
    check (artifact_sha256 ~ '^[0-9a-f]{64}$'),
  constraint model_artifact_revisions_source_commit_nonempty
    check (source_commit = btrim(source_commit) and char_length(source_commit) > 0),
  constraint model_artifact_revisions_not_self
    check (predecessor_artifact_revision_id is null
      or predecessor_artifact_revision_id <> artifact_revision_id),
  constraint model_artifact_revisions_equivalence_evidence
    check (
      (predecessor_artifact_revision_id is null
        and equivalence_report_sha256 is null)
      or
      (predecessor_artifact_revision_id is not null
        and equivalence_report_sha256 ~ '^[0-9a-f]{64}$')
    ),
  constraint model_artifact_revisions_model_revision_key
    unique (model_id, artifact_revision_id),
  constraint model_artifact_revisions_model_id_fkey
    foreign key (model_id)
      references studio.model_releases(model_id) on delete restrict,
  constraint model_artifact_revisions_predecessor_fkey
    foreign key (model_id, predecessor_artifact_revision_id)
      references studio.model_artifact_revisions(model_id, artifact_revision_id)
      on delete restrict
);

comment on table studio.model_artifact_revisions is
  'Immutable executable build revisions beneath one scientific modelId. The revision digest is registry integrity metadata, not Studio content identity.';
comment on column studio.model_artifact_revisions.artifact_revision_id is
  'SHA-256 of the canonical numerical manifest plus deterministic artifact bytes. It identifies an implementation revision, not a scientific model.';
comment on column studio.model_artifact_revisions.equivalence_report_sha256 is
  'Required evidence digest for a same-model successor whose admitted outputs, checkpoints, and accepted clocks are byte-exact with its predecessor corpus.';

create table studio.model_artifact_bindings (
  model_id text primary key,
  artifact_revision_id text not null unique,
  version bigint not null default 0,
  updated_at timestamptz not null default now(),
  constraint model_artifact_bindings_version check (version >= 0),
  constraint model_artifact_bindings_model_id_fkey
    foreign key (model_id)
      references studio.model_releases(model_id) on delete restrict,
  constraint model_artifact_bindings_revision_fkey
    foreign key (model_id, artifact_revision_id)
      references studio.model_artifact_revisions(model_id, artifact_revision_id)
      on delete restrict
);

comment on table studio.model_artifact_bindings is
  'CAS pointer from a scientific modelId to the currently certified immutable executable revision. Moving it does not change content modelId pins.';

insert into studio.model_artifact_revisions (
  artifact_revision_id,
  model_id,
  artifact_path,
  artifact_sha256,
  source_commit,
  predecessor_artifact_revision_id,
  equivalence_report_sha256,
  registered_at
)
select
  registry_fingerprint,
  model_id,
  artifact_path,
  artifact_sha256,
  source_commit,
  null,
  null,
  registered_at
from studio.model_releases;

insert into studio.model_artifact_bindings (
  model_id,
  artifact_revision_id,
  version,
  updated_at
)
select model_id, registry_fingerprint, 0, registered_at
from studio.model_releases;

alter table studio.model_releases
  drop column artifact_path,
  drop column artifact_sha256,
  drop column registry_fingerprint,
  drop column source_commit;

comment on table studio.model_releases is
  'Immutable scientific exact-model definitions. Executable build revisions and their active implementation pointer are stored separately.';

create trigger model_artifact_revisions_are_immutable
before delete or update on studio.model_artifact_revisions
for each row execute function studio.reject_immutable_row_mutation_v1();

alter table studio.model_artifact_revisions enable row level security;
alter table studio.model_artifact_bindings enable row level security;

drop function public.get_active_model_bundle_v1();

create function public.get_active_model_bundle_v1()
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
  analysis_profile_id text,
  model_stage text,
  surface_release_id text,
  surface_manifest jsonb,
  surface_stage text
)
language sql stable security definer
set search_path to ''
as $$
  select
    bundle.version,
    model.model_id,
    model.model_family_id,
    model.display_name,
    model.manifest,
    artifact.artifact_revision_id,
    artifact.artifact_path,
    'circleheart-exact-model-esm-v1'::text,
    model.default_fixture,
    model.analysis_profile_id,
    model_availability.stage,
    surface.surface_release_id,
    surface.manifest,
    surface_availability.stage
  from studio.active_model_bundle as bundle
  join studio.model_releases as model on model.model_id = bundle.model_id
  join studio.model_artifact_bindings as artifact_binding
    on artifact_binding.model_id = model.model_id
  join studio.model_artifact_revisions as artifact
    on artifact.model_id = artifact_binding.model_id
   and artifact.artifact_revision_id = artifact_binding.artifact_revision_id
  join studio.model_release_availability as model_availability
    on model_availability.model_id = model.model_id
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

drop function public.get_model_release_v1(text);

create function public.get_model_release_v1(p_model_id text)
returns table(
  model_id text,
  model_family_id text,
  display_name text,
  manifest jsonb,
  artifact_revision_id text,
  artifact_path text,
  module_abi text,
  default_fixture jsonb,
  analysis_profile_id text,
  stage text
)
language sql stable security definer
set search_path to ''
as $$
  select
    model.model_id,
    model.model_family_id,
    model.display_name,
    model.manifest,
    artifact.artifact_revision_id,
    artifact.artifact_path,
    'circleheart-exact-model-esm-v1'::text,
    model.default_fixture,
    model.analysis_profile_id,
    availability.stage
  from studio.model_releases as model
  join studio.model_artifact_bindings as artifact_binding
    on artifact_binding.model_id = model.model_id
  join studio.model_artifact_revisions as artifact
    on artifact.model_id = artifact_binding.model_id
   and artifact.artifact_revision_id = artifact_binding.artifact_revision_id
  join studio.model_release_availability as availability
    on availability.model_id = model.model_id
  where model.model_id = p_model_id and availability.loadable;
$$;

drop function public.register_model_release_v1(
  text, text, text, jsonb, text, text, text, text, jsonb, text
);

create function public.register_model_release_v2(
  p_model_id text,
  p_model_family_id text,
  p_display_name text,
  p_manifest jsonb,
  p_artifact_revision_id text,
  p_artifact_path text,
  p_artifact_sha256 text,
  p_source_commit text,
  p_default_fixture jsonb,
  p_analysis_profile_id text,
  p_expected_artifact_revision_id text,
  p_equivalence_report_sha256 text
)
returns jsonb
language plpgsql security definer
set search_path to ''
as $$
declare
  existing_model studio.model_releases%rowtype;
  current_binding studio.model_artifact_bindings%rowtype;
  existing_artifact studio.model_artifact_revisions%rowtype;
begin
  if jsonb_typeof(p_default_fixture) is distinct from 'object' then
    raise exception 'default fixture must be a JSON object'
      using errcode = '22023';
  end if;
  if p_artifact_revision_id !~ '^[0-9a-f]{64}$'
    or p_artifact_sha256 !~ '^[0-9a-f]{64}$'
    or (
      p_equivalence_report_sha256 is not null
      and p_equivalence_report_sha256 !~ '^[0-9a-f]{64}$'
    )
  then
    raise exception 'model artifact digests must be lowercase SHA-256 values'
      using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('model-release:' || p_model_id, 0)
  );

  select * into existing_model
  from studio.model_releases
  where model_id = p_model_id;

  if not found then
    if p_expected_artifact_revision_id is not null
      or p_equivalence_report_sha256 is not null
    then
      raise exception 'the first artifact revision cannot claim a predecessor'
        using errcode = '22023';
    end if;
    insert into studio.model_releases (
      model_id,
      model_family_id,
      display_name,
      manifest,
      default_fixture,
      analysis_profile_id
    ) values (
      p_model_id,
      p_model_family_id,
      p_display_name,
      p_manifest,
      p_default_fixture,
      p_analysis_profile_id
    ) returning * into existing_model;
    insert into studio.model_release_availability (model_id)
    values (p_model_id);
  elsif existing_model.model_family_id is distinct from p_model_family_id
    or existing_model.display_name is distinct from p_display_name
    or existing_model.manifest is distinct from p_manifest
    or existing_model.default_fixture is distinct from p_default_fixture
    or existing_model.analysis_profile_id is distinct from p_analysis_profile_id
  then
    raise exception 'model_id % is already registered with another scientific contract',
      p_model_id using errcode = '23505';
  end if;

  select * into current_binding
  from studio.model_artifact_bindings
  where model_id = p_model_id
  for update;

  if found and current_binding.artifact_revision_id = p_artifact_revision_id then
    select * into existing_artifact
    from studio.model_artifact_revisions
    where model_id = p_model_id
      and artifact_revision_id = p_artifact_revision_id;
    if not found
      or existing_artifact.artifact_path is distinct from p_artifact_path
      or existing_artifact.artifact_sha256 is distinct from p_artifact_sha256
      or existing_artifact.predecessor_artifact_revision_id
        is distinct from p_expected_artifact_revision_id
      or existing_artifact.equivalence_report_sha256
        is distinct from p_equivalence_report_sha256
    then
      raise exception 'artifact revision % is already registered with different bytes or evidence',
        p_artifact_revision_id using errcode = '23505';
    end if;
    return jsonb_build_object(
      'modelId', p_model_id,
      'artifactRevisionId', p_artifact_revision_id,
      'artifactBindingVersion', current_binding.version
    );
  end if;

  if found then
    if p_expected_artifact_revision_id is distinct from
      current_binding.artifact_revision_id
    then
      raise exception 'model artifact revision conflict'
        using errcode = '40001';
    end if;
    if p_equivalence_report_sha256 is null then
      raise exception 'a same-model artifact successor requires byte-exact equivalence evidence'
        using errcode = '22023';
    end if;
  elsif p_expected_artifact_revision_id is not null
    or p_equivalence_report_sha256 is not null
  then
    raise exception 'the first artifact revision cannot claim a predecessor'
      using errcode = '22023';
  end if;

  insert into studio.model_artifact_revisions (
    artifact_revision_id,
    model_id,
    artifact_path,
    artifact_sha256,
    source_commit,
    predecessor_artifact_revision_id,
    equivalence_report_sha256
  ) values (
    p_artifact_revision_id,
    p_model_id,
    p_artifact_path,
    p_artifact_sha256,
    p_source_commit,
    p_expected_artifact_revision_id,
    p_equivalence_report_sha256
  );

  if current_binding.model_id is null then
    insert into studio.model_artifact_bindings (
      model_id, artifact_revision_id, version
    ) values (
      p_model_id, p_artifact_revision_id, 0
    ) returning * into current_binding;
  else
    update studio.model_artifact_bindings
    set artifact_revision_id = p_artifact_revision_id,
        version = current_binding.version + 1,
        updated_at = now()
    where model_id = p_model_id
    returning * into current_binding;
  end if;

  return jsonb_build_object(
    'modelId', p_model_id,
    'artifactRevisionId', p_artifact_revision_id,
    'artifactBindingVersion', current_binding.version
  );
end;
$$;

create or replace function public.set_active_model_bundle_v1(
  p_expected_version bigint,
  p_model_id text,
  p_surface_release_id text
)
returns table(
  version bigint,
  model_id text,
  surface_release_id text,
  updated_at timestamptz
)
language plpgsql security definer
set search_path to ''
as $$
declare
  current_bundle studio.active_model_bundle%rowtype;
  model_family text;
  model_stage text;
  model_loadable boolean;
  surface_family text;
  surface_stage text;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('circleheart-active-model-bundle-v1', 0)
  );

  select
    release.model_family_id,
    availability.stage,
    availability.loadable
  into model_family, model_stage, model_loadable
  from studio.model_releases as release
  join studio.model_artifact_bindings as artifact_binding
    on artifact_binding.model_id = release.model_id
  join studio.model_release_availability as availability
    on availability.model_id = release.model_id
  where release.model_id = p_model_id;
  if not found or not model_loadable then
    raise exception 'active model release % is not registered and loadable',
      p_model_id using errcode = '23503';
  end if;
  if model_stage <> 'stable' then
    raise exception 'active model release % must be stable, not %',
      p_model_id, model_stage using errcode = '22023';
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

revoke all on function public.register_model_release_v2(
  text, text, text, jsonb, text, text, text, text, jsonb, text, text, text
) from public;
grant all on function public.register_model_release_v2(
  text, text, text, jsonb, text, text, text, text, jsonb, text, text, text
) to service_role;

alter function public.get_active_model_bundle_v1() owner to postgres;
alter function public.get_model_release_v1(text) owner to postgres;
alter function public.register_model_release_v2(
  text, text, text, jsonb, text, text, text, text, jsonb, text, text, text
) owner to postgres;

revoke all on function public.get_active_model_bundle_v1() from public;
grant all on function public.get_active_model_bundle_v1() to anon;
grant all on function public.get_active_model_bundle_v1() to authenticated;
revoke all on function public.get_model_release_v1(text) from public;
grant all on function public.get_model_release_v1(text) to anon;
grant all on function public.get_model_release_v1(text) to authenticated;

revoke all on table studio.model_artifact_revisions from public;
revoke all on table studio.model_artifact_bindings from public;
grant all on table studio.model_artifact_revisions to service_role;
grant all on table studio.model_artifact_bindings to service_role;

commit;
