import {
  evaluateLandLengthStateV1,
  type LandLengthStateOutputV1,
} from "@/engine/myocardium/fourChamberV1/adapters/landLengthReferenceV1";
import {
  evaluateLandNominalToKirchhoffAtStateV1,
} from "@/engine/myocardium/fourChamberV1/adapters/landNominalToKirchhoffV1";
import {
  compilePhaseA1LandWallAdapterContextV1,
  type LandWallAdapterContextV1,
} from "@/engine/myocardium/fourChamberV1/adapters/landWallAdapterContextV1";
import {
  advanceExactEventCalciumV1,
  calciumDriveEventFromElectricalV1,
  evaluateExactEventCalciumV1,
  zeroExactEventCalciumStateV1,
  type CalciumDriveEventV1,
  type ExactEventCalciumStateV1,
} from "@/engine/myocardium/fourChamberV1/calcium/exactEventPrescribedCalciumV1";
import {
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
  buildAtrialHumanPriorLandEquationParametersV1,
  buildPhaseA1TissueManifestBundleV1,
} from "@/engine/myocardium/fourChamberV1/manifests/phaseA1TissueManifestBundleV1";
import {
  LAND2017_EQUATIONS_VERSION,
  LAND2017_MYOFILAMENT_MODEL_ID,
  solveLand2017BackwardEulerSubsteps,
  type Land2017SourceParameterSet,
  type Land2017SubstepSolveOptions,
  type LandStepInput,
} from "@/engine/myocardium/myofilament/land2017";

export const ATRIAL_LAND_LATE_STRETCH_COMPONENT_PROTOCOL_V1_ID =
  "atrial-land-late-stretch-component-protocol-v1" as const;

export const ATRIAL_LAND_LATE_STRETCH_COMPONENT_CLAIM_BOUNDARY_V1 =
  "diagnostic-only-isolated-component-not-closed-loop-or-physiological-validation" as const;

export const ATRIAL_LAND_LATE_STRETCH_DT_FAMILY_SEC_V1 = Object.freeze([
  0.001,
  0.0005,
  0.00025,
] as const);

export const ATRIAL_LAND_LATE_STRETCH_ARM_IDS_V1 = Object.freeze([
  "isometric",
  "shortening-hold",
  "shortening-restretch",
  "active-off",
] as const);

export type AtrialLandLateStretchArmIdV1 =
  (typeof ATRIAL_LAND_LATE_STRETCH_ARM_IDS_V1)[number];

export const ATRIAL_LAND_LATE_STRETCH_TIMING_V1 = deepFreeze({
  electricalActivationTimeSec: 0,
  calciumDriveDelaySec: 0.012,
  shorteningOnsetSec: 0.04,
  shorteningEndSec: 0.12,
  restretchOnsetSec: 0.15,
  restretchEndSec: 0.21,
  lateMetricWindowEndSec: 0.28,
  durationSec: 0.4,
  initialFiberLogStrain: 0.02,
  shortenedFiberLogStrain: -0.015,
  trajectoryShape: "raised-cosine-c1-with-hold" as const,
});

const SOURCE_STATE_SEED = Object.freeze([0.18, 0.22, 0.04, 0.02, 0, 0] as const);
const BURN_IN_POLICY = deepFreeze({
  durationSec: 2,
  dtSec: 0.00025,
  freeCalciumUM: ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1.calciumDiastolicUM,
  fixedFiberLogStrain: ATRIAL_LAND_LATE_STRETCH_TIMING_V1.initialFiberLogStrain,
  sourceStateSeed: SOURCE_STATE_SEED,
  purpose: "shared-diastolic-source-state-for-bit-exact-arm-fork" as const,
});

const SOLVER_POLICY = deepFreeze({
  scheme: "backward-euler" as const,
  maxIterations: 16,
  residualTolerance: 1e-10,
  lineSearchMinStep: 1 / 2048,
  lineSearchReduction: 0.5,
  substeps: 1,
});

type ArmDefinitionV1 = {
  readonly armId: AtrialLandLateStretchArmIdV1;
  readonly trajectoryId:
    | "fixed-isometric"
    | "shorten-then-hold"
    | "shorten-hold-restretch";
  readonly activationStrength: 0 | 1;
};

const ARM_DEFINITIONS: readonly ArmDefinitionV1[] = deepFreeze([
  { armId: "isometric", trajectoryId: "fixed-isometric", activationStrength: 1 },
  { armId: "shortening-hold", trajectoryId: "shorten-then-hold", activationStrength: 1 },
  {
    armId: "shortening-restretch",
    trajectoryId: "shorten-hold-restretch",
    activationStrength: 1,
  },
  { armId: "active-off", trajectoryId: "shorten-hold-restretch", activationStrength: 0 },
]);

export type AtrialLandLateStretchSampleV1 = {
  readonly timeSec: number;
  readonly freeCalciumUM: number;
  readonly fiberLogStrain: number;
  readonly fiberLogStrainRatePerSec: number;
  readonly landEngineeringStrain: number;
  readonly sourceActiveFiberStressPa: number;
  readonly wallActiveKirchhoffStressPa: number;
  readonly minimumPopulation: number;
  readonly stateConservationResidual: number;
  readonly healthFinite: boolean;
  readonly projectionUsed: boolean;
  readonly solverIterations: number;
  readonly solverResidualNorm: number;
  readonly solverLineSearchSteps: number;
};

export type AtrialLandLateStretchMetricsV1 = {
  readonly baselineWallActiveStressPa: number;
  readonly primaryPeakWallActiveStressPa: number;
  readonly primaryPeakTimeAfterElectricalMs: number;
  readonly primaryPeakTimeAfterCalciumDriveMs: number;
  readonly primaryPeakAboveBaselinePa: number;
  readonly preRestretchTroughWallActiveStressPa: number;
  readonly preRestretchTroughTimeSec: number;
  readonly latePeakWallActiveStressPa: number;
  readonly latePeakTimeSec: number;
  readonly secondarySpikeGainPa: number;
  readonly latePeakMinusPrimaryPa: number;
  readonly secondaryToPrimaryAmplitudeRatio: number | null;
  readonly postRestretchPositiveStressImpulsePaSec: number;
  readonly maximumPostRestretchWallStressUpstrokePaPerSec: number;
  readonly relaxation50AfterPrimaryMs: number | null;
  readonly secondarySpikeDetectedDiagnostic: boolean;
  readonly minimumPopulation: number;
  readonly maximumAbsoluteStateConservationResidual: number;
  readonly allSourceHealthFinite: boolean;
  readonly anyProjectionUsed: boolean;
  readonly maximumSolverIterations: number;
  readonly maximumSolverResidualNorm: number;
};

