export type LaPvPointV2 = {
  readonly laVolumeMl: number;
  readonly laPressureMmHg: number;
};

export type LaPvLobePhaseV2 = "reservoir" | "conduit" | "pumping" | "transition";

export type LaPvLobePointV2 = LaPvPointV2 & {
  readonly theta?: number;
  readonly phase?: LaPvLobePhaseV2;
  readonly laActivation01?: number;
};

export type LaPvLobeMeasurementStatusV2 = "measurable" | "not-measurable";

export type LaPvLobeSelectionEvidenceSourceV2 =
  | "activation-burden"
  | "pumping-fraction";

export type LaPvLobeMeasurementReasonV2 =
  | "measurable"
  | "insufficient-points"
  | "non-finite-point"
  | "no-self-intersection"
  | "degenerate-self-intersection"
  | "multiple-self-intersections"
  | "degenerate-lobes"
  | "ambiguous-a-lobe-evidence";

export type LaPvSelfIntersectionSummaryV2 = {
  readonly volumeMl: number;
  readonly pressureMmHg: number;
  readonly angleDeg: number;
  readonly firstPathProgress01: number;
  readonly secondPathProgress01: number;
  readonly rawIntersectionCount: number;
};

export type LaPvMeasuredLobeV2 = {
  readonly signedAreaMmHgMl: number;
  readonly areaMmHgMl: number;
  readonly startPathProgress01: number;
  readonly endPathProgress01: number;
  readonly maxActivation01: number;
  readonly activationCoverage01: number;
  readonly activationBurden01: number;
  readonly pumpingFraction01: number;
  readonly pumpingPointFraction: number;
  readonly selectionEvidence01: number;
  readonly path: readonly LaPvPointV2[];
};

export type LaPvLobeMeasurementV2 =
  | {
    readonly status: "measurable";
    readonly reason: "measurable";
    readonly selfIntersectionCount: 1;
    readonly rawSelfIntersectionCount: number;
    readonly crossingSummaryTruncated: boolean;
    readonly crossings: readonly LaPvSelfIntersectionSummaryV2[];
    readonly crossing: LaPvSelfIntersectionSummaryV2;
    readonly selectionEvidenceSource: LaPvLobeSelectionEvidenceSourceV2;
    readonly activationEvidenceCoverage01: number;
    readonly aLobe: LaPvMeasuredLobeV2;
    readonly vLobe: LaPvMeasuredLobeV2;
    readonly opposedLobeOrientation: boolean;
  }
  | {
    readonly status: "not-measurable";
    readonly reason: Exclude<LaPvLobeMeasurementReasonV2, "measurable">;
    readonly selfIntersectionCount: number;
    readonly rawSelfIntersectionCount: number;
    readonly crossingSummaryTruncated: boolean;
    readonly crossings: readonly LaPvSelfIntersectionSummaryV2[];
    readonly crossing?: LaPvSelfIntersectionSummaryV2;
    readonly opposedLobeOrientation: false;
  };

type LobeSelfIntersectionV2 = {
  readonly segmentAIndex: number;
  readonly segmentBIndex: number;
  readonly t: number;
  readonly u: number;
  readonly volumeMl: number;
  readonly pressureMmHg: number;
  readonly angleDeg: number;
  readonly firstPathProgress01: number;
  readonly secondPathProgress01: number;
};

type LobeSelfIntersectionClusterV2 = {
  readonly intersections: readonly LobeSelfIntersectionV2[];
  readonly representative: LobeSelfIntersectionV2;
};

type SegmentIntersectionResultV2 =
  | { readonly kind: "none" }
  | { readonly kind: "degenerate" }
  | {
    readonly kind: "proper";
    readonly t: number;
    readonly u: number;
    readonly angleDeg: number;
  };

type NormalizedSegmentV2 = {
  readonly index: number;
  readonly a: LaPvLobePointV2;
  readonly b: LaPvLobePointV2;
  readonly ax: number;
  readonly ay: number;
  readonly bx: number;
  readonly by: number;
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
  readonly length: number;
};

const INTERSECTION_EPSILON = 1e-9;
const CLUSTER_EPSILON = 1e-7;
const MAX_CROSSING_SUMMARIES = 16;
const SUFFICIENT_ACTIVATION_COVERAGE_01 = 0.95;

