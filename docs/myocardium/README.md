# Myocardium Revision 3

Status: Phase 0 owner decisions accepted; Phase 3 owner GO recorded for Phase 4A dossier work only; Decision 19 owner selection recorded separately
Bundle source: local import, path redacted
Baseline repository commit: `228bef96e5f522de2cfe352de5d6d4d2f017c550`

Revision 3 is the current planning namespace for the myocardial contraction
subsystem replacement. It is not a patch plan for the existing
`ActiveStressChamberModel`. This docs/data update does not change runtime
TypeScript behavior; runtime integration still requires the later phase gates
called out below.

## Read order

| Priority | Document | Purpose |
|---:|---|---|
| 1 | [adr/ADR-MYO-001.md](adr/ADR-MYO-001.md) | Scope, decision, consequences, required owner decisions |
| 1a | [adr/ADR-MYO-002-atrial-bridge.md](adr/ADR-MYO-002-atrial-bridge.md) | Proposed superseding/additive Phase 6 atrial bridge plan |
| 2 | [model-spec/myocardium-land-v1.md](model-spec/myocardium-land-v1.md) | Normative model/API/units/state/solver contracts |
| 2a | [model-spec/atrial-bridge-v1.md](model-spec/atrial-bridge-v1.md) | Proposed atrial bridge model contracts |
| 3 | [verification/myocardium-v1-verification.md](verification/myocardium-v1-verification.md) | Target freeze, verification tiers, GO/REVISE/NO-GO gates |
| 3a | [verification/atrial-bridge-v1-verification.md](verification/atrial-bridge-v1-verification.md) | Proposed Phase 5.5 atrial bridge shootout gate |
| 3b | [verification/pv-loop-morphology-quality.md](verification/pv-loop-morphology-quality.md) | Proposed diagnostic-only common LV/RV PV-loop phase segmentation and quality readouts |
| 3c | [verification/filling-limb-artifact-audit-v1.md](verification/filling-limb-artifact-audit-v1.md) | Proposed diagnostic-only MV/TV open filling-limb artifact audit |
| 3d | [verification/arterial-load-morphology-v1.md](verification/arterial-load-morphology-v1.md) | Proposed diagnostic-only AoV/PV open ejection and arterial-load morphology audit |
| 3e | [verification/arterial-load-zc-reflection-comparator-v1.md](verification/arterial-load-zc-reflection-comparator-v1.md) | Proposed off-by-default readiness boundary for a future Zc/reflection arterial-load comparator |
| 3f | [verification/filling-limb-correlation-readiness-v1.md](verification/filling-limb-correlation-readiness-v1.md) | Proposed docs/data/verifier/test-only boundary for a future off-by-default filling-limb valve/qDot diagnostic comparator |
| 3g | [verification/filling-limb-diagnostic-comparator-v1.md](verification/filling-limb-diagnostic-comparator-v1.md) | Proposed explicit-CLI filling-limb diagnostic comparator artifact contract |
| 3h | [verification/arterial-load-zc-reflection-diagnostic-comparator-v1.md](verification/arterial-load-zc-reflection-diagnostic-comparator-v1.md) | Proposed explicit-CLI arterial-load Zc/reflection diagnostic comparator artifact contract |
| 4 | [roadmap/myocardium-rebuild-roadmap.md](roadmap/myocardium-rebuild-roadmap.md) | Phase and PR sequencing |
| 4a | [roadmap/atrial-bridge-shootout-roadmap.md](roadmap/atrial-bridge-shootout-roadmap.md) | Proposed Phase 5.5 roadmap before Phase 6 |
| 4b | [roadmap/phase5c-low-preload-domain-plan.md](roadmap/phase5c-low-preload-domain-plan.md) | Phase 5C-B selected-v2 low-preload domain extension plan |
| 4c | [roadmap/phase5c-new-myocardium-check-plan.md](roadmap/phase5c-new-myocardium-check-plan.md) | Phase 5C-C new-myocardium low-preload check plan |
| 4d | [roadmap/phase5c-positive-control-fidelity-audit-plan.md](roadmap/phase5c-positive-control-fidelity-audit-plan.md) | Phase 5C-D positive-control fidelity audit over the Phase 5C-C no-go result |
| 4e | [roadmap/phase5c-post-fidelity-entry-gate.md](roadmap/phase5c-post-fidelity-entry-gate.md) | Phase 5C-E entry gate after the Phase 5C-D no-go result |
| 4f | [roadmap/phase5c-positive-control-triage-audit.md](roadmap/phase5c-positive-control-triage-audit.md) | Phase 5C-F triage audit plan while the Phase 5C-E entry gate remains blocked |
| 4g | [roadmap/phase5c-same-closure-source-provider-audit.md](roadmap/phase5c-same-closure-source-provider-audit.md) | Phase 5C-G same-closure source-provider audit snapshot after the PR #193 lane handoff |
| 5 | [research/myocardial-contraction-rebuild-design-record.md](research/myocardial-contraction-rebuild-design-record.md) | Background rationale and design discussion |
| 6 | [review-notes/phase2b-level3-review-deltas.md](review-notes/phase2b-level3-review-deltas.md) | PR #166 Phase 2B/Level 3 review deltas |

When these documents disagree, use this precedence:

