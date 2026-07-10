# Atrial PV lobe measurement V2

Status: implementation note for `engine/mechanics2/diagnostics/LaPvLobeMeasurementV2.ts`.

This detector measures true lobes of the left-atrial pressure-volume curve only
when the sampled periodic polygon has exactly one usable self-intersection. It is
an engineering topology diagnostic for the current MechanicsCore2 atrial work,
not a clinical normal-range definition.

## Curve definition

Input samples are ordered points

\[
p_i=(V_i,P_i),\qquad i=0,\ldots,n-1,
\]

where \(V_i\) is `laVolumeMl` and \(P_i\) is `laPressureMmHg`. Consecutive
duplicate PV points are removed, and a duplicate final point equal to the first
point is removed. The curve is then treated as a periodic polygonal curve

\[
C=\bigcup_{i=0}^{n-1} [p_i,p_{i+1 \bmod n}].
\]

The detector fails closed before topology work if any PV coordinate is
non-finite or if the compacted periodic curve has fewer than four points.

## Self-intersection definition

Candidate crossings are computed between non-adjacent periodic segments. Segment
coordinates are normalized by the observed PV ranges before intersection tests.
Adjacent segment pairs, including the first/last periodic pair, are skipped.

For two non-adjacent segments \(a+t r\) and \(b+u s\), a usable crossing must
come from a non-parallel segment solve:

\[
a+t r=b+u s,\qquad 0\le t\le 1,\quad 0\le u\le 1.
\]

The implementation records the crossing coordinate, path progress on both
segments, and the absolute crossing angle. Zero-length segments, colinear
overlap, parallel endpoint touch, and near-parallel degeneracy are classified as
degenerate. A non-parallel intersection at a non-adjacent sampled vertex is still
treated as a proper crossing candidate, but it must survive the endpoint-topology
filter below. Multiple raw intersections at the same sampled crossing coordinate
are clustered into one candidate; this handles a true crossing that is sampled
as a non-adjacent vertex. More than one accepted topological crossing is
rejected.

After clustering, each candidate must have side-alternating incident arms. The
implementation takes the two local arms from each traversing branch, including
the previous/next periodic segment when the crossing lies at a segment endpoint,
sorts the four arm directions by angle around the crossing, and requires the
branch labels to alternate all the way around. This rejects endpoint touches,
tangent contacts, and same-side kisses that satisfy the segment equation
but do not split the periodic curve into two true crossing-to-crossing lobes.

Therefore the only measurable topology is exactly one non-degenerate
self-intersection cluster.

## Branch construction

Let the accepted crossing lie on segment \(i\) at \(t\) and segment \(j\) at
\(u\). The detector inserts the interpolated crossing point

\[
x=p_i+t(p_{i+1}-p_i)=p_j+u(p_{j+1}-p_j)
\]

into both branch paths.

The first branch is the periodic path from \(x\) on segment \(i\), through
\(p_{i+1},p_{i+2},\ldots,p_j\), back to \(x\) on segment \(j\). The second branch
is the complementary periodic path from \(x\) on segment \(j\) back to \(x\) on
segment \(i\). Each branch is therefore a closed path whose first and last
coordinates are the inserted crossing point.

This is the key distinction from legacy phase-slice diagnostics: no artificial
closing chord is drawn between arbitrary phase endpoints. The branch boundary is
the actual polygon traversal from crossing to crossing. The shoelace closure adds
no synthetic chord because each measured branch starts and ends at the same
inserted crossing coordinate.

## Area definition

For a closed branch path \(q_0,\ldots,q_{m-1}\), with
\(q_k=(V_k,P_k)\), the signed area is

\[
A=\frac12\sum_{k=0}^{m-1}
\left(V_kP_{k+1\bmod m}-V_{k+1\bmod m}P_k\right).
\]

The unit is `mmHg * ml`. The reported unsigned area is \(|A|\). Opposed lobe
orientation requires nonzero areas with opposite sign:

\[
A_a A_v < 0.
\]

The implementation also applies a tiny scale-relative area floor before
accepting lobes. This is an anti-degeneracy guard, not physiology calibration.

## A-lobe selection

