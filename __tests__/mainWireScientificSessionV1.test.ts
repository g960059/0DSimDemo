import { describe, expect, it } from "vitest";

import {
  MAIN_WIRE_SCIENTIFIC_SESSION_V1_CLAIM,
  MainWireScientificSessionV1,
  createMainWireScientificSessionV1,
} from "@/engine/scientific/runtime/MainWireScientificSessionV1";
import {
  createMainWireAdultFiveWallNonCoronaryReleaseV1,
  mainWireAdultFiveWallNonCoronaryReleaseInputV1,
} from "@/engine/scientific/assembly";
import { createSimulationReleaseV1 } from "@/engine/scientific/release";

describe("main-wire ScientificSession V1", () => {
  it("hosts the fixed canonical assembly and promotes accepted steps only", async () => {
    const session = await createMainWireScientificSessionV1();
    const cold = session.observe();

    expect(session.stateIdentity()).toMatchObject({
      revision: 0,
      acceptedTimeSec: 0,
      totalBloodVolumeMl: 5522.11,
    });
    expect(cold.source).toBe("cold-initialization");
    expect(Object.values(cold.chamber).every((chamber) =>
      Number.isFinite(chamber.volumeMl)
      && Number.isFinite(chamber.absolutePressureMmHg)))
      .toBe(true);
    expect(Object.values(cold.valve).every((valve) =>
      valve.flowMlPerSec === null
      && valve.flowAvailability === "not-evaluated-at-accepted-state"))
      .toBe(true);

    const beforeRejectedStep = JSON.stringify(await session.checkpointExact());
    const rejected = session.step(0);
    expect(rejected).toMatchObject({
      converged: false,
      reason: "step-evaluation-threw",
      acceptedStateUnchanged: true,
    });
    expect(JSON.stringify(await session.checkpointExact()))
      .toBe(beforeRejectedStep);

    const transient = session.runTransient({ dtSec: 0.002, stepCount: 1 });
    expect(transient).toMatchObject({
      completed: true,
      requestedStepCount: 1,
      completedStepCount: 1,
      failure: null,
    });
    expect(session.stateIdentity()).toMatchObject({
      revision: 1,
      acceptedTimeSec: 0.002,
      totalBloodVolumeMl: 5522.11,
    });
    const observed = transient.finalObservation;
    expect(observed).toMatchObject({
      revision: 1,
      acceptedTimeSec: 0.002,
      source: "accepted-step",
      pulmonaryVenousFlowAvailability: "available",
    });
    expect(Object.values(observed.chamber).every((chamber) =>
      Number.isFinite(chamber.volumeMl)
      && Number.isFinite(chamber.absolutePressureMmHg)
      && Number.isFinite(chamber.transmuralPressureMmHg)))
      .toBe(true);
    expect(Object.values(observed.valve).every((valve) =>
      Number.isFinite(valve.flowMlPerSec)
      && Number.isFinite(valve.openingFraction01)
      && valve.flowAvailability === "available"))
      .toBe(true);
    expect(Object.values(observed.diagnostics).every((value) =>
      value === null || Number.isFinite(value)))
      .toBe(true);
    expect(MAIN_WIRE_SCIENTIFIC_SESSION_V1_CLAIM).toMatchObject({
      assembly: "fixed-normal-adult-five-wall-noncoronary",
      equationDuplicationInSession: false,
      acceptedStateOwner: "session-private",
      stepCommit: "atomic-circulation-and-mechanics",
    });
  }, 120_000);

  it("validates the full release and restores only its SHA-256-bound checkpoint", async () => {
    const canonicalRelease =
      await createMainWireAdultFiveWallNonCoronaryReleaseV1();
    const source = await MainWireScientificSessionV1.initialize(
      JSON.parse(JSON.stringify(canonicalRelease)),
    );
    const checkpoint = JSON.parse(
      JSON.stringify(await source.checkpointExact()),
    ) as Awaited<ReturnType<typeof source.checkpointExact>>;
    const restored = await MainWireScientificSessionV1.restoreExact(
      canonicalRelease,
      checkpoint,
    );

    expect(restored.stateIdentity()).toEqual(source.stateIdentity());
    expect(restored.observe()).toMatchObject({
      source: "exact-checkpoint-restore",
      revision: 0,
      acceptedTimeSec: 0,
    });
    expect(Object.values(restored.observe().chamber).every((chamber) =>
      chamber.absolutePressureMmHg === null
      && chamber.pressureAvailability
        === "not-evaluated-at-accepted-state"))
      .toBe(true);
    await expect(restored.checkpointExact()).resolves.toEqual(checkpoint);

    const fakeInput = JSON.parse(JSON.stringify(
      mainWireAdultFiveWallNonCoronaryReleaseInputV1(),
    ));
    fakeInput.id = "circleheart/well-formed-but-different-release";
    fakeInput.scientificModel.modelId = "different-scientific-model";
    const wellFormedFakeRelease = await createSimulationReleaseV1(fakeInput);
    await expect(MainWireScientificSessionV1.initialize(
      wellFormedFakeRelease,
    )).rejects.toThrow(/does not identify the fixed canonical assembly/);

    const mismatchedCheckpoint = {
      ...checkpoint,
      releaseRef: wellFormedFakeRelease.ref,
    };
    await expect(MainWireScientificSessionV1.restoreExact(
      canonicalRelease,
      mismatchedCheckpoint,
    )).rejects.toThrow(/release identity mismatch/);

    const tamperedRelease = JSON.parse(JSON.stringify(canonicalRelease));
    tamperedRelease.manifest.scientificModel.snapshot.transaction.id =
      "tampered-transaction";
    await expect(MainWireScientificSessionV1.initialize(
      tamperedRelease,
    )).rejects.toThrow(/canonical manifest digest/);

    const tamperedCheckpoint = JSON.parse(JSON.stringify(checkpoint));
    tamperedCheckpoint.transaction.circulation.state
      .dynamicEdgeFlowsMlPerSec.Ao_SA += 1;
    await expect(MainWireScientificSessionV1.restoreExact(
      canonicalRelease,
      tamperedCheckpoint,
    )).rejects.toThrow(/outer SHA-256 mismatch/);

    await expect(MainWireScientificSessionV1.restoreExact(
      canonicalRelease,
      null,
    )).rejects.toThrow(/exact-checkpoint envelope mismatch/);
    await expect(MainWireScientificSessionV1.initialize({
      ref: canonicalRelease.ref,
    })).rejects.toThrow(/simulation release rejected/);
  }, 60_000);
});
