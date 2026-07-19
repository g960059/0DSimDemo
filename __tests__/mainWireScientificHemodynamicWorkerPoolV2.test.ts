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
    expect(completed.fastPreloadPreview.evidence).toHaveLength(9);
    expect(
      new Set(
        completed.fastPreloadPreview.evidence.map(
          ({ sourceFingerprint }) => sourceFingerprint,
        ),
      ).size,
    ).toBe(1);
    expect(completed.fastPreloadPreview.evidence[0]?.sourceFingerprint).toMatch(
      /^[0-9a-f]{64}$/,
    );
    expect(
      completed.fastPreloadPreview.evidence.every(
        (evidence) =>
          evidence.evidenceClass === "near-period1-estimate" &&
          evidence.eligibility.settledP1Locus === false &&
          evidence.eligibility.continuationSeed === false,
      ),
    ).toBe(true);
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

  it("fails closed when a canonical worker result does not match its issued target", async () => {
    const capsule = await healthyCapsule();
    const pool = new MainWireScientificHemodynamicWorkerPoolV2({
      createBranchWorker: (lane) => new FakeBranchWorker(lane, true),
    });
    const started = await pool.start({
      ownerSessionId: "pool-owner-corrupt-result",
      capsule,
    });
    const failed = await waitForCompletion(
      pool,
      "pool-owner-corrupt-result",
      started.jobId,
    );
    expect(failed.status).toBe("error");
    expect(failed.errorMessage).toContain("P1 seed contract");
    pool.dispose();
  }, 30_000);
});

class FakeBranchWorker implements MainWireScientificPreloadBranchWorkerLikeV2 {
  onmessage: ((event: MessageEvent<MainWireScientificPreloadBranchWorkerMessageV2>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  readonly terminate = vi.fn();
  private sourceFingerprint = "";
  private terminalCheckpoint:
    | Extract<
        MainWireScientificPreloadBranchWorkerCommandV2,
        { kind: "initialize" }
      >["baselineCapsule"]["transactionCheckpoint"]
    | null = null;

  constructor(
    private readonly lane: "lower-volume" | "higher-volume",
    private readonly corruptCanonicalResult = false,
  ) {}

  postMessage(command: MainWireScientificPreloadBranchWorkerCommandV2): void {
    if (command.kind === "cancel") return;
    if (command.kind === "initialize") {
      this.sourceFingerprint = command.sourceFingerprint;
      this.terminalCheckpoint = command.baselineCapsule.transactionCheckpoint;
      queueMicrotask(() => this.emit({
        protocolId:
          "main-wire-scientific-preload-branch-worker-protocol-v2",
        kind: "ready",
        jobId: command.jobId,
        lane: this.lane,
      }));
      return;
    }
    if (command.kind === "solve-fast-preview-target") {
      queueMicrotask(() =>
        this.emit({
          protocolId: "main-wire-scientific-preload-branch-worker-protocol-v2",
          kind: "fast-preview-target-result",
          jobId: command.jobId,
          lane: this.lane,
          target: command.target,
          evidence: syntheticFastPreviewEvidence(
            command.target,
            this.sourceFingerprint,
          ),
        }),
      );
      return;
    }
    const scale = command.target.normalizedTbv;
    const reportedScale =
      this.corruptCanonicalResult && command.mode === "continuation"
        ? scale + 0.01
        : scale;
    queueMicrotask(() => this.emit({
      protocolId: "main-wire-scientific-preload-branch-worker-protocol-v2",
      kind: "target-result",
      jobId: command.jobId,
      lane: this.lane,
      target: command.target,
      mode: command.mode,
      point: syntheticPoint(reportedScale, command.target.totalBloodVolumeMl),
      seedInitialization: null,
      continuationAcceptedAsSeed: command.mode === "continuation",
      terminalCheckpoint: this.terminalCheckpoint,
    }));
  }

  private emit(message: MainWireScientificPreloadBranchWorkerMessageV2): void {
    this.onmessage?.({ data: message } as MessageEvent<
      MainWireScientificPreloadBranchWorkerMessageV2
    >);
  }
}

function syntheticFastPreviewEvidence(
  target: Extract<
    MainWireScientificPreloadBranchWorkerCommandV2,
    { kind: "solve-fast-preview-target" }
  >["target"],
  sourceFingerprint: string,
) {
  const observation = Object.freeze({
    meanRapTransmuralMmHg: -2 + 5 * target.targetScale,
    meanLapTransmuralMmHg: 1 + 7 * target.targetScale,
    netCardiacOutputLMin: 1 + 4 * target.targetScale,
    forwardCardiacOutputLMin: 1 + 4 * target.targetScale,
    lvPressureVolume: null,
    quality: Object.freeze({
      numerics: Object.freeze({
        finite: true,
        totalBloodVolumeAbsoluteErrorMl: 0,
        maximumContinuityAbsoluteResidualMl: 0,
        passed: true,
      }),
      lvEvents: Object.freeze({
        status: "missing-end-diastolic-event" as const,
        endpointDisplayEligible: false,
      }),
    }),
  });
  return Object.freeze({
    evidenceId: target.targetId,
    sourceFingerprint,
    acquisition: Object.freeze({
      target,
      sourceEvidenceId: "source-period1-baseline" as const,
      initializer: null,
      plannedNaturalBeatCountAfterPrediction: 2,
      completedNaturalBeatCountAfterPrediction: 2,
      holdDurationSec: 2,
    }),
    observation,
    closure: Object.freeze({
      policyId: "main-wire-fast-tbv-preview-acquisition-policy-v1" as const,
      requiredCanonicalConsecutivePeriod1Beats: 3 as const,
      observedCanonicalConsecutivePeriod1Beats: 0 as const,
      predictorToFirstNaturalBeatMaximumNormalizedDelta: 0.04,
      latestPeriod1MaximumNormalizedDelta: 0.02,
      residualRatio: 0.5,
      nearPeriod1ResidualTolerance: 0.05,
      residualTrend: "contracting" as const,
      predictorInjectionExcludedFromCanonicalP1Count: true as const,
    }),
    evidenceClass: "near-period1-estimate" as const,
    periodicityClaim: "not-demonstrated" as const,
    eligibility: Object.freeze({
      hemodynamicPreview: true as const,
      rapidFiniteHoldLocus: true as const,
      settledP1Locus: false as const,
      lvPvEndpointDisplay: false,
      continuationSeed: false as const,
      espvrEdpvrPrswFit: false as const,
    }),
    estimateAssessment: "residual-near-period1-but-gate-incomplete" as const,
  });
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
    lvPressureVolumeObservation: Object.freeze({
      endDiastolic: Object.freeze({
        volumeMl: 40 + 70 * targetScale,
        transmuralPressureMmHg: 4 + 5 * targetScale,
      }),
      endSystolic: Object.freeze({
        volumeMl: 20 + 30 * targetScale,
        transmuralPressureMmHg: 80 + 30 * targetScale,
      }),
      strokeWorkMmHgMl: 2_000 + 4_000 * targetScale,
      eventStatus: "complete" as const,
      evidenceRole: "tbv-operating-point-observation-only" as const,
      crossPointFitEligible: false as const,
    }),
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
