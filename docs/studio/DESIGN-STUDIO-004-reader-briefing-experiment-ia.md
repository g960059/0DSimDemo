# CircleHeart Studio — Reader, Briefing, and Experiment IA

Status: authoritative pre-release product and Article contract

Date: 2026-08-06

Decision: an Article Placement pins one neutral immutable
`ExperimentSnapshot` and owns one resolved `Briefing`. Briefing is an Article
projection, not Snapshot identity. Inflow, Peek, and Fullscreen all render the
same effective graph definitions sealed by the author.

This document complements
`DESIGN-STUDIO-003-experiment-data-architecture.md`. It does not restore a
Working Set entity, Reader Brief entity, manual display-mode field,
certification hierarchy, or Snapshot variant/lineage model.

## 1. Audience and product entry points

CircleHeart serves:

- beginners such as early residents and medical engineers, who need guided
  explanation and constrained controls;
- experienced clinicians, who often want a standalone simulation; and
- haemodynamics/model researchers, who need raw inputs, formal analyses,
  model disclosure, and reproducible captures without repository jargon.

There are two content entry points:

```text
Articles      narrative containing purpose-built Experiment Placements
Simulations   explicitly saved Experiments opened in Workbench
```

Progressive disclosure happens within the same product. An Experiment never
requires or auto-creates an Article. An Article may create many disposable
Sessions and Snapshots without filling My Simulations with unwanted drafts.

## 2. Global and task shells

Discovery/reader pages use a small global header:

```text
anonymous      CircleHeart      language · theme · Start simulation · Login
authenticated  CircleHeart                 theme · Create ▾ · account
```

The wordmark returns Home. Authenticated Create offers New simulation and New
article. My Simulations, My Articles, locale, and account actions live under
the profile menu. Public directories are reached from curated Home sections,
not persistent header links.

Article Editor and ExperimentSession use contextual task headers rather than a
second stacked global header. Repository IDs, codec/schema names, Snapshot
gate names, and exact release digests never appear in ordinary UI. The
simulation information dialog presents human-facing model name, limitations,
validation context, and per-Scenario runtime status.

## 3. Ownership graph

```text
ExperimentSession
  ├─ explicit Save ─────────────→ Experiment
  ├─ common Snapshot admission ─→ ExperimentSnapshot
  │    └─ publish saved Experiment by moving its public pointer
  └─ common Snapshot admission ─→ ExperimentSnapshot
       └─ Article block owns Placement(snapshotId + Briefing)

ArticleContent
  └─ blocks[]
       └─ ExperimentPlacement
            ├─ snapshotId ──────→ neutral ExperimentSnapshot
            └─ briefing          immutable Article-local projection
```

Consequences:

1. Experiment, Snapshot, and Article lifecycles are independent.
2. Article placement does not require saving an Experiment.
3. Snapshot contains complete executable content but no Article projection.
4. Briefing changes are ordinary Article edits and do not mutate Snapshot.
5. A Placement never follows a mutable Experiment head.
6. Deleting an Experiment cannot invalidate a retained Article Placement.
7. Experiment backlinks are derived from Article Placements; Experiment does
   not store `articleIds`.

## 4. Placement and Briefing contracts

```ts
type ExperimentPlacement = Readonly<{
  schemaId: "circleheart-studio-experiment-placement-v2";
  placementId: string;
  snapshotId: string;
  briefing: ExperimentPlacementBriefing;
  titleOverride: string | null;
  caption: string | null;
}>;

type ExperimentPlacementBriefing = Readonly<{
  defaultTitle: string;
  scenarioScope: Readonly<{
    visibleScenarioIds: readonly string[];
    initialFocusScenarioId: string;
  }>;
  graphs: readonly GraphBriefing[];
  outputs: readonly OutputBriefingItem[];
  controls: readonly ControlBriefingControl[];
}>;
```

`defaultTitle` is copied from the source simulation at seal time.
`titleOverride` is the Article author's later local copy edit. Caption and
title edits do not require another numerical capture.

Visible scope, initial focus, output targets, and control targets are separate
concepts. Every focused or fixed target must be in `visibleScenarioIds`.

## 5. Briefing composition

Briefing is composed against a frozen source Surface while live numerical time
may continue. Scenario structure, pane structure, or labels changing during
composition makes the source stale and requires review. At seal time the
Briefing is copied by value into the Article Placement.

### 5.1 Graph pickup

One graph entry selects a complete custom graph pane and may carry only
allowlisted Article overrides:

- label and legend density;
- series narrowing and labels;
- exact `(scenarioId, seriesId)` colors;
- waveform window; and
- PV/structural history depth.

The effective Reader graph is:

```text
Snapshot Surface graph pane + Placement Briefing overrides
```

Renderer identity, Scenario scope, exact trace exclusions, structural side,
and PV analysis semantics are not replaced by a simplified Reader graph.

### 5.2 Output pickup

Outputs are selected as individual items from a captured Output pane. Each
entry copies source pane, output ID, label, order, and the concrete Scenario
resolved at seal time. Later Scenario Manager changes cannot retarget it.
Output presentation stays color-neutral.

### 5.3 Control pickup

Controls copy source pane, control ID, label, order, slider/button
presentation, and materialized Scenario binding. `active-slot` becomes a
concrete fixed Scenario at seal time. `reader-focus` is available only as an
explicit author choice constrained to visible Scenarios.

