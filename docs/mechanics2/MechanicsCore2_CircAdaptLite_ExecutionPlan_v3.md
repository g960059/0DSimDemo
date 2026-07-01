# MechanicsCore2 / CircAdapt-lite 実行計画 v3

作成日: 2026-07-01<br>
対象 repo: `g960059/0DSimDemo`<br>
目的: 現行 `ModelCore + Land boundary-contract patch` レーンから、`MechanicsCore2 / CircAdapt-lite` sidecar へ pivot する。ただし full rewrite へ信仰で入らず、安い決定実験と閉ループ戦略 gate で段階的に進める。

---

## 0. Executive decision

### 採用判断

**Approve with required changes.**

大方針は維持する。

```text
Stop expanding:
  ModelCore + Land boundary-contract patch lane

Start:
  MechanicsCore2 / CircAdapt-lite sidecar

First active law:
  HillSeriesFiberV1, not Land

But:
  Full rewrite is gated, not assumed.
```

ただし v2 から以下を必須修正とする。

1. `PR-M2-0` と `PR-M2-1` を実質統合し、ADR だけの readiness-only PR にしない。
2. `TraceFixtureV1` を最初に固定し、`lS` の units / reference / annotation を曖昧にしない。
3. `HillSeriesFiberReplayGateV1` の閾値を結果を見る前に YAML で pre-register する。
4. `C` を calcium-like に誤解させない。内部 state は `a` = mechanical activation として扱う。
5. `lSe` が全変形を吸収する hidden clamp を検出する metrics を追加する。
6. go/no-go を二段にする。`PR-M2-1` は fail-fast 必要条件、`PR-M2-5` が閉ループ戦略確認。
7. closed-loop coupling scheme を明記し、Hill-series の柔らかさで explicit / semi-implicit / coupled scheme を再評価する。
8. Numerics lead を追加する。
9. PR-M2-5/6/7 以降の閉ループ段階は deterministic gate だけでなく owner visual review を必須にする。
10. Valve audit は PR-M2-4 まで待たず、PR-M2-1 と並行で始める。

---

## 1. Rationale

### 1.1 Current lane has reached diminishing returns

`current-lanes.md` の最新記録は、現行 `ModelCore + Land` 境界契約レーンがかなり消耗したことを示している。

代表例:

- Phase 5DM: stateful AV valve pressure-flow/loss/inertance V2 は AV inflow component lead だが、strict morphology V1.1 では gross 0/8 のまま。
- Phase 5DO: semilunar valve-law-only repair は strict PV dome positive-curvature burden を下げられず no-go。
- Phase 5DP: lightweight source-pressure ownership は baseline-equivalent または悪化。
- Phase 5DQ: work-conjugate chamber mechanical pressure mapping smoke も gross 0/2 に留まり、work-conjugate pressure-adapter sweeps を拡大しない方針になった。

したがって次は another `ModelCore` patch ではなく、CircAdapt-like chamber/valve/load ownership を持つ architecture PR へ移る。

### 1.2 CircAdapt-like mechanics is a design direction, not a source dependency

CircAdapt Patch2022 は、state variable として intrinsic sarcomere length `Lsi` と contraction curve `C` を持ち、sarcomere length `Ls` を `Lsi + Lse` の Hill-series 構造として扱う。`Lsi` と `C` は ODE を持つ。これが 0D chamber volume 由来の raw strain-rate spike を active law の高速状態へ直接渡さない構造的利点である。

CircAdapt Valve は flow `q` を state variable とし、pressure gradient, Bernoulli loss, inertia, soft closure を含む ODE として扱う。0DSimDemo の既存 valve にも `R/L/B/tauOpen/tauClose` 等の q-state 的要素はすでにあるため、ゼロから弁を作るのではなく、accepted-state consistency / soft closure / same-step ownership / energy readbacks を整理する。

CircAdapt Chamber は one-fiber / thick-wall chamber として、cavity volume から mid-wall area を作り、fiber stress と cavity pressure を work-conjugate に関係づける。これも 0DSimDemo の pressure-adapter 問題への構造的参考になる。

