-- Publication metadata stays outside the immutable numerical Snapshot.
-- Existing publications have an unknown source version; never claim they are current.
alter table studio.experiment_publications
  add column published_version bigint check (published_version >= 0);

-- Bind publication freshness to the admitted capture, not a later mutable head.
alter table studio.experiment_snapshot_sources
  add column source_experiment_version bigint check (source_experiment_version >= 0);

CREATE OR REPLACE FUNCTION "public"."commit_admitted_experiment_snapshot_v1"("p_operation_id" "uuid", "p_snapshot_id" "uuid", "p_model_id" "text", "p_content" "jsonb", "p_surface_release_id" "text", "p_source_experiment_id" "uuid" DEFAULT NULL::"uuid", "p_expected_experiment_version" bigint DEFAULT NULL::bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  actor uuid := auth.uid();
  request_body jsonb;
  replayed jsonb;
  target_snapshot_id uuid := coalesce(p_snapshot_id, gen_random_uuid());
  content_id uuid;
  surface_series_id text := p_content ->> 'surfaceSeriesId';
  source_row studio.experiments%rowtype;
  source_content jsonb;
  created_time timestamptz := now();
  result_body jsonb;
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  if (p_source_experiment_id is null) <> (p_expected_experiment_version is null) then
    raise exception 'source Experiment and expected version must be supplied together'
      using errcode = '22023';
  end if;
  if surface_series_id is null or btrim(surface_series_id) = '' then
    raise exception 'Standard Snapshot content must pin a Surface series'
      using errcode = '22023';
  end if;
  if p_surface_release_id is null or btrim(p_surface_release_id) = '' then
    raise exception 'Standard Snapshot must pin a Surface release'
      using errcode = '22023';
  end if;
  request_body := jsonb_build_object(
    'snapshotId', p_snapshot_id,
    'modelId', p_model_id,
    'content', p_content,
    'surfaceReleaseId', p_surface_release_id,
    'sourceExperimentId', p_source_experiment_id,
    'expectedExperimentVersion', p_expected_experiment_version
  );
  replayed := studio.begin_operation_v1(
    actor, p_operation_id, 'commit-admitted-experiment-snapshot-v1', request_body
  );
  if replayed is not null then return replayed; end if;

  if p_source_experiment_id is not null then
    select e.* into source_row
    from studio.experiments e
    where e.experiment_id = p_source_experiment_id
    for update of e;
    if not found or source_row.owner_id <> actor or source_row.deleted_at is not null then
      raise exception 'source Experiment not found' using errcode = 'P0002';
    end if;
    if source_row.version <> p_expected_experiment_version then
      raise exception 'source Experiment version conflict' using errcode = '40001';
    end if;
    select c.content into source_content
    from studio.experiment_contents c
    where c.content_id = source_row.current_content_id;
    if source_row.model_id <> p_model_id
      or not studio.snapshot_preserves_authored_content_v1(source_content, p_content)
    then
      raise exception 'Snapshot candidate is not the clean saved Experiment head'
        using errcode = '22023';
    end if;
  end if;

  if p_source_experiment_id is not null
    and source_content is not distinct from p_content
  then
    content_id := source_row.current_content_id;
  else
    insert into studio.experiment_contents (
      model_id, surface_series_id, content, created_by
    ) values (
      p_model_id, surface_series_id, p_content, actor
    ) returning experiment_contents.content_id into content_id;
  end if;
  insert into studio.experiment_snapshots (
    snapshot_id, owner_id, content_id, surface_release_id, created_at
  ) values (
    target_snapshot_id, actor, content_id, p_surface_release_id, created_time
  );
  if p_source_experiment_id is not null then
    insert into studio.experiment_snapshot_sources (
      snapshot_id, source_experiment_id, source_experiment_version
    ) values (
      target_snapshot_id, p_source_experiment_id, p_expected_experiment_version
    );
  end if;
  insert into studio.experiment_snapshot_retention (snapshot_id, retain_until)
  values (target_snapshot_id, created_time + interval '1 hour');

  result_body := jsonb_build_object(
    'schemaId', 'circleheart-studio-experiment-snapshot-v2',
    'snapshotId', target_snapshot_id,
    'content', p_content,
    'surfaceReleaseId', p_surface_release_id,
    'createdAt', to_char(created_time at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );
  return studio.finish_operation_v1(actor, p_operation_id, result_body);
end;
$$;

CREATE OR REPLACE FUNCTION "public"."publish_experiment_v1"("p_operation_id" "uuid", "p_experiment_id" "uuid", "p_expected_version" bigint, "p_snapshot_id" "uuid", "p_public_slug" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  actor uuid := auth.uid();
  request_body jsonb;
  replayed jsonb;
  experiment_row studio.experiments%rowtype;
  snapshot_row studio.experiment_snapshots%rowtype;
  previous_snapshot_id uuid;
  captured_version bigint;
  result_body jsonb;
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'link an email or Google account before publishing' using errcode = '42501';
  end if;
  request_body := jsonb_build_object(
    'experimentId', p_experiment_id,
    'expectedVersion', p_expected_version,
    'snapshotId', p_snapshot_id,
    'publicSlug', p_public_slug
  );
  replayed := studio.begin_operation_v1(actor, p_operation_id, 'publish-experiment-v1', request_body);
  if replayed is not null then return replayed; end if;

  select * into experiment_row from studio.experiments
  where experiment_id = p_experiment_id for update;
  if not found or experiment_row.owner_id <> actor or experiment_row.deleted_at is not null then
    raise exception 'Experiment not found' using errcode = 'P0002';
  end if;
  if experiment_row.version <> p_expected_version then
    raise exception 'Experiment version conflict' using errcode = '40001';
  end if;
  select * into snapshot_row from studio.experiment_snapshots
  where snapshot_id = p_snapshot_id;
  if not found or snapshot_row.owner_id <> actor or not exists (
    select 1 from studio.experiment_snapshot_sources source
    where source.snapshot_id = p_snapshot_id
      and source.source_experiment_id = p_experiment_id
  ) then
    raise exception 'Snapshot is not an admitted capture of this Experiment'
      using errcode = '22023';
  end if;

  select source.source_experiment_version into captured_version
  from studio.experiment_snapshot_sources source
  where source.snapshot_id = p_snapshot_id and source.source_experiment_id = p_experiment_id;

  select p.current_snapshot_id into previous_snapshot_id
  from studio.experiment_publications p
  where p.experiment_id = p_experiment_id
  for update;

  insert into studio.experiment_publications (
    experiment_id, owner_id, current_snapshot_id, public_slug, published_version
  ) values (
    p_experiment_id, actor, p_snapshot_id, p_public_slug, captured_version
  ) on conflict (experiment_id) do update
    set current_snapshot_id = excluded.current_snapshot_id,
        public_slug = excluded.public_slug,
        published_version = excluded.published_version,
        updated_at = now();
  update studio.experiment_snapshot_retention
  set retain_until = null, updated_at = now()
  where snapshot_id = p_snapshot_id;
  if previous_snapshot_id is not null
    and previous_snapshot_id <> p_snapshot_id
  then
    update studio.experiment_snapshot_retention
    set retain_until = now() + interval '1 hour', updated_at = now()
    where snapshot_id = previous_snapshot_id;
  end if;

  result_body := jsonb_build_object(
    'experimentId', p_experiment_id,
    'snapshotId', p_snapshot_id,
    'publicSlug', p_public_slug
  );
  return studio.finish_operation_v1(actor, p_operation_id, result_body);
end;
$$;

CREATE OR REPLACE FUNCTION "public"."read_my_experiment_v1"("p_experiment_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  actor uuid := auth.uid();
  result_body jsonb;
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  select jsonb_build_object(
    'experiment', jsonb_build_object(
      'schemaId', 'circleheart-studio-experiment-v2',
      'experimentId', e.experiment_id,
      'version', e.version,
      'content', c.content
    ),
    'title', e.title,
    'createdAt', to_char(e.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'updatedAt', to_char(e.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'publishedSnapshotId', p.current_snapshot_id,
    'publicSlug', p.public_slug,
    'publishedVersion', p.published_version,
    'publishedAt', to_char(p.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  ) into result_body
  from studio.experiments e
  join studio.experiment_contents c on c.content_id = e.current_content_id
  left join studio.experiment_publications p on p.experiment_id = e.experiment_id
  where e.experiment_id = p_experiment_id
    and e.owner_id = actor
    and e.deleted_at is null;
  return result_body;
end;
$$;
