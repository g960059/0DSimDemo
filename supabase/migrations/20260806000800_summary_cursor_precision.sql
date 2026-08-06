begin;

-- PostgreSQL timestamps retain microseconds. The first summary-page release
-- serialized cursors with only milliseconds, which could skip a row whose
-- sort timestamp fell later in the same millisecond as the previous page's
-- final row. Preserve the complete database timestamp in every summary
-- response. Rebuilding from pg_get_functiondef keeps this corrective
-- migration focused on serialization and fails closed if the preceding
-- release no longer has the expected format contract.
do $migration$
declare
  function_signature regprocedure;
  function_definition text;
  corrected_definition text;
begin
  foreach function_signature in array array[
    'public.list_my_experiment_summaries_v1(integer,timestamptz,uuid)'::regprocedure,
    'public.list_my_snapshot_summaries_v1(integer,timestamptz,uuid)'::regprocedure,
    'public.list_my_article_summaries_v1(integer,timestamptz,uuid)'::regprocedure,
    'public.list_public_experiment_summaries_v1(integer,timestamptz,uuid)'::regprocedure,
    'public.list_public_article_summaries_v1(integer,timestamptz,uuid)'::regprocedure
  ]
  loop
    function_definition := pg_catalog.pg_get_functiondef(
      function_signature::oid
    );
    corrected_definition := pg_catalog.replace(
      function_definition,
      'SS.MS"Z"',
      'SS.US"Z"'
    );
    if corrected_definition is not distinct from function_definition then
      raise exception 'Summary function % has no millisecond timestamp contract to upgrade',
        function_signature
        using errcode = '55000';
    end if;
    execute corrected_definition;
  end loop;
end;
$migration$;

commit;
