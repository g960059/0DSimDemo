import {
  measureMainWireValveDiseaseCycleMetricsV1,
} from "@/engine/myocardium/diagnostics/MainWireValveDiseaseCycleMetricsV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  validateMainWireAorticCharacteristicResistancePlacementProfileV1,
  type MainWireAorticCharacteristicResistancePlacementProfileV1,
} from "@/engine/valves/MainWireAorticCharacteristicResistancePlacementV1";

export const MAIN_WIRE_AORTIC_PROXIMAL_CHARACTERISTIC_IMPEDANCE_DECOMPOSITION_V1_ID =
  "main-wire-aortic-proximal-characteristic-impedance-decomposition-v1" as const;

export const MAIN_WIRE_AORTIC_PROXIMAL_CHARACTERISTIC_IMPEDANCE_DECOMPOSITION_CLAIM_V1 =
  Object.freeze({
    source: "last-retained-complete-beat" as const,
    sampleSelection:
      "all-strictly-positive-AoV-flow-samples-without-thresholding" as const,
    reservoirPressure:
      "accepted-Ao-compliance-node-absolute-pressure" as const,
    proximalAorticInputPressure:
      "reservoir-pressure-plus-moved-characteristic-resistance-times-AoV-flow" as const,
    valveOnlyGradient:
      "LV-minus-proximal-aortic-input-pressure" as const,
    valveOnlyLosses:
      "source-valve-linear-loss-plus-direction-selected-orifice-loss" as const,
    characteristicImpedanceIsArterialNotValvular: true as const,
    proximalAorticInputPressureIsAlgebraicReadbackNotState: true as const,
    exactAcceptedModelChanged: false as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    clinicalValidationClaimed: false as const,
  });

export type MainWireAorticProximalCharacteristicImpedanceDecompositionV1 =
  Readonly<{
    methodId:
      typeof MAIN_WIRE_AORTIC_PROXIMAL_CHARACTERISTIC_IMPEDANCE_DECOMPOSITION_V1_ID;
    protocolIdentityHash: string;
    placementProfileId:
      MainWireAorticCharacteristicResistancePlacementProfileV1["profileId"];
    forwardSampleCount: number;
    forwardFlowTimeSec: number;
    forwardVolumeMl: number;
    sourceValveLinearResistanceMmHgSecPerMl: number;
    proximalCharacteristicResistanceMmHgSecPerMl: number;
    meanFlowMlPerSec: number;
    peakFlowMlPerSec: number;
    meanReservoirNodeGradientMmHg: number;
    peakReservoirNodeGradientMmHg: number;
    meanProximalCharacteristicPressureMmHg: number;
    peakProximalCharacteristicPressureMmHg: number;
    meanValveOnlyPressureGradientMmHg: number;
    peakValveOnlyPressureGradientMmHg: number;
    meanSourceValveLinearPressureLossMmHg: number;
    peakSourceValveLinearPressureLossMmHg: number;
    meanOrificePressureLossMmHg: number;
    peakOrificePressureLossMmHg: number;
    maximumAbsoluteValveOnlyReconstructionResidualMmHg: number;
    meanAlgebraicProximalAorticInputPressureMmHg: number;
    minimumAlgebraicProximalAorticInputPressureMmHg: number;
    maximumAlgebraicProximalAorticInputPressureMmHg: number;
    claim:
      typeof MAIN_WIRE_AORTIC_PROXIMAL_CHARACTERISTIC_IMPEDANCE_DECOMPOSITION_CLAIM_V1;
  }>;

