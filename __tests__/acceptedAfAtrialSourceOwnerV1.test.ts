import { describe, expect, it } from "vitest";

import {
  ACCEPTED_AF_ATRIAL_SOURCE_CLAIM_V1,
  AF_MOVING_AVERAGE_UNIT_DC_ABSOLUTE_TOLERANCE_V1,
  MAX_AF_GAMMA_ATTEMPTS_PER_DRAW_V1,
  MAX_AF_PEARSON_PROPOSALS_PER_INNOVATION_V1,
  commitAcceptedAfAtrialSourceTrialV1,
  createAcceptedAfAtrialSourceConfigurationV1,
  evaluateAcceptedAfAtrialSourceTrialV1,
  initializeAcceptedAfAtrialSourceStateV1,
  maximumAcceptedAfAtrialSourceStepV1,
  rollbackAcceptedAfAtrialSourceTrialV1,
  sampleAfUnitScaleGammaWithConstantSourcesForVerificationV1,
  sha256AcceptedAfAtrialSourceIdentityV1,
  type AcceptedAfAtrialSourceConfigurationV1,
  type AcceptedAfAtrialSourceStateV1,
  type AfAtrialSchedulingIntervalV1,
} from "@/engine/myocardium/rhythm/acceptedAfAtrialSourceOwnerV1";

