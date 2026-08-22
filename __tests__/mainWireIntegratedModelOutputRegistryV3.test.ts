import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3,
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_FRAME_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_SNAPSHOT_V3,
  MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_ID,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_ANALYSIS_OUTPUT_IDS_V1,
  MAIN_WIRE_INTEGRATED_MODEL_STATUS_FIELDS_V3,
  MainWireIntegratedModelOutputProjectionErrorV3,
  projectMainWireIntegratedModelAdvancedFrameV3,
  projectMainWireIntegratedModelObservationV3,
  projectMainWireIntegratedModelSelectedValuesV3,
} from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PRESENTATION_COVERAGE_V3,
  MainWireIntegratedModelSessionV3,
  mainWireIntegratedModelPresentationTargetTimeSecV3,
  type MainWireIntegratedModelPresentationAdvanceV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";
import { MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3 } from "@/engine/myocardium/MainWireIntegratedModelHemodynamicResearchInputsV3";

const EXACT_OUTPUT_IDS = [
  "hemodynamics.volume.LA",
  "hemodynamics.volume.LV",
  "hemodynamics.volume.RA",
  "hemodynamics.volume.RV",
  "hemodynamics.pressure.absolute.LA",
  "hemodynamics.pressure.absolute.LV",
  "hemodynamics.pressure.absolute.RA",
  "hemodynamics.pressure.absolute.RV",
  "hemodynamics.pressure.transmural.LA",
  "hemodynamics.pressure.transmural.LV",
  "hemodynamics.pressure.transmural.RA",
  "hemodynamics.pressure.transmural.RV",
  "hemodynamics.pressure.absolute.Ao",
  "hemodynamics.pressure.absolute.SA",
  "hemodynamics.pressure.absolute.PA",
  "hemodynamics.pressure.absolute.PVein",
  "hemodynamics.pressure.absolute.VC",
  "hemodynamics.flow.valve.MV",
  "hemodynamics.flow.valve.AoV",
  "hemodynamics.flow.valve.TV",
  "hemodynamics.flow.valve.PV",
  "hemodynamics.flow.systemic.SA_Art",
  "hemodynamics.flow.pulmonary.PA_PArt",
  "hemodynamics.flow.venous.VC_RA",
  "hemodynamics.flow.venous.PVein_LA",
  "pericardium.pressure.excess",
  "pericardium.volume.heart",
  "pericardium.volume.fluid",
  "pericardium.volume.total-occupied",
  "pericardium.energy.stored",
  "respiration.pressure.pleural",
  "respiration.pressure.alveolar",
  "rhythm.heart-rate.instantaneous",
  "coronary.flow.total",
  "coronary.flow.inlet.LAD",
  "coronary.flow.inlet.LCx",
  "coronary.flow.inlet.RCA",
  "coronary.flow.venous-outlet",
  "coronary.flow.large-arterial-outflow.LAD",
  "coronary.flow.large-arterial-storage-rate.LAD",
  "coronary.flow.large-arterial-outflow.LCx",
  "coronary.flow.large-arterial-storage-rate.LCx",
  "coronary.flow.large-arterial-outflow.RCA",
  "coronary.flow.large-arterial-storage-rate.RCA",
  "coronary.flow.layer-r1.LAD.subepicardial",
  "coronary.flow.layer-qm-internal.LAD.subepicardial",
  "coronary.flow.layer-r2.LAD.subepicardial",
  "coronary.tone-resistance-scale.LAD.subepicardial",
  "coronary.flow.layer-r1.LAD.subendocardial",
  "coronary.flow.layer-qm-internal.LAD.subendocardial",
  "coronary.flow.layer-r2.LAD.subendocardial",
  "coronary.tone-resistance-scale.LAD.subendocardial",
  "coronary.flow.layer-r1.LCx.subepicardial",
  "coronary.flow.layer-qm-internal.LCx.subepicardial",
  "coronary.flow.layer-r2.LCx.subepicardial",
  "coronary.tone-resistance-scale.LCx.subepicardial",
  "coronary.flow.layer-r1.LCx.subendocardial",
  "coronary.flow.layer-qm-internal.LCx.subendocardial",
  "coronary.flow.layer-r2.LCx.subendocardial",
  "coronary.tone-resistance-scale.LCx.subendocardial",
  "coronary.flow.layer-r1.RCA.subepicardial",
  "coronary.flow.layer-qm-internal.RCA.subepicardial",
  "coronary.flow.layer-r2.RCA.subepicardial",
  "coronary.tone-resistance-scale.RCA.subepicardial",
  "coronary.flow.layer-r1.RCA.subendocardial",
  "coronary.flow.layer-qm-internal.RCA.subendocardial",
  "coronary.flow.layer-r2.RCA.subendocardial",
  "coronary.tone-resistance-scale.RCA.subendocardial",
  "coronary.pressure.post-focal.LAD",
  "coronary.pressure-loss.focal.LAD",
  "coronary.pressure.post-focal.LCx",
  "coronary.pressure-loss.focal.LCx",
  "coronary.pressure.post-focal.RCA",
  "coronary.pressure-loss.focal.RCA",
  "coronary.power.dissipated.total",
  "device.LVAD.flow",
  "rhythm.phase.regular-sinus",
  "hemodynamics.pressure.mean.Ao",
  "hemodynamics.pressure.systolic.Ao",
  "hemodynamics.pressure.diastolic.Ao",
  "hemodynamics.pressure.pulse.Ao",
  "hemodynamics.pressure.mean.SA",
  "hemodynamics.pressure.systolic.SA",
  "hemodynamics.pressure.diastolic.SA",
  "hemodynamics.pressure.pulse.SA",
  "hemodynamics.pressure.mean.PA",
  "hemodynamics.pressure.systolic.PA",
  "hemodynamics.pressure.diastolic.PA",
  "hemodynamics.pressure.pulse.PA",
  "hemodynamics.pressure.mean.PVein",
  "hemodynamics.pressure.mean.VC",
  "hemodynamics.pressure.mean.LA",
  "hemodynamics.pressure.mean.RA",
  "hemodynamics.pressure.systolic.LV",
  "hemodynamics.pressure.systolic.RV",
  "hemodynamics.pressure-gradient.mean.systemic-circuit",
  "hemodynamics.pressure-gradient.mean.pulmonary-circuit",
  "hemodynamics.volume.maximum.LV",
  "hemodynamics.volume.minimum.LV",
  "hemodynamics.stroke-volume.LV-extrema",
  "hemodynamics.ejection-fraction.LV-extrema",
  "hemodynamics.volume.end-diastolic.LV-at-MV-closure",
  "hemodynamics.pressure.absolute.end-diastolic.LV-at-MV-closure",
  "hemodynamics.pressure.transmural.end-diastolic.LV-at-MV-closure",
  "hemodynamics.volume.end-systolic.LV-at-AoV-closure",
  "hemodynamics.pressure.absolute.end-systolic.LV-at-AoV-closure",
  "hemodynamics.pressure.transmural.end-systolic.LV-at-AoV-closure",
  "hemodynamics.stroke-volume.LV-event-defined",
  "hemodynamics.ejection-fraction.LV-event-defined",
  "hemodynamics.volume.end-diastolic.RV-at-TV-closure",
  "hemodynamics.pressure.absolute.end-diastolic.RV-at-TV-closure",
  "hemodynamics.pressure.transmural.end-diastolic.RV-at-TV-closure",
  "hemodynamics.volume.end-systolic.RV-at-PV-closure",
  "hemodynamics.pressure.absolute.end-systolic.RV-at-PV-closure",
  "hemodynamics.pressure.transmural.end-systolic.RV-at-PV-closure",
  "hemodynamics.stroke-volume.RV-event-defined",
  "hemodynamics.ejection-fraction.RV-event-defined",
  "hemodynamics.valve-volume.forward.MV",
  "hemodynamics.valve-volume.reverse.MV",
  "hemodynamics.valve-volume.net.MV",
  "hemodynamics.valve-regurgitant-fraction.same-valve.MV",
  "hemodynamics.valve-volume.forward.AoV",
  "hemodynamics.valve-volume.reverse.AoV",
  "hemodynamics.valve-volume.net.AoV",
  "hemodynamics.valve-regurgitant-fraction.same-valve.AoV",
  "hemodynamics.valve-volume.forward.TV",
  "hemodynamics.valve-volume.reverse.TV",
  "hemodynamics.valve-volume.net.TV",
  "hemodynamics.valve-regurgitant-fraction.same-valve.TV",
  "hemodynamics.valve-volume.forward.PV",
  "hemodynamics.valve-volume.reverse.PV",
  "hemodynamics.valve-volume.net.PV",
  "hemodynamics.valve-regurgitant-fraction.same-valve.PV",
  "hemodynamics.pressure-gradient.valve.mean-hydraulic-forward.MV",
  "hemodynamics.pressure-gradient.valve.peak-hydraulic-forward.MV",
  "hemodynamics.pressure-gradient.valve.mean-hydraulic-forward.AoV",
  "hemodynamics.pressure-gradient.valve.peak-hydraulic-forward.AoV",
  "hemodynamics.pressure-gradient.valve.mean-hydraulic-forward.TV",
  "hemodynamics.pressure-gradient.valve.peak-hydraulic-forward.TV",
  "hemodynamics.pressure-gradient.valve.mean-hydraulic-forward.PV",
  "hemodynamics.pressure-gradient.valve.peak-hydraulic-forward.PV",
  "myocardium.work.external.RV-transmural-pressure-volume-path",
  "myocardium.work.stroke.LV",
  "myocardium.energy.potential.LV-pressure-volume-area",
  "myocardium.energy.pressure-volume-area.LV",
  "oxygen.consumption.estimated-myocardial.LV-per-beat-per-100g",
  "oxygen.consumption.estimated-myocardial.LV-per-min-per-100g",
  "hemodynamics.pressure-rate.maximum-accepted-step.absolute.LV",
  "hemodynamics.pressure-rate.minimum-accepted-step.absolute.LV",
  "hemodynamics.pressure-rate.maximum-accepted-step.absolute.RV",
  "hemodynamics.pressure-rate.minimum-accepted-step.absolute.RV",
  "hemodynamics.output.native-left",
  "hemodynamics.output.native-right",
  "hemodynamics.output.effective-native-left",
  "hemodynamics.output.effective-native-right",
  "hemodynamics.return.systemic-venous",
  "hemodynamics.return.pulmonary-venous",
  "hemodynamics.output.systemic-tissue",
  "hemodynamics.output.pulmonary",
  "hemodynamics.resistance.systemic-effective",
  "hemodynamics.resistance.pulmonary-effective",
  "hemodynamics.compliance.pulmonary-arterial-effective",
  "coronary.pressure-perfusion.surrogate.Ao-diastolic-minus-LVEDP",
  "oxygen.pressure.alveolar",
  "oxygen.pressure.arterial",
  "oxygen.pressure.gradient.alveolar-arterial",
  "oxygen.saturation.end-capillary",
  "oxygen.saturation.arterial",
  "oxygen.content.end-capillary",
  "oxygen.content.arterial",
  "oxygen.content.required-mixed-venous",
  "oxygen.saturation.required-mixed-venous",
  "oxygen.pressure.required-mixed-venous",
  "oxygen.delivery.systemic",
  "oxygen.consumption.target",
  "oxygen.extraction-ratio.required",
  "oxygen.delivery-to-consumption-ratio",
] as const;

