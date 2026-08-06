begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'model-releases',
  'model-releases',
  true,
  10485760,
  array['application/javascript', 'text/javascript']
) on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

comment on table studio.model_releases is
  'Immutable exact-model registry rows. Public executable bytes live in the model-releases Storage bucket; registration and upload remain service-only release operations.';

commit;
