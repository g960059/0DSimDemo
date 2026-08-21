import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_IMPLEMENTATION_COMMIT_SHA_V1,
  runMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationWithDependenciesV1,
  type MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationV1";
import { continueMainWireIntegratedModelPeriodicMechanicalPortLedgerForDtCharacterizationV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerEngineeringV1";
import {
  MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_IMPLEMENTATION_COMMIT_SHA_V1,
  runMainWireIntrinsicVentricularPassiveReducedSurfacePilotEngineeringV1,
  type MainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1,
} from "@/engine/myocardium/experiments/MainWireIntrinsicVentricularPassiveReducedSurfacePilotEngineeringV1";
import {
  fitMainWireIntegratedModelPhaseWiseIsochronalRelationV2,
  evaluateMainWireIntegratedModelBaselineResearchPvaV2,
  type MainWireIntegratedModelBaselineResearchPvaV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPhaseWiseEmaxBaselinePvaResearchV1";
import {
  generateMainWireIntrinsicPassiveCenterSlicesForPvaV1,
  type MainWireIntrinsicPassiveCenterSliceOutcomeV1,
  type MainWireIntrinsicPassiveCenterSliceV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPvaDiastolicReferenceComparisonV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_METHOD_SPECIFIC_PVA_METHOD_V1_ID,
  MAIN_WIRE_INTEGRATED_MODEL_METHOD_SPECIFIC_PVA_OUTPUT_IDS_V1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelMethodSpecificPvaMainCandidateV1";
import type {
  MainWireIntegratedModelPvaLinearRelationV1,
  MainWireIntegratedModelPvaVentricleV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelMethodSpecificPvaResearchV1";
import {
  createMainWireIntegratedModelRegularSinusAllOffFixtureV3,
  runMainWireIntegratedModelPeriodicSteadyV3,
  type MainWireIntegratedModelPeriodicSteadyResultV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import {
  runMainWireIntegratedModelTransientVenousReturnResearchTrajectoryFromSourceV2,
  type MainWireIntegratedModelTransientPvaStateBeatV2,
  type MainWireIntegratedModelTransientPvaStateSampleV2,
  type MainWireIntegratedModelTransientVenousReturnResearchTrajectoryV2,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelTransientVenousReturnReductionEngineeringV1";
import {
  sampleMainWireIntegratedModelTransientPvCompactLoopAtResolutionV2,
  type MainWireIntegratedModelTransientPvCompactLoopPointV1,
  type MainWireIntegratedModelTransientPvRawBeatV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelTransientVenousReturnReductionPureV1";

export const MAIN_WIRE_INTEGRATED_MODEL_PHASE_WISE_PVA_QUALIFICATION_V2_ID =
  "main-wire-integrated-model-phase-wise-pva-qualification-v2" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_PHASE_WISE_PVA_QUALIFICATION_V2_THRESHOLDS =
  Object.freeze({
    baselineExclusionRelativeDifferenceMaximum: 0.1,
    phaseResolutionRelativeDifferenceMaximum: 0.02,
    selectedPhaseStateDispersionIndexMaximum: 0.25,
    releaseSlopeDifferenceFractionMaximum: 0.1,
  });

const VENTRICLES = Object.freeze(["LV", "RV"] as const);
const WALLS = Object.freeze(["LVFW", "SEP", "RVFW"] as const);
type WallId = (typeof WALLS)[number];

type StageStatus = "completed" | "failed" | "not-attempted";

export type MainWireIntegratedModelPhaseWisePvaQualificationInputV2 = Readonly<{
  source: Readonly<{
    modelConditionIdentityHash: string;
    protocolIdentityHash: string;
    terminalCheckpointSha256: string;
    terminalAcceptedTimeSec: number;
    terminalAcceptedRevision: number;
    numericalPeriod1Established: true;
  }>;
  transient: Readonly<{
    sourceModelConditionIdentityHash: string;
    sourceProtocolIdentityHash: string;
    sourceTerminalCheckpointSha256: string;
    sourceTerminalAcceptedTimeSec: number;
    sourceTerminalAcceptedRevision: number;
    rawBeats: readonly MainWireIntegratedModelTransientPvRawBeatV1[];
    stateBeats: readonly MainWireIntegratedModelTransientPvaStateBeatV2[];
  }>;
  ledger: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1;
  passive: Readonly<{
    executedInSameAnalysisTransaction: true;
    surfaceSourceBindingsPassed: boolean;
    slices: readonly MainWireIntrinsicPassiveCenterSliceOutcomeV1[];
  }>;
}>;

export type MainWireIntegratedModelPhaseWisePvaQualificationOutputV2 =
  Readonly<{
    outputId: (typeof MAIN_WIRE_INTEGRATED_MODEL_METHOD_SPECIFIC_PVA_OUTPUT_IDS_V1)[number];
    methodId: typeof MAIN_WIRE_INTEGRATED_MODEL_METHOD_SPECIFIC_PVA_METHOD_V1_ID;
    ventricleId: MainWireIntegratedModelPvaVentricleV1;
    status: "qualified-estimate" | "limited-estimate";
    unit: "J";
    mainOutputValueJ: number;
    energy: Readonly<{
      externalWorkJ: number;
      potentialEnergyEquivalentJ: number;
      pvaEstimateJ: number;
      mechanicalConversionRatio: number;
    }>;
    systolicRelation: Readonly<{
      phaseSampleCount: 64;
      phaseIndex: number;
      phase01: number;
      elastanceMmHgPerMl: number;
      volumeAxisInterceptMl: number;
      measuredVolumeRangeMl: readonly [number, number];
      rSquared: number | null;
      rootMeanSquaredResidualMmHg: number;
      releaseSlopeDifferenceFraction: number;
    }>;
    passiveReference: Readonly<{
      referenceId: "same-transaction-fixed-contralateral-intrinsic-passive-center-slice-v2";
      canonicalOwnerBindingsPassed: true;
      fixedContralateralVentricleId: MainWireIntegratedModelPvaVentricleV1;
      fixedContralateralVolumeMl: number;
      supportedVolumeRangeMl: readonly [number, number];
    }>;
    sensitivity: Readonly<{
      baselineExclusion: Readonly<{
        available: true;
        estimateJ: number;
        absoluteDifferenceJ: number;
        relativeDifference: number;
        selectedPhaseIndex: number;
      }>;
      phaseResolution: Readonly<{
        available: true;
        baselineSampleCount: 64;
        refinedSampleCount: 128;
        refinedEstimateJ: number;
        absoluteDifferenceJ: number;
        relativeDifference: number;
        refinedPhaseIndex: number;
        circularPhaseDifference: number;
      }>;
      selectedPhaseStateDispersion: MainWireIntegratedModelSelectedPhaseStateDispersionV2;
      externalWorkCoarseFineDifferenceJ: number;
      systolicAreaOutsideMeasuredRangeFraction: number;
    }>;
    limitations: readonly string[];
  }>;

export type MainWireIntegratedModelSelectedPhaseStateDispersionV2 = Readonly<{
  available: true;
  beatCount: number;
  selectedPhase01: number;
  contralateralVolumeMl: NumericSpreadV2;
  commonPericardialPressureMmHg: NumericSpreadV2;
  maximumVentricularPericardialPressureMismatchMmHg: number;
  septalMidwallCapVolumeMl: NumericSpreadV2;
  junctionRadiusM: NumericSpreadV2;
  freeCalciumUMByWall: Readonly<Record<WallId, NumericSpreadV2>>;
  fiberLogStrainByWall: Readonly<Record<WallId, NumericSpreadV2>>;
  fiberLogStrainRatePerSecByWall: Readonly<Record<WallId, NumericSpreadV2>>;
  landStateByWall: Readonly<
    Record<
      WallId,
      readonly [
        NumericSpreadV2,
        NumericSpreadV2,
        NumericSpreadV2,
        NumericSpreadV2,
        NumericSpreadV2,
        NumericSpreadV2,
      ]
    >
  >;
  maximumNormalizedSpan: number;
}>;

type NumericSpreadV2 = Readonly<{
  minimum: number;
  maximum: number;
  mean: number;
  span: number;
  normalizedSpan: number;
}>;

export type MainWireIntegratedModelPhaseWisePvaQualificationV2 = Readonly<{
  qualificationId: typeof MAIN_WIRE_INTEGRATED_MODEL_PHASE_WISE_PVA_QUALIFICATION_V2_ID;
  status: "completed" | "unavailable";
  targetSurface: "completed-protocol-analysis";
  methodId: typeof MAIN_WIRE_INTEGRATED_MODEL_METHOD_SPECIFIC_PVA_METHOD_V1_ID;
  stages: Readonly<{
    source: StageStatus;
    transient: StageStatus;
    periodicLedger: StageStatus;
    passiveReference: StageStatus;
    qualification: StageStatus;
  }>;
  sourceIdentity: Readonly<{
    singlePeriodicSourceExecution: true;
    transientAndLedgerShareCheckpoint: boolean;
    passiveReferenceExecutedInSameAnalysisTransaction: boolean;
    passiveReferenceCanonicalOwnerBindingsPassed: boolean;
    allInputsBound: boolean;
  }>;
  outputs: readonly MainWireIntegratedModelPhaseWisePvaQualificationOutputV2[];
  failure: null | Readonly<{ stage: string; message: string }>;
  interpretation: Readonly<{
    methodSpecificPvaEstimateAvailable: boolean;
    genericPvaEstablished: false;
    clinicalPvaEstablished: false;
    oxygenConsumptionEstablished: false;
    liveSingleBeatOutput: false;
    automaticLmFallbackUsed: false;
    productValuePublished: false;
  }>;
}>;

export type MainWireIntegratedModelPhaseWisePvaQualificationDependenciesV2 =
  Readonly<{
    runSource: () => Promise<MainWireIntegratedModelPeriodicSteadyResultV3>;
    runTransient: (
      source: MainWireIntegratedModelPeriodicSteadyResultV3,
    ) => Promise<MainWireIntegratedModelTransientVenousReturnResearchTrajectoryV2>;
    runLedger: (
      source: MainWireIntegratedModelPeriodicSteadyResultV3,
    ) => Promise<MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1>;
    runPassiveSurface: () => Promise<MainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1>;
  }>;

const DEFAULT_DEPENDENCIES: MainWireIntegratedModelPhaseWisePvaQualificationDependenciesV2 =
  Object.freeze({
    runSource: () =>
      runMainWireIntegratedModelPeriodicSteadyV3({
        nominalDtSec: 0.001,
        maximumCycleCount: 250,
        executionPurpose: "canonical-evidence",
      }),
    runTransient:
      runMainWireIntegratedModelTransientVenousReturnResearchTrajectoryFromSourceV2,
    runLedger: (source) =>
      runMainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationWithDependenciesV1(
        {
          implementationCommitSha:
            MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_PORT_LEDGER_DT_IMPLEMENTATION_COMMIT_SHA_V1,
        },
        {
          runSource: async () => source,
          createFixture: () =>
            createMainWireIntegratedModelRegularSinusAllOffFixtureV3(),
          continueArm: (input) =>
            continueMainWireIntegratedModelPeriodicMechanicalPortLedgerForDtCharacterizationV1(
              input,
            ),
        },
      ),
    runPassiveSurface: () =>
      runMainWireIntrinsicVentricularPassiveReducedSurfacePilotEngineeringV1({
        implementationCommitSha:
          MAIN_WIRE_INTRINSIC_VENTRICULAR_PASSIVE_REDUCED_SURFACE_PILOT_IMPLEMENTATION_COMMIT_SHA_V1,
      }),
  });

export async function runMainWireIntegratedModelPhaseWisePvaQualificationV2(): Promise<MainWireIntegratedModelPhaseWisePvaQualificationV2> {
  return runMainWireIntegratedModelPhaseWisePvaQualificationWithDependenciesV2(
    DEFAULT_DEPENDENCIES,
  );
}

export async function runMainWireIntegratedModelPhaseWisePvaQualificationWithDependenciesV2(
  dependencies: MainWireIntegratedModelPhaseWisePvaQualificationDependenciesV2,
): Promise<MainWireIntegratedModelPhaseWisePvaQualificationV2> {
  let source: MainWireIntegratedModelPeriodicSteadyResultV3;
  try {
    source = await dependencies.runSource();
  } catch (error) {
    return unavailableV2("source", error, {
      source: "failed",
      transient: "not-attempted",
      periodicLedger: "not-attempted",
      passiveReference: "not-attempted",
      qualification: "not-attempted",
    });
  }
  if (
    source.numericalPeriod1Established !== true ||
    source.classification.status !== "period1-converged" ||
    source.terminalCheckpointExactRoundTripVerified !== true
  ) {
    return unavailableV2("source", new Error("periodic source is not P1"), {
      source: "failed",
      transient: "not-attempted",
      periodicLedger: "not-attempted",
      passiveReference: "not-attempted",
      qualification: "not-attempted",
    });
  }

  const [transientSettled, ledgerSettled, passiveSettled] =
    await Promise.allSettled([
      dependencies.runTransient(source),
      dependencies.runLedger(source),
      dependencies.runPassiveSurface(),
    ]);
  const stages = {
    source: "completed" as const,
    transient:
      transientSettled.status === "fulfilled" &&
      transientSettled.value.status === "completed"
        ? ("completed" as const)
        : ("failed" as const),
    periodicLedger:
      ledgerSettled.status === "fulfilled" &&
      ledgerSettled.value.payload.assessment
        .threeGridMechanicalPortLedgerCharacterizationCompleted
        ? ("completed" as const)
        : ("failed" as const),
    passiveReference:
      passiveSettled.status === "fulfilled" &&
      passiveSettled.value.payload.allPrimaryPointLineagesPassed &&
      passiveSettled.value.payload.sourceAndProtocolBindingsPassed
        ? ("completed" as const)
        : ("failed" as const),
    qualification: "not-attempted" as const,
  };
  if (
    Object.values(stages)
      .slice(0, 4)
      .some((status) => status !== "completed")
  ) {
    const failedStage =
      stages.transient !== "completed"
        ? "transient"
        : stages.periodicLedger !== "completed"
          ? "periodicLedger"
          : "passiveReference";
    const failure =
      failedStage === "transient"
        ? transientSettled.status === "rejected"
          ? errorMessageV2(transientSettled.reason)
          : transientSettled.value.failureEvidence?.message
        : failedStage === "periodicLedger" &&
            ledgerSettled.status === "rejected"
          ? errorMessageV2(ledgerSettled.reason)
          : failedStage === "passiveReference" &&
              passiveSettled.status === "rejected"
            ? errorMessageV2(passiveSettled.reason)
            : `${failedStage} did not complete`;
    return unavailableV2(
      failedStage,
      new Error(failure ?? `${failedStage} failed`),
      stages,
    );
  }

  const transient = (
    transientSettled as PromiseFulfilledResult<
      Extract<
        MainWireIntegratedModelTransientVenousReturnResearchTrajectoryV2,
        { status: "completed" }
      >
    >
  ).value;
  const ledger = (
    ledgerSettled as PromiseFulfilledResult<MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1>
  ).value;
  const passive = (
    passiveSettled as PromiseFulfilledResult<MainWireIntrinsicVentricularPassiveReducedSurfacePilotReportV1>
  ).value;
  const summary = transient.sourceOutcome.summary;
  const input: MainWireIntegratedModelPhaseWisePvaQualificationInputV2 = {
    source: {
      modelConditionIdentityHash: source.modelConditionIdentityHash,
      protocolIdentityHash: source.protocolIdentityHash,
      terminalCheckpointSha256: source.terminalCheckpoint.checkpointSha256,
      terminalAcceptedTimeSec: source.terminalAcceptedState.acceptedTimeSec,
      terminalAcceptedRevision: source.terminalAcceptedState.revision,
      numericalPeriod1Established: true,
    },
    transient: {
      sourceModelConditionIdentityHash: summary.modelConditionIdentityHash,
      sourceProtocolIdentityHash: summary.protocolIdentityHash,
      sourceTerminalCheckpointSha256: summary.terminalCheckpointSha256,
      sourceTerminalAcceptedTimeSec: summary.terminalAcceptedTimeSec,
      sourceTerminalAcceptedRevision: summary.terminalAcceptedRevision,
      rawBeats: transient.rawBeats,
      stateBeats: transient.stateBeats,
    },
    ledger,
    passive: {
      executedInSameAnalysisTransaction: true,
      surfaceSourceBindingsPassed:
        passive.payload.sourceAndProtocolBindingsPassed,
      slices: generateMainWireIntrinsicPassiveCenterSlicesForPvaV1(
        passive.payload,
      ),
    },
  };
  try {
    return qualifyMainWireIntegratedModelPhaseWisePvaV2(input);
  } catch (error) {
    return unavailableV2("qualification", error, {
      ...stages,
      qualification: "failed",
    });
  }
}

export function qualifyMainWireIntegratedModelPhaseWisePvaV2(
  input: MainWireIntegratedModelPhaseWisePvaQualificationInputV2,
): MainWireIntegratedModelPhaseWisePvaQualificationV2 {
  const ledgerSource = input.ledger.payload.sourceOutcome;
  const sharedCheckpoint =
    input.source.modelConditionIdentityHash ===
      input.transient.sourceModelConditionIdentityHash &&
    input.source.protocolIdentityHash ===
      input.transient.sourceProtocolIdentityHash &&
    input.source.terminalCheckpointSha256 ===
      input.transient.sourceTerminalCheckpointSha256 &&
    input.source.terminalAcceptedTimeSec ===
      input.transient.sourceTerminalAcceptedTimeSec &&
    input.source.terminalAcceptedRevision ===
      input.transient.sourceTerminalAcceptedRevision &&
    ledgerSource.status === "source-p1-established" &&
    ledgerSource.summary.modelConditionIdentityHash ===
      input.source.modelConditionIdentityHash &&
    ledgerSource.summary.protocolIdentityHash ===
      input.source.protocolIdentityHash &&
    ledgerSource.summary.terminalCheckpointSha256 ===
      input.source.terminalCheckpointSha256 &&
    ledgerSource.summary.terminalAcceptedTimeSec ===
      input.source.terminalAcceptedTimeSec &&
    ledgerSource.summary.terminalAcceptedRevision ===
      input.source.terminalAcceptedRevision;
  const passiveBound =
    input.passive.executedInSameAnalysisTransaction &&
    input.passive.surfaceSourceBindingsPassed;
  if (!sharedCheckpoint || !passiveBound)
    throw new Error("PVA qualification input bindings are incomplete");

  const slices = new Map(
    input.passive.slices.flatMap((slice) =>
      slice.status === "available" ? [[slice.ventricleId, slice] as const] : [],
    ),
  );
  if (slices.size !== 2)
    throw new Error("both passive center slices are required");
  const workByVentricle = periodicExternalWorkV2(input.ledger);
  const outputs = Object.freeze(
    VENTRICLES.map((ventricleId) =>
      qualifyVentricleV2(
        input.transient.rawBeats,
        input.transient.stateBeats,
        ventricleId,
        slices.get(ventricleId)!,
        workByVentricle.get(ventricleId)!,
      ),
    ),
  );
  assertFiniteLeavesV2(outputs, "PVA qualification outputs");
  return Object.freeze({
    qualificationId:
      MAIN_WIRE_INTEGRATED_MODEL_PHASE_WISE_PVA_QUALIFICATION_V2_ID,
    status: "completed" as const,
    targetSurface: "completed-protocol-analysis" as const,
    methodId: MAIN_WIRE_INTEGRATED_MODEL_METHOD_SPECIFIC_PVA_METHOD_V1_ID,
    stages: Object.freeze({
      source: "completed" as const,
      transient: "completed" as const,
      periodicLedger: "completed" as const,
      passiveReference: "completed" as const,
      qualification: "completed" as const,
    }),
    sourceIdentity: Object.freeze({
      singlePeriodicSourceExecution: true as const,
      transientAndLedgerShareCheckpoint: true,
      passiveReferenceExecutedInSameAnalysisTransaction: true,
      passiveReferenceCanonicalOwnerBindingsPassed: true,
      allInputsBound: true,
    }),
    outputs,
    failure: null,
    interpretation: Object.freeze({
      methodSpecificPvaEstimateAvailable: true,
      genericPvaEstablished: false as const,
      clinicalPvaEstablished: false as const,
      oxygenConsumptionEstablished: false as const,
      liveSingleBeatOutput: false as const,
      automaticLmFallbackUsed: false as const,
      productValuePublished: false as const,
    }),
  });
}

function qualifyVentricleV2(
  rawBeats: readonly MainWireIntegratedModelTransientPvRawBeatV1[],
  stateBeats: readonly MainWireIntegratedModelTransientPvaStateBeatV2[],
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
  slice: MainWireIntrinsicPassiveCenterSliceV1,
  externalWorkByDt: readonly Readonly<{
    nominalDtSec: number;
    externalWorkJ: number;
  }>[],
): MainWireIntegratedModelPhaseWisePvaQualificationOutputV2 {
  const full = phaseCandidateV2(rawBeats, ventricleId, 64, null);
  const releaseAtSelectedPhase = phaseRelationAtIndexV2(
    rawBeats,
    ventricleId,
    64,
    "release",
    full.phaseIndex,
  );
  const withoutBaseline = phaseCandidateV2(rawBeats, ventricleId, 64, 1);
  const refined = phaseCandidateV2(rawBeats, ventricleId, 128, null);
  const primaryPva = pvaForPhaseCandidateV2(
    full,
    ventricleId,
    slice,
    externalWorkByDt,
  );
  const withoutBaselinePva = pvaForPhaseCandidateV2(
    withoutBaseline,
    ventricleId,
    slice,
    externalWorkByDt,
  );
  const refinedPva = pvaForPhaseCandidateV2(
    refined,
    ventricleId,
    slice,
    externalWorkByDt,
  );
  if (
    primaryPva.reportedPressureVolumeAreaJ === null ||
    primaryPva.reportedPotentialEnergyJ === null ||
    withoutBaselinePva.reportedPressureVolumeAreaJ === null ||
    refinedPva.reportedPressureVolumeAreaJ === null
  ) {
    throw new Error(`${ventricleId} PVA estimate is unavailable`);
  }
  const pvaEstimateJ = primaryPva.reportedPressureVolumeAreaJ;
  const baselineDifference = Math.abs(
    withoutBaselinePva.reportedPressureVolumeAreaJ - pvaEstimateJ,
  );
  const resolutionDifference = Math.abs(
    refinedPva.reportedPressureVolumeAreaJ - pvaEstimateJ,
  );
  const releaseSlopeDifferenceFraction =
    (releaseAtSelectedPhase.slopeMmHgPerMl - full.relation.slopeMmHgPerMl) /
    full.relation.slopeMmHgPerMl;
  const stateDispersion = selectedPhaseStateDispersionV2(
    rawBeats,
    stateBeats,
    ventricleId,
    full.phaseIndex / 64,
  );
  const oneMs = externalWorkByDt.find(
    ({ nominalDtSec }) => nominalDtSec === 0.001,
  )!;
  const fine = externalWorkByDt.find(
    ({ nominalDtSec }) => nominalDtSec === 0.00025,
  )!;
  const limitations: string[] = [];
  if (primaryPva.status !== "domain-supported-baseline-pva")
    limitations.push("systolic-relation-extrapolation-required");
  if (
    baselineDifference / Math.max(Math.abs(pvaEstimateJ), 1e-12) >
    MAIN_WIRE_INTEGRATED_MODEL_PHASE_WISE_PVA_QUALIFICATION_V2_THRESHOLDS.baselineExclusionRelativeDifferenceMaximum
  )
    limitations.push("baseline-exclusion-sensitive");
  if (
    resolutionDifference / Math.max(Math.abs(pvaEstimateJ), 1e-12) >
    MAIN_WIRE_INTEGRATED_MODEL_PHASE_WISE_PVA_QUALIFICATION_V2_THRESHOLDS.phaseResolutionRelativeDifferenceMaximum
  )
    limitations.push("phase-resolution-sensitive");
  if (
    stateDispersion.maximumNormalizedSpan >
    MAIN_WIRE_INTEGRATED_MODEL_PHASE_WISE_PVA_QUALIFICATION_V2_THRESHOLDS.selectedPhaseStateDispersionIndexMaximum
  )
    limitations.push("selected-phase-state-dispersion-retained");
  if (
    Math.abs(releaseSlopeDifferenceFraction) >=
    MAIN_WIRE_INTEGRATED_MODEL_PHASE_WISE_PVA_QUALIFICATION_V2_THRESHOLDS.releaseSlopeDifferenceFractionMaximum
  )
    limitations.push("protocol-direction-sensitivity-retained");
  limitations.push("fixed-contralateral-intrinsic-passive-reference");
  const externalWorkJ = primaryPva.periodicExternalWorkJ;
  return Object.freeze({
    outputId:
      `protocol-analysis.pva-estimate.phase-wise-venous-occlusion-v1.${ventricleId}` as const,
    methodId: MAIN_WIRE_INTEGRATED_MODEL_METHOD_SPECIFIC_PVA_METHOD_V1_ID,
    ventricleId,
    status:
      limitations.length === 1 &&
      primaryPva.status === "domain-supported-baseline-pva"
        ? ("qualified-estimate" as const)
        : ("limited-estimate" as const),
    unit: "J" as const,
    mainOutputValueJ: pvaEstimateJ,
    energy: Object.freeze({
      externalWorkJ,
      potentialEnergyEquivalentJ: primaryPva.reportedPotentialEnergyJ,
      pvaEstimateJ,
      mechanicalConversionRatio: externalWorkJ / pvaEstimateJ,
    }),
    systolicRelation: Object.freeze({
      phaseSampleCount: 64 as const,
      phaseIndex: full.phaseIndex,
      phase01: full.phaseIndex / 64,
      elastanceMmHgPerMl: full.relation.slopeMmHgPerMl,
      volumeAxisInterceptMl: full.relation.volumeAxisInterceptMl,
      measuredVolumeRangeMl: full.relation.measuredVolumeRangeMl,
      rSquared: full.relation.rSquared,
      rootMeanSquaredResidualMmHg: full.rootMeanSquaredResidualMmHg,
      releaseSlopeDifferenceFraction,
    }),
    passiveReference: Object.freeze({
      referenceId:
        "same-transaction-fixed-contralateral-intrinsic-passive-center-slice-v2" as const,
      canonicalOwnerBindingsPassed: true as const,
      fixedContralateralVentricleId: slice.fixedContralateralVentricleId,
      fixedContralateralVolumeMl: slice.fixedContralateralVolumeMl,
      supportedVolumeRangeMl: Object.freeze([
        slice.modelMinimumVolumeMl,
        slice.maximumSampledVolumeMl,
      ] as const),
    }),
    sensitivity: Object.freeze({
      baselineExclusion: Object.freeze({
        available: true as const,
        estimateJ: withoutBaselinePva.reportedPressureVolumeAreaJ,
        absoluteDifferenceJ: baselineDifference,
        relativeDifference:
          baselineDifference / Math.max(Math.abs(pvaEstimateJ), 1e-12),
        selectedPhaseIndex: withoutBaseline.phaseIndex,
      }),
      phaseResolution: Object.freeze({
        available: true as const,
        baselineSampleCount: 64 as const,
        refinedSampleCount: 128 as const,
        refinedEstimateJ: refinedPva.reportedPressureVolumeAreaJ,
        absoluteDifferenceJ: resolutionDifference,
        relativeDifference:
          resolutionDifference / Math.max(Math.abs(pvaEstimateJ), 1e-12),
        refinedPhaseIndex: refined.phaseIndex,
        circularPhaseDifference: circularPhaseDistanceV2(
          full.phaseIndex / 64,
          refined.phaseIndex / 128,
        ),
      }),
      selectedPhaseStateDispersion: stateDispersion,
      externalWorkCoarseFineDifferenceJ: Math.abs(
        oneMs.externalWorkJ - fine.externalWorkJ,
      ),
      systolicAreaOutsideMeasuredRangeFraction:
        primaryPva.systolicLineAreaOutsideMeasuredRangeFraction,
    }),
    limitations: Object.freeze(limitations),
  });
}

function phaseRelationAtIndexV2(
  beats: readonly MainWireIntegratedModelTransientPvRawBeatV1[],
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
  sampleCount: 64 | 128,
  direction: "occlusion" | "release",
  phaseIndex: number,
): MainWireIntegratedModelPvaLinearRelationV1 {
  const family = beats.filter(({ beatOrdinal }) =>
    direction === "occlusion" ? beatOrdinal <= 11 : beatOrdinal >= 11,
  );
  const points = family.map((beat) => {
    const point =
      sampleMainWireIntegratedModelTransientPvCompactLoopAtResolutionV2(
        beat,
        ventricleId,
        sampleCount,
      )[phaseIndex];
    if (point === undefined)
      throw new Error("selected phase sample is missing");
    return Object.freeze({
      volumeMl: point.volumeMl,
      pressureMmHg: point.transmuralPressureMmHg,
    });
  });
  return fitMainWireIntegratedModelPhaseWiseIsochronalRelationV2(points);
}

type PhaseCandidateV2 = Readonly<{
  phaseIndex: number;
  relation: MainWireIntegratedModelPvaLinearRelationV1;
  baselineEndpoint: Readonly<{
    volumeMl: number;
    observedPressureMmHg: number;
    fittedPressureMmHg: number;
  }>;
  rootMeanSquaredResidualMmHg: number;
}>;

function phaseCandidateV2(
  beats: readonly MainWireIntegratedModelTransientPvRawBeatV1[],
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
  sampleCount: 64 | 128,
  omittedBeatOrDirection: number | "release" | null,
): PhaseCandidateV2 {
  if (beats.length !== 21)
    throw new Error("phase qualification requires 21 beats");
  const direction =
    omittedBeatOrDirection === "release" ? "release" : "occlusion";
  const family = beats.filter((beat) =>
    direction === "release"
      ? beat.beatOrdinal >= 11
      : beat.beatOrdinal <= 11 && beat.beatOrdinal !== omittedBeatOrDirection,
  );
  const loops = new Map(
    beats.map((beat) => [
      beat.beatOrdinal,
      sampleMainWireIntegratedModelTransientPvCompactLoopAtResolutionV2(
        beat,
        ventricleId,
        sampleCount,
      ),
    ]),
  );
  let selected:
    | Readonly<{
        phaseIndex: number;
        relation: MainWireIntegratedModelPvaLinearRelationV1;
        rootMeanSquaredResidualMmHg: number;
      }>
    | undefined;
  for (let phaseIndex = 0; phaseIndex < sampleCount; phaseIndex += 1) {
    const points = family.map((beat) => {
      const point = loops.get(beat.beatOrdinal)?.[phaseIndex];
      if (point === undefined) throw new Error("phase sample is missing");
      return {
        volumeMl: point.volumeMl,
        pressureMmHg: point.transmuralPressureMmHg,
      };
    });
    const relation =
      fitMainWireIntegratedModelPhaseWiseIsochronalRelationV2(points);
    if (!(relation.slopeMmHgPerMl > 0)) continue;
    const rms = Math.sqrt(
      relation.residualSumOfSquaresMmHgSquared / points.length,
    );
    if (
      selected === undefined ||
      relation.slopeMmHgPerMl > selected.relation.slopeMmHgPerMl
    ) {
      selected = { phaseIndex, relation, rootMeanSquaredResidualMmHg: rms };
    }
  }
  if (selected === undefined)
    throw new Error("phase qualification has no positive fit");
  const baseline = loops.get(1)?.[selected.phaseIndex];
  if (baseline === undefined)
    throw new Error("baseline phase sample is missing");
  return Object.freeze({
    ...selected,
    baselineEndpoint: Object.freeze({
      volumeMl: baseline.volumeMl,
      observedPressureMmHg: baseline.transmuralPressureMmHg,
      fittedPressureMmHg:
        selected.relation.slopeMmHgPerMl * baseline.volumeMl +
        selected.relation.interceptMmHg,
    }),
  });
}

function pvaForPhaseCandidateV2(
  candidate: PhaseCandidateV2,
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
  slice: MainWireIntrinsicPassiveCenterSliceV1,
  externalWorkByDt: readonly Readonly<{
    nominalDtSec: number;
    externalWorkJ: number;
  }>[],
): MainWireIntegratedModelBaselineResearchPvaV1 {
  return evaluateMainWireIntegratedModelBaselineResearchPvaV2(
    {
      ventricleId,
      selectedRelation: candidate.relation,
      baselineEndpoint: {
        beatOrdinal: 1,
        volumeMl: candidate.baselineEndpoint.volumeMl,
        observedPressureMmHg: candidate.baselineEndpoint.observedPressureMmHg,
        fittedPressureMmHg: candidate.baselineEndpoint.fittedPressureMmHg,
        fittedMinusObservedPressureMmHg:
          candidate.baselineEndpoint.fittedPressureMmHg -
          candidate.baselineEndpoint.observedPressureMmHg,
      },
    },
    slice,
    externalWorkByDt,
  );
}

function selectedPhaseStateDispersionV2(
  rawBeats: readonly MainWireIntegratedModelTransientPvRawBeatV1[],
  stateBeats: readonly MainWireIntegratedModelTransientPvaStateBeatV2[],
  ventricleId: MainWireIntegratedModelPvaVentricleV1,
  phase01: number,
): MainWireIntegratedModelSelectedPhaseStateDispersionV2 {
  const stateByOrdinal = new Map(
    stateBeats.map((beat) => [beat.beatOrdinal, beat]),
  );
  const selected = rawBeats
    .filter(({ beatOrdinal }) => beatOrdinal <= 11)
    .map((beat) => {
      const stateBeat = stateByOrdinal.get(beat.beatOrdinal);
      if (stateBeat === undefined) throw new Error("state beat is missing");
      const state = interpolateStateV2(stateBeat, phase01);
      const point =
        sampleMainWireIntegratedModelTransientPvCompactLoopAtResolutionV2(
          beat,
          ventricleId === "LV" ? "RV" : "LV",
          64,
        )[Math.round(phase01 * 64) % 64]!;
      return { state, contralateralVolumeMl: point.volumeMl };
    });
  const spread = (values: readonly number[], floor: number) =>
    numericSpreadV2(values, floor);
  const calcium = wallRecordV2((wallId) =>
    spread(
      selected.map(({ state }) => state.freeCalciumUMByWall[wallId]),
      0.1,
    ),
  );
  const strain = wallRecordV2((wallId) =>
    spread(
      selected.map(({ state }) => state.fiberLogStrainByWall[wallId]),
      0.1,
    ),
  );
  const strainRate = wallRecordV2((wallId) =>
    spread(
      selected.map(({ state }) => state.fiberLogStrainRatePerSecByWall[wallId]),
      1,
    ),
  );
  const landState = wallRecordV2(
    (wallId) =>
      Object.freeze(
        Array.from({ length: 6 }, (_, index) =>
          spread(
            selected.map(({ state }) => state.landStateByWall[wallId][index]!),
            0.05,
          ),
        ),
      ) as MainWireIntegratedModelSelectedPhaseStateDispersionV2["landStateByWall"][WallId],
  );
  const contralateral = spread(
    selected.map((value) => value.contralateralVolumeMl),
    1,
  );
  const pericardial = spread(
    selected.map(({ state }) => state.commonPericardialPressureMmHg),
    1,
  );
  const septal = spread(
    selected.map(
      ({ state }) => state.internalCoordinates.septalMidwallCapVolumeMl,
    ),
    1,
  );
  const radius = spread(
    selected.map(({ state }) => state.internalCoordinates.junctionRadiusM),
    1e-3,
  );
  const allSpreads = [
    contralateral,
    pericardial,
    septal,
    radius,
    ...Object.values(calcium),
    ...Object.values(strain),
    ...Object.values(strainRate),
    ...Object.values(landState).flat(),
  ];
  return Object.freeze({
    available: true as const,
    beatCount: selected.length,
    selectedPhase01: phase01,
    contralateralVolumeMl: contralateral,
    commonPericardialPressureMmHg: pericardial,
    maximumVentricularPericardialPressureMismatchMmHg: Math.max(
      ...selected.map(
        ({ state }) => state.ventricularPericardialPressureMismatchMmHg,
      ),
    ),
    septalMidwallCapVolumeMl: septal,
    junctionRadiusM: radius,
    freeCalciumUMByWall: calcium,
    fiberLogStrainByWall: strain,
    fiberLogStrainRatePerSecByWall: strainRate,
    landStateByWall: landState,
    maximumNormalizedSpan: Math.max(
      ...allSpreads.map((value) => value.normalizedSpan),
    ),
  });
}

type InterpolatedStateV2 = MainWireIntegratedModelTransientPvaStateSampleV2 &
  Readonly<{
    fiberLogStrainRatePerSecByWall: Readonly<Record<WallId, number>>;
  }>;

function interpolateStateV2(
  beat: MainWireIntegratedModelTransientPvaStateBeatV2,
  phase01: number,
): InterpolatedStateV2 {
  const timeSec =
    beat.startTimeSec + phase01 * (beat.endTimeSec - beat.startTimeSec);
  let rightIndex = beat.samples.findIndex(
    (sample) => sample.timeSec >= timeSec,
  );
  if (rightIndex < 0) rightIndex = beat.samples.length - 1;
  if (rightIndex === 0) rightIndex = 1;
  const left = beat.samples[rightIndex - 1]!;
  const right = beat.samples[rightIndex]!;
  const fraction =
    timeSec === right.timeSec
      ? 1
      : (timeSec - left.timeSec) / (right.timeSec - left.timeSec);
  const lerp = (a: number, b: number) =>
    fraction === 0 ? a : fraction === 1 ? b : a + fraction * (b - a);
  const wall = (
    project: (
      sample: MainWireIntegratedModelTransientPvaStateSampleV2,
      wallId: WallId,
    ) => number,
  ) =>
    wallRecordV2((wallId) =>
      lerp(project(left, wallId), project(right, wallId)),
    );
  const land = wallRecordV2(
    (wallId) =>
      Object.freeze(
        Array.from({ length: 6 }, (_, index) =>
          lerp(
            left.landStateByWall[wallId][index]!,
            right.landStateByWall[wallId][index]!,
          ),
        ),
      ) as readonly [number, number, number, number, number, number],
  );
  const dt = right.timeSec - left.timeSec;
  if (!(dt > 0))
    throw new Error("state interpolation interval must be positive");
  return Object.freeze({
    timeSec,
    commonPericardialPressureMmHg: lerp(
      left.commonPericardialPressureMmHg,
      right.commonPericardialPressureMmHg,
    ),
    ventricularPericardialPressureMismatchMmHg: lerp(
      left.ventricularPericardialPressureMismatchMmHg,
      right.ventricularPericardialPressureMismatchMmHg,
    ),
    internalCoordinates: Object.freeze({
      septalMidwallCapVolumeMl: lerp(
        left.internalCoordinates.septalMidwallCapVolumeMl,
        right.internalCoordinates.septalMidwallCapVolumeMl,
      ),
      junctionRadiusM: lerp(
        left.internalCoordinates.junctionRadiusM,
        right.internalCoordinates.junctionRadiusM,
      ),
    }),
    freeCalciumUMByWall: wall(
      (sample, wallId) => sample.freeCalciumUMByWall[wallId],
    ),
    fiberLogStrainByWall: wall(
      (sample, wallId) => sample.fiberLogStrainByWall[wallId],
    ),
    fiberLogStrainRatePerSecByWall: wallRecordV2(
      (wallId) =>
        (right.fiberLogStrainByWall[wallId] -
          left.fiberLogStrainByWall[wallId]) /
        dt,
    ),
    landStateByWall: land,
  });
}

function periodicExternalWorkV2(
  report: MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1,
): ReadonlyMap<
  MainWireIntegratedModelPvaVentricleV1,
  readonly Readonly<{ nominalDtSec: number; externalWorkJ: number }>[]
> {
  const fulfilled = report.payload.armOutcomes.filter(
    (outcome) => outcome.status === "fulfilled",
  );
  if (fulfilled.length !== 3)
    throw new Error("three periodic ledger arms are required");
  return new Map(
    VENTRICLES.map((ventricleId) => [
      ventricleId,
      Object.freeze(
        fulfilled
          .map((outcome) =>
            Object.freeze({
              nominalDtSec: outcome.nominalDtSec,
              externalWorkJ:
                -outcome.ledger.cavityWork.trapezoidalWorkOnWallMilliJ[
                  ventricleId
                ] / 1000,
            }),
          )
          .sort((a, b) => b.nominalDtSec - a.nominalDtSec),
      ),
    ]),
  );
}

function numericSpreadV2(
  values: readonly number[],
  floor: number,
): NumericSpreadV2 {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value)))
    throw new Error("numeric spread requires finite values");
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const span = maximum - minimum;
  return Object.freeze({
    minimum,
    maximum,
    mean,
    span,
    normalizedSpan: span / Math.max(Math.abs(mean), floor),
  });
}

function wallRecordV2<T>(
  build: (wallId: WallId) => T,
): Readonly<Record<WallId, T>> {
  return Object.freeze(
    Object.fromEntries(WALLS.map((wallId) => [wallId, build(wallId)])),
  ) as Readonly<Record<WallId, T>>;
}

function circularPhaseDistanceV2(left: number, right: number): number {
  const raw = Math.abs(left - right);
  return Math.min(raw, 1 - raw);
}

function unavailableV2(
  stage: string,
  error: unknown,
  stages: MainWireIntegratedModelPhaseWisePvaQualificationV2["stages"],
): MainWireIntegratedModelPhaseWisePvaQualificationV2 {
  return Object.freeze({
    qualificationId:
      MAIN_WIRE_INTEGRATED_MODEL_PHASE_WISE_PVA_QUALIFICATION_V2_ID,
    status: "unavailable" as const,
    targetSurface: "completed-protocol-analysis" as const,
    methodId: MAIN_WIRE_INTEGRATED_MODEL_METHOD_SPECIFIC_PVA_METHOD_V1_ID,
    stages: Object.freeze(stages),
    sourceIdentity: Object.freeze({
      singlePeriodicSourceExecution: true as const,
      transientAndLedgerShareCheckpoint: false,
      passiveReferenceExecutedInSameAnalysisTransaction: false,
      passiveReferenceCanonicalOwnerBindingsPassed: false,
      allInputsBound: false,
    }),
    outputs: Object.freeze([]),
    failure: Object.freeze({ stage, message: errorMessageV2(error) }),
    interpretation: Object.freeze({
      methodSpecificPvaEstimateAvailable: false,
      genericPvaEstablished: false as const,
      clinicalPvaEstablished: false as const,
      oxygenConsumptionEstablished: false as const,
      liveSingleBeatOutput: false as const,
      automaticLmFallbackUsed: false as const,
      productValuePublished: false as const,
    }),
  });
}

function errorMessageV2(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function assertFiniteLeavesV2(value: unknown, label: string): void {
  const visit = (current: unknown): void => {
    if (typeof current === "number") {
      if (!Number.isFinite(current))
        throw new Error(`${label} contains nonfinite data`);
      return;
    }
    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }
    if (current !== null && typeof current === "object")
      Object.values(current as Record<string, unknown>).forEach(visit);
  };
  visit(value);
}
