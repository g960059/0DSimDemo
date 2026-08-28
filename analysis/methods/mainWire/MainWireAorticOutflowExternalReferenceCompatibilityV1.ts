export const MAIN_WIRE_AORTIC_OUTFLOW_EXTERNAL_REFERENCE_COMPATIBILITY_V1_ID =
  "main-wire-aortic-outflow-external-reference-compatibility-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_EXTERNAL_REFERENCE_CONTEXT_V1 =
  Object.freeze({
    leftVentricularEjectionTime: Object.freeze({
      measurementContext: "healthy-adult-TDI-M-mode-AVO-to-AVC" as const,
      meanSec: 0.292,
      standardDeviationSec: 0.023,
      comparisonIntervalSec: Object.freeze([0.248, 0.336] as const),
      comparisonIntervalKind: "reported-95-percent-prediction-interval" as const,
      sampleCount: 1_969,
      doi: "10.1007/s00392-023-02269-2" as const,
    }),
    waseHealthyAdultAorticValve: Object.freeze({
      measurementContext:
        "WASE-healthy-adult-pulsed-LVOT-and-continuous-wave-AV-Doppler" as const,
      accelerationTime: Object.freeze({
        meanSec: 0.093,
        standardDeviationSec: 0.018,
        comparisonIntervalSec: Object.freeze([0.057, 0.129] as const),
      }),
      peakVelocity: Object.freeze({
        meanMPerSec: 1.21,
        standardDeviationMPerSec: 0.19,
        comparisonIntervalMPerSec: Object.freeze([0.83, 1.59] as const),
      }),
      meanGradient: Object.freeze({
        meanMmHg: 3.05,
        standardDeviationMmHg: 0.98,
        comparisonIntervalMmHg: Object.freeze([1.09, 5.01] as const),
      }),
      aorticValveArea: Object.freeze({
        meanCm2: 2.91,
        standardDeviationCm2: 0.74,
        comparisonIntervalCm2: Object.freeze([1.43, 4.39] as const),
      }),
      comparisonIntervalKind: "pooled-mean-plus-or-minus-two-standard-deviations" as const,
      sampleCount: 1_903,
      doi: "10.1093/ehjci/jeac220" as const,
    }),
  });

