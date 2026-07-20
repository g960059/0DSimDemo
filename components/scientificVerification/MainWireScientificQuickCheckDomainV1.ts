import {
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID,
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION,
  type MainWireScientificObservableFrameV1,
  type MainWireScientificObservableIdV1,
} from "@/engine/scientific/observables";
import {
  sameSimulationReleaseRef,
  SHA256_HEX_PATTERN,
  type SimulationReleaseRef,
} from "@/engine/scientific/release";
import {
  MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1_ID,
  type MainWireHealthyCycleMetricIdV1,
} from "@/engine/scientific/validation/MainWireHealthyCycleAcceptanceV1";
import {
  MAIN_WIRE_NUMERICAL_INTEGRITY_PACK_V1,
} from "@/engine/scientific/validation/MainWireEvidencePacksV1";
import {
  assembleScientificWorkbenchResearchTerminalCycleV1,
  assembleScientificWorkbenchTerminalCycleV1,
  type ScientificWorkbenchResearchTerminalCycleV1,
  type ScientificWorkbenchTerminalCycleV1,
} from "@/components/scientificWorkbench/scientificWorkbenchTerminalCycleV1";

export const MAIN_WIRE_SCIENTIFIC_QUICK_CHECK_V1_ID =
  "main-wire-scientific-quick-check-v1" as const;

export const MAIN_WIRE_SCIENTIFIC_QUICK_CHECK_V1_CLAIM = Object.freeze({
  role: "quick-verification-and-existing-evidence-summary" as const,
  sourceFramesOnly: true as const,
  advancesScientificSession: false as const,
  fullVerificationAndValidationClaimed: false as const,
  physiologyAcceptanceClaimed: false as const,
  periodicityComputedByQuickCheck: false as const,
  timeStepRefinementClaimed: false as const,
  multiStartOrBasinEvidenceClaimed: false as const,
  patientSpecificOrClinicalValidationClaimed: false as const,
});

export const MAIN_WIRE_SCIENTIFIC_QUICK_CHECK_EVIDENCE_VALUES_V1 =
  Object.freeze([
    "open-transient-no-periodic-claim",
    "target-period1-and-following-cycle-validated",
    "retained-period1-source-cycle",
  ] as const);

export type MainWireScientificQuickCheckEvidenceV1 =
  (typeof MAIN_WIRE_SCIENTIFIC_QUICK_CHECK_EVIDENCE_VALUES_V1)[number];

export type MainWireScientificQuickCheckFrameOwnerV1 = "source" | "candidate";

export type MainWireScientificQuickCheckSourceIdentityV1 = Readonly<{
  releaseRef: SimulationReleaseRef;
  committedControlStateSha256: string;
  parameterEpoch: number;
  displayedFrameOwner: MainWireScientificQuickCheckFrameOwnerV1;
  firstRevision: number;
  finalRevision: number;
  firstAcceptedTimeSec: number;
  finalAcceptedTimeSec: number;
}>;

export type MainWireScientificQuickCheckInputV1 = Readonly<{
  source: MainWireScientificQuickCheckSourceIdentityV1;
  displayedEvidence: MainWireScientificQuickCheckEvidenceV1;
  frames: readonly MainWireScientificObservableFrameV1[];
}>;

export type MainWireScientificQuickCheckFindingSeverityV1 =
  | "information"
  | "warning"
  | "error";

export type MainWireScientificQuickCheckFindingDomainV1 =
  | "steady-state-evidence"
  | "numerical-integrity"
  | "observable-availability";

export type MainWireScientificQuickCheckFindingCodeV1 =
  | "open-transient-has-no-periodic-claim"
  | "steady-state-diagnostics-withheld"
  | "accepted-step-evidence-unavailable"
  | "numerical-diagnostic-incomplete"
  | "numerical-threshold-exceeded"
  | "modeled-observable-unavailable";

export type MainWireScientificQuickCheckFindingV1 = Readonly<{
  code: MainWireScientificQuickCheckFindingCodeV1;
  domain: MainWireScientificQuickCheckFindingDomainV1;
  severity: MainWireScientificQuickCheckFindingSeverityV1;
  message: string;
  observableIds: readonly MainWireScientificObservableIdV1[];
}>;

