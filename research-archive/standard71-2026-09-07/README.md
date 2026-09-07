# Standard71 research archive — DO NOT MERGE

This branch preserves the 2026-09-05–07 reference-baseline research lane,
including unsuccessful constructions, evaluation changes, external review,
the locally bound Standard71 candidate and its documentation. It is not a
production promotion, a clinical validation, or a recommendation to merge
the complete branch. Earlier Standard65–70 work remains in its original Git/PR
history; this archive does not claim to contain that entire earlier history.

## Current decision

The selected construction is HR70, TBV4935 mL, BSA1.9 m². Its prospective
assessment is eligible for exact-model promotion. Standard71 has its own
cold replay, checkpoint, aligned launch checkpoint, source/artifact parity,
and inherited compatible Surface/analysis bindings. It is still a local
candidate, not a registered/default production release.

This archive does **not** change parameters, physiological ranges, gate roles,
saved reports, public registry rows, or the active baseline. The new minimal
integration lane starts from main, which has already retired old browser
models. Copying this entire branch would resurrect that retired surface code.

### New verification finding at archival preparation

A fresh scoped run produced **115 passed / 1 failed** across eight test files.
The failing assertion is bit-for-bit accepted-state continuation after a
Standard71 checkpoint restore under `hot-path-lean`.

- Restored accepted state is initially identical.
- The first resumed step differs in five fields by roughly 1e−14–1e−12;
  the largest volume difference during the short probe is about 4.7e−11 mL.
- The same short probe under `full-invariant` is bit-identical throughout.
- All seven Standard71 Studio binding tests passed, including both adapter
  routes, default TBV change/reset, and native Starling/formal PV analysis.
- Type checking passed. Documentation source/archive checks passed.

This is not evidence of a physiologically meaningful volume change or a new
waveform defect. It is an unresolved exact-continuation contract discrepancy,
and is a reason **not to promote the executable yet**. Do not weaken the equality
assertion or widen physiological gates to make this disappear. Original passing
historical reports are preserved as historical reports, not rewritten.

The reproducer and both tier readbacks are in the evidence bundle under
`artifacts/physiology-evaluation-2026-09-07/checkpoint-continuation-*`.
The initial test-launch attempt with only `--maxWorkers=3` failed before tests
because of the Vitest minimum/maximum worker conflict; the recorded scoped run
uses `--minWorkers=1 --maxWorkers=3`.

Follow-up: the existing base checkpoint explicitly omits the coupled Newton
predictor's accepted history. The warm source has depth four while restore has
depth zero. A control with empty histories on both sides continues bit-identically
under lean execution in the same five-step probe. [Readback](continuation-followup.json).
The updated [reproducer](checkpoint-continuation-audit.ts) accepts `AUDIT_TIER`
and the optional `AUDIT_SEED=full-invariant` control, and writes fresh readbacks
under `artifacts/physiology-evaluation-2026-09-07/` after the bundle is restored.
This narrows the issue to the checkpoint/continuation-test contract, not a reason
to refit physiology. No numerical code or assertion was changed. The decision
between the intended restart semantics and a history-preserving checkpoint must
be explicit before calling this a bit-exact continuation guarantee.

