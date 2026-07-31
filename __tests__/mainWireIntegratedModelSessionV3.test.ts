import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V3_ID,
} from "@/engine/myocardium/MainWireIntegratedModelCheckpointV3";
import {
  limitMainWireIntegratedModelCandidateTimeV3,
  stepMainWireIntegratedModelV3,
  type MainWireIntegratedModelAcceptedStateV3,
  type MainWireIntegratedComposedRhythmStepContextV3,
  type MainWireIntegratedModelStepFailureReasonV3,
} from "@/engine/myocardium/MainWireIntegratedModelTransactionV3";
import {
  createMainWireIntegratedModelRuntimeV3,
  type MainWireIntegratedModelRuntimeV3,
} from "@/engine/myocardium/MainWireIntegratedModelRuntimeV3";
import {
  MAIN_WIRE_INTEGRATED_MODEL_PRESENTATION_COVERAGE_V3,
  MainWireIntegratedModelSessionV3,
  mainWireIntegratedModelPresentationTargetTimeSecV3,
  type MainWireIntegratedModelPresentationAdvanceV3,
} from "@/engine/myocardium/MainWireIntegratedModelSessionV3";
import type {
  MainWireNormalAdultFiveWallMechanicsStateV1,
} from "@/engine/myocardium/experiments/MainWireNormalAdultFiveWallClosedLoopV1";
import {
  createCanonicalMainWireNormalAdultFiveWallProviderV1,
  type MainWireNormalAdultFiveWallProviderV1,
} from "@/engine/myocardium/mechanics/MainWireNormalAdultFiveWallProviderV1";
import {
  createNoExternalAtrialSourceBatchV2,
} from "@/engine/myocardium/rhythm/acceptedComposedRhythmTransactionV2";

type WallState = MainWireNormalAdultFiveWallMechanicsStateV1;
type AcceptedState = MainWireIntegratedModelAcceptedStateV3<WallState>;
type Advanced = Extract<
  MainWireIntegratedModelPresentationAdvanceV3,
  { status: "advanced" }
>;

