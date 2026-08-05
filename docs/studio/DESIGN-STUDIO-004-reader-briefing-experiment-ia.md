# CircleHeart Studio — Reader, Briefing, and Experiment IA

Status: authoritative pre-release product and Article contract

Date: 2026-08-05

Decision: Articles place immutable Article Snapshots. Each Article Snapshot
contains both complete Experiment content and the exact Briefing authored for
that use. Placement owns only article position and caption.

This document is the companion to
`DESIGN-STUDIO-003-experiment-data-architecture.md`. It does not restore a
Working Set entity, detached Reader Brief, manual display-mode field,
certification hierarchy, or Snapshot lineage.

## 1. Audience and top-level IA

CircleHeart serves three overlapping groups:

- beginners, including early residents and medical engineers, who need guided
  explanation and deliberately constrained controls;
- experienced clinicians, who often want a standalone interactive laboratory;
  and
- haemodynamics researchers, who need raw parameters, scientifically meaningful
  model disclosure, richer comparisons, and reproducible immutable captures.

The product has two entry points, not three role-specific products:

```text
Articles
  narrative + purpose-built Article Snapshots

Experiments
  explicitly saved laboratories opened in Workbench
```

Progressive disclosure happens inside the same UI. Beginners see authored
controls and concise outputs; advanced users can open catalogs, human-facing
model information, raw parameters, formal analyses, and full Snapshot content.

An Experiment never requires or auto-creates an Article. A clinician may use
Workbench indefinitely with no Briefing. An Article may create five disposable
Sessions and five Article Snapshots without adding five Experiments to the
author’s library.

### 1.1 Site shell and task shell

Discovery pages share one stable, deliberately small site header:

```text
anonymous      CircleHeart      locale · theme · Start simulation · Login
authenticated  CircleHeart               theme · Create ▾ · account
```

The wordmark returns Home. For an anonymous visitor, `Start simulation` opens
the identity-less `/experiments/new` Session directly. An authenticated author
instead sees one familiar `Create` menu with `New simulation` and `New article`.
Anonymous visitors see the compact locale switch and Login; authenticated
users do not see locale in the header and change it under Account settings.
The account menu owns My Simulations and My Articles.

Architecture names remain `Experiment`, `ExperimentSession`, and Article.
Product copy deliberately presents an Experiment as a **simulation**. “Case”
is a content subtype rather than the umbrella name because mechanism studies,
device comparisons, and research parameter sweeps are not necessarily patient
cases. “Article” remains the umbrella publishing term; lesson, case review, and
research note may later be article categories.

Home, public directories, Article Reader, and account-management pages use
this Global Shell. Article Editor, ExperimentSession, and Snapshot inspection
use their own contextual task chrome and never stack a second global header.
Mobile does not add a duplicate bottom navigation bar.

Home is the discovery hub: it presents a small curated/public subset of
Experiments and Articles, with explicit “more” links to the complete public
directories. Public discovery never shares a route or list with private Draft
management.

## 2. Ownership graph

```text
ExperimentSession
  ├─ explicit Save ─────────────→ Experiment
  ├─ Save, then Publish ────────→ PublicationSnapshot
  └─ Brief for Article ─────────→ ArticleSnapshot(content + briefing)

Article
  └─ blocks[]
       └─ ExperimentPlacement
            ├─ snapshotId ──────→ ArticleSnapshot
            └─ caption
```

The consequences are normative:

1. Experiment, Snapshot, and Article lifecycles are independent.
2. Article Snapshot creation does not require an Experiment Save.
3. Briefing is not an Article field, Placement field, Session handoff record,
   or reusable template. It is nested in the immutable Article Snapshot.
4. Placement cannot pair one Snapshot with a different Briefing.
5. Changing any Briefing choice creates a new Article Snapshot.
6. Later Session/Experiment changes cannot alter an existing Article.
7. Deleting an Experiment never invalidates a retained Snapshot or Article.
8. Experiment does not carry `articleIds`; backlinks are derived by indexing
   Article Placements.

