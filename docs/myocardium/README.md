# Myocardium documentation

Two documents describe the four-chamber mechanics, and they answer different
questions:

- [model-spec/mainwire-four-chamber-land-triseg-v1.ja.md](model-spec/mainwire-four-chamber-land-triseg-v1.ja.md)
  is the **as-implemented design boundary** for the main-wire five-wall
  Land–TriSeg model that the browser session runs. It records the structural
  decisions that were actually taken and reversed, including the rejection of
  a shared long-axis coordinate and of independent per-valve flow inertance in
  favour of a quasi-steady orifice.
- [model-spec/four-chamber-triseg-land-v1.md](model-spec/four-chamber-triseg-land-v1.md)
  (`.ja.md` is the Japanese edition) is the **target specification**: the
  intended v1 model, its claim boundary, its verification gates (§19), and its
  implementation sequence (§21).

Where they disagree, the as-implemented document wins for statements about the
current model and the target specification wins for statements about intent.
Two known divergences: the implementation uses a quasi-steady orifice valve
rather than the specification's per-valve inertial state, and it currently
carries no venous-inlet inertance. Both are recorded in the as-implemented
document.

The per-phase experiment history of the earlier rebuild — Phase 5C ModelCore
and Land boundary probes, arterial-root Zc studies, atrial-bridge shootouts,
developer-flag and default-flip RFCs, the MechanicsCore2 AV-plane sidecar, and
their pinned JSON artifacts — was removed from the working tree. It remains in
git history and in the pull requests that produced it. See
[../README.md](../README.md) for the recovery command.

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
