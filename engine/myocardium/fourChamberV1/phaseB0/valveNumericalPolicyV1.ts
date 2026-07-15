import {
  computeCanonicalSha256,
  type CanonicalSha256HexProvider,
} from "@/engine/myocardium/fourChamberV1/manifests/canonicalJson";
import { assertExactPlainRecordV1 } from
  "@/engine/myocardium/fourChamberV1/validation/strictClosedRecordV1";

export const PHASE_B0_VALVE_NUMERICAL_POLICY_V1_ID =
  "four-chamber-phase-b0-valve-numerical-candidate-policy-v1" as const;

export const PHASE_B0_VALVE_FLOW_IDS_V1 = Object.freeze([
  "Q_MV",
  "Q_AoV",
  "Q_TV",
  "Q_PuV",
] as const);
export type PhaseB0ValveFlowIdV1 = (typeof PHASE_B0_VALVE_FLOW_IDS_V1)[number];

export const PHASE_B0_NUMERICAL_REVERSE_AREA_RATIO_CANDIDATES_V1 = Object.freeze([
  1e-2,
  3e-3,
  1e-3,
] as const);
export type PhaseB0NumericalReverseAreaRatioV1 =
  (typeof PHASE_B0_NUMERICAL_REVERSE_AREA_RATIO_CANDIDATES_V1)[number];

export type PhaseB0ValveNumericalPolicyInputV1 = Readonly<{
  nominalSetId: string;
  evidenceClass: "project-synthetic-test-only-nominal";
  numericalReverseAreaRatio: PhaseB0NumericalReverseAreaRatioV1;
  baselineOpenAreaM2ByValve: Readonly<Record<PhaseB0ValveFlowIdV1, number>>;
  pressureGateWidthPaByValve: Readonly<Record<PhaseB0ValveFlowIdV1, number>>;
  flowSmoothingM3PerSecByValve: Readonly<Record<PhaseB0ValveFlowIdV1, number>>;
}>;

export type PhaseB0ValveNumericalPolicyPayloadV1 = Readonly<{
  policyId: typeof PHASE_B0_VALVE_NUMERICAL_POLICY_V1_ID;
  nominalSetId: string;
  evidenceClass: "project-synthetic-test-only-nominal";
  status: "unselected-numerical-candidate";
  testOnly: true;
  releaseRuntimeReachable: false;
  candidateRatios: typeof PHASE_B0_NUMERICAL_REVERSE_AREA_RATIO_CANDIDATES_V1;
  candidateRatioUnderEvaluation: PhaseB0NumericalReverseAreaRatioV1;
  absoluteNumericalReverseAreaDerivation: "A_num=ratio*A_open_baseline";
  baselineOpenAreaM2ByValve: Readonly<Record<PhaseB0ValveFlowIdV1, number>>;
  absoluteNumericalReverseAreaM2ByValve: Readonly<Record<PhaseB0ValveFlowIdV1, number>>;
  pressureGateWidthPaByValve: Readonly<Record<PhaseB0ValveFlowIdV1, number>>;
  flowSmoothingM3PerSecByValve: Readonly<Record<PhaseB0ValveFlowIdV1, number>>;
  absoluteNumericalReverseAreaFrozenAfterBuild: true;
  fitAllowed: Readonly<{
    numericalReverseAreaRatio: false;
    numericalReverseAreaM2: false;
    pressureGateWidthPa: false;
    flowSmoothingM3PerSec: false;
  }>;
  selectionClaims: Readonly<{
    floorSelectionCompleted: false;
    physiologicalValidationClaimed: false;
    clinicalReleaseEligibilityClaimed: false;
  }>;
  units: Readonly<{
    baselineOpenArea: "m^2";
    numericalReverseArea: "m^2";
    pressureGateWidth: "Pa";
    flowSmoothing: "m^3/s";
    areaRatio: "1";
  }>;
}>;

export type PhaseB0ValveNumericalPolicyCandidateV1 =
  PhaseB0ValveNumericalPolicyPayloadV1 & Readonly<{
    hashAlgorithm: "sha256-canonical-json-v1";
    contentSha256: string;
  }>;

/**
 * Builds one immutable member of the predeclared A_num/open-area sweep. The
 * returned object is a candidate, not a selected floor or physiological prior.
 */
