import type {
  PeriodicPrescribedCalciumDriverParamsV2,
} from "@/engine/mechanics2/activation/PeriodicPrescribedCalciumDriverV2";
import type {
  LandActivePassiveSlsParamsV1,
} from "@/engine/mechanics2/constitutive/LandActivePassiveSlsV1";
import {
  summarizeFivePatchRawCycleDiagnosticsV1,
} from "@/engine/mechanics2/diagnostics/FivePatchRawCycleDiagnosticsV1";
import {
  FIVE_PATCH_MODEL_ENVELOPE_ARM_DESIGNS_V1,
  FIVE_PATCH_MODEL_ENVELOPE_DT_REFINEMENT_INDICES_V1,
  FIVE_PATCH_MODEL_ENVELOPE_PARAMETER_DIMENSIONS_V1,
  FIVE_PATCH_MODEL_ENVELOPE_PROTOCOL_MATRIX_V1,
  FIVE_PATCH_MODEL_ENVELOPE_PROTOCOL_V1,
  FIVE_PATCH_MODEL_ENVELOPE_SAMPLE_COUNT_V1,
  FIVE_PATCH_MODEL_ENVELOPE_UNIT_DESIGN_V1,
  fivePatchEnvelopeCandidateIdV1,
  fivePatchEnvelopeParametersAtIndexV1,
  mapFivePatchEnvelopeUnitPointV1,
  type FivePatchEnvelopeArmIdV1,
  type FivePatchEnvelopeDimensionIdV1,
  type FivePatchEnvelopeParameterVectorV1,
  type FivePatchEnvelopeScenarioV1,
} from "@/engine/mechanics2/envelope/FivePatchModelEnvelopeDefinitionV1";
import {
  createDefaultNoAvpdFivePatchLandTriSegParamsV1,
  initialNoAvpdFivePatchLandTriSegStateV1,
  noAvpdFivePatchLandParameterIdentityV1,
  stepNoAvpdFivePatchLandTriSegV1,
  totalBloodVolumeMl,
  type NoAvpdBloodVolumesV1,
  type NoAvpdFivePatchLandSlsVariantV1,
  type NoAvpdFivePatchLandTriSegStateV1,
  type NoAvpdFivePatchLandTriSegParamsV1,
  type NoAvpdFivePatchLandWallParamsV1,
  type NoAvpdFlowReadbackV1,
  type NoAvpdOneFiberWallMechanismReadbackV1,
  type NoAvpdPressureReadbackV1,
  type NoAvpdTriSegWallParamsV1,
} from "@/engine/mechanics2/subsystems/NoAvpdFivePatchLandTriSegV1";

export const FIVE_PATCH_MODEL_ENVELOPE_RUNNER_ID_V1 =
  "five-patch-model-envelope-runner-v1" as const;

export const FIVE_PATCH_MODEL_ENVELOPE_PREFLIGHT_POLICY_V1 = Object.freeze({
  mode: "bounded-preflight-only" as const,
  candidateIndices: FIVE_PATCH_MODEL_ENVELOPE_DT_REFINEMENT_INDICES_V1,
  scenarioId: "hr60-reference" as const,
  defaultDtSec: 0.005,
  defaultStepCount: 1,
  maximumStepCount: 4,
  fullEnvelopeExecutionAvailableFromPreflightApi: false,
  independentColdStartEveryRun: true,
  crossCandidateWarmStartAllowed: false,
  outcomeDependentCandidateSelectionAllowed: false,
  outcomeDependentBatchStoppingAllowed: false,
  resultInterpretation:
    "numerical-readiness-only-not-physiology-morphology-or-model-class-rejection" as const,
});

const committedExecutionPolicy =
  FIVE_PATCH_MODEL_ENVELOPE_PROTOCOL_V1.executionPolicy;

/**
 * Fixed before the envelope is run.  It is deliberately a schedule, not a
 * convergence controller: no result can add beats, change the ramp, or select
 * another starting state.
 */
export const FIVE_PATCH_MODEL_ENVELOPE_SETTLE_AND_ASSESS_V1 = Object.freeze({
  ...committedExecutionPolicy.settleAndAssess,
  calciumAmplitudeRamp: Object.freeze({
    ...committedExecutionPolicy.settleAndAssess.calciumAmplitudeRamp,
  }),
  returnMapMaxAbsDimensionlessTolerance: 1e-4 as const,
  evaluationPolicy:
    "completed-32-beat-run-and-both-consecutive-full-state-return-maps-pass" as const,
  morphologyMetricsRole: "report-only-never-a-settling-gate" as const,
});

export const FIVE_PATCH_MODEL_ENVELOPE_FULL_CYCLE_ARM_READINESS_V1 =
  Object.freeze({
    phase: "arm-readiness" as const,
    selection: committedExecutionPolicy.armNumericalReadiness.selection,
    candidateIndices:
      committedExecutionPolicy.armNumericalReadiness.candidateIndices,
    scenarioIds: committedExecutionPolicy.armNumericalReadiness.scenarioIds,
    beats: committedExecutionPolicy.armNumericalReadiness.beats,
    dtSec: committedExecutionPolicy.armNumericalReadiness.dtSec,
    retainEveryEndpointOfFinalCycle:
      committedExecutionPolicy.armNumericalReadiness
        .retainEveryEndpointOfFinalCycle,
    requiredBeforeFullEnvelope:
      committedExecutionPolicy.armNumericalReadiness.requiredBeforeFullEnvelope,
    status: "not-run" as const,
    failureInterpretation:
      committedExecutionPolicy.armNumericalReadiness.failureInterpretation,
  });

export const FIVE_PATCH_MODEL_ENVELOPE_BLOOD_VOLUME_ALLOCATION_V1 =
Object.freeze({
  meaning: committedExecutionPolicy.bloodVolumeAllocation.meaning,
  mutableCompartments: Object.freeze([
    "systemicVeinMl",
    "pulmonaryVeinMl",
  ] as const),
  systemicVeinWeight:
    committedExecutionPolicy.bloodVolumeAllocation.systemicVeinWeight,
  pulmonaryVeinWeight:
    committedExecutionPolicy.bloodVolumeAllocation.pulmonaryVeinWeight,
  preservedCompartments: Object.freeze([
    "leftAtriumMl",
    "leftVentricleMl",
    "systemicArteryMl",
    "rightAtriumMl",
    "rightVentricleMl",
    "pulmonaryArteryMl",
  ] as const),
  outcomeDependentAllocationAllowed: false,
});

export type FivePatchEnvelopePreflightRequestV1 = {
  readonly armId: FivePatchEnvelopeArmIdV1;
  readonly candidateIndex: number;
  readonly scenarioId: string;
  readonly dtSec: number;
  readonly stepCount: number;
};

export type FivePatchEnvelopeProtocolPhaseV1 =
  | "arm-readiness"
  | "screening"
  | "stress-validation"
  | "dt-refinement";

export type FivePatchEnvelopeProtocolPlanSelectionV1 =
  FivePatchEnvelopeProtocolPhaseV1 | "full";

export type FivePatchEnvelopeProtocolRunRequestV1 = {
  readonly phase: FivePatchEnvelopeProtocolPhaseV1;
  readonly armId: FivePatchEnvelopeArmIdV1;
  readonly candidateIndex: number;
  readonly scenarioId: string;
  readonly beats: number;
  readonly dtSec: number;
  /** Exact integer implied by beats, scenario cycle length, and committed dt. */
  readonly stepCount: number;
  readonly retainEveryEndpointOfFinalCycle: true;
};

export type FivePatchEnvelopeProtocolRunOptionsV1 = {
  /** Compatibility assertion only; the protocol value is fixed at 1e-4. */
  readonly fullStateReturnMapMaxAbsDimensionlessTolerance?: number;
  /** Required evidence for the pure return-map assessor. */
  readonly runCompleted?: boolean;
};

type FivePatchEnvelopeRunCoordinatesV1 = {
  readonly armId: FivePatchEnvelopeArmIdV1;
  readonly candidateIndex: number;
  readonly scenarioId: string;
  readonly dtSec: number;
  readonly stepCount: number;
};

export type FivePatchEnvelopeResolvedRunSpecV1<
  TRequest extends FivePatchEnvelopeRunCoordinatesV1 =
    FivePatchEnvelopePreflightRequestV1,
> = {
  readonly runnerId: typeof FIVE_PATCH_MODEL_ENVELOPE_RUNNER_ID_V1;
  readonly runId: string;
  readonly request: TRequest;
  readonly slsVariant: NoAvpdFivePatchLandSlsVariantV1;
  readonly unitPoint: readonly number[];
  readonly parameterVector: FivePatchEnvelopeParameterVectorV1;
  readonly scenario: FivePatchEnvelopeScenarioV1;
  readonly params: NoAvpdFivePatchLandTriSegParamsV1;
  /** Exact canonical identity returned by the subsystem identity function. */
  readonly parameterIdentityCanonicalJson: string;
  readonly initialVolumeOverridesMl: Partial<NoAvpdBloodVolumesV1>;
  readonly provenance: {
    readonly parameterApplication:
      "all-16-preregistered-axes-applied-to-fresh-default-arm";
    readonly activeCapacityApplication:
      "composite-activeHomogenizationScale-not-Land-Tref";
    readonly bloodVolumeChallengeApplication:
      "exact-total-scale-fixed-60-to-13-compliant-venous-allocation";
    readonly initialization: "independent-cold-start";
    readonly sourceStateAcceptedFromAnotherRun: false;
    readonly settleAndAssessSchedule:
      "fixed-32-beat-ramp-1-to-4-settle-5-to-29-assess-30-to-32";
    readonly calciumRampApplication:
      "exogenous-common-peak-above-diastolic-control-all-five-patches";
    readonly continuousStateTrajectoryAcrossRamp: true;
    readonly resultDependentExtensionAllowed: false;
    readonly morphologyMetricsUsedAsSettlingGate: false;
  };
};

