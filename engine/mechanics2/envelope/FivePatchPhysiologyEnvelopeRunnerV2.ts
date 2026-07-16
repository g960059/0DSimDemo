import {
  summarizeFivePatchRawCycleDiagnosticsV1,
} from "@/engine/mechanics2/diagnostics/FivePatchRawCycleDiagnosticsV1";
import {
  summarizeFivePatchFillingRelaxationDiagnosticsV1,
  type FivePatchBroadOperatingPointBoundsV1,
  type FivePatchFillingRelaxationDiagnosticsV1,
} from "@/engine/mechanics2/diagnostics/FivePatchFillingRelaxationDiagnosticsV1";
import {
  FIVE_PATCH_PHYSIOLOGY_ENVELOPE_DT_REFINEMENT_PLAN_V2,
  FIVE_PATCH_PHYSIOLOGY_ENVELOPE_ELIGIBILITY_POLICY_V2,
  FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_MATRIX_V2,
  FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_V2,
  FIVE_PATCH_PHYSIOLOGY_ENVELOPE_READINESS_PLAN_V2,
  FIVE_PATCH_PHYSIOLOGY_ENVELOPE_SCREENING_PLAN_V2,
  FIVE_PATCH_PHYSIOLOGY_ENVELOPE_STRESS_PLAN_V2,
  FIVE_PATCH_PHYSIOLOGY_ENVELOPE_UNIT_DESIGN_V2,
  fivePatchPhysiologyEnvelopeCandidateIdV2,
  fivePatchPhysiologyEnvelopeParametersAtIndexV2,
  type FivePatchPhysiologyEnvelopeParameterVectorV2,
  type FivePatchPhysiologyEnvelopePlanPointV2,
  type FivePatchPhysiologyEnvelopeScenarioV2,
} from "@/engine/mechanics2/envelope/FivePatchPhysiologyEnvelopeDefinitionV2";
import {
  applyFivePatchPhysiologyEnvelopeScenarioV2,
  buildFivePatchPhysiologyEnvelopeConfigV2,
  type FivePatchPhysiologyEnvelopeScenarioConfigV2,
} from "@/engine/mechanics2/envelope/FivePatchPhysiologyEnvelopeParameterApplicationV2";
import {
  FivePatchEnvelopeCycleEndpointRingV1,
  assessFivePatchEnvelopePeriodicityV1,
  fivePatchEnvelopeCalciumAmplitudeScaleAtBeatV1,
  type FivePatchEnvelopeAcceptedStepSampleV1,
  type FivePatchEnvelopePeriodicityAssessmentV1,
  type FivePatchEnvelopeRetainedRawCycleV1,
} from "@/engine/mechanics2/envelope/FivePatchModelEnvelopeRunnerV1";
import {
  initialNoAvpdFivePatchLandTriSegStateV1,
  noAvpdFivePatchLandParameterIdentityV1,
  stepNoAvpdFivePatchLandTriSegV1,
  totalBloodVolumeMl,
  type NoAvpdFivePatchLandTriSegStateV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFivePatchLandTriSegV1";

export const FIVE_PATCH_PHYSIOLOGY_ENVELOPE_RUNNER_ID_V2 =
  "five-patch-physiology-envelope-runner-v2" as const;

export type FivePatchPhysiologyEnvelopePlanSelectionV2 =
  | FivePatchPhysiologyEnvelopePlanPointV2["phase"]
  | "full";

export type FivePatchPhysiologyEnvelopeShardV2 = {
  readonly shardIndex: number;
  readonly shardCount: number;
};

export type FivePatchPhysiologyEnvelopeResolvedRunV2 = {
  readonly runnerId: typeof FIVE_PATCH_PHYSIOLOGY_ENVELOPE_RUNNER_ID_V2;
  readonly protocolId: typeof FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_V2.protocolId;
  readonly runId: string;
  readonly request: FivePatchPhysiologyEnvelopePlanPointV2;
  readonly stepCount: number;
  readonly candidateId: string;
  readonly unitPoint: readonly number[];
  readonly parameterVector: FivePatchPhysiologyEnvelopeParameterVectorV2;
  readonly scenarioConfig: FivePatchPhysiologyEnvelopeScenarioConfigV2;
  readonly parameterIdentityCanonicalJson: string;
};

export type FivePatchPhysiologyNumericalEligibilityV2 = {
  readonly policySource: "predeclared-protocol-v2";
  readonly periodicityRequired: boolean;
  readonly checks: {
    readonly completedRun: boolean;
    readonly allAcceptedOutputsFinite: boolean;
    readonly allCompartmentVolumesPositive: boolean;
    readonly bloodVolumeLedgerWithinTolerance: boolean;
    readonly requiredPeriodicityEstablished: boolean;
  };
  readonly passed: boolean;
  readonly failureReasons: readonly string[];
  readonly excludedMetrics: readonly ["v-loop"];
};

export type FivePatchPhysiologyEnvelopeRunResultV2 = {
  readonly runnerId: typeof FIVE_PATCH_PHYSIOLOGY_ENVELOPE_RUNNER_ID_V2;
  readonly protocolId: typeof FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_V2.protocolId;
  readonly runId: string;
  readonly request: FivePatchPhysiologyEnvelopePlanPointV2;
  readonly stepCount: number;
  readonly candidateId: string;
  readonly unitPoint: readonly number[];
  readonly parameterVector: FivePatchPhysiologyEnvelopeParameterVectorV2;
  readonly effectiveAxisReadback:
    FivePatchPhysiologyEnvelopeParameterVectorV2;
  readonly scenarioReadback:
    FivePatchPhysiologyEnvelopeScenarioConfigV2["scenarioReadback"];
  readonly parameterIdentityCanonicalJson: string;
  readonly initialVolumeOverridesMl:
    FivePatchPhysiologyEnvelopeScenarioConfigV2["initialVolumeOverridesMl"];
  readonly status: "run-complete" | "integration-failure";
  readonly stepsAttempted: number;
  readonly stepsAccepted: number;
  readonly failureReasons: readonly string[];
  readonly initialTotalBloodVolumeMl: number;
  readonly finalTotalBloodVolumeMl: number;
  readonly maximumAbsoluteBloodVolumeResidualMl: number;
  readonly minimumCompartmentVolumeMl: number;
  readonly finalTimeSec: number;
  readonly finalCycleSamples: readonly FivePatchEnvelopeAcceptedStepSampleV1[];
  readonly retainedRawCycles: readonly FivePatchEnvelopeRetainedRawCycleV1[];
  readonly exactCycleBoundaryStates:
    readonly NoAvpdFivePatchLandTriSegStateV1[];
  readonly periodicity: FivePatchEnvelopePeriodicityAssessmentV1;
  readonly numericalEligibility: FivePatchPhysiologyNumericalEligibilityV2;
  readonly reportOnlyRawCycleDiagnostics: ReturnType<
    typeof summarizeFivePatchRawCycleDiagnosticsV1
  >;
  readonly fillingRelaxationDiagnostics:
    FivePatchFillingRelaxationDiagnosticsV1;
  readonly vLoopUsePolicy: {
    readonly status: "report-only";
    readonly affectsSettling: false;
    readonly affectsNumericalEligibility: false;
    readonly affectsOperatingPointEligibility: false;
    readonly affectsSelection: false;
    readonly affectsRangeRevision: false;
  };
};

export function buildFivePatchPhysiologyEnvelopePlanV2(
  selection: FivePatchPhysiologyEnvelopePlanSelectionV2,
): readonly FivePatchPhysiologyEnvelopePlanPointV2[] {
  switch (selection) {
    case "arm-numerical-readiness":
      return FIVE_PATCH_PHYSIOLOGY_ENVELOPE_READINESS_PLAN_V2;
    case "screening":
      return FIVE_PATCH_PHYSIOLOGY_ENVELOPE_SCREENING_PLAN_V2;
    case "stress-validation":
      return FIVE_PATCH_PHYSIOLOGY_ENVELOPE_STRESS_PLAN_V2;
    case "dt-refinement":
      return FIVE_PATCH_PHYSIOLOGY_ENVELOPE_DT_REFINEMENT_PLAN_V2;
    case "full":
      return Object.freeze([
        ...FIVE_PATCH_PHYSIOLOGY_ENVELOPE_SCREENING_PLAN_V2,
        ...FIVE_PATCH_PHYSIOLOGY_ENVELOPE_STRESS_PLAN_V2,
        ...FIVE_PATCH_PHYSIOLOGY_ENVELOPE_DT_REFINEMENT_PLAN_V2,
      ]);
  }
}

export function selectFivePatchPhysiologyEnvelopeShardV2<T>(
  requests: readonly T[],
  shard: FivePatchPhysiologyEnvelopeShardV2,
): readonly T[] {
  if (
    !Number.isInteger(shard.shardIndex) ||
    !Number.isInteger(shard.shardCount) ||
    shard.shardCount < 1 ||
    shard.shardIndex < 0 ||
    shard.shardIndex >= shard.shardCount
  ) {
    throw new Error("shard must satisfy 0 <= shardIndex < shardCount");
  }
  return Object.freeze(requests.filter(
    (_request, ordinal) => ordinal % shard.shardCount === shard.shardIndex,
  ));
}

export function buildFivePatchPhysiologyEnvelopeResolvedRunV2(
  request: FivePatchPhysiologyEnvelopePlanPointV2,
): FivePatchPhysiologyEnvelopeResolvedRunV2 {
  validateRequest(request);
  const scenario = requireScenario(request.scenarioId);
  const parameterVector =
    fivePatchPhysiologyEnvelopeParametersAtIndexV2(request.candidateIndex);
  const candidateConfig =
    buildFivePatchPhysiologyEnvelopeConfigV2(parameterVector);
  const scenarioConfig = applyFivePatchPhysiologyEnvelopeScenarioV2(
    candidateConfig,
    scenario,
  );
  const stepCount = exactStepCount(
    scenarioConfig.params.cycleLengthSec,
    request.beats,
    request.dtSec,
  );
  return Object.freeze({
    runnerId: FIVE_PATCH_PHYSIOLOGY_ENVELOPE_RUNNER_ID_V2,
    protocolId: FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_V2.protocolId,
    runId: runId(request),
    request: Object.freeze({ ...request }),
    stepCount,
    candidateId: fivePatchPhysiologyEnvelopeCandidateIdV2(
      request.candidateIndex,
    ),
    unitPoint: Object.freeze([
      ...FIVE_PATCH_PHYSIOLOGY_ENVELOPE_UNIT_DESIGN_V2.points[
        request.candidateIndex
      ]!,
    ]),
    parameterVector,
    scenarioConfig,
    parameterIdentityCanonicalJson:
      noAvpdFivePatchLandParameterIdentityV1(scenarioConfig.params),
  });
}

export function runFivePatchPhysiologyEnvelopeV2(
  request: FivePatchPhysiologyEnvelopePlanPointV2,
): FivePatchPhysiologyEnvelopeRunResultV2 {
  const spec = buildFivePatchPhysiologyEnvelopeResolvedRunV2(request);
  let state = initialNoAvpdFivePatchLandTriSegStateV1(
    spec.scenarioConfig.params,
    spec.scenarioConfig.initialVolumeOverridesMl,
  );
  const initialTotalBloodVolumeMl = totalBloodVolumeMl(state.volumes);
  const endpointsPerCycle = exactStepCount(
    spec.scenarioConfig.params.cycleLengthSec,
    1,
    request.dtSec,
  );
  const endpointRing = new FivePatchEnvelopeCycleEndpointRingV1<
    FivePatchEnvelopeAcceptedStepSampleV1
  >(endpointsPerCycle, 2);
  const exactCycleBoundaryStates: NoAvpdFivePatchLandTriSegStateV1[] = [];
  let stepsAttempted = 0;
  let stepsAccepted = 0;
  let maximumAbsoluteBloodVolumeResidualMl = 0;
  let allAcceptedOutputsFinite = true;
  let failureReasons: readonly string[] = Object.freeze([]);
  let previousLvPressureMmHg: number | null = null;

  for (let step = 0; step < spec.stepCount; step += 1) {
    const beatNumber = Math.floor(step / endpointsPerCycle) + 1;
    const output = stepNoAvpdFivePatchLandTriSegV1(
      state,
      request.dtSec,
      spec.scenarioConfig.params,
      Object.freeze({
        prescribedCalciumPeakAboveDiastolicScale01:
          request.phase === "arm-numerical-readiness"
            ? 1
            : fivePatchEnvelopeCalciumAmplitudeScaleAtBeatV1(beatNumber),
      }),
    );
    stepsAttempted += 1;
    if (!output.accepted || output.evaluation == null) {
      failureReasons = Object.freeze([...output.failureReasons]);
      break;
    }
    state = output.state;
    stepsAccepted += 1;
    maximumAbsoluteBloodVolumeResidualMl = Math.max(
      maximumAbsoluteBloodVolumeResidualMl,
      Math.abs(output.totalBloodVolumeResidualMl ?? Number.POSITIVE_INFINITY),
    );
    const lvPressureMmHg = output.evaluation.pressures.leftVentricleMmHg;
    const lvPressureRateMmHgPerSec = previousLvPressureMmHg == null
      ? null
      : (lvPressureMmHg - previousLvPressureMmHg) / request.dtSec;
    previousLvPressureMmHg = lvPressureMmHg;
    const endpointWithinCycle =
      ((stepsAccepted - 1) % endpointsPerCycle) + 1;
    const sample = Object.freeze({
      acceptedStepIndex: stepsAccepted,
      timeSec: state.timeSec,
      phase01: endpointWithinCycle / endpointsPerCycle,
      volumesMl: Object.freeze({ ...state.volumes }),
      pressuresMmHg: Object.freeze({ ...output.evaluation.pressures }),
      flowsMlPerSec: Object.freeze({ ...output.evaluation.flowReadback }),
      freeCalciumUm: Object.freeze({ ...output.evaluation.freeCalciumUm }),
      activations01: Object.freeze({ ...output.evaluation.activations01 }),
      reportOnlyMechanismReadback: Object.freeze({
        leftAtrium: output.evaluation.leftAtrium.mechanismReadback,
        mitralValve: Object.freeze({
          pressureGradientMmHg:
            output.evaluation.valves.mitral.pressureGradientMmHg,
          openFraction01: output.evaluation.valves.mitral.openFraction01,
        }),
        leftVentricularPressureBackwardDifferenceRateMmHgPerSec:
          lvPressureRateMmHgPerSec,
        leftVentricularPressureDecayRatePositiveMmHgPerSec:
          lvPressureRateMmHgPerSec == null
            ? null
            : Math.max(0, -lvPressureRateMmHgPerSec),
      }),
      totalBloodVolumeResidualMl:
        output.totalBloodVolumeResidualMl ?? Number.NaN,
    } satisfies FivePatchEnvelopeAcceptedStepSampleV1);
    allAcceptedOutputsFinite &&= allNumbersFinite(sample);
    if (endpointRing.push(sample)) {
      exactCycleBoundaryStates.push(state);
      if (exactCycleBoundaryStates.length > 3) {
        exactCycleBoundaryStates.shift();
      }
    }
  }

  const completedRun = stepsAccepted === spec.stepCount;
  const periodicity = assessFivePatchEnvelopePeriodicityV1(
    exactCycleBoundaryStates,
    { runCompleted: completedRun },
  );
  const completedCycles = endpointRing.completedCycleSnapshots();
  const completedBeatCount = Math.floor(stepsAccepted / endpointsPerCycle);
  const firstRetainedBeat = completedBeatCount - completedCycles.length + 1;
  const retainedRawCycles = Object.freeze(completedCycles.map(
    (samples, index) => Object.freeze({
      beatNumber: firstRetainedBeat + index,
      complete: true as const,
      samples,
    }),
  ));
  const ringSnapshot = endpointRing.snapshot(!completedRun);
  const finalCycleSamples = ringSnapshot.endpoints;
  const minimumCompartmentVolumeMl = Math.min(...Object.values(state.volumes));
  const numericalEligibility = numericalEligibilityAssessment(
    request.phase,
    completedRun,
    allAcceptedOutputsFinite,
    minimumCompartmentVolumeMl,
    maximumAbsoluteBloodVolumeResidualMl,
    periodicity,
  );
  const periodicityOption = periodicity.periodicityEstablished == null
    ? {}
    : { periodicityEstablished: periodicity.periodicityEstablished };
  const rawDiagnostics = summarizeFivePatchRawCycleDiagnosticsV1(
    finalCycleSamples,
    spec.scenarioConfig.params.calciumDrivers.leftAtrium.eventOnsetSec /
      spec.scenarioConfig.params.cycleLengthSec,
    periodicityOption,
  );
  const fillingRelaxationDiagnostics =
    summarizeFivePatchFillingRelaxationDiagnosticsV1(
      finalCycleSamples,
      spec.scenarioConfig.params.calciumDrivers.leftAtrium.eventOnsetSec /
        spec.scenarioConfig.params.cycleLengthSec,
      Object.freeze({
        periodicityEstablished:
          periodicity.periodicityEstablished === true,
        numericalEligibility: Object.freeze({
          eligible:
            numericalEligibility.passed &&
            request.phase !== "arm-numerical-readiness",
          source: "five-patch-physiology-envelope-runner-v2",
          failedChecks: Object.freeze([
            ...numericalEligibility.failureReasons,
            ...(request.phase === "arm-numerical-readiness"
              ? ["readiness-phase-has-no-physiology-eligibility-claim"]
              : []),
          ]),
        }),
        broadOperatingPointBounds: broadOperatingPointBounds(),
      }),
    );

  return Object.freeze({
    runnerId: spec.runnerId,
    protocolId: spec.protocolId,
    runId: spec.runId,
    request: spec.request,
    stepCount: spec.stepCount,
    candidateId: spec.candidateId,
    unitPoint: spec.unitPoint,
    parameterVector: spec.parameterVector,
    effectiveAxisReadback: spec.scenarioConfig.effectiveAxisReadback,
    scenarioReadback: spec.scenarioConfig.scenarioReadback,
    parameterIdentityCanonicalJson: spec.parameterIdentityCanonicalJson,
    initialVolumeOverridesMl: spec.scenarioConfig.initialVolumeOverridesMl,
    status: completedRun ? "run-complete" as const : "integration-failure" as const,
    stepsAttempted,
    stepsAccepted,
    failureReasons,
    initialTotalBloodVolumeMl,
    finalTotalBloodVolumeMl: totalBloodVolumeMl(state.volumes),
    maximumAbsoluteBloodVolumeResidualMl,
    minimumCompartmentVolumeMl,
    finalTimeSec: state.timeSec,
    finalCycleSamples,
    retainedRawCycles,
    exactCycleBoundaryStates: Object.freeze([...exactCycleBoundaryStates]),
    periodicity,
    numericalEligibility,
    reportOnlyRawCycleDiagnostics: rawDiagnostics,
    fillingRelaxationDiagnostics,
    vLoopUsePolicy: Object.freeze({
      status: "report-only" as const,
      affectsSettling: false as const,
      affectsNumericalEligibility: false as const,
      affectsOperatingPointEligibility: false as const,
      affectsSelection: false as const,
      affectsRangeRevision: false as const,
    }),
  });
}

function broadOperatingPointBounds(): FivePatchBroadOperatingPointBoundsV1 {
  const policy = FIVE_PATCH_PHYSIOLOGY_ENVELOPE_ELIGIBILITY_POLICY_V2
    .broadOperatingPoint;
  return Object.freeze({
    leftAtrialPressureMmHg: policy.leftAtrialPressureMmHg,
    leftVentricularPeakPressureMmHg:
      policy.leftVentricularPeakPressureMmHg,
    aorticPressureMmHg: policy.aorticPressureMmHg,
    cardiacOutputLPerMin: policy.cardiacOutputLPerMin,
    leftVentricularEjectionFraction:
      policy.leftVentricularEjectionFraction,
    pulmonaryVeinPressureMmHg: policy.pulmonaryVeinPressureMmHg,
    valveReverseFlow: Object.freeze({
      valveIds: Object.freeze(["MV", "AoV", "TV", "PV"] as const),
      maximumReverseVolumeMl: Object.freeze({
        absoluteFloorMl:
          policy.valveReverseFlow.maximumReverseVolumeMl.absoluteFloorMl,
        forwardVolumeFraction:
          policy.valveReverseFlow.maximumReverseVolumeMl.forwardVolumeFraction,
      }),
    }),
  });
}

export function runFivePatchPhysiologyEnvelopeBatchV2(
  requests: readonly FivePatchPhysiologyEnvelopePlanPointV2[],
): readonly FivePatchPhysiologyEnvelopeRunResultV2[] {
  const ids = requests.map(runId);
  if (new Set(ids).size !== ids.length) {
    throw new Error("physiology-envelope batch contains duplicate run IDs");
  }
  return Object.freeze(requests.map(runFivePatchPhysiologyEnvelopeV2));
}

function numericalEligibilityAssessment(
  phase: FivePatchPhysiologyEnvelopePlanPointV2["phase"],
  completedRun: boolean,
  allAcceptedOutputsFinite: boolean,
  minimumCompartmentVolumeMl: number,
  maximumAbsoluteBloodVolumeResidualMl: number,
  periodicity: FivePatchEnvelopePeriodicityAssessmentV1,
): FivePatchPhysiologyNumericalEligibilityV2 {
  const policy = FIVE_PATCH_PHYSIOLOGY_ENVELOPE_ELIGIBILITY_POLICY_V2.numerical;
  const periodicityRequired = policy.periodicity.requiredPhases.includes(phase);
  const checks = Object.freeze({
    completedRun,
    allAcceptedOutputsFinite,
    allCompartmentVolumesPositive: minimumCompartmentVolumeMl > 0,
    bloodVolumeLedgerWithinTolerance:
      maximumAbsoluteBloodVolumeResidualMl <=
      policy.maximumAbsoluteBloodVolumeResidualMl,
    requiredPeriodicityEstablished:
      !periodicityRequired || periodicity.periodicityEstablished === true,
  });
  const failureReasons = Object.freeze(Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name));
  return Object.freeze({
    policySource: "predeclared-protocol-v2" as const,
    periodicityRequired,
    checks,
    passed: failureReasons.length === 0,
    failureReasons,
    excludedMetrics: Object.freeze(["v-loop"] as const),
  });
}

