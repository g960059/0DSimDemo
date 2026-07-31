import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLOSURE_V3_ID,
  type MainWireIntegratedModelPeriodicClosureReportV3,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV3";
import { canonicalJsonStringify } from "@/engine/integrity";

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLASSIFIER_V3_ID =
  "main-wire-integrated-composed-rhythm-periodic-classifier-v3" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLASSIFIER_CLAIM_V3 =
  Object.freeze({
    acceptedRhythm: "regular-sinus-source-period-boundaries-only" as const,
    period1ComparisonLag: 1 as const,
    period2ComparisonLag: 2 as const,
    minimumConsecutiveClassificationCycles: 3 as const,
    thresholds:
      "predeclared-V3-policy-not-derived-from-V3-observations" as const,
    protocolIdentityRequirement:
      "one-lowercase-sha256-for-every-observation" as const,
    boundaryProvenanceRequirement:
      "continuous-outer-regular-source-capture-AV-distal-backup-interval-and-coronary-window-chain" as const,
    fixedHorizonCharacterizationCanEstablishCanonicalPeriodicity:
      false as const,
    numericalPeriodicityIsPhysiologicalAcceptance: false as const,
    constructionTargetComparisonIsIndependentValidation: false as const,
    clinicalValidationClaimed: false as const,
    releaseAcceptanceClaimed: false as const,
  });

export type MainWireIntegratedModelPeriodicEvidenceRoleV3 =
  "canonical-periodic-protocol" | "bounded-exploration-only";

export type MainWireIntegratedModelPeriodicCycleObservationV3 = Readonly<{
  cycleIndex: number;
  evidenceRole: MainWireIntegratedModelPeriodicEvidenceRoleV3;
  protocolIdentityHash: string;
  period1: MainWireIntegratedModelPeriodicClosureReportV3;
  period2: MainWireIntegratedModelPeriodicClosureReportV3 | null;
}>;

export type MainWireIntegratedModelPeriodicClassifierOptionsV3 = Readonly<{
  period1NormalizedTolerance: number;
  period2NormalizedTolerance: number;
  period2MinimumPeriod1NormalizedDelta: number;
  consecutiveCycles: number;
}>;

export type MainWireIntegratedModelPeriodicClassificationV3 = Readonly<{
  classifierId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLASSIFIER_V3_ID;
  status: "period1-converged" | "period2-suspect" | "not-converged";
  latestCycleIndex: number | null;
  consecutiveCyclesRequired: number;
  minimumConsecutiveCycles: 3;
  acceptedEvidenceRole: "canonical-periodic-protocol";
  evidenceCycleIndices: readonly number[];
  latestPeriod1MaximumNormalizedDelta: number | null;
  latestPeriod2MaximumNormalizedDelta: number | null;
  physiologicalAcceptanceEstablished: false;
  independentValidationEstablished: false;
  releaseAcceptanceEstablished: false;
}>;

export function classifyMainWireIntegratedModelPeriodicityV3(
  observations: readonly MainWireIntegratedModelPeriodicCycleObservationV3[],
  options: MainWireIntegratedModelPeriodicClassifierOptionsV3,
): MainWireIntegratedModelPeriodicClassificationV3 {
  validateOptions(options);
  validateObservations(observations);
  const latest = observations.at(-1);
  const suffix = observations.slice(-options.consecutiveCycles);
  const enough =
    suffix.length === options.consecutiveCycles &&
    suffix.every(
      (observation, index) =>
        index === 0 ||
        observation.cycleIndex === suffix[index - 1]!.cycleIndex + 1,
    ) &&
    suffix.every(
      (observation) =>
        observation.evidenceRole === "canonical-periodic-protocol",
    );
  const period1 =
    enough &&
    suffix.every(
      (observation) =>
        observation.period1.overall.maximumNormalizedDelta <=
        options.period1NormalizedTolerance,
    );
  const period2 =
    !period1 &&
    enough &&
    suffix.every(
      (observation) =>
        observation.period2 !== null &&
        observation.period1.overall.maximumNormalizedDelta >=
          options.period2MinimumPeriod1NormalizedDelta &&
        observation.period2.overall.maximumNormalizedDelta <=
          options.period2NormalizedTolerance,
    );
  const status = period1
    ? ("period1-converged" as const)
    : period2
      ? ("period2-suspect" as const)
      : ("not-converged" as const);
  return Object.freeze({
    classifierId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLASSIFIER_V3_ID,
    status,
    latestCycleIndex: latest?.cycleIndex ?? null,
    consecutiveCyclesRequired: options.consecutiveCycles,
    minimumConsecutiveCycles: 3 as const,
    acceptedEvidenceRole: "canonical-periodic-protocol" as const,
    evidenceCycleIndices:
      status === "not-converged"
        ? Object.freeze([])
        : Object.freeze(suffix.map((observation) => observation.cycleIndex)),
    latestPeriod1MaximumNormalizedDelta:
      latest?.period1.overall.maximumNormalizedDelta ?? null,
    latestPeriod2MaximumNormalizedDelta:
      latest?.period2?.overall.maximumNormalizedDelta ?? null,
    physiologicalAcceptanceEstablished: false as const,
    independentValidationEstablished: false as const,
    releaseAcceptanceEstablished: false as const,
  });
}

