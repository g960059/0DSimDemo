import {
  buildRightHeartStrategicEnvelopeV1,
  runRightHeartStrategicPointV1,
  summarizeRightHeartStrategicPointsV1,
  type RightHeartStrategicSmokePointResultV1,
  type RightHeartStrategicSmokeReportV1,
} from "@/engine/mechanics2/benches/RightHeartStrategicSmokeBench";
import type { RightHeartSubsystemParamsV2 } from "@/engine/mechanics2/subsystems/RightHeartSubsystemV2";

export const RIGHT_HEART_RESERVE_CALIBRATION_REPORT_ID_V1 =
  "right-heart-reserve-calibration-report-v1" as const;

type ReserveVariantV1 = {
  readonly variantId: string;
  readonly intervention: string;
  readonly mutate: (params: RightHeartSubsystemParamsV2) => RightHeartSubsystemParamsV2;
};

export type RightHeartReserveCalibrationVariantResultV1 = {
  readonly variantId: string;
  readonly intervention: string;
  readonly pointResults: readonly RightHeartStrategicSmokePointResultV1[];
  readonly summary: RightHeartStrategicSmokeReportV1["summary"];
  readonly maxSafetyPressureMmHg: number | null;
  readonly minStrokeVolumeMl: number | null;
};

export type RightHeartReserveCalibrationReportV1 = {
  readonly reportId: typeof RIGHT_HEART_RESERVE_CALIBRATION_REPORT_ID_V1;
  readonly gateId: "rightHeartReserveCalibrationGateV1";
  readonly variantResults: readonly RightHeartReserveCalibrationVariantResultV1[];
  readonly decision: {
    readonly selectedVariantId: string | null;
    readonly rightHeartReserveStatus: "right-heart-reserve-pass" | "mixed-signal" | "no-go";
    readonly nextAction: string;
  };
  readonly claimBoundary: {
    readonly runtimeWiring: false;
    readonly morphologyAcceptance: false;
    readonly pairedHeartUnlock: boolean;
    readonly fourChamberUnlock: false;
    readonly AVPlaneUnlock: false;
    readonly LandAtrialUnlock: false;
  };
};

export function runRightHeartReserveCalibrationBenchV1(): RightHeartReserveCalibrationReportV1 {
  const variantResults = buildRightHeartReserveVariantsV1().map(runVariant);
  const selected = variantResults.find((variant) => variant.summary.pass === variant.summary.total) ?? null;
  return {
    reportId: RIGHT_HEART_RESERVE_CALIBRATION_REPORT_ID_V1,
    gateId: "rightHeartReserveCalibrationGateV1",
    variantResults,
    decision: {
      selectedVariantId: selected?.variantId ?? null,
      rightHeartReserveStatus: selected == null
        ? (variantResults.some((variant) => variant.summary.pass >= 5) ? "mixed-signal" : "no-go")
        : "right-heart-reserve-pass",
      nextAction: selected == null
        ? "Stay in right-heart reserve calibration before paired-heart smoke."
        : "Use the selected right-heart reserve calibration for a paired left/right MechanicsCore2 smoke before any four-chamber or LandAtrial work.",
    },
    claimBoundary: {
      runtimeWiring: false,
      morphologyAcceptance: false,
      pairedHeartUnlock: selected != null,
      fourChamberUnlock: false,
      AVPlaneUnlock: false,
      LandAtrialUnlock: false,
    },
  };
}

function buildRightHeartReserveVariantsV1(): readonly ReserveVariantV1[] {
  return [
    {
      variantId: "baseline-rv-pressure-scale046",
      intervention: "Historical first right-heart smoke baseline: RV pressureScale 0.46 and pre-calibration lower suction 0.22.",
      mutate: (params) => ({
        ...params,
        rvLowerSoftLimitGainMmHgPerMl: 0.22,
        rv: { ...params.rv, pressureScale: 0.46 },
      }),
    },
    {
      variantId: "rv-pressure-scale050",
      intervention: "Increase only RV one-fiber stress-to-pressure scale to 0.50 while preserving pre-calibration lower suction.",
      mutate: (params) => ({
        ...params,
        rvLowerSoftLimitGainMmHgPerMl: 0.22,
        rv: { ...params.rv, pressureScale: 0.50 },
      }),
    },
    {
      variantId: "rv-pressure-scale052",
      intervention: "Increase only RV one-fiber stress-to-pressure scale to 0.52.",
      mutate: (params) => ({
        ...params,
        rv: { ...params.rv, pressureScale: 0.52 },
        rvLowerSoftLimitGainMmHgPerMl: 0.22,
      }),
    },
    {
      variantId: "rv-pressure-scale052-lower-suction008",
      intervention: "Use pressureScale 0.52 while reducing only RV lower-bound soft-suction gain to 0.08.",
      mutate: (params) => ({
        ...params,
        rv: { ...params.rv, pressureScale: 0.52 },
        rvLowerSoftLimitGainMmHgPerMl: 0.08,
      }),
    },
    {
      variantId: "rv-pressure-scale052-passive24k",
      intervention: "Control: pressureScale 0.52 plus higher RV passive stiffness.",
      mutate: (params) => ({
        ...params,
        rvLowerSoftLimitGainMmHgPerMl: 0.08,
        rv: {
          ...params.rv,
          pressureScale: 0.52,
          fiber: { ...params.rv.fiber, passiveStiffnessPa: 24_000 },
        },
      }),
    },
  ];
}

function runVariant(variant: ReserveVariantV1): RightHeartReserveCalibrationVariantResultV1 {
  const pointResults = buildRightHeartStrategicEnvelopeV1()
    .map(variant.mutate)
    .map(runRightHeartStrategicPointV1);
  const summary = summarizeRightHeartStrategicPointsV1(pointResults);
  return {
    variantId: variant.variantId,
    intervention: variant.intervention,
    pointResults,
    summary,
    maxSafetyPressureMmHg: maxFinite(pointResults.map((point) => point.finalBeat?.maxSafetyPressureMmHg ?? Number.NaN)),
    minStrokeVolumeMl: minFinite(pointResults.map((point) => point.finalBeat?.strokeVolumeMl ?? Number.NaN)),
  };
}

function maxFinite(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.max(...finite)) : null;
}

function minFinite(values: readonly number[]): number | null {
  const finite = values.filter(Number.isFinite);
  return finite.length > 0 ? round(Math.min(...finite)) : null;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
