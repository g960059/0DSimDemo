import {
  EXECUTION_PLAN_DESCRIPTOR_V1_SCHEMA_ID,
  type ExecutionPlanDescriptorV1,
  type ExecutionPlanNewtonF64WorkspaceRoleV1,
  type ExecutionPlanNewtonInt32WorkspaceRoleV1,
  type ExecutionPlanSolveGroupV1,
} from "./ExecutionPlanDescriptorV1";

export const EXECUTION_PLAN_ACCEPTED_STATE_SHADOW_V1_CAPABILITY =
  "runtime/execution-plan-accepted-state-shadow-v1" as const;
export const EXECUTION_PLAN_NEWTON_WORKSPACE_V1_CAPABILITY =
  "runtime/execution-plan-newton-workspace-v1" as const;
export const BOUND_EXECUTION_PLAN_V1_SCHEMA_ID =
  "circleheart-bound-execution-plan-v1" as const;
export const EXECUTION_PLAN_ACCEPTED_STATE_SYNCHRONIZATION_V1_SCHEMA_ID =
  "circleheart-execution-plan-accepted-state-synchronization-v1" as const;

export type ExecutionPlanKernelBindingCatalogV1 = Readonly<{
  componentKernelIds: readonly string[];
  hydraulicPathKernelIds: readonly string[];
}>;

export type BoundExecutionPlanSolveGroupV1 = Readonly<{
  solveGroupId: string;
  activeStateLogicalIndices: Int32Array;
  dependentStateLogicalIndices: Int32Array;
  workspaceF64: Float64Array;
  workspaceInt32: Int32Array;
}>;

/**
 * Worker-local, session-independent allocation produced once at initialization.
 * Typed arrays are intentionally mutable scratch, but the bound object never
 * leaves its owning Worker.
 */
export type BoundExecutionPlanV1 = Readonly<{
  schemaId: typeof BOUND_EXECUTION_PLAN_V1_SCHEMA_ID;
  definitionId: string;
  policyId: string;
  bindingCatalog: ExecutionPlanKernelBindingCatalogV1;
  componentKernelBindingOrdinals: Int32Array;
  hydraulicPathKernelBindingOrdinals: Int32Array;
  currentContinuousState: Float64Array;
  candidateContinuousState: Float64Array;
  currentBooleanState: Uint8Array;
  candidateBooleanState: Uint8Array;
  /** Caller-owned logical-order staging page used only at accepted boundaries. */
  acceptedStateLogicalScratch: Float64Array;
  graphStorageStateLogicalIndices: Int32Array;
  graphUpstreamNodeIndices: Int32Array;
  graphDownstreamNodeIndices: Int32Array;
  solveGroups: readonly BoundExecutionPlanSolveGroupV1[];
  allocatedBytes: number;
}>;

export type ExecutionPlanAcceptedStateSynchronizationV1 = Readonly<{
  schemaId:
    typeof EXECUTION_PLAN_ACCEPTED_STATE_SYNCHRONIZATION_V1_SCHEMA_ID;
  definitionId: string;
  runtimeSessionId: string;
  scenarioId: string;
  acceptedRevision: number;
  acceptedTimeSec: number;
  synchronizedLogicalSlotCount: number;
  conservationPoolCount: number;
  maximumConservationAbsoluteError: number;
}>;

export type BoundExecutionPlanStateSynchronizationResultV1 = Readonly<{
  definitionId: string;
  synchronizedLogicalSlotCount: number;
  conservationPoolCount: number;
  maximumConservationAbsoluteError: number;
}>;

export type BoundExecutionPlanNewtonWorkspaceV1 = Readonly<{
  solveGroupId: string;
  dimension: number;
  currentUnknowns: Float64Array;
  residual: Float64Array;
  jacobian: Float64Array;
  factors: Float64Array;
  rightHandSide: Float64Array;
  transformedRightHandSide: Float64Array;
  update: Float64Array;
  trialUnknowns: Float64Array;
  trialResidual: Float64Array;
  unknownScale: Float64Array;
  residualScale: Float64Array;
  pivots: Int32Array;
}>;

type BoundExecutionPlanSolveGroupMetadataV1 = Readonly<{
  solveGroupId: string;
  activeContinuousStorageIndices: Int32Array;
  workspace: BoundExecutionPlanNewtonWorkspaceV1;
}>;

type BoundExecutionPlanMetadataV1 = Readonly<{
  continuousLogicalIndices: readonly number[];
  booleanLogicalIndices: readonly number[];
  conservationPools: readonly Readonly<{
    ledgerStateLogicalIndex: number;
    memberStateLogicalIndices: readonly number[];
  }>[];
  solveGroups: readonly BoundExecutionPlanSolveGroupMetadataV1[];
}>;

const BOUND_EXECUTION_PLAN_METADATA_V1 = new WeakMap<
  object,
  BoundExecutionPlanMetadataV1
>();

const PORTABLE_ID = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,255}$/;
const PORTABLE_RUNTIME_ID = /^[A-Za-z0-9][A-Za-z0-9._:/@+-]{0,255}$/;
const MAXIMUM_EXECUTION_PLAN_DATA_DEPTH_V1 = 256;
const NEWTON_F64_WORKSPACE_ROLES_V1 = Object.freeze([
  "current-unknowns",
  "residual",
  "jacobian",
  "factors",
  "right-hand-side",
  "transformed-right-hand-side",
  "update",
  "trial-unknowns",
  "trial-residual",
  "unknown-scale",
  "residual-scale",
] as const satisfies readonly ExecutionPlanNewtonF64WorkspaceRoleV1[]);
const NEWTON_INT32_WORKSPACE_ROLES_V1 = Object.freeze([
  "pivots",
] as const satisfies readonly ExecutionPlanNewtonInt32WorkspaceRoleV1[]);

