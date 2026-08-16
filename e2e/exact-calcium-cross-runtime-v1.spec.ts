import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

type ExactReleaseV1 = Readonly<{
  manifest: Readonly<{ modelId: string }>;
  executables: Readonly<{
    modelId: string;
    fixtureSchemaId: string;
    checkpointCodecId: string;
    snapshotGateId: string;
    simulationAdapter: Readonly<{
      createSession(input: unknown): Promise<void>;
      disposeSession(runtimeSessionId: string): void;
      currentFrame(input: unknown): Readonly<{
        acceptedRevision: number;
        acceptedTimeSec: number;
      }>;
    }>;
    experimentCapture: Readonly<{
      captureAcceptedCandidate(input: unknown): Promise<Readonly<{
        content: Readonly<{
          scenarios: readonly Readonly<{
            capture: Readonly<{ checkpoint: unknown }>;
          }>[];
        }>;
      }>>;
    }>;
  }>;
}>;

type ExactArtifactModuleV1 = Readonly<{
  createCircleHeartExactModelReleaseV1(): ExactReleaseV1;
}>;

const artifactPath = new URL(
  "../studio/integrations/mainWireIntegratedV3/"
    + "MainWireIntegratedStudioExactModelV1.artifact.mjs",
  import.meta.url,
);
const artifactSource = readFileSync(artifactPath, "utf8");
const client = JSON.parse(readFileSync(new URL(
  "../studio/integrations/mainWireIntegratedV3/"
    + "MainWireIntegratedStudioExactModelV1.client.json",
  import.meta.url,
), "utf8")) as Readonly<{
  defaultFixture: Record<string, unknown>;
  manifest: Readonly<{
    fixtureSchema: Readonly<{
      definition: Readonly<{
        hemodynamicResearchInputRanges: Readonly<{
          heartRateBpm: Readonly<{
            minimum: number;
            maximum: number;
            step: number;
          }>;
        }>;
      }>;
    }>;
  }>;
}>;

test("@desktop Node checkpoints restore in a browser across the admitted HR domain", async ({
  page,
}) => {
  const artifactModule = (await import(
    pathToFileURL(artifactPath.pathname).href
  )) as ExactArtifactModuleV1;
  const release = artifactModule.createCircleHeartExactModelReleaseV1();
  const cases: Array<Readonly<{
    heartRateBpm: number;
    fixture: Record<string, unknown>;
    checkpoint: unknown;
  }>> = [];
  const heartRateRange = client.manifest.fixtureSchema.definition
    .hemodynamicResearchInputRanges.heartRateBpm;
  expect(Number.isInteger(heartRateRange.minimum)).toBe(true);
  expect(Number.isInteger(heartRateRange.maximum)).toBe(true);
  expect(Number.isInteger(heartRateRange.step)).toBe(true);
  expect(heartRateRange.step).toBeGreaterThan(0);

  for (
    let heartRateBpm = heartRateRange.minimum;
    heartRateBpm <= heartRateRange.maximum;
    heartRateBpm += heartRateRange.step
  ) {
    const runtimeSessionId = `node-calcium-portability-${heartRateBpm}`;
    const scenarioId = `scenario/hr-${heartRateBpm}`;
    const defaultHemodynamics = client.defaultFixture
      .hemodynamicResearchInputs as Record<string, unknown>;
    const fixture = {
      ...client.defaultFixture,
      hemodynamicResearchInputs: {
        ...defaultHemodynamics,
        heartRateBpm,
      },
    };
    await release.executables.simulationAdapter.createSession({
      runtimeSessionId,
      scenarios: [{ scenarioId, fixture }],
    });
    const captured = await release.executables.experimentCapture
      .captureAcceptedCandidate({
        experimentId: `experiment/hr-${heartRateBpm}`,
        model: release.executables,
        desiredContent: {
          modelId: release.manifest.modelId,
          scenarios: [{ scenarioId, label: `HR ${heartRateBpm}`, fixture }],
          surface: {
            graphPanes: [],
            outputPanes: [],
            controlPanes: [],
            note: { text: "" },
          },
        },
        correlation: {
          runtimeSessionId,
          scenarios: [{ scenarioId, expectedInputEpoch: 0 }],
        },
      });
    cases.push({
      heartRateBpm,
      fixture,
      checkpoint: captured.content.scenarios[0]!.capture.checkpoint,
    });
    release.executables.simulationAdapter.disposeSession(runtimeSessionId);
  }

  await page.goto("/ja");
  const failures = await page.evaluate(async ({ source, cases: inputs }) => {
    const url = URL.createObjectURL(new Blob([source], {
      type: "text/javascript",
    }));
    try {
      const browserModule = await import(url) as ExactArtifactModuleV1;
      const browserRelease = browserModule
        .createCircleHeartExactModelReleaseV1();
      const failed: Array<Readonly<{ heartRateBpm: number; error: string }>> = [];
      for (const input of inputs) {
        const runtimeSessionId = `browser-calcium-portability-${input.heartRateBpm}`;
        const scenarioId = `scenario/hr-${input.heartRateBpm}`;
        let sessionCreated = false;
        try {
          await browserRelease.executables.simulationAdapter.createSession({
            runtimeSessionId,
            scenarios: [{
              scenarioId,
              fixture: input.fixture,
              checkpoint: input.checkpoint,
            }],
          });
          sessionCreated = true;
          const frame = browserRelease.executables.simulationAdapter.currentFrame({
            runtimeSessionId,
            scenarioId,
          });
          if (frame.acceptedRevision !== 0 || frame.acceptedTimeSec !== 0) {
            throw new Error("restored checkpoint clock drifted");
          }
        } catch (error) {
          failed.push({
            heartRateBpm: input.heartRateBpm,
            error: error instanceof Error ? error.message : String(error),
          });
        } finally {
          if (sessionCreated) {
            browserRelease.executables.simulationAdapter
              .disposeSession(runtimeSessionId);
          }
        }
      }
      return failed;
    } finally {
      URL.revokeObjectURL(url);
    }
  }, { source: artifactSource, cases });

  expect(failures).toEqual([]);
});
