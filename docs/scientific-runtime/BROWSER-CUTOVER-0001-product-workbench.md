# Browser cutover 0001: product Workbench over the scientific runtime

Status: implemented user0 browser-product vertical slice for
`circleheart/adult-five-wall-noncoronary@0.2.0`.

This document records an implementation boundary. It does not establish
clinical validation, diagnostic validity, patient-specific fitting, or a
physiology acceptance result.

## Decision

The localized product routes `/workbench`, `/workbench/:caseId`, and `/cases`
use the same release-bound scientific runtime contracts as the scientific
research/development Workbench:

- the compiled scientific release and resolved session input;
- `MainWireScientificWorkerClientV1` and its module Worker;
- accepted-state scientific sessions and exact checkpoint rules;
- the scientific observable registry, including availability and quality; and
- the release-owned Preset, Case, Workspace, and control documents.

The two Workbench routes are different presentation surfaces over one
scientific core, not separate equation implementations:

| Route | Surface responsibility |
| --- | --- |
| `/workbench` and `/workbench/:caseId` | The ordinary product Workbench: freeform panes, view authoring, Note/Reading composition, and release-bound controls. |
| `/scientific-workbench` | Research/development UI: provenance, evidence wording, and numerical status. |
| `/cases` | Product discovery for the same supported scientific cases accepted by `/workbench/:caseId`. |

The routes do not have to share one live session instance. Each page may own an
independent Worker session, but release identity, session-input identity,
accepted-state semantics, observable projection, and transition rules must be
the same.

Within one product page, each scientific scenario also owns an independent
Worker client, accepted-state session, control store, and command owner. The
product shell can compare those sessions, but it does not couple their
residuals, state vectors, or transitions. The current implementation bounds the
registry at four scenarios.

The cutover preserves the Workbench UI/UX and replaces the scientific runtime
under it. It is not a redirect to, or a product-themed copy of,
`/scientific-workbench`. Deleting unreachable `PreviewController`, `ModelCore`
adapters, legacy cases, and raw-parameter execution code is follow-up cleanup;
the freeform presentation shell remains product architecture.

## Preserved Workbench composition model

The product Workbench continues to support:

- multiple graph panes that can be added, deleted, renamed, rearranged,
  duplicated, and split in Dockview;
- graph membership and titles per pane;
- scientific scenarios that can be added from the release-bound catalog,
  duplicated, renamed, recolored, hidden globally, removed, and selected as the
  active controller target;
- per-pane scenario membership and signal selection, allowing independent
  scientific frame streams to be overlaid without sharing numerical state;
- authored controller and metrics views that can be created, renamed,
  duplicated, and deleted;
- Note panes whose `view_ref` blocks embed graph, controller, or metrics views;
  and
- Reading composition that embeds the same semantic references.

Pane identity and authored-view identity are deliberately distinct. A pane is
a physical placement in the current layout. Its stable `sourceViewId` points
to the semantic graph/controller/metrics view used by Note and Reading.
Rearranging or splitting a pane therefore preserves the referenced view rather
than silently forking its meaning.

The shell owns presentation state, including panel placement, Dockview state,
view metadata, notes, and Reading composition. A
`WorkbenchRuntimeRenderer` injection owns scientific values and behavior. It
renders graph, controller, metrics, and explicit-unavailable model panes from
the current scientific snapshot while leaving the existing shell interactions
in place.

Controller authoring remains a presentation capability, but it does not grant
arbitrary access to internal parameters. The scientific controller catalog
currently enables only the approved complete SVR/PVR target surface. Planned
controls may appear as explicitly disabled catalog entries, but selecting them
cannot create a raw-parameter mutation or a legacy mapping. Metrics views
select from the versioned derived-metric catalog, and graph views select
release-bound observable IDs or declared pressure-volume trajectories.

## Hard runtime boundary

The product Workbench consumes scientific observable frames directly. It does
not translate them into legacy `SimSample`, emulate `PreviewCoreFacade`, or
construct a legacy `PhysicsRefState`.