ただし CircAdapt license は educational / non-commercial / research purposes に制限され、source copy / runtime dependency / derivative source distribution は避ける。0DSimDemo は独自実装を維持し、CircAdapt は literature reference / offline oracle / qualitative target として使う。

---

## 2. Scope freeze

### 2.1 Stop now

```text
Stop expanding:
  - ModelCore Land boundary-contract patch variants
  - source-pressure ownership variants
  - scalar pressure gain caps
  - valve threshold/deadband/coasting scalar patches
  - qDot/rootZc/Tref/source-stress tuning
  - lambda/tau/zeta smoothing sweeps
  - local pointwise MV pressure refits
  - solver wrapper/substep experiments as morphology fixes
  - LandAtrial tuning to hide LV/RV/MVF/TVF blockers
  - another stateless stress-to-pressure adapter sweep
```

### 2.2 Keep and migrate into MechanicsCore2 QA

```text
Keep:
  - morphology checker V1.1+
  - PV dome rebound / curvature guard
  - AV inflow kink / slope-jump guard
  - accepted-boundary qDot/diode/complementarity readbacks
  - pressure decomposition readbacks
  - visual review bundle machinery
  - frozen legacy active-stress positive control
  - frozen current Land/user0 comparator
  - current valve parameter schema as audit input
```

### 2.3 Do not over-claim

MechanicsCore2 PRs must not claim:

```text
- clinical validation
- CircAdapt equivalence
- runtime default adoption
- official morphology acceptance
- LandAtrial physiology acceptance
- case/preset fitting readiness
- qDot clamp retirement
- TriSeg equivalence
```

until the corresponding gates pass.

---

## 3. Updated PR roadmap

### Overview

```text
PR-M2-0+1:
  Pivot ADR + sidecar skeleton + TraceFixtureV1 + HillSeriesFiber replay bench

PR-M2-2a:
  Sharpness calibration pack
  Runs in parallel with M2-1

PR-M2-2b:
  Existing valve audit
  Runs in parallel with M2-1

PR-M2-3:
  OneFiberChamber prescribed-volume bench
  Only after M2-1 go

PR-M2-4:
  FlowStateValve prescribed-gradient bench
  Uses M2-2b audit outcome

PR-M2-5:
  LeftHeartSubsystemV1 closed-loop strategic gate

PR-M2-6:
  RightHeartSubsystemV1 closed-loop gate

PR-M2-7:
  FourChamberOneFiberV1 without AV-plane

PR-M2-8:
  AVPlaneGeometryStateV1

PR-M2-9:
  AtrialFiberPackV1

PR-M2-10:
  MiniTriSeg / InterVentricularCouplingV1 smoke

PR-M2-11:
  Land plug-in re-entry
```

---

## 4. Gate structure

### 4.1 Two-stage go/no-go

#### Gate A: PR-M2-1 isolated replay gate

Purpose:

```text
Fail-fast necessary condition.
```

This gate answers:

> Given prescribed `lS(t)` traces, can HillSeriesFiberV1 produce smooth, tunable, bounded, non-clamped stress?

It does **not** prove closed-loop success.

#### Gate B: PR-M2-5 closed-loop left-heart strategic gate

Purpose:

```text
Strategic confirmation under co-determined length dynamics.
```

This gate answers:

> When `lS(t)` is no longer prescribed but generated by pressure-volume-valve-load coupling, does the system still preserve smooth LV PV dome, clean MVF E/A, and output health over a small envelope?

Full MechanicsCore2 investment is justified only if Gate A passes and Gate B is promising.

---

## 5. PR-M2-0+1 details

### 5.1 Deliverables

```text
- docs/myocardium/adr/ADR-MYO-00X-mechanicscore2-circadapt-lite.md
- engine/mechanics2/README.md
- engine/mechanics2/fiber/HillSeriesFiberV1.ts
- engine/mechanics2/fixtures/TraceFixtureV1.ts
- engine/mechanics2/benches/HillSeriesFiberReplayBench.ts
- tools/mechanics2/runHillSeriesFiberReplayBench.ts
- data/mechanics2/gates/hill-series-fiber-replay-gate-v1.yaml
- one tiny deterministic smoke test
```

