import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  computeCanonicalSha256,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import {
  PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_ACTIVE_STRESS_SCALED_THRESHOLD_V1,
  PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_FREE_CA_FRACTION_V1,
  PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_HYDRAULIC_SCALED_THRESHOLD_V1,
  PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_TRACE_V1_ID,
  buildPhaseB1ProjectSyntheticFiveWallResponseDefinitionV1,
  evaluatePhaseB1ProjectSyntheticFiveWallResponseTraceV1,
  runPhaseB1ProjectSyntheticFiveWallResponseProtocolV1,
  type PhaseB1FiveWallResponseTraceSampleV1,
  type PhaseB1ProjectSyntheticFiveWallResponseDefinitionV1,
  type PhaseB1ProjectSyntheticFiveWallResponseTraceV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticFiveWallResponseProtocolV1";
import {
  buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/phaseB1ProjectSyntheticNormalSinusEventScheduleV1";
import {
  buildPhaseB1SyntheticEventFreeMonolithicCaseV1,
} from "@/engine/myocardium/fourChamberV1/phaseB1/syntheticEventFreeMonolithicCaseV1";
import {
  BLOOD_COMPARTMENT_IDS,
  WALL_IDS,
  type BloodCompartmentId,
  type FourChamberFlowId,
  type FourChamberWallId,
} from "@/engine/myocardium/fourChamberV1/topology/contracts";
import {
  FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1,
} from "@/engine/myocardium/fourChamberV1/hemodynamics/conservativeIncidenceLedgerV1";

describe("Phase B1 project-synthetic five-wall response protocol", () => {
  const schedule =
    buildPhaseB1ProjectSyntheticNormalSinusEventScheduleV1(sha256);
  const candidate = buildPhaseB1SyntheticEventFreeMonolithicCaseV1(
    "off",
    sha256,
  );
  const definition =
    buildPhaseB1ProjectSyntheticFiveWallResponseDefinitionV1({
      schedule,
      wallMaterialBinding: candidate.wallMaterialBinding,
      newtonScaleRegistry: candidate.model.newtonScaleRegistry,
      sha256Hex: sha256,
    });

  it("freezes and hashes the canonical scale-aware windows and honest claim boundary", () => {
    expect(definition.wallOrder).toEqual(WALL_IDS);
    expect(definition.thresholdPolicy).toMatchObject({
      freeCalciumFractionOfOwnedEventAmplitude:
        PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_FREE_CA_FRACTION_V1,
      activeStressScaledThreshold:
        PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_ACTIVE_STRESS_SCALED_THRESHOLD_V1,
      hydraulicScaledThreshold:
        PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_HYDRAULIC_SCALED_THRESHOLD_V1,
      thresholdComparison: "greater-than-or-equal",
    });
    for (const wallId of WALL_IDS) {
      const policy = definition.wallPolicyByWall[wallId];
      expect(policy.freeCalciumWindowStartExclusiveSec)
        .toBe(policy.eventTimeSec);
      expect(policy.freeCalciumWindowEndInclusiveSec)
        .toBe(policy.eventTimeSec + 2 * policy.isolatedUnitPeakTimeSec);
      expect(policy.activeStressWindowEndInclusiveSec)
        .toBe(policy.eventTimeSec + 2 * policy.tauDecaySec);
      expect(policy.freeCalciumIncreaseThresholdUM).toBe(
        policy.eventStrength
          * policy.calciumAmplitudeUM
          * PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_FREE_CA_FRACTION_V1,
      );
      expect(policy.activeStressIncreaseThresholdPa).toBe(
        policy.activeStressScalePa
          * PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_ACTIVE_STRESS_SCALED_THRESHOLD_V1,
      );
    }
    const { contentSha256: _contentSha256, ...payload } = definition;
    expect(definition.contentSha256).toBe(
      computeCanonicalSha256(payload, sha256),
    );
    expect(definition.claimBoundary).toMatchObject({
      positiveClaimAppliesOnlyWhenOverallDetectionPasses: true,
      prescribedCalciumEventOwnershipRequired: true,
      temporallyOrderedLocalMaterialResponseRequired: true,
      bilateralHydraulicExcursionRequired: true,
      perWallEventCausalEffectClaimed: false,
      wallSpecificHemodynamicAttributionClaimed: false,
      physiologicalValidationClaimed: false,
      fullBeatAcceptanceClaimed: false,
      periodicityOrPeriodOneClaimed: false,
      cycleEnergyAcceptanceClaimed: false,
      phaseB1AcceptanceClaimed: false,
      modelCoreOrBrowserRuntimeAdopted: false,
      releaseRuntimeReachable: false,
    });
    expectRecursivelyFrozen(definition);
  });

  it("detects all five ordered local responses and both hydraulic sides", () => {
    const response = evaluateTrace(definition);
    expect(response.everyWallEventOwnershipVerified).toBe(true);
    expect(response.everyWallFreeCalciumResponseDetected).toBe(true);
    expect(response.everyWallTemporallyOrderedActiveStressResponseDetected)
      .toBe(true);
    expect(response.everyWallLocalScaleSeparatedResponseDetected).toBe(true);
    expect(response.bilateralHydraulicResponseDetected).toBe(true);
    expect(response.scaleSeparatedResponseMetricsPass)
      .toBe(true);
    expect(response.sourceRunnerProvenanceCertified).toBe(false);
    expect(response.projectSyntheticFiveWallEventTrainScaleSeparatedResponseDetected)
      .toBe(false);
    for (const wallId of WALL_IDS) {
      const wall = response.wallResultByWall[wallId];
      expect(wall.maximumTemporallyOrderedActiveStressIncreasePa)
        .toBeGreaterThanOrEqual(wall.activeStressIncreaseThresholdPa);
      expect(Number.isFinite(
        wall.maximumTemporallyOrderedActiveStressIncreasePa,
      )).toBe(true);
      expect(wall.perWallCausalEffectClaimed).toBe(false);
    }
    expect(response).toMatchObject({
      perWallEventCausalEffectClaimed: false,
      wallSpecificHemodynamicAttributionClaimed: false,
      physiologicalValidationClaimed: false,
      fullBeatAcceptanceClaimed: false,
      periodicityOrPeriodOneClaimed: false,
      cycleEnergyAcceptanceClaimed: false,
      phaseB1AcceptanceClaimed: false,
      releaseRuntimeReachable: false,
    });
    expectRecursivelyFrozen(response);
  });

  it.each(WALL_IDS)(
    "rejects a subthreshold owned free-calcium response for %s",
    (wallId) => {
      const response = evaluateTrace(definition, {
        freeFactorByWall: { [wallId]: 0.99 },
      });
      expect(response.wallResultByWall[wallId].freeCalciumResponseDetected)
        .toBe(false);
      expect(response.wallResultByWall[wallId]
        .maximumTemporallyOrderedActiveStressIncreasePa).toBe(0);
      expect(response.scaleSeparatedResponseMetricsPass)
        .toBe(false);
    },
  );

  it.each(WALL_IDS)(
    "rejects a subthreshold temporally ordered active-stress response for %s",
    (wallId) => {
      const response = evaluateTrace(definition, {
        activeFactorByWall: { [wallId]: 0.99 },
      });
      expect(response.wallResultByWall[wallId]
        .temporallyOrderedActiveStressResponseDetected).toBe(false);
      expect(response.wallResultByWall[wallId]
        .localScaleSeparatedResponseDetected).toBe(false);
      expect(response.scaleSeparatedResponseMetricsPass)
        .toBe(false);
    },
  );

  it("uses an open event boundary and closed free-calcium window end", () => {
    const wallId = "LA";
    const policy = definition.wallPolicyByWall[wallId];
    const atOpenStart = evaluateTrace(definition, {
      freeTimeByWall: { [wallId]: policy.eventTimeSec },
    });
    expect(atOpenStart.wallResultByWall[wallId].freeCalciumResponseDetected)
      .toBe(false);

    const atClosedEnd = evaluateTrace(definition, {
      freeTimeByWall: {
        [wallId]: policy.freeCalciumWindowEndInclusiveSec,
      },
      activeTimeByWall: {
        [wallId]: policy.freeCalciumWindowEndInclusiveSec,
      },
    });
    expect(atClosedEnd.wallResultByWall[wallId]
      .firstFreeCalciumThresholdCrossingTimeSec)
      .toBe(policy.freeCalciumWindowEndInclusiveSec);
    expect(atClosedEnd.wallResultByWall[wallId]
      .localScaleSeparatedResponseDetected).toBe(true);

    const afterClosedEnd = evaluateTrace(definition, {
      freeTimeByWall: {
        [wallId]: policy.freeCalciumWindowEndInclusiveSec + 1e-6,
      },
    });
    expect(afterClosedEnd.wallResultByWall[wallId]
      .freeCalciumResponseDetected).toBe(false);
  });

  it("uses the free-calcium crossing as the temporal gate for active stress", () => {
    const wallId = "SEP";
    const policy = definition.wallPolicyByWall[wallId];
    const response = evaluateTrace(definition, {
      activeTimeByWall: {
        [wallId]: policy.eventTimeSec
          + policy.isolatedUnitPeakTimeSec / 2,
      },
    });
    expect(response.wallResultByWall[wallId].freeCalciumResponseDetected)
      .toBe(true);
    expect(response.wallResultByWall[wallId]
      .maximumTemporallyOrderedActiveStressIncreasePa).toBe(0);
    expect(response.wallResultByWall[wallId]
      .temporallyOrderedActiveStressResponseDetected).toBe(false);
  });

  it("uses a closed active-stress end and rejects a response after it", () => {
    const wallId = "RVFW";
    const policy = definition.wallPolicyByWall[wallId];
    const atEnd = evaluateTrace(definition, {
      activeTimeByWall: {
        [wallId]: policy.activeStressWindowEndInclusiveSec,
      },
    });
    expect(atEnd.wallResultByWall[wallId]
      .temporallyOrderedActiveStressResponseDetected).toBe(true);

    const afterEnd = evaluateTrace(definition, {
      activeTimeByWall: {
        [wallId]: policy.activeStressWindowEndInclusiveSec + 1e-6,
      },
    });
    expect(afterEnd.wallResultByWall[wallId]
      .temporallyOrderedActiveStressResponseDetected).toBe(false);
  });

  it.each([
    ["left flow", { leftFlowFactor: 0.99 }, "leftFlowResponseDetected"],
    ["right flow", { rightFlowFactor: 0.99 }, "rightFlowResponseDetected"],
    ["left volume", { leftVolumeFactor: 0.99 }, "leftVolumeResponseDetected"],
    ["right volume", { rightVolumeFactor: 0.99 }, "rightVolumeResponseDetected"],
  ] as const)("requires the %s hydraulic group", (_label, options, field) => {
    const response = evaluateTrace(definition, options);
    expect(response[field]).toBe(false);
    expect(response.bilateralHydraulicResponseDetected).toBe(false);
    expect(response.scaleSeparatedResponseMetricsPass)
      .toBe(false);
  });

  it("requires the exact owned jump and exact invariance of every other wall", () => {
    const response = evaluateTrace(definition, {
      tamperOtherWallJump: { eventOwner: "LA", otherWall: "RA" },
    });
    expect(response.wallResultByWall.LA.exactOwnedCalciumJumpVerified)
      .toBe(true);
    expect(response.wallResultByWall.LA
      .exactOtherWallCalciumJumpInvarianceVerified).toBe(false);
    expect(response.wallResultByWall.LA.eventOwnershipVerified).toBe(false);
    expect(response.everyWallEventOwnershipVerified).toBe(false);
    expect(response.scaleSeparatedResponseMetricsPass)
      .toBe(false);
  });

  it("rejects rehashed relaxed definitions and schema-widened evaluator input", () => {
    const relaxed = structuredClone(definition) as {
      thresholdPolicy: { hydraulicScaledThreshold: number };
      contentSha256: string;
    } & Record<string, unknown>;
    relaxed.thresholdPolicy.hydraulicScaledThreshold = 0;
    const { contentSha256: _oldHash, ...relaxedPayload } = relaxed;
    relaxed.contentSha256 = computeCanonicalSha256(relaxedPayload, sha256);
    const trace = buildTrace(definition);
    expect(() => evaluatePhaseB1ProjectSyntheticFiveWallResponseTraceV1({
      definition: deepFreeze(relaxed) as unknown as
        PhaseB1ProjectSyntheticFiveWallResponseDefinitionV1,
      trace,
      sha256Hex: sha256,
    })).toThrow(/builder-issued/);
    expect(() => evaluatePhaseB1ProjectSyntheticFiveWallResponseTraceV1({
      definition,
      trace,
      sha256Hex: sha256,
      relaxedThresholdOverride: true,
    } as never)).toThrow(/must contain exactly/);
  });

  it("accepts only a live authenticated canonical runner success", () => {
    expect(() => runPhaseB1ProjectSyntheticFiveWallResponseProtocolV1({
      schedule,
      scheduleRun: {} as never,
      sha256Hex: sha256,
    })).toThrow(/live committed result produced by the canonical runner/);
  });
});

type TraceOptions = Readonly<{
  freeFactorByWall?: Partial<Record<FourChamberWallId, number>>;
  activeFactorByWall?: Partial<Record<FourChamberWallId, number>>;
  freeTimeByWall?: Partial<Record<FourChamberWallId, number>>;
  activeTimeByWall?: Partial<Record<FourChamberWallId, number>>;
  leftFlowFactor?: number;
  rightFlowFactor?: number;
  leftVolumeFactor?: number;
  rightVolumeFactor?: number;
  tamperOtherWallJump?: Readonly<{
    eventOwner: FourChamberWallId;
    otherWall: FourChamberWallId;
  }>;
}>;

function evaluateTrace(
  definition: PhaseB1ProjectSyntheticFiveWallResponseDefinitionV1,
  options: TraceOptions = {},
) {
  return evaluatePhaseB1ProjectSyntheticFiveWallResponseTraceV1({
    definition,
    trace: buildTrace(definition, options),
    sha256Hex: sha256,
  });
}

function buildTrace(
  definition: PhaseB1ProjectSyntheticFiveWallResponseDefinitionV1,
  options: TraceOptions = {},
): PhaseB1ProjectSyntheticFiveWallResponseTraceV1 {
  const freeTimeByWall = wallRecord((wallId) =>
    options.freeTimeByWall?.[wallId]
      ?? definition.wallPolicyByWall[wallId].eventTimeSec
        + definition.wallPolicyByWall[wallId].isolatedUnitPeakTimeSec);
  const activeTimeByWall = wallRecord((wallId) =>
    options.activeTimeByWall?.[wallId] ?? freeTimeByWall[wallId]);
  const times = [...new Set([
    ...WALL_IDS.map((wallId) =>
      definition.wallPolicyByWall[wallId].eventTimeSec),
    ...WALL_IDS.map((wallId) => freeTimeByWall[wallId]),
    ...WALL_IDS.map((wallId) => activeTimeByWall[wallId]),
    definition.interval.endTimeSec,
  ])].sort((left, right) => left - right);
  const initialSample = buildSample(
    definition,
    0,
    definition.interval.startTimeSec,
    freeTimeByWall,
    activeTimeByWall,
    options,
  );
  const committedLeftLimitSamples = times.map((timeSec, index) => buildSample(
    definition,
    index + 1,
    timeSec,
    freeTimeByWall,
    activeTimeByWall,
    options,
  ));
  const eventJumpTraceByWall = wallRecord((eventOwner) => {
    const policy = definition.wallPolicyByWall[eventOwner];
    const before = wallRecord(() => deepFreeze({ r: 0.25, d: 0.5 }));
    const after = wallRecord((wallId) => {
      const ownerDelta = wallId === eventOwner ? policy.eventStrength : 0;
      const otherTamper = options.tamperOtherWallJump?.eventOwner === eventOwner
        && options.tamperOtherWallJump.otherWall === wallId
        ? 1e-12
        : 0;
      return deepFreeze({
        r: before[wallId].r + ownerDelta,
        d: before[wallId].d + ownerDelta + otherTamper,
      });
    });
    return deepFreeze({
      wallId: eventOwner,
      eventKey: policy.eventKey,
      eventTimeSec: policy.eventTimeSec,
      eventStrength: policy.eventStrength,
      calciumByWallAtEndLeftLimit: before,
      calciumByWallAfterEventBatch: after,
    });
  });
  return deepFreeze({
    traceId: PHASE_B1_PROJECT_SYNTHETIC_FIVE_WALL_RESPONSE_TRACE_V1_ID,
    initialSample,
    committedLeftLimitSamples,
    eventJumpTraceByWall,
    sourceIsCommittedRunnerSuccess: false,
    uncommittedRetryAttemptSamplesIncluded: false,
  });
}

function buildSample(
  definition: PhaseB1ProjectSyntheticFiveWallResponseDefinitionV1,
  sampleIndex: number,
  timeSec: number,
  freeTimeByWall: Readonly<Record<FourChamberWallId, number>>,
  activeTimeByWall: Readonly<Record<FourChamberWallId, number>>,
  options: TraceOptions,
): PhaseB1FiveWallResponseTraceSampleV1 {
  const freeCalciumUMByWall = wallRecord((wallId) => {
    const baseline = 0.1;
    return Object.is(timeSec, freeTimeByWall[wallId])
      ? baseline
        + definition.wallPolicyByWall[wallId]
          .freeCalciumIncreaseThresholdUM
          * (options.freeFactorByWall?.[wallId] ?? 1.01)
      : baseline;
  });
  const activeKirchhoffStressPaByWall = wallRecord((wallId) =>
    Object.is(timeSec, activeTimeByWall[wallId])
      ? definition.wallPolicyByWall[wallId].activeStressIncreaseThresholdPa
        * (options.activeFactorByWall?.[wallId] ?? 1.01)
      : 0);
  const atEnd = Object.is(timeSec, definition.interval.endTimeSec);
  const flowScale = definition.hydraulicPolicy.flowScaleM3PerSec;
  const hydraulicThreshold = definition.thresholdPolicy
    .hydraulicScaledThreshold;
  const flowsM3PerSec = flowRecord((flowId) => {
    if (!atEnd) return 0;
    if (flowId === "Q_AoV") {
      return flowScale * hydraulicThreshold
        * (options.leftFlowFactor ?? 1.01);
    }
    if (flowId === "Q_PuV") {
      return flowScale * hydraulicThreshold
        * (options.rightFlowFactor ?? 1.01);
    }
    return 0;
  });
  const bloodVolumesM3 = compartmentRecord((compartmentId) => {
    const scale = definition.hydraulicPolicy
      .bloodVolumeScaleM3ByCompartment[compartmentId];
    if (!atEnd) return scale;
    if (compartmentId === "LV") {
      return scale + scale * hydraulicThreshold
        * (options.leftVolumeFactor ?? 1.01);
    }
    if (compartmentId === "RV") {
      return scale + scale * hydraulicThreshold
        * (options.rightVolumeFactor ?? 1.01);
    }
    return scale;
  });
  return deepFreeze({
    sampleIndex,
    timeSec,
    freeCalciumUMByWall,
    activeKirchhoffStressPaByWall,
    flowsM3PerSec,
    bloodVolumesM3,
  });
}

function wallRecord<Value>(
  build: (wallId: FourChamberWallId) => Value,
): Readonly<Record<FourChamberWallId, Value>> {
  return Object.freeze(Object.fromEntries(WALL_IDS.map((wallId) => [
    wallId,
    build(wallId),
  ]))) as Readonly<Record<FourChamberWallId, Value>>;
}

function flowRecord(
  build: (flowId: FourChamberFlowId) => number,
): Readonly<Record<FourChamberFlowId, number>> {
  return Object.freeze(Object.fromEntries(
    FOUR_CHAMBER_CLOSED_LOOP_FLOW_IDS_V1.map((flowId) => [
      flowId,
      build(flowId),
    ]),
  )) as Readonly<Record<FourChamberFlowId, number>>;
}

function compartmentRecord(
  build: (compartmentId: BloodCompartmentId) => number,
): Readonly<Record<BloodCompartmentId, number>> {
  return Object.freeze(Object.fromEntries(
    BLOOD_COMPARTMENT_IDS.map((compartmentId) => [
      compartmentId,
      build(compartmentId),
    ]),
  )) as Readonly<Record<BloodCompartmentId, number>>;
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function expectRecursivelyFrozen(
  value: unknown,
  seen = new WeakSet<object>(),
): void {
  if (value === null || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value as Record<string, unknown>)) {
    expectRecursivelyFrozen(child, seen);
  }
}

function deepFreeze<Value>(
  value: Value,
  seen = new WeakSet<object>(),
): Value {
  if (value === null || typeof value !== "object" || seen.has(value)) {
    return value;
  }
  seen.add(value);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child, seen);
  }
  return Object.freeze(value);
}
