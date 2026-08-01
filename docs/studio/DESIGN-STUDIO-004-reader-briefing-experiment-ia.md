# CircleHeart Studio — Reader, Briefing, and Experiment IA

Status: active product-IA companion; target contract with implementation status

Date: 2026-08-02

Decision: Experiment is an Article-independent root; an Article Placement pins
one immutable Experiment Snapshot and owns its audience-specific Briefing

This document is the active companion to
`DESIGN-STUDIO-003-experiment-data-architecture.md`. DESIGN-STUDIO-003 remains
authoritative for exact model identity, fixture/checkpoint capture, Workspace,
Snapshot, lineage, and persistence. This document owns product navigation,
Article/Experiment relationships, Briefing semantics, and responsive Reader
presentation.

It does not revive DESIGN-STUDIO-002. In particular, it does not restore a
durable Working Set, independently versioned Reader Brief, manual
`inflow | peek | fullscreen` field, certification-artifact hierarchy, or
command-log architecture.

## 1. Audience and product entry points

CircleHeart must serve three overlapping groups without creating three
incompatible products:

- beginners, including early residents and medical engineers, who benefit from
  guided explanation and a small, deliberately selected interactive surface;
- experienced clinicians, including cardiology and anaesthesia trainees and
  specialists, who may open an Experiment directly without an Article; and
- haemodynamics researchers, who need exact model/Snapshot disclosure, richer
  comparisons, and export, but should still use the same Experiment identity.

The top-level IA therefore has two content entry points, with progressive
disclosure inside each:

```text
Learn / Articles
  guided narrative + audience-specific Experiment Placements

Experiments
  direct standalone Workbench + Scenario Manager + full authored Surface
```

Research features are advanced Experiment capabilities, not a third data root.
No user must declare a role before opening content.

## 2. Ownership and sharing

The ownership graph is:

```text
Experiment (independent mutable authoring series)
  └─ 0..N ExperimentSnapshots (immutable)
          ↑
          │ pinned by
          │
Article ──┴─ 0..N ExperimentPlacements
                    └─ one Placement-owned Briefing
```

The consequences are normative:

1. Creating or directly opening an Experiment never creates an Article.
2. An Experiment remains useful with no Article.
3. One Article may place several Experiments or several Snapshots of one
   Experiment.
4. The same Snapshot may appear repeatedly in one or many Articles, each time
   with an independent Placement ID and Briefing.
5. Briefing edits never mutate the Experiment Workspace or pinned Snapshot.
6. A later Experiment Snapshot never changes an existing Placement. Updating a
   Placement to a newer Snapshot is explicit.
7. Article membership is derived by indexing Placements. Experiment does not
   carry an `articleIds` array.
8. Deleting an Article never deletes an Experiment or Snapshot. A referenced
   Snapshot remains retained even if its mutable Workspace is later archived.

The Experiment header separates global navigation from relationships:

- `Articles` opens the Article library;
- `Use in article…` explicitly creates or selects a target Article and inserts
  a pinned Snapshot;
- `Used in N articles` opens backlinks derived from Placements.

The word *Workbench* names the full Experiment authoring surface. It is not the
durable resource identity and should not own the canonical URL.

## 3. Surface and Briefing responsibilities

The Experiment Surface is the reusable full laboratory configuration. It owns
Scenario captures, custom graph panes, selected output/control items, the
standalone default composition, and the Experiment note.

A Briefing is a pure, Placement-owned projection of one pinned Surface for one
article context. It answers four separate questions:

1. which Scenarios are visible;
2. which visible Scenario initially has focus;
3. which graph, output, and control content is present; and
4. which binding and Scenario scope each published control targets.

Visibility, focus, and control targets are not aliases:

- `scenarioScope.visibleScenarioIds` controls graph comparison and available
  output context;
- `scenarioScope.initialFocusScenarioId` is the initial neutral output context;
- every control has an explicit binding. Pickup defaults to a fixed Scenario
  set; following reader focus is a separate explicit opt-in.

