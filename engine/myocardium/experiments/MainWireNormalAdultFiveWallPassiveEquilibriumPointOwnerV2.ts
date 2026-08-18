import { sha256CanonicalJsonHex } from "@/engine/integrity";
import {
  evaluateMainWireNormalAdultPassiveEquilibriumCandidateV1,
  reducedFourChamberTangentV1,
  type MainWireNormalAdultPassiveEquilibriumCandidateV1,
  type MainWireNormalAdultPassiveEquilibratedPointV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumPointOwnerV1";
import {
  assertMainWireNormalAdultPassiveEquilibriumPointProvenanceV1,
  createMainWireNormalAdultPassiveEquilibriumPointProvenanceV1,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V1_ID,
  type MainWireNormalAdultPassiveEquilibriumPointProvenanceV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumPointProvenanceV1";
import {
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V2_ID,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2,
  type MainWirePassiveEquilibriumInternalCoordinatesV2,
  type MainWirePassiveEquilibriumStageCandidateProjectionV2,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumNumericsV2";

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_V1 =
  deepFreezePointOwnerV2({
    declarationId:
      "main-wire-normal-adult-passive-equilibrium-schur-export-seam-v1",
    bindingSchemaId:
      "main-wire-normal-adult-passive-equilibrium-schur-export-seam-binding-v1",
    transformId:
      "main-wire-normal-adult-passive-equilibrium-schur-export-only-transform-v1",
    documentPath:
      "docs/scientific-runtime/INTEGRATED-MODEL-0020-passive-equilibrium-schur-export-seam.md",
    declarationDirectParentCommitSha:
      "5acaa6f0f0b96b5c3acd38090c8dc7ec766225b6",
    declarationCommitSha: "03fa37844067031612436a5330e6d7cae8a1ff84",
    declarationDocumentGitBlobSha1: "6c8c8ba338996dd7b12e99c66cab8ac6d5cfc464",
    declarationDocumentRawSha256:
      "975292ac743ff651e97ad07da3635d97b8707e5d6be70f5a465e302489325d26",
    historicalPointOwner: {
      sourceCommitSha: "28e6c5e9c7c7072853a79758fef6a2c09984cc30",
      sourceTreeSha: "05b8df7071240931160c91203bf8ae13556471ad",
      path: "engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumPointOwnerV1.ts",
      gitBlobSha1: "43d09f16c8cd1b5fe53688c9c5d7aeaa9d2edc5d",
      rawSha256:
        "3b096c8c3d386113c8b16fa43870d387d6bfd79f72debc04eb1caabb2756adac",
      byteSize: 86255,
    },
    runtimePointOwner: {
      gitBlobSha1: "7804e3f0497d3dbf122fe637e3fe09cbe1cff6e9",
      rawSha256:
        "13e760df8266891fcd3a30a40c815d1b08d6875eb4c606ea2fb148b4633b163a",
      byteSize: 86262,
    },
    transform: {
      path: "engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumPointOwnerV1.ts",
      zeroBasedInsertionOffset: 73677,
      insertedAscii: "export ",
      insertedHex: "6578706f727420",
      insertedByteCount: 7,
      oldSignatureOccurrenceCount: 1,
      newSignatureOccurrenceCount: 1,
      prefixExact: true,
      insertionExact: true,
      suffixExact: true,
    },
    historicalNumericalFunctionBodyOrExistingCallBehaviorChanged: false,
    moduleExportTopologyChanged: true,
    functionBodyChanged: false,
    scientificIdentityChanged: false,
    qualificationMintedByExport: false,
    newModelIdIntroduced: false,
    newSolverPolicyIntroduced: false,
    newAttemptIntroduced: false,
    newCaseIntroduced: false,
    thresholdChanged: false,
  } as const);

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_SHA256_V1 =
  "77d56823c31b2a71ee3526eddbef3d963445cbab8086a0c4aabae9163b4ef09d" as const;

const V1_IMMUTABLE_BLOBS = Object.freeze({
  historicalPointOwnerGitBlobSha1: "43d09f16c8cd1b5fe53688c9c5d7aeaa9d2edc5d",
  runtimePointOwnerGitBlobSha1: "7804e3f0497d3dbf122fe637e3fe09cbe1cff6e9",
  pointOwnerFocusedTestGitBlobSha1: "54bb27dc925429154eb1e40260c79b1eb087130f",
  provenanceGitBlobSha1: "ef2ddb13b7ff20d500ba86ffe67e69fc20f22944",
} as const);

export type MainWireNormalAdultPassiveEquilibriumPointOwnerV2 = Readonly<{
  ownerId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V2_ID;
  candidateOwnerId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V1_ID;
  candidateAuthority: "evaluateMainWireNormalAdultPassiveEquilibriumCandidateV1";
  canonicalReferenceRootMintingAvailable: false;
  callerSuppliedAttemptLineageAccepted: false;
  callerSuppliedCandidateEvaluatorAccepted: false;
  importOrFactoryRunsNormalAdultSolve: false;
  v1Provenance: MainWireNormalAdultPassiveEquilibriumPointProvenanceV1;
  v1ImmutableBlobs: typeof V1_IMMUTABLE_BLOBS;
  schurExportSeamBindingPayload: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_V1;
  schurExportSeamBindingSha256: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_SHA256_V1;
  pointSolverBranchProtocolPayload: Readonly<{
    pointSolverPolicy: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2;
    unchangedBranchPolicy: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1;
  }>;
  pointSolverBranchProtocolSha256: string;
}>;

export type MainWireNormalAdultPassiveEquilibriumUnbrandedTerminalProjectionV2 =
  Readonly<{
    qualification: "unbranded-non-official-projection";
    candidate: MainWireNormalAdultPassiveEquilibriumCandidateV1;
    reducedFourChamberPressureVolumeTangentPaPerM3: MainWireNormalAdultPassiveEquilibratedPointV1["reducedFourChamberPressureVolumeTangentPaPerM3"];
    schurOwner: "reducedFourChamberTangentV1";
    qualificationOrRootMinted: false;
  }>;

const pointOwnerRegistryV2 = new WeakSet<object>();

/**
 * Creates policy/provenance state only. It cannot solve or mint an official
 * root. A later zero-argument evidence runner must own authority, reservation,
 * and seal-manifest readback before this module may add a private root mint.
 */
export async function createMainWireNormalAdultPassiveEquilibriumPointOwnerV2(): Promise<MainWireNormalAdultPassiveEquilibriumPointOwnerV2> {
  const v1Provenance =
    await createMainWireNormalAdultPassiveEquilibriumPointProvenanceV1();
  assertMainWireNormalAdultPassiveEquilibriumPointProvenanceV1(v1Provenance);
  const recomputedSchurExportSeamBindingSha256 = await sha256CanonicalJsonHex(
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_V1,
  );
  if (
    recomputedSchurExportSeamBindingSha256 !==
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_SHA256_V1
  )
    throw new Error("V2 Schur export seam binding hash mismatch");
  const pointSolverBranchProtocolPayload = deepFreezePointOwnerV2({
    pointSolverPolicy:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2,
    unchangedBranchPolicy:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1,
  });
  const owner = deepFreezePointOwnerV2({
    ownerId: MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V2_ID,
    candidateOwnerId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V1_ID,
    candidateAuthority:
      "evaluateMainWireNormalAdultPassiveEquilibriumCandidateV1" as const,
    canonicalReferenceRootMintingAvailable: false as const,
    callerSuppliedAttemptLineageAccepted: false as const,
    callerSuppliedCandidateEvaluatorAccepted: false as const,
    importOrFactoryRunsNormalAdultSolve: false as const,
    v1Provenance,
    v1ImmutableBlobs: V1_IMMUTABLE_BLOBS,
    schurExportSeamBindingPayload:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_V1,
    schurExportSeamBindingSha256:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_SHA256_V1,
    pointSolverBranchProtocolPayload,
    pointSolverBranchProtocolSha256: await sha256CanonicalJsonHex(
      pointSolverBranchProtocolPayload,
    ),
  });
  pointOwnerRegistryV2.add(owner);
  return owner;
}

export function assertMainWireNormalAdultPassiveEquilibriumPointOwnerV2(
  owner: MainWireNormalAdultPassiveEquilibriumPointOwnerV2,
): void {
  if (
    owner === null ||
    typeof owner !== "object" ||
    !Object.isFrozen(owner) ||
    !pointOwnerRegistryV2.has(owner)
  )
    throw new Error("V2 point owner must be freshly created by its factory");
  assertMainWireNormalAdultPassiveEquilibriumPointProvenanceV1(
    owner.v1Provenance,
  );
}

/**
 * Fixed V1-candidate adapter. Its projection is pure and unbranded; official
 * eligibility remains owned by the zero-argument evidence runner.
 */
export function evaluateMainWireNormalAdultPassiveEquilibriumCanonicalStageCandidateV2(
  chamberVolumesM3: Readonly<{
    LA: number;
    LV: number;
    RA: number;
    RV: number;
  }>,
  internalCoordinates: MainWirePassiveEquilibriumInternalCoordinatesV2,
): MainWirePassiveEquilibriumStageCandidateProjectionV2 {
  const candidate = evaluateMainWireNormalAdultPassiveEquilibriumCandidateV1(
    chamberVolumesM3,
    internalCoordinates,
  );
  return deepFreezePointOwnerV2({
    internalCoordinates: {
      septalMidwallCapVolumeM3:
        candidate.internalCoordinates.septalMidwallCapVolumeM3,
      junctionRadiusM: candidate.internalCoordinates.junctionRadiusM,
    },
    wallStoredEnergyJ: {
      LVFW: candidate.wallEquilibriumPassiveByWall.LVFW.storedEnergyJ,
      SEP: candidate.wallEquilibriumPassiveByWall.SEP.storedEnergyJ,
      RVFW: candidate.wallEquilibriumPassiveByWall.RVFW.storedEnergyJ,
    },
    rawVentricularStoredEnergyJ: candidate.componentRawStoredEnergyJ.ventricles,
    scaledGradient: [
      candidate.internalEquilibriumEvidence.scaledGradient[0],
      candidate.internalEquilibriumEvidence.scaledGradient[1],
    ] as const,
    scaledForceInfinityNorm:
      candidate.internalEquilibriumEvidence.scaledForceInfinityNorm,
    scaledInternalHessian: [
      [
        candidate.internalEquilibriumEvidence.scaledInternalHessian[0][0],
        candidate.internalEquilibriumEvidence.scaledInternalHessian[0][1],
      ],
      [
        candidate.internalEquilibriumEvidence.scaledInternalHessian[1][0],
        candidate.internalEquilibriumEvidence.scaledInternalHessian[1][1],
      ],
    ] as const,
    scaledInternalHessianEigenvaluesAscending: [
      candidate.internalEquilibriumEvidence
        .scaledInternalHessianEigenvaluesAscending[0],
      candidate.internalEquilibriumEvidence
        .scaledInternalHessianEigenvaluesAscending[1],
    ] as const,
    strictLocalStabilityPassed:
      candidate.internalEquilibriumEvidence.strictLocalStabilityPassed,
    junctionRadiusPassed:
      candidate.internalEquilibriumEvidence.junctionRadiusPassed,
  });
}

/**
 * Uses the exported historical Schur owner without accepting a caller-built
 * candidate. The result remains unbranded and mints no point, root, or seal.
 */
export function evaluateMainWireNormalAdultPassiveEquilibriumCanonicalTerminalProjectionV2(
  chamberVolumesM3: Readonly<{
    LA: number;
    LV: number;
    RA: number;
    RV: number;
  }>,
  internalCoordinates: MainWirePassiveEquilibriumInternalCoordinatesV2,
): MainWireNormalAdultPassiveEquilibriumUnbrandedTerminalProjectionV2 | null {
  const candidate = evaluateMainWireNormalAdultPassiveEquilibriumCandidateV1(
    chamberVolumesM3,
    internalCoordinates,
  );
  const reducedFourChamberPressureVolumeTangentPaPerM3 =
    reducedFourChamberTangentV1(candidate);
  if (reducedFourChamberPressureVolumeTangentPaPerM3 === null) return null;
  return deepFreezePointOwnerV2({
    qualification: "unbranded-non-official-projection" as const,
    candidate,
    reducedFourChamberPressureVolumeTangentPaPerM3,
    schurOwner: "reducedFourChamberTangentV1" as const,
    qualificationOrRootMinted: false as const,
  });
}

function deepFreezePointOwnerV2<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>))
      deepFreezePointOwnerV2(child);
    Object.freeze(value);
  }
  return value;
}
