import { pressureVolumePathIntegralIncrementV3 } from "@/engine/myocardium/MainWireIntegratedModelBeatMetricsV3";
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

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_TRANSMURAL_BOUNDARY_WORK_ENGINEERING_V1_ID =
  "main-wire-integrated-model-periodic-transmural-boundary-work-engineering-projection-v1" as const;

/**
 * Engineering extraction boundary.
 *
 * This pure projector was recovered from the PR558 research archive without
 * its canonical runner, one-shot admission, or retained evidence artifact.
 * An `input-gates-passed-*` result means only that the supplied input is
 * structurally suitable for this numerical projection. The caller-provided
 * classification, identities, and boundary are declarations: this owner does
 * not authenticate their source provenance. It cannot transfer the archived
 * implementation's historical qualification or establish an official
 * qualification, public Output, PVA, physiological, or clinical claim.
 */

/**
 * Numerical input-gate policy, not a physiological normal range. The volume
 * scale and tolerance reuse the full-state P1 convention. Pressure is an
 * algebraic readback rather than an accepted state, so it receives an explicit
 * fixed dimensional scale instead of an instantaneous denominator.
 */
export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_TRANSMURAL_BOUNDARY_WORK_ENGINEERING_POLICY_V1 =
  Object.freeze({
    policyId:
      "main-wire-integrated-model-periodic-transmural-boundary-work-engineering-projection-policy-v1" as const,
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
        MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_POLICY_V3.period1NormalizedTolerance,
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
      "not-a-transmural-boundary-work-input-gate-events-separately-own-ed-es-annotations" as const,
    sourceProvenanceEstablishedByProjector: false as const,
    numericalPeriodicityIsPhysiologicalValidation: false as const,
    clinicalValidationClaimed: false as const,
  });

export type MainWireIntegratedModelPeriodicPressureVolumeBoundaryV1 = Readonly<{
  source: "caller-projected-trace-sample";
  acceptedTimeSec: number;
  chamberVolumeMl: Readonly<{ LV: number; RV: number }>;
  transmuralPressureMmHg: Readonly<{ LV: number; RV: number }>;
}>;

export type MainWireIntegratedModelPeriodicTransmuralBoundaryWorkFailureReasonV1 =
  | "protocol-identity-format-invalid"
  | "model-condition-identity-format-invalid"
  | "canonical-period1-not-declared-by-input"
  | "terminal-cycle-does-not-match-declared-period1-evidence"
  | "terminal-cycle-integrity-not-declared-by-input"
  | "start-boundary-not-provided"
  | "pressure-volume-boundary-non-finite"
  | "accepted-path-trace-incomplete"
  | "pressure-volume-boundary-not-closed"
  | "path-work-non-finite";

export type MainWireIntegratedModelPeriodicPathWorkDirectionV1 =
  "net-work-by-ventricle" | "net-work-on-ventricle" | "zero-net-work";

export type MainWireIntegratedModelPeriodicVentricularTransmuralBoundaryWorkV1 =
  Readonly<{
    chamber: "LV" | "RV";
    pressureBasis: "ventricular-transmural";
    transmuralPathWorkMmHgMl: number | null;
    transmuralBoundaryWorkMmHgMl: number | null;
    pathWorkDirection: MainWireIntegratedModelPeriodicPathWorkDirectionV1 | null;
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
    transmuralBoundaryWorkComputed: boolean;
    failureReasons: readonly MainWireIntegratedModelPeriodicTransmuralBoundaryWorkFailureReasonV1[];
  }>;