export type MainWireScientificQuickCheckNumericalAvailabilityV1 =
  | "complete"
  | "partial"
  | "unavailable";

export type MainWireScientificQuickCheckNumericalMetricV1 = Readonly<{
  observableId: MainWireScientificObservableIdV1;
  metricId: MainWireHealthyCycleMetricIdV1;
  maximumAbsoluteValue: number | null;
  upperInclusive: number;
  availability: MainWireScientificQuickCheckNumericalAvailabilityV1;
  withinQuickThreshold: boolean | null;
  availableAcceptedStepCount: number;
  acceptedStepCount: number;
}>;

export type MainWireScientificQuickCheckCycleContractV1 =
  | "verified-existing-period1-following-cycle"
  | "not-applicable-open-transient";

export type MainWireScientificQuickCheckResultV1 = Readonly<{
  checkId: typeof MAIN_WIRE_SCIENTIFIC_QUICK_CHECK_V1_ID;
  schemaVersion: 1;
  status: "findings";
  source: MainWireScientificQuickCheckSourceIdentityV1;
  evidence: Readonly<{
    displayedEvidence: MainWireScientificQuickCheckEvidenceV1;
    cycleContract: MainWireScientificQuickCheckCycleContractV1;
    periodicSteadyStateEvidencePresent: boolean;
    frameCount: number;
    acceptedStepFrameCount: number;
  }>;
  numericalIntegrity: Readonly<{
    numericalIntegrityPackId:
      typeof MAIN_WIRE_NUMERICAL_INTEGRITY_PACK_V1.packId;
    /** @deprecated Read numericalIntegrityPackId in new consumers. */
    thresholdSourceTargetPackId:
      typeof MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1_ID;
    assessmentScope:
      | "verified-existing-period1-following-cycle"
      | "not-assessed-open-transient";
    metrics: readonly MainWireScientificQuickCheckNumericalMetricV1[];
  }>;
  observables: Readonly<{
    assessedModeledObservableCount: number;
    availableOnEveryAcceptedStepCount: number;
    unavailableModeledObservableIds:
      readonly MainWireScientificObservableIdV1[];
    declaredNotModeledObservableIds:
      readonly MainWireScientificObservableIdV1[];
  }>;
  findings: readonly MainWireScientificQuickCheckFindingV1[];
  summary: Readonly<{
    informationCount: number;
    warningCount: number;
    errorCount: number;
  }>;
  claim: typeof MAIN_WIRE_SCIENTIFIC_QUICK_CHECK_V1_CLAIM;
}>;

export class MainWireScientificQuickCheckVerificationErrorV1 extends Error {
  constructor(message: string) {
    super(`main-wire scientific quick check verification failed: ${message}`);
    this.name = "MainWireScientificQuickCheckVerificationErrorV1";
  }
}

type NumericalDefinitionV1 = Readonly<{
  observableId: MainWireScientificObservableIdV1;
  metricId: MainWireHealthyCycleMetricIdV1;
}>;

const NUMERICAL_DEFINITIONS_V1 = Object.freeze([
  Object.freeze({
    observableId: "solver.mechanics.residual_norm",
    metricId: "numerics.mechanics.maximum_residual_norm",
  }),
  Object.freeze({
    observableId: "solver.circulation.scaled_residual_infinity_norm",
    metricId: "numerics.circulation.maximum_scaled_residual_infinity_norm",
  }),
  Object.freeze({
    observableId: "solver.continuity.maximum_residual",
    metricId: "numerics.continuity.maximum_absolute_residual_ml",
  }),
  Object.freeze({
    observableId: "conservation.total_blood_volume.error",
    metricId: "numerics.total_blood_volume.maximum_absolute_error_ml",
  }),
] as const satisfies readonly NumericalDefinitionV1[]);

const QUICK_OBSERVABLE_DEFINITIONS_V1 =
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1.filter((definition) =>
    definition.modelingStatus === "modeled"
    && (definition.sourceKind === "accepted-state"
      || definition.sourceKind === "accepted-step-readback"));

