import {
  createSourceImpulseV2,
  type SourceImpulseV2,
} from "@/engine/myocardium/rhythm/acceptedElectricalCaptureOwnerV2";
import {
  canonicalJsonStringify,
  sha256CanonicalJsonHex,
} from "@/engine/scientific/release";

/**
 * Accepted stationary AF atrial source owner.
 *
 * Construction starts from Climent et al. (2011), DOI
 * 10.1007/s11517-011-0823-2: an unconditioned Pearson-IV parent is explicitly
 * conditioned on physical AA > 0, then followed by a positivity-preserving
 * finite moving-average filter. This owner stops at atrial source proposals;
 * capture, AV recovery/concealment, distal conduction, ventricular response,
 * calcium, and mechanics belong to separate owners.
 */

export const ACCEPTED_AF_ATRIAL_SOURCE_CONFIGURATION_V1_ID =
  "accepted-af-atrial-source-configuration-v1" as const;
export const AF_PEARSON_TYPE_IV_MOMENTS_V1_ID =
  "af-pearson-type-iv-moments-v1" as const;
export const AF_PEARSON_TYPE_IV_PARAMETERS_V1_ID =
  "af-pearson-type-iv-parameters-v1" as const;
export const AF_MOVING_AVERAGE_FILTER_V1_ID =
  "af-moving-average-filter-v1" as const;
export const AF_DETERMINISTIC_RANDOM_STATE_V1_ID =
  "af-deterministic-random-state-v1" as const;
export const AF_ATRIAL_SCHEDULING_INTERVAL_V1_ID =
  "af-atrial-scheduling-interval-v1" as const;
export const AF_ATRIAL_SOURCE_IMPULSE_METADATA_V1_ID =
  "af-atrial-source-impulse-metadata-v1" as const;
export const ACCEPTED_AF_ATRIAL_SOURCE_STATE_V1_ID =
  "accepted-af-atrial-source-state-v1" as const;
export const ACCEPTED_AF_ATRIAL_SOURCE_TRIAL_V1_ID =
  "accepted-af-atrial-source-trial-v1" as const;
export const ACCEPTED_AF_ATRIAL_SOURCE_IDENTITY_V1_ID =
  "accepted-af-atrial-source-identity-v1" as const;

/** Hard failures only. Stochastic bounds never truncate or substitute an AA. */
export const MAX_AF_MOVING_AVERAGE_COEFFICIENT_COUNT_V1 = 64 as const;
export const MAX_AF_SOURCE_IMPULSES_PER_TRIAL_V1 = 100_000 as const;
export const MAX_AF_PEARSON_PROPOSALS_PER_INNOVATION_V1 = 1_000_000 as const;
/** Internal to one Gamma draw; distinct from the outer Pearson proposal bound. */
export const MAX_AF_GAMMA_ATTEMPTS_PER_DRAW_V1 = 1_024 as const;
/** Fixed absolute representation tolerance; it never scales with tap magnitude. */
export const AF_MOVING_AVERAGE_UNIT_DC_ABSOLUTE_TOLERANCE_V1 =
  64 * Number.EPSILON;

export const ACCEPTED_AF_ATRIAL_SOURCE_CLAIM_V1 = deepFreeze({
  scope: "stationary-seeded-af-atrial-source-proposals" as const,
  constructionEvidence: Object.freeze({
    source: "Climent-et-al-2011-DOI-10.1007/s11517-011-0823-2" as const,
    equationFamily:
      "Pearson-IV-parent-moments-and-finite-moving-average-filter" as const,
    evidenceRole:
      "construction-and-component-reproduction-not-independent-validation" as const,
  }),
  pearsonParentMoments:
    "explicit-mean-variance-skewness-and-nonexcess-kurtosis" as const,
  pearsonTypeIvCriterion: "strict-Climent-equation-8" as const,
  pearsonParentDistribution:
    "unconditioned-Climent-Pearson-IV-on-the-real-line" as const,
  innovationDistribution:
    "exact-Climent-Pearson-IV-parent-conditioned-on-AA-greater-than-zero-via-rejection" as const,
  positiveConditioning: Object.freeze({
    rule: "accept-parent-draw-if-and-only-if-AA-is-strictly-positive" as const,
    nonpositiveParentDrawsReported: true as const,
    parentMomentsPreservedExactlyClaimed: false as const,
    parentPdfReproducedExactlyClaimed: false as const,
    exactConditionalRejectionLawClaimed: true as const,
    finiteSamplePdfReproductionClaimed: false as const,
  }),
  filteredMarginalClaim:
    "not-exactly-conditioned-Pearson-IV-after-moving-average;no-parent-moment-or-parent-PDF-identity" as const,
  movingAverage:
    "explicit-finite-nonnegative-coefficients-with-positive-c0-strict-unit-DC-gain-and-reported-induced-nonnegative-ACF" as const,
  negativeAutocorrelationRepresentable: false as const,
  intervalPositivity:
    "positive-conditioned-innovations-plus-nonnegative-unit-DC-taps-and-positive-c0-structurally-guarantee-positive-filtered-AA" as const,
  acceptedClock: "nonnegative-absolute-time" as const,
  sourceTimes:
    "explicit-future-finite-anchor-then-generated-positive-AA-sums" as const,
  intervalConvention: "open-start-closed-end" as const,
  sourceImpulseSchema: "source-impulse-v2" as const,
  sourceKind: "primary-intrinsic" as const,
  sourceRoute: "atrial" as const,
  parentCapturedActivation: null,
  deterministicRandomAlgorithm: Object.freeze({
    uniform: "xoshiro128-star-star-from-explicit-uint32-seed" as const,
    normal: "Box-Muller-with-checkpointed-spare" as const,
    gamma: "Marsaglia-Tsang-with-finite-per-draw-hard-attempt-bound" as const,
    pearsonIv:
      "symmetric-Pearson-VII-Student-t-envelope-with-exponential-tilt-then-exact-positive-conditioning" as const,
    pearsonIvTiltEnvelope:
      "exp(abs(lambda2)*pi/2)-from-abs(atan(y))<pi/2" as const,
    cryptographicRandomnessClaimed: false as const,
    crossJavascriptEngineBitIdentityClaimed: false as const,
  }),
  sourceTimingIndependentOf: Object.freeze([
    "solver-dt",
    "accepted-chunk-size",
    "trial-retry-count",
  ] as const),
  hardFailureBounds: Object.freeze({
    movingAverageCoefficientCount: MAX_AF_MOVING_AVERAGE_COEFFICIENT_COUNT_V1,
    sourceImpulsesPerTrial: MAX_AF_SOURCE_IMPULSES_PER_TRIAL_V1,
    pearsonProposalsPerInnovation: MAX_AF_PEARSON_PROPOSALS_PER_INNOVATION_V1,
    gammaAttemptsPerDraw: MAX_AF_GAMMA_ATTEMPTS_PER_DRAW_V1,
  }),
  hardProposalBoundScope:
    "one-total-bound-counts-tilt-rejections-and-nonpositive-parent-rejections" as const,
  hardProposalBoundCanRejectAdmissibleConfiguration: true as const,
  hardGammaAttemptBoundScope:
    "one-bound-per-Marsaglia-Tsang-Gamma-draw-distinct-from-Pearson-proposal-count" as const,
  hardGammaAttemptBoundExhaustion:
    "hard-error-without-Gamma-or-AA-substitution" as const,
  hardGammaAttemptBoundCanRejectAdmissibleConfiguration: true as const,
  proposalEfficiencyAcceptanceClaimed: false as const,
  acceptedStateImmutable: true as const,
  candidateEvaluationPure: true as const,
  commitValidation: "exact-deterministic-recomputation" as const,
  rollbackReturnsAcceptedIdentity: true as const,
  captureClaimed: false as const,
  avRecoveryOrConcealmentClaimed: false as const,
  distalConductionClaimed: false as const,
  ventricularResponseClaimed: false as const,
  coherentAtrialCalciumClaimed: false as const,
  ecgClaimed: false as const,
  afOnsetOrTerminationClaimed: false as const,
  reentryRotorOrSpatialMechanismClaimed: false as const,
  drugResponseClaimed: false as const,
  autonomicModulationClaimed: false as const,
  patientFittingClaimed: false as const,
  clinicalValidityClaimed: false as const,
  heldOutEvidenceUsed: false as const,
  heldOutEvidenceReserved: Object.freeze([
    "I-AFDB-atrial-annotations-after-origin-leakage-audit",
    "patient-disjoint-LTAFDB-end-to-end-RR",
  ] as const),
});

export type AfPearsonTypeIvMomentsInputV1 = Readonly<{
  meanSec: number;
  standardDeviationSec: number;
  skewness: number;
  /** Pearson/non-excess kurtosis; Gaussian kurtosis is 3. */
  kurtosis: number;
}>;

export type AfPearsonTypeIvMomentsV1 = Readonly<{
  momentsSchemaId: typeof AF_PEARSON_TYPE_IV_MOMENTS_V1_ID;
  schemaVersion: 1;
  meanSec: number;
  varianceSec2: number;
  standardDeviationSec: number;
  skewness: number;
  kurtosis: number;
}>;

