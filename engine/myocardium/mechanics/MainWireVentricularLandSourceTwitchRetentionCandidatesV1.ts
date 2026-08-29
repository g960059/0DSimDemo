import type {
  LandSlsWallMaterialParamsV1,
} from "@/engine/myocardium/mechanics/landSlsWallMaterialV1";
import {
  resolveMainWireVentricularLandSarcomereReferenceWallMaterialV1,
  type MainWireVentricularLandSarcomereReferenceProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandSarcomereReferenceBracketV1";
import type {
  MainWireVentricularLandWholeOrganKuwProfileIdV1,
} from "@/engine/myocardium/mechanics/MainWireVentricularLandWholeOrganKuwBracketV1";
import {
  deriveLand2017DerivedParameters,
  stableHash as stableLandParameterHash,
  type Land2017RuntimeParameters,
  type Land2017SourceParameterName,
  type Land2017SourceParameterSet,
} from "@/engine/myocardium/myofilament/land2017/parameterSets";

export const MAIN_WIRE_VENTRICULAR_LAND_SOURCE_TWITCH_RETENTION_CANDIDATES_V1_ID =
  "main-wire-ventricular-land-source-twitch-retention-candidates-v1" as const;

export const MAIN_WIRE_VENTRICULAR_LAND_SOURCE_TWITCH_RETENTION_CANDIDATE_IDS_V1 =
  Object.freeze([
    "source-twitch-retention-canonical",
    "source-twitch-retention-kws-seventeen-twentieths-peak-compensated",
    "source-twitch-retention-kws-four-fifths-peak-compensated",
    "source-twitch-retention-kws-three-quarters-peak-compensated",
    "source-twitch-retention-kws-29-of-40-peak-compensated",
    "source-twitch-retention-kws-seven-tenths-peak-compensated",
    "source-twitch-retention-kws-thirteen-twentieths-peak-compensated",
    "source-twitch-retention-kws-three-fifths-peak-compensated",
    "source-twitch-retention-kws-four-fifths-ntm-four-fifths-peak-compensated",
    "source-twitch-retention-kws-three-quarters-ntm-four-fifths-peak-compensated",
    "source-twitch-retention-kws-thirteen-twentieths-ntm-four-fifths-peak-compensated",
    "source-twitch-retention-kws-three-fifths-ntm-four-fifths-peak-compensated",
    "source-twitch-retention-kws-twenty-three-fortieths-ntm-four-fifths-peak-compensated",
    "source-twitch-retention-kws-eleven-twentieths-ntm-four-fifths-peak-compensated",
    "source-twitch-retention-kws-one-half-ntm-four-fifths-peak-compensated",
    "source-twitch-retention-kws-nine-twentieths-ntm-four-fifths-peak-compensated",
    "source-twitch-retention-kws-two-fifths-ntm-four-fifths-peak-compensated",
    "source-twitch-retention-rw-three-quarters-peak-compensated",
    "source-twitch-retention-ntm-four-fifths-peak-compensated",
    "source-twitch-retention-ntm-three-fifths-peak-compensated",
  ] as const);

export type MainWireVentricularLandSourceTwitchRetentionCandidateIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_LAND_SOURCE_TWITCH_RETENTION_CANDIDATE_IDS_V1)[number];

export const MAIN_WIRE_VENTRICULAR_LAND_TREF_FORCE_LOAD_PROFILE_IDS_V1 =
  Object.freeze([
    "tref-force-load-low",
    "tref-force-load-baseline",
    "tref-force-load-high",
  ] as const);

export type MainWireVentricularLandTrefForceLoadProfileIdV1 =
  (typeof MAIN_WIRE_VENTRICULAR_LAND_TREF_FORCE_LOAD_PROFILE_IDS_V1)[number];

export type MainWireVentricularLandTrefForceLoadProfileV1 = Readonly<{
  profileId: MainWireVentricularLandTrefForceLoadProfileIdV1;
  trefScaleFromRetainedCandidate: 0.9 | 1 | 1.1;
  parameterSearchOrFitting: false;
  hemodynamicOutcomeUsedToDeriveProfile: false;
}>;