```text
accepted ADR
> model spec
> verification plan
> roadmap
> design record
```

`ADR-MYO-001` is Accepted for the required Phase 0 owner decisions listed in
its acceptance clause. Phase 1A contract work, Phase 1B standalone Land source
equations, Phase 1C Land protocol closure, and Phase 2A standalone prescribed
calcium work may proceed. Phase 2B standalone isometric Ca+Land source-stress
coupling and Phase 2C standalone prescribed-shortening Ca+Land transfer may
also proceed, but ModelCore integration, loaded mechanics coupling, and runtime
schema migration still require their later phase gates.
Phase 3A fixed thick-sphere kinematics may proceed as a standalone
kinematics-only artifact gate; it does not decide production ventricular
mechanics or owner acceptance.
Phase 3 owner GO is recorded separately for Phase 4A decision-dossier work
only. It does not authorize Phase 4B+, runtime/schema/official-case wiring,
passive law acceptance, TriSeg adoption, or Decision 19 owner selection.
Decision 19 owner selection is now recorded in a separate Phase 4A artifact;
the Phase 4A dossier remains historical recommendation-only evidence with
`selectedCandidateId: null`. The owner acceptance records carry
`acceptedSourceType` and `acceptedSourceRef` metadata so future decisions can
trace the durable approval source.

## Atrial bridge update proposed in PR #166

`ADR-MYO-002` is proposed to supersede the unqualified Phase 6 assumption that
LA/RA should use a clean time-varying elastance bridge. Until it is accepted,
read any existing `clean atrial elastance bridge` wording as pending review.
The proposed path is:

```text
Phase 5.5: atrial bridge shootout
Phase 6: LV/RV Land closed loop with selected validated atrial bridge
```

Candidate framing:

```text
E0: atrial-elastance-negative-control-v0
A0: legacy-atrial-active-bridge-v0
A1: atrial-reservoir-booster-bridge-v1
```

`E0` is a negative control. `A0` is a quarantined comparator or conditional
fallback, not backward compatibility. `A1` is the preferred new bridge
candidate.

## Phase 2B / Level 3 review deltas proposed in PR #166

The PR #166 review also requested that the accepted Phase 2B/Level 3 planning
deltas be visible in this docs/data PR. See
[review-notes/phase2b-level3-review-deltas.md](review-notes/phase2b-level3-review-deltas.md).

Machine-readable additions:

```text
data/myocardium/protocols/phase2b-mechanistic-report-fields-v1.json
data/myocardium/protocols/level3-source-stress-transfer-gate-v1.json
data/myocardium/protocols/layer-consistency-and-alternans-policy-v1.json
data/myocardium/decisions/phase2b-level3-review-deltas-v1.json
```

Diagnostic-only PV-loop morphology audit additions:

```text
data/myocardium/protocols/pv-loop-morphology-quality-v1.json
data/myocardium/protocols/filling-limb-artifact-audit-v1.json
data/myocardium/protocols/arterial-load-morphology-v1.json
data/myocardium/protocols/arterial-load-zc-reflection-comparator-v1.json
data/myocardium/targets/pv-loop-morphology-quality-v1.json
```

These proposed audit descriptors use
`claimBoundary=diagnostic-only-no-model-change`; they do not authorize runtime
behavior, solver, official-case-parameter, UI smoothing, or package-script
changes.

Readiness-boundary addition:

```text
data/myocardium/protocols/filling-limb-correlation-readiness-v1.json
```

Explicit-CLI comparator artifact addition:

```text
data/myocardium/protocols/filling-limb-diagnostic-comparator-v1.json
data/myocardium/protocols/arterial-load-zc-reflection-diagnostic-comparator-v1.json
```

Important clarification: `targetPeakAmplitudeUM` is amplitude above diastolic
Ca, not absolute Ca. For the reviewed Phase 2B example, `peakAmplitudeUM=0.9`
with `diastolicCaUM=0.12` implies `targetAbsolutePeakCaUM≈1.02 uM`, so a
measured peak near `1.016 uM` is not a 13% Ca overshoot.

## Source registry

The machine-readable source registry is
[`../../data/myocardium/sources.json`](../../data/myocardium/sources.json).
Only sources with `verificationStatus: "verified"` may be used for Phase A
equations, parameter fixtures, target packs, or acceptance thresholds.

The supporting source-registry note is
[references/myocardium-source-registry.md](references/myocardium-source-registry.md).

A supplemental proposed atrial bridge source note is
[`../../data/myocardium/sources-atrial-bridge-v1.json`](../../data/myocardium/sources-atrial-bridge-v1.json).

## Phase 0 artifact gate

Phase 0 artifact integrity is recorded in
[`../../data/myocardium/phase0-decisions.json`](../../data/myocardium/phase0-decisions.json)
and
[`../../data/myocardium/targets/claim-freeze-v1.json`](../../data/myocardium/targets/claim-freeze-v1.json).
Run `npm run verify:myocardium-phase0` to check the source registry, required
ADR-MYO-001 decision records, target/claim freeze categories, and pending owner
decisions. After `ADR-MYO-001` is marked Accepted, this gate expects the
required Phase 0 decisions to be individually accepted with owner provenance
metadata.

## Existing phase gates

The existing phase-gate sections below remain unchanged by PR #166. This PR is
docs/data-only and does not alter runtime TypeScript behavior.

