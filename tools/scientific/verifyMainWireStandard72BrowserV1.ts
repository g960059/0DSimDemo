import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { chromium, webkit } from "@playwright/test";
import { composeStandardModelContractV1 } from "@/studio/contracts/v2/modelSurface";
import { resolveMainWireAnalysisMethodsForSurfaceV1 } from "@/analysis/methods/mainWire/MainWireAnalysisMethodRegistryV1";
import { createCircleHeartExactModelReleaseV1, MAIN_WIRE_STANDARD72_DEFAULT_FIXTURE_V1 as fixture,
  MAIN_WIRE_STANDARD72_SETTLED_CHECKPOINT_V1 as checkpoint } from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72ExactModelV1";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStandard72SurfaceV1";

// Real browser/Worker and checkpoint transport, not a Workbench UI test.
// All URLs are intercepted with trusted local bytes; no server, registry,
// credentials, deployment or external network access is needed.
const { values } = parseArgs({ options: { artifact: { type: "string" }, evidence: { type: "string" }, output: { type: "string" } } });
if (!values.artifact || !values.evidence || !values.output) throw new Error("--artifact MJS --evidence BINDING_JSON --output NEW_JSON");
const artifact = await readFile(resolve(values.artifact));
const evidence = JSON.parse(await readFile(resolve(values.evidence), "utf8"));
const sha256 = createHash("sha256").update(artifact).digest("hex");
if (evidence.status !== "passed" || evidence.artifactSha256 !== sha256) throw new Error("Artifact does not match its passing binding evidence");
const worker = await readFile(resolve("tools/scientific/mainWireStandard72BrowserWorkerV1.mjs"), "utf8");
const release = createCircleHeartExactModelReleaseV1();
const model = composeStandardModelContractV1(release.manifest, surface, resolveMainWireAnalysisMethodsForSurfaceV1(surface).capabilities).contract;
if (evidence.modelId !== model.modelId || evidence.surfaceReleaseId !== surface.surfaceReleaseId
  || evidence.launchCheckpointSha256 !== checkpoint.checkpointSha256) throw new Error("Browser source binding differs from artifact evidence");
const results = [], started = performance.now();
for (const [browserName, launcher] of [["chromium", chromium], ["webkit", webkit]] as const) {
  const browser = await launcher.launch({ headless: true });
  try {
    for (const executionPlan of [false, true]) {
      const context = await browser.newContext({ serviceWorkers: "block" });
      await context.route("**/*", async route => {
        const url = new URL(route.request().url());
        if (url.origin !== "http://127.0.0.1:4188") return route.abort();
        if (url.pathname === "/artifact.mjs") return route.fulfill({ contentType: "text/javascript", body: artifact });
        if (url.pathname === "/worker.mjs") return route.fulfill({ contentType: "text/javascript", body: worker });
        if (url.pathname === "/") return route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Standard72 isolated Worker verification</title>" });
        return route.abort();
      });
      try {
        const page = await context.newPage();
        await page.goto("http://127.0.0.1:4188/");
        const result = await page.evaluate(async configuration => {
          const worker = new Worker("/worker.mjs", { type: "module" });
          const receive = () => new Promise<Record<string, unknown>>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error("Browser Worker verification timed out")), 60_000);
            worker.onerror = e => { clearTimeout(timer); reject(new Error(e.message)); };
            worker.onmessage = ({ data }) => {
              clearTimeout(timer);
              if (data.status === "failed") reject(new Error(data.message)); else resolve(data);
            };
          });
          try {
            const ready = await receive();
            if (ready.status !== "ready") throw new Error("Worker not ready");
            const captureReply = receive();
            worker.postMessage({ command: "begin", configuration });
            const captured = await captureReply;
            if (captured.status !== "captured") throw new Error("Worker did not capture");
            const serialized = JSON.parse(JSON.stringify(captured.content));
            const continuationReply = receive();
            worker.postMessage({ command: "continue", content: serialized });
            return await continuationReply;
          } finally { worker.terminate(); }
        }, { model, fixture, surfaceSeriesId: surface.surfaceSeriesId,
          launchClock: { time: checkpoint.acceptedTimeSec, revision: checkpoint.revision },
          executionPlan, afterControl: executionPlan });
        if (result.status !== "passed") throw new Error("Browser verification did not pass");
        results.push({ browser: browserName, browserVersion: browser.version(), ...result });
        const { finalCompletedBeat: _, ...compact } = results.at(-1)!;
        console.log(JSON.stringify(compact));
      } finally { await context.close(); }
    }
  } finally { await browser.close(); }
}
function numericalDifferences(left: unknown, right: unknown, path = ""): { path: string; absoluteDifference: number | null }[] {
  if (Object.is(left, right)) return [];
  if (left !== null && right !== null && typeof left === "object" && typeof right === "object") {
    const a = left as Record<string, unknown>, b = right as Record<string, unknown>;
    return [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap(key => numericalDifferences(a[key], b[key], `${path}.${key}`));
  }
  return [{ path, absoluteDifference: typeof left === "number" && typeof right === "number" ? Math.abs(left - right) : null }];
}
const crossEngineReadback = [false, true].map(executionPlan => {
  const a = results.find(r => r.browser === "chromium" && r.executionPlan === executionPlan)!;
  const b = results.find(r => r.browser === "webkit" && r.executionPlan === executionPlan)!;
  return { executionPlan, checkpointHashesEqual: a.finalCheckpointSha256 === b.finalCheckpointSha256,
    completedBeatDifferences: numericalDifferences(a.finalCompletedBeat, b.finalCompletedBeat) };
});
const report = { schemaId: "main-wire-standard72-browser-worker-binding-v1", status: "passed", modelId: model.modelId,
  artifactSha256: sha256, artifactRevisionId: evidence.artifactRevisionId, surfaceReleaseId: surface.surfaceReleaseId,
  transport: "actual-module-worker-structured-clone-json-structured-clone", results,
  continuationScope: "within-the-same-browser-engine-and-artifact", crossEngineBitEqualityClaimed: false, crossEngineReadback,
  workbenchUiVerified: false, registryAdmitted: false, published: false, wallTimeMs: performance.now() - started };
await writeFile(values.output, JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
