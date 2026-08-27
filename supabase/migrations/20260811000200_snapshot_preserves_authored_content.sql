-- A Snapshot may update checkpoints, but it stays on the saved Experiment's
-- exact model, authored Surface series, presentation, scenarios, and fixtures.

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
