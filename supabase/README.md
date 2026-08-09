# CircleHeart Supabase release spine

This directory is the reviewed backend foundation for CircleHeart. It is
intentionally not linked to a remote project in source control.

The first cut keeps interactive numerical execution in browser Web Workers and
uses Supabase only for:

- Auth and identity linking;
- exact-model release lookup;
- private Experiment and Article ownership;
- immutable Snapshot/content storage;
- public pointers and Reader access;
- idempotent semantic writes; and
- bounded garbage collection.

## Production topology

`circleheart.dev` is the production product domain. Squarespace remains the DNS
manager and the application is served by Firebase Hosting. The current Hosting
configuration redirects the apex domain to the canonical browser origin
`https://www.circleheart.dev`. Firebase is only the static Vite/SPA delivery
layer; Firestore, Firebase Auth, and Firebase Storage are not part of the new
architecture.

```text
circleheart.dev / www.circleheart.dev (Squarespace-managed DNS)
  -> Firebase Hosting (dist + SPA rewrite)
  -> Browser Web Workers (interactive simulation)
  -> Supabase (Auth + Postgres + model artifact Storage)
```

The checked-in `firebase.json` deliberately contains Hosting only. Hashed Vite
assets are cached immutably, while `index.html` is revalidated so a new release
can move the application shell without stale route code.

## Local setup

Docker Desktop must be running.

```bash
supabase start
supabase db reset
supabase db lint --local
```

The repository currently carries no remote project ref. Link only the intended
CircleHeart project after reviewing the migration diff:

```bash
supabase link --project-ref <circleheart-project-ref>
supabase db push --dry-run
supabase db push
```

Never link or push these migrations to an unrelated existing project.

For a configured browser build, copy `.env.example` to an ignored
`.env.local` and provide only the project URL and publishable key. Database
passwords, secret keys, and CLI access tokens must never enter Vite variables.

## Migrations

### `20260806000100_model_release_spine.sql`

Creates the private exact-model registry:

- immutable `studio.model_releases`;
- mutable release availability;
- idempotent service-role registration;
- same-`modelId`/different-contract rejection; and
- a hash-free exact-release client lookup.

Artifact SHA-256 and registry fingerprint are registry/CI metadata. Studio
domain objects and ordinary clients use only the exact `modelId`.

### `20260806000200_content_release_spine.sql`

Creates:

- profiles and idempotency receipts;
- immutable Experiment and Article content rows;
- mutable Experiment and Article resource heads;
- neutral immutable Experiment Snapshots;
- backend-only saved-Experiment Snapshot provenance;
- Experiment and Article publication pointers;
- Article-owned Placement/Briefing reference projection; and
- bounded unreferenced-content GC.

The portable `ExperimentSnapshot` is materialized from `experiment_contents`.
`content_id`, the `experiment_snapshot_sources` provenance relation, and
retention rows are backend concerns
and are not returned as domain identity.

### `20260806000300_content_read_api.sql`

Adds authenticated owner reads for Experiments, Snapshots, and Articles plus
public Experiment/Article catalog reads. Snapshot authorization remains
reference-based: owner access, current public Experiment publication, or a
published Article Placement.

### `20260806000400_model_release_storage.sql`

Creates the public, read-only-to-clients `model-releases` bucket for exact
executable modules. Upload and registry registration remain trusted release
operations; clients receive no object-write policy.

### `20260806000500_content_operations.sql`

Adds the production operating boundary around semantic writes:

- anonymous accounts may perform at most 60 mutations per minute and 600 per
  rolling 24 hours;
- idempotent replay is checked before quota consumption;
- same-account quota checks are serialized to prevent concurrent bypass; and
- Supabase Cron calls bounded content GC every 15 minutes.

The mutation quota limits write-rate amplification by one anonymous identity.
It does not replace Supabase Auth's IP-based anonymous-sign-in limit or
production CAPTCHA/Turnstile.

### `20260806000600_content_bounds_and_receipts.sql`

Hardens immutable storage and response-loss recovery:

