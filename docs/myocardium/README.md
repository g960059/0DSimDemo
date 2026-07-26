# Myocardium documentation

## What describes the model the browser runs

Nothing in this directory does. The authoritative statement of the shipped
model is the code: the session claim in
`engine/scientific/runtime/MainWireScientificSessionV1.ts`, the release in
`engine/scientific/assembly/mainWireAdultFiveWallNonCoronaryReleaseV1.ts`, and
the wall provider in
`engine/myocardium/mechanics/MainWireFiveWallLandTriSegProviderV1.ts`. Together
they declare a fixed normal-adult five-wall non-coronary assembly. All five
walls carry Land active material with equilibrium passive material and a
parallel one-state SLS branch; energy-conjugate TriSeg is the ventricular
geometry only, and LA/RA use fixed-wall self-similar one-fiber geometry. A
common pericardium and a quasi-steady orifice valve preset complete it, with no
coronary or device graph.

The two documents below describe the mechanics but neither claims to be that
statement:

- [model-spec/mainwire-four-chamber-land-triseg-v1.ja.md](model-spec/mainwire-four-chamber-land-triseg-v1.ja.md)
  records the **structural design decisions** for the four-chamber mechanics —
  which candidates were adopted and which were rejected, including the shared
  long-axis coordinate and independent per-valve flow inertance. Read its own
  status section first: it declares itself a research sidecar with its own
  Backward Euler transaction and explicitly does not claim to be the browser
  runtime.
- [model-spec/four-chamber-triseg-land-v1.md](model-spec/four-chamber-triseg-land-v1.md)
  (`.ja.md` is the Japanese edition) is the **target specification**: the
  intended v1 model, its claim boundary, its verification gates (§19), and its
  implementation sequence (§21).

Two divergences between the target specification and what ships: the shipped
model uses a quasi-steady orifice valve rather than the specification's
per-valve inertial state, and `PVein_LA` carries no venous-inlet inertance
(`pvOstialInertanceL` is 0 in `engine/core/topology.ts`).

## What was retired

The MechanicsCore2 / AV-plane sidecar and the ModelCore+Land boundary lane were
removed from the working tree: their components, benches, one-off verify
scripts, pinned diagnostic artifacts, and lane documents. They remain in git
history and in the pull requests that produced it. See
[../README.md](../README.md) for the recovery command.

The retirement is not exhaustive. Some early Phase 1–3 sources and protocol
packs stayed — the periodic activation scheduler, the state-layout builder, the
calcium/Land protocol packs, and the thick-sphere and generalized-force work —
because release manifests and surviving engine code still reference parts of
that set. They are retained historical evidence, not an active lane; treat them
as read-only until something needs them again.

## What the retained artifacts under `data/myocardium/protocols` do and do not promise

One of them is load-bearing at runtime:
`modelcore-land-calcium-unit-interface-audit-result-v1.json` supplies the
calcium scale that `engine/myocardium/runtimeActiveSource.ts` imports. The
artifacts it names through `*ArtifactId` fields are retained with it, so the
provenance of that number is traceable without leaving the repository. That
chain is closed: every `*ArtifactId` in a retained artifact resolves to another
retained artifact.

Nothing else about those artifacts is guaranteed to resolve. They are preserved
as immutable evidence of runs that happened, so some of the names inside them —
`verifierScript` aliases, `sourceEvidence` paths, embedded reproduction
commands — refer to scripts, tools, and files that were retired with their
lanes; those resolve in git history rather than in the working tree. Some still
resolve: the PV-loop morphology quality runner named in one of the reproduction
commands is still here. The artifacts are not edited to annotate which is which,
because the point of immutable evidence is that it is not rewritten after the
fact. To rerun one whose tooling is gone, check out a commit from before the
retirement.

The practical rule: read a retained artifact for what it recorded, not as a
command you can run today.

## Read order

| Priority | Document | Purpose |
|---:|---|---|
| 1 | [model-spec/mainwire-four-chamber-land-triseg-v1.ja.md](model-spec/mainwire-four-chamber-land-triseg-v1.ja.md) | As-implemented four-chamber design boundary |
| 2 | [model-spec/four-chamber-triseg-land-v1.md](model-spec/four-chamber-triseg-land-v1.md) | Target model, claim boundary, gates, implementation sequence |
| 3 | [model-spec/myocardium-land-v1.md](model-spec/myocardium-land-v1.md) | Land source contract: equations, units, state, solver |
| 3a | [model-spec/atrial-bridge-v1.md](model-spec/atrial-bridge-v1.md) | Atrial bridge model contracts |
| 3b | [model-spec/landatrial-default-floor-v1.md](model-spec/landatrial-default-floor-v1.md) | LandAtrial default floor contract |
| 4 | [adr/ADR-MYO-001.md](adr/ADR-MYO-001.md) | Scope, decision, and consequences of the contraction-model replacement |
| 4a | [adr/ADR-MYO-002-atrial-bridge.md](adr/ADR-MYO-002-atrial-bridge.md) | Atrial bridge decision record |
| 5 | [verification/mainwire-normal-adult-five-wall-periodic-v1.ja.md](verification/mainwire-normal-adult-five-wall-periodic-v1.ja.md) | Normal-adult five-wall periodic verification |
| 5a | [verification/mainwire-full-land-membrane-pericardium-v1.ja.md](verification/mainwire-full-land-membrane-pericardium-v1.ja.md) | Full-Land membrane and pericardium verification |
| 5b | [main-wire-valve-disease-presets-v1.md](main-wire-valve-disease-presets-v1.md) | Valve disease preset verification |
| 5c | [verification/myocardium-v1-verification.md](verification/myocardium-v1-verification.md) | Verification tiers and GO/REVISE/NO-GO gates |
| 5d | [verification/pv-loop-morphology-quality.md](verification/pv-loop-morphology-quality.md) | LV/RV PV-loop phase segmentation and quality readouts |
| 5e | [verification/reusable-morphology-check-v1.md](verification/reusable-morphology-check-v1.md) | Reusable morphology check contract |
| 5f | [verification/morphology-gate-physiology-audit-v1.md](verification/morphology-gate-physiology-audit-v1.md) | Report-only physiology-aware morphology audit layer |
| 5g | [verification/morphology-to-myocardium-handshake.md](verification/morphology-to-myocardium-handshake.md) | Handshake between the morphology and myocardium lanes |
| 5h | [verification/landatrial-isolated-bench-v1.md](verification/landatrial-isolated-bench-v1.md) | LandAtrial isolated bench contract |
| 5i | [verification/isolated-arterial-bench-v1.md](verification/isolated-arterial-bench-v1.md) | Isolated arterial bench contract |
| 5j | [verification/atrial-bridge-v1-verification.md](verification/atrial-bridge-v1-verification.md) | Atrial bridge verification gate |
| 6 | [morphology/README.md](morphology/README.md) | Morphology lane ownership and result classes |
| 7 | [research/myocardial-contraction-rebuild-design-record.md](research/myocardial-contraction-rebuild-design-record.md) | Background rationale and design discussion |
| 8 | [references/myocardium-source-registry.md](references/myocardium-source-registry.md) | Literature source registry |
| 9 | [review-notes/phase2b-level3-review-deltas.md](review-notes/phase2b-level3-review-deltas.md) | PR #166 Phase 2B and Level 3 review deltas |

## Adding a new check

A one-off probe belongs in a pull request or a report. Add an npm script, a
document, and a pinned artifact only for a check that protects a forward
invariant; a check that only re-hashes a pinned artifact does not.
