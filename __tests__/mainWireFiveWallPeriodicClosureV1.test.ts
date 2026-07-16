import { describe, expect, it } from "vitest";

import {
  NON_CORONARY_CIRCULATION_BE_V1_ID,
} from "@/engine/core/nonCoronaryCirculationBackwardEulerV1";
import {
  MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID,
} from "@/engine/myocardium/MainWireFiveWallNonCoronaryTransactionV1";
import {
  MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
  classifyMainWireFiveWallPeriodicityV1,
  compareMainWireFiveWallAcceptedStatesV1,
  type MainWireFiveWallPeriodicAcceptedStateV1,
  type MainWireFiveWallPeriodicBeatObservationV1,
  type MainWireFiveWallPeriodicClosureReportV1,
} from "@/engine/myocardium/experiments/MainWireFiveWallPeriodicClosureV1";
import {
  WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
} from "@/engine/myocardium/wholeHeartMechanicsContractV1";

describe("MainWireFiveWallPeriodicClosureV1", () => {
  it("reports zero closure for identical physical states while ignoring time metadata", () => {
    const reference = acceptedState({ revision: 200, timeSec: 2 });
    const current = acceptedState({ revision: 300, timeSec: 3 });
    const report = compareMainWireFiveWallAcceptedStatesV1(
      current,
      reference,
      MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
    );

    expect(report.elapsedTimeSec).toBe(1);
    expect(report.overall.entryCount).toBe(68);
    expect(report.overall.maximumNormalizedDelta).toBe(0);
    expect(report.groups["circulation-node-volume"].entryCount).toBe(15);
    expect(report.groups["dynamic-edge-flow"].entryCount).toBe(2);
    expect(report.groups["valve-opening"].entryCount).toBe(4);
    expect(report.groups["triseg-coordinate"].entryCount).toBe(2);
    expect(report.groups["land-state"].entryCount).toBe(30);
    expect(report.groups["sls-viscous-strain"].entryCount).toBe(5);
    expect(report.groups["wall-input-history"].entryCount).toBe(10);
  });

  it("normalizes by fixed dimensional scales and retains physical maxima by quantity", () => {
    const reference = acceptedState({ revision: 200, timeSec: 2 });
    const current = acceptedState({
      revision: 300,
      timeSec: 3,
      laVolumeMl: 52,
      aoRootFlowMlPerSec: 30,
      junctionRadiusM: 0.035,
      laPreviousFiberLogStrain: 0.015,
      laPreviousFreeCalciumUM: 0.3,
    });
    const report = compareMainWireFiveWallAcceptedStatesV1(
      current,
      reference,
      MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
    );

    expect(report.groups["circulation-node-volume"].maximumNormalizedDelta)
      .toBeCloseTo(2 / 100, 14);
    expect(report.groups["dynamic-edge-flow"].maximumNormalizedDelta)
      .toBeCloseTo(20 / 500, 14);
    expect(report.groups["triseg-coordinate"].maximumNormalizedDelta)
      .toBeCloseTo(0.002 / 0.04, 14);
    expect(report.groups["wall-input-history"].maximumNormalizedDelta)
      .toBeCloseTo(0.2 / 1, 14);
    expect(report.overall.maximumNormalizedDelta).toBeCloseTo(0.2, 14);
    expect(report.overall.worstPath)
      .toBe("mechanics.materialState.wallStateByWall.LA.previousFreeCalciumUM");
    expect(report.overall.worstEntry.absoluteDelta).toBeCloseTo(0.2, 14);
    expect(report.overall.worstEntry.unit).toBe("uM");

    const triseg = report.groups["triseg-coordinate"].physicalMaximumByQuantity;
    expect(triseg["junction-radius"]?.maximumAbsoluteDelta).toBeCloseTo(0.002, 14);
    expect(triseg["junction-radius"]?.unit).toBe("m");
    expect(triseg["septal-midwall-cap-volume"]?.unit).toBe("m3");
    const history = report.groups["wall-input-history"].physicalMaximumByQuantity;
    expect(history["wall-fiber-log-strain"]?.maximumAbsoluteDelta)
      .toBeCloseTo(0.005, 14);
    expect(history["wall-free-calcium"]?.maximumAbsoluteDelta)
      .toBeCloseTo(0.2, 14);
  });

  it("rejects incompatible identities, malformed wall state, and nonpositive scales", () => {
    const reference = acceptedState({ revision: 200, timeSec: 2 });
    const incompatible = acceptedState({
      revision: 300,
      timeSec: 3,
      parameterIdentityHash: "different-hash",
    });
    expect(() => compareMainWireFiveWallAcceptedStatesV1(
      incompatible,
      reference,
      MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
    )).toThrow(/identities differ/);

    const nonfinite = acceptedState({
      revision: 300,
      timeSec: 3,
      laLandCaTrpn: Number.NaN,
    });
    expect(() => compareMainWireFiveWallAcceptedStatesV1(
      nonfinite,
      reference,
      MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
    )).toThrow(/must be finite/);

    expect(() => compareMainWireFiveWallAcceptedStatesV1(
      acceptedState({ revision: 300, timeSec: 3 }),
      reference,
      { ...MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
        wallFreeCalciumUM: 0 },
    )).toThrow(/must be positive and finite/);
  });

  it("requires consecutive period-1 closures before declaring convergence", () => {
    const observations = [
      observation(1, 0.02, null),
      observation(2, 8e-4, 0.01),
      observation(3, 7e-4, 0.01),
    ];
    const classification = classifyMainWireFiveWallPeriodicityV1(observations, {
      period1NormalizedTolerance: 1e-3,
      period2NormalizedTolerance: 1e-3,
      period2MinimumPeriod1NormalizedDelta: 1e-2,
      consecutiveBeats: 2,
    });

    expect(classification.status).toBe("period1-converged");
    expect(classification.evidenceBeatIndices).toEqual([2, 3]);
    expect(classification.latestPeriod1MaximumNormalizedDelta)
      .toBeCloseTo(7e-4, 12);
  });

  it("reports period-2 only when two-period closure coexists with one-period separation", () => {
    const options = {
      period1NormalizedTolerance: 1e-3,
      period2NormalizedTolerance: 1e-3,
      period2MinimumPeriod1NormalizedDelta: 1e-2,
      consecutiveBeats: 2,
    } as const;
    const suspect = classifyMainWireFiveWallPeriodicityV1([
      observation(2, 0.04, 8e-4),
      observation(3, 0.03, 7e-4),
    ], options);
    expect(suspect.status).toBe("period2-suspect");
    expect(suspect.evidenceBeatIndices).toEqual([2, 3]);

    const insufficientSeparation = classifyMainWireFiveWallPeriodicityV1([
      observation(2, 0.006, 8e-4),
      observation(3, 0.005, 7e-4),
    ], options);
    expect(insufficientSeparation.status).toBe("not-converged");
    expect(insufficientSeparation.evidenceBeatIndices).toEqual([]);
  });

  it("keeps incomplete histories unclassified and validates observation order", () => {
    const options = {
      period1NormalizedTolerance: 1e-3,
      period2NormalizedTolerance: 1e-3,
      period2MinimumPeriod1NormalizedDelta: 1e-2,
      consecutiveBeats: 2,
    } as const;
    expect(classifyMainWireFiveWallPeriodicityV1([
      observation(2, 5e-4, 5e-4),
    ], options).status).toBe("not-converged");
    expect(classifyMainWireFiveWallPeriodicityV1([
      observation(2, 5e-4, 5e-4),
      observation(4, 4e-4, 4e-4),
    ], options).status).toBe("not-converged");
    expect(() => classifyMainWireFiveWallPeriodicityV1([
      observation(2, 5e-4, 5e-4),
      observation(2, 4e-4, 4e-4),
    ], options)).toThrow(/strictly increasing/);
  });
});