### Phase 1A contracts

Run `npm run verify:myocardium-contracts` to check the standalone Phase 1A
activation, provenance, instance-path, and dynamic-state-layout contracts. These
contracts live under `engine/myocardium/*`; the new
`engine/myocardium/state/StateLayoutBuilder.ts` reuses the existing
`engine/stateContract.ts` stable-hash helper only; it is not wired to legacy
`engine/core/stateLayout.ts`, ModelCore, chamber code, or runtime
schema/loaders. The spec §7.2 schema-breaking items, including
`MODEL_STATE_SCHEMA_VERSION` changes and old-loader rejection, are deferred to
later adoption/integration phases.
The activation contract distinguishes the scheduler family
`activation-scheduler-v1` from the concrete scheduler model
`periodic-activation-scheduler-v1`.

### Phase 1B Land source

Run `npm run verify:myocardium-land-source` to check the standalone Land 2017
source parameter provenance, BE residual/Jacobian smoke, no-projection output
semantics, source-grounded stabilization stiffness, absent direct-output
tangents, and module import boundary.

### Phase 1C Land protocols

Run `npm run verify:myocardium-land-protocols` to check standalone Land source
protocol closure: BE solver failure reporting, Regazzoni-Quarteroni active
stiffness provenance, re-solved algorithmic tangent, synthetic protocol metrics,
dt self-consistency, and deterministic reproducibility. This gate reports
`claimBoundary=algorithmic-source-closure-only`; digitized experimental target
pass/fail remains deferred to later target-pack work.

### Phase 2A prescribed calcium

Run `npm run verify:myocardium-prescribed-calcium` to check the standalone
`PrescribedCalciumTransientV1` backend. This gate covers ActivationEvent-only
input semantics, synthetic cycle-length knot interpolation, C1 release pulse
timing, BE residual/update consistency, event-boundary continuity, nonnegative
free calcium, deterministic replay, and claim-boundary metadata. It reports
`claimBoundary=prescribed-calcium-waveform-only` and
`evidenceStatus=synthetic-smoke-only`; Decision 10 target/HR acceptance and
experimental Ca target pass/fail remain deferred.

### Phase 2B isometric Ca plus Land

Run `npm run verify:myocardium-calcium-land-isometric` to check the standalone
fixed-strain prescribed-Ca plus Land source-stress gate. This gate reports
synthetic isometric source-stress metrics such as time to peak, FWHM,
width80/90, relaxation tau/R2, dT/dt, and peak/mean ratio for Land
`sourceActiveFiberStressPa` only. The twitch metrics closure also requires
Land output `health.finite=true` for every sample and
`maxConservationResidual <= 1e-12`. It reports
`claimBoundary=standalone-isometric-ca-land-only` and
`evidenceStatus=synthetic-coupling-smoke-only`; LVP targets, pressure
morphology, valve/qDot behavior, loaded mechanics, and experimental pass/fail
remain out of scope.

PR #166 proposes extra required Phase 2B mechanistic report fields in
[`../../data/myocardium/protocols/phase2b-mechanistic-report-fields-v1.json`](../../data/myocardium/protocols/phase2b-mechanistic-report-fields-v1.json).

### Phase 2C prescribed shortening Ca plus Land

Run `npm run verify:myocardium-prescribed-shortening` to check the standalone
prescribed-shortening transfer gate. This gate reuses the Phase 2A synthetic
prescribed-Ca backend and Land BE substep solver, then runs a neutral
trajectory family covering zero-rate isometric comparison, low/physiologic/high
shortening, lengthening, and a constant-velocity shortening control. Land input
rates are derived only from previous strain, stage strain, and `dtSec`; the
report audits that derivation for every sample. It reports
`claimBoundary=standalone-prescribed-shortening-ca-land-only` and
`evidenceStatus=synthetic-prescribed-shortening-transfer-only`; experimental
target acceptance, pressure/valve/qDot claims, homogenization, and
generalized-force mapping remain out of scope.

### Phase 3A fixed thick-sphere kinematics

Run `npm run verify:myocardium-thick-sphere-kinematics` to check the standalone
fixed early thick-sphere kinematics harness. This gate evaluates the single
`cavity-volume` generalized coordinate, arithmetic-mean midwall convention,
analytic strain derivative, coordinate-rate-derived strain-rate diagnostic,
candidate parameter provenance, and descriptor claim boundary. It reports
`claimBoundary=fixed-thick-sphere-kinematics-only` and
`evidenceStatus=synthetic-geometry-closure-only`; production ventricular
mechanics, owner acceptance, fit/validation pass claims, and loaded-system
behavior remain deferred. Phase 3B/C still cover homogenization, generalized
force, and the minimal loaded afterload family.

### Phase 3B identity homogenization and generalized force

Run `npm run verify:myocardium-generalized-forces` to check the standalone
identity/fixed homogenization plus single-coordinate generalized-force gate.
This gate passes Land source active fiber stress through
`identity-fiber-nominal-v1`, uses an explicit zero passive/viscous fixture, and
checks `virtual-power-nominal-engineering-v1` for the single `cavity-volume`
coordinate. It reports
`claimBoundary=identity-homogenization-single-coordinate-force-only` and
`evidenceStatus=synthetic-virtual-power-closure-only`; production
homogenization, passive-law acceptance, loaded afterload behavior, runtime
chamber integration, and owner acceptance remain deferred.