An unavailable scientific observable remains `null` with its declared
availability. The host must not replace `not-modeled`, `not-measurable`,
`not-converged`, or `not-evaluated-at-accepted-state` with zero. A real numeric
zero may be displayed only when the observable is `available`. Unknown signal
IDs and unsupported plots render an explicit unavailable state rather than an
empty zero trace.

Derived metrics are evaluated by a versioned scientific metric registry from a
validated 501-frame complete cycle. During an open live transient, or when the
required complete cycle is unavailable, cycle metrics remain `null` with an
unavailable reason. Presentation code must not infer a steady value from a
partial rolling history.

Product graphs use full-pane, device-pixel-ratio-aware Canvas renderers. For a
validated periodic cycle, a presentation-only clock repeats already accepted
cycle data and drives the waveform sweep gap, waveform leading cap, and PV-loop
cap. Pausing or changing this display clock does not advance a scientific
session. For an open live transient, the renderer does not manufacture a
periodic replay: it draws the accepted rolling history and places the cap at
the latest accepted point. The transient sweep gap and cap use the same
accepted-time elapsed coordinate, anchored to the retained fork-boundary time;
validated-cycle overlays use that same presentation phase while exactly one
independent transient is present. If multiple scenarios are transitioning
simultaneously, each transient keeps its own accepted-time cap and no shared
cross-session phase claim is made. Unavailable samples break a path and are
never coerced to zero. The
product legend uses compact scenario and signal labels;
research provenance remains available on the research surface instead of
being repeated as a graph subtitle.

There is no backend selector, automatic downgrade, or retry through
`ModelCore`. Worker creation, release verification, checkpoint restore,
research-case settlement, or observable validation failure is visible as a
failed scientific load. It must not silently open the healthy case or the
legacy Workbench.

## Supported product cases

The initial product catalog is deliberately closed and release-bound. It
contains one official pinned reference and eight single-valve severe research
brackets:

| Product case ID | Meaning | Trust boundary |
| --- | --- | --- |
| `circleheart/official-healthy-periodic` | Healthy periodic baseline restored from the exact V3 checkpoint | Official pinned catalog reference; not clinical validation |
| `main-wire/as-severe` | Aortic stenosis, severe bracket | Built-in research bracket |
| `main-wire/ar-severe` | Aortic regurgitation, severe bracket | Built-in research bracket |
| `main-wire/ms-severe` | Mitral stenosis, severe bracket | Built-in research bracket |
| `main-wire/mr-severe` | Mitral regurgitation, severe bracket | Built-in research bracket |
| `main-wire/ts-severe` | Tricuspid stenosis, severe bracket | Built-in research bracket |
| `main-wire/tr-severe` | Tricuspid regurgitation, severe bracket | Built-in research bracket |
| `main-wire/ps-severe` | Pulmonary stenosis, severe bracket | Built-in research bracket |
| `main-wire/pr-severe` | Pulmonary regurgitation, severe bracket | Built-in research bracket |

The separate `main-wire/healthy-cold` research preset remains useful for
research initialization evidence but is not a second healthy product case.
It may remain selectable on `/scientific-workbench`; it is not listed by the
initial `/cases` product catalog.

The official healthy selection verifies the release-bound document chain and
restores its exact V3 P1 state before capturing the terminal cycle. Each valve
bracket resolves its own release-bound Preset, Case, resolved input, and
Workspace, starts independently from its declared cold initialization, and is
shown as a steady plot only after the numerical periodic gate and following
cycle capture succeed.

The words `healthy` and `severe` identify these fixed model references and
research parameter brackets. They are not a diagnosis, a clinical severity
classifier, or evidence that the parameterization has been fitted to a person.

## Route IDs and legacy aliases

Canonical product case IDs are exact and case-sensitive. A route ID is
accepted only if it resolves to a catalog entry under the current release.
The only retained legacy aliases are explicit:

| Legacy route ID | Canonical scientific product case ID |
| --- | --- |
| `normal-sinus` | `circleheart/official-healthy-periodic` |
| `aortic-stenosis` | `main-wire/as-severe` |

