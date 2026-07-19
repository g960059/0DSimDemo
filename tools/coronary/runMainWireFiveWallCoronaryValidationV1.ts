import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";

import {
  CORONARY_LAYER_IDS_V1,
  CORONARY_TERRITORY_IDS_V1,
  type CoronaryTerritoryLayerRecordV1,
  type CoronaryTerritoryRecordV1,
} from "@/engine/coronary/typesV1";
import {
  NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1,
} from "@/engine/coronary/topologyPriorV1";
import {
  cyclicEligibleWindowMaskV1,
  cyclicIntervalsMaskV1,
  cyclicTransitionIndicesV1,
  elapsedSamplesSinceLatestCyclicEventV1,
  pairOrderedCoronaryValveEventsV1,
} from "@/engine/coronary/coronaryCycleEventSegmentationV1";
import {
  MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_CLAIM_V1,
  MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V1_ID,
  initializeMainWireFiveWallCoronaryV1,
  stepMainWireFiveWallCoronaryV1,
} from "@/engine/myocardium/MainWireFiveWallCoronaryTransactionV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  normalAdultMainWireRuntimeV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  createMainWireNormalAdultCommonPericardiumV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultCommonPericardiumV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";

const REPORT_SCHEMA =
  "circleheart.main-wire-five-wall-coronary-bounded-validation.v1" as const;
const CYCLE_LENGTH_SEC = 1;

type TerritoryNumbers = CoronaryTerritoryRecordV1<number>;
type LayerNumbers = CoronaryTerritoryLayerRecordV1<number>;
type WallNumbers = Readonly<{ LVFW: number; SEP: number; RVFW: number }>;

type Sample = Readonly<{
  stepIndex: number;
  timeSec: number;
  cyclePhase01: number;
  pressureMmHg: Readonly<{
    Ao: number;
    LV: number;
    RV: number;
    RA: number;
    CS: number;
    perivascularExternal: number;
    postLesionPdByTerritory: TerritoryNumbers;
    intramyocardialByTerritoryLayer: LayerNumbers;
  }>;
  mechanics: Readonly<{
    chamberTransmuralPressureMmHg: Readonly<{ LV: number; RV: number }>;
    landActiveFiberStressPaByWall: WallNumbers;
    effectiveFiberLogStrainByWall: WallNumbers;
  }>;
  flowMlPerSec: Readonly<{
    aorticValve: number;
    mitralValve: number;
    totalCoronaryInlet: number;
    coronarySinusOutlet: number;
    inletByTerritory: TerritoryNumbers;
    arteriolarByTerritoryLayer: LayerNumbers;
    venularByTerritoryLayer: LayerNumbers;
  }>;
  valveOpeningFraction01: Readonly<{
    AoV: number;
    MV: number;
  }>;
  bloodVolumeLedgerMl: Readonly<{
    fixedGlobal: number;
    acceptedNonCoronaryPartition: number;
    acceptedCoronaryPartition: number;
    acceptedGlobal: number;
    acceptedGlobalError: number;
    circulationTrialError: number;
    coronaryTrialLocalError: number;
  }>;
  solver: Readonly<{
    circulationIterations: number;
    circulationLineSearchBacktracks: number;
    circulationFinalScaledResidualInfinityNorm: number;
    circulationMaximumContinuityResidualMl: number;
    circulationJacobianMode: string;
    mechanicsCallbackCalls: number;
    mechanicsCallbackCacheHits: number;
    mechanicsUniqueCandidates: number;
    coronaryNewtonIterations: number;
    coronaryLineSearchBacktracks: number;
    coronaryFinalResidualInfinityNormMl: number;
    mechanicsIterations: number;
    mechanicsResidualNorm: number;
  }>;
}>;

const dtSec = numberArgument("--dt", 0.002);
const beatCountArgument = optionalIntegerArgument("--beats");
const durationSecArgument = optionalNumberArgument("--duration");
if (beatCountArgument !== null && durationSecArgument !== null) {
  throw new Error("provide either --beats or --duration, not both");
}
const requestedDurationSec = beatCountArgument === null
  ? (durationSecArgument ?? 0.1)
  : beatCountArgument * CYCLE_LENGTH_SEC;
const requestedStepCount = requireIntegerStepCount(requestedDurationSec, dtSec);
const outputPath = argument(
  "--output",
  path.resolve(
    "data/myocardium/reports",
    `mainwire-five-wall-coronary-bounded-${requestedStepCount}steps`
      + `-dt${Math.round(dtSec * 1e6)}us-v1.json`,
  ),
);

const runtime = normalAdultMainWireRuntimeV1();
const provider = createCanonicalMainWireNormalAdultFiveWallProviderV1("on");
const pericardium = createMainWireNormalAdultCommonPericardiumV1(
  "on",
  "healthy-slack",
);
const cold = initializeMainWireFiveWallCoronaryV1({
  provider,
  runtime,
  calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  pericardium,
});

let state = cold.acceptedState;
const initialCoronaryBloodVolumeMl = coronaryBloodVolumeMl(
  state.coronary.volumeMlByNode,
);
const samples: Sample[] = [];
let failure: null | Readonly<{
  stepIndex: number;
  candidateTimeSec: number;
  reason: string;
  message: string;
  circulationDiagnostics: unknown;
}> = null;
const wallStartMs = performance.now();