describe("Main Wire Integrated Model V3 output registry", () => {
  it("locks the exact expanded output catalog and excludes status from frames", () => {
    expect(MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_V3_ID).toBe(
      "main-wire-integrated-model-output-registry-v10",
    );
    expect(MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_FRAME_V3_ID).toBe(
      "main-wire-integrated-model-output-frame-v10",
    );
    expect(MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3).toEqual(EXACT_OUTPUT_IDS);
    expect(MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3).toHaveLength(177);
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3.filter(
        ({ kind }) => kind === "metric",
      ),
    ).toHaveLength(100);
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3.every(
        ({ modelingStatus, sourcePath, significantDigits }) =>
          modelingStatus === "modeled" &&
          sourcePath.length > 0 &&
          significantDigits === 3,
      ),
    ).toBe(true);
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3.some(
        ({ outputId }) =>
          String(outputId) ===
          "myocardium.work.external.LV-transmural-pressure-volume-path",
      ),
    ).toBe(false);
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_SNAPSHOT_V3,
    ).toMatchObject({
      unavailableValuePolicy: "null-never-zero",
    });
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_REGISTRY_SNAPSHOT_V3,
    ).not.toHaveProperty("statusFieldsExcluded");
    expect(
      MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3.find(
        ({ outputId }) => outputId === "myocardium.work.stroke.LV",
      ),
    ).toMatchObject({
      quantityKind: "work",
      unit: "mJ",
      sourceKind: "completed-beat",
      scope: "beat",
    });
    for (const outputId of MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_ANALYSIS_OUTPUT_IDS_V1) {
      expect(
        MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3.find(
          (definition) => definition.outputId === outputId,
        ),
      ).toMatchObject({
        sourceKind: "analysis-result",
        scope: "window",
      });
    }
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
    expect(
      projectMainWireIntegratedModelSelectedValuesV3(
        session.observe(),
        MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
      ),
    ).toEqual(cold.values);

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
    expect(cold.values["rhythm.phase.regular-sinus"]).toMatchObject({
      value: expect.any(Number),
      availability: "available",
      quality: "accepted-derived",
    });
    expect(
      cold.values["rhythm.phase.regular-sinus"].value,
    ).toBeGreaterThanOrEqual(0);
    expect(cold.values["rhythm.phase.regular-sinus"].value).toBeLessThan(1);
    expect(cold.values["rhythm.heart-rate.instantaneous"]).toMatchObject({
      value: 60,
      availability: "available",
      quality: "accepted-derived",
    });
    expect(cold.values["respiration.pressure.pleural"].value).toBe(0);
    expect(cold.values["respiration.pressure.alveolar"].value).toBe(0);
    for (const outputId of MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3) {
      const definition = MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3.find(
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
    for (const outputId of MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3) {
      const definition = MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_CATALOG_V3.find(
        (entry) => entry.outputId === outputId,
      );
      if (definition?.kind !== "metric") continue;
      expect(cold.values[outputId]).toMatchObject({
        value: null,
        availability: "not-evaluated-at-accepted-state",
      });
    }

    const first = expectAdvanced(
      session.advanceToPresentationTime(
        mainWireIntegratedModelPresentationTargetTimeSecV3(1),
      ),
    );
    const firstFrame = projectMainWireIntegratedModelAdvancedFrameV3(first);
    expect(
      projectMainWireIntegratedModelSelectedValuesV3(
        first.observation,
        MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
      ),
    ).toEqual(firstFrame.values);
    expect(
      projectMainWireIntegratedModelSelectedValuesV3(first.observation, [
        "hemodynamics.pressure.absolute.LV",
        "hemodynamics.volume.LV",
        "hemodynamics.output.native-left",
      ]),
    ).toEqual({
      "hemodynamics.pressure.absolute.LV":
        firstFrame.values["hemodynamics.pressure.absolute.LV"],
      "hemodynamics.volume.LV": firstFrame.values["hemodynamics.volume.LV"],
      "hemodynamics.output.native-left":
        firstFrame.values["hemodynamics.output.native-left"],
    });
    const firstStep = first.observation.lastAcceptedStep;
    expect(firstStep).not.toBeNull();
    if (firstStep === null) throw new Error("accepted-step readback is absent");
    expect(firstFrame.values["hemodynamics.pressure.absolute.LV"].value).toBe(
      firstStep.coronaryStep.baseStep.circulationTrial.nodeAbsolutePressuresMmHg
        .LV,
    );
    expect(firstFrame.values["hemodynamics.pressure.absolute.Ao"].value).toBe(
      firstStep.coronaryStep.baseStep.circulationTrial.nodeAbsolutePressuresMmHg
        .Ao,
    );
    expect(firstFrame.values["hemodynamics.pressure.transmural.LV"].value).toBe(
      firstStep.coronaryStep.baseStep.mechanicsTrial.transmuralPressuresMmHg.LV,
    );
    expect(firstFrame.values["hemodynamics.flow.valve.AoV"].value).toBe(
      firstStep.coronaryStep.baseStep.circulationTrial.valveEvaluations.AoV
        .flowMlPerSec,
    );
    expect(firstFrame.values["hemodynamics.flow.systemic.SA_Art"].value).toBe(
      firstStep.coronaryStep.baseStep.circulationTrial.edgeFlowsMlPerSec.SA_Art,
    );
    expect(firstFrame.values["hemodynamics.flow.pulmonary.PA_PArt"].value).toBe(
      firstStep.coronaryStep.baseStep.circulationTrial.edgeFlowsMlPerSec
        .PA_PArt,
    );
    expect(firstFrame.values["hemodynamics.flow.venous.VC_RA"].value).toBe(
      firstStep.coronaryStep.baseStep.circulationTrial.edgeFlowsMlPerSec.VC_RA,
    );
    expect(firstFrame.values["hemodynamics.flow.venous.PVein_LA"].value).toBe(
      firstStep.coronaryStep.baseStep.circulationTrial.edgeFlowsMlPerSec
        .PVein_LA,
    );
    expect(firstFrame.values["pericardium.pressure.excess"].value).toBe(
      firstStep.coronaryStep.baseStep.pericardium.excessPressureMmHg,
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
    for (let ordinal = 2; ordinal <= 813; ordinal += 1) {
      boundaryAdvance = expectAdvanced(
        restored.advanceToPresentationTime(
          mainWireIntegratedModelPresentationTargetTimeSecV3(ordinal),
        ),
      );
    }
    expect(boundaryAdvance.internalAcceptedSubstepCount).toBe(2);
    const boundaryFrame =
      projectMainWireIntegratedModelAdvancedFrameV3(boundaryAdvance);
    expect(
      Object.entries(boundaryFrame.values).every(
        ([outputId, { availability }]) =>
          MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_ANALYSIS_OUTPUT_IDS_V1.includes(
            outputId as (typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_ANALYSIS_OUTPUT_IDS_V1)[number],
          ) || availability === "available",
      ),
    ).toBe(true);
    for (const outputId of MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_PVA_ANALYSIS_OUTPUT_IDS_V1) {
      expect(boundaryFrame.values[outputId]).toEqual({
        outputId,
        value: null,
        availability: "not-evaluated-at-accepted-state",
        quality: "not-assessed",
      });
    }
    expect(
      boundaryFrame.values["hemodynamics.pressure.systolic.Ao"].value,
    ).toBeGreaterThan(
      boundaryFrame.values["hemodynamics.pressure.diastolic.Ao"]
        .value as number,
    );
    expect(
      boundaryFrame.values["hemodynamics.pressure.pulse.Ao"].value,
    ).toBeCloseTo(
      (boundaryFrame.values["hemodynamics.pressure.systolic.Ao"]
        .value as number) -
        (boundaryFrame.values["hemodynamics.pressure.diastolic.Ao"]
          .value as number),
      10,
    );
    expect(
      boundaryFrame.values["hemodynamics.ejection-fraction.LV-extrema"].value,
    ).toBeGreaterThan(0);
    const completedBeatMetrics =
      boundaryAdvance.observation.completedBeatMetrics;
    expect(completedBeatMetrics).not.toBeNull();
    expect(boundaryFrame.values["myocardium.work.stroke.LV"]).toEqual({
      outputId: "myocardium.work.stroke.LV",
      value:
        completedBeatMetrics!
          .leftVentricularTransmuralPressureVolumePathWorkMmHgMl * 0.133322,
      availability: "available",
      quality: "accepted-derived",
    });
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
      projectMainWireIntegratedModelAdvancedFrameV3(alreadyAtTarget),
    ).toThrow(MainWireIntegratedModelOutputProjectionErrorV3);
    expect(() => projectMainWireIntegratedModelAdvancedFrameV3(failed)).toThrow(
      MainWireIntegratedModelOutputProjectionErrorV3,
    );
    expect(
      projectMainWireIntegratedModelObservationV3(session.observe()),
    ).toEqual(retainedFrame);
  });

  it("projects variable HR, fixed TBV, and PEEP from their model-owned reset fixture", async () => {
    const session = await MainWireIntegratedModelSessionV3.create({
      ...MAIN_WIRE_INTEGRATED_MODEL_DEFAULT_HEMODYNAMIC_RESEARCH_INPUTS_V3,
      heartRateBpm: 90,
      totalBloodVolumeMl: 6_000,
      peepCmH2O: 10,
    });
    const cold = projectMainWireIntegratedModelObservationV3(session.observe());
    expect(
      session.currentAcceptedState().coronary.fixedGlobalTotalBloodVolumeMl,
    ).toBe(6_000);
    expect(cold.values["rhythm.heart-rate.instantaneous"].value).toBe(90);
    expect(cold.values["respiration.pressure.alveolar"].value).toBeCloseTo(
      7.355592401,
      10,
    );
    expect(cold.values["respiration.pressure.pleural"].value).toBeCloseTo(
      1.4711184802,
      10,
    );

    const advanced = expectAdvanced(session.advanceToPresentationTime(0.002));
    expect(
      advanced.observation.lastAcceptedStep?.coronaryStep.baseStep
        .commonIntrathoracicPressureMmHg,
    ).toBeCloseTo(1.4711184802, 10);
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