describe("accepted stationary AF atrial source owner V1", () => {
  it("matches independent Climent Pearson-IV gold values and reports the MA-induced ACF", () => {
    const configuration = makeConfiguration(17, [0.82, 0.18]);
    const pearson = configuration.pearsonTypeIv;

    // Independently evaluated from Climent Eqs. 2--8, not copied from this
    // implementation. These values catch sign, scale and excess/nonexcess
    // kurtosis transcription errors that directional assertions cannot.
    expect(pearson.pearsonTypeIvCriterion).toBeCloseTo(0.20254054822764234, 14);
    expect(pearson.r).toBeCloseTo(5.453689167974884, 14);
    expect(pearson.lambda1ShapeExponent).toBeCloseTo(3.726844583987442, 14);
    expect(pearson.lambda2SkewExponent).toBeCloseTo(-2.7484767495606097, 14);
    expect(pearson.lambda3ScaleSec).toBeCloseTo(0.04146072933237843, 14);
    expect(pearson.lambda4LocationSec).toBeCloseTo(0.13410518053375195, 14);
    expect(configuration.movingAverage.dcGain).toBeCloseTo(1, 15);
    expect(configuration.movingAverage.theoreticalAutocorrelation[0]).toBe(1);
    expect(
      configuration.movingAverage.theoreticalAutocorrelation[1],
    ).toBeCloseTo(0.2094211123723042, 15);
    expect(configuration.movingAverage.theoreticalAutocorrelation).toHaveLength(
      2,
    );

    expect(ACCEPTED_AF_ATRIAL_SOURCE_CLAIM_V1.filteredMarginalClaim).toMatch(
      /^not-exactly-conditioned-Pearson-IV/,
    );
    expect(
      ACCEPTED_AF_ATRIAL_SOURCE_CLAIM_V1.positiveConditioning
        .parentMomentsPreservedExactlyClaimed,
    ).toBe(false);
    expect(
      ACCEPTED_AF_ATRIAL_SOURCE_CLAIM_V1.positiveConditioning
        .exactConditionalRejectionLawClaimed,
    ).toBe(true);
    expect(
      ACCEPTED_AF_ATRIAL_SOURCE_CLAIM_V1.positiveConditioning
        .finiteSamplePdfReproductionClaimed,
    ).toBe(false);
    expect(
      ACCEPTED_AF_ATRIAL_SOURCE_CLAIM_V1.negativeAutocorrelationRepresentable,
    ).toBe(false);
    expect(
      ACCEPTED_AF_ATRIAL_SOURCE_CLAIM_V1.avRecoveryOrConcealmentClaimed,
    ).toBe(false);
    expect(ACCEPTED_AF_ATRIAL_SOURCE_CLAIM_V1.heldOutEvidenceUsed).toBe(false);

    const lambda2 = pearson.lambda2SkewExponent;
    const logEnvelope = (Math.abs(lambda2) * Math.PI) / 2;
    for (const standardized of [-1e9, -10, -1, 0, 1, 10, 1e9]) {
      expect(
        -lambda2 * Math.atan(standardized) - logEnvelope,
      ).toBeLessThanOrEqual(0);
    }
    expect(
      ACCEPTED_AF_ATRIAL_SOURCE_CLAIM_V1.deterministicRandomAlgorithm
        .pearsonIvTiltEnvelope,
    ).toContain("abs(atan(y))<pi/2");
    expect(
      ACCEPTED_AF_ATRIAL_SOURCE_CLAIM_V1.hardFailureBounds
        .pearsonProposalsPerInnovation,
    ).toBe(MAX_AF_PEARSON_PROPOSALS_PER_INNOVATION_V1);
    expect(
      ACCEPTED_AF_ATRIAL_SOURCE_CLAIM_V1.hardFailureBounds.gammaAttemptsPerDraw,
    ).toBe(MAX_AF_GAMMA_ATTEMPTS_PER_DRAW_V1);
    expect(
      ACCEPTED_AF_ATRIAL_SOURCE_CLAIM_V1.hardGammaAttemptBoundScope,
    ).toContain("distinct-from-Pearson-proposal-count");
    expect(
      ACCEPTED_AF_ATRIAL_SOURCE_CLAIM_V1.hardGammaAttemptBoundExhaustion,
    ).toBe("hard-error-without-Gamma-or-AA-substitution");
    expect(AF_MOVING_AVERAGE_UNIT_DC_ABSOLUTE_TOLERANCE_V1).toBe(
      64 * Number.EPSILON,
    );
  });

  it("emits atrial primary-intrinsic proposals with exact source lineage", () => {
    const configuration = makeConfiguration(23, [0.82, 0.18]);
    const initial = initialize(configuration);
    const trial = evaluateAcceptedAfAtrialSourceTrialV1(initial, 0.5);

    expect(trial.sourceImpulses.length).toBeGreaterThan(2);
    expect(trial.generatedIntervals).toHaveLength(trial.sourceImpulses.length);
    for (const [index, impulse] of trial.sourceImpulses.entries()) {
      expect(impulse).toMatchObject({
        chamber: "atrial",
        sourceKind: "primary-intrinsic",
        parentCapturedActivationId: null,
        sourceId: configuration.sourceId,
        sourceSequence: index,
      });
      const metadata = trial.metadataBySourceImpulseId[impulse.sourceImpulseId];
      expect(metadata).toMatchObject({
        sourceImpulseId: impulse.sourceImpulseId,
        sourceSequence: index,
        activationTimeSec: impulse.activationTimeSec,
      });
      expect(metadata?.scheduledByInterval).toEqual(
        index === 0 ? null : trial.generatedIntervals[index - 1],
      );
    }
    for (const interval of trial.generatedIntervals) {
      expect(interval.pearsonInnovationSec).toBeGreaterThan(0);
      expect(interval.aaIntervalSec).toBeGreaterThan(0);
      expect(
        interval.toActivationTimeSec - interval.fromActivationTimeSec,
      ).toBeCloseTo(interval.aaIntervalSec, 14);
      expect(interval.pearsonProposalCountForInnovation).toBeGreaterThan(0);
      expect(interval.gammaAttemptCountForInnovation).toBeGreaterThanOrEqual(
        interval.pearsonProposalCountForInnovation,
      );
      expect(interval.gammaAttemptCountForInnovation).toBeLessThanOrEqual(
        interval.pearsonProposalCountForInnovation *
          MAX_AF_GAMMA_ATTEMPTS_PER_DRAW_V1,
      );
      expect(
        interval.pearsonTiltRejectedCountForInnovation +
          interval.pearsonNonpositiveParentRejectedCountForInnovation +
          1,
      ).toBe(interval.pearsonProposalCountForInnovation);
      expect(
        interval.innovationVectorNewestFirstSec.every(
          (innovation) => innovation > 0,
        ),
      ).toBe(true);
      expect(interval.movingAverageTermsSec.every((term) => term >= 0)).toBe(
        true,
      );
    }
    expect(trial.candidateState.randomState.normalDrawCount).toBe(
      trial.candidateState.randomState.pearsonProposalCount +
        trial.candidateState.randomState.gammaAttemptCount,
    );
  });

  it("is seed/retry deterministic and source-timing invariant to accepted chunks", () => {
    const configuration = makeConfiguration(1_337, [0.82, 0.18]);
    const initial = initialize(configuration);
    const oneShot = evaluateAcceptedAfAtrialSourceTrialV1(initial, 3);
    expect(evaluateAcceptedAfAtrialSourceTrialV1(initial, 3)).toEqual(oneShot);
    expect(rollbackAcceptedAfAtrialSourceTrialV1(initial, oneShot)).toBe(
      initial,
    );

    let chunked = initial;
    const chunkImpulses = [] as (typeof oneShot.sourceImpulses)[number][];
    const chunkIntervals: AfAtrialSchedulingIntervalV1[] = [];
    while (chunked.acceptedTimeSec < 3) {
      const candidate = Math.min(3, chunked.acceptedTimeSec + 0.037);
      const trial = evaluateAcceptedAfAtrialSourceTrialV1(chunked, candidate);
      chunkImpulses.push(...trial.sourceImpulses);
      chunkIntervals.push(...trial.generatedIntervals);
      chunked = commitAcceptedAfAtrialSourceTrialV1(chunked, trial);
    }
    expect(chunkImpulses).toEqual(oneShot.sourceImpulses);
    expect(chunkIntervals).toEqual(oneShot.generatedIntervals);
    expect(chunked.randomState).toEqual(oneShot.candidateState.randomState);
    expect(chunked.innovationHistoryNewestFirstSec).toEqual(
      oneShot.candidateState.innovationHistoryNewestFirstSec,
    );
    expect(chunked.nextSourceSequence).toBe(
      oneShot.candidateState.nextSourceSequence,
    );
    expect(chunked.nextSourceActivationTimeSec).toBe(
      oneShot.candidateState.nextSourceActivationTimeSec,
    );

    const sameSeed = evaluateAcceptedAfAtrialSourceTrialV1(
      initialize(makeConfiguration(1_337, [0.82, 0.18], "same-seed")),
      3,
    );
    expect(
      sameSeed.generatedIntervals.map((entry) => entry.aaIntervalSec),
    ).toEqual(oneShot.generatedIntervals.map((entry) => entry.aaIntervalSec));
    const differentSeed = evaluateAcceptedAfAtrialSourceTrialV1(
      initialize(makeConfiguration(1_338, [0.82, 0.18], "other-seed")),
      3,
    );
    expect(
      differentSeed.generatedIntervals.map((entry) => entry.aaIntervalSec),
    ).not.toEqual(
      oneShot.generatedIntervals.map((entry) => entry.aaIntervalSec),
    );
  });

  it("clips an off-grid step at the next exact atrial source boundary", () => {
    const configuration = makeConfiguration(9, [1]);
    const initial = initialize(configuration, 0.12345);
    const clipped = maximumAcceptedAfAtrialSourceStepV1(initial, 1);
    expect(clipped).toMatchObject({
      requestedEndTimeSec: 1,
      candidateTimeSec: 0.12345,
      maximumStepSec: 0.12345,
      clippedBySourceImpulse: true,
      boundarySourceSequence: 0,
      boundaryActivationTimeSec: 0.12345,
    });
    expect(clipped.boundarySourceImpulseId).toContain(":af-atrial-source:0");
    const exact = evaluateAcceptedAfAtrialSourceTrialV1(
      initial,
      clipped.candidateTimeSec,
    );
    expect(exact.sourceImpulses).toHaveLength(1);
    const accepted = commitAcceptedAfAtrialSourceTrialV1(initial, exact);
    const beforeNext = maximumAcceptedAfAtrialSourceStepV1(accepted, 1e-6);
    expect(beforeNext.clippedBySourceImpulse).toBe(false);
  });

  it("reproduces the positive-conditioned density and induced ACF for every seed", () => {
    const expectedConditionedCdfAt150ms = 0.4422768399431331;
    for (const seed of [7, 101, 4_001, 65_535]) {
      const trial = evaluateAcceptedAfAtrialSourceTrialV1(
        initialize(makeConfiguration(seed, [0.82, 0.18], `seed-${seed}`)),
        1_200,
      );
      expect(trial.generatedIntervals.length).toBeGreaterThan(7_000);
      const innovations = trial.generatedIntervals.map(
        (entry) => entry.pearsonInnovationSec,
      );
      const filtered = trial.generatedIntervals.map(
        (entry) => entry.aaIntervalSec,
      );
      expect(innovations.every((value) => value > 0)).toBe(true);
      expect(filtered.every((value) => value > 0)).toBe(true);

      // Independent theta-space quadrature of the positive-conditioned
      // Pearson-IV target gives F(0.150 s | X>0) below. Checking each seed
      // prevents between-seed biases from cancelling in one pooled sample.
      const empiricalCdf =
        innovations.filter((value) => value <= 0.15).length /
        innovations.length;
      expect(
        Math.abs(empiricalCdf - expectedConditionedCdfAt150ms),
      ).toBeLessThan(0.025);
      const innovationMoments = sampleMoments(innovations);
      expect(
        Math.abs(innovationMoments.mean - 0.15500016564119717),
      ).toBeLessThan(0.0015);
      expect(
        Math.abs(innovationMoments.standardDeviation - 0.021999320786768417),
      ).toBeLessThan(0.002);
      expect(innovationMoments.skewness).toBeGreaterThan(0.75);
      expect(innovationMoments.skewness).toBeLessThan(1.5);

      const observedLagOne = autocorrelation(filtered, 1);
      const theoreticalLagOne = makeConfiguration(seed, [0.82, 0.18])
        .movingAverage.theoreticalAutocorrelation[1]!;
      expect(Math.abs(observedLagOne - theoreticalLagOne)).toBeLessThan(0.04);
    }

    // This is construction self-consistency, not an I-AFDB/LTAFDB pass.
    expect(ACCEPTED_AF_ATRIAL_SOURCE_CLAIM_V1.heldOutEvidenceUsed).toBe(false);
  });

  it("conditions a high-negative-mass parent exactly on X>0 and reports removals", () => {
    const configuration = createAcceptedAfAtrialSourceConfigurationV1({
      configurationId: "high-negative-parent",
      ownerInstanceId: "high-negative-parent-owner",
      sourceId: "AF-source",
      seedUint32: 7,
      pearsonParentMoments: {
        meanSec: 0.01,
        standardDeviationSec: 0.08,
        skewness: 1.1,
        kurtosis: 8,
      },
      movingAverageCoefficients: [0.6, 0.4],
    });
    const trial = evaluateAcceptedAfAtrialSourceTrialV1(
      initialize(configuration),
      500,
    );
    expect(trial.generatedIntervals.length).toBeGreaterThan(6_000);
    expect(
      trial.generatedIntervals.every(
        (entry) =>
          entry.pearsonInnovationSec > 0 &&
          entry.aaIntervalSec > 0 &&
          entry.movingAverageTermsSec.every((term) => term >= 0),
      ),
    ).toBe(true);
    expect(
      trial.generatedIntervals.some(
        (entry) => entry.pearsonNonpositiveParentRejectedCountForInnovation > 0,
      ),
    ).toBe(true);
    expect(
      trial.candidateState.randomState.pearsonNonpositiveParentRejectedCount,
    ).toBeGreaterThan(0);
    expect(
      trial.candidateState.randomState.pearsonAcceptedCount +
        trial.candidateState.randomState.pearsonTiltRejectedCount +
        trial.candidateState.randomState.pearsonNonpositiveParentRejectedCount,
    ).toBe(trial.candidateState.randomState.pearsonProposalCount);
    const innovations = trial.generatedIntervals.map(
      (entry) => entry.pearsonInnovationSec,
    );
    const empiricalConditionedCdfAt50ms =
      innovations.filter((value) => value <= 0.05).length / innovations.length;
    expect(
      Math.abs(empiricalConditionedCdfAt50ms - 0.4988678975081869),
    ).toBeLessThan(0.025);
    const parentAcceptedBeforeConditioning =
      trial.candidateState.randomState.pearsonAcceptedCount +
      trial.candidateState.randomState.pearsonNonpositiveParentRejectedCount;
    const empiricallyRemovedParentMass =
      trial.candidateState.randomState.pearsonNonpositiveParentRejectedCount /
      parentAcceptedBeforeConditioning;
    expect(
      Math.abs(empiricallyRemovedParentMass - 0.4913517515227521),
    ).toBeLessThan(0.025);
    expect(configuration.pearsonTypeIv.moments.meanSec).toBe(0.01);
    expect(sampleMoments(innovations).mean).toBeGreaterThan(0.06);
    expect(
      ACCEPTED_AF_ATRIAL_SOURCE_CLAIM_V1.positiveConditioning
        .parentMomentsPreservedExactlyClaimed,
    ).toBe(false);
  });

  it("fails at the declared Pearson proposal bound without returning a substitute", () => {
    const inefficientButAdmissible =
      createAcceptedAfAtrialSourceConfigurationV1({
        configurationId: "hard-proposal-bound",
        ownerInstanceId: "hard-proposal-bound-owner",
        sourceId: "AF-source",
        seedUint32: 99,
        pearsonParentMoments: {
          meanSec: 0.155,
          standardDeviationSec: 0.022,
          skewness: 0.01,
          kurtosis: 3.0002,
        },
        movingAverageCoefficients: [1],
      });
    const state = initialize(inefficientButAdmissible);
    expect(() => evaluateAcceptedAfAtrialSourceTrialV1(state, 0.1)).toThrow(
      `exceeded total hard proposal bound ${MAX_AF_PEARSON_PROPOSALS_PER_INNOVATION_V1}`,
    );
  });

  it("fails closed at the distinct per-Gamma-draw attempt bound", () => {
    expect(
      sampleAfUnitScaleGammaWithConstantSourcesForVerificationV1(1, 0, 0.5),
    ).toBeCloseTo(2 / 3, 15);
    expect(() =>
      sampleAfUnitScaleGammaWithConstantSourcesForVerificationV1(1, -10, 0.5),
    ).toThrow(
      `exceeded per-draw hard attempt bound ${MAX_AF_GAMMA_ATTEMPTS_PER_DRAW_V1}; no Gamma or AA value was substituted`,
    );
  });

  it("rejects inadmissible moments, malformed filters, seeds, and forged trials", () => {
    expect(() =>
      makeConfiguration(1, [1], "zero-skew", {
        skewness: 0,
      }),
    ).toThrow(/skewness must be nonzero/);
    expect(() =>
      makeConfiguration(1, [1], "bad-kurtosis", {
        kurtosis: 3,
      }),
    ).toThrow(/Type-IV criterion|finite/);
    expect(() => makeConfiguration(1, [0.8, 0.1], "bad-dc")).toThrow(
      /unit DC gain/,
    );
    expect(() => makeConfiguration(1, [0, 1], "zero-c0")).toThrow(
      /c0 must be positive/,
    );
    expect(() => makeConfiguration(1, [1.1, -0.1], "negative-tap")).toThrow(
      /must be nonnegative; negative autocorrelation is outside V1/,
    );
    expect(() =>
      makeConfiguration(
        1,
        [1e153, -1e153, 1e100],
        "formerly-cancelling-unit-dc",
      ),
    ).toThrow(/must be nonnegative/);
    expect(() => makeConfiguration(1, [1e153, 0], "huge-positive-tap")).toThrow(
      /unit DC gain/,
    );
    expect(() =>
      makeConfiguration(1, [1 + 1e-10], "outside-fixed-tolerance"),
    ).toThrow(/fixed absolute tolerance/);
    expect(() => makeConfiguration(-1, [1], "bad-seed")).toThrow(
      /unsigned 32-bit/,
    );
    expect(() => initialize(makeConfiguration(1, [1]), 0)).toThrow(
      /must exceed/,
    );

    const initial = initialize(makeConfiguration(2, [1]));
    expect(() => evaluateAcceptedAfAtrialSourceTrialV1(initial, 0)).toThrow(
      /must exceed/,
    );
    const trial = jsonClone(
      evaluateAcceptedAfAtrialSourceTrialV1(initial, 0.5),
    );
    trial.generatedIntervals[0].aaIntervalSec += 0.001;
    expect(() => commitAcceptedAfAtrialSourceTrialV1(initial, trial)).toThrow(
      /does not match its accepted base/,
    );
  });

  it("binds the full seed, parent moments, and filter into its SHA identity", async () => {
    const baseline = makeConfiguration(5, [0.82, 0.18], "identity");
    const changedSeed = makeConfiguration(6, [0.82, 0.18], "identity");
    const changedFilter = makeConfiguration(5, [0.8, 0.2], "identity");
    const changedMoments = makeConfiguration(5, [0.82, 0.18], "identity", {
      meanSec: 0.16,
    });
    expect(await sha256AcceptedAfAtrialSourceIdentityV1(changedSeed)).not.toBe(
      await sha256AcceptedAfAtrialSourceIdentityV1(baseline),
    );
    expect(
      await sha256AcceptedAfAtrialSourceIdentityV1(changedFilter),
    ).not.toBe(await sha256AcceptedAfAtrialSourceIdentityV1(baseline));
    expect(
      await sha256AcceptedAfAtrialSourceIdentityV1(changedMoments),
    ).not.toBe(await sha256AcceptedAfAtrialSourceIdentityV1(baseline));
    expect(Object.isFrozen(baseline)).toBe(true);
    expect(Object.isFrozen(baseline.pearsonTypeIv)).toBe(true);
    expect(Object.isFrozen(baseline.movingAverage.coefficients)).toBe(true);
  });
});

