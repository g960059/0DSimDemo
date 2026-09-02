import {
  MV_PRESSURE_DEADBAND_MMHG,
  type ValveName,
} from "@/engine/core/topology";
import {
  sanitizeForStableHash,
  stableHash,
} from "@/engine/integrity/stableHash";
import type { MainWireQuasiSteadyOrificeValveParamsV2 } from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

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
export type MainWireFourValveDiseaseLesionKindV1 = "stenosis" | "regurgitation";
export type MainWireFourValveDiseaseEvidenceBasisV1 =
  | "guideline-area-anchor"
  | "engineering-only-bracket"
  | "hemodynamic-calibration-required";
export type MainWireFourValveDiseaseClinicalAreaThresholdStatusV1 =
  | "guideline-area-anchor"
  | "guideline-significant-endpoint-anchor"
  | "engineering-only-no-clinical-grade-anchor"
  | "no-fixed-clinical-area-threshold";

export const MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUT_CLAIM_V1 =
  Object.freeze({
    researchInputRole:
      "ordered-research-bracket-not-clinical-diagnosis" as const,
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
    openingKinetics: "healthy-fixed-across-all-research-brackets" as const,
    rootInertanceOwnership: Object.freeze({
      systemic: "Ao_SA" as const,
      pulmonary: "PA_PArt" as const,
    }),
    valveInertanceOwnership: "none" as const,
    stenosisAndRegurgitationParameterFieldsComposeWithoutConflict:
      true as const,
    allDirectionFlowResponsesAreIndependent: false as const,
    parameterSearchOrPatientFitting: false as const,
  });

export const MAIN_WIRE_FOUR_VALVE_CONTINUOUS_AREA_RESEARCH_INPUT_CLAIM_V1 =
  Object.freeze({
    ...MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUT_CLAIM_V1,
    researchInputRole:
      "continuous-effective-area-research-not-clinical-diagnosis" as const,
    continuousAreaInputOnly: true as const,
    canonicalSeverityBracketClaimed: false as const,
  });

export const MAIN_WIRE_PULMONARY_VALVE_OPENING_TIME_RESEARCH_RANGE_V1 =
  Object.freeze({
    minimumSec: 0.005,
    maximumSec: 0.1,
  });

export const MAIN_WIRE_PULMONARY_VALVE_OPENING_KINETICS_RESEARCH_INPUT_CLAIM_V1 =
  Object.freeze({
    ...MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUT_CLAIM_V1,
    researchInputRole:
      "pulmonary-valve-opening-kinetics-causal-research" as const,
    openingKinetics:
      "bounded-pulmonary-opening-time-constant-causal-research" as const,
    continuousAreaInputOnly: true as const,
    canonicalSeverityBracketClaimed: false as const,
    pulmonaryValveOpeningTimeRangeSec:
      MAIN_WIRE_PULMONARY_VALVE_OPENING_TIME_RESEARCH_RANGE_V1,
    newContinuousStateAdded: false as const,
    parameterSearchOrPatientFitting: true as const,
    patientFittingClaimed: false as const,
  });

export const MAIN_WIRE_PULMONARY_VALVE_SERIES_RESISTANCE_RESEARCH_RANGE_V1 =
  Object.freeze({
    minimumMmHgSecPerMl: 0.005,
    maximumMmHgSecPerMl: 0.03,
  });

export const MAIN_WIRE_PULMONARY_VALVE_SERIES_RESISTANCE_RESEARCH_INPUT_CLAIM_V1 =
  Object.freeze({
    ...MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUT_CLAIM_V1,
    researchInputRole:
      "pulmonary-valve-series-resistance-placement-causal-research" as const,
    backgroundLinearResistance:
      "bounded-PV-only-series-resistance-placement-proxy" as const,
    continuousAreaInputOnly: true as const,
    canonicalSeverityBracketClaimed: false as const,
    pulmonaryValveSeriesResistanceRangeMmHgSecPerMl:
      MAIN_WIRE_PULMONARY_VALVE_SERIES_RESISTANCE_RESEARCH_RANGE_V1,
    newContinuousStateAdded: false as const,
    parameterSearchOrPatientFitting: true as const,
    patientFittingClaimed: false as const,
  });

export type MainWireFourValveAreaInputsV1 = Readonly<
  Record<
    ValveName,
    Readonly<{
      maximumForwardEoaCm2: number;
      closedReverseEroaCm2: number;
    }>
  >
>;

export type MainWireFourValveAreaInputRangesV1 = Readonly<
  Record<
    ValveName,
    Readonly<{
      maximumForwardEoaCm2: Readonly<{
        minimum: number;
        maximum: number;
        step: number;
      }>;
      closedReverseEroaCm2: Readonly<{
        minimum: number;
        maximum: number;
        step: number;
      }>;
    }>
  >
