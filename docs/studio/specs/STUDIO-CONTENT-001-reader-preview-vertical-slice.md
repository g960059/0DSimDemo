# STUDIO-CONTENT-001 — Author to Reader Preview vertical slice

Status: implemented greenfield draft-preview vertical slice; certification,
publication, durable sharing, and the final Reader remain pending
Date: 2026-07-24

## Purpose

Connect one Studio-native authoring flow to one Studio-native Reader without
reviving the legacy `Lesson`, `CaseDocument`, `PreviewController`, or their
persistence shapes.

The slice proves this path:

```text
StudioAuthorDraftV1
  → validate + clone + deep-freeze
    → ReaderPreviewManifestV1
      → ResolvedReaderDocumentV1
        → StudioDocumentReaderV1
          → Reader-safe experiment controller
            → Studio scenario controller
              → SimulationSessionCoordinatorV1
                → MainWire runtime adapter
```

It deliberately proves preview, not publish. The trust label, lifetime, and
runtime source prevent an author preview from being mistaken for certified or
public content.

## Trust and persistence boundary

Every manifest in this slice has these exact values:

```ts
trust: "draft-preview-uncertified"
sharePolicy: "session-only"
publicationManifestRef: null
source.kind: "draft-revision"
runtimeBindings[scenarioId].kind: "preview-bootstrap"
runtimeBindings[scenarioId].qualification: "uncertified-preview-only"
```

Consequences:

- A preview is available only from the in-memory authoring application that
  materialized it. A hard reload or a URL copied into another application
  session cannot resolve it. UUID capability ids prevent a later session's
  first preview from aliasing an earlier session's URL.
- `session-only` is a lifecycle statement, not an authorization or secure
  sharing mechanism. Durable private sharing still requires identity, ACL,
  persistence, expiry, and audit contracts.
- The Reader shell always presents the preview as unpublished and
  uncertified. It never shows an official or certified badge.
- Preview materialization does not create a `PublicationManifest`,
  `CertifiedSeed`, `AssessmentReport`, or durable `RunArtifact` association.
- Reader interaction does not save a run, mutate the author draft, or create a
  new Experiment or Document revision.

An official exact source may be used to bootstrap the numerical session. That
does not make the article, Experiment, preview manifest, or Reader interaction
certified.

## One shared Reader seam

Draft preview and future publication must converge before rendering:

```text
draft resolver
  ReaderPreviewManifestV1
    └─ resolvedReaderDocument ─┐
                              ├─> ResolvedReaderDocumentV1
publication resolver          │      └─> StudioDocumentReaderV1
  PublicationManifest ────────┘
```

`StudioDocumentReaderV1` receives only `ResolvedReaderDocumentV1` plus
Reader-safe experiment controllers and a read-only scientific presentation
port. It does not know whether a resolver read a session preview or a
publication manifest.

`ResolvedReaderDocumentV1` contains publication-neutral resolved Experiment
content: scenario identity and labels, but no preview bootstrap source.
Preview runtime authority is carried separately by
`ReaderPreviewManifestV1.runtimeBindings`. A future publication resolver must
provide its independently validated publication runtime authority outside the
same document value.

Trust chrome remains outside the shared document renderer. The preview route
shows the unpublished/session-only banner; a future published route must show
trust derived from a validated `PublicationManifest`.

There must not be separate “preview Reader” and “published Reader” renderers.
Likewise, the published resolver must not import the legacy Lesson,
`CaseDocument`, or `PreviewController` path.

## Content contract

The first portable content graph contains:

- `StudioAuthorDraftV1`;
- one `DocumentRevisionV1` with ordered heading, paragraph, and
  experiment-placement blocks;
- one or more referenced `ExperimentRevisionV1` values;
- scenario declarations with explicit preview runtime sources;
- `ReaderBriefV1` values containing ordered portable graph-pane snapshots,
  instantaneous readbacks, and exposed controls; and
- a join-complete `ResolvedReaderDocumentV1`.

Preview materialization validates the complete graph, resolves every placement
to an Experiment and Reader brief, clones the result, and deep-freezes it.
Neither caller-owned objects nor later author edits may alias an existing
preview.

