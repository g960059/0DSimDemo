import {
  runAtrialFigureEightQualityAuditBenchV1,
} from "@/engine/mechanics2/benches/AtrialFigureEightQualityAuditBench";
import type { AtrialFiberChamberIdV1 } from "@/engine/mechanics2/atrial/AtrialFiberPackV1";
import type { FourChamberSubsystemProfileIdV1 } from "@/engine/mechanics2/subsystems/FourChamberSubsystemV1";

export const ATRIAL_LOBE_FAILURE_ATTRIBUTION_REPORT_ID_V1 =
  "atrial-lobe-failure-attribution-report-v1" as const;

type PressureSourceV1 = "current-source-pressure" | "atrial-fiber-pressure";
type DominantFailureClassV1 =
  | "pass"
  | "missing-self-intersection"
  | "same-signed-lobes"
  | "small-a-loop"
  | "small-v-loop"
  | "volume-order-fail"
  | "pressure-pulse-low";

type RowV1 = {
  readonly profileId: FourChamberSubsystemProfileIdV1;
  readonly chamberId: AtrialFiberChamberIdV1;
  readonly pressureSource: PressureSourceV1;
  readonly sourcePointId: string;
  readonly lobeQualityPass: boolean;
  readonly basicFigureEightPass: boolean;
  readonly dominantFailureClass: DominantFailureClassV1;
  readonly failureReasons: readonly string[];
  readonly selfIntersections: number;
  readonly opposedSignedLobes: boolean;
  readonly aLoopAreaMmHgMl: number;
  readonly vLoopAreaMmHgMl: number;
  readonly aOverVLoopRatio: number;
  readonly signedALoopAreaMmHgMl: number;
  readonly signedVLoopAreaMmHgMl: number;
  readonly vMeanVolumeMinusAMeanVolumeMl: number;
  readonly aMeanVolumeMl: number;
  readonly vMeanVolumeMl: number;
  readonly aMeanPressureMmHg: number;
  readonly vMeanPressureMmHg: number;
  readonly aVolumeRangeMl: number;
  readonly vVolumeRangeMl: number;
  readonly aPressureRangeMmHg: number;
  readonly vPressureRangeMmHg: number;
  readonly pressurePulseMmHg: number;
};

type ChamberSourceSummaryV1 = {
  readonly chamberId: AtrialFiberChamberIdV1;
  readonly pressureSource: PressureSourceV1;
  readonly total: number;
  readonly lobeQualityPass: number;
  readonly basicFigureEightPass: number;
  readonly opposedLobes: number;
  readonly meanVolumeSeparationMl: number;
  readonly meanAOverVLoopRatio: number;
  readonly dominantFailureCounts: Record<DominantFailureClassV1, number>;
};

export type AtrialLobeFailureAttributionReportV1 = {
  readonly reportId: typeof ATRIAL_LOBE_FAILURE_ATTRIBUTION_REPORT_ID_V1;
  readonly gateId: "atrialLobeFailureAttributionV1";
  readonly attributionMode:
    "warm-replay-closed-loop-phase-lobe-attribution-no-runtime-no-av-plane";
  readonly upstreamAuditReportId: "atrial-figure-eight-quality-audit-report-v1";
  readonly rows: readonly RowV1[];
  readonly summaries: readonly ChamberSourceSummaryV1[];
  readonly summary: {
    readonly totalRows: 28;
    readonly totalLobeQualityPass: number;
    readonly totalBasicFigureEightPass: number;
    readonly laFiberLobeQualityPass: number;
    readonly raFiberLobeQualityPass: number;
    readonly currentPressureLobeQualityPass: number;
    readonly dominantFailureCounts: Record<DominantFailureClassV1, number>;
  };
  readonly decision: {
    readonly atrialLobeFailureAttributionStatus:
      | "atrial-lobe-failure-attribution-signal"
      | "atrial-lobe-failure-attribution-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly pressureSubstitution: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneEnablement: false;
    readonly aPrimePhysiologyClaim: false;
    readonly LandAtrialUnlock: false;
  };
};

const FAILURE_CLASSES: readonly DominantFailureClassV1[] = [
  "pass",
  "missing-self-intersection",
  "same-signed-lobes",
  "small-a-loop",
  "small-v-loop",
  "volume-order-fail",
  "pressure-pulse-low",
];

