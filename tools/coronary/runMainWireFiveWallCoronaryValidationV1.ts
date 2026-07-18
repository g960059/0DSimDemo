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

type Sample = Readonly<{
  stepIndex: number;
  timeSec: number;
  cyclePhase01: number;
  pressureMmHg: Readonly<{
    Ao: number;
    RA: number;
    CS: number;
    postLesionPdByTerritory: TerritoryNumbers;
    intramyocardialByTerritoryLayer: LayerNumbers;
  }>;
  flowMlPerSec: Readonly<{
    totalCoronaryInlet: number;
    coronarySinusOutlet: number;
    inletByTerritory: TerritoryNumbers;
    arteriolarByTerritoryLayer: LayerNumbers;
    venularByTerritoryLayer: LayerNumbers;
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
      RA: stepped.circulationTrial.nodeAbsolutePressuresMmHg.RA,
      CS: hydraulics.absolutePressureMmHgByNode.CS,
      postLesionPdByTerritory: copyTerritory(
        hydraulics.postLesionAbsolutePressureMmHgByTerritory,
      ),
      intramyocardialByTerritoryLayer: copyLayers(
        stepped.intramyocardialPressureMmHgByTerritoryLayer,
      ),
    }),
    flowMlPerSec: Object.freeze({
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
      RA: range(samplesToSummarize.map((sample) => sample.pressureMmHg.RA)),
      CS: range(samplesToSummarize.map((sample) => sample.pressureMmHg.CS)),
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
      meanTotalCoronaryInletMlPerMin: meanPerMin(samplesToSummarize.map(
        (sample) => sample.flowMlPerSec.totalCoronaryInlet,
      )),
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