export const MAIN_WIRE_VENTRICULAR_LAND_TREF_FORCE_LOAD_PROFILES_V1 =
  Object.freeze({
    "tref-force-load-low": trefForceLoadProfile(
      "tref-force-load-low",
      0.9,
    ),
    "tref-force-load-baseline": trefForceLoadProfile(
      "tref-force-load-baseline",
      1,
    ),
    "tref-force-load-high": trefForceLoadProfile(
      "tref-force-load-high",
      1.1,
    ),
  } satisfies Readonly<Record<
    MainWireVentricularLandTrefForceLoadProfileIdV1,
    MainWireVentricularLandTrefForceLoadProfileV1
  >>);

export const MAIN_WIRE_VENTRICULAR_LAND_TREF_FORCE_LOAD_CLAIM_V1 =
  Object.freeze({
    role: "fixed-log-symmetric-local-force-scale-load-response" as const,
    trefScaleAxis: Object.freeze([0.9, 1, 1.1] as const),
    completePhysiologicalInotropyModelClaimed: false as const,
    calciumKineticsChanged: false as const,
    landKineticsChanged: false as const,
    passiveOrSlsChanged: false as const,
    stateCountChanged: false as const,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfiles: false as const,
    clinicalValidationClaimed: false as const,
  });

type CandidateParameter = Extract<
  Land2017SourceParameterName,
  "kws" | "rw" | "nTm"
>;

export type MainWireVentricularLandSourceTwitchRetentionCandidateV1 =
  Readonly<{
    candidateId:
      MainWireVentricularLandSourceTwitchRetentionCandidateIdV1;
    changedKineticParameters: readonly CandidateParameter[];
    kineticParameterScaleFromSourceByParameter:
      Readonly<Partial<Record<CandidateParameter, number>>>;
    ventricularTrefScaleFromSource: number;
    sourceOnlyIsometricScreen: Readonly<{
      calciumProfileId:
        "main-wire-ventricular-calcium-land-coppini-source-trace-v1";
      kuwProfileId: "land-whole-organ-kuw-nu7";
      dtSec: 0.001;
      fixedLandStretch: 1;
      uncompensatedPeakStressKPa: number;
      compensatedTargetPeakStressKPa: 51;
      fivePercentRiseToPeakMs: number;
      relaxationTime50Ms: number;
      relaxationTime95Ms: number;
      localPeakCountAboveFivePercent: 1;
    }>;
    selectionStage:
      | "source-isometric-only"
      | "bounded-ET-completion-after-load-envelope"
      | "bounded-ET-relaxation-balance-after-load-envelope";
    loadedOrHemodynamicOutcomeUsedToDeriveCandidate: boolean;
  }>;

function candidate(
  candidateId: MainWireVentricularLandSourceTwitchRetentionCandidateIdV1,
  kineticParameterScaleFromSourceByParameter:
    Readonly<Partial<Record<CandidateParameter, number>>>,
  ventricularTrefScaleFromSource: number,
  screen: Omit<
    MainWireVentricularLandSourceTwitchRetentionCandidateV1[
      "sourceOnlyIsometricScreen"
    ],
    | "calciumProfileId"
    | "kuwProfileId"
    | "dtSec"
    | "fixedLandStretch"
    | "compensatedTargetPeakStressKPa"
    | "localPeakCountAboveFivePercent"
  >,
  selectionStage:
    MainWireVentricularLandSourceTwitchRetentionCandidateV1["selectionStage"] =
      "source-isometric-only",
): MainWireVentricularLandSourceTwitchRetentionCandidateV1 {
  const changedKineticParameters = Object.freeze(
    Object.keys(kineticParameterScaleFromSourceByParameter)
      .sort() as CandidateParameter[],
  );
  return Object.freeze({
    candidateId,
    changedKineticParameters,
    kineticParameterScaleFromSourceByParameter: Object.freeze({
      ...kineticParameterScaleFromSourceByParameter,
    }),
    ventricularTrefScaleFromSource,
    sourceOnlyIsometricScreen: Object.freeze({
      calciumProfileId:
        "main-wire-ventricular-calcium-land-coppini-source-trace-v1" as const,
      kuwProfileId: "land-whole-organ-kuw-nu7" as const,
      dtSec: 0.001 as const,
      fixedLandStretch: 1 as const,
      ...screen,
      compensatedTargetPeakStressKPa: 51 as const,
      localPeakCountAboveFivePercent: 1 as const,
    }),
    selectionStage,
    loadedOrHemodynamicOutcomeUsedToDeriveCandidate:
      selectionStage !== "source-isometric-only",
  });
}

