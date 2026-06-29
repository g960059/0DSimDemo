# Myocardium Revision 3

Status: Phase 0 owner decisions accepted; Phase 3 owner GO recorded for Phase 4A dossier work only; Decision 19 owner selection recorded separately
Bundle source: local import, path redacted
Baseline repository commit: `228bef96e5f522de2cfe352de5d6d4d2f017c550`

Revision 3 is the current planning namespace for the myocardial contraction
subsystem replacement. It is not a patch plan for the existing
`ActiveStressChamberModel`. Current Phase 5C work includes experimental
ModelCore source-provider hooks for artifact evidence, but it does not authorize
production runtime replacement; runtime integration still requires the later
phase gates called out below.

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
| 3i | [verification/pv-loop-current-main-baseline-snapshot-v1.md](verification/pv-loop-current-main-baseline-snapshot-v1.md) | Current-main diagnostic-only PV-loop morphology baseline snapshot |
| 3j | [morphology/README.md](morphology/README.md) | Morphology lane status, including Phase M1 current-main residual blocker classification |
| 4 | [roadmap/myocardium-rebuild-roadmap.md](roadmap/myocardium-rebuild-roadmap.md) | Phase and PR sequencing |
| 4a | [roadmap/atrial-bridge-shootout-roadmap.md](roadmap/atrial-bridge-shootout-roadmap.md) | Proposed Phase 5.5 roadmap before Phase 6 |
| 4b | [roadmap/phase5c-low-preload-domain-plan.md](roadmap/phase5c-low-preload-domain-plan.md) | Phase 5C-B selected-v2 low-preload domain extension plan |
| 4c | [roadmap/phase5c-new-myocardium-check-plan.md](roadmap/phase5c-new-myocardium-check-plan.md) | Phase 5C-C new-myocardium low-preload check plan |
| 4d | [roadmap/phase5c-positive-control-fidelity-audit-plan.md](roadmap/phase5c-positive-control-fidelity-audit-plan.md) | Phase 5C-D positive-control fidelity audit over the Phase 5C-C no-go result |
| 4e | [roadmap/phase5c-post-fidelity-entry-gate.md](roadmap/phase5c-post-fidelity-entry-gate.md) | Phase 5C-E entry gate after the Phase 5C-D no-go result |
| 4f | [roadmap/phase5c-positive-control-triage-audit.md](roadmap/phase5c-positive-control-triage-audit.md) | Phase 5C-F triage audit plan while the Phase 5C-E entry gate remains blocked |
| 4g | [roadmap/phase5c-same-closure-source-provider-audit.md](roadmap/phase5c-same-closure-source-provider-audit.md) | Phase 5C-G same-closure source-provider audit snapshot after the PR #193 lane handoff |
| 4h | [roadmap/phase5c-modelcore-equivalent-route-gate.md](roadmap/phase5c-modelcore-equivalent-route-gate.md) | Phase 5C-H/I/J/K/L/M/N/O/P ModelCore-equivalent route, experimental source-provider hook, provider-state lifecycle, source-only pressure adapter, paired Land source-provider run, qDot attribution, output-match diagnostic, activation/source-interface audit, and calcium/source forcing bracket |
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

## Phase 5.5 atrial bridge shootout result

`data/myocardium/protocols/atrial-bridge-shootout-phase5p5-result-v1.json`
records the first measured E0/A0/A1 shootout. The runner uses experimental
LA/RA providers only and keeps official cases, Workbench/runtime wiring, state
schema, atrial Land/RDQ, AF validation, and final atrial physiology claims
blocked.

Result boundary:

- normal, low-preload, and high-preload closed-loop smoke points settled for
  all E0/A0/A1 candidates;
- the high-HR smoke point reached the 120 s cap for all candidates;
- A1 preserved booster/A-loop structure and did not worsen qDot clamp fraction
  relative to A0;
- A1 worsened valve diode hit counts versus A0 in at least one smoke point,
  did not pass the settled-point atrial loop repeatability gate, and did not
  show sampling-invariant isolated roughness ordering;
- no Phase 6 bridge is selected or recommended yet because the high-HR common
  non-settle gap and A1 blocker set must be resolved or explicitly bounded
  first.

Decision 21 remains `PENDING_OWNER` with `selectedCandidateId: null`.

## Phase 5.5B atrial bridge blocker localization result

`data/myocardium/protocols/atrial-bridge-blocker-localization-phase5p5b-result-v1.json`
records a measured blocker-localization pass after the Phase 5.5 shootout. It
keeps the same experimental-only LA/RA provider boundary and does not select a
Phase 6 bridge.

Result boundary:

- HR105/min at normal TBV remains a common non-settle boundary for E0/A0/A1,
  with cap-tail LA/RA loop metrics and normalized valve attribution recorded;
- HR90/min is not a common boundary: A0 settles while E0 and A1 cap;
- A1 valve diode contamination remains supported after beat/second
  normalization against A0 across normal, low-preload, high-preload, and
  high-HR source points;
- the prior A1 repeatability blocker is not supported after full-beat
  phase-resampled repeatability, so that blocker is treated as instrumentation
  artifact rather than candidate failure;
- A1 isolated roughness ordering remains not sampling-invariant across
  120/240/480/960 Hz in LA and RA;
- diagnostic A1 variants are measured only as non-selectable localization
  probes.

Decision 21 remains `PENDING_OWNER`; production atrial bridge wiring, official
case reauthoring, Workbench/runtime wiring, state schema migration, atrial
Land/RDQ validation, AF validation, and final atrial physiology claims remain
blocked.

## Phase 5.5C atrial bridge high-HR runtime baseline result

`data/myocardium/protocols/atrial-bridge-high-hr-runtime-baseline-phase5p5c-result-v1.json`
compares the Phase 5.5B high-HR boundary against stock ModelCore runtimes with
no experimental atrial provider.

Result boundary:

- stock active no-provider ModelCore settles at HR75/min and HR90/min but caps
  at HR105/min;
- the experimental A0 comparator also caps at HR105/min, so the current
  evidence supports `runtime-boundary-likely` rather than an
  atrial-provider-specific HR105 failure;
- global elastance mode is measured as a whole-heart reference only and cannot
  justify bridge selection;
- no Phase 6 bridge is selected or recommended;
- this result does not tune atrial candidates, relax settling criteria, wire
  production runtime, reauthor official cases, or make final atrial physiology
  claims.

## Phase 5AN atrial figure-eight readability result

`data/myocardium/protocols/atrial-figure-eight-readability-phase5an-result-v1.json`
starts the refined educational atrial figure-eight path without selecting a
Phase 6 bridge. The runner compares A0, the existing A1 baseline, and a new
experimental `atrial-refined-reservoir-booster-bridge-v1` provider at HR75/90
normal, preload-low, and preload-high points. HR105/120 remain edge/runtime
evidence and are not the main gate in this artifact.

Result boundary:

- existing A1 should be fixed around normalized valve diode contamination and
  sampling-invariant loop readability; repeatability is not the primary blocker
  after the Phase 5.5B full-beat localization;
- the figure-eight metric set is LA/RA booster-loop and reservoir-loop signed
  PV areas, lobe-balance ratio, PV self-intersections, roughness sampling span
  from 240/480/960 Hz downsampled windows, MV/TV diode hit and impulse rates
  versus A0, and settled LV/RV health readback;
- refined A1 is `not-supported`: it settled at HR75 normal/low/high and HR90
  high-preload, but no point had both readable LA and RA loops after requiring
  opposing booster/reservoir signed lobes for the figure-eight boolean rule;
- refined A1 reduced MV/TV diode impulse per beat versus A0 across the measured
  envelope, but hit-sample rate still exceeded A0 at normal/high-preload points,
  so valve contamination remains bounded evidence rather than acceptance;
- refined A1 closed-loop sampling roughness was bounded except for
  high-preload HR75 LA;
- no Phase 6 bridge is selected or recommended, and this does not wire
  production runtime, reauthor official cases, change Workbench/runtime state,
  validate AF physiology, or make final atrial physiology claims.

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

Current-main morphology baseline snapshot addition:

```text
data/myocardium/protocols/pv-loop-current-main-baseline-snapshot-v1.json
```

Phase M1 current-main residual morphology blocker classification addition:

```text
data/myocardium/protocols/morphology-blocker-bundle-phase-m1-result-v1.json
```

Run `npm run verify:myocardium-morphology-blocker-bundle` to check the compact
post-PR #219 diagnostic bundle. Phase M1 reruns the PV-loop morphology runner
and the filling and arterial-load diagnostic comparators, then commits only a
compact result. It classifies the remaining filling gap as
`lv-failure-dobutamine` branch 1 RV beats 1-3 missing only
`eaLikeInflowProxy`; all other residual anti-gaming readouts are available.
The arterial comparator remains internally interpretable, but direct
Zc/reflection signals remain explicit `missing-no-proxy` records with proxy use
forbidden. Phase M1 does not clear the full morphology blocker set and does not
run either the paired LV Land-vs-stock morphology matrix or the isolated
arterial bench.

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
Run `npm run verify:myocardium-phase5c-post-fidelity-entry-gate` and
`npm run verify:myocardium-modelcore-equivalent-positive-control-closure` to
check the gate and the ModelCore-equivalent positive-control evidence. Run
`npm run verify:myocardium-modelcore-active-provider-state-lifecycle` to check
the Phase 5C-J provider-state lifecycle precondition used by Land pairing.
Run `npm run verify:myocardium-modelcore-active-source-pressure-adapter` to
check the Phase 5C-K source-only pressure adapter precondition used by that
pairing. Run
`npm run verify:myocardium-modelcore-paired-land-source-provider` to run and
check the Phase 5C-L paired Land source-provider experiment. Run
`npm run verify:myocardium-modelcore-paired-land-qdot-clamp-attribution` to
check the Phase 5C-M same-closure qDot clamp-threshold attribution diagnostic.
The entry route ids recorded in the gate are
`same-closure-period2-positive-control`,
`modelcore-equivalent-closure-positive-control`, and
`owner-approved-replacement-criterion`. Phase 5C-I records owner-approved
experimental source-provider-limited ModelCore wiring and legacy activeStress
period-2 positive-control evidence. Phase 5C-J records provider-state lifecycle
precondition evidence for the experimental hook. Phase 5C-K records a
source-only pressure adapter precondition: the legacy LV source-only adapter
matches the legacy full-pressure provider under the pinned low-preload protocol.
Source-only providers are mutually exclusive with pressure overrides and must
provide source-specific debug terms; Land providers must keep mutable solver
state in `providerState`. Phase 5C-L records the paired-result route state:

```text
status=satisfied-experimental-paired-land-run
routeSatisfactionStatus=satisfied-paired-land-provider-run-finite
```

This state is for paired result interpretation only. It does not change runtime
replacement, official morphology acceptance, final no-alternans, schema
migration, case/workbench wiring, or tuning boundaries;
`second-order-reference-required` remains the next robustness constraint.
Phase 5C-L runs the paired Land source-provider experiment under the same
ModelCore closure. The legacy source-only positive control remains period-2,
the Land 2017 LV source-only provider runs finite with zero Land solver
failures and settles to period-1, and `sourceProviderDifferenceOnly=true` is
satisfied for this experimental LV source-only pair. This is outcome class A:
a positive interpretable signal for this closure, not final no-alternans and
not official morphology acceptance. This gate keeps no runtime replacement, no
qDot/valve/afterload/preload tuning, no Land parameter tuning, no official
morphology acceptance, no final no-alternans, and no TriSeg adoption as the
current boundary.