const DECLARED_NOT_MODELED_OBSERVABLE_IDS_V1 = Object.freeze(
  MAIN_WIRE_SCIENTIFIC_OBSERVABLE_CATALOG_V1
    .filter((definition) => definition.modelingStatus === "not-modeled")
    .map((definition) => definition.observableId),
);

/**
 * Summarizes already-published Workbench evidence. This function never runs,
 * settles, perturbs, or otherwise advances a scientific session.
 */
export function evaluateMainWireScientificQuickCheckV1(
  input: MainWireScientificQuickCheckInputV1,
): MainWireScientificQuickCheckResultV1 {
  assertInputV1(input);
  const findings: MainWireScientificQuickCheckFindingV1[] = [];
  const acceptedStepFrames = input.frames.filter((frame) =>
    frame.source === "accepted-step");
  const periodicSteadyStateEvidencePresent =
    input.displayedEvidence !== "open-transient-no-periodic-claim";
  const diagnosticFrames = periodicSteadyStateEvidencePresent
    ? acceptedStepFrames
    : [];
  const cycleContract = periodicSteadyStateEvidencePresent
    ? verifyExistingPeriodicCycleV1(input.frames)
    : "not-applicable-open-transient" as const;

  if (!periodicSteadyStateEvidencePresent) {
    findings.push(findingV1(
      "open-transient-has-no-periodic-claim",
      "steady-state-evidence",
      "warning",
      "The displayed frames are an open transient; Quick Check does not infer or create a period-1 claim.",
      [],
    ));
    findings.push(findingV1(
      "steady-state-diagnostics-withheld",
      "numerical-integrity",
      "information",
      "Numerical diagnostics are withheld until committed-target period-1 following-cycle evidence is available.",
      NUMERICAL_DEFINITIONS_V1.map(({ observableId }) => observableId),
    ));
  }
  if (periodicSteadyStateEvidencePresent && acceptedStepFrames.length === 0) {
    findings.push(findingV1(
      "accepted-step-evidence-unavailable",
      "numerical-integrity",
      "warning",
      "No accepted-step frames are available for the numerical evidence summary.",
      NUMERICAL_DEFINITIONS_V1.map(({ observableId }) => observableId),
    ));
  }

  const numericalMetrics = NUMERICAL_DEFINITIONS_V1.map((definition) =>
    evaluateNumericalMetricV1(definition, diagnosticFrames, findings));
  const unavailableModeledObservableIds = QUICK_OBSERVABLE_DEFINITIONS_V1
    .filter((definition) => diagnosticFrames.some((frame) =>
      frame.values[definition.observableId]?.availability !== "available"))
    .map((definition) => definition.observableId);

  if (diagnosticFrames.length > 0
      && unavailableModeledObservableIds.length > 0) {
    findings.push(findingV1(
      "modeled-observable-unavailable",
      "observable-availability",
      "warning",
      "At least one modeled Workbench observable is unavailable on an accepted-step frame.",
      unavailableModeledObservableIds,
    ));
  }

  return deepFreezeResultV1({
    checkId: MAIN_WIRE_SCIENTIFIC_QUICK_CHECK_V1_ID,
    schemaVersion: 1,
    status: "findings",
    source: input.source,
    evidence: {
      displayedEvidence: input.displayedEvidence,
      cycleContract,
      periodicSteadyStateEvidencePresent,
      frameCount: input.frames.length,
      acceptedStepFrameCount: acceptedStepFrames.length,
    },
    numericalIntegrity: {
      numericalIntegrityPackId:
        MAIN_WIRE_NUMERICAL_INTEGRITY_PACK_V1.packId,
      thresholdSourceTargetPackId:
        MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1_ID,
      assessmentScope: periodicSteadyStateEvidencePresent
        ? "verified-existing-period1-following-cycle"
        : "not-assessed-open-transient",
      metrics: numericalMetrics,
    },
    observables: {
      assessedModeledObservableCount: periodicSteadyStateEvidencePresent
        ? QUICK_OBSERVABLE_DEFINITIONS_V1.length
        : 0,
      availableOnEveryAcceptedStepCount: diagnosticFrames.length === 0
        ? 0
        : QUICK_OBSERVABLE_DEFINITIONS_V1.length
          - unavailableModeledObservableIds.length,
      unavailableModeledObservableIds,
      declaredNotModeledObservableIds:
        DECLARED_NOT_MODELED_OBSERVABLE_IDS_V1,
    },
    findings,
    summary: {
      informationCount: findings.filter((entry) =>
        entry.severity === "information").length,
      warningCount: findings.filter((entry) =>
        entry.severity === "warning").length,
      errorCount: findings.filter((entry) => entry.severity === "error").length,
    },
    claim: MAIN_WIRE_SCIENTIFIC_QUICK_CHECK_V1_CLAIM,
  });
}

