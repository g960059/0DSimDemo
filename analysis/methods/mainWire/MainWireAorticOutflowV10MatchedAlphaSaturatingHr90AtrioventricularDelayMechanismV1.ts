import {
  measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1,
  type MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctMechanismV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_BRACKET_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1,
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayParamsV1,
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileV1,
  type MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileIdV1,
  type MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayBracketV1";
import {
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1,
  resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawV1";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/integrity/stableHash";
import { MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_NON_CALCIUM_ASSEMBLY_V1 } from "@/engine/myocardium/experiments/MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawV1";
import type { MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayBracketResearchRunV1 } from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_MECHANISM_V1_ID =
  "main-wire-aortic-outflow-v10-matched-alpha-saturating-hr90-atrioventricular-delay-mechanism-v1" as const;

export const MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_MECHANISM_CLAIM_V1 =
  Object.freeze({
    source:
      "three-independent-common-resolution-full-P1-HR90-bracket-runs" as const,
    sharedEventMethod:
      "main-wire-aortic-outflow-v10-matched-alpha-saturating-heart-rate-law-ict-mechanism-v1-shared-ledger" as const,
    eventLogicDuplicated: false as const,
    control: "fixed-120-ms-model-AV-electrical-onset-delay" as const,
    contrast: "candidate-minus-120-ms-control" as const,
    surfaceEcgPrIntervalUsedForDirectionOnly: true as const,
    surfaceEcgPrIntervalEquivalentToModeledDelay: false as const,
    canonicalIct:
      "one-percent-MV-flow-MVC-to-one-percent-AoV-flow-AVO-accounting-interval" as const,
    canonicalIctIsValidatedClinicalIvct: false as const,
    shorterDelayConclusionScope:
      "primary-cycle-over-2000-characterization-shows-predominant-not-exact-MVC-to-Ca-accounting-of-flow-derived-ICT-shortening-not-validated-clinical-IVCT-or-PR" as const,
    resolutionRoles: Object.freeze({
      primary: "cycle-over-2000-full-P1-scientific-characterization" as const,
      focusedRegression:
        "cycle-over-500-full-P1-identity-and-direction-regression-only" as const,
    }),
    nonEquivalentCopenhagenIvctReferenceOverlay: Object.freeze({
      correction: "IVCTc-ms-equals-IVCT-ms-plus-0p15-times-HR-bpm" as const,
      doi: "10.1007/s00392-023-02269-2" as const,
      measurementEquivalenceClaimed: false as const,
      clinicalPredictionIntervalClassificationApplied: false as const,
      normalOrAbnormalClassificationClaimed: false as const,
      usedForParameterFitting: false as const,
    }),
    maximumCycleLeftVentricularVolumeIsClinicalGatedEdv: false as const,
    maximumCycleLeftVentricularVolumeRole:
      "model-cycle-maximum-used-as-EDV-proxy" as const,
    mitralModeledVtiIsClinicalSpectralVti: false as const,
    aWaveFlags:
      "descriptive-categorical-loss-and-control-relative-direction-only-without-acceptance-threshold" as const,
    fixedDiscreteCandidatesOnly: true as const,
    exactFrameMutation: false as const,
    exactModelFeedback: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

type Runner =
  MainWireNormalAdultFiveWallAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayBracketResearchRunV1;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMechanismInputV1 =
  Pick<
    Runner,
    | "referenceNonCalciumAssembly"
    | "baseSaturatingHeartRateLawProfile"
    | "atrioventricularDelayBracketProfile"
    | "calciumDriveParams"
    | "periodicResult"
    | "exactAssemblyAudit"
    | "claim"
  >;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMetricsV1 =
  Readonly<{
    canonicalIctSec: number;
    nonEquivalentCopenhagenReferenceOverlayCorrectedIctSec: number;
    mvcToCalciumRiseSignedSec: number;
    calciumRiseToExactLocalGradientPositiveSec: number;
    exactLocalGradientPositiveToStrictPositiveFlowSec: number;
    strictPositiveFlowToCanonicalAvoSec: number;
    calciumRiseToCanonicalAvoSec: number;
    onePercentFlowEjectionTimeSec: number;
    valveEventEjectionTimeSec: number | null;
    meanDopplerGradientMmHg: number;
    peakDopplerGradientMmHg: number;
    strokeVolumeMl: number;
    maximumCycleLeftVentricularVolumeMl: number;
    leftVentricularVolumeAtCanonicalMvcMl: number;
    leftVentricularVolumeAtCanonicalAvoMl: number;
    meanAorticPressureMmHg: number;
    maximumPositiveLeftVentricularDpDtMmHgPerSec: number;
    isovolumicRelaxationTimeSec: number | null;
    teiIndex: number | null;
    mitralPeakEToARatio: number | null;
    mitralForwardVolumeEToARatio: number | null;
    mitralModeledVtiEToARatio: number | null;
    mitralPeakAFlowMlPerSec: number;
    mitralAForwardVolumeMl: number;
    mitralAModeledVtiCm: number | null;
    mitralAForwardDurationSec: number | null;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayDeltaV1 =
  Readonly<{
    [
      Key in keyof MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMetricsV1
    ]: number | null;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayAWaveFlagsV1 =
  Readonly<{
    fusedOrUnresolved: boolean;
    newFusionOrUnresolvedRelativeToControl: boolean;
    aModeledVtiUnavailable: boolean;
    aForwardDurationUnavailable: boolean;
    newAModeledVtiUnavailableRelativeToControl: boolean;
    newAForwardDurationUnavailableRelativeToControl: boolean;
    newCategoricalAReadbackLossRelativeToControl: boolean;
    aPeakReducedRelativeToControl: boolean;
    aForwardVolumeReducedRelativeToControl: boolean;
    aModeledVtiReducedRelativeToControl: boolean;
    aForwardDurationReducedRelativeToControl: boolean;
    anyDirectionalAWaveReductionRelativeToControl: boolean;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayArmV1 =
  Readonly<{
    profile: MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileV1;
    ledger: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1;
    protocolIdentityHash: string;
    exactAssemblyAudit: Runner["exactAssemblyAudit"];
    nonCalciumExactAssemblyAuditHash: string;
    calciumDifferenceKeysFromControl: readonly string[];
    metrics: MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMetricsV1;
    controlRelativeDelta: MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayDeltaV1;
    aWaveFlags: MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayAWaveFlagsV1;
  }>;

export type MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMechanismV1 =
  Readonly<{
    methodId: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_MECHANISM_V1_ID;
    controlProfileId: "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-120ms";
    stepsPerCycle: number;
    dtSec: number;
    executionRole:
      | "primary-cycle-over-2000-characterization"
      | "focused-cycle-over-500-regression"
      | "other-common-resolution";
    armsInCatalogOrder: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayArmV1[];
    controlCalciumParamsIdentityReusedExactly: boolean;
    allReferenceNonCalciumAssemblyIdentitiesExact: boolean;
    allNonCalciumExactAssemblyAuditHashesIdentical: boolean;
    allCalciumDriveHashesDistinct: boolean;
    allProtocolIdentityHashesDistinct: boolean;
    allArmsPeriod1AndIntegrationPassed: boolean;
    allArmsHaveOneDistinctAorticFlowPeak: boolean;
    allExactReadbackStationEquationsWithinTolerance: boolean;
    allIctIdentitiesWithinTolerance: boolean;
    allArmsInterpretationEligible: boolean;
    allShorterDelayArmsShortenFlowDerivedCanonicalIct: boolean;
    delay100NonEquivalentCopenhagenReferenceOverlayCorrectedIctSec: number;
    anyCandidateNewFusionOrUnresolved: boolean;
    anyCandidateNewCategoricalAReadbackLoss: boolean;
    experimentClaim: typeof MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_BRACKET_CLAIM_V1;
    analysisClaim: typeof MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_MECHANISM_CLAIM_V1;
  }>;

type PreparedArm = Readonly<{
  input: MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMechanismInputV1;
  profile: MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileV1;
  ledger: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1;
  metrics: MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMetricsV1;
  nonCalciumExactAssemblyAuditHash: string;
  calciumDifferenceKeysFromControl: readonly string[];
}>;

const CONTROL_PROFILE_ID =
  "matched-alpha-saturating-hr-law-a040-hr-90-av-delay-120ms" as const;

export function measureMainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMechanismV1(
  inputs: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMechanismInputV1[],
): MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMechanismV1 {
  const byId = closedInputs(inputs);
  const controlParams =
    resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawParamsV1(
      "matched-alpha-saturating-hr-law-a040-hr-90",
    );
  const prepared = Object.freeze(
    MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1.map(
      (profileId) => prepareArm(byId.get(profileId)!, controlParams),
    ),
  );
  const control = prepared[0]!;
  if (control.profile.profileId !== CONTROL_PROFILE_ID) {
    throw new Error("HR90 AV-delay mechanism control order mismatch");
  }
  const stepsPerCycleSet = new Set(
    prepared.map(({ input }) => input.periodicResult.stepsPerBeat),
  );
  const dtSecSet = new Set(
    prepared.map(({ input }) => input.periodicResult.dtSec),
  );
  if (stepsPerCycleSet.size !== 1 || dtSecSet.size !== 1) {
    throw new Error("HR90 AV-delay mechanism requires one common resolution");
  }
  const stepsPerCycle = prepared[0]!.input.periodicResult.stepsPerBeat;
  const dtSec = prepared[0]!.input.periodicResult.dtSec;
  const executionRole =
    stepsPerCycle === 2_000
      ? ("primary-cycle-over-2000-characterization" as const)
      : stepsPerCycle === 500
        ? ("focused-cycle-over-500-regression" as const)
        : ("other-common-resolution" as const);
  const controlCalciumParamsIdentityReusedExactly =
    control.input.calciumDriveParams === controlParams &&
    control.input.claim.controlArmReusesBaseCalciumParamsByIdentity &&
    control.profile.controlParamsIdentityReusedExactly;
  const allReferenceNonCalciumAssemblyIdentitiesExact = prepared.every(
    ({ input }) =>
      input.referenceNonCalciumAssembly ===
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_NON_CALCIUM_ASSEMBLY_V1,
  );
  const allNonCalciumExactAssemblyAuditHashesIdentical =
    new Set(prepared.map((arm) => arm.nonCalciumExactAssemblyAuditHash))
      .size === 1;
  const allCalciumDriveHashesDistinct =
    new Set(
      prepared.map(
        ({ input }) =>
          input.exactAssemblyAudit.calciumDriveFixedParamsStableHash,
      ),
    ).size === prepared.length;
  const allProtocolIdentityHashesDistinct =
    new Set(
      prepared.map(({ input }) => input.periodicResult.protocolIdentityHash),
    ).size === prepared.length;
  const allArmsPeriod1AndIntegrationPassed = prepared.every(
    ({ ledger }) => ledger.period1AndIntegrationPassed,
  );
  const allArmsHaveOneDistinctAorticFlowPeak = prepared.every(
    ({ ledger }) => ledger.singleDistinctAorticFlowPeakPassed,
  );
  const allExactReadbackStationEquationsWithinTolerance = prepared.every(
    ({ ledger }) => ledger.exactStationAuditPassed,
  );
  const allIctIdentitiesWithinTolerance = prepared.every(
    ({ ledger }) => ledger.ictDecomposition.identityWithinTolerance,
  );
  const allArmsInterpretationEligible =
    controlCalciumParamsIdentityReusedExactly &&
    allReferenceNonCalciumAssemblyIdentitiesExact &&
    allNonCalciumExactAssemblyAuditHashesIdentical &&
    allCalciumDriveHashesDistinct &&
    allProtocolIdentityHashesDistinct &&
    allArmsPeriod1AndIntegrationPassed &&
    allArmsHaveOneDistinctAorticFlowPeak &&
    allExactReadbackStationEquationsWithinTolerance &&
    allIctIdentitiesWithinTolerance &&
    prepared.every(({ ledger }) => ledger.interpretationEligible);
  const armsInCatalogOrder = Object.freeze(
    prepared.map((arm) =>
      finalizeArm(arm, control, allArmsInterpretationEligible),
    ),
  );

  return Object.freeze({
    methodId:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_MECHANISM_V1_ID,
    controlProfileId: CONTROL_PROFILE_ID,
    stepsPerCycle,
    dtSec,
    executionRole,
    armsInCatalogOrder,
    controlCalciumParamsIdentityReusedExactly,
    allReferenceNonCalciumAssemblyIdentitiesExact,
    allNonCalciumExactAssemblyAuditHashesIdentical,
    allCalciumDriveHashesDistinct,
    allProtocolIdentityHashesDistinct,
    allArmsPeriod1AndIntegrationPassed,
    allArmsHaveOneDistinctAorticFlowPeak,
    allExactReadbackStationEquationsWithinTolerance,
    allIctIdentitiesWithinTolerance,
    allArmsInterpretationEligible,
    allShorterDelayArmsShortenFlowDerivedCanonicalIct:
      allArmsInterpretationEligible &&
      armsInCatalogOrder
        .slice(1)
        .every(
          ({ metrics: candidate }) =>
            candidate.canonicalIctSec < control.metrics.canonicalIctSec,
        ),
    delay100NonEquivalentCopenhagenReferenceOverlayCorrectedIctSec:
      armsInCatalogOrder[2]!.metrics
        .nonEquivalentCopenhagenReferenceOverlayCorrectedIctSec,
    anyCandidateNewFusionOrUnresolved:
      allArmsInterpretationEligible &&
      armsInCatalogOrder
        .slice(1)
        .some(
          ({ aWaveFlags }) => aWaveFlags.newFusionOrUnresolvedRelativeToControl,
        ),
    anyCandidateNewCategoricalAReadbackLoss:
      allArmsInterpretationEligible &&
      armsInCatalogOrder
        .slice(1)
        .some(
          ({ aWaveFlags }) =>
            aWaveFlags.newCategoricalAReadbackLossRelativeToControl,
        ),
    experimentClaim:
      MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_BRACKET_CLAIM_V1,
    analysisClaim:
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_MECHANISM_CLAIM_V1,
  });
}

function closedInputs(
  inputs: readonly MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMechanismInputV1[],
): ReadonlyMap<
  MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileIdV1,
  MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMechanismInputV1
> {
  const expected =
    MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1 as readonly string[];
  const byId = new Map<
    MainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileIdV1,
    MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMechanismInputV1
  >();
  for (const input of inputs) {
    const profileId = input.atrioventricularDelayBracketProfile.profileId;
    if (!expected.includes(profileId)) {
      throw new Error(`unsupported HR90 AV-delay mechanism arm: ${profileId}`);
    }
    if (byId.has(profileId)) {
      throw new Error(`duplicate HR90 AV-delay mechanism arm: ${profileId}`);
    }
    byId.set(profileId, input);
  }
  for (const profileId of MAIN_WIRE_VENTRICULAR_CALCIUM_MATCHED_ALPHA_SATURATING_HR90_ATRIOVENTRICULAR_DELAY_PROFILE_IDS_V1) {
    if (!byId.has(profileId)) {
      throw new Error(`missing HR90 AV-delay mechanism arm: ${profileId}`);
    }
  }
  if (byId.size !== 3) {
    throw new Error("HR90 AV-delay mechanism requires exactly three arms");
  }
  return byId;
}

function prepareArm(
  input: MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMechanismInputV1,
  controlParams: Runner["calciumDriveParams"],
): PreparedArm {
  const profileId = input.atrioventricularDelayBracketProfile.profileId;
  const profile =
    resolveMainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayProfileV1(
      profileId,
    );
  const params =
    resolveMainWireVentricularCalciumMatchedAlphaSaturatingHr90AtrioventricularDelayParamsV1(
      profileId,
    );
  const baseProfile =
    resolveMainWireVentricularCalciumMatchedAlphaSaturatingHeartRateLawProfileV1(
      "matched-alpha-saturating-hr-law-a040-hr-90",
    );
  const calciumDifferenceKeysFromControl = changedKeys(controlParams, params);
  const expectedChangedKeys =
    profileId === CONTROL_PROFILE_ID
      ? []
      : ["atrioventricularDelaySec", "parameterSetId"];
  const result = input.periodicResult;
  const audit = input.exactAssemblyAudit;
  if (
    input.atrioventricularDelayBracketProfile !== profile ||
    input.calciumDriveParams !== params ||
    input.baseSaturatingHeartRateLawProfile !== baseProfile ||
    input.referenceNonCalciumAssembly !==
      MAIN_WIRE_AORTIC_OUTFLOW_V10_MATCHED_ALPHA_SATURATING_HEART_RATE_LAW_REFERENCE_NON_CALCIUM_ASSEMBLY_V1 ||
    profile.heartRateBpm !== 90 ||
    profile.dimensionlessRateCoefficient !== 0.4 ||
    result.claim.heartRateBpm !== 90 ||
    Math.abs(result.dtSec * result.stepsPerBeat - profile.cycleLengthSec) >
      1e-12 ||
    result.protocolIdentity.calciumDrive.parameterSetId !==
      params.parameterSetId ||
    audit.mechanicsProviderParameterIdentityHash !==
      result.protocolIdentity.mechanicsProvider.parameterIdentityHash ||
    audit.circulationRuntimeStableHash !==
      result.protocolComponentHashes.circulationRuntimeStableHash ||
    audit.bloodVolumeOperatingPointStableHash !==
      result.protocolComponentHashes.bloodVolumeOperatingPointStableHash ||
    audit.calciumDriveFixedParamsStableHash !==
      result.protocolComponentHashes.calciumDriveFixedParamsStableHash ||
    calciumDifferenceKeysFromControl.join(",") !== expectedChangedKeys.join(",")
  ) {
    throw new Error(`${profileId} HR90 AV-delay exact identity mismatch`);
  }
  const ledger =
    measureMainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1(
      {
        sourceLabel: profileId,
        calciumDriveParams: params,
        periodicResult: result,
      },
    );
  const nonCalciumExactAssemblyAuditHash = protocolHash({
    mechanicsProviderParameterIdentityHash:
      audit.mechanicsProviderParameterIdentityHash,
    circulationRuntimeStableHash: audit.circulationRuntimeStableHash,
    bloodVolumeOperatingPointStableHash:
      audit.bloodVolumeOperatingPointStableHash,
  });
  return Object.freeze({
    input,
    profile,
    ledger,
    metrics: metrics(ledger),
    nonCalciumExactAssemblyAuditHash,
    calciumDifferenceKeysFromControl,
  });
}

function metrics(
  ledger: MainWireAorticOutflowV10MatchedAlphaSaturatingHeartRateLawIctLedgerV1,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMetricsV1 {
  const ict = ledger.ictDecomposition;
  const cycle = ledger.cycleMetrics;
  const mitral = ledger.mitralFilling.existingDiastolicFlowReadback;
  return Object.freeze({
    canonicalIctSec: ict.canonicalFlowThresholdIctSec,
    nonEquivalentCopenhagenReferenceOverlayCorrectedIctSec:
      ict.canonicalFlowThresholdIctSec + (0.15 * ledger.heartRateBpm) / 1_000,
    mvcToCalciumRiseSignedSec: ict.mitralClosureToCalciumRiseSignedSec,
    calciumRiseToExactLocalGradientPositiveSec:
      ict.calciumRiseToExactLocalGradientPositiveSec,
    exactLocalGradientPositiveToStrictPositiveFlowSec:
      ict.exactLocalGradientPositiveToStrictPositiveFlowSec,
    strictPositiveFlowToCanonicalAvoSec:
      ict.strictPositiveFlowToCanonicalOnePercentAvoSec,
    calciumRiseToCanonicalAvoSec: ict.calciumRiseToCanonicalAvoSec,
    onePercentFlowEjectionTimeSec:
      ledger.onePercentFlowEjectionTime.interpolatedEjectionTimeSec,
    valveEventEjectionTimeSec: cycle.leftVentricularValveEventEjectionTimeSec,
    meanDopplerGradientMmHg: cycle.meanDopplerGradientMmHg,
    peakDopplerGradientMmHg: cycle.peakDopplerGradientMmHg,
    strokeVolumeMl: cycle.aorticForwardVolumeMl,
    maximumCycleLeftVentricularVolumeMl: cycle.maximumLeftVentricularVolumeMl,
    leftVentricularVolumeAtCanonicalMvcMl:
      ledger.eventSnapshots.mitralValveClosure.leftVentricularVolumeMl,
    leftVentricularVolumeAtCanonicalAvoMl:
      ledger.eventSnapshots.aorticValveOpening.leftVentricularVolumeMl,
    meanAorticPressureMmHg: cycle.meanAorticAbsolutePressureMmHg,
    maximumPositiveLeftVentricularDpDtMmHgPerSec:
      cycle.maximumPositiveLeftVentricularPressureRiseRateMmHgPerSec,
    isovolumicRelaxationTimeSec:
      cycle.leftVentricularIsovolumicRelaxationTimeSec,
    teiIndex: cycle.leftVentricularTeiIndex,
    mitralPeakEToARatio: mitral.peakEToARatio,
    mitralForwardVolumeEToARatio: mitral.forwardVolumeEToARatio,
    mitralModeledVtiEToARatio: mitral.modeledVtiEToARatio,
    mitralPeakAFlowMlPerSec: mitral.peakAFlowMlPerSec,
    mitralAForwardVolumeMl: mitral.aForwardVolumeMl,
    mitralAModeledVtiCm: mitral.aModeledVtiCm,
    mitralAForwardDurationSec: mitral.aForwardDurationSec,
  });
}

function finalizeArm(
  arm: PreparedArm,
  control: PreparedArm,
  allArmsInterpretationEligible: boolean,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayArmV1 {
  return Object.freeze({
    profile: arm.profile,
    ledger: arm.ledger,
    protocolIdentityHash: arm.input.periodicResult.protocolIdentityHash,
    exactAssemblyAudit: arm.input.exactAssemblyAudit,
    nonCalciumExactAssemblyAuditHash: arm.nonCalciumExactAssemblyAuditHash,
    calciumDifferenceKeysFromControl: arm.calciumDifferenceKeysFromControl,
    metrics: arm.metrics,
    controlRelativeDelta: metricDelta(arm.metrics, control.metrics),
    aWaveFlags: aWaveFlags(arm, control, allArmsInterpretationEligible),
  });
}

function metricDelta(
  candidate: MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMetricsV1,
  control: MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayMetricsV1,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayDeltaV1 {
  return Object.freeze(
    Object.fromEntries(
      (Object.keys(control) as (keyof typeof control)[]).map((key) => [
        key,
        nullableDifference(candidate[key], control[key]),
      ]),
    ) as MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayDeltaV1,
  );
}

function aWaveFlags(
  candidate: PreparedArm,
  control: PreparedArm,
  allArmsInterpretationEligible: boolean,
): MainWireAorticOutflowV10MatchedAlphaSaturatingHr90AtrioventricularDelayAWaveFlagsV1 {
  const fusedOrUnresolved = candidate.ledger.mitralFilling.fusedOrUnresolved;
  const controlFusedOrUnresolved =
    control.ledger.mitralFilling.fusedOrUnresolved;
  const aModeledVtiUnavailable = candidate.metrics.mitralAModeledVtiCm === null;
  const aForwardDurationUnavailable =
    candidate.metrics.mitralAForwardDurationSec === null;
  const relativeInterpretationEligible =
    allArmsInterpretationEligible &&
    candidate.ledger.interpretationEligible &&
    control.ledger.interpretationEligible;
  const newAModeledVtiUnavailableRelativeToControl =
    relativeInterpretationEligible &&
    aModeledVtiUnavailable &&
    control.metrics.mitralAModeledVtiCm !== null;
  const newAForwardDurationUnavailableRelativeToControl =
    relativeInterpretationEligible &&
    aForwardDurationUnavailable &&
    control.metrics.mitralAForwardDurationSec !== null;
  const newCategoricalAReadbackLossRelativeToControl =
    newAModeledVtiUnavailableRelativeToControl ||
    newAForwardDurationUnavailableRelativeToControl;
  const aPeakReducedRelativeToControl =
    relativeInterpretationEligible &&
    candidate.metrics.mitralPeakAFlowMlPerSec <
      control.metrics.mitralPeakAFlowMlPerSec;
  const aForwardVolumeReducedRelativeToControl =
    relativeInterpretationEligible &&
    candidate.metrics.mitralAForwardVolumeMl <
      control.metrics.mitralAForwardVolumeMl;
  const aModeledVtiReducedRelativeToControl =
    relativeInterpretationEligible &&
    nullableLessThan(
      candidate.metrics.mitralAModeledVtiCm,
      control.metrics.mitralAModeledVtiCm,
    );
  const aForwardDurationReducedRelativeToControl =
    relativeInterpretationEligible &&
    nullableLessThan(
      candidate.metrics.mitralAForwardDurationSec,
      control.metrics.mitralAForwardDurationSec,
    );
  return Object.freeze({
    fusedOrUnresolved,
    newFusionOrUnresolvedRelativeToControl:
      relativeInterpretationEligible &&
      fusedOrUnresolved &&
      !controlFusedOrUnresolved,
    aModeledVtiUnavailable,
    aForwardDurationUnavailable,
    newAModeledVtiUnavailableRelativeToControl,
    newAForwardDurationUnavailableRelativeToControl,
    newCategoricalAReadbackLossRelativeToControl,
    aPeakReducedRelativeToControl,
    aForwardVolumeReducedRelativeToControl,
    aModeledVtiReducedRelativeToControl,
    aForwardDurationReducedRelativeToControl,
    anyDirectionalAWaveReductionRelativeToControl:
      aPeakReducedRelativeToControl ||
      aForwardVolumeReducedRelativeToControl ||
      aModeledVtiReducedRelativeToControl ||
      aForwardDurationReducedRelativeToControl,
  });
}

function changedKeys(
  control: Readonly<Record<string, unknown>>,
  candidate: Readonly<Record<string, unknown>>,
): readonly string[] {
  return Object.freeze(
    Array.from(new Set([...Object.keys(control), ...Object.keys(candidate)]))
      .filter((key) => control[key] !== candidate[key])
      .sort(),
  );
}

function nullableDifference(
  candidate: number | null,
  control: number | null,
): number | null {
  return candidate === null || control === null ? null : candidate - control;
}

function nullableLessThan(
  candidate: number | null,
  control: number | null,
): boolean {
  return candidate !== null && control !== null && candidate < control;
}

function protocolHash(value: unknown): string {
  return stableHash(sanitizeForStableHash(value));
}
