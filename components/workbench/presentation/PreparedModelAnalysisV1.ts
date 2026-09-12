import { sha256CanonicalJsonHex as hash } from "@/engine/integrity";
import type { ScenarioCaptureV2 } from "@/studio/contracts/v2/content";
import type { ModelSurfaceReleaseManifestV1 } from "@/studio/contracts/v2/modelSurface";
import { validateStudioSimulationAnalysisV2, type StudioSimulationAnalysisV2 } from "@/studio/contracts/v2/simulation";
import { resolveRegisteredAnalysisMethodsV1 as methods } from "@/analysis/registry/RegisteredAnalysisMethodsV1";
import { structuralReturnOrientationFromPayloadV3 as decode } from "@/components/workbench/presentation/GuytonStarlingOrientationCanvasV3";

export type ModelAnalysisSideAssessmentV1 = Readonly<{
  side: "left" | "right";
  status: "complete" | "incomplete";
  settledPoints: number;
  completedPointCount: number;
  totalPointCount: number;
  protocolId: string | null;
  pvaMethodId: string;
  measurementStatus: "complete" | "incomplete";
  systolicLoadStatus: "complete" | "progressive" | "unavailable";
  diastolicLoadStatus: "complete" | "progressive" | "unavailable";
  pvaStatus: "complete" | "progressive" | "collecting" | "unavailable" | "not-evaluated";
  reason: string | null;
}>;

/** Workbench boundary: use the display's decoder and pinned derivation. Measured load
 * curves may be complete while PE/PVA rejects its extrapolation. These are separate
 * diagnostics, not additional healthy/disease physiology thresholds. */
export function inspectModelAnalysisV1(surface: ModelSurfaceReleaseManifestV1, analysis: StudioSimulationAnalysisV2) {
  const pva = methods(surface).periodicPvaDerivation;
  if (!pva || pva.sourceAnalysisId !== analysis.analysisId) throw new Error("Prepared analysis is not pinned by this Surface");
  const sides = (["left", "right"] as const).map((side): ModelAnalysisSideAssessmentV1 => {
    const orientation = decode(analysis.payload, side);
    const locus = orientation?.starlingLocus;
    const measured = locus?.status === "measured-fixed-tbv-protocol" ? locus : null;
    const base = { side, settledPoints: measured?.points.filter(point => point.settled && point.curveEligible).length ?? 0,
      completedPointCount: measured?.completedPointCount ?? 0, totalPointCount: measured?.totalPointCount ?? 0,
      protocolId: measured?.protocolId ?? null, pvaMethodId: pva.methodId };
    if (!measured || measured.completedPointCount !== measured.totalPointCount || measured.points.length < 3
      || !measured.points.every(point => point.settled && point.curveEligible))
      return { ...base, status: "incomplete", measurementStatus: "incomplete", systolicLoadStatus: "unavailable",
        diastolicLoadStatus: "unavailable", pvaStatus: "not-evaluated", reason: `Prepared ${side} Starling/TBV family is incomplete` };
    try {
      const result = pva.build(measured, side === "left" ? "LV" : "RV");
      const systolicLoadStatus = result.loadRelations?.systolic?.completionStatus ?? "unavailable";
      const diastolicLoadStatus = result.loadRelations?.diastolic?.completionStatus ?? "unavailable";
      const pvaStatus = result.status === "available" ? result.completionStatus : result.status;
      const complete = pvaStatus === "complete" && systolicLoadStatus === "complete" && diastolicLoadStatus === "complete";
      return { ...base, status: complete ? "complete" : "incomplete", measurementStatus: "complete",
        systolicLoadStatus, diastolicLoadStatus, pvaStatus,
        reason: complete ? null : `Prepared ${side} ESPVR/EDPVR/PVA is incomplete: ${result.status === "available" ? "partial load relations or energy" : result.reason}` };
    } catch (error) {
      return { ...base, status: "incomplete", measurementStatus: "complete", systolicLoadStatus: "unavailable",
        diastolicLoadStatus: "unavailable", pvaStatus: "unavailable", reason: error instanceof Error ? error.message : String(error) };
    }
  });
  return { analysisId: analysis.analysisId, pvaMethodId: pva.methodId, sides };
}

/** Registry admission remains strict; its durable assessment format is unchanged. */
export function assessPreparedModelAnalysisV1(surface: ModelSurfaceReleaseManifestV1, analysis: StudioSimulationAnalysisV2) {
  const assessment = inspectModelAnalysisV1(surface, analysis);
  const sides = assessment.sides.map(side => {
    if (side.status !== "complete" || side.protocolId === null) throw new Error(side.reason ?? "Prepared analysis is incomplete");
    return { side: side.side, settledPoints: side.settledPoints, protocolId: side.protocolId,
      pvaMethodId: side.pvaMethodId, status: "complete" as const };
  });
  return { analysisId: assessment.analysisId, pvaMethodId: assessment.pvaMethodId, sides };
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