for (let stepIndex = 1; stepIndex <= requestedStepCount; stepIndex += 1) {
  const stepped = stepMainWireFiveWallCoronaryV1(provider, state, {
    dtSec,
    runtime,
    calciumDriveParams: FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
    pericardium,
  });
  if (stepped.converged === false) {
    failure = Object.freeze({
      stepIndex,
      candidateTimeSec: state.acceptedTimeSec + dtSec,
      reason: stepped.circulationFailureReason,
      message: stepped.message,
      circulationDiagnostics: stepped.circulationDiagnostics,
    });
    break;
  }
  state = stepped.acceptedState;
  const hydraulics = stepped.coronaryTrial.diagnostics.hydraulics;
  const acceptedCoronaryPartitionMl = coronaryBloodVolumeMl(
    state.coronary.volumeMlByNode,
  );
  const acceptedGlobalMl = state.circulation.totalBloodVolumeMl
    + acceptedCoronaryPartitionMl;
  samples.push(Object.freeze({
    stepIndex,
    timeSec: state.acceptedTimeSec,
    cyclePhase01: positiveModulo(state.acceptedTimeSec, CYCLE_LENGTH_SEC),
    pressureMmHg: Object.freeze({
      Ao: stepped.circulationTrial.nodeAbsolutePressuresMmHg.Ao,
      LV: stepped.circulationTrial.nodeAbsolutePressuresMmHg.LV,
      RV: stepped.circulationTrial.nodeAbsolutePressuresMmHg.RV,
      RA: stepped.circulationTrial.nodeAbsolutePressuresMmHg.RA,
      CS: hydraulics.absolutePressureMmHgByNode.CS,
      perivascularExternal:
        stepped.coronaryMechanicsCoupling.input.externalPressureMmHg,
      postLesionPdByTerritory: copyTerritory(
        hydraulics.postLesionAbsolutePressureMmHgByTerritory,
      ),
      intramyocardialByTerritoryLayer: copyLayers(
        stepped.intramyocardialPressureMmHgByTerritoryLayer,
      ),
    }),
    mechanics: Object.freeze({
      chamberTransmuralPressureMmHg: Object.freeze({
        ...stepped.coronaryMechanicsCoupling.input
          .chamberTransmuralPressureMmHg,
      }),
      landActiveFiberStressPaByWall: Object.freeze({
        ...stepped.coronaryMechanicsCoupling.input
          .landActiveFiberStressPaByWall,
      }),
      effectiveFiberLogStrainByWall: Object.freeze({
        ...stepped.coronaryMechanicsCoupling.effectiveFiberLogStrainByWall,
      }),
    }),
    flowMlPerSec: Object.freeze({
      aorticValve: stepped.circulationTrial.edgeFlowsMlPerSec.AoV,
      mitralValve: stepped.circulationTrial.edgeFlowsMlPerSec.MV,
      totalCoronaryInlet: hydraulics.totalInletFlowMlPerSec,
      coronarySinusOutlet: hydraulics.coronarySinusOutletFlowMlPerSec,
      inletByTerritory: copyTerritory(hydraulics.inletFlowMlPerSecByTerritory),
      arteriolarByTerritoryLayer: copyLayers(
        hydraulics.layerArteriolarFlowMlPerSecByTerritory,
      ),
      venularByTerritoryLayer: copyLayers(
        hydraulics.layerVenularFlowMlPerSecByTerritory,
      ),
    }),
    valveOpeningFraction01: Object.freeze({
      AoV: stepped.circulationTrial.candidateValveStates.AoV
        .leafletOpeningFraction01,
      MV: stepped.circulationTrial.candidateValveStates.MV
        .leafletOpeningFraction01,
    }),
    bloodVolumeLedgerMl: Object.freeze({
      fixedGlobal: state.fixedGlobalTotalBloodVolumeMl,
      acceptedNonCoronaryPartition: state.circulation.totalBloodVolumeMl,
      acceptedCoronaryPartition: acceptedCoronaryPartitionMl,
      acceptedGlobal: acceptedGlobalMl,
      acceptedGlobalError: acceptedGlobalMl
        - state.fixedGlobalTotalBloodVolumeMl,
      circulationTrialError:
        stepped.circulationTrial.diagnostics.totalBloodVolumeErrorMl,
      coronaryTrialLocalError:
        stepped.coronaryTrial.diagnostics.exactBloodVolumeLedgerResidualMl,
    }),
    solver: Object.freeze({
      circulationIterations: stepped.circulationTrial.diagnostics.iterations,
      circulationLineSearchBacktracks:
        stepped.circulationTrial.diagnostics.lineSearchBacktracks,
      circulationFinalScaledResidualInfinityNorm:
        stepped.circulationTrial.diagnostics.finalScaledResidualInfinityNorm,
      circulationMaximumContinuityResidualMl:
        stepped.circulationTrial.diagnostics.finalMaximumContinuityResidualMl,
      circulationJacobianMode:
        stepped.circulationTrial.diagnostics.jacobianMode,
      mechanicsCallbackCalls:
        stepped.circulationTrial.diagnostics.mechanicsCallbackCallCount,
      mechanicsCallbackCacheHits:
        stepped.circulationTrial.diagnostics.mechanicsCallbackCacheHitCount,
      mechanicsUniqueCandidates:
        stepped.circulationTrial.diagnostics.mechanicsCallbackUniqueCandidateCount,
      coronaryNewtonIterations:
        stepped.coronaryTrial.diagnostics.newtonIterations,
      coronaryLineSearchBacktracks:
        stepped.coronaryTrial.diagnostics.totalLineSearchBacktracks,
      coronaryFinalResidualInfinityNormMl:
        stepped.coronaryTrial.diagnostics.finalResidualInfinityNormMl,
      mechanicsIterations: stepped.mechanicsTrial.diagnostics.iterationCount,
      mechanicsResidualNorm: stepped.mechanicsTrial.diagnostics.residualNorm,
    }),
  }));
}