export type AtrialLandLateStretchRunV1 = {
  readonly armId: AtrialLandLateStretchArmIdV1;
  readonly trajectoryId: ArmDefinitionV1["trajectoryId"];
  readonly activationStrength: 0 | 1;
  readonly dtSec: number;
  readonly expectedStepCount: number;
  readonly calciumDriveTimeSec: number;
  readonly calciumEventAppliedCount: number;
  readonly commonPreEventStateSha256: string;
  readonly sourceLandStateAtStart: readonly number[];
  readonly calciumStateAtStart: readonly [number, number];
  readonly trajectoryProvenanceSha256: string;
  readonly solverProvenanceSha256: string;
  readonly inputProvenanceSha256: string;
  readonly ok: boolean;
  readonly failureReason: string | null;
  readonly failureMessage: string | null;
  readonly finalSourceLandState: readonly number[];
  readonly finalCalciumState: readonly [number, number];
  readonly samples: readonly AtrialLandLateStretchSampleV1[];
  readonly metrics: AtrialLandLateStretchMetricsV1 | null;
};

export type AtrialLandLateStretchDtComparisonV1 = {
  readonly armId: AtrialLandLateStretchArmIdV1;
  readonly fineReferenceDtSec: 0.00025;
  readonly available: boolean;
  readonly coarseToFine: AtrialLandLateStretchNormalizedDeltaV1 | null;
  readonly mediumToFine: AtrialLandLateStretchNormalizedDeltaV1 | null;
  readonly monotonicConvergenceRequired: false;
};

export type AtrialLandLateStretchNormalizedDeltaV1 = {
  readonly primaryPeak: number;
  readonly secondarySpikeGain: number;
  readonly postRestretchImpulse: number;
  readonly finalSourceStateMaximum: number;
};

export type AtrialLandLateStretchSecondaryComponentV1 = {
  readonly dtSec: number;
  readonly available: boolean;
  readonly restretchArmId: "shortening-restretch";
  readonly matchedHoldCounterfactualArmId: "shortening-hold";
  readonly activeOffControlArmId: "active-off";
  readonly peakRestretchMinusMatchedHoldPa: number | null;
  readonly peakRestretchMinusMatchedHoldTimeSec: number | null;
  readonly positiveRestretchMinusMatchedHoldImpulsePaSec: number | null;
  readonly maximumRestretchMinusMatchedHoldUpstrokePaPerSec: number | null;
  readonly normalizedPeakRestretchMinusMatchedHold: number | null;
  readonly activeOffSelfReRisePa: number | null;
  readonly activeOffSelfReRiseImpulsePaSec: number | null;
  readonly peakComponentMinusActiveOffSelfReRisePa: number | null;
  readonly totalStressSecondarySpikeDetected: boolean | null;
  readonly matchedCounterfactualComponentDetected: boolean | null;
  readonly morphologyUsedAsGate: false;
  readonly interpretation:
    "matched-hold-difference-is-a-component-diagnostic-not-proof-of-a-visible-secondary-peak";
};

export type AtrialLandLateStretchComponentReportV1 = {
  readonly protocolId: typeof ATRIAL_LAND_LATE_STRETCH_COMPONENT_PROTOCOL_V1_ID;
  readonly claimBoundary: typeof ATRIAL_LAND_LATE_STRETCH_COMPONENT_CLAIM_BOUNDARY_V1;
  readonly diagnosticOnly: true;
  readonly closedLoopReleaseEligible: false;
  readonly physiologicalValidationClaimed: false;
  readonly morphologyAcceptanceThresholdUsed: false;
  readonly modelBinding: {
    readonly landModelId: typeof LAND2017_MYOFILAMENT_MODEL_ID;
    readonly landEquationsVersion: typeof LAND2017_EQUATIONS_VERSION;
    readonly atrialLandParameterSetId: string;
    readonly atrialLandParameterSetStableHash: string;
    readonly tissueManifestBundleSha256: string;
    readonly atrialTissueManifestSha256: string;
    readonly atrialTargetPackSha256: string;
    readonly wallAdapterTissueManifestSha256: string;
    readonly prescribedCalciumEvidenceId: string;
    readonly electricalToCalciumDelaySec: 0.012;
  };
  readonly provenance: {
    readonly manifestBindingSha256: string;
    readonly calciumInputSha256: string;
    readonly solverPolicySha256: string;
    readonly burnInPolicySha256: string;
    readonly commonPreEventStateSha256: string;
    readonly protocolInputSha256: string;
  };
  readonly commonPreEventState: {
    readonly sourceLandState: readonly number[];
    readonly calciumState: readonly [number, number];
    readonly freeCalciumUM: number;
    readonly fiberLogStrain: number;
    readonly landEngineeringStrain: number;
    readonly wallActiveKirchhoffStressPa: number;
    readonly burnInStepCount: number;
    readonly burnInLastStateMaximumAbsoluteChange: number;
    readonly burnInMinimumPopulation: number;
    readonly burnInMaximumAbsoluteStateConservationResidual: number;
    readonly burnInAllHealthFinite: boolean;
    readonly burnInAnyProjectionUsed: boolean;
  };
  readonly dtFamilySec: typeof ATRIAL_LAND_LATE_STRETCH_DT_FAMILY_SEC_V1;
  readonly armDefinitions: readonly ArmDefinitionV1[];
  readonly timing: typeof ATRIAL_LAND_LATE_STRETCH_TIMING_V1;
  readonly runs: readonly AtrialLandLateStretchRunV1[];
  readonly secondaryComponents: readonly AtrialLandLateStretchSecondaryComponentV1[];
  readonly dtComparisons: readonly AtrialLandLateStretchDtComparisonV1[];
  readonly diagnosticGate: {
    readonly completeFourByThreeMatrix: boolean;
    readonly bitExactCommonPreEventState: boolean;
    readonly allRunsSolved: boolean;
    readonly allPopulationAndConservationHealthPassed: boolean;
    readonly allDtComparisonMetricsFinite: boolean;
    readonly allSecondaryComponentMetricsFinite: boolean;
    readonly secondarySpikeMorphologyUsedAsGate: false;
    readonly pass: boolean;
  };
  readonly resultSummarySha256: string;
};

