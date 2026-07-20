import { describe, expect, it } from "vitest";

import type {
  MainWireScientificHemodynamicJobCapsuleV2,
} from "@/engine/scientific/protocols/MainWireScientificHemodynamicJobV2";
import {
  MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V2_ID,
  type MainWireScientificPvRelationsProgressV2,
  type MainWireScientificPvRelationsProtocolResultV2,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationsProtocolV2";
import {
  MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_CACHE_IDENTITY,
  MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_ID,
  MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_VERSION,
  type MainWireScientificPvRelationsProgressV3,
  type MainWireScientificPvRelationsProtocolResultV3,
} from "@/engine/scientific/protocols/MainWireScientificPvRelationsProtocolV3";
import {
  MainWireScientificPvRelationWorkerManagerV1,
  type MainWireScientificPvRelationWorkerLikeV1,
} from "@/engine/scientificBrowser/MainWireScientificPvRelationWorkerManagerV1";
import {
  MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID,
  type MainWireScientificPvRelationWorkerCommandV1,
  type MainWireScientificPvRelationWorkerMessageV1,
} from "@/engine/scientificBrowser/MainWireScientificPvRelationWorkerProtocolV1";

describe("main-wire scientific PV relation Worker manager V1", () => {
  it("publishes progressive snapshots, rejects stale identities, and caches exact sources", async () => {
    const workers: FakePvRelationWorker[] = [];
    const manager = new MainWireScientificPvRelationWorkerManagerV1({
      createWorker: () => {
        const worker = new FakePvRelationWorker();
        workers.push(worker);
        return worker;
      },
      suggestedPollIntervalMs: 75,
    });
    const capsule = fakeCapsule();
    const started = await manager.start({
      ownerSessionId: "scenario-session",
      capsule,
    });
    expect(started).toMatchObject({
      suggestedPollIntervalMs: 75,
      snapshot: {
        status: "running",
        stage: "lower-loading",
        cacheStatus: "miss",
        sequence: 1,
        researchProtocolCacheIdentity:
          MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_CACHE_IDENTITY,
      },
    });
    const command = workers[0]!.commands[0];
    expect(command).toMatchObject({
      kind: "start",
      jobId: started.jobId,
      protocolCacheIdentity:
        MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_CACHE_IDENTITY,
      capsule,
    });
    if (command?.kind !== "start") throw new Error("missing start command");

    workers[0]!.emit({
      protocolId: MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID,
      kind: "progress",
      jobId: command.jobId,
      sourceFingerprint: command.sourceFingerprint,
      protocolCacheIdentity: "stale-protocol@2|endpoint=legacy",
      progress: fakeProgress(1),
    });
    expect(manager.poll({
      ownerSessionId: "scenario-session",
      jobId: started.jobId,
    }).sequence).toBe(1);

    workers[0]!.emit({
      protocolId: MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID,
      kind: "progress",
      jobId: command.jobId,
      sourceFingerprint: command.sourceFingerprint,
      protocolCacheIdentity: command.protocolCacheIdentity,
      progress: fakeProgress(2),
    });
    expect(manager.poll({
      ownerSessionId: "scenario-session",
      jobId: started.jobId,
    })).toMatchObject({
      status: "running",
      sequence: 2,
      progress: { completedBeatCount: 2 },
    });

    workers[0]!.emit({
      protocolId: MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID,
      kind: "complete",
      jobId: command.jobId,
      sourceFingerprint: "f".repeat(64),
      protocolCacheIdentity: command.protocolCacheIdentity,
      result: fakeResult(capsule),
    });
    expect(manager.poll({
      ownerSessionId: "scenario-session",
      jobId: started.jobId,
    }).status).toBe("running");

    workers[0]!.emit({
      protocolId: MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID,
      kind: "complete",
      jobId: command.jobId,
      sourceFingerprint: command.sourceFingerprint,
      protocolCacheIdentity: command.protocolCacheIdentity,
      result: fakeResult(capsule),
    });
    expect(manager.poll({
      ownerSessionId: "scenario-session",
      jobId: started.jobId,
    })).toMatchObject({
      status: "complete",
      stage: "complete",
      sequence: 3,
    });
    expect(workers[0]!.terminated).toBe(true);

    const cached = await manager.start({
      ownerSessionId: "scenario-session",
      capsule,
    });
    expect(cached.snapshot).toMatchObject({
      status: "complete",
      cacheStatus: "hit",
      result: { protocolId: MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V2_ID },
      researchProtocolCacheIdentity:
        MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_CACHE_IDENTITY,
      researchResultV3: {
        protocolId: MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_ID,
      },
    });
    expect(workers).toHaveLength(1);
  });

  it("terminates superseded work and ignores a late completion", async () => {
    const workers: FakePvRelationWorker[] = [];
    const manager = new MainWireScientificPvRelationWorkerManagerV1({
      createWorker: () => {
        const worker = new FakePvRelationWorker();
        workers.push(worker);
        return worker;
      },
    });
    const firstCapsule = fakeCapsule(1);
    const secondCapsule = fakeCapsule(2);
    const first = await manager.start({
      ownerSessionId: "scenario-session",
      capsule: firstCapsule,
    });
    const firstListener = workers[0]!.onmessage;
    const firstCommand = workers[0]!.commands[0];
    if (firstCommand?.kind !== "start" || firstListener === null) {
      throw new Error("missing first job transport");
    }

    const second = await manager.start({
      ownerSessionId: "scenario-session",
      capsule: secondCapsule,
    });
    expect(workers[0]!.terminated).toBe(true);
    expect(manager.poll({
      ownerSessionId: "scenario-session",
      jobId: first.jobId,
    }).status).toBe("cancelled");

    firstListener(new MessageEvent("message", { data: {
      protocolId: MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID,
      kind: "complete",
      jobId: first.jobId,
      sourceFingerprint: firstCommand.sourceFingerprint,
      protocolCacheIdentity: firstCommand.protocolCacheIdentity,
      result: fakeResult(firstCapsule),
    } satisfies MainWireScientificPvRelationWorkerMessageV1 }));
    expect(manager.poll({
      ownerSessionId: "scenario-session",
      jobId: second.jobId,
    }).status).toBe("running");
  });

  it("runs independent owner sessions concurrently without cross-cancelling", async () => {
    const workers: FakePvRelationWorker[] = [];
    const manager = new MainWireScientificPvRelationWorkerManagerV1({
      createWorker: () => {
        const worker = new FakePvRelationWorker();
        workers.push(worker);
        return worker;
      },
    });
    const firstCapsule = fakeCapsule(11);
    const secondCapsule = fakeCapsule(22);
    const first = await manager.start({
      ownerSessionId: "scenario-a",
      capsule: firstCapsule,
    });
    const second = await manager.start({
      ownerSessionId: "scenario-b",
      capsule: secondCapsule,
    });

    expect(workers).toHaveLength(2);
    expect(workers[0]!.terminated).toBe(false);
    expect(workers[1]!.terminated).toBe(false);
    expect(manager.poll({
      ownerSessionId: "scenario-a",
      jobId: first.jobId,
    }).status).toBe("running");
    expect(manager.poll({
      ownerSessionId: "scenario-b",
      jobId: second.jobId,
    }).status).toBe("running");

    const firstCommand = workers[0]!.commands[0];
    const secondCommand = workers[1]!.commands[0];
    if (firstCommand?.kind !== "start" || secondCommand?.kind !== "start") {
      throw new Error("missing concurrent start commands");
    }
    workers[0]!.emit({
      protocolId: MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID,
      kind: "complete",
      jobId: first.jobId,
      sourceFingerprint: firstCommand.sourceFingerprint,
      protocolCacheIdentity: firstCommand.protocolCacheIdentity,
      result: fakeResult(firstCapsule),
    });
    expect(manager.poll({
      ownerSessionId: "scenario-a",
      jobId: first.jobId,
    }).status).toBe("complete");
    expect(manager.poll({
      ownerSessionId: "scenario-b",
      jobId: second.jobId,
    }).status).toBe("running");

    workers[1]!.emit({
      protocolId: MAIN_WIRE_SCIENTIFIC_PV_RELATION_WORKER_PROTOCOL_V1_ID,
      kind: "complete",
      jobId: second.jobId,
      sourceFingerprint: secondCommand.sourceFingerprint,
      protocolCacheIdentity: secondCommand.protocolCacheIdentity,
      result: fakeResult(secondCapsule),
    });
    expect(manager.poll({
      ownerSessionId: "scenario-b",
      jobId: second.jobId,
    }).status).toBe("complete");
  });

  it("supersedes an older same-owner start while its fingerprint is pending", async () => {
    const workers: FakePvRelationWorker[] = [];
    const fingerprintResolvers: Array<(value: string) => void> = [];
    const manager = new MainWireScientificPvRelationWorkerManagerV1({
      createWorker: () => {
        const worker = new FakePvRelationWorker();
        workers.push(worker);
        return worker;
      },
      sourceFingerprint: () => new Promise((resolve) => {
        fingerprintResolvers.push(resolve);
      }),
    });

    const firstStart = manager.start({
      ownerSessionId: "scenario-session",
      capsule: fakeCapsule(101),
    });
    const secondStart = manager.start({
      ownerSessionId: "scenario-session",
      capsule: fakeCapsule(102),
    });
    expect(fingerprintResolvers).toHaveLength(2);

    fingerprintResolvers[0]!("a".repeat(64));
    await expect(firstStart).rejects.toThrow(/superseded/);
    expect(workers).toHaveLength(0);

    fingerprintResolvers[1]!("b".repeat(64));
    const second = await secondStart;
    expect(workers).toHaveLength(1);
    expect(second.snapshot.status).toBe("running");
    expect(manager.poll({
      ownerSessionId: "scenario-session",
      jobId: second.jobId,
    }).status).toBe("running");
  });
});

class FakePvRelationWorker implements MainWireScientificPvRelationWorkerLikeV1 {
  onmessage:
    | ((event: MessageEvent<MainWireScientificPvRelationWorkerMessageV1>) => void)
    | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  readonly commands: MainWireScientificPvRelationWorkerCommandV1[] = [];
  terminated = false;

  postMessage(command: MainWireScientificPvRelationWorkerCommandV1): void {
    this.commands.push(command);
  }

  terminate(): void {
    this.terminated = true;
  }

  emit(message: MainWireScientificPvRelationWorkerMessageV1): void {
    this.onmessage?.(new MessageEvent("message", { data: message }));
  }
}

function fakeCapsule(revision = 1): MainWireScientificHemodynamicJobCapsuleV2 {
  return Object.freeze({
    capsuleId: "main-wire-scientific-hemodynamic-job-capsule-v2",
    source: Object.freeze({
      revision,
      acceptedTimeSec: revision,
      fixedTotalBloodVolumeMl: 5_500,
    }),
    providerIdentity: Object.freeze({
      providerId: "provider",
      parameterSetId: "parameters",
      parameterIdentityHash: "identity",
    }),
    transactionCheckpoint: Object.freeze({}),
    runtime: Object.freeze({}),
    pericardium: Object.freeze({}),
    calciumDriveParams: Object.freeze({}),
  }) as unknown as MainWireScientificHemodynamicJobCapsuleV2;
}

function fakeCompatibilityProgress(
  completedBeatCount: number,
): MainWireScientificPvRelationsProgressV2 {
  return Object.freeze({
    completedBeatCount,
    latestBeat: Object.freeze({ beatIndex: completedBeatCount - 1 }),
    beats: Object.freeze(Array.from(
      { length: completedBeatCount },
      (_, beatIndex) => Object.freeze({ beatIndex }),
    )),
  }) as unknown as MainWireScientificPvRelationsProgressV2;
}

function fakeProgress(
  completedBeatCount: number,
): MainWireScientificPvRelationsProgressV3 {
  const compatibilityProgressV2 = fakeCompatibilityProgress(completedBeatCount);
  return Object.freeze({
    protocolId: MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_ID,
    protocolVersion: MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_VERSION,
    protocolCacheIdentity:
      MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_CACHE_IDENTITY,
    stage: "lower-loading",
    completedUniqueBeatCount: completedBeatCount,
    latestBeat: Object.freeze({ beatIndex: completedBeatCount - 1 }),
    beats: Object.freeze(Array.from(
      { length: completedBeatCount },
      (_, beatIndex) => Object.freeze({ beatIndex }),
    )),
    lowerCompletedBeatCount: completedBeatCount,
    higherCompletedBeatCount: 0,
    compatibilityProgressV2,
  }) as unknown as MainWireScientificPvRelationsProgressV3;
}

function fakeCompatibilityResult(
  capsule: MainWireScientificHemodynamicJobCapsuleV2,
): MainWireScientificPvRelationsProtocolResultV2 {
  return Object.freeze({
    protocolId: MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V2_ID,
    source: capsule.source,
    beats: Object.freeze([]),
  }) as unknown as MainWireScientificPvRelationsProtocolResultV2;
}

function fakeResult(
  capsule: MainWireScientificHemodynamicJobCapsuleV2,
): MainWireScientificPvRelationsProtocolResultV3 {
  return Object.freeze({
    protocolId: MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_ID,
    protocolVersion: MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_VERSION,
    protocolCacheIdentity:
      MAIN_WIRE_SCIENTIFIC_PV_RELATIONS_PROTOCOL_V3_CACHE_IDENTITY,
    source: capsule.source,
    beats: Object.freeze([]),
    compatibilityResultV2: fakeCompatibilityResult(capsule),
  }) as unknown as MainWireScientificPvRelationsProtocolResultV3;
}