Phase 5C-M interprets the Phase 5C-L result by measuring trace-derived AoV qDot
clamp-threshold engagement under the same closure. The recorded result is
[`../../data/myocardium/protocols/modelcore-paired-land-qdot-clamp-attribution-result-v1.json`](../../data/myocardium/protocols/modelcore-paired-land-qdot-clamp-attribution-result-v1.json).
The legacy source-only positive control has AoV qDot clamp hit fraction 0.0521
with peak raw qDot 404765 mL/s^2, while the Land source-only run has hit
fraction 0 and peak raw qDot 9600 mL/s^2. Land also has much lower QAo cap
ratio and lower output. The diagnostic classification is
`clamp-threshold-avoidance-risk-supported`: Land period-1 remains a positive
interpretable signal, but structural alternans removal is not established.
Output-matched paired evidence, SDIRK2 reference evidence, and preload-domain
sweep evidence remain required before any final no-alternans or domain claim.

Phase 5C-N runs the first output-match diagnostic as a predeclared TBV-axis
matrix, not as preload tuning. The recorded result is
[`../../data/myocardium/protocols/modelcore-paired-land-output-matched-qdot-attribution-result-v1.json`](../../data/myocardium/protocols/modelcore-paired-land-output-matched-qdot-attribution-result-v1.json).
Every matrix point is independently initialized, settles by convergence before
the 45s cap, and preserves `sourceProviderDifferenceOnly=true` within each same
effective-TBV pair. Cross-TBV output matching is explicitly not a
source-provider-only comparison. The diagnostic status is
`not-overlapped`: the best Land point reaches only 0.376 of pinned legacy CO/SV
and 0.091 of pinned legacy QAo peak. This means the predeclared preload/TBV axis
does not push Land into the legacy qDot clamp-engaged output regime; clamp
threshold avoidance remains unresolved and structural alternans removal remains
unclaimed.

Phase 5C-O runs the activation/source-interface audit recommended after the
Phase 5C-N `not-overlapped` result. The recorded result is
[`../../data/myocardium/protocols/modelcore-land-activation-interface-audit-result-v1.json`](../../data/myocardium/protocols/modelcore-land-activation-interface-audit-result-v1.json).
It audits the pinned low-preload point and the Phase 5C-N best-Land point under
the same source-provider-only closure. Both points converge with zero Land solve
failures and source/commit audit samples. The classification is
`land-source-interface-underactivation-gap-observed`: the settled Land trace
active-stress target is only 0.00119 of pinned legacy at `delta=-1250` and
0.000892 at `delta=1000`. The provider source/commit paths can show higher
transient source stress during the full run, so the result localizes the output
gap to the settled activation/source interface and requires calcium/source-scale
and explicit matched-regime checks before any structural alternans claim.

Phase 5C-P runs the calcium/source-scale forcing bracket recommended after
Phase 5C-O. The recorded result is
[`../../data/myocardium/protocols/modelcore-land-calcium-source-forcing-bracket-result-v1.json`](../../data/myocardium/protocols/modelcore-land-calcium-source-forcing-bracket-result-v1.json).
It reruns the pinned low-preload point and the Phase 5C-N best-Land point with
predeclared calcium-input and source-stress forcing scenarios. All 18 forced
points converge with zero Land solve failures. The best calcium-input forcing
candidate (`calcium-scale-30` at `delta=-1250`) reaches the legacy output and
AoV qDot clamp regime while remaining period-1. This is the predeclared coarse
output/qDot regime, not waveform or morphology acceptance. The result is a
forcing attribution signal and a calcium-unit/source-interface audit target; it
is not runtime replacement, final no-alternans acceptance, or official
morphology acceptance.

Phase 5C-Q runs that calcium unit/source-interface audit. The recorded result is
[`../../data/myocardium/protocols/modelcore-land-calcium-unit-interface-audit-result-v1.json`](../../data/myocardium/protocols/modelcore-land-calcium-unit-interface-audit-result-v1.json).
Run `npm run verify:myocardium-modelcore-land-calcium-unit-interface-audit` to
check the artifact against the live experiment. It reruns the pinned point and
the Phase 5C-N best-Land point under the same non-provider closure and maps
legacy active internal `c` into Land free calcium through direct, fixed
unit-style, activation-equivalent diagnostic, and Phase 5C-P reference mappings.
The pinned legacy LV `c` peak is 0.1523, giving a Phase 2B absolute peak
free-calcium scale of 6.70 and a Land CaT50Ref peak scale of 5.28. The
`phase2b-absolute-peak-ca` simple unit-style calcium mapping reaches the coarse
legacy output/qDot regime at the pinned point while Land remains period-1. This
means Phase 5C-P scale 30 is a positive-control reference, not a required scale.
The result is source-interface evidence only; it is not runtime replacement,
final no-alternans acceptance, structural alternans removal, or official
morphology acceptance. SDIRK2 reference evidence remains required before final
interpretation, and Level 1-4 operating-point calibration remains the next
runtime-design prerequisite.

Phase 5C-R runs the provider-local Land SDIRK2 commit-solver reference check.
The recorded result is
[`../../data/myocardium/protocols/modelcore-land-sdirk2-reference-result-v1.json`](../../data/myocardium/protocols/modelcore-land-sdirk2-reference-result-v1.json).
Run `npm run verify:myocardium-modelcore-land-sdirk2-reference` to check the
artifact against the live experiment. It reruns only the pinned low-preload
point and the Phase 5C-N best-Land point: legacy source-only, raw Land BE/SDIRK2,
and Phase 5C-Q `phase2b-absolute-peak-ca` Land BE/SDIRK2. This is not a global
ModelCore SDIRK2 run; ModelCore's non-provider closure and current stepper stay
unchanged, and the SDIRK2 stage inputs are provider-local interpolation from
before/after commit snapshots. At the pinned mapped point, SDIRK2 preserves the
coarse output/qDot signal and period-1 result, but SDIRK2 stage1 solve failures
remain high, so the classification is `sdirk2-reference-inconclusive`. This does
not unlock final no-alternans, structural alternans removal, runtime replacement,
or official morphology acceptance.