The detector first constructs the two geometric branches, then assigns the A
lobe by evidence. If any sample carries finite `laActivation01` and both
candidate branches have at least 95% activation-evidence coverage, the selected
A lobe is the branch with larger weighted activation burden:

\[
B=\frac{\sum_e w_e\frac{a_e^0+a_e^1}{2}}{\sum_e w_e},
\]

where \(a_e^0,a_e^1\) are endpoint activations clamped to \([0,1]\). Segment
weights use periodic `theta` advance when both endpoints provide finite theta and
the forward delta is usable; otherwise they use normalized PV arclength.

If activation evidence is absent or either branch has less than 95% weighted
activation coverage, the fallback evidence is weighted pumping phase fraction,
with `phase === "pumping"` treated as 1 and other phases as 0. An exact
evidence tie fails closed as `ambiguous-a-lobe-evidence`. The `maxActivation01`
field is retained as a readback, but current selection is by weighted burden
before max activation.

## Fail-closed cases

`measureLaPvTwoLobesV2` returns `status: "not-measurable"` and no lobe areas for:

- `insufficient-points`;
- `non-finite-point`;
- `no-self-intersection`;
- `degenerate-self-intersection`;
- `multiple-self-intersections`;
- `degenerate-lobes`;
- `ambiguous-a-lobe-evidence`.

In all non-measurable cases, `opposedLobeOrientation` is false. Crossing
summaries may still be returned as bounded diagnostics, with truncation marked by
`crossingSummaryTruncated`.

## Integration

`MechanisticAtrialOneFiberBench.ts` imports and re-exports
`measureLaPvTwoLobesV2`. Profile generation runs the detector on the full
periodic sample stream, then writes:

- true-lobe readbacks: `aLoopAreaMmHgMl`, `vLoopAreaMmHgMl`,
  `aLoopSignedAreaMmHgMl`, `vLoopSignedAreaMmHgMl`;
- topology readbacks: `lobeMeasurementStatus`, `lobeMeasurementReason`,
  `lobeSelfIntersectionCount`, `lobeRawSelfIntersectionCount`,
  `lobeSelfIntersectionAngleDeg`, `lobeSelfIntersectionSummaries`;
- legacy/true crossing agreement readbacks: `lobePhaseCrossingMatchDistance01`
  and `lobePhaseCrossingMatchPass`;
- orientation readback: `opposedLobeOrientation`.

When the detector is not measurable, true-lobe signed areas are reported as zero
for the profile readback. Legacy phase-slice areas remain separately named as
`legacyPhase*` fields.

`AtrialAVPlanePassiveBalanceBenchV2.ts` consumes these profile readbacks. Its
blood-volume topology gate requires the lobe detector to be measurable, opposed
true-lobe orientation to hold, the true-lobe crossing coordinate to match the
legacy phase-crossing coordinate within the configured normalized PV-coordinate
tolerance, minimum true-lobe area floors to pass, and other figure-eight
ordering diagnostics to pass. The threshold group is explicitly tagged in code
as `engineering-anti-degeneracy-diagnostic-not-clinical-cutoff`. Those floors
and angle/path thresholds are engineering guards against collapsed or ambiguous
topology, not clinical normal ranges.

## Legacy phase-slice areas

Legacy phase areas use phase-derived slices such as pumping-only points or
reservoir-plus-conduit points and then close those open paths with the shoelace
formula. That closure creates an artificial chord between phase endpoints. The
result can be useful for trend diagnostics, but it is not a true lobe area of a
self-intersecting PV curve unless the endpoints are the actual self-intersection
and the slice follows one complete crossing-to-crossing branch.

For this reason, `legacyPhaseALoopAreaMmHgMl`,
`legacyPhaseVLoopAreaMmHgMl`, and their signed/orientation companions should be
read as diagnostic-only historical comparators. They must not be used to claim
true opposed PV lobes.

## Evidence boundary

Current code facts establish the measurement contract above. They do not by
themselves establish that a candidate is normal, physiologic, or clinically
valid.

The PR463 normal reference remains a one-crossing figure-eight case under this
detector. The current passive-balance candidate must be re-evaluated by the same
detector and its generated report before making any final claim about lobe
quality. This note intentionally does not fabricate final passive-balance lobe
numbers.
