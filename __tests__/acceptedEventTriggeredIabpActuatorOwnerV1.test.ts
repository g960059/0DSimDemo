import { describe, expect, it } from "vitest";

import {
  ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CLAIM_V1,
  commitAcceptedEventTriggeredIabpActuatorCandidateV1,
  createAcceptedAorticValveClosureEventV1,
  createAcceptedEventTriggeredIabpActuatorConfigurationV1,
  evaluateAcceptedEventTriggeredIabpActuatorAtTimeV1,
  evaluateAcceptedEventTriggeredIabpActuatorCandidateV1,
  evaluateIabpAorticExcludedVolumeLawV1,
  initializeAcceptedEventTriggeredIabpActuatorStateV1,
  maximumAcceptedEventTriggeredIabpActuatorStepV1,
  rollbackAcceptedEventTriggeredIabpActuatorCandidateV1,
  type AcceptedAorticValveClosureEventV1,
  type AcceptedEventTriggeredIabpActuatorCandidateV1,
  type AcceptedEventTriggeredIabpActuatorConfigurationInputV1,
  type AcceptedEventTriggeredIabpActuatorConfigurationV1,
  type AcceptedEventTriggeredIabpActuatorStateV1,
  type AcceptedEventTriggeredIabpAssistRatioV1,
} from "@/engine/devices/acceptedEventTriggeredIabpActuatorOwnerV1";
import { evaluateIabpV1 } from "@/engine/devices/iabpV1";
import {
  CAPTURED_ELECTRICAL_ACTIVATION_V2_ID,
  ELECTRICAL_CAPTURE_PRIORITY_V2,
  type CapturedElectricalActivationV2,
} from "@/engine/myocardium/rhythm/acceptedElectricalCaptureOwnerV2";