export function validateAndOwnExecutionPlanDescriptorV1(
  value: unknown,
): ExecutionPlanDescriptorV1 {
  const plan = ownDataV1(value, "$") as Record<string, unknown>;
  exactKeysV1(plan, [
    "definitionId",
    "hydraulicGraph",
    "policyId",
    "schemaId",
    "solveGroups",
    "stateLayout",
    "updateGroups",
  ], "$");
  if (plan.schemaId !== EXECUTION_PLAN_DESCRIPTOR_V1_SCHEMA_ID) {
    failV1("$.schemaId", "schema identity mismatch");
  }
  portableIdV1(plan.definitionId, "$.definitionId");
  portableIdV1(plan.policyId, "$.policyId");

  const stateLayout = recordV1(plan.stateLayout, "$.stateLayout");
  exactKeysV1(stateLayout, [
    "blocks",
    "booleanSlotCount",
    "continuousSlotCount",
    "logicalSlotCount",
    "slots",
  ], "$.stateLayout");
  const logicalSlotCount = nonnegativeIntegerV1(
    stateLayout.logicalSlotCount,
    "$.stateLayout.logicalSlotCount",
  );
  const continuousSlotCount = nonnegativeIntegerV1(
    stateLayout.continuousSlotCount,
    "$.stateLayout.continuousSlotCount",
  );
  const booleanSlotCount = nonnegativeIntegerV1(
    stateLayout.booleanSlotCount,
    "$.stateLayout.booleanSlotCount",
  );
  if (
    logicalSlotCount === 0
    || continuousSlotCount + booleanSlotCount !== logicalSlotCount
  ) {
    failV1("$.stateLayout", "slot counts are inconsistent");
  }
  const blocks = arrayV1(stateLayout.blocks, "$.stateLayout.blocks");
  const slots = arrayV1(stateLayout.slots, "$.stateLayout.slots");
  if (blocks.length === 0 || slots.length !== logicalSlotCount) {
    failV1("$.stateLayout", "block or slot cardinality is inconsistent");
  }
  const componentIds = new Set<string>();
  const componentByLogicalIndex: string[] = [];
  const componentKernelIds: string[] = [];
  let nextLogicalStart = 0;
  blocks.forEach((raw, index) => {
    const block = recordV1(raw, `$.stateLayout.blocks[${index}]`);
    exactKeysV1(block, [
      "componentId",
      "kernelId",
      "logicalLength",
      "logicalStart",
    ], `$.stateLayout.blocks[${index}]`);
    const componentId = portableIdV1(
      block.componentId,
      `$.stateLayout.blocks[${index}].componentId`,
    );
    const kernelId = portableIdV1(
      block.kernelId,
      `$.stateLayout.blocks[${index}].kernelId`,
    );
    if (componentIds.has(componentId)) {
      failV1(`$.stateLayout.blocks[${index}]`, "duplicate componentId");
    }
    componentIds.add(componentId);
    componentKernelIds.push(kernelId);
    const start = nonnegativeIntegerV1(
      block.logicalStart,
      `$.stateLayout.blocks[${index}].logicalStart`,
    );
    const length = positiveIntegerV1(
      block.logicalLength,
      `$.stateLayout.blocks[${index}].logicalLength`,
    );
    if (start !== nextLogicalStart || start + length > logicalSlotCount) {
      failV1(`$.stateLayout.blocks[${index}]`, "blocks are not contiguous");
    }
    for (let offset = 0; offset < length; offset += 1) {
      componentByLogicalIndex.push(componentId);
    }
    nextLogicalStart += length;
  });
  if (nextLogicalStart !== logicalSlotCount) {
    failV1("$.stateLayout.blocks", "blocks do not cover every state slot");
  }
  const stateIdByLogicalIndex: string[] = [];
  const stateIdSet = new Set<string>();
  let expectedContinuousIndex = 0;
  let expectedBooleanIndex = 0;
  slots.forEach((raw, index) => {
    const slot = recordV1(raw, `$.stateLayout.slots[${index}]`);
    exactKeysV1(slot, [
      "componentId",
      "logicalIndex",
      "stateId",
      "storageIndex",
      "storageKind",
      "unit",
    ], `$.stateLayout.slots[${index}]`);
    const stateId = portableIdV1(
      slot.stateId,
      `$.stateLayout.slots[${index}].stateId`,
    );
    const componentId = portableIdV1(
      slot.componentId,
      `$.stateLayout.slots[${index}].componentId`,
    );
    if (stateIdSet.has(stateId)) {
      failV1(`$.stateLayout.slots[${index}]`, "duplicate stateId");
    }
    stateIdSet.add(stateId);
    if (
      nonnegativeIntegerV1(
        slot.logicalIndex,
        `$.stateLayout.slots[${index}].logicalIndex`,
      ) !== index
      || componentByLogicalIndex[index] !== componentId
    ) {
      failV1(`$.stateLayout.slots[${index}]`, "slot ownership is inconsistent");
    }
    const storageIndex = nonnegativeIntegerV1(
      slot.storageIndex,
      `$.stateLayout.slots[${index}].storageIndex`,
    );
    if (slot.storageKind === "continuous-f64") {
      if (storageIndex !== expectedContinuousIndex++) {
        failV1(`$.stateLayout.slots[${index}]`, "continuous slots are not contiguous");
      }
    } else if (slot.storageKind === "boolean-u8") {
      if (storageIndex !== expectedBooleanIndex++) {
        failV1(`$.stateLayout.slots[${index}]`, "boolean slots are not contiguous");
      }
    } else {
      failV1(`$.stateLayout.slots[${index}].storageKind`, "unsupported storage kind");
    }
    nonemptyStringV1(slot.unit, `$.stateLayout.slots[${index}].unit`);
    stateIdByLogicalIndex.push(stateId);
  });
  if (
    expectedContinuousIndex !== continuousSlotCount
    || expectedBooleanIndex !== booleanSlotCount
  ) {
    failV1("$.stateLayout.slots", "storage indices do not match slot counts");
  }

  const graph = recordV1(plan.hydraulicGraph, "$.hydraulicGraph");
  exactKeysV1(graph, [
    "conservationPools",
    "downstreamNodeIndices",
    "nodeIds",
    "pathIds",
    "pathKernelIds",
    "storageStateLogicalIndices",
    "upstreamNodeIndices",
  ], "$.hydraulicGraph");
  const nodeIds = portableIdArrayV1(graph.nodeIds, "$.hydraulicGraph.nodeIds");
  const storageIndices = integerArrayV1(
    graph.storageStateLogicalIndices,
    "$.hydraulicGraph.storageStateLogicalIndices",
  );
  uniqueV1(nodeIds, "$.hydraulicGraph.nodeIds");
  if (nodeIds.length === 0 || storageIndices.length !== nodeIds.length) {
    failV1("$.hydraulicGraph", "node arrays have inconsistent lengths");
  }
  storageIndices.forEach((logicalIndex, index) => {
    continuousLogicalIndexV1(
      logicalIndex,
      slots,
      `$.hydraulicGraph.storageStateLogicalIndices[${index}]`,
    );
  });
  const pathIds = portableIdArrayV1(graph.pathIds, "$.hydraulicGraph.pathIds");
  const pathKernelIds = portableIdArrayV1(
    graph.pathKernelIds,
    "$.hydraulicGraph.pathKernelIds",
  );
  const upstream = integerArrayV1(
    graph.upstreamNodeIndices,
    "$.hydraulicGraph.upstreamNodeIndices",
  );
  const downstream = integerArrayV1(
    graph.downstreamNodeIndices,
    "$.hydraulicGraph.downstreamNodeIndices",
  );
  uniqueV1(pathIds, "$.hydraulicGraph.pathIds");
  if (
    pathIds.length !== pathKernelIds.length
    || pathIds.length !== upstream.length
    || pathIds.length !== downstream.length
  ) {
    failV1("$.hydraulicGraph", "path arrays have inconsistent lengths");
  }
  upstream.forEach((nodeIndex, index) => {
    if (
      nodeIndex < 0
      || nodeIndex >= nodeIds.length
      || downstream[index]! < 0
      || downstream[index]! >= nodeIds.length
      || nodeIndex === downstream[index]
    ) {
      failV1(`$.hydraulicGraph.pathIds[${index}]`, "path endpoints are invalid");
    }
  });
  const pools = arrayV1(
    graph.conservationPools,
    "$.hydraulicGraph.conservationPools",
  );
  const poolIds = new Set<string>();
  pools.forEach((raw, index) => {
    const pool = recordV1(raw, `$.hydraulicGraph.conservationPools[${index}]`);
    exactKeysV1(pool, [
      "dependentStateLogicalIndex",
      "ledgerStateLogicalIndex",
      "memberStateLogicalIndices",
      "poolId",
    ], `$.hydraulicGraph.conservationPools[${index}]`);
    const poolId = portableIdV1(
      pool.poolId,
      `$.hydraulicGraph.conservationPools[${index}].poolId`,
    );
    if (poolIds.has(poolId)) {
      failV1(`$.hydraulicGraph.conservationPools[${index}]`, "duplicate poolId");
    }
    poolIds.add(poolId);
    continuousLogicalIndexV1(
      integerV1(
        pool.ledgerStateLogicalIndex,
        `$.hydraulicGraph.conservationPools[${index}].ledgerStateLogicalIndex`,
      ),
      slots,
      `$.hydraulicGraph.conservationPools[${index}].ledgerStateLogicalIndex`,
    );
    const members = integerArrayV1(
      pool.memberStateLogicalIndices,
      `$.hydraulicGraph.conservationPools[${index}].memberStateLogicalIndices`,
    );
    if (members.length < 2 || new Set(members).size !== members.length) {
      failV1(`$.hydraulicGraph.conservationPools[${index}]`, "pool members are invalid");
    }
    members.forEach((logicalIndex, memberIndex) => continuousLogicalIndexV1(
      logicalIndex,
      slots,
      `$.hydraulicGraph.conservationPools[${index}].memberStateLogicalIndices[${memberIndex}]`,
    ));
    const dependent = integerV1(
      pool.dependentStateLogicalIndex,
      `$.hydraulicGraph.conservationPools[${index}].dependentStateLogicalIndex`,
    );
    if (!members.includes(dependent)) {
      failV1(`$.hydraulicGraph.conservationPools[${index}]`, "dependent state is not a member");
    }
  });

  const solveGroups = arrayV1(plan.solveGroups, "$.solveGroups");
  if (solveGroups.length === 0) failV1("$.solveGroups", "must not be empty");
  const solveGroupIds = new Set<string>();
  solveGroups.forEach((raw, groupIndex) => validateSolveGroupV1(
    raw,
    groupIndex,
    slots,
    stateIdByLogicalIndex,
    solveGroupIds,
  ));

  const updateGroups = arrayV1(plan.updateGroups, "$.updateGroups");
  if (updateGroups.length === 0) failV1("$.updateGroups", "must not be empty");
  const updateGroupIds = new Set<string>();
  updateGroups.forEach((raw, index) => {
    const group = recordV1(raw, `$.updateGroups[${index}]`);
    exactKeysV1(group, [
      "fixedStepSec",
      "integration",
      "ordinal",
      "solveGroupId",
      "updateGroupId",
    ], `$.updateGroups[${index}]`);
    const updateGroupId = portableIdV1(
      group.updateGroupId,
      `$.updateGroups[${index}].updateGroupId`,
    );
    if (updateGroupIds.has(updateGroupId)) {
      failV1(`$.updateGroups[${index}]`, "duplicate updateGroupId");
    }
    updateGroupIds.add(updateGroupId);
    if (integerV1(group.ordinal, `$.updateGroups[${index}].ordinal`) !== index) {
      failV1(`$.updateGroups[${index}].ordinal`, "must be contiguous from zero");
    }
    if (group.integration !== "fixed-step-backward-euler") {
      failV1(`$.updateGroups[${index}].integration`, "unsupported integration");
    }
    positiveFiniteV1(group.fixedStepSec, `$.updateGroups[${index}].fixedStepSec`);
    const solveGroupId = portableIdV1(
      group.solveGroupId,
      `$.updateGroups[${index}].solveGroupId`,
    );
    if (!solveGroupIds.has(solveGroupId)) {
      failV1(`$.updateGroups[${index}].solveGroupId`, "unknown solve group");
    }
  });

  // These arrays were read above to ensure the clone is internally complete.
  void componentKernelIds;
  void pathKernelIds;
  return plan as unknown as ExecutionPlanDescriptorV1;
}

