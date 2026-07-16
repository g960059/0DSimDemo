import { describe, expect, it } from "vitest";

import {
  FIVE_PATCH_FILLING_RELAXATION_GATE_POLICY_V1,
  summarizeFivePatchFillingRelaxationDiagnosticsV1,
  type FivePatchBroadOperatingPointBoundsV1,
  type FivePatchFillingRelaxationDiagnosticSampleV1,
} from "@/engine/mechanics2/diagnostics/FivePatchFillingRelaxationDiagnosticsV1";

const BROAD_BOUNDS: FivePatchBroadOperatingPointBoundsV1 = {
  leftAtrialPressureMmHg: { minimum: -3, maximum: 30 },
  leftVentricularPeakPressureMmHg: { minimum: 80, maximum: 200 },
  aorticPressureMmHg: { minimum: 45, maximum: 180 },
  cardiacOutputLPerMin: { minimum: 3, maximum: 8 },
  leftVentricularEjectionFraction: { minimum: 0.4, maximum: 0.75 },
  pulmonaryVeinPressureMmHg: { minimum: 0.1, maximum: 40 },
  valveReverseFlow: {
    valveIds: ["MV", "AoV", "TV", "PV"],
    maximumReverseVolumeMl: {
      absoluteFloorMl: 1,
      forwardVolumeFraction: 0.05,
    },
  },
};