Phase 5S runs the closed-loop operating-point calibration diagnostic. The
recorded result is
[`../../data/myocardium/protocols/modelcore-land-operating-point-calibration-result-v1.json`](../../data/myocardium/protocols/modelcore-land-operating-point-calibration-result-v1.json).
Run `npm run verify:myocardium-modelcore-land-operating-point-calibration` to
check the artifact against the live experiment. It compares legacy LV
source-only and Phase 5C-Q `phase2b-absolute-peak-ca` Land BE source-only at
fixed diagnostic points `-1250`, `0`, and `1000` mL. These are fixed
operating-domain points, not preload tuning. Land has zero BE solve failures.
The `0` and `1000` mL main-domain points sit in a coarse legacy output/stress
regime and remain period-1, while the low-preload point remains report-only edge
evidence. The education-tool DoD checkpoint is
`draft-do-d-ready-for-owner-review`; this is not Level 3/4 acceptance, runtime
replacement, final no-alternans, structural alternans removal, or official
morphology acceptance.

Phase 5T converts that Phase 5S checkpoint into a generated education-tool
Definition of Done checkpoint. The recorded result is
[`../../data/myocardium/protocols/myocardium-education-tool-dod-checkpoint-v1.json`](../../data/myocardium/protocols/myocardium-education-tool-dod-checkpoint-v1.json).
Run `npm run verify:myocardium-education-tool-dod-checkpoint` to check the
artifact against Phase 5S evidence, official-case teaching metadata, and the
Studio MVP surface policy. The classification is `owner-review-ready-not-accepted`
and `accepted: false`; runtime, case, and Workbench wiring are absent. The
historical handoff was a developer-only LV Land runtime-flag design RFC before
any official case/workbench/runtime wiring.

Phase 5U records that developer-only LV Land runtime-flag RFC. The recorded
result is
[`../../data/myocardium/protocols/myocardium-developer-only-lv-land-runtime-flag-rfc-v1.json`](../../data/myocardium/protocols/myocardium-developer-only-lv-land-runtime-flag-rfc-v1.json).
Run `npm run verify:myocardium-developer-only-lv-land-runtime-flag-rfc` to check
the artifact against the live helper and a ModelCore smoke construction. The
helper builds LV-only experimental provider options from the Phase 5C-Q
`phase2b-absolute-peak-ca` calcium mapping and requires the explicit
developer-only acknowledgement; it does not wire official cases, Workbench,
state schema, runtime UI, or production registries. The artifact remains
`rfc-draft-owner-decision-needed`, `accepted: false`, and owner decision is still
required before any developer-only implementation beyond the tools helper.

Phase 5V implements that developer-only LV Land runtime flag path only for
non-production measurement. The recorded result is
[`../../data/myocardium/protocols/myocardium-developer-only-lv-land-runtime-flag-suite-result-v1.json`](../../data/myocardium/protocols/myocardium-developer-only-lv-land-runtime-flag-suite-result-v1.json).
Run `npm run verify:myocardium-developer-only-lv-land-runtime-flag-suite` to
rerun the fixed Phase 5S operating suite through the Phase 5U helper. All three
diagnostic points converge with health ok, Land solve failure count zero,
source/commit path calls present, and exact Phase 5S Land output reproduction.
This is developer-only measured evidence; production runtime replacement remains
blocked, as do official case wiring, Workbench runtime wiring, state schema
migration, runtime UI, production registries, official morphology acceptance,
final no-alternans, and structural alternans-removal claims.

Phase 5W expands that developer-only LV Land envelope without production wiring.
The recorded result is
[`../../data/myocardium/protocols/myocardium-developer-only-lv-land-envelope-phase5w-result-v1.json`](../../data/myocardium/protocols/myocardium-developer-only-lv-land-envelope-phase5w-result-v1.json).
Run `npm run verify:myocardium-developer-only-lv-land-envelope` to check the
HR75/90 x TBV 4350/5600/6600 stock-active vs developer-only LV Land matrix.
The matrix uses independent initialization, same closure invariants,
period-aware metric windows, and 1000 Hz measurement windows after 240 Hz
settling. Main-domain Land runs are settled with health ok, source/commit path
calls present, and Land solve failure count zero, but HR90 main-domain Land
settles as period-2 and stock active HR90/TBV5600 caps.
Low-preload results remain report-only edge evidence. Phase 5W is diagnostic
envelope evidence only; production runtime replacement, official cases,
Workbench runtime wiring, state schema migration, runtime UI, production
registry integration, Level 3/4 acceptance, official morphology acceptance,
final no-alternans, and structural alternans-removal claims remain blocked.

Phase 5X records an early-default-candidate preflight for the users0 posture
without flipping runtime default or deleting legacy active-stress. The recorded
result is
[`../../data/myocardium/protocols/lv-land-default-candidate-preflight-phase5x-result-v1.json`](../../data/myocardium/protocols/lv-land-default-candidate-preflight-phase5x-result-v1.json).
Run `npm run verify:myocardium-lv-land-default-candidate-preflight` to check
the compact evidence. The preflight uses synthetic one-axis user-knob sweep
points rather than official-case tuning: normal floor, preload, HR,
contractility, afterload, arterial stiffness, and venous tone are each measured
as stock active versus developer-only LV Land through the PV-loop morphology
runner. The current measured result is blocked before default flip: Land has
health ok and zero solve failures at all 14 points, but the normal floor misses
the LVEDP bound and absolute morphology blockers remain. Legacy active-stress
is kept as a frozen positive-control reference; SDIRK2 alternans closure remains
parallel science work, not a product migration gate. Official case reauthoring,
per-case tuning, Tref fudge, qDot/valve/afterload/preload/Land-parameter
tuning, Workbench/runtime wiring, state schema migration, production registry
integration, official morphology acceptance, final no-alternans, and
clinical/scientific validation remain blocked.