describe("MainWireIntegratedModelSessionV3", () => {
  it("T-A1/T-A3 — lands exactly for 500 ordinals and stays in direct V3 lockstep", async () => {
    const session = await MainWireIntegratedModelSessionV3.create();
    const directRuntime = await createMainWireIntegratedModelRuntimeV3();
    let direct = directRuntime.cold.acceptedState;

    for (let ordinal = 1; ordinal <= 500; ordinal += 1) {
      const targetTimeSec =
        mainWireIntegratedModelPresentationTargetTimeSecV3(ordinal);
      const result = session.advanceToPresentationTime(targetTimeSec);
      expect(result.status).toBe("advanced");
      if (result.status !== "advanced") {
        throw new Error(unexpectedAdvanceStatus(result));
      }
      expect(result.acceptedTimeSec).toBe(targetTimeSec);
      expect(result.presentationTimeSec).toBe(targetTimeSec);
      expect(session.currentAcceptedState().acceptedTimeSec).toBe(
        targetTimeSec,
      );
      direct = advanceDirectToPresentationTime(
        directRuntime,
        direct,
        targetTimeSec,
      );
    }

    expect(session.currentAcceptedState()).toEqual(direct);
    expect(session.currentAcceptedState().acceptedTimeSec).toBe(1);
    expect(
      session.currentAcceptedState()
        .dynamicMechanicalSupport.acceptedFlowMlPerSec,
    ).toEqual({
      LVAD: 0,
      IMPELLA: 0,
      VA_ECMO: 0,
      VV_ECMO: 0,
    });
    const finalStep = session.observe().lastAcceptedStep;
    expect(finalStep).not.toBeNull();
    if (finalStep === null) throw new Error("final accepted readback is absent");
    expect(Math.abs(
      finalStep.dynamicMechanicalSupportTrial.conservationResidualMlPerSec,
    )).toBeLessThan(1e-12);
    expect(Math.abs(
      finalStep.coronaryStep.baseStep.circulationTrial.diagnostics
        .totalBloodVolumeErrorMl,
    )).toBeLessThan(1e-8);
    expect(Math.abs(
      finalStep.coronaryStep.baseStep.coronaryTrial.diagnostics
        .exactBloodVolumeLedgerResidualMl,
    )).toBeLessThan(1e-8);
  }, 120_000);

  it("T-A2/T6/T12 — emits one ordinal sample across the 0.8125 s rhythm boundary", async () => {
    const session = await MainWireIntegratedModelSessionV3.create();
    const emittedSamples: Advanced[] = [];
    let presentationOrdinal = 0;

    while (presentationOrdinal < 406) {
      const result = session.advanceToPresentationTime(
        mainWireIntegratedModelPresentationTargetTimeSecV3(
          presentationOrdinal + 1,
        ),
      );
      expect(result.status).toBe("advanced");
      if (result.status !== "advanced") {
        throw new Error(unexpectedAdvanceStatus(result));
      }
      emittedSamples.push(result);
      presentationOrdinal += 1;
    }

    const emittedBeforeBoundary = emittedSamples.length;
    const boundaryResult = session.advanceToPresentationTime(
      mainWireIntegratedModelPresentationTargetTimeSecV3(
        presentationOrdinal + 1,
      ),
    );
    expect(boundaryResult.status).toBe("advanced");
    if (boundaryResult.status !== "advanced") {
      throw new Error(unexpectedAdvanceStatus(boundaryResult));
    }
    emittedSamples.push(boundaryResult);
    presentationOrdinal += 1;

    expect(boundaryResult.internalAcceptedSubstepCount).toBe(2);
    expect(boundaryResult.acceptedRevisionSpanFromPrevious).toBe(2);
    expect(boundaryResult.boundaryClippedSubstepCount).toBe(1);
    expect(boundaryResult.substeps.filter((substep) =>
      substep.clippedByRhythmBoundary)).toEqual([
        expect.objectContaining({
          acceptedTimeSec: 0.8125,
          landedOnPresentationTarget: false,
          clippedByRhythmBoundary: true,
          rhythmBoundaryTimeSec: 0.8125,
        }),
      ]);
    expect(emittedSamples.length - emittedBeforeBoundary).toBe(1);
    expect(presentationOrdinal).toBe(407);
  }, 120_000);

  it("T-A4 — retries a returned step failure without mutating its accepted input", async () => {
    const session = await MainWireIntegratedModelSessionV3.create();
    const previous = session.currentAcceptedState();
    const materialBefore = createCanonicalMainWireNormalAdultFiveWallProviderV1()
      .stateCodec.encode(previous.coronary.mechanics.materialState);
    installProvider(
      session,
      failingProvider(() => true, "forced retry-purity failure"),
    );
    const target = mainWireIntegratedModelPresentationTargetTimeSecV3(1);

    const first = session.advanceToPresentationTime(target);
    const retry = session.advanceToPresentationTime(target);

    expect(first.status).toBe("failed");
    expect(retry).toEqual(first);
    expect(session.currentAcceptedState()).toBe(previous);
    expect(createCanonicalMainWireNormalAdultFiveWallProviderV1()
      .stateCodec.encode(previous.coronary.mechanics.materialState)).toEqual(
        materialBefore,
      );
  });

  it("T-A5/T2/T15 — continues exactly after boundary and off-grid operational checkpoints", async () => {
    const boundarySession = await MainWireIntegratedModelSessionV3.create();
    advanceSessionThroughOrdinal(boundarySession, 400);
    const boundaryCheckpoint = await boundarySession.checkpointOperational();
    expect(boundaryCheckpoint.checkpointId).toBe(
      MAIN_WIRE_INTEGRATED_MODEL_CHECKPOINT_V3_ID,
    );
    expect(boundaryCheckpoint).not.toHaveProperty("exactResumeClaim");
    const boundaryRestored =
      await MainWireIntegratedModelSessionV3.restoreOperationalCheckpoint(
        JSON.parse(JSON.stringify(boundaryCheckpoint)),
      );
    expect(boundaryRestored.currentAcceptedState()).toEqual(
      boundarySession.currentAcceptedState(),
    );
    expect(boundaryRestored.observe()).toMatchObject({
      source: "operational-checkpoint-restore",
      lastAcceptedStep: null,
    });
    for (let ordinal = 401; ordinal <= 410; ordinal += 1) {
      const target = mainWireIntegratedModelPresentationTargetTimeSecV3(ordinal);
      expectAdvanced(boundarySession.advanceToPresentationTime(target));
      expectAdvanced(boundaryRestored.advanceToPresentationTime(target));
    }
    expect(boundaryRestored.currentAcceptedState()).toEqual(
      boundarySession.currentAcceptedState(),
    );

    const offGridSession = await partiallyAdvanceAcrossRhythmBoundary();
    expect(offGridSession.currentAcceptedState().acceptedTimeSec).toBe(0.8125);
    const offGridCheckpoint = await offGridSession.checkpointOperational();
    const offGridRestored =
      await MainWireIntegratedModelSessionV3.restoreOperationalCheckpoint(
        JSON.parse(JSON.stringify(offGridCheckpoint)),
      );
    expect(offGridRestored.currentAcceptedState()).toEqual(
      offGridSession.currentAcceptedState(),
    );

    const uninterrupted = await MainWireIntegratedModelSessionV3.create();
    advanceSessionThroughOrdinal(uninterrupted, 407);
    expectAdvanced(offGridRestored.advanceToPresentationTime(
      mainWireIntegratedModelPresentationTargetTimeSecV3(407),
    ));
    expect(offGridRestored.currentAcceptedState()).toEqual(
      uninterrupted.currentAcceptedState(),
    );
  }, 120_000);

  // These cases pin independent defences at two layers. Collapsing them into
  // one path in a future refactor would silently remove a defence.
  it("T-A6a — throws when regular mode receives an external AF boundary", async () => {
    const session = await MainWireIntegratedModelSessionV3.create();
    const target = mainWireIntegratedModelPresentationTargetTimeSecV3(1);
    installRhythmInput(session, {
      externalAfNextBoundaryTimeSec: target,
      externalAtrialSourceBatch: null,
    });

    expect(() => session.advanceToPresentationTime(target)).toThrow(
      /regular atrial mode must not supply an external AF boundary/,
    );
    expect(session.currentAcceptedState()).toMatchObject({
      acceptedTimeSec: 0,
      revision: 0,
    });
  });

  it("T-A6b — returns a step-union failure for an external AF batch", async () => {
    const session = await MainWireIntegratedModelSessionV3.create();
    const target = mainWireIntegratedModelPresentationTargetTimeSecV3(1);
    installRhythmInput(session, {
      externalAfNextBoundaryTimeSec: null,
      externalAtrialSourceBatch: createNoExternalAtrialSourceBatchV2(target),
    });
    const expectedReason: MainWireIntegratedModelStepFailureReasonV3 =
      "outer-input-clock-binding-or-boundary-rejected";
    let batchRejected: MainWireIntegratedModelPresentationAdvanceV3 | undefined;

    expect(() => {
      batchRejected = session.advanceToPresentationTime(target);
    }).not.toThrow();
    expect(batchRejected).toMatchObject({
      status: "failed",
      reason: expectedReason,
      message: expect.stringMatching(
        /regular composed rhythm rejects external AF inputs/,
      ),
      acceptedTimeSec: 0,
      acceptedRevision: 0,
      partiallyAdvanced: false,
      internalAcceptedSubstepCount: 0,
      requestedPresentationTimeSec: target,
    });
  });

  it("T13 — retains the previous presentation observation when a call partially advances and fails", async () => {
    const session = await MainWireIntegratedModelSessionV3.create();
    advanceSessionThroughOrdinal(session, 406);
    const emittedSamples: Advanced[] = [];
    const requestedPresentationTimeSec =
      mainWireIntegratedModelPresentationTargetTimeSecV3(407);
    const retainedObservation = session.observe();
    installProvider(
      session,
      failingProvider(
        (candidateTimeSec) => candidateTimeSec > 0.8125,
        "forced post-boundary presentation failure",
      ),
    );

    const failed = session.advanceToPresentationTime(
      requestedPresentationTimeSec,
    );
    if (failed.status === "advanced") emittedSamples.push(failed);

    expect(failed).toMatchObject({
      status: "failed",
      acceptedTimeSec: 0.8125,
      partiallyAdvanced: true,
      internalAcceptedSubstepCount: 1,
      requestedPresentationTimeSec,
    });
    expect(failed.acceptedTimeSec).not.toBe(requestedPresentationTimeSec);
    expect(emittedSamples).toEqual([]);
    expect(session.observe()).toBe(retainedObservation);
    expect(session.observe().acceptedState.acceptedTimeSec).toBe(0.812);
    expect(session.currentAcceptedState().acceptedTimeSec).toBe(0.8125);
  }, 120_000);

  it("maps presentation identity without phase or accepted-revision arithmetic", async () => {
    expect(mainWireIntegratedModelPresentationTargetTimeSecV3(0)).toBe(0);
    expect(mainWireIntegratedModelPresentationTargetTimeSecV3(407)).toBe(
      407 * 0.002,
    );
    expect(() => mainWireIntegratedModelPresentationTargetTimeSecV3(-1)).toThrow(
      /ordinal is invalid/,
    );
    expect(() => mainWireIntegratedModelPresentationTargetTimeSecV3(1.5)).toThrow(
      /ordinal is invalid/,
    );
    expect(MAIN_WIRE_INTEGRATED_MODEL_PRESENTATION_COVERAGE_V3).toBe(
      "integrated-v3-live-presentation",
    );

    const session = await MainWireIntegratedModelSessionV3.create();
    expect(session.advanceToPresentationTime(0)).toMatchObject({
      status: "already-at-target",
      internalAcceptedSubstepCount: 0,
    });
    expectAdvanced(session.advanceToPresentationTime(
      mainWireIntegratedModelPresentationTargetTimeSecV3(1),
    ));
    expect(() => session.advanceToPresentationTime(0)).toThrow(
      /precedes accepted time/,
    );
  });
});

