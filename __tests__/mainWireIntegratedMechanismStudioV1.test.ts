import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
  MainWireIntegratedStudioStandardRuntimeHostV1,
  applyMainWireIntegratedStudioStandardAbsoluteControlAssignmentsV1,
  createCircleHeartExactModelReleaseV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioExactModelV1";
import { MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1 } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioModelIdentityV1";
import {
  mainWireIntegratedStudioControlProjectionFromFixtureV3,
  mainWireIntegratedStudioControlValueFromFixtureV3,
  mainWireIntegratedStudioControlValuesAfterAssignmentV3,
  mainWireIntegratedStudioControlValuesFromFixtureV3,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioFixtureControlProjectionV3";
import { materializeStudioSimulationPresentationFramesV2 } from "@/studio/workers/StudioSimulationPresentationBatchV2";
import {
  MAIN_WIRE_COMMON_PERICARDIUM_DEFAULT_RESEARCH_INPUTS_V1,
  createMainWireCommonPericardiumWithResearchInputsV1,
} from "@/engine/myocardium/mechanics/MainWireCommonPericardiumResearchInputsV1";
import {
  MAIN_WIRE_CORONARY_DEFAULT_DISEASE_RESEARCH_INPUTS_V2,
  createMainWireCoronaryDiseaseInputV2,
} from "@/engine/coronary/MainWireCoronaryDiseaseResearchInputsV2";
import { MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3 } from "@/engine/myocardium/MainWireIntegratedModelOutputRegistryV3";
import {
  MAIN_WIRE_INTEGRATED_STUDIO_LITERATURE_ANCHORS_V1,
  MAIN_WIRE_INTEGRATED_STUDIO_QUALIFICATION_FAMILIES_V1,
  auditMainWireIntegratedStudioQualificationLedgerV1,
} from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioQualificationLedgerV1";

describe("Standard-63 mechanism research controls", () => {
  it("maps pericardial and coronary authoring axes into kernel parameters", () => {
    const pericardium = createMainWireCommonPericardiumWithResearchInputsV1({
      ...MAIN_WIRE_COMMON_PERICARDIUM_DEFAULT_RESEARCH_INPUTS_V1,
      prescribedFluidVolumeMl: 300,
      referenceCapacityScale: 0.9,
    });
    expect(pericardium.prescribedPericardialFluidVolumeM3).toBeCloseTo(
      300e-6,
      15,
    );

    const coronary = createMainWireCoronaryDiseaseInputV2({
      ...MAIN_WIRE_CORONARY_DEFAULT_DISEASE_RESEARCH_INPUTS_V2,
      focalDiameterLossFraction01ByTerritory: {
        ...MAIN_WIRE_CORONARY_DEFAULT_DISEASE_RESEARCH_INPUTS_V2.focalDiameterLossFraction01ByTerritory,
        LAD: 0.5,
      },
      structuralR1ResistanceScaleByTerritoryLayer: {
        ...MAIN_WIRE_CORONARY_DEFAULT_DISEASE_RESEARCH_INPUTS_V2.structuralR1ResistanceScaleByTerritoryLayer,
        LAD: { subepicardial: 1, subendocardial: 2 },
      },
    });
    expect(
      coronary.LAD.focalStenosisAdditionalLinearResistanceMmHgSecPerMl,
    ).toBeGreaterThan(0);
    expect(coronary.LAD.layers.subendocardial.structuralR1ResistanceScale).toBe(
      2,
    );
    expect(coronary.LCx.layers.subendocardial.structuralR1ResistanceScale).toBe(
      1,
    );
  });

  it("owns all hemodynamic, chamber, valve, oxygen, pericardial, and coronary controls", () => {
    const release = createCircleHeartExactModelReleaseV1();
    expect(
      release.manifest.primitiveControlCatalog.map(
        ({ controlId }) => controlId,
      ),
    ).toEqual(
      Object.values(MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1),
    );
    expect(release.manifest.primitiveControlCatalog).toHaveLength(57);
    expect(release.manifest.fixtureSchema.fixtureSchemaId).toMatch(
      /fixture\.standard-v3$/,
    );
  });

  it("projects every registered default control from the complete exact fixture", () => {
    const release = createCircleHeartExactModelReleaseV1();
    const projected = Object.fromEntries(
      release.manifest.primitiveControlCatalog.map((control) => [
        control.controlId,
        mainWireIntegratedStudioControlValueFromFixtureV3(
          MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
          control.controlId,
        ),
      ]),
    );

    expect(Object.keys(projected)).toHaveLength(57);
    for (const control of release.manifest.primitiveControlCatalog) {
      expect(projected[control.controlId], control.controlId).toBe(
        control.defaultValue,
      );
    }
  });

  it("covers every public control once without promoting component evidence to physiology", () => {
    const release = createCircleHeartExactModelReleaseV1();
    const audit = auditMainWireIntegratedStudioQualificationLedgerV1(
      release.manifest.primitiveControlCatalog.map(({ controlId }) => controlId),
      MAIN_WIRE_INTEGRATED_MODEL_OUTPUT_IDS_V3,
    );

    expect(audit).toEqual({
      ledgerId:
        "circleheart.main-wire.standard-63-public-mechanism-qualification-ledger-v1",
      status: "pass",
      registeredControlCount: 57,
      coveredControlCount: 57,
      missingControlIds: [],
      duplicateControlIds: [],
      unknownControlIds: [],
      unknownRepresentativeOutputIds: [],
      unknownLiteratureAnchorIds: [],
      closedLoopDirectionalClaimsQualified: false,
      clinicalValidationClaimed: false,
    });
    expect(MAIN_WIRE_INTEGRATED_STUDIO_QUALIFICATION_FAMILIES_V1).toHaveLength(
      15,
    );
    expect(
      MAIN_WIRE_INTEGRATED_STUDIO_QUALIFICATION_FAMILIES_V1.every(
        ({ evidence, controlIds, representativeOutputIds }) =>
          evidence.definitionOwnership === "verified" &&
          evidence.closedLoopDirection === "not-qualified" &&
          evidence.clinicalValidation === "not-established" &&
          evidence.officialDirectionalClaimEligible === false &&
          controlIds.length > 0 &&
          representativeOutputIds.length > 0,
      ),
    ).toBe(true);
    expect(
      MAIN_WIRE_INTEGRATED_STUDIO_LITERATURE_ANCHORS_V1.every(
        ({ magnitudeValidationEstablished }) =>
          magnitudeValidationEstablished === false,
      ),
    ).toBe(true);
  });

  it("projects authored mechanism values instead of falling back to catalog defaults", () => {
    const assignments = [
      {
        controlId:
          MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.heartRateBpm,
        value: 70,
      },
      {
        controlId:
          MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.activeTensionLVFW,
        value: 0.9,
      },
      {
        controlId:
          MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.passiveStiffnessRVFW,
        value: 1.2,
      },
      {
        controlId:
          MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.calciumDecayTimeLA,
        value: 1.3,
      },
      {
        controlId:
          MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.aovMaximumForwardEoaCm2,
        value: 0.8,
      },
      {
        controlId:
          MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.mvClosedReverseEroaCm2,
        value: 0.25,
      },
      {
        controlId:
          MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.oxygenHemoglobinGPerDl,
        value: 10,
      },
      {
        controlId:
          MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.pericardiumPrescribedFluidVolumeMl,
        value: 100,
      },
      {
        controlId:
          MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.coronaryFocalDiameterLossLAD,
        value: 0.5,
      },
      {
        controlId:
          MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.coronaryStructuralR1LADSubendocardial,
        value: 2,
      },
      {
        controlId:
          MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.coronaryStructuralRmRCASubepicardial,
        value: 3,
      },
    ] as const;
    const fixture =
      applyMainWireIntegratedStudioStandardAbsoluteControlAssignmentsV1(
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
        assignments,
      );

    for (const assignment of assignments) {
      expect(
        mainWireIntegratedStudioControlValueFromFixtureV3(
          fixture,
          assignment.controlId,
        ),
        assignment.controlId,
      ).toBe(assignment.value);
    }
  });

  it("reports the convenience contractility value only while its three wall owners agree", () => {
    const release = createCircleHeartExactModelReleaseV1();
    const common =
      applyMainWireIntegratedStudioStandardAbsoluteControlAssignmentsV1(
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
        [{
          controlId:
            MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.ventricularContractilityScale,
          value: 1.1,
        }],
      );
    expect(
      mainWireIntegratedStudioControlValueFromFixtureV3(
        common,
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.ventricularContractilityScale,
      ),
    ).toBe(1.1);

    const mixed =
      applyMainWireIntegratedStudioStandardAbsoluteControlAssignmentsV1(
        common,
        [{
          controlId:
            MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.activeTensionLVFW,
          value: 0.9,
        }],
      );
    expect(
      mainWireIntegratedStudioControlValueFromFixtureV3(
        mixed,
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.ventricularContractilityScale,
      ),
    ).toBeNull();
    expect(
      mainWireIntegratedStudioControlProjectionFromFixtureV3(
        mixed,
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.ventricularContractilityScale,
      ),
    ).toEqual({ kind: "mixed" });

    const projected = mainWireIntegratedStudioControlValuesFromFixtureV3(
      mixed,
      release.manifest.primitiveControlCatalog,
    );
    expect(
      projected[
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.ventricularContractilityScale
      ],
    ).toBeNull();

    const reconciled = mainWireIntegratedStudioControlValuesAfterAssignmentV3(
      projected,
      MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.ventricularContractilityScale,
      1.2,
    );
    expect(
      [
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.ventricularContractilityScale,
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.activeTensionLVFW,
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.activeTensionSEP,
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.activeTensionRVFW,
      ].map((controlId) => reconciled[controlId]),
    ).toEqual([1.2, 1.2, 1.2, 1.2]);

    const wallSpecific =
      mainWireIntegratedStudioControlValuesAfterAssignmentV3(
        reconciled,
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.activeTensionSEP,
        0.8,
      );
    expect(
      wallSpecific[
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.ventricularContractilityScale
      ],
    ).toBeNull();
  });

  it("makes common ventricular active tension an atomic three-wall action", () => {
    const release = createCircleHeartExactModelReleaseV1();
    const reduce = release.executables.fixtureAdapter.reduceControlAction!;
    const patch = reduce({
      context: {
        modelId: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_MODEL_ID_V1,
        scenarioId: "scenario/common-contractility",
      },
      fixture: MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
      action: {
        kind: "control",
        controlId:
          MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.ventricularContractilityScale,
        value: 1.2,
      },
    });

    expect(patch.changes).toEqual([
      {
        path: [
          "mechanismResearchInputs",
          "chamberMechanics",
          "activeTensionScaleByWall",
          "LVFW",
        ],
        value: 1.2,
      },
      {
        path: [
          "mechanismResearchInputs",
          "chamberMechanics",
          "activeTensionScaleByWall",
          "SEP",
        ],
        value: 1.2,
      },
      {
        path: [
          "mechanismResearchInputs",
          "chamberMechanics",
          "activeTensionScaleByWall",
          "RVFW",
        ],
        value: 1.2,
      },
    ]);
  });

  it("composes wall, valve, oxygen, pericardial, and coronary assignments", () => {
    const fixture =
      applyMainWireIntegratedStudioStandardAbsoluteControlAssignmentsV1(
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
        [
          {
            controlId:
              MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.ventricularContractilityScale,
            value: 1.1,
          },
          {
            controlId:
              MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.activeTensionLVFW,
            value: 0.9,
          },
          {
            controlId:
              MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.aovMaximumForwardEoaCm2,
            value: 0.8,
          },
          {
            controlId:
              MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.mvClosedReverseEroaCm2,
            value: 0.25,
          },
          {
            controlId:
              MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.oxygenHemoglobinGPerDl,
            value: 10,
          },
          {
            controlId:
              MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.pericardiumPrescribedFluidVolumeMl,
            value: 100,
          },
          {
            controlId:
              MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.coronaryFocalDiameterLossLAD,
            value: 0.5,
          },
          {
            controlId:
              MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.coronaryStructuralR1LADSubendocardial,
            value: 2,
          },
        ],
      );

    expect(
      fixture.mechanismResearchInputs.chamberMechanics.activeTensionScaleByWall,
    ).toMatchObject({
      LVFW: 0.9,
      SEP: 1.1,
      RVFW: 1.1,
    });
    expect(
      fixture.mechanismResearchInputs.valveAreas.AoV.maximumForwardEoaCm2,
    ).toBe(0.8);
    expect(
      fixture.mechanismResearchInputs.valveAreas.MV.closedReverseEroaCm2,
    ).toBe(0.25);
    expect(
      fixture.mechanismResearchInputs.oxygenTransport.hemoglobinGPerDl,
    ).toBe(10);
    expect(
      fixture.mechanismResearchInputs.pericardium.prescribedFluidVolumeMl,
    ).toBe(100);
    expect(
      fixture.mechanismResearchInputs.coronaryDisease
        .focalDiameterLossFraction01ByTerritory.LAD,
    ).toBe(0.5);
    expect(
      fixture.mechanismResearchInputs.coronaryDisease
        .structuralR1ResistanceScaleByTerritoryLayer.LAD.subendocardial,
    ).toBe(2);
  });

  it("validates a multi-control valve tuple after all assignments are applied", () => {
    const startingFixture =
      applyMainWireIntegratedStudioStandardAbsoluteControlAssignmentsV1(
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
        [
          {
            controlId:
              MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.pvMaximumForwardEoaCm2,
            value: 0.5,
          },
          {
            controlId:
              MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.pvClosedReverseEroaCm2,
            value: 0.4,
          },
        ],
      );
    const assignments = [
      {
        controlId:
          MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.pvMaximumForwardEoaCm2,
        value: 0.35,
      },
      {
        controlId:
          MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.pvClosedReverseEroaCm2,
        value: 0.3,
      },
    ] as const;

    const forwardFirst =
      applyMainWireIntegratedStudioStandardAbsoluteControlAssignmentsV1(
        startingFixture,
        assignments,
      );
    const reverseFirst =
      applyMainWireIntegratedStudioStandardAbsoluteControlAssignmentsV1(
        startingFixture,
        [...assignments].reverse(),
      );

    expect(forwardFirst.mechanismResearchInputs.valveAreas.PV).toMatchObject({
      maximumForwardEoaCm2: 0.35,
      closedReverseEroaCm2: 0.3,
    });
    expect(reverseFirst).toEqual(forwardFirst);
  });

  it("advances pericardial and coronary disease controls into accepted readback", async () => {
    const fixture =
      applyMainWireIntegratedStudioStandardAbsoluteControlAssignmentsV1(
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
        [
          {
            controlId:
              MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.pericardiumPrescribedFluidVolumeMl,
            value: 100,
          },
          {
            controlId:
              MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.coronaryFocalDiameterLossLAD,
            value: 0.5,
          },
          {
            controlId:
              MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.coronaryStructuralR1LADSubendocardial,
            value: 2,
          },
        ],
      );
    const host = new MainWireIntegratedStudioStandardRuntimeHostV1();
    const runtimeSessionId = "session/pericardial-coronary-readback";
    const scenarioId = "scenario/pericardial-coronary";
    await host.createSession(runtimeSessionId, [{ scenarioId, fixture }]);
    const [frame] = materializeStudioSimulationPresentationFramesV2(
      host.advancePresentationBatch(runtimeSessionId, scenarioId, 1, [
        "pericardium.volume.fluid",
        "coronary.pressure-loss.focal.LAD",
        "coronary.pressure.post-focal.LAD",
        "coronary.flow.layer-r1.LAD.subendocardial",
      ]),
    );

    expect(frame?.outputs["pericardium.volume.fluid"]?.value).toBeCloseTo(
      100,
      12,
    );
    expect(
      frame?.outputs["coronary.pressure-loss.focal.LAD"]?.value,
    ).toBeGreaterThan(0);
    expect(frame?.outputs["coronary.pressure.post-focal.LAD"]?.value).toEqual(
      expect.any(Number),
    );
    expect(
      frame?.outputs["coronary.flow.layer-r1.LAD.subendocardial"]?.value,
    ).toEqual(expect.any(Number));
    host.closeSession(runtimeSessionId);
  }, 120_000);

  it("advances a combined AS/MR case and publishes event-defined volumes", async () => {
    const fixture =
      applyMainWireIntegratedStudioStandardAbsoluteControlAssignmentsV1(
        MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_DEFAULT_FIXTURE_V1,
        [
          {
            controlId:
              MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.aovMaximumForwardEoaCm2,
            value: 0.8,
          },
          {
            controlId:
              MAIN_WIRE_INTEGRATED_STUDIO_STANDARD_CONTROL_IDS_V1.mvClosedReverseEroaCm2,
            value: 0.25,
          },
        ],
      );
    const host = new MainWireIntegratedStudioStandardRuntimeHostV1();
    const runtimeSessionId = "session/as-mr-event-landmarks";
    const scenarioId = "scenario/as-mr";
    await host.createSession(runtimeSessionId, [{ scenarioId, fixture }]);
    const outputIds = [
      "hemodynamics.volume.end-diastolic.LV-at-MV-closure",
      "hemodynamics.volume.end-systolic.LV-at-AoV-closure",
      "hemodynamics.stroke-volume.LV-event-defined",
      "hemodynamics.ejection-fraction.LV-event-defined",
      "hemodynamics.valve-volume.reverse.MV",
      "hemodynamics.valve-volume.net.AoV",
      "oxygen.delivery.systemic",
    ] as const;
    const frames = [];
    for (let batch = 0; batch < 7; batch += 1) {
      frames.push(
        ...materializeStudioSimulationPresentationFramesV2(
          host.advancePresentationBatch(
            runtimeSessionId,
            scenarioId,
            256,
            outputIds,
          ),
        ),
      );
    }
    const completed = [...frames]
      .reverse()
      .find((frame) =>
        outputIds.every(
          (outputId) => frame.outputs[outputId]?.availability === "available",
        ),
      );

    expect(completed).toBeDefined();
    expect(
      completed!.outputs["hemodynamics.valve-volume.reverse.MV"]!.value,
    ).toBeGreaterThan(0);
    expect(
      completed!.outputs["hemodynamics.valve-volume.net.AoV"]!.value,
    ).toBeGreaterThan(0);
    expect(
      completed!.outputs["hemodynamics.ejection-fraction.LV-event-defined"]!
        .value,
    ).toBeGreaterThan(0);
    expect(
      completed!.outputs["oxygen.delivery.systemic"]!.value,
    ).toBeGreaterThan(0);
    host.closeSession(runtimeSessionId);
  }, 120_000);
});