Author commands use optimistic revision matching. The structured Document
Editor commits title, ordered heading/paragraph blocks, and the structured
Experiment placement atomically; one successful transaction advances the
author draft and document revision exactly once. A Workbench Briefing capture
replaces graph panes in one Reader brief and advances the draft and Experiment
revision, but not the Document revision. Materializing a preview does not
advance a revision; it captures the exact expected revision supplied by the
author.

### Portable graph-pane snapshot

`StudioGraphPaneSpecV1` is a detached presentation copy, not a pointer to a
Workbench pane. It resolves and stores:

- graph kind (`waveform`, `pv-loop`, `guyton-left`, or `guyton-right`);
- explicit scenario and item identities;
- effective scenario/item labels and colors;
- waveform time window;
- legend visibility and fractional position;
- PV guide, beat-history, parameter-generation-history, pressure-basis, and
  relation settings; and
- Guyton/Starling detail, history, and negative-filling-pressure settings.

Runtime frames, candidates, Worker jobs, settings-open state, and Dockview
geometry are excluded. Editing a Workbench pane after capture cannot mutate the
Reader brief. The author must explicitly update the captured pane.

Workbench and Reader reconstruct the same `PanelDef` presentation and invoke
the same `ScientificProductGraphPaneV1`. Reader therefore uses the Workbench
fixed-window waveform, PV-loop, and Guyton/Starling renderers rather than a
private SVG chart. In reading mode legend position is honored but dragging,
settings, graph addition, and layout mutation remain disabled.

### Signal and parameter identity

Observable identity and settable input identity remain separate:

- `signalId` selects a runtime output for a graph or instantaneous readback;
- `parameterKey` identifies the settable model input;
- `readbackSignalId` is optional display metadata and cannot substitute for
  `parameterKey`; and
- every control names its target scenario ids explicitly.

The Reader runtime facade accepts only bindings it can map uniquely to the
single opened scenario. Unknown signals, unknown parameter mappings,
multi-scenario targets in this slice, values outside `allowedValues`, and
implicit “active scenario” targeting fail closed.
Supported parameter keys are resolved from the release-bound MainWire control
catalog rather than a Reader-local switch. A brief may expose any of the six
catalog controls, but every authored value must also belong to that control's
runtime value domain.

Before allocating a Worker, the preview runtime-binding resolver also requires
the resolved Experiment `modelRef` to equal the release-bound model identity
used by the selected product case. A manifest cannot name one model while
bootstrapping another source.

## Deliberately narrow topology

This vertical slice supports exactly:

```text
one Document
  └─ one experiment placement
       └─ one Experiment
            └─ one scenario
                 └─ one Reader inflow
```

The underlying target architecture remains one Experiment interaction with N
scenario branches and multiple placements in a Document. The one-placement,
one-scenario rule is an implementation limit accepted only for this vertical
slice. It must not become a publication schema invariant.

Peek, fullscreen, multi-placement scheduling, cross-placement runtime budgets,
aggregate N-branch Reader interaction, and a reusable headless Reset command
remain follow-up work.

## Author to Reader lifecycle

1. The Author route opens a session-local `StudioAuthorDraftV1`.
2. Document edits are committed atomically with the current expected revision
   and advance only the mutable author aggregate. Text input commits on blur or
   an explicit route action; add, positional insert, remove, and reorder commit
   their exact next document value immediately, so browser Back or direct
   navigation cannot discard an already accepted structural edit. Empty text
   blocks are dropped at commit, and a temporarily invalid title never prevents
   leaving for Home, Workbench, or an older immutable Preview.
3. In Workbench, the author may explicitly open **Briefing**, capture graph
   panes into the Reader brief, update a capture, or remove it. Closing the
   compose layer removes its temporary authoring surface. The drawer is
   non-modal so pane settings remain adjustable while it is open. It warns as
   soon as an inflow brief exceeds the one-graph soft limit.
4. **Preview as Reader** validates the entire graph and materializes a detached
   `ReaderPreviewManifestV1` at the current revision.
5. The route navigates with the preview id while the same author-preview
   provider remains alive.
6. The Reader route resolves that id from the session-local application. A
   missing id becomes an explicit expired/unavailable state.