The same Article Snapshot may be placed more than once only with the same
captured projection. A new audience angle, label, binding, graph selection, or
window is a new Article Snapshot, even when the underlying numerical content
is otherwise identical.

## 3. Minimal Placement, inseparable Briefing

```ts
type ExperimentPlacement = Readonly<{
  schemaId: "circleheart-studio-experiment-placement-v2";
  placementId: string;
  snapshotId: string;
  titleOverride: string | null;
  caption: string | null;
}>;

type ArticleExperimentSnapshot = Readonly<{
  kind: "article";
  snapshotId: string;
  content: ExperimentContent;
  briefing: ExperimentPlacementBriefing;
  createdAt: string;
}>;
```

Placement is intentionally article-owned and small. Reordering a block,
changing its caption, or changing its display title does not manufacture a new
scientific artifact. Changing what the Reader can see or control does, because
that projection is captured with the exact executable content.

`PublicationSnapshot` cannot be placed directly in an Article. An author may
open it in a disposable Session, compose a Briefing, and capture a new Article
Snapshot.

## 4. Briefing contract

Briefing answers five distinct questions:

1. which authoring-time Experiment title is the default Placement title;
2. which Scenarios the Reader may see;
3. which Scenario initially owns Reader focus;
4. which graph panes and output/control items are present; and
5. which exact Scenario each output and each published control targets.

```ts
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

Visible scope, focus, output binding, and control binding are not aliases.
Every focused, allowed, or fixed-target Scenario must be in
`visibleScenarioIds`.

### 4.1 Graph pickup

A graph entry selects one complete custom graph pane from the captured
Surface. It may contain article-specific, allowlisted overrides:

- label and legend density;
- series narrowing and labels;
- exact `(scenarioId, seriesId)` colors;
- waveform window; and
- PV/structural history depth.

Graph pickup preserves the source pane’s renderer, Scenario scope, trace
exclusions, structural side, and analysis semantics. It does not accept
arbitrary renderer JSON.

At seal time, the Reader graph is defined as:

```text
effective Reader graph
  = exact graph pane captured in Article Snapshot content
  + allowlisted Briefing overrides captured in the same Article Snapshot
```

That one effective graph is consumed by the same registered renderer and the
same Canvas implementation in Inflow, Peek, and Fullscreen. Presentation
extent may change available pixels, but it must not substitute a simplified
graph definition. In particular, selected series and labels, exact trace
colors, Scenario exclusions, waveform window, history depth, structural side,
and PV analysis mode (including ESPVR/EDPVR policy) remain identical.

One graph pane keeps one pane-level Scenario binding. Fine-grained sparse
comparison uses exact trace exclusions; authors are not forced to configure a
binding for every item.

### 4.2 Output pickup

Outputs are selected as individual items already present in one captured
Output pane. A picked output copies its `sourcePaneId`, `outputId`, label,
order, and concrete `scenarioId`. If the source pane uses `active-slot`, the
current Scenario is materialized at pickup/seal time. A later Scenario Manager
selection cannot silently retarget the Article output.

Output presentation remains color-neutral. The same metric may be picked from
multiple fixed panes to present an explicit Scenario comparison; each entry
keeps its Scenario identity instead of relying on color or Reader focus. This
also keeps Output and Controller authoring consistent: one source pane owns one
binding, while Briefing freezes that binding by value.

### 4.3 Control pickup

Controls are selected from an existing controller pane. A picked control
copies by value:

- source pane and control identity;
- label and order;
- slider or allowlisted button presentation; and
- materialized Scenario binding.

Workbench `active-slot` becomes the actual fixed Scenario identity at capture
time. A later Scenario Manager selection cannot silently retarget an Article
control. `reader-focus` is an explicit author option constrained to visible
Scenarios; it is never inferred.

Button values must satisfy the exact model control range and lattice. Missing
exact-model contracts disable editing/execution instead of guessing.

## 5. Authoring flows

### 5.1 From a saved Experiment

```text
open Experiment in Workbench
  → optionally edit the Session
  → open Briefing composer
  → pick Scenario scope, graphs, outputs, and controls
  → capture minimum-gated Article Snapshot(content + briefing)
  → return to Article Editor
  → insert Placement(snapshotId, caption)
  → save Article