export function measureMainWireAorticProximalCharacteristicImpedanceDecompositionV1(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  placement:
    MainWireAorticCharacteristicResistancePlacementProfileV1,
): MainWireAorticProximalCharacteristicImpedanceDecompositionV1 {
  const issues =
    validateMainWireAorticCharacteristicResistancePlacementProfileV1(
      placement,
    );
  if (issues.length > 0) {
    throw new Error(
      `invalid aortic characteristic-impedance placement: ${issues.join("; ")}`,
    );
  }
  const beat = result.retainedCompleteBeats.at(-1);
  if (beat === undefined || beat.samples.length === 0) {
    throw new Error(
      "aortic characteristic-impedance decomposition requires a retained complete beat",
    );
  }
  const forwardSamples = beat.samples.filter((sample) =>
    sample.circulationEdgeFlowMlPerSec.AoV > 0);
  if (forwardSamples.length === 0) {
    throw new Error(
      "aortic characteristic-impedance decomposition requires forward AoV flow",
    );
  }
  const valveMetrics = measureMainWireValveDiseaseCycleMetricsV1(result)
    .valves.AoV;
  const proximalCharacteristicResistanceMmHgSecPerMl =
    placement.upstreamValveLinearResistanceAdditionMmHgSecPerMl;
  const sourceValveLinearResistanceMmHgSecPerMl =
    result.valveResearchInput.valves.AoV
      .backgroundLinearResistanceMmHgSecPerMl;
  const rows = forwardSamples.map((sample) => {
    const valve = sample.valveHydraulics.AoV;
    const flowMlPerSec = valve.flowMlPerSec;
    const reservoirPressureMmHg =
      sample.circulationNodeAbsolutePressureMmHg.Ao;
    const reservoirNodeGradientMmHg = valve.pressureGradientMmHg;
    const proximalCharacteristicPressureMmHg =
      proximalCharacteristicResistanceMmHgSecPerMl * flowMlPerSec;
    const algebraicProximalAorticInputPressureMmHg =
      reservoirPressureMmHg + proximalCharacteristicPressureMmHg;
    const valveOnlyPressureGradientMmHg =
      reservoirNodeGradientMmHg - proximalCharacteristicPressureMmHg;
    const sourceValveLinearPressureLossMmHg =
      sourceValveLinearResistanceMmHgSecPerMl * flowMlPerSec;
    const orificePressureLossMmHg =
      valve.bernoulliMmHgSec2PerMl2
      * flowMlPerSec
      * Math.abs(flowMlPerSec);
    return Object.freeze({
      flowMlPerSec,
      reservoirNodeGradientMmHg,
      proximalCharacteristicPressureMmHg,
      algebraicProximalAorticInputPressureMmHg,
      valveOnlyPressureGradientMmHg,
      sourceValveLinearPressureLossMmHg,
      orificePressureLossMmHg,
      reconstructionResidualMmHg:
        valveOnlyPressureGradientMmHg
        - sourceValveLinearPressureLossMmHg
        - orificePressureLossMmHg,
    });
  });
  const dtSec = result.dtSec;
  const forwardFlowTimeSec = rows.length * dtSec;
  const forwardVolumeMl = rows.reduce((sum, row) =>
    sum + row.flowMlPerSec * dtSec, 0);
  if (
    Math.abs(forwardFlowTimeSec - valveMetrics.forwardFlowTimeSec) > 1e-12
    || Math.abs(forwardVolumeMl - valveMetrics.forwardVolumeMl) > 1e-9
  ) {
    throw new Error(
      "aortic characteristic-impedance forward-flow accounting mismatch",
    );
  }
  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_PROXIMAL_CHARACTERISTIC_IMPEDANCE_DECOMPOSITION_V1_ID,
    protocolIdentityHash: result.protocolIdentityHash,
    placementProfileId: placement.profileId,
    forwardSampleCount: rows.length,
    forwardFlowTimeSec,
    forwardVolumeMl,
    sourceValveLinearResistanceMmHgSecPerMl,
    proximalCharacteristicResistanceMmHgSecPerMl,
    meanFlowMlPerSec: mean(rows.map((row) => row.flowMlPerSec)),
    peakFlowMlPerSec: maximum(rows.map((row) => row.flowMlPerSec)),
    meanReservoirNodeGradientMmHg:
      mean(rows.map((row) => row.reservoirNodeGradientMmHg)),
    peakReservoirNodeGradientMmHg:
      maximum(rows.map((row) => row.reservoirNodeGradientMmHg)),
    meanProximalCharacteristicPressureMmHg:
      mean(rows.map((row) => row.proximalCharacteristicPressureMmHg)),
    peakProximalCharacteristicPressureMmHg:
      maximum(rows.map((row) => row.proximalCharacteristicPressureMmHg)),
    meanValveOnlyPressureGradientMmHg:
      mean(rows.map((row) => row.valveOnlyPressureGradientMmHg)),
    peakValveOnlyPressureGradientMmHg:
      maximum(rows.map((row) => row.valveOnlyPressureGradientMmHg)),
    meanSourceValveLinearPressureLossMmHg:
      mean(rows.map((row) => row.sourceValveLinearPressureLossMmHg)),
    peakSourceValveLinearPressureLossMmHg:
      maximum(rows.map((row) => row.sourceValveLinearPressureLossMmHg)),
    meanOrificePressureLossMmHg:
      mean(rows.map((row) => row.orificePressureLossMmHg)),
    peakOrificePressureLossMmHg:
      maximum(rows.map((row) => row.orificePressureLossMmHg)),
    maximumAbsoluteValveOnlyReconstructionResidualMmHg:
      maximum(rows.map((row) => Math.abs(row.reconstructionResidualMmHg))),
    meanAlgebraicProximalAorticInputPressureMmHg:
      mean(rows.map((row) => row.algebraicProximalAorticInputPressureMmHg)),
    minimumAlgebraicProximalAorticInputPressureMmHg:
      minimum(rows.map((row) => row.algebraicProximalAorticInputPressureMmHg)),
    maximumAlgebraicProximalAorticInputPressureMmHg:
      maximum(rows.map((row) => row.algebraicProximalAorticInputPressureMmHg)),
    claim:
      MAIN_WIRE_AORTIC_PROXIMAL_CHARACTERISTIC_IMPEDANCE_DECOMPOSITION_CLAIM_V1,
  });
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function minimum(values: readonly number[]): number {
  return Math.min(...values);
}

function maximum(values: readonly number[]): number {
  return Math.max(...values);
}