Every focused, allowed, or fixed-target Scenario must be visible. A present
Briefing has a nonempty visible set and exactly one initial focus Scenario.
Graphs render the visible comparison set. Neutral output values use reader
focus; changing that focus does not retarget a fixed control.

### 3.1 Role-specific projection

Graphs, outputs, and controls have different authoring needs and are not forced
through one generic pane-pick shape:

```ts
type ExperimentPlacementBriefing = {
  scenarioScope: {
    visibleScenarioIds: string[];
    initialFocusScenarioId: string;
  };
  graphs: GraphBriefing[];
  outputs: OutputBriefingItem[];
  controls: ControlBriefingControl[];
};

type GraphBriefing = {
  paneId: string;
  order: number;
  emphasis: "primary" | "supporting";
  overrides?: {
    label?: string;
    legend?: "auto" | "hidden" | "compact" | "full";
    series?: Array<{
      seriesId: string;
      label: string;
      colorHex: string;
      order: number;
    }>;
    windowSec?: number;
    historyDepth?: number;
  };
};

type OutputBriefingItem = {
  outputId: string;
  label: string;
  order: number;
};

type ControlBriefingControl = {
  controlId: string;
  label: string;
  order: number;
  presentation:
    | { kind: "slider" }
    | {
        kind: "buttons";
        options: Array<{ label: string; value: number }>;
      };
  binding:
    | {
        mode: "fixed";
        scenarioIds: string[];
        application: "absolute";
      }
    | {
        mode: "reader-focus";
        allowedScenarioIds: string[];
      };
};
```

This is a semantic sketch, not permission for arbitrary renderer JSON.

- A graph entry selects a custom graph pane already present in the pinned
  Snapshot. It may narrow that pane and override article-local labels, legend
  colors, sweep window, or structural history only within the registered graph
  contract and Studio bounds.
- Output entries select output items already admitted to the Snapshot Surface.
  Their only article-local presentation override is the label.
- Control entries select controls already admitted to the Snapshot Surface.
  They may change the label and choose a slider or an allowlisted button map.
  Every button value must pass the registered control range/lattice rules.
- Output and control content remains color-neutral. Graph series alone own
  semantic color.
- Control order is durable. Pixel divider positions and Dockview geometry are
  not.

When authoring in the standalone Workbench, a controller may target the active
Scenario slot or an explicitly selected Scenario set. Pickup into a Briefing
resolves that ephemeral active slot to a `fixed` binding by default. An author
may explicitly choose `reader-focus`, limited to an allowlisted visible Scenario
set, when focus-following behavior is the pedagogical intent. It is never an
implicit consequence of changing focus.

An independent `BriefingTemplate` is not a V1 domain root. Authors may duplicate
a Placement or copy its Briefing. A reusable template can be introduced later
only if repeated cross-Article authoring demonstrates a lifecycle that cannot
be served by copy-on-place.

## 4. Briefing authoring flow

The Article owns the final Briefing. The Workbench right drawer is a convenient
composer and handoff, not a second durable Briefing owner:

```text
standalone Experiment Workbench
  → compose article projection in right drawer
  → Save current Experiment
  → create minimum-gated immutable Snapshot
  → choose or create target Article explicitly
  → insert Placement(snapshotId, copied Briefing)
  → continue editing the Placement in Article Editor
```

The Workbench drawer reuses the same role-specific Briefing editor as Article
Editor. Before an exact Snapshot exists, it supplies that editor with a
synthetic Snapshot-shaped adapter containing only current Scenario IDs/labels
and the current Surface. Its placeholder capture is non-executable,
non-qualifiable, non-persistent, and must never be handed off. At Snapshot
creation, the complete Briefing is reconciled and validated again against the
newly created immutable Snapshot before the session-only handoff is written.
Only `null` means “not initialized”; explicit empty graph/output/control arrays
remain intentional author choices.

