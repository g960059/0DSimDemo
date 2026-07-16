import { describe, expect, it } from "vitest";

import {
  buildFivePatchPhysiologyEnvelopePlanV2,
  buildFivePatchPhysiologyEnvelopeResolvedRunV2,
  runFivePatchPhysiologyEnvelopeV2,
  selectFivePatchPhysiologyEnvelopeShardV2,
} from "@/engine/mechanics2/envelope/FivePatchPhysiologyEnvelopeRunnerV2";

describe("FivePatchPhysiologyEnvelopeRunnerV2", () => {
  it("exposes only the canonical predeclared plan memberships", () => {
    const readiness = buildFivePatchPhysiologyEnvelopePlanV2(
      "arm-numerical-readiness",
    );
    const screening = buildFivePatchPhysiologyEnvelopePlanV2("screening");
    const stress = buildFivePatchPhysiologyEnvelopePlanV2("stress-validation");
    const dt = buildFivePatchPhysiologyEnvelopePlanV2("dt-refinement");
    const full = buildFivePatchPhysiologyEnvelopePlanV2("full");

    expect(readiness).toHaveLength(4);
    expect(screening).toHaveLength(64);
    expect(stress).toHaveLength(16 * 10);
    expect(dt).toHaveLength(4 * 2);
    expect(full).toHaveLength(64 + 16 * 10 + 4 * 2);
    expect(full).toEqual([...screening, ...stress, ...dt]);
    expect(readiness.map((point) => point.candidateIndex)).toEqual([
      0,
      16,
      32,
      48,
    ]);
    expect(readiness.every((point) =>
      point.phase === "arm-numerical-readiness" &&
      point.scenarioId === "hr60-reference" &&
      point.beats === 1 &&
      point.dtSec === 0.002
    )).toBe(true);
    expect(screening.map((point) => point.candidateIndex)).toEqual(
      Array.from({ length: 64 }, (_, index) => index),
    );
  });

  it("resolves HR and multiplicative scenario overlays without changing coordinates", () => {
    const hr50Request = buildFivePatchPhysiologyEnvelopePlanV2(
      "stress-validation",
    ).find((point) =>
      point.candidateIndex === 4 && point.scenarioId === "hr50-reference"
    )!;
    const hr50 = buildFivePatchPhysiologyEnvelopeResolvedRunV2(hr50Request);
    expect(hr50.request).toEqual(hr50Request);
    expect(hr50.scenarioConfig.scenarioReadback).toMatchObject({
      heartRateBpm: 50,
      cycleLengthSec: 1.2,
      pulmonaryResistanceScale: 1,
      combinedBloodVolumeScale: hr50.parameterVector.bloodVolumeScale,
    });
    expect(hr50.scenarioConfig.scenarioReadback.combinedSystemicResistanceScale)
      .toBeCloseTo(hr50.parameterVector.systemicResistanceScale, 14);
    expect(hr50.scenarioConfig.scenarioReadback.avDelaySec).toBeCloseTo(
      hr50.parameterVector.avDelaySec,
      14,
    );
    expect(hr50.scenarioConfig.params.cycleLengthSec).toBe(1.2);
    expect(hr50.scenarioConfig.params.calciumDrivers.leftAtrium.cycleLengthSec)
      .toBe(1.2);
    expect(hr50.stepCount).toBe(19_200);

    const afterloadRequest = buildFivePatchPhysiologyEnvelopePlanV2(
      "stress-validation",
    ).find((point) =>
      point.candidateIndex === 4 && point.scenarioId === "hr60-afterload-high"
    )!;
    const afterload = buildFivePatchPhysiologyEnvelopeResolvedRunV2(
      afterloadRequest,
    );
    expect(afterload.scenarioConfig.scenarioReadback).toMatchObject({
      heartRateBpm: 60,
      cycleLengthSec: 1,
      combinedBloodVolumeScale: afterload.parameterVector.bloodVolumeScale,
      pulmonaryResistanceScale: 1,
    });
    expect(
      afterload.scenarioConfig.scenarioReadback.combinedSystemicResistanceScale,
    ).toBeCloseTo(afterload.parameterVector.systemicResistanceScale * 1.35, 14);
    expect(afterload.stepCount).toBe(16_000);
    expect(afterload.runId).toContain("candidate-04::hr60-afterload-high");
  });

  it("partitions the canonical full plan deterministically without overlap or loss", () => {
    const plan = buildFivePatchPhysiologyEnvelopePlanV2("full");
    const shardCount = 7;
    const shards = Array.from({ length: shardCount }, (_unused, shardIndex) =>
      selectFivePatchPhysiologyEnvelopeShardV2(plan, {
        shardIndex,
        shardCount,
      })
    );
    for (let shardIndex = 0; shardIndex < shardCount; shardIndex += 1) {
      expect(shards[shardIndex]).toEqual(
        plan.filter((_point, ordinal) => ordinal % shardCount === shardIndex),
      );
      expect(Object.isFrozen(shards[shardIndex])).toBe(true);
    }
    const recombined = shards.flat();
    expect(new Set(recombined.map(requestKey)).size).toBe(plan.length);
    expect(recombined.map(requestKey).sort()).toEqual(
      plan.map(requestKey).sort(),
    );
    expect(() => selectFivePatchPhysiologyEnvelopeShardV2(plan, {
      shardIndex: 2,
      shardCount: 2,
    })).toThrow(/shard/);
  });

  it("runs one readiness coordinate with a closed ledger and report-only V-loop", () => {
    const request = buildFivePatchPhysiologyEnvelopePlanV2(
      "arm-numerical-readiness",
    )[0]!;
    const result = runFivePatchPhysiologyEnvelopeV2(request);

    expect(result.request).toEqual(request);
    expect(result.stepCount).toBe(500);
    expect(result.status).toBe("run-complete");
    expect(result.stepsAttempted).toBe(result.stepCount);
    expect(result.stepsAccepted).toBe(result.stepCount);
    expect(result.maximumAbsoluteBloodVolumeResidualMl).toBeLessThanOrEqual(
      1e-6,
    );
    expect(result.finalTotalBloodVolumeMl).toBeCloseTo(
      result.initialTotalBloodVolumeMl,
      10,
    );
    expect(result.minimumCompartmentVolumeMl).toBeGreaterThan(0);
    expect(result.finalCycleSamples).toHaveLength(500);
    expect(result.retainedRawCycles).toHaveLength(1);
    expect(result.retainedRawCycles[0]).toMatchObject({
      beatNumber: 1,
      complete: true,
    });
    expect(result.retainedRawCycles[0]!.samples).toHaveLength(500);
    expect(result.exactCycleBoundaryStates).toHaveLength(1);

    expect(result.numericalEligibility).toMatchObject({
      policySource: "predeclared-protocol-v2",
      periodicityRequired: false,
      passed: true,
      excludedMetrics: ["v-loop"],
      checks: {
        completedRun: true,
        allAcceptedOutputsFinite: true,
        allCompartmentVolumesPositive: true,
        bloodVolumeLedgerWithinTolerance: true,
        requiredPeriodicityEstablished: true,
      },
    });
    expect(result.reportOnlyRawCycleDiagnostics).toMatchObject({
      evidenceStatus: "report-only-no-physiology-acceptance",
      changesStructuralStatus: false,
      physiologyThresholdsApplied: false,
      scalarWinnerScoreComputed: false,
    });
    expect(result.vLoopUsePolicy).toEqual({
      status: "report-only",
      affectsSettling: false,
      affectsNumericalEligibility: false,
      affectsOperatingPointEligibility: false,
      affectsSelection: false,
      affectsRangeRevision: false,
    });
  }, 60_000);
});

function requestKey(request: {
  readonly phase: string;
  readonly candidateIndex: number;
  readonly scenarioId: string;
  readonly beats: number;
  readonly dtSec: number;
}): string {
  return [
    request.phase,
    request.candidateIndex,
    request.scenarioId,
    request.beats,
    request.dtSec,
  ].join("::");
}