export function bindExecutionPlanV1(
  descriptorValue: unknown,
  catalogValue: unknown,
): BoundExecutionPlanV1 {
  const descriptor = validateAndOwnExecutionPlanDescriptorV1(descriptorValue);
  const catalog = validateAndOwnKernelCatalogV1(catalogValue);
  const requiredComponents = descriptor.stateLayout.blocks
    .map(({ kernelId }) => kernelId);
  const requiredPaths = descriptor.hydraulicGraph.pathKernelIds;
  assertExactBindingSetV1(
    requiredComponents,
    catalog.componentKernelIds,
    "component kernel",
  );
  assertExactBindingSetV1(
    requiredPaths,
    catalog.hydraulicPathKernelIds,
    "hydraulic path kernel",
  );
  const componentOrdinalById = new Map(catalog.componentKernelIds.map(
    (kernelId, ordinal) => [kernelId, ordinal] as const,
  ));
  const pathOrdinalById = new Map(catalog.hydraulicPathKernelIds.map(
    (kernelId, ordinal) => [kernelId, ordinal] as const,
  ));
  const componentKernelBindingOrdinals = Int32Array.from(
    requiredComponents.map((kernelId) => componentOrdinalById.get(kernelId)!),
  );
  const hydraulicPathKernelBindingOrdinals = Int32Array.from(
    requiredPaths.map((kernelId) => pathOrdinalById.get(kernelId)!),
  );
  const currentContinuousState = new Float64Array(
    descriptor.stateLayout.continuousSlotCount,
  );
  const candidateContinuousState = new Float64Array(
    descriptor.stateLayout.continuousSlotCount,
  );
  const currentBooleanState = new Uint8Array(
    descriptor.stateLayout.booleanSlotCount,
  );
  const candidateBooleanState = new Uint8Array(
    descriptor.stateLayout.booleanSlotCount,
  );
  const acceptedStateLogicalScratch = new Float64Array(
    descriptor.stateLayout.logicalSlotCount,
  );
  const graphStorageStateLogicalIndices = Int32Array.from(
    descriptor.hydraulicGraph.storageStateLogicalIndices,
  );
  const graphUpstreamNodeIndices = Int32Array.from(
    descriptor.hydraulicGraph.upstreamNodeIndices,
  );
  const graphDownstreamNodeIndices = Int32Array.from(
    descriptor.hydraulicGraph.downstreamNodeIndices,
  );
  const stateIndexById = new Map(descriptor.stateLayout.slots.map(
    ({ stateId, logicalIndex }) => [stateId, logicalIndex] as const,
  ));
  const solveGroups = Object.freeze(descriptor.solveGroups.map((group) => {
    const activeStateIds = group.blocks
      .filter(({ disposition }) => disposition === "retained")
      .flatMap(({ stateIds }) => stateIds);
    return Object.freeze({
      solveGroupId: group.solveGroupId,
      activeStateLogicalIndices: Int32Array.from(
        activeStateIds.map((stateId) => stateIndexById.get(stateId)!),
      ),
      dependentStateLogicalIndices: Int32Array.from(
        group.dependentStateIds.map((stateId) => stateIndexById.get(stateId)!),
      ),
      workspaceF64: new Float64Array(group.workspace.f64Count),
      workspaceInt32: new Int32Array(group.workspace.int32Count),
    });
  }));
  const arrays: ArrayBufferView[] = [
    componentKernelBindingOrdinals,
    hydraulicPathKernelBindingOrdinals,
    currentContinuousState,
    candidateContinuousState,
    currentBooleanState,
    candidateBooleanState,
    acceptedStateLogicalScratch,
    graphStorageStateLogicalIndices,
    graphUpstreamNodeIndices,
    graphDownstreamNodeIndices,
    ...solveGroups.flatMap((group) => [
      group.activeStateLogicalIndices,
      group.dependentStateLogicalIndices,
      group.workspaceF64,
      group.workspaceInt32,
    ]),
  ];
  const bound = Object.freeze({
    schemaId: BOUND_EXECUTION_PLAN_V1_SCHEMA_ID,
    definitionId: descriptor.definitionId,
    policyId: descriptor.policyId,
    bindingCatalog: catalog,
    componentKernelBindingOrdinals,
    hydraulicPathKernelBindingOrdinals,
    currentContinuousState,
    candidateContinuousState,
    currentBooleanState,
    candidateBooleanState,
    acceptedStateLogicalScratch,
    graphStorageStateLogicalIndices,
    graphUpstreamNodeIndices,
    graphDownstreamNodeIndices,
    solveGroups,
    allocatedBytes: arrays.reduce((total, view) => total + view.byteLength, 0),
  });
  assertBoundExecutionPlanV1(bound, descriptor);
  BOUND_EXECUTION_PLAN_METADATA_V1.set(bound, Object.freeze({
    continuousLogicalIndices: Object.freeze(descriptor.stateLayout.slots
      .filter(({ storageKind }) => storageKind === "continuous-f64")
      .sort((left, right) => left.storageIndex - right.storageIndex)
      .map(({ logicalIndex }) => logicalIndex)),
    booleanLogicalIndices: Object.freeze(descriptor.stateLayout.slots
      .filter(({ storageKind }) => storageKind === "boolean-u8")
      .sort((left, right) => left.storageIndex - right.storageIndex)
      .map(({ logicalIndex }) => logicalIndex)),
    conservationPools: Object.freeze(
      descriptor.hydraulicGraph.conservationPools.map((pool) => Object.freeze({
        ledgerStateLogicalIndex: pool.ledgerStateLogicalIndex,
        memberStateLogicalIndices: Object.freeze([
          ...pool.memberStateLogicalIndices,
        ]),
      })),
    ),
    solveGroups: Object.freeze(descriptor.solveGroups.map(
      (descriptorGroup, index) => createBoundSolveGroupMetadataV1(
        descriptor,
        descriptorGroup,
        solveGroups[index]!,
      ),
    )),
  }));
  return bound;
}