If the author enters from an Article, `Edit in Experiment` opens the pinned
Snapshot as an exact view or an explicit fork. It never opens a mutable head and
pretends that edits update the Article automatically.

Article Editor should preview both desktop and mobile composition. Validation
rejects unknown Snapshot, Scenario, pane, output, control, or series IDs;
duplicate IDs; hidden control targets; invalid graph settings; and invalid
button values or control bindings. The portable content boundary can prove that
button values are finite and unique. The contract-aware authoring and Reader
layers additionally enforce the pinned exact model's range and lattice; when
that exact contract is unavailable, button-value authoring and execution are
disabled rather than guessed.

## 5. Reader presentation

Presentation extent is derived from:

```text
pinned Snapshot Surface
+ Placement-owned Briefing
+ content complexity
+ viewport
+ renderer policy/version
```

Extent is not durable Placement content. Pane count may contribute to the
decision, but a fixed `1 / 2..4 / 5+` rule is insufficient: one complex graph
with several series and controls may need more space than four output items.

### 5.1 Desktop

- **Inflow** is the borderless inline anchor inside article prose. It must read
  like part of the Article, not a bordered embedded application. It presents
  the primary/highest-emphasis graph or concise projection and provides the
  activation point for interaction. Activating a static inflow promotes that
  Placement to live ownership in place; it does not open a drawer.
- **Peek** is a responsive side presentation for a medium-complexity Briefing.
  Clicking its compact anchor opens a right drawer and preserves article
  reading context.
- **Fullscreen** is used for high-complexity composition or explicit reader
  expansion.

Peek/fullscreen activation is ephemeral. A renderer policy derives the initial
extent from weighted graph complexity, number of graph series, output/control
density, graph emphasis, source-pane priority, and available viewport.

### 5.2 Mobile

Mobile does not reproduce the desktop side layout at reduced width:

1. Scenario focus and selected controls remain compact and color-neutral above
   the visual surface, matching the borderless inflow interaction pattern;
2. selected graph panes form one horizontal, touch-scrollable snap/swipe row;
3. outputs follow as a vertical, readable list; desktop pixel divider
   positions are not preserved; and
4. fullscreen becomes a mobile sheet/page transition when more room is needed.

Scenario and control-target labels remain visible. A reader must not have to
infer which Scenario a value or control affects from color alone.

### 5.3 Live ownership

The one-live Article policy in DESIGN-STUDIO-003 remains unchanged: the focused
or screen-centered Placement owns the live SimulationSession, a previously
active Placement may show a labelled disposable replay, and an untouched
Placement shows a poster or graph strip. All visible Scenarios inside the one
active Placement remain live concurrently. When the document is hidden, the
active runtime pauses every Scenario; returning to the visible document resumes
only the play intent that was active before hiding. Background tabs never own a
live simulation.

## 6. Canonical URL policy

Target resource routes are:

```text
/:locale/experiments
/:locale/experiments/:experimentId

/:locale/experiments/:experimentId/snapshots/:snapshotId

/:locale/articles
/:locale/articles/new/edit
/:locale/articles/:articleId/edit
/:locale/articles/:articleId
```

- `/experiments` is the library and owns the create action. Creation allocates
  an Experiment and redirects to its canonical ID route.
- `/experiments/:experimentId` is the mutable, standalone Workbench route.
- `/experiments/:experimentId/snapshots/:snapshotId` is the immutable share,
  exact-view, and fork-source route. The route resolver/content store validates
  that the Snapshot is owned by the stated Experiment; the URL never follows
  that Experiment's mutable head. The dedicated page renders its live pinned
  composition inline rather than running it behind an Article peek anchor.
- `/articles/:articleId/edit` is the mutable Article Editor route.
- `/articles/new/edit` creates a new Article Draft and redirects to its allocated
  ID route after the first save.
