import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_DIAGNOSTICS_CLAIM_V1,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1,
  measureMainWireNormalAdultFiveWallCycleDiagnosticsV1,
  tryMeasureMainWireNormalAdultFiveWallCycleDiagnosticsV1,
  type MainWireNormalAdultFiveWallCycleSampleV1,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallCycleDiagnosticsV1";

const DT_SEC = 0.1;
const WALL_VOLUMES_ML = Object.freeze({
  LA: 10,
  LVFW: 10,
  SEP: 10,
  RVFW: 10,
  RA: 10,
});

describe("main-wire normal-adult five-wall cycle diagnostics V1", () => {
  it("owns every cyclic sample once and measures BE flow, waves, and work", () => {
    const samples = Array.from({ length: 10 }, (_, index) => sample(index));
    const measured = measureMainWireNormalAdultFiveWallCycleDiagnosticsV1({
      samples,
      precedingSample: precedingSample(),
      dtSec: DT_SEC,
      atrialCalciumOnsetPhase01: 0.7,
      wallMaterialVolumeMlByWall: WALL_VOLUMES_ML,
      valveOpenThreshold: {
        peakFraction: 0.01,
        absoluteFloorMlPerSec: 0.1,
      },
    });

    expect(measured.phaseBySample).toEqual([
      "reservoir", "reservoir", "reservoir", "reservoir", "reservoir",
      "conduit", "conduit", "pumping", "pumping", "reservoir",
    ]);
    expect(measured.phaseSampleCount).toEqual({
      reservoir: 6,
      conduit: 2,
      pumping: 2,
    });
    expect(measured.events.mitralValveOpening.sampleIndex).toBe(5);
    expect(measured.events.mitralValveClosure.sampleIndex).toBe(9);
    expect(measured.events.aorticValveOpening.sampleIndex).toBe(0);
    expect(measured.events.aorticValveClosure.sampleIndex).toBe(2);
    expect(measured.events.mitralEventSource).toBe("flow-threshold");
    expect(measured.events.aorticEventSource).toBe("flow-threshold");

    expect(measured.pulmonaryVenous.S.forwardVolumeMl).toBeCloseTo(2.1, 12);
    expect(measured.pulmonaryVenous.D.forwardVolumeMl).toBeCloseTo(3, 12);
    expect(measured.pulmonaryVenous.Ar.reverseVolumeMl).toBeCloseTo(0.5, 12);
    expect(measured.pulmonaryVenous.Ar.peakReverseMlPerSec).toBe(3);

    expect(measured.mitral.E.forwardVolumeMl).toBeCloseTo(3, 12);
    expect(measured.mitral.A.forwardVolumeMl).toBeCloseTo(2, 12);
    expect(measured.mitral.E.modeledAreaVtiCm).toBeCloseTo(1.5, 12);
    expect(measured.mitral.A.modeledAreaVtiCm).toBeCloseTo(1, 12);
    expect(measured.mitral.forwardVolumeERatioToA).toBeCloseTo(1.5, 12);
    expect(measured.mitral.eFlowPeak).toMatchObject({
      sampleIndex: 6,
      flowMlPerSec: 20,
    });
    expect(measured.mitral.aFlowPeak).toMatchObject({
      sampleIndex: 8,
      flowMlPerSec: 15,
    });
    expect(measured.mitral.flowAtAtrialCalciumOnsetMlPerSec).toBe(5);
    expect(measured.mitral.flowAtAtrialCalciumOnsetRatioToEPeak).toBe(0.25);
    expect(measured.mitral.waveSeparation).toMatchObject({
      status: "separated",
      valley: { sampleIndex: 7, flowMlPerSec: 5 },
      valleyToLowerPeakRatio: 1 / 3,
    });

    expect(measured.leftAtrialVolumes).toMatchObject({
      maximumMl: 40,
      preAMl: 30,
      minimumMl: 20,
      reservoirExpansionMl: 20,
      conduitEmptyingMl: 10,
      boosterEmptyingMl: 10,
    });
    expect(measured.leftAtrialPressureWaves.aPeak.sampleIndex).toBe(7);
    expect(measured.leftAtrialPressureWaves.xTrough.sampleIndex).toBe(9);
    expect(measured.leftAtrialPressureWaves.vPeak.sampleIndex).toBe(4);
    expect(measured.leftAtrialPressureWaves.yTrough.sampleIndex).toBe(6);
    expect(measured.leftAtrialPressureWaves.xDescentMmHg).toBe(6);
    expect(measured.leftAtrialPressureWaves.yDescentMmHg).toBe(6);
    expect(measured.leftAtrialPressureWaves.volumeAtAPeakMl).toBe(30);
    expect(measured.leftAtrialPressureWaves
      .aPeakDelayFromAtrialCalciumOnsetSec).toBe(0);
    expect(measured.leftAtrialPressureWaves
      .aPressurePeakToMitralAFlowPeakSec).toBeCloseTo(0.1, 12);
    expect(measured.leftAtrialPressureWaves
      .boosterEmptyingCompletedAtAPeakFraction).toBe(0);
    expect(measured.leftAtrialPressureWaves
      .boosterEmptyingRemainingAtAPeakFraction).toBe(1);
    expect(measured.leftAtrialPressureWaves
      .boosterEmptyingCompletedAtAPeakStatus).toBe("within-active-emptying");

    expect(measured.ivrtLike.durationSec).toBeCloseTo(0.3, 12);
    expect(measured.ivrtLike.sampleCount).toBe(3);
    expect(measured.ivrtLike.reason).toBe("available");
    expect(measured.ivrtLike.relaxationTauSec).toBeGreaterThan(0);
    expect(measured.ivrtLike.fitR2).toBeGreaterThan(0);
    expect(measured.leftVentricularPerformance).toMatchObject({
      teiIndex: 2,
      maximumPositivePressureRateMmHgPerSec: 0,
      minimumNegativePressureRateMmHgPerSec: -400,
      maximumPressureFallRateMagnitudeMmHgPerSec: 400,
      pressureBasis: "absolute-left-ventricular-cavity-pressure",
      pressureRateMethod: "accepted-step-backward-difference-no-smoothing",
    });
    expect(measured.leftVentricularPerformance
      .isovolumicContractionTimeSec).toBeCloseTo(0.1, 12);
    expect(measured.leftVentricularPerformance
      .ejectionTimeSec).toBeCloseTo(0.2, 12);
    expect(measured.leftVentricularPerformance
      .isovolumicRelaxationTimeSec).toBeCloseTo(0.3, 12);
    expect(measured.leftVentricularPerformance
      .totalIsovolumicTimeSec).toBeCloseTo(0.4, 12);
    expect(measured.leftVentricularPerformance
      .mitralClosureToOpeningTimeSec).toBeCloseTo(0.6, 12);
    expect(measured.leftVentricularPerformance
      .teiEquivalentIntervalIdentityResidualSec).toBeCloseTo(0, 12);

    expect(measured.workEnergy.stressWorkCoverageFraction).toBe(1);
    // Positive p*dV is work on the wall. Here only LA volume changes:
    // sum(p_next * deltaV) = 24 mmHg mL and
    // 1 mmHg mL = 0.133322 mJ.
    expect(measured.workEnergy.cavityWorkOnWallMilliJ.LA)
      .toBeCloseTo(24 * 0.133322, 12);
    expect(measured.workEnergy.cavityWorkOnWallMilliJ.LV).toBe(0);
    expect(measured.workEnergy.cavityWorkOnWallMilliJ.RA).toBe(0);
    expect(measured.workEnergy.cavityWorkOnWallMilliJ.RV).toBe(0);
    expect(measured.workEnergy.workConjugacyResidualMilliJ.leftAtrium)
      .toBeCloseTo(0.06 - 24 * 0.133322, 12);
    for (const wallId of MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1) {
      const wall = measured.workEnergy.perWall[wallId];
      expect(wall.stressWorkOnWallMilliJ.total).toBeCloseTo(0.06, 12);
      expect(wall.stressWorkOnWallMilliJ.active).toBeCloseTo(0.01, 12);
      expect(wall.stressWorkOnWallMilliJ.passive).toBeCloseTo(0.02, 12);
      expect(wall.stressWorkOnWallMilliJ.sls).toBeCloseTo(0.03, 12);
      expect(wall.stressAssemblyResidualMilliJ).toBeCloseTo(0, 12);
      expect(wall.equilibriumPassiveStoredEnergyChangeMilliJ)
        .toBeCloseTo(0.02, 12);
      expect(wall.equilibriumPassiveBackwardEulerRemainderMilliJ)
        .toBeCloseTo(0, 12);
      expect(wall.sls.storedEnergyChangeMilliJ).toBeCloseTo(0.01, 12);
      expect(wall.sls.physicalDissipationMilliJ).toBeCloseTo(0.01, 12);
      expect(wall.sls.backwardEulerNumericalDissipationMilliJ)
        .toBeCloseTo(0.01, 12);
      expect(wall.sls.reconstructedDiscreteBalanceResidualMilliJ)
        .toBeCloseTo(0, 12);
      expect(wall.sls.readbackAgreementResidualMilliJ).toBeCloseTo(0, 12);
    }
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_DIAGNOSTICS_CLAIM_V1
      .addsDynamicState).toBe(false);
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_DIAGNOSTICS_CLAIM_V1
      .landThermodynamicStoredEnergyClaimed).toBe(false);
  });

  it("does not invent modeled-area VTI when positive flow has no physical area", () => {
    const samples = Array.from({ length: 10 }, (_, index) => sample(
      index,
      index === 5 ? 0 : 2,
    ));
    const measured = measureMainWireNormalAdultFiveWallCycleDiagnosticsV1({
      samples,
      precedingSample: precedingSample(),
      dtSec: DT_SEC,
      atrialCalciumOnsetPhase01: 0.7,
      wallMaterialVolumeMlByWall: WALL_VOLUMES_ML,
      valveOpenThreshold: { absoluteFloorMlPerSec: 0.1 },
    });

    expect(measured.mitral.E.modeledAreaVtiCm).toBeNull();
    expect(measured.mitral.E.positiveFlowSamplesWithoutPhysicalArea).toBe(1);
  });

  it("keeps common-pericardium stored work separate from transmural wall work", () => {
    const stiffnessMmHgPerMl = 0.2;
    const referenceTotalChamberVolumeMl = 280;
    const addPericardium = (value: MainWireNormalAdultFiveWallCycleSampleV1) => {
      const totalVolumeMl = Object.values(value.nodeVolumeMl)
        .reduce((sum, volume) => sum + volume, 0);
      const excessMl = totalVolumeMl - referenceTotalChamberVolumeMl;
      return Object.freeze({
        ...value,
        commonPericardium: Object.freeze({
          excessPressureMmHg: stiffnessMmHgPerMl * excessMl,
          storedEnergyMilliJ: 0.5 * stiffnessMmHgPerMl * excessMl * excessMl
            * 0.133322,
        }),
      });
    };
    const samples = Array.from({ length: 10 }, (_, index) =>
      addPericardium(sample(index)));
    const measured = measureMainWireNormalAdultFiveWallCycleDiagnosticsV1({
      samples,
      precedingSample: addPericardium(precedingSample()),
      dtSec: DT_SEC,
      atrialCalciumOnsetPhase01: 0.7,
      wallMaterialVolumeMlByWall: WALL_VOLUMES_ML,
      valveOpenThreshold: { absoluteFloorMlPerSec: 0.1 },
    });

    expect(measured.workEnergy.commonPericardium.storedEnergyChangeMilliJ)
      .toBeCloseTo(0, 12);
    const expectedBackwardEulerRemainder =
      0.5 * stiffnessMmHgPerMl * 174 * 0.133322;
    expect(measured.workEnergy.commonPericardium.pressureWorkOnBagMilliJ)
      .toBeCloseTo(expectedBackwardEulerRemainder, 12);
    expect(measured.workEnergy.commonPericardium.backwardEulerRemainderMilliJ)
      .toBeCloseTo(expectedBackwardEulerRemainder, 12);
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_DIAGNOSTICS_CLAIM_V1
      .pericardialWorkExcludedFromTransmuralWallWork).toBe(true);
  });

  it("reports incomplete stress-work coverage without a preceding sample", () => {
    const samples = Array.from({ length: 10 }, (_, index) => sample(index));
    const measured = measureMainWireNormalAdultFiveWallCycleDiagnosticsV1({
      samples,
      dtSec: DT_SEC,
      atrialCalciumOnsetPhase01: 0.7,
      wallMaterialVolumeMlByWall: WALL_VOLUMES_ML,
      valveOpenThreshold: { absoluteFloorMlPerSec: 0.1 },
    });

    expect(measured.workEnergy.stressWorkCoverageFraction).toBe(0.9);
    expect(measured.workEnergy.perWall.LA.stressWorkOnWallMilliJ.total)
      .toBeCloseTo(0.054, 12);
  });

  it("keeps valve phases exhaustive across a sub-threshold E/A gap", () => {
    const separatedFlow = [0, 0, 0, 0, 0, 10, 20, 0, 15, 0];
    const samples = Array.from({ length: 10 }, (_, index) => Object.freeze({
      ...sample(index),
      flowMlPerSec: Object.freeze({
        ...sample(index).flowMlPerSec,
        MV: separatedFlow[index]!,
      }),
    }));
    const measured = measureMainWireNormalAdultFiveWallCycleDiagnosticsV1({
      samples,
      precedingSample: precedingSample(),
      dtSec: DT_SEC,
      atrialCalciumOnsetPhase01: 0.7,
      wallMaterialVolumeMlByWall: WALL_VOLUMES_ML,
      valveOpenThreshold: {
        peakFraction: 0.01,
        absoluteFloorMlPerSec: 0.1,
      },
    });

    expect(measured.events.mitralEventSource).toBe("flow-threshold");
    expect(measured.events.mitralValveOpening.sampleIndex).toBe(5);
    expect(measured.events.mitralValveClosure.sampleIndex).toBe(9);
    expect(measured.events.atrialCalciumOnset.sampleIndex).toBe(7);
    expect(measured.phaseBySample).toEqual([
      "reservoir", "reservoir", "reservoir", "reservoir", "reservoir",
      "conduit", "conduit", "pumping", "pumping", "reservoir",
    ]);
    expect(Object.values(measured.phaseSampleCount)
      .reduce((sum, count) => sum + count, 0)).toBe(samples.length);
    expect(measured.mitral.waveSeparation).toMatchObject({
      status: "separated",
      valley: { sampleIndex: 7, flowMlPerSec: 0 },
      valleyToLowerPeakRatio: 0,
    });
  });

  it("anchors flow-threshold MVC after atrial onset, not at E-wave end", () => {
    const separatedFlow = [0, 0, 0, 0, 0, 10, 20, 0, 15, 0];
    const samples = Array.from({ length: 10 }, (_, index) => {
      const base = sample(index);
      return Object.freeze({
        ...base,
        flowMlPerSec: Object.freeze({
          ...base.flowMlPerSec,
          MV: separatedFlow[index]!,
        }),
      });
    });
    const measured = measureMainWireNormalAdultFiveWallCycleDiagnosticsV1({
      samples,
      precedingSample: precedingSample(),
      dtSec: DT_SEC,
      atrialCalciumOnsetPhase01: 0.7,
      wallMaterialVolumeMlByWall: WALL_VOLUMES_ML,
      valveOpenThreshold: {
        peakFraction: 0.01,
        absoluteFloorMlPerSec: 0.1,
      },
    });

    expect(measured.events.mitralEventSource).toBe("flow-threshold");
    expect(measured.events.mitralValveOpening.sampleIndex).toBe(5);
    expect(measured.events.mitralValveClosure.sampleIndex).toBe(9);
    expect(measured.phaseSampleCount).toEqual({
      reservoir: 6,
      conduit: 2,
      pumping: 2,
    });
  });

  it("reports absent post-atrial MVC as not measurable without inventing a time", () => {
    const eOnlyFlow = [0, 0, 0, 0, 0, 10, 20, 0, 0, 0];
    const samples = Array.from({ length: 10 }, (_, index) => {
      const base = sample(index);
      return Object.freeze({
        ...base,
        flowMlPerSec: Object.freeze({
          ...base.flowMlPerSec,
          MV: eOnlyFlow[index]!,
        }),
      });
    });
    const measurement =
      tryMeasureMainWireNormalAdultFiveWallCycleDiagnosticsV1({
        samples,
        precedingSample: precedingSample(),
        dtSec: DT_SEC,
        atrialCalciumOnsetPhase01: 0.7,
        wallMaterialVolumeMlByWall: WALL_VOLUMES_ML,
        valveOpenThreshold: {
          peakFraction: 0.01,
          absoluteFloorMlPerSec: 0.1,
        },
      });

    expect(measurement).toEqual({
      status: "not-measurable",
      reason: "mitral-closing-transition-after-atrial-onset-not-observed",
      eventDetectionEvidence: {
        valve: "mitral",
        peakForwardFlowMlPerSec: 20,
        openThresholdMlPerSec: 0.2,
        aboveThresholdSampleCount: 2,
        openingTransitionCount: 1,
        closingTransitionCount: 1,
        primaryOpeningCandidateSampleIndex: 5,
        closureSearchStartSampleIndex: 7,
      },
      diagnostics: null,
    });
  });

  it("reports a negative A-apex emptying fraction without clamping it", () => {
    const samples = Array.from({ length: 10 }, (_, index) => {
      const base = sample(index);
      return index === 7
        ? Object.freeze({
          ...base,
          chamberTransmuralPressureMmHg: Object.freeze({
            ...base.chamberTransmuralPressureMmHg,
            LA: 4,
          }),
        })
        : index === 8
          ? Object.freeze({
            ...base,
            nodeVolumeMl: Object.freeze({ ...base.nodeVolumeMl, LA: 35 }),
            chamberTransmuralPressureMmHg: Object.freeze({
              ...base.chamberTransmuralPressureMmHg,
              LA: 9,
            }),
          })
          : base;
    });
    const measured = measureMainWireNormalAdultFiveWallCycleDiagnosticsV1({
      samples,
      precedingSample: precedingSample(),
      dtSec: DT_SEC,
      atrialCalciumOnsetPhase01: 0.7,
      wallMaterialVolumeMlByWall: WALL_VOLUMES_ML,
      valveOpenThreshold: { absoluteFloorMlPerSec: 0.1 },
    });

    expect(measured.leftAtrialPressureWaves
      .boosterEmptyingCompletedAtAPeakFraction).toBe(-0.5);
    expect(measured.leftAtrialPressureWaves
      .boosterEmptyingRemainingAtAPeakFraction).toBe(1.5);
    expect(measured.leftAtrialPressureWaves
      .boosterEmptyingCompletedAtAPeakStatus).toBe("before-net-emptying");
  });
});

