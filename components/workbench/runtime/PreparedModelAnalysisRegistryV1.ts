/// <reference types="vite/client" />
import { sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import type { ScenarioCaptureV2 } from "@/studio/contracts/v2/content";
import type { StudioModelWorkerReleaseTicketV2 } from "@/studio/contracts/v2/release";
import { readPreparedModelAnalysisV1 } from "../presentation/PreparedModelAnalysisV1";
import { resolveRegisteredAnalysisMethodsV1 as methods } from "@/analysis/registry/RegisteredAnalysisMethodsV1";

// Lazy, content-addressed assets. Neither unrelated presets' sweeps nor their
// numerical histories enter the initial JS bundle. Missing/incompatible assets
// are optional acceleration, never a reason to stop the simulation.
const assets = import.meta.glob("/data/model-analysis/prepared/*/*/*.json", { import: "default", query: "?url" });
export async function loadPreparedModelAnalysisV1(ticket: StudioModelWorkerReleaseTicketV2, capture: ScenarioCaptureV2) {
  const pva = methods(ticket.surfaceRelease).periodicPvaDerivation;
  if (!pva?.sourceAnalysisId) return null;
  // Incompatible Surfaces do not download a different method's data at all.
  const load = assets[`/data/model-analysis/prepared/${pva.sourceAnalysisId}/${pva.methodId}/${await hash(capture)}.json`];
  if (!load) return null;
  try {
    const url = await load();
    if (typeof url !== "string") return null;
    const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    if (!response.ok) return null;
    return await readPreparedModelAnalysisV1(await response.json(), { modelId: ticket.modelId,
      artifactRevisionId: ticket.artifactRevisionId, surface: ticket.surfaceRelease, capture });
  }
  catch { return null; }
}
