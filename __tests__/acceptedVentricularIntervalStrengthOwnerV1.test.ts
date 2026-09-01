import { describe, expect, it } from "vitest";

import {
  ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CLAIM_V1,
  canonicalizeDerivedVentricularIntervalStrengthValueV1,
  commitAcceptedVentricularIntervalStrengthCandidateV1,
  createAcceptedVentricularIntervalStrengthConfigurationV1,
  deriveVentricularIntervalStrengthSteadyReferenceV1,
  evaluateAcceptedVentricularIntervalStrengthCandidateV1,
  initializeAcceptedVentricularIntervalStrengthStateV1,
  initializeAcceptedVentricularIntervalStrengthSteadyReferenceStateV1,
  rebindAcceptedVentricularIntervalStrengthReferenceV1,
  rollbackAcceptedVentricularIntervalStrengthCandidateV1,
  validateAcceptedVentricularIntervalStrengthStateV1,
  type AcceptedVentricularIntervalStrengthConfigurationV1,
  type AcceptedVentricularIntervalStrengthStateV1,
} from "@/engine/myocardium/rhythm/acceptedVentricularIntervalStrengthOwnerV1";
import {
  CAPTURED_ELECTRICAL_ACTIVATION_V2_ID,
  ELECTRICAL_CAPTURE_PRIORITY_V2,
  type CapturedElectricalActivationV2,
  type ElectricalImpulseSourceKindV2,
} from "@/engine/myocardium/rhythm/acceptedElectricalCaptureOwnerV2";