No heuristic name matching, case folding, prefix matching, or conversion of an
arbitrary legacy case is allowed. Empty, malformed, unknown, or unsupported
IDs fail closed. In particular, an unknown `/workbench/:caseId` must not fall
back to healthy. `/workbench` without a case ID is the deliberate entry point
for the official healthy baseline.

The aliases preserve only a route destination. They do not migrate a legacy
case document, parameter patch, checkpoint, saved state, evidence claim, or
clinical interpretation.

## Controls and transition semantics

The current interactive controls are the release-owned complete SVR/PVR target
state. Partial raw parameter patches and arbitrary legacy knobs are outside
this contract. Both presentation modes begin with the same state-preserving,
compare-and-swap guarded Worker fork; presentation policy never changes the
scientific command.

Each ready scenario mounts one hidden
`ScientificWorkbenchResearchControlV0` command owner for its own Worker and
publishes immutable state/frame snapshots into its own external store. Visible
controller panes and controller references embedded in Note or Reading are
mirrors: an active binding follows the Workbench's active scenario, while a
scenario binding remains pinned to its declared scenario. Additional mirrors
never create additional command owners or independent drafts. Graph and metric
panes read scenario stores through the registry and apply global visibility
plus their own pane membership.

The official periodic loader and the settled research-bracket loader both
return a verified `researchControlContext`, so the same SVR/PVR transition
contract is available for both kinds of product scenario. This does not make a
research bracket official, clinical, or physiologically accepted.

Adding a catalog entry starts a new independent session. Duplicating a stable
scenario starts another independent session from the same release-bound case
and carries the source's committed SVR/PVR target to the duplicate through the
ordinary steady-transition contract. It does not clone an unaccepted draft or
share mutable checkpoint/state objects. Deleting a scenario terminates its
Worker and removes its graph/metrics membership; the last scenario cannot be
deleted.

### Show next steady state

The target runs on a hidden fork while the source cycle remains visible. A
target cannot replace the source before P1 periodic convergence. After P1, the
runtime captures the following complete one-second cycle as 500 accepted 2 ms
steps plus the P1 boundary, validates the revision-contiguous 501-frame
history, and promotes the target atomically. Failure, cancellation, P2
suspicion, or the bounded beat limit leaves the source display and source
control identity unchanged.

### Play the transition

The target advances one Worker command at a time, with four accepted 2 ms
steps per command. Accepted frames are appended without resampling, smoothing,
or interpolation to a bounded 20-second, 10,001-frame rolling history, matching
the maximum product waveform window at the release's 2 ms accepted cadence.
The immutable fork-boundary accepted time is retained separately, so trimming
the history cannot reset the sweep phase. Pause and reset take effect only
between commands. Resume continues from the last accepted target state; reset
disposes the target and restores the retained source cycle and control identity
exactly.

A live target is an open transient and makes no periodic steady-state claim.
It becomes a steady display only through the full P1 and following-cycle gate.
Transitions are scoped to the selected or pinned scenario; other scenarios
keep their own sessions, stores, targets, and display evidence.

## Identity and persistence boundary

Displayed data remains bound to its exact `SimulationReleaseRef`, session
input digest, session origin, accepted revision and time, control-state digest,
and parameter epoch. Product wording may collapse provenance cards visually,
but it must not remove or rewrite those identities.

No legacy `x[]` state, `CoreRuntimeParams` patch, saved legacy case, or
`ModelCore` checkpoint is converted at cutover. Exact resume remains valid only
under the identical scientific release and checkpoint schema. Persistence of a
controlled fork requires a future control-aware checkpoint contract; the
current V0 transition does not imply one.

The current product route initializes its panels from the first scenario's
release-bound Workspace document. Additional scenario descriptors, global and
per-pane membership, layout edits, authored views, notes, and Reading content
are in-memory presentation state. They are not yet saved as a new release-bound
user Workspace or Case revision, and reload may discard them. Header save,
import, and export actions are therefore explicitly disabled on the scientific
product route. The old case import/export and saved-case path is not a
scientific persistence mechanism and is not supported by this cutover.

