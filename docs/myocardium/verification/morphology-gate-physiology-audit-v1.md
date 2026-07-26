# Morphology Gate Physiology Audit V1

Status: shadow/report-only scaffold.

This note defines a physiology-aware morphology audit layer for future cases,
lessons, and preset fitting. It does not change the strict morphology gate,
runtime wiring, or LandAtrial work. The MechanicsCore2 source/reservoir and
AV-plane lanes it was originally scoped against are retired; the audit layer
outlives them because it is about morphology, not about that lane.

## Goal

The current strict morphology gate is good at rejecting visible artifacts such
as PV dome rebound, AV inflow third waves, and C1 kinks. Future disease and
rhythm profiles need additional physiology-aware reporting because normal
sinus E/A rules are not the right expectation for every profile.

V1 separates three concerns:

- Universal artifact guard: profile-independent red flags that cannot be
  rescued by disease or rhythm expectations.
- Pattern classifier: a descriptive AV inflow pattern label such as clean E/A,
  E/A fusion, L-wave-like triphasic filling, absent A wave, prolonged inflow,
  kink artifact, or unexplained multi-peak flow.
- Profile expectation: bidirectional profile-specific expectations, including
  "too normal" warnings when a perturbation or disease profile should change
  the waveform but does not.

## Non-Negotiable Boundary

V1 is shadow-only:

- `mode` is `shadow`.
- `canAffectGate` is `false`.
- `finalDecision` is `report-only`.
- `enforcedEquivalentDecision` is reported only to show what the same evidence
  would imply if enforcement is explicitly enabled later.

This means V1 cannot rescue a model residual and cannot relax the strict normal
envelope.

## Implementation

Code lives in `engine/diagnostics/morphology`, intentionally separate from
`engine/verification/morphologyCheck.ts`.

- `morphologyDecisionV1.ts`: schema for audit decisions and reports.
- `physiologyProfiles.ts`: profile taxonomy and expected/allowed/forbidden
  pattern lists.
- `avInflowPatternClassifier.ts`: MVF/TVF pattern classifier.
- `artifactGuards.ts`: profile-independent artifact guard.
- `profileExpectationEvaluator.ts`: profile-specific expectation logic,
  including low-preload directionality versus nominal baseline.
- `morphologyReportShadowV1.ts`: report builder that keeps V1 shadow-only.

The first runner is:

```bash
npx tsx tools/diagnostics/runMorphologyPhysiologyAuditShadowPack.ts
```

It writes:

```text
data/diagnostics/morphology/morphology-physiology-audit-shadow-pack-v1.json
```

## Profile Taxonomy V1

Implemented profiles:

- `normal_sinus_central`
- `normal_sinus_low_preload`
- `normal_sinus_high_afterload`
- `normal_sinus_high_hr`
- `bradycardia_sinus`
- `hfpef_sinus_report_only`
- `atrial_fibrillation_report_only`
- `mitral_stenosis_report_only`
- `mitral_regurgitation_report_only`

Disease profiles with `_report_only` are skeletons only. They are not official
disease validation.

## Artifact Guard

The artifact guard is profile-independent. If it fails, profile expectation
cannot rescue the waveform.

Current artifact IDs include:

- `pressure-flow-causality-unsupported`
- `valve-state-unsupported`
- `valve-transition-overlap`
- `clamp-or-limiter-overlap`
- `reservoir-transfer-overlap`
- `active-source-multi-twitch`
- `hidden-volume-source`
- `mass-ledger-not-clean`
- `energy-coasting-not-clean`
- `c1-kink-artifact`
- `unphysiologic-sharpness`
- `dt-half-shape-parity-fail`
- `beat-repeatability-fail`

Default policy:

```text
unexplained multi-peak = fail if enforced
artifact guard fail = fail if enforced
```

In shadow mode these remain visible through `enforcedEquivalentDecision`,
`artifactGuard`, and `forbiddenRescueFlags`.

## Curated Shadow Pack

The V1 artifact contains synthetic waveform scenarios, not model acceptance
evidence:

- normal clean E/A
- low-preload E-reduced with directionality versus nominal
- high-HR E/A fusion
- high-afterload too-normal / missing load-response evidence
- bradycardia small smooth L-wave-like flow
- artifact third wave with reservoir overlap
- kinked E wave
- unphysiologically sharp E/A inflow
- forward flow with closed valve state
- AF report-only A-wave absent
- MS report-only prolonged inflow

The pack is deliberately small. It is a classifier and schema fixture, not an
owner visual review pack and not patient-level validation.

## Future Promotion Criteria

Profile-aware enforcement should stay disabled until all of the following are
true:

- strict normal central and representative normal envelope are artifact-free,
- source-aware four-chamber closure is stable,
- owner visual review accepts the baseline waveform set,
- disease profile expectations are pre-registered,
- universal artifact guard is active and cannot be bypassed,
- disease/rhythm profiles require expected directionality, not just relaxed
  acceptance.

Until then, this lane can add report-only classification, curated visual review
fixtures, and profile schemas, but not current-gate relaxation.