No live runtime integration.

### 5.2 TraceFixtureV1

Fix the fixture contract before running the first bench.

```ts
type FiberReplayFixtureV1 = {
  fixtureId: string;
  sourceRunId: string;
  sourceModel: "legacy" | "land-user0" | "synthetic" | "circadapt-reference";
  chamber: "LV" | "RV" | "LA" | "RA";

  sampleRateHz: number;
  cycleLengthSec: number;
  activationTimeSec: number;

  timeSec: number[];
  lS: number[];
  lSUnits: "normalized" | "um";
  lSRef: number;

  annotation: {
    ejectionStartSec?: number;
    ejectionEndSec?: number;
    fillingStartSec?: number;
    fillingEndSec?: number;
    ownerRejected?: boolean;
    knownFailure?: string[];
    morphologyProfileId?: string;
  };

  provenance: {
    extractedFrom?: string;
    referenceSource?: "none" | "circadapt-offline" | "owner-trace";
    derivedCode: false;
    usedFor: "qualitative-target" | "replay-input" | "negative-control";
    licenseReviewed?: boolean;
    distributionAllowed?: boolean;
  };
};
```

Required fixtures:

```text
synthetic-smooth-lv
synthetic-wiggle-lv
legacy-normal-lv
legacy-normal-rv
land-user0-failing-lv
land-user0-failing-rv
land-user0-envelope-preload-low-lv
land-user0-envelope-afterload-high-lv
```

Optional fixtures:

```text
circadapt-reference-lv-normal
circadapt-reference-rv-normal
```

### 5.3 HillSeriesFiberV1 state semantics

Do not name the activation state `C` in the public 0DSimDemo API if it invites calcium confusion.

Recommended internal state:

```ts
type HillSeriesFiberState = {
  lSi: number;  // contractile/intrinsic element length
  a: number;    // mechanical activation state, 0..1; not calcium
};
```

Optional later state:

```ts
type HillSeriesFiberStateV2 = HillSeriesFiberState & {
  cProxy?: number; // only if a calcium-like layer is explicitly introduced
};
```

Output concept:

```ts
sigmaActive =
  Tref
  * contractilityScale
  * a
  * fLength(lSi, lSe)
  * fVelocity(lSiDot, lSe);
```

Claim boundary:

```text
a is mechanical activation.
a is not calcium.
a is not crossbridge density unless later explicitly modeled.
```

---

## 6. PR-M2-1 pre-registered gate

### 6.1 Gate YAML

Pre-register before looking at the first bench result.

```yaml
hillSeriesFiberReplayGateV1:
  version: 1
  appliesTo: "isolated-prescribed-lS-replay"

  stressMorphology:
    maxDominantPeakCount: 1
    maxSecondaryPeakProminenceRatio: 0.08
    minStressFwhmFractionOfCycle: 0.08
    maxStressFwhmFractionOfCycle: 0.35
    maxStressPeakSharpnessRatioVsLegacy: 0.75
    maxDSigmaDtSpikeRatioVsLegacy: 0.75
    maxC1SmoothnessPenalty: 0.20

  seriesElasticSafety:
    maxLSeRangeNormalized: 0.20
    maxLSeAbsorptionRatio: 0.70
    minLSiMotionRatio: 0.15
    maxSeriesElasticEnergyFraction: 0.60
    maxLSeRecoveryTimeFractionOfCycle: 0.20

  stateBounds:
    lSiWithinPhysiologicRange: true
    lSiDotWithinBoundedRange: true
    activationAWithinZeroOne: true
    noNaNOrInf: true

  robustness:
    minFixturePassRate: 0.85
    maxParameterCoverageFailRate: 0.10

  requiredNegativeControls:
    landUser0FailingTraceShouldNotProduceDoubleStressPeak: true
    syntheticWiggleShouldNotCreateDominantSecondPeak: true

  claimBoundary:
    runtimeImprovement: false
    pvMorphologyAcceptance: false
    circAdaptEquivalence: false
```

The exact numerical values are provisional but must be fixed before the first result is inspected. Later calibration PRs may revise them with explicit before/after evidence.