Phase 5Y localizes the Phase 5X LV qDot morphology blocker without tuning qDot,
valves, load, preload, Land parameters, or source-stress scale. The recorded
result is
[`../../data/myocardium/protocols/lv-land-qdot-blocker-localization-phase5y-result-v1.json`](../../data/myocardium/protocols/lv-land-qdot-blocker-localization-phase5y-result-v1.json).
Run `npm run verify:myocardium-lv-land-qdot-blocker-localization` to check the
artifact. The measured result covers the same 14 synthetic user-knob points:
Land has health ok, all Land points settle, and Land solve failure count is
zero. All 14 points show direct AoV qDot raw/post clamp engagement, while the
Phase 5X morphology `qDotClampHitFraction=1` blocker is amplified by a short
morphology-classified ejection core relative to the broader AoV-open window.
The normal-floor LVEDP blocker remains recorded. This is diagnostic evidence
only; it does not flip runtime default, delete legacy active-stress, accept
official morphology, or authorize qDot/valve/afterload/preload/Land-parameter
tuning.

Phase 5Z localizes that short ejection-window denominator without changing the
model. The recorded result is
[`../../data/myocardium/protocols/lv-land-ejection-window-localization-phase5z-result-v1.json`](../../data/myocardium/protocols/lv-land-ejection-window-localization-phase5z-result-v1.json).
Run `npm run verify:myocardium-lv-land-ejection-window-localization` to check
the artifact. The same 14 synthetic user-knob points are rerun through stock
active and developer-only LV Land. Land has health ok, all Land points settle,
and Land solve failure count is zero. After aligning Phase 5Z physical-window
durations and volumes to Phase 5X per-beat metric rows, 13/14 Land points
classify as `no-phase5x-window-amplification` and only HR120 remains
`classifier-window-denominator-amplification-dominant`: the median Phase 5X
ejection-core/AoV-open duration ratio is `0.133333`, while the median
high-flow-core qDot fraction is `0.542857`, below the predeclared high-core
dominance threshold. This does not support a dominant short-window denominator
explanation; treat the qDot signal as real AoV/root discharge evidence and run
arterial root/Zc/inertance plus valve/load diagnostics before any qDot or valve
threshold tuning. That discharge-path direction is the next diagnostic
hypothesis, not root-cause acceptance for Phase 5Z. Contractility-low/high Land
branches match the normal-floor Land readout in this artifact, so the sweep is
point coverage rather than independent Land contractility-sensitivity evidence.
Runtime default flip, official morphology acceptance, final no-alternans, and
clinical/scientific validation remain blocked.

Phase 5AA records an isolated arterial root inertance bench without changing
the model. The recorded result is
[`../../data/myocardium/protocols/arterial-root-inertance-bench-phase5aa-result-v1.json`](../../data/myocardium/protocols/arterial-root-inertance-bench-phase5aa-result-v1.json).
Run `npm run verify:myocardium-arterial-root-inertance-bench` to check the
artifact. The bench reuses the Phase 5X synthetic user-knob matrix and measures
stock active plus developer-only LV Land traces, then replays the AoV/root
discharge equation offline with measured `LVP-AoP` and measured AoV opening as
prescribed inputs. qDot and valve thresholds, load/preload, Land parameters,
Tref, and source-stress scale are fixed. The current result finds
lower-clamp inertance candidates without severe forward-volume or duration loss
in 27/27 health-ok stock/Land runs, including 14/14 health-ok Land runs. The
raw replay signal is 28/28, but the failed-health stock HR120 run is tracked
separately rather than used in the headline. The median current replay AoV-open
qDot clamp fraction is `0.518773`, and the median best-candidate clamp reduction
is `1`. This is a diagnostic signal for a narrower arterial root/Zc/inertance
candidate, not runtime adoption. The bench is offline prescribed-pressure
evidence: it has no closed-loop pressure feedback, does not model candidate
valve timing, is not direct adoption or calibration of the existing Ao_SA
inertance edge, does not claim Zc/reflection availability, is not root-cause
acceptance, is not fix acceptance, and does not claim qDot clamp removal,
official morphology acceptance, or clinical/scientific validation.
`bestCandidateId` is clamp-reduction
prioritized diagnostic ranking, not a direct physical adoption choice; the next
step should treat lower inertance values as a Pareto region against output
preservation.

Phase 5AB carries that lower-inertance Pareto region into a closed-loop
diagnostic sweep without production wiring. The recorded result is
[`../../data/myocardium/protocols/arterial-root-inertance-closed-loop-phase5ab-result-v1.json`](../../data/myocardium/protocols/arterial-root-inertance-closed-loop-phase5ab-result-v1.json).
Run `npm run verify:myocardium-arterial-root-inertance-closed-loop` to check the
artifact. The sweep covers the full Phase 5X synthetic user-knob matrix plus a
bounded TBV 4350 low-preload edge, for stock active and developer-only LV Land,
using the existing `AoV_L` carrier as an effective AoV/root-boundary inertance
diagnostic. qDot clamps, valve thresholds, valve loss terms, afterload, preload,
Tref, source-stress scale, and Land parameters are fixed. The current result
finds 72/83 health-ok candidate comparisons with lower AoV-open qDot clamp
engagement and preserved output, out of 90 total candidate comparisons,
including 36 health-ok Land candidate comparisons. 67 health-ok candidate
comparisons show at least one positive morphology proxy, with 70 raw morphology
proxy signals tracked separately. Median Pareto clamp reduction is `0.829895`
and median Pareto forward-volume ratio is `1.007398`. Non-ok or unmeasured runs
are tracked separately rather than used in the health-ok headline. The
low-preload edge is
period-1 in current stock and Land under this closure, but remains bounded edge
evidence and does not unlock final no-alternans acceptance. This is not direct
Ao_SA adoption, not physical Zc calibration, not qDot clamp removal, not
valve-timing acceptance, not official morphology acceptance, not root-cause
acceptance, not fix acceptance, and not runtime default flip.

