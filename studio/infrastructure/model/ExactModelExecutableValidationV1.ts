import type { ModelContractV2 } from "@/studio/contracts/v2/model";
import { assertCaptureAdapterMatchesModelV2 } from "@/studio/contracts/v2/model";
import type {
  RegisteredModelExecutableBundleV2,
  ResolvedExactModelRuntimeV2,
} from "@/studio/contracts/v2/executable";
import {
  REGISTERED_MODEL_EXECUTION_PLAN_ADAPTER_V1_SCHEMA_ID,
} from "@/studio/contracts/v2/executable";
import {
  validateAndOwnExecutionPlanDescriptorV1,
} from "@/runtime/executionPlan/BoundExecutionPlanV1";
import type {
  ExecutionPlanDescriptorV1,
} from "@/runtime/executionPlan/ExecutionPlanDescriptorV1";

export class ExactModelExecutableValidationErrorV1 extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExactModelExecutableValidationErrorV1";
  }
}

export function validateExecutableBundleV2(
  bundle: RegisteredModelExecutableBundleV2,
  model: ModelContractV2,
): void {
  validateAndOwnExecutableBundleV2(bundle, model);
}

function validateAndOwnExecutableBundleV2(
  bundle: RegisteredModelExecutableBundleV2,
  model: ModelContractV2,
): ExecutionPlanDescriptorV1 {
  if (bundle === null || typeof bundle !== "object") {
    throw new ExactModelExecutableValidationErrorV1(
      "executable bundle must be an object",
    );
  }
  assertExactExecutableKeysV1(bundle, [
    "modelId",
    "fixtureSchemaId",
    "checkpointCodecId",
    "snapshotGateId",
    "captureAdapter",
    "experimentCapture",
    "snapshotGate",
    "fixtureAdapter",
    "simulationAdapter",
    "executionPlan",
  ], "executable bundle");
  assertExactExecutableKeysV1(bundle.captureAdapter, [
    "modelId",
    "fixtureSchemaId",
    "checkpointCodecId",
    "validateFixture",
    "validateCapture",
  ], "capture adapter");
  assertExactExecutableKeysV1(bundle.experimentCapture, [
    "modelId",
    "fixtureSchemaId",
    "checkpointCodecId",
    "captureAcceptedCandidate",
  ], "Experiment capture adapter");
  assertExactExecutableKeysV1(bundle.snapshotGate, [
    "modelId",
    "snapshotGateId",
    "admitFrozenCandidate",
  ], "Snapshot gate adapter");
  assertExactExecutableKeysV1(bundle.fixtureAdapter, [
    "modelId",
    "fixtureSchemaId",
    "validateCompleteFixture",
    ...(bundle.fixtureAdapter.reduceControlAction === undefined
      ? []
      : ["reduceControlAction"]),
  ], "fixture adapter");
  assertExactExecutableKeysV1(bundle.executionPlan, [
    "bind",
    "createSession",
    "descriptor",
    "modelId",
    "schemaId",
  ], "execution plan adapter");
  if (
    bundle.executionPlan.schemaId
      !== REGISTERED_MODEL_EXECUTION_PLAN_ADAPTER_V1_SCHEMA_ID
    || bundle.executionPlan.modelId !== model.modelId
    || typeof bundle.executionPlan.bind !== "function"
    || typeof bundle.executionPlan.createSession !== "function"
  ) {
    throw new ExactModelExecutableValidationErrorV1(
      "execution plan adapter must exactly match the manifest identity",
    );
  }
  const executionPlanDescriptor = validateAndOwnExecutionPlanDescriptorV1(
    bundle.executionPlan.descriptor,
  );
  assertExactExecutableKeysV1(bundle.simulationAdapter, [
    "modelId",
    "fixtureSchemaId",
    "checkpointCodecId",
    "createSession",
    "disposeSession",
    "currentFrame",
    "advanceOnePresentationStep",
    "advancePresentationBatch",
    "applyControl",
    "requestAnalysis",
    "replaceFixture",
    "currentInputEpoch",
  ], "simulation adapter");
  if (
    bundle.modelId !== model.modelId
    || bundle.fixtureSchemaId !== model.fixtureSchemaId
    || bundle.checkpointCodecId !== model.checkpointCodecId
    || bundle.snapshotGateId !== model.snapshotGateId
  ) {
    throw new ExactModelExecutableValidationErrorV1(
      "executable bundle identity must exactly match its manifest",
    );
  }
  assertCaptureAdapterMatchesModelV2(bundle.captureAdapter, model);
  if (
    bundle.experimentCapture?.modelId !== model.modelId
    || bundle.experimentCapture.fixtureSchemaId !== model.fixtureSchemaId
    || bundle.experimentCapture.checkpointCodecId !== model.checkpointCodecId
    || typeof bundle.experimentCapture.captureAcceptedCandidate !== "function"
    || bundle.snapshotGate?.modelId !== model.modelId
    || bundle.snapshotGate.snapshotGateId !== model.snapshotGateId
    || typeof bundle.snapshotGate.admitFrozenCandidate !== "function"
    || bundle.fixtureAdapter?.modelId !== model.modelId
    || bundle.fixtureAdapter.fixtureSchemaId !== model.fixtureSchemaId
    || typeof bundle.fixtureAdapter.validateCompleteFixture !== "function"
    || bundle.simulationAdapter?.modelId !== model.modelId
    || bundle.simulationAdapter.fixtureSchemaId !== model.fixtureSchemaId
    || bundle.simulationAdapter.checkpointCodecId !== model.checkpointCodecId
    || typeof bundle.simulationAdapter.createSession !== "function"
    || typeof bundle.simulationAdapter.disposeSession !== "function"
    || typeof bundle.simulationAdapter.currentFrame !== "function"
    || typeof bundle.simulationAdapter.advanceOnePresentationStep !== "function"
    || typeof bundle.simulationAdapter.advancePresentationBatch !== "function"
    || typeof bundle.simulationAdapter.applyControl !== "function"
    || typeof bundle.simulationAdapter.requestAnalysis !== "function"
    || typeof bundle.simulationAdapter.replaceFixture !== "function"
    || typeof bundle.simulationAdapter.currentInputEpoch !== "function"
    || (
      bundle.fixtureAdapter.reduceControlAction !== undefined
      && typeof bundle.fixtureAdapter.reduceControlAction !== "function"
    )
  ) {
    throw new ExactModelExecutableValidationErrorV1(
      "every executable adapter must exactly match the manifest identities",
    );
  }
  return executionPlanDescriptor;
}

