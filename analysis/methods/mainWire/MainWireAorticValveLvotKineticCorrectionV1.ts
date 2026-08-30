import {
  MAIN_WIRE_VALVE_BLOOD_DENSITY_KG_PER_M3_V2,
  MAIN_WIRE_VALVE_PA_PER_MMHG_V2,
  idealBernoulliLossFromEffectiveOrificeAreaV2,
} from "@/engine/valves/MainWireQuasiSteadyOrificeValveV2";

export const MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_V1_ID =
  "main-wire-aortic-valve-lvot-kinetic-correction-v1" as const;

export const MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROFILE_IDS_V1 =
  Object.freeze(["lvot-d2p2cm", "lvot-d2p3cm", "lvot-d2p5cm"] as const);

export type MainWireAorticValveLvotKineticCorrectionProfileIdV1 =
  (typeof MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROFILE_IDS_V1)[number];

export const MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROVENANCE_V1 =
  Object.freeze({
    provenanceId:
      "main-wire-aortic-valve-lvot-kinetic-correction-provenance-v1" as const,
    literature: Object.freeze({
      healthyAdultLvotContext: Object.freeze({
        sourceId: "wase-normal-values-jeac220" as const,
        doi: "10.1093/ehjci/jeac220" as const,
        evidenceRole:
          "healthy-adult-LVOT-context-not-source-of-a-population-interval-claim-for-this-bracket" as const,
      }),
      proximalVelocityCorrectionMethod: Object.freeze({
        sourceId: "ase-eacvi-valvular-stenosis-2017" as const,
        doi: "10.1016/j.echo.2017.02.009" as const,
        evidenceRole:
          "proximal-velocity-term-in-modified-Bernoulli-gradient-method-context" as const,
      }),
    }),
    bracket: Object.freeze({
      construction:
        "prespecified-three-point-research-subset-constrained-by-LVOT-area-strictly-exceeding-configured-AV-maximum-EOA" as const,
      lvotDiameterSubsetCm: Object.freeze([2.2, 2.3, 2.5] as const),
      configuredAorticValveMaximumEoaCm2: 3.5 as const,
      everyLvotAreaStrictlyExceedsConfiguredAorticValveMaximumEoa:
        true as const,
      populationIntervalClaimed: false as const,
      subjectMeasuredGeometryClaimed: false as const,
      parameterSearchOrFitting: false as const,
    }),
  });

export type MainWireAorticValveLvotKineticCorrectionProfileV1 = Readonly<{
  profileId: MainWireAorticValveLvotKineticCorrectionProfileIdV1;
  provenance: "prespecified-fixed-lvot-diameter-research-bracket-not-subject-measured";
  lvotDiameterCm: number;
  lvotAreaCm2: number;
  areaDerivation: "pi-times-diameter-over-two-squared";
  parameterSearchOrFitting: false;
}>;

function fixedProfile(
  profileId: MainWireAorticValveLvotKineticCorrectionProfileIdV1,
  lvotDiameterCm: 2.2 | 2.3 | 2.5,
): MainWireAorticValveLvotKineticCorrectionProfileV1 {
  const lvotAreaCm2 = Math.PI * (lvotDiameterCm / 2) ** 2;
  if (
    !(
      lvotAreaCm2 >
      MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROVENANCE_V1.bracket
        .configuredAorticValveMaximumEoaCm2
    )
  ) {
    throw new Error(
      "fixed LVOT research area must exceed configured AV maximum EOA",
    );
  }
  return Object.freeze({
    profileId,
    provenance:
      "prespecified-fixed-lvot-diameter-research-bracket-not-subject-measured" as const,
    lvotDiameterCm,
    lvotAreaCm2,
    areaDerivation: "pi-times-diameter-over-two-squared" as const,
    parameterSearchOrFitting: false as const,
  });
}

export const MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROFILES_V1 =
  Object.freeze({
    "lvot-d2p2cm": fixedProfile("lvot-d2p2cm", 2.2),
    "lvot-d2p3cm": fixedProfile("lvot-d2p3cm", 2.3),
    "lvot-d2p5cm": fixedProfile("lvot-d2p5cm", 2.5),
  } satisfies Readonly<
    Record<
      MainWireAorticValveLvotKineticCorrectionProfileIdV1,
      MainWireAorticValveLvotKineticCorrectionProfileV1
    >
  >);