const wallClockDurationMs = performance.now() - wallStartMs;
const completed = failure === null && samples.length === requestedStepCount;
const stepsPerBeat = Math.round(CYCLE_LENGTH_SEC / dtSec);
const retainedSamples = samples.length <= stepsPerBeat
  ? samples
  : samples.slice(-stepsPerBeat);
const completedWholeBeatCount = Math.floor(samples.length / stepsPerBeat);
const beatSummaries = Object.freeze(Array.from(
  { length: completedWholeBeatCount },
  (_, zeroBasedBeatIndex) => {
    const beatSamples = samples.slice(
      zeroBasedBeatIndex * stepsPerBeat,
      (zeroBasedBeatIndex + 1) * stepsPerBeat,
    );
    return Object.freeze({
      beatIndex: zeroBasedBeatIndex + 1,
      startTimeExclusiveSec: zeroBasedBeatIndex * CYCLE_LENGTH_SEC,
      endTimeInclusiveSec: (zeroBasedBeatIndex + 1) * CYCLE_LENGTH_SEC,
      summary: summarize(beatSamples),
    });
  },
));
const report = Object.freeze({
  schema: REPORT_SCHEMA,
  diagnosticsVersion: 2 as const,
  transactionId: MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_V1_ID,
  configuration: Object.freeze({
    providerId: provider.providerId,
    providerParameterSetId: provider.parameterSetId,
    fullLandKernel: true,
    leftAtrialSlsMode: "on" as const,
    triSegMechanics: "membrane-only" as const,
    commonPericardiumMode: "on" as const,
    commonPericardiumCase: "healthy-slack" as const,
    pericardiumParameterSetId: pericardium.parameterSetId,
    fixedGlobalTotalBloodVolumeMl: state.fixedGlobalTotalBloodVolumeMl,
    dtSec,
    cycleLengthSec: CYCLE_LENGTH_SEC,
    coronaryReferenceMyocardialMassG:
      NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1
        .bloodVolumeAndFlowConstruction.referenceVentricularMyocardialMassG,
    targetTotalRestingCoronaryFlowMlPerMin:
      NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1
        .bloodVolumeAndFlowConstruction.targetTotalRestingFlowMlPerMin,
    requestedDurationSec,
    requestedStepCount,
    retainedAcceptedStepSamples: retainedSamples.length,
    retainedSamplePolicy: samples.length <= stepsPerBeat
      ? "all-accepted-steps"
      : "last-complete-beat-at-full-dt-resolution",
    wallClockTimingExcludedFromArtifactForDeterminism: true,
  }),
  claim: MAIN_WIRE_FIVE_WALL_CORONARY_TRANSACTION_CLAIM_V1,
  completed,
  completedStepCount: samples.length,
  completedDurationSec: samples.length * dtSec,
  failure,
  initialLedgerMl: Object.freeze({
    fixedGlobal: cold.acceptedState.fixedGlobalTotalBloodVolumeMl,
    nonCoronaryPartition: cold.acceptedState.circulation.totalBloodVolumeMl,
    coronaryPartition: initialCoronaryBloodVolumeMl,
    global: cold.acceptedState.circulation.totalBloodVolumeMl
      + initialCoronaryBloodVolumeMl,
  }),
  summary: summarize(samples),
  beatSummaries,
  samples: Object.freeze(retainedSamples),
});

mkdirSync(path.dirname(outputPath), { recursive: true });
// Validation reports are machine artifacts. Keep the checked-in representation
// compact so one terminal beat at full dt resolution does not dominate review
// diffs; the renderer and jq remain the human inspection paths.
writeFileSync(outputPath, `${JSON.stringify(report)}\n`);
process.stdout.write(`${JSON.stringify({
  outputPath,
  completed,
  requestedStepCount,
  completedStepCount: samples.length,
  wallClockDurationMs,
  meanWallClockMsPerAcceptedStep: samples.length === 0
    ? null
    : wallClockDurationMs / samples.length,
  simulatedSecondsPerWallSecond: wallClockDurationMs === 0
    ? null
    : samples.length * dtSec / (wallClockDurationMs / 1_000),
  failure,
  summary: report.summary,
}, null, 2)}\n`);
if (!completed) process.exitCode = 1;