7. Every Reader open allocates a fresh runtime session, presentation registry,
   and Reader controller.
   No numerical session is reused from a previous Reader visit.
8. Closing the Reader stops presentation, disposes the Reader controller, and
   aborts bootstrap or an in-flight Studio session open before disposing the
   presentation registry and scenario runtime. Opening hosts are terminated and
   late asynchronous completions cannot reattach the closed session.
9. Reopening the same materialized preview starts again from a fresh one-point
   source. Returning to Author does not apply Reader controls to the draft.
10. Reader Reset uses that same fresh-session path: it disposes the current
    numerical session and reloads the immutable manifest source. It never
    approximates Reset with a reverse parameter patch from the current state.

The preview manifest remains a frozen view of the author revision captured in
step 3. Subsequent Author edits require another materialization to appear in a
new preview.

## Reader runtime and first paint

The Reader experiment facade exposes only:

- brief-selected signal series;
- brief-selected instantaneous readbacks;
- brief-allowlisted controls;
- an exact return-to-source Reset capability;
- Reader-safe phase, error, target-generation, and strict-activity status;
- evidence state; and
- the fixed time scale `1`.

It does not expose the Workbench control store, layout mutation, graph
authoring, raw parameter access, candidate promotion, run pinning,
certification, persistence, or publication.

Before live presentation starts, the controller requires exactly one accepted
source point and projects that point into the initial Reader snapshot. The
Reader commits that snapshot first. Presentation subscription and start are
then delayed across an explicit double-`requestAnimationFrame` boundary so the
browser can paint the one-point Reader before live updates begin:

```text
settled one-point preview source
  → one-point Reader DOM commit
    → one-point browser paint boundary (double requestAnimationFrame)
      → subscribe/start presentation
        → fixed 1× trace grows forward
```

The browser E2E records the initial `phase=seed`, `frameCount=1` DOM commit
before any growing trace, then separately waits for the fixed-1× trace to grow
forward. The DOM observer is commit evidence rather than a pixel capture; the
double-animation-frame boundary is the implementation mechanism that preserves
the required paint-before-start order.

It does not save or synthesize a preceding beat. Beat-derived values remain
collecting until enough forward samples exist. For this preview slice,
“settled one-point” describes the exact bootstrap state and presentation
evidence; it is not a `CertifiedSeed` claim.

A Reader control commit delegates through the Studio scenario controller.
The controller advances runtime `targetGeneration` and starts foreground live
plus background strict work automatically. Runtime generation is not content
revision: no Reader action changes the captured draft, Document, Experiment,
Reader brief, or preview revision.

## Bootstrap lineage limitation

The current preview loader uses the product case catalog and Studio runtime
bootstrap to construct an exact source snapshot and content-addressed runtime
refs. Those refs are adequate for an uncertified session preview, but they are
not publication-grade lineage.

`preview-bootstrap` and `uncertified-preview-only` belong to the validated
content/routing manifest. The Provider uses that manifest to select this
session-only path, but the generic Studio bootstrap does not encode either
qualification in its generated `RunArtifact` or `sourceRunRef`. The ref is
therefore not self-qualifying. Within this Reader path it is only an internal
runtime input and must be treated as publication-ineligible. A consumer may not
infer preview trust from the ref itself or reuse it as publication lineage.

In particular, the preview bootstrap does not prove the complete chain:

```text
approved immutable policy revision
  → required AssessmentReports
    → CertifiedSeed
      → publication-pinned RunArtifact/input/snapshot lineage
        → retained model/runtime/solver/state-codec packages
          → atomic PublicationManifest
```

The preview content source and routing manifest must therefore remain labeled
`preview-bootstrap` and `uncertified-preview-only`; the generated runtime ref
must not be described as carrying that qualification. A future publication
resolver may reuse the shared Reader renderer only after validating the full
publication chain. It may not promote, reinterpret, or wrap the preview
manifest or its bootstrap refs as a publication.

## Sample authoring workflow

The bundled Japanese draft
`ScientificProductSampleAfterloadArticleV1.ts` supplies one realistic
end-to-end fixture:

