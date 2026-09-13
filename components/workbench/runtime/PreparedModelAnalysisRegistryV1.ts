/// <reference types="vite/client" />
import { sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import type { ScenarioCaptureV2 } from "@/studio/contracts/v2/content";
import type { StudioModelWorkerReleaseTicketV2 } from "@/studio/contracts/v2/release";
import { readPreparedScenarioAnalysisV1 } from "../presentation/PreparedModelAnalysisV1";
import { resolveRegisteredAnalysisMethodsV1 as methods } from "@/analysis/registry/RegisteredAnalysisMethodsV1";
import type { StudioJsonObjectV2 } from "@/studio/contracts/v2/json";

// Lazy, content-addressed assets. Neither unrelated presets' sweeps nor their
// numerical histories enter the initial JS bundle. Missing/incompatible assets
// are optional acceleration, never a reason to stop the simulation.
const assets = import.meta.glob("/data/model-analysis/prepared/*/*/*.json", { import: "default", query: "?url" });
export async function loadPreparedModelAnalysisV1(ticket: StudioModelWorkerReleaseTicketV2, capture: ScenarioCaptureV2) {
  const pva = methods(ticket.surfaceRelease).periodicPvaDerivation;
  if (!pva?.sourceAnalysisId) return null;
  // Incompatible Surfaces do not download a different method's data at all.
  const prefix = `/data/model-analysis/prepared/${pva.sourceAnalysisId}/${pva.methodId}/`;
  if (!Object.keys(assets).some(path => path.startsWith(prefix))) return null;
  const load = assets[`${prefix}${await hash(capture)}.json`];
  if (!load) return null;
  try {
    const url = await load();
    if (typeof url !== "string") return null;
    const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    if (!response.ok) return null;
    return await readPreparedScenarioAnalysisV1(await response.json(), { modelId: ticket.modelId,
      artifactRevisionId: ticket.artifactRevisionId, surface: ticket.surfaceRelease, capture });
  }
  catch { return null; }
}

/** Shared by full Workbench and Article Reader; provenance stays with the
 * derived result while the lane remaps only its ephemeral Scenario identity. */
export async function loadPreparedScenarioAnalysisV1(
  ticket: StudioModelWorkerReleaseTicketV2,
  capture: ScenarioCaptureV2,
) {
  const saved = await loadPreparedModelAnalysisV1(ticket, capture);
  return saved === null ? null : {
    ...saved.analysis,
    payload: {
      ...saved.analysis.payload as StudioJsonObjectV2,
      preparedOrigin: {
        recordSha256: saved.recordSha256,
        captureSha256: saved.captureSha256,
        preparationSourceSha256: saved.preparationSourceSha256,
        use: "registered-initial-state-analysis",
      },
    },
  };
}
