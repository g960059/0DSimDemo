# Integrated V3 Guyton / Starling side analysis

## Current product boundary

The Workbench exposes two deliberately different side-analysis objects:

1. a **structural vascular-return orientation** from one exact accepted V3
   step; and
2. one **settled fixed-tone TBV family** used jointly by the bidirectional
   Starling presentation and by Workbench ESPVR, EDPVR, SW, PE, PVA, and
   estimated MVO₂.

The family is a bounded numerical analysis, not independent physiological
validation or a clinical measurement. Its adaptive operating-anchor-to-60%
low-volume core retains at least nine settled points and owns PVA. Wider high-
and deep-low-volume points extend only the Starling presentation and cannot
change an already available PVA result.

`MainWireIntegratedModelGuytonStarlingOrientationV3` is read-only. It freezes
the accepted step's vascular volume ledger, vascular pressure–volume laws,
external pressures, and local edge-loss coefficients, then solves a steady
volume-constrained return map. Dynamic-edge inertance is intentionally omitted
from this steady orientation. The systemic operating return includes both
`VC → RA` and coronary-sinus return; the structural path uses the systemic
non-coronary volume ledger. The pulmonary map follows
`PCap → PVen → PVein → LA`.

The vascular-return calculation neither advances nor forks the live session.
It is a local network orientation, not an intervention result, a clinical
measurement, or an independently validated physiological relation.

## Historical responsive Starling preview

The following protocol remains documented for reproducibility but is no longer
requested by Workbench or Reader. The current product uses the shared settled
family described below, eliminating the second low-volume sweep.

`MainWireIntegratedModelResponsiveStarlingProtocolV3` begins by capturing the
requested accepted fixture/checkpoint pair once. The Workbench initializes a
hypovolemic Worker and a hypervolemic Worker from that same exact pair in
parallel. Initializing those Workers is the only interval for which the source
numerical lane is drained. The source resumes immediately after both clones
exist; neither continuation can consume its live Worker or mutate its state.

Each directional Worker deterministically computes the same operating anchor
at source TBV. The coordinator requires those duplicate centers and their
structural return payloads to be canonical-JSON identical, then collapses them
to one displayed point. That center must pass two consecutive complete-beat
closure comparisons within a bounded 20-beat window in the frozen-tone
responsive regime before any continuation begins. The PVA chain uses this same
local closure gate at every retained load; the responsive preview permits a
weaker adaptive rule away from its center. The two preload directions then
warm-start independently from that exact locally settled
center. Every next point starts from the
previous accepted point in the same direction, preserving
cardiac phase, mechanics, circulation, valve memory, rhythm, MCS state, and
accepted coronary tone. Slow coronary-tone regulation is frozen at the branch
source so a short curve does not mix fast preload response with a 25-second
controller transient.

Normal continuation points use three complete beats when their residual is
already small and extend adaptively to five beats otherwise. Deep hypovolemic
points may extend to 12 complete beats because this is where convergence slows
and the rising limb is most informative. The right locus measures native
forward pulmonary-valve output with mean RAP; the left locus measures native
forward aortic-valve output with mean LAP. No instantaneous or partial-beat
sample is promoted to a curve point.

The nominal low targets progressively reduce source TBV through `0.95`, `0.90`,
`0.84`, `0.78`, `0.72`, `0.66`, `0.60`, `0.54`, `0.48`, `0.42`, and lower
fractions. They are not a hard promise to display unsafe states. If a requested
jump is rejected, does not reach the preview residual gate, or detects a
period-2 boundary, the continuation inserts warm-started midpoint points and
bisects the last reliable/unsafe TBV interval to within 1% of source TBV. This
adaptive point budget can exceed the nominal count. It deliberately approaches
the low-flow limb until both native left and right cardiac outputs are at or
below `0.5 L/min`. Deeper nominal scales remain numerical fallbacks when that
target has not yet been reached. The last rejected or nonconverged point stays
out of the connected curve. The high side has five bounded fallback targets
through `1.40×`, but normally stops earlier once both circulations show a
confirmed descending limb: two consecutive post-plateau flow reductions and
an aggregate fall of at least `max(0.15 L/min, 3% of peak CO)`. One isolated
lower point is treated as noise rather than a physiological descending limb.

