


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "studio";


ALTER SCHEMA "studio" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






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
  if (surface_series_id is null) <> (p_surface_release_id is null) then
    raise exception 'Snapshot Surface series and release pins must be supplied together'
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
      snapshot_id, source_experiment_id
    ) values (
      target_snapshot_id, p_source_experiment_id
    );
  end if;
  insert into studio.experiment_snapshot_retention (snapshot_id, retain_until)
  values (target_snapshot_id, created_time + interval '1 hour');

  result_body := jsonb_build_object(
    'schemaId', 'circleheart-studio-experiment-snapshot-v2',
    'snapshotId', target_snapshot_id,
    'content', p_content,
    'createdAt', to_char(created_time at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  ) || case when p_surface_release_id is null then '{}'::jsonb else
    jsonb_build_object('surfaceReleaseId', p_surface_release_id) end;
  return studio.finish_operation_v1(actor, p_operation_id, result_body);
end;
$$;


ALTER FUNCTION "public"."commit_admitted_experiment_snapshot_v1"("p_operation_id" "uuid", "p_snapshot_id" "uuid", "p_model_id" "text", "p_content" "jsonb", "p_surface_release_id" "text", "p_source_experiment_id" "uuid", "p_expected_experiment_version" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_article_v1"("p_operation_id" "uuid", "p_article_id" "uuid", "p_expected_version" bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  actor uuid := auth.uid();
  request_body jsonb;
  replayed jsonb;
  article_row studio.articles%rowtype;
  deleted_time timestamptz := now();
  result_body jsonb;
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  request_body := jsonb_build_object(
    'articleId', p_article_id,
    'expectedVersion', p_expected_version
  );
  replayed := studio.begin_operation_v1(actor, p_operation_id, 'delete-article-v1', request_body);
  if replayed is not null then return replayed; end if;

  select * into article_row from studio.articles
  where article_id = p_article_id for update;
  if not found or article_row.owner_id <> actor or article_row.deleted_at is not null then
    raise exception 'Article not found' using errcode = 'P0002';
  end if;
  if article_row.version <> p_expected_version then
    raise exception 'Article version conflict' using errcode = '40001';
  end if;
  delete from studio.article_publications
  where article_id = p_article_id and owner_id = actor;
  update studio.articles
  set deleted_at = deleted_time,
      version = version + 1,
      updated_at = deleted_time
  where article_id = p_article_id;
  result_body := jsonb_build_object(
    'articleId', p_article_id,
    'version', article_row.version + 1,
    'deletedAt', to_char(deleted_time at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );
  return studio.finish_operation_v1(actor, p_operation_id, result_body);
end;
$$;


ALTER FUNCTION "public"."delete_article_v1"("p_operation_id" "uuid", "p_article_id" "uuid", "p_expected_version" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_experiment_v1"("p_operation_id" "uuid", "p_experiment_id" "uuid", "p_expected_version" bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  actor uuid := auth.uid();
  request_body jsonb;
  replayed jsonb;
  experiment_row studio.experiments%rowtype;
  released_snapshot_id uuid;
  deleted_time timestamptz := now();
  result_body jsonb;
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  request_body := jsonb_build_object(
    'experimentId', p_experiment_id,
    'expectedVersion', p_expected_version
  );
  replayed := studio.begin_operation_v1(actor, p_operation_id, 'delete-experiment-v1', request_body);
  if replayed is not null then return replayed; end if;

  select * into experiment_row from studio.experiments
  where experiment_id = p_experiment_id for update;
  if not found or experiment_row.owner_id <> actor or experiment_row.deleted_at is not null then
    raise exception 'Experiment not found' using errcode = 'P0002';
  end if;
  if experiment_row.version <> p_expected_version then
    raise exception 'Experiment version conflict' using errcode = '40001';
  end if;
  delete from studio.experiment_publications
  where experiment_id = p_experiment_id and owner_id = actor
  returning current_snapshot_id into released_snapshot_id;
  if released_snapshot_id is not null then
    update studio.experiment_snapshot_retention
    set retain_until = deleted_time + interval '1 hour', updated_at = deleted_time
    where snapshot_id = released_snapshot_id;
  end if;
  update studio.experiments
  set deleted_at = deleted_time,
      version = version + 1,
      updated_at = deleted_time
  where experiment_id = p_experiment_id;
  result_body := jsonb_build_object(
    'experimentId', p_experiment_id,
    'version', experiment_row.version + 1,
    'deletedAt', to_char(deleted_time at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );
  return studio.finish_operation_v1(actor, p_operation_id, result_body);
end;
$$;


ALTER FUNCTION "public"."delete_experiment_v1"("p_operation_id" "uuid", "p_experiment_id" "uuid", "p_expected_version" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_active_model_bundle_v1"() RETURNS TABLE("bundle_version" bigint, "model_id" "text", "model_family_id" "text", "display_name" "text", "manifest" "jsonb", "artifact_path" "text", "module_abi" "text", "default_fixture" "jsonb", "analysis_profile_id" "text", "model_stage" "text", "surface_release_id" "text", "surface_manifest" "jsonb", "surface_stage" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select
    bundle.version,
    model.model_id,
    model.model_family_id,
    model.display_name,
    model.manifest,
    model.artifact_path,
    'circleheart-exact-model-esm-v1'::text,
    model.default_fixture,
    model.analysis_profile_id,
    model_availability.stage,
    surface.surface_release_id,
    surface.manifest,
    surface_availability.stage
  from studio.active_model_bundle as bundle
  join studio.model_releases as model on model.model_id = bundle.model_id
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


ALTER FUNCTION "public"."get_active_model_bundle_v1"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_model_release_v1"("p_model_id" "text") RETURNS TABLE("model_id" "text", "model_family_id" "text", "display_name" "text", "manifest" "jsonb", "artifact_path" "text", "module_abi" "text", "default_fixture" "jsonb", "analysis_profile_id" "text", "stage" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select
    r.model_id,
    r.model_family_id,
    r.display_name,
    r.manifest,
    r.artifact_path,
    'circleheart-exact-model-esm-v1'::text,
    r.default_fixture,
    r.analysis_profile_id,
    a.stage
  from studio.model_releases as r
  join studio.model_release_availability as a on a.model_id = r.model_id
  where r.model_id = p_model_id and a.loadable;
$$;


ALTER FUNCTION "public"."get_model_release_v1"("p_model_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_model_surface_release_v1"("p_surface_release_id" "text") RETURNS TABLE("surface_release_id" "text", "model_family_id" "text", "display_name" "text", "manifest" "jsonb", "stage" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select
    release.surface_release_id,
    release.model_family_id,
    release.display_name,
    release.manifest,
    availability.stage
  from studio.model_surface_releases as release
  join studio.model_surface_release_availability as availability
    on availability.surface_release_id = release.surface_release_id
  where release.surface_release_id = p_surface_release_id;
$$;


ALTER FUNCTION "public"."get_model_surface_release_v1"("p_surface_release_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_model_surface_series_latest_v1"("p_surface_series_id" "text", "p_model_id" "text") RETURNS TABLE("surface_release_id" "text", "model_family_id" "text", "display_name" "text", "manifest" "jsonb", "stage" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."get_model_surface_series_latest_v1"("p_surface_series_id" "text", "p_model_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_my_article_summaries_v1"("p_limit" integer DEFAULT 50, "p_before_updated_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_before_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  actor uuid := auth.uid();
  result_body jsonb;
begin
  if actor is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if p_limit < 1 or p_limit > 100 then
    raise exception 'List page limit must be within [1, 100]' using errcode = '22023';
  end if;
  if (p_before_updated_at is null) <> (p_before_id is null) then
    raise exception 'List cursor timestamp and ID must be supplied together' using errcode = '22023';
  end if;

  with page as materialized (
    select
      a.article_id,
      a.version,
      c.locale,
      c.title,
      a.created_at,
      a.updated_at,
      case when p.article_id is null then 'draft' else 'public' end as visibility,
      p.public_slug
    from studio.articles a
    join studio.article_contents c on c.article_content_id = a.current_draft_content_id
    left join studio.article_publications p on p.article_id = a.article_id
    where a.owner_id = actor
      and a.deleted_at is null
      and (
        p_before_updated_at is null
        or (a.updated_at, a.article_id) < (p_before_updated_at, p_before_id)
      )
    order by a.updated_at desc, a.article_id desc
    limit p_limit
  )
  select jsonb_build_object(
    'items', coalesce(jsonb_agg(jsonb_build_object(
      'articleId', article_id,
      'version', version,
      'visibility', visibility,
      'locale', locale,
      'title', title,
      'createdAt', to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
      'updatedAt', to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
      'publicSlug', public_slug
    ) order by updated_at desc, article_id desc), '[]'::jsonb),
    'nextCursor', case when count(*) = p_limit then (
      select jsonb_build_object(
        'timestamp', to_char(last_page.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
        'id', last_page.article_id
      )
      from page last_page
      order by last_page.updated_at asc, last_page.article_id asc
      limit 1
    ) else null end
  ) into result_body
  from page;
  return result_body;
end;
$$;


ALTER FUNCTION "public"."list_my_article_summaries_v1"("p_limit" integer, "p_before_updated_at" timestamp with time zone, "p_before_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_my_experiment_summaries_v1"("p_limit" integer DEFAULT 50, "p_before_updated_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_before_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  actor uuid := auth.uid();
  result_body jsonb;
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  if p_limit < 1 or p_limit > 100 then
    raise exception 'List page limit must be within [1, 100]' using errcode = '22023';
  end if;
  if (p_before_updated_at is null) <> (p_before_id is null) then
    raise exception 'List cursor timestamp and ID must be supplied together' using errcode = '22023';
  end if;
  with page as materialized (
    select experiment.experiment_id, experiment.version, experiment.model_id,
      content.surface_series_id, experiment.title, experiment.created_at,
      experiment.updated_at,
      jsonb_array_length(content.content -> 'scenarios') as scenario_count,
      publication.current_snapshot_id as published_snapshot_id,
      publication.public_slug
    from studio.experiments as experiment
    join studio.experiment_contents as content
      on content.content_id = experiment.current_content_id
    left join studio.experiment_publications as publication
      on publication.experiment_id = experiment.experiment_id
    where experiment.owner_id = actor and experiment.deleted_at is null
      and (p_before_updated_at is null or
        (experiment.updated_at, experiment.experiment_id)
          < (p_before_updated_at, p_before_id))
    order by experiment.updated_at desc, experiment.experiment_id desc
    limit p_limit
  )
  select jsonb_build_object(
    'items', coalesce(jsonb_agg((jsonb_build_object(
      'experimentId', experiment_id,
      'version', version,
      'modelId', model_id,
      'title', title,
      'scenarioCount', scenario_count,
      'createdAt', to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
      'updatedAt', to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
      'publishedSnapshotId', published_snapshot_id,
      'publicSlug', public_slug
    ) || case when surface_series_id is null then '{}'::jsonb else
      jsonb_build_object('surfaceSeriesId', surface_series_id) end)
      order by updated_at desc, experiment_id desc), '[]'::jsonb),
    'nextCursor', case when count(*) = p_limit then (
      select jsonb_build_object(
        'timestamp', to_char(last_page.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
        'id', last_page.experiment_id
      ) from page as last_page
      order by last_page.updated_at asc, last_page.experiment_id asc limit 1
    ) else null end
  ) into result_body from page;
  return result_body;
end;
$$;


ALTER FUNCTION "public"."list_my_experiment_summaries_v1"("p_limit" integer, "p_before_updated_at" timestamp with time zone, "p_before_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_my_snapshot_summaries_v1"("p_limit" integer DEFAULT 50, "p_before_created_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_before_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  actor uuid := auth.uid();
  result_body jsonb;
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  if p_limit < 1 or p_limit > 100 then
    raise exception 'List page limit must be within [1, 100]' using errcode = '22023';
  end if;
  if (p_before_created_at is null) <> (p_before_id is null) then
    raise exception 'List cursor timestamp and ID must be supplied together' using errcode = '22023';
  end if;
  with page as materialized (
    select snapshot.snapshot_id, content.model_id, content.surface_series_id,
      snapshot.surface_release_id, snapshot.created_at,
      coalesce(nullif(experiment.title, ''),
        nullif(content.content #>> '{scenarios,0,label}', ''), 'Untitled') as title,
      jsonb_array_length(content.content -> 'scenarios') as scenario_count,
      jsonb_array_length(content.content #> '{surface,graphPanes}')
        + jsonb_array_length(content.content #> '{surface,outputPanes}')
        + jsonb_array_length(content.content #> '{surface,controlPanes}') as pane_count
    from studio.experiment_snapshots as snapshot
    join studio.experiment_contents as content on content.content_id = snapshot.content_id
    left join studio.experiment_snapshot_sources as source
      on source.snapshot_id = snapshot.snapshot_id
    left join studio.experiments as experiment
      on experiment.experiment_id = source.source_experiment_id
    where snapshot.owner_id = actor
      and (p_before_created_at is null or
        (snapshot.created_at, snapshot.snapshot_id)
          < (p_before_created_at, p_before_id))
    order by snapshot.created_at desc, snapshot.snapshot_id desc
    limit p_limit
  )
  select jsonb_build_object(
    'items', coalesce(jsonb_agg((jsonb_build_object(
      'snapshotId', snapshot_id,
      'modelId', model_id,
      'title', title,
      'scenarioCount', scenario_count,
      'paneCount', pane_count,
      'createdAt', to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
    ) || case when surface_series_id is null then '{}'::jsonb else
      jsonb_build_object('surfaceSeriesId', surface_series_id) end
      || case when surface_release_id is null then '{}'::jsonb else
      jsonb_build_object('surfaceReleaseId', surface_release_id) end)
      order by created_at desc, snapshot_id desc), '[]'::jsonb),
    'nextCursor', case when count(*) = p_limit then (
      select jsonb_build_object(
        'timestamp', to_char(last_page.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
        'id', last_page.snapshot_id
      ) from page as last_page
      order by last_page.created_at asc, last_page.snapshot_id asc limit 1
    ) else null end
  ) into result_body from page;
  return result_body;
end;
$$;


ALTER FUNCTION "public"."list_my_snapshot_summaries_v1"("p_limit" integer, "p_before_created_at" timestamp with time zone, "p_before_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_public_article_summaries_v1"("p_limit" integer DEFAULT 50, "p_before_published_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_before_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  result_body jsonb;
begin
  if p_limit < 1 or p_limit > 100 then
    raise exception 'List page limit must be within [1, 100]' using errcode = '22023';
  end if;
  if (p_before_published_at is null) <> (p_before_id is null) then
    raise exception 'List cursor timestamp and ID must be supplied together' using errcode = '22023';
  end if;

  with page as materialized (
    select
      p.article_id,
      c.locale,
      c.title,
      p.public_slug,
      p.updated_at as published_at,
      excerpt.value as excerpt
    from studio.article_publications p
    join studio.articles a on a.article_id = p.article_id
    join studio.article_contents c on c.article_content_id = p.current_content_id
    left join lateral (
      select left(block.value ->> 'text', 240) as value
      from jsonb_array_elements(c.blocks) with ordinality block(value, position)
      where block.value ->> 'kind' in ('heading', 'paragraph')
        and length(btrim(coalesce(block.value ->> 'text', ''))) > 0
      order by block.position
      limit 1
    ) excerpt on true
    where a.deleted_at is null
      and (
        p_before_published_at is null
        or (p.updated_at, p.article_id) < (p_before_published_at, p_before_id)
      )
    order by p.updated_at desc, p.article_id desc
    limit p_limit
  )
  select jsonb_build_object(
    'items', coalesce(jsonb_agg(jsonb_build_object(
      'articleId', article_id,
      'locale', locale,
      'title', title,
      'excerpt', excerpt,
      'publicSlug', public_slug,
      'publishedAt', to_char(published_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
    ) order by published_at desc, article_id desc), '[]'::jsonb),
    'nextCursor', case when count(*) = p_limit then (
      select jsonb_build_object(
        'timestamp', to_char(last_page.published_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
        'id', last_page.article_id
      )
      from page last_page
      order by last_page.published_at asc, last_page.article_id asc
      limit 1
    ) else null end
  ) into result_body
  from page;
  return result_body;
end;
$$;


ALTER FUNCTION "public"."list_public_article_summaries_v1"("p_limit" integer, "p_before_published_at" timestamp with time zone, "p_before_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_public_experiment_summaries_v1"("p_limit" integer DEFAULT 50, "p_before_published_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_before_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  result_body jsonb;
begin
  if p_limit < 1 or p_limit > 100 then
    raise exception 'List page limit must be within [1, 100]' using errcode = '22023';
  end if;
  if (p_before_published_at is null) <> (p_before_id is null) then
    raise exception 'List cursor timestamp and ID must be supplied together' using errcode = '22023';
  end if;

  with page as materialized (
    select
      p.experiment_id,
      e.title,
      p.public_slug,
      p.updated_at as published_at,
      s.snapshot_id,
      c.model_id,
      jsonb_array_length(c.content -> 'scenarios') as scenario_count
    from studio.experiment_publications p
    join studio.experiments e on e.experiment_id = p.experiment_id
    join studio.experiment_snapshots s on s.snapshot_id = p.current_snapshot_id
    join studio.experiment_contents c on c.content_id = s.content_id
    where e.deleted_at is null
      and (
        p_before_published_at is null
        or (p.updated_at, p.experiment_id) < (p_before_published_at, p_before_id)
      )
    order by p.updated_at desc, p.experiment_id desc
    limit p_limit
  )
  select jsonb_build_object(
    'items', coalesce(jsonb_agg(jsonb_build_object(
      'experimentId', experiment_id,
      'title', title,
      'publicSlug', public_slug,
      'publishedAt', to_char(published_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
      'snapshotId', snapshot_id,
      'modelId', model_id,
      'scenarioCount', scenario_count
    ) order by published_at desc, experiment_id desc), '[]'::jsonb),
    'nextCursor', case when count(*) = p_limit then (
      select jsonb_build_object(
        'timestamp', to_char(last_page.published_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
        'id', last_page.experiment_id
      )
      from page last_page
      order by last_page.published_at asc, last_page.experiment_id asc
      limit 1
    ) else null end
  ) into result_body
  from page;
  return result_body;
end;
$$;


ALTER FUNCTION "public"."list_public_experiment_summaries_v1"("p_limit" integer, "p_before_published_at" timestamp with time zone, "p_before_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."publish_article_v1"("p_operation_id" "uuid", "p_article_id" "uuid", "p_expected_version" bigint, "p_public_slug" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  actor uuid := auth.uid();
  request_body jsonb;
  replayed jsonb;
  article_row studio.articles%rowtype;
  result_body jsonb;
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'link an email or Google account before publishing' using errcode = '42501';
  end if;
  request_body := jsonb_build_object(
    'articleId', p_article_id,
    'expectedVersion', p_expected_version,
    'publicSlug', p_public_slug
  );
  replayed := studio.begin_operation_v1(actor, p_operation_id, 'publish-article-v1', request_body);
  if replayed is not null then return replayed; end if;
  select * into article_row from studio.articles
  where article_id = p_article_id for update;
  if not found or article_row.owner_id <> actor or article_row.deleted_at is not null then
    raise exception 'Article not found' using errcode = 'P0002';
  end if;
  if article_row.version <> p_expected_version then
    raise exception 'Article version conflict' using errcode = '40001';
  end if;
  insert into studio.article_publications (
    article_id, owner_id, current_content_id, public_slug
  ) values (
    p_article_id, actor, article_row.current_draft_content_id, p_public_slug
  ) on conflict (article_id) do update
    set current_content_id = excluded.current_content_id,
        public_slug = excluded.public_slug,
        updated_at = now();
  result_body := jsonb_build_object(
    'articleId', p_article_id,
    'articleContentId', article_row.current_draft_content_id,
    'publicSlug', p_public_slug
  );
  return studio.finish_operation_v1(actor, p_operation_id, result_body);
end;
$$;


ALTER FUNCTION "public"."publish_article_v1"("p_operation_id" "uuid", "p_article_id" "uuid", "p_expected_version" bigint, "p_public_slug" "text") OWNER TO "postgres";


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

  select p.current_snapshot_id into previous_snapshot_id
  from studio.experiment_publications p
  where p.experiment_id = p_experiment_id
  for update;

  insert into studio.experiment_publications (
    experiment_id, owner_id, current_snapshot_id, public_slug
  ) values (
    p_experiment_id, actor, p_snapshot_id, p_public_slug
  ) on conflict (experiment_id) do update
    set current_snapshot_id = excluded.current_snapshot_id,
        public_slug = excluded.public_slug,
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


ALTER FUNCTION "public"."publish_experiment_v1"("p_operation_id" "uuid", "p_experiment_id" "uuid", "p_expected_version" bigint, "p_snapshot_id" "uuid", "p_public_slug" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."read_article_v1"("p_article_id" "uuid") RETURNS "jsonb"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  with resolved as (
    select
      a.article_id,
      case
        when a.owner_id = auth.uid() then a.current_draft_content_id
        else p.current_content_id
      end as content_id,
      case
        when a.owner_id = auth.uid() then a.version
        else 0
      end as version,
      p.article_id is not null as published
    from studio.articles a
    left join studio.article_publications p on p.article_id = a.article_id
    where a.article_id = p_article_id
      and a.deleted_at is null
      and (a.owner_id = auth.uid() or p.article_id is not null)
  )
  select jsonb_build_object(
    'schemaId', 'circleheart-studio-article-draft-v2',
    'articleId', r.article_id,
    'draftVersion', r.version,
    'visibility', case when r.published then 'public' else 'draft' end,
    'locale', c.locale,
    'title', c.title,
    'blocks', c.blocks
  )
  from resolved r
  join studio.article_contents c on c.article_content_id = r.content_id;
$$;


ALTER FUNCTION "public"."read_article_v1"("p_article_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."read_experiment_snapshot_v1"("p_snapshot_id" "uuid") RETURNS "jsonb"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select jsonb_build_object(
    'schemaId', 'circleheart-studio-experiment-snapshot-v2',
    'snapshotId', snapshot.snapshot_id,
    'content', content.content,
    'createdAt', to_char(snapshot.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  ) || case when snapshot.surface_release_id is null then '{}'::jsonb else
    jsonb_build_object('surfaceReleaseId', snapshot.surface_release_id) end
  from studio.experiment_snapshots as snapshot
  join studio.experiment_contents as content
    on content.content_id = snapshot.content_id
  where snapshot.snapshot_id = p_snapshot_id
    and studio.can_read_snapshot_v1(auth.uid(), snapshot.snapshot_id);
$$;


ALTER FUNCTION "public"."read_experiment_snapshot_v1"("p_snapshot_id" "uuid") OWNER TO "postgres";


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
    'publicSlug', p.public_slug
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


ALTER FUNCTION "public"."read_my_experiment_v1"("p_experiment_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."read_public_article_v1"("p_public_slug" "text") RETURNS "jsonb"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select jsonb_build_object(
    'articleId', p.article_id,
    'locale', c.locale,
    'title', c.title,
    'blocks', c.blocks
  )
  from studio.article_publications p
  join studio.article_contents c on c.article_content_id = p.current_content_id
  where p.public_slug = p_public_slug;
$$;


ALTER FUNCTION "public"."read_public_article_v1"("p_public_slug" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."read_public_experiment_v1"("p_public_slug" "text") RETURNS "jsonb"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select jsonb_build_object(
    'experimentId', publication.experiment_id,
    'title', experiment.title,
    'snapshot', jsonb_build_object(
      'schemaId', 'circleheart-studio-experiment-snapshot-v2',
      'snapshotId', snapshot.snapshot_id,
      'content', content.content,
      'createdAt', to_char(snapshot.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    ) || case when snapshot.surface_release_id is null then '{}'::jsonb else
      jsonb_build_object('surfaceReleaseId', snapshot.surface_release_id) end
  )
  from studio.experiment_publications as publication
  join studio.experiments as experiment
    on experiment.experiment_id = publication.experiment_id
  join studio.experiment_snapshots as snapshot
    on snapshot.snapshot_id = publication.current_snapshot_id
  join studio.experiment_contents as content
    on content.content_id = snapshot.content_id
  where publication.public_slug = p_public_slug;
$$;


ALTER FUNCTION "public"."read_public_experiment_v1"("p_public_slug" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_model_release_succession_v1"("p_from_model_id" "text", "p_to_model_id" "text", "p_grade" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  from_family text;
  to_family text;
  existing_grade text;
begin
  if p_grade <> 'successor' then
    raise exception 'only successor lineage is available until drop-in evidence verification exists'
      using errcode = '22023';
  end if;
  select model_family_id into from_family
  from studio.model_releases where model_id = p_from_model_id;
  select model_family_id into to_family
  from studio.model_releases where model_id = p_to_model_id;
  if from_family is null or to_family is null then
    raise exception 'both model releases must be registered' using errcode = '23503';
  end if;
  if from_family <> to_family then
    raise exception 'model succession cannot cross model families' using errcode = '22023';
  end if;
  select grade into existing_grade
  from studio.model_release_successions
  where from_model_id = p_from_model_id and to_model_id = p_to_model_id;
  if found then
    if existing_grade <> p_grade then
      raise exception 'model succession is already registered with grade %',
        existing_grade using errcode = '23505';
    end if;
    return;
  end if;
  insert into studio.model_release_successions (
    from_model_id, to_model_id, grade
  ) values (
    p_from_model_id, p_to_model_id, p_grade
  );
end;
$$;


ALTER FUNCTION "public"."register_model_release_succession_v1"("p_from_model_id" "text", "p_to_model_id" "text", "p_grade" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_model_release_v1"("p_model_id" "text", "p_model_family_id" "text", "p_display_name" "text", "p_manifest" "jsonb", "p_artifact_path" "text", "p_artifact_sha256" "text", "p_registry_fingerprint" "text", "p_source_commit" "text", "p_default_fixture" "jsonb", "p_analysis_profile_id" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  existing studio.model_releases%rowtype;
begin
  if jsonb_typeof(p_default_fixture) is distinct from 'object' then
    raise exception 'default fixture must be a JSON object'
      using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('model-release:' || p_model_id, 0)
  );
  select * into existing
  from studio.model_releases
  where model_id = p_model_id;

  if found then
    if existing.model_family_id is not distinct from p_model_family_id
      and existing.display_name is not distinct from p_display_name
      and existing.manifest is not distinct from p_manifest
      and existing.artifact_path is not distinct from p_artifact_path
      and existing.artifact_sha256 is not distinct from p_artifact_sha256
      and existing.registry_fingerprint is not distinct from p_registry_fingerprint
      and existing.default_fixture is not distinct from p_default_fixture
      and existing.analysis_profile_id is not distinct from p_analysis_profile_id
    then
      return to_jsonb(existing);
    end if;
    raise exception 'model_id % is already registered with different release bytes or contract',
      p_model_id using errcode = '23505';
  end if;

  insert into studio.model_releases (
    model_id,
    model_family_id,
    display_name,
    manifest,
    artifact_path,
    artifact_sha256,
    registry_fingerprint,
    source_commit,
    default_fixture,
    analysis_profile_id
  ) values (
    p_model_id,
    p_model_family_id,
    p_display_name,
    p_manifest,
    p_artifact_path,
    p_artifact_sha256,
    p_registry_fingerprint,
    p_source_commit,
    p_default_fixture,
    p_analysis_profile_id
  ) returning * into existing;

  insert into studio.model_release_availability (model_id)
  values (p_model_id);

  return to_jsonb(existing);
end;
$$;


ALTER FUNCTION "public"."register_model_release_v1"("p_model_id" "text", "p_model_family_id" "text", "p_display_name" "text", "p_manifest" "jsonb", "p_artifact_path" "text", "p_artifact_sha256" "text", "p_registry_fingerprint" "text", "p_source_commit" "text", "p_default_fixture" "jsonb", "p_analysis_profile_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_model_surface_release_v1"("p_surface_release_id" "text", "p_surface_series_id" "text", "p_predecessor_surface_release_id" "text", "p_model_family_id" "text", "p_display_name" "text", "p_manifest" "jsonb", "p_source_commit" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  existing studio.model_surface_releases%rowtype;
  predecessor studio.model_surface_releases%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('model-surface-series:' || p_surface_series_id, 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('model-surface-release:' || p_surface_release_id, 0)
  );
  select * into existing
  from studio.model_surface_releases
  where surface_release_id = p_surface_release_id;
  if found then
    if existing.surface_series_id is not distinct from p_surface_series_id
      and existing.predecessor_surface_release_id
        is not distinct from p_predecessor_surface_release_id
      and existing.model_family_id is not distinct from p_model_family_id
      and existing.display_name is not distinct from p_display_name
      and existing.manifest is not distinct from p_manifest
    then
      -- Registration is idempotent by immutable release content. Preserve the
      -- first source commit as provenance rather than making retries from a
      -- later operational commit fail.
      return to_jsonb(existing);
    end if;
    raise exception 'surface_release_id % is already registered with different content',
      p_surface_release_id using errcode = '23505';
  end if;
  if p_predecessor_surface_release_id is null then
    if exists (
      select 1 from studio.model_surface_releases
      where surface_series_id = p_surface_series_id
    ) then
      raise exception 'model surface series % already has a root release',
        p_surface_series_id using errcode = '23505';
    end if;
  else
    select * into predecessor
    from studio.model_surface_releases
    where surface_release_id = p_predecessor_surface_release_id
    for share;
    if not found then
      raise exception 'predecessor model surface release % is not registered',
        p_predecessor_surface_release_id using errcode = '23503';
    end if;
    if predecessor.surface_series_id <> p_surface_series_id
      or predecessor.model_family_id <> p_model_family_id
    then
      raise exception 'model surface predecessor must share series and model family'
        using errcode = '22023';
    end if;
    perform studio.assert_additive_model_surface_upgrade_v1(
      predecessor.manifest,
      p_manifest
    );
  end if;
  insert into studio.model_surface_releases (
    surface_release_id,
    surface_series_id,
    predecessor_surface_release_id,
    model_family_id,
    display_name,
    manifest,
    source_commit
  ) values (
    p_surface_release_id,
    p_surface_series_id,
    p_predecessor_surface_release_id,
    p_model_family_id,
    p_display_name,
    p_manifest,
    p_source_commit
  ) returning * into existing;
  insert into studio.model_surface_release_availability (surface_release_id)
  values (p_surface_release_id);
  return to_jsonb(existing);
end;
$$;


ALTER FUNCTION "public"."register_model_surface_release_v1"("p_surface_release_id" "text", "p_surface_series_id" "text", "p_predecessor_surface_release_id" "text", "p_model_family_id" "text", "p_display_name" "text", "p_manifest" "jsonb", "p_source_commit" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_article_v1"("p_operation_id" "uuid", "p_article_id" "uuid", "p_expected_version" bigint, "p_locale" "text", "p_title" "text", "p_blocks" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  actor uuid := auth.uid();
  request_body jsonb;
  replayed jsonb;
  target_article_id uuid;
  target_version bigint;
  content_id uuid;
  current_row studio.articles%rowtype;
  result_body jsonb;
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  request_body := jsonb_build_object(
    'articleId', p_article_id,
    'expectedVersion', p_expected_version,
    'locale', p_locale,
    'title', p_title,
    'blocks', p_blocks
  );
  replayed := studio.begin_operation_v1(actor, p_operation_id, 'save-article-v1', request_body);
  if replayed is not null then return replayed; end if;

  insert into studio.article_contents (owner_id, locale, title, blocks)
  values (actor, p_locale, p_title, p_blocks)
  returning article_content_id into content_id;
  perform studio.project_article_snapshot_refs_v1(content_id, actor, p_blocks);

  if p_article_id is null then
    if p_expected_version is not null then
      raise exception 'new Article must omit expectedVersion' using errcode = '22023';
    end if;
    target_article_id := gen_random_uuid();
    target_version := 0;
    insert into studio.articles (
      article_id, owner_id, version, current_draft_content_id
    ) values (
      target_article_id, actor, target_version, content_id
    );
  else
    select * into current_row from studio.articles
    where article_id = p_article_id for update;
    if not found or current_row.owner_id <> actor or current_row.deleted_at is not null then
      raise exception 'Article not found' using errcode = 'P0002';
    end if;
    if p_expected_version is null or current_row.version <> p_expected_version then
      raise exception 'Article version conflict' using errcode = '40001';
    end if;
    target_article_id := current_row.article_id;
    target_version := current_row.version + 1;
    update studio.articles
    set version = target_version,
        current_draft_content_id = content_id,
        updated_at = now()
    where article_id = target_article_id;
  end if;

  result_body := jsonb_build_object(
    'articleId', target_article_id,
    'version', target_version,
    'locale', p_locale,
    'title', p_title,
    'blocks', p_blocks
  );
  return studio.finish_operation_v1(actor, p_operation_id, result_body);
end;
$$;


ALTER FUNCTION "public"."save_article_v1"("p_operation_id" "uuid", "p_article_id" "uuid", "p_expected_version" bigint, "p_locale" "text", "p_title" "text", "p_blocks" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_experiment_v1"("p_operation_id" "uuid", "p_experiment_id" "uuid", "p_expected_version" bigint, "p_title" "text", "p_model_id" "text", "p_content" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  actor uuid := auth.uid();
  request_body jsonb;
  replayed jsonb;
  target_id uuid;
  target_version bigint;
  content_id uuid;
  surface_series_id text := p_content ->> 'surfaceSeriesId';
  current_row studio.experiments%rowtype;
  current_content jsonb;
  result_body jsonb;
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  request_body := jsonb_build_object(
    'experimentId', p_experiment_id,
    'expectedVersion', p_expected_version,
    'title', p_title,
    'modelId', p_model_id,
    'content', p_content
  );
  replayed := studio.begin_operation_v1(actor, p_operation_id, 'save-experiment-v1', request_body);
  if replayed is not null then return replayed; end if;

  if p_experiment_id is null then
    if p_expected_version is not null then
      raise exception 'new Experiment must omit expectedVersion' using errcode = '22023';
    end if;
    target_id := gen_random_uuid();
    target_version := 0;
    insert into studio.experiment_contents (
      model_id, surface_series_id, content, created_by
    ) values (
      p_model_id, surface_series_id, p_content, actor
    ) returning experiment_contents.content_id into content_id;
    insert into studio.experiments (
      experiment_id, owner_id, model_id, title, version, current_content_id
    ) values (
      target_id, actor, p_model_id, p_title, target_version, content_id
    );
  else
    select e.* into current_row
    from studio.experiments e
    where e.experiment_id = p_experiment_id
    for update;
    if not found or current_row.owner_id <> actor or current_row.deleted_at is not null then
      raise exception 'Experiment not found' using errcode = 'P0002';
    end if;
    if p_expected_version is null or current_row.version <> p_expected_version then
      raise exception 'Experiment version conflict' using errcode = '40001';
    end if;
    if current_row.model_id <> p_model_id then
      raise exception 'Experiment exact model cannot change in place' using errcode = '22023';
    end if;
    select c.content into current_content
    from studio.experiment_contents c
    where c.content_id = current_row.current_content_id;
    if current_content ->> 'surfaceSeriesId' is distinct from surface_series_id then
      raise exception 'Experiment Surface series cannot change in place' using errcode = '22023';
    end if;
    if current_content is not distinct from p_content then
      content_id := current_row.current_content_id;
    else
      insert into studio.experiment_contents (
        model_id, surface_series_id, content, created_by
      ) values (
        p_model_id, surface_series_id, p_content, actor
      ) returning experiment_contents.content_id into content_id;
    end if;
    target_id := current_row.experiment_id;
    target_version := current_row.version + 1;
    update studio.experiments
    set title = p_title,
        version = target_version,
        current_content_id = content_id,
        updated_at = now()
    where experiment_id = target_id;
  end if;

  result_body := jsonb_build_object(
    'experimentId', target_id,
    'version', target_version,
    'title', p_title,
    'modelId', p_model_id,
    'content', p_content
  );
  return studio.finish_operation_v1(actor, p_operation_id, result_body);
end;
$$;


ALTER FUNCTION "public"."save_experiment_v1"("p_operation_id" "uuid", "p_experiment_id" "uuid", "p_expected_version" bigint, "p_title" "text", "p_model_id" "text", "p_content" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_active_model_bundle_v1"("p_expected_version" bigint, "p_model_id" "text", "p_surface_release_id" "text") RETURNS TABLE("version" bigint, "model_id" "text", "surface_release_id" "text", "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."set_active_model_bundle_v1"("p_expected_version" bigint, "p_model_id" "text", "p_surface_release_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_model_release_stage_v1"("p_model_id" "text", "p_stage" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."set_model_release_stage_v1"("p_model_id" "text", "p_stage" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_model_surface_release_stage_v1"("p_surface_release_id" "text", "p_stage" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "public"."set_model_surface_release_stage_v1"("p_surface_release_id" "text", "p_stage" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."unpublish_article_v1"("p_operation_id" "uuid", "p_article_id" "uuid", "p_expected_version" bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  actor uuid := auth.uid();
  request_body jsonb;
  replayed jsonb;
  article_row studio.articles%rowtype;
  result_body jsonb;
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  request_body := jsonb_build_object(
    'articleId', p_article_id,
    'expectedVersion', p_expected_version
  );
  replayed := studio.begin_operation_v1(actor, p_operation_id, 'unpublish-article-v1', request_body);
  if replayed is not null then return replayed; end if;

  select * into article_row from studio.articles
  where article_id = p_article_id for update;
  if not found or article_row.owner_id <> actor or article_row.deleted_at is not null then
    raise exception 'Article not found' using errcode = 'P0002';
  end if;
  if article_row.version <> p_expected_version then
    raise exception 'Article version conflict' using errcode = '40001';
  end if;
  delete from studio.article_publications
  where article_id = p_article_id and owner_id = actor;
  result_body := jsonb_build_object(
    'articleId', p_article_id,
    'published', false
  );
  return studio.finish_operation_v1(actor, p_operation_id, result_body);
end;
$$;


ALTER FUNCTION "public"."unpublish_article_v1"("p_operation_id" "uuid", "p_article_id" "uuid", "p_expected_version" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."unpublish_experiment_v1"("p_operation_id" "uuid", "p_experiment_id" "uuid", "p_expected_version" bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  actor uuid := auth.uid();
  request_body jsonb;
  replayed jsonb;
  experiment_row studio.experiments%rowtype;
  released_snapshot_id uuid;
  result_body jsonb;
begin
  if actor is null then raise exception 'authentication required' using errcode = '28000'; end if;
  request_body := jsonb_build_object(
    'experimentId', p_experiment_id,
    'expectedVersion', p_expected_version
  );
  replayed := studio.begin_operation_v1(actor, p_operation_id, 'unpublish-experiment-v1', request_body);
  if replayed is not null then return replayed; end if;

  select * into experiment_row from studio.experiments
  where experiment_id = p_experiment_id for update;
  if not found or experiment_row.owner_id <> actor or experiment_row.deleted_at is not null then
    raise exception 'Experiment not found' using errcode = 'P0002';
  end if;
  if experiment_row.version <> p_expected_version then
    raise exception 'Experiment version conflict' using errcode = '40001';
  end if;
  delete from studio.experiment_publications
  where experiment_id = p_experiment_id and owner_id = actor
  returning current_snapshot_id into released_snapshot_id;
  if released_snapshot_id is not null then
    update studio.experiment_snapshot_retention
    set retain_until = now() + interval '1 hour', updated_at = now()
    where snapshot_id = released_snapshot_id;
  end if;
  result_body := jsonb_build_object(
    'experimentId', p_experiment_id,
    'published', false
  );
  return studio.finish_operation_v1(actor, p_operation_id, result_body);
end;
$$;


ALTER FUNCTION "public"."unpublish_experiment_v1"("p_operation_id" "uuid", "p_experiment_id" "uuid", "p_expected_version" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."assert_additive_model_surface_upgrade_v1"("p_previous_manifest" "jsonb", "p_next_manifest" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO ''
    AS $$
declare
  catalog_name text;
  catalog_id_key text;
begin
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
        p_next_manifest -> catalog_name
      ) as next_item(value)
      where pg_catalog.jsonb_typeof(next_item.value) <> 'object'
        or nullif(pg_catalog.btrim(next_item.value ->> catalog_id_key), '') is null
    ) or exists (
      select 1
      from pg_catalog.jsonb_array_elements(
        p_next_manifest -> catalog_name
      ) as next_item(value)
      group by next_item.value ->> catalog_id_key
      having count(*) > 1
    ) then
      raise exception 'model surface % contains invalid or duplicate item IDs',
        catalog_name using errcode = '22023';
    end if;
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
end;
$$;


ALTER FUNCTION "studio"."assert_additive_model_surface_upgrade_v1"("p_previous_manifest" "jsonb", "p_next_manifest" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."assert_release_stage_transition_v1"("p_current" "text", "p_next" "text", "p_subject" "text") RETURNS "void"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO ''
    AS $$
begin
  if p_next not in ('dev', 'stable', 'retired') then
    raise exception 'invalid release stage %', p_next using errcode = '22023';
  end if;
  if p_current = p_next then return; end if;
  if p_current = 'dev' and p_next in ('stable', 'retired') then return; end if;
  if p_current = 'stable' and p_next = 'retired' then return; end if;
  raise exception '% cannot move from % to %', p_subject, p_current, p_next
    using errcode = '22023';
end;
$$;


ALTER FUNCTION "studio"."assert_release_stage_transition_v1"("p_current" "text", "p_next" "text", "p_subject" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."begin_operation_v1"("p_actor_id" "uuid", "p_operation_id" "uuid", "p_operation_kind" "text", "p_request" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  existing studio.operation_receipts%rowtype;
  compact_request jsonb := studio.operation_request_fingerprint_v1(
    p_operation_kind,
    p_request
  );
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_actor_id::text || ':' || p_operation_id::text, 0)
  );
  select * into existing
  from studio.operation_receipts
  where actor_id = p_actor_id and operation_id = p_operation_id;
  if found then
    if existing.operation_kind is distinct from p_operation_kind
      or existing.request is distinct from compact_request
    then
      raise exception 'operation_id was already used for a different request'
        using errcode = '23505';
    end if;
    if existing.status = 'committed' then
      return existing.result;
    end if;
    raise exception 'operation is already running' using errcode = '55000';
  end if;

  perform studio.enforce_anonymous_mutation_quota_v1(p_actor_id);

  insert into studio.operation_receipts (
    actor_id,
    operation_id,
    operation_kind,
    request
  ) values (
    p_actor_id,
    p_operation_id,
    p_operation_kind,
    compact_request
  );
  return null;
end;
$$;


ALTER FUNCTION "studio"."begin_operation_v1"("p_actor_id" "uuid", "p_operation_id" "uuid", "p_operation_kind" "text", "p_request" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."can_read_snapshot_v1"("p_actor_id" "uuid", "p_snapshot_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1 from studio.experiment_snapshots s
    where s.snapshot_id = p_snapshot_id and s.owner_id = p_actor_id
  ) or exists (
    select 1 from studio.experiment_publications p
    where p.current_snapshot_id = p_snapshot_id
  ) or exists (
    select 1
    from studio.article_snapshot_refs r
    join studio.article_publications p
      on p.current_content_id = r.article_content_id
    where r.snapshot_id = p_snapshot_id
  );
$$;


ALTER FUNCTION "studio"."can_read_snapshot_v1"("p_actor_id" "uuid", "p_snapshot_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."enforce_anonymous_mutation_quota_v1"("p_actor_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  recent_minute bigint;
  recent_day bigint;
begin
  if not coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    return;
  end if;

  -- Different operation IDs for one anonymous account must not race through
  -- the count together. Idempotent replay is handled before this lock.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'studio:anonymous-mutation-quota:' || p_actor_id::text,
      0
    )
  );

  select
    count(*) filter (
      where created_at >= pg_catalog.statement_timestamp() - interval '1 minute'
    ),
    count(*)
  into recent_minute, recent_day
  from studio.operation_receipts
  where actor_id = p_actor_id
    and created_at >= pg_catalog.statement_timestamp() - interval '24 hours';

  if recent_minute >= 60 then
    raise exception
      'Anonymous save limit reached. Sign in or try again in a minute.'
      using errcode = '54000';
  end if;
  if recent_day >= 600 then
    raise exception
      'Anonymous daily save limit reached. Sign in to continue saving.'
      using errcode = '54000';
  end if;
end;
$$;


ALTER FUNCTION "studio"."enforce_anonymous_mutation_quota_v1"("p_actor_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."enforce_anonymous_storage_quota_v1"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  actor uuid;
  row_data jsonb := pg_catalog.to_jsonb(new);
  experiment_content_count bigint;
  article_content_count bigint;
  snapshot_count bigint;
  live_experiment_count bigint;
  live_article_count bigint;
  stored_bytes bigint;
  incoming_bytes bigint := 0;
begin
  if not coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    return new;
  end if;

  actor := coalesce(
    nullif(row_data ->> 'created_by', '')::uuid,
    nullif(row_data ->> 'owner_id', '')::uuid
  );
  if actor is null then
    raise exception 'Anonymous storage quota row has no owner'
      using errcode = '23502';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'studio:anonymous-storage-quota:' || actor::text,
      0
    )
  );

  select count(*), coalesce(sum(content_size_bytes), 0)
  into experiment_content_count, stored_bytes
  from studio.experiment_contents
  where created_by = actor;
  select count(*), stored_bytes + coalesce(sum(content_size_bytes), 0)
  into article_content_count, stored_bytes
  from studio.article_contents
  where owner_id = actor;
  select count(*) into snapshot_count
  from studio.experiment_snapshots
  where owner_id = actor;
  select count(*) into live_experiment_count
  from studio.experiments
  where owner_id = actor and deleted_at is null;
  select count(*) into live_article_count
  from studio.articles
  where owner_id = actor and deleted_at is null;

  if tg_table_name = 'experiment_contents' then
    incoming_bytes := pg_catalog.octet_length((row_data -> 'content')::text);
    if experiment_content_count >= 200 then
      raise exception 'Anonymous Experiment revision limit reached. Sign in to keep saving.'
        using errcode = '54000';
    end if;
  elsif tg_table_name = 'article_contents' then
    incoming_bytes := pg_catalog.octet_length((row_data -> 'blocks')::text)
      + pg_catalog.octet_length(row_data ->> 'title')
      + pg_catalog.octet_length(row_data ->> 'locale');
    if article_content_count >= 200 then
      raise exception 'Anonymous Article revision limit reached. Sign in to keep saving.'
        using errcode = '54000';
    end if;
  elsif tg_table_name = 'experiment_snapshots' and snapshot_count >= 100 then
    raise exception 'Anonymous Snapshot limit reached. Sign in to keep saving.'
      using errcode = '54000';
  elsif tg_table_name = 'experiments' and live_experiment_count >= 20 then
    raise exception 'Anonymous Experiment limit reached. Sign in to keep saving.'
      using errcode = '54000';
  elsif tg_table_name = 'articles' and live_article_count >= 20 then
    raise exception 'Anonymous Article limit reached. Sign in to keep saving.'
      using errcode = '54000';
  end if;

  if stored_bytes + incoming_bytes > 67108864 then
    raise exception 'Anonymous storage limit reached. Sign in to keep saving.'
      using errcode = '54000';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "studio"."enforce_anonymous_storage_quota_v1"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."extend_new_snapshot_retention_v1"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if new.retain_until is not null then
    new.retain_until := greatest(
      new.retain_until,
      pg_catalog.statement_timestamp() + interval '24 hours'
    );
  end if;
  return new;
end;
$$;


ALTER FUNCTION "studio"."extend_new_snapshot_retention_v1"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."finish_operation_v1"("p_actor_id" "uuid", "p_operation_id" "uuid", "p_result" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  receipt_kind text;
  compact_result jsonb;
begin
  select operation_kind into receipt_kind
  from studio.operation_receipts
  where actor_id = p_actor_id
    and operation_id = p_operation_id
    and status = 'running'
  for update;
  if not found then
    raise exception 'operation receipt is missing or already committed'
      using errcode = '55000';
  end if;
  compact_result := studio.operation_result_receipt_v1(
    receipt_kind,
    p_result
  );
  update studio.operation_receipts
  set status = 'committed',
      result = compact_result,
      completed_at = now()
  where actor_id = p_actor_id
    and operation_id = p_operation_id
    and status = 'running';
  return compact_result;
end;
$$;


ALTER FUNCTION "studio"."finish_operation_v1"("p_actor_id" "uuid", "p_operation_id" "uuid", "p_result" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."gc_unreferenced_content_v1"("p_limit" integer DEFAULT 500) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  deleted_experiments integer;
  deleted_articles integer;
  deleted_snapshots integer;
  deleted_experiment_contents integer;
  deleted_article_contents integer;
  deleted_operations integer;
begin
  if p_limit < 1 or p_limit > 5000 then
    raise exception 'GC limit must be within [1, 5000]' using errcode = '22023';
  end if;
  with candidates as (
    select e.experiment_id
    from studio.experiments e
    where e.deleted_at < now() - interval '1 hour'
      and not exists (
        select 1 from studio.experiment_publications p
        where p.experiment_id = e.experiment_id
      )
    order by e.deleted_at
    limit p_limit
  )
  delete from studio.experiments e
  using candidates c
  where e.experiment_id = c.experiment_id;
  get diagnostics deleted_experiments = row_count;

  with candidates as (
    select a.article_id
    from studio.articles a
    where a.deleted_at < now() - interval '1 hour'
      and not exists (
        select 1 from studio.article_publications p
        where p.article_id = a.article_id
      )
    order by a.deleted_at
    limit p_limit
  )
  delete from studio.articles a
  using candidates c
  where a.article_id = c.article_id;
  get diagnostics deleted_articles = row_count;

  with candidates as (
    select s.snapshot_id
    from studio.experiment_snapshots s
    join studio.experiment_snapshot_retention r on r.snapshot_id = s.snapshot_id
    where r.retain_until < now()
      and not exists (
        select 1 from studio.experiment_publications p
        where p.current_snapshot_id = s.snapshot_id
      )
      and not exists (
        select 1 from studio.article_snapshot_refs a
        where a.snapshot_id = s.snapshot_id
      )
    order by r.retain_until
    limit p_limit
  )
  delete from studio.experiment_snapshots s
  using candidates c
  where s.snapshot_id = c.snapshot_id;
  get diagnostics deleted_snapshots = row_count;

  with candidates as (
    select c.content_id
    from studio.experiment_contents c
    where c.created_at < now() - interval '1 hour'
      and not exists (
        select 1 from studio.experiments e where e.current_content_id = c.content_id
      )
      and not exists (
        select 1 from studio.experiment_snapshots s where s.content_id = c.content_id
      )
    order by c.created_at
    limit p_limit
  )
  delete from studio.experiment_contents c
  using candidates x where c.content_id = x.content_id;
  get diagnostics deleted_experiment_contents = row_count;

  with candidates as (
    select c.article_content_id
    from studio.article_contents c
    where c.created_at < now() - interval '1 hour'
      and not exists (
        select 1 from studio.articles a where a.current_draft_content_id = c.article_content_id
      )
      and not exists (
        select 1 from studio.article_publications p where p.current_content_id = c.article_content_id
      )
    order by c.created_at
    limit p_limit
  )
  delete from studio.article_contents c
  using candidates x where c.article_content_id = x.article_content_id;
  get diagnostics deleted_article_contents = row_count;

  delete from studio.operation_receipts
  where ctid in (
    select ctid from studio.operation_receipts
    where expires_at < now()
    order by expires_at
    limit p_limit
  );
  get diagnostics deleted_operations = row_count;

  return jsonb_build_object(
    'experiments', deleted_experiments,
    'articles', deleted_articles,
    'snapshots', deleted_snapshots,
    'experimentContents', deleted_experiment_contents,
    'articleContents', deleted_article_contents,
    'operationReceipts', deleted_operations
  );
end;
$$;


ALTER FUNCTION "studio"."gc_unreferenced_content_v1"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."guard_article_publication_models_v1"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  snapshot_id uuid;
begin
  for snapshot_id in
    select reference.snapshot_id
    from studio.article_snapshot_refs as reference
    where reference.article_content_id = new.current_content_id
  loop
    perform studio.require_stable_snapshot_model_v1(snapshot_id);
  end loop;
  return new;
end;
$$;


ALTER FUNCTION "studio"."guard_article_publication_models_v1"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."guard_experiment_publication_model_v1"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  perform studio.require_stable_snapshot_model_v1(new.current_snapshot_id);
  return new;
end;
$$;


ALTER FUNCTION "studio"."guard_experiment_publication_model_v1"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."guard_snapshot_surface_pin_v1"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  content_series_id text;
  content_model_family_id text;
  release_series_id text;
  release_model_family_id text;
begin
  select content.surface_series_id, model.model_family_id
  into content_series_id, content_model_family_id
  from studio.experiment_contents as content
  join studio.model_releases as model on model.model_id = content.model_id
  where content.content_id = new.content_id;
  if not found then
    raise exception 'Snapshot content is unavailable' using errcode = '23503';
  end if;
  if (content_series_id is null) <> (new.surface_release_id is null) then
    raise exception 'Snapshot Surface series and release pins must be supplied together'
      using errcode = '22023';
  end if;
  if content_series_id is null then return new; end if;
  select release.surface_series_id, release.model_family_id
  into release_series_id, release_model_family_id
  from studio.model_surface_releases as release
  where release.surface_release_id = new.surface_release_id;
  if not found then
    raise exception 'Snapshot Surface release is unavailable' using errcode = '23503';
  end if;
  if release_series_id <> content_series_id
    or release_model_family_id <> content_model_family_id
  then
    raise exception 'Snapshot Surface release is incompatible with its content'
      using errcode = '22023';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "studio"."guard_snapshot_surface_pin_v1"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."handle_auth_user_created_v1"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into studio.profiles (user_id, display_name, locale)
  values (
    new.id,
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en' else 'ja' end
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;


ALTER FUNCTION "studio"."handle_auth_user_created_v1"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."operation_request_fingerprint_v1"("p_operation_kind" "text", "p_request" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO ''
    AS $$
begin
  if p_operation_kind in (
    'save-experiment-v1',
    'commit-admitted-experiment-snapshot-v1'
  ) and p_request ? 'content' then
    return (p_request - 'content') || jsonb_build_object(
      'contentSha256',
      encode(
        extensions.digest(
          pg_catalog.convert_to((p_request -> 'content')::text, 'UTF8'),
          'sha256'
        ),
        'hex'
      )
    );
  end if;
  if p_operation_kind = 'save-article-v1' and p_request ? 'blocks' then
    return (p_request - 'blocks') || jsonb_build_object(
      'blocksSha256',
      encode(
        extensions.digest(
          pg_catalog.convert_to((p_request -> 'blocks')::text, 'UTF8'),
          'sha256'
        ),
        'hex'
      )
    );
  end if;
  return p_request;
end;
$$;


ALTER FUNCTION "studio"."operation_request_fingerprint_v1"("p_operation_kind" "text", "p_request" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."operation_result_receipt_v1"("p_operation_kind" "text", "p_result" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO ''
    AS $$
begin
  if p_operation_kind = 'save-experiment-v1' then
    return jsonb_build_object(
      'experimentId', p_result -> 'experimentId',
      'version', p_result -> 'version'
    );
  end if;
  if p_operation_kind = 'commit-admitted-experiment-snapshot-v1' then
    return jsonb_build_object(
      'schemaId', p_result -> 'schemaId',
      'snapshotId', p_result -> 'snapshotId',
      'createdAt', p_result -> 'createdAt'
    );
  end if;
  if p_operation_kind = 'save-article-v1' then
    return jsonb_build_object(
      'articleId', p_result -> 'articleId',
      'version', p_result -> 'version'
    );
  end if;
  return p_result;
end;
$$;


ALTER FUNCTION "studio"."operation_result_receipt_v1"("p_operation_kind" "text", "p_result" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."owns_snapshot_v1"("p_actor_id" "uuid", "p_snapshot_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from studio.experiment_snapshots s
    where s.snapshot_id = p_snapshot_id
      and s.owner_id = p_actor_id
  );
$$;


ALTER FUNCTION "studio"."owns_snapshot_v1"("p_actor_id" "uuid", "p_snapshot_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."project_article_snapshot_refs_v1"("p_article_content_id" "uuid", "p_actor_id" "uuid", "p_blocks" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  block_entry record;
  block_value jsonb;
  block_keys text[];
  placement jsonb;
  placement_keys text[];
  ref_snapshot_id uuid;
begin
  if jsonb_typeof(p_blocks) <> 'array' then
    raise exception 'Article blocks must be an array' using errcode = '22023';
  end if;
  for block_entry in
    select value, (ordinality - 1)::integer as ordinal
    from jsonb_array_elements(p_blocks) with ordinality
  loop
    block_value := block_entry.value;
    if jsonb_typeof(block_value) <> 'object' then
      raise exception 'Article block must be an object' using errcode = '22023';
    end if;
    if block_value ->> 'kind' <> 'experiment' then
      continue;
    end if;
    select array_agg(k order by k) into block_keys
    from jsonb_object_keys(block_value) as keys(k);
    if block_keys is distinct from array['blockId', 'kind', 'placement']::text[] then
      raise exception 'Article Experiment block has unexpected fields'
        using errcode = '22023';
    end if;
    placement := block_value -> 'placement';
    if jsonb_typeof(placement) <> 'object' then
      raise exception 'Article Experiment Placement must be an object'
        using errcode = '22023';
    end if;
    select array_agg(k order by k) into placement_keys
    from jsonb_object_keys(placement) as keys(k);
    if placement_keys is distinct from array[
      'briefing',
      'caption',
      'placementId',
      'schemaId',
      'snapshotId',
      'titleOverride'
    ]::text[] then
      raise exception 'Article Experiment Placement has unexpected fields'
        using errcode = '22023';
    end if;
    if placement ->> 'schemaId'
      <> 'circleheart-studio-experiment-placement-v2'
    then
      raise exception 'Article Experiment Placement schema mismatch'
        using errcode = '22023';
    end if;
    ref_snapshot_id := (placement ->> 'snapshotId')::uuid;
    if not studio.owns_snapshot_v1(p_actor_id, ref_snapshot_id) then
      raise exception 'Article Experiment Placement must reference an owned Snapshot'
        using errcode = '42501';
    end if;
    insert into studio.article_snapshot_refs (
      article_content_id,
      block_id,
      placement_id,
      snapshot_id,
      ordinal,
      briefing,
      title_override,
      caption
    ) values (
      p_article_content_id,
      block_value ->> 'blockId',
      placement ->> 'placementId',
      ref_snapshot_id,
      block_entry.ordinal,
      placement -> 'briefing',
      placement ->> 'titleOverride',
      placement ->> 'caption'
    );
  end loop;
end;
$$;


ALTER FUNCTION "studio"."project_article_snapshot_refs_v1"("p_article_content_id" "uuid", "p_actor_id" "uuid", "p_blocks" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."reject_immutable_row_mutation_v1"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  raise exception '% is immutable', tg_table_name using errcode = '55000';
end;
$$;


ALTER FUNCTION "studio"."reject_immutable_row_mutation_v1"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."reject_immutable_update_v1"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  raise exception '% is immutable', tg_table_name using errcode = '55000';
end;
$$;


ALTER FUNCTION "studio"."reject_immutable_update_v1"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."require_stable_snapshot_model_v1"("p_snapshot_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  model_stage text;
  model_loadable boolean;
  surface_stage text;
begin
  select model_availability.stage, model_availability.loadable,
    surface_availability.stage
  into model_stage, model_loadable, surface_stage
  from studio.experiment_snapshots as snapshot
  join studio.experiment_contents as content
    on content.content_id = snapshot.content_id
  join studio.model_release_availability as model_availability
    on model_availability.model_id = content.model_id
  left join studio.model_surface_release_availability as surface_availability
    on surface_availability.surface_release_id = snapshot.surface_release_id
  where snapshot.snapshot_id = p_snapshot_id;
  if model_stage is null then
    raise exception 'Snapshot model release is unavailable' using errcode = '23503';
  end if;
  if not model_loadable then
    raise exception 'Snapshot model release is disabled' using errcode = '22023';
  end if;
  if model_stage <> 'stable' then
    raise exception 'Only stable model releases may be published (found %)', model_stage
      using errcode = '22023';
  end if;
  if surface_stage is null then
    raise exception 'Snapshot Surface release is unavailable' using errcode = '23503';
  end if;
  if surface_stage <> 'stable' then
    raise exception 'Only stable Surface releases may be published (found %)', surface_stage
      using errcode = '22023';
  end if;
end;
$$;


ALTER FUNCTION "studio"."require_stable_snapshot_model_v1"("p_snapshot_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."set_jsonb_size_v1"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if tg_table_name = 'experiment_contents' then
    new.content_size_bytes := octet_length(new.content::text);
  elsif tg_table_name = 'article_contents' then
    new.content_size_bytes := octet_length(new.blocks::text)
      + octet_length(new.title)
      + octet_length(new.locale);
  else
    raise exception 'unsupported JSONB size trigger target %', tg_table_name;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "studio"."set_jsonb_size_v1"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."snapshot_preserves_authored_content_v1"("p_saved" "jsonb", "p_candidate" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO ''
    AS $$
declare
  scenario_count integer;
begin
  if p_saved ->> 'modelId' is distinct from p_candidate ->> 'modelId'
    or p_saved -> 'surface' is distinct from p_candidate -> 'surface'
    or jsonb_typeof(p_saved -> 'scenarios') <> 'array'
    or jsonb_typeof(p_candidate -> 'scenarios') <> 'array'
    or jsonb_array_length(p_saved -> 'scenarios')
      <> jsonb_array_length(p_candidate -> 'scenarios')
  then
    return false;
  end if;
  scenario_count := jsonb_array_length(p_saved -> 'scenarios');
  for scenario_index in 0..scenario_count - 1 loop
    if p_saved #>> array['scenarios', scenario_index::text, 'scenarioId']
        is distinct from p_candidate #>> array['scenarios', scenario_index::text, 'scenarioId']
      or p_saved #>> array['scenarios', scenario_index::text, 'label']
        is distinct from p_candidate #>> array['scenarios', scenario_index::text, 'label']
      or p_saved #> array['scenarios', scenario_index::text, 'capture', 'fixture']
        is distinct from p_candidate #> array['scenarios', scenario_index::text, 'capture', 'fixture']
    then
      return false;
    end if;
  end loop;
  return true;
end;
$$;


ALTER FUNCTION "studio"."snapshot_preserves_authored_content_v1"("p_saved" "jsonb", "p_candidate" "jsonb") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "studio"."active_model_bundle" (
    "singleton" boolean DEFAULT true NOT NULL,
    "version" bigint DEFAULT 0 NOT NULL,
    "model_id" "text" NOT NULL,
    "surface_release_id" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "active_model_bundle_singleton" CHECK ("singleton"),
    CONSTRAINT "active_model_bundle_version" CHECK (("version" >= 0))
);


ALTER TABLE "studio"."active_model_bundle" OWNER TO "postgres";


COMMENT ON TABLE "studio"."active_model_bundle" IS 'Singleton CAS pointer for the exact model and Model Surface used by new Sessions. It is not content identity and never repins existing content.';



CREATE TABLE IF NOT EXISTS "studio"."article_contents" (
    "article_content_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "locale" "text" NOT NULL,
    "title" "text" NOT NULL,
    "blocks" "jsonb" NOT NULL,
    "content_size_bytes" bigint DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "article_contents_blocks" CHECK (("jsonb_typeof"("blocks") = 'array'::"text")),
    CONSTRAINT "article_contents_locale" CHECK (("locale" = ANY (ARRAY['ja'::"text", 'en'::"text"]))),
    CONSTRAINT "article_contents_size" CHECK ((("content_size_bytes" >= 1) AND ("content_size_bytes" <= 2097152))),
    CONSTRAINT "article_contents_title" CHECK ((("title" = "btrim"("title")) AND (("char_length"("title") >= 1) AND ("char_length"("title") <= 240))))
);


ALTER TABLE "studio"."article_contents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "studio"."article_publications" (
    "article_id" "uuid" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "current_content_id" "uuid" NOT NULL,
    "public_slug" "text" NOT NULL,
    "published_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "article_publications_slug" CHECK (("public_slug" ~ '^[a-z0-9][a-z0-9-]{2,95}$'::"text"))
);


ALTER TABLE "studio"."article_publications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "studio"."article_snapshot_refs" (
    "article_content_id" "uuid" NOT NULL,
    "block_id" "text" NOT NULL,
    "placement_id" "text" NOT NULL,
    "snapshot_id" "uuid" NOT NULL,
    "ordinal" integer NOT NULL,
    "briefing" "jsonb" NOT NULL,
    "title_override" "text",
    "caption" "text",
    CONSTRAINT "article_snapshot_refs_block_id" CHECK ((("block_id" = "btrim"("block_id")) AND ("char_length"("block_id") > 0))),
    CONSTRAINT "article_snapshot_refs_briefing" CHECK (("jsonb_typeof"("briefing") = 'object'::"text")),
    CONSTRAINT "article_snapshot_refs_caption" CHECK ((("caption" IS NULL) OR (("caption" = "btrim"("caption")) AND ("char_length"("caption") > 0)))),
    CONSTRAINT "article_snapshot_refs_ordinal" CHECK (("ordinal" >= 0)),
    CONSTRAINT "article_snapshot_refs_placement_id" CHECK ((("placement_id" = "btrim"("placement_id")) AND ("char_length"("placement_id") > 0))),
    CONSTRAINT "article_snapshot_refs_title_override" CHECK ((("title_override" IS NULL) OR (("title_override" = "btrim"("title_override")) AND ("char_length"("title_override") > 0))))
);


ALTER TABLE "studio"."article_snapshot_refs" OWNER TO "postgres";


COMMENT ON TABLE "studio"."article_snapshot_refs" IS 'Relational projection of Article-owned Placement/Briefing data. The referenced ExperimentSnapshot remains neutral and reusable.';



CREATE TABLE IF NOT EXISTS "studio"."articles" (
    "article_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "version" bigint DEFAULT 0 NOT NULL,
    "current_draft_content_id" "uuid" NOT NULL,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "articles_version" CHECK (("version" >= 0))
);


ALTER TABLE "studio"."articles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "studio"."experiment_contents" (
    "content_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "model_id" "text" NOT NULL,
    "content" "jsonb" NOT NULL,
    "content_size_bytes" bigint DEFAULT 0 NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "surface_series_id" "text",
    CONSTRAINT "experiment_contents_object" CHECK ((("jsonb_typeof"("content") = 'object'::"text") AND (("content" ->> 'modelId'::"text") = "model_id") AND ("jsonb_typeof"(("content" -> 'scenarios'::"text")) = 'array'::"text") AND (("jsonb_array_length"(("content" -> 'scenarios'::"text")) >= 1) AND ("jsonb_array_length"(("content" -> 'scenarios'::"text")) <= 4)) AND ("jsonb_typeof"(("content" -> 'surface'::"text")) = 'object'::"text"))),
    CONSTRAINT "experiment_contents_size" CHECK ((("content_size_bytes" >= 1) AND ("content_size_bytes" <= 8388608))),
    CONSTRAINT "experiment_contents_surface_series_pin" CHECK (((("content" ? 'surfaceSeriesId'::"text") = ("surface_series_id" IS NOT NULL)) AND (NOT (("content" ->> 'surfaceSeriesId'::"text") IS DISTINCT FROM "surface_series_id"))))
);


ALTER TABLE "studio"."experiment_contents" OWNER TO "postgres";


COMMENT ON COLUMN "studio"."experiment_contents"."surface_series_id" IS 'Mutable Experiment presentation lineage. Historical V2 compatibility rows may be null; Standard-ABI content must pin a Surface series.';



CREATE TABLE IF NOT EXISTS "studio"."experiment_publications" (
    "experiment_id" "uuid" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "current_snapshot_id" "uuid" NOT NULL,
    "public_slug" "text" NOT NULL,
    "published_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "experiment_publications_slug" CHECK (("public_slug" ~ '^[a-z0-9][a-z0-9-]{2,95}$'::"text"))
);


ALTER TABLE "studio"."experiment_publications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "studio"."experiment_snapshot_retention" (
    "snapshot_id" "uuid" NOT NULL,
    "retain_until" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "studio"."experiment_snapshot_retention" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "studio"."experiment_snapshot_sources" (
    "snapshot_id" "uuid" NOT NULL,
    "source_experiment_id" "uuid" NOT NULL
);


ALTER TABLE "studio"."experiment_snapshot_sources" OWNER TO "postgres";


COMMENT ON TABLE "studio"."experiment_snapshot_sources" IS 'Backend-only saved-Experiment provenance used for clean-head publication enforcement. It is not part of portable Snapshot identity.';



CREATE TABLE IF NOT EXISTS "studio"."experiment_snapshots" (
    "snapshot_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "content_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "surface_release_id" "text"
);


ALTER TABLE "studio"."experiment_snapshots" OWNER TO "postgres";


COMMENT ON TABLE "studio"."experiment_snapshots" IS 'Neutral immutable admitted captures. Article/publication purpose, Briefing, settlement, V&V reports, hashes, and runtime status do not belong to this row.';



COMMENT ON COLUMN "studio"."experiment_snapshots"."surface_release_id" IS 'Exact immutable presentation contract captured with a Standard-ABI Snapshot. Historical V2 compatibility rows may be null.';



CREATE TABLE IF NOT EXISTS "studio"."experiments" (
    "experiment_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "model_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "version" bigint DEFAULT 0 NOT NULL,
    "current_content_id" "uuid" NOT NULL,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "experiments_title" CHECK ((("title" = "btrim"("title")) AND (("char_length"("title") >= 1) AND ("char_length"("title") <= 240)))),
    CONSTRAINT "experiments_version" CHECK (("version" >= 0))
);


ALTER TABLE "studio"."experiments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "studio"."model_release_availability" (
    "model_id" "text" NOT NULL,
    "loadable" boolean DEFAULT true NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "stage" "text" DEFAULT 'dev'::"text" NOT NULL,
    CONSTRAINT "model_release_availability_stage" CHECK (("stage" = ANY (ARRAY['dev'::"text", 'stable'::"text", 'retired'::"text"])))
);


ALTER TABLE "studio"."model_release_availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "studio"."model_release_successions" (
    "from_model_id" "text" NOT NULL,
    "to_model_id" "text" NOT NULL,
    "grade" "text" NOT NULL,
    "registered_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "model_release_succession_grade" CHECK (("grade" = 'successor'::"text")),
    CONSTRAINT "model_release_succession_not_self" CHECK (("from_model_id" <> "to_model_id"))
);


ALTER TABLE "studio"."model_release_successions" OWNER TO "postgres";


COMMENT ON TABLE "studio"."model_release_successions" IS 'Explicit conceptual lineage only. It never silently repins existing content. Evidence-backed drop-in qualification is intentionally unavailable until its verifier exists.';



CREATE TABLE IF NOT EXISTS "studio"."model_releases" (
    "model_id" "text" NOT NULL,
    "model_family_id" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "manifest" "jsonb" NOT NULL,
    "artifact_path" "text" NOT NULL,
    "artifact_sha256" "text" NOT NULL,
    "registry_fingerprint" "text" NOT NULL,
    "source_commit" "text" NOT NULL,
    "default_fixture" "jsonb" NOT NULL,
    "analysis_profile_id" "text" NOT NULL,
    "registered_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "model_releases_analysis_profile_nonempty" CHECK ((("analysis_profile_id" = "btrim"("analysis_profile_id")) AND (("char_length"("analysis_profile_id") >= 1) AND ("char_length"("analysis_profile_id") <= 256)))),
    CONSTRAINT "model_releases_artifact_path_nonempty" CHECK ((("artifact_path" = "btrim"("artifact_path")) AND ("char_length"("artifact_path") > 0))),
    CONSTRAINT "model_releases_artifact_sha256" CHECK (("artifact_sha256" ~ '^[0-9a-f]{64}$'::"text")),
    CONSTRAINT "model_releases_display_name_nonempty" CHECK ((("display_name" = "btrim"("display_name")) AND (("char_length"("display_name") >= 1) AND ("char_length"("display_name") <= 160)))),
    CONSTRAINT "model_releases_default_fixture_object" CHECK (("jsonb_typeof"("default_fixture") = 'object'::"text")),
    CONSTRAINT "model_releases_family_id_nonempty" CHECK ((("model_family_id" = "btrim"("model_family_id")) AND ("char_length"("model_family_id") > 0))),
    CONSTRAINT "model_releases_manifest_object" CHECK ((("jsonb_typeof"("manifest") = 'object'::"text") AND (("manifest" ->> 'schemaId'::"text") = 'circleheart-studio-exact-model-kernel-v3'::"text") AND (("manifest" ->> 'modelId'::"text") = "model_id") AND (("manifest" ->> 'modelFamilyId'::"text") = "model_family_id"))),
    CONSTRAINT "model_releases_model_id_nonempty" CHECK ((("model_id" = "btrim"("model_id")) AND ("char_length"("model_id") > 0))),
    CONSTRAINT "model_releases_registry_fingerprint" CHECK (("registry_fingerprint" ~ '^[0-9a-f]{64}$'::"text")),
    CONSTRAINT "model_releases_source_commit_nonempty" CHECK ((("source_commit" = "btrim"("source_commit")) AND ("char_length"("source_commit") > 0)))
);


ALTER TABLE "studio"."model_releases" OWNER TO "postgres";


COMMENT ON TABLE "studio"."model_releases" IS 'Immutable exact-model registry rows. Public executable bytes live in the model-releases Storage bucket; registration and upload remain service-only release operations.';



COMMENT ON COLUMN "studio"."model_releases"."artifact_sha256" IS 'Registry/CI integrity metadata. It is not Studio domain identity and is not returned to ordinary clients.';



CREATE TABLE IF NOT EXISTS "studio"."model_surface_release_availability" (
    "surface_release_id" "text" NOT NULL,
    "stage" "text" DEFAULT 'dev'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "model_surface_release_stage" CHECK (("stage" = ANY (ARRAY['dev'::"text", 'stable'::"text", 'retired'::"text"])))
);


ALTER TABLE "studio"."model_surface_release_availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "studio"."model_surface_releases" (
    "surface_release_id" "text" NOT NULL,
    "surface_series_id" "text" NOT NULL,
    "predecessor_surface_release_id" "text",
    "model_family_id" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "manifest" "jsonb" NOT NULL,
    "source_commit" "text" NOT NULL,
    "registered_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "model_surface_releases_display_name" CHECK ((("display_name" = "btrim"("display_name")) AND (("char_length"("display_name") >= 1) AND ("char_length"("display_name") <= 160)))),
    CONSTRAINT "model_surface_releases_family_nonempty" CHECK ((("model_family_id" = "btrim"("model_family_id")) AND ("char_length"("model_family_id") > 0))),
    CONSTRAINT "model_surface_releases_id_nonempty" CHECK ((("surface_release_id" = "btrim"("surface_release_id")) AND ("char_length"("surface_release_id") > 0))),
    CONSTRAINT "model_surface_releases_manifest" CHECK ((("jsonb_typeof"("manifest") = 'object'::"text") AND (("manifest" ->> 'schemaId'::"text") = 'circleheart-studio-model-surface-release-v1'::"text") AND (("manifest" ->> 'surfaceReleaseId'::"text") = "surface_release_id") AND (("manifest" ->> 'surfaceSeriesId'::"text") = "surface_series_id") AND (("manifest" ->> 'modelFamilyId'::"text") = "model_family_id") AND (("manifest" ->> 'displayName'::"text") = "display_name") AND ("manifest" ? 'predecessorSurfaceReleaseId'::"text") AND (NOT (("manifest" ->> 'predecessorSurfaceReleaseId'::"text") IS DISTINCT FROM "predecessor_surface_release_id")) AND ("jsonb_typeof"(("manifest" -> 'controlCatalog'::"text")) = 'array'::"text") AND ("jsonb_typeof"(("manifest" -> 'derivedOutputCatalog'::"text")) = 'array'::"text") AND ("jsonb_typeof"(("manifest" -> 'graphCatalog'::"text")) = 'array'::"text") AND ("jsonb_typeof"(("manifest" -> 'knobCatalog'::"text")) = 'array'::"text") AND ("jsonb_typeof"(("manifest" -> 'protocolCatalog'::"text")) = 'array'::"text"))),
    CONSTRAINT "model_surface_releases_predecessor_not_self" CHECK ((("predecessor_surface_release_id" IS NULL) OR ("predecessor_surface_release_id" <> "surface_release_id"))),
    CONSTRAINT "model_surface_releases_series_nonempty" CHECK ((("surface_series_id" = "btrim"("surface_series_id")) AND ("char_length"("surface_series_id") > 0))),
    CONSTRAINT "model_surface_releases_source_commit" CHECK ((("source_commit" = "btrim"("source_commit")) AND ("char_length"("source_commit") > 0)))
);


ALTER TABLE "studio"."model_surface_releases" OWNER TO "postgres";


COMMENT ON TABLE "studio"."model_surface_releases" IS 'Immutable append-only authoring/analysis surfaces. They contain graphs, derived outputs, knobs, and protocols but no numerical kernel or Snapshot admission profile.';



CREATE TABLE IF NOT EXISTS "studio"."operation_receipts" (
    "actor_id" "uuid" NOT NULL,
    "operation_id" "uuid" NOT NULL,
    "operation_kind" "text" NOT NULL,
    "request" "jsonb" NOT NULL,
    "status" "text" DEFAULT 'running'::"text" NOT NULL,
    "result" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '24:00:00'::interval) NOT NULL,
    CONSTRAINT "operation_receipts_kind" CHECK (("operation_kind" ~ '^[a-z][a-z0-9-]{0,79}$'::"text")),
    CONSTRAINT "operation_receipts_request_object" CHECK (("jsonb_typeof"("request") = 'object'::"text")),
    CONSTRAINT "operation_receipts_result" CHECK (((("status" = 'running'::"text") AND ("result" IS NULL) AND ("completed_at" IS NULL)) OR (("status" = 'committed'::"text") AND ("result" IS NOT NULL) AND ("completed_at" IS NOT NULL)))),
    CONSTRAINT "operation_receipts_status" CHECK (("status" = ANY (ARRAY['running'::"text", 'committed'::"text"])))
);


ALTER TABLE "studio"."operation_receipts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "studio"."profiles" (
    "user_id" "uuid" NOT NULL,
    "display_name" "text",
    "locale" "text" DEFAULT 'ja'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_display_name" CHECK ((("display_name" IS NULL) OR (("display_name" = "btrim"("display_name")) AND (("char_length"("display_name") >= 1) AND ("char_length"("display_name") <= 80))))),
    CONSTRAINT "profiles_locale" CHECK (("locale" = ANY (ARRAY['ja'::"text", 'en'::"text"])))
);


ALTER TABLE "studio"."profiles" OWNER TO "postgres";


ALTER TABLE ONLY "studio"."active_model_bundle"
    ADD CONSTRAINT "active_model_bundle_pkey" PRIMARY KEY ("singleton");



ALTER TABLE ONLY "studio"."article_contents"
    ADD CONSTRAINT "article_contents_pkey" PRIMARY KEY ("article_content_id");



ALTER TABLE ONLY "studio"."article_publications"
    ADD CONSTRAINT "article_publications_current_content_id_key" UNIQUE ("current_content_id");



ALTER TABLE ONLY "studio"."article_publications"
    ADD CONSTRAINT "article_publications_pkey" PRIMARY KEY ("article_id");



ALTER TABLE ONLY "studio"."article_publications"
    ADD CONSTRAINT "article_publications_public_slug_key" UNIQUE ("public_slug");



ALTER TABLE ONLY "studio"."article_snapshot_refs"
    ADD CONSTRAINT "article_snapshot_refs_article_content_id_block_id_key" UNIQUE ("article_content_id", "block_id");



ALTER TABLE ONLY "studio"."article_snapshot_refs"
    ADD CONSTRAINT "article_snapshot_refs_article_content_id_ordinal_key" UNIQUE ("article_content_id", "ordinal");



ALTER TABLE ONLY "studio"."article_snapshot_refs"
    ADD CONSTRAINT "article_snapshot_refs_pkey" PRIMARY KEY ("article_content_id", "placement_id");



ALTER TABLE ONLY "studio"."articles"
    ADD CONSTRAINT "articles_pkey" PRIMARY KEY ("article_id");



ALTER TABLE ONLY "studio"."experiment_contents"
    ADD CONSTRAINT "experiment_contents_content_id_model_id_key" UNIQUE ("content_id", "model_id");



ALTER TABLE ONLY "studio"."experiment_contents"
    ADD CONSTRAINT "experiment_contents_pkey" PRIMARY KEY ("content_id");



ALTER TABLE ONLY "studio"."experiment_publications"
    ADD CONSTRAINT "experiment_publications_current_snapshot_id_key" UNIQUE ("current_snapshot_id");



ALTER TABLE ONLY "studio"."experiment_publications"
    ADD CONSTRAINT "experiment_publications_pkey" PRIMARY KEY ("experiment_id");



ALTER TABLE ONLY "studio"."experiment_publications"
    ADD CONSTRAINT "experiment_publications_public_slug_key" UNIQUE ("public_slug");



ALTER TABLE ONLY "studio"."experiment_snapshot_retention"
    ADD CONSTRAINT "experiment_snapshot_retention_pkey" PRIMARY KEY ("snapshot_id");



ALTER TABLE ONLY "studio"."experiment_snapshot_sources"
    ADD CONSTRAINT "experiment_snapshot_sources_pkey" PRIMARY KEY ("snapshot_id");



ALTER TABLE ONLY "studio"."experiment_snapshots"
    ADD CONSTRAINT "experiment_snapshots_pkey" PRIMARY KEY ("snapshot_id");



ALTER TABLE ONLY "studio"."experiments"
    ADD CONSTRAINT "experiments_pkey" PRIMARY KEY ("experiment_id");



ALTER TABLE ONLY "studio"."model_release_availability"
    ADD CONSTRAINT "model_release_availability_pkey" PRIMARY KEY ("model_id");



ALTER TABLE ONLY "studio"."model_release_successions"
    ADD CONSTRAINT "model_release_successions_pkey" PRIMARY KEY ("from_model_id", "to_model_id");



ALTER TABLE ONLY "studio"."model_releases"
    ADD CONSTRAINT "model_releases_artifact_path_key" UNIQUE ("artifact_path");



ALTER TABLE ONLY "studio"."model_releases"
    ADD CONSTRAINT "model_releases_pkey" PRIMARY KEY ("model_id");



ALTER TABLE ONLY "studio"."model_surface_release_availability"
    ADD CONSTRAINT "model_surface_release_availability_pkey" PRIMARY KEY ("surface_release_id");



ALTER TABLE ONLY "studio"."model_surface_releases"
    ADD CONSTRAINT "model_surface_releases_pkey" PRIMARY KEY ("surface_release_id");



ALTER TABLE ONLY "studio"."model_surface_releases"
    ADD CONSTRAINT "model_surface_releases_predecessor_surface_release_id_key" UNIQUE ("predecessor_surface_release_id");



ALTER TABLE ONLY "studio"."operation_receipts"
    ADD CONSTRAINT "operation_receipts_pkey" PRIMARY KEY ("actor_id", "operation_id");



ALTER TABLE ONLY "studio"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id");



CREATE INDEX "article_publications_content_idx" ON "studio"."article_publications" USING "btree" ("current_content_id");



CREATE INDEX "article_snapshot_refs_snapshot_idx" ON "studio"."article_snapshot_refs" USING "btree" ("snapshot_id");



CREATE INDEX "articles_owner_updated_idx" ON "studio"."articles" USING "btree" ("owner_id", "updated_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "experiment_publications_snapshot_idx" ON "studio"."experiment_publications" USING "btree" ("current_snapshot_id");



CREATE INDEX "experiment_snapshot_sources_experiment_idx" ON "studio"."experiment_snapshot_sources" USING "btree" ("source_experiment_id");



CREATE INDEX "experiment_snapshots_content_idx" ON "studio"."experiment_snapshots" USING "btree" ("content_id");



CREATE INDEX "experiment_snapshots_owner_created_idx" ON "studio"."experiment_snapshots" USING "btree" ("owner_id", "created_at" DESC);



CREATE INDEX "experiments_owner_updated_idx" ON "studio"."experiments" USING "btree" ("owner_id", "updated_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "operation_receipts_actor_created_idx" ON "studio"."operation_receipts" USING "btree" ("actor_id", "created_at" DESC);



CREATE INDEX "operation_receipts_expiry_idx" ON "studio"."operation_receipts" USING "btree" ("expires_at");



CREATE OR REPLACE TRIGGER "article_contents_are_immutable" BEFORE UPDATE ON "studio"."article_contents" FOR EACH ROW EXECUTE FUNCTION "studio"."reject_immutable_update_v1"();



CREATE OR REPLACE TRIGGER "article_contents_measure_size" BEFORE INSERT ON "studio"."article_contents" FOR EACH ROW EXECUTE FUNCTION "studio"."set_jsonb_size_v1"();



CREATE OR REPLACE TRIGGER "article_publication_requires_stable_models" BEFORE INSERT OR UPDATE OF "current_content_id" ON "studio"."article_publications" FOR EACH ROW EXECUTE FUNCTION "studio"."guard_article_publication_models_v1"();



CREATE OR REPLACE TRIGGER "article_snapshot_refs_are_immutable" BEFORE UPDATE ON "studio"."article_snapshot_refs" FOR EACH ROW EXECUTE FUNCTION "studio"."reject_immutable_update_v1"();



CREATE OR REPLACE TRIGGER "enforce_anonymous_article_content_storage" BEFORE INSERT ON "studio"."article_contents" FOR EACH ROW EXECUTE FUNCTION "studio"."enforce_anonymous_storage_quota_v1"();



CREATE OR REPLACE TRIGGER "enforce_anonymous_article_storage" BEFORE INSERT ON "studio"."articles" FOR EACH ROW EXECUTE FUNCTION "studio"."enforce_anonymous_storage_quota_v1"();



CREATE OR REPLACE TRIGGER "enforce_anonymous_experiment_content_storage" BEFORE INSERT ON "studio"."experiment_contents" FOR EACH ROW EXECUTE FUNCTION "studio"."enforce_anonymous_storage_quota_v1"();



CREATE OR REPLACE TRIGGER "enforce_anonymous_experiment_storage" BEFORE INSERT ON "studio"."experiments" FOR EACH ROW EXECUTE FUNCTION "studio"."enforce_anonymous_storage_quota_v1"();



CREATE OR REPLACE TRIGGER "enforce_anonymous_snapshot_storage" BEFORE INSERT ON "studio"."experiment_snapshots" FOR EACH ROW EXECUTE FUNCTION "studio"."enforce_anonymous_storage_quota_v1"();



CREATE OR REPLACE TRIGGER "experiment_contents_are_immutable" BEFORE UPDATE ON "studio"."experiment_contents" FOR EACH ROW EXECUTE FUNCTION "studio"."reject_immutable_update_v1"();



CREATE OR REPLACE TRIGGER "experiment_contents_measure_size" BEFORE INSERT ON "studio"."experiment_contents" FOR EACH ROW EXECUTE FUNCTION "studio"."set_jsonb_size_v1"();



CREATE OR REPLACE TRIGGER "experiment_publication_requires_stable_model" BEFORE INSERT OR UPDATE OF "current_snapshot_id" ON "studio"."experiment_publications" FOR EACH ROW EXECUTE FUNCTION "studio"."guard_experiment_publication_model_v1"();



CREATE OR REPLACE TRIGGER "experiment_snapshot_surface_pin_is_compatible" BEFORE INSERT OR UPDATE OF "content_id", "surface_release_id" ON "studio"."experiment_snapshots" FOR EACH ROW EXECUTE FUNCTION "studio"."guard_snapshot_surface_pin_v1"();



CREATE OR REPLACE TRIGGER "experiment_snapshots_are_immutable" BEFORE UPDATE ON "studio"."experiment_snapshots" FOR EACH ROW EXECUTE FUNCTION "studio"."reject_immutable_update_v1"();



CREATE OR REPLACE TRIGGER "extend_new_snapshot_retention" BEFORE INSERT ON "studio"."experiment_snapshot_retention" FOR EACH ROW EXECUTE FUNCTION "studio"."extend_new_snapshot_retention_v1"();



CREATE OR REPLACE TRIGGER "model_release_successions_are_immutable" BEFORE DELETE OR UPDATE ON "studio"."model_release_successions" FOR EACH ROW EXECUTE FUNCTION "studio"."reject_immutable_row_mutation_v1"();



CREATE OR REPLACE TRIGGER "model_releases_are_immutable" BEFORE DELETE OR UPDATE ON "studio"."model_releases" FOR EACH ROW EXECUTE FUNCTION "studio"."reject_immutable_row_mutation_v1"();



CREATE OR REPLACE TRIGGER "model_surface_releases_are_immutable" BEFORE DELETE OR UPDATE ON "studio"."model_surface_releases" FOR EACH ROW EXECUTE FUNCTION "studio"."reject_immutable_row_mutation_v1"();



ALTER TABLE ONLY "studio"."active_model_bundle"
    ADD CONSTRAINT "active_model_bundle_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "studio"."model_releases"("model_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "studio"."active_model_bundle"
    ADD CONSTRAINT "active_model_bundle_surface_release_id_fkey" FOREIGN KEY ("surface_release_id") REFERENCES "studio"."model_surface_releases"("surface_release_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "studio"."article_contents"
    ADD CONSTRAINT "article_contents_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "studio"."article_publications"
    ADD CONSTRAINT "article_publications_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "studio"."articles"("article_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "studio"."article_publications"
    ADD CONSTRAINT "article_publications_current_content_id_fkey" FOREIGN KEY ("current_content_id") REFERENCES "studio"."article_contents"("article_content_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "studio"."article_publications"
    ADD CONSTRAINT "article_publications_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "studio"."article_snapshot_refs"
    ADD CONSTRAINT "article_snapshot_refs_article_content_id_fkey" FOREIGN KEY ("article_content_id") REFERENCES "studio"."article_contents"("article_content_id") ON DELETE CASCADE;



ALTER TABLE ONLY "studio"."article_snapshot_refs"
    ADD CONSTRAINT "article_snapshot_refs_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "studio"."experiment_snapshots"("snapshot_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "studio"."articles"
    ADD CONSTRAINT "articles_current_draft_content_id_fkey" FOREIGN KEY ("current_draft_content_id") REFERENCES "studio"."article_contents"("article_content_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "studio"."articles"
    ADD CONSTRAINT "articles_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "studio"."experiment_contents"
    ADD CONSTRAINT "experiment_contents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "studio"."experiment_contents"
    ADD CONSTRAINT "experiment_contents_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "studio"."model_releases"("model_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "studio"."experiment_publications"
    ADD CONSTRAINT "experiment_publications_current_snapshot_id_fkey" FOREIGN KEY ("current_snapshot_id") REFERENCES "studio"."experiment_snapshots"("snapshot_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "studio"."experiment_publications"
    ADD CONSTRAINT "experiment_publications_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "studio"."experiments"("experiment_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "studio"."experiment_publications"
    ADD CONSTRAINT "experiment_publications_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "studio"."experiment_snapshot_retention"
    ADD CONSTRAINT "experiment_snapshot_retention_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "studio"."experiment_snapshots"("snapshot_id") ON DELETE CASCADE;



ALTER TABLE ONLY "studio"."experiment_snapshot_sources"
    ADD CONSTRAINT "experiment_snapshot_sources_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "studio"."experiment_snapshots"("snapshot_id") ON DELETE CASCADE;



ALTER TABLE ONLY "studio"."experiment_snapshot_sources"
    ADD CONSTRAINT "experiment_snapshot_sources_source_experiment_id_fkey" FOREIGN KEY ("source_experiment_id") REFERENCES "studio"."experiments"("experiment_id") ON DELETE CASCADE;



ALTER TABLE ONLY "studio"."experiment_snapshots"
    ADD CONSTRAINT "experiment_snapshots_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "studio"."experiment_contents"("content_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "studio"."experiment_snapshots"
    ADD CONSTRAINT "experiment_snapshots_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "studio"."experiment_snapshots"
    ADD CONSTRAINT "experiment_snapshots_surface_release_id_fkey" FOREIGN KEY ("surface_release_id") REFERENCES "studio"."model_surface_releases"("surface_release_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "studio"."experiments"
    ADD CONSTRAINT "experiments_current_content_id_model_id_fkey" FOREIGN KEY ("current_content_id", "model_id") REFERENCES "studio"."experiment_contents"("content_id", "model_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "studio"."experiments"
    ADD CONSTRAINT "experiments_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "studio"."model_releases"("model_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "studio"."experiments"
    ADD CONSTRAINT "experiments_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "studio"."model_release_availability"
    ADD CONSTRAINT "model_release_availability_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "studio"."model_releases"("model_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "studio"."model_release_successions"
    ADD CONSTRAINT "model_release_successions_from_model_id_fkey" FOREIGN KEY ("from_model_id") REFERENCES "studio"."model_releases"("model_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "studio"."model_release_successions"
    ADD CONSTRAINT "model_release_successions_to_model_id_fkey" FOREIGN KEY ("to_model_id") REFERENCES "studio"."model_releases"("model_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "studio"."model_surface_release_availability"
    ADD CONSTRAINT "model_surface_release_availability_surface_release_id_fkey" FOREIGN KEY ("surface_release_id") REFERENCES "studio"."model_surface_releases"("surface_release_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "studio"."model_surface_releases"
    ADD CONSTRAINT "model_surface_releases_predecessor_surface_release_id_fkey" FOREIGN KEY ("predecessor_surface_release_id") REFERENCES "studio"."model_surface_releases"("surface_release_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "studio"."operation_receipts"
    ADD CONSTRAINT "operation_receipts_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "studio"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "studio"."active_model_bundle" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "studio"."article_contents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "studio"."article_publications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "studio"."article_snapshot_refs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "studio"."articles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "studio"."experiment_contents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "studio"."experiment_publications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "studio"."experiment_snapshot_retention" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "studio"."experiment_snapshot_sources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "studio"."experiment_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "studio"."experiments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "studio"."model_release_availability" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "studio"."model_release_successions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "studio"."model_releases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "studio"."model_surface_release_availability" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "studio"."model_surface_releases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "studio"."operation_receipts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "studio"."profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";








GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT USAGE ON SCHEMA "studio" TO "service_role";

















































































































































































REVOKE ALL ON FUNCTION "public"."commit_admitted_experiment_snapshot_v1"("p_operation_id" "uuid", "p_snapshot_id" "uuid", "p_model_id" "text", "p_content" "jsonb", "p_surface_release_id" "text", "p_source_experiment_id" "uuid", "p_expected_experiment_version" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."commit_admitted_experiment_snapshot_v1"("p_operation_id" "uuid", "p_snapshot_id" "uuid", "p_model_id" "text", "p_content" "jsonb", "p_surface_release_id" "text", "p_source_experiment_id" "uuid", "p_expected_experiment_version" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."delete_article_v1"("p_operation_id" "uuid", "p_article_id" "uuid", "p_expected_version" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_article_v1"("p_operation_id" "uuid", "p_article_id" "uuid", "p_expected_version" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."delete_experiment_v1"("p_operation_id" "uuid", "p_experiment_id" "uuid", "p_expected_version" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."delete_experiment_v1"("p_operation_id" "uuid", "p_experiment_id" "uuid", "p_expected_version" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_active_model_bundle_v1"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_active_model_bundle_v1"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_model_bundle_v1"() TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_model_release_v1"("p_model_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_model_release_v1"("p_model_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_model_release_v1"("p_model_id" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_model_surface_release_v1"("p_surface_release_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_model_surface_release_v1"("p_surface_release_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_model_surface_release_v1"("p_surface_release_id" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_model_surface_series_latest_v1"("p_surface_series_id" "text", "p_model_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_model_surface_series_latest_v1"("p_surface_series_id" "text", "p_model_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_model_surface_series_latest_v1"("p_surface_series_id" "text", "p_model_id" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."list_my_article_summaries_v1"("p_limit" integer, "p_before_updated_at" timestamp with time zone, "p_before_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."list_my_article_summaries_v1"("p_limit" integer, "p_before_updated_at" timestamp with time zone, "p_before_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."list_my_experiment_summaries_v1"("p_limit" integer, "p_before_updated_at" timestamp with time zone, "p_before_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."list_my_experiment_summaries_v1"("p_limit" integer, "p_before_updated_at" timestamp with time zone, "p_before_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."list_my_snapshot_summaries_v1"("p_limit" integer, "p_before_created_at" timestamp with time zone, "p_before_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."list_my_snapshot_summaries_v1"("p_limit" integer, "p_before_created_at" timestamp with time zone, "p_before_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."list_public_article_summaries_v1"("p_limit" integer, "p_before_published_at" timestamp with time zone, "p_before_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."list_public_article_summaries_v1"("p_limit" integer, "p_before_published_at" timestamp with time zone, "p_before_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."list_public_article_summaries_v1"("p_limit" integer, "p_before_published_at" timestamp with time zone, "p_before_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."list_public_experiment_summaries_v1"("p_limit" integer, "p_before_published_at" timestamp with time zone, "p_before_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."list_public_experiment_summaries_v1"("p_limit" integer, "p_before_published_at" timestamp with time zone, "p_before_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."list_public_experiment_summaries_v1"("p_limit" integer, "p_before_published_at" timestamp with time zone, "p_before_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."publish_article_v1"("p_operation_id" "uuid", "p_article_id" "uuid", "p_expected_version" bigint, "p_public_slug" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."publish_article_v1"("p_operation_id" "uuid", "p_article_id" "uuid", "p_expected_version" bigint, "p_public_slug" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."publish_experiment_v1"("p_operation_id" "uuid", "p_experiment_id" "uuid", "p_expected_version" bigint, "p_snapshot_id" "uuid", "p_public_slug" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."publish_experiment_v1"("p_operation_id" "uuid", "p_experiment_id" "uuid", "p_expected_version" bigint, "p_snapshot_id" "uuid", "p_public_slug" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."read_article_v1"("p_article_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."read_article_v1"("p_article_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."read_article_v1"("p_article_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."read_experiment_snapshot_v1"("p_snapshot_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."read_experiment_snapshot_v1"("p_snapshot_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."read_experiment_snapshot_v1"("p_snapshot_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."read_my_experiment_v1"("p_experiment_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."read_my_experiment_v1"("p_experiment_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."read_public_article_v1"("p_public_slug" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."read_public_article_v1"("p_public_slug" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."read_public_article_v1"("p_public_slug" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."read_public_experiment_v1"("p_public_slug" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."read_public_experiment_v1"("p_public_slug" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."read_public_experiment_v1"("p_public_slug" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."register_model_release_succession_v1"("p_from_model_id" "text", "p_to_model_id" "text", "p_grade" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."register_model_release_succession_v1"("p_from_model_id" "text", "p_to_model_id" "text", "p_grade" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."register_model_release_v1"("p_model_id" "text", "p_model_family_id" "text", "p_display_name" "text", "p_manifest" "jsonb", "p_artifact_path" "text", "p_artifact_sha256" "text", "p_registry_fingerprint" "text", "p_source_commit" "text", "p_default_fixture" "jsonb", "p_analysis_profile_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."register_model_release_v1"("p_model_id" "text", "p_model_family_id" "text", "p_display_name" "text", "p_manifest" "jsonb", "p_artifact_path" "text", "p_artifact_sha256" "text", "p_registry_fingerprint" "text", "p_source_commit" "text", "p_default_fixture" "jsonb", "p_analysis_profile_id" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."register_model_surface_release_v1"("p_surface_release_id" "text", "p_surface_series_id" "text", "p_predecessor_surface_release_id" "text", "p_model_family_id" "text", "p_display_name" "text", "p_manifest" "jsonb", "p_source_commit" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."register_model_surface_release_v1"("p_surface_release_id" "text", "p_surface_series_id" "text", "p_predecessor_surface_release_id" "text", "p_model_family_id" "text", "p_display_name" "text", "p_manifest" "jsonb", "p_source_commit" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."save_article_v1"("p_operation_id" "uuid", "p_article_id" "uuid", "p_expected_version" bigint, "p_locale" "text", "p_title" "text", "p_blocks" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."save_article_v1"("p_operation_id" "uuid", "p_article_id" "uuid", "p_expected_version" bigint, "p_locale" "text", "p_title" "text", "p_blocks" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."save_experiment_v1"("p_operation_id" "uuid", "p_experiment_id" "uuid", "p_expected_version" bigint, "p_title" "text", "p_model_id" "text", "p_content" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."save_experiment_v1"("p_operation_id" "uuid", "p_experiment_id" "uuid", "p_expected_version" bigint, "p_title" "text", "p_model_id" "text", "p_content" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "public"."set_active_model_bundle_v1"("p_expected_version" bigint, "p_model_id" "text", "p_surface_release_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_active_model_bundle_v1"("p_expected_version" bigint, "p_model_id" "text", "p_surface_release_id" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_model_release_stage_v1"("p_model_id" "text", "p_stage" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_model_release_stage_v1"("p_model_id" "text", "p_stage" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_model_surface_release_stage_v1"("p_surface_release_id" "text", "p_stage" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_model_surface_release_stage_v1"("p_surface_release_id" "text", "p_stage" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."unpublish_article_v1"("p_operation_id" "uuid", "p_article_id" "uuid", "p_expected_version" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."unpublish_article_v1"("p_operation_id" "uuid", "p_article_id" "uuid", "p_expected_version" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."unpublish_experiment_v1"("p_operation_id" "uuid", "p_experiment_id" "uuid", "p_expected_version" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."unpublish_experiment_v1"("p_operation_id" "uuid", "p_experiment_id" "uuid", "p_expected_version" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "studio"."begin_operation_v1"("p_actor_id" "uuid", "p_operation_id" "uuid", "p_operation_kind" "text", "p_request" "jsonb") FROM PUBLIC;



REVOKE ALL ON FUNCTION "studio"."can_read_snapshot_v1"("p_actor_id" "uuid", "p_snapshot_id" "uuid") FROM PUBLIC;



REVOKE ALL ON FUNCTION "studio"."enforce_anonymous_mutation_quota_v1"("p_actor_id" "uuid") FROM PUBLIC;



REVOKE ALL ON FUNCTION "studio"."enforce_anonymous_storage_quota_v1"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "studio"."finish_operation_v1"("p_actor_id" "uuid", "p_operation_id" "uuid", "p_result" "jsonb") FROM PUBLIC;



REVOKE ALL ON FUNCTION "studio"."gc_unreferenced_content_v1"("p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "studio"."gc_unreferenced_content_v1"("p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "studio"."operation_request_fingerprint_v1"("p_operation_kind" "text", "p_request" "jsonb") FROM PUBLIC;



REVOKE ALL ON FUNCTION "studio"."operation_result_receipt_v1"("p_operation_kind" "text", "p_result" "jsonb") FROM PUBLIC;



REVOKE ALL ON FUNCTION "studio"."owns_snapshot_v1"("p_actor_id" "uuid", "p_snapshot_id" "uuid") FROM PUBLIC;



REVOKE ALL ON FUNCTION "studio"."project_article_snapshot_refs_v1"("p_article_content_id" "uuid", "p_actor_id" "uuid", "p_blocks" "jsonb") FROM PUBLIC;
























GRANT ALL ON TABLE "studio"."active_model_bundle" TO "service_role";



GRANT ALL ON TABLE "studio"."article_contents" TO "service_role";



GRANT ALL ON TABLE "studio"."article_publications" TO "service_role";



GRANT ALL ON TABLE "studio"."article_snapshot_refs" TO "service_role";



GRANT ALL ON TABLE "studio"."articles" TO "service_role";



GRANT ALL ON TABLE "studio"."experiment_contents" TO "service_role";



GRANT ALL ON TABLE "studio"."experiment_publications" TO "service_role";



GRANT ALL ON TABLE "studio"."experiment_snapshot_retention" TO "service_role";



GRANT ALL ON TABLE "studio"."experiment_snapshot_sources" TO "service_role";



GRANT ALL ON TABLE "studio"."experiment_snapshots" TO "service_role";



GRANT ALL ON TABLE "studio"."experiments" TO "service_role";



GRANT ALL ON TABLE "studio"."model_release_availability" TO "service_role";



GRANT ALL ON TABLE "studio"."model_release_successions" TO "service_role";



GRANT ALL ON TABLE "studio"."model_releases" TO "service_role";



GRANT ALL ON TABLE "studio"."model_surface_release_availability" TO "service_role";



GRANT ALL ON TABLE "studio"."model_surface_releases" TO "service_role";



GRANT ALL ON TABLE "studio"."operation_receipts" TO "service_role";



GRANT ALL ON TABLE "studio"."profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT UPDATE ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT UPDATE ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT UPDATE ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "service_role";
































--
-- Dumped schema changes for auth and storage
--

CREATE OR REPLACE TRIGGER "on_auth_user_created_create_studio_profile" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "studio"."handle_auth_user_created_v1"();