### Phase 3C minimal loaded afterload family

Run `npm run verify:myocardium-minimal-loaded-chamber` to check the standalone
D0 low/normal/high afterload-family smoke gate. This gate reuses the Phase 3A
fixed thick-sphere coordinate, Phase 3B identity generalized-force path, Phase
2A prescribed calcium, and Phase 1C Land source solver, then advances only a
synthetic afterload pressure state with the bidirectional linear resistor
`flow=(P_internal-P_afterload)/R`, `V -= flow*dt`, and
`P_afterload += flow*dt/C`. The three members differ only in resistance,
compliance, and initial afterload pressure, and the run fails if the loaded
volume update leaves the Phase 3A sweep domain.

It reports `claimBoundary=minimal-loaded-afterload-family-smoke-only` and
`evidenceStatus=synthetic-d0-afterload-family-only`; production single-chamber
solvers, passive-law acceptance, dynamic valve behavior, qDot clamps, TBV
projection, septal/pericardial coupling, closed-loop steady state, ModelCore or
chamber runtime wiring, schema/official-case wiring, owner GO, and downstream
pass claims remain out of scope.

PR #166 proposes an additional Level 3 source-stress transfer gate in
[`../../data/myocardium/protocols/level3-source-stress-transfer-gate-v1.json`](../../data/myocardium/protocols/level3-source-stress-transfer-gate-v1.json).

### Phase 3 owner GO and Phase 4A mechanics decision records

Phase 3 owner GO is recorded in
[`../../data/myocardium/gates/phase3-owner-go-v1.json`](../../data/myocardium/gates/phase3-owner-go-v1.json)
with owner provenance and evidence references to PR #162 and the Phase 3C
minimal-loaded descriptor. This gate unlocks only the Phase 4A mechanics
decision dossier. Its conditional recommendation assumes that RV pressure
overload, septal bowing, and ventricular interdependence are not primary
first-integration mechanisms.

The Phase 4A Decision 19 dossier is
[`../../data/myocardium/decisions/production-mechanics-phase4a-dossier-v1.json`](../../data/myocardium/decisions/production-mechanics-phase4a-dossier-v1.json).
Run `npm run verify:myocardium-mechanics-decision` to check the Phase 3 GO
boundary, candidate set, criteria, conditional recommendation, TriSeg
source/no-auto-adopt boundary, prior Phase 3 descriptor non-acceptance,
Decision 19 row presence, and absence of runtime/official-case dossier wiring.
The dossier is a conditional recommendation only and remains
`PENDING OWNER`/`selectedCandidateId: null`.

The separate Decision 19 owner-selection artifact is
[`../../data/myocardium/decisions/production-mechanics-decision19-owner-selection-v1.json`](../../data/myocardium/decisions/production-mechanics-decision19-owner-selection-v1.json).
It records `ACCEPTED 2026-06-27` for
`thick-sphere-v2-explicit-external-septal-coupling` as the initial
`thick-sphere-v2` backend. Run
`npm run verify:myocardium-mechanics-selection` to check the owner provenance,
selected-candidate consistency with the dossier recommendation, accepted
Decision 19 rows in ADR/roadmap/research docs, and absence of runtime or
official-case selection wiring. The immediate limited-scope priority is to
replace the current active stress with Land active stress, evaluate morphology
gate pass/fail, and run a beat-stability/no-alternans check. RV pressure
overload, septal bowing, ventricular interdependence, and right-heart failure
as primary/final scope remain non-covered by this initial backend; the future
TriSeg path preserves `triseg-lite-compatible`, `full-triseg-compatible`, and
full TriSeg escalation before those mechanisms are claimed.

### Phase 4B-A Land active-stress replacement shadow readiness

Run `npm run verify:myocardium-land-active-stress-replacement` to check the
first Phase 4B-A shadow readiness gate for Land active-stress replacement. The
descriptor is
[`../../data/myocardium/protocols/land-active-stress-replacement-phase4b-protocols.json`](../../data/myocardium/protocols/land-active-stress-replacement-phase4b-protocols.json).
It references the accepted Decision 19 owner selection, the frozen Phase 4A
dossier, Phase 3C minimal loaded afterload family, Phase 2C prescribed
shortening, Land source protocols, model spec, verification plan, and roadmap.

This gate reports only `claimBoundary=shadow-replacement-readiness-only`. The
selected Decision 19 backend remains
`thick-sphere-v2-explicit-external-septal-coupling` / `thick-sphere-v2`, while
the executable coordinate path is still Phase 3 coordinate-family shadow
readiness using `thick-sphere-spike-v1`; this is not completion of the selected
v2 backend. The checks cover Land pipeline finite/health/virtual-power
readiness from Phase 3C, internal pressure/stroke/work/afterload ordering
proxies with `morphologyProxyOutcome`, and prescribed-Ca beat-stability/no-
alternans smoke using six state-carry preconditioning cycles followed by one
warm-up plus three evaluated cycles, with a 5% drift tolerance and a separate
1% alternans-pattern tolerance. It does not complete tissue homogenization, live runtime
replacement, production validation, official morphology acceptance, runtime
schema/state layout work, ModelCore/chamber wiring, official-case wiring, RV
pressure-overload/interdependence coverage, or calcium-cycling alternans
validation.

