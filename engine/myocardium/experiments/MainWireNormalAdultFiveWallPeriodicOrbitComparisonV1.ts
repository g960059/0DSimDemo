import type {
  MainWireNormalAdultFiveWallDiagnosticSampleV2,
} from "@/engine/myocardium/diagnostics/MainWireNormalAdultFiveWallDiagnosticSampleV2";
import {
  MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DT_HALVING_SIGNAL_SCALES_V1,
  type MainWireNormalAdultFiveWallDtHalvingSignalIdV1,
  type MainWireNormalAdultFiveWallDtHalvingSignalUnitV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallDtHalvingV1";
import type {
  MainWireNormalAdultFiveWallPeriodicResultV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallPeriodicSteadyV1";

export const MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_ORBIT_COMPARISON_V1_ID =
  "main-wire-normal-adult-five-wall-same-grid-periodic-orbit-comparison-v1" as const;

export type MainWireNormalAdultFiveWallPeriodicOrbitSignalMetricV1 = Readonly<{
  signalId: MainWireNormalAdultFiveWallDtHalvingSignalIdV1;
  unit: MainWireNormalAdultFiveWallDtHalvingSignalUnitV1;
  referenceScale: number;
  maximumAbsoluteDifference: number;
  fixedScaleNormalizedMaximumDifference: number;
  /** ||primary - alternate||_2 / ||primary||_2; null if only the denominator is zero. */
  primaryReferencedRelativeL2Difference: number | null;
  /**
   * ||primary - alternate||_2 divided by the RMS of both signal L2 norms:
   * sqrt((||primary||_2^2 + ||alternate||_2^2) / 2).
   */
  symmetricRelativeL2Difference: number;
  worstAcceptedSampleIndex: number;
  worstCyclePhase01: number;
  primaryValueAtWorstDifference: number;
  alternateValueAtWorstDifference: number;
}>;

export type MainWireNormalAdultFiveWallPeriodicOrbitInterpretabilityReasonV1 =
  | "dt-mismatch"
  | "steps-per-beat-mismatch"
  | "la-sls-mode-mismatch"
  | "initializations-must-differ"
  | "primary-initialization-must-be-canonical"
  | "alternate-initialization-must-be-fixed-pulmonary-redistribution"
  | "maximum-beat-count-mismatch"
  | "protocol-identity-mismatch"
  | "primary-period1-not-converged"
  | "alternate-period1-not-converged"
  | "primary-final-complete-beat-missing-or-incomplete"
  | "alternate-final-complete-beat-missing-or-incomplete"
  | "same-index-cycle-phase-mismatch";

export type MainWireNormalAdultFiveWallPeriodicOrbitComparisonV1 = Readonly<{
  comparisonId:
    typeof MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_ORBIT_COMPARISON_V1_ID;
  protocolIdentity: Readonly<{
    exactMatch: boolean;
    identityHash: string | null;
    componentHashes:
      MainWireNormalAdultFiveWallPeriodicResultV1["protocolComponentHashes"]
      | null;
  }>;
  dtSec: number | null;
  stepsPerBeat: number | null;
  primaryInitialization: string;
  alternateInitialization: string;
  primaryFinalBeatIndex: number | null;
  alternateFinalBeatIndex: number | null;
  bothPeriod1Converged: boolean;
  interpretable: boolean;
  interpretabilityReasons:
    readonly MainWireNormalAdultFiveWallPeriodicOrbitInterpretabilityReasonV1[];
  identicalAcceptedSampleMapping: readonly Readonly<{
    acceptedSampleIndex: number;
    cyclePhase01: number;
  }>[];
  signalMetrics: Readonly<Record<
    MainWireNormalAdultFiveWallDtHalvingSignalIdV1,
    MainWireNormalAdultFiveWallPeriodicOrbitSignalMetricV1
  >> | null;
  initializationAudit: Readonly<{
    primary: MainWireNormalAdultFiveWallPeriodicResultV1["initializationAudit"];
    alternate: MainWireNormalAdultFiveWallPeriodicResultV1["initializationAudit"];
    canonicalTotalBloodVolumeDifferenceMl: number;
    initializedTotalBloodVolumeDifferenceMl: number;
    reportedWithinRunTotalBloodVolumeDifferenceMl: Readonly<{
      primary: number;
      alternate: number;
    }>;
    transferredVolumeMl: Readonly<{
      primary: number;
      alternate: number;
    }>;
  }>;
  claim: Readonly<{
    comparisonKind: "same-dt-same-grid-initialization-basin-difference";
    interpolationApplied: false;
    comparedBeat: "last-retained-complete-period1-beat-only";
    samePeriodicOrbitAcrossInitializationsClaimed: false;
    callerMustInterpretReportedDifferences: true;
    physiologicalOrNumericalPassThresholdApplied: false;
    parameterSearch: false;
  }>;
}>;

type SignalDefinition = Readonly<{
  signalId: MainWireNormalAdultFiveWallDtHalvingSignalIdV1;
  unit: MainWireNormalAdultFiveWallDtHalvingSignalUnitV1;
  referenceScale: number;
  read(sample: MainWireNormalAdultFiveWallDiagnosticSampleV2): number;
}>;

const SIGNAL_DEFINITIONS: readonly SignalDefinition[] = Object.freeze([
  signal("laBloodVolumeMl", "mL", (sample) => sample.nodeVolumeMl.LA),
  signal("lvBloodVolumeMl", "mL", (sample) => sample.nodeVolumeMl.LV),
  signal("laAbsolutePressureMmHg", "mmHg", (sample) =>
    sample.nodeAbsolutePressureMmHg.LA),
  signal("lvAbsolutePressureMmHg", "mmHg", (sample) =>
    sample.nodeAbsolutePressureMmHg.LV),
  signal("mitralFlowMlPerSec", "mL/s", (sample) => sample.flowMlPerSec.MV),
  signal("pulmonaryVeinToLaFlowMlPerSec", "mL/s", (sample) =>
    sample.flowMlPerSec.PVein_LA),
  signal("laTotalWallStressPa", "Pa", (sample) =>
    sample.wallStressPa.LA.total),
  signal("laFiberLogStrain", "log-strain", (sample) =>
    sample.wallFiberLogStrain.LA),
]);

/**
 * Compares final period-1 beats from the fixed canonical and pulmonary-volume
 * redistribution initializations at identical accepted sample indices. This
 * function reports differences only; it never declares the two orbits equal.
 */
export function compareMainWireNormalAdultFiveWallPeriodicOrbitsV1(
  primary: MainWireNormalAdultFiveWallPeriodicResultV1,
  alternate: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireNormalAdultFiveWallPeriodicOrbitComparisonV1 {
  validateResultMetadata(primary, "primary");
  validateResultMetadata(alternate, "alternate");
  const reasons: MainWireNormalAdultFiveWallPeriodicOrbitInterpretabilityReasonV1[] = [];
  const sameDt = nearlyEqual(primary.dtSec, alternate.dtSec);
  if (!sameDt) reasons.push("dt-mismatch");
  const sameSteps = primary.stepsPerBeat === alternate.stepsPerBeat;
  if (!sameSteps) reasons.push("steps-per-beat-mismatch");
  if (primary.laSlsMode !== alternate.laSlsMode) {
    reasons.push("la-sls-mode-mismatch");
  }
  if (primary.initialization === alternate.initialization) {
    reasons.push("initializations-must-differ");
  }
  if (primary.initialization !== "canonical") {
    reasons.push("primary-initialization-must-be-canonical");
  }
  if (alternate.initialization !== "pven-to-pvein-10ml") {
    reasons.push("alternate-initialization-must-be-fixed-pulmonary-redistribution");
  }
  if (primary.requestedMaximumBeatCount !== alternate.requestedMaximumBeatCount) {
    reasons.push("maximum-beat-count-mismatch");
  }
  const protocolIdentityMatches = matchingProtocolIdentity(primary, alternate);
  if (!protocolIdentityMatches) {
    reasons.push("protocol-identity-mismatch");
  }
  if (!primary.periodicSteadyStateClaimed) {
    reasons.push("primary-period1-not-converged");
  }
  if (!alternate.periodicSteadyStateClaimed) {
    reasons.push("alternate-period1-not-converged");
  }

  const primaryBeat = primary.retainedCompleteBeats.at(-1) ?? null;
  const alternateBeat = alternate.retainedCompleteBeats.at(-1) ?? null;
  if (primaryBeat === null
      || primaryBeat.samples.length !== primary.stepsPerBeat) {
    reasons.push("primary-final-complete-beat-missing-or-incomplete");
  }
  if (alternateBeat === null
      || alternateBeat.samples.length !== alternate.stepsPerBeat) {
    reasons.push("alternate-final-complete-beat-missing-or-incomplete");
  }

  let mapping: MainWireNormalAdultFiveWallPeriodicOrbitComparisonV1[
    "identicalAcceptedSampleMapping"
  ] = Object.freeze([]);
  if (sameDt && sameSteps && primaryBeat !== null && alternateBeat !== null
      && primaryBeat.samples.length === primary.stepsPerBeat
      && alternateBeat.samples.length === alternate.stepsPerBeat) {
    const candidate = primaryBeat.samples.map((sample, index) => {
      const alternateSample = alternateBeat.samples[index]!;
      return Object.freeze({
        acceptedSampleIndex: index,
        cyclePhase01: sample.cyclePhase01,
        phaseDifference: circularPhaseDifference(
          sample.cyclePhase01,
          alternateSample.cyclePhase01,
        ),
      });
    });
    if (candidate.some((entry) => entry.phaseDifference > 1e-10)) {
      reasons.push("same-index-cycle-phase-mismatch");
    } else {
      mapping = Object.freeze(candidate.map(({ phaseDifference: _ignored, ...entry }) =>
        Object.freeze(entry)));
    }
  }

  const interpretable = reasons.length === 0;
  const signalMetrics = interpretable
    && primaryBeat !== null && alternateBeat !== null
    ? compareSignals(primaryBeat.samples, alternateBeat.samples, mapping)
    : null;
  return Object.freeze({
    comparisonId:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_PERIODIC_ORBIT_COMPARISON_V1_ID,
    protocolIdentity: Object.freeze({
      exactMatch: protocolIdentityMatches,
      identityHash: protocolIdentityMatches
        ? primary.protocolIdentityHash
        : null,
      componentHashes: protocolIdentityMatches
        ? primary.protocolComponentHashes
        : null,
    }),
    dtSec: sameDt ? primary.dtSec : null,
    stepsPerBeat: sameSteps ? primary.stepsPerBeat : null,
    primaryInitialization: primary.initialization,
    alternateInitialization: alternate.initialization,
    primaryFinalBeatIndex: primaryBeat?.beatIndex ?? null,
    alternateFinalBeatIndex: alternateBeat?.beatIndex ?? null,
    bothPeriod1Converged:
      primary.periodicSteadyStateClaimed && alternate.periodicSteadyStateClaimed,
    interpretable,
    interpretabilityReasons: Object.freeze(reasons),
    identicalAcceptedSampleMapping: mapping,
    signalMetrics,
    initializationAudit: copyInitializationAudits(primary, alternate),
    claim: Object.freeze({
      comparisonKind: "same-dt-same-grid-initialization-basin-difference" as const,
      interpolationApplied: false as const,
      comparedBeat: "last-retained-complete-period1-beat-only" as const,
      samePeriodicOrbitAcrossInitializationsClaimed: false as const,
      callerMustInterpretReportedDifferences: true as const,
      physiologicalOrNumericalPassThresholdApplied: false as const,
      parameterSearch: false as const,
    }),
  });
}

function matchingProtocolIdentity(
  left: MainWireNormalAdultFiveWallPeriodicResultV1,
  right: MainWireNormalAdultFiveWallPeriodicResultV1,
): boolean {
  return typeof left.protocolIdentityHash === "string"
    && left.protocolIdentityHash.length > 0
    && typeof right.protocolIdentityHash === "string"
    && right.protocolIdentityHash.length > 0
    && left.protocolIdentityHash === right.protocolIdentityHash
    && left.protocolIdentity !== null
    && typeof left.protocolIdentity === "object"
    && right.protocolIdentity !== null
    && typeof right.protocolIdentity === "object"
    // The stable hash is a compact label; exact serialized identity equality
    // is also required so a hash collision cannot make unlike protocols pass.
    && JSON.stringify(left.protocolIdentity)
      === JSON.stringify(right.protocolIdentity);
}

function compareSignals(
  primarySamples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  alternateSamples: readonly MainWireNormalAdultFiveWallDiagnosticSampleV2[],
  mapping: MainWireNormalAdultFiveWallPeriodicOrbitComparisonV1[
    "identicalAcceptedSampleMapping"
  ],
): NonNullable<
  MainWireNormalAdultFiveWallPeriodicOrbitComparisonV1["signalMetrics"]
> {
  return Object.freeze(Object.fromEntries(SIGNAL_DEFINITIONS.map((definition) => {
    let maximumAbsoluteDifference = -1;
    let worstIndex = 0;
    let squaredDifferenceSum = 0;
    let squaredPrimarySum = 0;
    let squaredAlternateSum = 0;
    mapping.forEach((entry, index) => {
      const primaryValue = requireFinite(
        definition.read(primarySamples[entry.acceptedSampleIndex]!),
        `${definition.signalId} primary value`,
      );
      const alternateValue = requireFinite(
        definition.read(alternateSamples[entry.acceptedSampleIndex]!),
        `${definition.signalId} alternate value`,
      );
      const difference = primaryValue - alternateValue;
      const absoluteDifference = Math.abs(difference);
      if (absoluteDifference > maximumAbsoluteDifference) {
        maximumAbsoluteDifference = absoluteDifference;
        worstIndex = index;
      }
      squaredDifferenceSum += difference * difference;
      squaredPrimarySum += primaryValue * primaryValue;
      squaredAlternateSum += alternateValue * alternateValue;
    });
    for (const [label, value] of Object.entries({
      squaredDifferenceSum,
      squaredPrimarySum,
      squaredAlternateSum,
    })) {
      if (!Number.isFinite(value)) {
        throw new Error(`${definition.signalId} ${label} must be finite`);
      }
    }
    const symmetricSquaredReference =
      (squaredPrimarySum + squaredAlternateSum) / 2;
    const symmetricRelativeL2Difference = symmetricSquaredReference === 0
      ? 0
      : Math.sqrt(squaredDifferenceSum / symmetricSquaredReference);
    const primaryReferencedRelativeL2Difference = squaredPrimarySum === 0
      ? squaredDifferenceSum === 0 ? 0 : null
      : Math.sqrt(squaredDifferenceSum / squaredPrimarySum);
    const worst = mapping[worstIndex]!;
    const primaryValueAtWorstDifference = definition.read(
      primarySamples[worst.acceptedSampleIndex]!,
    );
    const alternateValueAtWorstDifference = definition.read(
      alternateSamples[worst.acceptedSampleIndex]!,
    );
    const metric: MainWireNormalAdultFiveWallPeriodicOrbitSignalMetricV1 =
      Object.freeze({
        signalId: definition.signalId,
        unit: definition.unit,
        referenceScale: definition.referenceScale,
        maximumAbsoluteDifference,
        fixedScaleNormalizedMaximumDifference:
          maximumAbsoluteDifference / definition.referenceScale,
        primaryReferencedRelativeL2Difference,
        symmetricRelativeL2Difference,
        worstAcceptedSampleIndex: worst.acceptedSampleIndex,
        worstCyclePhase01: worst.cyclePhase01,
        primaryValueAtWorstDifference,
        alternateValueAtWorstDifference,
      });
    return [definition.signalId, metric];
  }))) as NonNullable<
    MainWireNormalAdultFiveWallPeriodicOrbitComparisonV1["signalMetrics"]
  >;
}

function copyInitializationAudits(
  primary: MainWireNormalAdultFiveWallPeriodicResultV1,
  alternate: MainWireNormalAdultFiveWallPeriodicResultV1,
): MainWireNormalAdultFiveWallPeriodicOrbitComparisonV1["initializationAudit"] {
  const primaryAudit = Object.freeze({
    ...primary.initializationAudit,
    pulmonaryNodeVolumeDeltaMl: Object.freeze({
      ...primary.initializationAudit.pulmonaryNodeVolumeDeltaMl,
    }),
  });
  const alternateAudit = Object.freeze({
    ...alternate.initializationAudit,
    pulmonaryNodeVolumeDeltaMl: Object.freeze({
      ...alternate.initializationAudit.pulmonaryNodeVolumeDeltaMl,
    }),
  });
  for (const [label, value] of Object.entries({
    primaryCanonicalTotalBloodVolumeMl:
      primaryAudit.canonicalTotalBloodVolumeMl,
    alternateCanonicalTotalBloodVolumeMl:
      alternateAudit.canonicalTotalBloodVolumeMl,
    primaryInitializedTotalBloodVolumeMl:
      primaryAudit.initializedTotalBloodVolumeMl,
    alternateInitializedTotalBloodVolumeMl:
      alternateAudit.initializedTotalBloodVolumeMl,
    primaryWithinRunTotalBloodVolumeDifferenceMl:
      primaryAudit.totalBloodVolumeDifferenceMl,
    alternateWithinRunTotalBloodVolumeDifferenceMl:
      alternateAudit.totalBloodVolumeDifferenceMl,
  })) requireFinite(value, label);
  return Object.freeze({
    primary: primaryAudit,
    alternate: alternateAudit,
    canonicalTotalBloodVolumeDifferenceMl:
      alternateAudit.canonicalTotalBloodVolumeMl
      - primaryAudit.canonicalTotalBloodVolumeMl,
    initializedTotalBloodVolumeDifferenceMl:
      alternateAudit.initializedTotalBloodVolumeMl
      - primaryAudit.initializedTotalBloodVolumeMl,
    reportedWithinRunTotalBloodVolumeDifferenceMl: Object.freeze({
      primary: primaryAudit.totalBloodVolumeDifferenceMl,
      alternate: alternateAudit.totalBloodVolumeDifferenceMl,
    }),
    transferredVolumeMl: Object.freeze({
      primary: primaryAudit.transferredVolumeMl,
      alternate: alternateAudit.transferredVolumeMl,
    }),
  });
}

function signal(
  signalId: MainWireNormalAdultFiveWallDtHalvingSignalIdV1,
  unit: MainWireNormalAdultFiveWallDtHalvingSignalUnitV1,
  read: SignalDefinition["read"],
): SignalDefinition {
  return Object.freeze({
    signalId,
    unit,
    referenceScale:
      MAIN_WIRE_NORMAL_ADULT_FIVE_WALL_DT_HALVING_SIGNAL_SCALES_V1[signalId],
    read,
  });
}

function validateResultMetadata(
  result: MainWireNormalAdultFiveWallPeriodicResultV1,
  label: string,
): void {
  if (!(result.dtSec > 0) || !Number.isFinite(result.dtSec)) {
    throw new Error(`${label} dtSec must be positive and finite`);
  }
  if (!Number.isInteger(result.stepsPerBeat) || result.stepsPerBeat <= 0) {
    throw new Error(`${label} stepsPerBeat must be a positive integer`);
  }
  if (!Number.isInteger(result.requestedMaximumBeatCount)
      || result.requestedMaximumBeatCount <= 0) {
    throw new Error(`${label} requestedMaximumBeatCount must be a positive integer`);
  }
}

function circularPhaseDifference(a: number, b: number): number {
  requirePhase(a, "primary cycle phase");
  requirePhase(b, "alternate cycle phase");
  const raw = Math.abs(a - b);
  return Math.min(raw, Math.abs(1 - raw));
}

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(a), Math.abs(b));
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
  return value;
}

function requirePhase(value: number, label: string): number {
  requireFinite(value, label);
  if (!(value >= 0 && value < 1)) {
    throw new Error(`${label} must be in [0, 1)`);
  }
  return value;
}
