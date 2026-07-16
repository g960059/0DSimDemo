import { describe, expect, it } from "vitest";

import type {
  MainWireNormalAdultFiveWallDiagnosticSampleV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import {
  compareMainWireNormalAdultFiveWallPeriodicOrbitsV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicOrbitComparisonV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

describe("main-wire normal-adult five-wall periodic orbit comparison V1", () => {
  it("compares fixed basin initializations at identical accepted indices only", () => {
    const primary = result({
      initialization: "canonical",
      samples: [sample(0.5), sample(0)],
    });
    const alternate = result({
      initialization: "pven-to-pvein-10ml",
      samples: [sample(0.5), sample(0)],
    });
    const comparison = compareMainWireNormalAdultFiveWallPeriodicOrbitsV1(
      primary,
      alternate,
    );

    expect(comparison.interpretable).toBe(true);
    expect(comparison.interpretabilityReasons).toEqual([]);
    expect(comparison.dtSec).toBe(0.5);
    expect(comparison.stepsPerBeat).toBe(2);
    expect(comparison.identicalAcceptedSampleMapping).toEqual([
      { acceptedSampleIndex: 0, cyclePhase01: 0.5 },
      { acceptedSampleIndex: 1, cyclePhase01: 0 },
    ]);
    for (const metric of Object.values(comparison.signalMetrics!)) {
      expect(metric.maximumAbsoluteDifference).toBe(0);
      expect(metric.fixedScaleNormalizedMaximumDifference).toBe(0);
      expect(metric.primaryReferencedRelativeL2Difference).toBe(0);
      expect(metric.symmetricRelativeL2Difference).toBe(0);
    }
    expect(comparison.initializationAudit).toMatchObject({
      canonicalTotalBloodVolumeDifferenceMl: 0,
      initializedTotalBloodVolumeDifferenceMl: 0,
      reportedWithinRunTotalBloodVolumeDifferenceMl: {
        primary: 0,
        alternate: 0,
      },
      transferredVolumeMl: { primary: 0, alternate: 10 },
    });
    expect(comparison.claim).toMatchObject({
      comparisonKind: "same-dt-same-grid-initialization-basin-difference",
      interpolationApplied: false,
      samePeriodicOrbitAcrossInitializationsClaimed: false,
      callerMustInterpretReportedDifferences: true,
      physiologicalOrNumericalPassThresholdApplied: false,
      parameterSearch: false,
    });
  });

  it("reports physical, fixed-scale, primary-referenced, and symmetric L2 differences", () => {
    const primary = result({
      initialization: "canonical",
      samples: [
        sample(0.5, { laBloodVolumeMl: 10 }),
        sample(0, { laBloodVolumeMl: 20 }),
      ],
    });
    const alternate = result({
      initialization: "pven-to-pvein-10ml",
      samples: [
        sample(0.5, { laBloodVolumeMl: 12 }),
        sample(0, { laBloodVolumeMl: 18 }),
      ],
    });
    const metric = compareMainWireNormalAdultFiveWallPeriodicOrbitsV1(
      primary,
      alternate,
    ).signalMetrics!.laBloodVolumeMl;

    expect(metric.maximumAbsoluteDifference).toBe(2);
    expect(metric.fixedScaleNormalizedMaximumDifference).toBe(0.02);
    expect(metric.primaryReferencedRelativeL2Difference)
      .toBeCloseTo(Math.sqrt(8 / 500), 14);
    expect(metric.symmetricRelativeL2Difference)
      .toBeCloseTo(Math.sqrt(8 / 484), 14);
    expect(metric.worstAcceptedSampleIndex).toBe(0);
    expect(metric.worstCyclePhase01).toBe(0.5);
    expect(metric.primaryValueAtWorstDifference).toBe(10);
    expect(metric.alternateValueAtWorstDifference).toBe(12);
  });

  it("does not interpret mismatched setup or a transient result", () => {
    const primary = result({
      initialization: "canonical",
      periodic: false,
      samples: [sample(0.5), sample(0)],
    });
    const alternate = result({
      initialization: "canonical",
      dtSec: 0.25,
      maximumBeatCount: 64,
      samples: [sample(0.25), sample(0.5), sample(0.75), sample(0)],
    });
    const comparison = compareMainWireNormalAdultFiveWallPeriodicOrbitsV1(
      primary,
      alternate,
    );

    expect(comparison.interpretable).toBe(false);
    expect(comparison.signalMetrics).toBeNull();
    expect(comparison.interpretabilityReasons).toEqual(expect.arrayContaining([
      "dt-mismatch",
      "steps-per-beat-mismatch",
      "initializations-must-differ",
      "alternate-initialization-must-be-fixed-pulmonary-redistribution",
      "maximum-beat-count-mismatch",
      "primary-period1-not-converged",
    ]));
    expect(comparison.claim.samePeriodicOrbitAcrossInitializationsClaimed)
      .toBe(false);
  });

  it("rejects protocol identity mismatches before comparing an orbit", () => {
    const primary = result({
      initialization: "canonical",
      protocolIdentityHash: "protocol-a",
      samples: [sample(0.5), sample(0)],
    });
    const alternate = result({
      initialization: "pven-to-pvein-10ml",
      protocolIdentityHash: "protocol-b",
      samples: [sample(0.5), sample(0)],
    });
    const comparison = compareMainWireNormalAdultFiveWallPeriodicOrbitsV1(
      primary,
      alternate,
    );

    expect(comparison.interpretable).toBe(false);
    expect(comparison.interpretabilityReasons)
      .toContain("protocol-identity-mismatch");
    expect(comparison.signalMetrics).toBeNull();
  });

  it("rejects reversed basin roles and phase-misaligned accepted indices", () => {
    const reversed = compareMainWireNormalAdultFiveWallPeriodicOrbitsV1(
      result({
        initialization: "pven-to-pvein-10ml",
        samples: [sample(0.5), sample(0)],
      }),
      result({
        initialization: "canonical",
        samples: [sample(0.5), sample(0)],
      }),
    );
    expect(reversed.interpretable).toBe(false);
    expect(reversed.interpretabilityReasons).toEqual(expect.arrayContaining([
      "primary-initialization-must-be-canonical",
      "alternate-initialization-must-be-fixed-pulmonary-redistribution",
    ]));

    const phaseMismatch = compareMainWireNormalAdultFiveWallPeriodicOrbitsV1(
      result({
        initialization: "canonical",
        samples: [sample(0.5), sample(0)],
      }),
      result({
        initialization: "pven-to-pvein-10ml",
        samples: [sample(0.51), sample(0)],
      }),
    );
    expect(phaseMismatch.interpretable).toBe(false);
    expect(phaseMismatch.interpretabilityReasons)
      .toContain("same-index-cycle-phase-mismatch");
    expect(phaseMismatch.identicalAcceptedSampleMapping).toEqual([]);
  });

  it("makes a zero primary L2 denominator explicit without losing the symmetric metric", () => {
    const primary = result({
      initialization: "canonical",
      samples: [
        sample(0.5, { mitralFlowMlPerSec: 0 }),
        sample(0, { mitralFlowMlPerSec: 0 }),
      ],
    });
    const alternate = result({
      initialization: "pven-to-pvein-10ml",
      samples: [
        sample(0.5, { mitralFlowMlPerSec: 2 }),
        sample(0, { mitralFlowMlPerSec: 2 }),
      ],
    });
    const metric = compareMainWireNormalAdultFiveWallPeriodicOrbitsV1(
      primary,
      alternate,
    ).signalMetrics!.mitralFlowMlPerSec;

    expect(metric.primaryReferencedRelativeL2Difference).toBeNull();
    expect(metric.symmetricRelativeL2Difference).toBeCloseTo(Math.sqrt(2), 14);
  });

  it("copies and exposes cross-result TBV audit differences without gating them", () => {
    const primary = result({
      initialization: "canonical",
      canonicalTotalBloodVolumeMl: 5000,
      initializedTotalBloodVolumeMl: 5000,
      samples: [sample(0.5), sample(0)],
    });
    const alternate = result({
      initialization: "pven-to-pvein-10ml",
      canonicalTotalBloodVolumeMl: 5001,
      initializedTotalBloodVolumeMl: 5002,
      samples: [sample(0.5), sample(0)],
    });
    const comparison = compareMainWireNormalAdultFiveWallPeriodicOrbitsV1(
      primary,
      alternate,
    );

    expect(comparison.interpretable).toBe(true);
    expect(comparison.initializationAudit.canonicalTotalBloodVolumeDifferenceMl)
      .toBe(1);
    expect(comparison.initializationAudit.initializedTotalBloodVolumeDifferenceMl)
      .toBe(2);
    expect(comparison.claim.physiologicalOrNumericalPassThresholdApplied)
      .toBe(false);
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
  initialization: "canonical" | "pven-to-pvein-10ml";
  samples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[];
  dtSec?: number;
  maximumBeatCount?: number;
  periodic?: boolean;
  canonicalTotalBloodVolumeMl?: number;
  initializedTotalBloodVolumeMl?: number;
  protocolIdentityHash?: string;
}>): MainWireNormalAdultFiveWallPeriodicResultV1 {
  const canonicalTotalBloodVolumeMl = input.canonicalTotalBloodVolumeMl ?? 5000;
  const initializedTotalBloodVolumeMl =
    input.initializedTotalBloodVolumeMl ?? canonicalTotalBloodVolumeMl;
  return {
    mode: "canonical",
    laSlsMode: "on",
    initialization: input.initialization,
    dtSec: input.dtSec ?? 0.5,
    stepsPerBeat: input.samples.length,
    requestedMaximumBeatCount: input.maximumBeatCount ?? 32,
    protocolIdentityHash: input.protocolIdentityHash ?? "same-protocol",
    periodicSteadyStateClaimed: input.periodic ?? true,
    retainedCompleteBeats: [{
      beatIndex: 7,
      startTimeSec: 6,
      endTimeSec: 7,
      samples: input.samples,
    }],
    initializationAudit: {
      canonicalTotalBloodVolumeMl,
      initializedTotalBloodVolumeMl,
      totalBloodVolumeDifferenceMl:
        initializedTotalBloodVolumeMl - canonicalTotalBloodVolumeMl,
      chamberVolumesChanged: false,
      dynamicEdgeFlowsChanged: false,
      valveOpeningStatesChanged: false,
      mechanicsColdInputChanged: false,
      mechanicsColdStateFingerprintChanged: false,
      transferredVolumeMl:
        input.initialization === "pven-to-pvein-10ml" ? 10 : 0,
      sourceNode: input.initialization === "pven-to-pvein-10ml" ? "PVen" : null,
      destinationNode:
        input.initialization === "pven-to-pvein-10ml" ? "PVein" : null,
      pulmonaryNodeVolumeDeltaMl: {
        PVen: input.initialization === "pven-to-pvein-10ml" ? -10 : 0,
        PVein: input.initialization === "pven-to-pvein-10ml" ? 10 : 0,
      },
    },
  } as unknown as MainWireNormalAdultFiveWallPeriodicResultV1;
}
