import { describe, expect, it } from "vitest";

import {
  ACCEPTED_INTERVAL_TIMEBASE_V1_ID,
} from "@/engine/myocardium/diagnostics/AcceptedIntervalTimebaseV1";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_CYCLE_WALL_IDS_V1,
  type MainWireNormalAdultFiveWallCycleSampleV1,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallCycleDiagnosticsV1";
import {
  measureMainWireNormalAdultFiveWallCycleDiagnosticsV2,
  type MainWireNormalAdultFiveWallCycleAcceptedWindowV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallCycleDiagnosticsV2";

const WALL_VOLUMES_ML = Object.freeze({
  LA: 10,
  LVFW: 10,
  SEP: 10,
  RVFW: 10,
  RA: 10,
});

describe("main-wire normal-adult five-wall cycle diagnostics V2", () => {
  it("uses exact accepted durations while keeping work transition-owned", () => {
    const measured = measureMainWireNormalAdultFiveWallCycleDiagnosticsV2({
      window: acceptedWindow(
        [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
        [0.75],
      ),
      wallMaterialVolumeMlByWall: WALL_VOLUMES_ML,
      valveOpenThreshold: { absoluteFloorMlPerSec: 0.1 },
    });

    expect(measured.status).toBe("measurable");
    if (measured.status !== "measurable") throw new Error("expected cycle");
    expect(measured.timebase).toMatchObject({
      acceptedIntervalCount: 10,
      acceptedEventCount: 1,
      minimumAcceptedDtSec: 0.1,
      maximumAcceptedDtSec: 0.1,
    });
    expect(measured.timebase.durationSec).toBeCloseTo(1, 12);
    expect(measured.events.mitralValveOpening.sampleIndex).toBe(5);
    expect(measured.events.mitralValveClosure.sampleIndex).toBe(9);
    expect(measured.events.aorticValveClosure.sampleIndex).toBe(2);
    expect(measured.events.atrialCalciumOnset).toMatchObject({
      timeSec: 0.75,
      intervalIndex: 7,
      coincidentWithAcceptedEndpoint: false,
      firstAcceptedEndpoint: { sampleIndex: 7 },
    });
    expect(measured.events.atrialCalciumOnset.firstAcceptedEndpoint.timeSec)
      .toBeCloseTo(0.8, 12);
    expect(measured.atrialOnsetStateReadback).toMatchObject({
      exactEventTimeSec: 0.75,
      endpointSampleIndex: 7,
      method: "first-accepted-endpoint-at-or-after-exact-event",
      interpolationApplied: false,
    });
    expect(measured.atrialOnsetStateReadback.endpointTimeSec)
      .toBeCloseTo(0.8, 12);
    expect(measured.phaseDurationSec.reservoir).toBeCloseTo(0.6, 12);
    expect(measured.phaseDurationSec.conduit).toBeCloseTo(0.25, 12);
    expect(measured.phaseDurationSec.pumping).toBeCloseTo(0.15, 12);
    expect(Object.values(measured.phaseDurationSec)
      .reduce((total, duration) => total + duration, 0)).toBeCloseTo(1, 12);
    expect(measured.pulmonaryVenous.S.forwardVolumeMl).toBeCloseTo(2.1, 12);
    expect(measured.pulmonaryVenous.D.forwardVolumeMl).toBeCloseTo(3, 12);
    expect(measured.pulmonaryVenous.Ar.reverseVolumeMl).toBeCloseTo(0.4, 12);
    expect(measured.mitral.E.forwardVolumeMl).toBeCloseTo(3.25, 12);
    expect(measured.mitral.A.forwardVolumeMl).toBeCloseTo(1.75, 12);
    expect(measured.mitral.E.modeledAreaVtiCm).toBeCloseTo(1.625, 12);
    expect(measured.mitral.A.modeledAreaVtiCm).toBeCloseTo(0.875, 12);
    expect(measured.leftAtrialPressureWaves
      .aPeakDelayFromAtrialCalciumOnsetSec).toBeCloseTo(0.05, 12);
    expect(measured.leftAtrialPressureWaves
      .aPressurePeakToMitralAFlowPeakSec).toBeCloseTo(0.1, 12);
    expect(measured.ivrtLike.durationSec).toBeCloseTo(0.3, 12);
    expect(measured.ivrtLike.sampleCount).toBe(3);
    expect(measured.workEnergy.stressWorkCoverageFraction).toBe(1);
    expect(measured.workEnergy.perWall.LA.stressWorkOnWallMilliJ.total)
      .toBeCloseTo(0.06, 12);
    expect(measured.workEnergy.cavityWorkOnWallMilliJ.LA)
      .toBeCloseTo(24 * 0.133322, 12);
    expect(measured.leftAtrialVolumes).toMatchObject({
      maximumMl: 40,
      minimumMl: 20,
      preAMl: 30,
    });
  });

  it("integrates a genuinely nonuniform trace and uses physical-time delays", () => {
    const durations = [0.04, 0.06, 0.08, 0.12, 0.1, 0.15, 0.05, 0.14, 0.11, 0.15];
    const measured = measureMainWireNormalAdultFiveWallCycleDiagnosticsV2({
      window: acceptedWindow(durations, [0.65]),
      wallMaterialVolumeMlByWall: WALL_VOLUMES_ML,
      valveOpenThreshold: { absoluteFloorMlPerSec: 0.1 },
    });

    expect(measured.status).toBe("measurable");
    if (measured.status !== "measurable") throw new Error("expected cycle");
    expect(measured.timebase.minimumAcceptedDtSec).toBeCloseTo(0.04, 12);
    expect(measured.timebase.maximumAcceptedDtSec).toBeCloseTo(0.15, 12);
    expect(measured.phaseDurationSec.reservoir).toBeCloseTo(0.55, 12);
    expect(measured.phaseDurationSec.conduit).toBeCloseTo(0.25, 12);
    expect(measured.phaseDurationSec.pumping).toBeCloseTo(0.2, 12);
    expect(measured.pulmonaryVenous.S.forwardVolumeMl).toBeCloseTo(1.93, 12);
    expect(measured.pulmonaryVenous.D.forwardVolumeMl).toBeCloseTo(2.5, 12);
    expect(measured.pulmonaryVenous.Ar.reverseVolumeMl).toBeCloseTo(0.51, 12);
    expect(measured.mitral.E.forwardVolumeMl).toBeCloseTo(2.75, 12);
    expect(measured.mitral.A.forwardVolumeMl).toBeCloseTo(2.1, 12);
    expect(measured.leftAtrialPressureWaves
      .aPeakDelayFromAtrialCalciumOnsetSec).toBeCloseTo(0.09, 12);
    expect(measured.leftAtrialPressureWaves
      .aPressurePeakToMitralAFlowPeakSec).toBeCloseTo(0.11, 12);
    expect(measured.ivrtLike.durationSec).toBeCloseTo(0.37, 12);
    expect(measured.ivrtLike.sampleCount).toBe(3);
    expect(measured.ivrtLike.reason).toBe("available");
    expect(measured.ivrtLike.relaxationTauSec).toBeGreaterThan(0);
    expect(measured.workEnergy.perWall.LA.stressWorkOnWallMilliJ.total)
      .toBeCloseTo(0.06, 12);
    expect(measured.workEnergy.cavityWorkOnWallMilliJ.LA)
      .toBeCloseTo(24 * 0.133322, 12);
  });

  it("reports zero or multiple LA calcium onsets as explicitly unavailable", () => {
    const noOnset = measureMainWireNormalAdultFiveWallCycleDiagnosticsV2({
      window: acceptedWindow(Array(10).fill(0.1), []),
      wallMaterialVolumeMlByWall: WALL_VOLUMES_ML,
    });
    const multiple = measureMainWireNormalAdultFiveWallCycleDiagnosticsV2({
      window: acceptedWindow(Array(10).fill(0.1), [0.75, 0.75]),
      wallMaterialVolumeMlByWall: WALL_VOLUMES_ML,
    });

    expect(noOnset).toMatchObject({
      status: "not-measurable",
      reason: "no-left-atrial-calcium-onset-event",
      atrialCalciumOnsetCandidates: [],
    });
    expect(multiple).toMatchObject({
      status: "not-measurable",
      reason: "multiple-left-atrial-calcium-onset-events",
    });
    if (multiple.status !== "not-measurable") throw new Error("expected unavailable");
    expect(multiple.atrialCalciumOnsetCandidates).toHaveLength(2);
    expect(new Set(multiple.atrialCalciumOnsetCandidates.map(
      (event) => event.eventId,
    )).size).toBe(2);
  });

  it("retains invalid-EOA interval count and affected accepted duration", () => {
    const measured = measureMainWireNormalAdultFiveWallCycleDiagnosticsV2({
      window: acceptedWindow(Array(10).fill(0.1), [0.75], new Set([5])),
      wallMaterialVolumeMlByWall: WALL_VOLUMES_ML,
      valveOpenThreshold: { absoluteFloorMlPerSec: 0.1 },
    });

    expect(measured.status).toBe("measurable");
    if (measured.status !== "measurable") throw new Error("expected cycle");
    expect(measured.mitral.E.modeledAreaVtiCm).toBeNull();
    expect(measured.mitral.E.positiveFlowSamplesWithoutPhysicalArea).toBe(1);
    expect(measured.mitral.E.positiveFlowDurationWithoutPhysicalAreaSec)
      .toBeCloseTo(0.1, 12);
  });

  it("includes the true preceding boundary in whole-cycle LA volume extrema", () => {
    const window = withHemodynamicOverrides(
      acceptedWindow(Array(10).fill(0.1), [0.75]),
      { precedingLaVolumeMl: 45 },
    );
    const measured = measureMainWireNormalAdultFiveWallCycleDiagnosticsV2({
      window,
      wallMaterialVolumeMlByWall: WALL_VOLUMES_ML,
      valveOpenThreshold: { absoluteFloorMlPerSec: 0.1 },
    });

    expect(measured.status).toBe("measurable");
    if (measured.status !== "measurable") throw new Error("expected cycle");
    expect(measured.leftAtrialVolumes.maximumMl).toBe(45);
    expect(measured.leftAtrialVolumes.minimumMl).toBe(20);
  });

  it("selects a real predecessor-to-endpoint-0 mitral closure after a late onset", () => {
    const window = withHemodynamicOverrides(
      acceptedWindow(Array(10).fill(0.1), [0.95]),
      {
        precedingMitralFlowMlPerSec: 10,
        mitralFlowMlPerSecByIndex: { 9: 10 },
      },
    );
    const measured = measureMainWireNormalAdultFiveWallCycleDiagnosticsV2({
      window,
      wallMaterialVolumeMlByWall: WALL_VOLUMES_ML,
      valveOpenThreshold: { absoluteFloorMlPerSec: 0.1 },
    });

    expect(measured.status).toBe("measurable");
    if (measured.status !== "measurable") throw new Error("expected cycle");
    expect(measured.events.mitralValveOpening.sampleIndex).toBe(5);
    expect(measured.events.mitralValveClosure.sampleIndex).toBe(0);
    expect(measured.phaseDurationSec.reservoir).toBeCloseTo(0.5, 12);
    expect(measured.phaseDurationSec.conduit).toBeCloseTo(0.45, 12);
    expect(measured.phaseDurationSec.pumping).toBeCloseTo(0.05, 12);
  });

  it("measures the cyclic (AoVC, MVO] IVRT window in accepted physical time", () => {
    const window = withHemodynamicOverrides(
      acceptedWindow(Array(10).fill(0.1), [0.75]),
      {
        precedingMitralFlowMlPerSec: 0,
        mitralFlowMlPerSecByIndex: {
          0: 0, 1: 0, 2: 10, 3: 20, 4: 10,
          5: 5, 6: 5, 7: 5, 8: 10, 9: 0,
        },
        precedingAorticFlowMlPerSec: 20,
        aorticFlowMlPerSecByIndex: {
          0: 20, 1: 20, 2: 20, 3: 20, 4: 20,
          5: 20, 6: 20, 7: 20, 8: 0, 9: 0,
        },
        lvPressureMmHgByIndex: { 9: 80, 0: 60, 1: 40, 2: 20 },
      },
    );
    const measured = measureMainWireNormalAdultFiveWallCycleDiagnosticsV2({
      window,
      wallMaterialVolumeMlByWall: WALL_VOLUMES_ML,
      valveOpenThreshold: { absoluteFloorMlPerSec: 0.1 },
    });

    expect(measured.status).toBe("measurable");
    if (measured.status !== "measurable") throw new Error("expected cycle");
    expect(measured.events.aorticValveClosure.sampleIndex).toBe(8);
    expect(measured.events.mitralValveOpening.sampleIndex).toBe(2);
    expect(measured.ivrtLike.durationSec).toBeCloseTo(0.4, 12);
    expect(measured.ivrtLike.sampleCount).toBe(4);
    expect(measured.ivrtLike.fixedAsymptoteMmHg).toBe(19);
    expect(measured.ivrtLike.reason).toBe("available");
    expect(measured.ivrtLike.relaxationTauSec).toBeGreaterThan(0);
  });
});

type HemodynamicOverrides = Readonly<{
  precedingLaVolumeMl?: number;
  precedingMitralFlowMlPerSec?: number;
  precedingAorticFlowMlPerSec?: number;
  mitralFlowMlPerSecByIndex?: Readonly<Record<number, number>>;
  aorticFlowMlPerSecByIndex?: Readonly<Record<number, number>>;
  lvPressureMmHgByIndex?: Readonly<Record<number, number>>;
}>;

function withHemodynamicOverrides(
  window: MainWireNormalAdultFiveWallCycleAcceptedWindowV2,
  overrides: HemodynamicOverrides,
): MainWireNormalAdultFiveWallCycleAcceptedWindowV2 {
  const preceding = window.precedingSample.sample;
  const precedingSampleValue = Object.freeze({
    ...preceding,
    nodeVolumeMl: Object.freeze({
      ...preceding.nodeVolumeMl,
      LA: overrides.precedingLaVolumeMl ?? preceding.nodeVolumeMl.LA,
    }),
    flowMlPerSec: Object.freeze({
      ...preceding.flowMlPerSec,
      MV: overrides.precedingMitralFlowMlPerSec
        ?? preceding.flowMlPerSec.MV,
      AoV: overrides.precedingAorticFlowMlPerSec
        ?? preceding.flowMlPerSec.AoV,
    }),
  });
  return Object.freeze({
    ...window,
    precedingSample: Object.freeze({
      ...window.precedingSample,
      sample: precedingSampleValue,
    }),
    intervals: Object.freeze(window.intervals.map((interval, index) => {
      const endpoint = interval.endpointSample.sample;
      return Object.freeze({
        ...interval,
        endpointSample: Object.freeze({
          ...interval.endpointSample,
          sample: Object.freeze({
            ...endpoint,
            chamberTransmuralPressureMmHg: Object.freeze({
              ...endpoint.chamberTransmuralPressureMmHg,
              LV: overrides.lvPressureMmHgByIndex?.[index]
                ?? endpoint.chamberTransmuralPressureMmHg.LV,
            }),
            flowMlPerSec: Object.freeze({
              ...endpoint.flowMlPerSec,
              MV: overrides.mitralFlowMlPerSecByIndex?.[index]
                ?? endpoint.flowMlPerSec.MV,
              AoV: overrides.aorticFlowMlPerSecByIndex?.[index]
                ?? endpoint.flowMlPerSec.AoV,
            }),
          }),
        }),
      });
    })),
  });
}

function acceptedWindow(
  durationSec: readonly number[],
  atrialOnsetTimesSec: readonly number[],
  invalidAreaIndices: ReadonlySet<number> = new Set(),
): MainWireNormalAdultFiveWallCycleAcceptedWindowV2 {
  const startTimeSec = 0;
  let cursor = startTimeSec;
  const intervals = durationSec.map((duration, intervalIndex) => {
    const intervalStart = cursor;
    const intervalEnd = intervalStart + duration;
    cursor = intervalEnd;
    const sampleValue = sample(
      intervalIndex,
      intervalEnd,
      invalidAreaIndices.has(intervalIndex) ? 0 : 2,
    );
    const localEvents = atrialOnsetTimesSec.flatMap((timeSec, eventIndex) =>
      timeSec > intervalStart && timeSec <= intervalEnd
        ? [acceptedAtrialEvent(timeSec, intervalIndex, eventIndex)]
        : []);
    return Object.freeze({
      startTimeSec: intervalStart,
      endTimeSec: intervalEnd,
      durationSec: duration,
      endpointSample: Object.freeze({
        timeSec: intervalEnd,
        sample: sampleValue,
      }),
      eventsOpenClosed: Object.freeze(localEvents),
    });
  });
  return Object.freeze({
    timebaseId: ACCEPTED_INTERVAL_TIMEBASE_V1_ID,
    startTimeSec,
    endTimeSec: cursor,
    durationSec: cursor - startTimeSec,
    precedingSample: Object.freeze({
      timeSec: startTimeSec,
      sample: precedingSample(),
    }),
    intervals: Object.freeze(intervals),
  });
}

function acceptedAtrialEvent(
  timeSec: number,
  baseRevision: number,
  occurrence: number,
) {
  const calciumEvent = Object.freeze({
    timeSec,
    strengthByWall: Object.freeze({
      LA: 1,
      RA: 1,
      LVFW: 0,
      SEP: 0,
      RVFW: 0,
    }),
  });
  return Object.freeze({
    eventId: `test-event-${baseRevision}-${occurrence}`,
    timeSec,
    event: Object.freeze({
      source: "accepted-calcium-trial" as const,
      scheduleId: "test-schedule",
      scheduleIdentityHash: "test-hash",
      acceptedTrialBaseRevision: baseRevision,
      eventIndexWithinAcceptedTrial: occurrence,
      calciumEvent,
    }),
  });
}

function sample(
  index: number,
  timeSec: number,
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
    timeSec,
    cyclePhase01: positiveModulo(timeSec, 1),
    nodeVolumeMl: Object.freeze({ LA: laVolume, LV: 100, RA: 50, RV: 110 }),
    chamberTransmuralPressureMmHg: Object.freeze({
      LA: laPressure,
      LV: lvPressure,
      RA: 3,
      RV: 20,
    }),
    flowMlPerSec: Object.freeze({ MV: mvFlow, AoV: aovFlow, PVein_LA: pvFlow }),
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
  const base = sample(0, 0);
  return Object.freeze({
    ...base,
    cyclePhase01: 0,
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

function positiveModulo(value: number, modulus: number): number {
  const result = value % modulus;
  return result < 0 ? result + modulus : result;
}