### 6.2 Hidden-clamp metrics

HillSeriesFiber should absorb high-frequency artifacts, but must not hide all deformation in `lSe`.

Add:

```text
lSeAbsorptionRatio = Var(lSe) / Var(lS)
lSiMotionRatio = Var(lSi) / Var(lS)
seriesElasticEnergyFraction
seriesElasticPeakEnergy
lSeRecoveryTime
```

Interpretation:

```text
OK:
  lSe absorbs some high-frequency wiggle.

FAIL:
  lSe absorbs nearly all beat-scale deformation.
  lSi is nearly frozen.
  stress is smooth only because series elasticity acts as a clamp.
```

### 6.3 Bench report schema

```ts
type HillSeriesFiberReplayReportV1 = {
  reportId: string;
  gateId: "hillSeriesFiberReplayGateV1";
  overallStatus: "go" | "no-go" | "inconclusive";
  fixtureResults: FiberReplayFixtureResultV1[];
  parameterSweepSummary: {
    total: number;
    pass: number;
    fail: number;
    inconclusive: number;
  };
  decision: {
    mayProceedToOneFiberChamber: boolean;
    reason: string;
  };
};
```

---

## 7. PR-M2-2a: sharpness calibration pack

### 7.1 Why

Current morphology checker can reject:

```text
- double dome
- third flow wave
- PV rebound / positive curvature
- AV inflow kink / slope jump
```

But it is not yet sufficient to reject:

```text
- legacy peaks that are too sharp
- too-narrow twitch
- unrealistically high dP/dt spike
- narrow flow needle waves
```

### 7.2 Metrics

```text
pressurePeakSharpness
flowPeakSharpness
dPdtSpikeRatio
dQdtSpikeRatio
peakWidthAtHalfMax
peakAreaRatio
C1ContinuityScore
systolicDomeCurvatureIntegral
inflowKinkSeverity
stressFwhmFractionOfCycle
```

### 7.3 Calibration set

```text
owner-approved traces
owner-rejected traces
legacy active-stress traces
current Land/user0 traces
CircAdapt offline qualitative traces, if available
synthetic stress/flow traces with known sharpness
```

### 7.4 Claim boundary

```text
Allowed:
  shape-quality calibration for QA.

Not allowed:
  clinical echocardiographic validation.
  final waveform acceptance.
```

---

## 8. PR-M2-2b: existing valve audit

### 8.1 Why

The current engine already has q-state-like valve parameters. The next work should not pretend the model is moving from pure diode to dynamic valve from scratch.

Audit:

```text
Aref
Amax
Aleak
kOpen
tauOpen
tauClose
R
L
B
openness state
q/state ownership
qDot/clamp/diode policy
accepted-state semantics
```

### 8.2 Outputs

```text
- docs/mechanics2/valve-audit-v1.md
- existing-valve-state-diagram.md
- list of reusable parameters
- list of semantics to change
- soft-closure implementation candidates
- energy/coasting readback requirements
```

### 8.3 Desired gain

```text
Not:
  invent q-state valve from zero.

Yes:
  accepted-state consistency
  same-step q-state ownership
  soft closure
  area-state smoothness
  pressure-flow energy consistency
  kink-free inflow
  no diode/qDot morphology fabrication
```

---

## 9. PR-M2-3: OneFiberChamber prescribed-volume bench

### 9.1 Scope

Use prescribed `V(t)` and `Vwall` to test provisional chamber pressure mapping.

Initial mapping:

```text
Vmid = Vcavity + 0.5 * Vwall
Amid = (6 * sqrt(pi) * Vmid)^(2/3)
lS   = lSRef * sqrt(Amid / AmidRef)
```

Pressure mapping concept:

```text
fiber stress -> wall tension -> cavity pressure
```

### 9.2 Claim boundary

```text
Allowed:
  spherical one-fiber provisional pressure mapping smoke.

Not allowed:
  final chamber geometry.
  full CircAdapt equivalence.
  patient-scale pressure calibration.
  runtime morphology acceptance.
```

### 9.3 Required readbacks

