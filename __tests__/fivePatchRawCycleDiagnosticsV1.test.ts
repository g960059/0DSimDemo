import { describe, expect, it } from "vitest";

import type { NoAvpdFivePatchLandBenchSampleV1 } from
  "@/engine/mechanics2/benches/NoAvpdFivePatchLandTriSegBenchV1";
import type { FivePatchEnvelopeAcceptedStepSampleV1 } from
  "@/engine/mechanics2/envelope/FivePatchModelEnvelopeRunnerV1";
import { summarizeFivePatchRawCycleDiagnosticsV1 } from
  "@/engine/mechanics2/diagnostics/FivePatchRawCycleDiagnosticsV1";

describe("FivePatchRawCycleDiagnosticsV1", () => {
  it("uses ordered pressure crossings and activation to separate E and A without fitting", () => {
    const report = summarizeFivePatchRawCycleDiagnosticsV1(
      syntheticCycle(
        [0, 1, 6, 3, 1, 2, 5, 2, 0, 0],
        [-1, 1, 2, 2, 2, 2, 2, 1, -1, -1],
      ),
      0.6,
      { periodicityEstablished: true },
    );

    expect(report.availability).toBe("available");
    expect(report.gridContract?.endpointConvention).toBe(
      "right-closed-(0,1]",
    );
    expect(report.mitralInflow?.rawPeakTopology).toBe(
      "positive-local-maximum-on-each-side-of-Ca-anchor",
    );
    expect(report.mitralInflow?.ePeak).toMatchObject({
      phase01: 0.3,
      flowMlPerSec: 6,
    });
    expect(report.mitralInflow?.aPeak).toMatchObject({
      phase01: 0.7,
      flowMlPerSec: 5,
    });
    expect(report.mitralInflow?.eToAPeakRatio).toBeCloseTo(1.2, 12);
    expect(
      report.mitralInflow?.eRelativeProminenceFromInterpeakMinimum,
    ).toBeCloseTo(5 / 6, 12);
    expect(
      report.mitralInflow?.aRelativeProminenceFromInterpeakMinimum,
    ).toBeCloseTo(4 / 5, 12);
    expect(report.phaseSegments?.conduitGradientProxy.durationFraction)
      .toBeCloseTo(0.45, 12);
    expect(
      report.pressureWaves?.aPressurePeakToPreviousCycleXTroughDropMmHg,
    ).toBeCloseTo(3.3, 12);
    expect(
      report.pressureWaves?.previousCycleVPeakToYTroughDropMmHg,
    ).toBeCloseTo(1, 12);
    expect(
      report.pressureWaves?.prescribedCaAnchorToXTroughDropMmHg,
    ).toBeCloseTo(1.8, 12);
    expect(
      report.pressureWaves?.gradientOpeningProxyToYTroughDropMmHg,
    ).toBeCloseTo(0.5, 12);
    expect(report.scalarWinnerScoreComputed).toBe(false);
    expect(report.physiologyThresholdsApplied).toBe(false);
  });

  it("measures true self-intersecting A/v lobes and preserves signed orientation", () => {
    const report = summarizeFivePatchRawCycleDiagnosticsV1(
      envelopeFigureEightCycle(),
      0.6,
      { periodicityEstablished: true },
    );

    expect(report.availability).toBe("available");
    expect(report.leftAtrialPvLobes).toMatchObject({
      availability: "available",
      geometryEvidenceStatus: "raw-cycle-geometric-readback",
      steadyStateInterpretationEligible: true,
      steadyStateInterpretationUnavailableReason: null,
      physiologyAcceptanceApplied: false,
      measurementStatus: "measurable",
      measurementReason: "measurable",
      topologySource: "true-periodic-polyline-self-intersection",
      selfIntersectionCount: 1,
      aToVAbsoluteAreaRatioUnbounded: 1,
      opposedLobeOrientation: true,
    });
    expect(report.leftAtrialPvLobes?.trueSelfIntersection).toMatchObject({
      volumeMl: 70,
      pressureMmHg: 10,
      angleDeg: 90,
    });
    expect(report.leftAtrialPvLobes?.aLobe?.absoluteAreaMmHgMl).toBeCloseTo(1);
    expect(report.leftAtrialPvLobes?.vLobe?.absoluteAreaMmHgMl).toBeCloseTo(1);
    expect(
      (report.leftAtrialPvLobes?.aLobe?.signedAreaMmHgMl ?? 0) *
        (report.leftAtrialPvLobes?.vLobe?.signedAreaMmHgMl ?? 0),
    ).toBeLessThan(0);
  });

  it("retains cold-cycle geometric areas but blocks steady-state interpretation", () => {
    const explicitUnsteady = summarizeFivePatchRawCycleDiagnosticsV1(
      envelopeFigureEightCycle(),
      0.6,
      { periodicityEstablished: false },
    );
    const noPeriodicityStatus = summarizeFivePatchRawCycleDiagnosticsV1(
      envelopeFigureEightCycle(),
      0.6,
    );

    expect(explicitUnsteady.leftAtrialPvLobes).toMatchObject({
      availability: "available",
      measurementStatus: "measurable",
      steadyStateInterpretationEligible: false,
      steadyStateInterpretationUnavailableReason:
        "caller-reports-periodicity-not-established",
      physiologyAcceptanceApplied: false,
      aToVAbsoluteAreaRatioUnbounded: 1,
    });
    expect(
      explicitUnsteady.leftAtrialPvLobes?.vLobe?.absoluteAreaMmHgMl,
    ).toBeCloseTo(1);
    expect(noPeriodicityStatus.leftAtrialPvLobes).toMatchObject({
      measurementStatus: "measurable",
      steadyStateInterpretationEligible: false,
      steadyStateInterpretationUnavailableReason:
        "periodicity-status-not-provided",
    });
  });

  it("reports a non-self-intersecting raw LA PV path as not measurable", () => {
    const report = summarizeFivePatchRawCycleDiagnosticsV1(
      envelopeNonIntersectingCycle(),
      0.6,
      { periodicityEstablished: true },
    );

    expect(report.leftAtrialPvLobes).toMatchObject({
      availability: "available",
      measurementStatus: "not-measurable",
      measurementReason: "no-self-intersection",
      selfIntersectionCount: 0,
      trueSelfIntersection: null,
      aLobe: null,
      vLobe: null,
      aToVAbsoluteAreaRatioUnbounded: null,
      opposedLobeOrientation: false,
    });
  });

  it("reports fusion instead of inventing two resolved peaks", () => {
    const report = summarizeFivePatchRawCycleDiagnosticsV1(
      syntheticCycle(
        [0, 1, 2, 4, 6, 9, 8, 4, 0, 0],
        [-1, 1, 2, 2, 2, 2, 2, 1, -1, -1],
      ),
      0.6,
    );

    expect(report.availability).toBe("available");
    expect(report.mitralInflow?.rawPeakTopology).toBe(
      "positive-flow-spans-Ca-anchor-without-two-raw-local-maxima",
    );
    expect(report.mitralInflow?.eToAPeakRatio).toBeNull();
    expect(report.cycleClosure?.periodicityEstablished).toBe(false);
    expect(report.pressureWaves?.xTrough).toBeNull();
  });

  it("keeps missing valve topology unavailable rather than scoring morphology", () => {
    const report = summarizeFivePatchRawCycleDiagnosticsV1(
      syntheticCycle(
        [0, 1, 2, 3, 2, 1, 2, 3, 1, 0],
        Array(10).fill(-1),
      ),
      0.6,
    );

    expect(report.availability).toBe("unavailable");
    expect(report.unavailableReason).toBe(
      "missing-ordered-gradient-up-Ca-event-gradient-down-anchors",
    );
    expect(report.mitralInflow).toBeNull();
  });

  it("retains true geometric lobes when valve-event anchors are unavailable", () => {
    const report = summarizeFivePatchRawCycleDiagnosticsV1(
      envelopeFigureEightCycle().map((sample) => ({
        ...sample,
        pressuresMmHg: {
          ...sample.pressuresMmHg,
          leftVentricleMmHg: sample.pressuresMmHg.leftAtriumMmHg + 1,
        },
      })),
      0.6,
      { periodicityEstablished: true },
    );

    expect(report.availability).toBe("unavailable");
    expect(report.unavailableReason).toBe(
      "missing-ordered-gradient-up-Ca-event-gradient-down-anchors",
    );
    expect(report.mitralInflow).toBeNull();
    expect(report.leftAtrialPvLobes).toMatchObject({
      availability: "available",
      measurementStatus: "measurable",
      steadyStateInterpretationEligible: true,
      topologySource: "true-periodic-polyline-self-intersection",
      aToVAbsoluteAreaRatioUnbounded: 1,
      opposedLobeOrientation: true,
    });
  });

  it("rejects duplicate 0/1 endpoints and a nonuniform incomplete grid", () => {
    const base = syntheticCycle(
      [0, 1, 6, 3, 1, 2, 5, 2, 0, 0],
      [-1, 1, 2, 2, 2, 2, 2, 1, -1, -1],
    );
    const duplicateBoundary = base.map((sample, index) => ({
      ...sample,
      phase01: index / (base.length - 1),
    })) as readonly NoAvpdFivePatchLandBenchSampleV1[];
    expect(
      summarizeFivePatchRawCycleDiagnosticsV1(duplicateBoundary, 0.6)
        .unavailableReason,
    ).toBe("duplicate-cycle-boundary-endpoints-zero-and-one");

    const nonuniform = base.map((sample, index) => index === 4
      ? { ...sample, phase01: sample.phase01 + 0.025 }
      : sample
    ) as readonly NoAvpdFivePatchLandBenchSampleV1[];
    expect(
      summarizeFivePatchRawCycleDiagnosticsV1(nonuniform, 0.6)
        .unavailableReason,
    ).toBe("nonuniform-or-incomplete-cycle-phase-grid");

    const nonuniformTime = base.map((sample, index) => index === 4
      ? { ...sample, timeSec: sample.timeSec + 0.025 }
      : sample
    ) as readonly NoAvpdFivePatchLandBenchSampleV1[];
    expect(
      summarizeFivePatchRawCycleDiagnosticsV1(nonuniformTime, 0.6)
        .unavailableReason,
    ).toBe("nonuniform-cycle-time-grid");
  });

  it("discloses multiple gradient crossings and the protocol-anchor selection rule", () => {
    const report = summarizeFivePatchRawCycleDiagnosticsV1(
      syntheticCycle(
        [0, 1, 6, 3, 1, 2, 5, 2, 0, 0],
        [-1, 1, -1, 1, 2, 2, 2, 1, -1, -1],
      ),
      0.6,
    );

    expect(report.availability).toBe("available");
    expect(report.events?.selectionStatus).toBe(
      "multiple-crossings-protocol-anchor-selection",
    );
    expect(
      report.events?.eventCounts.lapMinusLvpGradientUpCrossings,
    ).toBeGreaterThan(1);
  });
});