type FivePatchEnvelopeRunMetricsV1 = {
  readonly requestedStepsAttemptedUnlessRejected: number;
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
  readonly cycleEndpointRetention: FivePatchEnvelopeCycleEndpointRetentionV1;
  readonly settleAndAssess: FivePatchEnvelopeSettleAndAssessReadbackV1;
  readonly periodicity: FivePatchEnvelopePeriodicityAssessmentV1;
  readonly reportOnlyRawCycleDiagnostics: ReturnType<
    typeof summarizeFivePatchRawCycleDiagnosticsV1
  >;
  readonly reportOnlyVLoopMechanismAttribution:
    FivePatchEnvelopeVLoopMechanismAttributionV1;
};

export type FivePatchEnvelopeAcceptedStepMechanismReadbackV1 = {
  readonly leftAtrium: NoAvpdOneFiberWallMechanismReadbackV1;
  readonly mitralValve: {
    readonly pressureGradientMmHg: number;
    readonly openFraction01: number;
  };
  /** Backward difference between consecutive accepted global-step endpoints. */
  readonly leftVentricularPressureBackwardDifferenceRateMmHgPerSec:
    number | null;
  /** Positive part of -dP_LV/dt; this is a trace proxy, not a fitted tau. */
  readonly leftVentricularPressureDecayRatePositiveMmHgPerSec: number | null;
};

export type FivePatchEnvelopeAcceptedStepSampleV1 = {
  readonly acceptedStepIndex: number;
  readonly timeSec: number;
  readonly phase01: number;
  readonly volumesMl: NoAvpdBloodVolumesV1;
  readonly pressuresMmHg: NoAvpdPressureReadbackV1;
  readonly flowsMlPerSec: NoAvpdFlowReadbackV1;
  readonly freeCalciumUm: Readonly<Record<string, number>>;
  readonly activations01: Readonly<Record<string, number>>;
  readonly reportOnlyMechanismReadback:
    FivePatchEnvelopeAcceptedStepMechanismReadbackV1;
  readonly totalBloodVolumeResidualMl: number;
};

export type FivePatchEnvelopeVLoopMechanismAttributionV1 = {
  readonly role:
    "report-only-no-score-ranking-gate-smoothing-or-reference-fitting";
  readonly retainedRawTraceStatus: "available" | "unavailable";
  readonly retainedRawSampleCount: number;
  readonly pressureComponentSource:
    "same-one-fiber-work-conjugate-map-as-la-cavity-equation";
  readonly leftVentricularRelaxationReadback:
    "accepted-endpoint-backward-pressure-difference-not-fitted-tau";
  readonly matchedVolumeReservoirMinusConduit: {
    readonly status: "deferred-no-interpolation";
    readonly reason:
      "raw-endpoint-reservoir-and-conduit-volumes-do-not-generally-form-exact-matched-volume-pairs";
  };
};

export type FivePatchEnvelopeRetainedRawCycleV1 = {
  readonly beatNumber: number;
  readonly complete: true;
  readonly samples: readonly FivePatchEnvelopeAcceptedStepSampleV1[];
};

export type FivePatchEnvelopeSettleAndAssessReadbackV1 = {
  readonly applicable: boolean;
  readonly singleContinuousRun: true;
  readonly independentColdStart: true;
  readonly sourceStateAcceptedFromAnotherRun: false;
  readonly resultDependentExtensionAllowed: false;
  readonly calciumAmplitudeRampBeatNumbers: readonly [1, 2, 3, 4];
  readonly calciumAmplitudeRampCommonMultipliers:
    readonly [0.25, 0.5, 0.75, 1];
  readonly discardSettleBeatNumbersInclusive: readonly [5, 29];
  readonly assessmentBeatNumbersInclusive: readonly [30, 32];
  readonly completedRun: boolean;
  readonly retainedRawCycleBeatNumbers: readonly number[];
  readonly rawCycleEvaluationUsesAssessmentWindowOnly: boolean;
  readonly morphologyMetricsUsedAsSettlingGate: false;
  readonly evaluationEligible: boolean;
};

export type FivePatchEnvelopeCycleEndpointRetentionV1 = {
  readonly policy:
    "every-accepted-endpoint-of-final-complete-cycle-or-partial-current-cycle-on-failure";
  readonly exactEndpointsPerCycle: number | null;
  readonly retainedEndpointCount: number;
  readonly retainedCycleKind:
    | "latest-complete-cycle"
    | "partial-current-cycle-at-failure"
    | "bounded-preflight-prefix"
    | "none";
  readonly boundedToAtMostOneCycle: true;
};

export type FivePatchEnvelopeNormalizedReturnMapV1 = {
  readonly componentCount: number;
  readonly maxAbsDimensionless: number;
  readonly rmsDimensionless: number;
  readonly maximumComponentPath: string;
  readonly allComponentsFinite: boolean;
};

export type FivePatchEnvelopePeriodicityAssessmentV1 = {
  readonly exactCycleBoundaryStates:
    readonly NoAvpdFivePatchLandTriSegStateV1[];
  readonly consecutiveNormalizedReturnMaps:
    readonly FivePatchEnvelopeNormalizedReturnMapV1[];
  readonly normalizedReturnMap: FivePatchEnvelopeNormalizedReturnMapV1 | null;
  readonly maxAbsDimensionlessTolerance: number | null;
  readonly toleranceSource: "caller" | "predeclared" | "none";
  readonly periodicityEstablished: boolean | null;
  readonly completedRun: boolean;
  readonly requiredConsecutiveReturnMapCount: 2;
  readonly bothConsecutiveReturnMapsPass: boolean;
  readonly evaluationEligible: boolean;
  readonly morphologyMetricsUsedAsSettlingGate: false;
  readonly status:
    | "established"
    | "not-established"
    | "report-only-unestablished-no-tolerance"
    | "unavailable-fewer-than-three-exact-cycle-boundaries"
    | "not-applicable-bounded-preflight";
};

export type FivePatchEnvelopePreflightResultV1 =
  FivePatchEnvelopeRunMetricsV1 & {
    readonly runnerId: typeof FIVE_PATCH_MODEL_ENVELOPE_RUNNER_ID_V1;
    readonly runId: string;
    readonly request: FivePatchEnvelopePreflightRequestV1;
    readonly slsVariant: NoAvpdFivePatchLandSlsVariantV1;
    readonly parameterVector: FivePatchEnvelopeParameterVectorV1;
    readonly parameterIdentityCanonicalJson: string;
    readonly initialVolumeOverridesMl: Partial<NoAvpdBloodVolumesV1>;
    readonly initialization: "independent-cold-start";
    readonly status: "preflight-complete" | "numerical-failure";
    readonly contributesToPhysiologyOrModelClassPassFraction: false;
  };

export type FivePatchEnvelopeProtocolRunResultV1 =
  FivePatchEnvelopeRunMetricsV1 & {
    readonly runnerId: typeof FIVE_PATCH_MODEL_ENVELOPE_RUNNER_ID_V1;
    readonly runId: string;
    readonly request: FivePatchEnvelopeProtocolRunRequestV1;
    readonly slsVariant: NoAvpdFivePatchLandSlsVariantV1;
    readonly unitPoint: readonly number[];
    readonly parameterVector: FivePatchEnvelopeParameterVectorV1;
    readonly parameterIdentityCanonicalJson: string;
    readonly initialVolumeOverridesMl: Partial<NoAvpdBloodVolumesV1>;
    readonly initialization: "independent-cold-start";
    readonly status: "protocol-run-complete" | "numerical-failure";
    readonly contributesToPhysiologyOrModelClassPassFraction: false;
  };

export type FivePatchEnvelopeShardV1 = {
  readonly shardIndex: number;
  readonly shardCount: number;
};

export class FivePatchEnvelopeCycleEndpointRingV1<T> {
  readonly exactEndpointsPerCycle: number;
  readonly completedCycleRetentionCount: number;
  private currentCycle: T[] = [];
  private latestCompletedCycle: readonly T[] = Object.freeze([]);
  private retainedCompletedCycles: readonly (readonly T[])[] = Object.freeze([]);

  constructor(exactEndpointsPerCycle: number, completedCycleRetentionCount = 1) {
    if (!Number.isInteger(exactEndpointsPerCycle) || exactEndpointsPerCycle < 1) {
      throw new Error("exactEndpointsPerCycle must be a positive integer");
    }
    if (
      !Number.isInteger(completedCycleRetentionCount) ||
      completedCycleRetentionCount < 1
    ) {
      throw new Error("completedCycleRetentionCount must be a positive integer");
    }
    this.exactEndpointsPerCycle = exactEndpointsPerCycle;
    this.completedCycleRetentionCount = completedCycleRetentionCount;
  }

