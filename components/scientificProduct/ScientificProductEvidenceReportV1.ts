import type {
  ScientificProductEvidenceReferenceV1,
  ScientificProductEvidenceSelectedReportV1,
  ScientificProductHealthyReferenceContextV1,
  ScientificProductValidationItemV1,
  ScientificProductVerificationItemV1,
} from "@/components/scientificVerification/ScientificProductEvidencePageV1";
import {
  MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1,
} from "@/engine/scientific/validation/MainWireHealthyCycleAcceptanceV1";

import type {
  ScientificProductQuickCheckRecordV1,
} from "./ScientificProductQuickCheckRegistryV1";

export type ScientificProductEvidenceSubjectKindV1 =
  | "current-session"
  | "preset"
  | "saved-scenario";

export type ScientificProductEvidenceReportInputV1 = Readonly<{
  subjectKey: string;
  subjectName: string;
  subjectKind: ScientificProductEvidenceSubjectKindV1;
  record: ScientificProductQuickCheckRecordV1 | null;
  builtInDiseasePreset: boolean;
  releaseId: string;
  releaseVersion: string;
  releaseSha256: string;
  workspaceSha256: string | null;
  unavailableVerificationError?: string | null;
  unavailableMessage?: string | null;
}>;

const HEALTHY_REFERENCE_CONTEXT_V1: ScientificProductHealthyReferenceContextV1 =
  Object.freeze({
    title: "Resting adult research reference",
    description:
      "Broad healthy-adult literature ranges are shown as context. They are not diagnostic limits or a patient-specific fit.",
    attributes: Object.freeze([
      Object.freeze({
        id: "reference-state",
        label: "Reference state",
        value: "Resting adult research reference",
      }),
      Object.freeze({
        id: "reference-bsa",
        label: "Body surface area",
        value:
          `${MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1.referenceSubject.bodySurfaceAreaM2} m²`,
      }),
    ]),
  });

const REFERENCES_V1: readonly ScientificProductEvidenceReferenceV1[] =
  Object.freeze(MAIN_WIRE_HEALTHY_REFERENCE_TARGET_PACK_V1.sources.map(
    (source) => Object.freeze({
      id: source.sourceId,
      label: source.role,
      citation: source.citation,
      ...(source.url === null ? {} : { href: source.url }),
    }),
  ));

export function createScientificProductEvidenceReportV1(
  input: ScientificProductEvidenceReportInputV1,
): ScientificProductEvidenceSelectedReportV1 {
  const record = input.record;
  if (record === null) return unavailableReportV1(input);

  const validation = record.validation;
  const cycleAvailable = validation?.cycleAvailable === true;
  const outsideReferenceCount = cycleAvailable ? validation.referenceResults.filter(
    ({ status }) => status === "outside-reference",
  ).length : 0;
  const unavailableReferenceCount = cycleAvailable ? validation.referenceResults.filter(
    ({ status }) => status === "unavailable",
  ).length : 0;
  const pageStatus = record.status === "checking"
    ? "checking" as const
    : record.status === "verification-error" || !cycleAvailable
      ? "verification-error" as const
      : outsideReferenceCount > 0
        ? "findings" as const
        : unavailableReferenceCount > 0
          ? "not-assessed" as const
          : "passed" as const;
  const verificationItems = verificationItemsV1(record);
  const validationItems = validationItemsV1(record);
  const validationStatus = !cycleAvailable
    ? "not-assessed" as const
    : outsideReferenceCount > 0
      ? "findings" as const
      : unavailableReferenceCount > 0
        ? "not-assessed" as const
        : "within-reference" as const;

  return Object.freeze({
    subjectKey: input.subjectKey,
    status: pageStatus,
    message: reportMessageV1(
      record,
      cycleAvailable,
      outsideReferenceCount,
      unavailableReferenceCount,
    ),
    evidenceSource: evidenceSourceLabelV1(record.evidenceSource),
    controlStateSha256: record.committedControlStateSha256,
    parameterEpoch: record.parameterEpoch,
    verificationItems,
    validation: Object.freeze({
      status: validationStatus,
      message: validationMessageV1(
        validationStatus,
        outsideReferenceCount,
        unavailableReferenceCount,
      ),
      items: validationItems,
      healthyReference: HEALTHY_REFERENCE_CONTEXT_V1,
      references: REFERENCES_V1,
    }),
    summaryFacts: Object.freeze([
      Object.freeze({
        id: "quick-check-scope",
        label: "Quick Check scope",
        value: "Committed P1 + one complete cycle",
      }),
    ]),
    provenanceItems: Object.freeze([
      Object.freeze({
        id: "release-id",
        label: "Simulation release",
        value: `${input.releaseId} ${input.releaseVersion}`,
      }),
      Object.freeze({
        id: "release-sha",
        label: "Release SHA-256",
        value: input.releaseSha256,
        monospace: true,
      }),
      Object.freeze({
        id: "workspace-sha",
        label: "Workspace SHA-256",
        value: input.workspaceSha256 ?? "Not available",
        monospace: input.workspaceSha256 !== null,
      }),
      Object.freeze({
        id: "evidence-owner",
        label: "Evidence owner",
        value: evidenceSourceLabelV1(record.evidenceSource),
        detail: record.cacheHit
          ? "Reused from the content-identical Quick Check cache."
          : undefined,
      }),
    ]),
    claimBoundaries: Object.freeze([
      "This Quick Check does not claim a full verification and validation suite.",
      "Time-step refinement and multi-start basin evidence were not run.",
      "Healthy reference comparisons are not clinical validation, diagnosis, or patient-specific fitting.",
    ]),
    fullSuiteStatus: Object.freeze({
      status: "not-run" as const,
      detail:
        "Only the automatic committed-target Quick Check was run. The dt-refinement, multi-start, and broader envelope suite remains separate.",
    }),
  });
}