PR #166 proposes the alternans interpretation policy in
[`../../data/myocardium/protocols/layer-consistency-and-alternans-policy-v1.json`](../../data/myocardium/protocols/layer-consistency-and-alternans-policy-v1.json).

## Phase 4B-B tissue homogenization readiness audit

Run `npm run verify:myocardium-tissue-homogenization-readiness` to check the
Phase 4B-B tissue homogenization readiness audit. The descriptor is
[`../../data/myocardium/protocols/land-tissue-homogenization-phase4b-protocols.json`](../../data/myocardium/protocols/land-tissue-homogenization-phase4b-protocols.json).
This gate audits the locked shadow adapter candidate only. It uses direct
adapter provenance from Phase 3B
[`../../data/myocardium/protocols/identity-force-phase3b-protocols.json`](../../data/myocardium/protocols/identity-force-phase3b-protocols.json)
and direct loaded-shadow provenance from Phase 3C
[`../../data/myocardium/protocols/minimal-loaded-phase3c-afterload-protocols.json`](../../data/myocardium/protocols/minimal-loaded-phase3c-afterload-protocols.json),
with Phase 4B-A reuse kept read-only.

The gate reports
`claimBoundary=tissue-homogenization-readiness-audit-only`,
`ownerAcceptanceStatus=not-owner-acceptance`,
`decision4Status=PENDING OWNER`,
`productionHomogenization=not-claimed`, and
`identifiabilityRankStatus=not-run`. It does not graduate, accept, or validate
production tissue homogenization, official morphology, live runtime
replacement, calcium-cycling alternans validation, ModelCore/chamber wiring,
state schema changes, or official-case wiring.

The current identity adapter has activeTissueFraction=1 and identity
orientation only: no fiber orientation model, no dispersion model, no
transmural variation, no active tissue fraction<1 behavior, no independent
data fit, and no independent identifiability rank run. The audit also checks
that `stabilizationStiffnessPa` and optional `algorithmicTangentPa` remain
distinct fields.

RV pressure overload, septal bowing, ventricular interdependence, and
right-heart failure are not covered by this Phase 4B-B gate. The future TriSeg
path preserves `triseg-lite-compatible`, `full-triseg-compatible`, and full
TriSeg escalation before those mechanisms are claimed.

## Phase 4C-A passive energy readiness candidate

Run `npm run verify:myocardium-passive-energy-readiness` to check the Phase
4C-A passive energy readiness candidate. The descriptor is
[`../../data/myocardium/protocols/passive-energy-phase4c-protocols.json`](../../data/myocardium/protocols/passive-energy-phase4c-protocols.json),
and the audited candidate implementation is
[`../../engine/myocardium/mechanics/passiveExponentialEnergyV1.ts`](../../engine/myocardium/mechanics/passiveExponentialEnergyV1.ts).

This gate audits `passive-exponential-energy-v1` /
`passive-exponential-energy-phase4c-a-readiness-candidate-v1` as a
recommended candidate pending Decision 6. It checks that passive stress is the
energy derivative, passive tangent is the passive-stress derivative, the
exponential energy sweep is nonnegative across compression/near-hinge/high
extension samples, the positive-part hinge is C1-continuous, compression at or
below slack has zero passive stored energy/stress/tangent, and the viscous
dashpot satisfies `S_viscous*Edot >= 0` for positive and negative rates.

The gate reports
`claimBoundary=passive-energy-readiness-candidate-only`,
`ownerAcceptanceStatus=not-owner-acceptance`, `decision5Status=PENDING OWNER`,
`decision6Status=PENDING OWNER`, and `decision8Status=PENDING OWNER`. It does
not accept a production passive law, official morphology outcome, live runtime
replacement, ModelCore/chamber/state-schema/official-case wiring, pressure
floor, stress clamp, or multi-coordinate generalized-force mapper. Phase 3B,
Phase 4B-A, and Phase 4B-B evidence is reused read-only.

RV pressure overload, septal bowing, ventricular interdependence, and
right-heart failure are not covered by this Phase 4C-A gate. The future TriSeg
path preserves `triseg-lite-compatible`, `full-triseg-compatible`, and full
TriSeg escalation before those mechanisms are claimed.

## Phase 4C-B generalized-force mapper readiness artifact

Run `npm run verify:myocardium-generalized-force-mapper-readiness` to check
the Phase 4C-B generalized-force mapper readiness artifact. The descriptor is
[`../../data/myocardium/protocols/generalized-force-mapper-phase4c-protocols.json`](../../data/myocardium/protocols/generalized-force-mapper-phase4c-protocols.json),
and the mapper implementation is
[`../../engine/myocardium/mechanics/virtualPowerGeneralizedForceV1.ts`](../../engine/myocardium/mechanics/virtualPowerGeneralizedForceV1.ts).

This gate audits `virtual-power-generalized-force-v1` with synthetic
multi-coordinate virtual-power closure only. It computes active, passive, and
viscous contributions per coordinate as `Vw0*S*dE_f/dq_i`, checks the total
conjugate force sum, requires explicit coordinate rates for multi-coordinate
closure, preserves Phase 3B-compatible scalar rate derivation, and emits
`volumeCoordinatePressurePa` only for coordinates whose unit is `m3`.
Displacement coordinates with unit `m` remain force components only.