- title: “全身血管抵抗を変えると左室と大動脈の圧はどう動くか”;
- one healthy-reference afterload Experiment;
- left-ventricular and aortic pressure waveforms;
- two explicitly instantaneous pressure readbacks;
- one systemic-resistance scale control with the exact values
  `0.75`, `1.0`, `1.5`, and `2.0`; and
- text that identifies the multiplier as a model-relative scale, not measured
  resistance in Wood units, and disclaims patient-specific, diagnostic, and
  treatment interpretation.

The Author workflow edits the article, materializes a preview, and opens the
shared Reader. The Reader check reads the article in order, confirms the
unpublished/session-only state, observes the experiment from one point,
changes the allowlisted resistance scale, and verifies that the author
revision did not change.

## Failure behavior

- Unknown, duplicate, dangling, non-serializable, or structurally invalid
  content is rejected before a preview is stored.
- Content identities must use the portable identifier grammar. Prototype-
  sensitive names such as `__proto__` are rejected, and generic detachment
  clones dynamic own keys as data properties rather than invoking setters.
- A revision mismatch rejects the Author command rather than overwriting a
  newer draft.
- A preview id unavailable in the current application session is reported as
  expired; no legacy or default document is substituted.
- A missing runtime source, invalid Reader brief, unsupported signal or
  parameter, target mismatch, bootstrap failure, or presentation projection
  failure is visible and fail-closed.
- A presentation consumer cannot corrupt the coordinator-owned numerical
  branch. Projection failures retain the last accepted Reader frames and
  require a valid reset before later append batches are accepted again.
- Reader controls enter the runtime only through the Reader allowlist and
  Studio scenario controller; there is no direct runtime-adapter bypass.

## Independent architecture reviews

The slice was reviewed independently with the requested model/effort pairs.
Review is advisory; contract tests and build verification remain the
executable evidence.

| Reviewer | Verdict | Decision |
|---|---|---|
| Claude `claude-opus-4-8`, reasoning `xhigh` | **GO WITH CHANGES** | Accepted the shared resolved-document Reader seam and requested explicit trust, lifecycle, cloning, identity, and runtime-control boundaries. |
| Codex `gpt-5.6-sol`, reasoning `max` | Accepted after hardening | Agreed with the same greenfield seam and verified the revised slice with 85 tests plus a production build. |

Adopted from both reviews:

- preview resolves to `ResolvedReaderDocumentV1` and renders through
  `StudioDocumentReaderV1`; the future publication resolver must converge on
  that renderer seam and supply independently validated publication runtime
  authority outside the publication-neutral document;
- no legacy Lesson, `CaseDocument`, or `PreviewController` compatibility path;
- validate, clone, and deep-freeze before storing a preview;
- keep `parameterKey` distinct from `signalId`;
- make `draft-preview-uncertified` and `session-only` explicit;
- allocate a fresh Reader runtime for every open and dispose it on close;
- paint the one-point source before starting fixed-1× presentation;
- keep Reader controls revision-neutral; and
- expose only the Reader facade allowlist.

Partially adopted:

- the one-placement, one-scenario topology is accepted only as the narrow
  vertical slice. The contract text explicitly prevents it from becoming the
  target Document or Reader topology.

Deferred:

- publication-grade run lineage. The routing manifest constrains this Reader
  path to `preview-bootstrap`; the generated bootstrap artifact and
  `sourceRunRef` do not themselves carry preview qualification and are
  publication-ineligible until the lineage in the preceding section is
  implemented.

Two review concerns were checked and closed at the current boundary:
direct regression tests show that throwing state and presentation listeners do
not block later listeners or coordinator-owned numerical progression,
Reader/Workbench projection faults are separately surfaced as visible
presentation failures, and Reader control commits pass through the Studio
controller rather than bypassing `applyControlIntent`.

## Source locations

- `studio/contracts/v1/content.ts`
- `studio/application/content/StudioAuthorPreviewApplicationV1.ts`
- `components/scientificProduct/ScientificProductSampleAfterloadArticleV1.ts`
- `components/scientificProduct/ScientificProductReaderExperimentControllerV1.ts`
- `components/studio/StudioReaderPreviewRuntimeBindingV1.ts`
- `components/studio/StudioAuthorPreviewProviderV1.tsx`
- `components/studio/author/StudioDocumentAuthorRouteV1.tsx`
- `components/studio/reader/StudioReaderPreviewRouteV1.tsx`
- `components/studio/reader/StudioDocumentReaderV1.tsx`