const CANDIDATES = Object.freeze({
  "source-twitch-retention-canonical": candidate(
    "source-twitch-retention-canonical",
    {},
    1,
    {
      uncompensatedPeakStressKPa: 51.16899881649424,
      fivePercentRiseToPeakMs: 143.14170968149148,
      relaxationTime50Ms: 121.58485128100244,
      relaxationTime95Ms: 282.6473021303167,
    },
  ),
  "source-twitch-retention-kws-seventeen-twentieths-peak-compensated":
    candidate(
      "source-twitch-retention-kws-seventeen-twentieths-peak-compensated",
      { kws: 0.85 },
      1.0328014105430925,
      {
        uncompensatedPeakStressKPa: 49.38025788828266,
        fivePercentRiseToPeakMs: 148.91220727024472,
        relaxationTime50Ms: 124.32253350404967,
        relaxationTime95Ms: 303.191474123924,
      },
    ),
  "source-twitch-retention-kws-four-fifths-peak-compensated": candidate(
    "source-twitch-retention-kws-four-fifths-peak-compensated",
    { kws: 0.8 },
    1.048187435472466,
    {
      uncompensatedPeakStressKPa: 48.65542008430197,
      fivePercentRiseToPeakMs: 151.4574708317783,
      relaxationTime50Ms: 125.28647521092564,
      relaxationTime95Ms: 311.8741115036582,
    },
  ),
  "source-twitch-retention-kws-three-quarters-peak-compensated": candidate(
    "source-twitch-retention-kws-three-quarters-peak-compensated",
    { kws: 0.75 },
    1.0658934446435833,
    {
      uncompensatedPeakStressKPa: 47.847184215541866,
      fivePercentRiseToPeakMs: 153.96298022194898,
      relaxationTime50Ms: 126.7287789556156,
      relaxationTime95Ms: 322.21749952516075,
    },
    "bounded-ET-completion-after-load-envelope",
  ),
  "source-twitch-retention-kws-29-of-40-peak-compensated": candidate(
    "source-twitch-retention-kws-29-of-40-peak-compensated",
    { kws: 0.725 },
    1.0757353348766663,
    {
      uncompensatedPeakStressKPa: 47.40943087627328,
      fivePercentRiseToPeakMs: 154.71035216192038,
      relaxationTime50Ms: 128.15148322836697,
      relaxationTime95Ms: 328.6168055230086,
    },
    "bounded-ET-completion-after-load-envelope",
  ),
  "source-twitch-retention-kws-seven-tenths-peak-compensated": candidate(
    "source-twitch-retention-kws-seven-tenths-peak-compensated",
    { kws: 0.7 },
    1.0863312487205348,
    {
      uncompensatedPeakStressKPa: 46.947006320647645,
      fivePercentRiseToPeakMs: 156.44480988279673,
      relaxationTime50Ms: 128.7270379997937,
      relaxationTime95Ms: 334.5639443270616,
    },
    "bounded-ET-completion-after-load-envelope",
  ),
  "source-twitch-retention-kws-thirteen-twentieths-peak-compensated":
    candidate(
      "source-twitch-retention-kws-thirteen-twentieths-peak-compensated",
      { kws: 0.65 },
      1.1101420623917537,
      {
        uncompensatedPeakStressKPa: 45.940066346213996,
        fivePercentRiseToPeakMs: 158.876559528435,
        relaxationTime50Ms: 131.4009974993642,
        relaxationTime95Ms: 349.32336718990643,
      },
      "bounded-ET-completion-after-load-envelope",
    ),
  "source-twitch-retention-kws-three-fifths-peak-compensated": candidate(
    "source-twitch-retention-kws-three-fifths-peak-compensated",
    { kws: 0.6 },
    1.1382847814047286,
    {
      uncompensatedPeakStressKPa: 44.80425358675374,
      fivePercentRiseToPeakMs: 161.2662902420708,
      relaxationTime50Ms: 134.90659526154,
      relaxationTime95Ms: 367.0080783508858,
    },
    "bounded-ET-completion-after-load-envelope",
  ),
  "source-twitch-retention-kws-four-fifths-ntm-four-fifths-peak-compensated":
    candidate(
      "source-twitch-retention-kws-four-fifths-ntm-four-fifths-peak-compensated",
      { kws: 0.8, nTm: 0.8 },
      1.0181059731090705,
      {
        uncompensatedPeakStressKPa: 50.09301717802252,
        fivePercentRiseToPeakMs: 158.39304897497485,
        relaxationTime50Ms: 137.25891221167134,
        relaxationTime95Ms: 325.4319065198614,
      },
      "bounded-ET-completion-after-load-envelope",
    ),
  "source-twitch-retention-kws-three-quarters-ntm-four-fifths-peak-compensated":
    candidate(
      "source-twitch-retention-kws-three-quarters-ntm-four-fifths-peak-compensated",
      { kws: 0.75, nTm: 0.8 },
      1.0338618011904752,
      {
        uncompensatedPeakStressKPa: 49.32961053525174,
        fivePercentRiseToPeakMs: 160.88868937509224,
        relaxationTime50Ms: 138.88934949857963,
        relaxationTime95Ms: 335.592756401537,
      },
      "bounded-ET-completion-after-load-envelope",
    ),
  "source-twitch-retention-kws-thirteen-twentieths-ntm-four-fifths-peak-compensated":
    candidate(
      "source-twitch-retention-kws-thirteen-twentieths-ntm-four-fifths-peak-compensated",
      { kws: 0.65, nTm: 0.8 },
      1.0733053063277869,
      {
        uncompensatedPeakStressKPa: 47.516768713733185,
        fivePercentRiseToPeakMs: 166.7736920961073,
        relaxationTime50Ms: 143.00830665601825,
        relaxationTime95Ms: 361.3418949968062,
      },
      "bounded-ET-completion-after-load-envelope",
    ),
  "source-twitch-retention-kws-three-fifths-ntm-four-fifths-peak-compensated":
    candidate(
      "source-twitch-retention-kws-three-fifths-ntm-four-fifths-peak-compensated",
      { kws: 0.6, nTm: 0.8 },
      1.0984637078666377,
      {
        uncompensatedPeakStressKPa: 46.428479734709455,
        fivePercentRiseToPeakMs: 170.14282933082833,
        relaxationTime50Ms: 145.78127755639733,
        relaxationTime95Ms: 377.848946037451,
      },
      "bounded-ET-completion-after-load-envelope",
    ),
  "source-twitch-retention-kws-twenty-three-fortieths-ntm-four-fifths-peak-compensated":
    candidate(
      "source-twitch-retention-kws-twenty-three-fortieths-ntm-four-fifths-peak-compensated",
      { kws: 0.575, nTm: 0.8 },
      1.1127721582894403,
      {
        uncompensatedPeakStressKPa: 45.83148456769218,
        fivePercentRiseToPeakMs: 172.80623420210497,
        relaxationTime50Ms: 146.54625304457883,
        relaxationTime95Ms: 386.3768990874433,
      },
      "bounded-ET-completion-after-load-envelope",
    ),
  "source-twitch-retention-kws-eleven-twentieths-ntm-four-fifths-peak-compensated":
    candidate(
      "source-twitch-retention-kws-eleven-twentieths-ntm-four-fifths-peak-compensated",
      { kws: 0.55, nTm: 0.8 },
      1.1284686835504154,
      {
        uncompensatedPeakStressKPa: 45.193987873498244,
        fivePercentRiseToPeakMs: 174.45376150382974,
        relaxationTime50Ms: 148.61034342120008,
        relaxationTime95Ms: 396.8656840240429,
      },
      "bounded-ET-completion-after-load-envelope",
    ),
  "source-twitch-retention-kws-one-half-ntm-four-fifths-peak-compensated":
    candidate(
      "source-twitch-retention-kws-one-half-ntm-four-fifths-peak-compensated",
      { kws: 0.5, nTm: 0.8 },
      1.1649410305064938,
      {
        uncompensatedPeakStressKPa: 43.77904002387673,
        fivePercentRiseToPeakMs: 177.68341539753786,
        relaxationTime50Ms: 153.7931357383438,
        relaxationTime95Ms: 421.0664715876057,
      },
      "bounded-ET-completion-after-load-envelope",
    ),
  "source-twitch-retention-kws-nine-twentieths-ntm-four-fifths-peak-compensated":
    candidate(
      "source-twitch-retention-kws-nine-twentieths-ntm-four-fifths-peak-compensated",
      { kws: 0.45, nTm: 0.8 },
      1.2098757701059648,
      {
        uncompensatedPeakStressKPa: 42.153088160062296,
        fivePercentRiseToPeakMs: 181.8111782820641,
        relaxationTime50Ms: 159.6871973153216,
        relaxationTime95Ms: 449.07015860249663,
      },
      "bounded-ET-relaxation-balance-after-load-envelope",
    ),
  "source-twitch-retention-kws-two-fifths-ntm-four-fifths-peak-compensated":
    candidate(
      "source-twitch-retention-kws-two-fifths-ntm-four-fifths-peak-compensated",
      { kws: 0.4, nTm: 0.8 },
      1.2662656854178413,
      {
        uncompensatedPeakStressKPa: 40.27590780300665,
        fivePercentRiseToPeakMs: 186.8070928752386,
        relaxationTime50Ms: 166.7993001176425,
        relaxationTime95Ms: 481.2622692849078,
      },
      "bounded-ET-relaxation-balance-after-load-envelope",
    ),
  "source-twitch-retention-rw-three-quarters-peak-compensated": candidate(
    "source-twitch-retention-rw-three-quarters-peak-compensated",
    { rw: 0.75 },
    1.0650661911989494,
    {
      uncompensatedPeakStressKPa: 47.88434786629467,
      fivePercentRiseToPeakMs: 153.40705711131474,
      relaxationTime50Ms: 126.65216151487127,
      relaxationTime95Ms: 321.9447510198852,
    },
  ),
  "source-twitch-retention-ntm-four-fifths-peak-compensated": candidate(
    "source-twitch-retention-ntm-four-fifths-peak-compensated",
    { nTm: 0.8 },
    0.9724576602856737,
    {
      uncompensatedPeakStressKPa: 52.444442655753264,
      fivePercentRiseToPeakMs: 150.11110045456414,
      relaxationTime50Ms: 132.9872040288993,
      relaxationTime95Ms: 297.14969329773805,
    },
  ),
  "source-twitch-retention-ntm-three-fifths-peak-compensated": candidate(
    "source-twitch-retention-ntm-three-fifths-peak-compensated",
    { nTm: 0.6 },
    0.9486389936020555,
    {
      uncompensatedPeakStressKPa: 53.761230925527386,
      fivePercentRiseToPeakMs: 159.575142938267,
      relaxationTime50Ms: 151.118259817574,
      relaxationTime95Ms: 340.7837012239199,
    },
  ),
} satisfies Readonly<Record<
  MainWireVentricularLandSourceTwitchRetentionCandidateIdV1,
  MainWireVentricularLandSourceTwitchRetentionCandidateV1
>>);