export function measureLaPvTwoLobesV2(
  inputPoints: readonly LaPvLobePointV2[],
): LaPvLobeMeasurementV2 {
  if (!inputPoints.every(isFiniteLaPvPoint)) {
    return nonMeasurableLaPvLobes("non-finite-point", [], false);
  }
  const points = compactPeriodicLobePoints(inputPoints);
  if (points.length < 4) return nonMeasurableLaPvLobes("insufficient-points", [], false);

  const volumeScale = Math.max(
    maxOf(points.map((point) => point.laVolumeMl)) -
      minOf(points.map((point) => point.laVolumeMl)),
    1e-9,
  );
  const pressureScale = Math.max(
    maxOf(points.map((point) => point.laPressureMmHg)) -
      minOf(points.map((point) => point.laPressureMmHg)),
    1e-9,
  );
  const progress = periodicArcProgress(points, volumeScale, pressureScale);
  const segments = normalizedSegments(points, volumeScale, pressureScale);
  const rawIntersections: LobeSelfIntersectionV2[] = [];
  let sawDegenerateIntersection = false;

  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      if (periodicSegmentsAdjacent(i, j, segments.length)) continue;
      const first = segments[i]!;
      const second = segments[j]!;
      if (!segmentBoxesOverlap(first, second)) continue;
      const intersection = properSegmentIntersectionV2(first, second);
      if (intersection.kind === "none") continue;
      if (intersection.kind === "degenerate") {
        sawDegenerateIntersection = true;
        continue;
      }
      rawIntersections.push({
        segmentAIndex: i,
        segmentBIndex: j,
        t: intersection.t,
        u: intersection.u,
        volumeMl: first.a.laVolumeMl +
          intersection.t * (first.b.laVolumeMl - first.a.laVolumeMl),
        pressureMmHg: first.a.laPressureMmHg +
          intersection.t * (first.b.laPressureMmHg - first.a.laPressureMmHg),
        angleDeg: intersection.angleDeg,
        firstPathProgress01: progressAtPeriodicSegment(progress, i, intersection.t),
        secondPathProgress01: progressAtPeriodicSegment(progress, j, intersection.u),
      });
    }
  }

  const allClusters = clusterSelfIntersections(rawIntersections, volumeScale, pressureScale);
  const topology = classifyTopologicalClusters(allClusters, segments);
  const clusters = topology.topologicalClusters;
  const summary = crossingSummaries(clusters);
  if (sawDegenerateIntersection || topology.rejectedClusterCount > 0) {
    return nonMeasurableLaPvLobes("degenerate-self-intersection", allClusters, false);
  }
  if (clusters.length === 0) {
    return nonMeasurableLaPvLobes("no-self-intersection", clusters, summary.truncated);
  }
  if (clusters.length > 1) {
    return nonMeasurableLaPvLobes("multiple-self-intersections", clusters, summary.truncated);
  }

  const crossing = clusters[0]!.representative;
  const hasActivationEvidence = points.some((point) => Number.isFinite(point.laActivation01));
  const firstBranch = measuredLobeBranch(
    points,
    crossing.segmentAIndex,
    crossing.t,
    crossing.segmentBIndex,
    crossing.u,
    crossing.firstPathProgress01,
    crossing.secondPathProgress01,
    volumeScale,
    pressureScale,
  );
  const secondBranch = measuredLobeBranch(
    points,
    crossing.segmentBIndex,
    crossing.u,
    crossing.segmentAIndex,
    crossing.t,
    crossing.secondPathProgress01,
    crossing.firstPathProgress01,
    volumeScale,
    pressureScale,
  );
  const activationEvidenceCoverage01 = Math.min(
    firstBranch.activationCoverage01,
    secondBranch.activationCoverage01,
  );
  const selectionEvidenceSource: LaPvLobeSelectionEvidenceSourceV2 =
    hasActivationEvidence && activationEvidenceCoverage01 >= SUFFICIENT_ACTIVATION_COVERAGE_01
      ? "activation-burden"
      : "pumping-fraction";
  const firstMeasuredBranch = withSelectionEvidence(firstBranch, selectionEvidenceSource);
  const secondMeasuredBranch = withSelectionEvidence(secondBranch, selectionEvidenceSource);
  const minimumArea = 1e-8 * volumeScale * pressureScale;
  if (firstMeasuredBranch.path.length < 4 || secondMeasuredBranch.path.length < 4 ||
    firstMeasuredBranch.areaMmHgMl <= minimumArea ||
    secondMeasuredBranch.areaMmHgMl <= minimumArea) {
    return nonMeasurableLaPvLobes("degenerate-lobes", clusters, summary.truncated);
  }
  const evidenceComparison = compareLobeEvidence(
    firstMeasuredBranch,
    secondMeasuredBranch,
    selectionEvidenceSource,
  );
  if (evidenceComparison === 0) {
    return nonMeasurableLaPvLobes("ambiguous-a-lobe-evidence", clusters, summary.truncated);
  }
  const aLobe = evidenceComparison > 0 ? firstMeasuredBranch : secondMeasuredBranch;
  const vLobe = evidenceComparison > 0 ? secondMeasuredBranch : firstMeasuredBranch;
  return {
    status: "measurable",
    reason: "measurable",
    selfIntersectionCount: 1,
    rawSelfIntersectionCount: rawIntersections.length,
    crossingSummaryTruncated: summary.truncated,
    crossings: summary.items,
    crossing: summary.items[0]!,
    selectionEvidenceSource,
    activationEvidenceCoverage01,
    aLobe,
    vLobe,
    opposedLobeOrientation: opposedLobeAreasPassV2(
      aLobe.signedAreaMmHgMl,
      vLobe.signedAreaMmHgMl,
    ),
  };
}