/**
 * Projects the current accepted state into the compiler-owned Newton layout
 * and returns persistent views over one preallocated workspace. No candidate
 * state is staged and no numerical kernel is invoked.
 */
export function prepareBoundExecutionPlanSolveGroupV1(
  bound: BoundExecutionPlanV1,
  solveGroupId: string,
): BoundExecutionPlanNewtonWorkspaceV1 {
  const metadata = BOUND_EXECUTION_PLAN_METADATA_V1.get(bound);
  if (metadata === undefined) {
    throw new Error("Execution plan solve preparation requires a bound plan");
  }
  const group = metadata.solveGroups.find((candidate) =>
    candidate.solveGroupId === solveGroupId);
  if (group === undefined) {
    throw new Error(`Execution plan solve group ${solveGroupId} is unavailable`);
  }
  group.activeContinuousStorageIndices.forEach((storageIndex, index) => {
    group.workspace.currentUnknowns[index] =
      bound.currentContinuousState[storageIndex]!;
  });
  return group.workspace;
}

function createBoundSolveGroupMetadataV1(
  descriptor: ExecutionPlanDescriptorV1,
  descriptorGroup: ExecutionPlanSolveGroupV1,
  boundGroup: BoundExecutionPlanSolveGroupV1,
): BoundExecutionPlanSolveGroupMetadataV1 {
  const activeContinuousStorageIndices = Int32Array.from(
    boundGroup.activeStateLogicalIndices,
    (logicalIndex) => {
      const slot = descriptor.stateLayout.slots[logicalIndex];
      if (slot?.storageKind !== "continuous-f64") {
        throw new Error(
          "Execution plan active solve state must use continuous storage",
        );
      }
      return slot.storageIndex;
    },
  );
  const f64View = (
    role: ExecutionPlanNewtonF64WorkspaceRoleV1,
  ): Float64Array => {
    const segment = descriptorGroup.workspace.f64Segments.find(
      (candidate) => candidate.role === role,
    );
    if (segment === undefined) {
      throw new Error(`Execution plan workspace omits ${role}`);
    }
    return new Float64Array(
      boundGroup.workspaceF64.buffer,
      boundGroup.workspaceF64.byteOffset
        + segment.offset * Float64Array.BYTES_PER_ELEMENT,
      segment.length,
    );
  };
  const int32View = (
    role: ExecutionPlanNewtonInt32WorkspaceRoleV1,
  ): Int32Array => {
    const segment = descriptorGroup.workspace.int32Segments.find(
      (candidate) => candidate.role === role,
    );
    if (segment === undefined) {
      throw new Error(`Execution plan workspace omits ${role}`);
    }
    return new Int32Array(
      boundGroup.workspaceInt32.buffer,
      boundGroup.workspaceInt32.byteOffset
        + segment.offset * Int32Array.BYTES_PER_ELEMENT,
      segment.length,
    );
  };
  const workspace = Object.freeze({
    solveGroupId: descriptorGroup.solveGroupId,
    dimension: descriptorGroup.activeUnknownCount,
    currentUnknowns: f64View("current-unknowns"),
    residual: f64View("residual"),
    jacobian: f64View("jacobian"),
    factors: f64View("factors"),
    rightHandSide: f64View("right-hand-side"),
    transformedRightHandSide: f64View("transformed-right-hand-side"),
    update: f64View("update"),
    trialUnknowns: f64View("trial-unknowns"),
    trialResidual: f64View("trial-residual"),
    unknownScale: f64View("unknown-scale"),
    residualScale: f64View("residual-scale"),
    pivots: int32View("pivots"),
  });
  assertCanonicalNewtonWorkspaceViewsV1(
    workspace,
    boundGroup,
    descriptorGroup,
  );
  return Object.freeze({
    solveGroupId: descriptorGroup.solveGroupId,
    activeContinuousStorageIndices,
    workspace,
  });
}

function assertCanonicalNewtonWorkspaceViewsV1(
  workspace: BoundExecutionPlanNewtonWorkspaceV1,
  boundGroup: BoundExecutionPlanSolveGroupV1,
  descriptorGroup: ExecutionPlanSolveGroupV1,
): void {
  if (
    workspace.solveGroupId !== descriptorGroup.solveGroupId
    || workspace.dimension !== descriptorGroup.activeUnknownCount
  ) {
    throw new Error("Execution plan Newton workspace identity drifted");
  }
  const f64Views = [
    ["current-unknowns", workspace.currentUnknowns],
    ["residual", workspace.residual],
    ["jacobian", workspace.jacobian],
    ["factors", workspace.factors],
    ["right-hand-side", workspace.rightHandSide],
    ["transformed-right-hand-side", workspace.transformedRightHandSide],
    ["update", workspace.update],
    ["trial-unknowns", workspace.trialUnknowns],
    ["trial-residual", workspace.trialResidual],
    ["unknown-scale", workspace.unknownScale],
    ["residual-scale", workspace.residualScale],
  ] as const satisfies readonly (readonly [
    ExecutionPlanNewtonF64WorkspaceRoleV1,
    Float64Array,
  ])[];
  for (const [role, view] of f64Views) {
    const segment = descriptorGroup.workspace.f64Segments.find(
      (candidate) => candidate.role === role,
    )!;
    if (
      view.buffer !== boundGroup.workspaceF64.buffer
      || view.byteOffset !== boundGroup.workspaceF64.byteOffset
        + segment.offset * Float64Array.BYTES_PER_ELEMENT
      || view.length !== segment.length
      || view.byteLength
        !== segment.length * Float64Array.BYTES_PER_ELEMENT
    ) {
      throw new Error(`Execution plan Newton workspace ${role} view drifted`);
    }
  }
  const [pivotSegment] = descriptorGroup.workspace.int32Segments;
  if (
    pivotSegment?.role !== "pivots"
    || workspace.pivots.buffer !== boundGroup.workspaceInt32.buffer
    || workspace.pivots.byteOffset !== boundGroup.workspaceInt32.byteOffset
      + pivotSegment.offset * Int32Array.BYTES_PER_ELEMENT
    || workspace.pivots.length !== pivotSegment.length
    || workspace.pivots.byteLength
      !== pivotSegment.length * Int32Array.BYTES_PER_ELEMENT
  ) {
    throw new Error("Execution plan Newton workspace pivots view drifted");
  }
}