  /** Returns true exactly when this endpoint closes a complete cycle. */
  push(endpoint: T): boolean {
    this.currentCycle.push(endpoint);
    if (this.currentCycle.length < this.exactEndpointsPerCycle) return false;
    if (this.currentCycle.length > this.exactEndpointsPerCycle) {
      throw new Error("cycle endpoint ring exceeded its declared capacity");
    }
    this.latestCompletedCycle = Object.freeze(this.currentCycle.slice());
    this.retainedCompletedCycles = Object.freeze([
      ...this.retainedCompletedCycles,
      this.latestCompletedCycle,
    ].slice(-this.completedCycleRetentionCount));
    this.currentCycle = [];
    return true;
  }

  completedCycleSnapshots(): readonly (readonly T[])[] {
    return this.retainedCompletedCycles;
  }

  snapshot(numericalFailure: boolean): {
    readonly endpoints: readonly T[];
    readonly retainedCycleKind:
      | "latest-complete-cycle"
      | "partial-current-cycle-at-failure"
      | "none";
  } {
    if (numericalFailure && this.currentCycle.length > 0) {
      return Object.freeze({
        endpoints: Object.freeze(this.currentCycle.slice()),
        retainedCycleKind: "partial-current-cycle-at-failure" as const,
      });
    }
    if (this.latestCompletedCycle.length > 0) {
      return Object.freeze({
        endpoints: this.latestCompletedCycle,
        retainedCycleKind: "latest-complete-cycle" as const,
      });
    }
    return Object.freeze({
      endpoints: Object.freeze([]),
      retainedCycleKind: "none" as const,
    });
  }
}

export function assessFivePatchEnvelopePeriodicityV1(
  exactCycleBoundaryStates:
    readonly NoAvpdFivePatchLandTriSegStateV1[],
  options: FivePatchEnvelopeProtocolRunOptionsV1 = {},
): FivePatchEnvelopePeriodicityAssessmentV1 {
  validateFixedReturnMapToleranceAssertion(
    options.fullStateReturnMapMaxAbsDimensionlessTolerance,
  );
  const retainedStates = Object.freeze(
    exactCycleBoundaryStates.slice(
      -FIVE_PATCH_MODEL_ENVELOPE_SETTLE_AND_ASSESS_V1
        .retainedAssessmentCycleBoundaryStateCount,
    ),
  );
  const tolerance = FIVE_PATCH_MODEL_ENVELOPE_SETTLE_AND_ASSESS_V1
    .returnMapMaxAbsDimensionlessTolerance;
  const consecutiveNormalizedReturnMaps = Object.freeze(
    retainedStates.slice(1).map((later, index) =>
      normalizedFivePatchEnvelopeFullStateReturnMapV1(
        retainedStates[index]!,
        later,
      )
    ),
  );
  const normalizedReturnMap = consecutiveNormalizedReturnMaps.at(-1) ?? null;
  const completedRun = options.runCompleted === true;
  const requiredMapCount = FIVE_PATCH_MODEL_ENVELOPE_SETTLE_AND_ASSESS_V1
    .consecutiveFullStateReturnMapCount;
  const bothConsecutiveReturnMapsPass =
    consecutiveNormalizedReturnMaps.length === requiredMapCount &&
    consecutiveNormalizedReturnMaps.every((returnMap) =>
      returnMap.allComponentsFinite &&
      returnMap.maxAbsDimensionless <= tolerance
    );
  const evaluationEligible = completedRun && bothConsecutiveReturnMapsPass;
  if (consecutiveNormalizedReturnMaps.length < requiredMapCount) {
    return Object.freeze({
      exactCycleBoundaryStates: retainedStates,
      consecutiveNormalizedReturnMaps,
      normalizedReturnMap,
      maxAbsDimensionlessTolerance: tolerance,
      toleranceSource: "predeclared" as const,
      periodicityEstablished: null,
      completedRun,
      requiredConsecutiveReturnMapCount: 2 as const,
      bothConsecutiveReturnMapsPass,
      evaluationEligible,
      morphologyMetricsUsedAsSettlingGate: false as const,
      status:
        "unavailable-fewer-than-three-exact-cycle-boundaries" as const,
    });
  }
  return Object.freeze({
    exactCycleBoundaryStates: retainedStates,
    consecutiveNormalizedReturnMaps,
    normalizedReturnMap,
    maxAbsDimensionlessTolerance: tolerance,
    toleranceSource: "predeclared" as const,
    periodicityEstablished: evaluationEligible,
    completedRun,
    requiredConsecutiveReturnMapCount: 2 as const,
    bothConsecutiveReturnMapsPass,
    evaluationEligible,
    morphologyMetricsUsedAsSettlingGate: false as const,
    status: evaluationEligible
      ? "established" as const
      : "not-established" as const,
  });
}

export function normalizedFivePatchEnvelopeFullStateReturnMapV1(
  earlier: NoAvpdFivePatchLandTriSegStateV1,
  later: NoAvpdFivePatchLandTriSegStateV1,
): FivePatchEnvelopeNormalizedReturnMapV1 {
  const left = flattenNumbers(earlier).filter(
    (entry) => entry.path !== "timeSec",
  );
  const right = new Map(
    flattenNumbers(later)
      .filter((entry) => entry.path !== "timeSec")
      .map((entry) => [entry.path, entry.value]),
  );
  let maximum = 0;
  let rmsSum = 0;
  let maximumPath = "";
  let allComponentsFinite = true;
  for (const entry of left) {
    const other = right.get(entry.path);
    if (other == null) {
      throw new Error(`return-map state path missing: ${entry.path}`);
    }
    if (!Number.isFinite(entry.value) || !Number.isFinite(other)) {
      allComponentsFinite = false;
      continue;
    }
    const normalized = Math.abs(other - entry.value) /
      Math.max(1, Math.abs(entry.value), Math.abs(other));
    rmsSum += normalized * normalized;
    if (normalized > maximum) {
      maximum = normalized;
      maximumPath = entry.path;
    }
  }
  return Object.freeze({
    componentCount: left.length,
    maxAbsDimensionless: maximum,
    rmsDimensionless: Math.sqrt(rmsSum / left.length),
    maximumComponentPath: maximumPath,
    allComponentsFinite,
  });
}

export function classifyFivePatchEnvelopePreflightReadinessV1(
  stepsAccepted: number,
  requestedSteps: number,
) {
  validateReadinessCounts(stepsAccepted, requestedSteps);
  return Object.freeze({
    status: stepsAccepted === requestedSteps
      ? "preflight-complete" as const
      : "numerical-failure" as const,
    contributesToPhysiologyOrModelClassPassFraction: false as const,
    interpretation:
      "numerical-readiness-only-not-physiology-morphology-or-model-class-rejection" as const,
  });
}

export function classifyFivePatchEnvelopeProtocolCompletionV1(
  stepsAccepted: number,
  requestedSteps: number,
) {
  validateReadinessCounts(stepsAccepted, requestedSteps);
  return Object.freeze({
    status: stepsAccepted === requestedSteps
      ? "protocol-run-complete" as const
      : "numerical-failure" as const,
    contributesToPhysiologyOrModelClassPassFraction: false as const,
    interpretation:
      "numerical-completion-status-only-no-automatic-physiology-rejection-or-model-selection" as const,
  });
}

export function buildFivePatchEnvelopeParamsV1(input: {
  readonly armId: FivePatchEnvelopeArmIdV1;
  readonly candidateIndex: number;
  readonly scenarioId: string;
}): FivePatchEnvelopeResolvedRunSpecV1 {
  const unitPoint = FIVE_PATCH_MODEL_ENVELOPE_UNIT_DESIGN_V1.points[
    input.candidateIndex
  ];
  if (unitPoint == null) {
    throw new Error("candidateIndex is outside the pre-registered design");
  }
  return buildFivePatchEnvelopeParamsFromUnitPointV1({
    ...input,
    unitPoint,
    parameterVector: fivePatchEnvelopeParametersAtIndexV1(input.candidateIndex),
    dtSec: FIVE_PATCH_MODEL_ENVELOPE_PREFLIGHT_POLICY_V1.defaultDtSec,
    stepCount: FIVE_PATCH_MODEL_ENVELOPE_PREFLIGHT_POLICY_V1.defaultStepCount,
  });
}

export function buildFivePatchEnvelopePreflightSpecV1(
  request: FivePatchEnvelopePreflightRequestV1,
): FivePatchEnvelopeResolvedRunSpecV1 {
  validatePreflightRequest(request);
  return buildResolvedSpec({
    request,
    runId: preflightRunId(request),
    unitPoint: FIVE_PATCH_MODEL_ENVELOPE_UNIT_DESIGN_V1.points[
      request.candidateIndex
    ]!,
    parameterVector: fivePatchEnvelopeParametersAtIndexV1(
      request.candidateIndex,
    ),
  });
}