The gate reports
`claimBoundary=generalized-force-mapper-readiness-artifact-only`,
`evidenceStatus=synthetic-multi-coordinate-virtual-power-closure-only`,
`ownerAcceptanceStatus=not-owner-acceptance`,
`decision4Status=PENDING OWNER`, `decision5Status=PENDING OWNER`,
`decision6Status=PENDING OWNER`, and `decision8Status=PENDING OWNER`. It
reuses the accepted Decision 19 owner-selection artifact read-only with
`decision19Status=ACCEPTED`; it does not add production runtime acceptance,
production homogenization, a production passive law, official morphology
outcome, atrial bridge selection, live runtime replacement,
ModelCore/chamber/state-schema/official-case wiring, or workbench wiring.
Phase 3B, Phase 4B-A, Phase 4B-B, and Phase 4C-A evidence is reused read-only,
and the Phase 4C-A descriptor remains checked with
`enableMultiCoordinateGeneralizedForceMapper=false`.

Official morphology, atrial bridge selection, RV pressure overload, septal
bowing, ventricular interdependence, and right-heart failure are not covered by
this Phase 4C-B gate. The future TriSeg path preserves
`triseg-lite-compatible`, `full-triseg-compatible`, and full TriSeg escalation
before those mechanisms are claimed.

## Phase 4D selected-mechanics calibration readiness

Run `npm run verify:myocardium-selected-mechanics-calibration-readiness` to
check the Phase 4D selected-mechanics calibration-readiness gate. The
descriptor is
[`../../data/myocardium/protocols/selected-mechanics-calibration-phase4d-protocols.json`](../../data/myocardium/protocols/selected-mechanics-calibration-phase4d-protocols.json),
and the selected calibration candidate implementation is
[`../../engine/myocardium/kinematics/thickSphereV2SelectedBackend.ts`](../../engine/myocardium/kinematics/thickSphereV2SelectedBackend.ts).

This gate audits the selected `thick-sphere-v2` calibration candidate for
synthetic executability only. It introduces v2-owned LV/RV parameter set ids
(`kinematics-lv-thick-sphere-v2-calibration-candidate-v1` and
`kinematics-rv-thick-sphere-v2-calibration-candidate-v1`) and stable hashes
that are distinct from the Phase 3 `thick-sphere-spike-v1` parameter set. It
checks finite-strain thick-sphere geometry closure, analytic
`dE_f/dV` agreement against finite difference, in-domain LV/RV calibration
samples, and deterministic replay.

The gate reports
`claimBoundary=selected-mechanics-calibration-readiness-only`,
`selectedThickSphereV2CalibrationCandidateExecutableStatus=selected-thick-sphere-v2-calibration-candidate-executable`,
`ownerAcceptanceStatus=not-owner-acceptance`,
`decision4Status=PENDING OWNER`, `decision5Status=PENDING OWNER`,
`decision6Status=PENDING OWNER`, and `decision8Status=PENDING OWNER`. It
reuses the accepted Decision 19 owner selection and frozen Phase 4A dossier
read-only. It also preserves Phase 4B-A evidence that the prior executable path
was `thick-sphere-spike-v1`; that evidence is not the current selected v2
candidate identity.

The calibration freedom matrix fixes the Land source `Tref`, forbids free
homogenization gain, forbids free pressure or geometry gain, and keeps target
packs as measurement hooks only. The mechanics-composition smoke combines
Land-style active source stress, the Phase 4C-A passive candidate output, and
the Phase 4C-B generalized-force mapper on synthetic selected-backend samples,
then checks virtual-power residual and finite `m3` pressure maps.

Phase 4B-A, Phase 4B-B, Phase 4C-A, and Phase 4C-B evidence is reused
read-only with pass/hash evidence. The Phase 4B-A beat-stability smoke is also
reused read-only as a measurement-hook context only. Official morphology pass is
not claimed by this Phase 4D gate. Robust calcium-cycling no-alternans
validation, production mechanics, production validation, live runtime
replacement, ModelCore/chamber/state-schema/official-case wiring, workbench
wiring, septal coordinate implementation, septal coupling implementation, RV
pressure overload, septal bowing, ventricular interdependence, and right-heart
failure are not claimed by this Phase 4D gate. The future TriSeg path preserves
`triseg-lite-compatible`, `full-triseg-compatible`, and full TriSeg escalation
before those mechanisms are claimed.

## Phase 5A local monolithic coupling readiness

Run `npm run verify:myocardium-local-monolithic-coupling-readiness` to check
the Phase 5A local monolithic BE reference-readiness gate. The descriptor is
[`../../data/myocardium/protocols/local-monolithic-coupling-phase5a-protocols.json`](../../data/myocardium/protocols/local-monolithic-coupling-phase5a-protocols.json),
and the pure reference implementation is
[`../../engine/myocardium/coupling/localMonolithicBeV1.ts`](../../engine/myocardium/coupling/localMonolithicBeV1.ts).