function validateRequest(request: FivePatchPhysiologyEnvelopePlanPointV2): void {
  if (!Number.isInteger(request.candidateIndex) || request.candidateIndex < 0) {
    throw new Error("candidateIndex must be a nonnegative integer");
  }
  if (
    request.candidateIndex >=
      FIVE_PATCH_PHYSIOLOGY_ENVELOPE_UNIT_DESIGN_V2.points.length
  ) {
    throw new Error("candidateIndex is outside the committed unit design");
  }
  if (!Number.isInteger(request.beats) || request.beats < 1) {
    throw new Error("beats must be a positive integer");
  }
  if (!Number.isFinite(request.dtSec) || request.dtSec <= 0) {
    throw new Error("dtSec must be positive and finite");
  }
  requireScenario(request.scenarioId);
}

function requireScenario(
  scenarioId: string,
): FivePatchPhysiologyEnvelopeScenarioV2 {
  const scenario = FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_MATRIX_V2.find(
    (value) => value.scenarioId === scenarioId,
  );
  if (scenario == null) throw new Error(`unknown scenarioId: ${scenarioId}`);
  return scenario;
}

function exactStepCount(
  cycleLengthSec: number,
  beats: number,
  dtSec: number,
): number {
  const raw = cycleLengthSec * beats / dtSec;
  const rounded = Math.round(raw);
  if (Math.abs(raw - rounded) > 1e-9 * Math.max(1, Math.abs(raw))) {
    throw new Error("beats * cycleLengthSec must be exactly divisible by dtSec");
  }
  return rounded;
}

function runId(request: FivePatchPhysiologyEnvelopePlanPointV2): string {
  return [
    FIVE_PATCH_PHYSIOLOGY_ENVELOPE_PROTOCOL_V2.protocolId,
    request.phase,
    `candidate-${String(request.candidateIndex).padStart(2, "0")}`,
    request.scenarioId,
    `dt-${request.dtSec.toFixed(6)}`,
  ].join("::");
}

function allNumbersFinite(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (value == null || typeof value === "string" || typeof value === "boolean") {
    return true;
  }
  if (Array.isArray(value)) return value.every(allNumbersFinite);
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).every(allNumbersFinite);
  }
  return false;
}
