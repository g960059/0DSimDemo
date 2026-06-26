import {
  MYOCARDIUM_PHASE1A_CONTRACT_SCOPE,
  type ModelProvenance,
  type MyocardiumInstanceSpec,
  type StateBlockDescriptor,
} from "@/engine/myocardium/contracts";
import { PeriodicActivationSchedulerV1 } from "@/engine/myocardium/activation/periodicActivationSchedulerV1";
import { validateModelProvenance } from "@/engine/myocardium/provenance";
import { parseModelInstancePath, serializeModelInstancePath } from "@/engine/myocardium/state/ModelInstancePath";
import {
  MYOCARDIUM_STATE_LAYOUT_SCOPE,
  buildDynamicStateLayout,
} from "@/engine/myocardium/state/StateLayoutBuilder";

const checks: string[] = [];
const errors: string[] = [];

check("Phase 1A scope is standalone", () => {
  assert(MYOCARDIUM_PHASE1A_CONTRACT_SCOPE.modelCoreIntegration === false);
  assert(MYOCARDIUM_PHASE1A_CONTRACT_SCOPE.legacyRuntimeSchemaMigration === false);
  assert(MYOCARDIUM_PHASE1A_CONTRACT_SCOPE.oldSnapshotLoaderRejection === false);
  assert(MYOCARDIUM_PHASE1A_CONTRACT_SCOPE.deferredSchemaBreakingItems.includes("MODEL_STATE_SCHEMA_VERSION"));
  assert(MYOCARDIUM_PHASE1A_CONTRACT_SCOPE.deferredSchemaBreakingItems.includes("old loader rejection"));
  assert(MYOCARDIUM_STATE_LAYOUT_SCOPE.wiredToLegacyStateLayout === false);
});

check("literal activation IDs preserve spec divergence", () => {
  const spec: MyocardiumInstanceSpec = {
    path: { chamber: "LV", moduleId: "myocardium", instanceId: "lv-reference" },
    activation: { modelId: "activation-scheduler-v1", parameterSetId: "activation-reference-v1" },
    kinematics: { modelId: "prescribed-fiber-kinematics-v1", parameterSetId: "kinematics-reference-v1" },
    passiveMaterial: { modelId: "passive-exponential-energy-v1", parameterSetId: "passive-reference-v1" },
    generalizedForceMapper: { modelId: "virtual-power-generalized-force-v1" },
    coupling: { modelId: "active-stiffness-partitioned-v1" },
    temperatureModelId: "fixed-310.15K-v1",
  };
  const scheduler = new PeriodicActivationSchedulerV1();
  const schedulerId: string = scheduler.id;
  assert(spec.activation.modelId !== schedulerId);
  assert(spec.activation.modelId === "activation-scheduler-v1");
  assert(schedulerId === "periodic-activation-scheduler-v1");
});

check("instance paths round-trip with escaped separators", () => {
  const path = {
    chamber: "LV" as const,
    wallId: "free|wall",
    regionId: "base=mid",
    patchId: "patch%1",
    moduleId: "activation/module",
    instanceId: "instance|a=b",
  };
  assertDeepEqual(parseModelInstancePath(serializeModelInstancePath(path)), path);
});

check("dynamic layout offsets and hash are deterministic", () => {
  const descriptors = phase1LayoutDescriptors();
  const layoutA = buildDynamicStateLayout([descriptors[1], descriptors[0]]);
  const layoutB = buildDynamicStateLayout([descriptors[0], descriptors[1]]);
  assert(layoutA.layoutHash === layoutB.layoutHash);
  assert(layoutA.size === 3);
  assert(layoutA.blocks[0].offset === 0);
  assert(layoutA.blocks[1].offset === 2);

  const unicodeLayout = buildDynamicStateLayout([
    { ...descriptors[0], blockId: "ä.activation" },
    { ...descriptors[1], blockId: "z.calcium" },
  ]);
  assertDeepEqual(unicodeLayout.blocks.map((block) => block.descriptor.blockId), ["z.calcium", "ä.activation"]);
});

