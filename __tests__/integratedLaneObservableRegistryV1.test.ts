import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_CATALOG_V1,
  MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_FRAME_V1_ID,
  MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_IDS_V1,
  MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_SNAPSHOT_V1,
  MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_V1_ID,
  MAIN_WIRE_INTEGRATED_LANE_STATUS_FIELDS_V1,
  MainWireIntegratedLaneObservableProjectionErrorV1,
  projectMainWireIntegratedLaneAdvancedFrameV1,
  projectMainWireIntegratedLaneObservationV1,
} from "@/engine/myocardium/MainWireIntegratedLaneObservableRegistryV1";
import {
  INTEGRATED_LANE_PRESENTATION_COVERAGE_V1,
  MainWireIntegratedLaneSessionV1,
  integratedLanePresentationTargetTimeSecV1,
  type MainWireIntegratedLanePresentationAdvanceV1,
} from "@/engine/myocardium/MainWireIntegratedLaneSessionV1";

const EXACT_CATALOG = [
  {
    observableId: "hemodynamics.volume.LV",
    quantityKind: "volume",
    unit: "mL",
    modelingStatus: "modeled",
    sourceKind: "accepted-state",
    sourcePath: "accepted.coronary.circulation.nodeVolumesMl.LV",
  },
  {
    observableId: "hemodynamics.pressure.absolute.LV",
    quantityKind: "pressure",
    unit: "mmHg",
    modelingStatus: "modeled",
    sourceKind: "accepted-step-readback",
    sourcePath:
      "step.coronaryStep.baseStep.circulationTrial.nodeAbsolutePressuresMmHg.LV",
  },
  {
    observableId: "hemodynamics.pressure.absolute.Ao",
    quantityKind: "pressure",
    unit: "mmHg",
    modelingStatus: "modeled",
    sourceKind: "accepted-step-readback",
    sourcePath:
      "step.coronaryStep.baseStep.circulationTrial.nodeAbsolutePressuresMmHg.Ao",
  },
  {
    observableId: "coronary.flow.total",
    quantityKind: "flow",
    unit: "mL/s",
    modelingStatus: "modeled",
    sourceKind: "accepted-step-readback",
    sourcePath:
      "step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.totalInletFlowMlPerSec",
  },
  {
    observableId: "coronary.flow.inlet.LAD",
    quantityKind: "flow",
    unit: "mL/s",
    modelingStatus: "modeled",
    sourceKind: "accepted-step-readback",
    sourcePath:
      "step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.inletFlowMlPerSecByTerritory.LAD",
  },
  {
    observableId: "coronary.flow.inlet.LCx",
    quantityKind: "flow",
    unit: "mL/s",
    modelingStatus: "modeled",
    sourceKind: "accepted-step-readback",
    sourcePath:
      "step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.inletFlowMlPerSecByTerritory.LCx",
  },
  {
    observableId: "coronary.flow.inlet.RCA",
    quantityKind: "flow",
    unit: "mL/s",
    modelingStatus: "modeled",
    sourceKind: "accepted-step-readback",
    sourcePath:
      "step.coronaryStep.baseStep.coronaryTrial.diagnostics.hydraulics.inletFlowMlPerSecByTerritory.RCA",
  },
  {
    observableId: "device.LVAD.flow",
    quantityKind: "flow",
    unit: "mL/s",
    modelingStatus: "modeled",
    sourceKind: "accepted-state",
    sourcePath:
      "accepted.dynamicMechanicalSupport.acceptedFlowMlPerSec.LVAD",
  },
] as const;

describe("integrated V3 observable registry", () => {
  it("locks the exact eight-observable catalog and excludes status from frames", () => {
    expect(MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_V1_ID).toBe(
      "main-wire-integrated-v3-experimental-observable-registry-v1",
    );
    expect(MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_FRAME_V1_ID).toBe(
      "main-wire-integrated-v3-experimental-observable-frame-v1",
    );
    expect(MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_CATALOG_V1).toEqual(
      EXACT_CATALOG,
    );
    expect(MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_IDS_V1).toEqual(
      EXACT_CATALOG.map(({ observableId }) => observableId),
    );
    expect(MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_SNAPSHOT_V1)
      .toMatchObject({
        unavailableValuePolicy: "null-never-zero",
      });
    expect(MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_SNAPSHOT_V1)
      .not.toHaveProperty("statusFieldsExcluded");
    expect(MAIN_WIRE_INTEGRATED_LANE_STATUS_FIELDS_V1).toEqual([
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
    const session = await MainWireIntegratedLaneSessionV1.create();
    const cold = projectMainWireIntegratedLaneObservationV1(session.observe());

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
    for (const observableId of MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_IDS_V1) {
      const definition =
        MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_CATALOG_V1.find(
          (entry) => entry.observableId === observableId,
        );
      if (definition?.sourceKind !== "accepted-step-readback") continue;
      expect(cold.values[observableId]).toEqual({
        observableId,
        value: null,
        availability: "not-evaluated-at-accepted-state",
        quality: "not-assessed",
      });
    }

    const first = expectAdvanced(session.advanceToPresentationTime(
      integratedLanePresentationTargetTimeSecV1(1),
    ));
    const firstFrame =
      projectMainWireIntegratedLaneAdvancedFrameV1(first);
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
      await MainWireIntegratedLaneSessionV1.restoreOperationalCheckpoint(
        JSON.parse(JSON.stringify(checkpoint)),
      );
    const restoredFrame = projectMainWireIntegratedLaneObservationV1(
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
          integratedLanePresentationTargetTimeSecV1(ordinal),
        ),
      );
    }
    expect(boundaryAdvance.internalAcceptedSubstepCount).toBe(2);
    const boundaryFrame =
      projectMainWireIntegratedLaneAdvancedFrameV1(boundaryAdvance);
    expect(Object.values(boundaryFrame.values).every(
      ({ availability }) => availability === "available",
    )).toBe(true);
  }, 120_000);

  it("refuses failed and already-at-target advances instead of emitting a frame", async () => {
    const session = await MainWireIntegratedLaneSessionV1.create();
    const retainedFrame = projectMainWireIntegratedLaneObservationV1(
      session.observe(),
    );
    const alreadyAtTarget = session.advanceToPresentationTime(0);
    const failed: MainWireIntegratedLanePresentationAdvanceV1 = Object.freeze({
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
      projectMainWireIntegratedLaneAdvancedFrameV1(alreadyAtTarget)
    ).toThrow(MainWireIntegratedLaneObservableProjectionErrorV1);
    expect(() =>
      projectMainWireIntegratedLaneAdvancedFrameV1(failed)
    ).toThrow(MainWireIntegratedLaneObservableProjectionErrorV1);
    expect(projectMainWireIntegratedLaneObservationV1(session.observe()))
      .toEqual(retainedFrame);
  });

  it("keeps the V3 projector separate from release and persistence concerns", () => {
    const projectorSource = readFileSync(
      new URL(
        "../engine/myocardium/MainWireIntegratedLaneObservableRegistryV1.ts",
        import.meta.url,
      ),
      "utf8",
    );
    expect(projectorSource).not.toMatch(/ExactSignalExport|EXACT_SIGNAL/);
    expect(INTEGRATED_LANE_PRESENTATION_COVERAGE_V1).toBe(
      "integrated-v3-live-presentation",
    );
    expect(projectorSource).not.toMatch(
      /sha256|ExactCheckpoint|RunArtifact|artifactStore/,
    );
  });
});

function expectAdvanced(
  result: MainWireIntegratedLanePresentationAdvanceV1,
): Extract<
  MainWireIntegratedLanePresentationAdvanceV1,
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
