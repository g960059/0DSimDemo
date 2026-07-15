import { describe, expect, it } from "vitest";

import {
  FIVE_PATCH_MODEL_ENVELOPE_FULL_CYCLE_ARM_READINESS_V1,
  FIVE_PATCH_MODEL_ENVELOPE_BLOOD_VOLUME_ALLOCATION_V1,
  FIVE_PATCH_MODEL_ENVELOPE_PREFLIGHT_POLICY_V1,
  FIVE_PATCH_MODEL_ENVELOPE_SETTLE_AND_ASSESS_V1,
  FivePatchEnvelopeCycleEndpointRingV1,
  assessFivePatchEnvelopePeriodicityV1,
  buildFivePatchEnvelopeParamsFromUnitPointV1,
  buildFivePatchEnvelopeParamsV1,
  buildFivePatchModelEnvelopeArmReadinessPlanV1,
  buildFivePatchModelEnvelopeDtRefinementPlanV1,
  buildFivePatchModelEnvelopeFullProtocolPlanV1,
  buildFivePatchModelEnvelopePreflightPlanV1,
  buildFivePatchModelEnvelopeScreeningPlanV1,
  buildFivePatchModelEnvelopeStressValidationPlanV1,
  classifyFivePatchEnvelopePreflightReadinessV1,
  fivePatchEnvelopeAssessmentRawCycleSamplesV1,
  fivePatchEnvelopeCalciumAmplitudeScaleAtBeatV1,
  fivePatchEnvelopeEffectiveAxisReadbackV1,
  fivePatchEnvelopeVLoopMechanismAttributionV1,
  runFivePatchModelEnvelopePreflightBatchV1,
  selectFivePatchEnvelopeShardV1,
} from "@/engine/mechanics2/envelope/FivePatchModelEnvelopeRunnerV1";
import {
  FIVE_PATCH_MODEL_ENVELOPE_ARM_DESIGNS_V1,
  FIVE_PATCH_MODEL_ENVELOPE_PARAMETER_DIMENSIONS_V1,
  FIVE_PATCH_MODEL_ENVELOPE_PROTOCOL_MATRIX_V1,
  FIVE_PATCH_MODEL_ENVELOPE_SAMPLE_COUNT_V1,
} from "@/engine/mechanics2/envelope/FivePatchModelEnvelopeDefinitionV1";
import {
  createDefaultNoAvpdFivePatchLandTriSegParamsV1,
  initialNoAvpdFivePatchLandTriSegStateV1,
  noAvpdFivePatchLandParameterIdentityV1,
  totalBloodVolumeMl,
} from "@/engine/mechanics2/subsystems/NoAvpdFivePatchLandTriSegV1";

const ALL_PATCH_ARM = "land-equilibrium-passive-sls-all-patch" as const;