type CommonPreEventStateV1 = {
  readonly sourceLandState: readonly number[];
  readonly calciumState: readonly [number, number];
  readonly freeCalciumUM: number;
  readonly fiberLogStrain: number;
  readonly landEngineeringStrain: number;
  readonly wallActiveKirchhoffStressPa: number;
  readonly burnInStepCount: number;
  readonly burnInLastStateMaximumAbsoluteChange: number;
  readonly burnInMinimumPopulation: number;
  readonly burnInMaximumAbsoluteStateConservationResidual: number;
  readonly burnInAllHealthFinite: boolean;
  readonly burnInAnyProjectionUsed: boolean;
};

/**
 * Executes a manifest-bound, isolated atrial Land protocol. It deliberately
 * excludes chamber pressure, passive/SLS stress, valves, circulation, and any
 * morphology pass criterion. Its only release-style gate is numerical and
 * provenance integrity; late-stretch morphology remains a reported diagnostic.
 */
export function runAtrialLandLateStretchComponentProtocolV1(
  sha256Hex: CanonicalSha256HexProvider,
): AtrialLandLateStretchComponentReportV1 {
  return runAtrialLandLateStretchComponentProtocolWithParameterSetV1(
    sha256Hex,
    buildAtrialHumanPriorLandEquationParametersV1(),
  );
}

/**
 * Explicit isolated-candidate entry point. The supplied parameter set is not
 * installed into the tissue manifest or any closed-loop runtime binding.
 */
export function runAtrialLandLateStretchComponentProtocolWithParameterSetV1(
  sha256Hex: CanonicalSha256HexProvider,
  parameterSet: Land2017SourceParameterSet,
): AtrialLandLateStretchComponentReportV1 {
  const bundle = buildPhaseA1TissueManifestBundleV1(sha256Hex);
  const wallContext = compilePhaseA1LandWallAdapterContextV1(bundle, "atrial", sha256Hex);

  const modelBinding = {
    landModelId: LAND2017_MYOFILAMENT_MODEL_ID,
    landEquationsVersion: LAND2017_EQUATIONS_VERSION,
    atrialLandParameterSetId: parameterSet.parameterSetId,
    atrialLandParameterSetStableHash: parameterSet.parameterSetStableHash,
    tissueManifestBundleSha256: bundle.contentSha256,
    atrialTissueManifestSha256: bundle.atrialManifest.contentSha256,
    atrialTargetPackSha256: bundle.atrialTargetPack.contentSha256,
    wallAdapterTissueManifestSha256: wallContext.tissueManifestSha256,
    prescribedCalciumEvidenceId: ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1.evidenceId,
    electricalToCalciumDelaySec: 0.012,
  } as const;
  const manifestBindingSha256 = computeCanonicalSha256(modelBinding, sha256Hex);
  const calciumInputSha256 = computeCanonicalSha256(
    ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
    sha256Hex,
  );
  const solverPolicySha256 = computeCanonicalSha256(
    {
      solverPolicy: SOLVER_POLICY,
      dtFamilySec: ATRIAL_LAND_LATE_STRETCH_DT_FAMILY_SEC_V1,
      sourceStateCoordinate: "land2017-source-zeta",
    },
    sha256Hex,
  );
  const burnInPolicySha256 = computeCanonicalSha256(BURN_IN_POLICY, sha256Hex);
  const commonPreEventState = buildCommonPreEventState(
    wallContext,
    parameterSet,
  );
  const commonPreEventStateSha256 = computeCanonicalSha256(commonPreEventState, sha256Hex);
  const protocolInputSha256 = computeCanonicalSha256(
    {
      protocolId: ATRIAL_LAND_LATE_STRETCH_COMPONENT_PROTOCOL_V1_ID,
      claimBoundary: ATRIAL_LAND_LATE_STRETCH_COMPONENT_CLAIM_BOUNDARY_V1,
      modelBinding,
      manifestBindingSha256,
      calciumInputSha256,
      solverPolicySha256,
      burnInPolicySha256,
      commonPreEventStateSha256,
      armDefinitions: ARM_DEFINITIONS,
      timing: ATRIAL_LAND_LATE_STRETCH_TIMING_V1,
      dtFamilySec: ATRIAL_LAND_LATE_STRETCH_DT_FAMILY_SEC_V1,
    },
    sha256Hex,
  );

  const runs: AtrialLandLateStretchRunV1[] = [];
  for (const dtSec of ATRIAL_LAND_LATE_STRETCH_DT_FAMILY_SEC_V1) {
    for (const arm of ARM_DEFINITIONS) {
      runs.push(runArm({
        arm,
        dtSec,
        commonPreEventState,
        commonPreEventStateSha256,
        solverPolicySha256,
        protocolInputSha256,
        wallContext,
        parameterSet,
        sha256Hex,
      }));
    }
  }

  const dtComparisons = ATRIAL_LAND_LATE_STRETCH_ARM_IDS_V1.map((armId) =>
    compareDtFamily(armId, runs));
  const secondaryComponents = ATRIAL_LAND_LATE_STRETCH_DT_FAMILY_SEC_V1.map((dtSec) =>
    computeSecondaryComponent(dtSec, runs));
  const completeFourByThreeMatrix = runs.length === 12
    && ATRIAL_LAND_LATE_STRETCH_DT_FAMILY_SEC_V1.every((dtSec) =>
      ATRIAL_LAND_LATE_STRETCH_ARM_IDS_V1.every((armId) =>
        runs.some((run) => run.dtSec === dtSec && run.armId === armId)));
  const bitExactCommonPreEventState = runs.every((run) =>
    run.commonPreEventStateSha256 === commonPreEventStateSha256
    && arraysBitExact(run.sourceLandStateAtStart, commonPreEventState.sourceLandState)
    && arraysBitExact(run.calciumStateAtStart, commonPreEventState.calciumState));
  const allRunsSolved = runs.every((run) => run.ok && run.metrics !== null);
  const allPopulationAndConservationHealthPassed = runs.every((run) =>
    run.metrics !== null
    && run.metrics.allSourceHealthFinite
    && !run.metrics.anyProjectionUsed
    && run.metrics.minimumPopulation >= -1e-12
    && run.metrics.maximumAbsoluteStateConservationResidual <= 1e-12);
  const allDtComparisonMetricsFinite = dtComparisons.every((comparison) =>
    comparison.available
    && comparison.coarseToFine !== null
    && comparison.mediumToFine !== null
    && allFinite(Object.values(comparison.coarseToFine))
    && allFinite(Object.values(comparison.mediumToFine)));
  const allSecondaryComponentMetricsFinite = secondaryComponents.every((component) =>
    component.available
    && secondaryComponentMetricsFinite(component));
  const diagnosticGate = {
    completeFourByThreeMatrix,
    bitExactCommonPreEventState,
    allRunsSolved,
    allPopulationAndConservationHealthPassed,
    allDtComparisonMetricsFinite,
    allSecondaryComponentMetricsFinite,
    secondarySpikeMorphologyUsedAsGate: false as const,
    pass: completeFourByThreeMatrix
      && bitExactCommonPreEventState
      && allRunsSolved
      && allPopulationAndConservationHealthPassed
      && allDtComparisonMetricsFinite
      && allSecondaryComponentMetricsFinite,
  };
  const resultSummarySha256 = computeCanonicalSha256(
    {
      protocolInputSha256,
      runSummaries: runs.map((run) => ({
        armId: run.armId,
        dtSec: run.dtSec,
        inputProvenanceSha256: run.inputProvenanceSha256,
        ok: run.ok,
        failureReason: run.failureReason,
        finalSourceLandState: run.finalSourceLandState,
        finalCalciumState: run.finalCalciumState,
        metrics: run.metrics,
      })),
      secondaryComponents,
      dtComparisons,
      diagnosticGate,
    },
    sha256Hex,
  );

  return deepFreeze({
    protocolId: ATRIAL_LAND_LATE_STRETCH_COMPONENT_PROTOCOL_V1_ID,
    claimBoundary: ATRIAL_LAND_LATE_STRETCH_COMPONENT_CLAIM_BOUNDARY_V1,
    diagnosticOnly: true,
    closedLoopReleaseEligible: false,
    physiologicalValidationClaimed: false,
    morphologyAcceptanceThresholdUsed: false,
    modelBinding,
    provenance: {
      manifestBindingSha256,
      calciumInputSha256,
      solverPolicySha256,
      burnInPolicySha256,
      commonPreEventStateSha256,
      protocolInputSha256,
    },
    commonPreEventState,
    dtFamilySec: ATRIAL_LAND_LATE_STRETCH_DT_FAMILY_SEC_V1,
    armDefinitions: ARM_DEFINITIONS,
    timing: ATRIAL_LAND_LATE_STRETCH_TIMING_V1,
    runs,
    secondaryComponents,
    dtComparisons,
    diagnosticGate,
    resultSummarySha256,
  });
}