- `/articles/:articleId` currently reads the mutable browser Article Draft in
  this pre-release cutover. Mapping the same route to a published/current
  Article pointer and adding immutable Article-revision identity are deferred
  until publication exists.
- Placement fragment links use `#placement-<placementId>`. A valid fragment
  activates the pinned Placement and scrolls it into the reading focus without
  changing durable focus or opening its drawer automatically.

IDs are opaque, URL-safe identifiers. URLs do not encode `modelId`, fixture,
checkpoint, Briefing JSON, color, graph window, history depth, runtime focus,
or live/cached state. Optional query parameters may request ephemeral UI focus
but are never scientific or durable identity.

Fork/clone is a command followed by redirect to the newly allocated Experiment
URL; a GET route does not mutate content.

The baseline before this direct cutover exposed `/workbench` and
`/workbench/:workbenchId`, and mounted one Article Editor at `/articles` without
an Article ID. Those routes are not retained as aliases. There is no production
content that requires URL compatibility.

## 7. Current implementation versus target

### Baseline implemented before this direct cutover

- an Article-independent Experiment Workspace and standalone Workbench;
- opaque Experiment and immutable Snapshot identities;
- Placement pinning of an exact Snapshot;
- repeated use of the same Snapshot in one or many Article Drafts;
- a provisional inline Briefing containing Scenario selection and generic pane
  picks with priority;
- a static pinned Article Editor preview; and
- referential protection against deleting Experiment Snapshot lineage used by
  another fork or Article.

### Direct-cutover contract

- role-specific graph/output/control Briefing fields and validation;
- separate visible Scenario, focus Scenario, and explicit control-binding
  semantics;
- article-local graph legend/color/window/history overrides;
- control button maps and fixed-by-default/reader-focus-opt-in bindings;
- canonical Experiment, nested Snapshot, Article Library/Editor, and Reader
  routes; and
- a live runtime owner that restores every Briefing-visible Scenario in the
  pinned Snapshot, and no hidden Scenario, without mutating Snapshot content.

The direct cutover additionally delivers a borderless one-graph inflow,
graph-count click-to-open right peek or fullscreen presentation, mobile graph
swipe, vertical output/control layout, Reader play/pause and control
application, and page-level one-live ownership.
Exact Snapshot links are exposed from the Article Snapshot picker, Placement
preview, and Reader model badge; they are not direct-URL-only implementation
details.
Non-active Placements deliberately remain static rather than masquerading as
live.

### Delivery target still requiring UI/runtime completion

- `Use in article…` plus derived `Used in N articles` backlinks;
- weighted complexity-derived presentation beyond the current graph-count
  inflow/peek/fullscreen thresholds;
- labelled disposable one-beat previews for previously active Placements;
- retained multi-release registry delivery before more than one exact model
  release must remain executable client-side;
- immutable Article publication/revision identity.

No remaining delivery-target item should be described as implemented until its
route, contract validation, persistence, responsive rendering, and resource
ownership all exist.

## 8. IA invariants

1. Experiment identity never depends on Article identity.
2. Direct Experiment use never requires or auto-creates an Article.
3. Every Placement pins one immutable Snapshot.
4. Every Briefing is owned by exactly one Placement.
5. The same Snapshot may have many independent Placements and Briefings.
6. Briefing edits cannot mutate Snapshot or Experiment content.
7. Visible Scenario selection, initial focus, and control targets are distinct.
8. Article control bindings are explicit, visible, and nonempty. Fixed is the
   pickup default; reader-focus is an explicit opt-in over visible Scenarios.
9. Graph overrides remain inside the selected registered graph contract.
10. Output and control items do not own presentation colors.
11. Responsive extent and pixel geometry are derived, not durable identity.
12. Cached Reader presentation is never a scientific or Snapshot authority.
13. Parent Snapshot lineage never means Article ownership or auto-update.
14. DESIGN-STUDIO-002 remains historical Git context, not an implementation
    dependency.
