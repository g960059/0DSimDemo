import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
} from "@/components/scientificProduct/scientificProductCaseCatalogV1";
import {
  resolveScientificProductReleaseBundleV1,
} from "@/components/scientificProduct/ScientificProductReleaseBundleRegistryV1";
import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1,
} from "@/engine/scientific/observables";
import { sha256CanonicalJsonHex } from "@/engine/scientific/release";
import {
  MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V3_ID,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_CANONICAL_ACCEPTED_SEQUENCE_V3,
} from "@/engine/myocardium/MainWireIntegratedModelCanonicalSequenceV3";
import {
  loadMainWireIntegratedLaneDevelopmentIdentityV1,
} from "@/engine/myocardium/MainWireIntegratedLaneDevelopmentIdentityArtifactV1";
import {
  MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_SHA256,
  MAIN_WIRE_INTEGRATED_LANE_STATE_CODEC_V1_ID,
  buildMainWireIntegratedLaneDevelopmentIdentityV1,
} from "@/engine/myocardium/MainWireIntegratedLaneDevelopmentIdentityV1";
import {
  INTEGRATED_V3_LANE_CAPABILITIES_V1,
  INTEGRATED_V3_LANE_CAPABILITY_KEYS_V1,
  INTEGRATED_V3_LANE_LIMITATIONS_V1,
} from "@/engine/myocardium/MainWireIntegratedLaneIdentityV1";
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
  createMainWireIntegratedLanePresetV1,
} from "@/engine/myocardium/MainWireIntegratedLanePresetV1";
import {
  INTEGRATED_LANE_PRESENTATION_COVERAGE_V1,
  MainWireIntegratedScientificSession,
  integratedLanePresentationTargetTimeSecV1,
  type MainWireIntegratedLanePresentationAdvanceV1,
} from "@/engine/myocardium/MainWireIntegratedScientificSession";
import {
  MAIN_WIRE_SCIENTIFIC_PRODUCT_ALLOWLISTED_IDENTITY_REFS_V2,
  resolveMainWireScientificProductReleaseBundleV2,
} from "@/engine/product/MainWireScientificProductReleaseBundleRegistryV2";

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