describe("accepted ventricular interval-strength owner V1", () => {
  it("collapses host-transcendental ULP drift before exact persistence", () => {
    const recovery = -Math.expm1(-0.7 / 0.765);
    const adjacentHostResult = recovery + Number.EPSILON;

    expect(canonicalizeDerivedVentricularIntervalStrengthValueV1(recovery))
      .toBe(canonicalizeDerivedVentricularIntervalStrengthValueV1(
        adjacentHostResult,
      ));
    expect(Math.abs(
      canonicalizeDerivedVentricularIntervalStrengthValueV1(recovery)
        - recovery,
    )).toBeLessThanOrEqual(5e-13);
  });

  it("normalizes the reference cycle to an exact unit deposit and fixed load", () => {
    const config = configuration();
    const reference = deriveVentricularIntervalStrengthSteadyReferenceV1(config);
    expect(reference.depositedRelativeStrength).toBe(1);
    expect(reference.nextNormalizedSrLoadState)
      .toBe(reference.referenceNormalizedSrLoadState);

    let state = initializeAcceptedVentricularIntervalStrengthSteadyReferenceStateV1(
      config,
      {
        acceptedTimeSec: 0,
        priorAcceptedVentricularActivation: capture("history", -1, 1),
      },
    );
    const first = evaluate(state, capture("beat-0", 0, 2));
    expect(first.depositMetadata).toMatchObject({
      intervalSec: 1,
      releasedRelativeStrengthR: 1,
      futureExactCalciumDepositRelativeStrength: 1,
      normalizedSrLoadAfter: reference.referenceNormalizedSrLoadState,
      calciumStateMutation: "none-metadata-only",
    });
    state = commitAcceptedVentricularIntervalStrengthCandidateV1(state, first);
    const second = evaluate(state, capture("beat-1", 1, 3));
    expect(second.depositMetadata.releasedRelativeStrengthR).toBe(1);
    expect(second.depositMetadata.normalizedSrLoadAfter)
      .toBe(reference.referenceNormalizedSrLoadState);
  });

  it("keeps dense-HR accumulated regular timing numerically near its reference", () => {
    let maximumStrengthError = 0;
    let maximumRelativeLoadError = 0;
    for (let heartRateBpm = 40; heartRateBpm <= 100; heartRateBpm += 0.5) {
      const cycleLengthSec = 60 / heartRateBpm;
      const config = configuration({ referenceCycleLengthSec: cycleLengthSec });
      const reference =
        deriveVentricularIntervalStrengthSteadyReferenceV1(config);
      let state =
        initializeAcceptedVentricularIntervalStrengthSteadyReferenceStateV1(
          config,
          {
            acceptedTimeSec: 0,
            priorAcceptedVentricularActivation:
              capture(`dense-history-${heartRateBpm}`, -0.012, 1),
          },
        );
      let activationTimeSec = cycleLengthSec - 0.012;
      for (let beat = 1; beat <= 128; beat += 1) {
        const candidate = evaluate(
          state,
          capture(
            `dense-${heartRateBpm}-${beat}`,
            activationTimeSec,
            beat + 1,
          ),
        );
        maximumStrengthError = Math.max(
          maximumStrengthError,
          Math.abs(
            candidate.depositMetadata
              .futureExactCalciumDepositRelativeStrength - 1,
          ),
        );
        maximumRelativeLoadError = Math.max(
          maximumRelativeLoadError,
          Math.abs(
            candidate.depositMetadata.normalizedSrLoadAfter
              / reference.referenceNormalizedSrLoadState - 1,
          ),
        );
        state = commitAcceptedVentricularIntervalStrengthCandidateV1(
          state,
          candidate,
        );
        activationTimeSec += cycleLengthSec;
      }
    }
    expect(maximumStrengthError).toBeLessThanOrEqual(5e-11);
    expect(maximumRelativeLoadError).toBeLessThanOrEqual(5e-11);
  });

  it("implements the documented Rice-style transition for nonreference intervals", () => {
    const config = configuration();
    const reference = deriveVentricularIntervalStrengthSteadyReferenceV1(config);
    const shortState = initializeAcceptedVentricularIntervalStrengthStateV1(
      config,
      {
        acceptedTimeSec: 0,
        initialNormalizedSrLoadState: reference.referenceNormalizedSrLoadState,
        priorAcceptedVentricularActivation: capture("short-history", -0.25, 1),
      },
    );
    const candidate = evaluate(shortState, capture("short-beat", 0, 2));
    const a = canonicalizeDerivedVentricularIntervalStrengthValueV1(
      -Math.expm1(-0.25 / config.recoveryTimeConstantSec),
    );
    const R = a * config.releaseFractionBeta
      * reference.referenceNormalizedSrLoadState;
    const I = config.normalizedIntervalInfluxGamma
      * (1 - config.intervalInfluxInhibitionFractionH * a);
    const next = reference.referenceNormalizedSrLoadState
      - R
      + config.releasedLoadReturnFractionR * R
      + I;

    expect(candidate.depositMetadata.recoveryFractionA).toBe(a);
    expect(candidate.depositMetadata.releasedRelativeStrengthR).toBe(R);
    expect(candidate.depositMetadata.intervalInfluxRelativeLoad).toBe(I);
    expect(candidate.depositMetadata.normalizedSrLoadAfter).toBe(next);
    expect(candidate.depositMetadata.releasedRelativeStrengthR).toBeLessThan(1);

    const longState = initializeAcceptedVentricularIntervalStrengthStateV1(
      config,
      {
        acceptedTimeSec: 0,
        initialNormalizedSrLoadState: reference.referenceNormalizedSrLoadState,
        priorAcceptedVentricularActivation: capture("long-history", -2, 1),
      },
    );
    expect(evaluate(longState, capture("long-beat", 0, 2))
      .depositMetadata.releasedRelativeStrengthR).toBeGreaterThan(1);
  });

  it("rebinds only reference-cycle normalization without losing accepted memory", () => {
    const sourceConfiguration = configuration();
    const initial = initialState(sourceConfiguration);
    const source = commitAcceptedVentricularIntervalStrengthCandidateV1(
      initial,
      evaluate(
        initial,
        capture("source-reference", 0, 2),
      ),
    );
    const targetConfiguration = configuration({
      referenceCycleLengthSec: 0.8,
    });
    const rebound = rebindAcceptedVentricularIntervalStrengthReferenceV1(
      source,
      targetConfiguration,
    );

    expect(rebound.acceptedTimeSec).toBe(source.acceptedTimeSec);
    expect(rebound.revision).toBe(source.revision);
    expect(rebound.acceptedVentricularCaptureCount)
      .toBe(source.acceptedVentricularCaptureCount);
    expect(Math.abs(
      rebound.normalizedSrLoadState - source.normalizedSrLoadState,
    )).toBeLessThanOrEqual(
      8 * Number.EPSILON * Math.max(1, source.normalizedSrLoadState),
    );
    expect(rebound.lastAcceptedVentricularActivation)
      .toEqual(source.lastAcceptedVentricularActivation);
    expect(rebound.configuration.referenceCycleLengthSec).toBe(0.8);
    expect(() => validateAcceptedVentricularIntervalStrengthStateV1(rebound))
      .not.toThrow();
    expect(evaluate(rebound, capture("target-cycle", 0.8, 3))
      .depositMetadata.futureExactCalciumDepositRelativeStrength)
      .toBeGreaterThan(0);

    expect(() => rebindAcceptedVentricularIntervalStrengthReferenceV1(
      source,
      configuration({
        referenceCycleLengthSec: 0.8,
        releaseFractionBeta: 0.6,
      }),
    )).toThrow(/more than reference-cycle normalization/);
  });

  it("produces the preregistered weak-extrasystole then potentiated-postbeat shape", () => {
    const config = configuration();
    let state = initializeAcceptedVentricularIntervalStrengthSteadyReferenceStateV1(
      config,
      {
        acceptedTimeSec: 0,
        priorAcceptedVentricularActivation: capture("history", 0, 1),
      },
    );
    const extrasystole = evaluate(state, capture("extrasystole", 0.4, 2));
    expect(extrasystole.depositMetadata.releasedRelativeStrengthR)
      .toBeLessThan(1);
    state = commitAcceptedVentricularIntervalStrengthCandidateV1(
      state,
      extrasystole,
    );
    const postExtrasystole = evaluate(
      state,
      capture("post-extrasystole", 2, 3),
    );
    expect(postExtrasystole.depositMetadata.intervalSec).toBe(1.6);
    expect(postExtrasystole.depositMetadata.releasedRelativeStrengthR)
      .toBeGreaterThan(1);
  });

  it("retains and then decays postextrasystolic interval history without an RR coefficient list", () => {
    const config = configuration();
    let state = initializeAcceptedVentricularIntervalStrengthSteadyReferenceStateV1(
      config,
      {
        acceptedTimeSec: 0,
        priorAcceptedVentricularActivation: capture("history", 0, 1),
      },
    );
    state = commitAcceptedVentricularIntervalStrengthCandidateV1(
      state,
      evaluate(state, capture("extrasystole", 0.4, 2)),
    );
    const postExtrasystole = evaluate(
      state,
      capture("post-extrasystole", 2, 3),
    );
    state = commitAcceptedVentricularIntervalStrengthCandidateV1(
      state,
      postExtrasystole,
    );

    const referenceIntervalStrengths: number[] = [];
    for (let ordinal = 4; ordinal <= 10; ordinal += 1) {
      const candidate = evaluate(
        state,
        capture(`reference-${ordinal}`, ordinal - 1, ordinal),
      );
      referenceIntervalStrengths.push(
        candidate.depositMetadata.releasedRelativeStrengthR,
      );
      state = commitAcceptedVentricularIntervalStrengthCandidateV1(
        state,
        candidate,
      );
    }

    expect(postExtrasystole.depositMetadata.releasedRelativeStrengthR)
      .toBeGreaterThan(referenceIntervalStrengths[0]!);
    expect(referenceIntervalStrengths.every((strength) => strength > 1))
      .toBe(true);
    for (let index = 1; index < referenceIntervalStrengths.length; index += 1) {
      expect(referenceIntervalStrengths[index]!)
        .toBeLessThan(referenceIntervalStrengths[index - 1]!);
    }
    expect(Math.abs(referenceIntervalStrengths.at(-1)! - 1))
      .toBeLessThan(Math.abs(referenceIntervalStrengths[0]! - 1));
  });

  it("preserves complete accepted-capture lineage without mutating calcium", () => {
    const config = configuration();
    const state = initialState(config);
    const activation = capture("pvc", 0.2, 2, "authored-ectopy");
    const candidate = evaluate(state, activation);

    expect(candidate.depositMetadata.capturedVentricularActivation)
      .toEqual(activation);
    expect(candidate.depositMetadata).toMatchObject({
      previousCapturedActivationId: "captured:history",
      previousCapturedActivationTimeSec: -1,
      acceptedVentricularCaptureOrdinal: 1,
      calciumStateMutation: "none-metadata-only",
    });
    expect(Object.hasOwn(candidate.depositMetadata, "calciumState")).toBe(false);
    expect(Object.hasOwn(candidate.depositMetadata, "calciumValue")).toBe(false);
    expect(Object.hasOwn(candidate.depositMetadata, "calciumConcentration"))
      .toBe(false);
    expect(ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CLAIM_V1
      .absoluteHumanCellularCalciumClaimed).toBe(false);
    expect(ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CLAIM_V1
      .heartFailureOrRemodelingClaimed).toBe(false);
    expect(ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CLAIM_V1
      .alternansGuaranteeClaimed).toBe(false);
    expect(ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CLAIM_V1
      .patientCalibrationClaimed).toBe(false);
    expect(ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CLAIM_V1
      .evidenceRoles.independentHumanTissueValidationEstablished).toBe(false);
  });

  it("accepts only a captured ventricular activation, never a source proposal", () => {
    const state = initialState(configuration());
    const atrial = {
      ...capture("atrial", 0.1, 2, "av-output"),
      chamber: "atrial",
    } as CapturedElectricalActivationV2;
    expect(() => evaluate(state, atrial)).toThrow(/must be ventricular/);

    const sourceProposal = {
      impulseSchemaId: "source-impulse-v2",
      schemaVersion: 2,
      sourceImpulseId: "proposal",
      parentCapturedActivationId: null,
      chamber: "ventricular",
      sourceKind: "authored-ectopy",
      capturePriority: 10,
      sourceId: "proposal-source",
      sourceSequence: 1,
      activationTimeSec: 0.1,
    };
    expect(() => evaluateAcceptedVentricularIntervalStrengthCandidateV1(
      state,
      { acceptedVentricularActivation: sourceProposal as never },
    )).toThrow(/keys are invalid/);
    expect(ACCEPTED_VENTRICULAR_INTERVAL_STRENGTH_CLAIM_V1
      .refractoryBlockedSourceImpulsesConsumed).toBe(false);
  });

  it("allows signed prior history but guards nonnegative monotone event time", () => {
    const config = configuration();
    const state = initializeAcceptedVentricularIntervalStrengthStateV1(config, {
      acceptedTimeSec: 0,
      initialNormalizedSrLoadState: 2,
      priorAcceptedVentricularActivation: capture("history", -0.5, 1),
    });
    expect(evaluate(state, capture("boundary", 0, 2)).candidateTimeSec).toBe(0);
    expect(() => evaluate(state, capture("negative", -0.1, 2)))
      .toThrow(/must be nonnegative/);

    const accepted = commitAcceptedVentricularIntervalStrengthCandidateV1(
      state,
      evaluate(state, capture("boundary", 0, 2)),
    );
    expect(() => evaluate(accepted, capture("coincident", 0, 3)))
      .toThrow(/strictly after prior capture/);
    expect(() => evaluate(accepted, capture("past", -0.1, 3)))
      .toThrow(/must be nonnegative|precedes accepted/);
  });

  it("keeps evaluation pure, exactly recomputes commit, and rolls back by identity", () => {
    const state = initialState(configuration());
    const snapshot = JSON.stringify(state);
    const candidate = evaluate(state, capture("beat", 0.2, 2));

    expect(JSON.stringify(state)).toBe(snapshot);
    expect(rollbackAcceptedVentricularIntervalStrengthCandidateV1(
      state,
      candidate,
    )).toBe(state);
    expect(commitAcceptedVentricularIntervalStrengthCandidateV1(
      state,
      candidate,
    )).toEqual(candidate.candidateState);

    const tampered = Object.freeze({
      ...candidate,
      startTimeSec: candidate.startTimeSec + 0.01,
    });
    expect(() => commitAcceptedVentricularIntervalStrengthCandidateV1(
      state,
      tampered,
    )).toThrow(/does not match/);
  });

  it("rejects unsafe parameters, overflow, malformed lineage, and state tamper", () => {
    expect(() => configuration({ recoveryTimeConstantSec: 0 }))
      .toThrow(/recoveryTimeConstantSec.*positive/);
    expect(() => configuration({ releaseFractionBeta: 0 }))
      .toThrow(/releaseFractionBeta/);
    expect(() => configuration({ releaseFractionBeta: 1.01 }))
      .toThrow(/releaseFractionBeta/);
    expect(() => configuration({ releasedLoadReturnFractionR: 1 }))
      .toThrow(/releasedLoadReturnFractionR/);
    expect(() => configuration({ intervalInfluxInhibitionFractionH: -0.1 }))
      .toThrow(/intervalInfluxInhibitionFractionH/);
    expect(() => configuration({ referenceCycleLengthSec: 0 }))
      .toThrow(/referenceCycleLengthSec.*positive/);

    const config = configuration();
    const tinyTauConfig = configuration({
      recoveryTimeConstantSec: 1e-308,
      referenceCycleLengthSec: 1e-308,
    });
    const extremeInterval = initializeAcceptedVentricularIntervalStrengthStateV1(
      tinyTauConfig,
      {
      acceptedTimeSec: 0,
      initialNormalizedSrLoadState: 2,
      priorAcceptedVentricularActivation: capture("history", -1e-308, 1),
      },
    );
    expect(() => evaluate(extremeInterval, capture("overflow", 10, 2)))
      .toThrow(/ratio must be positive and finite/);

    const state = commitAcceptedVentricularIntervalStrengthCandidateV1(
      initialState(config),
      evaluate(initialState(config), capture("beat", 0.2, 2)),
    );
    const bad = deepFreeze({
      ...jsonClone(state),
      normalizedSrLoadState: state.normalizedSrLoadState + 0.1,
    }) as AcceptedVentricularIntervalStrengthStateV1;
    expect(() => validateAcceptedVentricularIntervalStrengthStateV1(bad))
      .toThrow(/state and last deposit metadata split/);

    const badLineage = {
      ...capture("bad", 0.2, 2),
      capturePriority: ELECTRICAL_CAPTURE_PRIORITY_V2.pacing,
    } as CapturedElectricalActivationV2;
    expect(() => evaluate(initialState(config), badLineage))
      .toThrow(/priority does not match/);
  });

  it("owns detached recursively immutable configuration, state, and metadata", () => {
    const config = configuration();
    const state = initialState(config);
    const candidate = evaluate(state, capture("beat", 0.2, 2));

    expect(state.configuration).not.toBe(config);
    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.configuration)).toBe(true);
    expect(Object.isFrozen(state.configuration.parameterProvenance)).toBe(true);
    expect(Object.isFrozen(state.lastAcceptedVentricularActivation)).toBe(true);
    expect(Object.isFrozen(candidate)).toBe(true);
    expect(Object.isFrozen(candidate.depositMetadata)).toBe(true);
    expect(Object.isFrozen(
      candidate.depositMetadata.capturedVentricularActivation,
    )).toBe(true);
  });
});