type RunArmInputV1 = {
  readonly arm: ArmDefinitionV1;
  readonly dtSec: number;
  readonly commonPreEventState: CommonPreEventStateV1;
  readonly commonPreEventStateSha256: string;
  readonly solverPolicySha256: string;
  readonly protocolInputSha256: string;
  readonly wallContext: LandWallAdapterContextV1;
  readonly parameterSet: Land2017SourceParameterSet;
  readonly sha256Hex: CanonicalSha256HexProvider;
};

function runArm(input: RunArmInputV1): AtrialLandLateStretchRunV1 {
  const {
    arm,
    dtSec,
    commonPreEventState,
    commonPreEventStateSha256,
    solverPolicySha256,
    protocolInputSha256,
    wallContext,
    parameterSet,
    sha256Hex,
  } = input;
  const trajectoryPayload = trajectoryProvenancePayload(arm.trajectoryId);
  const trajectoryProvenanceSha256 = computeCanonicalSha256(trajectoryPayload, sha256Hex);
  const inputProvenanceSha256 = computeCanonicalSha256(
    {
      protocolInputSha256,
      commonPreEventStateSha256,
      solverPolicySha256,
      trajectoryProvenanceSha256,
      dtSec,
      arm,
    },
    sha256Hex,
  );
  const expectedStepCount = exactStepCount(ATRIAL_LAND_LATE_STRETCH_TIMING_V1.durationSec, dtSec);
  const calciumEvent = calciumDriveEventFromElectricalV1({
    eventId: `${ATRIAL_LAND_LATE_STRETCH_COMPONENT_PROTOCOL_V1_ID}:${arm.armId}`,
    electricalTimeSec: ATRIAL_LAND_LATE_STRETCH_TIMING_V1.electricalActivationTimeSec,
    strength: arm.activationStrength,
  }, ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1);
  let calciumState: ExactEventCalciumStateV1 = Object.freeze([
    commonPreEventState.calciumState[0],
    commonPreEventState.calciumState[1],
  ]);
  let sourceState = Float64Array.from(commonPreEventState.sourceLandState);
  let previousFreeCalciumUM = commonPreEventState.freeCalciumUM;
  let eventAppliedCount = 0;
  const samples: AtrialLandLateStretchSampleV1[] = [];

  for (let step = 1; step <= expectedStepCount; step += 1) {
    const previousTimeSec = (step - 1) * dtSec;
    const timeSec = step * dtSec;
    const events: readonly CalciumDriveEventV1[] =
      calciumEvent.calciumDriveTimeSec > previousTimeSec
      && calciumEvent.calciumDriveTimeSec <= timeSec
        ? [calciumEvent]
        : [];
    eventAppliedCount += events.length;
    calciumState = advanceExactEventCalciumV1(
      calciumState,
      previousTimeSec,
      timeSec,
      events,
      ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
    );
    const calcium = evaluateExactEventCalciumV1(
      calciumState,
      ATRIAL_EXACT_EVENT_CALCIUM_CANDIDATE_PRIOR_V1,
    );
    const previousFiberLogStrain = fiberLogStrainAtTime(arm.trajectoryId, previousTimeSec);
    const fiberLogStrain = fiberLogStrainAtTime(arm.trajectoryId, timeSec);
    const previousLength = evaluateLandLengthStateV1(wallContext, {
      fiberLogStrain: previousFiberLogStrain,
    });
    const length = evaluateLandLengthStateV1(wallContext, { fiberLogStrain });
    const landInput: LandStepInput = {
      freeCalciumUM: calcium.freeCalciumUM,
      previousFiberEngineeringStrain: previousLength.landEngineeringStrain,
      stageFiberEngineeringStrain: length.landEngineeringStrain,
      dtSec,
      stage: { scheme: "BE", stageIndex: 0 },
    };
    const solved = solveLand2017BackwardEulerSubsteps(
      sourceState,
      landInput,
      solverOptions(previousFreeCalciumUM),
      parameterSet,
    );
    if (!solved.ok || solved.output === undefined) {
      return deepFreeze({
        armId: arm.armId,
        trajectoryId: arm.trajectoryId,
        activationStrength: arm.activationStrength,
        dtSec,
        expectedStepCount,
        calciumDriveTimeSec: calciumEvent.calciumDriveTimeSec,
        calciumEventAppliedCount: eventAppliedCount,
        commonPreEventStateSha256,
        sourceLandStateAtStart: [...commonPreEventState.sourceLandState],
        calciumStateAtStart: [...commonPreEventState.calciumState] as [number, number],
        trajectoryProvenanceSha256,
        solverProvenanceSha256: solverPolicySha256,
        inputProvenanceSha256,
        ok: false,
        failureReason: solved.failureReason ?? "unknown-solver-failure",
        failureMessage: solved.failureMessage ?? "Land solver failed without a message",
        finalSourceLandState: Array.from(sourceState),
        finalCalciumState: [calciumState[0], calciumState[1]],
        samples,
        metrics: null,
      });
    }
    sourceState = solved.nextState;
    const wallStress = wallStressFromSource(
      wallContext,
      length,
      solved.output.sourceActiveFiberStressPa,
    );
    samples.push({
      timeSec,
      freeCalciumUM: calcium.freeCalciumUM,
      fiberLogStrain,
      fiberLogStrainRatePerSec: (fiberLogStrain - previousFiberLogStrain) / dtSec,
      landEngineeringStrain: length.landEngineeringStrain,
      sourceActiveFiberStressPa: solved.output.sourceActiveFiberStressPa,
      wallActiveKirchhoffStressPa: wallStress,
      minimumPopulation: solved.output.health.minimumPopulation,
      stateConservationResidual: solved.output.health.stateConservationResidual,
      healthFinite: solved.output.health.finite,
      projectionUsed: solved.output.health.projectionUsed,
      solverIterations: solved.iterations,
      solverResidualNorm: solved.residualNorm,
      solverLineSearchSteps: solved.lineSearchSteps,
    });
    previousFreeCalciumUM = calcium.freeCalciumUM;
  }

  const metrics = computeMetrics(samples, commonPreEventState.wallActiveKirchhoffStressPa);
  return deepFreeze({
    armId: arm.armId,
    trajectoryId: arm.trajectoryId,
    activationStrength: arm.activationStrength,
    dtSec,
    expectedStepCount,
    calciumDriveTimeSec: calciumEvent.calciumDriveTimeSec,
    calciumEventAppliedCount: eventAppliedCount,
    commonPreEventStateSha256,
    sourceLandStateAtStart: [...commonPreEventState.sourceLandState],
    calciumStateAtStart: [...commonPreEventState.calciumState] as [number, number],
    trajectoryProvenanceSha256,
    solverProvenanceSha256: solverPolicySha256,
    inputProvenanceSha256,
    ok: true,
    failureReason: null,
    failureMessage: null,
    finalSourceLandState: Array.from(sourceState),
    finalCalciumState: [calciumState[0], calciumState[1]],
    samples,
    metrics,
  });
}