function advanceDirectToPresentationTime(
  runtime: MainWireIntegratedModelRuntimeV3,
  initial: AcceptedState,
  targetTimeSec: number,
): AcceptedState {
  let accepted = initial;
  let substeps = 0;
  while (accepted.acceptedTimeSec !== targetTimeSec) {
    if (substeps >= 16) throw new Error("direct lockstep substep cap exceeded");
    const limit = limitMainWireIntegratedModelCandidateTimeV3(
      accepted,
      targetTimeSec,
      {
        configuration: runtime.rhythm.configuration,
        externalAfNextBoundaryTimeSec: null,
      },
      runtime.profile,
      runtime.config,
    );
    const result = stepMainWireIntegratedModelV3(
      runtime.provider,
      accepted,
      {
        candidateTimeSec: limit.candidateTimeSec,
        coronary: runtime.coronaryStepInput,
        rhythm: {
          configuration: runtime.rhythm.configuration,
          externalAfNextBoundaryTimeSec: null,
          externalAtrialSourceBatch: null,
        },
        dynamicMechanicalSupport: runtime.dynamicMechanicalSupport,
      },
    );
    if (result.converged === false) throw new Error(result.message);
    accepted = result.acceptedState;
    substeps += 1;
  }
  return accepted;
}

function advanceSessionThroughOrdinal(
  session: MainWireIntegratedModelSessionV3,
  finalOrdinal: number,
): void {
  const initialOrdinal = Math.round(
    session.currentAcceptedState().acceptedTimeSec / 0.002,
  );
  for (
    let ordinal = initialOrdinal + 1;
    ordinal <= finalOrdinal;
    ordinal += 1
  ) {
    expectAdvanced(session.advanceToPresentationTime(
      mainWireIntegratedModelPresentationTargetTimeSecV3(ordinal),
    ));
  }
}

