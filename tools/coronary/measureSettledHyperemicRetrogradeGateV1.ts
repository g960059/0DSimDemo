import {
  createCoronaryAcceptedAutoregulationStateV3,
} from "@/engine/coronary/acceptedAutoregulationWindowV3";
import {
  NORMAL_ADULT_CORONARY_AUTOREGULATION_PRIOR_V2,
} from "@/engine/coronary/autoregulationV2";
import {
  CORONARY_LAYER_IDS_V2,
  CORONARY_TERRITORY_IDS_V2,
  type CoronaryTerritoryLayerRecordV2,
} from "@/engine/coronary/typesV2";
import {
  limitMainWireIntegratedModelCandidateTimeV3,
  stepMainWireIntegratedModelV3,
  wrapMainWireIntegratedModelAcceptedStateV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  mainWireFiveWallCoronaryBaseStateV2,
  wrapMainWireFiveWallCoronaryAcceptedStateV3,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV3";
import {
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";

export const SETTLED_HYPEREMIC_RETROGRADE_GATE_V1 = Object.freeze({
  nominalDtSec: 0.002,
  settlingCycleCount: 3,
  measurementCycleIndex: 4,
  cycleLengthSec: 1,
  territoryId: "LAD" as const,
  layerId: "subendocardial" as const,
  flowSite: "precapillary-R1" as const,
  /**
   * A small negative tail is not the compression signature. The gate brackets
   * the contiguous accepted samples at or below -0.5 mL/s. Its endpoints are
   * the immediately adjacent accepted samples, making threshold crossings
   * reviewable without interpolation.
   */
  materialRetrogradeThresholdMlPerSec: -0.5,
});

export type SettledHyperemicRetrogradeGateMeasurementV1 = Readonly<{
  gateId: "settled-maximal-hyperemia-tone-floor-retrograde-gate-v1";
  nominalDtSec: number;
  settlingCycleCount: number;
  measurementCycleIndex: number;
  nominalToneFloorResistanceScale: number;
  appliedToneFloorResistanceScale: number;
  appliedFloorAdjustmentUlpCount: 2;
  maximalHyperemia01: 1;
  flowSite: "LAD.subendocardial.precapillary-R1";
  materialRetrogradeThresholdMlPerSec: number;
  window: Readonly<{
    startPhaseSec: number;
    endPhaseSec: number;
    widthSec: number;
    firstThresholdSamplePhaseSec: number;
    lastThresholdSamplePhaseSec: number;
  }>;
  nadir: Readonly<{
    signedFlowMlPerSec: number;
    magnitudeMlPerSec: number;
    phaseSec: number;
  }>;
  roughness: Readonly<{
    totalVariationMlPerSec: number;
    minimumSingleNadirVariationMlPerSec: number;
    ratio: number;
  }>;
}>;

type FlowSample = Readonly<{
  phaseSec: number;
  flowMlPerSec: number;
}>;

/**
 * Reproduces the preconditioned hyperemic gate used to review coronary
 * sensitivity changes. Three complete cycles are discarded before the fourth
 * cycle is measured; this is intentionally not the one-cold-step fixture.
 */
export function measureSettledHyperemicRetrogradeGateV1():
SettledHyperemicRetrogradeGateMeasurementV1 {
  const fixture = createMainWireIntegratedModelRegularSinusAllOffFixtureV3();
  const nominalFloor =
    NORMAL_ADULT_CORONARY_AUTOREGULATION_PRIOR_V2.minimumResistanceScale;
  // The autoregulation owner round-trips tone through exp(log(tone)). The
  // smallest representable value that remains on-or-above the inclusive floor
  // after that round trip is two ULPs above the decimal prior.
  const appliedFloor = nextUp(nextUp(nominalFloor));
  const toneAtFloor = layerRecord(() => appliedFloor);
  const hyperemia = layerRecord(() => 1);
  const coronaryDisease = Object.freeze(Object.fromEntries(
    CORONARY_TERRITORY_IDS_V2.map((territoryId) => [
      territoryId,
      Object.freeze({
        ...fixture.coronaryStepInput.coronaryDisease[territoryId],
        layers: Object.freeze(Object.fromEntries(
          CORONARY_LAYER_IDS_V2.map((layerId) => [
            layerId,
            Object.freeze({
              ...fixture.coronaryStepInput.coronaryDisease[territoryId]
                .layers[layerId],
              vasodilatoryToneMinimumResistanceScale: appliedFloor,
            }),
          ]),
        )),
      }),
    ]),
  )) as typeof fixture.coronaryStepInput.coronaryDisease;
  const drive = Object.freeze({
    controlId: "settled-maximal-hyperemia-tone-floor-retrograde-gate-v1",
    demandScaleByTerritoryLayer: layerRecord(() => 1),
    hyperemia01ByTerritoryLayer: hyperemia,
  });
  const desiredControl = Object.freeze({
    ...drive,
    effectiveMinimumToneScaleByTerritoryLayer: toneAtFloor,
  });
  const cold = fixture.cold.acceptedState;
  const coronaryBase = mainWireFiveWallCoronaryBaseStateV2(cold.coronary);
  const coronaryBaseAtFloor = Object.freeze({
    ...coronaryBase,
    coronary: Object.freeze({
      ...coronaryBase.coronary,
      toneResistanceScaleByTerritoryLayer: toneAtFloor,
    }),
  });
  const autoregulation = createCoronaryAcceptedAutoregulationStateV3(
    cold.coronary.coronaryAutoregulationBinding,
    {
      acceptedTimeSec: 0,
      revision: 0,
      desiredControl,
    },
  );
  const coronaryAtFloor = wrapMainWireFiveWallCoronaryAcceptedStateV3(
    coronaryBaseAtFloor,
    cold.coronary.coronaryAutoregulationBinding,
    autoregulation,
  );
  let accepted = wrapMainWireIntegratedModelAcceptedStateV3(
    coronaryAtFloor,
    cold.composedRhythm,
    cold.dynamicMechanicalSupport,
    { configuration: fixture.rhythm.configuration },
    fixture.profile,
    fixture.config,
  );
  const samples: FlowSample[] = [];
  const measurementStartSec =
    SETTLED_HYPEREMIC_RETROGRADE_GATE_V1.settlingCycleCount
    * SETTLED_HYPEREMIC_RETROGRADE_GATE_V1.cycleLengthSec;
  const measurementEndSec =
    SETTLED_HYPEREMIC_RETROGRADE_GATE_V1.measurementCycleIndex
    * SETTLED_HYPEREMIC_RETROGRADE_GATE_V1.cycleLengthSec;
  let nominalGridIndex = 1;

  while (accepted.acceptedTimeSec < measurementEndSec) {
    let nominalTargetSec =
      nominalGridIndex * SETTLED_HYPEREMIC_RETROGRADE_GATE_V1.nominalDtSec;
    while (!(nominalTargetSec > accepted.acceptedTimeSec)) {
      nominalGridIndex += 1;
      nominalTargetSec =
        nominalGridIndex * SETTLED_HYPEREMIC_RETROGRADE_GATE_V1.nominalDtSec;
    }
    const limit = limitMainWireIntegratedModelCandidateTimeV3(
      accepted,
      nominalTargetSec,
      {
        configuration: fixture.rhythm.configuration,
        externalAfNextBoundaryTimeSec: null,
      },
      fixture.profile,
      fixture.config,
    );
    const result = stepMainWireIntegratedModelV3(
      fixture.provider,
      accepted,
      {
        candidateTimeSec: limit.candidateTimeSec,
        coronary: Object.freeze({
          ...fixture.coronaryStepInput,
          coronaryDisease,
          coronaryAutoregulationDrive: drive,
        }),
        rhythm: {
          configuration: fixture.rhythm.configuration,
          externalAfNextBoundaryTimeSec: null,
          externalAtrialSourceBatch: null,
        },
        dynamicMechanicalSupport: fixture.dynamicMechanicalSupport,
      },
    );
    if (result.converged === false) {
      throw new Error(
        `settled hyperemic gate failed at ${accepted.acceptedTimeSec}s: `
        + result.message,
      );
    }
    accepted = result.acceptedState;
    if (accepted.acceptedTimeSec === nominalTargetSec) {
      nominalGridIndex += 1;
    }
    if (accepted.acceptedTimeSec > measurementStartSec) {
      samples.push(Object.freeze({
        phaseSec: accepted.acceptedTimeSec - measurementStartSec,
        flowMlPerSec: result.coronaryStep.baseStep.coronaryTrial.diagnostics
          .hydraulics.layerR1FlowMlPerSecByTerritory.LAD.subendocardial,
      }));
    }
  }

  return buildMeasurement(samples, nominalFloor, appliedFloor);
}

function buildMeasurement(
  samples: readonly FlowSample[],
  nominalFloor: number,
  appliedFloor: number,
): SettledHyperemicRetrogradeGateMeasurementV1 {
  const threshold =
    SETTLED_HYPEREMIC_RETROGRADE_GATE_V1
      .materialRetrogradeThresholdMlPerSec;
  const thresholdIndices = samples.flatMap((sample, index) =>
    sample.flowMlPerSec <= threshold ? [index] : []);
  const firstIndex = thresholdIndices[0];
  const lastIndex = thresholdIndices.at(-1);
  if (
    firstIndex === undefined
    || lastIndex === undefined
    || firstIndex === 0
    || lastIndex >= samples.length - 1
    || thresholdIndices.some((index, offset) =>
      index !== firstIndex + offset)
  ) {
    throw new Error(
      "settled hyperemic material-retrograde window is missing, "
      + "unbracketed, or discontinuous",
    );
  }
  const bracketed = samples.slice(firstIndex - 1, lastIndex + 2);
  const nadir = bracketed.reduce((current, sample) =>
    sample.flowMlPerSec < current.flowMlPerSec ? sample : current);
  const totalVariation = bracketed.slice(1).reduce(
    (sum, sample, index) =>
      sum + Math.abs(
        sample.flowMlPerSec - bracketed[index]!.flowMlPerSec,
      ),
    0,
  );
  const minimumSingleNadirVariation =
    Math.abs(bracketed[0]!.flowMlPerSec - nadir.flowMlPerSec)
    + Math.abs(bracketed.at(-1)!.flowMlPerSec - nadir.flowMlPerSec);
  const startPhaseSec = phaseOnNominalGrid(bracketed[0]!.phaseSec);
  const endPhaseSec = phaseOnNominalGrid(bracketed.at(-1)!.phaseSec);

  return Object.freeze({
    gateId:
      "settled-maximal-hyperemia-tone-floor-retrograde-gate-v1" as const,
    nominalDtSec: SETTLED_HYPEREMIC_RETROGRADE_GATE_V1.nominalDtSec,
    settlingCycleCount:
      SETTLED_HYPEREMIC_RETROGRADE_GATE_V1.settlingCycleCount,
    measurementCycleIndex:
      SETTLED_HYPEREMIC_RETROGRADE_GATE_V1.measurementCycleIndex,
    nominalToneFloorResistanceScale: nominalFloor,
    appliedToneFloorResistanceScale: appliedFloor,
    appliedFloorAdjustmentUlpCount: 2 as const,
    maximalHyperemia01: 1 as const,
    flowSite: "LAD.subendocardial.precapillary-R1" as const,
    materialRetrogradeThresholdMlPerSec: threshold,
    window: Object.freeze({
      startPhaseSec,
      endPhaseSec,
      widthSec: phaseOnNominalGrid(endPhaseSec - startPhaseSec),
      firstThresholdSamplePhaseSec:
        phaseOnNominalGrid(samples[firstIndex]!.phaseSec),
      lastThresholdSamplePhaseSec:
        phaseOnNominalGrid(samples[lastIndex]!.phaseSec),
    }),
    nadir: Object.freeze({
      signedFlowMlPerSec: nadir.flowMlPerSec,
      magnitudeMlPerSec: Math.abs(nadir.flowMlPerSec),
      phaseSec: phaseOnNominalGrid(nadir.phaseSec),
    }),
    roughness: Object.freeze({
      totalVariationMlPerSec: totalVariation,
      minimumSingleNadirVariationMlPerSec: minimumSingleNadirVariation,
      ratio: totalVariation / minimumSingleNadirVariation,
    }),
  });
}

function layerRecord(
  create: (
    territoryId: (typeof CORONARY_TERRITORY_IDS_V2)[number],
    layerId: (typeof CORONARY_LAYER_IDS_V2)[number],
  ) => number,
): CoronaryTerritoryLayerRecordV2<number> {
  return Object.freeze(Object.fromEntries(
    CORONARY_TERRITORY_IDS_V2.map((territoryId) => [
      territoryId,
      Object.freeze(Object.fromEntries(
        CORONARY_LAYER_IDS_V2.map((layerId) => [
          layerId,
          create(territoryId, layerId),
        ]),
      )),
    ]),
  )) as CoronaryTerritoryLayerRecordV2<number>;
}

function phaseOnNominalGrid(value: number): number {
  const dt = SETTLED_HYPEREMIC_RETROGRADE_GATE_V1.nominalDtSec;
  return Number((Math.round(value / dt) * dt).toFixed(12));
}

function nextUp(value: number): number {
  const float = new Float64Array([value]);
  const bits = new BigUint64Array(float.buffer);
  bits[0] += 1n;
  return float[0]!;
}

if (process.argv[1]?.endsWith("measureSettledHyperemicRetrogradeGateV1.ts")) {
  console.log(JSON.stringify(
    measureSettledHyperemicRetrogradeGateV1(),
    null,
    2,
  ));
}
