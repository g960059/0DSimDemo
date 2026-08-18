import path from "node:path";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/integrity";
import {
  auditMainWirePassiveEquilibriumStageKernelV2,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_AUDITOR_REPORT_V2,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_EVIDENCE_AUDITOR_V2_ID,
  type MainWirePassiveEquilibriumStageKernelAuditorEnvelopeV2,
  type MainWirePassiveEquilibriumStageKernelEnvelopeV2,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumEvidenceAuditorV2";
import {
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ARTIFACT_V2,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_PLATFORM_V2,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceArtifactV2";
import {
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V2_ID,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2_ID,
  solveMainWirePassiveEquilibriumStageKernelV2,
  type MainWirePassiveEquilibriumFloat64V2,
  type MainWirePassiveEquilibriumInternalCoordinatesV2,
  type MainWirePassiveEquilibriumStageKernelResultV2,
  wrapMainWirePassiveEquilibriumFloat64V2,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumNumericsV2";
import {
  assertMainWireNormalAdultPassiveEquilibriumPointOwnerV2,
  createMainWireNormalAdultPassiveEquilibriumPointOwnerV2,
  evaluateMainWireNormalAdultPassiveEquilibriumCanonicalStageCandidateV2,
  evaluateMainWireNormalAdultPassiveEquilibriumCanonicalTerminalProjectionV2,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_SHA256_V1,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_V1,
  type MainWireNormalAdultPassiveEquilibriumPointOwnerV2,
  type MainWireNormalAdultPassiveEquilibriumUnbrandedTerminalProjectionV2,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumPointOwnerV2";
import {
  createMainWireNormalAdultPassiveEquilibriumPointProvenanceV1,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PAIR_ORDER_V1,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PARTICIPANT_ORDER_V1,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1,
  MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SURFACE_VERIFICATION_POLICY_V1,
  type MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumPointProvenanceV1";
import { NORMAL_ADULT_FIVE_WALL_PRIOR_V1 } from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";

export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_NUMERICAL_ADDENDUM_DECLARATION_V1 =
  "main-wire-normal-adult-passive-equilibrium-point-solver-numerical-addendum-v1" as const;
export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ATTEMPT_V2 =
  "main-wire-normal-adult-passive-equilibrium-point-solver-v2-engineering-reruns-v1" as const;
export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ATTEMPT_SCHEMA_V2 =
  "main-wire-normal-adult-passive-equilibrium-point-solver-v2-engineering-attempt-v1" as const;
export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_EVIDENCE_SCHEMA_V2 =
  "main-wire-normal-adult-passive-equilibrium-point-solver-v2-engineering-evidence-v1" as const;
export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_JOURNAL_SCHEMA_V2 =
  "main-wire-normal-adult-passive-equilibrium-point-solver-v2-engineering-attempt-journal-v1" as const;
export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_AUTHORITY_SCHEMA_V2 =
  "main-wire-normal-adult-passive-equilibrium-point-solver-v2-authoritative-clone-v1" as const;
export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_RESERVATION_SCHEMA_V2 =
  "main-wire-normal-adult-passive-equilibrium-point-solver-v2-common-dir-reservation-v1" as const;
export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SEAL_MANIFEST_SCHEMA_V2 =
  "main-wire-normal-adult-passive-equilibrium-point-solver-v2-seal-manifest-v1" as const;
export const MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_TOMBSTONE_SCHEMA_V2 =
  "main-wire-normal-adult-passive-equilibrium-point-solver-v2-unexecuted-tombstone-v1" as const;

const DECLARATION_D_SHA = "03fa37844067031612436a5330e6d7cae8a1ff84" as const;
const DECLARATION_D_PARENT_SHA =
  "5acaa6f0f0b96b5c3acd38090c8dc7ec766225b6" as const;
const DECLARATION_D_TREE_SHA =
  "7fab075603e8681ffda38b94e13b07ca8be512ed" as const;
const AUTHORITY_RELATIVE_SUFFIX =
  "circleheart-scientific-attempts/authoritative-clone-v1.json" as const;
const RESERVATION_RELATIVE_SUFFIX =
  "circleheart-scientific-attempts/main-wire-normal-adult-passive-equilibrium-point-solver-v2-engineering-reruns-v1.reservation.json" as const;
const EVIDENCE_DIRECTORY_RELATIVE = "docs/scientific-runtime/evidence" as const;
const MANIFEST_RELATIVE_PATH =
  `${EVIDENCE_DIRECTORY_RELATIVE}/passive-equilibrium-point-solver-v2-seal-manifest-v1.json` as const;
const TOMBSTONE_RELATIVE_PATH =
  `${EVIDENCE_DIRECTORY_RELATIVE}/passive-equilibrium-point-solver-v2-unexecuted-tombstone-v1.json` as const;
const JOURNAL_RELATIVE_PATH =
  `${EVIDENCE_DIRECTORY_RELATIVE}/passive-equilibrium-point-solver-v2-engineering-reruns-v1.journal.json` as const;
const JOURNAL_STAGE_RELATIVE_PATH = `${JOURNAL_RELATIVE_PATH}.next` as const;
const ARTIFACT_RELATIVE_PATH =
  `${EVIDENCE_DIRECTORY_RELATIVE}/passive-equilibrium-point-solver-v2-engineering-reruns-v1.json` as const;
const FROZEN_POINT_SOLVER_POLICY_V2_SHA256 =
  "71dd920e828297ecb15181cd9c91c6a37b4226506597ec397ddda4cae073a9ea" as const;
const FROZEN_POINT_SOLVER_BRANCH_PROTOCOL_V2_SHA256 =
  "cbe8d42cdab549f46ef25103741d807473e9f0253d7f1a037ae5fc175665dc38" as const;

const A_ALLOWED_PATHS = Object.freeze([
  "engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumPointOwnerV1.ts",
  "engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumNumericsV2.ts",
  "engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumEvidenceAuditorV2.ts",
  "engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumPointOwnerV2.ts",
  "engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceV2.ts",
  "engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceArtifactV2.ts",
  "__tests__/mainWireNormalAdultFiveWallPassiveEquilibriumNumericsV2.test.ts",
  "__tests__/mainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceV2.test.ts",
  "tools/runMainWireNormalAdultFiveWallPassiveEquilibriumEngineeringEvidenceV2.ts",
  "package.json",
  "vitest.suites.ts",
] as const);

const MANIFEST_INHERITED_DEPENDENCY_BLOBS = Object.freeze([
  Object.freeze({
    path: "docs/scientific-runtime/INTEGRATED-MODEL-0018-passive-multichamber-equilibrium-energy-surface-preregistration.md",
    gitBlobSha1: "3fae899b3bb7cb0515797b0338ba1951592b589c",
  }),
  Object.freeze({
    path: "docs/scientific-runtime/INTEGRATED-MODEL-0019-passive-equilibrium-point-solver-numerical-addendum.md",
    gitBlobSha1: "dd09dab325f4d1ac87deed818c17471af71dad08",
  }),
  Object.freeze({
    path: "docs/scientific-runtime/INTEGRATED-MODEL-0020-passive-equilibrium-schur-export-seam.md",
    gitBlobSha1: "6c8c8ba338996dd7b12e99c66cab8ac6d5cfc464",
  }),
  Object.freeze({
    path: "engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumPointOwnerV1.ts",
    gitBlobSha1: "7804e3f0497d3dbf122fe637e3fe09cbe1cff6e9",
  }),
  Object.freeze({
    path: "engine/myocardium/experiments/MainWireNormalAdultFiveWallPassiveEquilibriumPointProvenanceV1.ts",
    gitBlobSha1: "ef2ddb13b7ff20d500ba86ffe67e69fc20f22944",
  }),
  Object.freeze({
    path: "engine/myocardium/mechanics/normalAdultFiveWallPriorV1.ts",
    gitBlobSha1: "81a6b1355fe6f9bb34eac4b58ba33895add84b0e",
  }),
  Object.freeze({
    path: "engine/myocardium/mechanics/energyConjugateTriSegV1.ts",
    gitBlobSha1: "630a15b59233b0ee7b1002738182f47a0dd10b48",
  }),
  Object.freeze({
    path: "engine/myocardium/mechanics/equilibriumOneFiberPassiveV1.ts",
    gitBlobSha1: "9f4def0bd01dbf82d040ec81978a2d7aa1561a94",
  }),
  Object.freeze({
    path: "engine/myocardium/mechanics/moyer2015AtrialEquibiaxialPassiveV1.ts",
    gitBlobSha1: "433a5b280f6827da12bb44b671115932a1ec714c",
  }),
  Object.freeze({
    path: "__tests__/mainWireNormalAdultFiveWallPassiveEquilibriumPointOwnerV1.test.ts",
    gitBlobSha1: "54bb27dc925429154eb1e40260c79b1eb087130f",
  }),
] as const);

type ChamberVolumesV2 = Readonly<{
  LA: number;
  LV: number;
  RA: number;
  RV: number;
}>;

type SanitizedExceptionV2 = Readonly<{ name: string; message: string }>;

type AuthorityPayloadV2 = Readonly<{
  authoritySchemaId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_AUTHORITY_SCHEMA_V2;
  authoritativeCloneId: string;
  declarationId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_NUMERICAL_ADDENDUM_DECLARATION_V1;
  attemptId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ATTEMPT_V2;
  attemptSchemaId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ATTEMPT_SCHEMA_V2;
  reservationSchemaId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_RESERVATION_SCHEMA_V2;
  implementationCommitSha: string;
  authorityRelativeSuffix: typeof AUTHORITY_RELATIVE_SUFFIX;
}>;

type PinnedBlobV2 = Readonly<{ path: string; gitBlobSha1: string }>;

export type MainWireNormalAdultPassiveEquilibriumSealManifestPayloadV2 =
  Readonly<{
    sealManifestSchemaId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SEAL_MANIFEST_SCHEMA_V2;
    declarationId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_NUMERICAL_ADDENDUM_DECLARATION_V1;
    declarationCommitSha: typeof DECLARATION_D_SHA;
    declarationDirectParentCommitSha: typeof DECLARATION_D_PARENT_SHA;
    declarationTreeSha: typeof DECLARATION_D_TREE_SHA;
    implementationCommitSha: string;
    implementationDirectParentCommitSha: typeof DECLARATION_D_SHA;
    changedImplementationBlobs: readonly PinnedBlobV2[];
    inheritedDependencyBlobs: typeof MANIFEST_INHERITED_DEPENDENCY_BLOBS;
    schurExportSeamBindingPayload: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_V1;
    schurExportSeamBindingSha256: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_SHA256_V1;
    authorityPayload: AuthorityPayloadV2;
    authoritativeCloneRecordSha256: string;
    manifestAndTombstoneOnlyInSealCommit: true;
    normalAdultTargetExecutedBeforeSeal: false;
  }>;

export type MainWireNormalAdultPassiveEquilibriumSealManifestV2 = Readonly<{
  schemaId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SEAL_MANIFEST_SCHEMA_V2;
  payload: MainWireNormalAdultPassiveEquilibriumSealManifestPayloadV2;
  sealManifestSha256: string;
}>;

type TombstoneV2 = Readonly<{
  schemaId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_TOMBSTONE_SCHEMA_V2;
  declarationCommitSha: typeof DECLARATION_D_SHA;
  implementationCommitSha: string;
  attemptId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ATTEMPT_V2;
  sealManifestSha256: string;
  status: "unexecuted";
  sharedReferenceRootExecuted: false;
  frozenCasesExecuted: false;
  branchAuditExecuted: false;
  artifactCreated: false;
}>;

type ReservationPayloadV2 = Readonly<{
  reservationSchemaId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_RESERVATION_SCHEMA_V2;
  declarationId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_NUMERICAL_ADDENDUM_DECLARATION_V1;
  attemptId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ATTEMPT_V2;
  attemptSchemaId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ATTEMPT_SCHEMA_V2;
  evidenceSchemaId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_EVIDENCE_SCHEMA_V2;
  evidenceAuditorId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_EVIDENCE_AUDITOR_V2_ID;
  auditorReportSchemaId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_AUDITOR_REPORT_V2;
  journalSchemaId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_JOURNAL_SCHEMA_V2;
  authoritySchemaId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_AUTHORITY_SCHEMA_V2;
  sealManifestSchemaId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SEAL_MANIFEST_SCHEMA_V2;
  tombstoneSchemaId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_TOMBSTONE_SCHEMA_V2;
  declarationCommitSha: typeof DECLARATION_D_SHA;
  implementationCommitSha: string;
  observedSealCommitSha: string;
  sealManifestSha256: string;
  authorityPayload: AuthorityPayloadV2;
  authoritativeCloneRecordSha256: string;
  authoritativeCloneId: string;
  authorityRelativeSuffix: typeof AUTHORITY_RELATIVE_SUFFIX;
  reservationRelativeSuffix: typeof RESERVATION_RELATIVE_SUFFIX;
}>;

type RuntimePathsV2 = Readonly<{
  repositoryRoot: string;
  gitCommonDirectory: string;
  authorityPath: string;
  reservationPath: string;
  journalPath: string;
  journalStagePath: string;
  artifactPath: string;
  manifestPath: string;
  tombstonePath: string;
}>;

type PreflightV2 = Readonly<{
  paths: RuntimePathsV2;
  manifest: MainWireNormalAdultPassiveEquilibriumSealManifestV2;
  observedSealCommitSha: string;
  authorityPayload: AuthorityPayloadV2;
  authoritativeCloneRecordSha256: string;
}>;

type OfficialContextV2 = Readonly<{
  preflight: PreflightV2;
  reservationPayload: ReservationPayloadV2;
  commonDirReservationSha256: string;
  pointOwner: MainWireNormalAdultPassiveEquilibriumPointOwnerV2;
  reservedJournal: JournalEnvelopeV2;
}>;

const officialContextRegistryV2 = new WeakSet<object>();

export type MainWireNormalAdultPassiveEquilibriumOfficialStageEvidenceV2 =
  Readonly<{
    chamberVolumesM3: ChamberVolumesV2;
    kernelEvidence: MainWirePassiveEquilibriumStageKernelEnvelopeV2;
    kernelAudit: MainWirePassiveEquilibriumStageKernelAuditorEnvelopeV2;
  }>;

type OfficialStageKernelEvidenceV2 = Readonly<{
  chamberVolumesM3: ChamberVolumesV2;
  kernelEvidence: MainWirePassiveEquilibriumStageKernelEnvelopeV2;
}>;

type OfficialPointSuccessV2 = Readonly<{
  status: "equilibrated";
  stageZeroRootSha256: string;
  targetChamberVolumesM3: ChamberVolumesV2;
  stages: readonly MainWireNormalAdultPassiveEquilibriumOfficialStageEvidenceV2[];
  terminalProjection: MainWireNormalAdultPassiveEquilibriumUnbrandedTerminalProjectionV2;
}>;

type OfficialPointFailureV2 = Readonly<{
  status: "not-equilibrated";
  stageZeroRootSha256: string | null;
  targetChamberVolumesM3: ChamberVolumesV2;
  failurePhase:
    "stage-solver" | "stage-auditor" | "stage-scientific" | "terminal-schur";
  failureReason: string;
  completedStages: readonly MainWireNormalAdultPassiveEquilibriumOfficialStageEvidenceV2[];
  failedStageKernelEvidence: OfficialStageKernelEvidenceV2 | null;
  failedStage: MainWireNormalAdultPassiveEquilibriumOfficialStageEvidenceV2 | null;
  exception: SanitizedExceptionV2 | null;
}>;

type OfficialPointCasePayloadV2 =
  OfficialPointSuccessV2 | OfficialPointFailureV2;
type OfficialPointResultV2 = OfficialPointCasePayloadV2 &
  Readonly<{ casePayloadSha256: string }>;

type AdmittedReferenceRootV2 = Readonly<{
  status: "admitted";
  admittedReferenceRootPayload: Readonly<{
    ownerId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V2_ID;
    solverPolicyId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2_ID;
    solverPolicyPayload: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2;
    solverPolicySha256: string;
    unchangedBranchPolicyPayload: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1;
    pointSolverBranchProtocolPayload: MainWireNormalAdultPassiveEquilibriumPointOwnerV2["pointSolverBranchProtocolPayload"];
    pointSolverBranchProtocolSha256: string;
    passiveMaterialGeometryBindingPayload: MainWireNormalAdultPassiveEquilibriumPointOwnerV2["v1Provenance"]["passiveMaterialGeometryBindingPayload"];
    passiveMaterialGeometryBindingSha256: string;
    surfaceVerificationProtocolPayload: MainWireNormalAdultPassiveEquilibriumPointOwnerV2["v1Provenance"]["surfaceVerificationProtocolPayload"];
    surfaceVerificationProtocolSha256: string;
    schurExportSeamBindingPayload: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_V1;
    schurExportSeamBindingSha256: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_SHA256_V1;
    manifestPayload: MainWireNormalAdultPassiveEquilibriumSealManifestPayloadV2;
    reservationPayload: ReservationPayloadV2;
    commonDirReservationSha256: string;
    referenceVolumesM3: ChamberVolumesV2;
    referenceVolumeBits: Readonly<{
      LA: MainWirePassiveEquilibriumFloat64V2;
      LV: MainWirePassiveEquilibriumFloat64V2;
      RA: MainWirePassiveEquilibriumFloat64V2;
      RV: MainWirePassiveEquilibriumFloat64V2;
    }>;
    initialCoordinates: Readonly<{
      septalMidwallCapVolumeM3: MainWirePassiveEquilibriumFloat64V2;
      junctionRadiusM: MainWirePassiveEquilibriumFloat64V2;
    }>;
    stageKernelEvidence: OfficialStageKernelEvidenceV2;
    terminalProjection: MainWireNormalAdultPassiveEquilibriumUnbrandedTerminalProjectionV2;
    stationarityPassed: true;
    strictStabilityPassed: true;
  }>;
  admittedReferenceRootSha256: string;
  rootFailureReason: null;
  referenceRootAuditorReport: RootAuditorReportV2 &
    Readonly<{ status: "passed" }>;
  referenceRootAuditorReportSha256: string;
}>;

type RootAuditOutcomeNotRunV2 = Readonly<{
  status: "not-run";
  referenceRootAuditorReport: null;
  referenceRootAuditorReportSha256: null;
  auditorNotRunReason: string;
}>;

type RootAuditOutcomeFailedV2 = Readonly<{
  status: "failed";
  referenceRootAuditorReport: RootAuditorReportV2 &
    Readonly<{ status: "failed" }>;
  referenceRootAuditorReportSha256: string;
  auditorNotRunReason: null;
  auditorExecutionFailure: null;
}>;

type RootAuditOutcomeExecutionFailedV2 = Readonly<{
  status: "execution-failed";
  referenceRootAuditorReport: null;
  referenceRootAuditorReportSha256: null;
  auditorNotRunReason: null;
  auditorExecutionFailure: SanitizedExceptionV2;
}>;

type RootAuditOutcomePassedScientificFailureV2 = Readonly<{
  status: "passed-but-scientific-failure";
  referenceRootAuditorReport: RootAuditorReportV2 &
    Readonly<{ status: "passed" }>;
  referenceRootAuditorReportSha256: string;
  auditorNotRunReason: null;
  auditorExecutionFailure: null;
}>;

type RootAuditOutcomePassedSealingFailureV2 = Readonly<{
  status: "passed-but-sealing-failed";
  referenceRootAuditorReport: RootAuditorReportV2 &
    Readonly<{ status: "passed" }>;
  referenceRootAuditorReportSha256: string;
  auditorNotRunReason: null;
  auditorExecutionFailure: null;
}>;

type RootAuditOutcomeV2 =
  | RootAuditOutcomeNotRunV2
  | RootAuditOutcomeFailedV2
  | RootAuditOutcomeExecutionFailedV2
  | RootAuditOutcomePassedScientificFailureV2
  | RootAuditOutcomePassedSealingFailureV2;

type NotAdmittedReferenceRootV2 = Readonly<{
  status: "not-admitted";
  admittedReferenceRootPayload: null;
  admittedReferenceRootSha256: null;
  referenceRootAttemptEvidence: ReferenceRootAttemptEvidenceV2;
  rootFailureReason: string;
  auditOutcome: RootAuditOutcomeV2;
}>;

export type MainWireNormalAdultPassiveEquilibriumReferenceRootOutcomeV2 =
  AdmittedReferenceRootV2 | NotAdmittedReferenceRootV2;

type SealedReferenceRootV2 = Readonly<{
  outcome: AdmittedReferenceRootV2;
  terminalCoordinates: MainWirePassiveEquilibriumInternalCoordinatesV2;
  stageZeroEvidence: MainWireNormalAdultPassiveEquilibriumOfficialStageEvidenceV2;
}>;

const sealedReferenceRootRegistryV2 = new WeakSet<object>();

type ExecutionStatusV2 =
  | "fulfilled"
  | "scientific-failure"
  | "execution-exception"
  | "evidence-audit-failure"
  | "dependency-failed";

type DependencyFailedPointExecutionV2 = Readonly<{
  status: "dependency-failed";
  dependency: "admitted-reference-root";
  targetChamberVolumesM3: ChamberVolumesV2;
  targetVolumeBits: ReturnType<typeof wrapVolumesEvidenceV2>;
  solveAttempted: false;
  casePayloadSha256: string;
}>;

type NamedSeedDependencyDiagnosticV2 = Readonly<{
  participantId: "seed-zero-plus-0.25" | "seed-plus-0.25-plus-0.25";
  seedOffsetScaledCoordinates: readonly [number, number];
  status:
    | "fulfilled"
    | "scientific-failure"
    | "evidence-audit-failure"
    | "execution-exception";
  stageEvidence: MainWireNormalAdultPassiveEquilibriumOfficialStageEvidenceV2 | null;
  exception: SanitizedExceptionV2 | null;
  payloadSha256: string;
}>;

type DependencyFailedBranchExecutionV2 = Readonly<{
  status: "dependency-failed";
  dependency: "admitted-reference-root";
  fullBranchAuditAttempted: false;
  namedSeedStageZeroDiagnostics: readonly [
    NamedSeedDependencyDiagnosticV2,
    NamedSeedDependencyDiagnosticV2,
  ];
  allRequiredDependencyAvailableWorkAttempted: true;
}>;

type TopLevelExecutionResultV2 =
  | OfficialPointResultV2
  | BranchAuditEvidenceV2
  | DependencyFailedPointExecutionV2
  | DependencyFailedBranchExecutionV2
  | Readonly<{
      status: "execution-exception";
      phase: "literal" | "canonical" | "branch-audit";
      partialEvidence: Readonly<{
        retentionStatus: "no-result-returned-before-top-level-boundary";
        completedStages: readonly MainWireNormalAdultPassiveEquilibriumOfficialStageEvidenceV2[];
        participants: readonly BranchParticipantV2[];
      }>;
    }>;

type TopLevelExecutionV2 = Readonly<{
  executionId:
    | "literal-midpoint-primary-v2"
    | "canonical-index16-primary-v2"
    | "reference-branch-audit-v2";
  status: ExecutionStatusV2;
  result: TopLevelExecutionResultV2;
  exception: SanitizedExceptionV2 | null;
  payloadSha256: string;
}>;

type PreAdmissionIndependentAuditorReportV2 = Readonly<{
  reportId: "main-wire-normal-adult-passive-equilibrium-pre-admission-independent-auditor-v2";
  status: "passed" | "failed" | "execution-failed";
  rootPayloadAndReportReplayPassed: boolean;
  executionOrderAndEnvelopeHashReplayPassed: boolean;
  literalCaseReplayPassed: boolean;
  canonicalCaseReplayPassed: boolean;
  namedSeedCaseReplayPassed: boolean;
  branchResultAndAllStageReplayPassed: boolean;
  journalChainReplayPassed: boolean;
  fourCaseThreeExecutionCoveragePassed: boolean;
  orderedExecutionAggregateSha256: string;
  firstMismatchId: string | null;
  exception: SanitizedExceptionV2 | null;
}>;

export type MainWireNormalAdultPassiveEquilibriumEngineeringArtifactPayloadV2 =
  Readonly<{
    schemaId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_EVIDENCE_SCHEMA_V2;
    attemptId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ATTEMPT_V2;
    status: "pass" | "failed";
    officialSealedEngineeringEvidenceEligible: boolean;
    declarationCommitSha: typeof DECLARATION_D_SHA;
    implementationCommitSha: string;
    observedSealCommitSha: string;
    engineeringArtifactOwnerId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ARTIFACT_V2;
    schurExportSeamBindingPayload: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_V1;
    schurExportSeamBindingSha256: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_SHA256_V1;
    sealManifestPayload: MainWireNormalAdultPassiveEquilibriumSealManifestPayloadV2;
    sealManifestSha256: string;
    reservationPayload: ReservationPayloadV2;
    commonDirReservationSha256: string;
    referenceRootOutcome: MainWireNormalAdultPassiveEquilibriumReferenceRootOutcomeV2;
    executions: readonly [
      TopLevelExecutionV2,
      TopLevelExecutionV2,
      TopLevelExecutionV2,
    ];
    completeAllSettledCoverage: boolean;
    preAdmissionIndependentAuditorReport: PreAdmissionIndependentAuditorReportV2;
    preAdmissionIndependentAuditorReportSha256: string;
    journalLineage: readonly JournalEnvelopeV2[];
    runtime: Readonly<{
      node: string;
      platform: string;
      architecture: string;
    }>;
    claims: Readonly<{
      surfaceEstablished: false;
      continuousBranchEstablished: false;
      globalMinimumOrUniquenessEstablished: false;
      liveOutputOrGraphEstablished: false;
      physiologyOrClinicalValidationEstablished: false;
    }>;
  }>;

declare const officialEngineeringArtifactBrandV2: unique symbol;

export type MainWireNormalAdultPassiveEquilibriumOfficialEngineeringArtifactV2 =
  Readonly<{
    schemaId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ARTIFACT_V2;
    payload: MainWireNormalAdultPassiveEquilibriumEngineeringArtifactPayloadV2;
    payloadSha256: string;
    [officialEngineeringArtifactBrandV2]: true;
  }>;

const officialEngineeringArtifactRegistryV2 = new WeakSet<object>();

export async function sealMainWireNormalAdultPassiveEquilibriumCommitAV2(): Promise<MainWireNormalAdultPassiveEquilibriumSealManifestV2> {
  const platform =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_PLATFORM_V2;
  const repositoryRoot = platform.repositoryRoot();
  if (platform.gitStatusPorcelain(repositoryRoot) !== "")
    throw new Error("Commit-A sealing requires a clean worktree");
  const implementationCommitSha = platform.gitHeadSha(repositoryRoot);
  if (
    platform.gitParentSha(repositoryRoot, implementationCommitSha) !==
    DECLARATION_D_SHA
  )
    throw new Error("Commit A must be the direct child of declaration D");
  if (
    platform.gitParentSha(repositoryRoot, DECLARATION_D_SHA) !==
      DECLARATION_D_PARENT_SHA ||
    platform.gitTreeSha(repositoryRoot, DECLARATION_D_SHA) !==
      DECLARATION_D_TREE_SHA
  )
    throw new Error("declaration D lineage or tree mismatch");
  await verifyCommitAAndSchurSeamBindingsV2(
    repositoryRoot,
    implementationCommitSha,
  );

  const paths = runtimePathsV2(repositoryRoot);
  for (const outputPath of [
    paths.manifestPath,
    paths.tombstonePath,
    paths.reservationPath,
    paths.journalPath,
    paths.journalStagePath,
    paths.artifactPath,
  ]) {
    if (platform.exists(outputPath))
      throw new Error(`Commit-A sealing path already exists: ${outputPath}`);
  }

  const changedImplementationBlobs = Object.freeze(
    A_ALLOWED_PATHS.map((pinnedPath) =>
      Object.freeze({
        path: pinnedPath,
        gitBlobSha1: platform.gitBlobSha(
          repositoryRoot,
          implementationCommitSha,
          pinnedPath,
        ),
      }),
    ),
  );
  verifyInheritedDependencyBlobsV2(repositoryRoot, implementationCommitSha);
  platform.ensureDirectoryDurable(path.dirname(paths.authorityPath));
  platform.ensureDirectoryDurable(paths.gitCommonDirectory);
  const existingAuthorityPayload = platform.exists(paths.authorityPath)
    ? (JSON.parse(platform.readUtf8(paths.authorityPath)) as AuthorityPayloadV2)
    : null;
  const authorityPayload = deepFreezeEvidenceV2({
    authoritySchemaId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_AUTHORITY_SCHEMA_V2,
    authoritativeCloneId:
      existingAuthorityPayload?.authoritativeCloneId ??
      platform.randomOpaqueId32Hex(),
    declarationId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_NUMERICAL_ADDENDUM_DECLARATION_V1,
    attemptId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ATTEMPT_V2,
    attemptSchemaId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ATTEMPT_SCHEMA_V2,
    reservationSchemaId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_RESERVATION_SCHEMA_V2,
    implementationCommitSha,
    authorityRelativeSuffix: AUTHORITY_RELATIVE_SUFFIX,
  });
  if (!/^[0-9a-f]{32}$/.test(authorityPayload.authoritativeCloneId))
    throw new Error("authoritative clone ID must be lower-case 32-hex");
  if (
    existingAuthorityPayload !== null &&
    canonicalJsonStringify(existingAuthorityPayload) !==
      canonicalJsonStringify(authorityPayload)
  )
    throw new Error("existing authoritative clone record mismatch");
  const authoritativeCloneRecordSha256 =
    await sha256CanonicalJsonHex(authorityPayload);
  if (existingAuthorityPayload === null)
    platform.writeJsonCreateOnlyDurable(paths.authorityPath, authorityPayload);
  requireCanonicalReadbackV2(paths.authorityPath, authorityPayload);

  const payload = expectedSealManifestPayloadV2({
    implementationCommitSha,
    changedImplementationBlobs,
    authorityPayload,
    authoritativeCloneRecordSha256,
  });
  const manifest = deepFreezeEvidenceV2({
    schemaId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SEAL_MANIFEST_SCHEMA_V2,
    payload,
    sealManifestSha256: await sha256CanonicalJsonHex(payload),
  });
  const tombstone = expectedTombstoneV2(
    implementationCommitSha,
    manifest.sealManifestSha256,
  );
  platform.ensureDirectoryDurable(path.dirname(paths.manifestPath));
  platform.writeJsonCreateOnlyDurable(paths.manifestPath, manifest);
  platform.writeJsonCreateOnlyDurable(paths.tombstonePath, tombstone);
  requireCanonicalReadbackV2(paths.manifestPath, manifest);
  requireCanonicalReadbackV2(paths.tombstonePath, tombstone);
  return manifest;
}

function runtimePathsV2(repositoryRoot: string): RuntimePathsV2 {
  const platform =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_PLATFORM_V2;
  const gitCommonDirectory = platform.gitCommonDirectory(repositoryRoot);
  return Object.freeze({
    repositoryRoot,
    gitCommonDirectory,
    authorityPath: path.join(gitCommonDirectory, AUTHORITY_RELATIVE_SUFFIX),
    reservationPath: path.join(gitCommonDirectory, RESERVATION_RELATIVE_SUFFIX),
    journalPath: path.join(repositoryRoot, JOURNAL_RELATIVE_PATH),
    journalStagePath: path.join(repositoryRoot, JOURNAL_STAGE_RELATIVE_PATH),
    artifactPath: path.join(repositoryRoot, ARTIFACT_RELATIVE_PATH),
    manifestPath: path.join(repositoryRoot, MANIFEST_RELATIVE_PATH),
    tombstonePath: path.join(repositoryRoot, TOMBSTONE_RELATIVE_PATH),
  });
}

function expectedSealManifestPayloadV2(
  input: Readonly<{
    implementationCommitSha: string;
    changedImplementationBlobs: readonly PinnedBlobV2[];
    authorityPayload: AuthorityPayloadV2;
    authoritativeCloneRecordSha256: string;
  }>,
): MainWireNormalAdultPassiveEquilibriumSealManifestPayloadV2 {
  return deepFreezeEvidenceV2({
    sealManifestSchemaId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SEAL_MANIFEST_SCHEMA_V2,
    declarationId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_NUMERICAL_ADDENDUM_DECLARATION_V1,
    declarationCommitSha: DECLARATION_D_SHA,
    declarationDirectParentCommitSha: DECLARATION_D_PARENT_SHA,
    declarationTreeSha: DECLARATION_D_TREE_SHA,
    implementationCommitSha: input.implementationCommitSha,
    implementationDirectParentCommitSha: DECLARATION_D_SHA,
    changedImplementationBlobs: Object.freeze(
      input.changedImplementationBlobs.map((entry) =>
        deepFreezeEvidenceV2({
          path: entry.path,
          gitBlobSha1: entry.gitBlobSha1,
        }),
      ),
    ),
    inheritedDependencyBlobs: MANIFEST_INHERITED_DEPENDENCY_BLOBS,
    schurExportSeamBindingPayload:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_V1,
    schurExportSeamBindingSha256:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_SHA256_V1,
    authorityPayload: input.authorityPayload,
    authoritativeCloneRecordSha256: input.authoritativeCloneRecordSha256,
    manifestAndTombstoneOnlyInSealCommit: true as const,
    normalAdultTargetExecutedBeforeSeal: false as const,
  });
}

function expectedTombstoneV2(
  implementationCommitSha: string,
  sealManifestSha256: string,
): TombstoneV2 {
  return deepFreezeEvidenceV2({
    schemaId: MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_TOMBSTONE_SCHEMA_V2,
    declarationCommitSha: DECLARATION_D_SHA,
    implementationCommitSha,
    attemptId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ATTEMPT_V2,
    sealManifestSha256,
    status: "unexecuted" as const,
    sharedReferenceRootExecuted: false as const,
    frozenCasesExecuted: false as const,
    branchAuditExecuted: false as const,
    artifactCreated: false as const,
  });
}

function verifyInheritedDependencyBlobsV2(
  repositoryRoot: string,
  implementationCommitSha: string,
): void {
  const platform =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_PLATFORM_V2;
  for (const dependency of MANIFEST_INHERITED_DEPENDENCY_BLOBS) {
    if (
      platform.gitBlobSha(
        repositoryRoot,
        implementationCommitSha,
        dependency.path,
      ) !== dependency.gitBlobSha1
    )
      throw new Error(`inherited dependency blob mismatch: ${dependency.path}`);
  }
}

async function verifyCommitAAndSchurSeamBindingsV2(
  repositoryRoot: string,
  implementationCommitSha: string,
): Promise<void> {
  const platform =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_PLATFORM_V2;
  const binding =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_V1;
  const declarationDiff = [
    ...platform.gitDiffNames(
      repositoryRoot,
      DECLARATION_D_PARENT_SHA,
      DECLARATION_D_SHA,
    ),
  ].sort();
  const expectedDeclarationDiff = [
    "docs/scientific-runtime/INTEGRATED-MODEL-0020-passive-equilibrium-schur-export-seam.md",
    "docs/scientific-runtime/README.md",
  ].sort();
  if (
    canonicalJsonStringify(declarationDiff) !==
    canonicalJsonStringify(expectedDeclarationDiff)
  )
    throw new Error("parent-to-D documentation allowlist mismatch");
  const allowedDiff = [...A_ALLOWED_PATHS].sort();
  const observedDiff = [
    ...platform.gitDiffNames(
      repositoryRoot,
      DECLARATION_D_SHA,
      implementationCommitSha,
    ),
  ].sort();
  if (
    canonicalJsonStringify(observedDiff) !== canonicalJsonStringify(allowedDiff)
  )
    throw new Error("D-to-A path allowlist mismatch");
  const declarationDocumentPath = binding.documentPath;
  const readmePath = "docs/scientific-runtime/README.md";
  if (
    platform.gitBlobSha(
      repositoryRoot,
      DECLARATION_D_SHA,
      declarationDocumentPath,
    ) !== binding.declarationDocumentGitBlobSha1 ||
    platform.gitBlobSha(
      repositoryRoot,
      implementationCommitSha,
      declarationDocumentPath,
    ) !== binding.declarationDocumentGitBlobSha1 ||
    platform.gitBlobSha(repositoryRoot, DECLARATION_D_SHA, readmePath) !==
      platform.gitBlobSha(repositoryRoot, implementationCommitSha, readmePath)
  )
    throw new Error("D documentation blobs changed in A");
  const declarationBytes = platform.gitBlobBytes(
    repositoryRoot,
    binding.declarationDocumentGitBlobSha1,
  );
  if (
    platform.rawSha256Hex(declarationBytes) !==
    binding.declarationDocumentRawSha256
  )
    throw new Error("0020 declaration raw digest mismatch");
  if (
    platform.gitTreeSha(
      repositoryRoot,
      binding.historicalPointOwner.sourceCommitSha,
    ) !== binding.historicalPointOwner.sourceTreeSha ||
    platform.gitBlobSha(
      repositoryRoot,
      binding.historicalPointOwner.sourceCommitSha,
      binding.historicalPointOwner.path,
    ) !== binding.historicalPointOwner.gitBlobSha1 ||
    platform.gitBlobSha(
      repositoryRoot,
      DECLARATION_D_SHA,
      binding.historicalPointOwner.path,
    ) !== binding.historicalPointOwner.gitBlobSha1 ||
    platform.gitBlobSha(
      repositoryRoot,
      implementationCommitSha,
      binding.historicalPointOwner.path,
    ) !== binding.runtimePointOwner.gitBlobSha1
  )
    throw new Error("historical/D/A Schur source path binding mismatch");
  if (
    (await sha256CanonicalJsonHex(binding)) !==
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_SHA256_V1
  )
    throw new Error("complete 0020 seam payload digest mismatch");
  verifySchurExportSeamBytesV2(repositoryRoot);
}

function verifySchurExportSeamBytesV2(repositoryRoot: string): void {
  const platform =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_PLATFORM_V2;
  const binding =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_V1;
  const oldBytes = platform.gitBlobBytes(
    repositoryRoot,
    binding.historicalPointOwner.gitBlobSha1,
  );
  const newBytes = platform.gitBlobBytes(
    repositoryRoot,
    binding.runtimePointOwner.gitBlobSha1,
  );
  const inserted = new TextEncoder().encode(binding.transform.insertedAscii);
  const offset = binding.transform.zeroBasedInsertionOffset;
  const oldText = new TextDecoder().decode(oldBytes);
  const newText = new TextDecoder().decode(newBytes);
  const oldSignature = "function reducedFourChamberTangentV1(";
  const newSignature = "export function reducedFourChamberTangentV1(";
  const passed =
    oldBytes.length === binding.historicalPointOwner.byteSize &&
    newBytes.length === binding.runtimePointOwner.byteSize &&
    platform.rawSha256Hex(oldBytes) ===
      binding.historicalPointOwner.rawSha256 &&
    platform.rawSha256Hex(newBytes) === binding.runtimePointOwner.rawSha256 &&
    countOccurrencesV2(oldText, oldSignature) === 1 &&
    countOccurrencesV2(newText, newSignature) === 1 &&
    oldText.indexOf(oldSignature) === offset &&
    newText.indexOf(newSignature) === offset &&
    bytesEqualV2(oldBytes.slice(0, offset), newBytes.slice(0, offset)) &&
    bytesEqualV2(inserted, newBytes.slice(offset, offset + inserted.length)) &&
    bytesEqualV2(
      oldBytes.slice(offset),
      newBytes.slice(offset + inserted.length),
    );
  if (!passed) throw new Error("0020 Schur export seam byte audit failed");
}

function countOccurrencesV2(text: string, needle: string): number {
  let count = 0;
  let cursor = 0;
  while (true) {
    const found = text.indexOf(needle, cursor);
    if (found < 0) return count;
    count += 1;
    cursor = found + needle.length;
  }
}

function bytesEqualV2(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1)
    if (left[index] !== right[index]) return false;
  return true;
}

function requireCanonicalReadbackV2(
  absolutePath: string,
  expected: unknown,
): void {
  const platform =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_PLATFORM_V2;
  const observed = JSON.parse(platform.readUtf8(absolutePath)) as unknown;
  if (canonicalJsonStringify(observed) !== canonicalJsonStringify(expected))
    throw new Error(`canonical readback mismatch: ${absolutePath}`);
}

async function officialPreflightV2(): Promise<PreflightV2> {
  const platform =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_PLATFORM_V2;
  const repositoryRoot = platform.repositoryRoot();
  const paths = runtimePathsV2(repositoryRoot);
  if (
    !platform.exists(paths.manifestPath) ||
    !platform.exists(paths.tombstonePath)
  )
    throw new Error("seal manifest and unexecuted tombstone are required");
  if (platform.gitStatusPorcelain(repositoryRoot) !== "")
    throw new Error("official evidence requires a clean worktree");

  const manifest = JSON.parse(
    platform.readUtf8(paths.manifestPath),
  ) as MainWireNormalAdultPassiveEquilibriumSealManifestV2;
  assertSealManifestEnvelopeV2(manifest);
  const implementationCommitSha = manifest.payload.implementationCommitSha;
  const expectedAuthorityPayload = deepFreezeEvidenceV2({
    authoritySchemaId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_AUTHORITY_SCHEMA_V2,
    authoritativeCloneId:
      manifest.payload.authorityPayload.authoritativeCloneId,
    declarationId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_NUMERICAL_ADDENDUM_DECLARATION_V1,
    attemptId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ATTEMPT_V2,
    attemptSchemaId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ATTEMPT_SCHEMA_V2,
    reservationSchemaId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_RESERVATION_SCHEMA_V2,
    implementationCommitSha,
    authorityRelativeSuffix: AUTHORITY_RELATIVE_SUFFIX,
  });
  if (!/^[0-9a-f]{32}$/.test(expectedAuthorityPayload.authoritativeCloneId))
    throw new Error("manifest authoritative clone ID invalid");
  const expectedChangedImplementationBlobs = Object.freeze(
    A_ALLOWED_PATHS.map((pinnedPath) =>
      deepFreezeEvidenceV2({
        path: pinnedPath,
        gitBlobSha1: platform.gitBlobSha(
          repositoryRoot,
          implementationCommitSha,
          pinnedPath,
        ),
      }),
    ),
  );
  verifyInheritedDependencyBlobsV2(repositoryRoot, implementationCommitSha);
  const expectedManifestPayload = expectedSealManifestPayloadV2({
    implementationCommitSha,
    changedImplementationBlobs: expectedChangedImplementationBlobs,
    authorityPayload: expectedAuthorityPayload,
    authoritativeCloneRecordSha256: await sha256CanonicalJsonHex(
      expectedAuthorityPayload,
    ),
  });
  const expectedManifest = deepFreezeEvidenceV2({
    schemaId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SEAL_MANIFEST_SCHEMA_V2,
    payload: expectedManifestPayload,
    sealManifestSha256: await sha256CanonicalJsonHex(expectedManifestPayload),
  });
  if (
    canonicalJsonStringify(manifest) !==
    canonicalJsonStringify(expectedManifest)
  )
    throw new Error("seal manifest closed canonical payload mismatch");
  const observedSealCommitSha = platform.gitHeadSha(repositoryRoot);
  if (
    platform.gitParentSha(repositoryRoot, observedSealCommitSha) !==
    manifest.payload.implementationCommitSha
  )
    throw new Error("seal commit must directly descend from manifest A");
  if (
    platform.gitParentSha(
      repositoryRoot,
      manifest.payload.implementationCommitSha,
    ) !== DECLARATION_D_SHA ||
    platform.gitParentSha(repositoryRoot, DECLARATION_D_SHA) !==
      DECLARATION_D_PARENT_SHA ||
    platform.gitTreeSha(repositoryRoot, DECLARATION_D_SHA) !==
      DECLARATION_D_TREE_SHA
  )
    throw new Error("D/A/B parent chain mismatch");
  const diffNames = [
    ...platform.gitDiffNames(
      repositoryRoot,
      manifest.payload.implementationCommitSha,
      observedSealCommitSha,
    ),
  ].sort();
  const expectedDiffNames = [
    MANIFEST_RELATIVE_PATH,
    TOMBSTONE_RELATIVE_PATH,
  ].sort();
  if (
    canonicalJsonStringify(diffNames) !==
    canonicalJsonStringify(expectedDiffNames)
  )
    throw new Error("seal commit must change only manifest and tombstone");
  for (const pinned of [
    ...manifest.payload.changedImplementationBlobs,
    ...manifest.payload.inheritedDependencyBlobs,
  ]) {
    if (
      platform.gitBlobSha(
        repositoryRoot,
        observedSealCommitSha,
        pinned.path,
      ) !== pinned.gitBlobSha1
    )
      throw new Error(`pinned B dependency blob mismatch: ${pinned.path}`);
  }
  if (
    canonicalJsonStringify(
      manifest.payload.changedImplementationBlobs.map((entry) => entry.path),
    ) !== canonicalJsonStringify(A_ALLOWED_PATHS)
  )
    throw new Error("manifest changed-path set or order mismatch");
  await verifyCommitAAndSchurSeamBindingsV2(
    repositoryRoot,
    manifest.payload.implementationCommitSha,
  );

  const authorityPayload = JSON.parse(
    platform.readUtf8(paths.authorityPath),
  ) as AuthorityPayloadV2;
  if (
    canonicalJsonStringify(authorityPayload) !==
      canonicalJsonStringify(manifest.payload.authorityPayload) ||
    (await sha256CanonicalJsonHex(authorityPayload)) !==
      manifest.payload.authoritativeCloneRecordSha256
  )
    throw new Error("authoritative clone record mismatch");
  const tombstone = JSON.parse(
    platform.readUtf8(paths.tombstonePath),
  ) as TombstoneV2;
  if (
    canonicalJsonStringify(tombstone) !==
    canonicalJsonStringify(
      expectedTombstoneV2(
        manifest.payload.implementationCommitSha,
        manifest.sealManifestSha256,
      ),
    )
  )
    throw new Error("unexecuted tombstone mismatch");
  const expectedCombinedProtocol = deepFreezeEvidenceV2({
    pointSolverPolicy:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2,
    unchangedBranchPolicy:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1,
  });
  if (
    (await sha256CanonicalJsonHex(
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2,
    )) !== FROZEN_POINT_SOLVER_POLICY_V2_SHA256 ||
    (await sha256CanonicalJsonHex(expectedCombinedProtocol)) !==
      FROZEN_POINT_SOLVER_BRANCH_PROTOCOL_V2_SHA256
  )
    throw new Error("frozen V2 policy or combined protocol digest mismatch");
  for (const consumedPath of [
    paths.reservationPath,
    paths.journalPath,
    paths.journalStagePath,
    paths.artifactPath,
  ]) {
    if (platform.exists(consumedPath))
      throw new Error(`attempt path already exists: ${consumedPath}`);
  }
  return deepFreezeEvidenceV2({
    paths,
    manifest,
    observedSealCommitSha,
    authorityPayload,
    authoritativeCloneRecordSha256:
      manifest.payload.authoritativeCloneRecordSha256,
  });
}

function assertSealManifestEnvelopeV2(
  manifest: MainWireNormalAdultPassiveEquilibriumSealManifestV2,
): void {
  if (
    manifest === null ||
    typeof manifest !== "object" ||
    manifest.schemaId !==
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SEAL_MANIFEST_SCHEMA_V2 ||
    manifest.payload === null ||
    typeof manifest.payload !== "object" ||
    manifest.payload.authorityPayload === null ||
    typeof manifest.payload.authorityPayload !== "object" ||
    !/^[0-9a-f]{40}$/.test(manifest.payload.implementationCommitSha) ||
    !/^[0-9a-f]{64}$/.test(manifest.sealManifestSha256)
  )
    throw new Error("invalid V2 seal manifest");
}

async function reserveAttemptAndMintContextV2(
  preflight: PreflightV2,
): Promise<OfficialContextV2> {
  const platform =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_PLATFORM_V2;
  const reservationPayload = deepFreezeEvidenceV2({
    reservationSchemaId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_RESERVATION_SCHEMA_V2,
    declarationId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_NUMERICAL_ADDENDUM_DECLARATION_V1,
    attemptId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ATTEMPT_V2,
    attemptSchemaId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ATTEMPT_SCHEMA_V2,
    evidenceSchemaId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_EVIDENCE_SCHEMA_V2,
    evidenceAuditorId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_EVIDENCE_AUDITOR_V2_ID,
    auditorReportSchemaId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_AUDITOR_REPORT_V2,
    journalSchemaId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_JOURNAL_SCHEMA_V2,
    authoritySchemaId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_AUTHORITY_SCHEMA_V2,
    sealManifestSchemaId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SEAL_MANIFEST_SCHEMA_V2,
    tombstoneSchemaId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_TOMBSTONE_SCHEMA_V2,
    declarationCommitSha: DECLARATION_D_SHA,
    implementationCommitSha: preflight.manifest.payload.implementationCommitSha,
    observedSealCommitSha: preflight.observedSealCommitSha,
    sealManifestSha256: preflight.manifest.sealManifestSha256,
    authorityPayload: preflight.authorityPayload,
    authoritativeCloneRecordSha256: preflight.authoritativeCloneRecordSha256,
    authoritativeCloneId: preflight.authorityPayload.authoritativeCloneId,
    authorityRelativeSuffix: AUTHORITY_RELATIVE_SUFFIX,
    reservationRelativeSuffix: RESERVATION_RELATIVE_SUFFIX,
  });
  const commonDirReservationSha256 =
    await sha256CanonicalJsonHex(reservationPayload);
  platform.writeJsonCreateOnlyDurable(
    preflight.paths.reservationPath,
    reservationPayload,
  );
  requireCanonicalReadbackV2(
    preflight.paths.reservationPath,
    reservationPayload,
  );
  const pointOwner =
    await createMainWireNormalAdultPassiveEquilibriumPointOwnerV2();
  assertMainWireNormalAdultPassiveEquilibriumPointOwnerV2(pointOwner);
  const reservedJournal = await journalEnvelopeV2({
    state: "reserved",
    preflight,
    reservationPayload,
    commonDirReservationSha256,
    referenceRootOutcome: null,
    executions: [],
    terminalStatus: null,
  });
  platform.writeJsonCreateOnlyDurable(
    preflight.paths.journalPath,
    reservedJournal,
  );
  requireCanonicalReadbackV2(preflight.paths.journalPath, reservedJournal);
  const context = deepFreezeEvidenceV2({
    preflight,
    reservationPayload,
    commonDirReservationSha256,
    pointOwner,
    reservedJournal,
  });
  officialContextRegistryV2.add(context);
  return context;
}

function assertOfficialContextV2(context: OfficialContextV2): void {
  if (!officialContextRegistryV2.has(context))
    throw new Error("official V2 context was not minted after reservation");
  assertMainWireNormalAdultPassiveEquilibriumPointOwnerV2(context.pointOwner);
}

async function runOfficialStageKernelEvidenceV2(
  chamberVolumesM3: ChamberVolumesV2,
  stageIndex: number,
  initialCoordinates: MainWirePassiveEquilibriumInternalCoordinatesV2,
): Promise<OfficialStageKernelEvidenceV2> {
  const stageResult = solveMainWirePassiveEquilibriumStageKernelV2({
    stageIndex,
    initialCoordinates,
    evaluateCandidate: (coordinates) =>
      evaluateMainWireNormalAdultPassiveEquilibriumCanonicalStageCandidateV2(
        chamberVolumesM3,
        coordinates,
      ),
  });
  const solverPolicySha256 = await sha256CanonicalJsonHex(
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2,
  );
  const kernelEvidence = deepFreezeEvidenceV2({
    qualification: "neutral-unqualified-kernel-evidence" as const,
    solverPolicyId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2_ID,
    solverPolicySha256,
    iterationEvidenceSha256: await Promise.all(
      stageResult.iterations.map((iteration) =>
        sha256CanonicalJsonHex(iteration),
      ),
    ),
    stageResult,
    stageResultSha256: await sha256CanonicalJsonHex(stageResult),
  });
  return deepFreezeEvidenceV2({
    chamberVolumesM3: freezeVolumesV2(chamberVolumesM3),
    kernelEvidence,
  });
}

async function auditOfficialStageKernelEvidenceV2(
  stageKernelEvidence: OfficialStageKernelEvidenceV2,
): Promise<MainWireNormalAdultPassiveEquilibriumOfficialStageEvidenceV2> {
  const kernelAudit = await auditMainWirePassiveEquilibriumStageKernelV2(
    stageKernelEvidence.kernelEvidence,
  );
  return deepFreezeEvidenceV2({
    chamberVolumesM3: stageKernelEvidence.chamberVolumesM3,
    kernelEvidence: stageKernelEvidence.kernelEvidence,
    kernelAudit,
  });
}

async function runOfficialStageV2(
  chamberVolumesM3: ChamberVolumesV2,
  stageIndex: number,
  initialCoordinates: MainWirePassiveEquilibriumInternalCoordinatesV2,
): Promise<MainWireNormalAdultPassiveEquilibriumOfficialStageEvidenceV2> {
  return auditOfficialStageKernelEvidenceV2(
    await runOfficialStageKernelEvidenceV2(
      chamberVolumesM3,
      stageIndex,
      initialCoordinates,
    ),
  );
}

type ReferenceRootInputEvidenceV2 = Omit<
  AdmittedReferenceRootV2["admittedReferenceRootPayload"],
  | "stageKernelEvidence"
  | "terminalProjection"
  | "stationarityPassed"
  | "strictStabilityPassed"
>;

type ReferenceRootAttemptEvidenceV2 = Readonly<{
  rootInputEvidence: ReferenceRootInputEvidenceV2;
}> &
  (
    | Readonly<{
        status: "scientific-success";
        initialCoordinates: MainWirePassiveEquilibriumInternalCoordinatesV2;
        stageKernelEvidence: OfficialStageKernelEvidenceV2;
        kernelAudit: MainWirePassiveEquilibriumStageKernelAuditorEnvelopeV2;
        terminalProjection: MainWireNormalAdultPassiveEquilibriumUnbrandedTerminalProjectionV2;
        failureReason: null;
        exception: null;
      }>
    | Readonly<{
        status: "scientific-failure";
        failurePhase: "stage-solve" | "terminal-schur";
        initialCoordinates: MainWirePassiveEquilibriumInternalCoordinatesV2;
        stageKernelEvidence: OfficialStageKernelEvidenceV2;
        kernelAudit: MainWirePassiveEquilibriumStageKernelAuditorEnvelopeV2;
        terminalProjection: null;
        failureReason: string;
        exception: null;
      }>
    | Readonly<{
        status: "solver-execution-failed";
        initialCoordinates: MainWirePassiveEquilibriumInternalCoordinatesV2;
        stageKernelEvidence: null;
        kernelAudit: null;
        terminalProjection: null;
        failureReason: "reference-root-solver-execution-failed";
        exception: SanitizedExceptionV2;
      }>
    | Readonly<{
        status: "kernel-auditor-execution-failed";
        initialCoordinates: MainWirePassiveEquilibriumInternalCoordinatesV2;
        stageKernelEvidence: OfficialStageKernelEvidenceV2;
        kernelAudit: null;
        terminalProjection: null;
        failureReason: "reference-root-kernel-auditor-execution-failed";
        exception: SanitizedExceptionV2;
      }>
    | Readonly<{
        status: "evidence-audit-failed";
        initialCoordinates: MainWirePassiveEquilibriumInternalCoordinatesV2;
        stageKernelEvidence: OfficialStageKernelEvidenceV2;
        kernelAudit: MainWirePassiveEquilibriumStageKernelAuditorEnvelopeV2;
        terminalProjection: null;
        failureReason: "reference-root-kernel-evidence-audit-failed";
        exception: null;
      }>
    | Readonly<{
        status: "terminal-projection-execution-failed";
        initialCoordinates: MainWirePassiveEquilibriumInternalCoordinatesV2;
        stageKernelEvidence: OfficialStageKernelEvidenceV2;
        kernelAudit: MainWirePassiveEquilibriumStageKernelAuditorEnvelopeV2;
        terminalProjection: null;
        failureReason: "reference-root-terminal-projection-execution-failed";
        exception: SanitizedExceptionV2;
      }>
  );

type RootAuditorReportCommonV2 = Readonly<{
  scientificStatus: ReferenceRootAttemptEvidenceV2["status"];
  replayedKernelAuditorReport: MainWirePassiveEquilibriumStageKernelAuditorEnvelopeV2 | null;
  replayedKernelAuditorReportSha256: string | null;
  retainedKernelAuditorReportBindingPassed: boolean;
  stageKernelIndependentReplayPassed: boolean;
  scientificOutcomeReplayPassed: boolean;
  terminalProjectionReplayPassed: boolean;
  terminalStationarityReplayPassed: boolean;
  terminalStrictStabilityReplayPassed: boolean;
  solverPolicyReplayPassed: boolean;
  branchPolicyReplayPassed: boolean;
  combinedProtocolReplayPassed: boolean;
  passiveMaterialGeometryReplayPassed: boolean;
  surfaceVerificationReplayPassed: boolean;
  schurExportSeamReplayPassed: boolean;
  manifestReservationReplayPassed: boolean;
  referenceVolumeBitsReplayPassed: boolean;
  initialCoordinateBitsReplayPassed: boolean;
  stageKernelPayloadBindingPassed: boolean;
  terminalProjectionPayloadBindingPassed: boolean;
  rootPayloadCanonicalHashPassed: boolean;
  fullProvenanceReplayPassed: boolean;
  stageZeroPayloadReplayPassed: boolean;
  firstMismatchId: string | null;
  admittedReferenceRootSha256: string | null;
  kernelAuditReportSha256: string | null;
}>;

type RootAuditorReportV2 = RootAuditorReportCommonV2 &
  Readonly<{ status: "passed" } | { status: "failed" }>;

function referenceRootInputEvidenceV2(
  context: OfficialContextV2,
  referenceVolumes: ChamberVolumesV2,
  initialCoordinates: MainWirePassiveEquilibriumInternalCoordinatesV2,
): ReferenceRootInputEvidenceV2 {
  return deepFreezeEvidenceV2({
    ownerId: MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V2_ID,
    solverPolicyId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2_ID,
    solverPolicyPayload:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2,
    solverPolicySha256: FROZEN_POINT_SOLVER_POLICY_V2_SHA256,
    unchangedBranchPolicyPayload:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1,
    pointSolverBranchProtocolPayload:
      context.pointOwner.pointSolverBranchProtocolPayload,
    pointSolverBranchProtocolSha256:
      context.pointOwner.pointSolverBranchProtocolSha256,
    passiveMaterialGeometryBindingPayload:
      context.pointOwner.v1Provenance.passiveMaterialGeometryBindingPayload,
    passiveMaterialGeometryBindingSha256:
      context.pointOwner.v1Provenance.passiveMaterialGeometryBindingSha256,
    surfaceVerificationProtocolPayload:
      context.pointOwner.v1Provenance.surfaceVerificationProtocolPayload,
    surfaceVerificationProtocolSha256:
      context.pointOwner.v1Provenance.surfaceVerificationProtocolSha256,
    schurExportSeamBindingPayload:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_V1,
    schurExportSeamBindingSha256:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_SHA256_V1,
    manifestPayload: context.preflight.manifest.payload,
    reservationPayload: context.reservationPayload,
    commonDirReservationSha256: context.commonDirReservationSha256,
    referenceVolumesM3: referenceVolumes,
    referenceVolumeBits: wrapVolumesEvidenceV2(referenceVolumes),
    initialCoordinates: wrapCoordinatesEvidenceV2(initialCoordinates),
  });
}

async function solveAndSealSharedReferenceRootV2(
  context: OfficialContextV2,
): Promise<
  Readonly<{
    outcome: MainWireNormalAdultPassiveEquilibriumReferenceRootOutcomeV2;
    sealedRoot: SealedReferenceRootV2 | null;
  }>
> {
  assertOfficialContextV2(context);
  const referenceVolumes = freezeVolumesV2(
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1,
  );
  const initialCoordinates = deepFreezeEvidenceV2({
    septalMidwallCapVolumeM3:
      NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg.loadedCoordinates
        .septalMidwallCapVolumeM3,
    junctionRadiusM:
      NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg.loadedCoordinates
        .junctionRadiusM,
  });
  const rootInputEvidence = referenceRootInputEvidenceV2(
    context,
    referenceVolumes,
    initialCoordinates,
  );
  let stageKernelEvidence: OfficialStageKernelEvidenceV2;
  try {
    stageKernelEvidence = await runOfficialStageKernelEvidenceV2(
      referenceVolumes,
      0,
      initialCoordinates,
    );
  } catch (error) {
    const attempt = deepFreezeEvidenceV2({
      rootInputEvidence,
      status: "solver-execution-failed" as const,
      initialCoordinates,
      stageKernelEvidence: null,
      kernelAudit: null,
      terminalProjection: null,
      failureReason: "reference-root-solver-execution-failed" as const,
      exception: sanitizedExceptionEvidenceV2(error),
    });
    return deepFreezeEvidenceV2({
      outcome: createNotAdmittedReferenceRootV2(
        attempt,
        attempt.failureReason,
        {
          status: "not-run",
          referenceRootAuditorReport: null,
          referenceRootAuditorReportSha256: null,
          auditorNotRunReason: attempt.failureReason,
        },
      ),
      sealedRoot: null,
    });
  }

  let kernelAudit: MainWirePassiveEquilibriumStageKernelAuditorEnvelopeV2;
  try {
    kernelAudit = await auditMainWirePassiveEquilibriumStageKernelV2(
      stageKernelEvidence.kernelEvidence,
    );
  } catch (error) {
    const attempt = deepFreezeEvidenceV2({
      rootInputEvidence,
      status: "kernel-auditor-execution-failed" as const,
      initialCoordinates,
      stageKernelEvidence,
      kernelAudit: null,
      terminalProjection: null,
      failureReason: "reference-root-kernel-auditor-execution-failed" as const,
      exception: sanitizedExceptionEvidenceV2(error),
    });
    return deepFreezeEvidenceV2({
      outcome: createNotAdmittedReferenceRootV2(
        attempt,
        attempt.failureReason,
        {
          status: "execution-failed",
          referenceRootAuditorReport: null,
          referenceRootAuditorReportSha256: null,
          auditorNotRunReason: null,
          auditorExecutionFailure: attempt.exception,
        },
      ),
      sealedRoot: null,
    });
  }

  let attempt: ReferenceRootAttemptEvidenceV2;
  if (kernelAudit.report.auditStatus !== "passed") {
    attempt = deepFreezeEvidenceV2({
      rootInputEvidence,
      status: "evidence-audit-failed" as const,
      initialCoordinates,
      stageKernelEvidence,
      kernelAudit,
      terminalProjection: null,
      failureReason: "reference-root-kernel-evidence-audit-failed" as const,
      exception: null,
    });
  } else if (
    stageKernelEvidence.kernelEvidence.stageResult.status === "failed"
  ) {
    attempt = deepFreezeEvidenceV2({
      rootInputEvidence,
      status: "scientific-failure" as const,
      failurePhase: "stage-solve" as const,
      initialCoordinates,
      stageKernelEvidence,
      kernelAudit,
      terminalProjection: null,
      failureReason:
        stageKernelEvidence.kernelEvidence.stageResult.failureReason,
      exception: null,
    });
  } else {
    const terminalCoordinates = unwrapCandidateCoordinatesV2(
      stageKernelEvidence.kernelEvidence.stageResult.terminalCandidate,
    );
    let terminalProjection: MainWireNormalAdultPassiveEquilibriumUnbrandedTerminalProjectionV2 | null;
    try {
      terminalProjection =
        evaluateMainWireNormalAdultPassiveEquilibriumCanonicalTerminalProjectionV2(
          referenceVolumes,
          terminalCoordinates,
        );
    } catch (error) {
      attempt = deepFreezeEvidenceV2({
        rootInputEvidence,
        status: "terminal-projection-execution-failed" as const,
        initialCoordinates,
        stageKernelEvidence,
        kernelAudit,
        terminalProjection: null,
        failureReason:
          "reference-root-terminal-projection-execution-failed" as const,
        exception: sanitizedExceptionEvidenceV2(error),
      });
      return deepFreezeEvidenceV2({
        outcome: createNotAdmittedReferenceRootV2(
          attempt,
          attempt.failureReason,
          {
            status: "not-run",
            referenceRootAuditorReport: null,
            referenceRootAuditorReportSha256: null,
            auditorNotRunReason: attempt.failureReason,
          },
        ),
        sealedRoot: null,
      });
    }
    attempt =
      terminalProjection === null
        ? deepFreezeEvidenceV2({
            rootInputEvidence,
            status: "scientific-failure" as const,
            failurePhase: "terminal-schur" as const,
            initialCoordinates,
            stageKernelEvidence,
            kernelAudit,
            terminalProjection: null,
            failureReason: "qualified-terminal-schur-failed",
            exception: null,
          })
        : deepFreezeEvidenceV2({
            rootInputEvidence,
            status: "scientific-success" as const,
            initialCoordinates,
            stageKernelEvidence,
            kernelAudit,
            terminalProjection,
            failureReason: null,
            exception: null,
          });
  }

  if (attempt.status !== "scientific-success")
    return finishUnadmittedAuditedReferenceRootV2(
      context,
      referenceVolumes,
      attempt,
    );

  let payload: AdmittedReferenceRootV2["admittedReferenceRootPayload"];
  let stageZeroRootSha256: string;
  try {
    payload = deepFreezeEvidenceV2({
      ownerId: MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V2_ID,
      solverPolicyId:
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2_ID,
      solverPolicyPayload:
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2,
      solverPolicySha256: await sha256CanonicalJsonHex(
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2,
      ),
      unchangedBranchPolicyPayload:
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1,
      pointSolverBranchProtocolPayload:
        context.pointOwner.pointSolverBranchProtocolPayload,
      pointSolverBranchProtocolSha256:
        context.pointOwner.pointSolverBranchProtocolSha256,
      passiveMaterialGeometryBindingPayload:
        context.pointOwner.v1Provenance.passiveMaterialGeometryBindingPayload,
      passiveMaterialGeometryBindingSha256:
        context.pointOwner.v1Provenance.passiveMaterialGeometryBindingSha256,
      surfaceVerificationProtocolPayload:
        context.pointOwner.v1Provenance.surfaceVerificationProtocolPayload,
      surfaceVerificationProtocolSha256:
        context.pointOwner.v1Provenance.surfaceVerificationProtocolSha256,
      schurExportSeamBindingPayload:
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_V1,
      schurExportSeamBindingSha256:
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_SHA256_V1,
      manifestPayload: context.preflight.manifest.payload,
      reservationPayload: context.reservationPayload,
      commonDirReservationSha256: context.commonDirReservationSha256,
      referenceVolumesM3: referenceVolumes,
      referenceVolumeBits: wrapVolumesEvidenceV2(referenceVolumes),
      initialCoordinates: wrapCoordinatesEvidenceV2(initialCoordinates),
      stageKernelEvidence: attempt.stageKernelEvidence,
      terminalProjection: attempt.terminalProjection,
      stationarityPassed: true as const,
      strictStabilityPassed: true as const,
    });
    stageZeroRootSha256 = await sha256CanonicalJsonHex(payload);
  } catch {
    return deepFreezeEvidenceV2({
      outcome: createNotAdmittedReferenceRootV2(
        attempt,
        "reference-root-pre-audit-sealing-failed",
        {
          status: "not-run",
          referenceRootAuditorReport: null,
          referenceRootAuditorReportSha256: null,
          auditorNotRunReason: "reference-root-pre-audit-sealing-failed",
        },
      ),
      sealedRoot: null,
    });
  }
  let audit: RootAuditorReportV2;
  let auditSha256: string;
  try {
    audit = await auditReferenceRootAttemptV2(
      context,
      referenceVolumes,
      attempt,
      payload,
      stageZeroRootSha256,
    );
    auditSha256 = await sha256CanonicalJsonHex(audit);
  } catch (error) {
    return deepFreezeEvidenceV2({
      outcome: createNotAdmittedReferenceRootV2(
        attempt,
        "reference-root-independent-auditor-execution-failed",
        {
          status: "execution-failed",
          referenceRootAuditorReport: null,
          referenceRootAuditorReportSha256: null,
          auditorNotRunReason: null,
          auditorExecutionFailure: sanitizedExceptionEvidenceV2(error),
        },
      ),
      sealedRoot: null,
    });
  }
  if (audit.status !== "passed") {
    return deepFreezeEvidenceV2({
      outcome: createNotAdmittedReferenceRootV2(
        attempt,
        "reference-root-independent-audit-failed",
        {
          status: "failed" as const,
          referenceRootAuditorReport: audit,
          referenceRootAuditorReportSha256: auditSha256,
          auditorNotRunReason: null,
          auditorExecutionFailure: null,
        },
      ),
      sealedRoot: null,
    });
  }
  try {
    const outcome = deepFreezeEvidenceV2({
      status: "admitted" as const,
      admittedReferenceRootPayload: payload,
      admittedReferenceRootSha256: stageZeroRootSha256,
      rootFailureReason: null,
      referenceRootAuditorReport: audit,
      referenceRootAuditorReportSha256: auditSha256,
    });
    const sealedRoot = deepFreezeEvidenceV2({
      outcome,
      terminalCoordinates: unwrapCandidateCoordinatesV2(
        attempt.stageKernelEvidence.kernelEvidence.stageResult
          .terminalCandidate,
      ),
      stageZeroEvidence: deepFreezeEvidenceV2({
        chamberVolumesM3: attempt.stageKernelEvidence.chamberVolumesM3,
        kernelEvidence: attempt.stageKernelEvidence.kernelEvidence,
        kernelAudit: attempt.kernelAudit,
      }),
    });
    sealedReferenceRootRegistryV2.add(sealedRoot);
    assertSealedReferenceRootV2(sealedRoot);
    return deepFreezeEvidenceV2({ outcome, sealedRoot });
  } catch {
    return deepFreezeEvidenceV2({
      outcome: createNotAdmittedReferenceRootV2(
        attempt,
        "reference-root-sealing-failed",
        {
          status: "passed-but-sealing-failed",
          referenceRootAuditorReport: audit,
          referenceRootAuditorReportSha256: auditSha256,
          auditorNotRunReason: null,
          auditorExecutionFailure: null,
        },
      ),
      sealedRoot: null,
    });
  }
}

async function finishUnadmittedAuditedReferenceRootV2(
  context: OfficialContextV2,
  referenceVolumes: ChamberVolumesV2,
  attempt: Exclude<
    ReferenceRootAttemptEvidenceV2,
    Readonly<{ status: "scientific-success" }>
  >,
): Promise<
  Readonly<{
    outcome: NotAdmittedReferenceRootV2;
    sealedRoot: null;
  }>
> {
  let audit: RootAuditorReportV2;
  try {
    audit = await auditReferenceRootAttemptV2(
      context,
      referenceVolumes,
      attempt,
      null,
      null,
    );
  } catch (error) {
    return deepFreezeEvidenceV2({
      outcome: createNotAdmittedReferenceRootV2(
        attempt,
        "reference-root-independent-auditor-execution-failed",
        {
          status: "execution-failed",
          referenceRootAuditorReport: null,
          referenceRootAuditorReportSha256: null,
          auditorNotRunReason: null,
          auditorExecutionFailure: sanitizedExceptionEvidenceV2(error),
        },
      ),
      sealedRoot: null,
    });
  }
  const reportSha256 = await sha256CanonicalJsonHex(audit);
  if (audit.status === "failed") {
    return deepFreezeEvidenceV2({
      outcome: createNotAdmittedReferenceRootV2(
        attempt,
        attempt.status === "evidence-audit-failed"
          ? attempt.failureReason
          : "reference-root-independent-audit-failed",
        {
          status: "failed",
          referenceRootAuditorReport: audit,
          referenceRootAuditorReportSha256: reportSha256,
          auditorNotRunReason: null,
          auditorExecutionFailure: null,
        },
      ),
      sealedRoot: null,
    });
  }
  return deepFreezeEvidenceV2({
    outcome: createNotAdmittedReferenceRootV2(attempt, attempt.failureReason, {
      status: "passed-but-scientific-failure",
      referenceRootAuditorReport: audit,
      referenceRootAuditorReportSha256: reportSha256,
      auditorNotRunReason: null,
      auditorExecutionFailure: null,
    }),
    sealedRoot: null,
  });
}

function createNotAdmittedReferenceRootV2(
  attempt: ReferenceRootAttemptEvidenceV2,
  rootFailureReason: string,
  auditOutcome: RootAuditOutcomeV2,
): NotAdmittedReferenceRootV2 {
  const legal = (() => {
    if (auditOutcome.status === "not-run")
      return (
        (attempt.status === "solver-execution-failed" ||
          attempt.status === "terminal-projection-execution-failed" ||
          (attempt.status === "scientific-success" &&
            rootFailureReason === "reference-root-pre-audit-sealing-failed")) &&
        (attempt.status === "scientific-success" ||
          rootFailureReason === attempt.failureReason) &&
        auditOutcome.auditorNotRunReason === rootFailureReason
      );
    if (auditOutcome.status === "execution-failed")
      return (
        (attempt.status === "kernel-auditor-execution-failed" &&
          rootFailureReason === attempt.failureReason) ||
        ((attempt.status === "scientific-success" ||
          attempt.status === "scientific-failure" ||
          attempt.status === "evidence-audit-failed") &&
          rootFailureReason ===
            "reference-root-independent-auditor-execution-failed")
      );
    if (auditOutcome.status === "failed")
      return (
        auditOutcome.referenceRootAuditorReport.status === "failed" &&
        ((attempt.status === "evidence-audit-failed" &&
          rootFailureReason === attempt.failureReason) ||
          (attempt.status !== "evidence-audit-failed" &&
            rootFailureReason === "reference-root-independent-audit-failed"))
      );
    if (auditOutcome.status === "passed-but-scientific-failure")
      return (
        attempt.status === "scientific-failure" &&
        rootFailureReason === attempt.failureReason &&
        auditOutcome.referenceRootAuditorReport.status === "passed"
      );
    return (
      auditOutcome.status === "passed-but-sealing-failed" &&
      attempt.status === "scientific-success" &&
      rootFailureReason === "reference-root-sealing-failed" &&
      auditOutcome.referenceRootAuditorReport.status === "passed"
    );
  })();
  if (!legal) throw new Error("inconsistent closed reference-root outcome arm");
  return deepFreezeEvidenceV2({
    status: "not-admitted" as const,
    admittedReferenceRootPayload: null,
    admittedReferenceRootSha256: null,
    referenceRootAttemptEvidence: attempt,
    rootFailureReason,
    auditOutcome,
  });
}

async function auditReferenceRootAttemptV2(
  context: OfficialContextV2,
  referenceVolumes: ChamberVolumesV2,
  attempt: ReferenceRootAttemptEvidenceV2,
  payload: AdmittedReferenceRootV2["admittedReferenceRootPayload"] | null,
  payloadSha256: string | null,
): Promise<RootAuditorReportV2> {
  if (
    attempt.status === "solver-execution-failed" ||
    attempt.status === "kernel-auditor-execution-failed"
  )
    throw new Error("root auditor cannot run without completed kernel audit");
  const replayedKernelAuditorReport =
    await auditMainWirePassiveEquilibriumStageKernelV2(
      attempt.stageKernelEvidence.kernelEvidence,
    );
  const replayedKernelAuditorReportSha256 = await sha256CanonicalJsonHex(
    replayedKernelAuditorReport,
  );
  const retainedKernelAuditorReportBindingPassed =
    canonicalJsonStringify(replayedKernelAuditorReport) ===
      canonicalJsonStringify(attempt.kernelAudit) &&
    replayedKernelAuditorReport.reportSha256 ===
      (await sha256CanonicalJsonHex(replayedKernelAuditorReport.report)) &&
    attempt.kernelAudit.reportSha256 ===
      (await sha256CanonicalJsonHex(attempt.kernelAudit.report)) &&
    replayedKernelAuditorReportSha256 ===
      (await sha256CanonicalJsonHex(attempt.kernelAudit));
  const stageKernelIndependentReplayPassed =
    replayedKernelAuditorReport.report.auditStatus ===
    attempt.kernelAudit.report.auditStatus;
  let terminalProjectionReplayPassed = false;
  let scientificOutcomeReplayPassed = false;
  if (attempt.status === "scientific-success") {
    const terminalCoordinates = unwrapCandidateCoordinatesV2(
      attempt.stageKernelEvidence.kernelEvidence.stageResult.terminalCandidate,
    );
    const replay =
      evaluateMainWireNormalAdultPassiveEquilibriumCanonicalTerminalProjectionV2(
        referenceVolumes,
        terminalCoordinates,
      );
    terminalProjectionReplayPassed =
      replay !== null &&
      canonicalJsonStringify(replay) ===
        canonicalJsonStringify(attempt.terminalProjection);
    scientificOutcomeReplayPassed =
      attempt.stageKernelEvidence.kernelEvidence.stageResult.status ===
        "converged" &&
      replayedKernelAuditorReport.report.auditStatus === "passed" &&
      terminalProjectionReplayPassed;
  } else if (attempt.status === "scientific-failure") {
    if (attempt.failurePhase === "stage-solve") {
      scientificOutcomeReplayPassed =
        attempt.stageKernelEvidence.kernelEvidence.stageResult.status ===
          "failed" &&
        attempt.failureReason ===
          attempt.stageKernelEvidence.kernelEvidence.stageResult.failureReason;
      terminalProjectionReplayPassed = true;
    } else if (
      attempt.stageKernelEvidence.kernelEvidence.stageResult.status ===
      "converged"
    ) {
      const terminalCoordinates = unwrapCandidateCoordinatesV2(
        attempt.stageKernelEvidence.kernelEvidence.stageResult
          .terminalCandidate,
      );
      const replay =
        evaluateMainWireNormalAdultPassiveEquilibriumCanonicalTerminalProjectionV2(
          referenceVolumes,
          terminalCoordinates,
        );
      terminalProjectionReplayPassed = replay === null;
      scientificOutcomeReplayPassed = terminalProjectionReplayPassed;
    }
  } else if (attempt.status === "evidence-audit-failed") {
    scientificOutcomeReplayPassed =
      replayedKernelAuditorReport.report.auditStatus === "failed";
    terminalProjectionReplayPassed = true;
  }
  const expectedProvenance =
    await createMainWireNormalAdultPassiveEquilibriumPointProvenanceV1();
  const expectedCombinedProtocol = deepFreezeEvidenceV2({
    pointSolverPolicy:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2,
    unchangedBranchPolicy:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1,
  });
  const expectedInitialCoordinates = deepFreezeEvidenceV2({
    septalMidwallCapVolumeM3:
      NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg.loadedCoordinates
        .septalMidwallCapVolumeM3,
    junctionRadiusM:
      NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg.loadedCoordinates
        .junctionRadiusM,
  });
  const expectedRootInputEvidence: ReferenceRootInputEvidenceV2 =
    deepFreezeEvidenceV2({
      ownerId: MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_OWNER_V2_ID,
      solverPolicyId:
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2_ID,
      solverPolicyPayload:
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2,
      solverPolicySha256: FROZEN_POINT_SOLVER_POLICY_V2_SHA256,
      unchangedBranchPolicyPayload:
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1,
      pointSolverBranchProtocolPayload: expectedCombinedProtocol,
      pointSolverBranchProtocolSha256:
        FROZEN_POINT_SOLVER_BRANCH_PROTOCOL_V2_SHA256,
      passiveMaterialGeometryBindingPayload:
        expectedProvenance.passiveMaterialGeometryBindingPayload,
      passiveMaterialGeometryBindingSha256:
        expectedProvenance.passiveMaterialGeometryBindingSha256,
      surfaceVerificationProtocolPayload:
        expectedProvenance.surfaceVerificationProtocolPayload,
      surfaceVerificationProtocolSha256:
        expectedProvenance.surfaceVerificationProtocolSha256,
      schurExportSeamBindingPayload:
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_V1,
      schurExportSeamBindingSha256:
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_SHA256_V1,
      manifestPayload: context.preflight.manifest.payload,
      reservationPayload: context.reservationPayload,
      commonDirReservationSha256: context.commonDirReservationSha256,
      referenceVolumesM3: referenceVolumes,
      referenceVolumeBits: wrapVolumesEvidenceV2(referenceVolumes),
      initialCoordinates: wrapCoordinatesEvidenceV2(expectedInitialCoordinates),
    });
  const retainedRootInputReplayPassed =
    canonicalJsonStringify(attempt.rootInputEvidence) ===
    canonicalJsonStringify(expectedRootInputEvidence);
  const payloadRootInputReplayPassed = (() => {
    if (payload === null) return attempt.status !== "scientific-success";
    const {
      stageKernelEvidence: _stageKernelEvidence,
      terminalProjection: _terminalProjection,
      stationarityPassed: _stationarityPassed,
      strictStabilityPassed: _strictStabilityPassed,
      ...payloadRootInput
    } = payload;
    return (
      canonicalJsonStringify(payloadRootInput) ===
      canonicalJsonStringify(attempt.rootInputEvidence)
    );
  })();
  const retainedInput = attempt.rootInputEvidence;
  const solverPolicyReplayPassed =
    retainedRootInputReplayPassed &&
    retainedInput.solverPolicySha256 ===
      (await sha256CanonicalJsonHex(retainedInput.solverPolicyPayload)) &&
    payloadRootInputReplayPassed;
  const branchPolicyReplayPassed =
    retainedRootInputReplayPassed &&
    canonicalJsonStringify(retainedInput.unchangedBranchPolicyPayload) ===
      canonicalJsonStringify(
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1,
      ) &&
    payloadRootInputReplayPassed;
  const combinedProtocolReplayPassed =
    retainedRootInputReplayPassed &&
    canonicalJsonStringify(retainedInput.pointSolverBranchProtocolPayload) ===
      canonicalJsonStringify(expectedCombinedProtocol) &&
    retainedInput.pointSolverBranchProtocolSha256 ===
      FROZEN_POINT_SOLVER_BRANCH_PROTOCOL_V2_SHA256 &&
    retainedInput.pointSolverBranchProtocolSha256 ===
      (await sha256CanonicalJsonHex(expectedCombinedProtocol)) &&
    payloadRootInputReplayPassed;
  const passiveMaterialGeometryReplayPassed =
    retainedRootInputReplayPassed &&
    canonicalJsonStringify(
      retainedInput.passiveMaterialGeometryBindingPayload,
    ) ===
      canonicalJsonStringify(
        expectedProvenance.passiveMaterialGeometryBindingPayload,
      ) &&
    retainedInput.passiveMaterialGeometryBindingSha256 ===
      expectedProvenance.passiveMaterialGeometryBindingSha256 &&
    retainedInput.passiveMaterialGeometryBindingSha256 ===
      (await sha256CanonicalJsonHex(
        retainedInput.passiveMaterialGeometryBindingPayload,
      )) &&
    payloadRootInputReplayPassed;
  const surfaceVerificationReplayPassed =
    retainedRootInputReplayPassed &&
    canonicalJsonStringify(retainedInput.surfaceVerificationProtocolPayload) ===
      canonicalJsonStringify(
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SURFACE_VERIFICATION_POLICY_V1,
      ) &&
    retainedInput.surfaceVerificationProtocolSha256 ===
      expectedProvenance.surfaceVerificationProtocolSha256 &&
    retainedInput.surfaceVerificationProtocolSha256 ===
      (await sha256CanonicalJsonHex(
        retainedInput.surfaceVerificationProtocolPayload,
      )) &&
    payloadRootInputReplayPassed;
  const schurExportSeamReplayPassed =
    retainedRootInputReplayPassed &&
    canonicalJsonStringify(retainedInput.schurExportSeamBindingPayload) ===
      canonicalJsonStringify(
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_V1,
      ) &&
    retainedInput.schurExportSeamBindingSha256 ===
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_SHA256_V1 &&
    retainedInput.schurExportSeamBindingSha256 ===
      (await sha256CanonicalJsonHex(
        retainedInput.schurExportSeamBindingPayload,
      )) &&
    payloadRootInputReplayPassed;
  const manifestReservationReplayPassed =
    retainedRootInputReplayPassed &&
    canonicalJsonStringify(retainedInput.manifestPayload) ===
      canonicalJsonStringify(context.preflight.manifest.payload) &&
    canonicalJsonStringify(retainedInput.reservationPayload) ===
      canonicalJsonStringify(context.reservationPayload) &&
    retainedInput.commonDirReservationSha256 ===
      context.commonDirReservationSha256 &&
    retainedInput.commonDirReservationSha256 ===
      (await sha256CanonicalJsonHex(retainedInput.reservationPayload)) &&
    retainedInput.reservationPayload.sealManifestSha256 ===
      context.preflight.manifest.sealManifestSha256 &&
    retainedInput.reservationPayload.authoritativeCloneRecordSha256 ===
      context.preflight.authoritativeCloneRecordSha256 &&
    payloadRootInputReplayPassed;
  const referenceVolumeBitsReplayPassed =
    retainedRootInputReplayPassed &&
    canonicalJsonStringify(retainedInput.referenceVolumesM3) ===
      canonicalJsonStringify(referenceVolumes) &&
    canonicalJsonStringify(retainedInput.referenceVolumeBits) ===
      canonicalJsonStringify(wrapVolumesEvidenceV2(referenceVolumes)) &&
    (attempt.stageKernelEvidence === null ||
      canonicalJsonStringify(attempt.stageKernelEvidence.chamberVolumesM3) ===
        canonicalJsonStringify(referenceVolumes)) &&
    payloadRootInputReplayPassed;
  const initialCoordinateBitsReplayPassed =
    canonicalJsonStringify(attempt.initialCoordinates) ===
      canonicalJsonStringify(expectedInitialCoordinates) &&
    canonicalJsonStringify(retainedInput.initialCoordinates) ===
      canonicalJsonStringify(
        wrapCoordinatesEvidenceV2(expectedInitialCoordinates),
      ) &&
    payloadRootInputReplayPassed;
  const rootStageKernelStructureReplayPassed =
    attempt.stageKernelEvidence !== null &&
    (await auditOfficialStageKernelEvidenceStructureV2(
      attempt.stageKernelEvidence,
      referenceVolumes,
      0,
      expectedInitialCoordinates,
    ));
  const stageKernelPayloadBindingPassed =
    rootStageKernelStructureReplayPassed &&
    (payload === null
      ? attempt.status !== "scientific-success"
      : canonicalJsonStringify(payload.stageKernelEvidence) ===
        canonicalJsonStringify(attempt.stageKernelEvidence));
  const terminalProjectionPayloadBindingPassed =
    payload === null
      ? attempt.status !== "scientific-success"
      : attempt.status === "scientific-success" &&
        canonicalJsonStringify(payload.terminalProjection) ===
          canonicalJsonStringify(attempt.terminalProjection);
  const terminalEvidence =
    attempt.status === "scientific-success"
      ? attempt.terminalProjection.candidate.internalEquilibriumEvidence
      : null;
  const terminalStationarityReplayPassed =
    attempt.status !== "scientific-success" ||
    (terminalEvidence !== null &&
      Number.isFinite(terminalEvidence.scaledForceInfinityNorm) &&
      terminalEvidence.scaledForceInfinityNorm <=
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2.scaledForceInfinityTolerance &&
      (payload === null || payload.stationarityPassed));
  const terminalStrictStabilityReplayPassed =
    attempt.status !== "scientific-success" ||
    (terminalEvidence !== null &&
      terminalEvidence.strictLocalStabilityPassed === true &&
      terminalEvidence.scaledInternalHessianEigenvaluesAscending[0] >
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2.minimumScaledInternalHessianEigenvalueExclusive &&
      (payload === null || payload.strictStabilityPassed));
  const fullProvenanceReplayPassed =
    solverPolicyReplayPassed &&
    branchPolicyReplayPassed &&
    combinedProtocolReplayPassed &&
    passiveMaterialGeometryReplayPassed &&
    surfaceVerificationReplayPassed &&
    schurExportSeamReplayPassed &&
    manifestReservationReplayPassed &&
    referenceVolumeBitsReplayPassed &&
    initialCoordinateBitsReplayPassed;
  const rootPayloadCanonicalHashPassed =
    payload === null
      ? attempt.status !== "scientific-success"
      : payloadSha256 !== null &&
        (await sha256CanonicalJsonHex(payload)) === payloadSha256;
  const payloadReplayPassed =
    fullProvenanceReplayPassed &&
    stageKernelPayloadBindingPassed &&
    terminalProjectionPayloadBindingPassed &&
    terminalStationarityReplayPassed &&
    terminalStrictStabilityReplayPassed &&
    rootPayloadCanonicalHashPassed;
  const passed =
    retainedKernelAuditorReportBindingPassed &&
    stageKernelIndependentReplayPassed &&
    scientificOutcomeReplayPassed &&
    terminalProjectionReplayPassed &&
    payloadReplayPassed &&
    attempt.status !== "evidence-audit-failed" &&
    attempt.status !== "terminal-projection-execution-failed";
  const firstMismatchId = !retainedKernelAuditorReportBindingPassed
    ? "retained-kernel-auditor-report"
    : !stageKernelIndependentReplayPassed
      ? "stage-kernel-independent-replay"
      : !scientificOutcomeReplayPassed
        ? "scientific-outcome"
        : !terminalProjectionReplayPassed
          ? "terminal-projection"
          : !solverPolicyReplayPassed
            ? "solver-policy"
            : !branchPolicyReplayPassed
              ? "branch-policy"
              : !combinedProtocolReplayPassed
                ? "combined-protocol"
                : !passiveMaterialGeometryReplayPassed
                  ? "passive-material-geometry"
                  : !surfaceVerificationReplayPassed
                    ? "surface-verification"
                    : !schurExportSeamReplayPassed
                      ? "schur-export-seam"
                      : !manifestReservationReplayPassed
                        ? "manifest-reservation"
                        : !referenceVolumeBitsReplayPassed
                          ? "reference-volume-bits"
                          : !initialCoordinateBitsReplayPassed
                            ? "initial-coordinate-bits"
                            : !stageKernelPayloadBindingPassed
                              ? "stage-kernel-payload"
                              : !terminalProjectionPayloadBindingPassed
                                ? "terminal-projection-payload"
                                : !terminalStationarityReplayPassed
                                  ? "terminal-stationarity"
                                  : !terminalStrictStabilityReplayPassed
                                    ? "terminal-strict-stability"
                                    : !rootPayloadCanonicalHashPassed
                                      ? "root-payload-hash"
                                      : attempt.status ===
                                          "evidence-audit-failed"
                                        ? "kernel-audit-rejected"
                                        : attempt.status ===
                                            "terminal-projection-execution-failed"
                                          ? "terminal-projection-execution"
                                          : null;
  return deepFreezeEvidenceV2({
    status: passed ? ("passed" as const) : ("failed" as const),
    scientificStatus: attempt.status,
    replayedKernelAuditorReport,
    replayedKernelAuditorReportSha256,
    retainedKernelAuditorReportBindingPassed,
    stageKernelIndependentReplayPassed,
    scientificOutcomeReplayPassed,
    terminalProjectionReplayPassed,
    terminalStationarityReplayPassed,
    terminalStrictStabilityReplayPassed,
    solverPolicyReplayPassed,
    branchPolicyReplayPassed,
    combinedProtocolReplayPassed,
    passiveMaterialGeometryReplayPassed,
    surfaceVerificationReplayPassed,
    schurExportSeamReplayPassed,
    manifestReservationReplayPassed,
    referenceVolumeBitsReplayPassed,
    initialCoordinateBitsReplayPassed,
    stageKernelPayloadBindingPassed,
    terminalProjectionPayloadBindingPassed,
    rootPayloadCanonicalHashPassed,
    fullProvenanceReplayPassed,
    stageZeroPayloadReplayPassed: payloadReplayPassed,
    firstMismatchId,
    admittedReferenceRootSha256: payloadSha256,
    kernelAuditReportSha256: attempt.kernelAudit.reportSha256,
  });
}

async function solvePrimaryPointV2(
  context: OfficialContextV2,
  root: SealedReferenceRootV2,
  targetChamberVolumesM3: ChamberVolumesV2,
): Promise<OfficialPointCasePayloadV2> {
  assertOfficialContextV2(context);
  assertSealedReferenceRootV2(root);
  const stages: MainWireNormalAdultPassiveEquilibriumOfficialStageEvidenceV2[] =
    [];
  let coordinates = root.terminalCoordinates;
  const reference =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1;
  for (let stageIndex = 1; stageIndex <= 32; stageIndex += 1) {
    const fraction = stageIndex / 32;
    const chamberVolumesM3 = freezeVolumesV2({
      LA: targetChamberVolumesM3.LA,
      LV: reference.LV + fraction * (targetChamberVolumesM3.LV - reference.LV),
      RA: targetChamberVolumesM3.RA,
      RV: reference.RV + fraction * (targetChamberVolumesM3.RV - reference.RV),
    });
    let stageKernelEvidence: OfficialStageKernelEvidenceV2;
    try {
      stageKernelEvidence = await runOfficialStageKernelEvidenceV2(
        chamberVolumesM3,
        stageIndex,
        coordinates,
      );
    } catch (error) {
      return deepFreezeEvidenceV2({
        status: "not-equilibrated" as const,
        stageZeroRootSha256: root.outcome.admittedReferenceRootSha256,
        targetChamberVolumesM3,
        failurePhase: "stage-solver" as const,
        failureReason: "stage-solver-execution-failed",
        completedStages: Object.freeze([...stages]),
        failedStageKernelEvidence: null,
        failedStage: null,
        exception: sanitizedExceptionEvidenceV2(error),
      });
    }
    let stage: MainWireNormalAdultPassiveEquilibriumOfficialStageEvidenceV2;
    try {
      stage = await auditOfficialStageKernelEvidenceV2(stageKernelEvidence);
    } catch (error) {
      return deepFreezeEvidenceV2({
        status: "not-equilibrated" as const,
        stageZeroRootSha256: root.outcome.admittedReferenceRootSha256,
        targetChamberVolumesM3,
        failurePhase: "stage-auditor" as const,
        failureReason: "stage-evidence-auditor-execution-failed",
        completedStages: Object.freeze([...stages]),
        failedStageKernelEvidence: stageKernelEvidence,
        failedStage: null,
        exception: sanitizedExceptionEvidenceV2(error),
      });
    }
    if (stage.kernelAudit.report.auditStatus !== "passed") {
      return deepFreezeEvidenceV2({
        status: "not-equilibrated" as const,
        stageZeroRootSha256: root.outcome.admittedReferenceRootSha256,
        targetChamberVolumesM3,
        failurePhase: "stage-auditor" as const,
        failureReason: "evidence-audit-failed",
        completedStages: Object.freeze([...stages]),
        failedStageKernelEvidence: stageKernelEvidence,
        failedStage: stage,
        exception: null,
      });
    }
    if (stage.kernelEvidence.stageResult.status === "failed") {
      return deepFreezeEvidenceV2({
        status: "not-equilibrated" as const,
        stageZeroRootSha256: root.outcome.admittedReferenceRootSha256,
        targetChamberVolumesM3,
        failurePhase: "stage-scientific" as const,
        failureReason: stage.kernelEvidence.stageResult.failureReason,
        completedStages: Object.freeze([...stages]),
        failedStageKernelEvidence: stageKernelEvidence,
        failedStage: stage,
        exception: null,
      });
    }
    stages.push(stage);
    coordinates = unwrapCandidateCoordinatesV2(
      stage.kernelEvidence.stageResult.terminalCandidate,
    );
  }
  let terminalProjection: MainWireNormalAdultPassiveEquilibriumUnbrandedTerminalProjectionV2 | null;
  try {
    terminalProjection =
      evaluateMainWireNormalAdultPassiveEquilibriumCanonicalTerminalProjectionV2(
        targetChamberVolumesM3,
        coordinates,
      );
  } catch (error) {
    return deepFreezeEvidenceV2({
      status: "not-equilibrated" as const,
      stageZeroRootSha256: root.outcome.admittedReferenceRootSha256,
      targetChamberVolumesM3,
      failurePhase: "terminal-schur" as const,
      failureReason: "terminal-schur-execution-failed",
      completedStages: Object.freeze([...stages]),
      failedStageKernelEvidence: null,
      failedStage: null,
      exception: sanitizedExceptionEvidenceV2(error),
    });
  }
  if (terminalProjection === null) {
    return deepFreezeEvidenceV2({
      status: "not-equilibrated" as const,
      stageZeroRootSha256: root.outcome.admittedReferenceRootSha256,
      targetChamberVolumesM3,
      failurePhase: "terminal-schur" as const,
      failureReason: "qualified-terminal-schur-failed",
      completedStages: Object.freeze([...stages]),
      failedStageKernelEvidence: null,
      failedStage: null,
      exception: null,
    });
  }
  return deepFreezeEvidenceV2({
    status: "equilibrated" as const,
    stageZeroRootSha256: root.outcome.admittedReferenceRootSha256,
    targetChamberVolumesM3,
    stages: Object.freeze([...stages]),
    terminalProjection,
  });
}

function assertSealedReferenceRootV2(root: SealedReferenceRootV2): void {
  if (
    !sealedReferenceRootRegistryV2.has(root) ||
    root.outcome.status !== "admitted" ||
    root.outcome.admittedReferenceRootSha256 === ""
  )
    throw new Error("V2 reference root is not the internally sealed root");
}

type BranchTerminalV2 = Readonly<{
  internalCoordinates: MainWirePassiveEquilibriumInternalCoordinatesV2;
  canonicalFactorizedStoredEnergyJ: number;
  intrinsicMyocardialTransmuralPressuresPa: Readonly<{
    LA: number;
    LV: number;
    RA: number;
    RV: number;
  }>;
  terminalProjection: MainWireNormalAdultPassiveEquilibriumUnbrandedTerminalProjectionV2;
}>;

type BranchParticipantPayloadV2 =
  | Readonly<{
      status: "participant-equilibrated";
      participantId: MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1;
      lineageKind:
        | "primary-32-stage-diagonal"
        | "alternate-lv-first-64-stage"
        | "alternate-rv-first-64-stage"
        | "independent-seed-stage-zero-then-primary-32-stage";
      seedOffsetScaledCoordinates: readonly [number, number] | null;
      stageZeroKernelEvidence: OfficialStageKernelEvidenceV2;
      stageZeroEvidence: MainWireNormalAdultPassiveEquilibriumOfficialStageEvidenceV2;
      homotopyStages: readonly MainWireNormalAdultPassiveEquilibriumOfficialStageEvidenceV2[];
      terminal: BranchTerminalV2;
      stageZeroRootSha256: string;
    }>
  | Readonly<{
      status: "participant-failed";
      participantId: MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1;
      lineageKind:
        | "primary-32-stage-diagonal"
        | "alternate-lv-first-64-stage"
        | "alternate-rv-first-64-stage"
        | "independent-seed-stage-zero-then-primary-32-stage";
      seedOffsetScaledCoordinates: readonly [number, number] | null;
      failurePhase:
        | "stage-zero-solver"
        | "stage-zero-auditor"
        | "stage-zero-scientific"
        | "homotopy-stage-solver"
        | "homotopy-stage-auditor"
        | "homotopy-stage-scientific"
        | "terminal-schur";
      stageZeroKernelEvidence: OfficialStageKernelEvidenceV2 | null;
      stageZeroEvidence: MainWireNormalAdultPassiveEquilibriumOfficialStageEvidenceV2 | null;
      homotopyStages: readonly MainWireNormalAdultPassiveEquilibriumOfficialStageEvidenceV2[];
      failedHomotopyStageKernelEvidence: OfficialStageKernelEvidenceV2 | null;
      failedHomotopyStage: MainWireNormalAdultPassiveEquilibriumOfficialStageEvidenceV2 | null;
      failureReason: string;
      exception: Readonly<{ name: string; message: string }> | null;
      stageZeroRootSha256: string;
    }>;

type BranchParticipantV2 = BranchParticipantPayloadV2 &
  Readonly<{ casePayloadSha256: string }>;

type BranchPairComparisonV2 = Readonly<{
  pair: readonly [
    MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1,
    MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1,
  ];
  status: "compared" | "not-compared-required-participant-failed";
  maximumScaledCoordinateDifference: number | null;
  absoluteStoredEnergyDifferenceJ: number | null;
  maximumScaledPressureDifference: number | null;
  coordinateGatePassed: boolean;
  storedEnergyGatePassed: boolean;
  pressureGatePassed: boolean;
  pairPassed: boolean;
}>;

type BranchAuditResultV2 = Readonly<{
  status: "branch-agreement-established" | "branch-audit-failed";
  resultPolicyVersion: "main-wire-normal-adult-passive-equilibrium-branch-audit-v1";
  failureReason:
    | null
    | "target-outside-branch-audit-lattice"
    | "reference-root-binding-invalid"
    | "required-participant-failed"
    | "branch-agreement-split-cluster";
  firstFailedParticipantId: MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1 | null;
  firstComparedMismatchPair: BranchPairComparisonV2["pair"] | null;
  auditLatticeIndices: Readonly<{ LV: 32; RV: 32 }>;
  maximumScaledCoordinateDifference: number | null;
  maximumAbsoluteStoredEnergyDifferenceJ: number | null;
  maximumScaledPressureDifference: number | null;
  stageZeroRootSha256: string;
  targetChamberVolumesM3: ChamberVolumesV2;
  participants: readonly BranchParticipantV2[];
  pairwiseComparisons: readonly BranchPairComparisonV2[];
  allTwelveParticipantsRetained: boolean;
  allSixtySixPairsRetained: boolean;
  branchAgreementEstablished: boolean;
  sampledAgreementIsNotGlobalUniquenessOrContinuousBranchProof: true;
}>;

type BranchAuditIndependentReportV2 = Readonly<{
  reportId: "main-wire-normal-adult-passive-equilibrium-branch-audit-independent-report-v2";
  status: "passed" | "failed" | "execution-failed";
  participantOrderReplayPassed: boolean;
  pairOrderReplayPassed: boolean;
  participantTerminalBindingReplayPassed: boolean;
  stageZeroRootLineageReplayPassed: boolean;
  participantStageLineageReplayPassed: boolean;
  pairFormulaReplayPassed: boolean;
  summaryReplayPassed: boolean;
  failureSemanticsReplayPassed: boolean;
  firstMismatchId: string | null;
  branchResultSha256: string;
  exception: SanitizedExceptionV2 | null;
}>;

type BranchAuditEvidenceV2 = Readonly<{
  status: "branch-agreement-established" | "branch-audit-failed";
  result: BranchAuditResultV2;
  resultSha256: string;
  independentAuditorReport: BranchAuditIndependentReportV2;
  independentAuditorReportSha256: string;
  branchAgreementEstablished: boolean;
}>;

async function sealBranchParticipantCaseV2(
  payload: BranchParticipantPayloadV2,
): Promise<BranchParticipantV2> {
  return deepFreezeEvidenceV2({
    ...payload,
    casePayloadSha256: await sha256CanonicalJsonHex(payload),
  });
}

function branchParticipantCasePayloadWithoutHashV2(
  participant: BranchParticipantV2,
): BranchParticipantPayloadV2 {
  const { casePayloadSha256: _casePayloadSha256, ...payload } = participant;
  return payload;
}

async function runReferenceBranchAuditV2(
  context: OfficialContextV2,
  root: SealedReferenceRootV2,
): Promise<BranchAuditEvidenceV2> {
  assertOfficialContextV2(context);
  assertSealedReferenceRootV2(root);
  const target = freezeVolumesV2(
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1,
  );
  const participants: BranchParticipantV2[] = [];
  for (const participantId of MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PARTICIPANT_ORDER_V1) {
    try {
      participants.push(
        await sealBranchParticipantCaseV2(
          await runBranchParticipantV2(context, root, target, participantId),
        ),
      );
    } catch (error) {
      const descriptor = branchParticipantDescriptorV2(participantId);
      participants.push(
        await sealBranchParticipantCaseV2(
          deepFreezeEvidenceV2({
            status: "participant-failed" as const,
            participantId,
            lineageKind: descriptor.lineageKind,
            seedOffsetScaledCoordinates: descriptor.seedOffset,
            failurePhase: "stage-zero-solver" as const,
            stageZeroKernelEvidence:
              descriptor.seedOffset === null
                ? {
                    chamberVolumesM3: root.stageZeroEvidence.chamberVolumesM3,
                    kernelEvidence: root.stageZeroEvidence.kernelEvidence,
                  }
                : null,
            stageZeroEvidence:
              descriptor.seedOffset === null ? root.stageZeroEvidence : null,
            homotopyStages: [],
            failedHomotopyStageKernelEvidence: null,
            failedHomotopyStage: null,
            failureReason: "participant-execution-exception",
            exception: sanitizedExceptionEvidenceV2(error),
            stageZeroRootSha256: root.outcome.admittedReferenceRootSha256,
          }),
        ),
      );
    }
  }
  const byId = new Map(
    participants.map((entry) => [entry.participantId, entry]),
  );
  const pairwiseComparisons =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PAIR_ORDER_V1.map(
      (pair) => compareBranchPairV2(pair, byId),
    );
  const allTwelveParticipantsRetained =
    participants.length === 12 &&
    participants.every(
      (entry, index) =>
        entry.participantId ===
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PARTICIPANT_ORDER_V1[
          index
        ],
    );
  const allSixtySixPairsRetained =
    pairwiseComparisons.length === 66 &&
    pairwiseComparisons.every(
      (entry, index) =>
        canonicalJsonStringify(entry.pair) ===
        canonicalJsonStringify(
          MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PAIR_ORDER_V1[
            index
          ],
        ),
    );
  const branchAgreementEstablished =
    allTwelveParticipantsRetained &&
    allSixtySixPairsRetained &&
    participants.every(
      (entry) => entry.status === "participant-equilibrated",
    ) &&
    pairwiseComparisons.every((entry) => entry.pairPassed);
  const firstFailedParticipantId =
    participants.find((entry) => entry.status === "participant-failed")
      ?.participantId ?? null;
  const firstComparedMismatchPair =
    pairwiseComparisons.find(
      (entry) => entry.status === "compared" && !entry.pairPassed,
    )?.pair ?? null;
  const compared = pairwiseComparisons.filter(
    (
      entry,
    ): entry is BranchPairComparisonV2 &
      Readonly<{
        status: "compared";
        maximumScaledCoordinateDifference: number;
        absoluteStoredEnergyDifferenceJ: number;
        maximumScaledPressureDifference: number;
      }> => entry.status === "compared",
  );
  const failureReason = branchAgreementEstablished
    ? null
    : firstFailedParticipantId !== null
      ? ("required-participant-failed" as const)
      : ("branch-agreement-split-cluster" as const);
  const result = deepFreezeEvidenceV2({
    status: branchAgreementEstablished
      ? ("branch-agreement-established" as const)
      : ("branch-audit-failed" as const),
    resultPolicyVersion:
      "main-wire-normal-adult-passive-equilibrium-branch-audit-v1" as const,
    failureReason,
    firstFailedParticipantId,
    firstComparedMismatchPair,
    auditLatticeIndices: { LV: 32 as const, RV: 32 as const },
    maximumScaledCoordinateDifference:
      compared.length === 0
        ? null
        : Math.max(
            ...compared.map((entry) => entry.maximumScaledCoordinateDifference),
          ),
    maximumAbsoluteStoredEnergyDifferenceJ:
      compared.length === 0
        ? null
        : Math.max(
            ...compared.map((entry) => entry.absoluteStoredEnergyDifferenceJ),
          ),
    maximumScaledPressureDifference:
      compared.length === 0
        ? null
        : Math.max(
            ...compared.map((entry) => entry.maximumScaledPressureDifference),
          ),
    stageZeroRootSha256: root.outcome.admittedReferenceRootSha256,
    targetChamberVolumesM3: target,
    participants: Object.freeze(participants),
    pairwiseComparisons: Object.freeze(pairwiseComparisons),
    allTwelveParticipantsRetained,
    allSixtySixPairsRetained,
    branchAgreementEstablished,
    sampledAgreementIsNotGlobalUniquenessOrContinuousBranchProof: true as const,
  });
  const resultSha256 = await sha256CanonicalJsonHex(result);
  let independentAuditorReport: BranchAuditIndependentReportV2;
  try {
    independentAuditorReport = await auditReferenceBranchResultV2(
      root,
      result,
      resultSha256,
    );
  } catch (error) {
    independentAuditorReport = deepFreezeEvidenceV2({
      reportId:
        "main-wire-normal-adult-passive-equilibrium-branch-audit-independent-report-v2" as const,
      status: "execution-failed" as const,
      participantOrderReplayPassed: false,
      pairOrderReplayPassed: false,
      participantTerminalBindingReplayPassed: false,
      stageZeroRootLineageReplayPassed: false,
      participantStageLineageReplayPassed: false,
      pairFormulaReplayPassed: false,
      summaryReplayPassed: false,
      failureSemanticsReplayPassed: false,
      firstMismatchId: "branch-independent-auditor-execution-failed",
      branchResultSha256: resultSha256,
      exception: sanitizedExceptionEvidenceV2(error),
    });
  }
  const independentAuditorReportSha256 = await sha256CanonicalJsonHex(
    independentAuditorReport,
  );
  const admitted =
    branchAgreementEstablished && independentAuditorReport.status === "passed";
  return deepFreezeEvidenceV2({
    status: admitted
      ? ("branch-agreement-established" as const)
      : ("branch-audit-failed" as const),
    result,
    resultSha256,
    independentAuditorReport,
    independentAuditorReportSha256,
    branchAgreementEstablished: admitted,
  });
}

async function runBranchParticipantV2(
  context: OfficialContextV2,
  root: SealedReferenceRootV2,
  target: ChamberVolumesV2,
  participantId: MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1,
): Promise<BranchParticipantPayloadV2> {
  const descriptor = branchParticipantDescriptorV2(participantId);
  let stageZeroEvidence = root.stageZeroEvidence;
  let stageZeroKernelEvidence: OfficialStageKernelEvidenceV2 =
    deepFreezeEvidenceV2({
      chamberVolumesM3: root.stageZeroEvidence.chamberVolumesM3,
      kernelEvidence: root.stageZeroEvidence.kernelEvidence,
    });
  let initialCoordinates = root.terminalCoordinates;
  if (descriptor.seedOffset !== null) {
    const loaded =
      NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg.loadedCoordinates;
    initialCoordinates = deepFreezeEvidenceV2({
      septalMidwallCapVolumeM3:
        loaded.septalMidwallCapVolumeM3 +
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2
          .coordinateScales.septalMidwallCapVolumeM3 *
          descriptor.seedOffset[0],
      junctionRadiusM:
        loaded.junctionRadiusM +
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2
          .coordinateScales.junctionRadiusM *
          descriptor.seedOffset[1],
    });
    try {
      stageZeroKernelEvidence = await runOfficialStageKernelEvidenceV2(
        target,
        0,
        initialCoordinates,
      );
    } catch (error) {
      return deepFreezeEvidenceV2({
        status: "participant-failed" as const,
        participantId,
        lineageKind: descriptor.lineageKind,
        seedOffsetScaledCoordinates: descriptor.seedOffset,
        failurePhase: "stage-zero-solver" as const,
        stageZeroKernelEvidence: null,
        stageZeroEvidence: null,
        homotopyStages: [],
        failedHomotopyStageKernelEvidence: null,
        failedHomotopyStage: null,
        failureReason: "stage-zero-solver-execution-failed",
        exception: sanitizedExceptionEvidenceV2(error),
        stageZeroRootSha256: root.outcome.admittedReferenceRootSha256,
      });
    }
    try {
      stageZeroEvidence = await auditOfficialStageKernelEvidenceV2(
        stageZeroKernelEvidence,
      );
    } catch (error) {
      return deepFreezeEvidenceV2({
        status: "participant-failed" as const,
        participantId,
        lineageKind: descriptor.lineageKind,
        seedOffsetScaledCoordinates: descriptor.seedOffset,
        failurePhase: "stage-zero-auditor" as const,
        stageZeroKernelEvidence,
        stageZeroEvidence: null,
        homotopyStages: [],
        failedHomotopyStageKernelEvidence: null,
        failedHomotopyStage: null,
        failureReason: "stage-zero-auditor-execution-failed",
        exception: sanitizedExceptionEvidenceV2(error),
        stageZeroRootSha256: root.outcome.admittedReferenceRootSha256,
      });
    }
    if (
      stageZeroEvidence.kernelAudit.report.auditStatus !== "passed" ||
      stageZeroEvidence.kernelEvidence.stageResult.status === "failed"
    ) {
      const failureReason =
        stageZeroEvidence.kernelAudit.report.auditStatus !== "passed"
          ? "evidence-audit-failed"
          : stageZeroEvidence.kernelEvidence.stageResult.status === "failed"
            ? stageZeroEvidence.kernelEvidence.stageResult.failureReason
            : "unreachable-stage-zero-failure-classification";
      return deepFreezeEvidenceV2({
        status: "participant-failed" as const,
        participantId,
        lineageKind: descriptor.lineageKind,
        seedOffsetScaledCoordinates: descriptor.seedOffset,
        failurePhase:
          stageZeroEvidence.kernelAudit.report.auditStatus !== "passed"
            ? ("stage-zero-auditor" as const)
            : ("stage-zero-scientific" as const),
        stageZeroKernelEvidence,
        stageZeroEvidence,
        homotopyStages: [],
        failedHomotopyStageKernelEvidence: null,
        failedHomotopyStage: null,
        failureReason,
        exception: null,
        stageZeroRootSha256: root.outcome.admittedReferenceRootSha256,
      });
    }
    initialCoordinates = unwrapCandidateCoordinatesV2(
      stageZeroEvidence.kernelEvidence.stageResult.terminalCandidate,
    );
  }

  const schedule = branchScheduleV2(descriptor.lineageKind, target);
  const solved = await runFixedScheduleV2(schedule, initialCoordinates);
  if (solved.status === "failed") {
    return deepFreezeEvidenceV2({
      status: "participant-failed" as const,
      participantId,
      lineageKind: descriptor.lineageKind,
      seedOffsetScaledCoordinates: descriptor.seedOffset,
      failurePhase: solved.failurePhase,
      stageZeroKernelEvidence,
      stageZeroEvidence,
      homotopyStages: solved.completedStages,
      failedHomotopyStageKernelEvidence: solved.failedStageKernelEvidence,
      failedHomotopyStage: solved.failedStage,
      failureReason: solved.failureReason,
      exception: solved.exception,
      stageZeroRootSha256: root.outcome.admittedReferenceRootSha256,
    });
  }
  let terminalProjection: MainWireNormalAdultPassiveEquilibriumUnbrandedTerminalProjectionV2 | null;
  try {
    terminalProjection =
      evaluateMainWireNormalAdultPassiveEquilibriumCanonicalTerminalProjectionV2(
        target,
        solved.terminalCoordinates,
      );
  } catch (error) {
    return deepFreezeEvidenceV2({
      status: "participant-failed" as const,
      participantId,
      lineageKind: descriptor.lineageKind,
      seedOffsetScaledCoordinates: descriptor.seedOffset,
      failurePhase: "terminal-schur" as const,
      stageZeroKernelEvidence,
      stageZeroEvidence,
      homotopyStages: solved.stages,
      failedHomotopyStageKernelEvidence: null,
      failedHomotopyStage: null,
      failureReason: "terminal-schur-execution-failed",
      exception: sanitizedExceptionEvidenceV2(error),
      stageZeroRootSha256: root.outcome.admittedReferenceRootSha256,
    });
  }
  if (terminalProjection === null) {
    return deepFreezeEvidenceV2({
      status: "participant-failed" as const,
      participantId,
      lineageKind: descriptor.lineageKind,
      seedOffsetScaledCoordinates: descriptor.seedOffset,
      failurePhase: "terminal-schur" as const,
      stageZeroKernelEvidence,
      stageZeroEvidence,
      homotopyStages: solved.stages,
      failedHomotopyStageKernelEvidence: null,
      failedHomotopyStage: null,
      failureReason: "qualified-terminal-schur-failed",
      exception: null,
      stageZeroRootSha256: root.outcome.admittedReferenceRootSha256,
    });
  }
  return deepFreezeEvidenceV2({
    status: "participant-equilibrated" as const,
    participantId,
    lineageKind: descriptor.lineageKind,
    seedOffsetScaledCoordinates: descriptor.seedOffset,
    stageZeroKernelEvidence,
    stageZeroEvidence,
    homotopyStages: solved.stages,
    terminal: branchTerminalV2(terminalProjection),
    stageZeroRootSha256: root.outcome.admittedReferenceRootSha256,
  });
}

function branchParticipantDescriptorV2(
  participantId: MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1,
): Readonly<{
  lineageKind: BranchParticipantV2["lineageKind"];
  seedOffset: readonly [number, number] | null;
}> {
  if (participantId === "primary-zero-offset-canonical-root")
    return Object.freeze({
      lineageKind: "primary-32-stage-diagonal" as const,
      seedOffset: null,
    });
  if (participantId === "alternate-lv-first")
    return Object.freeze({
      lineageKind: "alternate-lv-first-64-stage" as const,
      seedOffset: null,
    });
  if (participantId === "alternate-rv-first")
    return Object.freeze({
      lineageKind: "alternate-rv-first-64-stage" as const,
      seedOffset: null,
    });
  const seedIndex =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PARTICIPANT_ORDER_V1.indexOf(
      participantId,
    ) - 3;
  const seedOffset =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1
      .referenceSeedOffsetsInScaledCoordinates[seedIndex];
  if (seedOffset === undefined)
    throw new Error(`unknown branch participant: ${participantId}`);
  return Object.freeze({
    lineageKind: "independent-seed-stage-zero-then-primary-32-stage" as const,
    seedOffset: Object.freeze([seedOffset[0], seedOffset[1]] as const),
  });
}

function branchScheduleV2(
  lineageKind: BranchParticipantV2["lineageKind"],
  target: ChamberVolumesV2,
): readonly ChamberVolumesV2[] {
  const reference =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1;
  if (
    lineageKind === "primary-32-stage-diagonal" ||
    lineageKind === "independent-seed-stage-zero-then-primary-32-stage"
  ) {
    return Object.freeze(
      Array.from({ length: 32 }, (_, index) => {
        const fraction = (index + 1) / 32;
        return freezeVolumesV2({
          LA: target.LA,
          LV: reference.LV + fraction * (target.LV - reference.LV),
          RA: target.RA,
          RV: reference.RV + fraction * (target.RV - reference.RV),
        });
      }),
    );
  }
  return Object.freeze(
    Array.from({ length: 64 }, (_, index) => {
      const stage = index + 1;
      if (lineageKind === "alternate-lv-first-64-stage") {
        return stage <= 32
          ? freezeVolumesV2({
              LA: target.LA,
              LV: reference.LV + (stage / 32) * (target.LV - reference.LV),
              RA: target.RA,
              RV: reference.RV,
            })
          : freezeVolumesV2({
              LA: target.LA,
              LV: target.LV,
              RA: target.RA,
              RV:
                reference.RV + ((stage - 32) / 32) * (target.RV - reference.RV),
            });
      }
      return stage <= 32
        ? freezeVolumesV2({
            LA: target.LA,
            LV: reference.LV,
            RA: target.RA,
            RV: reference.RV + (stage / 32) * (target.RV - reference.RV),
          })
        : freezeVolumesV2({
            LA: target.LA,
            LV: reference.LV + ((stage - 32) / 32) * (target.LV - reference.LV),
            RA: target.RA,
            RV: target.RV,
          });
    }),
  );
}

async function runFixedScheduleV2(
  schedule: readonly ChamberVolumesV2[],
  initialCoordinates: MainWirePassiveEquilibriumInternalCoordinatesV2,
): Promise<
  | Readonly<{
      status: "converged";
      stages: readonly MainWireNormalAdultPassiveEquilibriumOfficialStageEvidenceV2[];
      terminalCoordinates: MainWirePassiveEquilibriumInternalCoordinatesV2;
    }>
  | Readonly<{
      status: "failed";
      completedStages: readonly MainWireNormalAdultPassiveEquilibriumOfficialStageEvidenceV2[];
      failedStageKernelEvidence: OfficialStageKernelEvidenceV2 | null;
      failedStage: MainWireNormalAdultPassiveEquilibriumOfficialStageEvidenceV2 | null;
      failurePhase:
        | "homotopy-stage-solver"
        | "homotopy-stage-auditor"
        | "homotopy-stage-scientific";
      failureReason: string;
      exception: SanitizedExceptionV2 | null;
    }>
> {
  const stages: MainWireNormalAdultPassiveEquilibriumOfficialStageEvidenceV2[] =
    [];
  let coordinates = initialCoordinates;
  for (let index = 0; index < schedule.length; index += 1) {
    let stageKernelEvidence: OfficialStageKernelEvidenceV2;
    try {
      stageKernelEvidence = await runOfficialStageKernelEvidenceV2(
        schedule[index],
        index + 1,
        coordinates,
      );
    } catch (error) {
      return deepFreezeEvidenceV2({
        status: "failed" as const,
        completedStages: Object.freeze([...stages]),
        failedStageKernelEvidence: null,
        failedStage: null,
        failurePhase: "homotopy-stage-solver" as const,
        failureReason: "homotopy-stage-solver-execution-failed",
        exception: sanitizedExceptionEvidenceV2(error),
      });
    }
    let stage: MainWireNormalAdultPassiveEquilibriumOfficialStageEvidenceV2;
    try {
      stage = await auditOfficialStageKernelEvidenceV2(stageKernelEvidence);
    } catch (error) {
      return deepFreezeEvidenceV2({
        status: "failed" as const,
        completedStages: Object.freeze([...stages]),
        failedStageKernelEvidence: stageKernelEvidence,
        failedStage: null,
        failurePhase: "homotopy-stage-auditor" as const,
        failureReason: "homotopy-stage-auditor-execution-failed",
        exception: sanitizedExceptionEvidenceV2(error),
      });
    }
    if (
      stage.kernelAudit.report.auditStatus !== "passed" ||
      stage.kernelEvidence.stageResult.status === "failed"
    ) {
      const failureReason =
        stage.kernelAudit.report.auditStatus !== "passed"
          ? "evidence-audit-failed"
          : stage.kernelEvidence.stageResult.status === "failed"
            ? stage.kernelEvidence.stageResult.failureReason
            : "unreachable-stage-failure-classification";
      return deepFreezeEvidenceV2({
        status: "failed" as const,
        completedStages: Object.freeze([...stages]),
        failedStageKernelEvidence: stageKernelEvidence,
        failedStage: stage,
        failurePhase:
          stage.kernelAudit.report.auditStatus !== "passed"
            ? ("homotopy-stage-auditor" as const)
            : ("homotopy-stage-scientific" as const),
        failureReason,
        exception: null,
      });
    }
    stages.push(stage);
    coordinates = unwrapCandidateCoordinatesV2(
      stage.kernelEvidence.stageResult.terminalCandidate,
    );
  }
  return deepFreezeEvidenceV2({
    status: "converged" as const,
    stages: Object.freeze(stages),
    terminalCoordinates: coordinates,
  });
}

function branchTerminalV2(
  projection: MainWireNormalAdultPassiveEquilibriumUnbrandedTerminalProjectionV2,
): BranchTerminalV2 {
  return deepFreezeEvidenceV2({
    internalCoordinates: {
      ...projection.candidate.internalCoordinates,
    },
    canonicalFactorizedStoredEnergyJ:
      projection.candidate.rawStoredEnergyJ.canonicalFactorizedTotal,
    intrinsicMyocardialTransmuralPressuresPa: {
      ...projection.candidate.intrinsicMyocardialTransmuralPressuresPa,
    },
    terminalProjection: projection,
  });
}

function compareBranchPairV2(
  pair: readonly [
    MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1,
    MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1,
  ],
  byId: ReadonlyMap<
    MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1,
    BranchParticipantV2
  >,
): BranchPairComparisonV2 {
  const left = byId.get(pair[0]);
  const right = byId.get(pair[1]);
  if (
    left === undefined ||
    right === undefined ||
    left.status !== "participant-equilibrated" ||
    right.status !== "participant-equilibrated"
  ) {
    return deepFreezeEvidenceV2({
      pair: Object.freeze([pair[0], pair[1]] as const),
      status: "not-compared-required-participant-failed" as const,
      maximumScaledCoordinateDifference: null,
      absoluteStoredEnergyDifferenceJ: null,
      maximumScaledPressureDifference: null,
      coordinateGatePassed: false,
      storedEnergyGatePassed: false,
      pressureGatePassed: false,
      pairPassed: false,
    });
  }
  const scales =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2.coordinateScales;
  const maximumScaledCoordinateDifference = Math.max(
    Math.abs(
      left.terminal.internalCoordinates.septalMidwallCapVolumeM3 -
        right.terminal.internalCoordinates.septalMidwallCapVolumeM3,
    ) / scales.septalMidwallCapVolumeM3,
    Math.abs(
      left.terminal.internalCoordinates.junctionRadiusM -
        right.terminal.internalCoordinates.junctionRadiusM,
    ) / scales.junctionRadiusM,
  );
  const absoluteStoredEnergyDifferenceJ = Math.abs(
    left.terminal.canonicalFactorizedStoredEnergyJ -
      right.terminal.canonicalFactorizedStoredEnergyJ,
  );
  const pressureFloor =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1.branchAgreement
      .pressureFloorPa;
  const maximumScaledPressureDifference = Math.max(
    ...(["LA", "LV", "RA", "RV"] as const).map(
      (chamber) =>
        Math.abs(
          left.terminal.intrinsicMyocardialTransmuralPressuresPa[chamber] -
            right.terminal.intrinsicMyocardialTransmuralPressuresPa[chamber],
        ) /
        Math.max(
          Math.abs(
            left.terminal.intrinsicMyocardialTransmuralPressuresPa[chamber],
          ),
          Math.abs(
            right.terminal.intrinsicMyocardialTransmuralPressuresPa[chamber],
          ),
          pressureFloor,
        ),
    ),
  );
  const thresholds =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1.branchAgreement;
  const coordinateGatePassed =
    maximumScaledCoordinateDifference <=
    thresholds.maximumScaledCoordinateDifference;
  const storedEnergyGatePassed =
    absoluteStoredEnergyDifferenceJ <=
    thresholds.maximumAbsoluteStoredEnergyDifferenceJ;
  const pressureGatePassed =
    maximumScaledPressureDifference <=
    thresholds.maximumScaledPressureDifference;
  return deepFreezeEvidenceV2({
    pair: Object.freeze([pair[0], pair[1]] as const),
    status: "compared" as const,
    maximumScaledCoordinateDifference,
    absoluteStoredEnergyDifferenceJ,
    maximumScaledPressureDifference,
    coordinateGatePassed,
    storedEnergyGatePassed,
    pressureGatePassed,
    pairPassed:
      coordinateGatePassed && storedEnergyGatePassed && pressureGatePassed,
  });
}

async function auditReferenceBranchResultV2(
  root: SealedReferenceRootV2,
  result: BranchAuditResultV2,
  resultSha256: string,
): Promise<BranchAuditIndependentReportV2> {
  const participantOrderReplayPassed =
    result.participants.length ===
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PARTICIPANT_ORDER_V1.length &&
    result.participants.every(
      (participant, index) =>
        participant.participantId ===
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PARTICIPANT_ORDER_V1[
          index
        ],
    );
  const pairOrderReplayPassed =
    result.pairwiseComparisons.length ===
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PAIR_ORDER_V1.length &&
    result.pairwiseComparisons.every(
      (comparison, index) =>
        canonicalJsonStringify(comparison.pair) ===
        canonicalJsonStringify(
          MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PAIR_ORDER_V1[
            index
          ],
        ),
    );
  const participantTerminalBindingReplayPassed = result.participants.every(
    (participant) => {
      if (participant.status === "participant-failed") return true;
      const candidate = participant.terminal.terminalProjection.candidate;
      return (
        canonicalJsonStringify(participant.terminal.internalCoordinates) ===
          canonicalJsonStringify(candidate.internalCoordinates) &&
        Object.is(
          participant.terminal.canonicalFactorizedStoredEnergyJ,
          candidate.rawStoredEnergyJ.canonicalFactorizedTotal,
        ) &&
        canonicalJsonStringify(
          participant.terminal.intrinsicMyocardialTransmuralPressuresPa,
        ) ===
          canonicalJsonStringify(
            candidate.intrinsicMyocardialTransmuralPressuresPa,
          ) &&
        participant.terminal.terminalProjection.qualification ===
          "unbranded-non-official-projection" &&
        participant.terminal.terminalProjection.qualificationOrRootMinted ===
          false
      );
    },
  );
  const stageZeroRootLineageReplayPassed =
    result.stageZeroRootSha256 === root.outcome.admittedReferenceRootSha256 &&
    result.participants.every((participant) => {
      if (
        participant.stageZeroRootSha256 !==
        root.outcome.admittedReferenceRootSha256
      )
        return false;
      if (participant.status === "participant-failed") {
        if (participant.failurePhase === "stage-zero-solver")
          return (
            participant.stageZeroKernelEvidence === null &&
            participant.stageZeroEvidence === null
          );
        if (
          participant.failurePhase === "stage-zero-auditor" &&
          participant.stageZeroEvidence === null
        )
          return participant.stageZeroKernelEvidence !== null;
      }
      return participant.stageZeroEvidence !== null;
    });
  const participantStageLineageReplayPassed =
    await auditBranchParticipantLineageCollectionV2(root, result);
  const byId = new Map(
    result.participants.map((participant) => [
      participant.participantId,
      participant,
    ]),
  );
  const independentlyReplayedPairs =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PAIR_ORDER_V1.map(
      (pair) => independentlyReplayBranchPairV2(pair, byId),
    );
  const pairFormulaReplayPassed =
    canonicalJsonStringify(independentlyReplayedPairs) ===
    canonicalJsonStringify(result.pairwiseComparisons);
  const replayedFirstFailedParticipantId =
    result.participants.find(
      (participant) => participant.status === "participant-failed",
    )?.participantId ?? null;
  const replayedFirstComparedMismatchPair =
    independentlyReplayedPairs.find(
      (comparison) =>
        comparison.status === "compared" && !comparison.pairPassed,
    )?.pair ?? null;
  const replayedCompared = independentlyReplayedPairs.filter(
    (
      comparison,
    ): comparison is BranchPairComparisonV2 &
      Readonly<{
        status: "compared";
        maximumScaledCoordinateDifference: number;
        absoluteStoredEnergyDifferenceJ: number;
        maximumScaledPressureDifference: number;
      }> => comparison.status === "compared",
  );
  const replayedAgreement =
    participantOrderReplayPassed &&
    pairOrderReplayPassed &&
    result.participants.every(
      (participant) => participant.status === "participant-equilibrated",
    ) &&
    independentlyReplayedPairs.every((comparison) => comparison.pairPassed);
  const replayedFailureReason = replayedAgreement
    ? null
    : replayedFirstFailedParticipantId !== null
      ? "required-participant-failed"
      : "branch-agreement-split-cluster";
  const maximumOrNull = (
    selector: (comparison: (typeof replayedCompared)[number]) => number,
  ) =>
    replayedCompared.length === 0
      ? null
      : Math.max(...replayedCompared.map(selector));
  const summaryReplayPassed =
    result.allTwelveParticipantsRetained === participantOrderReplayPassed &&
    result.allSixtySixPairsRetained === pairOrderReplayPassed &&
    result.branchAgreementEstablished === replayedAgreement &&
    result.firstFailedParticipantId === replayedFirstFailedParticipantId &&
    canonicalJsonStringify(result.firstComparedMismatchPair) ===
      canonicalJsonStringify(replayedFirstComparedMismatchPair) &&
    Object.is(
      result.maximumScaledCoordinateDifference,
      maximumOrNull(
        (comparison) => comparison.maximumScaledCoordinateDifference,
      ),
    ) &&
    Object.is(
      result.maximumAbsoluteStoredEnergyDifferenceJ,
      maximumOrNull((comparison) => comparison.absoluteStoredEnergyDifferenceJ),
    ) &&
    Object.is(
      result.maximumScaledPressureDifference,
      maximumOrNull((comparison) => comparison.maximumScaledPressureDifference),
    );
  const failureSemanticsReplayPassed =
    result.resultPolicyVersion ===
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1
        .branchAuditResultPolicy.version &&
    result.failureReason === replayedFailureReason &&
    result.status ===
      (replayedAgreement
        ? "branch-agreement-established"
        : "branch-audit-failed") &&
    result.sampledAgreementIsNotGlobalUniquenessOrContinuousBranchProof ===
      true &&
    result.auditLatticeIndices.LV === 32 &&
    result.auditLatticeIndices.RV === 32 &&
    resultSha256 === (await sha256CanonicalJsonHex(result));
  const status =
    participantOrderReplayPassed &&
    pairOrderReplayPassed &&
    participantTerminalBindingReplayPassed &&
    stageZeroRootLineageReplayPassed &&
    participantStageLineageReplayPassed &&
    pairFormulaReplayPassed &&
    summaryReplayPassed &&
    failureSemanticsReplayPassed
      ? ("passed" as const)
      : ("failed" as const);
  return deepFreezeEvidenceV2({
    reportId:
      "main-wire-normal-adult-passive-equilibrium-branch-audit-independent-report-v2" as const,
    status,
    participantOrderReplayPassed,
    pairOrderReplayPassed,
    participantTerminalBindingReplayPassed,
    stageZeroRootLineageReplayPassed,
    participantStageLineageReplayPassed,
    pairFormulaReplayPassed,
    summaryReplayPassed,
    failureSemanticsReplayPassed,
    firstMismatchId: !participantOrderReplayPassed
      ? "participant-order"
      : !pairOrderReplayPassed
        ? "pair-order"
        : !participantTerminalBindingReplayPassed
          ? "participant-terminal-binding"
          : !stageZeroRootLineageReplayPassed
            ? "stage-zero-root-lineage"
            : !participantStageLineageReplayPassed
              ? "participant-stage-lineage"
              : !pairFormulaReplayPassed
                ? "pair-formula"
                : !summaryReplayPassed
                  ? "summary"
                  : !failureSemanticsReplayPassed
                    ? "failure-semantics"
                    : null,
    branchResultSha256: resultSha256,
    exception: null,
  });
}

function independentlyReplayBranchPairV2(
  pair: BranchPairComparisonV2["pair"],
  byId: ReadonlyMap<
    MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1,
    BranchParticipantV2
  >,
): BranchPairComparisonV2 {
  const left = byId.get(pair[0]);
  const right = byId.get(pair[1]);
  if (
    left?.status !== "participant-equilibrated" ||
    right?.status !== "participant-equilibrated"
  )
    return deepFreezeEvidenceV2({
      pair: Object.freeze([pair[0], pair[1]] as const),
      status: "not-compared-required-participant-failed" as const,
      maximumScaledCoordinateDifference: null,
      absoluteStoredEnergyDifferenceJ: null,
      maximumScaledPressureDifference: null,
      coordinateGatePassed: false,
      storedEnergyGatePassed: false,
      pressureGatePassed: false,
      pairPassed: false,
    });
  const coordinateScale =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2.coordinateScales;
  const coordinateDifference = Math.max(
    Math.abs(
      left.terminal.internalCoordinates.septalMidwallCapVolumeM3 -
        right.terminal.internalCoordinates.septalMidwallCapVolumeM3,
    ) / coordinateScale.septalMidwallCapVolumeM3,
    Math.abs(
      left.terminal.internalCoordinates.junctionRadiusM -
        right.terminal.internalCoordinates.junctionRadiusM,
    ) / coordinateScale.junctionRadiusM,
  );
  const energyDifference = Math.abs(
    left.terminal.canonicalFactorizedStoredEnergyJ -
      right.terminal.canonicalFactorizedStoredEnergyJ,
  );
  const agreement =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_POLICY_V1.branchAgreement;
  const pressureDifference = Math.max(
    ...(["LA", "LV", "RA", "RV"] as const).map((chamber) => {
      const leftPressure =
        left.terminal.intrinsicMyocardialTransmuralPressuresPa[chamber];
      const rightPressure =
        right.terminal.intrinsicMyocardialTransmuralPressuresPa[chamber];
      return (
        Math.abs(leftPressure - rightPressure) /
        Math.max(
          Math.abs(leftPressure),
          Math.abs(rightPressure),
          agreement.pressureFloorPa,
        )
      );
    }),
  );
  const coordinateGatePassed =
    coordinateDifference <= agreement.maximumScaledCoordinateDifference;
  const storedEnergyGatePassed =
    energyDifference <= agreement.maximumAbsoluteStoredEnergyDifferenceJ;
  const pressureGatePassed =
    pressureDifference <= agreement.maximumScaledPressureDifference;
  return deepFreezeEvidenceV2({
    pair: Object.freeze([pair[0], pair[1]] as const),
    status: "compared" as const,
    maximumScaledCoordinateDifference: coordinateDifference,
    absoluteStoredEnergyDifferenceJ: energyDifference,
    maximumScaledPressureDifference: pressureDifference,
    coordinateGatePassed,
    storedEnergyGatePassed,
    pressureGatePassed,
    pairPassed:
      coordinateGatePassed && storedEnergyGatePassed && pressureGatePassed,
  });
}

async function auditOfficialStageKernelEvidenceStructureV2(
  stage: OfficialStageKernelEvidenceV2,
  expectedChamberVolumesM3: ChamberVolumesV2,
  expectedStageIndex: number,
  expectedInitialCoordinates: MainWirePassiveEquilibriumInternalCoordinatesV2,
): Promise<boolean> {
  const envelope = stage.kernelEvidence;
  const result = envelope.stageResult;
  return (
    canonicalJsonStringify(stage.chamberVolumesM3) ===
      canonicalJsonStringify(expectedChamberVolumesM3) &&
    envelope.qualification === "neutral-unqualified-kernel-evidence" &&
    result.stageIndex === expectedStageIndex &&
    canonicalJsonStringify(result.initialCoordinates) ===
      canonicalJsonStringify(
        wrapCoordinatesEvidenceV2(expectedInitialCoordinates),
      ) &&
    envelope.solverPolicyId ===
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2_ID &&
    envelope.solverPolicySha256 === FROZEN_POINT_SOLVER_POLICY_V2_SHA256 &&
    envelope.stageResultSha256 === (await sha256CanonicalJsonHex(result)) &&
    canonicalJsonStringify(envelope.iterationEvidenceSha256) ===
      canonicalJsonStringify(
        await Promise.all(
          result.iterations.map((iteration) =>
            sha256CanonicalJsonHex(iteration),
          ),
        ),
      )
  );
}

async function auditOfficialStageEvidenceLineageV2(
  stage: MainWireNormalAdultPassiveEquilibriumOfficialStageEvidenceV2,
  expectedChamberVolumesM3: ChamberVolumesV2,
  expectedStageIndex: number,
  expectedInitialCoordinates: MainWirePassiveEquilibriumInternalCoordinatesV2,
): Promise<
  Readonly<{
    passed: boolean;
    terminalCoordinates: MainWirePassiveEquilibriumInternalCoordinatesV2 | null;
  }>
> {
  const envelope = stage.kernelEvidence;
  const result = envelope.stageResult;
  const structuralBindingPassed =
    await auditOfficialStageKernelEvidenceStructureV2(
      {
        chamberVolumesM3: stage.chamberVolumesM3,
        kernelEvidence: stage.kernelEvidence,
      },
      expectedChamberVolumesM3,
      expectedStageIndex,
      expectedInitialCoordinates,
    );
  const replayedAudit =
    await auditMainWirePassiveEquilibriumStageKernelV2(envelope);
  const auditBindingPassed =
    canonicalJsonStringify(replayedAudit) ===
      canonicalJsonStringify(stage.kernelAudit) &&
    replayedAudit.report.auditStatus === "passed" &&
    replayedAudit.reportSha256 === stage.kernelAudit.reportSha256 &&
    replayedAudit.reportSha256 ===
      (await sha256CanonicalJsonHex(replayedAudit.report));
  const converged = result.status === "converged";
  return deepFreezeEvidenceV2({
    passed: structuralBindingPassed && auditBindingPassed && converged,
    terminalCoordinates: converged
      ? unwrapCandidateCoordinatesV2(result.terminalCandidate)
      : null,
  });
}

async function auditPrimaryPointResultV2(
  root: SealedReferenceRootV2,
  point: OfficialPointResultV2,
  expectedTarget: ChamberVolumesV2,
): Promise<boolean> {
  if (
    point.casePayloadSha256 !==
      (await sha256CanonicalJsonHex(frozenCasePayloadWithoutHashV2(point))) ||
    point.stageZeroRootSha256 !== root.outcome.admittedReferenceRootSha256 ||
    canonicalJsonStringify(point.targetChamberVolumesM3) !==
      canonicalJsonStringify(expectedTarget)
  )
    return false;
  const reference =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1;
  let expectedInitial = root.terminalCoordinates;
  const completedStages =
    point.status === "equilibrated" ? point.stages : point.completedStages;
  if (completedStages.length > 32) return false;
  for (let index = 0; index < completedStages.length; index += 1) {
    const stageIndex = index + 1;
    const fraction = stageIndex / 32;
    const expectedVolumes = freezeVolumesV2({
      LA: expectedTarget.LA,
      LV: reference.LV + fraction * (expectedTarget.LV - reference.LV),
      RA: expectedTarget.RA,
      RV: reference.RV + fraction * (expectedTarget.RV - reference.RV),
    });
    const replay = await auditOfficialStageEvidenceLineageV2(
      completedStages[index],
      expectedVolumes,
      stageIndex,
      expectedInitial,
    );
    if (!replay.passed || replay.terminalCoordinates === null) return false;
    expectedInitial = replay.terminalCoordinates;
  }
  if (point.status === "not-equilibrated") {
    if (point.failurePhase === "stage-solver")
      return (
        completedStages.length < 32 &&
        point.failedStageKernelEvidence === null &&
        point.failedStage === null &&
        point.failureReason === "stage-solver-execution-failed" &&
        point.exception !== null
      );
    if (
      point.failurePhase === "stage-auditor" ||
      point.failurePhase === "stage-scientific"
    ) {
      if (
        completedStages.length >= 32 ||
        point.failedStageKernelEvidence === null
      )
        return false;
      if (point.failedStage === null) {
        const failedStageNumber = completedStages.length + 1;
        const failedFraction = failedStageNumber / 32;
        return (
          point.failurePhase === "stage-auditor" &&
          point.failureReason === "stage-evidence-auditor-execution-failed" &&
          point.exception !== null &&
          (await auditOfficialStageKernelEvidenceStructureV2(
            point.failedStageKernelEvidence,
            freezeVolumesV2({
              LA: expectedTarget.LA,
              LV:
                reference.LV +
                failedFraction * (expectedTarget.LV - reference.LV),
              RA: expectedTarget.RA,
              RV:
                reference.RV +
                failedFraction * (expectedTarget.RV - reference.RV),
            }),
            failedStageNumber,
            expectedInitial,
          ))
        );
      }
      if (
        canonicalJsonStringify(point.failedStageKernelEvidence) !==
          canonicalJsonStringify({
            chamberVolumesM3: point.failedStage.chamberVolumesM3,
            kernelEvidence: point.failedStage.kernelEvidence,
          }) ||
        point.exception !== null
      )
        return false;
      const failedStageNumber = completedStages.length + 1;
      const fraction = failedStageNumber / 32;
      return auditFailedOfficialStageEvidenceV2(
        point.failedStage,
        freezeVolumesV2({
          LA: expectedTarget.LA,
          LV: reference.LV + fraction * (expectedTarget.LV - reference.LV),
          RA: expectedTarget.RA,
          RV: reference.RV + fraction * (expectedTarget.RV - reference.RV),
        }),
        failedStageNumber,
        expectedInitial,
        point.failurePhase === "stage-scientific"
          ? "scientific-failure"
          : "evidence-audit-failure",
        point.failureReason,
      );
    }
    if (
      completedStages.length !== 32 ||
      point.failedStageKernelEvidence !== null ||
      point.failedStage !== null
    )
      return false;
    try {
      const failedTerminal =
        evaluateMainWireNormalAdultPassiveEquilibriumCanonicalTerminalProjectionV2(
          expectedTarget,
          expectedInitial,
        );
      return (
        failedTerminal === null &&
        point.failureReason === "qualified-terminal-schur-failed" &&
        point.exception === null
      );
    } catch (error) {
      return (
        point.failureReason === "terminal-schur-execution-failed" &&
        canonicalJsonStringify(point.exception) ===
          canonicalJsonStringify(sanitizedExceptionEvidenceV2(error))
      );
    }
  }
  if (completedStages.length !== 32) return false;
  const terminalReplay =
    evaluateMainWireNormalAdultPassiveEquilibriumCanonicalTerminalProjectionV2(
      expectedTarget,
      expectedInitial,
    );
  return (
    terminalReplay !== null &&
    canonicalJsonStringify(terminalReplay) ===
      canonicalJsonStringify(point.terminalProjection)
  );
}

async function auditFrozenPrimaryCaseV2(
  root: SealedReferenceRootV2 | null,
  result: TopLevelExecutionResultV2,
  expectedTarget: ChamberVolumesV2,
): Promise<boolean> {
  if (root === null) {
    if (
      result.status !== "dependency-failed" ||
      !("casePayloadSha256" in result)
    )
      return false;
    const expectedPayload = deepFreezeEvidenceV2({
      status: "dependency-failed" as const,
      dependency: "admitted-reference-root" as const,
      targetChamberVolumesM3: expectedTarget,
      targetVolumeBits: wrapVolumesEvidenceV2(expectedTarget),
      solveAttempted: false as const,
    });
    return (
      canonicalJsonStringify(frozenCasePayloadWithoutHashV2(result)) ===
        canonicalJsonStringify(expectedPayload) &&
      result.casePayloadSha256 ===
        (await sha256CanonicalJsonHex(expectedPayload))
    );
  }
  if (
    (result.status !== "equilibrated" &&
      result.status !== "not-equilibrated") ||
    !("casePayloadSha256" in result)
  )
    return false;
  return auditPrimaryPointResultV2(root, result, expectedTarget);
}

async function auditNamedSeedDependencyDiagnosticV2(
  diagnostic: NamedSeedDependencyDiagnosticV2,
  expectedParticipantId: NamedSeedDependencyDiagnosticV2["participantId"],
  expectedSeedOffset: readonly [number, number],
): Promise<boolean> {
  const { payloadSha256, ...body } = diagnostic;
  if (
    diagnostic.participantId !== expectedParticipantId ||
    canonicalJsonStringify(diagnostic.seedOffsetScaledCoordinates) !==
      canonicalJsonStringify(expectedSeedOffset) ||
    payloadSha256 !== (await sha256CanonicalJsonHex(body))
  )
    return false;
  if (diagnostic.stageEvidence === null)
    return (
      diagnostic.status === "execution-exception" &&
      diagnostic.exception !== null
    );
  if (diagnostic.exception !== null) return false;
  const loaded =
    NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg.loadedCoordinates;
  const seed = deepFreezeEvidenceV2({
    septalMidwallCapVolumeM3:
      loaded.septalMidwallCapVolumeM3 +
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2
        .coordinateScales.septalMidwallCapVolumeM3 *
        expectedSeedOffset[0],
    junctionRadiusM:
      loaded.junctionRadiusM +
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2
        .coordinateScales.junctionRadiusM *
        expectedSeedOffset[1],
  });
  const target = freezeVolumesV2(
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1,
  );
  if (diagnostic.status === "fulfilled") {
    const replay = await auditOfficialStageEvidenceLineageV2(
      diagnostic.stageEvidence,
      target,
      0,
      seed,
    );
    return replay.passed;
  }
  if (diagnostic.status === "scientific-failure") {
    const result = diagnostic.stageEvidence.kernelEvidence.stageResult;
    return (
      result.status === "failed" &&
      (await auditFailedOfficialStageEvidenceV2(
        diagnostic.stageEvidence,
        target,
        0,
        seed,
        "scientific-failure",
        result.failureReason,
      ))
    );
  }
  return (
    diagnostic.status === "evidence-audit-failure" &&
    (await auditFailedOfficialStageEvidenceV2(
      diagnostic.stageEvidence,
      target,
      0,
      seed,
      "evidence-audit-failure",
      "evidence-audit-failed",
    ))
  );
}

function independentBranchParticipantDescriptorV2(
  participantId: MainWireNormalAdultPassiveEquilibriumBranchAuditParticipantIdV1,
): Readonly<{
  lineageKind: BranchParticipantV2["lineageKind"];
  seedOffset: readonly [number, number] | null;
}> {
  if (participantId === "primary-zero-offset-canonical-root")
    return Object.freeze({
      lineageKind: "primary-32-stage-diagonal" as const,
      seedOffset: null,
    });
  if (participantId === "alternate-lv-first")
    return Object.freeze({
      lineageKind: "alternate-lv-first-64-stage" as const,
      seedOffset: null,
    });
  if (participantId === "alternate-rv-first")
    return Object.freeze({
      lineageKind: "alternate-rv-first-64-stage" as const,
      seedOffset: null,
    });
  const seedOffsetsById = Object.freeze({
    "seed-minus-0.25-minus-0.25": Object.freeze([-0.25, -0.25] as const),
    "seed-minus-0.25-zero": Object.freeze([-0.25, 0] as const),
    "seed-minus-0.25-plus-0.25": Object.freeze([-0.25, 0.25] as const),
    "seed-zero-minus-0.25": Object.freeze([0, -0.25] as const),
    "seed-zero-zero": Object.freeze([0, 0] as const),
    "seed-zero-plus-0.25": Object.freeze([0, 0.25] as const),
    "seed-plus-0.25-minus-0.25": Object.freeze([0.25, -0.25] as const),
    "seed-plus-0.25-zero": Object.freeze([0.25, 0] as const),
    "seed-plus-0.25-plus-0.25": Object.freeze([0.25, 0.25] as const),
  });
  const seedOffset = seedOffsetsById[participantId];
  return Object.freeze({
    lineageKind: "independent-seed-stage-zero-then-primary-32-stage" as const,
    seedOffset,
  });
}

function independentBranchScheduleV2(
  lineageKind: BranchParticipantV2["lineageKind"],
  target: ChamberVolumesV2,
): readonly ChamberVolumesV2[] {
  const reference =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1;
  if (
    lineageKind === "primary-32-stage-diagonal" ||
    lineageKind === "independent-seed-stage-zero-then-primary-32-stage"
  ) {
    return Object.freeze(
      Array.from({ length: 32 }, (_, zeroBasedIndex) => {
        const k = zeroBasedIndex + 1;
        return freezeVolumesV2({
          LA: target.LA,
          LV: reference.LV + (k / 32) * (target.LV - reference.LV),
          RA: target.RA,
          RV: reference.RV + (k / 32) * (target.RV - reference.RV),
        });
      }),
    );
  }
  return Object.freeze(
    Array.from({ length: 64 }, (_, zeroBasedIndex) => {
      const k = zeroBasedIndex + 1;
      if (lineageKind === "alternate-lv-first-64-stage") {
        return k <= 32
          ? freezeVolumesV2({
              LA: target.LA,
              LV: reference.LV + (k / 32) * (target.LV - reference.LV),
              RA: target.RA,
              RV: reference.RV,
            })
          : freezeVolumesV2({
              LA: target.LA,
              LV: target.LV,
              RA: target.RA,
              RV: reference.RV + ((k - 32) / 32) * (target.RV - reference.RV),
            });
      }
      return k <= 32
        ? freezeVolumesV2({
            LA: target.LA,
            LV: reference.LV,
            RA: target.RA,
            RV: reference.RV + (k / 32) * (target.RV - reference.RV),
          })
        : freezeVolumesV2({
            LA: target.LA,
            LV: reference.LV + ((k - 32) / 32) * (target.LV - reference.LV),
            RA: target.RA,
            RV: target.RV,
          });
    }),
  );
}

async function auditBranchParticipantLineageCollectionV2(
  root: SealedReferenceRootV2,
  result: BranchAuditResultV2,
): Promise<boolean> {
  if (
    result.participants.length !== 12 ||
    result.pairwiseComparisons.length !== 66
  )
    return false;
  const target = freezeVolumesV2(
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1,
  );
  const loaded =
    NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg.loadedCoordinates;
  for (let index = 0; index < result.participants.length; index += 1) {
    const participant = result.participants[index];
    const participantId =
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_BRANCH_AUDIT_PARTICIPANT_ORDER_V1[
        index
      ];
    if (
      participant.participantId !== participantId ||
      participant.stageZeroRootSha256 !==
        root.outcome.admittedReferenceRootSha256 ||
      participant.casePayloadSha256 !==
        (await sha256CanonicalJsonHex(
          branchParticipantCasePayloadWithoutHashV2(participant),
        ))
    )
      return false;
    const descriptor = independentBranchParticipantDescriptorV2(participantId);
    if (
      participant.lineageKind !== descriptor.lineageKind ||
      canonicalJsonStringify(participant.seedOffsetScaledCoordinates) !==
        canonicalJsonStringify(descriptor.seedOffset)
    )
      return false;
    let expectedInitial: MainWirePassiveEquilibriumInternalCoordinatesV2;
    if (descriptor.seedOffset === null) {
      if (
        canonicalJsonStringify(participant.stageZeroEvidence) !==
          canonicalJsonStringify(root.stageZeroEvidence) ||
        canonicalJsonStringify(participant.stageZeroKernelEvidence) !==
          canonicalJsonStringify({
            chamberVolumesM3: root.stageZeroEvidence.chamberVolumesM3,
            kernelEvidence: root.stageZeroEvidence.kernelEvidence,
          })
      )
        return false;
      expectedInitial = root.terminalCoordinates;
    } else {
      const seed = deepFreezeEvidenceV2({
        septalMidwallCapVolumeM3:
          loaded.septalMidwallCapVolumeM3 +
          MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2
            .coordinateScales.septalMidwallCapVolumeM3 *
            descriptor.seedOffset[0],
        junctionRadiusM:
          loaded.junctionRadiusM +
          MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2
            .coordinateScales.junctionRadiusM *
            descriptor.seedOffset[1],
      });
      if (
        participant.status === "participant-failed" &&
        participant.failurePhase === "stage-zero-solver"
      ) {
        if (
          participant.stageZeroKernelEvidence !== null ||
          participant.stageZeroEvidence !== null ||
          participant.homotopyStages.length !== 0 ||
          participant.failedHomotopyStageKernelEvidence !== null ||
          participant.failedHomotopyStage !== null ||
          participant.exception === null ||
          participant.failureReason !== "stage-zero-solver-execution-failed"
        )
          return false;
        continue;
      }
      if (
        participant.status === "participant-failed" &&
        participant.failurePhase === "stage-zero-auditor" &&
        participant.stageZeroEvidence === null
      ) {
        if (
          participant.stageZeroKernelEvidence === null ||
          participant.homotopyStages.length !== 0 ||
          participant.failedHomotopyStageKernelEvidence !== null ||
          participant.failedHomotopyStage !== null ||
          participant.exception === null ||
          participant.failureReason !== "stage-zero-auditor-execution-failed" ||
          !(await auditOfficialStageKernelEvidenceStructureV2(
            participant.stageZeroKernelEvidence,
            target,
            0,
            seed,
          ))
        )
          return false;
        continue;
      }
      if (
        participant.stageZeroEvidence === null ||
        participant.stageZeroKernelEvidence === null
      )
        return false;
      if (
        canonicalJsonStringify(participant.stageZeroKernelEvidence) !==
          canonicalJsonStringify({
            chamberVolumesM3: participant.stageZeroEvidence.chamberVolumesM3,
            kernelEvidence: participant.stageZeroEvidence.kernelEvidence,
          }) ||
        (participant.homotopyStages.length !== 0 &&
          participant.status === "participant-failed" &&
          (participant.failurePhase === "stage-zero-auditor" ||
            participant.failurePhase === "stage-zero-scientific"))
      )
        return false;
      if (
        participant.status === "participant-failed" &&
        (participant.failurePhase === "stage-zero-auditor" ||
          participant.failurePhase === "stage-zero-scientific")
      ) {
        const validFailedStageZero = await auditFailedOfficialStageEvidenceV2(
          participant.stageZeroEvidence,
          target,
          0,
          seed,
          participant.failurePhase === "stage-zero-scientific"
            ? "scientific-failure"
            : "evidence-audit-failure",
          participant.failureReason,
        );
        if (
          !validFailedStageZero ||
          participant.failedHomotopyStageKernelEvidence !== null ||
          participant.failedHomotopyStage !== null ||
          participant.exception !== null
        )
          return false;
        continue;
      }
      const stageZeroReplay = await auditOfficialStageEvidenceLineageV2(
        participant.stageZeroEvidence,
        target,
        0,
        seed,
      );
      if (
        !stageZeroReplay.passed ||
        stageZeroReplay.terminalCoordinates === null
      )
        return false;
      expectedInitial = stageZeroReplay.terminalCoordinates;
    }
    const expectedSchedule = independentBranchScheduleV2(
      participant.lineageKind,
      target,
    );
    const expectedCompletedStageCount =
      participant.status === "participant-equilibrated" ||
      participant.failurePhase === "terminal-schur"
        ? expectedSchedule.length
        : participant.homotopyStages.length;
    if (
      participant.homotopyStages.length !== expectedCompletedStageCount ||
      expectedCompletedStageCount > expectedSchedule.length
    )
      return false;
    for (
      let stageIndex = 0;
      stageIndex < participant.homotopyStages.length;
      stageIndex += 1
    ) {
      const replay = await auditOfficialStageEvidenceLineageV2(
        participant.homotopyStages[stageIndex],
        expectedSchedule[stageIndex],
        stageIndex + 1,
        expectedInitial,
      );
      if (!replay.passed || replay.terminalCoordinates === null) return false;
      expectedInitial = replay.terminalCoordinates;
    }
    if (participant.status === "participant-failed") {
      if (participant.failurePhase === "homotopy-stage-solver") {
        if (
          participant.homotopyStages.length >= expectedSchedule.length ||
          participant.failedHomotopyStageKernelEvidence !== null ||
          participant.failedHomotopyStage !== null ||
          participant.exception === null ||
          participant.failureReason !== "homotopy-stage-solver-execution-failed"
        )
          return false;
        continue;
      }
      if (
        participant.failurePhase === "homotopy-stage-auditor" ||
        participant.failurePhase === "homotopy-stage-scientific"
      ) {
        const failedStageIndex = participant.homotopyStages.length;
        if (
          participant.failurePhase === "homotopy-stage-auditor" &&
          participant.failedHomotopyStage === null
        ) {
          if (
            failedStageIndex >= expectedSchedule.length ||
            participant.failedHomotopyStageKernelEvidence === null ||
            participant.exception === null ||
            participant.failureReason !==
              "homotopy-stage-auditor-execution-failed" ||
            !(await auditOfficialStageKernelEvidenceStructureV2(
              participant.failedHomotopyStageKernelEvidence,
              expectedSchedule[failedStageIndex],
              failedStageIndex + 1,
              expectedInitial,
            ))
          )
            return false;
          continue;
        }
        if (
          failedStageIndex >= expectedSchedule.length ||
          participant.failedHomotopyStageKernelEvidence === null ||
          participant.failedHomotopyStage === null ||
          canonicalJsonStringify(
            participant.failedHomotopyStageKernelEvidence,
          ) !==
            canonicalJsonStringify({
              chamberVolumesM3:
                participant.failedHomotopyStage.chamberVolumesM3,
              kernelEvidence: participant.failedHomotopyStage.kernelEvidence,
            }) ||
          participant.exception !== null ||
          !(await auditFailedOfficialStageEvidenceV2(
            participant.failedHomotopyStage,
            expectedSchedule[failedStageIndex],
            failedStageIndex + 1,
            expectedInitial,
            participant.failurePhase === "homotopy-stage-scientific"
              ? "scientific-failure"
              : "evidence-audit-failure",
            participant.failureReason,
          ))
        )
          return false;
        continue;
      }
      if (
        participant.failurePhase !== "terminal-schur" ||
        participant.failedHomotopyStageKernelEvidence !== null ||
        participant.failedHomotopyStage !== null
      )
        return false;
      let failedTerminalReplay: MainWireNormalAdultPassiveEquilibriumUnbrandedTerminalProjectionV2 | null;
      try {
        failedTerminalReplay =
          evaluateMainWireNormalAdultPassiveEquilibriumCanonicalTerminalProjectionV2(
            target,
            expectedInitial,
          );
      } catch (error) {
        if (
          participant.failureReason !== "terminal-schur-execution-failed" ||
          participant.exception === null ||
          canonicalJsonStringify(participant.exception) !==
            canonicalJsonStringify(sanitizedExceptionEvidenceV2(error))
        )
          return false;
        continue;
      }
      if (
        failedTerminalReplay !== null ||
        participant.failureReason !== "qualified-terminal-schur-failed" ||
        participant.exception !== null
      )
        return false;
      continue;
    }
    const terminalReplay =
      evaluateMainWireNormalAdultPassiveEquilibriumCanonicalTerminalProjectionV2(
        target,
        expectedInitial,
      );
    if (
      terminalReplay === null ||
      canonicalJsonStringify(terminalReplay) !==
        canonicalJsonStringify(participant.terminal.terminalProjection)
    )
      return false;
  }
  return true;
}

async function auditFailedOfficialStageEvidenceV2(
  stage: MainWireNormalAdultPassiveEquilibriumOfficialStageEvidenceV2,
  expectedChamberVolumesM3: ChamberVolumesV2,
  expectedStageIndex: number,
  expectedInitialCoordinates: MainWirePassiveEquilibriumInternalCoordinatesV2,
  expectedFailureKind: "scientific-failure" | "evidence-audit-failure",
  expectedFailureReason: string,
): Promise<boolean> {
  const envelope = stage.kernelEvidence;
  const result = envelope.stageResult;
  const replayedAudit =
    await auditMainWirePassiveEquilibriumStageKernelV2(envelope);
  const structuralAndAuditBindingPassed =
    canonicalJsonStringify(stage.chamberVolumesM3) ===
      canonicalJsonStringify(expectedChamberVolumesM3) &&
    result.stageIndex === expectedStageIndex &&
    canonicalJsonStringify(result.initialCoordinates) ===
      canonicalJsonStringify(
        wrapCoordinatesEvidenceV2(expectedInitialCoordinates),
      ) &&
    envelope.solverPolicyId ===
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2_ID &&
    envelope.solverPolicySha256 === FROZEN_POINT_SOLVER_POLICY_V2_SHA256 &&
    envelope.stageResultSha256 === (await sha256CanonicalJsonHex(result)) &&
    canonicalJsonStringify(envelope.iterationEvidenceSha256) ===
      canonicalJsonStringify(
        await Promise.all(
          result.iterations.map((iteration) =>
            sha256CanonicalJsonHex(iteration),
          ),
        ),
      ) &&
    canonicalJsonStringify(replayedAudit) ===
      canonicalJsonStringify(stage.kernelAudit) &&
    replayedAudit.reportSha256 ===
      (await sha256CanonicalJsonHex(replayedAudit.report));
  if (!structuralAndAuditBindingPassed) return false;
  if (expectedFailureKind === "evidence-audit-failure")
    return (
      replayedAudit.report.auditStatus === "failed" &&
      expectedFailureReason === "evidence-audit-failed"
    );
  return (
    replayedAudit.report.auditStatus === "passed" &&
    result.status === "failed" &&
    result.failureReason === expectedFailureReason
  );
}

async function auditExactJournalLineageV2(
  context: OfficialContextV2,
  referenceRootOutcome: MainWireNormalAdultPassiveEquilibriumReferenceRootOutcomeV2,
  executions: readonly TopLevelExecutionV2[],
  journalLineage: readonly JournalEnvelopeV2[],
  terminalStatus: "pass" | "failed" | null,
): Promise<boolean> {
  const states: readonly JournalStateV2[] =
    terminalStatus === null
      ? ["reserved", "reference-root", "literal", "canonical", "branch-audit"]
      : [
          "reserved",
          "reference-root",
          "literal",
          "canonical",
          "branch-audit",
          terminalStatus === "pass" ? "completed" : "failed",
        ];
  if (journalLineage.length !== states.length || executions.length !== 3)
    return false;
  let previousPayloadSha256: string | null = null;
  for (let index = 0; index < states.length; index += 1) {
    const expectedExecutions =
      index < 2
        ? []
        : index === 2
          ? executions.slice(0, 1)
          : index === 3
            ? executions.slice(0, 2)
            : executions.slice(0, 3);
    const expectedPayload = deepFreezeEvidenceV2({
      attemptId:
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ATTEMPT_V2,
      state: states[index],
      declarationCommitSha: DECLARATION_D_SHA,
      implementationCommitSha:
        context.preflight.manifest.payload.implementationCommitSha,
      observedSealCommitSha: context.preflight.observedSealCommitSha,
      sealManifestSha256: context.preflight.manifest.sealManifestSha256,
      reservationPayload: context.reservationPayload,
      commonDirReservationSha256: context.commonDirReservationSha256,
      previousJournalPayloadSha256: previousPayloadSha256,
      referenceRootOutcome: index === 0 ? null : referenceRootOutcome,
      executions: Object.freeze(expectedExecutions),
      terminalStatus: index === 5 ? terminalStatus : null,
    });
    const expectedEnvelope = deepFreezeEvidenceV2({
      schemaId:
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_JOURNAL_SCHEMA_V2,
      payload: expectedPayload,
      payloadSha256: await sha256CanonicalJsonHex(expectedPayload),
    });
    if (
      canonicalJsonStringify(journalLineage[index]) !==
      canonicalJsonStringify(expectedEnvelope)
    )
      return false;
    previousPayloadSha256 = expectedEnvelope.payloadSha256;
  }
  return true;
}

async function auditRetainedReferenceRootOutcomeV2(
  context: OfficialContextV2,
  referenceRoot: Readonly<{
    outcome: MainWireNormalAdultPassiveEquilibriumReferenceRootOutcomeV2;
    sealedRoot: SealedReferenceRootV2 | null;
  }>,
): Promise<boolean> {
  const { outcome, sealedRoot } = referenceRoot;
  if (outcome.status === "admitted") {
    const payload = outcome.admittedReferenceRootPayload;
    const terminalCoordinates = unwrapCandidateCoordinatesV2(
      payload.stageKernelEvidence.kernelEvidence.stageResult.terminalCandidate,
    );
    const retainedKernelAudit =
      outcome.referenceRootAuditorReport.replayedKernelAuditorReport;
    if (retainedKernelAudit === null) return false;
    const expectedStageZeroEvidence = deepFreezeEvidenceV2({
      chamberVolumesM3: payload.stageKernelEvidence.chamberVolumesM3,
      kernelEvidence: payload.stageKernelEvidence.kernelEvidence,
      kernelAudit: retainedKernelAudit,
    });
    const rootInputEvidence = (({
      stageKernelEvidence: _stageKernelEvidence,
      terminalProjection: _terminalProjection,
      stationarityPassed: _stationarityPassed,
      strictStabilityPassed: _strictStabilityPassed,
      ...rootInput
    }) => deepFreezeEvidenceV2(rootInput))(payload);
    const initialCoordinates = deepFreezeEvidenceV2({
      septalMidwallCapVolumeM3: numberFromFloat64EvidenceV2(
        rootInputEvidence.initialCoordinates.septalMidwallCapVolumeM3,
      ),
      junctionRadiusM: numberFromFloat64EvidenceV2(
        rootInputEvidence.initialCoordinates.junctionRadiusM,
      ),
    });
    const replayedAttempt: Extract<
      ReferenceRootAttemptEvidenceV2,
      Readonly<{ status: "scientific-success" }>
    > = deepFreezeEvidenceV2({
      rootInputEvidence,
      status: "scientific-success",
      initialCoordinates,
      stageKernelEvidence: payload.stageKernelEvidence,
      kernelAudit: retainedKernelAudit,
      terminalProjection: payload.terminalProjection,
      failureReason: null,
      exception: null,
    });
    let independentlyReplayedReport: RootAuditorReportV2;
    let independentlyReplayedReportSha256: string;
    try {
      independentlyReplayedReport = await auditReferenceRootAttemptV2(
        context,
        freezeVolumesV2(
          MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1,
        ),
        replayedAttempt,
        payload,
        outcome.admittedReferenceRootSha256,
      );
      independentlyReplayedReportSha256 = await sha256CanonicalJsonHex(
        independentlyReplayedReport,
      );
    } catch {
      return false;
    }
    return (
      sealedRoot !== null &&
      sealedRoot.outcome === outcome &&
      canonicalJsonStringify(sealedRoot.outcome) ===
        canonicalJsonStringify(outcome) &&
      canonicalJsonStringify(sealedRoot.terminalCoordinates) ===
        canonicalJsonStringify(terminalCoordinates) &&
      canonicalJsonStringify(sealedRoot.stageZeroEvidence) ===
        canonicalJsonStringify(expectedStageZeroEvidence) &&
      (await sha256CanonicalJsonHex(payload)) ===
        outcome.admittedReferenceRootSha256 &&
      (await sha256CanonicalJsonHex(outcome.referenceRootAuditorReport)) ===
        outcome.referenceRootAuditorReportSha256 &&
      canonicalJsonStringify(independentlyReplayedReport) ===
        canonicalJsonStringify(outcome.referenceRootAuditorReport) &&
      independentlyReplayedReportSha256 ===
        outcome.referenceRootAuditorReportSha256 &&
      outcome.referenceRootAuditorReport.status === "passed"
    );
  }
  if (sealedRoot !== null) return false;
  const referenceVolumes = freezeVolumesV2(
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1,
  );
  const initialCoordinates = deepFreezeEvidenceV2({
    septalMidwallCapVolumeM3:
      NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg.loadedCoordinates
        .septalMidwallCapVolumeM3,
    junctionRadiusM:
      NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg.loadedCoordinates
        .junctionRadiusM,
  });
  if (
    canonicalJsonStringify(
      outcome.referenceRootAttemptEvidence.rootInputEvidence,
    ) !==
      canonicalJsonStringify(
        referenceRootInputEvidenceV2(
          context,
          referenceVolumes,
          initialCoordinates,
        ),
      ) ||
    canonicalJsonStringify(
      outcome.referenceRootAttemptEvidence.initialCoordinates,
    ) !== canonicalJsonStringify(initialCoordinates)
  )
    return false;
  const attempt = outcome.referenceRootAttemptEvidence;
  const rawStageStructurePassed =
    attempt.stageKernelEvidence === null
      ? false
      : await auditOfficialStageKernelEvidenceStructureV2(
          attempt.stageKernelEvidence,
          referenceVolumes,
          0,
          initialCoordinates,
        );
  const retainedKernelAuditBindingPassed =
    attempt.kernelAudit === null
      ? false
      : attempt.kernelAudit.reportSha256 ===
        (await sha256CanonicalJsonHex(attempt.kernelAudit.report));
  const attemptEvidenceShapePassed = (() => {
    if (attempt.status === "solver-execution-failed")
      return (
        attempt.stageKernelEvidence === null &&
        attempt.kernelAudit === null &&
        attempt.terminalProjection === null &&
        attempt.failureReason === "reference-root-solver-execution-failed" &&
        attempt.exception !== null
      );
    if (attempt.status === "kernel-auditor-execution-failed")
      return (
        rawStageStructurePassed &&
        attempt.kernelAudit === null &&
        attempt.terminalProjection === null &&
        attempt.failureReason ===
          "reference-root-kernel-auditor-execution-failed" &&
        attempt.exception !== null
      );
    if (attempt.status === "terminal-projection-execution-failed")
      return (
        rawStageStructurePassed &&
        retainedKernelAuditBindingPassed &&
        attempt.kernelAudit.report.auditStatus === "passed" &&
        attempt.stageKernelEvidence.kernelEvidence.stageResult.status ===
          "converged" &&
        attempt.terminalProjection === null &&
        attempt.failureReason ===
          "reference-root-terminal-projection-execution-failed" &&
        attempt.exception !== null
      );
    if (attempt.status === "evidence-audit-failed")
      return (
        rawStageStructurePassed &&
        retainedKernelAuditBindingPassed &&
        attempt.kernelAudit.report.auditStatus === "failed" &&
        attempt.terminalProjection === null &&
        attempt.failureReason ===
          "reference-root-kernel-evidence-audit-failed" &&
        attempt.exception === null
      );
    if (attempt.status === "scientific-failure")
      return (
        rawStageStructurePassed &&
        retainedKernelAuditBindingPassed &&
        attempt.kernelAudit.report.auditStatus === "passed" &&
        attempt.terminalProjection === null &&
        attempt.exception === null &&
        (attempt.failurePhase === "stage-solve"
          ? attempt.stageKernelEvidence.kernelEvidence.stageResult.status ===
              "failed" &&
            attempt.failureReason ===
              attempt.stageKernelEvidence.kernelEvidence.stageResult
                .failureReason
          : attempt.stageKernelEvidence.kernelEvidence.stageResult.status ===
              "converged" &&
            attempt.failureReason === "qualified-terminal-schur-failed")
      );
    return (
      rawStageStructurePassed &&
      retainedKernelAuditBindingPassed &&
      attempt.kernelAudit.report.auditStatus === "passed" &&
      attempt.stageKernelEvidence.kernelEvidence.stageResult.status ===
        "converged" &&
      attempt.terminalProjection !== null &&
      attempt.failureReason === null &&
      attempt.exception === null
    );
  })();
  if (!attemptEvidenceShapePassed) return false;
  const auditOutcome = outcome.auditOutcome;
  const closedConjunctionPassed = (() => {
    if (auditOutcome.status === "not-run")
      return (
        (attempt.status === "solver-execution-failed" ||
          attempt.status === "terminal-projection-execution-failed" ||
          (attempt.status === "scientific-success" &&
            outcome.rootFailureReason ===
              "reference-root-pre-audit-sealing-failed")) &&
        (attempt.status === "scientific-success" ||
          outcome.rootFailureReason === attempt.failureReason) &&
        auditOutcome.referenceRootAuditorReport === null &&
        auditOutcome.referenceRootAuditorReportSha256 === null &&
        auditOutcome.auditorNotRunReason === outcome.rootFailureReason
      );
    if (auditOutcome.status === "execution-failed")
      return (
        ((attempt.status === "kernel-auditor-execution-failed" &&
          outcome.rootFailureReason === attempt.failureReason) ||
          ((attempt.status === "scientific-success" ||
            attempt.status === "scientific-failure" ||
            attempt.status === "evidence-audit-failed") &&
            outcome.rootFailureReason ===
              "reference-root-independent-auditor-execution-failed")) &&
        auditOutcome.referenceRootAuditorReport === null &&
        auditOutcome.referenceRootAuditorReportSha256 === null &&
        auditOutcome.auditorNotRunReason === null &&
        auditOutcome.auditorExecutionFailure !== null
      );
    if (auditOutcome.status === "failed")
      return (
        ((attempt.status === "evidence-audit-failed" &&
          outcome.rootFailureReason === attempt.failureReason) ||
          (attempt.status !== "evidence-audit-failed" &&
            outcome.rootFailureReason ===
              "reference-root-independent-audit-failed")) &&
        auditOutcome.referenceRootAuditorReport.status === "failed" &&
        auditOutcome.auditorNotRunReason === null &&
        auditOutcome.auditorExecutionFailure === null
      );
    if (auditOutcome.status === "passed-but-scientific-failure")
      return (
        attempt.status === "scientific-failure" &&
        outcome.rootFailureReason === attempt.failureReason &&
        auditOutcome.referenceRootAuditorReport.status === "passed" &&
        auditOutcome.auditorNotRunReason === null &&
        auditOutcome.auditorExecutionFailure === null
      );
    return (
      attempt.status === "scientific-success" &&
      outcome.rootFailureReason === "reference-root-sealing-failed" &&
      auditOutcome.referenceRootAuditorReport.status === "passed" &&
      auditOutcome.auditorNotRunReason === null &&
      auditOutcome.auditorExecutionFailure === null
    );
  })();
  if (!closedConjunctionPassed) return false;

  const replayRetainedReport = async (): Promise<RootAuditorReportV2> => {
    if (
      attempt.status === "solver-execution-failed" ||
      attempt.status === "kernel-auditor-execution-failed" ||
      attempt.status === "terminal-projection-execution-failed"
    )
      throw new Error(
        "retained root attempt has no independently auditable report",
      );
    if (attempt.status !== "scientific-success")
      return auditReferenceRootAttemptV2(
        context,
        referenceVolumes,
        attempt,
        null,
        null,
      );
    const reconstructedPayload = deepFreezeEvidenceV2({
      ...attempt.rootInputEvidence,
      stageKernelEvidence: attempt.stageKernelEvidence,
      terminalProjection: attempt.terminalProjection,
      stationarityPassed: true as const,
      strictStabilityPassed: true as const,
    });
    const reconstructedPayloadSha256 =
      await sha256CanonicalJsonHex(reconstructedPayload);
    return auditReferenceRootAttemptV2(
      context,
      referenceVolumes,
      attempt,
      reconstructedPayload,
      reconstructedPayloadSha256,
    );
  };
  if (auditOutcome.status === "passed-but-scientific-failure") {
    const replay = await replayRetainedReport();
    return (
      replay.status === "passed" &&
      canonicalJsonStringify(replay) ===
        canonicalJsonStringify(auditOutcome.referenceRootAuditorReport) &&
      auditOutcome.referenceRootAuditorReportSha256 ===
        (await sha256CanonicalJsonHex(replay))
    );
  }
  if (auditOutcome.status === "failed") {
    const replay = await replayRetainedReport();
    return (
      replay.status === "failed" &&
      canonicalJsonStringify(replay) ===
        canonicalJsonStringify(auditOutcome.referenceRootAuditorReport) &&
      auditOutcome.referenceRootAuditorReportSha256 ===
        (await sha256CanonicalJsonHex(replay))
    );
  }
  if (auditOutcome.status === "passed-but-sealing-failed") {
    const replay = await replayRetainedReport();
    return (
      replay.status === "passed" &&
      canonicalJsonStringify(replay) ===
        canonicalJsonStringify(auditOutcome.referenceRootAuditorReport) &&
      auditOutcome.referenceRootAuditorReportSha256 ===
        (await sha256CanonicalJsonHex(replay))
    );
  }
  return true;
}

function independentlyReplayTopLevelStatusAndExceptionV2(
  execution: TopLevelExecutionV2,
): boolean {
  const { result } = execution;
  let expectedStatus: ExecutionStatusV2;
  let expectedException: SanitizedExceptionV2 | null;
  if (result.status === "execution-exception") {
    const expectedPhase =
      execution.executionId === "literal-midpoint-primary-v2"
        ? "literal"
        : execution.executionId === "canonical-index16-primary-v2"
          ? "canonical"
          : "branch-audit";
    if (result.phase !== expectedPhase || execution.exception === null)
      return false;
    expectedStatus = "execution-exception";
    expectedException = execution.exception;
  } else if (result.status === "dependency-failed") {
    const branchShape = "namedSeedStageZeroDiagnostics" in result;
    if (branchShape !== (execution.executionId === "reference-branch-audit-v2"))
      return false;
    expectedStatus = "dependency-failed";
    expectedException = null;
  } else if (execution.executionId === "reference-branch-audit-v2") {
    if (!("independentAuditorReport" in result)) return false;
    if (!independentlyReplayBranchEvidenceOuterBindingV2(result)) return false;
    const participantException = result.result.participants.find(
      (participant) =>
        participant.status === "participant-failed" &&
        participant.exception !== null,
    );
    const participantAuditFailure = result.result.participants.some(
      (participant) =>
        participant.status === "participant-failed" &&
        (participant.failurePhase === "stage-zero-auditor" ||
          participant.failurePhase === "homotopy-stage-auditor"),
    );
    expectedStatus =
      result.independentAuditorReport.status === "execution-failed" ||
      participantException !== undefined
        ? "execution-exception"
        : result.independentAuditorReport.status === "failed" ||
            participantAuditFailure
          ? "evidence-audit-failure"
          : result.status === "branch-agreement-established"
            ? "fulfilled"
            : "scientific-failure";
    expectedException =
      result.independentAuditorReport.status === "execution-failed"
        ? result.independentAuditorReport.exception
        : participantException?.status === "participant-failed"
          ? participantException.exception
          : null;
  } else {
    if (
      result.status !== "equilibrated" &&
      result.status !== "not-equilibrated"
    )
      return false;
    expectedStatus =
      result.status === "equilibrated"
        ? "fulfilled"
        : result.exception !== null
          ? "execution-exception"
          : result.failurePhase === "stage-auditor"
            ? "evidence-audit-failure"
            : "scientific-failure";
    expectedException =
      result.status === "not-equilibrated" ? result.exception : null;
  }
  return (
    execution.status === expectedStatus &&
    canonicalJsonStringify(execution.exception) ===
      canonicalJsonStringify(expectedException)
  );
}

function independentlyReplayBranchEvidenceOuterBindingV2(
  evidence: BranchAuditEvidenceV2,
): boolean {
  const expectedAdmitted =
    evidence.result.status === "branch-agreement-established" &&
    evidence.result.branchAgreementEstablished === true &&
    evidence.independentAuditorReport.status === "passed";
  return (
    evidence.status ===
      (expectedAdmitted
        ? "branch-agreement-established"
        : "branch-audit-failed") &&
    evidence.branchAgreementEstablished === expectedAdmitted
  );
}

async function auditPreAdmissionEngineeringEvidenceV2(
  context: OfficialContextV2,
  referenceRoot: Readonly<{
    outcome: MainWireNormalAdultPassiveEquilibriumReferenceRootOutcomeV2;
    sealedRoot: SealedReferenceRootV2 | null;
  }>,
  executions: readonly TopLevelExecutionV2[],
  journalLineage: readonly JournalEnvelopeV2[],
): Promise<PreAdmissionIndependentAuditorReportV2> {
  const orderedExecutionAggregateSha256 =
    await sha256CanonicalJsonHex(executions);
  const rootPayloadAndReportReplayPassed =
    await auditRetainedReferenceRootOutcomeV2(context, referenceRoot);
  const expectedExecutionIds = [
    "literal-midpoint-primary-v2",
    "canonical-index16-primary-v2",
    "reference-branch-audit-v2",
  ] as const;
  const executionOrderAndEnvelopeHashReplayPassed =
    executions.length === 3 &&
    executions.every(
      (execution, index) =>
        execution.executionId === expectedExecutionIds[index],
    ) &&
    executions.every(independentlyReplayTopLevelStatusAndExceptionV2);
  const envelopeHashesPassed = (
    await Promise.all(
      executions.map((execution) =>
        sha256CanonicalJsonHex({
          executionId: execution.executionId,
          status: execution.status,
          result: execution.result,
          exception: execution.exception,
        }),
      ),
    )
  ).every((digest, index) => digest === executions[index]?.payloadSha256);
  const root = referenceRoot.sealedRoot;
  const literal = executions[0]?.result;
  const canonical = executions[1]?.result;
  const branch = executions[2]?.result;
  const literalCaseReplayPassed =
    literal !== undefined &&
    (await auditFrozenPrimaryCaseV2(
      root,
      literal,
      frozenTargetVolumesFromBitsV2({
        LA: "3f0e61ead6a30f64",
        LV: "3f19e65b134c0d1f",
        RA: "3f1306c2e7c6a33d",
        RV: "3f1d232675b58ec3",
      }),
    ));
  const canonicalCaseReplayPassed =
    canonical !== undefined &&
    (await auditFrozenPrimaryCaseV2(
      root,
      canonical,
      frozenTargetVolumesFromBitsV2({
        LA: "3f0e61ead6a30f64",
        LV: "3f19e65b134c0d20",
        RA: "3f1306c2e7c6a33d",
        RV: "3f1d232675b58ec2",
      }),
    ));
  const branchEvidence =
    branch !== undefined &&
    (branch.status === "branch-agreement-established" ||
      branch.status === "branch-audit-failed") &&
    "result" in branch
      ? (branch as BranchAuditEvidenceV2)
      : undefined;
  const dependencyBranch =
    branch?.status === "dependency-failed" &&
    "namedSeedStageZeroDiagnostics" in branch
      ? (branch as DependencyFailedBranchExecutionV2)
      : undefined;
  let branchIndependentReportReplayPassed = false;
  let branchParticipantLineageReplayPassed = false;
  if (root !== null && branchEvidence !== undefined) {
    try {
      const recomputedResultSha256 = await sha256CanonicalJsonHex(
        branchEvidence.result,
      );
      const replayedReport = await auditReferenceBranchResultV2(
        root,
        branchEvidence.result,
        recomputedResultSha256,
      );
      branchIndependentReportReplayPassed =
        branchEvidence.resultSha256 === recomputedResultSha256 &&
        canonicalJsonStringify(replayedReport) ===
          canonicalJsonStringify(branchEvidence.independentAuditorReport) &&
        branchEvidence.independentAuditorReportSha256 ===
          (await sha256CanonicalJsonHex(replayedReport));
      branchParticipantLineageReplayPassed =
        replayedReport.participantStageLineageReplayPassed;
    } catch {
      branchIndependentReportReplayPassed = false;
      branchParticipantLineageReplayPassed = false;
    }
  }
  const namedSeedCaseReplayPassed =
    branchEvidence !== undefined
      ? branchParticipantLineageReplayPassed &&
        (
          await Promise.all(
            (["seed-zero-plus-0.25", "seed-plus-0.25-plus-0.25"] as const).map(
              async (participantId) => {
                const participant = branchEvidence.result.participants.find(
                  (candidate) => candidate.participantId === participantId,
                );
                return (
                  participant !== undefined &&
                  participant.casePayloadSha256 ===
                    (await sha256CanonicalJsonHex(
                      branchParticipantCasePayloadWithoutHashV2(participant),
                    ))
                );
              },
            ),
          )
        ).every(Boolean)
      : dependencyBranch !== undefined &&
        dependencyBranch.fullBranchAuditAttempted === false &&
        dependencyBranch.allRequiredDependencyAvailableWorkAttempted === true &&
        dependencyBranch.namedSeedStageZeroDiagnostics.length === 2 &&
        (await auditNamedSeedDependencyDiagnosticV2(
          dependencyBranch.namedSeedStageZeroDiagnostics[0],
          "seed-zero-plus-0.25",
          [0, 0.25],
        )) &&
        (await auditNamedSeedDependencyDiagnosticV2(
          dependencyBranch.namedSeedStageZeroDiagnostics[1],
          "seed-plus-0.25-plus-0.25",
          [0.25, 0.25],
        ));
  const branchResultAndAllStageReplayPassed =
    root !== null && branchEvidence !== undefined
      ? independentlyReplayBranchEvidenceOuterBindingV2(branchEvidence) &&
        branchIndependentReportReplayPassed &&
        branchEvidence.independentAuditorReport.status === "passed" &&
        branchParticipantLineageReplayPassed
      : root === null && dependencyBranch !== undefined
        ? namedSeedCaseReplayPassed
        : false;
  const journalChainReplayPassed = await auditExactJournalLineageV2(
    context,
    referenceRoot.outcome,
    executions,
    journalLineage,
    null,
  );
  const fourCaseThreeExecutionCoveragePassed =
    literalCaseReplayPassed &&
    canonicalCaseReplayPassed &&
    namedSeedCaseReplayPassed &&
    branchResultAndAllStageReplayPassed &&
    executions.every((execution) => execution.status === "fulfilled");
  const passed =
    rootPayloadAndReportReplayPassed &&
    executionOrderAndEnvelopeHashReplayPassed &&
    envelopeHashesPassed &&
    fourCaseThreeExecutionCoveragePassed &&
    journalChainReplayPassed;
  return deepFreezeEvidenceV2({
    reportId:
      "main-wire-normal-adult-passive-equilibrium-pre-admission-independent-auditor-v2" as const,
    status: passed ? ("passed" as const) : ("failed" as const),
    rootPayloadAndReportReplayPassed,
    executionOrderAndEnvelopeHashReplayPassed:
      executionOrderAndEnvelopeHashReplayPassed && envelopeHashesPassed,
    literalCaseReplayPassed,
    canonicalCaseReplayPassed,
    namedSeedCaseReplayPassed,
    branchResultAndAllStageReplayPassed,
    journalChainReplayPassed,
    fourCaseThreeExecutionCoveragePassed,
    orderedExecutionAggregateSha256,
    firstMismatchId: !rootPayloadAndReportReplayPassed
      ? "root"
      : !executionOrderAndEnvelopeHashReplayPassed || !envelopeHashesPassed
        ? "top-level-envelopes"
        : !literalCaseReplayPassed
          ? "literal-case"
          : !canonicalCaseReplayPassed
            ? "canonical-case"
            : !namedSeedCaseReplayPassed
              ? "named-seed-cases"
              : !branchResultAndAllStageReplayPassed
                ? "branch-all-stage-replay"
                : !journalChainReplayPassed
                  ? "journal-chain"
                  : null,
    exception: null,
  });
}

/**
 * The only official engineering-evidence entry point. It intentionally accepts
 * no caller input: Git/seal/authority/reservation state is read and verified
 * before the private official context can exist or any numerical owner runs.
 */
export async function runMainWireNormalAdultPassiveEquilibriumEngineeringEvidenceV2(): Promise<MainWireNormalAdultPassiveEquilibriumOfficialEngineeringArtifactV2> {
  const preflight = await officialPreflightV2();
  const context = await reserveAttemptAndMintContextV2(preflight);
  const journalLineage: JournalEnvelopeV2[] = [context.reservedJournal];
  const executions: TopLevelExecutionV2[] = [];

  const referenceRoot = await solveAndSealSharedReferenceRootV2(context);
  let currentJournal = await transitionJournalV2(
    context,
    context.reservedJournal,
    "reference-root",
    referenceRoot.outcome,
    executions,
    null,
  );
  journalLineage.push(currentJournal);

  const literalTarget = frozenTargetVolumesFromBitsV2({
    LA: "3f0e61ead6a30f64",
    LV: "3f19e65b134c0d1f",
    RA: "3f1306c2e7c6a33d",
    RV: "3f1d232675b58ec3",
  });
  const literalExecution = await runPrimaryTopLevelExecutionV2(
    "literal-midpoint-primary-v2",
    "literal",
    context,
    referenceRoot.sealedRoot,
    literalTarget,
  );
  executions.push(literalExecution);
  currentJournal = await transitionJournalV2(
    context,
    currentJournal,
    "literal",
    referenceRoot.outcome,
    executions,
    null,
  );
  journalLineage.push(currentJournal);

  const canonicalTarget = frozenTargetVolumesFromBitsV2({
    LA: "3f0e61ead6a30f64",
    LV: "3f19e65b134c0d20",
    RA: "3f1306c2e7c6a33d",
    RV: "3f1d232675b58ec2",
  });
  const canonicalExecution = await runPrimaryTopLevelExecutionV2(
    "canonical-index16-primary-v2",
    "canonical",
    context,
    referenceRoot.sealedRoot,
    canonicalTarget,
  );
  executions.push(canonicalExecution);
  currentJournal = await transitionJournalV2(
    context,
    currentJournal,
    "canonical",
    referenceRoot.outcome,
    executions,
    null,
  );
  journalLineage.push(currentJournal);

  const branchExecution = await runBranchTopLevelExecutionV2(
    context,
    referenceRoot.sealedRoot,
  );
  executions.push(branchExecution);
  currentJournal = await transitionJournalV2(
    context,
    currentJournal,
    "branch-audit",
    referenceRoot.outcome,
    executions,
    null,
  );
  journalLineage.push(currentJournal);

  const completeAllSettledCoverage =
    executions.length === 3 &&
    executions[0]?.executionId === "literal-midpoint-primary-v2" &&
    executions[1]?.executionId === "canonical-index16-primary-v2" &&
    executions[2]?.executionId === "reference-branch-audit-v2";
  const preliminaryScientificPass =
    referenceRoot.outcome.status === "admitted" &&
    completeAllSettledCoverage &&
    executions.every((execution) => execution.status === "fulfilled") &&
    literalExecution.result.status === "equilibrated" &&
    canonicalExecution.result.status === "equilibrated" &&
    branchExecution.result.status === "branch-agreement-established" &&
    branchExecution.result.branchAgreementEstablished;
  let preAdmissionIndependentAuditorReport: PreAdmissionIndependentAuditorReportV2;
  try {
    preAdmissionIndependentAuditorReport =
      await auditPreAdmissionEngineeringEvidenceV2(
        context,
        referenceRoot,
        executions,
        journalLineage,
      );
  } catch (error) {
    preAdmissionIndependentAuditorReport = deepFreezeEvidenceV2({
      reportId:
        "main-wire-normal-adult-passive-equilibrium-pre-admission-independent-auditor-v2" as const,
      status: "execution-failed" as const,
      rootPayloadAndReportReplayPassed: false,
      executionOrderAndEnvelopeHashReplayPassed: false,
      literalCaseReplayPassed: false,
      canonicalCaseReplayPassed: false,
      namedSeedCaseReplayPassed: false,
      branchResultAndAllStageReplayPassed: false,
      journalChainReplayPassed: false,
      fourCaseThreeExecutionCoveragePassed: false,
      orderedExecutionAggregateSha256: await sha256CanonicalJsonHex(executions),
      firstMismatchId: "pre-admission-auditor-execution-failed",
      exception: sanitizedExceptionEvidenceV2(error),
    });
  }
  const preAdmissionIndependentAuditorReportSha256 =
    await sha256CanonicalJsonHex(preAdmissionIndependentAuditorReport);
  const pass =
    preliminaryScientificPass &&
    preAdmissionIndependentAuditorReport.status === "passed";
  currentJournal = await transitionJournalV2(
    context,
    currentJournal,
    pass ? "completed" : "failed",
    referenceRoot.outcome,
    executions,
    pass ? "pass" : "failed",
  );
  journalLineage.push(currentJournal);

  const payload = deepFreezeEvidenceV2({
    schemaId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_EVIDENCE_SCHEMA_V2,
    attemptId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ATTEMPT_V2,
    status: pass ? ("pass" as const) : ("failed" as const),
    officialSealedEngineeringEvidenceEligible: pass,
    declarationCommitSha: DECLARATION_D_SHA,
    implementationCommitSha:
      context.preflight.manifest.payload.implementationCommitSha,
    observedSealCommitSha: context.preflight.observedSealCommitSha,
    engineeringArtifactOwnerId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ARTIFACT_V2,
    schurExportSeamBindingPayload:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_V1,
    schurExportSeamBindingSha256:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_SHA256_V1,
    sealManifestPayload: context.preflight.manifest.payload,
    sealManifestSha256: context.preflight.manifest.sealManifestSha256,
    reservationPayload: context.reservationPayload,
    commonDirReservationSha256: context.commonDirReservationSha256,
    referenceRootOutcome: referenceRoot.outcome,
    executions: Object.freeze([
      executions[0],
      executions[1],
      executions[2],
    ] as const),
    completeAllSettledCoverage,
    preAdmissionIndependentAuditorReport,
    preAdmissionIndependentAuditorReportSha256,
    journalLineage: Object.freeze([...journalLineage]),
    runtime: {
      node: process.version,
      platform: process.platform,
      architecture: process.arch,
    },
    claims: {
      surfaceEstablished: false as const,
      continuousBranchEstablished: false as const,
      globalMinimumOrUniquenessEstablished: false as const,
      liveOutputOrGraphEstablished: false as const,
      physiologyOrClinicalValidationEstablished: false as const,
    },
  });
  const artifact = await sealOfficialEngineeringArtifactV2(context, payload);
  await assertFinalOfficialEngineeringArtifactBindingsV2(
    context,
    referenceRoot,
    deepFreezeEvidenceV2({
      executions: Object.freeze([...executions]),
      completeAllSettledCoverage,
      preAdmissionIndependentAuditorReport,
      preAdmissionIndependentAuditorReportSha256,
      journalLineage: Object.freeze([...journalLineage]),
    }),
    artifact,
  );
  const platform =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_PLATFORM_V2;
  platform.writeJsonCreateOnlyDurable(
    context.preflight.paths.artifactPath,
    artifact,
  );
  requireCanonicalReadbackV2(context.preflight.paths.artifactPath, artifact);
  return artifact;
}

async function sealOfficialEngineeringArtifactV2(
  context: OfficialContextV2,
  payload: MainWireNormalAdultPassiveEquilibriumEngineeringArtifactPayloadV2,
): Promise<MainWireNormalAdultPassiveEquilibriumOfficialEngineeringArtifactV2> {
  assertOfficialContextV2(context);
  const artifact = deepFreezeEvidenceV2({
    schemaId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ARTIFACT_V2,
    payload,
    payloadSha256: await sha256CanonicalJsonHex(payload),
  });
  officialEngineeringArtifactRegistryV2.add(artifact);
  return artifact as MainWireNormalAdultPassiveEquilibriumOfficialEngineeringArtifactV2;
}

async function assertFinalOfficialEngineeringArtifactBindingsV2(
  context: OfficialContextV2,
  referenceRoot: Readonly<{
    outcome: MainWireNormalAdultPassiveEquilibriumReferenceRootOutcomeV2;
    sealedRoot: SealedReferenceRootV2 | null;
  }>,
  expected: Readonly<{
    executions: readonly TopLevelExecutionV2[];
    completeAllSettledCoverage: boolean;
    preAdmissionIndependentAuditorReport: PreAdmissionIndependentAuditorReportV2;
    preAdmissionIndependentAuditorReportSha256: string;
    journalLineage: readonly JournalEnvelopeV2[];
  }>,
  artifact: MainWireNormalAdultPassiveEquilibriumOfficialEngineeringArtifactV2,
): Promise<void> {
  assertOfficialContextV2(context);
  if (!officialEngineeringArtifactRegistryV2.has(artifact))
    throw new Error(
      "official engineering artifact was not minted by the runner",
    );
  const payload = artifact.payload;
  const expectedExecutionIds = [
    "literal-midpoint-primary-v2",
    "canonical-index16-primary-v2",
    "reference-branch-audit-v2",
  ] as const;
  const replayedPreAdmissionReport =
    await auditPreAdmissionEngineeringEvidenceV2(
      context,
      referenceRoot,
      expected.executions,
      expected.journalLineage.slice(0, -1),
    );
  const reportBindingPassed =
    canonicalJsonStringify(replayedPreAdmissionReport) ===
      canonicalJsonStringify(expected.preAdmissionIndependentAuditorReport) &&
    expected.preAdmissionIndependentAuditorReportSha256 ===
      (await sha256CanonicalJsonHex(
        expected.preAdmissionIndependentAuditorReport,
      ));
  const executionBindingsPassed =
    expected.executions.length === 3 &&
    (
      await Promise.all(
        expected.executions.map((execution) =>
          sha256CanonicalJsonHex({
            executionId: execution.executionId,
            status: execution.status,
            result: execution.result,
            exception: execution.exception,
          }),
        ),
      )
    ).every(
      (sha256, index) =>
        expected.executions[index]?.executionId ===
          expectedExecutionIds[index] &&
        expected.executions[index]?.payloadSha256 === sha256,
    );
  const terminalStatus =
    expected.preAdmissionIndependentAuditorReport.status === "passed" &&
    referenceRoot.outcome.status === "admitted" &&
    expected.completeAllSettledCoverage &&
    expected.executions.every((execution) => execution.status === "fulfilled")
      ? ("pass" as const)
      : ("failed" as const);
  const journalBindingsPassed = await auditExactJournalLineageV2(
    context,
    referenceRoot.outcome,
    expected.executions,
    expected.journalLineage,
    terminalStatus,
  );
  const exactEligibilityConjunction =
    referenceRoot.outcome.status === "admitted" &&
    expected.completeAllSettledCoverage &&
    expected.executions.every(
      (execution) => execution.status === "fulfilled",
    ) &&
    expected.preAdmissionIndependentAuditorReport.status === "passed" &&
    reportBindingPassed &&
    executionBindingsPassed &&
    journalBindingsPassed;
  const expectedPayload = deepFreezeEvidenceV2({
    schemaId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_EVIDENCE_SCHEMA_V2,
    attemptId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ATTEMPT_V2,
    status: exactEligibilityConjunction
      ? ("pass" as const)
      : ("failed" as const),
    officialSealedEngineeringEvidenceEligible: exactEligibilityConjunction,
    declarationCommitSha: DECLARATION_D_SHA,
    implementationCommitSha:
      context.preflight.manifest.payload.implementationCommitSha,
    observedSealCommitSha: context.preflight.observedSealCommitSha,
    engineeringArtifactOwnerId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ARTIFACT_V2,
    schurExportSeamBindingPayload:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_V1,
    schurExportSeamBindingSha256:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_SHA256_V1,
    sealManifestPayload: context.preflight.manifest.payload,
    sealManifestSha256: context.preflight.manifest.sealManifestSha256,
    reservationPayload: context.reservationPayload,
    commonDirReservationSha256: context.commonDirReservationSha256,
    referenceRootOutcome: referenceRoot.outcome,
    executions: Object.freeze([...expected.executions]),
    completeAllSettledCoverage: expected.completeAllSettledCoverage,
    preAdmissionIndependentAuditorReport:
      expected.preAdmissionIndependentAuditorReport,
    preAdmissionIndependentAuditorReportSha256:
      expected.preAdmissionIndependentAuditorReportSha256,
    journalLineage: Object.freeze([...expected.journalLineage]),
    runtime: {
      node: process.version,
      platform: process.platform,
      architecture: process.arch,
    },
    claims: {
      surfaceEstablished: false as const,
      continuousBranchEstablished: false as const,
      globalMinimumOrUniquenessEstablished: false as const,
      liveOutputOrGraphEstablished: false as const,
      physiologyOrClinicalValidationEstablished: false as const,
    },
  });
  if (
    artifact.schemaId !==
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ARTIFACT_V2 ||
    artifact.payloadSha256 !== (await sha256CanonicalJsonHex(payload)) ||
    canonicalJsonStringify(payload) !==
      canonicalJsonStringify(expectedPayload) ||
    payload.schemaId !==
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_EVIDENCE_SCHEMA_V2 ||
    payload.attemptId !==
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ATTEMPT_V2 ||
    payload.schurExportSeamBindingSha256 !==
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_SHA256_V1 ||
    canonicalJsonStringify(payload.schurExportSeamBindingPayload) !==
      canonicalJsonStringify(
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_SCHUR_EXPORT_SEAM_BINDING_V1,
      ) ||
    canonicalJsonStringify(payload.sealManifestPayload) !==
      canonicalJsonStringify(context.preflight.manifest.payload) ||
    payload.sealManifestSha256 !==
      context.preflight.manifest.sealManifestSha256 ||
    canonicalJsonStringify(payload.reservationPayload) !==
      canonicalJsonStringify(context.reservationPayload) ||
    payload.commonDirReservationSha256 !== context.commonDirReservationSha256 ||
    payload.officialSealedEngineeringEvidenceEligible !==
      exactEligibilityConjunction ||
    payload.status !== (exactEligibilityConjunction ? "pass" : "failed") ||
    payload.claims.surfaceEstablished ||
    payload.claims.continuousBranchEstablished ||
    payload.claims.globalMinimumOrUniquenessEstablished ||
    payload.claims.liveOutputOrGraphEstablished ||
    payload.claims.physiologyOrClinicalValidationEstablished
  )
    throw new Error("final official engineering artifact binding failed");
}

async function runPrimaryTopLevelExecutionV2(
  executionId: "literal-midpoint-primary-v2" | "canonical-index16-primary-v2",
  phase: "literal" | "canonical",
  context: OfficialContextV2,
  root: SealedReferenceRootV2 | null,
  target: ChamberVolumesV2,
): Promise<TopLevelExecutionV2> {
  if (root === null) {
    const result = await sealFrozenCasePayloadV2({
      status: "dependency-failed" as const,
      dependency: "admitted-reference-root" as const,
      targetChamberVolumesM3: target,
      targetVolumeBits: wrapVolumesEvidenceV2(target),
      solveAttempted: false as const,
    });
    return sealTopLevelExecutionV2(
      executionId,
      "dependency-failed",
      result,
      null,
    );
  }
  try {
    const result = await sealFrozenCasePayloadV2(
      await solvePrimaryPointV2(context, root, target),
    );
    const status: ExecutionStatusV2 =
      result.status === "equilibrated"
        ? "fulfilled"
        : result.exception !== null
          ? "execution-exception"
          : result.failurePhase === "stage-auditor"
            ? "evidence-audit-failure"
            : "scientific-failure";
    return sealTopLevelExecutionV2(
      executionId,
      status,
      result,
      result.status === "not-equilibrated" ? result.exception : null,
    );
  } catch (error) {
    return sealTopLevelExecutionV2(
      executionId,
      "execution-exception",
      deepFreezeEvidenceV2({
        status: "execution-exception" as const,
        phase,
        partialEvidence: deepFreezeEvidenceV2({
          retentionStatus:
            "no-result-returned-before-top-level-boundary" as const,
          completedStages: Object.freeze([]),
          participants: Object.freeze([]),
        }),
      }),
      sanitizedExceptionEvidenceV2(error),
    );
  }
}

async function sealFrozenCasePayloadV2<
  const TPayload extends Readonly<{ status: string }>,
>(
  payload: TPayload,
): Promise<TPayload & Readonly<{ casePayloadSha256: string }>> {
  return deepFreezeEvidenceV2({
    ...payload,
    casePayloadSha256: await sha256CanonicalJsonHex(payload),
  });
}

function frozenCasePayloadWithoutHashV2<
  const TCase extends Readonly<{ casePayloadSha256: string }>,
>(evidence: TCase): Omit<TCase, "casePayloadSha256"> {
  const { casePayloadSha256: _casePayloadSha256, ...payload } = evidence;
  return payload;
}

async function runBranchTopLevelExecutionV2(
  context: OfficialContextV2,
  root: SealedReferenceRootV2 | null,
): Promise<TopLevelExecutionV2> {
  if (root === null) {
    const first = await runDependencyNamedSeedDiagnosticV2(
      "seed-zero-plus-0.25",
      [0, 0.25],
    );
    const second = await runDependencyNamedSeedDiagnosticV2(
      "seed-plus-0.25-plus-0.25",
      [0.25, 0.25],
    );
    return sealTopLevelExecutionV2(
      "reference-branch-audit-v2",
      "dependency-failed",
      deepFreezeEvidenceV2({
        status: "dependency-failed" as const,
        dependency: "admitted-reference-root" as const,
        fullBranchAuditAttempted: false as const,
        namedSeedStageZeroDiagnostics: Object.freeze([first, second] as const),
        allRequiredDependencyAvailableWorkAttempted: true as const,
      }),
      null,
    );
  }
  try {
    const result = await runReferenceBranchAuditV2(context, root);
    const participantException = result.result.participants.find(
      (participant) =>
        participant.status === "participant-failed" &&
        participant.exception !== null,
    );
    const participantAuditFailure = result.result.participants.some(
      (participant) =>
        participant.status === "participant-failed" &&
        (participant.failurePhase === "stage-zero-auditor" ||
          participant.failurePhase === "homotopy-stage-auditor"),
    );
    const status: ExecutionStatusV2 =
      result.independentAuditorReport.status === "execution-failed" ||
      participantException !== undefined
        ? "execution-exception"
        : result.independentAuditorReport.status === "failed" ||
            participantAuditFailure
          ? "evidence-audit-failure"
          : result.status === "branch-agreement-established"
            ? "fulfilled"
            : "scientific-failure";
    const exception =
      result.independentAuditorReport.status === "execution-failed"
        ? result.independentAuditorReport.exception
        : participantException?.status === "participant-failed"
          ? participantException.exception
          : null;
    return sealTopLevelExecutionV2(
      "reference-branch-audit-v2",
      status,
      result,
      exception,
    );
  } catch (error) {
    return sealTopLevelExecutionV2(
      "reference-branch-audit-v2",
      "execution-exception",
      deepFreezeEvidenceV2({
        status: "execution-exception" as const,
        phase: "branch-audit" as const,
        partialEvidence: deepFreezeEvidenceV2({
          retentionStatus:
            "no-result-returned-before-top-level-boundary" as const,
          completedStages: Object.freeze([]),
          participants: Object.freeze([]),
        }),
      }),
      sanitizedExceptionEvidenceV2(error),
    );
  }
}

async function runDependencyNamedSeedDiagnosticV2(
  participantId: NamedSeedDependencyDiagnosticV2["participantId"],
  seedOffset: readonly [number, number],
): Promise<NamedSeedDependencyDiagnosticV2> {
  const loaded =
    NORMAL_ADULT_FIVE_WALL_PRIOR_V1.anatomy.triSeg.loadedCoordinates;
  const initialCoordinates = deepFreezeEvidenceV2({
    septalMidwallCapVolumeM3:
      loaded.septalMidwallCapVolumeM3 +
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2
        .coordinateScales.septalMidwallCapVolumeM3 *
        seedOffset[0],
    junctionRadiusM:
      loaded.junctionRadiusM +
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_POINT_SOLVER_POLICY_V2
        .coordinateScales.junctionRadiusM *
        seedOffset[1],
  });
  let body: Omit<NamedSeedDependencyDiagnosticV2, "payloadSha256">;
  try {
    const stageEvidence = await runOfficialStageV2(
      freezeVolumesV2(
        MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_REFERENCE_VOLUMES_M3_V1,
      ),
      0,
      initialCoordinates,
    );
    body = deepFreezeEvidenceV2({
      participantId,
      seedOffsetScaledCoordinates: Object.freeze([
        seedOffset[0],
        seedOffset[1],
      ] as const),
      status:
        stageEvidence.kernelAudit.report.auditStatus !== "passed"
          ? ("evidence-audit-failure" as const)
          : stageEvidence.kernelEvidence.stageResult.status === "failed"
            ? ("scientific-failure" as const)
            : ("fulfilled" as const),
      stageEvidence,
      exception: null,
    });
  } catch (error) {
    body = deepFreezeEvidenceV2({
      participantId,
      seedOffsetScaledCoordinates: Object.freeze([
        seedOffset[0],
        seedOffset[1],
      ] as const),
      status: "execution-exception" as const,
      stageEvidence: null,
      exception: sanitizedExceptionEvidenceV2(error),
    });
  }
  return deepFreezeEvidenceV2({
    ...body,
    payloadSha256: await sha256CanonicalJsonHex(body),
  });
}

async function sealTopLevelExecutionV2(
  executionId: TopLevelExecutionV2["executionId"],
  status: ExecutionStatusV2,
  result: TopLevelExecutionResultV2,
  exception: SanitizedExceptionV2 | null,
): Promise<TopLevelExecutionV2> {
  const payload = deepFreezeEvidenceV2({
    executionId,
    status,
    result,
    exception,
  });
  return deepFreezeEvidenceV2({
    ...payload,
    payloadSha256: await sha256CanonicalJsonHex(payload),
  });
}

function frozenTargetVolumesFromBitsV2(
  bits: Readonly<{
    LA: string;
    LV: string;
    RA: string;
    RV: string;
  }>,
): ChamberVolumesV2 {
  const volumes = freezeVolumesV2({
    LA: numberFromFloat64BitsHexV2(bits.LA),
    LV: numberFromFloat64BitsHexV2(bits.LV),
    RA: numberFromFloat64BitsHexV2(bits.RA),
    RV: numberFromFloat64BitsHexV2(bits.RV),
  });
  if (
    canonicalJsonStringify(
      Object.fromEntries(
        Object.entries(wrapVolumesEvidenceV2(volumes)).map(([key, value]) => [
          key,
          value.float64BitsHex,
        ]),
      ),
    ) !== canonicalJsonStringify(bits)
  )
    throw new Error("frozen target volume bit tuple mismatch");
  return volumes;
}

type JournalStateV2 =
  | "reserved"
  | "reference-root"
  | "literal"
  | "canonical"
  | "branch-audit"
  | "completed"
  | "failed";

type JournalEnvelopeV2 = Readonly<{
  schemaId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_JOURNAL_SCHEMA_V2;
  payload: Readonly<{
    attemptId: typeof MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ATTEMPT_V2;
    state: JournalStateV2;
    declarationCommitSha: typeof DECLARATION_D_SHA;
    implementationCommitSha: string;
    observedSealCommitSha: string;
    sealManifestSha256: string;
    reservationPayload: ReservationPayloadV2;
    commonDirReservationSha256: string;
    previousJournalPayloadSha256: string | null;
    referenceRootOutcome: MainWireNormalAdultPassiveEquilibriumReferenceRootOutcomeV2 | null;
    executions: readonly TopLevelExecutionV2[];
    terminalStatus: "pass" | "failed" | null;
  }>;
  payloadSha256: string;
}>;

async function journalEnvelopeV2(
  input: Readonly<{
    state: JournalStateV2;
    preflight: PreflightV2;
    reservationPayload: ReservationPayloadV2;
    commonDirReservationSha256: string;
    previousJournalPayloadSha256?: string | null;
    referenceRootOutcome: MainWireNormalAdultPassiveEquilibriumReferenceRootOutcomeV2 | null;
    executions: readonly TopLevelExecutionV2[];
    terminalStatus: "pass" | "failed" | null;
  }>,
): Promise<JournalEnvelopeV2> {
  const payload = deepFreezeEvidenceV2({
    attemptId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_ATTEMPT_V2,
    state: input.state,
    declarationCommitSha: DECLARATION_D_SHA,
    implementationCommitSha:
      input.preflight.manifest.payload.implementationCommitSha,
    observedSealCommitSha: input.preflight.observedSealCommitSha,
    sealManifestSha256: input.preflight.manifest.sealManifestSha256,
    reservationPayload: input.reservationPayload,
    commonDirReservationSha256: input.commonDirReservationSha256,
    previousJournalPayloadSha256: input.previousJournalPayloadSha256 ?? null,
    referenceRootOutcome: input.referenceRootOutcome,
    executions: Object.freeze([...input.executions]),
    terminalStatus: input.terminalStatus,
  });
  return deepFreezeEvidenceV2({
    schemaId:
      MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_JOURNAL_SCHEMA_V2,
    payload,
    payloadSha256: await sha256CanonicalJsonHex(payload),
  });
}

async function transitionJournalV2(
  context: OfficialContextV2,
  previous: JournalEnvelopeV2,
  state: JournalStateV2,
  referenceRootOutcome: MainWireNormalAdultPassiveEquilibriumReferenceRootOutcomeV2 | null,
  executions: readonly TopLevelExecutionV2[],
  terminalStatus: "pass" | "failed" | null,
): Promise<JournalEnvelopeV2> {
  const platform =
    MAIN_WIRE_NORMAL_ADULT_PASSIVE_EQUILIBRIUM_ENGINEERING_PLATFORM_V2;
  const next = await journalEnvelopeV2({
    state,
    preflight: context.preflight,
    reservationPayload: context.reservationPayload,
    commonDirReservationSha256: context.commonDirReservationSha256,
    previousJournalPayloadSha256: previous.payloadSha256,
    referenceRootOutcome,
    executions,
    terminalStatus,
  });
  platform.replaceJsonViaCreateOnlyStageDurable(
    context.preflight.paths.journalPath,
    context.preflight.paths.journalStagePath,
    next,
  );
  requireCanonicalReadbackV2(context.preflight.paths.journalPath, next);
  return next;
}

function freezeVolumesV2(volumes: ChamberVolumesV2): ChamberVolumesV2 {
  const exact = {
    LA: volumes.LA,
    LV: volumes.LV,
    RA: volumes.RA,
    RV: volumes.RV,
  };
  if (!Object.values(exact).every(Number.isFinite))
    throw new Error("chamber volumes must be finite");
  return deepFreezeEvidenceV2(exact);
}

function wrapVolumesEvidenceV2(volumes: ChamberVolumesV2): Readonly<{
  LA: MainWirePassiveEquilibriumFloat64V2;
  LV: MainWirePassiveEquilibriumFloat64V2;
  RA: MainWirePassiveEquilibriumFloat64V2;
  RV: MainWirePassiveEquilibriumFloat64V2;
}> {
  return deepFreezeEvidenceV2({
    LA: wrapMainWirePassiveEquilibriumFloat64V2(volumes.LA),
    LV: wrapMainWirePassiveEquilibriumFloat64V2(volumes.LV),
    RA: wrapMainWirePassiveEquilibriumFloat64V2(volumes.RA),
    RV: wrapMainWirePassiveEquilibriumFloat64V2(volumes.RV),
  });
}

function wrapCoordinatesEvidenceV2(
  coordinates: MainWirePassiveEquilibriumInternalCoordinatesV2,
): Readonly<{
  septalMidwallCapVolumeM3: MainWirePassiveEquilibriumFloat64V2;
  junctionRadiusM: MainWirePassiveEquilibriumFloat64V2;
}> {
  return deepFreezeEvidenceV2({
    septalMidwallCapVolumeM3: wrapMainWirePassiveEquilibriumFloat64V2(
      coordinates.septalMidwallCapVolumeM3,
    ),
    junctionRadiusM: wrapMainWirePassiveEquilibriumFloat64V2(
      coordinates.junctionRadiusM,
    ),
  });
}

function unwrapCandidateCoordinatesV2(
  candidate: Readonly<{
    internalCoordinates: Readonly<{
      septalMidwallCapVolumeM3: MainWirePassiveEquilibriumFloat64V2;
      junctionRadiusM: MainWirePassiveEquilibriumFloat64V2;
    }>;
  }>,
): MainWirePassiveEquilibriumInternalCoordinatesV2 {
  return deepFreezeEvidenceV2({
    septalMidwallCapVolumeM3: numberFromFloat64EvidenceV2(
      candidate.internalCoordinates.septalMidwallCapVolumeM3,
    ),
    junctionRadiusM: numberFromFloat64EvidenceV2(
      candidate.internalCoordinates.junctionRadiusM,
    ),
  });
}

function numberFromFloat64EvidenceV2(
  wrapped: MainWirePassiveEquilibriumFloat64V2,
): number {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(`0x${wrapped.float64BitsHex}`), false);
  return view.getFloat64(0, false);
}

function numberFromFloat64BitsHexV2(bits: string): number {
  if (!/^[0-9a-f]{16}$/.test(bits))
    throw new Error("float64 bits must be lower-case 16-hex");
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(`0x${bits}`), false);
  return view.getFloat64(0, false);
}

function sanitizedExceptionEvidenceV2(error: unknown): SanitizedExceptionV2 {
  return deepFreezeEvidenceV2({
    name: error instanceof Error ? error.name : "NonErrorThrown",
    message: error instanceof Error ? error.message : String(error),
  });
}

function deepFreezeEvidenceV2<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>))
      deepFreezeEvidenceV2(child);
    Object.freeze(value);
  }
  return value;
}