Phase 5AC adds the direct isolated arterial root/Zc impedance bench requested by
the Phase 5AB boundary. The recorded result is
[`../../data/myocardium/protocols/arterial-root-zc-impedance-bench-phase5ac-result-v1.json`](../../data/myocardium/protocols/arterial-root-zc-impedance-bench-phase5ac-result-v1.json).
Run `npm run verify:myocardium-arterial-root-zc-impedance-bench` to check the
artifact. The bench linearizes the current systemic arterial load, prescribes a
70mL half-sine ejection flow over 250ms, and computes direct input impedance
spectra for current `AoV_L` plus the Phase 5AB lower-output-preserving total
2x/3x/4x effective AoV/root inertance candidates. DC resistance remains
invariant at `0.875537` mmHg*s/mL, while the 20Hz direct high-frequency bench
readout rises from `3429400.81599` Pa*s/m^3 in the current closure to a
candidate range of `7617834.189257`-`15994702.168151` Pa*s/m^3. This makes a
direct characteristic-impedance-like bench readout available for anti-gaming and
future sourced calibration. It still keeps reflection coefficient
`unavailable-no-proxy`: the 0D lumped bench does not model wave travel or wave
reflection directly. This is not a closed-loop runtime change, not external
physiological Zc calibration, not direct Ao_SA adoption, not qDot clamp removal,
not root-cause/fix acceptance, and not official morphology acceptance.

Phase 5AD carries that readout into an off-by-default root/Zc prototype smoke
diagnostic. The recorded result is
[`../../data/myocardium/protocols/arterial-root-zc-prototype-smoke-phase5ad-result-v1.json`](../../data/myocardium/protocols/arterial-root-zc-prototype-smoke-phase5ad-result-v1.json).
Run `npm run verify:myocardium-arterial-root-zc-prototype-smoke` to check the
artifact. The smoke test measures stock active and developer-only LV Land at
normal-floor, HR90, arterial-stiffness-high, and the bounded low-preload edge
across current closure, the Phase 5AB `AoV_L` 2x boundary-carrier reference,
direct `Ao_SA.L` 1.5x/2x edge overrides, and a combined `AoV_L` 2x +
`Ao_SA.L` 1.5x candidate. qDot clamps, valve thresholds, valve loss terms,
load/preload, Tref, source-stress scale, and Land parameters remain fixed. The
current result finds 5 measured-health-ok lower-clamp output-preserved
comparisons for the AoV-boundary carrier reference, 0 for direct
`Ao_SA.L`-only candidates, and 3 for the combined candidate while classifying
the combined path as
not-robust. Seven non-ok or unmeasured runs are boundary-tracked. This is a
routing diagnostic: do not adopt direct `Ao_SA.L` as the root/Zc fix from this
evidence, and do not adopt the AoV-boundary carrier as physical calibration.

Phase 5AE physicalizes the Phase 5AD AoV-boundary carrier signal behind an
experimental boundary/root inertance hook. The recorded result is
[`../../data/myocardium/protocols/arterial-root-boundary-inertance-phase5ae-result-v1.json`](../../data/myocardium/protocols/arterial-root-boundary-inertance-phase5ae-result-v1.json).
Run `npm run verify:myocardium-arterial-root-boundary-inertance` to check the
artifact. The selected stock/Land smoke keeps qDot clamps, valves, load/preload,
Tref, source-stress scale, Land parameters, default params, topology, and state
layout fixed. It records 48 runs: 46 measured, 40 measured health ok, and Land
solve failure count zero. The experimental boundary/root mechanism carries 5
measured-health-ok signal comparisons, matching the AoV-boundary carrier signal,
with 7 measured-health-ok carrier/mechanism matches. This remains diagnostic:
no production/default ModelCore equation change, topology change, state-layout
change, qDot clamp removal, direct `Ao_SA.L` adoption, boundary/root production
adoption, sourced Zc calibration, or official morphology acceptance is claimed.

Phase 5AF calibrates the Phase 5AC direct root/Zc readout against an explicit
sourced Zc anchor without changing runtime equations. The recorded result is
[`../../data/myocardium/protocols/arterial-root-zc-calibration-phase5af-result-v1.json`](../../data/myocardium/protocols/arterial-root-zc-calibration-phase5af-result-v1.json).
Run `npm run verify:myocardium-arterial-root-zc-calibration` to check the
artifact. The source anchor is Bikia et al. 2021 `Zao` mean `0.056` with SD
`0.012` mmHg*s/mL, yielding a preferred sourced Zc range of `0.044`-`0.068`
and a broad range of `0.032`-`0.080` mmHg*s/mL. The current closure 20Hz
readout is `0.025723` mmHg*s/mL and below the broad range; the total 2x
AoV/root candidate equivalent to the Phase 5AE boundary/root mechanism is
`0.057139` mmHg*s/mL and inside the preferred range; total 3x/4x candidates are
above the broad range. This resolves the sourced calibration step for
diagnostic candidate selection only. It does not adopt the mechanism, remove
qDot clamps, tune valves or loads, claim reflection coefficient, pass official
morphology, or unlock production/default root/Zc adoption.

