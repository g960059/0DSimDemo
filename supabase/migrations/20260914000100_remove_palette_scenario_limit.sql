begin;

-- Scenario count is independent of the graph palette. Keep the existing
-- shape/identity checks and the separate content byte/storage ceilings.
alter table studio.experiment_contents
  drop constraint experiment_contents_object,
  add constraint experiment_contents_object check (
    jsonb_typeof(content) = 'object'
    and content ->> 'modelId' = model_id
    and jsonb_typeof(content -> 'scenarios') = 'array'
    and jsonb_array_length(content -> 'scenarios') >= 1
    and jsonb_typeof(content -> 'surface') = 'object'
  );

commit;