describe("FivePatchFillingRelaxationDiagnosticsV1", () => {
  it("reports broad operating point, filling waves, phasic volumes, and a valid tau fit", () => {
    const diagnostics = summarize(physiologicalSyntheticCycle());

    expect(diagnostics.availability).toBe("available");
    expect(diagnostics.numericalEligibility.eligible).toBe(true);
    expect(diagnostics.broadOperatingPointEligibility.eligible).toBe(true);
    expect(diagnostics.eligibility).toMatchObject({
      eligible: true,
      detailedPhysiologyUsed: false,
      leftAtrialVLoopUsed: false,
    });
    expect(diagnostics.operatingPoint!.leftVentricle).toMatchObject({
      endDiastolicVolumeProxyMl: 120,
      endSystolicVolumeProxyMl: 50,
      strokeVolumeProxyMl: 70,
    });
    expect(
      diagnostics.operatingPoint!.leftVentricle.ejectionFractionProxy01,
    ).toBeCloseTo(70 / 120, 10);
    expect(diagnostics.operatingPoint!.cardiacOutputLPerMin).toBeGreaterThan(3);
    expect(diagnostics.operatingPoint!.cardiacOutputLPerMin).toBeLessThan(8);

    const reportOnly = diagnostics.detailedPhysiologyReportOnly!;
    expect(reportOnly.affectsEligibility).toBe(false);
    expect(reportOnly.mitral.ePeakMlPerSec).toBeGreaterThan(
      reportOnly.mitral.aPeakMlPerSec!,
    );
    expect(reportOnly.mitral.interpeakValleyMlPerSec).toBeLessThan(
      reportOnly.mitral.aPeakMlPerSec!,
    );
    expect(reportOnly.mitral.positiveFlowTimeIntegralMl).toBeGreaterThan(0);
    expect(reportOnly.mitral.velocityTimeIntegral).toEqual({
      availability: "unavailable-flow-is-not-velocity",
      valueCm: null,
    });
    expect(reportOnly.pulmonaryVenous.availability).toBe(
      "available-total-pulmonary-venous-flow",
    );
    expect(reportOnly.pulmonaryVenous.sPeakMlPerSec).toBeGreaterThan(0);
    expect(reportOnly.pulmonaryVenous.dPeakMlPerSec).toBeGreaterThan(0);
    expect(reportOnly.pulmonaryVenous.arPeakMlPerSec).toBeLessThan(0);
    expect(reportOnly.leftAtrialPhasicVolumes).toMatchObject({
      availability: "available",
      reservoirFillingMl: 30,
      conduitEmptyingMl: 15,
      pumpEmptyingMl: 15,
    });
    expect(reportOnly.lvRelaxation.freeAsymptoteFit.validity).toBe("valid");
    expect(reportOnly.lvRelaxation.freeAsymptoteFit.searchBoundaryHit).toBeNull();
    expect(reportOnly.lvRelaxation.preferredTauSec).toBeCloseTo(0.0731, 2);
    expect(reportOnly.lvRelaxation.mvoPressureMmHg.gradient).toBeCloseTo(0, 8);
    expect(reportOnly.mitral.ePeakToInterpeakValleySec).toBeGreaterThan(0);
    expect(reportOnly.mitral.eDecelerationSlopeProxyMlPerSec2).toBeGreaterThan(0);
  });

  it("computes a strict monotone reservoir-minus-conduit matched-volume gap", () => {
    const diagnostics = summarize(physiologicalSyntheticCycle());
    const matched = diagnostics.leftAtrialVLoopReportOnly.strictMatchedVolume!;

    expect(diagnostics.leftAtrialVLoopReportOnly.affectsEligibility).toBe(false);
    expect(matched).toMatchObject({
      availability: "available",
      affectsEligibility: false,
      gapDefinition: "reservoir-minus-conduit",
      reservoirMonotonicity: { strict: true },
      conduitMonotonicity: { strict: true },
      overlapVolumeMl: 15,
    });
    expect(matched.gapMmHg!.mean).toBeGreaterThan(0);
    expect(matched.gapMmHg!.positiveFraction01).toBe(1);
    expect(matched.integratedGapMmHgMl).toBeCloseTo(6, 8);
    expect(matched.normalizedOverlapWidth01).toBeCloseTo(0.5, 10);
    expect(matched.normalizedMeanGap).toBeGreaterThan(0);
    expect(matched.normalizedIntegratedGap).toBeGreaterThan(0);
  });

  it("marks any nonmonotone branch ambiguous and never uses it for eligibility", () => {
    const baseline = summarize(physiologicalSyntheticCycle());
    const nonmonotone = physiologicalSyntheticCycle().map((sample) =>
      Math.abs(sample.phase01 - 0.2) < 1e-12
        ? {
            ...sample,
            volumesMl: {
              ...sample.volumesMl,
              leftAtriumMl: sample.volumesMl.leftAtriumMl - 2,
            },
          }
        : sample
    );
    const diagnostics = summarize(nonmonotone);
    const matched = diagnostics.leftAtrialVLoopReportOnly.strictMatchedVolume!;

    expect(matched.availability).toBe("ambiguous-nonmonotone-branch");
    expect(matched.ambiguityReasons).toContain(
      "reservoir-not-strictly-increasing",
    );
    expect(matched.gapMmHg).toBeNull();
    expect(matched.normalizedMeanGap).toBeNull();
    expect(matched.integratedGapMmHgMl).toBeNull();
    expect(diagnostics.eligibility.eligible).toBe(
      baseline.eligibility.eligible,
    );
    expect(diagnostics.eligibility.leftAtrialVLoopUsed).toBe(false);
  });

  it("keeps broad operating-point failure separate from report-only morphology", () => {
    const diagnostics = summarize(physiologicalSyntheticCycle(), {
      ...BROAD_BOUNDS,
      cardiacOutputLPerMin: { minimum: 7, maximum: 8 },
    });

    expect(diagnostics.numericalEligibility.eligible).toBe(true);
    expect(diagnostics.broadOperatingPointEligibility.eligible).toBe(false);
    expect(diagnostics.eligibility.eligible).toBe(false);
    expect(diagnostics.eligibility.inputs).toEqual([
      "numerical",
      "broad-operating-point",
    ]);
    expect(FIVE_PATCH_FILLING_RELAXATION_GATE_POLICY_V1)
      .toMatchObject({
        reportOnlyExcludedFromEligibility: [
          "detailed-physiology",
          "left-atrial-v-loop",
        ],
        scalarWinnerScoreAllowed: false,
      });
  });

  it("evaluates broad operating point without event anchors or a diagnostics-owned periodicity gate", () => {
    const noMitralOpening = physiologicalSyntheticCycle().map((sample) => ({
      ...sample,
      pressuresMmHg: {
        ...sample.pressuresMmHg,
        leftVentricleMmHg: Math.max(
          sample.pressuresMmHg.leftVentricleMmHg,
          sample.pressuresMmHg.leftAtriumMmHg + 1,
        ),
      },
    }));
    const diagnostics = summarizeFivePatchFillingRelaxationDiagnosticsV1(
      noMitralOpening,
      0.75,
      {
        periodicityEstablished: false,
        numericalEligibility: {
          eligible: true,
          source: "readiness-phase-no-periodicity-required",
        },
        broadOperatingPointBounds: BROAD_BOUNDS,
      },
    );

    expect(diagnostics.rawCycleDiagnostics.availability).toBe("unavailable");
    expect(diagnostics.availability).toBe("available-operating-point-only");
    expect(diagnostics.operatingPoint).not.toBeNull();
    expect(diagnostics.broadOperatingPointEligibility.eligible).toBe(true);
    expect(diagnostics.numericalEligibility.eligible).toBe(true);
    expect(diagnostics.eligibility.eligible).toBe(true);
    expect(diagnostics.detailedPhysiologyReportOnly).toBeNull();
    expect(
      diagnostics.leftAtrialVLoopReportOnly.strictMatchedVolume,
    ).toBeNull();
  });

  it("suppresses cross-boundary detailed readbacks when periodicity is not established", () => {
    const diagnostics = summarizeFivePatchFillingRelaxationDiagnosticsV1(
      physiologicalSyntheticCycle(),
      0.75,
      {
        periodicityEstablished: false,
        numericalEligibility: {
          eligible: true,
          source: "readiness-phase-no-periodicity-required",
        },
        broadOperatingPointBounds: BROAD_BOUNDS,
      },
    );

    expect(diagnostics.rawCycleDiagnostics.availability).toBe("available");
    expect(diagnostics.broadOperatingPointEligibility.eligible).toBe(true);
    expect(diagnostics.eligibility.eligible).toBe(true);
    expect(diagnostics.detailedPhysiologyUnavailableReason).toBe(
      "caller-reports-periodicity-not-established",
    );
    expect(diagnostics.detailedPhysiologyReportOnly).toBeNull();
    expect(
      diagnostics.leftAtrialVLoopReportOnly.strictMatchedVolume,
    ).toBeNull();
  });

  it("does not let NaN report-only PV-flow or velocity channels reject broad eligibility", () => {
    const reportOnlyNaN = physiologicalSyntheticCycle().map((sample) => ({
      ...sample,
      flowsMlPerSec: {
        ...sample.flowsMlPerSec,
        pulmonaryVenousMlPerSec: Number.NaN,
      },
      velocitiesCmPerSec: { mitral: Number.NaN },
    }));
    const diagnostics = summarize(reportOnlyNaN);

    expect(diagnostics.rawCycleDiagnostics.availability).toBe("unavailable");
    expect(diagnostics.numericalEligibility.operatingPointCycleAvailable).toBe(
      true,
    );
    expect(diagnostics.broadOperatingPointEligibility.eligible).toBe(true);
    expect(diagnostics.eligibility.eligible).toBe(true);
    expect(diagnostics.detailedPhysiologyReportOnly).toBeNull();
  });

  it("does not promote a free-asymptote tau fit pinned to its search boundary", () => {
    const linearPressureFall = physiologicalSyntheticCycle().map((sample) => {
      if (!(sample.phase01 > 0.2 && sample.phase01 < 0.5)) return sample;
      return {
        ...sample,
        pressuresMmHg: {
          ...sample.pressuresMmHg,
          leftVentricleMmHg:
            101 - ((101 - 2.65) * (sample.phase01 - 0.2)) / 0.3,
        },
      };
    });
    const diagnostics = summarize(linearPressureFall);
    const relaxation = diagnostics.detailedPhysiologyReportOnly!.lvRelaxation;

    expect(relaxation.freeAsymptoteFit.searchBoundaryHit).toBe("lower");
    expect(relaxation.freeAsymptoteFit.validity).toBe(
      "asymptote-search-boundary-hit",
    );
    expect(relaxation.preferredTauSec).toBeNull();
  });
});