export type AfPearsonTypeIvParametersV1 = Readonly<{
  parametersSchemaId: typeof AF_PEARSON_TYPE_IV_PARAMETERS_V1_ID;
  schemaVersion: 1;
  moments: AfPearsonTypeIvMomentsV1;
  /** Climent Eq. 8; strictly between zero and one for Type IV. */
  pearsonTypeIvCriterion: number;
  /** Climent r, used to derive lambda1 through lambda4. */
  r: number;
  /** lambda1 in f(x) ∝ (1+y²)^(-lambda1) exp(-lambda2 atan(y)). */
  lambda1ShapeExponent: number;
  /** lambda2; its sign determines the direction of asymmetry. */
  lambda2SkewExponent: number;
  /** lambda3 > 0, in seconds. */
  lambda3ScaleSec: number;
  /** lambda4, in seconds. */
  lambda4LocationSec: number;
}>;

export type AfMovingAverageFilterV1 = Readonly<{
  filterSchemaId: typeof AF_MOVING_AVERAGE_FILTER_V1_ID;
  schemaVersion: 1;
  /** Nonnegative c_0 ... c_M in AA_c[n] = sum(c_k AA_u[n-k]). */
  coefficients: readonly number[];
  order: number;
  dcGain: number;
  innovationVarianceGain: number;
  filteredStandardDeviationScale: number;
  /** rho[0] ... rho[M] induced for independent finite-variance innovations. */
  theoreticalAutocorrelation: readonly number[];
}>;

export type AcceptedAfAtrialSourceConfigurationInputV1 = Readonly<{
  configurationId: string;
  ownerInstanceId: string;
  sourceId: string;
  /** Exact integer in [0, 2^32 - 1]. No random default is supplied. */
  seedUint32: number;
  pearsonParentMoments: AfPearsonTypeIvMomentsInputV1;
  movingAverageCoefficients: readonly number[];
}>;

export type AcceptedAfAtrialSourceConfigurationV1 = Readonly<{
  configurationSchemaId: typeof ACCEPTED_AF_ATRIAL_SOURCE_CONFIGURATION_V1_ID;
  schemaVersion: 1;
  configurationId: string;
  ownerInstanceId: string;
  sourceId: string;
  seedUint32: number;
  pearsonTypeIv: AfPearsonTypeIvParametersV1;
  movingAverage: AfMovingAverageFilterV1;
}>;

export type AfDeterministicRandomStateV1 = Readonly<{
  randomStateSchemaId: typeof AF_DETERMINISTIC_RANDOM_STATE_V1_ID;
  schemaVersion: 1;
  algorithmId: "xoshiro128-star-star-box-muller-marsaglia-tsang-positive-conditioned-v1";
  state0: number;
  state1: number;
  state2: number;
  state3: number;
  gaussianSpare: number | null;
  uint32DrawCount: number;
  normalDrawCount: number;
  gammaDrawCount: number;
  /** Total Marsaglia--Tsang attempts across completed Gamma draws. */
  gammaAttemptCount: number;
  /** Total Pearson-VII proposals, regardless of rejection cause. */
  pearsonProposalCount: number;
  /** Positive-conditioned innovations returned to the source/filter. */
  pearsonAcceptedCount: number;
  pearsonTiltRejectedCount: number;
  /** Tilt-accepted unconditioned parent draws removed because X <= 0. */
  pearsonNonpositiveParentRejectedCount: number;
}>;

export type AfAtrialSchedulingIntervalV1 = Readonly<{
  intervalSchemaId: typeof AF_ATRIAL_SCHEDULING_INTERVAL_V1_ID;
  schemaVersion: 1;
  fromSourceImpulseId: string;
  fromSourceSequence: number;
  fromActivationTimeSec: number;
  toSourceSequence: number;
  toActivationTimeSec: number;
  /** Exact draw from the configured parent law conditioned on X > 0. */
  pearsonInnovationSec: number;
  innovationVectorNewestFirstSec: readonly number[];
  movingAverageTermsSec: readonly number[];
  aaIntervalSec: number;
  pearsonProposalCountForInnovation: number;
  /** Internal Gamma attempts used by this innovation's Pearson proposals. */
  gammaAttemptCountForInnovation: number;
  pearsonTiltRejectedCountForInnovation: number;
  pearsonNonpositiveParentRejectedCountForInnovation: number;
}>;

export type AfAtrialSourceImpulseMetadataV1 = Readonly<{
  metadataSchemaId: typeof AF_ATRIAL_SOURCE_IMPULSE_METADATA_V1_ID;
  schemaVersion: 1;
  configurationId: string;
  ownerInstanceId: string;
  sourceImpulseId: string;
  sourceSequence: number;
  activationTimeSec: number;
  /** Null only for the explicitly anchored source-sequence zero impulse. */
  scheduledByInterval: AfAtrialSchedulingIntervalV1 | null;
}>;

export type AcceptedAfAtrialSourceInitialStateInputV1 = Readonly<{
  acceptedTimeSec: number;
  /** Explicit absolute time of source sequence zero; must be in the future. */
  firstSourceActivationTimeSec: number;
}>;

export type AcceptedAfAtrialSourceStateV1 = Readonly<{
  stateSchemaId: typeof ACCEPTED_AF_ATRIAL_SOURCE_STATE_V1_ID;
  schemaVersion: 1;
  configuration: AcceptedAfAtrialSourceConfigurationV1;
  initialAcceptedTimeSec: number;
  firstSourceActivationTimeSec: number;
  revision: number;
  acceptedTimeSec: number;
  nextSourceSequence: number;
  nextSourceActivationTimeSec: number;
  acceptedSourceImpulseCount: number;
  /** AA_u[n-1], AA_u[n-2], ...; exactly filter.order entries. */
  innovationHistoryNewestFirstSec: readonly number[];
  randomState: AfDeterministicRandomStateV1;
  /** Interval that scheduled the next source; null before sequence zero. */
  nextSourceSchedulingInterval: AfAtrialSchedulingIntervalV1 | null;
}>;

export type AcceptedAfAtrialSourceTrialV1 = Readonly<{
  trialSchemaId: typeof ACCEPTED_AF_ATRIAL_SOURCE_TRIAL_V1_ID;
  schemaVersion: 1;
  configurationId: string;
  ownerInstanceId: string;
  baseRevision: number;
  candidateRevision: number;
  startTimeSec: number;
  candidateTimeSec: number;
  processedSourceImpulseCount: number;
  sourceImpulses: readonly SourceImpulseV2[];
  metadataBySourceImpulseId: Readonly<
    Record<string, AfAtrialSourceImpulseMetadataV1>
  >;
  generatedIntervals: readonly AfAtrialSchedulingIntervalV1[];
  candidateState: AcceptedAfAtrialSourceStateV1;
}>;

export type AcceptedAfAtrialSourceMaximumStepV1 = Readonly<{
  requestedStepSec: number;
  requestedEndTimeSec: number;
  maximumStepSec: number;
  candidateTimeSec: number;
  clippedBySourceImpulse: boolean;
  boundarySourceImpulseId: string | null;
  boundarySourceSequence: number | null;
  boundaryActivationTimeSec: number | null;
}>;

export type AcceptedAfAtrialSourceIdentityV1 = Readonly<{
  identitySchemaId: typeof ACCEPTED_AF_ATRIAL_SOURCE_IDENTITY_V1_ID;
  schemaVersion: 1;
  configuration: AcceptedAfAtrialSourceConfigurationV1;
  constructionClaim: typeof ACCEPTED_AF_ATRIAL_SOURCE_CLAIM_V1;
}>;

