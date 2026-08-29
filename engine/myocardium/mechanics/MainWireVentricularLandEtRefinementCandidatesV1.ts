import type {
  LandSlsWallMaterialParamsV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  resolveMainWireVentricularLandTwitchTimingWallMaterialV1,
  type MainWireVentricularLandTwitchTimingCandidateIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandTwitchTimingCandidatesV1";
import {
  deriveLand2017DerivedParameters,
  stableHash as stableLandParameterHash,
  type Land2017RuntimeParameters,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";

export const MAIN_WIRE_VENTRICULAR_LAND_ET_REFINEMENT_CANDIDATES_V1_ID =
  "main-wire-ventricular-land-et-refinement-candidates-v1" as const;

export const MAIN_WIRE_VENTRICULAR_LAND_ET_REFINEMENT_CANDIDATE_IDS_V1 =
  Object.freeze([
    "canonical",
    "aeff-three-tref-four-thirds",
    "aeff-three-tref-three-halves",
    "aeff-four-phi-four-thirds-tref-three-halves",
    "aeff-five-phi-five-thirds-tref-three-halves",
    "rw-trpn-aeff-three-halves-tref-four-thirds",
    "rw-trpn-aeff-two-tref-four-thirds",
    "rw-trpn-aeff-five-halves-tref-four-thirds",
    "rw-trpn-aeff-eleven-fourths-tref-four-thirds",
    "rw-trpn-aeff-three-tref-four-thirds",
  ] as const);

export type MainWireVentricularLandEtRefinementCandidateIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_LAND_ET_REFINEMENT_CANDIDATE_IDS_V1)[number];

export type MainWireVentricularLandEtRefinementCandidateV1 = Readonly<{
  candidateId: MainWireVentricularLandEtRefinementCandidateIdV1;
  twitchTimingCandidateId:
    | "canonical"
    | Extract<
      MainWireVentricularLandTwitchTimingCandidateIdV1,
      "land-rw-three-quarters-trpn50-six-fifths"
    >;
  aeffScaleFromBaseline: number;
  phiScaleFromBaseline: number;
  distortionSteadyGainScaleFromBaseline: number;
  trefScaleFromBaseline: number;
  resolvedAeff: number;
  resolvedPhi: number;
  resolvedTrefPa: number;
  isometricTimingInformed: boolean;
}>;

export const MAIN_WIRE_VENTRICULAR_LAND_ET_REFINEMENT_CLAIM_V1 =
  Object.freeze({
    role:
      "fixed-isometric-informed-kinetics-by-loaded-shortening-refinement-shortlist" as const,
    isometricTimingCandidate:
      "rw-three-quarters-plus-TRPN50-six-fifths" as const,
    loadedShorteningAxis: "Land-Aeff" as const,
    fixedSteadyGainTransientSpeedAxis:
      "Aeff-and-phi-scaled-together-at-Aeff-over-phi-ratio-three" as const,
    activeForceScaleAxis: Object.freeze([4 / 3, 1.5] as const),
    aeffScaleAxis: Object.freeze([1.5, 2, 2.5, 2.75, 3, 4, 5] as const),
    phiScaleAxis: Object.freeze([1, 4 / 3, 5 / 3] as const),
    stoppedTransientSpeedScales: Object.freeze([
      "twofold-baseline-no-retained-complete-beat-at-dt0p5ms",
      "fourfold-baseline-no-retained-complete-beat-at-dt1ms",
    ] as const),
    aeffAxisChosenAfterPriorEtFactorial: true as const,
    kineticCandidateChosenBeforeCombinationFromIsometricTiming: true as const,
    calciumDriveChanged: false as const,
    passiveOrSlsChanged: false as const,
    circulationRuntimeChanged: false as const,
    aorticValveConstitutiveLawChanged: false as const,
    landStateCountChanged: false as const,
    acceptedStateOrCheckpointTopologyChanged: false as const,
    genericParameterPatchAccepted: false as const,
    continuousOptimizationApplied: false as const,
    clinicalValidationClaimed: false as const,
  });

const CANONICAL_TWITCH = "canonical" as const;
const RW_TRPN_TWITCH =
  "land-rw-three-quarters-trpn50-six-fifths" as const;

function candidate(
  candidateId: MainWireVentricularLandEtRefinementCandidateIdV1,
  twitchTimingCandidateId:
    MainWireVentricularLandEtRefinementCandidateV1["twitchTimingCandidateId"],
  aeffScaleFromBaseline: number,
  phiScaleFromBaseline: number,
  trefScaleFromBaseline: number,
): MainWireVentricularLandEtRefinementCandidateV1 {
  const baseline = resolveMainWireVentricularLandTwitchTimingWallMaterialV1(
    "canonical",
  ).landEquationParameters.values;
  return Object.freeze({
    candidateId,
    twitchTimingCandidateId,
    aeffScaleFromBaseline,
    phiScaleFromBaseline,
    distortionSteadyGainScaleFromBaseline:
      aeffScaleFromBaseline / phiScaleFromBaseline,
    trefScaleFromBaseline,
    resolvedAeff: baseline.Aeff * aeffScaleFromBaseline,
    resolvedPhi: baseline.phi * phiScaleFromBaseline,
    resolvedTrefPa: baseline.Tref * trefScaleFromBaseline,
    isometricTimingInformed: twitchTimingCandidateId !== "canonical",
  });
}

export const MAIN_WIRE_VENTRICULAR_LAND_ET_REFINEMENT_CANDIDATES_V1 =
  Object.freeze({
    canonical: candidate("canonical", CANONICAL_TWITCH, 1, 1, 1),
    "aeff-three-tref-four-thirds": candidate(
      "aeff-three-tref-four-thirds", CANONICAL_TWITCH, 3, 1, 4 / 3,
    ),
    "aeff-three-tref-three-halves": candidate(
      "aeff-three-tref-three-halves", CANONICAL_TWITCH, 3, 1, 1.5,
    ),
    "aeff-four-phi-four-thirds-tref-three-halves": candidate(
      "aeff-four-phi-four-thirds-tref-three-halves",
      CANONICAL_TWITCH,
      4,
      4 / 3,
      1.5,
    ),
    "aeff-five-phi-five-thirds-tref-three-halves": candidate(
      "aeff-five-phi-five-thirds-tref-three-halves",
      CANONICAL_TWITCH,
      5,
      5 / 3,
      1.5,
    ),
    "rw-trpn-aeff-three-halves-tref-four-thirds": candidate(
      "rw-trpn-aeff-three-halves-tref-four-thirds",
      RW_TRPN_TWITCH,
      1.5,
      1,
      4 / 3,
    ),
    "rw-trpn-aeff-two-tref-four-thirds": candidate(
      "rw-trpn-aeff-two-tref-four-thirds",
      RW_TRPN_TWITCH,
      2,
      1,
      4 / 3,
    ),
    "rw-trpn-aeff-five-halves-tref-four-thirds": candidate(
      "rw-trpn-aeff-five-halves-tref-four-thirds",
      RW_TRPN_TWITCH,
      2.5,
      1,
      4 / 3,
    ),
    "rw-trpn-aeff-eleven-fourths-tref-four-thirds": candidate(
      "rw-trpn-aeff-eleven-fourths-tref-four-thirds",
      RW_TRPN_TWITCH,
      2.75,
      1,
      4 / 3,
    ),
    "rw-trpn-aeff-three-tref-four-thirds": candidate(
      "rw-trpn-aeff-three-tref-four-thirds",
      RW_TRPN_TWITCH,
      3,
      1,
      4 / 3,
    ),
  } satisfies Readonly<Record<
    MainWireVentricularLandEtRefinementCandidateIdV1,
    MainWireVentricularLandEtRefinementCandidateV1
  >>);

export function resolveMainWireVentricularLandEtRefinementCandidateV1(
  candidateId: MainWireVentricularLandEtRefinementCandidateIdV1,
): MainWireVentricularLandEtRefinementCandidateV1 {
  const resolved =
    MAIN_WIRE_VENTRICULAR_LAND_ET_REFINEMENT_CANDIDATES_V1[candidateId];
  if (resolved === undefined) {
    throw new Error(`unsupported ventricular Land ET refinement candidate: ${String(candidateId)}`);
  }
  return resolved;
}

export function resolveMainWireVentricularLandEtRefinementWallMaterialV1(
  candidateId: MainWireVentricularLandEtRefinementCandidateIdV1,
): LandSlsWallMaterialParamsV1 {
  const candidateValue =
    resolveMainWireVentricularLandEtRefinementCandidateV1(candidateId);
  const baseMaterial =
    resolveMainWireVentricularLandTwitchTimingWallMaterialV1(
      candidateValue.twitchTimingCandidateId,
    );
  if (candidateId === "canonical") return baseMaterial;
  const baselineValues = resolveMainWireVentricularLandTwitchTimingWallMaterialV1(
    "canonical",
  ).landEquationParameters.values;
  const baseLand = baseMaterial.landEquationParameters;
  const values: Land2017RuntimeParameters = Object.freeze({
    ...baseLand.values,
    Aeff: baselineValues.Aeff * candidateValue.aeffScaleFromBaseline,
    phi: baselineValues.phi * candidateValue.phiScaleFromBaseline,
    Tref: baselineValues.Tref * candidateValue.trefScaleFromBaseline,
  });
  const hashInput: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> =
    {
      parameterSetId: `${baseLand.parameterSetId}-${candidateId}`,
      sourceId: baseLand.sourceId,
      doi: baseLand.doi,
      values,
      derived: Object.freeze(deriveLand2017DerivedParameters(values)),
      sourceParameters: Object.freeze(baseLand.sourceParameters.map((entry) => {
        const resolvedValue = entry.parameter === "Aeff"
          ? values.Aeff
          : entry.parameter === "phi"
            ? values.phi
          : entry.parameter === "Tref"
            ? values.Tref
            : null;
        return Object.freeze({
          ...entry,
          ...(resolvedValue === null
            ? {}
            : {
              location:
                `${entry.location}; fixed ET-refinement shortlist candidate`,
            }),
          original: Object.freeze({ ...entry.original }),
          runtime: Object.freeze({
            ...entry.runtime,
            ...(resolvedValue === null ? {} : { value: resolvedValue }),
          }),
        });
      })),
      derivedParameters: Object.freeze(
        baseLand.derivedParameters.map((entry) => Object.freeze({ ...entry })),
      ),
    };
  const landEquationParameters = Object.freeze({
    ...hashInput,
    parameterSetStableHash: stableLandParameterHash(hashInput),
  });
  return Object.freeze({
    ...baseMaterial,
    parameterSetId: `${baseMaterial.parameterSetId}-${candidateId}`,
    landEquationParameters,
  });
}