This gate uses the contract id `local-monolithic-be-v1`. It combines selected
v2 LV/RV kinematics, prescribed calcium, Land BE residuals for the six Land
states, identity homogenization, passive exponential energy, and
`virtual-power-generalized-force-v1` pressure maps inside a synthetic coupled
7-unknown Newton solve over cavity volume plus Land state. The pass condition
requires Land BE residual convergence, local force-balance residual closure,
Newton iteration and finite-difference Jacobian evidence, line-search
evidence, finite state health, derived Land strain-rate consistency from
previous/stage strain history, and deterministic hash evidence. Phase 4D
selected-mechanics
`stableSummaryHash` runner allowlist, selected candidate hash, and LV/RV
parameter hashes are pinned read-only and drift outside those pins is a
verifier failure.

Phase 5A is not Phase 5 completion. SDIRK2 reference completion is Phase 5B
work because current `deriveLand2017StepKinematics()` throws for SDIRK2.
Production solver comparison is not claimed, performance acceptance is not
claimed, active-stiffness production coupling is not claimed,
active-stiffness partitioned production coupling is not claimed, runtime
replacement, ModelCore wiring, chamber wiring, case wiring, official-case
wiring, and workbench wiring are not claimed. Official morphology pass is not
claimed, robust no-alternans is not claimed, septal coordinate/coupling
implementation, RV pressure overload, septal bowing, ventricular
interdependence, and right-heart failure coverage are not claimed, and TriSeg
adoption is not claimed. The future TriSeg path preserves
`triseg-lite-compatible`, `full-triseg-compatible`, and full TriSeg
escalation.

## Phase 5B local monolithic SDIRK2 reference readiness

Run `npm run verify:myocardium-local-monolithic-sdirk2-readiness` to check
the Phase 5B `local-monolithic-sdirk2-v1` reference-only gate. The descriptor
is
[`../../data/myocardium/protocols/local-monolithic-coupling-phase5b-sdirk2-protocols.json`](../../data/myocardium/protocols/local-monolithic-coupling-phase5b-sdirk2-protocols.json),
the dedicated Land entrypoint is
[`../../engine/myocardium/myofilament/land2017/sdirk2.ts`](../../engine/myocardium/myofilament/land2017/sdirk2.ts),
and the pure reference implementation is
[`../../engine/myocardium/coupling/localMonolithicSdirk2V1.ts`](../../engine/myocardium/coupling/localMonolithicSdirk2V1.ts).

This gate fixes `gamma = 1 - 1 / Math.sqrt(2)` and uses a two-stage stiffly
accurate SDIRK2 tableau with final state `Y1`. Stage0 and stage1 are solved as
sequential 7-unknown local systems over cavity volume plus the six Land states;
the 14-unknown simultaneous solve is not used. The verifier checks the stage
strain-rate formulas, the matching cavity coordinate-rate formulas used by
selected v2 kinematics/passive/generalized-force `coordinateRatesSI`,
sequential stage-increment prescribed-calcium `dtSec` semantics, Land SDIRK2
residual convergence, local force-balance residual closure, Newton iteration,
finite-difference Jacobian, line-search evidence, finite health, deterministic
hashes, and finite bounded BE-vs-SDIRK2 discrepancy.

Phase 5B SDIRK2 reference completion is scoped only to this local monolithic
synthetic reference. Phase 5 completion, production solver comparison,
performance acceptance, active-stiffness production coupling, runtime
replacement, and ModelCore/chamber/case/official-case/workbench wiring are not
claimed by this gate. Official morphology pass is not claimed by this gate.
Robust no-alternans, calcium-cycling alternans acceptance, septal
coordinate/coupling implementation, RV pressure overload, septal bowing,
ventricular interdependence, right-heart failure coverage, and TriSeg adoption
are not claimed by this gate.

## Phase 5C-A Land shadow alternans comparator readiness

Run `npm run verify:myocardium-land-shadow-alternans-comparator-readiness` to
check the Phase 5C-A Land shadow alternans comparator readiness artifact. This
is a feedforward shadow replay of the legacy fixed low-preload period-2 VLV trajectory
through selected thick-sphere-v2 LV kinematics, prescribed calcium, and Land
source active stress. It is not the Phase 4B-A synthetic prescribed protocol:
Phase 4B-A used a synthetic prescribed protocol and state-carry smoke, while
Phase 5C-A replays the fixed legacy activeStress low-preload period-2 VLV
samples as prescribed input.

The verifier reproduces the fixed legacy protocol at baseline 5600 mL, delta
-1250 mL, effective 4350 mL, `heartModel=activeStress`, `dt=0.001`,
`sampleHz=120`, and `traceBeats=4`, with no return-map acceptance. It then
checks that the legacy reproduction is settled period-2 evidence before
feeding the prescribed VLV trace to the pure engine report. The Land
beat-to-beat delta is interpreted only as inherited from prescribed alternating
legacy volume, not generated by Land and not calcium-cycling alternans.

This gate is no runtime replacement, no official morphology pass, and no
robust no-alternans. It does not satisfy the policy
`newMyocardiumCheck.required`; the report records separate feedforward shadow
replay evidence instead. The current validation PASS / artifactGate PASS means
the verifier can reproduce and report this outcome deterministically, and the
Phase 5C-B selected-v2 LV 30 mL lower-domain extension now covers all fixed
legacy VLV samples inside the selected LV calibration domain. RV pressure
overload not covered, ventricular interdependence not covered, right-heart
failure not covered, and TriSeg future not covered by this gate.