export function buildFivePatchEnvelopeProtocolSpecV1(
  request: FivePatchEnvelopeProtocolRunRequestV1,
): FivePatchEnvelopeResolvedRunSpecV1<FivePatchEnvelopeProtocolRunRequestV1> {
  validateProtocolRequest(request);
  return buildResolvedSpec({
    request,
    runId: protocolRunId(request),
    unitPoint: FIVE_PATCH_MODEL_ENVELOPE_UNIT_DESIGN_V1.points[
      request.candidateIndex
    ]!,
    parameterVector: fivePatchEnvelopeParametersAtIndexV1(
      request.candidateIndex,
    ),
  });
}

/** Exposed for the no-dead-axis contract; production runs use committed points. */
export function buildFivePatchEnvelopeParamsFromUnitPointV1(input: {
  readonly armId: FivePatchEnvelopeArmIdV1;
  readonly candidateIndex: number;
  readonly scenarioId: string;
  readonly unitPoint: readonly number[];
  readonly parameterVector?: FivePatchEnvelopeParameterVectorV1;
  readonly dtSec?: number;
  readonly stepCount?: number;
}): FivePatchEnvelopeResolvedRunSpecV1 {
  const mappedVector = mapFivePatchEnvelopeUnitPointV1(input.unitPoint);
  if (
    input.parameterVector != null &&
    !equalParameterVectors(input.parameterVector, mappedVector)
  ) {
    throw new Error("parameterVector does not match the supplied unit point");
  }
  const request = Object.freeze({
    armId: input.armId,
    candidateIndex: input.candidateIndex,
    scenarioId: input.scenarioId,
    dtSec: input.dtSec ??
      FIVE_PATCH_MODEL_ENVELOPE_PREFLIGHT_POLICY_V1.defaultDtSec,
    stepCount: input.stepCount ??
      FIVE_PATCH_MODEL_ENVELOPE_PREFLIGHT_POLICY_V1.defaultStepCount,
  });
  validatePreflightRequest(request);
  return buildResolvedSpec({
    request,
    runId: preflightRunId(request),
    unitPoint: input.unitPoint,
    parameterVector: mappedVector,
  });
}

export function fivePatchEnvelopeEffectiveAxisReadbackV1(
  params: NoAvpdFivePatchLandTriSegParamsV1,
): FivePatchEnvelopeParameterVectorV1 {
  const atrial = params.atria.left.material;
  const ventricular = params.triSeg.leftFreeWall.material;
  const atrialCalcium = params.calciumDrivers.leftAtrium;
  const ventricularCalcium = params.calciumDrivers.leftFreeWall;
  return Object.freeze({
    atrialActiveScale: atrial.activeHomogenizationScale,
    ventricularActiveScale: ventricular.activeHomogenizationScale,
    atrialPassiveTangentScale:
      atrial.passiveSls.passive.tangentModulusPa,
    atrialPassiveExponentScale:
      atrial.passiveSls.passive.exponentialSlope,
    ventricularPassiveTangentScale:
      ventricular.passiveSls.passive.tangentModulusPa,
    ventricularPassiveExponentScale:
      ventricular.passiveSls.passive.exponentialSlope,
    atrialSlsModulusOverEquilibriumTangent:
      atrial.passiveSls.sls.modulusPa /
      atrial.passiveSls.passive.tangentModulusPa,
    atrialSlsRelaxationTimeSec:
      atrial.passiveSls.sls.relaxationTimeSec,
    ventricularSlsModulusOverEquilibriumTangent:
      ventricular.passiveSls.sls.modulusPa /
      ventricular.passiveSls.passive.tangentModulusPa,
    ventricularSlsRelaxationTimeSec:
      ventricular.passiveSls.sls.relaxationTimeSec,
    atrialCalciumAmplitudeScale:
      atrialCalcium.calcium.rateTargets[0]!.peakAmplitudeUM,
    atrialCalciumDecayScale:
      atrialCalcium.calcium.rateTargets[0]!.decayHalfTimeSec,
    atrialCalciumOnsetOffsetCycleFraction:
      atrialCalcium.eventOnsetSec / atrialCalcium.cycleLengthSec,
    ventricularCalciumAmplitudeScale:
      ventricularCalcium.calcium.rateTargets[0]!.peakAmplitudeUM,
    ventricularCalciumDecayScale:
      ventricularCalcium.calcium.rateTargets[0]!.decayHalfTimeSec,
    ventricularCalciumOnsetOffsetCycleFraction:
      ventricularCalcium.eventOnsetSec /
      ventricularCalcium.cycleLengthSec,
  });
}

export function buildFivePatchModelEnvelopePreflightPlanV1(input: {
  readonly dtSec?: number;
  readonly stepCount?: number;
} = {}): readonly FivePatchEnvelopePreflightRequestV1[] {
  const dtSec = input.dtSec ??
    FIVE_PATCH_MODEL_ENVELOPE_PREFLIGHT_POLICY_V1.defaultDtSec;
  const stepCount = input.stepCount ??
    FIVE_PATCH_MODEL_ENVELOPE_PREFLIGHT_POLICY_V1.defaultStepCount;
  const requests = FIVE_PATCH_MODEL_ENVELOPE_ARM_DESIGNS_V1.flatMap((arm) =>
    FIVE_PATCH_MODEL_ENVELOPE_PREFLIGHT_POLICY_V1.candidateIndices.map(
      (candidateIndex) => Object.freeze({
        armId: arm.armId,
        candidateIndex,
        scenarioId: FIVE_PATCH_MODEL_ENVELOPE_PREFLIGHT_POLICY_V1.scenarioId,
        dtSec,
        stepCount,
      }),
    )
  );
  requests.forEach(validatePreflightRequest);
  return canonicalRequests(requests);
}

export function buildFivePatchModelEnvelopeArmReadinessPlanV1():
readonly FivePatchEnvelopeProtocolRunRequestV1[] {
  return buildFivePatchModelEnvelopeProtocolPhasePlanV1("arm-readiness");
}

export function buildFivePatchModelEnvelopeScreeningPlanV1():
readonly FivePatchEnvelopeProtocolRunRequestV1[] {
  return buildFivePatchModelEnvelopeProtocolPhasePlanV1("screening");
}

export function buildFivePatchModelEnvelopeStressValidationPlanV1():
readonly FivePatchEnvelopeProtocolRunRequestV1[] {
  return buildFivePatchModelEnvelopeProtocolPhasePlanV1("stress-validation");
}

export function buildFivePatchModelEnvelopeDtRefinementPlanV1():
readonly FivePatchEnvelopeProtocolRunRequestV1[] {
  return buildFivePatchModelEnvelopeProtocolPhasePlanV1("dt-refinement");
}

export function buildFivePatchModelEnvelopeProtocolPhasePlanV1(
  phase: FivePatchEnvelopeProtocolPhaseV1,
): readonly FivePatchEnvelopeProtocolRunRequestV1[] {
  const policy = protocolPolicyForPhase(phase);
  const requests = FIVE_PATCH_MODEL_ENVELOPE_ARM_DESIGNS_V1.flatMap((arm) =>
    policy.candidateIndices.flatMap((candidateIndex) =>
      policy.scenarioIds.flatMap((scenarioId) =>
        policy.dtSec.map((dtSec) => {
          const scenario = requireScenario(scenarioId);
          return Object.freeze({
            phase,
            armId: arm.armId,
            candidateIndex,
            scenarioId,
            beats: policy.beats,
            dtSec,
            stepCount: exactProtocolStepCount(scenario, policy.beats, dtSec),
            retainEveryEndpointOfFinalCycle:
              policy.retainEveryEndpointOfFinalCycle as true,
          });
        })
      )
    )
  );
  requests.forEach(validateProtocolRequest);
  return canonicalRequests(requests);
}

/** Screening, stress validation, and dt refinement; readiness stays separate. */
export function buildFivePatchModelEnvelopeFullProtocolPlanV1():
readonly FivePatchEnvelopeProtocolRunRequestV1[] {
  return canonicalRequests([
    ...buildFivePatchModelEnvelopeScreeningPlanV1(),
    ...buildFivePatchModelEnvelopeStressValidationPlanV1(),
    ...buildFivePatchModelEnvelopeDtRefinementPlanV1(),
  ]);
}

export function selectFivePatchEnvelopeShardV1<T extends
  FivePatchEnvelopeRunCoordinatesV1>(
  requests: readonly T[],
  shard: FivePatchEnvelopeShardV1,
): readonly T[] {
  validateShard(shard);
  const canonical = canonicalRequests(requests);
  return Object.freeze(canonical.filter(
    (_request, ordinal) => ordinal % shard.shardCount === shard.shardIndex,
  ));
}

export function runFivePatchModelEnvelopePreflightV1(
  request: FivePatchEnvelopePreflightRequestV1,
): FivePatchEnvelopePreflightResultV1 {
  const spec = buildFivePatchEnvelopePreflightSpecV1(request);
  const metrics = executeColdRun(spec);
  const readiness = classifyFivePatchEnvelopePreflightReadinessV1(
    metrics.stepsAccepted,
    request.stepCount,
  );
  return Object.freeze({
    runnerId: FIVE_PATCH_MODEL_ENVELOPE_RUNNER_ID_V1,
    runId: spec.runId,
    request: spec.request,
    slsVariant: spec.slsVariant,
    parameterVector: spec.parameterVector,
    parameterIdentityCanonicalJson: spec.parameterIdentityCanonicalJson,
    initialVolumeOverridesMl: spec.initialVolumeOverridesMl,
    initialization: "independent-cold-start" as const,
    ...metrics,
    status: readiness.status,
    contributesToPhysiologyOrModelClassPassFraction: false as const,
  });
}