function measuredLobeBranch(
  points: readonly LaPvLobePointV2[],
  fromSegmentIndex: number,
  fromAlpha: number,
  toSegmentIndex: number,
  toAlpha: number,
  startProgress01: number,
  endProgress01: number,
  volumeScale: number,
  pressureScale: number,
): LaPvMeasuredLobeV2 {
  const path: LaPvLobePointV2[] = [
    interpolateLobePoint(
      points[fromSegmentIndex]!,
      points[(fromSegmentIndex + 1) % points.length]!,
      fromAlpha,
    ),
  ];
  let cursor = (fromSegmentIndex + 1) % points.length;
  for (let guard = 0; guard <= points.length; guard += 1) {
    path.push(points[cursor]!);
    if (cursor === toSegmentIndex) break;
    cursor = (cursor + 1) % points.length;
  }
  path.push(interpolateLobePoint(
    points[toSegmentIndex]!,
    points[(toSegmentIndex + 1) % points.length]!,
    toAlpha,
  ));
  const signedAreaMmHgMl = signedLaPvLoopAreaV2(path);
  const evidencePath = path.slice(1, -1);
  const maxActivation01 = maxOf(evidencePath.map((point) =>
    Number.isFinite(point.laActivation01) ? clamp01(point.laActivation01!) : 0
  ));
  const burdens = weightedEvidenceBurden(path, volumeScale, pressureScale);
  return {
    signedAreaMmHgMl,
    areaMmHgMl: Math.abs(signedAreaMmHgMl),
    startPathProgress01: startProgress01,
    endPathProgress01: endProgress01,
    maxActivation01,
    activationCoverage01: burdens.activationCoverage01,
    activationBurden01: burdens.activationBurden01,
    pumpingFraction01: burdens.pumpingFraction01,
    pumpingPointFraction: burdens.pumpingFraction01,
    selectionEvidence01: 0,
    path: path.map(({ laVolumeMl, laPressureMmHg }) => ({ laVolumeMl, laPressureMmHg })),
  };
}

function weightedEvidenceBurden(
  path: readonly LaPvLobePointV2[],
  volumeScale: number,
  pressureScale: number,
): {
  readonly activationCoverage01: number;
  readonly activationBurden01: number;
  readonly pumpingFraction01: number;
} {
  let totalWeight = 0;
  let activationCoveredWeight = 0;
  let activationIntegral = 0;
  let pumpingIntegral = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    const a = path[i]!;
    const b = path[i + 1]!;
    const weight = evidenceSegmentWeight(a, b, volumeScale, pressureScale);
    if (weight <= 1e-12) continue;
    totalWeight += weight;
    if (Number.isFinite(a.laActivation01) && Number.isFinite(b.laActivation01)) {
      activationCoveredWeight += weight;
      activationIntegral += 0.5 * (activation01(a) + activation01(b)) * weight;
    }
    pumpingIntegral += 0.5 * (pumping01(a) + pumping01(b)) * weight;
  }
  return {
    activationCoverage01: totalWeight > 0 ? activationCoveredWeight / totalWeight : 0,
    activationBurden01: activationCoveredWeight > 0
      ? activationIntegral / activationCoveredWeight
      : 0,
    pumpingFraction01: totalWeight > 0 ? pumpingIntegral / totalWeight : 0,
  };
}