function syntheticCycle(
  mitralFlowMlPerSec: readonly number[],
  laMinusLvMmHg: readonly number[],
): readonly NoAvpdFivePatchLandBenchSampleV1[] {
  return mitralFlowMlPerSec.map((flow, index) => {
    const phase01 = (index + 1) / mitralFlowMlPerSec.length;
    const laPressure = [7.2, 6.2, 6.8, 7.5, 8.3, 9, 10.5, 9.2, 7.5, 8.5][index]!;
    const laVolume = 70 - 8 * Math.sin(Math.PI * phase01) +
      (phase01 >= 0.6 ? -20 * (phase01 - 0.6) : 0);
    return {
      timeSec: phase01,
      beatIndex: 0,
      phase01,
      volumesMl: {
        leftAtriumMl: laVolume,
        leftVentricleMl: 120 - 25 * Math.cos(2 * Math.PI * phase01),
        systemicArteryMl: 700,
        systemicVeinMl: 3_000,
        rightAtriumMl: 60 + 4 * Math.sin(2 * Math.PI * phase01),
        rightVentricleMl: 120 - 20 * Math.cos(2 * Math.PI * phase01),
        pulmonaryArteryMl: 180,
        pulmonaryVeinMl: 650,
      },
      pressuresMmHg: {
        leftAtriumMmHg: laPressure,
        leftVentricleMmHg: laPressure - laMinusLvMmHg[index]!,
        systemicArteryMmHg: 90,
        systemicVeinMmHg: 5,
        rightAtriumMmHg: 3,
        rightVentricleMmHg: 2,
        pulmonaryArteryMmHg: 15,
        pulmonaryVeinMmHg: 9,
      },
      flowsMlPerSec: {
        mitralMlPerSec: flow,
        aorticMlPerSec: 0,
        systemicPeripheralMlPerSec: 80,
        systemicVenousMlPerSec: 80,
        tricuspidMlPerSec: 0,
        pulmonaryValveMlPerSec: 0,
        pulmonaryPeripheralMlPerSec: 80,
        pulmonaryVenousMlPerSec: 80,
      },
      walls: {},
      numeric: {
        globalIterations: 1,
        globalMaxScaledResidual: 0,
        globalLineSearchBacktracks: 0,
        triSegIterations: 1,
        triSegFunctionEvaluations: 1,
        triSegRelativeResidual: 0,
        totalBloodVolumeResidualMl: 0,
      },
    } as unknown as NoAvpdFivePatchLandBenchSampleV1;
  });
}