describe("accepted-event-triggered IABP actuator owner V1", () => {
  it("keeps every actuator parameter explicit and reuses the existing SA displacement-volume law", () => {
    const configuration = iabpConfiguration(2);
    const state = initialState(configuration);
    const evaluation = evaluateAcceptedEventTriggeredIabpActuatorAtTimeV1(
      state,
    );

    expect(configuration).toMatchObject({
      assistRatio: 2,
      balloonVolumeMl: 40,
      inflationTransitionDurationSec: 0.1,
      deflationTransitionDurationSec: 0.05,
      placementNode: "SA",
    });
    expect(evaluation).toMatchObject({
      activation01: 0,
      balloonVolumeMl: 0,
      aorticExcludedVolumeMl: 0,
      placementNode: "SA",
    });
    expect(evaluateIabpAorticExcludedVolumeLawV1(40, 0.25)).toBe(10);

    const existing = evaluateIabpV1({
      enabled: true,
      assistRatio: 1,
      balloonVolumeMl: 40,
      inflationPhase01: 0.2,
      deflationPhase01: 0.9,
      inflationDurationSec: 0.1,
      deflationDurationSec: 0.05,
      placementNode: "SA",
    }, {
      cyclePhase01: 0.3,
      beatIndex: 0,
      heartRateBpm: 60,
    });
    expect(existing.balloonVolumeMl).toBe(
      evaluateIabpAorticExcludedVolumeLawV1(40, existing.activation01),
    );

    expect(ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CLAIM_V1
      .existingPhaseBasedEvaluateIabpV1Replaced).toBe(false);
    expect(ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CLAIM_V1
      .mainWireOrCirculationIntegrated).toBe(false);
    expect(ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CLAIM_V1
      .validatedPatientModelClaimed).toBe(false);
    expect(ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CLAIM_V1
      .pneumaticDriveModelClaimed).toBe(false);
    expect(ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CLAIM_V1
      .ecgOrAutoTimingAlgorithmClaimed).toBe(false);
    expect(ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CLAIM_V1
      .balloonComplianceClaimed).toBe(false);
    expect(ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CLAIM_V1
      .occlusivityClaimed).toBe(false);
    expect(ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CLAIM_V1
      .coronaryBenefitClaimed).toBe(false);
    expect(ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CLAIM_V1
      .patientPhysiologyClaimed).toBe(false);
    expect(ACCEPTED_EVENT_TRIGGERED_IABP_ACTUATOR_CLAIM_V1
      .literatureConstruction.map((source) =>
        "doi" in source ? source.doi : source.pmid))
      .toEqual([
        "10.1152/ajpheart.1991.261.4.H1300",
        "23263334",
        "10347342",
        "8573871",
      ]);
  });

  it("rejects missing, extra, implicit, or nonphysical configuration values", () => {
    const valid = configurationInput(1);
    const { balloonVolumeMl: _omitted, ...missing } = valid;
    expect(() => createAcceptedEventTriggeredIabpActuatorConfigurationV1(
      missing as AcceptedEventTriggeredIabpActuatorConfigurationInputV1,
    )).toThrow(/keys are invalid/);
    expect(() => createAcceptedEventTriggeredIabpActuatorConfigurationV1({
      ...valid,
      hiddenDefault: true,
    } as AcceptedEventTriggeredIabpActuatorConfigurationInputV1))
      .toThrow(/keys are invalid/);
    expect(() => createAcceptedEventTriggeredIabpActuatorConfigurationV1({
      ...valid,
      assistRatio: 4,
    } as unknown as AcceptedEventTriggeredIabpActuatorConfigurationInputV1))
      .toThrow(/assistRatio/);
    expect(() => createAcceptedEventTriggeredIabpActuatorConfigurationV1({
      ...valid,
      inflationTransitionDurationSec: 0,
    })).toThrow(/must be positive/);
    expect(() => createAcceptedEventTriggeredIabpActuatorConfigurationV1({
      ...valid,
      balloonVolumeMl: -1,
    })).toThrow(/must be nonnegative/);
  });

  it("deflates on accepted ventricular capture and inflates smoothly on exact same-beat AoV closure", () => {
    const configuration = iabpConfiguration(1);
    let state = initialState(configuration);
    const beatOne = ventricularActivation("beat-1", 0.1, 1);
    const capture = candidate(state, 0.1, beatOne, null);

    expect(capture.deflationTransitionStarted).toBe(true);
    expect(capture.inflationTransitionStarted).toBe(false);
    expect(capture.evaluation.activation01).toBe(0);
    state = commitAcceptedEventTriggeredIabpActuatorCandidateV1(
      state,
      capture,
    );
    state = advanceToBeforeEvent(state, 0.3);

    const beatOneClosure = closure("closure-1", beatOne, 0.3);
    const inflation = candidate(state, 0.3, null, beatOneClosure);
    expect(inflation.inflationTransitionStarted).toBe(true);
    expect(inflation.evaluation.activation01).toBe(0);
    state = commitAcceptedEventTriggeredIabpActuatorCandidateV1(
      state,
      inflation,
    );

    const step = maximumAcceptedEventTriggeredIabpActuatorStepV1(
      state,
      0.5,
      null,
    );
    expect(step.candidateTimeSec).toBeCloseTo(0.4, 15);
    expect(step.boundaryOwners).toEqual(["inflation-transition-end"]);
    const tie = maximumAcceptedEventTriggeredIabpActuatorStepV1(
      state,
      0.5,
      0.4,
    );
    expect(tie.boundaryOwners).toEqual([
      "accepted-input-event",
      "inflation-transition-end",
    ]);

    state = accept(state, candidate(state, 0.35, null, null));
    const halfwayInflated = evaluateAcceptedEventTriggeredIabpActuatorAtTimeV1(
      state,
    );
    expect(halfwayInflated.activation01).toBeCloseTo(0.5, 14);
    expect(halfwayInflated.balloonVolumeMl).toBeCloseTo(20, 12);
    expect(halfwayInflated.aorticExcludedVolumeMl).toBe(
      halfwayInflated.balloonVolumeMl,
    );
    state = accept(state, candidate(state, 0.4, null, null));
    expect(evaluateAcceptedEventTriggeredIabpActuatorAtTimeV1(state)
      .activation01).toBe(1);

    const beatTwo = ventricularActivation("beat-2", 0.8, 2);
    const deflation = candidate(state, 0.8, beatTwo, null);
    expect(deflation.deflationTransitionStarted).toBe(true);
    expect(deflation.evaluation.activation01).toBe(1);
    state = accept(state, deflation);
    state = accept(state, candidate(state, 0.825, null, null));
    expect(evaluateAcceptedEventTriggeredIabpActuatorAtTimeV1(state)
      .activation01).toBeCloseTo(0.5, 14);
    state = accept(state, candidate(state, 0.8500000000000001, null, null));
    expect(evaluateAcceptedEventTriggeredIabpActuatorAtTimeV1(state)
      .activation01).toBe(0);
  });

  it.each([1, 2, 3] as const)(
    "applies exact first-beat-assisted 1:%i counting across irregular intervals",
    (assistRatio) => {
      let state = initialState(iabpConfiguration(assistRatio));
      const activationTimes = [0.1, 0.83, 1.47, 2.41, 3.02, 4.11];
      const inflationStarts: boolean[] = [];

      activationTimes.forEach((activationTimeSec, index) => {
        const activation = ventricularActivation(
          `ratio-${assistRatio}-beat-${index + 1}`,
          activationTimeSec,
          index + 1,
        );
        state = advanceWithEvent(state, activationTimeSec, activation, null);
        const closeTimeSec = activationTimeSec + 0.27;
        state = advanceToBeforeEvent(state, closeTimeSec);
        const closureCandidate = candidate(
          state,
          closeTimeSec,
          null,
          closure(
            `ratio-${assistRatio}-closure-${index + 1}`,
            activation,
            closeTimeSec,
          ),
        );
        inflationStarts.push(closureCandidate.inflationTransitionStarted);
        expect(closureCandidate.evaluation.currentBeatAssisted).toBe(
          index % assistRatio === 0,
        );
        state = accept(state, closureCandidate);
      });

      expect(inflationStarts).toEqual(
        activationTimes.map((_time, index) => index % assistRatio === 0),
      );
      expect(state.acceptedVentricularActivationCount).toBe(6);
    },
  );

  it("fails closed on missed, duplicate, wrong-parent, out-of-order, and oversized batches", () => {
    const configuration = iabpConfiguration(1);
    const initial = initialState(configuration);
    const beatOne = ventricularActivation("beat-1", 0.1, 1);
    let state = advanceWithEvent(initial, 0.1, beatOne, null);
    state = advanceToBeforeEvent(state, 0.7);

    expect(() => candidate(
      state,
      0.7,
      ventricularActivation("beat-2", 0.7, 2),
      null,
    )).toThrow(/before current beat aortic closure/);
    expect(() => candidate(
      initial,
      0.1,
      null,
      closure("orphan", beatOne, 0.1),
    )).toThrow(/requires a current captured ventricular activation/);
    expect(() => candidate(
      state,
      0.71,
      null,
      createAcceptedAorticValveClosureEventV1({
        closureEventId: "wrong-parent",
        parentCapturedVentricularActivationId: "some-other-beat",
        closureTimeSec: 0.71,
        valveId: "AoV",
      }),
    )).toThrow(/parent does not match/);
    expect(() => candidate(
      state,
      0.71,
      null,
      closure("time-mismatch", beatOne, 0.72),
    )).toThrow(/must occur at candidate time/);

    state = advanceWithEvent(
      state,
      0.72,
      null,
      closure("closure-1", beatOne, 0.72),
    );
    expect(() => candidate(
      state,
      0.73,
      null,
      closure("closure-1-duplicate", beatOne, 0.73),
    )).toThrow(/duplicate aortic valve closure/);
    state = advanceToBeforeEvent(state, 0.9);
    expect(() => candidate(state, 0.9, {
      ...beatOne,
      activationTimeSec: 0.9,
    }, null)).toThrow(/duplicate captured ventricular activation id/);

    const activationTwo = ventricularActivation("batch-two", 0.9, 2);
    expect(() => evaluateAcceptedEventTriggeredIabpActuatorCandidateV1(
      state,
      {
        candidateTimeSec: 0.9,
        capturedVentricularActivations: [activationTwo, activationTwo],
        aorticValveClosures: [],
      },
    )).toThrow(/at most one ventricular activation/);
    const closeTwo = closure("batch-close", beatOne, 0.9);
    expect(() => evaluateAcceptedEventTriggeredIabpActuatorCandidateV1(
      state,
      {
        candidateTimeSec: 0.9,
        capturedVentricularActivations: [],
        aorticValveClosures: [closeTwo, closeTwo],
      },
    )).toThrow(/at most one aortic closure/);

    const sameTimeInitial = initialState(configuration);
    expect(() => candidate(
      sameTimeInitial,
      0.2,
      ventricularActivation("same-time-orphan", 0.2, 1),
      createAcceptedAorticValveClosureEventV1({
        closureEventId: "same-time-orphan-close",
        parentCapturedVentricularActivationId: "same-time-orphan",
        closureTimeSec: 0.2,
        valveId: "AoV",
      }),
    )).toThrow(/requires a current captured ventricular activation/);
  });

  it("orders a valid same-time old-beat closure before the next capture and leaves deflation authoritative", () => {
    const configuration = iabpConfiguration(1);
    const beatOne = ventricularActivation("same-batch-beat-1", 0.1, 1);
    let state = advanceWithEvent(
      initialState(configuration),
      0.1,
      beatOne,
      null,
    );
    state = advanceToBeforeEvent(state, 0.8);
    const beatTwo = ventricularActivation("same-batch-beat-2", 0.8, 2);
    const simultaneous = candidate(
      state,
      0.8,
      beatTwo,
      closure("same-batch-closure-1", beatOne, 0.8),
    );

    expect(simultaneous).toMatchObject({
      closureProcessedBeforeVentricularActivation: true,
      inflationTransitionStarted: true,
      deflationTransitionStarted: true,
    });
    expect(simultaneous.candidateState.acceptedVentricularActivationCount)
      .toBe(2);
    expect(simultaneous.candidateState.currentCapturedVentricularActivation
      ?.capturedActivationId).toBe(beatTwo.capturedActivationId);
    expect(simultaneous.candidateState.lastAcceptedAorticValveClosure
      ?.parentCapturedVentricularActivationId)
      .toBe(beatOne.capturedActivationId);
    expect(simultaneous.candidateState.transitionMemory).toMatchObject({
      transitionKind: "deflation",
      parentCapturedVentricularActivationId: beatTwo.capturedActivationId,
      parentAorticValveClosureEventId: null,
    });
  });

  it("is deterministic under retry, exact rollback, stale commit, and candidate tamper", () => {
    const configuration = iabpConfiguration(1);
    const beatOne = ventricularActivation("retry-beat-1", 0.1, 1);
    let state = advanceWithEvent(
      initialState(configuration),
      0.1,
      beatOne,
      null,
    );
    state = advanceToBeforeEvent(state, 0.3);
    const closeOne = closure("retry-closure-1", beatOne, 0.3);
    const first = candidate(state, 0.3, null, closeOne);
    const retry = candidate(state, 0.3, null, closeOne);

    expect(retry).toEqual(first);
    expect(retry).not.toBe(first);
    expect(rollbackAcceptedEventTriggeredIabpActuatorCandidateV1(state, first))
      .toBe(state);

    const committed = accept(state, first);
    expect(() => commitAcceptedEventTriggeredIabpActuatorCandidateV1(
      committed,
      first,
    )).toThrow(/candidate must advance time/);
    const tampered = Object.freeze({
      ...first,
      inflationTransitionStarted: false,
    }) as AcceptedEventTriggeredIabpActuatorCandidateV1;
    expect(() => commitAcceptedEventTriggeredIabpActuatorCandidateV1(
      state,
      tampered,
    )).toThrow(/does not match its accepted base/);
    expect(() => rollbackAcceptedEventTriggeredIabpActuatorCandidateV1(
      state,
      tampered,
    )).toThrow(/does not match its accepted base/);
  });

  it("is invariant to accepted chunking when event and transition boundaries are preserved", () => {
    const configuration = iabpConfiguration(1);
    const beatOne = ventricularActivation("chunk-beat-1", 0.1, 1);
    let base = advanceWithEvent(
      initialState(configuration),
      0.1,
      beatOne,
      null,
    );
    base = advanceWithEvent(
      base,
      0.3,
      null,
      closure("chunk-closure-1", beatOne, 0.3),
    );

    const directAtBoundary = accept(
      base,
      candidate(base, 0.4, null, null),
    );
    let chunkedAtBoundary = accept(
      base,
      candidate(base, 0.325, null, null),
    );
    chunkedAtBoundary = accept(
      chunkedAtBoundary,
      candidate(chunkedAtBoundary, 0.35, null, null),
    );
    chunkedAtBoundary = accept(
      chunkedAtBoundary,
      candidate(chunkedAtBoundary, 0.4, null, null),
    );

    expect(actuatorSemantics(chunkedAtBoundary)).toEqual(
      actuatorSemantics(directAtBoundary),
    );
    expect(evaluateAcceptedEventTriggeredIabpActuatorAtTimeV1(
      chunkedAtBoundary,
    )).toEqual(evaluateAcceptedEventTriggeredIabpActuatorAtTimeV1(
      directAtBoundary,
    ));

    const beatTwo = ventricularActivation("chunk-beat-2", 0.83, 2);
    const directNext = accept(
      directAtBoundary,
      candidate(directAtBoundary, 0.83, beatTwo, null),
    );
    const chunkedNext = accept(
      chunkedAtBoundary,
      candidate(chunkedAtBoundary, 0.83, beatTwo, null),
    );
    expect(actuatorSemantics(chunkedNext)).toEqual(
      actuatorSemantics(directNext),
    );
    expect(evaluateAcceptedEventTriggeredIabpActuatorAtTimeV1(chunkedNext))
      .toEqual(evaluateAcceptedEventTriggeredIabpActuatorAtTimeV1(directNext));
  });
});