```text
V
Vmid
Amid
lS
lSi
lSe
sigmaActive
sigmaPassive
sigmaTotal
wallTension
pressureRaw
pressureFiltered? only if explicitly part of model
active dP/dV estimate
passive dP/dV estimate
energy proxy
```

The `dP/dV` / active elastance readback is required because closed-loop coupling stability depends on the pressure-volume slope.

---

## 10. Coupling and numerics policy

### 10.1 Numerics lead

Add a dedicated Numerics lead.

```text
Numerics lead owns:
  - ODE/DAE stepper
  - residual solve strategy
  - tolerance policy
  - dt convergence
  - event/valve transition handling
  - mass/energy residual audit
  - failure classification: numerical vs physiological
  - explicit vs semi-implicit vs coupled strategy comparison
```

### 10.2 Re-evaluate simple schemes with Hill-series

Past coupled-BE / coupled-Newton attempts failed under hard Land / current pressure adapter conditions. Do not assume this means a complex solver is required for MechanicsCore2.

Test with HillSeriesFiber:

```text
explicit step
semi-implicit chamber pressure step
local coupled chamber-valve step
optional Newton only if needed
```

The series elastic element may soften active stiffness enough that a simpler scheme is stable. Measure before adding solver complexity.

### 10.3 Required convergence checks

```text
dt/2 comparison
mass residual
energy/coasting residual
valve transition residual
morphology stability under dt change
same-step accepted-state consistency
```

---

## 11. PR-M2-5: LeftHeartSubsystemV1 strategic gate

### 11.1 Scope

First co-determined closed-loop subsystem:

```text
LA boundary or simple LA chamber
MV
LV OneFiberChamberV1 + HillSeriesFiberV1
AoV
Ao/root Windkessel or existing root load
```

### 11.2 This is the second strategic gate

PR-M2-1 proves only prescribed-length stress smoothness. PR-M2-5 tests whether closed-loop co-determined length remains smooth.

Required pass features:

```text
LV PV smooth single dome
No PV rebound / positive curvature burden above threshold
MVF E/A clean in normal profile
No C1-discontinuous E/A kink
No valve/qDot/diode-created extra wave
Output broadly preserved under small envelope
Mass/energy residuals bounded
Owner visual review accepted
```

### 11.3 Envelope

Minimum:

```text
normal HR75
normal HR90
preload low
preload high
systemic afterload high
contractility low
contractility high
```

### 11.4 Visual review

Required even if deterministic gate passes.

```text
gate pass + owner visual reject = no adoption
```

This rule is non-negotiable because previous 8/8 results failed visual review and were later rejected by hardened checker.

---

## 12. PR-M2-6 to PR-M2-11 summary

### PR-M2-6: RightHeartSubsystemV1

Right heart is not a copy-paste of left heart.

```text
RA boundary or simple RA chamber
TV
RV OneFiberChamberV1 + HillSeriesFiberV1
PV
PA load
```

Special attention:

```text
low pressure gradient sensitivity
TVF artifact sensitivity
RV PV dome under low pressure
pulmonary afterload envelope
```

### PR-M2-7: FourChamberOneFiberV1 without AV-plane

Goal:

```text
four-chamber mass ledger
MVF/TVF interaction
LV/RV PV morphology
no AV-plane reservoir yet
```

### PR-M2-8: AVPlaneGeometryStateV1

AV-plane enters as geometry state, not hidden blood volume.

```text
AV-plane descent/release -> atrial effective wall geometry -> atrial lS / Amid
```

Gate:

```text
AV-plane improves reservoir/v-loop.
AV-plane release does not create third MVF/TVF wave.
No hidden volume source.
```

### PR-M2-9: AtrialFiberPackV1

Compare:

```text
simple atrial HillSeriesFiber pack
LandAtrial plug-in later
```

Normal sinus target:

```text
LA/RA reservoir-conduit-booster readable
figure-eight readable
MVF/TVF not harmed
```

### PR-M2-10: MiniTriSeg / InterVentricularCouplingV1 smoke

Needed before serious PH/RV failure lessons.

Initial scope:

```text
septal interaction proxy
LV/RV shared pressure-volume constraint
RV overload -> LV underfilling qualitative response
D-shape proxy readbacks, if possible
```

