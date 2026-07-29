import { describe, expect, it } from "vitest";
import {
  hotPathIntegrityTierV1,
  selectHotPathIntegrityTierV1,
} from "@/engine/hotPathIntegrityTierV1";
import {
  MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_COMMAND_KINDS_V1,
  MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_LANE_BINDING_V1,
  MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
  type MainWireIntegratedScientificWorkerCommandKindV1,
  type MainWireIntegratedScientificWorkerCommandV1,
  type MainWireIntegratedScientificWorkerResponseV1,
} from "@/engine/myocardium/MainWireIntegratedScientificWorkerProtocolV1";
import {
  MainWireIntegratedScientificWorkerKernelV1,
} from "@/engine/myocardium/MainWireIntegratedScientificWorkerKernelV1";
import {
  integratedLanePresentationTargetTimeSecV1,
} from "@/engine/myocardium/MainWireIntegratedScientificSession";
import {
  MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1,
} from "@/engine/scientificBrowser/mainWireIntegratedScientificBrowserRuntimeLimitsV1";

describe("MainWireIntegratedScientificWorkerKernelV1", () => {
  it("reports the effective integrity tier in every response", async () => {
    const previous = hotPathIntegrityTierV1();
    selectHotPathIntegrityTierV1("hot-path-lean");
    try {
      const response =
        await new MainWireIntegratedScientificWorkerKernelV1().handle(
          command("observe", "observe-tier", "missing-session"),
        );
      expect(response).toMatchObject({
        hotPathIntegrityTier: "hot-path-lean",
        ok: false,
        error: { code: "unknown-session-id" },
      });
    } finally {
      selectHotPathIntegrityTierV1(previous);
    }
  });

  it("exposes only the six V3 commands and returns the exact capability descriptor", async () => {
    expect(
      MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_COMMAND_KINDS_V1,
    ).toEqual([
      "createWorkerOwnedPresetSession",
      "observe",
      "advanceToPresentationOrdinal",
      "getOperationalCheckpoint",
      "restoreOperationalCheckpoint",
      "disposeSession",
    ]);
    expect(
      MAIN_WIRE_INTEGRATED_SCIENTIFIC_BROWSER_RUNTIME_LIMITS_V1,
    ).toMatchObject({
      maximumRequestCountPerLifetime: 100_000,
      workerRotationRequestCount: 75_000,
      maximumSubstepCountPerPresentationCommand: 16,
      requestTimeoutMs: 60_000,
    });

    const kernel = new MainWireIntegratedScientificWorkerKernelV1();
    const created = await kernel.handle(command(
      "createWorkerOwnedPresetSession",
      "create-1",
      "session-1",
    ));
    expect(created).toMatchObject({
      ok: true,
      hotPathIntegrityTier: "full-invariant",
      commandKind: "createWorkerOwnedPresetSession",
      laneDescriptor: {
        laneKind:
          MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_LANE_BINDING_V1.laneKind,
        laneId:
          MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_LANE_BINDING_V1.laneId,
        releaseRef:
          MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_LANE_BINDING_V1.releaseRef,
        capabilities: {
          liveWorkerExecution: { available: true },
          operationalWorkerRotationCheckpoint: { available: true },
          suspendResumePresentation: {
            available: false,
            reason: "out-of-scope-for-this-increment",
          },
          interactiveResearchControls: { available: false },
          strictPeriodicSettlement: { available: false },
          persistedWarmSnapshot: { available: false },
          exactSignalExport: { available: false },
        },
      },
      payload: {
        kind: "worker-owned-preset-session-created",
        session: {
          presentationOrdinal: 0,
          acceptedRevision: 0,
          acceptedTimeSec: 0,
        },
      },
    });
  });

  it("maps ordinals inside the Worker and reports a clipped boundary as two substeps but one sample", async () => {
    const kernel = new MainWireIntegratedScientificWorkerKernelV1();
    expectSuccess(await kernel.handle(command(
      "createWorkerOwnedPresetSession",
      "create-boundary",
      "boundary-session",
    )));

    let boundary:
      MainWireIntegratedScientificWorkerResponseV1 | null = null;
    for (let ordinal = 1; ordinal <= 407; ordinal += 1) {
      const response = await kernel.handle({
        protocolId:
          MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
        kind: "advanceToPresentationOrdinal",
        requestId: `advance-${ordinal}`,
        sessionId: "boundary-session",
        presentationOrdinal: ordinal,
      });
      expectSuccess(response);
      if (ordinal === 407) boundary = response;
    }

    expect(boundary).toMatchObject({
      ok: true,
      commandKind: "advanceToPresentationOrdinal",
      payload: {
        kind: "presentation-advance",
        status: "advanced",
        presentationOrdinal: 407,
        presentationTimeSec:
          integratedLanePresentationTargetTimeSecV1(407),
        acceptedTimeSec:
          integratedLanePresentationTargetTimeSecV1(407),
        acceptedRevisionSpanFromPrevious: 2,
        internalAcceptedSubstepCount: 2,
        boundaryClippedSubstepCount: 1,
        emittedPresentationSample: true,
      },
    });
    if (boundary?.ok !== true) throw new Error("boundary response failed");
    if (
      boundary.commandKind !== "advanceToPresentationOrdinal"
    ) throw new Error("boundary response kind changed");
    expect(boundary.payload.substeps).toHaveLength(2);
    expect(boundary.payload.substeps).toContainEqual(expect.objectContaining({
      clippedByRhythmBoundary: true,
      rhythmBoundaryTimeSec: 0.8125,
      landedOnPresentationTarget: false,
    }));
    expect(boundary.payload.observableFrame.values[
      "coronary.flow.total"
    ].availability).toBe("available");
    expect(boundary.payload.observableFrame.values[
      "device.LVAD.flow"
    ].availability).toBe("available");
  });

  it("bounds payloads, rejects schema/context mismatch, and retires session and request identities", async () => {
    const bounded = new MainWireIntegratedScientificWorkerKernelV1({
      maximumCommandJsonBytes: 256,
    });
    const tooLarge = await bounded.handle({
      protocolId:
        MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
      kind: "restoreOperationalCheckpoint",
      requestId: "large-restore",
      sessionId: "large-session",
      checkpoint: { padding: "x".repeat(1_000) },
    });
    expect(tooLarge).toMatchObject({
      ok: false,
      error: { code: "invalid-command" },
    });

    const kernel = new MainWireIntegratedScientificWorkerKernelV1();
    const protocolMismatch = await kernel.handle({
      protocolId: "wrong-protocol",
      kind: "observe",
      requestId: "wrong-protocol-request",
      sessionId: "session-1",
    });
    expect(protocolMismatch).toMatchObject({
      ok: false,
      error: { code: "invalid-command" },
    });
    const extraField = await kernel.handle({
      ...command("observe", "extra-field", "session-1"),
      controls: {},
    });
    expect(extraField).toMatchObject({
      ok: false,
      error: { code: "invalid-command" },
    });

    const createCommand = command(
      "createWorkerOwnedPresetSession",
      "create-retired",
      "retired-session",
    );
    expectSuccess(await kernel.handle(createCommand));
    const replay = await kernel.handle(createCommand);
    expect(replay).toMatchObject({
      ok: false,
      error: { code: "duplicate-request-id" },
    });
    expectSuccess(await kernel.handle(command(
      "disposeSession",
      "dispose-retired",
      "retired-session",
    )));
    const retired = await kernel.handle(command(
      "createWorkerOwnedPresetSession",
      "create-retired-again",
      "retired-session",
    ));
    expect(retired).toMatchObject({
      ok: false,
      error: { code: "retired-session-id" },
    });

    const invalidCheckpoint = await kernel.handle({
      protocolId:
        MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
      kind: "restoreOperationalCheckpoint",
      requestId: "restore-invalid",
      sessionId: "invalid-checkpoint-session",
      checkpoint: {},
    });
    expect(invalidCheckpoint).toMatchObject({
      ok: false,
      error: { code: "operational-restore-rejected" },
    });
  });

  it("reserves checkpoint and disposal requests after the ordinary lifetime cap", async () => {
    const kernel = new MainWireIntegratedScientificWorkerKernelV1({
      maximumRequestCountPerKernelLifetime: 2,
    });
    expectSuccess(await kernel.handle(command(
      "createWorkerOwnedPresetSession",
      "lifetime-create",
      "lifetime-session",
    )));
    expectSuccess(await kernel.handle(command(
      "observe",
      "lifetime-observe",
      "lifetime-session",
    )));
    const exhausted = await kernel.handle(command(
      "observe",
      "lifetime-exhausted",
      "lifetime-session",
    ));
    expect(exhausted).toMatchObject({
      ok: false,
      error: { code: "request-capacity-exceeded" },
    });
    expectSuccess(await kernel.handle(command(
      "getOperationalCheckpoint",
      "lifetime-checkpoint",
      "lifetime-session",
    )));
    expectSuccess(await kernel.handle(command(
      "disposeSession",
      "lifetime-dispose",
      "lifetime-session",
    )));
    const recoveryExhausted = await kernel.handle(command(
      "disposeSession",
      "lifetime-dispose-again",
      "lifetime-session",
    ));
    expect(recoveryExhausted).toMatchObject({
      ok: false,
      error: { code: "request-capacity-exceeded" },
    });
  });
});

function command(
  kind: Exclude<
    MainWireIntegratedScientificWorkerCommandKindV1,
    "advanceToPresentationOrdinal" | "restoreOperationalCheckpoint"
  >,
  requestId: string,
  sessionId: string,
): MainWireIntegratedScientificWorkerCommandV1 {
  return Object.freeze({
    protocolId:
      MAIN_WIRE_INTEGRATED_SCIENTIFIC_WORKER_PROTOCOL_V1_ID,
    kind,
    requestId,
    sessionId,
  });
}

function expectSuccess(
  response: MainWireIntegratedScientificWorkerResponseV1,
): asserts response is Extract<
  MainWireIntegratedScientificWorkerResponseV1,
  { ok: true }
> {
  expect(response.ok).toBe(true);
  if (!response.ok) {
    throw new Error(`${response.error.code}: ${response.error.message}`);
  }
}