function configuration(
  overrides: Partial<Readonly<{
    recoveryTimeConstantSec: number;
    releaseFractionBeta: number;
    releasedLoadReturnFractionR: number;
    intervalInfluxInhibitionFractionH: number;
    referenceCycleLengthSec: number;
  }>> = {},
): AcceptedVentricularIntervalStrengthConfigurationV1 {
  return createAcceptedVentricularIntervalStrengthConfigurationV1({
    configurationId: "interval-strength-configuration",
    ownerInstanceId: "interval-strength-owner",
    parameterProvenance: {
      kind: "explicit-research-parameters",
      sourceId: "focused-component-test-input",
    },
    recoveryTimeConstantSec: overrides.recoveryTimeConstantSec ?? 0.765,
    releaseFractionBeta: overrides.releaseFractionBeta ?? 0.5,
    releasedLoadReturnFractionR:
      overrides.releasedLoadReturnFractionR ?? 0.75,
    intervalInfluxInhibitionFractionH:
      overrides.intervalInfluxInhibitionFractionH ?? 0.27,
    referenceCycleLengthSec: overrides.referenceCycleLengthSec ?? 1,
  });
}

function initialState(
  config: AcceptedVentricularIntervalStrengthConfigurationV1,
): AcceptedVentricularIntervalStrengthStateV1 {
  return initializeAcceptedVentricularIntervalStrengthSteadyReferenceStateV1(
    config,
    {
      acceptedTimeSec: 0,
      priorAcceptedVentricularActivation: capture("history", -1, 1),
    },
  );
}

