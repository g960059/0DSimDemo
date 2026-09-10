import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

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
      advancePresentationBatch(input: Readonly<{
        runtimeSessionId: string;
        scenarioId: string;
        stepCount: number;
        presentationOutputIds: readonly string[];
      }>): Promise<unknown>;
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
  "../data/model-releases/standard73/artifact.mjs.txt",
  import.meta.url,
);
const artifactSource = readFileSync(artifactPath, "utf8");
const bundle = JSON.parse(readFileSync(new URL(
  "../data/model-releases/standard73/bundle.json",
  import.meta.url,
), "utf8")) as Readonly<{
  baseline: Readonly<{ capture: Readonly<{ fixture: Record<string, unknown>; checkpoint: unknown }> }>;
  presets: readonly Readonly<{ capture: Readonly<{ fixture: Record<string, unknown>; checkpoint: unknown }> }>[];
  manifest: Readonly<{
    primitiveControlCatalog: readonly Readonly<{ controlId: string; minimum: number; maximum: number; step: number }>[];
  }>;
}>;

test("@desktop @webkit current-model Node checkpoints restore across the HR domain and both adopted cases", async ({
  page,
}) => {
  const artifactModule = (await import(
    `data:text/javascript;base64,${Buffer.from(artifactSource).toString("base64")}`
  )) as ExactArtifactModuleV1;
  const release = artifactModule.createCircleHeartExactModelReleaseV1();
  const cases: Array<Readonly<{
    heartRateBpm: number;
    fixture: Record<string, unknown>;
    checkpoint: unknown;
    expectedRevision: number;
    expectedTimeSec: number;
  }>> = [];
  const heartRateRange = bundle.manifest.primitiveControlCatalog
    .find(control => control.controlId === "rhythm.heart-rate-bpm")!;
  expect(Number.isInteger(heartRateRange.minimum)).toBe(true);
  expect(Number.isInteger(heartRateRange.maximum)).toBe(true);
  expect(Number.isInteger(heartRateRange.step)).toBe(true);
  expect(heartRateRange.step).toBeGreaterThan(0);
  const advancedCheckpointHeartRates = new Set([40, 52, 70, 100]);

  const inputs: Array<{ fixture: Record<string, unknown>; checkpoint?: unknown; advanced: boolean }> = [];
  for (
    let heartRateBpm = heartRateRange.minimum;
    heartRateBpm <= heartRateRange.maximum;
    heartRateBpm += heartRateRange.step
  ) {
    const defaultHemodynamics = bundle.baseline.capture.fixture
      .hemodynamicResearchInputs as Record<string, unknown>;
    const fixture = {
      ...bundle.baseline.capture.fixture,
      hemodynamicResearchInputs: {
        ...defaultHemodynamics,
        heartRateBpm,
      },
    };
    inputs.push({ fixture, advanced: advancedCheckpointHeartRates.has(heartRateBpm) });
  }
  for (const preset of [bundle.baseline, ...bundle.presets]) {
    inputs.push({ ...preset.capture, advanced: true });
  }
  for (const [index, input] of inputs.entries()) {
    const { fixture } = input;
    const heartRateBpm = (fixture.hemodynamicResearchInputs as { heartRateBpm: number }).heartRateBpm;
    const runtimeSessionId = `node-calcium-portability-${index}`;
    const scenarioId = `scenario/${index}`;
    await release.executables.simulationAdapter.createSession({
      runtimeSessionId,
      scenarios: [{ scenarioId, fixture, ...(input.checkpoint ? { checkpoint: input.checkpoint } : {}) }],
    });
    if (input.advanced) {
      for (let batchIndex = 0; batchIndex < 32; batchIndex += 1) {
        await release.executables.simulationAdapter.advancePresentationBatch({
          runtimeSessionId,
          scenarioId,
          stepCount: 64,
          presentationOutputIds: ["hemodynamics.pressure.absolute.LV"],
        });
      }
    }
    const expectedFrame = release.executables.simulationAdapter.currentFrame({
      runtimeSessionId,
      scenarioId,
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
      expectedRevision: expectedFrame.acceptedRevision,
      expectedTimeSec: expectedFrame.acceptedTimeSec,
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
      for (const [index, input] of inputs.entries()) {
        const runtimeSessionId = `browser-calcium-portability-${index}`;
        const scenarioId = `scenario/${index}`;
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
          if (frame.acceptedRevision !== input.expectedRevision
            || frame.acceptedTimeSec !== input.expectedTimeSec) {
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
