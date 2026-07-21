import {
  MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLOSURE_V2_ID,
  type MainWireIntegratedModelPeriodicClosureReportV2,
} from "@/engine/myocardium/experiments/MainWireIntegratedModelPeriodicClosureV2";
import { canonicalJsonStringify } from "@/engine/scientific/release";

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLASSIFIER_V2_ID =
  "main-wire-integrated-generated-rhythm-periodic-classifier-v2" as const;

export const MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLASSIFIER_CLAIM_V2 =
  Object.freeze({
    acceptedRhythm: "regular-sinus-source-period-boundaries-only" as const,
    period1ComparisonLag: 1 as const,
    period2ComparisonLag: 2 as const,
    minimumConsecutiveClassificationCycles: 3 as const,
    acceptedEvidenceRole: "canonical-periodic-protocol" as const,
    protocolIdentityRequirement:
      "one-lowercase-sha256-for-every-observation" as const,
    boundaryProvenanceRequirement:
      "continuous-outer-generator-av-and-coronary-window-chain" as const,
    thresholds:
      "caller-supplied-preregistered-policy-not-derived-from-observations" as const,
    period2Interpretation: "numerical-two-cycle-orbit-suspect-only" as const,
    physiologicalAcceptanceClaimed: false as const,
    clinicalValidationClaimed: false as const,
    releaseAcceptanceClaimed: false as const,
  });

export type MainWireIntegratedModelPeriodicEvidenceRoleV2 =
  | "canonical-periodic-protocol"
  | "bounded-exploration-only";

export type MainWireIntegratedModelPeriodicCycleObservationV2 = Readonly<{
  cycleIndex: number;
  evidenceRole: MainWireIntegratedModelPeriodicEvidenceRoleV2;
  protocolIdentityHash: string;
  period1: MainWireIntegratedModelPeriodicClosureReportV2 | null;
  period2: MainWireIntegratedModelPeriodicClosureReportV2 | null;
}>;

export type MainWireIntegratedModelPeriodicClassifierOptionsV2 = Readonly<{
  period1NormalizedTolerance: number;
  period2NormalizedTolerance: number;
  period2MinimumPeriod1NormalizedDelta: number;
  consecutiveCycles: number;
}>;

export type MainWireIntegratedModelPeriodicClassificationStatusV2 =
  | "period1-converged"
  | "period2-suspect"
  | "not-converged";

export type MainWireIntegratedModelPeriodicClassificationV2 = Readonly<{
  classifierId: typeof MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLASSIFIER_V2_ID;
  status: MainWireIntegratedModelPeriodicClassificationStatusV2;
  latestCycleIndex: number | null;
  consecutiveCyclesRequired: number;
  minimumConsecutiveCycles: 3;
  acceptedEvidenceRole: "canonical-periodic-protocol";
  evidenceCycleIndices: readonly number[];
  latestPeriod1MaximumNormalizedDelta: number | null;
  latestPeriod2MaximumNormalizedDelta: number | null;
  physiologicalAcceptanceEstablished: false;
  releaseAcceptanceEstablished: false;
}>;

export function classifyMainWireIntegratedModelPeriodicityV2(
  observations: readonly MainWireIntegratedModelPeriodicCycleObservationV2[],
  options: MainWireIntegratedModelPeriodicClassifierOptionsV2,
): MainWireIntegratedModelPeriodicClassificationV2 {
  validateOptions(options);
  validateObservations(observations);
  const latest = observations.at(-1);
  const suffix = observations.slice(-options.consecutiveCycles);
  const enough = suffix.length === options.consecutiveCycles
    && suffix.every((observation, index) => index === 0
      || observation.cycleIndex === suffix[index - 1]!.cycleIndex + 1)
    && suffix.every((observation) => observation.evidenceRole
      === "canonical-periodic-protocol");
  const period1 = enough && suffix.every((observation) =>
    observation.period1 !== null
    && observation.period1.overall.maximumNormalizedDelta
      <= options.period1NormalizedTolerance);
  const period2 = !period1 && enough && suffix.every((observation) =>
    observation.period1 !== null
    && observation.period2 !== null
    && observation.period1.overall.maximumNormalizedDelta
      >= options.period2MinimumPeriod1NormalizedDelta
    && observation.period2.overall.maximumNormalizedDelta
      <= options.period2NormalizedTolerance);
  const status: MainWireIntegratedModelPeriodicClassificationStatusV2 =
    period1
      ? "period1-converged"
      : period2 ? "period2-suspect" : "not-converged";
  return Object.freeze({
    classifierId: MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLASSIFIER_V2_ID,
    status,
    latestCycleIndex: latest?.cycleIndex ?? null,
    consecutiveCyclesRequired: options.consecutiveCycles,
    minimumConsecutiveCycles: 3 as const,
    acceptedEvidenceRole: "canonical-periodic-protocol" as const,
    evidenceCycleIndices: status === "not-converged"
      ? Object.freeze([])
      : Object.freeze(suffix.map((observation) => observation.cycleIndex)),
    latestPeriod1MaximumNormalizedDelta:
      latest?.period1?.overall.maximumNormalizedDelta ?? null,
    latestPeriod2MaximumNormalizedDelta:
      latest?.period2?.overall.maximumNormalizedDelta ?? null,
    physiologicalAcceptanceEstablished: false as const,
    releaseAcceptanceEstablished: false as const,
  });
}