Phase 5AG carries the sourced-calibrated total 2x boundary/root mechanism into
a closed-loop valve/load timing and qDot-engagement diagnostic over the full
Phase 5X synthetic matrix plus the frozen low-preload edge. The recorded result
is
[`../../data/myocardium/protocols/arterial-root-boundary-timing-phase5ag-result-v1.json`](../../data/myocardium/protocols/arterial-root-boundary-timing-phase5ag-result-v1.json).
Run `npm run verify:myocardium-arterial-root-boundary-timing` to check the
artifact. The run compares only current closure and the Phase 5AF preferred
boundary/root candidate, with qDot clamps, valves, load/preload, Tref,
source-stress scale, Land parameters, default params, topology, and state
layout fixed. It records 60/60 measured runs, 56 health ok runs, and zero Land
solve failures. Of 28 measured-health-ok candidate comparisons, 18 preserve
output while showing both qDot-engagement and valve/load timing signals: 12
stock and 6 Land. Normal-floor Land is `candidate-timing-only-output-preserved`
rather than qDot+timing, and one HR120 stock candidate is
`candidate-output-or-timing-cost` with non-ok health. This remains diagnostic:
no root/Zc production adoption, qDot clamp removal, valve/load timing
acceptance, reflection coefficient claim, official morphology acceptance, or
runtime default flip is claimed.

Phase 5AH records the attribution diagnostic for the Phase 5AG split in
[`../../data/myocardium/protocols/arterial-root-boundary-attribution-phase5ah-result-v1.json`](../../data/myocardium/protocols/arterial-root-boundary-attribution-phase5ah-result-v1.json).
Run `npm run verify:myocardium-arterial-root-boundary-attribution` to check the
artifact. It reanalyzes the measured Phase 5AG artifact and does not rerun or
modify the model. Stock has 12/13 measured-health-ok qDot+timing comparisons;
Land has 6/15 qDot+timing and 9/15 timing-only output-preserved comparisons,
with output preserved in 15/15 health-ok Land comparisons and zero Land solve
failures. The weaker Land qDot headline is therefore attributed to
below-threshold qDot reduction, not to a Land solve or output failure. HR120
stock is non-health-ok in both current and candidate runs, so the output/timing
cost is treated as bounded edge evidence and excluded from adoption signal.
This remains an attribution diagnostic: no boundary/root production adoption,
qDot clamp removal, valve/load timing acceptance, official morphology
acceptance, Land default flip, or clinical/scientific validation is claimed.

Phase 5AI records the Land normal-floor LVEDP attribution diagnostic in
[`../../data/myocardium/protocols/land-normal-floor-lvedp-attribution-phase5ai-result-v1.json`](../../data/myocardium/protocols/land-normal-floor-lvedp-attribution-phase5ai-result-v1.json).
Run `npm run verify:myocardium-land-normal-floor-lvedp-attribution` to check the
artifact. It independently remeasures 16 normal-floor single-axis probes with
qDot clamps, valves, root/Zc, Tref, source-stress scale, and Land parameters
fixed. Land current normal reproduces the Phase 5X blocker at `17.276729` mmHg,
only `1.276729` mmHg above the `16` mmHg normal-floor LVEDP bound, with no
other floor failures. Preload/TBV and venous-tone probes lower LVEDP but do not
resolve it. The output-preserved diagnostic runs that resolve LVEDP are
`land-lv-bpas-0p90`, `land-lv-bpas-0p85`, and `land-ca-release-1p10`, so the
artifact classifies the blocker as
`bounded-small-lvedp-excess-diagnostic-only`. This is diagnostic-only evidence:
preload/venous/passive/geometry/source-calcium changes, Tref fudge, official
case reauthoring, official morphology acceptance, and clinical/scientific
validation are not claimed. In short, Phase 5AI does not change the runtime
selection; historical verifier phrase: no runtime default flip. The next migration step is an owner RFC with frozen legacy rollback
if this bounded blocker is acceptable.

Phase 5AJ records the user-0 LV Land default-flip RFC in
[`../../data/myocardium/protocols/user0-lv-land-default-flip-rfc-phase5aj-result-v1.json`](../../data/myocardium/protocols/user0-lv-land-default-flip-rfc-phase5aj-result-v1.json)
and
[roadmap/phase5aj-user0-lv-land-default-flip-rfc.md](roadmap/phase5aj-user0-lv-land-default-flip-rfc.md).
Run `npm run verify:myocardium-user0-lv-land-default-flip-rfc` to check it. The
artifact pins Phase 5U, 5V, 5X, 5AH, and 5AI upstream evidence by stable hash
and classifies the next step as `rfc-ready-owner-decision-needed`. It asks
whether the owner wants a separate user-0 staged LV Land migration
implementation PR, while keeping legacy active-stress as frozen reference and
rollback. Owner options are GO, DEFER for an explicit calibration PR first, or
NO-GO; owner decision needed remains the status. Phase 5AJ is RFC-only: runtime
selection change, legacy deletion, root/Zc adoption, atrial figure-eight gate,
official case reauthoring, accepted tuning, official morphology acceptance,
final no-alternans, and clinical/scientific validation are not claimed.
Historical verifier phrase: no runtime default flip.

Phase 5AK implements the owner-GO user-0 staged LV Land runtime selection in
[`../../data/myocardium/protocols/user0-lv-land-default-flip-phase5ak-result-v1.json`](../../data/myocardium/protocols/user0-lv-land-default-flip-phase5ak-result-v1.json).
Run `npm run verify:myocardium-user0-lv-land-default-flip` to check it. The
runtime resolver now selects LV Land for preview, transition-steady, and
Guyton/Starling runtime surfaces. The `runScenario` and `runToPeriodicSteady`
regression APIs keep frozen legacy behavior unless `runtimeActiveSourceMode` is
passed explicitly, and the bare `ModelCore` constructor remains legacy for
frozen reference and diagnostics. The existing LV contractility knob remains
active through a normalized Land calcium-input user-control multiplier rather
than Tref/source-stress tuning.
The smoke matrix records 4/4 LV Land default points settled and health-ok with
zero Land solve failures, plus 4/4 legacy rollback points provider-free and
non-failed. The implementation adds a transition-steady provider-state sidecar
without changing the serialized state schema. Phase 5AK does not delete legacy
active-stress; root/Zc adoption, official-case tuning, qDot/valve tuning,
official morphology acceptance, final no-alternans, and clinical validation are
not part of this phase.
Replacing RV/atria and eventually all chambers is a future lane, not part of
this PR.