The runtime behavior below the Reader facade remains governed by
[STUDIO-RUNTIME-001](STUDIO-RUNTIME-001-foundation-vertical-slice.md) and the
transition product bridge boundary is recorded in
[STUDIO-RUNTIME-002](STUDIO-RUNTIME-002-product-workbench-bridge.md).

## Acceptance criteria

1. Author edits advance the draft/document revision under optimistic locking;
   preview materialization and Reader controls do not.
2. The preview manifest is detached, deeply frozen, uncertified,
   session-only, and has no publication manifest reference.
3. A copied or reloaded preview URL fails explicitly instead of loading
   fallback content.
4. Preview resolves through
   `ResolvedReaderDocumentV1 → StudioDocumentReaderV1`; when implemented, a
   publication resolver must converge on that same renderer seam.
5. Every Reader open owns a fresh runtime and every close disposes it.
6. The Reader first commits and paints exactly one source point, then grows its
   trace forward at fixed 1× without a saved beat.
7. The facade exposes only brief-selected signals/readbacks and exact
   allowlisted parameter values for the explicit scenario.
8. A Reader parameter commit starts normal Studio live+strict runtime work but
   changes no authoring revision or durable artifact.
9. The bundled afterload article can be edited, previewed, read, and
   interacted with through an end-to-end browser workflow.
10. No legacy content schema, Reader runtime, or numerical fallback is used.

### Acceptance evidence layers

These criteria intentionally use different evidence layers:

| Criteria | Executable or review evidence | Boundary of the evidence |
|---|---|---|
| 1–2 | Author-preview application unit tests plus the Author browser workflow | Revision, detachment, deep freeze, and exact preview trust values |
| 3 | Browser E2E hard reload of the materialized preview URL | Explicit expiry with no fallback content |
| 4 | Contract and dependency review | The publication-neutral resolved-document seam and external preview binding are implemented; the publication resolver and publication-grade runtime authority are deferred |
| 5 | Provider ownership/cleanup path plus browser close-and-reopen behavior | Proves a fresh visible runtime; disposal calls are established by the owned cleanup path rather than a browser resource counter |
| 6 | Reader-controller unit test plus browser E2E | Unit test proves one-point projection and forward frames; E2E proves the initial one-point DOM commit and later forward growth; the double-`requestAnimationFrame` implementation supplies the paint boundary |
| 7 | Reader-controller allowlist and validation unit tests | Selected signals, instantaneous readbacks, scenario target, parameter identity, and exact allowed values |
| 8 | Scenario/coordinator unit tests plus the Author browser workflow | Unit tests prove automatic live+strict submission; E2E proves the Reader control generation change and unchanged Author revision |
| 9 | Serial Playwright Author workflow | Edit → materialize → read → interact → reopen → expire |
| 10 | Dependency-boundary contract test and source review | Proves forbidden legacy content/Reader imports in the greenfield surface; it is not a numerical equivalence claim |

Failure evidence is also layered. Coordinator tests inject throwing state and
presentation listeners and require later delivery plus continued numerical
progression. Scenario-controller tests inject malformed presentation data and
require visible failure, retained accepted frames, append quarantine, and valid
reset recovery. Reader-controller tests verify failed-state projection and the
Reader renders its error as an alert; the browser workflow does not synthesize
a malformed runtime event.

## Explicitly outside this slice

- durable drafts, projects, private sharing, ACL, and collaboration;
- `PublicationManifest`, Assessment, certification, and official publishing;
- publication-grade artifact lineage and package-retention enforcement;
- more than one placement or scenario;
- Reader peek/fullscreen, viewport live-slot scheduling, and a reusable
  headless in-session Reset command;
- arbitrary Reader controls, layout editing, graph authoring, pinning, and
  candidate promotion; and
- replacement of the transition Workbench bridge with the final Study Lab.
