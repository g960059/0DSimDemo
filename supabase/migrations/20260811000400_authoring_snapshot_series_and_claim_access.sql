-- Keep Snapshot lineage on the saved Experiment's authored Surface series and
-- expose permanent AI command bindings only to signed-in authors.

create or replace function studio.snapshot_preserves_authored_content_v1(
  p_saved jsonb,
  p_candidate jsonb
) returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  scenario_count integer;
begin
  if p_saved ->> 'modelId' is distinct from p_candidate ->> 'modelId'
    or p_saved ->> 'surfaceSeriesId'
      is distinct from p_candidate ->> 'surfaceSeriesId'
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

revoke all on function public.claim_my_authoring_command_v1(uuid, text, text)
  from public;
revoke all on function public.claim_my_authoring_command_v1(uuid, text, text)
  from anon;
grant execute on function public.claim_my_authoring_command_v1(uuid, text, text)
  to authenticated;
grant execute on function public.claim_my_authoring_command_v1(uuid, text, text)
  to service_role;