/**
 * Atomically projects one model-owned logical accepted view into the bound
 * plan's split f64/boolean storage. The source page is validated in full,
 * including descriptor-owned conservation ledgers, before any current-state
 * byte is changed. This is a sampled shadow boundary, not a second authority.
 */
export function synchronizeBoundExecutionPlanAcceptedStateV1(
  bound: BoundExecutionPlanV1,
): BoundExecutionPlanStateSynchronizationResultV1 {
  const metadata = BOUND_EXECUTION_PLAN_METADATA_V1.get(bound);
  if (metadata === undefined) {
    throw new Error("Execution plan synchronization requires a bound plan");
  }
  const source = bound.acceptedStateLogicalScratch;
  if (
    !(source instanceof Float64Array)
    || source.length
      !== metadata.continuousLogicalIndices.length
        + metadata.booleanLogicalIndices.length
    || !fixedOwnedArrayBufferV1(source.buffer)
    || source.byteOffset !== 0
    || source.byteLength !== source.buffer.byteLength
  ) {
    throw new Error(
      "Execution plan accepted-state logical scratch is invalid",
    );
  }
  for (let logicalIndex = 0; logicalIndex < source.length; logicalIndex += 1) {
    const value = source[logicalIndex]!;
    if (!Number.isFinite(value) || Object.is(value, -0)) {
      throw new Error(
        `Execution plan accepted state ${logicalIndex} must be finite and not negative zero`,
      );
    }
  }
  for (const logicalIndex of metadata.booleanLogicalIndices) {
    const value = source[logicalIndex]!;
    if (value !== 0 && value !== 1) {
      throw new Error(
        `Execution plan boolean accepted state ${logicalIndex} must be zero or one`,
      );
    }
  }

  let maximumConservationAbsoluteError = 0;
  for (const pool of metadata.conservationPools) {
    const ledger = source[pool.ledgerStateLogicalIndex]!;
    let memberTotal = 0;
    for (const logicalIndex of pool.memberStateLogicalIndices) {
      memberTotal += source[logicalIndex]!;
    }
    const absoluteError = Math.abs(memberTotal - ledger);
    maximumConservationAbsoluteError = Math.max(
      maximumConservationAbsoluteError,
      absoluteError,
    );
    const scale = Math.max(1, Math.abs(ledger), Math.abs(memberTotal));
    const tolerance = Number.EPSILON * scale
      * Math.max(16, pool.memberStateLogicalIndices.length * 4);
    if (absoluteError > tolerance) {
      throw new Error(
        "Execution plan accepted state violates a conservation ledger "
          + `(${absoluteError} > ${tolerance})`,
      );
    }
  }

  metadata.continuousLogicalIndices.forEach((logicalIndex, storageIndex) => {
    bound.currentContinuousState[storageIndex] = source[logicalIndex]!;
  });
  metadata.booleanLogicalIndices.forEach((logicalIndex, storageIndex) => {
    bound.currentBooleanState[storageIndex] = source[logicalIndex]!;
  });
  return Object.freeze({
    definitionId: bound.definitionId,
    synchronizedLogicalSlotCount: source.length,
    conservationPoolCount: metadata.conservationPools.length,
    maximumConservationAbsoluteError,
  });
}

export function validateAndOwnExecutionPlanAcceptedStateSynchronizationV1(
  value: unknown,
): ExecutionPlanAcceptedStateSynchronizationV1 {
  const owned = ownDataV1(value, "$.executionPlanSynchronization");
  const report = recordV1(owned, "$.executionPlanSynchronization");
  exactKeysV1(report, [
    "acceptedRevision",
    "acceptedTimeSec",
    "conservationPoolCount",
    "definitionId",
    "maximumConservationAbsoluteError",
    "runtimeSessionId",
    "scenarioId",
    "schemaId",
    "synchronizedLogicalSlotCount",
  ], "$.executionPlanSynchronization");
  if (
    report.schemaId
      !== EXECUTION_PLAN_ACCEPTED_STATE_SYNCHRONIZATION_V1_SCHEMA_ID
  ) {
    failV1("$.executionPlanSynchronization.schemaId", "schema identity mismatch");
  }
  portableIdV1(report.definitionId, "$.executionPlanSynchronization.definitionId");
  portableRuntimeIdV1(
    report.runtimeSessionId,
    "$.executionPlanSynchronization.runtimeSessionId",
  );
  portableRuntimeIdV1(
    report.scenarioId,
    "$.executionPlanSynchronization.scenarioId",
  );
  nonnegativeIntegerV1(
    report.acceptedRevision,
    "$.executionPlanSynchronization.acceptedRevision",
  );
  nonnegativeFiniteV1(
    report.acceptedTimeSec,
    "$.executionPlanSynchronization.acceptedTimeSec",
  );
  positiveIntegerV1(
    report.synchronizedLogicalSlotCount,
    "$.executionPlanSynchronization.synchronizedLogicalSlotCount",
  );
  nonnegativeIntegerV1(
    report.conservationPoolCount,
    "$.executionPlanSynchronization.conservationPoolCount",
  );
  nonnegativeFiniteV1(
    report.maximumConservationAbsoluteError,
    "$.executionPlanSynchronization.maximumConservationAbsoluteError",
  );
  return report as unknown as ExecutionPlanAcceptedStateSynchronizationV1;
}

