# AI-assisted Studio authoring

This CLI is a machine seam for local assistants. It operates on the same
user-owned Experiments, Snapshots, Briefings, and Articles as the visual
product; it is not a second content system.

## Discover the protocol

Do not copy action, field, block, or output catalogs from documentation. Ask
the installed CLI for its current machine-readable contract:

```sh
npm --silent run author:content -- --list-actions
npm --silent run author:content -- --describe experiment.preview
```

Start with the compact action index, then request only the action being used.
Unfiltered `--describe` remains available for offline schema tooling.
The discovery result owns command schemas, available actions, result
envelopes, pagination, and recovery fields. Source and tests own the protocol
implementation.

## Authentication and trust

Normal use authenticates the author through the product OAuth flow. Refresh
credentials are kept outside the repository and access tokens remain
ephemeral. Explicitly managed headless credentials may be supplied by an
external token owner, but the CLI rejects service-role authority.

All durable writes execute as the signed-in author under backend RLS,
ownership, optimistic concurrency, and publication constraints. The CLI must
never place credentials in command payloads or print them as diagnostics.

## Machine-I/O boundary

The process writes one structured result to stdout; progress belongs on
stderr. Assistants follow structured error category, commit state, recovery,
and cursor fields rather than parsing human-readable messages.

A command identity belongs to one canonical semantic request. Reuse it only to
recover the same uncertain mutation. A new decision requires a new identity.
When commit state is uncertain, read operation authority before retrying.

## Numerical authoring boundary

Numerical mutation is previewed before it is applied. Preview returns the exact
model/Surface pins, an immutable apply plan, Scenario changes, and selected
observations. Apply accepts that reviewed plan; it must not reinterpret the
request against another release.

Scenario assignments are absolute and explicit. Omission preserves existing
content rather than deleting it. Snapshot sealing captures the selected exact
accepted state and does not hide an unreviewed time advance.

Read-only traces restore a saved capture and return selected exact scalar
outputs on its accepted clock. Sampling stride selects actual samples without
interpolation; the final step is always included. Presentation steps are
model-owned, so callers use returned times rather than assuming a timestep.
Trace results are ephemeral measurements, not persisted analysis or proof of
periodicity. Time-only advances preserve inputs without issuing another control
assignment and use the same
preview/apply boundary as other numerical mutations.

Article placement projects a sealed Snapshot through a Briefing. Publication
is always a separate explicit action. Large search, fitting, or validation
loops remain non-persistent studies until a user explicitly selects a
candidate for the ordinary preview/apply/seal path.

Placement requires an explicit projection choice for outputs and controls.
Active-slot outputs can materialize at initial focus or expand across visible
Scenarios; fixed source panes retain their visible targets. Reader-focus controls
follow selection within their allowed targets. Fixed panes with no visible target
are omitted, never silently redirected. Every projected item still belongs to its
source pane. The Reader chooses inline or companion presentation from the
resulting Briefing. Read the placed block to verify the projection; use block
patches only for presentation choices beyond the placement selection contract.

Client-side numerical admission protects the first-party workflow from
ordinary invalid captures. It is not cryptographic proof against a hostile
authenticated client and does not establish clinical or server-certified
validity.
