import { describe, expect, it } from "vitest";

import {
  StudioExperimentAuthoringConflictErrorV2,
  StudioExperimentDraftCaptureMutationErrorV2,
  StudioExperimentSnapshotGateMutationErrorV2,
  StudioExperimentSnapshotGateProtocolErrorV2,
  StudioExperimentSnapshotGateRejectedErrorV2,
} from "@/studio/application/authoring/StudioExperimentAuthoringApplicationV2";
import type {
  ExperimentDesiredContentV2,
  ExperimentSnapshotGatePortV2,
  ExperimentSnapshotGateResultV2,
  ExperimentDraftCapturePortV2,
} from "@/studio/contracts/v2/authoring";
import type {
  ExperimentContentV2,
} from "@/studio/contracts/v2/content";
import {
  createInMemoryExperimentAuthoringV2,
  StudioExperimentConflictErrorV2,
} from "@/studio/infrastructure/experiments/InMemoryExperimentRepositoryV2";
import * as experimentInfrastructure from "@/studio/infrastructure/experiments/InMemoryExperimentRepositoryV2";
import type {
  ModelContractV2,
  RegisteredModelCaptureAdapterV2,
} from "@/studio/contracts/v2/model";
import * as studioPublic from "@/studio";

describe("Studio Experiment authoring V2", () => {
  it("captures checkpoint-free Save intent at an accepted boundary", async () => {
    const { application } = harnessV2(undefined, {
      captureAcceptedCandidate(input) {
        const { desiredContent } = input;
        expect(input.experimentId).toBe("experiment/main");
        expect(input.correlation).toEqual({
          runtimeSessionId: "runtime-session/workbench-1",
          scenarios: [{
            scenarioId: "scenario/baseline",
            expectedInputEpoch: 7,
          }],
        });
        expect(Object.isFrozen(desiredContent)).toBe(true);
        expect(desiredContent.scenarios[0]).not.toHaveProperty("capture");
        expect(desiredContent.scenarios[0]).not.toHaveProperty("checkpoint");
        expect(JSON.stringify(desiredContent)).not.toMatch(/checkpoint/);
        return Promise.resolve(captureResultV2(input));
      },
    });
    const initial = contentV2(0, 0);
    await application.createWorkspace({
      experimentId: "experiment/main",
      content: initial,
    });

    const saved = await application.saveDraft({
      experimentId: "experiment/main",
      expectedDraftVersion: 0,
      desiredContent: desiredContentV2(),
      captureCorrelation: captureCorrelationV2(desiredContentV2()),
    });

    expect(saved.draftVersion).toBe(1);
    expect(saved.content.scenarios[0].capture.checkpoint).toMatchObject({
      acceptedRevision: 1,
      acceptedTimeSec: 0.25,
    });
    expect(JSON.stringify(saved)).not.toMatch(
      /runtimeSession|inputEpoch|settled|numericalHealth|qualification|Assessment|Certification/,
    );
  });

  it("reuses exact checkpoints for Surface-only Save without a live capture", async () => {
    let captureCalled = false;
    const { application } = harnessV2(undefined, {
      captureAcceptedCandidate() {
        captureCalled = true;
        throw new Error("presentation-only Save must not capture runtime state");
      },
    });
    const initial = contentV2(42, 3.5);
    await application.createWorkspace({
      experimentId: "experiment/main",
      content: initial,
    });
    const desired = mutableDesiredContentV2(desiredContentV2());
    desired.scenarios[0].label = "Renamed baseline";
    desired.surface.note.text = "Updated interpretation.";

    const saved = await application.saveDraft({
      experimentId: "experiment/main",
      expectedDraftVersion: 0,
      desiredContent: desired,
    });

    expect(captureCalled).toBe(false);
    expect(saved.draftVersion).toBe(1);
    expect(saved.content.scenarios[0]).toMatchObject({
      label: "Renamed baseline",
      capture: {
        checkpoint: {
          acceptedRevision: 42,
          acceptedTimeSec: 3.5,
        },
      },
    });
    expect(saved.content.surface.note.text).toBe("Updated interpretation.");
  });

  it("requires accepted-boundary capture when a fixture changed", async () => {
    let captureCalled = false;
    const { application } = harnessV2(undefined, {
      captureAcceptedCandidate() {
        captureCalled = true;
        throw new Error("capture should require an explicit correlation");
      },
    });
    await application.createWorkspace({
      experimentId: "experiment/main",
      content: contentV2(0, 0),
    });
    const desired = mutableDesiredContentV2(desiredContentV2());
    desired.scenarios[0].fixture.controls.heartRateBpm = 75;

    await expect(application.saveDraft({
      experimentId: "experiment/main",
      expectedDraftVersion: 0,
      desiredContent: desired,
    })).rejects.toThrow(/captureCorrelation is required/);
    expect(captureCalled).toBe(false);
    expect((await application.readWorkspace("experiment/main"))?.draftVersion)
      .toBe(0);
  });

  it("awaits exact capture restore before exposing a workspace or query result", async () => {
    let finishValidation: (() => void) | undefined;
    const pendingValidation = new Promise<void>((resolve) => {
      finishValidation = resolve;
    });
    let validationCount = 0;
    const adapter: RegisteredModelCaptureAdapterV2 = {
      ...captureAdapterV2(),
      validateCapture() {
        validationCount += 1;
        return validationCount === 1
          ? pendingValidation
          : Promise.resolve();
      },
    };
    const { application, repository } = harnessV2(
      undefined,
      undefined,
      undefined,
      adapter,
    );

    const pendingCreate = application.createWorkspace({
      experimentId: "experiment/main",
      content: contentV2(0, 0),
    });
    expect(validationCount).toBe(1);
    expect(repository.workspaceCount).toBe(0);

    finishValidation?.();
    const created = await pendingCreate;
    expect(repository.workspaceCount).toBe(1);
    expect(await repository.readWorkspace("experiment/main")).toEqual(created);
    expect(validationCount).toBe(2);
  });

  it("keeps a workspace invisible when deferred exact restore rejects", async () => {
    let rejectValidation: ((reason: Error) => void) | undefined;
    const pendingValidation = new Promise<void>((_resolve, reject) => {
      rejectValidation = reject;
    });
    const adapter: RegisteredModelCaptureAdapterV2 = {
      ...captureAdapterV2(),
      validateCapture() {
        return pendingValidation;
      },
    };
    const { application, repository } = harnessV2(
      undefined,
      undefined,
      undefined,
      adapter,
    );

    const pendingCreate = application.createWorkspace({
      experimentId: "experiment/rejected-restore",
      content: contentV2(0, 0),
    });
    const rejection = expect(pendingCreate).rejects.toThrow(
      /rejected capture: exact restore failed/,
    );
    expect(repository.workspaceCount).toBe(0);

    rejectValidation?.(new Error("exact restore failed"));
    await rejection;
    expect(repository.workspaceCount).toBe(0);
    expect(await repository.readWorkspace("experiment/rejected-restore"))
      .toBeNull();
  });

  it("rejects stale or cross-session capture confirmation without saving", async () => {
    const { application } = harnessV2(undefined, {
      captureAcceptedCandidate(input) {
        const result = captureResultV2(input) as any;
        result.confirmation.runtimeSessionId = "runtime-session/stale";
        return Promise.resolve(result);
      },
    });
    await application.createWorkspace({
      experimentId: "experiment/main",
      content: contentV2(0, 0),
    });
    const desiredContent = desiredContentV2();

    await expect(application.saveDraft({
      experimentId: "experiment/main",
      expectedDraftVersion: 0,
      desiredContent,
      captureCorrelation: captureCorrelationV2(desiredContent),
    })).rejects.toThrow(/must exactly confirm/);
    expect((await application.readWorkspace("experiment/main"))?.draftVersion)
      .toBe(0);
  });

  it("rejects malformed runtime capture epochs before invoking capture", async () => {
    let called = false;
    const { application } = harnessV2(undefined, {
      captureAcceptedCandidate(input) {
        called = true;
        return Promise.resolve(captureResultV2(input));
      },
    });
    await application.createWorkspace({
      experimentId: "experiment/main",
      content: contentV2(0, 0),
    });
    const desiredContent = desiredContentV2();
    const captureCorrelation = captureCorrelationV2(desiredContent) as any;
    captureCorrelation.scenarios[0].expectedInputEpoch = -1;

    await expect(application.saveDraft({
      experimentId: "experiment/main",
      expectedDraftVersion: 0,
      desiredContent,
      captureCorrelation,
    })).rejects.toThrow(/nonnegative safe integer/);
    expect(called).toBe(false);
  });

  it("rejects stale Draft writes without partial replacement", async () => {
    const { application } = harnessV2();
    await application.createWorkspace({
      experimentId: "experiment/main",
      content: contentV2(0, 0),
    });
    await application.saveDraft({
      experimentId: "experiment/main",
      expectedDraftVersion: 0,
      desiredContent: desiredContentV2(),
      captureCorrelation: captureCorrelationV2(desiredContentV2()),
    });

    await expect(application.saveDraft({
      experimentId: "experiment/main",
      expectedDraftVersion: 0,
      desiredContent: desiredContentV2(),
      captureCorrelation: captureCorrelationV2(desiredContentV2()),
    })).rejects.toBeInstanceOf(StudioExperimentAuthoringConflictErrorV2);
    expect(
      (await application.readWorkspace("experiment/main"))?.content.scenarios[0]
        .capture.checkpoint.acceptedRevision,
    ).toBe(1);
  });

  it("creates an immutable Snapshot only from fresh gate-produced checkpoints", async () => {
    const { application, repository } = harnessV2({
      qualifyFrozenCandidate({ content }) {
        expect(Object.isFrozen(content)).toBe(true);
        return Promise.resolve({
          status: "passed",
          qualifiedContent: replaceCheckpointV2(content, 500, 12),
        });
      },
    });
    await application.createWorkspace({
      experimentId: "experiment/main",
      content: contentV2(4, 1),
    });

    const snapshot = await application.createSnapshot({
      experimentId: "experiment/main",
      expectedDraftVersion: 0,
      expectedHeadSnapshotId: null,
      createdBy: "user/author",
    });

    expect(snapshot).toMatchObject({
      snapshotId: "snapshot/1",
      experimentId: "experiment/main",
      parentSnapshotId: null,
      createdAt: "2026-07-31T00:00:00.000Z",
      createdBy: "user/author",
    });
    expect(snapshot.content.scenarios[0].capture.checkpoint).toMatchObject({
      acceptedRevision: 500,
      acceptedTimeSec: 12,
    });
    expect(repository.snapshotCount).toBe(1);
    expect(await application.readWorkspace("experiment/main")).toMatchObject({
      draftVersion: 1,
      headSnapshotId: "snapshot/1",
      basedOnSnapshotId: "snapshot/1",
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(JSON.stringify(snapshot)).not.toMatch(
      /gatePassed|settled|verificationPassed|qualification/,
    );
  });

  it("leaves no Snapshot or head when the gate rejects", async () => {
    const { application, repository } = harnessV2({
      qualifyFrozenCandidate() {
        return Promise.resolve({
          status: "rejected",
          reason: "minimum numerical gate failed",
        });
      },
    });
    await application.createWorkspace({
      experimentId: "experiment/main",
      content: contentV2(0, 0),
    });

    await expect(application.createSnapshot({
      experimentId: "experiment/main",
      expectedDraftVersion: 0,
      expectedHeadSnapshotId: null,
    })).rejects.toBeInstanceOf(
      StudioExperimentSnapshotGateRejectedErrorV2,
    );
    expect(repository.snapshotCount).toBe(0);
    expect(await application.readWorkspace("experiment/main")).toMatchObject({
      draftVersion: 0,
      headSnapshotId: null,
    });
  });

  it("fails closed for malformed Snapshot gate results", async () => {
    for (const malformed of [
      {
        status: "skipped",
        qualifiedContent: contentV2(500, 12),
      },
      {
        status: "passed",
        qualifiedContent: contentV2(500, 12),
        verificationPassed: true,
      },
      {
        status: "rejected",
        reason: "",
      },
    ]) {
      const { application, repository } = harnessV2({
        qualifyFrozenCandidate() {
          return Promise.resolve(malformed as any);
        },
      });
      await application.createWorkspace({
        experimentId: "experiment/malformed-gate",
        content: contentV2(0, 0),
      });

      await expect(application.createSnapshot({
        experimentId: "experiment/malformed-gate",
        expectedDraftVersion: 0,
        expectedHeadSnapshotId: null,
      })).rejects.toBeInstanceOf(
        StudioExperimentSnapshotGateProtocolErrorV2,
      );
      expect(repository.snapshotCount).toBe(0);
      expect(
        await application.readWorkspace("experiment/malformed-gate"),
      ).toMatchObject({
        draftVersion: 0,
        headSnapshotId: null,
      });
    }
  });

  it("binds qualification to the frozen candidate and rejects a late completion", async () => {
    let resolveGate:
      ((result: ExperimentSnapshotGateResultV2) => void) | undefined;
    const gatePromise = new Promise<ExperimentSnapshotGateResultV2>(
      (resolve) => {
        resolveGate = resolve;
      },
    );
    const { application, repository } = harnessV2({
      qualifyFrozenCandidate() {
        return gatePromise;
      },
    });
    const original = contentV2(0, 0);
    await application.createWorkspace({
      experimentId: "experiment/main",
      content: original,
    });
    const pendingSnapshot = application.createSnapshot({
      experimentId: "experiment/main",
      expectedDraftVersion: 0,
      expectedHeadSnapshotId: null,
    });

    await application.saveDraft({
      experimentId: "experiment/main",
      expectedDraftVersion: 0,
      desiredContent: desiredContentV2(),
      captureCorrelation: captureCorrelationV2(desiredContentV2()),
    });
    resolveGate?.({
      status: "passed",
      qualifiedContent: replaceCheckpointV2(original, 500, 12),
    });

    await expect(pendingSnapshot).rejects.toBeInstanceOf(
      StudioExperimentConflictErrorV2,
    );
    expect(repository.snapshotCount).toBe(0);
    expect(await application.readWorkspace("experiment/main")).toMatchObject({
      draftVersion: 1,
      headSnapshotId: null,
    });
  });

  it("allows the gate to replace checkpoints but not authored fixture or Surface", async () => {
    const { application } = harnessV2({
      qualifyFrozenCandidate({ content }) {
        const changed = mutableContentV2(content);
        (changed.scenarios[0].capture.fixture as {
          controls: { heartRateBpm: number };
        }).controls.heartRateBpm = 90;
        return Promise.resolve({
          status: "passed",
          qualifiedContent: changed,
        });
      },
    });
    await application.createWorkspace({
      experimentId: "experiment/main",
      content: contentV2(0, 0),
    });

    await expect(application.createSnapshot({
      experimentId: "experiment/main",
      expectedDraftVersion: 0,
      expectedHeadSnapshotId: null,
    })).rejects.toBeInstanceOf(
      StudioExperimentSnapshotGateMutationErrorV2,
    );
  });

  it("records fork lineage without inheriting future parent changes", async () => {
    const { application } = harnessV2();
    await expect(application.createWorkspace({
      experimentId: "experiment/invalid-direct-fork",
      basedOnSnapshotId: "snapshot/forbidden",
      content: contentV2(0, 0),
    } as any)).rejects.toThrow(/CreateWorkspace field set mismatch/);
    await application.createWorkspace({
      experimentId: "experiment/source",
      content: contentV2(0, 0),
    });
    const source = await application.createSnapshot({
      experimentId: "experiment/source",
      expectedDraftVersion: 0,
      expectedHeadSnapshotId: null,
    });
    const forkWorkspace = await application.forkWorkspace({
      experimentId: "experiment/fork",
      sourceSnapshotId: source.snapshotId,
    });
    expect(forkWorkspace.content).toEqual(source.content);
    expect(forkWorkspace.content).not.toBe(source.content);

    const fork = await application.createSnapshot({
      experimentId: "experiment/fork",
      expectedDraftVersion: 0,
      expectedHeadSnapshotId: null,
    });

    expect(fork.parentSnapshotId).toBe(source.snapshotId);
    expect(fork.experimentId).toBe("experiment/fork");
    expect(source.parentSnapshotId).toBeNull();
    expect(await application.readSnapshot(source.snapshotId)).toEqual(source);
  });

  it("fails closed on unknown command fields and explicit undefined optionals", async () => {
    const { application } = harnessV2();
    await application.createWorkspace({
      experimentId: "experiment/main",
      content: contentV2(0, 0),
    });

    await expect(application.saveDraft({
      experimentId: "experiment/main",
      expectedDraftVersion: 0,
      desiredContent: desiredContentV2(),
      captureCorrelation: captureCorrelationV2(desiredContentV2()),
      qualification: true,
    } as any)).rejects.toThrow(/SaveDraft field set mismatch/);
    await expect(application.rebaseDraft({
      experimentId: "experiment/main",
      expectedDraftVersion: 0,
      expectedHeadSnapshotId: null,
      targetSnapshotId: "snapshot/target",
      content: contentV2(0, 0),
      automaticMerge: true,
    } as any)).rejects.toThrow(/RebaseDraft field set mismatch/);
    await expect(application.createSnapshot({
      experimentId: "experiment/main",
      expectedDraftVersion: 0,
      expectedHeadSnapshotId: null,
      verificationPassed: true,
    } as any)).rejects.toThrow(/CreateSnapshot field set mismatch/);
    await expect(application.createSnapshot({
      experimentId: "experiment/main",
      expectedDraftVersion: 0,
      expectedHeadSnapshotId: null,
      createdBy: undefined,
    })).rejects.toThrow(/must be omitted or contain an ID/);
  });

  it("requires Save capture to preserve all authored desired content", async () => {
    const cases: readonly Readonly<{
      desiredContent: ExperimentDesiredContentV2;
      mutate(captured: any): void;
    }>[] = [{
      desiredContent: desiredContentV2(),
      mutate(captured) {
        captured.scenarios[0].capture.fixture.controls.heartRateBpm = 90;
      },
    }, {
      desiredContent: desiredContentV2(),
      mutate(captured) {
        captured.scenarios[0].scenarioId = "scenario/changed";
      },
    }, {
      desiredContent: desiredContentV2(),
      mutate(captured) {
        captured.scenarios[0].label = "Changed label";
      },
    }, {
      desiredContent: desiredContentV2(),
      mutate(captured) {
        captured.surface.note.text = "Changed Surface";
      },
    }, {
      desiredContent: desiredContentWithTwoScenariosV2(),
      mutate(captured) {
        captured.scenarios.reverse();
      },
    }];

    for (const testCase of cases) {
      const capture: ExperimentDraftCapturePortV2 = {
        captureAcceptedCandidate(input) {
          const { desiredContent } = input;
          const changed = mutableContentV2(
            captureDesiredContentV2(desiredContent),
          );
          testCase.mutate(changed);
          return Promise.resolve(captureResultV2(input, changed));
        },
      };
      const { application, repository } = harnessV2(undefined, capture);
      await application.createWorkspace({
        experimentId: "experiment/main",
        content: contentV2(0, 0),
      });

      await expect(application.saveDraft({
        experimentId: "experiment/main",
        expectedDraftVersion: 0,
        desiredContent: testCase.desiredContent,
        captureCorrelation: captureCorrelationV2(testCase.desiredContent),
      })).rejects.toBeInstanceOf(
        StudioExperimentDraftCaptureMutationErrorV2,
      );
      expect(repository.snapshotCount).toBe(0);
      expect((await application.readWorkspace("experiment/main"))?.draftVersion)
        .toBe(0);
    }
  });

  it("binds workspaces and Surface references to a registered model", async () => {
    const { application } = harnessV2();
    const unknownGraph = mutableContentV2(contentV2(0, 0));
    unknownGraph.surface.graphs[0].graphId = "graph-definition/missing";
    await expect(application.createWorkspace({
      experimentId: "experiment/unknown-graph",
      content: unknownGraph,
    })).rejects.toThrow(/unknown registered graph/);

    await application.createWorkspace({
      experimentId: "experiment/main",
      content: contentV2(0, 0),
    });
    const changedModel = mutableDesiredContentV2(desiredContentV2());
    changedModel.modelId = "model/other";
    await expect(application.saveDraft({
      experimentId: "experiment/main",
      expectedDraftVersion: 0,
      desiredContent: changedModel,
      captureCorrelation: captureCorrelationV2(changedModel),
    })).rejects.toBeInstanceOf(StudioExperimentAuthoringConflictErrorV2);
  });

  it("validates exact-model fixture/checkpoint pairs at every persistence boundary", async () => {
    const { application } = harnessV2();
    const malformedCreate = mutableContentV2(contentV2(0, 0));
    malformedCreate.scenarios[0].capture.checkpoint.payload = {
      wrongCodec: true,
    };
    await expect(application.createWorkspace({
      experimentId: "experiment/malformed-create",
      content: malformedCreate,
    })).rejects.toThrow(/rejected capture/);

    await application.createWorkspace({
      experimentId: "experiment/main",
      content: contentV2(0, 0),
    });
    const malformedFixture = mutableDesiredContentV2(desiredContentV2());
    malformedFixture.scenarios[0].fixture.controls.heartRateBpm = 0;
    await expect(application.saveDraft({
      experimentId: "experiment/main",
      expectedDraftVersion: 0,
      desiredContent: malformedFixture,
      captureCorrelation: captureCorrelationV2(malformedFixture),
    })).rejects.toThrow(/rejected fixture/);

    const postCaptureHarness = harnessV2(undefined, {
      captureAcceptedCandidate(input) {
        const { desiredContent } = input;
        const malformed = mutableContentV2(
          captureDesiredContentV2(desiredContent),
        );
        malformed.scenarios[0].capture.checkpoint.payload = "wrong-codec";
        return Promise.resolve(captureResultV2(input, malformed));
      },
    });
    await postCaptureHarness.application.createWorkspace({
      experimentId: "experiment/post-capture",
      content: contentV2(0, 0),
    });
    await expect(postCaptureHarness.application.saveDraft({
      experimentId: "experiment/post-capture",
      expectedDraftVersion: 0,
      desiredContent: desiredContentV2(),
      captureCorrelation: captureCorrelationV2(desiredContentV2()),
    })).rejects.toThrow(/rejected capture/);

    const postGateHarness = harnessV2({
      qualifyFrozenCandidate({ content }) {
        const malformed = mutableContentV2(content);
        malformed.scenarios[0].capture.checkpoint.payload = "wrong-codec";
        return Promise.resolve({
          status: "passed",
          qualifiedContent: malformed,
        });
      },
    });
    await postGateHarness.application.createWorkspace({
      experimentId: "experiment/post-gate",
      content: contentV2(0, 0),
    });
    await expect(postGateHarness.application.createSnapshot({
      experimentId: "experiment/post-gate",
      expectedDraftVersion: 0,
      expectedHeadSnapshotId: null,
    })).rejects.toThrow(/rejected capture/);
    expect(postGateHarness.repository.snapshotCount).toBe(0);
  });

  it("uses the previous head as the ordinary second Snapshot parent", async () => {
    const { application } = harnessV2();
    await application.createWorkspace({
      experimentId: "experiment/main",
      content: contentV2(0, 0),
    });
    const first = await application.createSnapshot({
      experimentId: "experiment/main",
      expectedDraftVersion: 0,
      expectedHeadSnapshotId: null,
    });
    const saved = await application.saveDraft({
      experimentId: "experiment/main",
      expectedDraftVersion: 1,
      desiredContent: desiredContentV2(),
      captureCorrelation: captureCorrelationV2(desiredContentV2()),
    });
    const second = await application.createSnapshot({
      experimentId: "experiment/main",
      expectedDraftVersion: saved.draftVersion,
      expectedHeadSnapshotId: first.snapshotId,
    });

    expect(second.parentSnapshotId).toBe(first.snapshotId);
  });

  it("rebases with CAS and uses the explicit target as the next parent", async () => {
    const { application } = harnessV2();
    await application.createWorkspace({
      experimentId: "experiment/source",
      content: contentV2(0, 0),
    });
    const source = await application.createSnapshot({
      experimentId: "experiment/source",
      expectedDraftVersion: 0,
      expectedHeadSnapshotId: null,
    });
    await application.createWorkspace({
      experimentId: "experiment/target",
      content: contentV2(10, 4),
    });
    const target = await application.createSnapshot({
      experimentId: "experiment/target",
      expectedDraftVersion: 0,
      expectedHeadSnapshotId: null,
    });

    const rebased = await application.rebaseDraft({
      experimentId: "experiment/source",
      expectedDraftVersion: 1,
      expectedHeadSnapshotId: source.snapshotId,
      targetSnapshotId: target.snapshotId,
      content: target.content,
    });
    expect(rebased).toMatchObject({
      draftVersion: 2,
      headSnapshotId: source.snapshotId,
      basedOnSnapshotId: target.snapshotId,
    });

    const next = await application.createSnapshot({
      experimentId: "experiment/source",
      expectedDraftVersion: 2,
      expectedHeadSnapshotId: source.snapshotId,
    });
    expect(next.parentSnapshotId).toBe(target.snapshotId);
  });

  it("keeps Snapshot and head unchanged when the ID factory collides", async () => {
    const snapshotIds = [
      "snapshot/main-head",
      "snapshot/collision",
      "snapshot/collision",
    ];
    const { application, repository } = harnessV2(
      undefined,
      undefined,
      { nextSnapshotId: () => snapshotIds.shift() ?? "snapshot/exhausted" },
    );
    await application.createWorkspace({
      experimentId: "experiment/main",
      content: contentV2(0, 0),
    });
    const first = await application.createSnapshot({
      experimentId: "experiment/main",
      expectedDraftVersion: 0,
      expectedHeadSnapshotId: null,
    });
    await application.createWorkspace({
      experimentId: "experiment/other",
      content: contentV2(0, 0),
    });
    await application.createSnapshot({
      experimentId: "experiment/other",
      expectedDraftVersion: 0,
      expectedHeadSnapshotId: null,
    });
    const saved = await application.saveDraft({
      experimentId: "experiment/main",
      expectedDraftVersion: 1,
      desiredContent: desiredContentV2(),
      captureCorrelation: captureCorrelationV2(desiredContentV2()),
    });

    await expect(application.createSnapshot({
      experimentId: "experiment/main",
      expectedDraftVersion: saved.draftVersion,
      expectedHeadSnapshotId: first.snapshotId,
    })).rejects.toBeInstanceOf(StudioExperimentConflictErrorV2);
    expect(repository.snapshotCount).toBe(2);
    expect(await application.readWorkspace("experiment/main")).toMatchObject({
      draftVersion: saved.draftVersion,
      headSnapshotId: first.snapshotId,
      basedOnSnapshotId: first.snapshotId,
    });
  });

  it("keeps the repository and raw Snapshot commit outside every exported facade", () => {
    expect(studioPublic).not.toHaveProperty("InMemoryExperimentRepositoryV2");
    expect(studioPublic).not.toHaveProperty(
      "StudioExperimentAuthoringApplicationV2",
    );
    expect(experimentInfrastructure).not.toHaveProperty(
      "InMemoryExperimentRepositoryV2",
    );
    expect(experimentInfrastructure).not.toHaveProperty(
      "StudioUnqualifiedSnapshotCommitErrorV2",
    );
    expect(Object.keys(experimentInfrastructure).join(",")).not.toMatch(
      /commit/i,
    );
    const { application, repository } = harnessV2();
    expect(Object.isFrozen(application)).toBe(true);
    expect(Object.getPrototypeOf(application)).toBe(Object.prototype);
    expect(Object.keys(application).sort()).toEqual([
      "createSnapshot",
      "createWorkspace",
      "forkWorkspace",
      "readSnapshot",
      "readWorkspace",
      "rebaseDraft",
      "saveDraft",
    ]);
    expect(application).not.toHaveProperty("repository");
    expect(application).not.toHaveProperty("qualifiedSnapshotCommit");
    expect(Object.isFrozen(repository)).toBe(true);
    expect(Object.getPrototypeOf(repository)).toBe(Object.prototype);
    expect(Object.keys(repository).sort()).toEqual([
      "readSnapshot",
      "readWorkspace",
      "snapshotCount",
      "workspaceCount",
    ]);
  });
});

function harnessV2(
  gate: ExperimentSnapshotGatePortV2 | undefined = undefined,
  capture: ExperimentDraftCapturePortV2 = {
    captureAcceptedCandidate(input) {
      return Promise.resolve(captureResultV2(input));
    },
  },
  snapshotIds: { nextSnapshotId(): string } | undefined = undefined,
  adapter: RegisteredModelCaptureAdapterV2 = captureAdapterV2(),
) {
  const resolvedGate: ExperimentSnapshotGatePortV2 = gate ?? {
    qualifyFrozenCandidate({ content }) {
      return Promise.resolve({
        status: "passed",
        qualifiedContent: replaceCheckpointV2(content, 100, 2),
      });
    },
  };
  let nextSnapshot = 0;
  const { application, queries } = createInMemoryExperimentAuthoringV2({
    models: {
      resolveExactRuntime(modelId) {
        const model = modelContractV2();
        if (modelId !== model.modelId) {
          throw new Error(`model not found: ${modelId}`);
        }
        return {
          contract: model,
          captureAdapter: adapter,
          draftCapture: {
            modelId: model.modelId,
            fixtureSchemaId: model.fixtureSchemaId,
            checkpointCodecId: model.checkpointCodecId,
            captureAcceptedCandidate: capture.captureAcceptedCandidate,
          },
          snapshotGate: {
            modelId: model.modelId,
            snapshotGateId: model.snapshotGateId,
            qualifyFrozenCandidate: resolvedGate.qualifyFrozenCandidate,
          },
          fixtureAdapter: {
            modelId: model.modelId,
            fixtureSchemaId: model.fixtureSchemaId,
            validateCompleteFixture() { return undefined; },
          },
          simulationAdapter: {
            modelId: model.modelId,
            fixtureSchemaId: model.fixtureSchemaId,
            checkpointCodecId: model.checkpointCodecId,
            async createSession() {},
            disposeSession() {},
            currentFrame() {
              throw new Error("not used by authoring harness");
            },
            advanceOnePresentationStep() {
              throw new Error("not used by authoring harness");
            },
            applyControl() {
              throw new Error("not used by authoring harness");
            },
            requestAnalysis() {
              throw new Error("not used by authoring harness");
            },
            async replaceFixture() {
              return 0;
            },
            currentInputEpoch() {
              return 0;
            },
          },
        };
      },
    },
    snapshotIds: snapshotIds ?? {
      nextSnapshotId() {
        nextSnapshot += 1;
        return `snapshot/${nextSnapshot}`;
      },
    },
    clock: {
      nowIso() {
        return "2026-07-31T00:00:00.000Z";
      },
    },
  });
  return { application, repository: queries };
}

function modelContractV2(): ModelContractV2 {
  return {
    modelId: "model/main-wire-v3-r1",
    modelFamilyId: "model/main-wire-v3",
    displayName: "Main Wire V3",
    fixtureSchemaId: "fixture/main-wire-v3-r1",
    checkpointCodecId: "checkpoint/main-wire-v3-r1",
    snapshotGateId: "snapshot-gate/main-wire-v3-r1",
    controlCatalog: [{
      controlId: "control/heart-rate",
      valueType: "number",
      unit: "bpm",
      minimum: 30,
      maximum: 180,
      step: 1,
      defaultValue: 72,
      changeSemantics: "reset",
    }],
    outputCatalog: [{
      outputId: "output/co",
      kind: "metric",
      unit: "L/min",
      shape: "scalar",
      scope: "beat",
      dependencies: [],
    }],
    graphCatalog: [{
      graphId: "graph-definition/pressure",
      renderer: "sweep",
      outputIds: ["output/co"],
    }],
  };
}

function captureAdapterV2(): RegisteredModelCaptureAdapterV2 {
  return {
    modelId: "model/main-wire-v3-r1",
    fixtureSchemaId: "fixture/main-wire-v3-r1",
    checkpointCodecId: "checkpoint/main-wire-v3-r1",
    validateFixture({ fixture }) {
      const heartRate = (fixture as any)?.controls?.heartRateBpm;
      if (typeof heartRate !== "number" || heartRate <= 0) {
        throw new Error("invalid fixture schema");
      }
    },
    async validateCapture({ capture }) {
      if (!Array.isArray((capture.checkpoint.payload as any)?.state)) {
        throw new Error("invalid checkpoint codec");
      }
    },
  };
}

function desiredContentV2(): ExperimentDesiredContentV2 {
  const content = contentV2(0, 0);
  return {
    modelId: content.modelId,
    scenarios: content.scenarios.map((scenario) => ({
      scenarioId: scenario.scenarioId,
      label: scenario.label,
      fixture: scenario.capture.fixture,
    })),
    surface: content.surface,
  };
}

function desiredContentWithTwoScenariosV2(): ExperimentDesiredContentV2 {
  const desired = desiredContentV2();
  const first = desired.scenarios[0];
  return {
    ...desired,
    scenarios: [first, {
      ...first,
      scenarioId: "scenario/alternative",
      label: "Alternative",
      fixture: structuredClone(first.fixture),
    }],
  };
}

function captureCorrelationV2(
  desiredContent: ExperimentDesiredContentV2,
  expectedInputEpoch = 7,
) {
  return {
    runtimeSessionId: "runtime-session/workbench-1",
    scenarios: desiredContent.scenarios.map(({ scenarioId }, index) => ({
      scenarioId,
      expectedInputEpoch: expectedInputEpoch + index,
    })),
  };
}

function captureResultV2(
  input: Parameters<
    ExperimentDraftCapturePortV2["captureAcceptedCandidate"]
  >[0],
  content = captureDesiredContentV2(input.desiredContent),
) {
  return {
    content,
    confirmation: {
      experimentId: input.experimentId,
      runtimeSessionId: input.correlation.runtimeSessionId,
      scenarios: input.correlation.scenarios,
    },
  };
}

function captureDesiredContentV2(
  desiredContent: ExperimentDesiredContentV2,
  acceptedRevision = 1,
  acceptedTimeSec = 0.25,
): ExperimentContentV2 {
  return {
    modelId: desiredContent.modelId,
    scenarios: desiredContent.scenarios.map((scenario) => ({
      scenarioId: scenario.scenarioId,
      label: scenario.label,
      capture: {
        fixture: scenario.fixture,
        checkpoint: {
          acceptedRevision,
          acceptedTimeSec,
          payload: {
            state: [1, 2, 3],
          },
        },
      },
    })),
    surface: desiredContent.surface,
  };
}

function contentV2(
  acceptedRevision: number,
  acceptedTimeSec: number,
): ExperimentContentV2 {
  return {
    modelId: "model/main-wire-v3-r1",
    scenarios: [{
      scenarioId: "scenario/baseline",
      label: "Baseline",
      capture: {
        fixture: {
          controls: {
            heartRateBpm: 60,
          },
        },
        checkpoint: {
          acceptedRevision,
          acceptedTimeSec,
          payload: {
            state: [1, 2, 3],
          },
        },
      },
    }],
    surface: {
      groups: [{
        groupId: "group/main",
        label: "Main",
        order: 0,
        priority: 0,
      }],
      graphs: [{
        instanceId: "graph/pressure",
        graphId: "graph-definition/pressure",
        groupId: "group/main",
        order: 0,
        priority: 0,
      }],
      readouts: [{
        instanceId: "readout/co",
        outputId: "output/co",
        groupId: "group/main",
        order: 1,
        priority: 0,
      }],
      controls: [{
        instanceId: "control/hr",
        controlId: "control/heart-rate",
        targetScenarioIds: ["scenario/baseline"],
        groupId: "group/main",
        order: 2,
        priority: 0,
      }],
      note: {
        instanceId: "note/main",
        text: "Educational baseline.",
        groupId: "group/main",
        order: 3,
        priority: 0,
      },
    },
  };
}

function replaceCheckpointV2(
  content: ExperimentContentV2,
  acceptedRevision: number,
  acceptedTimeSec: number,
): ExperimentContentV2 {
  return {
    ...content,
    scenarios: content.scenarios.map((scenario) => ({
      ...scenario,
      capture: {
        fixture: scenario.capture.fixture,
        checkpoint: {
          ...scenario.capture.checkpoint,
          acceptedRevision,
          acceptedTimeSec,
          payload: {
            state: [4, 5, 6],
          },
        },
      },
    })),
  };
}

function mutableContentV2(
  content: ExperimentContentV2,
): any {
  return JSON.parse(JSON.stringify(content));
}

function mutableDesiredContentV2(
  content: ExperimentDesiredContentV2,
): any {
  return JSON.parse(JSON.stringify(content));
}