export const MAIN_WIRE_AORTIC_OUTFLOW_EXTERNAL_REFERENCE_COMPATIBILITY_CLAIM_V1 =
  Object.freeze({
    role: "descriptive-falsification-screen-not-clinical-target-fit" as const,
    populationReferenceIsAgeSexAndRacePooled: true as const,
    subjectSpecificReferenceApplied: false as const,
    aorticEjectionTimeProxy:
      "one-percent-peak-flow-thresholded-model-forward-episode-not-clinical-AVO-to-AVC" as const,
    accelerationTimeProxy:
      "accepted-step-model-flow-onset-to-peak-not-interpolated-Doppler-envelope-acceleration-time" as const,
    velocityStation:
      "EOA-derived-vena-contracta-used-as-explicit-comparison-proxy" as const,
    meanGradientStation:
      "simplified-Doppler-time-mean-over-positive-model-flow" as const,
    configuredMaximumEoa:
      "model-effective-orifice-input-not-continuity-equation-or-imaged-anatomic-AVA" as const,
    primaryScoreTerms: Object.freeze([
      "aortic-ejection-time-proxy",
      "aortic-acceleration-time-proxy",
      "peak-vena-contracta-velocity-proxy",
    ] as const),
    peakFlowTargetExcluded: true as const,
    meanGradientExcludedFromScoreBecauseItDuplicatesVelocityAtFixedEoa:
      true as const,
    configuredEoaExcludedFromScoreBecauseItIsInvariantAcrossShortlist:
      true as const,
    distanceDefinition:
      "root-mean-square-standard-deviation-units-outside-comparison-interval-zero-inside" as const,
    smoothingApplied: false as const,
    interpolationApplied: false as const,
    parameterOptimizationOrFitApplied: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export type MainWireAorticOutflowExternalReferenceCompatibilityInputV1 =
  Readonly<{
    aorticEjectionTimeProxySec: number;
    aorticAccelerationTimeProxySec: number;
    peakVenaContractaVelocityMPerSec: number;
    timeMeanSimplifiedDopplerGradientMmHg: number;
    configuredMaximumForwardEoaCm2: number;
  }>;

export type MainWireAorticOutflowExternalReferenceMetricV1 = Readonly<{
  value: number;
  referenceMean: number;
  referenceStandardDeviation: number;
  comparisonInterval: readonly [number, number];
  withinComparisonInterval: boolean;
  standardDeviationUnitsOutsideInterval: number;
}>;

export type MainWireAorticOutflowExternalReferenceCompatibilityV1 =
  Readonly<{
    methodId:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_EXTERNAL_REFERENCE_COMPATIBILITY_V1_ID;
    primary: Readonly<{
      aorticEjectionTimeProxySec:
        MainWireAorticOutflowExternalReferenceMetricV1;
      aorticAccelerationTimeProxySec:
        MainWireAorticOutflowExternalReferenceMetricV1;
      peakVenaContractaVelocityMPerSec:
        MainWireAorticOutflowExternalReferenceMetricV1;
    }>;
    corroboratingNotScored: Readonly<{
      timeMeanSimplifiedDopplerGradientMmHg:
        MainWireAorticOutflowExternalReferenceMetricV1;
      configuredMaximumForwardEoaCm2:
        MainWireAorticOutflowExternalReferenceMetricV1;
    }>;
    primaryReferenceBandDistanceRms: number;
    allPrimaryComparisonIntervalsMatched: boolean;
    corroboratingMeanGradientIntervalMatched: boolean;
    configuredMaximumEoaIntervalMatched: boolean;
    claim:
      typeof MAIN_WIRE_AORTIC_OUTFLOW_EXTERNAL_REFERENCE_COMPATIBILITY_CLAIM_V1;
  }>;

export function evaluateMainWireAorticOutflowExternalReferenceCompatibilityV1(
  input: MainWireAorticOutflowExternalReferenceCompatibilityInputV1,
): MainWireAorticOutflowExternalReferenceCompatibilityV1 {
  for (const [name, value] of Object.entries(input)) {
    if (!(value >= 0) || !Number.isFinite(value)) {
      throw new Error(`${name} must be finite and nonnegative`);
    }
  }
  const reference = MAIN_WIRE_AORTIC_OUTFLOW_EXTERNAL_REFERENCE_CONTEXT_V1;
  const primary = Object.freeze({
    aorticEjectionTimeProxySec: metric(
      input.aorticEjectionTimeProxySec,
      reference.leftVentricularEjectionTime.meanSec,
      reference.leftVentricularEjectionTime.standardDeviationSec,
      reference.leftVentricularEjectionTime.comparisonIntervalSec,
    ),
    aorticAccelerationTimeProxySec: metric(
      input.aorticAccelerationTimeProxySec,
      reference.waseHealthyAdultAorticValve.accelerationTime.meanSec,
      reference.waseHealthyAdultAorticValve.accelerationTime.standardDeviationSec,
      reference.waseHealthyAdultAorticValve.accelerationTime.comparisonIntervalSec,
    ),
    peakVenaContractaVelocityMPerSec: metric(
      input.peakVenaContractaVelocityMPerSec,
      reference.waseHealthyAdultAorticValve.peakVelocity.meanMPerSec,
      reference.waseHealthyAdultAorticValve.peakVelocity.standardDeviationMPerSec,
      reference.waseHealthyAdultAorticValve.peakVelocity
        .comparisonIntervalMPerSec,
    ),
  });
  const corroboratingNotScored = Object.freeze({
    timeMeanSimplifiedDopplerGradientMmHg: metric(
      input.timeMeanSimplifiedDopplerGradientMmHg,
      reference.waseHealthyAdultAorticValve.meanGradient.meanMmHg,
      reference.waseHealthyAdultAorticValve.meanGradient.standardDeviationMmHg,
      reference.waseHealthyAdultAorticValve.meanGradient.comparisonIntervalMmHg,
    ),
    configuredMaximumForwardEoaCm2: metric(
      input.configuredMaximumForwardEoaCm2,
      reference.waseHealthyAdultAorticValve.aorticValveArea.meanCm2,
      reference.waseHealthyAdultAorticValve.aorticValveArea.standardDeviationCm2,
      reference.waseHealthyAdultAorticValve.aorticValveArea.comparisonIntervalCm2,
    ),
  });
  const primaryMetrics = Object.values(primary);
  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_EXTERNAL_REFERENCE_COMPATIBILITY_V1_ID,
    primary,
    corroboratingNotScored,
    primaryReferenceBandDistanceRms: Math.sqrt(
      primaryMetrics.reduce((sum, value) =>
        sum + value.standardDeviationUnitsOutsideInterval ** 2, 0)
        / primaryMetrics.length,
    ),
    allPrimaryComparisonIntervalsMatched: primaryMetrics.every((value) =>
      value.withinComparisonInterval),
    corroboratingMeanGradientIntervalMatched:
      corroboratingNotScored.timeMeanSimplifiedDopplerGradientMmHg
        .withinComparisonInterval,
    configuredMaximumEoaIntervalMatched:
      corroboratingNotScored.configuredMaximumForwardEoaCm2
        .withinComparisonInterval,
    claim:
      MAIN_WIRE_AORTIC_OUTFLOW_EXTERNAL_REFERENCE_COMPATIBILITY_CLAIM_V1,
  });
}

function metric(
  value: number,
  referenceMean: number,
  referenceStandardDeviation: number,
  comparisonInterval: readonly [number, number],
): MainWireAorticOutflowExternalReferenceMetricV1 {
  const [low, high] = comparisonInterval;
  const outside = value < low ? low - value : value > high ? value - high : 0;
  return Object.freeze({
    value,
    referenceMean,
    referenceStandardDeviation,
    comparisonInterval: Object.freeze([...comparisonInterval]) as
      readonly [number, number],
    withinComparisonInterval: value >= low && value <= high,
    standardDeviationUnitsOutsideInterval:
      outside / referenceStandardDeviation,
  });
}