/** Validates once, owns portable data, and freezes the admitted runtime. */
export function admitExactModelExecutableRuntimeV2(
  bundle: RegisteredModelExecutableBundleV2,
  exactContract: ModelContractV2,
  contract: ModelContractV2,
): ResolvedExactModelRuntimeV2 {
  const executionPlanDescriptor = validateAndOwnExecutableBundleV2(
    bundle,
    exactContract,
  );
  if (
    contract.modelId !== exactContract.modelId
    || contract.modelFamilyId !== exactContract.modelFamilyId
    || contract.fixtureSchemaId !== exactContract.fixtureSchemaId
    || contract.checkpointCodecId !== exactContract.checkpointCodecId
    || contract.snapshotGateId !== exactContract.snapshotGateId
  ) {
    throw new ExactModelExecutableValidationErrorV1(
      "public and exact contracts must share one exact identity",
    );
  }
  return Object.freeze({
    contract,
    exactContract,
    captureAdapter: Object.freeze({
      modelId: bundle.captureAdapter.modelId,
      fixtureSchemaId: bundle.captureAdapter.fixtureSchemaId,
      checkpointCodecId: bundle.captureAdapter.checkpointCodecId,
      validateFixture: bundle.captureAdapter.validateFixture,
      validateCapture: bundle.captureAdapter.validateCapture,
    }),
    experimentCapture: Object.freeze({
      modelId: bundle.experimentCapture.modelId,
      fixtureSchemaId: bundle.experimentCapture.fixtureSchemaId,
      checkpointCodecId: bundle.experimentCapture.checkpointCodecId,
      captureAcceptedCandidate: bundle.experimentCapture.captureAcceptedCandidate,
    }),
    snapshotGate: Object.freeze({
      modelId: bundle.snapshotGate.modelId,
      snapshotGateId: bundle.snapshotGate.snapshotGateId,
      admitFrozenCandidate: bundle.snapshotGate.admitFrozenCandidate,
    }),
    fixtureAdapter: Object.freeze({
      modelId: bundle.fixtureAdapter.modelId,
      fixtureSchemaId: bundle.fixtureAdapter.fixtureSchemaId,
      validateCompleteFixture: bundle.fixtureAdapter.validateCompleteFixture,
      ...(bundle.fixtureAdapter.reduceControlAction === undefined
        ? {}
        : { reduceControlAction: bundle.fixtureAdapter.reduceControlAction }),
    }),
    simulationAdapter: Object.freeze({
      modelId: bundle.simulationAdapter.modelId,
      fixtureSchemaId: bundle.simulationAdapter.fixtureSchemaId,
      checkpointCodecId: bundle.simulationAdapter.checkpointCodecId,
      createSession: bundle.simulationAdapter.createSession,
      disposeSession: bundle.simulationAdapter.disposeSession,
      currentFrame: bundle.simulationAdapter.currentFrame,
      advanceOnePresentationStep:
        bundle.simulationAdapter.advanceOnePresentationStep,
      advancePresentationBatch:
        bundle.simulationAdapter.advancePresentationBatch,
      applyControl: bundle.simulationAdapter.applyControl,
      requestAnalysis: bundle.simulationAdapter.requestAnalysis,
      replaceFixture: bundle.simulationAdapter.replaceFixture,
      currentInputEpoch: bundle.simulationAdapter.currentInputEpoch,
    }),
    executionPlan: Object.freeze({
      schemaId: bundle.executionPlan.schemaId,
      modelId: bundle.executionPlan.modelId,
      descriptor: executionPlanDescriptor,
      bind: bundle.executionPlan.bind,
      createSession: bundle.executionPlan.createSession,
    }),
  });
}

function assertExactExecutableKeysV1(
  value: unknown,
  expected: readonly string[],
  name: string,
): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ExactModelExecutableValidationErrorV1(
      `${name} must be an object`,
    );
  }
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (
    actual.length !== required.length
    || actual.some((key, index) => key !== required[index])
  ) {
    throw new ExactModelExecutableValidationErrorV1(
      `${name} must contain exactly ${required.join(", ")}`,
    );
  }
}
