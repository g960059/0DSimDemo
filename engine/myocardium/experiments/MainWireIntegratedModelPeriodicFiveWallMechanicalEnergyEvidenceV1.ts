import {
  MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_CHAMBER_IDS_V1,
  MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1,
  measureMainWireFiveWallMechanicalEnergyLedgerV1,
  type MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1,
  type MainWireFiveWallMechanicalEnergyLedgerV1,
  type MainWireFiveWallMechanicalEnergyWallRecordV1,
} from "@/engine/myocardium/diagnostics/MainWireFiveWallMechanicalEnergyLedgerV1";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import {
  assessMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1,
  type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1,
  type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_V1_ID,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_POLICY_V1,
  runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyV1,
  type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAlgebraicResidualV1,
  type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyV1,
  type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricV1,
  type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureBridgeV1,
  type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQualifiedV1,
  type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyResultV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_REFINEMENT_ACCESS_V1_ID,
  runMainWireIntegratedModelPeriodicSteadyForWorkRefinementV1,
  type MainWireIntegratedModelPeriodicSteadyResultV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";
import { MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_EVIDENCE_V1_ID =
  "main-wire-integrated-model-periodic-five-wall-mechanical-energy-evidence-v1" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_OFFICIAL_EVIDENCE_POLICY_V1 =
  Object.freeze({
    evidenceId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_EVIDENCE_V1_ID,
    singleArmQualificationId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_V1_ID,
    officialRunnerArguments: "none" as const,
    armId: "normal-default" as const,
    executionPurpose: "canonical-evidence" as const,
    numericalAccessId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_WORK_REFINEMENT_ACCESS_V1_ID,
    requestedMaximumCycleCount: 250 as const,
    coarseDtSec: 0.001 as const,
    fineDtSec: 0.0005 as const,
    coldStartOwnership: "internal-independent-per-arm" as const,
    checkpointDigest:
      "sha256-canonical-json-excluding-checkpointSha256" as const,
    rawMechanicalTraceDigest:
      "sha256-canonical-json-measurement-input-evidence" as const,
    bridgeTerminalSampleDigest:
      "sha256-canonical-json-preceding-accepted-step-sample" as const,
    materialVolumeBindingDigest:
      "sha256-canonical-json-material-volume-binding-payload" as const,
    compactProjectionDigest:
      "sha256-canonical-json-single-arm-compact-projection" as const,
    pairDigest: "sha256-canonical-json-sealed-pair-payload" as const,
    rawRuntimeInputsReturned: false as const,
    callerSuppliedProjectionAcceptedByOfficialRunner: false as const,
    callerSuppliedColdStartClaimAcceptedByOfficialRunner: false as const,
    activeDeliveryAbsorptionSplitEstablished: false as const,
    instantaneousPowerEstablished: false as const,
    publicLiveOutputCatalogAdmissionEstablished: false as const,
    publicGraphCatalogAdmissionEstablished: false as const,
    PEEstablished: false as const,
    PVAEstablished: false as const,
    MVO2Established: false as const,
    ATPUseEstablished: false as const,
    mechanicalEfficiencyEstablished: false as const,
    physiologicalValidationEstablished: false as const,
    clinicalValidationClaimed: false as const,
  });

type CheckpointDigestPreimageV1 = Readonly<{
  checkpointSha256: string;
}>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPublishedHashesV1 =
  Readonly<{
    sourceCheckpointSha256: string;
    terminalCheckpointSha256: string;
    rawMechanicalTraceSha256: string;
    bridgeTerminalAcceptedStepSampleSha256: string;
    materialVolumeBindingSha256: string;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyHashPreimagesV1 =
  Readonly<{
    sourceCheckpoint: CheckpointDigestPreimageV1;
    terminalCheckpoint: CheckpointDigestPreimageV1;
    measurementInputEvidence: unknown;
    bridgeTerminalAcceptedStepSample: unknown;
    materialVolumeBindingPayload: unknown;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyHashBindingV1 =
  Readonly<{
    publishedSha256: string;
    embeddedSha256: string | null;
    recomputedSha256: string;
    matches: boolean;
  }>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyHashBindingsV1 =
  Readonly<{
    sourceCheckpoint: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyHashBindingV1;
    terminalCheckpoint: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyHashBindingV1;
    rawMechanicalTrace: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyHashBindingV1;
    bridgeTerminalAcceptedStepSample: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyHashBindingV1;
    materialVolumeBinding: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyHashBindingV1;
    allMatch: boolean;
  }>;

/** Pure digest verifier used by the canonical projector and synthetic tests. */
export async function verifyMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyHashBindingsV1(
  published: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPublishedHashesV1,
  preimages: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyHashPreimagesV1,
): Promise<MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyHashBindingsV1> {
  const { checkpointSha256: sourceEmbeddedSha256, ...sourcePayload } =
    preimages.sourceCheckpoint;
  const { checkpointSha256: terminalEmbeddedSha256, ...terminalPayload } =
    preimages.terminalCheckpoint;
  const [
    sourceCheckpointSha256,
    terminalCheckpointSha256,
    rawMechanicalTraceSha256,
    bridgeTerminalAcceptedStepSampleSha256,
    materialVolumeBindingSha256,
  ] = await Promise.all([
    sha256CanonicalJsonHex(sourcePayload),
    sha256CanonicalJsonHex(terminalPayload),
    sha256CanonicalJsonHex(preimages.measurementInputEvidence),
    sha256CanonicalJsonHex(preimages.bridgeTerminalAcceptedStepSample),
    sha256CanonicalJsonHex(preimages.materialVolumeBindingPayload),
  ]);
  const sourceCheckpoint = hashBindingV1(
    published.sourceCheckpointSha256,
    sourceEmbeddedSha256,
    sourceCheckpointSha256,
  );
  const terminalCheckpoint = hashBindingV1(
    published.terminalCheckpointSha256,
    terminalEmbeddedSha256,
    terminalCheckpointSha256,
  );
  const rawMechanicalTrace = hashBindingV1(
    published.rawMechanicalTraceSha256,
    null,
    rawMechanicalTraceSha256,
  );
  const bridgeTerminalAcceptedStepSample = hashBindingV1(
    published.bridgeTerminalAcceptedStepSampleSha256,
    null,
    bridgeTerminalAcceptedStepSampleSha256,
  );
  const materialVolumeBinding = hashBindingV1(
    published.materialVolumeBindingSha256,
    null,
    materialVolumeBindingSha256,
  );
  return Object.freeze({
    sourceCheckpoint,
    terminalCheckpoint,
    rawMechanicalTrace,
    bridgeTerminalAcceptedStepSample,
    materialVolumeBinding,
    allMatch:
      sourceCheckpoint.matches &&
      terminalCheckpoint.matches &&
      rawMechanicalTrace.matches &&
      bridgeTerminalAcceptedStepSample.matches &&
      materialVolumeBinding.matches,
  });
}

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyRemeasurementInputV1 =
  Readonly<{
    precedingAcceptedStepSample: MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1;
    measurementAcceptedStepSamples: readonly MainWireFiveWallMechanicalEnergyLedgerAcceptedStepSampleV1[];
    wallMaterialVolumeMlByWall: MainWireFiveWallMechanicalEnergyWallRecordV1<number>;
  }>;

/** Pure replay of the model-owned ledger kernel; it grants no admission. */
export function remeasureMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1(
  input: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyRemeasurementInputV1,
): MainWireFiveWallMechanicalEnergyLedgerV1 {
  return measureMainWireFiveWallMechanicalEnergyLedgerV1({
    precedingAcceptedStepSample: input.precedingAcceptedStepSample,
    acceptedStepSamples: input.measurementAcceptedStepSamples,
    wallMaterialVolumeMlByWall: input.wallMaterialVolumeMlByWall,
  });
}

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureRemeasurementInputV1 =
  MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyRemeasurementInputV1 &
    Readonly<{
      ledger: MainWireFiveWallMechanicalEnergyLedgerV1;
      trapezoidalExternalWorkMmHgMl: Readonly<{
        LV: number | null;
        RV: number | null;
      }>;
    }>;

/** Independently recomputes both endpoint corrections and PV conversions. */
export function remeasureMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureBridgesV1(
  input: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureRemeasurementInputV1,
): readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureBridgeV1[] {
  const policy =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_POLICY_V1;
  const bridges: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureBridgeV1[] =
    [];
  for (const chamber of ["LV", "RV"] as const) {
    const externalWorkMmHgMl = input.trapezoidalExternalWorkMmHgMl[chamber];
    if (externalWorkMmHgMl === null) continue;
    let previous = input.precedingAcceptedStepSample;
    let endpointCorrectionMilliJ = 0;
    for (const sample of input.measurementAcceptedStepSamples) {
      endpointCorrectionMilliJ +=
        0.5 *
        (sample.chamberTransmuralPressureMmHg[chamber] -
          previous.chamberTransmuralPressureMmHg[chamber]) *
        (sample.nodeVolumeMl[chamber] - previous.nodeVolumeMl[chamber]) *
        policy.pressureVolumeConversionMilliJPerMmHgMl;
      previous = sample;
    }
    const backwardEulerCavityWorkOnWallMilliJ =
      input.ledger.cavityWorkOnWallMilliJ[chamber];
    const trapezoidalExternalWorkMilliJ =
      externalWorkMmHgMl * policy.pressureVolumeConversionMilliJPerMmHgMl;
    const residualMilliJ =
      backwardEulerCavityWorkOnWallMilliJ +
      trapezoidalExternalWorkMilliJ -
      endpointCorrectionMilliJ;
    bridges.push(
      Object.freeze({
        chamber,
        backwardEulerCavityWorkOnWallMilliJ,
        trapezoidalExternalWorkMilliJ,
        endpointCorrectionMilliJ,
        residualMilliJ,
        passed:
          Number.isFinite(residualMilliJ) &&
          Math.abs(residualMilliJ) <=
            policy.pressureVolumeBridgeAbsoluteToleranceMilliJ,
      }),
    );
  }
  return Object.freeze(bridges);
}

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceFailureReasonV1 =
  | "single-arm-not-qualified"
  | "single-arm-gates-failed"
  | "canonical-source-scope-mismatch"
  | "source-checkpoint-sha256-mismatch"
  | "terminal-checkpoint-sha256-mismatch"
  | "raw-mechanical-trace-sha256-mismatch"
  | "bridge-terminal-sample-sha256-mismatch"
  | "material-volume-binding-sha256-mismatch"
  | "accepted-lineage-binding-mismatch"
  | "ledger-recomputation-mismatch"
  | "ledger-projection-binding-mismatch"
  | "quadrature-provenance-mismatch";

type ArmEvidenceCommonV1 = Readonly<{
  grid: "coarse" | "fine";
  expectedNominalDtSec: 0.001 | 0.0005;
  sourceQualificationId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_V1_ID;
  sourceStatus: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyResultV1["status"];
  sourceFailureReasons: readonly string[];
  sourceScopePassed: boolean;
  sourceGatesPassed: boolean;
  lineageBindingsPassed: boolean;
  ledgerRecomputationPassed: boolean;
  ledgerProjectionBindingsPassed: boolean;
  quadratureProvenancePassed: boolean;
  hashBindings: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyHashBindingsV1 | null;
  failureReasons: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceFailureReasonV1[];
}>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceV1 =
  | (ArmEvidenceCommonV1 &
      Readonly<{
        status: "projection-sealed";
        projection: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1;
        compactProjectionSha256: string;
      }>)
  | (ArmEvidenceCommonV1 &
      Readonly<{
        status: "not-sealed";
        projection: null;
        compactProjectionSha256: null;
      }>);

type EvidenceResultCommonV1 = Readonly<{
  evidenceId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_EVIDENCE_V1_ID;
  coarse: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceV1;
  fine: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceV1;
  officialSealedMechanicalEnergyAnalysisEligible: boolean;
  activeDeliveryAbsorptionSplitEstablished: false;
  instantaneousPowerEstablished: false;
  publicLiveOutputCatalogAdmissionEstablished: false;
  publicGraphCatalogAdmissionEstablished: false;
  PEEstablished: false;
  PVAEstablished: false;
  MVO2Established: false;
  ATPUseEstablished: false;
  mechanicalEfficiencyEstablished: false;
  physiologicalValidationEstablished: false;
  clinicalValidationClaimed: false;
  policy: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_OFFICIAL_EVIDENCE_POLICY_V1;
}>;

export type MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1 =
  | (EvidenceResultCommonV1 &
      Readonly<{
        status: "sealed-admission-assessed";
        admission: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1;
        pairSealedPayloadSha256: string;
      }>)
  | (EvidenceResultCommonV1 &
      Readonly<{
        status: "evidence-verification-failed";
        admission: null;
        pairSealedPayloadSha256: null;
        officialSealedMechanicalEnergyAnalysisEligible: false;
      }>);

/**
 * The only official V1 entrypoint. Both arms are internally created from
 * independent cold starts; no projection, checkpoint, or cold-start claim is
 * accepted from a caller.
 */
export async function runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1(): Promise<MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1> {
  const policy =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_OFFICIAL_EVIDENCE_POLICY_V1;
  const completedArms: MutableCompletedArmEvidenceV1 = {
    coarse: null,
    fine: null,
  };
  const coarseResult = await runCanonicalArmV1(
    "coarse",
    policy.coarseDtSec,
    completedArms,
  );
  try {
    completedArms.coarse = await sealSingleArmEvidenceV1(
      "coarse",
      policy.coarseDtSec,
      coarseResult,
    );
  } catch (error) {
    throw executionStageErrorV1("coarse", "arm-sealing", error, completedArms);
  }
  const fineResult = await runCanonicalArmV1(
    "fine",
    policy.fineDtSec,
    completedArms,
  );
  try {
    completedArms.fine = await sealSingleArmEvidenceV1(
      "fine",
      policy.fineDtSec,
      fineResult,
    );
  } catch (error) {
    throw executionStageErrorV1("fine", "arm-sealing", error, completedArms);
  }
  try {
    return await assembleSealedEvidenceV1(
      completedArms.coarse,
      completedArms.fine,
    );
  } catch (error) {
    throw executionStageErrorV1(null, "pair-sealing", error, completedArms);
  }
}

type CompletedArmEvidenceV1 = Readonly<{
  coarse: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceV1 | null;
  fine: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceV1 | null;
}>;

type MutableCompletedArmEvidenceV1 = {
  -readonly [K in keyof CompletedArmEvidenceV1]: CompletedArmEvidenceV1[K];
};

async function runCanonicalArmV1(
  arm: "coarse" | "fine",
  nominalDtSec: 0.001 | 0.0005,
  completedArms: CompletedArmEvidenceV1,
): Promise<MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyResultV1> {
  let source: MainWireIntegratedModelPeriodicSteadyResultV3;
  try {
    source = await runMainWireIntegratedModelPeriodicSteadyForWorkRefinementV1({
      nominalDtSec,
      maximumCycleCount:
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_OFFICIAL_EVIDENCE_POLICY_V1.requestedMaximumCycleCount,
      executionPurpose: "canonical-evidence",
    });
  } catch (error) {
    throw executionStageErrorV1(arm, "periodic-source", error, completedArms);
  }
  try {
    return await runMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyV1({
      source,
    });
  } catch (error) {
    throw executionStageErrorV1(
      arm,
      "single-arm-mechanical-ledger",
      error,
      completedArms,
    );
  }
}

function executionStageErrorV1(
  arm: "coarse" | "fine" | null,
  stage:
    | "periodic-source"
    | "single-arm-mechanical-ledger"
    | "arm-sealing"
    | "pair-sealing",
  cause: unknown,
  completedArms: CompletedArmEvidenceV1,
): Error &
  Readonly<{
    arm: "coarse" | "fine" | null;
    stage: string;
    completedArms: CompletedArmEvidenceV1;
  }> {
  const detail = cause instanceof Error ? cause.message : String(cause);
  return Object.assign(
    new Error(`${arm === null ? "pair" : arm} ${stage} failed: ${detail}`, {
      cause,
    }),
    Object.freeze({
      arm,
      stage,
      completedArms: Object.freeze({ ...completedArms }),
    }),
  );
}

async function assembleSealedEvidenceV1(
  coarse: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceV1,
  fine: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceV1,
): Promise<MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1> {
  const common = evidenceCommonV1(coarse, fine);
  if (
    coarse.status !== "projection-sealed" ||
    fine.status !== "projection-sealed"
  ) {
    return Object.freeze({
      ...common,
      status: "evidence-verification-failed" as const,
      admission: null,
      pairSealedPayloadSha256: null,
      officialSealedMechanicalEnergyAnalysisEligible: false as const,
    });
  }
  const admission =
    assessMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAdmissionV1(
      coarse.projection,
      fine.projection,
    );
  const pairSealedPayload = Object.freeze({
    evidenceId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_EVIDENCE_V1_ID,
    schemaVersion: 1 as const,
    policy:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_OFFICIAL_EVIDENCE_POLICY_V1,
    coarseCompactProjectionSha256: coarse.compactProjectionSha256,
    fineCompactProjectionSha256: fine.compactProjectionSha256,
    admission,
  });
  return Object.freeze({
    ...common,
    status: "sealed-admission-assessed" as const,
    admission,
    pairSealedPayloadSha256: await sha256CanonicalJsonHex(pairSealedPayload),
    officialSealedMechanicalEnergyAnalysisEligible:
      admission.numericalAdmissionConjunctionPassed,
  });
}

async function sealSingleArmEvidenceV1(
  grid: "coarse" | "fine",
  expectedNominalDtSec: 0.001 | 0.0005,
  source: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyResultV1,
): Promise<MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceV1> {
  const failureReasons: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceFailureReasonV1[] =
    [];
  if (source.status !== "qualified-for-refinement-comparison") {
    failureReasons.push("single-arm-not-qualified");
    return failedArmEvidenceV1(
      grid,
      expectedNominalDtSec,
      source,
      false,
      false,
      false,
      false,
      false,
      false,
      null,
      failureReasons,
    );
  }
  const sourceScopePassed = canonicalSourceScopePassedV1(
    source,
    expectedNominalDtSec,
  );
  const sourceGatesPassed = Object.values(source.gates).every((gate) => gate);
  const lineageBindingsPassed = acceptedLineageBindingsPassedV1(source);
  let recomputed: RecomputedMechanicalProjectionV1 | null = null;
  try {
    recomputed = recomputeMechanicalProjectionV1(source);
  } catch {
    recomputed = null;
  }
  const ledgerRecomputationPassed =
    recomputed !== null &&
    canonicalJsonStringify(recomputed.ledger) ===
      canonicalJsonStringify(source.ledger);
  const ledgerProjectionBindingsPassed =
    recomputed !== null && ledgerProjectionBindingsPassedV1(source, recomputed);
  const quadratureProvenancePassed =
    recomputed !== null &&
    canonicalJsonStringify(recomputed.quadratureBridges) ===
      canonicalJsonStringify(source.quadratureBridges);
  const hashBindings =
    await verifyMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyHashBindingsV1(
      publishedHashesV1(source),
      {
        sourceCheckpoint: source.sourceCheckpoint,
        terminalCheckpoint: source.terminalCheckpoint,
        measurementInputEvidence: source.measurementInputEvidence,
        bridgeTerminalAcceptedStepSample:
          source.bridgeTerminalAcceptedStepSample,
        materialVolumeBindingPayload: source.materialVolumeBindingPayload,
      },
    );
  if (!sourceScopePassed) {
    failureReasons.push("canonical-source-scope-mismatch");
  }
  if (!sourceGatesPassed) failureReasons.push("single-arm-gates-failed");
  if (!lineageBindingsPassed) {
    failureReasons.push("accepted-lineage-binding-mismatch");
  }
  if (!ledgerRecomputationPassed) {
    failureReasons.push("ledger-recomputation-mismatch");
  }
  if (!ledgerProjectionBindingsPassed) {
    failureReasons.push("ledger-projection-binding-mismatch");
  }
  if (!quadratureProvenancePassed) {
    failureReasons.push("quadrature-provenance-mismatch");
  }
  appendHashFailuresV1(hashBindings, failureReasons);
  if (
    !sourceScopePassed ||
    !sourceGatesPassed ||
    !lineageBindingsPassed ||
    !ledgerRecomputationPassed ||
    !ledgerProjectionBindingsPassed ||
    !quadratureProvenancePassed ||
    !hashBindings.allMatch ||
    recomputed === null
  ) {
    return failedArmEvidenceV1(
      grid,
      expectedNominalDtSec,
      source,
      sourceScopePassed,
      sourceGatesPassed,
      lineageBindingsPassed,
      ledgerRecomputationPassed,
      ledgerProjectionBindingsPassed,
      quadratureProvenancePassed,
      hashBindings,
      failureReasons,
    );
  }
  const projection = compactProjectionV1(source, recomputed);
  return Object.freeze({
    grid,
    expectedNominalDtSec,
    sourceQualificationId: source.qualificationId,
    sourceStatus: source.status,
    sourceFailureReasons: Object.freeze([...source.failureReasons]),
    sourceScopePassed,
    sourceGatesPassed,
    lineageBindingsPassed,
    ledgerRecomputationPassed,
    ledgerProjectionBindingsPassed,
    quadratureProvenancePassed,
    hashBindings,
    failureReasons: Object.freeze(failureReasons),
    status: "projection-sealed" as const,
    projection,
    compactProjectionSha256: await sha256CanonicalJsonHex(projection),
  });
}

type RecomputedMechanicalProjectionV1 = Readonly<{
  ledger: MainWireFiveWallMechanicalEnergyLedgerV1;
  physicalMetrics: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricV1[];
  allFiveSlsBackwardEulerNumericalDissipationMilliJ: number;
  allFiveEquilibriumPassiveBackwardEulerRemainderMilliJ: number;
  conjugacy: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyV1[];
  algebraicResiduals: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAlgebraicResidualV1[];
  quadratureBridges: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureBridgeV1[];
}>;

function recomputeMechanicalProjectionV1(
  source: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQualifiedV1,
): RecomputedMechanicalProjectionV1 {
  const evidence = source.measurementInputEvidence;
  const preceding = evidence.precedingAcceptedStepObservation.sample;
  const samples = Object.freeze(
    evidence.measurementAcceptedStepObservations.map(({ sample }) => sample),
  );
  const ledger =
    remeasureMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyEvidenceV1({
      precedingAcceptedStepSample: preceding,
      measurementAcceptedStepSamples: samples,
      wallMaterialVolumeMlByWall:
        source.materialVolumeBindingPayload.wallMaterialVolumeMlByWall,
    });
  const physicalMetrics = physicalMetricsFromLedgerV1(ledger);
  const algebraicResiduals = algebraicResidualsFromLedgerV1(ledger);
  return Object.freeze({
    ledger,
    physicalMetrics,
    allFiveSlsBackwardEulerNumericalDissipationMilliJ:
      MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1.reduce(
        (sum, wallId) =>
          sum +
          ledger.perWall[wallId].parallelSls
            .backwardEulerNumericalDissipationMilliJ,
        0,
      ),
    allFiveEquilibriumPassiveBackwardEulerRemainderMilliJ:
      MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1.reduce(
        (sum, wallId) =>
          sum +
          ledger.perWall[wallId].equilibriumPassiveBackwardEulerRemainderMilliJ,
        0,
      ),
    conjugacy: conjugacyFromLedgerV1(ledger),
    algebraicResiduals,
    quadratureBridges:
      remeasureMainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQuadratureBridgesV1(
        {
          precedingAcceptedStepSample: preceding,
          measurementAcceptedStepSamples: samples,
          wallMaterialVolumeMlByWall:
            source.materialVolumeBindingPayload.wallMaterialVolumeMlByWall,
          ledger,
          trapezoidalExternalWorkMmHgMl: Object.freeze({
            LV: source.measurementExternalWork.leftVentricle.externalWorkMmHgMl,
            RV: source.measurementExternalWork.rightVentricle
              .externalWorkMmHgMl,
          }),
        },
      ),
  });
}

function ledgerProjectionBindingsPassedV1(
  source: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQualifiedV1,
  recomputed: RecomputedMechanicalProjectionV1,
): boolean {
  return (
    canonicalJsonStringify(recomputed.physicalMetrics) ===
      canonicalJsonStringify(source.physicalMetrics) &&
    recomputed.allFiveSlsBackwardEulerNumericalDissipationMilliJ ===
      source.allFiveSlsBackwardEulerNumericalDissipationMilliJ &&
    recomputed.allFiveEquilibriumPassiveBackwardEulerRemainderMilliJ ===
      source.allFiveEquilibriumPassiveBackwardEulerRemainderMilliJ &&
    canonicalJsonStringify(recomputed.conjugacy) ===
      canonicalJsonStringify(source.conjugacy) &&
    canonicalJsonStringify(recomputed.algebraicResiduals) ===
      canonicalJsonStringify(source.algebraicResiduals)
  );
}

function physicalMetricsFromLedgerV1(
  ledger: MainWireFiveWallMechanicalEnergyLedgerV1,
): readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricV1[] {
  const metrics: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPhysicalMetricV1[] =
    [];
  for (const wallId of MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1) {
    const wall = ledger.perWall[wallId];
    for (const component of [
      "total",
      "landActive",
      "equilibriumPassive",
      "parallelSls",
    ] as const) {
      const componentId = (
        {
          total: "total",
          landActive: "land-active",
          equilibriumPassive: "equilibrium-passive",
          parallelSls: "parallel-sls",
        } as const
      )[component];
      metrics.push(
        Object.freeze({
          metricId: `wall.${wallId}.stress-work.${componentId}`,
          valueMilliJ: wall.stressWorkOnWallMilliJ[component],
        }),
      );
    }
    metrics.push(
      Object.freeze({
        metricId: `wall.${wallId}.equilibrium-passive-stored-energy-change`,
        valueMilliJ: wall.equilibriumPassiveStoredEnergyChangeMilliJ,
      }),
    );
    metrics.push(
      Object.freeze({
        metricId: `wall.${wallId}.parallel-sls-stored-energy-change`,
        valueMilliJ: wall.parallelSls.storedEnergyChangeMilliJ,
      }),
    );
    metrics.push(
      Object.freeze({
        metricId: `wall.${wallId}.sls-physical-dissipation`,
        valueMilliJ: wall.parallelSls.physicalDissipationMilliJ,
      }),
    );
  }
  for (const chamber of MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_CHAMBER_IDS_V1) {
    metrics.push(
      Object.freeze({
        metricId: `cavity.${chamber}.work-on-wall`,
        valueMilliJ: ledger.cavityWorkOnWallMilliJ[chamber],
      }),
    );
  }
  const aggregates: readonly Readonly<{
    aggregateId: "all-five" | "ventricular-walls";
    walls: readonly (typeof MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1)[number][];
  }>[] = [
    Object.freeze({
      aggregateId: "all-five" as const,
      walls: MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1,
    }),
    Object.freeze({
      aggregateId: "ventricular-walls" as const,
      walls: Object.freeze(["LVFW", "SEP", "RVFW"] as const),
    }),
  ];
  for (const aggregate of aggregates) {
    for (const component of [
      "total",
      "landActive",
      "equilibriumPassive",
      "parallelSls",
    ] as const) {
      const componentId = (
        {
          total: "total",
          landActive: "land-active",
          equilibriumPassive: "equilibrium-passive",
          parallelSls: "parallel-sls",
        } as const
      )[component];
      metrics.push(
        Object.freeze({
          metricId: `aggregate.${aggregate.aggregateId}.stress-work.${componentId}`,
          valueMilliJ: aggregate.walls.reduce(
            (sum, wallId) =>
              sum + ledger.perWall[wallId].stressWorkOnWallMilliJ[component],
            0,
          ),
        }),
      );
    }
    metrics.push(
      Object.freeze({
        metricId: `aggregate.${aggregate.aggregateId}.equilibrium-passive-stored-energy-change`,
        valueMilliJ: aggregate.walls.reduce(
          (sum, wallId) =>
            sum +
            ledger.perWall[wallId].equilibriumPassiveStoredEnergyChangeMilliJ,
          0,
        ),
      }),
    );
    metrics.push(
      Object.freeze({
        metricId: `aggregate.${aggregate.aggregateId}.parallel-sls-stored-energy-change`,
        valueMilliJ: aggregate.walls.reduce(
          (sum, wallId) =>
            sum + ledger.perWall[wallId].parallelSls.storedEnergyChangeMilliJ,
          0,
        ),
      }),
    );
    metrics.push(
      Object.freeze({
        metricId: `aggregate.${aggregate.aggregateId}.sls-physical-dissipation`,
        valueMilliJ: aggregate.walls.reduce(
          (sum, wallId) =>
            sum + ledger.perWall[wallId].parallelSls.physicalDissipationMilliJ,
          0,
        ),
      }),
    );
  }
  return Object.freeze(metrics);
}

function algebraicResidualsFromLedgerV1(
  ledger: MainWireFiveWallMechanicalEnergyLedgerV1,
): readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAlgebraicResidualV1[] {
  const tolerance =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_POLICY_V1.algebraicResidualAbsoluteToleranceMilliJ;
  const residuals: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyAlgebraicResidualV1[] =
    [];
  for (const wallId of MAIN_WIRE_FIVE_WALL_MECHANICAL_ENERGY_WALL_IDS_V1) {
    const wall = ledger.perWall[wallId];
    for (const [residualId, valueMilliJ] of [
      [`wall.${wallId}.stress-assembly`, wall.stressAssemblyResidualMilliJ],
      [
        `wall.${wallId}.parallel-sls.reported-balance`,
        wall.parallelSls.reportedDiscreteBalanceResidualMilliJ,
      ],
      [
        `wall.${wallId}.parallel-sls.reconstructed-balance`,
        wall.parallelSls.reconstructedDiscreteBalanceResidualMilliJ,
      ],
      [
        `wall.${wallId}.parallel-sls.readback-agreement`,
        wall.parallelSls.readbackAgreementResidualMilliJ,
      ],
    ] as const) {
      residuals.push(
        Object.freeze({
          residualId,
          valueMilliJ,
          passed:
            Number.isFinite(valueMilliJ) && Math.abs(valueMilliJ) <= tolerance,
        }),
      );
    }
  }
  return Object.freeze(residuals);
}

function conjugacyFromLedgerV1(
  ledger: MainWireFiveWallMechanicalEnergyLedgerV1,
): readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyConjugacyV1[] {
  const wall = ledger.perWall;
  const cavity = ledger.cavityWorkOnWallMilliJ;
  const ventricularWall =
    wall.LVFW.stressWorkOnWallMilliJ.total +
    wall.SEP.stressWorkOnWallMilliJ.total +
    wall.RVFW.stressWorkOnWallMilliJ.total;
  const ventricularCavity = cavity.LV + cavity.RV;
  const allWall =
    wall.LA.stressWorkOnWallMilliJ.total +
    ventricularWall +
    wall.RA.stressWorkOnWallMilliJ.total;
  const allCavity = cavity.LA + ventricularCavity + cavity.RA;
  return Object.freeze([
    Object.freeze({
      aggregateId: "left-atrium" as const,
      residualMilliJ: wall.LA.stressWorkOnWallMilliJ.total - cavity.LA,
      wallWorkMilliJ: wall.LA.stressWorkOnWallMilliJ.total,
      cavityWorkMilliJ: cavity.LA,
    }),
    Object.freeze({
      aggregateId: "right-atrium" as const,
      residualMilliJ: wall.RA.stressWorkOnWallMilliJ.total - cavity.RA,
      wallWorkMilliJ: wall.RA.stressWorkOnWallMilliJ.total,
      cavityWorkMilliJ: cavity.RA,
    }),
    Object.freeze({
      aggregateId: "ventricles-combined" as const,
      residualMilliJ: ventricularWall - ventricularCavity,
      wallWorkMilliJ: ventricularWall,
      cavityWorkMilliJ: ventricularCavity,
    }),
    Object.freeze({
      aggregateId: "whole-heart" as const,
      residualMilliJ: allWall - allCavity,
      wallWorkMilliJ: allWall,
      cavityWorkMilliJ: allCavity,
    }),
  ]);
}

function compactProjectionV1(
  source: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQualifiedV1,
  recomputed: RecomputedMechanicalProjectionV1,
): MainWireIntegratedModelPeriodicFiveWallMechanicalEnergySingleArmProjectionV1 {
  const sls = source.perStepSlsResidualEvidence;
  return Object.freeze({
    armId: "normal-default" as const,
    executionPurpose: source.executionPurpose,
    numericalAccessId: source.numericalAccessId,
    requestedMaximumCycleCount: source.requestedMaximumCycleCount,
    independentColdStart: true as const,
    status: source.status,
    nominalDtSec: source.nominalDtSec,
    modelConditionIdentityHash: source.modelConditionIdentityHash,
    protocolIdentityHash: source.protocolIdentityHash,
    sourceCycleIndex: source.sourceCycleIndex,
    sourceAcceptedStepCount: source.sourceAcceptedStepCount,
    bridgeCycleIndex: source.bridgeCycleIndex,
    bridgeAcceptedStepCount: source.bridgeAcceptedStepCount,
    measurementCycleIndex: source.measurementCycleIndex,
    measurementAcceptedStepCount: source.measurementAcceptedStepCount,
    gates: Object.freeze({ ...source.gates }),
    materialVolumeBindingSha256: source.materialVolumeBindingSha256,
    rawMechanicalTraceSha256: source.rawMechanicalTraceSha256,
    sourceCheckpointSha256: source.sourceCheckpointSha256,
    bridgeTerminalAcceptedStepSampleSha256:
      source.bridgeTerminalAcceptedStepSampleSha256,
    terminalCheckpointSha256: source.terminalCheckpointSha256,
    physicalMetrics: Object.freeze(
      recomputed.physicalMetrics.map((metric) => Object.freeze({ ...metric })),
    ),
    allFiveSlsBackwardEulerNumericalDissipationMilliJ:
      recomputed.allFiveSlsBackwardEulerNumericalDissipationMilliJ,
    allFiveEquilibriumPassiveBackwardEulerRemainderMilliJ:
      recomputed.allFiveEquilibriumPassiveBackwardEulerRemainderMilliJ,
    conjugacy: Object.freeze(
      recomputed.conjugacy.map((entry) => Object.freeze({ ...entry })),
    ),
    algebraicResiduals: Object.freeze(
      recomputed.algebraicResiduals.map((entry) => Object.freeze({ ...entry })),
    ),
    quadratureBridges: Object.freeze(
      recomputed.quadratureBridges.map((entry) => Object.freeze({ ...entry })),
    ),
    perStepSlsResidualEvidence: Object.freeze({
      assessedAcceptedStepCount: sls.assessedAcceptedStepCount,
      assessedWallStepCount: sls.assessedWallStepCount,
      maximumAbsoluteReconstructedResidualDensityJPerM3:
        sls.maximumAbsoluteReconstructedResidualDensityJPerM3,
      maximumAbsoluteReadbackAgreementResidualDensityJPerM3:
        sls.maximumAbsoluteReadbackAgreementResidualDensityJPerM3,
      maximumReconstructedResidualToleranceRatio:
        sls.maximumReconstructedResidualToleranceRatio,
      maximumReadbackAgreementToleranceRatio:
        sls.maximumReadbackAgreementToleranceRatio,
    }),
  });
}

function canonicalSourceScopePassedV1(
  source: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQualifiedV1,
  expectedNominalDtSec: 0.001 | 0.0005,
): boolean {
  const policy =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_OFFICIAL_EVIDENCE_POLICY_V1;
  return (
    source.executionPurpose === policy.executionPurpose &&
    source.numericalAccessId === policy.numericalAccessId &&
    source.requestedMaximumCycleCount === policy.requestedMaximumCycleCount &&
    source.nominalDtSec === expectedNominalDtSec &&
    source.sourceCheckpointExactRoundTripVerified &&
    source.continuationCheckpointExactRoundTripVerified
  );
}

function acceptedLineageBindingsPassedV1(
  source: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQualifiedV1,
): boolean {
  const evidence = source.measurementInputEvidence;
  const preceding = evidence.precedingAcceptedStepObservation;
  const measurement = evidence.measurementAcceptedStepObservations;
  const last = measurement.at(-1) ?? null;
  const sampleProjection = measurement.map(({ sample }) => sample);
  const lineageCountsAndCyclesValid =
    positiveSafeIntegerV1(source.sourceCycleIndex) &&
    positiveSafeIntegerV1(source.bridgeCycleIndex) &&
    positiveSafeIntegerV1(source.measurementCycleIndex) &&
    positiveSafeIntegerV1(source.sourceAcceptedStepCount) &&
    positiveSafeIntegerV1(source.bridgeAcceptedStepCount) &&
    positiveSafeIntegerV1(source.measurementAcceptedStepCount) &&
    source.bridgeCycleIndex === source.sourceCycleIndex + 1 &&
    source.measurementCycleIndex === source.sourceCycleIndex + 2 &&
    preceding.source.cycleIndex === source.bridgeCycleIndex &&
    preceding.source.acceptedStepIndexWithinCycle ===
      source.bridgeAcceptedStepCount;
  const precedingTupleValid =
    acceptedTupleValidV1(preceding.source) &&
    preceding.source.acceptedRevision ===
      preceding.source.previousAcceptedRevision + 1 &&
    preceding.source.acceptedTimeSec === preceding.source.cycleEndTimeSec &&
    preceding.source.cycleStartTimeSec ===
      source.sourceCheckpoint.acceptedTimeSec &&
    preceding.source.acceptedRevision ===
      source.sourceCheckpoint.revision + source.bridgeAcceptedStepCount;
  const measurementChainValid =
    measurement.length === source.measurementAcceptedStepCount &&
    measurement.length > 0 &&
    measurement.every((observation, index) => {
      const prior = index === 0 ? preceding : measurement[index - 1]!;
      const first = measurement[0]!;
      return (
        observation.source.cycleIndex === source.measurementCycleIndex &&
        observation.source.acceptedStepIndexWithinCycle === index + 1 &&
        observation.source.cycleStartTimeSec ===
          first.source.cycleStartTimeSec &&
        observation.source.cycleEndTimeSec === first.source.cycleEndTimeSec &&
        acceptedTupleValidV1(observation.source) &&
        observation.source.previousAcceptedRevision ===
          prior.source.acceptedRevision &&
        observation.source.acceptedRevision ===
          prior.source.acceptedRevision + 1 &&
        observation.source.previousAcceptedTimeSec ===
          prior.source.acceptedTimeSec &&
        (index !== 0 ||
          observation.source.previousAcceptedTimeSec ===
            observation.source.cycleStartTimeSec)
      );
    });
  return (
    lineageCountsAndCyclesValid &&
    precedingTupleValid &&
    measurementChainValid &&
    last !== null &&
    last.source.acceptedRevision === source.terminalCheckpoint.revision &&
    last.source.acceptedTimeSec === source.terminalCheckpoint.acceptedTimeSec &&
    last.source.acceptedTimeSec === last.source.cycleEndTimeSec &&
    canonicalJsonStringify(source.bridgeTerminalAcceptedStepSample) ===
      canonicalJsonStringify(preceding.sample) &&
    canonicalJsonStringify(source.measurementAcceptedStepSamples) ===
      canonicalJsonStringify(sampleProjection) &&
    [preceding, ...measurement].every(
      (observation) =>
        canonicalJsonStringify(observation.source.mechanicsIdentity) ===
        canonicalJsonStringify(source.materialVolumeBindingPayload.provider),
    )
  );
}

function positiveSafeIntegerV1(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function acceptedTupleValidV1(
  source: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQualifiedV1["measurementInputEvidence"]["precedingAcceptedStepObservation"]["source"],
): boolean {
  const clockTolerance =
    MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3.invariantTolerance
      .acceptedOwnerClockSkewSec;
  return (
    positiveSafeIntegerV1(source.cycleIndex) &&
    positiveSafeIntegerV1(source.acceptedStepIndexWithinCycle) &&
    Number.isSafeInteger(source.previousAcceptedRevision) &&
    source.previousAcceptedRevision >= 0 &&
    positiveSafeIntegerV1(source.acceptedRevision) &&
    Number.isFinite(source.cycleStartTimeSec) &&
    Number.isFinite(source.cycleEndTimeSec) &&
    source.cycleEndTimeSec > source.cycleStartTimeSec &&
    Number.isFinite(source.previousAcceptedTimeSec) &&
    Number.isFinite(source.acceptedTimeSec) &&
    Number.isFinite(source.acceptedDtSec) &&
    source.acceptedDtSec > 0 &&
    source.acceptedTimeSec > source.previousAcceptedTimeSec &&
    source.previousAcceptedTimeSec >= source.cycleStartTimeSec &&
    source.acceptedTimeSec <= source.cycleEndTimeSec &&
    Math.abs(
      source.acceptedTimeSec -
        source.previousAcceptedTimeSec -
        source.acceptedDtSec,
    ) <= clockTolerance
  );
}

function publishedHashesV1(
  source: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyQualifiedV1,
): MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyPublishedHashesV1 {
  return Object.freeze({
    sourceCheckpointSha256: source.sourceCheckpointSha256,
    terminalCheckpointSha256: source.terminalCheckpointSha256,
    rawMechanicalTraceSha256: source.rawMechanicalTraceSha256,
    bridgeTerminalAcceptedStepSampleSha256:
      source.bridgeTerminalAcceptedStepSampleSha256,
    materialVolumeBindingSha256: source.materialVolumeBindingSha256,
  });
}

function hashBindingV1(
  publishedSha256: string,
  embeddedSha256: string | null,
  recomputedSha256: string,
): MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyHashBindingV1 {
  return Object.freeze({
    publishedSha256,
    embeddedSha256,
    recomputedSha256,
    matches:
      publishedSha256 === recomputedSha256 &&
      (embeddedSha256 === null || embeddedSha256 === recomputedSha256),
  });
}

function appendHashFailuresV1(
  hashes: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyHashBindingsV1,
  failures: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceFailureReasonV1[],
): void {
  if (!hashes.sourceCheckpoint.matches) {
    failures.push("source-checkpoint-sha256-mismatch");
  }
  if (!hashes.terminalCheckpoint.matches) {
    failures.push("terminal-checkpoint-sha256-mismatch");
  }
  if (!hashes.rawMechanicalTrace.matches) {
    failures.push("raw-mechanical-trace-sha256-mismatch");
  }
  if (!hashes.bridgeTerminalAcceptedStepSample.matches) {
    failures.push("bridge-terminal-sample-sha256-mismatch");
  }
  if (!hashes.materialVolumeBinding.matches) {
    failures.push("material-volume-binding-sha256-mismatch");
  }
}

function failedArmEvidenceV1(
  grid: "coarse" | "fine",
  expectedNominalDtSec: 0.001 | 0.0005,
  source: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyResultV1,
  sourceScopePassed: boolean,
  sourceGatesPassed: boolean,
  lineageBindingsPassed: boolean,
  ledgerRecomputationPassed: boolean,
  ledgerProjectionBindingsPassed: boolean,
  quadratureProvenancePassed: boolean,
  hashBindings: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyHashBindingsV1 | null,
  failureReasons: readonly MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceFailureReasonV1[],
): MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceV1 {
  return Object.freeze({
    grid,
    expectedNominalDtSec,
    sourceQualificationId: source.qualificationId,
    sourceStatus: source.status,
    sourceFailureReasons: Object.freeze([...source.failureReasons]),
    sourceScopePassed,
    sourceGatesPassed,
    lineageBindingsPassed,
    ledgerRecomputationPassed,
    ledgerProjectionBindingsPassed,
    quadratureProvenancePassed,
    hashBindings,
    failureReasons: Object.freeze([...failureReasons]),
    status: "not-sealed" as const,
    projection: null,
    compactProjectionSha256: null,
  });
}

function evidenceCommonV1(
  coarse: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceV1,
  fine: MainWireIntegratedModelPeriodicFiveWallMechanicalEnergyArmEvidenceV1,
): EvidenceResultCommonV1 {
  return Object.freeze({
    evidenceId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_EVIDENCE_V1_ID,
    coarse,
    fine,
    officialSealedMechanicalEnergyAnalysisEligible: false,
    activeDeliveryAbsorptionSplitEstablished: false as const,
    instantaneousPowerEstablished: false as const,
    publicLiveOutputCatalogAdmissionEstablished: false as const,
    publicGraphCatalogAdmissionEstablished: false as const,
    PEEstablished: false as const,
    PVAEstablished: false as const,
    MVO2Established: false as const,
    ATPUseEstablished: false as const,
    mechanicalEfficiencyEstablished: false as const,
    physiologicalValidationEstablished: false as const,
    clinicalValidationClaimed: false as const,
    policy:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_FIVE_WALL_MECHANICAL_ENERGY_OFFICIAL_EVIDENCE_POLICY_V1,
  });
}
