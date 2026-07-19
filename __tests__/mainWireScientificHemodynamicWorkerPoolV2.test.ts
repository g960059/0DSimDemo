import { readFile } from "node:fs/promises";

import { describe, expect, it, vi } from "vitest";

import {
  loadMainWireAdultFiveWallNonCoronaryReleaseV1,
} from "@/engine/scientific/assembly";
import {
  verifyOfficialHealthyPeriodicPresetBundleAssetsV1,
} from "@/engine/scientific/presets";
import {
  restoreMainWireScientificSessionExactV2,
} from "@/engine/scientific/runtime";
import {
  MainWireScientificHemodynamicWorkerPoolV2,
  type MainWireScientificPreloadBranchWorkerLikeV2,
} from "@/engine/scientificBrowser/MainWireScientificHemodynamicWorkerPoolV2";
import type {
  MainWireScientificPreloadBranchWorkerCommandV2,
  MainWireScientificPreloadBranchWorkerMessageV2,
} from "@/engine/scientificBrowser/MainWireScientificPreloadBranchWorkerProtocolV2";

describe("main-wire scientific hemodynamic worker pool V2", () => {
  it("publishes vascular data first, advances both warm lanes, and reuses two workers", async () => {
    const capsule = await healthyCapsule();
    const createdWorkers: FakeBranchWorker[] = [];
    const pool = new MainWireScientificHemodynamicWorkerPoolV2({
      createBranchWorker: (lane) => {
        const worker = new FakeBranchWorker(lane);
        createdWorkers.push(worker);
        return worker;
      },
      suggestedPollIntervalMs: 100,
    });

    const first = await pool.start({
      ownerSessionId: "pool-owner-1",
      capsule,
    });
    expect(first.snapshot).toMatchObject({
      status: "running",
      stage: "vascular-ready",
      progress: { completedPointCount: 1 },
    });
    expect(first.snapshot.rightVascularFunction.points.length).toBe(33);
    expect(first.snapshot.leftVascularFunction.points.length).toBe(33);
    expect(createdWorkers).toHaveLength(2);

    const completed = await waitForCompletion(
      pool,
      "pool-owner-1",
      first.jobId,
    );
    expect(completed.status).toBe("complete");
    expect(completed.result?.exploration).toMatchObject({
      normalizedTotalBloodVolumeEnvelope: [0.35, 1.3],
      lowerBoundaryStatus: "reached",
      higherBoundaryStatus: "reached",
      sourceSessionMutated: false,
    });
    const directions = new Set(completed.result?.preloadPointEvidence.map(
      ({ provenance }) => provenance.direction,
    ));
    expect(directions).toEqual(new Set([
      "source-baseline",
      "lower-volume",
      "higher-volume",
      "independent-audit",
    ]));
    const evidence = completed.result?.preloadPointEvidence ?? [];
    expect(new Set(evidence.map(({ provenance }) => provenance.pointId)).size)
      .toBe(evidence.length);
    const continuationScales = evidence
      .filter(({ provenance }) => provenance.direction !== "independent-audit")
      .map(({ provenance }) => provenance.targetScale);
    expect(continuationScales).toEqual([...continuationScales].sort(
      (left, right) => left - right,
    ));
    const nonBaselineContinuation = evidence.filter(({ provenance }) =>
      provenance.direction !== "independent-audit"
      && provenance.direction !== "source-baseline");
    expect(nonBaselineContinuation.every(({ provenance }) =>
      provenance.continuationAcceptedAsSeed)).toBe(true);
    expect(createdWorkers.every(({ terminate }) =>
      terminate.mock.calls.length === 0)).toBe(true);

    const second = await pool.start({
      ownerSessionId: "pool-owner-2",
      capsule,
    });
    await waitForCompletion(pool, "pool-owner-2", second.jobId);
    expect(createdWorkers).toHaveLength(2);

    pool.dispose();
    expect(createdWorkers.every(({ terminate }) =>
      terminate.mock.calls.length === 1)).toBe(true);
  }, 30_000);
});