function summarize(samplesToSummarize: readonly Sample[]): unknown {
  if (samplesToSummarize.length === 0) return null;
  const maxAbs = (values: readonly number[]): number =>
    Math.max(...values.map((value) => Math.abs(value)));
  const range = (values: readonly number[]) => Object.freeze({
    minimum: Math.min(...values),
    maximum: Math.max(...values),
  });
  const sum = (values: readonly number[]) =>
    values.reduce((total, value) => total + value, 0);
  const meanPerMin = (values: readonly number[]) =>
    sum(values) / values.length * 60;
  const summarizedDurationSec = samplesToSummarize.length * dtSec;
  const aorticForwardVolumeMl = sum(samplesToSummarize.map(
    (sample) => Math.max(0, sample.flowMlPerSec.aorticValve) * dtSec,
  ));
  const aorticReverseVolumeMl = sum(samplesToSummarize.map(
    (sample) => Math.max(0, -sample.flowMlPerSec.aorticValve) * dtSec,
  ));
  const aorticNetCardiacOutputMlPerMin = summarizedDurationSec === 0
    ? null
    : (aorticForwardVolumeMl - aorticReverseVolumeMl)
      / summarizedDurationSec * 60;
  const meanTotalCoronaryInletMlPerMin = meanPerMin(
    samplesToSummarize.map(
      (sample) => sample.flowMlPerSec.totalCoronaryInlet,
    ),
  );
  const referenceMyocardialMassG =
    NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1
      .bloodVolumeAndFlowConstruction.referenceVentricularMyocardialMassG;
  const targetTotalRestingFlowMlPerMin =
    NORMAL_ADULT_CORONARY_TOPOLOGY_PRIOR_V1
      .bloodVolumeAndFlowConstruction.targetTotalRestingFlowMlPerMin;
  const territoryRange = (
    read: (sample: Sample, territoryId: keyof TerritoryNumbers) => number,
  ) => Object.freeze(Object.fromEntries(CORONARY_TERRITORY_IDS_V1.map(
    (territoryId) => [
      territoryId,
      range(samplesToSummarize.map((sample) => read(sample, territoryId))),
    ],
  )));
  const layerRange = (
    read: (
      sample: Sample,
      territoryId: keyof LayerNumbers,
      layerId: "subepicardial" | "subendocardial",
    ) => number,
  ) => Object.freeze(Object.fromEntries(CORONARY_TERRITORY_IDS_V1.map(
    (territoryId) => [territoryId, Object.freeze(Object.fromEntries(
      CORONARY_LAYER_IDS_V1.map((layerId) => [
        layerId,
        range(samplesToSummarize.map(
          (sample) => read(sample, territoryId, layerId),
        )),
      ]),
    ))],
  )));
  return Object.freeze({
    timeSec: range(samplesToSummarize.map((sample) => sample.timeSec)),
    pressureMmHg: Object.freeze({
      Ao: range(samplesToSummarize.map((sample) => sample.pressureMmHg.Ao)),
      LV: range(samplesToSummarize.map((sample) => sample.pressureMmHg.LV)),
      RV: range(samplesToSummarize.map((sample) => sample.pressureMmHg.RV)),
      RA: range(samplesToSummarize.map((sample) => sample.pressureMmHg.RA)),
      CS: range(samplesToSummarize.map((sample) => sample.pressureMmHg.CS)),
      perivascularExternal: range(samplesToSummarize.map(
        (sample) => sample.pressureMmHg.perivascularExternal,
      )),
      postLesionPdByTerritory: territoryRange(
        (sample, territoryId) =>
          sample.pressureMmHg.postLesionPdByTerritory[territoryId],
      ),
      intramyocardialByTerritoryLayer: layerRange(
        (sample, territoryId, layerId) =>
          sample.pressureMmHg.intramyocardialByTerritoryLayer[territoryId][layerId],
      ),
    }),
    flowMlPerSec: Object.freeze({
      aorticValve: range(samplesToSummarize.map(
        (sample) => sample.flowMlPerSec.aorticValve,
      )),
      mitralValve: range(samplesToSummarize.map(
        (sample) => sample.flowMlPerSec.mitralValve,
      )),
      totalCoronaryInlet: range(samplesToSummarize.map(
        (sample) => sample.flowMlPerSec.totalCoronaryInlet,
      )),
      coronarySinusOutlet: range(samplesToSummarize.map(
        (sample) => sample.flowMlPerSec.coronarySinusOutlet,
      )),
      inletByTerritory: territoryRange(
        (sample, territoryId) =>
          sample.flowMlPerSec.inletByTerritory[territoryId],
      ),
      arteriolarByTerritoryLayer: layerRange(
        (sample, territoryId, layerId) =>
          sample.flowMlPerSec.arteriolarByTerritoryLayer[territoryId][layerId],
      ),
      venularByTerritoryLayer: layerRange(
        (sample, territoryId, layerId) =>
          sample.flowMlPerSec.venularByTerritoryLayer[territoryId][layerId],
      ),
      signedInletVolumeOverRunMl: sum(samplesToSummarize.map(
        (sample) => sample.flowMlPerSec.totalCoronaryInlet * dtSec,
      )),
      signedSinusOutletVolumeOverRunMl: sum(samplesToSummarize.map(
        (sample) => sample.flowMlPerSec.coronarySinusOutlet * dtSec,
      )),
      signedBoundaryNetStorageChangeOverRunMl: sum(samplesToSummarize.map(
        (sample) => (
          sample.flowMlPerSec.totalCoronaryInlet
            - sample.flowMlPerSec.coronarySinusOutlet
        ) * dtSec,
      )),
      aorticForwardVolumeOverRunMl: aorticForwardVolumeMl,
      aorticReverseVolumeOverRunMl: aorticReverseVolumeMl,
      aorticNetCardiacOutputMlPerMin,
      meanTotalCoronaryInletMlPerMin,
      coronaryToNetCardiacOutputFraction01:
        aorticNetCardiacOutputMlPerMin === null
          || aorticNetCardiacOutputMlPerMin <= 0
          ? null
          : meanTotalCoronaryInletMlPerMin
            / aorticNetCardiacOutputMlPerMin,
      massNormalizedCoronaryFlowMlPerMinPerG:
        meanTotalCoronaryInletMlPerMin / referenceMyocardialMassG,
      targetRestingFlowAttainmentFraction01:
        meanTotalCoronaryInletMlPerMin / targetTotalRestingFlowMlPerMin,
      meanCoronarySinusOutletMlPerMin: meanPerMin(samplesToSummarize.map(
        (sample) => sample.flowMlPerSec.coronarySinusOutlet,
      )),
      meanInletMlPerMinByTerritory: Object.freeze(Object.fromEntries(
        CORONARY_TERRITORY_IDS_V1.map((territoryId) => [
          territoryId,
          meanPerMin(samplesToSummarize.map(
            (sample) => sample.flowMlPerSec.inletByTerritory[territoryId],
          )),
        ]),
      )),
      meanArteriolarMlPerMinByTerritoryLayer: Object.freeze(Object.fromEntries(
        CORONARY_TERRITORY_IDS_V1.map((territoryId) => [
          territoryId,
          Object.freeze(Object.fromEntries(CORONARY_LAYER_IDS_V1.map(
            (layerId) => [
              layerId,
              meanPerMin(samplesToSummarize.map(
                (sample) => sample.flowMlPerSec
                  .arteriolarByTerritoryLayer[territoryId][layerId],
              )),
            ],
          ))),
        ]),
      )),
      meanArteriolarEndocardialToEpicardialFlowRatioByTerritory:
        Object.freeze(Object.fromEntries(CORONARY_TERRITORY_IDS_V1.map(
          (territoryId) => {
            const epicardial = meanPerMin(samplesToSummarize.map(
              (sample) => sample.flowMlPerSec
                .arteriolarByTerritoryLayer[territoryId].subepicardial,
            ));
            const endocardial = meanPerMin(samplesToSummarize.map(
              (sample) => sample.flowMlPerSec
                .arteriolarByTerritoryLayer[territoryId].subendocardial,
            ));
            return [territoryId, endocardial / epicardial];
          },
        ))),
    }),
    phasicCoronaryFlow: summarizePhasicCoronaryFlow(samplesToSummarize),
    maximumAbsoluteLedgerErrorMl: Object.freeze({
      globalAccepted: maxAbs(samplesToSummarize.map(
        (sample) => sample.bloodVolumeLedgerMl.acceptedGlobalError,
      )),
      circulationTrial: maxAbs(samplesToSummarize.map(
        (sample) => sample.bloodVolumeLedgerMl.circulationTrialError,
      )),
      coronaryLocalTrial: maxAbs(samplesToSummarize.map(
        (sample) => sample.bloodVolumeLedgerMl.coronaryTrialLocalError,
      )),
    }),
    solver: Object.freeze({
      totalMechanicsCallbackCalls: sum(samplesToSummarize.map(
        (sample) => sample.solver.mechanicsCallbackCalls,
      )),
      totalMechanicsCallbackCacheHits: sum(samplesToSummarize.map(
        (sample) => sample.solver.mechanicsCallbackCacheHits,
      )),
      totalMechanicsUniqueCandidates: sum(samplesToSummarize.map(
        (sample) => sample.solver.mechanicsUniqueCandidates,
      )),
      circulationIterations: range(samplesToSummarize.map(
        (sample) => sample.solver.circulationIterations,
      )),
      coronaryNewtonIterations: range(samplesToSummarize.map(
        (sample) => sample.solver.coronaryNewtonIterations,
      )),
      mechanicsIterations: range(samplesToSummarize.map(
        (sample) => sample.solver.mechanicsIterations,
      )),
      maximumCirculationScaledResidualInfinityNorm: Math.max(
        ...samplesToSummarize.map(
          (sample) => sample.solver.circulationFinalScaledResidualInfinityNorm,
        ),
      ),
      maximumCoronaryResidualInfinityNormMl: Math.max(
        ...samplesToSummarize.map(
          (sample) => sample.solver.coronaryFinalResidualInfinityNormMl,
        ),
      ),
    }),
  });
}