function configurationInput(
  assistRatio: AcceptedEventTriggeredIabpAssistRatioV1,
): AcceptedEventTriggeredIabpActuatorConfigurationInputV1 {
  return {
    configurationId: `event-iabp-config-1-to-${assistRatio}`,
    ownerInstanceId: `event-iabp-owner-1-to-${assistRatio}`,
    assistRatio,
    balloonVolumeMl: 40,
    inflationTransitionDurationSec: 0.1,
    deflationTransitionDurationSec: 0.05,
    placementNode: "SA",
  };
}

function iabpConfiguration(
  assistRatio: AcceptedEventTriggeredIabpAssistRatioV1,
): AcceptedEventTriggeredIabpActuatorConfigurationV1 {
  return createAcceptedEventTriggeredIabpActuatorConfigurationV1(
    configurationInput(assistRatio),
  );
}

function initialState(
  configuration: AcceptedEventTriggeredIabpActuatorConfigurationV1,
): AcceptedEventTriggeredIabpActuatorStateV1 {
  return initializeAcceptedEventTriggeredIabpActuatorStateV1(configuration, {
    acceptedTimeSec: 0,
  });
}

function ventricularActivation(
  id: string,
  activationTimeSec: number,
  ordinal: number,
): CapturedElectricalActivationV2 {
  return Object.freeze({
    activationSchemaId: CAPTURED_ELECTRICAL_ACTIVATION_V2_ID,
    schemaVersion: 2 as const,
    capturedActivationId: id,
    parentSourceImpulseId: `source-impulse:${id}`,
    upstreamCapturedActivationId: null,
    chamber: "ventricular" as const,
    gateInstanceId: "ventricular-capture-gate",
    activationTimeSec,
    sourceKind: "pacing" as const,
    sourceId: "explicit-ventricular-pacer",
    sourceSequence: ordinal,
    capturePriority: ELECTRICAL_CAPTURE_PRIORITY_V2.pacing,
    captureOrdinal: ordinal,
    ownerRevision: ordinal,
  });
}

