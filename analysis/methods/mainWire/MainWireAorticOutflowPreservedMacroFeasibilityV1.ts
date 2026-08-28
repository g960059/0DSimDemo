import {
  MAIN_WIRE_AORTIC_OUTFLOW_EXTERNAL_REFERENCE_CONTEXT_V1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowExternalReferenceCompatibilityV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_PRESERVED_MACRO_FEASIBILITY_V1_ID =
  "main-wire-aortic-outflow-preserved-macro-feasibility-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_PRESERVED_MACRO_FEASIBILITY_CLAIM_V1 =
  Object.freeze({
    role:
      "necessary-kinematic-screen-for-fixed-EOA-preserved-output-not-parameter-fit" as const,
    meanGradientLaw:
      "simplified-Doppler-four-times-flow-over-100-EOA-squared" as const,
    lowerBoundProof:
      "EOA-no-greater-than-fixed-maximum-plus-Cauchy-Schwarz-over-positive-flow-time" as const,
    bestCaseWaveform:
      "uniform-flow-through-fully-open-fixed-maximum-EOA" as const,
    necessaryNotSufficient: true as const,
    systemicOnlyOutputReductionMeaning:
      "best-case-forward-volume-reduction-at-unchanged-forward-flow-time-and-fixed-maximum-EOA-not-a-causal-parameter-attribution" as const,
    totalBloodVolumeRole:
      "secondary-preload-and-macro-restoration-not-an-isolated-gradient-target" as const,
    resistanceComplianceRole:
      "mechanistic-timing-sensitivity-axis-not-free-post-hoc-compensation" as const,
    contractileTimingRole:
      "primary-waveform-search-axis-before-macro-restoration" as const,
    macroRestorationGate:
      "candidate-first-lowers-peak-flow-and-meets-fixed-EOA-kinematic-duration-constraint-without-sacrificing-forward-volume" as const,
    configuredEoaAndClinicalAvaInterchangeable: false as const,
    clinicalValidationClaimed: false as const,
    parameterOptimizationOrFitApplied: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireAorticOutflowPreservedMacroFeasibilityInputV1 = Readonly<{
  forwardVolumeMl: number;
  forwardFlowTimeSec: number;
  maximumForwardFlowMlPerSec: number;
  configuredMaximumForwardEoaCm2: number;
}>;

export type MainWireAorticOutflowMeanGradientConstraintV1 = Readonly<{
  targetId: "WASE-pooled-mean-gradient" | "WASE-comparison-band-upper-gradient";
  targetMeanGradientMmHg: number;
  uniformFullOpenVelocityMPerSec: number;
  necessaryMinimumForwardFlowTimeSecAtPreservedVolume: number;
  requiredForwardFlowTimeIncreaseSec: number;
  requiredForwardFlowTimeIncreaseFraction: number;
  bestCaseMaximumForwardVolumeMlAtObservedDuration: number;
  bestCaseMinimumForwardVolumeReductionMlAtObservedDuration: number;
  bestCaseMinimumForwardVolumeReductionFractionAtObservedDuration: number;
  necessaryMinimumFixedEoaCm2AtObservedDurationAndVolume: number;
  currentFixedEoaKinematicFloorWithinTarget: boolean;
}>;

export type MainWireAorticOutflowPeakVelocityConstraintV1 = Readonly<{
  targetId: "WASE-pooled-mean-peak-velocity" | "WASE-comparison-band-upper-peak-velocity";
  targetPeakVelocityMPerSec: number;
  equivalentSimplifiedPeakGradientMmHg: number;
  maximumPeakFlowMlPerSecAtFixedEoa: number;
  requiredPeakFlowDecreaseMlPerSec: number;
  requiredPeakFlowDecreaseFraction: number;
  necessaryMinimumFixedEoaCm2AtObservedPeakFlow: number;
  observedPeakFlowWithinTarget: boolean;
}>;

export type MainWireAorticOutflowPreservedMacroFeasibilityV1 = Readonly<{
  methodId: typeof MAIN_WIRE_AORTIC_OUTFLOW_PRESERVED_MACRO_FEASIBILITY_V1_ID;
  source: MainWireAorticOutflowPreservedMacroFeasibilityInputV1;
  currentUniformFullOpenMeanGradientFloorMmHg: number;
  meanGradientConstraints: Readonly<{
    pooledMean: MainWireAorticOutflowMeanGradientConstraintV1;
    comparisonBandUpper: MainWireAorticOutflowMeanGradientConstraintV1;
  }>;
  peakVelocityConstraints: Readonly<{
    pooledMean: MainWireAorticOutflowPeakVelocityConstraintV1;
    comparisonBandUpper: MainWireAorticOutflowPeakVelocityConstraintV1;
  }>;
  configuredMaximumEoaWithinPooledAvaComparisonInterval: boolean;
  preservedOutputFixedEoaUpperBandFeasibleAtCurrentWaveform: boolean;
  decision:
    | "current-waveform-best-case-compatible-at-preserved-output"
    | "current-waveform-infeasible-at-preserved-output-under-fixed-eoa";
  nextSearchScope: Readonly<{
    ventricularDrivingWaveformDurationAndShape: "primary";
    afterloadTimingSensitivity: "mechanistic-secondary-axis";
    totalBloodVolumeAndSystemicMacroRestoration: "defer-until-waveform-gate";
    localAorticValveInertance: "not-implied-by-this-screen";
    pressureRecovery: "observation-station-physics-not-Doppler-target";
  }>;
  claim: typeof MAIN_WIRE_AORTIC_OUTFLOW_PRESERVED_MACRO_FEASIBILITY_CLAIM_V1;
}>;

export function evaluateMainWireAorticOutflowPreservedMacroFeasibilityV1(
  input: MainWireAorticOutflowPreservedMacroFeasibilityInputV1,
): MainWireAorticOutflowPreservedMacroFeasibilityV1 {
  for (const [name, value] of Object.entries(input)) {
    if (!(value > 0) || !Number.isFinite(value)) {
      throw new Error(`${name} must be finite and positive`);
    }
  }
  const source = Object.freeze({ ...input });
  const external =
    MAIN_WIRE_AORTIC_OUTFLOW_EXTERNAL_REFERENCE_CONTEXT_V1
      .waseHealthyAdultAorticValve;
  const currentUniformVelocity = input.forwardVolumeMl
    / (100 * input.configuredMaximumForwardEoaCm2 * input.forwardFlowTimeSec);
  const currentFloor = 4 * currentUniformVelocity ** 2;
  const meanGradientConstraints = Object.freeze({
    pooledMean: meanGradientConstraint(
      "WASE-pooled-mean-gradient",
      external.meanGradient.meanMmHg,
      input,
      currentFloor,
    ),
    comparisonBandUpper: meanGradientConstraint(
      "WASE-comparison-band-upper-gradient",
      external.meanGradient.comparisonIntervalMmHg[1],
      input,
      currentFloor,
    ),
  });
  const peakVelocityConstraints = Object.freeze({
    pooledMean: peakVelocityConstraint(
      "WASE-pooled-mean-peak-velocity",
      external.peakVelocity.meanMPerSec,
      input,
    ),
    comparisonBandUpper: peakVelocityConstraint(
      "WASE-comparison-band-upper-peak-velocity",
      external.peakVelocity.comparisonIntervalMPerSec[1],
      input,
    ),
  });
  const eoaInterval = external.aorticValveArea.comparisonIntervalCm2;
  const configuredMaximumEoaWithinPooledAvaComparisonInterval =
    input.configuredMaximumForwardEoaCm2 >= eoaInterval[0]
    && input.configuredMaximumForwardEoaCm2 <= eoaInterval[1];
  const preservedOutputFixedEoaUpperBandFeasibleAtCurrentWaveform =
    meanGradientConstraints.comparisonBandUpper
      .currentFixedEoaKinematicFloorWithinTarget
    && peakVelocityConstraints.comparisonBandUpper.observedPeakFlowWithinTarget;
  return Object.freeze({
    methodId: MAIN_WIRE_AORTIC_OUTFLOW_PRESERVED_MACRO_FEASIBILITY_V1_ID,
    source,
    currentUniformFullOpenMeanGradientFloorMmHg: currentFloor,
    meanGradientConstraints,
    peakVelocityConstraints,
    configuredMaximumEoaWithinPooledAvaComparisonInterval,
    preservedOutputFixedEoaUpperBandFeasibleAtCurrentWaveform,
    decision: preservedOutputFixedEoaUpperBandFeasibleAtCurrentWaveform
      ? "current-waveform-best-case-compatible-at-preserved-output"
      : "current-waveform-infeasible-at-preserved-output-under-fixed-eoa",
    nextSearchScope: Object.freeze({
      ventricularDrivingWaveformDurationAndShape: "primary" as const,
      afterloadTimingSensitivity: "mechanistic-secondary-axis" as const,
      totalBloodVolumeAndSystemicMacroRestoration:
        "defer-until-waveform-gate" as const,
      localAorticValveInertance: "not-implied-by-this-screen" as const,
      pressureRecovery: "observation-station-physics-not-Doppler-target" as const,
    }),
    claim: MAIN_WIRE_AORTIC_OUTFLOW_PRESERVED_MACRO_FEASIBILITY_CLAIM_V1,
  });
}

function meanGradientConstraint(
  targetId: MainWireAorticOutflowMeanGradientConstraintV1["targetId"],
  targetMeanGradientMmHg: number,
  input: MainWireAorticOutflowPreservedMacroFeasibilityInputV1,
  currentFloor: number,
): MainWireAorticOutflowMeanGradientConstraintV1 {
  const uniformFullOpenVelocityMPerSec =
    Math.sqrt(targetMeanGradientMmHg / 4);
  const necessaryMinimumForwardFlowTimeSecAtPreservedVolume =
    input.forwardVolumeMl
    / (100 * input.configuredMaximumForwardEoaCm2
      * uniformFullOpenVelocityMPerSec);
  const bestCaseMaximumForwardVolumeMlAtObservedDuration =
    100 * input.configuredMaximumForwardEoaCm2 * input.forwardFlowTimeSec
    * uniformFullOpenVelocityMPerSec;
  const bestCaseMinimumForwardVolumeReductionMlAtObservedDuration = Math.max(
    0,
    input.forwardVolumeMl - bestCaseMaximumForwardVolumeMlAtObservedDuration,
  );
  const requiredForwardFlowTimeIncreaseSec = Math.max(
    0,
    necessaryMinimumForwardFlowTimeSecAtPreservedVolume
      - input.forwardFlowTimeSec,
  );
  return Object.freeze({
    targetId,
    targetMeanGradientMmHg,
    uniformFullOpenVelocityMPerSec,
    necessaryMinimumForwardFlowTimeSecAtPreservedVolume,
    requiredForwardFlowTimeIncreaseSec,
    requiredForwardFlowTimeIncreaseFraction:
      requiredForwardFlowTimeIncreaseSec / input.forwardFlowTimeSec,
    bestCaseMaximumForwardVolumeMlAtObservedDuration,
    bestCaseMinimumForwardVolumeReductionMlAtObservedDuration,
    bestCaseMinimumForwardVolumeReductionFractionAtObservedDuration:
      bestCaseMinimumForwardVolumeReductionMlAtObservedDuration
      / input.forwardVolumeMl,
    necessaryMinimumFixedEoaCm2AtObservedDurationAndVolume:
      input.forwardVolumeMl
      / (100 * input.forwardFlowTimeSec * uniformFullOpenVelocityMPerSec),
    currentFixedEoaKinematicFloorWithinTarget:
      currentFloor <= targetMeanGradientMmHg,
  });
}

function peakVelocityConstraint(
  targetId: MainWireAorticOutflowPeakVelocityConstraintV1["targetId"],
  targetPeakVelocityMPerSec: number,
  input: MainWireAorticOutflowPreservedMacroFeasibilityInputV1,
): MainWireAorticOutflowPeakVelocityConstraintV1 {
  const maximumPeakFlowMlPerSecAtFixedEoa =
    100 * input.configuredMaximumForwardEoaCm2 * targetPeakVelocityMPerSec;
  const requiredPeakFlowDecreaseMlPerSec = Math.max(
    0,
    input.maximumForwardFlowMlPerSec - maximumPeakFlowMlPerSecAtFixedEoa,
  );
  return Object.freeze({
    targetId,
    targetPeakVelocityMPerSec,
    equivalentSimplifiedPeakGradientMmHg: 4 * targetPeakVelocityMPerSec ** 2,
    maximumPeakFlowMlPerSecAtFixedEoa,
    requiredPeakFlowDecreaseMlPerSec,
    requiredPeakFlowDecreaseFraction:
      requiredPeakFlowDecreaseMlPerSec / input.maximumForwardFlowMlPerSec,
    necessaryMinimumFixedEoaCm2AtObservedPeakFlow:
      input.maximumForwardFlowMlPerSec / (100 * targetPeakVelocityMPerSec),
    observedPeakFlowWithinTarget:
      input.maximumForwardFlowMlPerSec <= maximumPeakFlowMlPerSecAtFixedEoa,
  });
}
