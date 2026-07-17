import { describe, expect, it } from "vitest";

import type {
  MainWireNormalAdultFiveWallDiagnosticSampleV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import {
  MAIN_WIRE_VALVE_DISEASE_CYCLE_METRICS_CLAIM_V1,
  measureMainWireValveDiseaseCycleMetricsV1,
  type MainWireValveDiseaseCycleValveIdV1,
} from "@/engine/myocardium/diagnostics/MainWireValveDiseaseCycleMetricsV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";
import {
  composeMainWireFourValveDiseasePresetV1,
} from "@/engine/mechanics2/valve/MainWireFourValveDiseasePresetV1";

const VALVES = ["MV", "AoV", "TV", "PV"] as const;
const FLOW_SCALE = Object.freeze({ MV: 1, AoV: 0.8, TV: 1.2, PV: 1 });
const MAXIMUM_FORWARD_EOA = Object.freeze({ MV: 5.5, AoV: 3.5, TV: 8, PV: 4 });
const CLOSED_REVERSE_EROA = Object.freeze({ MV: 0.1, AoV: 0.05, TV: 0.1, PV: 0.1 });
const BASE_FLOW = [10, 20, 0, -5, -10, 0, 30, 40] as const;
const GRADIENT = [1, 2, 0, -1, -2, 0, 3, 4] as const;
const POWER_RESIDUAL = [0, 0.1, -0.2, 0, 0, 0, 0.05, -0.1] as const;

describe("MainWireValveDiseaseCycleMetricsV1", () => {
  it("accounts same-valve volumes, RF, gradients, jets, energy, and cyclic episodes", () => {
    const result = fixtureResult({ periodicSteadyStateClaimed: false });
    const measured = measureMainWireValveDiseaseCycleMetricsV1(result);
    const mv = measured.valves.MV;

    expect(measured.source.beatIndex).toBe(7);
    expect(measured.source.sampleCount).toBe(8);
    expect(measured.source.sampledCycleDurationSec).toBeCloseTo(0.8, 15);
    expect(measured.source.protocolIdentityHash).toBe("fixture-protocol-hash");
    expect(measured.source.valvePreset.bracketIds)
      .toEqual(["AR-mild", "MR-mild", "PR-mild", "TR-mild"]);
    expect(measured.interpretationEligible).toBe(false);
    expect(mv.configuredMaximumForwardEoaCm2).toBe(5.5);
    expect(mv.configuredClosedReverseEroaCm2).toBe(0.1);
    expect(mv.maximumAbsoluteFlowMlPerSec).toBe(40);
    expect(mv.episodeFlowThresholdMlPerSec).toBe(1);
    expect(mv.forwardVolumeMl).toBeCloseTo(10, 15);
    expect(mv.reverseVolumeMl).toBeCloseTo(1.5, 15);
    expect(mv.netVolumeMl).toBeCloseTo(8.5, 15);
    expect(mv.sameValveRegurgitantFraction).toBeCloseTo(0.15, 15);
    expect(mv.forwardFlowTimeSec).toBeCloseTo(0.4, 15);
    expect(mv.forwardFlowTimeMeanGradientMmHg).toBeCloseTo(2.5, 15);
    expect(mv.forwardFlowWeightedMeanGradientMmHg).toBeCloseTo(3, 15);
    expect(mv.peakForwardGradientMmHg).toBe(4);
    expect(mv.peakForwardJetVelocityMPerSec).toBeCloseTo(0.2, 15);
    expect(mv.forwardFlowTimeMeanSimplifiedDopplerGradientMmHg)
      .toBeCloseTo(0.075, 15);
    expect(mv.peakSimplifiedDopplerGradientMmHg).toBeCloseTo(0.16, 15);
    expect(mv.peakReverseJetVelocityMPerSec).toBeCloseTo(1, 15);
    expect(mv.forwardEpisodeCount).toBe(1);
    expect(mv.forwardEpisodeDurationSec).toBeCloseTo(0.4, 15);
    expect(mv.reverseEpisodeCount).toBe(1);
    expect(mv.reverseEpisodeDurationSec).toBeCloseTo(0.2, 15);
    expect(mv.expectedReversePhase)
      .toBe("systolic-longest-forward-closed-run");
    expect(mv.expectedReversePhaseAvailable).toBe(true);
    expect(mv.expectedReversePhaseStartSampleIndex).toBe(2);
    expect(mv.expectedReversePhaseSampleCount).toBe(4);
    expect(mv.expectedReversePhaseDurationSec).toBeCloseTo(0.4, 15);
    expect(mv.reverseVolumeWithinExpectedPhaseMl).toBeCloseTo(1.5, 15);
    expect(mv.reverseVolumeOutsideExpectedPhaseMl).toBe(0);
    expect(mv.reverseVolumeWithinExpectedPhaseFraction).toBe(1);
    expect(mv.openingTargetEpisodeCount).toBe(1);
    expect(mv.leafletOpeningEpisodeCount).toBe(1);
    expect(mv.activeDirectionTransitionCount).toBe(4);
    expect(mv.competentReverseClosureEpisodeCount).toBe(0);
    expect(mv.subthresholdForwardSupportEpisodeCount).toBe(0);
    expect(mv.maximumAbsoluteOpeningEquationResidual01).toBe(0);
    expect(mv.dissipatedCycleEnergyMmHgMl).toBeCloseTo(13.2375, 15);
    expect(mv.linearDissipatedCycleEnergyMmHgMl).toBeCloseTo(3.125, 15);
    expect(mv.bernoulliDissipatedCycleEnergyMmHgMl).toBeCloseTo(10.1125, 15);
    expect(mv.linearFractionOfDissipatedCycleEnergy)
      .toBeCloseTo(3.125 / 13.2375, 15);
    expect(mv.peakAbsoluteLinearPressureLossMmHg).toBeCloseTo(0.4, 15);
    expect(mv.peakAbsoluteBernoulliPressureLossMmHg).toBeCloseTo(1.6, 15);
    expect(mv.maximumAbsoluteDissipatedPowerDecompositionResidualMmHgMlPerSec)
      .toBeCloseTo(0, 15);
    expect(mv.minimumHydraulicInputPowerMmHgMlPerSec).toBe(0);
    expect(mv.maximumAbsolutePowerResidualMmHgMlPerSec).toBe(0.2);
  });

  it("reports four-valve conservation mismatches without a clinical pass judgment", () => {
    const measured = measureMainWireValveDiseaseCycleMetricsV1(fixtureResult({
      periodicSteadyStateClaimed: true,
    }));

    expect(measured.interpretationEligible).toBe(true);
    expect(measured.global.netVolumeMlByValve.MV).toBeCloseTo(8.5, 14);
    expect(measured.global.netVolumeMlByValve.AoV).toBeCloseTo(6.8, 14);
    expect(measured.global.netVolumeMlByValve.TV).toBeCloseTo(10.2, 14);
    expect(measured.global.netVolumeMlByValve.PV).toBeCloseTo(8.5, 14);
    expect(measured.global.aorticMinusPulmonaryNetStrokeVolumeMl)
      .toBeCloseTo(-1.7, 14);
    expect(measured.global.absoluteAorticPulmonaryNetStrokeMismatchMl)
      .toBeCloseTo(1.7, 14);
    expect(measured.global.leftVentricularValveBalanceMl)
      .toBeCloseTo(1.7, 14);
    expect(measured.global.rightVentricularValveBalanceMl)
      .toBeCloseTo(1.7, 14);
    expect(measured.global.mitralMinusTricuspidNetStrokeVolumeMl)
      .toBeCloseTo(-1.7, 14);
    expect(measured).not.toHaveProperty("passed");
    expect(MAIN_WIRE_VALVE_DISEASE_CYCLE_METRICS_CLAIM_V1
      .clinicalThresholdOrPassFailJudgment).toBe(false);
    expect(MAIN_WIRE_VALVE_DISEASE_CYCLE_METRICS_CLAIM_V1.smoothingUsed)
      .toBe(false);
    expect(MAIN_WIRE_VALVE_DISEASE_CYCLE_METRICS_CLAIM_V1
      .expectedReversePhaseIsProxyNotIndependentPhysiologicalEventOwner)
      .toBe(true);
  });

  it("counts a full-cycle threshold-active signal as one cyclic episode", () => {
    const measured = measureMainWireValveDiseaseCycleMetricsV1(fixtureResult({
      periodicSteadyStateClaimed: true,
      baseFlow: [2, 2, 2, 2, 2, 2, 2, 2],
      gradient: [1, 1, 1, 1, 1, 1, 1, 1],
    }));

    expect(measured.valves.MV.forwardEpisodeCount).toBe(1);
    expect(measured.valves.MV.forwardEpisodeDurationSec).toBeCloseTo(0.8, 15);
    expect(measured.valves.MV.reverseEpisodeCount).toBe(0);
    expect(measured.valves.MV.reverseVolumeMl).toBe(0);
    expect(measured.valves.MV.sameValveRegurgitantFraction).toBe(0);
  });

  it("requires a retained complete accepted beat", () => {
    const result = {
      ...fixtureResult({ periodicSteadyStateClaimed: false }),
      retainedCompleteBeats: [],
    } as unknown as MainWireNormalAdultFiveWallPeriodicResultV1;
    expect(() => measureMainWireValveDiseaseCycleMetricsV1(result))
      .toThrow(/retained complete beat/);
  });

  it("rejects retained-beat metadata that disagrees with sample count and dt", () => {
    const source = fixtureResult({ periodicSteadyStateClaimed: true });
    const beat = source.retainedCompleteBeats[0]!;
    const result = {
      ...source,
      retainedCompleteBeats: [{ ...beat, endTimeSec: beat.endTimeSec + 0.1 }],
    } as unknown as MainWireNormalAdultFiveWallPeriodicResultV1;
    expect(() => measureMainWireValveDiseaseCycleMetricsV1(result))
      .toThrow(/duration must equal accepted sample count times dtSec/);
  });

  it.each([
    {
      name: "preset/sample reverse EROA mismatch",
      sampleIndex: 0,
      patch: { closedReverseEroaCm2: 0.11 },
      error: /closed reverse EROA must equal the configured preset value/,
    },
    {
      name: "forward area below the configured residual area",
      sampleIndex: 0,
      patch: { forwardActiveEoaCm2: 0.09 },
      error: /forward active EOA must remain within/,
    },
    {
      name: "forward area above the configured maximum area",
      sampleIndex: 0,
      patch: { forwardActiveEoaCm2: 5.51 },
      error: /forward active EOA must remain within/,
    },
    {
      name: "active area inconsistent with forward direction",
      sampleIndex: 0,
      patch: { activeEoaCm2: 1.9, physicalAreaCm2: 1.9 },
      error: /active EOA must match the direction-selected EOA/,
    },
    {
      name: "negative flow tagged as forward",
      sampleIndex: 0,
      patch: { flowMlPerSec: -10 },
      error: /flow sign must agree with active direction/,
    },
    {
      name: "nonzero flow tagged as zero-gradient",
      sampleIndex: 2,
      patch: { flowMlPerSec: 1 },
      error: /flow sign must agree with active direction/,
    },
  ])("rejects tampered diagnostic readback: $name", ({
    sampleIndex,
    patch,
    error,
  }) => {
    const tampered = withTamperedLastBeatValveReadback(
      fixtureResult({ periodicSteadyStateClaimed: true }),
      sampleIndex,
      "MV",
      patch,
    );

    expect(() => measureMainWireValveDiseaseCycleMetricsV1(tampered))
      .toThrow(error);
  });
});

function fixtureResult(input: Readonly<{
  periodicSteadyStateClaimed: boolean;
  baseFlow?: readonly number[];
  gradient?: readonly number[];
}>): MainWireNormalAdultFiveWallPeriodicResultV1 {
  const baseFlow = input.baseFlow ?? BASE_FLOW;
  const gradient = input.gradient ?? GRADIENT;
  if (baseFlow.length !== gradient.length) throw new Error("fixture length mismatch");
  const samples = baseFlow.map((_, index) => sample(
    index,
    baseFlow,
    gradient,
  ));
  const valvePreset = composeMainWireFourValveDiseasePresetV1([
    "AR-mild",
    "MR-mild",
    "TR-mild",
    "PR-mild",
  ]);
  return {
    dtSec: 0.1,
    protocolIdentityHash: "fixture-protocol-hash",
    periodicSteadyStateClaimed: input.periodicSteadyStateClaimed,
    valvePreset,
    retainedCompleteBeats: [
      {
        beatIndex: 6,
        startTimeSec: 5.2,
        endTimeSec: 6,
        samples,
      },
      {
        beatIndex: 7,
        startTimeSec: 6,
        endTimeSec: 6.8,
        samples,
      },
    ],
    retainedPartialBeat: [sample(0, [999], [999])],
  } as unknown as MainWireNormalAdultFiveWallPeriodicResultV1;
}

function sample(
  sampleIndex: number,
  baseFlow: readonly number[],
  gradient: readonly number[],
): MainWireNormalAdultFiveWallDiagnosticSampleV2 {
  return {
    valveOpeningFraction01: Object.fromEntries(VALVES.map((valveId) => [
      valveId,
      baseFlow[sampleIndex]! * FLOW_SCALE[valveId] > 0 ? 1 : 0,
    ])),
    valveHydraulics: Object.fromEntries(VALVES.map((valveId) => {
      const flow = baseFlow[sampleIndex]! * FLOW_SCALE[valveId];
      const pressureGradientMmHg = gradient[sampleIndex]!;
      const activeEoaCm2 = flow > 0
        ? 2
        : CLOSED_REVERSE_EROA[valveId];
      return [valveId, valveReadback({
        valveId,
        flowMlPerSec: flow,
        pressureGradientMmHg,
        activeEoaCm2,
        powerBalanceResidualMmHgMlPerSec:
          POWER_RESIDUAL[sampleIndex % POWER_RESIDUAL.length]!,
      })];
    })),
  } as unknown as MainWireNormalAdultFiveWallDiagnosticSampleV2;
}

function valveReadback(input: Readonly<{
  valveId: MainWireValveDiseaseCycleValveIdV1;
  flowMlPerSec: number;
  pressureGradientMmHg: number;
  activeEoaCm2: number;
  powerBalanceResidualMmHgMlPerSec: number;
}>) {
  return Object.freeze({
    physicalAreaCm2: input.activeEoaCm2,
    forwardActiveEoaCm2: input.flowMlPerSec > 0
      ? input.activeEoaCm2
      : CLOSED_REVERSE_EROA[input.valveId],
    closedReverseEroaCm2: CLOSED_REVERSE_EROA[input.valveId],
    activeEoaCm2: input.activeEoaCm2,
    pressureGradientMmHg: input.pressureGradientMmHg,
    flowMlPerSec: input.flowMlPerSec,
    activeDirection: input.flowMlPerSec > 0
      ? "forward" as const
      : input.flowMlPerSec < 0
        ? "reverse" as const
        : "zero-gradient" as const,
    openingTarget01: input.flowMlPerSec > 0 ? 1 : 0,
    openingEquationResidual01: 0,
    resistanceMmHgSecPerMl: 0.01,
    bernoulliMmHgSec2PerMl2: 0.001,
    competentReverseClosureActive: false,
    subthresholdForwardSupportActive: false,
    competentReverseClosureReactionMmHg: 0,
    subthresholdForwardSupportReactionMmHg: 0,
    dissipativePowerProxyMmHgMlPerSec:
      0.01 * input.flowMlPerSec ** 2
      + 0.001 * Math.abs(input.flowMlPerSec) ** 3,
    powerBalanceResidualMmHgMlPerSec:
      input.powerBalanceResidualMmHgMlPerSec,
  });
}

function withTamperedLastBeatValveReadback(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  sampleIndex: number,
  valveId: MainWireValveDiseaseCycleValveIdV1,
  patch: Partial<
    MainWireNormalAdultFiveWallDiagnosticSampleV2["valveHydraulics"][MainWireValveDiseaseCycleValveIdV1]
  >,
): MainWireNormalAdultFiveWallPeriodicResultV1 {
  const lastBeatIndex = result.retainedCompleteBeats.length - 1;
  return {
    ...result,
    retainedCompleteBeats: result.retainedCompleteBeats.map((beat, beatIndex) =>
      beatIndex === lastBeatIndex
        ? {
          ...beat,
          samples: beat.samples.map((currentSample, currentSampleIndex) =>
            currentSampleIndex === sampleIndex
              ? {
                ...currentSample,
                valveHydraulics: {
                  ...currentSample.valveHydraulics,
                  [valveId]: {
                    ...currentSample.valveHydraulics[valveId],
                    ...patch,
                  },
                },
              }
              : currentSample),
        }
        : beat),
  } as MainWireNormalAdultFiveWallPeriodicResultV1;
}