/** Exact kinetic-pressure coefficient multiplying velocity squared. */
export const MAIN_WIRE_AORTIC_VALVE_EXACT_DENSITY_VELOCITY_SQUARED_COEFFICIENT_MMHG_SEC2_PER_M2_V1 =
  MAIN_WIRE_VALVE_BLOOD_DENSITY_KG_PER_M3_V2 /
  (2 * MAIN_WIRE_VALVE_PA_PER_MMHG_V2);

export const MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_CLAIM_V1 =
  Object.freeze({
    role: "analysis-only-algebraic-lvot-kinetic-correction" as const,
    source: "caller-supplied-forward-flow-accepted-sample-episode" as const,
    geometry:
      "one-of-three-prespecified-fixed-lvot-diameter-research-brackets" as const,
    literatureAndBracketProvenanceFrozenInAnalysisOutput: true as const,
    fixedDiameterValuesArePrespecifiedResearchSubset: true as const,
    fixedDiameterValuesArePopulationInterval: false as const,
    configuredAvMaximumEoaCm2:
      MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROVENANCE_V1.bracket
        .configuredAorticValveMaximumEoaCm2,
    fixedLvotAreasStrictlyExceedConfiguredAvMaximumEoa: true as const,
    geometryIsSubjectMeasured: false as const,
    arbitraryNumericLvotGeometryOptionExposed: false as const,
    velocityLaw: "flow-divided-by-one-hundred-times-area-cm2" as const,
    simplifiedGradientLaw: "four-times-jet-velocity-squared" as const,
    lvotCorrectedGradientLaw:
      "four-times-jet-minus-lvot-velocity-squared" as const,
    exactDensityGradientLaw:
      "shared-eoa-coefficient-helper-times-flow-squared" as const,
    pointwiseVelocityPairing: "same-accepted-sample" as const,
    maximumCorrectedGradientSemantics:
      "maximum-pointwise-lvot-corrected-gradient-with-all-fields-read-at-that-same-sample" as const,
    maximumJetVelocityReadoutSemantics:
      "all-fields-read-at-the-sample-with-maximum-pointwise-jet-velocity" as const,
    maximumCorrectedGradientAndMaximumJetVelocityMayOccurAtDifferentSamples:
      true as const,
    meanSemantics:
      "caller-supplied-positive-zero-order-hold-weights-over-the-identical-forward-flow-episode" as const,
    zeroOrReverseFlowAccepted: false as const,
    lvotAreaMustStrictlyExceedActiveEoa: true as const,
    areaOrGradientClampingApplied: false as const,
    exactModelStateOrCheckpointChanged: false as const,
    parameterSearchOrFitting: false as const,
    clinicalNormalityGateApplied: false as const,
    hardPhysiologyGateApplied: false as const,
    correctedMeanRole: "research-readout-only" as const,
    clinicalValidationClaimed: false as const,
  });

export type MainWireAorticValveLvotKineticCorrectionSampleInputV1 = Readonly<{
  acceptedTimeSec: number;
  /** Positive zero-order-hold integration weight assigned to this endpoint. */
  episodeIntegrationWeightSec: number;
  forwardFlowMlPerSec: number;
  activeEoaCm2: number;
}>;

export type MainWireAorticValveLvotKineticCorrectionInputV1 = Readonly<{
  profileId: MainWireAorticValveLvotKineticCorrectionProfileIdV1;
  samples: readonly MainWireAorticValveLvotKineticCorrectionSampleInputV1[];
}>;

export type MainWireAorticValveLvotKineticCorrectionPointV1 = Readonly<{
  sourceSampleIndex: number;
  acceptedTimeSec: number;
  episodeIntegrationWeightSec: number;
  forwardFlowMlPerSec: number;
  activeEoaCm2: number;
  lvotAreaCm2: number;
  jetVelocityMPerSec: number;
  lvotVelocityMPerSec: number;
  simplifiedBernoulliGradientMmHg: number;
  simplifiedLvotKineticGradientMmHg: number;
  lvotCorrectedSimplifiedBernoulliGradientMmHg: number;
  exactDensityJetCoefficientMmHgSec2PerMl2: number;
  exactDensityLvotCoefficientMmHgSec2PerMl2: number;
  exactDensityCorrectedCoefficientMmHgSec2PerMl2: number;
  exactDensityJetGradientMmHg: number;
  exactDensityLvotKineticGradientMmHg: number;
  exactDensityLvotCorrectedGradientMmHg: number;
  lvotCorrectedSimplifiedGradientDerivativeMmHgPerCm2: number;
  exactDensityLvotCorrectedGradientDerivativeMmHgPerCm2: number;
  retainedCorrectedFractionOfSimplified01: number;
  removedLvotKineticFractionOfSimplified01: number;
  exactDensityDimensionalIdentityResidualMmHg: number;
  exactDensityDimensionalIdentityWithinTolerance: true;
  correctedGradientBoundsInvariantPassed: true;
  correctedGradientStrictlyIncreasesWithLvotAreaInvariantPassed: true;
}>;