class FakeBranchWorker implements MainWireScientificPreloadBranchWorkerLikeV2 {
  onmessage: ((event: MessageEvent<MainWireScientificPreloadBranchWorkerMessageV2>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  readonly terminate = vi.fn();

  constructor(private readonly lane: "lower-volume" | "higher-volume") {}

  postMessage(command: MainWireScientificPreloadBranchWorkerCommandV2): void {
    if (command.kind === "cancel") return;
    if (command.kind === "initialize") {
      queueMicrotask(() => this.emit({
        protocolId:
          "main-wire-scientific-preload-branch-worker-protocol-v2",
        kind: "ready",
        jobId: command.jobId,
        lane: this.lane,
      }));
      return;
    }
    const scale = command.target.normalizedTbv;
    queueMicrotask(() => this.emit({
      protocolId: "main-wire-scientific-preload-branch-worker-protocol-v2",
      kind: "target-result",
      jobId: command.jobId,
      lane: this.lane,
      target: command.target,
      mode: command.mode,
      point: syntheticPoint(scale, command.target.totalBloodVolumeMl),
      continuationAcceptedAsSeed: command.mode === "continuation",
      terminalCheckpoint: null,
    }));
  }

  private emit(message: MainWireScientificPreloadBranchWorkerMessageV2): void {
    this.onmessage?.({ data: message } as MessageEvent<
      MainWireScientificPreloadBranchWorkerMessageV2
    >);
  }
}

function syntheticPoint(targetScale: number, fixedTotalBloodVolumeMl: number) {
  return Object.freeze({
    targetScale,
    fixedTotalBloodVolumeMl,
    status: "period1-converged" as const,
    acceptedForPeriod1Locus: true,
    completedBeatCount: 4,
    meanRapTransmuralMmHg: -2 + 5 * targetScale,
    meanLapTransmuralMmHg: 1 + 7 * targetScale,
    netCardiacOutputLMin: 1 + 4 * targetScale,
    forwardCardiacOutputLMin: 1 + 4 * targetScale,
    lvEndDiastolicVolumeMl: 40 + 70 * targetScale,
    lvEndSystolicVolumeMl: 20 + 30 * targetScale,
    lvStrokeWorkMmHgMl: 2_000 + 4_000 * targetScale,
    latestPeriod1MaximumNormalizedDelta: 5e-4,
    latestPeriod2MaximumNormalizedDelta: null,
    period2Branches: null,
    failureReason: null,
  });
}

async function waitForCompletion(
  pool: MainWireScientificHemodynamicWorkerPoolV2,
  ownerSessionId: string,
  jobId: string,
) {
  for (let iteration = 0; iteration < 200; iteration += 1) {
    await Promise.resolve();
    const snapshot = pool.poll({ ownerSessionId, jobId });
    if (snapshot.status !== "running") return snapshot;
  }
  throw new Error("fake hemodynamic worker pool did not complete");
}

let capsulePromise: ReturnType<typeof buildHealthyCapsule> | null = null;

function healthyCapsule() {
  capsulePromise ??= buildHealthyCapsule();
  return capsulePromise;
}

async function buildHealthyCapsule() {
  const [release, catalogRawJson, presetRawJson, checkpointRawJson] =
    await Promise.all([
      loadMainWireAdultFiveWallNonCoronaryReleaseV1(),
      readFile(new URL(
        "../data/scientific/presets/catalog-v1.json",
        import.meta.url,
      ), "utf8"),
      readFile(new URL(
        "../data/scientific/presets/official-healthy-periodic-v1.json",
        import.meta.url,
      ), "utf8"),
      readFile(new URL(
        "../data/scientific/checkpoints/0.2.0/normal-adult-periodic-steady-v1.json",
        import.meta.url,
      ), "utf8"),
    ]);
  const preset = await verifyOfficialHealthyPeriodicPresetBundleAssetsV1(
    {
      presetId: "circleheart/official-healthy-periodic",
      presetVersion: "1.0.0",
    },
    release,
    { catalogRawJson, presetRawJson, checkpointRawJson },
  );
  const session = await restoreMainWireScientificSessionExactV2(
    preset.release,
    preset.checkpoint,
  );
  return session.createHemodynamicJobCapsuleV2();
}
