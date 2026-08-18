import {
  pressureVolumePathIntegralIncrementV3,
} from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLASSIFIER_V3_ID,
  type MainWireIntegratedModelPeriodicClassificationV3,
  type MainWireIntegratedModelPeriodicCycleObservationV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClassifierV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3,
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicPolicyV3";
import type {
  MainWireIntegratedModelPeriodicExecutionPurposeV3,
  MainWireIntegratedModelPeriodicSteadyCycleV3,
  MainWireIntegratedModelPeriodicTerminalCycleTraceV3,
  MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicSteadyV3";

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_EXTERNAL_WORK_V1_ID =
  "main-wire-integrated-model-periodic-transmural-external-work-v1" as const;

/**
 * Numerical eligibility policy, not a physiological normal range. The volume
 * scale and tolerance reuse the full-state P1 convention. Pressure is an
 * algebraic readback rather than an accepted state, so it receives an explicit
 * fixed dimensional scale instead of an instantaneous denominator.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_EXTERNAL_WORK_POLICY_V1 =
  Object.freeze({
    policyId:
      "main-wire-integrated-model-periodic-transmural-external-work-policy-v1" as const,
    pressureBasis: "ventricular-transmural" as const,
    workDefinition:
      "negative-accepted-endpoint-trapezoidal-line-integral-of-pressure-against-volume" as const,
    requiredPeriodicity:
      "canonical-full-accepted-state-period1-converged" as const,
    syntheticEndToStartClosingSegmentApplied: false as const,
    closure: Object.freeze({
      volumeReferenceScaleMl: 100,
      pressureReferenceScaleMmHg: 100,
      maximumNormalizedBoundaryDelta:
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3
          .period1NormalizedTolerance,
      clockToleranceSec:
        MAIN_WIRE_INTEGRATED_MODEL_NUMERICAL_POLICY_V3.invariantTolerance
          .acceptedOwnerClockSkewSec,
    }),
    signConvention: Object.freeze({
      positive: "net-work-by-ventricle" as const,
      negative: "net-work-on-ventricle" as const,
      zero: "zero-net-work" as const,
    }),
    selfIntersectionPolicy:
      "signed-line-integral-remains-defined-self-intersection-is-a-later-pva-geometry-gate" as const,
    valveEventPolicy:
      "not-an-external-work-eligibility-gate-events-separately-own-ed-es-annotations" as const,
    numericalPeriodicityIsPhysiologicalValidation: false as const,
    clinicalValidationClaimed: false as const,
  });

export type MainWireIntegratedModelPeriodicPressureVolumeBoundaryV1 =
  Readonly<{
    source: "previous-cycle-terminal-accepted-endpoint";
    acceptedTimeSec: number;
    chamberVolumeMl: Readonly<{ LV: number; RV: number }>;
    absolutePressureMmHg: Readonly<{ LV: number; RV: number }>;
    transmuralPressureMmHg: Readonly<{ LV: number; RV: number }>;
  }>;

export type MainWireIntegratedModelPeriodicExternalWorkFailureReasonV1 =
  | "protocol-identity-invalid"
  | "model-condition-identity-invalid"
  | "canonical-period1-not-established"
  | "terminal-cycle-does-not-own-latest-period1-evidence"
  | "terminal-cycle-integrity-failed"
  | "previous-cycle-terminal-boundary-unavailable"
  | "accepted-path-trace-incomplete"
  | "pressure-volume-boundary-not-closed";

export type MainWireIntegratedModelPeriodicExternalWorkDirectionV1 =
  | "net-work-by-ventricle"
  | "net-work-on-ventricle"
  | "zero-net-work";

export type MainWireIntegratedModelPeriodicVentricularExternalWorkV1 =
  Readonly<{
    chamber: "LV" | "RV";
    pressureBasis: "ventricular-transmural";
    pathWorkMmHgMl: number | null;
    externalWorkMmHgMl: number | null;
    direction: MainWireIntegratedModelPeriodicExternalWorkDirectionV1 | null;
    endpointClosure: Readonly<{
      start: Readonly<{ volumeMl: number; pressureMmHg: number }> | null;
      end: Readonly<{ volumeMl: number; pressureMmHg: number }> | null;
      absoluteVolumeDeltaMl: number | null;
      absolutePressureDeltaMmHg: number | null;
      normalizedVolumeDelta: number | null;
      normalizedPressureDelta: number | null;
      maximumNormalizedDelta: number | null;
      withinTolerance: boolean;
    }>;
    externalWorkEstablished: boolean;
    failureReasons:
      readonly MainWireIntegratedModelPeriodicExternalWorkFailureReasonV1[];
  }>;

export type MainWireIntegratedModelPeriodicExternalWorkResultV1 = Readonly<{
  qualificationId:
    typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_EXTERNAL_WORK_V1_ID;
  status:
    | "qualified-biventricular"
    | "qualified-left-ventricular-only"
    | "qualified-right-ventricular-only"
    | "not-qualified";
  protocolIdentityHash: string;
  modelConditionIdentityHash: string;
  sourceCycleIndex: number;
  sourceStartTimeSec: number;
  sourceEndTimeSec: number;
  acceptedSegmentCount: number;
  gates: Readonly<{
    protocolIdentityValid: boolean;
    modelConditionIdentityValid: boolean;
    canonicalPeriod1Established: boolean;
    terminalCycleOwnsLatestPeriod1Evidence: boolean;
    terminalCycleIntegrityPassed: boolean;
    previousCycleTerminalBoundaryAvailable: boolean;
    acceptedPathTraceComplete: boolean;
  }>;
  leftVentricle: MainWireIntegratedModelPeriodicVentricularExternalWorkV1;
  rightVentricle: MainWireIntegratedModelPeriodicVentricularExternalWorkV1;
  biventricularExternalWorkEstablished: boolean;
  syntheticEndToStartClosingSegmentApplied: false;
  physiologicalValidationEstablished: false;
  clinicalValidationClaimed: false;
  policy:
    typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_EXTERNAL_WORK_POLICY_V1;
}>;

export type MainWireIntegratedModelPeriodicExternalWorkInputV1 = Readonly<{
  executionPurpose: MainWireIntegratedModelPeriodicExecutionPurposeV3;
  protocolIdentityHash: string;
  modelConditionIdentityHash: string;
  classification: MainWireIntegratedModelPeriodicClassificationV3;
  terminalObservation: Pick<
    MainWireIntegratedModelPeriodicCycleObservationV3,
    "cycleIndex" | "evidenceRole" | "protocolIdentityHash"
  >;
  terminalCycle: Pick<
    MainWireIntegratedModelPeriodicSteadyCycleV3,
    | "cycleIndex"
    | "startTimeSec"
    | "endTimeSec"
    | "acceptedStepCount"
    | "conservation"
    | "finiteAndEventIdentityChecks"
  >;
  terminalTrace: MainWireIntegratedModelPeriodicTerminalCycleTraceV3;
  startBoundary:
    MainWireIntegratedModelPeriodicPressureVolumeBoundaryV1 | null;
}>;

/**
 * Projects an exact periodic accepted path to signed ventricular external
 * work only after its source cycle passes the canonical full-state P1 and
 * explicit PV-endpoint closure gates. The measured path is never geometrically
 * closed after the fact.
 */
export function qualifyMainWireIntegratedModelPeriodicExternalWorkV1(
  input: MainWireIntegratedModelPeriodicExternalWorkInputV1,
): MainWireIntegratedModelPeriodicExternalWorkResultV1 {
  const protocolIdentityValid = /^[0-9a-f]{64}$/.test(
    input.protocolIdentityHash,
  );
  const modelConditionIdentityValid = /^[0-9a-f]{64}$/.test(
    input.modelConditionIdentityHash,
  );
  const canonicalPeriod1Established =
    input.executionPurpose === "canonical-evidence" &&
    input.classification.classifierId ===
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLASSIFIER_V3_ID &&
    input.classification.status === "period1-converged";
  const evidenceCycleIndices = input.classification.evidenceCycleIndices;
  const terminalCycleOwnsLatestPeriod1Evidence =
    canonicalPeriod1Established &&
    input.classification.latestCycleIndex === input.terminalCycle.cycleIndex &&
    evidenceCycleIndices.at(-1) === input.terminalCycle.cycleIndex &&
    input.terminalObservation.cycleIndex === input.terminalCycle.cycleIndex &&
    input.terminalObservation.evidenceRole ===
      "canonical-periodic-protocol" &&
    input.terminalObservation.protocolIdentityHash ===
      input.protocolIdentityHash;
  const terminalCycleIntegrityPassed =
    input.terminalCycle.conservation.withinInheritedConstructionTolerances &&
    input.terminalCycle.finiteAndEventIdentityChecks.passed;
  const previousCycleTerminalBoundaryAvailable = input.startBoundary !== null;
  const acceptedPathTraceComplete = traceIsCompleteV1(
    input.terminalCycle,
    input.terminalTrace,
    input.startBoundary,
  );
  const sharedFailureReasons:
    MainWireIntegratedModelPeriodicExternalWorkFailureReasonV1[] = [];
  if (!protocolIdentityValid) {
    sharedFailureReasons.push("protocol-identity-invalid");
  }
  if (!modelConditionIdentityValid) {
    sharedFailureReasons.push("model-condition-identity-invalid");
  }
  if (!canonicalPeriod1Established) {
    sharedFailureReasons.push("canonical-period1-not-established");
  }
  if (
    canonicalPeriod1Established &&
    !terminalCycleOwnsLatestPeriod1Evidence
  ) {
    sharedFailureReasons.push(
      "terminal-cycle-does-not-own-latest-period1-evidence",
    );
  }
  if (!terminalCycleIntegrityPassed) {
    sharedFailureReasons.push("terminal-cycle-integrity-failed");
  }
  if (!previousCycleTerminalBoundaryAvailable) {
    sharedFailureReasons.push(
      "previous-cycle-terminal-boundary-unavailable",
    );
  }
  if (
    previousCycleTerminalBoundaryAvailable &&
    !acceptedPathTraceComplete
  ) {
    sharedFailureReasons.push("accepted-path-trace-incomplete");
  }

  const sharedEligibility =
    protocolIdentityValid &&
    modelConditionIdentityValid &&
    canonicalPeriod1Established &&
    terminalCycleOwnsLatestPeriod1Evidence &&
    terminalCycleIntegrityPassed &&
    previousCycleTerminalBoundaryAvailable &&
    acceptedPathTraceComplete;
  const leftVentricle = ventricularResultV1(
    "LV",
    input.startBoundary,
    input.terminalTrace.samples,
    sharedEligibility,
    sharedFailureReasons,
  );
  const rightVentricle = ventricularResultV1(
    "RV",
    input.startBoundary,
    input.terminalTrace.samples,
    sharedEligibility,
    sharedFailureReasons,
  );
  const leftQualified = leftVentricle.externalWorkEstablished;
  const rightQualified = rightVentricle.externalWorkEstablished;
  const status = leftQualified && rightQualified
    ? ("qualified-biventricular" as const)
    : leftQualified
      ? ("qualified-left-ventricular-only" as const)
      : rightQualified
        ? ("qualified-right-ventricular-only" as const)
        : ("not-qualified" as const);

  return Object.freeze({
    qualificationId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_EXTERNAL_WORK_V1_ID,
    status,
    protocolIdentityHash: input.protocolIdentityHash,
    modelConditionIdentityHash: input.modelConditionIdentityHash,
    sourceCycleIndex: input.terminalCycle.cycleIndex,
    sourceStartTimeSec: input.terminalCycle.startTimeSec,
    sourceEndTimeSec: input.terminalCycle.endTimeSec,
    acceptedSegmentCount: acceptedPathTraceComplete
      ? input.terminalTrace.samples.length
      : 0,
    gates: Object.freeze({
      protocolIdentityValid,
      modelConditionIdentityValid,
      canonicalPeriod1Established,
      terminalCycleOwnsLatestPeriod1Evidence,
      terminalCycleIntegrityPassed,
      previousCycleTerminalBoundaryAvailable,
      acceptedPathTraceComplete,
    }),
    leftVentricle,
    rightVentricle,
    biventricularExternalWorkEstablished: leftQualified && rightQualified,
    syntheticEndToStartClosingSegmentApplied: false as const,
    physiologicalValidationEstablished: false as const,
    clinicalValidationClaimed: false as const,
    policy: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_EXTERNAL_WORK_POLICY_V1,
  });
}

export function periodicPressureVolumeBoundaryFromAcceptedTraceSampleV1(
  sample: MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
): MainWireIntegratedModelPeriodicPressureVolumeBoundaryV1 {
  const boundary = Object.freeze({
    source: "previous-cycle-terminal-accepted-endpoint" as const,
    acceptedTimeSec: sample.acceptedTimeSec,
    chamberVolumeMl: Object.freeze({
      LV: sample.chamberVolumeMl.LV,
      RV: sample.chamberVolumeMl.RV,
    }),
    absolutePressureMmHg: Object.freeze({
      LV: sample.absolutePressureMmHg.LV,
      RV: sample.absolutePressureMmHg.RV,
    }),
    transmuralPressureMmHg: Object.freeze({
      LV: sample.transmuralPressureMmHg.LV,
      RV: sample.transmuralPressureMmHg.RV,
    }),
  });
  if (!boundaryIsFiniteV1(boundary)) {
    throw new Error("periodic PV boundary contains a nonfinite value");
  }
  return boundary;
}

function ventricularResultV1(
  chamber: "LV" | "RV",
  startBoundary: MainWireIntegratedModelPeriodicPressureVolumeBoundaryV1 | null,
  samples: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[],
  sharedEligibility: boolean,
  sharedFailureReasons:
    readonly MainWireIntegratedModelPeriodicExternalWorkFailureReasonV1[],
): MainWireIntegratedModelPeriodicVentricularExternalWorkV1 {
  const last = samples.at(-1) ?? null;
  const start = startBoundary === null
    ? null
    : Object.freeze({
        volumeMl: startBoundary.chamberVolumeMl[chamber],
        pressureMmHg: startBoundary.transmuralPressureMmHg[chamber],
      });
  const end = last === null
    ? null
    : Object.freeze({
        volumeMl: last.chamberVolumeMl[chamber],
        pressureMmHg: last.transmuralPressureMmHg[chamber],
      });
  const closure = endpointClosureV1(start, end);
  const pathGeometryAvailable =
    startBoundary !== null &&
    Number.isFinite(startBoundary.chamberVolumeMl[chamber]) &&
    Number.isFinite(startBoundary.transmuralPressureMmHg[chamber]) &&
    samples.length > 0 &&
    samples.every(
      (sample) =>
        Number.isFinite(sample.chamberVolumeMl[chamber]) &&
        Number.isFinite(sample.transmuralPressureMmHg[chamber]),
    );
  const pathWorkMmHgMl = !pathGeometryAvailable
    ? null
    : acceptedPathWorkV1(chamber, startBoundary!, samples);
  const externalWorkEstablished =
    sharedEligibility && closure.withinTolerance && pathWorkMmHgMl !== null;
  const failureReasons = [...sharedFailureReasons];
  if (
    closure.maximumNormalizedDelta !== null &&
    !closure.withinTolerance
  ) {
    failureReasons.push("pressure-volume-boundary-not-closed");
  }
  return Object.freeze({
    chamber,
    pressureBasis: "ventricular-transmural" as const,
    pathWorkMmHgMl,
    externalWorkMmHgMl: externalWorkEstablished ? pathWorkMmHgMl : null,
    direction:
      pathWorkMmHgMl === null ? null : workDirectionV1(pathWorkMmHgMl),
    endpointClosure: closure,
    externalWorkEstablished,
    failureReasons: Object.freeze(failureReasons),
  });
}

function acceptedPathWorkV1(
  chamber: "LV" | "RV",
  startBoundary: MainWireIntegratedModelPeriodicPressureVolumeBoundaryV1,
  samples: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[],
): number {
  let previousVolumeMl = startBoundary.chamberVolumeMl[chamber];
  let previousPressureMmHg =
    startBoundary.transmuralPressureMmHg[chamber];
  let pathIntegralMmHgMl = 0;
  for (const sample of samples) {
    const nextVolumeMl = sample.chamberVolumeMl[chamber];
    const nextPressureMmHg = sample.transmuralPressureMmHg[chamber];
    pathIntegralMmHgMl += pressureVolumePathIntegralIncrementV3(
      previousVolumeMl,
      previousPressureMmHg,
      nextVolumeMl,
      nextPressureMmHg,
    );
    previousVolumeMl = nextVolumeMl;
    previousPressureMmHg = nextPressureMmHg;
  }
  const workMmHgMl = -pathIntegralMmHgMl;
  return Object.is(workMmHgMl, -0) ? 0 : workMmHgMl;
}

function endpointClosureV1(
  start: Readonly<{ volumeMl: number; pressureMmHg: number }> | null,
  end: Readonly<{ volumeMl: number; pressureMmHg: number }> | null,
): MainWireIntegratedModelPeriodicVentricularExternalWorkV1["endpointClosure"] {
  if (start === null || end === null) {
    return Object.freeze({
      start,
      end,
      absoluteVolumeDeltaMl: null,
      absolutePressureDeltaMmHg: null,
      normalizedVolumeDelta: null,
      normalizedPressureDelta: null,
      maximumNormalizedDelta: null,
      withinTolerance: false,
    });
  }
  const absoluteVolumeDeltaMl = Math.abs(end.volumeMl - start.volumeMl);
  const absolutePressureDeltaMmHg = Math.abs(
    end.pressureMmHg - start.pressureMmHg,
  );
  const normalizedVolumeDelta =
    absoluteVolumeDeltaMl /
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_EXTERNAL_WORK_POLICY_V1.closure
      .volumeReferenceScaleMl;
  const normalizedPressureDelta =
    absolutePressureDeltaMmHg /
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_EXTERNAL_WORK_POLICY_V1.closure
      .pressureReferenceScaleMmHg;
  const maximumNormalizedDelta = Math.max(
    normalizedVolumeDelta,
    normalizedPressureDelta,
  );
  return Object.freeze({
    start,
    end,
    absoluteVolumeDeltaMl,
    absolutePressureDeltaMmHg,
    normalizedVolumeDelta,
    normalizedPressureDelta,
    maximumNormalizedDelta,
    withinTolerance:
      maximumNormalizedDelta <=
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_EXTERNAL_WORK_POLICY_V1.closure
        .maximumNormalizedBoundaryDelta,
  });
}

function traceIsCompleteV1(
  terminalCycle: MainWireIntegratedModelPeriodicExternalWorkInputV1["terminalCycle"],
  trace: MainWireIntegratedModelPeriodicTerminalCycleTraceV3,
  startBoundary: MainWireIntegratedModelPeriodicPressureVolumeBoundaryV1 | null,
): boolean {
  if (startBoundary === null || !boundaryIsFiniteV1(startBoundary)) return false;
  if (
    trace.cycleIndex !== terminalCycle.cycleIndex ||
    trace.startTimeSec !== terminalCycle.startTimeSec ||
    trace.endTimeSec !== terminalCycle.endTimeSec ||
    trace.sampleCount !== trace.samples.length ||
    trace.sampleCount !== terminalCycle.acceptedStepCount ||
    trace.sampleCount < 1 ||
    trace.retainedForGraphShapeInspection !== true ||
    trace.resamplingApplied !== false ||
    trace.shapeAcceptanceClaimed !== false ||
    trace.interpretation !==
      "raw-accepted-endpoint-samples-no-resampling-no-shape-acceptance" ||
    startBoundary.acceptedTimeSec !== trace.startTimeSec
  ) {
    return false;
  }
  const clockToleranceSec =
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_EXTERNAL_WORK_POLICY_V1.closure
      .clockToleranceSec;
  const expectedDurationSec = trace.endTimeSec - trace.startTimeSec;
  if (!Number.isFinite(expectedDurationSec) || expectedDurationSec <= 0) {
    return false;
  }
  let previousTimeSec = startBoundary.acceptedTimeSec;
  let accumulatedDurationSec = 0;
  for (let index = 0; index < trace.samples.length; index += 1) {
    const sample = trace.samples[index]!;
    if (
      sample.cycleIndex !== trace.cycleIndex ||
      sample.acceptedStepIndexWithinCycle !== index + 1 ||
      !Number.isFinite(sample.acceptedTimeSec) ||
      !Number.isFinite(sample.acceptedDtSec) ||
      sample.acceptedDtSec <= 0 ||
      !(sample.acceptedTimeSec > previousTimeSec) ||
      !Number.isFinite(sample.cyclePhase01) ||
      Math.abs(
        sample.cyclePhase01 -
          (sample.acceptedTimeSec - trace.startTimeSec) /
            expectedDurationSec,
      ) > clockToleranceSec / expectedDurationSec ||
      Math.abs(
        sample.acceptedTimeSec - previousTimeSec - sample.acceptedDtSec,
      ) > clockToleranceSec ||
      !traceSamplePressureVolumeIsFiniteV1(sample)
    ) {
      return false;
    }
    accumulatedDurationSec += sample.acceptedDtSec;
    previousTimeSec = sample.acceptedTimeSec;
  }
  return (
    Math.abs(previousTimeSec - trace.endTimeSec) <= clockToleranceSec &&
    Math.abs(accumulatedDurationSec - expectedDurationSec) <=
      clockToleranceSec
  );
}

function boundaryIsFiniteV1(
  boundary: MainWireIntegratedModelPeriodicPressureVolumeBoundaryV1,
): boolean {
  return [
    boundary.acceptedTimeSec,
    boundary.chamberVolumeMl.LV,
    boundary.chamberVolumeMl.RV,
    boundary.absolutePressureMmHg.LV,
    boundary.absolutePressureMmHg.RV,
    boundary.transmuralPressureMmHg.LV,
    boundary.transmuralPressureMmHg.RV,
  ].every(Number.isFinite);
}

function traceSamplePressureVolumeIsFiniteV1(
  sample: MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
): boolean {
  return [
    sample.chamberVolumeMl.LV,
    sample.chamberVolumeMl.RV,
    sample.transmuralPressureMmHg.LV,
    sample.transmuralPressureMmHg.RV,
  ].every(Number.isFinite);
}

function workDirectionV1(
  workMmHgMl: number,
): MainWireIntegratedModelPeriodicExternalWorkDirectionV1 {
  if (workMmHgMl > 0) return "net-work-by-ventricle";
  if (workMmHgMl < 0) return "net-work-on-ventricle";
  return "zero-net-work";
}