function unavailableReportV1(
  input: ScientificProductEvidenceReportInputV1,
): ScientificProductEvidenceSelectedReportV1 {
  const verificationError = input.unavailableVerificationError?.trim() || null;
  const action = input.unavailableMessage?.trim() || (input.subjectKind === "preset"
    ? "Open this preset in Workbench to create release-bound evidence."
    : input.subjectKind === "saved-scenario"
      ? "Open this saved scenario in Workbench; its Quick Check starts automatically."
      : "The scenario is preparing its first Quick Check.");
  return Object.freeze({
    subjectKey: input.subjectKey,
    status: verificationError !== null
      ? "verification-error" as const
      : input.subjectKind === "current-session"
        ? "checking" as const
        : "idle" as const,
    message: verificationError ?? action,
    evidenceSource: verificationError === null
      ? "No report in this session"
      : "Scenario calculation failed",
    controlStateSha256: null,
    parameterEpoch: null,
    verificationItems: verificationError === null
      ? Object.freeze([])
      : Object.freeze([Object.freeze({
        id: "scenario-calculation-error",
        label: "Scenario calculation",
        status: "error" as const,
        value: "Verification error",
        detail: verificationError,
      })]),
    validation: Object.freeze({
      status: "not-assessed" as const,
      message: "No committed P1 cycle is available for comparison.",
      items: Object.freeze([]),
      healthyReference: HEALTHY_REFERENCE_CONTEXT_V1,
      references: REFERENCES_V1,
    }),
    claimBoundaries: Object.freeze([
      "No verification or validation claim is made without a release-bound committed P1 cycle.",
    ]),
    fullSuiteStatus: Object.freeze({
      status: "not-run" as const,
      detail: "The full verification suite has not been run.",
    }),
  });
}

function verificationItemsV1(
  record: ScientificProductQuickCheckRecordV1,
): readonly ScientificProductVerificationItemV1[] {
  const validation = record.validation;
  if (record.status === "checking") {
    return Object.freeze([Object.freeze({
      id: "steady-state-check",
      label: "Committed-target P1 steady state",
      status: "not-run" as const,
      value: "Checking",
      detail: "The independent Quick Check worker is settling the committed target.",
    })]);
  }
  if (validation === null) {
    return Object.freeze([Object.freeze({
      id: "quick-check-error",
      label: "Quick Check calculation",
      status: "error" as const,
      value: "Verification error",
      detail: record.message,
    })]);
  }
  return Object.freeze([
    Object.freeze({
      id: "steady-state-check",
      label: "Committed-target P1 steady state",
      status: validation.cycleAvailable ? "passed" as const : "error" as const,
      value: validation.cycleAvailable ? "Confirmed" : "Unavailable",
    }),
    Object.freeze({
      id: "following-cycle-check",
      label: "Following complete cycle",
      status: validation.cycleAvailable ? "passed" as const : "error" as const,
      value: validation.cycleAvailable ? "501 frames" : "Unavailable",
      detail: "Both cycle boundaries are retained; no smoothing or interpolation is applied.",
    }),
    ...validation.numericalResults.map((result) => Object.freeze({
      id: result.gateId,
      label: result.label,
      status: result.status === "pass"
        ? "passed" as const
        : result.status === "error"
          ? "error" as const
          : "not-run" as const,
      value: metricValueV1(result.value, result.unit),
      numericValue: result.value,
      unit: result.unit,
      referenceLowerInclusive: result.lowerInclusive,
      referenceUpperInclusive: result.upperInclusive,
      referenceRange: referenceRangeV1(
        result.lowerInclusive,
        result.upperInclusive,
        result.unit,
      ),
      detail: result.upperInclusive === null
        ? result.interpretation
        : `Required ≤ ${metricValueV1(result.upperInclusive, result.unit)}. ${result.interpretation}`,
    })),
  ]);
}