type StateOptions = Readonly<{
  revision: number;
  timeSec: number;
  parameterIdentityHash?: string;
  laVolumeMl?: number;
  aoRootFlowMlPerSec?: number;
  junctionRadiusM?: number;
  laPreviousFiberLogStrain?: number;
  laPreviousFreeCalciumUM?: number;
  laLandCaTrpn?: number;
}>;

function acceptedState(options: StateOptions): MainWireFiveWallPeriodicAcceptedStateV1 {
  const nodeVolumesMl = Object.freeze({
    LV: 120,
    LA: options.laVolumeMl ?? 50,
    RV: 130,
    RA: 55,
    Ao: 140,
    SA: 150,
    Art: 160,
    Cap: 170,
    SV: 180,
    VC: 190,
    PA: 80,
    PArt: 90,
    PCap: 100,
    PVen: 110,
    PVein: 120,
  });
  const wallStateByWall = Object.freeze({
    LA: wallState({
      caTrpn: options.laLandCaTrpn,
      previousFiberLogStrain: options.laPreviousFiberLogStrain,
      previousFreeCalciumUM: options.laPreviousFreeCalciumUM,
    }),
    LVFW: wallState(),
    SEP: wallState(),
    RVFW: wallState(),
    RA: wallState(),
  });
  return Object.freeze({
    transactionId: MAIN_WIRE_FIVE_WALL_NONCORONARY_TRANSACTION_V1_ID,
    revision: options.revision,
    acceptedTimeSec: options.timeSec,
    circulation: Object.freeze({
      transactionId: NON_CORONARY_CIRCULATION_BE_V1_ID,
      revision: options.revision,
      acceptedTimeSec: options.timeSec,
      totalBloodVolumeMl: Object.values(nodeVolumesMl)
        .reduce((sum, value) => sum + value, 0),
      nodeVolumesMl,
      dynamicEdgeFlowsMlPerSec: Object.freeze({
        Ao_SA: options.aoRootFlowMlPerSec ?? 10,
        PA_PArt: 8,
      }),
      valveStates: Object.freeze({
        MV: Object.freeze({ leafletOpeningFraction01: 0.2 }),
        AoV: Object.freeze({ leafletOpeningFraction01: 0.3 }),
        TV: Object.freeze({ leafletOpeningFraction01: 0.4 }),
        PV: Object.freeze({ leafletOpeningFraction01: 0.5 }),
      }),
    }),
    mechanics: Object.freeze({
      contractId: WHOLE_HEART_MECHANICS_CONTRACT_V1_ID,
      providerId: "test-five-wall-provider-v1",
      parameterSetId: "test-five-wall-prior-v1",
      parameterIdentityHash: options.parameterIdentityHash ?? "same-hash",
      stateSchemaVersion: 2,
      revision: options.revision,
      acceptedTimeSec: options.timeSec,
      acceptedVolumesMl: Object.freeze({
        LA: nodeVolumesMl.LA,
        LV: nodeVolumesMl.LV,
        RA: nodeVolumesMl.RA,
        RV: nodeVolumesMl.RV,
      }),
      materialState: Object.freeze({
        wallStateByWall,
        trisegCoordinates: Object.freeze({
          septalMidwallCapVolumeM3: 42e-6,
          junctionRadiusM: options.junctionRadiusM ?? 0.033,
        }),
      }),
      materialStateFingerprint: "test-fingerprint",
    }),
  });
}

