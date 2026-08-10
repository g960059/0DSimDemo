import { describe, expect, it, vi } from "vitest";

import {
  STUDIO_AUTHORING_COMMAND_V1_SCHEMA_ID,
  executeStudioAuthoringCommandV1,
  type StudioAuthoringModelPortV1,
  validateStudioAuthoringCommandV1,
  type StudioAuthoringRepositoryPortV1,
} from "@/studio/application/authoring/StudioAuthoringCommandV1";
import { STUDIO_ARTICLE_DRAFT_V2_SCHEMA_ID } from "@/studio/contracts/v2/article";
import {
  STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
  STUDIO_EXPERIMENT_V2_SCHEMA_ID,
} from "@/studio/contracts/v2/content";

describe("Studio authoring command V1", () => {
  it("accepts a complete Article save command and rejects hidden authority", () => {
    const command = articleSaveCommandV1();
    expect(validateStudioAuthoringCommandV1(command)).toEqual(command);
    expect(() => validateStudioAuthoringCommandV1({
      ...command,
      serviceRoleKey: "must-never-enter-a-command",
    })).toThrow(/keys must be exactly/);
  });

  it("executes through a repository port with an optional policy seam", async () => {
    const repository = repositoryV1();
    const authorize = vi.fn();
    await expect(executeStudioAuthoringCommandV1(
      repository,
      modelsV1(),
      articleSaveCommandV1(),
      { authorize },
    )).resolves.toMatchObject({ articleId: "article/pv-loop" });
    expect(authorize).toHaveBeenCalledOnce();
    expect(repository.saveArticle).toHaveBeenCalledWith({
      articleId: "article/pv-loop",
      expectedVersion: 2,
      article: articleV1(),
    });
  });

  it("publishes an already admitted Snapshot without an approval prompt", async () => {
    const repository = repositoryV1();
    await expect(executeStudioAuthoringCommandV1(repository, modelsV1(), {
      schemaId: STUDIO_AUTHORING_COMMAND_V1_SCHEMA_ID,
      commandId: "22222222-2222-4222-8222-222222222222",
      action: "experiment.publish",
      input: {
        experimentId: "experiment/pv-loop",
        expectedVersion: 3,
        snapshotId: "snapshot/admitted-pv-loop",
        publicSlug: "pv-loop-basics",
      },
    })).resolves.toEqual({ published: true });
    expect(repository.publishExperiment).toHaveBeenCalledOnce();
  });

  it("reads an exact Snapshot for Article authoring", async () => {
    const repository = repositoryV1();
    await expect(executeStudioAuthoringCommandV1(repository, modelsV1(), {
      schemaId: STUDIO_AUTHORING_COMMAND_V1_SCHEMA_ID,
      commandId: "55555555-5555-4555-8555-555555555555",
      action: "snapshot.read",
      input: { snapshotId: "snapshot/admitted-pv-loop" },
    })).resolves.toBeNull();
    expect(repository.readSnapshot).toHaveBeenCalledWith(
      "snapshot/admitted-pv-loop",
    );
  });

  it("rejects an Experiment presentation outside the resolved model catalog", async () => {
    const repository = repositoryV1();
    vi.mocked(repository.readMyExperiment).mockResolvedValue({
      experiment: {
        schemaId: STUDIO_EXPERIMENT_V2_SCHEMA_ID,
        experimentId: "experiment/pv-loop",
        version: 3,
        content: contentV1(),
      },
      title: "Baseline",
    });
    const surface = {
      ...contentV1().surface,
      graphPanes: [{
        paneId: "pane/unknown",
        role: "graph" as const,
        label: "Unknown",
        order: 0,
        priority: 0,
        graphId: "graph/not-registered",
        scenarioScope: { mode: "visible-scenarios" as const },
        excludedTraces: [],
        windowSec: 2,
        series: [],
      }],
    };
    await expect(executeStudioAuthoringCommandV1(repository, modelsV1(), {
      schemaId: STUDIO_AUTHORING_COMMAND_V1_SCHEMA_ID,
      commandId: "66666666-6666-4666-8666-666666666666",
      action: "experiment.presentation.save",
      input: {
        experimentId: "experiment/pv-loop",
        expectedVersion: 3,
        title: "Baseline",
        surface,
      },
    })).rejects.toThrow(/unknown registered graph/);
    expect(repository.saveExperiment).not.toHaveBeenCalled();
  });

  it("rejects an Article placement when its exact Snapshot is unavailable", async () => {
    const repository = repositoryV1();
    const article = {
      ...articleV1(),
      blocks: [{
        blockId: "block/simulation",
        kind: "experiment" as const,
        placement: {
          schemaId: STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
          placementId: "placement/pv-loop",
          snapshotId: "snapshot/missing",
          briefing: {
            defaultTitle: "PV loop",
            scenarioScope: {
              visibleScenarioIds: ["scenario/baseline"],
              initialFocusScenarioId: "scenario/baseline",
            },
            graphs: [],
            outputs: [],
            controls: [],
          },
          titleOverride: null,
          caption: null,
        },
      }],
    };
    await expect(executeStudioAuthoringCommandV1(repository, modelsV1(), {
      ...articleSaveCommandV1(),
      commandId: "77777777-7777-4777-8777-777777777777",
      input: {
        ...articleSaveCommandV1().input,
        article,
      },
    })).rejects.toThrow(/Snapshot snapshot\/missing is unavailable/);
    expect(repository.saveArticle).not.toHaveBeenCalled();
  });

  it("does not pretend raw parameter mutation is safe without an execution host", () => {
    expect(() => validateStudioAuthoringCommandV1({
      schemaId: STUDIO_AUTHORING_COMMAND_V1_SCHEMA_ID,
      commandId: "33333333-3333-4333-8333-333333333333",
      action: "scenario.parameter.set",
      input: { controlId: "hemodynamics.tbv", value: 4800 },
    })).toThrow(/Unsupported Studio authoring action/);
  });

  it("rejects an outer Article target that disagrees with its embedded draft", () => {
    const command = articleSaveCommandV1();
    expect(() => validateStudioAuthoringCommandV1({
      ...command,
      input: {
        ...command.input,
        articleId: "article/another",
      },
    })).toThrow(/identity\/version must match/);
  });

  it("rejects unsafe image URLs in AI-authored Article blocks", () => {
    const command = articleSaveCommandV1();
    expect(() => validateStudioAuthoringCommandV1({
      ...command,
      input: {
        ...command.input,
        article: {
          ...command.input.article,
          blocks: [{
            blockId: "block/image",
            kind: "image",
            url: "file:///tmp/private.png",
            altText: "",
            caption: "",
          }],
        },
      },
    })).toThrow(/HTTPS URL/);
  });
});

