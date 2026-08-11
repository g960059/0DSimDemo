# AI-assisted Studio authoring

This CLI is a machine-oriented seam for Codex, Claude Code and comparable
local assistants. Clinicians continue to use the visual Experiment Session and
Article Editor. The CLI drives the same user-owned Supabase drafts, exact model
contracts, immutable Snapshots, Briefings and publication RPCs.

It is deliberately not a second content system and does not use a service-role
credential. Every write runs as the signed-in author under RLS and optimistic
concurrency.

## Authentication

The normal local workflow uses Google OAuth with PKCE. Add this exact redirect
URL to the Supabase Auth allow list:

```text
http://127.0.0.1:43921/auth/callback
```

First login:

```sh
export CIRCLEHEART_SUPABASE_URL="https://PROJECT.supabase.co"
export CIRCLEHEART_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
npm --silent run author:login -- --profile official
```

The profile stores only project metadata and user identity. Its rotating
refresh token is stored in macOS Keychain under
`dev.circleheart.authoring.refresh-token.v1`; access tokens remain in memory
and are never printed. Commands serialize refresh-token restoration per
profile so concurrent assistant processes cannot race token rotation.

```sh
npm --silent run author:status -- --profile official
npm --silent run author:logout -- --profile official
```

Auth commands use the same machine-I/O discipline as content commands: exactly
one JSON object is written to stdout and progress is written to stderr. Success
uses `circleheart-studio-authoring-auth-result-v1` with `ok:true`; failure uses
`circleheart-studio-authoring-auth-error-v1` with `ok:false` plus stable
`error.code`, `category`, `retryable`, and `recovery` fields. Assistants must
follow those fields rather than parsing human-readable messages.

`--profile` defaults to `default`. Separate profiles are useful for separate
users or projects, but an “official account” is not a privileged credential;
publication authority remains a backend role/RLS decision.

The optional headless access/refresh-token pair is supported for explicitly
managed automation. Both values are required together and are never
persisted. The access JWT must have at least fifteen minutes remaining; the CLI
fails before `setSession` instead of rotating and then losing a one-time
refresh token. The external token manager owns renewal and must provide a
fresh pair. Service-role keys, secret keys and legacy service-role JWTs are
rejected; only an `sb_publishable_` key may configure the CLI.

## Machine discovery and envelopes

Assistants should discover the current protocol instead of copying examples:

```sh
npm --silent run author:content -- --describe
```

The discovery document includes strict nested JSON Schemas for command inputs,
preview plans, Scenario operations, Article blocks, result envelopes and error
recovery fields. Treat it as the executable contract; examples in this README
are explanatory only.

For execution:

```sh
npm --silent run author:content -- \
  --profile official \
  --command /absolute/path/to/command.json
```

Use `npm --silent`: npm's own banner is otherwise mixed into stdout. The CLI
process itself writes exactly one JSON object to stdout. Progress and
diagnostics go to stderr. Success and failure envelopes include `commandId`
and `action`; failures additionally expose a stable category, retryability and
whether the commit state is known.

`error.category`, `error.commitState` and `error.recovery` are the recovery
authority for assistants. In particular, `commitState:"confirmed"` means read
the target state and never repeat the mutation; `unknown` means call
`operation.read` with the same `commandId` before retrying the byte-identical
command. Do not infer recovery behavior from human-readable `message` text.

Every command file has this outer shape:

```json
{
  "schemaId": "circleheart-studio-authoring-command-v1",
  "commandId": "3a3dd8a7-d8ad-48d4-9e23-6826c8a9fb6e",
  "action": "experiment.list",
  "input": { "cursor": null, "limit": 50 }
}
```

List actions return `nextCursor`. Pass that object unchanged as the next
command's `input.cursor`; use `null` for the first page. Assistants must page
until `nextCursor` is `null` rather than assuming the first 100 rows are the
complete authoring inventory.

Do not place credentials in command files.

## Numerical Experiment workflow

Numerical mutation is a two-step protocol:

1. `model.describe` discovers controls, outputs, graphs and exact identity.
2. `experiment.preview` runs an ephemeral simulation and returns the exact
   model/Surface pin, a SHA-256 apply plan, explicit Scenario diff and selected
   output observations.
3. The assistant reviews the diff and observations.
4. `experiment.apply` submits that exact returned plan. It reruns from the
   same exact pins and uses CAS when updating a saved Experiment.
5. `snapshot.seal` seals the saved head at its stored accepted checkpoint. It
   never performs a hidden time advance.
