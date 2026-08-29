import type {
  LandSlsWallMaterialParamsV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1,
} from "@/engine/myocardium/mechanics/normalAdultFiveWallPriorV1";
import {
  deriveLand2017DerivedParameters,
  stableHash as stableLandParameterHash,
  type Land2017RuntimeParameters,
  type Land2017SourceParameterName,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";

export const MAIN_WIRE_VENTRICULAR_LAND_TWITCH_TIMING_CANDIDATES_V1_ID =
  "main-wire-ventricular-land-twitch-timing-candidates-v1" as const;

export const MAIN_WIRE_VENTRICULAR_LAND_TWITCH_TIMING_CANDIDATE_IDS_V1 =
  Object.freeze([
    "canonical",
    "land-kws-three-quarters-trpn50-six-fifths",
    "land-rs-six-fifths-trpn50-six-fifths",
    "land-rw-three-quarters-trpn50-six-fifths",
  ] as const);

export type MainWireVentricularLandTwitchTimingCandidateIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_LAND_TWITCH_TIMING_CANDIDATE_IDS_V1)[number];

type CandidateParameter = Extract<
  Land2017SourceParameterName,
  "kws" | "rs" | "rw" | "TRPN50"
>;

export type MainWireVentricularLandTwitchTimingCandidateV1 = Readonly<{
  candidateId: MainWireVentricularLandTwitchTimingCandidateIdV1;
  scaleFromBaselineByParameter:
    Readonly<Partial<Record<CandidateParameter, number>>>;
  resolvedValueByParameter:
    Readonly<Partial<Record<CandidateParameter, number>>>;
  isometricScreenInformedCandidate: boolean;
  hemodynamicOutcomeUsedToDeriveCandidate: false;
  parameterSearchOrFitting: false;
}>;

export const MAIN_WIRE_VENTRICULAR_LAND_TWITCH_TIMING_CANDIDATES_CLAIM_V1 =
  Object.freeze({
    role:
      "fixed-isometric-informed-two-parameter-kinetic-shortlist" as const,
    earlyTimingAxis: "Land-TRPN50-six-fifths" as const,
    lateRetentionAxes: Object.freeze([
      "Land-kws-three-quarters",
      "Land-rs-six-fifths",
      "Land-rw-three-quarters",
    ] as const),
    candidateValuesChosenFromPriorOneAxisIsometricSensitivity: true as const,
    ejectionTimeOrGradientUsedToChooseCandidateValues: false as const,
    derivedLandParametersRecomputedFromSourceEquations: true as const,
    ventricularTrefChanged: false as const,
    calciumDriveChanged: false as const,
    passiveOrSlsChanged: false as const,
    circulationRuntimeChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    landStateCountChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    genericParameterPatchAccepted: false as const,
    parameterSearchOrFitting: false as const,
    clinicalValidationClaimed: false as const,
  });

const BASELINE =
  NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.ventricularLand.values;

function candidate(
  candidateId: MainWireVentricularLandTwitchTimingCandidateIdV1,
  scales: Readonly<Partial<Record<CandidateParameter, number>>>,
): MainWireVentricularLandTwitchTimingCandidateV1 {
  const resolved: Partial<Record<CandidateParameter, number>> = {};
  for (const [parameter, scale] of Object.entries(scales) as Array<
    [CandidateParameter, number]
  >) resolved[parameter] = BASELINE[parameter] * scale;
  return Object.freeze({
    candidateId,
    scaleFromBaselineByParameter: Object.freeze({ ...scales }),
    resolvedValueByParameter: Object.freeze(resolved),
    isometricScreenInformedCandidate: candidateId !== "canonical",
    hemodynamicOutcomeUsedToDeriveCandidate: false as const,
    parameterSearchOrFitting: false as const,
  });
}

export const MAIN_WIRE_VENTRICULAR_LAND_TWITCH_TIMING_CANDIDATES_V1 =
  Object.freeze({
    canonical: candidate("canonical", {}),
    "land-kws-three-quarters-trpn50-six-fifths": candidate(
      "land-kws-three-quarters-trpn50-six-fifths",
      { kws: 0.75, TRPN50: 1.2 },
    ),
    "land-rs-six-fifths-trpn50-six-fifths": candidate(
      "land-rs-six-fifths-trpn50-six-fifths",
      { rs: 1.2, TRPN50: 1.2 },
    ),
    "land-rw-three-quarters-trpn50-six-fifths": candidate(
      "land-rw-three-quarters-trpn50-six-fifths",
      { rw: 0.75, TRPN50: 1.2 },
    ),
  } satisfies Readonly<Record<
    MainWireVentricularLandTwitchTimingCandidateIdV1,
    MainWireVentricularLandTwitchTimingCandidateV1
  >>);

export function resolveMainWireVentricularLandTwitchTimingCandidateV1(
  candidateId: MainWireVentricularLandTwitchTimingCandidateIdV1,
): MainWireVentricularLandTwitchTimingCandidateV1 {
  const resolved =
    MAIN_WIRE_VENTRICULAR_LAND_TWITCH_TIMING_CANDIDATES_V1[candidateId];
  if (resolved === undefined) {
    throw new Error(
      `unsupported ventricular Land twitch timing candidate: ${String(candidateId)}`,
    );
  }
  return resolved;
}

export function resolveMainWireVentricularLandTwitchTimingWallMaterialV1(
  candidateId: MainWireVentricularLandTwitchTimingCandidateIdV1,
): LandSlsWallMaterialParamsV1 {
  const resolved = resolveMainWireVentricularLandTwitchTimingCandidateV1(
    candidateId,
  );
  const baseline =
    NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.ventricularWallMaterial;
  if (candidateId === "canonical") return baseline;
  return Object.freeze({
    ...baseline,
    parameterSetId: `${baseline.parameterSetId}-${candidateId}`,
    landEquationParameters: candidateLandParameterSet(resolved),
  });
}

function candidateLandParameterSet(
  candidateValue: MainWireVentricularLandTwitchTimingCandidateV1,
): Land2017SourceParameterSet {
  const baseline = NORMAL_ADULT_FIVE_WALL_PRIOR_V1.active.ventricularLand;
  const values: Land2017RuntimeParameters = Object.freeze({
    ...baseline.values,
    ...candidateValue.resolvedValueByParameter,
  });
  const changed = new Set(Object.keys(
    candidateValue.resolvedValueByParameter,
  ) as CandidateParameter[]);
  const hashInput: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> =
    {
      parameterSetId: `${baseline.parameterSetId}-${candidateValue.candidateId}`,
      sourceId: baseline.sourceId,
      doi: baseline.doi,
      values,
      derived: Object.freeze(deriveLand2017DerivedParameters(values)),
      sourceParameters: Object.freeze(
        baseline.sourceParameters.map((entry) => {
          const parameter = entry.parameter as CandidateParameter;
          const isChanged = changed.has(parameter);
          return Object.freeze({
            ...entry,
            ...(isChanged
              ? {
                location: `${entry.location}; fixed isometric-informed twitch-timing candidate`,
              }
              : {}),
            original: Object.freeze({ ...entry.original }),
            runtime: Object.freeze({
              ...entry.runtime,
              ...(isChanged ? { value: values[parameter] } : {}),
            }),
          });
        }),
      ),
      derivedParameters: Object.freeze(
        baseline.derivedParameters.map((entry) => Object.freeze({ ...entry })),
      ),
    };
  return Object.freeze({
    ...hashInput,
    parameterSetStableHash: stableLandParameterHash(hashInput),
  });
}
