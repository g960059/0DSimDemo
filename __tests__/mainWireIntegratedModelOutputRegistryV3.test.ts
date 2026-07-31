import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3,
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_FRAME_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_SNAPSHOT_V3,
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_STATUS_FIELDS_V3,
  MainWireIntegratedModelOutputProjectionErrorV3,
  projectMainWireIntegratedModelAdvancedFrameV3,
  projectMainWireIntegratedModelObservationV3,
} from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PRESENTATION_COVERAGE_V3,
  MainWireIntegratedModelSessionV3,
  mainWireIntegratedModelPresentationTargetTimeSecV3,
  type MainWireIntegratedModelPresentationAdvanceV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";

const EXACT_CATALOG = [
  {
    outputId: "hemodynamics.volume.LV",
    quantityKind: "volume",
    unit: "mL",
    modelingStatus: "modeled",
    sourceKind: "accepted-state",
    sourcePath: "accepted.coronary.circulation.nodeVolumesMl.LV",
  },
  {
    outputId: "hemodynamics.pressure.absolute.LV",
    quantityKind: "pressure",
    unit: "mmHg",
    modelingStatus: "modeled",
    sourceKind: "accepted-step-readback",
    sourcePath:
      "step.coronaryStep.baseStep.circulationTrial.nodeAbsolutePressuresMmHg.LV",
  },
  {
    outputId: "hemodynamics.pressure.absolute.Ao",
    quantityKind: "pressure",
    unit: "mmHg",
    modelingStatus: "modeled",
    sourceKind: "accepted-step-readback",
    sourcePath:
      "step.coronaryStep.baseStep.circulationTrial.nodeAbsolutePressuresMmHg.Ao",
  },
  {
    outputId: "coronary.flow.total",
    quantityKind: "flow",
    unit: "mL/s",
    modelingStatus: "modeled",
    sourceKind: "accepted-step-readback",
    sourcePath:
      "step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.totalInletFlowMlPerSec",
  },
  {
    outputId: "coronary.flow.inlet.LAD",
    quantityKind: "flow",
    unit: "mL/s",
    modelingStatus: "modeled",
    sourceKind: "accepted-step-readback",
    sourcePath:
      "step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.inletFlowMlPerSecByTerritory.LAD",
  },
  {
    outputId: "coronary.flow.inlet.LCx",
    quantityKind: "flow",
    unit: "mL/s",
    modelingStatus: "modeled",
    sourceKind: "accepted-step-readback",
    sourcePath:
      "step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.inletFlowMlPerSecByTerritory.LCx",
  },
  {
    outputId: "coronary.flow.inlet.RCA",
    quantityKind: "flow",
    unit: "mL/s",
    modelingStatus: "modeled",
    sourceKind: "accepted-step-readback",
    sourcePath:
      "step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.inletFlowMlPerSecByTerritory.RCA",
  },
  {
    outputId: "device.LVAD.flow",
    quantityKind: "flow",
    unit: "mL/s",
    modelingStatus: "modeled",
    sourceKind: "accepted-state",
    sourcePath:
      "accepted.dynamicMechanicalSupport.acceptedFlowMlPerSec.LVAD",
  },
] as const;