export type MainWireIntegratedModelPeriodicTransmuralBoundaryWorkEngineeringResultV1 =
  Readonly<{
    projectionId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_TRANSMURAL_BOUNDARY_WORK_ENGINEERING_V1_ID;
    status:
      | "input-gates-passed-biventricular"
      | "input-gates-passed-left-ventricular-only"
      | "input-gates-passed-right-ventricular-only"
      | "input-gates-not-passed";
    protocolIdentityHash: string;
    modelConditionIdentityHash: string;
    sourceCycleIndex: number;
    sourceStartTimeSec: number;
    sourceEndTimeSec: number;
    acceptedSegmentCount: number;
    gates: Readonly<{
      protocolIdentityFormatValid: boolean;
      modelConditionIdentityFormatValid: boolean;
      canonicalPeriod1DeclaredByInput: boolean;
      terminalCycleMatchesDeclaredPeriod1Evidence: boolean;
      terminalCycleIntegrityDeclaredByInput: boolean;
      startBoundaryProvided: boolean;
      startBoundaryFinite: boolean;
      acceptedPathTraceComplete: boolean;
      sourceProvenanceVerified: false;
    }>;
    leftVentricle: MainWireIntegratedModelPeriodicVentricularTransmuralBoundaryWorkV1;
    rightVentricle: MainWireIntegratedModelPeriodicVentricularTransmuralBoundaryWorkV1;
    biventricularTransmuralBoundaryWorkComputed: boolean;
    syntheticEndToStartClosingSegmentApplied: false;
    engineeringProjectionOnly: true;
    sourceProvenanceVerified: false;
    historicalQualificationTransferred: false;
    officialQualificationEstablished: false;
    publicOutputEstablished: false;
    pvaEstablished: false;
    physiologicalValidationEstablished: false;
    clinicalValidationClaimed: false;
    policy: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_TRANSMURAL_BOUNDARY_WORK_ENGINEERING_POLICY_V1;
  }>;

export type MainWireIntegratedModelPeriodicTransmuralBoundaryWorkEngineeringInputV1 =
  Readonly<{
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
    startBoundary: MainWireIntegratedModelPeriodicPressureVolumeBoundaryV1 | null;
  }>;

/**
 * Projects a caller-supplied accepted path to signed ventricular transmural
 * boundary work after structural, declared-periodicity, and PV-endpoint
 * closure gates pass. The measured path is never geometrically closed after
 * the fact. Canonical source provenance remains the responsibility of a later
 * integration owner.
 */