export function runFivePatchModelEnvelopePreflightBatchV1(
  requests: readonly FivePatchEnvelopePreflightRequestV1[],
): readonly FivePatchEnvelopePreflightResultV1[] {
  const canonical = requireUniqueRunIds(requests, preflightRunId);
  // A failed candidate is retained as data; it never filters or stops siblings.
  return Object.freeze(canonical.map(runFivePatchModelEnvelopePreflightV1));
}

export function runFivePatchModelEnvelopeProtocolRunV1(
  request: FivePatchEnvelopeProtocolRunRequestV1,
  options: FivePatchEnvelopeProtocolRunOptionsV1 = {},
): FivePatchEnvelopeProtocolRunResultV1 {
  const spec = buildFivePatchEnvelopeProtocolSpecV1(request);
  const metrics = executeColdRun(spec, options);
  const completion = classifyFivePatchEnvelopeProtocolCompletionV1(
    metrics.stepsAccepted,
    request.stepCount,
  );
  return Object.freeze({
    runnerId: FIVE_PATCH_MODEL_ENVELOPE_RUNNER_ID_V1,
    runId: spec.runId,
    request: spec.request,
    slsVariant: spec.slsVariant,
    unitPoint: spec.unitPoint,
    parameterVector: spec.parameterVector,
    parameterIdentityCanonicalJson: spec.parameterIdentityCanonicalJson,
    initialVolumeOverridesMl: spec.initialVolumeOverridesMl,
    initialization: "independent-cold-start" as const,
    ...metrics,
    status: completion.status,
    contributesToPhysiologyOrModelClassPassFraction: false as const,
  });
}

export function runFivePatchModelEnvelopeProtocolBatchV1(
  requests: readonly FivePatchEnvelopeProtocolRunRequestV1[],
  options: FivePatchEnvelopeProtocolRunOptionsV1 = {},
): readonly FivePatchEnvelopeProtocolRunResultV1[] {
  const canonical = requireUniqueRunIds(requests, protocolRunId);
  // No candidate-level status changes the committed batch membership or order.
  return Object.freeze(canonical.map((request) =>
    runFivePatchModelEnvelopeProtocolRunV1(request, options)
  ));
}

function buildResolvedSpec<TRequest extends FivePatchEnvelopeRunCoordinatesV1>(
  input: {
    readonly request: TRequest;
    readonly runId: string;
    readonly unitPoint: readonly number[];
    readonly parameterVector: FivePatchEnvelopeParameterVectorV1;
  },
): FivePatchEnvelopeResolvedRunSpecV1<TRequest> {
  const armId = input.request.armId;
  const scenario = requireScenario(input.request.scenarioId);
  const slsVariant = slsVariantForArm(armId);
  const base = createDefaultNoAvpdFivePatchLandTriSegParamsV1(slsVariant);
  const params = applyEnvelopeVectorAndScenario(
    base,
    input.parameterVector,
    scenario,
    armId,
    input.request.candidateIndex,
  );
  const initialVolumeOverridesMl = scenario.bloodVolumeScale === 1
    ? Object.freeze({})
    : venousAllocatedInitialVolumes(scenario.bloodVolumeScale);
  return Object.freeze({
    runnerId: FIVE_PATCH_MODEL_ENVELOPE_RUNNER_ID_V1,
    runId: input.runId,
    request: input.request,
    slsVariant,
    unitPoint: Object.freeze([...input.unitPoint]),
    parameterVector: input.parameterVector,
    scenario,
    params,
    parameterIdentityCanonicalJson:
      noAvpdFivePatchLandParameterIdentityV1(params),
    initialVolumeOverridesMl,
    provenance: Object.freeze({
      parameterApplication:
        "all-16-preregistered-axes-applied-to-fresh-default-arm" as const,
      activeCapacityApplication:
        "composite-activeHomogenizationScale-not-Land-Tref" as const,
      bloodVolumeChallengeApplication:
        "exact-total-scale-fixed-60-to-13-compliant-venous-allocation" as const,
      initialization: "independent-cold-start" as const,
      sourceStateAcceptedFromAnotherRun: false as const,
      settleAndAssessSchedule:
        "fixed-32-beat-ramp-1-to-4-settle-5-to-29-assess-30-to-32" as const,
      calciumRampApplication:
        "exogenous-common-peak-above-diastolic-control-all-five-patches" as const,
      continuousStateTrajectoryAcrossRamp: true as const,
      resultDependentExtensionAllowed: false as const,
      morphologyMetricsUsedAsSettlingGate: false as const,
    }),
  });
}

