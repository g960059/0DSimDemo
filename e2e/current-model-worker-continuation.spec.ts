import { expect, test } from "@playwright/test";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const bundle = JSON.parse(readFileSync("data/model-releases/standard74/bundle.json", "utf8"));
const lock = JSON.parse(readFileSync("data/model-releases/standard74/publication.json", "utf8"));

test("@desktop @webkit current compiled Worker warm edits and restored branches remain bit-identical", async ({ page }, testInfo) => {
  const assets = `${process.env.CIRCLEHEART_E2E_DIST ?? "dist"}/assets`;
  const files = readdirSync(assets);
  const workerFile = files.find(name => /^StudioSimulationWorkerV2-.*\.js$/.test(name))!;
  const artifactFile = files.find(name => /^artifact\.mjs-.*\.txt$/.test(name)
    && createHash("sha256").update(readFileSync(`${assets}/${name}`)).digest("hex") === lock.artifactSha256)!;
  expect(workerFile).toBeTruthy(); expect(artifactFile).toBeTruthy();
  await page.goto("/ja");
  const report = await page.evaluate(async ({ bundle, lock, workerFile, artifactFile }) => {
    const workerUrl = new URL(`/assets/${workerFile}`, location.href).href;
    const ticket = { schemaId: "circleheart-studio-model-worker-release-ticket-v2", modelId: bundle.manifest.modelId,
      artifactRevisionId: lock.artifactRevisionId, manifest: bundle.manifest, surfaceRelease: bundle.surface,
      moduleAbi: "circleheart-exact-model-esm-v1", artifactUrl: new URL(`/assets/${artifactFile}`, location.href).href };
    const outputs = ["hemodynamics.pressure.absolute.Ao", "hemodynamics.pressure.absolute.LV", "hemodynamics.flow.valve.AoV"];
    const make = () => {
      const worker = new Worker(workerUrl, { type: "module" });
      let sequence = 0;
      const pending = new Map<number, { resolve: (r: any) => void; reject: (e: Error) => void }>();
      worker.onmessage = ({ data }) => {
        const waiter = pending.get(data.requestId); if (!waiter) return;
        pending.delete(data.requestId);
        if (data.status !== "ok") waiter.reject(new Error(data.message)); else waiter.resolve(data);
      };
      worker.onerror = event => { for (const p of pending.values()) p.reject(new Error(event.message)); pending.clear(); };
      return { stop: () => worker.terminate(), send: (payload: any): Promise<any> => new Promise((resolve, reject) => {
        const requestId = ++sequence; pending.set(requestId, { resolve, reject });
        worker.postMessage({ protocol: "circleheart-studio-simulation-worker-protocol-v2", requestId, ...payload });
      }) };
    };
    const canonical = (x: any): string => JSON.stringify(x, (_key, value) =>
      ArrayBuffer.isView(value) ? Array.from(value as unknown as ArrayLike<number>) : value);
    const rows = [];
    for (const preset of [bundle.baseline, ...bundle.presets]) {
      const original = make(), restored = make();
      const identity = { runtimeSessionId: "worker-proof", scenarioId: "case" };
      const initialize = (capture: any) => ({ kind: "initialize", ...identity, expectedModelId: ticket.modelId,
        scenarioLabel: preset.title, releaseTicket: ticket, ...capture });
      const advance = { kind: "advance-presentation", ...identity, stepCount: 16, presentationOutputIds: outputs };
      const capture = (worker: ReturnType<typeof make>, frame: any) => worker.send({ kind: "read-scenarios",
        runtimeSessionId: identity.runtimeSessionId, expectedActiveScenarioId: identity.scenarioId,
        expectedInputEpoch: frame.inputEpoch, expectedAcceptedRevision: frame.acceptedRevision,
        expectedAcceptedTimeSec: frame.acceptedTimeSec });
      const digest = async (value: unknown) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",
        new TextEncoder().encode(canonical(value))))).map(b => b.toString(16).padStart(2, "0")).join("");
      try {
        let frame = (await original.send(initialize(preset.capture))).frame;
        for (const value of [6000, 4200]) {
          frame = (await original.send({ kind: "apply-control", ...identity, controlId: "hemodynamics.total-blood-volume-ml",
            value, expectedInputEpoch: frame.inputEpoch })).frame;
          for (let n = 0; n < 20; n++) frame = (await original.send(advance)).batch.terminalFrame;
        }
        const saved = (await capture(original, frame)).captures.scenarios[0].capture;
        await restored.send(initialize(saved));
        let lastRestored: any, batchCount = 0;
        for (let n = 0; n < 40; n++) {
          const a = (await original.send(advance)).batch, b = (await restored.send(advance)).batch;
          // inputEpoch is session-local correlation, not numerical checkpoint state.
          const normalized = ({ workerAdvanceMs: _advance, workerPrepareMs: _prepare, ...batch }: any) => ({ ...batch,
            terminalFrame: { ...batch.terminalFrame, inputEpoch: 0 } });
          if (canonical(normalized(a)) !== canonical(normalized(b))) throw new Error(`${preset.presetId}: restored batch ${n} diverged`);
          frame = a.terminalFrame; lastRestored = b.terminalFrame; batchCount++;
        }
        const a = (await capture(original, frame)).captures.scenarios[0].capture;
        const b = (await capture(restored, lastRestored)).captures.scenarios[0].capture;
        if (canonical(a) !== canonical(b)) throw new Error(`${preset.presetId}: terminal capture diverged`);
        rows.push({ presetId: preset.presetId, warmTbvMl: [6000, 4200], comparedBatches: batchCount,
          comparedSteps: batchCount * 16, terminalCaptureSha256: await digest(a), status: "passed" });
      } finally { original.stop(); restored.stop(); }
    }
    return { modelId: ticket.modelId, artifactRevisionId: ticket.artifactRevisionId, cases: rows };
  }, { bundle, lock, workerFile, artifactFile });
  expect(report.cases).toHaveLength(4);
  const reportPath = testInfo.outputPath("compiled-worker-continuation.json");
  writeFileSync(reportPath, JSON.stringify({ ...report, workerFile, artifactFile,
    workerSha256: createHash("sha256").update(readFileSync(`${assets}/${workerFile}`)).digest("hex"),
    artifactSha256: lock.artifactSha256, project: testInfo.project.name }, null, 2) + "\n");
  await testInfo.attach("compiled-worker-continuation.json", { path: reportPath, contentType: "application/json" });
});