const CONFIGURATION_INPUT_KEYS = Object.freeze([
  "configurationId",
  "ownerInstanceId",
  "sourceId",
  "seedUint32",
  "pearsonParentMoments",
  "movingAverageCoefficients",
] as const);
const MOMENTS_INPUT_KEYS = Object.freeze([
  "meanSec",
  "standardDeviationSec",
  "skewness",
  "kurtosis",
] as const);
const CONFIGURATION_KEYS = Object.freeze([
  "configurationSchemaId",
  "schemaVersion",
  "configurationId",
  "ownerInstanceId",
  "sourceId",
  "seedUint32",
  "pearsonTypeIv",
  "movingAverage",
] as const);
const MOMENTS_KEYS = Object.freeze([
  "momentsSchemaId",
  "schemaVersion",
  "meanSec",
  "varianceSec2",
  "standardDeviationSec",
  "skewness",
  "kurtosis",
] as const);
const PEARSON_KEYS = Object.freeze([
  "parametersSchemaId",
  "schemaVersion",
  "moments",
  "pearsonTypeIvCriterion",
  "r",
  "lambda1ShapeExponent",
  "lambda2SkewExponent",
  "lambda3ScaleSec",
  "lambda4LocationSec",
] as const);
const FILTER_KEYS = Object.freeze([
  "filterSchemaId",
  "schemaVersion",
  "coefficients",
  "order",
  "dcGain",
  "innovationVarianceGain",
  "filteredStandardDeviationScale",
  "theoreticalAutocorrelation",
] as const);
const INITIAL_STATE_INPUT_KEYS = Object.freeze([
  "acceptedTimeSec",
  "firstSourceActivationTimeSec",
] as const);
const RANDOM_STATE_KEYS = Object.freeze([
  "randomStateSchemaId",
  "schemaVersion",
  "algorithmId",
  "state0",
  "state1",
  "state2",
  "state3",
  "gaussianSpare",
  "uint32DrawCount",
  "normalDrawCount",
  "gammaDrawCount",
  "gammaAttemptCount",
  "pearsonProposalCount",
  "pearsonAcceptedCount",
  "pearsonTiltRejectedCount",
  "pearsonNonpositiveParentRejectedCount",
] as const);
const INTERVAL_KEYS = Object.freeze([
  "intervalSchemaId",
  "schemaVersion",
  "fromSourceImpulseId",
  "fromSourceSequence",
  "fromActivationTimeSec",
  "toSourceSequence",
  "toActivationTimeSec",
  "pearsonInnovationSec",
  "innovationVectorNewestFirstSec",
  "movingAverageTermsSec",
  "aaIntervalSec",
  "pearsonProposalCountForInnovation",
  "gammaAttemptCountForInnovation",
  "pearsonTiltRejectedCountForInnovation",
  "pearsonNonpositiveParentRejectedCountForInnovation",
] as const);
const STATE_KEYS = Object.freeze([
  "stateSchemaId",
  "schemaVersion",
  "configuration",
  "initialAcceptedTimeSec",
  "firstSourceActivationTimeSec",
  "revision",
  "acceptedTimeSec",
  "nextSourceSequence",
  "nextSourceActivationTimeSec",
  "acceptedSourceImpulseCount",
  "innovationHistoryNewestFirstSec",
  "randomState",
  "nextSourceSchedulingInterval",
] as const);
const TRIAL_KEYS = Object.freeze([
  "trialSchemaId",
  "schemaVersion",
  "configurationId",
  "ownerInstanceId",
  "baseRevision",
  "candidateRevision",
  "startTimeSec",
  "candidateTimeSec",
  "processedSourceImpulseCount",
  "sourceImpulses",
  "metadataBySourceImpulseId",
  "generatedIntervals",
  "candidateState",
] as const);

type MutableRandomState = {
  state0: number;
  state1: number;
  state2: number;
  state3: number;
  gaussianSpare: number | null;
  uint32DrawCount: number;
  normalDrawCount: number;
  gammaDrawCount: number;
  gammaAttemptCount: number;
  pearsonProposalCount: number;
  pearsonAcceptedCount: number;
  pearsonTiltRejectedCount: number;
  pearsonNonpositiveParentRejectedCount: number;
};

export function createAcceptedAfAtrialSourceConfigurationV1(
  input: AcceptedAfAtrialSourceConfigurationInputV1,
): AcceptedAfAtrialSourceConfigurationV1 {
  const record = requirePlainRecord(
    input,
    "AF atrial source configuration input",
  );
  requireExactKeys(
    record,
    CONFIGURATION_INPUT_KEYS,
    "AF atrial source configuration input",
  );
  const momentsInput = requirePlainRecord(
    input.pearsonParentMoments,
    "AF Pearson-IV parent moments input",
  );
  requireExactKeys(
    momentsInput,
    MOMENTS_INPUT_KEYS,
    "AF Pearson-IV parent moments input",
  );

  const pearsonTypeIv = derivePearsonTypeIvParameters(
    input.pearsonParentMoments,
  );
  const movingAverage = createMovingAverageFilter(
    input.movingAverageCoefficients,
  );
  return deepFreeze({
    configurationSchemaId: ACCEPTED_AF_ATRIAL_SOURCE_CONFIGURATION_V1_ID,
    schemaVersion: 1 as const,
    configurationId: requireNonemptyString(
      input.configurationId,
      "AF configurationId",
    ),
    ownerInstanceId: requireNonemptyString(
      input.ownerInstanceId,
      "AF ownerInstanceId",
    ),
    sourceId: requireNonemptyString(input.sourceId, "AF sourceId"),
    seedUint32: requireUint32(input.seedUint32, "AF seedUint32"),
    pearsonTypeIv,
    movingAverage,
  });
}

export function validateAcceptedAfAtrialSourceConfigurationV1(
  configuration: AcceptedAfAtrialSourceConfigurationV1,
): void {
  const record = requirePlainRecord(
    configuration,
    "AF atrial source configuration",
  );
  requireExactKeys(
    record,
    CONFIGURATION_KEYS,
    "AF atrial source configuration",
  );
  if (
    configuration.configurationSchemaId !==
      ACCEPTED_AF_ATRIAL_SOURCE_CONFIGURATION_V1_ID ||
    configuration.schemaVersion !== 1
  ) {
    throw new Error("unsupported AF atrial source configuration schema");
  }
  requireNonemptyString(configuration.configurationId, "AF configurationId");
  requireNonemptyString(configuration.ownerInstanceId, "AF ownerInstanceId");
  requireNonemptyString(configuration.sourceId, "AF sourceId");
  requireUint32(configuration.seedUint32, "AF seedUint32");

  const momentsRecord = requirePlainRecord(
    configuration.pearsonTypeIv?.moments,
    "AF Pearson-IV moments",
  );
  requireExactKeys(momentsRecord, MOMENTS_KEYS, "AF Pearson-IV moments");
  const pearsonRecord = requirePlainRecord(
    configuration.pearsonTypeIv,
    "AF Pearson-IV parameters",
  );
  requireExactKeys(pearsonRecord, PEARSON_KEYS, "AF Pearson-IV parameters");
  if (
    configuration.pearsonTypeIv.parametersSchemaId !==
      AF_PEARSON_TYPE_IV_PARAMETERS_V1_ID ||
    configuration.pearsonTypeIv.schemaVersion !== 1 ||
    configuration.pearsonTypeIv.moments.momentsSchemaId !==
      AF_PEARSON_TYPE_IV_MOMENTS_V1_ID ||
    configuration.pearsonTypeIv.moments.schemaVersion !== 1
  ) {
    throw new Error("unsupported AF Pearson-IV parameter schema");
  }
  const recomputedPearson = derivePearsonTypeIvParameters({
    meanSec: configuration.pearsonTypeIv.moments.meanSec,
    standardDeviationSec:
      configuration.pearsonTypeIv.moments.standardDeviationSec,
    skewness: configuration.pearsonTypeIv.moments.skewness,
    kurtosis: configuration.pearsonTypeIv.moments.kurtosis,
  });
  if (
    canonicalJsonStringify(recomputedPearson) !==
    canonicalJsonStringify(configuration.pearsonTypeIv)
  ) {
    throw new Error("AF Pearson-IV derived parameters are inconsistent");
  }

  const filterRecord = requirePlainRecord(
    configuration.movingAverage,
    "AF moving-average filter",
  );
  requireExactKeys(filterRecord, FILTER_KEYS, "AF moving-average filter");
  if (
    configuration.movingAverage.filterSchemaId !==
      AF_MOVING_AVERAGE_FILTER_V1_ID ||
    configuration.movingAverage.schemaVersion !== 1
  ) {
    throw new Error("unsupported AF moving-average filter schema");
  }
  const recomputedFilter = createMovingAverageFilter(
    configuration.movingAverage.coefficients,
  );
  if (
    canonicalJsonStringify(recomputedFilter) !==
    canonicalJsonStringify(configuration.movingAverage)
  ) {
    throw new Error("AF moving-average derived diagnostics are inconsistent");
  }
}

export function initializeAcceptedAfAtrialSourceStateV1(
  configuration: AcceptedAfAtrialSourceConfigurationV1,
  input: AcceptedAfAtrialSourceInitialStateInputV1,
): AcceptedAfAtrialSourceStateV1 {
  validateAcceptedAfAtrialSourceConfigurationV1(configuration);
  const inputRecord = requirePlainRecord(input, "AF initial state input");
  requireExactKeys(
    inputRecord,
    INITIAL_STATE_INPUT_KEYS,
    "AF initial state input",
  );
  const acceptedTimeSec = requireNonnegativeFinite(
    input.acceptedTimeSec,
    "AF initial acceptedTimeSec",
  );
  const firstSourceActivationTimeSec = normalizeFinite(
    input.firstSourceActivationTimeSec,
    "AF firstSourceActivationTimeSec",
  );
  if (!(firstSourceActivationTimeSec > acceptedTimeSec)) {
    throw new Error(
      "AF firstSourceActivationTimeSec must exceed initial acceptedTimeSec",
    );
  }

  const mutableRandom = initializeMutableRandomState(configuration.seedUint32);
  const innovationHistoryNewestFirstSec: number[] = [];
  for (let index = 0; index < configuration.movingAverage.order; index += 1) {
    innovationHistoryNewestFirstSec.push(
      samplePositiveConditionedPearsonInnovation(configuration, mutableRandom),
    );
  }
  const state = deepFreeze({
    stateSchemaId: ACCEPTED_AF_ATRIAL_SOURCE_STATE_V1_ID,
    schemaVersion: 1 as const,
    configuration,
    initialAcceptedTimeSec: acceptedTimeSec,
    firstSourceActivationTimeSec,
    revision: 0,
    acceptedTimeSec,
    nextSourceSequence: 0,
    nextSourceActivationTimeSec: firstSourceActivationTimeSec,
    acceptedSourceImpulseCount: 0,
    innovationHistoryNewestFirstSec,
    randomState: freezeRandomState(mutableRandom),
    nextSourceSchedulingInterval: null,
  }) satisfies AcceptedAfAtrialSourceStateV1;
  validateAcceptedAfAtrialSourceStateV1(state);
  return state;
}

