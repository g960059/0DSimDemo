import { afterEach, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import * as integrity from "@/engine/integrity";
import { loadPreparedModelAnalysisV1 as load } from "@/components/workbench/runtime/PreparedModelAnalysisRegistryV1";
import type { StudioModelWorkerReleaseTicketV2 } from "@/studio/contracts/v2/release";
import surface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV4";
import oldSurface from "@/studio/integrations/mainWireIntegratedV3/MainWireIntegratedStudioStaticCaseSurfaceV2";
import { buildPreparedModelAnalysisV1 as build, readPreparedModelAnalysisV1 as read,
  assessPreparedModelAnalysisV1 as assess } from "@/components/workbench/presentation/PreparedModelAnalysisV1";
import * as decoder from "@/components/workbench/presentation/GuytonStarlingOrientationCanvasV3";
import * as registry from "@/analysis/registry/RegisteredAnalysisMethodsV1";
import * as pva from "@/analysis/methods/mainWire/MainWirePeriodicPvaV1";
import high from "@/data/model-presets/standard73/as-high-gradient-v1.json";
import { validateScenarioPresetV2 } from "@/studio/application/authoring/StudioExperimentDataV2";
import { prepareMainWireSurfaceAnalysisV1 as prepare, PreparedSurfaceAnalysisErrorV1 } from "@/tools/registry/PrepareMainWireSurfaceAnalysisV1";
import { CURRENT_MODEL_PRESETS_V1 } from "@/data/model-releases/CurrentModelReleaseV1";
import lock from "@/data/model-releases/standard73/publication.json";
import { REGISTERED_ANALYSIS_EXECUTOR_V1 as executor } from "@/analysis/runtime/RegisteredAnalysisExecutorV1";
import type { StudioSimulationAnalysisV2 } from "@/studio/contracts/v2/simulation";
vi.mock("@/analysis/runtime/RegisteredAnalysisExecutorV1", () => ({ REGISTERED_ANALYSIS_EXECUTOR_V1: { execute: vi.fn() } }));

const capture = validateScenarioPresetV2(high).capture;
const analysis: StudioSimulationAnalysisV2 = { modelId: high.modelId, runtimeSessionId: "offline", scenarioId: "case", inputEpoch: 0,
  sourceAcceptedRevision: capture.checkpoint!.acceptedRevision, sourceAcceptedTimeSec: capture.checkpoint!.acceptedTimeSec,
  analysisId: registry.resolveRegisteredAnalysisMethodsV1(surface).periodicPvaDerivation!.sourceAnalysisId!, payload: { status: "available" } };
const expected = { modelId: high.modelId, artifactRevisionId: "a".repeat(64), capture, surface };
afterEach(() => vi.restoreAllMocks());
function complete() {
  const locus = { status: "measured-fixed-tbv-protocol", completedPointCount: 3, totalPointCount: 3, protocolId: "protocol",
    points: Array.from({ length: 3 }, () => ({ settled: true, curveEligible: true })) };
  vi.spyOn(decoder, "structuralReturnOrientationFromPayloadV3").mockImplementation((_payload, side) => ({ side, starlingLocus: locus }) as never);
  const original = registry.resolveRegisteredAnalysisMethodsV1;
  vi.spyOn(registry, "resolveRegisteredAnalysisMethodsV1").mockImplementation(s => {
    const methods = original(s);
    return { ...methods, periodicPvaDerivation: { ...methods.periodicPvaDerivation!, build: pva.buildMainWirePeriodicPvaMethodV15 } };
  });
  return vi.spyOn(pva, "buildMainWirePeriodicPvaMethodV15").mockReturnValue({ status: "available", completionStatus: "complete",
    loadRelations: { systolic: { completionStatus: "complete" }, diastolic: { completionStatus: "complete" } } } as never);
}

it("does not hash a large capture when the pinned method has no launch assets", async () => {
  const digest = vi.spyOn(integrity, "sha256CanonicalJsonHex");
  expect(await load({ surfaceRelease: oldSurface } as StudioModelWorkerReleaseTicketV2, capture)).toBeNull();
  expect(digest).not.toHaveBeenCalled();
});

it("accepts identical captures and method pins across presentation-only Surface changes", async () => {
  complete();
  const saved = await build({ ...expected, analysis, preparationSourceSha256: "b".repeat(64) });
  const returned = await read(saved, { ...expected, surface: { ...surface, surfaceReleaseId: "new-layout-only" } });
  expect(returned).toEqual(saved);
  expect(returned.assessment.sides.map(s => s.status)).toEqual(["complete", "complete"]);
});

it("rejects changed artifact, fixture, checkpoint, method, digest and recomputed false assessments", async () => {
  complete();
  const saved = await build({ ...expected, analysis, preparationSourceSha256: "b".repeat(64) });
  for (const input of [{ ...expected, artifactRevisionId: "changed" }, { ...expected, capture: { ...capture, fixture: {} } },
    { ...expected, capture: { ...capture, checkpoint: { ...capture.checkpoint!, acceptedRevision: 1 } } }, { ...expected, surface: oldSurface }])
    await expect(read(saved, input)).rejects.toThrow();
  await expect(read({ ...saved, preparationSourceSha256: "tampered" }, expected)).rejects.toThrow(/binding/);
  const { recordSha256: _digest, ...body } = saved;
  const altered = { ...body, assessment: { ...body.assessment, sides: [] } };
  await expect(read({ ...altered, recordSha256: await hash(altered) }, expected)).rejects.toThrow(/assessment/);
});

it.each(["missing-curve", "progressive-energy", "unavailable-energy"])("holds incomplete final Surface analysis: %s", state => {
  const derive = complete();
  if (state === "missing-curve") derive.mockReturnValue({ status: "available", completionStatus: "complete" } as never);
  if (state === "progressive-energy") derive.mockReturnValue({ status: "available", completionStatus: "progressive" } as never);
  if (state === "unavailable-energy") derive.mockReturnValue({ status: "unavailable" } as never);
  expect(() => assess(surface, analysis)).toThrow(/ESPVR\/EDPVR\/PVA/);
});

it("executes through the Surface registry and retains the actual source clocks", async () => {
  complete();
  const execute = vi.mocked(executor.execute).mockResolvedValue(analysis);
  const result = await prepare({ ...expected, preset: validateScenarioPresetV2(high), preparationSourceSha256: "b".repeat(64) });
  expect(execute).toHaveBeenCalledOnce();
  const input = execute.mock.calls[0]![0];
  expect(input.source.surfaceRelease).toBe(surface);
  expect(input.request.analysisId).toBe(analysis.analysisId);
  expect(await input.source.capture!()).toEqual({ artifactRevisionId: expected.artifactRevisionId, scenario: capture });
  expect(result.analysis.sourceAcceptedTimeSec).toBe(capture.checkpoint!.acceptedTimeSec);
});

it("retains the expensive measured payload when final derivation fails", async () => {
  complete().mockReturnValue({ status: "unavailable", reason: "intersection rejected" } as never);
  vi.mocked(executor.execute).mockResolvedValue(analysis);
  const failure = await prepare({ ...expected, preset: validateScenarioPresetV2(high), preparationSourceSha256: "b".repeat(64) }).catch(e => e);
  expect(failure).toBeInstanceOf(PreparedSurfaceAnalysisErrorV1);
  expect(failure.analysis).toBe(analysis);
  expect(failure.message).toContain("intersection rejected");
});

it.each(CURRENT_MODEL_PRESETS_V1)(
  "reconstructs both complete PV/Starling/PVA results from the registered launch asset: $title", async preset => {
    // No mocks/ODE: actual payload decoder, derived method, digest and capture.
    const pin = registry.resolveRegisteredAnalysisMethodsV1(surface).periodicPvaDerivation!;
    const path = `data/model-analysis/prepared/${pin.sourceAnalysisId}/${pin.methodId}/${await hash(preset.capture)}.json`;
    const record = JSON.parse(await readFile(path, "utf8"));
    const result = await read(record, { modelId: lock.modelId, artifactRevisionId: lock.artifactRevisionId, surface, capture: preset.capture });
    expect(result.assessment.sides.map(s => s.status)).toEqual(["complete", "complete"]);
    expect(result.assessment.sides.every(s => s.settledPoints >= 5)).toBe(true);
  });