```

The Experiment need not be saved again. Capturing the Article Snapshot does
not change its version.

### 5.2 Directly from Article Editor

```text
insert Experiment block
  → save Article Draft and remember exact block boundary in session storage
  → mint an ephemeral sessionToken
  → open /experiments/new as a disposable ExperimentSession
  → compose/run the Experiment and Briefing
  → capture Article Snapshot
  → return and insert Placement at the remembered boundary
```

This flow creates no My Experiments item unless the author separately presses
Save in Workbench. Losing or cancelling the transient return handoff creates
no inferred Placement and no Experiment.

The handoff is correlated by `sessionToken`, never by a prospective
`experimentId`, and carries navigation intent only. It does not carry a
detached Briefing: the completed Article Snapshot already contains the durable
Briefing. After return, the completed handoff remains in session storage until
the Article itself is saved. Reloading before Article Save therefore restores
the same exact Placement instead of losing it; confirmed discard clears it.

### 5.3 Edit an embedded Snapshot

Article Snapshot is immutable. “Open in Workbench” creates a disposable
Session from its content and preloads its Briefing as an authoring starting
point. The author may:

- capture a new Article Snapshot and replace/insert a Placement;
- explicitly Save a new Experiment and optionally publish it; or
- leave without persistence.

There is no direct Snapshot update and no parent/source Snapshot pointer.

## 6. Briefing composer IA

The Brief action appears only with explicit Article context: an Article-origin
handoff, an Article Snapshot edit, or a deliberate “Use in article” action.
Standalone Workbench omits it so clinical users are not shown irrelevant
publishing concepts.

The composer is a right push drawer, not an overlay. It reduces the Workbench
canvas width, slides in from the right, and slides out toward the right. Motion
uses only transform/opacity, respects reduced motion, and stays short enough to
preserve direct manipulation.

The composer freezes the source projection it opened against. While open,
later active-Scenario, pane-binding, or pane-membership changes do not silently
retarget the in-progress Briefing. The author explicitly closes/reopens or
recaptures, then creates a new immutable Article Snapshot.

The frozen Surface, rather than the later live Surface, is supplied to Article
Snapshot capture. If Scenario membership, order, or labels change while the
drawer is open, capture fails visibly and asks the author to reopen the
composer. Opening moves focus to the drawer close action; closing immediately
makes the exiting drawer inert and restores focus to its opener.

Surface and Briefing mutation revisions are checked again after asynchronous
qualification and before persistence. An edit made after capture starts never
gets cleared or lost by the Article return handoff; the author remains in the
Workbench and retries from the newer projection.

Pressing the capture action begins a short **Briefing seal**. The frozen
Briefing editor, close action, and repeated capture action are inert until that
seal succeeds or fails. Numerical qualification runs from an on-demand exact
fork in the shared background Worker pool while live graphs resume immediately.
This avoids a late Scenario-focus or binding edit changing the artifact being
committed, without keeping the composer locked before the author explicitly
requests capture.

Article seal uses the exact model's numerical-safety profile, not its
Publication settlement profile. It restores the atomic click-time capture and
runs one complete verification cycle. The saved Article Snapshot retains that
click-time checkpoint and makes no settlement claim. Publication remains the
strict period-1-settled path.

There is no “Save Briefing” command. The capture action persists the Briefing
inside an Article Snapshot; saving the Article persists its Placement.

## 7. Article Editor IA

Article authoring uses one Notion-like ordered block document:

- paragraph, heading, and Experiment blocks share one flow;
- a quiet left gutter owns insert and drag handles;
- Enter splits text; Backspace removes an empty block;
- `/` in an empty block opens insertion; and
- block chrome appears on hover/focus, not during ordinary reading.

The Snapshot picker lists only Article Snapshots. Publication Snapshots are
not silently given default Briefings inside an Article.

An Experiment block previews its immutable Article Snapshot with the same
derived extent rule as Reader. One graph receives the complete inflow preview;
two to four graphs receive one compact Peek anchor; larger projections receive
one fullscreen anchor. Editor must not render a multi-graph inflow card that
Reader later presents as Peek.

The compact anchor defaults to `briefing.defaultTitle`, captured from the
Experiment title at seal time. Peek exposes that title as a quiet inline edit;
the Article stores only `placement.titleOverride`, while caption remains a
separate optional field below the block. Clearing the override restores the
captured default. Title editing never mutates the immutable Briefing and does
not create a new Snapshot.

Article Editor and Reader use the same push Peek component, live runtime, graph
definitions, and renderers. The right companion region slides in, compresses
the document, and is resized with the same device-local divider. The block's
full Experiment edit action still opens a Session and replaces the Placement
with a newly captured Article Snapshot.

Article Editor header chrome is intentionally small: one back action, one
Draft/Public switch, and Save or Saved state. Article-list, Reader-preview,
direct-Experiment links, breadcrumbs, Snapshot counts, and duplicate Draft
labels do not compete with authoring. The editable title and document blocks
remain the page's primary hierarchy.

## 8. Reader presentation

Presentation extent is derived, not persisted:

```text
Article Snapshot content
+ nested Briefing
+ content complexity
+ viewport
+ renderer policy
```

### 8.1 Desktop

- **Inflow** is a borderless, article-native inline presentation for one
  primary graph and concise controls/outputs.
- **Peek** is used for a medium projection. Activating it opens a non-modal
  companion region from the right and reduces the article pane's available
  width; it never overlays or disables the article. A directly manipulable
  vertical divider resizes the two panes. Its header places fullscreen
  immediately before close.
- **Fullscreen** leaves the reading layout and opens the complete Article
  Snapshot as a disposable `/experiments/new` ExperimentSession. It may be
  operated freely, saved explicitly as an Experiment, or abandoned without
  persistence. A return token restores the originating Article.

Peek width is device-local Reader geometry. It may be retained in browser
storage, but never enters Article, Snapshot, Placement, or Briefing data. Open
and close follow the same right-hand path; reduced-motion clients replace the
spatial transition with an effectively immediate state change.

The product may currently approximate the policy by graph count, but the
target weighs renderer complexity, series/Scenario count, output/control
density, priority, and viewport. No `inflow | peek | fullscreen` field enters
durable data.

Each Placement renders one predictable activation target: its effective
Placement title. Reader does not add a second clickable `Live experiment` or
Snapshot breadcrumb above it. A quiet information action inside the
interactive Experiment surface opens contextual simulation status, model
validation scope, and limitations; it never opens Peek and never becomes
global Article chrome. Exact model IDs, fixture/checkpoint implementation
identities, integrity metadata, and gate names stay out of normal product UI.

### 8.2 Mobile

Mobile is a composed reading surface, not a compressed desktop. Opening Peek
pushes the Article page left and brings the Experiment page from the right; it
does not place a translucent simulation layer over the text:

1. compact Scenario focus and selected controls;
2. touch-scrollable snap/swipe graph row;
3. readable vertical outputs; and
4. sheet/page expansion for complete Snapshot interaction.

Scenario and control-target labels remain textual. Color is never the only
carrier of identity.

### 8.3 Live ownership

Only the focused/screen-centered Article Placement owns live numerical
execution at a time. Every visible Scenario inside that active Placement runs
concurrently in its own persistent Worker lane. Previously active placements
may show a labelled disposable cached beat; untouched placements show a static
preview. Replays never qualify Snapshots or compute scientific metrics.

Hidden documents pause active runtime. Returning resumes only the prior play
intent. Background tabs never own live execution.

## 9. Publication and Snapshot page

Publication is a `PublicationSnapshot` plus an Experiment-library pointer to
the currently published Snapshot. It is not a mutable view of the Experiment.
The Experiment must therefore be explicitly saved before Publish; Article
Snapshot capture remains available without saving an Experiment. Publish is
enabled only when the saved Experiment has no newer unsaved Session changes.

`/snapshots/:snapshotId` renders either variant read-only:

- Publication Snapshot uses a temporary full-content projection for display;
- Article Snapshot uses its exact nested Briefing; and
- “Open in Workbench” starts a new disposable Session.

The page has no “source Experiment” link because Snapshot does not own or
require source identity.

## 10. Experiments library

`/me/experiments` lists only resources created by explicit Save. Each row shows:

- editable Experiment title;
- Draft or Published state;
- last updated date;
- Open;
- optional published Snapshot play link; and
- Delete.

Opening New Experiment does not add a row. JSON download is not a primary user
action and is omitted. Deleting an Experiment does not delete its immutable
Snapshots or Article uses.

The Workbench header keeps title editing direct: clicking the title produces a
caret without changing its visual container. Save, play/pause, theme, and
contextual Brief actions stay in the header; elapsed model time and permanent
Article navigation do not. The center remains visually quiet: a compact
information icon in the action cluster replaces a prominent model
abbreviation. Its disclosure separates Scenario-local execution, settlement,
and numerical-check status from model-level validation scope and limitations.

## 11. URLs

```text
/:locale/experiments                     public directory
/:locale/experiments/new
/:locale/experiments/:experimentId
/:locale/snapshots/:snapshotId
/:locale/articles                        public directory
/:locale/articles/new/edit
/:locale/articles/:articleId/edit
/:locale/articles/:articleId
/:locale/me/experiments                  personal management
/:locale/me/articles                     personal management
/:locale/me/settings                     account preferences
```

User IDs are not part of canonical content URLs. Backend ownership and access
control are metadata. IDs are opaque; model IDs, hashes, fixture/checkpoint
data, Briefing JSON, layout, theme, and live focus are not encoded in paths.

An unsaved Workbench uses `/experiments/new` and has no Experiment identity.
The first successful Save allocates an opaque ID and replaces the route.
Snapshot/article edit context uses an ephemeral query token until the user
explicitly saves or captures; it is not a durable resource identity.

## 12. UI and accessibility principles

- Zenn/Claude-like quiet surfaces, restrained borders, and one typography
  scale serve both light and dark themes.
- Interactive affordances use hover/focus/pressed feedback; static outputs do
  not masquerade as buttons.
- Drawers and menus animate specific transform/opacity properties, never
  `transition: all`.
- Dockview tab action slots retain width while icons hide outside hover/active
  states, preventing layout jumps.
- Pane settings use a VS Code-like section index and a roomy editor/inspector;
  destructive pane removal lives in the tab menu, not the modal footer.
- Reduced-motion users receive immediate state changes without losing context.

## 13. Normative IA invariants

1. Direct Experiment use never requires or creates an Article.
2. Briefing appears only in explicit Article context.
3. Every Article Placement pins one Article Snapshot.
4. Every Article Snapshot owns exactly one immutable Briefing.
5. Placement owns position and caption, not projection semantics.
6. Changing a Briefing creates a new Article Snapshot.
7. Article Snapshot creation does not require saving an Experiment.
8. Opening/editing a Snapshot creates a Session and never mutates the Snapshot.
9. Visible scope, focus Scenario, output target, and control target are
   distinct.
10. Output and control bindings are captured by value; active-slot cannot leak
    into Reader.
11. Presentation extent and one-live state are derived/runtime-only.
12. My Experiments contains only explicitly saved Experiments.
13. Article handoff is correlated by an ephemeral Session token, never by an
    unsaved Experiment identity.
14. Briefing becomes inert only during the explicit seal operation.
