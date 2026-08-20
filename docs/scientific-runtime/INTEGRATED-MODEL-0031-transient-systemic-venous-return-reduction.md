# Transient systemic venous-return reduction Engineering protocol

Status: declaration only; this document and its README index must be committed
before the first normal-adult source or intervention evaluation

## Decision

The next dynamic pressure-volume study is one nonofficial Engineering
characterization of a transient, reversible systemic venous-return reduction.
It starts from one internally owned canonical period-1 checkpoint, applies one
fixed protocol-only resistance schedule to `VC_RA`, and retains the resulting
biventricular loop family without changing total blood volume or any Standard
model parameter.

The experiment asks a deliberately method-comparison question:

> On one fixed transient loop family, how different are a baseline-anchored
> isochronal locus, semilunar-closure locus, minimum-volume locus, and sampled
> common support envelope during occlusion and release?

The protocol does not select an ESPVR method, define EDPVR, close a potential-
energy region, or compute PVA. It does not interpret the intervention as blood
withdrawal, a literal caval clamp, or a clinical maneuver. It is an IVC-like
model intervention implemented only by scaling the existing systemic
venous-return resistance edge.

The work remains one substantial pull request with a declaration commit, an
implementation commit, and at most one create-only result commit. Normal-adult
source or intervention execution is forbidden until the declaration and
implementation commits are separately fixed and clean.

## Predecessor binding

The declaration follows the merged passive-surface and dynamic-ledger work
without transferring either result into a stronger claim:

```text
declaration parent / PR565 merge commit:
  3f7005bcca23bd0048103a99ebc26e66728cf02a

sampled intrinsic passive-surface merge commit:
  b1d46922ab5e2aabdb417f8f2a1dede6c7504933
sampled intrinsic passive-surface implementation commit:
  63dcab1626c43e67f80a870365470f24238de417
sampled intrinsic passive-surface report payload SHA-256:
  dbdf2b76d23fc902e7b1b75fab75731c7456ff3d69ab9a23994569a723daf294
sampled intrinsic passive-surface raw-file SHA-256:
  0ba4d56c98cf933d3d693db36fa5b6086eff2e46b2aa71f7a67f1a5f19caddc7

mechanical-port dt-characterization merge commit:
  3f7005bcca23bd0048103a99ebc26e66728cf02a
mechanical-port dt-characterization implementation commit:
  bcc57e4b41659492eb86a08d9be5597e6bc5ef80
mechanical-port dt-characterization report payload SHA-256:
  f80da199e50e18e395e958c51e98dd0ea7e878bb6c8171f2c7d23071d6414921
mechanical-port dt-characterization raw-file SHA-256:
  a60278ce159172e86e7c115840325f5de49fa353162742ef7d1b63daa9a2613e
```

The passive pilot established sampled local intrinsic-potential consistency,
not a continuous EDPVR. The ledger characterization separated finite path
quantities, zero-limit discretization remainders, cycle drift, and algebraic
residuals. Neither predecessor established a dynamic systolic relation, PE,
PVA, physiological validation, or a production analysis method.

## New Engineering identities

```text
declarationId:
  integrated-model-0031-transient-systemic-venous-return-reduction
characterizationOwnerId:
  main-wire-integrated-model-transient-systemic-venous-return-reduction-engineering-v1
protocolId:
  main-wire-integrated-model-transient-systemic-venous-return-reduction-protocol-v1
relationComparisonOwnerId:
  main-wire-integrated-model-transient-pv-relation-comparison-engineering-v1
reportSchemaId:
  main-wire-integrated-model-transient-systemic-venous-return-reduction-report-v1
numericalAccessId:
  main-wire-integrated-model-transient-systemic-venous-return-reduction-1ms-access-v1
```

These are Engineering identities only. They do not revise the Standard
periodic owner, Standard nominal step, public ABI, accepted-state schema,
passive-surface owner, fixed-TBV analysis, or any official/public result.

## Canonical source

The zero-argument runner owns exactly one source execution:

```text
runner: runMainWireIntegratedModelPeriodicSteadyV3
nominalDtSec: 0.001
maximumCycleCount: 250
executionPurpose: canonical-evidence
condition: normal-adult regular-sinus all-off defaults
required classification: period1-converged
```

The source must pass its existing finite, conservation, event-identity,
classification, model-condition identity, protocol identity, and exact
checkpoint round-trip gates. The intervention reconstructs the same fixture,
recomputes both identity payloads, restores the terminal checkpoint exactly,
and verifies checkpoint equality before the first intervention step.

Source failure or binding failure prevents every intervention step and is
retained as a failed report. A cold start, caller-supplied checkpoint, caller-
supplied source result, or fallback source is forbidden.

## Frozen intervention

The intervention modifies only the protocol resistance scale of the existing
non-valve edge:

```text
edge: VC_RA
baseline scale: 1
maximum scale: 8
scale owner: protocolResistanceScaleByEdge
total blood volume: unchanged
all other protocol resistance scales: 1
```

Let `t0` be the exact restored source time and `tau = t - t0`. The scale is
evaluated at every backward-Euler candidate endpoint in the following fixed
schedule:

```text
0 <= tau <= 1:
  s(tau) = 1

1 < tau < 9:
  s(tau) = exp(log(8) * (tau - 1) / 8)

9 <= tau <= 11:
  s(tau) = 8

11 < tau < 19:
  s(tau) = exp(log(8) * (19 - tau) / 8)

19 <= tau <= 21:
  s(tau) = 1
```

The fixed beat phases are:

```text
beat 1:       baseline
beats 2-9:    occlusion-ramp
beats 10-11:  occlusion-plateau
beats 12-19:  release-ramp
beats 20-21:  recovery
```

The primary occlusion family contains beats `1..11`. The release diagnostic
family contains beats `11..21`, sharing only the final plateau beat. The eight
occlusion-ramp beats are paired with the eight release-ramp beats at equal
midpoint resistance scales in reverse ordinal order.

The scale is continuous at every phase boundary. No result-dependent scale,
ramp duration, plateau duration, release duration, step size, solver option,
or stopping rule is permitted. A failure does not relax the scale or restart
from a later beat.

This is a resistance intervention in a closed circulation. It is not an
external volume sink, not a separately modelled IVC/SVC anatomy, not a change
to stressed volume, and not proof that modeled `VC_RA` pressure equals a
clinical caval pressure during occlusion.

## Numerical execution

The intervention uses the unchanged integrated V3 transaction at the Standard
one-millisecond nominal grid. Every step is clipped only by the existing
coronary-window and rhythm-event scheduler. Each accepted candidate receives
the exact schedule-owned `VC_RA` scale through the existing protocol-only seam.

The trajectory is sequential by construction. A failed accepted-step
candidate terminates the intervention, retains every completed beat and the
failed candidate identity, and writes a failed report. Later beats cannot be
attempted independently because their initial accepted state does not exist.

For every completed beat the report retains:

- exact start/end accepted times and revisions;
- phase label and scale at start, midpoint, and end;
- accepted-step and boundary-clipped-step counts;
- fixed global total blood volume and maximum conservation residuals;
- exact capture/deposit identity counts and all-off MCS status;
- minimum and maximum systemic venous-return flow;
- biventricular event and method landmarks;
- a compact 64-point phase-resampled transmural PV loop per ventricle; and
- hashes of the compact loops and raw accepted-endpoint summary.

The compact loop is sampled at phases `k/64`, `k=0,...,63`, by linear
interpolation of the enclosing raw accepted endpoints, with the exact beat
start boundary included. It is an analysis geometry, not a replacement for
the accepted-step trajectory. Raw successful steps and full waveform traces
are not committed.

## Frozen pressure and event basis

Every fitted or compared ventricular point uses transmural pressure. Absolute
intracavitary pressure and common external pressure may be retained as
diagnostics but cannot enter a relation fit.

Semilunar closure uses the first positive-to-nonpositive flow crossing after
the beat's maximum positive `AoV` or `PV` flow. Time, volume, and transmural
pressure are linearly interpolated across the accepted endpoints bracketing
zero flow. A missing positive ejection phase or missing later crossing fails
that beat's relation evidence; minimum-volume fallback is retained separately
and never substituted for closure.

Minimum volume is the earliest raw accepted endpoint at the beat's minimum
ventricular volume. It remains a discrete sampled landmark.

The baseline isochronal phase is selected separately for LV and RV as the
earliest raw accepted endpoint with maximum transmural pressure in beat 1.
That single phase is then frozen for every later beat. No later beat may select
its own maximum-pressure time, and the phase is not changed after viewing a
fit.

## Method-specific relations

For each ventricle and for both the primary occlusion and release diagnostic
families, retain four distinct relations:

1. baseline-anchored isochronal points;
2. semilunar-closure points;
3. minimum-volume points; and
4. a common sampled-loop support envelope.

The first three use ordinary unweighted linear least squares:

```text
P = E * V + b
V0 = -b / E, only when E > 0
```

The report retains point count, measured volume range, `E`, `b`, optional
`V0`, residual sum of squares, `R2`, and whether the slope is positive. A
positive slope, high `R2`, plausible `V0`, monotonic response, or agreement
between methods is descriptive and not an execution gate.

For the sampled support envelope, each compact loop supplies

```text
b_i(E) = max_k(P_ik - E * V_ik).
```

Candidate slopes are a fixed 513-point logarithmic grid over
`[0.05,12] mmHg/mL`, followed by a fixed 257-point logarithmic refinement
within one coarse-grid interval around the best candidate. The score is the
between-loop support-intercept range `max(b_i)-min(b_i)`. Ties select the
smaller slope. The displayed common intercept is `max(b_i)`, so no retained
compact-loop sample may lie above the line. The report retains all contacts,
the maximum inter-loop support gap, maximum sampled-loop penetration, slope-
grid boundary status, and measured volume range.

The support envelope is a sampled parallel-support construction only. It is
not called ESPVR and it does not acquire end-systolic identity from contact
with a loop.

## Hysteresis diagnostics