>;

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
  clinicalAreaThresholdStatus: MainWireFourValveDiseaseClinicalAreaThresholdStatusV1;
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
  valves: Readonly<Record<ValveName, MainWireQuasiSteadyOrificeValveParamsV2>>;
  claim:
    | typeof MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUT_CLAIM_V1
    | typeof MAIN_WIRE_FOUR_VALVE_CONTINUOUS_AREA_RESEARCH_INPUT_CLAIM_V1
    | typeof MAIN_WIRE_PULMONARY_VALVE_OPENING_KINETICS_RESEARCH_INPUT_CLAIM_V1
    | typeof MAIN_WIRE_PULMONARY_VALVE_SERIES_RESISTANCE_RESEARCH_INPUT_CLAIM_V1;
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
    closingTimeConstantSec: 0.01,
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
    openingTimeConstantSec: 0.01,
    closingTimeConstantSec: 0.006,
  }),
} as const satisfies Readonly<Record<ValveName, ValveParameterBody>>);

export const MAIN_WIRE_FOUR_VALVE_DEFAULT_AREA_INPUTS_V1 = valveRecord(
  (valveId) =>
    Object.freeze({
      maximumForwardEoaCm2:
        NORMAL_VALVE_PARAMETER_BODIES[valveId].maximumForwardEoaCm2,
      closedReverseEroaCm2:
        NORMAL_VALVE_PARAMETER_BODIES[valveId].closedReverseEroaCm2,
    }),
) satisfies MainWireFourValveAreaInputsV1;

/** Numerical research bounds, not clinical severity intervals. */
export const MAIN_WIRE_FOUR_VALVE_AREA_INPUT_RANGES_V1 = Object.freeze({
  MV: Object.freeze({
    maximumForwardEoaCm2: Object.freeze({
      minimum: 0.6,
      maximum: 6,
      step: 0.05,
    }),
    closedReverseEroaCm2: Object.freeze({
      minimum: 0,
      maximum: 0.6,
      step: 0.01,
    }),
  }),
  AoV: Object.freeze({
    maximumForwardEoaCm2: Object.freeze({
      minimum: 0.5,
      maximum: 4,
      step: 0.05,
    }),
    closedReverseEroaCm2: Object.freeze({
      minimum: 0,
      maximum: 0.5,
      step: 0.01,
    }),
  }),
  TV: Object.freeze({
    maximumForwardEoaCm2: Object.freeze({
      minimum: 0.7,
      maximum: 9,
      step: 0.05,
    }),
    closedReverseEroaCm2: Object.freeze({
      minimum: 0,
      maximum: 0.7,
      step: 0.01,
    }),
  }),
  PV: Object.freeze({
    maximumForwardEoaCm2: Object.freeze({
      minimum: 0.35,
      maximum: 5,
      step: 0.05,
    }),
    closedReverseEroaCm2: Object.freeze({
      minimum: 0,
      maximum: 1,
      step: 0.01,
    }),
  }),
} satisfies MainWireFourValveAreaInputRangesV1);

const FORWARD_AREA_BRACKETS = Object.freeze({
  AS: Object.freeze({ mild: 1.75, moderate: 1.25, severe: 0.8 }),
  MS: Object.freeze({ mild: 1.75, moderate: 1.25, severe: 0.8 }),
  TS: Object.freeze({ mild: 2.0, moderate: 1.4, severe: 0.9 }),
  PS: Object.freeze({ mild: 1.4, moderate: 0.7, severe: 0.45 }),
} as const);

const REVERSE_AREA_BRACKETS = Object.freeze({
  AR: Object.freeze({ mild: 0.05, moderate: 0.2, severe: 0.35 }),
  MR: Object.freeze({ mild: 0.1, moderate: 0.25, severe: 0.45 }),
  TR: Object.freeze({ mild: 0.1, moderate: 0.3, severe: 0.5 }),
  PR: Object.freeze({ mild: 0.1, moderate: 0.4, severe: 0.9 }),
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
} as const satisfies Readonly<
  Record<
    MainWireFourValveDiseaseLesionCodeV1,
    Readonly<{
      lesionKind: MainWireFourValveDiseaseLesionKindV1;
      targetValveId: ValveName;
      evidenceBasis: MainWireFourValveDiseaseEvidenceBasisV1;
    }>
  >
>);

export const MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKET_IDS_V1 = Object.freeze(
  MAIN_WIRE_FOUR_VALVE_DISEASE_LESION_CODES_V1.flatMap((lesionCode) =>
    MAIN_WIRE_FOUR_VALVE_DISEASE_SEVERITIES_V1.map(
      (severity) =>
        `${lesionCode}-${severity}` as MainWireFourValveDiseaseBracketIdV1,
    ),
  ),
);