function summarizePhasicCoronaryFlow(
  samplesToSummarize: readonly Sample[],
): unknown {
  const peakForwardAorticValveFlowMlPerSec = Math.max(
    ...samplesToSummarize.map((sample) =>
      Math.max(0, sample.flowMlPerSec.aorticValve)),
  );
  // Keep the phase owner identical to the established main-wire morphology
  // diagnostics: 1% of peak forward AoV flow with a 1 mL/s floor.
  const aorticValveForwardFlowThresholdMlPerSec = Math.max(
    1,
    0.01 * peakForwardAorticValveFlowMlPerSec,
  );
  const peakForwardMitralValveFlowMlPerSec = Math.max(
    ...samplesToSummarize.map((sample) =>
      Math.max(0, sample.flowMlPerSec.mitralValve)),
  );
  const mitralValveForwardFlowThresholdMlPerSec = Math.max(
    1,
    0.01 * peakForwardMitralValveFlowMlPerSec,
  );
  const aorticValveOpenMask = samplesToSummarize.map((sample) =>
    sample.flowMlPerSec.aorticValve
      > aorticValveForwardFlowThresholdMlPerSec);
  const mitralValveOpenMask = samplesToSummarize.map((sample) =>
    sample.flowMlPerSec.mitralValve
      > mitralValveForwardFlowThresholdMlPerSec);
  const aorticOpeningIndices = cyclicTransitionIndicesV1(
    aorticValveOpenMask,
    false,
    true,
  );
  const aorticClosingIndices = cyclicTransitionIndicesV1(
    aorticValveOpenMask,
    true,
    false,
  );
  const mitralClosingIndices = cyclicTransitionIndicesV1(
    mitralValveOpenMask,
    true,
    false,
  );
  const orderedValveEvents = pairOrderedCoronaryValveEventsV1(
    samplesToSummarize.length,
    mitralClosingIndices,
    aorticOpeningIndices,
    aorticClosingIndices,
  );
  const pairedMitralClosingIndices = orderedValveEvents.map(
    (event) => event.mitralClosingIndex,
  );
  const pairedAorticOpeningIndices = orderedValveEvents.map(
    (event) => event.aorticOpeningIndex,
  );
  const pairedAorticClosingIndices = orderedValveEvents.map(
    (event) => event.aorticClosingIndex,
  );
  const orderedEventPairingAccepted = orderedValveEvents.length > 0
    && orderedValveEvents.length === mitralClosingIndices.length
    && orderedValveEvents.length === aorticOpeningIndices.length
    && orderedValveEvents.length === aorticClosingIndices.length;
  const eventDurationEnvelopeAccepted = orderedEventPairingAccepted
    && orderedValveEvents.every((event) => {
      const isovolumicContractionSec = event.mitralToAorticOpeningSamples
        * dtSec;
      const ejectionDurationSec = event.aorticEjectionSamples * dtSec;
      const systolicDurationSec = event.mitralToAorticClosureSamples * dtSec;
      return isovolumicContractionSec >= 0.01
        && isovolumicContractionSec <= 0.25
        && ejectionDurationSec >= 0.08
        && ejectionDurationSec <= 0.60
        && systolicDurationSec >= 0.12
        && systolicDurationSec <= 0.70;
    });
  // Physiology owns systole: mitral closure through aortic closure.  AoV
  // forward flow only owns the narrower ejection interval.  Keeping these
  // masks separate prevents a long isovolumic interval from being silently
  // counted as diastole when coronary D/S morphology is evaluated.
  const systolicMask = cyclicIntervalsMaskV1(
    samplesToSummarize.length,
    pairedMitralClosingIndices,
    pairedAorticClosingIndices,
  );
  const systolicIndices = indicesWhere(systolicMask, true);
  const diastolicIndices = indicesWhere(systolicMask, false);
  const ejectionIndices = indicesWhere(aorticValveOpenMask, true);
  const nonEjectionIndices = indicesWhere(aorticValveOpenMask, false);
  const earlyDiastolicWindowSec = 0.2;
  const earlyDiastolicMask = cyclicEligibleWindowMaskV1(
    samplesToSummarize.length,
    pairedAorticClosingIndices,
    Math.round(earlyDiastolicWindowSec / dtSec),
    systolicMask.map((isSystole) => !isSystole),
  );
  const earlyDiastolicIndices = indicesWhere(earlyDiastolicMask, true);
  const flowLedger = (
    indices: readonly number[],
    read: (sample: Sample) => number,
  ) => {
    let forwardVolumeMl = 0;
    let reverseVolumeMl = 0;
    let peakForwardMlPerSec = 0;
    let peakReverseMlPerSec = 0;
    let peakForwardIndex: number | null = null;
    let peakReverseIndex: number | null = null;
    for (const index of indices) {
      const flowMlPerSec = read(samplesToSummarize[index]!);
      forwardVolumeMl += Math.max(0, flowMlPerSec) * dtSec;
      reverseVolumeMl += Math.max(0, -flowMlPerSec) * dtSec;
      if (flowMlPerSec > peakForwardMlPerSec) {
        peakForwardMlPerSec = flowMlPerSec;
        peakForwardIndex = index;
      }
      if (-flowMlPerSec > peakReverseMlPerSec) {
        peakReverseMlPerSec = -flowMlPerSec;
        peakReverseIndex = index;
      }
    }
    const durationSec = indices.length * dtSec;
    return Object.freeze({
      durationSec,
      forwardVolumeMl,
      reverseVolumeMl,
      meanForwardFlowMlPerSec: durationSec === 0
        ? null
        : forwardVolumeMl / durationSec,
      meanReverseFlowMlPerSec: durationSec === 0
        ? null
        : reverseVolumeMl / durationSec,
      peakForwardFlowMlPerSec: peakForwardMlPerSec,
      peakReverseFlowMlPerSec: peakReverseMlPerSec,
      peakForwardPhase01: peakForwardIndex === null
        ? null
        : samplesToSummarize[peakForwardIndex]!.cyclePhase01,
      peakReversePhase01: peakReverseIndex === null
        ? null
        : samplesToSummarize[peakReverseIndex]!.cyclePhase01,
    });
  };
  const phasicLedger = (
    read: (sample: Sample) => number,
    netCycleFractionApplicable = true,
  ) => {
    const systole = flowLedger(systolicIndices, read);
    const diastole = flowLedger(diastolicIndices, read);
    const earlyDiastole = flowLedger(earlyDiastolicIndices, read);
    const ejection = flowLedger(ejectionIndices, read);
    const nonEjection = flowLedger(nonEjectionIndices, read);
    const totalForwardVolumeMl =
      systole.forwardVolumeMl + diastole.forwardVolumeMl;
    const totalSignedVolumeMl = totalForwardVolumeMl
      - systole.reverseVolumeMl
      - diastole.reverseVolumeMl;
    const totalGrossVolumeMl = totalForwardVolumeMl
      + systole.reverseVolumeMl
      + diastole.reverseVolumeMl;
    const signedVolumeIsResolved = Math.abs(totalSignedVolumeMl)
      > 1e-6 * Math.max(totalGrossVolumeMl, Number.EPSILON);
    let diastolicForwardCentroidNumeratorMlSec = 0;
    let diastolicForwardCentroidDenominatorMl = 0;
    for (const index of diastolicIndices) {
      const forwardFlowMlPerSec = Math.max(
        0,
        read(samplesToSummarize[index]!),
      );
      const elapsedSamples = elapsedSamplesSinceLatestCyclicEventV1(
        index,
        pairedAorticClosingIndices,
        samplesToSummarize.length,
      );
      if (elapsedSamples === null) continue;
      const forwardVolumeMl = forwardFlowMlPerSec * dtSec;
      diastolicForwardCentroidNumeratorMlSec +=
        forwardVolumeMl * elapsedSamples * dtSec;
      diastolicForwardCentroidDenominatorMl += forwardVolumeMl;
    }
    const aorticClosurePhase01 = meanCyclePhase01(
      samplesToSummarize,
      pairedAorticClosingIndices,
    );
    return Object.freeze({
      systole,
      diastole,
      earlyDiastole,
      ejection,
      nonEjection,
      diastolicForwardVolumeFraction01: totalForwardVolumeMl === 0
        ? null
        : diastole.forwardVolumeMl / totalForwardVolumeMl,
      systolicForwardVolumeFraction01: totalForwardVolumeMl === 0
        ? null
        : systole.forwardVolumeMl / totalForwardVolumeMl,
      diastolicNetVolumeFraction01:
        !netCycleFractionApplicable || !signedVolumeIsResolved
        ? null
        : (diastole.forwardVolumeMl - diastole.reverseVolumeMl)
          / totalSignedVolumeMl,
      diastolicSignedVolumeFractionOfGross01: totalGrossVolumeMl === 0
        ? null
        : (diastole.forwardVolumeMl - diastole.reverseVolumeMl)
          / totalGrossVolumeMl,
      earlyDiastolicForwardVolumeFractionOfDiastole01:
        diastole.forwardVolumeMl === 0
          ? null
          : earlyDiastole.forwardVolumeMl / diastole.forwardVolumeMl,
      diastolicForwardFlowCentroidAfterAorticClosureSec:
        diastolicForwardCentroidDenominatorMl === 0
          ? null
          : diastolicForwardCentroidNumeratorMlSec
            / diastolicForwardCentroidDenominatorMl,
      meanDiastolicToSystolicForwardFlowRatio:
        positiveRatio(
          diastole.meanForwardFlowMlPerSec,
          systole.meanForwardFlowMlPerSec,
        ),
      peakDiastolicToSystolicForwardFlowRatio:
        positiveRatio(
          diastole.peakForwardFlowMlPerSec,
          systole.peakForwardFlowMlPerSec,
        ),
      diastolicPeakDelayAfterAorticClosureSec:
        aorticClosurePhase01 === null
          || diastole.peakForwardPhase01 === null
          ? null
          : positiveModulo(
            diastole.peakForwardPhase01 - aorticClosurePhase01,
            1,
          ) * CYCLE_LENGTH_SEC,
    });
  };
  const territory = Object.freeze(Object.fromEntries(
    CORONARY_TERRITORY_IDS_V1.map((territoryId) => [
      territoryId,
      phasicLedger(
        (sample) => sample.flowMlPerSec.inletByTerritory[territoryId],
      ),
    ]),
  ));
  const ladDiastolicFraction = territory.LAD
    .diastolicForwardVolumeFraction01;
  const lcxDiastolicFraction = territory.LCx
    .diastolicForwardVolumeFraction01;
  const rcaDiastolicFraction = territory.RCA
    .diastolicForwardVolumeFraction01;
  const ladPeakRatio = territory.LAD
    .peakDiastolicToSystolicForwardFlowRatio;
  const lcxPeakRatio = territory.LCx
    .peakDiastolicToSystolicForwardFlowRatio;
  const rcaPeakRatio = territory.RCA
    .peakDiastolicToSystolicForwardFlowRatio;
  const leftCoronaryMoreDiastolicThanRca =
    ladDiastolicFraction !== null
    && lcxDiastolicFraction !== null
    && rcaDiastolicFraction !== null
    && 0.5 * (ladDiastolicFraction + lcxDiastolicFraction)
      > rcaDiastolicFraction;
  const leftCoronaryPeakRatioExceedsRca = ladPeakRatio !== null
    && lcxPeakRatio !== null
    && rcaPeakRatio !== null
    && 0.5 * (ladPeakRatio + lcxPeakRatio) > rcaPeakRatio;
  const territoryDistalArterialStorage = Object.freeze(Object.fromEntries(
    CORONARY_TERRITORY_IDS_V1.map((territoryId) => [
      territoryId,
      phasicLedger((sample) => sample.flowMlPerSec.inletByTerritory[territoryId]
        - CORONARY_LAYER_IDS_V1.reduce(
          (total, layerId) => total + sample.flowMlPerSec
            .arteriolarByTerritoryLayer[territoryId][layerId],
          0,
        ), false),
    ]),
  ));
  const layerArteriolar = Object.freeze(Object.fromEntries(
    CORONARY_TERRITORY_IDS_V1.map((territoryId) => [
      territoryId,
      Object.freeze(Object.fromEntries(CORONARY_LAYER_IDS_V1.map(
        (layerId) => [
          layerId,
          phasicLedger((sample) => sample.flowMlPerSec
            .arteriolarByTerritoryLayer[territoryId][layerId]),
        ],
      ))),
    ]),
  ));
  const sinus = phasicLedger(
    (sample) => sample.flowMlPerSec.coronarySinusOutlet,
  );
  const sinusPeakMagnitudeMlPerSec = Math.max(
    0,
    ...samplesToSummarize.map(
      (sample) => Math.abs(sample.flowMlPerSec.coronarySinusOutlet),
    ),
  );
  const sinusReverseFlowThresholdMlPerSec = Math.max(
    0.01,
    1e-3 * sinusPeakMagnitudeMlPerSec,
  );
  const sinusReverseSampleCount = samplesToSummarize.filter(
    (sample) => sample.flowMlPerSec.coronarySinusOutlet
      < -sinusReverseFlowThresholdMlPerSec,
  ).length;
  const eventCycleCount = orderedValveEvents.length;
  const eventSegmentationAccepted = orderedEventPairingAccepted
    && eventDurationEnvelopeAccepted;
  return Object.freeze({
    phaseDefinition: Object.freeze({
      owner:
        "mitral-closure-to-aortic-closure-forward-flow-thresholds" as const,
      ejectionOwner: "aortic-valve-forward-flow-threshold" as const,
      eventSegmentationAccepted,
      orderedEventPairingAccepted,
      eventDurationEnvelopeAccepted,
      eventCycleCount,
      peakForwardAorticValveFlowMlPerSec,
      aorticValveForwardFlowThresholdMlPerSec,
      peakForwardMitralValveFlowMlPerSec,
      mitralValveForwardFlowThresholdMlPerSec,
      mitralClosingTransitionCount: mitralClosingIndices.length,
      aorticOpeningTransitionCount: aorticOpeningIndices.length,
      aorticClosingTransitionCount: aorticClosingIndices.length,
      totalSystolicDurationSec: systolicIndices.length * dtSec,
      totalDiastolicDurationSec: diastolicIndices.length * dtSec,
      meanSystolicDurationSec: eventCycleCount === 0
        ? null
        : systolicIndices.length * dtSec / eventCycleCount,
      meanDiastolicDurationSec: eventCycleCount === 0
        ? null
        : diastolicIndices.length * dtSec / eventCycleCount,
      mitralClosurePhase01: meanCyclePhase01(
        samplesToSummarize,
        pairedMitralClosingIndices,
      ),
      aorticOpeningPhase01: meanCyclePhase01(
        samplesToSummarize,
        pairedAorticOpeningIndices,
      ),
      aorticClosurePhase01: meanCyclePhase01(
        samplesToSummarize,
        pairedAorticClosingIndices,
      ),
      // Explicit compatibility aliases: these remain ejection events, never
      // the owner of the systole/diastole ledger above.
      openingPhase01: meanCyclePhase01(
        samplesToSummarize,
        pairedAorticOpeningIndices,
      ),
      closingPhase01: meanCyclePhase01(
        samplesToSummarize,
        pairedAorticClosingIndices,
      ),
    }),
    territory,
    territoryOrdering: Object.freeze({
      leftCoronaryMoreDiastolicThanRca,
      leftCoronaryPeakRatioExceedsRca,
      reviewOnlyNotHardGate: true as const,
    }),
    territoryDistalArterialStorage,
    layerArteriolar,
    coronarySinus: Object.freeze({
      ...sinus,
      reverseFlowThresholdMlPerSec: sinusReverseFlowThresholdMlPerSec,
      reverseDurationSec: sinusReverseSampleCount * dtSec,
      reverseSampleFraction01:
        sinusReverseSampleCount / samplesToSummarize.length,
    }),
  });
}

