import { describe, expect, it } from "vitest";
import {
  MYOCARDIUM_PHASE1A_CONTRACT_SCOPE,
  type ModelProvenance,
  type MyocardiumInstanceSpec,
  type StateBlockDescriptor,
} from "@/engine/myocardium/contracts";
import { PeriodicActivationSchedulerV1 } from "@/engine/myocardium/activation/periodicActivationSchedulerV1";
import { assertValidModelProvenance, validateModelProvenance } from "@/engine/myocardium/provenance";
import {
  compareModelInstancePath,
  parseModelInstancePath,
  serializeModelInstancePath,
} from "@/engine/myocardium/state/ModelInstancePath";
import {
  MYOCARDIUM_STATE_LAYOUT_SCOPE,
  buildDynamicStateLayout,
} from "@/engine/myocardium/state/StateLayoutBuilder";

describe("myocardium Phase 1A contracts", () => {
  it("pins activation instance and scheduler literal ID divergence", () => {
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

    expect(spec.activation.modelId).toBe("activation-scheduler-v1");
    expect(scheduler.id).toBe("periodic-activation-scheduler-v1");
    expect(scheduler.id).not.toBe(spec.activation.modelId);
  });

  it("documents deferred schema-breaking state adoption items", () => {
    expect(MYOCARDIUM_PHASE1A_CONTRACT_SCOPE.modelCoreIntegration).toBe(false);
    expect(MYOCARDIUM_PHASE1A_CONTRACT_SCOPE.legacyRuntimeSchemaMigration).toBe(false);
    expect(MYOCARDIUM_PHASE1A_CONTRACT_SCOPE.oldSnapshotLoaderRejection).toBe(false);
    expect(MYOCARDIUM_PHASE1A_CONTRACT_SCOPE.deferredSpecSection).toBe("7.2");
    expect(MYOCARDIUM_PHASE1A_CONTRACT_SCOPE.deferredSchemaBreakingItems).toEqual([
      "MODEL_STATE_SCHEMA_VERSION",
      "old loader rejection",
    ]);
    expect(MYOCARDIUM_STATE_LAYOUT_SCOPE.wiredToLegacyStateLayout).toBe(false);
    expect(MYOCARDIUM_STATE_LAYOUT_SCOPE.legacyStateLayoutPath).toBe("engine/core/stateLayout.ts");
  });

  it("round-trips model instance paths with escaped separators", () => {
    const path = {
      chamber: "LV" as const,
      wallId: "free|wall",
      regionId: "base=mid",
      patchId: "patch%1",
      moduleId: "activation/module",
      instanceId: "instance|a=b",
    };

    const serialized = serializeModelInstancePath(path);

    expect(serialized).toContain("wallId=free%7Cwall");
    expect(serialized).toContain("regionId=base%3Dmid");
    expect(serialized).toContain("patchId=patch%251");
    expect(parseModelInstancePath(serialized)).toEqual(path);
    expect(compareModelInstancePath(path, parseModelInstancePath(serialized))).toBe(0);
    expect(serializeModelInstancePath({ moduleId: "activation", instanceId: "lv" })).not.toBe(
      serializeModelInstancePath({ chamber: "LV", moduleId: "activation", instanceId: "lv" }),
    );
    expect(() => serializeModelInstancePath({ moduleId: "", instanceId: "lv" })).toThrow(/moduleId is required/);
  });

  it("builds deterministic state layout offsets and hashes independent of input order", () => {
    const [activationBlock, calciumBlock] = phase1LayoutDescriptors();

    const layoutA = buildDynamicStateLayout([calciumBlock, activationBlock]);
    const layoutB = buildDynamicStateLayout([activationBlock, calciumBlock]);
    const relabeled = buildDynamicStateLayout([
      { ...activationBlock, labels: ["activationClockSec", "activationGain01"] },
      calciumBlock,
    ]);
    const repathed = buildDynamicStateLayout([
      { ...activationBlock, instance: { ...activationBlock.instance, patchId: "patch-2" } },
      calciumBlock,
    ]);

    expect(layoutA.blocks.map((block) => block.descriptor.blockId)).toEqual(["activation.lv", "calcium.lv"]);
    expect(layoutA.blocks.map((block) => block.offset)).toEqual([0, 2]);
    expect(layoutA.size).toBe(3);
    expect(layoutA.layoutHash).toBe(layoutB.layoutHash);
    expect(relabeled.layoutHash).not.toBe(layoutA.layoutHash);
    expect(repathed.layoutHash).not.toBe(layoutA.layoutHash);
  });

  it("uses locale-independent ordering for state blocks and activation targets", () => {
    const [activationBlock, calciumBlock] = phase1LayoutDescriptors();
    const layout = buildDynamicStateLayout([
      { ...activationBlock, blockId: "ä.activation" },
      { ...calciumBlock, blockId: "z.calcium" },
    ]);

    expect(layout.blocks.map((block) => block.descriptor.blockId)).toEqual(["z.calcium", "ä.activation"]);

    const scheduler = new PeriodicActivationSchedulerV1();
    const params = {
      targetIds: ["ä-target", "z-target"],
      cycleLengthSec: 1,
      defaultActivationDelaySec: 0.2,
      activationStrength01: 1,
    };

    scheduler.reset(0, params);
    expect(scheduler.advance(0.19, 0.2, params).events.map((event) => event.targetId)).toEqual([
      "z-target",
      "ä-target",
    ]);
  });

  it("rejects duplicate state block IDs and label-size mismatches", () => {
    const [activationBlock, calciumBlock] = phase1LayoutDescriptors();

    expect(() => buildDynamicStateLayout([activationBlock, { ...calciumBlock, blockId: "activation.lv" }])).toThrow(
      /duplicated/,
    );
    expect(() => buildDynamicStateLayout([{ ...activationBlock, labels: ["activationClockSec"] }])).toThrow(
      /labels length must match size/,
    );
  });

  it("emits canonical periodic activation events across interval boundaries", () => {
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
    const repeatedScheduler = new PeriodicActivationSchedulerV1();
    repeatedScheduler.reset(0, params);

    expect(output).toEqual(repeatedScheduler.advance(0.19, 1.5, params));
    expect(output.rhythmCycleId).toBe(1);
    expect(output.events.map((event) => event.targetId)).toEqual([
      "lv-free-wall",
      "rv-free-wall",
      "lv-free-wall",
      "rv-free-wall",
    ]);
    expect(output.events.map((event) => event.activationEventId)).toEqual([1, 1, 2, 2]);
    expect(output.events.map((event) => event.timeSinceActivationSec)).toEqual([
      expect.closeTo(1.3),
      expect.closeTo(1.1),
      expect.closeTo(0.3),
      expect.closeTo(0.1),
    ]);

    for (const event of output.events) {
      expect(Object.keys(event).sort()).toEqual([
        "activationEventId",
        "activationStrength01",
        "cycleLengthSec",
        "targetId",
        "timeSinceActivationSec",
      ]);
      expect("heartRateBpm" in event).toBe(false);
      expect("phase" in event).toBe(false);
      expect("freeCalciumUM" in event).toBe(false);
      expect("calciumAmplitudeUM" in event).toBe(false);
    }
  });

  it("validates periodic activation scheduler parameter ranges", () => {
    const scheduler = new PeriodicActivationSchedulerV1();
    const params = {
      targetIds: ["lv-free-wall"],
      cycleLengthSec: 1,
      defaultActivationDelaySec: 0,
      activationStrength01: 1,
    };

    expect(() => scheduler.reset(0, { ...params, cycleLengthSec: 0 })).toThrow(/cycleLengthSec/);
    expect(() => scheduler.reset(0, { ...params, defaultActivationDelaySec: -0.01 })).toThrow(
      /defaultActivationDelaySec/,
    );
    expect(() => scheduler.reset(0, { ...params, activationStrength01: 1.01 })).toThrow(/activationStrength01/);
    expect(() =>
      scheduler.reset(0, { ...params, delayByTargetIdSec: { "lv-free-wall": Number.NaN } }),
    ).toThrow(/delayByTargetIdSec/);
  });

  it("catches missing required provenance fields and source references", () => {
    const valid = modelProvenanceFixture();

    expect(validateModelProvenance(valid)).toEqual([]);
    expect(assertValidModelProvenance(valid)).toBe(valid);

    const invalid: ModelProvenance = {
      ...valid,
      equationsVersion: " ",
      calibrationDatasetIds: [],
      sourceReferences: ["source-1", ""],
    };
    const issues = validateModelProvenance(invalid);

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "equationsVersion" }),
        expect.objectContaining({ field: "calibrationDatasetIds" }),
        expect.objectContaining({ field: "sourceReferences" }),
      ]),
    );
    expect(() => assertValidModelProvenance(invalid)).toThrow(/Invalid myocardium model provenance/);
  });
});

function phase1LayoutDescriptors(): readonly [StateBlockDescriptor, StateBlockDescriptor] {
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

function modelProvenanceFixture(): ModelProvenance {
  return {
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
    sourceReferences: ["source-1"],
    modelLimitations: ["Phase 1A standalone contracts only"],
  };
}