export type MainWireAorticValveLvotKineticCorrectionTimeWeightedMeanV1 =
  Readonly<{
    forwardFlowMlPerSec: number;
    activeEoaCm2: number;
    jetVelocityMPerSec: number;
    lvotVelocityMPerSec: number;
    simplifiedBernoulliGradientMmHg: number;
    simplifiedLvotKineticGradientMmHg: number;
    lvotCorrectedSimplifiedBernoulliGradientMmHg: number;
    exactDensityJetGradientMmHg: number;
    exactDensityLvotKineticGradientMmHg: number;
    exactDensityLvotCorrectedGradientMmHg: number;
    retainedCorrectedFractionOfSimplified01: number;
    removedLvotKineticFractionOfSimplified01: number;
  }>;

export type MainWireAorticValveLvotKineticCorrectionV1 = Readonly<{
  methodId: typeof MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_V1_ID;
  provenance: typeof MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROVENANCE_V1;
  profile: MainWireAorticValveLvotKineticCorrectionProfileV1;
  episode: Readonly<{
    sampleCount: number;
    acceptedStartTimeSec: number;
    acceptedEndTimeSec: number;
    episodeIntegrationDurationSec: number;
  }>;
  exactDensityVelocitySquaredCoefficientMmHgSec2PerM2: typeof MAIN_WIRE_AORTIC_VALVE_EXACT_DENSITY_VELOCITY_SQUARED_COEFFICIENT_MMHG_SEC2_PER_M2_V1;
  points: readonly MainWireAorticValveLvotKineticCorrectionPointV1[];
  maximumLvotCorrectedGradientInstantaneous: MainWireAorticValveLvotKineticCorrectionPointV1;
  atMaximumJetVelocityInstantaneous: MainWireAorticValveLvotKineticCorrectionPointV1;
  timeWeightedMean: MainWireAorticValveLvotKineticCorrectionTimeWeightedMeanV1;
  maximumAbsoluteExactDensityDimensionalIdentityResidualMmHg: number;
  allExactDensityDimensionalIdentitiesWithinTolerance: true;
  allCorrectedGradientBoundsInvariantsPassed: true;
  allCorrectedGradientMonotonicityInvariantsPassed: true;
  claim: typeof MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_CLAIM_V1;
}>;

export function resolveMainWireAorticValveLvotKineticCorrectionProfileV1(
  profileId: MainWireAorticValveLvotKineticCorrectionProfileIdV1,
): MainWireAorticValveLvotKineticCorrectionProfileV1 {
  if (
    !Object.hasOwn(
      MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROFILES_V1,
      profileId,
    )
  ) {
    throw new Error(`unsupported fixed LVOT profile: ${String(profileId)}`);
  }
  return MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROFILES_V1[profileId];
}