export const MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKETS_V1 = Object.freeze(
  MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKET_IDS_V1.map(buildBracket),
);

export const MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKET_BY_ID_V1 = Object.freeze(
  Object.fromEntries(
    MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKETS_V1.map((bracket) => [
      bracket.bracketId,
      bracket,
    ]),
  ),
) as Readonly<
  Record<MainWireFourValveDiseaseBracketIdV1, MainWireFourValveDiseaseBracketV1>
>;

export const MAIN_WIRE_FOUR_VALVE_NORMAL_RESEARCH_INPUT_V1 =
  composeMainWireFourValveDiseaseResearchInputV1([]);

export const MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUTS_V1 = Object.freeze(
  Object.fromEntries(
    MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKET_IDS_V1.map((bracketId) => [
      bracketId,
      composeMainWireFourValveDiseaseResearchInputV1([bracketId]),
    ]),
  ),
) as Readonly<
  Record<
    MainWireFourValveDiseaseBracketIdV1,
    MainWireFourValveDiseaseResearchInputV1
  >
>;

export function composeMainWireFourValveDiseaseResearchInputV1(
  inputs: readonly (
    MainWireFourValveDiseaseBracketIdV1 | MainWireFourValveDiseaseBracketV1
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
  const bracketIds = Object.freeze(
    brackets.map((bracket) => bracket.bracketId),
  );
  const valves = valveRecord((valveId) => {
    const affectingIds = brackets
      .filter((bracket) => bracket.targetValveId === valveId)
      .map((bracket) => bracket.bracketId);
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
    parameterSetId: researchInputParameterSetId(
      bracketIds,
      parameterIdentityHash,
    ),
    parameterIdentityHash,
    bracketIds,
    brackets,
    valves,
    claim: MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUT_CLAIM_V1,
  } satisfies MainWireFourValveDiseaseResearchInputV1);
  const issues = validateMainWireFourValveDiseaseResearchInputV1(result);
  if (issues.length > 0) {
    throw new Error(
      `invalid four-valve disease research input: ${issues.join("; ")}`,
    );
  }
  return result;
}

export function createMainWireFourValveContinuousAreaResearchInputV1(
  requestedAreas: MainWireFourValveAreaInputsV1,
): MainWireFourValveDiseaseResearchInputV1 {
  const areas = validateAndOwnMainWireFourValveAreaInputsV1(requestedAreas);
  const bracketIds = Object.freeze(
    [],
  ) as readonly MainWireFourValveDiseaseBracketIdV1[];
  const brackets = Object.freeze(
    [],
  ) as readonly MainWireFourValveDiseaseBracketV1[];
  const valves = valveRecord((valveId) => {
    const body = Object.freeze({
      ...NORMAL_VALVE_PARAMETER_BODIES[valveId],
      ...areas[valveId],
    });
    return Object.freeze({
      parameterSetId: continuousValveParameterSetIdV1(valveId, body),
      ...body,
    });
  });
  const identityBody = Object.freeze({
    researchInputId: MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUT_V1_ID,
    bracketIds,
    valves,
    claim: MAIN_WIRE_FOUR_VALVE_CONTINUOUS_AREA_RESEARCH_INPUT_CLAIM_V1,
  });
  const parameterIdentityHash = stableHash(sanitizeForStableHash(identityBody));
  const result = Object.freeze({
    researchInputId: MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUT_V1_ID,
    parameterSetId: `main-wire-four-valve-continuous-areas-${parameterIdentityHash}-v1`,
    parameterIdentityHash,
    bracketIds,
    brackets,
    valves,
    claim: MAIN_WIRE_FOUR_VALVE_CONTINUOUS_AREA_RESEARCH_INPUT_CLAIM_V1,
  } satisfies MainWireFourValveDiseaseResearchInputV1);
  const issues = validateMainWireFourValveDiseaseResearchInputV1(result);
  if (issues.length > 0) {
    throw new Error(
      `invalid continuous four-valve research input: ${issues.join("; ")}`,
    );
  }
  return result;
}

/**
 * Causal research input for the already-existing PV opening-fraction state.
 * It adds no state and changes no other valve parameter. This is deliberately
 * separate from disease-area inputs and is not a patient-fitting control.
 */
export function createMainWirePulmonaryValveOpeningKineticsResearchInputV1(
  requestedAreas: MainWireFourValveAreaInputsV1,
  openingTimeConstantSec: number,
): MainWireFourValveDiseaseResearchInputV1 {
  const areas = validateAndOwnMainWireFourValveAreaInputsV1(requestedAreas);
  if (
    !Number.isFinite(openingTimeConstantSec)
    || openingTimeConstantSec
      < MAIN_WIRE_PULMONARY_VALVE_OPENING_TIME_RESEARCH_RANGE_V1.minimumSec
    || openingTimeConstantSec
      > MAIN_WIRE_PULMONARY_VALVE_OPENING_TIME_RESEARCH_RANGE_V1.maximumSec
  ) {
    throw new Error(
      "pulmonary valve opening time constant must be finite within "
        + `[${MAIN_WIRE_PULMONARY_VALVE_OPENING_TIME_RESEARCH_RANGE_V1.minimumSec}, `
        + `${MAIN_WIRE_PULMONARY_VALVE_OPENING_TIME_RESEARCH_RANGE_V1.maximumSec}] s`,
    );
  }
  const bracketIds = Object.freeze(
    [],
  ) as readonly MainWireFourValveDiseaseBracketIdV1[];
  const brackets = Object.freeze(
    [],
  ) as readonly MainWireFourValveDiseaseBracketV1[];
  const valves = valveRecord((valveId) => {
    const body = Object.freeze({
      ...NORMAL_VALVE_PARAMETER_BODIES[valveId],
      ...areas[valveId],
      ...(valveId === "PV" ? { openingTimeConstantSec } : {}),
    });
    return Object.freeze({
      parameterSetId: continuousValveParameterSetIdV1(valveId, body),
      ...body,
    });
  });
  const identityBody = Object.freeze({
    researchInputId: MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUT_V1_ID,
    bracketIds,
    valves,
    claim:
      MAIN_WIRE_PULMONARY_VALVE_OPENING_KINETICS_RESEARCH_INPUT_CLAIM_V1,
  });
  const parameterIdentityHash = stableHash(sanitizeForStableHash(identityBody));
  const result = Object.freeze({
    researchInputId: MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUT_V1_ID,
    parameterSetId:
      `main-wire-four-valve-pv-opening-kinetics-${parameterIdentityHash}-v1`,
    parameterIdentityHash,
    bracketIds,
    brackets,
    valves,
    claim:
      MAIN_WIRE_PULMONARY_VALVE_OPENING_KINETICS_RESEARCH_INPUT_CLAIM_V1,
  } satisfies MainWireFourValveDiseaseResearchInputV1);
  const issues = validateMainWireFourValveDiseaseResearchInputV1(result);
  if (issues.length > 0) {
    throw new Error(
      `invalid pulmonary valve kinetics research input: ${issues.join("; ")}`,
    );
  }
  return result;
}

/**
 * Causal proxy for moving an existing linear pulmonary root load to the
 * proximal side of PA compliance. It changes only the already-present PV
 * series resistance and adds no state. It is not a final loss attribution.
 */
export function createMainWirePulmonaryValveSeriesResistanceResearchInputV1(
  requestedAreas: MainWireFourValveAreaInputsV1,
  backgroundLinearResistanceMmHgSecPerMl: number,
): MainWireFourValveDiseaseResearchInputV1 {
  const areas = validateAndOwnMainWireFourValveAreaInputsV1(requestedAreas);
  const range =
    MAIN_WIRE_PULMONARY_VALVE_SERIES_RESISTANCE_RESEARCH_RANGE_V1;
  if (
    !Number.isFinite(backgroundLinearResistanceMmHgSecPerMl)
    || backgroundLinearResistanceMmHgSecPerMl
      < range.minimumMmHgSecPerMl
    || backgroundLinearResistanceMmHgSecPerMl
      > range.maximumMmHgSecPerMl
  ) {
    throw new Error(
      "pulmonary valve series resistance must be finite within "
        + `[${range.minimumMmHgSecPerMl}, `
        + `${range.maximumMmHgSecPerMl}] mmHg*s/mL`,
    );
  }
  const bracketIds = Object.freeze(
    [],
  ) as readonly MainWireFourValveDiseaseBracketIdV1[];
  const brackets = Object.freeze(
    [],
  ) as readonly MainWireFourValveDiseaseBracketV1[];
  const valves = valveRecord((valveId) => {
    const body = Object.freeze({
      ...NORMAL_VALVE_PARAMETER_BODIES[valveId],
      ...areas[valveId],
      ...(valveId === "PV"
        ? { backgroundLinearResistanceMmHgSecPerMl }
        : {}),
    });
    return Object.freeze({
      parameterSetId: continuousValveParameterSetIdV1(valveId, body),
      ...body,
    });
  });
  const identityBody = Object.freeze({
    researchInputId: MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUT_V1_ID,
    bracketIds,
    valves,
    claim:
      MAIN_WIRE_PULMONARY_VALVE_SERIES_RESISTANCE_RESEARCH_INPUT_CLAIM_V1,
  });
  const parameterIdentityHash = stableHash(sanitizeForStableHash(identityBody));
  const result = Object.freeze({
    researchInputId: MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUT_V1_ID,
    parameterSetId:
      `main-wire-four-valve-pv-series-resistance-${parameterIdentityHash}-v1`,
    parameterIdentityHash,
    bracketIds,
    brackets,
    valves,
    claim:
      MAIN_WIRE_PULMONARY_VALVE_SERIES_RESISTANCE_RESEARCH_INPUT_CLAIM_V1,
  } satisfies MainWireFourValveDiseaseResearchInputV1);
  const issues = validateMainWireFourValveDiseaseResearchInputV1(result);
  if (issues.length > 0) {
    throw new Error(
      `invalid pulmonary valve series-resistance research input: ${issues.join("; ")}`,
    );
  }
  return result;
}

export function validateAndOwnMainWireFourValveAreaInputsV1(
  input: unknown,
): MainWireFourValveAreaInputsV1 {
  const record = exactPlainRecordV1(
    input,
    MAIN_WIRE_FOUR_VALVE_IDS_V1,
    "four-valve area inputs",
  );
  const owned = {} as Record<
    ValveName,
    {
      maximumForwardEoaCm2: number;
      closedReverseEroaCm2: number;
    }
  >;
  for (const valveId of MAIN_WIRE_FOUR_VALVE_IDS_V1) {
    const value = exactPlainRecordV1(
      record[valveId],
      ["maximumForwardEoaCm2", "closedReverseEroaCm2"],
      `four-valve area inputs ${valveId}`,
    );
    const ranges = MAIN_WIRE_FOUR_VALVE_AREA_INPUT_RANGES_V1[valveId];
    const maximumForwardEoaCm2 = boundedFiniteV1(
      value.maximumForwardEoaCm2,
      ranges.maximumForwardEoaCm2,
      `${valveId} maximum forward EOA`,
    );
    const closedReverseEroaCm2 = boundedFiniteV1(
      value.closedReverseEroaCm2,
      ranges.closedReverseEroaCm2,
      `${valveId} closed reverse EROA`,
    );
    if (closedReverseEroaCm2 > maximumForwardEoaCm2) {
      throw new Error(`${valveId} reverse EROA must not exceed forward EOA`);
    }
    owned[valveId] = Object.freeze({
      maximumForwardEoaCm2,
      closedReverseEroaCm2,
    });
  }
  return Object.freeze(owned) as MainWireFourValveAreaInputsV1;
}

export function validateMainWireFourValveDiseaseResearchInputV1(
  researchInput: MainWireFourValveDiseaseResearchInputV1,
): readonly string[] {
  const issues: string[] = [];
  if (
    researchInput.researchInputId !==
    MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUT_V1_ID
  ) {
    issues.push(
      "researchInputId must identify four-valve disease research input V1",
    );
  }
  if (
    typeof researchInput.parameterSetId !== "string" ||
    researchInput.parameterSetId.trim() === ""
  ) {
    issues.push("parameterSetId must be non-empty");
  }
  if (!/^[0-9a-f]{8}$/.test(researchInput.parameterIdentityHash)) {
    issues.push("parameterIdentityHash must be an eight-character hex hash");
  }
  const rawBracketIds = [...researchInput.bracketIds] as readonly string[];
  const unknownBracketIds = rawBracketIds.filter(
    (bracketId) =>
      !MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKET_IDS_V1.includes(
        bracketId as MainWireFourValveDiseaseBracketIdV1,
      ),
  );
  if (unknownBracketIds.length > 0) {
    issues.push(
      `bracketIds contain unknown entries: ${unknownBracketIds.join(", ")}`,
    );
  }
  if (new Set(rawBracketIds).size !== rawBracketIds.length) {
    issues.push("bracketIds must be unique");
  }
  const sortedBracketIds = [...rawBracketIds].sort((left, right) =>
    left.localeCompare(right),
  );
  if (JSON.stringify(rawBracketIds) !== JSON.stringify(sortedBracketIds)) {
    issues.push("bracketIds must use canonical lexical order");
  }
  const knownBrackets = rawBracketIds.flatMap((bracketId) => {
    const bracket =
      MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKET_BY_ID_V1[
        bracketId as MainWireFourValveDiseaseBracketIdV1
      ];
    return bracket === undefined ? [] : [bracket];
  });
  if (
    knownBrackets.length !== researchInput.brackets.length ||
    stableHash(sanitizeForStableHash(knownBrackets)) !==
      stableHash(sanitizeForStableHash(researchInput.brackets))
  ) {
    issues.push(
      "brackets must exactly match canonical metadata for bracketIds",
    );
  }
  try {
    assertNoConflictingBrackets(knownBrackets);
  } catch (error) {
    issues.push(error instanceof Error ? error.message : String(error));
  }
  const claimHash = stableHash(sanitizeForStableHash(researchInput.claim));
  const canonicalClaimHash = stableHash(
    sanitizeForStableHash(MAIN_WIRE_FOUR_VALVE_DISEASE_RESEARCH_INPUT_CLAIM_V1),
  );
  const continuousClaimHash = stableHash(
    sanitizeForStableHash(
      MAIN_WIRE_FOUR_VALVE_CONTINUOUS_AREA_RESEARCH_INPUT_CLAIM_V1,
    ),
  );
  const pulmonaryKineticsClaimHash = stableHash(
    sanitizeForStableHash(
      MAIN_WIRE_PULMONARY_VALVE_OPENING_KINETICS_RESEARCH_INPUT_CLAIM_V1,
    ),
  );
  const pulmonarySeriesResistanceClaimHash = stableHash(
    sanitizeForStableHash(
      MAIN_WIRE_PULMONARY_VALVE_SERIES_RESISTANCE_RESEARCH_INPUT_CLAIM_V1,
    ),
  );
  const isContinuousAreaInput = claimHash === continuousClaimHash;
  const isPulmonaryKineticsInput = claimHash === pulmonaryKineticsClaimHash;
  const isPulmonarySeriesResistanceInput =
    claimHash === pulmonarySeriesResistanceClaimHash;
  const allowsContinuousAreas =
    isContinuousAreaInput
    || isPulmonaryKineticsInput
    || isPulmonarySeriesResistanceInput;
  if (
    claimHash !== canonicalClaimHash
    && !isContinuousAreaInput
    && !isPulmonaryKineticsInput
    && !isPulmonarySeriesResistanceInput
  ) {
    issues.push("claim must exactly match the canonical V1 claim");
  }
  if (allowsContinuousAreas && rawBracketIds.length !== 0) {
    issues.push(
      "continuous-area and pulmonary causal inputs must not claim canonical brackets",
    );
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
    const affectingBracketIds = knownBrackets
      .filter((bracket) => bracket.targetValveId === valveId)
      .map((bracket) => bracket.bracketId);
    const expectedValveParameterSetId = allowsContinuousAreas
      ? continuousValveParameterSetIdV1(valveId, valve)
      : valveParameterSetId(valveId, affectingBracketIds);
    if (valve.parameterSetId !== expectedValveParameterSetId) {
      issues.push(
        allowsContinuousAreas
          ? `valves.${valveId}.parameterSetId does not match input provenance`
          : `valves.${valveId}.parameterSetId does not match bracket provenance`,
      );
    }
    const expectedFixedBody = NORMAL_VALVE_PARAMETER_BODIES[valveId];
    for (const key of Object.keys(
      expectedFixedBody,
    ) as (keyof ValveParameterBody)[]) {
      if (
        key !== "maximumForwardEoaCm2"
        && key !== "closedReverseEroaCm2"
        && !(
          isPulmonaryKineticsInput
          && valveId === "PV"
          && key === "openingTimeConstantSec"
        )
        && !(
          isPulmonarySeriesResistanceInput
          && valveId === "PV"
          && key === "backgroundLinearResistanceMmHgSecPerMl"
        )
        && valve[key] !== expectedFixedBody[key]
      ) {
        issues.push(`valves.${valveId}.${key} must remain at its fixed prior`);
      }
    }
    if (!allowsContinuousAreas) {
      const expectedAreas = canonicalValveAreasForBracketsV1(
        valveId,
        knownBrackets,
      );
      if (
        valve.maximumForwardEoaCm2 !== expectedAreas.maximumForwardEoaCm2 ||
        valve.closedReverseEroaCm2 !== expectedAreas.closedReverseEroaCm2
      ) {
        issues.push(`valves.${valveId} areas do not match bracket provenance`);
      }
    }
    positive(
      valve.backgroundLinearResistanceMmHgSecPerMl,
      `valves.${valveId}.backgroundLinearResistanceMmHgSecPerMl`,
      issues,
    );
    if (
      isPulmonarySeriesResistanceInput
      && valveId === "PV"
      && (
        valve.backgroundLinearResistanceMmHgSecPerMl
          < MAIN_WIRE_PULMONARY_VALVE_SERIES_RESISTANCE_RESEARCH_RANGE_V1
            .minimumMmHgSecPerMl
        || valve.backgroundLinearResistanceMmHgSecPerMl
          > MAIN_WIRE_PULMONARY_VALVE_SERIES_RESISTANCE_RESEARCH_RANGE_V1
            .maximumMmHgSecPerMl
      )
    ) {
      issues.push(
        "valves.PV.backgroundLinearResistanceMmHgSecPerMl exceeds research bounds",
      );
    }
    positive(
      valve.maximumForwardEoaCm2,
      `valves.${valveId}.maximumForwardEoaCm2`,
      issues,
    );
    nonnegative(
      valve.closedReverseEroaCm2,
      `valves.${valveId}.closedReverseEroaCm2`,
      issues,
    );
    if (allowsContinuousAreas) {
      const ranges = MAIN_WIRE_FOUR_VALVE_AREA_INPUT_RANGES_V1[valveId];
      if (
        valve.maximumForwardEoaCm2 < ranges.maximumForwardEoaCm2.minimum ||
        valve.maximumForwardEoaCm2 > ranges.maximumForwardEoaCm2.maximum ||
        valve.closedReverseEroaCm2 < ranges.closedReverseEroaCm2.minimum ||
        valve.closedReverseEroaCm2 > ranges.closedReverseEroaCm2.maximum
      ) {
        issues.push(
          `valves.${valveId} continuous areas exceed research bounds`,
        );
      }
    }
    if (valve.closedReverseEroaCm2 > valve.maximumForwardEoaCm2) {
      issues.push(
        `valves.${valveId}.closedReverseEroaCm2 must not exceed maximumForwardEoaCm2`,
      );
    }
    positive(
      valve.openingGainPerMmHg,
      `valves.${valveId}.openingGainPerMmHg`,
      issues,
    );
    finite(
      valve.openingPressureOffsetMmHg,
      `valves.${valveId}.openingPressureOffsetMmHg`,
      issues,
    );
    nonnegative(
      valve.openingDriveDeadbandMmHg,
      `valves.${valveId}.openingDriveDeadbandMmHg`,
      issues,
    );
    positive(
      valve.openingDriveSmoothingMmHg,
      `valves.${valveId}.openingDriveSmoothingMmHg`,
      issues,
    );
    positive(
      valve.openingTimeConstantSec,
      `valves.${valveId}.openingTimeConstantSec`,
      issues,
    );
    if (
      isPulmonaryKineticsInput
      && valveId === "PV"
      && (
        valve.openingTimeConstantSec
          < MAIN_WIRE_PULMONARY_VALVE_OPENING_TIME_RESEARCH_RANGE_V1.minimumSec
        || valve.openingTimeConstantSec
          > MAIN_WIRE_PULMONARY_VALVE_OPENING_TIME_RESEARCH_RANGE_V1.maximumSec
      )
    ) {
      issues.push("valves.PV.openingTimeConstantSec exceeds research bounds");
    }
    positive(
      valve.closingTimeConstantSec,
      `valves.${valveId}.closingTimeConstantSec`,
      issues,
    );
  }
  const expectedIdentityHash = stableHash(
    sanitizeForStableHash(
      Object.freeze({
        researchInputId: researchInput.researchInputId,
        bracketIds: researchInput.bracketIds,
        valves: researchInput.valves,
        claim: researchInput.claim,
      }),
    ),
  );
  if (researchInput.parameterIdentityHash !== expectedIdentityHash) {
    issues.push("parameterIdentityHash does not match research input contents");
  }
  const expectedParameterSetId = isPulmonaryKineticsInput
    ? `main-wire-four-valve-pv-opening-kinetics-${expectedIdentityHash}-v1`
    : isPulmonarySeriesResistanceInput
      ? `main-wire-four-valve-pv-series-resistance-${expectedIdentityHash}-v1`
      : isContinuousAreaInput
        ? `main-wire-four-valve-continuous-areas-${expectedIdentityHash}-v1`
        : researchInputParameterSetId(
          researchInput.bracketIds,
          expectedIdentityHash,
        );
  if (researchInput.parameterSetId !== expectedParameterSetId) {
    issues.push(
      "parameterSetId does not match bracketIds and parameter identity",
    );
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
  const areaParameter =
    metadata.lesionKind === "stenosis"
      ? ("maximumForwardEoaCm2" as const)
      : ("closedReverseEroaCm2" as const);
  const areaCm2 =
    metadata.lesionKind === "stenosis"
      ? FORWARD_AREA_BRACKETS[lesionCode as keyof typeof FORWARD_AREA_BRACKETS][
          severity
        ]
      : REVERSE_AREA_BRACKETS[lesionCode as keyof typeof REVERSE_AREA_BRACKETS][
          severity
        ];
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
    clinicalAreaThresholdStatus: clinicalAreaThresholdStatus(
      lesionCode,
      severity,
    ),
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
    MainWireFourValveDiseaseBracketIdV1 | MainWireFourValveDiseaseBracketV1
  )[],
): readonly MainWireFourValveDiseaseBracketV1[] {
  const resolved = inputs
    .map((input) => {
      const bracketId = typeof input === "string" ? input : input.bracketId;
      const bracket = MAIN_WIRE_FOUR_VALVE_DISEASE_BRACKET_BY_ID_V1[bracketId];
      if (bracket === undefined) {
        throw new Error(`unknown four-valve disease bracket: ${bracketId}`);
      }
      return bracket;
    })
    .sort((left, right) => left.bracketId.localeCompare(right.bracketId));
  return Object.freeze(resolved);
}

function assertNoConflictingBrackets(
  brackets: readonly MainWireFourValveDiseaseBracketV1[],
): void {
  const ownerByDirection = new Map<
    string,
    MainWireFourValveDiseaseBracketIdV1
  >();
  for (const bracket of brackets) {
    const key = `${bracket.targetValveId}:${bracket.lesionKind}`;
    const existing = ownerByDirection.get(key);
    if (existing !== undefined) {
      throw new Error(
        `conflicting four-valve disease brackets ${existing} and ${bracket.bracketId}` +
          ` target the same ${key}`,
      );
    }
    ownerByDirection.set(key, bracket.bracketId);
  }
}

function mutableNormalBodies(): Record<ValveName, ValveParameterBody> {
  return Object.fromEntries(
    MAIN_WIRE_FOUR_VALVE_IDS_V1.map((valveId) => [
      valveId,
      { ...NORMAL_VALVE_PARAMETER_BODIES[valveId] },
    ]),
  ) as Record<ValveName, ValveParameterBody>;
}

function valveParameterSetId(
  valveId: ValveName,
  bracketIds: readonly MainWireFourValveDiseaseBracketIdV1[],
): string {
  const phenotype =
    bracketIds.length === 0
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

function severityRank(severity: MainWireFourValveDiseaseSeverityV1): 1 | 2 | 3 {
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
  return Object.freeze(
    Object.fromEntries(
      MAIN_WIRE_FOUR_VALVE_IDS_V1.map((valveId) => [valveId, build(valveId)]),
    ),
  ) as Readonly<Record<ValveName, T>>;
}

function canonicalValveAreasForBracketsV1(
  valveId: ValveName,
  brackets: readonly MainWireFourValveDiseaseBracketV1[],
): MainWireFourValveAreaInputsV1[ValveName] {
  let maximumForwardEoaCm2 =
    NORMAL_VALVE_PARAMETER_BODIES[valveId].maximumForwardEoaCm2;
  let closedReverseEroaCm2 =
    NORMAL_VALVE_PARAMETER_BODIES[valveId].closedReverseEroaCm2;
  for (const bracket of brackets) {
    if (bracket.targetValveId !== valveId) continue;
    if (bracket.areaParameter === "maximumForwardEoaCm2") {
      maximumForwardEoaCm2 = bracket.areaCm2;
    } else {
      closedReverseEroaCm2 = bracket.areaCm2;
    }
  }
  return Object.freeze({ maximumForwardEoaCm2, closedReverseEroaCm2 });
}

function continuousValveParameterSetIdV1(
  valveId: ValveName,
  value: ValveParameterBody | MainWireQuasiSteadyOrificeValveParamsV2,
): string {
  const body = Object.freeze({
    valveId: value.valveId,
    backgroundLinearResistanceMmHgSecPerMl:
      value.backgroundLinearResistanceMmHgSecPerMl,
    maximumForwardEoaCm2: value.maximumForwardEoaCm2,
    closedReverseEroaCm2: value.closedReverseEroaCm2,
    openingGainPerMmHg: value.openingGainPerMmHg,
    openingPressureOffsetMmHg: value.openingPressureOffsetMmHg,
    openingDriveDeadbandMmHg: value.openingDriveDeadbandMmHg,
    openingDriveSmoothingMmHg: value.openingDriveSmoothingMmHg,
    openingTimeConstantSec: value.openingTimeConstantSec,
    closingTimeConstantSec: value.closingTimeConstantSec,
  });
  return (
    `main-wire-${valveId.toLowerCase()}-quasi-steady-orifice-continuous-` +
    `${stableHash(sanitizeForStableHash(body))}-v2`
  );
}

function exactPlainRecordV1(
  input: unknown,
  keys: readonly string[],
  label: string,
): Record<string, unknown> {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error(`${label} must be a plain object`);
  }
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`${label} must be a plain object`);
  }
  const actual = Object.keys(input).sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error(`${label} fields must match exactly`);
  }
  return input as Record<string, unknown>;
}

function boundedFiniteV1(
  value: unknown,
  range: Readonly<{ minimum: number; maximum: number }>,
  label: string,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    Object.is(value, -0) ||
    value < range.minimum ||
    value > range.maximum
  ) {
    throw new Error(
      `${label} must be finite within [${range.minimum}, ${range.maximum}]`,
    );
  }
  return value;
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