function validateOptions(
  options: MainWireIntegratedModelPeriodicClassifierOptionsV3,
): void {
  for (const [name, value] of Object.entries({
    period1NormalizedTolerance: options.period1NormalizedTolerance,
    period2NormalizedTolerance: options.period2NormalizedTolerance,
    period2MinimumPeriod1NormalizedDelta:
      options.period2MinimumPeriod1NormalizedDelta,
  })) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${name} must be nonnegative finite`);
    }
  }
  if (
    !Number.isSafeInteger(options.consecutiveCycles) ||
    options.consecutiveCycles < 3
  ) {
    throw new Error("V3 periodic classifier requires at least 3 cycles");
  }
  if (
    options.period2MinimumPeriod1NormalizedDelta <=
    options.period1NormalizedTolerance
  ) {
    throw new Error("V3 period2 minimum P1 delta must exceed the P1 tolerance");
  }
}

function validateObservations(
  observations: readonly MainWireIntegratedModelPeriodicCycleObservationV3[],
): void {
  let previous: MainWireIntegratedModelPeriodicCycleObservationV3 | null = null;
  let protocolIdentityHash: string | null = null;
  let compatibilityJson: string | null = null;
  let referenceScaleSetId: string | null = null;
  for (const observation of observations) {
    if (
      !Number.isSafeInteger(observation.cycleIndex) ||
      observation.cycleIndex < 1 ||
      (previous !== null && observation.cycleIndex <= previous.cycleIndex)
    ) {
      throw new Error("V3 periodic cycle indices must strictly increase");
    }
    if (
      observation.evidenceRole !== "canonical-periodic-protocol" &&
      observation.evidenceRole !== "bounded-exploration-only"
    ) {
      throw new Error("unsupported V3 periodic evidence role");
    }
    if (!/^[0-9a-f]{64}$/.test(observation.protocolIdentityHash)) {
      throw new Error(
        "V3 periodic protocol identity must be lowercase SHA-256",
      );
    }
    protocolIdentityHash ??= observation.protocolIdentityHash;
    if (observation.protocolIdentityHash !== protocolIdentityHash) {
      throw new Error("V3 periodic observations use different protocols");
    }
    validateReport(observation.period1, 1);
    if (observation.period2 !== null) validateReport(observation.period2, 2);
    referenceScaleSetId ??= observation.period1.referenceScaleSetId;
    if (
      observation.period1.referenceScaleSetId !== referenceScaleSetId ||
      (observation.period2 !== null &&
        observation.period2.referenceScaleSetId !== referenceScaleSetId)
    ) {
      throw new Error(
        "V3 periodic observations use different reference scales",
      );
    }
    const currentCompatibilityJson = canonicalJsonStringify(
      observation.period1.compatibility,
    );
    compatibilityJson ??= currentCompatibilityJson;
    if (
      currentCompatibilityJson !== compatibilityJson ||
      (observation.period2 !== null &&
        canonicalJsonStringify(observation.period2.compatibility) !==
          compatibilityJson)
    ) {
      throw new Error("V3 periodic observations use incompatible models");
    }
    if (
      observation.period2 !== null &&
      boundaryJson(observation.period1, "current") !==
        boundaryJson(observation.period2, "current")
    ) {
      throw new Error("V3 P1 and P2 current boundaries differ");
    }
    if (
      previous !== null &&
      observation.cycleIndex === previous.cycleIndex + 1
    ) {
      if (
        boundaryJson(previous.period1, "current") !==
        boundaryJson(observation.period1, "reference")
      ) {
        throw new Error("V3 consecutive P1 boundary chain is discontinuous");
      }
      if (
        observation.period2 !== null &&
        boundaryJson(previous.period1, "reference") !==
          boundaryJson(observation.period2, "reference")
      ) {
        throw new Error("V3 P2 does not reference the two-back boundary");
      }
    }
    previous = observation;
  }
}

function validateReport(
  report: MainWireIntegratedModelPeriodicClosureReportV3,
  expectedLag: 1 | 2,
): void {
  if (
    report.closureId !== MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLOSURE_V3_ID ||
    report.provenance.periodLag !== expectedLag ||
    report.overall.numericEntryCount <=
      report.coronaryClosure.overall.numericEntryCount ||
    report.overall.entryCount <= report.coronaryClosure.overall.entryCount ||
    !Number.isFinite(report.overall.maximumNormalizedDelta) ||
    report.overall.maximumNormalizedDelta < 0 ||
    !Object.values(report.gates).every((value) => value === true)
  ) {
    throw new Error(`invalid V3 P${expectedLag} periodic closure report`);
  }
}

function boundaryJson(
  report: MainWireIntegratedModelPeriodicClosureReportV3,
  side: "current" | "reference",
): string {
  const provenance = report.provenance;
  const coronary = report.coronaryClosure.provenance;
  const current = side === "current";
  return canonicalJsonStringify({
    acceptedTimeSec: current
      ? provenance.currentAcceptedTimeSec
      : provenance.referenceAcceptedTimeSec,
    revision: current
      ? provenance.currentRevision
      : provenance.referenceRevision,
    regularNextSourceSequence: current
      ? provenance.currentRegularNextSourceSequence
      : provenance.referenceRegularNextSourceSequence,
    coronaryWindowIndex: current
      ? coronary.currentAutoregulationWindowIndex
      : coronary.referenceAutoregulationWindowIndex,
    coronaryWindowStartRevision: current
      ? coronary.currentAutoregulationWindowStartRevision
      : coronary.referenceAutoregulationWindowStartRevision,
    coronaryWindowStartAcceptedTimeSec: current
      ? coronary.currentAutoregulationWindowStartAcceptedTimeSec
      : coronary.referenceAutoregulationWindowStartAcceptedTimeSec,
  });
}