function summarize(
  samples: readonly FivePatchFillingRelaxationDiagnosticSampleV1[],
  broadOperatingPointBounds = BROAD_BOUNDS,
) {
  return summarizeFivePatchFillingRelaxationDiagnosticsV1(samples, 0.75, {
    periodicityEstablished: true,
    numericalEligibility: {
      eligible: true,
      source: "synthetic-structural-gates",
    },
    broadOperatingPointBounds,
  });
}

function physiologicalSyntheticCycle(): readonly FivePatchFillingRelaxationDiagnosticSampleV1[] {
  const count = 100;
  return Array.from({ length: count }, (_, index) => {
    const phase01 = index / count;
    const laVolume = leftAtrialVolume(phase01);
    const laPressure = leftAtrialPressure(phase01, laVolume);
    const lvPressure = leftVentricularPressure(phase01, laPressure);
    const mv =
      phase01 >= 0.5 && phase01 <= 0.9
        ? 5 +
          295 * gaussian(phase01, 0.58, 0.035) +
          195 * gaussian(phase01, 0.82, 0.035)
        : 0;
    const pulmonaryVenous =
      20 +
      100 * gaussian(phase01, 0.25, 0.08) +
      75 * gaussian(phase01, 0.6, 0.06) -
      70 * gaussian(phase01, 0.82, 0.035);
    return {
      timeSec: phase01,
      phase01,
      volumesMl: {
        leftAtriumMl: laVolume,
        leftVentricleMl: leftVentricularVolume(phase01),
        rightAtriumMl: 55 + 8 * Math.sin(2 * Math.PI * phase01),
        rightVentricleMl: 105 - 40 * Math.cos(2 * Math.PI * phase01),
      },
      pressuresMmHg: {
        leftAtriumMmHg: laPressure,
        leftVentricleMmHg: lvPressure,
        systemicArteryMmHg: 100 + 20 * Math.sin(2 * Math.PI * phase01),
        systemicVeinMmHg: 5,
        rightAtriumMmHg: 3 + Math.sin(2 * Math.PI * phase01),
        rightVentricleMmHg: 12 + 10 * Math.max(0, Math.sin(2 * Math.PI * phase01)),
        pulmonaryArteryMmHg: 15 + 5 * Math.sin(2 * Math.PI * phase01),
        pulmonaryVeinMmHg: 10 + 2 * Math.sin(2 * Math.PI * phase01),
      },
      flowsMlPerSec: {
        mitralMlPerSec: mv,
        aorticMlPerSec:
          phase01 >= 0.05 && phase01 < 0.45 ? 175 : 0,
        systemicPeripheralMlPerSec: 70,
        systemicVenousMlPerSec: 70,
        tricuspidMlPerSec:
          phase01 >= 0.5 && phase01 < 0.9 ? 175 : 0,
        pulmonaryValveMlPerSec:
          phase01 >= 0.05 && phase01 < 0.45 ? 175 : 0,
        pulmonaryPeripheralMlPerSec: 70,
        pulmonaryVenousMlPerSec: pulmonaryVenous,
      },
    };
  });
}