function closure(
  id: string,
  activation: CapturedElectricalActivationV2,
  closureTimeSec: number,
): AcceptedAorticValveClosureEventV1 {
  return createAcceptedAorticValveClosureEventV1({
    closureEventId: id,
    parentCapturedVentricularActivationId: activation.capturedActivationId,
    closureTimeSec,
    valveId: "AoV",
  });
}

function candidate(
  state: AcceptedEventTriggeredIabpActuatorStateV1,
  timeSec: number,
  activation: CapturedElectricalActivationV2 | null,
  close: AcceptedAorticValveClosureEventV1 | null,
): AcceptedEventTriggeredIabpActuatorCandidateV1 {
  return evaluateAcceptedEventTriggeredIabpActuatorCandidateV1(state, {
    candidateTimeSec: timeSec,
    capturedVentricularActivations: activation === null ? [] : [activation],
    aorticValveClosures: close === null ? [] : [close],
  });
}

function accept(
  state: AcceptedEventTriggeredIabpActuatorStateV1,
  proposal: AcceptedEventTriggeredIabpActuatorCandidateV1,
): AcceptedEventTriggeredIabpActuatorStateV1 {
  return commitAcceptedEventTriggeredIabpActuatorCandidateV1(state, proposal);
}

function advanceToBeforeEvent(
  state: AcceptedEventTriggeredIabpActuatorStateV1,
  eventTimeSec: number,
): AcceptedEventTriggeredIabpActuatorStateV1 {
  let current = state;
  while (
    current.transitionMemory.endTimeSec > current.acceptedTimeSec
    && current.transitionMemory.endTimeSec < eventTimeSec
  ) {
    current = accept(current, candidate(
      current,
      current.transitionMemory.endTimeSec,
      null,
      null,
    ));
  }
  return current;
}

function advanceWithEvent(
  state: AcceptedEventTriggeredIabpActuatorStateV1,
  eventTimeSec: number,
  activation: CapturedElectricalActivationV2 | null,
  close: AcceptedAorticValveClosureEventV1 | null,
): AcceptedEventTriggeredIabpActuatorStateV1 {
  const before = advanceToBeforeEvent(state, eventTimeSec);
  return accept(before, candidate(before, eventTimeSec, activation, close));
}

function actuatorSemantics(
  state: AcceptedEventTriggeredIabpActuatorStateV1,
): unknown {
  return {
    configuration: state.configuration,
    initialAcceptedTimeSec: state.initialAcceptedTimeSec,
    acceptedTimeSec: state.acceptedTimeSec,
    acceptedVentricularActivationCount:
      state.acceptedVentricularActivationCount,
    currentCapturedVentricularActivation:
      state.currentCapturedVentricularActivation,
    lastAcceptedAorticValveClosure: state.lastAcceptedAorticValveClosure,
    transitionMemory: state.transitionMemory,
  };
}