The Worker emits one correlated `analysis-progress` result after every accepted
point. The main thread merges actual points by role and exact TBV identity as
soon as either Worker reports, without synthesizing an intermediate sample.
Thus the low and high limbs appear concurrently rather than waiting for one
direction to finish. The Canvas connects only eligible measured points with
shape-preserving PCHIP, draws the boundary as a hollow point, and never
extrapolates beyond the measured domain.

Workbench and Reader run this same independent analysis for every visible
Scenario and keep results under the composite `ScenarioId + analysisId`
identity. For each circulation side, all Scenario pairs are projected into one
shared axis domain. Guyton and Starling share that Scenario's hue; geometry
distinguishes curve kind, while a Scenario-name-only legend appears only for
two or more Scenarios. Parameter commits archive the completed prior pair and
automatically launch the replacement from the new exact accepted checkpoint.
While replacement is pending, the last complete pair remains as a faded
fallback even when authored history depth is zero, and each affected Scenario
shows a compact recalculation indicator. Progressive replacement points use the
normal Scenario hue. Once complete, the fallback becomes ordinary history and
obeys the authored depth (default one, maximum three). Presentation history is
never an analysis input.

Once responsive points exist, the default viewport belongs to the measured
Starling locus and its analytic operating intersection. A structurally
flow-limited Guyton plateau may be clipped instead of inflating the pulmonary
flow axis and flattening the Starling locus. The vertical label is
`CO / venous return`, because the two quantities are equal only at the
operating intersection. The systemic horizontal label is
`CVP / mean RAP`; the model-owned quantity is mean RAP and CVP is its clinical
estimate. The pulmonary horizontal label is
`Mean LAP (PCWP surrogate)` because the integrated model does not simulate a
catheter wedge measurement. The clinical-focus defaults retain a small
negative-pressure context (`-3 mmHg` systemic, `-2 mmHg` pulmonary), while an
actual measured Starling point can expand either range. A sustained descending
limb focuses the upper pressure boundary on its first declining point plus
roughly 20% pressure margin. The later sample needed to confirm that downturn,
and any still more extreme high-volume samples, remain in the analysis payload
but do not own the default viewport. Only current Scenario curves participate
in autoscaling; faded history is clipped to that domain.

Each Guyton/Starling pane owns exactly one circulation. The graph add action
constructs either systemic (`CVP / mean RAP`) or pulmonary (`Mean LAP / PCWP
surrogate`) analysis presentation. Showing both requires two panes, which keeps
Workbench Dockview and Article Briefing composition independent and avoids two
vertically stacked physiological plots inside one semantic pane.

The Guyton return curve is analytic for the frozen volume/PV-law ledger and
retains its registered positive edge losses. The structural ledger is an
instantaneous accepted boundary, while the Starling anchor is a complete-beat
mean LAP/RAP and cardiac output. The implementation therefore solves one
downstream-pressure-coordinate translation that makes those two time bases
coincident at the operating point; it does not alter resistance or the curve's
structural shape. The volume residual of that solve is retained in the
presentation DTO and is required to remain below tolerance. The corresponding
volume-derived filling-pressure orientation is translated by the same amount.
The shared anchor is also included as an exact curve sample and designated
operating point, so the analytic Guyton orientation and measured Starling locus
have one explicit, reproducible intersection.

The operating anchor carries `settled = true`,
`evidence = "responsive-settled-anchor"`, and
`measurementWindowStatus = "responsive-period1-settled"`. Every off-centre
adaptive point carries `settled = false` and
`evidence = "responsive-preview"`; the combined presentation DTO carries
`starlingLocus.status = "responsive-fixed-tbv-preview"`. Finite readback and
the fixed-TBV ledger are checked, but the result remains a disposable display
analysis. It is not Snapshot qualification, V&V evidence, or a durable
scientific artifact.

## Retired PV-loop support-envelope preview

The earlier responsive multi-load support-envelope was an exploratory display
geometry, not ESPVR or EDPVR. It has been removed from the current product and
is no longer requested, fitted, cached, or drawn by Workbench or Reader. The
Git history retains the retired implementation and its tests when that
experiment needs to be inspected.