function executeColdRun(
  spec: FivePatchEnvelopeResolvedRunSpecV1<FivePatchEnvelopeRunCoordinatesV1>,
  options: FivePatchEnvelopeProtocolRunOptionsV1 = {},
): FivePatchEnvelopeRunMetricsV1 {
  // No state can enter this function. Every invocation creates constitutive,
  // calcium, SLS, and hemodynamic state from this immutable spec only.
  let state = initialNoAvpdFivePatchLandTriSegStateV1(
    spec.params,
    spec.initialVolumeOverridesMl,
  );
  const initialTotalBloodVolumeMl = totalBloodVolumeMl(state.volumes);
  let stepsAttempted = 0;
  let stepsAccepted = 0;
  let maximumAbsoluteBloodVolumeResidualMl = 0;
  let failureReasons: readonly string[] = Object.freeze([]);
  const isProtocolRun = "phase" in spec.request;
  const protocolPhase = isProtocolRun ? spec.request.phase : null;
  const settleAndAssessApplicable = protocolPhase != null &&
    FIVE_PATCH_MODEL_ENVELOPE_SETTLE_AND_ASSESS_V1.appliesToPhases.some(
      (phase) => phase === protocolPhase,
    );
  const exactEndpointsPerCycle = isProtocolRun
    ? exactProtocolStepCount(spec.scenario, 1, spec.request.dtSec)
    : null;
  const endpointRing = exactEndpointsPerCycle == null
    ? null
    : new FivePatchEnvelopeCycleEndpointRingV1<
        FivePatchEnvelopeAcceptedStepSampleV1
      >(
        exactEndpointsPerCycle,
        settleAndAssessApplicable
          ? FIVE_PATCH_MODEL_ENVELOPE_SETTLE_AND_ASSESS_V1
            .retainedRawCycleCount
          : 1,
      );
  const exactCycleBoundaryStates: NoAvpdFivePatchLandTriSegStateV1[] = [];
  let previousAcceptedLeftVentricularPressureMmHg: number | null = null;
  for (let step = 0; step < spec.request.stepCount; step += 1) {
    const beatNumber = exactEndpointsPerCycle == null
      ? 1
      : Math.floor(step / exactEndpointsPerCycle) + 1;
    const amplitudeScale = settleAndAssessApplicable
      ? fivePatchEnvelopeCalciumAmplitudeScaleAtBeatV1(beatNumber)
      : 1;
    const output = stepNoAvpdFivePatchLandTriSegV1(
      state,
      spec.request.dtSec,
      spec.params,
      Object.freeze({
        prescribedCalciumPeakAboveDiastolicScale01: amplitudeScale,
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
    const currentLeftVentricularPressureMmHg =
      output.evaluation.pressures.leftVentricleMmHg;
    const leftVentricularPressureRateMmHgPerSec =
      previousAcceptedLeftVentricularPressureMmHg == null
        ? null
        : (currentLeftVentricularPressureMmHg -
          previousAcceptedLeftVentricularPressureMmHg) / spec.request.dtSec;
    previousAcceptedLeftVentricularPressureMmHg =
      currentLeftVentricularPressureMmHg;
    if (endpointRing != null) {
      const endpointWithinCycle =
        ((stepsAccepted - 1) % endpointRing.exactEndpointsPerCycle) + 1;
      const closesExactCycle = endpointRing.push(Object.freeze({
        acceptedStepIndex: stepsAccepted,
        timeSec: state.timeSec,
        phase01:
          endpointWithinCycle / endpointRing.exactEndpointsPerCycle,
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
            leftVentricularPressureRateMmHgPerSec,
          leftVentricularPressureDecayRatePositiveMmHgPerSec:
            leftVentricularPressureRateMmHgPerSec == null
              ? null
              : Math.max(0, -leftVentricularPressureRateMmHgPerSec),
        }),
        totalBloodVolumeResidualMl:
          output.totalBloodVolumeResidualMl ?? Number.NaN,
      }));
      if (closesExactCycle) {
        exactCycleBoundaryStates.push(state);
        if (
          exactCycleBoundaryStates.length >
            FIVE_PATCH_MODEL_ENVELOPE_SETTLE_AND_ASSESS_V1
              .retainedAssessmentCycleBoundaryStateCount
        ) {
          exactCycleBoundaryStates.shift();
        }
      }
    }
  }
  const numericalFailure = stepsAccepted !== spec.request.stepCount;
  const retention = endpointRing?.snapshot(numericalFailure) ?? Object.freeze({
    endpoints: Object.freeze([]),
    retainedCycleKind: "none" as const,
  });
  const completedCycleSnapshots = endpointRing?.completedCycleSnapshots() ?? [];
  const completedBeatCount = exactEndpointsPerCycle == null
    ? 0
    : Math.floor(stepsAccepted / exactEndpointsPerCycle);
  const firstRetainedCompleteBeat =
    completedBeatCount - completedCycleSnapshots.length + 1;
  const retainedRawCycles: readonly FivePatchEnvelopeRetainedRawCycleV1[] =
    Object.freeze(completedCycleSnapshots.map(
      (samples, index) => Object.freeze({
        beatNumber: firstRetainedCompleteBeat + index,
        complete: true as const,
        samples,
      }),
    ));
  const periodicity = isProtocolRun
    ? assessFivePatchEnvelopePeriodicityV1(
        exactCycleBoundaryStates,
        { ...options, runCompleted: !numericalFailure },
      )
    : boundedPreflightPeriodicityAssessment();
  const periodicityOption = periodicity.periodicityEstablished == null
    ? {}
    : { periodicityEstablished: periodicity.periodicityEstablished };
  const diagnosticSamples = !settleAndAssessApplicable
    ? retention.endpoints
    : fivePatchEnvelopeAssessmentRawCycleSamplesV1(retainedRawCycles);
  const reportOnlyRawCycleDiagnostics =
    summarizeFivePatchRawCycleDiagnosticsV1(
      diagnosticSamples,
      spec.params.calciumDrivers.leftAtrium.eventOnsetSec /
        spec.params.calciumDrivers.leftAtrium.cycleLengthSec,
      periodicityOption,
    );
  const reportOnlyVLoopMechanismAttribution =
    fivePatchEnvelopeVLoopMechanismAttributionV1(retention.endpoints);
  const volumes = Object.values(state.volumes);
  return Object.freeze({
    requestedStepsAttemptedUnlessRejected: spec.request.stepCount,
    stepsAttempted,
    stepsAccepted,
    failureReasons,
    initialTotalBloodVolumeMl,
    finalTotalBloodVolumeMl: totalBloodVolumeMl(state.volumes),
    maximumAbsoluteBloodVolumeResidualMl,
    minimumCompartmentVolumeMl: Math.min(...volumes),
    finalTimeSec: state.timeSec,
    finalCycleSamples: retention.endpoints,
    retainedRawCycles,
    cycleEndpointRetention: Object.freeze({
      policy:
        "every-accepted-endpoint-of-final-complete-cycle-or-partial-current-cycle-on-failure" as const,
      exactEndpointsPerCycle,
      retainedEndpointCount: retention.endpoints.length,
      retainedCycleKind: retention.retainedCycleKind,
      boundedToAtMostOneCycle: true as const,
    }),
    settleAndAssess: settleAndAssessReadback(
      settleAndAssessApplicable,
      !numericalFailure,
      retainedRawCycles,
      periodicity,
    ),
    periodicity,
    reportOnlyRawCycleDiagnostics,
    reportOnlyVLoopMechanismAttribution,
  });
}

export function fivePatchEnvelopeVLoopMechanismAttributionV1(
  samples: readonly FivePatchEnvelopeAcceptedStepSampleV1[],
): FivePatchEnvelopeVLoopMechanismAttributionV1 {
  return Object.freeze({
    role:
      "report-only-no-score-ranking-gate-smoothing-or-reference-fitting" as const,
    retainedRawTraceStatus:
      samples.length > 0 ? "available" as const : "unavailable" as const,
    retainedRawSampleCount: samples.length,
    pressureComponentSource:
      "same-one-fiber-work-conjugate-map-as-la-cavity-equation" as const,
    leftVentricularRelaxationReadback:
      "accepted-endpoint-backward-pressure-difference-not-fitted-tau" as const,
    matchedVolumeReservoirMinusConduit: Object.freeze({
      status: "deferred-no-interpolation" as const,
      reason:
        "raw-endpoint-reservoir-and-conduit-volumes-do-not-generally-form-exact-matched-volume-pairs" as const,
    }),
  });
}

export function fivePatchEnvelopeCalciumAmplitudeScaleAtBeatV1(
  beatNumber: number,
): number {
  if (!Number.isInteger(beatNumber) || beatNumber < 1) {
    throw new Error("beatNumber must be an integer >= 1");
  }
  const schedule = FIVE_PATCH_MODEL_ENVELOPE_SETTLE_AND_ASSESS_V1
    .calciumAmplitudeRamp;
  const rampIndex = schedule.beatNumbers.indexOf(
    beatNumber as 1 | 2 | 3 | 4,
  );
  return rampIndex < 0 ? 1 : schedule.commonMultipliers[rampIndex]!;
}

export function fivePatchEnvelopeAssessmentRawCycleSamplesV1(
  retainedRawCycles: readonly FivePatchEnvelopeRetainedRawCycleV1[],
): readonly FivePatchEnvelopeAcceptedStepSampleV1[] {
  const lastCycle = retainedRawCycles.at(-1);
  if (lastCycle == null) return Object.freeze([]);
  const [assessmentStartBeat, assessmentEndBeat] =
    FIVE_PATCH_MODEL_ENVELOPE_SETTLE_AND_ASSESS_V1
      .assessmentBeatNumbersInclusive;
  return lastCycle.beatNumber >= assessmentStartBeat &&
      lastCycle.beatNumber <= assessmentEndBeat
    ? lastCycle.samples
    : Object.freeze([]);
}

function settleAndAssessReadback(
  applicable: boolean,
  completedRun: boolean,
  retainedRawCycles: readonly FivePatchEnvelopeRetainedRawCycleV1[],
  periodicity: FivePatchEnvelopePeriodicityAssessmentV1,
): FivePatchEnvelopeSettleAndAssessReadbackV1 {
  const schedule = FIVE_PATCH_MODEL_ENVELOPE_SETTLE_AND_ASSESS_V1;
  return Object.freeze({
    applicable,
    singleContinuousRun: true as const,
    independentColdStart: true as const,
    sourceStateAcceptedFromAnotherRun: false as const,
    resultDependentExtensionAllowed: false as const,
    calciumAmplitudeRampBeatNumbers: schedule.calciumAmplitudeRamp.beatNumbers,
    calciumAmplitudeRampCommonMultipliers:
      schedule.calciumAmplitudeRamp.commonMultipliers,
    discardSettleBeatNumbersInclusive:
      schedule.discardSettleBeatNumbersInclusive,
    assessmentBeatNumbersInclusive: schedule.assessmentBeatNumbersInclusive,
    completedRun,
    retainedRawCycleBeatNumbers: Object.freeze(
      retainedRawCycles.map((cycle) => cycle.beatNumber),
    ),
    rawCycleEvaluationUsesAssessmentWindowOnly: applicable,
    morphologyMetricsUsedAsSettlingGate: false as const,
    evaluationEligible: applicable && periodicity.evaluationEligible,
  });
}

function applyEnvelopeVectorAndScenario(
  base: NoAvpdFivePatchLandTriSegParamsV1,
  vector: FivePatchEnvelopeParameterVectorV1,
  scenario: FivePatchEnvelopeScenarioV1,
  armId: FivePatchEnvelopeArmIdV1,
  candidateIndex: number,
): NoAvpdFivePatchLandTriSegParamsV1 {
  const cycleLengthSec = 60 / scenario.heartRateBpm;
  const tag = `${armId}::lhs-${String(candidateIndex).padStart(2, "0")}`;
  const atrialMaterial = (material: LandActivePassiveSlsParamsV1) =>
    applyMaterialVector(material, vector, "atrial", tag);
  const ventricularMaterial = (material: LandActivePassiveSlsParamsV1) =>
    applyMaterialVector(material, vector, "ventricular", tag);
  return Object.freeze({
    ...base,
    cycleLengthSec,
    calciumDrivers: Object.freeze({
      leftAtrium: applyCalciumVector(
        base.calciumDrivers.leftAtrium,
        vector,
        "atrial",
        cycleLengthSec,
        tag,
      ),
      rightAtrium: applyCalciumVector(
        base.calciumDrivers.rightAtrium,
        vector,
        "atrial",
        cycleLengthSec,
        tag,
      ),
      leftFreeWall: applyCalciumVector(
        base.calciumDrivers.leftFreeWall,
        vector,
        "ventricular",
        cycleLengthSec,
        tag,
      ),
      septum: applyCalciumVector(
        base.calciumDrivers.septum,
        vector,
        "ventricular",
        cycleLengthSec,
        tag,
      ),
      rightFreeWall: applyCalciumVector(
        base.calciumDrivers.rightFreeWall,
        vector,
        "ventricular",
        cycleLengthSec,
        tag,
      ),
    }),
    atria: Object.freeze({
      left: applyAtrialMaterial(base.atria.left, atrialMaterial),
      right: applyAtrialMaterial(base.atria.right, atrialMaterial),
    }),
    triSeg: Object.freeze({
      leftFreeWall: applyTriSegMaterial(
        base.triSeg.leftFreeWall,
        ventricularMaterial,
      ),
      septum: applyTriSegMaterial(
        base.triSeg.septum,
        ventricularMaterial,
      ),
      rightFreeWall: applyTriSegMaterial(
        base.triSeg.rightFreeWall,
        ventricularMaterial,
      ),
    }),
    vascular: Object.freeze({
      ...base.vascular,
      systemicResistanceMmHgSecPerMl:
        base.vascular.systemicResistanceMmHgSecPerMl *
        scenario.systemicResistanceScale,
      pulmonaryResistanceMmHgSecPerMl:
        base.vascular.pulmonaryResistanceMmHgSecPerMl *
        scenario.pulmonaryResistanceScale,
    }),
  });
}

function applyMaterialVector(
  base: LandActivePassiveSlsParamsV1,
  vector: FivePatchEnvelopeParameterVectorV1,
  owner: "atrial" | "ventricular",
  tag: string,
): LandActivePassiveSlsParamsV1 {
  const activeScale = owner === "atrial"
    ? vector.atrialActiveScale
    : vector.ventricularActiveScale;
  const tangentScale = owner === "atrial"
    ? vector.atrialPassiveTangentScale
    : vector.ventricularPassiveTangentScale;
  const exponentScale = owner === "atrial"
    ? vector.atrialPassiveExponentScale
    : vector.ventricularPassiveExponentScale;
  const modulusRatio = owner === "atrial"
    ? vector.atrialSlsModulusOverEquilibriumTangent
    : vector.ventricularSlsModulusOverEquilibriumTangent;
  const relaxationTimeSec = owner === "atrial"
    ? vector.atrialSlsRelaxationTimeSec
    : vector.ventricularSlsRelaxationTimeSec;
  const tangentModulusPa =
    base.passiveSls.passive.tangentModulusPa * tangentScale;
  return Object.freeze({
    ...base,
    materialId: `${base.materialId}::${tag}`,
    // Tissue/homogenization capacity sits outside the cellular Land source.
    // The source parameter pack, kinetics, and Tref remain exactly unchanged.
    activeHomogenizationScale: activeScale,
    active: base.active,
    passiveSls: Object.freeze({
      ...base.passiveSls,
      parameterSetId: `${base.passiveSls.parameterSetId}::${tag}`,
      passive: Object.freeze({
        ...base.passiveSls.passive,
        tangentModulusPa,
        exponentialSlope:
          base.passiveSls.passive.exponentialSlope * exponentScale,
      }),
      sls: Object.freeze({
        ...base.passiveSls.sls,
        modulusPa: base.passiveSls.sls.enabled
          ? tangentModulusPa * modulusRatio
          : 0,
        relaxationTimeSec,
      }),
    }),
  });
}

function applyCalciumVector(
  base: PeriodicPrescribedCalciumDriverParamsV2,
  vector: FivePatchEnvelopeParameterVectorV1,
  owner: "atrial" | "ventricular",
  cycleLengthSec: number,
  tag: string,
): PeriodicPrescribedCalciumDriverParamsV2 {
  const amplitudeScale = owner === "atrial"
    ? vector.atrialCalciumAmplitudeScale
    : vector.ventricularCalciumAmplitudeScale;
  const decayScale = owner === "atrial"
    ? vector.atrialCalciumDecayScale
    : vector.ventricularCalciumDecayScale;
  const onsetOffset = owner === "atrial"
    ? vector.atrialCalciumOnsetOffsetCycleFraction
    : vector.ventricularCalciumOnsetOffsetCycleFraction;
  const baseOnsetPhase = base.eventOnsetSec / base.cycleLengthSec;
  return Object.freeze({
    ...base,
    targetId: `${base.targetId}::${tag}`,
    cycleLengthSec,
    eventOnsetSec: wrapCycleFraction(baseOnsetPhase + onsetOffset) *
      cycleLengthSec,
    calcium: Object.freeze({
      ...base.calcium,
      parameterSetId: `${base.calcium.parameterSetId}::${tag}`,
      rateTargets: Object.freeze(base.calcium.rateTargets.map((target) =>
        Object.freeze({
          ...target,
          peakAmplitudeUM: target.peakAmplitudeUM * amplitudeScale,
          decayHalfTimeSec: target.decayHalfTimeSec * decayScale,
        })
      )),
    }),
  });
}

function applyAtrialMaterial(
  base: NoAvpdFivePatchLandWallParamsV1,
  mapMaterial: (material: LandActivePassiveSlsParamsV1) =>
    LandActivePassiveSlsParamsV1,
): NoAvpdFivePatchLandWallParamsV1 {
  return Object.freeze({ ...base, material: mapMaterial(base.material) });
}

function applyTriSegMaterial(
  base: NoAvpdTriSegWallParamsV1,
  mapMaterial: (material: LandActivePassiveSlsParamsV1) =>
    LandActivePassiveSlsParamsV1,
): NoAvpdTriSegWallParamsV1 {
  return Object.freeze({ ...base, material: mapMaterial(base.material) });
}

function venousAllocatedInitialVolumes(
  scale: number,
): Partial<NoAvpdBloodVolumesV1> {
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error("blood volume scale must be positive and finite");
  }
  const reference = referenceInitialVolumes();
  const referenceTotal = totalBloodVolumeMl(reference);
  const targetTotal = referenceTotal * scale;
  const fixedTotal = referenceTotal - reference.systemicVeinMl -
    reference.pulmonaryVeinMl;
  const totalDelta = targetTotal - referenceTotal;
  const systemicWeight =
    FIVE_PATCH_MODEL_ENVELOPE_BLOOD_VOLUME_ALLOCATION_V1.systemicVeinWeight;
  const pulmonaryWeight =
    FIVE_PATCH_MODEL_ENVELOPE_BLOOD_VOLUME_ALLOCATION_V1.pulmonaryVeinWeight;
  const systemicVeinMl = reference.systemicVeinMl + totalDelta *
    systemicWeight / (systemicWeight + pulmonaryWeight);
  // Compute the second reservoir as the exact remainder so the specified
  // total-volume scale is not perturbed by two independently rounded deltas.
  const pulmonaryVeinMl = targetTotal - fixedTotal - systemicVeinMl;
  if (systemicVeinMl <= 0 || pulmonaryVeinMl <= 0) {
    throw new Error("blood-volume allocation produced a nonpositive venous volume");
  }
  return Object.freeze({ systemicVeinMl, pulmonaryVeinMl });
}