function validateOptions(
  options: MainWireIntegratedModelPeriodicClassifierOptionsV2,
): void {
  for (const [name, value] of Object.entries({
    period1NormalizedTolerance: options.period1NormalizedTolerance,
    period2NormalizedTolerance: options.period2NormalizedTolerance,
    period2MinimumPeriod1NormalizedDelta:
      options.period2MinimumPeriod1NormalizedDelta,
  })) {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${name} must be nonnegative and finite`);
    }
  }
  if (!Number.isInteger(options.consecutiveCycles)
    || options.consecutiveCycles
      < MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLASSIFIER_CLAIM_V2
        .minimumConsecutiveClassificationCycles) {
    throw new Error("integrated classifier requires at least 3 consecutive cycles");
  }
  if (options.period2MinimumPeriod1NormalizedDelta
      <= options.period1NormalizedTolerance) {
    throw new Error(
      "period2MinimumPeriod1NormalizedDelta must exceed period1NormalizedTolerance",
    );
  }
}

function validateObservations(
  observations: readonly MainWireIntegratedModelPeriodicCycleObservationV2[],
): void {
  let previousIndex = -1;
  let previous:
    MainWireIntegratedModelPeriodicCycleObservationV2 | null = null;
  let protocolIdentityHash: string | null = null;
  let referenceScaleSetId: string | null = null;
  let compatibilityJson: string | null = null;
  for (const observation of observations) {
    if (!Number.isInteger(observation.cycleIndex)
      || observation.cycleIndex < 0) {
      throw new Error("integrated cycleIndex must be a nonnegative integer");
    }
    if (observation.cycleIndex <= previousIndex) {
      throw new Error("integrated observations must have increasing cycleIndex");
    }
    previousIndex = observation.cycleIndex;
    if (observation.evidenceRole !== "canonical-periodic-protocol"
      && observation.evidenceRole !== "bounded-exploration-only") {
      throw new Error("unsupported integrated periodic evidence role");
    }
    if (!/^[0-9a-f]{64}$/.test(observation.protocolIdentityHash)) {
      throw new Error("integrated protocolIdentityHash must be lowercase SHA-256");
    }
    protocolIdentityHash ??= observation.protocolIdentityHash;
    if (observation.protocolIdentityHash !== protocolIdentityHash) {
      throw new Error("integrated observations use different protocol identities");
    }
    validateLagReport(observation.period1, 1, "period1");
    validateLagReport(observation.period2, 2, "period2");
    if (observation.period1 === null && observation.period2 !== null) {
      throw new Error("integrated period2 requires the same-boundary period1");
    }
    for (const report of [observation.period1, observation.period2]) {
      if (report === null) continue;
      referenceScaleSetId ??= report.referenceScaleSetId;
      if (report.referenceScaleSetId !== referenceScaleSetId) {
        throw new Error("integrated observations use different reference scales");
      }
      const currentCompatibilityJson = canonicalJsonStringify(
        report.compatibility,
      );
      compatibilityJson ??= currentCompatibilityJson;
      if (currentCompatibilityJson !== compatibilityJson) {
        throw new Error("integrated observations use incompatible model identities");
      }
    }
    if (observation.period1 !== null && observation.period2 !== null
      && currentBoundaryJson(observation.period1)
        !== currentBoundaryJson(observation.period2)) {
      throw new Error("integrated P1 and P2 current boundary differs");
    }
    if (previous !== null
      && observation.cycleIndex === previous.cycleIndex + 1) {
      validateConsecutiveBoundaryChain(previous, observation);
    }
    previous = observation;
  }
}

function validateLagReport(
  report: MainWireIntegratedModelPeriodicClosureReportV2 | null,
  expectedLag: 1 | 2,
  label: string,
): void {
  if (report === null) return;
  if (report.closureId !== MAIN_WIRE_INTEGRATED_MODEL_PERIODIC_CLOSURE_V2_ID) {
    throw new Error(`unsupported integrated ${label} closure report`);
  }
  if (report.provenance.periodLag !== expectedLag) {
    throw new Error(`integrated ${label} report has the wrong period lag`);
  }
  const pendingCount = report.overall.pendingEffectiveActivationCount;
  const expectedIntegratedNumeric = 18 + 2 * pendingCount;
  const expectedNumeric = 104 + expectedIntegratedNumeric;
  if (!Number.isSafeInteger(pendingCount) || pendingCount < 0
    || report.overall.coronaryNumericEntryCount !== 104
    || report.overall.integratedNumericEntryCount !== expectedIntegratedNumeric
    || report.overall.numericEntryCount !== expectedNumeric
    || report.overall.booleanEntryCount !== 2
    || report.overall.entryCount !== expectedNumeric + 2) {
    throw new Error(`integrated ${label} closure dimension is invalid`);
  }
  if (!Number.isFinite(report.overall.maximumNormalizedDelta)
    || report.overall.maximumNormalizedDelta < 0) {
    throw new Error(`integrated ${label} closure delta is invalid`);
  }
  if (!Object.values(report.compatibilityGates).every((value) => value === true)
    || !Object.values(report.provenanceGates).every((value) => value === true)) {
    throw new Error(`integrated ${label} closure gates are incomplete`);
  }
}

function validateConsecutiveBoundaryChain(
  previous: MainWireIntegratedModelPeriodicCycleObservationV2,
  current: MainWireIntegratedModelPeriodicCycleObservationV2,
): void {
  if (previous.period1 !== null && current.period1 !== null
    && currentBoundaryJson(previous.period1)
      !== referenceBoundaryJson(current.period1)) {
    throw new Error("integrated consecutive P1 boundary chain is discontinuous");
  }
  if (previous.period1 !== null && current.period2 !== null
    && referenceBoundaryJson(previous.period1)
      !== referenceBoundaryJson(current.period2)) {
    throw new Error("integrated P2 does not reference the two-back boundary");
  }
}

function currentBoundaryJson(
  report: MainWireIntegratedModelPeriodicClosureReportV2,
): string {
  const provenance = report.provenance;
  const coronary = report.coronaryClosure.provenance;
  return canonicalJsonStringify(Object.freeze({
    revision: provenance.currentRevision,
    acceptedTimeSec: provenance.currentAcceptedTimeSec,
    nextSourceIndex: provenance.currentNextSourceIndex,
    avAcceptedActivationCount: provenance.currentAvAcceptedActivationCount,
    coronaryWindowIndex: coronary.currentAutoregulationWindowIndex,
    coronaryWindowStartRevision:
      coronary.currentAutoregulationWindowStartRevision,
    coronaryWindowStartAcceptedTimeSec:
      coronary.currentAutoregulationWindowStartAcceptedTimeSec,
  }));
}

function referenceBoundaryJson(
  report: MainWireIntegratedModelPeriodicClosureReportV2,
): string {
  const provenance = report.provenance;
  const coronary = report.coronaryClosure.provenance;
  return canonicalJsonStringify(Object.freeze({
    revision: provenance.referenceRevision,
    acceptedTimeSec: provenance.referenceAcceptedTimeSec,
    nextSourceIndex: provenance.referenceNextSourceIndex,
    avAcceptedActivationCount: provenance.referenceAvAcceptedActivationCount,
    coronaryWindowIndex: coronary.referenceAutoregulationWindowIndex,
    coronaryWindowStartRevision:
      coronary.referenceAutoregulationWindowStartRevision,
    coronaryWindowStartAcceptedTimeSec:
      coronary.referenceAutoregulationWindowStartAcceptedTimeSec,
  }));
}