## Settled preload-reduction PVA analysis

Every pressure-volume and Guyton–Starling pane now uses the same
`formal-periodic` analysis result. Legacy authored `responsive-preview`
settings remain readable for content compatibility, but they no longer select
a second computation or displayed relation.

The PVA path retains the same live-session isolation boundary and applies this
bounded calculation contract:

1. Input retains the `modelId`, source fixture/checkpoint identity, request
   identity, and cancellation boundary.
2. Two persistent directional Workers start from the same exact Scenario
   capture. Each first settles an isolated active-controller copy at Scenario
   TBV and freezes coronary tone at that endpoint. The low-volume Worker follows
   a monotone adaptive chain to `0.60×` source TBV. Its first decrement is
   intentionally close to the high-volume arm's `0.08×` spacing, then the
   ceiling narrows progressively toward low volume while reserving room for at
   least nine retained points. The high-volume Worker proceeds concurrently
   when the device pool has capacity; a one-slot device prioritizes the
   low-volume PVA branch.
3. Each load uses the shared SV/VC transmural-pressure TBV transform and starts
   from the preceding retained endpoint. Coronary tone is held at its source
   value so a short preload reduction does not spend minutes re-equilibrating
   the 25-second autoregulation controller.
4. A point is retained only after the declared complete-beat minimum provides
   two consecutive flow/pressure/volume comparisons within the P1 closure
   limits. The minimum is three beats near the anchor, four in the intermediate
   preload range, and five in the lowest core and Starling-extension range.
   More beats remain available when closure needs them. Period-2 or
   nonconverged branches fail the PVA calculation rather than being silently
   fitted.
5. SW is available from the retained anchor. The anchor plus one lower- and one
   higher-TBV point admit provisional ESPVR/EDPVR drawing. The anchor plus the
   nearest three lower- and nearest one higher-TBV point lock the common phase
   and admit PE/PVA and the literature MVO₂ estimate. The remaining sweep
   extends the measured relations without changing that phase.
6. The final complete beat retains its atrial-capture-relative transmural PV
   loop, maximum-volume ED proxy, duration, and exact accepted-step transmural
   path work. The latter owns displayed SW.
7. The primary ESPVR is a shape-preserving nonlinear locus at one common time.
   That time maximizes integrated positive pressure area above the core-only
   EDPVR over the contemporaneous volume span measured by those same five
   loads, so pressure and contraction width both contribute. A 128-time coarse search is followed by
   32-interval local refinement, without filtering the objective by
   monotonicity. The selected low-volume-to-anchor PVA domain must remain
   strictly pressure-increasing.
   After the fifth core point the phase is locked; either Worker may add points
   to the measured locus and full-family EDPVR without moving that phase. An
   above-anchor turn is retained as a surface-section diagnostic rather than
   invalidating the PVA domain. The last valid relation remains drawn during
   an in-flight update, but stale
   numerical outputs are not retained. The volume-specific maximum-pressure
   envelope is an optional, default-off diagnostic overlay. EDPVR is a
   volume-weighted exponential fit to maximum-volume points. PE is admitted
   only after locating the left ESPVR–EDPVR intersection and verifying
   `P_es > P_ed` over every sampled interval through anchor ESV. No separate
   classical `Ees`/`V0` line is fitted.
8. PVA is `SW + PE`. Estimated MVO₂ uses current PVA, measured beat heart rate,
   model-derived LVFW+SEP mass, and the declared Suga literature mapping. It is
   an estimate, not measured oxygen consumption or clinical validation.
9. The high-volume Worker continues until the bounded schedule ends or both
   circulations confirm a descending limb. After final PVA, the low Worker
   follows nominal targets toward `0.23×` source TBV, inserting settled
   midpoints when a requested jump is too large and stopping at the declared
   low-flow or numerical boundary. These extensions populate the bidirectional
   Starling graph progressively. A stopped extension does not invalidate final
   PVA.

The internal analysis-mode key remains `formal-periodic` for persisted
Workbench compatibility; that key does not claim full-state certification.
No single-beat radial/tangent or Klotz-informed curve is substituted when the
settled multi-load relation is unavailable.