export function assertBoundExecutionPlanV1(
  value: unknown,
  descriptorValue: unknown,
): asserts value is BoundExecutionPlanV1 {
  const descriptor = validateAndOwnExecutionPlanDescriptorV1(descriptorValue);
  const bound = recordV1(value, "$.boundExecutionPlan");
  exactKeysV1(bound, [
    "allocatedBytes",
    "acceptedStateLogicalScratch",
    "bindingCatalog",
    "candidateBooleanState",
    "candidateContinuousState",
    "componentKernelBindingOrdinals",
    "currentBooleanState",
    "currentContinuousState",
    "definitionId",
    "graphDownstreamNodeIndices",
    "graphStorageStateLogicalIndices",
    "graphUpstreamNodeIndices",
    "hydraulicPathKernelBindingOrdinals",
    "policyId",
    "schemaId",
    "solveGroups",
  ], "$.boundExecutionPlan");
  if (
    bound.schemaId !== BOUND_EXECUTION_PLAN_V1_SCHEMA_ID
    || bound.definitionId !== descriptor.definitionId
    || bound.policyId !== descriptor.policyId
  ) {
    failV1("$.boundExecutionPlan", "descriptor identity mismatch");
  }
  const catalog = validateAndOwnKernelCatalogV1(bound.bindingCatalog);
  const componentOrdinals = int32ViewV1(
    bound.componentKernelBindingOrdinals,
    descriptor.stateLayout.blocks.length,
    "$.boundExecutionPlan.componentKernelBindingOrdinals",
  );
  const pathOrdinals = int32ViewV1(
    bound.hydraulicPathKernelBindingOrdinals,
    descriptor.hydraulicGraph.pathIds.length,
    "$.boundExecutionPlan.hydraulicPathKernelBindingOrdinals",
  );
  descriptor.stateLayout.blocks.forEach((block, index) => {
    if (catalog.componentKernelIds[componentOrdinals[index]!] !== block.kernelId) {
      failV1("$.boundExecutionPlan.componentKernelBindingOrdinals", "binding mismatch");
    }
  });
  descriptor.hydraulicGraph.pathKernelIds.forEach((kernelId, index) => {
    if (catalog.hydraulicPathKernelIds[pathOrdinals[index]!] !== kernelId) {
      failV1("$.boundExecutionPlan.hydraulicPathKernelBindingOrdinals", "binding mismatch");
    }
  });
  const arrays: ArrayBufferView[] = [componentOrdinals, pathOrdinals];
  arrays.push(
    f64ViewV1(bound.currentContinuousState,
      descriptor.stateLayout.continuousSlotCount,
      "$.boundExecutionPlan.currentContinuousState"),
    f64ViewV1(bound.candidateContinuousState,
      descriptor.stateLayout.continuousSlotCount,
      "$.boundExecutionPlan.candidateContinuousState"),
    u8ViewV1(bound.currentBooleanState,
      descriptor.stateLayout.booleanSlotCount,
      "$.boundExecutionPlan.currentBooleanState"),
    u8ViewV1(bound.candidateBooleanState,
      descriptor.stateLayout.booleanSlotCount,
      "$.boundExecutionPlan.candidateBooleanState"),
    f64ViewV1(bound.acceptedStateLogicalScratch,
      descriptor.stateLayout.logicalSlotCount,
      "$.boundExecutionPlan.acceptedStateLogicalScratch"),
  );
  arrays.push(assertInt32ValuesV1(
    bound.graphStorageStateLogicalIndices,
    descriptor.hydraulicGraph.storageStateLogicalIndices,
    "$.boundExecutionPlan.graphStorageStateLogicalIndices",
  ));
  arrays.push(assertInt32ValuesV1(
    bound.graphUpstreamNodeIndices,
    descriptor.hydraulicGraph.upstreamNodeIndices,
    "$.boundExecutionPlan.graphUpstreamNodeIndices",
  ));
  arrays.push(assertInt32ValuesV1(
    bound.graphDownstreamNodeIndices,
    descriptor.hydraulicGraph.downstreamNodeIndices,
    "$.boundExecutionPlan.graphDownstreamNodeIndices",
  ));
  const solveGroups = arrayV1(bound.solveGroups, "$.boundExecutionPlan.solveGroups");
  if (solveGroups.length !== descriptor.solveGroups.length) {
    failV1("$.boundExecutionPlan.solveGroups", "group count mismatch");
  }
  solveGroups.forEach((raw, index) => {
    const group = recordV1(raw, `$.boundExecutionPlan.solveGroups[${index}]`);
    exactKeysV1(group, [
      "activeStateLogicalIndices",
      "dependentStateLogicalIndices",
      "solveGroupId",
      "workspaceF64",
      "workspaceInt32",
    ], `$.boundExecutionPlan.solveGroups[${index}]`);
    const descriptorGroup = descriptor.solveGroups[index]!;
    if (group.solveGroupId !== descriptorGroup.solveGroupId) {
      failV1(`$.boundExecutionPlan.solveGroups[${index}]`, "solveGroupId mismatch");
    }
    const stateIndexById = new Map(descriptor.stateLayout.slots.map(
      ({ stateId, logicalIndex }) => [stateId, logicalIndex] as const,
    ));
    const expectedActive = descriptorGroup.blocks
      .filter(({ disposition }) => disposition === "retained")
      .flatMap(({ stateIds }) => stateIds.map((id) => stateIndexById.get(id)!));
    arrays.push(assertInt32ValuesV1(
      group.activeStateLogicalIndices,
      expectedActive,
      `$.boundExecutionPlan.solveGroups[${index}].activeStateLogicalIndices`,
    ));
    arrays.push(assertInt32ValuesV1(
      group.dependentStateLogicalIndices,
      descriptorGroup.dependentStateIds.map((id) => stateIndexById.get(id)!),
      `$.boundExecutionPlan.solveGroups[${index}].dependentStateLogicalIndices`,
    ));
    arrays.push(f64ViewV1(
      group.workspaceF64,
      descriptorGroup.workspace.f64Count,
      `$.boundExecutionPlan.solveGroups[${index}].workspaceF64`,
    ));
    arrays.push(int32ViewV1(
      group.workspaceInt32,
      descriptorGroup.workspace.int32Count,
      `$.boundExecutionPlan.solveGroups[${index}].workspaceInt32`,
    ));
  });
  const buffers = new Set(arrays.map((view) => view.buffer));
  if (buffers.size !== arrays.length) {
    failV1("$.boundExecutionPlan", "typed allocations must not alias");
  }
  const allocatedBytes = arrays.reduce(
    (total, view) => total + view.byteLength,
    0,
  );
  if (
    nonnegativeIntegerV1(bound.allocatedBytes, "$.boundExecutionPlan.allocatedBytes")
      !== allocatedBytes
  ) {
    failV1("$.boundExecutionPlan.allocatedBytes", "allocation total mismatch");
  }
}

