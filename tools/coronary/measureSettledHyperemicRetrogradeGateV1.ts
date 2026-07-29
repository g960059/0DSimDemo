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

export const SETTLED_LAD_SUBENDOCARDIAL_PRECAPILLARY_R1_HYPEREMIC_RETROGRADE_GATE_V1 =
  Object.freeze({
    gateId:
      "settled-lad-subendocardial-precapillary-r1-maximal-hyperemia-tone-floor-retrograde-gate-v1" as const,
    nominalDtSec: 0.002,
    cycleLengthSec: 1,
    minimumSettlingCycleCount: 3,
    maximumSettlingCycleCount: 16,
    consecutiveCycleNadirRelativeTolerance: 1e-4,
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
  gateId:
    "settled-lad-subendocardial-precapillary-r1-maximal-hyperemia-tone-floor-retrograde-gate-v1";
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
  convergence: Readonly<{
    criterionId:
      "consecutive-cycle-four-pin-convergence-v1";
    previousSettlingCycleCount: number;
    previousMeasurementCycleIndex: number;
    nadirMagnitudeRelativeDifference: number;
    nadirMagnitudeRelativeTolerance: number;
    nadirPhaseDifferenceSec: number;
    windowStartDifferenceSec: number;
    windowWidthDifferenceSec: number;
    timePinsRequireExactNominalGridAgreement: true;
  }>;
}>;

type FlowSample = Readonly<{
  phaseSec: number;
  flowMlPerSec: number;
}>;

type CycleMeasurement = Omit<
  SettledHyperemicRetrogradeGateMeasurementV1,
  "convergence"
>;

/**
 * Reproduces the preconditioned hyperemic gate used to review coronary
 * sensitivity changes. It returns the first cycle whose nadir magnitude agrees
 * with the preceding cycle within the declared relative tolerance and whose
 * nadir phase, bracketed-window start and width are unchanged on the nominal
 * accepted-time grid.
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
    controlId:
      SETTLED_LAD_SUBENDOCARDIAL_PRECAPILLARY_R1_HYPEREMIC_RETROGRADE_GATE_V1
        .gateId,
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
  const samplesByMeasurementCycle = new Map<number, FlowSample[]>();
  let previousCycleMeasurement: CycleMeasurement | null = null;
  const measurementEndSec =
    (
      SETTLED_LAD_SUBENDOCARDIAL_PRECAPILLARY_R1_HYPEREMIC_RETROGRADE_GATE_V1
        .maximumSettlingCycleCount
      + 1
    )
    * SETTLED_LAD_SUBENDOCARDIAL_PRECAPILLARY_R1_HYPEREMIC_RETROGRADE_GATE_V1
      .cycleLengthSec;
  let nominalGridIndex = 1;

  while (accepted.acceptedTimeSec < measurementEndSec) {
    let nominalTargetSec =
      nominalGridIndex
      * SETTLED_LAD_SUBENDOCARDIAL_PRECAPILLARY_R1_HYPEREMIC_RETROGRADE_GATE_V1
        .nominalDtSec;
    while (!(nominalTargetSec > accepted.acceptedTimeSec)) {
      nominalGridIndex += 1;
      nominalTargetSec =
        nominalGridIndex
        * SETTLED_LAD_SUBENDOCARDIAL_PRECAPILLARY_R1_HYPEREMIC_RETROGRADE_GATE_V1
          .nominalDtSec;
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
    const measurementCycleIndex = Math.ceil(
      accepted.acceptedTimeSec
      / SETTLED_LAD_SUBENDOCARDIAL_PRECAPILLARY_R1_HYPEREMIC_RETROGRADE_GATE_V1
        .cycleLengthSec,
    );
    if (
      measurementCycleIndex
      > SETTLED_LAD_SUBENDOCARDIAL_PRECAPILLARY_R1_HYPEREMIC_RETROGRADE_GATE_V1
        .minimumSettlingCycleCount
    ) {
      const cycleStartSec =
        (measurementCycleIndex - 1)
        * SETTLED_LAD_SUBENDOCARDIAL_PRECAPILLARY_R1_HYPEREMIC_RETROGRADE_GATE_V1
          .cycleLengthSec;
      const samples =
        samplesByMeasurementCycle.get(measurementCycleIndex) ?? [];
      samples.push(Object.freeze({
        phaseSec: accepted.acceptedTimeSec - cycleStartSec,
        flowMlPerSec: result.coronaryStep.baseStep.coronaryTrial.diagnostics
          .hydraulics.layerR1FlowMlPerSecByTerritory.LAD.subendocardial,
      }));
      samplesByMeasurementCycle.set(measurementCycleIndex, samples);
      const cycleEndSec =
        measurementCycleIndex
        * SETTLED_LAD_SUBENDOCARDIAL_PRECAPILLARY_R1_HYPEREMIC_RETROGRADE_GATE_V1
          .cycleLengthSec;
      if (accepted.acceptedTimeSec === cycleEndSec) {
        const currentCycleMeasurement = buildMeasurement(
          samples,
          nominalFloor,
          appliedFloor,
          measurementCycleIndex - 1,
          measurementCycleIndex,
        );
        if (previousCycleMeasurement !== null) {
          const convergence = compareConsecutiveCycles(
            previousCycleMeasurement,
            currentCycleMeasurement,
          );
          if (convergence !== null) {
            return Object.freeze({
              ...currentCycleMeasurement,
              convergence,
            });
          }
        }
        previousCycleMeasurement = currentCycleMeasurement;
        samplesByMeasurementCycle.delete(measurementCycleIndex);
      }
    }
  }

  throw new Error(
    "LAD subendocardial precapillary-R1 hyperemic retrograde gate did not "
    + "satisfy consecutive-cycle convergence before the declared maximum",
  );
}

function buildMeasurement(
  samples: readonly FlowSample[],
  nominalFloor: number,
  appliedFloor: number,
  settlingCycleCount: number,
  measurementCycleIndex: number,
): CycleMeasurement {
  const threshold =
    SETTLED_LAD_SUBENDOCARDIAL_PRECAPILLARY_R1_HYPEREMIC_RETROGRADE_GATE_V1
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
      SETTLED_LAD_SUBENDOCARDIAL_PRECAPILLARY_R1_HYPEREMIC_RETROGRADE_GATE_V1
        .gateId,
    nominalDtSec:
      SETTLED_LAD_SUBENDOCARDIAL_PRECAPILLARY_R1_HYPEREMIC_RETROGRADE_GATE_V1
        .nominalDtSec,
    settlingCycleCount,
    measurementCycleIndex,
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

function compareConsecutiveCycles(
  previous: CycleMeasurement,
  current: CycleMeasurement,
): SettledHyperemicRetrogradeGateMeasurementV1["convergence"] | null {
  const nadirMagnitudeRelativeDifference = Math.abs(
    current.nadir.magnitudeMlPerSec - previous.nadir.magnitudeMlPerSec,
  ) / Math.abs(previous.nadir.magnitudeMlPerSec);
  const nadirPhaseDifferenceSec = phaseOnNominalGrid(
    current.nadir.phaseSec - previous.nadir.phaseSec,
  );
  const windowStartDifferenceSec = phaseOnNominalGrid(
    current.window.startPhaseSec - previous.window.startPhaseSec,
  );
  const windowWidthDifferenceSec = phaseOnNominalGrid(
    current.window.widthSec - previous.window.widthSec,
  );
  const nadirMagnitudeRelativeTolerance =
    SETTLED_LAD_SUBENDOCARDIAL_PRECAPILLARY_R1_HYPEREMIC_RETROGRADE_GATE_V1
      .consecutiveCycleNadirRelativeTolerance;
  if (
    nadirMagnitudeRelativeDifference > nadirMagnitudeRelativeTolerance
    || nadirPhaseDifferenceSec !== 0
    || windowStartDifferenceSec !== 0
    || windowWidthDifferenceSec !== 0
  ) return null;
  return Object.freeze({
    criterionId: "consecutive-cycle-four-pin-convergence-v1" as const,
    previousSettlingCycleCount: previous.settlingCycleCount,
    previousMeasurementCycleIndex: previous.measurementCycleIndex,
    nadirMagnitudeRelativeDifference,
    nadirMagnitudeRelativeTolerance,
    nadirPhaseDifferenceSec,
    windowStartDifferenceSec,
    windowWidthDifferenceSec,
    timePinsRequireExactNominalGridAgreement: true as const,
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
  const dt =
    SETTLED_LAD_SUBENDOCARDIAL_PRECAPILLARY_R1_HYPEREMIC_RETROGRADE_GATE_V1
      .nominalDtSec;
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