function buildCommonPreEventState(
  wallContext: LandWallAdapterContextV1,
  parameterSet: Land2017SourceParameterSet,
): CommonPreEventStateV1 {
  const length = evaluateLandLengthStateV1(wallContext, {
    fiberLogStrain: BURN_IN_POLICY.fixedFiberLogStrain,
  });
  const stepCount = exactStepCount(BURN_IN_POLICY.durationSec, BURN_IN_POLICY.dtSec);
  let sourceState = Float64Array.from(BURN_IN_POLICY.sourceStateSeed);
  let lastStateMaximumAbsoluteChange = Number.POSITIVE_INFINITY;
  let minimumPopulation = Number.POSITIVE_INFINITY;
  let maximumAbsoluteStateConservationResidual = 0;
  let allHealthFinite = true;
  let anyProjectionUsed = false;
  let finalSourceStressPa = 0;

  for (let step = 0; step < stepCount; step += 1) {
    const solved = solveLand2017BackwardEulerSubsteps(
      sourceState,
      {
        freeCalciumUM: BURN_IN_POLICY.freeCalciumUM,
        previousFiberEngineeringStrain: length.landEngineeringStrain,
        stageFiberEngineeringStrain: length.landEngineeringStrain,
        dtSec: BURN_IN_POLICY.dtSec,
        stage: { scheme: "BE", stageIndex: 0 },
      },
      solverOptions(BURN_IN_POLICY.freeCalciumUM),
      parameterSet,
    );
    if (!solved.ok || solved.output === undefined) {
      throw new Error(
        `Atrial Land shared-state burn-in failed: ${solved.failureReason ?? "unknown"}: ${solved.failureMessage ?? "no message"}`,
      );
    }
    lastStateMaximumAbsoluteChange = maximumAbsoluteDifference(sourceState, solved.nextState);
    sourceState = solved.nextState;
    finalSourceStressPa = solved.output.sourceActiveFiberStressPa;
    minimumPopulation = Math.min(minimumPopulation, solved.output.health.minimumPopulation);
    maximumAbsoluteStateConservationResidual = Math.max(
      maximumAbsoluteStateConservationResidual,
      Math.abs(solved.output.health.stateConservationResidual),
    );
    allHealthFinite = allHealthFinite && solved.output.health.finite;
    anyProjectionUsed = anyProjectionUsed || solved.output.health.projectionUsed;
  }

  return deepFreeze({
    sourceLandState: Array.from(sourceState),
    calciumState: [0, 0] as [number, number],
    freeCalciumUM: BURN_IN_POLICY.freeCalciumUM,
    fiberLogStrain: BURN_IN_POLICY.fixedFiberLogStrain,
    landEngineeringStrain: length.landEngineeringStrain,
    wallActiveKirchhoffStressPa: wallStressFromSource(
      wallContext,
      length,
      finalSourceStressPa,
    ),
    burnInStepCount: stepCount,
    burnInLastStateMaximumAbsoluteChange: lastStateMaximumAbsoluteChange,
    burnInMinimumPopulation: minimumPopulation,
    burnInMaximumAbsoluteStateConservationResidual: maximumAbsoluteStateConservationResidual,
    burnInAllHealthFinite: allHealthFinite,
    burnInAnyProjectionUsed: anyProjectionUsed,
  });
}