export function projectMainWireIntegratedModelPeriodicTransmuralBoundaryWorkEngineeringV1(
  input: MainWireIntegratedModelPeriodicTransmuralBoundaryWorkEngineeringInputV1,
): MainWireIntegratedModelPeriodicTransmuralBoundaryWorkEngineeringResultV1 {
  const protocolIdentityFormatValid = /^[0-9a-f]{64}$/.test(
    input.protocolIdentityHash,
  );
  const modelConditionIdentityFormatValid = /^[0-9a-f]{64}$/.test(
    input.modelConditionIdentityHash,
  );
  const canonicalPeriod1DeclaredByInput =
    input.executionPurpose === "canonical-evidence" &&
    input.classification.classifierId ===
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLASSIFIER_V3_ID &&
    input.classification.status === "period1-converged";
  const evidenceCycleIndices = input.classification.evidenceCycleIndices;
  const terminalCycleMatchesDeclaredPeriod1Evidence =
    canonicalPeriod1DeclaredByInput &&
    input.classification.latestCycleIndex === input.terminalCycle.cycleIndex &&
    evidenceCycleIndices.at(-1) === input.terminalCycle.cycleIndex &&
    input.terminalObservation.cycleIndex === input.terminalCycle.cycleIndex &&
    input.terminalObservation.evidenceRole === "canonical-periodic-protocol" &&
    input.terminalObservation.protocolIdentityHash ===
      input.protocolIdentityHash;
  const terminalCycleIntegrityDeclaredByInput =
    input.terminalCycle.conservation.withinInheritedConstructionTolerances &&
    input.terminalCycle.finiteAndEventIdentityChecks.passed;
  const startBoundaryProvided = input.startBoundary !== null;
  const startBoundaryFinite =
    input.startBoundary !== null && boundaryIsFiniteV1(input.startBoundary);
  const acceptedPathTraceComplete = traceIsCompleteV1(
    input.terminalCycle,
    input.terminalTrace,
    input.startBoundary,
  );
  const sharedFailureReasons: MainWireIntegratedModelPeriodicTransmuralBoundaryWorkFailureReasonV1[] =
    [];
  if (!protocolIdentityFormatValid) {
    sharedFailureReasons.push("protocol-identity-format-invalid");
  }
  if (!modelConditionIdentityFormatValid) {
    sharedFailureReasons.push("model-condition-identity-format-invalid");
  }
  if (!canonicalPeriod1DeclaredByInput) {
    sharedFailureReasons.push("canonical-period1-not-declared-by-input");
  }
  if (
    canonicalPeriod1DeclaredByInput &&
    !terminalCycleMatchesDeclaredPeriod1Evidence
  ) {
    sharedFailureReasons.push(
      "terminal-cycle-does-not-match-declared-period1-evidence",
    );
  }
  if (!terminalCycleIntegrityDeclaredByInput) {
    sharedFailureReasons.push("terminal-cycle-integrity-not-declared-by-input");
  }
  if (!startBoundaryProvided) {
    sharedFailureReasons.push("start-boundary-not-provided");
  }
  if (startBoundaryProvided && !startBoundaryFinite) {
    sharedFailureReasons.push("pressure-volume-boundary-non-finite");
  }
  if (startBoundaryFinite && !acceptedPathTraceComplete) {
    sharedFailureReasons.push("accepted-path-trace-incomplete");
  }

  const sharedInputGatesPassed =
    protocolIdentityFormatValid &&
    modelConditionIdentityFormatValid &&
    canonicalPeriod1DeclaredByInput &&
    terminalCycleMatchesDeclaredPeriod1Evidence &&
    terminalCycleIntegrityDeclaredByInput &&
    startBoundaryProvided &&
    startBoundaryFinite &&
    acceptedPathTraceComplete;
  const leftVentricle = ventricularResultV1(
    "LV",
    input.startBoundary,
    input.terminalTrace.samples,
    sharedInputGatesPassed,
    sharedFailureReasons,
  );
  const rightVentricle = ventricularResultV1(
    "RV",
    input.startBoundary,
    input.terminalTrace.samples,
    sharedInputGatesPassed,
    sharedFailureReasons,
  );
  const leftInputGatesPassed = leftVentricle.transmuralBoundaryWorkComputed;
  const rightInputGatesPassed = rightVentricle.transmuralBoundaryWorkComputed;
  const status =
    leftInputGatesPassed && rightInputGatesPassed
      ? ("input-gates-passed-biventricular" as const)
      : leftInputGatesPassed
        ? ("input-gates-passed-left-ventricular-only" as const)
        : rightInputGatesPassed
          ? ("input-gates-passed-right-ventricular-only" as const)
          : ("input-gates-not-passed" as const);

  return Object.freeze({
    projectionId:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_TRANSMURAL_BOUNDARY_WORK_ENGINEERING_V1_ID,
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
      protocolIdentityFormatValid,
      modelConditionIdentityFormatValid,
      canonicalPeriod1DeclaredByInput,
      terminalCycleMatchesDeclaredPeriod1Evidence,
      terminalCycleIntegrityDeclaredByInput,
      startBoundaryProvided,
      startBoundaryFinite,
      acceptedPathTraceComplete,
      sourceProvenanceVerified: false as const,
    }),
    leftVentricle,
    rightVentricle,
    biventricularTransmuralBoundaryWorkComputed:
      leftInputGatesPassed && rightInputGatesPassed,
    syntheticEndToStartClosingSegmentApplied: false as const,
    engineeringProjectionOnly: true as const,
    sourceProvenanceVerified: false as const,
    historicalQualificationTransferred: false as const,
    officialQualificationEstablished: false as const,
    publicOutputEstablished: false as const,
    pvaEstablished: false as const,
    physiologicalValidationEstablished: false as const,
    clinicalValidationClaimed: false as const,
    policy:
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_TRANSMURAL_BOUNDARY_WORK_ENGINEERING_POLICY_V1,
  });
}