check("periodic scheduler emits canonical activation events", () => {
  const scheduler = new PeriodicActivationSchedulerV1();
  const params = {
    targetIds: ["rv-free-wall", "lv-free-wall"],
    cycleLengthSec: 1,
    defaultActivationDelaySec: 0.2,
    delayByTargetIdSec: { "rv-free-wall": 0.4 },
    activationStrength01: 0.75,
  };
  scheduler.reset(0, params);
  const output = scheduler.advance(0.19, 1.5, params);
  assert(output.rhythmCycleId === 1);
  assertDeepEqual(output.events.map((event) => event.targetId), [
    "lv-free-wall",
    "rv-free-wall",
    "lv-free-wall",
    "rv-free-wall",
  ]);
  assertDeepEqual(output.events.map((event) => event.activationEventId), [1, 1, 2, 2]);
  for (const event of output.events) {
    assertDeepEqual(Object.keys(event).sort(), [
      "activationEventId",
      "activationStrength01",
      "cycleLengthSec",
      "targetId",
      "timeSinceActivationSec",
    ]);
  }

  const canonicalOrderScheduler = new PeriodicActivationSchedulerV1();
  const canonicalOrderParams = {
    targetIds: ["ä-target", "z-target"],
    cycleLengthSec: 1,
    defaultActivationDelaySec: 0.2,
    activationStrength01: 1,
  };
  canonicalOrderScheduler.reset(0, canonicalOrderParams);
  assertDeepEqual(
    canonicalOrderScheduler.advance(0.19, 0.2, canonicalOrderParams).events.map((event) => event.targetId),
    ["z-target", "ä-target"],
  );
});

check("model provenance rejects missing source references", () => {
  const provenance: ModelProvenance = {
    equationsVersion: "equations-v1",
    parameterSetId: "params-v1",
    parameterSetSha256: "sha256-reference",
    activationModelId: "activation-scheduler-v1",
    calciumModelId: "prescribed-calcium-transient-v1",
    homogenizationModelId: "homogenization-v1",
    mechanicsModelId: "mechanics-v1",
    generalizedForceModelId: "virtual-power-generalized-force-v1",
    calibrationDatasetIds: ["calibration-v1"],
    validationTargetPackIds: ["target-pack-v1"],
    calibrationCodeVersion: "calibration-code-v1",
    solverVersion: "solver-v1",
    stateSchemaVersion: 1,
    temperatureModelId: "fixed-310.15K-v1",
    decisionBaselineId: "ADR-MYO-001",
    sourceReferences: [],
    modelLimitations: ["Phase 1A standalone contracts only"],
  };
  assert(validateModelProvenance(provenance).some((issue) => issue.field === "sourceReferences"));
});

if (errors.length > 0) {
  // eslint-disable-next-line no-console
  console.error("myocardium Phase 1A standalone contracts FAIL");
  for (const error of errors) {
    // eslint-disable-next-line no-console
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  // eslint-disable-next-line no-console
  console.log(
    `myocardium Phase 1A standalone contracts PASS checks=${checks.length}; ` +
      "not ModelCore integration; not legacy state-layout wiring; " +
      "spec 7.2 MODEL_STATE_SCHEMA_VERSION and old loader rejection are deferred",
  );
}

function phase1LayoutDescriptors(): readonly StateBlockDescriptor[] {
  return [
    {
      blockId: "activation.lv",
      owner: "activation",
      instance: { chamber: "LV", moduleId: "activation", instanceId: "lv" },
      labels: ["activationClockSec", "activationStrength01"],
      size: 2,
      equationsVersion: "activation-contract-v1",
    },
    {
      blockId: "calcium.lv",
      owner: "calcium",
      instance: { chamber: "LV", moduleId: "calcium", instanceId: "lv" },
      labels: ["freeCalciumUM"],
      size: 1,
      equationsVersion: "calcium-contract-v1",
    },
  ];
}

function check(label: string, fn: () => void): void {
  checks.push(label);
  try {
    fn();
  } catch (error) {
    errors.push(`${label}: ${(error as Error).message}`);
  }
}

function assert(condition: unknown): asserts condition {
  if (!condition) throw new Error("assertion failed");
}

function assertDeepEqual(left: unknown, right: unknown): void {
  const leftJson = JSON.stringify(left);
  const rightJson = JSON.stringify(right);
  if (leftJson !== rightJson) {
    throw new Error(`expected ${rightJson}, got ${leftJson}`);
  }
}
