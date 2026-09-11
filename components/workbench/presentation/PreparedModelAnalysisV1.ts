import { sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import type { ScenarioCaptureV2 } from "@/studio/contracts/v2/content";
import type { ModelSurfaceReleaseManifestV1 } from "@/studio/contracts/v2/modelSurface";
import { validateStudioSimulationAnalysisV2, type StudioSimulationAnalysisV2 } from "@/studio/contracts/v2/simulation";
import { resolveRegisteredAnalysisMethodsV1 as methods } from "@/analysis/registry/RegisteredAnalysisMethodsV1";
import { structuralReturnOrientationFromPayloadV3 as decode } from "@/components/workbench/presentation/GuytonStarlingOrientationCanvasV3";

/** Workbench boundary: the same decoder and pinned derivation as the display. Completion is an
 * integration check, not another healthy/disease physiology threshold. */
export function assessPreparedModelAnalysisV1(surface: ModelSurfaceReleaseManifestV1, analysis: StudioSimulationAnalysisV2) {
  const pva = methods(surface).periodicPvaDerivation;
  if (!pva || pva.sourceAnalysisId !== analysis.analysisId) throw new Error("Prepared analysis is not pinned by this Surface");
  const sides = (["left", "right"] as const).map(side => {
    const orientation = decode(analysis.payload, side);
    const locus = orientation?.starlingLocus;
    if (!orientation || !locus || locus.status !== "measured-fixed-tbv-protocol"
      || locus.completedPointCount !== locus.totalPointCount || locus.points.length < 3
      || !locus.points.every(point => point.settled && point.curveEligible))
      throw new Error(`Prepared ${side} Starling/TBV family is incomplete`);
    const result = pva.build(locus, side === "left" ? "LV" : "RV");
    if (result.status !== "available" || result.completionStatus !== "complete"
      || result.loadRelations?.systolic?.completionStatus !== "complete"
      || result.loadRelations?.diastolic?.completionStatus !== "complete")
      throw new Error(`Prepared ${side} ESPVR/EDPVR/PVA is incomplete: ${result.status === "available" ? "partial load relations or energy" : result.reason}`);
    return { side, settledPoints: locus.completedPointCount, protocolId: locus.protocolId,
      pvaMethodId: pva.methodId, status: "complete" as const };
  });
  return { analysisId: analysis.analysisId, pvaMethodId: pva.methodId, sides };
}

export type PreparedModelAnalysisV1 = Readonly<{
  schemaId: "prepared-model-analysis-v1";
  modelId: string;
  artifactRevisionId: string;
  captureSha256: string;
  preparationSourceSha256: string;
  assessment: ReturnType<typeof assessPreparedModelAnalysisV1>;
  analysis: StudioSimulationAnalysisV2;
  recordSha256: string;
}>;

export async function buildPreparedModelAnalysisV1(input: {
  modelId: string; artifactRevisionId: string; capture: ScenarioCaptureV2;
  surface: ModelSurfaceReleaseManifestV1; analysis: StudioSimulationAnalysisV2; preparationSourceSha256: string;
}): Promise<PreparedModelAnalysisV1> {
  const analysis = validateStudioSimulationAnalysisV2(input.analysis);
  const checkpoint = input.capture.checkpoint;
  if (!checkpoint || analysis.modelId !== input.modelId || analysis.inputEpoch !== 0
    || analysis.sourceAcceptedRevision !== checkpoint.acceptedRevision
    || analysis.sourceAcceptedTimeSec !== checkpoint.acceptedTimeSec)
    throw new Error("Prepared analysis source differs from the launch capture");
  const body = { schemaId: "prepared-model-analysis-v1" as const, modelId: input.modelId,
    artifactRevisionId: input.artifactRevisionId, captureSha256: await hash(input.capture),
    preparationSourceSha256: input.preparationSourceSha256,
    assessment: assessPreparedModelAnalysisV1(input.surface, analysis), analysis };
  return { ...body, recordSha256: await hash(body) };
}

/** Exact launch capture match, not just preset name or parameter proximity.
 * Analysis method pins, not Surface labels/layout, determine reusability. */
export async function readPreparedModelAnalysisV1(value: unknown, expected: {
  modelId: string; artifactRevisionId: string; capture: ScenarioCaptureV2; surface: ModelSurfaceReleaseManifestV1;
}): Promise<PreparedModelAnalysisV1> {
  const record = value as PreparedModelAnalysisV1;
  if (!record || record.schemaId !== "prepared-model-analysis-v1") throw new Error("Unknown prepared analysis format");
  const { recordSha256, ...body } = record;
  if (recordSha256 !== await hash(body) || record.modelId !== expected.modelId
    || record.artifactRevisionId !== expected.artifactRevisionId
    || record.captureSha256 !== await hash(expected.capture)) throw new Error("Prepared analysis binding differs");
  const rebuilt = await buildPreparedModelAnalysisV1({ ...expected, analysis: record.analysis,
    preparationSourceSha256: record.preparationSourceSha256 });
  if (rebuilt.recordSha256 !== recordSha256) throw new Error("Prepared analysis assessment/method pins differ");
  return rebuilt;
}
