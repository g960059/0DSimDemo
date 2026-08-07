import { describe, expect, it } from "vitest";

import {
  WorkbenchRuntimeObservationBufferV3,
  observeWorkbenchSnapshotPhaseV3,
  observeWorkbenchSnapshotSynchronousPhaseV3,
  summarizeWorkbenchRuntimeObservationsV3,
  type WorkbenchRuntimeObservationV3,
} from "@/components/workbench/v3/WorkbenchRuntimeObservabilityV3";

describe("WorkbenchRuntimeObservabilityV3", () => {
  it("summarizes p50/p95 latency and Snapshot candidate reuse", () => {
    const observations: WorkbenchRuntimeObservationV3[] = [];
    for (let index = 1; index <= 20; index += 1) {
      observations.push({
        kind: "background-worker-job",
        scheduledPriority: "analysis",
        finalPriority: index === 20 ? "snapshot" : "analysis",
        promoted: index === 20,
        leaseKind: index === 20 ? "foreground-burst" : "regular",
        queueDepthAtSchedule: index - 1,
        queueDurationMs: index,
        executionDurationMs: index * 2,
        totalDurationMs: index * 3,
        outcome: "completed",
      });
    }
    observations.push(
      candidateSelectionV3("snapshot", "reused", 12),
      candidateSelectionV3("snapshot", "click-capture-fallback", null),
      candidateSelectionV3("analysis", "reused", 4),
      {
        kind: "steady-candidate-computation",
        scenarioId: "scenario/baseline",
        inputEpoch: 7,
        requestedPriority: "prewarm",
        durationMs: 64,
        outcome: "completed",
        convergence: "observed-period1",
        completedCycleCount: 6,
      },
      snapshotPhaseV3("admission", 80, "completed"),
      snapshotPhaseV3("admission", 120, "failed"),
      snapshotPhaseV3("total", 180, "completed"),
    );

    const summary = summarizeWorkbenchRuntimeObservationsV3(observations);

    expect(summary.backgroundWorkerJobs).toMatchObject({
      total: 20,
      completed: 20,
      failed: 0,
      cancelled: 0,
      promoted: 1,
      foregroundBurst: 1,
      queueDuration: {
        sampleCount: 20,
        p50Ms: 10,
        p95Ms: 19,
        maximumMs: 20,
      },
      executionDuration: {
        sampleCount: 20,
        p50Ms: 20,
        p95Ms: 38,
        maximumMs: 40,
      },
    });
    expect(summary.backgroundWorkerJobs.byFinalPriority.analysis.total).toBe(19);
    expect(summary.backgroundWorkerJobs.byFinalPriority.snapshot).toMatchObject({
      total: 1,
      queueDuration: {
        sampleCount: 1,
        p50Ms: 20,
        p95Ms: 20,
        maximumMs: 20,
      },
    });
    expect(summary.steadyCandidateSelections.snapshot).toEqual({
      total: 2,
      reused: 1,
      reuseRate: 0.5,
      reusedCandidateAge: {
        sampleCount: 1,
        p50Ms: 12,
        p95Ms: 12,
        maximumMs: 12,
      },
    });
    expect(summary.steadyCandidateComputations).toEqual({
      total: 1,
      completed: 1,
      failed: 0,
      cancelled: 0,
      duration: {
        sampleCount: 1,
        p50Ms: 64,
        p95Ms: 64,
        maximumMs: 64,
      },
    });
    expect(summary.snapshotPhases.admission).toEqual({
      completed: 1,
      failed: 1,
      duration: {
        sampleCount: 2,
        p50Ms: 80,
        p95Ms: 120,
        maximumMs: 120,
      },
    });
  });

  it("keeps only the newest bounded observations", () => {
    const buffer = new WorkbenchRuntimeObservationBufferV3(2);
    buffer.observe(snapshotPhaseV3("intent-capture", 2, "completed"));
    buffer.observe(snapshotPhaseV3("admission", 8, "completed"));
    buffer.observe(snapshotPhaseV3("total", 12, "completed"));

    expect(buffer.read().map((observation) =>
      observation.kind === "snapshot-phase" ? observation.phase : null))
      .toEqual(["admission", "total"]);
    expect(buffer.summarize().snapshotPhases).not.toHaveProperty(
      "intent-capture",
    );
  });

  it("observes synchronous and asynchronous Snapshot phases without owning errors", async () => {
    const observations: WorkbenchRuntimeObservationV3[] = [];
    let nowMs = 4;
    const dependencies = {
      nowMs: () => nowMs,
      observe: (observation: WorkbenchRuntimeObservationV3) =>
        observations.push(observation),
    };
    const context = { purpose: "article", scenarioCount: 3 } as const;

    const selected = observeWorkbenchSnapshotSynchronousPhaseV3(
      context,
      "candidate-selection",
      () => {
        nowMs = 7;
        return "selected";
      },
      dependencies,
    );
    await expect(observeWorkbenchSnapshotPhaseV3(
      context,
      "admission",
      async () => {
        nowMs = 12;
        throw new Error("admission failed");
      },
      dependencies,
    )).rejects.toThrow("admission failed");

    expect(selected).toBe("selected");
    expect(observations).toEqual([
      expect.objectContaining({
        kind: "snapshot-phase",
        purpose: "article",
        phase: "candidate-selection",
        scenarioCount: 3,
        durationMs: 3,
        outcome: "completed",
      }),
      expect.objectContaining({
        kind: "snapshot-phase",
        purpose: "article",
        phase: "admission",
        scenarioCount: 3,
        durationMs: 5,
        outcome: "failed",
      }),
    ]);
  });
});

function candidateSelectionV3(
  consumer: "snapshot" | "analysis",
  result: "reused" | "click-capture-fallback",
  candidateAgeMs: number | null,
): WorkbenchRuntimeObservationV3 {
  return {
    kind: "steady-candidate-selection",
    consumer,
    result,
    scenarioId: "scenario/baseline",
    inputEpoch: 7,
    candidateAgeMs,
    convergence: result === "reused" ? "bounded-warm-start" : null,
  };
}

function snapshotPhaseV3(
  phase: "intent-capture" | "admission" | "total",
  durationMs: number,
  outcome: "completed" | "failed",
): WorkbenchRuntimeObservationV3 {
  return {
    kind: "snapshot-phase",
    purpose: "publication",
    phase,
    scenarioCount: 2,
    durationMs,
    outcome,
  };
}