function evaluateNumericalMetricV1(
  definition: NumericalDefinitionV1,
  acceptedStepFrames: readonly MainWireScientificObservableFrameV1[],
  findings: MainWireScientificQuickCheckFindingV1[],
): MainWireScientificQuickCheckNumericalMetricV1 {
  const target = MAIN_WIRE_NUMERICAL_INTEGRITY_PACK_V1.gates.find(
    (gate) => gate.metricId === definition.metricId,
  );
  if (target?.upperInclusive === null || target?.upperInclusive === undefined) {
    throw new MainWireScientificQuickCheckVerificationErrorV1(
      `numerical target ${definition.metricId} lacks an upper bound`,
    );
  }
  const values = acceptedStepFrames.flatMap((frame) => {
    const entry = frame.values[definition.observableId];
    return entry?.availability === "available" && entry.value !== null
      ? [Math.abs(entry.value)]
      : [];
  });
  const availability: MainWireScientificQuickCheckNumericalAvailabilityV1 =
    values.length === 0
      ? "unavailable"
      : values.length === acceptedStepFrames.length
        ? "complete"
        : "partial";
  const maximumAbsoluteValue = values.length === 0
    ? null
    : Math.max(...values);
  const withinQuickThreshold = availability === "complete"
    && maximumAbsoluteValue !== null
      ? maximumAbsoluteValue <= target.upperInclusive
      : null;

  if (acceptedStepFrames.length > 0 && availability !== "complete") {
    findings.push(findingV1(
      "numerical-diagnostic-incomplete",
      "numerical-integrity",
      "warning",
      `${definition.observableId} is not available on every accepted-step frame.`,
      [definition.observableId],
    ));
  }
  if (maximumAbsoluteValue !== null
      && maximumAbsoluteValue > target.upperInclusive) {
    findings.push(findingV1(
      "numerical-threshold-exceeded",
      "numerical-integrity",
      "error",
      `${definition.observableId} exceeds the existing numerical-integrity screen (${maximumAbsoluteValue} > ${target.upperInclusive}).`,
      [definition.observableId],
    ));
  }

  return Object.freeze({
    observableId: definition.observableId,
    metricId: definition.metricId,
    maximumAbsoluteValue,
    upperInclusive: target.upperInclusive,
    availability,
    withinQuickThreshold,
    availableAcceptedStepCount: values.length,
    acceptedStepCount: acceptedStepFrames.length,
  });
}

function verifyExistingPeriodicCycleV1(
  frames: readonly MainWireScientificObservableFrameV1[],
): "verified-existing-period1-following-cycle" {
  const [boundary, ...acceptedSteps] = frames;
  if (boundary === undefined) {
    throw new MainWireScientificQuickCheckVerificationErrorV1(
      "period-1 evidence has no observable frames",
    );
  }
  let cycle:
    | ScientificWorkbenchTerminalCycleV1
    | ScientificWorkbenchResearchTerminalCycleV1;
  try {
    cycle = boundary.source === "exact-checkpoint-restore"
      ? assembleScientificWorkbenchTerminalCycleV1(boundary, acceptedSteps)
      : assembleScientificWorkbenchResearchTerminalCycleV1(
        boundary,
        acceptedSteps,
      );
  } catch (error) {
    throw new MainWireScientificQuickCheckVerificationErrorV1(
      error instanceof Error ? error.message : "period-1 cycle is malformed",
    );
  }
  if (cycle.frames.length !== frames.length) {
    throw new MainWireScientificQuickCheckVerificationErrorV1(
      "period-1 cycle verification changed the frame count",
    );
  }
  return "verified-existing-period1-following-cycle";
}

