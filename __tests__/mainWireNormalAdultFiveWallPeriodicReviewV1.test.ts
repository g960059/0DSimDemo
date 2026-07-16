import { describe, expect, it } from "vitest";

import {
  buildMainWireNormalAdultFiveWallPeriodicReviewV1,
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_REVIEW_CLAIM_V1,
  renderMainWireNormalAdultFiveWallPeriodicReviewV1,
  unwrapMainWireNormalAdultFiveWallPeriodicReviewPhase01V1,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallPeriodicReviewV1";
import type {
  MainWireNormalAdultFiveWallDiagnosticSampleV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import type {
  MainWireFiveWallPeriodicClosureGroupV1,
} from "@/engine/myocardium/experiments/MainWireFiveWallPeriodicClosureV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

const DT_SEC = 0.1;
const GROUPS = [
  "circulation-node-volume",
  "dynamic-edge-flow",
  "valve-opening",
  "triseg-coordinate",
  "land-state",
  "sls-viscous-strain",
  "wall-input-history",
] as const satisfies readonly MainWireFiveWallPeriodicClosureGroupV1[];

describe("main-wire normal-adult five-wall periodic review V1", () => {
  it("unwraps the terminal accepted phase to one without reversing plot x", () => {
    const phase = unwrapMainWireNormalAdultFiveWallPeriodicReviewPhase01V1([
      0.2,
      0.4,
      0.6,
      0.8,
      2e-15,
    ]);

    expect(phase).toEqual([0.2, 0.4, 0.6, 0.8, 1]);
    expect(phase.at(-1)).toBe(1);
    for (let index = 1; index < phase.length; index += 1) {
      expect(phase[index]).toBeGreaterThanOrEqual(phase[index - 1]!);
    }
  });

  it("derives cycle diagnostics from the final retained raw beat", () => {
    const result = periodicResult();
    const review = buildMainWireNormalAdultFiveWallPeriodicReviewV1(result);

    expect(review.run.latestBeatIndex).toBe(7);
    expect(review.run.previousBeatIndex).toBe(6);
    expect(review.currentBeatSamples).toHaveLength(10);
    expect(review.previousBeatSamples).toHaveLength(10);
    expect(review.cycleDiagnostics.sampleCount).toBe(10);
    expect(review.cycleDiagnostics.workEnergy.stressWorkCoverageFraction)
      .toBe(1);
    expect(review.cycleDiagnostics.phaseSampleCount).toEqual({
      reservoir: 4,
      conduit: 4,
      pumping: 2,
    });
    expect(review.convergence.latestWorstPath)
      .toBe("circulation.nodeVolumesMl.LA");
    expect(review.claim.timeSeriesSmoothingApplied).toBe(false);
    expect(review.claim.timeSeriesResamplingOrInterpolationApplied).toBe(false);
    expect(review.claim.piecewiseLinearPlotSegmentsApplied).toBe(true);
    expect(review.claim.timeStepRobustnessAssessedBySingleReview).toBe(false);
    expect(review.claim.parameterSearchOrTuning).toBe(false);
  });

  it("renders accessible raw plots, ledgers, boundaries, and embedded data", () => {
    const rendered = renderMainWireNormalAdultFiveWallPeriodicReviewV1(
      periodicResult(),
    );

    expect(rendered.html).toContain("Periodic five-wall physiology review");
    expect(rendered.html).toContain("Periodic steady state is not established");
    expect(rendered.html).toContain("Latest group-wise closure");
    expect(rendered.html).toContain("Phasic flow ledger");
    expect(rendered.html).toContain("Wall work and SLS balance");
    expect(rendered.html).toContain("Claim boundaries");
    expect(rendered.html).toContain('id="periodic-review-data"');
    expect(rendered.svg).toContain('role="img"');
    expect(rendered.svg).toContain("LA blood-volume PV");
    expect(rendered.svg).toContain("SLS energy ledger");
    expect(rendered.svg).toContain("<polyline");
    expect(rendered.svg).not.toMatch(/<path\b/);
    expect(rendered.svg).not.toMatch(/\b(?:C|S|Q|T)\s*-?\d/);
    expect(MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_REVIEW_CLAIM_V1
      .plottedSegments).toBe("straight-between-consecutive-accepted-endpoints");

    const embedded = rendered.html.match(
      /<script type="application\/json" id="periodic-review-data">([^<]+)<\/script>/,
    )?.[1];
    expect(embedded).toBeDefined();
    const parsed = JSON.parse(embedded!);
    expect(parsed.currentBeatSamples).toHaveLength(10);
    expect(parsed.previousBeatSamples).toHaveLength(10);
    expect(parsed.cycleDiagnostics.pulmonaryVenous.D.forwardVolumeMl)
      .toBeGreaterThan(0);
  });

  it("qualifies current-dt period-1 without claiming dt robustness", () => {
    const rendered = renderMainWireNormalAdultFiveWallPeriodicReviewV1({
      ...periodicResult(),
      terminationReason: "period1-converged",
      periodicSteadyStateClaimed: true,
    });

    expect(rendered.html).toContain("Current-dt period-1 established");
    expect(rendered.html).toContain("time-step robustness is not assessed");
    expect(rendered.review.run.timeStepRobustness)
      .toBe("not-assessed-by-single-result");
  });
});

function periodicResult(): MainWireNormalAdultFiveWallPeriodicResultV1 {
  const previous = Array.from({ length: 10 }, (_, index) => sample(index, 0));
  const current = Array.from({ length: 10 }, (_, index) => sample(index, 1));
  const beatClosure = [6, 7].map((beatIndex) => Object.freeze({
    beatIndex,
    period1: closure(beatIndex === 6 ? 2e-3 : 1.5e-3),
    period2: beatIndex === 6 ? null : closure(9e-4),
  }));
  return Object.freeze({
    experimentId: "main-wire-normal-adult-five-wall-periodic-steady-v1",
    mode: "canonical",
    laSlsMode: "on",
    initialization: "canonical",
    dtSec: DT_SEC,
    stepsPerBeat: 10,
    requestedMaximumBeatCount: 7,
    completedBeatCount: 7,
    terminationReason: "maximum-beats-reached",
    integrationCompletedWithoutFailure: true,
    periodicSteadyStateClaimed: false,
    period2OrbitSuspected: false,
    periodicity: Object.freeze({
      status: "not-converged",
      latestBeatIndex: 7,
      consecutiveBeatsRequired: 3,
      evidenceBeatIndices: Object.freeze([]),
      latestPeriod1MaximumNormalizedDelta: 1.5e-3,
      latestPeriod2MaximumNormalizedDelta: 9e-4,
    }),
    beatClosure: Object.freeze(beatClosure),
    retainedCompleteBeats: Object.freeze([
      Object.freeze({
        beatIndex: 6,
        startTimeSec: 5,
        endTimeSec: 6,
        samples: Object.freeze(previous),
      }),
      Object.freeze({
        beatIndex: 7,
        startTimeSec: 6,
        endTimeSec: 7,
        samples: Object.freeze(current),
      }),
    ]),
    retainedPartialBeat: Object.freeze([]),
    failure: null,
    initializationAudit: Object.freeze({
      canonicalTotalBloodVolumeMl: 5000,
      initializedTotalBloodVolumeMl: 5000,
      totalBloodVolumeDifferenceMl: 0,
      chamberVolumesChanged: false,
      dynamicEdgeFlowsChanged: false,
      valveOpeningStatesChanged: false,
      mechanicsColdInputChanged: false,
      mechanicsColdStateFingerprintChanged: false,
      transferredVolumeMl: 0,
      sourceNode: null,
      destinationNode: null,
      pulmonaryNodeVolumeDeltaMl: Object.freeze({ PVen: 0, PVein: 0 }),
    }),
    policy: Object.freeze({
      policyId: "fixed-groupwise-periodic-policy-v1",
      period1NormalizedTolerance: 1e-3,
      period2NormalizedTolerance: 1e-3,
      period2MinimumPeriod1NormalizedDelta: 5e-3,
      consecutiveBeats: 3,
      defaultMaximumBeatCount: 32,
      retainedCompleteBeatCount: 3,
      referenceScaleSetId:
        "normal-adult-fixed-dimensional-reference-scales-v1",
    }),
    claim: Object.freeze({
      heartRateBpm: 60,
      circulation: "main-wire-derived-noncoronary-experimental",
      ordinaryBeatIterationOnly: true,
      shootingOrAndersonAccelerationApplied: false,
      parameterSearch: false,
      initializationVariantChangesRuntimeOrMaterialParameters: false,
      pulmonaryRedistributionIsInitialConditionBasinAuditOnly: true,
      samePeriodicOrbitAcrossInitializationsClaimed: false,
      retainedSamplesAreAtMostTheLastThreeCompleteBeats: true,
      smoothingAppliedToSamples: false,
    }),
  } as const) as unknown as MainWireNormalAdultFiveWallPeriodicResultV1;
}

function closure(maximum: number) {
  const groups = Object.fromEntries(GROUPS.map((group, index) => {
    const value = maximum * (1 - index * 0.05);
    const worstPath = group === "circulation-node-volume"
      ? "circulation.nodeVolumesMl.LA"
      : `state.${group}`;
    const entry = Object.freeze({
      group,
      quantity: "node-volume",
      unit: "mL",
      path: worstPath,
      currentValue: 10,
      referenceValue: 9.9,
      absoluteDelta: 0.1,
      referenceScale: 100,
      normalizedDelta: value,
    });
    return [group, Object.freeze({
      group,
      entryCount: 1,
      maximumNormalizedDelta: value,
      worstPath,
      worstEntry: entry,
      physicalMaximumByQuantity: Object.freeze({}),
    })];
  }));
  const worstEntry = groups["circulation-node-volume"].worstEntry;
  return Object.freeze({
    closureId: "main-wire-five-wall-periodic-closure-v1",
    referenceScaleSetId:
      "normal-adult-fixed-dimensional-reference-scales-v1",
    currentRevision: 7,
    referenceRevision: 6,
    elapsedTimeSec: 1,
    groups,
    overall: Object.freeze({
      entryCount: 7,
      maximumNormalizedDelta: maximum,
      worstGroup: "circulation-node-volume",
      worstPath: "circulation.nodeVolumesMl.LA",
      worstEntry,
      physicalMaximumByQuantity: Object.freeze({}),
    }),
  });
}

function sample(
  index: number,
  beatOffset: number,
): MainWireNormalAdultFiveWallDiagnosticSampleV2 {
  const laVolume = [25, 27, 30, 35, 40, 38, 34, 30, 25, 20][index]!;
  const laPressure = [3, 4, 5, 6, 7, 4, 1, 8, 5, 2][index]!;
  const lvPressure = [110, 100, 90, 50, 30, 10, 8, 7, 6, 5][index]!;
  const mvFlow = [5, 0, 0, 0, 0, 10, 20, 5, 15, 8][index]!;
  const aovFlow = [20, 10, 0, 0, 0, 0, 0, 0, 0, 0][index]!;
  const pvFlow = [2, 3, 4, 5, 6, 10, 20, -2, -3, 1][index]!;
  const strain = 0.1 * (index + 1);
  return Object.freeze({
    timeSec: beatOffset + index * DT_SEC,
    cyclePhase01: index / 10,
    nodeVolumeMl: Object.freeze({
      LA: laVolume,
      LV: 120 - index,
      RA: 50,
      RV: 110,
    }),
    nodeAbsolutePressureMmHg: Object.freeze({
      LA: laPressure,
      LV: lvPressure,
      RA: 3,
      RV: 20,
      Ao: 80 + index,
      PA: 15,
      PVein: 6,
    }),
    chamberTransmuralPressureMmHg: Object.freeze({
      LA: laPressure,
      LV: lvPressure,
      RA: 3,
      RV: 20,
    }),
    flowMlPerSec: Object.freeze({
      MV: mvFlow,
      AoV: aovFlow,
      TV: 0,
      PV: 0,
      PVein_LA: pvFlow,
    }),
    valveOpeningFraction01: Object.freeze({ MV: 0, AoV: 0, TV: 0, PV: 0 }),
    freeCalciumUM: Object.freeze({
      LA: 0.1,
      LVFW: 0.11,
      SEP: 0.11,
      RVFW: 0.11,
      RA: 0.1,
    }),
    internalCoordinates: Object.freeze({
      septalMidwallCapVolumeMl: 42,
      junctionRadiusM: 0.033,
    }),
    generalizedForce: Object.freeze({
      septalScaledByOneJ: 0,
      junctionScaledByOneJ: 0,
    }),
    wallStressPa: wallRecord(() => Object.freeze({
      total: 6,
      active: 1,
      passive: 2,
      sls: 3,
    })),
    diagnostics: Object.freeze({
      mechanicsResidualNorm: 1e-8,
      mechanicsIterations: 2,
      circulationScaledResidualInfinityNorm: 1e-9,
      maximumContinuityResidualMl: 1e-9,
      totalBloodVolumeErrorMl: 0,
      mechanicsCallbackCount: 4,
      mechanicsCallbackCacheHits: 1,
      symmetricJacobianMinimumEigenvalueByOneJ: 1,
    }),
    diagnosticSampleId:
      "main-wire-normal-adult-five-wall-diagnostic-sample-v2",
    wallFiberLogStrain: wallRecord(() => strain),
    wallEnergyLedgerDensity: wallRecord(() => Object.freeze({
      equilibriumPassiveStoredEnergyDensityJPerM3: 0.2 * (index + 1),
      slsPreviousStoredEnergyDensityJPerM3: 0.1 * index,
      slsNextStoredEnergyDensityJPerM3: 0.1 * (index + 1),
      slsPhysicalDissipationIncrementDensityJPerM3: 0.1,
      slsBackwardEulerNumericalDissipationIncrementDensityJPerM3: 0.1,
      slsDiscreteEnergyBalanceResidualJPerM3: 0,
      slsPassive: true,
      landThermodynamicStoredEnergyClaimed: false,
      totalThermodynamicPotentialIncludingLandClaimed: false,
    })),
    acceptedMechanicsJacobianAudit: Object.freeze({
      finiteDifferenceScaledStepUsed: 2e-5,
      antisymmetricMaximumAbsoluteByOneJ: 0,
      antisymmetricRelative: 0,
      symmetricWithinTolerance: true,
      symmetricMinimumEigenvalueByOneJ: 1,
      strictLocalStableEquilibrium: true,
    }),
    valveHydraulics: Object.freeze({
      MV: valve(2),
      AoV: valve(2),
      TV: valve(2),
      PV: valve(2),
    }),
  });
}

function valve(physicalAreaCm2: number) {
  return Object.freeze({
    physicalAreaCm2,
    dissipativePowerProxyMmHgMlPerSec: 0,
    powerBalanceResidualMmHgMlPerSec: 0,
  });
}

function wallRecord<T>(build: () => T) {
  return Object.freeze({
    LA: build(),
    LVFW: build(),
    SEP: build(),
    RVFW: build(),
    RA: build(),
  });
}