export const MAIN_WIRE_VENTRICULAR_LAND_SOURCE_TWITCH_RETENTION_CANDIDATES_CLAIM_V1 =
  Object.freeze({
    role: "source-isometric-informed-late-tension-retention-candidates" as const,
    primaryNumericCoppiniCalciumTraceUsedForScreen: true as const,
    initialCandidateKineticScalesFixedBeforeClosedLoopEvaluation: true as const,
    ETCompletionCandidateScalesInformedByPriorLoadEnvelope: true as const,
    ETCompletionCandidateRole:
      "bounded-Pareto-calibration-points-not-source-identities" as const,
    trefCompensationDefinition:
      "51-kPa-target-divided-by-uncompensated-lambda-one-peak" as const,
    exactTrefStressLinearityUsed: true as const,
    kwsScalingWithDerivedRateRecomputationPreservesRwRsEquilibriumCoordinates:
      true as const,
    kwsScalingPreservesZeroDistortionWeakAggregateExitRate:
      true as const,
    kwsScalingChangesTransitionTimescaleNotStateCount: true as const,
    nTmScalingRecomputesThinFilamentKbFromSourceEquation: true as const,
    multiParameterCandidatesUseExistingPrimitiveAxesOnly: true as const,
    sourceParametersExceptNamedKineticParametersAndTrefChanged: false as const,
    passiveOrSlsChanged: false as const,
    stateCountChanged: false as const,
    loadedOrHemodynamicOutcomeUsedToDeriveAllCandidates: false as const,
    numericOptimizerApplied: false as const,
    clinicalValidationClaimed: false as const,
    canonicalAdoptionEstablished: false as const,
  });