- operation receipts store payload digests and compact identity responses;
- the browser may safely replay the same operation UUID after a lost response;
- Experiment/Article JSON has explicit byte ceilings;
- anonymous identities have row and aggregate-byte storage quotas;
- new unreferenced Snapshot handoffs retain a 24-hour recovery window; and
- operation receipts expire after 24 hours.

### `20260806000700_content_summary_pages.sql`

Replaces the pre-release unbounded list transports with cursor-paginated
summary pages. Experiment, Snapshot, and Article lists contain titles, counts,
timestamps, publication pointers, and model identity only; fixture,
checkpoint, Surface, and Article blocks are loaded solely through the existing
detail reads when a user opens or selects one item.

### `20260806000800_summary_cursor_precision.sql`

Preserves PostgreSQL microsecond precision in summary continuation cursors so
updates within one millisecond cannot be skipped between pages.

### `20260809000100_active_model_bundle.sql`

Removes the transitional generic model/Surface channel tables and RPCs, then
adds one atomic singleton launch pointer:

- one stable, loadable Standard-ABI exact `modelId` plus one stable compatible
  `surfaceReleaseId`;
- compare-and-swap replacement with a monotonic bundle version;
- one public read returning both immutable manifests coherently; and
- retirement guards requiring the active pair to be replaced first.

Mutable content resolves a Surface by series lineage rather than timestamp.
Stable/retired exact models see stable Surfaces only; dev exact models may
reopen dev Surface successors without leaking those definitions into ordinary
stable content.

The older channel objects remain visible only in migration history so an
already-linked pre-release project can upgrade deterministically; they do not
exist in the resulting schema.

## Auth policy

Supported product flows are:

- anonymous visitor: no account is created merely by opening or forking;
- first backend Save: sign in anonymously, then perform the semantic Save RPC;
- retained private work: available to that anonymous account;
- account upgrade: link magic-link email or Google identity to the same user;
- Publish: rejected while the JWT is anonymous; and
- passwords: not offered by the product.

Local email sign-in is enabled. Google remains disabled in `config.toml`
because production client credentials belong in Supabase secrets/Dashboard,
not source control.

The production Supabase Site URL is the final canonical origin
`https://www.circleheart.dev`; both apex and `www` remain allow-listed.
Localhost and loopback redirects remain explicitly allow-listed for
development; the client always supplies its current origin as `redirectTo`.

## Write boundary

Clients have no direct table write grants. They call versioned RPCs:

```text
save_experiment_v1
commit_admitted_experiment_snapshot_v1
publish_experiment_v1
unpublish_experiment_v1
delete_experiment_v1
save_article_v1
publish_article_v1
unpublish_article_v1
delete_article_v1
```

Each mutation receives a caller-generated UUID `operation_id`. Repeating the
same operation and canonical request returns its committed result. Reusing the
ID with different input is rejected. Mutable resources additionally require an
expected version.

The browser retains an unacknowledged operation ID for the exact semantic
request for 24 hours, including in same-tab session storage, so a response-loss
retry cannot create a second immutable revision. Database receipts keep
SHA-256 request fingerprints and compact identity results rather than copying
Experiment/Article/Snapshot JSON. Experiment content is capped at 8 MiB,
Article content at 2 MiB, and anonymous identities have bounded row and 64 MiB
immutable-storage quotas in addition to mutation-rate limits.

`commit_admitted_experiment_snapshot_v1` is a persistence boundary, not a
numerical verifier. The browser must first receive the sealed result of the
exact model's common Snapshot admission Worker. This protects ordinary product
flows; it is not a cryptographic proof against a malicious modified client.

For standalone publication, the commit includes saved Experiment identity and
expected version. The database verifies that model, Surface, Scenario order,
labels, and fixtures still match the clean saved head; only captured
checkpoints may be newer. Session-origin Article capture omits that source.

Article Save accepts `blocks` once. Experiment Placement references and
Briefing are projected by the database from those blocks into
`article_snapshot_refs`; callers cannot provide a second divergent list.

## Read boundary

Public reads use:

```text
get_active_model_bundle_v1
get_model_release_v1
get_model_release_v2
get_model_release_v3
get_model_surface_release_v1
get_model_surface_series_latest_v1
read_public_experiment_v1
read_public_article_v1
read_experiment_snapshot_v1
list_my_experiment_summaries_v1
read_my_experiment_v1
list_my_snapshot_summaries_v1
list_my_article_summaries_v1
read_article_v1
list_public_experiment_summaries_v1
list_public_article_summaries_v1
```

A Snapshot is readable by its owner, through the current public Experiment
pointer, or through a published Article content reference. Private draft
Article references do not make a Snapshot public.

Summary calls accept a bounded page size and stable `(timestamp, id)` cursor.
They never return complete numerical state; detail RPCs remain reference- and
ownership-authorized independently.

## Retention and scheduled GC

Newly committed Snapshots receive a 24-hour handoff grace period. Publication retains
them explicitly; Article references retain them relationally. Unpublish and
soft delete release those pointers; deleted roots and otherwise unreachable
immutable content are eligible for physical collection after one hour. A
scheduled service-role job calls:

```sql
select studio.gc_unreferenced_content_v1(500);
```

The function removes only bounded batches of expired soft-deleted roots,
unreferenced Snapshots, unreachable immutable content, and expired idempotency
receipts. `20260806000500_content_operations.sql` registers the production
Supabase Cron job at a 15-minute interval; job history is available in
`cron.job_run_details`.

## Release registration

CI builds the deterministic **numerical execution** artifact and verifies its
repository lock before calling `register_model_release_v2` with service-role
authority. If that contract or those bytes change, CI must assign a new exact
`modelId`; registry registration rejects rebinding an existing ID. Studio
admission policy, presentation catalogs, UI, Auth, database, Article, and
hosting releases are versioned separately and must not churn `modelId`.

The currently registered `development-36` artifact is the final transitional
bundle whose lock still includes Snapshot admission. It changed from 35
because admission semantics changed in the same commit, not because Supabase
was introduced. Keep 36 immutable; split the package boundary before minting
the next numerical model release.

V2 registration adds immutable loader metadata: module ABI, default fixture,
and an analysis-profile ID. Public V2 reads return those values with the
manifest and public Storage path, but continue to hide artifact SHA,
fingerprint, and source commit. `development-36` is backfilled with its legacy
ABI without changing its artifact, repository lock, or modelId. Future exact
artifacts use `circleheart-exact-model-esm-v1` and export
`createCircleHeartExactModelReleaseV1() -> { manifest, executables }`.
Registry metadata is the sole authority for the default fixture. Analysis
profile IDs are immutable; changed analysis semantics require another profile
ID rather than rebinding an existing release.

After the exact release and Surface files are committed, a maintainer with an
authenticated Supabase CLI session publishes immutable registry rows without
exposing a secret to the browser or shell output:

```bash
npm run publish:registry:main-wire-v3 -- \
  --project-ref <project-ref> --stage <dev|stable>

npm run publish:registry:model-surface -- \
  --project-ref <project-ref> --manifest <surface.json> \
  --stage <dev|stable>
```

Registration never changes the ordinary launch target. After both rows are
stable and compatible, a trusted operator replaces the singleton active bundle
with an explicit compare-and-swap:

```bash
npm run activate:registry:model-bundle -- \
  --project-ref <project-ref> --model-id <modelId> \
  --surface-release-id <surfaceReleaseId> \
  --expected-version <none|integer>
```

New Experiment Sessions resolve that exact model/Surface pair atomically and
then pin it. Existing content keeps its stored exact model and Surface pins;
it never follows later active-bundle replacements.

## Deferred work

- configure production email delivery and Google OAuth credentials;
- enable production CAPTCHA/Turnstile for anonymous sign-in;
- exercise retained historical loading when the first standard-ABI successor
  to `development-36` is registered;
- verify Worker Blob ESM import and Storage CORS in WebKit and real Safari/iOS
  Safari before public deployment;
- keep immutable artifacts write/delete restricted, forbid path reuse, audit
  registry digests server-side, and retain an independently restorable mirror;
- define retention for abandoned anonymous identities after account-linking UX
  is complete; and
- introduce Cloud Run Jobs only for patient fitting or expensive batch work.

Realtime numerical frames, ordinary simulation stepping, CRDT editing, and
patient data are outside this release spine.