function validationItemsV1(
  record: ScientificProductQuickCheckRecordV1,
): readonly ScientificProductValidationItemV1[] {
  const validation = record.validation;
  if (validation === null || !validation.cycleAvailable) return Object.freeze([]);
  const overall = validation.referenceResults.map((result) => {
    const display = referenceDisplayValueV1(
      result.gateId,
      result.value,
      result.lowerInclusive,
      result.upperInclusive,
      result.unit,
    );
    return Object.freeze({
      id: result.gateId,
      label: result.label,
      section: "overall" as const,
      status: result.status === "within-reference"
        ? "within-reference" as const
        : result.status === "outside-reference"
          ? "finding" as const
          : "not-assessed" as const,
      observedValue: metricValueV1(display.value, display.unit),
      numericValue: display.value,
      unit: display.unit,
      referenceLowerInclusive: display.lowerInclusive,
      referenceUpperInclusive: display.upperInclusive,
      referenceRange: referenceRangeV1(
        display.lowerInclusive,
        display.upperInclusive,
        display.unit,
      ),
      referenceContext: result.interpretation,
      comparisonLabel: result.status === "outside-reference"
        ? "Outside the stated healthy-adult reference range"
        : undefined,
      referenceIds: result.sourceIds,
    });
  });
  const valves = validation.valveFlow.flatMap((valve) => [
    valveMetricV1(valve.valveId, "forward", "Forward volume", valve.forwardVolumeMl, "mL"),
    valveMetricV1(valve.valveId, "reverse", "Reverse volume", valve.reverseVolumeMl, "mL"),
    valveMetricV1(
      valve.valveId,
      "regurgitation",
      "Regurgitant fraction",
      valve.regurgitantFractionPercent,
      "%",
    ),
    valveMetricV1(
      valve.valveId,
      "peak-gradient",
      "Peak pressure gradient",
      valve.peakGradientMmHg,
      "mmHg",
    ),
    valveMetricV1(
      valve.valveId,
      "mean-gradient",
      "Mean pressure gradient",
      valve.meanGradientMmHg,
      "mmHg",
    ),
  ]);
  const waveforms = validation.waveformAvailability.map((waveform) =>
    Object.freeze({
      id: `waveform-${waveform.observableId}`,
      label: waveform.label,
      section: "waveform" as const,
      status: "not-assessed" as const,
      observedValue:
        `${waveform.availableFrameCount}/${waveform.totalFrameCount} frames available`,
      numericValue: waveform.availableFrameCount,
      unit: `/ ${waveform.totalFrameCount} frames`,
      detail: waveform.complete
        ? "Availability is complete; waveform-shape acceptance was not applied."
        : "Availability is incomplete; waveform-shape acceptance was not applied.",
    }));
  return Object.freeze([...overall, ...valves, ...waveforms]);
}

function reportMessageV1(
  record: ScientificProductQuickCheckRecordV1,
  cycleAvailable: boolean,
  outsideReferenceCount: number,
  unavailableReferenceCount: number,
): string {
  if (record.status === "checking") {
    return "The committed target is being checked in an independent steady-state worker.";
  }
  if (record.status === "verification-error") return record.message;
  if (!cycleAvailable) {
    return "The Quick Check did not retain a complete heartbeat, so the result cannot be interpreted.";
  }
  if (outsideReferenceCount === 0 && unavailableReferenceCount === 0) {
    return "Quick verification passed and all assessed healthy-reference comparisons are within range.";
  }
  const parts: string[] = [];
  if (outsideReferenceCount > 0) {
    parts.push(
      `${outsideReferenceCount} healthy-reference comparison${outsideReferenceCount === 1 ? " is" : "s are"} outside the stated range`,
    );
  }
  if (unavailableReferenceCount > 0) {
    parts.push(
      `${unavailableReferenceCount} comparison${unavailableReferenceCount === 1 ? " could" : "s could"} not be assessed`,
    );
  }
  return `Quick verification passed. ${parts.join("; ")}.`;
}

