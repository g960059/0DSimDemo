import { describe, expect, it } from "vitest";
import {
  NORMAL_ADULT_TARGET_PACK_V1,
  NORMAL_ADULT_TARGET_PACK_V1_ID,
  validateNormalAdultTargetPackV1,
  type NormalAdultTargetPackV1,
} from "@/engine/myocardium/fourChamberV1/physiology/normalAdultTargetPackV1";

describe("four-chamber Land normal-adult target pack v1", () => {
  it("is a deeply frozen, source-auditable broad outcome envelope", () => {
    const pack = NORMAL_ADULT_TARGET_PACK_V1;

    expect(validateNormalAdultTargetPackV1(pack)).toBe(pack);
    expect(pack.packId).toBe(NORMAL_ADULT_TARGET_PACK_V1_ID);
    expect(pack.evidenceStatus)
      .toBe("literature-informed-broad-operating-envelope-not-calibration-or-patient-fit");
    expect(Object.isFrozen(pack)).toBe(true);
    expect(Object.isFrozen(pack.targets.chamberVolumes.leftAtrium.minimumVolumeMl))
      .toBe(true);
    expect(Object.isFrozen(pack.evidenceSources[0]?.measurementCaveats)).toBe(true);

    expect(pack.evidenceSources.length).toBeGreaterThanOrEqual(8);
    expect(new Set(pack.evidenceSources.map((source) => source.sourceId)).size)
      .toBe(pack.evidenceSources.length);
    for (const source of pack.evidenceSources) {
      expect(source.url).toMatch(/^https:\/\//);
      expect(source.supports.length).toBeGreaterThan(0);
      expect(source.measurementCaveats.length).toBeGreaterThan(0);
    }
    expect(pack.evidenceSources.map((source) => source.sourceKind))
      .toContain("primary-study");
    expect(pack.evidenceSources.map((source) => source.sourceKind))
      .toContain("professional-guideline");
  });

  it("orders acceptance from numerical closure through global hemodynamics and volumes before flow morphology", () => {
    expect(NORMAL_ADULT_TARGET_PACK_V1.gateOrder).toEqual([
      "numerical-integrity",
      "blood-volume-conservation-and-period-1",
      "global-hemodynamics",
      "chamber-volume-envelope",
      "valve-and-pulmonary-venous-flow",
      "held-out-observers",
    ]);

    expect(NORMAL_ADULT_TARGET_PACK_V1.ownerOrder.map((owner) => [
      owner.stage,
      owner.ownerId,
    ])).toEqual([
      [0, "numerical-closure-and-initialization"],
      [1, "vascular-operating-point"],
      [2, "anatomical-wall-geometry"],
      [3, "valve-hydraulics"],
      [4, "activation-and-relaxation"],
      [5, "held-out-observers"],
    ]);
    expect(NORMAL_ADULT_TARGET_PACK_V1.ownerOrder.at(-1)?.mayChange).toEqual([]);
    expect(NORMAL_ADULT_TARGET_PACK_V1.ownerOrder[1]?.mayNotCompensate)
      .toContain("atrial PV-loop topology");
    expect(NORMAL_ADULT_TARGET_PACK_V1.ownerOrder[4]?.mayNotCompensate)
      .toContain("held-out atrial PV-loop area or topology");
  });

  it("pins broad hemodynamic ranges without promoting the mock loop or a unique fit", () => {
    const global = NORMAL_ADULT_TARGET_PACK_V1.targets.globalHemodynamics;

    expect(global.heartRateBpm.broadRange).toEqual([60, 100]);
    expect(global.systemicArterialPressureMmHg.mean.broadRange).toEqual([75, 100]);
    expect(global.cardiacOutputLPerMin.broadRange).toEqual([4, 8]);
    expect(global.rightAtrialMeanPressureMmHg.broadRange).toEqual([0, 6]);
    expect(global.leftAtrialMeanPressureMmHg.broadRange).toEqual([4, 13]);
    expect(global.pulmonaryArterialPressureMmHg.mean.broadRange).toEqual([10, 20]);
    expect(global.leftVentricularEndDiastolicPressureMmHg.broadRange)
      .toEqual([5, 15]);
    expect(global.totalBloodVolumeMl.gateRole).toBe("construction-context");
    expect(global.leftRightNetOutputMismatchFraction.maximum).toBe(0.05);

    expect(NORMAL_ADULT_TARGET_PACK_V1.claimBoundary).toMatchObject({
      runtimeAdoption: false,
      patientFit: false,
      normalHumanCalibrationAchieved: false,
      uniqueParameterIdentification: false,
      mockOrReferenceLoopUsedAsTarget: false,
      landCellularParameterRetuningAuthorized: false,
      slsParameterRetuningAuthorized: false,
    });
  });

  it("uses CMR-compatible chamber-volume corridors and rejects near-empty synthetic atria", () => {
    const volumes = NORMAL_ADULT_TARGET_PACK_V1.targets.chamberVolumes;

    expect(volumes.leftVentricle.endDiastolicVolumeMl.broadRange).toEqual([78, 215]);
    expect(volumes.leftVentricle.endSystolicVolumeMl.broadRange).toEqual([21, 85]);
    expect(volumes.leftVentricle.ejectionFraction.broadRange).toEqual([0.49, 0.79]);
    expect(volumes.rightVentricle.endDiastolicVolumeMl.broadRange).toEqual([68, 244]);
    expect(volumes.rightVentricle.endSystolicVolumeMl.broadRange).toEqual([13, 117]);
    expect(volumes.leftAtrium.maximumVolumeMl.broadRange).toEqual([28, 115]);
    expect(volumes.leftAtrium.minimumVolumeMl.broadRange).toEqual([6, 50]);
    expect(volumes.rightAtrium.maximumVolumeMl.broadRange).toEqual([24, 158]);
    expect(volumes.rightAtrium.minimumVolumeMl.broadRange).toEqual([9, 84]);
    expect(volumes.leftAtrium.minimumVolumeMl.measurementCaveats.join(" "))
      .toContain("no artificial volume clamp");
  });

  it("keeps valve and pulmonary-venous bands secondary to the settled operating point", () => {
    const flow = NORMAL_ADULT_TARGET_PACK_V1.targets.valveAndVenousFlow;

    expect(flow.fixedPhaseWindowReadback).toEqual({
      status: "exploratory-secondary-readback-only",
      clinicalDopplerMappingValidated: false,
      contributesToNormalAcceptanceGate: false,
      usedForParameterFit: false,
      usedForCandidateRanking: false,
    });
    expect(flow.valveCycleRequirement.valves).toEqual([
      "mitral",
      "aortic",
      "tricuspid",
      "pulmonary",
    ]);
    expect(flow.valveCycleRequirement.eachValveMustHaveForwardOpenAndClosedIntervals)
      .toBe(true);
    expect(flow.valveCycleRequirement.netForwardVolumePerBeatMl.broadRange)
      .toEqual([40, 145]);
    expect(flow.valveCycleRequirement.maximumReverseFraction).toBe(0.05);
    expect(flow.forwardGradientMmHg.mitralMean.broadRange).toEqual([0, 3]);
    expect(flow.forwardGradientMmHg.aorticMean.broadRange).toEqual([0, 15]);
    expect(flow.pulmonaryVenousFlow.componentsToReport).toEqual(["S", "D", "Ar"]);
    expect(flow.pulmonaryVenousFlow.systolicForwardFraction.broadRange)
      .toEqual([0.35, 0.75]);
    expect(flow.atrioventricularInflow.mitralEToARatio.gateRole)
      .toBe("exploratory-readback");
    expect(flow.pulmonaryVenousFlow.systolicForwardFraction.gateRole)
      .toBe("exploratory-readback");
    expect(flow.pulmonaryVenousFlow.eligibilityRole)
      .toBe("exploratory-secondary-readback-only");
    expect(flow.pulmonaryVenousFlow.shapeOrPeakTimingUsedForParameterFit).toBe(false);
    expect(flow.atrioventricularInflow.useAsSingleVariableNormalityTest).toBe(false);
  });

  it("holds both atrial PV loops out with no topology or area threshold", () => {
    const heldOut = NORMAL_ADULT_TARGET_PACK_V1.heldOutObservables
      .atrialPressureVolumeLoops;

    expect(heldOut).toMatchObject({
      chambers: ["leftAtrium", "rightAtrium"],
      status: "held-out-readback-only",
      usedForParameterFit: false,
      usedForCandidateRanking: false,
      requiredSelfIntersectionCount: null,
      requiredLobeAreaMmHgMl: null,
      requiredTopology: null,
    });
    expect(heldOut.eligibleOnlyAfterGateIds).toEqual([
      "blood-volume-conservation-and-period-1",
      "global-hemodynamics",
      "chamber-volume-envelope",
      "valve-and-pulmonary-venous-flow",
    ]);
    expect(NORMAL_ADULT_TARGET_PACK_V1.heldOutObservables
      .avpdMapseTapseTissueDoppler).toEqual({
        status: "future-observer-candidates-unrepresented-unavailable",
        computableFromCurrentCoordinates: false,
        representedByCurrentStateOrCoordinates: false,
        clinicalMeasurementMappingAvailable: false,
        dynamicAvPlaneStateRequiredByThisPack: false,
      });
  });

  it("fails closed when a cited source or held-out contract is altered", () => {
    const unknownSource = structuredClone(NORMAL_ADULT_TARGET_PACK_V1) as
      unknown as MutableNormalAdultTargetPack;
    unknownSource.targets.globalHemodynamics.cardiacOutputLPerMin.sourceIds =
      ["not-a-source"];
    expect(() => validateNormalAdultTargetPackV1(
      unknownSource as unknown as NormalAdultTargetPackV1,
    )).toThrow(/unknown source/);

    const fittedLoop = structuredClone(NORMAL_ADULT_TARGET_PACK_V1) as
      unknown as MutableNormalAdultTargetPack;
    fittedLoop.heldOutObservables.atrialPressureVolumeLoops.usedForParameterFit = true;
    expect(() => validateNormalAdultTargetPackV1(
      fittedLoop as unknown as NormalAdultTargetPackV1,
    )).toThrow(/must remain held out/);

    const gatedFixedWindows = structuredClone(NORMAL_ADULT_TARGET_PACK_V1) as
      unknown as MutableNormalAdultTargetPack;
    gatedFixedWindows.targets.valveAndVenousFlow.fixedPhaseWindowReadback
      .contributesToNormalAcceptanceGate = true;
    expect(() => validateNormalAdultTargetPackV1(
      gatedFixedWindows as unknown as NormalAdultTargetPackV1,
    )).toThrow(/fixed phase-window filling metrics/);

    const falseComputedObserver = structuredClone(NORMAL_ADULT_TARGET_PACK_V1) as
      unknown as MutableNormalAdultTargetPack;
    falseComputedObserver.heldOutObservables.avpdMapseTapseTissueDoppler
      .computableFromCurrentCoordinates = true;
    expect(() => validateNormalAdultTargetPackV1(
      falseComputedObserver as unknown as NormalAdultTargetPackV1,
    )).toThrow(/longitudinal observables/);
  });
});

type MutableNormalAdultTargetPack = {
  targets: {
    globalHemodynamics: {
      cardiacOutputLPerMin: { sourceIds: string[] };
    };
    valveAndVenousFlow: {
      fixedPhaseWindowReadback: {
        contributesToNormalAcceptanceGate: boolean;
      };
    };
  };
  heldOutObservables: {
    atrialPressureVolumeLoops: { usedForParameterFit: boolean };
    avpdMapseTapseTissueDoppler: {
      computableFromCurrentCoordinates: boolean;
    };
  };
};