6. `article.briefing.place` projects selected graphs, outputs and controls from
   that immutable Snapshot into an Article.

Scenario changes are explicit operations:

```text
add     { scenarioId, label, sourceScenarioId, controls[] }
update  { scenarioId, label|null, controls[] }
remove  { scenarioId }
```

Omitting a saved Scenario means “preserve its fixture and checkpoint”, not
“delete it”. Only a newly added Scenario or an update with control assignments
advances numerically during apply; a label-only edit does not retime it. The
preview diff exposes these as `advancedScenarioIds`. Controls are absolute
semantic assignments. A new Scenario may start from the exact release default
fixture or clone one saved Scenario checkpoint as a warm start.

Every preview supplies a bounded execution budget:

```text
advanceSeconds        simulated time to run before capture
maxPresentationSteps  deterministic work ceiling
wallClockTimeoutMs    process-time ceiling
```

The current CLI intentionally executes only the reviewed Standard artifact
checked into the installed CircleHeart source tree. Registry manifests and
Surface releases are still matched exactly. A future multi-model CLI must run
downloaded executable artifacts inside a tokenless, permission-restricted
subprocess before historical/dynamic model execution is enabled.

## Article workflow

`article.save` creates or replaces a complete portable block draft.
`article.blocks.patch` is preferred for assistant revisions: it applies
explicit `replace`, `insert-after` or `remove` operations to named block IDs
without resending unrelated content. `article.briefing.place` uses explicit
placement targets (`replace`, `insert-after`, `append`) and deterministic IDs
derived from `commandId`: `placement/authoring/<commandId>` and
`block/authoring/<commandId>`. These IDs remain recoverable even when an exact
retry returns only the compact authority receipt.

Supported block kinds are `paragraph`, `heading`, `equation`, `image`,
`divider`, `accordion`, `quiz`, `link` and `experiment`. Equations store
display TeX. Accordions contain portable heading, paragraph, equation, image,
divider, quiz and link blocks; nested accordions and hidden live Experiments
are intentionally rejected. Quizzes are single-answer, Reader-local formative
checks whose response state is never persisted. Link blocks accept app-relative
paths for another Article or series start, immutable HTTPS destinations, and
loopback HTTP only during local development. Saved or published images should
reference immutable HTTPS assets. Empty image/link destinations are allowed
while drafting; local file paths, protocol-relative URLs and data URLs are
rejected.

## Action inventory

Read/discovery:

```text
experiment.list       experiment.read
snapshot.list         snapshot.read
article.list          article.read
operation.read        model.describe
experiment.preview
```

Mutations:

```text
experiment.apply
experiment.presentation.save
snapshot.seal
article.briefing.place
article.blocks.patch
experiment.publish
article.save
article.publish
```

Publication is always a separate explicit action. Preview, apply, Snapshot
seal and Briefing never publish content.

## Retry protocol

Reuse the same UUID only when retrying the same mutation after an uncertain
transport response. Before any work, the backend durably binds that UUID
to the canonical command SHA-256 for a minimum 30-day replay window. The normal
operation receipt is retained for 24 hours, while the binding keeps the compact
committed result so an identical retry remains replayable after receipt GC.
Unrelated history older than 30 days is lazily expired when a new command is
claimed, avoiding a lifetime account lock. Before recomputing an expensive
mutation, the CLI claims that binding and reads its actor-scoped result:

- `committed`: return the compact durable result without repeating work;
- `running`: stop and query `operation.read`;
- absent: execute the command.

Never reuse one `commandId` for a different semantic request. For a new
decision, mint a new UUID. Reusing it with another action or payload fails
closed throughout the retained replay window. If recovery is attempted after
30 days, read authority state before deciding whether any new mutation is
needed.

## Trust boundary

RLS, ownership, CAS, immutable exact pins and publication constraints are
backend authority. Numerical admission in this CLI is the same first-party
quality gate used by the product client; it prevents ordinary product code
from persisting a raw unchecked Snapshot, but it is not a cryptographic proof
against a hostile authenticated client calling Supabase directly.

A future “server verified” claim requires a trusted Cloud Run/Edge admission
service and a signed receipt. Until then, UI/Article limitations must describe
Snapshots as numerical simulation artifacts rather than clinically validated
or server-certified results.

Large search, fitting and V&V loops should eventually use a separate
non-persistent `study.run` protocol. Optimizer trials must not become durable
Experiments; only an explicitly selected candidate crosses preview/apply/seal.
