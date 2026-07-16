import { describe, expect, it } from "vitest";

import type {
  MainWireNormalAdultFiveWallDiagnosticSampleV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import {
  compareMainWireNormalAdultFiveWallDtHalvingV1,
  runMainWireNormalAdultFiveWallDtHalvingV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallDtHalvingV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

describe("main-wire normal-adult five-wall dt-halving difference V1", () => {
  it("maps only common accepted samples on the strict nested grid", () => {
    const coarse = result({
      dtSec: 0.5,
      samples: [sample(0.5), sample(0)],
    });
    const fine = result({
      dtSec: 0.25,
      samples: [sample(0.25), sample(0.5), sample(0.75), sample(0)],
    });
    const comparison = compareMainWireNormalAdultFiveWallDtHalvingV1(
      coarse,
      fine,
    );

    expect(comparison.interpretable).toBe(true);
    expect(comparison.interpretabilityReasons).toEqual([]);
    expect(comparison.fineAcceptedStepsPerCoarseAcceptedStep).toBe(2);
    expect(comparison.commonAcceptedSampleMapping).toEqual([
      {
        coarseAcceptedSampleIndex: 0,
        fineAcceptedSampleIndex: 1,
        cyclePhase01: 0.5,
      },
      {
        coarseAcceptedSampleIndex: 1,
        fineAcceptedSampleIndex: 3,
        cyclePhase01: 0,
      },
    ]);
    for (const metric of Object.values(comparison.signalMetrics!)) {
      expect(metric.maximumAbsoluteDifference).toBe(0);
      expect(metric.fixedScaleNormalizedMaximumDifference).toBe(0);
      expect(metric.relativeL2Difference).toBe(0);
    }
    expect(comparison.claim).toMatchObject({
      comparisonKind: "dt-halving-difference-not-convergence-order",
      interpolationApplied: false,
      physiologicalOrNumericalPassThresholdApplied: false,
      parameterSearch: false,
    });
  });

  it("reports physical, fixed-scale, and fine-referenced relative L2 differences", () => {
    const coarse = result({
      dtSec: 0.5,
      samples: [
        sample(0.5, { laBloodVolumeMl: 12 }),
        sample(0, { laBloodVolumeMl: 22 }),
      ],
    });
    const fine = result({
      dtSec: 0.25,
      samples: [
        sample(0.25, { laBloodVolumeMl: 9 }),
        sample(0.5, { laBloodVolumeMl: 10 }),
        sample(0.75, { laBloodVolumeMl: 19 }),
        sample(0, { laBloodVolumeMl: 20 }),
      ],
    });
    const metric = compareMainWireNormalAdultFiveWallDtHalvingV1(coarse, fine)
      .signalMetrics!.laBloodVolumeMl;

    expect(metric.maximumAbsoluteDifference).toBe(2);
    expect(metric.referenceScale).toBe(100);
    expect(metric.fixedScaleNormalizedMaximumDifference).toBe(0.02);
    expect(metric.relativeL2Difference)
      .toBeCloseTo(Math.sqrt(8 / 500), 14);
    expect(metric.worstCoarseAcceptedSampleIndex).toBe(0);
    expect(metric.worstFineAcceptedSampleIndex).toBe(1);
    expect(metric.worstCyclePhase01).toBe(0.5);
  });

  it("does not interpret transient beats even when their grids are nested", () => {
    const coarse = result({
      dtSec: 0.5,
      periodic: false,
      samples: [sample(0.5), sample(0)],
    });
    const fine = result({
      dtSec: 0.25,
      samples: [sample(0.25), sample(0.5), sample(0.75), sample(0)],
    });
    const comparison = compareMainWireNormalAdultFiveWallDtHalvingV1(
      coarse,
      fine,
    );

    expect(comparison.interpretable).toBe(false);
    expect(comparison.bothPeriod1Converged).toBe(false);
    expect(comparison.interpretabilityReasons)
      .toContain("coarse-period1-not-converged");
    expect(comparison.signalMetrics).toBeNull();
  });

  it("marks non-halved and phase-incompatible grids uninterpretable", () => {
    const coarse = result({
      dtSec: 0.5,
      samples: [sample(0.5), sample(0)],
    });
    const notHalved = result({
      dtSec: 0.2,
      samples: [
        sample(0.2), sample(0.4), sample(0.6), sample(0.8), sample(0),
      ],
    });
    const ratioComparison = compareMainWireNormalAdultFiveWallDtHalvingV1(
      coarse,
      notHalved,
    );
    expect(ratioComparison.interpretable).toBe(false);
    expect(ratioComparison.interpretabilityReasons).toEqual(expect.arrayContaining([
      "fine-dt-is-not-half-coarse-dt",
      "steps-per-beat-are-not-two-to-one",
    ]));

    const phaseMismatch = result({
      dtSec: 0.25,
      samples: [sample(0.25), sample(0.51), sample(0.75), sample(0)],
    });
    const phaseComparison = compareMainWireNormalAdultFiveWallDtHalvingV1(
      coarse,
      phaseMismatch,
    );
    expect(phaseComparison.interpretable).toBe(false);
    expect(phaseComparison.interpretabilityReasons)
      .toContain("common-accepted-grid-phase-mismatch");
    expect(phaseComparison.commonAcceptedSampleMapping).toEqual([]);
  });

  it("requires identical model configuration and handles a zero fine L2 norm", () => {
    const coarse = result({
      dtSec: 0.5,
      samples: [
        sample(0.5, { mitralFlowMlPerSec: 2 }),
        sample(0, { mitralFlowMlPerSec: 2 }),
      ],
    });
    const fine = result({
      dtSec: 0.25,
      samples: [
        sample(0.25, { mitralFlowMlPerSec: 0 }),
        sample(0.5, { mitralFlowMlPerSec: 0 }),
        sample(0.75, { mitralFlowMlPerSec: 0 }),
        sample(0, { mitralFlowMlPerSec: 0 }),
      ],
    });
    const comparison = compareMainWireNormalAdultFiveWallDtHalvingV1(
      coarse,
      fine,
    );
    expect(comparison.signalMetrics!.mitralFlowMlPerSec.relativeL2Difference)
      .toBeNull();

    const otherInitialization = result({
      dtSec: 0.25,
      initialization: "pven-to-pvein-10ml",
      samples: [sample(0.25), sample(0.5), sample(0.75), sample(0)],
    });
    const incompatible = compareMainWireNormalAdultFiveWallDtHalvingV1(
      coarse,
      otherInitialization,
    );
    expect(incompatible.interpretable).toBe(false);
    expect(incompatible.interpretabilityReasons)
      .toContain("initialization-mismatch");

    const otherMaximum = result({
      dtSec: 0.25,
      requestedMaximumBeatCount: 64,
      samples: [sample(0.25), sample(0.5), sample(0.75), sample(0)],
    });
    expect(compareMainWireNormalAdultFiveWallDtHalvingV1(coarse, otherMaximum)
      .interpretabilityReasons).toContain("maximum-beat-count-mismatch");
  });

  it("validates wrapper input before starting either expensive run", () => {
    expect(() => runMainWireNormalAdultFiveWallDtHalvingV1({
      coarseDtSec: 0,
    })).toThrow(/coarseDtSec must be positive and finite/);
  });
});

type SampleValues = Readonly<{
  laBloodVolumeMl: number;
  lvBloodVolumeMl: number;
  laAbsolutePressureMmHg: number;
  lvAbsolutePressureMmHg: number;
  mitralFlowMlPerSec: number;
  pulmonaryVeinToLaFlowMlPerSec: number;
  laTotalWallStressPa: number;
  laFiberLogStrain: number;
}>;

const DEFAULT_VALUES: SampleValues = Object.freeze({
  laBloodVolumeMl: 50,
  lvBloodVolumeMl: 120,
  laAbsolutePressureMmHg: 8,
  lvAbsolutePressureMmHg: 80,
  mitralFlowMlPerSec: 100,
  pulmonaryVeinToLaFlowMlPerSec: 80,
  laTotalWallStressPa: 50_000,
  laFiberLogStrain: 0.05,
});

function sample(
  cyclePhase01: number,
  overrides: Partial<SampleValues> = {},
): MainWireNormalAdultFiveWallDiagnosticSampleV2 {
  const values = { ...DEFAULT_VALUES, ...overrides };
  return {
    cyclePhase01,
    nodeVolumeMl: { LA: values.laBloodVolumeMl, LV: values.lvBloodVolumeMl },
    nodeAbsolutePressureMmHg: {
      LA: values.laAbsolutePressureMmHg,
      LV: values.lvAbsolutePressureMmHg,
    },
    flowMlPerSec: {
      MV: values.mitralFlowMlPerSec,
      PVein_LA: values.pulmonaryVeinToLaFlowMlPerSec,
    },
    wallStressPa: { LA: { total: values.laTotalWallStressPa } },
    wallFiberLogStrain: { LA: values.laFiberLogStrain },
  } as unknown as MainWireNormalAdultFiveWallDiagnosticSampleV2;
}

function result(input: Readonly<{
  dtSec: number;
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[];
  periodic?: boolean;
  initialization?: "canonical" | "pven-to-pvein-10ml";
  requestedMaximumBeatCount?: number;
}>): MainWireNormalAdultFiveWallPeriodicResultV1 {
  const periodic = input.periodic ?? true;
  return {
    mode: "canonical",
    laSlsMode: "on",
    initialization: input.initialization ?? "canonical",
    requestedMaximumBeatCount: input.requestedMaximumBeatCount ?? 32,
    dtSec: input.dtSec,
    stepsPerBeat: input.samples.length,
    periodicSteadyStateClaimed: periodic,
    retainedCompleteBeats: [{
      beatIndex: 7,
      startTimeSec: 6,
      endTimeSec: 7,
      samples: input.samples,
    }],
  } as unknown as MainWireNormalAdultFiveWallPeriodicResultV1;
}
