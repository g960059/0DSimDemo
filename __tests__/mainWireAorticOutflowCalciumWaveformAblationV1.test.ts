import { describe, expect, it } from "vitest";

import {
  compareMainWireAorticOutflowCalciumWaveformV1,
  type MainWireAorticOutflowCalciumWaveformArmInputV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  evaluateFiveWallNormalCalciumDriveV1,
  measurePeriodicBiexponentialCalciumPulseShapeV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_ABLATION_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_PROFILE_IDS_V1,
  resolveMainWireVentricularCalciumWaveformParamsV1,
  resolveMainWireVentricularCalciumWaveformProfileV1,
  validateMainWireVentricularCalciumWaveformProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumWaveformAblationV1";
import {
  runMainWireNormalAdultFiveWallPeriodicSteadyV1,
  runMainWireNormalAdultFiveWallVentricularCalciumWaveformResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

describe("main-wire aortic outflow calcium waveform ablation V1", () => {
  it("matches the periodic pulse peak and cycle integral analytically", () => {
    const prior = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
    const shapes = [
      [prior.ventricular.riseTimeConstantSec,
        prior.ventricular.decayTimeConstantSec],
      [prior.ventricular.riseTimeConstantSec * 4 / 3,
        prior.ventricular.decayTimeConstantSec],
      [prior.ventricular.riseTimeConstantSec,
        prior.ventricular.decayTimeConstantSec * 4 / 3],
      [prior.ventricular.riseTimeConstantSec * 4 / 3,
        prior.ventricular.decayTimeConstantSec * 4 / 3],
    ] as const;
    const sampleCount = 20_000;

    for (const [riseTimeConstantSec, decayTimeConstantSec] of shapes) {
      const analytic = measurePeriodicBiexponentialCalciumPulseShapeV1(
        prior.cycleLengthSec,
        riseTimeConstantSec,
        decayTimeConstantSec,
      );
      const params = Object.freeze({
        ...prior,
        parameterSetId:
          `numerical-pulse-check-${riseTimeConstantSec}-${decayTimeConstantSec}`,
        ventricular: Object.freeze({
          ...prior.ventricular,
          diastolicCalciumUM: 0,
          peakAmplitudeUM: 1,
          riseTimeConstantSec,
          decayTimeConstantSec,
          electricalToCalciumDelaySec: 0,
        }),
      });
      let numericalIntegral = 0;
      let peakValue = Number.NEGATIVE_INFINITY;
      let peakTimeSec = 0;
      for (let index = 0; index < sampleCount; index += 1) {
        const timeSec = (index + 0.5) / sampleCount;
        const value = evaluateFiveWallNormalCalciumDriveV1(timeSec, params)
          .freeCalciumUMByWall.LVFW;
        numericalIntegral += value / sampleCount;
        if (value > peakValue) {
          peakValue = value;
          peakTimeSec = timeSec;
        }
      }
      expect(numericalIntegral).toBeCloseTo(
        analytic.normalizedPulseCycleIntegralSec,
        8,
      );
      expect(peakTimeSec).toBeCloseTo(analytic.timeToPeakSec, 4);
      expect(peakValue).toBeCloseTo(1, 7);
    }
    expect(() => measurePeriodicBiexponentialCalciumPulseShapeV1(1, 0.2, 0.1))
      .toThrow("decay time constant must exceed rise time constant");
  });

  it("seals an exposure-preserving fixed rise-by-decay factorial", () => {
    const profiles = MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_PROFILE_IDS_V1.map(
      resolveMainWireVentricularCalciumWaveformProfileV1,
    );
    expect(profiles.map((profile) => [
      profile.riseTimeFactor,
      profile.decayTimeFactor,
    ])).toEqual([
      ["baseline", "baseline"],
      ["high", "baseline"],
      ["baseline", "high"],
      ["high", "high"],
    ]);
    for (const profile of profiles) {
      expect(Object.isFrozen(profile)).toBe(true);
      expect(profile.ventricularSupradiastolicCalciumCycleExposureScaleFromPrior)
        .toBeCloseTo(1, 14);
      expect(profile.parameterSearchOrFitting).toBe(false);
      expect(profile.hemodynamicOutcomeUsedToDeriveProfile).toBe(false);
      expect(validateMainWireVentricularCalciumWaveformProfileV1(profile))
        .toEqual([]);
    }
    expect(profiles[1]!.ventricularRiseTimeScaleFromPrior)
      .toBeCloseTo(4 / 3, 14);
    expect(profiles[2]!.ventricularDecayTimeScaleFromPrior)
      .toBeCloseTo(4 / 3, 14);
    expect(profiles.slice(1).every((profile) =>
      profile.ventricularPeakAmplitudeScaleFromPrior < 1)).toBe(true);
    expect(validateMainWireVentricularCalciumWaveformProfileV1({
      ...profiles[1]!,
      ventricularRiseTimeScaleFromPrior: 2,
    })).toContain(
      "ventricular calcium waveform profile ventricularRiseTimeScaleFromPrior differs from its fixed value",
    );
    expect(MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_ABLATION_CLAIM_V1)
      .toMatchObject({
        everyProfilePreservesVentricularCalciumCycleExposure: true,
        calciumOrMechanicsStateAdded: false,
        acceptedStateOrCheckpointTopologyChanged: false,
        parameterSearchOrFitting: false,
      });
  });

  it("preserves the canonical run exactly and changes only calcium identity", () => {
    const canonical = runMainWireNormalAdultFiveWallPeriodicSteadyV1({
      dtSec: 0.02,
      maximumBeatCount: 1,
      laSlsMode: "on",
      pericardiumMode: "on",
      pericardiumCase: "healthy-slack",
      initialization: "canonical",
      valveDiseaseBracketIds: Object.freeze([]),
    });
    const baseline =
      runMainWireNormalAdultFiveWallVentricularCalciumWaveformResearchV1(
        { dtSec: 0.02, maximumBeatCount: 1 },
        "canonical",
      );
    const broadened =
      runMainWireNormalAdultFiveWallVentricularCalciumWaveformResearchV1(
        { dtSec: 0.02, maximumBeatCount: 1 },
        "ventricular-calcium-rise-decay-high-exposure-preserving",
      );
    expect(resolveMainWireVentricularCalciumWaveformParamsV1("canonical"))
      .toBe(FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1);
    expect(baseline.periodicResult).toEqual(canonical);
    expect(broadened.periodicResult.protocolIdentityHash)
      .not.toBe(baseline.periodicResult.protocolIdentityHash);
    expect(broadened.periodicResult.protocolComponentHashes
      .calciumDriveFixedParamsStableHash).not.toBe(
        baseline.periodicResult.protocolComponentHashes
          .calciumDriveFixedParamsStableHash,
      );
    const withoutCalciumHash = (
      hashes: typeof baseline.periodicResult.protocolComponentHashes,
    ) => {
      const { calciumDriveFixedParamsStableHash: _, ...rest } = hashes;
      return rest;
    };
    expect(withoutCalciumHash(broadened.periodicResult.protocolComponentHashes))
      .toEqual(withoutCalciumHash(
        baseline.periodicResult.protocolComponentHashes,
      ));
    expect(broadened.claim).toMatchObject({
      circulationRuntimeChanged: false,
      mechanicsProviderChanged: false,
      calciumOrMechanicsStateAdded: false,
      acceptedStateOrCheckpointTopologyChanged: false,
    });
    expect(Object.keys(broadened.periodicResult.terminalCycleBoundaryWarmStart!
      .checkpoint.circulation.state.dynamicEdgeFlowsMlPerSec))
      .toEqual(["Ao_SA", "PA_PArt"]);
    expect(() =>
      runMainWireNormalAdultFiveWallVentricularCalciumWaveformResearchV1(
        { dtSec: 0.02, maximumBeatCount: 1, calciumTau: 0.2 } as never,
        "canonical",
      )).toThrow("reject unsupported field: calciumTau");
  }, 60_000);

  it("reports finite four-arm factorial diagnostics and fail-closed input", () => {
    const inputs: MainWireAorticOutflowCalciumWaveformArmInputV1[] =
      MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_PROFILE_IDS_V1.map(
        (profileId) => {
          const run =
            runMainWireNormalAdultFiveWallVentricularCalciumWaveformResearchV1(
              { dtSec: 0.02, maximumBeatCount: 2 },
              profileId,
            );
          return { profileId, periodicResult: run.periodicResult };
        },
      );
    const comparison = compareMainWireAorticOutflowCalciumWaveformV1(inputs);
    expect(comparison.arms).toHaveLength(4);
    expect(comparison.factorialContrasts).toHaveLength(12);
    expect(comparison.arms.map((arm) => arm.profileId))
      .toEqual(MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_PROFILE_IDS_V1);
    for (const arm of comparison.arms) {
      expect(arm.aorticMaximumFlowMlPerSec).toBeGreaterThan(0);
      expect(arm.aorticStrictlyPositiveFlowTimeSec).toBeGreaterThan(0);
      expect(arm.aorticFlowPeakCountAboveFivePercent).toBeGreaterThanOrEqual(1);
      expect(arm.aorticFlowAcEnergyFraction10To50Hz).toBeGreaterThanOrEqual(0);
      expect(arm.aorticFlowAcEnergyFraction10To50Hz).toBeLessThanOrEqual(1);
      expect(arm.configuredSupradiastolicCalciumCycleExposureUMSec)
        .toBeCloseTo(
          comparison.arms[0]!
            .configuredSupradiastolicCalciumCycleExposureUMSec,
          12,
        );
      expect(allNumbersFiniteOrNull(arm)).toBe(true);
    }
    expect(comparison.factorialContrasts.every(allNumbersFiniteOrNull))
      .toBe(true);
    expect(comparison.claim.exactFrameMutation).toBe(false);
    expect(comparison.claim.pressureStationDifferencePreserved).toBe(true);
    expect(() => compareMainWireAorticOutflowCalciumWaveformV1(
      inputs.slice(0, 3),
    )).toThrow("missing ventricular calcium arm");
    expect(() => compareMainWireAorticOutflowCalciumWaveformV1([
      ...inputs,
      inputs[0]!,
    ])).toThrow("duplicate ventricular calcium arm");
  }, 60_000);
});

function allNumbersFiniteOrNull(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(allNumbersFiniteOrNull);
  if (value !== null && typeof value === "object") {
    return Object.values(value).every(allNumbersFiniteOrNull);
  }
  return true;
}