function indicesWhere(
  values: readonly boolean[],
  target: boolean,
): readonly number[] {
  return Object.freeze(values.flatMap(
    (value, index) => value === target ? [index] : [],
  ));
}

function meanCyclePhase01(
  samplesToSummarize: readonly Sample[],
  indices: readonly number[],
): number | null {
  if (indices.length === 0) return null;
  const meanCos = indices.reduce((sum, index) => sum + Math.cos(
    2 * Math.PI * samplesToSummarize[index]!.cyclePhase01,
  ), 0) / indices.length;
  const meanSin = indices.reduce((sum, index) => sum + Math.sin(
    2 * Math.PI * samplesToSummarize[index]!.cyclePhase01,
  ), 0) / indices.length;
  if (Math.hypot(meanCos, meanSin) < 1e-12) return null;
  return positiveModulo(Math.atan2(meanSin, meanCos) / (2 * Math.PI), 1);
}

function positiveRatio(
  numerator: number | null,
  denominator: number | null,
): number | null {
  if (numerator === null || denominator === null || !(denominator > 0)) {
    return null;
  }
  return numerator / denominator;
}

function copyTerritory(
  values: CoronaryTerritoryRecordV1<number>,
): TerritoryNumbers {
  return Object.freeze(Object.fromEntries(CORONARY_TERRITORY_IDS_V1.map(
    (territoryId) => [territoryId, values[territoryId]],
  ))) as TerritoryNumbers;
}