export function runAtrialLobeFailureAttributionBenchV1():
AtrialLobeFailureAttributionReportV1 {
  const audit = runAtrialFigureEightQualityAuditBenchV1();
  const rows = audit.rows.flatMap((row) => [
    attributionRow(row.profileId, row.chamberId, row.sourcePointId, row.currentPv),
    attributionRow(row.profileId, row.chamberId, row.sourcePointId, row.fiberPv),
  ]);
  const summaries = (["LA", "RA"] as const).flatMap((chamberId) =>
    (["current-source-pressure", "atrial-fiber-pressure"] as const).map((pressureSource) =>
      summarize(chamberId, pressureSource, rows.filter((row) =>
        row.chamberId === chamberId && row.pressureSource === pressureSource
      ))
    )
  );
  const dominantFailureCounts = countDominantFailures(rows);
  const laFiberLobeQualityPass = rows.filter((row) =>
    row.chamberId === "LA"
    && row.pressureSource === "atrial-fiber-pressure"
    && row.lobeQualityPass
  ).length;
  const raFiberLobeQualityPass = rows.filter((row) =>
    row.chamberId === "RA"
    && row.pressureSource === "atrial-fiber-pressure"
    && row.lobeQualityPass
  ).length;
  const totalLobeQualityPass = rows.filter((row) => row.lobeQualityPass).length;
  const status = totalLobeQualityPass === rows.length
    ? "atrial-lobe-failure-attribution-signal"
    : "atrial-lobe-failure-attribution-blocked";
  return {
    reportId: ATRIAL_LOBE_FAILURE_ATTRIBUTION_REPORT_ID_V1,
    gateId: "atrialLobeFailureAttributionV1",
    attributionMode: "warm-replay-closed-loop-phase-lobe-attribution-no-runtime-no-av-plane",
    upstreamAuditReportId: audit.reportId,
    rows,
    summaries,
    summary: {
      totalRows: 28,
      totalLobeQualityPass,
      totalBasicFigureEightPass: rows.filter((row) => row.basicFigureEightPass).length,
      laFiberLobeQualityPass,
      raFiberLobeQualityPass,
      currentPressureLobeQualityPass: rows.filter((row) =>
        row.pressureSource === "current-source-pressure" && row.lobeQualityPass
      ).length,
      dominantFailureCounts,
    },
    decision: {
      atrialLobeFailureAttributionStatus: status,
      nextAction: status === "atrial-lobe-failure-attribution-signal"
        ? "Treat as audit signal only; runtime and physiology claims remain blocked."
        : "Design a broader atrial lobe generator with separated reservoir and booster state ownership; do not tune pressure parity, scalar suction, or AV-plane gain as a promotion path.",
      blockedClaims: [
        "runtime-wiring",
        "atrial-pressure-substitution",
        "morphology-acceptance",
        "AV-plane-enable",
        "a-prime-physiology",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      pressureSubstitution: false,
      morphologyAcceptance: false,
      AVPlaneEnablement: false,
      aPrimePhysiologyClaim: false,
      LandAtrialUnlock: false,
    },
  };
}

function attributionRow(
  profileId: FourChamberSubsystemProfileIdV1,
  chamberId: AtrialFiberChamberIdV1,
  sourcePointId: string,
  quality: ReturnType<typeof runAtrialFigureEightQualityAuditBenchV1>["rows"][number]["currentPv"],
): RowV1 {
  return {
    profileId,
    chamberId,
    sourcePointId,
    pressureSource: quality.pressureSource,
    lobeQualityPass: quality.lobeQualityPass,
    basicFigureEightPass: quality.basicFigureEightPass,
    dominantFailureClass: dominantFailureClass(quality),
    failureReasons: quality.failureReasons,
    selfIntersections: quality.selfIntersections,
    opposedSignedLobes: quality.opposedSignedLobes,
    aLoopAreaMmHgMl: quality.aLoopAreaProxyMmHgMl,
    vLoopAreaMmHgMl: quality.vLoopAreaProxyMmHgMl,
    aOverVLoopRatio: quality.aOverVLoopRatio,
    signedALoopAreaMmHgMl: quality.signedALoopAreaMmHgMl,
    signedVLoopAreaMmHgMl: quality.signedVLoopAreaMmHgMl,
    vMeanVolumeMinusAMeanVolumeMl: quality.vMeanVolumeMinusAMeanVolumeMl,
    aMeanVolumeMl: quality.aMeanVolumeMl,
    vMeanVolumeMl: quality.vMeanVolumeMl,
    aMeanPressureMmHg: quality.aMeanPressureMmHg,
    vMeanPressureMmHg: quality.vMeanPressureMmHg,
    aVolumeRangeMl: quality.aVolumeRangeMl,
    vVolumeRangeMl: quality.vVolumeRangeMl,
    aPressureRangeMmHg: quality.aPressureRangeMmHg,
    vPressureRangeMmHg: quality.vPressureRangeMmHg,
    pressurePulseMmHg: quality.pressurePulseMmHg,
  };
}

function dominantFailureClass(
  quality: ReturnType<typeof runAtrialFigureEightQualityAuditBenchV1>["rows"][number]["currentPv"],
): DominantFailureClassV1 {
  if (quality.lobeQualityPass) return "pass";
  if (quality.failureReasons.includes("missing-pv-self-intersection")) return "missing-self-intersection";
  if (quality.failureReasons.includes("a-v-lobes-not-opposed")) return "same-signed-lobes";
  if (quality.failureReasons.includes("a-loop-area-too-small")) return "small-a-loop";
  if (quality.failureReasons.includes("v-loop-area-too-small")) return "small-v-loop";
  if (quality.failureReasons.includes("v-loop-not-higher-volume-than-a-loop")) return "volume-order-fail";
  return "pressure-pulse-low";
}

function summarize(
  chamberId: AtrialFiberChamberIdV1,
  pressureSource: PressureSourceV1,
  rows: readonly RowV1[],
): ChamberSourceSummaryV1 {
  return {
    chamberId,
    pressureSource,
    total: rows.length,
    lobeQualityPass: rows.filter((row) => row.lobeQualityPass).length,
    basicFigureEightPass: rows.filter((row) => row.basicFigureEightPass).length,
    opposedLobes: rows.filter((row) => row.opposedSignedLobes).length,
    meanVolumeSeparationMl: round(mean(rows.map((row) => row.vMeanVolumeMinusAMeanVolumeMl))),
    meanAOverVLoopRatio: round(mean(rows.map((row) => row.aOverVLoopRatio))),
    dominantFailureCounts: countDominantFailures(rows),
  };
}

function countDominantFailures(rows: readonly RowV1[]): Record<DominantFailureClassV1, number> {
  const counts = (
    Object.fromEntries(FAILURE_CLASSES.map((failureClass) => [failureClass, 0]))
  ) as Record<DominantFailureClassV1, number>;
  for (const row of rows) counts[row.dominantFailureClass]++;
  return counts;
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Math.round(value * 1_000_000) / 1_000_000;
}
