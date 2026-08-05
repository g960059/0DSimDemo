# Integrated V3 Guyton / Starling side analysis

## Current product boundary

The Workbench exposes three deliberately different side-analysis objects:

1. a **structural vascular-return orientation** from one exact accepted V3
   step; and
2. a fast **responsive fixed-TBV Starling preview** measured from independent
   V3 branches inside two disposable directional analysis Workers seeded from
   the Scenario's same exact accepted checkpoint; and
3. an opt-in **formal periodic fixed-TBV pressure-volume analysis** whose load
   points must pass the canonical full-accepted-state period-1 qualifier.

The responsive object has one locally period-1-settled operating anchor in its
frozen-tone regime, but its
off-centre points and resulting curve remain an adaptive preview rather than a
settled or independently validated physiological relation. The third object is
numerical periodic evidence, but is still neither independent physiological
validation nor a clinical measurement. The UI keeps these claims separate.

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

## Responsive Starling preview

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
responsive regime before any continuation begins. This is intentionally faster
and weaker than the formal full-state Snapshot qualifier. The two preload
directions then warm-start independently from that exact locally settled
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

## Fixed-TBV multi-load PV-loop support-envelope preview

The same responsive fixed-TBV branches retain the last complete ventricular
pressure-volume orbit from their analysis-only 20 ms sampling stream. This
does not enlarge the live Worker DTO or make the orbit durable. LV and RV use
transmural pressure. The complete-beat maximum-volume landmark remains the
input to the passive positive-pressure offset-power trend. The interpolated
positive-to-closed semilunar-flow landmark is retained only as a slope seed;
it is not treated as the fitted ESPVR contact, and a minimum-volume fallback is
never substituted.

`MainWireIntegratedModelRapidPressureVolumeRelationV3` deliberately uses only
the local `0.72–1.24×` source-TBV region. Deeper hypovolemic points remain
important to the Starling rising limb but are not allowed to dominate this
local preview. A preview fails closed until at least one eligible complete loop
exists on each side of the operating anchor.

For each positive candidate elastance `E`, every loop supplies its discrete
upper-left support intercept

```text
b_i(E) = max_t(P_i(t) - E V_i(t)).
```

The selected `E` minimizes the spread of these per-load support intercepts.
The common displayed intercept is `max_i b_i(E)`, so no retained sample from
any admitted load can lie above, or be cut by, the relation. When the model's
multi-load systolic boundary is approximately linear, several loops contact
the same line; residual between-loop support gap is exposed explicitly rather
than hidden by forcing the line through a single settled ES point. The locally
settled operating branch is therefore one member of the fitted loop family,
not a privileged one-point constraint. Contact points are presentation-internal
and are not promoted to independently observed end-systolic events.

The two zero-pressure intercepts remain distinct. The semilunar-closure trend
reports a linear extrapolated `V0,ES`-like intercept; the maximum-volume trend
reports its own passive zero-pressure offset. Equality is neither imposed nor
implied. Both extrapolations are sampled to their zero-pressure intercept for
presentation, but neither becomes a physical chamber volume or qualified
energetics result merely by being drawn. A parameter-bound hit on the passive
grid fit is exposed in the DTO because a high `R²` does not establish an
identifiable passive intercept.

While either directional Worker is progressing the status is
`collecting-preview`; after the merged bidirectional sweep finishes it becomes
`complete-preview`. Completion describes execution only and is not scientific
qualification.

Workbench and Reader request this analysis automatically for visible LV/RV PV
panes. A completed prior preview remains faded while a replacement is running.
Until bilateral eligible multi-load points exist, the Canvas draws the loop and
an analysis-progress indication only. It does not substitute a single-beat
radial, tangent, or Klotz-informed fallback. Once a fixed-TBV multi-load
relation exists, the Canvas draws it directly. The loop continues to own both
upper axis bounds. Only finite extrapolated intercepts may extend the lower
volume bound so their zero-pressure geometry remains visible. The displayed
linear systolic relation begins at its zero-pressure intercept and extends
until it first reaches the visible right or top axis boundary.

In the default mode the UI calls this object a **fixed-TBV multi-load PV-loop
support-envelope preview**, not ESPVR/EDPVR. Its portable semantics are
`responsive-fixed-tbv-multi-load-pv-loop-support-envelope-preview-not-validated-espvr-edpvr`.
It remains
ephemeral presentation data and cannot qualify an Experiment Snapshot. No
PVA or myocardial oxygen-consumption number is derived from this preview.

## Opt-in formal periodic pressure-volume analysis

Every pressure-volume pane durably owns one analysis mode. The product default
is `responsive-preview`; Pane Settings can opt that pane into
`formal-periodic`. There is no global mode switch. The two paths use different
`analysisId` values and therefore cannot satisfy one another's Worker request,
cache entry, or presentation history.

The formal path retains the same live-session isolation boundary and applies
this qualification contract:

1. Input pins the immutable `modelId`, source fixture/checkpoint identity,
   requested TBV deltas, numerical policy, and cancellation/request identity.
2. Every TBV point creates an independent integrated V3 branch using the
   shared-SV/VC-transmural-pressure transform, or a separately specified and
   validated conservative transform. It must never modify the live Scenario or
   reuse another branch's mutable numerical state.
3. The operating point and four bounded loads in each direction (`0.96`,
   `0.90`, `0.82`, `0.74`; `1.06`, `1.12`, `1.18`, `1.24`) are warm-started
   from the preceding qualified exact state. The corresponding fixture TBV is
   changed with the state, so checkpoint identity and numerical ownership do
   not diverge.
4. Each branch runs the canonical full-accepted-state period-1 Snapshot
   qualifier with slow controllers fully active. Alternating, non-finite,
   event-invalid, conservation-failing, or checkpoint-round-trip-failing
   branches remain rejected points rather than display values.
5. The accepted terminal checkpoint is restored and three subsequent complete
   beats provide time-weighted RAP/LAP, forward cardiac output, maximum-volume
   landmarks, and the last complete transmural pressure-volume loop. Raw
   instantaneous flow is not a cardiac-output substitute.
6. A displayed relation requires enough qualified points on both sides
   of baseline and declares its interpolation, measured domain, rejected
   points, and absence of extrapolation. No local surrogate is substituted
   when the gate fails.
7. The Worker returns a presentation DTO only. Settlement reports and traces
   remain ephemeral unless a later explicit scientific-artifact workflow asks
   to retain them. Only after all gates pass may points use
   `evidence = "qualified-periodic"` and
   `starlingLocus.status = "measured-fixed-tbv-protocol"`.

For both preview and formal analysis, the systolic relation is the common
upper-left support envelope of admitted complete PV loops. Formal mode changes
the branch qualification, not this geometry: only canonical period-1-qualified
loops may contribute. The positive-pressure maximum-volume points define the
offset-power passive trend. Each relation reports its measured range, fit
diagnostics, maximum between-loop support gap, and maximum sampled-loop
penetration. Their two zero-pressure intercepts remain independent and are not
forced to share one `V0`.

The formal label means that the numerical protocol and qualification contract
were executed. It does not establish experimental validation, clinical
validity, uncertainty calibration, PVA, or myocardial oxygen consumption. A
No single-beat radial/tangent or Klotz-informed curve is substituted when the
multi-load relation is unavailable.
