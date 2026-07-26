# Myocardium documentation

The normative owner of the mechanics model is
[model-spec/four-chamber-triseg-land-v1.md](model-spec/four-chamber-triseg-land-v1.md).
It defines the target four-chamber model (LA/RA one-fiber walls, LVFW/SEP/RVFW
TriSeg, prescribed-Ca plus Land 2017 active material, equilibrium passive plus
SLS, common pericardium, closed loops, index-1 DAE), its claim boundary, its
verification gates (§19), and its implementation sequence (§21). It is a
specification; it does not state what the current runtime implements.

The per-phase experiment history of the earlier rebuild — Phase 5C ModelCore and
Land boundary probes, arterial-root Zc studies, atrial-bridge shootouts,
developer-flag and default-flip RFCs, and their pinned JSON artifacts — was
removed from the working tree. It remains in git history and in the PRs that
produced it. See [../README.md](../README.md) for the recovery command and the
working policy.

## Read order

| Priority | Document | Purpose |
|---:|---|---|
| 1 | [model-spec/four-chamber-triseg-land-v1.md](model-spec/four-chamber-triseg-land-v1.md) | Target model, claim boundary, gates, implementation sequence (`.ja.md` is the Japanese edition) |
| 2 | [model-spec/myocardium-land-v1.md](model-spec/myocardium-land-v1.md) | Land source contract: equations, units, state, solver |
| 2a | [model-spec/atrial-bridge-v1.md](model-spec/atrial-bridge-v1.md) | Atrial bridge model contracts |
| 2b | [model-spec/landatrial-default-floor-v1.md](model-spec/landatrial-default-floor-v1.md) | LandAtrial default floor contract |
| 3 | [adr/ADR-MYO-001.md](adr/ADR-MYO-001.md) | Scope, decision, and consequences of the contraction-model replacement |
| 3a | [adr/ADR-MYO-002-atrial-bridge.md](adr/ADR-MYO-002-atrial-bridge.md) | Atrial bridge decision record |
| 4 | [verification/myocardium-v1-verification.md](verification/myocardium-v1-verification.md) | Verification tiers and GO/REVISE/NO-GO gates |
| 4a | [verification/pv-loop-morphology-quality.md](verification/pv-loop-morphology-quality.md) | LV/RV PV-loop phase segmentation and quality readouts |
| 4b | [verification/reusable-morphology-check-v1.md](verification/reusable-morphology-check-v1.md) | Reusable morphology check contract |
| 4c | [verification/morphology-gate-physiology-audit-v1.md](verification/morphology-gate-physiology-audit-v1.md) | Report-only physiology-aware morphology audit layer |
| 4d | [verification/morphology-to-myocardium-handshake.md](verification/morphology-to-myocardium-handshake.md) | Handshake between the morphology and myocardium lanes |
| 4e | [verification/landatrial-isolated-bench-v1.md](verification/landatrial-isolated-bench-v1.md) | LandAtrial isolated bench contract |
| 4f | [verification/isolated-arterial-bench-v1.md](verification/isolated-arterial-bench-v1.md) | Isolated arterial bench contract |
| 4g | [verification/atrial-bridge-v1-verification.md](verification/atrial-bridge-v1-verification.md) | Atrial bridge verification gate |
| 5 | [morphology/README.md](morphology/README.md) | Morphology lane ownership and result classes |
| 6 | [research/myocardial-contraction-rebuild-design-record.md](research/myocardial-contraction-rebuild-design-record.md) | Background rationale and design discussion |
| 7 | [references/myocardium-source-registry.md](references/myocardium-source-registry.md) | Literature source registry |
| 8 | [review-notes/phase2b-level3-review-deltas.md](review-notes/phase2b-level3-review-deltas.md) | PR #166 Phase 2B and Level 3 review deltas |

When these documents disagree, use this precedence:

```text
four-chamber-triseg-land-v1 (target model)
> accepted ADR
> component model spec
> verification plan
> design record
```

## Component oracles

The verifications that survived the diagnostic prune are the ones the target
model still needs; they cover the Phase A1 component-oracle set in the spec.

```bash
npm run verify:myocardium-contracts
npm run verify:myocardium-land-source
npm run verify:myocardium-land-protocols
npm run verify:myocardium-prescribed-calcium
npm run verify:myocardium-calcium-land-isometric
npm run verify:myocardium-prescribed-shortening
npm run verify:myocardium-thick-sphere-kinematics
npm run verify:myocardium-generalized-forces
npm run verify:myocardium-minimal-loaded-chamber
npm run verify:myocardium-passive-energy-readiness
npm run verify:myocardium-tissue-homogenization-readiness
npm run verify:myocardium-generalized-force-mapper-readiness
npm run verify:myocardium-land-active-stress-replacement
npm run verify:myocardium-selected-mechanics-calibration-readiness
npm run verify:myocardium-local-monolithic-coupling-readiness
npm run verify:myocardium-local-monolithic-sdirk2-readiness
```

Their protocol packs live in `data/myocardium/protocols/`, and their assertions
in `__tests__/myocardiumPhase*.test.ts`.

## Adding a new check

Follow the working policy in [../README.md](../README.md). A one-off probe
belongs in a PR or a report. Add an npm script, a document, and a pinned
artifact only for a check that protects a forward invariant.