describe("integrated V3 observable registry and development lane identity", () => {
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
    const session = await MainWireIntegratedScientificSession.create();
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
      await MainWireIntegratedScientificSession.restoreOperationalCheckpoint(
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
    const session = await MainWireIntegratedScientificSession.create();
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

  it("T3/T5 keeps the V3 projector separate and preserves V1 placeholders", () => {
    const projectorSource = readFileSync(
      new URL(
        "../engine/myocardium/MainWireIntegratedLaneObservableRegistryV1.ts",
        import.meta.url,
      ),
      "utf8",
    );
    expect(projectorSource).not.toMatch(
      /projectMainWireScientificObservationV1|ScientificProductStudioObservableFrameProjectionV1|MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1/,
    );
    expect(projectorSource).not.toMatch(/ExactSignalExport|EXACT_SIGNAL/);
    expect(INTEGRATED_LANE_PRESENTATION_COVERAGE_V1).toBe(
      "integrated-v3-live-presentation",
    );
    for (const observableId of [
      "coronary.flow.total",
      "device.LVAD.flow",
    ] as const) {
      expect(MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1.find(
        (entry) => entry.observableId === observableId,
      )).toMatchObject({
        modelingStatus: "not-modeled",
        sourceKind: "capability-placeholder",
      });
    }
  });

  it("T8/T9 data carries every capability and the exact ordered limitations", () => {
    expect(Object.keys(INTEGRATED_V3_LANE_CAPABILITIES_V1)).toEqual(
      INTEGRATED_V3_LANE_CAPABILITY_KEYS_V1,
    );
    expect(INTEGRATED_V3_LANE_CAPABILITIES_V1.suspendResumePresentation)
      .toEqual({
        available: false,
        reason: "out-of-scope-for-this-increment",
        explanation:
          "Suspend and resume presentation are out of scope for this increment.",
      });
    for (const capability of Object.values(
      INTEGRATED_V3_LANE_CAPABILITIES_V1,
    )) {
      if (capability.available === true) continue;
      expect(capability.reason).toEqual(expect.any(String));
      expect(capability.explanation).toEqual(expect.any(String));
      expect(capability.explanation.trim()).not.toBe("");
    }
    expect(INTEGRATED_V3_LANE_LIMITATIONS_V1).toEqual([
      "Experimental lane. Development lifecycle, unverified evidence. This is not a release.",
      "Fixed input. Regular sinus at a 1.000 s cycle, normal-adult coronary priors, and a HeartMate II LVAD at 9,000 rpm. Nothing on this lane can be adjusted.",
      "Regular sinus only. Atrial fibrillation, other non-sinus rhythms, and IABP are not available on this lane.",
      "The LVAD circuit inertance profile is production-owned and explicitly not release-approved.",
      "Not clinically validated, not patient-specific, and not fitted to any patient or waveform.",
      "Cold, transient exploration. Periodic steady state is not established, and long-term physiological behaviour is not established.",
      "This lane reports the rate it actually achieves, measured rather than declared. That rate depends on the machine and on how many lanes are open, and running slower than realtime is expected here rather than a fault.",
      "Live view only. There is no exact 0.002 s export, no saved snapshot, and no steady-state candidate on this lane.",
    ]);
  });

  it("mints and checks in the exact development/unverified manifest", async () => {
    const [artifact, rebuilt, preset] = await Promise.all([
      loadMainWireIntegratedLaneDevelopmentIdentityV1(),
      buildMainWireIntegratedLaneDevelopmentIdentityV1(),
      createMainWireIntegratedLanePresetV1(),
    ]);
    expect(artifact).toEqual(rebuilt);
    expect(artifact.ref.sha256).toBe(
      MAIN_WIRE_INTEGRATED_LANE_DEVELOPMENT_IDENTITY_V1_SHA256,
    );
    expect(artifact.manifest).toMatchObject({
      lifecycleStatus: "development",
      evidenceStatus: "unverified",
      scientificModel: {
        transactionId: MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID,
        canonicalAcceptedStateSequence:
          MAIN_WIRE_INTEGRATED_MODEL_CANONICAL_ACCEPTED_SEQUENCE_V3,
      },
      stateCodec: {
        codecId: MAIN_WIRE_INTEGRATED_LANE_STATE_CODEC_V1_ID,
        acceptedStateTransactionId:
          MAIN_WIRE_INTEGRATED_MODEL_TRANSACTION_V3_ID,
        checkpointId: MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V3_ID,
        checkpointSchemaVersion: 3,
      },
      observableSchema: {
        schemaId: MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_V1_ID,
        snapshot: MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_SNAPSHOT_V1,
      },
      protocol: {
        classification: "exploratory",
        approvalStatus: "not-approved",
        coverage: "integrated-v3-live-presentation",
        exactReplayOrExportClaimed: false,
        periodicSteadyStateClaimed: false,
      },
      evidence: {
        status: "unverified",
        longTermPhysiologicalValidationEstablished: false,
        activeMcsPeriodicSteadyEvidence: "none",
        dynamicMcsInertanceProfileReleaseApproved: false,
        dynamicMcsInertanceProfileProvenance:
          "literature-circuit-inertance-not-independently-validated",
        orderedLaneLimitations: INTEGRATED_V3_LANE_LIMITATIONS_V1,
      },
      limitations: INTEGRATED_V3_LANE_LIMITATIONS_V1,
    });
    expect(artifact.manifest.frozenPresetSnapshot).toMatchObject({
      rhythmConfiguration: preset.rhythm.configuration,
      rhythmColdAcceptedState: preset.rhythm.state,
      dynamicMechanicalSupportConfig: preset.config,
      dynamicMechanicalSupportInertanceProfile: preset.profile,
      coronaryStepInput: preset.coronaryStepInput,
    });
    expect(artifact.manifest.observableSchema.sha256).toBe(
      await sha256CanonicalJsonHex(
        MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_SNAPSHOT_V1,
      ),
    );
    expect(artifact.manifest.limitations).toEqual(
      INTEGRATED_V3_LANE_LIMITATIONS_V1,
    );
    expect(artifact.manifest.limitations).toHaveLength(
      INTEGRATED_V3_LANE_LIMITATIONS_V1.length,
    );
    expect(Object.isFrozen(artifact)).toBe(true);
    expect(Object.isFrozen(artifact.manifest.frozenPresetSnapshot)).toBe(true);
  });

  it("T10 adds a second exact heterogeneous resolver without widening V1", async () => {
    const integratedRef = MAIN_WIRE_SCIENTIFIC_PRODUCT_ALLOWLISTED_IDENTITY_REFS_V2[1];

    expect(() => resolveScientificProductReleaseBundleV1(integratedRef))
      .toThrow(/exact SimulationReleaseRef is not allowlisted/);
    const noncoronary =
      await resolveMainWireScientificProductReleaseBundleV2(
        SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
      );
    expect(noncoronary).toMatchObject({
      memberKind: "noncoronary-release-v1",
      releaseRef: SCIENTIFIC_PRODUCT_RELEASE_REF_V1,
    });
    const integrated =
      await resolveMainWireScientificProductReleaseBundleV2(integratedRef);
    expect(integrated).toMatchObject({
      memberKind: "integrated-v3-experimental",
      releaseRef: integratedRef,
      manifest: {
        lifecycleStatus: "development",
        evidenceStatus: "unverified",
      },
      catalogs: {
        observables:
          MAIN_WIRE_INTEGRATED_LANE_OBSERVABLE_REGISTRY_SNAPSHOT_V1,
        lane: {
          limitations: INTEGRATED_V3_LANE_LIMITATIONS_V1,
          capabilities: INTEGRATED_V3_LANE_CAPABILITIES_V1,
        },
      },
    });
    if (integrated.memberKind !== "integrated-v3-experimental") {
      throw new Error("integrated bundle member was not resolved");
    }
    expect(integrated.catalogRefs.observables.sha256).toBe(
      await sha256CanonicalJsonHex(integrated.catalogs.observables),
    );
    expect(integrated.catalogRefs.lane.sha256).toBe(
      await sha256CanonicalJsonHex(integrated.catalogs.lane),
    );
    await expect(resolveMainWireScientificProductReleaseBundleV2({
      ...integratedRef,
      sha256: "0".padEnd(64, "0"),
    })).rejects.toThrow(/exact identity ref is not allowlisted/);
  });

  it("keeps all step-4/5 lane source free of inherited release guarantees", () => {
    const laneSource = [
      "../engine/myocardium/MainWireIntegratedLaneObservableRegistryV1.ts",
      "../engine/myocardium/MainWireIntegratedLaneIdentityV1.ts",
      "../engine/myocardium/MainWireIntegratedLaneDevelopmentIdentityV1.ts",
      "../engine/myocardium/MainWireIntegratedLaneDevelopmentIdentityArtifactV1.ts",
    ].map((relativePath) =>
      readFileSync(new URL(relativePath, import.meta.url), "utf8")
    ).join("\n");

    expect(laneSource).not.toMatch(
      /main-wire-adult-five-wall-noncoronary|0\.2\.0|verified-research/,
    );
    expect(laneSource).not.toMatch(
      /MainWireScientificExactCheckpointV3|MainWireScientificExactCheckpointV4|MainWireScientificSessionExactCheckpointV[34]/,
    );
    expect(laneSource).not.toMatch(/ExactSignalExport|EXACT_SIGNAL/);
    expect(laneSource).not.toMatch(/StudioRunArtifactContentV1|artifactStore/);
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