function evidenceSegmentWeight(
  a: LaPvLobePointV2,
  b: LaPvLobePointV2,
  volumeScale: number,
  pressureScale: number,
): number {
  if (Number.isFinite(a.theta) && Number.isFinite(b.theta)) {
    const deltaTheta = positiveModulo(b.theta! - a.theta!, 1);
    if (deltaTheta > 1e-12 && deltaTheta <= 0.75) return deltaTheta;
  }
  return Math.hypot(
    (b.laVolumeMl - a.laVolumeMl) / volumeScale,
    (b.laPressureMmHg - a.laPressureMmHg) / pressureScale,
  );
}

function compareLobeEvidence(
  first: LaPvMeasuredLobeV2,
  second: LaPvMeasuredLobeV2,
  evidenceSource: LaPvLobeSelectionEvidenceSourceV2,
): number {
  if (evidenceSource === "activation-burden") {
    const activationDelta = first.activationBurden01 - second.activationBurden01;
    if (Math.abs(activationDelta) > 1e-9) return activationDelta;
  }
  const pumpingDelta = first.pumpingFraction01 - second.pumpingFraction01;
  return Math.abs(pumpingDelta) > 1e-9 ? pumpingDelta : 0;
}

function withSelectionEvidence(
  lobe: LaPvMeasuredLobeV2,
  evidenceSource: LaPvLobeSelectionEvidenceSourceV2,
): LaPvMeasuredLobeV2 {
  return {
    ...lobe,
    selectionEvidence01: evidenceSource === "activation-burden"
      ? lobe.activationBurden01
      : lobe.pumpingFraction01,
  };
}

function compactPeriodicLobePoints(
  inputPoints: readonly LaPvLobePointV2[],
): readonly LaPvLobePointV2[] {
  const compact: LaPvLobePointV2[] = [];
  for (const point of inputPoints) {
    const previous = compact.at(-1);
    if (previous && sameLaPvPoint(previous, point)) continue;
    compact.push(point);
  }
  if (compact.length > 1 && sameLaPvPoint(compact[0]!, compact.at(-1)!)) {
    compact.pop();
  }
  return compact;
}

function normalizedSegments(
  points: readonly LaPvLobePointV2[],
  volumeScale: number,
  pressureScale: number,
): readonly NormalizedSegmentV2[] {
  return points.map((point, index) => {
    const next = points[(index + 1) % points.length]!;
    const ax = point.laVolumeMl / volumeScale;
    const ay = point.laPressureMmHg / pressureScale;
    const bx = next.laVolumeMl / volumeScale;
    const by = next.laPressureMmHg / pressureScale;
    return {
      index,
      a: point,
      b: next,
      ax,
      ay,
      bx,
      by,
      minX: Math.min(ax, bx),
      maxX: Math.max(ax, bx),
      minY: Math.min(ay, by),
      maxY: Math.max(ay, by),
      length: Math.hypot(bx - ax, by - ay),
    };
  });
}

function properSegmentIntersectionV2(
  first: NormalizedSegmentV2,
  second: NormalizedSegmentV2,
): SegmentIntersectionResultV2 {
  if (first.length <= INTERSECTION_EPSILON || second.length <= INTERSECTION_EPSILON) {
    return { kind: "degenerate" };
  }
  const rx = first.bx - first.ax;
  const ry = first.by - first.ay;
  const sx = second.bx - second.ax;
  const sy = second.by - second.ay;
  const denominator = cross2d(rx, ry, sx, sy);
  const qpx = second.ax - first.ax;
  const qpy = second.ay - first.ay;
  if (Math.abs(denominator) <= INTERSECTION_EPSILON) {
    if (Math.abs(cross2d(qpx, qpy, rx, ry)) <= INTERSECTION_EPSILON &&
      colinearSegmentsOverlap(first, second)) {
      return { kind: "degenerate" };
    }
    if (segmentsTouchAtEndpoint(first, second)) return { kind: "degenerate" };
    return { kind: "none" };
  }
  const t = cross2d(qpx, qpy, sx, sy) / denominator;
  const u = cross2d(qpx, qpy, rx, ry) / denominator;
  if (
    t >= -INTERSECTION_EPSILON && t <= 1 + INTERSECTION_EPSILON &&
    u >= -INTERSECTION_EPSILON && u <= 1 + INTERSECTION_EPSILON
  ) {
    const cosine = Math.min(1, Math.max(-1, Math.abs((rx * sx + ry * sy) /
      Math.max(first.length * second.length, 1e-12))));
    return {
      kind: "proper",
      t: clamp01(t),
      u: clamp01(u),
      angleDeg: Math.acos(cosine) * 180 / Math.PI,
    };
  }
  return { kind: "none" };
}

