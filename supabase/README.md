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
- mutable availability and default-channel pointers;
- idempotent service-role registration;
- same-`modelId`/different-contract rejection; and
- a hash-free client channel lookup.

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

The database quota limits storage amplification by one anonymous identity. It
does not replace Supabase Auth's IP-based anonymous-sign-in limit or production
CAPTCHA/Turnstile.

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
get_model_release_channel_v1
get_model_release_v1
read_public_experiment_v1
read_public_article_v1
read_experiment_snapshot_v1
list_my_experiments_v1
read_my_experiment_v1
list_my_experiment_snapshots_v1
list_my_articles_v1
read_article_v1
list_public_experiments_v1
list_public_articles_v1
```

A Snapshot is readable by its owner, through the current public Experiment
pointer, or through a published Article content reference. Private draft
Article references do not make a Snapshot public.

## Retention and scheduled GC

Newly committed Snapshots receive a short grace period. Publication retains
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

CI builds the deterministic model artifact and verifies the repository lock
before calling `register_model_release_v1` with service-role authority. If the
manifest or bytes change, CI must assign a new exact `modelId`; registry
registration rejects rebinding an existing ID.

After the exact release files are committed, a maintainer with an authenticated
Supabase CLI session publishes the artifact and registry row without exposing a
secret to the browser or shell output:

```bash
npm run publish:registry:main-wire-v3 -- --project-ref <project-ref>
```

After registration, a trusted release process may move a channel such as
`development` or `stable` using `set_model_release_channel_v1`. Ordinary
clients resolve the channel, then pin the returned exact `modelId` in every new
ExperimentSession. Existing content never follows the channel.

## Deferred work

- configure production email delivery and Google OAuth credentials;
- enable production CAPTCHA/Turnstile for anonymous sign-in;
- add the multi-release browser/Worker loader for historical exact models;
- define retention for abandoned anonymous identities after account-linking UX
  is complete; and
- introduce Cloud Run Jobs only for patient fitting or expensive batch work.

Realtime numerical frames, ordinary simulation stepping, CRDT editing, and
patient data are outside this release spine.