export function buildPhaseB0ValveNumericalPolicyPayloadV1(
  input: PhaseB0ValveNumericalPolicyInputV1,
): PhaseB0ValveNumericalPolicyPayloadV1 {
  validatePolicyInputV1(input);
  const baselineOpenAreaM2ByValve = freezePositiveValveRecord(
    input.baselineOpenAreaM2ByValve,
    "input.baselineOpenAreaM2ByValve",
  );
  const pressureGateWidthPaByValve = freezePositiveValveRecord(
    input.pressureGateWidthPaByValve,
    "input.pressureGateWidthPaByValve",
  );
  const flowSmoothingM3PerSecByValve = freezePositiveValveRecord(
    input.flowSmoothingM3PerSecByValve,
    "input.flowSmoothingM3PerSecByValve",
  );
  const absoluteNumericalReverseAreaM2ByValve = Object.freeze(Object.fromEntries(
    PHASE_B0_VALVE_FLOW_IDS_V1.map((valveId) => {
      const area = input.numericalReverseAreaRatio * baselineOpenAreaM2ByValve[valveId];
      return [valveId, requirePositiveFinite(
        area,
        `absoluteNumericalReverseAreaM2ByValve.${valveId}`,
      )];
    }),
  )) as Readonly<Record<PhaseB0ValveFlowIdV1, number>>;

  return Object.freeze({
    policyId: PHASE_B0_VALVE_NUMERICAL_POLICY_V1_ID,
    nominalSetId: requireNonEmptyString(input.nominalSetId, "input.nominalSetId"),
    evidenceClass: "project-synthetic-test-only-nominal",
    status: "unselected-numerical-candidate",
    testOnly: true,
    releaseRuntimeReachable: false,
    candidateRatios: PHASE_B0_NUMERICAL_REVERSE_AREA_RATIO_CANDIDATES_V1,
    candidateRatioUnderEvaluation: input.numericalReverseAreaRatio,
    absoluteNumericalReverseAreaDerivation: "A_num=ratio*A_open_baseline",
    baselineOpenAreaM2ByValve,
    absoluteNumericalReverseAreaM2ByValve,
    pressureGateWidthPaByValve,
    flowSmoothingM3PerSecByValve,
    absoluteNumericalReverseAreaFrozenAfterBuild: true,
    fitAllowed: Object.freeze({
      numericalReverseAreaRatio: false,
      numericalReverseAreaM2: false,
      pressureGateWidthPa: false,
      flowSmoothingM3PerSec: false,
    }),
    selectionClaims: Object.freeze({
      floorSelectionCompleted: false,
      physiologicalValidationClaimed: false,
      clinicalReleaseEligibilityClaimed: false,
    }),
    units: Object.freeze({
      baselineOpenArea: "m^2",
      numericalReverseArea: "m^2",
      pressureGateWidth: "Pa",
      flowSmoothing: "m^3/s",
      areaRatio: "1",
    }),
  });
}

export function buildPhaseB0ValveNumericalPolicyCandidateV1(
  input: PhaseB0ValveNumericalPolicyInputV1,
  sha256Hex: CanonicalSha256HexProvider,
): PhaseB0ValveNumericalPolicyCandidateV1 {
  const payload = buildPhaseB0ValveNumericalPolicyPayloadV1(input);
  return Object.freeze({
    ...payload,
    hashAlgorithm: "sha256-canonical-json-v1",
    contentSha256: computeCanonicalSha256(payload, sha256Hex),
  });
}

export function phaseB0ValveNumericalPolicyHashPayloadV1(
  policy: PhaseB0ValveNumericalPolicyCandidateV1,
): PhaseB0ValveNumericalPolicyPayloadV1 {
  assertExactPlainRecordV1(policy, [
    "policyId",
    "nominalSetId",
    "evidenceClass",
    "status",
    "testOnly",
    "releaseRuntimeReachable",
    "candidateRatios",
    "candidateRatioUnderEvaluation",
    "absoluteNumericalReverseAreaDerivation",
    "baselineOpenAreaM2ByValve",
    "absoluteNumericalReverseAreaM2ByValve",
    "pressureGateWidthPaByValve",
    "flowSmoothingM3PerSecByValve",
    "absoluteNumericalReverseAreaFrozenAfterBuild",
    "fitAllowed",
    "selectionClaims",
    "units",
    "hashAlgorithm",
    "contentSha256",
  ], "policy");
  const {
    hashAlgorithm: _hashAlgorithm,
    contentSha256: _contentSha256,
    ...payload
  } = policy;
  return Object.freeze(payload);
}

function validatePolicyInputV1(input: PhaseB0ValveNumericalPolicyInputV1): void {
  assertExactPlainRecordV1(input, [
    "nominalSetId",
    "evidenceClass",
    "numericalReverseAreaRatio",
    "baselineOpenAreaM2ByValve",
    "pressureGateWidthPaByValve",
    "flowSmoothingM3PerSecByValve",
  ], "input");
  requireNonEmptyString(input.nominalSetId, "input.nominalSetId");
  if (input.evidenceClass !== "project-synthetic-test-only-nominal") {
    throw new Error("input.evidenceClass must declare project-synthetic-test-only-nominal");
  }
  if (!PHASE_B0_NUMERICAL_REVERSE_AREA_RATIO_CANDIDATES_V1.includes(
    input.numericalReverseAreaRatio,
  )) {
    throw new Error("input.numericalReverseAreaRatio must be 1e-2, 3e-3, or 1e-3");
  }
  freezePositiveValveRecord(input.baselineOpenAreaM2ByValve, "input.baselineOpenAreaM2ByValve");
  freezePositiveValveRecord(input.pressureGateWidthPaByValve, "input.pressureGateWidthPaByValve");
  freezePositiveValveRecord(
    input.flowSmoothingM3PerSecByValve,
    "input.flowSmoothingM3PerSecByValve",
  );
}

function freezePositiveValveRecord(
  record: Readonly<Record<PhaseB0ValveFlowIdV1, number>>,
  field: string,
): Readonly<Record<PhaseB0ValveFlowIdV1, number>> {
  assertExactPlainRecordV1(record, PHASE_B0_VALVE_FLOW_IDS_V1, field);
  return Object.freeze(Object.fromEntries(PHASE_B0_VALVE_FLOW_IDS_V1.map((valveId) => [
    valveId,
    requirePositiveFinite(record[valveId], `${field}.${valveId}`),
  ]))) as Readonly<Record<PhaseB0ValveFlowIdV1, number>>;
}

function requirePositiveFinite(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be positive and finite`);
  }
  return value;
}

function requireNonEmptyString(value: string, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}