The first minimal reader extraction is [PR #614](https://github.com/g960059/0DSimDemo/pull/614).
Its 35 scoped tests, production build, offline export and three production-browser
tests passed on current main without Standard71 implementation or authoring code.
It includes no research evidence bundle and does not promote an executable.

## Reading order and investigation map

Reports are copied verbatim below for direct GitHub reading. Relative links to
larger data, plots and scripts resolve after extracting `evidence.tar.gz` into
an empty directory. A link can refer to a deliberately omitted exploratory
record; check `inventory.json` rather than assuming every linked file was saved.

| Workstream | Question / contribution | Original record |
| --- | --- | --- |
| Reference baseline | Absolute active-tension calibration, systemic storage, resistance, TBV; avoiding a display-only knob reset | [Report](artifacts/baseline-reference-2026-09-05/REPORT.md) |
| Vascular/myocardial coupling | Low-volume shape, inertance/compliance contrasts, material readback and pump/filling limitations | [Report](artifacts/baseline-coupling-2026-09-05/REPORT.md) |
| Diastolic activation | Residual active tension and source-to-organ parameter transfer | [Report](artifacts/diastolic-activation-2026-09-05/REPORT.md) |
| Kinetic reference gates | Source locking, parameter identifiability and evidence roles | [Report](artifacts/kinetic-reference-gates-2026-09-05/REPORT.md) |
| Alternative material forms | Component and closed-loop tests; unsuccessful alternatives retained | [Report](artifacts/reference-model-form-2026-09-06/REPORT.md) |
| Passive/reference coupling | Length, passive law and calcium interactions, fine-step and reserve follow-up | [Report](artifacts/reference-passive-coupling-2026-09-06/REPORT.md) |
| Calcium/length coupling | Population, recovery and refinement counterfactuals | [Report](artifacts/ca-length-coupling-2026-09-06/REPORT.md) |
| Activation/Huxley | Alternative research constitutive model, not the adopted production law | [Report](artifacts/activation-huxley-2026-09-06/REPORT.md) |
| Population moments | Closure/strain-transfer alternatives and refinement | [Component report](artifacts/population-moment-2026-09-06/REPORT.md), [closed-loop report](artifacts/population-moment-closed-loop-2026-09-06/REPORT.md) |
| Filling reserve attribution | Pericardial/active contributions and corrected readback | [Report](artifacts/filling-reserve-attribution-2026-09-06/REPORT.md) |
| Ejection deactivation | Exit, length, calcium and operating-point factorial probes | [Report](artifacts/ejection-deactivation-2026-09-06/REPORT.md) |
| First selected candidate | TBV5250 candidate, independent cold/fine runs, headroom and unfiltered waveforms; superseded by later loading selection | [Report](artifacts/baseline-candidate-2026-09-06/REPORT.md), [review decisions](artifacts/baseline-candidate-2026-09-06/REVIEW-DECISION.md) |
| Semilunar load | AV/PV linear resistance and PA compliance contrasts; no automatic R=0 or display-only correction adoption | [Report](artifacts/semilunar-load-ablation-2026-09-06/REPORT.md), [review decisions](artifacts/semilunar-load-ablation-2026-09-06/REVIEW-DECISION.md) |
| RV and measurement stations | RVP/PAP versus LVP/AoP, closure shape and pressure-recovery interpretation | [Report](artifacts/valve-station-rv-review-2026-09-06/REPORT.md) |
| Peak/PV-loop literature | Measurement planes, peak position, shoulders/rebound and why a universal dome template was not adopted | [Report](artifacts/pressure-peak-literature-2026-09-07/REPORT.md) |
| Physiological assessment | Measurement-matched reference comparisons, τ, signed pressure/flow readback, prospective admission, numerical reserve margins, TBV4935 selection and Standard71 binding | [Report](artifacts/physiology-evaluation-2026-09-07/REPORT.md), [review decisions](artifacts/physiology-evaluation-2026-09-07/REVIEW-DECISION.md) |
| Preset/fitting direction | Evidence-backed targets, explicit construction binding and limits of a general fitter claim | [Report](artifacts/baseline-preset-direction-2026-09-06/REPORT.md) |
| Documentation maintenance | Independent Claude Fable5.1 max review of reuse, retirement and archival independence | [Review](artifacts/model-documentation-2026-09-07/maintenance-claude-fable-5.1-max.md) |

## What became the candidate, and what did not

The fixed Standard71 factory/checkpoint/session in this branch is the code
authority. It recalibrates the existing ventricular Ca–Land–geometry coupling,
uses an absolute reference active tension and retains a separate intervention
control, changes systemic arterial compliance, and removes Ao–SA inertance in
this construction. It does not add a new opening state, fit a graphical dome,
apply display-only pressure recovery, or adopt the alternative population-moment
and activation/Huxley research models. The physical primitives, full precision
coefficients, circuit equations and initial conditions are also frozen in the
saved Standard71 document package.

The 2ms Standard71 cold replay matches the admitted research terminal trace and
completed beat exactly. The own settled checkpoint is at a true cycle boundary;
the launch checkpoint is a separate actual advance to the 2ms presentation
grid, not a reassigned timestamp. A different fixture never receives that
default checkpoint silently. Inherited 1ms/reserve evidence belongs to the same
physical research construction; it is not relabeled as a newly executed
Standard71 fine/reserve run.

## Assessment, review and residual limitations

- Numerical validity, engineering construction constraints, population/method
  comparisons and retrospective selection are separate claims.
- Native valve-flow event timing is not automatically Doppler/TDI timing;
  volumetric E/A is not automatically a Doppler velocity ratio. Node gradients
  are not interchangeable with local maximum-jet gradients. Mean LA is a PCWP
  surrogate, not an independent wedge-pressure measurement.
- Historical narrow dP/dt, timing and contour corridors remain visible as
  context. A shape descriptor is not a proven normal PV-loop curvature range.
  No smoothing is used to make the candidate pass.
- Weiss and free-asymptote relaxation estimates, their fit windows and their
  method sensitivity remain distinct. The baseline does not establish normal
  relaxation for every loading condition.
- Prospective reserve admission tests two settled grids and endpoint-weighted
  differences against engineering response margins. That is a numerical
  sensitivity screen, not a rigorous error bound or a clinical fluid-response
  definition. The original historical reserve `failed-response` remains in the
  raw input records; it is not overwritten by the later policy.
- Strict endpoint waveform/τ observers were not run across every reserve
  endpoint. Two-grid checks do not rule out common settlement bias. Broad RV,
  valve-disease, HFpEF, HFrEF or patient-specific validity is not claimed.
- The legacy gate-provenance audit remains draft with unresolved supports;
  prospective candidate admission does not silently clear that stable-publication
  guard. This needs an explicit model-specific registration boundary.
- Review thresholds follow the user's 1/2 adoption rule. Preserve each review's
  actual scope and dissent. The prospective policy/4935 candidate received
  scoped support from both requested reviewers; the local Standard71 binding
  received Astra's scoped approval. No fresh external approval is claimed by
  this archival preparation.

## Preservation and restoration

`inventory.json` records SHA-256 and byte length for every artifact found, which
ones are in `evidence.tar.gz`, and why the others are omitted. Both original
admission inputs (2ms and 1ms, including reserve observations) are mandatory
members. Compact protocols, source snapshots, selected executable artifacts,
review prose, plots and standalone HTML exports are retained. CLI operational
transcripts are not published wholesale; their final reviewer prose is copied
verbatim separately with the original transcript hash and reported model.

Third-party PDFs/manuscript downloads are not redistributed. Large exploratory
arrays, duplicated summaries and operational artifacts are deliberately not all
committed. **An inventory hash is not a backup of an omitted file.** Originals
are untouched in the research worktree. Do not delete that worktree on the
assumption that this is a full backup of all ~3 GB.

To restore the selected evidence, extract the trusted repository archive into
an empty directory with `tar -xzf <absolute-path>/evidence.tar.gz -C <empty-dir>`.
Paths retain the original `artifacts/` layout. Re-running scientific scripts
also requires this archival source revision and its package lock. A saved
document can be read/exported without those scientific sources.

The existing frozen document retains its truthful dirty-source provenance from
creation; committing it does not retrospectively turn that sourceBaseCommit
into a clean scientific release. Future document edits require their own
revision rather than reinterpretation of these measurements.

## Bounded next integration sequence

1. Preserve this draft archival PR as **DO NOT MERGE**.
2. Bring only the generic saved-document reader, frozen package, export and
   regression coverage onto current main. Do not restore retired model routes.
3. Resolve lean checkpoint continuation and finish explicit candidate admission
   wiring before any Standard71 executable publication/default switch.
4. Separate reusable reference/evidence from model-specific fitting inputs and
   evaluated realizations; no implicit Standard70-to-71 fallback.
5. Test a small multi-start/interior synthetic baseline workflow using existing
   lean execution, local workers and verified checkpoints. Finalist-only cold,
   fine-grid and low/high preload checks; no afterload test.
6. Pilot one evidence-backed preset before extending to multiple diseases,
   individualized demonstration fitting, a large UI, or cloud infrastructure.

Document publication, baseline parameter selection and numerical model minting
remain distinct operations. The first minimal PR must not wait for all six steps.
