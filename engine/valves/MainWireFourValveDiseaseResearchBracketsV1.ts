import {
  MV_PRESSURE_DEADBAND_MMHG,
  type ValveName,
} from "@/engine/core/topology";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/integrity/stableHash";
import type {
  MainWireQuasiSteadyOrificeValveParamsV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

export const MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUT_V1_ID =
  "main-wire-four-valve-disease-research-input-v1" as const;

export const MAIN_WIRE_FOUR_VALVE_IDS_V1 = Object.freeze([
  "MV",
  "AoV",
  "TV",
  "PV",
] as const satisfies readonly ValveName[]);

export const MAIN_WIRE_FOUR_VALVE_DISEASE_LESION_CODES_V1 = Object.freeze([
  "AS",
  "AR",
  "MS",
  "MR",
  "TS",
  "TR",
  "PS",
  "PR",
] as const);

export const MAIN_WIRE_FOUR_VALVE_DISEASE_SEVERITIES_V1 = Object.freeze([
  "mild",
  "moderate",
  "severe",
] as const);

export type MainWireFourValveDiseaseLesionCodeV1 =
  (typeof MAIN_WIRE_FOUR_VALVE_DISEASE_LESION_CODES_V1)[number];
export type MainWireFourValveDiseaseSeverityV1 =
  (typeof MAIN_WIRE_FOUR_VALVE_DISEASE_SEVERITIES_V1)[number];
export type MainWireFourValveDiseaseBracketIdV1 =
  `${MainWireFourValveDiseaseLesionCodeV1}-${MainWireFourValveDiseaseSeverityV1}`;
export type MainWireFourValveDiseaseLesionKindV1 =
  | "stenosis"
  | "regurgitation";
export type MainWireFourValveDiseaseEvidenceBasisV1 =
  | "guideline-area-anchor"
  | "engineering-only-bracket"
  | "hemodynamic-calibration-required";
export type MainWireFourValveDiseaseClinicalAreaThresholdStatusV1 =
  | "guideline-area-anchor"
  | "guideline-significant-endpoint-anchor"
  | "engineering-only-no-clinical-grade-anchor"
  | "no-fixed-clinical-area-threshold";

export const MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUT_CLAIM_V1 = Object.freeze({
  researchInputRole: "ordered-research-bracket-not-clinical-diagnosis" as const,
  clinicalDiagnosisOrSeverityClaimed: false as const,
  completeFourValveParameterSet: true as const,
  clinicalEoaSemantics:
    "effective-orifice-area-with-discharge-coefficient-absorbed-exactly-once" as const,
  backgroundLinearResistance:
    "reference-topology-derived-series-loss-fixed-across-brackets-not-effective-area-scaled" as const,
  closedReverseEroaInterpretation:
    "clinical-reverse-phase-EROA-seeded-bidirectional-residual-hydraulic-gap" as const,
  numericalAreaFloorIsPhysicalEroa: false as const,
  valveBulkFlowMemory: false as const,
  valveOpeningMemoryOnly: true as const,
  openingKinetics:
    "healthy-fixed-across-all-research-brackets" as const,
  rootInertanceOwnership: Object.freeze({
    systemic: "Ao_SA" as const,
    pulmonary: "PA_PArt" as const,
  }),
  valveInertanceOwnership: "none" as const,
  stenosisAndRegurgitationParameterFieldsComposeWithoutConflict: true as const,
  allDirectionFlowResponsesAreIndependent: false as const,
  parameterSearchOrPatientFitting: false as const,
});

export type MainWireFourValveDiseaseBracketV1 = Readonly<{
  bracketId: MainWireFourValveDiseaseBracketIdV1;
  lesionCode: MainWireFourValveDiseaseLesionCodeV1;
  lesionKind: MainWireFourValveDiseaseLesionKindV1;
  targetValveId: ValveName;
  severity: MainWireFourValveDiseaseSeverityV1;
  severityRank: 1 | 2 | 3;
  label: string;
  labelSemantics: "research-bracket-not-clinical-diagnosis";
  evidenceBasis: MainWireFourValveDiseaseEvidenceBasisV1;
  clinicalAreaThresholdStatus:
    MainWireFourValveDiseaseClinicalAreaThresholdStatusV1;
  areaParameter: "maximumForwardEoaCm2" | "closedReverseEroaCm2";
  areaCm2: number;
  openingKinetics: "healthy-fixed-not-disease-calibrated";
  requiresClosedLoopHemodynamicValidation: true;
  requiresPostSolveAreaCalibration: boolean;
}>;

export type MainWireFourValveDiseaseResearchInputV1 = Readonly<{
  researchInputId: typeof MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUT_V1_ID;
  parameterSetId: string;
  parameterIdentityHash: string;
  bracketIds: readonly MainWireFourValveDiseaseBracketIdV1[];
  brackets: readonly MainWireFourValveDiseaseBracketV1[];
  valves: Readonly<Record<ValveName,
    MainWireQuasiSteadyOrificeValveParamsV2>>;
  claim: typeof MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUT_CLAIM_V1;
}>;

type ValveParameterBody = Omit<
  MainWireQuasiSteadyOrificeValveParamsV2,
  "parameterSetId"
>;

const NORMAL_VALVE_PARAMETER_BODIES = Object.freeze({
  MV: valveBody({
    valveId: "MV",
    backgroundLinearResistanceMmHgSecPerMl: 0.0027,
    maximumForwardEoaCm2: 5.5,
    closedReverseEroaCm2: 0,
    openingGainPerMmHg: 2,
    openingPressureOffsetMmHg: 0,
    openingDriveDeadbandMmHg: MV_PRESSURE_DEADBAND_MMHG,
    openingDriveSmoothingMmHg: 0.1,
    openingTimeConstantSec: 0.024,
    closingTimeConstantSec: 0.016,
  }),
  AoV: valveBody({
    valveId: "AoV",
    backgroundLinearResistanceMmHgSecPerMl: 0.0015,
    maximumForwardEoaCm2: 3.5,
    closedReverseEroaCm2: 0,
    openingGainPerMmHg: 3,
    openingPressureOffsetMmHg: 0,
    openingDriveDeadbandMmHg: 0,
    openingDriveSmoothingMmHg: 0.1,
    openingTimeConstantSec: 0.006,
    closingTimeConstantSec: 0.008,
  }),
  TV: valveBody({
    valveId: "TV",
    backgroundLinearResistanceMmHgSecPerMl: 0.0035,
    maximumForwardEoaCm2: 8,
    closedReverseEroaCm2: 0,
    openingGainPerMmHg: 2,
    openingPressureOffsetMmHg: 0,
    openingDriveDeadbandMmHg: 0,
    openingDriveSmoothingMmHg: 0.1,
    openingTimeConstantSec: 0.018,
    closingTimeConstantSec: 0.010,
  }),
  PV: valveBody({
    valveId: "PV",
    backgroundLinearResistanceMmHgSecPerMl: 0.005,
    maximumForwardEoaCm2: 4,
    closedReverseEroaCm2: 0,
    openingGainPerMmHg: 2,
    openingPressureOffsetMmHg: 0,
    openingDriveDeadbandMmHg: 0,
    openingDriveSmoothingMmHg: 0.1,
    openingTimeConstantSec: 0.010,
    closingTimeConstantSec: 0.006,
  }),
} as const satisfies Readonly<Record<ValveName, ValveParameterBody>>);

const FORWARD_AREA_BRACKETS = Object.freeze({
  AS: Object.freeze({ mild: 1.75, moderate: 1.25, severe: 0.8 }),
  MS: Object.freeze({ mild: 1.75, moderate: 1.25, severe: 0.8 }),
  TS: Object.freeze({ mild: 2.0, moderate: 1.4, severe: 0.9 }),
  PS: Object.freeze({ mild: 1.4, moderate: 0.7, severe: 0.45 }),
} as const);

const REVERSE_AREA_BRACKETS = Object.freeze({
  AR: Object.freeze({ mild: 0.05, moderate: 0.20, severe: 0.35 }),
  MR: Object.freeze({ mild: 0.10, moderate: 0.25, severe: 0.45 }),
  TR: Object.freeze({ mild: 0.10, moderate: 0.30, severe: 0.50 }),
  PR: Object.freeze({ mild: 0.10, moderate: 0.40, severe: 0.90 }),
} as const);

const LESION_METADATA = Object.freeze({
  AS: lesion("stenosis", "AoV", "guideline-area-anchor"),
  AR: lesion("regurgitation", "AoV", "guideline-area-anchor"),
  MS: lesion("stenosis", "MV", "guideline-area-anchor"),
  MR: lesion("regurgitation", "MV", "guideline-area-anchor"),
  TS: lesion("stenosis", "TV", "engineering-only-bracket"),
  TR: lesion("regurgitation", "TV", "guideline-area-anchor"),
  PS: lesion("stenosis", "PV", "hemodynamic-calibration-required"),
  PR: lesion("regurgitation", "PV", "hemodynamic-calibration-required"),
} as const satisfies Readonly<Record<
  MainWireFourValveDiseaseLesionCodeV1,
  Readonly<{
    lesionKind: MainWireFourValveDiseaseLesionKindV1;
    targetValveId: ValveName;
    evidenceBasis: MainWireFourValveDiseaseEvidenceBasisV1;
  }>
>>);

export const MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKET_IDS_V1 = Object.freeze(
  MAIN_WIRE_FOUR_VALVE_DISEASE_LESION_CODES_V1.flatMap((lesionCode) =>
    MAIN_WIRE_FOUR_VALVE_DISEASE_SEVERITIES_V1.map((severity) =>
      `${lesionCode}-${severity}` as MainWireFourValveDiseaseBracketIdV1)),
);

export const MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKETS_V1 = Object.freeze(
  MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKET_IDS_V1.map(buildBracket),
);

export const MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKET_BY_ID_V1 = Object.freeze(
  Object.fromEntries(MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKETS_V1.map((bracket) =>
    [bracket.bracketId, bracket])),
) as Readonly<Record<
  MainWireFourValveDiseaseBracketIdV1,
  MainWireFourValveDiseaseBracketV1
>>;

export const MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1 =
  composeMainWireFourValveDiseaseResearchInputV1([]);

export const MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUTS_V1 = Object.freeze(
  Object.fromEntries(MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKET_IDS_V1.map(
    (bracketId) => [
      bracketId,
      composeMainWireFourValveDiseaseResearchInputV1([bracketId]),
    ],
  )),
) as Readonly<Record<
  MainWireFourValveDiseaseBracketIdV1,
  MainWireFourValveDiseaseResearchInputV1
>>;

export function composeMainWireFourValveDiseaseResearchInputV1(
  inputs: readonly (
    MainWireFourValveDiseaseBracketIdV1
    | MainWireFourValveDiseaseBracketV1
  )[],
): MainWireFourValveDiseaseResearchInputV1 {
  const brackets = canonicalBrackets(inputs);
  assertNoConflictingBrackets(brackets);
  const bodyByValve = mutableNormalBodies();
  for (const bracket of brackets) {
    const body = bodyByValve[bracket.targetValveId];
    if (bracket.areaParameter === "maximumForwardEoaCm2") {
      bodyByValve[bracket.targetValveId] = {
        ...body,
        maximumForwardEoaCm2: bracket.areaCm2,
      };
    } else {
      bodyByValve[bracket.targetValveId] = {
        ...body,
        closedReverseEroaCm2: bracket.areaCm2,
      };
    }
  }
  const bracketIds = Object.freeze(brackets.map((bracket) => bracket.bracketId));
  const valves = valveRecord((valveId) => {
    const affectingIds = brackets.filter((bracket) =>
      bracket.targetValveId === valveId).map((bracket) => bracket.bracketId);
    return Object.freeze({
      parameterSetId: valveParameterSetId(valveId, affectingIds),
      ...bodyByValve[valveId],
    });
  });
  const identityBody = Object.freeze({
    researchInputId: MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUT_V1_ID,
    bracketIds,
    valves,
    claim: MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUT_CLAIM_V1,
  });
  const parameterIdentityHash = stableHash(sanitizeForStableHash(identityBody));
  const result = Object.freeze({
    researchInputId: MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUT_V1_ID,
    parameterSetId: researchInputParameterSetId(bracketIds, parameterIdentityHash),
    parameterIdentityHash,
    bracketIds,
    brackets,
    valves,
    claim: MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUT_CLAIM_V1,
  } satisfies MainWireFourValveDiseaseResearchInputV1);
  const issues = validateMainWireFourValveDiseaseResearchInputV1(result);
  if (issues.length > 0) {
    throw new Error(`invalid four-valve disease research input: ${issues.join("; ")}`);
  }
  return result;
}

export function validateMainWireFourValveDiseaseResearchInputV1(
  researchInput: MainWireFourValveDiseaseResearchInputV1,
): readonly string[] {
  const issues: string[] = [];
  if (researchInput.researchInputId !== MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUT_V1_ID) {
    issues.push("researchInputId must identify four-valve disease research input V1");
  }
  if (typeof researchInput.parameterSetId !== "string"
    || researchInput.parameterSetId.trim() === "") {
    issues.push("parameterSetId must be non-empty");
  }
  if (!/^[0-9a-f]{8}$/.test(researchInput.parameterIdentityHash)) {
    issues.push("parameterIdentityHash must be an eight-character hex hash");
  }
  const rawBracketIds = [...researchInput.bracketIds] as readonly string[];
  const unknownBracketIds = rawBracketIds.filter((bracketId) =>
    !MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKET_IDS_V1.includes(
      bracketId as MainWireFourValveDiseaseBracketIdV1,
    ));
  if (unknownBracketIds.length > 0) {
    issues.push(`bracketIds contain unknown entries: ${unknownBracketIds.join(", ")}`);
  }
  if (new Set(rawBracketIds).size !== rawBracketIds.length) {
    issues.push("bracketIds must be unique");
  }
  const sortedBracketIds = [...rawBracketIds].sort((left, right) =>
    left.localeCompare(right));
  if (JSON.stringify(rawBracketIds) !== JSON.stringify(sortedBracketIds)) {
    issues.push("bracketIds must use canonical lexical order");
  }
  const knownBrackets = rawBracketIds.flatMap((bracketId) => {
    const bracket = MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKET_BY_ID_V1[
      bracketId as MainWireFourValveDiseaseBracketIdV1
    ];
    return bracket === undefined ? [] : [bracket];
  });
  if (
    knownBrackets.length !== researchInput.brackets.length
    || stableHash(sanitizeForStableHash(knownBrackets))
      !== stableHash(sanitizeForStableHash(researchInput.brackets))
  ) {
    issues.push("brackets must exactly match canonical metadata for bracketIds");
  }
  try {
    assertNoConflictingBrackets(knownBrackets);
  } catch (error) {
    issues.push(error instanceof Error ? error.message : String(error));
  }
  if (
    stableHash(sanitizeForStableHash(researchInput.claim))
      !== stableHash(sanitizeForStableHash(
        MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUT_CLAIM_V1,
      ))
  ) {
    issues.push("claim must exactly match the canonical V1 claim");
  }
  const keys = Object.keys(researchInput.valves).sort();
  const expectedKeys = [...MAIN_WIRE_FOUR_VALVE_IDS_V1].sort();
  if (JSON.stringify(keys) !== JSON.stringify(expectedKeys)) {
    issues.push("valves must contain exactly MV, AoV, TV, and PV");
  }
  for (const valveId of MAIN_WIRE_FOUR_VALVE_IDS_V1) {
    const valve = researchInput.valves[valveId];
    if (valve === undefined) continue;
    if (valve.valveId !== valveId) {
      issues.push(`valves.${valveId}.valveId must equal ${valveId}`);
    }
    const expectedValveParameterSetId = valveParameterSetId(
      valveId,
      knownBrackets.filter((bracket) => bracket.targetValveId === valveId)
        .map((bracket) => bracket.bracketId),
    );
    if (valve.parameterSetId !== expectedValveParameterSetId) {
      issues.push(
        `valves.${valveId}.parameterSetId does not match bracket provenance`,
      );
    }
    positive(valve.backgroundLinearResistanceMmHgSecPerMl,
      `valves.${valveId}.backgroundLinearResistanceMmHgSecPerMl`, issues);
    positive(valve.maximumForwardEoaCm2,
      `valves.${valveId}.maximumForwardEoaCm2`, issues);
    nonnegative(valve.closedReverseEroaCm2,
      `valves.${valveId}.closedReverseEroaCm2`, issues);
    if (valve.closedReverseEroaCm2 > valve.maximumForwardEoaCm2) {
      issues.push(
        `valves.${valveId}.closedReverseEroaCm2 must not exceed maximumForwardEoaCm2`,
      );
    }
    positive(valve.openingGainPerMmHg,
      `valves.${valveId}.openingGainPerMmHg`, issues);
    finite(valve.openingPressureOffsetMmHg,
      `valves.${valveId}.openingPressureOffsetMmHg`, issues);
    nonnegative(valve.openingDriveDeadbandMmHg,
      `valves.${valveId}.openingDriveDeadbandMmHg`, issues);
    positive(valve.openingDriveSmoothingMmHg,
      `valves.${valveId}.openingDriveSmoothingMmHg`, issues);
    positive(valve.openingTimeConstantSec,
      `valves.${valveId}.openingTimeConstantSec`, issues);
    positive(valve.closingTimeConstantSec,
      `valves.${valveId}.closingTimeConstantSec`, issues);
  }
  const expectedIdentityHash = stableHash(sanitizeForStableHash(Object.freeze({
    researchInputId: researchInput.researchInputId,
    bracketIds: researchInput.bracketIds,
    valves: researchInput.valves,
    claim: researchInput.claim,
  })));
  if (researchInput.parameterIdentityHash !== expectedIdentityHash) {
    issues.push("parameterIdentityHash does not match research input contents");
  }
  const expectedParameterSetId = researchInputParameterSetId(
    researchInput.bracketIds,
    expectedIdentityHash,
  );
  if (researchInput.parameterSetId !== expectedParameterSetId) {
    issues.push("parameterSetId does not match bracketIds and parameter identity");
  }
  return Object.freeze(issues);
}

function buildBracket(
  bracketId: MainWireFourValveDiseaseBracketIdV1,
): MainWireFourValveDiseaseBracketV1 {
  const [lesionCodeRaw, severityRaw] = bracketId.split("-");
  const lesionCode = lesionCodeRaw as MainWireFourValveDiseaseLesionCodeV1;
  const severity = severityRaw as MainWireFourValveDiseaseSeverityV1;
  const metadata = LESION_METADATA[lesionCode];
  const areaParameter = metadata.lesionKind === "stenosis"
    ? "maximumForwardEoaCm2" as const
    : "closedReverseEroaCm2" as const;
  const areaCm2 = metadata.lesionKind === "stenosis"
    ? FORWARD_AREA_BRACKETS[lesionCode as keyof typeof FORWARD_AREA_BRACKETS][severity]
    : REVERSE_AREA_BRACKETS[lesionCode as keyof typeof REVERSE_AREA_BRACKETS][severity];
  return Object.freeze({
    bracketId,
    lesionCode,
    lesionKind: metadata.lesionKind,
    targetValveId: metadata.targetValveId,
    severity,
    severityRank: severityRank(severity),
    label: `${lesionCode} ${severity} research bracket (not a clinical diagnosis)`,
    labelSemantics: "research-bracket-not-clinical-diagnosis" as const,
    evidenceBasis: evidenceBasis(lesionCode, severity, metadata.evidenceBasis),
    clinicalAreaThresholdStatus:
      clinicalAreaThresholdStatus(lesionCode, severity),
    areaParameter,
    areaCm2,
    openingKinetics: "healthy-fixed-not-disease-calibrated" as const,
    requiresClosedLoopHemodynamicValidation: true as const,
    requiresPostSolveAreaCalibration:
      metadata.evidenceBasis === "hemodynamic-calibration-required",
  });
}

function canonicalBrackets(
  inputs: readonly (
    MainWireFourValveDiseaseBracketIdV1
    | MainWireFourValveDiseaseBracketV1
  )[],
): readonly MainWireFourValveDiseaseBracketV1[] {
  const resolved = inputs.map((input) => {
    const bracketId = typeof input === "string" ? input : input.bracketId;
    const bracket = MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKET_BY_ID_V1[bracketId];
    if (bracket === undefined) {
      throw new Error(`unknown four-valve disease bracket: ${bracketId}`);
    }
    return bracket;
  }).sort((left, right) => left.bracketId.localeCompare(right.bracketId));
  return Object.freeze(resolved);
}

function assertNoConflictingBrackets(
  brackets: readonly MainWireFourValveDiseaseBracketV1[],
): void {
  const ownerByDirection = new Map<string, MainWireFourValveDiseaseBracketIdV1>();
  for (const bracket of brackets) {
    const key = `${bracket.targetValveId}:${bracket.lesionKind}`;
    const existing = ownerByDirection.get(key);
    if (existing !== undefined) {
      throw new Error(
        `conflicting four-valve disease brackets ${existing} and ${bracket.bracketId}`
          + ` target the same ${key}`,
      );
    }
    ownerByDirection.set(key, bracket.bracketId);
  }
}

function mutableNormalBodies(): Record<ValveName, ValveParameterBody> {
  return Object.fromEntries(MAIN_WIRE_FOUR_VALVE_IDS_V1.map((valveId) => [
    valveId,
    { ...NORMAL_VALVE_PARAMETER_BODIES[valveId] },
  ])) as Record<ValveName, ValveParameterBody>;
}

function valveParameterSetId(
  valveId: ValveName,
  bracketIds: readonly MainWireFourValveDiseaseBracketIdV1[],
): string {
  const phenotype = bracketIds.length === 0
    ? "normal-reference-topology"
    : bracketIds.join("+").toLowerCase();
  return `main-wire-${valveId.toLowerCase()}-quasi-steady-orifice-${phenotype}-v2`;
}

function researchInputParameterSetId(
  bracketIds: readonly MainWireFourValveDiseaseBracketIdV1[],
  parameterIdentityHash: string,
): string {
  return bracketIds.length === 0
    ? `main-wire-four-valve-normal-reference-topology-${parameterIdentityHash}-v1`
    : `main-wire-four-valve-${bracketIds.join("+").toLowerCase()}-${parameterIdentityHash}-v1`;
}

function severityRank(
  severity: MainWireFourValveDiseaseSeverityV1,
): 1 | 2 | 3 {
  if (severity === "mild") return 1;
  if (severity === "moderate") return 2;
  return 3;
}

function evidenceBasis(
  lesionCode: MainWireFourValveDiseaseLesionCodeV1,
  severity: MainWireFourValveDiseaseSeverityV1,
  defaultBasis: MainWireFourValveDiseaseEvidenceBasisV1,
): MainWireFourValveDiseaseEvidenceBasisV1 {
  if (lesionCode === "TS" && severity === "severe") {
    return "guideline-area-anchor";
  }
  return defaultBasis;
}

function clinicalAreaThresholdStatus(
  lesionCode: MainWireFourValveDiseaseLesionCodeV1,
  severity: MainWireFourValveDiseaseSeverityV1,
): MainWireFourValveDiseaseClinicalAreaThresholdStatusV1 {
  if (lesionCode === "PS" || lesionCode === "PR") {
    return "no-fixed-clinical-area-threshold";
  }
  if (lesionCode === "TS") {
    return severity === "severe"
      ? "guideline-significant-endpoint-anchor"
      : "engineering-only-no-clinical-grade-anchor";
  }
  return "guideline-area-anchor";
}

function lesion(
  lesionKind: MainWireFourValveDiseaseLesionKindV1,
  targetValveId: ValveName,
  evidenceBasis: MainWireFourValveDiseaseEvidenceBasisV1,
) {
  return Object.freeze({ lesionKind, targetValveId, evidenceBasis });
}

function valveBody(body: ValveParameterBody): ValveParameterBody {
  return Object.freeze({ ...body });
}

function valveRecord<T>(
  build: (valveId: ValveName) => T,
): Readonly<Record<ValveName, T>> {
  return Object.freeze(Object.fromEntries(MAIN_WIRE_FOUR_VALVE_IDS_V1.map(
    (valveId) => [valveId, build(valveId)],
  ))) as Readonly<Record<ValveName, T>>;
}

function positive(value: number, label: string, issues: string[]): void {
  if (!(value > 0) || !Number.isFinite(value)) {
    issues.push(`${label} must be finite and positive`);
  }
}

function nonnegative(value: number, label: string, issues: string[]): void {
  if (!(value >= 0) || !Number.isFinite(value)) {
    issues.push(`${label} must be finite and nonnegative`);
  }
}

function finite(value: number, label: string, issues: string[]): void {
  if (!Number.isFinite(value)) issues.push(`${label} must be finite`);
}