function assertInputV1(input: MainWireScientificQuickCheckInputV1): void {
  if (!SHA256_HEX_PATTERN.test(input.source.committedControlStateSha256)) {
    throw new MainWireScientificQuickCheckVerificationErrorV1(
      "committed control-state identity is not a SHA-256 digest",
    );
  }
  if (!Number.isSafeInteger(input.source.parameterEpoch)
      || input.source.parameterEpoch < 0) {
    throw new MainWireScientificQuickCheckVerificationErrorV1(
      "parameter epoch is invalid",
    );
  }
  if (input.frames.length === 0) {
    throw new MainWireScientificQuickCheckVerificationErrorV1(
      "the displayed snapshot has no observable frames",
    );
  }
  const first = input.frames[0]!;
  const last = input.frames.at(-1)!;
  if (
    first.revision !== input.source.firstRevision
    || last.revision !== input.source.finalRevision
    || first.acceptedTimeSec !== input.source.firstAcceptedTimeSec
    || last.acceptedTimeSec !== input.source.finalAcceptedTimeSec
  ) {
    throw new MainWireScientificQuickCheckVerificationErrorV1(
      "source identity does not match the displayed frame boundary",
    );
  }
  for (const [index, frame] of input.frames.entries()) {
    if (
      frame.frameId !== MAIN_WIRE_SCIENTIFIC_OBSERVABLE_FRAME_V1_ID
      || frame.registryId !== MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_ID
      || frame.schemaVersion
        !== MAIN_WIRE_SCIENTIFIC_OBSERVABLE_REGISTRY_V1_SCHEMA_VERSION
    ) {
      throw new MainWireScientificQuickCheckVerificationErrorV1(
        `frame ${index} has an unsupported observable envelope`,
      );
    }
    if (!sameSimulationReleaseRef(input.source.releaseRef, frame.releaseRef)) {
      throw new MainWireScientificQuickCheckVerificationErrorV1(
        `frame ${index} does not match the source simulation release`,
      );
    }
    if (!Number.isSafeInteger(frame.revision)
        || frame.revision < 0
        || !Number.isFinite(frame.acceptedTimeSec)
        || frame.acceptedTimeSec < 0) {
      throw new MainWireScientificQuickCheckVerificationErrorV1(
        `frame ${index} has an invalid accepted-state identity`,
      );
    }
  }
}

function findingV1(
  code: MainWireScientificQuickCheckFindingCodeV1,
  domain: MainWireScientificQuickCheckFindingDomainV1,
  severity: MainWireScientificQuickCheckFindingSeverityV1,
  message: string,
  observableIds: readonly MainWireScientificObservableIdV1[],
): MainWireScientificQuickCheckFindingV1 {
  return Object.freeze({
    code,
    domain,
    severity,
    message,
    observableIds: Object.freeze([...observableIds]),
  });
}

function deepFreezeResultV1(
  result: Omit<MainWireScientificQuickCheckResultV1, never>,
): MainWireScientificQuickCheckResultV1 {
  return Object.freeze({
    ...result,
    source: Object.freeze({
      ...result.source,
      releaseRef: Object.freeze({ ...result.source.releaseRef }),
    }),
    evidence: Object.freeze({ ...result.evidence }),
    numericalIntegrity: Object.freeze({
      ...result.numericalIntegrity,
      metrics: Object.freeze([...result.numericalIntegrity.metrics]),
    }),
    observables: Object.freeze({
      ...result.observables,
      unavailableModeledObservableIds: Object.freeze([
        ...result.observables.unavailableModeledObservableIds,
      ]),
      declaredNotModeledObservableIds: Object.freeze([
        ...result.observables.declaredNotModeledObservableIds,
      ]),
    }),
    findings: Object.freeze([...result.findings]),
    summary: Object.freeze({ ...result.summary }),
  });
}