export function validateAcceptedAfAtrialSourceStateV1(
  state: AcceptedAfAtrialSourceStateV1,
): void {
  const record = requirePlainRecord(state, "accepted AF atrial source state");
  requireExactKeys(record, STATE_KEYS, "accepted AF atrial source state");
  if (
    state.stateSchemaId !== ACCEPTED_AF_ATRIAL_SOURCE_STATE_V1_ID ||
    state.schemaVersion !== 1
  ) {
    throw new Error("unsupported accepted AF atrial source state schema");
  }
  validateAcceptedAfAtrialSourceConfigurationV1(state.configuration);
  const initialAcceptedTimeSec = requireNonnegativeFinite(
    state.initialAcceptedTimeSec,
    "AF state initialAcceptedTimeSec",
  );
  const firstSourceActivationTimeSec = normalizeFinite(
    state.firstSourceActivationTimeSec,
    "AF state firstSourceActivationTimeSec",
  );
  if (!(firstSourceActivationTimeSec > initialAcceptedTimeSec)) {
    throw new Error("AF state first source time must exceed its initial clock");
  }
  const acceptedTimeSec = requireNonnegativeFinite(
    state.acceptedTimeSec,
    "AF state acceptedTimeSec",
  );
  if (acceptedTimeSec < initialAcceptedTimeSec) {
    throw new Error("AF acceptedTimeSec precedes the initial accepted clock");
  }
  requireNonnegativeSafeInteger(state.revision, "AF state revision");
  const nextSourceSequence = requireNonnegativeSafeInteger(
    state.nextSourceSequence,
    "AF nextSourceSequence",
  );
  const acceptedSourceImpulseCount = requireNonnegativeSafeInteger(
    state.acceptedSourceImpulseCount,
    "AF acceptedSourceImpulseCount",
  );
  if (acceptedSourceImpulseCount !== nextSourceSequence) {
    throw new Error("AF source sequence and accepted impulse count split");
  }
  const nextSourceActivationTimeSec = normalizeFinite(
    state.nextSourceActivationTimeSec,
    "AF nextSourceActivationTimeSec",
  );
  if (!(nextSourceActivationTimeSec > acceptedTimeSec)) {
    throw new Error("AF next source activation must be strictly in the future");
  }

  const history = requireDenseArray(
    state.innovationHistoryNewestFirstSec,
    "AF innovation history",
  );
  if (history.length !== state.configuration.movingAverage.order) {
    throw new Error("AF innovation history length does not match filter order");
  }
  for (const [index, innovation] of history.entries()) {
    if (!(normalizeFinite(innovation, `AF innovation history[${index}]`) > 0)) {
      throw new Error("AF innovation history contains a nonpositive AA value");
    }
  }
  validateRandomState(state.randomState);
  const expectedAcceptedInnovations = safeAdd(
    state.configuration.movingAverage.order,
    acceptedSourceImpulseCount,
    "AF expected accepted innovation count",
  );
  if (state.randomState.pearsonAcceptedCount !== expectedAcceptedInnovations) {
    throw new Error(
      "AF random state accepted-innovation count is inconsistent",
    );
  }

  if (nextSourceSequence === 0) {
    if (
      state.nextSourceSchedulingInterval !== null ||
      nextSourceActivationTimeSec !== firstSourceActivationTimeSec
    ) {
      throw new Error("AF sequence-zero anchor state is inconsistent");
    }
  } else {
    if (state.nextSourceSchedulingInterval === null) {
      throw new Error("AF generated next source lacks scheduling lineage");
    }
    validateSchedulingInterval(
      state.nextSourceSchedulingInterval,
      state.configuration,
    );
    if (
      state.nextSourceSchedulingInterval.toSourceSequence !==
        nextSourceSequence ||
      state.nextSourceSchedulingInterval.toActivationTimeSec !==
        nextSourceActivationTimeSec ||
      state.nextSourceSchedulingInterval.fromSourceSequence !==
        nextSourceSequence - 1
    ) {
      throw new Error("AF next-source scheduling lineage is inconsistent");
    }
    const expectedHistory =
      state.nextSourceSchedulingInterval.innovationVectorNewestFirstSec.slice(
        0,
        state.configuration.movingAverage.order,
      );
    if (
      expectedHistory.length !== history.length ||
      expectedHistory.some((innovation, index) => innovation !== history[index])
    ) {
      throw new Error(
        "AF innovation history and next-source scheduling lineage split",
      );
    }
    if (
      state.nextSourceSchedulingInterval.fromSourceSequence === 0 &&
      state.nextSourceSchedulingInterval.fromActivationTimeSec !==
        firstSourceActivationTimeSec
    ) {
      throw new Error("AF sequence-zero source-time lineage is inconsistent");
    }
  }
}

export function evaluateAcceptedAfAtrialSourceTrialV1(
  accepted: AcceptedAfAtrialSourceStateV1,
  candidateTimeSecInput: number,
): AcceptedAfAtrialSourceTrialV1 {
  validateAcceptedAfAtrialSourceStateV1(accepted);
  const candidateTimeSec = requireNonnegativeFinite(
    candidateTimeSecInput,
    "AF trial candidateTimeSec",
  );
  if (!(candidateTimeSec > accepted.acceptedTimeSec)) {
    throw new Error("AF trial candidateTimeSec must exceed acceptedTimeSec");
  }
  const candidateRevision = safeIncrement(
    accepted.revision,
    "AF state revision",
  );

  let nextSourceSequence = accepted.nextSourceSequence;
  let nextSourceActivationTimeSec = accepted.nextSourceActivationTimeSec;
  let nextSourceSchedulingInterval = accepted.nextSourceSchedulingInterval;
  let history = [...accepted.innovationHistoryNewestFirstSec];
  const random = mutableRandomStateFromAccepted(accepted.randomState);
  const sourceImpulses: SourceImpulseV2[] = [];
  const metadataBySourceImpulseId: Record<
    string,
    AfAtrialSourceImpulseMetadataV1
  > = Object.create(null) as Record<string, AfAtrialSourceImpulseMetadataV1>;
  const generatedIntervals: AfAtrialSchedulingIntervalV1[] = [];

  while (nextSourceActivationTimeSec <= candidateTimeSec) {
    if (sourceImpulses.length >= MAX_AF_SOURCE_IMPULSES_PER_TRIAL_V1) {
      throw new Error(
        `AF trial exceeds hard source-impulse bound ${MAX_AF_SOURCE_IMPULSES_PER_TRIAL_V1}; retry with a shorter accepted step`,
      );
    }
    const sourceImpulseId = afSourceImpulseId(
      accepted.configuration,
      nextSourceSequence,
    );
    const sourceImpulse = createSourceImpulseV2({
      sourceImpulseId,
      parentCapturedActivationId: null,
      chamber: "atrial",
      sourceKind: "primary-intrinsic",
      sourceId: accepted.configuration.sourceId,
      sourceSequence: nextSourceSequence,
      activationTimeSec: nextSourceActivationTimeSec,
    });
    sourceImpulses.push(sourceImpulse);
    metadataBySourceImpulseId[sourceImpulseId] = deepFreeze({
      metadataSchemaId: AF_ATRIAL_SOURCE_IMPULSE_METADATA_V1_ID,
      schemaVersion: 1 as const,
      configurationId: accepted.configuration.configurationId,
      ownerInstanceId: accepted.configuration.ownerInstanceId,
      sourceImpulseId,
      sourceSequence: nextSourceSequence,
      activationTimeSec: nextSourceActivationTimeSec,
      scheduledByInterval: nextSourceSchedulingInterval,
    });

    const generated = generateNextSchedulingInterval(
      accepted.configuration,
      random,
      history,
      sourceImpulse,
    );
    generatedIntervals.push(generated.interval);
    history = generated.nextHistory;
    nextSourceSequence = generated.interval.toSourceSequence;
    nextSourceActivationTimeSec = generated.interval.toActivationTimeSec;
    nextSourceSchedulingInterval = generated.interval;
  }

  const acceptedSourceImpulseCount = safeAdd(
    accepted.acceptedSourceImpulseCount,
    sourceImpulses.length,
    "AF accepted source impulse count",
  );
  const candidateState = deepFreeze({
    stateSchemaId: ACCEPTED_AF_ATRIAL_SOURCE_STATE_V1_ID,
    schemaVersion: 1 as const,
    configuration: accepted.configuration,
    initialAcceptedTimeSec: accepted.initialAcceptedTimeSec,
    firstSourceActivationTimeSec: accepted.firstSourceActivationTimeSec,
    revision: candidateRevision,
    acceptedTimeSec: candidateTimeSec,
    nextSourceSequence,
    nextSourceActivationTimeSec,
    acceptedSourceImpulseCount,
    innovationHistoryNewestFirstSec: history,
    randomState: freezeRandomState(random),
    nextSourceSchedulingInterval,
  }) satisfies AcceptedAfAtrialSourceStateV1;
  validateAcceptedAfAtrialSourceStateV1(candidateState);

  return deepFreeze({
    trialSchemaId: ACCEPTED_AF_ATRIAL_SOURCE_TRIAL_V1_ID,
    schemaVersion: 1 as const,
    configurationId: accepted.configuration.configurationId,
    ownerInstanceId: accepted.configuration.ownerInstanceId,
    baseRevision: accepted.revision,
    candidateRevision,
    startTimeSec: accepted.acceptedTimeSec,
    candidateTimeSec,
    processedSourceImpulseCount: sourceImpulses.length,
    sourceImpulses,
    metadataBySourceImpulseId,
    generatedIntervals,
    candidateState,
  });
}

