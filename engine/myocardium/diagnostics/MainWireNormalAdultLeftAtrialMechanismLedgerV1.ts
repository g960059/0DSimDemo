import type {
  MainWireNormalAdultFiveWallDiagnosticSampleV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";

export const MAIN_WIRE_NORMAL_ADULT_LEFT_ATRIAL_MECHANISM_LEDGER_V1_ID =
  "main-wire-normal-adult-left-atrial-mechanism-ledger-v1" as const;

export const MAIN_WIRE_NORMAL_ADULT_LEFT_ATRIAL_MECHANISM_LEDGER_V1_CLAIM =
  Object.freeze({
    source: "accepted-diagnostic-samples-only" as const,
    pressureLaw: "current-self-similar-one-fiber-atrial-wall" as const,
    pressureAssembly: "exact-additive-current-model-identity" as const,
    pressureIncrementAssembly:
      "exact-midpoint-product-identity-not-effective-elastance-fit" as const,
    lvSuctionChannel:
      "mitral-pressure-gradient-and-flow-to-la-volume-not-independent-la-pressure-term" as const,
    trajectoryAreaQuadrature:
      "trapezoidal-la-absolute-pressure-times-la-volume-increment" as const,
    trajectoryAreaSign:
      "positive-for-positive-pressure-during-la-volume-increase" as const,
    trajectoryAreaStoredEnergyClaimed: false as const,
    commonPericardialBagWorkPartitionClaimed: false as const,
    activeStressStoredEnergyClaimed: false as const,
    addsDynamicState: false as const,
    changesSolverFeedback: false as const,
    parameterFittingAllowed: false as const,
  });

export type LeftAtrialPressureComponentsMmHgV1 = Readonly<{
  equilibriumPassive: number;
  landActive: number;
  parallelSls: number;
  commonIntrathoracic: number;
  commonPericardium: number;
}>;

export type MainWireNormalAdultLeftAtrialMechanismSampleV1 = Readonly<{
  sampleIndex: number;
  timeSec: number;
  cyclePhase01: number;
  leftAtrialVolumeMl: number;
  geometryGainMmHgPerPa: number;
  wallStressPa: Readonly<{
    equilibriumPassive: number;
    landActive: number;
    parallelSls: number;
    total: number;
  }>;
  pressureComponentsMmHg: LeftAtrialPressureComponentsMmHgV1;
  reconstructedTransmuralPressureMmHg: number;
  reportedTransmuralPressureMmHg: number;
  transmuralPressureAssemblyResidualMmHg: number;
  reconstructedAbsolutePressureMmHg: number;
  reportedAbsolutePressureMmHg: number;
  absolutePressureAssemblyResidualMmHg: number;
  circulation: Readonly<{
    pulmonaryVenousInflowMlPerSec: number;
    mitralOutflowMlPerSec: number;
    netLeftAtrialVolumeRateMlPerSec: number;
    pulmonaryVenousToLeftAtrialGradientMmHg: number;
    leftAtrialToLeftVentricularGradientMmHg: number;
  }>;
}>;

export type MainWireNormalAdultLeftAtrialMechanismIntervalV1 = Readonly<{
  previousSampleIndex: number;
  currentSampleIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  dtSec: number;
  leftAtrialVolumeIncrementMl: number;
  finiteDifferenceVolumeRateMlPerSec: number;
  backwardEulerNetFlowRateMlPerSec: number;
  continuityDefectMlPerSec: number;
  continuityResidualMl: number;
  transmuralPressureIncrementMmHg: Readonly<{
    geometryGain: number;
    equilibriumPassiveStress: number;
    landActiveStress: number;
    parallelSlsStress: number;
    reconstructed: number;
    reported: number;
    assemblyResidual: number;
  }>;
  absolutePressureIncrementMmHg: Readonly<{
    commonIntrathoracic: number;
    commonPericardium: number;
    reconstructed: number;
    reported: number;
    assemblyResidual: number;
  }>;
  trapezoidalLaAbsolutePvTrajectoryAreaAttributionMmHgMl: Readonly<{
    equilibriumPassive: number;
    landActive: number;
    parallelSls: number;
    commonIntrathoracic: number;
    commonPericardium: number;
    reconstructedAbsolute: number;
    reportedAbsolute: number;
    assemblyResidual: number;
  }>;
}>;

export type MainWireNormalAdultLeftAtrialMechanismLedgerV1 = Readonly<{
  ledgerId: typeof MAIN_WIRE_NORMAL_ADULT_LEFT_ATRIAL_MECHANISM_LEDGER_V1_ID;
  wallMaterialVolumeMl: number;
  samples: readonly MainWireNormalAdultLeftAtrialMechanismSampleV1[];
  intervals: readonly MainWireNormalAdultLeftAtrialMechanismIntervalV1[];
  audit: Readonly<{
    maximumAbsoluteTransmuralPressureAssemblyResidualMmHg: number;
    maximumAbsoluteAbsolutePressureAssemblyResidualMmHg: number;
    maximumAbsolutePressureIncrementAssemblyResidualMmHg: number;
    maximumAbsoluteContinuityResidualMl: number;
    totalTrapezoidalLaAbsolutePvTrajectoryAreaAttributionMmHgMl:
      MainWireNormalAdultLeftAtrialMechanismIntervalV1[
        "trapezoidalLaAbsolutePvTrajectoryAreaAttributionMmHgMl"
      ];
  }>;
  claim: typeof MAIN_WIRE_NORMAL_ADULT_LEFT_ATRIAL_MECHANISM_LEDGER_V1_CLAIM;
}>;

export type MainWireNormalAdultLeftAtrialMechanismLedgerInputV1 = Readonly<{
  /** Accepted sample immediately before samples[0]. */
  precedingSample: MainWireNormalAdultFiveWallDiagnosticSampleV2;
  /** One complete, contiguous accepted-step beat. */
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[];
  /** Backward-Euler step size used to produce every accepted sample. */
  dtSec: number;
}>;

const PA_PER_MMHG = 133.322;
const TIME_ADJACENCY_ULP_MULTIPLIER = 64;

/**
 * Decomposes the implemented LA pressure and flow balance without adding an
 * effective-elastance term or any new state. In particular, LV suction can
 * only appear through the LA-LV gradient, mitral flow, and the resulting LA
 * volume change in this model.
 */
export function measureMainWireNormalAdultLeftAtrialMechanismLedgerV1(
  input: MainWireNormalAdultLeftAtrialMechanismLedgerInputV1,
): MainWireNormalAdultLeftAtrialMechanismLedgerV1 {
  const sourceSamples = input.samples;
  if (sourceSamples.length === 0) {
    throw new Error("left-atrial mechanism ledger requires accepted samples");
  }
  if (!(input.dtSec > 0) || !Number.isFinite(input.dtSec)) {
    throw new Error(
      "left-atrial mechanism ledger dtSec must be positive and finite",
    );
  }
  const wallMaterialVolumeMl =
    NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.atria.LA.wallMaterialVolumeMl;
  const precedingSample = instantaneousSample(
    input.precedingSample,
    -1,
    wallMaterialVolumeMl,
  );
  const samples = Object.freeze(sourceSamples.map((source, sampleIndex) =>
    instantaneousSample(source, sampleIndex, wallMaterialVolumeMl)));
  const intervals = Object.freeze(samples.map((current, sampleIndex) =>
    intervalSample(
      sampleIndex === 0 ? precedingSample : samples[sampleIndex - 1]!,
      current,
      input.dtSec,
    )));
  const totalTrajectoryAreaAttribution = sumTrajectoryAreaAttribution(intervals);
  return Object.freeze({
    ledgerId: MAIN_WIRE_NORMAL_ADULT_LEFT_ATRIAL_MECHANISM_LEDGER_V1_ID,
    wallMaterialVolumeMl,
    samples,
    intervals,
    audit: Object.freeze({
      maximumAbsoluteTransmuralPressureAssemblyResidualMmHg: maximumAbsolute(
        samples.map((sample) => sample.transmuralPressureAssemblyResidualMmHg),
      ),
      maximumAbsoluteAbsolutePressureAssemblyResidualMmHg: maximumAbsolute(
        samples.map((sample) => sample.absolutePressureAssemblyResidualMmHg),
      ),
      maximumAbsolutePressureIncrementAssemblyResidualMmHg: maximumAbsolute(
        intervals.map((interval) =>
          interval.absolutePressureIncrementMmHg.assemblyResidual),
      ),
      maximumAbsoluteContinuityResidualMl: maximumAbsolute(
        intervals.map((interval) => interval.continuityResidualMl),
      ),
      totalTrapezoidalLaAbsolutePvTrajectoryAreaAttributionMmHgMl:
        totalTrajectoryAreaAttribution,
    }),
    claim: MAIN_WIRE_NORMAL_ADULT_LEFT_ATRIAL_MECHANISM_LEDGER_V1_CLAIM,
  });
}

function instantaneousSample(
  source: MainWireNormalAdultFiveWallDiagnosticSampleV2,
  sampleIndex: number,
  wallMaterialVolumeMl: number,
): MainWireNormalAdultLeftAtrialMechanismSampleV1 {
  const commonIntrathoracicPressureMmHg =
    source.commonIntrathoracicPressureMmHg;
  if (
    commonIntrathoracicPressureMmHg === undefined
    || !Number.isFinite(commonIntrathoracicPressureMmHg)
  ) {
    throw new Error(
      `left-atrial mechanism sample ${sampleIndex} lacks authoritative Pth`,
    );
  }
  assertFiniteSample(source, sampleIndex);
  const volumeMl = source.nodeVolumeMl.LA;
  const geometryGainMmHgPerPa = wallMaterialVolumeMl
    / (3 * (volumeMl + 0.5 * wallMaterialVolumeMl) * PA_PER_MMHG);
  const stress = source.wallStressPa.LA;
  const pressureComponentsMmHg = Object.freeze({
    equilibriumPassive: geometryGainMmHgPerPa * stress.passive,
    landActive: geometryGainMmHgPerPa * stress.active,
    parallelSls: geometryGainMmHgPerPa * stress.sls,
    commonIntrathoracic: commonIntrathoracicPressureMmHg,
    commonPericardium: source.commonPericardium.excessPressureMmHg,
  });
  const reconstructedTransmuralPressureMmHg =
    pressureComponentsMmHg.equilibriumPassive
    + pressureComponentsMmHg.landActive
    + pressureComponentsMmHg.parallelSls;
  const reportedTransmuralPressureMmHg =
    source.chamberTransmuralPressureMmHg.LA;
  const reconstructedAbsolutePressureMmHg =
    reconstructedTransmuralPressureMmHg
    + pressureComponentsMmHg.commonIntrathoracic
    + pressureComponentsMmHg.commonPericardium;
  const reportedAbsolutePressureMmHg = source.nodeAbsolutePressureMmHg.LA;
  return Object.freeze({
    sampleIndex,
    timeSec: source.timeSec,
    cyclePhase01: source.cyclePhase01,
    leftAtrialVolumeMl: volumeMl,
    geometryGainMmHgPerPa,
    wallStressPa: Object.freeze({
      equilibriumPassive: stress.passive,
      landActive: stress.active,
      parallelSls: stress.sls,
      total: stress.total,
    }),
    pressureComponentsMmHg,
    reconstructedTransmuralPressureMmHg,
    reportedTransmuralPressureMmHg,
    transmuralPressureAssemblyResidualMmHg:
      reportedTransmuralPressureMmHg - reconstructedTransmuralPressureMmHg,
    reconstructedAbsolutePressureMmHg,
    reportedAbsolutePressureMmHg,
    absolutePressureAssemblyResidualMmHg:
      reportedAbsolutePressureMmHg - reconstructedAbsolutePressureMmHg,
    circulation: Object.freeze({
      pulmonaryVenousInflowMlPerSec: source.flowMlPerSec.PVein_LA,
      mitralOutflowMlPerSec: source.flowMlPerSec.MV,
      netLeftAtrialVolumeRateMlPerSec:
        source.flowMlPerSec.PVein_LA - source.flowMlPerSec.MV,
      pulmonaryVenousToLeftAtrialGradientMmHg:
        source.nodeAbsolutePressureMmHg.PVein
        - source.nodeAbsolutePressureMmHg.LA,
      leftAtrialToLeftVentricularGradientMmHg:
        source.nodeAbsolutePressureMmHg.LA
        - source.nodeAbsolutePressureMmHg.LV,
    }),
  });
}

function intervalSample(
  previous: MainWireNormalAdultLeftAtrialMechanismSampleV1,
  current: MainWireNormalAdultLeftAtrialMechanismSampleV1,
  expectedDtSec: number,
): MainWireNormalAdultLeftAtrialMechanismIntervalV1 {
  assertAdjacentAcceptedStepTimes(previous, current, expectedDtSec);
  const dtSec = expectedDtSec;
  const deltaVolumeMl = current.leftAtrialVolumeMl
    - previous.leftAtrialVolumeMl;
  const meanGain = mean(
    previous.geometryGainMmHgPerPa,
    current.geometryGainMmHgPerPa,
  );
  const meanTotalStress = mean(
    previous.wallStressPa.total,
    current.wallStressPa.total,
  );
  const geometryGain = meanTotalStress
    * (current.geometryGainMmHgPerPa - previous.geometryGainMmHgPerPa);
  const equilibriumPassiveStress = meanGain
    * (current.wallStressPa.equilibriumPassive
      - previous.wallStressPa.equilibriumPassive);
  const landActiveStress = meanGain
    * (current.wallStressPa.landActive - previous.wallStressPa.landActive);
  const parallelSlsStress = meanGain
    * (current.wallStressPa.parallelSls - previous.wallStressPa.parallelSls);
  const reconstructedTransmural = geometryGain
    + equilibriumPassiveStress + landActiveStress + parallelSlsStress;
  const reportedTransmural = current.reportedTransmuralPressureMmHg
    - previous.reportedTransmuralPressureMmHg;
  const commonIntrathoracic = current.pressureComponentsMmHg.commonIntrathoracic
    - previous.pressureComponentsMmHg.commonIntrathoracic;
  const commonPericardium = current.pressureComponentsMmHg.commonPericardium
    - previous.pressureComponentsMmHg.commonPericardium;
  const reconstructedAbsolute = reconstructedTransmural
    + commonIntrathoracic + commonPericardium;
  const reportedAbsolute = current.reportedAbsolutePressureMmHg
    - previous.reportedAbsolutePressureMmHg;
  const trajectoryAreaAttribution = Object.freeze({
    equilibriumPassive: trapezoidalTrajectoryArea(
      previous.pressureComponentsMmHg.equilibriumPassive,
      current.pressureComponentsMmHg.equilibriumPassive,
      deltaVolumeMl,
    ),
    landActive: trapezoidalTrajectoryArea(
      previous.pressureComponentsMmHg.landActive,
      current.pressureComponentsMmHg.landActive,
      deltaVolumeMl,
    ),
    parallelSls: trapezoidalTrajectoryArea(
      previous.pressureComponentsMmHg.parallelSls,
      current.pressureComponentsMmHg.parallelSls,
      deltaVolumeMl,
    ),
    commonIntrathoracic: trapezoidalTrajectoryArea(
      previous.pressureComponentsMmHg.commonIntrathoracic,
      current.pressureComponentsMmHg.commonIntrathoracic,
      deltaVolumeMl,
    ),
    commonPericardium: trapezoidalTrajectoryArea(
      previous.pressureComponentsMmHg.commonPericardium,
      current.pressureComponentsMmHg.commonPericardium,
      deltaVolumeMl,
    ),
    reconstructedAbsolute: trapezoidalTrajectoryArea(
      previous.reconstructedAbsolutePressureMmHg,
      current.reconstructedAbsolutePressureMmHg,
      deltaVolumeMl,
    ),
    reportedAbsolute: trapezoidalTrajectoryArea(
      previous.reportedAbsolutePressureMmHg,
      current.reportedAbsolutePressureMmHg,
      deltaVolumeMl,
    ),
    assemblyResidual: 0,
  });
  const trajectoryAreaAttributionWithResidual = Object.freeze({
    ...trajectoryAreaAttribution,
    assemblyResidual: trajectoryAreaAttribution.reportedAbsolute
      - trajectoryAreaAttribution.reconstructedAbsolute,
  });
  const backwardEulerNetFlowRateMlPerSec =
    current.circulation.netLeftAtrialVolumeRateMlPerSec;
  const finiteDifferenceVolumeRateMlPerSec = deltaVolumeMl / dtSec;
  return Object.freeze({
    previousSampleIndex: previous.sampleIndex,
    currentSampleIndex: current.sampleIndex,
    startTimeSec: previous.timeSec,
    endTimeSec: current.timeSec,
    dtSec,
    leftAtrialVolumeIncrementMl: deltaVolumeMl,
    finiteDifferenceVolumeRateMlPerSec,
    backwardEulerNetFlowRateMlPerSec,
    continuityDefectMlPerSec:
      finiteDifferenceVolumeRateMlPerSec - backwardEulerNetFlowRateMlPerSec,
    continuityResidualMl:
      deltaVolumeMl - dtSec * backwardEulerNetFlowRateMlPerSec,
    transmuralPressureIncrementMmHg: Object.freeze({
      geometryGain,
      equilibriumPassiveStress,
      landActiveStress,
      parallelSlsStress,
      reconstructed: reconstructedTransmural,
      reported: reportedTransmural,
      assemblyResidual: reportedTransmural - reconstructedTransmural,
    }),
    absolutePressureIncrementMmHg: Object.freeze({
      commonIntrathoracic,
      commonPericardium,
      reconstructed: reconstructedAbsolute,
      reported: reportedAbsolute,
      assemblyResidual: reportedAbsolute - reconstructedAbsolute,
    }),
    trapezoidalLaAbsolutePvTrajectoryAreaAttributionMmHgMl:
      trajectoryAreaAttributionWithResidual,
  });
}

function sumTrajectoryAreaAttribution(
  intervals: readonly MainWireNormalAdultLeftAtrialMechanismIntervalV1[],
): MainWireNormalAdultLeftAtrialMechanismIntervalV1[
  "trapezoidalLaAbsolutePvTrajectoryAreaAttributionMmHgMl"
] {
  const keys = [
    "equilibriumPassive",
    "landActive",
    "parallelSls",
    "commonIntrathoracic",
    "commonPericardium",
    "reconstructedAbsolute",
    "reportedAbsolute",
    "assemblyResidual",
  ] as const;
  return Object.freeze(Object.fromEntries(keys.map((key) => [
    key,
    intervals.reduce((sum, interval) =>
      sum + interval
        .trapezoidalLaAbsolutePvTrajectoryAreaAttributionMmHgMl[key], 0),
  ]))) as MainWireNormalAdultLeftAtrialMechanismIntervalV1[
    "trapezoidalLaAbsolutePvTrajectoryAreaAttributionMmHgMl"
  ];
}

function trapezoidalTrajectoryArea(
  previousPressureMmHg: number,
  currentPressureMmHg: number,
  volumeIncrementMl: number,
): number {
  return mean(previousPressureMmHg, currentPressureMmHg) * volumeIncrementMl;
}

function assertFiniteSample(
  sample: MainWireNormalAdultFiveWallDiagnosticSampleV2,
  sampleIndex: number,
): void {
  const values = [
    sample.timeSec,
    sample.cyclePhase01,
    sample.nodeVolumeMl.LA,
    sample.nodeAbsolutePressureMmHg.LA,
    sample.nodeAbsolutePressureMmHg.LV,
    sample.nodeAbsolutePressureMmHg.PVein,
    sample.chamberTransmuralPressureMmHg.LA,
    sample.commonPericardium.excessPressureMmHg,
    sample.flowMlPerSec.MV,
    sample.flowMlPerSec.PVein_LA,
    sample.wallStressPa.LA.total,
    sample.wallStressPa.LA.active,
    sample.wallStressPa.LA.passive,
    sample.wallStressPa.LA.sls,
  ];
  if (!values.every(Number.isFinite) || !(sample.nodeVolumeMl.LA > 0)) {
    throw new Error(`invalid left-atrial mechanism sample ${sampleIndex}`);
  }
}

function mean(left: number, right: number): number {
  return 0.5 * (left + right);
}

function assertAdjacentAcceptedStepTimes(
  previous: MainWireNormalAdultLeftAtrialMechanismSampleV1,
  current: MainWireNormalAdultLeftAtrialMechanismSampleV1,
  expectedDtSec: number,
): void {
  const observedDtSec = current.timeSec - previous.timeSec;
  const scale = Math.max(
    1,
    Math.abs(previous.timeSec),
    Math.abs(current.timeSec),
    Math.abs(expectedDtSec),
  );
  const toleranceSec = TIME_ADJACENCY_ULP_MULTIPLIER
    * Number.EPSILON * scale;
  if (
    !Number.isFinite(observedDtSec)
    || Math.abs(observedDtSec - expectedDtSec) > toleranceSec
  ) {
    throw new Error(
      "left-atrial mechanism samples must be contiguous accepted steps at dtSec",
    );
  }
}

function maximumAbsolute(values: readonly number[]): number {
  return values.length === 0 ? 0 : Math.max(...values.map(Math.abs));
}
