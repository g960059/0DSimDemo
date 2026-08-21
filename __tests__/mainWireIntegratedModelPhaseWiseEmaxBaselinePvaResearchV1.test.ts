import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicFiveWallMechanicalPortLedgerDtCharacterizationV1";
import {
  analyzeMainWireIntegratedModelPhaseWiseEmaxBaselinePvaResearchV1,
  type MainWireIntegratedModelPhaseWiseEmaxBaselinePvaResearchV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPhaseWiseEmaxBaselinePvaResearchV1";
import type { MainWireIntegratedModelPvaDiastolicReferenceComparisonV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelPvaDiastolicReferenceComparisonV1";
import type { MainWireIntegratedModelTransientPvRawBeatV1 } from "@/engine/myocardium/experiments/MainWireIntegratedModelTransientVenousReturnReductionPureV1";

describe("phase-wise Emax and baseline PVA research V1", () => {
  it("selects the maximum positive isochronal slope and keeps release diagnostic", () => {
    const result = manufacturedResultV1();

    expect(result.phaseFits).toHaveLength(256);
    expect(result.candidates).toHaveLength(2);
    expect(
      result.candidates.map((candidate) => ({
        ventricleId: candidate.ventricleId,
        phaseIndex: candidate.selectedPhaseIndex,
        releasePhaseIndex: candidate.releasePeak.phaseIndex,
      })),
    ).toEqual([
      { ventricleId: "LV", phaseIndex: 20, releasePhaseIndex: 20 },
      { ventricleId: "RV", phaseIndex: 24, releasePhaseIndex: 24 },
    ]);
    expect(
      result.candidates.every(
        (candidate) =>
          candidate.selectedRelation.slopeMmHgPerMl > 0 &&
          candidate.peakPhaseDifferenceSamples === 0,
      ),
    ).toBe(true);
  });

  it("reselects the same phase after each occlusion beat is omitted", () => {
    const result = manufacturedResultV1();

    for (const candidate of result.candidates) {
      expect(candidate.leaveOneBeatOut.outcomes).toHaveLength(11);
      expect(
        candidate.leaveOneBeatOut.allSelectedPhasesWithinOneSampleOfFullFit,
      ).toBe(true);
      expect(candidate.leaveOneBeatOut.minimumSelectedPhaseIndex).toBe(
        candidate.selectedPhaseIndex,
      );
      expect(candidate.leaveOneBeatOut.maximumSelectedPhaseIndex).toBe(
        candidate.selectedPhaseIndex,
      );
    }
  });

  it("uses periodic ledger work rather than synthetic transient closure", () => {
    const result = manufacturedResultV1();
    const LV = result.baselinePva.find(
      ({ ventricleId }) => ventricleId === "LV",
    )!;
    const RV = result.baselinePva.find(
      ({ ventricleId }) => ventricleId === "RV",
    )!;

    expect(LV.periodicExternalWorkJ).toBe(1.25);
    expect(RV.periodicExternalWorkJ).toBe(0.42);
    expect(LV.externalWorkSource).toBe(
      "periodic-1ms-five-wall-mechanical-ledger",
    );
    expect(
      result.interpretation.syntheticStraightClosureUsedAsExternalWork,
    ).toBe(false);
    expect(LV.reportedPressureVolumeAreaJ).toBeCloseTo(
      LV.periodicExternalWorkJ + LV.reportedPotentialEnergyJ!,
      14,
    );
  });

  it("keeps a finite extrapolation-dependent result distinct from a supported PVA", () => {
    const result = manufacturedResultV1();

    expect(result.summary).toMatchObject({
      domainSupportedBaselinePvaCount: 0,
      extrapolationDependentBaselinePvaCount: 2,
      unavailableBaselinePvaCount: 0,
    });
    for (const row of result.baselinePva) {
      expect(row.status).toBe("extrapolation-dependent-baseline-pva");
      expect(row.supportedIntersectionVolumeMl).toBeNull();
      expect(row.extrapolatedPotentialEnergyJ).toBeGreaterThan(0);
      expect(row.systolicLineAreaOutsideMeasuredRangeFraction).toBeGreaterThan(
        0,
      );
      expect(row.potentialEnergyBasis).toBe(
        "extrapolated-systolic-volume-axis-intercept",
      );
    }
  });

  it("does not promote the manufactured research result", () => {
    expect(manufacturedResultV1().interpretation).toEqual({
      operationalEmaxEstablished: false,
      genericPvaEstablished: false,
      baselineResearchPvaComputed: true,
      transientBeatPvaComputed: false,
      syntheticStraightClosureUsedAsExternalWork: false,
      crossArtifactSourceIdentityEstablished: false,
      productionOutputEstablished: false,
      oxygenConsumptionEstablished: false,
    });
  });

  it("retains the compact normal-adult research result", () => {
    const result = JSON.parse(
      readFileSync(
        join(
          process.cwd(),
          "artifacts/transient-preload/phase-wise-emax-baseline-pva-research-v1.json",
        ),
        "utf8",
      ),
    ) as MainWireIntegratedModelPhaseWiseEmaxBaselinePvaResearchV1;

    expect(result.summary).toEqual({
      phaseFitCount: 256,
      candidateCount: 2,
      domainSupportedBaselinePvaCount: 0,
      extrapolationDependentBaselinePvaCount: 2,
      unavailableBaselinePvaCount: 0,
      allLeaveOneOutPeakPhasesStableWithinOneSample: true,
      maximumPeakPhaseDifferenceSamples: 1,
    });
    expect(
      result.candidates.map((candidate) => ({
        ventricleId: candidate.ventricleId,
        phaseIndex: candidate.selectedPhaseIndex,
        slope: candidate.selectedRelation.slopeMmHgPerMl,
        v0: candidate.selectedRelation.volumeAxisInterceptMl,
      })),
    ).toEqual([
      {
        ventricleId: "LV",
        phaseIndex: 8,
        slope: 1.7997034535053218,
        v0: 15.193248153119717,
      },
      {
        ventricleId: "RV",
        phaseIndex: 7,
        slope: 0.4651694927806835,
        v0: 13.39842031010182,
      },
    ]);
    expect(
      result.baselinePva.map((row) => ({
        ventricleId: row.ventricleId,
        pvaJ: row.reportedPressureVolumeAreaJ,
        extrapolationFraction: row.systolicLineAreaOutsideMeasuredRangeFraction,
      })),
    ).toEqual([
      {
        ventricleId: "LV",
        pvaJ: 1.581500908199982,
        extrapolationFraction: 0.4518868571139322,
      },
      {
        ventricleId: "RV",
        pvaJ: 0.5884018254881368,
        extrapolationFraction: 0.12489082104389465,
      },
    ]);
  });

  it("rejects a second passive crossing as an energetic upper boundary", () => {
    const result =
      analyzeMainWireIntegratedModelPhaseWiseEmaxBaselinePvaResearchV1(
        manufacturedBeatsV1(),
        manufacturedLedgerV1(),
        manufacturedPassiveComparisonWithSecondCrossingV1(),
      );
    const LV = result.baselinePva.find(
      ({ ventricleId }) => ventricleId === "LV",
    )!;

    expect(LV.supportedIntersectionVolumeMl).not.toBeNull();
    expect(LV.supportedPotentialEnergyJ).toBeNull();
    expect(LV.status).not.toBe("domain-supported-baseline-pva");
    expect(LV.reasons).toContain(
      "systolic line does not remain above the passive reference after intersection",
    );
  });
});

function manufacturedResultV1(): MainWireIntegratedModelPhaseWiseEmaxBaselinePvaResearchV1 {
  return analyzeMainWireIntegratedModelPhaseWiseEmaxBaselinePvaResearchV1(
    manufacturedBeatsV1(),
    manufacturedLedgerV1(),
    manufacturedPassiveComparisonV1(),
  );
}

function manufacturedBeatsV1(): readonly MainWireIntegratedModelTransientPvRawBeatV1[] {
  return Object.freeze(
    Array.from({ length: 21 }, (_, beatIndex) => {
      const beatOrdinal = beatIndex + 1;
      const loadIndex = beatOrdinal <= 11 ? beatOrdinal - 1 : 21 - beatOrdinal;
      const startTimeSec = beatIndex;
      const endTimeSec = beatIndex + 1;
      return Object.freeze({
        beatOrdinal,
        startTimeSec,
        endTimeSec,
        samples: Object.freeze(
          Array.from({ length: 65 }, (_, sampleIndex) => {
            const phaseIndex = sampleIndex === 64 ? 0 : sampleIndex;
            const phase01 = sampleIndex / 64;
            return Object.freeze({
              timeSec: startTimeSec + phase01,
              LV: manufacturedSampleV1(phaseIndex, loadIndex, 20, 120, 40),
              RV: manufacturedSampleV1(phaseIndex, loadIndex, 24, 135, 55),
            });
          }),
        ),
      });
    }),
  );
}

function manufacturedSampleV1(
  phaseIndex: number,
  loadIndex: number,
  peakPhaseIndex: number,
  baselineVolumeMl: number,
  volumeAxisInterceptMl: number,
) {
  const phaseRadians = (2 * Math.PI * phaseIndex) / 64;
  const phaseDistance = Math.min(
    Math.abs(phaseIndex - peakPhaseIndex),
    64 - Math.abs(phaseIndex - peakPhaseIndex),
  );
  const slopeMmHgPerMl = 1 + 8 * Math.exp(-(phaseDistance ** 2) / 24);
  const volumeMl = baselineVolumeMl - 2 * loadIndex + Math.sin(phaseRadians);
  const transmuralPressureMmHg =
    slopeMmHgPerMl * (volumeMl - volumeAxisInterceptMl);
  return Object.freeze({
    volumeMl,
    transmuralPressureMmHg,
    absolutePressureMmHg: transmuralPressureMmHg,
    semilunarFlowMlPerSec: 0,
  });
}

function manufacturedLedgerV1(): MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1 {
  const workByDt = new Map([
    [0.001, { LV: -1250, RV: -420 }],
    [0.0005, { LV: -1260, RV: -425 }],
    [0.00025, { LV: -1265, RV: -428 }],
  ]);
  return {
    payload: {
      sourceOutcome: { status: "source-p1-established" },
      assessment: {
        sourceP1Established: true,
        allThreeArmsFulfilled: true,
        threeGridMechanicalPortLedgerCharacterizationCompleted: true,
      },
      armOutcomes: [...workByDt].map(([nominalDtSec, work]) => ({
        status: "fulfilled",
        nominalDtSec,
        ledger: {
          cavityWork: {
            trapezoidalWorkOnWallMilliJ: {
              LA: 0,
              LV: work.LV,
              RA: 0,
              RV: work.RV,
            },
          },
        },
      })),
    },
  } as unknown as MainWireIntegratedModelPeriodicMechanicalPortLedgerDtReportV1;
}

function manufacturedPassiveComparisonV1(): MainWireIntegratedModelPvaDiastolicReferenceComparisonV1 {
  const slice = (ventricleId: "LV" | "RV") => ({
    status: "available" as const,
    ventricleId,
    fixedContralateralVentricleId: ventricleId === "LV" ? "RV" : "LV",
    fixedContralateralVolumeMl: 100,
    modelMinimumVolumeMl: 30,
    maximumSampledVolumeMl: 160,
    zeroPressureVolumeMl: 60,
    pressureRule:
      "piecewise-linear-positive-pressure-with-zero-clamp-below-crossing" as const,
    extensionIntervalCount: 12,
    points: Object.freeze(
      Array.from({ length: 14 }, (_, index) => {
        const volumeMl = 30 + 10 * index;
        return Object.freeze({
          volumeMl,
          intrinsicPressureMmHg: Math.max(0, 0.05 * (volumeMl - 60)),
          source: "extended-continuation" as const,
          scaledForceInfinityNorm: 0,
          minimumScaledInternalHessianEigenvalue: 1,
          candidateEvaluations: 1,
          acceptedUpdates: 1,
          rejectedTrials: 0,
        });
      }),
    ),
  });
  return {
    studyId: "main-wire-integrated-model-pva-diastolic-reference-comparison-v1",
    status: "completed",
    scope: "research-only-diastolic-reference-method-comparison",
    pressureBasis: "ventricular-transmural",
    intrinsicSlices: [slice("LV"), slice("RV")],
  } as unknown as MainWireIntegratedModelPvaDiastolicReferenceComparisonV1;
}

function manufacturedPassiveComparisonWithSecondCrossingV1(): MainWireIntegratedModelPvaDiastolicReferenceComparisonV1 {
  const comparison = structuredClone(manufacturedPassiveComparisonV1());
  const LV = comparison.intrinsicSlices.find(
    (slice) => slice.ventricleId === "LV",
  );
  if (LV?.status !== "available")
    throw new Error("manufactured LV slice missing");
  Object.assign(LV, {
    modelMinimumVolumeMl: 90,
    maximumSampledVolumeMl: 130,
    zeroPressureVolumeMl: 80,
    points: [
      pointV1(90, 1000),
      pointV1(100, 600),
      pointV1(102, 530),
      pointV1(110, 600),
      pointV1(115, 800),
      pointV1(130, 1000),
    ],
  });
  return comparison;
}

function pointV1(volumeMl: number, intrinsicPressureMmHg: number) {
  return {
    volumeMl,
    intrinsicPressureMmHg,
    source: "extended-continuation" as const,
    scaledForceInfinityNorm: 0,
    minimumScaledInternalHessianEigenvalue: 1,
    candidateEvaluations: 1,
    acceptedUpdates: 1,
    rejectedTrials: 0,
  };
}