export function analyzeMainWireAorticValveLvotKineticCorrectionV1(
  input: MainWireAorticValveLvotKineticCorrectionInputV1,
): MainWireAorticValveLvotKineticCorrectionV1 {
  const profile = resolveMainWireAorticValveLvotKineticCorrectionProfileV1(
    input.profileId,
  );
  if (!Array.isArray(input.samples) || input.samples.length === 0) {
    throw new Error("LVOT kinetic correction requires a non-empty episode");
  }

  const points = Object.freeze(
    input.samples.map((sample, index) => {
      if (index > 0) {
        const previousTimeSec = input.samples[index - 1]!.acceptedTimeSec;
        if (!(sample.acceptedTimeSec > previousTimeSec)) {
          throw new Error("accepted sample times must be strictly increasing");
        }
      }
      return evaluatePoint(sample, index, profile);
    }),
  );
  const episodeIntegrationDurationSec = sum(
    points.map((point) => point.episodeIntegrationWeightSec),
  );
  positiveFinite(
    episodeIntegrationDurationSec,
    "episode integration duration",
  );
  const maximumLvotCorrectedGradientInstantaneous = points.reduce(
    (peak, point) =>
      point.lvotCorrectedSimplifiedBernoulliGradientMmHg >
      peak.lvotCorrectedSimplifiedBernoulliGradientMmHg
        ? point
        : peak,
  );
  const atMaximumJetVelocityInstantaneous = points.reduce((peak, point) =>
    point.jetVelocityMPerSec > peak.jetVelocityMPerSec ? point : peak,
  );
  const timeWeightedMean = Object.freeze({
    forwardFlowMlPerSec: weightedMean(
      points,
      (point) => point.forwardFlowMlPerSec,
      episodeIntegrationDurationSec,
    ),
    activeEoaCm2: weightedMean(
      points,
      (point) => point.activeEoaCm2,
      episodeIntegrationDurationSec,
    ),
    jetVelocityMPerSec: weightedMean(
      points,
      (point) => point.jetVelocityMPerSec,
      episodeIntegrationDurationSec,
    ),
    lvotVelocityMPerSec: weightedMean(
      points,
      (point) => point.lvotVelocityMPerSec,
      episodeIntegrationDurationSec,
    ),
    simplifiedBernoulliGradientMmHg: weightedMean(
      points,
      (point) => point.simplifiedBernoulliGradientMmHg,
      episodeIntegrationDurationSec,
    ),
    simplifiedLvotKineticGradientMmHg: weightedMean(
      points,
      (point) => point.simplifiedLvotKineticGradientMmHg,
      episodeIntegrationDurationSec,
    ),
    lvotCorrectedSimplifiedBernoulliGradientMmHg: weightedMean(
      points,
      (point) => point.lvotCorrectedSimplifiedBernoulliGradientMmHg,
      episodeIntegrationDurationSec,
    ),
    exactDensityJetGradientMmHg: weightedMean(
      points,
      (point) => point.exactDensityJetGradientMmHg,
      episodeIntegrationDurationSec,
    ),
    exactDensityLvotKineticGradientMmHg: weightedMean(
      points,
      (point) => point.exactDensityLvotKineticGradientMmHg,
      episodeIntegrationDurationSec,
    ),
    exactDensityLvotCorrectedGradientMmHg: weightedMean(
      points,
      (point) => point.exactDensityLvotCorrectedGradientMmHg,
      episodeIntegrationDurationSec,
    ),
    retainedCorrectedFractionOfSimplified01: weightedMean(
      points,
      (point) => point.retainedCorrectedFractionOfSimplified01,
      episodeIntegrationDurationSec,
    ),
    removedLvotKineticFractionOfSimplified01: weightedMean(
      points,
      (point) => point.removedLvotKineticFractionOfSimplified01,
      episodeIntegrationDurationSec,
    ),
  });
  const maximumAbsoluteExactDensityDimensionalIdentityResidualMmHg =
    points.reduce(
      (maximum, point) =>
        Math.max(
          maximum,
          Math.abs(point.exactDensityDimensionalIdentityResidualMmHg),
        ),
      0,
    );

  return Object.freeze({
    methodId: MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_V1_ID,
    provenance: MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_PROVENANCE_V1,
    profile,
    episode: Object.freeze({
      sampleCount: points.length,
      acceptedStartTimeSec: points[0]!.acceptedTimeSec,
      acceptedEndTimeSec: points.at(-1)!.acceptedTimeSec,
      episodeIntegrationDurationSec,
    }),
    exactDensityVelocitySquaredCoefficientMmHgSec2PerM2:
      MAIN_WIRE_AORTIC_VALVE_EXACT_DENSITY_VELOCITY_SQUARED_COEFFICIENT_MMHG_SEC2_PER_M2_V1,
    points,
    maximumLvotCorrectedGradientInstantaneous,
    atMaximumJetVelocityInstantaneous,
    timeWeightedMean,
    maximumAbsoluteExactDensityDimensionalIdentityResidualMmHg,
    allExactDensityDimensionalIdentitiesWithinTolerance: true as const,
    allCorrectedGradientBoundsInvariantsPassed: true as const,
    allCorrectedGradientMonotonicityInvariantsPassed: true as const,
    claim: MAIN_WIRE_AORTIC_VALVE_LVOT_KINETIC_CORRECTION_CLAIM_V1,
  });
}

