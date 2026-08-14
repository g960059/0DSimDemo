import { describe, expect, it } from "vitest";

import {
  applyStudioExperimentPlanV1,
  previewStudioExperimentPlanV1,
  sealStudioExperimentSnapshotV1,
  type StudioAuthoringNumericalModelPortV1,
  type StudioNumericalAuthoringRepositoryPortV1,
} from "@/studio/application/authoring/StudioNumericalAuthoringV1";
import type {
  ExperimentSnapshotV2,
  ExperimentV2,
} from "@/studio/contracts/v2/content";
import {
  composeStandardModelContractV1,
} from "@/studio/contracts/v2/modelSurface";
import {
  admitExactModelExecutableRuntimeV2,
  validateExecutableBundleV2,
} from "@/studio/infrastructure/model/ExactModelExecutableValidationV1";
import {
  createCircleHeartExactModelReleaseV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1";
import standardDescriptorV1 from
  "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1.client.json";
import standardSurfaceReleaseV1 from
  "@/studio/integrations/mainWireIntegratedV3/model-surface-workbench-v1.json";
import {
  createDefaultExperimentSurfaceV3,
  reconcileWorkbenchSurfaceScenariosV3,
} from "@/components/workbench/WorkbenchSurfaceV3";

describe("Studio numerical authoring V1", () => {
  it("previews explicit Scenario operations, preserves omissions, and seals the saved head", async () => {
    const repository = memoryRepositoryV1();
    const models = numericalModelsV1();
    const firstPreview = await previewStudioExperimentPlanV1(
      repository,
      models,
      {
        experimentId: null,
        expectedVersion: null,
        title: "Fluid response",
        scenarioOperations: [{
          operation: "add",
          scenarioId: "scenario/baseline",
          label: "Baseline",
          sourceScenarioId: null,
          controls: [],
        }, {
          operation: "add",
          scenarioId: "scenario/fluid",
          label: "+500 mL",
          sourceScenarioId: null,
          controls: [{
            controlId: "hemodynamics.total-blood-volume-ml",
            value: 6100,
          }],
        }],
        presentation: { mode: "default", note: "AI preview" },
        executionBudget: executionBudgetV1(),
        observeOutputIds: ["hemodynamics.pressure.absolute.Ao"],
      },
    );

    expect(firstPreview.diff).toEqual({
      addedScenarioIds: ["scenario/baseline", "scenario/fluid"],
      updatedScenarioIds: [],
      removedScenarioIds: [],
      advancedScenarioIds: ["scenario/baseline", "scenario/fluid"],
      finalScenarioIds: ["scenario/baseline", "scenario/fluid"],
    });
    expect(firstPreview.observations).toHaveLength(2);
    await expect(applyStudioExperimentPlanV1(repository, models, {
      ...firstPreview.plan,
      title: "tampered after preview",
    })).rejects.toThrow(/digest does not match/);

    const applied = await applyStudioExperimentPlanV1(
      repository,
      models,
      firstPreview.plan,
    );
    expect(applied.savedExperiment).toMatchObject({
      version: 0,
      scenarioIds: ["scenario/baseline", "scenario/fluid"],
    });

    const secondPreview = await previewStudioExperimentPlanV1(
      repository,
      models,
      {
        experimentId: applied.savedExperiment.experimentId,
        expectedVersion: 0,
        title: "Fluid response",
        scenarioOperations: [{
          operation: "update",
          scenarioId: "scenario/baseline",
          label: "Reference",
          controls: [],
        }],
        presentation: { mode: "preserve", note: "AI preview" },
        executionBudget: executionBudgetV1(),
        observeOutputIds: null,
      },
    );
    expect(secondPreview.diff).toEqual({
      addedScenarioIds: [],
      updatedScenarioIds: ["scenario/baseline"],
      removedScenarioIds: [],
      advancedScenarioIds: [],
      finalScenarioIds: ["scenario/baseline", "scenario/fluid"],
    });
    const capturesBeforeLabelEdit = repository.experiment()!.content.scenarios.map(
      ({ capture }) => capture.checkpoint,
    );
    const labelApplied = await applyStudioExperimentPlanV1(
      repository,
      models,
      secondPreview.plan,
    );
    expect(labelApplied.savedExperiment.version).toBe(1);
    expect(repository.experiment()!.content.scenarios.map(
      ({ capture }) => capture.checkpoint,
    )).toEqual(capturesBeforeLabelEdit);

    await expect(sealStudioExperimentSnapshotV1(
      repository,
      models,
      {
        experimentId: applied.savedExperiment.experimentId,
        expectedVersion: 1,
        exactModel: firstPreview.plan.exactModel,
        snapshotId: "snapshot/rejected-observation",
        createdAt: "2026-08-11T00:00:00.000Z",
        observeOutputIds: ["output/not-available"],
      },
    )).rejects.toThrow(/Requested observation output is unavailable/);
    expect(repository.snapshot()).toBeNull();

    const sealed = await sealStudioExperimentSnapshotV1(
      repository,
      models,
      {
        experimentId: applied.savedExperiment.experimentId,
        expectedVersion: 1,
        exactModel: firstPreview.plan.exactModel,
        snapshotId: "snapshot/numerical-authoring-test",
        createdAt: "2026-08-11T00:00:00.000Z",
        observeOutputIds: null,
      },
    );
    expect(sealed.sealedSnapshot).toMatchObject({
      modelId: firstPreview.plan.exactModel.modelId,
      surfaceReleaseId: firstPreview.plan.exactModel.surfaceReleaseId,
      scenarioIds: ["scenario/baseline", "scenario/fluid"],
    });
    expect(repository.snapshot()).not.toBeNull();
  }, 30_000);

  it("binds packed and execution-plan extensions to immutable capabilities", () => {
    const release = createCircleHeartExactModelReleaseV1();
    const composed = composeStandardModelContractV1(
      release.manifest,
      standardSurfaceReleaseV1,
    );
    const {
      advancePresentationBatch: _packedExtension,
      ...historicalSimulationAdapter
    } = release.executables.simulationAdapter;
    const {
      executionPlan: _executionPlan,
      ...historicalExecutableBase
    } = release.executables;
    const historicalBundle = {
      ...historicalExecutableBase,
      simulationAdapter: historicalSimulationAdapter,
    } as typeof release.executables;

    expect(() => validateExecutableBundleV2(
      historicalBundle,
      composed.contract,
      { requiresPresentationBatch: false, requiresExecutionPlan: false },
    )).not.toThrow();
    expect(() => validateExecutableBundleV2(
      historicalBundle,
      composed.contract,
      { requiresPresentationBatch: true, requiresExecutionPlan: false },
    )).toThrow(/advancePresentationBatch/);
    expect(() => validateExecutableBundleV2(
      release.executables,
      composed.contract,
      { requiresPresentationBatch: true, requiresExecutionPlan: true },
    )).not.toThrow();
    expect(() => validateExecutableBundleV2(
      release.executables,
      composed.contract,
      { requiresPresentationBatch: true, requiresExecutionPlan: false },
    )).toThrow(/executable bundle must contain exactly/);
    expect(() => validateExecutableBundleV2(
      historicalExecutableBase,
      composed.contract,
      { requiresPresentationBatch: true, requiresExecutionPlan: true },
    )).toThrow(/executionPlan|execution plan/);
  });
});

function executionBudgetV1() {
  return Object.freeze({
    advanceSeconds: 0.02,
    maxPresentationSteps: 10,
    wallClockTimeoutMs: 10_000,
  });
}

function numericalModelsV1(): StudioAuthoringNumericalModelPortV1 {
  const release = createCircleHeartExactModelReleaseV1();
  const composed = composeStandardModelContractV1(
    release.manifest,
    standardSurfaceReleaseV1,
  );
  const runtime = admitExactModelExecutableRuntimeV2(
    release.executables,
    composed.contract,
    {
      requiresPresentationBatch: true,
      requiresExecutionPlan: true,
    },
  );
  const resolved = Object.freeze({
    contract: composed.contract,
    defaultFixture: standardDescriptorV1.defaultFixture,
    runtime: Object.freeze({
      ...runtime,
      snapshotGate: Object.freeze({
        modelId: runtime.snapshotGate.modelId,
        snapshotGateId: runtime.snapshotGate.snapshotGateId,
        async admitFrozenCandidate() {
          return Object.freeze({ status: "passed" as const });
        },
      }),
    }),
    surfaceReleaseId: standardSurfaceReleaseV1.surfaceReleaseId,
    surfaceSeriesId: standardSurfaceReleaseV1.surfaceSeriesId,
  });
  return Object.freeze({
    resolveActiveNumericalModel: async () => resolved,
    resolveLatestNumericalModel: async () => resolved,
    resolveExactNumericalModel: async () => resolved,
    prepareSurface(input) {
      const initial = input.presentation.mode === "preserve"
        ? input.currentSurface!
        : createDefaultExperimentSurfaceV3(
            input.contract,
            input.scenarioIds[0],
          );
      const surface = reconcileWorkbenchSurfaceScenariosV3(
        initial,
        input.scenarioIds.map((scenarioId) => ({ scenarioId })),
      );
      return Object.freeze({
        ...surface,
        note: Object.freeze({ text: input.presentation.note }),
      });
    },
  });
}

function memoryRepositoryV1(): StudioNumericalAuthoringRepositoryPortV1 & {
  experiment(): ExperimentV2 | null;
  snapshot(): ExperimentSnapshotV2 | null;
} {
  let experiment: ExperimentV2 | null = null;
  let snapshot: ExperimentSnapshotV2 | null = null;
  return {
    async readMyExperiment(experimentId) {
      return experiment?.experimentId === experimentId
        ? { experiment, title: "Fluid response" }
        : null;
    },
    async saveExperiment(input) {
      experiment = Object.freeze({
        schemaId: "circleheart-studio-experiment-v2",
        experimentId: input.experimentId ?? "experiment/numerical-authoring-test",
        version: input.expectedVersion === null ? 0 : input.expectedVersion + 1,
        content: input.content,
      });
      return experiment;
    },
    async commitSnapshot(input) {
      snapshot = input.admitted.snapshot;
      return snapshot;
    },
    experiment: () => experiment,
    snapshot: () => snapshot,
  };
}