## Phase 5C-C new-myocardium low-preload check and Phase 5C-D fidelity audit

Run `npm run verify:myocardium-land-new-myocardium-low-preload-check` to check
the Phase 5C-C standalone selected-v2 + Land low-preload artifact. The
descriptor is
[`../../data/myocardium/protocols/land-new-myocardium-low-preload-phase5c-protocols.json`](../../data/myocardium/protocols/land-new-myocardium-low-preload-phase5c-protocols.json),
and the implementation is
[`../../engine/myocardium/protocols/landNewMyocardiumLowPreloadCheck.ts`](../../engine/myocardium/protocols/landNewMyocardiumLowPreloadCheck.ts).

The artifact generates its own LV trajectory under
`phase5c-c-standalone-preload-afterload-surrogate-v1` and compares two source
providers under the same closure: a legacy
`ActiveStressChamberModel/defaultActiveLV` positive control and a Land 2017
new-myocardium run. The current outcome is validation PASS / artifactGate FAIL:
the positive control is finite and same-closure, but settles to period-1 rather
than reproducing the fixed Phase 5C-A period-2 branch. This is the expected
no-go interpretation for this artifact state, not a Land no-alternans result.

Phase 5C-D records the fidelity audit for that no-go result in
[roadmap/phase5c-positive-control-fidelity-audit-plan.md](roadmap/phase5c-positive-control-fidelity-audit-plan.md).
The machine-readable audit snapshot is
[`../../data/myocardium/protocols/land-new-myocardium-low-preload-phase5c-fidelity-audit-v1.json`](../../data/myocardium/protocols/land-new-myocardium-low-preload-phase5c-fidelity-audit-v1.json).
It does not add a parallel engine or verifier. Instead, the Phase 5C-C verifier
compares that snapshot against the live report and descriptor to keep the
advancement block explicit until the same closure can reproduce the legacy
period-2 positive control or a later owner-approved replacement criterion
supersedes it.

Phase 5C-E records that post-fidelity entry gate in
[roadmap/phase5c-post-fidelity-entry-gate.md](roadmap/phase5c-post-fidelity-entry-gate.md)
and
[`../../data/myocardium/gates/phase5c-post-fidelity-entry-gate-v1.json`](../../data/myocardium/gates/phase5c-post-fidelity-entry-gate-v1.json).
Run `npm run verify:myocardium-phase5c-post-fidelity-entry-gate` to check the
gate. The only allowed entry routes are
`same-closure-period2-positive-control` and
`owner-approved-replacement-criterion`. This gate keeps
`land-new-myocardium-low-preload-phase5c-fidelity-audit-v1`,
`blocked-until-positive-control-period2`, no runtime replacement, no
qDot/valve/afterload tuning, no official morphology acceptance, no final
no-alternans, and no TriSeg adoption as the current boundary.

Phase 5C-F records the triage audit plan in
[roadmap/phase5c-positive-control-triage-audit.md](roadmap/phase5c-positive-control-triage-audit.md)
and
[`../../data/myocardium/gates/phase5c-positive-control-triage-audit-v1.json`](../../data/myocardium/gates/phase5c-positive-control-triage-audit-v1.json).
Run `npm run verify:myocardium-phase5c-positive-control-triage-audit` to
check the gate. The diagnostic lanes are
`same-closure-source-provider-audit`, `closure-event-surface-diagnostic`, and
`owner-replacement-criterion-prep`; all are report-only or owner-pending and
keep `blocked-until-positive-control-period2`. This phase has no runtime
replacement, no qDot/valve/afterload tuning, no official morphology acceptance,
no final no-alternans, no RV pressure-overload coverage, no ventricular
interdependence coverage, no right-heart failure coverage, and no TriSeg
adoption.

Phase 5C-G records the `same-closure-source-provider-audit` snapshot in
[roadmap/phase5c-same-closure-source-provider-audit.md](roadmap/phase5c-same-closure-source-provider-audit.md)
and
[`../../data/myocardium/gates/phase5c-same-closure-source-provider-audit-v1.json`](../../data/myocardium/gates/phase5c-same-closure-source-provider-audit-v1.json).
Run `npm run verify:myocardium-phase5c-same-closure-source-provider-audit` to
check the audit against the live Phase 5C-C report. This phase keeps the
PR #193 `modelcore-equivalent-closure-positive-control` handoff as
`proposed-next-route-not-implemented`; it does not add that route to the Phase
5C-E gate, does not implement a ModelCore-equivalent closure, and does not
satisfy an entry route. The current outcome remains
`positive-control-failed`, `settled-period-1`, and
`blocked-until-positive-control-period2`. This phase has no runtime
replacement, no qDot/valve/afterload tuning, no official morphology
acceptance, no final no-alternans, no RV pressure-overload coverage, no
ventricular interdependence coverage, no right-heart failure coverage, and no
TriSeg adoption.

## Imported bundle checks

Revision 3's original markdown hashes are preserved in
[revision3-validation.json](revision3-validation.json). The repository import
status, source hashes, and adapted repository hashes are recorded in
[import-manifest.json](import-manifest.json).

[CHANGELOG-REV3.md](CHANGELOG-REV3.md) records the Revision 3 changes from the
source bundle.
