# Standard70 exact nonlinear synthetic-recovery probe V1

Status: archival research evidence; do not merge as a product or reusable
fitting qualification

## Question and scope

PR #600 identified total blood volume (TBV) plus the common ventricular
active-tension scale as the only tested two-coordinate candidate whose local
primary Jacobian remained supported under every reported tolerance
composition. PR #601 then tested only algebra generated from those same
Jacobian artifacts. That experiment was correct but redundant: its success was
already implied by the cross-Jacobian amplification bound, so it was archived
without merge.

This probe asks the first genuinely new question: can the refined half-step
primary Jacobian recover two non-collinear, exact nonlinear Standard70 targets
that were generated from cold initial states rather than from a Jacobian?

The probe does not change the exact model, baseline, Model Surface, gates, or
parameter catalog. It does not execute an optimizer and does not qualify
preset or non-clinical case fitting.

## Frozen inputs and method

- Exact model: Standard70.
- Center: the verified `rest-hr60` baseline, TBV 4900 mL and active-tension
  scale 1.24.
- Estimator: the refined-dt (0.001 s), central half-step Jacobian on the nine
  complete systemic and left-heart operating-point rows selected by the
  calibration-stage policy.
- Target generation: exact nonlinear Standard70 execution from a cold state at
  0.001 s, with the ordinary period-1 convergence and all construction and
  right-heart safety gates retained.
- Controls: TBV 4950 mL with active-tension scale 1.25 and 1.23. Their
  transformed offsets have directions `(+, +)` and `(+, -)` and therefore span
  the tested two-coordinate space.
- Proposal: weighted two-column least squares in the declared log-transformed
  coordinates, followed by projection to the exposed release lattice.
- Replay paths: direct continuation from the verified baseline checkpoint,
  TBV-first continuation, and active-tension-first continuation. Every
  intermediate and final point independently re-established period-1
  convergence.

The nine response rows are normalized by their construction-corridor width and
the existing equal-mass-within-evidence-group weight. The fit does not count
the rows as nine independent clinical observations.

## Preliminary four-direction feasibility screen

Before fixing the controls, all four one-step diagonal candidates were run by
refined-dt continuation from the verified baseline checkpoint.

| TBV / active direction | Candidate | Construction result | Relevant failed checks |
| --- | --- | --- | --- |
| minus / minus | 4850 mL / 1.23 | failed | ICT 0.0700000000000216 s, AoP max 89.43 mmHg, CI 2.473 L/min/m2 |
| minus / plus | 4850 mL / 1.25 | failed | ICT 0.0700000000000216 s, AoP max 89.70 mmHg, CI 2.478 L/min/m2 |
| plus / minus | 4950 mL / 1.23 | passed | none |
| plus / plus | 4950 mL / 1.25 | passed | none |

The ICT boundary excess is floating-point scale, but both low-TBV controls
also fail AoP and CI by physiologically material amounts relative to their
frozen corridors. They were not relabelled as successful controls. This is
evidence that the current baseline lacks a symmetric one-step TBV construction
interior; it is not evidence against the local two-coordinate estimator.

## Exact nonlinear recovery results

| Control | Cold cycles | Continuous estimate | Error in release steps, TBV / active | Projected result | Linearized residual fraction |
| --- | ---: | --- | --- | --- | ---: |
| TBV plus / active plus | 137 | 4949.1668 mL / 1.248666 | -0.0167 / -0.1334 | 4950 mL / 1.25 | 0.04921 |
| TBV plus / active minus | 138 | 4952.1736 mL / 1.228647 | +0.0435 / -0.1353 | 4950 mL / 1.23 | 0.02976 |

Both independently generated nonlinear targets passed every construction and
right-heart safety gate. Both continuous estimates lay well inside one-half
release step for each coordinate and projected to the exact known truth.

This is stronger than PR #601 because the response is produced by the exact
nonlinear model, not by a second Jacobian. It remains a local two-control result
around one baseline and is not an identifiability or uniqueness proof.

## Initialization and order replay

All six final replays passed period-1 convergence, construction gates, and
right-heart safety gates.

| Control | Direct cycles | TBV-first cycles | Active-first cycles | Maximum primary normalized replay difference |
| --- | ---: | ---: | ---: | ---: |
| TBV plus / active plus | 17 | 8 | 17 | 0.001159 |
| TBV plus / active minus | 17 | 7 | 17 | 0.000981 |

The final checkpoint hashes differ because accepted history and accumulator
state are part of checkpoint identity. The scientific comparison is therefore
the converged measurements and gates, not byte equality between checkpoints
created by different continuation histories.