function validateSolveGroupV1(
  raw: unknown,
  groupIndex: number,
  slots: readonly unknown[],
  stateIdByLogicalIndex: readonly string[],
  solveGroupIds: Set<string>,
): void {
  const path = `$.solveGroups[${groupIndex}]`;
  const group = recordV1(raw, path);
  exactKeysV1(group, [
    "activeUnknownCount",
    "activeUnknownStateIds",
    "blocks",
    "dependentStateIds",
    "jacobianElementCount",
    "solveGroupId",
    "solver",
    "totalUnknownCount",
    "unknownStateIds",
    "workspace",
  ], path);
  const solveGroupId = portableIdV1(group.solveGroupId, `${path}.solveGroupId`);
  if (solveGroupIds.has(solveGroupId)) failV1(path, "duplicate solveGroupId");
  solveGroupIds.add(solveGroupId);
  const unknownStateIds = portableIdArrayV1(
    group.unknownStateIds,
    `${path}.unknownStateIds`,
  );
  const activeUnknownStateIds = portableIdArrayV1(
    group.activeUnknownStateIds,
    `${path}.activeUnknownStateIds`,
  );
  const dependentStateIds = portableIdArrayV1(
    group.dependentStateIds,
    `${path}.dependentStateIds`,
  );
  uniqueV1(unknownStateIds, `${path}.unknownStateIds`);
  uniqueV1(activeUnknownStateIds, `${path}.activeUnknownStateIds`);
  uniqueV1(dependentStateIds, `${path}.dependentStateIds`);
  const blocks = arrayV1(group.blocks, `${path}.blocks`);
  if (blocks.length === 0) failV1(`${path}.blocks`, "must not be empty");
  const compiledUnknowns: string[] = [];
  const compiledActive: string[] = [];
  const blockIds = new Set<string>();
  const residualIdsAcrossBlocks = new Set<string>();
  let nextStart = 0;
  blocks.forEach((blockRaw, blockIndex) => {
    const blockPath = `${path}.blocks[${blockIndex}]`;
    const block = recordV1(blockRaw, blockPath);
    exactKeysV1(block, [
      "blockId",
      "disposition",
      "endExclusive",
      "length",
      "residualIds",
      "start",
      "stateIds",
      "stateLogicalIndices",
    ], blockPath);
    const blockId = portableIdV1(block.blockId, `${blockPath}.blockId`);
    if (blockIds.has(blockId)) failV1(blockPath, "duplicate blockId");
    blockIds.add(blockId);
    if (block.disposition !== "retained"
      && block.disposition !== "statically-condensed") {
      failV1(`${blockPath}.disposition`, "unsupported disposition");
    }
    const stateIds = portableIdArrayV1(block.stateIds, `${blockPath}.stateIds`);
    const residualIds = portableIdArrayV1(
      block.residualIds,
      `${blockPath}.residualIds`,
    );
    uniqueV1(stateIds, `${blockPath}.stateIds`);
    uniqueV1(residualIds, `${blockPath}.residualIds`);
    residualIds.forEach((residualId) => {
      if (residualIdsAcrossBlocks.has(residualId)) {
        failV1(`${blockPath}.residualIds`, "residualId is duplicated across solve blocks");
      }
      residualIdsAcrossBlocks.add(residualId);
    });
    const logicalIndices = integerArrayV1(
      block.stateLogicalIndices,
      `${blockPath}.stateLogicalIndices`,
    );
    const start = nonnegativeIntegerV1(block.start, `${blockPath}.start`);
    const length = positiveIntegerV1(block.length, `${blockPath}.length`);
    const end = positiveIntegerV1(block.endExclusive, `${blockPath}.endExclusive`);
    if (
      start !== nextStart
      || end !== start + length
      || stateIds.length !== length
      || residualIds.length !== length
      || logicalIndices.length !== length
    ) {
      failV1(blockPath, "solve block dimensions are inconsistent");
    }
    stateIds.forEach((stateId, index) => {
      const logicalIndex = logicalIndices[index]!;
      continuousLogicalIndexV1(logicalIndex, slots, `${blockPath}.stateLogicalIndices[${index}]`);
      if (stateIdByLogicalIndex[logicalIndex] !== stateId) {
        failV1(`${blockPath}.stateLogicalIndices[${index}]`, "state identity mismatch");
      }
    });
    compiledUnknowns.push(...stateIds);
    if (block.disposition === "retained") compiledActive.push(...stateIds);
    nextStart = end;
  });
  if (!sameStringsV1(unknownStateIds, compiledUnknowns)
    || !sameStringsV1(activeUnknownStateIds, compiledActive)) {
    failV1(path, "solve block state projections are inconsistent");
  }
  dependentStateIds.forEach((stateId, index) => {
    const logicalIndex = stateIdByLogicalIndex.indexOf(stateId);
    if (logicalIndex < 0 || unknownStateIds.includes(stateId)) {
      failV1(`${path}.dependentStateIds[${index}]`, "dependent state is invalid");
    }
    continuousLogicalIndexV1(logicalIndex, slots, `${path}.dependentStateIds[${index}]`);
  });
  const total = nonnegativeIntegerV1(group.totalUnknownCount, `${path}.totalUnknownCount`);
  const active = positiveIntegerV1(group.activeUnknownCount, `${path}.activeUnknownCount`);
  if (total !== unknownStateIds.length || active !== activeUnknownStateIds.length) {
    failV1(path, "unknown counts are inconsistent");
  }
  if (
    nonnegativeIntegerV1(group.jacobianElementCount, `${path}.jacobianElementCount`)
      !== active * active
  ) {
    failV1(`${path}.jacobianElementCount`, "must equal activeUnknownCount squared");
  }
  const workspace = recordV1(group.workspace, `${path}.workspace`);
  exactKeysV1(workspace, [
    "f64Count",
    "f64Segments",
    "int32Count",
    "int32Segments",
  ], `${path}.workspace`);
  const f64Count = nonnegativeIntegerV1(
    workspace.f64Count,
    `${path}.workspace.f64Count`,
  );
  const int32Count = nonnegativeIntegerV1(
    workspace.int32Count,
    `${path}.workspace.int32Count`,
  );
  validateWorkspaceSegmentsV1(
    workspace.f64Segments,
    NEWTON_F64_WORKSPACE_ROLES_V1,
    [
      active,
      active,
      active * active,
      active * active,
      active,
      active,
      active,
      active,
      active,
      active,
      active,
    ],
    f64Count,
    `${path}.workspace.f64Segments`,
  );
  validateWorkspaceSegmentsV1(
    workspace.int32Segments,
    NEWTON_INT32_WORKSPACE_ROLES_V1,
    [active],
    int32Count,
    `${path}.workspace.int32Segments`,
  );
  const solver = recordV1(group.solver, `${path}.solver`);
  exactKeysV1(solver, [
    "globalization",
    "jacobian",
    "linearSolver",
    "matrixStorage",
    "nonlinearMethod",
  ], `${path}.solver`);
  if (
    solver.nonlinearMethod !== "newton"
    || solver.globalization !== "armijo-line-search"
    || solver.jacobian !== "component-analytic-with-finite-difference-audit"
    || solver.linearSolver !== "dense-lu"
    || solver.matrixStorage !== "row-major-f64"
  ) {
    failV1(`${path}.solver`, "unsupported solver policy");
  }
}

function validateWorkspaceSegmentsV1<TRole extends string>(
  raw: unknown,
  expectedRoles: readonly TRole[],
  expectedLengths: readonly number[],
  declaredCount: number,
  path: string,
): void {
  const segments = arrayV1(raw, path);
  if (
    segments.length !== expectedRoles.length
    || expectedLengths.length !== expectedRoles.length
  ) {
    failV1(path, "segment role count does not match solver policy");
  }
  let expectedOffset = 0;
  segments.forEach((rawSegment, index) => {
    const segmentPath = `${path}[${index}]`;
    const segment = recordV1(rawSegment, segmentPath);
    exactKeysV1(segment, ["length", "offset", "role"], segmentPath);
    if (segment.role !== expectedRoles[index]) {
      failV1(`${segmentPath}.role`, "workspace role order is invalid");
    }
    const offset = nonnegativeIntegerV1(
      segment.offset,
      `${segmentPath}.offset`,
    );
    const length = positiveIntegerV1(
      segment.length,
      `${segmentPath}.length`,
    );
    if (offset !== expectedOffset || length !== expectedLengths[index]) {
      failV1(segmentPath, "workspace segment is not canonical");
    }
    expectedOffset += length;
  });
  if (expectedOffset !== declaredCount) {
    failV1(path, "workspace segments do not cover the declared storage");
  }
}

function validateAndOwnKernelCatalogV1(
  value: unknown,
): ExecutionPlanKernelBindingCatalogV1 {
  const owned = ownDataV1(value, "$.bindingCatalog");
  const record = recordV1(owned, "$.bindingCatalog");
  exactKeysV1(record, [
    "componentKernelIds",
    "hydraulicPathKernelIds",
  ], "$.bindingCatalog");
  const componentKernelIds = portableIdArrayV1(
    record.componentKernelIds,
    "$.bindingCatalog.componentKernelIds",
  );
  const hydraulicPathKernelIds = portableIdArrayV1(
    record.hydraulicPathKernelIds,
    "$.bindingCatalog.hydraulicPathKernelIds",
  );
  uniqueV1(componentKernelIds, "$.bindingCatalog.componentKernelIds");
  uniqueV1(hydraulicPathKernelIds, "$.bindingCatalog.hydraulicPathKernelIds");
  return Object.freeze({
    componentKernelIds: Object.freeze(componentKernelIds),
    hydraulicPathKernelIds: Object.freeze(hydraulicPathKernelIds),
  });
}

function assertExactBindingSetV1(
  required: readonly string[],
  provided: readonly string[],
  label: string,
): void {
  const requiredSet = new Set(required);
  const providedSet = new Set(provided);
  if (
    requiredSet.size !== providedSet.size
    || [...requiredSet].some((id) => !providedSet.has(id))
  ) {
    throw new Error(`Execution plan ${label} bindings must match exactly`);
  }
}

