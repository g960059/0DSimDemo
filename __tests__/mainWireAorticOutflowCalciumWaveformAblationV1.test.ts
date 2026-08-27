import { describe, expect, it } from "vitest";

import {
  compareMainWireAorticOutflowCalciumWaveformV1,
  type MainWireAorticOutflowCalciumWaveformArmInputV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumWaveformComparisonV1";
import {
  compareMainWireAorticOutflowCalciumDelayedMixtureV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumDelayedMixtureComparisonV1";
import {
  MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_POINT_IDS_V1,
  MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_PROFILE_ID_V1,
  measureMainWireAorticOutflowCalciumDelayedMixtureLoadEnvelopeV1,
} from "@/analysis/methods/mainWire/MainWireAorticOutflowCalciumDelayedMixtureLoadEnvelopeV1";
import {
  measurePeriodicAorticPressureFlowCouplingV1,
} from "@/analysis/methods/mainWire/MainWireAorticPressureFlowCouplingV1";
import {
  FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1,
  evaluateFiveWallNormalCalciumDriveV1,
  measurePeriodicBiexponentialCalciumPulseShapeV1,
  measurePeriodicBiexponentialDelayedMixtureShapeV1,
} from "@/engine/myocardium/calcium/fiveWallNormalCalciumDriveV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_ABLATION_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_IDS_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_V1,
  resolveMainWireVentricularCalciumDelayedMixtureParamsV1,
  resolveMainWireVentricularCalciumDelayedMixtureProfileV1,
  validateMainWireVentricularCalciumDelayedMixtureProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumDelayedMixtureAblationV1";
import {
  MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_ABLATION_CLAIM_V1,
  MAIN_WIRE_VENTRICULAR_CALCIUM_WAVEFORM_PROFILE_IDS_V1,
  resolveMainWireVentricularCalciumWaveformParamsV1,
  resolveMainWireVentricularCalciumWaveformProfileV1,
  validateMainWireVentricularCalciumWaveformProfileV1,
} from "@/engine/myocardium/calcium/MainWireVentricularCalciumWaveformAblationV1";
import {
  runMainWireNormalAdultFiveWallPeriodicSteadyV1,
  runMainWireNormalAdultFiveWallCirculatoryLoadResearchPointV1,
  runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureResearchV1,
  runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureLoadResearchV1,
  runMainWireNormalAdultFiveWallVentricularCalciumWaveformResearchV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

describe("main-wire aortic outflow calcium waveform ablation V1", () => {
  it("classifies an unsmoothed pressure-flow derivative proxy by sign", () => {
    const phases = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875];
    const pressures = [80, 80, 82, 86, 87, 84, 80, 80];
    const rootFlows = [0, 0, 20, 50, 40, 20, 0, 0];
    const valveFlows = [0, 0, 100, 200, 150, 100, 0, 0];
    const measured = measurePeriodicAorticPressureFlowCouplingV1(
      phases.map((cyclePhase01, index) => ({
        cyclePhase01,
        aorticRootAbsolutePressureMmHg: pressures[index]!,
        aorticRootFlowMlPerSec: rootFlows[index]!,
        aorticValveFlowMlPerSec: valveFlows[index]!,
      })),
      0.1,
      {
        aorticRootAbsolutePressureMmHg: 80,
        aorticRootFlowMlPerSec: 0,
      },
    );

    expect(measured.ejectionEpisode.durationSec).toBeCloseTo(0.4, 14);
    expect(measured.ejectionEpisode.aorticValveFlowPeakPhase01).toBe(0.375);
    expect(measured.ejectionEpisode
      .signedAorticRootFlowPeakLagFromAorticValveFlowPeakSec).toBe(0);
    const proxy = measured.pressureFlowCouplingProxy;
    expect(proxy.maximumCompressionLikeIntensityMmHgMlPerSec3)
      .toBeCloseTo(12_000, 12);
    expect(proxy.compressionLikePeakPhase01).toBe(0.375);
    expect(proxy.compressionLikeEjectionIntegralMmHgMlPerSec2)
      .toBeCloseTo(1_600, 12);
    expect(proxy.maximumDecompressionLikeIntensityMmHgMlPerSec3)
      .toBeCloseTo(6_000, 12);
    expect(proxy.decompressionLikePeakPhase01).toBe(0.625);
    expect(proxy.decompressionLikeEjectionIntegralMmHgMlPerSec2)
      .toBeCloseTo(600, 12);
    expect(proxy.mismatchMagnitudeEjectionIntegralMmHgMlPerSec2)
      .toBeCloseTo(100, 12);
    expect(proxy.absoluteEjectionIntegralMmHgMlPerSec2)
      .toBeCloseTo(2_300, 12);
    expect(
      proxy.compressionLikeFractionOfAbsoluteEjectionIntegral01
      + proxy.decompressionLikeFractionOfAbsoluteEjectionIntegral01
      + proxy.mismatchFractionOfAbsoluteEjectionIntegral01,
    ).toBeCloseTo(1, 14);
    expect(measured.aorticRootStorage.flowAtAorticValveFlowPeakMlPerSec)
      .toBe(150);
    expect(measured.aorticRootStorage
      .positiveAccumulationVolumeDuringEjectionMl).toBeCloseTo(42, 12);
  });

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

  it("seals and morphology-classifies an exposure-preserving delayed-mixture factorial", () => {
    const prior = FIVE_WALL_NORMAL_CALCIUM_DRIVE_FIXED_PRIOR_V1;
    const profiles =
      MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_IDS_V1.map(
        resolveMainWireVentricularCalciumDelayedMixtureProfileV1,
      );
    expect(profiles.map((profile) => [
      profile.delayedWeightFactor,
      profile.delayReference,
    ])).toEqual([
      ["quarter", "baseline-ventricular-rise-time-constant"],
      ["half", "baseline-ventricular-rise-time-constant"],
      ["quarter", "baseline-ventricular-decay-time-constant"],
      ["half", "baseline-ventricular-decay-time-constant"],
    ]);
    expect(MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_V1)
      .toBe(profiles[0]);
    expect(MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_ABLATION_CLAIM_V1)
      .toMatchObject({
        oneSidedFactorial: true,
        everyProfilePreservesVentricularCalciumCycleExposure: true,
        calciumOrMechanicsStateAdded: false,
        acceptedStateOrCheckpointTopologyChanged: false,
        parameterSearchOrFitting: false,
        hemodynamicOutcomeUsedToDeriveProfile: false,
      });
    const base = measurePeriodicBiexponentialCalciumPulseShapeV1(
      prior.cycleLengthSec,
      prior.ventricular.riseTimeConstantSec,
      prior.ventricular.decayTimeConstantSec,
    );
    const sampleCount = 20_000;
    const peakCounts: number[] = [];
    for (const profile of profiles) {
      const params =
        resolveMainWireVentricularCalciumDelayedMixtureParamsV1(
          profile.profileId,
        );
      const measured = measurePeriodicBiexponentialDelayedMixtureShapeV1(
        prior.cycleLengthSec,
        prior.ventricular.riseTimeConstantSec,
        prior.ventricular.decayTimeConstantSec,
        profile.delayedWeight01,
        profile.delaySec,
      );
      expect(profile.unnormalizedMixturePeak01)
        .toBe(measured.unnormalizedMixturePeak01);
      expect(profile
        .ventricularSupradiastolicCalciumCycleExposureScaleFromPrior)
        .toBeCloseTo(1, 14);
      expect(validateMainWireVentricularCalciumDelayedMixtureProfileV1(profile))
        .toEqual([]);
      const pulses = Array.from({ length: sampleCount }, (_, index) =>
        evaluateFiveWallNormalCalciumDriveV1(
          (index + 0.5) / sampleCount,
          params,
        ).ventricularNormalizedPulse01);
      const numericalIntegral = pulses.reduce(
        (sum, value) => sum + value,
        0,
      ) / sampleCount;
      expect(numericalIntegral)
        .toBeCloseTo(measured.normalizedMixtureCycleIntegralSec, 8);
      expect(Math.max(...pulses)).toBeCloseTo(1, 7);
      peakCounts.push(countStrictCyclicLocalMaxima(pulses, 0.05));
      expect(
        params.ventricular.peakAmplitudeUM * numericalIntegral,
      ).toBeCloseTo(
        prior.ventricular.peakAmplitudeUM
          * base.normalizedPulseCycleIntegralSec,
        8,
      );
    }
    expect(peakCounts).toEqual([1, 1, 2, 2]);
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
      const coupling = arm.aorticPressureFlowCoupling.summary
        .pressureFlowCouplingProxy;
      expect(
        coupling.compressionLikeFractionOfAbsoluteEjectionIntegral01
        + coupling.decompressionLikeFractionOfAbsoluteEjectionIntegral01
        + coupling.mismatchFractionOfAbsoluteEjectionIntegral01,
      ).toBeCloseTo(1, 12);
      expect(arm.aorticPressureFlowCoupling.claim.clinicalWaveIntensityAnalysis)
        .toBe(false);
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

  it("runs the delayed mixture without changing canonical topology", () => {
    const canonical =
      runMainWireNormalAdultFiveWallVentricularCalciumWaveformResearchV1(
        { dtSec: 0.02, maximumBeatCount: 2 },
        "canonical",
      );
    const delayedRuns =
      MAIN_WIRE_VENTRICULAR_CALCIUM_DELAYED_MIXTURE_PROFILE_IDS_V1.map(
        (profileId) =>
          runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureResearchV1(
            { dtSec: 0.02, maximumBeatCount: 2 },
            profileId,
          ),
      );
    const withoutCalciumHash = (
      hashes: typeof canonical.periodicResult.protocolComponentHashes,
    ) => {
      const { calciumDriveFixedParamsStableHash: _, ...rest } = hashes;
      return rest;
    };
    for (const delayed of delayedRuns) {
      expect(delayed.periodicResult.protocolIdentityHash)
        .not.toBe(canonical.periodicResult.protocolIdentityHash);
      expect(withoutCalciumHash(
        delayed.periodicResult.protocolComponentHashes,
      )).toEqual(withoutCalciumHash(
        canonical.periodicResult.protocolComponentHashes,
      ));
      expect(delayed.claim).toMatchObject({
        circulationRuntimeChanged: false,
        mechanicsProviderChanged: false,
        calciumOrMechanicsStateAdded: false,
        acceptedStateOrCheckpointTopologyChanged: false,
      });
    }
    const comparison = compareMainWireAorticOutflowCalciumDelayedMixtureV1(
      canonical.periodicResult,
      delayedRuns.map((run) => ({
        profileId: run.profile.profileId,
        periodicResult: run.periodicResult,
      })),
    );
    expect(comparison.delayedMixtures).toHaveLength(4);
    expect(comparison.factorialContrasts).toHaveLength(12);
    expect(comparison.delayedMixtures.map((arm) =>
      arm.ventricularCalciumStrictLocalPeakCountAboveFivePercent))
      .toEqual([1, 1, 2, 2]);
    expect(comparison.delayedMixtures.map((arm) =>
      arm.morphologyScreen!.morphologyPreserved))
      .toEqual([true, true, false, false]);
    for (const arm of comparison.delayedMixtures) {
      expect(arm.lvfwActiveStressStrictLocalPeakCountAboveFivePercent)
        .toBeGreaterThan(0);
    }
    expect(allNumbersFiniteOrNull(comparison)).toBe(true);
  }, 60_000);

  it("pairs the morphology-safe arm with the fixed systemic-load envelope", () => {
    const inputs =
      MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_POINT_IDS_V1.map(
        (loadPointId) => ({
          loadPointId,
          canonicalResult:
            runMainWireNormalAdultFiveWallCirculatoryLoadResearchPointV1(
              { dtSec: 0.02, maximumBeatCount: 1 },
              loadPointId,
            ),
          candidateResult:
            runMainWireNormalAdultFiveWallVentricularCalciumDelayedMixtureLoadResearchV1(
              { dtSec: 0.02, maximumBeatCount: 1 },
              MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_PROFILE_ID_V1,
              loadPointId,
            ).periodicResult,
        }),
      );
    const envelope =
      measureMainWireAorticOutflowCalciumDelayedMixtureLoadEnvelopeV1(inputs);
    expect(envelope.arms).toHaveLength(3);
    expect(envelope.profile.profileId)
      .toBe(MAIN_WIRE_AORTIC_OUTFLOW_CALCIUM_DELAYED_MIXTURE_LOAD_PROFILE_ID_V1);
    expect(envelope.morphologyPreservedAcrossEnvelope).toBe(true);
    expect(envelope.claim.outcomeInformedProfileSelection).toBe(true);
    expect(envelope.claim.numericParameterFittingOrOptimization).toBe(false);
    expect(allNumbersFiniteOrNull(envelope)).toBe(true);
    expect(() =>
      measureMainWireAorticOutflowCalciumDelayedMixtureLoadEnvelopeV1(
        inputs.slice(1),
      )).toThrow("missing delayed-mixture load point");
  }, 60_000);
});

function countStrictCyclicLocalMaxima(
  values: readonly number[],
  threshold: number,
): number {
  return values.filter((value, index) =>
    value >= threshold
    && value > values[(index - 1 + values.length) % values.length]!
    && value > values[(index + 1) % values.length]!).length;
}

function allNumbersFiniteOrNull(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(allNumbersFiniteOrNull);
  if (value !== null && typeof value === "object") {
    return Object.values(value).every(allNumbersFiniteOrNull);
  }
  return true;
}