function validationMessageV1(
  status: "not-assessed" | "within-reference" | "findings",
  outsideReferenceCount: number,
  unavailableReferenceCount: number,
): string {
  if (status === "not-assessed") {
    if (outsideReferenceCount === 0 && unavailableReferenceCount > 0) {
      return `${unavailableReferenceCount} comparison${unavailableReferenceCount === 1 ? " was" : "s were"} not assessed. No reference-range conclusion is made for ${unavailableReferenceCount === 1 ? "that comparison" : "those comparisons"}.`;
    }
    return "No complete-cycle comparison is available.";
  }
  if (status === "within-reference") {
    return "All assessed values are within the stated healthy reference ranges.";
  }
  const parts: string[] = [];
  if (outsideReferenceCount > 0) {
    parts.push(
      `${outsideReferenceCount} comparison${outsideReferenceCount === 1 ? " is" : "s are"} outside the stated healthy-adult reference range`,
    );
  }
  if (unavailableReferenceCount > 0) {
    parts.push(
      `${unavailableReferenceCount} comparison${unavailableReferenceCount === 1 ? " was" : "s were"} not assessed`,
    );
  }
  return `${parts.join("; ")}. An out-of-range result is not a numerical failure or a diagnosis.`;
}

function evidenceSourceLabelV1(
  source: ScientificProductQuickCheckRecordV1["evidenceSource"],
): string {
  if (source === "hidden-committed-target") {
    return "Independent committed-target Quick Check";
  }
  if (source === "loaded-release-cycle") return "Release-bound loaded P1 cycle";
  return "Quick Check in progress";
}

function referenceRangeV1(
  lower: number | null,
  upper: number | null,
  unit: string,
): string {
  if (lower !== null && upper !== null) {
    return `${metricValueV1(lower, unit)} – ${metricValueV1(upper, unit)}`;
  }
  if (upper !== null) return `≤ ${metricValueV1(upper, unit)}`;
  if (lower !== null) return `≥ ${metricValueV1(lower, unit)}`;
  return "Not stated";
}

function metricValueV1(value: number | null, unit: string): string {
  if (value === null || !Number.isFinite(value)) return "Not available";
  const absolute = Math.abs(value);
  const formatted = absolute !== 0 && (absolute < 0.001 || absolute >= 10_000)
    ? value.toExponential(2)
    : new Intl.NumberFormat("en", {
      maximumFractionDigits: absolute < 10 ? 2 : 1,
    }).format(value);
  return unit === "1" || unit === "fraction" ? formatted : `${formatted} ${unit}`;
}

function referenceDisplayValueV1(
  gateId: string,
  value: number | null,
  lowerInclusive: number | null,
  upperInclusive: number | null,
  unit: string,
): Readonly<{
  value: number | null;
  lowerInclusive: number | null;
  upperInclusive: number | null;
  unit: string;
}> {
  const scale = gateId === "healthy.lv.ef" ? 100 : 1;
  return Object.freeze({
    value: value === null ? null : value * scale,
    lowerInclusive: lowerInclusive === null ? null : lowerInclusive * scale,
    upperInclusive: upperInclusive === null ? null : upperInclusive * scale,
    unit: gateId === "healthy.lv.ef" ? "%" : unit,
  });
}

function valveMetricV1(
  valveId: "AoV" | "MV" | "TV" | "PV",
  metricId: "forward" | "reverse" | "regurgitation" | "peak-gradient" | "mean-gradient",
  metricLabel: string,
  value: number | null,
  unit: string,
): ScientificProductValidationItemV1 {
  return Object.freeze({
    id: `valve-flow-${valveId}-${metricId}`,
    label: `${valveLabelV1(valveId)} · ${metricLabel}`,
    section: "valve-flow" as const,
    status: "not-assessed" as const,
    observedValue: metricValueV1(value, unit),
    numericValue: value,
    unit,
    detail:
      "This value is measured over the retained heartbeat. No comparison target is assigned yet.",
  });
}

function valveLabelV1(valveId: "AoV" | "MV" | "TV" | "PV"): string {
  const labels = Object.freeze({
    AoV: "Aortic valve flow",
    MV: "Mitral valve flow",
    TV: "Tricuspid valve flow",
    PV: "Pulmonary valve flow",
  });
  return labels[valveId];
}
