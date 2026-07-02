import {
  buildLeftHeartDynamicReserveVariantEnvelopeV1,
  runLeftHeartDynamicReservePointV1,
  type LeftHeartDynamicReservePointResultV1,
} from "@/engine/mechanics2/benches/LeftHeartDynamicReserveContractBench";
import {
  buildRightHeartStrategicEnvelopeV1,
  runRightHeartStrategicPointV1,
  type RightHeartStrategicSmokePointResultV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import type { LeftHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/LeftHeartSubsystemV2";
import type { RightHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export const SOURCE_SURFACE_DTHALF_STABILITY_SCAN_REPORT_ID_V1 =
  "source-surface-dthalf-stability-scan-report-v1" as const;

type SideV1 = "left" | "right";

type LeftCandidateIdV1 =
  | "left-selected-reference"
  | "left-mv-closure075"
  | "left-mv-closure095"
  | "left-lv-pressure102"
  | "left-lv-tref103"
  | "left-pressure102-tref103"
  | "left-mv-step006-close003"
  | "left-mv-step010-close003"
  | "left-mv-close006"
  | "left-mv-close008";

type RightCandidateIdV1 =
  | "right-selected-reference"
  | "right-lowt30000-safety018"
  | "right-lowt30000-safety022"
  | "right-iter3-rel05"
  | "right-iter4-rel065"
  | "right-iter4-rel065-venr125"
  | "right-tv-step004-open003-close003"
  | "right-tv-step004-open003-close004"
  | "right-venr125"
  | "right-venr150";

type SourcePointResultV1 = {
  readonly pointId: string;
  readonly status: "pass" | "fail" | "inconclusive";
  readonly failureReasons: readonly string[];
  readonly acceptedPhenotypeReasons: readonly string[];
  readonly morphologyOk: boolean;
  readonly outputOk: boolean;
  readonly dtStable: boolean;
  readonly repeatabilityOk: boolean;
  readonly forwardEjectedVolumeMl: number | null;
  readonly forwardStrokeVolumeMl: number | null;
  readonly c1ContinuityScore: number | null;
  readonly dtShapeDelta: number | null;
  readonly dtOutputDeltaMl: number | null;
};

type CandidateResultV1 = {
  readonly candidateId: LeftCandidateIdV1 | RightCandidateIdV1;
  readonly side: SideV1;
  readonly description: string;
  readonly pointResults: readonly SourcePointResultV1[];
  readonly summary: {
    readonly total: number;
    readonly pass: number;
    readonly fail: number;
    readonly inconclusive: number;
    readonly morphologyOkCount: number;
    readonly outputOkCount: number;
    readonly dtStableCount: number;
    readonly repeatabilityOkCount: number;
    readonly phenotypeAcceptedCount: number;
    readonly maxDtShapeDelta: number | null;
    readonly maxDtOutputDeltaMl: number | null;
  };
  readonly score: number;
};

export type SourceSurfaceDtHalfStabilityScanReportV1 = {
  readonly reportId: typeof SOURCE_SURFACE_DTHALF_STABILITY_SCAN_REPORT_ID_V1;
  readonly gateId: "sourceSurfaceDtHalfStabilityScanV1";
  readonly sourceSurfaces: {
    readonly leftVariantId: "active-length-mv-closure-stateful-root08";
    readonly rightScaffoldId: "selected-best-neighborhood-pressure047-gain014-cap35";
    readonly sampleRateMultiplier: 2;
  };
  readonly candidateResults: readonly CandidateResultV1[];
  readonly summary: {
    readonly scannedCandidateCount: number;
    readonly leftCandidateCount: number;
    readonly rightCandidateCount: number;
    readonly leftBestCandidateId: LeftCandidateIdV1;
    readonly rightBestCandidateId: RightCandidateIdV1;
    readonly leftBestPassCount: number;
    readonly rightBestPassCount: number;
    readonly leftFullPassCandidateCount: number;
    readonly rightFullPassCandidateCount: number;
  };
  readonly decision: {
    readonly scanStatus: "source-dthalf-scan-pass" | "source-dthalf-scan-partial" | "source-dthalf-scan-blocked";
    readonly nextAction: string;
    readonly blockedClaims: readonly string[];
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly trueFourChamberDynamics: false;
    readonly morphologyAcceptance: false;
    readonly AVPlaneUnlock: false;
    readonly LandAtrialUnlock: false;
  };
};

type LeftCandidateSpecV1 = {
  readonly candidateId: LeftCandidateIdV1;
  readonly description: string;
  readonly apply: (point: LeftHeartSubsystemParamsV2) => LeftHeartSubsystemParamsV2;
};

type RightCandidateSpecV1 = {
  readonly candidateId: RightCandidateIdV1;
  readonly description: string;
  readonly apply: (point: RightHeartSubsystemParamsV2) => RightHeartSubsystemParamsV2;
};

const LEFT_CANDIDATES: readonly LeftCandidateSpecV1[] = [
  {
    candidateId: "left-selected-reference",
    description: "Selected left Gate B surface at doubled sample rate.",
    apply: identity,
  },
  {
    candidateId: "left-mv-closure075",
    description: "Slightly lower systolic MV closure drive.",
    apply: (point) => ({ ...point, mvSystolicClosureDriveGain01: 0.75 }),
  },
  {
    candidateId: "left-mv-closure095",
    description: "Slightly higher systolic MV closure drive.",
    apply: (point) => ({ ...point, mvSystolicClosureDriveGain01: 0.95 }),
  },
  {
    candidateId: "left-lv-pressure102",
    description: "Small LV pressure-scale reserve probe for afterload-high output parity.",
    apply: (point) => ({ ...point, lv: { ...point.lv, pressureScale: point.lv.pressureScale * 1.02 } }),
  },
  {
    candidateId: "left-lv-tref103",
    description: "Small LV active-tension reserve probe.",
    apply: (point) => ({
      ...point,
      lv: { ...point.lv, fiber: { ...point.lv.fiber, trefPa: point.lv.fiber.trefPa * 1.03 } },
    }),
  },
  {
    candidateId: "left-pressure102-tref103",
    description: "Small combined pressure/tension reserve probe.",
    apply: (point) => ({
      ...point,
      lv: {
        ...point.lv,
        pressureScale: point.lv.pressureScale * 1.02,
        fiber: { ...point.lv.fiber, trefPa: point.lv.fiber.trefPa * 1.03 },
      },
    }),
  },
  {
    candidateId: "left-mv-step006-close003",
    description: "Faster smoother MV area step with faster closure.",
    apply: (point) => ({ ...point, mv: { ...point.mv, maxOpenStepPerStep: 0.06, tauCloseSec: 0.03 } }),
  },
  {
    candidateId: "left-mv-step010-close003",
    description: "Larger MV area step with faster closure.",
    apply: (point) => ({ ...point, mv: { ...point.mv, maxOpenStepPerStep: 0.10, tauCloseSec: 0.03 } }),
  },
  {
    candidateId: "left-mv-close006",
    description: "Slower MV closure time constant probe.",
    apply: (point) => ({ ...point, mv: { ...point.mv, tauCloseSec: 0.06 } }),
  },
  {
    candidateId: "left-mv-close008",
    description: "Slowest MV closure time constant probe in this small scan.",
    apply: (point) => ({ ...point, mv: { ...point.mv, tauCloseSec: 0.08 } }),
  },
];

const RIGHT_CANDIDATES: readonly RightCandidateSpecV1[] = [
  {
    candidateId: "right-selected-reference",
    description: "Selected right Gate B / Gate C scaffold at doubled sample rate.",
    apply: identity,
  },
  {
    candidateId: "right-lowt30000-safety018",
    description: "Raises low-contractility RV active reserve while lowering upper safety gain.",
    apply: (point) => rightLowOutputProbe(point, 30_000, 0.18),
  },
  {
    candidateId: "right-lowt30000-safety022",
    description: "Raises low-contractility RV active reserve with moderate upper safety gain.",
    apply: (point) => rightLowOutputProbe(point, 30_000, 0.22),
  },
  {
    candidateId: "right-iter3-rel05",
    description: "Adds one fixed-point iteration at the current relaxation.",
    apply: (point) => ({ ...point, transactionIterations: 3, transactionRelaxation: 0.5 }),
  },
  {
    candidateId: "right-iter4-rel065",
    description: "Higher iteration and relaxation for right preload-low output parity.",
    apply: (point) => ({ ...point, transactionIterations: 4, transactionRelaxation: 0.65 }),
  },
  {
    candidateId: "right-iter4-rel065-venr125",
    description: "Higher iteration/relaxation plus higher systemic venous resistance.",
    apply: (point) => ({
      ...point,
      transactionIterations: 4,
      transactionRelaxation: 0.65,
      systemicVenousResistanceMmHgSecPerMl: point.systemicVenousResistanceMmHgSecPerMl * 1.25,
    }),
  },
  {
    candidateId: "right-tv-step004-open003-close003",
    description: "Slower TV area step with faster open/close timing.",
    apply: (point) => ({
      ...point,
      tv: { ...point.tv, maxOpenStepPerStep: 0.04, tauOpenSec: 0.03, tauCloseSec: 0.03 },
    }),
  },
  {
    candidateId: "right-tv-step004-open003-close004",
    description: "Slower TV area step with faster open and current close timing.",
    apply: (point) => ({
      ...point,
      tv: { ...point.tv, maxOpenStepPerStep: 0.04, tauOpenSec: 0.03, tauCloseSec: 0.04 },
    }),
  },
  {
    candidateId: "right-venr125",
    description: "Higher systemic venous resistance preload-low damping probe.",
    apply: (point) => ({
      ...point,
      systemicVenousResistanceMmHgSecPerMl: point.systemicVenousResistanceMmHgSecPerMl * 1.25,
    }),
  },
  {
    candidateId: "right-venr150",
    description: "Stronger systemic venous resistance preload-low damping probe.",
    apply: (point) => ({
      ...point,
      systemicVenousResistanceMmHgSecPerMl: point.systemicVenousResistanceMmHgSecPerMl * 1.5,
    }),
  },
];

export function runSourceSurfaceDtHalfStabilityScanBenchV1(): SourceSurfaceDtHalfStabilityScanReportV1 {
  const leftResults = LEFT_CANDIDATES.map(runLeftCandidate).sort(candidateSort);
  const rightResults = RIGHT_CANDIDATES.map(runRightCandidate).sort(candidateSort);
  const bestLeft = leftResults[0]!;
  const bestRight = rightResults[0]!;
  const leftFullPassCandidateCount = leftResults.filter((candidate) => candidate.summary.pass === candidate.summary.total).length;
  const rightFullPassCandidateCount = rightResults.filter((candidate) => candidate.summary.pass === candidate.summary.total).length;
  const scanStatus = leftFullPassCandidateCount > 0 && rightFullPassCandidateCount > 0
    ? "source-dthalf-scan-pass"
    : Math.max(bestLeft.summary.pass, bestRight.summary.pass) > 5
      ? "source-dthalf-scan-partial"
      : "source-dthalf-scan-blocked";
  return {
    reportId: SOURCE_SURFACE_DTHALF_STABILITY_SCAN_REPORT_ID_V1,
    gateId: "sourceSurfaceDtHalfStabilityScanV1",
    sourceSurfaces: {
      leftVariantId: "active-length-mv-closure-stateful-root08",
      rightScaffoldId: "selected-best-neighborhood-pressure047-gain014-cap35",
      sampleRateMultiplier: 2,
    },
    candidateResults: [...leftResults, ...rightResults],
    summary: {
      scannedCandidateCount: leftResults.length + rightResults.length,
      leftCandidateCount: leftResults.length,
      rightCandidateCount: rightResults.length,
      leftBestCandidateId: bestLeft.candidateId as LeftCandidateIdV1,
      rightBestCandidateId: bestRight.candidateId as RightCandidateIdV1,
      leftBestPassCount: bestLeft.summary.pass,
      rightBestPassCount: bestRight.summary.pass,
      leftFullPassCandidateCount,
      rightFullPassCandidateCount,
    },
    decision: {
      scanStatus,
      nextAction: scanStatus === "source-dthalf-scan-pass"
        ? "Promote the source-surface candidate pair into four-chamber residual review before any runtime, AV-plane, or LandAtrial work."
        : scanStatus === "source-dthalf-scan-partial"
          ? "Use the partial signal to focus next on the remaining source-surface dt-half residuals; do not tune reservoir coupling."
          : "Do not tune reservoir coupling. Move next to source-surface time integration and output/parity ownership.",
      blockedClaims: [
        "runtime-wiring",
        "true-four-chamber-dynamics",
        "morphology-acceptance",
        "AV-plane-unlock",
        "LandAtrial-unlock",
      ],
    },
    claimBoundary: {
      runtimeWiring: false,
      trueFourChamberDynamics: false,
      morphologyAcceptance: false,
      AVPlaneUnlock: false,
      LandAtrialUnlock: false,
    },
  };
}

function runLeftCandidate(spec: LeftCandidateSpecV1): CandidateResultV1 {
  const pointResults = buildLeftHeartDynamicReserveVariantEnvelopeV1("active-length-mv-closure-stateful-root08")
    .map(withDoubleSampleRate)
    .map(spec.apply)
    .map(runLeftHeartDynamicReservePointV1)
    .map(fromLeftPoint);
  return candidateResult(spec.candidateId, "left", spec.description, pointResults);
}

function runRightCandidate(spec: RightCandidateSpecV1): CandidateResultV1 {
  const pointResults = buildRightHeartStrategicEnvelopeV1()
    .map(applySelectedRightScaffold)
    .map(withDoubleSampleRate)
    .map(spec.apply)
    .map(runRightHeartStrategicPointV1)
    .map(fromRightPoint);
  return candidateResult(spec.candidateId, "right", spec.description, pointResults);
}

function candidateResult(
  candidateId: LeftCandidateIdV1 | RightCandidateIdV1,
  side: SideV1,
  description: string,
  pointResults: readonly SourcePointResultV1[],
): CandidateResultV1 {
  const summary = summarizePoints(pointResults);
  return {
    candidateId,
    side,
    description,
    pointResults,
    summary,
    score: scoreCandidate(summary),
  };
}

function fromLeftPoint(point: LeftHeartDynamicReservePointResultV1): SourcePointResultV1 {
  return {
    pointId: point.pointId,
    status: point.status,
    failureReasons: point.failureReasons,
    acceptedPhenotypeReasons: point.acceptedPhenotypeReasons,
    morphologyOk: point.classifications.morphologyOk,
    outputOk: point.classifications.outputOk,
    dtStable: point.dtSensitivity.ok,
    repeatabilityOk: point.repeatability.ok,
    forwardEjectedVolumeMl: point.finalBeat?.aovEjectedVolumeMl ?? null,
    forwardStrokeVolumeMl: point.finalBeat?.strokeVolumeMl ?? null,
    c1ContinuityScore: point.finalBeat?.mvC1ContinuityScore ?? null,
    dtShapeDelta: point.dtSensitivity.mvC1ContinuityDelta,
    dtOutputDeltaMl: point.dtSensitivity.aovEjectionDeltaMl,
  };
}

function fromRightPoint(point: RightHeartStrategicSmokePointResultV1): SourcePointResultV1 {
  return {
    pointId: point.pointId,
    status: point.status,
    failureReasons: point.failureReasons,
    acceptedPhenotypeReasons: point.acceptedPhenotypeReasons,
    morphologyOk: point.classifications.morphologyOk,
    outputOk: point.classifications.outputOk,
    dtStable: point.dtSensitivity.ok,
    repeatabilityOk: point.repeatability.ok,
    forwardEjectedVolumeMl: point.finalBeat?.pvEjectedVolumeMl ?? null,
    forwardStrokeVolumeMl: point.finalBeat?.strokeVolumeMl ?? null,
    c1ContinuityScore: point.finalBeat?.tvC1ContinuityScore ?? null,
    dtShapeDelta: point.dtSensitivity.tvC1ContinuityDelta,
    dtOutputDeltaMl: point.dtSensitivity.pvEjectionDeltaMl,
  };
}

function summarizePoints(pointResults: readonly SourcePointResultV1[]): CandidateResultV1["summary"] {
  return {
    total: pointResults.length,
    pass: pointResults.filter((point) => point.status === "pass").length,
    fail: pointResults.filter((point) => point.status === "fail").length,
    inconclusive: pointResults.filter((point) => point.status === "inconclusive").length,
    morphologyOkCount: pointResults.filter((point) => point.morphologyOk).length,
    outputOkCount: pointResults.filter((point) => point.outputOk).length,
    dtStableCount: pointResults.filter((point) => point.dtStable).length,
    repeatabilityOkCount: pointResults.filter((point) => point.repeatabilityOk).length,
    phenotypeAcceptedCount: pointResults.filter((point) => point.acceptedPhenotypeReasons.length > 0).length,
    maxDtShapeDelta: finiteMaxOrNull(pointResults.map((point) => point.dtShapeDelta ?? Number.NaN)),
    maxDtOutputDeltaMl: finiteMaxOrNull(pointResults.map((point) => point.dtOutputDeltaMl ?? Number.NaN)),
  };
}

function scoreCandidate(summary: CandidateResultV1["summary"]): number {
  return summary.pass * 100
    + summary.morphologyOkCount * 10
    + summary.dtStableCount
    + summary.repeatabilityOkCount
    + summary.phenotypeAcceptedCount * 5
    - (summary.maxDtShapeDelta ?? 0)
    - 0.01 * (summary.maxDtOutputDeltaMl ?? 0);
}

function candidateSort(a: CandidateResultV1, b: CandidateResultV1): number {
  return b.score - a.score
    || b.summary.pass - a.summary.pass
    || b.summary.dtStableCount - a.summary.dtStableCount
    || a.candidateId.localeCompare(b.candidateId);
}

function identity<T>(value: T): T {
  return value;
}

function withDoubleSampleRate<T extends { readonly sampleRateHz: number }>(point: T): T {
  return { ...point, sampleRateHz: point.sampleRateHz * 2 };
}

function applySelectedRightScaffold(point: RightHeartSubsystemParamsV2): RightHeartSubsystemParamsV2 {
  return {
    ...point,
    maxRvVolumeMl: 520,
    absoluteMaxRvVolumeMl: 640,
    rvSoftLimitGainMmHgPerMl: point.rvSoftLimitGainMmHgPerMl * 0.25,
    rvUpperSoftLimitPressureContribution01: 0.47,
    rv: {
      ...point.rv,
      fiber: {
        ...point.rv.fiber,
        trefPa: point.fixtureId === "right-heart-contractility-low" ? 26_000 : point.rv.fiber.trefPa,
      },
    },
  };
}

function rightLowOutputProbe(
  point: RightHeartSubsystemParamsV2,
  lowTrefPa: number,
  upperSafetyGainMmHgPerMl: number,
): RightHeartSubsystemParamsV2 {
  return {
    ...point,
    rvSoftLimitGainMmHgPerMl: point.rvSoftLimitGainMmHgPerMl / 0.25 * upperSafetyGainMmHgPerMl,
    rv: {
      ...point.rv,
      fiber: {
        ...point.rv.fiber,
        trefPa: point.fixtureId === "right-heart-contractility-low" ? lowTrefPa : point.rv.fiber.trefPa,
      },
    },
  };
}

function finiteMaxOrNull(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.max(...finite)) : null;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