export function resolveMainWireVentricularLandSourceTwitchRetentionCandidateV1(
  candidateId:
    MainWireVentricularLandSourceTwitchRetentionCandidateIdV1,
): MainWireVentricularLandSourceTwitchRetentionCandidateV1 {
  const resolved = CANDIDATES[candidateId];
  if (resolved === undefined) {
    throw new Error(
      `unsupported source twitch retention candidate: ${String(candidateId)}`,
    );
  }
  return resolved;
}

export function resolveMainWireVentricularLandTrefForceLoadProfileV1(
  profileId: MainWireVentricularLandTrefForceLoadProfileIdV1,
): MainWireVentricularLandTrefForceLoadProfileV1 {
  const resolved = MAIN_WIRE_VENTRICULAR_LAND_TREF_FORCE_LOAD_PROFILES_V1[
    profileId
  ];
  if (resolved === undefined) {
    throw new Error(`unsupported Tref force-load profile: ${String(profileId)}`);
  }
  return resolved;
}

export function resolveMainWireVentricularLandSourceTwitchRetentionWallMaterialV1(
  candidateId:
    MainWireVentricularLandSourceTwitchRetentionCandidateIdV1,
  sarcomereReferenceProfileId:
    MainWireVentricularLandSarcomereReferenceProfileIdV1,
  kuwProfileId: MainWireVentricularLandWholeOrganKuwProfileIdV1,
): LandSlsWallMaterialParamsV1 {
  const candidateValue =
    resolveMainWireVentricularLandSourceTwitchRetentionCandidateV1(
      candidateId,
    );
  const base = resolveMainWireVentricularLandSarcomereReferenceWallMaterialV1(
    sarcomereReferenceProfileId,
    kuwProfileId,
  );
  if (candidateValue.changedKineticParameters.length === 0) return base;
  const source = base.landEquationParameters;
  const changedParameters = new Set(candidateValue.changedKineticParameters);
  const scaledKineticValues: Partial<
    Record<CandidateParameter, number>
  > = {};
  for (const changedParameter of candidateValue.changedKineticParameters) {
    const scale = candidateValue
      .kineticParameterScaleFromSourceByParameter[changedParameter];
    if (scale === undefined) {
      throw new Error(`missing source scale for ${changedParameter}`);
    }
    scaledKineticValues[changedParameter] =
      source.values[changedParameter] * scale;
  }
  const values: Land2017RuntimeParameters = Object.freeze({
    ...source.values,
    ...scaledKineticValues,
    Tref: source.values.Tref * candidateValue.ventricularTrefScaleFromSource,
  });
  const hashInput: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> = {
    parameterSetId: `${source.parameterSetId}-${candidateId}`,
    sourceId: source.sourceId,
    doi: source.doi,
    values,
    derived: Object.freeze(deriveLand2017DerivedParameters(values)),
    sourceParameters: Object.freeze(source.sourceParameters.map((entry) => {
      const changedKinetic = changedParameters.has(
        entry.parameter as CandidateParameter,
      );
      const changed = changedKinetic || entry.parameter === "Tref";
      const location = entry.parameter === "Tref"
        ? "primary-source-trace isometric peak compensation"
        : changedKinetic
            && candidateValue.loadedOrHemodynamicOutcomeUsedToDeriveCandidate
          ? "bounded ET-completion point informed by prior load envelope; no numeric optimizer"
          : "primary-source-trace isometric retention screen; no hemodynamic derivation";
      return Object.freeze({
        ...entry,
        ...(changed
          ? {
            location,
          }
          : {}),
        original: Object.freeze({ ...entry.original }),
        runtime: Object.freeze({
          ...entry.runtime,
          ...(changed ? { value: values[entry.parameter] } : {}),
        }),
      });
    })),
    derivedParameters: Object.freeze(
      source.derivedParameters.map((entry) => Object.freeze({ ...entry })),
    ),
  };
  const parameterSet: Land2017SourceParameterSet = Object.freeze({
    ...hashInput,
    parameterSetStableHash: stableLandParameterHash(hashInput),
  });
  return Object.freeze({
    ...base,
    parameterSetId: `${base.parameterSetId}-${candidateId}`,
    landEquationParameters: parameterSet,
  });
}