export function commitAcceptedAfAtrialSourceTrialV1(
  accepted: AcceptedAfAtrialSourceStateV1,
  trial: AcceptedAfAtrialSourceTrialV1,
): AcceptedAfAtrialSourceStateV1 {
  validateAcceptedAfAtrialSourceStateV1(accepted);
  const trialRecord = requirePlainRecord(trial, "AF atrial source trial");
  requireExactKeys(trialRecord, TRIAL_KEYS, "AF atrial source trial");
  if (
    trial.trialSchemaId !== ACCEPTED_AF_ATRIAL_SOURCE_TRIAL_V1_ID ||
    trial.schemaVersion !== 1
  ) {
    throw new Error("unsupported AF atrial source trial schema");
  }
  const recomputed = evaluateAcceptedAfAtrialSourceTrialV1(
    accepted,
    trial.candidateTimeSec,
  );
  if (canonicalJsonStringify(recomputed) !== canonicalJsonStringify(trial)) {
    throw new Error("AF atrial source trial does not match its accepted base");
  }
  return recomputed.candidateState;
}

export function rollbackAcceptedAfAtrialSourceTrialV1(
  accepted: AcceptedAfAtrialSourceStateV1,
  _trial: AcceptedAfAtrialSourceTrialV1,
): AcceptedAfAtrialSourceStateV1 {
  validateAcceptedAfAtrialSourceStateV1(accepted);
  return accepted;
}

export function maximumAcceptedAfAtrialSourceStepV1(
  accepted: AcceptedAfAtrialSourceStateV1,
  requestedStepSecInput: number,
): AcceptedAfAtrialSourceMaximumStepV1 {
  validateAcceptedAfAtrialSourceStateV1(accepted);
  const requestedStepSec = requirePositiveFinite(
    requestedStepSecInput,
    "AF requestedStepSec",
  );
  const requestedEndTimeSec = normalizeFinite(
    accepted.acceptedTimeSec + requestedStepSec,
    "AF requested end time",
  );
  const clippedBySourceImpulse =
    accepted.nextSourceActivationTimeSec <= requestedEndTimeSec;
  const candidateTimeSec = clippedBySourceImpulse
    ? accepted.nextSourceActivationTimeSec
    : requestedEndTimeSec;
  return Object.freeze({
    requestedStepSec,
    requestedEndTimeSec,
    maximumStepSec: normalizeFinite(
      candidateTimeSec - accepted.acceptedTimeSec,
      "AF maximumStepSec",
    ),
    candidateTimeSec,
    clippedBySourceImpulse,
    boundarySourceImpulseId: clippedBySourceImpulse
      ? afSourceImpulseId(accepted.configuration, accepted.nextSourceSequence)
      : null,
    boundarySourceSequence: clippedBySourceImpulse
      ? accepted.nextSourceSequence
      : null,
    boundaryActivationTimeSec: clippedBySourceImpulse
      ? accepted.nextSourceActivationTimeSec
      : null,
  });
}

export function canonicalAcceptedAfAtrialSourceIdentityV1(
  configuration: AcceptedAfAtrialSourceConfigurationV1,
): AcceptedAfAtrialSourceIdentityV1 {
  validateAcceptedAfAtrialSourceConfigurationV1(configuration);
  return deepFreeze({
    identitySchemaId: ACCEPTED_AF_ATRIAL_SOURCE_IDENTITY_V1_ID,
    schemaVersion: 1 as const,
    configuration,
    constructionClaim: ACCEPTED_AF_ATRIAL_SOURCE_CLAIM_V1,
  });
}

export async function sha256AcceptedAfAtrialSourceIdentityV1(
  configuration: AcceptedAfAtrialSourceConfigurationV1,
): Promise<string> {
  return sha256CanonicalJsonHex(
    canonicalAcceptedAfAtrialSourceIdentityV1(configuration),
  );
}

function derivePearsonTypeIvParameters(
  input: AfPearsonTypeIvMomentsInputV1,
): AfPearsonTypeIvParametersV1 {
  const meanSec = requirePositiveFinite(input.meanSec, "AF Pearson meanSec");
  const standardDeviationSec = requirePositiveFinite(
    input.standardDeviationSec,
    "AF Pearson standardDeviationSec",
  );
  const skewness = normalizeFinite(input.skewness, "AF Pearson skewness");
  const kurtosis = normalizeFinite(input.kurtosis, "AF Pearson kurtosis");
  if (skewness === 0) {
    throw new Error(
      "AF Pearson skewness must be nonzero for the strict Type-IV criterion",
    );
  }
  const varianceSec2 = normalizeFinite(
    standardDeviationSec * standardDeviationSec,
    "AF Pearson variance",
  );
  const skewness2 = skewness * skewness;
  const criterionDenominator =
    4 * (4 * kurtosis - 3 * skewness2) * (2 * kurtosis - 3 * skewness2 - 6);
  const pearsonTypeIvCriterion = normalizeFinite(
    (skewness2 * (kurtosis + 3) ** 2) / criterionDenominator,
    "AF Pearson Type-IV criterion",
  );
  if (!(pearsonTypeIvCriterion > 0 && pearsonTypeIvCriterion < 1)) {
    throw new Error(
      "AF parent moments do not satisfy the strict Climent Eq. 8 Pearson Type-IV criterion 0 < j < 1",
    );
  }

  const r = normalizeFinite(
    (6 * (kurtosis - skewness2 - 1)) / (2 * kurtosis - 3 * skewness2 - 6),
    "AF Pearson r",
  );
  if (!(r > 3)) {
    throw new Error(
      "AF Pearson Type-IV r must exceed 3 for a finite fourth moment",
    );
  }
  const lambda1ShapeExponent = normalizeFinite(
    (r + 2) / 2,
    "AF Pearson lambda1",
  );
  const lambda2DenominatorSquared = 16 * (r - 1) - skewness2 * (r - 2) ** 2;
  if (!(lambda2DenominatorSquared > 0)) {
    throw new Error("AF Pearson lambda2 denominator must be positive");
  }
  const lambda2SkewExponent = normalizeFinite(
    (-r * (r - 2) * skewness) / Math.sqrt(lambda2DenominatorSquared),
    "AF Pearson lambda2",
  );
  const lambda3Squared =
    varianceSec2 * (r - 1 - (skewness2 * (r - 2) ** 2) / 16);
  if (!(lambda3Squared > 0)) {
    throw new Error("AF Pearson lambda3 squared scale must be positive");
  }
  const lambda3ScaleSec = normalizeFinite(
    Math.sqrt(lambda3Squared),
    "AF Pearson lambda3",
  );
  const lambda4LocationSec = normalizeFinite(
    meanSec - ((r - 2) * skewness * standardDeviationSec) / 4,
    "AF Pearson lambda4",
  );

  return deepFreeze({
    parametersSchemaId: AF_PEARSON_TYPE_IV_PARAMETERS_V1_ID,
    schemaVersion: 1 as const,
    moments: {
      momentsSchemaId: AF_PEARSON_TYPE_IV_MOMENTS_V1_ID,
      schemaVersion: 1 as const,
      meanSec,
      varianceSec2,
      standardDeviationSec,
      skewness,
      kurtosis,
    },
    pearsonTypeIvCriterion,
    r,
    lambda1ShapeExponent,
    lambda2SkewExponent,
    lambda3ScaleSec,
    lambda4LocationSec,
  });
}