function evaluatePoint(
  sample: MainWireAorticValveLvotKineticCorrectionSampleInputV1,
  sourceSampleIndex: number,
  profile: MainWireAorticValveLvotKineticCorrectionProfileV1,
): MainWireAorticValveLvotKineticCorrectionPointV1 {
  finite(sample.acceptedTimeSec, "acceptedTimeSec");
  positiveFinite(
    sample.episodeIntegrationWeightSec,
    "episodeIntegrationWeightSec",
  );
  positiveFinite(sample.forwardFlowMlPerSec, "forwardFlowMlPerSec");
  positiveFinite(sample.activeEoaCm2, "activeEoaCm2");
  if (!(profile.lvotAreaCm2 > sample.activeEoaCm2)) {
    throw new Error("fixed LVOT area must strictly exceed active AoV EOA");
  }

  const flowMlPerSec = sample.forwardFlowMlPerSec;
  const jetVelocityMPerSec = flowMlPerSec / (100 * sample.activeEoaCm2);
  const lvotVelocityMPerSec = flowMlPerSec / (100 * profile.lvotAreaCm2);
  const simplifiedBernoulliGradientMmHg = 4 * jetVelocityMPerSec ** 2;
  const simplifiedLvotKineticGradientMmHg = 4 * lvotVelocityMPerSec ** 2;
  const lvotCorrectedSimplifiedBernoulliGradientMmHg =
    simplifiedBernoulliGradientMmHg - simplifiedLvotKineticGradientMmHg;
  const exactDensityJetCoefficientMmHgSec2PerMl2 =
    idealBernoulliLossFromEffectiveOrificeAreaV2(sample.activeEoaCm2);
  const exactDensityLvotCoefficientMmHgSec2PerMl2 =
    idealBernoulliLossFromEffectiveOrificeAreaV2(profile.lvotAreaCm2);
  const exactDensityCorrectedCoefficientMmHgSec2PerMl2 =
    exactDensityJetCoefficientMmHgSec2PerMl2 -
    exactDensityLvotCoefficientMmHgSec2PerMl2;
  const exactDensityJetGradientMmHg =
    exactDensityJetCoefficientMmHgSec2PerMl2 * flowMlPerSec ** 2;
  const exactDensityLvotKineticGradientMmHg =
    exactDensityLvotCoefficientMmHgSec2PerMl2 * flowMlPerSec ** 2;
  const exactDensityLvotCorrectedGradientMmHg =
    exactDensityCorrectedCoefficientMmHgSec2PerMl2 * flowMlPerSec ** 2;
  const lvotCorrectedSimplifiedGradientDerivativeMmHgPerCm2 =
    (8 * lvotVelocityMPerSec ** 2) / profile.lvotAreaCm2;
  const exactDensityLvotCorrectedGradientDerivativeMmHgPerCm2 =
    (2 * exactDensityLvotKineticGradientMmHg) / profile.lvotAreaCm2;
  const retainedCorrectedFractionOfSimplified01 =
    lvotCorrectedSimplifiedBernoulliGradientMmHg /
    simplifiedBernoulliGradientMmHg;
  const removedLvotKineticFractionOfSimplified01 =
    simplifiedLvotKineticGradientMmHg / simplifiedBernoulliGradientMmHg;
  const exactDensityVelocityIdentityMmHg =
    MAIN_WIRE_AORTIC_VALVE_EXACT_DENSITY_VELOCITY_SQUARED_COEFFICIENT_MMHG_SEC2_PER_M2_V1 *
    (jetVelocityMPerSec ** 2 - lvotVelocityMPerSec ** 2);
  const exactDensityDimensionalIdentityResidualMmHg =
    exactDensityLvotCorrectedGradientMmHg - exactDensityVelocityIdentityMmHg;

  finiteComputed([
    jetVelocityMPerSec,
    lvotVelocityMPerSec,
    simplifiedBernoulliGradientMmHg,
    simplifiedLvotKineticGradientMmHg,
    lvotCorrectedSimplifiedBernoulliGradientMmHg,
    exactDensityJetCoefficientMmHgSec2PerMl2,
    exactDensityLvotCoefficientMmHgSec2PerMl2,
    exactDensityCorrectedCoefficientMmHgSec2PerMl2,
    exactDensityJetGradientMmHg,
    exactDensityLvotKineticGradientMmHg,
    exactDensityLvotCorrectedGradientMmHg,
    lvotCorrectedSimplifiedGradientDerivativeMmHgPerCm2,
    exactDensityLvotCorrectedGradientDerivativeMmHgPerCm2,
    retainedCorrectedFractionOfSimplified01,
    removedLvotKineticFractionOfSimplified01,
    exactDensityDimensionalIdentityResidualMmHg,
  ]);
  if (
    !(lvotCorrectedSimplifiedBernoulliGradientMmHg >= 0) ||
    !(
      lvotCorrectedSimplifiedBernoulliGradientMmHg <=
      simplifiedBernoulliGradientMmHg
    ) ||
    !(exactDensityLvotCorrectedGradientMmHg >= 0) ||
    !(exactDensityLvotCorrectedGradientMmHg <= exactDensityJetGradientMmHg) ||
    !(lvotCorrectedSimplifiedGradientDerivativeMmHgPerCm2 > 0) ||
    !(exactDensityLvotCorrectedGradientDerivativeMmHgPerCm2 > 0) ||
    !(retainedCorrectedFractionOfSimplified01 >= 0) ||
    !(retainedCorrectedFractionOfSimplified01 <= 1) ||
    !(removedLvotKineticFractionOfSimplified01 >= 0) ||
    !(removedLvotKineticFractionOfSimplified01 <= 1)
  ) {
    throw new Error("LVOT-corrected gradient algebraic bounds failed");
  }
  const identityToleranceMmHg =
    64 *
    Number.EPSILON *
    Math.max(
      1,
      Math.abs(exactDensityLvotCorrectedGradientMmHg),
      Math.abs(exactDensityVelocityIdentityMmHg),
    );
  if (
    Math.abs(exactDensityDimensionalIdentityResidualMmHg) >
    identityToleranceMmHg
  ) {
    throw new Error("exact-density LVOT dimensional identity failed");
  }

  return Object.freeze({
    sourceSampleIndex,
    acceptedTimeSec: sample.acceptedTimeSec,
    episodeIntegrationWeightSec: sample.episodeIntegrationWeightSec,
    forwardFlowMlPerSec: flowMlPerSec,
    activeEoaCm2: sample.activeEoaCm2,
    lvotAreaCm2: profile.lvotAreaCm2,
    jetVelocityMPerSec,
    lvotVelocityMPerSec,
    simplifiedBernoulliGradientMmHg,
    simplifiedLvotKineticGradientMmHg,
    lvotCorrectedSimplifiedBernoulliGradientMmHg,
    exactDensityJetCoefficientMmHgSec2PerMl2,
    exactDensityLvotCoefficientMmHgSec2PerMl2,
    exactDensityCorrectedCoefficientMmHgSec2PerMl2,
    exactDensityJetGradientMmHg,
    exactDensityLvotKineticGradientMmHg,
    exactDensityLvotCorrectedGradientMmHg,
    lvotCorrectedSimplifiedGradientDerivativeMmHgPerCm2,
    exactDensityLvotCorrectedGradientDerivativeMmHgPerCm2,
    retainedCorrectedFractionOfSimplified01,
    removedLvotKineticFractionOfSimplified01,
    exactDensityDimensionalIdentityResidualMmHg,
    exactDensityDimensionalIdentityWithinTolerance: true as const,
    correctedGradientBoundsInvariantPassed: true as const,
    correctedGradientStrictlyIncreasesWithLvotAreaInvariantPassed:
      true as const,
  });
}

function weightedMean(
  points: readonly MainWireAorticValveLvotKineticCorrectionPointV1[],
  read: (point: MainWireAorticValveLvotKineticCorrectionPointV1) => number,
  durationSec: number,
): number {
  const value =
    sum(
      points.map(
        (point) => read(point) * point.episodeIntegrationWeightSec,
      ),
    ) / durationSec;
  if (!Number.isFinite(value)) {
    throw new Error("LVOT kinetic correction weighted mean must be finite");
  }
  return value;
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function finiteComputed(values: readonly number[]): void {
  if (!values.every(Number.isFinite)) {
    throw new Error("LVOT kinetic correction produced a non-finite readback");
  }
}

function positiveFinite(value: number, label: string): void {
  if (!(value > 0) || !Number.isFinite(value)) {
    throw new Error(`${label} must be finite and positive`);
  }
}

function finite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
}
