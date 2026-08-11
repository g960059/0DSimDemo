import { describe, expect, it, vi } from "vitest";

import {
  STUDIO_AUTHORING_COMMAND_V1_SCHEMA_ID,
  describeStudioAuthoringProtocolV1,
  executeStudioAuthoringCommandV1,
  type StudioAuthoringModelPortV1,
  validateStudioAuthoringCommandV1,
  type StudioAuthoringRepositoryPortV1,
} from "@/studio/application/authoring/StudioAuthoringCommandV1";
import { STUDIO_ARTICLE_DRAFT_V2_SCHEMA_ID } from "@/studio/contracts/v2/article";
import {
  STUDIO_EXPERIMENT_PLACEMENT_V2_SCHEMA_ID,
  STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
  STUDIO_EXPERIMENT_V2_SCHEMA_ID,
} from "@/studio/contracts/v2/content";

describe("Studio authoring command V1", () => {
  it("describes nested numerical and Article commands for AI discovery", () => {
    const description = describeStudioAuthoringProtocolV1();
    const preview = description.actions.find(({ action }) =>
      action === "experiment.preview");
    const patch = description.actions.find(({ action }) =>
      action === "article.blocks.patch");
    expect(description.jsonSchemaDialect)
      .toBe("https://json-schema.org/draft/2020-12/schema");
    expect(description.envelopes.command).toMatchObject({
      oneOf: expect.arrayContaining([
        expect.objectContaining({ additionalProperties: false }),
      ]),
    });
    expect(description.envelopes.error).toMatchObject({
      type: "object",
      properties: {
        error: {
          type: "object",
          properties: {
            recovery: {
              enum: expect.arrayContaining([
                "inspect-operation-then-retry-same-command",
                "read-authority-state",
              ]),
            },
          },
        },
      },
    });
    expect(description.protocol.errorRecovery).toMatchObject({
      "refresh-headless-token": expect.any(String),
      "read-authority-state": expect.any(String),
    });
    const previewInputBranches = (
      preview?.inputSchema as { oneOf?: Array<Record<string, any>> } | undefined
    )?.oneOf;
    expect(previewInputBranches).toHaveLength(2);
    for (const branch of previewInputBranches ?? []) {
      expect(branch).toMatchObject({
        additionalProperties: false,
        properties: {
          scenarioOperations: {
            items: { oneOf: expect.any(Array) },
          },
        },
      });
      const budget = (branch.properties as Record<string, any>).executionBudget;
      expect(budget.properties.advanceSeconds.maximum).toBe(120);
      expect(budget.properties.wallClockTimeoutMs.maximum).toBe(600_000);
    }
    const previewResult = preview?.resultSchema as {
      properties?: Record<string, any>;
    } | undefined;
    const planBranches = previewResult?.properties?.plan?.oneOf as
      | Array<Record<string, any>>
      | undefined;
    expect(planBranches).toHaveLength(2);
    expect(planBranches).toEqual(expect.arrayContaining([
      expect.objectContaining({
        properties: expect.objectContaining({
          experimentId: { const: null },
          expectedVersion: { const: null },
          planDigest: { pattern: "^[0-9a-f]{64}$", type: "string" },
        }),
      }),
      expect.objectContaining({
        properties: expect.objectContaining({
          experimentId: { minLength: 1, type: "string" },
          expectedVersion: { minimum: 0, type: "integer" },
        }),
      }),
    ]));
    expect(previewResult?.properties?.observations).toMatchObject({
      items: { properties: { outputs: { type: "array" } } },
    });
    expect(patch?.inputSchema).toMatchObject({
      properties: {
        operations: { items: { oneOf: expect.any(Array) } },
      },
    });
    const apply = description.actions.find(({ action }) =>
      action === "experiment.apply");
    const applyResultBranches = (
      apply?.resultSchema as { oneOf?: Array<Record<string, any>> } | undefined
    )?.oneOf;
    expect(applyResultBranches).toHaveLength(2);
    const replayResult = applyResultBranches?.find((branch) => (
      (branch.properties as Record<string, any> | undefined)?.replayed?.const
      === true
    ));
    expect(replayResult).toBeDefined();
    expect((
      (replayResult?.properties as Record<string, any>).receipt.properties
        .status.const
    )).toBe("committed");
    const list = description.actions.find(({ action }) =>
      action === "experiment.list");
    expect(list?.inputSchema).toMatchObject({
      required: ["cursor", "limit"],
      properties: { cursor: { oneOf: expect.any(Array) } },
    });
    expect(list?.resultSchema).toMatchObject({
      properties: {
        items: { items: { additionalProperties: false } },
        nextCursor: { oneOf: expect.any(Array) },
      },
    });
    const articleSave = description.actions.find(({ action }) =>
      action === "article.save");
    const articleSaveBranches = (
      articleSave?.inputSchema as { oneOf?: Array<Record<string, any>> } | undefined
    )?.oneOf ?? [];
    const articleBlocks = (
      articleSaveBranches[0]?.properties as Record<string, any>
    )?.article?.properties?.blocks?.items?.oneOf as Array<Record<string, any>>;
    const imageBlock = articleBlocks.find((branch) =>
      branch.properties?.kind?.const === "image");
    expect(imageBlock?.properties?.url).toMatchObject({
      oneOf: expect.arrayContaining([
        { const: "" },
        expect.objectContaining({
          format: "uri",
          pattern: expect.stringContaining("https://"),
        }),
      ]),
    });
  });

  it("pages authoring inventory with one opaque authority cursor", async () => {
    const repository = repositoryV1();
    const command = {
      schemaId: STUDIO_AUTHORING_COMMAND_V1_SCHEMA_ID,
      commandId: "11111111-1111-4111-8111-111111111111",
      action: "experiment.list",
      input: {
        cursor: {
          timestamp: "2026-08-11T00:00:00.123456Z",
          id: "22222222-2222-4222-8222-222222222222",
        },
        limit: 50,
      },
    } as const;
    await executeStudioAuthoringCommandV1(repository, modelsV1(), command);
    expect(repository.listMyExperiments).toHaveBeenCalledWith(command.input);
    expect(() => validateStudioAuthoringCommandV1({
      ...command,
      input: { limit: 50 },
    })).toThrow(/keys must be exactly cursor, limit/);
  });

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

  it("rejects publication slugs before the backend constraint", () => {
    expect(() => validateStudioAuthoringCommandV1({
      schemaId: STUDIO_AUTHORING_COMMAND_V1_SCHEMA_ID,
      commandId: "22222222-2222-4222-8222-222222222222",
      action: "experiment.publish",
      input: {
        experimentId: "experiment/pv-loop",
        expectedVersion: 3,
        snapshotId: "snapshot/admitted-pv-loop",
        publicSlug: "Invalid slug",
      },
    })).toThrow(/3-96 lowercase alphanumeric or hyphen/);
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

  it("requires explicit Scenario operations in an AI numerical preview", () => {
    const command = validateStudioAuthoringCommandV1({
      schemaId: STUDIO_AUTHORING_COMMAND_V1_SCHEMA_ID,
      commandId: "12121212-1212-4212-8212-121212121212",
      action: "experiment.preview",
      input: {
        experimentId: "experiment/pv-loop",
        expectedVersion: 3,
        title: "Fluid response",
        scenarioOperations: [{
          operation: "update",
          scenarioId: "scenario/baseline",
          label: null,
          controls: [{ controlId: "hemodynamics.total-blood-volume-ml", value: 6100 }],
        }],
        presentation: { mode: "preserve", note: "" },
        executionBudget: {
          advanceSeconds: 10,
          maxPresentationSteps: 2_000,
          wallClockTimeoutMs: 60_000,
        },
        observeOutputIds: null,
      },
    });
    expect(command.action).toBe("experiment.preview");
    if (command.action !== "experiment.preview") throw new Error("unexpected action");
    expect(command.input.scenarioOperations).toEqual([{
      operation: "update",
      scenarioId: "scenario/baseline",
      label: null,
      controls: [{ controlId: "hemodynamics.total-blood-volume-ml", value: 6100 }],
    }]);
  });

  it("returns a committed receipt before repeating an expensive mutation", async () => {
    const repository = repositoryV1();
    vi.mocked(repository.claimMyAuthoringCommand).mockResolvedValue({
      operationId: "66666666-6666-4666-8666-666666666666",
      operationKind: "save-experiment-v1",
      status: "committed",
      result: { experimentId: "experiment/pv-loop", version: 4 },
      createdAt: "2026-08-11T00:00:00.000Z",
      completedAt: "2026-08-11T00:00:01.000Z",
    });
    await expect(executeStudioAuthoringCommandV1(repository, modelsV1(), {
      schemaId: STUDIO_AUTHORING_COMMAND_V1_SCHEMA_ID,
      commandId: "66666666-6666-4666-8666-666666666666",
      action: "experiment.presentation.save",
      input: {
        experimentId: "experiment/pv-loop",
        expectedVersion: 3,
        surfaceReleaseId: "surface-release/example",
        title: "Baseline",
        surface: contentV1().surface,
      },
    })).resolves.toMatchObject({
      replayed: true,
      receipt: { status: "committed" },
    });
    expect(repository.readMyExperiment).not.toHaveBeenCalled();
    expect(repository.saveExperiment).not.toHaveBeenCalled();
    expect(repository.claimMyAuthoringCommand).toHaveBeenCalledWith({
      commandId: "66666666-6666-4666-8666-666666666666",
      action: "experiment.presentation.save",
      commandDigest: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
  });

  it("patches selected Article blocks without replacing the whole draft", async () => {
    const repository = repositoryV1();
    vi.mocked(repository.readArticle).mockResolvedValue(articleV1());
    await expect(executeStudioAuthoringCommandV1(repository, modelsV1(), {
      schemaId: STUDIO_AUTHORING_COMMAND_V1_SCHEMA_ID,
      commandId: "13131313-1313-4313-8313-131313131313",
      action: "article.blocks.patch",
      input: {
        articleId: "article/pv-loop",
        expectedVersion: 2,
        title: null,
        operations: [{
          operation: "replace",
          blockId: "block/equation",
          block: {
            blockId: "block/equation",
            kind: "paragraph",
            text: "Observed rather than assumed.",
          },
        }],
      },
    })).resolves.toMatchObject({ articleId: "article/pv-loop" });
    expect(repository.saveArticle).toHaveBeenCalledWith(expect.objectContaining({
      article: expect.objectContaining({
        blocks: expect.arrayContaining([{
          blockId: "block/equation",
          kind: "paragraph",
          text: "Observed rather than assumed.",
        }]),
      }),
    }));
  });

  it("places one fixed Snapshot Briefing through the AI command seam", async () => {
    const repository = repositoryV1();
    vi.mocked(repository.readArticle).mockResolvedValue(articleV1());
    vi.mocked(repository.readSnapshot).mockResolvedValue({
      schemaId: STUDIO_EXPERIMENT_SNAPSHOT_V2_SCHEMA_ID,
      snapshotId: "snapshot/admitted-pv-loop",
      content: contentV1(),
      surfaceReleaseId: "surface-release/example",
      createdAt: "2026-08-11T00:00:00.000Z",
    });
    await expect(executeStudioAuthoringCommandV1(repository, modelsV1(), {
      schemaId: STUDIO_AUTHORING_COMMAND_V1_SCHEMA_ID,
      commandId: "14141414-1414-4414-8414-141414141414",
      action: "article.briefing.place",
      input: {
        articleId: "article/pv-loop",
        expectedVersion: 2,
        snapshotId: "snapshot/admitted-pv-loop",
        selection: {
          title: "PV loop",
          visibleScenarioIds: null,
          initialFocusScenarioId: null,
          graphPaneIds: null,
          outputIds: null,
          controlIds: null,
        },
        target: { mode: "append" },
      },
    })).resolves.toMatchObject({
      articleId: "article/pv-loop",
      placementId: "placement/authoring/14141414-1414-4414-8414-141414141414",
      blockId: "block/authoring/14141414-1414-4414-8414-141414141414",
      snapshotId: "snapshot/admitted-pv-loop",
    });
    expect(repository.saveArticle).toHaveBeenCalledWith(expect.objectContaining({
      article: expect.objectContaining({
        blocks: expect.arrayContaining([expect.objectContaining({
          kind: "experiment",
          placement: expect.objectContaining({
            snapshotId: "snapshot/admitted-pv-loop",
            briefing: expect.objectContaining({ defaultTitle: "PV loop" }),
          }),
        })]),
      }),
    }));
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
        surfaceReleaseId: "surface-release/example",
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

  it("rejects an empty Article title before persistence", () => {
    const command = articleSaveCommandV1();
    expect(() => validateStudioAuthoringCommandV1({
      ...command,
      input: {
        ...command.input,
        article: { ...command.input.article, title: "" },
      },
    })).toThrow(/article\.title must be non-empty/);
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
    listMyExperiments: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    listMySnapshots: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    listMyArticles: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
    readMyExperiment: vi.fn().mockResolvedValue(null),
    readSnapshot: vi.fn().mockResolvedValue(null),
    readArticle: vi.fn().mockResolvedValue(null),
    readMyAuthoringOperationReceipt: vi.fn().mockResolvedValue(null),
    claimMyAuthoringCommand: vi.fn().mockResolvedValue(null),
    saveExperiment: vi.fn(),
    commitSnapshot: vi.fn(),
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
    resolveActiveNumericalModel: vi.fn(),
    resolveLatestNumericalModel: vi.fn(),
    resolveExactNumericalModel: vi.fn(),
    prepareSurface: vi.fn(),
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