function sample(
  index: number,
  mitralAreaCm2 = 2,
): MainWireNormalAdultFiveWallCycleSampleV1 {
  const laVolume = [25, 27, 30, 35, 40, 38, 34, 30, 25, 20][index]!;
  const laPressure = [3, 4, 5, 6, 7, 4, 1, 8, 5, 2][index]!;
  const lvPressure = [110, 100, 90, 50, 30, 10, 8, 7, 6, 5][index]!;
  const mvFlow = [0, 0, 0, 0, 0, 10, 20, 5, 15, 0][index]!;
  const aovFlow = [20, 10, 0, 0, 0, 0, 0, 0, 0, 0][index]!;
  const pvFlow = [2, 3, 4, 5, 6, 10, 20, -2, -3, 1][index]!;
  const strain = 0.1 * (index + 1);
  return Object.freeze({
    timeSec: index * DT_SEC,
    cyclePhase01: index / 10,
    nodeVolumeMl: Object.freeze({ LA: laVolume, LV: 100, RA: 50, RV: 110 }),
    nodeAbsolutePressureMmHg: Object.freeze({ LV: lvPressure + 2 }),
    chamberTransmuralPressureMmHg: Object.freeze({
      LA: laPressure,
      LV: lvPressure,
      RA: 3,
      RV: 20,
    }),
    commonPericardium: Object.freeze({
      excessPressureMmHg: 0,
      storedEnergyMilliJ: 0,
    }),
    flowMlPerSec: Object.freeze({
      MV: mvFlow,
      AoV: aovFlow,
      PVein_LA: pvFlow,
    }),
    wallStressPa: wallRecord(() => Object.freeze({
      total: 6,
      active: 1,
      passive: 2,
      sls: 3,
    })),
    wallFiberLogStrain: wallRecord(() => strain),
    wallEnergyLedgerDensity: wallRecord(() => Object.freeze({
      equilibriumPassiveStoredEnergyDensityJPerM3: 0.2 * (index + 1),
      slsPreviousStoredEnergyDensityJPerM3: 0.1 * index,
      slsNextStoredEnergyDensityJPerM3: 0.1 * (index + 1),
      slsPhysicalDissipationIncrementDensityJPerM3: 0.1,
      slsBackwardEulerNumericalDissipationIncrementDensityJPerM3: 0.1,
      slsDiscreteEnergyBalanceResidualJPerM3: 0,
    })),
    valveHydraulics: Object.freeze({
      MV: Object.freeze({ physicalAreaCm2: mitralAreaCm2 }),
    }),
  });
}

function precedingSample(): MainWireNormalAdultFiveWallCycleSampleV1 {
  const base = sample(0);
  return Object.freeze({
    ...base,
    timeSec: -DT_SEC,
    cyclePhase01: 0.9,
    nodeVolumeMl: Object.freeze({ LA: 20, LV: 100, RA: 50, RV: 110 }),
    wallFiberLogStrain: wallRecord(() => 0),
    wallEnergyLedgerDensity: wallRecord(() => Object.freeze({
      equilibriumPassiveStoredEnergyDensityJPerM3: 0,
      slsPreviousStoredEnergyDensityJPerM3: 0,
      slsNextStoredEnergyDensityJPerM3: 0,
      slsPhysicalDissipationIncrementDensityJPerM3: 0,
      slsBackwardEulerNumericalDissipationIncrementDensityJPerM3: 0,
      slsDiscreteEnergyBalanceResidualJPerM3: 0,
    })),
  });
}

function wallRecord<T>(build: () => T) {
  return Object.freeze(Object.fromEntries(
    MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1.map((wallId) =>
      [wallId, build()]),
  )) as Readonly<Record<
    (typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1)[number],
    T
  >>;
}