function clusterSelfIntersections(
  intersections: readonly LobeSelfIntersectionV2[],
  volumeScale: number,
  pressureScale: number,
): readonly LobeSelfIntersectionClusterV2[] {
  const clusters: LobeSelfIntersectionClusterV2[] = [];
  for (const intersection of intersections) {
    const matchingIndex = clusters.findIndex((cluster) =>
      sameIntersectionCoordinate(
        cluster.representative,
        intersection,
        volumeScale,
        pressureScale,
      )
    );
    if (matchingIndex < 0) {
      clusters.push({ intersections: [intersection], representative: intersection });
      continue;
    }
    const current = clusters[matchingIndex]!;
    const nextIntersections = [...current.intersections, intersection];
    clusters[matchingIndex] = {
      intersections: nextIntersections,
      representative: selectIntersectionRepresentative(nextIntersections),
    };
  }
  return clusters.sort((a, b) =>
    a.representative.firstPathProgress01 - b.representative.firstPathProgress01
  );
}

function classifyTopologicalClusters(
  clusters: readonly LobeSelfIntersectionClusterV2[],
  segments: readonly NormalizedSegmentV2[],
): {
  readonly topologicalClusters: readonly LobeSelfIntersectionClusterV2[];
  readonly rejectedClusterCount: number;
} {
  const topologicalClusters = clusters.filter((cluster) =>
    cluster.intersections.some((intersection) =>
      intersectionHasSideAlternation(intersection, segments)
    )
  );
  return {
    topologicalClusters,
    rejectedClusterCount: clusters.length - topologicalClusters.length,
  };
}

function intersectionHasSideAlternation(
  intersection: LobeSelfIntersectionV2,
  segments: readonly NormalizedSegmentV2[],
): boolean {
  const first = incidentArms(
    segments,
    intersection.segmentAIndex,
    intersection.t,
    "first",
  );
  const second = incidentArms(
    segments,
    intersection.segmentBIndex,
    intersection.u,
    "second",
  );
  if (first.length !== 2 || second.length !== 2) return false;
  const arms = [...first, ...second]
    .filter((arm) => Math.hypot(arm.x, arm.y) > INTERSECTION_EPSILON)
    .map((arm) => ({
      branch: arm.branch,
      angle: Math.atan2(arm.y, arm.x),
    }))
    .sort((a, b) => a.angle - b.angle);
  if (arms.length !== 4) return false;
  for (let i = 0; i < arms.length; i += 1) {
    const current = arms[i]!;
    const next = arms[(i + 1) % arms.length]!;
    const gap = positiveModulo(next.angle - current.angle, 2 * Math.PI);
    if (gap <= 1e-7) return false;
    if (current.branch === next.branch) return false;
  }
  return true;
}

function incidentArms(
  segments: readonly NormalizedSegmentV2[],
  segmentIndex: number,
  alpha: number,
  branch: "first" | "second",
): readonly { readonly branch: "first" | "second"; readonly x: number; readonly y: number }[] {
  const segment = segments[segmentIndex]!;
  const x = segment.ax + alpha * (segment.bx - segment.ax);
  const y = segment.ay + alpha * (segment.by - segment.ay);
  if (alpha <= INTERSECTION_EPSILON) {
    const previous = segments[(segmentIndex - 1 + segments.length) % segments.length]!;
    return [
      { branch, x: previous.ax - x, y: previous.ay - y },
      { branch, x: segment.bx - x, y: segment.by - y },
    ];
  }
  if (alpha >= 1 - INTERSECTION_EPSILON) {
    const next = segments[(segmentIndex + 1) % segments.length]!;
    return [
      { branch, x: segment.ax - x, y: segment.ay - y },
      { branch, x: next.bx - x, y: next.by - y },
    ];
  }
  return [
    { branch, x: segment.ax - x, y: segment.ay - y },
    { branch, x: segment.bx - x, y: segment.by - y },
  ];
}