async function partiallyAdvanceAcrossRhythmBoundary():
Promise<MainWireIntegratedModelSessionV3> {
  const session = await MainWireIntegratedModelSessionV3.create();
  advanceSessionThroughOrdinal(session, 406);
  installProvider(
    session,
    failingProvider(
      (candidateTimeSec) => candidateTimeSec > 0.8125,
      "forced post-boundary presentation failure",
    ),
  );
  const failed = session.advanceToPresentationTime(
    mainWireIntegratedModelPresentationTargetTimeSecV3(407),
  );
  expect(failed).toMatchObject({
    status: "failed",
    acceptedTimeSec: 0.8125,
    partiallyAdvanced: true,
    internalAcceptedSubstepCount: 1,
  });
  return session;
}

function failingProvider(
  shouldFail: (candidateTimeSec: number) => boolean,
  message: string,
): MainWireNormalAdultFiveWallProviderV1 {
  const base = createCanonicalMainWireNormalAdultFiveWallProviderV1();
  return Object.freeze({
    ...base,
    evaluateTrial(input) {
      if (shouldFail(input.candidateTimeSec)) throw new Error(message);
      return base.evaluateTrial(input);
    },
  });
}

function installProvider(
  session: MainWireIntegratedModelSessionV3,
  provider: MainWireNormalAdultFiveWallProviderV1,
): void {
  (session as unknown as {
    provider: MainWireNormalAdultFiveWallProviderV1;
  }).provider = provider;
}

function installRhythmInput(
  session: MainWireIntegratedModelSessionV3,
  input: Pick<
    MainWireIntegratedComposedRhythmStepContextV3,
    "externalAfNextBoundaryTimeSec" | "externalAtrialSourceBatch"
  >,
): void {
  const sessionInternals = session as unknown as {
    rhythmInput: MainWireIntegratedComposedRhythmStepContextV3;
    runtime: MainWireIntegratedModelRuntimeV3;
  };
  sessionInternals.rhythmInput = Object.freeze({
    configuration: sessionInternals.runtime.rhythm.configuration,
    ...input,
  });
}

function expectAdvanced(
  result: MainWireIntegratedModelPresentationAdvanceV3,
): asserts result is Advanced {
  expect(result.status).toBe("advanced");
  if (result.status !== "advanced") {
    throw new Error(unexpectedAdvanceStatus(result));
  }
}

function unexpectedAdvanceStatus(
  result: Exclude<
    MainWireIntegratedModelPresentationAdvanceV3,
    { status: "advanced" }
  >,
): string {
  return result.status === "failed"
    ? result.message
    : `unexpected already-at-target result at ${result.acceptedTimeSec}`;
}
