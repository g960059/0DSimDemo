# Myocardium Revision 3

Status: Phase 0 owner decisions accepted; Phase 3 owner GO recorded for Phase 4A dossier work only; Decision 19 owner selection recorded separately
Bundle source: local import, path redacted
Baseline repository commit: `228bef96e5f522de2cfe352de5d6d4d2f017c550`

Revision 3 is the current planning namespace for the myocardial contraction
subsystem replacement. It is not a patch plan for the existing
`ActiveStressChamberModel`, and it does not change runtime TypeScript behavior
until Phase 0 owner decisions are accepted.

## Read order

| Priority | Document | Purpose |
|---:|---|---|
| 1 | [adr/ADR-MYO-001.md](adr/ADR-MYO-001.md) | Scope, decision, consequences, required owner decisions |
| 2 | [model-spec/myocardium-land-v1.md](model-spec/myocardium-land-v1.md) | Normative model/API/units/state/solver contracts |
| 3 | [verification/myocardium-v1-verification.md](verification/myocardium-v1-verification.md) | Target freeze, verification tiers, GO/REVISE/NO-GO gates |
| 4 | [roadmap/myocardium-rebuild-roadmap.md](roadmap/myocardium-rebuild-roadmap.md) | Phase and PR sequencing |
| 5 | [research/myocardial-contraction-rebuild-design-record.md](research/myocardial-contraction-rebuild-design-record.md) | Background rationale and design discussion |

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

## Source registry

The machine-readable source registry is
[`../../data/myocardium/sources.json`](../../data/myocardium/sources.json).
Only sources with `verificationStatus: "verified"` may be used for Phase A
equations, parameter fixtures, target packs, or acceptance thresholds.

The supporting source-registry note is
[references/myocardium-source-registry.md](references/myocardium-source-registry.md).

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

## Phase 1A contracts

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

## Phase 1B Land source

Run `npm run verify:myocardium-land-source` to check the standalone Land 2017
source parameter provenance, BE residual/Jacobian smoke, no-projection output
semantics, source-grounded stabilization stiffness, absent direct-output
tangents, and module import boundary.

## Phase 1C Land protocols

Run `npm run verify:myocardium-land-protocols` to check standalone Land source
protocol closure: BE solver failure reporting, Regazzoni-Quarteroni active
stiffness provenance, re-solved algorithmic tangent, synthetic protocol metrics,
dt self-consistency, and deterministic reproducibility. This gate reports
`claimBoundary=algorithmic-source-closure-only`; digitized experimental target
pass/fail remains deferred to later target-pack work.

## Phase 2A prescribed calcium

Run `npm run verify:myocardium-prescribed-calcium` to check the standalone
`PrescribedCalciumTransientV1` backend. This gate covers ActivationEvent-only
input semantics, synthetic cycle-length knot interpolation, C1 release pulse
timing, BE residual/update consistency, event-boundary continuity, nonnegative
free calcium, deterministic replay, and claim-boundary metadata. It reports
`claimBoundary=prescribed-calcium-waveform-only` and
`evidenceStatus=synthetic-smoke-only`; Decision 10 target/HR acceptance and
experimental Ca target pass/fail remain deferred.

## Phase 2B isometric Ca plus Land

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

## Phase 2C prescribed shortening Ca plus Land

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

## Phase 3A fixed thick-sphere kinematics

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

## Phase 3B identity homogenization and generalized force

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

## Phase 3C minimal loaded afterload family

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

## Phase 3 owner GO and Phase 4A mechanics decision records

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

## Phase 4B-A Land active-stress replacement shadow readiness

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

## Imported bundle checks

Revision 3's original markdown hashes are preserved in
[revision3-validation.json](revision3-validation.json). The repository import
status, source hashes, and adapted repository hashes are recorded in
[import-manifest.json](import-manifest.json).

[CHANGELOG-REV3.md](CHANGELOG-REV3.md) records the Revision 3 changes from the
source bundle.
