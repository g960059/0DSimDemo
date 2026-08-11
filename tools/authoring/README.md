# Studio authoring commands

This CLI lets a local AI or developer repeat ordinary Studio content actions.
It uses the same Supabase user authority, CAS versions, model-aware validation,
Snapshot admission boundary and publication RPCs as the product UI.

It is not a numerical back door. Scenario mutation, parameter fitting and
Snapshot capture stay in the Experiment Session until a real repeated workflow
defines their execution-host contract.

## Authentication

The normal local workflow uses Google OAuth with PKCE. Add this exact URL to
the Supabase Auth redirect allow list once:

```text
http://127.0.0.1:43921/auth/callback
```

For the first login, provide the project URL and publishable key to the local
process, then sign in with the same Google account used by the web product:

```sh
export CIRCLEHEART_SUPABASE_URL="https://PROJECT.supabase.co"
export CIRCLEHEART_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
npm run author:login -- --profile official
```

The project metadata and user identity are saved as a non-secret local profile.
The only durable credential, the rotating Supabase refresh token, is stored in
macOS Keychain under `dev.circleheart.authoring.refresh-token.v1`. Access tokens
are kept in memory only and tokens are never printed. Subsequent commands do
not need exported project variables:

```sh
npm run author:status -- --profile official
npm run author:logout -- --profile official
```

`status` refreshes the Supabase session and safely persists the rotated token.
`logout` attempts to revoke that CLI session at Supabase, then removes the
local Keychain credential even if the network is unavailable. It does not sign
the separate browser session out.

`--profile` defaults to `default`. Profiles allow deliberately separate local
identities or projects without making a second Google account mandatory.
Authorization to publish remains a backend role/RLS decision rather than a
property of the local credential.

Like other developer CLIs, this Keychain use provides encrypted-at-rest
storage for the current macOS user; it is not an app-exclusive enclave against
other processes already running as that user.

Use `--no-open` with `author:login` to print the OAuth URL without launching a
browser. `CIRCLEHEART_AUTHOR_CONFIG_HOME` may override the non-secret profile
directory for isolated development or tests.

For CI or an explicitly managed headless process, the existing token-pair
override remains available:

```sh
export CIRCLEHEART_SUPABASE_URL="https://PROJECT.supabase.co"
export CIRCLEHEART_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
export CIRCLEHEART_AUTHOR_ACCESS_TOKEN="..."
export CIRCLEHEART_AUTHOR_REFRESH_TOKEN="..."
```

Both token values are required together and are not persisted. The project URL
and publishable key are also required unless the selected saved profile already
supplies them. Never put credentials in a command file. Service-role/secret
keys and legacy service-role JWTs are rejected; only an `sb_publishable_` key
may configure this user-authorized CLI.

Run one command at a time for a given profile. A future long-lived local MCP
adapter must reuse this credential provider and serialize refresh-token
rotation per profile before it introduces concurrent requests.

## Run

```sh
npm run author:content -- \
  --profile official \
  --command /absolute/path/to/command.json
```

Each file has exactly this envelope:

```json
{
  "schemaId": "circleheart-studio-authoring-command-v1",
  "commandId": "3a3dd8a7-d8ad-48d4-9e23-6826c8a9fb6e",
  "action": "experiment.list",
  "input": { "limit": 50 }
}
```

Reuse the same UUID when retrying the same mutation after an uncertain
response. It is also the backend idempotency key.

## Actions

Read-only actions:

```text
experiment.list  { limit }
experiment.read  { experimentId }
snapshot.list    { limit }
snapshot.read    { snapshotId }
article.list     { limit }
article.read     { articleId }
```

Mutation actions:

```text
experiment.presentation.save
  { experimentId, expectedVersion, title, surface }

experiment.publish
  { experimentId, expectedVersion, snapshotId, publicSlug }

article.save
  { articleId, expectedVersion, article }
  # both identity fields are null for a new Article

article.publish
  { articleId, expectedVersion, publicSlug }
```

`article.save` uses the same portable block document as the visual Editor.
Supported block kinds are `paragraph`, `heading`, `equation`, `image`,
`divider`, and `experiment`. Equations store display TeX in `expression`.
Images reference an immutable HTTPS asset with `url`, `altText`, and
`caption`; local file paths and data URLs are rejected. The visual Editor can
upload image files to the owner's Article asset bucket, while CLI authors may
reference an asset that has already been uploaded.

Read the current resource first and copy its current version into a mutation.
Presentation and Article saves are validated against the pinned exact model,
Surface and referenced Snapshots. Publication accepts only a Snapshot that has
already passed the common numerical admission path.