describe("FivePatchModelEnvelopeRunnerV1", () => {
  it("maps active axes through the composite homogenization scale without altering Land", () => {
    const base = createDefaultNoAvpdFivePatchLandTriSegParamsV1("all-patch");
    const spec = buildFivePatchEnvelopeParamsV1({
      armId: ALL_PATCH_ARM,
      candidateIndex: 0,
      scenarioId: "hr60-reference",
    });

    expect(spec.params.atria.left.material.activeHomogenizationScale).toBe(
      spec.parameterVector.atrialActiveScale,
    );
    expect(
      spec.params.triSeg.leftFreeWall.material.activeHomogenizationScale,
    ).toBe(spec.parameterVector.ventricularActiveScale);
    expect(spec.params.atria.left.material.active).toEqual(
      base.atria.left.material.active,
    );
    expect(spec.params.triSeg.leftFreeWall.material.active).toEqual(
      base.triSeg.leftFreeWall.material.active,
    );
    expect(
      spec.params.atria.left.material.active.parameterSet.values.Tref,
    ).toBe(base.atria.left.material.active.parameterSet.values.Tref);
    expect(spec.provenance.activeCapacityApplication).toBe(
      "composite-activeHomogenizationScale-not-Land-Tref",
    );
    expect(spec.provenance).toMatchObject({
      settleAndAssessSchedule:
        "fixed-32-beat-ramp-1-to-4-settle-5-to-29-assess-30-to-32",
      calciumRampApplication:
        "exogenous-common-peak-above-diastolic-control-all-five-patches",
      continuousStateTrajectoryAcrossRamp: true,
      resultDependentExtensionAllowed: false,
      morphologyMetricsUsedAsSettlingGate: false,
      sourceStateAcceptedFromAnotherRun: false,
    });
    expect(spec.parameterIdentityCanonicalJson).toBe(
      noAvpdFivePatchLandParameterIdentityV1(spec.params),
    );
  });

  it("has no dead continuous axis in the all-patch mapping", () => {
    const midpoint = Array(16).fill(0.5);
    for (
      let index = 0;
      index < FIVE_PATCH_MODEL_ENVELOPE_PARAMETER_DIMENSIONS_V1.length;
      index += 1
    ) {
      const dimension = FIVE_PATCH_MODEL_ENVELOPE_PARAMETER_DIMENSIONS_V1[index]!;
      const lowPoint = midpoint.slice();
      const highPoint = midpoint.slice();
      lowPoint[index] = 0.25;
      highPoint[index] = 0.75;
      const low = fivePatchEnvelopeEffectiveAxisReadbackV1(
        buildFivePatchEnvelopeParamsFromUnitPointV1({
          armId: ALL_PATCH_ARM,
          candidateIndex: 0,
          scenarioId: "hr60-reference",
          unitPoint: lowPoint,
        }).params,
      );
      const high = fivePatchEnvelopeEffectiveAxisReadbackV1(
        buildFivePatchEnvelopeParamsFromUnitPointV1({
          armId: ALL_PATCH_ARM,
          candidateIndex: 0,
          scenarioId: "hr60-reference",
          unitPoint: highPoint,
        }).params,
      );
      expect(
        high[dimension.dimensionId],
        `dead envelope axis: ${dimension.dimensionId}`,
      ).not.toBe(low[dimension.dimensionId]);
      for (const other of FIVE_PATCH_MODEL_ENVELOPE_PARAMETER_DIMENSIONS_V1) {
        if (other.dimensionId === dimension.dimensionId) continue;
        expect(
          high[other.dimensionId],
          `${dimension.dimensionId} leaked into ${other.dimensionId}`,
        ).toBeCloseTo(low[other.dimensionId], 14);
      }
    }
  });

  it("maps every fixed HR and load scenario to an effective cold-run input", () => {
    const reference = buildFivePatchEnvelopeParamsV1({
      armId: ALL_PATCH_ARM,
      candidateIndex: 0,
      scenarioId: "hr60-reference",
    });
    const hr50 = buildFivePatchEnvelopeParamsV1({
      armId: ALL_PATCH_ARM,
      candidateIndex: 0,
      scenarioId: "hr50-reference",
    });
    const bloodVolumeLow = buildFivePatchEnvelopeParamsV1({
      armId: ALL_PATCH_ARM,
      candidateIndex: 0,
      scenarioId: "hr60-blood-volume-low",
    });
    const bloodVolumeHigh = buildFivePatchEnvelopeParamsV1({
      armId: ALL_PATCH_ARM,
      candidateIndex: 0,
      scenarioId: "hr60-blood-volume-high",
    });
    const afterloadHigh = buildFivePatchEnvelopeParamsV1({
      armId: ALL_PATCH_ARM,
      candidateIndex: 0,
      scenarioId: "hr60-afterload-high",
    });
    const pvrHigh = buildFivePatchEnvelopeParamsV1({
      armId: ALL_PATCH_ARM,
      candidateIndex: 0,
      scenarioId: "hr60-pvr-high",
    });

    expect(reference.params.cycleLengthSec).toBe(1);
    expect(hr50.params.cycleLengthSec).toBe(1.2);
    expect(hr50.params.calciumDrivers.leftAtrium.cycleLengthSec).toBe(1.2);
    expect(Object.keys(bloodVolumeLow.initialVolumeOverridesMl).sort()).toEqual([
      "pulmonaryVeinMl",
      "systemicVeinMl",
    ]);
    expect(Object.keys(bloodVolumeHigh.initialVolumeOverridesMl).sort()).toEqual([
      "pulmonaryVeinMl",
      "systemicVeinMl",
    ]);
    const referenceState = initialNoAvpdFivePatchLandTriSegStateV1(
      reference.params,
      reference.initialVolumeOverridesMl,
    );
    const bloodVolumeLowState = initialNoAvpdFivePatchLandTriSegStateV1(
      bloodVolumeLow.params,
      bloodVolumeLow.initialVolumeOverridesMl,
    );
    const bloodVolumeHighState = initialNoAvpdFivePatchLandTriSegStateV1(
      bloodVolumeHigh.params,
      bloodVolumeHigh.initialVolumeOverridesMl,
    );
    expect(totalBloodVolumeMl(bloodVolumeLowState.volumes)).toBeCloseTo(
      totalBloodVolumeMl(referenceState.volumes) * 0.85,
      12,
    );
    expect(totalBloodVolumeMl(bloodVolumeHighState.volumes)).toBeCloseTo(
      totalBloodVolumeMl(referenceState.volumes) * 1.15,
      12,
    );
    for (const compartment of
      FIVE_PATCH_MODEL_ENVELOPE_BLOOD_VOLUME_ALLOCATION_V1
        .preservedCompartments) {
      expect(bloodVolumeLowState.volumes[compartment]).toBe(
        referenceState.volumes[compartment],
      );
      expect(bloodVolumeHighState.volumes[compartment]).toBe(
        referenceState.volumes[compartment],
      );
    }
    const lowSystemicDelta = bloodVolumeLowState.volumes.systemicVeinMl -
      referenceState.volumes.systemicVeinMl;
    const lowPulmonaryDelta = bloodVolumeLowState.volumes.pulmonaryVeinMl -
      referenceState.volumes.pulmonaryVeinMl;
    expect(lowSystemicDelta / lowPulmonaryDelta).toBeCloseTo(60 / 13, 12);
    expect(afterloadHigh.params.vascular.systemicResistanceMmHgSecPerMl).toBe(
      reference.params.vascular.systemicResistanceMmHgSecPerMl * 1.35,
    );
    expect(pvrHigh.params.vascular.pulmonaryResistanceMmHgSecPerMl).toBe(
      reference.params.vascular.pulmonaryResistanceMmHgSecPerMl * 1.5,
    );
  });

  it("partitions the canonical preflight plan without overlap or loss", () => {
    const plan = buildFivePatchModelEnvelopePreflightPlanV1();
    expect(plan).toHaveLength(12);
    const shards = [0, 1, 2].flatMap((shardIndex) =>
      selectFivePatchEnvelopeShardV1(plan, { shardIndex, shardCount: 3 })
    );
    expect(new Set(shards.map(requestKey)).size).toBe(plan.length);
    expect(shards.map(requestKey).sort()).toEqual(
      plan.map(requestKey).sort(),
    );
  });

  it("cold-initializes the complete arm by point by scenario Cartesian envelope", () => {
    let initialized = 0;
    for (const arm of FIVE_PATCH_MODEL_ENVELOPE_ARM_DESIGNS_V1) {
      for (
        let candidateIndex = 0;
        candidateIndex < FIVE_PATCH_MODEL_ENVELOPE_SAMPLE_COUNT_V1;
        candidateIndex += 1
      ) {
        for (const scenario of FIVE_PATCH_MODEL_ENVELOPE_PROTOCOL_MATRIX_V1) {
          const spec = buildFivePatchEnvelopeParamsV1({
            armId: arm.armId,
            candidateIndex,
            scenarioId: scenario.scenarioId,
          });
          const state = initialNoAvpdFivePatchLandTriSegStateV1(
            spec.params,
            spec.initialVolumeOverridesMl,
          );
          expect(state.parameterIdentityCanonicalJson).toBe(
            spec.parameterIdentityCanonicalJson,
          );
          expect(state.triSegGeneralizedForceMapping).toBe(
            "full-fiber-energy-gradient",
          );
          initialized += 1;
        }
      }
    }
    expect(initialized).toBe(3 * 64 * 10);
  }, 30_000);

  it("exposes every precommitted full-cycle phase without executing it", () => {
    const readiness = buildFivePatchModelEnvelopeArmReadinessPlanV1();
    const screening = buildFivePatchModelEnvelopeScreeningPlanV1();
    const stress = buildFivePatchModelEnvelopeStressValidationPlanV1();
    const dtRefinement = buildFivePatchModelEnvelopeDtRefinementPlanV1();
    const full = buildFivePatchModelEnvelopeFullProtocolPlanV1();

    expect(readiness).toHaveLength(3);
    expect(screening).toHaveLength(3 * 64);
    expect(stress).toHaveLength(3 * 16 * 10);
    expect(dtRefinement).toHaveLength(3 * 4 * 2);
    expect(full).toHaveLength(3 * 64 + 3 * 16 * 10 + 3 * 4 * 2);
    expect(full.every((request) => request.beats === 32)).toBe(true);
    expect([...readiness, ...screening, ...stress, ...dtRefinement].every(
      (request) => request.retainEveryEndpointOfFinalCycle,
    )).toBe(true);
    expect(full.every((request) =>
      request.stepCount === Math.round(
        request.beats *
          (60 / scenarioHeartRate(request.scenarioId)) /
          request.dtSec,
      )
    )).toBe(true);
    expect(readiness.every((request) =>
      request.phase === "arm-readiness" &&
      request.beats === 1 &&
      request.stepCount === 200
    )).toBe(true);
    expect(FIVE_PATCH_MODEL_ENVELOPE_SETTLE_AND_ASSESS_V1).toMatchObject({
      appliesToPhases: ["screening", "stress-validation", "dt-refinement"],
      singleContinuousRun: true,
      resultDependentExtensionAllowed: false,
      calciumAmplitudeRamp: {
        beatNumbers: [1, 2, 3, 4],
        commonMultipliers: [0.25, 0.5, 0.75, 1],
      },
      discardSettleBeatNumbersInclusive: [5, 29],
      assessmentBeatNumbersInclusive: [30, 32],
      retainedAssessmentCycleBoundaryStateCount: 3,
      retainedRawCycleCount: 2,
      consecutiveFullStateReturnMapCount: 2,
      returnMapMaxAbsDimensionlessTolerance: 1e-4,
      evaluationPolicy:
        "completed-32-beat-run-and-both-consecutive-full-state-return-maps-pass",
      morphologyMetricsRole: "report-only-never-a-settling-gate",
    });
    expect(Array.from({ length: 7 }, (_unused, index) =>
      fivePatchEnvelopeCalciumAmplitudeScaleAtBeatV1(index + 1)
    )).toEqual([0.25, 0.5, 0.75, 1, 1, 1, 1]);

    const shards = Array.from({ length: 7 }, (_unused, shardIndex) =>
      selectFivePatchEnvelopeShardV1(full.slice().reverse(), {
        shardIndex,
        shardCount: 7,
      })
    ).flat();
    expect(new Set(shards.map(protocolRequestKey)).size).toBe(full.length);
    expect(shards.map(protocolRequestKey).sort()).toEqual(
      full.map(protocolRequestKey).sort(),
    );
  });

  it("is order-invariant and cold-starts every bounded preflight run", () => {
    const requests = [
      {
        armId: "land-equilibrium-passive-sls-off" as const,
        candidateIndex: 0,
        scenarioId: "hr60-reference",
        dtSec: 0.005,
        stepCount: 1,
      },
      {
        armId: "land-equilibrium-passive-sls-all-patch" as const,
        candidateIndex: 16,
        scenarioId: "hr60-reference",
        dtSec: 0.005,
        stepCount: 1,
      },
    ];
    const forward = runFivePatchModelEnvelopePreflightBatchV1(requests);
    const reversed = runFivePatchModelEnvelopePreflightBatchV1(
      requests.slice().reverse(),
    );
    expect(reversed).toEqual(forward);
    expect(forward.every((result) =>
      result.initialization === "independent-cold-start"
    )).toBe(true);
    expect(forward.every((result) =>
      result.parameterIdentityCanonicalJson.length > 0
    )).toBe(true);
    expect(forward.every((result) =>
      result.finalCycleSamples.length === 0 &&
      result.periodicity.status === "not-applicable-bounded-preflight"
    )).toBe(true);
  }, 20_000);

  it("keeps numerical readiness separate from physiology and model selection", () => {
    expect(classifyFivePatchEnvelopePreflightReadinessV1(1, 1)).toEqual({
      status: "preflight-complete",
      contributesToPhysiologyOrModelClassPassFraction: false,
      interpretation:
        "numerical-readiness-only-not-physiology-morphology-or-model-class-rejection",
    });
    expect(classifyFivePatchEnvelopePreflightReadinessV1(0, 1)).toMatchObject({
      status: "numerical-failure",
      contributesToPhysiologyOrModelClassPassFraction: false,
    });
    expect(FIVE_PATCH_MODEL_ENVELOPE_PREFLIGHT_POLICY_V1)
      .toMatchObject({
        outcomeDependentBatchStoppingAllowed: false,
        resultInterpretation:
          "numerical-readiness-only-not-physiology-morphology-or-model-class-rejection",
      });
    expect(FIVE_PATCH_MODEL_ENVELOPE_FULL_CYCLE_ARM_READINESS_V1)
      .toMatchObject({
        candidateIndices: [0],
        scenarioIds: ["hr60-reference"],
        beats: 1,
        dtSec: 0.005,
        requiredBeforeFullEnvelope: true,
        status: "not-run",
      });
  });

  it("keeps V-loop mechanism traces report-only and defers matched-volume subtraction", () => {
    expect(fivePatchEnvelopeVLoopMechanismAttributionV1([])).toEqual({
      role:
        "report-only-no-score-ranking-gate-smoothing-or-reference-fitting",
      retainedRawTraceStatus: "unavailable",
      retainedRawSampleCount: 0,
      pressureComponentSource:
        "same-one-fiber-work-conjugate-map-as-la-cavity-equation",
      leftVentricularRelaxationReadback:
        "accepted-endpoint-backward-pressure-difference-not-fitted-tau",
      matchedVolumeReservoirMinusConduit: {
        status: "deferred-no-interpolation",
        reason:
          "raw-endpoint-reservoir-and-conduit-volumes-do-not-generally-form-exact-matched-volume-pairs",
      },
    });
    expect(
      fivePatchEnvelopeVLoopMechanismAttributionV1([
        {} as never,
        {} as never,
      ]),
    ).toMatchObject({
      retainedRawTraceStatus: "available",
      retainedRawSampleCount: 2,
      matchedVolumeReservoirMinusConduit: {
        status: "deferred-no-interpolation",
      },
    });
  });

  it("retains only the latest complete cycle or the current failed-cycle prefix", () => {
    const ring = new FivePatchEnvelopeCycleEndpointRingV1<string>(3);
    expect(ring.push("a")).toBe(false);
    expect(ring.push("b")).toBe(false);
    expect(ring.push("c")).toBe(true);
    expect(ring.push("d")).toBe(false);
    expect(ring.push("e")).toBe(false);
    expect(ring.push("f")).toBe(true);
    expect(ring.snapshot(false)).toEqual({
      endpoints: ["d", "e", "f"],
      retainedCycleKind: "latest-complete-cycle",
    });
    ring.push("g");
    ring.push("h");
    expect(ring.snapshot(true)).toEqual({
      endpoints: ["g", "h"],
      retainedCycleKind: "partial-current-cycle-at-failure",
    });
    expect(ring.push("i")).toBe(true);
    expect(ring.snapshot(false)).toEqual({
      endpoints: ["g", "h", "i"],
      retainedCycleKind: "latest-complete-cycle",
    });
  });

  it("retains the last two complete raw cycles without changing the current-cycle failure readback", () => {
    const ring = new FivePatchEnvelopeCycleEndpointRingV1<string>(2, 2);
    for (const endpoint of ["1a", "1b", "2a", "2b", "3a", "3b"]) {
      ring.push(endpoint);
    }
    expect(ring.completedCycleSnapshots()).toEqual([
      ["2a", "2b"],
      ["3a", "3b"],
    ]);
    ring.push("4a");
    expect(ring.snapshot(true)).toEqual({
      endpoints: ["4a"],
      retainedCycleKind: "partial-current-cycle-at-failure",
    });
    expect(ring.completedCycleSnapshots()).toEqual([
      ["2a", "2b"],
      ["3a", "3b"],
    ]);
  });

  it("requires two consecutive passing return maps and completed execution", () => {
    const params = createDefaultNoAvpdFivePatchLandTriSegParamsV1("all-patch");
    const first = initialNoAvpdFivePatchLandTriSegStateV1(params);
    const second = { ...first, timeSec: first.timeSec + 1 };
    const third = { ...second, timeSec: second.timeSec + 1 };
    const incomplete = assessFivePatchEnvelopePeriodicityV1(
      [first, second, third],
      { runCompleted: false },
    );
    expect(incomplete.consecutiveNormalizedReturnMaps).toHaveLength(2);
    expect(incomplete.normalizedReturnMap).toMatchObject({
      maxAbsDimensionless: 0,
      allComponentsFinite: true,
    });
    expect(incomplete.bothConsecutiveReturnMapsPass).toBe(true);
    expect(incomplete.evaluationEligible).toBe(false);
    expect(incomplete.periodicityEstablished).toBe(false);
    expect(incomplete.status).toBe("not-established");

    const completed = assessFivePatchEnvelopePeriodicityV1(
      [first, second, third],
      { runCompleted: true },
    );
    expect(completed.bothConsecutiveReturnMapsPass).toBe(true);
    expect(completed.evaluationEligible).toBe(true);
    expect(completed.periodicityEstablished).toBe(true);
    expect(completed.status).toBe("established");
    expect(completed.maxAbsDimensionlessTolerance).toBe(1e-4);
    expect(completed.morphologyMetricsUsedAsSettlingGate).toBe(false);

    const drifted = {
      ...third,
      timeSec: third.timeSec + 1,
      volumes: {
        ...third.volumes,
        leftAtriumMl: third.volumes.leftAtriumMl + 1,
      },
    };
    const oneMapFailed = assessFivePatchEnvelopePeriodicityV1(
      [second, third, drifted],
      { runCompleted: true },
    );
    expect(oneMapFailed.consecutiveNormalizedReturnMaps[0]!.maxAbsDimensionless)
      .toBe(0);
    expect(oneMapFailed.consecutiveNormalizedReturnMaps[1]!.maxAbsDimensionless)
      .toBeGreaterThan(1e-4);
    expect(oneMapFailed.bothConsecutiveReturnMapsPass).toBe(false);
    expect(oneMapFailed.evaluationEligible).toBe(false);
    expect(oneMapFailed.status).toBe("not-established");

    const onlyOneMap = assessFivePatchEnvelopePeriodicityV1(
      [first, second],
      { runCompleted: true },
    );
    expect(onlyOneMap.evaluationEligible).toBe(false);
    expect(onlyOneMap.status).toBe(
      "unavailable-fewer-than-three-exact-cycle-boundaries",
    );
    expect(() => assessFivePatchEnvelopePeriodicityV1(
      [first, second, third],
      {
        runCompleted: true,
        fullStateReturnMapMaxAbsDimensionlessTolerance: 1e-3,
      },
    )).toThrow(/fixed by protocol/);
  });

  it("does not evaluate raw morphology from a pre-assessment cycle", () => {
    const samples = [{ acceptedStepIndex: 1 }] as unknown as Parameters<
      typeof fivePatchEnvelopeAssessmentRawCycleSamplesV1
    >[0][number]["samples"];
    expect(fivePatchEnvelopeAssessmentRawCycleSamplesV1([{
      beatNumber: 29,
      complete: true,
      samples,
    }])).toEqual([]);
    expect(fivePatchEnvelopeAssessmentRawCycleSamplesV1([{
      beatNumber: 31,
      complete: true,
      samples,
    }])).toBe(samples);
  });
});

function requestKey(request: {
  readonly armId: string;
  readonly candidateIndex: number;
  readonly scenarioId: string;
}) {
  return `${request.armId}:${request.candidateIndex}:${request.scenarioId}`;
}

function protocolRequestKey(request: {
  readonly phase: string;
  readonly armId: string;
  readonly candidateIndex: number;
  readonly scenarioId: string;
  readonly dtSec: number;
}) {
  return [
    request.phase,
    request.armId,
    request.candidateIndex,
    request.scenarioId,
    request.dtSec,
  ].join(":");
}

function scenarioHeartRate(scenarioId: string): number {
  if (scenarioId === "hr50-reference") return 50;
  if (scenarioId === "hr75-reference") return 75;
  if (scenarioId === "hr100-reference") return 100;
  return 60;
}
