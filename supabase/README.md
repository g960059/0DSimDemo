# CircleHeart Supabase boundary

Supabase is the durable trust and publication spine. Interactive numerical
execution remains in browser Workers.

Source migrations, generated types, configuration, and tests own current
tables, RPC names, quotas, schedules, and operational commands.

## Owned responsibilities

Supabase owns:

- authentication and identity linking;
- immutable exact-model and Model-Surface registry records, certified
  artifact-revision bindings, and the immutable analysis-profile ID attached
  to each model-release row;
- private Experiment and Article ownership;
- immutable Snapshot and Article-content storage;
- public pointers and anonymous read authorization;
- idempotent semantic mutations with optimistic concurrency; and
- bounded collection of unreachable immutable content.

It does not own equations, solver execution, runtime settlement, or clinical
validation.

## Client trust boundary

Browser and authoring clients use a publishable key and have no direct table
write authority. Durable mutations pass through versioned semantic RPCs under
RLS. Service-role credentials must never enter browser configuration, command
payloads, logs, or repository files.

Each mutation identity binds one canonical request. Replaying that request may
return its committed result; reusing the identity for another request fails
closed. Mutable resources also require their expected version so a stale
client cannot overwrite a newer authoring head.

Snapshot persistence accepts the output of first-party numerical admission but
does not independently rerun or certify the numerical model. This protects the
ordinary product path, not against a hostile authenticated client. A future
server-verified scientific claim requires a separate trusted execution and
signed-receipt boundary.

## Content and reference lifecycle

Experiments are mutable private heads. Snapshots and Article content revisions
are immutable. Article Placements reference neutral Snapshots; the database
derives reference ownership from validated Article blocks rather than trusting
a second caller-supplied reference list.

A Snapshot is readable by its owner or through an authorized published
Experiment/Article reference. Draft references do not make it public.
Unpublish and soft delete release pointers; garbage collection may remove only
unreachable content after its handoff and retention boundaries.

Anonymous visitors do not need an account merely to read or fork. Saving
private work requires an authenticated identity. Publication requires a
non-anonymous account and never follows automatically from Save, Snapshot
admission, or Article placement.

## Release identity

A changed exact scientific manifest requires a new immutable `modelId`.
Changed artifact bytes may remain under one `modelId` only through the
repository's predecessor-bound, byte-exact frame and checkpoint equivalence
path. Presentation, Auth, storage, Article, and hosting releases do not by
themselves change exact numerical identity.

Display name, launch fixture, and analysis-profile ID are immutable launch
metadata on the current model-release row, not fields in the scientific
identity digest. The current registration API rejects rebinding them under the
same `modelId`.

Analysis method/profile definitions and catalogs are source-owned; the
database stores only the profile ID selected by a model-release row.

Display/default changes ultimately belong in a separately versioned metadata
layer. A changed analysis implementation requires a new immutable profile ID;
because durable content does not yet pin that profile independently, the
current publication path also requires another model release. Historical rows
must not be mutated to emulate either transition. The fuller ownership model
is in
[DESIGN-STUDIO-006](../docs/studio/DESIGN-STUDIO-006-model-surface-release-and-model-lab.md).

Active-bundle replacement affects only new Sessions. Existing Experiments and
Snapshots retain their stored exact-model and Surface pins and must never
follow a later launch target.

## Migration and rollout boundary

Checked-in migrations are the ordered database source of truth. Once a project
contains user data, schema evolution is forward-only: never squash, rewrite,
or repair applied history in place.

A disposable pre-release project with no user content may be reset from the
checked-in migration sequence after its emptiness is verified. This exception
does not apply to a project containing Auth identities or authored/published
content.

Registry publication and active-bundle activation are separate trusted
operations. Registering a new model/Surface identity never changes the active
bundle. A certified artifact-revision rebind may update the implementation
resolved beneath the same active `modelId`, but only through its separate
equivalence and compare-and-swap authority. Changing the active model/Surface
pair remains an explicit compare-and-swap operation.