function ownDataV1(
  value: unknown,
  path: string,
  ancestors: Set<object> = new Set<object>(),
  depth = 0,
): unknown {
  if (depth > MAXIMUM_EXECUTION_PLAN_DATA_DEPTH_V1) {
    failV1(path, "portable data nesting limit exceeded");
  }
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0)) {
      failV1(path, "numbers must be finite and must not be negative zero");
    }
    return value;
  }
  if (Array.isArray(value)) {
    if (ancestors.has(value)) failV1(path, "must not be cyclic");
    if (Object.getPrototypeOf(value) !== Array.prototype) {
      failV1(path, "must be a plain array");
    }
    ancestors.add(value);
    try {
      const result: unknown[] = [];
      for (let index = 0; index < value.length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (descriptor === undefined || !("value" in descriptor) || !descriptor.enumerable) {
          failV1(`${path}[${index}]`, "must be an enumerable data property");
        }
        result.push(ownDataV1(
          descriptor.value,
          `${path}[${index}]`,
          ancestors,
          depth + 1,
        ));
      }
      const allowed = new Set(["length", ...result.map((_, index) => String(index))]);
      if (Reflect.ownKeys(value).some((key) => typeof key !== "string" || !allowed.has(key))) {
        failV1(path, "must not contain custom array fields");
      }
      return Object.freeze(result);
    } finally {
      ancestors.delete(value);
    }
  }
  if (value === null || typeof value !== "object") {
    failV1(path, "contains a nonportable value");
  }
  if (Object.getPrototypeOf(value) !== Object.prototype
    && Object.getPrototypeOf(value) !== null) {
    failV1(path, "must be a plain data object");
  }
  if (ancestors.has(value)) failV1(path, "must not be cyclic");
  ancestors.add(value);
  try {
    const result: Record<string, unknown> = Object.create(null);
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string") failV1(path, "must not contain symbol fields");
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined || !("value" in descriptor) || !descriptor.enumerable) {
        failV1(`${path}.${key}`, "must be an enumerable data property");
      }
      result[key] = ownDataV1(
        descriptor.value,
        `${path}.${key}`,
        ancestors,
        depth + 1,
      );
    }
    return Object.freeze(result);
  } finally {
    ancestors.delete(value);
  }
}

function recordV1(value: unknown, path: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    failV1(path, "must be an object");
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    failV1(path, "must be a plain data object");
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string") failV1(path, "must not contain symbol fields");
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor === undefined
      || !descriptor.enumerable
      || !("value" in descriptor)
    ) {
      failV1(`${path}.${key}`, "must be an enumerable data property");
    }
  }
  return value as Record<string, unknown>;
}

function arrayV1(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) failV1(path, "must be an array");
  if (Object.getPrototypeOf(value) !== Array.prototype) {
    failV1(path, "must be a plain array");
  }
  const allowed = new Set(["length"]);
  for (let index = 0; index < value.length; index += 1) {
    const key = String(index);
    allowed.add(key);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor === undefined
      || !descriptor.enumerable
      || !("value" in descriptor)
    ) {
      failV1(`${path}[${index}]`, "must be an enumerable data property");
    }
  }
  if (
    Reflect.ownKeys(value).some((key) =>
      typeof key !== "string" || !allowed.has(key))
  ) {
    failV1(path, "must not contain custom array fields");
  }
  return value;
}

function exactKeysV1(
  value: Record<string, unknown>,
  expected: readonly string[],
  path: string,
): void {
  const actual = Object.keys(value).sort();
  const keys = [...expected].sort();
  if (actual.length !== keys.length
    || actual.some((key, index) => key !== keys[index])) {
    failV1(path, `fields must be exactly ${keys.join(", ")}`);
  }
}

function portableIdV1(value: unknown, path: string): string {
  if (typeof value !== "string" || !PORTABLE_ID.test(value)) {
    failV1(path, "must be a portable identifier");
  }
  return value;
}

function portableRuntimeIdV1(value: unknown, path: string): string {
  if (typeof value !== "string" || !PORTABLE_RUNTIME_ID.test(value)) {
    failV1(path, "must be a portable runtime identifier");
  }
  return value;
}

function portableIdArrayV1(value: unknown, path: string): string[] {
  return arrayV1(value, path).map((item, index) =>
    portableIdV1(item, `${path}[${index}]`));
}

function integerArrayV1(value: unknown, path: string): number[] {
  return arrayV1(value, path).map((item, index) =>
    integerV1(item, `${path}[${index}]`));
}

function integerV1(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    failV1(path, "must be a safe integer");
  }
  return value;
}

function nonnegativeIntegerV1(value: unknown, path: string): number {
  const number = integerV1(value, path);
  if (number < 0) failV1(path, "must be nonnegative");
  return number;
}

function positiveIntegerV1(value: unknown, path: string): number {
  const number = integerV1(value, path);
  if (number <= 0) failV1(path, "must be positive");
  return number;
}

function positiveFiniteV1(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    failV1(path, "must be positive and finite");
  }
  return value;
}

function nonnegativeFiniteV1(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    failV1(path, "must be nonnegative and finite");
  }
  return value;
}

function nonemptyStringV1(value: unknown, path: string): string {
  if (typeof value !== "string" || value.length === 0) {
    failV1(path, "must be a nonempty string");
  }
  return value;
}

function uniqueV1(values: readonly string[], path: string): void {
  if (new Set(values).size !== values.length) failV1(path, "must be unique");
}

function continuousLogicalIndexV1(
  logicalIndex: number,
  slots: readonly unknown[],
  path: string,
): void {
  if (logicalIndex < 0 || logicalIndex >= slots.length) {
    failV1(path, "is outside the state layout");
  }
  const slot = recordV1(slots[logicalIndex], path);
  if (slot.storageKind !== "continuous-f64") {
    failV1(path, "must reference continuous state");
  }
}

function f64ViewV1(value: unknown, length: number, path: string): Float64Array {
  if (!(value instanceof Float64Array) || value.length !== length
    || !fixedOwnedArrayBufferV1(value.buffer)
    || value.byteOffset !== 0 || value.byteLength !== value.buffer.byteLength) {
    failV1(path, "must be one owned Float64Array of the expected length");
  }
  return value;
}

function int32ViewV1(value: unknown, length: number, path: string): Int32Array {
  if (!(value instanceof Int32Array) || value.length !== length
    || !fixedOwnedArrayBufferV1(value.buffer)
    || value.byteOffset !== 0 || value.byteLength !== value.buffer.byteLength) {
    failV1(path, "must be one owned Int32Array of the expected length");
  }
  return value;
}

function u8ViewV1(value: unknown, length: number, path: string): Uint8Array {
  if (!(value instanceof Uint8Array) || value.length !== length
    || !fixedOwnedArrayBufferV1(value.buffer)
    || value.byteOffset !== 0 || value.byteLength !== value.buffer.byteLength) {
    failV1(path, "must be one owned Uint8Array of the expected length");
  }
  return value;
}

function fixedOwnedArrayBufferV1(buffer: ArrayBufferLike): buffer is ArrayBuffer {
  return buffer instanceof ArrayBuffer
    && !(
      "resizable" in buffer
      && (buffer as ArrayBuffer & { readonly resizable: boolean }).resizable
    );
}

function assertInt32ValuesV1(
  value: unknown,
  expected: readonly number[],
  path: string,
): Int32Array {
  const view = int32ViewV1(value, expected.length, path);
  for (let index = 0; index < expected.length; index += 1) {
    if (view[index] !== expected[index]) failV1(path, "values do not match descriptor");
  }
  return view;
}

function sameStringsV1(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function failV1(path: string, message: string): never {
  throw new Error(`Execution plan rejected ${path}: ${message}`);
}