export function resolveMainWireVentricularLandSourceTwitchRetentionTrefForceLoadWallMaterialV1(
  candidateId:
    MainWireVentricularLandSourceTwitchRetentionCandidateIdV1,
  trefForceLoadProfileId: MainWireVentricularLandTrefForceLoadProfileIdV1,
  sarcomereReferenceProfileId:
    MainWireVentricularLandSarcomereReferenceProfileIdV1,
  kuwProfileId: MainWireVentricularLandWholeOrganKuwProfileIdV1,
): LandSlsWallMaterialParamsV1 {
  const profileValue = resolveMainWireVentricularLandTrefForceLoadProfileV1(
    trefForceLoadProfileId,
  );
  const base = resolveMainWireVentricularLandSourceTwitchRetentionWallMaterialV1(
    candidateId,
    sarcomereReferenceProfileId,
    kuwProfileId,
  );
  if (profileValue.trefScaleFromRetainedCandidate === 1) return base;
  const source = base.landEquationParameters;
  const values: Land2017RuntimeParameters = Object.freeze({
    ...source.values,
    Tref: source.values.Tref * profileValue.trefScaleFromRetainedCandidate,
  });
  const hashInput: Omit<Land2017SourceParameterSet, "parameterSetStableHash"> = {
    parameterSetId: `${source.parameterSetId}-${trefForceLoadProfileId}`,
    sourceId: source.sourceId,
    doi: source.doi,
    values,
    derived: Object.freeze(deriveLand2017DerivedParameters(values)),
    sourceParameters: Object.freeze(source.sourceParameters.map((entry) =>
      Object.freeze({
        ...entry,
        ...(entry.parameter === "Tref"
          ? {
            location:
              `${entry.location}; fixed Tref force-load response scale ${profileValue.trefScaleFromRetainedCandidate}`,
          }
          : {}),
        original: Object.freeze({ ...entry.original }),
        runtime: Object.freeze({
          ...entry.runtime,
          ...(entry.parameter === "Tref" ? { value: values.Tref } : {}),
        }),
      }))),
    derivedParameters: Object.freeze(
      source.derivedParameters.map((entry) => Object.freeze({ ...entry })),
    ),
  };
  const parameterSet: Land2017SourceParameterSet = Object.freeze({
    ...hashInput,
    parameterSetStableHash: stableLandParameterHash(hashInput),
  });
  return Object.freeze({
    ...base,
    parameterSetId: `${base.parameterSetId}-${trefForceLoadProfileId}`,
    landEquationParameters: parameterSet,
  });
}

function trefForceLoadProfile(
  profileId: MainWireVentricularLandTrefForceLoadProfileIdV1,
  trefScaleFromRetainedCandidate: 0.9 | 1 | 1.1,
): MainWireVentricularLandTrefForceLoadProfileV1 {
  return Object.freeze({
    profileId,
    trefScaleFromRetainedCandidate,
    parameterSearchOrFitting: false as const,
    hemodynamicOutcomeUsedToDeriveProfile: false as const,
  });
}