function makeConfiguration(
  seedUint32: number,
  movingAverageCoefficients: readonly number[],
  suffix = "default",
  momentOverrides: Partial<{
    meanSec: number;
    standardDeviationSec: number;
    skewness: number;
    kurtosis: number;
  }> = {},
): AcceptedAfAtrialSourceConfigurationV1 {
  return createAcceptedAfAtrialSourceConfigurationV1({
    configurationId: `AF-configuration:${suffix}`,
    ownerInstanceId: `AF-owner:${suffix}`,
    sourceId: "AF-atrial-source",
    seedUint32,
    pearsonParentMoments: {
      meanSec: 0.155,
      standardDeviationSec: 0.022,
      skewness: 1.1,
      kurtosis: 8,
      ...momentOverrides,
    },
    movingAverageCoefficients,
  });
}

function initialize(
  configuration: AcceptedAfAtrialSourceConfigurationV1,
  firstSourceActivationTimeSec = 0.1,
): AcceptedAfAtrialSourceStateV1 {
  return initializeAcceptedAfAtrialSourceStateV1(configuration, {
    acceptedTimeSec: 0,
    firstSourceActivationTimeSec,
  });
}

function sampleMoments(values: readonly number[]): Readonly<{
  mean: number;
  standardDeviation: number;
  skewness: number;
  kurtosis: number;
}> {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const central = values.map((value) => value - mean);
  const m2 =
    central.reduce((sum, value) => sum + value ** 2, 0) / values.length;
  const m3 =
    central.reduce((sum, value) => sum + value ** 3, 0) / values.length;
  const m4 =
    central.reduce((sum, value) => sum + value ** 4, 0) / values.length;
  return Object.freeze({
    mean,
    standardDeviation: Math.sqrt(m2),
    skewness: m3 / m2 ** 1.5,
    kurtosis: m4 / m2 ** 2,
  });
}

function autocorrelation(values: readonly number[], lag: number): number {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  let covariance = 0;
  let variance = 0;
  for (let index = 0; index < values.length; index += 1) {
    const centered = values[index]! - mean;
    variance += centered * centered;
    if (index + lag < values.length) {
      covariance += centered * (values[index + lag]! - mean);
    }
  }
  return covariance / variance;
}

function jsonClone<T>(value: T): any {
  return JSON.parse(JSON.stringify(value));
}