let cachedReferenceInitialVolumes: NoAvpdBloodVolumesV1 | null = null;

function referenceInitialVolumes(): NoAvpdBloodVolumesV1 {
  if (cachedReferenceInitialVolumes == null) {
    // Read only the declared cold distribution. No accepted state or material
    // history is retained or transferred into a candidate.
    const reference = initialNoAvpdFivePatchLandTriSegStateV1(
      createDefaultNoAvpdFivePatchLandTriSegParamsV1("all-patch"),
    );
    cachedReferenceInitialVolumes = Object.freeze({ ...reference.volumes });
  }
  return cachedReferenceInitialVolumes;
}

function protocolPolicyForPhase(phase: FivePatchEnvelopeProtocolPhaseV1) {
  switch (phase) {
    case "arm-readiness":
      return Object.freeze({
        candidateIndices:
          committedExecutionPolicy.armNumericalReadiness.candidateIndices,
        scenarioIds:
          committedExecutionPolicy.armNumericalReadiness.scenarioIds,
        beats: committedExecutionPolicy.armNumericalReadiness.beats,
        dtSec: Object.freeze([
          committedExecutionPolicy.armNumericalReadiness.dtSec,
        ]),
        retainEveryEndpointOfFinalCycle:
          committedExecutionPolicy.armNumericalReadiness
            .retainEveryEndpointOfFinalCycle,
      });
    case "screening":
      if (committedExecutionPolicy.screening.candidateIndices !== "all-64") {
        throw new Error("screening must retain the committed all-64 design");
      }
      return Object.freeze({
        candidateIndices: Object.freeze(Array.from(
          { length: FIVE_PATCH_MODEL_ENVELOPE_SAMPLE_COUNT_V1 },
          (_unused, index) => index,
        )),
        scenarioIds: committedExecutionPolicy.screening.scenarioIds,
        beats: committedExecutionPolicy.screening.beats,
        dtSec: Object.freeze([committedExecutionPolicy.screening.dtSec]),
        retainEveryEndpointOfFinalCycle:
          committedExecutionPolicy.screening.retainEveryEndpointOfFinalCycle,
      });
    case "stress-validation":
      return Object.freeze({
        candidateIndices:
          committedExecutionPolicy.stressValidation.candidateIndices,
        scenarioIds: committedExecutionPolicy.stressValidation.scenarioIds,
        beats: committedExecutionPolicy.stressValidation.beats,
        dtSec: Object.freeze([
          committedExecutionPolicy.stressValidation.dtSec,
        ]),
        retainEveryEndpointOfFinalCycle:
          committedExecutionPolicy.stressValidation
            .retainEveryEndpointOfFinalCycle,
      });
    case "dt-refinement":
      return Object.freeze({
        candidateIndices:
          committedExecutionPolicy.dtRefinement.candidateIndices,
        scenarioIds: committedExecutionPolicy.dtRefinement.scenarioIds,
        beats: committedExecutionPolicy.dtRefinement.beats,
        dtSec: committedExecutionPolicy.dtRefinement.dtSec,
        retainEveryEndpointOfFinalCycle:
          committedExecutionPolicy.dtRefinement
            .retainEveryEndpointOfFinalCycle,
      });
  }
}