function computeMetrics(
  samples: readonly AtrialLandLateStretchSampleV1[],
  baselineWallActiveStressPa: number,
): AtrialLandLateStretchMetricsV1 {
  const primaryWindow = samples.filter((sample) =>
    sample.timeSec >= ATRIAL_LAND_LATE_STRETCH_TIMING_V1.calciumDriveDelaySec
    && sample.timeSec <= ATRIAL_LAND_LATE_STRETCH_TIMING_V1.restretchOnsetSec);
  const troughWindow = samples.filter((sample) =>
    sample.timeSec >= ATRIAL_LAND_LATE_STRETCH_TIMING_V1.shorteningEndSec
    && sample.timeSec <= ATRIAL_LAND_LATE_STRETCH_TIMING_V1.restretchOnsetSec);
  const lateWindow = samples.filter((sample) =>
    sample.timeSec >= ATRIAL_LAND_LATE_STRETCH_TIMING_V1.restretchOnsetSec
    && sample.timeSec <= ATRIAL_LAND_LATE_STRETCH_TIMING_V1.lateMetricWindowEndSec);
  if (primaryWindow.length === 0 || troughWindow.length === 0 || lateWindow.length === 0) {
    throw new Error("Late-stretch metric windows must each contain at least one sample");
  }
  const primaryPeak = maximumBy(primaryWindow, (sample) => sample.wallActiveKirchhoffStressPa);
  const trough = minimumBy(troughWindow, (sample) => sample.wallActiveKirchhoffStressPa);
  const latePeak = maximumBy(lateWindow, (sample) => sample.wallActiveKirchhoffStressPa);
  const primaryAmplitude = primaryPeak.wallActiveKirchhoffStressPa - baselineWallActiveStressPa;
  const secondarySpikeGainPa = latePeak.wallActiveKirchhoffStressPa
    - trough.wallActiveKirchhoffStressPa;
  const hasPositivePrimaryAmplitude = primaryAmplitude > Math.max(
    1e-9,
    1e-9 * Math.max(Math.abs(baselineWallActiveStressPa), 1),
  );
  const secondaryToPrimaryAmplitudeRatio = hasPositivePrimaryAmplitude
    ? secondarySpikeGainPa / primaryAmplitude
    : null;
  const relaxationThreshold = baselineWallActiveStressPa + 0.5 * primaryAmplitude;
  const relaxationSample = hasPositivePrimaryAmplitude
    ? samples.find((sample) =>
      sample.timeSec > primaryPeak.timeSec
      && sample.wallActiveKirchhoffStressPa <= relaxationThreshold)
    : undefined;
  const postRestretchPositiveStressImpulsePaSec = positiveStressImpulse(
    lateWindow,
    trough.wallActiveKirchhoffStressPa,
  );
  const maximumPostRestretchWallStressUpstrokePaPerSec = maximumUpstroke(lateWindow);
  const minimumPopulation = Math.min(...samples.map((sample) => sample.minimumPopulation));
  const maximumAbsoluteStateConservationResidual = Math.max(
    ...samples.map((sample) => Math.abs(sample.stateConservationResidual)),
  );
  const maximumSolverIterations = Math.max(...samples.map((sample) => sample.solverIterations));
  const maximumSolverResidualNorm = Math.max(...samples.map((sample) => sample.solverResidualNorm));
  const diagnosticNumericalFloorPa = Math.max(
    1e-6,
    1e-6 * Math.max(Math.abs(primaryPeak.wallActiveKirchhoffStressPa), 1),
  );
  return deepFreeze({
    baselineWallActiveStressPa,
    primaryPeakWallActiveStressPa: primaryPeak.wallActiveKirchhoffStressPa,
    primaryPeakTimeAfterElectricalMs: 1000 * primaryPeak.timeSec,
    primaryPeakTimeAfterCalciumDriveMs: 1000 * (
      primaryPeak.timeSec - ATRIAL_LAND_LATE_STRETCH_TIMING_V1.calciumDriveDelaySec
    ),
    primaryPeakAboveBaselinePa: primaryAmplitude,
    preRestretchTroughWallActiveStressPa: trough.wallActiveKirchhoffStressPa,
    preRestretchTroughTimeSec: trough.timeSec,
    latePeakWallActiveStressPa: latePeak.wallActiveKirchhoffStressPa,
    latePeakTimeSec: latePeak.timeSec,
    secondarySpikeGainPa,
    latePeakMinusPrimaryPa:
      latePeak.wallActiveKirchhoffStressPa - primaryPeak.wallActiveKirchhoffStressPa,
    secondaryToPrimaryAmplitudeRatio,
    postRestretchPositiveStressImpulsePaSec,
    maximumPostRestretchWallStressUpstrokePaPerSec,
    relaxation50AfterPrimaryMs: relaxationSample === undefined
      ? null
      : 1000 * (relaxationSample.timeSec - primaryPeak.timeSec),
    secondarySpikeDetectedDiagnostic: secondarySpikeGainPa > diagnosticNumericalFloorPa,
    minimumPopulation,
    maximumAbsoluteStateConservationResidual,
    allSourceHealthFinite: samples.every((sample) => sample.healthFinite),
    anyProjectionUsed: samples.some((sample) => sample.projectionUsed),
    maximumSolverIterations,
    maximumSolverResidualNorm,
  });
}