function selectIntersectionRepresentative(
  intersections: readonly LobeSelfIntersectionV2[],
): LobeSelfIntersectionV2 {
  return [...intersections].sort((a, b) => {
    const angleDelta = b.angleDeg - a.angleDeg;
    if (Math.abs(angleDelta) > 1e-9) return angleDelta;
    return pathProgressSeparation(b) - pathProgressSeparation(a);
  })[0]!;
}

function crossingSummaries(
  clusters: readonly LobeSelfIntersectionClusterV2[],
): {
  readonly items: readonly LaPvSelfIntersectionSummaryV2[];
  readonly truncated: boolean;
} {
  return {
    items: clusters.slice(0, MAX_CROSSING_SUMMARIES).map((cluster) => ({
      volumeMl: cluster.representative.volumeMl,
      pressureMmHg: cluster.representative.pressureMmHg,
      angleDeg: cluster.representative.angleDeg,
      firstPathProgress01: cluster.representative.firstPathProgress01,
      secondPathProgress01: cluster.representative.secondPathProgress01,
      rawIntersectionCount: cluster.intersections.length,
    })),
    truncated: clusters.length > MAX_CROSSING_SUMMARIES,
  };
}

function nonMeasurableLaPvLobes(
  reason: Exclude<LaPvLobeMeasurementReasonV2, "measurable">,
  clusters: readonly LobeSelfIntersectionClusterV2[],
  crossingSummaryTruncated: boolean,
): LaPvLobeMeasurementV2 {
  const summaries = crossingSummaries(clusters);
  return {
    status: "not-measurable",
    reason,
    selfIntersectionCount: clusters.length,
    rawSelfIntersectionCount: clusters.reduce(
      (sum, cluster) => sum + cluster.intersections.length,
      0,
    ),
    crossingSummaryTruncated: crossingSummaryTruncated || summaries.truncated,
    crossings: summaries.items,
    ...(summaries.items[0] ? { crossing: summaries.items[0] } : {}),
    opposedLobeOrientation: false,
  };
}

function periodicArcProgress(
  points: readonly LaPvPointV2[],
  volumeScale: number,
  pressureScale: number,
): readonly number[] {
  const cumulative = [0];
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]!;
    const b = points[(i + 1) % points.length]!;
    cumulative.push(cumulative[i]! + Math.hypot(
      (b.laVolumeMl - a.laVolumeMl) / volumeScale,
      (b.laPressureMmHg - a.laPressureMmHg) / pressureScale,
    ));
  }
  const total = Math.max(cumulative.at(-1)!, 1e-12);
  return cumulative.map((value) => value / total);
}

function progressAtPeriodicSegment(
  progress: readonly number[],
  segmentIndex: number,
  alpha: number,
): number {
  return progress[segmentIndex]! +
    alpha * (progress[segmentIndex + 1]! - progress[segmentIndex]!);
}

function interpolateLobePoint(
  a: LaPvLobePointV2,
  b: LaPvLobePointV2,
  alpha: number,
): LaPvLobePointV2 {
  const interpolated: LaPvLobePointV2 = {
    laVolumeMl: a.laVolumeMl + alpha * (b.laVolumeMl - a.laVolumeMl),
    laPressureMmHg: a.laPressureMmHg + alpha * (b.laPressureMmHg - a.laPressureMmHg),
  };
  return {
    ...interpolated,
    ...(Number.isFinite(a.theta) && Number.isFinite(b.theta)
      ? { theta: interpolatePeriodicTheta(a.theta!, b.theta!, alpha) }
      : {}),
    ...(Number.isFinite(a.laActivation01) && Number.isFinite(b.laActivation01)
      ? { laActivation01: a.laActivation01! + alpha * (b.laActivation01! - a.laActivation01!) }
      : {}),
    ...(a.phase || b.phase ? { phase: alpha < 0.5 ? a.phase : b.phase } : {}),
  };
}

export function signedLaPvLoopAreaV2(samples: readonly LaPvPointV2[]): number {
  if (samples.length < 3) return 0;
  let twiceArea = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const a = samples[i]!;
    const b = samples[(i + 1) % samples.length]!;
    twiceArea += a.laVolumeMl * b.laPressureMmHg - b.laVolumeMl * a.laPressureMmHg;
  }
  return 0.5 * twiceArea;
}