export function pressureVolumeBoundaryCandidateFromAcceptedTraceSampleV1(
  sample: MainWireIntegratedModelPeriodicTerminalTraceSampleV3,
): MainWireIntegratedModelPeriodicPressureVolumeBoundaryV1 {
  const boundary = Object.freeze({
    source: "caller-projected-trace-sample" as const,
    acceptedTimeSec: sample.acceptedTimeSec,
    chamberVolumeMl: Object.freeze({
      LV: sample.chamberVolumeMl.LV,
      RV: sample.chamberVolumeMl.RV,
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
  sharedInputGatesPassed: boolean,
  sharedFailureReasons: readonly MainWireIntegratedModelPeriodicTransmuralBoundaryWorkFailureReasonV1[],
): MainWireIntegratedModelPeriodicVentricularTransmuralBoundaryWorkV1 {
  const last = samples.at(-1) ?? null;
  const startCandidate =
    startBoundary === null
      ? null
      : Object.freeze({
          volumeMl: startBoundary.chamberVolumeMl[chamber],
          pressureMmHg: startBoundary.transmuralPressureMmHg[chamber],
        });
  const endCandidate =
    last === null
      ? null
      : Object.freeze({
          volumeMl: last.chamberVolumeMl[chamber],
          pressureMmHg: last.transmuralPressureMmHg[chamber],
        });
  const closure = endpointClosureV1(startCandidate, endCandidate);
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
  const rawTransmuralPathWorkMmHgMl = !pathGeometryAvailable
    ? null
    : acceptedTransmuralPathWorkV1(chamber, startBoundary!, samples);
  const transmuralPathWorkMmHgMl =
    rawTransmuralPathWorkMmHgMl !== null &&
    Number.isFinite(rawTransmuralPathWorkMmHgMl)
      ? rawTransmuralPathWorkMmHgMl
      : null;
  const transmuralBoundaryWorkComputed =
    sharedInputGatesPassed &&
    closure.withinTolerance &&
    transmuralPathWorkMmHgMl !== null;
  const failureReasons = [...sharedFailureReasons];
  if (
    (startCandidate !== null &&
      !pressureVolumePointIsFiniteV1(startCandidate)) ||
    (endCandidate !== null && !pressureVolumePointIsFiniteV1(endCandidate)) ||
    (startCandidate !== null &&
      endCandidate !== null &&
      pressureVolumePointIsFiniteV1(startCandidate) &&
      pressureVolumePointIsFiniteV1(endCandidate) &&
      closure.maximumNormalizedDelta === null)
  ) {
    pushUniqueFailureReasonV1(
      failureReasons,
      "pressure-volume-boundary-non-finite",
    );
  }
  if (closure.maximumNormalizedDelta !== null && !closure.withinTolerance) {
    failureReasons.push("pressure-volume-boundary-not-closed");
  }
  if (
    rawTransmuralPathWorkMmHgMl !== null &&
    !Number.isFinite(rawTransmuralPathWorkMmHgMl)
  ) {
    failureReasons.push("path-work-non-finite");
  }
  return Object.freeze({
    chamber,
    pressureBasis: "ventricular-transmural" as const,
    transmuralPathWorkMmHgMl,
    transmuralBoundaryWorkMmHgMl: transmuralBoundaryWorkComputed
      ? transmuralPathWorkMmHgMl
      : null,
    pathWorkDirection:
      transmuralPathWorkMmHgMl === null
        ? null
        : workDirectionV1(transmuralPathWorkMmHgMl),
    endpointClosure: closure,
    transmuralBoundaryWorkComputed,
    failureReasons: Object.freeze(failureReasons),
  });
}

function acceptedTransmuralPathWorkV1(
  chamber: "LV" | "RV",
  startBoundary: MainWireIntegratedModelPeriodicPressureVolumeBoundaryV1,
  samples: readonly MainWireIntegratedModelPeriodicTerminalTraceSampleV3[],
): number {
  let previousVolumeMl = startBoundary.chamberVolumeMl[chamber];
  let previousPressureMmHg = startBoundary.transmuralPressureMmHg[chamber];
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
): MainWireIntegratedModelPeriodicVentricularTransmuralBoundaryWorkV1["endpointClosure"] {
  const finiteStart = finitePressureVolumePointOrNullV1(start);
  const finiteEnd = finitePressureVolumePointOrNullV1(end);
  if (finiteStart === null || finiteEnd === null) {
    return unavailableEndpointClosureV1(finiteStart, finiteEnd);
  }
  const absoluteVolumeDeltaMl = Math.abs(
    finiteEnd.volumeMl - finiteStart.volumeMl,
  );
  const absolutePressureDeltaMmHg = Math.abs(
    finiteEnd.pressureMmHg - finiteStart.pressureMmHg,
  );
  const normalizedVolumeDelta =
    absoluteVolumeDeltaMl /
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_TRANSMURAL_BOUNDARY_WORK_ENGINEERING_POLICY_V1
      .closure.volumeReferenceScaleMl;
  const normalizedPressureDelta =
    absolutePressureDeltaMmHg /
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_TRANSMURAL_BOUNDARY_WORK_ENGINEERING_POLICY_V1
      .closure.pressureReferenceScaleMmHg;
  const maximumNormalizedDelta = Math.max(
    normalizedVolumeDelta,
    normalizedPressureDelta,
  );
  if (
    ![
      absoluteVolumeDeltaMl,
      absolutePressureDeltaMmHg,
      normalizedVolumeDelta,
      normalizedPressureDelta,
      maximumNormalizedDelta,
    ].every(Number.isFinite)
  ) {
    return unavailableEndpointClosureV1(finiteStart, finiteEnd);
  }
  return Object.freeze({
    start: finiteStart,
    end: finiteEnd,
    absoluteVolumeDeltaMl,
    absolutePressureDeltaMmHg,
    normalizedVolumeDelta,
    normalizedPressureDelta,
    maximumNormalizedDelta,
    withinTolerance:
      maximumNormalizedDelta <=
      MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_TRANSMURAL_BOUNDARY_WORK_ENGINEERING_POLICY_V1
        .closure.maximumNormalizedBoundaryDelta,
  });
}

function unavailableEndpointClosureV1(
  start: Readonly<{ volumeMl: number; pressureMmHg: number }> | null,
  end: Readonly<{ volumeMl: number; pressureMmHg: number }> | null,
): MainWireIntegratedModelPeriodicVentricularTransmuralBoundaryWorkV1["endpointClosure"] {
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

function traceIsCompleteV1(
  terminalCycle: MainWireIntegratedModelPeriodicTransmuralBoundaryWorkEngineeringInputV1["terminalCycle"],
  trace: MainWireIntegratedModelPeriodicTerminalCycleTraceV3,
  startBoundary: MainWireIntegratedModelPeriodicPressureVolumeBoundaryV1 | null,
): boolean {
  if (startBoundary === null || !boundaryIsFiniteV1(startBoundary))
    return false;
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
    MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_TRANSMURAL_BOUNDARY_WORK_ENGINEERING_POLICY_V1
      .closure.clockToleranceSec;
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
          (sample.acceptedTimeSec - trace.startTimeSec) / expectedDurationSec,
      ) >
        clockToleranceSec / expectedDurationSec ||
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
    Math.abs(accumulatedDurationSec - expectedDurationSec) <= clockToleranceSec
  );
}

function boundaryIsFiniteV1(
  boundary: MainWireIntegratedModelPeriodicPressureVolumeBoundaryV1,
): boolean {
  return [
    boundary.acceptedTimeSec,
    boundary.chamberVolumeMl.LV,
    boundary.chamberVolumeMl.RV,
    boundary.transmuralPressureMmHg.LV,
    boundary.transmuralPressureMmHg.RV,
  ].every(Number.isFinite);
}

function finitePressureVolumePointOrNullV1(
  point: Readonly<{ volumeMl: number; pressureMmHg: number }> | null,
): Readonly<{ volumeMl: number; pressureMmHg: number }> | null {
  if (point === null || !pressureVolumePointIsFiniteV1(point)) return null;
  return point;
}

function pressureVolumePointIsFiniteV1(
  point: Readonly<{ volumeMl: number; pressureMmHg: number }>,
): boolean {
  return Number.isFinite(point.volumeMl) && Number.isFinite(point.pressureMmHg);
}

function pushUniqueFailureReasonV1(
  failureReasons: MainWireIntegratedModelPeriodicTransmuralBoundaryWorkFailureReasonV1[],
  reason: MainWireIntegratedModelPeriodicTransmuralBoundaryWorkFailureReasonV1,
): void {
  if (!failureReasons.includes(reason)) failureReasons.push(reason);
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
): MainWireIntegratedModelPeriodicPathWorkDirectionV1 {
  if (workMmHgMl > 0) return "net-work-by-ventricle";
  if (workMmHgMl < 0) return "net-work-on-ventricle";
  return "zero-net-work";
}
