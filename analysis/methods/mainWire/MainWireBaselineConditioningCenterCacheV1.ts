import { sha256CanonicalJsonHex } from "@/engine/integrity";
import {
  MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1,
  validateMainWireIntegratedModelStandard70CheckpointV1,
  type MainWireIntegratedModelStandard70CheckpointV1,
} from "@/engine/myocardium/MainWireIntegratedModelStandard70CheckpointV1";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import {
  MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID,
} from "@/analysis/methods/mainWire/MainWireStandard70BaselineCalibrationEvaluatorV1";
import {
  buildMainWireBaselineConditioningCenterCandidateV1,
} from "@/analysis/methods/mainWire/MainWireBaselineConditioningAuditV1";
import {
  MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1,
  compileMainWireBaselineConditioningStudyV1,
} from "@/analysis/policies/mainWire/MainWireBaselineConditioningStudyV1";

export const MAIN_WIRE_BASELINE_CONDITIONING_CENTER_CACHE_V1_ID =
  "main-wire-baseline-conditioning-center-cache-v1" as const;

export type MainWireBaselineConditioningCenterConstructionV1 = Readonly<{
  conditionId: string;
  studyIdentitySha256: string;
  constructionIdentitySha256: string;
  nominalDtSec: number;
}>;

export type MainWireBaselineConditioningCenterCacheArtifactV1 = Readonly<{
  cacheId: typeof MAIN_WIRE_BASELINE_CONDITIONING_CENTER_CACHE_V1_ID;
  schemaVersion: 1;
  conditionId: string;
  studyIdentitySha256: string;
  constructionIdentitySha256: string;
  nominalDtSec: number;
  checkpointSha256: string;
  checkpoint: MainWireIntegratedModelStandard70CheckpointV1;
}>;

export async function buildMainWireBaselineConditioningCenterConstructionV1(
  conditionId: string,
): Promise<MainWireBaselineConditioningCenterConstructionV1> {
  const condition = MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.conditions
    .find((candidate) => candidate.conditionId === conditionId);
  if (condition === undefined) {
    throw new Error(`conditioning center condition is unregistered: ${conditionId}`);
  }
  const study = await compileMainWireBaselineConditioningStudyV1();
  const nominalDtSec =
    MAIN_WIRE_BASELINE_CONDITIONING_STUDY_SOURCE_V1.numericalPolicy
      .explorationNominalDtSec;
  const constructionIdentitySha256 = await sha256CanonicalJsonHex({
    cacheId: MAIN_WIRE_BASELINE_CONDITIONING_CENTER_CACHE_V1_ID,
    schemaVersion: 1,
    studyIdentitySha256: study.studyIdentitySha256,
    evaluatorId: MAIN_WIRE_STANDARD70_BASELINE_CALIBRATION_EVALUATOR_V1_ID,
    exactModelIdentity: MAIN_WIRE_INTEGRATED_MODEL_STANDARD70_IDENTITY_V1,
    periodicPolicy: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
    condition,
    targetCandidate:
      buildMainWireBaselineConditioningCenterCandidateV1(conditionId),
    nominalDtSec,
  });
  return Object.freeze({
    conditionId,
    studyIdentitySha256: study.studyIdentitySha256,
    constructionIdentitySha256,
    nominalDtSec,
  });
}

export async function createMainWireBaselineConditioningCenterCacheArtifactV1(
  construction: MainWireBaselineConditioningCenterConstructionV1,
  checkpointInput: unknown,
): Promise<MainWireBaselineConditioningCenterCacheArtifactV1> {
  const expected =
    await buildMainWireBaselineConditioningCenterConstructionV1(
      construction.conditionId,
    );
  assertConstructionMatchesV1(construction, expected);
  const checkpoint =
    await validateMainWireIntegratedModelStandard70CheckpointV1(
      checkpointInput,
    );
  return Object.freeze({
    cacheId: MAIN_WIRE_BASELINE_CONDITIONING_CENTER_CACHE_V1_ID,
    schemaVersion: 1 as const,
    conditionId: expected.conditionId,
    studyIdentitySha256: expected.studyIdentitySha256,
    constructionIdentitySha256: expected.constructionIdentitySha256,
    nominalDtSec: expected.nominalDtSec,
    checkpointSha256: checkpoint.checkpointSha256,
    checkpoint,
  });
}

export async function validateMainWireBaselineConditioningCenterCacheArtifactV1(
  input: unknown,
  expected: MainWireBaselineConditioningCenterConstructionV1,
): Promise<MainWireBaselineConditioningCenterCacheArtifactV1> {
  const record = exactRecordV1(input, [
    "cacheId",
    "schemaVersion",
    "conditionId",
    "studyIdentitySha256",
    "constructionIdentitySha256",
    "nominalDtSec",
    "checkpointSha256",
    "checkpoint",
  ], "conditioning center cache artifact");
  if (
    record.cacheId !== MAIN_WIRE_BASELINE_CONDITIONING_CENTER_CACHE_V1_ID
    || record.schemaVersion !== 1
  ) {
    throw new Error("conditioning center cache schema is unsupported");
  }
  const current =
    await buildMainWireBaselineConditioningCenterConstructionV1(
      expected.conditionId,
    );
  assertConstructionMatchesV1(expected, current);
  if (
    record.conditionId !== current.conditionId
    || record.studyIdentitySha256 !== current.studyIdentitySha256
    || record.constructionIdentitySha256
      !== current.constructionIdentitySha256
    || record.nominalDtSec !== current.nominalDtSec
  ) {
    throw new Error("conditioning center cache construction identity differs");
  }
  const checkpoint =
    await validateMainWireIntegratedModelStandard70CheckpointV1(
      record.checkpoint,
    );
  if (record.checkpointSha256 !== checkpoint.checkpointSha256) {
    throw new Error("conditioning center cache checkpoint identity differs");
  }
  return Object.freeze({
    cacheId: MAIN_WIRE_BASELINE_CONDITIONING_CENTER_CACHE_V1_ID,
    schemaVersion: 1 as const,
    conditionId: current.conditionId,
    studyIdentitySha256: current.studyIdentitySha256,
    constructionIdentitySha256: current.constructionIdentitySha256,
    nominalDtSec: current.nominalDtSec,
    checkpointSha256: checkpoint.checkpointSha256,
    checkpoint,
  });
}

function assertConstructionMatchesV1(
  received: MainWireBaselineConditioningCenterConstructionV1,
  expected: MainWireBaselineConditioningCenterConstructionV1,
): void {
  if (
    received.conditionId !== expected.conditionId
    || received.studyIdentitySha256 !== expected.studyIdentitySha256
    || received.constructionIdentitySha256
      !== expected.constructionIdentitySha256
    || received.nominalDtSec !== expected.nominalDtSec
  ) {
    throw new Error("conditioning center construction identity is stale");
  }
}

function exactRecordV1(
  input: unknown,
  keys: readonly string[],
  label: string,
): Record<string, unknown> {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error(`${label} must be an object`);
  }
  const actual = Reflect.ownKeys(input);
  const expected = [...keys].sort();
  if (
    actual.some((key) => typeof key !== "string")
    || actual.length !== expected.length
    || (actual as string[]).sort().some((key, index) =>
      key !== expected[index])
  ) {
    throw new Error(`${label} has an unexpected field set`);
  }
  return input as Record<string, unknown>;
}