function envelopeFigureEightCycle(): readonly FivePatchEnvelopeAcceptedStepSampleV1[] {
  const volumesMl = [71, 69, 71, 69];
  const pressuresMmHg = [11, 11, 9, 9];
  const laMinusLvMmHg = [1, 2, -1, -1];
  const activations01 = [1, 1, 0, 0];
  return volumesMl.map((leftAtriumMl, index) => {
    const phase01 = (index + 1) / volumesMl.length;
    const leftAtriumMmHg = pressuresMmHg[index]!;
    return {
      acceptedStepIndex: index + 1,
      timeSec: phase01,
      phase01,
      volumesMl: {
        leftAtriumMl,
        leftVentricleMl: 120,
        systemicArteryMl: 700,
        systemicVeinMl: 3_000,
        rightAtriumMl: 60,
        rightVentricleMl: 120,
        pulmonaryArteryMl: 180,
        pulmonaryVeinMl: 650,
      },
      pressuresMmHg: {
        leftAtriumMmHg,
        leftVentricleMmHg:
          leftAtriumMmHg - laMinusLvMmHg[index]!,
        systemicArteryMmHg: 90,
        systemicVeinMmHg: 5,
        rightAtriumMmHg: 3,
        rightVentricleMmHg: 2,
        pulmonaryArteryMmHg: 15,
        pulmonaryVeinMmHg: 9,
      },
      flowsMlPerSec: {
        mitralMlPerSec: [1, 2, 1, 0][index]!,
        aorticMlPerSec: 0,
        systemicPeripheralMlPerSec: 80,
        systemicVenousMlPerSec: 80,
        tricuspidMlPerSec: 0,
        pulmonaryValveMlPerSec: 0,
        pulmonaryPeripheralMlPerSec: 80,
        pulmonaryVenousMlPerSec: 80,
      },
      freeCalciumUm: { leftAtrium: 0.1 },
      activations01: { leftAtrium: activations01[index]! },
      reportOnlyMechanismReadback: {
        leftAtrium: {
          fiberLogStrain: 0,
          fiberLogStrainBackwardDifferenceRatePerSec: 0,
          pressureComponentsMmHg: {
            equilibriumPassiveMmHg: leftAtriumMmHg,
            effectiveLandActiveMmHg: 0,
            slsOverstressMmHg: 0,
            totalMmHg: leftAtriumMmHg,
            componentSumMinusTotalMmHg: 0,
          },
        },
        mitralValve: {
          pressureGradientMmHg: laMinusLvMmHg[index]!,
          openFraction01: laMinusLvMmHg[index]! > 0 ? 1 : 0,
        },
        leftVentricularPressureBackwardDifferenceRateMmHgPerSec: 0,
        leftVentricularPressureDecayRatePositiveMmHgPerSec: 0,
      },
      totalBloodVolumeResidualMl: 0,
    };
  });
}

function envelopeNonIntersectingCycle(): readonly FivePatchEnvelopeAcceptedStepSampleV1[] {
  const leftAtriumVolumesMl = [71, 71, 69, 69];
  const leftAtriumPressuresMmHg = [9, 11, 11, 9];
  return envelopeFigureEightCycle().map((sample, index) => {
    const pressureGradient = sample.pressuresMmHg.leftAtriumMmHg -
      sample.pressuresMmHg.leftVentricleMmHg;
    const leftAtriumMmHg = leftAtriumPressuresMmHg[index]!;
    return {
      ...sample,
      volumesMl: {
        ...sample.volumesMl,
        leftAtriumMl: leftAtriumVolumesMl[index]!,
      },
      pressuresMmHg: {
        ...sample.pressuresMmHg,
        leftAtriumMmHg,
        leftVentricleMmHg: leftAtriumMmHg - pressureGradient,
      },
    };
  });
}