describe("Main Wire Integrated Model V3 output registry", () => {
  it("locks the exact eight-output catalog and excludes status from frames", () => {
    expect(MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_ID).toBe(
      "main-wire-integrated-model-output-registry-v3",
    );
    expect(MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_FRAME_V3_ID).toBe(
      "main-wire-integrated-model-output-frame-v3",
    );
    expect(MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3).toEqual(
      EXACT_CATALOG,
    );
    expect(MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3).toEqual(
      EXACT_CATALOG.map(({ outputId }) => outputId),
    );
    expect(MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_SNAPSHOT_V3)
      .toMatchObject({
        unavailableValuePolicy: "null-never-zero",
      });
    expect(MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_SNAPSHOT_V3)
      .not.toHaveProperty("statusFieldsExcluded");
    expect(MAIN_WIRE_INTEGRATED_MODEL_STATUS_FIELDS_V3).toEqual([
      "model-time",
      "accepted-revision",
      "internal-substep-count",
      "atrial-capture-count",
      "ventricular-capture-count",
      "rhythm-label",
      "mcs-label",
      "pacing-state",
    ]);
  });

  it("projects cold, restored, accepted-step, and event-substep availability exactly", async () => {
    const session = await MainWireIntegratedModelSessionV3.create();
    const cold = projectMainWireIntegratedModelObservationV3(session.observe());

    expect(Object.keys(cold)).toEqual([
      "frameId",
      "registryId",
      "schemaVersion",
      "values",
    ]);
    expect(cold.values["hemodynamics.volume.LV"]).toMatchObject({
      value: expect.any(Number),
      availability: "available",
      quality: "authoritative-state",
    });
    expect(cold.values["device.LVAD.flow"]).toMatchObject({
      value: expect.any(Number),
      availability: "available",
      quality: "authoritative-state",
    });
    for (const outputId of MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3) {
      const definition =
        MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3.find(
          (entry) => entry.outputId === outputId,
        );
      if (definition?.sourceKind !== "accepted-step-readback") continue;
      expect(cold.values[outputId]).toEqual({
        outputId,
        value: null,
        availability: "not-evaluated-at-accepted-state",
        quality: "not-assessed",
      });
    }

    const first = expectAdvanced(session.advanceToPresentationTime(
      mainWireIntegratedModelPresentationTargetTimeSecV3(1),
    ));
    const firstFrame =
      projectMainWireIntegratedModelAdvancedFrameV3(first);
    const firstStep = first.observation.lastAcceptedStep;
    expect(firstStep).not.toBeNull();
    if (firstStep === null) throw new Error("accepted-step readback is absent");
    expect(firstFrame.values["hemodynamics.pressure.absolute.LV"].value).toBe(
      firstStep.coronaryStep.baseStep.circulationTrial
        .nodeAbsolutePressuresMmHg.LV,
    );
    expect(firstFrame.values["hemodynamics.pressure.absolute.Ao"].value).toBe(
      firstStep.coronaryStep.baseStep.circulationTrial
        .nodeAbsolutePressuresMmHg.Ao,
    );
    expect(firstFrame.values["coronary.flow.total"].value).toBe(
      firstStep.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics
        .totalInletFlowMlPerSec,
    );
    for (const territory of ["LAD", "LCx", "RCA"] as const) {
      expect(firstFrame.values[`coronary.flow.inlet.${territory}`].value).toBe(
        firstStep.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics
          .inletFlowMlPerSecByTerritory[territory],
      );
    }

    const checkpoint = await session.checkpointOperational();
    const restored =
      await MainWireIntegratedModelSessionV3.restoreOperationalCheckpoint(
        JSON.parse(JSON.stringify(checkpoint)),
      );
    const restoredFrame = projectMainWireIntegratedModelObservationV3(
      restored.observe(),
    );
    expect(restoredFrame.values["hemodynamics.volume.LV"]).toEqual(
      firstFrame.values["hemodynamics.volume.LV"],
    );
    expect(restoredFrame.values["device.LVAD.flow"]).toEqual(
      firstFrame.values["device.LVAD.flow"],
    );
    expect(restoredFrame.values["coronary.flow.total"]).toMatchObject({
      value: null,
      availability: "not-evaluated-at-accepted-state",
    });

    let boundaryAdvance: ReturnType<typeof expectAdvanced> = first;
    for (let ordinal = 2; ordinal <= 407; ordinal += 1) {
      boundaryAdvance = expectAdvanced(
        restored.advanceToPresentationTime(
          mainWireIntegratedModelPresentationTargetTimeSecV3(ordinal),
        ),
      );
    }
    expect(boundaryAdvance.internalAcceptedSubstepCount).toBe(2);
    const boundaryFrame =
      projectMainWireIntegratedModelAdvancedFrameV3(boundaryAdvance);
    expect(Object.values(boundaryFrame.values).every(
      ({ availability }) => availability === "available",
    )).toBe(true);
  }, 120_000);

  it("refuses failed and already-at-target advances instead of emitting a frame", async () => {
    const session = await MainWireIntegratedModelSessionV3.create();
    const retainedFrame = projectMainWireIntegratedModelObservationV3(
      session.observe(),
    );
    const alreadyAtTarget = session.advanceToPresentationTime(0);
    const failed: MainWireIntegratedModelPresentationAdvanceV3 = Object.freeze({
      status: "failed",
      reason: "candidate-time-did-not-advance",
      message: "forced projection refusal",
      acceptedTimeSec: 0,
      acceptedRevision: 0,
      partiallyAdvanced: false,
      internalAcceptedSubstepCount: 0,
      requestedPresentationTimeSec: 0.002,
    });

    expect(() =>
      projectMainWireIntegratedModelAdvancedFrameV3(alreadyAtTarget)
    ).toThrow(MainWireIntegratedModelOutputProjectionErrorV3);
    expect(() =>
      projectMainWireIntegratedModelAdvancedFrameV3(failed)
    ).toThrow(MainWireIntegratedModelOutputProjectionErrorV3);
    expect(projectMainWireIntegratedModelObservationV3(session.observe()))
      .toEqual(retainedFrame);
  });

  it("keeps the V3 projector separate from release and persistence concerns", () => {
    const projectorSource = readFileSync(
      new URL(
        "../engine/myocardium/MainWireIntegratedModelOutputRegistryV3.ts",
        import.meta.url,
      ),
      "utf8",
    );
    expect(projectorSource).not.toMatch(/ExactSignalExport|EXACT_SIGNAL/);
    expect(MAIN_WIRE_INTEGRATED_MODEL_PRESENTATION_COVERAGE_V3).toBe(
      "integrated-v3-live-presentation",
    );
    expect(projectorSource).not.toMatch(
      /sha256|ExactCheckpoint|RunArtifact|artifactStore/,
    );
  });
});

function expectAdvanced(
  result: MainWireIntegratedModelPresentationAdvanceV3,
): Extract<
  MainWireIntegratedModelPresentationAdvanceV3,
  { status: "advanced" }
> {
  expect(result.status).toBe("advanced");
  if (result.status !== "advanced") {
    throw new Error(
      result.status === "failed"
        ? result.message
        : "presentation target did not advance",
    );
  }
  return result;
}
