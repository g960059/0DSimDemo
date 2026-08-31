import {
  type MainWireStandard66P1SettlingResultV1,
  type MainWireStandard66P1SettlingWindowBoundaryV1,
} from "@/analysis/runtime/MainWireStandard66P1SettlingRunnerV1";
import {
  compareMainWireIntegratedModelAcceptedStatesForPhaseLagDiagnosticV1,
  type MainWireIntegratedModelPhaseLagDiagnosticLagV1,
  type MainWireIntegratedModelPhaseLagDiagnosticReportV1,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV3";

export const MAIN_WIRE_STANDARD66_PHASE_LAG_DIAGNOSTIC_V1_ID =
  "main-wire-standard66-late-exact-boundary-phase-lag-diagnostic-v1" as const;

export const MAIN_WIRE_STANDARD66_PHASE_LAG_DIAGNOSTIC_CLAIM_V1 = Object.freeze(
  {
    purpose: "research-diagnostic-outside-formal-validation-protocol" as const,
    source:
      "late-four-consecutive-exact-empty-coronary-window-boundaries" as const,
    requestedGridOriginSec: 0 as const,
    fullAcceptedStateLagsCompared: Object.freeze([1, 2, 3] as const),
    oneLagThreeComparisonEstablishesPeriodThree: false as const,
    formalPeriodicClassifierEligible: false as const,
    numericalPeriodicityEstablished: false as const,
    physiologicalAcceptanceEstablished: false as const,
    independentValidationEstablished: false as const,
    clinicalValidationClaimed: false as const,
    exactModelMutation: false as const,
    exactFrameOutputReserved: false as const,
    registryOrModelSurfaceChanged: false as const,
  },
);

export type MainWireStandard66ZeroAnchoredGridPhaseV1 = Readonly<{
  suffixOrdinal: 0 | 1 | 2 | 3;
  windowIndex: number;
  acceptedTimeSec: number;
  lowerGridOrdinal: number;
  phaseSec: number;
  phaseFraction01: number;
  landsOnZeroAnchoredRequestedGrid: boolean;
}>;

export type MainWireStandard66PhaseLagComparisonV1 = Readonly<{
  expectedLag: MainWireIntegratedModelPhaseLagDiagnosticLagV1;
  currentSuffixOrdinal: 3;
  referenceSuffixOrdinal: 0 | 1 | 2;
  currentWindowIndex: number;
  referenceWindowIndex: number;
  zeroAnchoredGridPhase: Readonly<{
    currentPhaseSec: number;
    referencePhaseSec: number;
    circularAbsoluteDifferenceSec: number;
    phaseMatched: boolean;
  }>;
  fullAcceptedStateReport: MainWireIntegratedModelPhaseLagDiagnosticReportV1;
}>;

export type MainWireStandard66PhaseLagDiagnosticV1 = Readonly<{
  methodId: typeof MAIN_WIRE_STANDARD66_PHASE_LAG_DIAGNOSTIC_V1_ID;
  source: Readonly<{
    settlingRunnerId: MainWireStandard66P1SettlingResultV1["runnerId"];
    settlingProtocolIdentityHash: string;
    executionPurpose: "research-eager";
    settlementStatus: "research-period1-candidate" | "maximum-horizon-reached";
    retainedExactBoundaryCount: 4;
    retainedPeriod1ObservationCount: 3;
    retainedPassingP1ObservationCount: number;
  }>;
  requestedGrid: Readonly<{
    originSec: 0;
    requestedStepSec: number;
    phaseDefinition: "accepted-time-minus-zero-anchored-lower-grid-time-with-near-grid-normalization";
    boundaryPhases: readonly MainWireStandard66ZeroAnchoredGridPhaseV1[];
  }>;
  fullAcceptedStateLagComparisons: readonly MainWireStandard66PhaseLagComparisonV1[];
  interpretationBoundary: Readonly<{
    lagThreeComparisonCount: 1;
    oneLagThreeComparisonEstablishesPeriodThree: false;
    formalPeriodicClassifierEligible: false;
    numericalPeriodicityEstablished: false;
  }>;
  claim: typeof MAIN_WIRE_STANDARD66_PHASE_LAG_DIAGNOSTIC_CLAIM_V1;
}>;

/** Pure secondary analysis; it never mutates or advances the live model. */
export function measureMainWireStandard66PhaseLagDiagnosticV1(
  input: Readonly<{
    settling: MainWireStandard66P1SettlingResultV1;
    exactBoundarySuffix: readonly MainWireStandard66P1SettlingWindowBoundaryV1[];
  }>,
): MainWireStandard66PhaseLagDiagnosticV1 {
  requireLateResearchTerminalV1(input.settling, input.exactBoundarySuffix);
  const requestedStepSec = input.settling.clock.requestedStepSec;
  const phases = input.exactBoundarySuffix.map((boundary, suffixOrdinal) =>
    zeroAnchoredGridPhaseV1(
      boundary,
      suffixOrdinal as 0 | 1 | 2 | 3,
      requestedStepSec,
    ),
  );
  const current = input.exactBoundarySuffix[3]!;
  const comparisons = ([1, 2, 3] as const).map((expectedLag) => {
    const referenceSuffixOrdinal = (3 - expectedLag) as 0 | 1 | 2;
    const reference = input.exactBoundarySuffix[referenceSuffixOrdinal]!;
    const currentPhase = phases[3]!;
    const referencePhase = phases[referenceSuffixOrdinal]!;
    const rawPhaseDifferenceSec = Math.abs(
      currentPhase.phaseSec - referencePhase.phaseSec,
    );
    const circularAbsoluteDifferenceSec = Math.min(
      rawPhaseDifferenceSec,
      requestedStepSec - rawPhaseDifferenceSec,
    );
    const phaseMatched =
      circularAbsoluteDifferenceSec <=
      timeToleranceV1(
        current.acceptedTimeSec,
        reference.acceptedTimeSec,
        requestedStepSec,
      );
    return Object.freeze({
      expectedLag,
      currentSuffixOrdinal: 3 as const,
      referenceSuffixOrdinal,
      currentWindowIndex: current.windowIndex,
      referenceWindowIndex: reference.windowIndex,
      zeroAnchoredGridPhase: Object.freeze({
        currentPhaseSec: currentPhase.phaseSec,
        referencePhaseSec: referencePhase.phaseSec,
        circularAbsoluteDifferenceSec,
        phaseMatched,
      }),
      fullAcceptedStateReport:
        compareMainWireIntegratedModelAcceptedStatesForPhaseLagDiagnosticV1(
          current.acceptedState,
          reference.acceptedState,
          expectedLag,
        ),
    });
  });

  return Object.freeze({
    methodId: MAIN_WIRE_STANDARD66_PHASE_LAG_DIAGNOSTIC_V1_ID,
    source: Object.freeze({
      settlingRunnerId: input.settling.runnerId,
      settlingProtocolIdentityHash: input.settling.protocolIdentityHash,
      executionPurpose: "research-eager" as const,
      settlementStatus: input.settling.status as
        "research-period1-candidate" | "maximum-horizon-reached",
      retainedExactBoundaryCount: 4 as const,
      retainedPeriod1ObservationCount: 3 as const,
      retainedPassingP1ObservationCount:
        input.settling.retainedPeriod1Observations.filter(
          ({ withinPeriod1Tolerance }) => withinPeriod1Tolerance,
        ).length,
    }),
    requestedGrid: Object.freeze({
      originSec: 0 as const,
      requestedStepSec,
      phaseDefinition:
        "accepted-time-minus-zero-anchored-lower-grid-time-with-near-grid-normalization" as const,
      boundaryPhases: Object.freeze(phases),
    }),
    fullAcceptedStateLagComparisons: Object.freeze(comparisons),
    interpretationBoundary: Object.freeze({
      lagThreeComparisonCount: 1 as const,
      oneLagThreeComparisonEstablishesPeriodThree: false as const,
      formalPeriodicClassifierEligible: false as const,
      numericalPeriodicityEstablished: false as const,
    }),
    claim: MAIN_WIRE_STANDARD66_PHASE_LAG_DIAGNOSTIC_CLAIM_V1,
  });
}

function requireLateResearchTerminalV1(
  settling: MainWireStandard66P1SettlingResultV1,
  boundaries: readonly MainWireStandard66P1SettlingWindowBoundaryV1[],
): void {
  if (
    settling.executionPurpose !== "research-eager" ||
    (settling.status !== "research-period1-candidate" &&
      settling.status !== "maximum-horizon-reached") ||
    settling.failure !== null ||
    settling.numericalPeriod1Established
  ) {
    throw new Error(
      "Standard66 phase-lag diagnostic requires a completed research-eager terminal",
    );
  }
  if (
    boundaries.length !== 4 ||
    settling.periodicBoundary.retainedWindowBoundaryLimit !== 4
  ) {
    throw new Error(
      "Standard66 phase-lag diagnostic requires exactly four retained boundaries",
    );
  }
  const observations = settling.retainedPeriod1Observations;
  if (
    observations.length !== 3 ||
    observations.some(
      (observation, index) =>
        observation.windowIndex !== boundaries[index + 1]!.windowIndex ||
        observation.acceptedTimeSec !==
          boundaries[index + 1]!.acceptedTimeSec ||
        observation.acceptedRevision !==
          boundaries[index + 1]!.acceptedRevision,
    )
  ) {
    throw new Error(
      "Standard66 phase-lag diagnostic requires three aligned retained P1 observations",
    );
  }
  for (let index = 1; index < boundaries.length; index += 1) {
    if (
      boundaries[index]!.windowIndex !==
      boundaries[index - 1]!.windowIndex + 1
    ) {
      throw new Error(
        "Standard66 phase-lag diagnostic boundaries are not consecutive",
      );
    }
  }
}

function zeroAnchoredGridPhaseV1(
  boundary: MainWireStandard66P1SettlingWindowBoundaryV1,
  suffixOrdinal: 0 | 1 | 2 | 3,
  requestedStepSec: number,
): MainWireStandard66ZeroAnchoredGridPhaseV1 {
  if (!Number.isFinite(requestedStepSec) || requestedStepSec <= 0) {
    throw new Error("Standard66 phase-lag requested step is invalid");
  }
  const ratio = boundary.acceptedTimeSec / requestedStepSec;
  const nearestOrdinal = Math.round(ratio);
  const tolerance = timeToleranceV1(boundary.acceptedTimeSec, requestedStepSec);
  const nearGrid =
    Math.abs(boundary.acceptedTimeSec - nearestOrdinal * requestedStepSec) <=
    tolerance;
  const lowerGridOrdinal = nearGrid ? nearestOrdinal : Math.floor(ratio);
  const phaseSec = nearGrid
    ? 0
    : boundary.acceptedTimeSec - lowerGridOrdinal * requestedStepSec;
  if (
    !Number.isSafeInteger(lowerGridOrdinal) ||
    lowerGridOrdinal < 0 ||
    phaseSec < 0 ||
    phaseSec >= requestedStepSec
  ) {
    throw new Error("Standard66 phase-lag zero-anchored grid phase is invalid");
  }
  return Object.freeze({
    suffixOrdinal,
    windowIndex: boundary.windowIndex,
    acceptedTimeSec: boundary.acceptedTimeSec,
    lowerGridOrdinal,
    phaseSec,
    phaseFraction01: phaseSec / requestedStepSec,
    landsOnZeroAnchoredRequestedGrid: phaseSec === 0,
  });
}

function timeToleranceV1(...values: readonly number[]): number {
  return (
    64 * Number.EPSILON * Math.max(1, ...values.map((value) => Math.abs(value)))
  );
}
