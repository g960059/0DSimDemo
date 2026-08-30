import {
  measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ARMS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_CLAIM_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_V1_ID,
  resolveMainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismArmV1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismArmV1,
} from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismV1";
import type {
  MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismResearchRunV1,
  MainWireNormalAdultFiveWallPeriodicProtocolComponentHashesV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ANALYSIS_V1_ID =
  "main-wire-aortic-outflow-v10-matched-alpha-saturating-hr90-opening-load-mechanism-analysis-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ANALYSIS_CLAIM_V1 =
  Object.freeze({
    source:
      "shared-ict-ledger-on-last-retained-complete-beat-per-fixed-HR90-two-by-two-arm" as const,
    design:
      "fixed-two-by-two-systemic-resistance-by-catalog-fixed-TBV-high-volume-operating-point-ablation" as const,
    volumeAxisIntervention: Object.freeze({
      interpretation:
        "catalog-fixed-TBV-high-volume-operating-point-not-pure-independently-controlled-preload" as const,
      baselineFixedTotalBloodVolumeMl: 5_522.11,
      highFixedTotalBloodVolumeMl: 5_832.994143468708,
      highMinusBaselineTotalBloodVolumeMl: 310.8841434687083,
      canonicalAdditionalInitialSvVcLedgerScaleFromBaseline: 4 / 3,
      onlyInitialSvVcLedgerScaledToConstructOperatingPoint: true as const,
      totalBloodVolumeFixedWithinEachRun: true as const,
      totalBloodVolumeDiffersAcrossVolumeAxisArms: true as const,
      convergedVolumeAndPressureDistributionIsEndogenous: true as const,
      purePreloadMechanismClaimed: false as const,
      independentlyControlledStressedVenousVolumeMechanismClaimed:
        false as const,
    }),
    contrastDirection: Object.freeze({
      systemicResistance: "low-minus-baseline" as const,
      stressedVenousVolume: "high-minus-baseline" as const,
      interaction:
        "low-resistance-high-volume-minus-baseline-resistance-high-volume-minus-low-resistance-baseline-volume-plus-baseline-by-baseline" as const,
    }),
    calciumToG0Definition:
      "interpolated-ventricular-calcium-one-percent-rise-to-exact-local-LV-minus-proximal-port-zero-crossing" as const,
    calciumStartD0Definition:
      "interpolated-proximal-port-minus-LV-pressure-at-ventricular-calcium-one-percent-rise" as const,
    maximumLeftVentricularVolumeIsEventAnchoredEdv: false as const,
    calciumRiseLeftVentricularVolume:
      "accepted-endpoint-after-interpolated-calcium-one-percent-crossing-not-interpolated-volume" as const,
    ejectionTime:
      "linearly-interpolated-one-percent-positive-aortic-flow-episode" as const,
    teiAndIvrtAreSharedFlowThresholdModelAnaloguesNotClinicalMeasurements:
      true as const,
    modeledMitralVtiIsClinicalSpectralVti: false as const,
    exactTwoByTwoEffectsReturnedAtBothOpposingFactorLevels: true as const,
    supportedExecutionResolutionsPerBeat: Object.freeze([500, 2_000] as const),
    focusedNumericalRegressionResolutionPerBeat: 500 as const,
    primaryScientificReadoutResolutionPerBeat: 2_000 as const,
    allContrastsRequireMatchedResolutionAndMaximumBeatCount: true as const,
    hashIsolationRequiredBeforeInterpretation: true as const,
    mechanismAblationOnly: true as const,
    canonicalHeartRateDependentTotalBloodVolumePolicyProposed: false as const,
    canonicalHeartRateDependentSystemicResistancePolicyProposed: false as const,
    outcomeTargetedRecalibrationApplied: false as const,
    parameterSearchOrFitting: false as const,
    causalDominanceEstablishedOutsideThisFixedGrid: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
    exactFrameMutation: false as const,
    exactModelFeedback: false as const,
  });

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_METRIC_IDS_V1 =
  Object.freeze([
    "canonicalIctSec",
    "mitralClosureToCalciumRiseSignedSec",
    "calciumRiseToExactLocalGradientPositiveSec",
    "exactLocalGradientPositiveToStrictPositiveFlowSec",
    "strictPositiveFlowToCanonicalOnePercentAvoSec",
    "calciumRiseToCanonicalAvoSec",
    "calciumRiseInitialProximalPortMinusLvDeficitMmHg",
    "calciumRiseInitialLvPressureMmHg",
    "calciumRiseInitialProximalPortPressureMmHg",
    "calciumRiseLvPressureRiseToLocalZeroMmHg",
    "calciumRiseProximalPortPressureChangeToLocalZeroMmHg",
    "calciumRiseMeanLvPressureRiseRateMmHgPerSec",
    "calciumRiseMeanProximalPortPressureChangeRateMmHgPerSec",
    "maximumLeftVentricularVolumeMl",
    "calciumRiseAcceptedEndpointLeftVentricularVolumeMl",
    "onePercentFlowInterpolatedEjectionTimeSec",
    "meanDopplerGradientMmHg",
    "peakDopplerGradientMmHg",
    "strokeVolumeMl",
    "meanAorticPressureMmHg",
    "maximumPositiveLeftVentricularDpdtMmHgPerSec",
    "leftVentricularTeiIndex",
    "leftVentricularIvrtSec",
    "mitralPeakEToARatio",
    "mitralForwardVolumeEToARatio",
    "mitralModeledVtiEToARatio",
  ] as const);

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismMetricIdV1 =
  (typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_METRIC_IDS_V1)[number];

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismMetricVectorV1 =
  Readonly<
    Record<
      MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismMetricIdV1,
      number | null
    >
  >;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismMetricUnitV1 =
  "sec" | "mmHg" | "mmHg-per-sec" | "mL" | "ratio";

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismArmAnalysisV1 =
  Readonly<{
    arm: MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismArmV1;
    exactAssemblyAudit: MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismResearchRunV1["exactAssemblyAudit"];
    protocolComponentHashes: MainWireNormalAdultFiveWallPeriodicProtocolComponentHashesV1;
    ledger: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1;
    metrics: MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismMetricVectorV1;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismFactorialContrastV1 =
  Readonly<{
    metricId: MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismMetricIdV1;
    unit: MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismMetricUnitV1;
    baselineResistanceBaselineVolumeValue: number | null;
    systemicResistanceLowMinusBaselineAtBaselineVolume: number | null;
    systemicResistanceLowMinusBaselineAtHighVolume: number | null;
    stressedVenousVolumeHighMinusBaselineAtBaselineResistance: number | null;
    stressedVenousVolumeHighMinusBaselineAtLowResistance: number | null;
    interactionDifferenceOfDifferences: number | null;
    allFourArmValuesAvailable: boolean;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismHashIsolationV1 =
  Readonly<{
    allFourProtocolIdentityHashesUnique: true;
    allMechanicsProviderParameterIdentityHashesIdentical: true;
    allMechanicsProviderMetadataHashesIdentical: true;
    allCalciumDriveHashesIdentical: true;
    allTopologyHashesIdentical: true;
    allCommonPericardiumHashesIdentical: true;
    allPeriodicPolicyHashesIdentical: true;
    exactlyTwoCirculationRuntimeHashes: true;
    circulationRuntimeHashDependsOnlyOnSystemicResistanceLevel: true;
    exactlyTwoBloodVolumeOperatingPointHashes: true;
    bloodVolumeOperatingPointHashDependsOnlyOnStressedVolumeLevel: true;
    exactAssemblyAuditMatchesProtocolComponentHashes: true;
    onlyDeclaredLoadHashAxesDiffer: true;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismAnalysisV1 =
  Readonly<{
    methodId: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ANALYSIS_V1_ID;
    experimentId: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_V1_ID;
    designRole: "fixed-HR90-opening-load-two-by-two-mechanism-ablation";
    armsInCatalogOrder: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismArmAnalysisV1[];
    factorialContrasts: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismFactorialContrastV1[];
    hashIsolation: MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismHashIsolationV1;
    allArmsPeriod1AndIntegrationPassed: boolean;
    allArmsInterpretationEligible: boolean;
    experimentClaim: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_CLAIM_V1;
    analysisClaim: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ANALYSIS_CLAIM_V1;
  }>;

type Run =
  MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismResearchRunV1;

const METRIC_UNITS = Object.freeze({
  canonicalIctSec: "sec",
  mitralClosureToCalciumRiseSignedSec: "sec",
  calciumRiseToExactLocalGradientPositiveSec: "sec",
  exactLocalGradientPositiveToStrictPositiveFlowSec: "sec",
  strictPositiveFlowToCanonicalOnePercentAvoSec: "sec",
  calciumRiseToCanonicalAvoSec: "sec",
  calciumRiseInitialProximalPortMinusLvDeficitMmHg: "mmHg",
  calciumRiseInitialLvPressureMmHg: "mmHg",
  calciumRiseInitialProximalPortPressureMmHg: "mmHg",
  calciumRiseLvPressureRiseToLocalZeroMmHg: "mmHg",
  calciumRiseProximalPortPressureChangeToLocalZeroMmHg: "mmHg",
  calciumRiseMeanLvPressureRiseRateMmHgPerSec: "mmHg-per-sec",
  calciumRiseMeanProximalPortPressureChangeRateMmHgPerSec: "mmHg-per-sec",
  maximumLeftVentricularVolumeMl: "mL",
  calciumRiseAcceptedEndpointLeftVentricularVolumeMl: "mL",
  onePercentFlowInterpolatedEjectionTimeSec: "sec",
  meanDopplerGradientMmHg: "mmHg",
  peakDopplerGradientMmHg: "mmHg",
  strokeVolumeMl: "mL",
  meanAorticPressureMmHg: "mmHg",
  maximumPositiveLeftVentricularDpdtMmHgPerSec: "mmHg-per-sec",
  leftVentricularTeiIndex: "ratio",
  leftVentricularIvrtSec: "sec",
  mitralPeakEToARatio: "ratio",
  mitralForwardVolumeEToARatio: "ratio",
  mitralModeledVtiEToARatio: "ratio",
} satisfies Readonly<
  Record<
    MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismMetricIdV1,
    MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismMetricUnitV1
  >
>);

export function measureMainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismAnalysisV1(
  runs: readonly Run[],
): MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismAnalysisV1 {
  const byId = new Map<string, Run>();
  for (const run of runs) {
    const armId = run.openingLoadMechanismArm.armId;
    if (byId.has(armId)) {
      throw new Error(`duplicate HR90 opening-load analysis arm: ${armId}`);
    }
    byId.set(armId, run);
  }
  for (const arm of MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ARMS_V1) {
    if (!byId.has(arm.armId)) {
      throw new Error(`missing HR90 opening-load analysis arm: ${arm.armId}`);
    }
  }
  if (byId.size !== 4) {
    throw new Error("HR90 opening-load analysis requires exactly four arms");
  }

  const orderedRuns =
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ARMS_V1.map(
      (arm) => byId.get(arm.armId)!,
    );
  orderedRuns.forEach(validateRunIdentity);
  const resolutionIdentity = orderedRuns[0]!.periodicResult;
  if (
    orderedRuns.some(
      (run) =>
        run.periodicResult.stepsPerBeat !== resolutionIdentity.stepsPerBeat ||
        run.periodicResult.dtSec !== resolutionIdentity.dtSec ||
        run.periodicResult.requestedMaximumBeatCount !==
          resolutionIdentity.requestedMaximumBeatCount,
    )
  ) {
    throw new Error(
      "HR90 opening-load analysis requires matched execution resolution across all arms",
    );
  }
  const hashIsolation = validateHashIsolation(orderedRuns);
  const armsInCatalogOrder = Object.freeze(
    orderedRuns.map((run) => measureArm(run)),
  );
  const byCoordinates = new Map(
    armsInCatalogOrder.map((measured) => [
      coordinateKey(
        measured.arm.systemicResistanceLevel,
        measured.arm.stressedVenousVolumeLevel,
      ),
      measured,
    ]),
  );
  const baseline = byCoordinates.get("baseline__baseline")!;
  const highVolume = byCoordinates.get("baseline__high")!;
  const lowResistance = byCoordinates.get("low__baseline")!;
  const combined = byCoordinates.get("low__high")!;
  if (!baseline || !highVolume || !lowResistance || !combined) {
    throw new Error(
      "HR90 opening-load two-by-two coordinate resolution failed",
    );
  }
  const factorialContrasts = Object.freeze(
    MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_METRIC_IDS_V1.map(
      (metricId) =>
        contrast(
          metricId,
          baseline.metrics[metricId],
          highVolume.metrics[metricId],
          lowResistance.metrics[metricId],
          combined.metrics[metricId],
        ),
    ),
  );
  const allArmsPeriod1AndIntegrationPassed = armsInCatalogOrder.every(
    (arm) => arm.ledger.period1AndIntegrationPassed,
  );
  const allArmsInterpretationEligible = armsInCatalogOrder.every(
    (arm) => arm.ledger.interpretationEligible,
  );

  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ANALYSIS_V1_ID,
    experimentId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_V1_ID,
    designRole:
      "fixed-HR90-opening-load-two-by-two-mechanism-ablation" as const,
    armsInCatalogOrder,
    factorialContrasts,
    hashIsolation,
    allArmsPeriod1AndIntegrationPassed,
    allArmsInterpretationEligible,
    experimentClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_OPENING_LOAD_MECHANISM_ANALYSIS_CLAIM_V1,
  });
}

function validateRunIdentity(run: Run): void {
  const expected =
    resolveMainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismArmV1(
      run.openingLoadMechanismArm.armId,
    );
  if (
    run.configurationRole !==
      "fixed-v10-matched-alpha-saturating-hr90-opening-load-mechanism-arm" ||
    run.openingLoadMechanismArm !== expected
  ) {
    throw new Error(
      `${run.openingLoadMechanismArm.armId} opening-load arm catalog identity mismatch`,
    );
  }
  const result = run.periodicResult;
  if (
    run.saturatingHeartRateLawProfile.profileId !== expected.calciumProfileId ||
    run.calciumDriveParams.parameterSetId !==
      result.protocolIdentity.calciumDrive.parameterSetId ||
    result.claim.heartRateBpm !== 90 ||
    (result.stepsPerBeat !== 500 && result.stepsPerBeat !== 2_000) ||
    result.requestedMaximumBeatCount !== 72 ||
    run.claim.fixedFourArmOpeningLoadFactorialOnly !== true ||
    run.claim.outcomeTargetedRecalibrationApplied !== false ||
    run.claim.canonicalAdoptionEstablished !== false
  ) {
    throw new Error(
      `${expected.armId} opening-load execution identity mismatch`,
    );
  }
  if (
    run.circulatoryLoadPoint.systemicResistanceScaleFromBaseline !==
      expected.systemicResistanceScaleFromBaseline ||
    run.circulatoryLoadPoint.pulmonaryResistanceScaleFromBaseline !== 1 ||
    run.circulatoryLoadPoint.arterialStiffnessScaleFromBaseline !== 1 ||
    run.stressedVenousVolumePoint.canonicalAdditionalSvVcVolumeScale !==
      expected.canonicalAdditionalStressedVenousVolumeScale
  ) {
    throw new Error(`${expected.armId} opening-load factor readback mismatch`);
  }
}

function validateHashIsolation(
  runs: readonly Run[],
): MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismHashIsolationV1 {
  const unique = (values: readonly string[]) => new Set(values).size;
  const exactAssemblyAuditMatchesProtocolComponentHashes = runs.every(
    (run) =>
      run.exactAssemblyAudit.mechanicsProviderParameterIdentityHash ===
        run.periodicResult.protocolIdentity.mechanicsProvider
          .parameterIdentityHash &&
      run.exactAssemblyAudit.circulationRuntimeStableHash ===
        run.periodicResult.protocolComponentHashes
          .circulationRuntimeStableHash &&
      run.exactAssemblyAudit.bloodVolumeOperatingPointStableHash ===
        run.periodicResult.protocolComponentHashes
          .bloodVolumeOperatingPointStableHash &&
      run.exactAssemblyAudit.calciumDriveFixedParamsStableHash ===
        run.periodicResult.protocolComponentHashes
          .calciumDriveFixedParamsStableHash,
  );
  const oneHash = (read: (run: Run) => string): boolean =>
    unique(runs.map(read)) === 1;
  const hashDependsOnlyOnLevel = (
    level: (run: Run) => string,
    read: (run: Run) => string,
  ): boolean => {
    const levelToHash = new Map<string, string>();
    for (const run of runs) {
      const key = level(run);
      const hash = read(run);
      const existing = levelToHash.get(key);
      if (existing !== undefined && existing !== hash) return false;
      levelToHash.set(key, hash);
    }
    return new Set(levelToHash.values()).size === levelToHash.size;
  };
  const allFourProtocolIdentityHashesUnique =
    unique(runs.map((run) => run.periodicResult.protocolIdentityHash)) === 4;
  const allMechanicsProviderParameterIdentityHashesIdentical = oneHash(
    (run) => run.exactAssemblyAudit.mechanicsProviderParameterIdentityHash,
  );
  const allMechanicsProviderMetadataHashesIdentical = oneHash(
    (run) =>
      run.periodicResult.protocolComponentHashes
        .mechanicsProviderMetadataStableHash,
  );
  const allCalciumDriveHashesIdentical = oneHash(
    (run) =>
      run.periodicResult.protocolComponentHashes
        .calciumDriveFixedParamsStableHash,
  );
  const allTopologyHashesIdentical = oneHash(
    (run) =>
      run.periodicResult.protocolComponentHashes
        .circulationTopologyGraphStableHash,
  );
  const allCommonPericardiumHashesIdentical = oneHash(
    (run) =>
      run.periodicResult.protocolComponentHashes.commonPericardiumStableHash,
  );
  const allPeriodicPolicyHashesIdentical = oneHash(
    (run) =>
      run.periodicResult.protocolComponentHashes.periodicPolicyStableHash,
  );
  const exactlyTwoCirculationRuntimeHashes =
    unique(
      runs.map(
        (run) =>
          run.periodicResult.protocolComponentHashes
            .circulationRuntimeStableHash,
      ),
    ) === 2;
  const circulationRuntimeHashDependsOnlyOnSystemicResistanceLevel =
    hashDependsOnlyOnLevel(
      (run) => run.openingLoadMechanismArm.systemicResistanceLevel,
      (run) =>
        run.periodicResult.protocolComponentHashes.circulationRuntimeStableHash,
    );
  const exactlyTwoBloodVolumeOperatingPointHashes =
    unique(
      runs.map(
        (run) =>
          run.periodicResult.protocolComponentHashes
            .bloodVolumeOperatingPointStableHash,
      ),
    ) === 2;
  const bloodVolumeOperatingPointHashDependsOnlyOnStressedVolumeLevel =
    hashDependsOnlyOnLevel(
      (run) => run.openingLoadMechanismArm.stressedVenousVolumeLevel,
      (run) =>
        run.periodicResult.protocolComponentHashes
          .bloodVolumeOperatingPointStableHash,
    );
  const checks = {
    allFourProtocolIdentityHashesUnique,
    allMechanicsProviderParameterIdentityHashesIdentical,
    allMechanicsProviderMetadataHashesIdentical,
    allCalciumDriveHashesIdentical,
    allTopologyHashesIdentical,
    allCommonPericardiumHashesIdentical,
    allPeriodicPolicyHashesIdentical,
    exactlyTwoCirculationRuntimeHashes,
    circulationRuntimeHashDependsOnlyOnSystemicResistanceLevel,
    exactlyTwoBloodVolumeOperatingPointHashes,
    bloodVolumeOperatingPointHashDependsOnlyOnStressedVolumeLevel,
    exactAssemblyAuditMatchesProtocolComponentHashes,
  };
  if (Object.values(checks).some((passed) => !passed)) {
    throw new Error(
      `HR90 opening-load hash isolation failed: ${Object.entries(checks)
        .filter(([, passed]) => !passed)
        .map(([name]) => name)
        .join(", ")}`,
    );
  }
  return Object.freeze({
    allFourProtocolIdentityHashesUnique: true as const,
    allMechanicsProviderParameterIdentityHashesIdentical: true as const,
    allMechanicsProviderMetadataHashesIdentical: true as const,
    allCalciumDriveHashesIdentical: true as const,
    allTopologyHashesIdentical: true as const,
    allCommonPericardiumHashesIdentical: true as const,
    allPeriodicPolicyHashesIdentical: true as const,
    exactlyTwoCirculationRuntimeHashes: true as const,
    circulationRuntimeHashDependsOnlyOnSystemicResistanceLevel: true as const,
    exactlyTwoBloodVolumeOperatingPointHashes: true as const,
    bloodVolumeOperatingPointHashDependsOnlyOnStressedVolumeLevel:
      true as const,
    exactAssemblyAuditMatchesProtocolComponentHashes: true as const,
    onlyDeclaredLoadHashAxesDiffer: true as const,
  });
}

function measureArm(
  run: Run,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismArmAnalysisV1 {
  const ledger =
    measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1(
      Object.freeze({
        sourceLabel: run.openingLoadMechanismArm.armId,
        calciumDriveParams: run.calciumDriveParams,
        periodicResult: run.periodicResult,
      }),
    );
  const ict = ledger.ictDecomposition;
  const calciumPressure = ledger.calciumRisePressureBuildToLocalOpening;
  const cycle = ledger.cycleMetrics;
  const mitral = ledger.mitralFilling.existingDiastolicFlowReadback;
  const metrics = Object.freeze({
    canonicalIctSec: ict.canonicalFlowThresholdIctSec,
    mitralClosureToCalciumRiseSignedSec:
      ict.mitralClosureToCalciumRiseSignedSec,
    calciumRiseToExactLocalGradientPositiveSec:
      ict.calciumRiseToExactLocalGradientPositiveSec,
    exactLocalGradientPositiveToStrictPositiveFlowSec:
      ict.exactLocalGradientPositiveToStrictPositiveFlowSec,
    strictPositiveFlowToCanonicalOnePercentAvoSec:
      ict.strictPositiveFlowToCanonicalOnePercentAvoSec,
    calciumRiseToCanonicalAvoSec: ict.calciumRiseToCanonicalAvoSec,
    calciumRiseInitialProximalPortMinusLvDeficitMmHg:
      calciumPressure.initialProximalPortMinusLeftVentricleDeficitMmHg,
    calciumRiseInitialLvPressureMmHg:
      calciumPressure.initialLeftVentricularPressureMmHg,
    calciumRiseInitialProximalPortPressureMmHg:
      calciumPressure.initialProximalPortPressureMmHg,
    calciumRiseLvPressureRiseToLocalZeroMmHg:
      calciumPressure.leftVentricularPressureRiseMmHg,
    calciumRiseProximalPortPressureChangeToLocalZeroMmHg:
      calciumPressure.proximalPortPressureChangeMmHg,
    calciumRiseMeanLvPressureRiseRateMmHgPerSec:
      calciumPressure.meanLeftVentricularPressureRiseRateMmHgPerSec,
    calciumRiseMeanProximalPortPressureChangeRateMmHgPerSec:
      calciumPressure.meanProximalPortPressureChangeRateMmHgPerSec,
    maximumLeftVentricularVolumeMl: cycle.maximumLeftVentricularVolumeMl,
    calciumRiseAcceptedEndpointLeftVentricularVolumeMl:
      ledger.eventSnapshots.ventricularCalciumRise.leftVentricularVolumeMl,
    onePercentFlowInterpolatedEjectionTimeSec:
      ledger.onePercentFlowEjectionTime.interpolatedEjectionTimeSec,
    meanDopplerGradientMmHg: cycle.meanDopplerGradientMmHg,
    peakDopplerGradientMmHg: cycle.peakDopplerGradientMmHg,
    strokeVolumeMl: cycle.aorticForwardVolumeMl,
    meanAorticPressureMmHg: cycle.meanAorticAbsolutePressureMmHg,
    maximumPositiveLeftVentricularDpdtMmHgPerSec:
      cycle.maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec,
    leftVentricularTeiIndex: cycle.leftVentricularTeiIndex,
    leftVentricularIvrtSec: cycle.leftVentricularIsovolumicRelaxationTimeSec,
    mitralPeakEToARatio: mitral.peakEToARatio,
    mitralForwardVolumeEToARatio: mitral.forwardVolumeEToARatio,
    mitralModeledVtiEToARatio: mitral.modeledVtiEToARatio,
  }) satisfies MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismMetricVectorV1;
  return Object.freeze({
    arm: run.openingLoadMechanismArm,
    exactAssemblyAudit: run.exactAssemblyAudit,
    protocolComponentHashes: run.periodicResult.protocolComponentHashes,
    ledger,
    metrics,
  });
}

function contrast(
  metricId: MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismMetricIdV1,
  baseline: number | null,
  highVolume: number | null,
  lowResistance: number | null,
  combined: number | null,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHr90OpeningLoadMechanismFactorialContrastV1 {
  const allFourArmValuesAvailable =
    baseline !== null &&
    highVolume !== null &&
    lowResistance !== null &&
    combined !== null;
  return Object.freeze({
    metricId,
    unit: METRIC_UNITS[metricId],
    baselineResistanceBaselineVolumeValue: baseline,
    systemicResistanceLowMinusBaselineAtBaselineVolume:
      allFourArmValuesAvailable ? lowResistance - baseline : null,
    systemicResistanceLowMinusBaselineAtHighVolume: allFourArmValuesAvailable
      ? combined - highVolume
      : null,
    stressedVenousVolumeHighMinusBaselineAtBaselineResistance:
      allFourArmValuesAvailable ? highVolume - baseline : null,
    stressedVenousVolumeHighMinusBaselineAtLowResistance:
      allFourArmValuesAvailable ? combined - lowResistance : null,
    interactionDifferenceOfDifferences: allFourArmValuesAvailable
      ? combined - highVolume - lowResistance + baseline
      : null,
    allFourArmValuesAvailable,
  });
}

function coordinateKey(
  systemicResistanceLevel: "baseline" | "low",
  stressedVenousVolumeLevel: "baseline" | "high",
): string {
  return `${systemicResistanceLevel}__${stressedVenousVolumeLevel}`;
}