export function opposedLobeAreasPassV2(
  aSignedAreaMmHgMl: number,
  vSignedAreaMmHgMl: number,
  minimumAAreaMmHgMl = 0,
  minimumVAreaMmHgMl = 0,
): boolean {
  return Math.abs(aSignedAreaMmHgMl) >= minimumAAreaMmHgMl &&
    Math.abs(vSignedAreaMmHgMl) >= minimumVAreaMmHgMl &&
    aSignedAreaMmHgMl * vSignedAreaMmHgMl < 0;
}

function segmentBoxesOverlap(first: NormalizedSegmentV2, second: NormalizedSegmentV2): boolean {
  return first.maxX + INTERSECTION_EPSILON >= second.minX &&
    second.maxX + INTERSECTION_EPSILON >= first.minX &&
    first.maxY + INTERSECTION_EPSILON >= second.minY &&
    second.maxY + INTERSECTION_EPSILON >= first.minY;
}

function colinearSegmentsOverlap(first: NormalizedSegmentV2, second: NormalizedSegmentV2): boolean {
  const useX = Math.abs(first.bx - first.ax) >= Math.abs(first.by - first.ay);
  const a0 = useX ? first.ax : first.ay;
  const a1 = useX ? first.bx : first.by;
  const c0 = useX ? second.ax : second.ay;
  const c1 = useX ? second.bx : second.by;
  const left = Math.max(Math.min(a0, a1), Math.min(c0, c1));
  const right = Math.min(Math.max(a0, a1), Math.max(c0, c1));
  return right - left > INTERSECTION_EPSILON;
}

function segmentsTouchAtEndpoint(first: NormalizedSegmentV2, second: NormalizedSegmentV2): boolean {
  return sameNormalizedPoint(first.ax, first.ay, second.ax, second.ay) ||
    sameNormalizedPoint(first.ax, first.ay, second.bx, second.by) ||
    sameNormalizedPoint(first.bx, first.by, second.ax, second.ay) ||
    sameNormalizedPoint(first.bx, first.by, second.bx, second.by);
}

function sameIntersectionCoordinate(
  a: LobeSelfIntersectionV2,
  b: LobeSelfIntersectionV2,
  volumeScale: number,
  pressureScale: number,
): boolean {
  return Math.abs(a.volumeMl - b.volumeMl) / volumeScale <= CLUSTER_EPSILON &&
    Math.abs(a.pressureMmHg - b.pressureMmHg) / pressureScale <= CLUSTER_EPSILON;
}

function pathProgressSeparation(intersection: LobeSelfIntersectionV2): number {
  const delta = Math.abs(intersection.firstPathProgress01 - intersection.secondPathProgress01);
  return Math.min(delta, 1 - delta);
}

function periodicSegmentsAdjacent(a: number, b: number, segmentCount: number): boolean {
  return a === b || (a + 1) % segmentCount === b || (b + 1) % segmentCount === a;
}

function sameLaPvPoint(a: LaPvPointV2, b: LaPvPointV2): boolean {
  return Math.abs(a.laVolumeMl - b.laVolumeMl) <= INTERSECTION_EPSILON &&
    Math.abs(a.laPressureMmHg - b.laPressureMmHg) <= INTERSECTION_EPSILON;
}

function isFiniteLaPvPoint(point: LaPvPointV2): boolean {
  return Number.isFinite(point.laVolumeMl) && Number.isFinite(point.laPressureMmHg);
}

function activation01(point: LaPvLobePointV2): number {
  return Number.isFinite(point.laActivation01) ? clamp01(point.laActivation01!) : 0;
}

function pumping01(point: LaPvLobePointV2): number {
  return point.phase === "pumping" ? 1 : 0;
}

function interpolatePeriodicTheta(a: number, b: number, alpha: number): number {
  let delta = b - a;
  if (delta > 0.5) delta -= 1;
  if (delta < -0.5) delta += 1;
  return positiveModulo(a + alpha * delta, 1);
}

function sameNormalizedPoint(ax: number, ay: number, bx: number, by: number): boolean {
  return Math.abs(ax - bx) <= INTERSECTION_EPSILON &&
    Math.abs(ay - by) <= INTERSECTION_EPSILON;
}

function cross2d(ax: number, ay: number, bx: number, by: number): number {
  return ax * by - ay * bx;
}

function minOf(values: readonly number[]): number {
  return values.length ? Math.min(...values) : 0;
}

function maxOf(values: readonly number[]): number {
  return values.length ? Math.max(...values) : 0;
}

function positiveModulo(value: number, period: number): number {
  return ((value % period) + period) % period;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