The eight equal-midpoint-scale ramp pairs retain, for each ventricle and each
point method, release-minus-occlusion differences in volume and transmural
pressure. The report also retains differences between the separately fitted
occlusion and release slopes and intercepts.

These are descriptive transient hysteresis diagnostics. No maximum hysteresis
tolerance is declared, and a nonzero value is neither an integrity failure nor
evidence of pathology. The plateau and recovery beats are not silently treated
as independently settled periodic orbits.

## Completion and failure semantics

The only positive experiment-level result is:

```text
transientVenousReturnReductionCharacterizationCompleted
```

It is true only when:

1. the internally owned source establishes canonical numerical P1 and exact
   checkpoint round-trip;
2. source condition, protocol, fixture, and checkpoint bindings replay;
3. all 21 sequential beats and every accepted step complete at the frozen
   schedule;
4. global TBV, coronary/noncoronary conservation, event identity, calcium
   ownership, and all-off MCS gates pass for every beat;
5. all required closure, minimum-volume, and frozen-phase isochronal landmarks
   exist and are finite;
6. every compact loop has exactly 64 finite ordered phase samples and its hash
   replays;
7. both direction-specific method sets, support contacts, and hysteresis pairs
   independently recompute from the retained beat payloads; and
8. the outer report payload hash and compact artifact readback pass.

Method agreement, monotonicity, fitted slope sign, `R2`, extrapolated `V0`, and
hysteresis magnitude are never part of this conjunction.

Failure classes are fixed as:

```text
source-not-p1
source-execution-failure
source-binding-failure
trajectory-step-failure
cycle-integrity-failure
landmark-unavailable
relation-integrity-failure
artifact-integrity-failure
```

Failure evidence retains the last accepted state identity, elapsed protocol
phase, completed beats, failed candidate time and scale when available, and a
sanitized exception. A scientific or numerical failure is not relabelled as
successful characterization.

## Compact artifact and execution governance

The implementation commit may run only pure, manufactured, mocked,
checkpoint-round-trip, and existing regression tests. It must not execute the
normal-adult source or the zero-argument intervention runner.

After the implementation commit is clean, one fixed zero-argument runner may
execute the source and intervention exactly once and write create-only to:

```text
artifacts/transient-preload/
  transient-systemic-venous-return-reduction-engineering-v1.json
```

The output path is checked before source execution. The runner accepts no
caller fixture, checkpoint, source result, edge, schedule, dt, solver option,
method list, threshold, or output path. A pre-existing output fails before
model work.

The committed canonical JSON must not exceed `524288` bytes. It contains no
raw checkpoint, full accepted-step trace, mutable runtime object, or successful
step object. Full traces may be retained only as uncommitted local/CI
diagnostics and are not runtime dependencies.

The artifact binds the declaration and implementation commits, predecessor
identities, complete protocol payload and hash, compact source evidence, all
beat summaries and compact loops, relation/hysteresis projections, assessment,
negative claims, and outer payload hash. The independent auditor recomputes
the schedule, compact-loop hashes, landmarks, all relations, hysteresis pairs,
assessment, and payload hash from the retained payload.

A future rerun requires a new versioned protocol or explicit new output path.
The first result cannot be overwritten, reclassified, or used as a runtime
input.

## Machine-readable claim boundary

The report must retain all following claims as `false`:

```text
officialQualificationEstablished
canonicalSourceAuthenticationEstablished
historicalQualificationTransferred
transientProtocolNumericallyQualified
physiologicalValidationEstablished
clinicalValidationEstablished
literalCavalOcclusionEstablished
externalBloodWithdrawalEstablished
independentPeriodicOrbitPerBeatEstablished
isochronalEspvrEstablished
semilunarClosureEspvrEstablished
minimumVolumeEspvrEstablished
supportEnvelopeEspvrEstablished
selectedEspvrMethodEstablished
edpvrEstablished
potentialEnergyEstablished
pvaEstablished
mvo2Established
wholeHeartEnergyEstablished
globalUniquenessEstablished
productionProtocolEstablished
publicCatalogEligibilityEstablished
```

Completion establishes only that the frozen Engineering intervention and
method comparison executed with internally replayed integrity.

## Required verification and next boundary

Before target execution, typecheck, pure schedule tests, analytic loop/event
fixtures, linear-fit and support-envelope recovery/failure tests, symmetric
hysteresis fixtures, mocked all-settled source/failure tests, checkpoint
binding tests, 64-point loop/hash tamper tests, artifact create-only/size tests,
suite-manifest checks, formatting, and diff checks must pass. Existing Standard
and periodic regressions must remain unchanged.

After a result commit, run the focused suites, full fast suite, build, registry
verification, browser smoke through CI, repository hygiene, and an independent
read-only review. The normal-adult target is never rerun merely to harden an
auditor or document.

The next declaration depends on the observed loop-family integrity, not on a
desired line. If the transient family completes, the result may compare the
four method-specific constructions and quantify release hysteresis. It still
cannot choose ESPVR, define a common-pericardium passive reference, or compute
PVA. A later method-specific PVA comparison must separately bind its systolic
method, passive reference, pressure basis, area rule, measured domain, and
failure policy.