## Numerical-floor result and its limitation

The existing Standard70 numerical-floor audit was run independently:

- coarse-dt cold A and B each converged in 144 cycles and were deterministic;
- the same-model checkpoint replay converged in three cycles;
- fine-dt cold converged in 143 cycles;
- all 28 objective checks had unique floor records;
- every run passed the right-heart safety sentinels.

The six same-parameter target replays were then compared with these baseline
floors. Most rows were below the baseline floor. LVEF reached 1.18 times its
baseline floor, despite an absolute difference of only about 0.00013. Thus a
single baseline floor is not a candidate-wide bound and must not be silently
transported to every fitted point.

Under the already frozen finalist comparison rule, which adds two percent of
the construction corridor to the numerical floor, every replay passes. The
largest replay uses 7.73 percent of that admitted tolerance. This rule is
adequate for the present construction-path comparison, but it is not a
measurement likelihood or a candidate-local uncertainty estimate.

## Performance observation

The numerical-floor run measured approximately 152--155 seconds for each
coarse cold construction, 285 seconds for the fine cold construction, and 3.3
seconds for exact same-model checkpoint reconfirmation. The synthetic controls
showed the same qualitative separation: cold targets required 137--138 cycles,
whereas nearby continuation paths required 4--17 cycles per stage.

This supports a simple performance priority:

1. create a cold target or condition center once;
2. persist its content-addressed exact checkpoint outside Git;
3. validate identity and structure on reuse;
4. re-establish three period-1 cycles before use; and
5. reserve cold/refined reconstruction for finalists and qualification.

No surrogate, cloud scheduler, or general distributed optimizer is justified
by this probe.

## Artifact provenance

Raw input artifact SHA-256 values:

- primary-envelope conditioning:
  `6504bc1448380cc820f99460d552bf865bf5666f59f34c1215e15631d723b7e0`
- refined derivatives:
  `2e725909868839e640502639f94fac90757e3923a58e37c8a48675f128869feb`
- perturbation attribution:
  `00ca50a62940ffb78dc45601442daf4e0bb8d5f09760b1b6094d1d8e1ebe3773`
- calibration stage:
  `be4cba5386dadcedd8c6f47240bc5528243cecb504f41011643e2c0df34f0610`
- Standard70 numerical floor:
  `4de41565e40b03ec77c9496fcfb80f00874769ee05bd2f419a1e5ec3233ca99b`

Probe output SHA-256 values:

- TBV plus / active plus:
  `321ed6320eb8da29d032955f42a7ac36629ec84747ffe92ed76561598194995e`
- TBV plus / active minus:
  `15c6f6af57c627b194413d6bcdafc30f864f7431902dc4bbd56eb573f8689cec`

The source study identity is
`95bc363dcd241f8a216ada87dfce953cda8c1ebd6d457be2cd99bcbb7884c262`,
the exact-model identity digest is
`4be8586cb319c3ea28d06abdd130b5d629089484325b800ffd8f31c8097e415b`,
and the stage-policy identity is
`1c9abe06af8e5603b9062a35d4690ad456297a8b452b510200234a2f7a50874a`.

## What remains unresolved

- Both successful controls move TBV upward because the present baseline fails
  the low-TBV one-step construction screen. Symmetric local recovery is not
  established.
- The common active-tension control also changes RV mechanics. Resting
  right-heart gates passed, but multi-condition RV and pulmonary held-out
  prediction has not been evaluated here.
- Two exact controls do not establish global or structural identifiability.
- No deliberately confounded raw preload-owner pair has been tested.
- No noisy, missing, correlated, or method-mismatched observation set has been
  fitted.
- No covariance or model-discrepancy model was applied.
- No multistart optimizer was run. The three paths test exact continuation
  order after a local proposal, not optimizer basin convergence.
- The baseline numerical floor is demonstrably not a global candidate floor.

## Smallest justified next implementation

Do not merge the exploratory probe as a permanent fitting framework. Extract
only the following into a focused main PR:

1. a fail-closed two-coordinate local proposal that consumes the verified
   stage basis and exact target rows;
2. an exact replay contract that retains all construction and right-heart
   gates and uses the existing finalist comparison rule without calling it an
   inferential uncertainty;
3. a content-addressed local candidate checkpoint with exact three-cycle
   reconfirmation; and
4. tests for non-orthogonal least squares, incomplete rows, off-lattice truth,
   failed gates, and altered provenance.

After that minimal vertical slice, run the declared TBV versus venous-tone raw
confound control and held-out preload/afterload/HR conditions before any preset
or non-clinical case-fitting UI is exposed.