Do not promise full CircAdapt TriSeg equivalence.

### PR-M2-11: Land plug-in re-entry

Only after MechanicsCore2 core morphology envelope passes.

Land must receive:

```text
accepted geometry state
accepted velocity state
not raw finite-difference chamber volume spike
```

If Land reintroduces double dome / extra wave, it remains research mode.

---

## 13. If HillSeriesFiber is no-go

Do not proceed with full CircAdapt-lite sidecar merely because the roadmap exists.

Allowed no-go response paths:

```text
A. Redesign activation law only.
B. Keep lSi/lSe series element but redesign force-velocity law.
C. Use SmoothOneFiberActiveV0 to develop chamber/valve core first.
D. Re-test Land under accepted-geometry replay bench.
E. Compare against CircAdapt/pyCircAdapt offline traces to identify mismatch.
```

Forbidden response:

```text
HillSeriesFiber no-go
  -> proceed to full sidecar anyway
```

---

## 14. Fitting and morphology policy

### 14.1 Fitting order

```text
parameter candidate
  -> settling / solver health
  -> mass and energy residual health
  -> universal artifact guard
  -> profile-specific morphology guard
  -> target distance scoring
```

A candidate that fails universal artifact guard must not be selected by fitting, even if hemodynamic targets are numerically close.

### 14.2 Universal artifact guards

```text
LV/RV double systolic dome
PV dome rebound / positive curvature
active multi-twitch
valve/qDot/diode-driven extra wave
C1-discontinuous inflow kink
hidden AV-plane volume source
pressure-flow causality violation
excessive peak sharpness
mass ledger violation
energy/coasting inconsistency
```

### 14.3 Profile-specific morphology

```text
normal_sinus_default:
  E/A biphasic inflow expected.

AF:
  A wave absence allowed.

HFpEF:
  L-wave-like filling may be allowed only if not artifact-driven.

MS:
  prolonged inflow allowed.

MR/TR:
  regurgitant patterns allowed.
```

### 14.4 Fitting report fields

```ts
type FittingMorphologyDecisionV1 = {
  rejectedByUniversalArtifactGuard: boolean;
  rejectedArtifactIds: string[];
  profileAllowedButArtifactDriven: boolean;
  morphologyProfileId: string;
  targetDistanceEvaluated: boolean;
};
```

---

## 15. Team roles

```text
Mechanics lead:
  HillSeriesFiberV1, OneFiberChamberV1, AV-plane geometry.

Numerics lead:
  stepper, residual strategy, dt convergence, event handling, mass/energy residuals.

Valve/load lead:
  existing valve audit, soft closure, same-step q ownership, load coupling.

Diagnostics lead:
  morphology checker, sharpness metrics, visual review bundles.

Integration lead:
  sidecar isolation, artifacts, CI, no runtime leakage.

Ventricular interaction lead:
  MiniTriSeg / IV coupling plan.

Reference lead:
  CircAdapt literature/oracle provenance, no source-copy compliance.
```

---

## 16. Immediate action checklist

Before the first MechanicsCore2 PR opens:

```text
[ ] Freeze current ModelCore patch lane in current-lanes.md.
[ ] Open PR-M2-0+1, not ADR-only.
[ ] Add MechanicsCore2 sidecar folder skeleton.
[ ] Define TraceFixtureV1.
[ ] Pre-register hillSeriesFiberReplayGateV1 YAML.
[ ] Decide initial fixture set.
[ ] Assign Numerics lead.
[ ] Start valve audit in parallel.
[ ] Prepare sharpness calibration trace pack.
[ ] Define owner visual review bundle format for M2-5 onward.
```

---

## 17. Bottom line

The pivot is justified, but the execution must be gated.

```text
Direction:
  MechanicsCore2 / CircAdapt-lite sidecar.

First proof:
  HillSeriesFiber isolated replay bench.

Real proof:
  LeftHeartSubsystemV1 closed-loop strategic gate.

Do not do:
  another ModelCore patch sweep.

Do not assume:
  HillSeriesFiber will work.

Do preserve:
  all hard-won morphology/readback/visual-review QA assets.
```