function copyLayers(
  values: CoronaryTerritoryLayerRecordV1<number>,
): LayerNumbers {
  return Object.freeze(Object.fromEntries(CORONARY_TERRITORY_IDS_V1.map(
    (territoryId) => [territoryId, Object.freeze(Object.fromEntries(
      CORONARY_LAYER_IDS_V1.map(
        (layerId) => [layerId, values[territoryId][layerId]],
      ),
    ))],
  ))) as LayerNumbers;
}

function coronaryBloodVolumeMl(
  volumeMlByNode: Readonly<Record<string, number>>,
): number {
  return Object.values(volumeMlByNode).reduce(
    (sum, volumeMl) => sum + volumeMl,
    0,
  );
}

function positiveModulo(value: number, modulus: number): number {
  const result = value % modulus;
  return result < 0 ? result + modulus : result;
}

function requireIntegerStepCount(durationSec: number, stepDtSec: number): number {
  if (!(durationSec > 0) || !Number.isFinite(durationSec)) {
    throw new Error("requested duration must be positive and finite");
  }
  if (!(stepDtSec > 0) || !Number.isFinite(stepDtSec)) {
    throw new Error("--dt must be positive and finite");
  }
  const stepCount = durationSec / stepDtSec;
  if (Math.abs(stepCount - Math.round(stepCount)) > 1e-10) {
    throw new Error("requested duration must be an integer multiple of --dt");
  }
  return Math.round(stepCount);
}

function argument(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function optionalNumberArgument(name: string): number | null {
  const index = process.argv.indexOf(name);
  if (index < 0) return null;
  const value = Number(argument(name, ""));
  if (!Number.isFinite(value)) throw new Error(`${name} must be finite`);
  return value;
}

function numberArgument(name: string, fallback: number): number {
  const value = optionalNumberArgument(name);
  return value ?? fallback;
}

function optionalIntegerArgument(name: string): number | null {
  const value = optionalNumberArgument(name);
  if (value !== null && (!Number.isInteger(value) || value <= 0)) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}