function computeSecondaryComponent(
  dtSec: number,
  runs: readonly AtrialLandLateStretchRunV1[],
): AtrialLandLateStretchSecondaryComponentV1 {
  const restretch = runs.find((run) =>
    run.dtSec === dtSec && run.armId === "shortening-restretch");
  const hold = runs.find((run) =>
    run.dtSec === dtSec && run.armId === "shortening-hold");
  const activeOff = runs.find((run) =>
    run.dtSec === dtSec && run.armId === "active-off");
  const available = restretch?.metrics !== null && restretch?.metrics !== undefined
    && hold?.metrics !== null && hold?.metrics !== undefined
    && activeOff?.metrics !== null && activeOff?.metrics !== undefined
    && restretch.samples.length === hold.samples.length;
  const unavailable: AtrialLandLateStretchSecondaryComponentV1 = {
    dtSec,
    available: false,
    restretchArmId: "shortening-restretch",
    matchedHoldCounterfactualArmId: "shortening-hold",
    activeOffControlArmId: "active-off",
    peakRestretchMinusMatchedHoldPa: null,
    peakRestretchMinusMatchedHoldTimeSec: null,
    positiveRestretchMinusMatchedHoldImpulsePaSec: null,
    maximumRestretchMinusMatchedHoldUpstrokePaPerSec: null,
    normalizedPeakRestretchMinusMatchedHold: null,
    activeOffSelfReRisePa: null,
    activeOffSelfReRiseImpulsePaSec: null,
    peakComponentMinusActiveOffSelfReRisePa: null,
    totalStressSecondarySpikeDetected: null,
    matchedCounterfactualComponentDetected: null,
    morphologyUsedAsGate: false,
    interpretation:
      "matched-hold-difference-is-a-component-diagnostic-not-proof-of-a-visible-secondary-peak",
  };
  if (!available || restretch === undefined || hold === undefined || activeOff === undefined
    || restretch.metrics === null || hold.metrics === null || activeOff.metrics === null) {
    return deepFreeze(unavailable);
  }

  const differenceSamples: Array<{ timeSec: number; stressDifferencePa: number }> = [];
  for (let index = 0; index < restretch.samples.length; index += 1) {
    const restretchSample = restretch.samples[index];
    const holdSample = hold.samples[index];
    if (!Object.is(restretchSample.timeSec, holdSample.timeSec)) {
      return deepFreeze(unavailable);
    }
    if (
      restretchSample.timeSec >= ATRIAL_LAND_LATE_STRETCH_TIMING_V1.restretchOnsetSec
      && restretchSample.timeSec <= ATRIAL_LAND_LATE_STRETCH_TIMING_V1.lateMetricWindowEndSec
    ) {
      differenceSamples.push({
        timeSec: restretchSample.timeSec,
        stressDifferencePa: restretchSample.wallActiveKirchhoffStressPa
          - holdSample.wallActiveKirchhoffStressPa,
      });
    }
  }
  if (differenceSamples.length < 2) return deepFreeze(unavailable);
  const peak = maximumBy(differenceSamples, (sample) => sample.stressDifferencePa);
  let positiveImpulse = 0;
  let maximumUpstrokePaPerSec = 0;
  for (let index = 1; index < differenceSamples.length; index += 1) {
    const previous = differenceSamples[index - 1];
    const current = differenceSamples[index];
    const intervalSec = current.timeSec - previous.timeSec;
    positiveImpulse += 0.5 * (
      Math.max(0, previous.stressDifferencePa)
      + Math.max(0, current.stressDifferencePa)
    ) * intervalSec;
    maximumUpstrokePaPerSec = Math.max(
      maximumUpstrokePaPerSec,
      (current.stressDifferencePa - previous.stressDifferencePa) / intervalSec,
    );
  }
  const primaryAmplitude = hold.metrics.primaryPeakAboveBaselinePa;
  const numericalFloorPa = Math.max(
    1e-6,
    1e-6 * Math.max(Math.abs(hold.metrics.primaryPeakWallActiveStressPa), 1),
  );
  return deepFreeze({
    dtSec,
    available: true,
    restretchArmId: "shortening-restretch",
    matchedHoldCounterfactualArmId: "shortening-hold",
    activeOffControlArmId: "active-off",
    peakRestretchMinusMatchedHoldPa: peak.stressDifferencePa,
    peakRestretchMinusMatchedHoldTimeSec: peak.timeSec,
    positiveRestretchMinusMatchedHoldImpulsePaSec: positiveImpulse,
    maximumRestretchMinusMatchedHoldUpstrokePaPerSec: maximumUpstrokePaPerSec,
    normalizedPeakRestretchMinusMatchedHold:
      peak.stressDifferencePa / Math.max(Math.abs(primaryAmplitude), 1),
    activeOffSelfReRisePa: activeOff.metrics.secondarySpikeGainPa,
    activeOffSelfReRiseImpulsePaSec:
      activeOff.metrics.postRestretchPositiveStressImpulsePaSec,
    peakComponentMinusActiveOffSelfReRisePa:
      peak.stressDifferencePa - activeOff.metrics.secondarySpikeGainPa,
    totalStressSecondarySpikeDetected:
      restretch.metrics.secondarySpikeDetectedDiagnostic,
    matchedCounterfactualComponentDetected: peak.stressDifferencePa > numericalFloorPa,
    morphologyUsedAsGate: false,
    interpretation:
      "matched-hold-difference-is-a-component-diagnostic-not-proof-of-a-visible-secondary-peak",
  });
}

function compareDtFamily(
  armId: AtrialLandLateStretchArmIdV1,
  runs: readonly AtrialLandLateStretchRunV1[],
): AtrialLandLateStretchDtComparisonV1 {
  const coarse = runs.find((run) => run.armId === armId && run.dtSec === 0.001);
  const medium = runs.find((run) => run.armId === armId && run.dtSec === 0.0005);
  const fine = runs.find((run) => run.armId === armId && run.dtSec === 0.00025);
  const available = coarse?.metrics !== null && coarse?.metrics !== undefined
    && medium?.metrics !== null && medium?.metrics !== undefined
    && fine?.metrics !== null && fine?.metrics !== undefined;
  return deepFreeze({
    armId,
    fineReferenceDtSec: 0.00025 as const,
    available,
    coarseToFine: available
      ? normalizedDelta(coarse, fine)
      : null,
    mediumToFine: available
      ? normalizedDelta(medium, fine)
      : null,
    monotonicConvergenceRequired: false as const,
  });
}

function normalizedDelta(
  test: AtrialLandLateStretchRunV1,
  fine: AtrialLandLateStretchRunV1,
): AtrialLandLateStretchNormalizedDeltaV1 {
  if (test.metrics === null || fine.metrics === null) {
    throw new Error("normalizedDelta requires two successful runs");
  }
  return deepFreeze({
    primaryPeak: relativeDelta(
      test.metrics.primaryPeakWallActiveStressPa,
      fine.metrics.primaryPeakWallActiveStressPa,
    ),
    secondarySpikeGain: relativeDelta(
      test.metrics.secondarySpikeGainPa,
      fine.metrics.secondarySpikeGainPa,
    ),
    postRestretchImpulse: relativeDelta(
      test.metrics.postRestretchPositiveStressImpulsePaSec,
      fine.metrics.postRestretchPositiveStressImpulsePaSec,
    ),
    finalSourceStateMaximum: maximumNormalizedArrayDelta(
      test.finalSourceLandState,
      fine.finalSourceLandState,
    ),
  });
}