function createMovingAverageFilter(
  input: readonly number[],
): AfMovingAverageFilterV1 {
  const coefficients = requireDenseArray(
    input,
    "AF moving-average coefficients",
  ).map((coefficient, index) =>
    normalizeFinite(coefficient, `AF moving-average coefficient[${index}]`),
  );
  if (
    coefficients.length < 1 ||
    coefficients.length > MAX_AF_MOVING_AVERAGE_COEFFICIENT_COUNT_V1
  ) {
    throw new Error(
      `AF moving-average coefficient count must be 1..${MAX_AF_MOVING_AVERAGE_COEFFICIENT_COUNT_V1}`,
    );
  }
  for (const [index, coefficient] of coefficients.entries()) {
    if (coefficient < 0) {
      throw new Error(
        `AF moving-average coefficient[${index}] must be nonnegative; negative autocorrelation is outside V1`,
      );
    }
  }
  if (!(coefficients[0]! > 0)) {
    throw new Error("AF moving-average coefficient c0 must be positive");
  }
  const dcGain = normalizeFinite(
    compensatedFiniteSum(coefficients, "AF moving-average DC gain"),
    "AF moving-average DC gain",
  );
  if (Math.abs(dcGain - 1) > AF_MOVING_AVERAGE_UNIT_DC_ABSOLUTE_TOLERANCE_V1) {
    throw new Error(
      `AF moving-average coefficients must have unit DC gain within fixed absolute tolerance ${AF_MOVING_AVERAGE_UNIT_DC_ABSOLUTE_TOLERANCE_V1}; coefficients are never silently normalized`,
    );
  }
  const innovationVarianceGain = normalizeFinite(
    compensatedFiniteSum(
      coefficients.map((coefficient) => coefficient * coefficient),
      "AF moving-average innovation variance gain",
    ),
    "AF moving-average innovation variance gain",
  );
  if (!(innovationVarianceGain > 0)) {
    throw new Error("AF moving-average variance gain must be positive");
  }
  const theoreticalAutocorrelation = coefficients.map((_, lag) => {
    const covarianceTerms: number[] = [];
    for (let index = 0; index + lag < coefficients.length; index += 1) {
      covarianceTerms.push(coefficients[index]! * coefficients[index + lag]!);
    }
    const covarianceGain = compensatedFiniteSum(
      covarianceTerms,
      `AF moving-average covariance gain lag ${lag}`,
    );
    return normalizeFinite(
      covarianceGain / innovationVarianceGain,
      `AF moving-average theoretical autocorrelation lag ${lag}`,
    );
  });
  return deepFreeze({
    filterSchemaId: AF_MOVING_AVERAGE_FILTER_V1_ID,
    schemaVersion: 1 as const,
    coefficients,
    order: coefficients.length - 1,
    dcGain: normalizeFinite(dcGain, "AF moving-average DC gain"),
    innovationVarianceGain,
    filteredStandardDeviationScale: normalizeFinite(
      Math.sqrt(innovationVarianceGain),
      "AF filtered standard-deviation scale",
    ),
    theoreticalAutocorrelation,
  });
}

function generateNextSchedulingInterval(
  configuration: AcceptedAfAtrialSourceConfigurationV1,
  random: MutableRandomState,
  history: readonly number[],
  sourceImpulse: SourceImpulseV2,
): Readonly<{
  interval: AfAtrialSchedulingIntervalV1;
  nextHistory: number[];
}> {
  const proposalBefore = random.pearsonProposalCount;
  const gammaAttemptBefore = random.gammaAttemptCount;
  const tiltRejectedBefore = random.pearsonTiltRejectedCount;
  const nonpositiveParentRejectedBefore =
    random.pearsonNonpositiveParentRejectedCount;
  const pearsonInnovationSec = samplePositiveConditionedPearsonInnovation(
    configuration,
    random,
  );
  const innovationVectorNewestFirstSec = [pearsonInnovationSec, ...history];
  if (
    innovationVectorNewestFirstSec.length !==
    configuration.movingAverage.coefficients.length
  ) {
    throw new Error("AF moving-average innovation vector length mismatch");
  }
  const movingAverageTermsSec = configuration.movingAverage.coefficients.map(
    (coefficient, index) =>
      normalizeFinite(
        coefficient * innovationVectorNewestFirstSec[index]!,
        `AF moving-average term[${index}]`,
      ),
  );
  const aaIntervalSec = normalizeFinite(
    compensatedFiniteSum(movingAverageTermsSec, "AF filtered AA interval"),
    "AF filtered AA interval",
  );
  if (!(aaIntervalSec > 0)) {
    throw new Error(
      "AF positive-conditioned innovation and nonnegative moving-average filter failed to produce a positive AA interval",
    );
  }
  const toSourceSequence = safeIncrement(
    sourceImpulse.sourceSequence,
    "AF next source sequence",
  );
  const toActivationTimeSec = normalizeFinite(
    sourceImpulse.activationTimeSec + aaIntervalSec,
    "AF next source activation time",
  );
  if (!(toActivationTimeSec > sourceImpulse.activationTimeSec)) {
    throw new Error("AF generated source time did not advance strictly");
  }
  const interval = deepFreeze({
    intervalSchemaId: AF_ATRIAL_SCHEDULING_INTERVAL_V1_ID,
    schemaVersion: 1 as const,
    fromSourceImpulseId: sourceImpulse.sourceImpulseId,
    fromSourceSequence: sourceImpulse.sourceSequence,
    fromActivationTimeSec: sourceImpulse.activationTimeSec,
    toSourceSequence,
    toActivationTimeSec,
    pearsonInnovationSec,
    innovationVectorNewestFirstSec,
    movingAverageTermsSec,
    aaIntervalSec,
    pearsonProposalCountForInnovation:
      random.pearsonProposalCount - proposalBefore,
    gammaAttemptCountForInnovation:
      random.gammaAttemptCount - gammaAttemptBefore,
    pearsonTiltRejectedCountForInnovation:
      random.pearsonTiltRejectedCount - tiltRejectedBefore,
    pearsonNonpositiveParentRejectedCountForInnovation:
      random.pearsonNonpositiveParentRejectedCount -
      nonpositiveParentRejectedBefore,
  });
  validateSchedulingInterval(interval, configuration);
  return Object.freeze({
    interval,
    nextHistory: innovationVectorNewestFirstSec.slice(
      0,
      configuration.movingAverage.order,
    ),
  });
}

function validateSchedulingInterval(
  interval: AfAtrialSchedulingIntervalV1,
  configuration: AcceptedAfAtrialSourceConfigurationV1,
): void {
  const record = requirePlainRecord(interval, "AF scheduling interval");
  requireExactKeys(record, INTERVAL_KEYS, "AF scheduling interval");
  if (
    interval.intervalSchemaId !== AF_ATRIAL_SCHEDULING_INTERVAL_V1_ID ||
    interval.schemaVersion !== 1
  ) {
    throw new Error("unsupported AF scheduling interval schema");
  }
  requireNonemptyString(interval.fromSourceImpulseId, "AF interval source id");
  const fromSourceSequence = requireNonnegativeSafeInteger(
    interval.fromSourceSequence,
    "AF interval from source sequence",
  );
  if (
    interval.fromSourceImpulseId !==
    afSourceImpulseId(configuration, fromSourceSequence)
  ) {
    throw new Error("AF interval source impulse id is not canonical");
  }
  if (
    interval.toSourceSequence !==
    safeIncrement(fromSourceSequence, "AF interval to source sequence")
  ) {
    throw new Error("AF interval source sequences are not consecutive");
  }
  const fromTime = normalizeFinite(
    interval.fromActivationTimeSec,
    "AF interval from activation time",
  );
  const toTime = normalizeFinite(
    interval.toActivationTimeSec,
    "AF interval to activation time",
  );
  const innovation = normalizeFinite(
    interval.pearsonInnovationSec,
    "AF interval Pearson innovation",
  );
  const aaInterval = normalizeFinite(interval.aaIntervalSec, "AF interval AA");
  if (!(innovation > 0) || !(aaInterval > 0) || !(toTime > fromTime)) {
    throw new Error("AF scheduling interval must be strictly positive");
  }
  if (toTime !== fromTime + aaInterval) {
    throw new Error("AF scheduling interval clock arithmetic is inconsistent");
  }
  const innovations = requireDenseArray(
    interval.innovationVectorNewestFirstSec,
    "AF interval innovation vector",
  );
  const terms = requireDenseArray(
    interval.movingAverageTermsSec,
    "AF interval moving-average terms",
  );
  if (
    innovations.length !== configuration.movingAverage.coefficients.length ||
    terms.length !== innovations.length ||
    innovations[0] !== innovation
  ) {
    throw new Error(
      "AF scheduling interval vector dimensions are inconsistent",
    );
  }
  const validatedTerms: number[] = [];
  for (let index = 0; index < innovations.length; index += 1) {
    if (
      !(
        normalizeFinite(
          innovations[index],
          `AF interval innovation[${index}]`,
        ) > 0
      )
    ) {
      throw new Error("AF scheduling interval innovations must be positive");
    }
    const expectedTerm =
      configuration.movingAverage.coefficients[index]! * innovations[index]!;
    if (terms[index] !== expectedTerm) {
      throw new Error("AF scheduling interval moving-average term mismatch");
    }
    validatedTerms.push(
      normalizeFinite(terms[index], `AF interval term[${index}]`),
    );
  }
  const sum = compensatedFiniteSum(
    validatedTerms,
    "AF scheduling interval moving-average sum",
  );
  if (aaInterval !== sum) {
    throw new Error("AF scheduling interval moving-average sum mismatch");
  }
  const proposals = requirePositiveSafeInteger(
    interval.pearsonProposalCountForInnovation,
    "AF interval Pearson proposal count",
  );
  const gammaAttempts = requirePositiveSafeInteger(
    interval.gammaAttemptCountForInnovation,
    "AF interval Gamma attempt count",
  );
  if (
    proposals > MAX_AF_PEARSON_PROPOSALS_PER_INNOVATION_V1 ||
    gammaAttempts < proposals ||
    gammaAttempts > proposals * MAX_AF_GAMMA_ATTEMPTS_PER_DRAW_V1
  ) {
    throw new Error(
      "AF interval Gamma-attempt and Pearson-proposal bounds are inconsistent",
    );
  }
  const rejects = requireNonnegativeSafeInteger(
    interval.pearsonTiltRejectedCountForInnovation,
    "AF interval Pearson tilt reject count",
  );
  const nonpositiveParentRejects = requireNonnegativeSafeInteger(
    interval.pearsonNonpositiveParentRejectedCountForInnovation,
    "AF interval Pearson nonpositive-parent reject count",
  );
  const accountedProposals = safeAdd(
    safeAdd(
      rejects,
      nonpositiveParentRejects,
      "AF interval rejected Pearson proposal count",
    ),
    1,
    "AF interval accounted Pearson proposal count",
  );
  if (accountedProposals !== proposals) {
    throw new Error("AF interval Pearson rejection counts are inconsistent");
  }
}

