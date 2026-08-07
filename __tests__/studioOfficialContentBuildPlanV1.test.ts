import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  evaluateStudioOfficialExperimentAssertionsV1,
  prepareStudioOfficialExperimentBuildPlanV1,
} from "@/studio/application/authoring/StudioOfficialContentBuildPlanV1";
import {
  STUDIO_EXACT_MODEL_KERNEL_V3_SCHEMA_ID,
  controlCapabilityV1,
  outputCapabilityV1,
  type ExactModelKernelManifestV3,
} from "@/studio/contracts/v2/modelSurface";
import {
  MAIN_WIRE_PV_LOOP_AFTERLOAD_ASSERTION_ID_V1,
  MAIN_WIRE_PV_LOOP_CONTRACTILITY_ASSERTION_ID_V1,
  MAIN_WIRE_PV_LOOP_PRELOAD_ASSERTION_ID_V1,
  mainWireIntegratedOfficialScientificAssertionRegistryV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedOfficialContentAssertionsV1";

const recipe = parseJsonV1(
  "../content/official/pv-loop-basics-v1.experiment.json",
);
const surface = parseJsonV1(
  "../studio/integrations/mainWireIntegratedV3/model-surface-standard-v1.json",
);

describe("official content Standard-ABI build planning", () => {
  it("resolves the first recipe only when every exact capability and assertion exists", () => {
    const plan = prepareStudioOfficialExperimentBuildPlanV1({
      recipe,
      kernel: kernelV1(),
      surfaceRelease: surface,
      assertionRegistry:
        mainWireIntegratedOfficialScientificAssertionRegistryV1,
    });
    expect(plan).toEqual(expect.objectContaining({
      modelId: "circleheart.main-wire.standard-abi.article-1-candidate",
      surfaceReleaseId: "circleheart.main-wire.surface.standard-v1",
      assertionIds: [
        MAIN_WIRE_PV_LOOP_PRELOAD_ASSERTION_ID_V1,
        MAIN_WIRE_PV_LOOP_AFTERLOAD_ASSERTION_ID_V1,
        MAIN_WIRE_PV_LOOP_CONTRACTILITY_ASSERTION_ID_V1,
      ],
    }));
    expect(Object.isFrozen(plan)).toBe(true);
  });

  it("fails closed instead of weakening the article when contractility is absent", () => {
    const kernel = structuredClone(kernelV1()) as any;
    kernel.primitiveControlCatalog = kernel.primitiveControlCatalog.filter(
      ({ controlId }: any) => controlId !== "myocardium.contractility",
    );
    kernel.capabilities = kernel.capabilities.filter(
      (capability: string) =>
        capability !== controlCapabilityV1("myocardium.contractility"),
    );
    expect(() => prepareStudioOfficialExperimentBuildPlanV1({
      recipe,
      kernel,
      surfaceRelease: surface,
      assertionRegistry:
        mainWireIntegratedOfficialScientificAssertionRegistryV1,
    })).toThrow(/contractility|unknown registered control/i);
  });

  it("emits measured pass/fail evidence for every directional assertion", () => {
    const plan = prepareStudioOfficialExperimentBuildPlanV1({
      recipe,
      kernel: kernelV1(),
      surfaceRelease: surface,
      assertionRegistry:
        mainWireIntegratedOfficialScientificAssertionRegistryV1,
    });
    const evidence = [
      pvEvidenceV1("baseline", 150, 70, 100),
      pvEvidenceV1("increased-preload", 165, 72, 102),
      pvEvidenceV1("increased-afterload", 154, 82, 108),
      pvEvidenceV1("increased-contractility", 150, 60, 104),
    ];
    const gate = evaluateStudioOfficialExperimentAssertionsV1({
      plan,
      assertionRegistry:
        mainWireIntegratedOfficialScientificAssertionRegistryV1,
      scenarios: evidence,
    });
    expect(gate.status).toBe("passed");
    expect(gate.reports.map(({ status }) => status)).toEqual([
      "passed",
      "passed",
      "passed",
    ]);
    expect(gate.reports.every(({ measurements }) => measurements.length === 2))
      .toBe(true);

    const failedAfterload = mainWireIntegratedOfficialScientificAssertionRegistryV1
      .resolve(
        MAIN_WIRE_PV_LOOP_AFTERLOAD_ASSERTION_ID_V1,
        plan.recipe.modelFamilyId,
      )
      .evaluate({
        recipe: plan.recipe,
        scenarios: [
          evidence[0]!,
          pvEvidenceV1("increased-afterload", 154, 65, 99),
        ],
      });
    expect(failedAfterload.status).toBe("rejected");
    expect(failedAfterload.measurements).toEqual(expect.arrayContaining([
      expect.objectContaining({ measurementId: "end-systolic-pressure" }),
      expect.objectContaining({ measurementId: "stroke-volume" }),
    ]));
  });

  it("rejects an aggregate build gate when one measured claim fails", () => {
    const plan = prepareStudioOfficialExperimentBuildPlanV1({
      recipe,
      kernel: kernelV1(),
      surfaceRelease: surface,
      assertionRegistry:
        mainWireIntegratedOfficialScientificAssertionRegistryV1,
    });
    const gate = evaluateStudioOfficialExperimentAssertionsV1({
      plan,
      assertionRegistry:
        mainWireIntegratedOfficialScientificAssertionRegistryV1,
      scenarios: [
        pvEvidenceV1("baseline", 150, 70, 100),
        pvEvidenceV1("increased-preload", 165, 72, 102),
        pvEvidenceV1("increased-afterload", 154, 65, 99),
        pvEvidenceV1("increased-contractility", 150, 60, 104),
      ],
    });
    expect(gate.status).toBe("rejected");
    expect(gate.reports.find(({ assertionId }) =>
      assertionId === MAIN_WIRE_PV_LOOP_AFTERLOAD_ASSERTION_ID_V1)?.status)
      .toBe("rejected");
  });

  it("rejects incomplete or internally inconsistent evidence", () => {
    const plan = prepareStudioOfficialExperimentBuildPlanV1({
      recipe,
      kernel: kernelV1(),
      surfaceRelease: surface,
      assertionRegistry:
        mainWireIntegratedOfficialScientificAssertionRegistryV1,
    });
    expect(() => evaluateStudioOfficialExperimentAssertionsV1({
      plan,
      assertionRegistry:
        mainWireIntegratedOfficialScientificAssertionRegistryV1,
      scenarios: [pvEvidenceV1("baseline", 150, 70, 100)],
    })).toThrow(/missing Scenario evidence/i);
    expect(() => evaluateStudioOfficialExperimentAssertionsV1({
      plan,
      assertionRegistry:
        mainWireIntegratedOfficialScientificAssertionRegistryV1,
      scenarios: [
        {
          ...pvEvidenceV1("baseline", 150, 70, 100),
          evidence: {
            ...pvEvidenceV1("baseline", 150, 70, 100).evidence,
            strokeVolumeMl: 999,
          },
        },
        pvEvidenceV1("increased-preload", 165, 72, 102),
        pvEvidenceV1("increased-afterload", 154, 82, 108),
        pvEvidenceV1("increased-contractility", 150, 60, 104),
      ],
    })).toThrow(/strokeVolumeMl/i);
  });
});

function kernelV1(): ExactModelKernelManifestV3 {
  const controls = [
    controlV1("hemodynamics.total-blood-volume-ml", "mL", 4_800, 7_000, 50, 5_600),
    controlV1("hemodynamics.systemic-resistance", "1", 0.75, 1.25, 0.01, 1),
    controlV1("myocardium.contractility", "1", 0.5, 1.5, 0.05, 1),
  ];
  const signals = [
    signalV1("hemodynamics.volume.LV", "mL"),
    signalV1("hemodynamics.pressure.transmural.LV", "mmHg"),
    signalV1("rhythm.phase.regular-sinus", "1"),
  ];
  return {
    schemaId: STUDIO_EXACT_MODEL_KERNEL_V3_SCHEMA_ID,
    modelId: "circleheart.main-wire.standard-abi.article-1-candidate",
    modelFamilyId: "circleheart.main-wire-integrated-transaction",
    equations: { owner: "test-kernel" },
    runtime: { owner: "test-runtime" },
    solver: { owner: "test-solver" },
    fixtureSchema: {
      fixtureSchemaId: "circleheart.main-wire.standard-fixture.v1",
      definition: { owner: "test" },
    },
    checkpointCodec: {
      checkpointCodecId: "circleheart.main-wire.standard-checkpoint.v1",
      definition: { owner: "test" },
    },
    primitiveControlCatalog: controls,
    primitiveSignalCatalog: signals,
    capabilities: [
      ...controls.map(({ controlId }) => controlCapabilityV1(controlId)),
      ...signals.map(({ outputId }) => outputCapabilityV1(outputId)),
    ],
  };
}

function controlV1(
  controlId: string,
  unit: string,
  minimum: number,
  maximum: number,
  step: number,
  defaultValue: number,
) {
  return {
    controlId,
    valueType: "number" as const,
    unit,
    minimum,
    maximum,
    step,
    defaultValue,
    changeSemantics: "accepted-state-warm-start" as const,
  };
}

function signalV1(outputId: string, unit: string) {
  return {
    outputId,
    kind: "signal" as const,
    unit,
    shape: "scalar" as const,
    sampling: "accepted-step" as const,
  };
}

function pvEvidenceV1(
  scenarioId: string,
  endDiastolicVolumeMl: number,
  endSystolicVolumeMl: number,
  endSystolicPressureMmHg: number,
) {
  return {
    scenarioId,
    evidence: {
      kind: "pressure-volume-cycle" as const,
      endDiastolicVolumeMl,
      endSystolicVolumeMl,
      endSystolicPressureMmHg,
      strokeVolumeMl: endDiastolicVolumeMl - endSystolicVolumeMl,
    },
  };
}

function parseJsonV1(relativePath: string): unknown {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), "utf8"));
}