function articleSaveCommandV1() {
  return {
    schemaId: STUDIO_AUTHORING_COMMAND_V1_SCHEMA_ID,
    commandId: "11111111-1111-4111-8111-111111111111",
    action: "article.save" as const,
    input: {
      articleId: "article/pv-loop",
      expectedVersion: 2,
      article: articleV1(),
    },
  };
}

function articleV1() {
  return {
    schemaId: STUDIO_ARTICLE_DRAFT_V2_SCHEMA_ID,
    articleId: "article/pv-loop",
    draftVersion: 2,
    visibility: "draft" as const,
    locale: "ja",
    title: "PV loopの基礎",
    blocks: [{
      blockId: "block/equation",
      kind: "equation" as const,
      expression: "CO = HR \\times SV",
    }, {
      blockId: "block/image",
      kind: "image" as const,
      url: "https://example.com/pv-loop.png",
      altText: "PV loop",
      caption: "Baseline",
    }, {
      blockId: "block/divider",
      kind: "divider" as const,
    }],
  };
}

function repositoryV1(): StudioAuthoringRepositoryPortV1 {
  return {
    listMyExperiments: vi.fn().mockResolvedValue({ items: [] }),
    listMySnapshots: vi.fn().mockResolvedValue({ items: [] }),
    listMyArticles: vi.fn().mockResolvedValue({ items: [] }),
    readMyExperiment: vi.fn().mockResolvedValue(null),
    readSnapshot: vi.fn().mockResolvedValue(null),
    readArticle: vi.fn().mockResolvedValue(null),
    saveExperiment: vi.fn(),
    publishExperiment: vi.fn().mockResolvedValue(undefined),
    saveArticle: vi.fn().mockImplementation(async ({ article }) => article),
    publishArticle: vi.fn().mockResolvedValue(undefined),
  };
}

function modelsV1(): StudioAuthoringModelPortV1 {
  return {
    resolveModel: vi.fn().mockResolvedValue({
      modelId: "model/example",
      modelFamilyId: "model-family/example",
      displayName: "Example",
      fixtureSchemaId: "fixture/example-v1",
      checkpointCodecId: "checkpoint/example-v1",
      snapshotGateId: "snapshot/example-v1",
      controlCatalog: [],
      outputCatalog: [],
      graphCatalog: [],
    }),
  };
}

function contentV1() {
  return {
    modelId: "model/example",
    surfaceSeriesId: "surface-series/example",
    scenarios: [{
      scenarioId: "scenario/baseline",
      label: "Baseline",
      capture: {
        fixture: {},
        checkpoint: {
          acceptedRevision: 1,
          acceptedTimeSec: 0.002,
          payload: {},
        },
      },
    }],
    surface: {
      graphPanes: [],
      outputPanes: [],
      controlPanes: [],
      note: { text: "" },
    },
  };
}