function leftAtrialVolume(phase: number): number {
  if (phase >= 0.9) return 50 + 50 * (phase - 0.9);
  if (phase <= 0.5) return 55 + 50 * phase;
  if (phase <= 0.75) return 80 - 60 * (phase - 0.5);
  return 65 - 100 * (phase - 0.75);
}

function leftAtrialPressure(phase: number, volume: number): number {
  const equilibrium = 1 + 0.055 * (volume - 50);
  if (phase > 0.5 && phase <= 0.75) {
    const gap = 0.8 * (80 - volume) / 15;
    return equilibrium - gap;
  }
  if (phase > 0.75 && phase < 0.9) {
    return equilibrium + 4 * Math.sin(Math.PI * (phase - 0.75) / 0.15);
  }
  return equilibrium;
}

function leftVentricularPressure(phase: number, laPressure: number): number {
  if (Math.abs(phase - 0.5) < 1e-12 || Math.abs(phase - 0.9) < 1e-12) {
    return laPressure;
  }
  if (phase > 0.5 && phase < 0.9) return laPressure - 3;
  if (phase > 0.2 && phase < 0.5) {
    return 1 + 100 * Math.exp(-(phase - 0.2) / 0.0731);
  }
  if (phase <= 0.2) return 20 + 81 * phase / 0.2;
  return laPressure + 10 * (phase - 0.9) / 0.1;
}

function leftVentricularVolume(phase: number): number {
  if (phase < 0.4) return 120 - 70 * phase / 0.4;
  if (phase < 0.9) return 50 + 70 * (phase - 0.4) / 0.5;
  return 120;
}

function gaussian(
  value: number,
  centre: number,
  width: number,
): number {
  return Math.exp(-0.5 * ((value - centre) / width) ** 2);
}
