import { describe, expect, it } from "vitest";

import {
  StudioExperimentAuthoringConflictErrorV2,
  StudioExperimentCaptureMutationErrorV2,
  StudioExperimentSnapshotAdmissionProtocolErrorV2,
  StudioExperimentSnapshotAdmissionRejectedErrorV2,
} from "@/studio/application/authoring/StudioExperimentAuthoringApplicationV2";
import type {
  ExperimentCapturedContentV2,
  ExperimentDesiredContentV2,
  ExperimentSnapshotAdmissionPortV2,
  ExperimentSnapshotAdmissionResultV2,
  ExperimentCapturePortV2,
} from "@/studio/contracts/v2/authoring";
import {
  STUDIO_EXPERIMENT_V2_SCHEMA_ID,
  type ExperimentContentV2,
  type ExperimentV2,
} from "@/studio/contracts/v2/content";
import {
  createInMemoryExperimentAuthoringV2,
  StudioExperimentConflictErrorV2,
} from "@/studio/infrastructure/experiments/InMemoryExperimentRepositoryV2";
import type {
  InMemoryExperimentAuthoringSeedV2,
} from "@/studio/infrastructure/experiments/InMemoryExperimentRepositoryV2";
import * as experimentInfrastructure from "@/studio/infrastructure/experiments/InMemoryExperimentRepositoryV2";
import type {
  ModelContractV2,
  RegisteredModelCaptureAdapterV2,
} from "@/studio/contracts/v2/model";
import * as studioPublic from "@/studio";

const TEST_SURFACE_SERIES_ID_V2 = "surface-series/main-wire-standard";
const TEST_SURFACE_RELEASE_ID_V2 = "surface-release/main-wire-standard-r1";