Custom buttons constrain beginner-facing choices without creating a durable
ParameterSet; every click remains an ordinary absolute control assignment.

## 6. Authoring workflows

### 6.1 From a saved Experiment

```text
open Experiment
  → optionally modify the Session
  → open Briefing composer
  → select Scenario scope, graphs, outputs, controls
  → atomically capture and admit one neutral Snapshot
  → return to Article Editor with snapshotId + resolved Briefing
  → insert Placement
  → save Article
```

The source Experiment need not be saved again. Its version does not change.

### 6.2 Directly from Article Editor

```text
insert simulation block
  → save current Article draft boundary
  → mint ephemeral sessionToken
  → open /experiments/new?articleSession=...
  → compose/run a disposable Session
  → seal Snapshot + Briefing
  → return and insert Placement
```

`sessionToken`, not `experimentId`, correlates the handoff. Completion is
single-use and same-tab/session scoped. Closing without completion leaves no
Experiment. A short-lived unreferenced Snapshot is reclaimed by GC if Article
save never establishes the Placement reference.

### 6.3 Editing a placed simulation

Briefing/title/caption edits are Article edits against the same pinned
Snapshot. Numerical or Surface edits open a disposable ExperimentSession from
Snapshot content. Saving that Session creates a new Experiment only when the
user explicitly chooses Save. Replacing the Article placement requires a new
admitted Snapshot and updated Briefing.

## 7. Article Editor behavior

The editor is a block editor. Experiment blocks show the same derived Inflow
or Peek affordance as Reader, not a separate always-Inflow mock. No fabricated
live values are displayed in a static editing placeholder.

For Peek placements, opening the preview pushes the article canvas left and
slides the simulation in from the right. The divider is draggable. The title
at the top is the Placement title and is directly editable in authoring mode.
Closing reverses the transition. The header keeps only back, publish state,
save state, and actions that are required for the current task.

## 8. Derived presentation extent

Authors do not store `inflow | peek | fullscreen`. Extent is derived from the
sealed role count and complexity:

```text
desktop
  one compact graph/role composition    → Inflow
  two to four substantial panes         → Peek
  larger composition                    → launch affordance / Fullscreen

mobile
  selected content                      → one swipeable compact composition
```

The current first-order policy may use graph count; complexity weighting is an
implementation refinement. Extent changes layout only, never graph semantics.

## 9. Reader runtime

### 9.1 Inflow

Inflow is border-light and article-native. It renders the exact selected graph
definition, outputs, and allowed controls without Workbench chrome.

### 9.2 Peek

Peek is a push layout, not an overlay. Article remains on the left, simulation
occupies a resizable right pane, and close slides it out to the right. The
title/chevron affordance is the only clickable opening target; model jargon is
not a second hidden link.

### 9.3 Fullscreen

Fullscreen opens an `ExperimentSession` initialized from the pinned Snapshot
and constrained by Briefing. It is not merely a larger canvas. The reader can
fork and explore; saving creates a new Experiment only by explicit action.

### 9.4 Same renderer everywhere

Inflow, Peek, and Fullscreen use the same registered graph renderer and
effective graph definition. They preserve selected items, labels, colors,
window, history, ESPVR/EDPVR mode, and structural analysis policy. Pixel extent
and density may differ; authored meaning may not.

### 9.5 Live ownership

The screen-centered/active Placement owns live simulation. Every visible
Scenario inside that Placement runs live concurrently. Inactive placements
show a clearly identified cached complete beat when available; cache is
presentation-only and never qualifies a Snapshot or computes scientific
metrics.

## 10. Routes

Private authoring routes use opaque IDs without user IDs. Public Article
routes use the publication slug so the durable URL is readable and can be
served directly to search, accessibility and AI clients:

```text
/:locale/experiments/new
/:locale/experiments/:experimentId
/:locale/experiments/:experimentId/edit        optional explicit edit alias
/:locale/articles/:publicSlug
/:locale/articles/:articleId/edit
```

Ownership comes from Auth/RLS, not URL nesting. A still-public UUID Reader URL
is only a compatibility alias and redirects to the publication slug. My
Simulations and My Articles are account-filtered directories, not
`/userId/...` resources. DESIGN-STUDIO-008 defines the public HTTP boundary.

## 11. UI language

User-facing copy prefers Simulation, Article, Save, Publish, Stability,
Numerical checks, Model, Limitations, and Validation. It avoids immutable
Snapshot, exact model ID, fixture schema, checkpoint codec, operation receipt,
and admission gate unless a developer diagnostic surface explicitly requests
them.

Researchers in the target audience are haemodynamics/model researchers, not
repository implementers. Advanced disclosure therefore adds physiological
meaning, equations, assumptions, validation scope, and limitations—not storage
or protocol identifiers.

## 12. Required invariants

1. Every Placement owns exactly one resolved Briefing and pins one neutral
   immutable Snapshot.
2. Briefing never follows mutable Workbench active-slot state after seal.
3. Article placement can originate from an unsaved Session.
4. Article Save, not handoff completion alone, establishes durable placement.
5. Inflow, Peek, and Fullscreen preserve effective graph semantics.
6. Fullscreen opens a Session; it never mutates the pinned Snapshot.
7. A reader fork creates no Experiment until explicit Save.
8. Article and public Experiment use the same Snapshot admission contract.
9. Presentation extent is derived and is not durable content.
10. Repo-specific identifiers and backend concepts remain outside ordinary
    author and reader UI.