function initializeMutableRandomState(seedUint32: number): MutableRandomState {
  let cursor = seedUint32 >>> 0;
  const nextSeedWord = (): number => {
    cursor = (cursor + 0x9e3779b9) >>> 0;
    let word = cursor;
    word = Math.imul(word ^ (word >>> 16), 0x21f0aaad) >>> 0;
    word = Math.imul(word ^ (word >>> 15), 0x735a2d97) >>> 0;
    return (word ^ (word >>> 15)) >>> 0;
  };
  const random: MutableRandomState = {
    state0: nextSeedWord(),
    state1: nextSeedWord(),
    state2: nextSeedWord(),
    state3: nextSeedWord(),
    gaussianSpare: null,
    uint32DrawCount: 0,
    normalDrawCount: 0,
    gammaDrawCount: 0,
    gammaAttemptCount: 0,
    pearsonProposalCount: 0,
    pearsonAcceptedCount: 0,
    pearsonTiltRejectedCount: 0,
    pearsonNonpositiveParentRejectedCount: 0,
  };
  if ((random.state0 | random.state1 | random.state2 | random.state3) === 0) {
    // xoshiro's only forbidden state. This deterministic replacement is part
    // of the declared seed expansion, not a stochastic fallback.
    random.state3 = 0x9e3779b9;
  }
  return random;
}

function mutableRandomStateFromAccepted(
  accepted: AfDeterministicRandomStateV1,
): MutableRandomState {
  validateRandomState(accepted);
  return {
    state0: accepted.state0,
    state1: accepted.state1,
    state2: accepted.state2,
    state3: accepted.state3,
    gaussianSpare: accepted.gaussianSpare,
    uint32DrawCount: accepted.uint32DrawCount,
    normalDrawCount: accepted.normalDrawCount,
    gammaDrawCount: accepted.gammaDrawCount,
    gammaAttemptCount: accepted.gammaAttemptCount,
    pearsonProposalCount: accepted.pearsonProposalCount,
    pearsonAcceptedCount: accepted.pearsonAcceptedCount,
    pearsonTiltRejectedCount: accepted.pearsonTiltRejectedCount,
    pearsonNonpositiveParentRejectedCount:
      accepted.pearsonNonpositiveParentRejectedCount,
  };
}

function freezeRandomState(
  random: MutableRandomState,
): AfDeterministicRandomStateV1 {
  return Object.freeze({
    randomStateSchemaId: AF_DETERMINISTIC_RANDOM_STATE_V1_ID,
    schemaVersion: 1 as const,
    algorithmId:
      "xoshiro128-star-star-box-muller-marsaglia-tsang-positive-conditioned-v1" as const,
    state0: random.state0,
    state1: random.state1,
    state2: random.state2,
    state3: random.state3,
    gaussianSpare: random.gaussianSpare,
    uint32DrawCount: random.uint32DrawCount,
    normalDrawCount: random.normalDrawCount,
    gammaDrawCount: random.gammaDrawCount,
    gammaAttemptCount: random.gammaAttemptCount,
    pearsonProposalCount: random.pearsonProposalCount,
    pearsonAcceptedCount: random.pearsonAcceptedCount,
    pearsonTiltRejectedCount: random.pearsonTiltRejectedCount,
    pearsonNonpositiveParentRejectedCount:
      random.pearsonNonpositiveParentRejectedCount,
  });
}

function validateRandomState(random: AfDeterministicRandomStateV1): void {
  const record = requirePlainRecord(random, "AF deterministic random state");
  requireExactKeys(record, RANDOM_STATE_KEYS, "AF deterministic random state");
  if (
    random.randomStateSchemaId !== AF_DETERMINISTIC_RANDOM_STATE_V1_ID ||
    random.schemaVersion !== 1 ||
    random.algorithmId !==
      "xoshiro128-star-star-box-muller-marsaglia-tsang-positive-conditioned-v1"
  ) {
    throw new Error("unsupported AF deterministic random-state schema");
  }
  const words = [random.state0, random.state1, random.state2, random.state3];
  words.forEach((word, index) =>
    requireUint32(word, `AF random state${index}`),
  );
  if ((words[0]! | words[1]! | words[2]! | words[3]!) === 0) {
    throw new Error("AF xoshiro random state may not be all zero");
  }
  if (random.gaussianSpare !== null) {
    normalizeFinite(random.gaussianSpare, "AF Gaussian spare");
  }
  const counters = [
    [random.uint32DrawCount, "uint32 draw count"],
    [random.normalDrawCount, "normal draw count"],
    [random.gammaDrawCount, "gamma draw count"],
    [random.gammaAttemptCount, "Gamma attempt count"],
    [random.pearsonProposalCount, "Pearson proposal count"],
    [random.pearsonAcceptedCount, "Pearson accepted count"],
    [random.pearsonTiltRejectedCount, "Pearson tilt reject count"],
    [
      random.pearsonNonpositiveParentRejectedCount,
      "Pearson nonpositive-parent reject count",
    ],
  ] as const;
  for (const [value, label] of counters) {
    requireNonnegativeSafeInteger(value, `AF ${label}`);
  }
  const expectedNormalDrawCount = safeAdd(
    random.pearsonProposalCount,
    random.gammaAttemptCount,
    "AF expected normal draw count",
  );
  if (
    random.gammaDrawCount !== random.pearsonProposalCount ||
    random.gammaAttemptCount < random.gammaDrawCount ||
    (random.gammaDrawCount === 0
      ? random.gammaAttemptCount !== 0
      : Math.ceil(
          random.gammaAttemptCount / MAX_AF_GAMMA_ATTEMPTS_PER_DRAW_V1,
        ) > random.gammaDrawCount) ||
    random.normalDrawCount !== expectedNormalDrawCount ||
    !Number.isSafeInteger(
      random.pearsonAcceptedCount +
        random.pearsonTiltRejectedCount +
        random.pearsonNonpositiveParentRejectedCount,
    ) ||
    random.pearsonAcceptedCount +
      random.pearsonTiltRejectedCount +
      random.pearsonNonpositiveParentRejectedCount !==
      random.pearsonProposalCount
  ) {
    throw new Error("AF Pearson random counters are inconsistent");
  }
}