function evaluate(
  state: AcceptedVentricularIntervalStrengthStateV1,
  activation: CapturedElectricalActivationV2,
) {
  return evaluateAcceptedVentricularIntervalStrengthCandidateV1(state, {
    acceptedVentricularActivation: activation,
  });
}

function capture(
  id: string,
  timeSec: number,
  ordinal: number,
  sourceKind: Exclude<ElectricalImpulseSourceKindV2, "primary-intrinsic"> =
    "av-output",
): CapturedElectricalActivationV2 {
  return Object.freeze({
    activationSchemaId: CAPTURED_ELECTRICAL_ACTIVATION_V2_ID,
    schemaVersion: 2,
    capturedActivationId: `captured:${id}`,
    parentSourceImpulseId: `impulse:${id}`,
    upstreamCapturedActivationId: sourceKind === "av-output"
      ? `atrial:${id}`
      : null,
    chamber: "ventricular",
    gateInstanceId: "ventricular-capture-gate",
    activationTimeSec: timeSec,
    sourceKind,
    sourceId: `source:${sourceKind}`,
    sourceSequence: ordinal,
    capturePriority: ELECTRICAL_CAPTURE_PRIORITY_V2[sourceKind],
    captureOrdinal: ordinal,
    ownerRevision: ordinal,
  });
}

function jsonClone(value: unknown): any {
  return JSON.parse(JSON.stringify(value));
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