describe("Studio Experiment authoring V2", () => {
  it("keeps Studio-owned Surface pins outside exact-model capture", async () => {
    const { application } = harnessV2();
    const surfaceSeriesId = "surface-series/main-wire-standard";
    const surfaceReleaseId = "surface-release/main-wire-standard-r1";
    const initial = {
      ...contentV2(0, 0),
      surfaceSeriesId,
    };
    await application.createExperiment({
      experimentId: "experiment/main",
      content: initial,
    });
    const desired = {
      ...desiredContentV2(),
      surfaceSeriesId,
    };

    const saved = await application.saveExperiment({
      experimentId: "experiment/main",
      expectedVersion: 0,
      desiredContent: desired,
      captureCorrelation: captureCorrelationV2(desired),
    });
    expect(saved.content.surfaceSeriesId).toBe(surfaceSeriesId);

    const snapshot = await application.createSnapshot({
      content: saved.content,
      surfaceReleaseId,
      savedExperiment: {
        experimentId: saved.experimentId,
        expectedVersion: saved.version,
      },
    });
    expect(snapshot.surfaceReleaseId).toBe(surfaceReleaseId);
    expect(snapshot.content.surfaceSeriesId).toBe(surfaceSeriesId);
  });

  it("rejects an exact-model capture that tries to mint Surface lineage", async () => {
    const { application } = harnessV2(undefined, {
      captureAcceptedCandidate(input) {
        const result = captureResultV2(input) as any;
        result.content.surfaceSeriesId = "surface-series/injected";
        return Promise.resolve(result);
      },
    });
    await application.createExperiment({
      experimentId: "experiment/main",
      content: contentV2(0, 0),
    });
    const desired = desiredContentV2();

    await expect(application.saveExperiment({
      experimentId: "experiment/main",
      expectedVersion: 0,
      desiredContent: desired,
      captureCorrelation: captureCorrelationV2(desired),
    })).rejects.toThrow(/must not own surfaceSeriesId/);
  });

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
    await application.createExperiment({
      experimentId: "experiment/main",
      content: initial,
    });

    const saved = await application.saveExperiment({
      experimentId: "experiment/main",
      expectedVersion: 0,
      desiredContent: desiredContentV2(),
      captureCorrelation: captureCorrelationV2(desiredContentV2()),
    });

    expect(saved.version).toBe(1);
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
    await application.createExperiment({
      experimentId: "experiment/main",
      content: initial,
    });
    const desired = mutableDesiredContentV2(desiredContentV2());
    desired.scenarios[0].label = "Renamed baseline";
    desired.surface.note.text = "Updated interpretation.";

    const saved = await application.saveExperiment({
      experimentId: "experiment/main",
      expectedVersion: 0,
      desiredContent: desired,
    });

    expect(captureCalled).toBe(false);
    expect(saved.version).toBe(1);
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
    await application.createExperiment({
      experimentId: "experiment/main",
      content: contentV2(0, 0),
    });
    const desired = mutableDesiredContentV2(desiredContentV2());
    desired.scenarios[0].fixture.controls.heartRateBpm = 75;

    await expect(application.saveExperiment({
      experimentId: "experiment/main",
      expectedVersion: 0,
      desiredContent: desired,
    })).rejects.toThrow(/captureCorrelation is required/);
    expect(captureCalled).toBe(false);
    expect((await application.readExperiment("experiment/main"))?.version)
      .toBe(0);
  });

  it("awaits exact capture restore before exposing a experiment or query result", async () => {
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

    const pendingCreate = application.createExperiment({
      experimentId: "experiment/main",
      content: contentV2(0, 0),
    });
    expect(validationCount).toBe(1);
    expect(repository.experimentCount).toBe(0);

    finishValidation?.();
    const created = await pendingCreate;
    expect(repository.experimentCount).toBe(1);
    expect(await repository.readExperiment("experiment/main")).toEqual(created);
    expect(validationCount).toBe(2);
  });

  it("keeps a experiment invisible when deferred exact restore rejects", async () => {
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

    const pendingCreate = application.createExperiment({
      experimentId: "experiment/rejected-restore",
      content: contentV2(0, 0),
    });
    const rejection = expect(pendingCreate).rejects.toThrow(
      /rejected capture: exact restore failed/,
    );
    expect(repository.experimentCount).toBe(0);

    rejectValidation?.(new Error("exact restore failed"));
    await rejection;
    expect(repository.experimentCount).toBe(0);
    expect(await repository.readExperiment("experiment/rejected-restore"))
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
    await application.createExperiment({
      experimentId: "experiment/main",
      content: contentV2(0, 0),
    });
    const desiredContent = desiredContentV2();

    await expect(application.saveExperiment({
      experimentId: "experiment/main",
      expectedVersion: 0,
      desiredContent,
      captureCorrelation: captureCorrelationV2(desiredContent),
    })).rejects.toThrow(/must exactly confirm/);
    expect((await application.readExperiment("experiment/main"))?.version)
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
    await application.createExperiment({
      experimentId: "experiment/main",
      content: contentV2(0, 0),
    });
    const desiredContent = desiredContentV2();
    const captureCorrelation = captureCorrelationV2(desiredContent) as any;
    captureCorrelation.scenarios[0].expectedInputEpoch = -1;

    await expect(application.saveExperiment({
      experimentId: "experiment/main",
      expectedVersion: 0,
      desiredContent,
      captureCorrelation,
    })).rejects.toThrow(/nonnegative safe integer/);
    expect(called).toBe(false);
  });

  it("rejects stale Draft writes without partial replacement", async () => {
    const { application } = harnessV2();
    await application.createExperiment({
      experimentId: "experiment/main",
      content: contentV2(0, 0),
    });
    await application.saveExperiment({
      experimentId: "experiment/main",
      expectedVersion: 0,
      desiredContent: desiredContentV2(),
      captureCorrelation: captureCorrelationV2(desiredContentV2()),
    });

    await expect(application.saveExperiment({
      experimentId: "experiment/main",
      expectedVersion: 0,
      desiredContent: desiredContentV2(),
      captureCorrelation: captureCorrelationV2(desiredContentV2()),
    })).rejects.toBeInstanceOf(StudioExperimentAuthoringConflictErrorV2);
    expect(
      (await application.readExperiment("experiment/main"))?.content.scenarios[0]
        .capture.checkpoint.acceptedRevision,
    ).toBe(1);
  });

  it("creates one neutral immutable Snapshot without replacing its checkpoint", async () => {
    const original = contentV2(4, 1);
    const { application, repository } = harnessV2({
      admitFrozenCandidate({ content }) {
        expect(Object.isFrozen(content)).toBe(true);
        expect(content).toEqual(original);
        return Promise.resolve({ status: "passed" });
      },
    });
    await application.createExperiment({
      experimentId: "experiment/main",
      content: original,
    });

    const snapshot = await createSnapshotForExperimentV2(application, {
      experimentId: "experiment/main",
      expectedVersion: 0,
      expectedHeadSnapshotId: null,
      createdBy: "user/author",
    });

    expect(snapshot).toMatchObject({
      snapshotId: "snapshot/1",
      createdAt: "2026-07-31T00:00:00.000Z",
      createdBy: "user/author",
    });
    expect(snapshot).not.toHaveProperty("kind");
    expect(snapshot).not.toHaveProperty("briefing");
    expect(snapshot.content).toEqual(original);
    expect(repository.snapshotCount).toBe(1);
    expect(Object.isFrozen(snapshot)).toBe(true);
  });

  it("enforces a clean saved head only when savedExperiment is requested", async () => {
    const { application, repository } = harnessV2();
    const savedContent = contentV2(4, 1);
    await application.createExperiment({
      experimentId: "experiment/main",
      content: savedContent,
    });
    const edited = {
      ...savedContent,
      surface: { ...savedContent.surface, note: { text: "unsaved edit" } },
    };

    await expect(application.createSnapshot({
      surfaceReleaseId: TEST_SURFACE_RELEASE_ID_V2,
      content: edited,
      savedExperiment: {
        experimentId: "experiment/main",
        expectedVersion: 0,
      },
    })).rejects.toThrow(/not the clean saved Experiment head/);
    await expect(application.createSnapshot({
      surfaceReleaseId: TEST_SURFACE_RELEASE_ID_V2,
      content: savedContent,
      savedExperiment: {
        experimentId: "experiment/missing",
        expectedVersion: 0,
      },
    })).rejects.toThrow(/Experiment not found/);
    await expect(application.createSnapshot({
      content: savedContent,
      surfaceReleaseId: TEST_SURFACE_RELEASE_ID_V2,
    }))
      .resolves.toMatchObject({ content: savedContent });
    expect(repository.snapshotCount).toBe(1);
  });

  it("uses the same admission for session and saved-Experiment workflows", async () => {
    let admissions = 0;
    const { application } = harnessV2({
      admitFrozenCandidate() {
        admissions += 1;
        return Promise.resolve({ status: "passed" });
      },
    });
    const content = contentV2(0, 0);
    await application.createSnapshot({
      content,
      surfaceReleaseId: TEST_SURFACE_RELEASE_ID_V2,
    });
    await application.createExperiment({
      experimentId: "experiment/common-admission",
      content,
    });
    await application.createSnapshot({
      surfaceReleaseId: TEST_SURFACE_RELEASE_ID_V2,
      content,
      savedExperiment: {
        experimentId: "experiment/common-admission",
        expectedVersion: 0,
      },
    });
    expect(admissions).toBe(2);
  });

  it("leaves no Snapshot when admission rejects or returns malformed data", async () => {
    const rejected = harnessV2({
      admitFrozenCandidate() {
        return Promise.resolve({ status: "rejected", reason: "unsafe" });
      },
    });
    await expect(rejected.application.createSnapshot({
      content: contentV2(0, 0),
      surfaceReleaseId: TEST_SURFACE_RELEASE_ID_V2,
    }))
      .rejects.toBeInstanceOf(StudioExperimentSnapshotAdmissionRejectedErrorV2);
    expect(rejected.repository.snapshotCount).toBe(0);

    for (const malformed of [
      { status: "skipped" },
      { status: "passed", verificationPassed: true },
      { status: "rejected", reason: "" },
    ]) {
      const harness = harnessV2({
        admitFrozenCandidate() {
          return Promise.resolve(malformed as any);
        },
      });
      await expect(harness.application.createSnapshot({
        content: contentV2(0, 0),
        surfaceReleaseId: TEST_SURFACE_RELEASE_ID_V2,
      }))
        .rejects.toBeInstanceOf(StudioExperimentSnapshotAdmissionProtocolErrorV2);
      expect(harness.repository.snapshotCount).toBe(0);
    }
  });

  it("binds admission to frozen content independently of later Experiment edits", async () => {
    let resolveAdmission:
      ((result: ExperimentSnapshotAdmissionResultV2) => void) | undefined;
    const admissionPromise = new Promise<ExperimentSnapshotAdmissionResultV2>(
      (resolve) => { resolveAdmission = resolve; },
    );
    const { application, repository } = harnessV2({
      admitFrozenCandidate() { return admissionPromise; },
    });
    const original = contentV2(0, 0);
    await application.createExperiment({
      experimentId: "experiment/main",
      content: original,
    });
    const pendingSnapshot = createSnapshotForExperimentV2(application, {
      experimentId: "experiment/main",
      expectedVersion: 0,
      expectedHeadSnapshotId: null,
    });
    await application.saveExperiment({
      experimentId: "experiment/main",
      expectedVersion: 0,
      desiredContent: desiredContentV2(),
      captureCorrelation: captureCorrelationV2(desiredContentV2()),
    });
    resolveAdmission?.({ status: "passed" });

    const snapshot = await pendingSnapshot;
    expect(snapshot.content).toEqual(original);
    expect(repository.snapshotCount).toBe(1);
    expect(await application.readExperiment("experiment/main"))
      .toMatchObject({ version: 1 });
  });

  it("forks Snapshot content into a detached Experiment without lineage fields", async () => {
    const { application } = harnessV2();
    await expect(application.createExperiment({
      experimentId: "experiment/invalid-direct-fork",
      basedOnSnapshotId: "snapshot/forbidden",
      content: contentV2(0, 0),
    } as any)).rejects.toThrow(/CreateExperiment field set mismatch/);
    await application.createExperiment({
      experimentId: "experiment/source",
      content: contentV2(0, 0),
    });
    const source = await createSnapshotForExperimentV2(application, {
      experimentId: "experiment/source",
      expectedVersion: 0,
      expectedHeadSnapshotId: null,
    });
    const forkExperiment = await application.forkExperiment({
      experimentId: "experiment/fork",
      sourceSnapshotId: source.snapshotId,
    });
    expect(forkExperiment.content).toEqual(source.content);
    expect(forkExperiment.content).not.toBe(source.content);

    const fork = await createSnapshotForExperimentV2(application, {
      experimentId: "experiment/fork",
      expectedVersion: 0,
      expectedHeadSnapshotId: null,
    });

    expect(fork).not.toHaveProperty("kind");
    expect(fork).not.toHaveProperty("parentSnapshotId");
    expect(fork).not.toHaveProperty("sourceExperimentId");
    expect(await application.readSnapshot(source.snapshotId)).toEqual(source);
  });

  it("fails closed on unknown command fields and explicit undefined optionals", async () => {
    const { application } = harnessV2();
    await application.createExperiment({
      experimentId: "experiment/main",
      content: contentV2(0, 0),
    });

    await expect(application.saveExperiment({
      experimentId: "experiment/main",
      expectedVersion: 0,
      desiredContent: desiredContentV2(),
      captureCorrelation: captureCorrelationV2(desiredContentV2()),
      qualification: true,
    } as any)).rejects.toThrow(/SaveExperiment field set mismatch/);
    await expect(application.createSnapshot({
      surfaceReleaseId: TEST_SURFACE_RELEASE_ID_V2,
      content: contentV2(0, 0),
      purpose: "publication",
      parentSnapshotId: null,
      verificationPassed: true,
    } as any)).rejects.toThrow(/CreateSnapshot field set mismatch/);
    await expect(application.createSnapshot({
      surfaceReleaseId: TEST_SURFACE_RELEASE_ID_V2,
      content: contentV2(0, 0),
      createdBy: undefined,
    } as any)).rejects.toThrow(/must be omitted or contain an ID/);
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
      const capture: ExperimentCapturePortV2 = {
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
      await application.createExperiment({
        experimentId: "experiment/main",
        content: contentV2(0, 0),
      });

      await expect(application.saveExperiment({
        experimentId: "experiment/main",
        expectedVersion: 0,
        desiredContent: testCase.desiredContent,
        captureCorrelation: captureCorrelationV2(testCase.desiredContent),
      })).rejects.toBeInstanceOf(
        StudioExperimentCaptureMutationErrorV2,
      );
      expect(repository.snapshotCount).toBe(0);
      expect((await application.readExperiment("experiment/main"))?.version)
        .toBe(0);
    }
  });

  it("binds experiments and Surface references to a registered model", async () => {
    const { application } = harnessV2();
    const unknownGraph = mutableContentV2(contentV2(0, 0));
    unknownGraph.surface.graphPanes[0].graphId = "graph-definition/missing";
    await expect(application.createExperiment({
      experimentId: "experiment/unknown-graph",
      content: unknownGraph,
    })).rejects.toThrow(/unknown registered graph/);

    await application.createExperiment({
      experimentId: "experiment/main",
      content: contentV2(0, 0),
    });
    const changedModel = mutableDesiredContentV2(desiredContentV2());
    changedModel.modelId = "model/other";
    await expect(application.saveExperiment({
      experimentId: "experiment/main",
      expectedVersion: 0,
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
    await expect(application.createExperiment({
      experimentId: "experiment/malformed-create",
      content: malformedCreate,
    })).rejects.toThrow(/rejected capture/);

    await application.createExperiment({
      experimentId: "experiment/main",
      content: contentV2(0, 0),
    });
    const malformedFixture = mutableDesiredContentV2(desiredContentV2());
    malformedFixture.scenarios[0].fixture.controls.heartRateBpm = 0;
    await expect(application.saveExperiment({
      experimentId: "experiment/main",
      expectedVersion: 0,
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
    await postCaptureHarness.application.createExperiment({
      experimentId: "experiment/post-capture",
      content: contentV2(0, 0),
    });
    await expect(postCaptureHarness.application.saveExperiment({
      experimentId: "experiment/post-capture",
      expectedVersion: 0,
      desiredContent: desiredContentV2(),
      captureCorrelation: captureCorrelationV2(desiredContentV2()),
    })).rejects.toThrow(/rejected capture/);

  });

  it("keeps standalone Snapshots and the Experiment unchanged when an ID collides", async () => {
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
    await application.createExperiment({
      experimentId: "experiment/main",
      content: contentV2(0, 0),
    });
    const first = await createSnapshotForExperimentV2(application, {
      experimentId: "experiment/main",
      expectedVersion: 0,
      expectedHeadSnapshotId: null,
    });
    await application.createExperiment({
      experimentId: "experiment/other",
      content: contentV2(0, 0),
    });
    await createSnapshotForExperimentV2(application, {
      experimentId: "experiment/other",
      expectedVersion: 0,
      expectedHeadSnapshotId: null,
    });
    await expect(application.createSnapshot({
      surfaceReleaseId: TEST_SURFACE_RELEASE_ID_V2,
      content: first.content,
      savedExperiment: {
        experimentId: "experiment/main",
        expectedVersion: 0,
      },
    })).rejects.toBeInstanceOf(StudioExperimentConflictErrorV2);
    expect(repository.snapshotCount).toBe(2);
    expect(await application.readExperiment("experiment/main")).toMatchObject({
      version: 0,
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
      "StudioUnadmittedSnapshotCommitErrorV2",
    );
    expect(Object.keys(experimentInfrastructure).join(",")).not.toMatch(
      /commit/i,
    );
    const { application, repository } = harnessV2();
    expect(Object.isFrozen(application)).toBe(true);
    expect(Object.getPrototypeOf(application)).toBe(Object.prototype);
    expect(Object.keys(application).sort()).toEqual([
      "createExperiment",
      "createSnapshot",
      "forkExperiment",
      "readExperiment",
      "readSnapshot",
      "saveExperiment",
    ]);
    expect(application).not.toHaveProperty("repository");
    expect(application).not.toHaveProperty("admittedSnapshotCommit");
    expect(Object.isFrozen(repository)).toBe(true);
    expect(Object.getPrototypeOf(repository)).toBe(Object.prototype);
    expect(Object.keys(repository).sort()).toEqual([
      "experimentCount",
      "readExperiment",
      "readSnapshot",
      "snapshotCount",
    ]);
  });
});

function harnessV2(
  gate: ExperimentSnapshotAdmissionPortV2 | undefined = undefined,
  capture: ExperimentCapturePortV2 = {
    captureAcceptedCandidate(input) {
      return Promise.resolve(captureResultV2(input));
    },
  },
  snapshotIds: { nextSnapshotId(): string } | undefined = undefined,
  adapter: RegisteredModelCaptureAdapterV2 = captureAdapterV2(),
  seed: InMemoryExperimentAuthoringSeedV2 | undefined = undefined,
) {
  const resolvedGate: ExperimentSnapshotAdmissionPortV2 = gate ?? {
    admitFrozenCandidate() {
      return Promise.resolve({ status: "passed" });
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
          analysisOutputCatalog: [],
          captureAdapter: adapter,
          experimentCapture: {
            modelId: model.modelId,
            fixtureSchemaId: model.fixtureSchemaId,
            checkpointCodecId: model.checkpointCodecId,
            captureAcceptedCandidate: capture.captureAcceptedCandidate,
          },
          snapshotGate: {
            modelId: model.modelId,
            snapshotGateId: model.snapshotGateId,
            admitFrozenCandidate: resolvedGate.admitFrozenCandidate,
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
            advancePresentationBatch() {
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
          executionPlan: {
            schemaId: "circleheart-registered-model-execution-plan-adapter-v1" as const,
            modelId: model.modelId,
            descriptor: {},
            bind() {
              throw new Error("not used by authoring harness");
            },
            createSession() {
              throw new Error("not used by authoring harness");
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
    ...(seed === undefined ? {} : { seed }),
  });
  return { application, repository: queries };
}

async function createSnapshotForExperimentV2(
  application: ReturnType<typeof harnessV2>["application"],
  input: Readonly<{
    experimentId: string;
    expectedVersion: number;
    expectedHeadSnapshotId: string | null;
    createdBy?: string;
  }>,
) {
  const experiment = await application.readExperiment(input.experimentId);
  if (experiment === null) {
    throw new Error(`Experiment not found: ${input.experimentId}`);
  }
  return application.createSnapshot({
    surfaceReleaseId: TEST_SURFACE_RELEASE_ID_V2,
    content: experiment.content,
    savedExperiment: {
      experimentId: input.experimentId,
      expectedVersion: input.expectedVersion,
    },
    ...(Object.prototype.hasOwnProperty.call(input, "createdBy")
      ? { createdBy: input.createdBy! }
      : {}),
  });
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
      changeSemantics: "accepted-state-warm-start",
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
      seriesCatalog: [{
        kind: "scalar",
        seriesId: "CO",
        outputId: "output/co",
      }],
      defaultSeriesIds: ["CO"],
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
    surfaceSeriesId: content.surfaceSeriesId,
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
    ExperimentCapturePortV2["captureAcceptedCandidate"]
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
): ExperimentCapturedContentV2 {
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
    surfaceSeriesId: TEST_SURFACE_SERIES_ID_V2,
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
      graphPanes: [{
        paneId: "pane/pressure",
        role: "graph",
        label: "Pressure",
        order: 0,
        priority: 0,
        graphId: "graph-definition/pressure",
        scenarioScope: { mode: "visible-scenarios" },
        excludedTraces: [],
        windowSec: 2,
        series: [{
          seriesId: "CO",
          label: "Cardiac output",
          order: 0,
        }],
      }],
      outputPanes: [{
        paneId: "pane/outputs",
        role: "output",
        label: "Outputs",
        order: 0,
        priority: 0,
        binding: { mode: "active-slot" },
        items: [{
          outputId: "output/co",
          label: "Cardiac output",
          order: 0,
        }],
      }],
      controlPanes: [{
        paneId: "pane/controls",
        role: "control",
        label: "Controls",
        order: 0,
        priority: 0,
        binding: { mode: "active-slot" },
        items: [{
          controlId: "control/heart-rate",
          label: "Heart rate",
          order: 0,
          presentation: { kind: "slider" },
        }],
      }],
      note: {
        text: "Educational baseline.",
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

function mutableContentV2<T>(content: T): any {
  return JSON.parse(JSON.stringify(content));
}

function mutableDesiredContentV2(
  content: ExperimentDesiredContentV2,
): any {
  return JSON.parse(JSON.stringify(content));
}