function samplePositiveConditionedPearsonInnovation(
  configuration: AcceptedAfAtrialSourceConfigurationV1,
  random: MutableRandomState,
): number {
  const parameters = configuration.pearsonTypeIv;
  // With y = Z/sqrt(2G), Z~N(0,1) and G~Gamma(m-1/2,1), the
  // proposal density is q(y) proportional to (1+y^2)^(-m). The remaining
  // Pearson-IV tilt is exp(-nu*atan(y)); because |atan(y)| < pi/2, dividing
  // by exp(|nu|*pi/2) gives a valid acceptance probability for every y.
  // A tilt-accepted draw is an exact draw from the unconditioned Climent
  // parent. Rejecting it iff x <= 0 therefore gives the exact conditional
  // parent law X | X > 0. Both rejection causes consume the same total bound.
  const gammaShape = parameters.lambda1ShapeExponent - 0.5;
  const absoluteTiltBound =
    (Math.abs(parameters.lambda2SkewExponent) * Math.PI) / 2;
  for (
    let attempt = 1;
    attempt <= MAX_AF_PEARSON_PROPOSALS_PER_INNOVATION_V1;
    attempt += 1
  ) {
    random.pearsonProposalCount = safeIncrement(
      random.pearsonProposalCount,
      "AF Pearson proposal count",
    );
    const gaussian = sampleStandardNormal(random);
    const gamma = sampleUnitScaleGamma(gammaShape, random);
    const standardized = gaussian / Math.sqrt(2 * gamma);
    const logAcceptance =
      -parameters.lambda2SkewExponent * Math.atan(standardized) -
      absoluteTiltBound;
    if (Math.log(nextOpenUniform(random)) > logAcceptance) {
      random.pearsonTiltRejectedCount = safeIncrement(
        random.pearsonTiltRejectedCount,
        "AF Pearson tilt reject count",
      );
      continue;
    }
    const parentValue = normalizeFinite(
      parameters.lambda4LocationSec + parameters.lambda3ScaleSec * standardized,
      "AF unconditioned Pearson-IV parent draw",
    );
    if (!(parentValue > 0)) {
      random.pearsonNonpositiveParentRejectedCount = safeIncrement(
        random.pearsonNonpositiveParentRejectedCount,
        "AF Pearson nonpositive-parent reject count",
      );
      continue;
    }
    random.pearsonAcceptedCount = safeIncrement(
      random.pearsonAcceptedCount,
      "AF positive-conditioned Pearson accepted count",
    );
    return parentValue;
  }
  throw new Error(
    `AF positive-conditioned Pearson-IV sampler exceeded total hard proposal bound ${MAX_AF_PEARSON_PROPOSALS_PER_INNOVATION_V1}`,
  );
}

type AfUnitScaleGammaSources = Readonly<{
  onAttempt: () => void;
  nextStandardNormal: () => number;
  nextOpenUniform: () => number;
}>;

/**
 * Pure deterministic seam for proving the production Gamma loop's hard bound.
 * Repeated constants are injected into the same bounded core; this is neither
 * a production random source nor a physiological configuration surface.
 */
export function sampleAfUnitScaleGammaWithConstantSourcesForVerificationV1(
  shape: number,
  standardNormal: number,
  openUniform: number,
): number {
  const injectedNormal = normalizeFinite(
    standardNormal,
    "AF injected Gamma standard normal",
  );
  const injectedUniform = normalizeFinite(
    openUniform,
    "AF injected Gamma open uniform",
  );
  if (!(injectedUniform > 0 && injectedUniform < 1)) {
    throw new Error("AF injected Gamma open uniform must be strictly in (0,1)");
  }
  return sampleUnitScaleGammaFromSources(shape, {
    onAttempt: () => undefined,
    nextStandardNormal: () => injectedNormal,
    nextOpenUniform: () => injectedUniform,
  });
}

function sampleUnitScaleGamma(
  shape: number,
  random: MutableRandomState,
): number {
  random.gammaDrawCount = safeIncrement(
    random.gammaDrawCount,
    "AF gamma draw count",
  );
  return sampleUnitScaleGammaFromSources(shape, {
    onAttempt: () => {
      random.gammaAttemptCount = safeIncrement(
        random.gammaAttemptCount,
        "AF Gamma attempt count",
      );
    },
    nextStandardNormal: () => sampleStandardNormal(random),
    nextOpenUniform: () => nextOpenUniform(random),
  });
}

function sampleUnitScaleGammaFromSources(
  shape: number,
  sources: AfUnitScaleGammaSources,
): number {
  if (!(shape >= 1) || !Number.isFinite(shape)) {
    throw new Error("AF gamma shape must be finite and at least one");
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (
    let attempt = 1;
    attempt <= MAX_AF_GAMMA_ATTEMPTS_PER_DRAW_V1;
    attempt += 1
  ) {
    sources.onAttempt();
    const normal = normalizeFinite(
      sources.nextStandardNormal(),
      "AF Gamma standard-normal source",
    );
    const onePlus = 1 + c * normal;
    if (!(onePlus > 0)) {
      continue;
    }
    const v = onePlus * onePlus * onePlus;
    const uniform = normalizeFinite(
      sources.nextOpenUniform(),
      "AF Gamma open-uniform source",
    );
    if (!(uniform > 0 && uniform < 1)) {
      throw new Error("AF Gamma open-uniform source must be strictly in (0,1)");
    }
    if (
      uniform < 1 - 0.0331 * normal ** 4 ||
      Math.log(uniform) < 0.5 * normal * normal + d * (1 - v + Math.log(v))
    ) {
      return d * v;
    }
  }
  throw new Error(
    `AF Marsaglia--Tsang Gamma sampler exceeded per-draw hard attempt bound ${MAX_AF_GAMMA_ATTEMPTS_PER_DRAW_V1}; no Gamma or AA value was substituted`,
  );
}

function sampleStandardNormal(random: MutableRandomState): number {
  random.normalDrawCount = safeIncrement(
    random.normalDrawCount,
    "AF normal draw count",
  );
  if (random.gaussianSpare !== null) {
    const spare = random.gaussianSpare;
    random.gaussianSpare = null;
    return spare;
  }
  const radius = Math.sqrt(-2 * Math.log(nextOpenUniform(random)));
  const angle = 2 * Math.PI * nextOpenUniform(random);
  random.gaussianSpare = radius * Math.sin(angle);
  return radius * Math.cos(angle);
}

function nextOpenUniform(random: MutableRandomState): number {
  const word = nextUint32(random);
  return (word + 0.5) / 4_294_967_296;
}

function nextUint32(random: MutableRandomState): number {
  random.uint32DrawCount = safeIncrement(
    random.uint32DrawCount,
    "AF uint32 draw count",
  );
  const result =
    Math.imul(rotateLeft32(Math.imul(random.state1, 5), 7), 9) >>> 0;
  const t = (random.state1 << 9) >>> 0;
  random.state2 = (random.state2 ^ random.state0) >>> 0;
  random.state3 = (random.state3 ^ random.state1) >>> 0;
  random.state1 = (random.state1 ^ random.state2) >>> 0;
  random.state0 = (random.state0 ^ random.state3) >>> 0;
  random.state2 = (random.state2 ^ t) >>> 0;
  random.state3 = rotateLeft32(random.state3, 11);
  return result;
}

function rotateLeft32(value: number, shift: number): number {
  return ((value << shift) | (value >>> (32 - shift))) >>> 0;
}

function afSourceImpulseId(
  configuration: AcceptedAfAtrialSourceConfigurationV1,
  sourceSequence: number,
): string {
  return `${configuration.ownerInstanceId}:af-atrial-source:${sourceSequence}`;
}

function safeIncrement(value: number, field: string): number {
  return safeAdd(value, 1, field);
}

function safeAdd(left: number, right: number, field: string): number {
  const result = left + right;
  if (!Number.isSafeInteger(result) || result < 0) {
    throw new Error(`${field} cannot be incremented safely`);
  }
  return result;
}

function requirePositiveSafeInteger(value: number, field: string): number {
  const integer = requireNonnegativeSafeInteger(value, field);
  if (integer === 0) {
    throw new Error(`${field} must be positive`);
  }
  return integer;
}

function requireNonnegativeSafeInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a nonnegative safe integer`);
  }
  return value;
}

function requireUint32(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0 || value > 0xffff_ffff) {
    throw new Error(`${field} must be an unsigned 32-bit integer`);
  }
  return value;
}

function requirePositiveFinite(value: number, field: string): number {
  const finite = normalizeFinite(value, field);
  if (!(finite > 0)) {
    throw new Error(`${field} must be positive`);
  }
  return finite;
}

function requireNonnegativeFinite(value: number, field: string): number {
  const finite = normalizeFinite(value, field);
  if (finite < 0) {
    throw new Error(`${field} must be nonnegative`);
  }
  return finite;
}

/** Neumaier compensated sum with a finite check at every arithmetic boundary. */
function compensatedFiniteSum(
  values: readonly number[],
  field: string,
): number {
  let sum = 0;
  let correction = 0;
  for (const [index, input] of values.entries()) {
    const value = normalizeFinite(input, `${field}[${index}]`);
    const next = normalizeFinite(sum + value, `${field} partial sum`);
    const increment =
      Math.abs(sum) >= Math.abs(value)
        ? sum - next + value
        : value - next + sum;
    correction = normalizeFinite(
      correction + increment,
      `${field} compensation`,
    );
    sum = next;
  }
  return normalizeFinite(sum + correction, field);
}

function normalizeFinite(value: number, field: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${field} must be finite`);
  }
  return Object.is(value, -0) ? 0 : value;
}

function requireNonemptyString(value: string, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${field} must be a nonempty string`);
  }
  return value;
}

function requireDenseArray<T>(value: readonly T[], field: string): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`${field} must be an array`);
  }
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.prototype.hasOwnProperty.call(value, index)) {
      throw new Error(`${field} must be dense`);
    }
  }
  return [...value];
}

function requirePlainRecord(
  value: unknown,
  field: string,
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${field} must be a plain object`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`${field} must be a plain object`);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  field: string,
): void {
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (
    actual.length !== required.length ||
    actual.some((key, index) => key !== required[index])
  ) {
    throw new Error(`${field} keys are invalid`);
  }
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}