function wallState(options: Readonly<{
  caTrpn?: number;
  previousFiberLogStrain?: number;
  previousFreeCalciumUM?: number;
}> = {}) {
  return Object.freeze({
    landState: Float64Array.from([
      options.caTrpn ?? 0.18,
      0.22,
      0.04,
      0.02,
      0,
      0,
    ]),
    slsState: Object.freeze({ viscousLogStrain: 0.01 }),
    previousFiberLogStrain: options.previousFiberLogStrain ?? 0.01,
    previousFreeCalciumUM: options.previousFreeCalciumUM ?? 0.1,
  });
}

function observation(
  beatIndex: number,
  period1Maximum: number,
  period2Maximum: number | null,
): MainWireFiveWallPeriodicBeatObservationV1 {
  return Object.freeze({
    beatIndex,
    period1: closureWithMaximum(period1Maximum),
    period2: period2Maximum === null ? null : closureWithMaximum(period2Maximum),
  });
}

function closureWithMaximum(maximum: number): MainWireFiveWallPeriodicClosureReportV1 {
  return compareMainWireFiveWallAcceptedStatesV1(
    acceptedState({
      revision: 2,
      timeSec: 2,
      laVolumeMl: 50 + 100 * maximum,
    }),
    acceptedState({ revision: 1, timeSec: 1 }),
    MAIN_WIRE_FIVE_WALL_PERIODIC_REFERENCE_SCALES_V1,
  );
}