function trajectoryProvenancePayload(
  trajectoryId: ArmDefinitionV1["trajectoryId"],
): object {
  return {
    trajectoryId,
    timing: ATRIAL_LAND_LATE_STRETCH_TIMING_V1,
    strainCoordinate: "fiber-log-strain",
    wallToLandLengthAdapterAppliedAfterTrajectory: true,
  };
}

function fiberLogStrainAtTime(
  trajectoryId: ArmDefinitionV1["trajectoryId"],
  timeSec: number,
): number {
  const timing = ATRIAL_LAND_LATE_STRETCH_TIMING_V1;
  if (trajectoryId === "fixed-isometric") return timing.initialFiberLogStrain;
  if (timeSec <= timing.shorteningOnsetSec) return timing.initialFiberLogStrain;
  if (timeSec < timing.shorteningEndSec) {
    return raisedCosineInterpolate(
      timing.initialFiberLogStrain,
      timing.shortenedFiberLogStrain,
      (timeSec - timing.shorteningOnsetSec)
        / (timing.shorteningEndSec - timing.shorteningOnsetSec),
    );
  }
  if (trajectoryId === "shorten-then-hold" || timeSec <= timing.restretchOnsetSec) {
    return timing.shortenedFiberLogStrain;
  }
  if (timeSec < timing.restretchEndSec) {
    return raisedCosineInterpolate(
      timing.shortenedFiberLogStrain,
      timing.initialFiberLogStrain,
      (timeSec - timing.restretchOnsetSec)
        / (timing.restretchEndSec - timing.restretchOnsetSec),
    );
  }
  return timing.initialFiberLogStrain;
}

function raisedCosineInterpolate(start: number, end: number, fraction: number): number {
  const clamped = Math.max(0, Math.min(1, fraction));
  const weight = 0.5 - 0.5 * Math.cos(Math.PI * clamped);
  return start + (end - start) * weight;
}

function solverOptions(previousFreeCalciumUM: number): Land2017SubstepSolveOptions {
  return {
    maxIterations: SOLVER_POLICY.maxIterations,
    residualTolerance: SOLVER_POLICY.residualTolerance,
    lineSearchMinStep: SOLVER_POLICY.lineSearchMinStep,
    lineSearchReduction: SOLVER_POLICY.lineSearchReduction,
    substeps: SOLVER_POLICY.substeps,
    previousFreeCalciumUM,
  };
}

function wallStressFromSource(
  context: LandWallAdapterContextV1,
  length: LandLengthStateOutputV1,
  sourceActiveFiberStressPa: number,
): number {
  return evaluateLandNominalToKirchhoffAtStateV1(context, {
    sourceStressConvention: "land2017-Ta",
    landActiveNominalStressPa: sourceActiveFiberStressPa,
    length,
  }).wallActiveKirchhoffStressPa;
}

function positiveStressImpulse(
  samples: readonly AtrialLandLateStretchSampleV1[],
  referenceStressPa: number,
): number {
  let integral = 0;
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const current = samples[index];
    const previousAbove = Math.max(0, previous.wallActiveKirchhoffStressPa - referenceStressPa);
    const currentAbove = Math.max(0, current.wallActiveKirchhoffStressPa - referenceStressPa);
    integral += 0.5 * (previousAbove + currentAbove) * (current.timeSec - previous.timeSec);
  }
  return integral;
}

function maximumUpstroke(samples: readonly AtrialLandLateStretchSampleV1[]): number {
  let maximum = 0;
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const current = samples[index];
    maximum = Math.max(
      maximum,
      (current.wallActiveKirchhoffStressPa - previous.wallActiveKirchhoffStressPa)
        / (current.timeSec - previous.timeSec),
    );
  }
  return maximum;
}

function maximumBy<T>(values: readonly T[], accessor: (value: T) => number): T {
  let selected = values[0];
  for (let index = 1; index < values.length; index += 1) {
    if (accessor(values[index]) > accessor(selected)) selected = values[index];
  }
  return selected;
}

function minimumBy<T>(values: readonly T[], accessor: (value: T) => number): T {
  let selected = values[0];
  for (let index = 1; index < values.length; index += 1) {
    if (accessor(values[index]) < accessor(selected)) selected = values[index];
  }
  return selected;
}

function exactStepCount(durationSec: number, dtSec: number): number {
  const count = durationSec / dtSec;
  const rounded = Math.round(count);
  if (Math.abs(count - rounded) > 1e-10) {
    throw new Error("Protocol duration must contain an integer number of time steps");
  }
  return rounded;
}

function maximumAbsoluteDifference(left: ArrayLike<number>, right: ArrayLike<number>): number {
  if (left.length !== right.length) throw new Error("State arrays must have equal length");
  let maximum = 0;
  for (let index = 0; index < left.length; index += 1) {
    maximum = Math.max(maximum, Math.abs(left[index] - right[index]));
  }
  return maximum;
}

function relativeDelta(value: number, reference: number): number {
  return Math.abs(value - reference) / (1 + Math.abs(reference));
}

function maximumNormalizedArrayDelta(
  value: readonly number[],
  reference: readonly number[],
): number {
  if (value.length !== reference.length) throw new Error("State arrays must have equal length");
  let maximum = 0;
  for (let index = 0; index < value.length; index += 1) {
    maximum = Math.max(maximum, relativeDelta(value[index], reference[index]));
  }
  return maximum;
}

function arraysBitExact(left: readonly number[], right: readonly number[]): boolean {
  return left.length === right.length && left.every((value, index) => Object.is(value, right[index]));
}

function allFinite(values: readonly number[]): boolean {
  return values.every((value) => Number.isFinite(value));
}

function secondaryComponentMetricsFinite(
  component: AtrialLandLateStretchSecondaryComponentV1,
): boolean {
  const values = [
    component.peakRestretchMinusMatchedHoldPa,
    component.peakRestretchMinusMatchedHoldTimeSec,
    component.positiveRestretchMinusMatchedHoldImpulsePaSec,
    component.maximumRestretchMinusMatchedHoldUpstrokePaPerSec,
    component.normalizedPeakRestretchMinusMatchedHold,
    component.activeOffSelfReRisePa,
    component.activeOffSelfReRiseImpulsePaSec,
    component.peakComponentMinusActiveOffSelfReRisePa,
  ];
  return values.every((value) => value !== null && Number.isFinite(value));
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child);
  }
  return value;
}