Phase 5AL records the first all-chamber-replacement follow-up for RV in
[`../../data/myocardium/protocols/rv-land-default-candidate-phase5al-result-v1.json`](../../data/myocardium/protocols/rv-land-default-candidate-phase5al-result-v1.json).
Run
`npx vite-node --script tools/myocardium/buildRvLandDefaultCandidatePhase5AL.ts`
to regenerate it; no permanent npm verifier is added for this diagnostic. The
Phase 5AK runtime default remained the LV-only Land mode in that phase, while
`lv-rv-land-phase5al-default-candidate-v1` is an explicit candidate mode that
wires both LV and RV through Land providers. The smoke matrix records 5/5
candidate points settled and health-ok with zero LV/RV Land solve failures and
both providers called at every candidate point; the current LV-only default
remains RV-provider-free, and legacy rollback remains provider-free. Phase 5AL
does not flip the runtime default to LV+RV, delete legacy active-stress, adopt
root/Zc changes, select an atrial figure-eight model, tune official cases, or
claim official morphology, final no-alternans, all-chamber replacement, or
clinical/scientific validation.

Phase 5AO implements the next owner-directed chamber replacement step in
[`../../data/myocardium/protocols/lv-rv-land-default-flip-phase5ao-result-v1.json`](../../data/myocardium/protocols/lv-rv-land-default-flip-phase5ao-result-v1.json).
Regenerate it with
`npx vite-node --script tools/myocardium/buildLvRvLandDefaultFlipPhase5AO.ts`;
no permanent npm verifier is added for this diagnostic. Runtime preview,
transition-steady, and Guyton/Starling surfaces now resolve the user-0 staged
default as `lv-rv-land-phase5ao-user0-staged-default-v1`, wiring both LV and RV
through Land providers. `runScenario`, `runToPeriodicSteady`, and bare
`ModelCore` construction remain frozen legacy reference paths unless an
explicit `runtimeActiveSourceMode` is passed. The smoke matrix records 5/5
LV+RV default points settled and health-ok with zero LV/RV Land solve failures,
both providers and runtime sidecars present at every default point, 5/5
previous LV-only points still RV-provider-free when requested explicitly, and
5/5 legacy rollback points provider-free and non-failed. Phase 5AO does not
delete legacy active-stress, adopt root/Zc changes, select an atrial
figure-eight model, tune official cases, remove qDot clamps, claim official
morphology, claim final no-alternans, or claim clinical/scientific validation.
RA/LA replacement remains a separate chamber lane.

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
`proposed-next-route-not-implemented` for the historical Phase 5C-G snapshot;
it does not implement a ModelCore-equivalent closure and does not satisfy an
entry route. The current outcome remains
`positive-control-failed`, `settled-period-1`, and
`blocked-until-positive-control-period2`. This phase has no runtime
replacement, no qDot/valve/afterload tuning, no official morphology
acceptance, no final no-alternans, no RV pressure-overload coverage, no
ventricular interdependence coverage, no right-heart failure coverage, and no
TriSeg adoption.

Phase 5C-H records the
`modelcore-equivalent-closure-positive-control` route definition in
[roadmap/phase5c-modelcore-equivalent-route-gate.md](roadmap/phase5c-modelcore-equivalent-route-gate.md)
and the same Phase 5C-E gate. Phase 5C-I updates the route with experimental
source-provider hook evidence. Through Phase 5C-I, the route remained
`defined-not-satisfied` with
`closureImplementationStatus=experimental-source-provider-hook-implemented`,
`routeSatisfactionStatus=partial-legacy-positive-control-pass-land-pairing-not-run`,
and no runtime replacement, no chamber/case/workbench/state-schema wiring, no
production ModelCore adoption beyond the artifact-only constructor hook, no
official morphology acceptance, no final no-alternans, and no TriSeg adoption.
Phase 5C-J and Phase 5C-K add provider-state lifecycle and source-only pressure
adapter preconditions for Land pairing. Phase 5C-L performs the paired Land
run, records the result artifact at
[`../../data/myocardium/protocols/modelcore-paired-land-source-provider-run-result-v1.json`](../../data/myocardium/protocols/modelcore-paired-land-source-provider-run-result-v1.json),
and evaluates `sourceProviderDifferenceOnly=true` for the experimental LV
source-only pair. Phase 5C-M adds same-closure qDot clamp-threshold attribution
and records that Land avoids AoV qDot clamp engagement at a lower-output
operating point. Phase 5C-N adds a predeclared TBV-axis output-match diagnostic
and records output-match not-overlapped; second-order/reference, explicit output
forcing or another owner-approved match axis, and preload-domain robustness
remain future work. Phase 5C-O adds activation/source-interface evidence and
records a settled-trace Land stress gap; calcium/source-scale and explicit
matched-regime diagnostics now precede any structural alternans claim. Phase
5C-P adds that explicit forcing bracket and records that calcium-input scaling
placed Land in the legacy output/qDot regime while Land remains period-1,
but this remains attribution evidence only. Phase 5C-Q records that a Phase 2B
absolute peak simple unit-style calcium mapping reaches the coarse legacy
output/qDot regime at the pinned point while Land remains period-1; scale 30 is
therefore positive-control evidence, not a required runtime scale. Phase 5C-R
adds provider-local SDIRK2 evidence: the pinned mapped signal is preserved, but
stage1 solve failures keep the SDIRK2 reference inconclusive.

## Imported bundle checks

Revision 3's original markdown hashes are preserved in
[revision3-validation.json](revision3-validation.json). The repository import
status, source hashes, and adapted repository hashes are recorded in
[import-manifest.json](import-manifest.json).

[CHANGELOG-REV3.md](CHANGELOG-REV3.md) records the Revision 3 changes from the
source bundle.