function exactProtocolStepCount(
  scenario: FivePatchEnvelopeScenarioV1,
  beats: number,
  dtSec: number,
): number {
  const exact = beats * (60 / scenario.heartRateBpm) / dtSec;
  const rounded = Math.round(exact);
  if (!Number.isInteger(beats) || beats < 1 || Math.abs(exact - rounded) > 1e-9) {
    throw new Error("committed beats and dt must produce an exact integer step count");
  }
  return rounded;
}

function requireArm(armId: FivePatchEnvelopeArmIdV1) {
  const arm = FIVE_PATCH_MODEL_ENVELOPE_ARM_DESIGNS_V1.find(
    (candidate) => candidate.armId === armId,
  );
  if (arm == null) throw new Error("unknown structural arm");
  return arm;
}

function requireScenario(scenarioId: string): FivePatchEnvelopeScenarioV1 {
  const scenario = FIVE_PATCH_MODEL_ENVELOPE_PROTOCOL_MATRIX_V1.find(
    (candidate) => candidate.scenarioId === scenarioId,
  );
  if (scenario == null) throw new Error("unknown envelope scenario");
  return scenario;
}

function slsVariantForArm(
  armId: FivePatchEnvelopeArmIdV1,
): NoAvpdFivePatchLandSlsVariantV1 {
  return requireArm(armId).slsTopology;
}

function preflightRunId(request: FivePatchEnvelopePreflightRequestV1): string {
  return [
    "bounded-preflight",
    fivePatchEnvelopeCandidateIdV1(request.armId, request.candidateIndex),
    request.scenarioId,
    `dt-${request.dtSec}`,
    `steps-${request.stepCount}`,
  ].join("::");
}

function protocolRunId(request: FivePatchEnvelopeProtocolRunRequestV1): string {
  return [
    request.phase,
    fivePatchEnvelopeCandidateIdV1(request.armId, request.candidateIndex),
    request.scenarioId,
    `beats-${request.beats}`,
    `dt-${request.dtSec}`,
  ].join("::");
}

function canonicalRequests<T extends FivePatchEnvelopeRunCoordinatesV1>(
  requests: readonly T[],
): readonly T[] {
  return Object.freeze(requests.slice().sort(compareRequests));
}

function compareRequests<T extends FivePatchEnvelopeRunCoordinatesV1>(
  left: T,
  right: T,
): number {
  const armOrder = FIVE_PATCH_MODEL_ENVELOPE_ARM_DESIGNS_V1.map(
    (arm) => arm.armId,
  );
  const leftPhase = "phase" in left ? String(left.phase) : "bounded-preflight";
  const rightPhase = "phase" in right ? String(right.phase) : "bounded-preflight";
  return phaseOrder(leftPhase) - phaseOrder(rightPhase) ||
    armOrder.indexOf(left.armId) - armOrder.indexOf(right.armId) ||
    left.candidateIndex - right.candidateIndex ||
    left.scenarioId.localeCompare(right.scenarioId) ||
    left.dtSec - right.dtSec ||
    left.stepCount - right.stepCount;
}

function phaseOrder(phase: string): number {
  return [
    "bounded-preflight",
    "arm-readiness",
    "screening",
    "stress-validation",
    "dt-refinement",
  ].indexOf(phase);
}

function requireUniqueRunIds<T extends FivePatchEnvelopeRunCoordinatesV1>(
  requests: readonly T[],
  identify: (request: T) => string,
): readonly T[] {
  const canonical = canonicalRequests(requests);
  const runIds = canonical.map(identify);
  if (new Set(runIds).size !== runIds.length) {
    throw new Error("batch contains duplicate run identities");
  }
  return canonical;
}

function validateCandidateAndScenario(input: {
  readonly armId: FivePatchEnvelopeArmIdV1;
  readonly candidateIndex: number;
  readonly scenarioId: string;
}): void {
  requireArm(input.armId);
  requireScenario(input.scenarioId);
  if (
    !Number.isInteger(input.candidateIndex) ||
    input.candidateIndex < 0 ||
    input.candidateIndex >= FIVE_PATCH_MODEL_ENVELOPE_SAMPLE_COUNT_V1
  ) {
    throw new Error("candidateIndex is outside the pre-registered design");
  }
}

function validatePreflightRequest(
  request: FivePatchEnvelopePreflightRequestV1,
): void {
  validateCandidateAndScenario(request);
  if (
    !Number.isFinite(request.dtSec) ||
    request.dtSec <= 0 ||
    request.dtSec > 0.01
  ) {
    throw new Error("preflight dtSec must lie in (0, 0.01]");
  }
  if (
    !Number.isInteger(request.stepCount) ||
    request.stepCount < 1 ||
    request.stepCount >
      FIVE_PATCH_MODEL_ENVELOPE_PREFLIGHT_POLICY_V1.maximumStepCount
  ) {
    throw new Error(
      `preflight stepCount must be in [1, ${FIVE_PATCH_MODEL_ENVELOPE_PREFLIGHT_POLICY_V1.maximumStepCount}]`,
    );
  }
}

function validateProtocolRequest(
  request: FivePatchEnvelopeProtocolRunRequestV1,
): void {
  validateCandidateAndScenario(request);
  const policy = protocolPolicyForPhase(request.phase);
  if (
    !policy.candidateIndices.includes(request.candidateIndex) ||
    !policy.scenarioIds.includes(request.scenarioId) ||
    !policy.dtSec.includes(request.dtSec) ||
    request.beats !== policy.beats ||
    request.retainEveryEndpointOfFinalCycle !==
      policy.retainEveryEndpointOfFinalCycle
  ) {
    throw new Error("protocol request is outside its committed phase plan");
  }
  const exactSteps = exactProtocolStepCount(
    requireScenario(request.scenarioId),
    request.beats,
    request.dtSec,
  );
  if (request.stepCount !== exactSteps) {
    throw new Error("protocol request stepCount does not match beats and dt");
  }
}

function validateShard(shard: FivePatchEnvelopeShardV1): void {
  if (!Number.isInteger(shard.shardCount) || shard.shardCount < 1) {
    throw new Error("shardCount must be an integer >= 1");
  }
  if (
    !Number.isInteger(shard.shardIndex) ||
    shard.shardIndex < 0 ||
    shard.shardIndex >= shard.shardCount
  ) {
    throw new Error("shardIndex must lie in [0, shardCount)");
  }
}

function validateReadinessCounts(
  stepsAccepted: number,
  requestedSteps: number,
): void {
  if (
    !Number.isInteger(stepsAccepted) ||
    !Number.isInteger(requestedSteps) ||
    requestedSteps < 1 ||
    stepsAccepted < 0 ||
    stepsAccepted > requestedSteps
  ) {
    throw new Error("invalid numerical completion counts");
  }
}

function validateFixedReturnMapToleranceAssertion(
  tolerance: number | undefined,
): void {
  if (
    tolerance != null &&
    tolerance !== FIVE_PATCH_MODEL_ENVELOPE_SETTLE_AND_ASSESS_V1
      .returnMapMaxAbsDimensionlessTolerance
  ) {
    throw new Error(
      "full-state return-map tolerance is fixed by protocol at 1e-4",
    );
  }
}

function boundedPreflightPeriodicityAssessment():
FivePatchEnvelopePeriodicityAssessmentV1 {
  return Object.freeze({
    exactCycleBoundaryStates: Object.freeze([]),
    consecutiveNormalizedReturnMaps: Object.freeze([]),
    normalizedReturnMap: null,
    maxAbsDimensionlessTolerance: null,
    toleranceSource: "none" as const,
    periodicityEstablished: null,
    completedRun: false,
    requiredConsecutiveReturnMapCount: 2 as const,
    bothConsecutiveReturnMapsPass: false,
    evaluationEligible: false,
    morphologyMetricsUsedAsSettlingGate: false as const,
    status: "not-applicable-bounded-preflight" as const,
  });
}

function flattenNumbers(
  value: unknown,
  path = "",
): { path: string; value: number }[] {
  if (typeof value === "number") return [{ path, value }];
  if (value == null || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      flattenNumbers(entry, path ? `${path}.${index}` : String(index))
    );
  }
  return Object.entries(value).flatMap(([key, entry]) =>
    flattenNumbers(entry, path ? `${path}.${key}` : key)
  );
}

function equalParameterVectors(
  left: FivePatchEnvelopeParameterVectorV1,
  right: FivePatchEnvelopeParameterVectorV1,
): boolean {
  return FIVE_PATCH_MODEL_ENVELOPE_PARAMETER_DIMENSIONS_V1.every(
    (dimension) => left[dimension.dimensionId] === right[dimension.dimensionId],
  );
}

function wrapCycleFraction(value: number): number {
  return ((value % 1) + 1) % 1;
}

// Compile-time anchor: mapping/readback must retain every committed dimension.
const _ALL_AXIS_IDS: readonly FivePatchEnvelopeDimensionIdV1[] =
  FIVE_PATCH_MODEL_ENVELOPE_PARAMETER_DIMENSIONS_V1.map(
    (dimension) => dimension.dimensionId,
  );
void _ALL_AXIS_IDS;