## Current first-slice limitations

Preserving the shell does not mean every old affordance already has a
scientific command behind it. The current boundary is explicit:

- the implemented multi-scenario registry is bounded to four isolated sessions
  and is an in-memory comparison layer, not a coupled scientific assembly or a
  durable multi-case document;
- user Case/Workspace save, import, export, migration, and durable revision
  history are not yet implemented;
- only the enumerated complete SVR/PVR target is interactive; planned heart
  rate, blood-volume, myocardial, pericardial, and valve controls remain
  unavailable until they have release-owned contracts;
- the generic shell play/time-scale state controls only Canvas sweep/cap
  presentation; accepted temporal evolution is owned independently by each
  scenario's steady/live controller;
- product comparison state, control-aware user checkpoints, and imported user
  case migration do not yet survive reload;
  and
- coronary circulation, assist devices, MultiPatch myocardium, and arbitrary
  runtime topology changes remain outside this release.

These are implementation gaps, not permission to route an action to legacy
`ModelCore`, fabricate data, or silently ignore a scientific failure. UI
affordances that have no scientific implementation must be disabled or marked
unavailable as the cutover is completed.

## Verification obligations

The cutover remains guarded by tests that establish at least the following:

- `/workbench` and every supported `/workbench/:caseId` use the scientific
  module Worker and render accepted scientific observable frames;
- adding or duplicating a scenario creates a distinct Worker/session/store,
  removing it terminates that runtime, and no scenario command mutates another
  scenario's state identity;
- global visibility, pane-local membership, scenario-specific signal
  selection, and graph/metrics cleanup on removal remain synchronized;
- waveform Canvas rendering fills its pane, advances a sweep/cap only through
  the presentation clock for a validated cycle, and freezes that clock when
  paused; PV loops expose an equivalent moving cap;
- an open transient renders only accepted transient history, with its sweep
  gap and latest cap on one fork-boundary-anchored accepted-time coordinate,
  never a fabricated periodic cycle;
- the product route retains graph add/delete/rearrange/split behavior and can
  create controller and metrics authored views without mounting a second
  scientific backend;
- Note and Reading can embed graph, controller, and metrics references, and
  duplicated/split panes preserve semantic `sourceViewId` identity;
- `/cases` links only to case IDs accepted by the product Workbench;
- the two listed aliases resolve exactly and unknown or malformed IDs fail
  closed;
- product and research surfaces produce identical plotted points for an
  identical 501-frame source cycle;
- unavailable observables remain unavailable and are never plotted as
  fabricated zeroes;
- incomplete/live histories leave cycle-derived metrics unavailable rather
  than reporting zero or a partial-cycle estimate;
- exactly one headless controller per ready scenario owns that scenario's
  commands, while active and pinned visible or embedded controllers are
  synchronized mirrors of the correct store;
- steady mode performs one atomic promotion only after P1 plus the validated
  following cycle;
- live mode preserves revision and 2 ms time continuity, pauses at command
  boundaries, and resets to the exact retained source;
- route unload disposes every owned scenario session and terminates every
  corresponding Worker client; and
- the product Workbench's reachable scientific execution closure has no import
  of `ModelCore`, `PreviewController`, or legacy graph/control execution
  adapters. Reuse of presentation-shell modules is expected.

These are routing, identity, transport, numerical-state, and presentation
checks. Passing them does not replace the separate physiology, morphology,
performance, safety, or clinical-validation evidence programs.

## Follow-up

After the product cutover remains green, remove the unreachable legacy browser
runtime and its case/knob persistence path without removing the freeform
Workbench presentation model. Add release-bound user Workspace/Case revisions,
including durable multi-scenario comparison membership and control-aware user
checkpoints, as explicit scientific/product contracts. If future scenarios
need coupled circulation or mechanics, that must be a new compiled scientific
assembly rather than an extension of the current overlay registry. New
controls, official presets, coronary circulation, devices, and MultiPatch
assemblies must enter through new release-bound scientific contracts; they
must not reintroduce an alternate product backend or arbitrary runtime
parameter mutation.
